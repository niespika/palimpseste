import { createHash } from 'node:crypto'
import type { Doctrine } from '../fabrique/doctrine'
import type { InstanceDuVivier } from '../moteur/vivier'
import type { LigneDeDecision } from '../moteur/decision'
import { creerContrat, type ContratServi, type CompetencePilote } from './contrat'

/** Une offre n'est pas un contrat attribué : la prescription se fige après PB. */
export type OffreArgument = Pick<ContratServi, 'parcours' | 'classe_id' | 'sujet' | 'admissibilite'> & { cran: 6 | 8 }
const competences: CompetencePilote[] = ['argumentation', 'expression', 'structure']

export function identifiantOffre(eleve: string, offre: OffreArgument): string {
  const h = createHash('sha256').update(JSON.stringify(['argument-auto', eleve, offre.classe_id, offre.sujet.id, offre.cran])).digest('hex')
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`
}

export function instanceArgument(exerciceId: string, offre: OffreArgument, doctrine: Doctrine): InstanceDuVivier {
  const cran = doctrine.crans[offre.cran]
  const objet = doctrine.objets.argument
  if (!cran || cran.geste !== 'produire' || objet?.grain !== 'meso' || !objet.parCran[offre.cran]?.dureeMin) throw new Error('Doctrine argument 6/8 absente')
  return {
    exerciceId, objet: 'argument', grain: objet.grain, geste: cran.geste,
    cranNumero: offre.cran, cranCode: cran.code, dureeMin: objet.parCran[offre.cran].dureeMin,
    lieu: 'maison', classeId: offre.classe_id, statut: 'concu', bloque: false,
    genre: null, exclusionsParcours: objet.exclusionsParcours,
    modesParCompetence: Object.fromEntries(competences.map(c => [c, ['composer']])),
    couverture: Object.fromEntries(competences.map(c => [c, 'exerce' as const])),
    // L'admissibilité du pilote a déjà apparié ces cours dans CETTE classe,
    // y compris l'ouverture du grand thème HLP. Aucune notion rendue générique.
    materiaux: [{ sorte: 'sujet', role: 'source', id: offre.sujet.id, coursEtat: 'liste',
      coursApparies: offre.admissibilite.cours_ids, coursDeclares: offre.admissibilite.cours_ids.length,
      planLivreReferenceId: null, planSemaine: null, statut: 'valide', bloque: false }],
    devoirs: [], coTexte: null, piloteArgument: offre,
  }
}

export function contratDeDecision(ligne: LigneDeDecision, offre: OffreArgument): ContratServi {
  const principale = ligne.cible_retenue as CompetencePilote
  const secondaires = (ligne.alternatives_ecartees as { cibles_secondaires?: string[] }).cibles_secondaires ?? []
  if (!competences.includes(principale) || secondaires.length > 1
    || secondaires.some(c => !competences.includes(c as CompetencePilote) || c === principale)) {
    throw new Error('Prescription automatique hors des neuf configurations du pilote')
  }
  if (ligne.sondes_retenues.some(s => !s.sonde_montee)) throw new Error('Le pilote ne mesure pas de sonde silencieuse supplémentaire')
  return creerContrat({ ...offre, principale, secondaire: secondaires[0] as CompetencePilote ?? null, contexte_fourni: '' })
}
