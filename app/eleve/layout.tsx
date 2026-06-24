import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { deconnexion } from './actions'
import BarreNavigation from '@/components/nav/BarreNavigation'
import BarreOngletsMobile from '@/components/nav/BarreOngletsMobile'
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
    <div className="min-h-screen bg-parchemin">
      <header className="bg-surface border-b border-bordure print:hidden sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-3">
          <span className="font-marque text-base font-semibold tracking-[0.1em] text-encre">PALIMPSESTE</span>
          <div className="flex items-center gap-3">
            {active && <SelecteurClasseEleve inscriptions={inscriptions} activeId={active.id} />}
            {/* Déconnexion : dans l'en-tête ≥ sm ; sur mobile, via l'onglet « Moi ». */}
            <form action={deconnexion} className="hidden sm:block">
              <button
                type="submit"
                className="font-ui text-sm text-muet hover:text-encre transition-colors whitespace-nowrap"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
        {/* Barre à déroulants : desktop seulement. Sur mobile, c'est la barre d'onglets du bas. */}
        <div className="hidden sm:block max-w-4xl mx-auto px-4 sm:px-6 pb-2">
          <BarreNavigation tabs={NAV_ELEVE} />
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-24 sm:pb-8">
        {children}
      </main>
      {/* Barre d'onglets fixe (mobile) — compensée par le pb-24 du <main>. */}
      <BarreOngletsMobile />
    </div>
  )
}
