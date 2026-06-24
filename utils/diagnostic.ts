// Classification des profils par élève × concept (SPEC_Quazian §7)

export type ProfilConcept = 'maitrise' | 'lacune' | 'idee_fausse' | 'insuffisant'

export interface DiagnosticConcept {
  concept_tag: string
  profil: ProfilConcept
  scoreMoyen: number
  nbQuestions: number
}

// Seuils issus du spec :
// maitrise     : score > +5 (réponses correctes confiantes)
// lacune       : score ∈ [+1, +5]  (proche de +2.5, distribution plate)
// idee_fausse  : score < -2  (forte proba sur une mauvaise réponse)
// insuffisant  : moins de 2 questions pour conclure

export function classerConcept(scoreMoyen: number, nbQuestions: number): ProfilConcept {
  if (nbQuestions < 2) return 'insuffisant'
  if (scoreMoyen > 5) return 'maitrise'
  if (scoreMoyen < -2) return 'idee_fausse'
  return 'lacune'
}

export function diagnostiquerEleve(
  reponses: Array<{ concept_tag: string; score: number }>
): DiagnosticConcept[] {
  const parConcept: Record<string, number[]> = {}
  for (const r of reponses) {
    if (!r.concept_tag) continue
    if (!parConcept[r.concept_tag]) parConcept[r.concept_tag] = []
    parConcept[r.concept_tag].push(r.score)
  }

  return Object.entries(parConcept).map(([concept_tag, scores]) => {
    const scoreMoyen = scores.reduce((a, b) => a + b, 0) / scores.length
    const profil = classerConcept(scoreMoyen, scores.length)
    return { concept_tag, profil, scoreMoyen, nbQuestions: scores.length }
  }).sort((a, b) => a.scoreMoyen - b.scoreMoyen)
}

export const PROFIL_LABELS: Record<ProfilConcept, { label: string; couleur: string; bg: string }> = {
  maitrise:    { label: 'Maîtrise',    couleur: 'text-ok',         bg: 'bg-ok-teinte border-ok' },
  lacune:      { label: 'Lacune',      couleur: 'text-attention',  bg: 'bg-attention-teinte border-attention' },
  idee_fausse: { label: 'Idée fausse', couleur: 'text-retard',     bg: 'bg-retard-teinte border-retard' },
  insuffisant: { label: 'Peu de data', couleur: 'text-muet',       bg: 'bg-parchemin-fonce border-bordure' },
}
