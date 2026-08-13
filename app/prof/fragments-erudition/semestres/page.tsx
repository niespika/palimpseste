import { redirect } from 'next/navigation'

// C8·L3 — « Synthèses » est passé sous l'onglet ÉVALUATIONS (toggle Essai | Synthèse),
// et le semestre consulté est celui du sélecteur de la Barre 2 : la liste des semestres
// n'a plus lieu d'être (arbitrage Louis, 13/08). Route conservée pour les marque-pages.
export default function PageSemestresRedirigee() {
  redirect('/prof/fragments-erudition/evaluations?vue=synthese')
}
