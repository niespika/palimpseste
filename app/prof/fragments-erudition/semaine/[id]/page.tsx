import { redirect } from 'next/navigation'

// La vue d'une semaine vit désormais DANS l'onglet Semaine (`?semaine=`) : la
// frise en haut, la semaine dessous, l'élève dans un panneau. Cette route reste
// pour les liens déjà écrits (écran d'analyse, présentations, favoris) et se
// contente de rediriger, en gardant la classe demandée.
export default async function PageVueSemaine({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ classe?: string }>
}) {
  const { id } = await params
  const { classe } = await searchParams
  redirect(`/prof/fragments-erudition?semaine=${id}${classe ? `&classe=${classe}` : ''}`)
}
