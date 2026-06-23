// Configuration de la coquille de navigation (F3). Un même composant
// `BarreNavigation` est nourri par deux configs : prof et élève.
//
// 3 onglets principaux. « Tableau de bord » sans sous-menu (actif uniquement
// sur la route exacte) ; les autres ouvrent un menu déroulant. L'onglet actif
// est mis en évidence pour qu'on sache toujours où l'on est.

export interface NavItem {
  label: string
  href: string
}

export interface NavTab {
  label: string
  /** Lien direct (onglet sans sous-menu). */
  href?: string
  /** Actif uniquement si la route correspond exactement à `href` (ex. tableau de bord). */
  exact?: boolean
  /** Sous-menu déroulant. */
  items?: NavItem[]
}

export const NAV_PROF: NavTab[] = [
  { label: 'Tableau de bord', href: '/prof', exact: true },
  {
    label: 'Pilotage',
    items: [
      { label: 'Élèves', href: '/prof/eleves' },
      { label: 'Classes', href: '/prof/classes' },
      { label: 'Calendrier', href: '/prof/calendrier' },
    ],
  },
  {
    label: 'Modules',
    items: [
      { label: 'Fragments', href: '/prof/fragments-erudition' },
      { label: 'Scriptorium', href: '/prof/scriptorium' },
      { label: 'Quazian', href: '/prof/quazian' },
      { label: 'Codex', href: '/prof/codex' },
      { label: 'Aletheia', href: '/prof/aletheia' },
      { label: 'Gérer les accès', href: '/prof/modules' },
    ],
  },
]

export const NAV_ELEVE: NavTab[] = [
  { label: 'Tableau de bord', href: '/eleve', exact: true },
  { label: 'Calendrier', href: '/eleve/calendrier' },
  {
    label: 'Modules',
    items: [
      { label: 'Fragments', href: '/eleve/modules/fragments-erudition' },
      { label: 'Quazian', href: '/eleve/modules/quazian' },
      { label: 'Codex', href: '/eleve/modules/codex' },
      { label: 'Aletheia', href: '/eleve/modules/aletheia' },
    ],
  },
]
