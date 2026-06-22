'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, semaineLivre, peutAccederSemaine, toutesSemainesDone } from './data'
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
  // Accès : module actif + livre assigné à la classe ACTIVE (inscrite au module) + semaine valide.
  const { active } = await contexteAletheia(supabase, userId)
  if (!active) return { error: 'Ce module ne t\'est pas accessible.' }
  if (!(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }
  if (!(await semaineLivre(admin, livreId, semaine))) return { error: 'Semaine introuvable.' }
  if (!(await peutAccederSemaine(admin, userId, livreId, semaine))) return { error: 'Cette semaine n\'est pas encore débloquée.' }

  const { data: existing } = await supabase
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (existing && existing.statut !== 'DRAFT') return { error: 'Le travail a déjà été soumis pour cette semaine.' }

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
    statut: 'V1_SUBMITTED' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }
  const { data: saved, error } = existing
    ? await admin.from('aletheia_travaux').update(payload).eq('id', existing.id).select('id').single()
    : await admin.from('aletheia_travaux').insert(payload).select('id').single()
  if (error || !saved) {
    // Course (double-clic / 2 onglets) : la contrainte d'unicité gagne → message clair.
    if ((error as { code?: string } | null)?.code === '23505') return { error: 'Le travail a déjà été soumis pour cette semaine.' }
    return { error: error?.message ?? 'Erreur' }
  }

  // Retour V1 généré en arrière-plan : l'élève voit « en cours », le polling récupère le résultat.
  const travailId = saved.id as string
  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    await mod.genererRetourV1(travailId)
  })

  revalider(livreId, semaine)
  return { success: true }
}

// FEEDBACK1_READY → (VF_SUBMITTED) → FEEDBACK2_READY. Gate souple : pas de VF
// avant le retour V1. Retour VF généré en arrière-plan (ancré sur le livre entier).
export async function soumettreVf(livreId: string, semaine: number, vf: SaisieVf) {
  const { supabase, userId } = await verifierEleve()
  const these = (vf?.these_vf ?? '').trim()
  const args = (vf?.arguments_vf ?? '').trim()
  const accord = (vf?.accord_vf ?? '').trim()
  if (!these) return { error: 'Réécris l’idée principale.' }
  if (!args) return { error: 'Réécris les arguments.' }
  if (!accord) return { error: 'Réécris ton accord.' }
  if ([these, args, accord].some(t => t.length > MAX_TEXTE)) return { error: 'Un de tes champs est trop long (limite ~8000 caractères).' }

  const admin = createAdminClient()
  const { active } = await contexteAletheia(supabase, userId)
  if (!active || !(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }

  const { data: row } = await supabase
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Commence par soumettre ton travail.' }
  if (row.statut !== 'FEEDBACK1_READY') return { error: "La version finale n'est pas disponible à cette étape." }

  const { error } = await admin.from('aletheia_travaux').update({
    these_vf: these,
    arguments_vf: args,
    accord_vf: accord,
    retour_vf: null,
    retour_vf_erreur_at: null,
    statut: 'VF_SUBMITTED' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id).eq('statut', 'FEEDBACK1_READY')
  if (error) return { error: error.message }

  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    await mod.genererRetourVf(row.id as string)
  })

  revalider(livreId, semaine)
  return { success: true }
}

// FEEDBACK2_READY → DONE. Gate de validation de lecture (façon Fragments) : la
// semaine ne se clôt pas tant que l'élève n'a pas validé avoir lu le retour VF.
// Si c'était la dernière semaine, on déclenche paresseusement le capstone du livre.
export async function validerLectureRetourVf(livreId: string, semaine: number) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  const { active } = await contexteAletheia(supabase, userId)
  if (!active || !(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }

  const { data: row } = await supabase
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Aucun travail pour cette semaine.' }
  if (row.statut !== 'FEEDBACK2_READY') return { error: "La validation de lecture n'est pas disponible à cette étape." }

  const { error } = await admin.from('aletheia_travaux').update({
    retour_vf_lu_at: new Date().toISOString(),
    statut: 'DONE' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id).eq('statut', 'FEEDBACK2_READY')
  if (error) return { error: error.message }

  // Capstone partagé : déclenché paresseusement quand un élève termine TOUTES ses
  // semaines (le premier crée la carte du livre, mise en cache pour tous + le prof).
  if (await toutesSemainesDone(admin, userId, livreId)) {
    await declencherCapstone(admin, livreId)
  }

  revalider(livreId, semaine)
  return { success: true }
}

// Crée (si besoin) la ligne capstone du livre en PENDING et lance la génération en
// arrière-plan. No-op si déjà READY ou PENDING (génération en cours / déjà faite).
async function declencherCapstone(admin: ReturnType<typeof createAdminClient>, livreId: string): Promise<void> {
  const { data: existing } = await admin
    .from('aletheia_capstone').select('statut').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (existing?.statut === 'READY' || existing?.statut === 'PENDING') return
  const { error } = await admin
    .from('aletheia_capstone')
    .upsert({ scriptorium_livre_id: livreId, statut: 'PENDING', contenu: null, erreur_at: null }, { onConflict: 'scriptorium_livre_id' })
  if (error) { console.error('[aletheia] upsert capstone PENDING :', error); return }
  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    await mod.genererCapstone(livreId)
  })
}

// Carte d'architecture du livre (partagée). L'élève ne peut la (re)déclencher que
// s'il a lui-même tout terminé. READY → no-op ; sinon (re)lance la génération
// (relance utile si le job after() est mort ou si le statut est ERROR).
export async function revelerCapstone(livreId: string) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  const { active } = await contexteAletheia(supabase, userId)
  if (!active || !(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }

  if (!(await toutesSemainesDone(admin, userId, livreId))) {
    return { error: 'Termine toutes les semaines avant de révéler la carte.' }
  }

  const { data: existing } = await admin
    .from('aletheia_capstone').select('statut').eq('scriptorium_livre_id', livreId).maybeSingle()
  if (existing?.statut === 'READY') {
    revalidatePath('/eleve/modules/aletheia')
    return { success: true }
  }

  const { error } = await admin
    .from('aletheia_capstone')
    .upsert({ scriptorium_livre_id: livreId, statut: 'PENDING', contenu: null, erreur_at: null }, { onConflict: 'scriptorium_livre_id' })
  if (error) return { error: error.message }

  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    await mod.genererCapstone(livreId)
  })

  revalidatePath('/eleve/modules/aletheia')
  return { success: true }
}

// Relance d'un retour bloqué : si le job after() est mort (process interrompu, redeploy),
// le travail reste en *_SUBMITTED indéfiniment et le polling tourne sans fin. On autorise
// une relance après un délai de sécurité (> durée normale d'une génération). genererRetourV1/Vf
// sont gardés par compare-and-set, donc relancer est sûr.
export async function relancerRetour(livreId: string, semaine: number) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  const { active } = await contexteAletheia(supabase, userId)
  if (!active || !(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }

  const { data: row } = await supabase
    .from('aletheia_travaux')
    .select('id, statut, updated_at')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Aucun travail pour cette semaine.' }
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
