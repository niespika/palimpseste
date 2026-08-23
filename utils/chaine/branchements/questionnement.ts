// ============================================================================
// C4 · L10 — LE BRANCHEMENT DU QUESTIONNEMENT. Tout le calcul, aucun jugement.
// ----------------------------------------------------------------------------
// EXTRACTION, PAS RÉGÉNÉRATION. Ce fichier est le portage, fonction pour
// fonction, de `copies-tests/questionnement/code.py` (dépôt de conception,
// calcul v1.2). « Le module encode ce que la fiche ne dit pas encore : le
// régénérer depuis la fiche le jetterait » (`CONTRAT-MODULES.md` §7).
//
//   La table d'extraction, suivie à la lettre :
//     preP2       ← `pre_p2`      (le référent : sa nature, et son texte)
//     code1       ← `code1`       (les champs du relevé, le pré-verdict, la borne
//                                  haute des `limite`)
//     code2       ← `_crible` + `code2`
//     conformite  ← `conformite`  (le juge qui rend un palier, la prose qui en
//                                  nomme un, une confiance hors des trois)
//
//   ⛔ AUCUN crochet `pre_p1` NI `prepare_copie` : le module n'en définit pas,
//      et les deux slots de P1 — `{copie}` et `{sujet}` — sont NATIFS.
//
// ⚠️ LA FICHE FAIT FOI POUR LA RÈGLE, LE MODULE POUR LE CALCUL. Lire la fiche
//    pour comprendre (`competences/questionnement.md` : §2 l'échelle, §3 le
//    squelette, §4 les règles de notation et le bloc machine, §5 les
//    observables) ; lire le module pour porter.
//
// ⭐ CE QUE LE PORTAGE AJOUTE, ET QUI N'EST PAS DANS LE MODULE : les NEUF
//    OBSERVABLES DE TÉLÉMÉTRIE du §5. Ce ne sont pas les `OBSERVABLES` du
//    module — ceux-là (`niveau`, `palier_base`, `seuil_franchi`,
//    `question_specifique`) sont ce que le BANC compare aux golds. Le `03-` §1,
//    gelé, dit qui les applique : « il n'est pas appliqué par le module mais par
//    LA CHAÎNE FROIDE ».
//
// ⭐⭐ `question_specifique` EST LE SEUL OBSERVABLE DE TOUT LE CORPUS QUI SOIT
//    DANS LES DEUX LISTES — « un seul observable croise les deux listes »
//    (`03-` §9), sur 24 observables de module et 56 de télémétrie, et c'est le
//    nôtre. ⛔ UN SEUL CALCUL, DEUX LECTURES : le relevé RECOPIE le verdict
//    composé par `code2`, il ne le refait pas. *Deux calculs seraient deux
//    domiciles qui divergent.*
//
// ⭐ TROIS DES NEUF NE SE LISENT NULLE PART DANS LE MODULE et demandent un
//    calcul propre — c'est la moitié du portage qui ne se voit pas :
//      · `recadrage` — « au moins un recadrage `valide` après crible ». ⛔ CE
//        N'EST PAS `seuil_franchi`, qui exige EN PLUS le palier de base Bon :
//        une copie Moyen qui porte un recadrage valide a `recadrage = oui` et
//        `seuil_franchi = non`, et le §5 le veut ainsi — « un élève qui stagne à
//        Bon sans jamais recadrer a précisément le recadrage comme prochaine
//        chose à travailler ».
//      · `recadrage_verbal` et `recadrage_non_tenu` — les recadrages rétrogradés
//        au test du déplacement / de la tenue, RAPPORTÉS aux recadrages tentés.
//
// ⚠️ UN SEUL DÉNOMINATEUR, ET LE RELEVÉ LE PORTE SOUS SON NOM EXACT.
//    `rapporte_a` est un texte libre et `observables.ts` cherche l'entrée SOUS
//    CE NOM : « les recadrages tentés ». Il manquerait, et les deux observables
//    qui s'y rapportent sortiraient en `n/a` sans un mot.
//
// ⛔ AUCUN SEUIL EN DUR pour la télémétrie : les seuils de réussite vivent au
//    bloc machine de la fiche, l'instrument dérivé les porte, `observables.ts`
//    lit le verdict contre eux. Ici, on rend des VALEURS. Le paramètre de
//    calcul — il n'y en a QU'UN, `conjonction_bon` — arrive par `ctx.parametres`
//    (`valeursDesParametres()`), et jamais `instrument.parametres` : la forme
//    dérivée est un BLOC par paramètre, pas une valeur à plat.
//
// ⚠️ CE QUE LE PORTAGE DURCIT, ET POURQUOI. Le module lève sur quelques formes
//    que P1 ou P2 peuvent prendre et qu'il n'attend pas (un `deplacement` qui
//    est un nombre, un `crible` qui est un nombre, une prose qui est un
//    nombre). Le contrat §3 l'interdit — « le module ne lève jamais d'exception :
//    elle traverserait le banc et emporterait la trace avec elle » — et prescrit
//    l'inverse : « une valeur illisible rend une alerte, pas une valeur par
//    défaut ». Chaque durcissement est marqué ⚠️ PORTAGE ci-dessous, ne se
//    déclenche sur AUCUN vecteur, et rend une alerte nommée.
//
// ⛔ CE QUI N'EST PAS DURCI, ET SURTOUT PAS : `for x in v` sur une CHAÎNE rend
//    ses CARACTÈRES en Python. Un `crible` rendu en texte par le juge ne porte
//    donc AUCUNE requalification — il porte autant d'entrées illisibles que de
//    caractères. C'est la sémantique du module, pas un défaut : `itere()` la
//    porte (`../python`).
//
// ⚠️⚠️ CE QUE CE BRANCHEMENT NE PEUT PAS FAIRE TOURNER AUJOURD'HUI DANS LES
//    MODES RÉCEPTIFS, et il le DIT plutôt que d'inventer. `pre_p2` sert le
//    référent : en `composer` c'est le sujet — natif, la chaîne l'a ; dans les
//    quatre modes réceptifs c'est « le problème réel du texte, tel que la
//    référence décomposée le porte — c'est son champ `armature.question_directrice`
//    (`05-GENERATEUR_Reference_Decomposee.md` §3), et le module n'en lit aucun
//    autre » (fiche §4). ⛔ LA CHAÎNE NE SERT PAS LA RÉFÉRENCE DÉCOMPOSÉE : son
//    contexte porte QUATRE noms — `sujet`, `consigne`, `copie`, `mode` —, et
//    `contexte.ts` ne lit `exercices.reference_id` que pour en déduire un
//    référent `texte | cours | null`, jamais le contenu de la référence. Servi à
//    `null`, le slot arrête la mesure EN LE NOMMANT — le comportement voulu
//    (`CONTRAT` §2). ⚠️ Ce n'est PAS le cas de la Connaissance : là, aucune
//    source ne déclarait le corpus de cours ; ici la source déclare la référence,
//    l'écran de conception la valide, et la table `exercices_references` la
//    porte — c'est la CHAÎNE qui ne la descend pas. *Relevé, non tranché ici :
//    poser ce fournisseur natif touche `contexte.ts` et `chaine.ts`, hors du
//    périmètre d'un lot dont « la réussite se mesure à un diff quasi nul ».*
//    ⚠️ Et il mord chez les HLP, où le Questionnement n'est ciblé QU'en modes
//    autres que `composer` (`01-` §3, R2).
// ============================================================================

import { estVrai, itere, str, strip, trie } from '../python'
import type {
  BranchementCompetence, ContexteBranchement, SortieCode1, SortieCode2,
} from '../instruments'

// ── Les constantes du module, à l'identique ────────────────────────────────

/** `CATALOGUE` — le volet `squelette` du bloc machine, mot pour mot. */
const CATALOGUE: Record<string, readonly string[]> = {
  formes_question: ['question_explicite', 'tension_affirmee', 'theme_nominal', 'absent'],
  tensions: ['articulees', 'nommees', 'absentes', 'limite'],
  enjeux: ['enonce', 'evoque', 'absent', 'limite'],
  reponses_concurrentes: ['enoncees', 'evoquees', 'absentes', 'limite'],
  questions_propres: ['propre', 'reprise_enonce', 'avis', 'n/a'],
  specificites: ['specifique', 'generique', 'n/a'],
  types_recadrage: ['terme_redefini', 'question_deplacee', 'tension_revelee'],
  verdicts_recadrage: ['valide', 'verbal', 'non_tenu'],
  tests_crible: ['deplacement', 'tenue'],
}

/**
 * `PARAMS` — UN SEUL paramètre, et il est TEXTUEL, non numérique.
 *
 * ⭐ Conséquence : il n'y a AUCUN `PARAMS_FLOTTANTS` ici. Le huitième écart de
 *    langage — `str()` d'un flottant Python, `5.0` contre `5` — ne peut pas
 *    mordre sur cette fiche, parce qu'aucun de ses paramètres n'est un nombre.
 *    *Vérifié au bloc machine : `conjonction_bon` déclare `valeurs`, jamais des
 *    `bornes`.*
 */
const PARAMS_DEFAUT: Record<string, string> = {
  conjonction_bon: 'stricte',
}

/** `PALIERS` du module — l'échelle SANS Acquis : le seuil ne l'élève jamais. */
const PALIERS = ['Absent', 'Faible', 'Moyen', 'Bon'] as const

const VIDE_DEPLACEMENT = '[aucun]'
const VIDE_REPRISE = '[aucune]'

/**
 * Les quatre modes réceptifs du `02-exercices.md` §3. « La forme accentuée est
 * celle de la source ; la forme sans accent est acceptée en entrée de commande. »
 */
const MODES_RECEPTIFS: readonly string[] = ['restituer', 'expliquer', 'évaluer', 'evaluer', 'interroger']

/** `00-referentiel.md` §2 — Absent/Faible/Moyen/Bon/Acquis = E/D/C/B/A. */
const LETTRE_DU_NIVEAU: Record<string, string> = {
  Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
}

/** Ce que le BANC compare aux golds — la liste `OBSERVABLES` du module. */
const OBSERVABLES_MODULE = ['niveau', 'palier_base', 'seuil_franchi', 'question_specifique'] as const

/**
 * Ce que LA CHAÎNE FROIDE calcule — les NEUF observables du §5 de la fiche.
 *
 * ⭐ `question_specifique` est dans les DEUX listes, et c'est le seul du corpus.
 */
const OBSERVABLES_TELEMETRIE = [
  'question_presente', 'question_propre', 'notions_en_tension', 'question_specifique',
  'enjeu', 'debat_situe', 'recadrage', 'recadrage_verbal', 'recadrage_non_tenu',
] as const

/**
 * Le dénominateur des deux `comptage rapporté`, SOUS SON NOM EXACT.
 * `observables.ts` cherche l'entrée du relevé sous ce texte, à la lettre.
 */
const DENOM_TENTES = 'les recadrages tentés'

/**
 * `ORDRE` — les trois champs que la borne haute des `limite` peut résoudre, avec
 * leur ÉCHELLE DÉCROISSANTE (index 0 = le plus fort). L'ordre d'insertion compte :
 * c'est celui du dict Python, et c'est lui qui ordonne la liste des `limite`.
 */
const ORDRE: ReadonlyArray<readonly [string, readonly [string, string, string]]> = [
  ['notions_en_tension', ['articulees', 'nommees', 'absentes']],
  ['enjeu', ['enonce', 'evoque', 'absent']],
  ['reponses_concurrentes', ['enoncees', 'evoquees', 'absentes']],
]

/** Les quatre champs du relevé dont la valeur se contrôle contre une liste fermée. */
const CHAMPS_CATALOGUE: ReadonlyArray<readonly [string, string]> = [
  ['forme_question', 'formes_question'],
  ['notions_en_tension', 'tensions'],
  ['enjeu', 'enjeux'],
  ['reponses_concurrentes', 'reponses_concurrentes'],
]

// ── Les outils du module ───────────────────────────────────────────────────

type Objet = Record<string, unknown>
type ValeurReleve = number | string | boolean | null

function estObjet(v: unknown): v is Objet {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * `_nn = lambda v: str(v or "").strip().lower()` du module.
 *
 * ⚠️ Les trois primitives sont celles de PYTHON : `v or ""` retombe sur la
 *    chaîne vide pour `[]` et `{}` — VRAIS en JavaScript —, `str()` d'une liste
 *    rend `['a', 'b']` et non `a,b`, et `.strip()` retire les blancs de Python
 *    (dont `\x85` et les séparateurs `\x1c`-`\x1f`, qu'une OCR produit) sans
 *    retirer la BOM, que `trim()` mangerait.
 */
function _nn(v: unknown): string {
  return strip(str(estVrai(v) ? v : '')).toLowerCase()
}

/**
 * `s[:n]` de Python — le NEUVIÈME écart de langage, et il n'était pas porté.
 *
 * Python tranche une chaîne par POINTS DE CODE, `String.prototype.slice` par
 * unités UTF-16 : `"👉ceci"[:2]` vaut `👉c` d'un côté et le seul demi-caractère
 * haut de l'émoji de l'autre. Le module s'en sert pour l'alerte
 * `requalification_inappariable`, dont le texte cite les 40 premiers caractères
 * d'une citation du modèle — et une copie d'élève transcrite peut en porter.
 */
function tranche(s: string, n: number): string {
  return [...s].slice(0, n).join('')
}

/**
 * `(v or "").strip()` du module, quand `v` doit être un TEXTE.
 *
 * ⚠️ PORTAGE — le module ferait `.strip()` sur un nombre et LÈVERAIT (contrat
 *    §3). On rend `null` à la place, et l'appelant en fait une alerte nommée.
 */
function texteStrippe(v: unknown): string | null {
  if (!estVrai(v)) return ''
  if (typeof v !== 'string') return null
  return strip(v)
}

/** `_params` du module — le défaut de la fiche, écrasé par ce que le banc sert. */
function _param(params: Readonly<Record<string, number | string>> | undefined, nom: string): string {
  const v = params?.[nom]
  return typeof v === 'string' && v !== '' ? v : PARAMS_DEFAUT[nom]
}

/**
 * `x in conteneur` de Python, sur ce qu'un JSON peut porter — et il change de
 * SENS avec le type : sous-chaîne pour un texte, appartenance pour une liste,
 * appartenance aux CLÉS pour un objet.
 *
 * ⚠️ PORTAGE — sur un nombre, Python lève ; on rend `null`, et l'appelant en
 *    fait une alerte nommée.
 */
function contient(aiguille: string, botte: unknown): boolean | null {
  if (typeof botte === 'string') return botte.includes(aiguille)
  if (Array.isArray(botte)) return botte.includes(aiguille)
  if (estObjet(botte)) return Object.keys(botte).includes(aiguille)
  return null
}

// ── crochet 4 — `pre_p2` : le référent servi au juge ───────────────────────

/**
 * `pre_p2` — le référent servi au juge, « une métadonnée, jamais un jugement ».
 *
 * C'est LE MODE qui commande : en `composer` le référent est le sujet ; dans les
 * quatre modes réceptifs c'est le problème réel du texte, porté par l'ARMATURE
 * de la référence décomposée — `reference["armature"]["question_directrice"]`,
 * et le module n'en lit AUCUN AUTRE ; « ni son nom ni son niveau d'imbrication
 * ne se devinent ».
 *
 * ⚠️ La chaîne ne descend PAS la référence décomposée (voir l'en-tête) : en mode
 *    réceptif, `referent` sort donc à `null` aujourd'hui, et la mesure s'arrête
 *    en nommant le slot. C'est le comportement voulu, pas une panne — « une
 *    valeur `None` dit au banc que le contexte ne porte pas de quoi servir ce
 *    slot : il refuse en le nommant. Le module n'invente rien ».
 *
 * ⭐ IL TOURNE AVANT P1, et ses slots se vérifient AU CHARGEMENT — d'où les
 *    `slotsFournis` déclarés au branchement.
 */
function prePhase2(ctx: ContexteBranchement): Record<string, string | null> {
  // `str(ctx.get("mode") or "composer").strip().lower()` — le module lit UN
  // mode ; la chaîne en porte une liste, jointe par `, `. Un exercice à
  // plusieurs modes est donc réceptif dès que l'un de ses modes l'est, ce qui
  // est la lecture prudente : le référent d'un texte ne se remplace pas par un
  // sujet.
  const brut = ctx.contexteExercice.mode
  const modes = (estVrai(brut) ? String(brut) : 'composer')
    .split(',').map((m) => strip(m).toLowerCase()).filter((m) => m !== '')
  const receptif = modes.some((m) => MODES_RECEPTIFS.includes(m))

  if (receptif) {
    // `ref = ctx.get("reference")` — le contexte du banc porte un OBJET ; celui
    // de la chaîne ne porte que des textes, et n'en porte aucun aujourd'hui. On
    // lit donc la référence sous sa forme sérialisée, ce qui est exactement ce
    // que le fournisseur servira le jour où il existera.
    const arm = armatureDe(ctx.contexteExercice.reference)
    const brut = arm === null ? null : arm.question_directrice
    // ⛔ CE POINT NE SE DURCIT PAS, et le balayage l'a montré : le module fait
    //    `probleme.strip()` UNIQUEMENT quand c'est une chaîne, puis
    //    `probleme or None`. Une question directrice rendue en LISTE traverse
    //    donc — et c'est le banc qui la met en texte à l'injection du slot.
    //    Rendre `null` ici aurait arrêté une mesure que le module laisse passer.
    const probleme = typeof brut === 'string' ? strip(brut) : brut
    return {
      nature_referent: 'texte',
      // `str()` de Python : le slot est un TEXTE, et une liste s'y écrit
      // `['q']`, jamais `q` — c'est le troisième écart de langage.
      referent: estVrai(probleme) ? str(probleme) : null,
    }
  }
  const sujet = ctx.contexteExercice.sujet
  return { nature_referent: 'sujet', referent: estVrai(sujet) ? str(sujet) : null }
}

/**
 * `reference["armature"]`, lue sur ce que le contexte de l'exercice sert.
 *
 * « Une référence sans armature, ou dont la question directrice est vide,
 * retombe sur le refus » — et l'ancien nom `probleme` n'est PAS lu : le module a
 * longtemps cherché `reference["probleme"]`, qui n'a jamais existé, et rien ne
 * le voyait. `VECTEURS_REFERENT` tient le nom ET le niveau d'imbrication.
 */
function armatureDe(brut: unknown): Objet | null {
  if (brut === undefined || brut === null || brut === '') return null
  let ref: unknown = brut
  if (typeof ref === 'string') {
    try {
      ref = JSON.parse(ref)
    } catch {
      return null
    }
  }
  if (!estObjet(ref)) return null
  const arm = ref.armature
  return estObjet(arm) ? arm : null
}

// ── crochet 3 — `code1` : les champs du relevé, et le pré-verdict du code ──

/** Un recadrage du relevé, tel que `code1` le remonte à `code2`. */
type Recadrage = {
  rang: number
  cite: unknown
  type: unknown
  deplacement: string
  reprise: string
  pre_verdict: string | null
  reprise_absente: boolean
}

/**
 * `code1` — « il fait remonter les champs du relevé dont la cascade a besoin, et
 * pose le PRÉ-VERDICT de chaque recadrage : ce que le code tranche sans le juge,
 * parce qu'il n'y a rien à juger ».
 *
 * ⭐ `document_p2` est la clé du contrat, et elle porte le RELEVÉ ENTIER : « le
 *    juge ne reçoit que le squelette et le référent », et AUCUN nombre ne lui est
 *    injecté. Le module le dit dans son commentaire, et il dit aussi que la clé
 *    manquait : « le juge recevait null » — c'est le seul défaut du contrat dont
 *    rien ne témoigne.
 *
 * ⛔ Le module rend en plus `injection_p2: {}`. Le canal n'existe pas dans la
 *    chaîne, et le socle dit pourquoi : « vérifié module par module, aucun des
 *    six ne l'utilise — on ne bâtit pas un canal sans client ». Il est VIDE ici,
 *    donc rien ne se perd. *Relevé.*
 *
 * ⛔ Le module lit aussi `contexte["copie"]` dans une variable `texte` qu'il
 *    n'emploie ensuite JAMAIS. Le portage ne la porte pas : elle n'a aucun effet
 *    sur `mesures`, sur `document_p2` ni sur une alerte. *Relevé.*
 */
function code1(artefactsP1: Record<string, unknown>, _ctx: ContexteBranchement): SortieCode1 {
  const sortieP1 = artefactsP1.p1
  const alertes: string[] = []
  if (!estObjet(sortieP1)) {
    // ⚠️ PORTAGE — `dict(sortie_p1)` lèverait, et `p1.get(...)` aussi. `appel.ts`
    //    valide déjà `objet_libre` : ce chemin ne s'ouvre pas en production.
    return { mesures: {}, document_p2: sortieP1 ?? null, alertes: ['P1 illisible : aucun champ du relevé ne remonte'] }
  }
  const p1 = sortieP1

  // ── Les recadrages, et le pré-verdict que le code pose sans le juge ───────
  const recadrages: Recadrage[] = []
  let brut = p1.recadrages
  if (brut === null || brut === undefined) brut = []
  if (!Array.isArray(brut)) {
    alertes.push("recadrages n'est pas une liste — relevé écarté, aucun recadrage compté")
    brut = []
  }
  const liste = brut as unknown[]
  for (let i = 0; i < liste.length; i += 1) {
    const r = liste[i]
    if (!estObjet(r)) {
      alertes.push(`recadrage ${i} : ce n'est pas un objet — écarté`)
      continue
    }
    // ⚠️ PORTAGE — `(r.get("deplacement") or "").strip()` lève sur un nombre.
    const dep = texteStrippe(r.deplacement)
    const rep = texteStrippe(r.reprise)
    if (dep === null || rep === null) {
      alertes.push(`recadrage ${i} : « ${dep === null ? 'deplacement' : 'reprise'} » n'est pas un `
        + 'texte — recadrage écarté, aucun verdict composé')
      continue
    }
    const typ = r.type
    if (typ !== null && typ !== undefined && !CATALOGUE.types_recadrage.includes(typ as string)) {
      alertes.push(`recadrage ${i} : type « ${str(typ)} » hors catalogue — `
        + 'consigné, le recadrage reste compté')
    }
    recadrages.push({
      rang: i,
      // ⚠️ `r.get("cite", "")` — le DÉFAUT d'une clé ABSENTE, et non `or ""` :
      //    une clé présente à `null` reste `null`, et le module la garde telle
      //    quelle jusqu'à la trace.
      cite: 'cite' in r ? r.cite : '',
      type: typ === undefined ? null : typ,
      deplacement: dep,
      reprise: rep,
      pre_verdict: (!estVrai(dep) || dep === VIDE_DEPLACEMENT) ? 'verbal' : null,
      reprise_absente: (!estVrai(rep) || rep === VIDE_REPRISE),
    })
  }

  // ── La BORNE HAUTE des `limite` (fiche §4, point 3) ──────────────────────
  // « L'inverse de l'Argumentation et de la Synthèse, et c'est délibéré : la
  //   compétence est le membre gardé du trio, son accès à Acquis est déjà
  //   plafonné par la consigne, et l'erreur qui coûte ici est le FAUX NÉGATIF.
  //   Mais la borne haute vaut pour UN SEUL champ : à deux `limite` ou plus,
  //   tout retombe à la borne basse. »
  const limites = ORDRE.filter(([c]) => _nn(p1[c]) === 'limite').map(([c]) => c)
  const haute = limites.length === 1
  const resolus: Record<string, unknown> = {}
  const notes: Record<string, unknown> = {}
  for (const [champ, echelle] of ORDRE) {
    const valeur = p1[champ]
    if (_nn(valeur) !== 'limite') {
      resolus[champ] = valeur === undefined ? null : valeur
      continue
    }
    const note = _nn(p1[`note_${champ}`])
    let lus = echelle.filter((v) => note.includes(v))
    if (lus.length < 2) {
      alertes.push(`LIMITE_ILLISIBLE — ${champ} : la note ne nomme pas `
        + 'deux valeurs ; lue à la borne basse')
      lus = [echelle[echelle.length - 1]]
    }
    // `echelle` est décroissante : index 0 = le plus fort. `lus` conserve son
    // ordre, donc `min` est son premier élément et `max` le dernier.
    const choix = haute ? lus[0] : lus[lus.length - 1]
    resolus[champ] = choix
    notes[champ] = { brut: 'limite', entre: [...lus], resolu: choix, borne: haute ? 'haute' : 'basse' }
  }
  if (limites.length) {
    alertes.push(`${limites.length} champ(s) \`limite\` — borne ${haute ? 'haute' : 'basse'} `
      + `appliquée : ${trie(limites).join(', ')}`)
    if (!haute) {
      alertes.push('deux `limite` ou plus sur la même copie : la borne '
        + 'haute ne s\'applique pas (fiche §4)')
    }
  }

  // ⚠️ PORTAGE — `(p1.get("question_posee") or "").strip()` lève sur un nombre.
  const questionPosee = texteStrippe(p1.question_posee)
  if (questionPosee === null) {
    alertes.push("question_posee n'est pas un texte — lue comme absente, aucune valeur par défaut n'est posée")
  }

  const mesures: Record<string, unknown> = {
    forme_question: p1.forme_question === undefined ? null : p1.forme_question,
    notions_en_tension: resolus.notions_en_tension,
    enjeu: resolus.enjeu,
    reponses_concurrentes: resolus.reponses_concurrentes,
    limites: notes,
    nb_limites: limites.length,
    question_posee: questionPosee ?? '',
    recadrages,
  }
  for (const [champ, dim] of CHAMPS_CATALOGUE) {
    const v = mesures[champ]
    if (v !== null && v !== undefined && !CATALOGUE[dim].includes(v as string)) {
      alertes.push(`${champ} : valeur « ${str(v)} » hors catalogue — `
        + "aucune valeur par défaut n'est posée")
    }
  }

  // « Aucun NOMBRE n'est injecté dans P2 : le juge ne compte rien. Mais le
  //   squelette, lui, doit lui parvenir — il passe par la clé du contrat. »
  return { mesures, document_p2: { ...p1 }, alertes }
}

// ── `_crible` — le code d'abord, le juge ensuite ───────────────────────────

/** Une ligne de trace : le module la rend STRUCTURÉE, et il est le seul des six. */
type LigneCrible = { rang: number; cite: unknown; verdict: string | null }

/**
 * `_crible` — « compose le verdict de chaque recadrage. Le code d'abord, le juge
 * ensuite, et le juge ne peut que fermer le seuil ou requalifier à seuil égal ».
 *
 * ⭐ L'ORDRE DES DEUX TESTS EST PORTEUR, et le module le dit en tête : « le test
 *    du DÉPLACEMENT passe avant celui de la TENUE. Un recadrage sans déplacement
 *    écrit est `verbal` quoi qu'il arrive — sa reprise ne se regarde même pas. Et
 *    si le juge dit que le déplacement n'est pas réel, son verdict `verbal`
 *    l'emporte sur le pré-verdict `non_tenu` du code : on ne reproche pas à un
 *    élève de n'avoir pas tenu ce qui n'était pas un recadrage. »
 */
function _crible(
  recadrages: readonly Recadrage[],
  cribleP2: unknown,
): { verdicts: LigneCrible[]; alertes: string[] } {
  const alertes: string[] = []
  const parRang = new Map<number, Objet>()

  // `for j in (crible_p2 or [])` — ⛔ SUR UNE CHAÎNE, PYTHON ITÈRE SES
  //    CARACTÈRES. Un `crible` rendu en texte ne porte donc aucune
  //    requalification : il porte autant d'entrées illisibles que de caractères.
  //    Ce n'est pas à durcir, c'est à porter (`itere`).
  const { elements, iterable } = itere(estVrai(cribleP2) ? cribleP2 : [])
  if (!iterable) {
    // ⚠️ PORTAGE — sur un nombre, `for j in 5` lève (contrat §3).
    alertes.push(`crible : « ${str(cribleP2)} » n'est pas parcourable — aucune requalification lue`)
  }
  for (const j of elements) {
    if (!estObjet(j)) {
      alertes.push("une entrée du crible n'est pas un objet — ignorée")
      continue
    }
    // ⚠️ PORTAGE — `(j.get("cite") or "").strip()` lève sur un nombre.
    const cite = texteStrippe(j.cite)
    if (cite === null) {
      alertes.push("une entrée du crible porte un « cite » qui n'est pas un texte — ignorée")
      continue
    }
    const cibles = recadrages.filter((r) => texteStrippe(r.cite) === cite)
    if (cibles.length !== 1) {
      alertes.push('requalification_inappariable : la requalification « '
        + `${tranche(cite, 40)} » ne vise aucun recadrage du relevé, ou plusieurs — `
        + 'consignée, jamais comptée')
      continue
    }
    parRang.set(cibles[0].rang, j)
  }

  const verdicts: LigneCrible[] = []
  for (const r of recadrages) {
    const j = parRang.get(r.rang) ?? {}
    let vj = j.verdict === undefined ? null : j.verdict
    const test = j.test === undefined ? null : j.test
    if (vj !== null && !CATALOGUE.verdicts_recadrage.includes(vj as string)) {
      alertes.push(`recadrage ${r.rang} : verdict « ${str(vj)} » hors catalogue — `
        + 'écarté du décompte')
      vj = null
    }
    if (test !== null && !CATALOGUE.tests_crible.includes(test as string)) {
      // ⚠️ Le contrôle du VERDICT est passé avant : un verdict hors catalogue a
      //    déjà remis `vj` à `null`, et le test se déduit alors de `None`. Python
      //    écrit « None » là où `${undefined}` de JavaScript écrirait
      //    « undefined » — d'où `str()` (premier écart de langage).
      const deduit = vj === 'verbal' ? 'deplacement' : vj === 'non_tenu' ? 'tenue' : null
      alertes.push(`test_illisible : recadrage ${r.rang}, test « ${str(test)} » `
        + `hors liste — déduit du verdict d'arrivée (${str(deduit)})`)
    }

    let final: string | null
    if (r.pre_verdict === 'verbal') {
      if (vj === 'valide' || vj === 'non_tenu') {
        alertes.push(`promotion_refusee : recadrage ${r.rang} — aucun `
          + "déplacement n'est écrit, le juge ne peut pas le relever")
      }
      final = 'verbal'
    } else if (vj === 'verbal') {
      final = 'verbal'
    } else if (r.reprise_absente) {
      if (vj === 'valide') {
        alertes.push(`promotion_refusee : recadrage ${r.rang} — aucune `
          + "reprise n'est écrite, le juge ne peut pas le valider")
      }
      final = 'non_tenu'
    } else if (vj === 'valide' || vj === 'non_tenu') {
      final = vj as string
    } else {
      alertes.push(`recadrage ${r.rang} : aucun verdict lisible du juge — `
        + 'écarté du décompte')
      final = null
    }
    verdicts.push({ rang: r.rang, cite: r.cite, verdict: final })
  }
  return { verdicts, alertes }
}

// ── crochet 5 — `code2` : la cascade, le crible, le seuil, la télémétrie ───

interface Telemetrie { valeurs: Record<string, ValeurReleve>; alertes: string[] }

/** Les neuf du §5 quand rien n'a pu être mesuré : aucune valeur, et une alerte NOMMÉE. */
function telemetrieMuette(motif: string): Telemetrie {
  return {
    valeurs: {},
    alertes: OBSERVABLES_TELEMETRIE.map((c) => `${c} : ${motif} — valeur non déclarée`),
  }
}

/**
 * `code2` — « la cascade du palier de base, l'application du crible, le seuil,
 * les garde-fous ».
 *
 * ⭐ LA CASCADE EST LA MISE EN MACHINE DE `REGLE_AGREGATION_CITEE`, mot pour mot,
 *    et la fiche la cite au §4 point 4 : « Absent si la forme de la question est
 *    absente ou si la question n'est pas propre […] ; Faible si la forme est un
 *    thème nominal ou si les notions ne sont pas articulées ; Moyen si la
 *    question est générique ; Bon si elle est spécifique et que l'enjeu est
 *    énoncé et qu'une réponse concurrente est énoncée ; Moyen sinon. Et Acquis
 *    exige le palier de base Bon plus au moins un recadrage valide après crible
 *    — le seuil ouvre Acquis, il n'élève jamais la base. »
 *
 * ⚠️ LES COMPARAISONS PORTENT SUR LES VALEURS BRUTES, jamais normalisées : le
 *    module écrit `forme == "absent"`, pas `_nn(forme) == "absent"`. Une valeur
 *    mal orthographiée n'entre donc dans aucune branche — elle lève une alerte
 *    de catalogue à `code1` et retombe sur la ligne suivante de la cascade. *Le
 *    contrôle gratuit du contrat §7 : le modèle ne répare rien ici, et le code
 *    non plus.*
 */
function code2(
  artefactP2: unknown,
  sortieCode1: SortieCode1,
  ctx: ContexteBranchement,
): SortieCode2 {
  const conjonction = _param(ctx.parametres, 'conjonction_bon')
  const alertes: string[] = []
  if (!estObjet(artefactP2)) {
    // ⚠️ PORTAGE — `p2.get(...)` lève sur autre chose qu'un dict.
    const m = 'PASSAGE MANQUÉ — la sortie du juge n\'est pas un objet. Aucun verdict '
      + "n'est composé sur une sortie tronquée (CONTRAT-MODULES.md §3)."
    return {
      verdicts: Object.fromEntries(OBSERVABLES_MODULE.map((o) => [o, null])),
      trace: traceStructuree([m]),
      alertes: [m],
      _telemetrie: telemetrieMuette('la sortie du juge est illisible'),
    }
  }
  const p2 = artefactP2
  const mes = estObjet(sortieCode1?.mesures) ? sortieCode1.mesures : {}

  const qPropre = p2.question_propre === undefined ? null : p2.question_propre
  const qSpec = p2.question_specifique === undefined ? null : p2.question_specifique

  // « Le silence du juge ne vaut jamais acquiescement (CONTRAT-MODULES.md §3).
  //   Un champ ABSENT évitait toutes les branches basses de la cascade : se taire
  //   sur `question_propre` donnait Bon là où « reprise_enonce » donnait Absent —
  //   l'omission était plus favorable que toute valeur légale du même champ
  //   (RM13). Un jugement obligatoire manquant ou hors catalogue rend le passage
  //   MANQUÉ : aucun verdict n'est composé. »
  const fatales: string[] = []
  for (const [champ, val, dim] of [
    ['question_propre', qPropre, 'questions_propres'],
    ['question_specifique', qSpec, 'specificites'],
  ] as const) {
    if (val === null) {
      fatales.push(`${champ} : jugement obligatoire absent de la sortie du juge`)
    } else if (!CATALOGUE[dim].includes(val as string)) {
      fatales.push(`${champ} : valeur « ${str(val)} » hors catalogue — aucune valeur par `
        + "défaut n'est posée")
    }
  }
  if (fatales.length) {
    const m = 'PASSAGE MANQUÉ — ' + fatales.join(' ; ')
      + ". Aucun verdict n'est composé sur une sortie tronquée "
      + '(CONTRAT-MODULES.md §3).'
    return {
      verdicts: Object.fromEntries(OBSERVABLES_MODULE.map((o) => [o, null])),
      trace: traceStructuree([m]),
      alertes: [...alertes, m],
      _telemetrie: telemetrieMuette('le passage est manqué : aucun verdict composé'),
    }
  }

  const recadrages = (Array.isArray(mes.recadrages) ? mes.recadrages : []) as Recadrage[]
  const crible = _crible(estVrai(mes.recadrages) ? recadrages : [], p2.crible)
  alertes.push(...crible.alertes)
  const verdicts = crible.verdicts

  const forme = mes.forme_question
  const tension = mes.notions_en_tension
  const enjeu = mes.enjeu
  const debat = mes.reponses_concurrentes

  if (!estVrai(mes.question_posee) && forme === 'absent') {
    alertes.push('copie_sans_question : aucune question au relevé — niveau Absent')
  }

  // La cascade. Première ligne qui répond décide.
  let palier: string
  if (forme === 'absent' || qPropre === 'reprise_enonce' || qPropre === 'avis') {
    palier = 'Absent'
  } else if (forme === 'theme_nominal' || tension !== 'articulees') {
    palier = 'Faible'
  } else if (qSpec === 'generique') {
    palier = 'Moyen'
  } else if (qSpec === 'n/a') {
    alertes.push('question_specifique vaut n/a alors que le relevé porte une '
      + 'question — squelette contradictoire, borne basse appliquée')
    palier = 'Moyen'
  } else {
    const termes = [qSpec === 'specifique', enjeu === 'enonce', debat === 'enoncees']
    const requis = conjonction === 'stricte' ? 3 : 2
    palier = termes.filter(Boolean).length >= requis ? 'Bon' : 'Moyen'
  }

  const valides = verdicts.filter((v) => v.verdict === 'valide')
  const seuil = (palier === 'Bon' && valides.length > 0) ? 'oui' : 'non'
  if (valides.length > 0 && palier !== 'Bon') {
    alertes.push("le seuil ouvre Acquis, il n'élève jamais la base : un recadrage "
      + `valide sur un palier de base ${palier} ne fait pas monter la copie`)
  }
  const niveau = seuil === 'oui' ? 'Acquis' : palier
  const specifique = CATALOGUE.specificites.includes(qSpec as string) ? (qSpec as string) : 'n/a'

  return {
    verdicts: {
      niveau,
      palier_base: palier,
      seuil_franchi: seuil,
      question_specifique: specifique,
    },
    // La trace du module : un enregistrement par recadrage, jamais un texte.
    trace: traceStructuree(verdicts.map((v) => ({ rang: v.rang, verdict: v.verdict }))),
    alertes,
    _telemetrie: telemetrie(mes, qPropre, specifique, verdicts, valides.length),
  }
}

/**
 * ⚠️⚠️ LA TRACE DU QUESTIONNEMENT EST STRUCTURÉE, ET IL EST LE SEUL DES SIX.
 *
 * Le module rend `[{"rang": …, "verdict": …}]` sur le chemin nominal et `[texte]`
 * sur le PASSAGE MANQUÉ ; `SortieCode2['trace']` la déclare `string[]`, parce que
 * les quatre compétences déjà portées n'en rendent que du texte. ⛔ Le « fait
 * quand » exige l'IDENTITÉ sur les trois clés : rendre du texte ici ferait
 * diverger la trace du module, et « une trace qui diverge dit qu'un chemin de
 * calcul a changé, même quand le verdict tombe juste ».
 *
 * Élargir le type toucherait `instruments.ts` ET les tests des quatre
 * branchements déjà écrits, qui appellent `.startsWith` sur leurs lignes. *La
 * conversion est donc contenue ici, nommée, et relevée au registre des ouverts —
 * « une source trouvée fausse se marque, elle ne se corrige pas ».*
 *
 * ⛔ Rien dans la chaîne ne LIT la trace : elle est rendue, jamais parcourue.
 */
function traceStructuree(lignes: ReadonlyArray<string | { rang: number; verdict: string | null }>): string[] {
  return lignes as unknown as string[]
}

// ── LA TÉLÉMÉTRIE DU §5 — l'autre moitié du portage, celle qui ne se voit pas ─

/**
 * Les NEUF observables du §5, rendus au relevé. Le module n'en calcule qu'UN —
 * `question_specifique`, le seul du corpus qui croise les deux listes.
 *
 * ⭐ CE QUI SE LIT TEL QUEL (cinq) : `question_presente` sur `forme_question`,
 *    `question_propre` sur le jugement du juge, `notions_en_tension`, `enjeu` et
 *    `debat_situe` sur les champs RÉSOLUS par la borne haute — ce sont eux que la
 *    cascade lit, et un observable qui lirait le brut dirait autre chose que le
 *    palier qu'il explique.
 *
 * ⭐ CE QUI DEMANDE UN CALCUL PROPRE (trois) : `recadrage`, `recadrage_verbal` et
 *    `recadrage_non_tenu` — voir l'en-tête du fichier.
 *
 * ⚠️ `les recadrages tentés` EST LE DÉNOMINATEUR, et il part au relevé sous ce
 *    nom exact. Il vaut le nombre de recadrages RETENUS par `code1` — ceux qui
 *    ont un verdict composé, `null` compris : un recadrage que le juge n'a pas
 *    jugé reste une TENTATIVE de l'élève, et le §5 dit « le nombre de recadrages
 *    TENTÉS ». Il n'entre donc dans aucun des deux numérateurs, et c'est le seul
 *    élément écarté des numérateurs qui porte quand même la propriété mesurée.
 *
 * ⚠️ « Sans tentative, la mesure est sans objet — le taux est NULL, jamais 0 » :
 *    `observables.ts` rend `n/a` dès que le dénominateur vaut 0, et `n/a` sort du
 *    dénominateur du taux (`01-` §8.2). Le zéro se rend quand même, parce qu'un
 *    dénominateur ABSENT et un dénominateur NUL n'ont pas le même sens à la
 *    lecture d'un relevé.
 */
function telemetrie(
  mes: Record<string, unknown>,
  qPropre: unknown,
  specifique: string,
  verdicts: readonly LigneCrible[],
  nbValides: number,
): Telemetrie {
  const alertes: string[] = []
  if (!estObjet(mes) || !('forme_question' in mes)) {
    return telemetrieMuette('le relevé de Code1 ne porte aucun champ')
  }

  const tentes = verdicts.length
  const verbaux = verdicts.filter((v) => v.verdict === 'verbal').length
  const nonTenus = verdicts.filter((v) => v.verdict === 'non_tenu').length

  const valeurs: Record<string, ValeurReleve> = {
    // Les cinq qui se lisent — la VALEUR, jamais le verdict : « le verdict ne se
    // stocke pas, il se lit en confrontant cette valeur au seuil de la fiche ».
    question_presente: valeurTextuelle(mes.forme_question, 'question_presente', alertes),
    question_propre: valeurTextuelle(qPropre, 'question_propre', alertes),
    notions_en_tension: valeurTextuelle(mes.notions_en_tension, 'notions_en_tension', alertes),
    // ⭐ UN SEUL CALCUL, DEUX LECTURES — le verdict composé par `code2`, recopié.
    question_specifique: specifique,
    enjeu: valeurTextuelle(mes.enjeu, 'enjeu', alertes),
    debat_situe: valeurTextuelle(mes.reponses_concurrentes, 'debat_situe', alertes),
    // ⛔ CE N'EST PAS `seuil_franchi` : le §5 dit « au moins un recadrage valide
    //    après crible », sans un mot du palier de base.
    recadrage: nbValides > 0 ? 'oui' : 'non',
    // Les deux `comptage rapporté`, avec leur dénominateur sous son nom exact.
    recadrage_verbal: verbaux,
    recadrage_non_tenu: nonTenus,
    [DENOM_TENTES]: tentes,
  }
  return { valeurs, alertes }
}

/**
 * La valeur d'un observable BINAIRE — un verdict, jamais un nombre.
 *
 * ⚠️ Une entrée à `null` veut dire « pas d'occasion » et rend `n/a` ; ce n'est
 *    donc PAS un trou. Ce qui serait un trou, c'est un observable déclaré et
 *    absent du relevé — d'où l'alerte NOMMÉE quand la valeur n'est pas lisible.
 */
function valeurTextuelle(v: unknown, code: string, alertes: string[]): ValeurReleve {
  if (v === null || v === undefined) return null
  if (typeof v === 'string' || typeof v === 'boolean') return v
  alertes.push(`${code} : la valeur « ${str(v)} » n'est pas un verdict — rendue \`n/a\``)
  return null
}

// ── crochet 6 — `conformite` : les alertes de recette ──────────────────────

/** Ce qu'un juge n'a JAMAIS le droit de rendre : « le niveau appartient au code ». */
const INTERDITS: readonly string[] = ['niveau', 'palier', 'palier_base', 'seuil_franchi', 'lettre', 'note']

/** Les trois champs de prose, et les cinq paliers qui n'ont rien à y faire. */
const CHAMPS_PROSE: readonly string[] = ['justification_ancree', 'ce_qui_plafonne', 'levier']
const MOTS_PALIER: readonly string[] = ['Absent', 'Faible', 'Moyen', 'Bon', 'Acquis']
const CONFIANCES: readonly string[] = ['elevee', 'moyenne', 'faible']

/**
 * `conformite` — « les alertes de recette : ce que ni les réplicats ni le
 * croisement ne voient ». Il tourne à CHAQUE passage, d'office.
 *
 * ⚠️ Il ne lit QUE la sortie du juge : ni P1, ni Code1, ni Code2 ne l'intéressent.
 */
function conformite(
  _artefactsP1: Record<string, unknown>,
  artefactP2: unknown,
  _sortieCode1: SortieCode1,
  _sortieCode2: SortieCode2,
  _ctx: ContexteBranchement,
): string[] {
  const alertes: string[] = []
  const p2 = estVrai(artefactP2) ? artefactP2 : {}

  // `for cle in p2` — sur un dict, Python parcourt ses CLÉS ; sur une chaîne, ses
  // CARACTÈRES. Aucun caractère isolé ne tombe dans la liste des interdits, mais
  // la sémantique se porte quand même : c'est elle qui décide, pas nous.
  const { elements, iterable } = itere(p2)
  if (!iterable) {
    // ⚠️ PORTAGE — sur un nombre, `for cle in 5` lève (contrat §3).
    alertes.push(`conformite : la sortie du juge « ${str(artefactP2)} » n'est pas parcourable`)
    return alertes
  }
  for (const cle of elements) {
    if (typeof cle === 'string' && INTERDITS.includes(cle.toLowerCase())) {
      alertes.push(`palier_ou_decompte_rendu : le juge rend « ${cle} » — `
        + 'le niveau appartient au code')
    }
  }

  const objet = estObjet(p2) ? p2 : {}
  for (const cle of CHAMPS_PROSE) {
    const brut = objet[cle]
    const txt = estVrai(brut) ? brut : ''
    for (const mot of MOTS_PALIER) {
      const dedans = contient(mot, txt)
      if (dedans === null) {
        // ⚠️ PORTAGE — `« Absent » in 5` lève (contrat §3).
        alertes.push(`conformite : ${cle} porte « ${str(brut)} », où un palier ne se cherche pas`)
        break
      }
      if (dedans) {
        alertes.push(`palier_ou_decompte_rendu : « ${mot} » apparaît dans `
          + `${cle} — la prose ne nomme aucun palier`)
        break
      }
    }
  }

  const conf = objet.confiance === undefined ? null : objet.confiance
  if (conf !== null && !CONFIANCES.includes(conf as string)) {
    alertes.push(`confiance : valeur « ${str(conf)} » hors des trois admises`)
  }
  return alertes
}

// ════════════════════════════════════════════════════════════════════════════
// LE BRANCHEMENT
// ════════════════════════════════════════════════════════════════════════════

export const BRANCHEMENT_QUESTIONNEMENT: BranchementCompetence = {
  /**
   * ⭐ LES DEUX SLOTS DE P1 SONT NATIFS, ET C'EST LE CAS LE PLUS SIMPLE DES SIX :
   *    `{copie}` et `{sujet}` viennent du contexte de l'exercice, le module ne
   *    définit AUCUN `pre_p1`, et il n'y a donc rien à déclarer. ⚠️ `{sujet}` EST
   *    LA CONSIGNE INSTANCIÉE — la table `exercices` ne porte pas le texte d'un
   *    sujet distinct (`07-` §1.1).
   */
  extractions: () => [{
    cle: 'p1',
    tetePrompt: 'P1',
    slotsFournis: [],
  }],

  /**
   * TROIS SLOTS AU PROMPT DE JUGEMENT.
   *
   * ⭐ `SLOT_DOCUMENT_P2` EST DÉCLARÉ PAR LE MODULE, et c'est obligatoire ici :
   *    « le prompt P2 porte TROIS slots : le squelette, plus les deux du référent
   *    servis par `pre_p2`. Le banc ne peut donc pas deviner lequel est le
   *    document. » ⛔ LE DOCUMENT N'EST PAS LE RÉFÉRENT : les intervertir ferait
   *    lire au juge le référent à la place du relevé, et rendre des verdicts
   *    propres sur rien.
   */
  jugement: () => ({
    tetePrompt: 'P2',
    slotDocument: 'squelette_phase_1',
    slotsFournis: ['nature_referent', 'referent'],
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
        alertes: ['les observables de télémétrie ne sont pas parvenus de Code2 — les neuf du §5 '
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
   * FICHE DU QUESTIONNEMENT NE LE DÉFINIT NULLE PART. ⚠️ Le mot « delta »
   * n'apparaît PAS UNE FOIS dans `competences/questionnement.md` : ni son §3, ni
   * son §4, ni son §5, ni son bloc machine, ni son §8 ne disent ce que comparer
   * un squelette de v1 à un squelette de version finale voudrait dire ici.
   *
   * ⚠️⚠️ CINQ FICHES SUR CINQ SE TAISENT — Expression, Argumentation, Structure,
   *    Connaissance, Questionnement. Ce n'est plus un oubli de fiche : c'est une
   *    case du gabarit du `03-` §1 que personne n'a remplie. *Registre des
   *    ouverts, item 47 ; l'inventer ici serait trancher une règle de grille
   *    depuis le code, ce qu'aucun lot ne fait.*
   *
   * La chaîne le dit alors par une alerte et laisse NULL. ⚠️ ET NULL N'EST PAS 0 :
   * une passation en classe n'a pas de version finale.
   */
}

// Exportés pour le test du portage — jamais pour la chaîne, qui ne connaît que
// `BRANCHEMENT_QUESTIONNEMENT`. Les fonctions internes, elles, restent internes :
// ce qui se compare au module se compare PAR LES CROCHETS, comme le banc le fait.
export {
  OBSERVABLES_TELEMETRIE, OBSERVABLES_MODULE, PARAMS_DEFAUT, CATALOGUE, PALIERS,
  DENOM_TENTES, LETTRE_DU_NIVEAU, MODES_RECEPTIFS, VIDE_DEPLACEMENT, VIDE_REPRISE,
}
