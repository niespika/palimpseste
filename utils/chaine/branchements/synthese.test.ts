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
//    chemin de calcul a changé, même quand le verdict tombe juste.* `code1` est
//    comparé sur SES trois clés aussi : `mesures`, `document_p2`, `alertes`.
//
// ⚠️⚠️ LA SYNTHÈSE N'A NI GOLD, NI COPIE, NI CRITÈRE, NI RUN STOCKÉ —
//    `VERSION_GOLDS_TESTEE` vaut `None`, `TESTS_P2_PARFAIT` est VIDE, et son
//    dossier ne porte que ses trois prompts et son module. Sa fiche l'écrit :
//    « aucun run n'a jamais tourné sur cet instrument, et les trois prompts sont
//    neufs » (§8). C'est donc LE BALAYAGE qui porte la preuve — plus de mille
//    cas de plus, passés dans LA MÊME FONCTION DU MÊME MODULE : il n'invente
//    aucune règle, il cesse de ne la lui demander que vingt fois.
//
// ⭐ ET LES ASSERTIONS « FICHE » QUI LE SUIVENT SONT L'ÉPREUVE NÉGATIVE. Un
//    portage qui inverserait une règle passerait le balayage — les deux côtés
//    s'accorderaient sur la même erreur si l'erreur était dans les deux. Ce sont
//    les assertions adossées À LA FICHE, sur des cas ASYMÉTRIQUES et portant au
//    moins un élément ÉCARTÉ DES NUMÉRATEURS QUI PORTE QUAND MÊME LA PROPRIÉTÉ,
//    qui font tomber une mutation. ⭐⭐ Et on les fait D'ABORD SUR LA TÉLÉMÉTRIE :
//    c'est là que les quatre portages précédents ont trouvé leurs survivantes.
//    ⭐ On assère LA VALEUR d'un observable, jamais sa seule présence — la
//    survivante du cinquième portage passait parce que le test vérifiait qu'un
//    observable existe et n'est pas `n/a`, jamais ce qu'il vaut.
//
// ⭐ LÀ OÙ LE MODULE LÈVE, LE PORTAGE REND UNE ALERTE. Le contrat §3 pose que
//    « le module ne lève jamais d'exception : elle traverserait le banc et
//    emporterait la trace avec elle ». Le harnais Python CONSIGNE ses levées —
//    quinze sur mille deux cents — et le test assère ici que le portage, lui,
//    les traverse en nommant ce qu'il a écarté.
//
// ⚠️ CE N'EST PAS UNE FIXTURE FIGÉE. Le harnais Python
//    (`scripts/vecteurs-synthese.py`) rejoue le module À CHAQUE EXÉCUTION : le
//    jour où le module bouge — un seuil, une règle, un ordre —, ce test le dit.
//    Un jeu d'attendus recopié ici aurait pourri en silence, et « des vecteurs
//    qui pourrissent en silence valideraient le calcul contre une référence
//    morte » (`CONTRAT-MODULES.md` §5).
//
// ⚠️ Sans le dépôt de conception sous la main, le test SE SAUTE — il ne crie pas
//    faux. C'est le même patron que le contrôle de dérivation.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  BRANCHEMENT_SYNTHESE, CATALOGUE, PARAMS_DEFAUT, ORDRE_PALIERS, OBSERVABLES_MODULE,
  OBSERVABLES_TELEMETRIE, OBSERVABLES_TEXTE_SEULEMENT, DENOM_APPORTS,
  DENOM_UNITES_APPARIEES, LETTRE_DU_NIVEAU, prePhase1a, prePhase1b,
  recouvrements, _borneBasse,
} from './synthese'
import { INSTRUMENT_SYNTHESE } from '../derive/competences/synthese'
import { appliquerObservablesMesure, statutDeLaMesure, valeurDe } from '../observables'
import type {
  ContexteBranchement, EntreeObservableMesure, InstrumentCompetence, SortieCode1,
} from '../instruments'

// ⚠️ Le dépôt de conception vit à un chemin ABSOLU hors de ce dépôt. Le fixer en
// dur ici faisait SAUTER le contrôle partout ailleurs que sur la machine du
// professeur — et un `npm test` vert sans le contrôle ne prouve rien (C4-L11).
const RACINE_CONCEPTION = process.env.PALIMPSESTE_RACINE_CONCEPTION
  || '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

type Objet = Record<string, unknown>

interface CasJoue {
  nom: string
  groupe: string
  p1: Objet
  p2: unknown
  contexte: Objet
  params: Record<string, number>
  referent_derive?: string
  leve?: string
  code1?: { mesures: Objet; document_p2: unknown; alertes: string[] }
  code2?: { verdicts: Objet; trace: string[]; alertes: string[] }
  conformite?: string[]
}

interface Fixture {
  absent?: string
  meta: {
    competence: string; version: string; version_golds_testee: unknown
    observables: string[]; params: Record<string, number | null>
    bornes: Record<string, [number, number]>
    types_constantes: Record<string, string>
    n_tests_code1: number; n_tests_p2: number; n_cas_code2: number
    annonces_autotest: string[]; catalogue: Record<string, string[]>
    regle_agregation: string; crochets: string[]
  }
  cas: CasJoue[]
  pre_p1a: Array<{ nom: string; contexte: Objet; params: Objet; rendu: Objet }>
  pre_p1b: Array<{ nom: string; contexte: Objet; rendu: Objet }>
  borne_basse: Array<{ note: unknown; etat: string; alertes: string[] }>
  recouvrements: Array<{ production: string; source: string; n: number; rendu: string[] }>
}

function chargeFixture(): Fixture | null {
  const cheminModule = `${RACINE_CONCEPTION}/copies-tests/synthese/code.py`
  if (!existsSync(cheminModule)) return null
  const r = spawnSync('python3', ['scripts/vecteurs-synthese.py', '--racine', RACINE_CONCEPTION], {
    encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  })
  if (r.status !== 0) {
    throw new Error(`le harnais Python a échoué (${r.status}) :\n${r.stderr}`)
  }
  const f = JSON.parse(r.stdout) as Fixture
  return f.absent ? null : f
}

const FIXTURE = chargeFixture()
const sansModule = FIXTURE === null

/** Le contexte de chaîne qui rejoue EXACTEMENT ce que le module a reçu. */
function contexteDe(c: CasJoue): ContexteBranchement {
  const ctxEx: Record<string, string> = {}
  if (typeof c.contexte.copie === 'string') ctxEx.copie = c.contexte.copie
  if (typeof c.contexte.source === 'string') ctxEx.source = c.contexte.source
  // La référence voyage en TEXTE dans le contexte de l'exercice — c'est la forme
  // que la chaîne servirait le jour où elle la descend.
  if (c.contexte.reference != null) ctxEx.reference = JSON.stringify(c.contexte.reference)
  const parametres: Record<string, number | string> = {}
  for (const [k, v] of Object.entries(PARAMS_DEFAUT)) parametres[k] = v
  for (const [k, v] of Object.entries(c.params ?? {})) {
    if (typeof v === 'number') parametres[k] = v
    // ⚠️ `compression_cible: null` : la fiche lui donne `defaut: null`, donc
    //    `valeursDesParametres()` ne le porte pas — comme `params.get()` rend
    //    `None`. On reproduit l'ABSENCE, jamais un zéro qui lui ressemblerait.
    else if (v !== null && v !== undefined) parametres[k] = v as unknown as number
  }
  return {
    modes: ['restituer'],
    cran: null,
    // Le référent que le MODULE dérive : le garde-fou du portage — qui n'existe
    // pas au module — ne doit pas faire diverger la troisième clé sur un
    // désaccord fabriqué par le harnais. Il est éprouvé à part, plus bas.
    referent: (c.referent_derive === 'texte' ? 'texte' : 'cours'),
    exceptionOrthographe: false,
    contexteExercice: ctxEx,
    prives: (c.contexte._mesures != null ? { _mesures: c.contexte._mesures } : {}),
    sorties: {},
    parametres,
  }
}

function artefactsDe(c: CasJoue): Record<string, unknown> {
  // Le banc FUSIONNE les sorties des phases de P1 : le harnais donne la fusion,
  // et la chaîne la rangerait sous ses deux clés. On la sert sous `p1a` : la
  // fusion des deux est la même (`CONTRAT` §2).
  return { p1a: c.p1 }
}

/** JSON.parse(JSON.stringify(x)) — la forme que la chaîne écrit vraiment. */
function normalise(x: unknown): unknown {
  return JSON.parse(JSON.stringify(x ?? null))
}

// ════════════════════════════════════════════════════════════════════════════
// 0 · CE QUE LE MODULE EST — vérifié, jamais supposé
// ════════════════════════════════════════════════════════════════════════════

test('le module de calibration est celui qu\'on croit, et son état est celui du lot', (t) => {
  if (sansModule) return t.skip('dépôt de conception absent')
  const m = FIXTURE!.meta
  assert.equal(m.competence, 'synthese')
  // ⚠️ Le TYPE, jamais le seul compte : chez l'Expression, `TESTS_CODE1_PARFAIT`
  //    est une CHAÎNE, et un `len()` y a rendu « 52 vecteurs » qui étaient 52
  //    caractères. Ici les deux sont des listes.
  assert.equal(m.types_constantes.TESTS_CODE1_PARFAIT, 'list')
  assert.equal(m.types_constantes.TESTS_P2_PARFAIT, 'list')
  assert.equal(m.n_tests_code1, 5)
  assert.equal(m.n_tests_p2, 0, 'TESTS_P2_PARFAIT est VIDE — aucun gold n\'existe encore')
  assert.equal(m.n_cas_code2, 15)
  assert.equal(m.version_golds_testee, null)
  // Les cinq crochets que la fiche déclare, et pas un de plus.
  assert.deepEqual(m.crochets, ['code1', 'code2', 'conformite', 'pre_p1a', 'pre_p1b'])
  assert.deepEqual(m.observables, [...OBSERVABLES_MODULE])
})

test('les listes fermées et les paramètres du portage sont ceux du module', (t) => {
  if (sansModule) return t.skip('dépôt de conception absent')
  assert.deepEqual(
    JSON.parse(JSON.stringify(CATALOGUE)),
    FIXTURE!.meta.catalogue,
    'le CATALOGUE du portage diverge de celui du module',
  )
  for (const [nom, defaut] of Object.entries(PARAMS_DEFAUT)) {
    assert.equal(defaut, FIXTURE!.meta.params[nom], `paramètre ${nom}`)
  }
  // ⚠️ `compression_cible` a `defaut: null` : il n'a PAS de place dans les
  //    défauts du portage — `valeursDesParametres()` ne le porterait pas non plus.
  assert.equal(FIXTURE!.meta.params.compression_cible, null)
  assert.equal(PARAMS_DEFAUT.compression_cible, undefined)
})

test('le portage et la FICHE DÉRIVÉE déclarent les mêmes observables', () => {
  const inst = INSTRUMENT_SYNTHESE as unknown as InstrumentCompetence
  assert.deepEqual(
    Object.keys(inst.observables_mesure).sort(),
    [...OBSERVABLES_TELEMETRIE].sort(),
    'les treize observables du §5 ne sont pas ceux du dérivé',
  )
  assert.equal(OBSERVABLES_TELEMETRIE.length, 13)
  // Les deux dénominateurs, sous leur nom EXACT : `observables.ts` les cherche
  // ainsi, et l'un manquerait que les observables qui s'y rapportent sortiraient
  // en `n/a` sans un mot.
  const denoms = new Set(
    Object.values(inst.observables_mesure)
      .map((e) => (e as EntreeObservableMesure).rapporte_a)
      .filter((x): x is string => !!x),
  )
  assert.deepEqual([...denoms].sort(), [DENOM_APPORTS, DENOM_UNITES_APPARIEES].sort())
  // ⚠️ Le TYPE de `valeur_reussie` — le cinquième portage a trouvé un observable
  //    du corpus qui en déclare une LISTE, et une égalité stricte contre un
  //    tableau est fausse pour TOUTE valeur. Aucun des treize n'est dans ce cas.
  for (const [code, e] of Object.entries(inst.observables_mesure)) {
    const v = (e as EntreeObservableMesure).valeur_reussie
    if (v !== undefined) {
      assert.ok(!Array.isArray(v), `${code} : \`valeur_reussie\` en liste — à lire en ensemble`)
    }
  }
})

// ════════════════════════════════════════════════════════════════════════════
// 1 · LES VECTEURS EMBARQUÉS ET LE BALAYAGE — les trois clés, des deux côtés
// ════════════════════════════════════════════════════════════════════════════

test('code1 et code2 reproduisent le module — LES TROIS CLÉS, sur tous les cas', (t) => {
  if (sansModule) return t.skip('dépôt de conception absent')
  const parGroupe = new Map<string, number>()
  const leves: string[] = []
  for (const c of FIXTURE!.cas) {
    parGroupe.set(c.groupe, (parGroupe.get(c.groupe) ?? 0) + 1)
    const ctx = contexteDe(c)
    if (c.leve) {
      // ⛔ Le module LÈVE là où le contrat §3 l'interdit. Le portage, lui, doit
      //    traverser en NOMMANT ce qu'il a écarté — jamais lever, jamais taire.
      let c1: SortieCode1
      try {
        c1 = BRANCHEMENT_SYNTHESE.code1(artefactsDe(c), ctx)
        const c2 = BRANCHEMENT_SYNTHESE.code2(c.p2, c1, ctx)
        assert.ok(Array.isArray(c2.trace), `${c.nom} : trace absente`)
        assert.ok(
          c1.alertes.length + c2.alertes.length > 0,
          `${c.nom} : le module lève (${c.leve}) et le portage ne dit RIEN`,
        )
        leves.push(c.nom)
      } catch (e) {
        assert.fail(`${c.nom} : le portage LÈVE lui aussi (${(e as Error).message}) — `
          + 'le contrat §3 l\'interdit')
      }
      continue
    }
    const c1 = BRANCHEMENT_SYNTHESE.code1(artefactsDe(c), ctx)
    assert.deepEqual(normalise(c1.mesures), normalise(c.code1!.mesures),
      `${c.nom} — code1.mesures`)
    assert.deepEqual(normalise(c1.document_p2), normalise(c.code1!.document_p2),
      `${c.nom} — code1.document_p2`)
    assert.deepEqual(c1.alertes, c.code1!.alertes, `${c.nom} — code1.alertes`)

    const c2 = BRANCHEMENT_SYNTHESE.code2(c.p2, c1, ctx)
    assert.deepEqual(normalise(c2.verdicts), normalise(c.code2!.verdicts),
      `${c.nom} — code2.verdicts`)
    assert.deepEqual(
      c2.trace.filter((l) => !l.startsWith('élagage des illustrations')),
      c.code2!.trace,
      `${c.nom} — code2.trace`,
    )
    assert.deepEqual(c2.alertes, c.code2!.alertes, `${c.nom} — code2.alertes`)

    const conf = BRANCHEMENT_SYNTHESE.conformite!(artefactsDe(c), c.p2, c1, c2, ctx)
    assert.deepEqual(conf, c.conformite, `${c.nom} — conformite`)
  }
  // ⛔ Aucun cap silencieux : ce qui a été couvert se dit.
  const total = FIXTURE!.cas.length
  console.log(`  · ${total} cas rejoués des deux côtés, dont ${leves.length} où le module lève`)
  console.log('  · ' + [...parGroupe].map(([g, n]) => `${g}=${n}`).join(' · '))
  assert.ok(total > 1000, `balayage trop maigre : ${total} cas`)
  assert.ok(parGroupe.get('embarque_code1') === 5 && parGroupe.get('embarque_code2') === 15)
})

test('les crochets pré-phase reproduisent le module', (t) => {
  if (sansModule) return t.skip('dépôt de conception absent')
  for (const c of FIXTURE!.pre_p1a) {
    const ctxEx: Record<string, string> = {}
    if (typeof c.contexte.copie === 'string') ctxEx.copie = c.contexte.copie
    if (typeof c.contexte.source === 'string') ctxEx.source = c.contexte.source
    const ctx: ContexteBranchement = {
      modes: [], cran: null, referent: 'cours', exceptionOrthographe: false,
      contexteExercice: ctxEx, prives: {}, sorties: {},
      parametres: { ...PARAMS_DEFAUT, ...(c.params as Record<string, number>) },
    }
    const rendu = prePhase1a(ctx) as Objet
    assert.deepEqual(normalise(rendu._mesures), normalise(c.rendu._mesures),
      `${c.nom} — le canal privé \`_mesures\``)
    assert.equal(rendu.production, c.rendu.production, `${c.nom} — slot production`)
    // ⚠️ Le slot `pre_releve` diverge SUR UN SEUL POINT, et c'est un durcissement
    //    assumé : sans matériau, le portage ne dit pas « aucune » reprise (il n'a
    //    pas cherché). Le module, lui, en reçoit toujours un du banc — d'où
    //    l'égalité exigée dès qu'une source est servie.
    if (typeof c.contexte.source === 'string' && c.contexte.source !== '') {
      assert.equal(rendu.pre_releve, c.rendu.pre_releve, `${c.nom} — slot pre_releve`)
    } else {
      assert.ok(String(rendu.pre_releve).includes('matériau non servi'),
        `${c.nom} — sans matériau, le portage doit le DIRE, jamais écrire « aucune »`)
    }
  }
  for (const c of FIXTURE!.pre_p1b) {
    const ctx: ContexteBranchement = {
      modes: [], cran: null, referent: 'texte', exceptionOrthographe: false,
      contexteExercice: c.contexte.reference != null
        ? { reference: JSON.stringify(c.contexte.reference) } : {},
      prives: (c.contexte._mesures != null ? { _mesures: c.contexte._mesures } : {}),
      sorties: (c.contexte.sorties ?? {}) as Objet,
      parametres: { ...PARAMS_DEFAUT },
    }
    const rendu = prePhase1b(ctx) as Objet
    assert.equal(rendu.unites_relevees, c.rendu.unites_relevees, `${c.nom} — unites_relevees`)
    assert.equal(rendu.recouvrements, c.rendu.recouvrements, `${c.nom} — recouvrements`)
    // Le slot du référent : servi, ou `null` — et `null` arrête la mesure.
    assert.equal(rendu.reference_decomposee === null, c.rendu.reference_decomposee === null,
      `${c.nom} — reference_decomposee servi à null, ou non`)
  }
  console.log(`  · ${FIXTURE!.pre_p1a.length} cas de pré-relevé, ${FIXTURE!.pre_p1b.length} d'aligneur`)
})

test('la borne basse et les recouvrements reproduisent le module', (t) => {
  if (sansModule) return t.skip('dépôt de conception absent')
  for (const c of FIXTURE!.borne_basse) {
    const alertes: string[] = []
    const etat = _borneBasse(c.note, alertes, 1)
    assert.equal(etat, c.etat, `borne basse ${JSON.stringify(c.note)}`)
    assert.deepEqual(alertes, c.alertes, `borne basse ${JSON.stringify(c.note)} — alertes`)
  }
  for (const c of FIXTURE!.recouvrements) {
    assert.deepEqual(recouvrements(c.production, c.source, c.n), c.rendu,
      `recouvrements(${JSON.stringify(c.production)}, …, ${c.n})`)
  }
  console.log(`  · ${FIXTURE!.borne_basse.length} notes, ${FIXTURE!.recouvrements.length} recouvrements`)
})

// ════════════════════════════════════════════════════════════════════════════
// 2 · L'ÉPREUVE NÉGATIVE — LA TÉLÉMÉTRIE D'ABORD (items 11, 20, 27 et 35)
// ----------------------------------------------------------------------------
// Le balayage ne peut pas tomber sur une règle que les deux côtés porteraient à
// l'envers : ce sont ces assertions-là, adossées À LA FICHE, qui la font tomber.
// Chaque cas est ASYMÉTRIQUE — les populations n'ont pas la même taille et les
// numérateurs diffèrent — et porte AU MOINS UN ÉLÉMENT ÉCARTÉ DU DÉCOMPTE QUI
// PORTE QUAND MÊME LA PROPRIÉTÉ MESURÉE.
// ════════════════════════════════════════════════════════════════════════════

const REF_EPREUVE = {
  unites: [
    { u: 1, fonctions: ['defend_these'] },     // essentielle
    { u: 2, fonctions: ['illustre'] },         // illustration
    { u: 3, fonctions: ['defend_these'] },     // essentielle
    { u: 4, fonctions: ['explique'] },         // secondaire
    { u: 5, fonctions: ['illustre'] },         // illustration
  ],
  moments: [
    { m: 'M1', unites: [1, 2], fonction: 'pose', cible: [] },
    { m: 'M2', unites: [3], fonction: 'refute', cible: ['M1'] },
    { m: 'M3', unites: [4, 5], fonction: 'precise', cible: ['M2'] },
    // ⭐ Déclaré et JAMAIS rendu : aucun rapport de la copie n'est `conclut`.
    //    C'est lui qui sépare `relation_rendue` de `part_integrative` — deux
    //    proportions qui vaudraient la même chose ne discriminent plus rien.
    { m: 'M4', unites: [4], fonction: 'conclut', cible: ['M2'] },
  ],
}

function ctxEpreuve(referent: 'texte' | 'cours' | null = 'texte'): ContexteBranchement {
  return {
    modes: ['restituer'], cran: null, referent, exceptionOrthographe: false,
    contexteExercice: {}, prives: {}, sorties: {}, parametres: { ...PARAMS_DEFAUT },
  }
}

function chaine(p1: Objet, p2: unknown, referent: 'texte' | 'cours' | null = 'texte') {
  const ctx = ctxEpreuve(referent)
  const c1 = BRANCHEMENT_SYNTHESE.code1({ p1a: p1 }, ctx)
  const c2 = BRANCHEMENT_SYNTHESE.code2(p2, c1, ctx)
  const { releve, alertes } = BRANCHEMENT_SYNTHESE.releve(c2, ctx)
  return { c1, c2, releve, alertesReleve: alertes, ctx }
}

function juge(crible: unknown[], fidelite: unknown[]): Objet {
  return {
    crible, fidelite,
    justification_ancree: 'L\'élève relie deux idées et coiffe le tout.',
    ce_qui_plafonne: 'les rapports du texte', levier: 'fondre deux idées',
    confiance: 'élevée',
  }
}

/**
 * LE CAS ASYMÉTRIQUE DE RÉFÉRENCE — sept unités de production, et rien n'y a la
 * même taille :
 *   · u1 `fusion` (1, 3)         → couvrante, intégrative
 *   · u2 `generalisation` (2, 4) → couvrante, intégrative
 *   · u3 `copie` (5)             → couvrante, une-pour-une, ET reprise verbatim
 *   · u4 `paraphrase` (4)        → couvrante, une-pour-une
 *   · u5 `apport` []             → ⭐ ÉCARTÉE des couvrantes, et le juge la juge
 *   · u6 `fusion` (1)            → ⭐ ÉCARTÉE par la cardinalité, ET INTÉGRATIVE
 *   · u7 absente de l'alignement → ⭐ ÉCARTÉE, et elle porte un rapport
 * Trois populations distinctes : 7 unités relevées, 4 couvrantes, 2 essentielles.
 */
const P1_ASYM: Objet = {
  unites: [{ u: 1 }, { u: 2 }, { u: 3 }, { u: 4 }, { u: 5 }, { u: 6 }, { u: 7 }],
  rapports: [
    { entre: [1, 2], nature: 'refute' },
    { entre: [2, 7], nature: 'precise' },
    { entre: [3, 4], nature: 'additive' },     // ⭐ additive : ne relie PAS
  ],
  apports: [
    { terme_cite: 'économie du passé', unites_recouvertes: [1, 2] },
    { terme_cite: 'chapeau', unites_recouvertes: [] },
    { terme_cite: 'jamais criblé', unites_recouvertes: [3] },   // ⭐ tenté, non criblé
  ],
  these_forme: 'affirmation_complete',
  alignement: [
    { u: 1, correspond_a: [1, 3], operation: 'fusion' },
    { u: 2, correspond_a: [2, 4], operation: 'generalisation' },
    { u: 3, correspond_a: [5], operation: 'copie' },
    { u: 4, correspond_a: [4], operation: 'paraphrase' },
    { u: 5, correspond_a: [], operation: 'apport' },
    { u: 6, correspond_a: [1], operation: 'fusion' },
    // u7 : volontairement absente
  ],
  reference: REF_EPREUVE,
}

const FID_ASYM = [
  { u: 1, etat: 'fidele' },
  { u: 2, etat: 'contresens_partiel' },
  { u: 3, etat: 'fidele' },
  { u: 4, etat: 'contresens_majeur' },
]

const CRIBLE_ASYM = [
  { terme_cite: 'économie du passé', verdict: 'organisateur' },
  { terme_cite: 'chapeau', verdict: 'vide', raison: 'coifferait n\'importe quoi' },
]

test('ÉPREUVE NÉGATIVE · télémétrie — chaque observable a SA VALEUR, et elle est distincte', () => {
  const { releve } = chaine(P1_ASYM, juge(CRIBLE_ASYM, FID_ASYM))

  // ⭐ `mobilisation_reliee` = unités prises dans au moins un rapport NON ADDITIF
  //    / unités. Les rapports réels sont (1,2) et (2,7) → {1,2,7} = 3 ; le rapport
  //    (3,4) est `additive` et ne relie rien. Dénominateur : les SEPT unités
  //    relevées, pas les quatre couvrantes.
  assert.equal(releve.mobilisation_reliee, 3 / 7)

  // ⭐ `part_integrative` = fusion+generalisation / UNITÉS COUVRANTES. u1 et u2
  //    comptent ; u6 est intégrative ET ÉCARTÉE par la cardinalité → 2/4.
  assert.equal(releve.part_integrative, 2 / 4)

  // ⭐ `copie_verbatim` = unités en `copie` / UNITÉS COUVRANTES (arbitrage de
  //    Louis, 23/08). u3 seule → 1/4. ⛔ Sur les sept unités ce serait 1/7, et sur
  //    les deux une-pour-une 1/2 : les trois populations donnent trois valeurs.
  assert.equal(releve.copie_verbatim, 1 / 4)
  assert.notEqual(releve.copie_verbatim, 1 / 7)
  assert.notEqual(releve.copie_verbatim, 1 / 2)

  // ⭐ `couverture_essentielles` = essentielles couvertes FIDÈLEMENT / essentielles.
  //    Les essentielles sont 1 et 3 ; u1 (fusion 1,3) les couvre toutes deux et est
  //    `fidele`. u4 est en contresens majeur mais vise la réf. 4 (secondaire) →
  //    elle ne faussse aucune essentielle → 2/2.
  assert.equal(releve.couverture_essentielles, 1)

  // ⭐ `relation_rendue` = rapports de la référence appariés / déclarés. M2
  //    (`refute`, cible M1) et M3 (`precise`, cible M2) sont déclarés ; M1 est
  //    `pose` et n'en est pas un. Le rapport (1,2) est `refute` et couvre {1,3}
  //    et {2,4} → il touche M2 (u3 de réf.) et M1 (u1, u2) → M2 rendu. Le rapport
  //    (2,7) est `precise` mais u7 n'a aucune correspondance → M3 non rendu.
  assert.equal(releve.relation_rendue, 1 / 3)

  // ⭐ `elagage` porte LES INVERSIONS, pas le taux d'élagage. M1 porte
  //    l'illustration 2 (couverte par u2) et la thèse 1 (couverte par u1) → pas
  //    d'inversion. M3 porte l'illustration 5 (couverte par u3) et AUCUNE thèse
  //    essentielle → pas d'inversion non plus (la condition exige une thèse).
  assert.equal(releve.elagage, 0)

  // ⭐ Les trois rétrogradations, sur LE DÉNOMINATEUR DES APPORTS TENTÉS. Trois
  //    apports tentés, DEUX criblés : « jamais criblé » reste une TENTATIVE de
  //    l'élève et n'entre dans aucun numérateur.
  assert.equal(releve[DENOM_APPORTS], 3)
  assert.equal(releve.apport_vide, 1)
  assert.equal(releve.apport_decoratif, 0)
  assert.equal(releve.apport_non_couvrant, 0)

  // ⭐ Le binaire du seuil — recopié de `seuil_franchi`, jamais recalculé.
  assert.equal(releve.apport_organisateur, 'oui')

  // ⭐ Les deux contresens, sur LES UNITÉS APPARIÉES À LA RÉFÉRENCE (= couvrantes).
  assert.equal(releve[DENOM_UNITES_APPARIEES], 4)
  assert.equal(releve.contresens_partiel, 1)
  assert.equal(releve.contresens_majeur, 1)

  // ⭐ Toutes les valeurs sont DISTINCTES : un échange de deux observables, ou la
  //    lecture d'un voisin, se verrait immédiatement (item 35).
  const proportions = [releve.mobilisation_reliee, releve.part_integrative,
    releve.copie_verbatim, releve.couverture_essentielles, releve.relation_rendue]
  assert.equal(new Set(proportions).size, proportions.length,
    'deux proportions valent la même chose — le cas n\'est plus discriminant')
})

test('ÉPREUVE NÉGATIVE · télémétrie — `elagage` porte LES INVERSIONS, jamais le taux d\'élagage', () => {
  // ⚠️⚠️ LE PIÈGE DES DEUX NOMBRES. Le `sens` de l'observable le dit — « l'observable
  //    rend deux nombres, LE VERDICT NE LIT QUE CELUI-LÀ » — et son `porte_sur`
  //    nomme « les inversions comptées à part ». ⛔ Sur la plupart des copies les
  //    deux valent 0 et l'écart ne se voit pas : il faut une référence où le TAUX
  //    d'élagage n'est pas nul et où AUCUNE inversion n'a lieu.
  const refIll = {
    unites: [
      { u: 1, fonctions: ['defend_these'] },
      { u: 2, fonctions: ['illustre'] },       // couverte
      { u: 3, fonctions: ['illustre'] },       // ⭐ JAMAIS couverte → taux ≠ 0
      { u: 4, fonctions: ['defend_these'] },
    ],
    moments: [
      // La thèse du moment EST couverte : aucune inversion, malgré l'illustration.
      { m: 'M1', unites: [1, 2], fonction: 'pose', cible: [] },
      { m: 'M2', unites: [4, 3], fonction: 'refute', cible: ['M1'] },
    ],
  }
  const p1: Objet = {
    unites: [{ u: 1 }, { u: 2 }, { u: 3 }],
    rapports: [{ entre: [1, 2], nature: 'refute' }],
    apports: [], these_forme: 'absente',
    alignement: [
      { u: 1, correspond_a: [1, 2], operation: 'fusion' },
      { u: 2, correspond_a: [4], operation: 'paraphrase' },
      { u: 3, correspond_a: [1], operation: 'copie' },
    ],
    reference: refIll,
  }
  const r = chaine(p1, juge([], [{ u: 1, etat: 'fidele' }, { u: 2, etat: 'fidele' },
    { u: 3, etat: 'fidele' }]))
  // Le TAUX d'élagage : une illustration sur deux est retenue → 1 − ½ = ½.
  assert.equal(r.c1.mesures.elagage, 0.5)
  assert.equal(r.c1.mesures.inversions, 0)
  // ⭐ Et l'observable rend LES INVERSIONS, pas le taux.
  assert.equal(r.releve.elagage, 0)
  assert.notEqual(r.releve.elagage, r.c1.mesures.elagage)
  // Le second nombre se lit quand même — à la TRACE, où il ne décide rien.
  assert.ok(r.c2.trace.some((l) => l.startsWith('élagage des illustrations')))
  // ⭐ Et l'inversion, quand elle a lieu, remonte bien à l'observable.
  const inverse: Objet = {
    ...p1,
    alignement: [{ u: 1, correspond_a: [2], operation: 'paraphrase' }],
    unites: [{ u: 1 }],
  }
  const ri = chaine(inverse, juge([], [{ u: 1, etat: 'fidele' }]))
  assert.equal(ri.c1.mesures.inversions, 1)
  assert.equal(ri.releve.elagage, 1)
})

test('ÉPREUVE NÉGATIVE · télémétrie — `taux_compression` sans matériau a SON ALERTE NOMMÉE', () => {
  // « Chaque observable du §5 a sa valeur au relevé, OU SON ALERTE NOMMÉE » — et
  // celui-ci n'a pas de valeur, parce que la chaîne ne porte aucun matériau.
  const { releve, alertesReleve } = chaine(P1_ASYM, juge(CRIBLE_ASYM, FID_ASYM))
  assert.equal(releve.taux_compression, null)
  assert.ok(alertesReleve.some((a) => a.startsWith('taux_compression :')),
    'un observable sans valeur et sans alerte est un trou qui ne se voit jamais')
  assert.ok(alertesReleve.some((a) => a.includes('ne porte pas le matériau')))
  // ⭐ Servi, il se calcule : le portage est prêt, c'est le canal qui manque.
  const ctx = ctxEpreuve('texte')
  const avecSource = prePhase1a({
    ...ctx, contexteExercice: { copie: 'un deux trois', source: 'un deux trois quatre cinq six' },
  }) as Objet
  assert.equal((avecSource._mesures as Objet).taux_compression, 3 / 6)
})

test('ÉPREUVE NÉGATIVE · une unité qui n\'est pas un objet est ÉCARTÉE, et NOMMÉE', () => {
  // Le module LÈVE ici (`'int' object has no attribute 'get'`), et le contrat §3
  // l'interdit. Le portage traverse — mais il ne se tait pas.
  const ctx = ctxEpreuve('cours')
  const c1 = BRANCHEMENT_SYNTHESE.code1({ p1a: {
    unites: [{ u: 1 }, 42, 'texte'], rapports: [], apports: [], these_forme: 'absente',
  } }, ctx)
  assert.ok(c1.alertes.some((a) => a.includes('unité relevée non objet')),
    'une unité écartée sans un mot est un décompte faux qui ne se voit pas')
  assert.equal(c1.alertes.filter((a) => a.includes('unité relevée non objet')).length, 2)
  // ⚠️ Et le décompte reste celui de `len(unites)` : trois unités relevées.
  assert.equal(c1.mesures.nb_unites, 3)
})

test('ÉPREUVE NÉGATIVE · télémétrie — l\'ORDRE des trois tests du crible se voit', () => {
  // Le §4 : « l'ordre des deux premiers tests est délibéré » — un chapeau
  // passe-partout échoue sur le CONTENU avant qu'on lui compte ses unités.
  // Le code ne décide pas de l'ordre (c'est le juge), mais il doit compter chaque
  // étiquette SOUS SON NOM : trois numérateurs, trois valeurs différentes.
  const p1: Objet = {
    unites: [{ u: 1 }, { u: 2 }],
    rapports: [{ entre: [1, 2], nature: 'refute' }],
    apports: [{ terme_cite: 'a' }, { terme_cite: 'b' }, { terme_cite: 'c' },
      { terme_cite: 'd' }, { terme_cite: 'e' }],
    these_forme: 'absente',
  }
  const crible = [
    { terme_cite: 'a', verdict: 'vide', raison: 'r' },
    { terme_cite: 'b', verdict: 'vide', raison: 'r' },
    { terme_cite: 'c', verdict: 'decoratif', raison: 'r' },
    { terme_cite: 'd', verdict: 'non_couvrant', raison: 'r' },
    // 'e' n'est pas criblé : tenté, jamais jugé.
  ]
  const { releve } = chaine(p1, juge(crible, []), 'cours')
  // ⭐ Des comptes ASYMÉTRIQUES : 2, 1, 1, sur 5 tentés. Un échange de deux
  //    étiquettes se verrait ; des comptes égaux l'auraient caché.
  assert.equal(releve.apport_vide, 2)
  assert.equal(releve.apport_decoratif, 1)
  assert.equal(releve.apport_non_couvrant, 1)
  assert.equal(releve[DENOM_APPORTS], 5)
  assert.equal(releve.apport_organisateur, 'non')
})

test('ÉPREUVE NÉGATIVE · télémétrie — le référent COURS n\'écrit que cinq observables, et il le DIT', () => {
  const p1: Objet = {
    unites: [{ u: 1 }, { u: 2 }, { u: 3 }],
    rapports: [{ entre: [1, 2], nature: 'refute' }],
    apports: [{ terme_cite: 'économie' }],
    these_forme: 'affirmation_complete',
  }
  const { releve, alertesReleve } = chaine(
    p1, juge([{ terme_cite: 'économie', verdict: 'organisateur' }], []), 'cours',
  )
  const codes = Object.keys(releve).filter((k) => k !== DENOM_APPORTS && k !== DENOM_UNITES_APPARIEES)
  assert.deepEqual(codes.sort(), ['apport_decoratif', 'apport_non_couvrant',
    'apport_organisateur', 'apport_vide', 'mobilisation_reliee'])
  // ⛔ L'absence des huit se DÉCLARE — « chaque observable du §5 a sa valeur au
  //    relevé, ou son alerte nommée ».
  const declare = alertesReleve.join(' ')
  for (const code of OBSERVABLES_TEXTE_SEULEMENT) {
    assert.ok(declare.includes(code), `le relevé ne nomme pas l'absence de ${code}`)
  }
  // Et ce que la chaîne écrira vraiment : huit `n/a`, aucun trou.
  const inst = INSTRUMENT_SYNTHESE as unknown as InstrumentCompetence
  const { observables } = appliquerObservablesMesure(inst.observables_mesure, releve)
  assert.equal(Object.keys(observables).length, 13)
  for (const code of OBSERVABLES_TEXTE_SEULEMENT) {
    assert.equal(observables[code], 'n/a', `${code} devrait être n/a sur le référent cours`)
  }
  assert.equal(observables.mobilisation_reliee, 2 / 3)
})

test('ÉPREUVE NÉGATIVE · télémétrie — un dénominateur NUL rend `n/a`, jamais 0', () => {
  const p1: Objet = {
    unites: [{ u: 1 }, { u: 2 }],
    rapports: [{ entre: [1, 2], nature: 'refute' }],
    apports: [],                                   // ⭐ aucun apport tenté
    these_forme: 'absente',
  }
  const { releve } = chaine(p1, juge([], []), 'cours')
  assert.equal(releve[DENOM_APPORTS], 0)
  const inst = INSTRUMENT_SYNTHESE as unknown as InstrumentCompetence
  const { observables } = appliquerObservablesMesure(inst.observables_mesure, releve)
  // « Un dénominateur vide → hors du dénominateur du taux » (`01-` §8.2).
  for (const code of ['apport_vide', 'apport_decoratif', 'apport_non_couvrant']) {
    assert.equal(observables[code], 'n/a', code)
  }
  assert.equal(observables.apport_organisateur, 'non')
})

test('ÉPREUVE NÉGATIVE · télémétrie — le PASSAGE MANQUÉ ne publie AUCUN observable', () => {
  const { c2, releve, alertesReleve } = chaine(
    P1_ASYM, juge(CRIBLE_ASYM, [{ u: 1, etat: 'fidele' }]),      // trois manquantes
  )
  assert.deepEqual(c2.verdicts, { niveau: null, palier_base: null, seuil_franchi: null })
  assert.ok(c2.alertes.some((a) => a.startsWith('PASSAGE MANQUÉ')))
  assert.deepEqual(releve, {}, 'un relevé publié sur une sortie tronquée est une mesure fausse')
  assert.ok(alertesReleve.length > 0, 'et il le DIT')
})

// ════════════════════════════════════════════════════════════════════════════
// 3 · L'ÉPREUVE NÉGATIVE — LA RÈGLE D'AGRÉGATION, adossée au §4
// ════════════════════════════════════════════════════════════════════════════

test('ÉPREUVE NÉGATIVE · §4 — la cascade SANS RÉFÉRENCE, ligne par ligne', () => {
  const u = (n: number) => Array.from({ length: n }, (_, i) => ({ u: i + 1 }))
  const cas: Array<[string, Objet, string]> = [
    ['aucun rapport écrit → Absent',
      { unites: u(3), rapports: [], apports: [] }, 'Absent'],
    ['rapports tous additifs → Faible',
      { unites: u(3), rapports: [{ entre: [1, 2], nature: 'additive' }], apports: [] }, 'Faible'],
    ['unités reliées minoritaires → Moyen',
      { unites: u(5), rapports: [{ entre: [1, 2], nature: 'refute' }], apports: [] }, 'Moyen'],
    // ⭐ EXACTEMENT la moitié : « strictement majoritaires » → Moyen, pas Bon.
    ['unités reliées à la moitié pile → Moyen',
      { unites: u(4), rapports: [{ entre: [1, 2], nature: 'refute' }], apports: [] }, 'Moyen'],
    ['unités reliées strictement majoritaires → Bon',
      { unites: u(3), rapports: [{ entre: [1, 2], nature: 'refute' },
        { entre: [2, 3], nature: 'nuance' }], apports: [] }, 'Bon'],
    ['aucune unité → Absent (garde-fou)',
      { unites: [], rapports: [], apports: [] }, 'Absent'],
  ]
  for (const [nom, p1, attendu] of cas) {
    const { c2 } = chaine(p1, juge([], []), 'cours')
    assert.equal(c2.verdicts.palier_base, attendu, nom)
  }
})

test('ÉPREUVE NÉGATIVE · §4 — le SEUIL ouvre Acquis, il n\'élève JAMAIS la base', () => {
  const avecApport = (rapports: unknown[]) => ({
    unites: [{ u: 1 }, { u: 2 }, { u: 3 }], rapports,
    apports: [{ terme_cite: 'économie' }], these_forme: 'absente',
  })
  const crible = [{ terme_cite: 'économie', verdict: 'organisateur' }]
  // Base Bon + seuil → Acquis.
  let r = chaine(avecApport([{ entre: [1, 2], nature: 'refute' },
    { entre: [2, 3], nature: 'nuance' }]), juge(crible, []), 'cours')
  assert.deepEqual(r.c2.verdicts, { niveau: 'Acquis', palier_base: 'Bon', seuil_franchi: 'oui' })
  // Base Faible + seuil → Faible, et la trace le SIGNALE au levier.
  r = chaine(avecApport([{ entre: [1, 2], nature: 'additive' }]), juge(crible, []), 'cours')
  assert.deepEqual(r.c2.verdicts, { niveau: 'Faible', palier_base: 'Faible', seuil_franchi: 'oui' })
  assert.ok(r.c2.trace.some((l) => l.includes('n\'ouvre pas Acquis')))
  // Base Bon + crible VIDE → Bon, jamais Acquis.
  r = chaine(avecApport([{ entre: [1, 2], nature: 'refute' }, { entre: [2, 3], nature: 'nuance' }]),
    juge([{ terme_cite: 'économie', verdict: 'vide', raison: 'r' }], []), 'cours')
  assert.deepEqual(r.c2.verdicts, { niveau: 'Bon', palier_base: 'Bon', seuil_franchi: 'non' })
})

test('ÉPREUVE NÉGATIVE · §4 — les deux plafonds de fidélité, et ils ne RELÈVENT jamais', () => {
  const fid = (...etats: string[]) => etats.map((e, i) => ({ u: i + 1, etat: e }))
  // Un contresens majeur sur une thèse ESSENTIELLE plafonne à Faible.
  let r = chaine(P1_ASYM, juge(CRIBLE_ASYM,
    [{ u: 1, etat: 'contresens_majeur' }, { u: 2, etat: 'fidele' },
      { u: 3, etat: 'fidele' }, { u: 4, etat: 'fidele' }]))
  assert.equal(r.c2.verdicts.palier_base, 'Faible')
  assert.ok(r.c2.trace.some((l) => l.includes('contresens majeur sur la ou les thèses essentielles')))
  // ⭐ Un contresens majeur sur une unité SECONDAIRE ne plafonne PAS : u4 vise la
  //    référence 4, dont la fonction est `explique`. C'est l'élément écarté du
  //    numérateur qui porte quand même la propriété.
  r = chaine(P1_ASYM, juge(CRIBLE_ASYM,
    [{ u: 1, etat: 'fidele' }, { u: 2, etat: 'fidele' },
      { u: 3, etat: 'fidele' }, { u: 4, etat: 'contresens_majeur' }]))
  assert.notEqual(r.c2.verdicts.palier_base, 'Faible')
  assert.ok(!r.c2.trace.some((l) => l.includes('contresens majeur sur la ou les thèses')))
  // Les contresens partiels AU-DELÀ du paramètre plafonnent à Moyen — pas À.
  r = chaine(P1_ASYM, juge(CRIBLE_ASYM, fid('contresens_partiel', 'contresens_partiel',
    'contresens_partiel', 'fidele')))
  assert.equal(r.c2.verdicts.palier_base, 'Moyen')
  // Exactement au paramètre (2) : PAS de plafond.
  r = chaine(P1_ASYM, juge(CRIBLE_ASYM, fid('contresens_partiel', 'contresens_partiel',
    'fidele', 'fidele')))
  assert.ok(!r.c2.trace.some((l) => l.includes('contresens partiels')))
})

test('ÉPREUVE NÉGATIVE · §4 — la borne basse d\'une `limite` prend LE PLUS FAIBLE des deux états', () => {
  const un = (note: unknown) => chaine(P1_ASYM, juge(CRIBLE_ASYM, [
    { u: 1, etat: 'limite', note }, { u: 2, etat: 'fidele' },
    { u: 3, etat: 'fidele' }, { u: 4, etat: 'fidele' },
  ]))
  // u1 couvre les DEUX essentielles : un contresens majeur dessus plafonne à Faible.
  assert.equal(un('entre fidele et contresens_majeur').c2.verdicts.palier_base, 'Faible')
  // En français, accents compris — c'est ce que RM12 a réparé.
  assert.equal(un('entre fidèle et contresens majeur').c2.verdicts.palier_base, 'Faible')
  // ⭐⭐ LE `\b` UNICODE DE PYTHON, ET C'EST LUI QUI DÉCIDE. Dans « infidèle », le
  //    `è` est un caractère de mot pour Python : il n'y voit AUCUN « fidele »
  //    isolé, donc UN SEUL état nommé, donc la note est illisible et vaut
  //    `contresens_partiel`. Le `\b` de JavaScript hors drapeau `u`, lui, y verrait
  //    une frontière, lirait deux états, et rendrait `contresens_majeur` — un
  //    palier de plus, sans un symptôme.
  const infidele = un('l\'élève est infidèle au texte, contresens majeur')
  assert.ok(infidele.c2.alertes.some((a) => a.includes('ne nomme pas deux états')),
    '« infidèle » ne doit PAS compter comme le mot « fidele »')
  assert.equal(infidele.releve.contresens_partiel, 1)
  assert.equal(infidele.releve.contresens_majeur, 0)
  // ⭐ La MÊME phrase avec une vraie frontière : deux états, et la borne basse
  //    prend le plus faible — `contresens_majeur`.
  const separe = un('l\'élève reste fidèle par endroits, contresens majeur ailleurs')
  assert.ok(!separe.c2.alertes.some((a) => a.includes('ne nomme pas deux états')))
  assert.equal(separe.releve.contresens_majeur, 1)
  // Une note qui ne nomme QU'UN état est illisible : elle vaut contresens_partiel,
  // AVEC l'alerte, et le doute ne vaut pas un acquiescement.
  const illisible = un('je ne sais pas')
  assert.ok(illisible.c2.alertes.some((a) => a.includes('ne nomme pas deux états')))
  assert.equal(illisible.releve.contresens_partiel, 1)
})

test('ÉPREUVE NÉGATIVE · §4 — la branche ABSENT du référent texte exige LES DEUX conditions', () => {
  const refUne = {
    unites: [{ u: 1, fonctions: ['defend_these'] }],
    moments: [{ m: 'M1', unites: [1], fonction: 'pose', cible: [] }],
  }
  // Aucun rapport rendu (aucun moment déclaré) ET reprise verbatim dominante.
  const p1: Objet = {
    unites: [{ u: 1 }], rapports: [], apports: [], these_forme: 'absente',
    alignement: [{ u: 1, correspond_a: [1], operation: 'copie' }],
    reference: refUne,
  }
  let r = chaine(p1, juge([], [{ u: 1, etat: 'fidele' }]))
  assert.equal(r.c2.verdicts.palier_base, 'Absent')
  assert.equal(r.releve.copie_verbatim, 1)
  // ⭐ La MÊME copie en `paraphrase` : plus de reprise dominante, et la couverture
  //    n'est pas éclatée → la branche Absent ne s'ouvre pas.
  const p1b: Objet = { ...p1, alignement: [{ u: 1, correspond_a: [1], operation: 'paraphrase' }] }
  r = chaine(p1b, juge([], [{ u: 1, etat: 'fidele' }]))
  assert.notEqual(r.c2.verdicts.palier_base, 'Absent')
  assert.equal(r.releve.copie_verbatim, 0)
})

test('ÉPREUVE NÉGATIVE · §3.2 — les statuts se DÉRIVENT, et la plus haute fonction gagne', () => {
  const avec = (fonctions: unknown) => {
    const p1: Objet = {
      unites: [{ u: 1 }], rapports: [], apports: [], these_forme: 'absente',
      alignement: [{ u: 1, correspond_a: [1], operation: 'paraphrase' }],
      reference: {
        unites: [{ u: 1, fonctions }],
        moments: [{ m: 'M1', unites: [1], fonction: 'pose', cible: [] }],
      },
    }
    return chaine(p1, juge([], [{ u: 1, etat: 'fidele' }]))
  }
  // `defend_these` → essentielle, donc `nb_essentielles` vaut 1.
  assert.equal(avec(['defend_these']).c1.mesures.nb_essentielles, 1)
  assert.equal(avec(['explique']).c1.mesures.nb_essentielles, 0)
  // ⭐ La plus HAUTE du tableau : illustration(1) < secondaire(2) < essentielle(3).
  assert.equal(avec(['illustre', 'defend_these']).c1.mesures.nb_essentielles, 1)
  assert.equal(avec(['defend_these', 'illustre']).c1.mesures.nb_essentielles, 1)
  assert.equal(avec(['explique', 'illustre']).c1.mesures.nb_essentielles, 0)
  // Une fonction inconnue → ALERTE, jamais un statut par défaut.
  const inconnue = avec(['inconnue'])
  assert.equal(inconnue.c1.mesures.nb_essentielles, 0)
  assert.ok(inconnue.c1.alertes.some((a) => a.includes('fonction inconnue')))
  assert.ok(inconnue.c1.alertes.some((a) => a.includes('aucune fonction lisible')))
})

test('ÉPREUVE NÉGATIVE · §4 — une cardinalité incohérente ALERTE, elle ne se corrige pas', () => {
  const avec = (operation: string, correspond_a: unknown[]) => {
    const p1: Objet = {
      unites: [{ u: 1 }], rapports: [], apports: [], these_forme: 'absente',
      alignement: [{ u: 1, correspond_a, operation }], reference: REF_EPREUVE,
    }
    return chaine(p1, juge([], []))
  }
  // `fusion` sur UNE correspondance → écartée, alertée, jamais rétrogradée.
  let r = avec('fusion', [1])
  assert.equal(r.c1.mesures.couvrantes, 0)
  assert.ok(r.c1.alertes.some((a) => a.includes('incohérence de cardinalité')))
  // `paraphrase` sur DEUX → même chose.
  r = avec('paraphrase', [1, 3])
  assert.equal(r.c1.mesures.couvrantes, 0)
  assert.ok(r.c1.alertes.some((a) => a.includes('incohérence de cardinalité')))
  // `apport` avec une correspondance → alerté, jamais requalifié.
  r = avec('apport', [1])
  assert.equal(r.c1.mesures.couvrantes, 0)
  assert.ok(r.c1.alertes.some((a) => a.includes('« apport » mais correspondances')))
  // ⭐ Et les cardinalités JUSTES passent : le contrôle n'écarte pas tout.
  assert.equal(avec('fusion', [1, 3]).c1.mesures.couvrantes, 1)
  assert.equal(avec('paraphrase', [1]).c1.mesures.couvrantes, 1)
})

// ════════════════════════════════════════════════════════════════════════════
// 4 · `document_p2` — ce que le juge lit, et RIEN D'AUTRE
// ════════════════════════════════════════════════════════════════════════════

test('ÉPREUVE NÉGATIVE · `document_p2` — DEUX FORMES, et aucun nombre ne part au juge', () => {
  // Référent cours : le squelette nu du §3.1, et rien de plus.
  const cours = chaine({
    unites: [{ u: 1, citation: 'x', segments: [1] }],
    rapports: [{ entre: [1, 2], nature: 'refute', citation: 'alors que' }],
    apports: [{ terme_cite: 'économie', unites_recouvertes: [1], deploiement: ['[pose_seul]'] }],
    these_forme: 'affirmation_complete', these_citee: 'la mémoire trie',
  }, juge([], []), 'cours')
  const docC = cours.c1.document_p2 as Objet
  assert.deepEqual(Object.keys(docC).sort(), ['apports', 'rapports', 'these_forme', 'unites'])

  // Référent texte : ⭐ l'alignement ET la référence — « il en a les moyens ».
  const texte = chaine(P1_ASYM, juge(CRIBLE_ASYM, FID_ASYM))
  const docT = texte.c1.document_p2 as Objet
  assert.deepEqual(Object.keys(docT).sort(),
    ['alignement', 'apports', 'rapports', 'reference', 'these_forme', 'unites'])
  assert.deepEqual(docT.reference, REF_EPREUVE)

  // ⛔ AUCUN NOMBRE, AUCUN CANAL PRIVÉ — « aucun nombre n'est injecté » (§4).
  const serialise = JSON.stringify(docT)
  for (const cle of ['taux_compression', 'part_integrative', 'copie_verbatim', 'couvrantes',
    'mesures', '_mesures', '_pre_releve', '_corr', 'nb_unites']) {
    assert.ok(!serialise.includes(`"${cle}"`), `${cle} part au juge — le §4 l'interdit`)
  }
  // Et le canal privé que le calcul range dans l'alignement ne fuit pas non plus.
  for (const a of docT.alignement as Objet[]) {
    assert.deepEqual(Object.keys(a).filter((k) => k.startsWith('_')), [])
  }
})

test('ÉPREUVE NÉGATIVE · `document_p2` — la clé est là même quand le relevé est illisible', () => {
  for (const p1 of [{}, { unites: null }, { unites: 'texte' }]) {
    const ctx = ctxEpreuve('cours')
    const c1 = BRANCHEMENT_SYNTHESE.code1({ p1a: p1 }, ctx)
    assert.ok('document_p2' in c1,
      'l\'ABSENCE de la clé est l\'erreur, jamais la valeur nulle (`CONTRAT` §2)')
  }
})

// ════════════════════════════════════════════════════════════════════════════
// 5 · LES DEUX RÉFÉRENTS, LES SLOTS, ET CE QUE LA CHAÎNE NE SERT PAS
// ════════════════════════════════════════════════════════════════════════════

test('extractions — DEUX étages, et UN SEUL quand le référent est le cours', () => {
  const specsCours = BRANCHEMENT_SYNTHESE.extractions(ctxEpreuve('cours'))
  assert.deepEqual(specsCours.map((s) => s.tetePrompt), ['P1A'])
  for (const referent of ['texte', null] as const) {
    const specs = BRANCHEMENT_SYNTHESE.extractions(ctxEpreuve(referent))
    assert.deepEqual(specs.map((s) => s.tetePrompt), ['P1A', 'P1B'],
      `référent ${referent} : l'aligneur doit tourner`)
  }
  // Les slots DÉCLARÉS coïncident avec ceux des prompts dérivés.
  const inst = INSTRUMENT_SYNTHESE as unknown as InstrumentCompetence
  for (const spec of BRANCHEMENT_SYNTHESE.extractions(ctxEpreuve('texte'))) {
    const gabarit = inst.prompts[spec.tetePrompt]
    for (const slot of spec.slotsFournis) {
      assert.ok(gabarit.includes(`{${slot}}`), `${spec.tetePrompt} : {${slot}} absent du prompt`)
    }
  }
  // Le prompt de jugement n'a qu'UN slot : c'est le document, sans déclaration.
  const specP2 = BRANCHEMENT_SYNTHESE.jugement(ctxEpreuve('texte'))
  assert.equal(specP2.tetePrompt, 'P2')
  assert.equal(specP2.slotDocument, undefined)
  assert.equal(specP2.preP2, undefined)
  assert.deepEqual([...inst.prompts.P2.matchAll(/\{([a-z0-9_]+)\}/g)].map((x) => x[1]), ['squelette'])
})

test('⚠️ LE RÉFÉRENT TEXTE S\'ARRÊTE — la chaîne ne descend pas la référence décomposée', () => {
  // C'est le comportement VOULU, pas une panne : « un slot servi à `null` arrête
  // la mesure en le nommant » (`CONTRAT` §2). Le jour où la chaîne sert la
  // référence, ce test change de côté — et c'est ainsi qu'on le saura.
  const ctx = ctxEpreuve('texte')
  const rendu = prePhase1b(ctx) as Objet
  assert.equal(rendu.reference_decomposee, null,
    'sans référence au contexte, le slot doit être servi à null')
  // ⭐ Et servie, elle passe : le portage est prêt, c'est le canal qui manque.
  const ctxServi: ContexteBranchement = {
    ...ctx, contexteExercice: { reference: JSON.stringify(REF_EPREUVE) },
  }
  const servi = prePhase1b(ctxServi) as Objet
  assert.equal(typeof servi.reference_decomposee, 'string')
  assert.ok(String(servi.reference_decomposee).includes('defend_these'))
})

test('⚠️ le matériau manque aussi — `taux_compression` sort en `n/a`, et le relevé le NOMME', () => {
  const ctx = ctxEpreuve('cours')
  const rendu = prePhase1a({ ...ctx, contexteExercice: { copie: 'Une phrase. Deux phrases.' } }) as Objet
  const mes = rendu._mesures as Objet
  assert.equal(mes.taux_compression, null, 'sans matériau, pas de compression')
  assert.equal(mes.mots_materiau, 0)
  assert.deepEqual(mes.recouvrements, [])
  // ⛔ Et le slot ne MENT pas : il ne dit pas « aucune » reprise quand il n'a rien
  //    cherché. C'est le seul point où le portage s'écarte du module, et c'est un
  //    durcissement — le banc, lui, sert toujours une source.
  assert.ok(String(rendu.pre_releve).includes('matériau non servi'))
  assert.ok(!String(rendu.pre_releve).includes('aucune'))
})

// ════════════════════════════════════════════════════════════════════════════
// 6 · LA LETTRE, ET CE QUE LE §5 EXIGE DE LA MESURE ÉCRITE
// ════════════════════════════════════════════════════════════════════════════

test('la lettre-équivalente suit les synonymes du bloc machine', () => {
  const inst = INSTRUMENT_SYNTHESE as unknown as InstrumentCompetence
  const syn = (inst.bloc_machine.observables as Objet).niveau as Objet
  for (const [niveau, lettres] of Object.entries(syn.synonymes as Record<string, string[]>)) {
    assert.equal(LETTRE_DU_NIVEAU[niveau], lettres[0], `${niveau} → ${lettres[0]}`)
  }
  for (const palier of ORDRE_PALIERS) {
    const lettre = BRANCHEMENT_SYNTHESE.lettre(
      { verdicts: { niveau: palier }, trace: [], alertes: [] }, ctxEpreuve(),
    )
    assert.equal(lettre, LETTRE_DU_NIVEAU[palier])
  }
  assert.equal(BRANCHEMENT_SYNTHESE.lettre(
    { verdicts: { niveau: null }, trace: [], alertes: [] }, ctxEpreuve()), null)
})

test('les treize observables se LISENT contre les seuils de la fiche, jamais contre un seuil en dur', () => {
  const inst = INSTRUMENT_SYNTHESE as unknown as InstrumentCompetence
  const params = { ...PARAMS_DEFAUT }
  const { releve } = chaine(P1_ASYM, juge(CRIBLE_ASYM, FID_ASYM))
  const { observables, alertes } = appliquerObservablesMesure(inst.observables_mesure, releve)
  assert.deepEqual(alertes, [], 'aucun observable ne doit sortir sur une valeur illisible')
  assert.equal(Object.keys(observables).length, 13)

  // ⭐ Les `comptage rapporté` se COMPOSENT : `observables.ts` divise, le relevé
  //    ne rend que le numérateur et son dénominateur.
  assert.equal(observables.apport_vide, 1 / 3)
  assert.equal(observables.contresens_partiel, 1 / 4)
  assert.equal(observables.contresens_majeur, 1 / 4)
  // Les autres se lisent telles quelles.
  assert.equal(observables.mobilisation_reliee, 3 / 7)
  assert.equal(observables.elagage, 0)

  // Et les VERDICTS, lus contre les seuils du dérivé — pas recopiés.
  const statut = (code: string) => statutDeLaMesure(
    observables[code], inst.observables_mesure[code] as EntreeObservableMesure, params,
  )
  assert.equal(statut('mobilisation_reliee'), 'ratee')      // 0,43 ≤ 0,5, `plus_de`
  assert.equal(statut('apport_organisateur'), 'reussie')    // `vaut` oui
  assert.equal(statut('couverture_essentielles'), 'reussie') // 1 ≥ 0,8
  assert.equal(statut('part_integrative'), 'ratee')          // 0,5 non > 0,5
  assert.equal(statut('relation_rendue'), 'ratee')           // 0,5 < 0,8
  assert.equal(statut('elagage'), 'reussie')                 // 0 ≤ 0
  assert.equal(statut('copie_verbatim'), 'reussie')          // 0,25 < 0,5
  assert.equal(statut('contresens_majeur'), 'ratee')         // 0,25 > 0
  // ⛔ `taux_compression` n'est ni réussi ni raté — `reussie: sans_objet` (§5).
  assert.equal(statut('taux_compression'), 'sans_objet')

  // ⭐ ET LE SEUIL SE LIT DU DÉRIVÉ : le déplacer déplace le verdict. C'est ce qui
  //    prouve qu'aucun seuil n'est en dur dans le branchement.
  assert.equal(statutDeLaMesure(
    observables.couverture_essentielles,
    inst.observables_mesure.couverture_essentielles as EntreeObservableMesure,
    { ...params, part_essentielles_bon: 1.1 },
  ), 'ratee')
  assert.equal(valeurDe('copie_verbatim',
    inst.observables_mesure.copie_verbatim as EntreeObservableMesure, {}).valeur, 'n/a')
})

test('le relevé porte AUTANT d\'entrées que d\'observables mesurables, plus ses dénominateurs', () => {
  const { releve } = chaine(P1_ASYM, juge(CRIBLE_ASYM, FID_ASYM))
  const attendues = [...OBSERVABLES_TELEMETRIE, DENOM_APPORTS, DENOM_UNITES_APPARIEES].sort()
  assert.deepEqual(Object.keys(releve).sort(), attendues,
    'un observable déclaré sans entrée sort en `n/a` — POUR TOUJOURS, SANS SYMPTÔME')
})

// ════════════════════════════════════════════════════════════════════════════
// 7 · CE QUE LE PORTAGE AJOUTE AU MODULE, et qui doit se voir
// ════════════════════════════════════════════════════════════════════════════

test('le garde-fou du référent — un désaccord chaîne/référence se NOMME, il ne se corrige pas', () => {
  // Inatteignable en production (l'aligneur arrête la chaîne avant `code1`), et
  // c'est bien pour cela qu'il faut l'éprouver ici.
  const ctx = ctxEpreuve('texte')
  const c1 = BRANCHEMENT_SYNTHESE.code1({ p1a: {
    unites: [{ u: 1 }], rapports: [], apports: [], these_forme: 'absente',
  } }, ctx)
  assert.equal(c1.mesures.referent, 'cours')
  assert.ok(c1.alertes.some((a) => a.includes('référent « texte »')),
    'la mesure serait composée sur la mauvaise branche du §4 sans un mot')
  // Et sans référent du tout : « sans référent, il ne reste rien à mesurer ».
  const sans = BRANCHEMENT_SYNTHESE.code1({ p1a: { unites: [{ u: 1 }] } }, ctxEpreuve(null))
  assert.ok(sans.alertes.some((a) => a.includes('aucun référent')))
})

test('`delta` n\'est PAS déclaré — la fiche ne dit nulle part ce que comparer deux squelettes veut dire', () => {
  assert.equal(BRANCHEMENT_SYNTHESE.delta, undefined,
    'l\'inventer serait trancher une règle de grille depuis le code')
})

test('code2 ne rend QUE les trois clés publiques, et son canal privé porte le tiret bas', () => {
  const { c2 } = chaine(P1_ASYM, juge(CRIBLE_ASYM, FID_ASYM))
  const publiques = Object.keys(c2).filter((k) => !k.startsWith('_')).sort()
  assert.deepEqual(publiques, ['alertes', 'trace', 'verdicts'])
  assert.deepEqual(Object.keys(c2.verdicts).sort(), [...OBSERVABLES_MODULE].sort(),
    'les clés de `verdicts` sont EXACTEMENT les observables déclarés')
  assert.ok('_telemetrie' in c2)
})
