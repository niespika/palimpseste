// ============================================================================
// C4 · L3 — LE BALISAGE DE LA CONSIGNE : un rendu markdown RESTREINT.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⭐ DÉCISION DE LOUIS — **LE BALISAGE MARKDOWN DES 336 CONSIGNES SE REND À
//    L'ÉCRAN. Il ne se nettoie pas : le gras est du SENS, pas de la
//    décoration.** Les consignes de `exercices_consignes_isolees` portent
//    toutes du `**gras**`, et il y porte l'essentiel : « Ici **la raison
//    manque** — un connecteur en tient lieu » (`04-` §1, cran 4) désigne le
//    défaut par le gras. Aujourd'hui l'élève voit littéralement les
//    astérisques. Coût assumé : **un rendu markdown restreint — GRAS ET
//    ITALIQUE SEULEMENT.**
//
// ⚠️ ⚠️ CE RENDU S'APPLIQUE **À LA CONSIGNE SEULE**. Jamais au matériau, jamais
//    au guide, jamais au texte d'auteur : ceux-là « s'affichent TELS QU'ILS
//    SONT STOCKÉS » (piège 33 de C4-L8) et restent en `whitespace-pre-wrap`
//    brut. Baliser un extrait d'auteur, ce serait retoucher la source sur
//    laquelle la compétence se mesure.
//
// ⭐ LE MODULE NE PRODUIT **AUCUN HTML ET AUCUNE CHAÎNE BALISÉE** : il rend des
//    JETONS, et c'est le composant React qui les met en `<strong>` / `<em>`.
//    C'est la raison de vivre de ce découpage — le dépôt n'a **zéro**
//    `dangerouslySetInnerHTML` (vérifié), et sans lui **il n'y a aucune surface
//    d'injection**. Or la consigne vient d'un IMPORT DE FICHIER (`08-` §5.2),
//    donc d'une source qu'on ne contrôle pas entièrement : une consigne qui
//    porterait `<script>` doit ressortir en TEXTE, et le seul moyen de le
//    garantir structurellement est de ne jamais fabriquer de balise ici.
//    Une fonction qui rendrait `'<strong>…</strong>'` rouvrirait la porte le
//    jour où quelqu'un la passerait à `dangerouslySetInnerHTML`.
//
// ⚠️ LES RETOURS À LA LIGNE SE PRÉSERVENT — un `\n` devient un jeton `saut`.
//    C'est capital : « le découpage se conserve DE BOUT EN BOUT » (`07-` §3 ;
//    `06-` §4), et un rendu qui écraserait les sauts serait un tueur
//    silencieux — la consigne perdrait ses paragraphes sans que rien ne le
//    signale. On normalise donc d'abord les CRLF (`normaliserRetours`, du
//    piège CRLF des `<textarea>` de C4-L4), puis on émet un `saut` par `\n`.
//
// LA RESTRICTION, EXACTEMENT : `**x**` → gras · `*x*` et `_x_` → italique ·
// `***x***` → gras_italique. **RIEN D'AUTRE.** Les titres, les listes, les
// liens, les images, les blocs de code, les citations restent du TEXTE
// LITTÉRAL — et ⚠️ **les backticks ne sont pas du balisage ici** : ils
// s'affichent tels quels, la restriction étant « gras et italique SEULEMENT ».
// Le backslash n'échappe rien non plus : il n'y a rien à échapper.
// ============================================================================

import { normaliserRetours } from '../passation/transcription-calcul'

/** Les trois styles que le rendu restreint connaît — la liste est FERMÉE. */
export const STYLES = ['gras', 'italique', 'gras_italique'] as const
export type StyleBalise = (typeof STYLES)[number]

/**
 * Ce que le parseur rend, et tout ce qu'il rend.
 *
 * ⚠️ Aucun jeton ne porte de HTML ni de chaîne balisée : `texte` est du texte
 *    NU, tel qu'il sera passé à un nœud texte React (donc échappé par React
 *    lui-même). `saut` ne porte rien du tout — c'est un `<br />` ou une
 *    rupture de flux, au choix du composant.
 */
export type Jeton =
  | { type: 'texte'; texte: string }
  | { type: 'gras'; texte: string }
  | { type: 'italique'; texte: string }
  | { type: 'gras_italique'; texte: string }
  | { type: 'saut' }

// ── Le flanquement, ou pourquoi une puce n'est pas une italique ─────────────

/** Un peloton de délimiteurs identiques et contigus : `*`, `**`, `***`, `_`. */
interface Peloton {
  debut: number
  longueur: number
  caractere: '*' | '_'
}

const BLANC = /\s/
/** Lettres et chiffres, accents français compris — sert la règle du souligné. */
const ALPHANUMERIQUE = /[0-9A-Za-zÀ-ÖØ-öø-ÿ]/

function estBlanc(c: string | undefined): boolean {
  return c === undefined || BLANC.test(c)
}

function estAlphanumerique(c: string | undefined): boolean {
  return c !== undefined && ALPHANUMERIQUE.test(c)
}

/** Le peloton qui commence à `i`, s'il y en a un. */
function pelotonA(texte: string, i: number): Peloton | null {
  const c = texte[i]
  if (c !== '*' && c !== '_') return null
  let j = i
  while (j < texte.length && texte[j] === c) j++
  return { debut: i, longueur: j - i, caractere: c }
}

/**
 * ⭐ LES LONGUEURS RECEVABLES — la restriction, prise au mot.
 *
 * Pour l'astérisque : 1, 2 ou 3, et pas davantage. **Un peloton de QUATRE
 * astérisques ou plus n'est pas un délimiteur** et reste littéral — il ne
 * correspond à rien de ce que la décision autorise, et le deviner reviendrait
 * à inventer une règle que la source ne porte pas.
 *
 * Pour le souligné : UN, exactement. `_x_` est de l'italique ; `__x__` n'est
 * **pas** du gras — « `**x**` → gras », et rien d'autre.
 */
function longueurRecevable(p: Peloton): boolean {
  return p.caractere === '_' ? p.longueur === 1 : p.longueur <= 3
}

/**
 * ⭐ UN DÉLIMITEUR SUIVI D'UNE ESPACE N'OUVRE RIEN.
 *
 * C'est la règle de flanquement de CommonMark, et c'est elle qui tient la
 * promesse « les listes restent du TEXTE LITTÉRAL » : dans
 * `* premier point\n* second point`, chaque `*` est suivi d'une espace, donc
 * aucun n'ouvre — sans quoi les deux puces s'apparieraient et l'écran
 * italiserait la première ligne entière.
 *
 * ⚠️ Le souligné porte une borne de plus : **il n'ouvre pas À L'INTÉRIEUR D'UN
 *    MOT.** Sans elle, une consigne qui nomme un observable —
 *    `garant_present`, `observable_isole_code` — verrait son milieu passer en
 *    italique. Le nom de l'observable est du SENS lui aussi : on ne le coupe
 *    pas en deux.
 */
function peutOuvrir(texte: string, p: Peloton): boolean {
  if (estBlanc(texte[p.debut + p.longueur])) return false
  if (p.caractere === '_' && estAlphanumerique(texte[p.debut - 1])) return false
  return true
}

/** Le pendant : un délimiteur précédé d'une espace ne ferme rien. */
function peutFermer(texte: string, p: Peloton): boolean {
  if (p.debut === 0 || estBlanc(texte[p.debut - 1])) return false
  if (p.caractere === '_' && estAlphanumerique(texte[p.debut + p.longueur])) return false
  return true
}

/**
 * ⭐ LE BALISAGE NE TRAVERSE PAS UN SAUT DE LIGNE, et **pas d'imbrication
 *    autre que `***`** : le contenu d'un peloton se prend LITTÉRALEMENT.
 *
 * Deux choix, et leurs raisons :
 *   · **fermeture sur la même ligne, ou rien.** Un `**` égaré en fin de ligne
 *     ne doit pas avaler le paragraphe suivant. C'est la même famille de
 *     dégât que le piège CRLF de C4-L4 — silencieux, et visible seulement à
 *     l'écran de l'élève.
 *   · **contenu littéral.** `**gras avec *italique* dedans**` rend LE TOUT EN
 *     GRAS, les astérisques internes affichés tels quels. On ne récurse pas :
 *     la décision dit « gras et italique seulement », pas « gras et italique
 *     imbriqués », et un parseur récursif serait une seconde grammaire à
 *     maintenir pour un cas que les 336 consignes ne produisent pas.
 *
 * @returns l'index où le peloton fermant commence, ou `null` s'il n'y en a pas.
 */
function chercherFermeture(texte: string, ouvrant: Peloton): number | null {
  let i = ouvrant.debut + ouvrant.longueur
  while (i < texte.length) {
    const c = texte[i]
    if (c === '\n') return null                    // on ne traverse pas la ligne
    if (c !== ouvrant.caractere) { i++; continue }
    // `c` vaut le caractère du peloton ouvrant : `pelotonA` rend forcément un
    // peloton ici. Le test de nullité est pour le compilateur, pas pour le cas.
    const p = pelotonA(texte, i)
    if (p === null) { i++; continue }
    if (p.longueur === ouvrant.longueur && peutFermer(texte, p)) return p.debut
    i += p.longueur
  }
  return null
}

function styleDuPeloton(p: Peloton): StyleBalise {
  if (p.caractere === '_') return 'italique'
  if (p.longueur === 3) return 'gras_italique'
  return p.longueur === 2 ? 'gras' : 'italique'
}

/**
 * ⭐ LE RENDU RESTREINT DE LA CONSIGNE, en JETONS — jamais en HTML.
 *
 * Met en œuvre la décision de Louis (piège 36) : « le balisage markdown des
 * 336 consignes SE REND à l'écran ; le gras est du SENS, pas de la
 * décoration », au prix d'un rendu markdown restreint au gras et à l'italique.
 *
 * ⚠️ **À LA CONSIGNE SEULE.** Le matériau, le guide et le texte d'auteur
 *    « s'affichent tels qu'ils sont stockés » (piège 33 de C4-L8).
 *
 * ⚠️ Un délimiteur NON FERMÉ reste du texte littéral, astérisques comprises :
 *    « il a dit **bonjour » s'affiche avec ses deux astérisques. On n'invente
 *    pas la fermeture que l'auteur n'a pas écrite.
 *
 * @param source la consigne, telle que `exercices_instances.consigne_instanciee`
 *               la porte — CRLF possibles, ils sont normalisés d'entrée.
 * @returns la suite des jetons, dans l'ordre du texte ; les fragments de texte
 *          contigus sont fusionnés, et un `\n` donne exactement un `saut`.
 */
export function baliser(source: string): Jeton[] {
  const texte = normaliserRetours(source)
  const jetons: Jeton[] = []
  let tampon = ''

  const poserLeTampon = () => {
    if (tampon !== '') { jetons.push({ type: 'texte', texte: tampon }); tampon = '' }
  }

  let i = 0
  while (i < texte.length) {
    const c = texte[i]

    // Le saut de ligne : un jeton à lui seul, et le découpage survit.
    if (c === '\n') { poserLeTampon(); jetons.push({ type: 'saut' }); i++; continue }

    const p = pelotonA(texte, i)
    if (p === null) { tampon += c; i++; continue }

    // Un peloton qui n'ouvre pas — trop long, suivi d'une espace, ou souligné
    // au milieu d'un mot — passe ENTIER au littéral : on ne le re-scanne pas
    // caractère par caractère, sinon `****` s'y relirait comme `**` + `**`.
    if (!longueurRecevable(p) || !peutOuvrir(texte, p)) {
      tampon += texte.slice(i, i + p.longueur)
      i += p.longueur
      continue
    }

    const fermeture = chercherFermeture(texte, p)
    if (fermeture === null) {
      // ⚠️ Non fermé = littéral. C'est le cas de « il a dit **bonjour ».
      tampon += texte.slice(i, i + p.longueur)
      i += p.longueur
      continue
    }

    poserLeTampon()
    jetons.push({
      type: styleDuPeloton(p),
      texte: texte.slice(p.debut + p.longueur, fermeture),
    })
    i = fermeture + p.longueur
  }

  poserLeTampon()
  return jetons
}

/**
 * La même chaîne, SANS le balisage — pour un `aria-label`, un `title`, ou une
 * comparaison de deux consignes qui ne doit pas buter sur les astérisques.
 *
 * ⚠️ Elle se dérive de `baliser`, elle ne re-parse rien : deux grammaires qui
 *    divergeraient donneraient un `aria-label` différent de ce que l'œil lit,
 *    et le lecteur d'écran entendrait une autre consigne que la classe.
 */
export function texteNu(source: string): string {
  return baliser(source).map((j) => (j.type === 'saut' ? '\n' : j.texte)).join('')
}

/**
 * La consigne porte-t-elle du balisage à rendre ? Utile au professeur, pour
 * distinguer « rien à rendre » de « rendu vide » — jamais pour décider s'il
 * faut appeler `baliser` : on l'appelle toujours, ne serait-ce que pour les
 * sauts de ligne.
 */
export function porteDuBalisage(source: string): boolean {
  return baliser(source).some((j) => j.type !== 'texte' && j.type !== 'saut')
}
