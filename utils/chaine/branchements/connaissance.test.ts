// ============================================================================
// C4 · L10 — LE PORTAGE, CONFRONTÉ AU MODULE QUI FAIT FOI POUR LE CALCUL.
// ----------------------------------------------------------------------------
// « Le branchement reproduit, sur les vecteurs embarqués du module —
//   `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
//   `python3 code.py --autotest` produit, ET SANS AUCUN APPEL DE MODÈLE. »
//                                            — le « fait quand » de C4-L10
//
// ⭐ LES DEUX CÔTÉS SONT REJOUÉS SUR LES MÊMES ENTRÉES, et LES TROIS CLÉS sont
//    comparées — pas seulement `verdicts`. *Une trace qui diverge dit qu'un
//    chemin de calcul a changé, même quand le verdict tombe juste.*
//
// ⚠️⚠️ LA CONNAISSANCE N'A NI GOLD, NI COPIE, NI CRITÈRE, NI RUN STOCKÉ —
//    `VERSION_GOLDS_TESTEE` vaut `None`, et son dossier ne porte que ses deux
//    prompts dérivés et son module. Ses 18 vecteurs `code2` sont des cas
//    CONSTRUITS, et l'autotest le déclare lui-même : « ils prouvent
//    l'arithmétique, jamais la validité ». C'est donc LE BALAYAGE qui porte la
//    preuve — 913 cas au total, passés dans LA MÊME FONCTION DU MÊME MODULE : il
//    n'invente aucune règle, il cesse de ne la lui demander que 22 fois.
//
// ⭐ ET LES ASSERTIONS « FICHE » QUI LE SUIVENT SONT L'ÉPREUVE NÉGATIVE. Un
//    portage qui inverserait une règle passerait le balayage — les deux côtés
//    s'accorderaient sur la même erreur si l'erreur était dans les deux. Ce sont
//    les assertions adossées À LA FICHE, sur des cas ASYMÉTRIQUES et portant au
//    moins un élément ÉCARTÉ DU DÉCOMPTE QUI PORTE QUAND MÊME LA PROPRIÉTÉ, qui
//    font tomber une mutation.
//
// ⚠️ CE N'EST PAS UNE FIXTURE FIGÉE. Le harnais Python
//    (`scripts/vecteurs-connaissance.py`) rejoue le module À CHAQUE EXÉCUTION :
//    le jour où le module bouge — un seuil, une règle, un ordre —, ce test le
//    dit. Un jeu d'attendus recopié ici aurait pourri en silence, et « des
//    vecteurs qui pourrissent en silence valideraient le calcul contre une
//    référence morte » (`CONTRAT-MODULES.md` §5).
//
// ⚠️ Sans le dépôt de conception sous la main, le test SE SAUTE — il ne crie pas
//    faux. C'est le même patron que le contrôle de dérivation.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  BRANCHEMENT_CONNAISSANCE, OBSERVABLES_TELEMETRIE, OBSERVABLES_MODULE,
  PARAMS_DEFAUT, PARAMS_FLOTTANTS, CATALOGUE, DENOM_JUGEES, DENOM_RELEVE,
  GRADES, NIVEAUX,
} from './connaissance'
import type { ContexteBranchement, SortieCode1 } from '../instruments'

// ⚠️ Le dépôt de conception vit à un chemin ABSOLU hors de ce dépôt. Le fixer en
// dur ici faisait SAUTER le contrôle partout ailleurs que sur la machine du
// professeur — et un `npm test` vert sans le contrôle ne prouve rien (C4-L11).
const RACINE_CONCEPTION = process.env.PALIMPSESTE_RACINE_CONCEPTION
  || '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

type Objet = Record<string, unknown>

interface SortieC2 { verdicts: Objet; trace: string[]; alertes: string[] }
interface CasP2 {
  nom: string
  sortie_code1: SortieCode1
  entree_p2: unknown
  params: Record<string, number> | null
  attendu: { code2: SortieC2 }
  attendu_autotest?: Objet
}
interface CasCode1 {
  nom: string
  sortie_p1: unknown
  params: Record<string, number> | null
  attendu: { mesures: Objet; document_p2: unknown; alertes: string[] }
  attendu_autotest?: Objet
  alertes_min?: number
}
interface CasNorm {
  entree: unknown; n: string
  dans_justesses: boolean; dans_attributions: boolean; strip_crochets: string
}
interface CasPre1 { texte: string; attendu: { production: string; pre_releve: string } }
interface CasPre2 {
  contexte: Objet | null
  params: Record<string, number> | null
  attendu: Record<string, string | null>
}
interface CasConf {
  nom: string
  sortie_p1: unknown
  entree_p2: unknown
  sortie_code1: Objet | null
  contexte: Objet
  attendu: string[]
}
interface CasCroisement { diversite: string; justesse: string; niveau: string; trace: string[] }

interface Paquet {
  module: {
    competence: string; version_calcul: string; version_golds_testee: string | null
    observables: string[]; slot_document_p2: string
    catalogue: Record<string, string[]>
    params: Record<string, number>; params_statuts: Record<string, string>
    params_types: Record<string, string>
    grades: string[]; niveaux: string[]; en_defaut: string[]; fin_phrase: string
    regle_agregation_citee: string; regle_agregation_source: string
    types: Record<string, string>; tailles: Record<string, number>
  }
  autotest: { echecs: string[]; annonces: string[] }
  p2_parfait: CasP2[]
  code1_parfait: CasCode1[]
  balayage_cascade: CasP2[]
  balayage_cascade_croisee: CasP2[]
  balayage_portes: CasP2[]
  balayage_formatage: CasP2[]
  balayage_diversite: CasP2[]
  balayage_seuils_deplaces: CasP2[]
  balayage_croisement: CasCroisement[]
  balayage_normalisation: CasNorm[]
  balayage_code1: CasCode1[]
  balayage_etendue: CasP2[]
  balayage_appariement: CasP2[]
  pre_p1_cas: CasPre1[]
  pre_p2_cas: CasPre2[]
  conformite_cas: CasConf[]
  comptes: Record<string, number>
}

/** Le contexte d'un vecteur : aucun exercice, aucune base, aucun appel. */
function ctxDe(
  parametres: Record<string, number | string> = {},
  contexteExercice: Record<string, string> = {},
): ContexteBranchement {
  return {
    modes: ['composer'],
    cran: null,
    // ⭐ La Connaissance est MONO-MODE `composer` et n'a AUCUNE grille réceptive
    //    (fiche §6) : « elle mesure ce que l'élève mobilise de mémoire, non ce
    //    qu'il reconnaît chez un auteur ». Aucun chemin de réception n'existe.
    referent: null,
    exceptionOrthographe: false,
    contexteExercice: { copie: '', sujet: '', consigne: '', mode: 'composer', ...contexteExercice },
    prives: {},
    sorties: {},
    parametres,
  }
}

let paquet: Paquet | null = null
let motifDuSaut: string | null = null

if (!existsSync(RACINE_CONCEPTION)) {
  motifDuSaut = 'dépôt de conception absent'
} else {
  const r = spawnSync('python3',
    ['scripts/vecteurs-connaissance.py', '--racine', RACINE_CONCEPTION],
    { encoding: 'utf-8', maxBuffer: 512 * 1024 * 1024 })
  if (r.status !== 0) {
    // Un module en échec n'est PAS une raison de sauter : un portage vérifié
    // contre un module rouge ne prouve rien, et le taire serait pire.
    paquet = null
    test("l'autotest du module de calibration est VERT — sans lui, le portage ne prouve rien", () => {
      assert.fail(`le harnais des vecteurs a échoué (${r.status}) :\n${r.stdout}${r.stderr}`)
    })
  } else {
    paquet = JSON.parse(r.stdout) as Paquet
  }
}

function siPaquet(nom: string, corps: (p: Paquet) => void) {
  test(nom, (t) => {
    if (motifDuSaut) { t.skip(motifDuSaut); return }
    if (!paquet) { t.skip('paquet de vecteurs indisponible'); return }
    corps(paquet)
  })
}

/** Rejoue un cas de composition et compare LES TROIS CLÉS de `code2`. */
function rejoueP2(cas: CasP2, ou: string) {
  const ctx = ctxDe(cas.params ?? {})
  const c2 = BRANCHEMENT_CONNAISSANCE.code2(cas.entree_p2, cas.sortie_code1, ctx)
  assert.deepEqual(c2.verdicts, cas.attendu.code2.verdicts, `${ou}/${cas.nom} — verdicts`)
  // La trace se compare MOT POUR MOT : c'est elle qui rend lisible une erreur de
  // jugement, « depuis que le code calcule juste ».
  assert.deepEqual(c2.trace, cas.attendu.code2.trace, `${ou}/${cas.nom} — trace`)
  assert.deepEqual(c2.alertes, cas.attendu.code2.alertes, `${ou}/${cas.nom} — alertes`)
  return c2
}

/** Rejoue un cas `code1` et compare `mesures`, `document_p2` et `alertes`. */
function rejoueCode1(cas: CasCode1, ou: string) {
  const ctx = ctxDe(cas.params ?? {})
  const c1 = BRANCHEMENT_CONNAISSANCE.code1({ p1: cas.sortie_p1 }, ctx)
  assert.deepEqual(c1.mesures, cas.attendu.mesures, `${ou}/${cas.nom} — mesures`)
  assert.deepEqual(c1.document_p2, cas.attendu.document_p2, `${ou}/${cas.nom} — document_p2`)
  assert.deepEqual(c1.alertes, cas.attendu.alertes, `${ou}/${cas.nom} — alertes`)
  return c1
}

// ── Ce que le module dit de lui-même ────────────────────────────────────────

siPaquet("l'autotest du module est vert, et il n'a NI gold NI run stocké", (p) => {
  assert.deepEqual(p.autotest.echecs, [])
  assert.equal(p.module.competence, 'connaissance')
  // « Ton état : TESTS_P2_PARFAIT 18 vecteurs · TESTS_CODE1_PARFAIT 4 vecteurs ·
  //   VERSION_GOLDS_TESTEE = None. » Si l'un des trois bouge, c'est que les golds
  //   du Run 1 sont arrivés — et les vecteurs gold avec eux.
  assert.equal(p.module.version_golds_testee, null)
  assert.deepEqual(p.module.observables, [...OBSERVABLES_MODULE])
  // ⭐ L'autotest DÉCLARE lui-même que ses vecteurs sont construits. Le lot ne
  //    les présente donc jamais comme une preuve de validité.
  assert.ok(p.autotest.annonces.some((a) => a.includes('cas CONSTRUITS')
    && a.includes("prouvent l'arithmétique, jamais la validité")))
})

siPaquet('LE TYPE des constantes de vecteurs, et pas seulement leur taille', (p) => {
  // ⚠️ « Ne compte jamais une constante sans vérifier son TYPE » : chez
  //    l'Expression, `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu
  //    « 52 vecteurs » qui étaient 52 caractères.
  assert.equal(p.module.types.TESTS_P2_PARFAIT, 'list')
  assert.equal(p.module.types.TESTS_CODE1_PARFAIT, 'list')
  assert.deepEqual(p.module.tailles, { TESTS_P2_PARFAIT: 18, TESTS_CODE1_PARFAIT: 4 })
  assert.equal(p.p2_parfait.length, 18)
  assert.equal(p.code1_parfait.length, 4)
})

siPaquet('LES LISTES FERMÉES et LES SIX PARAMÈTRES sont ceux du bloc machine', (p) => {
  // Le dérivé porte le volet `squelette` ; le module porte son `CATALOGUE`. Le
  // portage lit le second — s'ils divergeaient, le banc refuserait le run
  // (`verifie-module.py`), et ce test le dirait ici d'abord.
  for (const [cle, valeurs] of Object.entries(p.module.catalogue)) {
    assert.deepEqual(CATALOGUE[cle], valeurs, `catalogue « ${cle} »`)
  }
  assert.deepEqual(Object.keys(CATALOGUE).sort(), Object.keys(p.module.catalogue).sort())
  // ⛔ « Aucun seuil en dur nulle part : la table est la seule maison des
  //    seuils. » Les défauts de ce fichier ne sont qu'un REPLI, et ils doivent
  //    valoir ceux du module — donc ceux de la fiche.
  assert.deepEqual(PARAMS_DEFAUT, p.module.params)
  // ⚠️⚠️ ET LEUR TYPE PYTHON, qui décide du TEXTE de la trace : `str(5.0)` vaut
  //    « 5.0 » et `String(5)` vaut « 5 ». Le JSON perd le type ; seule la
  //    DÉCLARATION le porte. Cet ensemble ne peut donc pas diverger en silence.
  const flottantsDuModule = Object.entries(p.module.params_types)
    .filter(([, t]) => t === 'float').map(([n]) => n).sort()
  assert.deepEqual([...PARAMS_FLOTTANTS].sort(), flottantsDuModule)
  assert.equal(Object.keys(PARAMS_DEFAUT).length, 6)
  assert.deepEqual(GRADES, p.module.grades)
  assert.deepEqual(NIVEAUX, p.module.niveaux)
  // ⭐ `SLOT_DOCUMENT_P2` est DÉCLARÉ par le module, et le branchement le reprend
  //    tel quel — jamais deviné par soustraction.
  assert.equal(p.module.slot_document_p2, 'releve_phase_1')
  assert.equal(BRANCHEMENT_CONNAISSANCE.jugement(ctxDe()).slotDocument, 'releve_phase_1')
})

// ── LE CŒUR : les vecteurs embarqués, les trois clés, sur les mêmes entrées ──

siPaquet('LES 18 VECTEURS `code2` — verdicts, trace et alertes IDENTIQUES', (p) => {
  assert.equal(p.p2_parfait.length, 18)
  for (const cas of p.p2_parfait) {
    const c2 = rejoueP2(cas, 'TESTS_P2_PARFAIT')
    // Et ce que l'autotest LUI-MÊME exige, en plus de l'identité des deux côtés.
    for (const [cle, att] of Object.entries(cas.attendu_autotest ?? {})) {
      assert.equal(c2.verdicts[cle], att, `${cas.nom} — attendu d'autotest sur « ${cle} »`)
    }
  }
})

siPaquet('LES 4 VECTEURS `code1` — mesures, document_p2 et alertes IDENTIQUES', (p) => {
  assert.equal(p.code1_parfait.length, 4)
  for (const cas of p.code1_parfait) {
    const c1 = rejoueCode1(cas, 'TESTS_CODE1_PARFAIT')
    for (const [cle, att] of Object.entries(cas.attendu_autotest ?? {})) {
      assert.equal(c1.mesures[cle], att, `${cas.nom} — attendu d'autotest sur « ${cle} »`)
    }
    assert.ok(c1.alertes.length >= (cas.alertes_min ?? 0),
      `${cas.nom} — au moins ${cas.alertes_min} alerte(s)`)
  }
})

// ── LE BALAYAGE : la même fonction du même module, sur plus d'entrées ────────

siPaquet('BALAYAGE — les 252 distributions de la cascade de Justesse', (p) => {
  assert.ok(p.balayage_cascade.length >= 250)
  for (const cas of p.balayage_cascade) rejoueP2(cas, 'cascade')
})

siPaquet('BALAYAGE — 112 cas d\'unités à DEUX propriétés, et d\'écartées du décompte', (p) => {
  // ⭐ « Au moins une unité ÉCARTÉE DU DÉCOMPTE QUI PORTE QUAND MÊME LA PROPRIÉTÉ
  //    MESURÉE » : une `inverifiable` peut être `erronee` ou `plaque`. Elle sort
  //    du dénominateur, et une mutation qui la garderait tombe ici.
  assert.ok(p.balayage_cascade_croisee.length >= 100)
  for (const cas of p.balayage_cascade_croisee) rejoueP2(cas, 'cascade croisée')
})

siPaquet('BALAYAGE — les deux portes du haut, sur 230 couples (n, inverifiable)', (p) => {
  assert.ok(p.balayage_portes.length >= 200)
  for (const cas of p.balayage_portes) rejoueP2(cas, 'portes')
})

siPaquet('BALAYAGE — ⭐ LES ÉGALITÉS EXACTES DU FORMATAGE `%.1f` / `%.2f`', (p) => {
  for (const cas of p.balayage_formatage) rejoueP2(cas, 'formatage')
  // L'écart, nommé : `toFixed` aurait écrit 6.3, 31.3 et 0.63.
  const trace = (n: string) => p.balayage_formatage.find((c) => c.nom.startsWith(n))!
    .attendu.code2.trace.join('\n')
  assert.match(trace('formatage n=16 inv=1'), /part 6\.2 %/)
  assert.match(trace('formatage n=16 inv=5'), /PORTE 1 fermée : 31\.2 %/)
  assert.match(trace('formatage n=40 inv=8'), /rapport 0\.62\)/)
})

siPaquet('BALAYAGE — 108 couples (registres, sources) contre trois jeux de paramètres', (p) => {
  assert.ok(p.balayage_diversite.length >= 100)
  for (const cas of p.balayage_diversite) rejoueP2(cas, 'diversité')
})

siPaquet('BALAYAGE — ⭐⭐ 108 cas AUX SEUILS DÉPLACÉS, parce qu\'un seuil provisoire bougera', (p) => {
  // ⭐⭐ ET C'EST L'ÉPREUVE NÉGATIVE QUI L'A EXIGÉ. Inverser la PORTE 2 en `>=`
  //    SURVIVAIT à tout le reste : vérifié par énumération jusqu'à n = 4000,
  //    AUCUN couple (unités, invérifiables) ne met le rapport EXACTEMENT à 4,5
  //    sans que la PORTE 1 ait déjà arrêté la copie. La stricte inégalité y
  //    contrôlait un CHEMIN MORT — « cherche toujours si la règle que tu
  //    éprouves est ATTEIGNABLE ». Elle redevient atteignable dès que le seuil
  //    bouge, et cinq des six paramètres sont *provisoire (réglage empirique)*.
  assert.ok(p.balayage_seuils_deplaces.length >= 100)
  for (const cas of p.balayage_seuils_deplaces) rejoueP2(cas, 'seuils déplacés')
})

siPaquet('BALAYAGE — les seize croisements, sans trou et sans doublon de trace', (p) => {
  assert.equal(p.balayage_croisement.length, 16)
  for (const c of p.balayage_croisement) {
    // Le croisement n'est pas exporté : on le traverse par `code2`, comme la
    // chaîne le fait. Les seize couples se rejouent au balayage de la cascade et
    // de la diversité ; ici on vérifie seulement que le module les couvre tous.
    assert.ok(NIVEAUX.includes(c.niveau as typeof NIVEAUX[number]), c.niveau)
    assert.equal(c.trace.length, 1)
  }
  assert.equal(new Set(p.balayage_croisement.map((c) => c.niveau)).size, 5)
})

siPaquet('BALAYAGE — 37 formes de `_n`, blancs de Python et conteneurs compris', (p) => {
  // `_n` n'est pas exporté : on l'éprouve PAR LES CROCHETS, en glissant chaque
  // forme dans le champ qu'elle est censée normaliser.
  for (const cas of p.balayage_normalisation) {
    const c1 = BRANCHEMENT_CONNAISSANCE.code1(
      { p1: { unites_mobilisees: [{ u: 1, type: cas.entree, source: 'S', citation: 'x', emploi: 'y' }] } },
      ctxDe())
    const attendu = CATALOGUE.types_unite.includes(cas.n) ? 1 : 0
    assert.equal(c1.mesures.registres, attendu,
      `« ${JSON.stringify(cas.entree)} » → _n = « ${cas.n} » : registre compté ?`)
  }
})

siPaquet('BALAYAGE — 39 relevés passés à `code1`', (p) => {
  assert.ok(p.balayage_code1.length >= 39)
  for (const cas of p.balayage_code1) rejoueCode1(cas, 'code1')
})

siPaquet('BALAYAGE — 26 étendues, dans et hors du contexte de restitution', (p) => {
  for (const cas of p.balayage_etendue) rejoueP2(cas, 'étendue')
})

siPaquet('BALAYAGE — 16 formes d\'appariement relevé ↔ jugement', (p) => {
  for (const cas of p.balayage_appariement) rejoueP2(cas, 'appariement')
})

siPaquet('`pre_p1` — le pré-relevé mécanique, sur 15 productions', (p) => {
  // ⚠️⚠️ LE MODULE PREND LE TEXTE, LE CONTRAT PASSE LE CONTEXTE : dette de source
  //    marquée, jamais corrigée. Le portage suit LE CONTRAT et lit la copie dans
  //    le contexte — « ce que le module veut dire ».
  const spec = BRANCHEMENT_CONNAISSANCE.extractions(ctxDe())[0]
  for (const cas of p.pre_p1_cas) {
    const rendu = spec.pre!(ctxDe({}, { copie: cas.texte }))
    assert.deepEqual(rendu, cas.attendu, `pre_p1 sur ${JSON.stringify(cas.texte)}`)
  }
})

siPaquet('`pre_p2` — les trois métadonnées, sur 21 contextes × paramètres', (p) => {
  for (const cas of p.pre_p2_cas) {
    const contexte: Record<string, string> = {}
    for (const [k, v] of Object.entries(cas.contexte ?? {})) {
      if (typeof v === 'string') contexte[k] = v
    }
    // Le contexte de la chaîne n'a pas de clé absente : une clé que l'exercice
    // ne porte pas est `undefined`, et c'est le `None` de Python.
    const ctx = ctxDe(cas.params ?? {}, {
      consigne: contexte.consigne ?? '', corpus_cours: contexte.corpus_cours ?? '',
    })
    const rendu = BRANCHEMENT_CONNAISSANCE.jugement(ctx).preP2!(ctx)
    assert.deepEqual(rendu, cas.attendu,
      `pre_p2 ${JSON.stringify(cas.contexte)} / ${JSON.stringify(cas.params)}`)
  }
})

siPaquet('`conformite` — 14 cas, les quatre choses qu\'il a à dire', (p) => {
  for (const cas of p.conformite_cas) {
    // ⚠️ `sortie_code1` À `null` EST UN CAS DU MODULE, et il se passe tel quel :
    //    son garde est `isinstance(sortie_code1, dict)`, donc le contrôle de
    //    fidélité ne tourne pas du tout. Le transformer en `{}` ici masquerait
    //    précisément le garde qu'on éprouve.
    const c1 = cas.sortie_code1 as unknown as SortieCode1
    const rendu = BRANCHEMENT_CONNAISSANCE.conformite!(
      { p1: cas.sortie_p1 }, cas.entree_p2, c1, { verdicts: {}, trace: [], alertes: [] }, ctxDe())
    assert.deepEqual(rendu, cas.attendu, `conformite/${cas.nom}`)
  }
})

// ════════════════════════════════════════════════════════════════════════════
// L'ÉPREUVE NÉGATIVE — les assertions adossées À LA FICHE
// ----------------------------------------------------------------------------
// « Un vecteur gold ne prouve que ce qu'il couvre. » Le balayage ci-dessus dit
// que les deux côtés s'accordent ; il ne dit pas qu'ils ont raison — ils
// s'accorderaient sur la même erreur si le portage l'avait recopiée. Ce qui
// suit fixe chaque règle de la fiche sur un cas DISCRIMINANT :
//   · des comptes ASYMÉTRIQUES — jamais un par population ;
//   · au moins un élément ÉCARTÉ DU DÉCOMPTE QUI PORTE LA PROPRIÉTÉ mesurée ;
//   · pour les binaires, un seul terme d'un « et » présent à la fois.
// ════════════════════════════════════════════════════════════════════════════

/** Un lot d'unités jugées, aux natures et aux comptes choisis. */
function unites(spec: Array<[number, Objet]>): Objet[] {
  const out: Objet[] = []
  let k = 0
  for (const [n, forme] of spec) {
    for (let i = 0; i < n; i += 1) {
      k += 1
      out.push({
        u: k, justesse: 'juste', attribution: 'correcte', apropos: 'sert_le_propos',
        referent: 'cours', ...forme,
      })
    }
  }
  return out
}

function c1De(us: Objet[], reg = 3, src = 3, resti = 0): SortieCode1 {
  return {
    mesures: { registres: reg, sources: src, restitution_de_cours: resti, n_unites: us.length },
    document_p2: { unites_mobilisees: us.map((u) => ({ u: u.u })) },
    alertes: [],
  }
}

function joue(us: Objet[], opts: { reg?: number; src?: number; resti?: number; etendue?: string } = {}) {
  const ctx = ctxDe()
  const c1 = c1De(us, opts.reg ?? 3, opts.src ?? 3, opts.resti ?? 0)
  const p2: Objet = { unites: us }
  if (opts.etendue !== undefined) p2.etendue = opts.etendue
  const c2 = BRANCHEMENT_CONNAISSANCE.code2(p2, c1, ctx)
  return { c2, releve: BRANCHEMENT_CONNAISSANCE.releve(c2, ctx).releve }
}

test('FICHE §4 — « au moins UN contresens » fait défaillir, la MAJORITÉ effondre', () => {
  // Asymétrique : 1 faux sur 5, puis 3 sur 5. Le seuil est la MAJORITÉ STRICTE.
  assert.equal(joue(unites([[4, {}], [1, { justesse: 'contresens' }]])).c2.verdicts.justesse,
    'défaillance')
  assert.equal(joue(unites([[2, {}], [3, { justesse: 'contresens' }]])).c2.verdicts.justesse,
    'défaillance forte')
  // La stricte égalité N'EST PAS une majorité : 2 sur 4.
  assert.equal(joue(unites([[2, {}], [2, { justesse: 'contresens' }]])).c2.verdicts.justesse,
    'défaillance')
})

test('FICHE §4 — une attribution `erronee` compte comme un contresens, `absente` NON', () => {
  // Deux termes d'un « ou », un seul présent à la fois.
  assert.equal(joue(unites([[3, {}], [1, { attribution: 'erronee' }]])).c2.verdicts.justesse,
    'défaillance')
  // `absente` est un défaut qui FERME LE HAUT, sans faire défaillir.
  assert.equal(joue(unites([[3, {}], [1, { attribution: 'absente' }]])).c2.verdicts.justesse,
    'satisfaite')
  // RF17 — `n/a` n'est PAS `absente` : il n'y avait RIEN à attribuer.
  assert.equal(joue(unites([[3, {}], [1, { attribution: 'n/a' }]])).c2.verdicts.justesse, 'haut')
})

test('FICHE §4 — les `inverifiable` SORTENT des majorités, PAS de la mesure', () => {
  // ⭐ L'ÉLÉMENT ÉCARTÉ DU DÉCOMPTE QUI PORTE QUAND MÊME LA PROPRIÉTÉ : deux
  //    unités invérifiables ET fausses, plus une seule faute jugée sur trois
  //    jugées. Un portage qui les compterait dans les majorités rendrait
  //    « défaillance forte » (3 fausses sur 5) ; la fiche dit « défaillance ».
  const r = joue(unites([
    [2, {}],
    [1, { justesse: 'contresens' }],
    [2, { justesse: 'inverifiable', attribution: 'erronee', referent: 'modele' }],
  ]))
  assert.equal(r.c2.verdicts.justesse, 'défaillance')
  // Et elles restent au relevé : le dénominateur des invérifiables est celui du
  // RELEVÉ, pas celui des jugées.
  assert.equal(r.releve.inverifiable, 2)
  assert.equal(r.releve[DENOM_RELEVE], 5)
  assert.equal(r.releve[DENOM_JUGEES], 3)
  assert.equal(r.releve.contresens, 1)
})

test('FICHE §4 — les DEUX PORTES du haut, et chacune attrape ce que l\'autre laisse', () => {
  // « Une copie de cinq unités dont une est invérifiable n'appuie son "tout est
  //   juste" que sur quatre unités jugées ; une copie de dix dont deux le sont
  //   l'appuie sur huit — MÊME PROPORTION, et pourtant la première ne doit pas
  //   passer. » C'est le vecteur discriminant de la porte 2.
  assert.equal(joue(unites([[4, {}], [1, { justesse: 'inverifiable', referent: 'modele' }]]))
    .c2.verdicts.justesse, 'satisfaite')
  assert.equal(joue(unites([[8, {}], [2, { justesse: 'inverifiable', referent: 'modele' }]]))
    .c2.verdicts.justesse, 'haut')
  // Et le discriminant de la PORTE 1 : 26 unités, 14 invérifiables — le rapport
  // passerait (4,49 ≤ 4,5), la proportion non (53,8 % > 25 %).
  const p1 = joue(unites([[12, {}], [14, { justesse: 'inverifiable', referent: 'modele' }]]))
  assert.equal(p1.c2.verdicts.justesse, 'satisfaite')
  assert.ok(p1.c2.trace.some((t) => t.includes('PORTE 1 fermée')),
    'la PORTE 1 doit NOMMER la cause — « l\'ordre ne change pas le verdict, il nomme la cause »')
})

test('FICHE §4 — les portes ne s\'ouvrent QUE s\'il existe un `inverifiable`', () => {
  const r = joue(unites([[5, {}]]))
  assert.equal(r.c2.verdicts.justesse, 'haut')
  assert.ok(r.c2.trace.some((t) => t.includes('aucun inverifiable')))
})

test('FICHE §4 — `plaque` majoritaire fait défaillir, et compte QUAND MÊME dans la Diversité', () => {
  // « La double peine serait une erreur » : l'unité plaquée a bien été mobilisée.
  const r = joue(unites([[1, {}], [3, { apropos: 'plaque' }]]))
  assert.equal(r.c2.verdicts.justesse, 'défaillance')
  assert.equal(r.c2.verdicts.diversite, 'haut')
  assert.equal(r.c2.verdicts.niveau, 'Moyen')
  assert.equal(r.c2.verdicts.profil_moyen, 'large-mais-decoratif')
  // Une seule plaquée sur quatre : pas de majorité, et le haut reste fermé.
  const r2 = joue(unites([[3, {}], [1, { apropos: 'plaque' }]]))
  assert.equal(r2.c2.verdicts.justesse, 'satisfaite')
})

test('FICHE §4 — `approximative` majoritaire fait défaillir (RF14), et le PLAQUÉ l\'emporte', () => {
  assert.equal(joue(unites([[6, { justesse: 'approximative' }]])).c2.verdicts.profil_moyen,
    'large-mais-approximatif')
  assert.equal(joue(unites([[5, {}], [1, { justesse: 'approximative' }]])).c2.verdicts.justesse,
    'satisfaite')
  // Les deux champs sont ORTHOGONAUX ; quand les deux majorités coexistent, c'est
  // le plaqué qui nomme le profil — « comme dans la cascade, où il est écrit avant ».
  assert.equal(joue(unites([
    [5, { justesse: 'approximative', apropos: 'plaque' }], [3, {}],
  ])).c2.verdicts.profil_moyen, 'large-mais-decoratif')
})

test('FICHE §4 — le GARDE-FOU du contresens ne mord que sur DEUX des seize croisements', () => {
  // « Un éventail ne rachète pas l'erreur » : Diversité haute, Justesse effondrée.
  const r = joue(unites([[1, {}], [3, { justesse: 'contresens' }]]), { reg: 3, src: 3 })
  assert.equal(r.c2.verdicts.diversite, 'haut')
  assert.equal(r.c2.verdicts.justesse, 'défaillance forte')
  assert.equal(r.c2.verdicts.niveau, 'Faible')
  assert.ok(r.c2.trace.some((t) => t.startsWith('GARDE-FOU')))
  // Il ne mord PAS quand la Diversité est déjà en défaut : Faible s'y trouve déjà.
  const r2 = joue(unites([[1, {}], [3, { justesse: 'contresens' }]]), { reg: 1, src: 1 })
  assert.equal(r2.c2.verdicts.niveau, 'Faible')
  assert.ok(!r2.c2.trace.some((t) => t.startsWith('GARDE-FOU')))
})

test('FICHE §4 — la Diversité lit DEUX comptes distincts, jamais le nombre d\'unités', () => {
  // Populations de TAILLES DIFFÉRENTES : 4 registres possibles, 20 sources, et
  // trois unités seulement. Une mutation qui échangerait les deux tombe ici.
  assert.equal(joue(unites([[3, {}]]), { reg: 1, src: 9 }).c2.verdicts.diversite, 'défaillance')
  assert.equal(joue(unites([[3, {}]]), { reg: 3, src: 2 }).c2.verdicts.diversite, 'satisfaite')
  assert.equal(joue(unites([[3, {}]]), { reg: 3, src: 3 }).c2.verdicts.diversite, 'haut')
  assert.equal(joue(unites([[3, {}]]), { reg: 2, src: 9 }).c2.verdicts.diversite, 'satisfaite')
})

test('FICHE §2 — les cinq paliers, et le croisement qui les produit', () => {
  assert.equal(joue([]).c2.verdicts.niveau, 'Absent')
  assert.equal(joue(unites([[1, {}], [3, { justesse: 'contresens' }]]), { reg: 1, src: 1 })
    .c2.verdicts.niveau, 'Faible')
  assert.equal(joue(unites([[4, {}]]), { reg: 1, src: 1 }).c2.verdicts.niveau, 'Moyen')
  assert.equal(joue(unites([[4, {}], [1, { attribution: 'absente' }]]), { reg: 3, src: 3 })
    .c2.verdicts.niveau, 'Bon')
  assert.equal(joue(unites([[4, {}]]), { reg: 3, src: 3 }).c2.verdicts.niveau, 'Acquis')
  // Et LA LETTRE — `00-referentiel.md` §2, E/D/C/B/A.
  const ctx = ctxDe()
  const lettre = (us: Objet[], reg: number, src: number) => BRANCHEMENT_CONNAISSANCE.lettre(
    BRANCHEMENT_CONNAISSANCE.code2({ unites: us }, c1De(us, reg, src), ctx), ctx)
  assert.equal(lettre([], 0, 0), 'E')
  assert.equal(lettre(unites([[4, {}]]), 1, 1), 'C')
  assert.equal(lettre(unites([[4, {}]]), 3, 3), 'A')
})

test('FICHE §5 — LES HUIT OBSERVABLES DE TÉLÉMÉTRIE ont une valeur, et les DEUX dénominateurs aussi', () => {
  // ⚠️⚠️ « Un observable oublié ne lève aucune erreur — il rend `n/a`, et `n/a`
  //    SORT DU DÉNOMINATEUR du taux. » La parade est ici.
  const r = joue(unites([
    [3, {}],
    [1, { justesse: 'contresens' }],
    [2, { apropos: 'plaque' }],
    [2, { justesse: 'inverifiable', referent: 'modele' }],
  ]), { reg: 3, src: 4, resti: 1, etendue: 'lacunaire' })
  for (const code of OBSERVABLES_TELEMETRIE) {
    assert.ok(code in r.releve, `« ${code} » manque au relevé`)
    assert.notEqual(r.releve[code], undefined, `« ${code} » est indéfini`)
  }
  assert.equal(r.releve.mobilisation, 8)
  assert.equal(r.releve.diversite_registres, 3)
  assert.equal(r.releve.diversite_sources, 4)
  // 6 jugées, dont 3 justes… et les 2 plaquées sont justes aussi → 5/6.
  assert.equal(r.releve[DENOM_JUGEES], 6)
  assert.equal(r.releve[DENOM_RELEVE], 8)
  assert.equal(r.releve.contresens, 1)
  assert.equal(r.releve.unite_plaquee, 2)
  assert.equal(r.releve.inverifiable, 2)
  assert.equal(r.releve.taux_justesse, 5 / 6)
  assert.equal(r.releve.etendue_rappel, 'lacunaire')
})

test('FICHE §5 — `taux_justesse` exclut les `inverifiable` DU DÉNOMINATEUR, et rend `n/a` sur zéro jugée', () => {
  // ⭐ La SEULE `proportion` de la fiche, et elle NOMME sa population, exclusion
  //    comprise : « proportion d'unités `juste`, les `inverifiable` hors du
  //    dénominateur » (§5) — et le `sens` du bloc machine dit la même chose.
  //    Rien à arbitrer, et le cas discriminant le fixe : 2 justes, 1 approximative,
  //    3 invérifiables. Sur le relevé entier ce serait 2/6 = 0,33 ; sur les
  //    jugées, 2/3 = 0,67 — de part et d'autre du seuil de 0,5.
  const r = joue(unites([
    [2, {}], [1, { justesse: 'approximative' }],
    [3, { justesse: 'inverifiable', referent: 'modele' }],
  ]))
  assert.equal(r.releve.taux_justesse, 2 / 3)
  // Toutes invérifiables : aucune jugée → `null`, donc `n/a`, JAMAIS 0.
  const vide = joue(unites([[3, { justesse: 'inverifiable', referent: 'modele' }]]))
  assert.equal(vide.releve.taux_justesse, null)
  assert.equal(vide.releve[DENOM_JUGEES], 0)
  // Copie sans unité : tout est nul ou zéro, et rien n'est inventé.
  const sansUnite = joue([])
  assert.equal(sansUnite.releve.mobilisation, 0)
  assert.equal(sansUnite.releve.taux_justesse, null)
  assert.equal(sansUnite.releve[DENOM_RELEVE], 0)
})

test('FICHE §5 — `etendue_rappel` n\'est servie QU\'EN CLASSE, et sort en `n/a` sinon', () => {
  const us = unites([[3, {}]])
  // Hors restitution : la valeur est ÉCARTÉE et signalée, et le relevé rend
  // `null` — donc `n/a`, jamais une valeur hors de son échelle.
  const hors = joue(us, { resti: 0, etendue: 'lacunaire' })
  assert.equal(hors.c2.verdicts.etendue, 'n/a')
  assert.equal(hors.releve.etendue_rappel, null)
  assert.ok(hors.c2.alertes.some((a) => a.includes('hors contexte de restitution')))
  // En restitution : elle passe.
  assert.equal(joue(us, { resti: 1, etendue: 'fragmentaire' }).releve.etendue_rappel, 'fragmentaire')
  // Hors liste fermée : écartée, signalée, et `null` au relevé.
  const faux = joue(us, { resti: 1, etendue: 'partielle' })
  assert.equal(faux.c2.verdicts.etendue, null)
  assert.equal(faux.releve.etendue_rappel, null)
  assert.ok(faux.c2.alertes.some((a) => a.includes('hors liste fermée')))
})

test('CONTRAT §3 — un PASSAGE MANQUÉ ne compose AUCUN verdict, et le dit au relevé', () => {
  const us = unites([[3, {}]])
  const ctx = ctxDe()
  const c1 = c1De(us)
  // Le juge n'a rendu que deux unités sur trois.
  const c2 = BRANCHEMENT_CONNAISSANCE.code2({ unites: us.slice(0, 2) }, c1, ctx)
  assert.deepEqual(c2.verdicts,
    Object.fromEntries(OBSERVABLES_MODULE.map((o) => [o, null])))
  assert.ok(c2.alertes.some((a) => a.startsWith('PASSAGE MANQUÉ — ')))
  assert.equal(BRANCHEMENT_CONNAISSANCE.lettre(c2, ctx), null)
  const { releve, alertes } = BRANCHEMENT_CONNAISSANCE.releve(c2, ctx)
  // Ce que CODE1 a compté reste vrai — c'est un fait du relevé de P1.
  assert.equal(releve.mobilisation, 3)
  assert.equal(releve.diversite_registres, 3)
  // Ce que le JUGE nourrit n'a pas eu lieu : `n/a`, et une ALERTE NOMMÉE.
  for (const c of ['taux_justesse', 'contresens', 'unite_plaquee', 'inverifiable', 'etendue_rappel']) {
    assert.equal(releve[c], undefined, `« ${c} » ne doit porter aucune valeur`)
    assert.ok(alertes.some((a) => a.startsWith(`${c} : `)), `« ${c} » doit avoir son alerte nommée`)
  }
})

test('CONTRAT §3 — les TROIS CLÉS PUBLIQUES, et le canal privé à tiret bas', () => {
  const { c2 } = joue(unites([[3, {}]]))
  const publiques = Object.keys(c2).filter((k) => !k.startsWith('_')).sort()
  assert.deepEqual(publiques, ['alertes', 'trace', 'verdicts'])
  assert.ok('_telemetrie' in c2, 'la télémétrie passe par un canal PRIVÉ, à tiret bas')
  // Les clés des verdicts sont EXACTEMENT les observables du module.
  assert.deepEqual(Object.keys(c2.verdicts).sort(), [...OBSERVABLES_MODULE].sort())
})

test('CONTRAT §2 — `code1` rend TOUJOURS la clé `document_p2`, même sur un P1 illisible', () => {
  for (const p1 of [undefined, null, 'texte', 42, [1, 2], {}]) {
    const c1 = BRANCHEMENT_CONNAISSANCE.code1({ p1 }, ctxDe())
    assert.ok('document_p2' in c1,
      `« document_p2 » manque sur ${JSON.stringify(p1)} — « le seul défaut dont rien ne témoigne »`)
  }
})

test('FICHE §3 — une unité sans citation N\'EXISTE PAS, et sort de TOUS les comptes', () => {
  const c1 = BRANCHEMENT_CONNAISSANCE.code1({
    p1: {
      unites_mobilisees: [
        { u: 1, type: 'reference', source: 'Kant', citation: 'il dit ceci', emploi: 'y' },
        { u: 2, type: 'concept', source: 'Hume', citation: '', emploi: 'y' },
        { u: 3, type: 'exemple', source: 'Rousseau', citation: '   ', emploi: 'y' },
      ],
    },
  }, ctxDe())
  // Une seule unité valide : un registre, une source — les deux autres ne
  // comptent NI dans la diversité, NI dans la justesse, NI dans le niveau.
  assert.equal(c1.mesures.n_unites, 1)
  assert.equal(c1.mesures.registres, 1)
  assert.equal(c1.mesures.sources, 1)
  assert.equal((c1.document_p2 as { unites_mobilisees: unknown[] }).unites_mobilisees.length, 1)
  assert.equal(c1.alertes.filter((a) => a.includes('sans citation')).length, 2)
})

test('FICHE §3 — le compte de SOURCES porte sur les CHAÎNES, et l\'inclusion est SIGNALÉE', () => {
  const c1 = BRANCHEMENT_CONNAISSANCE.code1({
    p1: {
      unites_mobilisees: [
        { u: 1, type: 'reference', source: 'Kant', citation: 'x', emploi: 'y' },
        { u: 2, type: 'concept', source: 'Emmanuel Kant', citation: 'x', emploi: 'y' },
        { u: 3, type: 'exemple', source: 'E. Kant', citation: 'x', emploi: 'y' },
      ],
    },
  }, ctxDe())
  // ⛔ LE COMPTE N'EST PAS TOUCHÉ — « une fusion fausse coûterait une source à
  //    l'élève, et c'est le mauvais sens d'erreur ».
  assert.equal(c1.mesures.sources, 3)
  const inclusions = c1.alertes.filter((a) => a.startsWith('SOURCES_PEUT_ETRE_IDENTIQUES'))
  assert.equal(inclusions.length, 2)
  // L'alerte NOMME la paire : « le professeur tranche ».
  assert.ok(inclusions.every((a) => a.includes('kant')))
})

test('⭐ LES BLANCS DE PYTHON décident si une unité existe — et JavaScript ne les voit pas', () => {
  // Une citation faite d'un NEL seul (U+0085) : blanc POUR PYTHON, pas pour
  // `String.prototype.trim()`. Un portage naïf garderait l'unité, compterait son
  // registre et sa source, et changerait la Diversité — sans un symptôme.
  const nel = BRANCHEMENT_CONNAISSANCE.code1({
    p1: { unites_mobilisees: [{ u: 1, type: 'reference', source: 'Kant', citation: '', emploi: 'y' }] },
  }, ctxDe())
  assert.equal(nel.mesures.n_unites, 0, 'un NEL seul est un blanc pour Python : pas de citation')
  // Et l'inverse : la BOM (U+FEFF) est un blanc pour JavaScript, PAS pour Python.
  const bom = BRANCHEMENT_CONNAISSANCE.code1({
    p1: { unites_mobilisees: [{ u: 1, type: 'reference', source: 'Kant', citation: '﻿', emploi: 'y' }] },
  }, ctxDe())
  assert.equal(bom.mesures.n_unites, 1, 'une BOM n\'est PAS un blanc pour Python : l\'unité existe')
})

test('⭐ LA BOM EST LE SEUL BLANC QUI SÉPARE `strip()` DE PYTHON ET `trim()` DE JS', () => {
  // ⭐⭐ TROUVÉ PAR L'ÉPREUVE NÉGATIVE : remplacer `strip()` par `trim()` dans
  //    `_n` SURVIVAIT à tout le balayage. Le `.strip()` initial est en effet
  //    REDONDANT avec le `split()` final — les deux retirent les blancs de
  //    Python. Il ne cesse de l'être que sur la BOM (U+FEFF), que `trim()` mange
  //    et que `strip()` garde. Vérifié en Python : `_n('\ufeffreference')` vaut
  //    `'\ufeffreference'`, qui n'est dans AUCUN catalogue.
  const bom = BRANCHEMENT_CONNAISSANCE.code1({
    p1: { unites_mobilisees: [{ u: 1, type: '\ufeffreference', source: 'K', citation: 'x', emploi: 'y' }] },
  }, ctxDe())
  assert.equal(bom.mesures.registres, 0, 'une BOM n\'est pas un blanc pour Python : le type reste hors catalogue')
  assert.ok(bom.alertes.some((a) => a.includes('hors catalogue')))
  // Et le NEL, lui, EST un blanc pour Python : le type passe.
  const nel = BRANCHEMENT_CONNAISSANCE.code1({
    p1: { unites_mobilisees: [{ u: 1, type: '\u0085reference\u0085', source: 'K', citation: 'x', emploi: 'y' }] },
  }, ctxDe())
  assert.equal(nel.mesures.registres, 1)
  assert.deepEqual(nel.alertes, [])
})

test('⭐ `str()` D\'UN CONTENEUR — un `type` rendu en LISTE n\'est pas un registre', () => {
  // Python : `str(["reference"])` vaut `"['reference']"`, qui n'est dans aucun
  // catalogue. `String(["reference"])` de JavaScript vaut `"reference"` — le
  // registre serait compté, et AUCUNE alerte ne le dirait.
  const c1 = BRANCHEMENT_CONNAISSANCE.code1({
    p1: { unites_mobilisees: [{ u: 1, type: ['reference'], source: 'K', citation: 'x', emploi: 'y' }] },
  }, ctxDe())
  assert.equal(c1.mesures.registres, 0)
  assert.ok(c1.alertes.some((a) => a.includes("['reference']") && a.includes('hors catalogue')))
})

test('⭐ UNE CHAÎNE EST ITÉRABLE EN PYTHON — et `len()` d\'une chaîne compte ses caractères', () => {
  // `unites_mobilisees: "abc"` — Python y voit TROIS éléments, chacun illisible.
  const c1 = BRANCHEMENT_CONNAISSANCE.code1({
    p1: { unites_mobilisees: 'abc', mentions_vides: 'xy' },
  }, ctxDe())
  assert.equal(c1.alertes.filter((a) => a === 'unité du relevé illisible, écartée des comptes').length, 3)
  assert.equal(c1.mesures.n_mentions_vides, 2)
})

test('⭐ LE FORMATAGE `%.1f` TRANCHE AU PAIR — une unité sur seize fait 6,2 %, jamais 6,3', () => {
  const seize = joue(unites([[15, {}], [1, { justesse: 'inverifiable', referent: 'modele' }]]))
  assert.ok(seize.c2.trace.some((t) => t.includes('part 6.2 %')),
    `trace attendue avec « part 6.2 % » : ${JSON.stringify(seize.c2.trace)}`)
  const cinqSurSeize = joue(unites([[11, {}], [5, { justesse: 'inverifiable', referent: 'modele' }]]))
  assert.ok(cinqSurSeize.c2.trace.some((t) => t.includes('31.2 %')),
    `trace attendue avec « 31.2 % » : ${JSON.stringify(cinqSurSeize.c2.trace)}`)
})

test('CONTRAT §2 — `pre_p2` sert `null` quand le contexte ne porte pas le corpus', () => {
  // ⚠️⚠️ ET LA CHAÎNE N'EN PORTE AUCUN AUJOURD'HUI : `corpus_cours` n'est fourni
  //    par aucun natif, et la fiche l'écrit à son §8 parmi ses VRAIES QUESTIONS
  //    OUVERTES — « le corpus de cours n'est déclaré dans aucune source qui fait
  //    foi ». Servi à `null`, il ARRÊTE la mesure en nommant le slot, plutôt que
  //    de servir un vide au juge.
  const sans = ctxDe({}, { consigne: 'Expliquez.' })
  assert.deepEqual(BRANCHEMENT_CONNAISSANCE.jugement(sans).preP2!(sans), {
    restitution_de_cours: 'non', consigne: 'Expliquez.', corpus_cours: null,
  })
  const avec = ctxDe({ restitution_de_cours: 1 },
    { consigne: 'Expliquez.', corpus_cours: 'Le cours dit ceci.' })
  assert.deepEqual(BRANCHEMENT_CONNAISSANCE.jugement(avec).preP2!(avec), {
    restitution_de_cours: 'oui', consigne: 'Expliquez.', corpus_cours: 'Le cours dit ceci.',
  })
})

test('LE BRANCHEMENT — sept slots, deux crochets, et AUCUN `delta`', () => {
  const ctx = ctxDe()
  const [p1] = BRANCHEMENT_CONNAISSANCE.extractions(ctx)
  assert.equal(p1.tetePrompt, 'P1')
  assert.deepEqual([...p1.slotsFournis].sort(), ['pre_releve', 'production'])
  assert.ok(p1.pre, 'le crochet pré-phase de P1 sert deux des trois slots')
  const p2 = BRANCHEMENT_CONNAISSANCE.jugement(ctx)
  assert.equal(p2.tetePrompt, 'P2')
  assert.deepEqual([...(p2.slotsFournis ?? [])].sort(),
    ['consigne', 'corpus_cours', 'restitution_de_cours'])
  // ⛔ `delta` N'EST PAS DÉCLARÉ : la fiche ne dit NULLE PART ce que « comparer
  //    deux squelettes » veut dire pour elle — le mot n'y figure pas une fois.
  //    La chaîne le dit par une alerte et laisse NULL. NULL n'est pas 0.
  assert.equal(BRANCHEMENT_CONNAISSANCE.delta, undefined)
})
