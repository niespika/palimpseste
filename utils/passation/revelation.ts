// ============================================================================
// C4 · L4 — LA RÉVÉLATION GRADUÉE, ET LA FORME DU RETOUR ÉDITÉ.
// ----------------------------------------------------------------------------
// « Il corrige à l'écran, RETOURS MASQUÉS PAR DÉFAUT, révélables DU PLUS
//   SOMMAIRE AU PLUS DÉTAILLÉ s'il le souhaite. IL JUGE AVANT DE VOIR LA MACHINE
//   — le même esprit que le protocole de ses bancs. »   — `02-` §6.D, étape 13
//
// Fichier PUR : aucun `server-only`, aucun accès base — il est testé sous
// `npm test`. Ce n'est pas une commodité : le filtrage d'un cran est exactement
// le genre de code qui laisse passer une citation le jour où on ajoute un champ.
//
// ⚠️ CE QUE LE PROMPT DE SÉANCE A TRANCHÉ, ET QUE LA SOURCE NE DIT PAS
//    EXPLICITEMENT (piège 27) : le masquage est PAR COPIE, la révélation
//    GRADUÉE, et AUCUN INTERRUPTEUR GLOBAL ne déshabille la classe entière d'un
//    clic — « un défaut qui se désarme une fois pour toutes n'est plus un
//    défaut ». Le cran vit donc dans l'état de l'ÉCRAN, par copie, et ne se
//    persiste NULLE PART : rien en base ne se souvient qu'une copie a été
//    révélée, et rouvrir l'écran la remasque.
//
// ⚠️ LES QUATRE CRANS SONT UNE DÉCISION DE SÉANCE, portée au relevé. La source
//    donne le SENS (« du plus sommaire au plus détaillé »), pas les échelons ;
//    « la forme appartient à la session Code » (§1). Ils suivent la structure du
//    retour segmenté, et rien d'autre.
// ============================================================================

import type { PointRetour } from '@/utils/chaine/types'

export const CRANS_DE_REVELATION = [
  { cran: 0, nom: 'Masqué', quoi: 'Rien. Le professeur juge d’abord.' },
  {
    cran: 1,
    nom: 'Le compte',
    quoi: 'Combien de points, par compétence, et de quelle nature — réussite ou point de travail. Aucun texte.',
  },
  {
    cran: 2,
    nom: 'Les points',
    quoi: 'Le texte de chaque point. Ni citation, ni action de révision.',
  },
  {
    cran: 3,
    nom: 'Le détail',
    quoi: 'Les ancrages — les citations de la copie —, l’action de révision et le feed-forward.',
  },
] as const

export type CranRevelation = 0 | 1 | 2 | 3

/** Le cran d'ouverture d'une copie. MASQUÉ, toujours — c'est le défaut, pas une préférence. */
export const CRAN_INITIAL: CranRevelation = 0

export interface SommaireDuRetour {
  parCompetence: Array<{ competence: string; reussites: number; pointsDeTravail: number }>
  total: number
}

/** Le cran 1 : ce que l'écran montre sans rien dire du contenu. */
export function sommaireDuRetour(points: readonly PointRetour[]): SommaireDuRetour {
  const par = new Map<string, { reussites: number; pointsDeTravail: number }>()
  for (const p of points) {
    const e = par.get(p.competence) ?? { reussites: 0, pointsDeTravail: 0 }
    if (p.nature === 'reussite') e.reussites++
    else e.pointsDeTravail++
    par.set(p.competence, e)
  }
  return {
    parCompetence: [...par.entries()].sort(([a], [b]) => a.localeCompare(b))
      .map(([competence, v]) => ({ competence, ...v })),
    total: points.length,
  }
}

/**
 * Ce qu'un cran laisse voir.
 *
 * ⚠️ L'IDENTIFIANT STABLE SURVIT À TOUS LES CRANS (piège 31) : c'est la clé de
 *    l'écran, et c'est ce sur quoi la contestation s'accroche (§1.2). Le masquer
 *    fermerait la porte que le piège 33 demande de laisser ouverte.
 */
export function auCran(points: readonly PointRetour[], cran: CranRevelation): PointRetour[] {
  if (cran <= 0) return []
  // ⚠️ 31/08 — L'ANCRAGE PEUT MANQUER (`PointRetour.ancrage` est facultatif
  //    depuis l'élagage des citations invérifiables). Masquer un ancrage ABSENT
  //    en fabriquerait un, sans source : on le laisse absent.
  const sansCitation = (p: PointRetour): PointRetour =>
    p.ancrage ? { ...p, ancrage: { ...p.ancrage, citation: '' } } : p
  if (cran === 1) {
    // Le compte seul : le texte et la citation sont retirés ; l'identifiant, la
    // compétence et la nature restent — c'est ce qu'on compte.
    return points.map((p) => ({ ...sansCitation(p), texte: '' }))
  }
  if (cran === 2) {
    return points.map(sansCitation)
  }
  return points.map((p) => ({ ...p }))
}

/** L'action de révision et le feed-forward n'apparaissent qu'au dernier cran. */
export function accompagnementVisible(cran: CranRevelation): boolean {
  return cran >= 3
}

// ─────────────────────────────────────────────────────────────────────────────
// LA FORME DU RETOUR ÉDITÉ — ce que la garde en base exigera
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un point ajouté par le professeur porte un identifiant préfixé : « il peut
 * modifier le retour » (`02-` §6.D, étape 14) veut aussi dire « ajouter une
 * remarque », et un identifiant qu'on n'attribue pas au modèle se reconnaît.
 */
export const PREFIXE_POINT_DU_PROF = 'prof:'

export interface RefusEdition { motif: string }

/**
 * Le contrôle applicatif, AVANT la garde en base.
 *
 * ⚠️ IL DIT EXACTEMENT CE QUE `retour_segmente_bien_forme(texte, false)` DIT
 *    (piège 28), pour qu'une `23514` ne tombe jamais en pleine correction :
 *      · l'ANCRAGE n'est PAS exigé du texte édité — « il peut modifier le
 *        retour », sans condition ;
 *      · l'IDENTIFIANT STABLE l'est — la contestation s'y accroche ;
 *      · un texte fait d'espaces est refusé ;
 *      · un ancrage FOURNI reste bien formé.
 *    ⚠️ La garde n'a plus qu'un domicile en base : elle a vécu quelques heures
 *       en deux exemplaires, et le second a été retiré le 21/08
 *       (`c4_gardes_correctif.sql`). ELLE S'APPELLE TOUJOURS À DEUX ARGUMENTS.
 */
export function refuserEdition(points: readonly PointRetour[]): RefusEdition | null {
  const vus = new Set<string>()
  for (const p of points) {
    const id = (p?.id ?? '').trim()
    if (id === '') {
      return {
        motif: 'Un point sans identifiant stable : la contestation de l’élève ne pourrait '
          + 's’accrocher à rien.',
      }
    }
    if (vus.has(id)) return { motif: `Deux points portent l’identifiant « ${id} ».` }
    vus.add(id)
    if ((p.texte ?? '').trim() === '') {
      return { motif: `Le point « ${id} » est vide : retirez-le plutôt que de le vider.` }
    }
    if (p.ancrage != null && (p.ancrage.citation ?? '').trim() === '') {
      return { motif: `Le point « ${id} » porte un ancrage sans citation.` }
    }
  }
  return null
}

/**
 * Les identifiants que l'édition n'a pas le droit d'inventer.
 *
 * « Ton écran affiche les points AVEC LEURS IDENTIFIANTS INTACTS, et l'édition
 * du professeur LES CONSERVE — elle n'en refabrique pas » (piège 31).
 */
export function identifiantsInconnus(
  points: readonly PointRetour[], engendres: readonly PointRetour[],
): string[] {
  const connus = new Set(engendres.map((p) => p.id))
  return points.filter((p) => !connus.has(p.id) && !p.id.startsWith(PREFIXE_POINT_DU_PROF))
    .map((p) => p.id)
}
