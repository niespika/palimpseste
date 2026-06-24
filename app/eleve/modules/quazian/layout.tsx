import { TuileAccentModule } from '@/components/TuileAccent'

export default function QuazianModuleLayout({ children }: { children: React.ReactNode }) {
  return <div data-module="quazian"><TuileAccentModule>{children}</TuileAccentModule></div>
}
