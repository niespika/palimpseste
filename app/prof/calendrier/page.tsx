import { redirect } from 'next/navigation'

// La vue calendrier (bande des semaines, mois/semaine/jour) arrive aux lots
// C4/C5. Pour l'instant, l'entrée Calendrier mène à la configuration.
export default function CalendrierPage() {
  redirect('/prof/calendrier/config')
}
