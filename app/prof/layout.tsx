import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { materialiserSemestreActif } from '@/utils/semestre-actif'
import { deconnexion } from './actions'
import EnTeteSite from '@/components/nav/EnTeteSite'
import SousNavModuleMobile from '@/components/nav/SousNavModuleMobile'
import BarreOngletsMobileProf from '@/components/nav/BarreOngletsMobileProf'
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

  // Le semestre actif se DÉDUIT de la date du jour (utils/semestre-actif.ts) — il ne
  // se saisit plus. Ce layout est l'un des DEUX seuls points d'appel (l'autre est
  // `app/eleve/layout.tsx`) : tout le monde passe par l'un ou l'autre, et l'appel ne
  // doit pas être semé dans quinze pages. Coût : une lecture de `semesters` par
  // navigation (petite table, ~2 lignes), zéro écriture dans le cas courant.
  // Best-effort : ne peut pas faire échouer le rendu.
  await materialiserSemestreActif()

  return (
    <div className="min-h-screen bg-parchemin">
      {/* En-tête desktop (2 barres). Masqué < sm : sur mobile, chaque écran porte
          son <EnTeteMobileProf> et la navigation passe par la barre du bas. */}
      <EnTeteSite role="prof" tabs={NAV_PROF} deconnexionAction={deconnexion} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-20 sm:pb-8">
        {/* Sous-nav du module SUR MOBILE (la Barre 2 desktop est cachée < sm). */}
        <SousNavModuleMobile role="prof" />
        {children}
      </main>
      {/* Barre d'onglets fixe (mobile) — compensée par le pb-20 du <main>. */}
      <BarreOngletsMobileProf nom={profile?.display_name ?? undefined} />
    </div>
  )
}
