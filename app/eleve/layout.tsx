import { redirect } from 'next/navigation'
import { lireIdentite, lireUtilisateur } from '@/utils/supabase/identite'
import { deconnexion } from './actions'
import EnTeteSite from '@/components/nav/EnTeteSite'
import BarreOngletsMobile from '@/components/nav/BarreOngletsMobile'
import SousNavModuleMobile from '@/components/nav/SousNavModuleMobile'
import { FournisseurEtatFragmentsEleve } from '@/components/nav/EtatFragmentsEleve'
import { navEleveFiltree } from '@/components/nav/configNavigation'
import { prechargerModulesDesClasses, slugsModulesDesClasses } from '@/utils/acces'
import { materialiserSemestreActif } from '@/utils/semestre-actif'
import SelecteurClasseEleve from './SelecteurClasseEleve'
import { contexteClasseEleve, VALEUR_TOUTES } from './contexte-classe'

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  // ⭐ 17/09 — le layout est sur le chemin du PREMIER OCTET : rien ne s'affiche,
  //    pas même la plume d'attente, avant qu'il ait fini. Cinq lectures s'y
  //    enchaînaient (session → profil → inscriptions → classe_modules → modules) ;
  //    il n'en reste que deux de profondeur : la session, puis tout le reste.
  const { supabase, user } = await lireUtilisateur()

  if (!user) redirect('/login')

  // Ne dépend que de la session (la policy borne la lecture à ses classes).
  prechargerModulesDesClasses(supabase)

  // Second (et dernier) point d'appel de la matérialisation du semestre actif : la
  // bascule doit avoir lieu même si c'est un ÉLÈVE qui ouvre l'app le premier ce
  // matin-là — d'où l'écriture par client admin (la policy `semesters` est prof-only).
  const [, { profile }, { contexte, slugs }] = await Promise.all([
    materialiserSemestreActif(),
    lireIdentite(),
    (async () => {
      const contexte = await contexteClasseEleve(supabase, user.id)
      // La navigation garde l'union de TOUTES les inscriptions actives, même
      // quand le contenu de la page porte sur une seule classe sélectionnée.
      const slugs = await slugsModulesDesClasses(supabase, contexte.inscriptions.map((i) => i.classe_id))
      return { contexte, slugs }
    })(),
  ])

  if (profile?.role !== 'eleve') redirect('/prof')

  // Commutateur de classe global (Lot 9) — remonté dans l'en-tête (F3).
  // C7·L2 — trois états : en « Toutes », `active` est null sans que l'élève soit
  // pour autant sans classe ; le commutateur se pilote donc sur `valeurActive`.
  const { inscriptions, active, toutes } = contexte
  const valeurActive = toutes ? VALEUR_TOUTES : active?.id ?? null

  // Nav filtrée : on ne propose que les modules réellement accessibles à l'élève.
  const tabsEleve = navEleveFiltree(slugs)

  return (
    // Les deux barres d'onglets de Fragments (Barre 2 desktop et sous-nav mobile) sont
    // montées ensemble ; le fournisseur leur charge leur état UNE fois pour deux.
    <FournisseurEtatFragmentsEleve>
    {/* `data-coquille` : la Discussion Scriptorium en bureau efface l'en-tête et le
        cadre du <main> par un `:has()` de globals.css (handoff du 18/09). */}
    <div className="min-h-screen bg-parchemin" data-coquille="eleve">
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
