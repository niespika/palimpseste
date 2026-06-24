import { TuileAccentModule } from '@/components/TuileAccent'

export default function CodexModuleLayout({ children }: { children: React.ReactNode }) {
  return <div data-module="codex"><TuileAccentModule>{children}</TuileAccentModule></div>
}
