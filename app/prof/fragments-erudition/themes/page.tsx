import { redirect } from 'next/navigation'

// C8·L3 — « Thèmes » a fusionné dans SUIVI. On garde la route pour ne casser ni les
// liens existants (TableauEssai, marque-pages du prof) ni les `revalidatePath`.
export default async function PageThemesRedirigee({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>
}) {
  const { classe } = await searchParams
  redirect(`/prof/fragments-erudition/suivi${classe ? `?classe=${classe}` : ''}`)
}
