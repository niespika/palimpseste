import { TuileAccentModule } from '@/components/TuileAccent'

// Active le « monde » du module (pigment + fond) pour tout le sous-arbre élève.
export default function AletheiaModuleLayout({ children }: { children: React.ReactNode }) {
  return <div data-module="aletheia"><TuileAccentModule>{children}</TuileAccentModule></div>
}
