import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { deconnexion } from './actions'
import BarreNavigation from '@/components/nav/BarreNavigation'
import { NAV_ELEVE } from '@/components/nav/configNavigation'
import SelecteurClasseEleve from './SelecteurClasseEleve'
import { contexteClasseEleve } from './contexte-classe'

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'eleve') redirect('/prof')

  // Commutateur de classe global (Lot 9) — remonté dans l'en-tête (F3).
  const { inscriptions, active } = await contexteClasseEleve(supabase, user.id)

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 print:hidden sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-3">
          <span className="text-base font-serif text-stone-900 font-medium">Palimpseste</span>
          <div className="flex items-center gap-3">
            {active && <SelecteurClasseEleve inscriptions={inscriptions} activeId={active.id} />}
            <form action={deconnexion}>
              <button
                type="submit"
                className="text-sm text-stone-500 hover:text-stone-800 transition-colors whitespace-nowrap"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-2">
          <BarreNavigation tabs={NAV_ELEVE} />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
