// ============================================================================
// C4 · L10 — LE BRANCHEMENT DE LA STRUCTURE. Tout le calcul, aucun jugement.
// ----------------------------------------------------------------------------
// EXTRACTION, PAS RÉGÉNÉRATION. Ce fichier est le portage, fonction pour
// fonction, de `copies-tests/structure/code.py` (dépôt de conception, calcul
// v1.1) — lui-même l'extraction d'`agregation-structure.py` v1.4, où « LES
// ARBITRAGES A1-A10 rendus par Louis le 30 juillet 2026 restent encodés tels
// quels ». « Le régénérer depuis la fiche les jetterait » (`CONTRAT-MODULES.md`
// §7).
//
//   La table d'extraction du contrat §7, suivie à la lettre :
//     code2      ← `agregation-structure.py` (`lire_squelette`, `cohesion_locale`,
//                  `coherence_globale`, `croisement`, `recette`, `calculer`)
//     conformite ← `verif-conformite.py` — « l'erreur stable, que ni réplicats
//                  ni 5×5 ne voient » —, telle que le module l'a déjà extraite
//     prepare_copie ← `numerote()` de `banc-structure.py`
//
// ⚠️ LA FICHE FAIT FOI POUR LA RÈGLE, LE MODULE POUR LE CALCUL. Lire la fiche
//    pour comprendre (`competences/structure.md` : §3 le squelette, §4 les
//    règles de notation et le bloc machine, §5 les observables) ; lire le module
//    pour porter. Là où les deux se rencontrent — le périmètre, les majorités,
//    la modulation saturante, le croisement, les quatre garde-fous —, ils disent
//    la même chose, et le module la dit en code.
//
// ⭐ CE QUE LE PORTAGE AJOUTE, ET QUI N'EST PAS DANS LE MODULE : les HUIT
//    OBSERVABLES DE TÉLÉMÉTRIE du §5 de la fiche. Ce ne sont pas les
//    `OBSERVABLES` du module — ceux-là (`niveau`, `cohesion_locale`,
//    `coherence_globale`, `route_globale`, `profil_moyen`) sont ce que le BANC
//    compare aux golds, et les deux ensembles n'ont pas un seul élément commun
//    (`CONTRAT-MODULES.md` §8 : « 0 sur 8 en Structure »). Le `03-` §1, gelé,
//    dit qui les applique : « il n'est pas appliqué par le module mais par LA
//    CHAÎNE FROIDE ». Porter le module est la moitié du travail ; l'autre moitié
//    ne se voit pas.
//
// ⛔ AUCUN SEUIL EN DUR pour la télémétrie : les seuils vivent au bloc machine de
//    la fiche, l'instrument dérivé les porte, et `observables.ts` lit le verdict
//    contre eux. Ici, on rend des VALEURS. *La Structure ne déclare d'ailleurs
//    AUCUN paramètre — `parametres: {}` à la fiche, `PARAMS` vide au module : la
//    pondération cohérence/cohésion reste la question ouverte du §8, et « le jour
//    où elle se tranche, elle entre au bloc machine en paramètre ».*
//
// ⚠️ CE QUE LE PORTAGE DURCIT, ET POURQUOI. Le module lève une exception sur des
//    formes que P1 ou P2 peuvent prendre et qu'il n'attend pas — `.get` sur un
//    non-dictionnaire, `for … in` sur un nombre, `len()` sur un entier. Le
//    contrat §3 l'interdit : « le module ne lève jamais d'exception : elle
//    traverserait le banc et emporterait la trace avec elle », et prescrit
//    l'inverse : « une valeur illisible rend une alerte, pas une valeur par
//    défaut ». Chaque durcissement est marqué ⚠️ PORTAGE ci-dessous, ne se
//    déclenche sur AUCUN vecteur du module, et rend une alerte nommée.
//
// ⚠️⚠️ ET CE QUE PORTER RETIRE. « Le P2 de la Structure ouvrait la route de la
//    promesse sur 103 des 118 cellules, et AUCUNE des cent cellules du banc ne
//    l'a prise : les deux modèles réparaient le "et/ou" sans le dire. » Un code
//    qui applique le texte à la lettre ne réparera rien — c'est voulu, c'est
//    mesuré, et le §5 le rend visible : `promesse_presente` DIT la route prise.
// ============================================================================

import {
  CAR_BLANC_PYTHON, CAR_CHIFFRE_PYTHON, CAR_MOT_PYTHON,
  estVrai, itere, longueur, motIsole, remplaceBlancs, str, strip, trie,
} from '../python'
import type {
  BranchementCompetence, ContexteBranchement, SortieCode1, SortieCode2,
} from '../instruments'

// ── Les constantes du module, à l'identique ────────────────────────────────

/** Du plus bas au plus haut — l'échelle des deux dimensions (fiche §2). */
const COHESION = ['défaillance forte', 'défaillance', 'satisfaite', 'haut'] as const
const NIVEAUX = ['Absent', 'Faible', 'Moyen', 'Bon', 'Acquis'] as const
const ROLES_SERVICE = ['intro', 'bilan', 'conclusion'] as const
/** Du plus bas au plus haut — la borne basse d'un « limite » lit cet ordre. */
const STATUTS = ['absente', 'plaquée', 'motivée'] as const

/** `CATALOGUE` du module = le volet `squelette` du bloc machine de la fiche. */
const CATALOGUE = {
  roles: ['intro', 'developpement', 'bilan', 'conclusion'],
  gestes: ['bilan', 'manque', 'relance'],
  probleme_forme: ['question', 'tension affirmée'],
  statuts_composes: ['absente', 'plaquée', 'motivée'],
  natures_couture: ['charniere', 'tissu', 'seuil'],
} as const

/** `00-referentiel.md` §2 — la triple nomenclature du §2 de la fiche. */
const LETTRE_DU_NIVEAU: Record<string, string> = {
  Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
}

/** `INTERDITS` — ce que P2 ne doit plus produire (fiche §4, « Ce que P2 juge »). */
const INTERDITS = ['niveau', 'cohesion_locale', 'coherence_globale', 'profil_moyen',
  'route_globale'] as const

// ── Les outils du module ───────────────────────────────────────────────────

type Objet = Record<string, unknown>

function estObjet(v: unknown): v is Objet {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** `d.get(cle)` de Python — `undefined` là où le module lèverait. */
function get(v: unknown, cle: string): unknown {
  return estObjet(v) ? v[cle] : undefined
}

/** Les `n` PREMIERS POINTS DE CODE — `s[:n]` de Python, jamais `slice()`. */
function prefixe(s: string, n: number): string {
  return [...s].slice(0, n).join('')
}

/**
 * `_n(s)` du module : `str(s).strip().lower()`, l'apostrophe typographique
 * ramenée à la droite, les trois valeurs d'énumération ré-accentuées, puis les
 * suites de blancs réduites à une espace.
 *
 * ⚠️ `strip` et `remplaceBlancs` sont ceux de `../python` : les blancs de Python
 *    ne sont pas ceux de JavaScript, et `\x1c`-`\x1f` comme `\x85` décideraient
 *    seuls qu'une valeur d'énumération est reconnue ou non.
 * ⚠️ `.lower()`, PAS `.casefold()` — le module de la Structure emploie le
 *    premier, celui de l'Argumentation le second. La différence est réelle
 *    (`ß` → `ss`), et on porte ce que le module écrit, pas ce qu'il aurait pu.
 */
function norm(s: unknown): string {
  if (s === null || s === undefined) return ''
  let t = strip(str(s)).toLowerCase().replace(/’/g, "'")
  t = t.split('plaquee').join('plaquée')
    .split('motivee').join('motivée')
    .split('defaillance').join('défaillance')
  return remplaceBlancs(t, ' ')
}

/** `_absent(v)` — vide, ou la marque littérale `[absent…]`. */
function estAbsent(v: unknown): boolean {
  const t = norm(v)
  return !t || t.startsWith('[absent')
}

/**
 * `for g in (j.get(cle) or [])` de Python, avec son drapeau d'illisibilité.
 *
 * ⚠️ PORTAGE — le module lèverait `TypeError` sur un nombre ou un booléen. Une
 *    CHAÎNE, elle, est itérable en Python et rend ses caractères : c'est ce qui
 *    fait qu'un `gestes: "manque"` ne porte AUCUN geste « manque ». Ce n'est pas
 *    un durcissement, c'est la sémantique — et la reproduire est ce qui fait
 *    tomber le balayage du même côté que le module.
 */
function elements(v: unknown): { liste: unknown[]; illisible: boolean } {
  if (!estVrai(v)) return { liste: [], illisible: false } // `or []`
  const { elements: liste, iterable } = itere(v)
  return { liste, illisible: !iterable }
}

// ════════════════════════════════════════════════════════════════════════════
// LECTURE DU SQUELETTE — tout ce qui se compte se compte ICI
// ════════════════════════════════════════════════════════════════════════════

/** `_couture_vide` — question de FAIT, pas de jugement. */
function coutureVide(j: unknown): boolean {
  const t = norm(get(j, 'texte_cite'))
  return !t || t.startsWith('[aucun') || ['aucune', 'aucun', 'néant', '-'].includes(t)
}

/**
 * `_geste_manque` — le geste « manque » est-il consigné ? Fait, pas jugement.
 *
 * ⚠️ PORTAGE — `for g in 3` lève ; une valeur non itérable ne porte simplement
 *    aucun geste. Le fait ne se tait pas pour autant : `lireLeSquelette` le dit
 *    UNE FOIS, en nommant la couture (`GESTES_ILLISIBLES`). Aucun vecteur du
 *    module ne l'atteint.
 */
function gesteManque(j: unknown): boolean {
  const { liste } = elements(get(j, 'gestes'))
  return liste.some((g) => norm(g).startsWith('manque'))
}

/**
 * `_statut_derive` — A8, le statut COMPOSÉ à partir des deux faits que P1
 * consigne. « Dériver le statut au lieu de le laisser déclarer fait tomber la
 * divergence entre passages de 38,5 % à 26,9 % des coutures, et ferme la
 * TOTALITÉ des six bascules plaquée↔motivée » (mesuré le 31/07 sur 27 squelettes).
 */
function statutDerive(j: unknown): string {
  if (coutureVide(j)) return 'absente'
  return gesteManque(j) ? 'motivée' : 'plaquée'
}

/**
 * `_statut(j)` — le statut d'une jointure, dans cet ordre :
 *
 *   1. P1 ne déclare pas de statut (squelette v1.4) → le code le compose ;
 *   2. P1 déclare un statut du catalogue → on le prend ;
 *   3. P1 déclare « limite » → borne basse des deux bornes lisibles dans la
 *      note ; à défaut de note lisible, LA COMPOSITION, jamais « absente » ;
 *   4. valeur hors catalogue → la composition.
 *
 * « Une couture où quelque chose EST écrit ne peut pas être "absente" :
 * "absente" veut dire qu'il n'y a rien, et c'est un fait, pas un verdict. »
 *
 * ⚠️ La recherche des bornes est une SOUS-CHAÎNE (`s[:6] in note`), pas un mot
 *    isolé : « écirculaire » n'a pas de pendant ici, et on ne l'invente pas.
 */
function statutDe(j: unknown): string {
  const st = norm(get(j, 'statut'))
  if (!st) return statutDerive(j)
  for (const s of STATUTS) if (st.startsWith(prefixe(s, 6))) return s
  if (st.startsWith('limit')) {
    const note = norm(get(j, 'note'))
    const bornes = STATUTS.filter((s) => note.includes(prefixe(s, 6)))
    // `min(bornes, key=STATUTS.index)` — l'ordre de STATUTS va du plus bas au
    // plus haut, donc le premier retenu EST le minimum ; on le dit quand même.
    return bornes.length
      ? bornes.reduce((a, b) => (STATUTS.indexOf(a) <= STATUTS.indexOf(b) ? a : b))
      : statutDerive(j)
  }
  return statutDerive(j)                                // valeur hors catalogue
}

/**
 * `_bornes(entre)` — les deux blocs d'une couture, depuis « ¶2 → ¶3 ».
 *
 * ⚠️ `\d` de Python est UNICODE : il compte les chiffres arabes-indiens comme
 *    les nôtres, quand celui de JavaScript ne connaît que `[0-9]`.
 */
const RE_BORNES = new RegExp(
  `(${CAR_CHIFFRE_PYTHON}+)[^${CAR_CHIFFRE_PYTHON}]+(${CAR_CHIFFRE_PYTHON}+)`, 'u')

function bornes(entre: unknown): [string | null, string | null] {
  const m = RE_BORNES.exec(estVrai(entre) ? str(entre) : '')
  return m ? [`¶${m[1]}`, `¶${m[2]}`] : [null, null]
}

/**
 * `_niveau_couture` — A10, la NATURE de la couture, composée au lieu d'être
 * déclarée. Cascade, la première qui répond décide (fiche §4, « Ce que Code2
 * compose », point 2) :
 *
 *   1. bloc de gauche `intro`, ou de droite `conclusion`        → seuil
 *   2. deux parties marquées différentes                        → charniere
 *   3. deux étapes annoncées différentes                        → charniere
 *   4. sinon                                                    → tissu
 *
 * « Conséquence voulue : sans annonce de plan ni partie marquée, AUCUNE couture
 * n'est une charnière. » Mesuré : 84 % d'accord avec ce que P1 déclarait, et la
 * divergence entre passages tombe de 11,5 % à 5,8 %.
 */
function natureCouture(
  j: unknown, blocs: Map<string, unknown>, parties: Map<string, number>,
): string {
  const [g, d] = bornes(get(j, 'entre'))
  const bg = g === null ? undefined : blocs.get(g)
  const bd = d === null ? undefined : blocs.get(d)
  // ⚠️ `not bg` de Python : un dictionnaire VIDE est faux. `estVrai` le porte.
  if (!estVrai(bg) || !estVrai(bd)) return 'tissu'
  if (norm(get(bg, 'role')).startsWith('intro')
    || norm(get(bd, 'role')).startsWith('conclusion')) return 'seuil'
  if (g !== null && d !== null && parties.has(g) && parties.has(d)
    && parties.get(g) !== parties.get(d)) return 'charniere'
  const cg = norm(get(bg, 'correspondance_annonce'))
  const cd = norm(get(bd, 'correspondance_annonce'))
  if (cg.startsWith('étape') && cd.startsWith('étape') && cg !== cd) return 'charniere'
  return 'tissu'
}

/** `_relation(j)` — « oui », « non », ou « ? » quand la valeur est illisible. */
function relation(j: unknown): 'oui' | 'non' | '?' {
  const r = norm(get(j, 'relation_nommee'))
  if (r.startsWith('oui')) return 'oui'
  return r.startsWith('non') ? 'non' : '?'
}

interface Faits {
  charnieres: unknown[]
  tissu: unknown[]
  seuils: unknown[]
  garde_fou_seuils: boolean
  n_charnieres: number
  n_tissu: number
  n_seuils: number
  tissu_oui: number
  tissu_non: number
  blocs: unknown[]
  service: unknown[]
  dev: unknown[]
  dev_idee: unknown[]
  num_dev_idee: string[]
  a_probleme: boolean
  probleme_forme: unknown
  a_annonce: boolean
  n_etapes: number
}

/** `lire_squelette(sq)` — partitionne et compte. Rend `(faits, alertes)`. */
function lireLeSquelette(sq: unknown): { faits: Faits; alertes: string[] } {
  const alertes: string[] = []
  const jointuresBrutes = elements(get(sq, 'jointures'))
  if (jointuresBrutes.illisible) {
    // ⚠️ PORTAGE — `for j in 3` lève. Le squelette n'a alors aucune couture, et
    //    la Structure LE DIT : la cohésion tombera en défaillance forte par
    //    A9, jamais sur un silence.
    alertes.push('JOINTURES_ILLISIBLES — « jointures » n\'est ni une liste ni un texte ; '
      + 'aucune couture au décompte, valeur consignée, jamais réparée')
  }
  const jointures = jointuresBrutes.liste
  const blocsBruts = elements(get(sq, 'blocs'))
  if (blocsBruts.illisible) {
    alertes.push('BLOCS_ILLISIBLES — « blocs » n\'est ni une liste ni un texte ; '
      + 'aucun bloc au décompte, valeur consignée, jamais réparée')
  }
  const blocs = blocsBruts.liste
  // `pr = sq.get("promesse", {}) or {}` — ⚠️ PORTAGE : `pr.get` lèverait sur une
  // chaîne. Un non-objet n'a aucune promesse à lire, et le fait se dit.
  const prBrut = get(sq, 'promesse')
  const pr = estObjet(prBrut) ? prBrut : {}
  if (estVrai(prBrut) && !estObjet(prBrut)) {
    alertes.push('PROMESSE_ILLISIBLE — « promesse » n\'est pas un objet ; ni problème ni '
      + 'annonce ne se lisent, valeur consignée, jamais réparée')
  }

  // ⚠️ PORTAGE — LES TROIS LISTES PEUVENT PORTER AUTRE CHOSE QUE DES OBJETS, et
  //    le module lève alors sur `.get`. Ici la valeur est écartée du décompte et
  //    NOMMÉE, une fois pour toutes, au lieu d'emporter la trace avec elle.
  const nonObjets = (lot: unknown[], quoi: string) => {
    const n = lot.filter((x) => !estObjet(x)).length
    if (n) {
      alertes.push(`${quoi}_ILLISIBLES ×${n} — entrée(s) qui ne sont pas des objets ; `
        + 'lues comme vides, valeur consignée, jamais réparée')
    }
  }
  nonObjets(jointures, 'JOINTURES')
  nonObjets(blocs, 'BLOCS')
  const gestesIllisibles = jointures
    .filter((j) => elements(get(j, 'gestes')).illisible)
    .map((j) => str(get(j, 'entre')))
  if (gestesIllisibles.length) {
    alertes.push(`GESTES_ILLISIBLES ×${gestesIllisibles.length} — « gestes » n'est ni une liste `
      + `ni un texte (${gestesIllisibles.join(', ')}) ; aucun geste retenu, valeur consignée, `
      + 'jamais réparée')
  }

  // L'index pour la composition de la nature (A10) — squelettes v1.4, où P1 ne
  // déclare plus le niveau de la couture.
  const parNum = new Map<string, unknown>()
  for (const b of blocs) parNum.set(norm(get(b, 'num')), b)
  const parPartie = new Map<string, number>()
  const partiesBrutes = elements(get(sq, 'parties'))
  if (partiesBrutes.illisible) {
    alertes.push('PARTIES_ILLISIBLES — « parties » n\'est ni une liste ni un texte ; '
      + 'aucune partie marquée, valeur consignée, jamais réparée')
  }
  nonObjets(partiesBrutes.liste, 'PARTIES')
  partiesBrutes.liste.forEach((p, i) => {
    // ⚠️ `_n(b)` sur un OBJET rend son `repr()` — c'est ce que Python fait quand
    //    `parties[].blocs` porte des dictionnaires au lieu de « ¶2 » (les
    //    squelettes d'avant la v1.4 le font, et les artefacts de juillet en sont
    //    pleins). On ne le répare pas : la clé ne correspond alors à aucun bloc,
    //    et aucune charnière n'en naît.
    for (const b of elements(get(p, 'blocs')).liste) parPartie.set(norm(b), i)
  })

  const ch: unknown[] = []
  let ti: unknown[] = []
  let se: unknown[] = []
  const inconnu: unknown[] = []
  for (const j of jointures) {
    let n = norm(get(j, 'niveau'))
    if (!n) n = natureCouture(j, parNum, parPartie)     // v1.4 : le code compose
    if (n.startsWith('charni')) ch.push(j)
    else if (n.startsWith('tissu')) ti.push(j)
    else if (n.startsWith('seuil')) se.push(j)
    else inconnu.push(j)
  }
  if (inconnu.length) {
    alertes.push(`NIVEAU_HORS_CATALOGUE ×${inconnu.length} — jointures ignorées`)
  }

  // § PÉRIMÈTRE — garde-fou des copies courtes (fiche §4, point 3).
  let garde = false
  if (ch.length + ti.length < 1) {
    ti = [...ti, ...se]
    se = []
    garde = true
    alertes.push('GARDE_FOU_REINTEGRATION_SEUILS')
  }

  const estService = (b: unknown) =>
    ROLES_SERVICE.some((r) => norm(get(b, 'role')).startsWith(r))
  const service = blocs.filter(estService)
  // ⚠️ Le module écrit `[b for b in blocs if b not in service]`, et le `not in`
  //    de Python compare PAR VALEUR. Le résultat est pourtant le même que par
  //    identité, et la démonstration tient en une ligne : un bloc égal en valeur
  //    à un membre de `service` porte le même `role`, donc il est lui-même dans
  //    `service`. Rejouer le prédicat est donc exact — et il ne dépend pas de
  //    l'égalité structurelle, que JavaScript n'a pas.
  const dev = blocs.filter((b) => !estService(b))
  const devIdee = dev.filter((b) => !estAbsent(get(b, 'idee_directrice_citee')))

  // A5 — la forme fait foi ; un problème cité sans forme est un contrat rompu.
  const forme = norm(pr.probleme_forme)
  const aForme = ['question', 'tension affirmée', 'tension affirmee'].includes(forme)
  if (!aForme && !estAbsent(pr.probleme_pose)) {
    alertes.push('PROMESSE_INCOHERENTE — problème cité, forme absente ; '
      + 'la forme fait foi (A5)')
  }
  const aAnnonce = !estAbsent(pr.annonce_de_plan)
  // ⚠️ `len(etapes)` de Python — une CHAÎNE y a une longueur, et c'est ce qui
  //    décide si la clause d'ordre du §4 s'applique.
  const etapesBrutes = estVrai(pr.etapes_annoncees) ? pr.etapes_annoncees : []
  const nEtapes = longueur(etapesBrutes)
  if (nEtapes === null) {
    // ⚠️ PORTAGE — `len(3)` lève.
    alertes.push('ETAPES_ILLISIBLES — « etapes_annoncees » n\'a pas de longueur ; '
      + 'la clause d\'ordre ne s\'applique pas, valeur consignée, jamais réparée')
  }

  // Les deux identités du squelette. Elles ne corrigent rien : elles signalent
  // qu'un squelette se contredit lui-même, ce qui rend son statut arbitraire.
  // Tenues à 97,2 % et 98,0 % sur les 397 jointures archivées ; « quand elles
  // cèdent, c'est toujours dans le sens qui change le verdict ».
  const incVide = jointures.filter((j) =>
    norm(get(j, 'statut')).startsWith('absent') && !coutureVide(j))
  const incManque = jointures.filter((j) => {
    const st = norm(get(j, 'statut'))
    return gesteManque(j) !== st.startsWith('motiv') && !!st && !st.startsWith('limit')
  })
  if (incVide.length) {
    alertes.push(`SQUELETTE_INCOHERENT ×${incVide.length} — statut « absente » alors `
      + `qu'un texte est cité (${incVide.map((j) => str(get(j, 'entre'))).join(', ')})`)
  }
  if (incManque.length) {
    alertes.push(`SQUELETTE_INCOHERENT ×${incManque.length} — le geste « manque » et le `
      + `statut « motivée » ne s'accordent pas (${
        incManque.map((j) => str(get(j, 'entre'))).join(', ')})`)
  }

  return {
    faits: {
      charnieres: ch, tissu: ti, seuils: se,
      garde_fou_seuils: garde,
      n_charnieres: ch.length, n_tissu: ti.length, n_seuils: se.length,
      tissu_oui: ti.filter((j) => relation(j) === 'oui').length,
      tissu_non: ti.filter((j) => relation(j) === 'non').length,
      blocs, service, dev, dev_idee: devIdee,
      num_dev_idee: devIdee.map((b) => str(get(b, 'num'))),
      a_probleme: aForme, probleme_forme: pr.probleme_forme,
      a_annonce: aAnnonce, n_etapes: nEtapes ?? 0,
    },
    alertes,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// COHÉSION LOCALE (§ 2 du module ; fiche §4, point 4)
// ════════════════════════════════════════════════════════════════════════════

/** Ce que la cohésion rend au calcul — et ce qu'elle prête à la télémétrie. */
interface SortieCohesion {
  base: string
  alertes: string[]
  trace: string[]
  /** Les statuts des charnières APRÈS CRIBLE, dans l'ordre du squelette. */
  statutsCharnieres: string[]
  /** Les charnières que le crible a RÉELLEMENT rétrogradées (§5, `charniere_formule`). */
  nRetrogradees: number
}

function cohesionLocale(faits: Faits, jugements: Objet): SortieCohesion {
  const alertes: string[] = []
  const trace: string[] = []
  const ch = faits.charnieres
  const ti = faits.tissu

  // Le crible de P2 : il ne peut que rétrograder « motivée » → « plaquée ».
  // ⚠️ PORTAGE — `(jugements.get("crible", {}) or {}).get(…)` lèverait sur une
  //    chaîne, et `for r in …` sur un nombre.
  const cribleBrut = jugements.crible
  const crible = estObjet(cribleBrut) ? cribleBrut : {}
  if (estVrai(cribleBrut) && !estObjet(cribleBrut)) {
    alertes.push('CRIBLE_ILLISIBLE — « crible » n\'est pas un objet ; aucune rétrogradation '
      + 'appliquée, valeur consignée, jamais réparée')
  }
  const retroBrutes = elements(crible.retrogradations)
  if (retroBrutes.illisible) {
    alertes.push('CRIBLE_ILLISIBLE — « crible.retrogradations » n\'est ni une liste ni un '
      + 'texte ; aucune rétrogradation appliquée, valeur consignée, jamais réparée')
  }
  // ⚠️ PORTAGE — le module ferait `r.get("entre")` et lèverait. Sans cette
  //    alerte, une liste de chaînes se lisait comme autant de rétrogradations
  //    « sans nom » : le CRIBLE_NON_APPARIE qui en sortait accusait le juge
  //    d'avoir visé une couture inexistante, quand c'est LA FORME qui était
  //    illisible. Deux motifs différents pour deux erreurs différentes.
  const retroNonObjets = retroBrutes.liste.filter((r) => !estObjet(r)).length
  if (retroNonObjets) {
    alertes.push(`CRIBLE_ILLISIBLE ×${retroNonObjets} — rétrogradation(s) qui ne sont pas des `
      + 'objets ; écartée(s) du crible, valeur consignée, jamais réparée')
  }
  const retro = new Set(retroBrutes.liste.filter(estObjet).map((r) => norm(get(r, 'entre'))))

  const statuts: string[] = []
  let nRetrogradees = 0
  for (const j of ch) {
    let s = statutDe(j)
    if (s === 'motivée' && retro.has(norm(get(j, 'entre')))) {
      s = 'plaquée'
      nRetrogradees += 1
      trace.push(`crible : ${str(get(j, 'entre'))} rétrogradée en plaquée`)
    }
    statuts.push(s)
  }
  const connues = new Set(ch.map((j) => norm(get(j, 'entre'))))
  const inconnues = trie([...retro].filter((e) => !connues.has(e)))
  if (inconnues.length) {
    alertes.push(`CRIBLE_NON_APPARIE — ${str(inconnues)} ne correspond à `
      + 'aucune charnière du squelette ; rétrogradation ignorée')
  }

  const n = statuts.length
  const bas = statuts.filter((s) => s === 'absente' || s === 'plaquée').length
  const mot = statuts.filter((s) => s === 'motivée').length
  const fini = (base: string): SortieCohesion =>
    ({ base, alertes, trace, statutsCharnieres: statuts, nRetrogradees })

  if (n === 0) {
    // § 2c — jugement sur le tissu seul. Plafond : « au mieux satisfaite ».
    trace.push('aucune charnière : jugement sur le tissu seul (§ 2c)')
    if (!ti.length) {
      // A9 — la copie d'un seul tenant. « La règle "toutes les charnières sont
      // absentes → défaillance forte" lit une architecture qui n'est nulle part
      // sur la page ; une copie sans aucune couture est le cas limite de la même
      // lecture, pas un cas indéterminé. »
      alertes.push(
        'COPIE_SANS_COUTURE — aucune couture : l\'architecture n\'est pas '
        + 'observable sur la page, lue comme défaillance forte (A9). '
        + 'RÉSERVE DÉCLARÉE : une copie saisie sans retour à la ligne est '
        + 'pénalisée pour un fait de mise en page ; le dispositif mesure '
        + 'l\'architecture TELLE QU\'ELLE EST ÉCRITE, et ne peut pas voir '
        + 'une articulation interne à un bloc unique.')
      trace.push('aucune couture d\'aucune sorte → défaillance forte (A9)')
      return fini('défaillance forte')
    }
    const base = faits.tissu_oui > faits.tissu_non ? 'satisfaite' : 'défaillance'
    if (base === 'satisfaite') {
      // A2 différé : on ne plafonne pas en silence.
      alertes.push('TROU_DECLARE_ACQUIS — sans charnière, le § 2c plafonne '
        + 'la cohésion à « satisfaite » ; le haut niveau, donc '
        + 'Acquis, est inatteignable. Arbitrage différé.')
    }
    trace.push(`tissu ${faits.tissu_oui} oui / ${faits.tissu_non} non → ${base}`)
    return fini(base)
  }

  // § 2a, sérialisé (A6).
  let base: string
  if (statuts.every((s) => s === 'absente')) {
    base = 'défaillance forte'
    trace.push(`les ${n} charnières sont absentes → défaillance forte`)
  } else if (bas > n / 2) {
    base = 'défaillance'
    trace.push(`${bas}/${n} charnières absentes ou plaquées → défaillance`)
  } else if (mot > n / 2) {
    // ⚠️ `jugements.get("gabarit_repete", True)` — le DÉFAUT EST `True` ici, et
    //    ABSENT trois lignes plus bas. L'asymétrie est celle du module : un
    //    gabarit non jugé ferme le haut niveau, et se lit « majorité seulement ».
    const repete = 'gabarit_repete' in jugements ? jugements.gabarit_repete : true
    if (mot === n && n >= 2 && !estVrai(repete)) {
      base = 'haut'
      trace.push(`les ${n} charnières sont motivées et non mécaniques → haut`)
    } else {
      base = 'satisfaite'
      const motif = n < 2 ? 'une seule charnière'
        : estVrai(jugements.gabarit_repete) ? 'gabarit répété'
          : 'majorité seulement'
      trace.push(`${mot}/${n} charnières motivées (${motif}) → satisfaite`)
    }
  } else {
    base = 'défaillance'                              // A6 : égalité → borne basse
    trace.push(`charnières à égalité (${bas} contre ${mot}) → borne basse, `
      + 'défaillance')
  }

  // § 2b, modulation par le tissu : un cran au maximum, saturant (A6).
  if (!ti.length) {
    trace.push('aucune jointure de tissu → aucune modulation (A6)')
    return fini(base)
  }
  const oui = faits.tissu_oui
  const non = faits.tissu_non
  const i = (COHESION as readonly string[]).indexOf(base)
  if (non > oui) {
    // A7 — « un modulateur ne change pas le signe », or `satisfaite` EST la
    // frontière du signe. Un `haut` redescend donc à `satisfaite`, jamais plus
    // bas (RF13 : le garde était écrit `>=`, ce qui protégeait aussi `haut`).
    if (i === (COHESION as readonly string[]).indexOf('satisfaite')) {
      trace.push(`tissu ${oui} oui / ${non} non → aucun abaissement : les `
        + `charnières ont rendu « ${base} » (A7)`)
    } else {
      const k = Math.max(0, i - 1)
      trace.push(`tissu ${oui} oui / ${non} non → `
        + (k === i ? 'déjà au plancher' : 'abaissé d\'un cran'))
      base = COHESION[k]
    }
  } else if (oui > non) {
    // « relève UNIQUEMENT une défaillance dont les charnières sont plaquées
    // (pas absentes) » — lecture universelle : aucune ne doit être absente.
    if (base === 'défaillance' && !statuts.includes('absente')) {
      base = COHESION[i + 1]
      trace.push(`tissu ${oui} oui / ${non} non, charnières plaquées → `
        + 'relevé d\'un cran')
    } else {
      trace.push(`tissu ${oui} oui / ${non} non → relèvement non applicable`)
    }
  } else {
    trace.push(`tissu à égalité (${oui} contre ${non}) → aucune modulation (A6)`)
  }
  return fini(base)
}

// ════════════════════════════════════════════════════════════════════════════
// COHÉRENCE GLOBALE (§ 3 du module ; fiche §4, point 5) — arbitrage A1
// ════════════════════════════════════════════════════════════════════════════

/**
 * Sentinelle INTERNE au portage, comme `PassageManque` l'est au module. « Elle
 * ne franchit jamais `code2` : le contrat interdit qu'une exception traverse le
 * banc — elle emporterait la trace. »
 */
class PassageManque extends Error {}

interface SortieCoherence {
  base: string
  route: string
  alertes: string[]
  trace: string[]
  /** Ce que la clause d'ordre a rendu — `null` quand elle ne s'applique pas. */
  ordreDesEtapes: boolean | null
}

function coherenceGlobale(faits: Faits, jugements: Objet): SortieCoherence {
  const alertes: string[] = []
  const trace: string[] = []
  const distinctsBruts = elements(jugements.blocs_objets_distincts)
  if (distinctsBruts.illisible) {
    // ⚠️ PORTAGE — `for x in 3` lève.
    alertes.push('OBJETS_DISTINCTS_ILLISIBLES — « blocs_objets_distincts » n\'est ni une liste '
      + 'ni un texte ; aucun bloc retenu, valeur consignée, jamais réparée')
  }
  const distincts = distinctsBruts.liste.map((x) => str(x))
  const valides = distincts.filter((b) => faits.num_dev_idee.includes(b))
  const ecartes = distincts.filter((b) => !faits.num_dev_idee.includes(b))
  if (ecartes.length) {
    alertes.push(`OBJETS_DISTINCTS_HORS_PERIMETRE — ${str(ecartes)} n'est pas un `
      + 'bloc de développement à idée directrice ; écarté')
  }

  // « Le silence du juge ne vaut jamais acquiescement » (`CONTRAT-MODULES.md`
  // §3). `bool(get(…))` rendait ABSENT et False indistinguables — une sortie P2
  // tronquée affirmait implicitement « pas de doublon, pas de retour » — et
  // acceptait la chaîne "false" comme vraie (RM5).
  const manquants = ['doublon', 'retour_en_arriere']
    .filter((c) => typeof jugements[c] !== 'boolean')
  if (manquants.length) {
    throw new PassageManque(
      'PASSAGE MANQUÉ — jugement(s) obligatoire(s) absent(s) ou non '
      + `booléen(s) : ${manquants.join(', ')}. Aucun verdict n'est composé sur une sortie `
      + 'tronquée (CONTRAT-MODULES.md §3).')
  }
  const doublon = jugements.doublon as boolean
  const retour = jugements.retour_en_arriere as boolean
  const socle = valides.length >= 2 && !doublon && !retour
  trace.push(`${valides.length} bloc(s) de développement à idée directrice et `
    + `objets distincts ; doublon=${str(doublon)} ; retour=${str(retour)}`)

  // A1 — les deux routes partagent le socle ; l'ordre des étapes est une clause
  // CONDITIONNELLE, qui ne s'applique que s'il y a une annonce.
  //
  // ⚠️⚠️ ET C'EST ICI QUE PORTER RETIRE UNE RÉPARATION. Le P2 de la fiche ouvre
  //    la route de la promesse sur « problème ET/OU plan annoncés » ; les deux
  //    modèles la lisaient comme exigeant un plan, et « réparaient le et/ou sans
  //    le dire » — 103 cellules sur 118 formellement ouvertes, ZÉRO prise. Le
  //    code applique le texte : `a_probleme OU a_annonce`. La route ouverte est
  //    PLUS FACILE — sa clause « étapes réalisées dans l'ordre » devient vide
  //    sans annonce —, et sur une copie faible cela donne `satisfaite` au lieu de
  //    `défaillance forte`. *L'écart est nommé, mesuré, et il ne se corrige pas
  //    ici : la fiche fait foi.*
  const route = (faits.a_probleme || faits.a_annonce) ? 'promesse' : 'de fait'
  let tenue = socle
  let ordreDesEtapes: boolean | null = null
  if (faits.a_annonce && faits.n_etapes) {
    let ordre = jugements.etapes_realisees_dans_lordre
    if (ordre === null || ordre === undefined) {
      alertes.push('ETAPES_NON_JUGEES — une annonce existe mais P2 n\'a pas '
        + 'répondu sur l\'ordre des étapes ; clause tenue pour non')
      ordre = false
    }
    tenue = tenue && estVrai(ordre)
    ordreDesEtapes = estVrai(ordre)
    trace.push(`annonce de ${faits.n_etapes} étape(s), réalisées dans `
      + `l'ordre : ${str(ordre)}`)
  } else if (faits.a_annonce) {
    alertes.push('ANNONCE_SANS_ETAPES — P1 cite une annonce sans en extraire '
      + 'd\'étapes ; la clause d\'ordre ne s\'applique pas')
  }

  const fini = (base: string, r: string): SortieCoherence =>
    ({ base, route: r, alertes, trace, ordreDesEtapes })

  if (tenue) {
    if (estVrai(jugements.ordre_necessaire) && (faits.a_probleme || faits.a_annonce)) {
      trace.push('promesse tenue et ordre nécessaire → haut')
      return fini('haut', route)
    }
    trace.push(`route « ${route} » tenue → satisfaite`)
    return fini('satisfaite', route)
  }

  const sansIdee = faits.dev.length - faits.dev_idee.length
  if (!faits.a_probleme && !faits.a_annonce
    && faits.dev.length && sansIdee > faits.dev.length / 2) {
    trace.push(`aucune promesse et ${sansIdee}/${faits.dev.length} blocs de `
      + 'développement sans idée directrice → défaillance forte')
    return fini('défaillance forte', 'aucune')
  }
  trace.push(`route « ${route} » non tenue → défaillance`)
  return fini('défaillance', route)
}

// ════════════════════════════════════════════════════════════════════════════
// CROISEMENT (§ 4 du module ; fiche §4, points 6 et 7) — A3, A3′, A4
// ════════════════════════════════════════════════════════════════════════════

function croisement(cl: string | null, cg: string | null, faits: Faits): {
  niveau: string | null; profil: string | null; alertes: string[]; trace: string[]
} {
  const alertes: string[] = []
  const trace: string[] = []
  if (cl === null || cg === null) {
    return { niveau: null, profil: null, trace, alertes: ['CROISEMENT_IMPOSSIBLE — une dimension manque'] }
  }
  const a = (COHESION as readonly string[]).indexOf(cl)
  const b = (COHESION as readonly string[]).indexOf(cg)
  const enDefaut = (x: number) => x <= 1                 // DF ou D (A3)

  let niveau: string
  if (enDefaut(a) && enDefaut(b)) {
    if (a === 0 && b === 0) {
      niveau = 'Absent'
      trace.push('les deux dimensions au plus bas → Absent')
    } else {
      niveau = 'Faible'                                  // A4
      trace.push('une dimension au plus bas, l\'autre juste au-dessus → '
        + 'Faible (A4)')
    }
  } else if (enDefaut(a) || enDefaut(b)) {
    niveau = 'Moyen'                                     // A3
    trace.push('une seule dimension en défaut → Moyen (A3)')
  } else if (a === 3 && b === 3) {
    niveau = 'Acquis'
    trace.push('les deux dimensions au haut niveau → Acquis')
  } else {
    niveau = 'Bon'                                       // A3′
    trace.push('les deux dimensions satisfaites ou mieux, sans être toutes '
      + 'deux au haut niveau → Bon (A3′)')
  }

  // Garde-fou : « une question posée quelque part, OU une seule idée directrice
  // énoncée, suffit à exclure Absent ». Lecture STRICTE de « question » : le
  // champ `probleme_forme`, et non un point d'interrogation trouvé n'importe où.
  if (niveau === 'Absent') {
    const q = norm(faits.probleme_forme).startsWith('question')
    if (q || faits.dev_idee.length) {
      niveau = 'Faible'
      alertes.push('GARDE_FOU_ABSENT — une question posée ou une idée '
        + 'directrice énoncée exclut Absent ; rabattu sur Faible')
      trace.push('garde-fou → Faible')
    }
  }

  let profil = 'n/a'          // non applicable hors Moyen (CONTRAT §3)
  if (niveau === 'Moyen') profil = a < b ? 'global-ok-local-ko' : 'local-ok-global-ko'
  return { niveau, profil, alertes, trace }
}

// ════════════════════════════════════════════════════════════════════════════
// RECETTE — le modèle a-t-il produit ce qu'il ne doit plus produire ?
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️⚠️ LES DEUX MOTIFS SONT UNICODE EN PYTHON, ET C'EST LE PIÈGE LE PLUS CHER
 *    DE CE PORTAGE. Le `\w` de Python couvre les lettres accentuées ; celui de
 *    JavaScript ne connaît que l'ASCII. Vérifié en Python :
 *
 *      « la 3ème partie » → AUCUNE alerte (le `è` ferme l'anti-regard) ;
 *      « café3 »          → AUCUNE alerte (le `é` ferme l'anti-regard-arrière).
 *
 *    Portés naïvement, les deux LÈVERAIENT une alerte RECETTE — et « 3ème » est
 *    la chose la plus ordinaire qu'un juge puisse écrire en français. Le portage
 *    aurait accusé le modèle d'avoir compté, à chaque copie qui l'écrit.
 */
const RE_RENVOI_PARA = new RegExp(
  `¶[${CAR_BLANC_PYTHON}]*${CAR_CHIFFRE_PYTHON}+`
  + `([${CAR_BLANC_PYTHON}]*(?:[-–—/,]|à|→|et|puis)[${CAR_BLANC_PYTHON}]*`
  + `¶?[${CAR_BLANC_PYTHON}]*${CAR_CHIFFRE_PYTHON}+)*`, 'gu')
const RE_DECOMPTE = new RegExp(
  `(?<![${CAR_MOT_PYTHON}/.,-])${CAR_CHIFFRE_PYTHON}{1,3}(?![${CAR_MOT_PYTHON}/,-])`, 'u')

function recette(jugements: Objet): string[] {
  const a: string[] = []
  for (const k of INTERDITS) {
    if (k in jugements) {
      a.push(`RECETTE — P2 a rendu « ${k} » : ce champ appartient au code`)
    }
  }
  for (const champ of ['justification_ancree', 'ce_qui_plafonne', 'levier']) {
    // `str(jugements.get(champ, ""))` — une clé ABSENTE rend `""`, une clé à
    // `null` rend « None ». Les deux sont sans nombre ni niveau ; on les
    // distingue quand même, parce que Python les distingue.
    const txt = champ in jugements ? str(jugements[champ]) : ''
    const sansPara = txt.replace(RE_RENVOI_PARA, ' ')
    if (RE_DECOMPTE.test(sansPara)) {
      a.push(`RECETTE — « ${champ} » contient un nombre ; P2 ne compte pas`)
    }
    for (const niv of NIVEAUX) {
      if (motIsole(niv, txt)) {
        a.push(`RECETTE — « ${champ} » annonce le niveau « ${niv} »`)
        break
      }
    }
  }
  return a
}

// ════════════════════════════════════════════════════════════════════════════
// LE POINT D'ENTRÉE DU CALCUL — `calculer()`
// ════════════════════════════════════════════════════════════════════════════

interface Evaluation {
  niveau: string | null
  profil_moyen: string | null
  cohesion_locale: string
  coherence_globale: string
  route_globale: string
  trace: string[]
  alertes: string[]
  /** Ce que la TÉLÉMÉTRIE du §5 lit, et que le banc ne connaît pas. */
  _pourTelemetrie: {
    faits: Faits
    statutsCharnieres: string[]
    nRetrogradees: number
    ordreDesEtapes: boolean | null
  }
}

function calculer(squelette: unknown, jugements: Objet): Evaluation {
  const { faits, alertes: alertesSq } = lireLeSquelette(squelette)
  const alertes = [...alertesSq, ...recette(jugements)]

  const cl = cohesionLocale(faits, jugements)
  const cg = coherenceGlobale(faits, jugements)
  const cr = croisement(cl.base, cg.base, faits)

  return {
    niveau: cr.niveau,
    profil_moyen: cr.profil,
    cohesion_locale: cl.base,
    coherence_globale: cg.base,
    route_globale: cg.route,
    trace: [...cl.trace, ...cg.trace, ...cr.trace],
    alertes: [...alertes, ...cl.alertes, ...cg.alertes, ...cr.alertes],
    _pourTelemetrie: {
      faits,
      statutsCharnieres: cl.statutsCharnieres,
      nRetrogradees: cl.nRetrogradees,
      ordreDesEtapes: cg.ordreDesEtapes,
    },
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LES HUIT OBSERVABLES DU §5 — ce que le module ne calcule pas
// ════════════════════════════════════════════════════════════════════════════

const OBSERVABLES_TELEMETRIE = [
  'jointure_presente', 'charniere_motivee', 'charniere_formule', 'bloc_relie',
  'promesse_presente', 'plan_tenu', 'bloc_unite', 'derive',
] as const

/**
 * LES DEUX DÉNOMINATEURS, sous le NOM EXACT que la fiche leur donne.
 *
 * « `comptage rapporté` DIVISE l'entrée du même nom par le dénominateur que
 * `rapporte_a` désigne » (`observables.ts`) : le relevé porte donc, à côté des
 * comptages, une entrée par dénominateur, nommée comme la fiche l'écrit.
 *
 * ⚠️ `observables.ts` cherche l'entrée SOUS CE NOM EXACT ; il en manque une, et
 *    l'observable qui s'y rapporte sort en `n/a` SANS UN MOT.
 */
const DENOM_CHARNIERES = 'les charnières du squelette'
const DENOM_DEV = 'les blocs de développement'

/** Les quatre `proportion` du §5, avec la POPULATION que la fiche leur nomme. */
const POPULATIONS: Record<string, string> = {
  jointure_presente: 'les coutures hors seuils',
  charniere_motivee: 'les charnières',
  bloc_relie: 'le tissu',
  bloc_unite: 'les blocs de développement',
}

type ValeurReleve = number | string | boolean | null

/**
 * Les HUIT observables de télémétrie du §5, comptés APRÈS CRIBLE et APRÈS le
 * garde-fou de périmètre.
 *
 * ⭐ POURQUOI APRÈS : « la chaîne froide les dérive du RELEVÉ JUGÉ » (`07-` §2),
 *    et deux des huit le disent eux-mêmes — `charniere_motivee` est « proportion
 *    de charnières motivée, APRÈS CRIBLE », `charniere_formule` compte les
 *    charnières « rétrogradées PAR LE CRIBLE ».
 *
 * ⭐⭐ LES QUATRE POPULATIONS SONT NOMMÉES PAR LA FICHE, exclusion comprise, et
 *    il n'y a donc RIEN À ARBITRER ICI — c'est la différence avec l'Argumentation,
 *    dont la séance a dû trancher :
 *      · `jointure_presente` « proportion de coutures, HORS SEUILS » ;
 *      · `charniere_motivee` « proportion de charnières motivée, après crible » ;
 *      · `bloc_relie`        « proportion DU TISSU dont la relation est nommée » ;
 *      · `bloc_unite`        « proportion de BLOCS DE DÉVELOPPEMENT à idée
 *        directrice énoncée ».
 *    Chacune est lue telle quelle, et un test discriminant la fixe.
 *
 * ⚠️ Chaque observable a SA VALEUR, OU SON ALERTE NOMMÉE. Une entrée absente
 *    rendrait `n/a`, `n/a` sort du dénominateur du taux (`01-` §8.2), et
 *    l'escalade N1/N2 deviendrait aveugle sur cet observable POUR TOUJOURS, SANS
 *    UN SYMPTÔME.
 */
function telemetrie(
  ev: Evaluation | null, jugements: Objet, motifSansCalcul: string | null,
): { valeurs: Record<string, ValeurReleve>; alertes: string[] } {
  const valeurs: Record<string, ValeurReleve> = {}
  const alertes: string[] = []

  if (ev === null) {
    // Ni squelette ni jugements lisibles : rien ne se compte, et les HUIT le
    // disent. « Une absence délibérée se déclare ; elle ne se laisse pas tomber. »
    for (const code of OBSERVABLES_TELEMETRIE) {
      alertes.push(`${code} : ${motifSansCalcul ?? 'aucun calcul'} — valeur non déclarée `
        + '(`n/a`), jamais 0')
    }
    return { valeurs, alertes }
  }

  const { faits, statutsCharnieres, nRetrogradees, ordreDesEtapes } = ev._pourTelemetrie

  /** Une proportion, avec le refus nommé quand sa population est vide. */
  const proportion = (code: string, numerateur: number, denominateur: number) => {
    if (denominateur === 0) {
      alertes.push(`${code} : ${POPULATIONS[code]} — population vide, proportion sans `
        + 'dénominateur, valeur non déclarée (`n/a`), jamais 0')
      return
    }
    valeurs[code] = numerateur / denominateur
  }

  // Les deux dénominateurs des `comptage rapporté`. « Une quantité relevée qui
  // ne correspond à aucun observable déclaré n'est pas une erreur : le relevé
  // porte aussi les dénominateurs. »
  valeurs[DENOM_CHARNIERES] = faits.n_charnieres
  valeurs[DENOM_DEV] = faits.dev.length

  // 1. `jointure_presente` — « proportion de coutures, HORS SEUILS, qui ne sont
  //    pas vides ». Le périmètre est celui du §4 point 3, donc APRÈS le garde-fou
  //    de réintégration : quand il tombe, il ne reste plus de seuils et toutes
  //    les coutures comptent. Le statut `absente` EST le « vide » du §4 point 1,
  //    et le crible ne peut jamais y ramener une couture.
  const horsSeuils = [...faits.charnieres, ...faits.tissu]
  proportion('jointure_presente',
    horsSeuils.filter((j) => statutDe(j) !== 'absente').length, horsSeuils.length)

  // 2. `charniere_motivee` — « proportion de charnières `motivée`, APRÈS CRIBLE ».
  proportion('charniere_motivee',
    statutsCharnieres.filter((s) => s === 'motivée').length, statutsCharnieres.length)

  // 3. `charniere_formule` — `comptage rapporté` : le relevé porte LE COMPTE
  //    BRUT, la chaîne divise par « les charnières du squelette ». Ce sont les
  //    charnières que le crible a RÉELLEMENT rétrogradées — « une rétrogradation
  //    qui ne correspond à aucune charnière est consignée et ignorée » (§4-8),
  //    et elle ne compte donc pas ici non plus.
  valeurs.charniere_formule = nRetrogradees

  // 4. `bloc_relie` — « proportion DU TISSU dont la relation est nommée ».
  //    ⚠️ LA POPULATION EST LE TISSU ENTIER, et c'est ce que la fiche écrit. Le
  //    §4 point 4, lui, module sur `oui > non` et laisse dehors une relation
  //    ILLISIBLE (ni « oui… » ni « non… ») : les deux lectures se séparent sur
  //    ce seul cas — 2 oui / 1 non / 2 illisibles module vers le haut au §4 et
  //    rend 0,4 ici. *Relevé, non arbitré : la fiche nomme sa population, et une
  //    session Code ne corrige pas une source.*
  proportion('bloc_relie', faits.tissu_oui, faits.n_tissu)

  // 5. `promesse_presente` — binaire : « un problème posé, la forme faisant foi,
  //    ET/OU un plan annoncé » (§4, point 5). C'est LA ROUTE, et c'est ici que le
  //    « et/ou » que les modèles réparaient devient visible.
  valeurs.promesse_presente = (faits.a_probleme || faits.a_annonce) ? 'oui' : 'non'

  // 6. `plan_tenu` — binaire, `sans_objet_si: n/a`. « Les étapes annoncées
  //    réalisées, dans l'ordre ; `n/a` SANS ANNONCE, et n/a n'est pas 0. » La
  //    condition d'application est celle du module : une annonce ET des étapes —
  //    « P1 cite une annonce sans en extraire d'étapes → la clause ne s'applique
  //    pas ». ⚠️ Il ne rend JAMAIS `null` (`CONTRAT-MODULES.md` §3).
  valeurs.plan_tenu = ordreDesEtapes === null ? 'n/a' : (ordreDesEtapes ? 'oui' : 'non')

  // 7. `bloc_unite` — « proportion de blocs de développement à idée directrice
  //    énoncée ». Les blocs de SERVICE en sont exclus : ils « portent la
  //    promesse, mais ne sont JAMAIS retenus contre le plan » (§4, point 4 de P2).
  proportion('bloc_unite', faits.dev_idee.length, faits.dev.length)

  // 8. `derive` — `comptage rapporté` sur « les blocs de développement » :
  //    « blocs `hors annonce` + doublons + retours en arrière », et le socle du
  //    §4 point 5 « n'en tolère aucun » (`au_plus: 0`).
  //    ⚠️ P2 rend `doublon` et `retour_en_arriere` en BOOLÉENS, un par copie :
  //       chacun pèse donc au plus 1. C'est la seule lecture que sa sortie
  //       déclarée permet.
  //    ⚠️ Les blocs de SERVICE ne peuvent pas être « hors annonce » — le prompt
  //       P1 l'écrit (« service … jamais “hors annonce” ») —, et la population
  //       est de toute façon celle du dénominateur.
  const horsAnnonce = faits.dev
    .filter((b) => norm(get(b, 'correspondance_annonce')) === 'hors annonce').length
  const doublon = jugements.doublon === true ? 1 : 0
  const retour = jugements.retour_en_arriere === true ? 1 : 0
  if (typeof jugements.doublon !== 'boolean' || typeof jugements.retour_en_arriere !== 'boolean') {
    // Le passage est manqué : `derive` a besoin des deux jugements obligatoires.
    alertes.push('derive : « doublon » et « retour_en_arriere » ne sont pas rendus en booléens '
      + 'par P2 — le comptage de la dérive est incomplet, valeur non déclarée (`n/a`), jamais 0')
  } else {
    valeurs.derive = horsAnnonce + doublon + retour
  }

  // Le contrôle de complétude, et il est le cœur du « fait quand ».
  for (const code of OBSERVABLES_TELEMETRIE) {
    if (!(code in valeurs) && !alertes.some((a) => a.startsWith(`${code} :`))) {
      alertes.push(`${code} : observable du §5 NON CALCULÉ, et sans motif — c'est le trou que le `
        + 'lot existe pour fermer (`01-` §8.2 : il sortirait du dénominateur sans un symptôme)')
    }
  }
  return { valeurs, alertes }
}

// ════════════════════════════════════════════════════════════════════════════
// PREPARE_COPIE — « les lignes vides sont des frontières de blocs »
// ════════════════════════════════════════════════════════════════════════════

const RE_PARAGRAPHES = new RegExp(`\\n[${CAR_BLANC_PYTHON}]*\\n+`, 'u')

/**
 * `prepare_copie(texte, params)` — la copie numérotée `[¶1]`, `[¶2]`… Le
 * découpage est FOURNI à P1, « qui a interdiction d'en fusionner ou d'en
 * omettre » (fiche §3 ; décision run 1, D9). Copié de `numerote()` de
 * `banc-structure.py`, à l'identique.
 *
 * ⭐⭐ C4-L4 EN A PAYÉ LA PREUVE LE 22/08. « Découper sur CHAQUE ligne faisait
 *    d'un retour dur — OCR, transcription, ou simple mise en page — un
 *    paragraphe de plus, donc une couture qui n'existe pas. Deux copies du Lot1
 *    sur onze étaient concernées, dont la Copie4 : 8 blocs pour 3 paragraphes
 *    réels » (RM4). Et du côté de la chaîne, la normalisation CRLF d'un
 *    `<textarea>` faisait lire TOUTE copie en un seul bloc.
 *
 * ⭐ CE CROCHET ET `normaliserRetours()` NE SE CONTREDISENT NI NE SE DOUBLENT,
 *    vérifié : `normaliserRetours` ramène `\r\n?` à `\n` et NE NETTOIE RIEN
 *    D'AUTRE ; il tourne à l'ÉCRITURE du dépôt (`utils/deroule/depot.ts`). Ce
 *    crochet, lui, découpe et renumérote à la LECTURE. Le premier garantit au
 *    second que ses `\n` sont des `\n`.
 *    ⚠️ Une seule nuance, relevée et non corrigée : `blocs()` de
 *    `transcription-calcul.ts` — ce que l'écran compte pour l'élève — coupe sur
 *    `\n[ \t]*\n+`, quand le module coupe sur `\n\s*\n+`. Une ligne « vide »
 *    faite d'une espace insécable est donc UNE frontière ici et AUCUNE là.
 */
function prepareCopie(production: string): string {
  const paras: string[] = []
  for (const b of strip(production ?? '').split(RE_PARAGRAPHES)) {
    if (strip(b)) paras.push(strip(remplaceBlancs(b, ' ')))
  }
  return paras.map((p, i) => `[¶${i + 1}] ${p}`).join('\n\n')
}

// ════════════════════════════════════════════════════════════════════════════
// CODE1 — « du code prépare ce que P2 doit voir »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `code1(sortie_p1, contexte, params)` du module.
 *
 * Il rend le résumé mécanique du squelette — les comptes que le manifeste
 * consigne —, **par la MÊME composition que le calcul final** (`lireLeSquelette`
 * et `statutDe` : une seule source de vérité — « la leçon du `resume_squelette`
 * qui mentait », 30/07).
 *
 * ⭐ LA VUE DE P2 EST `document_p2`, ET ELLE PORTE DEUX CHAMPS DE PLUS. Le
 *    prompt P2 sélectionne les coutures à cribler sur « charniere » et
 *    « motivée » — or la fiche §3 pose que P1 NE QUALIFIE PAS. « P2 lisait donc
 *    un squelette où ces deux propriétés n'existaient nulle part : soit il ne
 *    criblait rien, soit il recomposait lui-même une règle réservée au code »
 *    (RM3). Les champs portent un nom DISTINCT de ceux que P1 pourrait déclarer
 *    — `statut` est un champ interdit —, et le relevé brut n'est pas modifié.
 *
 * ⚠️ AUCUN NOMBRE N'EST INJECTÉ DANS P2 : « le juge de Structure lit le squelette
 *    nu » (fiche §4). Il n'y a pas de densités ici ; tous les décomptes
 *    appartiennent à Code2.
 *
 * ⛔ `injection_p2` n'est PAS rendu, alors que le module le rend vide : la chaîne
 *    ne construit pas ce canal — « aucun module ne l'utilise, et on ne bâtit pas
 *    un canal sans client » (C4-L10 · Expression). Le harnais des vecteurs
 *    l'exclut donc de la comparaison.
 */
// ⚠️ `_ctx` N'EST PAS LU, ET C'EST UN CONSTAT, PAS UN OUBLI. Le module reçoit le
//    contexte et y lit la copie (`texte = contexte.get("copie") or ""`) — SANS
//    JAMAIS S'EN SERVIR : la Structure n'a AUCUN contrôle d'existence des
//    citations, alors que son P1 rend du verbatim (`texte_cite`,
//    `fin_bloc_precedent`, `debut_bloc_suivant`, `idee_directrice_citee`). Le
//    contrat §3 le rend obligatoire ; le §8 constate que « Argumentation,
//    Questionnement, Structure et Synthèse n'en ont aucun ». ⛔ Ne pas l'inventer
//    ici — c'est un `[à valider]` du contrat §8, relevé.
function code1(artefactsP1: Record<string, unknown>, _ctx: ContexteBranchement): SortieCode1 {
  // ⚠️ La chaîne range la sortie de chaque étage sous la CLÉ de la phase ; le
  //    banc, lui, passe la sortie fusionnée. La Structure n'a qu'un étage.
  const brut = artefactsP1.p1
  if (!estObjet(brut)) {
    // ⚠️ Le module rend ici `document_p2 = sortie_p1` — la valeur illisible
    //    elle-même, et non `null`. On porte ce qu'il écrit ; la chaîne refuse la
    //    mesure sur l'absence de la CLÉ, jamais sur sa valeur.
    return { mesures: {}, document_p2: brut ?? null,
      alertes: ['P1 illisible : aucun résumé mécanique'] }
  }
  const p1 = brut
  const { faits, alertes } = lireLeSquelette(p1)
  const j = elements(p1.jointures).liste

  // `classe[id(x)] = nom` — une Map par RÉFÉRENCE. Sur les valeurs primitives,
  // elle se comporte comme l'internement de Python : deux chaînes égales
  // partagent la clé des deux côtés.
  const classe = new Map<unknown, string>()
  for (const [nom, lot] of [['charniere', faits.charnieres], ['tissu', faits.tissu],
    ['seuil', faits.seuils]] as Array<[string, unknown[]]>) {
    for (const x of lot) classe.set(x, nom)
  }
  const nClassees = faits.n_charnieres + faits.n_tissu + faits.n_seuils

  // ⚠️ Les deux dictionnaires par couture sont des COMPRÉHENSIONS : une clé
  //    répétée — deux jointures au même `entre` — écrase la précédente, ici comme
  //    en Python.
  const niveauxParCouture: Record<string, string> = {}
  const statutsParCouture: Record<string, string> = {}
  for (const x of j) {
    niveauxParCouture[str(get(x, 'entre'))] = classe.get(x) ?? 'hors catalogue'
    statutsParCouture[str(get(x, 'entre'))] = statutDe(x)
  }

  const mesures = {
    n_blocs: elements(p1.blocs).liste.length,
    n_jointures: j.length,
    n_charnieres: faits.n_charnieres,
    n_tissu: faits.n_tissu,
    n_seuils: faits.n_seuils,
    tissu_oui: faits.tissu_oui,
    tissu_non: faits.tissu_non,
    garde_fou_seuils: faits.garde_fou_seuils,
    n_niveau_hors_catalogue: j.length - nClassees,
    niveaux_par_couture: niveauxParCouture,
    statuts_par_couture: statutsParCouture,
  }

  // La VUE de P2 : le squelette, PLUS les deux qualifications que le code vient
  // de composer. `dict(sortie_p1)` est une copie de surface ; `jointures` est
  // remplacé, et la clé est AJOUTÉE quand le relevé n'en portait pas.
  const vue: Objet = { ...p1 }
  vue.jointures = j.map((x) => (estObjet(x)
    ? { ...x, nature_composee: classe.get(x) ?? 'hors catalogue', statut_compose: statutDe(x) }
    : x))

  return { mesures, document_p2: vue, alertes }
}

// ════════════════════════════════════════════════════════════════════════════
// CODE2 — « du code agrège »
// ════════════════════════════════════════════════════════════════════════════

/** `OBSERVABLES` du module — ceux que le BANC compare aux golds, et eux seuls. */
const OBSERVABLES_MODULE = ['niveau', 'cohesion_locale', 'coherence_globale',
  'route_globale', 'profil_moyen'] as const

/**
 * `code2(sortie_p2, sortie_code1, params)` — les trois clés publiques, plus le
 * canal privé de la télémétrie.
 *
 * ⭐ IL REÇOIT LA SORTIE DE CODE1, et il lit son `document_p2` : c'est la VUE,
 *    donc le squelette augmenté des deux qualifications. Les recomposer dessus
 *    rend exactement les mêmes faits — `lire_squelette` lit `niveau` et `statut`,
 *    que la vue n'ajoute PAS ; elle ajoute `nature_composee` et `statut_compose`,
 *    dont le nom est distinct précisément pour cela.
 */
// ⚠️ `_ctx` n'est pas lu non plus : c'est de lui que viendraient les paramètres
//    du bloc machine, et la Structure n'en déclare AUCUN (`parametres: {}` à la
//    fiche, `PARAMS` vide au module). « Si tu te surprends à vouloir un seuil
//    réglable, c'est qu'une valeur est en dur dans le module » — la seule
//    candidate, la pondération cohérence/cohésion, est la question ouverte du §8,
//    et « le jour où elle se tranche, elle entre au bloc machine en paramètre ».
function code2(
  artefactP2: unknown, sortieCode1: SortieCode1, _ctx: ContexteBranchement,
): SortieCode2 {
  const squelette = estVrai(sortieCode1) ? sortieCode1.document_p2 : undefined
  if (!estObjet(squelette) || !estObjet(artefactP2)) {
    const motif = 'CODE2_SANS_ENTREE — squelette ou jugements illisibles : '
      + 'aucun verdict calculé'
    return {
      verdicts: Object.fromEntries(OBSERVABLES_MODULE.map((o) => [o, null])),
      trace: [],
      alertes: [motif],
      _telemetrie: telemetrie(null, {}, 'ni squelette ni jugements lisibles'),
    }
  }
  let ev: Evaluation
  try {
    ev = calculer(squelette, artefactP2)
  } catch (e) {
    if (!(e instanceof PassageManque)) throw e
    // Aucune exception ne franchit le bord du module : la forme contractuelle
    // est rendue, et le préfixe distingue cette absence de verdict d'un verdict
    // hors échelle. ⭐ La télémétrie, elle, se calcule quand même sur ce qui est
    // lisible — sinon les huit sortiraient en `n/a` sans un mot.
    const evPartielle = calculerSansCoherence(squelette, artefactP2)
    return {
      verdicts: Object.fromEntries(OBSERVABLES_MODULE.map((o) => [o, null])),
      trace: [e.message],
      alertes: [e.message],
      _telemetrie: telemetrie(evPartielle, artefactP2, null),
    }
  }
  return {
    verdicts: {
      niveau: ev.niveau,
      cohesion_locale: ev.cohesion_locale,
      coherence_globale: ev.coherence_globale,
      route_globale: ev.route_globale,
      profil_moyen: ev.profil_moyen,
    },
    trace: [...ev.trace],
    alertes: [...ev.alertes],
    // Canal PRIVÉ — le tiret bas le déclare, « sans lui une quatrième clé est une
    // violation » (`CONTRAT` §3). Il ne va pas au banc : les observables du §5
    // n'entrent dans aucun gold.
    _telemetrie: telemetrie(ev, artefactP2, null),
  }
}

/**
 * Le PASSAGE MANQUÉ ne fait pas taire la télémétrie. Sept des huit observables
 * ne dépendent d'aucun des deux jugements manquants ; les rendre serait perdre,
 * pour toujours et sans symptôme, sept signaux d'escalade sur une copie que la
 * chaîne a pourtant lue.
 *
 * ⛔ Il ne rend AUCUN verdict — c'est ce que `code2` refuse ci-dessus.
 */
function calculerSansCoherence(squelette: unknown, jugements: Objet): Evaluation {
  const { faits } = lireLeSquelette(squelette)
  const cl = cohesionLocale(faits, jugements)
  return {
    niveau: null, profil_moyen: null,
    cohesion_locale: cl.base, coherence_globale: '', route_globale: '',
    trace: [], alertes: [],
    _pourTelemetrie: {
      faits,
      statutsCharnieres: cl.statutsCharnieres,
      nRetrogradees: cl.nRetrogradees,
      // La clause d'ordre ne dépend pas des deux jugements manquants : elle se
      // relit telle que `coherence_globale` la lirait.
      ordreDesEtapes: clauseDesEtapes(faits, jugements),
    },
  }
}

/** La clause d'ordre du §4 point 5, isolée — elle ne dépend que de P1 et d'un champ. */
function clauseDesEtapes(faits: Faits, jugements: Objet): boolean | null {
  if (!faits.a_annonce || !faits.n_etapes) return null
  const ordre = jugements.etapes_realisees_dans_lordre
  if (ordre === null || ordre === undefined) return false
  return estVrai(ordre)
}

// ════════════════════════════════════════════════════════════════════════════
// CONFORMITE — « l'erreur stable, que ni réplicats ni 5×5 ne voient »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `conformite(sortie_p1, sortie_p2, sortie_code1, sortie_code2, params)`.
 *
 * Deux contrôles, et ils ont l'un et l'autre une vérité MÉCANIQUE :
 *
 *   1. chaque jugement par couture vise-t-il une couture QUI EXISTE dans le
 *      squelette — « un jugement sur ¶4 → ¶5 quand le squelette s'arrête à ¶4 est
 *      une invention », la classe d'erreur mesurée le 30/07 ;
 *   2. les alertes RECETTE de l'agrégation — P2 qui rend du calculé — sont
 *      re-signalées AU NIVEAU DU PASSAGE.
 *
 * ⚠️ Il tourne À CHAQUE PASSAGE, d'office : « un contrôle qu'on n'appelle pas est
 *    un contrôle qui n'existe pas. » Ses alertes rejoignent celles de `code2`.
 *
 * ⚠️ Le crochet reçoit quatre artefacts et celui-ci en lit TROIS : il n'a pas de
 *    canal `_audit`, parce qu'il ne recopie aucun état structuré que `code2`
 *    aurait calculé — il relit les alertes RECETTE, qui sont du texte.
 */
const CHAMPS_PAR_COUTURE = ['charnieres', 'tissu', 'coutures', 'jugements_par_couture'] as const

function conformite(
  artefactsP1: Record<string, unknown>, artefactP2: unknown,
  _sortieCode1: SortieCode1, sortieCode2: SortieCode2,
): string[] {
  const alertes: string[] = []
  const p1 = artefactsP1.p1
  if (estObjet(p1) && estObjet(artefactP2)) {
    const coutures = new Set(elements(p1.jointures).liste.map((x) => str(get(x, 'entre'))))
    for (const champ of CHAMPS_PAR_COUTURE) {
      const bloc = artefactP2[champ]
      if (estObjet(bloc)) {
        for (const cle of Object.keys(bloc)) {
          if (coutures.size && !coutures.has(str(cle))) {
            alertes.push(`CONFORMITE — jugement « ${champ}/${cle} » : `
              + 'cette couture n\'existe pas dans le squelette')
          }
        }
      } else if (Array.isArray(bloc)) {
        for (const x of bloc) {
          const entre = get(x, 'entre')
          if (estObjet(x) && entre !== null && entre !== undefined
            && coutures.size && !coutures.has(str(entre))) {
            alertes.push(`CONFORMITE — jugement « ${champ}/`
              + `${str(entre)} » : cette couture `
              + 'n\'existe pas dans le squelette')
          }
        }
      }
    }
  }
  for (const a of elements(estVrai(sortieCode2) ? sortieCode2.alertes : undefined).liste) {
    if (str(a).includes('RECETTE')) alertes.push(`CONFORMITE — ${str(a)}`)
  }
  return alertes
}

// ════════════════════════════════════════════════════════════════════════════
// LE BRANCHEMENT
// ════════════════════════════════════════════════════════════════════════════

export const BRANCHEMENT_STRUCTURE: BranchementCompetence = {
  /**
   * ⛔⛔ C5-L3 — `composer` SEUL, ET C'EST CE COUPLE-CI QUI A ÉTÉ EXERCÉ POUR DE
   *    VRAI. `competences_modes_admis` admet la Structure en `composer` et en
   *    `expliquer` ; **son instrument ne couvre que le premier.** La traversée
   *    de recette de `C5-L2`, le 27/08, a fait mesurer `structure` en
   *    `expliquer` **par l'instrument de COMPOSITION**, jusqu'à la mesure écrite
   *    en base — décor retiré depuis. *Le défaut n'est pas déduit : il a une
   *    trace, une date et un témoin.*
   *
   * ⛔ RIEN DE MACHINE NE PORTE SA GRILLE RÉCEPTIVE. Aucun marqueur de prompt
   *    réceptif ; le volet `squelette.catalogue` ne déclare que `roles`,
   *    `gestes`, `probleme_forme`, `statuts_composes`, `natures_couture` —
   *    **tous de composition** — et ni `decoupage_present`, ni
   *    `decoupage_conforme`, ni `fonction_moments` n'y figurent ; l'étape de
   *    notation réceptive est déclarée inactive.
   *
   * ⚠️ ET SA FICHE DIT LE CONTRAIRE — c'est la dette `D9`. Le §3, sous « La
   *    grille réceptive — mode `expliquer` », affirme que « le bloc machine — le
   *    volet `squelette` déclare les listes fermées de cette grille ». **Il ne
   *    les déclare pas.** La formulation juste est celle de l'Argumentation, qui
   *    dit exactement l'inverse pour la même situation. *Marquée `[faux]`, non
   *    corrigée : le `03-` et les fiches sont GELÉS.*
   *
   * ⭐ Cette ligne passera à `['composer', 'expliquer']` quand le banc lecture
   *    aura validé l'étape de notation réceptive, et pas avant.
   */
  modesCouverts: ['composer'],
  /**
   * ⭐ LA STRUCTURE EST LA SEULE DES SIX À DÉFINIR `prepare_copie`, et le contrat
   *    dit pourquoi : « les lignes vides sont des frontières de blocs ». C'est
   *    ce texte-là — numéroté `[¶1]`, `[¶2]`… — que le slot `{copie}` reçoit, et
   *    ce sont ces numéros que TOUT le relevé désigne.
   */
  prepareCopie: (production) => prepareCopie(production),

  /**
   * UN SEUL APPEL D'EXTRACTION. Ses deux slots — `{sujet}` et `{copie}` — sont
   * NATIFS : ils viennent du contexte de l'exercice, aucun crochet pré-phase ne
   * les sert. ⭐ `{sujet}` EST LA CONSIGNE INSTANCIÉE : la table `exercices`
   * porte la consigne, jamais le texte d'un sujet distinct (`07-` §1.1).
   */
  extractions: () => [{
    cle: 'p1',
    tetePrompt: 'P1',
    slotsFournis: [],
  }],

  /**
   * Un seul slot au prompt P2 — `{squelette_phase_1}` : c'est le document, sans
   * déclaration. Le juge lit LE SQUELETTE NU, augmenté des deux qualifications
   * composées, et jamais la copie : « tu n'as pas la copie originale et tu n'en
   * as pas besoin […] c'est normal et voulu » (fiche §7).
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
    const t = estObjet(c2._telemetrie)
      ? c2._telemetrie as { valeurs: Record<string, ValeurReleve>; alertes: string[] }
      : null
    // « Ce qui récapitule RECOPIE la trace, il ne la recalcule jamais » (§3).
    if (!t) {
      return { releve: {},
        alertes: ['les observables de télémétrie ne sont pas parvenus de Code2 — les huit du §5 '
          + 'sortiraient en `n/a`'] }
    }
    return { releve: t.valeurs, alertes: t.alertes }
  },

  /**
   * ⛔ `delta` N'EST PAS DÉCLARÉ, ET C'EST UNE ABSENCE MOTIVÉE.
   *
   * « Ce que "comparer deux squelettes" veut dire dépend de la grille : la source
   * ne le définit pas hors de la fiche, donc le branchement le porte » — or LA
   * FICHE DE LA STRUCTURE NE LE DÉFINIT NULLE PART. Ni son §3, ni son §4, ni son
   * §5, ni son bloc machine ne disent ce que comparer un squelette de v1 à un
   * squelette de version finale veut dire pour elle.
   *
   * ⚠️⚠️ ET ELLE VA PLUS LOIN QUE LES DEUX PRÉCÉDENTES : elle est la première des
   *    trois à NOMMER le delta — son §8 propose « les deltas v1→vf » comme
   *    arbitre empirique de la pondération cohérence/cohésion, la seule vraie
   *    question ouverte de la fiche. Elle COMPTE donc sur une grandeur qu'elle ne
   *    définit pas, et que rien ne calcule. *Relevé ; l'inventer ici serait
   *    trancher une règle de grille depuis le code, ce qu'aucun lot ne fait.*
   *
   * La chaîne le dit alors par une alerte et laisse NULL. ⚠️ ET NULL N'EST PAS 0 :
   * une passation en classe n'a pas de version finale.
   */
}

// Exportés pour le test du portage — jamais pour la chaîne, qui ne connaît que
// `BRANCHEMENT_STRUCTURE`. Les fonctions internes, elles, restent internes : ce
// qui se compare au module se compare PAR LES CROCHETS, comme le banc le fait.
export { OBSERVABLES_TELEMETRIE, OBSERVABLES_MODULE, DENOM_CHARNIERES, DENOM_DEV, CATALOGUE }
