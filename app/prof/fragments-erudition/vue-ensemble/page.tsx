import { redirect } from 'next/navigation'

// C8·L3 — « Vue d'ensemble » a fusionné dans SUIVI. Route conservée pour les liens
// et marque-pages existants.
export default async function PageVueEnsembleRedirigee({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>
}) {
  const { classe } = await searchParams
  redirect(`/prof/fragments-erudition/suivi${classe ? `?classe=${classe}` : ''}`)
}
