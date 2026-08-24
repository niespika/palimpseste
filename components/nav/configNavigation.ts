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
      // C4-L8 — « le lieu où vivent les compétences », DANS LE MODULE PILOTAGE
      // (07- §2 ; piège 7). C'est le seul endroit d'où un statut de recette se pose.
      { label: 'Compétences', href: '/prof/competences' },
      // C4-L8 — le dépôt du corpus et sa file de validation (07- §2 ; 08- §0 :
      // « le fichier d'import est de la DONNÉE, la file est un ÉCRAN »).
      { label: 'Corpus', href: '/prof/corpus' },
      // C4-L8 — la conception en ligne, l'édition et l'aperçu (07- §2).
      { label: 'Conception', href: '/prof/conception' },
      // C4-L2 — LE PILOTAGE : les budgets par élève, l'assignation EN LECTURE
      // SEULE et l'assiduité. « Ces informations s'affichent AU PILOTAGE, dans
      // la vue par classe » (01- §2) ; « le professeur NE VALIDE RIEN AU FIL DE
      // L'EAU : il voit, et il peut écraser par override » (07- §1.2).
      // ⚠️ Le quatrième écran du lot — le panneau des cinq segments — n'est pas
      //    ici : il vit À LA CONCEPTION D'UN PLAN D'ÉVALUATION, « c'est là que le
      //    professeur voit ce que son calendrier produit » (01- §4, couche 1).
      { label: 'Routeur', href: '/prof/routeur' },
      { label: 'Calendrier', href: '/prof/calendrier' },
      { label: 'Intégrité', href: '/prof/integrite' },
      // `07-` §5, « L'allumage » — les SIX interrupteurs, et ce que chacun ouvre.
      // Le §5 les confie au professeur depuis C4-L1 ; jusqu'ici rien ne les
      // servait, et il fallait une requête en base pour en basculer un.
      { label: 'Allumage', href: '/prof/allumage' },
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
  { label: 'Intégrité', href: '/eleve/integrite' },
  {
    label: 'Modules',
    items: [
      { label: 'Fragments', href: '/eleve/modules/fragments-erudition' },
      { label: 'Scriptorium', href: '/eleve/modules/scriptorium' },
      { label: 'Quazian', href: '/eleve/modules/quazian' },
      { label: 'Codex', href: '/eleve/modules/codex' },
      { label: 'Aletheia', href: '/eleve/modules/aletheia' },
    ],
  },
]

// Nav élève filtrée par modules accessibles (slug = dernier segment du href de chaque
// item de l'onglet « Modules »). L'onglet « Modules » disparaît s'il ne reste aucun
// module accessible. Les autres onglets (tableau de bord, calendrier) sont conservés.
export function navEleveFiltree(slugsAccessibles: Set<string>): NavTab[] {
  return NAV_ELEVE.flatMap((tab) => {
    if (tab.label !== 'Modules' || !tab.items) return [tab]
    const items = tab.items.filter((it) => slugsAccessibles.has(it.href.split('/').pop() ?? ''))
    return items.length > 0 ? [{ ...tab, items }] : []
  })
}
