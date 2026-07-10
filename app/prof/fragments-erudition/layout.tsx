import { TuileAccentModule } from '@/components/TuileAccent'

// L'identité du module (pastille, titre, devise, sous-onglets) et le sélecteur
// de semestre sont désormais portés par l'en-tête partagé (Barre 2). Le semestre
// est chargé dans le shell /prof et passé à l'en-tête ; les pages relisent le
// cookie `fragments_semestre` indépendamment.
export default function FragmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="fragments">
      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
