import { redirect } from 'next/navigation'
import { lireIdentite } from '@/utils/supabase/identite'
import { materialiserSemestreActif } from '@/utils/semestre-actif'
import { deconnexion } from './actions'
import EnTeteSite from '@/components/nav/EnTeteSite'
import SousNavModuleMobile from '@/components/nav/SousNavModuleMobile'
import BarreOngletsMobileProf from '@/components/nav/BarreOngletsMobileProf'
import { NAV_PROF } from '@/components/nav/configNavigation'

export default async function ProfLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await lireIdentite()

  if (!user) redirect('/login')

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
      {/* ⭐ 15/09 (Louis) — le cadre professeur passe de 1152 à 1440 px : « des
          colonnes larges perdues de chaque côté ». C'est un PLAFOND : sur
          téléphone et tablette la page prend déjà toute la largeur, rien n'y
          change ; les proses bornent elles-mêmes leur ligne (`max-w-3xl`). */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-8 pb-20 sm:pb-8">
        {/* Sous-nav du module SUR MOBILE (la Barre 2 desktop est cachée < sm). */}
        <SousNavModuleMobile role="prof" />
        {children}
      </main>
      {/* Barre d'onglets fixe (mobile) — compensée par le pb-20 du <main>. */}
      <BarreOngletsMobileProf nom={profile?.display_name ?? undefined} />
    </div>
  )
}
