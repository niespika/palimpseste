// ============================================================================
// C4 · L10 — LE BRANCHEMENT DE LA CONNAISSANCE. Tout le calcul, aucun jugement.
// ----------------------------------------------------------------------------
// EXTRACTION, PAS RÉGÉNÉRATION. Ce fichier est le portage, fonction pour
// fonction, de `copies-tests/connaissance/code.py` (dépôt de conception, calcul
// v1.3). « Le module encode ce que la fiche ne dit pas encore : le régénérer
// depuis la fiche le jetterait » (`CONTRAT-MODULES.md` §7).
//
//   La table d'extraction, suivie à la lettre :
//     pre         ← `pre_p1`      (le pré-relevé mécanique : phrases numérotées)
//     preP2       ← `pre_p2`      (consigne, corpus du cours, drapeau de restitution)
//     code1       ← `code1`       (les deux comptes, le garde-fou de citation)
//     code2       ← `detecte_justesse` + `detecte_diversite` + `croisement` + `code2`
//     conformite  ← `conformite`  (le juge qui calcule, la traque du redressement)
//
// ⚠️ LA FICHE FAIT FOI POUR LA RÈGLE, LE MODULE POUR LE CALCUL. Lire la fiche
//    pour comprendre (`competences/connaissance.md` : §3 le squelette, §4 les
//    règles de notation et le bloc machine, §5 les observables) ; lire le module
//    pour porter.
//
// ⭐ CE QUE LE PORTAGE AJOUTE, ET QUI N'EST PAS DANS LE MODULE : les HUIT
//    OBSERVABLES DE TÉLÉMÉTRIE du §5 de la fiche. Ce ne sont pas les
//    `OBSERVABLES` du module — ceux-là (`niveau`, `diversite`, `justesse`,
//    `profil_moyen`, `etendue`) sont ce que le BANC compare aux golds. Le `03-`
//    §1, gelé, dit qui les applique : « il n'est pas appliqué par le module mais
//    par LA CHAÎNE FROIDE ». Quatre des huit se lisent sur ce que le module
//    compte déjà ; les QUATRE AUTRES — `taux_justesse`, `contresens`,
//    `unite_plaquee`, `inverifiable` — demandent un calcul propre sur les
//    populations de la cascade, que le module calcule en local et ne rend pas.
//
// ⚠️ DEUX DÉNOMINATEURS DISTINCTS, ET LE RELEVÉ PORTE LES DEUX. `rapporte_a` est
//    un texte libre, et `observables.ts` cherche l'entrée SOUS CE NOM EXACT :
//    « les unités jugées, les inverifiable exclues (§4) » pour `contresens` et
//    `unite_plaquee`, « les unités du relevé » pour `inverifiable`. Il en
//    manquerait un, et les observables qui s'y rapportent sortiraient en `n/a`
//    sans un mot.
//
// ⛔ AUCUN SEUIL EN DUR pour la télémétrie : les seuils de réussite vivent au
//    bloc machine de la fiche, l'instrument dérivé les porte, `observables.ts`
//    lit le verdict contre eux. Ici, on rend des VALEURS. Les SIX paramètres de
//    calcul, eux, arrivent par `ctx.parametres` — `valeursDesParametres()`, et
//    jamais `instrument.parametres` : la forme dérivée est un BLOC par
//    paramètre, pas une valeur à plat.
//
// ⚠️ CE QUE LE PORTAGE DURCIT, ET POURQUOI. Le module lève sur quelques formes
//    que P1 ou P2 peuvent prendre et qu'il n'attend pas (une `citation` qui est
//    un nombre, un `restitution_de_cours` qui est un mot, des numéros d'unité de
//    types mêlés). Le contrat §3 l'interdit — « le module ne lève jamais
//    d'exception : elle traverserait le banc et emporterait la trace avec elle »
//    — et prescrit l'inverse : « une valeur illisible rend une alerte, pas une
//    valeur par défaut ». Chaque durcissement est marqué ⚠️ PORTAGE ci-dessous,
//    ne se déclenche sur AUCUN vecteur, et rend une alerte nommée.
//
// ⚠️⚠️ CE QUE CE BRANCHEMENT NE PEUT PAS FAIRE TOURNER AUJOURD'HUI, et il le DIT
//    plutôt que d'inventer : `pre_p2` sert `corpus_cours` depuis le contexte de
//    l'exercice, et LA CHAÎNE N'EN PORTE AUCUN. Servi à `null`, il arrête la
//    mesure en nommant le slot — « c'est ainsi qu'un module dit *le contexte ne
//    porte pas ce qu'il me faut* sans jamais lever d'exception ni inventer une
//    valeur » (`CONTRAT` §2). La fiche le sait et l'écrit à son §8, parmi ses
//    VRAIES QUESTIONS OUVERTES : « le corpus de cours n'est déclaré dans aucune
//    source qui fait foi ». *C'est une décision de conception, pas une pièce à
//    bricoler ici : le premier référent de la Justesse repose sur un objet que
//    le chantier n'a jamais écrit.*
// ============================================================================

import {
  formateFlottant, itere, longueur, separeParBlancs, str, strFlottant, strip,
  stripCaracteres, trie,
} from '../python'
import type {
  BranchementCompetence, ContexteBranchement, RenduPrePhase, SortieCode1, SortieCode2,
} from '../instruments'

// ── Les constantes du module, à l'identique ────────────────────────────────

/** `CATALOGUE` — les listes fermées du volet `squelette` du bloc machine (§4). */
const CATALOGUE: Record<string, readonly string[]> = {
  types_unite: ['reference', 'concept', 'exemple', 'donnee'],
  justesses: ['juste', 'approximative', 'contresens', 'inverifiable'],
  attributions: ['correcte', 'erronee', 'absente', 'n/a'],
  verdicts_apropos: ['sert_le_propos', 'plaque'],
  referents: ['cours', 'modele'],
  etendues: ['complet', 'lacunaire', 'fragmentaire', 'nul'],
  marqueurs_emploi: ['posee_seule'],
}

/**
 * LES SIX PARAMÈTRES, EN REPLI SEULEMENT. Leur maison est le bloc machine de la
 * fiche — « aucun seuil en dur nulle part » (`CONTRAT` §4) —, et la chaîne les
 * sert par `ctx.parametres`. Ces valeurs sont celles du `PARAMS` du module, qui
 * sont celles de la fiche : un test les confronte aux deux, pour qu'elles ne
 * puissent pas diverger en silence.
 */
const PARAMS_DEFAUT: Record<string, number> = {
  min_registres: 2,
  haut_registres: 3,
  haut_sources: 3,
  plafond_inverifiable_haut: 25,
  seuil_ratio_haut: 4.5,
  restitution_de_cours: 0,
}

const GRADES = ['défaillance forte', 'défaillance', 'satisfaite', 'haut'] as const
const NIVEAUX = ['Absent', 'Faible', 'Moyen', 'Bon', 'Acquis'] as const
const EN_DEFAUT: readonly string[] = ['défaillance forte', 'défaillance']

const FIN_PHRASE = '.!?…'

/** `00-referentiel.md` §2 — Absent/Faible/Moyen/Bon/Acquis = E/D/C/B/A (§2). */
const LETTRE_DU_NIVEAU: Record<string, string> = {
  Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
}

/** Ce que le BANC compare aux golds — la liste `OBSERVABLES` du module. */
const OBSERVABLES_MODULE = ['niveau', 'diversite', 'justesse', 'profil_moyen', 'etendue'] as const

/**
 * Ce que LA CHAÎNE FROIDE calcule — les huit observables du §5 de la fiche.
 * Aucun n'est dans la liste ci-dessus : les deux ensembles sont disjoints.
 */
const OBSERVABLES_TELEMETRIE = [
  'mobilisation', 'diversite_registres', 'diversite_sources', 'taux_justesse',
  'contresens', 'unite_plaquee', 'inverifiable', 'etendue_rappel',
] as const

/**
 * LES DEUX DÉNOMINATEURS, sous le nom EXACT que le `rapporte_a` de la fiche leur
 * donne. `observables.ts` les cherche par ce nom, à la lettre.
 */
/**
 * LES PARAMÈTRES QUE LA FICHE DÉCLARE FLOTTANTS — leurs `bornes` portent un point
 * décimal, et `PARAMS` du module en fait des `float`.
 *
 * ⚠️⚠️ TROUVÉ PAR L'ÉPREUVE NÉGATIVE, AUX SEUILS DÉPLACÉS. `str()` d'un flottant
 *    entier garde son point en Python — `5.0` — et le perd en JavaScript — `5`.
 *    Au défaut de 4,5 les deux textes coïncident et rien ne se voit ; le jour où
 *    le banc règle `seuil_ratio_haut` sur un entier — et il le fera, le
 *    paramètre est *provisoire (réglage empirique)* —, LA TRACE DIVERGE. Un test
 *    confronte cet ensemble aux types Python réels du module.
 */
const PARAMS_FLOTTANTS = new Set(['seuil_ratio_haut'])

/** `str(x)` d'un paramètre, du côté de Python : son TYPE vient de sa déclaration. */
function strParam(nom: string, valeur: number): string {
  return PARAMS_FLOTTANTS.has(nom) ? strFlottant(valeur) : str(valeur)
}

const DENOM_JUGEES = 'les unités jugées, les inverifiable exclues (§4)'
const DENOM_RELEVE = 'les unités du relevé'

// ── Les outils du module ───────────────────────────────────────────────────

type Objet = Record<string, unknown>
type ValeurReleve = number | string | boolean | null

function estObjet(v: unknown): v is Objet {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * `_n` — « normalise une valeur d'enum : casse, espaces, accents des variantes ».
 *
 * ⚠️ Le module emploie `.lower()`, PAS `.casefold()` : le portage fait de même.
 *    ⚠️ `str()` et `.strip()` sont ceux de Python (`../python`) — un `.strip()`
 *    de JavaScript laisserait passer un `\x85` d'OCR, et `String(v)` d'une liste
 *    rendrait `a,b` là où Python rend `['a', 'b']`.
 */
function _n(v: unknown): string {
  if (v === null || v === undefined) return ''
  let s = strip(str(v)).toLowerCase().split('’').join("'")
  s = s.split('erronée').join('erronee').split('donnée').join('donnee')
  s = s.split('invérifiable').join('inverifiable').split('modèle').join('modele')
  s = s.split('référence').join('reference').split('posée_seule').join('posee_seule')
  // `" ".join(s.split())` — le `split()` NU de Python : suites de blancs, aucune
  // chaîne vide, et `"".split()` vaut `[]` (donc `''`, jamais `' '`).
  return separeParBlancs(s).join(' ')
}

function _dans(valeur: unknown, cle: string): boolean {
  return CATALOGUE[cle].includes(_n(valeur))
}

/** `_p` — la valeur effective d'un paramètre, son défaut sinon. */
function _p(params: Readonly<Record<string, number | string>> | undefined, nom: string): number {
  const v = params?.[nom]
  if (typeof v === 'number') return v
  // ⚠️ PORTAGE — un paramètre servi en TEXTE (« 25 ») : Python comparerait un
  //    `str` à un `float` et lèverait. On le lit comme un nombre quand il en
  //    est un, et on retombe sur le défaut de la fiche sinon.
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return PARAMS_DEFAUT[nom]
}

/** `_majorite` — strictement plus de la moitié. Un total nul n'a pas de majorité. */
function _majorite(k: number, total: number): boolean {
  return total > 0 && k > total / 2.0
}

/**
 * `for x in (v or [])` de Python, sur ce qu'un JSON peut porter.
 *
 * ⚠️ UNE CHAÎNE EST ITÉRABLE ET REND SES CARACTÈRES : un `unites_mobilisees`
 *    rendu en texte par le modèle donne, pour Python, autant de « unités
 *    illisibles » que de caractères — et le portage doit dire la même chose.
 */
function elements(v: unknown): unknown[] {
  if (v === null || v === undefined) return []
  return itere(v).elements
}

/** `len(v or [])` de Python — `null` quand Python lèverait. */
function longueurOuZero(v: unknown): number {
  if (v === null || v === undefined) return 0
  return longueur(v) ?? 0
}

/**
 * `sorted(...)` sur les numéros d'unité — entiers, ou chaînes, jamais les deux.
 *
 * ⚠️ PORTAGE — Python LÈVE sur un mélange (`'<' not supported between instances
 *    of 'str' and 'int'`), et le contrat §3 l'interdit. On range alors les
 *    nombres avant les textes, chacun dans son ordre, et l'appelant le signale.
 */
function trieNumeros(valeurs: readonly unknown[]): { tries: unknown[]; mele: boolean } {
  const nombres = valeurs.filter((x) => typeof x === 'number') as number[]
  const autres = valeurs.filter((x) => typeof x !== 'number')
  const mele = nombres.length > 0 && autres.length > 0
  const textes = trie(autres.map((x) => str(x)))
  if (!mele) {
    return autres.length
      ? { tries: textes, mele }
      : { tries: [...nombres].sort((a, b) => a - b), mele }
  }
  return { tries: [...[...nombres].sort((a, b) => a - b), ...textes], mele }
}

// ── crochet 2 — `pre_p1` : le pré-relevé mécanique ─────────────────────────

/**
 * `pre_p1` — les phrases de la production NUMÉROTÉES, et le nombre de mots.
 * « Le relevé cite en numéros, le code convertit » (fiche §3).
 *
 * ⚠️⚠️ DETTE DE SOURCE, MARQUÉE ET NON CORRIGÉE. Le module écrit
 *    `pre_p1(texte, params=None)` — il prend LE TEXTE —, quand le
 *    `CONTRAT-MODULES.md` §2 et `banc.py` passent LE CONTEXTE : vérifié en
 *    appelant, `AttributeError: 'dict' object has no attribute 'strip'`.
 *    **Le portage suit LE CONTRAT** — c'est lui qui est au manifeste — et lit la
 *    copie dans le contexte, ce que le module veut dire. L'Expression porte
 *    exactement le même défaut et l'a traité ainsi. *Registre des ouverts,
 *    DETTES ; le module ne se corrige pas depuis ce dépôt.*
 *
 * ⚠️ `ctx.contexteExercice.copie` est la production APRÈS `prepareCopie` — la
 *    Connaissance n'en définit pas, donc c'est la production brute, et ce sont
 *    ces phrases-là que les numéros du relevé désignent.
 */
function prePhase1(ctx: ContexteBranchement): RenduPrePhase {
  const texte = ctx.contexteExercice.copie ?? ''
  const phrases: string[] = []
  let courante: string[] = []
  for (const car of [...texte]) {
    courante.push(car)
    if (FIN_PHRASE.includes(car)) {
      const bloc = strip(courante.join(''))
      if (bloc) phrases.push(bloc)
      courante = []
    }
  }
  const reste = strip(courante.join(''))
  if (reste) phrases.push(reste)
  const numerotees = phrases.map((p, i) => `[${i + 1}] ${p}`).join('\n')
  const nMots = separeParBlancs(texte).length
  return {
    production: texte,
    pre_releve: `${numerotees}\n\n(${phrases.length} phrases, ${nMots} mots)`,
  }
}

// ── crochet 4 — `pre_p2` : le contexte de l'exercice, servi au juge ────────

/**
 * `pre_p2` — les trois métadonnées que le juge lit à côté du relevé.
 *
 * « Le corpus du cours est requis DANS TOUS LES CAS, pas seulement en
 * restitution : le prompt P2 en fait son premier référent. La restitution ne
 * commande que l'étendue. » ⚠️ Une valeur `null` dit que le contexte ne la porte
 * pas : la chaîne refuse EN LA NOMMANT, plutôt que de servir un vide au juge.
 *
 * ⭐ IL TOURNE AVANT P1, et ses slots se vérifient AU CHARGEMENT — d'où les
 *    `slotsFournis` déclarés au branchement.
 */
function prePhase2(ctx: ContexteBranchement): Record<string, string | null> {
  const resti = Math.trunc(_p(ctx.parametres, 'restitution_de_cours') || 0)
  const consigne = ctx.contexteExercice.consigne
  const corpus = ctx.contexteExercice.corpus_cours
  return {
    // ⚠️ `restitution_de_cours` est À LA FOIS un paramètre et un slot de P2, et
    //    c'est le patron même d'un domicile double. Il n'est LU QU'ICI et dans
    //    `code1` ; les deux lisent `ctx.parametres`, jamais deux sources.
    restitution_de_cours: resti ? 'oui' : 'non',
    consigne: consigne ? consigne : null,
    corpus_cours: corpus ? corpus : null,
  }
}

// ── crochet 3 — `code1` : les deux comptes du relevé ───────────────────────

/**
 * `code1` — `registres` (valeurs de `type` distinctes) et `sources` (valeurs de
 * `source` distinctes, la chaîne vide exclue).
 *
 * « AUCUN nombre n'est injecté dans P2 : le juge de la Connaissance ne compte
 * rien (§4). » Seul `restitution_de_cours` lui est servi, et par `pre_p2`.
 */
function code1(artefactsP1: Record<string, unknown>, ctx: ContexteBranchement): SortieCode1 {
  const sortieP1 = artefactsP1.p1
  const alertes: string[] = []
  if (!estObjet(sortieP1)) {
    return { mesures: {}, document_p2: sortieP1, alertes: ['P1 illisible : aucun compte possible'] }
  }

  const unites = elements(sortieP1.unites_mobilisees)
  const vides = sortieP1.mentions_vides

  const types = new Set<string>()
  const sources = new Set<string>()
  let nPoseeSeule = 0
  const valides: unknown[] = []
  for (const u of unites) {
    if (!estObjet(u)) {
      alertes.push('unité du relevé illisible, écartée des comptes')
      continue
    }
    // §3 — « une unité n'existe que si on peut la citer ». Le garde-fou EXCLUT,
    // il n'alerte pas seulement (revue adversariale, RM8).
    const citationBrute = texteOuVide(u.citation)
    if (citationBrute === null) {
      // ⚠️ PORTAGE — `(u.get("citation") or "").strip()` lève sur un nombre ou
      //    un objet. Une valeur illisible rend une alerte, pas un défaut.
      alertes.push(`unité ${str(cleU(u))} : \`citation\` illisible (${str(u.citation)}) — `
        + 'écartée de tous les comptes, aucune valeur par défaut n\'est posée')
      continue
    }
    if (!strip(citationBrute)) {
      alertes.push(`unité ${str(cleU(u))} sans citation : une unité n'existe que si on peut `
        + 'la citer (§3) — écartée de tous les comptes')
      continue
    }
    valides.push(u)
    const t = _n(u.type)
    if (t && _dans(t, 'types_unite')) {
      types.add(t)
    } else {
      alertes.push(`type « ${str(u.type)} » hors catalogue : ne compte dans aucun registre`)
    }
    const sourceBrute = texteOuVide(u.source)
    if (sourceBrute === null) {
      // ⚠️ PORTAGE — même motif que la citation : `.strip()` sur un non-texte.
      alertes.push(`unité ${str(cleU(u))} : \`source\` illisible (${str(u.source)}) — `
        + 'ne compte dans aucune source')
    } else {
      const s = strip(sourceBrute)
      if (s) sources.add(s.toLowerCase())
    }
    if (CATALOGUE.marqueurs_emploi.includes(stripCaracteres(_n(u.emploi), '[]'))) nPoseeSeule += 1
  }

  // RF18 — le compte porte sur les CHAÎNES, pas sur les auteurs : « Kant »,
  // « Emmanuel Kant » et « E. Kant » en font trois. Le code ne fusionne PAS —
  // une fusion fausse (« Marx » avalé par « marxisme ») coûterait une source à
  // l'élève, et c'est le mauvais sens d'erreur. Il SIGNALE, le professeur
  // tranche, et le compte n'est pas touché (fiche §3).
  //
  // Tri par LONGUEUR, pas alphabétique : « emmanuel kant » précède « kant » dans
  // l'ordre alphabétique, et le test d'inclusion partait à l'envers.
  //
  // ⚠️ À LONGUEUR ÉGALE, PYTHON N'A PAS D'ORDRE STABLE — `sorted(set, key=len)`
  //    lit un ensemble, dont l'itération dépend du grain de hachage des chaînes.
  //    Aucune paire de MÊME longueur ne peut produire d'alerte (l'inclusion
  //    stricte y est impossible) : seul l'ORDRE de deux alertes peut différer,
  //    jamais leur nombre ni leur contenu. Ici, l'ordre d'apparition des unités
  //    tranche — déterministe, et c'est mieux.
  const liste = [...sources].map((s, i) => ({ s, i }))
    .sort((a, b) => ([...a.s].length - [...b.s].length) || (a.i - b.i))
    .map((x) => x.s)
  for (let i = 0; i < liste.length; i += 1) {
    for (const b of liste.slice(i + 1)) {
      if (b.includes(liste[i])) {
        alertes.push(`SOURCES_PEUT_ETRE_IDENTIQUES — « ${liste[i]} » est contenu dans `
          + `« ${b} » : deux désignations du même auteur ? Le compte n'est pas touché.`)
      }
    }
  }

  const resti = Math.trunc(_p(ctx.parametres, 'restitution_de_cours') || 0)
  const mesures: Record<string, unknown> = {
    n_unites: valides.length,
    registres: types.size,
    sources: sources.size,
    n_mentions_vides: longueurOuZero(vides),
    n_posee_seule: nPoseeSeule,
    restitution_de_cours: resti,
  }
  // ⛔ `injection_p2` N'EST PAS RENDU : le canal n'a pas été construit — aucun
  //    des six modules ne l'utilise —, et le module le rend vide de toute façon.
  //    ⭐ `document_p2` est OBLIGATOIRE dès que `code1` existe, et il porte le
  //    relevé AMPUTÉ DES UNITÉS ÉCARTÉES : c'est lui que le juge lit.
  return {
    mesures,
    document_p2: { ...sortieP1, unites_mobilisees: valides },
    alertes,
  }
}

/** `dict.get("u")` de Python : une clé absente vaut `None`, jamais `undefined`. */
function cleU(u: Objet): unknown {
  return u.u === undefined ? null : u.u
}

/**
 * `(v or "")` quand la suite fait `.strip()` — rend `null` là où Python lèverait.
 * Une valeur fausse au sens de Python (`None`, `0`, `""`, `[]`, `{}`) rend `""`.
 */
function texteOuVide(v: unknown): string | null {
  if (v === null || v === undefined || v === false || v === 0 || v === '') return ''
  if (Array.isArray(v)) return v.length === 0 ? '' : null
  if (typeof v === 'object') return Object.keys(v as Objet).length === 0 ? '' : null
  if (typeof v === 'string') return v
  return null
}

// ── les deux détections, le croisement ─────────────────────────────────────

interface UniteJugee { u: unknown; justesse: string; attribution: string; apropos: string; referent: string }

/** Les populations de la cascade — le module les calcule en local, la télémétrie en vit. */
interface Populations {
  n: number
  jugees: UniteJugee[]
  nInv: number
  faux: UniteJugee[]
  plaques: UniteJugee[]
  justes: UniteJugee[]
}

function populations(unites: UniteJugee[]): Populations {
  const jugees = unites.filter((u) => u.justesse !== 'inverifiable')
  return {
    n: unites.length,
    jugees,
    nInv: unites.length - jugees.length,
    faux: jugees.filter((u) => u.justesse === 'contresens' || u.attribution === 'erronee'),
    plaques: jugees.filter((u) => u.apropos === 'plaque'),
    justes: jugees.filter((u) => u.justesse === 'juste'),
  }
}

/**
 * `detecte_justesse` — la cascade du §4 : la première ligne qui répond décide.
 *
 * « Les `inverifiable` sortent des comptes, jamais de la mesure » : le nombre
 * d'unités effectivement JUGÉES est le dénominateur de toute majorité.
 */
function detecteJustesse(
  unites: UniteJugee[],
  params: Readonly<Record<string, number | string>>,
  trace: string[],
): string {
  const p = populations(unites)
  if (p.n === 0) {
    trace.push('Justesse : aucune unité → défaillance forte')
    return 'défaillance forte'
  }
  trace.push(`Justesse : ${p.n} unités, ${p.jugees.length} jugées, ${p.nInv} inverifiable ; `
    + `${p.faux.length} fausses, ${p.plaques.length} plaquées`)

  if (_majorite(p.faux.length, p.jugees.length)) {
    trace.push('  contresens/attributions erronées majoritaires → défaillance forte')
    return 'défaillance forte'
  }
  if (p.faux.length) {
    trace.push('  au moins un contresens ou une attribution erronée → défaillance')
    return 'défaillance'
  }
  if (_majorite(p.plaques.length, p.jugees.length)) {
    trace.push('  unités plaquées majoritaires → défaillance')
    return 'défaillance'
  }
  // Le libellé MOYEN du `00-` §3 a DEUX moitiés — « large mais approximatif /
  // décoratif ». Le plaqué portait la seconde ; la première n'avait aucune route,
  // et `approximative` ne servait qu'à fermer le haut : une seule approximation
  // coûtait autant que six (RF14).
  const approx = p.jugees.filter((u) => u.justesse === 'approximative')
  if (_majorite(approx.length, p.jugees.length)) {
    trace.push('  unités approximatives majoritaires → défaillance')
    return 'défaillance'
  }

  // RF17 — « n/a » n'est PAS « absente ». `absente` dit que l'unité prête quelque
  // chose à quelqu'un et que la copie ne le nomme pas : c'est un défaut, et il
  // ferme le haut. `n/a` dit qu'il n'y avait RIEN à attribuer.
  const parfaites = p.jugees.length > 0 && p.jugees.every(
    (u) => u.justesse === 'juste' && (u.attribution === 'correcte' || u.attribution === 'n/a')
      && u.apropos === 'sert_le_propos')
  if (!parfaites) {
    trace.push('  toutes les unités jugées ne sont pas parfaites → satisfaite')
    return 'satisfaite'
  }

  // BRANCHE REDONDANTE, GARDÉE POUR LA TRACE — et déclarée telle par le module.
  // Avec zéro inverifiable, la part vaut 0 et le rapport aussi : les deux portes
  // sont franchies pour TOUTE valeur des bornes. Elle reste parce qu'elle fait
  // dire à la trace « rien à compenser » plutôt qu'un rapport de zéro.
  if (p.nInv === 0) {
    trace.push('  toutes parfaites, aucun inverifiable → haut')
    return 'haut'
  }

  // Les deux portes, DANS L'ORDRE : « l'ordre ne change pas le verdict, il nomme
  // la cause » (§4). La part s'exprime en POINTS DE POURCENTAGE — 25 pour 25 %.
  const plafond = _p(params, 'plafond_inverifiable_haut')
  const seuil = _p(params, 'seuil_ratio_haut')
  const part = (100.0 * p.nInv) / p.n
  if (part > plafond) {
    trace.push(`  PORTE 1 fermée : ${formateFlottant(part, 1)} % d'inverifiable > ${strParam('plafond_inverifiable_haut', plafond)} %`)
    return 'satisfaite'
  }
  const ratio = part / p.jugees.length
  if (ratio > seuil) {
    trace.push(`  PORTE 2 fermée : rapport ${formateFlottant(ratio, 2)} > ${strParam('seuil_ratio_haut', seuil)}`)
    return 'satisfaite'
  }
  trace.push(`  les deux portes franchies (part ${formateFlottant(part, 1)} %, `
    + `rapport ${formateFlottant(ratio, 2)}) → haut`)
  return 'haut'
}

/**
 * `detecte_diversite` — deux comptes, aucun jugement (§4).
 *
 * « Une unité `plaque` compte : elle a bien été mobilisée, c'est son emploi qui
 * rate — la double peine serait une erreur. »
 */
function detecteDiversite(
  mesures: Record<string, unknown>,
  unites: UniteJugee[],
  params: Readonly<Record<string, number | string>>,
  trace: string[],
): string {
  if (unites.length === 0) {
    trace.push('Diversité : aucune unité → défaillance forte')
    return 'défaillance forte'
  }
  const reg = typeof mesures.registres === 'number' ? mesures.registres : 0
  const src = typeof mesures.sources === 'number' ? mesures.sources : 0
  trace.push(`Diversité : ${reg} registre(s), ${src} source(s)`)
  if (reg < _p(params, 'min_registres')) {
    trace.push(`  moins de ${strParam('min_registres', _p(params, 'min_registres'))} registres `
      + '→ défaillance')
    return 'défaillance'
  }
  if (reg >= _p(params, 'haut_registres') && src >= _p(params, 'haut_sources')) {
    trace.push('  registres et sources au niveau haut → haut')
    return 'haut'
  }
  trace.push('  ni défaillance ni haut → satisfaite')
  return 'satisfaite'
}

/** `croisement` — la règle d'agrégation du §4, appliquée telle qu'elle est citée. */
function croisement(diversite: string, justesse: string, trace: string[]): string {
  const dDef = EN_DEFAUT.includes(diversite)
  const jDef = EN_DEFAUT.includes(justesse)
  if (dDef && jDef) {
    if (diversite === 'défaillance forte' && justesse === 'défaillance forte') {
      trace.push('Croisement : les deux au plus bas → Absent')
      return 'Absent'
    }
    trace.push('Croisement : deux dimensions en défaut → Faible')
    return 'Faible'
  }
  if (dDef || jDef) {
    trace.push('Croisement : une seule dimension en défaut → Moyen')
    return 'Moyen'
  }
  if (diversite === 'haut' && justesse === 'haut') {
    trace.push('Croisement : les deux à haut niveau → Acquis')
    return 'Acquis'
  }
  trace.push('Croisement : les deux satisfaites ou mieux → Bon')
  return 'Bon'
}

// ── crochet 5 — `code2` : les deux cascades, le croisement, la télémétrie ──

interface Telemetrie { valeurs: Record<string, ValeurReleve>; alertes: string[] }

/** Les huit du §5 quand rien n'a pu être mesuré : `n/a`, et une alerte NOMMÉE. */
function telemetrieMuette(motif: string): Telemetrie {
  return {
    valeurs: {},
    alertes: OBSERVABLES_TELEMETRIE.map((c) => `${c} : ${motif} — valeur non déclarée`),
  }
}

function code2(
  artefactP2: unknown, sortieCode1: SortieCode1, ctx: ContexteBranchement,
): SortieCode2 {
  const params = ctx.parametres
  const trace: string[] = []
  const alertes: string[] = []
  const mesures = estObjet(sortieCode1?.mesures) ? sortieCode1.mesures : {}

  if (!estObjet(artefactP2)) {
    return {
      verdicts: Object.fromEntries(OBSERVABLES_MODULE.map((o) => [o, null])),
      trace: ['P2 illisible'],
      alertes: ['P2 illisible : aucun verdict'],
      _telemetrie: telemetrieMuette('P2 illisible, aucune unité jugée'),
    }
  }

  // -- apparier, et refuser toute valeur hors liste fermée (jamais de défaut)
  //
  // « Le silence du juge ne vaut jamais acquiescement » (`CONTRAT` §3).
  // `connues` vaut `null` quand AUCUN relevé n'a été transmis ; dès qu'un
  // document existe — même vide —, l'appartenance s'applique. Sans cette
  // distinction, un relevé vide désactivait précisément le contrôle dont le cas
  // vide a besoin, et P2 pouvait inventer une unité (RM9).
  const doc = sortieCode1?.document_p2
  let connues: Set<unknown> | null = null
  if (estObjet(doc)) {
    connues = new Set(elements(doc.unites_mobilisees).filter(estObjet).map(cleU))
  }
  const unites: UniteJugee[] = []
  for (const u of elements(artefactP2.unites)) {
    if (!estObjet(u)) {
      alertes.push('unité jugée illisible, consignée et ignorée')
      continue
    }
    if (connues !== null && !connues.has(cleU(u))) {
      alertes.push(`unité jugée ${str(cleU(u))} absente du relevé : consignée, jamais comptée`)
      continue
    }
    const champs: Record<string, string> = {}
    let mauvais = false
    for (const [cle, cat] of [
      ['justesse', 'justesses'], ['attribution', 'attributions'],
      ['apropos', 'verdicts_apropos'], ['referent', 'referents'],
    ] as const) {
      const v = _n(u[cle])
      if (!_dans(v, cat)) {
        alertes.push(`unité ${str(cleU(u))} : ${cle} = « ${str(u[cle])} » hors liste fermée — `
          + 'aucune valeur par défaut n\'est posée, l\'unité est écartée')
        mauvais = true
        break
      }
      champs[cle] = v
    }
    if (!mauvais) {
      unites.push({
        u: cleU(u),
        justesse: champs.justesse,
        attribution: champs.attribution,
        apropos: champs.apropos,
        referent: champs.referent,
      })
    }
  }

  if (!unites.length && elements(artefactP2.unites).length) {
    alertes.push('aucune unité jugée exploitable')
  }

  // -- bijection relevé ↔ jugement : une sortie P2 TRONQUÉE ne se compose pas.
  // Sans ce contrôle, omettre les unités défavorables réduisait le dénominateur
  // de la Justesse pendant que la Diversité gardait les unités du relevé : le
  // meilleur de deux documents incompatibles. Une omission devenait plus
  // favorable qu'une sortie complète — Acquis contre Faible (RM10).
  if (connues !== null) {
    const rendus = unites.map((u) => u.u)
    const ensRendus = new Set(rendus)
    const manqTri = trieNumeros([...connues].filter((x) => !ensRendus.has(x)))
    const dblTri = trieNumeros([...new Set(rendus.filter(
      (x) => rendus.filter((y) => y === x).length > 1))])
    if (manqTri.mele || dblTri.mele) {
      // ⚠️ PORTAGE — Python lève en triant des numéros de types mêlés.
      alertes.push('numéros d\'unité de types mêlés (nombres et textes) : rangés nombres '
        + 'd\'abord, sans quoi la comparaison lèverait (`CONTRAT-MODULES.md` §3)')
    }
    if (manqTri.tries.length || dblTri.tries.length) {
      const motif: string[] = []
      if (manqTri.tries.length) {
        motif.push(`unité(s) du relevé non jugée(s) : ${manqTri.tries.map((x) => str(x)).join(', ')}`)
      }
      if (dblTri.tries.length) {
        motif.push(`unité(s) jugée(s) deux fois : ${dblTri.tries.map((x) => str(x)).join(', ')}`)
      }
      const m = 'PASSAGE MANQUÉ — le juge n\'a pas rendu un jugement par unité relevée ; '
        + `${motif.join(' ; ')}. Aucun verdict n'est composé sur une sortie tronquée `
        + '(CONTRAT-MODULES.md §3).'
      alertes.push(m)
      return {
        verdicts: Object.fromEntries(OBSERVABLES_MODULE.map((o) => [o, null])),
        trace: [m],
        alertes,
        // ⭐ LE RELEVÉ N'EST PAS MUET POUR AUTANT, et le partage est celui de la
        //   chaîne : ce que CODE1 a compté est un fait du relevé de P1, vrai
        //   quoi que le juge ait rendu ; ce que le JUGE nourrit n'a pas eu lieu.
        _telemetrie: telemetrieDuReleveSeul(mesures),
      }
    }
  }

  const justesse = detecteJustesse(unites, params, trace)
  const diversite = detecteDiversite(mesures, unites, params, trace)
  let niveau = croisement(diversite, justesse, trace)

  // -- garde-fou du contresens : un éventail ne rachète pas l'erreur (§4.5)
  const pop = populations(unites)
  if (_majorite(pop.faux.length, pop.jugees.length)
      && NIVEAUX.indexOf(niveau as typeof NIVEAUX[number]) > NIVEAUX.indexOf('Faible')) {
    trace.push(`GARDE-FOU du contresens : erreurs majoritaires → ${niveau} plafonné à Faible`)
    niveau = 'Faible'
  }

  let profil = 'n/a' // non applicable hors Moyen (`CONTRAT` §3)
  if (niveau === 'Moyen') {
    if (!EN_DEFAUT.includes(justesse)) {
      profil = 'juste-mais-etroit'
    } else {
      // Deux causes distinctes, deux retours distincts (fiche §5) : « fais-le
      // travailler » pour le plaqué, « apprends-le » pour l'approximation.
      const approx = pop.jugees.filter((u) => u.justesse === 'approximative')
      profil = (_majorite(approx.length, pop.jugees.length)
        && !_majorite(pop.plaques.length, pop.jugees.length))
        ? 'large-mais-approximatif' : 'large-mais-decoratif'
    }
    trace.push(`Profil du Moyen : ${profil}`)
  }

  // -- l'étendue : rendue EN CLASSE seulement, le contexte est servi par le code
  const brute = _n(artefactP2.etendue)
  let etendue: string | null = brute === '' ? null : brute
  const restiLu = mesures.restitution_de_cours === undefined
    ? _p(params, 'restitution_de_cours') : mesures.restitution_de_cours
  const resti = entierOuNull(restiLu)
  if (resti === null) {
    // ⚠️ PORTAGE — `int("oui")` lève. Une valeur illisible rend une alerte.
    alertes.push(`restitution_de_cours illisible (${str(restiLu)}) : l'étendue est traitée hors `
      + 'contexte de restitution, aucune valeur par défaut n\'est posée')
  }
  if ((resti ?? 0) !== 1) {
    if (etendue) {
      alertes.push(`étendue « ${etendue} » rendue hors contexte de restitution : écartée`)
    }
    etendue = 'n/a' // non applicable hors restitution (`CONTRAT` §3)
  } else if (etendue && !_dans(etendue, 'etendues')) {
    alertes.push(`étendue « ${str(artefactP2.etendue)} » hors liste fermée : écartée`)
    etendue = null
  }

  if (unites.length === 0) {
    alertes.push('aucune unité mobilisée : le niveau Absent est un constat, '
      + 'pas un défaut de mesure')
  }

  return {
    verdicts: { niveau, diversite, justesse, profil_moyen: profil, etendue },
    trace,
    alertes,
    // ⭐ LE CANAL PRIVÉ — « ce qui récapitule RECOPIE, il ne recalcule jamais »
    //   (`CONTRAT` §3). Le tiret bas est la marque ; sans elle, une quatrième
    //   clé publique est une violation, et `refusFormeCode2` l'arrête.
    _telemetrie: telemetrie(mesures, pop, etendue),
  }
}

/** `int(x)` de Python — `null` là où il lèverait. */
function entierOuNull(v: unknown): number | null {
  if (v === null || v === undefined) return 0 // `… or 0` : `None` vaut 0
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'string') {
    const t = strip(v)
    if (t === '') return 0 // `"" or 0`
    return /^[+-]?\d+$/.test(t) ? Number(t) : null
  }
  return null
}

// ── LA TÉLÉMÉTRIE DU §5 — l'autre moitié du portage, celle qui ne se voit pas ─

/**
 * LES TROIS COMPTES QUE `code1` ÉTABLIT — vrais quoi que le juge ait rendu.
 *
 * Servis seuls quand le passage est MANQUÉ : ce sont des faits du relevé de P1,
 * et les taire les ferait sortir du dénominateur du taux (`01-` §8.2) alors
 * qu'ils ont bel et bien une occasion. Les cinq que le JUGE nourrit, eux, n'en
 * ont pas — ils sortent en `n/a`, chacun avec son alerte nommée.
 */
function telemetrieDuReleveSeul(mesures: Record<string, unknown>): Telemetrie {
  const nombre = (k: string): number | null => (typeof mesures[k] === 'number' ? mesures[k] as number : null)
  const motif = 'PASSAGE MANQUÉ — le juge n\'a pas rendu un jugement par unité relevée, '
    + 'aucun verdict n\'est composé'
  return {
    valeurs: {
      mobilisation: nombre('n_unites'),
      diversite_registres: nombre('registres'),
      diversite_sources: nombre('sources'),
    },
    alertes: ['taux_justesse', 'contresens', 'unite_plaquee', 'inverifiable', 'etendue_rappel']
      .map((c) => `${c} : ${motif} — valeur non déclarée`),
  }
}

/**
 * LES HUIT OBSERVABLES DU §5, et rien d'autre.
 *
 * Quatre se lisent sur ce que `code1` a compté ou sur ce que le juge a rendu ;
 * les QUATRE AUTRES demandent les populations de la cascade — que le module
 * calcule en local et ne rend jamais.
 *
 * ⚠️ LES DEUX DÉNOMINATEURS SONT AU RELEVÉ, sous le nom EXACT de leur
 *    `rapporte_a`. `observables.ts` divise lui-même les `comptage rapporté` ;
 *    une `proportion`, elle, se divise ICI, en entier (piège 11 bis).
 */
function telemetrie(
  mesures: Record<string, unknown>, pop: Populations, etendue: string | null,
): Telemetrie {
  const alertes: string[] = []
  const nombre = (k: string, obs: string): number | null => {
    if (typeof mesures[k] === 'number') return mesures[k] as number
    alertes.push(`${obs} : \`${k}\` absent des mesures de code1 — valeur non déclarée`)
    return null
  }

  // -- `taux_justesse` : « proportion d'unités `juste`, les `inverifiable` HORS
  //    DU DÉNOMINATEUR » (§5), et le `sens` du bloc machine dit la même chose —
  //    « la majorité stricte des unités JUGÉES sont justes ». Les deux endroits
  //    nomment LA MÊME population, exclusion comprise : rien à arbitrer ici.
  //    ⚠️ Un dénominateur nul rend `null` — donc `n/a` —, JAMAIS 0 : une copie
  //    dont tout est invérifiable n'a pas « 0 % de justesse », elle n'en a pas.
  //    ⛔ ET RIEN NE S'ARRONDIT ICI : ni la fiche ni le module ne le demandent, et
  //    un arrondi inventé déplacerait une valeur autour du seuil de 0,5 sans
  //    qu'aucune source le dise. `observables.ts` écrit la valeur telle quelle.
  const tauxJustesse = pop.jugees.length === 0
    ? null : pop.justes.length / pop.jugees.length

  // -- `etendue_rappel` : la valeur du juge, sur son échelle. Hors classe, elle
  //    vaut `n/a` — et `n/a` n'est PAS sur l'échelle : on rend `null`, qui dit
  //    « pas d'occasion » sans faire crier le contrôle d'échelle.
  const etendueRappel = etendue && CATALOGUE.etendues.includes(etendue) ? etendue : null

  return {
    valeurs: {
      mobilisation: nombre('n_unites', 'mobilisation'),
      diversite_registres: nombre('registres', 'diversite_registres'),
      diversite_sources: nombre('sources', 'diversite_sources'),
      taux_justesse: tauxJustesse,
      // « unités en `contresens` + attributions `erronee` » (§5) — exactement la
      // population que la cascade appelle `faux`, et que sa majorité plafonne.
      contresens: pop.faux.length,
      // « unités dont l'`apropos` vaut `plaque` » (§5), parmi les JUGÉES.
      unite_plaquee: pop.plaques.length,
      // « unités dont la justesse n'a pu être établie contre aucun des deux
      // référents » (§5) — le `n_inv` des deux portes du haut.
      inverifiable: pop.nInv,
      etendue_rappel: etendueRappel,
      // LES DEUX DÉNOMINATEURS, sous leur nom exact.
      [DENOM_JUGEES]: pop.jugees.length,
      [DENOM_RELEVE]: pop.n,
    },
    alertes,
  }
}

// ── crochet 6 — `conformite` : les alertes de recette ─────────────────────

/**
 * `_INTERDITS` — ce qu'un juge n'a pas le droit de rendre. « Si le modèle écrit
 * un nombre ou une lettre, la chaîne est en erreur » (fiche §4).
 */
const INTERDITS = ['niveau', 'palier', 'palier_base', 'seuil_franchi', 'diversite',
  'registres', 'sources', 'taux_justesse', 'mobilisation', 'note', 'lettre']

/**
 * `conformite` — « les alertes de recette : ce que ni les réplicats ni les golds
 * ne voient ». ⚠️ ALERTE SEULE : il ne retire rien des comptes.
 *
 * ⭐ LA CONNAISSANCE EST L'UN DES DEUX MODULES SUR SIX à porter le contrôle
 *    d'existence des citations, et le seul à le porter DANS `conformite` —
 *    l'Expression le porte dans `code1`. « Deux modules, deux crochets
 *    différents » est un `[à valider]` du contrat §8 : le portage garde le sien
 *    OÙ IL EST et relève l'écart, il ne l'uniformise pas.
 *
 * ⚠️ OÙ LE PORTAGE LIT LA PRODUCTION, ET POURQUOI IL AJOUTE UN TROISIÈME
 *    DOMICILE. Le module la cherche sous `mesures._production` puis
 *    `sortie_p1._production`, et sa propre alerte de repli dit le motif : « la
 *    production N'EST PAS JOINTE AU CONTEXTE ». Dans la chaîne elle l'EST —
 *    `ctx.contexteExercice.copie`, le texte même que P1 a reçu —, et la lire là
 *    ne réveille aucun contrôle nouveau : c'est celui du module, alimenté par
 *    l'entrée qu'il nomme. Sur les vecteurs, où le contexte est vide, le repli
 *    « NON EXÉCUTÉ » tombe exactement comme dans le module.
 */
function conformite(
  artefactsP1: Record<string, unknown>,
  artefactP2: unknown,
  sortieCode1: SortieCode1,
  _sortieCode2: SortieCode2,
  ctx: ContexteBranchement,
): string[] {
  const a: string[] = []
  const sortieP1 = artefactsP1?.p1

  if (estObjet(artefactP2)) {
    for (const cle of Object.keys(artefactP2)) {
      if (INTERDITS.includes(str(cle).toLowerCase())) {
        a.push(`RECETTE : P2 rend « ${cle} » — le juge ne calcule rien, la chaîne est en erreur`)
      }
    }
    for (const u of elements(artefactP2.unites)) {
      if (estObjet(u)) {
        for (const cle of Object.keys(u)) {
          if (INTERDITS.includes(str(cle).toLowerCase())) {
            a.push(`RECETTE : une unité jugée porte « ${cle} »`)
          }
        }
      }
    }
  }

  // la traque du redressement : le relevé cite-t-il vraiment la copie ?
  if (estObjet(sortieP1) && estObjet(sortieCode1 as unknown)) {
    const depuisMesures = estObjet(sortieCode1.mesures) ? sortieCode1.mesures._production : undefined
    const prod = texteVrai(depuisMesures)
      ?? texteVrai(sortieP1._production)
      ?? texteVrai(ctx?.contexteExercice?.copie)
      ?? ''
    if (prod) {
      for (const u of elements(sortieP1.unites_mobilisees)) {
        const cit = estObjet(u) ? texteOuVide(u.citation) : ''
        if (cit && !prod.includes(stripCaracteres(cit, '"« »'))) {
          a.push(`FIDÉLITÉ : la citation de l'unité ${str(estObjet(u) ? cleU(u) : null)} ne se `
            + 'retrouve pas dans la production — un relevé qui redresse détruit la mesure de '
            + 'Justesse')
        }
      }
    } else {
      // Sans la production, le contrôle ne peut pas travailler. Il le DIT : « un
      // contrôle silencieux se lit comme un contrôle qui a passé » (`CONTRAT`
      // §3). Mais il ne parle QUE s'il y avait quelque chose à contrôler — un
      // contrôle qui crie sur les copies sans citation entraînerait à l'ignorer.
      const aVerifier = elements(sortieP1.unites_mobilisees)
        .filter((u) => estObjet(u) && strip(texteOuVide(u.citation) ?? '')).length
      if (aVerifier) {
        a.push(`FIDÉLITÉ : contrôle d'existence des citations NON EXÉCUTÉ sur ${aVerifier} `
          + 'citation(s) — la production n\'est pas jointe au contexte (CONTRAT-MODULES.md §3)')
      }
    }
  }
  return a
}

/** `x or <suivant>` quand `x` doit être un texte non vide. */
function texteVrai(v: unknown): string | null {
  return typeof v === 'string' && v !== '' ? v : null
}

// ════════════════════════════════════════════════════════════════════════════
// LE BRANCHEMENT
// ════════════════════════════════════════════════════════════════════════════

export const BRANCHEMENT_CONNAISSANCE: BranchementCompetence = {
  /**
   * ⭐ LA CONNAISSANCE EST LA COMPÉTENCE LA PLUS EXIGEANTE EN SLOTS — SEPT, et
   *    deux crochets les servent. Trois en P1, et un seul est natif :
   *    `{consigne}` vient du contexte de l'exercice ; `{production}` et
   *    `{pre_releve}` sont servis par `pre_p1`, DÉCLARÉS ici pour que le refus
   *    tombe AU CHARGEMENT et jamais au premier appel payé.
   */
  extractions: () => [{
    cle: 'p1',
    tetePrompt: 'P1',
    slotsFournis: ['production', 'pre_releve'],
    pre: prePhase1,
  }],

  /**
   * QUATRE SLOTS AU PROMPT DE JUGEMENT, et c'est le maximum du corpus.
   *
   * ⭐ `SLOT_DOCUMENT_P2` EST DÉCLARÉ, ET C'EST OBLIGATOIRE ICI — « le slot du
   *    document se déclare dès que le prompt P2 en porte plus d'un ». ⛔ Il ne
   *    se devine JAMAIS par soustraction, et le contrat dit exactement pourquoi :
   *    « jusqu'au jour où un `pre_p2` incomplet ferait passer le relevé entier
   *    dans le slot du référent, sans que rien ne le voie ».
   *
   * Les trois autres viennent de `pre_p2` — le contexte de l'exercice. ⚠️ AUCUN
   * NATIF à P2 : c'est la règle du banc, pas un oubli.
   */
  jugement: () => ({
    tetePrompt: 'P2',
    slotDocument: 'releve_phase_1',
    slotsFournis: ['consigne', 'corpus_cours', 'restitution_de_cours'],
    preP2: prePhase2,
  }),

  code1,

  code2,

  conformite,

  /** `00-referentiel.md` §2 — Absent/Faible/Moyen/Bon/Acquis = E/D/C/B/A. */
  lettre: (c2) => {
    const niveau = c2.verdicts?.niveau
    return typeof niveau === 'string' ? (LETTRE_DU_NIVEAU[niveau] ?? null) : null
  },

  releve: (c2) => {
    const t = estObjet(c2._telemetrie) ? c2._telemetrie as unknown as Telemetrie : null
    // « Ce qui récapitule RECOPIE la trace, il ne la recalcule jamais » (§3).
    if (!t) {
      return {
        releve: {},
        alertes: ['les observables de télémétrie ne sont pas parvenus de Code2 — les huit du §5 '
          + 'sortiraient en `n/a`'],
      }
    }
    return { releve: t.valeurs, alertes: t.alertes }
  },

  /**
   * ⛔ `delta` N'EST PAS DÉCLARÉ, ET C'EST UNE ABSENCE MOTIVÉE.
   *
   * « Ce que "comparer deux squelettes" veut dire dépend de la grille : la source
   * ne le définit pas hors de la fiche, donc le branchement le porte » — or LA
   * FICHE DE LA CONNAISSANCE NE LE DÉFINIT NULLE PART. ⚠️ Le mot « delta »
   * n'apparaît PAS UNE FOIS dans `competences/connaissance.md` : ni son §3, ni
   * son §4, ni son §5, ni son bloc machine, ni son §8 ne disent ce que comparer
   * un squelette de v1 à un squelette de version finale voudrait dire ici.
   *
   * ⚠️⚠️ QUATRE FICHES SUR QUATRE SE TAISENT — Expression, Argumentation,
   *    Structure, Connaissance. Ce n'est plus un oubli de fiche : c'est une case
   *    du gabarit du `03-` §1 que personne n'a remplie. *Registre des ouverts,
   *    item 47 ; l'inventer ici serait trancher une règle de grille depuis le
   *    code, ce qu'aucun lot ne fait.*
   *
   * La chaîne le dit alors par une alerte et laisse NULL. ⚠️ ET NULL N'EST PAS 0 :
   * une passation en classe n'a pas de version finale.
   */
}

// Exportés pour le test du portage — jamais pour la chaîne, qui ne connaît que
// `BRANCHEMENT_CONNAISSANCE`. Les fonctions internes, elles, restent internes :
// ce qui se compare au module se compare PAR LES CROCHETS, comme le banc le fait.
export {
  OBSERVABLES_TELEMETRIE, OBSERVABLES_MODULE, PARAMS_DEFAUT, PARAMS_FLOTTANTS, CATALOGUE,
  DENOM_JUGEES, DENOM_RELEVE, GRADES, NIVEAUX,
}
