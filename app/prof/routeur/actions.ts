'use server'
// ============================================================================
// C4 · L2 — LES GESTES DU PILOTAGE.
// ----------------------------------------------------------------------------
// L'écran d'assignation est EN LECTURE SEULE : « AUCUN GESTE DE VALIDATION, le
// professeur ne valide rien au fil de l'eau » (`07-` §1.2). Le seul geste est
// l'OVERRIDE, et il a deux faces : RETIRER, ou IMPOSER.
//
// ⚠️ « TOUT OVERRIDE SE JOURNALISE dans `routeur_decisions` » (`07-` §1.5 ; §11),
//    ORIGINE COMPRISE.
//
// ⭐ « LE RETRAIT ÉCRIT LE STATUT `retire`, QUI NE SE CONFOND **JAMAIS** AVEC
//    `abandonne` : l'un est une DÉCISION DU PROFESSEUR, l'autre un NON-GESTE DE
//    L'ÉLÈVE, ET L'ASSIDUITÉ MESURE L'ÉLÈVE » (`07-` §1.1). Il reste permis TANT
//    QUE LE DÉPÔT N'EST PAS `clos`.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import { retraitCompteDansLaSemaine } from '@/utils/routeur/assiduite'
import { lundiDe } from './serveur'

export interface Retour { ok: boolean; message: string; details?: string[] }

/** Le nombre saisi, ou `null` — jamais 0 par accident. */
function entierOuNull(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim()
  if (s === '') return null
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

/**
 * `01-` §4, couche 0 — régler le budget d'UN ÉLÈVE. « Proposées, jamais
 * imposées » : vider un champ rend la valeur au défaut de sa situation.
 */
export async function reglerLeBudget(_prec: Retour | null, form: FormData): Promise<Retour> {
  const { admin } = await garderProf(false)
  const eleveId = String(form.get('eleve_id') ?? '')
  if (!eleveId) return { ok: false, message: 'Élève manquant.' }

  const plancher = entierOuNull(form.get('plancher'))
  const plafond = entierOuNull(form.get('plafond'))
  const optionnel = entierOuNull(form.get('optionnel'))

  const details: string[] = []
  if (plancher !== null && plancher <= 0) return { ok: false, message: 'Le plancher doit être positif.' }
  if (plafond !== null && plafond <= 0) return { ok: false, message: 'Le plafond doit être positif.' }
  if (optionnel !== null && optionnel < 0) return { ok: false, message: 'Le budget optionnel ne peut pas être négatif.' }
  // ⚠️ On AVERTIT, on ne refuse pas : le plafond reste la borne dure et l'écart
  //    au plancher se journalise à chaque cycle (§5).
  if (plancher !== null && plafond !== null && plafond < plancher) {
    details.push(`Le plafond (${plafond} min) est sous le plancher (${plancher} min) : le routeur `
      + 's\'arrêtera au plafond, et l\'écart au plancher se journalisera à chaque cycle.')
  }

  const { error } = await admin.from('profiles').update({
    budget_plancher_min: plancher,
    budget_plafond_min: plafond,
    budget_optionnel_min: optionnel,
  }).eq('id', eleveId)
  if (error) return { ok: false, message: `Enregistrement refusé : ${error.message}` }

  revalidatePath('/prof/routeur')
  return {
    ok: true,
    message: plancher === null && plafond === null && optionnel === null
      ? 'Budget rendu au défaut de sa situation.'
      : 'Budget enregistré.',
    details: details.length ? details : undefined,
  }
}

/**
 * `01-` §5 — LE RECUEIL de la préférence de l'élève, « à intervalle régulier ».
 *
 * ⚠️ NI SA QUESTION NI SES VALEURS NE SONT ÉCRITES DANS LES SOURCES (piège 5).
 *    Cette action pose la DATE du recueil et accepte une réponse libre ; elle
 *    n'invente aucune question, et AUCUNE RÈGLE DE CE LOT NE LA LIT — « sa place
 *    dans le ciblage n'est pas tranchée ».
 */
export async function noterLeRecueil(_prec: Retour | null, form: FormData): Promise<Retour> {
  const { admin } = await garderProf(false)
  const eleveId = String(form.get('eleve_id') ?? '')
  if (!eleveId) return { ok: false, message: 'Élève manquant.' }
  const texte = String(form.get('reponse') ?? '').trim()

  const { error } = await admin.from('profiles').update({
    preference_recueillie_at: new Date().toISOString(),
    preference_reponse: texte ? { texte, forme: 'libre' } : null,
  }).eq('id', eleveId)
  if (error) return { ok: false, message: `Enregistrement refusé : ${error.message}` }

  revalidatePath('/prof/routeur')
  return { ok: true, message: 'Recueil noté.', details: [
    'La question et ses valeurs ne sont écrites dans aucune source : ce qui est enregistré est la '
    + 'date du recueil, et le texte tel quel. Aucune règle du routeur ne le lit.',
  ] }
}

/**
 * `07-` §1.1 et §1.5 — L'OVERRIDE, face RETRAIT.
 *
 * « Le retrait par le professeur reste permis TANT QUE LE DÉPÔT N'EST PAS `clos`,
 *   il passe par l'override et SE JOURNALISE, et il sort du dénominateur
 *   d'assiduité POUR L'AVENIR SEULEMENT. »
 */
export async function retirerLExercice(_prec: Retour | null, form: FormData): Promise<Retour> {
  const { admin, userId } = await garderProf(false)
  const depotId = String(form.get('depot_id') ?? '')
  const motif = String(form.get('motif') ?? '').trim()
  if (!depotId) return { ok: false, message: 'Dépôt manquant.' }

  const { data: depot, error: eLire } = await admin
    .from('exercices_depots')
    .select('id, eleve_id, statut, assigne_at, routeur_decision_id')
    .eq('id', depotId).maybeSingle()
  if (eLire) return { ok: false, message: `Lecture refusée : ${eLire.message}` }
  if (!depot) return { ok: false, message: 'Ce dépôt n\'existe pas.' }

  const d = depot as unknown as { id: string; eleve_id: string; statut: string
    assigne_at: string; routeur_decision_id: string | null }

  // « Le retrait reste permis TANT QUE le dépôt n'est pas `clos`. »
  if (d.statut === 'clos') {
    return { ok: false, message: 'Ce dépôt est clos : le retrait n\'est plus permis.' }
  }
  if (d.statut === 'retire') return { ok: false, message: 'Ce dépôt est déjà retiré.' }

  const { error } = await admin.from('exercices_depots')
    .update({ statut: 'retire' }).eq('id', depotId)
  if (error) return { ok: false, message: `Retrait refusé : ${error.message}` }

  // « TOUT override du professeur SE JOURNALISE dans `routeur_decisions`,
  //   ORIGINE COMPRISE » (07- §1.5 ; 01- §11, point 1).
  const cycleLundi = lundiDe(d.assigne_at.slice(0, 10))
  const entree = {
    geste: 'retrait', depot_id: depotId, motif: motif || null,
    par: userId, at: new Date().toISOString(),
    // La distinction que le `07-` §1.1 veut voir tenue.
    note: '`retire` — décision du professeur. Ne se confond jamais avec `abandonne`, '
      + 'qui est un non-geste de l\'élève, et l\'assiduité mesure l\'élève.',
  }
  if (d.routeur_decision_id) {
    const { data: dec } = await admin.from('routeur_decisions')
      .select('override_prof').eq('id', d.routeur_decision_id).maybeSingle()
    const brut = (dec as { override_prof?: unknown } | null)?.override_prof
    const deja = Array.isArray(brut) ? brut : []
    await admin.from('routeur_decisions')
      .update({ override_prof: [...deja, entree] }).eq('id', d.routeur_decision_id)
  } else {
    // Une assignation sans décision de routeur — la voie du professeur. L'override
    // se journalise quand même : c'est le journal du ROUTEUR qui porte les overrides.
    await admin.from('routeur_decisions').insert({
      eleve_id: d.eleve_id, cycle_lundi: cycleLundi,
      regle_declenchee: 'override_prof', override_prof: [entree],
    })
  }

  const quand = retraitCompteDansLaSemaine(cycleLundi, lundiDe(new Date().toISOString().slice(0, 10)))
  revalidatePath('/prof/routeur')
  return { ok: true, message: 'Exercice retiré.', details: [quand.motif] }
}
