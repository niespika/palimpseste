'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, semaineLivre } from './data'
import type { Retour1, Retour2, StatutAletheia } from './types'

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

// ── Stubs IA (Lot 2) — placeholders conformes aux schémas §5.1/§5.2. ─────────
// Les vrais prompts (ancrage PDF, retour socratique, dévoilement) arrivent aux
// Lots 3-4 ; ici on exerce toute la machine à états et l'UI.
function stubRetour1(questions: string[]): Retour1 {
  return {
    questions_pour_avancer: [
      "(Démo) Une relance qui t'amènerait à repérer toi-même un point à préciser dans ton résumé apparaîtra ici.",
      "(Démo) Une seconde relance, vers la marche suivante.",
    ],
    reponses_a_tes_questions: questions.length
      ? questions.map(q => `(Démo) Réponse ancrée dans le texte à ta question : « ${q} »`)
      : ['(Démo) Les réponses à tes questions apparaîtront ici.'],
    remarque_questions: '(Démo) Retour 1 stubbé — le vrai retour socratique arrive au Lot 3.',
  }
}

function stubRetour2(): Retour2 {
  return {
    synthese_modele: '(Démo) Synthèse modèle des chapitres de la semaine (≤ ~200 mots) — branchée au Lot 4.',
    nuances_et_erreurs: ['(Démo) Une nuance ou une erreur subsistant dans ta version finale serait pointée ici, sans te corriger frontalement.'],
    ajouts_a_verifier: [],
    architecture_amont: ['(Démo) Lien explicite avec un point déjà vu les semaines précédentes.'],
    architecture_aval_jalons: ['(Démo) Jalon vers un argument à venir — sans en dévoiler le contenu.'],
  }
}

// ── Transitions ─────────────────────────────────────────────────────────────

// DRAFT → (V1_SUBMITTED) → FEEDBACK1_READY. Le stub enchaîne synchroniquement.
export async function soumettreV1(livreId: string, semaine: number, resume: string, questions: string[]) {
  const { supabase, userId } = await verifierEleve()
  const r = (resume ?? '').trim()
  const qs = (questions ?? []).map(q => q.trim()).filter(Boolean)
  if (!r) return { error: 'Écris un résumé avant de soumettre.' }
  if (qs.length === 0) return { error: 'Pose au moins une question.' }

  const admin = createAdminClient()
  // Accès : module actif + livre assigné à la classe ACTIVE (inscrite au module) + semaine valide.
  const { active } = await contexteAletheia(supabase, userId)
  if (!active) return { error: 'Ce module ne t\'est pas accessible.' }
  if (!(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }
  if (!(await semaineLivre(admin, livreId, semaine))) return { error: 'Semaine introuvable.' }

  const { data: existing } = await supabase
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (existing && existing.statut !== 'DRAFT') return { error: 'Le résumé a déjà été soumis pour cette semaine.' }

  const payload = {
    eleve_id: userId,
    scriptorium_livre_id: livreId,
    semaine_index: semaine,
    resume_initial: r,
    questions: qs,
    retour_1: stubRetour1(qs),
    statut: 'FEEDBACK1_READY' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }
  const { error } = existing
    ? await admin.from('aletheia_travaux').update(payload).eq('id', existing.id)
    : await admin.from('aletheia_travaux').insert(payload)
  if (error) {
    // Course (double-clic / 2 onglets) : la contrainte d'unicité gagne → message clair.
    if ((error as { code?: string }).code === '23505') return { error: 'Le résumé a déjà été soumis pour cette semaine.' }
    return { error: error.message }
  }
  revalider(livreId, semaine)
  return { success: true }
}

// FEEDBACK1_READY → (VF_SUBMITTED) → FEEDBACK2_READY. Gate souple : pas de vf
// avant le retour 1.
export async function soumettreVf(livreId: string, semaine: number, vf: string) {
  const { supabase, userId } = await verifierEleve()
  const v = (vf ?? '').trim()
  if (!v) return { error: 'Écris ta version finale avant de soumettre.' }

  const admin = createAdminClient()
  const { active } = await contexteAletheia(supabase, userId)
  if (!active || !(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }

  const { data: row } = await supabase
    .from('aletheia_travaux')
    .select('id, statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('semaine_index', semaine)
    .maybeSingle()
  if (!row) return { error: 'Commence par soumettre ton résumé.' }
  if (row.statut !== 'FEEDBACK1_READY') return { error: "La version finale n'est pas disponible à cette étape." }

  const retour2 = stubRetour2()
  const { error } = await admin.from('aletheia_travaux').update({
    resume_vf: v,
    retour_2: retour2,
    devoilement: { architecture_amont: retour2.architecture_amont, architecture_aval_jalons: retour2.architecture_aval_jalons },
    statut: 'FEEDBACK2_READY' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id)
  if (error) return { error: error.message }
  revalider(livreId, semaine)
  return { success: true }
}

// FEEDBACK2_READY → DONE. Gate de validation de lecture (façon Fragments) : la
// semaine ne se clôt pas tant que l'élève n'a pas validé avoir lu le retour 2.
export async function validerLectureRetour2(livreId: string, semaine: number) {
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
    retour_2_lu_at: new Date().toISOString(),
    statut: 'DONE' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id)
  if (error) return { error: error.message }
  revalider(livreId, semaine)
  return { success: true }
}
