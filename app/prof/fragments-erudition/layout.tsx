import { TuileAccentModule } from '@/components/TuileAccent'

// L'identité du module (pastille, titre, devise, sous-onglets) et le sélecteur
// de semestre sont désormais portés par l'en-tête partagé (Barre 2). Le semestre
// est chargé dans le shell /prof et passé à l'en-tête ; les pages relisent le
// cookie `fragments_semestre` indépendamment.
// ⭐ Sur un grand écran (≥ 1400 px), Vestigia déborde du gabarit `max-w-6xl` du
// shell /prof de 96 px de chaque côté : c'est ce qui permet à la vue Semaine de
// tenir 25 élèves sur deux colonnes À CÔTÉ du retour ouvert, sans défiler
// (mesuré le 13/09 : 1152 px ne suffisent pas, 1344 oui).
export default function FragmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="fragments" className="min-[1400px]:-mx-24">
      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
