import { redirect } from 'next/navigation'

// C8·L3 — l'écran « synthèses d'un semestre » est devenu le côté Synthèse de
// l'onglet ÉVALUATIONS, scopé par le sélecteur de semestre de la Barre 2. On garde
// la route pour les anciens liens ; elle rejoint le semestre consulté (pas
// forcément celui de l'URL — le sélecteur fait foi).
export default async function PageSemestreRedirigee({
  searchParams,
}: {
  params: Promise<{ semestreId: string }>
  searchParams: Promise<{ classe?: string }>
}) {
  const { classe } = await searchParams
  redirect(`/prof/fragments-erudition/evaluations?vue=synthese${classe ? `&classe=${classe}` : ''}`)
}
