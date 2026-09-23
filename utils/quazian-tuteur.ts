// ============================================================================
// EN PARLER AVEC LE TUTEUR APRÈS UNE ERREUR ASSURÉE (retours de classe du
// 22/09/2026, point 8). Pur : compose, ne lit rien.
//
// ⭐ Seuil décidé par Louis le 23/09 : 70 points ou plus sur UNE mauvaise
//    réponse (« l'élève était nettement sûr de lui »). Sur le quiz de T5 du 22/09 :
//    25 questions, 14 élèves sur 20.
// ⭐ Le premier message du tuteur est composé PAR LE CODE, sans appel au modèle
//    (décision « Après Thea », 21/09) : il pose la question, dit où étaient les
//    points et quelle était la bonne réponse, et demande à l'élève son raisonnement.
// ⚠️ Texte BRUT : le fil du tuteur s'affiche en `whitespace-pre-wrap`, sans
//    markdown — pas d'astérisques.
// ============================================================================

import { sansDelims } from './ia-commun'

export const SEUIL_TUTEUR = 70

type Jetons = readonly [number, number, number, number]

/** L'index (dans l'ordre donné) de la mauvaise réponse qui porte ≥ 70 points, ou null. */
export function erreurAssuree(jetons: Jetons | null, indexCorrect: number): number | null {
  if (!jetons) return null
  let meilleur: number | null = null
  jetons.forEach((p, i) => {
    if (i === indexCorrect || p < SEUIL_TUTEUR) return
    if (meilleur === null || p > jetons[meilleur]) meilleur = i
  })
  return meilleur
}

// Les guillemets de l'énoncé passent en guillemets anglais : il est lui-même cité
// entre chevrons (« … “croyance vraie et justifiée” … »).
const cite = (s: string) => s.replace(/«\s*/g, '“').replace(/\s*»/g, '”').trim()
const points = (n: number) => (n === 100 ? 'tes 100 points' : `${n} point${n > 1 ? 's' : ''}`)

export function messageOuverture(q: { enonce: string; options: readonly string[]; jetons: Jetons; indexCorrect: number }): string {
  const faux = erreurAssuree(q.jetons, q.indexCorrect)
  if (faux === null) throw new Error('Aucune erreur assurée sur cette question.')
  const surLaBonne = q.jetons[q.indexCorrect]
  const choix = cite(q.options[faux])
  return `À la question « ${cite(q.enonce)} », tu avais mis ${points(q.jetons[faux])} sur « ${choix} »`
    + `${surLaBonne > 0 ? ` (et ${surLaBonne} sur la bonne)` : ''}. `
    + `La bonne réponse était « ${cite(q.options[q.indexCorrect])} ».\n\n`
    + `Qu’est-ce qui t’a fait pencher pour « ${choix} » ?`
}

/**
 * Le contexte que la route du tuteur ajoute au SUFFIXE PAR ÉLÈVE à chaque tour
 * d'une conversation partie d'un quiz — jamais au préfixe de classe (il est mis
 * en cache et partagé). Les textes viennent de la base ; les délimiteurs de
 * question y sont neutralisés comme partout (`sansDelims`).
 */
export function blocContexteQuiz(q: {
  enonce: string; options: readonly string[]; jetons: Jetons; indexCorrect: number; ouverture: string
}): string {
  const lignes = q.options.map((o, i) =>
    `- ${sansDelims(cite(o))}${i === q.indexCorrect ? ' (LA BONNE RÉPONSE)' : ''} : ${q.jetons[i]} point${q.jetons[i] > 1 ? 's' : ''}`)
  return [
    '<retour_de_quiz>',
    'Cette conversation a été ouverte par l’élève depuis la correction d’un quiz Quazian. Le quiz est FERMÉ et corrigé : l’élève connaît déjà la bonne réponse, tu peux l’expliquer librement.',
    `Question : « ${sansDelims(cite(q.enonce))} »`,
    'Réponses proposées, avec les points que l’élève y a placés (sur 100) :',
    ...lignes,
    `Tu as ouvert la conversation par ce message : « ${sansDelims(q.ouverture)} »`,
    'Ce que tu fais : pars de ce que l’élève dit de son raisonnement ; aide-le à voir pourquoi la bonne réponse est juste et ce qui l’a attiré vers la sienne, en t’appuyant sur le cours. Aucun reproche sur la note ni sur son assurance : une erreur commise en étant sûr est celle qui se corrige le mieux.',
    '</retour_de_quiz>',
  ].join('\n')
}
