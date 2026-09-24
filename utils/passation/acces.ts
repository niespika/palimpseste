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
// ⭐⭐ 24/09 — DÉCOUPLÉS, SUR DÉCISION DE LOUIS. Les deux se lisaient ensemble
//    côté élève, « le plus fermé gagne ». Mesuré en production le 24/09 :
//    `exercices_actif` à OFF — EXPRÈS, les exercices à la maison sont fermés —
//    et `passation_classe_actif` à ON. L'examen 1HLP du 29/09 aurait été
//    invisible : le professeur ouvre le dépôt, AUCUN élève ne voit rien (ni
//    signal, ni page, ni transcription). Louis : fermer la maison ne ferme pas
//    la classe. La face élève de la passation ne lit plus que SON interrupteur ;
//    `exercices_actif` garde tout ce qu'il gardait à la maison.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLesReglages } from '@/utils/scriptorium-params'

type Admin = SupabaseClient

export interface EtatDesPortes {
  /** L'interrupteur propre de C4-L4. */
  passationActive: boolean
  /**
   * `exercices_actif` — le premier des trois du §1.5, qui est au professeur.
   * ⚠️ Lu, mais il ne ferme PLUS la passation en classe (24/09).
   */
  exercicesActifs: boolean
}

export async function lireLesPortes(admin: Admin): Promise<EtatDesPortes> {
  const { data, error } = await lireLesReglages(admin)
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

/**
 * Côté ÉLÈVE : l'interrupteur de la passation, SEUL (découplé le 24/09 —
 * voir l'en-tête). `exercices_actif` ne ferme plus la classe.
 */
export async function passationOuverteAEleve(admin: Admin): Promise<boolean> {
  return (await lireLesPortes(admin)).passationActive
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
