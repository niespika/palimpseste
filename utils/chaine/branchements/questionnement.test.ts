// ============================================================================
// C4 · L10 — LE PORTAGE, CONFRONTÉ AU MODULE QUI FAIT FOI POUR LE CALCUL.
// ----------------------------------------------------------------------------
// « Le branchement reproduit, sur les vecteurs embarqués du module —
//   `TESTS_CODE1_PARFAIT` et `TESTS_P2_PARFAIT` —, EXACTEMENT ce que
//   `python3 code.py --autotest` produit, ET SANS AUCUN APPEL DE MODÈLE. »
//                                            — le « fait quand » de C4-L10
//
// ⚠️⚠️ CES DEUX NOMS N'EXISTENT PAS DANS CE MODULE. Il porte `VECTEURS` (30),
//    `ALERTES_ATTENDUES` (7) et `VECTEURS_REFERENT` (7). ⛔ Un
//    `getattr(m, "TESTS_P2_PARFAIT", [])` rendrait un ZÉRO QUI RESSEMBLE À UNE
//    MESURE : le harnais l'écrit, et le premier test ci-dessous l'assère.
//    *On lit le « fait quand » comme « les vecteurs embarqués du module », et on
//    se prouve contre `--autotest`, pas contre un nom de constante.*
//
// ⭐ LES DEUX CÔTÉS SONT REJOUÉS SUR LES MÊMES ENTRÉES, et LES TROIS CLÉS sont
//    comparées — pas seulement `verdicts`. *Une trace qui diverge dit qu'un
//    chemin de calcul a changé, même quand le verdict tombe juste.*
//
// ⚠️⚠️ LE QUESTIONNEMENT N'A NI GOLD, NI COPIE, NI CRITÈRE, NI RUN STOCKÉ —
//    `VERSION_GOLDS_TESTEE` vaut `None`, son dossier ne porte que ses deux
//    prompts et son module, et sa fiche l'écrit : « aucun run n'a jamais tourné,
//    aucun gold n'existe ». C'est donc LE BALAYAGE qui porte la preuve — 3 600
//    cas de plus, passés dans LA MÊME FONCTION DU MÊME MODULE : il n'invente
//    aucune règle, il cesse de ne la lui demander que 30 fois.
//
// ⭐ ET LES ASSERTIONS « FICHE » QUI LE SUIVENT SONT L'ÉPREUVE NÉGATIVE. Un
//    portage qui inverserait une règle passerait le balayage — les deux côtés
//    s'accorderaient sur la même erreur si l'erreur était dans les deux. Ce sont
//    les assertions adossées À LA FICHE, sur des cas ASYMÉTRIQUES et portant au
//    moins un élément ÉCARTÉ DES NUMÉRATEURS QUI PORTE QUAND MÊME LA PROPRIÉTÉ,
//    qui font tomber une mutation. ⭐⭐ Et on les fait D'ABORD SUR LA TÉLÉMÉTRIE :
//    c'est là que les portages précédents ont trouvé leurs survivantes.
//
// ⚠️ CE N'EST PAS UNE FIXTURE FIGÉE. Le harnais Python
//    (`scripts/vecteurs-questionnement.py`) rejoue le module À CHAQUE EXÉCUTION :
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
  BRANCHEMENT_QUESTIONNEMENT, OBSERVABLES_TELEMETRIE, OBSERVABLES_MODULE,
  PARAMS_DEFAUT, CATALOGUE, PALIERS, DENOM_TENTES, LETTRE_DU_NIVEAU, MODES_RECEPTIFS,
  VIDE_DEPLACEMENT, VIDE_REPRISE,
} from './questionnement'
import { INSTRUMENT_QUESTIONNEMENT } from '../derive/competences/questionnement'
import { statutDeLaMesure, valeurDe, appliquerObservablesMesure } from '../observables'
import { str, trie } from '../python'
import type { EntreeObservableMesure, InstrumentCompetence, ContexteBranchement, SortieCode1 } from '../instruments'

// ⚠️ Le dépôt de conception vit à un chemin ABSOLU hors de ce dépôt. Le fixer en
// dur ici faisait SAUTER le contrôle partout ailleurs que sur la machine du
// professeur — et un `npm test` vert sans le contrôle ne prouve rien (C4-L11).
const RACINE_CONCEPTION = process.env.PALIMPSESTE_RACINE_CONCEPTION
  || '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

type Objet = Record<string, unknown>

interface SortieC2 { verdicts: Objet; trace: unknown[]; alertes: string[] }
interface SortieC1 { mesures: Objet; document_p2: unknown; alertes: string[] }
interface Cas {
  nom: string
  p1: Objet
  p2: unknown
  params: Record<string, string>
  code1: SortieC1
  code2: SortieC2
  trace_verdicts?: Array<string | null>
  attendu_autotest?: Objet
  motif_attendu?: string
  toutes_alertes?: string
}
interface CasReferent {
  nom: string
  contexte: Objet
  rendu: { nature_referent: string | null; referent: string | null }
  attendu_autotest: Objet | null
}
interface CasConformite { nom: string; p2: Objet; alertes: string[] }

interface Paquet {
  meta: {
    competence: string
    version_calcul: string
    version_golds_testee: string | null
    slot_document_p2: string
    observables: string[]
    catalogue: Record<string, string[]>
    params: Record<string, Objet>
    regle_agregation_citee: string
    modes_receptifs: string[]
    vide_deplacement: string
    vide_reprise: string
    absentes: Record<string, boolean>
    types: Record<string, string>
    tailles: Record<string, number>
  }
  autotest: { echecs: string[]; annonces: string[] }
  vecteurs: Cas[]
  alertes_attendues: Cas[]
  balayage_cascade: Cas[]
  balayage_conjonction: Cas[]
  balayage_crible: Cas[]
  balayage_crible_multiple: Cas[]
  balayage_limite: Cas[]
  balayage_normalisation: Cas[]
  balayage_appariement: Cas[]
  balayage_formes: Cas[]
  referent_cas: CasReferent[]
  conformite_cas: CasConformite[]
  comptes: Record<string, number>
}

function chargePaquet(): Paquet | null {
  if (!existsSync(`${RACINE_CONCEPTION}/copies-tests/questionnement/code.py`)) return null
  const r = spawnSync('python3', ['scripts/vecteurs-questionnement.py', '--racine', RACINE_CONCEPTION],
    { encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 })
  // Un portage vérifié contre un module EN ÉCHEC ne prouve rien : le harnais
  // sort en 1 quand l'autotest du module rougit, et on le fait rougir ici aussi.
  assert.equal(r.status, 0, `le harnais Python a échoué :\n${r.stderr}`)
  return JSON.parse(r.stdout) as Paquet
}

const PAQUET = chargePaquet()

function ctxDe(params: Record<string, string> = {}, contexteExercice: Record<string, string> = {}): ContexteBranchement {
  return {
    modes: [], cran: null, referent: null, exceptionOrthographe: false,
    contexteExercice,
    prives: {}, sorties: {},
    parametres: { ...PARAMS_DEFAUT, ...params },
  }
}

/** Rejoue UN cas des deux côtés — et compare CODE1 puis LES TROIS CLÉS de CODE2. */
function rejoue(cas: Cas): { c1: SortieCode1; c2: SortieC2 } {
  const ctx = ctxDe(cas.params)
  const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: cas.p1 }, ctx)
  const c2 = BRANCHEMENT_QUESTIONNEMENT.code2(cas.p2, c1, ctx) as unknown as SortieC2
  return { c1, c2 }
}

function confronte(cas: Cas, ou: string): { c1: SortieCode1; c2: SortieC2 } {
  const { c1, c2 } = rejoue(cas)
  assert.deepEqual(c1.mesures, cas.code1.mesures, `${ou}/${cas.nom} — code1.mesures`)
  assert.deepEqual(c1.document_p2, cas.code1.document_p2, `${ou}/${cas.nom} — code1.document_p2`)
  assert.deepEqual(c1.alertes, cas.code1.alertes, `${ou}/${cas.nom} — code1.alertes`)
  assert.deepEqual(c2.verdicts, cas.code2.verdicts, `${ou}/${cas.nom} — verdicts`)
  assert.deepEqual(c2.trace, cas.code2.trace, `${ou}/${cas.nom} — trace`)
  assert.deepEqual(c2.alertes, cas.code2.alertes, `${ou}/${cas.nom} — alertes`)
  return { c1, c2 }
}

function joueLot(nom: keyof Paquet, ou: string) {
  test(`${ou} — les deux côtés rendent la même chose`, (t) => {
    if (!PAQUET) return t.skip('dépôt de conception absent')
    const lot = PAQUET[nom] as Cas[]
    assert.ok(lot.length > 0, `${ou} : le lot est vide`)
    for (const cas of lot) confronte(cas, ou)
  })
}

// ════════════════════════════════════════════════════════════════════════════
// 0 — CE QUE LE MODULE EST, ET CE QU'IL N'EST PAS
// ════════════════════════════════════════════════════════════════════════════

test('le module est celui qu\'on croit, et son autotest est vert', (t) => {
  if (!PAQUET) return t.skip('dépôt de conception absent')
  assert.equal(PAQUET.meta.competence, 'questionnement')
  assert.deepEqual(PAQUET.autotest.echecs, [], 'l\'autotest du module doit être vert')

  // ⚠️⚠️ LES DEUX NOMS DU CONTRAT SONT ABSENTS, et c'est écrit plutôt que supposé.
  assert.deepEqual(PAQUET.meta.absentes, { TESTS_P2_PARFAIT: false, TESTS_CODE1_PARFAIT: false },
    'ce module ne définit NI TESTS_P2_PARFAIT NI TESTS_CODE1_PARFAIT — le « fait quand » '
    + 'se lit « les vecteurs embarqués du module »')
  // ⚠️ Le TYPE se vérifie, il ne se suppose pas : chez l'Expression,
  //    `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu « 52
  //    vecteurs » qui étaient 52 caractères.
  for (const n of ['VECTEURS', 'ALERTES_ATTENDUES', 'VECTEURS_REFERENT', 'OBSERVABLES', 'PALIERS']) {
    assert.equal(PAQUET.meta.types[n], 'list', `${n} doit être une LISTE, pas une chaîne`)
  }
  assert.equal(PAQUET.meta.tailles.VECTEURS, 30)
  assert.equal(PAQUET.meta.tailles.ALERTES_ATTENDUES, 7)
  assert.equal(PAQUET.meta.tailles.VECTEURS_REFERENT, 7)
  assert.equal(PAQUET.meta.version_golds_testee, null, 'aucun gold n\'existe : le Questionnement part au Run 1')
})

test('les constantes du portage sont celles du module, à l\'identique', (t) => {
  if (!PAQUET) return t.skip('dépôt de conception absent')
  assert.deepEqual(CATALOGUE, PAQUET.meta.catalogue, 'le CATALOGUE du portage')
  assert.deepEqual([...OBSERVABLES_MODULE], PAQUET.meta.observables, 'les OBSERVABLES du module')
  assert.deepEqual([...PALIERS], ['Absent', 'Faible', 'Moyen', 'Bon'])
  assert.deepEqual([...MODES_RECEPTIFS], PAQUET.meta.modes_receptifs)
  assert.equal(VIDE_DEPLACEMENT, PAQUET.meta.vide_deplacement)
  assert.equal(VIDE_REPRISE, PAQUET.meta.vide_reprise)
  assert.deepEqual(Object.keys(PARAMS_DEFAUT), Object.keys(PAQUET.meta.params))
  for (const [nom, spec] of Object.entries(PAQUET.meta.params)) {
    assert.equal(PARAMS_DEFAUT[nom], spec.defaut, `le défaut de ${nom}`)
  }
  // ⭐ `SLOT_DOCUMENT_P2` est DÉCLARÉ par le module, et le branchement le reprend.
  assert.equal(BRANCHEMENT_QUESTIONNEMENT.jugement(ctxDe()).slotDocument, PAQUET.meta.slot_document_p2)
})

// ════════════════════════════════════════════════════════════════════════════
// 1 — LES VECTEURS EMBARQUÉS, ET LE BALAYAGE
// ════════════════════════════════════════════════════════════════════════════

test('les 30 vecteurs embarqués — les trois clés, et l\'assertion de l\'autotest', (t) => {
  if (!PAQUET) return t.skip('dépôt de conception absent')
  assert.equal(PAQUET.vecteurs.length, 30)
  for (const cas of PAQUET.vecteurs) {
    const { c2 } = confronte(cas, 'vecteur')
    // L'autotest compare `verdicts` PLUS la trace réduite aux verdicts : on
    // rejoue son assertion telle quelle, du côté TypeScript.
    const v: Objet = { ...c2.verdicts }
    v.trace = (c2.trace as Array<{ verdict: string | null }>).map((x) => x.verdict)
    for (const [cle, att] of Object.entries(cas.attendu_autotest ?? {})) {
      assert.deepEqual(v[cle], att, `vecteur « ${cas.nom} » — ${cle}`)
    }
    assert.deepEqual(v.trace, cas.trace_verdicts, `vecteur « ${cas.nom} » — trace réduite`)
  }
})

test('les 7 vecteurs d\'alerte — le motif attendu est bien là', (t) => {
  if (!PAQUET) return t.skip('dépôt de conception absent')
  assert.equal(PAQUET.alertes_attendues.length, 7)
  for (const cas of PAQUET.alertes_attendues) {
    const { c1, c2 } = confronte(cas, 'alerte attendue')
    const toutes = [...c1.alertes, ...c2.alertes].join(' | ')
    assert.ok(toutes.includes(cas.motif_attendu as string),
      `« ${cas.motif_attendu} » attendue et absente — rendues : ${toutes || '(aucune)'}`)
    assert.equal(toutes, cas.toutes_alertes, `${cas.nom} — le texte complet des alertes`)
  }
})

joueLot('balayage_cascade', 'balayage cascade')
joueLot('balayage_conjonction', 'balayage conjonction')
joueLot('balayage_crible', 'balayage crible')
joueLot('balayage_crible_multiple', 'balayage crible multiple')
joueLot('balayage_limite', 'balayage limite')
joueLot('balayage_normalisation', 'balayage normalisation')
joueLot('balayage_appariement', 'balayage appariement')
joueLot('balayage_formes', 'balayage formes')

test('le balayage couvre ce qu\'il prétend couvrir', (t) => {
  if (!PAQUET) return t.skip('dépôt de conception absent')
  const total = Object.values(PAQUET.comptes).reduce((a, b) => a + b, 0)
  assert.ok(total > 3000, `le balayage doit porter plus de 3 000 cas (il en porte ${total})`)
  // ⭐ LA CASCADE ENTIÈRE : les cinq paliers y sont atteints, sinon le balayage
  //    contrôlerait des chemins morts (l'atteignabilité, item 20 de la boîte).
  const paliers = new Set(PAQUET.balayage_cascade.map((c) => c.code2.verdicts.palier_base))
  assert.deepEqual([...paliers].sort(), ['Absent', 'Bon', 'Faible', 'Moyen'],
    'la cascade doit atteindre ses QUATRE paliers de base')
  const niveaux = new Set(PAQUET.balayage_crible_multiple.map((c) => c.code2.verdicts.niveau))
  assert.ok(niveaux.has('Acquis'), 'le seuil doit s\'ouvrir quelque part dans le balayage du crible')
})

// ════════════════════════════════════════════════════════════════════════════
// 2 — `pre_p2` : LE RÉFÉRENT
// ════════════════════════════════════════════════════════════════════════════

test('`pre_p2` — le référent, les 7 vecteurs embarqués et 19 de plus', (t) => {
  if (!PAQUET) return t.skip('dépôt de conception absent')
  for (const cas of PAQUET.referent_cas) {
    const ctx = ctxDe({}, contexteDuReferent(cas.contexte))
    const rendu = BRANCHEMENT_QUESTIONNEMENT.jugement(ctx).preP2!(ctx)
    assert.equal(rendu.nature_referent, cas.rendu.nature_referent,
      `référent « ${cas.nom} » — nature_referent`)
    // ⚠️ Le module rend la valeur TELLE QUELLE quand elle n'est pas une chaîne
    //    — il ne durcit pas —, et c'est le banc qui la met en texte à
    //    l'injection du slot. On compare donc contre `str()` DE PYTHON : une
    //    question directrice en liste s'écrit `['q']`, jamais `q`.
    assert.equal(rendu.referent, texteDuSlot(cas.rendu.referent),
      `référent « ${cas.nom} » — referent`)
    for (const [cle, att] of Object.entries(cas.attendu_autotest ?? {})) {
      assert.equal((rendu as Objet)[cle], texteDuSlot(att), `référent « ${cas.nom} » — ${cle} (autotest)`)
    }
  }
})

/** Ce qu'un slot porte : `str()` de Python, ou `null` — jamais autre chose. */
function texteDuSlot(v: unknown): string | null {
  return v === null || v === undefined ? null : str(v)
}

/**
 * Le contexte du BANC porte un OBJET sous `reference` ; celui de la CHAÎNE ne
 * porte que des textes. On sérialise donc, ce qui est exactement ce que le
 * fournisseur natif servira le jour où il existera.
 */
function contexteDuReferent(ctx: Objet): Record<string, string> {
  const sortie: Record<string, string> = {}
  if (ctx.mode !== undefined && ctx.mode !== null) sortie.mode = String(ctx.mode)
  if (ctx.sujet !== undefined && ctx.sujet !== null) sortie.sujet = String(ctx.sujet)
  if (ctx.reference !== undefined) sortie.reference = JSON.stringify(ctx.reference)
  return sortie
}

test('⛔ SANS RÉFÉRENCE SERVIE, le mode réceptif ARRÊTE la mesure en la nommant — c’est la GARDE', () => {
  // ⭐ AMENDÉ PAR C5-L3 (27/08). Ce test s'appelait « LA CHAÎNE NE SERT AUCUNE
  //    RÉFÉRENCE » et son commentaire disait « ce que la chaîne sert tient en
  //    QUATRE noms » : c'était faux depuis le 23/08 — `FOURNISSEURS_NATIFS` en
  //    porte SIX, `reference` et `source` comprises. **Ce qu'il éprouve
  //    réellement n'a pas changé, et c'est une GARDE, pas un manque** : quand le
  //    contexte ne porte PAS de référence — parce que l'exercice n'en a pas, ou
  //    parce qu'elle n'est pas VALIDÉE, auquel cas `contexte.ts` la rend absente
  //    plutôt que vide —, le référent sort à `null` et la mesure s'arrête en
  //    nommant le slot. Le comportement voulu.
  const reel = ctxDe({}, { sujet: 'La liberté est-elle une illusion ?', consigne: 'c', copie: 'x', mode: 'interroger' })
  const rendu = BRANCHEMENT_QUESTIONNEMENT.jugement(reel).preP2!(reel)
  assert.equal(rendu.nature_referent, 'texte')
  assert.equal(rendu.referent, null,
    'sans référence au contexte, le référent est `null` — et le slot arrête la mesure')

  // ⭐ Et en `composer`, il mesure — le sujet est NATIF.
  const composer = ctxDe({}, { sujet: 'La liberté est-elle une illusion ?', mode: 'composer' })
  assert.deepEqual(BRANCHEMENT_QUESTIONNEMENT.jugement(composer).preP2!(composer),
    { nature_referent: 'sujet', referent: 'La liberté est-elle une illusion ?' })

  // ⭐⭐ ET QUAND ELLE LA SERT — ce qui est le cas depuis le 23/08 —, le portage
  //    la lit, sous le SEUL champ que le module lit et à son niveau
  //    d'imbrication. *C'est ce vecteur-ci que C5-L3 a mené jusqu'à une mesure
  //    réelle en base, sur un dépôt de lecture.*
  const avecRef = ctxDe({}, {
    mode: 'interroger',
    reference: JSON.stringify({ armature: { question_directrice: 'ce que le doute laisse intact' } }),
  })
  assert.deepEqual(BRANCHEMENT_QUESTIONNEMENT.jugement(avecRef).preP2!(avecRef),
    { nature_referent: 'texte', referent: 'ce que le doute laisse intact' })

  // ⛔ L'ancien nom `probleme` n'est PAS lu — « le module a longtemps lu
  //    `reference["probleme"]`, qui n'a jamais existé, et rien ne le voyait ».
  const ancien = ctxDe({}, { mode: 'interroger', reference: JSON.stringify({ probleme: 'x' }) })
  assert.equal(BRANCHEMENT_QUESTIONNEMENT.jugement(ancien).preP2!(ancien).referent, null)

  // Un exercice à PLUSIEURS modes est réceptif dès que l'un de ses modes l'est :
  // le référent d'un texte ne se remplace pas par un sujet.
  const mixte = ctxDe({}, { sujet: 'S', mode: 'composer, interroger' })
  assert.equal(BRANCHEMENT_QUESTIONNEMENT.jugement(mixte).preP2!(mixte).nature_referent, 'texte')
})

// ════════════════════════════════════════════════════════════════════════════
// 3 — `conformite`
// ════════════════════════════════════════════════════════════════════════════

test('`conformite` — les alertes de recette, à l\'identique', (t) => {
  if (!PAQUET) return t.skip('dépôt de conception absent')
  const ctx = ctxDe()
  const c1vide: SortieCode1 = { mesures: {}, document_p2: null, alertes: [] }
  const c2vide = { verdicts: {}, trace: [], alertes: [] } as unknown as Parameters<
    NonNullable<typeof BRANCHEMENT_QUESTIONNEMENT.conformite>>[3]
  for (const cas of PAQUET.conformite_cas) {
    const rendu = BRANCHEMENT_QUESTIONNEMENT.conformite!({}, cas.p2, c1vide, c2vide, ctx)
    assert.deepEqual(rendu, cas.alertes, `conformite « ${cas.nom} »`)
  }
})

// ════════════════════════════════════════════════════════════════════════════
// 4 — L'ÉPREUVE NÉGATIVE, ET ON LA FAIT D'ABORD SUR LA TÉLÉMÉTRIE
// ----------------------------------------------------------------------------
// « Les deux survivantes étaient toutes les deux dans la TÉLÉMÉTRIE, la moitié
//   qui ne se voit pas. Le motif est le même dans les deux cas : le vecteur de
//   test était SYMÉTRIQUE. » La parade, en deux gestes : des comptes
//   ASYMÉTRIQUES, et au moins un élément ÉCARTÉ DU DÉCOMPTE qui porte quand même
//   la propriété mesurée.
// ════════════════════════════════════════════════════════════════════════════

type Rec = { cite: string; type?: string; deplacement: string; reprise: string }

function rec(cite: string, dep = 'ce qu\'il faut prouver change', rep = 'la suite y répond'): Rec {
  return { cite, type: 'question_deplacee', deplacement: dep, reprise: rep }
}

function releveDe(
  sortieP1: Objet,
  sortieP2: Objet,
  params: Record<string, string> = {},
): { releve: Record<string, unknown>; alertes: string[]; verdicts: Objet; lettre: string | null } {
  const ctx = ctxDe(params)
  const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: sortieP1 }, ctx)
  const c2 = BRANCHEMENT_QUESTIONNEMENT.code2(sortieP2, c1, ctx)
  const r = BRANCHEMENT_QUESTIONNEMENT.releve(c2, ctx)
  return { releve: r.releve, alertes: r.alertes, verdicts: c2.verdicts, lettre: BRANCHEMENT_QUESTIONNEMENT.lettre(c2, ctx) }
}

function p1De(o: Partial<Record<string, unknown>> = {}): Objet {
  return {
    question_posee: 'Q',
    forme_question: 'question_explicite',
    notions_en_tension: 'articulees',
    enjeu: 'enonce',
    reponses_concurrentes: 'enoncees',
    recadrages: [],
    ...o,
  }
}
function p2De(o: Partial<Record<string, unknown>> = {}): Objet {
  return { question_propre: 'propre', question_specifique: 'specifique', crible: [], confiance: 'elevee', ...o }
}

test('⭐ TÉLÉMÉTRIE — les NEUF observables du §5 ont chacun leur valeur au relevé', () => {
  const { releve } = releveDe(p1De({ recadrages: [rec('A')] }),
    p2De({ crible: [{ cite: 'A', verdict: 'valide', test: 'tenue' }] }))
  for (const code of OBSERVABLES_TELEMETRIE) {
    assert.ok(code in releve, `l'observable « ${code} » manque au relevé — il sortirait en \`n/a\``)
  }
  // ⚠️ Le DÉNOMINATEUR aussi, et sous son nom EXACT : `observables.ts` le cherche
  //    à la lettre. Il manquerait, et les deux `comptage rapporté` sortiraient en
  //    `n/a` sans un mot.
  assert.ok(DENOM_TENTES in releve, `le dénominateur « ${DENOM_TENTES} » manque au relevé`)
  assert.equal(DENOM_TENTES, INSTRUMENT_QUESTIONNEMENT
    .observables_mesure.recadrage_verbal.rapporte_a as unknown as string,
  'le nom du dénominateur doit être exactement celui de la fiche dérivée')
})

test('⭐⭐ TÉLÉMÉTRIE — le relevé passe la moulinette de la fiche SANS UN SEUL `n/a` évitable', () => {
  const { releve } = releveDe(p1De({ recadrages: [rec('A')] }),
    p2De({ crible: [{ cite: 'A', verdict: 'valide', test: 'tenue' }] }))
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  const { observables, alertes } = appliquerObservablesMesure(volet, releve as never)
  assert.deepEqual(alertes, [], 'aucune alerte de forme ne doit sortir sur un relevé complet')
  for (const code of OBSERVABLES_TELEMETRIE) {
    assert.notEqual(observables[code], 'n/a',
      `« ${code} » sort en \`n/a\` sur une copie qui a pourtant l'occasion de le mesurer`)
  }
})

test('⭐⭐ ÉPREUVE NÉGATIVE — CHAQUE observable lu porte LA VALEUR DE SON CHAMP, et pas d\'un voisin', () => {
  // ⚠️⚠️ DEUX MUTATIONS ONT SURVÉCU ICI au premier passage — `question_presente`
  //    lisant `question_posee`, et `question_propre` lisant un champ du relevé —
  //    parce que les assertions d'alors vérifiaient qu'un observable EXISTE et
  //    n'est pas `n/a`, jamais CE QU'IL VAUT. C'est exactement la survivante que
  //    les items 11 et 20 de la boîte aux lettres annoncent : « la moitié qui ne
  //    se voit pas ».
  //
  // ⭐ LA PARADE : une copie où les SIX champs portent des valeurs TOUTES
  //    DIFFÉRENTES ET DIFFÉRENTES DE LEUR VALEUR RÉUSSIE — un échange de deux
  //    d'entre eux, ou la lecture d'un voisin, se voit alors immédiatement.
  const asymetrique = releveDe(
    p1De({
      question_posee: 'une question qui n\'est aucune des valeurs de catalogue',
      forme_question: 'tension_affirmee',
      notions_en_tension: 'nommees',
      enjeu: 'evoque',
      reponses_concurrentes: 'absentes',
      recadrages: [rec('A', VIDE_DEPLACEMENT)],
    }),
    p2De({ question_propre: 'avis', question_specifique: 'generique', crible: [] }),
  )
  assert.equal(asymetrique.releve.question_presente, 'tension_affirmee')
  assert.equal(asymetrique.releve.question_propre, 'avis')
  assert.equal(asymetrique.releve.notions_en_tension, 'nommees')
  assert.equal(asymetrique.releve.question_specifique, 'generique')
  assert.equal(asymetrique.releve.enjeu, 'evoque')
  assert.equal(asymetrique.releve.debat_situe, 'absentes')
  assert.equal(asymetrique.releve.recadrage, 'non')
  assert.equal(asymetrique.releve.recadrage_verbal, 1)
  assert.equal(asymetrique.releve.recadrage_non_tenu, 0)
  assert.equal(asymetrique.releve[DENOM_TENTES], 1)

  // ⭐ Et le TÉMOIN, tout à sa valeur réussie : les six lus basculent ensemble.
  const reussi = releveDe(p1De(), p2De())
  assert.equal(reussi.releve.question_presente, 'question_explicite')
  assert.equal(reussi.releve.question_propre, 'propre')
  assert.equal(reussi.releve.notions_en_tension, 'articulees')
  assert.equal(reussi.releve.question_specifique, 'specifique')
  assert.equal(reussi.releve.enjeu, 'enonce')
  assert.equal(reussi.releve.debat_situe, 'enoncees')

  // ⚠️ Le verdict que la fiche en tire, sur les deux copies — c'est LUI qui
  //    commande l'escalade N1/N2, et c'est lui qu'une lecture croisée fausserait.
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  for (const code of ['question_presente', 'question_propre', 'notions_en_tension',
    'question_specifique', 'enjeu', 'debat_situe'] as const) {
    assert.equal(statutDeLaMesure(reussi.releve[code] as string, volet[code]), 'reussie',
      `« ${code} » doit être RÉUSSIE sur la copie témoin`)
  }
  // ⭐ `tension_affirmee` est À ÉGALITÉ avec `question_explicite` — la seule des
  //    six à porter DEUX valeurs réussies, et c'est la fiche qui le veut.
  assert.equal(statutDeLaMesure(asymetrique.releve.question_presente as string, volet.question_presente),
    'reussie', '`tension_affirmee` est une réussite, « c\'est la construction qui départage »')
  for (const code of ['question_propre', 'notions_en_tension', 'question_specifique',
    'enjeu', 'debat_situe'] as const) {
    assert.equal(statutDeLaMesure(asymetrique.releve[code] as string, volet[code]), 'ratee',
      `« ${code} » doit être RATÉE sur la copie asymétrique`)
  }
})

test('⚠️⚠️ SOCLE — `valeur_reussie` EN LISTE : `question_presente` doit pouvoir être RÉUSSIE', () => {
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  const e = volet.question_presente
  // La fiche l'écrit en liste : « `forme_question` ∈ {question_explicite,
  // tension_affirmee} ». C'est le SEUL observable du corpus dans ce cas, et une
  // égalité stricte contre un tableau est fausse pour TOUTE valeur.
  assert.ok(Array.isArray(e.valeur_reussie), 'le dérivé porte bien une LISTE')
  assert.equal(statutDeLaMesure('question_explicite', e), 'reussie')
  assert.equal(statutDeLaMesure('tension_affirmee', e), 'reussie')
  assert.equal(statutDeLaMesure('theme_nominal', e), 'ratee')
  assert.equal(statutDeLaMesure('absent', e), 'ratee')
  assert.equal(statutDeLaMesure('n/a', e), 'sans_objet')
  // ⭐ Et le scalaire, qui est le cas des cinq autres fiches, n'a pas bougé.
  assert.equal(statutDeLaMesure('propre', volet.question_propre), 'reussie')
  assert.equal(statutDeLaMesure('avis', volet.question_propre), 'ratee')
})

test('⭐⭐ ÉPREUVE NÉGATIVE — `recadrage` N\'EST PAS `seuil_franchi`', () => {
  // ⚠️ Le cas ASYMÉTRIQUE qui les sépare : un recadrage VALIDE sur une base
  //    MOYEN. Le §5 dit « au moins un recadrage `valide` après crible », sans un
  //    mot du palier ; le §4 dit que le seuil exige EN PLUS la base Bon.
  const bas = releveDe(p1De({ enjeu: 'absent', recadrages: [rec('A')] }),
    p2De({ crible: [{ cite: 'A', verdict: 'valide', test: 'tenue' }] }))
  assert.equal(bas.verdicts.palier_base, 'Moyen')
  assert.equal(bas.verdicts.seuil_franchi, 'non')
  assert.equal(bas.releve.recadrage, 'oui',
    'un recadrage valide sur une base Moyen doit rendre `recadrage = oui` — « un élève qui '
    + 'stagne à Bon sans jamais recadrer a précisément le recadrage comme prochaine chose à travailler »')
  assert.equal(bas.verdicts.niveau, 'Moyen', 'le seuil ouvre Acquis, il n\'élève jamais la base')

  // Et le témoin : la même copie à base Bon franchit, elle.
  const haut = releveDe(p1De({ recadrages: [rec('A')] }),
    p2De({ crible: [{ cite: 'A', verdict: 'valide', test: 'tenue' }] }))
  assert.equal(haut.verdicts.seuil_franchi, 'oui')
  assert.equal(haut.releve.recadrage, 'oui')
  assert.equal(haut.lettre, 'A')

  // Sans aucun recadrage : `recadrage = non`, et ce n'est PAS `n/a` — l'élève a
  // eu l'occasion et ne l'a pas prise.
  const sans = releveDe(p1De(), p2De())
  assert.equal(sans.releve.recadrage, 'non')
  assert.equal(sans.verdicts.seuil_franchi, 'non')
  assert.equal(sans.lettre, 'B')
})

test('⭐⭐ ÉPREUVE NÉGATIVE — les deux `comptage rapporté`, sur des comptes ASYMÉTRIQUES', () => {
  // ⭐ TROIS populations de tailles différentes, et un élément ÉCARTÉ DES DEUX
  //    NUMÉRATEURS QUI PORTE QUAND MÊME LA PROPRIÉTÉ : le recadrage `D`, que le
  //    juge n'a pas jugé. Il reste une TENTATIVE — donc au dénominateur —, et il
  //    n'est ni verbal ni non_tenu.
  const r = releveDe(
    p1De({
      recadrages: [
        rec('A'),                                   // jugé valide
        rec('B', VIDE_DEPLACEMENT),                 // verbal par le CODE
        rec('C', 'un vrai déplacement', VIDE_REPRISE), // non_tenu par le CODE
        rec('D'),                                   // ⭐ NON JUGÉ — écarté des numérateurs
        rec('E'),                                   // verbal par le JUGE
      ],
    }),
    p2De({
      crible: [
        { cite: 'A', verdict: 'valide', test: 'tenue' },
        { cite: 'E', verdict: 'verbal', test: 'deplacement' },
      ],
    }),
  )
  // 5 tentés · 2 verbaux (B, E) · 1 non_tenu (C) · 1 valide (A) · 1 non jugé (D)
  assert.equal(r.releve[DENOM_TENTES], 5, 'les CINQ recadrages tentés, le non jugé compris')
  assert.equal(r.releve.recadrage_verbal, 2)
  assert.equal(r.releve.recadrage_non_tenu, 1)
  assert.equal(r.releve.recadrage, 'oui')
  // ⚠️ Les trois comptes sont DIFFÉRENTS et leur somme (4) est STRICTEMENT
  //    INFÉRIEURE au dénominateur (5). Un portage qui prendrait le mauvais
  //    numérateur, ou le décompte pour dénominateur, tomberait ici.
  assert.notEqual(r.releve.recadrage_verbal, r.releve.recadrage_non_tenu)
  const somme = (r.releve.recadrage_verbal as number) + (r.releve.recadrage_non_tenu as number) + 1
  assert.ok(somme < (r.releve[DENOM_TENTES] as number),
    'un recadrage non jugé doit rester HORS des numérateurs et DANS le dénominateur')

  // Et le taux que la fiche lira : 2/5 = 0,4 < 0,5 → réussi ; 1/5 = 0,2 → réussi.
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  assert.equal(valeurDe('recadrage_verbal', volet.recadrage_verbal, r.releve as never).valeur, 2 / 5)
  assert.equal(statutDeLaMesure(2 / 5, volet.recadrage_verbal), 'reussie')
  assert.equal(statutDeLaMesure(3 / 5, volet.recadrage_verbal), 'ratee', 'le seuil de la fiche est 0,5, `moins_de`')
})

test('⭐ TÉLÉMÉTRIE — sans tentative, le taux est NULL, JAMAIS 0', () => {
  const r = releveDe(p1De(), p2De())
  assert.equal(r.releve[DENOM_TENTES], 0)
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  // « Un élève qui n'en tente aucun a un taux NULL, jamais 0 — et un observable
  //   dont le dénominateur est vide ne peut pas être "non acquis". »
  assert.equal(valeurDe('recadrage_verbal', volet.recadrage_verbal, r.releve as never).valeur, 'n/a')
  assert.equal(statutDeLaMesure('n/a', volet.recadrage_verbal), 'sans_objet')
  assert.equal(statutDeLaMesure('n/a', volet.recadrage_non_tenu), 'sans_objet')
  // ⛔ Et le zéro NE DOIT PAS ressembler à une réussite.
  assert.notEqual(statutDeLaMesure('n/a', volet.recadrage_verbal), 'reussie')
})

test('⭐⭐ ÉPREUVE NÉGATIVE — les cinq observables LUS le sont sur les champs RÉSOLUS, pas sur les bruts', () => {
  // ⚠️ Le cas discriminant : un `limite` seul, résolu À LA BORNE HAUTE. La
  //    cascade lit `enonce` ; un observable qui lirait le brut lirait `limite`,
  //    dirait `ratee`, et CONTREDIRAIT le palier qu'il est censé expliquer.
  const r = releveDe(p1De({ enjeu: 'limite', note_enjeu: 'entre enonce et evoque' }), p2De())
  assert.equal(r.verdicts.palier_base, 'Bon', 'la borne haute fait monter la copie')
  assert.equal(r.releve.enjeu, 'enonce', '`enjeu` doit porter la valeur RÉSOLUE, pas « limite »')
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  assert.equal(statutDeLaMesure(r.releve.enjeu as string, volet.enjeu), 'reussie')

  // Le témoin, à DEUX `limite` : tout retombe à la borne basse, et l'observable
  // suit — « une hésitation est une hésitation, deux sont un relevé qui n'a rien
  // établi ».
  const deux = releveDe(p1De({
    enjeu: 'limite', note_enjeu: 'entre enonce et evoque',
    reponses_concurrentes: 'limite', note_reponses_concurrentes: 'entre enoncees et evoquees',
  }), p2De())
  assert.equal(deux.verdicts.palier_base, 'Moyen')
  assert.equal(deux.releve.enjeu, 'evoque')
  assert.equal(deux.releve.debat_situe, 'evoquees')
  assert.equal(statutDeLaMesure(deux.releve.enjeu as string, volet.enjeu), 'ratee')
})

test('⚠️ `question_propre` À `n/a` SORT EN `sans_objet` — le CADRE tranche là où la fiche se tait', () => {
  // ⚠️ ASYMÉTRIE RELEVÉE, NON CORRIGÉE. `question_specifique` déclare
  //    `sans_objet_si: n/a` au bloc machine ; `question_propre`, NON — alors que
  //    `n/a` est une valeur légale de son catalogue (« `n/a` si `question_posee`
  //    est vide », fiche §4). Lu à la lettre, un `n/a` compterait donc RATÉ.
  // ⭐ Mais `NA = 'n/a'` est la SENTINELLE GLOBALE d'`observables.ts`, et
  //    `statutDeLaMesure` rend `sans_objet` sur elle avant même de regarder
  //    `sans_objet_si`. Le cadre tranche donc dans le sens de la fiche, par un
  //    autre chemin. *Consigné au registre des ouverts — pas contourné.*
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  assert.equal(volet.question_propre.sans_objet_si, undefined, 'la fiche ne le déclare pas')
  assert.equal(statutDeLaMesure('n/a', volet.question_propre), 'sans_objet')
  assert.equal(statutDeLaMesure('n/a', volet.question_specifique), 'sans_objet')

  // Et la copie qui le produit : aucune question posée, forme absente.
  const muette = releveDe(p1De({ question_posee: '', forme_question: 'absent' }),
    p2De({ question_propre: 'n/a', question_specifique: 'n/a' }))
  assert.equal(muette.verdicts.niveau, 'Absent')
  assert.equal(muette.releve.question_propre, 'n/a')
  assert.equal(statutDeLaMesure(muette.releve.question_propre as string, volet.question_propre),
    'sans_objet', 'une copie sans question ne RATE pas le second plancher : elle n\'a pas d\'occasion')
  // ⭐ Le premier plancher, lui, est bien RATÉ — il a eu son occasion.
  assert.equal(muette.releve.question_presente, 'absent')
  assert.equal(statutDeLaMesure(muette.releve.question_presente as string, volet.question_presente), 'ratee')
})

test('⭐⭐ ÉPREUVE NÉGATIVE — `question_specifique` : UN SEUL CALCUL, DEUX LECTURES', () => {
  // ⭐ Le seul observable du corpus qui soit dans les DEUX listes. Deux calculs
  //    seraient deux domiciles qui divergent : on assère qu'ils sont ÉGAUX, sur
  //    les trois valeurs du catalogue.
  for (const spec of CATALOGUE.specificites) {
    const r = releveDe(p1De(), p2De({ question_specifique: spec }))
    assert.equal(r.releve.question_specifique, r.verdicts.question_specifique,
      `« ${spec} » — le relevé RECOPIE le verdict de code2, il ne le refait pas`)
  }
  // Et `sans_objet_si: n/a` mord bien : une copie sans question ne dit rien de
  // la spécificité, elle ne la RATE pas.
  const volet = INSTRUMENT_QUESTIONNEMENT.observables_mesure as unknown as Record<string, EntreeObservableMesure>
  assert.equal(statutDeLaMesure('n/a', volet.question_specifique), 'sans_objet')
  assert.equal(statutDeLaMesure('generique', volet.question_specifique), 'ratee')
  assert.equal(statutDeLaMesure('specifique', volet.question_specifique), 'reussie')
})

test('⭐ ÉPREUVE NÉGATIVE — la CASCADE, ligne par ligne, contre les libellés du §2', () => {
  const palier = (p: Objet, q: Objet, par: Record<string, string> = {}) =>
    releveDe(p, q, par).verdicts.palier_base

  // Ligne 1 — « Absent si la forme de la question est absente OU si la question
  //             n'est pas propre — l'énoncé retourné ou un avis ».
  assert.equal(palier(p1De({ forme_question: 'absent' }), p2De()), 'Absent')
  assert.equal(palier(p1De(), p2De({ question_propre: 'reprise_enonce' })), 'Absent')
  assert.equal(palier(p1De(), p2De({ question_propre: 'avis' })), 'Absent')
  // ⚠️ ET LE PIÈGE QUE `question_propre` ATTRAPE : l'énoncé retourné est
  //    parfaitement SPÉCIFIQUE. Une lecture qui n'ordonnerait pas les deux
  //    conditions rendrait Bon.
  assert.equal(palier(p1De(), p2De({ question_propre: 'reprise_enonce', question_specifique: 'specifique' })),
    'Absent')

  // Ligne 2 — « Faible si la forme est un thème nominal OU si les notions ne
  //             sont pas articulées ».
  assert.equal(palier(p1De({ forme_question: 'theme_nominal' }), p2De()), 'Faible')
  assert.equal(palier(p1De({ notions_en_tension: 'nommees' }), p2De()), 'Faible')
  assert.equal(palier(p1De({ notions_en_tension: 'absentes' }), p2De()), 'Faible')
  // ⭐ `tension_affirmee` EST À ÉGALITÉ avec `question_explicite` — « c'est la
  //    construction qui départage, jamais la syntaxe » (fiche §1.3).
  assert.equal(palier(p1De({ forme_question: 'tension_affirmee' }), p2De()), 'Bon')

  // Ligne 3 — « Moyen si la question est générique ».
  assert.equal(palier(p1De(), p2De({ question_specifique: 'generique' })), 'Moyen')

  // Ligne 4 — « Bon si elle est spécifique ET l'enjeu énoncé ET une réponse
  //             concurrente énoncée » ; ligne 5 — « Moyen sinon » (BORNE BASSE).
  assert.equal(palier(p1De(), p2De()), 'Bon')
  assert.equal(palier(p1De({ enjeu: 'evoque' }), p2De()), 'Moyen')
  assert.equal(palier(p1De({ reponses_concurrentes: 'evoquees' }), p2De()), 'Moyen')
  // ⚠️ La conjonction est STRICTE par défaut : deux termes sur trois ne suffisent
  //    pas — « elle ne monte pas à Bon par les deux tiers ».
  assert.equal(palier(p1De({ enjeu: 'absent' }), p2De()), 'Moyen')
  assert.equal(palier(p1De({ enjeu: 'absent' }), p2De(), { conjonction_bon: 'deux_sur_trois' }), 'Bon')
  // ⭐ Et le paramètre ne peut PAS forcer Bon sur une question générique : la
  //    ligne 3 porte seule, avant lui.
  assert.equal(palier(p1De(), p2De({ question_specifique: 'generique' }),
    { conjonction_bon: 'deux_sur_trois' }), 'Moyen')
})

test('⭐⭐ ÉPREUVE NÉGATIVE — L\'ORDRE DES DEUX TESTS DU CRIBLE', () => {
  const verdictsDe = (recs: Rec[], crible: Objet[]) => {
    const ctx = ctxDe()
    const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p1De({ recadrages: recs }) }, ctx)
    const c2 = BRANCHEMENT_QUESTIONNEMENT.code2(p2De({ crible }), c1, ctx)
    return (c2.trace as unknown as Array<{ verdict: string | null }>).map((t) => t.verdict)
  }
  // « Un recadrage sans déplacement écrit est `verbal` quoi qu'il arrive — sa
  //   reprise ne se regarde même pas. » ⚠️ Le cas discriminant : PAS de
  //   déplacement ET PAS de reprise. L'ordre inverse rendrait `non_tenu`.
  assert.deepEqual(verdictsDe([rec('A', VIDE_DEPLACEMENT, VIDE_REPRISE)], []), ['verbal'])
  // « Si le juge dit que le déplacement n'est pas réel, son verdict `verbal`
  //   l'emporte sur le pré-verdict `non_tenu` du code. »
  assert.deepEqual(verdictsDe([rec('A', 'un vrai déplacement', VIDE_REPRISE)],
    [{ cite: 'A', verdict: 'verbal', test: 'deplacement' }]), ['verbal'])
  // Et sans le juge, la reprise vide rend `non_tenu`.
  assert.deepEqual(verdictsDe([rec('A', 'un vrai déplacement', VIDE_REPRISE)], []), ['non_tenu'])
  // ⛔ LE CRIBLE NE RELÈVE JAMAIS : le juge qui valide un recadrage sans reprise
  //    est refusé, et l'alerte le dit.
  assert.deepEqual(verdictsDe([rec('A', 'un vrai déplacement', VIDE_REPRISE)],
    [{ cite: 'A', verdict: 'valide', test: 'tenue' }]), ['non_tenu'])
})

test('⭐ ÉPREUVE NÉGATIVE — le silence du juge ne vaut JAMAIS acquiescement', () => {
  const ctx = ctxDe()
  // « Se taire sur `question_propre` donnait Bon là où "reprise_enonce" donnait
  //   Absent — l'omission était plus favorable que toute valeur légale du même
  //   champ (RM13). » Le passage est MANQUÉ : aucun verdict n'est composé.
  for (const manquant of ['question_propre', 'question_specifique']) {
    const p2 = p2De()
    delete p2[manquant]
    const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p1De() }, ctx)
    const c2 = BRANCHEMENT_QUESTIONNEMENT.code2(p2, c1, ctx)
    for (const o of OBSERVABLES_MODULE) {
      assert.equal(c2.verdicts[o], null, `${manquant} absent — ${o} doit être null`)
    }
    assert.ok(c2.alertes.some((a) => a.startsWith('PASSAGE MANQUÉ')), `${manquant} — l'alerte`)
    assert.equal(BRANCHEMENT_QUESTIONNEMENT.lettre(c2, ctx), null, 'aucune lettre sur un passage manqué')
    // ⚠️ ET LA TÉLÉMÉTRIE SE TAIT EN LE DISANT — « ou son alerte nommée ».
    const r = BRANCHEMENT_QUESTIONNEMENT.releve(c2, ctx)
    assert.deepEqual(r.releve, {}, 'aucune valeur sur un passage manqué')
    assert.equal(r.alertes.length, OBSERVABLES_TELEMETRIE.length,
      'chaque observable du §5 doit porter SON alerte nommée')
    for (const code of OBSERVABLES_TELEMETRIE) {
      assert.ok(r.alertes.some((a) => a.startsWith(`${code} :`)), `l'alerte de « ${code} »`)
    }
  }
})

test('⭐ ÉPREUVE NÉGATIVE — la borne HAUTE des `limite` est bien la HAUTE, et elle tombe à deux', () => {
  const enjeuDe = (p: Objet) => releveDe(p, p2De()).releve.enjeu
  // Un seul `limite`, note lisible : LE PLUS FORT DES DEUX.
  assert.equal(enjeuDe(p1De({ enjeu: 'limite', note_enjeu: 'entre enonce et evoque' })), 'enonce')
  assert.equal(enjeuDe(p1De({ enjeu: 'limite', note_enjeu: 'entre evoque et absent' })), 'evoque')
  // Deux `limite` : tout retombe à la borne basse — « la charité s'adresse à
  // l'élève qui a fait le geste, pas à un relevé qui n'a rien vu ».
  const deux = p1De({
    enjeu: 'limite', note_enjeu: 'entre enonce et evoque',
    notions_en_tension: 'limite', note_notions_en_tension: 'entre articulees et nommees',
  })
  assert.equal(enjeuDe(deux), 'evoque')
  assert.equal(releveDe(deux, p2De()).releve.notions_en_tension, 'nommees')
  // Une note illisible : alerte, et BORNE BASSE, même seule.
  const illisible = releveDe(p1De({ enjeu: 'limite', note_enjeu: 'je ne sais pas' }), p2De())
  assert.equal(illisible.releve.enjeu, 'absent')
  // ⛔ Une note qui nomme les TROIS valeurs : le module prend le plus fort (haute)
  //    ou le plus faible (basse) parmi TOUTES celles qu'elle nomme.
  assert.equal(enjeuDe(p1De({ enjeu: 'limite', note_enjeu: 'enonce, evoque ou absent' })), 'enonce')
})

test('⭐ ÉPREUVE NÉGATIVE — la lettre-équivalente couvre les CINQ paliers', () => {
  assert.deepEqual(LETTRE_DU_NIVEAU, { Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A' })
  const ctx = ctxDe()
  const cas: Array<[Objet, Objet, string]> = [
    [p1De({ forme_question: 'absent', question_posee: '' }), p2De({ question_propre: 'n/a', question_specifique: 'n/a' }), 'E'],
    [p1De({ forme_question: 'theme_nominal' }), p2De(), 'D'],
    [p1De(), p2De({ question_specifique: 'generique' }), 'C'],
    [p1De(), p2De(), 'B'],
    [p1De({ recadrages: [rec('A')] }), p2De({ crible: [{ cite: 'A', verdict: 'valide', test: 'tenue' }] }), 'A'],
  ]
  for (const [p, q, attendue] of cas) {
    const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p }, ctx)
    const c2 = BRANCHEMENT_QUESTIONNEMENT.code2(q, c1, ctx)
    assert.equal(BRANCHEMENT_QUESTIONNEMENT.lettre(c2, ctx), attendue,
      `la lettre de « ${c2.verdicts.niveau} »`)
  }
})

// ════════════════════════════════════════════════════════════════════════════
// 5 — CE QUE LE PORTAGE DURCIT, ET QUI NE SE DÉCLENCHE SUR AUCUN VECTEUR
// ----------------------------------------------------------------------------
// « Le module ne lève jamais d'exception : elle traverserait le banc et
//   emporterait la trace avec elle » (`CONTRAT` §3). Là où le module lèverait, le
//   portage rend une ALERTE NOMMÉE — jamais une valeur par défaut.
// ════════════════════════════════════════════════════════════════════════════

test('⚠️ PORTAGE — là où le module LÈVERAIT, le portage rend une alerte nommée', () => {
  const ctx = ctxDe()
  const alertesDe = (p: unknown, q: unknown) => {
    const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p }, ctx)
    const c2 = BRANCHEMENT_QUESTIONNEMENT.code2(q, c1, ctx)
    return { c1, c2, toutes: [...c1.alertes, ...c2.alertes] }
  }
  // `.strip()` sur un nombre.
  const a = alertesDe(p1De({ recadrages: [{ cite: 'A', deplacement: 42, reprise: 'r' }] }), p2De())
  assert.ok(a.toutes.some((x) => x.includes('deplacement')), a.toutes.join(' | '))
  const b = alertesDe(p1De({ question_posee: 42 }), p2De())
  assert.ok(b.toutes.some((x) => x.includes('question_posee')), b.toutes.join(' | '))
  // `for j in 5` sur le crible.
  const c = alertesDe(p1De({ recadrages: [rec('A')] }), p2De({ crible: 7 }))
  assert.ok(c.toutes.some((x) => x.includes('parcourable')), c.toutes.join(' | '))
  // `p2.get(...)` sur autre chose qu'un objet.
  const d = alertesDe(p1De(), 'une chaîne')
  assert.ok(d.c2.alertes.some((x) => x.startsWith('PASSAGE MANQUÉ')))
  // `dict(sortie_p1)` sur autre chose qu'un objet.
  const e = alertesDe('un texte', p2De())
  assert.ok(e.c1.alertes.some((x) => x.includes('P1 illisible')))
  // ⚠️ `« Absent » in 5` dans `conformite`.
  const c1vide: SortieCode1 = { mesures: {}, document_p2: null, alertes: [] }
  const c2vide = { verdicts: {}, trace: [], alertes: [] } as unknown as Parameters<
    NonNullable<typeof BRANCHEMENT_QUESTIONNEMENT.conformite>>[3]
  const f = BRANCHEMENT_QUESTIONNEMENT.conformite!({}, { levier: 42 }, c1vide, c2vide, ctx)
  assert.ok(f.some((x) => x.includes('où un palier ne se cherche pas')), f.join(' | '))
  const g = BRANCHEMENT_QUESTIONNEMENT.conformite!({}, 7, c1vide, c2vide, ctx)
  assert.ok(g.some((x) => x.includes('parcourable')), g.join(' | '))
})

test('⛔ PORTAGE — ce qui n\'est PAS durci : `for x in v` sur une CHAÎNE rend ses CARACTÈRES', () => {
  const ctx = ctxDe()
  const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p1De({ recadrages: [rec('A')] }) }, ctx)
  // ⭐ Un `crible` rendu EN TEXTE par le juge ne porte AUCUNE requalification :
  //    Python y voit sept caractères, donc sept entrées illisibles. Un portage
  //    qui le lirait comme une entrée unique FABRIQUERAIT une requalification.
  const c2 = BRANCHEMENT_QUESTIONNEMENT.code2(p2De({ crible: 'valide' }), c1, ctx)
  const illisibles = c2.alertes.filter((a) => a.includes("n'est pas un objet — ignorée"))
  assert.equal(illisibles.length, 'valide'.length,
    'une chaîne de 6 caractères doit rendre 6 entrées illisibles, pas une')
  // Le recadrage reste donc jugé par le CODE seul.
  assert.deepEqual((c2.trace as unknown as Array<{ verdict: string | null }>).map((x) => x.verdict), [null])
})

// ════════════════════════════════════════════════════════════════════════════
// 5 bis — CE QUE L'ÉPREUVE NÉGATIVE A LAISSÉ SURVIVRE, ET POURQUOI CE N'EST PAS
//         UN TROU. 55 mutations, 53 tombées, DEUX survivantes — et les deux sont
//         du CODE ÉQUIVALENT sur ce module, pas un contrôle absent.
// ----------------------------------------------------------------------------
// « Quand la parade des items 11 et 20 est appliquée d'emblée, ce qui survit
//   n'est plus un oubli — c'est une règle inatteignable ou du code équivalent, et
//   l'analyse d'une survivante devient une question sur LA RÈGLE. »
//
// ⛔ Une équivalence s'ÉTABLIT, elle ne s'affirme pas : les deux tests ci-dessous
//    la démontrent par exhaustion sur la population réelle de chaque cas.
// ════════════════════════════════════════════════════════════════════════════

test('SURVIVANTE 1 — la vérité de Python et celle de JavaScript sont ÉQUIVALENTES dans `_nn`', () => {
  // `_nn` fait `str(v or "")`. Python et JavaScript ne divergent que sur `[]` et
  // `{}` — faux d'un côté, vrais de l'autre. La question est donc : `str([])` et
  // `str({})` peuvent-ils changer un verdict de `_nn` ?
  //
  // `_nn` n'a QUE DEUX usages dans le module : l'égalité à « limite », et la
  // recherche d'une valeur d'échelle dans la note. On les épuise tous les deux.
  const divergents = ['[]', '{}'] // ce que `str()` de Python rend de `[]` et `{}`
  const echelles = ['articulees', 'nommees', 'absentes', 'enonce', 'evoque', 'absent',
    'enoncees', 'evoquees']
  for (const s of divergents) {
    assert.notEqual(s, 'limite', `« ${s} » ne peut pas être pris pour « limite »`)
    for (const v of echelles) {
      assert.ok(!s.includes(v), `« ${s} » ne peut pas nommer la valeur « ${v} »`)
    }
  }
  // Et le pendant vide, que Python rend à leur place, ne le peut pas davantage.
  assert.notEqual('', 'limite')
  for (const v of echelles) assert.ok(!''.includes(v))
  // ⭐ Conclusion établie, pas supposée : sur CE module, les deux lectures
  //    rendent le même verdict partout — la mutation est équivalente, et le
  //    portage garde `estVrai()` parce que la fidélité ne se négocie pas sur un
  //    module qui peut changer.
})

test('SURVIVANTE 2 — `sorted()` de Python et `.sort()` de JS coïncident sur CES trois noms', () => {
  // Le tri ne porte JAMAIS sur autre chose que les trois champs de `ORDRE` —
  // une population FERMÉE de trois noms ASCII minuscules. Les deux tris ne
  // divergent que hors du plan de base ; ici ils ne peuvent pas.
  const noms = ['notions_en_tension', 'enjeu', 'reponses_concurrentes']
  for (let masque = 0; masque < 8; masque += 1) {
    const partie = noms.filter((_, i) => (masque >> i) & 1)
    assert.deepEqual(trie(partie), [...partie].sort(),
      `les deux tris doivent coïncider sur { ${partie.join(', ')} }`)
  }
  // ⭐ Et on garde `trie()` quand même : le jour où un nom de champ porterait un
  //    caractère hors du plan de base, la fidélité serait déjà là.
})

// ════════════════════════════════════════════════════════════════════════════
// 6 — LES SLOTS, ET CE QUE LE BRANCHEMENT DÉCLARE
// ════════════════════════════════════════════════════════════════════════════

test('les slots déclarés sont ceux des prompts dérivés — et le document n\'est PAS le référent', () => {
  const ctx = ctxDe()
  const inst = INSTRUMENT_QUESTIONNEMENT as unknown as InstrumentCompetence
  const slots = (gabarit: string) => [...new Set([...gabarit.matchAll(/\{([a-z0-9_]+)\}/g)].map((m) => m[1]))].sort()

  // ⭐ P1 : DEUX slots, tous deux NATIFS — aucun crochet pré-phase.
  assert.deepEqual(slots(inst.prompts.P1), ['copie', 'sujet'])
  const ext = BRANCHEMENT_QUESTIONNEMENT.extractions(ctx)
  assert.equal(ext.length, 1)
  assert.equal(ext[0].tetePrompt, 'P1')
  assert.deepEqual([...ext[0].slotsFournis], [], 'P1 n\'a AUCUN slot à fournir : les deux sont natifs')
  assert.equal(ext[0].pre, undefined, 'le module ne définit aucun `pre_p1`')
  assert.equal(BRANCHEMENT_QUESTIONNEMENT.prepareCopie, undefined, 'le module ne définit aucun `prepare_copie`')

  // ⭐ P2 : TROIS slots — le document DÉCLARÉ, plus les deux du référent.
  assert.deepEqual(slots(inst.prompts.P2), ['nature_referent', 'referent', 'squelette_phase_1'])
  const jug = BRANCHEMENT_QUESTIONNEMENT.jugement(ctx)
  assert.equal(jug.slotDocument, 'squelette_phase_1')
  assert.deepEqual([...(jug.slotsFournis ?? [])].sort(), ['nature_referent', 'referent'])
  // ⛔ Le document n'est PAS le référent : les intervertir ferait lire au juge le
  //    référent à la place du relevé, et rendre des verdicts propres sur rien.
  assert.ok(!(jug.slotsFournis ?? []).includes(jug.slotDocument as string))
})

test('`delta` n\'est PAS déclaré — la fiche se tait, et on ne l\'invente pas', () => {
  assert.equal(BRANCHEMENT_QUESTIONNEMENT.delta, undefined,
    'le mot « delta » n\'apparaît pas une fois dans `competences/questionnement.md` : '
    + 'l\'inventer ici serait trancher une règle de grille depuis le code')
})

test('`code1` rend TOUJOURS la clé `document_p2` — le seul défaut dont rien ne témoigne', () => {
  const ctx = ctxDe()
  for (const p of [p1De(), {}, 'un texte', null, 42, []]) {
    const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p }, ctx)
    assert.ok('document_p2' in c1, `la clé manque sur ${JSON.stringify(p)}`)
  }
  // « Sa VALEUR peut être null — un relevé illisible n'a pas de document — ;
  //   c'est l'ABSENCE de la clé qui est l'erreur. »
  assert.deepEqual(BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p1De() }, ctx).document_p2, p1De())
  // ⛔ AUCUN NOMBRE N'EST INJECTÉ DANS P2 : le document est le relevé BRUT, pas
  //    les `mesures` — « le juge ne compte rien ».
  const c1 = BRANCHEMENT_QUESTIONNEMENT.code1({ p1: p1De({ recadrages: [rec('A')] }) }, ctx)
  assert.ok(!('nb_limites' in (c1.document_p2 as Objet)))
  assert.ok(!('pre_verdict' in JSON.parse(JSON.stringify(c1.document_p2))))
})
