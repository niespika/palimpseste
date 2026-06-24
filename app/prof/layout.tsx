import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { deconnexion } from './actions'
import BarreNavigation from '@/components/nav/BarreNavigation'
import { NAV_PROF } from '@/components/nav/configNavigation'

export default async function ProfLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'prof') redirect('/eleve')

  return (
    <div className="min-h-screen bg-parchemin">
      <header className="bg-surface border-b border-bordure sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-4">
          <span className="font-marque text-base font-semibold tracking-[0.1em] text-encre">PALIMPSESTE</span>
          <form action={deconnexion}>
            <button
              type="submit"
              className="font-ui text-sm text-muet hover:text-encre transition-colors"
            >
              Se déconnecter
            </button>
          </form>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-2">
          <BarreNavigation tabs={NAV_PROF} />
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
