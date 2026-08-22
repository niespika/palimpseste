// ============================================================================
// C4 · L3 — LA CHASSE AUX FAUTES : de l'HYGIÈNE, et rien d'autre.
// Module PUR — aucun `server-only`, aucun accès base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// « Et une micro-tâche d'hygiène : LA CHASSE AUX FAUTES. Il est signalé à
//   l'élève qu'il reste **N FAUTES PROBABLES** ; il en corrige ce qu'il trouve.
//   ***N* est compté EN CODE, à partir du RELEVÉ DE LANGUE QUE LA CHAÎNE PRODUIT
//   DÉJÀ** — **L'ÉCRAN NE DÉTECTE RIEN DE LUI-MÊME ET N'APPELLE AUCUN MODÈLE**.
//   **HORS LETTRE, HORS CALIBRATION** : c'est de l'HYGIÈNE, PAS DE LA MESURE.
//   Elle ne porte que sur UN TEXTE DONT L'ÉLÈVE RÉPOND — saisi à l'écran, ou
//   transcrit **puis contrôlé par lui**. »              — `06-` §2, temps 2
//
// « **LA LANGUE VA DANS UN ENCART SÉPARÉ** — les fautes relevées mécaniquement,
//   **ancrées ligne à ligne**, **HORS DU RETOUR DE COMPÉTENCE** ; leur
//   correction est attendue dans la version finale. »   — `06-` §2, temps 4
//
// La fiche Expression dit la même chose de son côté, et trois fois :
//   · l'orthographe est **hors périmètre de la lettre** (la fiche §1.2) — seule
//     la faute qui oblige à relire pour retrouver la structure de la phrase
//     devient un fait `accord_brouillant`, et celle-là n'est PAS ici ;
//   · `orthographe` est de famille **comptage**, `reussie: sans_objet` —
//     « télémétrie seule […] **jamais dans les grades** » (la fiche §5) ;
//   · il « n'a pas de bloc » à « se juger », délibérément : « se juger sur une
//     dimension qui ne compte pas dans sa lettre apprendrait à l'élève à se
//     calibrer sur un référent faux » (la fiche §5).
//
// ⚠️⚠️ CONSTAT VÉRIFIÉ EN SÉANCE, ET IL COMMANDE TOUT CE MODULE :
//      **LE RELEVÉ DE LANGUE N'EXISTE PAS ENCORE — LA CHAÎNE N'EN PRODUIT AUCUN.**
//      Le champ, lui, est bien déclaré : le squelette P1 de la fiche porte
//      `"orthographe": { "total": 0, "citations": [ { "phrase": 0,
//      "citation": "mots exacts" } ] }` (la fiche §3). Mais **aucune compétence
//      n'est ouverte dans la chaîne** — `utils/chaine/instruments.ts` a des
//      `INSTRUMENTS` et des `BRANCHEMENTS` **vides**, et le manifeste dérivé
//      porte `ouverte: false` sur les six. **Rien n'écrit `orthographe` nulle
//      part**, et donc rien ne se lit.
//
//      SA CONSÉQUENCE, ET ELLE EST NOMINALE : **l'encart NE S'AFFICHE PAS, ET
//      CE N'EST PAS UNE PANNE.** Ce module PRÉVOIT LE CHEMIN DE LECTURE et
//      traite **l'absence comme le cas normal** : il ne fabrique jamais un
//      relevé vide pour avoir quelque chose à montrer. Le jour où la fiche
//      Expression est *versée et bancée* et son slot branché, le chemin s'ouvre
//      sans qu'on retouche à une ligne d'écran.
//
// ⭐ **NULL N'EST PAS ZÉRO** — la doctrine de `delta_v1_vf`, mot pour mot
//    (`01-` §11 ; `06-` §6). « Aucune faute » et « on n'a pas regardé » sont
//    DEUX CHOSES, et les confondre ferait afficher « 0 faute » à un élève dont
//    la copie n'a jamais été lue. `nombreDeFautes` rend donc `null`, **jamais
//    0**, quand il n'y a pas de relevé.
//
// ⚠️ CE QUE CE MODULE NE FAIT PAS, ET NE FERA PAS : détecter une faute. Il ne
//    porte aucun dictionnaire, aucune règle d'accord, aucun appel. Le
//    correcteur orthographique du navigateur, lui, « reste actif — il n'est pas
//    désactivé » (`06-` §1), et « il restera toujours des fautes, et la chasse
//    aux fautes garde son objet ».
// ============================================================================

import { citationsIntrouvables } from '../chaine/anti-injection'
import { normaliserRetours } from '../passation/transcription-calcul'

/** Une faute bénigne relevée par P1 — les mots exacts, et la phrase d'où ils viennent. */
export interface FauteRelevee {
  /**
   * Le numéro de phrase du pré-relevé mécanique servi à P1 (la fiche §3).
   * ⚠️ `0` = **aucun numéro utilisable** — l'ancrage se fait sur LE TEXTE, jamais
   * sur ce numéro : l'écran de l'élève ne connaît pas la numérotation de P1.
   */
  phrase: number
  /** Les mots exacts, verbatim. Jamais vide — une citation vide n'ancre rien. */
  citation: string
}

/** Le bloc `orthographe` du squelette P1 : « un `total` et ses `citations` » (la fiche §3). */
export interface ReleveDeLangue {
  /** **LE COMPTE DÉCLARÉ.** C'est lui, et lui seul, qui fait le *N* de la chasse. */
  total: number
  /** Au plus cinq (cf. `PLAFOND_CITATIONS`). **Ce n'est pas le compte.** */
  citations: FauteRelevee[]
}

/**
 * « TOTAL + **au plus 5 citations** — ici, et ici seulement, le total déclaré et
 * le plafond de 5 restent en vigueur, parce que l'orthographe n'entre dans aucun
 * grade et que ses comptes peuvent être volumineux » (la fiche §3, prompt P1).
 *
 * ⚠️ Ce plafond est la raison pour laquelle *N* se lit sur `total` **et jamais
 *    sur `citations.length`** : une copie à douze fautes n'en cite que cinq, et
 *    compter les citations sous-déclarerait la chasse de plus de moitié.
 */
export const PLAFOND_CITATIONS = 5

function estObjet(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Le bloc lui-même, rendu sûr. **Tolérant à la lecture, jamais inventif** :
 * une entrée qu'on ne sait pas lire est écartée, elle n'emporte pas les autres —
 * mais un bloc SANS `total` lisible rend `null` en entier. *Déduire le total des
 * citations le plafonnerait à cinq, ce qui est exactement le compte faux.*
 */
function lireLeBloc(brut: unknown): ReleveDeLangue | null {
  if (!estObjet(brut)) return null
  const total = brut.total
  if (typeof total !== 'number' || !Number.isInteger(total) || total < 0) return null
  const brutes = brut.citations
  // Une clé `citations` présente mais qui n'est pas une liste est une forme
  // qu'on ne sait pas lire : on ne devine pas ce qu'elle voulait dire.
  if (brutes !== undefined && !Array.isArray(brutes)) return null
  const citations: FauteRelevee[] = []
  for (const e of Array.isArray(brutes) ? brutes : []) {
    if (!estObjet(e)) continue
    const c = e.citation
    if (typeof c !== 'string' || c.trim() === '') continue
    const p = e.phrase
    citations.push({
      phrase: typeof p === 'number' && Number.isFinite(p) && p >= 0 ? Math.trunc(p) : 0,
      citation: c,
    })
  }
  return { total, citations }
}

/**
 * ⭐ LE CHEMIN DE LECTURE — `exercices_squelettes.artefact_extraction`, compétence
 * `expression`, clé `orthographe` (la fiche §3 ; `07-` §1.2).
 *
 * ⚠️ **`artefact_extraction` est indexé PAR CLÉ D'EXTRACTION**, pas par nom de
 *    champ : la chaîne y écrit `artefactsP1[spec.cle] = r.valeur`
 *    (`utils/chaine/chaine.ts`), et c'est le relevé de P1 qui porte
 *    `orthographe`. **La clé de l'Expression n'existe pas encore** — son
 *    branchement est vide —, donc on ne la NOMME pas : on regarde d'abord la
 *    racine, puis **UN SEUL CRAN plus bas**, dans chaque relevé. Pas de descente
 *    profonde : un balayage récursif finirait par trouver un `orthographe`
 *    n'importe où et ancrerait la chasse sur autre chose que le relevé.
 *
 * ⚠️ Rend **`null` quand la clé manque ou est mal formée — JAMAIS un relevé vide
 *    fabriqué.** C'est l'état du jour, et c'est un état normal : l'encart ne
 *    s'affiche pas, et ce n'est pas une panne.
 */
export function lireReleveDeLangue(artefactExtraction: unknown): ReleveDeLangue | null {
  if (!estObjet(artefactExtraction)) return null
  const direct = lireLeBloc(artefactExtraction.orthographe)
  if (direct) return direct
  for (const valeur of Object.values(artefactExtraction)) {
    if (!estObjet(valeur)) continue
    const bloc = lireLeBloc(valeur.orthographe)
    if (bloc) return bloc
  }
  return null
}

/**
 * ⭐ **LE *N* DE LA CHASSE — et `null` n'est pas 0.**
 *
 * « *N* est compté EN CODE, à partir du relevé de langue que la chaîne produit
 * déjà » (`06-` §2). Deux états qui ne se confondent jamais :
 *   · `null` — **il n'y a pas de relevé** : personne n'a regardé la langue de
 *     cette copie. L'encart ne s'affiche pas.
 *   · `0` — le relevé existe et **ne compte aucune faute bénigne**. On a
 *     regardé, il n'y a rien.
 *
 * ⚠️ Les confondre ferait afficher « 0 faute » à un élève dont la copie n'a
 *    jamais été lue — c'est-à-dire une garantie que rien ne donne. Même doctrine
 *    que `delta_v1_vf` : **NULL n'est pas zéro** (`01-` §11 ; `06-` §6).
 *
 * ⚠️ Se lit sur `total`, **jamais sur `citations.length`** (cf. `PLAFOND_CITATIONS`).
 */
export function nombreDeFautes(releve: ReleveDeLangue | null): number | null {
  return releve === null ? null : releve.total
}

/** Une citation, à l'endroit du texte où l'élève ira la chercher. */
export interface AncrageFaute {
  /**
   * La ligne du texte, **1-indexée**. ⚠️ `0` quand la citation ne s'ancre nulle
   * part — les lignes commencent à 1, `0` n'en désigne aucune.
   */
  ligne: number
  citation: string
  /** ⚠️ `false` = **introuvable**. On le SIGNALE ; on n'ancre pas au hasard. */
  trouvee: boolean
}

/** La comparaison de `citationsIntrouvables` : apostrophes, guillemets, espaces, casse. */
function presente(texte: string, citation: string): boolean {
  // ⚠️ `citationsIntrouvables` ignore les citations vides (elle les tiendrait
  //    pour trouvées) : `lireReleveDeLangue` les a déjà écartées, et c'est là
  //    que se tient la garde.
  return citationsIntrouvables(texte, [citation]).introuvables.length === 0
}

/**
 * ⭐ L'ANCRAGE **LIGNE À LIGNE** de l'encart de langue (`06-` §2, temps 4).
 *
 * ⚠️ **ON NE DEVINE PAS.** « Une citation qu'on ne retrouve pas ne s'ancre nulle
 *    part et se signale » : le même esprit que
 *    `utils/chaine/anti-injection.ts:citationsIntrouvables`, dont ce module
 *    réutilise la comparaison — **elle ALERTE, elle NE RÉPARE PAS**, et l'effet
 *    d'une citation introuvable est une décision d'écran, pas de fonction. Ici,
 *    l'écran montrera la citation SANS ancre : l'élève relit, il ne poursuit pas
 *    une ligne inventée.
 *
 * ⚠️ **LE TEXTE SE NORMALISE AVANT D'ÊTRE DÉCOUPÉ** — `normaliserRetours` de
 *    `utils/passation/transcription-calcul.ts`. Un `<textarea>` soumis rend des
 *    CRLF (piège du 22/08) : sans cette normalisation, `split('\n')` laisserait
 *    un `\r` en fin de chaque ligne et les numéros de ligne resteraient bons —
 *    mais le `\r` traînant fausserait tout comptage aval, et une copie importée
 *    en CR seul (`\r` sans `\n`) se lirait comme **UNE SEULE LIGNE**. Elle ne
 *    « nettoie » rien d'autre : la copie garde ses fautes, c'est tout l'objet.
 *
 * @param texte  le texte dont l'élève répond — v1 saisie, ou transcription qu'il
 *               a contrôlée (`06-` §2 : « un texte dont l'élève répond »).
 * @param releve le relevé de langue, tel que `lireReleveDeLangue` l'a rendu.
 */
export function ancrerLigneALigne(texte: string, releve: ReleveDeLangue): AncrageFaute[] {
  const plat = normaliserRetours(texte)
  const lignes = plat.split('\n')
  return releve.citations.map(({ citation }) => {
    // Le cas nominal : la citation tient sur UNE ligne.
    for (let i = 0; i < lignes.length; i++) {
      if (presente(lignes[i], citation)) return { ligne: i + 1, citation, trouvee: true }
    }
    // Le cas de la citation À CHEVAL sur un retour à la ligne. Elle existe bel
    // et bien dans le texte : on l'ancre à la ligne où elle COMMENCE — la
    // dernière d'où elle se lit encore en entier. Ce n'est pas une devinette,
    // c'est une position exacte.
    if (presente(plat, citation)) {
      for (let i = lignes.length - 1; i >= 0; i--) {
        if (presente(lignes.slice(i).join('\n'), citation)) {
          return { ligne: i + 1, citation, trouvee: true }
        }
      }
    }
    return { ligne: 0, citation, trouvee: false }
  })
}

/**
 * LA PHRASE SERVIE À L'ÉLÈVE — ou `null` quand il n'y a rien à dire.
 *
 * « Il est signalé à l'élève qu'il reste **N fautes PROBABLES** ; il en corrige
 * ce qu'il trouve » (`06-` §2). Le mot de la source est *probables*, et il est
 * juste : le relevé est mécanique, il se trompe, et l'élève arbitre.
 *
 * ⚠️ **AUCUN VERDICT, AUCUNE NOTE, AUCUN JUGEMENT** — c'est de l'hygiène, hors
 *    lettre et hors calibration, et l'encart est séparé du retour de compétence.
 *
 * ⚠️ `null` DANS DEUX CAS, et le patron est celui de
 *    `utils/passation/collage.ts:phraseDesCollages` — « un écran n'affiche un
 *    nombre que si ce nombre compte quelque chose » (`06-` §5) :
 *      · `n === null` : pas de relevé, donc pas d'encart (l'état du jour) ;
 *      · `n === 0`    : le relevé n'a rien trouvé — « 0 faute probable » est une
 *        phrase qui ne demande rien et qui promet une propreté que le relevé ne
 *        garantit pas.
 */
export function phraseDeLaChasse(n: number | null): string | null {
  if (n === null || n <= 0) return null
  const s = n > 1 ? 's' : ''
  return `Il reste ${n} faute${s} probable${s} — corrige ce que tu trouves.`
}
