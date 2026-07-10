// =========================================================================
// components/nav/configModules.ts
// Source de vérité unique de l'en-tête « seuil du module » (Barre 2).
// Consolide ce qui était éparpillé/codé en dur dans chaque layout de module :
// sous-onglets, devise du monde, et couleurs.
//
// ⚠️ Les valeurs de couleur sont celles du handoff (README §Couleurs +
// maquette blocs 4A–4L) — HAUTE FIDÉLITÉ. Elles diffèrent parfois des variables
// `--pigment` de globals.css (ex. Fragments encre #5A6043 ≠ --pigment #616E30) :
// l'en-tête a sa propre palette, on NE la dérive PAS des tokens CSS existants.
// =========================================================================

export type CleModule = 'aletheia' | 'codex' | 'fragments' | 'quazian' | 'scriptorium'

export interface CouleursModule {
  /** Nom du module (Cinzel) + repère d'encre. */
  encre: string
  /** Fond du disque du sceau. */
  teinte: string
  /** Dégradé de la bande — stop 62 %. */
  degradeMi: string
  /** Dégradé de la bande — stop 100 %. */
  degradeFin: string
  /** Bordure du disque du sceau. */
  bordureSceau: string
  /** Sous-onglet actif — fond. */
  ongletActifFond: string
  /** Sous-onglet actif — texte. */
  ongletActifTexte: string
  /** Sous-onglet inactif — texte. */
  ongletInactif: string
  /** Ombre de l'anneau d'or : rgba(<ombreAnneauRgb>, .30). */
  ombreAnneauRgb: string
}

export interface DeviseMonde {
  /** Partie latine, rendue en petites capitales (non italique). */
  latin: string
  /** Partie française, rendue en italique (précédée d'un tiret cadratin). '' = pas de partie française. */
  francais: string
}

export interface SousOnglet {
  href: string
  label: string
  /** Pour les modules dont les onglets sont pilotés par un paramètre `?vue=` (Scriptorium)
   *  plutôt que par la route : valeur de `vue` qui rend cet onglet actif. */
  vue?: string
}

export interface ModuleConfig {
  cle: CleModule
  prefixeProf: string
  prefixeEleve: string
  /** Nom affiché à droite de la Barre 2 (Cinzel). */
  nom: string
  /** Nom court si le nom complet ne tient pas (ex. « Fragments »). Défaut = nom. */
  nomCourt?: string
  couleurs: CouleursModule
  devise: DeviseMonde
  /** Sous-onglets prof (Barre 2). [] si aucun (Scriptorium). */
  sousOngletsProf: SousOnglet[]
}

export const MODULES: readonly ModuleConfig[] = [
  {
    cle: 'aletheia',
    prefixeProf: '/prof/aletheia',
    prefixeEleve: '/eleve/modules/aletheia',
    nom: 'Aletheia',
    couleurs: {
      encre: '#2C4A7C',
      teinte: '#DDE3EC',
      degradeMi: '#E7ECF4',
      degradeFin: '#CFDBEC',
      bordureSceau: '#CBD3E0',
      ongletActifFond: '#D5DEEE',
      ongletActifTexte: '#2C4A7C',
      ongletInactif: '#5B6685',
      ombreAnneauRgb: '44,74,124',
    },
    devise: { latin: 'Ars Legendi', francais: 'Dévoiler ce qui se cache' },
    sousOngletsProf: [
      { href: '/prof/aletheia', label: 'Classe' },
      { href: '/prof/aletheia/parametres', label: 'Paramètres' },
    ],
  },
  {
    cle: 'codex',
    prefixeProf: '/prof/codex',
    prefixeEleve: '/eleve/modules/codex',
    nom: 'Codex',
    couleurs: {
      encre: '#2E4A3C',
      teinte: '#DCE6DF',
      degradeMi: '#E9F0EA',
      degradeFin: '#C9DCD0',
      bordureSceau: '#C6D5CB',
      ongletActifFond: '#D0DED5',
      ongletActifTexte: '#2E4A3C',
      ongletInactif: '#56685E',
      ombreAnneauRgb: '46,74,60',
    },
    devise: { latin: 'Ars Scribendi', francais: 'Écrire pour penser' },
    sousOngletsProf: [
      { href: '/prof/codex', label: 'Synthèses' },
      { href: '/prof/codex/validation', label: 'Validation' },
      { href: '/prof/codex/parametres', label: 'Paramètres' },
    ],
  },
  {
    cle: 'fragments',
    prefixeProf: '/prof/fragments-erudition',
    prefixeEleve: '/eleve/modules/fragments-erudition',
    nom: "Fragments d'Érudition",
    nomCourt: 'Fragments',
    couleurs: {
      encre: '#5A6043',
      teinte: '#E2E3D2',
      degradeMi: '#ECEDDF',
      degradeFin: '#D2D4BD',
      bordureSceau: '#CDCFB6',
      ongletActifFond: '#D8DAC4',
      ongletActifTexte: '#5A6043',
      ongletInactif: '#5E6248', // assombri vs maquette #6C7058 pour passer AA sur le dégradé
      ombreAnneauRgb: '90,96,67',
    },
    devise: { latin: 'Ars Quaerendi', francais: 'Que rien ne se perde' },
    sousOngletsProf: [
      { href: '/prof/fragments-erudition', label: 'Semaine' },
      { href: '/prof/fragments-erudition/vue-ensemble', label: "Vue d'ensemble" },
      { href: '/prof/fragments-erudition/themes', label: 'Thèmes' },
      { href: '/prof/fragments-erudition/essais', label: 'Essais' },
      { href: '/prof/fragments-erudition/semestres', label: 'Synthèses' },
      { href: '/prof/fragments-erudition/parametres', label: 'Paramètres' },
    ],
  },
  {
    cle: 'quazian',
    prefixeProf: '/prof/quazian',
    prefixeEleve: '/eleve/modules/quazian',
    nom: 'Quazian',
    couleurs: {
      encre: '#3E6B8E',
      teinte: '#DCE6EC',
      degradeMi: '#E8EFF3',
      degradeFin: '#C7DAE5',
      bordureSceau: '#C4D3DD',
      ongletActifFond: '#D2E0E9',
      ongletActifTexte: '#3E6B8E',
      ongletInactif: '#4E6074', // assombri vs maquette #587082 pour passer AA sur le dégradé
      ombreAnneauRgb: '62,107,142',
    },
    devise: { latin: 'Ars Memoriae', francais: "Contre l'oubli" },
    sousOngletsProf: [
      { href: '/prof/quazian', label: 'Flashcards' },
      { href: '/prof/quazian/quizz', label: 'Quizz' },
      { href: '/prof/quazian/diagnostic', label: 'Diagnostic' },
      { href: '/prof/quazian/semestre', label: 'Semestre' },
      { href: '/prof/quazian/parametres', label: 'Paramètres' },
    ],
  },
  {
    cle: 'scriptorium',
    prefixeProf: '/prof/scriptorium',
    prefixeEleve: '/eleve/modules/scriptorium',
    nom: 'Scriptorium',
    couleurs: {
      encre: '#4A3A28',
      teinte: '#E6DDC9',
      degradeMi: '#EFE8D6',
      degradeFin: '#D9CCAE',
      bordureSceau: '#D3C6AA',
      ongletActifFond: '#E6DDC9',
      ongletActifTexte: '#4A3A28',
      ongletInactif: '#6A5C48', // valeur maison assombrie pour passer AA sur le dégradé
      ombreAnneauRgb: '74,58,40',
    },
    devise: { latin: 'Ars Docendi', francais: "D'une main à l'autre" },
    // Onglets pilotés par `?vue=` (pas par la route) — cf. app/prof/scriptorium/page.tsx.
    sousOngletsProf: [
      { href: '/prof/scriptorium?vue=classes', label: 'Par classe', vue: 'classes' },
      { href: '/prof/scriptorium?vue=textes', label: 'Textes', vue: 'textes' },
      { href: '/prof/scriptorium?vue=cours', label: 'Cours', vue: 'cours' },
      { href: '/prof/scriptorium?vue=parcours', label: 'Parcours', vue: 'parcours' },
      { href: '/prof/scriptorium?vue=livres', label: 'Livres', vue: 'livres' },
      { href: '/prof/scriptorium?vue=parametres', label: 'Paramètres', vue: 'parametres' },
    ],
  },
]

/** Devise de la maison (hors module). Rendue tout en petites capitales, sans partie française. */
export const DEVISE_MAISON: DeviseMonde = {
  latin: 'Verba Volant, Scripta Manent, Sapientia Permanet',
  francais: '',
}

/**
 * Résout le module courant à partir du pathname. `null` = hors module.
 * Match par préfixe (=== ou startsWith `prefixe + '/'`), prof OU élève. Les
 * préfixes sont mutuellement exclusifs → pas de collision inter-modules.
 * N'attrape PAS `/prof/modules` (gérer les accès) ni `/eleve/modules` (index).
 */
export function moduleDepuisPathname(pathname: string): ModuleConfig | null {
  const correspond = (prefixe: string) =>
    pathname === prefixe || pathname.startsWith(prefixe + '/')
  return (
    MODULES.find((m) => correspond(m.prefixeProf) || correspond(m.prefixeEleve)) ?? null
  )
}
