// ============================================================================
// C4 · L10 — LE BRANCHEMENT DE L'ARGUMENTATION. Tout le calcul, aucun jugement.
// ----------------------------------------------------------------------------
// EXTRACTION, PAS RÉGÉNÉRATION. Ce fichier est le portage, fonction pour
// fonction, de `copies-tests/argumentation/code.py` (dépôt de conception, v0.3).
// Il encode LES CINQ ARBITRAGES DE MÉCANISATION validés par Louis, déclarés en
// tête du module et repris en garde-fous nommés au bloc machine de la fiche :
// « le régénérer depuis la fiche les jetterait » (`CONTRAT-MODULES.md` §7).
//
//   La table d'extraction, suivie à la lettre :
//     code1      ← `code1`            (lecture du squelette, listes fermées, bruts)
//     code2      ← `_applique_crible` + `_resout_limites` + `code2`
//     conformite ← `conformite`       (P2 qui déborde de sa sortie déclarée)
//
// ⚠️ LA FICHE FAIT FOI POUR LA RÈGLE, LE MODULE POUR LE CALCUL. Lire la fiche
//    pour comprendre (`competences/argumentation.md` : §3 le squelette, §4 les
//    règles de notation et le bloc machine, §5 les observables) ; lire le module
//    pour porter. Là où les deux se rencontrent — le crible, la borne basse, la
//    règle d'agrégation, les huit garde-fous —, ils disent la même chose, et le
//    module la dit en code.
//
// ⭐ CE QUE LE PORTAGE AJOUTE, ET QUI N'EST PAS DANS LE MODULE : les NEUF
//    OBSERVABLES DE TÉLÉMÉTRIE du §5 de la fiche. Ce ne sont pas les
//    `OBSERVABLES` du module — ceux-là (`niveau`, `palier_base`,
//    `seuil_franchi`) sont ce que le BANC compare aux golds, et les deux
//    ensembles n'ont pas un seul élément commun. Le `03-` §1, gelé, dit qui les
//    applique : « il n'est pas appliqué par le module mais par LA CHAÎNE
//    FROIDE ». Porter le module est la moitié du travail ; l'autre moitié ne se
//    voit pas.
//
// ⛔ AUCUN SEUIL EN DUR pour la télémétrie : les seuils de réussite vivent au
//    bloc machine de la fiche, l'instrument dérivé les porte, et `observables.ts`
//    lit le verdict contre eux. Ici, on rend des VALEURS. *L'Argumentation ne
//    déclare d'ailleurs AUCUN paramètre — `parametres: {}` à la fiche, `PARAMS`
//    vide au module : si un seuil réglable manquait, c'est qu'une valeur est en
//    dur dans le module, et cela se relève.*
//
// ⚠️ CE QUE LE PORTAGE DURCIT, ET POURQUOI. Le module lève une exception sur
//    quelques formes que P2 ou P1 peuvent prendre et qu'il n'attend pas (un
//    `crible` qui n'est pas un objet, une requalification qui est une chaîne, une
//    thèse numérique). Le contrat §3 l'interdit — « le module ne lève jamais
//    d'exception : elle traverserait le banc et emporterait la trace avec elle »
//    — et prescrit l'inverse : « une valeur illisible rend une alerte, pas une
//    valeur par défaut ». Chaque durcissement est marqué ⚠️ PORTAGE ci-dessous,
//    ne se déclenche sur AUCUN vecteur du module, et rend une alerte nommée.
// ============================================================================

import { casefold, motIsole, repr, str } from '../python'
import type {
  BranchementCompetence, ContexteBranchement, SortieCode1, SortieCode2,
} from '../instruments'

// ── Les constantes du module, à l'identique ────────────────────────────────

/** `CATALOGUE` — les listes fermées du volet `squelette` du bloc machine. */
const CATALOGUE = {
  statuts_lien: ['absent', 'circulaire', 'implicite', 'explicite', 'limite'],
  statuts_apres_crible: ['absent', 'circulaire', 'cosmetique', 'implicite', 'explicite'],
  traitements_objection: ['réfutée', 'portée nuancée', 'évoquée sans réponse', 'aucune'],
  tests_crible: ['distinction', 'source', 'sens', 'contour'],
  marques_termes: ['ambigu', 'vague'],
} as const

/** L'ordre du plus faible au plus fort — la borne basse des « limite » le lit. */
const ORDRE_STATUTS = ['absent', 'circulaire', 'implicite', 'explicite'] as const
const ECHELLE_PALIERS = ['Absent', 'Faible', 'Moyen', 'Bon'] as const

/** `cosmetique` et `implicite` partagent Moyen — d'où la majorité PAR PALIER. */
const PALIER_PAR_STATUT: Record<string, string> = {
  absent: 'Absent', circulaire: 'Faible', cosmetique: 'Moyen',
  implicite: 'Moyen', explicite: 'Bon',
}

/** test → [statuts sur lesquels il mord, statut d'arrivée]. */
const TESTS_CRIBLE: Record<string, [readonly string[], string]> = {
  distinction: [['explicite'], 'implicite'],
  source: [['explicite', 'implicite'], 'cosmetique'],
}
/**
 * Les deux tests de TERMES ne rétrogradent rien : ils MARQUENT l'unité et
 * ferment le seuil (fiche §4, « les deux derniers tests ferment le seuil, ils ne
 * rétrogradent rien » — acté). Même régime que le crible du Questionnement.
 */
const TESTS_TERMES: Record<string, [readonly string[], string]> = {
  sens: [['explicite'], 'ambigu'],
  contour: [['explicite'], 'vague'],
}
const TOUS_TESTS: Record<string, [readonly string[], string]> = { ...TESTS_CRIBLE, ...TESTS_TERMES }
/** L'inverse, pour le repli de l'arbitrage 4 : un `vers` ne vient que d'un test. */
const TEST_PAR_VERS: Record<string, string> = Object.fromEntries(
  Object.entries(TOUS_TESTS).map(([nom, [, vers]]) => [vers, nom]),
)
/** L'ORDRE des passes — arbitrage 5 : une unité peut être circulaire ET cosmétique. */
const ORDRE_DES_TESTS = ['distinction', 'source', 'sens', 'contour'] as const

const TRAITEMENTS_SEUIL = ['réfutée', 'portée nuancée']
const MARQUE_ABSENT = '[absent]'

/** `00-referentiel.md` §2 — la triple nomenclature, dans l'ordre du §2 de la fiche. */
const LETTRE_DU_NIVEAU: Record<string, string> = {
  Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
}

// ── Les outils du module ───────────────────────────────────────────────────

type Objet = Record<string, unknown>

function estObjet(v: unknown): v is Objet {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** ⚠️ PORTAGE — le module ferait `dict(r)` et lèverait sur autre chose. */
function objetOuVide(v: unknown): Objet {
  return estObjet(v) ? v : {}
}

/**
 * `_norm` — `re.sub(r"\s+", " ", s or "").strip().casefold()`.
 *
 * ⚠️ `casefold` et non `toLowerCase` : voir `../python`. ⚠️ PORTAGE — le module
 *    lèverait sur une valeur non textuelle ; ici elle rend `''`, donc elle ne
 *    s'apparie à rien, et l'appariement raté dit son alerte.
 */
function norm(s: unknown): string {
  if (typeof s !== 'string') return ''
  return casefold(s.replace(/\s+/g, ' ').trim())
}

/** `_garant_vide` — vide après `strip`, ou la marque littérale `[absent]`. */
function garantVide(garant: unknown): boolean {
  const g = (typeof garant === 'string' ? garant : '').trim()
  return !g || g === MARQUE_ABSENT
}

/** `in TOUS_TESTS` de Python : seules des chaînes peuvent être des clés. */
function testConnu(v: unknown): v is string {
  return typeof v === 'string' && v in TOUS_TESTS
}

// ════════════════════════════════════════════════════════════════════════════
// CODE1 — « du code prépare ce que P2 doit voir »
// ════════════════════════════════════════════════════════════════════════════

/** Une unité, telle que `mesures` la porte — et telle que le crible la mute. */
interface Unite {
  rang: number
  these: unknown
  statut: string | null
  note: unknown
  marques?: string[]
  requalifiee?: string[]
}

/**
 * `code1(sortie_p1, contexte, params)` du module.
 *
 * Il lit le squelette, valide contre les listes fermées et compte les bruts —
 * **sans rien injecter dans P2** : il n'y a pas de densités ici, tous les
 * décomptes appartiennent à Code2 (fiche §4).
 *
 * ⭐ `document_p2` EST LE RELEVÉ TEL QUEL, et c'est un précédent, pas une
 *    précaution : `code1` a rendu sa sortie SANS cette clé sur cette compétence,
 *    le juge a jugé à vide, « les verdicts sont sortis, l'autotest était vert et
 *    la trace était propre » (`CONTRAT-MODULES.md` §2). Le module le corrige en
 *    commentaire (« RM2 — le juge recevait "null" ») et le porte ; ce fichier
 *    aussi, et un test échoue si la clé disparaît. ⚠️ Sa VALEUR peut être nulle
 *    — un relevé illisible n'a pas de document — ; c'est l'ABSENCE DE LA CLÉ qui
 *    est l'erreur.
 *
 * ⚠️ `mesures.unites` JETTE `garant_cite` : le module n'en a plus besoin après
 *    le comptage. La TÉLÉMÉTRIE, elle, en a besoin — `garant_present` se lit
 *    dessus —, et elle le relit sur `document_p2`, qui est le relevé entier.
 *
 * ⛔ `injection_p2` n'est PAS rendu ici, alors que le module le rend vide : la
 *    chaîne ne construit pas ce canal — « aucun module ne l'utilise, et on ne
 *    bâtit pas un canal sans client » (C4-L10 · Expression). Le harnais des
 *    vecteurs l'exclut donc de la comparaison, comme il le fait pour l'Expression.
 */
// ⚠️ `_ctx` N'EST PAS LU, ET C'EST UN CONSTAT, PAS UN OUBLI. Le module reçoit le
//    contexte (`code1(sortie_p1, contexte, params)`) et y lit la copie… sans
//    jamais s'en servir : l'Argumentation n'a AUCUN contrôle d'existence des
//    citations, alors que son P1 rend du verbatim (`garant_cite`). Le contrat §3
//    le rend obligatoire ; deux modules sur six le portent, et pas celui-ci.
//    ⛔ Ne pas l'inventer ici — c'est un `[à valider]` du contrat §8, relevé.
function code1(artefactsP1: Record<string, unknown>, _ctx: ContexteBranchement): SortieCode1 {
  // ⚠️ La chaîne range la sortie de chaque étage sous la CLÉ de la phase ; le
  //    banc, lui, passe la sortie fusionnée. L'Argumentation n'a qu'un étage.
  const brut = artefactsP1.p1
  const alertes: string[] = []
  if (!estObjet(brut)) {
    return { mesures: {}, document_p2: null, alertes: ['P1 illisible : aucun document pour P2'] }
  }
  const p1 = brut

  // Le module fait `list(p1.get("unites") or [])`. ⚠️ PORTAGE — une valeur non
  // itérable en liste lèverait ; ici elle rend une liste vide ET son alerte.
  const unitesBrutes = Array.isArray(p1.unites) ? p1.unites : []
  if (p1.unites != null && !Array.isArray(p1.unites)) {
    alertes.push('relevé : `unites` n\'est pas une liste — aucune unité au décompte, '
      + 'valeur illisible consignée, jamais réparée')
  }
  const objectionsBrutes = Array.isArray(p1.objections) ? p1.objections : []
  if (p1.objections != null && !Array.isArray(p1.objections)) {
    alertes.push('relevé : `objections` n\'est pas une liste — aucun traitement consigné, '
      + 'le seuil reste fermé')
  }

  const unites: Unite[] = []
  for (let k = 0; k < unitesBrutes.length; k += 1) {
    const i = k + 1
    const u = objetOuVide(unitesBrutes[k])
    let statut = u.statut_du_lien as string | null | undefined
    const garant = (u.garant_cite as unknown) ?? ''
    if (typeof statut !== 'string' || !(CATALOGUE.statuts_lien as readonly string[]).includes(statut)) {
      alertes.push(`unité ${i} : statut « ${str(statut)} » hors liste `
        + 'fermée — écartée du décompte')
      statut = null
    }
    if (statut === 'implicite' && !garantVide(garant)) {
      alertes.push(`unité ${i} : garant cité mais statut `
        + '« implicite » — squelette contradictoire, '
        + 'consigné tel quel')
    }
    if (statut === 'explicite' && garantVide(garant)) {
      alertes.push(`unité ${i} : statut « explicite » sans garant `
        + 'cité — squelette contradictoire, consigné tel quel')
    }
    unites.push({ rang: i, these: (u.these as unknown) || '', statut: statut ?? null,
      note: (u.note as unknown) || '' })
  }

  const traitements: Array<string | null> = []
  for (let k = 0; k < objectionsBrutes.length; k += 1) {
    const j = k + 1
    let tr = objetOuVide(objectionsBrutes[k]).traitement as string | null | undefined
    if (tr !== null && tr !== undefined
      && !(typeof tr === 'string'
        && (CATALOGUE.traitements_objection as readonly string[]).includes(tr))) {
      alertes.push(`objection ${j} : traitement « ${str(tr)} » hors liste `
        + 'fermée — ne compte pas pour le seuil')
      tr = null
    }
    traitements.push(tr ?? null)
  }

  const comptes: Record<string, number> = {}
  for (const s of CATALOGUE.statuts_lien) {
    comptes[s] = unites.filter((u) => u.statut === s).length
  }

  const mesures = {
    unites,
    traitements,
    nb_unites: unites.length,
    comptes_bruts: comptes,
  }

  return { mesures, document_p2: { ...p1 }, alertes }
}

// ════════════════════════════════════════════════════════════════════════════
// LE CRIBLE — les quatre tests, dans l'ordre de la fiche
// ════════════════════════════════════════════════════════════════════════════

/**
 * `_applique_crible` — les requalifications de P2, test par test, DANS L'ORDRE.
 *
 * distinction : `explicite` → `implicite` · source : `explicite`|`implicite` →
 * `cosmetique` · sens et contour : l'unité est MARQUÉE, son statut ne bouge pas.
 *
 * Appariement exact (rang + thèse), puis les replis de l'arbitrage 1 — jamais de
 * soustraction silencieuse, et chaque repli rend son alerte.
 */
function appliqueCrible(
  unites: Unite[], requalifications: unknown, trace: string[], alertes: string[],
): void {
  // ⚠️ PORTAGE — le module ferait `for r in (requalifications or [])`, ce qui
  //    parcourt les CARACTÈRES d'une chaîne puis lève sur `dict(r)`.
  let brutesSource: unknown[] = []
  if (Array.isArray(requalifications)) brutesSource = requalifications
  else if (requalifications != null) {
    alertes.push('crible : `requalifications` n\'est pas une liste — aucune requalification '
      + 'appliquée, valeur illisible consignée')
  }
  const brutes = brutesSource.map((r) => ({ ...objetOuVide(r) })) as Array<Objet & { _test?: string }>

  // Arbitrage 4 — résoudre le test AVANT les passes : un `test` illisible se
  // déduit du statut d'arrivée déclaré, « sans lui, un accent de travers dans
  // `test` faisait gagner un palier entier à la copie ».
  for (const r of brutes) {
    if (testConnu(r.test)) {
      r._test = r.test
      continue
    }
    const vers = r.vers
    const repli = typeof vers === 'string' ? TEST_PAR_VERS[vers] : undefined
    if (repli) {
      r._test = repli
      alertes.push(`requalification (rang ${repr(r.unite)}) : test `
        + `« ${str(r.test)} » absent ou hors liste — repli `
        + `sur « vers ${str(vers)} », test « ${repli} » appliqué`)
    } else {
      alertes.push(`requalification (rang ${repr(r.unite)}) : ni `
        + `test (« ${str(r.test)} ») ni vers `
        + `(« ${str(r.vers)} ») lisibles — consignée, `
        + 'jamais appliquée')
    }
  }

  for (const nomTest of ORDRE_DES_TESTS) {
    const [attendus, vers] = TOUS_TESTS[nomTest]
    const marque = nomTest in TESTS_TERMES
    for (const r of brutes.filter((x) => x._test === nomTest)) {
      const rang = r.unite
      const these = norm(r.these)
      const raison = (r.raison as unknown) || 'raison non fournie'
      if (testConnu(r.test) && r.vers && r.vers !== vers) {
        alertes.push(`requalification de l'unité ${str(rang)} : « vers `
          + `${str(r.vers)} » contredit le test `
          + `« ${nomTest} » — le test fait foi`)
      }
      // ⚠️ Une Map, jamais un objet : `eligibles.get("1")` doit RATER quand la
      //    clé est l'entier 1 — c'est ce que fait `dict.get` en Python, et un
      //    objet JavaScript coercerait la clé.
      const eligibles = new Map<unknown, Unite>()
      for (const u of unites) if (u.statut && attendus.includes(u.statut)) eligibles.set(u.rang, u)

      let cible: Unite | null = null
      let mode: string | null = null
      const u = eligibles.get(rang) ?? null
      if (u !== null && these && norm(u.these) === these) {
        cible = u
        mode = 'exact'
      } else if (u !== null && !these) {
        cible = u
        mode = 'rang seul'
        alertes.push(`requalification de l'unité ${str(rang)} (${nomTest}) `
          + ': thèse non recopiée — appariement par rang seul')
      } else {
        const cand = these ? [...eligibles.values()].filter((x) => norm(x.these) === these) : []
        if (cand.length === 1) {
          cible = cand[0]
          mode = 'repli par thèse'
          alertes.push(`requalification (rang ${repr(rang)}, ${nomTest}) `
            + ': rang sans correspondance, thèse égale à '
            + `l'unité ${cible.rang} — repli appliqué`)
        }
      }
      if (cible === null) {
        alertes.push(`requalification (rang ${repr(rang)}, ${nomTest}) `
          + 'sans correspondance avec une unité '
          + `${attendus.map((s) => `« ${s} »`).join(' ou ')}`
          + ' — consignée, jamais appliquée')
        continue
      }
      if (marque) {
        (cible.marques ??= []).push(vers)
        trace.push(`crible/${nomTest} : unité ${cible.rang} `
          + `marquée « ${vers} », statut inchangé `
          + `(${str(cible.statut)}) (${mode}) — ${str(raison)}`)
        continue
      }
      const avant = cible.statut
      cible.statut = vers
      ;(cible.requalifiee ??= []).push(nomTest)
      trace.push(`crible/${nomTest} : unité ${cible.rang} `
        + `${str(avant)} → ${vers} (${mode}) — ${str(raison)}`)
    }
  }
}

/** Une unité retenue au décompte, avec le statut SOUS LEQUEL elle y compte. */
interface AuDecompte { unite: Unite; statut: string }

/**
 * `_resout_limites` — la borne basse des « limite », note illisible écartée.
 *
 * « Une unité `limite` compte pour LE PLUS FAIBLE DES DEUX STATUTS que sa `note`
 * indique » (fiche §4, acté) ; si la note n'en donne pas deux, l'unité est
 * **écartée du décompte** et l'alerte le déclare — « le doute ne fabrique pas un
 * statut » —, mais elle reste comptée dans `nb_limites`.
 *
 * ⭐ Il rend en plus les UNITÉS retenues, et non seulement leurs statuts : la
 *    télémétrie du §5 se compte sur cette population-là, et sur aucune autre.
 */
function resoutLimites(
  unites: Unite[], trace: string[], alertes: string[],
): { auDecompte: AuDecompte[]; nbLimites: number } {
  let nbLimites = 0
  const auDecompte: AuDecompte[] = []
  for (const u of unites) {
    const st = u.statut
    if (st === null) continue
    if (st !== 'limite') {
      auDecompte.push({ unite: u, statut: st })
      continue
    }
    nbLimites += 1
    const note = norm(u.note)
    const cites = ORDRE_STATUTS.filter((s) => motIsole(s, note))
    if (cites.length === 2) {
      auDecompte.push({ unite: u, statut: cites[0] }) // l'ordre va du plus faible au plus fort
      // `cosmetique` n'est pas cherché : P1 ne le déclare pas (fiche §3)
      trace.push(`limite : unité ${u.rang} comptée `
        + `« ${cites[0]} » (borne basse de ${str([...cites])})`)
    } else {
      alertes.push(`unité ${u.rang} : limite illisible (la note ne `
        + 'donne pas deux statuts) — écartée du statut '
        + 'dominant, comptée dans nb_limites')
    }
  }
  return { auDecompte, nbLimites }
}

// ════════════════════════════════════════════════════════════════════════════
// LES NEUF OBSERVABLES DU §5 — ce que le module ne calcule pas
// ════════════════════════════════════════════════════════════════════════════

const OBSERVABLES_TELEMETRIE = [
  'garant_present', 'lien_explicite', 'preuve_circulaire', 'garant_circulaire',
  'source_cosmetique', 'garant_ambigu', 'garant_vague', 'objection_traitee', 'nb_limites',
] as const

/**
 * LES DEUX DÉNOMINATEURS, sous le NOM EXACT que la fiche leur donne.
 *
 * « `comptage rapporté` DIVISE l'entrée du même nom par le dénominateur que
 * `rapporte_a` désigne » (`observables.ts`) : le relevé porte donc, à côté des
 * comptages, une entrée par dénominateur, nommée comme la fiche l'écrit. Cinq
 * observables se rapportent aux unités du décompte ; `nb_limites`, lui, s'y
 * rapporte **écartées comprises** — et « écartée du décompte » est ce que la
 * fiche dit des DEUX causes d'écartement (statut hors liste §4-8, limite
 * illisible §4-2). La population « écartées comprises » est donc **toutes les
 * unités du relevé**.
 */
const DENOM_DECOMPTE = 'les unités du décompte'
const DENOM_DECOMPTE_ELARGI = 'les unités du décompte, écartées comprises'

/**
 * Les NEUF observables de télémétrie du §5, comptés APRÈS CRIBLE ET BORNE BASSE.
 *
 * ⭐ POURQUOI APRÈS : « la chaîne froide les dérive du RELEVÉ JUGÉ » (`07-` §2).
 *    Quatre des neuf le disent d'ailleurs eux-mêmes — `lien_explicite` est
 *    « proportion d'unités `explicite` APRÈS CRIBLE », `garant_circulaire` et
 *    `source_cosmetique` comptent les unités « rétrogradées » ou « requalifiées »
 *    par un test, `garant_ambigu` et `garant_vague` celles que le crible MARQUE.
 *
 * ⭐⭐ LE DÉNOMINATEUR DES DEUX `proportion`, ET C'EST UNE LECTURE. La fiche écrit
 *    « proportion d'unités » sans nommer la population, là où les cinq
 *    `comptage rapporté` la nomment (« les unités du décompte »). Elle est lue
 *    ici comme **la même population**, et pour une raison qui vient de la fiche :
 *    le `sens` déclaré des deux observables les adosse à la RÈGLE D'AGRÉGATION
 *    du §4 — « la majorité stricte des unités portent un garant cité », « la
 *    majorité stricte des unités sont explicites après crible » — et cette règle
 *    compte, elle, exactement le décompte : une unité écartée n'y a pas de voix.
 *    Prendre toutes les unités du relevé ferait qu'un statut mal orthographié
 *    abaisserait `garant_present` sans toucher `preuve_circulaire`. *La lecture
 *    est relevée ; si Louis la tranche autrement, c'est ici que ça se change.*
 *
 * ⚠️ Chaque observable a SA VALEUR, OU SON ALERTE NOMMÉE. Une entrée absente
 *    rendrait `n/a`, `n/a` sort du dénominateur du taux, et l'escalade N1/N2
 *    deviendrait aveugle sur cet observable POUR TOUJOURS, SANS UN SYMPTÔME.
 */
function telemetrie(
  auDecompte: AuDecompte[], nbLimites: number, nbUnites: number, objection: boolean,
  garantsParRang: Map<number, unknown> | null,
): { valeurs: Record<string, number | string | boolean | null>; alertes: string[] } {
  const valeurs: Record<string, number | string | boolean | null> = {}
  const alertes: string[] = []
  const denom = auDecompte.length

  // Les deux dénominateurs — ce que `observables.ts` divisera. « Une quantité
  // relevée qui ne correspond à aucun observable déclaré n'est pas une erreur :
  // le relevé porte aussi les dénominateurs. »
  valeurs[DENOM_DECOMPTE] = denom
  valeurs[DENOM_DECOMPTE_ELARGI] = nbUnites

  const compte = (predicat: (x: AuDecompte) => boolean) => auDecompte.filter(predicat).length

  // 1. `garant_present` — proportion d'unités dont `garant_cite` ≠ `[absent]`.
  //    ⚠️ Il se lit sur le RELEVÉ, pas sur `mesures` : `code1` y jette
  //       `garant_cite` une fois les bruts comptés.
  if (garantsParRang === null) {
    alertes.push('garant_present : le relevé de P1 n\'est pas parvenu à Code2 — `garant_cite` '
      + 'ne se lit nulle part, valeur non déclarée (`n/a`), jamais 0')
  } else if (denom === 0) {
    alertes.push('garant_present : aucune unité au décompte — proportion sans dénominateur, '
      + 'valeur non déclarée (`n/a`), jamais 0')
  } else {
    const avec = compte((x) => !garantVide(garantsParRang.get(x.unite.rang)))
    valeurs.garant_present = avec / denom
  }

  // 2. `lien_explicite` — proportion d'unités `explicite` APRÈS CRIBLE.
  if (denom === 0) {
    alertes.push('lien_explicite : aucune unité au décompte — proportion sans dénominateur, '
      + 'valeur non déclarée (`n/a`), jamais 0')
  } else {
    valeurs.lien_explicite = compte((x) => x.statut === 'explicite') / denom
  }

  // 3-7. Les cinq `comptage rapporté` : le relevé porte LE COMPTE BRUT, et la
  //      chaîne divise par le dénominateur que `rapporte_a` nomme. Un
  //      dénominateur vide y rend `n/a` de lui-même — c'est la règle du `01-`
  //      §8.2, appliquée là où elle vit.
  valeurs.preuve_circulaire = compte((x) => x.statut === 'circulaire')
  valeurs.garant_circulaire = compte((x) => !!x.unite.requalifiee?.includes('distinction'))
  valeurs.source_cosmetique = compte((x) => !!x.unite.requalifiee?.includes('source'))
  valeurs.garant_ambigu = compte((x) => !!x.unite.marques?.includes('ambigu'))
  valeurs.garant_vague = compte((x) => !!x.unite.marques?.includes('vague'))

  // 8. `objection_traitee` — binaire : au moins une objection `réfutée` ou
  //    `portée nuancée`. ⚠️ CE N'EST PAS `seuil_franchi` : le seuil se ferme
  //    aussi sur une unité marquée `ambigu` ou `vague` (fiche §4), l'observable
  //    du §5 ne regarde que le traitement de l'objection.
  valeurs.objection_traitee = objection ? 'oui' : 'non'

  // 9. `nb_limites` — « nombre d'unités `limite`, écartées comprises ». Signal
  //    d'ambiguïté de L'INSTRUMENT, pas de compétence : `reussie: sans_objet`,
  //    aucune mesure n'y est réussie ni ratée.
  valeurs.nb_limites = nbLimites

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
// CODE2 — « du code agrège »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `code2(sortie_p2, sortie_code1, params)` du module — les trois clés publiques,
 * plus le canal privé de la télémétrie.
 *
 * Il applique les requalifications, résout les « limite » par la borne basse,
 * compose LE PALIER DE BASE — « la majorité se lit sur le palier, jamais sur le
 * statut : deux statuts à Moyen ne se divisent pas les voix » —, vérifie le
 * seuil et rend le niveau.
 */
// ⚠️ `_ctx` n'est pas lu non plus : c'est de lui que viendraient les paramètres
//    du bloc machine, et l'Argumentation n'en déclare AUCUN (`parametres: {}` à la
//    fiche, `PARAMS` vide au module). « Si tu te surprends à vouloir un seuil
//    réglable, c'est qu'une valeur est en dur dans le module » — il n'y en a pas.
function code2(
  artefactP2: unknown, sortieCode1: SortieCode1, _ctx: ContexteBranchement,
): SortieCode2 {
  const trace: string[] = []
  const alertes: string[] = []
  const mesuresBrutes = estObjet(sortieCode1?.mesures) ? sortieCode1.mesures : {}
  const aDesMesures = Object.keys(mesuresBrutes).length > 0
  const unites: Unite[] = (Array.isArray(mesuresBrutes.unites) ? mesuresBrutes.unites : [])
    .map((u) => ({ ...(u as Unite) }))
  const traitements: unknown[] = Array.isArray(mesuresBrutes.traitements)
    ? [...mesuresBrutes.traitements] : []
  if (!aDesMesures) {
    alertes.push('sortie de Code1 absente — rien à composer, '
      + 'garde-fou de la copie sans unité appliqué')
  }

  const p2 = estObjet(artefactP2) ? artefactP2 : {}
  const requals = estObjet(p2.crible) ? (p2.crible as Objet).requalifications : undefined
  appliqueCrible(unites, requals, trace, alertes)

  const { auDecompte, nbLimites } = resoutLimites(unites, trace, alertes)
  const comptables = auDecompte.map((x) => x.statut)

  const objection = traitements.some((t) => typeof t === 'string' && TRAITEMENTS_SEUIL.includes(t))
  const marquees = unites.filter((u) => u.marques && u.marques.length > 0)
  const seuil = objection && marquees.length === 0
  if (marquees.length) {
    const detail = [...new Set(marquees.flatMap((u) => u.marques!))].sort()
    trace.push(`termes : unité(s) ${str(marquees.map((u) => u.rang))} `
      + `marquée(s) ${str(detail)} — le seuil se ferme`
      + (objection ? ' alors qu\'une objection est traitée' : ''))
  }
  trace.push(`seuil : ${seuil ? 'franchi' : 'non franchi'}`
    + ` (traitements consignés : ${str(traitements.filter((t) => t))})`)

  // ⭐ La télémétrie du §5 se calcule sur LA MÊME population que l'agrégation,
  //    et elle se rend même quand le garde-fou de la copie sans unité s'applique
  //    — sinon les neuf sortiraient en `n/a` sans un mot.
  const garantsParRang = garantsDuReleve(sortieCode1, unites.length)
  const tele = telemetrie(auDecompte, nbLimites, unites.length, objection, garantsParRang)

  if (!comptables.length) {
    alertes.push('aucune unité au décompte (squelette vide, ou toutes '
      + 'écartées) — niveau Absent, garde-fou de la fiche §4')
    return {
      verdicts: { niveau: 'Absent', palier_base: 'Absent', seuil_franchi: seuil ? 'oui' : 'non' },
      trace,
      alertes,
      _telemetrie: tele,
    }
  }

  // La majorité se lit sur le PALIER, jamais sur le statut : `cosmetique` et
  // `implicite` partagent Moyen, et deux statuts d'un même palier ne se divisent
  // pas les voix (fiche §4, glose de la règle d'agrégation).
  const comptesSt: Record<string, number> = {}
  for (const s of Object.keys(PALIER_PAR_STATUT)) {
    comptesSt[s] = comptables.filter((x) => x === s).length
  }
  const comptes: Record<string, number> = {}
  for (const x of ECHELLE_PALIERS) comptes[x] = 0
  for (const s of comptables) comptes[PALIER_PAR_STATUT[s]] += 1
  const maxi = Math.max(...Object.values(comptes))
  const tetes = ECHELLE_PALIERS.filter((x) => comptes[x] === maxi)
  const base = tetes[0] // à égalité en tête, le plus faible des ex æquo
  trace.push('distribution après crible et borne basse : '
    + `${str(filtreNonNuls(comptesSt))}`)
  trace.push(`paliers : ${str(filtreNonNuls(comptes))} → `
    + `palier de base « ${base} »`
    + (tetes.length > 1 ? ` (égalité en tête ${str([...tetes])}, le plus faible décide)` : ''))

  const niveau = (base === 'Bon' && seuil) ? 'Acquis' : base
  if (base === 'Bon' && seuil) {
    trace.push('base Bon + seuil franchi → Acquis')
  } else if (seuil && base !== 'Bon') {
    trace.push(`seuil franchi mais base ${base} — le seuil ouvre `
      + 'Acquis, il n\'élève jamais la base')
  }
  if (nbLimites) trace.push(`nb_limites = ${nbLimites}`)

  return {
    verdicts: { niveau, palier_base: base, seuil_franchi: seuil ? 'oui' : 'non' },
    trace,
    alertes,
    // Canal PRIVÉ de la télémétrie — le tiret bas le déclare, « sans lui une
    // quatrième clé est une violation » (`CONTRAT` §3). Il ne va pas au banc :
    // les observables du §5 n'entrent dans aucun gold.
    _telemetrie: tele,
  }
}

/** `{s: n for s, n in x.items() if n}` — l'ordre d'insertion est conservé. */
function filtreNonNuls(x: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, n] of Object.entries(x)) if (n) out[k] = n
  return out
}

/**
 * `garant_cite` par rang, relu sur `document_p2` — le relevé entier, que `code1`
 * y recopie. Rend `null` quand le relevé n'est pas exploitable : la télémétrie
 * dit alors son alerte nommée, elle ne compte pas 0.
 */
function garantsDuReleve(sortieCode1: SortieCode1, nbUnites: number): Map<number, unknown> | null {
  const doc = sortieCode1?.document_p2
  if (!estObjet(doc) || !Array.isArray(doc.unites)) return null
  if (doc.unites.length !== nbUnites) return null
  const m = new Map<number, unknown>()
  doc.unites.forEach((u, i) => { m.set(i + 1, objetOuVide(u).garant_cite) })
  return m
}

// ════════════════════════════════════════════════════════════════════════════
// CONFORMITE — « l'erreur stable : P2 qui déborde de sa sortie déclarée »
// ════════════════════════════════════════════════════════════════════════════

const CHAMPS_ADMIS_P2 = new Set([
  'crible', 'justification_ancree', 'ce_qui_plafonne', 'levier', 'confiance',
])
const CONFIANCES = ['élevée', 'moyenne', 'faible']

// ⚠️ Le crochet du contrat en reçoit quatre — `sortie_p1`, `sortie_p2`,
//    `sortie_code1`, `sortie_code2` — et celui-ci n'en lit QU'UN : l'Argumentation
//    n'a aucun canal `_audit`, parce que son `conformite` ne recopie aucun état
//    calculé par `code2` — il contrôle la FORME de ce que P2 rend, et rien d'autre.
function conformite(
  _artefactsP1: Record<string, unknown>, artefactP2: unknown,
): string[] {
  const alertes: string[] = []
  const p2 = estObjet(artefactP2) ? artefactP2 : {}
  for (const champ of Object.keys(p2)) {
    if (!CHAMPS_ADMIS_P2.has(champ)) {
      alertes.push('P2 rend un champ hors sortie déclarée : '
        + `« ${champ} » — si c'est un niveau ou un décompte, `
        + 'la chaîne est en erreur (fiche §4)')
    }
  }
  const conf = p2.confiance
  if (conf !== null && conf !== undefined && !(typeof conf === 'string' && CONFIANCES.includes(conf))) {
    alertes.push(`confiance « ${str(conf)} » hors énumération`)
  }
  const crible = estObjet(p2.crible) ? (p2.crible as Objet) : {}
  const requals = crible.requalifications
  if (requals === null || requals === undefined) {
    alertes.push('P2 ne rend pas crible.requalifications (liste, '
      + 'éventuellement vide)')
  } else if (!Array.isArray(requals)) {
    // ⚠️ PORTAGE — le module lèverait en itérant autre chose qu'une liste.
    alertes.push('P2 rend crible.requalifications sous une forme qui n\'est pas une liste — '
      + 'valeur illisible consignée, jamais réparée')
  } else {
    for (const brut of requals) {
      const r = objetOuVide(brut)
      if (!testConnu(r.test)) {
        const vers = r.vers
        const repli = typeof vers === 'string' ? TEST_PAR_VERS[vers] : undefined
        alertes.push('P2 rend une requalification sans test lisible — '
          + `« ${str(r.test)} » hors ${str(Object.keys(TOUS_TESTS).sort())}`
          + (repli ? ` ; repli possible par « vers ${str(vers)} » `
            + `(test « ${repli} »)` : ' et vers illisible'))
      }
    }
  }
  return alertes
}

// ════════════════════════════════════════════════════════════════════════════
// LE BRANCHEMENT
// ════════════════════════════════════════════════════════════════════════════

export const BRANCHEMENT_ARGUMENTATION: BranchementCompetence = {
  /**
   * ⛔⛔ C5-L3 — `composer` SEUL, ET L'ÉCART AVEC L'ADMIS EST LE CŒUR DE LA
   *    PORTE DE MODE. `competences_modes_admis` admet l'Argumentation en
   *    `composer`, `expliquer` ET `évaluer` — trois couples, vérifiés en base
   *    dans les deux bases. **Son instrument n'en couvre qu'un.**
   *
   * ⛔ CE QUI MANQUE N'EST PAS UN RÉGLAGE, C'EST UN INSTRUMENT ENTIER. Sa grille
   *    réceptive est écrite EN PROSE à sa fiche §3, et rien de machine ne la
   *    porte : aucun marqueur `<!-- DEBUT-PROMPT-… -->` réceptif sur les sept
   *    fiches (la dérivation ne connaît que `P1` et `P2`), aucun de ses enums au
   *    volet `squelette.catalogue` du bloc machine — qui ne déclare que
   *    `statuts_lien`, `statuts_apres_crible`, `traitements_objection`,
   *    `tests_crible`, `marques_termes`, **tous de composition** —, et son étape
   *    de notation réceptive est déclarée INACTIVE par la fiche elle-même.
   *
   * ⛔ ET SA CASCADE RÉCEPTIVE NE RECOUVRE PAS CELLE DE COMPOSITION. La §4
   *    réceptive part de `garant` × `mode_discursif` × `garant_valide` en
   *    `expliquer`, et de `objection_presente` × `objection_cible` × `charite`
   *    en `évaluer` ; la composition part de `statut_du_lien` sur `unites[]`.
   *    **Rien ne se recouvre** — c'est ce qui la sépare du Questionnement et de
   *    la Synthèse, où « le même branchement » a un sens littéral.
   *
   * ⭐ La fiche §3 dit elle-même la condition de reprise : « les enums de cette
   *    grille n'y entreront qu'avec l'étape de notation réceptive, **quand le
   *    banc lecture l'aura validée** ». *Aucune session ne construit un
   *    instrument manquant* (`07-` §2) : cette ligne passe de `['composer']` à
   *    `['composer', 'expliquer', 'évaluer']` le jour où le banc l'aura dit, et
   *    pas avant.
   */
  modesCouverts: ['composer'],
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
   * déclaration. Le juge lit LE SQUELETTE NU, sans la copie : dispositif
   * anti-halo, « et c'est normal et voulu » (fiche §4).
   */
  jugement: () => ({ tetePrompt: 'P2' }),

  code1,

  code2,

  conformite,

  /**
   * `00-referentiel.md` §2 — Absent/Faible/Moyen/Bon/Acquis = E/D/C/B/A, la
   * triple nomenclature du §2 de la fiche.
   */
  lettre: (c2) => {
    const niveau = c2.verdicts?.niveau
    return typeof niveau === 'string' ? (LETTRE_DU_NIVEAU[niveau] ?? null) : null
  },

  releve: (c2) => {
    const t = estObjet(c2._telemetrie)
      ? c2._telemetrie as {
        valeurs: Record<string, number | string | boolean | null>; alertes: string[]
      }
      : null
    // « Ce qui récapitule RECOPIE la trace, il ne la recalcule jamais » (§3).
    if (!t) {
      return { releve: {},
        alertes: ['les observables de télémétrie ne sont pas parvenus de Code2 — les neuf du §5 '
          + 'sortiraient en `n/a`'] }
    }
    return { releve: t.valeurs, alertes: t.alertes }
  },

  /**
   * ⛔ `delta` N'EST PAS DÉCLARÉ, ET C'EST UNE ABSENCE MOTIVÉE.
   *
   * « Ce que "comparer deux squelettes" veut dire dépend de la grille : la source
   * ne le définit pas hors de la fiche, donc le branchement le porte » — or LA
   * FICHE DE L'ARGUMENTATION NE LE DÉFINIT NULLE PART : ni son §4, ni son §5, ni
   * son bloc machine ne disent ce que comparer un squelette de v1 à un squelette
   * de version finale veut dire pour elle. *Vérifié : le mot n'y figure pas une
   * fois.* L'inventer ici serait trancher une règle de grille depuis le code, ce
   * qu'aucun lot ne fait.
   *
   * La chaîne le dit alors par une alerte et laisse NULL — c'est le comportement
   * voulu. ⚠️ ET NULL N'EST PAS 0 : une passation en classe n'a pas de version
   * finale, et les deux cas ne se confondent pas. *Ce que ça coûte tant que la
   * fiche se tait : N2 reste aveugle au signal de réceptivité sur l'Argumentation
   * — c'est la deuxième fiche sur deux à se taire. La question est au relevé.*
   */
}

// Exportés pour le test du portage — jamais pour la chaîne, qui ne connaît que
// `BRANCHEMENT_ARGUMENTATION`. Les fonctions internes, elles, restent internes :
// ce qui se compare au module se compare PAR LES CROCHETS, comme le banc le fait.
export { OBSERVABLES_TELEMETRIE, DENOM_DECOMPTE, DENOM_DECOMPTE_ELARGI }
