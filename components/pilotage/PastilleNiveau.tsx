// Pastille-lettre de niveau (A→D) pour la vue Compétences. Réutilisable quand les
// vraies données de niveau arriveront (cf. MatriceCompetences, // TODO compétences).
// Couleurs par jeton charte : A ok / B muet / C attention / D retard / – muet.

export type NiveauLettre = 'A' | 'B' | 'C' | 'D'

const STYLE: Record<NiveauLettre | '–', string> = {
  A: 'bg-ok-teinte text-ok',
  B: 'bg-parchemin-fonce text-muet',
  C: 'bg-attention-teinte text-attention',
  D: 'bg-retard-teinte text-retard',
  '–': 'bg-parchemin-fonce text-muet',
}

export default function PastilleNiveau({ niveau }: { niveau?: NiveauLettre | null }) {
  const n: NiveauLettre | '–' = niveau ?? '–'
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-titre font-semibold text-base ${STYLE[n]}`}
    >
      {n}
    </span>
  )
}
