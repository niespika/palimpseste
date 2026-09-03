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
  /** Routes filles qui allument cet onglet, en plus de `href` (onglets pilotés par la
   *  ROUTE). Sans elles, un écran de détail (`…/eleve/<id>`, `…/essais/<id>`) tomberait
   *  sur l'onglet racine du module, qui matche tout par préfixe. */
  prefixes?: string[]
  /** Pour les modules dont les onglets sont pilotés par un paramètre `?vue=` (Scriptorium,
   *  Fragments élève) plutôt que par la route : valeur de `vue` qui rend cet onglet actif. */
  vue?: string
  /** Vues (au sens `?vue=`) qui allument cet onglet. Défaut = [vue].
   *  Permet à un onglet parent de rester actif sur ses sous-vues regroupées. */
  vues?: string[]
  /** Onglet allumé quand `?vue=` est absent de l'URL. Défaut = la 1re entrée de
   *  la liste. Sert quand l'ordre d'affichage ≠ vue par défaut de la page
   *  (Scriptorium élève : « Plan de cours » en tête, mais `discussion` par défaut). */
  parDefaut?: boolean
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
  /** Sous-onglets élève (Barre 2). Absent = aucun sous-onglet côté élève.
   *  ⚠️ Ce n'est plus « le cas de tous les modules sauf Scriptorium » : Quazian
   *  (C7·L2), Fragments (C8·L3), Codex (C4-L6) et ALETHEIA (C5-L4) en portent
   *  tous. ⭐ Depuis C5-L4, SCRIPTORIUM EST LE SEUL MODULE dont la face élève
   *  n'a pas de sous-onglets pilotés par la route — les siens le sont par
   *  `?vue=`, et il ne reste donc AUCUN module sans barre côté élève. */
  sousOngletsEleve?: SousOnglet[]
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
    // C5-L4 — « Aletheia prend TROIS onglets de chaque côté, et ce ne sont pas
    // les mêmes » (`07-` §2). Côté professeur : LIVRES — ce que l'onglet
    // « Classe » portait : les classes, l'avancée par livre, la trajectoire
    // diagnostique, le détail d'un élève —, EXERCICES — « tout ce qui touche un
    // exercice de lecture vit sous un seul onglet » —, et PARAMÈTRES, tel quel.
    //
    // ⭐ L'ONGLET QUI GARDE LA RACINE VIENT EN TÊTE, DES DEUX CÔTÉS (décision de
    //    Louis, 27/08). La racine `/prof/aletheia` EST la page des classes et
    //    des livres : elle est la cible de `configNavigation.ts` (« Modules →
    //    Aletheia »), de ses propres `Tuile href={/prof/aletheia?classe=<id>}`,
    //    et de six des dix `revalidatePath` du dépôt. Arriver par « Modules →
    //    Aletheia » allume donc le PREMIER onglet, comme chez Codex et Quazian.
    //    ⛔ La phrase d'ouverture de l'entrée du `07-` §2 — « Exercices, Livres
    //       et Paramètres » — nomme l'INVENTAIRE, pas l'ordre.
    //
    // ⚠️ `/prof/aletheia/eleve/<id>` N'A PAS DE PRÉFIXE, ET C'EST VOULU : la
    //    fiche d'un élève est ce que l'onglet Livres décrit (son avancée, sa
    //    trajectoire diagnostique), et l'onglet racine l'attrape par défaut —
    //    le plus long préfixe qui matche est `/prof/aletheia` lui-même. Un
    //    préfixe explicite n'ajouterait rien qu'une ligne à maintenir.
    sousOngletsProf: [
      { href: '/prof/aletheia', label: 'Livres' },
      {
        href: '/prof/aletheia/exercices',
        label: 'Exercices',
        // Les deux écrans de détail que l'onglet Exercices sert : sans eux, ils
        // tomberaient sur Livres — l'onglet racine matche tout par préfixe.
        prefixes: [
          '/prof/aletheia/passation',
          '/prof/aletheia/examen-diagnostique',
        ],
      },
      { href: '/prof/aletheia/parametres', label: 'Paramètres' },
    ],
    // C5-L4 — côté élève : LIVRES, sa séance de lecture ; EXERCICES, ce qu'il
    // travaille à la maison ; EXAMENS, où vit la passation en classe.
    // ⭐ Le partage est celui du `06-` §1 — « lecture formative, à la maison »
    //    d'un côté, « lecture diagnostique, en classe » de l'autre —, et
    //    l'onglet Livres est ce que le `01-` §2 appelle, côté élève, « un lieu,
    //    hors du cycle ».
    //
    // ⚠️⚠️ LE PIÈGE PROPRE À ALETHEIA : `app/eleve/modules/aletheia/[livreId]/`
    //    est un SEGMENT DYNAMIQUE À LA RACINE du module, au même niveau que
    //    `exercice/`, `passation/`, `exercices/` et `examens/`. Codex n'a pas ce
    //    problème — ses routes filles sont toutes des dossiers nommés. Une
    //    séance de lecture est `/eleve/modules/aletheia/<uuid>/<n>` : AUCUN
    //    préfixe statique ne la décrit, elle ne peut être servie que par le plus
    //    COURT, celui de la racine. C'est ce qui rend l'ordre de Louis (Livres
    //    en tête, gardant la racine) techniquement le plus sûr : Livres attrape
    //    par défaut, et les deux autres onglets se déclarent par leurs préfixes.
    //
    // ⚠️ SINGULIER / PLURIEL À UN CARACTÈRE PRÈS, et il faut le lire deux fois.
    //    Le déroulé posé par C5-L2 est `…/aletheia/exercice/<depotId>` — AU
    //    SINGULIER, et il ne bouge pas. L'onglet, lui, est `…/aletheia/exercices`
    //    — AU PLURIEL. `ongletActifParRoute` s'en sort (`===` est faux, et
    //    `startsWith(base + '/')` aussi, dans les deux sens : le caractère qui
    //    suit `…/exercice` est `s`, pas `/`), mais un humain qui relit ce
    //    fichier, lui, peut s'y tromper — d'où cette note.
    //
    // ⚠️ Pilotés par la ROUTE, jamais par `?vue=` : `?vue=` est absent d'une
    //    route de détail, et `vueDefaut` allumerait « Livres » au-dessus d'une
    //    passation en classe. Les deux mécaniques ne se mélangent pas dans un
    //    même module (`SousNavModuleMobile` choisit par `onglets.some(o => !!o.vue)`).
    sousOngletsEleve: [
      { href: '/eleve/modules/aletheia', label: 'Livres' },
      {
        href: '/eleve/modules/aletheia/exercices',
        label: 'Exercices',
        prefixes: ['/eleve/modules/aletheia/exercice'],
      },
      {
        href: '/eleve/modules/aletheia/examens',
        label: 'Examens',
        prefixes: ['/eleve/modules/aletheia/passation'],
      },
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
    // C4-L6 — « Codex prend DEUX onglets de chaque côté, et ce ne sont pas les
    // mêmes » (`07-` §2). Côté professeur : Exercices et Paramètres — « TOUS LES
    // EXERCICES VIVENT SOUS UN SEUL ONGLET ». « Validation » n'est donc plus un
    // onglet : sa file reste un écran, atteint depuis Exercices. Et « Synthèses »
    // disparaît avec lui — l'onglet range des exercices, la chose qu'il crée
    // garde son nom, « la synthèse en classe » (`01-` §10).
    //
    // ⚠️ Les `prefixes` sont ce qui empêche l'onglet de SAUTER quand le
    //    professeur clique une ligne de sa propre liste : sans eux, les cinq
    //    routes filles tomberaient sur l'onglet racine, qui matche tout par
    //    préfixe. Elles sont ici au complet, et le parcours de revue d'une
    //    synthèse rendue (liste → séance → V1 → validation) les traverse toutes.
    sousOngletsProf: [
      {
        href: '/prof/codex',
        label: 'Exercices',
        prefixes: [
          '/prof/codex/synthese',
          '/prof/codex/validation',
          '/prof/codex/travail',
          '/prof/codex/passation',
          '/prof/codex/examen-diagnostique',
        ],
      },
      { href: '/prof/codex/parametres', label: 'Paramètres' },
    ],
    // C4-L6 — côté élève : Exercices, où il passe ce qui lui est donné, et
    // Examens, où vivent la synthèse en classe et les examens diagnostiques.
    // ⭐ Le partage n'est pas arbitraire : c'est la table du `06-` §1 —
    //    « écriture formative, À LA MAISON, à l'écran » → Exercices ; « écriture
    //    diagnostique, EN CLASSE, manuscrit → photos → transcription » →
    //    Examens. Et la synthèse en classe est en classe (`01-` §10).
    //
    // ⚠️ Pilotés par la ROUTE, jamais par `?vue=`, et le motif est le même que
    //    côté prof : les trois écrans de détail (`exercice/<id>`,
    //    `passation/<id>`, `synthese/<id>`) doivent allumer LEUR onglet. Un
    //    pilotage par paramètre ne le peut pas — `?vue=` est absent d'une route
    //    de détail, et `vueDefaut` allumerait « Exercices » au-dessus d'une
    //    passation en classe. Les deux mécaniques ne se mélangent pas dans un
    //    même module (`SousNavModuleMobile` choisit par `onglets.some(o => !!o.vue)`).
    sousOngletsEleve: [
      {
        href: '/eleve/modules/codex',
        label: 'Exercices',
        prefixes: ['/eleve/modules/codex/exercice'],
      },
      {
        href: '/eleve/modules/codex/examens',
        label: 'Examens',
        prefixes: ['/eleve/modules/codex/passation', '/eleve/modules/codex/synthese'],
      },
    ],
  },
  {
    cle: 'fragments',
    prefixeProf: '/prof/fragments-erudition',
    prefixeEleve: '/eleve/modules/fragments-erudition',
    // 03/09 — « Vestigia » à l'écran (Louis) ; le slug et la base gardent « fragments ».
    nom: 'Vestigia',
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
    // C8·L3 — quatre onglets (règle R8) : « Vue d'ensemble » + « Thèmes » fusionnent
    // en Suivi ; « Essais » + « Synthèses » se rangent sous Évaluations (toggle interne
    // `?vue=essai|synthese`, pas un onglet). Les écrans de détail restent où ils sont et
    // allument leur onglet parent par `prefixes`.
    sousOngletsProf: [
      {
        href: '/prof/fragments-erudition',
        label: 'Semaine',
        prefixes: [
          '/prof/fragments-erudition/semaine',
          '/prof/fragments-erudition/analyse',
          '/prof/fragments-erudition/presentation',
        ],
      },
      {
        href: '/prof/fragments-erudition/suivi',
        label: 'Suivi',
        prefixes: ['/prof/fragments-erudition/eleve'],
      },
      {
        href: '/prof/fragments-erudition/evaluations',
        label: 'Évaluations',
        // C6-L4 — la passation (chaîne de mesure) d'un essai s'y pose aussi.
        prefixes: ['/prof/fragments-erudition/essais', '/prof/fragments-erudition/depots', '/prof/fragments-erudition/passation'],
      },
      { href: '/prof/fragments-erudition/parametres', label: 'Paramètres' },
    ],
    // C8·L3 — face élève : trois onglets pilotés par `?vue=` (même mécanique que
    // Scriptorium). Le bilan de semestre est un QUATRIÈME onglet conditionnel, ajouté
    // à l'exécution quand une synthèse est publiée (cf. ONGLET_SYNTHESE_ELEVE).
    sousOngletsEleve: [
      { href: '/eleve/modules/fragments-erudition?vue=ecrit', label: 'Écrit', vue: 'ecrit', vues: ['ecrit'], parDefaut: true },
      { href: '/eleve/modules/fragments-erudition?vue=oral', label: 'Oral', vue: 'oral', vues: ['oral'] },
      { href: '/eleve/modules/fragments-erudition?vue=essai', label: 'Essai', vue: 'essai', vues: ['essai'] },
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
    // C7·L2 — de cinq onglets à trois (règle R8). « Diagnostic » quitte la barre :
    // l'écran est doublement muet (il demande des unités disparues et agrège sur
    // `scope_unites`, que les quiz d'aujourd'hui laissent vide) et le plan le range
    // dans la matrice de C6 — sa page reste en place, à reprendre là-bas.
    // « Semestre » se replie sous Quizz : ses notes ne viennent que des quiz fermés,
    // et `prefixes` garde l'onglet Quizz allumé quand on y est.
    sousOngletsProf: [
      { href: '/prof/quazian', label: 'Flashcards' },
      { href: '/prof/quazian/quizz', label: 'Quizz', prefixes: ['/prof/quazian/semestre'] },
      { href: '/prof/quazian/parametres', label: 'Paramètres' },
    ],
    // C7·L2 — face élève : deux onglets pilotés par `?vue=` (même mécanique que
    // Fragments élève). Les deux zones de l'écran d'accueil deviennent les deux
    // onglets ; « Semaine » n'a jamais existé ici.
    sousOngletsEleve: [
      { href: '/eleve/modules/quazian?vue=flashcards', label: 'Flashcards', vue: 'flashcards', vues: ['flashcards'], parDefaut: true },
      { href: '/eleve/modules/quazian?vue=quizz', label: 'Quizz', vue: 'quizz', vues: ['quizz'] },
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
    // 4 onglets ; `vues` regroupe les sous-vues qui allument l'onglet parent.
    sousOngletsProf: [
      { href: '/prof/scriptorium?vue=classes',    label: 'Classes',    vue: 'classes',    vues: ['classes'] },
      { href: '/prof/scriptorium?vue=parcours',   label: 'Parcours',   vue: 'parcours',   vues: ['parcours', 'evaluations', 'modeles'] },
      { href: '/prof/scriptorium?vue=ressources', label: 'Ressources', vue: 'ressources', vues: ['ressources', 'textes', 'cours', 'livres'] },
      { href: '/prof/scriptorium?vue=parametres', label: 'Paramètres', vue: 'parametres', vues: ['parametres'] },
    ],
    // Face élève (C2.2) : « Plan de cours » et « Discussion » — même mécanique
    // `?vue=` que le prof. Ordre d'affichage : le plan d'abord ; vue par défaut
    // (URL sans `?vue=`) : la discussion, l'usage quotidien.
    sousOngletsEleve: [
      { href: '/eleve/modules/scriptorium?vue=plan',       label: 'Plan de cours', vue: 'plan',       vues: ['plan'] },
      { href: '/eleve/modules/scriptorium?vue=discussion', label: 'Discussion',    vue: 'discussion', vues: ['discussion'], parDefaut: true },
    ],
  },
]

/**
 * Onglet élève CONDITIONNEL de Fragments (C8·L3) : le bilan de semestre n'a de
 * surface que si une synthèse est publiée pour l'élève. Il est ajouté aux trois
 * onglets fixes à l'exécution (cf. components/nav/OngletsFragmentsEleve.tsx).
 */
export const ONGLET_SYNTHESE_ELEVE: SousOnglet = {
  href: '/eleve/modules/fragments-erudition?vue=synthese',
  label: 'Synthèse',
  vue: 'synthese',
  vues: ['synthese'],
}

/**
 * Onglet actif quand les onglets sont pilotés par la ROUTE : le plus long préfixe
 * qui matche, `href` et `prefixes` confondus. Sans `prefixes`, un onglet racine
 * (`/prof/fragments-erudition`) matcherait toutes ses routes filles.
 * Partagé par la Barre 2 (desktop) et la sous-nav mobile.
 */
export function ongletActifParRoute(onglets: SousOnglet[], pathname: string): string | null {
  let actif: string | null = null
  let longueur = -1
  for (const o of onglets) {
    for (const candidat of [o.href, ...(o.prefixes ?? [])]) {
      const base = candidat.split('?')[0]
      const match = pathname === base || pathname.startsWith(base + '/')
      if (match && base.length > longueur) {
        actif = o.href
        longueur = base.length
      }
    }
  }
  return actif
}

/** Devise de la maison (hors module). Rendue tout en petites capitales, sans partie française. */
export const DEVISE_MAISON: DeviseMonde = {
  latin: 'Verba Volant, Scripta Manent, Sapientia Permanet',
  francais: '',
}

/**
 * Sous-onglets du module POUR UN RÔLE — source unique de la Barre 2. Élève sans
 * `sousOngletsEleve` → [] (aucun sous-onglet : le comportement de tous les
 * modules sauf Scriptorium).
 */
export function sousOngletsPour(mod: ModuleConfig, role: 'prof' | 'eleve'): SousOnglet[] {
  return (role === 'prof' ? mod.sousOngletsProf : mod.sousOngletsEleve) ?? []
}

/** Vue active quand `?vue=` est absent : l'onglet `parDefaut`, sinon le premier. */
export function vueDefaut(onglets: SousOnglet[]): string | undefined {
  return (onglets.find((o) => o.parDefaut) ?? onglets[0])?.vue
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
