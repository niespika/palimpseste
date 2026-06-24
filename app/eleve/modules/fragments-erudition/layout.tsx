import { TuileAccentModule } from '@/components/TuileAccent'

export default function FragmentsModuleLayout({ children }: { children: React.ReactNode }) {
  return <div data-module="fragments"><TuileAccentModule>{children}</TuileAccentModule></div>
}
