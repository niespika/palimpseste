import { controlerLaFormeDuRetour } from '../chaine/forme-retour'
import type { Grain, RetourSegmente } from '../chaine/types'
import type { Drapeau } from './attention'

/** Louis, 08/09 : le futur seulement ; la lecture par l'élève ferme le signal. */
export function drapeauDuRetourARelire(r: {
  depotId: string; eleveId: string; eleveNom: string
  moment: 'chaud' | 'final'; creeLe: string; publieLe: string | null; luLe: string | null
  editeParProf: boolean; retour: RetourSegmente; grain: Grain; sansReussiteAdmise: boolean
}, depuis: string | null): Drapeau | null {
  if (!depuis || !Number.isFinite(Date.parse(depuis))
      || !Number.isFinite(Date.parse(r.creeLe)) || Date.parse(r.creeLe) < Date.parse(depuis)
      || !r.publieLe || r.luLe || r.editeParProf) return null
  const controle = controlerLaFormeDuRetour(r.retour, {
    moment: r.moment === 'chaud' ? 'v1' : 'vf', grain: r.grain,
    sansReussiteAdmise: r.sansReussiteAdmise,
  })
  if (controle.refus.length === 0) return null
  return {
    nature: 'retour_a_relire', eleveId: r.eleveId, eleveNom: r.eleveNom,
    cle: `retour|${r.depotId}|${r.moment}`,
    phrase: `Le retour ${r.moment === 'chaud' ? 'sur la première version' : 'final'} a été publié `
      + 'sans tenir son contrat de rédaction. L’élève ne l’a pas encore marqué comme lu : à relire.',
    detail: controle.refus,
    at: r.publieLe, enTete: false, geste: null,
  }
}
