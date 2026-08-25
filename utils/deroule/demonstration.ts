// ============================================================================
// C4 · L3 — LE CHOIX DE LA DÉMONSTRATION DU TEMPS 1.
// Module PUR. Il ne lit rien en base : on lui DONNE les candidates (déjà
// filtrées `actif` / `statut` par l'appelant), le contexte de l'exercice servi
// et l'appariement forme × grain de la doctrine ; il rend LA démonstration à
// servir, ou l'avertissement qui en tient lieu.
// ----------------------------------------------------------------------------
// CE QUE LA SOURCE COMMANDE, ET RIEN DE PLUS :
//
//  1. LA FORME SUIT LE GRAIN — « au `micro`, l'EXEMPLE ; au `meso`, un MODELAGE
//     du processus ; au `macro`, une CHECKLIST de planification » (`06-` §2).
//     ⚠️ L'appariement N'EST PAS RECOPIÉ ICI : il vit en base
//        (`demonstrations_formes`), `utils/fabrique/doctrine.ts` l'expose en
//        `Doctrine.formesDemonstration`, et ce module le REÇOIT EN ARGUMENT.
//        Le recopier en ferait un second domicile, et le jour où la doctrine
//        bouge l'écran servirait l'ancien appariement sans que rien ne le dise.
//     ⚠️ Une forme au mauvais grain est un SIGNALEMENT, JAMAIS UN REFUS — c'est
//        déjà la règle à l'import (`verifie-import.ts`, signalement du `08-`
//        §7.3) : « la progression décrite au `06-` §2 déborde l'appariement ».
//        Le filtre PRÉFÈRE donc la forme du grain ; il ne rend pas vide quand la
//        seule démonstration disponible est d'une autre forme.
//
//  2. ⭐ LA PARADE À L'IMITATION DE SURFACE — « les exemples portent TOUJOURS
//     sur un AUTRE THÈME que l'exercice du jour » (`06-` §2). ⭐ DÉCISION DU PO
//     DU 22/08 : la comparaison se fait sur le RATTACHEMENT AU COURS et sur les
//     NOTIONS — le `theme` est du texte libre et l'instance n'en porte aucun, la
//     règle n'était donc vérifiable par rien. Une démonstration est ÉCARTÉE si
//     elle partage le cours de l'exercice, OU NE SERAIT-CE QU'UNE de ses
//     notions (`c4_l3_deroule.sql` §3).
//     ⚠️⚠️ NULL N'EST PAS LE TABLEAU VIDE. `NULL` = « ne déclare rien » ; `{}` =
//        « déclare n'avoir aucune notion ». ⭐ Décision du PO : une démonstration
//        qui NE DÉCLARE RIEN n'est pas écartable — elle est SERVIE, et le
//        professeur en est AVERTI, la parade n'ayant pas pu être vérifiée sur
//        elle. Une démonstration qui déclare `{}` ne partage rien : elle passe
//        le filtre normalement, sans avertissement.
//
//  3. ABSENTE, LE TEMPS 1 S'EN PASSE ET LE PROFESSEUR EN EST AVERTI — « une
//     trace serveur en tient lieu, RIEN NE S'ENGENDRE À SA PLACE » (`07-` §1.1
//     et §2, C4-L8). L'écran LIT les démonstrations, il n'en FABRIQUE aucune :
//     c'est pourquoi ce module ne rend jamais autre chose qu'une candidate
//     reçue, et pourquoi son second champ est un avertissement et non un repli.
//
//  4. ⚠️ LA DÉMONSTRATION N'EST PAS LE `guide` DE L'APPUI (`02-` §2.3.4).
//     DEUX OBJETS, DEUX MÉCANISMES, à ne pas fusionner :
//       · le `guide` est DÉCLARÉ PAR LE CRAN (complet quand l'appui est donné,
//         léger quand il est nommé, rien quand il est absent), il est SAISI À LA
//         CONCEPTION de l'exercice, et il porte sur LA MATIÈRE MÊME de
//         l'exercice — c'est tout son intérêt : il aide à produire CE texte-là ;
//       · la démonstration est DÉPOSÉE À LA FABRIQUE par compétence × grain
//         (`07-` §1.1), elle est élue par le temps 1, et elle porte
//         OBLIGATOIREMENT SUR UN AUTRE THÈME — c'est tout son intérêt : un
//         exemple sur le thème du jour n'enseignerait que l'imitation.
//     Ils se servent tous deux AVANT la v1, et c'est leur seule parenté. Fondre
//     l'un dans l'autre ferait servir un guide « sur un autre thème » (absurde)
//     ou une démonstration « sur la matière même » (la parade défaite).
// ============================================================================

import { melerAvecGraine } from './credence'
import type { Grain } from './types'

/**
 * Une démonstration telle que `exercices_demonstrations` la porte, lue par
 * l'appelant (`07-` §1.1).
 *
 * ⚠️ `actif` et le statut de la fiche sont DÉJÀ APPLIQUÉS par l'appelant : ce
 *    module ne les voit pas et n'y touche pas. Il ne filtre que sur la parade
 *    et n'ordonne que sur la forme — lui faire porter l'activité en ferait un
 *    second lieu de vérité, et une démonstration désactivée pourrait passer
 *    selon la porte d'entrée empruntée.
 */
export interface DemonstrationLue {
  id: string
  competence: string
  grain: string
  forme: string
  theme: string
  contenu: unknown
  /** ⚠️ `null` = NON DÉCLARÉ (non écartable, servie + avertie) ; `[]` = déclaré sans cours. */
  cours_declares: string[] | null
  /** ⚠️ `null` = NON DÉCLARÉ (non écartable, servie + avertie) ; `[]` = déclaré sans notion. */
  notions: string[] | null
}

/**
 * Ce que l'exercice servi porte, et sur quoi la parade compare
 * (`exercices_sujets.notions`, `exercices_sujets_cours`,
 * `exercices_textes_cours` — rassemblés par l'appelant).
 */
export interface ContexteDeLExercice {
  grain: Grain
  /** Le rattachement au cours de l'exercice servi. */
  cours: string[]
  /** Ses notions. */
  notions: string[]
}

/** Ce que le temps 1 sert, et ce que la trace serveur retient. */
export interface ChoixDeDemonstration {
  demonstration: DemonstrationLue | null
  /** Pourquoi il n'y en a pas, ou ce que le professeur doit savoir. Trace serveur. */
  avertissement: string | null
  /**
   * Les démonstrations écartées, avec leur motif — pour la trace, jamais pour
   * l'élève. ⚠️ N'y figurent QUE les éliminations de la parade : une candidate
   * qui passe la parade mais n'est pas élue n'est pas écartée — elle reste
   * servable, et le sera peut-être au prochain exercice.
   */
  ecartees: Array<{ id: string; motif: string }>
}

/**
 * ⚠️ LA NORMALISATION EST EXACTEMENT CELLE-CI : la casse repliée, les espaces
 *    de bord rognés. RIEN DE PLUS.
 *
 * Pas de sous-chaîne, pas de distance d'édition, pas de repli d'accents — une
 * ÉGALITÉ NORMALISÉE, et c'est tout. Le motif est asymétrique et il tranche :
 * un rapprochement approximatif ÉCARTE À TORT, et écarter à tort PRIVE L'ÉLÈVE
 * DE SA DÉMONSTRATION EN SILENCE — « L'ironie » et « l'ironie tragique » sont
 * deux notions, « Baudelaire » n'est pas « Baudelaire, Spleen » ; à l'inverse,
 * laisser passer un partage non déclaré coûte, au pire, un exemple trop proche,
 * que le professeur voit. On préfère donc le faux négatif au faux positif.
 *
 * ⛔⛔ NE PAS LA REMPLACER PAR `cleDAppariement()` DE `utils/fabrique/notions.ts`
 * — AJOUTÉ PAR C4-L16, QUI A ÉCRIT L'AUTRE. Depuis le format 1.3, le dépôt porte
 * un SECOND appariement sur `exercices_sujets.notions` : celui du rattachement
 * au cours, qui replie les accents ET retire l'article initial. **Les deux
 * doivent rester différentes, parce que l'asymétrie de risque y est INVERSE** :
 * là-bas, ne pas apparier rend le sujet muet POUR TOUJOURS et rien ne le dit —
 * le faux négatif est le défaut à éviter, on replie donc largement ; **ici,
 * apparier à tort PRIVE L'ÉLÈVE, en silence** — le faux positif est le défaut à
 * éviter, on replie donc au minimum. Deux règles opposées sur la même colonne,
 * dans le même dépôt : c'est un choix, pas un oubli. *Le même avertissement est
 * posé à l'autre bout.*
 */
function replie(x: string): string {
  return x.trim().toLowerCase()
}

/** L'ensemble normalisé d'une liste déclarée — les entrées vides ne comptent pas. */
function ensemble(liste: readonly string[]): Set<string> {
  const s = new Set<string>()
  for (const x of liste) {
    if (typeof x !== 'string') continue
    const r = replie(x)
    if (r !== '') s.add(r)
  }
  return s
}

/**
 * L'INVERSE DE LA TABLE : quelle forme le `06-` §2 attend à ce grain ?
 *
 * « Au `micro`, l'EXEMPLE ; au `meso`, un MODELAGE du processus ; au `macro`,
 * une CHECKLIST de planification » — l'appariement vit en base
 * (`demonstrations_formes`) et arrive ici par `Doctrine.formesDemonstration`,
 * qui l'indexe FORME → GRAIN. On le retourne ; on ne le recopie pas.
 *
 * @returns la forme attendue, ou `null` si la table ne dit rien de ce grain —
 *          auquel cas AUCUNE forme n'est préférée, et rien n'est refusé pour
 *          autant : une table muette n'est pas une interdiction.
 *
 * ⚠️ Si plusieurs formes revendiquaient le même grain — la doctrine en déclare
 *    UNE par grain —, on prend la première dans l'ordre alphabétique : un choix
 *    ARBITRAIRE MAIS STABLE vaut mieux qu'un choix dépendant de l'ordre des
 *    clés, qui ferait varier l'écran d'un chargement à l'autre.
 */
export function formeAttendue(
  grain: string,
  formesParGrain: Readonly<Record<string, string>>,
): string | null {
  const vise = replie(grain)
  const formes = Object.entries(formesParGrain)
    .filter(([, g]) => typeof g === 'string' && replie(g) === vise)
    .map(([forme]) => forme)
    .sort((a, b) => a.localeCompare(b))
  return formes[0] ?? null
}

/**
 * Ce que la parade reproche à une démonstration, ou `null` si elle passe.
 *
 * « Écartée si elle partage le cours de l'exercice, OU NE SERAIT-CE QU'UNE de
 * ses notions » (décision du PO du 22/08 ; `c4_l3_deroule.sql` §3).
 *
 * ⚠️ Un axe NON DÉCLARÉ (`null`) n'écarte JAMAIS : « ne déclare rien » n'est pas
 *    « ne partage rien », mais ce n'est pas non plus « partage » — on ne
 *    condamne pas sur un silence. L'axe déclaré vide (`[]`) est, lui, une
 *    déclaration pleine et entière : il ne partage rien, et il passe.
 */
function motifDEcart(
  demonstration: DemonstrationLue,
  coursDeLExercice: Set<string>,
  notionsDeLExercice: Set<string>,
): string | null {
  const partages: string[] = []

  if (demonstration.cours_declares !== null) {
    for (const c of demonstration.cours_declares) {
      if (typeof c === 'string' && coursDeLExercice.has(replie(c))) {
        partages.push(`le cours « ${c.trim()} »`)
      }
    }
  }
  if (demonstration.notions !== null) {
    for (const n of demonstration.notions) {
      if (typeof n === 'string' && notionsDeLExercice.has(replie(n))) {
        partages.push(`la notion « ${n.trim()} »`)
      }
    }
  }

  if (partages.length === 0) return null
  return `partage avec l'exercice du jour ${partages.join(' · ')} — « les exemples portent `
    + 'TOUJOURS sur un autre thème que l\'exercice du jour » (`06-` §2)'
}

/** Un axe non déclaré, dit en clair pour la trace. */
function axesNonDeclares(d: DemonstrationLue): string[] {
  const manquants: string[] = []
  if (d.cours_declares === null) manquants.push('son rattachement au cours')
  if (d.notions === null) manquants.push('ses notions')
  return manquants
}

/**
 * ⭐ LA DÉMONSTRATION QUE LE TEMPS 1 SERT — ou l'avertissement qui en tient lieu.
 *
 * L'ordre, dans cet ordre :
 *   1. LA PARADE écarte — le partage d'un cours ou d'une seule notion suffit
 *      (`06-` §2 ; décision du PO du 22/08) ;
 *   2. LA FORME DU GRAIN est PRÉFÉRÉE, jamais exigée — une forme au mauvais
 *      grain est un signalement, « la progression déborde l'appariement » ;
 *   3. LE DÉPARTAGE EST DÉTERMINISTE, semé sur `semence` (le dépôt).
 *
 * ⚠️ POURQUOI DÉTERMINISTE, ET POURQUOI SEMÉ SUR LE DÉPÔT : un rechargement ne
 *    doit pas changer la démonstration servie. Sinon l'élève en verrait DEUX —
 *    et le compteur d'aide compterait DEUX dépliages pour un seul geste, ce qui
 *    fausserait le faisceau à la place de l'élève.
 * ⚠️ Les candidates sont d'abord remises en ORDRE CANONIQUE (par `id`) : l'ordre
 *    dans lequel la base les rend n'est garanti par rien, et un tirage semé sur
 *    une liste dont l'ordre varie n'est pas déterministe pour autant.
 *
 * @param candidates    les démonstrations lisibles pour cette compétence × ce
 *                      grain. ⚠️ `actif` et `statut` sont DÉJÀ APPLIQUÉS par
 *                      l'appelant — ce module n'y touche pas.
 * @param contexte      ce que l'exercice servi porte : son grain, son cours,
 *                      ses notions.
 * @param formesParGrain l'appariement de la doctrine, FORME → GRAIN
 *                      (`Doctrine.formesDemonstration`) — reçu, jamais recopié.
 * @param semence       l'identifiant du dépôt : le départage en dépend, et de
 *                      lui seul.
 */
export function choisirLaDemonstration(
  candidates: readonly DemonstrationLue[],
  contexte: ContexteDeLExercice,
  formesParGrain: Readonly<Record<string, string>>,
  semence: string,
): ChoixDeDemonstration {
  const attendue = formeAttendue(contexte.grain, formesParGrain)
  const avis: string[] = []

  // ── ABSENTE : « le temps 1 s'en passe et le professeur en est averti » ────
  if (candidates.length === 0) {
    return {
      demonstration: null,
      avertissement: `aucune démonstration déposée au grain « ${contexte.grain} » : le temps 1 `
        + 's\'en passe. **Rien ne s\'engendre à sa place** — l\'écran du déroulé les SERT, '
        + 'il n\'en fabrique aucune (`07-` §1.1). Le dépôt se fait à la fabrique (C4-L8).',
      ecartees: [],
    }
  }

  const coursDeLExercice = ensemble(contexte.cours)
  const notionsDeLExercice = ensemble(contexte.notions)

  // ⚠️ L'exercice lui-même peut ne rien déclarer : la parade n'a alors RIEN à
  //    comparer, et son silence n'est pas une garantie. On sert quand même —
  //    refuser priverait l'élève de sa démonstration pour un défaut de saisie
  //    qui n'est pas le sien — et on le dit.
  if (coursDeLExercice.size === 0 && notionsDeLExercice.size === 0) {
    avis.push('l\'exercice servi ne déclare ni cours ni notions : la parade à l\'imitation de '
      + 'surface n\'a rien à comparer et n\'a donc rien pu vérifier')
  }

  // ── 1. LA PARADE ─────────────────────────────────────────────────────────
  const ecartees: Array<{ id: string; motif: string }> = []
  const survivantes: DemonstrationLue[] = []
  for (const d of candidates) {
    const motif = motifDEcart(d, coursDeLExercice, notionsDeLExercice)
    if (motif === null) survivantes.push(d)
    else ecartees.push({ id: d.id, motif })
  }

  if (survivantes.length === 0) {
    return {
      demonstration: null,
      avertissement: `les ${ecartees.length} démonstration(s) disponibles partagent toutes le `
        + 'cours ou une notion de l\'exercice du jour : le temps 1 s\'en passe. En servir une '
        + 'quand même enseignerait l\'imitation de surface, qui est le défaut même que la '
        + 'démonstration doit prévenir (`06-` §2).',
      ecartees,
    }
  }

  // ── 2 et 3. LA FORME PRÉFÉRÉE, PUIS LE DÉPARTAGE SEMÉ ────────────────────
  // L'ordre canonique d'abord (l'ordre de la base n'est garanti par rien), le
  // mêlage semé ensuite, la partition par forme en dernier : `filter` est
  // stable, la préférence de forme ne défait donc pas le tirage.
  const canoniques = [...survivantes].sort((a, b) => a.id.localeCompare(b.id))
  const melees = melerAvecGraine(canoniques, semence)
  const aLaForme = attendue === null
    ? []
    : melees.filter((d) => replie(d.forme) === replie(attendue))
  const elue = aLaForme[0] ?? melees[0]

  // ── Ce que le professeur doit savoir sur celle qui est servie ────────────
  if (attendue === null) {
    avis.push(`l'appariement forme × grain ne déclare rien pour le grain `
      + `« ${contexte.grain} » : aucune forme n'a pu être préférée`)
  } else if (replie(elue.forme) !== replie(attendue)) {
    avis.push(`la démonstration servie est un « ${elue.forme} » là où le grain `
      + `« ${contexte.grain} » attend « ${attendue} » (\`06-\` §2) — SIGNALEMENT, jamais un `
      + 'refus : « la progression déborde l\'appariement »')
  }

  const nonDeclares = axesNonDeclares(elue)
  if (nonDeclares.length > 0) {
    avis.push(`la démonstration servie ne déclare pas ${nonDeclares.join(' ni ')} : la parade à `
      + 'l\'imitation de surface n\'a pas pu être vérifiée sur cet axe. ⚠️ NON DÉCLARÉ n\'est '
      + 'pas « ne partage rien » — elle est servie, et vous en êtes averti (décision du PO).')
  }

  return { demonstration: elue, avertissement: avis.length > 0 ? avis.join(' · ') : null, ecartees }
}

// ── LE CONTENU, ET SES TROIS FORMES ─────────────────────────────────────────

/**
 * Les TROIS formes du `contenu` jsonb, telles que le contrôle d'import les
 * GARANTIT (`utils/fabrique/verifie-import.ts:corpsDemoMalForme` ; `08-` §5 bis).
 * Le champ `forme` discrimine : c'est le même mot que la colonne `forme` porte.
 */
export type ContenuDeDemonstration =
  | { forme: 'exemple'; texte: string; trous: unknown }
  | { forme: 'checklist'; points: string[] }
  | { forme: 'modelage'; volets: Array<Record<string, unknown>> }

const estObjet = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)

const chaineNonVide = (x: unknown): x is string => typeof x === 'string' && x.trim() !== ''

/**
 * LE `contenu` JSONB, RENDU SÛR — ou `null`.
 *
 * Les trois formes que le contrôle d'import garantit et les seules :
 *   · `exemple`   → `{ texte: string, trous?: unknown }` — aucune autre clé ;
 *   · `checklist` → `{ points: string[] }` — non vide, chaque point non vide ;
 *   · `modelage`  → `{ volets: object[] }` — non vide, chaque volet un objet.
 *
 * ⚠️ ON NE RÉPARE RIEN : **mal formé n'est pas absent**. Un `contenu` qui ne va
 *    pas avec sa forme rend `null`, et l'appelant traite ce `null` comme une
 *    démonstration qu'il ne peut pas servir — jamais comme une occasion de
 *    compléter. Une checklist dont on aurait jeté les points vides afficherait
 *    une liste amputée sans que personne ne le sache ; un `texte` fabriqué à
 *    partir d'un `contenu` d'une autre forme ne serait plus la démonstration que
 *    le professeur a déposée. Le contrôle d'import REFUSE déjà ces corps
 *    (`08-` §7.1, refus n° 5) : y arriver ici signale un dépôt entré autrement,
 *    et le seul geste juste est de le dire.
 *
 * ⚠️ Le contrôle d'import lit ce corps sous le nom `corps` dans le fichier
 *    d'import, et la table le stocke en colonne `contenu` : même objet, deux
 *    noms, et la forme est LA MÊME — c'est elle qui fait le contrat.
 */
export function lireLeContenu(forme: string, contenu: unknown): ContenuDeDemonstration | null {
  if (!estObjet(contenu)) return null
  const cles = new Set(Object.keys(contenu))

  if (replie(forme) === 'exemple') {
    const bien = [...cles].every((k) => k === 'texte' || k === 'trous')
      && chaineNonVide(contenu.texte)
    return bien
      ? { forme: 'exemple', texte: contenu.texte as string, trous: contenu.trous ?? null }
      : null
  }

  if (replie(forme) === 'checklist') {
    const points = contenu.points
    const bien = cles.size === 1 && cles.has('points') && Array.isArray(points)
      && points.length > 0 && points.every((p: unknown) => chaineNonVide(p))
    return bien ? { forme: 'checklist', points: [...(points as string[])] } : null
  }

  if (replie(forme) === 'modelage') {
    const volets = contenu.volets
    const bien = cles.size === 1 && cles.has('volets') && Array.isArray(volets)
      && volets.length > 0 && volets.every((x: unknown) => estObjet(x))
    return bien
      ? { forme: 'modelage', volets: volets as Array<Record<string, unknown>> }
      : null
  }

  // Une forme que la doctrine ne déclare pas : on ne devine pas de quoi le
  // corps aurait la forme. `null`, et l'appelant le dit.
  return null
}
