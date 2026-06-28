'use server'

import { after } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import {
  PROMPT_FEEDBACK_V1_DEFAUT, PROMPT_FEEDBACK_VF_DEFAUT,
  PROMPT_DIAG_INVENTAIRE_DEFAUT, PROMPT_DIAG_NIVEAU_DEFAUT,
} from '@/utils/aletheia-retours'
import { diagnosticEnAttente } from './donnees'
import type { TravailAletheia, DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'
import { AIDES_V1_DEFAUT, type AidesV1 } from '@/app/eleve/modules/aletheia/aides-v1'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
}

export async function lirePromptsAletheia(): Promise<{
  prompt_feedback_1: string | null; prompt_feedback_2: string | null; prompt_capstone: string | null
  prompt_reference: string | null; prompt_diag_inventaire: string | null; prompt_diag_niveau: string | null
  eval_questions_actif: boolean; deblocage_sequentiel: boolean
  aides: AidesV1
}> {
  await verifierProf()
  const admin = createAdminClient()
  const { data } = await admin.from('aletheia_params')
    .select('prompt_feedback_1, prompt_feedback_2, prompt_capstone, prompt_reference, prompt_diag_inventaire, prompt_diag_niveau, eval_questions_actif, deblocage_sequentiel, aide_these, aide_arguments, aide_accord, aide_questions, aide_vocabulaire')
    .eq('id', 1).maybeSingle()
  return {
    prompt_feedback_1: data?.prompt_feedback_1 ?? null,
    prompt_feedback_2: data?.prompt_feedback_2 ?? null,
    prompt_capstone: data?.prompt_capstone ?? null,
    prompt_reference: data?.prompt_reference ?? null,
    prompt_diag_inventaire: data?.prompt_diag_inventaire ?? null,
    prompt_diag_niveau: data?.prompt_diag_niveau ?? null,
    eval_questions_actif: !!data?.eval_questions_actif,
    deblocage_sequentiel: !!data?.deblocage_sequentiel,
    aides: {
      these: data?.aide_these || AIDES_V1_DEFAUT.these,
      arguments: data?.aide_arguments || AIDES_V1_DEFAUT.arguments,
      accord: data?.aide_accord || AIDES_V1_DEFAUT.accord,
      questions: data?.aide_questions || AIDES_V1_DEFAUT.questions,
      vocabulaire: data?.aide_vocabulaire || AIDES_V1_DEFAUT.vocabulaire,
    },
  }
}

// Si le prof enregistre un prompt par défaut inchangé, on stocke null → le code
// continue d'utiliser le défaut (et bénéficie de ses évolutions futures).
const nullSiDefaut = (valeur: string, defaut: string): string | null =>
  valeur.trim() && valeur.trim() !== defaut.trim() ? valeur : null

export interface PromptsAletheia {
  promptFeedback1: string; promptFeedback2: string
  promptDiagInventaire: string; promptDiagNiveau: string
  evalQuestions: boolean; deblocageSequentiel: boolean
  aides: AidesV1
}

// Bulle vide ou identique au défaut → null (on retombe sur le défaut du code).
const aideOuNull = (valeur: string, defaut: string): string | null =>
  valeur.trim() && valeur.trim() !== defaut.trim() ? valeur : null

export async function sauvegarderPromptsAletheia(p: PromptsAletheia) {
  await verifierProf()
  const p2 = nullSiDefaut(p.promptFeedback2, PROMPT_FEEDBACK_VF_DEFAUT)
  // Le retour VF reçoit le livre ENTIER : {semaine_courante_N} = limite de
  // divulgation (sans elle, l'aval fuite) ; {livre_entier} = l'ancrage (sans lui,
  // le retour n'a plus le texte). Un prompt personnalisé doit garder les deux.
  if (p2 !== null && !p2.includes('{semaine_courante_N}')) {
    return { error: 'Le prompt du retour final doit garder la variable {semaine_courante_N} (limite de divulgation : le livre entier est envoyé au modèle). Ajoute-la avant d\'enregistrer.' }
  }
  if (p2 !== null && !p2.includes('{livre_entier}')) {
    return { error: 'Le prompt du retour final doit garder la variable {livre_entier} (le texte d\'ancrage). Ajoute-la avant d\'enregistrer.' }
  }
  // Variables critiques des prompts de diagnostic (sans elles, l'artefact n'a plus sa source).
  // (Carte + référence : prompts gérés dans Scriptorium › Paramètres, hors de cette action.)
  const pInv = nullSiDefaut(p.promptDiagInventaire, PROMPT_DIAG_INVENTAIRE_DEFAUT)
  if (pInv !== null && !pInv.includes('{texte_semaine}')) {
    return { error: 'Le prompt d\'inventaire du diagnostic doit garder la variable {texte_semaine} (le texte du chapitre).' }
  }
  const pNiv = nullSiDefaut(p.promptDiagNiveau, PROMPT_DIAG_NIVEAU_DEFAUT)
  // Anti-halo : la phase 2 doit recevoir l'inventaire (et JAMAIS la prose).
  if (pNiv !== null && !pNiv.includes('{inventaire}')) {
    return { error: 'Le prompt de niveau du diagnostic doit garder la variable {inventaire} (anti-halo : il juge depuis l\'inventaire, pas la prose).' }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('aletheia_params')
    .upsert({
      id: 1,
      prompt_feedback_1: nullSiDefaut(p.promptFeedback1, PROMPT_FEEDBACK_V1_DEFAUT),
      prompt_feedback_2: p2,
      prompt_diag_inventaire: pInv,
      prompt_diag_niveau: pNiv,
      eval_questions_actif: p.evalQuestions,
      deblocage_sequentiel: p.deblocageSequentiel,
      aide_these: aideOuNull(p.aides.these, AIDES_V1_DEFAUT.these),
      aide_arguments: aideOuNull(p.aides.arguments, AIDES_V1_DEFAUT.arguments),
      aide_accord: aideOuNull(p.aides.accord, AIDES_V1_DEFAUT.accord),
      aide_questions: aideOuNull(p.aides.questions, AIDES_V1_DEFAUT.questions),
      aide_vocabulaire: aideOuNull(p.aides.vocabulaire, AIDES_V1_DEFAUT.vocabulaire),
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

  // Regrouper par semaine : la boucle séquentielle enchaîne alors des appels au même
  // texte de semaine → hits de prompt caching (préfixe identique) sur la phase inventaire.
  enAttente.sort((a, b) => (a.semaine_index ?? 0) - (b.semaine_index ?? 0))

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
