// ============================================================================
// L'ANTICHAMBRE D'UN QUIZ (retours de classe du 22/09/2026, points 5 et 6).
//
// Le professeur ouvre l'antichambre ; les élèves qui arrivent lisent ce qu'ils
// vont devoir faire et s'essaient sur une question qui ne compte pas ; le
// professeur voit qui est là et lance quand il veut — le chrono part alors.
// ⭐ Le statut du quiz reste `brouillon` pendant l'attente (`quazian_antichambre.sql`) :
//    aucune question ne peut sortir avant le lancement.
// Ce fichier est PUR : il compose, il ne lit rien.
// ============================================================================

import { contributionsQuestion, ecrireCalcul, signe } from './quazian-explication-note'

/** Un élève est « présent » si son écran d'attente s'est signalé depuis moins de 20 s. */
export const PRESENCE_MS = 20_000
/** L'écran d'attente se signale toutes les 4 s (sondage). */
export const SONDAGE_ELEVE_MS = 4_000
/** Une antichambre oubliée ne reste pas ouverte : au-delà de 3 h, elle ne compte
 *  plus (revue du 22/09 — sans cela, une salle ouverte puis abandonnée appelait
 *  la classe « Le quiz va commencer » pendant des jours). */
export const ANTICHAMBRE_MAX_MS = 3 * 60 * 60 * 1000

export function antichambreEnCours(antichambreAt: string | null | undefined, maintenant: number): boolean {
  if (!antichambreAt) return false
  const t = Date.parse(antichambreAt)
  return Number.isFinite(t) && maintenant - t <= ANTICHAMBRE_MAX_MS
}

/** La question d'essai — choisie par Louis le 22/09 : beaucoup d'élèves sont SÛRS
 *  que c'est Sydney, et c'est exactement ce que l'essai doit faire sentir. */
export const ESSAI = {
  enonce: 'Quelle est la capitale de l’Australie ?',
  options: ['Sydney', 'Canberra', 'Melbourne', 'Perth'],
  indexCorrect: 1,
} as const

export type EtatPresence = 'present' | 'parti' | 'absent'

export interface LigneAntichambre {
  id: string
  display_name: string
  etat: EtatPresence
}

export function composerAntichambre(entree: {
  inscrits: string[]
  profils: { id: string; display_name: string | null }[]
  presences: { eleve_id: string; vu_at: string }[]
  maintenant: number
}): { lignes: LigneAntichambre[]; presents: number; total: number } {
  const nom = new Map(entree.profils.map((p) => [p.id, p.display_name]))
  const vu = new Map(entree.presences.map((p) => [p.eleve_id, new Date(p.vu_at).getTime()]))
  const lignes = [...new Set(entree.inscrits)]
    .map((id): LigneAntichambre => {
      const t = vu.get(id)
      const etat: EtatPresence = t === undefined ? 'absent'
        : entree.maintenant - t <= PRESENCE_MS ? 'present' : 'parti'
      return { id, display_name: nom.get(id) ?? 'Élève sans nom', etat }
    })
    .sort((a, b) => a.display_name.localeCompare(b.display_name, 'fr'))
  return { lignes, presents: lignes.filter((l) => l.etat === 'present').length, total: lignes.length }
}

/**
 * Ce que la répartition de l'essai aurait rapporté, en mots d'élève : réponse
 * par réponse ce qu'elle rapporte ou coûte (demande de Louis, 22/09 : « +X si on
 * gagne, −X si on perd, 0 si rien »), le calcul, et le score. Exact au millième :
 * l'élève qui refait l'addition tombe juste.
 */
export function expliquerEssai(jetons: [number, number, number, number]): { score: string; lignes: string[]; calcul: string } {
  const parts = contributionsQuestion(jetons, ESSAI.indexCorrect)
  const lignes: string[] = []
  jetons.forEach((p, i) => {
    if (i !== ESSAI.indexCorrect && p === 0) return
    const pts = `${p} point${p > 1 ? 's' : ''}`
    lignes.push(i === ESSAI.indexCorrect
      ? `${ESSAI.options[i]}, la bonne réponse : ${pts} → ${signe(parts[i])}`
      : `${ESSAI.options[i]} : ${pts} → ${signe(parts[i])}`)
  })
  return { score: signe(parts.reduce((a, b) => a + b, 0)), lignes, calcul: ecrireCalcul(parts) }
}
