import { TuileAccentModule } from '@/components/TuileAccent'

// L'identité du module (pastille, titre, devise, sous-onglets) et le sélecteur
// de semestre sont désormais portés par l'en-tête partagé (Barre 2). Le semestre
// est chargé dans le shell /prof et passé à l'en-tête ; les pages relisent le
// cookie `fragments_semestre` indépendamment.
// ⭐ 13/09 : Vestigia débordait du gabarit `max-w-6xl` de 96 px de chaque côté
// (≥ 1400 px) pour que la vue Semaine tienne 25 élèves sur deux colonnes à côté
// du retour ouvert (1152 px ne suffisent pas, 1344 oui). ⭐ 15/09 : le shell
// /prof est passé à 1440 px (`app/prof/layout.tsx`) — le débordement, cumulé,
// faisait sortir la page de la fenêtre (`scrollWidth` 1517 px mesuré à 1451, frise coupée à gauche).
// Retiré : le gabarit suffit désormais.
export default function FragmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="fragments">
      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
