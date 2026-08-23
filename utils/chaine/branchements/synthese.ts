// ============================================================================
// C4 · L10 — LE BRANCHEMENT DE LA SYNTHÈSE. Tout le calcul, aucun jugement.
// ----------------------------------------------------------------------------
// EXTRACTION, PAS RÉGÉNÉRATION. Ce fichier est le portage, fonction pour
// fonction, de `copies-tests/synthese/code.py` (dépôt de conception, calcul
// v0.2). « Le module encode ce que la fiche ne dit pas encore : le régénérer
// depuis la fiche le jetterait » (`CONTRAT-MODULES.md` §7).
//
//   La table d'extraction, suivie à la lettre :
//     pre (P1A)   ← `pre_p1a`     (le pré-relevé mécanique, et son canal privé)
//     pre (P1B)   ← `pre_p1b`     (ce que l'aligneur reçoit du relevé aveugle)
//     code1       ← `code1`       (listes fermées, statuts dérivés, alignement,
//                                  appariement des rapports, `document_p2`)
//     code2       ← `code2`       (crible, borne basse, base, plafonds, seuil)
//     conformite  ← `conformite`  (ce que ni les réplicats ni les 5×5 ne voient)
//
//   ⛔ AUCUN `prepare_copie` et AUCUN `pre_p2` : le module n'en définit pas. Le
//      prompt P2 ne porte QU'UN slot, `{squelette}` — c'est le document, sans
//      déclaration (`CONTRAT` §2).
//
// ⚠️ LA FICHE FAIT FOI POUR LA RÈGLE, LE MODULE POUR LE CALCUL. Lire la fiche
//    pour comprendre (`competences/synthese.md` : §2 l'échelle, §3 le squelette
//    en DEUX temps, §4 les règles de notation et le bloc machine, §5 les treize
//    observables) ; lire le module pour porter.
//
// ⭐⭐ ELLE EST LA SEULE DES SIX DONT LA CHAÎNE A UNE AUTRE FORME — TROIS APPELS,
//    ET DEUX QUAND LE RÉFÉRENT EST LE COURS. « Relevé aveugle → aligneur → juge
//    → code », « parce que l'alignement EST sa mesure » (`01-` §11) ; l'aligneur
//    ne tourne pas là où il n'y a pas de référence (`07-` §1.2). ⚠️ Le référent
//    se LIT sur `ctx.referent`, il ne se devine pas depuis la consigne.
//
// ⭐ CE QUE LE PORTAGE AJOUTE, ET QUI N'EST PAS DANS LE MODULE : les TREIZE
//    OBSERVABLES DE TÉLÉMÉTRIE du §5 — le plus gros paquet des six, quand le
//    module n'en rend que trois (`niveau`, `palier_base`, `seuil_franchi`, ce
//    que le BANC compare aux golds). Le `03-` §1, gelé, dit qui les applique :
//    « il n'est pas appliqué par le module mais par LA CHAÎNE FROIDE ».
//
// ⭐ DEUX DÉNOMINATEURS, ET LE RELEVÉ LES PORTE SOUS LEUR NOM EXACT.
//    `rapporte_a` est un texte libre et `observables.ts` cherche l'entrée SOUS
//    CE NOM : « les apports tentés » (trois observables) et « les unités
//    appariées à la référence » (deux). L'un manquerait, et les observables qui
//    s'y rapportent sortiraient en `n/a` sans un mot.
//
// ⛔ LA POPULATION DE `copie_verbatim` EST UN ARBITRAGE DE LOUIS, PAS UNE
//    LECTURE. Le §5 écrit « part d'unités en `copie` », SANS dénominateur — la
//    seule des six `proportion` de cette fiche à ne pas écrire sa fraction —, et
//    la fiche distingue deux populations (« unités » et « unités couvrantes »).
//    ⭐ Tranché le 23/08 : **les unités couvrantes**, comme le module. C'est le
//    parallèle de `part_integrative`, dont le §4 « Ce que le code compose » #3
//    dit « sur les unités couvrantes » dans la même énumération. ⚠️ Il porte
//    DEUX FOIS : sur l'observable du §5, et sur la branche Absent du §4
//    (« reprise verbatim dominante »).
//
// ⛔ AUCUN SEUIL EN DUR pour la télémétrie : les seuils de réussite vivent au
//    bloc machine de la fiche, l'instrument dérivé les porte, `observables.ts`
//    lit le verdict contre eux. Ici, on rend des VALEURS. Les paramètres de
//    calcul arrivent par `ctx.parametres` (`valeursDesParametres()`), et jamais
//    `instrument.parametres` : la forme dérivée est un BLOC par paramètre, pas
//    une valeur à plat — et cette fiche est l'une des deux qui en portent
//    l'essentiel. ⚠️ `compression_cible` a `defaut: null` : il est donc ABSENT
//    de `ctx.parametres`, exactement comme `params.get()` rend `None` côté
//    Python. Aucun signal de compression n'est émis sans réglage — c'est voulu.
//
// ⚠️ LES ÉCARTS PYTHON/JAVASCRIPT QUI MORDENT ICI, tous portés par `../python` :
//    `casefold()` (`_norm`, `_normEtats`) · les BLANCS de Python (`\s` de `re`,
//    dans `_norm`, `_normEtats` et le découpage des phrases) · le `\b` UNICODE
//    (`_borneBasse` : dans « infidèle », Python ne voit AUCUN « fidele »
//    isolé) · le `\w` UNICODE (`_mots`) · `str()` d'une LISTE dans les alertes
//    (`[3, 4]`, pas `3,4`) · `repr()` (`{u!r}`) · le FORMATAGE `%.2f`/`%.3f`
//    dans les traces (Python tranche les égalités AU PAIR) · et surtout `str()`
//    D'UN FLOTTANT dans la trace du palier Moyen : `relation_rendue` à 1.0
//    s'écrit « 1.0 » pour Python et « 1 » pour JavaScript. ⛔ `for x in v` sur
//    une CHAÎNE rend ses CARACTÈRES : un `entre: "12"` ne relie pas les unités
//    1 et 2, il porte deux unités inexistantes — `itere()` le porte, on ne le
//    « répare » surtout pas.
//
// ⚠️ CE QUE LE PORTAGE DURCIT, ET POURQUOI. Le module lève sur des formes que P1
//    ou P2 peuvent prendre et qu'il n'attend pas (un rapport, une unité ou un
//    apport qui ne sont pas des objets ; un `sorted()` sur des identifiants de
//    types mêlés). Le contrat §3 l'interdit — « le module ne lève jamais
//    d'exception : elle traverserait le banc et emporterait la trace avec elle »
//    — et prescrit l'inverse : « une valeur illisible rend une alerte, pas une
//    valeur par défaut ». Chaque durcissement est marqué ⚠️ PORTAGE, ne se
//    déclenche sur AUCUN vecteur, et rend une alerte nommée.
//
// ⚠️⚠️ CE QUE CE BRANCHEMENT NE PEUT PAS FAIRE TOURNER AUJOURD'HUI SUR LE
//    RÉFÉRENT TEXTE, et il le DIT plutôt que d'inventer. L'aligneur réclame
//    `{reference_decomposee}` ; ⛔ LA CHAÎNE NE SERT PAS LA RÉFÉRENCE
//    DÉCOMPOSÉE : son contexte porte QUATRE noms — `sujet`, `consigne`, `copie`,
//    `mode` —, et `contexte.ts` ne lit `exercices.reference_id` que pour en
//    déduire un référent `texte | cours | null`. Servi à `null`, le slot arrête
//    la mesure EN LE NOMMANT (`CONTRAT` §2). ⭐ C'est LE MÊME CANAL MANQUANT que
//    celui du Questionnement, et un seul geste ferme les deux :
//    `exercices_references` porte `contenu` (la référence) ET
//    `source_contenu_id → scriptorium_contenus.texte_extrait` (le matériau, dont
//    le pré-relevé a besoin pour la compression et les recouvrements).
//    *Relevé, non tranché ici : poser ce fournisseur natif touche `contexte.ts`
//    et `chaine.ts`, hors du périmètre d'un lot dont « la réussite se mesure à
//    un diff quasi nul ».* ⭐ La Synthèse mesure donc AUJOURD'HUI sur le
//    référent COURS — la synthèse en classe (`01-` §10) —, et là seulement.
// ============================================================================

import {
  CAR_BLANC_PYTHON, CAR_CHIFFRE_PYTHON, CAR_MOT_PYTHON, casefold, formateFlottant,
  itere, motIsole, repr, str, strFlottant, strip,
} from '../python'
import type {
  BranchementCompetence, ContexteBranchement, SortieCode1, SortieCode2, SpecExtraction,
} from '../instruments'

type Objet = Record<string, unknown>

// ── Les constantes du module, à l'identique ────────────────────────────────

/** `CATALOGUE` — le volet `squelette` du bloc machine, mot pour mot. */
const CATALOGUE = {
  referents: ['texte', 'cours'],
  natures_rapport: ['additive', 'nuance', 'refute', 'illustre', 'conclut', 'precise'],
  operations: ['copie', 'paraphrase', 'fusion', 'generalisation', 'apport'],
  // RF16 : le quatrième verdict nommait une PROVENANCE, alors que le test qui le
  // produit mesure une COUVERTURE. Renommé (fiche §4).
  verdicts_apport: ['organisateur', 'vide', 'decoratif', 'non_couvrant'],
  fidelites: ['fidele', 'contresens_partiel', 'contresens_majeur', 'limite'],
  formes_these: ['affirmation_complete', 'mot_ou_syntagme', 'question', 'absente'],
  fonctions_reference: ['defend_these', 'explique', 'illustre'],
  statuts_unite: ['essentielle', 'secondaire', 'illustration'],
} as const satisfies Record<string, readonly string[]>

/**
 * Les défauts du bloc machine — le filet, jamais la source.
 *
 * ⚠️ `compression_cible` n'y figure pas : son défaut est `null` à la fiche, donc
 *    `valeursDesParametres()` ne le porte pas et `params.get()` rend `None` côté
 *    Python. Les deux côtés lisent la même absence.
 */
const PARAMS_DEFAUT: Record<string, number> = {
  part_essentielles_bon: 0.8,
  part_rapports_rendus_bon: 0.8,
  seuil_ngrammes_copie: 8,
  contresens_partiels_plafond_moyen: 2,
  tolerance_compression: 0.5,
}

const ORDRE_PALIERS = ['Absent', 'Faible', 'Moyen', 'Bon', 'Acquis'] as const
const STATUT_PAR_FONCTION: Record<string, string> = {
  defend_these: 'essentielle',
  explique: 'secondaire',
  illustre: 'illustration',
}
const RANG_STATUT: Record<string, number> = { essentielle: 3, secondaire: 2, illustration: 1 }
const OPERATIONS_INTEGRATIVES: readonly string[] = ['fusion', 'generalisation']
const OPERATIONS_UNE_POUR_UNE: readonly string[] = ['copie', 'paraphrase']
const ETATS_LISIBLES: readonly string[] = ['contresens_majeur', 'contresens_partiel', 'fidele']

/** Ce que le BANC compare aux golds — trois, et ce ne sont pas ceux du §5. */
const OBSERVABLES_MODULE = ['niveau', 'palier_base', 'seuil_franchi'] as const

/** Les TREIZE du §5 — la télémétrie du routeur, l'autre moitié du portage. */
const OBSERVABLES_TELEMETRIE = [
  'mobilisation_reliee', 'apport_organisateur', 'apport_vide', 'apport_decoratif',
  'apport_non_couvrant', 'couverture_essentielles', 'part_integrative', 'relation_rendue',
  'elagage', 'copie_verbatim', 'contresens_partiel', 'contresens_majeur', 'taux_compression',
] as const

/**
 * Les HUIT que le §5 déclare « actifs sur le référent texte seulement ».
 *
 * ⚠️ Sur le référent cours ils sont ABSENTS du relevé — « une entrée absente veut
 *    dire pas d'occasion et rend `n/a` » —, et le relevé le DIT par une alerte
 *    nommée : le « fait quand » veut une valeur ou une alerte, jamais un
 *    silence. *La fiche parle de « sept observables du référent texte » et sa
 *    table en porte huit : `taux_compression` est le huitième, et il est le seul
 *    que le §5 exclut des observables REQUIS — « un signal de conformité de
 *    consigne, pas de compétence ».*
 */
const OBSERVABLES_TEXTE_SEULEMENT: readonly string[] = [
  'couverture_essentielles', 'part_integrative', 'relation_rendue', 'elagage',
  'copie_verbatim', 'contresens_partiel', 'contresens_majeur', 'taux_compression',
]

/** Les deux `rapporte_a`, sous leur nom EXACT — `observables.ts` les cherche ainsi. */
const DENOM_APPORTS = 'les apports tentés'
const DENOM_UNITES_APPARIEES = 'les unités appariées à la référence'

/** `00-referentiel.md` §2, et les `synonymes` du bloc machine. */
const LETTRE_DU_NIVEAU: Record<string, string> = {
  Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
}

// ── Les outils du module ───────────────────────────────────────────────────

function estObjet(v: unknown): v is Objet {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** `dict.get(cle)` — `None` sur tout ce qui n'est pas un dict est une LEVÉE côté
 *  Python ; ici l'appelant contrôle le type AVANT (⚠️ PORTAGE, voir l'en-tête). */
function champ(o: unknown, cle: string): unknown {
  return estObjet(o) ? o[cle] : undefined
}

const RE_BLANCS_SUITE = new RegExp(`[${CAR_BLANC_PYTHON}]+`, 'gu')
const RE_ETATS_SUITE = new RegExp(`[${CAR_BLANC_PYTHON}_\\-]+`, 'gu')

/** `_norm` — `re.sub(r"\s+", " ", s).strip().casefold()`, blancs de Python compris. */
function _norm(s: unknown): string {
  const t = typeof s === 'string' ? s : ''
  return casefold(strip(t.replace(RE_BLANCS_SUITE, ' ')))
}

/**
 * `_norm_etats` — normalise une note POUR Y CHERCHER DES NOMS D'ÉTAT.
 *
 * Le prompt demande au juge de « préciser entre quels deux états » ; la fiche lit
 * ces états dans la note, EN FRANÇAIS — accents et espaces compris, pas seulement
 * dans leur graphie machine (§4, borne basse ; RM12). Accents retirés, tiret bas
 * / trait d'union / blancs ramenés à un espace.
 */
function _normEtats(s: unknown): string {
  const t = typeof s === 'string' ? s : ''
  const sansAccents = t.normalize('NFD').replace(/\p{M}/gu, '')
  return casefold(strip(sansAccents.replace(RE_ETATS_SUITE, ' ')))
}

/** Ramène `palier` à `plafond` s'il le dépasse. Ne relève JAMAIS. */
function _plafonne(palier: string, plafond: string): string {
  const i = (ORDRE_PALIERS as readonly string[]).indexOf(palier)
  const j = (ORDRE_PALIERS as readonly string[]).indexOf(plafond)
  return i > j ? plafond : palier
}

/**
 * Le statut d'une unité de la référence, dérivé de ses fonctions (fiche §3.2).
 *
 * Plusieurs fonctions → la plus haute du tableau. Fonction inconnue → alerte,
 * jamais de statut par défaut. ⚠️ `max(..., key=…)` de Python rend le PREMIER
 * maximum : à rang égal les statuts sont identiques, l'ordre est donc sans effet.
 */
function statutDeFonctions(fonctions: unknown, alertes: string[], u: unknown): string | null {
  const { elements } = itere(fonctions ?? [])
  const connues: string[] = []
  for (const f of elements) {
    if (typeof f === 'string' && f in STATUT_PAR_FONCTION) connues.push(f)
    else {
      alertes.push(`référence, unité ${str(u)} : fonction inconnue « ${str(f)} » — `
        + 'écartée du calcul du statut')
    }
  }
  if (!connues.length) {
    alertes.push(`référence, unité ${str(u)} : aucune fonction lisible — `
      + 'unité sans statut, écartée des décomptes de couverture')
    return null
  }
  let meilleur = STATUT_PAR_FONCTION[connues[0]]
  for (const f of connues) {
    const s = STATUT_PAR_FONCTION[f]
    if (RANG_STATUT[s] > RANG_STATUT[meilleur]) meilleur = s
  }
  return meilleur
}

const RE_MOTS = new RegExp(`[${CAR_MOT_PYTHON}]+(?:['’][${CAR_MOT_PYTHON}]+)?`, 'gu')

/** `re.findall(r"\w+(?:['’]\w+)?", texte, re.UNICODE)` — le `\w` de Python. */
function _mots(texte: unknown): string[] {
  const t = typeof texte === 'string' ? texte : ''
  return t.match(RE_MOTS) ?? []
}

const RE_FIN_PHRASE = new RegExp(`(?<=[.!?…])[${CAR_BLANC_PYTHON}]+`, 'u')

/** `re.split(r"(?<=[.!?…])\s+", texte.strip())`, vides retirés. */
function _phrases(texte: unknown): string[] {
  const t = strip(typeof texte === 'string' ? texte : '')
  return t.split(RE_FIN_PHRASE).map((p) => strip(p)).filter((p) => p !== '')
}

/**
 * Les chaînes de `n` mots communes à la production et à la source.
 *
 * Détection mécanique des reprises littérales — les candidats `copie` sont
 * signalés avant tout appel modèle (fiche §3), et c'est l'aligneur qui les lit.
 */
function recouvrements(production: unknown, source: unknown, n: number): string[] {
  const mp = _mots(production)
  const ms = _mots(source)
  if (n <= 0 || mp.length < n || ms.length < n) return []
  const grammesSource = new Set<string>()
  for (let i = 0; i <= ms.length - n; i += 1) {
    grammesSource.add(ms.slice(i, i + n).map((w) => _norm(w)).join(' '))
  }
  const trouves: string[] = []
  const vus = new Set<string>()
  for (let i = 0; i <= mp.length - n; i += 1) {
    const g = mp.slice(i, i + n).map((w) => _norm(w)).join(' ')
    if (grammesSource.has(g) && !vus.has(g)) {
      vus.add(g)
      trouves.push(mp.slice(i, i + n).join(' '))
    }
  }
  return trouves
}

/**
 * Une fidélité `limite` compte pour LE PLUS FAIBLE des deux états que sa note
 * indique. Note illisible → `contresens_partiel`, avec alerte (fiche §4).
 *
 * Écarter la note illisible la rendait GRATUITE : la couverture de l'unité
 * restait créditée d'office, et hésiter sans nommer ses deux états valait mieux
 * que les nommer — un palier de plus. Pas `contresens_majeur` : personne n'a
 * constaté de contresens grave, et il déclencherait le plafond à Faible.
 * (RM12, arbitrage de Louis, 16/08.)
 *
 * ⚠️ LE `\b` EST CELUI DE PYTHON, ET IL EST UNICODE : dans « l'élève est
 *    infidèle au texte », Python ne voit AUCUN « fidele » isolé — le `è` ferme
 *    l'anti-regard —, quand le `\b` de JavaScript hors drapeau `u` en verrait
 *    un et donnerait à la note un second état qu'elle ne nomme pas.
 */
function _borneBasse(note: unknown, alertes: string[], u: unknown): string {
  // ⚠️ PORTAGE — `unicodedata.normalize()` LÈVE sur ce qui n'est pas un texte
  //    (`TypeError: normalize() argument 2 must be str`), et le contrat §3
  //    l'interdit. Une note illisible vaut ce que vaut une note qui ne nomme pas
  //    deux états : `contresens_partiel`, AVEC l'alerte. Le doute ne fabrique pas
  //    un verdict, et il n'en dispense pas non plus.
  const vu = _normEtats(note)
  const lus = ETATS_LISIBLES.filter((e) => motIsole(_normEtats(e), vu))
  if (lus.length < 2) {
    alertes.push(`unité ${str(u)} : fidélité « limite » dont la note ne nomme pas deux `
      + 'états — comptée « contresens_partiel », le doute ne vaut pas un acquiescement')
    return 'contresens_partiel'
  }
  for (const pire of ['contresens_majeur', 'contresens_partiel', 'fidele']) {
    if (lus.includes(pire)) return pire
  }
  return 'contresens_partiel'
}

/** `sorted()` de Python sur des identifiants d'unité — numérique, jamais lexical.
 *
 * ⚠️ PORTAGE — `[10, 2].sort()` de JavaScript rend `[10, 2]` : le tri par défaut
 *    est LEXICAL. Et `sorted()` sur des types mêlés LÈVE côté Python ; ici on
 *    trie les nombres d'abord, puis les textes, sans jamais lever. Aucun vecteur
 *    ne l'atteint : leurs `u` sont des entiers.
 */
function triIdentifiants(ids: readonly unknown[]): unknown[] {
  const nombres = ids.filter((x) => typeof x === 'number').sort((a, b) => (a as number) - (b as number))
  const autres = ids.filter((x) => typeof x !== 'number')
    .sort((a, b) => (str(a) < str(b) ? -1 : str(a) > str(b) ? 1 : 0))
  return [...nombres, ...autres]
}

/** `int(params.get(nom, defaut))` / `params.get(nom, defaut)` — jamais un seuil en dur. */
function _param(ctx: ContexteBranchement, nom: string): number {
  const v = ctx.parametres?.[nom]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v)
  return PARAMS_DEFAUT[nom]
}

/** La référence décomposée, telle que le contexte la porterait — le jour où il la sert. */
function referenceDuContexte(ctx: ContexteBranchement, artefactsP1: Record<string, unknown>): unknown {
  const brute = ctx.contexteExercice?.reference
  if (typeof brute === 'string' && strip(brute) !== '') {
    try {
      return JSON.parse(brute)
    } catch {
      return null
    }
  }
  // « C'est au banc de l'y déposer » était un aveu, pas une règle (RM1) : le
  // module lit encore `sortie_p1["reference"]` en repli, et les vecteurs s'en
  // servent. La fusion des phases de P1 est ce que `code1` reçoit (`CONTRAT` §2).
  const fusion = fusionP1(artefactsP1)
  return fusion.reference ?? null
}

/** `banc.py` fusionne les sorties des phases de P1 en un seul `sortie_p1`. */
function fusionP1(artefactsP1: Record<string, unknown>): Objet {
  const fusion: Objet = {}
  for (const cle of ['p1a', 'p1b']) {
    const part = artefactsP1?.[cle]
    if (estObjet(part)) Object.assign(fusion, part)
  }
  // Une phase unique, ou un artefact rangé sous un autre nom : le module reçoit
  // alors exactement la sortie de P1, « comme avant ».
  if (!Object.keys(fusion).length && estObjet(artefactsP1?.p1)) Object.assign(fusion, artefactsP1.p1)
  return fusion
}

// ── crochet 2 (P1A) — `pre_p1a` : le pré-relevé mécanique ──────────────────

/**
 * LE RELEVÉ AVEUGLE : ce que le code calcule avant le premier appel —
 * compression, phrases numérotées, et les reprises littérales quand le matériau
 * est servi (fiche §3).
 *
 * Ce qu'il calcule et qui n'est PAS un slot part sous `_mesures` — le tiret bas
 * dit à la chaîne de le ranger dans le contexte, à disposition de `pre_p1b` et
 * de `code1`, qui ne le recalculent pas (`CONTRAT` §2).
 */
function prePhase1a(ctx: ContexteBranchement): Record<string, unknown> {
  const production = ctx.contexteExercice?.copie ?? ''
  const source = ctx.contexteExercice?.source ?? ''
  const phrases = _phrases(production)
  const nProd = _mots(production).length
  const nSrc = _mots(source).length
  const taux = nSrc ? nProd / nSrc : null
  const recs = source ? recouvrements(production, source, Math.trunc(_param(ctx, 'seuil_ngrammes_copie'))) : []
  const numerotees = phrases.map((p, i) => `${i + 1}. ${p}`).join('\n')

  const resume: string[] = [`mots de la production : ${nProd}`]
  if (nSrc) {
    resume.push(`mots du matériau : ${nSrc}`)
    resume.push(`taux de compression : ${formateFlottant(taux as number, 3)}`)
  }
  // ⚠️ PORTAGE — le module écrit « aucune » sans condition, parce que le banc lui
  //    SERT toujours un matériau (`--source`). La chaîne, elle, n'en porte aucun :
  //    écrire « aucune » y dirait au modèle qu'on a cherché et rien trouvé, quand
  //    on n'a pas cherché. Le dire est gratuit ; le taire est un mensonge de
  //    prompt. Aucun vecteur ne l'atteint — tous passent une source.
  resume.push('reprises littérales repérées : '
    + (nSrc === 0 && !source
      ? 'matériau non servi à la chaîne — elles n’ont pas pu être cherchées'
      : (!recs.length ? 'aucune' : recs.map((r) => `« ${r} »`).join('; '))))

  return {
    // les SLOTS du prompt P1A — `{consigne}` est natif.
    pre_releve: resume.join('\n'),
    production,
    // le canal privé : rangé dans le contexte, jamais injecté.
    _mesures: {
      mots_production: nProd,
      mots_materiau: nSrc,
      taux_compression: taux,
      recouvrements: recs,
      nb_phrases: phrases.length,
      phrases_numerotees: numerotees,
    },
  }
}

// ── crochet 2 (P1B) — `pre_p1b` : ce que l'aligneur reçoit ─────────────────

/**
 * L'ALIGNEUR : il reçoit ce que le relevé aveugle a trouvé, plus la référence
 * décomposée. Les deux temps de l'extraction sont propres à cette compétence
 * (fiche §3, acté).
 *
 * ⚠️ `{reference_decomposee}` SERVI À `null` ARRÊTE LA MESURE, EN LE NOMMANT, et
 *    c'est voulu : « c'est ainsi qu'un module dit "le contexte ne porte pas ce
 *    qu'il me faut" sans jamais lever d'exception ni inventer une valeur »
 *    (`CONTRAT` §2). La chaîne ne descend pas la référence décomposée
 *    aujourd'hui — voir l'en-tête. Le référent `cours` n'en a pas et n'en aura
 *    pas (« le cours n'a pas de référence décomposée, et ne doit pas en avoir »,
 *    fiche §1) : là, cette phase ne tourne simplement pas.
 */
function prePhase1b(ctx: ContexteBranchement): Record<string, unknown> {
  const p1a = ctx.sorties?.p1a
  const unites = estObjet(p1a) ? (p1a.unites ?? []) : []
  const mes = ctx.prives?._mesures
  const recs = estObjet(mes) && Array.isArray(mes.recouvrements) ? mes.recouvrements : []
  const brute = ctx.contexteExercice?.reference
  const ref = typeof brute === 'string' && strip(brute) !== '' ? brute : null
  return {
    unites_relevees: JSON.stringify(unites, null, 2),
    reference_decomposee: ref,
    recouvrements: !recs.length ? 'aucune' : recs.map((r) => `« ${str(r)} »`).join('; '),
  }
}

// ── `document_p2` — ce que le juge lit À LA PLACE de la production ─────────

/**
 * La quatrième clé du contrat (§2), OBLIGATOIRE dès que `code1` existe.
 *
 * Le prompt P2 ne porte qu'UN slot, `{squelette}` : ce document est donc tout ce
 * que le juge verra, et rien d'autre. Ce qu'il contient est décidé au §4 de la
 * fiche, et nulle part ailleurs.
 *
 * · « Le juge lit le squelette nu » → le relevé aveugle de P1A, tel que le §3.1
 *   le déclare : `unites`, `rapports`, `apports`, `these_forme`.
 * · « Aucun nombre n'est injecté, et la production continue ne lui est jamais
 *   donnée » → ni le pré-relevé mécanique, ni les `mesures`, ni aucune clé à
 *   tiret bas — le tiret bas est le canal privé du contrat, jamais un prompt.
 * · La fidélité est « référent texte seulement », et le juge « nomme l'origine du
 *   contresens, ET IL EN A LES MOYENS : la référence déclare le statut
 *   d'énonciation de chaque phrase ». Ses moyens n'ont pas d'autre route que ce
 *   document : sur le référent texte, il porte donc l'alignement de P1B ET la
 *   référence décomposée. Sur le référent cours, ni l'un ni l'autre — et le
 *   prompt P2 rend alors « fidelite: [] ».
 *
 * ⚠️ Cette clé a été RÉPARÉE AU MODULE le 23/08 (mandat de Louis) : `code1` ne la
 *    rendait sur aucun de ses deux chemins, et `banc.py` refusait le run pour ça.
 *    Le portage et le module la composent désormais à l'identique.
 */
function documentP2(p1: Objet, reference: unknown, alignementBrut: readonly unknown[]): Objet {
  const doc: Objet = {
    unites: p1.unites ?? [],
    rapports: p1.rapports ?? [],
    apports: p1.apports ?? [],
    these_forme: p1.these_forme ?? null,
  }
  if (reference) {
    // Copies filtrées : le calcul des correspondances range une clé privée par
    // entrée d'alignement, et une clé à tiret bas ne part jamais au prompt.
    doc.alignement = alignementBrut.filter(estObjet).map((a) => {
      const propre: Objet = {}
      for (const [k, v] of Object.entries(a)) if (!k.startsWith('_')) propre[k] = v
      return propre
    })
    doc.reference = reference
  }
  return doc
}

// ── crochet 3 — `code1` : lire, valider, dériver, apparier, compter ────────

function code1(artefactsP1: Record<string, unknown>, ctx: ContexteBranchement): SortieCode1 {
  const alertes: string[] = []
  const mesures: Record<string, unknown> = {}
  const p1 = fusionP1(artefactsP1)
  const reference = referenceDuContexte(ctx, artefactsP1)
  const referent = reference ? 'texte' : 'cours'
  mesures.referent = referent

  // ⚠️ PORTAGE — le module DÉDUIT le référent de la présence d'une référence ;
  //    la chaîne, elle, le SERT (`ctx.referent`, piège 29). Quand les deux se
  //    contredisent, la mesure serait composée sur la mauvaise branche du §4 :
  //    on ne la corrige pas en silence, on la NOMME. Inatteignable aujourd'hui —
  //    sans référence, l'aligneur arrête la chaîne avant `code1`.
  if (ctx.referent === 'texte' && !reference) {
    alertes.push('l\'exercice déclare un référent « texte » et aucune référence décomposée '
      + 'n\'est parvenue à Code1 — la base se lira sur la seule mise en relation, et les huit '
      + 'observables du référent texte seront absents du relevé')
  }
  if (ctx.referent === null) {
    alertes.push('l\'exercice ne déclare aucun référent — « sans référent, il ne reste rien à '
      + 'mesurer qui soit de la Synthèse » (fiche §1)')
  }

  const unitesBrutes = itere(p1.unites ?? []).elements
  const rapportsBruts = itere(p1.rapports ?? []).elements
  const apportsBruts = itere(p1.apports ?? []).elements
  // ⚠️ PORTAGE — le module fait `u.get("u")` sans contrôler le type : une entrée
  //    qui n'est pas un objet le fait LEVER, et le contrat §3 l'interdit.
  const unites = unitesBrutes.filter((u) => {
    if (estObjet(u)) return true
    alertes.push(`unité relevée non objet — « ${str(u)} » écartée`)
    return false
  }) as Objet[]

  // ⚠️ `len(unites)` de Python porte sur LA LISTE BRUTE : une entrée illisible y
  //    compte, même si le module lève juste après en l'ouvrant. Le portage compte
  //    donc pareil, et NOMME ce qu'il a écarté du reste.
  mesures.nb_unites = unitesBrutes.length
  mesures.nb_apports = apportsBruts.length
  // Les termes RELEVÉS voyagent par les mesures, où `code2` les relit pour
  // apparier le crible (RM11) — un terme absent du relevé ouvrait le seuil, donc
  // Acquis, sur un apport que l'élève n'a jamais écrit.
  mesures.termes_apports = apportsBruts
    .filter((a): a is Objet => estObjet(a))
    .map((a) => strip(typeof a.terme_cite === 'string' ? a.terme_cite : '').toLowerCase())
    .filter((t) => t !== '')

  if (!unitesBrutes.length) {
    alertes.push('production sans aucune unité — garde-fou : niveau Absent')
  }

  let forme = p1.these_forme
  if (forme !== null && forme !== undefined
      && !(CATALOGUE.formes_these as readonly string[]).includes(forme as string)) {
    alertes.push(`these_forme hors liste fermée : « ${str(forme)} » — écartée`)
    forme = null
  }
  mesures.these_forme = forme ?? null

  // --- les rapports de la copie
  const idsUnites = new Set(unites.map((u) => u.u))
  const rapportsOk: Array<{ entre: unknown[]; nature: string }> = []
  rapportsBruts.forEach((r, idx) => {
    const i = idx + 1
    if (!estObjet(r)) {
      // ⚠️ PORTAGE — `r.get("nature")` sur un non-objet LÈVE côté Python.
      alertes.push(`rapport ${i} : entrée non objet — rapport écarté`)
      return
    }
    const nat = r.nature
    if (!(CATALOGUE.natures_rapport as readonly string[]).includes(nat as string)) {
      alertes.push(`rapport ${i} : nature hors liste fermée « ${str(nat)} » — rapport écarté`)
      return
    }
    // ⛔ `for u in v` sur une CHAÎNE rend ses CARACTÈRES : `entre: "12"` porte
    //    deux unités inexistantes, pas les unités 1 et 2. On le porte, on ne le
    //    « répare » pas.
    const rendu = itere(r.entre ?? [])
    if (!rendu.iterable && r.entre !== null && r.entre !== undefined) {
      // ⚠️ PORTAGE — `for u in 12` LÈVE côté Python, et le contrat §3 l'interdit.
      alertes.push(`rapport ${i} : « entre » n'est pas parcourable (${str(r.entre)}) — rapport écarté`)
      return
    }
    const entre = rendu.elements
    const orphelines = entre.filter((u) => !idsUnites.has(u))
    if (orphelines.length) {
      alertes.push(`rapport ${i} : vise une unité inexistante ${str(orphelines)} — `
        + 'rapport écarté de l\'appariement')
      return
    }
    if (entre.length < 2) {
      alertes.push(`rapport ${i} : relie moins de deux unités — rapport écarté`)
      return
    }
    rapportsOk.push({ entre, nature: nat as string })
  })
  mesures.nb_rapports = rapportsOk.length
  const reels = rapportsOk.filter((r) => r.nature !== 'additive')
  mesures.nb_rapports_reels = reels.length
  const reliees = new Set<unknown>()
  for (const r of reels) for (const u of r.entre) reliees.add(u)
  mesures.unites_reliees = reliees.size
  mesures.mobilisation_reliee = unitesBrutes.length ? reliees.size / unitesBrutes.length : 0.0

  // --- le pré-relevé mécanique, s'il a tourné
  const pre = estObjet(ctx.prives?._mesures) ? ctx.prives._mesures as Objet
    : (estObjet(p1._pre_releve) ? p1._pre_releve as Objet : {})
  mesures.taux_compression = pre.taux_compression ?? null

  // ⛔ `for a in v` de Python : une CHAÎNE rend ses caractères, un objet ses
  //    CLÉS. Le module fait alors `.get` dessus et LÈVE — le contrat §3
  //    l'interdit —, donc chaque élément illisible rend ici une alerte nommée.
  const renduAlign = itere(p1.alignement ?? [])
  if (!renduAlign.iterable && p1.alignement !== null && p1.alignement !== undefined) {
    alertes.push(`alignement non parcourable (${str(p1.alignement)}) — aucune correspondance lue`)
  }
  const alignementBrut = renduAlign.elements
  // Le document du juge se compose ICI, avant l'alignement : le calcul qui suit
  // range une clé privée par entrée, et elle ne part jamais au prompt.
  const document = documentP2(p1, reference, alignementBrut)

  if (referent === 'cours') {
    mesures.couvrantes = null
    return { mesures, document_p2: document, alertes }
  }

  // --- référent texte : statuts dérivés, alignement, appariement
  const refUnites = Array.isArray(champ(reference, 'unites')) ? champ(reference, 'unites') as unknown[] : []
  const statuts = new Map<unknown, string | null>()
  for (const ru of refUnites) {
    statuts.set(champ(ru, 'u'), statutDeFonctions(champ(ru, 'fonctions'), alertes, champ(ru, 'u')))
  }
  const essentielles = new Set([...statuts].filter(([, s]) => s === 'essentielle').map(([u]) => u))
  const illustrations = new Set([...statuts].filter(([, s]) => s === 'illustration').map(([u]) => u))
  mesures.nb_essentielles = essentielles.size

  // `{a.get("u"): a for a in …}` — à `u` égal, Python garde LA DERNIÈRE entrée.
  const alignement = new Map<unknown, Objet>()
  for (const a of alignementBrut) {
    if (estObjet(a)) alignement.set(a.u, a)
    // ⚠️ PORTAGE — `a.get("u")` sur un non-objet LÈVE côté Python.
    else alertes.push(`alignement : entrée non objet — « ${str(a)} » écartée`)
  }
  if (!alignement.size) {
    alertes.push('référent texte annoncé mais aucun alignement fourni — '
      + 'les décomptes de couverture sont impossibles')
  }

  const couvrantes: unknown[] = []
  const ops = new Map<unknown, string>()
  const couvertes = new Set<unknown>()
  const corrParUnite = new Map<unknown, unknown[]>()
  for (const u of unites) {
    const uid = u.u
    const al = alignement.get(uid)
    if (al === undefined) {
      alertes.push(`unité ${str(uid)} : absente de l'alignement — écartée des décomptes`)
      continue
    }
    const op = al.operation
    const renduCorr = itere(al.correspond_a ?? [])
    if (!renduCorr.iterable && al.correspond_a !== null && al.correspond_a !== undefined) {
      // ⚠️ PORTAGE — même levée que ci-dessus, même remède.
      alertes.push(`unité ${str(uid)} : « correspond_a » n'est pas parcourable `
        + `(${str(al.correspond_a)}) — unité écartée`)
      continue
    }
    let corr = renduCorr.elements
    const inconnues = corr.filter((c) => !statuts.has(c))
    if (inconnues.length) {
      alertes.push(`unité ${str(uid)} : correspond à des unités inexistantes ${str(inconnues)} — écartées`)
      corr = corr.filter((c) => statuts.has(c))
    }
    if (!(CATALOGUE.operations as readonly string[]).includes(op as string)) {
      alertes.push(`unité ${str(uid)} : opération hors liste fermée « ${str(op)} » — unité écartée`)
      continue
    }
    if (op === 'apport' && corr.length) {
      alertes.push(`unité ${str(uid)} : opération « apport » mais correspondances ${str(corr)} — `
        + 'incohérence, unité écartée du décompte des couvrantes')
      continue
    }
    if (OPERATIONS_INTEGRATIVES.includes(op as string) && corr.length < 2) {
      alertes.push(`unité ${str(uid)} : opération « ${str(op)} » sur ${corr.length} correspondance(s) — `
        + 'incohérence de cardinalité, unité écartée')
      continue
    }
    if (OPERATIONS_UNE_POUR_UNE.includes(op as string) && corr.length !== 1) {
      alertes.push(`unité ${str(uid)} : opération « ${str(op)} » sur ${corr.length} correspondance(s) — `
        + 'incohérence de cardinalité, unité écartée')
      continue
    }
    if (op !== 'apport') {
      couvrantes.push(uid)
      ops.set(uid, op as string)
      for (const c of corr) couvertes.add(c)
    }
    corrParUnite.set(uid, corr)
  }

  mesures.couvrantes = couvrantes.length
  const nbIntegratives = couvrantes.filter((u) => OPERATIONS_INTEGRATIVES.includes(ops.get(u) as string)).length
  const nbUnePourUne = couvrantes.filter((u) => OPERATIONS_UNE_POUR_UNE.includes(ops.get(u) as string)).length
  const nbCopies = couvrantes.filter((u) => ops.get(u) === 'copie').length
  mesures.nb_integratives = nbIntegratives
  mesures.nb_une_pour_une = nbUnePourUne
  mesures.nb_copies = nbCopies
  mesures.part_integrative = couvrantes.length ? nbIntegratives / couvrantes.length : 0.0
  // ⭐ LA POPULATION EST « LES UNITÉS COUVRANTES » — arbitrage de Louis, 23/08.
  mesures.copie_verbatim = couvrantes.length ? nbCopies / couvrantes.length : 0.0
  mesures.essentielles_couvertes = triIdentifiants([...essentielles].filter((u) => couvertes.has(u)))
  // Deux espaces de numéros distincts : `u` numérote les unités de la PRODUCTION,
  // les correspondances celles de la RÉFÉRENCE. Le juge rend ses fidélités sur la
  // production ; le code doit savoir quelles unités de la référence elles touchent.
  const corrPourMesures: Record<string, unknown[]> = {}
  for (const u of couvrantes) corrPourMesures[String(u)] = triIdentifiants(corrParUnite.get(u) ?? [])
  mesures.corr_par_unite = corrPourMesures
  mesures.essentielles = triIdentifiants([...essentielles])
  const illustrationsCouvertes = [...illustrations].filter((u) => couvertes.has(u))
  mesures.illustrations_couvertes = triIdentifiants(illustrationsCouvertes)
  mesures.elagage = illustrations.size
    ? 1 - illustrationsCouvertes.length / illustrations.size
    : null

  // inversions : une illustration retenue dont la thèse de son moment ne l'est pas
  const momentsBruts = champ(reference, 'moments')
  const moments = Array.isArray(momentsBruts) ? momentsBruts : null
  if (momentsBruts === null || momentsBruts === undefined) {
    mesures.inversions = null
    alertes.push('référence sans moments — les inversions hiérarchiques ne sont pas calculables')
  } else {
    let inv = 0
    for (const m of moments ?? []) {
      const dedans = new Set(itere(champ(m, 'unites') ?? []).elements)
      const th = [...dedans].filter((u) => statuts.get(u) === 'essentielle')
      const il = [...dedans].filter((u) => statuts.get(u) === 'illustration')
      const ilCouvertes = il.some((u) => couvertes.has(u))
      const thCouvertes = th.some((u) => couvertes.has(u))
      if (ilCouvertes && th.length && !thCouvertes) inv += 1
    }
    mesures.inversions = inv
  }

  // appariement des rapports
  const rendus = new Set<unknown>()
  const declares: unknown[] = []
  // ⚠️ La vérité de Python : une liste VIDE est FAUSSE. `if moments:` ne s'ouvre
  //    pas sur `moments: []`, quand `if (moments)` de JavaScript s'ouvrirait.
  if (moments && moments.length) {
    const uParMoment = new Map<unknown, Set<unknown>>()
    for (const m of moments) uParMoment.set(champ(m, 'm'), new Set(itere(champ(m, 'unites') ?? []).elements))
    for (const m of moments) {
      const fonction = champ(m, 'fonction')
      const cible = itere(champ(m, 'cible') ?? []).elements
      if (fonction === 'pose' || !cible.length) continue
      declares.push(champ(m, 'm'))
      const porte = uParMoment.get(champ(m, 'm')) ?? new Set<unknown>()
      const vise = new Set<unknown>()
      for (const c of cible) for (const x of uParMoment.get(c) ?? []) vise.add(x)
      for (const r of reels) {
        if (r.nature !== fonction) continue
        const couv = new Set<unknown>()
        for (const uid of r.entre) for (const c of corrParUnite.get(uid) ?? []) couv.add(c)
        const toucheLePorte = [...couv].some((x) => porte.has(x))
        const toucheLaCible = [...couv].some((x) => vise.has(x))
        if (toucheLePorte && toucheLaCible) { rendus.add(champ(m, 'm')); break }
      }
    }
  }
  mesures.rapports_declares = declares.length
  mesures.rapports_rendus = rendus.size
  mesures.relation_rendue = declares.length ? rendus.size / declares.length : null

  return { mesures, document_p2: document, alertes }
}

// ── LA TÉLÉMÉTRIE DU §5 — l'autre moitié du portage, celle qui ne se voit pas ─

type ValeurReleve = number | string | boolean | null
interface Telemetrie { valeurs: Record<string, ValeurReleve>; alertes: string[] }

function telemetrieMuette(motif: string): Telemetrie {
  return { valeurs: {}, alertes: [`les treize observables du §5 ne sont pas mesurables : ${motif}`] }
}

/**
 * Les TREIZE observables du §5, rendus au relevé. Le module n'en calcule aucun
 * sous ce nom — il rend `niveau`, `palier_base` et `seuil_franchi`, que le BANC
 * compare aux golds.
 *
 * ⭐ CE QUI SE RECOPIE (un) : `apport_organisateur` a MOT POUR MOT la définition
 *    de `seuil_franchi` — « au moins un apport survivant au crible ». ⛔ UN SEUL
 *    CALCUL, DEUX LECTURES : le relevé recopie le verdict composé par `code2`, il
 *    ne le refait pas. *Deux calculs seraient deux domiciles qui divergent.* Les
 *    deux codes restent distincts : ils vivent dans deux listes qui « ne se
 *    croisent qu'une fois sur tout le corpus », et ce n'est pas ici.
 *
 * ⭐ CE QUI SE LIT AUX MESURES (six) : `mobilisation_reliee`, `part_integrative`,
 *    `relation_rendue`, `copie_verbatim`, `taux_compression`, et `elagage` — qui
 *    porte LES INVERSIONS, non le taux d'élagage : « l'observable rend deux
 *    nombres, LE VERDICT NE LIT QUE CELUI-LÀ » (bloc machine, `sens`), et son
 *    `porte_sur` le dit — « les inversions comptées à part ». Le taux d'élagage
 *    part à la trace, où il se lit sans rien décider.
 *
 * ⭐ CE QUI DEMANDE UN CALCUL PROPRE (six) : `couverture_essentielles` — la part
 *    de thèses essentielles couvertes FIDÈLEMENT, donc après la fidélité, et
 *    c'est exactement ce que la règle d'agrégation lit — ; les trois
 *    rétrogradations du crible, comptées par étiquette APRÈS l'appariement des
 *    termes ; et les deux contresens, comptés APRÈS la borne basse des `limite`.
 *
 * ⚠️ LES DEUX DÉNOMINATEURS PARTENT SOUS LEUR NOM EXACT. « Les apports tentés »
 *    vaut `nb_apports` — ce que l'ÉLÈVE a écrit, `sans_objet_si: aucun apport
 *    tenté` — et non le nombre de criblés : un apport que le juge n'a pas criblé,
 *    ou dont le crible a été écarté, reste une TENTATIVE. Il n'entre donc dans
 *    aucun des trois numérateurs, et c'est l'élément écarté des numérateurs qui
 *    porte quand même la propriété mesurée. « Les unités appariées à la
 *    référence » vaut `couvrantes` : toute unité couvrante a au moins une
 *    correspondance, les cardinalités le garantissent.
 */
function telemetrie(
  m: Record<string, unknown>,
  referent: string,
  seuilFranchi: string,
  verdictsCrible: readonly string[],
  couvEss: number | null,
  nbPartiels: number,
  nbMajeurs: number,
): Telemetrie {
  const alertes: string[] = []
  const nombre = (v: unknown, code: string): ValeurReleve => {
    if (v === null || v === undefined) return null
    if (typeof v === 'number' && Number.isFinite(v)) return v
    alertes.push(`${code} : la valeur « ${str(v)} » n'est pas un nombre — rendue \`n/a\``)
    return null
  }

  const valeurs: Record<string, ValeurReleve> = {
    // ── Les CINQ actifs sur les deux référents ──
    mobilisation_reliee: nombre(m.mobilisation_reliee, 'mobilisation_reliee'),
    // ⭐ Recopié, jamais recalculé — même définition que `seuil_franchi`.
    apport_organisateur: seuilFranchi,
    apport_vide: verdictsCrible.filter((v) => v === 'vide').length,
    apport_decoratif: verdictsCrible.filter((v) => v === 'decoratif').length,
    apport_non_couvrant: verdictsCrible.filter((v) => v === 'non_couvrant').length,
    [DENOM_APPORTS]: nombre(m.nb_apports, DENOM_APPORTS),
  }

  if (referent !== 'texte') {
    // « Actifs sur le référent texte seulement » (§5). Leur absence n'est pas un
    // trou : elle veut dire « pas d'occasion » et rend `n/a`. Elle se DÉCLARE.
    alertes.push('référent « ' + referent + ' » : les huit observables du référent texte sont '
      + 'sans objet et absents du relevé — ' + OBSERVABLES_TEXTE_SEULEMENT.join(', ')
      + ' (fiche §5, « actifs sur le référent texte seulement »)')
    return { valeurs, alertes }
  }

  // ── Les HUIT du référent texte ──
  valeurs.couverture_essentielles = couvEss
  valeurs.part_integrative = nombre(m.part_integrative, 'part_integrative')
  valeurs.relation_rendue = nombre(m.relation_rendue, 'relation_rendue')
  // ⛔ `elagage` porte LES INVERSIONS — le seuil est `au_plus 0`, et le §4 fait
  //    tomber toute inversion à Moyen.
  valeurs.elagage = nombre(m.inversions, 'elagage')
  valeurs.copie_verbatim = nombre(m.copie_verbatim, 'copie_verbatim')
  valeurs.contresens_partiel = nbPartiels
  valeurs.contresens_majeur = nbMajeurs
  valeurs[DENOM_UNITES_APPARIEES] = nombre(m.couvrantes, DENOM_UNITES_APPARIEES)
  valeurs.taux_compression = nombre(m.taux_compression, 'taux_compression')

  if (valeurs.relation_rendue === null) {
    alertes.push('relation_rendue : la référence ne déclare aucun rapport à rendre — '
      + 'sans dénominateur, la mesure est sans objet (`n/a`, jamais 0)')
  }
  if (valeurs.elagage === null) {
    alertes.push('elagage : la référence ne porte pas de moments — les inversions '
      + 'hiérarchiques ne sont pas calculables, l\'observable sort en `n/a`')
  }
  if (valeurs.couverture_essentielles === null) {
    alertes.push('couverture_essentielles : la référence ne déclare aucune thèse essentielle — '
      + 'sans dénominateur, la mesure est sans objet')
  }
  if (valeurs.taux_compression === null) {
    // ⚠️ LE SEUL OBSERVABLE QUE LA CHAÎNE NE PEUT PAS SERVIR AUJOURD'HUI, et le
    //    §5 l'exclut des observables REQUIS — « un signal de conformité de
    //    consigne, pas de compétence : il pilote la confiance, jamais l'escalade ».
    alertes.push('taux_compression : le contexte de l\'exercice ne porte pas le matériau — '
      + 'les mots du matériau manquent, l\'observable sort en `n/a` (il n\'est pas requis, §5)')
  }
  return { valeurs, alertes }
}

// ── crochet 5 — `code2` : crible, borne basse, base, plafonds, seuil ───────

function code2(artefactP2: unknown, sortieCode1: SortieCode1, ctx: ContexteBranchement): SortieCode2 {
  const alertes: string[] = []
  const trace: string[] = []
  const p2 = estObjet(artefactP2) ? artefactP2 : {}
  const c1 = sortieCode1 ?? ({ mesures: {}, document_p2: null, alertes: [] } as SortieCode1)
  const m = estObjet(c1.mesures) ? c1.mesures as Objet : {}
  const referent = typeof m.referent === 'string' ? m.referent : 'cours'
  const P = {
    part_essentielles_bon: _param(ctx, 'part_essentielles_bon'),
    part_rapports_rendus_bon: _param(ctx, 'part_rapports_rendus_bon'),
    contresens_partiels_plafond_moyen: _param(ctx, 'contresens_partiels_plafond_moyen'),
    tolerance_compression: _param(ctx, 'tolerance_compression'),
  }

  // --- le crible, tel que P2 l'a rendu
  //
  // Trois contrôles, tous imposés par `CONTRAT-MODULES.md` §3 :
  //   · le TYPE — une entrée qui n'est pas un objet rendait une exception au lieu
  //     d'une alerte, et interrompait tout le passage (RM17) ;
  //   · l'APPARIEMENT — un terme absent du relevé de P1 ouvrait le seuil, donc
  //     Acquis, sur un apport que l'élève n'a jamais écrit (RM11) ;
  //   · la RÉFÉRENCE — le garde-fou acté `apport_apparie` dit qu'un apport dont
  //     le terme se retrouve dans la référence n'ouvre pas le seuil.
  // ⚠️ `termes_reference` n'est écrit par AUCUN chemin de `code1`, au module comme
  //    ici : le garde-fou `apport_apparie` est donc INERTE, et ce n'est pas le
  //    portage qui l'a rendu tel. *Relevé, non corrigé : le corriger ferait
  //    diverger le portage du module que le banc validera.*
  const termesReleves = new Set(
    (Array.isArray(m.termes_apports) ? m.termes_apports : []).filter((t) => typeof t === 'string'),
  )
  const termesReference = new Set(
    (Array.isArray(m.termes_reference) ? m.termes_reference : [])
      .filter((t): t is string => typeof t === 'string')
      .map((t) => strip(t).toLowerCase()),
  )
  // ⛔ Même sémantique qu'à `code1` : `for a in v` de Python. Un `crible` rendu
  //    EN TEXTE par le juge ne porte donc AUCUN apport criblé — il porte autant
  //    d'entrées illisibles que de caractères, et chacune s'alerte.
  const renduCrible = itere(p2.crible ?? [])
  if (!renduCrible.iterable && p2.crible !== null && p2.crible !== undefined) {
    alertes.push(`crible non parcourable (${str(p2.crible)}) — aucun apport criblé`)
  }
  const cribleBrut = renduCrible.elements
  const verdicts: string[] = []
  for (const a of cribleBrut) {
    if (!estObjet(a)) {
      alertes.push('crible : entrée non objet — écartée')
      continue
    }
    const v = a.verdict
    if (!(CATALOGUE.verdicts_apport as readonly string[]).includes(v as string)) {
      alertes.push(`crible : verdict hors liste fermée « ${str(v)} » — apport écarté`)
      continue
    }
    const terme = strip(typeof a.terme_cite === 'string' ? a.terme_cite : '').toLowerCase()
    if (termesReleves.size && !termesReleves.has(terme)) {
      alertes.push(`crible : terme « ${str(a.terme_cite)} » absent du relevé — `
        + 'le juge a criblé un apport qui n\'existe pas ; écarté, il n\'ouvre pas le seuil')
      continue
    }
    if (!termesReleves.size && cribleBrut.length) {
      alertes.push(`crible : terme « ${str(a.terme_cite)} » criblé alors que le `
        + 'relevé ne porte aucun apport ; écarté, il n\'ouvre pas le seuil')
      continue
    }
    if (terme && termesReference.has(terme)) {
      alertes.push(`apport_apparie : le terme « ${str(a.terme_cite)} » se retrouve `
        + 'dans la référence — l\'apport n\'ouvre pas le seuil (garde-fou acté)')
      continue
    }
    verdicts.push(v as string)
  }
  const seuilFranchi = verdicts.includes('organisateur') ? 'oui' : 'non'
  trace.push(`crible : ${verdicts.length} apport(s) — `
    + (verdicts.length ? verdicts.join(', ') : 'aucun')
    + ` → seuil_franchi = ${seuilFranchi}`)

  // --- la fidélité, avec borne basse
  //
  // Le silence du juge ne vaut JAMAIS acquiescement (`CONTRAT` §3). `connues` vaut
  // `null` quand aucun alignement n'a été transmis ; dès qu'il existe — même vide
  // —, l'appartenance s'applique. Sans elle, une fidélité dont le `u` ne
  // correspond à rien était écartée EN SILENCE : un `contresens_majeur` sans `u`
  // faisait remonter Faible à Bon sans une seule alerte. (RM19.)
  const corrObjet = estObjet(m.corr_par_unite) ? m.corr_par_unite as Objet : null
  const connuesCanon: string[] | null = corrObjet ? Object.keys(corrObjet) : null
  const connues: Set<string> | null = connuesCanon ? new Set(connuesCanon) : null

  const etats: Array<[unknown, string]> = []
  const vus: unknown[] = []
  const renduFid = itere(p2.fidelite ?? [])
  if (!renduFid.iterable && p2.fidelite !== null && p2.fidelite !== undefined) {
    alertes.push(`fidélité non parcourable (${str(p2.fidelite)}) — aucune fidélité lue`)
  }
  for (const f of renduFid.elements) {
    if (!estObjet(f)) {
      alertes.push('fidélité : entrée non objet — écartée')
      continue
    }
    let e = f.etat
    const u = f.u
    if (!(CATALOGUE.fidelites as readonly string[]).includes(e as string)) {
      alertes.push(`unité ${str(u)} : fidélité hors liste fermée « ${str(e)} » — écartée`)
      continue
    }
    if (connues !== null && !connues.has(String(u))) {
      alertes.push(`fidélité de l'unité ${repr(u)} absente de l'alignement : `
        + 'consignée, jamais comptée')
      continue
    }
    vus.push(u)          // le juge a parlé pour cette unité
    if (e === 'limite') {
      // `_borneBasse` rend TOUJOURS un état : une note illisible vaut
      // `contresens_partiel`, jamais un écart silencieux.
      e = _borneBasse(f.note, alertes, u)
    }
    etats.push([u, e as string])
  }

  // Une fidélité EXIGÉE et absente est une donnée manquante, jamais un
  // acquiescement (`CONTRAT` §3, décision de Louis). Sans ce contrôle, une sortie
  // P2 tronquée gardait la couverture mécanique entière — « non jugé » valait
  // « fidèle » — et une sortie partielle était aussi favorable qu'une sortie
  // complète : Bon dans les deux cas. (RM12.)
  if (connuesCanon !== null) {
    const rendusTextes = vus.map((x) => String(x))
    const manquantes = triIdentifiants(
      connuesCanon.filter((x) => !rendusTextes.includes(x)),
    )
    const doublons = triIdentifiants(
      [...new Set(rendusTextes.filter((x) => rendusTextes.filter((y) => y === x).length > 1))],
    )
    if (manquantes.length || doublons.length) {
      const motif: string[] = []
      if (manquantes.length) {
        motif.push('unité(s) couvrante(s) non jugée(s) : ' + manquantes.map((x) => str(x)).join(', '))
      }
      if (doublons.length) {
        motif.push('unité(s) jugée(s) deux fois : ' + doublons.map((x) => str(x)).join(', '))
      }
      const msg = 'PASSAGE MANQUÉ — le juge n\'a pas rendu une fidélité par unité '
        + 'couvrante ; ' + motif.join(' ; ') + '. Aucun verdict n\'est '
        + 'composé sur une sortie tronquée (CONTRAT-MODULES.md §3).'
      alertes.push(msg)
      const vides: Record<string, null> = {}
      for (const o of OBSERVABLES_MODULE) vides[o] = null
      return {
        verdicts: vides,
        trace: [...trace, msg],
        alertes,
        _telemetrie: telemetrieMuette('aucun verdict n\'est composé sur une sortie tronquée'),
      }
    }
  }

  const majeurs = etats.filter(([, e]) => e === 'contresens_majeur').map(([u]) => u)
  const partiels = etats.filter(([, e]) => e === 'contresens_partiel').map(([u]) => u)
  const essentiellesCouvertes = new Set(
    Array.isArray(m.essentielles_couvertes) ? m.essentielles_couvertes : [],
  )
  const essentielles = new Set(Array.isArray(m.essentielles) ? m.essentielles : [])

  /** Les unités de la RÉFÉRENCE que ces unités de production visent. */
  const refsTouchees = (unitesProd: readonly unknown[]): Set<unknown> => {
    const t = new Set<unknown>()
    for (const u of unitesProd) {
      const liste = corrObjet ? corrObjet[String(u)] : undefined
      for (const c of (Array.isArray(liste) ? liste : [])) t.add(c)
    }
    return t
  }
  const dans = (ens: Set<unknown>, autre: Set<unknown>) => [...ens].filter((x) => autre.has(x))
  const essMajeur = dans(refsTouchees(majeurs), essentielles)
  const essFaussees = new Set(dans(refsTouchees([...majeurs, ...partiels]), essentielles))

  // --- le palier de base
  let base: string
  let couvEss: number | null = null
  if ((typeof m.nb_unites === 'number' ? m.nb_unites : 0) === 0) {
    base = 'Absent'
    trace.push('garde-fou : aucune unité relevée → base Absent')
  } else if (referent === 'cours') {
    const nbRap = typeof m.nb_rapports === 'number' ? m.nb_rapports : 0
    const nbReels = typeof m.nb_rapports_reels === 'number' ? m.nb_rapports_reels : 0
    const reliee = typeof m.mobilisation_reliee === 'number' ? m.mobilisation_reliee : 0.0
    if (nbRap === 0) {
      base = 'Absent'; trace.push('cours : aucun rapport écrit → Absent')
    } else if (nbReels === 0) {
      base = 'Faible'; trace.push('cours : tous les rapports sont additifs → Faible')
    } else if (reliee <= 0.5) {
      base = 'Moyen'
      trace.push(`cours : unités reliées minoritaires (${formateFlottant(reliee, 2)}) → Moyen`)
    } else {
      base = 'Bon'
      trace.push(`cours : unités reliées strictement majoritaires (${formateFlottant(reliee, 2)}) → Bon`)
    }
  } else {
    const couvrantes = typeof m.couvrantes === 'number' ? m.couvrantes : 0
    const partInt = typeof m.part_integrative === 'number' ? m.part_integrative : 0.0
    const part1a1 = couvrantes ? (typeof m.nb_une_pour_une === 'number' ? m.nb_une_pour_une : 0) / couvrantes : 0.0
    const copie = typeof m.copie_verbatim === 'number' ? m.copie_verbatim : 0.0
    const rendus = typeof m.relation_rendue === 'number' ? m.relation_rendue : null
    const nbEss = typeof m.nb_essentielles === 'number' ? m.nb_essentielles : 0
    couvEss = nbEss
      ? [...essentiellesCouvertes].filter((x) => !essFaussees.has(x)).length / nbEss
      : null
    const inversions = typeof m.inversions === 'number' ? m.inversions : null
    const rapportsDeclares = typeof m.rapports_declares === 'number' ? m.rapports_declares : 0
    const nbReels = typeof m.nb_rapports_reels === 'number' ? m.nb_rapports_reels : 0
    const aucunRendu = (rendus !== null && rendus === 0) || (rapportsDeclares === 0 && nbReels === 0)
    const eclatee = couvEss !== null ? couvEss === 0 : false
    if (aucunRendu && (copie > 0.5 || eclatee)) {
      base = 'Absent'
      trace.push('texte : aucun rapport rendu et '
        + `${copie > 0.5 ? 'reprise dominante' : 'couverture éclatée'} → Absent`)
    } else if (part1a1 > 0.5) {
      base = 'Faible'
      trace.push(`texte : unités couvrantes majoritairement une-pour-une (${formateFlottant(part1a1, 2)}) → Faible`)
    } else if (partInt <= 0.5
        || (rendus !== null && rendus < P.part_rapports_rendus_bon)
        || (couvEss !== null && couvEss < P.part_essentielles_bon)
        || (inversions ?? 0) > 0) {
      base = 'Moyen'
      // ⚠️ `{rendus}` et `{couv_ess}` sont des FLOTTANTS Python : `str(1.0)` vaut
      //    « 1.0 », `String(1)` vaut « 1 ». `{inversions}` est un entier, ou None.
      trace.push(`texte : part intégrative ${formateFlottant(partInt, 2)}, rapports rendus ${strFlottant(rendus)}, `
        + `essentielles ${strFlottant(couvEss)}, inversions ${str(inversions)} → Moyen`)
    } else {
      base = 'Bon'
      trace.push(`texte : part intégrative strictement majoritaire (${formateFlottant(partInt, 2)}), `
        + 'essentielles et rapports au-dessus des seuils → Bon')
    }
    if (typeof m.elagage === 'number') {
      // Le second nombre de l'observable `elagage` : il se lit, il ne décide rien.
      trace.push(`élagage des illustrations : ${formateFlottant(m.elagage, 2)} (le verdict lit les inversions)`)
    }
  }

  // --- les plafonds de fidélité
  if (essMajeur.length) {
    const avant = base
    base = _plafonne(base, 'Faible')
    trace.push('plafond : contresens majeur sur la ou les thèses essentielles '
      + `${str(triIdentifiants(essMajeur))} → ${avant} ramené à ${base}`)
  }
  if (partiels.length > P.contresens_partiels_plafond_moyen) {
    const avant = base
    base = _plafonne(base, 'Moyen')
    if (base !== avant) {
      trace.push(`plafond : ${partiels.length} contresens partiels → ${avant} ramené à Moyen`)
    }
  }

  // --- le seuil ouvre Acquis, il n'élève jamais la base
  const niveau = (base === 'Bon' && seuilFranchi === 'oui') ? 'Acquis' : base
  if (seuilFranchi === 'oui' && base !== 'Bon') {
    trace.push(`seuil franchi sur une base ${base} : n'ouvre pas Acquis — à signaler au levier`)
  }
  trace.push(`niveau = ${niveau}`)

  // --- garde-fous de recette
  for (const interdit of OBSERVABLES_MODULE) {
    if (interdit in p2) {
      alertes.push(`le juge a rendu « ${interdit} » — la chaîne est en erreur, valeur ignorée`)
    }
  }
  const taux = typeof m.taux_compression === 'number' ? m.taux_compression : null
  const cible = ctx.parametres?.compression_cible
  const cibleNum = typeof cible === 'number' && cible !== 0 ? cible : null
  if (taux !== null && cibleNum !== null) {
    if (Math.abs(taux - cibleNum) > P.tolerance_compression * cibleNum) {
      alertes.push(`taux de compression ${formateFlottant(taux, 3)} hors bornes autour de ${str(cibleNum)} — `
        + 'confiance abaissée, aucun plafond')
    }
  }

  return {
    verdicts: { niveau, palier_base: base, seuil_franchi: seuilFranchi },
    trace,
    alertes,
    _telemetrie: telemetrie(m, referent, seuilFranchi, verdicts, couvEss, partiels.length, majeurs.length),
  }
}

// ── crochet 6 — `conformite` : ce que ni les réplicats ni les 5×5 ne voient ─

const CHAMPS_PROSE: readonly string[] = ['justification_ancree', 'ce_qui_plafonne', 'levier', 'confiance']

/**
 * `re.search(r"\b\d+\b", texte)` de Python — et les DEUX classes sont UNICODE.
 *
 * `\b` s'appuie sur `\w = [\p{L}\p{N}_]`, `\d` vaut `\p{Nd}`. Conséquence
 * mesurée : « la 3ème partie » ne contient AUCUN nombre isolé pour Python — le
 * `è` ferme l'anti-regard — quand le `\b` de JavaScript hors drapeau `u` en voit
 * un et accuserait le juge d'avoir compté. Et « ٣ » en contient un.
 */
const RE_NOMBRE = new RegExp(`(?<![${CAR_MOT_PYTHON}])${CAR_CHIFFRE_PYTHON}+(?![${CAR_MOT_PYTHON}])`, 'u')

function conformite(
  artefactsP1: Record<string, unknown>,
  artefactP2: unknown,
  sortieCode1: SortieCode1,
  _sortieCode2: SortieCode2,
  _ctx: ContexteBranchement,
): string[] {
  const a: string[] = []
  const p1 = fusionP1(artefactsP1)
  const p2 = estObjet(artefactP2) ? artefactP2 : {}
  const m = estObjet(sortieCode1?.mesures) ? sortieCode1.mesures as Objet : {}
  const apports = itere(p1.apports ?? []).elements
  const termesP1 = new Set(apports.filter(estObjet).map((x) => _norm(x.terme_cite)))
  const crible = itere(p2.crible ?? []).elements
  for (const c of crible) {
    if (!termesP1.has(_norm(champ(c, 'terme_cite')))) {
      a.push(`crible : terme « ${str(champ(c, 'terme_cite'))} » absent du relevé — `
        + 'le juge a cribleé un apport qui n\'existe pas')
    }
  }
  for (const c of crible) {
    const raison = champ(c, 'raison')
    if (champ(c, 'verdict') !== 'organisateur' && strip(typeof raison === 'string' ? raison : '') === '') {
      a.push(`crible : verdict « ${str(champ(c, 'verdict'))} » sans raison`)
    }
  }
  const fidelite = itere(p2.fidelite ?? []).elements
  if (m.referent === 'cours' && fidelite.length) {
    a.push('le juge a rendu des fidélités sans référence — sans matériau à confronter, '
      + 'la fidélité n\'a pas d\'objet')
  }
  if (m.referent === 'texte' && !fidelite.length) {
    a.push('référent texte sans aucune fidélité rendue — la couverture ne peut pas être '
      + 'comptée fidèlement')
  }
  for (const champProse of CHAMPS_PROSE) {
    const v = p2[champProse]
    if (strip(typeof v === 'string' ? v : '') === '') {
      a.push(`le juge n'a pas rendu « ${champProse} »`)
    }
  }
  // ⚠️ `\b\d+\b` de Python : le `\b` ET le `\d` sont UNICODE. « la 3ème partie »
  //    ne contient AUCUN nombre isolé pour Python — le `è` ferme l'anti-regard —,
  //    et « ٣ » en contient un. Un portage naïf accuserait le juge à chaque copie
  //    qui écrit « 3ème ».
  const justification = typeof p2.justification_ancree === 'string' ? p2.justification_ancree : ''
  if (RE_NOMBRE.test(justification)) {
    a.push('la justification du juge contient un nombre — elle ne doit rien compter')
  }
  return a
}

// ════════════════════════════════════════════════════════════════════════════
// LE BRANCHEMENT
// ════════════════════════════════════════════════════════════════════════════

export const BRANCHEMENT_SYNTHESE: BranchementCompetence = {
  /**
   * ⭐⭐ DEUX ÉTAGES D'EXTRACTION, ET UN SEUL QUAND LE RÉFÉRENT EST LE COURS.
   *
   * « Relevé aveugle → aligneur → juge → code », « parce que l'alignement EST sa
   * mesure » (`01-` §11) ; sur le référent cours « l'aligneur ne tourne pas »
   * (`07-` §1.2), et le cours « n'a pas de référence décomposée, et ne doit pas
   * en avoir » (fiche §1, acté).
   *
   * ⚠️ `ctx.referent` LE SERT DÉJÀ : on le lit, on ne le devine pas depuis la
   *    consigne. ⛔ Un référent `null` — ni synthèse en classe, ni référence
   *    validée — passe par l'aligneur, dont le slot vide arrête alors la mesure
   *    en le nommant : « sans référent, il ne reste rien à mesurer qui soit de la
   *    Synthèse » (fiche §1). *C'est la seule conduite juste, et elle coûte le
   *    premier appel : la chaîne n'a pas de pré-vol par référent, et en poser un
   *    toucherait `chaine.ts`.*
   */
  extractions: (ctx): SpecExtraction[] => {
    const p1a: SpecExtraction = {
      cle: 'p1a',
      tetePrompt: 'P1A',
      slotsFournis: ['pre_releve', 'production'],
      pre: prePhase1a,
    }
    if (ctx.referent === 'cours') return [p1a]
    return [p1a, {
      cle: 'p1b',
      tetePrompt: 'P1B',
      slotsFournis: ['unites_relevees', 'reference_decomposee', 'recouvrements'],
      pre: prePhase1b,
    }]
  },

  /**
   * UN SEUL SLOT AU PROMPT DE JUGEMENT — `{squelette}`, et c'est le document.
   *
   * « Quand le prompt n'a qu'un slot, c'est lui, sans déclaration » (`CONTRAT`
   * §2) : `SLOT_DOCUMENT_P2` ne se déclare pas ici, et le module ne le déclare
   * pas non plus. ⛔ Aucun `preP2` : tout ce que le juge lit passe par le
   * document — « le relevé n'atteint P2 que par `document_p2` ».
   */
  jugement: () => ({ tetePrompt: 'P2' }),

  code1,

  code2,

  conformite,

  /** `00-referentiel.md` §2 — Absent/Faible/Moyen/Bon/Acquis = E/D/C/B/A. */
  lettre: (c2) => {
    const niveau = c2.verdicts?.niveau
    return typeof niveau === 'string' ? (LETTRE_DU_NIVEAU[niveau] ?? null) : null
  },

  releve: (c2) => {
    const t = c2._telemetrie as Telemetrie | undefined
    // « Ce qui récapitule RECOPIE la trace, il ne la recalcule jamais » (§3).
    if (!t || !estObjet(t.valeurs)) {
      return {
        releve: {},
        alertes: ['les observables de télémétrie ne sont pas parvenus de Code2 — les treize '
          + 'du §5 sortiraient en `n/a`'],
      }
    }
    return { releve: t.valeurs, alertes: t.alertes }
  },

  /**
   * ⛔ `delta` N'EST PAS DÉCLARÉ, ET C'EST UNE ABSENCE MOTIVÉE.
   *
   * « Ce que "comparer deux squelettes" veut dire dépend de la grille : la source
   * ne le définit pas hors de la fiche, donc le branchement le porte » — or LA
   * FICHE DE LA SYNTHÈSE NE LE DÉFINIT NULLE PART. ⚠️ Le mot « delta »
   * n'apparaît PAS UNE FOIS dans `competences/synthese.md` : ni son §3, ni son
   * §4, ni son §5, ni son bloc machine, ni son §8.
   *
   * ⚠️⚠️ SIX FICHES SUR SIX SE TAISENT — le corpus entier. Ce n'est plus un oubli
   *    de fiche : c'est une case du gabarit du `03-` §1 que personne n'a remplie.
   *    *Registre des ouverts, item 47 ; l'inventer ici serait trancher une règle
   *    de grille depuis le code, ce qu'aucun lot ne fait.*
   *
   * La chaîne le dit alors par une alerte et laisse NULL. ⚠️ ET NULL N'EST PAS 0 :
   * une passation en classe n'a pas de version finale — et la synthèse en classe
   * EST le lieu de mesure de cette compétence (`01-` §10).
   */
}

// Exportés pour le test du portage — jamais pour la chaîne, qui ne connaît que
// `BRANCHEMENT_SYNTHESE`. Ce qui se compare au module se compare PAR LES
// CROCHETS, comme le banc le fait.
export {
  CATALOGUE, PARAMS_DEFAUT, ORDRE_PALIERS, OBSERVABLES_MODULE, OBSERVABLES_TELEMETRIE,
  OBSERVABLES_TEXTE_SEULEMENT, DENOM_APPORTS, DENOM_UNITES_APPARIEES, LETTRE_DU_NIVEAU,
  documentP2, prePhase1a, prePhase1b, recouvrements, _borneBasse, statutDeFonctions,
}
