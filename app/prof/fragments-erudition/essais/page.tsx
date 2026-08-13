import { redirect } from 'next/navigation'

// C8·L3 — « Essais » est passé sous l'onglet ÉVALUATIONS (toggle Essai | Synthèse).
// Route conservée : les écrans de détail `essais/<id>` y renvoient et le calendrier
// prof pointe encore dessus.
export default async function PageEssaisRedirigee({
  searchParams,
}: {
  searchParams: Promise<{ classe?: string }>
}) {
  const { classe } = await searchParams
  redirect(`/prof/fragments-erudition/evaluations?vue=essai${classe ? `&classe=${classe}` : ''}`)
}
