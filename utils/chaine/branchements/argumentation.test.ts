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
// ⚠️⚠️ L'ARGUMENTATION N'A NI GOLD NI RUN STOCKÉ — `TESTS_P2_PARFAIT` est vide,
//    `VERSION_GOLDS_TESTEE` vaut `None`. « Un vecteur gold ne prouve que ce
//    qu'il couvre » ; ici il n'y a pas même de gold, et le BALAYAGE porte donc
//    la preuve : 723 entrées de plus, passées dans LA MÊME FONCTION DU MÊME
//    MODULE — il n'invente aucune règle, il cesse de ne la lui demander que 29
//    fois. Les assertions « FICHE » qui le suivent sont l'épreuve négative : un
//    portage qui inverserait une règle les fait tomber, même quand le module et
//    le portage s'accordent (ils s'accorderaient sur la même erreur).
//
// ⚠️ CE N'EST PAS UNE FIXTURE FIGÉE. Le harnais Python
//    (`scripts/vecteurs-argumentation.py`) rejoue le module À CHAQUE EXÉCUTION :
//    le jour où le module bouge — un seuil, une règle, un ordre —, ce test le
//    dit. Un jeu d'attendus recopié dans ce fichier aurait pourri en silence, et
//    « des vecteurs qui pourrissent en silence valideraient le calcul contre une
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
  BRANCHEMENT_ARGUMENTATION, OBSERVABLES_TELEMETRIE,
  DENOM_DECOMPTE, DENOM_DECOMPTE_ELARGI,
} from './argumentation'
import type { ContexteBranchement } from '../instruments'

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
  releve: Record<string, unknown>
  entree_p2: Record<string, unknown>
  params: Record<string, unknown>
  attendu: Attendu
}
interface CasCode1 {
  nom: string
  sortie_p1: Record<string, unknown>
  attendu_autotest: Record<string, unknown>
  attendu: { mesures: Record<string, unknown>; document_p2: unknown; alertes: string[] }
}
interface Paquet {
  module: {
    competence: string; version_calcul: string; version_golds_testee: string | null
    observables: string[]; params: string[]
    catalogue: Record<string, string[]>
    regle_agregation_citee: string; regle_agregation_source: string
    types: Record<string, string>; tailles: Record<string, number>
  }
  autotest: { echecs: string[]; annonces: string[] }
  p2_parfait: unknown[]
  code1: CasCode1[]
  composition: CasPassage[]
  balayage_agregation: CasPassage[]
  balayage_crible: CasPassage[]
  balayage_limites: CasPassage[]
  balayage_seuil: CasPassage[]
  balayage_normalisation: CasPassage[]
  balayage_frontieres_de_mot: CasPassage[]
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
    // ⭐ L'Argumentation ne déclare AUCUN paramètre — `parametres: {}` à la fiche,
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
    ['scripts/vecteurs-argumentation.py', '--racine', RACINE_CONCEPTION],
    { encoding: 'utf-8', maxBuffer: 256 * 1024 * 1024 })
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

/** Rejoue un cas de bout en bout et compare LES TROIS CLÉS des deux temps. */
function rejoue(cas: CasPassage, ou: string) {
  const ctx = ctxDe()
  const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: cas.releve }, ctx)
  assert.deepEqual(c1.mesures, cas.attendu.code1.mesures, `${ou}/${cas.nom} — mesures de code1`)
  assert.deepEqual(c1.document_p2, cas.attendu.code1.document_p2,
    `${ou}/${cas.nom} — document_p2`)
  assert.deepEqual(c1.alertes, cas.attendu.code1.alertes, `${ou}/${cas.nom} — alertes de code1`)

  const c2 = BRANCHEMENT_ARGUMENTATION.code2(cas.entree_p2, c1, ctx)
  assert.deepEqual(c2.verdicts, cas.attendu.code2.verdicts, `${ou}/${cas.nom} — verdicts`)
  // La trace se compare MOT POUR MOT : c'est elle qui rend lisible une erreur de
  // jugement, « depuis que le code calcule juste ».
  assert.deepEqual(c2.trace, cas.attendu.code2.trace, `${ou}/${cas.nom} — trace`)
  assert.deepEqual(c2.alertes, cas.attendu.code2.alertes, `${ou}/${cas.nom} — alertes de code2`)

  const conf = BRANCHEMENT_ARGUMENTATION.conformite!({ p1: cas.releve }, cas.entree_p2, c1, c2, ctx)
  assert.deepEqual(conf, cas.attendu.conformite, `${ou}/${cas.nom} — conformite`)
  return { c1, c2 }
}

// ── Ce que le module dit de lui-même ────────────────────────────────────────

siPaquet("l'autotest du module est vert, et il n'a NI gold NI run stocké", (p) => {
  assert.deepEqual(p.autotest.echecs, [])
  assert.equal(p.module.competence, 'argumentation')
  // « Ton état : TESTS_P2_PARFAIT vide · TESTS_CODE1_PARFAIT 2 vecteurs ·
  //   VERSION_GOLDS_TESTEE = None. » Si l'un des trois bouge, c'est que les golds
  //   du Run 1 sont arrivés — et les vecteurs gold avec eux.
  assert.equal(p.module.version_golds_testee, null)
  assert.deepEqual(p.module.observables, ['niveau', 'palier_base', 'seuil_franchi'])
  assert.deepEqual(p.module.params, [])
})

siPaquet('LE TYPE des trois constantes de vecteurs, et pas seulement leur taille', (p) => {
  // ⚠️ « Ne compte jamais une constante sans vérifier son TYPE » : chez
  //    l'Expression, `TESTS_CODE1_PARFAIT` est une CHAÎNE, et un `len()` y a rendu
  //    « 52 vecteurs » qui étaient 52 caractères.
  assert.deepEqual(p.module.types, {
    TESTS_P2_PARFAIT: 'list', TESTS_CODE1_PARFAIT: 'list', TESTS_COMPOSITION: 'list',
  })
  assert.deepEqual(p.module.tailles, {
    TESTS_P2_PARFAIT: 0, TESTS_CODE1_PARFAIT: 2, TESTS_COMPOSITION: 27,
  })
  assert.equal(p.p2_parfait.length, 0)
})

siPaquet('LES LISTES FERMÉES du module sont celles du bloc machine de la fiche', (p) => {
  // Le dérivé porte le volet `squelette` ; le module porte son `CATALOGUE`. Le
  // portage lit le second — s'ils divergeaient, le banc refuserait le run
  // (`verifie-module.py`), et ce test le dirait ici d'abord.
  assert.deepEqual(p.module.catalogue.statuts_lien,
    ['absent', 'circulaire', 'implicite', 'explicite', 'limite'])
  assert.deepEqual(p.module.catalogue.tests_crible,
    ['distinction', 'source', 'sens', 'contour'])
  assert.deepEqual(p.module.catalogue.marques_termes, ['ambigu', 'vague'])
  assert.deepEqual(p.module.catalogue.traitements_objection,
    ['réfutée', 'portée nuancée', 'évoquée sans réponse', 'aucune'])
  assert.equal(p.module.regle_agregation_source, 'competences/argumentation.md, §4')
})

// ── LE CŒUR : les vecteurs embarqués, les trois clés, sur les mêmes entrées ──

siPaquet('LES DEUX VECTEURS `code1` — mesures, document_p2 et alertes IDENTIQUES', (p) => {
  assert.equal(p.code1.length, 2)
  for (const cas of p.code1) {
    const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: cas.sortie_p1 }, ctxDe())
    assert.deepEqual(c1.mesures, cas.attendu.mesures, `${cas.nom} — mesures`)
    assert.deepEqual(c1.document_p2, cas.attendu.document_p2, `${cas.nom} — document_p2`)
    assert.deepEqual(c1.alertes, cas.attendu.alertes, `${cas.nom} — alertes`)
  }
})

siPaquet('LES 27 VECTEURS DE COMPOSITION — code1, code2 et conformite reproduits', (p) => {
  assert.equal(p.composition.length, 27)
  for (const cas of p.composition) rejoue(cas, 'composition')
})

siPaquet('BALAYAGE — les 680 distributions de 1 à 4 unités, avec et sans objection', (p) => {
  assert.equal(p.balayage_agregation.length, 680)
  for (const cas of p.balayage_agregation) rejoue(cas, 'agregation')
})

siPaquet('BALAYAGE — les 4 tests du crible × les 4 statuts déclarables', (p) => {
  assert.equal(p.balayage_crible.length, 16)
  for (const cas of p.balayage_crible) rejoue(cas, 'crible')
})

siPaquet('BALAYAGE — les 6 paires de « limite », dans les DEUX ordres d\'écriture', (p) => {
  assert.equal(p.balayage_limites.length, 12)
  for (const cas of p.balayage_limites) rejoue(cas, 'limites')
})

siPaquet('BALAYAGE — les 5 traitements × les 3 états de marque', (p) => {
  assert.equal(p.balayage_seuil.length, 15)
  for (const cas of p.balayage_seuil) rejoue(cas, 'seuil')
})

siPaquet('CONFORMITÉ — les six formes que P2 peut prendre', (p) => {
  assert.equal(p.conformite_cas.length, 6)
  for (const cas of p.conformite_cas) rejoue(cas, 'conformite')
})

siPaquet('BALAYAGE — L\'APPARIEMENT D\'UNE THÈSE passe par `casefold`, pas par `lower`', (p) => {
  // ⚠️⚠️ AUCUN VECTEUR DU MODULE NE LE VOIT : ses thèses sont `t1`, `t2`, `t3`.
  //    Sur une copie réelle une thèse porte des accents, des majuscules, des
  //    espaces doubles — et une OCR produit des ligatures. `toLowerCase()` ne
  //    replie pas `ß`, ni `ﬁ`, ni le sigma final : le repliement manqué perd une
  //    requalification, et la copie garde un palier de trop.
  assert.equal(p.balayage_normalisation.length, 8)
  for (const cas of p.balayage_normalisation) rejoue(cas, 'normalisation')
  // Et la preuve que le contrôle contrôle : sept paires s'apparient, une non —
  // `casefold` replie la casse, il ne retire pas les accents.
  const apparies = p.balayage_normalisation
    .filter((c) => c.attendu.code2.trace.some((l) => l.startsWith('crible/')))
  assert.equal(apparies.length, 7)
  assert.equal(parNom(p.balayage_normalisation, 'these_accent-perdu')
    .attendu.code2.verdicts.palier_base, 'Bon')
})

siPaquet('BALAYAGE — LE `\\b` D\'UNE NOTE DE « limite » EST UNICODE', (p) => {
  // ⚠️⚠️ « écirculaire » ne contient pas « circulaire » comme mot isolé : le `\b`
  //    de Python compte `é` comme un caractère de mot, celui de JavaScript hors
  //    drapeau `u` ne connaît que l'ASCII. Sans ce contrôle, la note « entre
  //    écirculaire et implicite » donnerait DEUX statuts au lieu d'un, et une
  //    unité que le garde-fou `limite_illisible` écarte rentrerait au décompte
  //    avec un statut FABRIQUÉ — « le doute ne fabrique pas un statut ».
  assert.equal(p.balayage_frontieres_de_mot.length, 11)
  for (const cas of p.balayage_frontieres_de_mot) rejoue(cas, 'frontieres')
  // Les cinq notes qui ne donnent PAS deux statuts nets laissent l'unité dehors.
  for (const nom of ['note_accent-colle', 'note_chiffre-colle', 'note_lettre-collee',
    'note_un-seul', 'note_trois']) {
    const { c2 } = verdictsDe(parNom(p.balayage_frontieres_de_mot, nom))
    assert.equal(c2.verdicts.palier_base, 'Bon', `${nom} — l'unité reste écartée`)
    assert.ok(c2.alertes.some((a) => a.includes('limite illisible')), nom)
  }
})

// ── L'ÉPREUVE NÉGATIVE : ce que la FICHE écrit, et qu'un module d'accord avec
//    un portage faux ne prouverait pas ────────────────────────────────────────

/** Le verdict du portage sur un cas du paquet, sans repasser par le module. */
function verdictsDe(cas: CasPassage) {
  const ctx = ctxDe()
  const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: cas.releve }, ctx)
  const c2 = BRANCHEMENT_ARGUMENTATION.code2(cas.entree_p2, c1, ctx)
  return { c2, releve: BRANCHEMENT_ARGUMENTATION.releve(c2, ctx) }
}
function parNom(cas: CasPassage[], nom: string): CasPassage {
  const c = cas.find((x) => x.nom === nom)
  assert.ok(c, `vecteur « ${nom} » absent du paquet`)
  return c
}

siPaquet('FICHE §4 — LES CINQ MOUVEMENTS, ET AUCUN AUTRE', (p) => {
  // « Tu ne peux que DESCENDRE D'UN PALIER, REQUALIFIER À PALIER ÉGAL, ou
  //   MARQUER SANS CHANGER LE STATUT. » Le balayage donne les seize croisements ;
  //   voici ce que la fiche en dit, ligne par ligne.
  const attendu: Record<string, { base: string; applique: boolean }> = {
    // distinction : explicite → implicite. 1 explicite + 2 implicite = Bon ;
    // requalifiée, 3 implicite = Moyen.
    crible_distinction_sur_explicite: { base: 'Moyen', applique: true },
    crible_distinction_sur_implicite: { base: 'Moyen', applique: false },
    crible_distinction_sur_circulaire: { base: 'Moyen', applique: false },
    crible_distinction_sur_absent: { base: 'Moyen', applique: false },
    // source : explicite ET implicite → cosmetique. Sur `explicite`, la base
    // tombe de Bon à Moyen ; sur `implicite`, « la lettre ne bouge pas ».
    crible_source_sur_explicite: { base: 'Moyen', applique: true },
    crible_source_sur_implicite: { base: 'Moyen', applique: true },
    crible_source_sur_circulaire: { base: 'Moyen', applique: false },
    crible_source_sur_absent: { base: 'Moyen', applique: false },
    // sens et contour : ils MARQUENT et ne rétrogradent rien — la base ne bouge
    // pas, et c'est le seuil qui se ferme.
    crible_sens_sur_explicite: { base: 'Moyen', applique: true },
    crible_contour_sur_explicite: { base: 'Moyen', applique: true },
  }
  for (const [nom, att] of Object.entries(attendu)) {
    const cas = parNom(p.balayage_crible, nom)
    const { c2 } = verdictsDe(cas)
    assert.equal(c2.verdicts.palier_base, att.base, `${nom} — palier de base`)
    const applique = c2.trace.some((l) => l.startsWith('crible/'))
    assert.equal(applique, att.applique, `${nom} — la requalification a-t-elle mordu`)
  }
  // ⛔ CE QUE LE PORTAGE NE DOIT JAMAIS FAIRE : `sens` et `contour` sur une
  //    `explicite` ne changent PAS le statut. Le témoin est la distribution.
  for (const nom of ['crible_sens_sur_explicite', 'crible_contour_sur_explicite']) {
    const { c2 } = verdictsDe(parNom(p.balayage_crible, nom))
    assert.ok(c2.trace.some((l) => l.includes('statut inchangé (explicite)')), nom)
    assert.ok(c2.trace.some((l) => l.includes("distribution après crible et borne basse : "
      + "{'implicite': 2, 'explicite': 1}")), `${nom} — le statut n'a pas bougé`)
    // Et le seuil se ferme, alors qu'une objection est réfutée.
    assert.equal(c2.verdicts.seuil_franchi, 'non', `${nom} — le seuil se ferme`)
  }
})

siPaquet('FICHE §4 — LA BORNE BASSE suit l\'ordre de la FICHE, jamais celui de la note', (p) => {
  // « Une unité `limite` compte pour LE PLUS FAIBLE DES DEUX STATUTS que sa
  //   `note` indique, dans l'ordre absent < circulaire < implicite < explicite. »
  // ⭐ Le vecteur du module n'écrit la note que dans UN ordre ; l'inverser est
  //    exactement ce qui démasquerait un portage qui lirait le premier cité.
  const attendu: Record<string, string> = {
    absent: 'Absent', circulaire: 'Faible', implicite: 'Moyen', explicite: 'Bon',
  }
  for (const cas of p.balayage_limites) {
    const [, gauche, , droite] = cas.nom.split('_')
    const faible = ['absent', 'circulaire', 'implicite', 'explicite']
      .find((s) => s === gauche || s === droite)!
    const { c2 } = verdictsDe(cas)
    assert.equal(c2.verdicts.palier_base, attendu[faible],
      `${cas.nom} — la borne basse est « ${faible} »`)
    assert.ok(c2.trace.some((l) => l.includes(`comptée « ${faible} »`)), cas.nom)
  }
})

siPaquet('FICHE §4 — LA MAJORITÉ SE COMPTE SUR LE PALIER, jamais sur le statut', (p) => {
  // « Deux statuts à Moyen ne se divisent pas les voix, sans quoi ajouter
  //   `cosmetique` ferait mécaniquement monter des copies. » 3 explicite +
  //   2 cosmetique + 2 implicite : sur le STATUT, `explicite` = 3 gagne (faux) ;
  //   sur le PALIER, Moyen = 4 gagne.
  const { c2 } = verdictsDe(parNom(p.composition,
    'DILUTION : deux statuts à Moyen ne se divisent pas les voix'))
  assert.equal(c2.verdicts.palier_base, 'Moyen')
  assert.ok(c2.trace.some((l) => l.includes("paliers : {'Moyen': 4, 'Bon': 3}")))
})

siPaquet('FICHE §4 — À ÉGALITÉ EN TÊTE, LE PLUS FAIBLE DES EX ÆQUO DÉCIDE', (p) => {
  // Le balayage porte toutes les égalités possibles à 2 et 4 unités. On les
  // relit ici contre la règle, et non contre le module.
  const ORDRE = ['Absent', 'Faible', 'Moyen', 'Bon']
  const PALIER: Record<string, string> = {
    absent: 'Absent', circulaire: 'Faible', implicite: 'Moyen', explicite: 'Bon',
  }
  let egalites = 0
  for (const cas of p.balayage_agregation) {
    const combo = cas.nom.split('_')[1].split('-')
    const comptes: Record<string, number> = { Absent: 0, Faible: 0, Moyen: 0, Bon: 0 }
    for (const s of combo) comptes[PALIER[s]] += 1
    const maxi = Math.max(...Object.values(comptes))
    const tetes = ORDRE.filter((x) => comptes[x] === maxi)
    if (tetes.length > 1) egalites += 1
    const { c2 } = verdictsDe(cas)
    assert.equal(c2.verdicts.palier_base, tetes[0], `${cas.nom} — palier de base`)
  }
  // Sans égalités dans le balayage, la règle ne serait pas éprouvée du tout.
  assert.ok(egalites > 50, `le balayage ne porte que ${egalites} égalités`)
})

siPaquet('FICHE §4 — LE SEUIL OUVRE ACQUIS, IL N\'ÉLÈVE JAMAIS LA BASE', (p) => {
  let acquis = 0
  let seuilSansAcquis = 0
  for (const cas of p.balayage_agregation) {
    const { c2 } = verdictsDe(cas)
    const base = c2.verdicts.palier_base as string
    const seuil = c2.verdicts.seuil_franchi === 'oui'
    const niveau = c2.verdicts.niveau
    assert.equal(niveau, (base === 'Bon' && seuil) ? 'Acquis' : base, `${cas.nom} — niveau`)
    if (niveau === 'Acquis') acquis += 1
    if (seuil && base !== 'Bon') { seuilSansAcquis += 1; assert.equal(niveau, base, cas.nom) }
  }
  assert.ok(acquis > 0 && seuilSansAcquis > 0,
    `le balayage doit porter les deux cas (Acquis : ${acquis}, seuil sans Acquis : ${seuilSansAcquis})`)
})

siPaquet('FICHE §4 — CE QUI OUVRE LE SEUIL, ET CE QUI LE FERME', (p) => {
  // « Acquis exige la base Bon, une objection réfutée ou portée nuancée, ET
  //   AUCUNE unité marquée ambigu ou vague. » Cinq traitements × trois états de
  //   marque : seuls deux traitements ouvrent, et toute marque referme.
  const ouvrent = new Set(['réfutée', 'portée-nuancée'])
  for (const cas of p.balayage_seuil) {
    const reste = cas.nom.slice('seuil_'.length)
    const marque = reste.endsWith('sans-marque') ? null
      : (reste.endsWith('_sens') ? 'sens' : 'contour')
    const traitement = reste.slice(0, reste.lastIndexOf('_'))
    const { c2 } = verdictsDe(cas)
    const attendu = ouvrent.has(traitement) && marque === null ? 'oui' : 'non'
    assert.equal(c2.verdicts.seuil_franchi, attendu, `${cas.nom} — seuil`)
    // La base ne bouge JAMAIS : trois `explicite`, marque ou pas.
    assert.equal(c2.verdicts.palier_base, 'Bon', `${cas.nom} — la marque n'abaisse pas la base`)
  }
})

// ── Ce que la chaîne lit de `code2` : la lettre, et le relevé ───────────────

siPaquet('LA LETTRE-ÉQUIVALENTE suit le niveau CALCULÉ — `00-` §2', (p) => {
  const attendu: Record<string, string> = {
    Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
  }
  const vus = new Set<string>()
  for (const cas of [...p.composition, ...p.balayage_agregation]) {
    const ctx = ctxDe()
    const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: cas.releve }, ctx)
    const c2 = BRANCHEMENT_ARGUMENTATION.code2(cas.entree_p2, c1, ctx)
    const niveau = String(c2.verdicts.niveau)
    vus.add(niveau)
    assert.equal(BRANCHEMENT_ARGUMENTATION.lettre(c2, ctx), attendu[niveau], `${cas.nom} — lettre`)
  }
  // Les cinq paliers sont réellement traversés — sinon le contrôle ne contrôle rien.
  assert.deepEqual([...vus].sort(), ['Absent', 'Acquis', 'Bon', 'Faible', 'Moyen'])
})

siPaquet('LES NEUF OBSERVABLES DU §5 ont TOUS une valeur, ou une alerte NOMMÉE', (p) => {
  const tous = [...p.composition, ...p.balayage_agregation, ...p.balayage_crible,
    ...p.balayage_limites, ...p.balayage_seuil, ...p.balayage_normalisation,
    ...p.balayage_frontieres_de_mot, ...p.conformite_cas]
  for (const cas of tous) {
    const { releve: { releve, alertes } } = verdictsDe(cas)
    for (const code of OBSERVABLES_TELEMETRIE) {
      const aUneValeur = code in releve
      const aUneAlerte = alertes.some((a) => a.startsWith(`${code} :`))
      assert.ok(aUneValeur || aUneAlerte,
        `${cas.nom} — « ${code} » n'a NI valeur NI alerte nommée : il sortirait en \`n/a\`, `
        + 'donc du dénominateur du taux, et l\'escalade serait aveugle sur lui SANS UN SYMPTÔME')
      assert.ok(!(aUneValeur && aUneAlerte),
        `${cas.nom} — « ${code} » a une valeur ET une alerte : le relevé se contredit`)
    }
    // Les DEUX dénominateurs sont toujours là : sans eux, les cinq `comptage
    // rapporté` n'auraient rien à diviser et sortiraient en `n/a`.
    assert.ok(DENOM_DECOMPTE in releve, `${cas.nom} — dénominateur du décompte`)
    assert.ok(DENOM_DECOMPTE_ELARGI in releve, `${cas.nom} — dénominateur élargi`)
  }
})

siPaquet('§5 — `garant_present` se lit sur le RELEVÉ, que `mesures` a jeté', () => {
  // `code1` ne garde que rang/thèse/statut/note : `garant_cite` n'est plus dans
  // `mesures`. L'observable le relit sur `document_p2` — et si le document
  // manquait, il rendrait son alerte, jamais 0.
  const ctx = ctxDe()
  const releve = { unites: [
    { these: 't1', garant_cite: 'car g1', statut_du_lien: 'explicite' },
    { these: 't2', garant_cite: '[absent]', statut_du_lien: 'implicite' },
    { these: 't3', garant_cite: '', statut_du_lien: 'implicite' },
    { these: 't4', garant_cite: '   ', statut_du_lien: 'implicite' },
    // ⭐ ÉCARTÉE DU DÉCOMPTE, et elle PORTE un garant : c'est elle qui distingue
    //    les deux dénominateurs possibles. Rapporté aux unités du décompte,
    //    `garant_present` vaut 1/4 ; rapporté à toutes, 2/5 — et rien d'autre ne
    //    ferait tomber le contrôle.
    { these: 't5', garant_cite: 'car g5', statut_du_lien: 'explicité' },
  ], objections: [] }
  const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: releve }, ctx)
  assert.equal('garant_cite' in ((c1.mesures.unites as Array<Record<string, unknown>>)[0]), false)
  const c2 = BRANCHEMENT_ARGUMENTATION.code2({ crible: { requalifications: [] } }, c1, ctx)
  const { releve: tele } = BRANCHEMENT_ARGUMENTATION.releve(c2, ctx)
  assert.equal(tele[DENOM_DECOMPTE], 4)
  assert.equal(tele[DENOM_DECOMPTE_ELARGI], 5)
  assert.equal(tele.garant_present, 0.25)
  // Sans document, l'alerte nommée — jamais 0.
  const c2Sans = BRANCHEMENT_ARGUMENTATION.code2({ crible: { requalifications: [] } },
    { ...c1, document_p2: null }, ctx)
  const sans = BRANCHEMENT_ARGUMENTATION.releve(c2Sans, ctx)
  assert.equal('garant_present' in sans.releve, false)
  assert.ok(sans.alertes.some((a) => a.startsWith('garant_present :') && a.includes('jamais 0')))
})

siPaquet('§5 — les cinq `comptage rapporté` rendent LE COMPTE, la chaîne divise', (p) => {
  // « `comptage rapporté` DIVISE l'entrée du même nom par le dénominateur que
  //   `rapporte_a` désigne ; les autres lisent l'entrée telle quelle. »
  const ctx = ctxDe()
  // ⭐ LES COMPTES SONT DÉLIBÉRÉMENT ASYMÉTRIQUES : deux requalifications au test
  //    de la distinction, une au test de la source, une marque de sens et zéro de
  //    contour. Avec un compte par test, échanger deux observables passerait
  //    inaperçu — c'est ce que l'épreuve négative a montré.
  const releve = { unites: [
    { these: 't1', garant_cite: 'car g1', statut_du_lien: 'explicite' },
    { these: 't2', garant_cite: 'car g2', statut_du_lien: 'explicite' },
    { these: 't3', garant_cite: 'car g3', statut_du_lien: 'explicite' },
    { these: 't4', garant_cite: 'car g4', statut_du_lien: 'explicite' },
    { these: 't5', garant_cite: '[absent]', statut_du_lien: 'circulaire' },
    { these: 't6', garant_cite: '[absent]', statut_du_lien: 'limite', note: 'je ne sais pas' },
    { these: 't7', garant_cite: 'car g7', statut_du_lien: 'explicité' },
  ], objections: [{ objection: 'o', traitement: 'réfutée' }] }
  const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: releve }, ctx)
  const c2 = BRANCHEMENT_ARGUMENTATION.code2({ crible: { requalifications: [
    { unite: 1, these: 't1', test: 'distinction', raison: 'r' },
    { unite: 2, these: 't2', test: 'distinction', raison: 'r' },
    { unite: 3, these: 't3', test: 'source', raison: 'r' },
    { unite: 4, these: 't4', test: 'sens', raison: 'r' },
  ] } }, c1, ctx)
  const { releve: tele } = BRANCHEMENT_ARGUMENTATION.releve(c2, ctx)
  // 5 unités au décompte — la `limite` illisible et le statut hors liste en sont
  // écartés —, 7 au total.
  assert.equal(tele[DENOM_DECOMPTE], 5)
  assert.equal(tele[DENOM_DECOMPTE_ELARGI], 7)
  assert.equal(tele.preuve_circulaire, 1)     // t5
  assert.equal(tele.garant_circulaire, 2)     // t1 et t2, au test de la distinction
  assert.equal(tele.source_cosmetique, 1)     // t3, au test de la source
  assert.equal(tele.garant_ambigu, 1)         // t4, marquée au test du sens
  assert.equal(tele.garant_vague, 0)
  assert.equal(tele.nb_limites, 1)            // écartée, mais comptée
  // `garant_present` : t1 à t4 portent un garant, t5 non — 4 sur 5. ⚠️ t7 en
  // porte un aussi, et elle est ÉCARTÉE : rapporté à toutes les unités, ce serait
  // 5/7. C'est le seul endroit où le dénominateur se prouve.
  assert.equal(tele.garant_present, 0.8)
  // `lien_explicite` : t4 seule reste `explicite` après crible — 1 sur 5.
  assert.equal(tele.lien_explicite, 0.2)
  // ⭐ `objection_traitee` N'EST PAS `seuil_franchi` : l'objection est réfutée,
  //    et le seuil se ferme parce qu'une unité est marquée `ambigu` (fiche §4).
  assert.equal(tele.objection_traitee, 'oui')
  assert.equal(c2.verdicts.seuil_franchi, 'non')
  assert.ok(p.module.competence === 'argumentation')
})

siPaquet('§5 — un décompte VIDE rend l\'alerte nommée, jamais 0 ni 1', (p) => {
  // Toutes les unités écartées : les deux `proportion` n'ont pas de dénominateur
  // et le DISENT ; les cinq `comptage rapporté` gardent leur compte, et c'est la
  // chaîne qui rendra `n/a` sur un dénominateur nul (`01-` §8.2).
  const ctx = ctxDe()
  const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: {
    unites: [{ these: 't1', garant_cite: 'g', statut_du_lien: 'explicité' }], objections: [],
  } }, ctx)
  const c2 = BRANCHEMENT_ARGUMENTATION.code2({ crible: { requalifications: [] } }, c1, ctx)
  const { releve: tele, alertes } = BRANCHEMENT_ARGUMENTATION.releve(c2, ctx)
  assert.equal(tele[DENOM_DECOMPTE], 0)
  assert.equal(tele[DENOM_DECOMPTE_ELARGI], 1)
  for (const code of ['garant_present', 'lien_explicite']) {
    assert.equal(code in tele, false, code)
    assert.ok(alertes.some((a) => a.startsWith(`${code} :`) && a.includes('jamais 0')), code)
  }
  assert.equal(c2.verdicts.niveau, 'Absent')
  assert.ok(p.module.competence === 'argumentation')
})

// ── Le précédent de cette compétence : `document_p2` ────────────────────────

siPaquet('`document_p2` — LA CLÉ EST LÀ, et ce test échoue si elle disparaît', (p) => {
  // ⚠️⚠️ « Elle a déjà servi `null` à son juge, tous contrôles verts » : `code1`
  //    rendait sa sortie SANS cette clé, le juge a jugé à vide, les verdicts sont
  //    sortis, l'autotest était vert et la trace était propre. C'est LE SEUL
  //    défaut du contrat dont rien ne témoigne (`CONTRAT-MODULES.md` §2) — d'où
  //    ce test, et d'où le refus que `chaine.ts` porte de son côté.
  for (const cas of p.composition) {
    const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: cas.releve }, ctxDe())
    assert.ok('document_p2' in c1, `${cas.nom} — la clé document_p2 a disparu`)
    // Et il porte bien le relevé : le juge lit `garant_cite`, sur quoi repose le
    // test 1 du crible — que `mesures` a jeté.
    assert.deepEqual(c1.document_p2, cas.releve, `${cas.nom} — le document EST le relevé`)
  }
  // ⭐ Sa VALEUR peut être nulle — un relevé illisible n'a pas de document — ;
  //    c'est l'ABSENCE de la clé qui est l'erreur.
  const vide = BRANCHEMENT_ARGUMENTATION.code1({ p1: 'pas un objet' }, ctxDe())
  assert.ok('document_p2' in vide)
  assert.equal(vide.document_p2, null)
  assert.deepEqual(vide.alertes, ['P1 illisible : aucun document pour P2'])
})

// ── Ce que le portage DURCIT là où le module lèverait ───────────────────────

siPaquet('LE PORTAGE NE LÈVE JAMAIS — une forme illisible rend une ALERTE', (p) => {
  // « Le module ne lève jamais d'exception : elle traverserait le banc et
  //   emporterait la trace avec elle » (`CONTRAT-MODULES.md` §3). Ces quatre
  //   formes-là font lever le module ; ici elles rendent une alerte nommée.
  const ctx = ctxDe()
  const formes: Array<[string, Record<string, unknown>, unknown, string]> = [
    ['unites non liste', { unites: 'deux', objections: [] },
      { crible: { requalifications: [] } }, '`unites` n\'est pas une liste'],
    ['objections non liste', { unites: [], objections: 'aucune' },
      { crible: { requalifications: [] } }, '`objections` n\'est pas une liste'],
    ['requalifications non liste', { unites: [], objections: [] },
      { crible: { requalifications: 'aucune' } }, '`requalifications` n\'est pas une liste'],
    ['requalification non objet', { unites: [], objections: [] },
      { crible: { requalifications: ['x'] } }, 'ni test'],
  ]
  for (const [nom, releve, p2, motif] of formes) {
    const c1 = BRANCHEMENT_ARGUMENTATION.code1({ p1: releve }, ctx)
    const c2 = BRANCHEMENT_ARGUMENTATION.code2(p2, c1, ctx)
    const toutes = [...c1.alertes, ...c2.alertes]
    assert.ok(toutes.some((a) => a.includes(motif)),
      `${nom} — aucune alerte ne dit « ${motif} » : ${JSON.stringify(toutes)}`)
    // Et un verdict sort quand même, jamais une exception.
    assert.equal(typeof c2.verdicts.niveau, 'string', nom)
  }
  assert.ok(p.module.competence === 'argumentation')
})
