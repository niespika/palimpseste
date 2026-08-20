import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { deconnexion } from './actions'
import EnTeteSite from '@/components/nav/EnTeteSite'
import BarreOngletsMobile from '@/components/nav/BarreOngletsMobile'
import SousNavModuleMobile from '@/components/nav/SousNavModuleMobile'
import { FournisseurEtatFragmentsEleve } from '@/components/nav/EtatFragmentsEleve'
import { navEleveFiltree } from '@/components/nav/configNavigation'
import { slugsModulesAccessibles } from '@/utils/acces'
import { materialiserSemestreActif } from '@/utils/semestre-actif'
import SelecteurClasseEleve from './SelecteurClasseEleve'
import { contexteClasseEleve, VALEUR_TOUTES } from './contexte-classe'

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

  // Second (et dernier) point d'appel de la matérialisation du semestre actif : la
  // bascule doit avoir lieu même si c'est un ÉLÈVE qui ouvre l'app le premier ce
  // matin-là — d'où l'écriture par client admin (la policy `semesters` est prof-only).
  await materialiserSemestreActif()

  // Commutateur de classe global (Lot 9) — remonté dans l'en-tête (F3).
  // C7·L2 — trois états : en « Toutes », `active` est null sans que l'élève soit
  // pour autant sans classe ; le commutateur se pilote donc sur `valeurActive`.
  const { inscriptions, active, toutes } = await contexteClasseEleve(supabase, user.id)
  const valeurActive = toutes ? VALEUR_TOUTES : active?.id ?? null

  // Nav filtrée : on ne propose que les modules réellement accessibles à l'élève.
  const tabsEleve = navEleveFiltree(await slugsModulesAccessibles(supabase, user.id))

  return (
    // Les deux barres d'onglets de Fragments (Barre 2 desktop et sous-nav mobile) sont
    // montées ensemble ; le fournisseur leur charge leur état UNE fois pour deux.
    <FournisseurEtatFragmentsEleve>
    <div className="min-h-screen bg-parchemin">
      {/* En-tête desktop (2 barres). Le sélecteur de classe est dans la Barre 1. */}
      <EnTeteSite
        role="eleve"
        tabs={tabsEleve}
        deconnexionAction={deconnexion}
        classe={{ inscriptions, activeId: valeurActive }}
      />
      {/* Bandeau mobile (< sm) : conserve wordmark + sélecteur de classe, sinon
          l'élève perdrait le commutateur de classe sous 640px. Déconnexion : onglet « Moi ». */}
      <div className="sm:hidden sticky top-0 z-10 bg-surface border-b border-bordure print:hidden">
        <div className="max-w-4xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between gap-3">
          <span className="font-marque text-base font-semibold tracking-[0.1em] text-encre">PALIMPSESTE</span>
          {valeurActive && <SelecteurClasseEleve inscriptions={inscriptions} activeId={valeurActive} />}
        </div>
      </div>
      {/* Colonne alignée sur l'en-tête (`EnTeteSite` : max-w-[1040px] / px-[28px]) —
          le contenu tombe sous la marque et le sceau. */}
      <main className="max-w-[1040px] mx-auto px-4 sm:px-[28px] pt-8 pb-24 sm:pb-8">
        {/* Sous-nav du module SUR MOBILE (la Barre 2 desktop est cachée < sm) — C8·L3. */}
        <SousNavModuleMobile role="eleve" />
        {children}
      </main>
      {/* Barre d'onglets fixe (mobile) — compensée par le pb-24 du <main>. */}
      <BarreOngletsMobile />
    </div>
    </FournisseurEtatFragmentsEleve>
  )
}
