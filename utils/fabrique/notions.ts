// ============================================================================
// C4 · L16 — L'APPARIEMENT PAR NOTIONS, et la forme sur laquelle il se fait.
// ----------------------------------------------------------------------------
// LE QUATRIÈME ÉTAT DU RATTACHEMENT RETOURNE LE SENS DU TRI. Aux trois premiers,
// c'est le MATÉRIAU qui désigne ses cours — « quinze sujets, quinze
// appariements, et deux cents demain ». Au quatrième, c'est le COURS qui déclare
// ce qu'il traite (`scriptorium_contenus.notions`), et le matériau s'y rattache
// tout seul : « servable dès qu'un cours vu déclare l'une de ses notions »
// (`01-routeur.md` §4 couche 4 ; `08-` §2 et §3 ; `07-` §2, C4-L16).
//
// ⛔⛔ ET LE VRAI RISQUE N'EST PAS LA STRUCTURE, C'EST L'APPARIEMENT.
//   « la vérité », « Vérité », « La Vérité » : deux chaînes libres de part et
//   d'autre, et rien ne se rattache jamais — le sujet reste muet, et RIEN À
//   L'ÉCRAN NE DIT POURQUOI. Le `08-` §3 pose deux gardes, et il les faut toutes
//   les deux : l'appariement se fait sur une FORME NORMALISÉE — « minuscules,
//   sans accents, article initial retiré » —, et l'écran PROPOSE les notions
//   déjà déclarées par la banque. Ce module porte la première ; la seconde vit
//   à `/prof/scriptorium` (bibliothèque des cours).
//
// ════════════════════════════════════════════════════════════════════════════
// ⛔⛔ IL Y A DÉJÀ DEUX NORMALISATIONS DANS CE DÉPÔT, ELLES SE CONTREDISENT,
//     ET C'EST VOULU. CELLE-CI EST LA TROISIÈME EMPLOI, PAS LA TROISIÈME RÈGLE.
// ════════════════════════════════════════════════════════════════════════════
//   · `plie()` — `utils/fabrique/verifie-reference.ts` — fait EXACTEMENT
//     « minuscules, sans accents » : NFD → retrait des marques `Mn` →
//     `toLowerCase()` → ce que le `casefold()` de Python fait en plus. Elle est
//     écrite CONTRE Python, éprouvée par `divergences.test.ts`, et son
//     commentaire porte ses deux pièges (NFKD n'est pas NFD ; minusculiser AVANT
//     de replier l'eszett). ⭐ **C'est la nôtre, à l'article près** : on
//     l'IMPORTE, on ne la recopie pas — deux copies divergeraient au premier
//     correctif. C'est pourquoi ce module n'écrit pas de repli de casse.
//   · `replie()` — `utils/deroule/demonstration.ts` — fait `trim().toLowerCase()`
//     et RIEN D'AUTRE, délibérément : « pas de repli d'accents […] un
//     rapprochement approximatif ÉCARTE À TORT, et écarter à tort PRIVE L'ÉLÈVE
//     DE SA DÉMONSTRATION EN SILENCE […] on préfère donc le faux négatif au faux
//     positif ».
//
// ⚠️⚠️ LES DEUX COMPARENT DES `exercices_sujets.notions`, ET ELLES DOIVENT
//   RESTER DIFFÉRENTES — L'ASYMÉTRIE DE RISQUE EST INVERSE :
//   · **Ici** (le rattachement au cours), NE PAS APPARIER rend le sujet muet
//     POUR TOUJOURS — et rien ne le dit. **Le faux négatif est le défaut à
//     éviter** : on replie donc largement (accents, casse, article).
//   · **Là-bas** (la parade à l'imitation de surface de C4-L3), APPARIER À TORT
//     prive l'élève de sa démonstration, en silence. **Le faux positif est le
//     défaut à éviter** : on replie donc au minimum.
//   ⛔ NE PAS « HARMONISER » LES DEUX. Deux règles opposées, sur la même colonne,
//   dans le même dépôt : c'est un choix, pas un oubli. Le même avertissement est
//   posé à l'autre bout, dans `demonstration.ts`.
// ============================================================================

import { plie } from './verifie-reference'

// ── L'ARTICLE INITIAL ────────────────────────────────────────────────────────
// ⚠️ « L'ARTICLE INITIAL RETIRÉ » TIENT EN TROIS MOTS DANS LA SOURCE, ET EN
//   AUCUN AILLEURS. Ni le `08-` §3 ni le `01-` §4 ne disent LESQUELS, ni ce
//   qu'on fait d'une notion qui n'en porte pas. **La liste est donc une décision
//   de ce lot, et la voici avec son motif.**
//
// LES QUATRE DÉFINIS, ET EUX SEULS : `le` · `la` · `les` · `l'`.
//   Le motif est que **ce sont les seuls qui INTRODUISENT un nom de notion**.
//   Les dix-sept notions du programme de terminale générale s'écrivent toutes
//   ainsi — « la vérité », « l'art », « le travail » —, et les thèmes de
//   semestre de HLP aussi — « la parole », « les représentations ». L'indéfini
//   et le partitif (« un devoir », « du temps », « de la nature ») n'énoncent
//   pas une notion : ils l'emploient dans une phrase. **Les ajouter aurait
//   élargi la surface de collision sans répondre à un seul cas réel** — et le
//   piège est là : deux notions distinctes qui se replient sur le même mot
//   rattacheraient un sujet à un cours qui ne parle pas de lui.
//
// ⭐ VÉRIFIÉ, ET FIXÉ PAR UN TEST : sur les dix-sept notions du programme et
//   sur les cinq que la banque déclare réellement, **ce retrait ne fait entrer
//   AUCUNE paire en collision** (`notions.test.ts`).
//
// ⛔ UN SEUL ARTICLE, JAMAIS EN CHAÎNE. On ne recommence pas sur le résultat :
//   aucune notion ne s'écrit « la la vérité », et une boucle finirait par manger
//   un vrai mot (« les lettres » → « lettres », et non « lettres » → …).
// ⭐ UNE NOTION SANS ARTICLE PASSE INCHANGÉE — et c'est ce qui fait que
//   « vérité », tapé nu par le professeur, rencontre « la vérité » de la banque.
const ARTICLES = ['le', 'la', 'les'] as const

// ⚠️ L'ÉLISION SE TAPE DE QUATRE FAÇONS. `plie()` replie la casse et les
//   accents, jamais la ponctuation : une apostrophe typographique (U+2019),
//   celle des claviers macOS, ne vaut pas l'apostroph droite (U+0027) — et
//   « l’art » ne rencontrerait pas « l'art ». On les unifie ici, et seulement
//   ici : ailleurs dans le dépôt, une apostrophe est un caractère du texte.
const APOSTROPHES = /[‘’ʼ´′]/g

/**
 * LA CLÉ SUR LAQUELLE DEUX NOTIONS SE RENCONTRENT — « minuscules, sans accents,
 * article initial retiré » (`08-` §3 ; `01-` §4 couche 4).
 *
 * C'est la seule forme sur laquelle `scriptorium_contenus.notions` et
 * `exercices_sujets.notions` / `exercices_textes.notions` se comparent. Elle ne
 * se stocke JAMAIS : les deux colonnes gardent ce que le professeur a écrit, et
 * la clé se recalcule à chaque comparaison. *Stocker une forme normalisée en
 * ferait une seconde vérité, à re-migrer au premier changement de règle.*
 *
 * @returns la clé, ou `''` pour une entrée vide ou qui n'est pas une chaîne —
 *          et une clé vide ne s'apparie à rien (voir `ensembleDeNotions`).
 */
export function cleDAppariement(notion: unknown): string {
  if (typeof notion !== 'string') return ''
  // 1. Le repli de casse et d'accents, celui qui est déjà écrit et éprouvé.
  const plie1 = plie(notion).replace(APOSTROPHES, "'").trim()
  if (plie1 === '') return ''
  // 2. L'élision — `l'art`, `l’État`. Elle se colle au mot : pas d'espace exigé.
  if (plie1.startsWith("l'")) {
    const reste = plie1.slice(2).trim()
    // ⭐ Une notion qui ne serait QUE son article garde sa forme repliée : mieux
    //    vaut une clé étrange qu'une clé vide, qui ne s'apparie à rien.
    return reste === '' ? plie1 : reste
  }
  // 3. Les articles détachés — au mot entier, jamais en préfixe de lettres :
  //    « les » ne doit pas se manger le début de « lecture ».
  for (const a of ARTICLES) {
    if (plie1.startsWith(a + ' ')) {
      const reste = plie1.slice(a.length + 1).trim()
      return reste === '' ? plie1 : reste
    }
  }
  return plie1
}

/**
 * L'ensemble des clés d'une liste déclarée — les entrées vides ne comptent pas.
 * ⚠️ Deux notions qui se replient sur la même clé n'en font qu'une ici : c'est
 *    voulu, et c'est le sens même de l'appariement (« la Vérité » et
 *    « la vérité » sont la même notion).
 */
export function ensembleDeNotions(liste: readonly unknown[] | null | undefined): Set<string> {
  const s = new Set<string>()
  for (const x of liste ?? []) {
    const c = cleDAppariement(x)
    if (c !== '') s.add(c)
  }
  return s
}

/**
 * ⭐ CE QUE LE ROUTEUR DEMANDERA — « servable dès qu'un cours vu déclare L'UNE
 * de ses notions » : une INTERSECTION non vide, jamais une inclusion.
 *
 * ⛔ CE MODULE NE FILTRE RIEN, ET C'EST DÉLIBÉRÉ. La couche 4 en `notions` est
 * le premier geste de `C4-L12` — « écrire le filtre ici en ferait un second
 * domicile, et deux filtres de service divergeraient au premier amendement »
 * (`07-` §2). Cette fonction est la BRIQUE que ce filtre appellera ; elle ne
 * sait rien des cours VUS, ni des classes, ni de l'élève.
 *
 * @param declareesParLeMateriau ce que le sujet ou le texte met en jeu.
 * @param declareesParLeCours    ce que le cours déclare traiter.
 */
export function notionsPartagees(
  declareesParLeMateriau: readonly unknown[] | null | undefined,
  declareesParLeCours: readonly unknown[] | null | undefined,
): boolean {
  const duCours = ensembleDeNotions(declareesParLeCours)
  if (duCours.size === 0) return false
  for (const c of ensembleDeNotions(declareesParLeMateriau)) {
    if (duCours.has(c)) return true
  }
  return false
}

/**
 * LES NOTIONS ORPHELINES — celles qu'un matériau réclame et qu'AUCUN COURS ne
 * déclare. C'est ce que l'écran de la banque doit nommer : « quatre sujets
 * attendent une notion qu'aucun cours ne déclare : la connaissance, le
 * langage » (`07-` §2, C4-L16).
 *
 * ⛔ « ORPHELINE » SE DIT SUR TOUS LES COURS, JAMAIS SUR LES COURS VUS.
 *   « Aucun cours ne déclare cette notion » est un fait de CONCEPTION — le
 *   professeur n'a pas encore rempli, ou il a écrit un autre mot. « Le cours n'a
 *   pas encore été vu » est un fait de ROUTAGE, et c'est le filtre, qui n'est
 *   pas à ce lot. ⚠️ Les confondre à l'écran ferait crier une alerte CHAQUE
 *   DÉBUT DE SEMESTRE, quand rien n'a été vu et que tout est pourtant déclaré.
 *   D'où la signature : elle ne prend aucune classe, aucun élève, aucune date.
 *
 * @param reclamees   les notions déclarées par les matériaux en `cours_etat =
 *                    'notions'` — telles que le professeur les a ÉCRITES.
 * @param parLesCours toutes les notions déclarées par les cours de la
 *                    bibliothèque, vues ou non.
 * @returns les libellés ORIGINAUX des notions orphelines, dédoublonnés par clé
 *          et rendus dans l'ordre de première apparition. ⭐ On rend le libellé
 *          écrit, jamais la clé : « la vérité » se lit, « verite » non.
 */
export function notionsOrphelines(
  reclamees: readonly unknown[] | null | undefined,
  parLesCours: readonly unknown[] | null | undefined,
): string[] {
  const duCours = ensembleDeNotions(parLesCours)
  const vues = new Set<string>()
  const out: string[] = []
  for (const n of reclamees ?? []) {
    const c = cleDAppariement(n)
    if (c === '' || duCours.has(c) || vues.has(c)) continue
    vues.add(c)
    out.push(String(n))
  }
  return out
}
