'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, semaineLivre, peutAccederSemaine } from './data'
import type { StatutAletheia } from './types'

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

// DRAFT → V1_SUBMITTED → FEEDBACK1_READY. Retour 1 généré en arrière-plan (after()).
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
  if (!(await peutAccederSemaine(admin, userId, livreId, semaine))) return { error: 'Cette semaine n\'est pas encore débloquée.' }

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
    retour_1: null,
    retour_1_erreur_at: null,
    statut: 'V1_SUBMITTED' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }
  const { data: saved, error } = existing
    ? await admin.from('aletheia_travaux').update(payload).eq('id', existing.id).select('id').single()
    : await admin.from('aletheia_travaux').insert(payload).select('id').single()
  if (error || !saved) {
    // Course (double-clic / 2 onglets) : la contrainte d'unicité gagne → message clair.
    if ((error as { code?: string } | null)?.code === '23505') return { error: 'Le résumé a déjà été soumis pour cette semaine.' }
    return { error: error?.message ?? 'Erreur' }
  }

  // Retour 1 généré en arrière-plan : l'élève voit « en cours », le polling récupère le résultat.
  const travailId = saved.id as string
  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    await mod.genererRetour1(travailId)
  })

  revalider(livreId, semaine)
  return { success: true }
}

// FEEDBACK1_READY → (VF_SUBMITTED) → FEEDBACK2_READY. Gate souple : pas de vf
// avant le retour 1. Retour 2 généré en arrière-plan (ancré sur le livre entier).
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

  const { error } = await admin.from('aletheia_travaux').update({
    resume_vf: v,
    retour_2: null,
    retour_2_erreur_at: null,
    statut: 'VF_SUBMITTED' as StatutAletheia,
    updated_at: new Date().toISOString(),
  }).eq('id', row.id).eq('statut', 'FEEDBACK1_READY')
  if (error) return { error: error.message }

  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    await mod.genererRetour2(row.id as string)
  })

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

// Capstone : carte d'architecture finale. Disponible UNIQUEMENT quand toutes les
// semaines du livre sont DONE. Génération en arrière-plan (after()).
export async function revelerCapstone(livreId: string) {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()
  const { active } = await contexteAletheia(supabase, userId)
  if (!active || !(await livreAccessible(admin, [active.classe_id], livreId))) return { error: 'Ce livre ne t\'est pas accessible.' }

  // Toutes les semaines du livre doivent être DONE.
  const { data: docs } = await admin
    .from('scriptorium_documents')
    .select('semaine')
    .eq('unite_id', livreId)
    .not('semaine', 'is', null)
  const semaines = [...new Set((docs ?? []).map(d => d.semaine as number))]
  if (semaines.length === 0) return { error: 'Ce livre n\'a pas de semaine.' }

  const { data: faits } = await supabase
    .from('aletheia_travaux')
    .select('semaine_index')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId).eq('statut', 'DONE')
  const doneSet = new Set((faits ?? []).map(t => t.semaine_index as number))
  if (!semaines.every(s => doneSet.has(s))) return { error: 'Termine toutes les semaines avant de révéler la carte.' }

  // Déjà prête → on ne régénère pas. PENDING : on autorise une relance (cas d'une
  // génération morte — process after() interrompu — sinon la carte reste bloquée).
  const { data: existing } = await supabase
    .from('aletheia_capstone')
    .select('statut')
    .eq('eleve_id', userId).eq('scriptorium_livre_id', livreId)
    .maybeSingle()
  if (existing?.statut === 'READY') {
    revalidatePath('/eleve/modules/aletheia')
    return { success: true }
  }

  const { error } = await admin
    .from('aletheia_capstone')
    .upsert({ eleve_id: userId, scriptorium_livre_id: livreId, statut: 'PENDING', contenu: null, erreur_at: null }, { onConflict: 'eleve_id,scriptorium_livre_id' })
  if (error) return { error: error.message }

  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    await mod.genererCapstone(userId, livreId)
  })

  revalidatePath('/eleve/modules/aletheia')
  return { success: true }
}
