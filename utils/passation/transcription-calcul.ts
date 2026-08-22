// ============================================================================
// C4 · L4 — CE QUI SE CALCULE DANS LA TRANSCRIPTION, ET QUI N'EST PAS UN APPEL.
// ----------------------------------------------------------------------------
// « `confiance_ocr` est LE DÉSACCORD ENTRE DEUX PASSES de transcription,
//   calculé EN CODE, SANS MODÈLE DE JUGEMENT »   — `06-` §4 ; piège 18
//
// Fichier PUR : aucun `server-only`, aucun accès base, aucun appel. Il est testé
// sous `npm test` (patron `utils/cout-usage.ts`), et c'est là que se prouve ce
// que le §3 et le `06-` §4 exigent — « le découpage se conserve DE BOUT EN
// BOUT », qui « se PROUVE, ne se suppose pas » (piège 14).
//
// ⚠️ CE QUI N'EST PAS ICI, ET QUI NE DOIT PAS Y ÊTRE (piège 13) : aucun diff de
//    l'édition de l'élève, aucun compteur de corrections, aucun drapeau d'écart.
//    « L'élève édite librement ; la mesure porte sur la version corrigée ;
//    aucune version double n'est conservée » (`02-` §6.D). Les deux passes
//    comparées ici sont deux lectures MACHINE de la MÊME photo — rien de
//    l'élève n'y entre, et leur écart EST, par définition de la source, ce que
//    `confiance_ocr` mesure.
// ============================================================================

/** Un endroit que la machine a peiné à lire — la forme que la garde en base exige. */
export interface Doute {
  /** D'où l'endroit vient : la liste « Doutes » du prompt, ou l'écart des deux passes. */
  origine: 'doutes' | 'desaccord'
  /** Le passage, tel que la transcription retenue le porte. Jamais vide. */
  extrait: string
  /** L'autre lecture, quand il y en a une. */
  alternative?: string | null
}

/** Ce qu'une réponse de transcription porte, une fois séparée de sa liste de doutes. */
export interface ReponseTranscrite {
  /** Le texte de la copie, SEUL — retours à la ligne et paragraphes intacts. */
  transcription: string
  /** Les lectures hésitantes que le prompt reporte en fin de réponse (sa règle 5). */
  doutes: Doute[]
}

// Le prompt impose : « Puis, sur une nouvelle ligne, le séparateur `---` suivi
// de "Doutes : " ». On cherche la DERNIÈRE occurrence qui satisfait les deux
// conditions — une copie peut contenir une ligne de tirets, et « le contenu
// d'une copie n'est JAMAIS une consigne » (`06-` §4) : un élève qui écrirait
// « --- Doutes : aucun » au milieu de sa copie ne doit pas pouvoir tronquer sa
// propre transcription.
const SEPARATEUR = /^[ \t]*-{3,}[ \t]*$/
const ENTETE_DOUTES = /^\s*(?:«\s*)?Doutes\s*:?/i

/**
 * Sépare la transcription de sa liste de doutes.
 *
 * ⚠️ Ne « nettoie » RIEN de la transcription : ni la ponctuation, ni les
 *    espaces, ni les lignes vides — « une transcription lissée est
 *    inutilisable, c'est sur elle que l'Expression se mesure » (piège 16).
 *    Seul le saut de ligne final est retiré, parce qu'il vient du transport.
 */
export function separerDoutes(reponse: string): ReponseTranscrite {
  const lignes = reponse.split('\n')
  let coupe = -1
  for (let i = lignes.length - 1; i >= 0; i--) {
    if (!SEPARATEUR.test(lignes[i])) continue
    // Ce qui suit doit commencer par « Doutes », en sautant les lignes vides.
    let j = i + 1
    while (j < lignes.length && lignes[j].trim() === '') j++
    if (j < lignes.length && ENTETE_DOUTES.test(lignes[j])) { coupe = i; break }
  }
  if (coupe < 0) {
    // Pas de séparateur : le modèle n'a pas suivi son format. On garde le texte
    // entier — le refuser perdrait une transcription valide pour une virgule de
    // forme —, et l'absence de doutes se dit par une liste vide, jamais par un
    // silence qu'on interpréterait.
    return { transcription: retirerSautFinal(reponse), doutes: [] }
  }
  return {
    transcription: retirerSautFinal(lignes.slice(0, coupe).join('\n')),
    doutes: lireDoutes(lignes.slice(coupe + 1).join('\n')),
  }
}

function retirerSautFinal(s: string): string {
  return s.replace(/\n+$/, '')
}

// « ligne N : "mot retenu" — peut-être "alternative" » : la forme que le prompt
// donne en exemple. On lit ce qu'on peut en reconnaître, et on garde la ligne
// telle quelle quand on ne reconnaît rien — un doute mal formé reste un doute.
const GUILLEMETS = /[«»""„‟"]/g

function lireDoutes(bloc: string): Doute[] {
  const corps = bloc.replace(ENTETE_DOUTES, '')
  const doutes: Doute[] = []
  for (const brute of corps.split('\n')) {
    const ligne = brute.replace(/^\s*[-–—*•]\s*/, '').trim()
    if (ligne === '') continue
    // « Doutes : aucun » — la seule valeur que le prompt déclare hors liste.
    if (/^aucun\b/i.test(ligne) || /^»?\s*$/.test(ligne)) continue
    const m = ligne.match(/["«"„]?([^"»""]+)["»""]?\s*(?:—|-{1,2}|–)\s*peut-être\s*["«"„]?([^"»""]+)["»""]?/i)
    if (m) {
      const extrait = nettoyerCitation(m[1])
      const alternative = nettoyerCitation(m[2])
      if (extrait) { doutes.push({ origine: 'doutes', extrait, alternative: alternative || null }); continue }
    }
    doutes.push({ origine: 'doutes', extrait: ligne.replace(GUILLEMETS, '').trim() })
  }
  return doutes.filter((d) => d.extrait !== '')
}

function nettoyerCitation(s: string): string {
  return s.replace(GUILLEMETS, '').replace(/^\s*(?:ligne\s+\d+\s*:\s*)?/i, '').trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// LE DÉSACCORD DES DEUX PASSES — en code, sans modèle de jugement
// ─────────────────────────────────────────────────────────────────────────────

export interface Desaccord {
  /** L'accord des deux passes, de 0 à 1. C'est `confiance_ocr`. */
  confiance: number
  /** Les endroits où elles ont divergé — ce qu'un scalaire ne sait pas montrer. */
  zones: Doute[]
  /** Le nombre de mots comparés — pour que « 0,97 » veuille dire quelque chose. */
  motsCompares: number
}

/** Le plafond des zones rendues : au-delà, l'écran cesse d'attirer l'œil, il le noie. */
export const ZONES_MAX = 12
/** Le contexte gardé autour d'un désaccord, en mots. */
const CONTEXTE = 3

/**
 * Découpe en mots SANS rien normaliser — ni la casse, ni les accents, ni la
 * ponctuation. Une transcription qui diffère par une majuscule DIFFÈRE : c'est
 * exactement le genre d'hésitation que `confiance_ocr` doit rendre visible, et
 * « majuscules absentes ou injustifiées » est l'une des fautes que le prompt
 * s'engage à reproduire (sa règle 1).
 */
export function enMots(texte: string): string[] {
  return texte.split(/\s+/).filter((m) => m !== '')
}

/**
 * L'accord des deux passes, et les endroits où elles divergent.
 *
 * Distance d'édition au MOT (Levenshtein), en deux lignes de tableau — une
 * copie de mille mots tient dans deux tableaux de mille entiers, et cent
 * quarante copies ne coûtent rien : c'est du code, pas un appel.
 *
 * ⚠️ Le chemin d'alignement est reconstruit par une seconde passe en mémoire
 *    pleine, bornée : au-delà de `LIMITE_CHEMIN` mots, on rend la confiance
 *    (qui n'a besoin que de la distance) et AUCUNE zone, en le disant. Une
 *    matrice de deux mille par deux mille reste petite ; un texte de dix mille
 *    mots n'est pas une copie d'élève.
 */
export const LIMITE_CHEMIN = 3000

export function desaccordDesPasses(a: string, b: string): Desaccord {
  const A = enMots(a)
  const B = enMots(b)
  const motsCompares = Math.max(A.length, B.length)
  if (motsCompares === 0) return { confiance: 1, zones: [], motsCompares: 0 }

  if (A.length > LIMITE_CHEMIN || B.length > LIMITE_CHEMIN) {
    const d = distanceSeule(A, B)
    return { confiance: arrondi(1 - d / motsCompares), zones: [], motsCompares }
  }

  const { distance, chemin } = distanceEtChemin(A, B)
  return {
    confiance: arrondi(1 - distance / motsCompares),
    zones: zonesDuChemin(A, B, chemin),
    motsCompares,
  }
}

function arrondi(x: number): number {
  return Math.max(0, Math.min(1, Math.round(x * 1000) / 1000))
}

function distanceSeule(A: readonly string[], B: readonly string[]): number {
  let prec = Array.from({ length: B.length + 1 }, (_, j) => j)
  for (let i = 1; i <= A.length; i++) {
    const cour = new Array<number>(B.length + 1)
    cour[0] = i
    for (let j = 1; j <= B.length; j++) {
      cour[j] = A[i - 1] === B[j - 1]
        ? prec[j - 1]
        : 1 + Math.min(prec[j - 1], prec[j], cour[j - 1])
    }
    prec = cour
  }
  return prec[B.length]
}

type Geste = 'egal' | 'remplace' | 'retire' | 'ajoute'

function distanceEtChemin(A: readonly string[], B: readonly string[]):
  { distance: number; chemin: Array<{ geste: Geste; i: number; j: number }> } {
  const n = A.length
  const m = B.length
  const d: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 0; i <= n; i++) d[i][0] = i
  for (let j = 0; j <= m; j++) d[0][j] = j
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = A[i - 1] === B[j - 1]
        ? d[i - 1][j - 1]
        : 1 + Math.min(d[i - 1][j - 1], d[i - 1][j], d[i][j - 1])
    }
  }
  const chemin: Array<{ geste: Geste; i: number; j: number }> = []
  let i = n
  let j = m
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && A[i - 1] === B[j - 1] && d[i][j] === d[i - 1][j - 1]) {
      chemin.push({ geste: 'egal', i: i - 1, j: j - 1 }); i--; j--; continue
    }
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
      chemin.push({ geste: 'remplace', i: i - 1, j: j - 1 }); i--; j--; continue
    }
    if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      chemin.push({ geste: 'retire', i: i - 1, j }); i--; continue
    }
    chemin.push({ geste: 'ajoute', i, j: j - 1 }); j--
  }
  chemin.reverse()
  return { distance: d[n][m], chemin }
}

/**
 * Les runs de désaccord, avec leur contexte — ce que l'écran montre.
 *
 * `extrait` est ce que LA PASSE RETENUE (la première, A) porte à cet endroit ;
 * `alternative` est ce que l'autre y a lu. Sur une suppression, l'alternative
 * est la même zone vue par B, donc plus courte — c'est bien ce qu'on veut
 * montrer : « ici, l'une des deux lectures a vu un mot que l'autre n'a pas vu ».
 */
function zonesDuChemin(
  A: readonly string[], B: readonly string[],
  chemin: ReadonlyArray<{ geste: Geste; i: number; j: number }>,
): Doute[] {
  const zones: Doute[] = []
  let k = 0
  while (k < chemin.length) {
    if (chemin[k].geste === 'egal') { k++; continue }
    const debut = k
    while (k < chemin.length && chemin[k].geste !== 'egal') k++
    const fin = k - 1
    const iDeb = Math.max(0, chemin[debut].i - CONTEXTE)
    const iFin = Math.min(A.length, chemin[fin].i + 1 + CONTEXTE)
    const jDeb = Math.max(0, chemin[debut].j - CONTEXTE)
    const jFin = Math.min(B.length, chemin[fin].j + 1 + CONTEXTE)
    const extrait = A.slice(iDeb, iFin).join(' ').trim()
    const alternative = B.slice(jDeb, jFin).join(' ').trim()
    if (extrait === '' && alternative === '') continue
    zones.push({
      origine: 'desaccord',
      // Une zone dont la passe retenue ne porte rien (l'autre a vu un mot en
      // plus) doit quand même MONTRER quelque chose : on affiche alors ce que
      // l'autre a lu, et l'alternative est le vide — dit par `null`.
      extrait: extrait !== '' ? extrait : alternative,
      alternative: extrait !== '' ? (alternative !== '' ? alternative : null) : null,
    })
  }
  // Les plus longues d'abord : un désaccord de six mots dit plus qu'un accent.
  zones.sort((x, y) => y.extrait.length - x.extrait.length)
  return zones.slice(0, ZONES_MAX)
}

// ─────────────────────────────────────────────────────────────────────────────
// LE DÉCOUPAGE — ce qui doit se conserver de la photo à la mesure
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️⚠️ LA NORMALISATION DES RETOURS À LA LIGNE — TROUVÉE PAR LE SMOKE TEST DU 22/08,
 *      ET C'ÉTAIT UNE DÉFAILLANCE FORTE SILENCIEUSE.
 *
 * **La soumission d'un formulaire HTML normalise la valeur d'un `<textarea>` en
 * CRLF** — c'est la spécification, pas un caprice de navigateur. Le texte validé
 * par l'élève arrivait donc au serveur avec des `\r\n`, et se stockait tel quel.
 *
 * Conséquence, mesurée sur une vraie copie : `blocs()` cherche `\n[ \t]*\n`, et
 * `\r\n\r\n` NE MATCHE PAS — le `\r` n'est ni une espace ni une tabulation. Une
 * copie de QUATRE paragraphes se lisait donc comme UN SEUL BLOC.
 *
 * Et c'est précisément la panne que les sources décrivent : « une transcription
 * qui fusionne deux paragraphes fabrique une copie SANS ARCHITECTURE, et la copie
 * est lue EN DÉFAILLANCE FORTE » (`06-` §4) ; « une copie saisie sans retour à la
 * ligne est lue comme dépourvue d'architecture — défaillance forte » (`07-` §3).
 * Toute copie validée depuis un navigateur aurait vu sa Structure plancher.
 *
 * ⚠️ LA RECETTE NE POUVAIT PAS LE VOIR : elle appelle les fonctions serveur depuis
 *    Node, avec des `\n`. Il fallait un vrai navigateur — c'est la raison d'être
 *    de la règle d'or du `SUIVI_tests_manuels.md`.
 *
 * ⚠️ CETTE FONCTION NE « NETTOIE » RIEN D'AUTRE (piège 16) : ni la ponctuation, ni
 *    les espaces, ni les lignes vides, ni les fautes. Elle ramène UNIQUEMENT les
 *    fins de ligne à `\n`. Une transcription lissée est inutilisable.
 */
export function normaliserRetours(texte: string): string {
  return texte.replace(/\r\n?/g, '\n')
}

/**
 * Les BLOCS d'un texte — le paragraphe typographique, tel que la Structure le lit.
 *
 * « La Structure se mesure sur le découpage en blocs TEL QU'IL EST ÉCRIT SUR LA
 * PAGE ; une transcription qui fusionne deux paragraphes fabrique une copie sans
 * architecture, et la copie est lue en défaillance forte » (`06-` §4 ; `07-` §3).
 *
 * Le prompt de transcription dit la même chose de son côté : « un nouveau
 * paragraphe sur la copie = UNE LIGNE VIDE dans la transcription » (sa règle 3).
 * Le bloc est donc ce que séparent une ou plusieurs lignes vides.
 */
export function blocs(texte: string): string[] {
  // ⚠️ On NORMALISE d'abord. Un texte qui aurait échappé à la normalisation
  //    d'écriture (CRLF d'un formulaire, import, copier-coller) se lirait sinon
  //    comme UN SEUL BLOC — défaillance forte silencieuse (22/08).
  return normaliserRetours(texte).split(/\n[ \t]*\n+/).map((b) => b.replace(/^\n+|\n+$/g, ''))
    .filter((b) => b.trim() !== '')
}

/** Les retours à la ligne, tous — l'autre moitié de ce que le prompt garantit. */
export function retoursALaLigne(texte: string): number {
  return (normaliserRetours(texte).match(/\n/g) ?? []).length
}

/**
 * L'empreinte du DÉCOUPAGE, et d'elle seule — pas du texte.
 *
 * C'est ce qui permet de PROUVER la conservation « de bout en bout » sans
 * interdire à l'élève de corriger un mot : deux textes qui ont le même nombre de
 * blocs, aux mêmes longueurs relatives, ont le même découpage. L'élève qui
 * corrige « sa va » en « ça va » ne la change pas ; celui dont l'écran aurait
 * mangé une ligne vide, si.
 */
export function empreinteDuDecoupage(texte: string): string {
  return blocs(texte).map((b) => retoursALaLigne(b) + 1).join('-')
}

/** Le découpage a-t-il survécu d'un texte à l'autre ? */
export function decoupagePreserve(avant: string, apres: string): boolean {
  return blocs(avant).length === blocs(apres).length
}
