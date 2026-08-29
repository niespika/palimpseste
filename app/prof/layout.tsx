import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { materialiserSemestreActif } from '@/utils/semestre-actif'
import { deconnexion } from './actions'
import EnTeteSite from '@/components/nav/EnTeteSite'
import SousNavModuleMobile from '@/components/nav/SousNavModuleMobile'
import BarreOngletsMobileProf from '@/components/nav/BarreOngletsMobileProf'
import { NAV_PROF } from '@/components/nav/configNavigation'
import LogoPalimpseste from '@/components/nav/LogoPalimpseste'

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
      {/* En-tête desktop (2 barres). Masqué < sm : sur mobile, c'est le bandeau
          ci-dessous qui tient le haut de l'écran, et la navigation passe par la
          barre du bas. */}
      <EnTeteSite role="prof" tabs={NAV_PROF} deconnexionAction={deconnexion} />

      {/* Bandeau mobile (< sm) — DANS LE LAYOUT, et c'est tout l'intérêt.
          Défaut trouvé par Louis en production : sur téléphone, taper une bascule
          de vue vidait TOUT l'écran (retour, titre, bascule) au profit de la seule
          plume, parce que l'en-tête mobile était du contenu de PAGE et partait
          donc avec elle. Un écran blanc ne se lit pas « ça charge », il se lit
          « c'est cassé ». Posé ici, le bandeau survit à l'attente — comme le fait
          déjà celui de l'espace élève. Le médaillon a quitté <EnTeteMobileProf>
          pour venir ici : il ne doit pas paraître deux fois. */}
      <div className="sm:hidden sticky top-0 z-10 bg-surface border-b border-bordure print:hidden">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="font-marque text-base font-semibold tracking-[0.1em] text-encre">PALIMPSESTE</span>
          <LogoPalimpseste size={28} />
        </div>
      </div>
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
