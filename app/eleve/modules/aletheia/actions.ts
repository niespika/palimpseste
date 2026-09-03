'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { resoudreInscriptionLivre, semaineLivre, peutAccederSemaine } from './data'
import { modeExposition } from '@/utils/aletheia-dates'
import { dansExtrait } from '@/utils/aletheia-extrait'
import { messageSiBloque, signalerStrikeAuto } from '@/utils/integrite'
import { messageSiRetoursNonLus } from '@/utils/retours-lus'
import { detecterRenduVideTexte, detecterAveuHeuristique } from '@/utils/detecteur-integrite'
import { lireLaPorteEtayage } from '@/utils/aletheia/decoupage-serveur'
import type { StatutAletheia } from './types'

// Bornes serveur sur le texte élève (anti-coût : tout est injecté dans le prompt IA ;
// retour VF = + le livre entier). Idée/arguments/accord de chapitres tiennent dedans.
const MAX_TEXTE = 8000
const MAX_QUESTION = 1000
const MAX_QUESTIONS = 10
const MAX_TERME = 200
const MAX_VOCAB = 30
// Délai avant d'autoriser une relance d'un retour bloqué (> durée normale de génération).
const DELAI_RELANCE_MS = 90 * 1000

export interface SaisieV1 {
  these: string
  arguments: string
  accord: string
  questions: string[]
  vocabulaire: string[]
}

export interface SaisieVf {
  these_vf: string
  arguments_vf: string
  accord_vf: string
}

async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

function revalider(livreId: string, semaine: number) {
  revalidatePath('/eleve/modules/aletheia')
  revalidatePath(`/eleve/modules/aletheia/${livreId}/${semaine}`)
}

// ── Transitions ─────────────────────────────────────────────────────────────

// DRAFT → V1_SUBMITTED → FEEDBACK1_READY. Retour V1 généré en arrière-plan (after()).
export async function soumettreV1(livreId: string, semaine: number, saisie: SaisieV1) {
  const { supabase, userId } = await verifierEleve()
  // Blocage « petit malin » : plus aucun rendu tant que le prof n'a pas débloqué.
  const blocage = await messageSiBloque(createAdminClient(), userId)
  if (blocage) return { error: blocage }
  // Lecture des retours (transversal) : pas de rendu tant qu'un retour, dans n'importe
  // quel module, n'est pas lu et validé.
  const gateLecture = await messageSiRetoursNonLus(createAdminClient(), userId)
  if (gateLecture) return { error: gateLecture }
  const these = (saisie?.these ?? '').trim()
  const args = (saisie?.arguments ?? '').trim()
  const accord = (saisie?.accord ?? '').trim()
  const questions = (saisie?.questions ?? []).map(q => q.trim()).filter(Boolean)
  const vocabulaire = (saisie?.vocabulaire ?? []).map(v => v.trim()).filter(Boolean)

  if (!these) return { error: 'Écris l’idée principale du chapitre.' }
  if (!args) return { error: 'Indique les arguments avancés par l’auteur.' }
  if (!accord) return { error: 'Dis si tu es d’accord ou non, et pourquoi.' }
  if (questions.length === 0) return { error: 'Pose au moins une question.' }
  if ([these, args, accord].some(t => t.length > MAX_TEXTE)) return { error: 'Un de tes champs est trop long (limite ~8000 caractères).' }
  if (questions.length > MAX_QUESTIONS) return { error: `Pas plus de ${MAX_QUESTIONS} questions.` }
  if (questions.some(q => q.length > MAX_QUESTION)) return { error: 'Une de tes questions est trop longue.' }
  if (vocabulaire.length > MAX_VOCAB) return { error: `Pas plus de ${MAX_VOCAB} mots de vocabulaire.` }
  if (vocabulaire.some(v => v.length > MAX_TERME)) return { error: 'Un de tes mots de vocabulaire est trop long.' }

  const admin = createAdminClient()
  // Accès : module actif + livre exposé dans une classe active + semaine valide. (B4)
  // Repli bi-classe : on résout la classe qui expose le livre (cookie d'abord), pour
  // que la soumission passe même si le cookie pointe l'autre classe de l'élève.
  const { moduleActif, resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!moduleActif) return { error: 'Ce module ne t\'est pas accessible.' }
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' }
  if (!(await semaineLivre(admin, livreId, semaine))) return { error: 'Séance introuvable.' }
  // peutAccederSemaine intègre la garde d'appartenance à l'extrait (mode C) + le déblocage séquentiel.
  if (!(await peutAccederSemaine(admin, userId, livreId, semaine, active.classe_id))) return { error: 'Cette séance n\'est pas encore débloquée.' }

  // (C1) Lecture via admin + filtre eleve_id : aletheia_travaux fermé côté RLS élève.
  const { data: existing } = await admin
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (existing && existing.statut !== 'DRAFT') return { error: 'Le travail a déjà été soumis pour cette séance.' }

  // Détection « petit malin » SANS IA (rendu quasi vide / aveu), AVANT de planifier
  // quoi que ce soit. Si flagué : on N'APPELLE PAS l'IA (aucun retour généré, aucun
  // coût) et le rendu RESTE en DRAFT — l'élève doit refaire un vrai travail. Il
  // reçoit un strike + un message « cheeky ».
  const sig = detecterRenduVideTexte([these, args, accord]) ?? detecterAveuHeuristique(`${these}\n${args}\n${accord}`)

  // (E2) La FORME d'étayage de cette séance, décidée par le code depuis les diagnostics
  // antérieurs (axe arguments, hystérésis) — porte `aletheia_etayage_actif` ouverte
  // seulement. Porte fermée : la clé n'existe pas dans le payload (comportement d'avant).
  const etayage = await lireLaPorteEtayage(admin)
  const forme = etayage && !sig
    ? (await (await import('@/utils/aletheia/forme-serveur')).deciderFormePourSeance(admin, userId, livreId, semaine)).forme
    : null

  const payload = {
    eleve_id: userId,
    scriptorium_livre_id: livreId,
    semaine_index: semaine,
    these,
    arguments: args,
    accord,
    questions,
    vocabulaire,
    retour_v1: null,
    retour_v1_erreur_at: null,
    statut: (sig ? 'DRAFT' : 'V1_SUBMITTED') as StatutAletheia,
    updated_at: new Date().toISOString(),
    ...(forme ? { forme } : {}),
  }
  // (C1/A3) Chemin update : compare-and-set sur statut='DRAFT' — c'était la seule
  // écriture non-CAS de la machine à états (course double-clic / 2 onglets : double
  // génération IA, voire écrasement d'un FEEDBACK1_READY tout juste posé).
  // `.eq('eleve_id', userId)` = ceinture de propriété sur l'écriture admin.
  const { data: saved, error } = existing
    ? await admin.from('aletheia_travaux').update(payload)
        .eq('id', existing.id).eq('eleve_id', userId).eq('statut', 'DRAFT')
        .select('id').maybeSingle()
    : await admin.from('aletheia_travaux').insert(payload).select('id').single()
  if (error || !saved) {
    // Course (double-clic / 2 onglets) : la contrainte d'unicité gagne → message clair.
    if ((error as { code?: string } | null)?.code === '23505') return { error: 'Le travail a déjà été soumis pour cette séance.' }
    // CAS 0 ligne (chemin update) : la ligne a quitté DRAFT entre la lecture et
    // l'écriture — même course, même message.
    if (existing && !error) return { error: 'Le travail a déjà été soumis pour cette séance.' }
    return { error: error?.message ?? 'Erreur' }
  }
  const travailId = saved.id as string

  // Retour V1 (+ diagnostic sem. 1) généré en arrière-plan UNIQUEMENT si le rendu
  // n'est PAS flagué par le détecteur algo : pas de retour IA pour un rendu bidon.
  if (!sig) {
    after(async () => {
      const mod = await import('@/utils/aletheia-retours')
      await mod.genererRetourV1(travailId)
      // Diagnostic AUTOMATIQUE de la SEMAINE 1 (les suivantes = batch prof) — et, porte
      // `aletheia_etayage_actif` ouverte (E2), de CHAQUE séance : c'est lui qui décide la
      // forme d'étayage de la séance suivante. Froid, indépendant du retour.
      if (semaine === 1 || etayage) await mod.diagnostiquerTravail(travailId)
    })
  }

  const { avertissement } = sig
    ? await signalerStrikeAuto(admin, { eleveId: userId, module: 'aletheia', renduRef: travailId, type: sig.type, motif: sig.motif })
    : { avertissement: null }

  // Avec un avertissement « petit malin », on NE revalide PAS : le composant client
  // garde la carte cheeky affichée (un re-render serveur la remplacerait aussitôt).
  // Le bouton « J'ai compris → » referme la carte côté client (setAvertissement(null))
  // et rend de nouveau le formulaire, texte saisi conservé — l'élève corrige et resoumet
  // (pas de router.refresh() : le rendu reste en DRAFT, un refresh ne changerait rien).
  if (!avertissement) revalider(livreId, semaine)
  return { success: true, avertissement }
}

// FEEDBACK1_READY → (VF_SUBMITTED) → FEEDBACK2_READY. Gate souple : pas de VF
// avant le retour V1. Retour VF généré en arrière-plan (ancré sur le livre entier).
export async function soumettreVf(livreId: string, semaine: number, vf: SaisieVf) {
  const { supabase, userId } = await verifierEleve()
  const blocage = await messageSiBloque(createAdminClient(), userId)
  if (blocage) return { error: blocage }
  // Lecture des retours (transversal) : pas de rendu tant qu'un retour, dans n'importe
  // quel module, n'est pas lu et validé.
  const gateLecture = await messageSiRetoursNonLus(createAdminClient(), userId)
  if (gateLecture) return { error: gateLecture }
  const these = (vf?.these_vf ?? '').trim()
  const args = (vf?.arguments_vf ?? '').trim()
  const accord = (vf?.accord_vf ?? '').trim()
  if (!these) return { error: 'Réécris l’idée principale.' }
  if (!args) return { error: 'Réécris les arguments.' }
  if (!accord) return { error: 'Réécris ton accord.' }
  if ([these, args, accord].some(t => t.length > MAX_TEXTE)) return { error: 'Un de tes champs est trop long (limite ~8000 caractères).' }

  const admin = createAdminClient()
  // (B4) Repli bi-classe : on résout la classe qui expose le livre (cookie d'abord).
  const { resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' }
  // (mode C, F7) Garde d'APPARTENANCE à l'extrait sur l'ÉCRITURE : sans elle, un travail
  // orphelin (séance sortie de l'extrait) pourrait avancer VF→DONE et déclencher un retour
  // IA ancré livre entier = SPOILER. Sous gate OFF, exposees = toutes les séances → jamais bloqué.
  const { exposees } = await modeExposition(admin, livreId, active.classe_id)
  if (!dansExtrait(exposees, semaine)) return { error: 'Cette séance ne fait pas partie de ton parcours.' }

  // (C1) Lecture via admin + filtre eleve_id : aletheia_travaux fermé côté RLS élève.
  const { data: row } = await admin
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Commence par soumettre ton travail.' }
  if (row.statut !== 'FEEDBACK1_READY') return { error: "La version finale n'est pas disponible à cette étape." }

  // Détection « petit malin » sur la VF (ref distincte de la V1 : autre rendu), AVANT
  // de planifier l'IA. Si flagué : pas d'IA (aucun retour final généré) et le rendu
  // RESTE en FEEDBACK1_READY — l'élève doit réécrire pour de vrai. Strike + message.
  const sig = detecterRenduVideTexte([these, args, accord]) ?? detecterAveuHeuristique(`${these}\n${args}\n${accord}`)

  // (C1/A3) `.select().maybeSingle()` : un CAS qui matche 0 ligne était un succès
  // silencieux qui planifiait quand même la génération (double coût IA possible).
  const { data: casVf, error } = await admin.from('aletheia_travaux').update({
    these_vf: these,
    arguments_vf: args,
    accord_vf: accord,
    retour_vf: null,
    retour_vf_erreur_at: null,
    statut: (sig ? 'FEEDBACK1_READY' : 'VF_SUBMITTED') as StatutAletheia,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id).eq('eleve_id', userId).eq('statut', 'FEEDBACK1_READY')
    .select('id').maybeSingle()
  if (error) return { error: error.message }
  if (!casVf) return { error: "La version finale n'est pas disponible à cette étape." }

  const travailId = row.id as string
  // Retour final (+ diagnostic sem. 1) UNIQUEMENT si non flagué par le détecteur algo.
  if (!sig) {
    after(async () => {
      const mod = await import('@/utils/aletheia-retours')
      await mod.genererRetourVf(travailId)
      // Diagnostic AUTOMATIQUE de la SEMAINE 1 (phase VF → delta V1→VF) — et de CHAQUE
      // séance porte `aletheia_etayage_actif` ouverte (E2).
      if (semaine === 1 || await lireLaPorteEtayage(admin)) await mod.diagnostiquerTravail(travailId)
    })
  }

  const { avertissement } = sig
    ? await signalerStrikeAuto(admin, { eleveId: userId, module: 'aletheia', renduRef: `${travailId}:vf`, type: sig.type, motif: sig.motif })
    : { avertissement: null }

  // Cf. soumettreV1 : pas de revalidation tant qu'un avertissement « petit malin »
  // doit être lu (sinon il flashe et la vue bascule en « retour en préparation »). Le
  // bouton « J'ai compris → » referme la carte côté client (setAvertissement(null)) et
  // rend de nouveau le formulaire VF, texte conservé — pas de router.refresh() (le rendu
  // reste en FEEDBACK1_READY, un refresh ne ferait que réafficher la même vue).
  if (!avertissement) revalider(livreId, semaine)
  return { success: true, avertissement }
}

// FEEDBACK2_READY → DONE. Gate de validation de lecture (façon Fragments) : la
// semaine ne se clôt pas tant que l'élève n'a pas validé avoir lu le retour VF.
// (La carte d'architecture est désormais générée par le PROF à la préparation —
// plus aucun déclenchement côté élève ; voir app/prof/scriptorium.)
export async function validerLectureRetourVf(livreId: string, semaine: number) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  // (B4) Repli bi-classe : on résout la classe qui expose le livre (cookie d'abord).
  const { resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' }
  // (mode C, F7) Garde d'appartenance à l'extrait sur la validation de lecture (clôture DONE).
  const { exposees } = await modeExposition(admin, livreId, active.classe_id)
  if (!dansExtrait(exposees, semaine)) return { error: 'Cette séance ne fait pas partie de ton parcours.' }

  // (C1) Lecture via admin + filtre eleve_id : aletheia_travaux fermé côté RLS élève.
  const { data: row } = await admin
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Aucun travail pour cette séance.' }
  if (row.statut !== 'FEEDBACK2_READY') return { error: "La validation de lecture n'est pas disponible à cette étape." }

  // (C1/A3) Ceinture de propriété sur l'écriture admin ; un CAS 0 ligne = déjà
  // validé dans un autre onglet → succès idempotent, rien à re-signaler.
  const { error } = await admin.from('aletheia_travaux').update({
    retour_vf_lu_at: new Date().toISOString(),
    statut: 'DONE' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id).eq('eleve_id', userId).eq('statut', 'FEEDBACK2_READY')
  if (error) return { error: error.message }

  revalider(livreId, semaine)
  return { success: true }
}

// Relance d'un retour bloqué : si le job after() est mort (process interrompu, redeploy),
// le travail reste en *_SUBMITTED indéfiniment et le polling tourne sans fin. On autorise
// une relance après un délai de sécurité (> durée normale d'une génération). genererRetourV1/Vf
// sont gardés par compare-and-set, donc relancer est sûr.
export async function relancerRetour(livreId: string, semaine: number) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  // (B4) Repli bi-classe : on résout la classe qui expose le livre (cookie d'abord).
  const { resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' }
  // (mode C, F7) Garde d'appartenance à l'extrait sur la relance IA (évite de relancer
  // genererRetourVf sur un orphelin → retour ancré livre entier = spoiler).
  const { exposees } = await modeExposition(admin, livreId, active.classe_id)
  if (!dansExtrait(exposees, semaine)) return { error: 'Cette séance ne fait pas partie de ton parcours.' }

  // (C1) Lecture via admin + filtre eleve_id : aletheia_travaux fermé côté RLS élève.
  const { data: row } = await admin
    .from('aletheia_travaux')
    .select('id, statut, updated_at')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Aucun travail pour cette séance.' }
  // Déjà avancé entre-temps (le retour est finalement arrivé) → rien à relancer.
  if (row.statut !== 'V1_SUBMITTED' && row.statut !== 'VF_SUBMITTED') {
    revalider(livreId, semaine)
    return { success: true }
  }
  // Anti-doublon : ne relancer que si l'attente dépasse le délai de sécurité.
  const age = Date.now() - new Date(row.updated_at as string).getTime()
  if (age < DELAI_RELANCE_MS) return { error: 'Le retour est encore en cours de préparation, patiente un instant.' }

  const travailId = row.id as string
  const phase = row.statut
  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    if (phase === 'V1_SUBMITTED') await mod.genererRetourV1(travailId)
    else await mod.genererRetourVf(travailId)
  })

  revalider(livreId, semaine)
  return { success: true }
}
