import { TuileAccentModule } from '@/components/TuileAccent'

// L'identité du module (pastille, titre, devise, sous-onglets, retour) est
// désormais portée par l'en-tête partagé (Barre 2). Ce layout ne fait plus que
// poser le pigment du corps (data-module) et l'accent des tuiles.
export default function AletheiaProfLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="aletheia">
      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
