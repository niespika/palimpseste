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
// ⚠️⚠️ LA STRUCTURE N'A NI GOLD NI VECTEUR P2 — `TESTS_P2_PARFAIT` est VIDE,
//    `TESTS_CODE1_PARFAIT` en porte UN, `VERSION_GOLDS_TESTEE` vaut `None`. Elle
//    a en revanche ce qu'aucune des cinq autres n'a : **112 COUPLES (P1, P2)
//    RÉELLEMENT PRODUITS PAR LE BANC**, qui dorment dans
//    `copies-tests/structure/resultats/`. C'est la contre-épreuve la moins chère
//    du dépôt — aucun appel, aucune dépense — et elle porte ce qu'aucun vecteur
//    synthétique ne porte : des accents, des apostrophes typographiques, des
//    `niveau` hors catalogue, des `parties[].blocs` en dictionnaires, deux
//    générations de schéma de squelette, et un P2 qui rendait encore des niveaux.
//
// ⭐ ET LE BALAYAGE, pour ce que même le réel ne couvre pas : 1 254 cas de plus,
//    passés dans LA MÊME FONCTION DU MÊME MODULE. Il n'invente aucune règle ; il
//    cesse de ne la lui demander qu'une fois.
//
// ⭐⭐ L'ÉPREUVE NÉGATIVE COMMENCE PAR LA TÉLÉMÉTRIE, et ce n'est pas un caprice
//    d'ordre : sur l'Argumentation, « douze contrôles sur quatorze sont tombés,
//    et LES DEUX SURVIVANTS ÉTAIENT TOUS LES DEUX DANS LA TÉLÉMÉTRIE » — la
//    moitié qui ne se voit pas, celle qu'aucun module ne calcule et qu'aucun
//    gold ne couvre. Les assertions « FICHE » ci-dessous sont écrites contre le
//    TEXTE de la fiche, jamais contre le module : un portage qui inverserait une
//    règle les ferait tomber même si le module et lui s'accordaient — ils
//    s'accorderaient sur la même erreur.
//
// ⚠️ CE N'EST PAS UNE FIXTURE FIGÉE. Le harnais Python
//    (`scripts/vecteurs-structure.py`) rejoue le module À CHAQUE EXÉCUTION : le
//    jour où le module bouge — un seuil, une règle, un ordre —, ce test le dit.
//    « Des vecteurs qui pourrissent en silence valideraient le calcul contre une
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
  BRANCHEMENT_STRUCTURE, OBSERVABLES_TELEMETRIE, OBSERVABLES_MODULE,
  DENOM_CHARNIERES, DENOM_DEV, CATALOGUE,
} from './structure'
import { blocs, normaliserRetours } from '../../passation/transcription-calcul'
import type { ContexteBranchement, SortieCode1, SortieCode2 } from '../instruments'

// ⚠️ Le dépôt de conception vit à un chemin ABSOLU hors de ce dépôt. Le fixer en
// dur ici faisait SAUTER le contrôle partout ailleurs que sur la machine du
// professeur — et un `npm test` vert sans le contrôle ne prouve rien (C4-L11).
const RACINE_CONCEPTION = process.env.PALIMPSESTE_RACINE_CONCEPTION
  || '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

interface Attendu {
  code1: { mesures: Record<string, unknown>; document_p2: unknown; alertes: string[] }
  code2: { verdicts: Record<string, unknown>; trace: string[]; alertes: string[] }
  conformite: string[]
}
interface CasPassage {
  nom: string
  releve: unknown
  entree_p2: unknown
  params: Record<string, unknown>
  attendu?: Attendu
  /** Rempli à la place d'`attendu` quand LE MODULE LÈVE — le contrat l'interdit. */
  leve?: string
  enveloppe_de_run?: boolean
  /** `balayage_statut` seulement — les entrées, en clair, jamais dans le nom. */
  declare?: string | null
  note?: string | null
  texte?: string
}
interface CasCode1 {
  nom: string
  sortie_p1: Record<string, unknown>
  attendu_autotest: Record<string, unknown>
  attendu: { mesures: Record<string, unknown>; document_p2: unknown; alertes: string[] }
}
interface CasBlancs { nom: string; texte: string; attendu: string }
interface Paquet {
  module: {
    competence: string; version_calcul: string; version_golds_testee: string | null
    observables: string[]; params: string[]
    catalogue: Record<string, string[]>
    interdits: string[]; cohesion: string[]; niveaux: string[]; statuts: string[]
    regle_agregation_citee: string; regle_agregation_source: string
    types: Record<string, string>; tailles: Record<string, number>
  }
  autotest: { echecs: string[]; annonces: string[] }
  p2_parfait: unknown[]
  code1: CasCode1[]
  reels: CasPassage[]
  balayage_cohesion: CasPassage[]
  balayage_nature: CasPassage[]
  balayage_statut: CasPassage[]
  balayage_coherence: CasPassage[]
  balayage_paliers: CasPassage[]
  balayage_recette: CasPassage[]
  balayage_blancs: CasBlancs[]
  balayage_champs_blancs: CasPassage[]
  balayage_formes: CasPassage[]
  conformite_cas: CasPassage[]
}

/** Le contexte d'un vecteur : aucun exercice, aucune base, aucun appel. */
function ctxDe(): ContexteBranchement {
  return {
    modes: ['composer'],
    cran: null,
    referent: null,
    exceptionOrthographe: false,
    contexteExercice: { copie: '', sujet: '', consigne: '', mode: 'composer' },
    prives: {},
    sorties: {},
    // ⭐ La Structure ne déclare AUCUN paramètre — `parametres: {}` à la fiche,
    //    `PARAMS` vide au module. Le contexte le dit plutôt que de le taire.
    parametres: {},
  }
}

let paquet: Paquet | null = null
let motifDuSaut: string | null = null

if (!existsSync(RACINE_CONCEPTION)) {
  motifDuSaut = 'dépôt de conception absent'
} else {
  const r = spawnSync('python3',
    ['scripts/vecteurs-structure.py', '--racine', RACINE_CONCEPTION],
    { encoding: 'utf-8', maxBuffer: 512 * 1024 * 1024 })
  if (r.status !== 0) {
    motifDuSaut = null
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

/** Le passage entier du portage, sur les entrées d'un cas. */
function joue(cas: CasPassage): { c1: SortieCode1; c2: SortieCode2; conf: string[] } {
  const ctx = ctxDe()
  const c1 = BRANCHEMENT_STRUCTURE.code1({ p1: cas.releve }, ctx)
  const c2 = BRANCHEMENT_STRUCTURE.code2(cas.entree_p2, c1, ctx)
  const conf = BRANCHEMENT_STRUCTURE.conformite!({ p1: cas.releve }, cas.entree_p2, c1, c2, ctx)
  return { c1, c2, conf }
}

/** Rejoue un cas de bout en bout et compare LES TROIS CLÉS des deux temps. */
function rejoue(cas: CasPassage, ou: string) {
  const { c1, c2, conf } = joue(cas)
  assert.deepEqual(c1.mesures, cas.attendu!.code1.mesures, `${ou}/${cas.nom} — mesures de code1`)
  assert.deepEqual(c1.document_p2, cas.attendu!.code1.document_p2,
    `${ou}/${cas.nom} — document_p2`)
  assert.deepEqual(c1.alertes, cas.attendu!.code1.alertes, `${ou}/${cas.nom} — alertes de code1`)

  assert.deepEqual(c2.verdicts, cas.attendu!.code2.verdicts, `${ou}/${cas.nom} — verdicts`)
  // La trace se compare MOT POUR MOT : c'est elle qui rend lisible une erreur de
  // jugement, « depuis que le code calcule juste ».
  assert.deepEqual(c2.trace, cas.attendu!.code2.trace, `${ou}/${cas.nom} — trace`)
  assert.deepEqual(c2.alertes, cas.attendu!.code2.alertes, `${ou}/${cas.nom} — alertes de code2`)

  assert.deepEqual(conf, cas.attendu!.conformite, `${ou}/${cas.nom} — conformite`)
  return { c1, c2, conf }
}

/** Le relevé de télémétrie d'un cas — la moitié que le module ne calcule pas. */
function releveDe(cas: CasPassage) {
  const ctx = ctxDe()
  const { c2 } = joue(cas)
  return { c2, ...BRANCHEMENT_STRUCTURE.releve(c2, ctx) }
}

function parNom(cas: CasPassage[], nom: string): CasPassage {
  const c = cas.find((x) => x.nom === nom)
  assert.ok(c, `vecteur « ${nom} » absent du paquet`)
  return c
}

function tousLesPassages(p: Paquet): CasPassage[] {
  return [...p.reels, ...p.balayage_cohesion, ...p.balayage_nature, ...p.balayage_statut,
    ...p.balayage_coherence, ...p.balayage_paliers, ...p.balayage_recette,
    ...p.balayage_champs_blancs, ...p.balayage_formes, ...p.conformite_cas]
}

// ── Ce que le module dit de lui-même ────────────────────────────────────────

siPaquet("l'autotest du module est vert, et il n'a NI gold NI vecteur P2", (p) => {
  assert.deepEqual(p.autotest.echecs, [])
  assert.equal(p.module.competence, 'structure')
  // « Ton état : TESTS_P2_PARFAIT vide · TESTS_CODE1_PARFAIT 1 vecteur ·
  //   VERSION_GOLDS_TESTEE = None. » Si l'un des trois bouge, c'est que les golds
  //   du Run 1 sont arrivés — et les vecteurs gold avec eux.
  assert.equal(p.module.version_golds_testee, null)
  assert.deepEqual(p.module.observables, [...OBSERVABLES_MODULE])
  assert.deepEqual(p.module.params, [])
  // L'autotest ANNONCE son manque de couverture — il ne le tait pas.
  assert.ok(p.autotest.annonces.some((a) => a.startsWith('COUVERTURE — aucun vecteur gold')))
  assert.ok(p.autotest.annonces.some((a) => a.includes('52 réussis, 0 échoués')))
})

siPaquet('LE TYPE des constantes de vecteurs, et pas seulement leur taille', (p) => {
  // ⚠️ « Ne compte jamais une constante sans vérifier son TYPE » : chez
  //    l'Expression, `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu
  //    « 52 vecteurs » qui étaient 52 caractères. Ici ce sont deux vraies listes.
  assert.deepEqual(p.module.types, { TESTS_P2_PARFAIT: 'list', TESTS_CODE1_PARFAIT: 'list' })
  assert.deepEqual(p.module.tailles, { TESTS_P2_PARFAIT: 0, TESTS_CODE1_PARFAIT: 1 })
  assert.equal(p.p2_parfait.length, 0)
})

siPaquet('LES LISTES FERMÉES du module sont celles du bloc machine de la fiche', (p) => {
  // Le dérivé porte le volet `squelette` ; le module porte son `CATALOGUE`. Le
  // portage lit le second — s'ils divergeaient, le banc refuserait le run
  // (`verifie-module.py`), et ce test le dirait ici d'abord.
  for (const cle of Object.keys(CATALOGUE) as Array<keyof typeof CATALOGUE>) {
    assert.deepEqual(p.module.catalogue[cle], [...CATALOGUE[cle]], `catalogue/${cle}`)
  }
  assert.deepEqual(p.module.interdits,
    ['niveau', 'cohesion_locale', 'coherence_globale', 'profil_moyen', 'route_globale'])
  assert.deepEqual(p.module.cohesion,
    ['défaillance forte', 'défaillance', 'satisfaite', 'haut'])
  assert.deepEqual(p.module.statuts, ['absente', 'plaquée', 'motivée'])
  assert.equal(p.module.regle_agregation_source, 'competences/structure.md §4')
})

// ── LE CŒUR : les mêmes entrées des deux côtés, les trois clés ──────────────

siPaquet('LE VECTEUR `code1` — mesures, document_p2 et alertes IDENTIQUES', (p) => {
  assert.equal(p.code1.length, 1)
  for (const cas of p.code1) {
    const c1 = BRANCHEMENT_STRUCTURE.code1({ p1: cas.sortie_p1 }, ctxDe())
    assert.deepEqual(c1.mesures, cas.attendu.mesures, `${cas.nom} — mesures`)
    assert.deepEqual(c1.document_p2, cas.attendu.document_p2, `${cas.nom} — document_p2`)
    assert.deepEqual(c1.alertes, cas.attendu.alertes, `${cas.nom} — alertes`)
    // Et l'attendu de l'autotest lui-même, recopié : si le module change ses
    // comptes, les deux contrôles rougissent au même endroit.
    for (const [cle, attendu] of Object.entries(cas.attendu_autotest)) {
      assert.equal((c1.mesures as Record<string, unknown>)[cle], attendu,
        `${cas.nom} — ${cle} (attendu de l'autotest)`)
    }
  }
})

siPaquet('⭐⭐ LA CONTRE-ÉPREUVE — LES 112 COUPLES (P1, P2) RÉELS DU BANC', (p) => {
  // « Donne les mêmes `-p2.json` au module et à ton `code2` TypeScript, et
  //   compare les trois clés. Aucun appel de modèle, aucune dépense, et c'est une
  //   preuve que les vecteurs embarqués ne donnent pas. »
  assert.equal(p.reels.length, 112, 'le corpus de run a changé de taille')
  for (const cas of p.reels) {
    assert.ok(!cas.leve, `${cas.nom} — le module a levé : ${cas.leve}`)
    rejoue(cas, 'réel')
  }
  // Le corpus est bien MÊLÉ : deux générations de schéma, et deux générations de
  // prompt P2. Sans le mélange, il ne prouverait qu'une chaîne sur deux.
  const sousEnveloppe = p.reels.filter((c) => c.enveloppe_de_run).length
  assert.equal(sousEnveloppe, 47, 'les couples désenveloppés ont changé de compte')
  const manques = p.reels.filter((c) =>
    c.attendu!.code2.alertes.some((a) => a.startsWith('PASSAGE MANQUÉ'))).length
  assert.equal(manques, 65,
    '« le silence du juge ne vaut jamais acquiescement » — 65 P2 réels d\'avant la '
    + 'v1.4 ne rendent pas les deux booléens obligatoires, et AUCUN verdict ne sort')
})

siPaquet('BALAYAGE — les 400 distributions de charnières × tissu (A6, A7)', (p) => {
  assert.equal(p.balayage_cohesion.length, 400)
  for (const cas of p.balayage_cohesion) rejoue(cas, 'cohesion')
})

siPaquet('BALAYAGE — les 96 croisements de la cascade A10 (la NATURE d\'une couture)', (p) => {
  assert.equal(p.balayage_nature.length, 96)
  for (const cas of p.balayage_nature) rejoue(cas, 'nature')
})

siPaquet('BALAYAGE — les 210 statuts déclarés, « limite » et notes comprises', (p) => {
  assert.equal(p.balayage_statut.length, 210)
  for (const cas of p.balayage_statut) rejoue(cas, 'statut')
})

siPaquet('BALAYAGE — les 336 états du socle de la cohérence globale (A1)', (p) => {
  assert.equal(p.balayage_coherence.length, 336)
  for (const cas of p.balayage_coherence) rejoue(cas, 'coherence')
})

siPaquet('BALAYAGE — les 96 paliers : les SEIZE cellules, et le garde-fou Absent', (p) => {
  assert.equal(p.balayage_paliers.length, 96)
  for (const cas of p.balayage_paliers) rejoue(cas, 'paliers')
})

siPaquet('BALAYAGE — les 76 textes de la RECETTE : « P2 ne compte pas »', (p) => {
  assert.equal(p.balayage_recette.length, 76)
  for (const cas of p.balayage_recette) rejoue(cas, 'recette')
})

siPaquet('⭐⭐ BALAYAGE — `_n()` FAIT UN `strip()` DE PYTHON, pas un `trim()`', (p) => {
  // ⚠️⚠️ Python tient `\x1c`-`\x1f` et `\x85` pour des blancs, JavaScript non ;
  //    JavaScript tient la BOM pour un blanc, Python non. Or `_n()` normalise
  //    TOUTES les valeurs d'énumération du squelette. Un seul de ces caractères
  //    au bord d'une valeur, et elle est reconnue d'un côté et pas de l'autre.
  assert.equal(p.balayage_champs_blancs.length, 17)
  for (const cas of p.balayage_champs_blancs) rejoue(cas, 'champs')

  // ⭐ ET LA PREUVE QUE LE CONTRÔLE CONTRÔLE — cinq témoins, dans les DEUX sens.
  const verdict = (nom: string) => joue(parNom(p.balayage_champs_blancs, nom)).c2.verdicts
  const mesures = (nom: string) => joue(parNom(p.balayage_champs_blancs, nom))
    .c1.mesures as Record<string, number>

  // (a) PYTHON SEUL : un `\x1f` au bord d'un statut « motivée » est un blanc pour
  //     lui — la couture est motivée, la cohésion satisfaite, la copie est Bon.
  //     Un `trim()` y verrait une valeur hors catalogue et composerait.
  assert.equal(verdict('champ_statut-sep').niveau, 'Bon')
  // (b) PYTHON SEUL : un `\x85` au bord de « [aucune] » — la couture est VIDE.
  assert.equal(verdict('champ_texte-nel').cohesion_locale, 'défaillance forte')
  // (c) PYTHON SEUL : un `\x85` au bord de « question » — le problème EST posé.
  assert.equal(verdict('champ_forme-nel').route_globale, 'promesse')
  // (d) ⭐ JAVASCRIPT SEUL, ET DANS L'AUTRE SENS : la BOM n'est PAS un blanc pour
  //     Python — le problème n'est PAS posé, et un `trim()` dirait l'inverse.
  assert.equal(verdict('champ_forme-bom').route_globale, 'de fait')
  // (e) ⭐ LE PLUS CHER : « étape 1 » et « étape\x1f1 » sont LA MÊME étape pour
  //     Python — `\s+` les réduit toutes deux à une espace —, donc du TISSU. Un
  //     `\s` de JavaScript y verrait deux étapes, donc une CHARNIÈRE : la couture
  //     change de POPULATION, et avec elle `charniere_motivee` et `bloc_relie`.
  assert.equal(mesures('champ_annonce-meme-etape').n_charnieres, 0)
  assert.equal(mesures('champ_annonce-meme-etape').n_tissu, 1)
  assert.equal(mesures('champ_annonce-deux-etapes').n_charnieres, 1)
  // (f) Et le RÔLE : un « intro » entre deux `\x85` est un intro pour Python,
  //     donc un SEUIL — que le garde-fou de copie courte réintègre au tissu.
  assert.equal(mesures('champ_role-nel').n_charnieres, 0)
})

siPaquet('CONFORMITÉ — les huit formes que P2 peut prendre', (p) => {
  assert.equal(p.conformite_cas.length, 8)
  for (const cas of p.conformite_cas) rejoue(cas, 'conformite')
})

// ── `prepare_copie` : le découpage, et les blancs des deux langages ─────────

siPaquet('BALAYAGE — `prepare_copie` : les BLANCS DE PYTHON ne sont pas ceux de JS', (p) => {
  assert.equal(p.balayage_blancs.length, 23)
  for (const cas of p.balayage_blancs) {
    assert.equal(BRANCHEMENT_STRUCTURE.prepareCopie!(cas.texte, ctxDe()), cas.attendu,
      `blancs/${cas.nom}`)
  }
  // ⭐ ET LA PREUVE QUE LE CONTRÔLE CONTRÔLE. Trois caractères sont des blancs
  //    POUR PYTHON SEUL : une ligne qui n'en porte qu'un est une FRONTIÈRE DE
  //    BLOC pour lui, et pas pour un `\s` de JavaScript. Un portage naïf y verrait
  //    UN bloc là où le module en voit DEUX — donc une couture de moins.
  for (const nom of ['nel-entre', 'separateur-unite-entre', 'separateur-groupe-entre']) {
    const cas = p.balayage_blancs.find((c) => c.nom === `blancs_${nom}`)!
    assert.ok(cas.attendu.includes('[¶2]'), `${nom} — Python y voit DEUX blocs`)
  }
  // Et la BOM est un blanc pour JavaScript SEUL : Python la garde DANS le texte.
  const bom = p.balayage_blancs.find((c) => c.nom === 'blancs_bom-entre')!
  assert.ok(!bom.attendu.includes('[¶2]'), 'la BOM ne fait pas de frontière pour Python')
  assert.equal(BRANCHEMENT_STRUCTURE.prepareCopie!(bom.texte, ctxDe()), bom.attendu)
  // Le vecteur du RETOUR DUR, celui que l'autotest du module porte (RM4).
  const dur = p.balayage_blancs.find((c) => c.nom === 'blancs_retour-dur')!
  assert.equal(dur.attendu.match(/\[¶\d+\]/g)!.length, 2,
    'un retour DUR à l\'intérieur d\'un paragraphe ne crée PAS un bloc de plus')
})

siPaquet('`prepare_copie` et `normaliserRetours` ne se contredisent ni ne se doublent', () => {
  // ⭐ Le piège 32 du prompt, vérifié sur pièce. `normaliserRetours` ramène
  //    `\r\n?` à `\n` ET NE NETTOIE RIEN D'AUTRE ; il tourne à l'ÉCRITURE du
  //    dépôt. `prepare_copie` découpe et renumérote à la LECTURE. Le premier
  //    garantit au second que ses `\n` sont des `\n` — c'est exactement le défaut
  //    que C4-L4 a payé le 22/08 : « la Structure de toute copie validée depuis
  //    un navigateur aurait planché ».
  const crlf = 'Premier bloc.\r\n\r\nSecond bloc.'
  const attendu = '[¶1] Premier bloc.\n\n[¶2] Second bloc.'
  assert.equal(BRANCHEMENT_STRUCTURE.prepareCopie!(normaliserRetours(crlf), ctxDe()), attendu)
  // ⭐ ET SANS LA NORMALISATION, `prepare_copie` S'EN SORT QUAND MÊME : son
  //    `\n\s*\n+` avale le `\r`, qui est un blanc des deux côtés. C'est
  //    précisément ce qui rendait le défaut de C4-L4 INVISIBLE de ce côté-ci —
  //    ce n'est pas ce crochet qui planchait, c'est `blocs()`, qui coupe sur
  //    `\n[ \t]*\n+` et ne voyait AUCUNE ligne vide dans un `\r\n\r\n`.
  assert.equal(BRANCHEMENT_STRUCTURE.prepareCopie!(crlf, ctxDe()), attendu,
    'le crochet tient même sur du CRLF brut — le défaut n\'était pas ici')
  // Le correctif du 22/08 vit dans `blocs()`, qui NORMALISE avant de couper.
  assert.equal(blocs(crlf).length, 2, '`blocs()` normalise d\'abord (correctif du 22/08)')
  // ⚠️ LA SEULE NUANCE, RELEVÉE ET NON CORRIGÉE : `blocs()` coupe sur
  //    `\n[ \t]*\n+`, le module sur `\n\s*\n+`. Une ligne « vide » faite d'une
  //    espace insécable est UNE frontière pour le module et AUCUNE pour l'écran.
  const insecable = 'A.\n \nB.'
  assert.equal(blocs(insecable).length, 1, 'l\'écran compte UN bloc')
  assert.equal(BRANCHEMENT_STRUCTURE.prepareCopie!(insecable, ctxDe()).match(/\[¶\d+\]/g)!.length,
    2, 'la Structure en compte DEUX — l\'écart est relevé, pas arbitré')
})

// ── Ce que le portage DURCIT là où le module lèverait ───────────────────────

siPaquet('LE PORTAGE NE LÈVE JAMAIS — une forme illisible rend une ALERTE NOMMÉE', (p) => {
  // « Le module ne lève jamais d'exception : elle traverserait le banc et
  //   emporterait la trace avec elle » (`CONTRAT-MODULES.md` §3), et il prescrit
  //   l'inverse : « une valeur illisible rend une alerte, pas une valeur par
  //   défaut ». QUINZE des vingt-sept formes font lever le module ; ici elles
  //   rendent chacune une alerte nommée, et un verdict sort quand même.
  const levent = p.balayage_formes.filter((c) => c.leve)
  assert.equal(levent.length, 15, 'les formes qui font lever le module ont changé')
  const motifs: Record<string, string> = {
    'forme_gestes-nombre': 'GESTES_ILLISIBLES',
    'forme_jointures-chaine': 'JOINTURES_ILLISIBLES',
    'forme_jointures-nombre': 'JOINTURES_ILLISIBLES',
    'forme_jointure-chaine': 'JOINTURES_ILLISIBLES',
    'forme_blocs-chaine': 'BLOCS_ILLISIBLES',
    'forme_bloc-chaine': 'BLOCS_ILLISIBLES',
    'forme_promesse-chaine': 'PROMESSE_ILLISIBLE',
    'forme_parties-nombre': 'PARTIES_ILLISIBLES',
    'forme_partie-chaine': 'PARTIES_ILLISIBLES',
    'forme_etapes-nombre': 'ETAPES_ILLISIBLES',
    'forme_crible-chaine': 'CRIBLE_ILLISIBLE',
    'forme_retrogradations-chaine': 'CRIBLE_ILLISIBLE',
    'forme_retrogradations-nombre': 'CRIBLE_ILLISIBLE',
    'forme_retrogradation-chaine': 'CRIBLE_ILLISIBLE',
    'forme_distincts-nombre': 'OBJETS_DISTINCTS_ILLISIBLES',
  }
  for (const cas of levent) {
    const { c1, c2, conf } = joue(cas)   // ⬅️ ne doit PAS lever
    const toutes = [...c1.alertes, ...c2.alertes, ...conf]
    const motif = motifs[cas.nom]
    assert.ok(motif, `${cas.nom} — aucun motif attendu déclaré`)
    assert.ok(toutes.some((a) => a.startsWith(motif) || a.includes(motif)),
      `${cas.nom} — aucune alerte ne dit « ${motif} » : ${JSON.stringify(toutes)}`)
    // Un verdict sort quand même — ou un PASSAGE MANQUÉ nommé, jamais un vide.
    assert.ok(typeof c2.verdicts.niveau === 'string'
      || c2.alertes.some((a) => a.startsWith('PASSAGE MANQUÉ')
        || a.startsWith('CODE2_SANS_ENTREE')), cas.nom)
  }
  // ⭐ ET LES DOUZE AUTRES, OÙ LE MODULE NE LÈVE PAS, SE COMPARENT NORMALEMENT.
  //    Parmi elles, celle qui n'est PAS un durcissement mais la sémantique de
  //    Python : `gestes: "manque"` est une CHAÎNE, donc six caractères, donc
  //    AUCUN geste « manque ». Un portage qui la lirait comme un geste unique
  //    inventerait une motivation — et ferait monter la copie d'un cran.
  for (const cas of p.balayage_formes.filter((c) => !c.leve)) rejoue(cas, 'formes')
  const chaine = parNom(p.balayage_formes, 'forme_gestes-chaine')
  assert.equal((chaine.attendu!.code1.mesures.statuts_par_couture as Record<string, string>)
    ['¶1 → ¶2'], 'plaquée',
  '« manque » en CHAÎNE ne porte aucun geste : Python itère ses caractères')
})

// ════════════════════════════════════════════════════════════════════════════
// L'ÉPREUVE NÉGATIVE — ET ELLE COMMENCE PAR LA TÉLÉMÉTRIE
// ----------------------------------------------------------------------------
// « Deux mutations sur quatorze ont survécu au premier passage, et LES DEUX
//   ÉTAIENT DANS LA TÉLÉMÉTRIE. Le motif est le même dans les deux cas : le
//   vecteur de test était SYMÉTRIQUE. La parade tient en deux gestes — des
//   comptes ASYMÉTRIQUES, et au moins une unité ÉCARTÉE du décompte qui porte
//   quand même la propriété mesurée. »        — boîte aux lettres de C4-L10, 11
// ════════════════════════════════════════════════════════════════════════════

/**
 * LE SQUELETTE ASYMÉTRIQUE — il est construit pour qu'AUCUNE paire d'observables
 * ne puisse s'échanger sans que le contrôle tombe.
 *
 *   · les quatre populations ont des tailles DIFFÉRENTES : 3 charnières,
 *     4 tissus, 2 seuils, 5 blocs de développement ;
 *   · les quatre numérateurs sont DIFFÉRENTS : 2 coutures non vides sur 7,
 *     1 charnière motivée sur 3, 1 rétrogradée, 3 relations nommées sur 4,
 *     2 idées directrices sur 5 ;
 *   · DES ÉLÉMENTS SONT ÉCARTÉS ET PORTENT QUAND MÊME LA PROPRIÉTÉ : les deux
 *     SEUILS sont non vides et portent une relation nommée — ils ne doivent
 *     compter ni dans `jointure_presente` ni dans `bloc_relie` —, et les deux
 *     blocs de SERVICE portent une idée directrice — ils ne doivent compter ni
 *     dans `bloc_unite` ni dans `derive`.
 */
function squeletteAsymetrique() {
  const b = (num: string, role: string, idee: string, corr = 'sans objet') =>
    ({ num, role, objet: `objet ${num}`, idee_directrice_citee: idee,
      position_idee: 'première phrase', correspondance_annonce: corr })
  const j = (entre: string, texte: string, gestes: string[], rel: string) =>
    ({ entre, fin_bloc_precedent: 'fin.', debut_bloc_suivant: 'début.',
      texte_cite: texte, gestes, relation_nommee: rel })
  return {
    promesse: { probleme_pose: 'Une question ?', probleme_forme: 'question',
      annonce_de_plan: 'D\'abord…, ensuite…',
      etapes_annoncees: ['étape 1', 'étape 2'] },
    blocs: [
      // ⭐ Les DEUX blocs de service PORTENT une idée directrice : ils ne doivent
      //    entrer ni dans `bloc_unite` ni dans le dénominateur de `derive`.
      // ⭐ ET CE BLOC DE SERVICE EST DÉCLARÉ « HORS ANNONCE » — ce que le prompt
      //    P1 interdit, et qu'un modèle peut écrire. Il porte donc la propriété
      //    que `derive` mesure, et il est hors de sa population : c'est le seul
      //    témoin qui sépare « les blocs de développement » de « tous les blocs ».
      b('¶1', 'intro', 'une idée de service', 'hors annonce'),
      b('¶2', 'developpement', 'l\'idée de ¶2', 'étape 1'),
      b('¶3', 'developpement', '[absente]', 'étape 2'),
      b('¶4', 'developpement', 'l\'idée de ¶4', 'hors annonce'),
      b('¶5', 'developpement', '[absente]', 'hors annonce'),
      b('¶6', 'developpement', '[absente]', 'sans objet'),
      b('¶7', 'conclusion', 'une idée de service'),
    ],
    // Trois parties marquées, et ¶5 ni ¶6 n'en sont : c'est ce qui sépare les
    // charnières du tissu (cascade A10, branches 2 et 4).
    parties: [{ marquee_par: 'I.', blocs: ['¶2'] }, { marquee_par: 'II.', blocs: ['¶3'] },
      { marquee_par: 'III.', blocs: ['¶4'] }],
    jointures: [
      // ⭐ LES DEUX SEUILS SONT NON VIDES ET NOMMENT LEUR RELATION — écartés du
      //    périmètre, ils portent pourtant les deux propriétés mesurées. Les
      //    compter ferait 8/9 à `jointure_presente` et 5/6 à `bloc_relie`.
      j('¶1 → ¶2', 'Ensuite,', ['relance'], 'oui — annonce'),
      j('¶6 → ¶7', 'Enfin,', ['relance'], 'oui — conclut'),
      // TROIS charnières : une motivée, une motivée QUI SERA RÉTROGRADÉE, une vide.
      j('¶2 → ¶3', 'Mais cela ne suffit pas.', ['manque — \'cela ne suffit pas\''], 'non — rien'),
      j('¶3 → ¶4', 'Or il reste à voir la suite.', ['manque — \'reste à voir\''], 'non — rien'),
      j('¶2 → ¶4', '[aucune]', [], 'non — rien'),
      // QUATRE coutures de tissu : trois relations nommées, une non.
      j('¶4 → ¶5', 'Ensuite,', ['relance'], 'oui — confirme'),
      j('¶5 → ¶6', 'Ensuite,', ['relance'], 'oui — ajoute'),
      j('¶4 → ¶6', 'Ensuite,', ['relance'], 'oui — précise'),
      j('¶5 → ¶4', 'Ensuite,', ['relance'], 'non — connecteur nu'),
      // ⭐ ET UNE CINQUIÈME, DONT LA RELATION EST ILLISIBLE — ni « oui… » ni
      //    « non… ». Elle est DANS le tissu et hors des deux comptes `oui`/`non` :
      //    c'est elle qui sépare « proportion DU TISSU » (ce que la fiche écrit)
      //    de « proportion des relations lisibles » (ce que le §4 module).
      j('¶4 → ¶4', 'Ensuite,', ['relance'], 'aucune'),
    ],
  }
}

const P2_ASYMETRIQUE = {
  crible: { retrogradations: [{ entre: '¶3 → ¶4', raison: 'annonce déguisée' }] },
  gabarit_repete: true,
  blocs_objets_distincts: ['¶2', '¶4'],
  doublon: true,
  retour_en_arriere: false,
  ordre_necessaire: false,
  etapes_realisees_dans_lordre: false,
  justification_ancree: 'les coutures ¶2 → ¶3 tiennent',
  ce_qui_plafonne: 'la promesse',
  levier: 'nomme le manque',
  confiance: 'moyenne',
}

siPaquet('⭐⭐ ÉPREUVE NÉGATIVE / TÉLÉMÉTRIE — les QUATRE populations, et aucune échangeable',
  () => {
    const cas: CasPassage = { nom: 'asymetrique', releve: squeletteAsymetrique(),
      entree_p2: P2_ASYMETRIQUE, params: {} }
    const { c2, releve, alertes } = releveDe(cas)

    // Le partage du périmètre, d'abord — il commande tout le reste.
    assert.equal(c2.trace.length > 0, true)
    const m = BRANCHEMENT_STRUCTURE.code1({ p1: cas.releve }, ctxDe()).mesures as Record<string, number>
    assert.equal(m.n_charnieres, 3, 'trois charnières')
    assert.equal(m.n_tissu, 5, 'cinq coutures de tissu, dont UNE à relation illisible')
    assert.equal(m.n_seuils, 2, 'deux seuils, écartés du périmètre')
    assert.equal(m.tissu_oui, 3)
    assert.equal(m.tissu_non, 1)
    assert.equal(m.n_tissu - m.tissu_oui - m.tissu_non, 1,
      'une relation ILLISIBLE : ni « oui » ni « non », et pourtant du tissu')

    // ── LES DEUX DÉNOMINATEURS, sous leur nom EXACT ────────────────────────
    assert.equal(releve[DENOM_CHARNIERES], 3, '« les charnières du squelette »')
    assert.equal(releve[DENOM_DEV], 5, '« les blocs de développement » — les 2 services sortent')

    // ── 1. `jointure_presente` : « HORS SEUILS ». 8 coutures au périmètre, dont
    //       une vide → 7/8. Les DEUX seuils sont non vides : les compter ferait
    //       9/10, et rien d'autre ne le ferait tomber.
    assert.equal(releve.jointure_presente, 7 / 8,
      'la population est « les coutures HORS SEUILS » — les deux seuils sont non vides')

    // ── 2. `charniere_motivee` : APRÈS CRIBLE. 3 charnières, 2 motivées avant
    //       crible, 1 rétrogradée → 1/3. Avant crible ce serait 2/3.
    assert.equal(releve.charniere_motivee, 1 / 3, '« après crible » — jamais avant')

    // ── 3. `charniere_formule` : LE COMPTE, jamais la proportion (la chaîne
    //       divise). Une seule rétrogradation appariée.
    assert.equal(releve.charniere_formule, 1, 'un comptage rapporté rend LE COMPTE')

    // ── 4. `bloc_relie` : « proportion DU TISSU dont la relation est nommée ».
    //       3 relations nommées sur 5 coutures de tissu → 3/5.
    //       ⚠️⚠️ ET C'EST ICI QUE LA LECTURE SE FIXE. La cinquième couture porte
    //       une relation ILLISIBLE : la fiche écrit « du tissu », donc elle est au
    //       dénominateur (3/5) ; le §4 point 4, qui module sur `oui > non`, la
    //       laisse dehors (3/4). Les deux lectures ne divergent QUE sur ce cas, et
    //       il n'y en a aucun dans les vecteurs du module. *La fiche fait foi ; la
    //       divergence avec la règle de modulation est RELEVÉE, jamais arbitrée
    //       ici — une session Code ne corrige pas une source.*
    assert.equal(releve.bloc_relie, 3 / 5,
      'la population est LE TISSU ENTIER — la relation illisible y compte')

    // ── 5. `promesse_presente` : un problème posé (forme faisant foi) ET/OU un
    //       plan annoncé.
    assert.equal(releve.promesse_presente, 'oui')

    // ── 6. `plan_tenu` : une annonce à étapes existe, et P2 dit `false`.
    assert.equal(releve.plan_tenu, 'non')

    // ── 7. `bloc_unite` : 2 idées directrices sur 5 blocs de DÉVELOPPEMENT. Les
    //       deux blocs de SERVICE en portent une : les compter ferait 4/7.
    assert.equal(releve.bloc_unite, 2 / 5,
      'les blocs de SERVICE portent une idée et ne comptent pas')

    // ── 8. `derive` : 2 blocs de DÉVELOPPEMENT « hors annonce » + 1 doublon + 0
    //       retour = 3. ⭐ Le bloc `intro` en porte un TROISIÈME, et il ne compte
    //       pas : « les blocs de service portent la promesse, mais ils ne sont
    //       JAMAIS retenus contre le plan ». Le compter ferait 4, et c'est le seul
    //       témoin qui sépare les deux populations.
    assert.equal(releve.derive, 3, '2 hors annonce au développement + doublon + retour')

    // Et AUCUN observable ne se contredit : valeur OU alerte, jamais les deux.
    for (const code of OBSERVABLES_TELEMETRIE) {
      assert.ok(code in releve, `${code} — sans valeur sur un squelette complet`)
      assert.ok(!alertes.some((a) => a.startsWith(`${code} :`)), `${code} — valeur ET alerte`)
    }
  })

siPaquet('⭐ ÉPREUVE NÉGATIVE / TÉLÉMÉTRIE — chaque population VIDE se DIT, jamais 0', () => {
  // « Un observable de télémétrie sans occasion rend `n/a`, JAMAIS `null`,
  //   JAMAIS 0 » (`CONTRAT-MODULES.md` §3). Et ici, l'absence est DÉCLARÉE : le
  //   relevé n'en porte pas d'entrée, et une alerte NOMMÉE dit pourquoi.
  const vide = {
    promesse: { probleme_pose: '[absent]', probleme_forme: '[absent]',
      annonce_de_plan: '[absente]', etapes_annoncees: [] },
    blocs: [], parties: [], jointures: [],
  }
  const p2 = { crible: { retrogradations: [] }, gabarit_repete: true,
    blocs_objets_distincts: [], doublon: false, retour_en_arriere: false,
    ordre_necessaire: false, etapes_realisees_dans_lordre: null,
    justification_ancree: '', ce_qui_plafonne: '', levier: '', confiance: 'faible' }
  const { releve, alertes } = releveDe({ nom: 'vide', releve: vide, entree_p2: p2, params: {} })
  for (const code of ['jointure_presente', 'charniere_motivee', 'bloc_relie', 'bloc_unite']) {
    assert.equal(code in releve, false, `${code} — une proportion sans population ne vaut pas 0`)
    assert.ok(alertes.some((a) => a.startsWith(`${code} :`) && a.includes('jamais 0')),
      `${code} — l'absence doit être NOMMÉE`)
  }
  // Les deux dénominateurs sortent à 0 : c'est `observables.ts` qui rendra `n/a`
  // sur un dénominateur nul (`01-` §8.2), « appliqué là où la règle vit ».
  assert.equal(releve[DENOM_CHARNIERES], 0)
  assert.equal(releve[DENOM_DEV], 0)
  // Et les trois qui ONT une valeur même sur une copie vide.
  assert.equal(releve.promesse_presente, 'non')
  assert.equal(releve.plan_tenu, 'n/a', '`n/a` sans annonce — et `n/a` n\'est pas 0')
  assert.equal(releve.derive, 0)
})

siPaquet('⭐ ÉPREUVE NÉGATIVE / TÉLÉMÉTRIE — un PASSAGE MANQUÉ ne fait pas taire les sept', () => {
  // Sans `doublon` ni `retour_en_arriere`, aucun verdict ne sort — c'est la
  // règle. Mais SEPT des huit observables du §5 n'en dépendent pas : les perdre
  // serait perdre sept signaux d'escalade sur une copie que la chaîne a lue.
  const cas: CasPassage = { nom: 'manque', releve: squeletteAsymetrique(),
    entree_p2: { crible: { retrogradations: [{ entre: '¶3 → ¶4', raison: 'x' }] },
      gabarit_repete: true, blocs_objets_distincts: ['¶2', '¶4'],
      etapes_realisees_dans_lordre: false },
    params: {} }
  const { c2, releve, alertes } = releveDe(cas)
  assert.equal(c2.verdicts.niveau, null, 'aucun verdict sur une sortie tronquée')
  assert.ok(c2.alertes[0].startsWith('PASSAGE MANQUÉ'))
  for (const code of ['jointure_presente', 'charniere_motivee', 'charniere_formule',
    'bloc_relie', 'promesse_presente', 'plan_tenu', 'bloc_unite']) {
    assert.ok(code in releve, `${code} — muet alors qu'il est calculable`)
  }
  assert.equal(releve.charniere_motivee, 1 / 3, 'le crible s\'applique quand même')
  // Le SEUL qui dépend des deux jugements manquants le DIT.
  assert.equal('derive' in releve, false)
  assert.ok(alertes.some((a) => a.startsWith('derive :') && a.includes('jamais 0')))
})

siPaquet('LES HUIT OBSERVABLES DU §5 ont TOUS une valeur, ou une alerte NOMMÉE', (p) => {
  // La parade du « fait quand », appliquée à TOUT le corpus : 1 317 passages.
  for (const cas of tousLesPassages(p)) {
    const { releve, alertes } = releveDe(cas)
    for (const code of OBSERVABLES_TELEMETRIE) {
      const aUneValeur = code in releve
      const aUneAlerte = alertes.some((a) => a.startsWith(`${code} :`))
      assert.ok(aUneValeur || aUneAlerte,
        `${cas.nom} — « ${code} » n'a NI valeur NI alerte nommée : il sortirait en \`n/a\`, `
        + 'donc du dénominateur du taux, et l\'escalade serait aveugle sur lui SANS UN SYMPTÔME')
      assert.ok(!(aUneValeur && aUneAlerte),
        `${cas.nom} — « ${code} » a une valeur ET une alerte : le relevé se contredit`)
    }
  }
})

// ── L'ÉPREUVE NÉGATIVE DU CALCUL : ce que la FICHE écrit ────────────────────

siPaquet('FICHE §4-4 — LA MAJORITÉ EST STRICTE, et l\'égalité tombe sur la BORNE BASSE', (p) => {
  // « toutes `absente` → défaillance forte ; majorité `absente`/`plaquée` →
  //   défaillance ; majorité `motivée` → satisfaite […] ; ÉGALITÉ → BORNE BASSE. »
  // Le balayage porte les 40 distributions de 0 à 3 charnières ; on les relit
  // ici CONTRE LA RÈGLE, et non contre le module.
  let egalites = 0
  for (const cas of p.balayage_cohesion) {
    const combo = cas.nom.split('_')[1].split('-').filter((x) => x !== 'aucune')
    if (!combo.length) continue
    const [, , tissuNom] = cas.nom.split('_')
    if (tissuNom !== 't0-0') continue          // le tissu vide : aucune modulation
    const n = combo.length
    const bas = combo.filter((s) => s === 'absente' || s === 'plaquée').length
    const mot = combo.filter((s) => s === 'motivée').length
    const gabarit = cas.nom.endsWith('_gTrue')
    let attendu: string
    if (combo.every((s) => s === 'absente')) attendu = 'défaillance forte'
    else if (bas > n / 2) attendu = 'défaillance'
    else if (mot > n / 2) {
      attendu = (mot === n && n >= 2 && !gabarit) ? 'haut' : 'satisfaite'
    } else { attendu = 'défaillance'; egalites += 1 }
    const { c2 } = joue(cas)
    assert.equal(c2.verdicts.cohesion_locale, attendu, `${cas.nom} — cohésion locale`)
  }
  assert.ok(egalites >= 4, `le balayage ne porte que ${egalites} égalités de charnières`)
})

siPaquet('FICHE §4-4 — LA MODULATION EST D\'UN CRAN AU MAXIMUM, ET SATURANTE (A7, RF13)', (p) => {
  // « Un modulateur ne change pas le signe, et `satisfaite` EST la frontière du
  //   signe : un `haut` redescend à `satisfaite`, JAMAIS PLUS BAS. » C'est
  //   exactement la mutation qui, écrite `>=`, laissait deux charnières motivées
  //   décrocher Acquis avec un tissu entièrement muet.
  const COH = ['défaillance forte', 'défaillance', 'satisfaite', 'haut']
  let module1 = 0
  let hautRedescendu = 0
  let satisfaiteTenue = 0
  for (const cas of p.balayage_cohesion) {
    const [, combo, tissuNom] = cas.nom.split('_')
    // ⚠️ LA MODULATION NE S'APPLIQUE QU'AUX COPIES QUI ONT DES CHARNIÈRES. Sans
    //    aucune, ce n'est pas une modulation mais LE § 2c — « jugement sur le
    //    tissu seul », une règle entière et non un cran. Les mêler ferait croire
    //    que le tissu déplace de deux crans, alors qu'il ne module rien du tout.
    if (combo === 'aucune' || tissuNom === 't0-0') continue
    const sansTissu = p.balayage_cohesion.find((c) =>
      c.nom === cas.nom.replace(`_${tissuNom}_`, '_t0-0_'))
    assert.ok(sansTissu, `${cas.nom} — pas de témoin sans tissu`)
    const base = COH.indexOf(joue(sansTissu!).c2.verdicts.cohesion_locale as string)
    const apres = COH.indexOf(joue(cas).c2.verdicts.cohesion_locale as string)
    assert.ok(Math.abs(apres - base) <= 1,
      `${cas.nom} — la modulation a bougé de ${apres - base} crans, jamais plus d'un`)
    if (apres !== base) module1 += 1
    // ⭐ ET LE SIGNE NE CHANGE PAS : « un modulateur ne change pas le signe, et
    //    `satisfaite` EST la frontière du signe ».
    if (base === 2) {
      assert.equal(apres, 2, `${cas.nom} — le tissu a fait bouger une cohésion satisfaite`)
      satisfaiteTenue += 1
    }
    if (base === 3) {
      assert.ok(apres >= 2, `${cas.nom} — un « haut » est descendu sous « satisfaite »`)
      if (apres === 2) hautRedescendu += 1
    }
  }
  // Sans ces trois-là, le contrôle ne contrôlerait rien : c'est exactement la
  // mutation qui, écrite `>=`, laissait deux charnières motivées décrocher
  // Acquis avec un tissu entièrement muet (RF13).
  assert.ok(module1 > 0, 'le tissu n\'a jamais modulé')
  assert.ok(satisfaiteTenue > 0, '« satisfaite » n\'a jamais été mise à l\'épreuve')
  assert.ok(hautRedescendu > 0, 'aucun « haut » n\'a été fait redescendre — RF13 n\'est pas éprouvé')
})

siPaquet('FICHE §4-2 — SANS ANNONCE NI PARTIE MARQUÉE, AUCUNE COUTURE N\'EST UNE CHARNIÈRE', (p) => {
  // « Conséquence VOULUE » de la cascade A10 — et c'est le cœur du régime
  //   ordinaire du corpus : « six copies sur neuf sans charnière ».
  for (const cas of p.balayage_nature) {
    const [, , parties, etapes] = cas.nom.split('_')
    const memeEtape = etapes === 'eétape1-étape1'
    const sansDeclaration = parties === 'p0' && (etapes === 'eaucune' || memeEtape)
    if (!sansDeclaration) continue
    const m = joue(cas).c1.mesures as Record<string, number>
    assert.equal(m.n_charnieres, 0, `${cas.nom} — une charnière est née sans déclaration`)
  }
  // Et la première branche de la cascade l'emporte : un `intro` à gauche ou une
  // `conclusion` à droite fait un SEUIL, même entre deux parties marquées.
  for (const cas of p.balayage_nature) {
    const [, roles] = cas.nom.split('_')
    const [rg, rd] = roles.split('-')
    if (rg !== 'intro' && rd !== 'conclusion') continue
    const m = joue(cas).c1.mesures as Record<string, number>
    assert.equal(m.n_charnieres, 0, `${cas.nom} — le seuil doit l'emporter sur la charnière`)
  }
})

siPaquet('FICHE §4-8 — « RIEN NE SE RÉPARE EN SILENCE », et le doute ne fabrique rien', (p) => {
  // Deux règles distinctes, et il ne faut pas les confondre — c'est le piège que
  // ce test a d'abord manqué :
  //
  //   (a) UN STATUT DÉCLARÉ DU CATALOGUE EST PRIS TEL QUEL, même quand il
  //       contredit le texte cité. « Un squelette qui se contredit (statut contre
  //       texte, geste contre statut) est ALERTÉ, JAMAIS CORRIGÉ. » Une couture
  //       déclarée « absente » avec un texte cité reste « absente », et
  //       SQUELETTE_INCOHERENT le dit — c'est le §4, point 8.
  //   (b) LE DOUTE, LUI, NE FABRIQUE RIEN : une « limite » sans deux bornes
  //       lisibles, ou une valeur HORS CATALOGUE, retombe sur LA COMPOSITION —
  //       jamais sur « absente », qui est la lecture la plus dure de l'échelle.
  //       « Une couture où quelque chose EST écrit ne peut pas être absente :
  //       absente veut dire qu'il n'y a rien, et c'est un FAIT, pas un verdict. »
  //
  // ⚠️ Les indices viennent des CHAMPS du paquet, jamais d'un découpage du nom :
  //    un statut déclaré « n'importe quoi » porte lui-même un « _n ».
  const VIDE = '[aucune]'
  let contradictions = 0
  let repliees = 0
  let bornesBasses = 0
  for (const cas of p.balayage_statut) {
    const declare = cas.declare ?? null
    const note = cas.note ?? null
    const texte = cas.texte!
    const { c1 } = joue(cas)
    const statut = (c1.mesures as Record<string, Record<string, string>>)
      .statuts_par_couture['¶1 → ¶2']
    // La COMPOSITION : le fait, et rien que le fait (§4, point 1).
    const composition = texte === VIDE ? 'absente'
      : (texte.startsWith('Or') ? 'motivée' : 'plaquée')
    const catalogue = ['absente', 'plaquée', 'motivée']
    const norme = (declare ?? '').trim().toLowerCase()
      .replace('plaquee', 'plaquée').replace('motivee', 'motivée')

    // (a) Un statut du catalogue est PRIS TEL QUEL — et la contradiction s'alerte.
    const declareCatalogue = catalogue.find((x) => norme.startsWith(x.slice(0, 6)))
    if (declareCatalogue) {
      assert.equal(statut, declareCatalogue,
        `${cas.nom} — un statut du catalogue est pris tel quel`)
      if (declareCatalogue === 'absente' && texte !== VIDE) {
        assert.ok(c1.alertes.some((a) => a.startsWith('SQUELETTE_INCOHERENT')
          && a.includes('absente')),
        `${cas.nom} — la contradiction statut/texte doit être ALERTÉE, jamais corrigée`)
        contradictions += 1
      }
      continue
    }

    // (b) Le doute compose — ou lit la BORNE BASSE quand la note en donne deux.
    const estLimite = norme.startsWith('limit')
    const bornes = catalogue.filter((x) => (note ?? '').toLowerCase()
      .replace('plaquee', 'plaquée').replace('motivee', 'motivée').includes(x.slice(0, 6)))
    const attendu = (estLimite && bornes.length) ? bornes[0] : composition
    assert.equal(statut, attendu, `${cas.nom} — le doute ne fabrique pas un statut`)
    if (estLimite && bornes.length) bornesBasses += 1
    else repliees += 1
    // ⛔ Et jamais « absente » par défaut quand un texte EST cité.
    if (texte !== VIDE && !bornes.includes('absente')) {
      assert.notEqual(statut, 'absente', `${cas.nom} — « absente » est un FAIT, pas un repli`)
    }
  }
  assert.ok(contradictions > 0, 'aucune contradiction statut/texte n\'a été éprouvée')
  assert.ok(repliees > 0, 'aucune composition de repli n\'a été éprouvée')
  assert.ok(bornesBasses > 0, 'aucune borne basse de « limite » n\'a été éprouvée')
  // ⭐ LE TÉMOIN QU'UN `\b` INVENTERAIT : « entre inabsentement et motivée » porte
  //    « absent » EN SOUS-CHAÎNE, et le module cherche bien une sous-chaîne — pas
  //    un mot isolé. Un portage qui aurait recopié le `\b` de l'Argumentation y
  //    aurait vu UNE seule borne, donc un repli au lieu d'une borne basse.
  const piege = p.balayage_statut.find((c) => c.declare === 'limite'
    && c.note === 'entre inabsentement et motivée' && c.texte === 'Ensuite,')!
  const st = (joue(piege).c1.mesures as Record<string, Record<string, string>>)
    .statuts_par_couture['¶1 → ¶2']
  assert.equal(st, 'absente',
    'les bornes se cherchent en SOUS-CHAÎNE : « inabsentement » en porte une')
})

siPaquet('FICHE §4-7 — LE GARDE-FOU ABSENT SE LIT EN LECTURE STRICTE', (p) => {
  // « Une QUESTION posée — le champ `probleme_forme`, en lecture stricte, pas un
  //   point d'interrogation trouvé n'importe où — ou une seule idée directrice
  //   énoncée exclut Absent. » ⚠️ Une TENSION AFFIRMÉE n'est pas une question :
  //   elle ne déclenche PAS le garde-fou, et c'est ce qui distingue les deux.
  let absents = 0
  let rabattus = 0
  for (const cas of p.balayage_paliers) {
    const { c2 } = joue(cas)
    const niveau = c2.verdicts.niveau
    const gardeFou = c2.alertes.some((a) => a.startsWith('GARDE_FOU_ABSENT'))
    if (niveau === 'Absent') absents += 1
    if (gardeFou) {
      rabattus += 1
      assert.equal(niveau, 'Faible', `${cas.nom} — le garde-fou rabat sur Faible`)
    }
  }
  assert.ok(absents > 0, 'aucun Absent atteint : le garde-fou ne prouve rien')
  assert.ok(rabattus > 0, 'le garde-fou n\'a jamais mordu : le contrôle ne contrôle rien')
  // ⭐⭐ LE TÉMOIN, ET IL A FALLU LE CHERCHER. Toute forme DU CATALOGUE rend
  //    `a_probleme` vrai, ce qui empêche la cohérence de tomber en défaillance
  //    FORTE, donc empêche Absent, donc n'interroge JAMAIS le garde-fou : la
  //    lecture stricte y est inéprouvable. Ce sont les formes HORS CATALOGUE qui
  //    la mettent à l'épreuve — celles qu'un modèle écrit vraiment.
  //
  //      « question posée » → `a_probleme` FAUX, mais `startswith("question")`
  //                          VRAI : le garde-fou ouvre, la copie est rabattue ;
  //      « tension »        → `a_probleme` FAUX et `startswith("question")` FAUX :
  //                          le garde-fou reste fermé, la copie est Absent.
  //
  //    Une lecture LARGE (« une forme quelconque suffit ») rabattrait les deux, et
  //    rien d'autre dans tout le corpus ne le ferait tomber.
  const strict = p.balayage_paliers.filter((c) => c.nom.includes('gf-question-posée-0'))
  const large = p.balayage_paliers.filter((c) => c.nom.includes('gf-tension-0'))
  assert.ok(strict.length > 0 && large.length > 0, 'les deux témoins doivent exister')
  let ouvert = 0
  let ferme = 0
  for (const cas of strict) {
    const { c2 } = joue(cas)
    if (c2.alertes.some((a) => a.startsWith('GARDE_FOU_ABSENT'))) ouvert += 1
  }
  for (const cas of large) {
    const { c2 } = joue(cas)
    if (c2.verdicts.niveau === 'Absent') ferme += 1
  }
  assert.ok(ouvert > 0,
    '« question posée » doit OUVRIR le garde-fou — la lecture est `startswith`')
  assert.ok(ferme > 0,
    '« tension » doit le laisser FERMÉ — une tension n\'est pas une question')
})

siPaquet('FICHE §4-6 — LE CROISEMENT, RELU CONTRE SA RÈGLE SUR LES SEIZE CELLULES', (p) => {
  // « Une seule dimension en défaut → Moyen ; deux en défaut → Faible, et Absent
  //   si les deux sont au plus bas ; les deux satisfaites ou mieux → Bon ; les
  //   deux à haut niveau → Acquis. » Relu ici CONTRE LA RÈGLE, cellule par
  //   cellule, sur tout le corpus — et les seize doivent être atteintes.
  const COH = ['défaillance forte', 'défaillance', 'satisfaite', 'haut']
  const vues = new Set<string>()
  for (const cas of tousLesPassages(p)) {
    const { c2 } = joue(cas)
    const cl = c2.verdicts.cohesion_locale as string
    const cg = c2.verdicts.coherence_globale as string
    if (cl === null || cg === null || !COH.includes(cl) || !COH.includes(cg)) continue
    vues.add(`${cl}×${cg}`)
    const a = COH.indexOf(cl)
    const b = COH.indexOf(cg)
    const enDefaut = (x: number) => x <= 1
    let attendu: string
    if (enDefaut(a) && enDefaut(b)) attendu = (a === 0 && b === 0) ? 'Absent' : 'Faible'
    else if (enDefaut(a) || enDefaut(b)) attendu = 'Moyen'
    else attendu = (a === 3 && b === 3) ? 'Acquis' : 'Bon'
    // Le garde-fou est la SEULE exception, et il se dit.
    if (attendu === 'Absent'
      && c2.alertes.some((x) => x.startsWith('GARDE_FOU_ABSENT'))) attendu = 'Faible'
    assert.equal(c2.verdicts.niveau, attendu, `${cas.nom} — croisement ${cl} × ${cg}`)
    // Et `profil_moyen` : « n/a » hors Moyen, le profil nommé dedans.
    assert.equal(c2.verdicts.profil_moyen,
      attendu !== 'Moyen' ? 'n/a' : (a < b ? 'global-ok-local-ko' : 'local-ok-global-ko'),
      `${cas.nom} — profil_moyen`)
  }
  assert.equal(vues.size, 16, `seules ${vues.size} des 16 cellules sont atteintes : ${
    [...vues].sort().join(' · ')}`)
})

siPaquet('⭐⭐ FICHE §4-5 — CE QUE PORTER RETIRE : le « ET/OU » que le modèle réparait', (p) => {
  // « La route de la promesse s'ouvre sur "problème ET/OU plan annoncés", ce qui
  //   la rendait formellement ouverte sur 103 des 118 cellules — et AUCUNE des
  //   cent cellules du banc ne l'a prise : les deux modèles la lisaient comme
  //   exigeant un plan, et RÉPARAIENT LE ET/OU SANS LE DIRE. »
  //
  // Le code applique le texte. Et la conséquence est nommée : la route ouverte
  // est PLUS FACILE — sa clause « étapes réalisées dans l'ordre » devient vide.
  const sq = (pb: string, forme: string, annonce: string, etapes: string[]) => ({
    promesse: { probleme_pose: pb, probleme_forme: forme,
      annonce_de_plan: annonce, etapes_annoncees: etapes },
    blocs: [{ num: '¶1', role: 'developpement', objet: 'a',
      idee_directrice_citee: '[absente]', correspondance_annonce: 'sans objet' },
    { num: '¶2', role: 'developpement', objet: 'b',
      idee_directrice_citee: '[absente]', correspondance_annonce: 'sans objet' }],
    parties: [], jointures: [],
  })
  const p2 = { crible: { retrogradations: [] }, gabarit_repete: true,
    blocs_objets_distincts: [], doublon: false, retour_en_arriere: false,
    ordre_necessaire: false, etapes_realisees_dans_lordre: null,
    justification_ancree: '', ce_qui_plafonne: '', levier: '', confiance: 'faible' }

  const jouer = (s: unknown) => joue({ nom: 'etou', releve: s, entree_p2: p2, params: {} }).c2

  // (a) NI problème NI plan, et une majorité de blocs sans idée → défaillance
  //     FORTE. C'est la lecture que les modèles faisaient sur une copie faible.
  const sans = jouer(sq('[absent]', '[absent]', '[absente]', []))
  assert.equal(sans.verdicts.coherence_globale, 'défaillance forte')
  assert.equal(sans.verdicts.route_globale, 'aucune')

  // (b) UN PROBLÈME SEUL — pas de plan. Le texte ouvre la route de la promesse,
  //     et la copie n'est plus en défaillance FORTE mais en défaillance simple.
  //     ⭐ C'EST LA COUPURE D/C DU ROUTEUR, et elle tient à un « ou ».
  const avec = jouer(sq('Une question ?', 'question', '[absente]', []))
  assert.equal(avec.verdicts.coherence_globale, 'défaillance')
  assert.equal(avec.verdicts.route_globale, 'promesse')

  // (b-bis) ⭐⭐ ET L'OBSERVABLE DU §5 DIT LA MÊME CHOSE — c'est là que le « ou »
  //     devient visible pour le routeur. `promesse_presente` est « un problème
  //     posé, la forme faisant foi, ET/OU un plan annoncé ». Les TROIS cas
  //     séparent la lecture du texte de la réparation que les modèles faisaient :
  //     un problème SEUL et un plan SEUL valent « oui », et eux seuls le montrent.
  const releveDe2 = (s2: unknown) => BRANCHEMENT_STRUCTURE.releve(jouer(s2), ctxDe()).releve
  assert.equal(releveDe2(sq('Une question ?', 'question', '[absente]', [])).promesse_presente,
    'oui', 'un PROBLÈME seul suffit — le « ou » n\'est pas un « et »')
  assert.equal(releveDe2(sq('[absent]', '[absent]', 'D\'abord…, ensuite…', ['a', 'b']))
    .promesse_presente, 'oui', 'un PLAN seul suffit — le « ou » n\'est pas un « et »')
  assert.equal(releveDe2(sq('[absent]', '[absent]', '[absente]', [])).promesse_presente, 'non')
  assert.equal(releveDe2(sq('Une question ?', 'question', 'D\'abord…', ['a']))
    .promesse_presente, 'oui')

  // (c) ⚠️ ET LA FORME FAIT FOI (A5) : un problème CITÉ sans forme déclarée ne
  //     l'ouvre pas — et l'alerte le dit, au lieu de réparer.
  const muet = jouer(sq('Une phrase citée', '[absent]', '[absente]', []))
  assert.equal(muet.verdicts.coherence_globale, 'défaillance forte')
  assert.equal(muet.verdicts.route_globale, 'aucune')
  assert.ok(muet.alertes.some((a) => a.startsWith('PROMESSE_INCOHERENTE')))

  // (d) ET LA CLAUSE D'ORDRE EST VIDE SANS ANNONCE : avec un plan annoncé et
  //     P2 muet, la clause vaut NON et l'alerte le déclare. Sans annonce, elle
  //     ne s'applique pas du tout — la route est plus FACILE.
  const annonce = jouer(sq('[absent]', '[absent]', 'D\'abord…, ensuite…', ['a', 'b']))
  assert.ok(annonce.alertes.some((a) => a.startsWith('ETAPES_NON_JUGEES')))
  assert.ok(p.reels.length > 0)
})

siPaquet('FICHE §4-3 — LE PÉRIMÈTRE, ET SON GARDE-FOU DE COPIE COURTE', (p) => {
  // « Les seuils sont écartés de la cohésion. Garde-fou des copies courtes :
  //   s'il ne reste NI charnière NI tissu, les seuils sont réintégrés au tissu,
  //   et l'alerte le déclare. »
  const avecGarde = tousLesPassages(p).filter((c) =>
    c.attendu?.code1.alertes.some((a) => a === 'GARDE_FOU_REINTEGRATION_SEUILS'))
  assert.ok(avecGarde.length > 0, 'le garde-fou de réintégration n\'est jamais atteint')
  for (const cas of avecGarde) {
    const m = joue(cas).c1.mesures as Record<string, unknown>
    assert.equal(m.garde_fou_seuils, true, `${cas.nom} — le drapeau du garde-fou`)
    assert.equal(m.n_seuils, 0, `${cas.nom} — les seuils sont RÉINTÉGRÉS, il n'en reste aucun`)
  }
  // Et la copie d'un seul tenant (A9) : défaillance forte, avec sa RÉSERVE.
  const seulTenant = tousLesPassages(p).filter((c) =>
    c.attendu?.code2.alertes.some((a) => a.startsWith('COPIE_SANS_COUTURE')))
  assert.ok(seulTenant.length > 0)
  for (const cas of seulTenant) {
    const { c2 } = joue(cas)
    assert.equal(c2.verdicts.cohesion_locale, 'défaillance forte', cas.nom)
    assert.ok(c2.alertes.some((a) => a.includes('RÉSERVE DÉCLARÉE')),
      `${cas.nom} — la réserve du §8 doit voyager avec l'alerte`)
  }
})

siPaquet('FICHE §4-4 — SANS CHARNIÈRE, LE PLAFOND SE DÉCLARE (trou A2)', (p) => {
  // « Sans aucune charnière : jugement sur le tissu seul — majorité de relations
  //   nommées → satisfaite, qui est alors un PLAFOND, annoncé par l'alerte
  //   `TROU_DECLARE_ACQUIS`. Le haut niveau, donc Acquis, est inatteignable. »
  //   *On ne plafonne pas en silence.*
  const plafonnes = tousLesPassages(p).filter((c) =>
    c.attendu?.code2.alertes.some((a) => a.startsWith('TROU_DECLARE_ACQUIS')))
  assert.ok(plafonnes.length > 0, 'le plafond sans charnière n\'est jamais atteint')
  for (const cas of plafonnes) {
    const { c1, c2 } = joue(cas)
    assert.equal((c1.mesures as Record<string, number>).n_charnieres, 0, cas.nom)
    assert.equal(c2.verdicts.cohesion_locale, 'satisfaite',
      `${cas.nom} — le plafond est « satisfaite », jamais « haut »`)
    assert.notEqual(c2.verdicts.niveau, 'Acquis', `${cas.nom} — Acquis reste inatteignable`)
  }
})

// ── Ce que la chaîne lit de `code2` : la lettre, et le delta ────────────────

siPaquet('LA LETTRE-ÉQUIVALENTE suit le niveau CALCULÉ — `00-` §2', (p) => {
  const attendu: Record<string, string> = {
    Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
  }
  const vus = new Set<string>()
  for (const cas of tousLesPassages(p)) {
    const ctx = ctxDe()
    const { c2 } = joue(cas)
    const niveau = c2.verdicts.niveau
    const lettre = BRANCHEMENT_STRUCTURE.lettre(c2, ctx)
    if (typeof niveau !== 'string') {
      // Un PASSAGE MANQUÉ ne rend pas de lettre — et surtout pas « E ».
      assert.equal(lettre, null, `${cas.nom} — aucun niveau, aucune lettre`)
      continue
    }
    vus.add(niveau)
    assert.equal(lettre, attendu[niveau], `${cas.nom} — lettre`)
  }
  // Les cinq paliers sont réellement traversés — sinon le contrôle ne contrôle rien.
  assert.deepEqual([...vus].sort(), ['Absent', 'Acquis', 'Bon', 'Faible', 'Moyen'])
})

siPaquet('`delta` N\'EST PAS DÉCLARÉ — et c\'est une absence MOTIVÉE, pas un oubli', () => {
  // « Regarde si ta fiche le définit ; si non, NE L'INVENTE PAS — relève-le. »
  // La fiche de la Structure ne dit nulle part ce que comparer deux squelettes
  // veut dire pour elle. La chaîne le dira par une alerte et laissera NULL — et
  // NULL n'est pas 0 : une passation en classe n'a pas de version finale.
  assert.equal(BRANCHEMENT_STRUCTURE.delta, undefined)
})

siPaquet('LES SLOTS — deux natifs à P1, un document à P2, aucun crochet pré-phase', () => {
  const ctx = ctxDe()
  const specs = BRANCHEMENT_STRUCTURE.extractions(ctx)
  assert.equal(specs.length, 1, 'UN SEUL appel d\'extraction')
  assert.equal(specs[0].cle, 'p1')
  assert.equal(specs[0].tetePrompt, 'P1')
  assert.deepEqual([...specs[0].slotsFournis], [],
    '`{sujet}` et `{copie}` sont NATIFS — aucun crochet pré-phase ne les sert')
  assert.equal(specs[0].pre, undefined)
  const p2 = BRANCHEMENT_STRUCTURE.jugement(ctx)
  assert.equal(p2.tetePrompt, 'P2')
  assert.equal(p2.slotDocument ?? null, null,
    'le prompt P2 n\'a qu\'un slot : c\'est le document, sans déclaration')
  assert.equal(p2.preP2, undefined)
})
