'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import { PROMPT_FEEDBACK_V1_DEFAUT, PROMPT_FEEDBACK_VF_DEFAUT, PROMPT_CAPSTONE_DEFAUT } from '@/utils/aletheia-retours'
import { diagnosticEnAttente } from './donnees'
import type { TravailAletheia, DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
}

export async function lirePromptsAletheia(): Promise<{
  prompt_feedback_1: string | null; prompt_feedback_2: string | null; prompt_capstone: string | null
  eval_questions_actif: boolean; deblocage_sequentiel: boolean
}> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin.from('aletheia_params')
    .select('prompt_feedback_1, prompt_feedback_2, prompt_capstone, eval_questions_actif, deblocage_sequentiel')
    .eq('id', 1).maybeSingle()
  return {
    prompt_feedback_1: data?.prompt_feedback_1 ?? null,
    prompt_feedback_2: data?.prompt_feedback_2 ?? null,
    prompt_capstone: data?.prompt_capstone ?? null,
    eval_questions_actif: !!data?.eval_questions_actif,
    deblocage_sequentiel: !!data?.deblocage_sequentiel,
  }
}

// Si le prof enregistre un prompt par défaut inchangé, on stocke null → le code
// continue d'utiliser le défaut (et bénéficie de ses évolutions futures).
const nullSiDefaut = (valeur: string, defaut: string): string | null =>
  valeur.trim() && valeur.trim() !== defaut.trim() ? valeur : null

export async function sauvegarderPromptsAletheia(
  promptFeedback1: string, promptFeedback2: string, promptCapstone: string,
  evalQuestions: boolean, deblocageSequentiel: boolean,
) {
  await verifierProf()
  const p2 = nullSiDefaut(promptFeedback2, PROMPT_FEEDBACK_VF_DEFAUT)
  // Le retour VF reçoit le livre ENTIER : {semaine_courante_N} = limite de
  // divulgation (sans elle, l'aval fuite) ; {livre_entier} = l'ancrage (sans lui,
  // le retour n'a plus le texte). Un prompt personnalisé doit garder les deux.
  if (p2 !== null && !p2.includes('{semaine_courante_N}')) {
    return { error: 'Le prompt du retour final doit garder la variable {semaine_courante_N} (limite de divulgation : le livre entier est envoyé au modèle). Ajoute-la avant d\'enregistrer.' }
  }
  if (p2 !== null && !p2.includes('{livre_entier}')) {
    return { error: 'Le prompt du retour final doit garder la variable {livre_entier} (le texte d\'ancrage). Ajoute-la avant d\'enregistrer.' }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from('aletheia_params')
    .upsert({
      id: 1,
      prompt_feedback_1: nullSiDefaut(promptFeedback1, PROMPT_FEEDBACK_V1_DEFAUT),
      prompt_feedback_2: p2,
      prompt_capstone: nullSiDefaut(promptCapstone, PROMPT_CAPSTONE_DEFAUT),
      eval_questions_actif: evalQuestions,
      deblocage_sequentiel: deblocageSequentiel,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath('/prof/aletheia')
  return { success: true }
}

// ── Diagnostic — batch prof à la demande (SPEC §2) ──────────────────────────
// Le lot est borné par un BUDGET D'APPELS IA (et non un nombre de travaux) : chaque
// travail fait jusqu'à 2 phases × 2 appels = 4 appels, exécutés en série dans un
// after(). diagnostiquerTravail est IDEMPOTENT → recliquer reprend là où ça s'est
// arrêté (jamais de re-diagnostic d'un (élève×semaine) déjà fait).
const BUDGET_APPELS = 16
// La semaine 1 est diagnostiquée AUTO (à la soumission). On l'exclut du batch pour
// éviter une double exécution concurrente, SAUF si l'auto a échoué ou semble mort
// (travail non mis à jour depuis ce délai) → reprise par le batch.
const DELAI_AUTO_MORT_MS = 2 * 60 * 1000

// Lance le diagnostic pour les travaux en attente d'une classe (tous élèves ×
// toutes semaines, rythmes décalés). Renvoie le nombre lancé + le reste éventuel.
export async function lancerDiagnosticClasse(classeId: string): Promise<{ lances?: number; restants?: number; error?: string }> {
  await verifierProf()
  const admin = createAdminClient()

  // Livres (type='livre') assignés à la classe.
  const { data: liens } = await admin.from('scriptorium_unite_classes').select('unite_id').eq('classe_id', classeId)
  const uniteIds = [...new Set((liens ?? []).map(l => l.unite_id as string))]
  if (uniteIds.length === 0) return { lances: 0, restants: 0 }
  const { data: livres } = await admin.from('scriptorium_unites').select('id').eq('type', 'livre').in('id', uniteIds)
  const livreIds = (livres ?? []).map(u => u.id as string)
  if (livreIds.length === 0) return { lances: 0, restants: 0 }

  // Élèves de la classe.
  const inscrits = await inscriptionsClasse(admin, classeId)
  const eleveIds = [...new Set(inscrits.map(i => i.eleve_id))]
  if (eleveIds.length === 0) return { lances: 0, restants: 0 }

  // Travaux rendus (≠ DRAFT, projection étroite) + diagnostics existants.
  const [{ data: travaux }, { data: diags }] = await Promise.all([
    admin.from('aletheia_travaux').select('id, these, these_vf, semaine_index, updated_at').in('eleve_id', eleveIds).in('scriptorium_livre_id', livreIds).neq('statut', 'DRAFT'),
    admin.from('aletheia_diagnostic').select('travail_id, inventaire_v1, inventaire_vf, erreur_at').in('eleve_id', eleveIds).in('scriptorium_livre_id', livreIds),
  ])
  const diagParTravail = new Map<string, DiagnosticTravail>()
  for (const d of (diags ?? []) as unknown as DiagnosticTravail[]) diagParTravail.set(d.travail_id, d)

  const maintenant = Date.now()
  type T = Pick<TravailAletheia, 'id' | 'these' | 'these_vf' | 'semaine_index' | 'updated_at'>
  const enAttente = ((travaux ?? []) as T[]).filter(t => {
    if (!diagnosticEnAttente(t as TravailAletheia, diagParTravail.get(t.id))) return false
    // Semaine 1 = auto. On ne la prend dans le batch que si l'auto a échoué (erreur_at)
    // ou semble mort (job after() interrompu : travail ancien et toujours en attente).
    if (t.semaine_index === 1) {
      const d = diagParTravail.get(t.id)
      if (d?.erreur_at) return true
      return (maintenant - new Date(t.updated_at).getTime()) > DELAI_AUTO_MORT_MS
    }
    return true
  })
  if (enAttente.length === 0) return { lances: 0, restants: 0 }

  // Sélection bornée par le budget d'APPELS IA (chaque phase manquante = 2 appels).
  const lot: string[] = []
  let cout = 0
  for (const t of enAttente) {
    const d = diagParTravail.get(t.id)
    const phases = ((t.these ?? '').trim() && !d?.inventaire_v1 ? 1 : 0) + ((t.these_vf ?? '').trim() && !d?.inventaire_vf ? 1 : 0)
    const appels = phases * 2
    if (lot.length > 0 && cout + appels > BUDGET_APPELS) break
    lot.push(t.id)
    cout += appels
  }
  const restants = Math.max(0, enAttente.length - lot.length)

  after(async () => {
    const mod = await import('@/utils/aletheia-retours')
    // Séquentiel : borne la charge IA et le temps d'exécution.
    for (const travailId of lot) await mod.diagnostiquerTravail(travailId)
  })

  revalidatePath('/prof/aletheia')
  return { lances: lot.length, restants }
}
