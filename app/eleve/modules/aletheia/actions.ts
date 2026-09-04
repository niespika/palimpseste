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
import { rangDeSeance } from '@/utils/aletheia/gabarit-serveur'
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
  /** (E3) Réponse à la question FIXE du gabarit dialogué. Ignorée hors dialogué / porte fermée. */
  champ_fixe?: string
  /** (E5) Rappel d'ouverture : « sans relire, quelle était l'idée de la séance dernière ? ». Ignoré porte fermée / première séance. */
  rappel?: string
  // (E8) « Je ne sais pas » par emplacement : le serveur compose le texte stocké (utils/aletheia/integrite.ts).
  jnsp?: { champ1?: import('@/utils/aletheia/integrite').JeNeSaisPas; champ2?: import('@/utils/aletheia/integrite').JeNeSaisPas }
}

export interface SaisieVf {
  these_vf: string
  arguments_vf: string
  accord_vf: string
  /** (E3) La même, version finale. */
  champ_fixe_vf?: string
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
  let these = (saisie?.these ?? '').trim()
  let args = (saisie?.arguments ?? '').trim()
  const accord = (saisie?.accord ?? '').trim()
  const questions = (saisie?.questions ?? []).map(q => q.trim()).filter(Boolean)
  const vocabulaire = (saisie?.vocabulaire ?? []).map(v => v.trim()).filter(Boolean)
  // (E8, porte ouverte) « Je ne sais pas » recevable aux emplacements 1 et 2 : la ligne de
  // blocage est exigée, elle devient une question ; le texte stocké est composé ici.
  const jnsp = saisie?.jnsp
  if (jnsp?.champ1 || jnsp?.champ2) {
    if (!(await lireLaPorteEtayage(createAdminClient()))) return { error: 'Cette option n’est pas ouverte.' }
    const { texteJeNeSaisPas, questionDeBlocage } = await import('@/utils/aletheia/integrite')
    for (const [cle, j] of [['champ1', jnsp.champ1], ['champ2', jnsp.champ2]] as const) {
      if (!j) continue
      const blocage = (j.blocage ?? '').trim().slice(0, MAX_QUESTION)
      if (!blocage) return { error: cle === 'champ1' ? 'Dis en une ligne ce qui te bloque sur la première question.' : 'Dis en une ligne ce qui te bloque sur la deuxième question.' }
      const propre = { blocage, choix: (j.choix ?? '').trim().slice(0, MAX_TEXTE), pourquoi: (j.pourquoi ?? '').trim().slice(0, MAX_TEXTE), phrase: (j.phrase ?? '').trim().slice(0, MAX_TEXTE) }
      if (cle === 'champ1') these = texteJeNeSaisPas(propre); else args = texteJeNeSaisPas(propre)
      const q = questionDeBlocage(blocage)
      if (q && !questions.includes(q) && questions.length < MAX_QUESTIONS) questions.push(q)
    }
  }

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
  // (E2/E3) Porte `aletheia_etayage_actif` : la FORME d'étayage (décidée par le code
  // depuis les diagnostics antérieurs, axe arguments, hystérésis), le GABARIT de lecture
  // (question fixe du dialogué, clé de la question tournante posée). Porte fermée : aucune
  // de ces clés n'existe dans le payload (comportement d'avant).
  const { exposees: exposeesV1 } = await modeExposition(admin, livreId, active.classe_id)
  const gab = await (await import('@/utils/aletheia/gabarit-serveur')).contexteGabarit(admin, livreId, semaine, exposeesV1)
  const etayage = gab.etayage
  // (E8) Porte ouverte : plus de strike sur un champ court — seulement les trois
  // emplacements sans matière, ou un aveu de non-lecture (§ 8.2). Porte fermée : d'avant.
  const sig = etayage
    ? (await import('@/utils/aletheia/integrite')).signalRendu([these, args, accord], true)
    : detecterRenduVideTexte([these, args, accord]) ?? detecterAveuHeuristique(`${these}\n${args}\n${accord}`)
  const champFixe = (saisie?.champ_fixe ?? '').trim()
  if (etayage && gab.libelles.champFixe && !champFixe) return { error: 'Dis quelle thèse l’auteur préfère, selon toi.' }
  if (champFixe.length > MAX_TEXTE) return { error: 'Un de tes champs est trop long (limite ~8000 caractères).' }
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
    ...(etayage ? { tournante_cle: gab.libelles.tournante.cle } : {}),
    ...(etayage && gab.libelles.champFixe ? { champ_fixe: champFixe } : {}),
    // (E5) Le rappel n'existe qu'à partir de la deuxième séance exposée ; vide toléré.
    ...(etayage && rangDeSeance(exposeesV1, semaine) > 0 ? { rappel: (saisie?.rappel ?? '').trim().slice(0, MAX_TEXTE) || null } : {}),
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
  // (E3) Question FIXE du dialogué, version finale — porte ouverte seulement.
  const gabVf = await (await import('@/utils/aletheia/gabarit-serveur')).contexteGabarit(admin, livreId, semaine, exposees)
  // (E8) Même règle qu'en V1 : porte ouverte, le strike ne frappe plus un champ court.
  const sig = gabVf.etayage
    ? (await import('@/utils/aletheia/integrite')).signalRendu([these, args, accord], true)
    : detecterRenduVideTexte([these, args, accord]) ?? detecterAveuHeuristique(`${these}\n${args}\n${accord}`)
  const champFixeVf = (vf?.champ_fixe_vf ?? '').trim()
  if (gabVf.etayage && gabVf.libelles.champFixe && !champFixeVf) return { error: 'Réécris ta réponse sur la thèse que l’auteur préfère.' }
  if (champFixeVf.length > MAX_TEXTE) return { error: 'Un de tes champs est trop long (limite ~8000 caractères).' }

  // (C1/A3) `.select().maybeSingle()` : un CAS qui matche 0 ligne était un succès
  // silencieux qui planifiait quand même la génération (double coût IA possible).
  const { data: casVf, error } = await admin.from('aletheia_travaux').update({
    these_vf: these,
    arguments_vf: args,
    accord_vf: accord,
    ...(gabVf.etayage && gabVf.libelles.champFixe ? { champ_fixe_vf: champFixeVf } : {}),
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

// (E5) FEEDBACK1_READY : l'élève RÉPOND aux relances AVANT de réécrire. Une réponse par
// relance, stockée sur le travail (`reponses_relances`), injectée dans l'appel VF. Porte
// ouverte seulement ; le statut ne bouge pas. Compare-and-set sur FEEDBACK1_READY.
export async function repondreRelances(livreId: string, semaine: number, reponses: string[]) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  if (!(await lireLaPorteEtayage(admin))) return { error: 'Cette étape n’est pas ouverte.' }
  const { resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' }
  const { exposees } = await modeExposition(admin, livreId, active.classe_id)
  if (!dansExtrait(exposees, semaine)) return { error: 'Cette séance ne fait pas partie de ton parcours.' }

  const { data: row } = await admin
    .from('aletheia_travaux')
    .select('id, statut, retour_v1')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Commence par soumettre ton travail.' }
  if (row.statut !== 'FEEDBACK1_READY') return { error: 'Les réponses aux relances ne sont pas disponibles à cette étape.' }
  const relances = ((row.retour_v1 as { relances?: unknown } | null)?.relances ?? []) as unknown[]
  const textes = (Array.isArray(reponses) ? reponses : []).map(r => (typeof r === 'string' ? r.trim() : ''))
  if (relances.length === 0) return { error: 'Aucune relance à laquelle répondre.' }
  for (let i = 0; i < relances.length; i++) {
    if (!textes[i]) return { error: `Réponds à la relance ${i + 1} avant de passer à la réécriture.` }
    if (textes[i].length > MAX_TEXTE) return { error: 'Une de tes réponses est trop longue (limite ~8000 caractères).' }
  }
  // (E6) On CONSERVE ce que le surlignage a déjà posé sur chaque entrée (surlignage, verdict, essais).
  type Entree = { relance: number; texte?: string; surlignage?: string[]; verdict_code?: string; essais?: number }
  const { data: rowE6 } = await admin.from('aletheia_travaux').select('reponses_relances').eq('id', row.id).maybeSingle()
  const existantes = (Array.isArray(rowE6?.reponses_relances) ? rowE6!.reponses_relances : []) as Entree[]
  const reponses_relances = relances.map((_, i) => ({ ...(existantes.find(e => e.relance === i) ?? {}), relance: i, texte: textes[i] }))
  const { data: cas, error } = await admin.from('aletheia_travaux')
    .update({ reponses_relances, updated_at: new Date().toISOString() })
    .eq('id', row.id).eq('eleve_id', userId).eq('statut', 'FEEDBACK1_READY')
    .select('id').maybeSingle()
  if (error) return { error: error.message }
  if (!cas) return { error: 'Les réponses aux relances ne sont pas disponibles à cette étape.' }
  revalider(livreId, semaine)
  return { success: true }
}

// (E6) FEEDBACK1_READY : l'élève SURLIGNE la phrase qui répond à une relance (formes
// `fenetre` / `demi_section`). Le barème est calculé ICI, jamais dans le navigateur ; la
// pivot n'est rendue qu'une fois méritée (juste) ou au second échec (D14). L'essai est
// journalisé sur `reponses_relances[i]` (surlignage, verdict_code, essais).
export async function verifierSurlignage(livreId: string, semaine: number, relance: number, selection: string[]) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  if (!(await lireLaPorteEtayage(admin))) return { error: 'Cette étape n’est pas ouverte.' }
  const { resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' }
  const { exposees } = await modeExposition(admin, livreId, active.classe_id)
  if (!dansExtrait(exposees, semaine)) return { error: 'Cette séance ne fait pas partie de ton parcours.' }

  const { data: row } = await admin
    .from('aletheia_travaux')
    .select('id, statut, retour_v1, reponses_relances')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row || row.statut !== 'FEEDBACK1_READY') return { error: 'Le surlignage n’est pas disponible à cette étape.' }
  const detail = ((row.retour_v1 as { relances_detail?: { passage?: string | null }[] } | null)?.relances_detail ?? [])
  const passageId = detail[relance]?.passage
  if (!Number.isInteger(relance) || !passageId) return { error: 'Cette relance ne désigne aucun passage.' }
  const ids = (Array.isArray(selection) ? selection : []).filter((x): x is string => typeof x === 'string').slice(0, 40)

  const { jugerSurlignage } = await import('@/utils/aletheia/fenetre-serveur')
  const r = await jugerSurlignage(admin, livreId, semaine, passageId, ids)
  if (!r) return { error: 'Passage introuvable dans le texte de la séance.' }

  type Entree = { relance: number; texte?: string; surlignage?: string[]; verdict_code?: string; essais?: number }
  const existantes = (Array.isArray(row.reponses_relances) ? row.reponses_relances : []) as Entree[]
  const courante = existantes.find(e => e.relance === relance) ?? { relance, texte: '' }
  const essais = (courante.essais ?? 0) + 1
  const maj: Entree = { ...courante, surlignage: ids, verdict_code: r.verdict, essais }
  const nouvelles = [...existantes.filter(e => e.relance !== relance), maj].sort((a, b) => a.relance - b.relance)
  const { error } = await admin.from('aletheia_travaux')
    .update({ reponses_relances: nouvelles, updated_at: new Date().toISOString() })
    .eq('id', row.id).eq('eleve_id', userId).eq('statut', 'FEEDBACK1_READY')
  if (error) return { error: error.message }
  const { ESSAIS_MAX } = await import('@/utils/aletheia/fenetre')
  const merite = r.verdict === 'juste' || essais >= ESSAIS_MAX
  return { success: true, verdict: r.verdict, message: r.message, essais, ...(merite ? { pivot: r.pivot } : {}) }
}

// ── (E7) Le retour final AGI — trois gestes de l'élève à FEEDBACK2_READY ──────────────
// Chaque geste est jugé ICI ; la pivot et l'extrait amont ne partent qu'une fois mérités.
async function travailPourRetourFinal(livreId: string, semaine: number) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  if (!(await lireLaPorteEtayage(admin))) return { error: 'Cette étape n’est pas ouverte.' as const }
  const { resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' as const }
  const { exposees } = await modeExposition(admin, livreId, active.classe_id)
  if (!dansExtrait(exposees, semaine)) return { error: 'Cette séance ne fait pas partie de ton parcours.' as const }
  const { data: row } = await admin
    .from('aletheia_travaux')
    .select('id, statut, retour_vf, retour_vf_agi, comparaison_synthese')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row || row.statut !== 'FEEDBACK2_READY') return { error: 'Ce geste n’est pas disponible à cette étape.' as const }
  return { admin, userId, row }
}

/** Surligner la phrase qui tranche la nuance prioritaire (formes fenetre / demi_section). */
export async function verifierSurlignageNuance(livreId: string, semaine: number, selection: string[]) {
  const r = await travailPourRetourFinal(livreId, semaine)
  if ('error' in r) return { error: r.error }
  const { admin, userId, row } = r
  const nuances = (row.retour_vf as { nuances_detail?: { passage?: string | null }[] } | null)?.nuances_detail ?? []
  const passageId = nuances[0]?.passage
  if (!passageId) return { error: 'Cette nuance ne désigne aucun passage.' }
  const ids = (Array.isArray(selection) ? selection : []).filter((x): x is string => typeof x === 'string').slice(0, 40)
  const { jugerSurlignage } = await import('@/utils/aletheia/fenetre-serveur')
  const j = await jugerSurlignage(admin, livreId, semaine, passageId, ids)
  if (!j) return { error: 'Passage introuvable dans le texte de la séance.' }
  type Gestes = { nuance?: { surlignage: string[]; verdict_code: string; essais: number }; amont?: unknown[] }
  const gestes = ((row.retour_vf_agi as Gestes | null) ?? {})
  const essais = (gestes.nuance?.essais ?? 0) + 1
  const maj: Gestes = { ...gestes, nuance: { surlignage: ids, verdict_code: j.verdict, essais } }
  const { error } = await admin.from('aletheia_travaux').update({ retour_vf_agi: maj, updated_at: new Date().toISOString() })
    .eq('id', row.id).eq('eleve_id', userId).eq('statut', 'FEEDBACK2_READY')
  if (error) return { error: error.message }
  const { ESSAIS_MAX } = await import('@/utils/aletheia/fenetre')
  const merite = j.verdict === 'juste' || essais >= ESSAIS_MAX
  return { success: true, verdict: j.verdict, message: j.message, essais, ...(merite ? { pivot: j.pivot } : {}) }
}

/** Choisir, parmi des libellés, le passage amont qui répond au passage courant (C et au-dessus). */
export async function choisirPassageAmont(livreId: string, semaine: number, index: number, choix: string) {
  const r = await travailPourRetourFinal(livreId, semaine)
  if ('error' in r) return { error: r.error }
  const { admin, userId, row } = r
  const paires = (row.retour_vf as { amont_paires?: { passage_amont: string }[] } | null)?.amont_paires ?? []
  const paire = Number.isInteger(index) ? paires[index] : undefined
  if (!paire || typeof choix !== 'string') return { error: 'Ce lien n’existe pas.' }
  type Gestes = { nuance?: unknown; amont?: { index: number; choix: string; juste: boolean }[] }
  const gestes = ((row.retour_vf_agi as Gestes | null) ?? {})
  if ((gestes.amont ?? []).some(g => g.index === index)) return { error: 'Tu as déjà choisi pour ce lien.' }
  const juste = choix === paire.passage_amont
  const maj: Gestes = { ...gestes, amont: [...(gestes.amont ?? []), { index, choix, juste }] }
  const { error } = await admin.from('aletheia_travaux').update({ retour_vf_agi: maj, updated_at: new Date().toISOString() })
    .eq('id', row.id).eq('eleve_id', userId).eq('statut', 'FEEDBACK2_READY')
  if (error) return { error: error.message }
  const { extraitAmont } = await import('@/utils/aletheia/retour-vf-serveur')
  const amont = await extraitAmont(admin, livreId, paire.passage_amont)
  return { success: true, juste, amont }
}

/** Comparer le surlignage de l'élève sur la synthèse modèle à la couverture jugée (D8). */
export async function comparerSyntheseAction(livreId: string, semaine: number, selection: string[]) {
  const r = await travailPourRetourFinal(livreId, semaine)
  if ('error' in r) return { error: r.error }
  const { admin, userId, row } = r
  const couverture = (row.retour_vf as { synthese_couverture?: { id: string; etat: 'present' | 'partiel' | 'absent' }[] } | null)?.synthese_couverture ?? []
  if (!couverture.length) return { error: 'Cette synthèse n’a pas été jugée.' }
  if (row.comparaison_synthese) return { error: 'Tu as déjà comparé cette synthèse.' }
  const ids = (Array.isArray(selection) ? selection : []).filter((x): x is string => typeof x === 'string').slice(0, 60)
  const { comparerSynthese } = await import('@/utils/aletheia/retour-vf')
  const c = { ...comparerSynthese(couverture, ids), at: new Date().toISOString() }
  const { error } = await admin.from('aletheia_travaux').update({ comparaison_synthese: c, updated_at: new Date().toISOString() })
    .eq('id', row.id).eq('eleve_id', userId).eq('statut', 'FEEDBACK2_READY')
  if (error) return { error: error.message }
  return { success: true, comparaison: c }
}

// ── (Refonte 04/09) L'ouverture d'une séance et la présentation du module ────────────────
/** Pose l'heure de première ouverture (porte ouverte) ; silencieux, idempotent. */
export async function ouvrirSeanceAction(livreId: string, semaine: number) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  if (!(await lireLaPorteEtayage(admin))) return { success: true }
  const { resolue: active } = await resoudreInscriptionLivre(admin, supabase, userId, livreId)
  if (!active) return { error: 'Ce livre ne t\'est pas accessible.' }
  if (!(await semaineLivre(admin, livreId, semaine))) return { error: 'Séance introuvable.' }
  const { ouvrirSeance } = await import('@/utils/aletheia/seance-serveur')
  await ouvrirSeance(admin, userId, livreId, semaine)
  return { success: true }
}

/** La présentation du module a été lue jusqu'au bout : on ne la remontre plus (jusqu'à la version suivante). */
export async function marquerPresentationVueAction() {
  const { userId } = await verifierEleve()
  const admin = createAdminClient()
  const { marquerPresentationVue } = await import('@/utils/aletheia/seance-serveur')
  const r = await marquerPresentationVue(admin, userId)
  if (!r.ok) return { error: r.message ?? 'Erreur' }
  return { success: true }
}
