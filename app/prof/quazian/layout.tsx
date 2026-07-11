import { TuileAccentModule } from '@/components/TuileAccent'

// L'identité du module est portée par l'en-tête partagé (Barre 2).
export default function QuazianLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-module="quazian">
      <TuileAccentModule>{children}</TuileAccentModule>
    </div>
  )
}
