import type { StatutAletheia } from './types'

// Les 4 étapes du parcours d'une semaine, partagées par le stepper (page semaine)
// et le micro-stepper du planning (4 points d'avancement).
export const ETAPES_SEMAINE = ['Lecture', 'Retour', 'Réécriture', 'Retour final'] as const

// Index de l'étape courante (0-3, ou 4 si terminée).
export function indexEtape(statut: StatutAletheia): number {
  switch (statut) {
    case 'DRAFT': return 0
    case 'V1_SUBMITTED': return 1
    case 'FEEDBACK1_READY': return 2
    case 'VF_SUBMITTED': return 3
    case 'FEEDBACK2_READY': return 3
    case 'DONE': return 4
  }
}
