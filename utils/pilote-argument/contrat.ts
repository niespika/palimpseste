import banque from './banque.json' with { type: 'json' }
export { COMPETENCES_PILOTE } from './competences'

export type CompetencePilote = 'argumentation' | 'expression' | 'structure'
export type ParcoursPilote = 'TC' | '1HLP' | 'THLP'
export type ReponseRelecture = { question_id: string; etat: 'fonctionne' | 'a_reprendre' | 'incertain'; passage?: string }
export type Question = { id: string; fonction: string; preparation: string; relecture: string }
export type Attente = typeof banque.contrat_argument.attentes[number] & { mesure_demandee: boolean }
export interface ContratServi {
  version: string
  empreinte_pedagogique: string
  sources_sha256: Record<string, string>
  cran: 6 | 8
  parcours: ParcoursPilote
  principale: CompetencePilote
  secondaire: CompetencePilote | null
  sujet: { id: string; enonce: string; notions: string[] }
  contexte_fourni: string
  consigne: string
  classe_id: string
  admissibilite: { cours_ids: string[]; notions_ouvertes: string[]; verifie_le: string }
  contrat: typeof banque.contrat_argument
  questions: Question[]
  reponses_admises: typeof banque.relecture_reponses
  invitation: string
}
export interface TraceRelecture {
  forme: 'auto_test'
  version_banque: string
  empreinte_pedagogique: string
  empreinte_texte: string
  questions_presentees: Question[]
  reponses_admises: typeof banque.relecture_reponses
  reponses: ReponseRelecture[]
  at: string
}
export const PREFIXE_PILOTE = 'pilote-argument-'
const nom = (c: string) => c[0].toUpperCase()+c.slice(1)

export function creerContrat(a: Omit<ContratServi, 'version' | 'empreinte_pedagogique' | 'sources_sha256' | 'contrat' | 'questions' | 'reponses_admises' | 'invitation' | 'consigne'>): ContratServi {
  const configuration = nom(a.principale)+(a.secondaire ? '+'+nom(a.secondaire) : '')
  const ids = (banque.prescriptions as Record<string, string[]>)[configuration]
  if (!ids || ![6, 8].includes(a.cran) || !['TC', '1HLP', 'THLP'].includes(a.parcours)
    || !a.sujet.enonce.trim() || !a.classe_id || !a.admissibilite.cours_ids.length) throw new Error('Prescription du pilote invalide')
  return structuredClone({ ...a, version: banque.version, empreinte_pedagogique: banque.empreinte_pedagogique,
    sources_sha256: banque.sources_sha256, contrat: banque.contrat_argument,
    consigne: 'Écris un argument pour défendre une réponse possible à ce sujet.',
    questions: ids.map(id => {
      const q = banque.questions.find(q => q.id === id)
      if (!q) throw new Error('Repère absent de la banque')
      return { id, fonction: q.fonction, preparation: q.preparation, relecture: q.relecture }
    }), reponses_admises: banque.relecture_reponses, invitation: banque.relecture_invitation })
}

export function attentesPour(c: ContratServi, phase: 'v1' | 'vf'): Attente[] {
  const competences = phase === 'vf' ? [c.principale] : [c.principale, c.secondaire]
  return c.contrat.attentes.filter(a => a.attente_objet || competences.includes(a.competence as CompetencePilote))
    .map(a => ({ ...a, mesure_demandee: a.observables.length > 0 && competences.includes(a.competence as CompetencePilote) }))
}
export function observablesPour(c: ContratServi, phase: 'v1' | 'vf', competence: string): string[] {
  return [...new Set(attentesPour(c, phase).filter(a => a.mesure_demandee && a.competence === competence).flatMap(a => a.observables))]
}

/** Liste blanche : ni modèle, ni questions, ni trace, ni résultat de V1 dans P1. */
export function paquetIndependant(c: ContratServi, texte: string, phase: 'v1' | 'vf') {
  return { sujet_exact: c.sujet.enonce, contexte_fourni: c.contexte_fourni, consigne: c.consigne,
    texte_eleve: texte, phase, objet: 'argument', parcours: c.parcours,
    empreinte_pedagogique: c.empreinte_pedagogique,
    competences_mesurees: phase === 'vf' ? [c.principale] : [c.principale, c.secondaire].filter(Boolean),
    attentes: attentesPour(c, phase), regles: c.contrat.regles_communes }
}

export function validerReponses(c: ContratServi, texte: string, reponses: ReponseRelecture[]): void {
  if (c.cran !== 6 || !Array.isArray(reponses) || reponses.length > c.questions.length) throw new Error('Relecture hors périmètre')
  const vus = new Set<string>()
  for (const r of reponses) {
    if (!r || !c.questions.some(q => q.id === r.question_id) || vus.has(r.question_id)
      || !c.reponses_admises.some(a => a.code === r.etat)
      || (r.passage !== undefined && (typeof r.passage !== 'string' || !texte.includes(r.passage)))) throw new Error('Réponse de relecture invalide')
    vus.add(r.question_id)
  }
}

/** Projection publique explicite : le cran 8 ne transmet aucune aide cachée au client. */
export function affichagePilote(c: ContratServi, phase: 'v1' | 'vf', attenteRevision?: string | null) {
  const priorite = c.contrat.attentes.find(a => a.id === attenteRevision)
  return { cran: c.cran, sujet: c.sujet.enonce, consigne: c.consigne, contexte: c.contexte_fourni,
    preparation: c.cran === 6 && phase === 'v1' ? c.questions : [],
    modele: c.cran === 6 && phase === 'v1' ? c.contrat.modele : null,
    reponses: c.cran === 6 && phase === 'v1' ? c.reponses_admises : [],
    invitation: c.cran === 6 && phase === 'v1' ? c.invitation : '',
    aideRevision: c.cran === 6 && phase === 'vf' && priorite
      ? c.questions.filter(q => priorite.questions.includes(q.id)).map(q => q.preparation) : [] }
}
export type AffichagePilote = ReturnType<typeof affichagePilote>
