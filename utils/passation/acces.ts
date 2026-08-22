import 'server-only'
// ============================================================================
// C4 · L4 — L'INTERRUPTEUR PROPRE DE LA PASSATION EN CLASSE.
// ----------------------------------------------------------------------------
// « Aucun interrupteur ne s'allume, et si ce lot en veut un propre, il naît à
//   OFF, au même emplacement que les interrupteurs existants —
//   `scriptorium_params` »                                    — piège 6 ; §1.5
//
// ⚠️ POURQUOI UN PROPRE, ET PAS `chaine_actif`. La coupure automatique de
//    facture bascule `chaine_actif` (C4-L5, `utils/chaine/acces.ts`). Si la
//    transcription en dépendait, une facture qui coupe le 12 du mois laisserait
//    une classe entière SANS ÉCRAN, pendant l'heure de cours, sans que personne
//    ne l'ait décidé. Les deux gestes n'ont pas le même contrat de temps : le
//    traitement en lot est « explicitement différé » (§1.1), la transcription
//    doit revenir « en quelques secondes, pendant l'heure de cours » (`02-` §6.D).
//
// ⚠️ ET PAS `exercices_actif` NON PLUS. Les trois interrupteurs du §1.5 sont AU
//    PROFESSEUR — « ils s'ouvrent dans l'ordre que le professeur décide » (§5) —
//    et `exercices_actif` répond à « les élèves peuvent-ils faire des
//    exercices ? ». Celui-ci répond à « le flux de la passation en classe
//    est-il construit et éprouvé ? ». Ce sont deux questions.
//
// Les deux se lisent donc ensemble côté élève, et le plus fermé gagne.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

type Admin = SupabaseClient

export interface EtatDesPortes {
  /** L'interrupteur propre de C4-L4. */
  passationActive: boolean
  /** `exercices_actif` — le premier des trois du §1.5, qui est au professeur. */
  exercicesActifs: boolean
}

export async function lireLesPortes(admin: Admin): Promise<EtatDesPortes> {
  const { data, error } = await admin
    .from('scriptorium_params')
    .select('passation_classe_actif, exercices_actif')
    .limit(1)
    .maybeSingle()
  if (error) {
    // supabase-js NE LÈVE PAS : il rend `{ error }`. Une porte illisible se
    // ferme — jamais l'inverse (leçon C11a).
    console.error(`[passation] portes ILLISIBLES — ${error.code} ${error.message} : `
      + 'les deux sont tenues pour FERMÉES.')
    return { passationActive: false, exercicesActifs: false }
  }
  return {
    passationActive: !!data?.passation_classe_actif,
    exercicesActifs: !!data?.exercices_actif,
  }
}

/** Côté ÉLÈVE : les deux portes, et le plus fermé gagne. */
export async function passationOuverteAEleve(admin: Admin): Promise<boolean> {
  const p = await lireLesPortes(admin)
  return p.passationActive && p.exercicesActifs
}

/**
 * Côté PROFESSEUR : le seul interrupteur du lot.
 *
 * Le professeur ouvre le dépôt, déclenche le lot et corrige AVANT que les
 * élèves n'aient accès à quoi que ce soit — lier son écran à `exercices_actif`
 * l'obligerait à ouvrir les exercices à toute la maison pour corriger une
 * passation de classe.
 */
export async function passationOuverteAuProf(admin: Admin): Promise<boolean> {
  return (await lireLesPortes(admin)).passationActive
}

/** Ouvrir et refermer sont des gestes du professeur ; ceci existe pour la recette. */
export async function poserPassationClasse(admin: Admin, actif: boolean): Promise<void> {
  const { data } = await admin.from('scriptorium_params').select('id').limit(1).maybeSingle()
  if (!data) return
  const { error } = await admin
    .from('scriptorium_params').update({ passation_classe_actif: actif }).eq('id', data.id)
  if (error) {
    console.error(`[passation] interrupteur NON BASCULÉ — ${error.code} ${error.message}`)
  }
}
