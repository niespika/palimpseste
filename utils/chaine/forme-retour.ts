import type { Grain, Version } from './types'

/** Le plafond de rédaction, distinct du nombre de cibles du routeur (§4). */
export const PLAFOND_NOMME: Record<Grain, number> = { micro: 2, meso: 3, macro: 5 }

export function plafondApplicable(grain: Grain, moment: Version): { plafond: number; porte: 'tout' | 'reussites' } {
  return { plafond: PLAFOND_NOMME[grain], porte: moment === 'v1' ? 'tout' : 'reussites' }
}

/**
 * Les règles 2 et 5, avant publication comme à la relecture du retour servi.
 * Aucun ancrage exigé ici : le contrôle a pu l'élaguer avant la persistance.
 */
export function controlerLaFormeDuRetour(
  r: {
    points: readonly { nature: 'reussite' | 'point_de_travail' }[]
    action_revision?: string | null
    feed_forward?: string | null
  },
  attendu: { moment: Version; grain: Grain; sansReussiteAdmise?: boolean },
): { refus: string[]; alertes: string[] } {
  const refus: string[] = [], alertes: string[] = []
  if (attendu.moment === 'v1' && !r.action_revision) {
    refus.push('règle 5 : la v1 se termine par une action de révision concrète — champ vide')
  }
  if (attendu.moment === 'vf' && !r.feed_forward) {
    refus.push('règle 5 : la version finale se termine par le pont — champ vide')
  }
  const { plafond, porte } = plafondApplicable(attendu.grain, attendu.moment)
  const compte = porte === 'tout' ? r.points.length : r.points.filter((p) => p.nature === 'reussite').length
  if (compte > plafond) {
    refus.push(`règle 2 : au grain ${attendu.grain}, le retour nomme au plus ${plafond} `
      + `${porte === 'tout' ? 'point(s) en tout' : 'réussite(s)'} — reçu ${compte}`)
  }
  if (r.points.length && r.points[0].nature !== 'reussite') {
    if (attendu.sansReussiteAdmise && !r.points.some((p) => p.nature === 'reussite')) {
      alertes.push('règle 2 : aucune réussite — admis, le verdict du cran est raté (C7-L9, § 4 bis)')
    } else {
      refus.push('règle 2 : le retour commence par une réussite réelle, citée')
    }
  }
  return { refus, alertes }
}
