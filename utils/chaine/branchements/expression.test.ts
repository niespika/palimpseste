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
// ⚠️ CE N'EST PAS UNE FIXTURE FIGÉE. Le harnais Python
//    (`scripts/vecteurs-expression.py`) rejoue le module À CHAQUE EXÉCUTION : le
//    jour où le module bouge — un seuil, une règle, un arrondi —, ce test le dit.
//    Un jeu d'attendus recopié dans ce fichier aurait pourri en silence, et
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
  BRANCHEMENT_EXPRESSION, cribleReussites, preReleve, connecteursEcole,
} from './expression'
import type { ContexteBranchement, SortieCode1 } from '../instruments'

const RACINE_CONCEPTION = '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

interface CasCode2 {
  nom: string
  entree_p2: Record<string, unknown>
  sortie_code1: SortieCode1
  params: Record<string, unknown>
  attendu: { verdicts: Record<string, unknown>; trace: string[]; alertes: string[] }
  gold?: { niveau: string; bande: [string, string] | null }
}
interface CasCrible {
  nom: string
  releve: Record<string, unknown>
  rejets: unknown[]
  grades: Record<string, unknown>
  attendu: { crible: Record<string, unknown>; alertes: string[] }
}
interface CasChaine {
  nom: string
  texte: string
  releve: Record<string, unknown>
  entree_p2: Record<string, unknown>
  params: Record<string, unknown>
  attendu: {
    code1: { mesures: Record<string, unknown>; document_p2: unknown; alertes: string[] }
    code2: { verdicts: Record<string, unknown>; trace: string[]; alertes: string[] }
    conformite: string[]
  }
}
interface Paquet {
  module: { competence: string; version_calcul: string; version_golds_testee: string
    observables: string[]; params: string[] }
  autotest: { echecs: string[]; annonces: string[] }
  p2_parfait: CasCode2[]
  balayage_grades: CasCode2[]
  garde_fou_zero: CasCode2[]
  crible: CasCrible[]
  chaines: CasChaine[]
}

/** Le contexte d'un vecteur : aucun exercice, aucune base, aucun appel. */
function ctxDe(params: Record<string, unknown>, copie = ''): ContexteBranchement {
  return {
    modes: ['composer'],
    cran: null,
    referent: null,
    exceptionOrthographe: params.exception_orthographe === true,
    contexteExercice: { copie, sujet: '', consigne: '', mode: 'composer' },
    prives: {},
    sorties: {},
    // Les seuils du vecteur sont ceux du module : ses défauts, qui sont ceux du
    // bloc machine de la fiche. Un vecteur qui balaierait un seuil le passerait
    // ici, et les deux côtés le liraient au même endroit.
    parametres: Object.fromEntries(
      Object.entries(params).filter(([, v]) => typeof v === 'number' || typeof v === 'string'),
    ) as Record<string, number | string>,
  }
}

let paquet: Paquet | null = null
let motifDuSaut: string | null = null

if (!existsSync(RACINE_CONCEPTION)) {
  motifDuSaut = 'dépôt de conception absent'
} else {
  const r = spawnSync('python3', ['scripts/vecteurs-expression.py'],
    { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 })
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

// ── Ce que le module dit de lui-même ────────────────────────────────────────

siPaquet("l'autotest du module est vert, et ses golds sont de VRAIS golds", (p) => {
  assert.deepEqual(p.autotest.echecs, [])
  // « C'est la SEULE des six dont les vecteurs sont adossés à de vrais golds. »
  assert.equal(p.module.version_golds_testee, '1.0')
  assert.equal(p.module.competence, 'expression')
  assert.deepEqual(p.module.observables, ['niveau', 'fluidite', 'precision', 'profil'])
})

siPaquet('les SEPT vecteurs gold sont là — un par copie, pas un de moins', (p) => {
  assert.equal(p.p2_parfait.length, 7)
})

// ── LE CŒUR : les trois clés, sur les mêmes entrées ─────────────────────────

siPaquet('VECTEURS GOLD — les trois clés de `code2` sont IDENTIQUES à celles du module', (p) => {
  for (const cas of [...p.p2_parfait, ...p.garde_fou_zero, ...p.balayage_grades]) {
    const obtenu = BRANCHEMENT_EXPRESSION.code2(
      cas.entree_p2, cas.sortie_code1, ctxDe(cas.params))
    assert.deepEqual(obtenu.verdicts, cas.attendu.verdicts, `${cas.nom} — verdicts`)
    // La trace se compare MOT POUR MOT : c'est elle qui rend lisible une erreur
    // de jugement, « depuis que le code calcule juste ».
    assert.deepEqual(obtenu.trace, cas.attendu.trace, `${cas.nom} — trace`)
    assert.deepEqual(obtenu.alertes, cas.attendu.alertes, `${cas.nom} — alertes`)
  }
})

siPaquet('LE BALAYAGE DES 25 COUPLES — le croisement, les garde-fous, ET LE PROFIL', (p) => {
  // ⚠️ POURQUOI CE BALAYAGE EXISTE. Les sept vecteurs gold portent TOUS un écart
  //    de grades ≤ 1, donc tous le profil `diagonale` : un portage qui
  //    inverserait la règle du profil dissocié LES PASSERAIT TOUS LES SEPT.
  //    Vérifié en cassant le seuil exprès, avant d'écrire ceci — et l'autotest
  //    du module l'annonce de son côté : « `profil` : aucun vecteur ».
  assert.equal(p.balayage_grades.length, 25)
  // Les neuf vérifications que la fiche §2 écrit noir sur blanc.
  const attendu: Record<string, string> = {
    grades_1_1: 'Faible', grades_2_2: 'Moyen', grades_3_3: 'Bon', grades_4_4: 'Acquis',
    grades_0_0: 'Absent', grades_4_1: 'Moyen', grades_1_4: 'Moyen', grades_3_4: 'Bon',
    grades_0_4: 'Faible',
  }
  const profils: Record<string, string> = {
    grades_4_1: 'fluide-imprecis', grades_1_4: 'precis-raide', grades_3_3: 'diagonale',
  }
  for (const cas of p.balayage_grades) {
    const c2 = BRANCHEMENT_EXPRESSION.code2(cas.entree_p2, cas.sortie_code1, ctxDe({}))
    if (attendu[cas.nom]) assert.equal(c2.verdicts.niveau, attendu[cas.nom], `${cas.nom} — fiche §2`)
    if (profils[cas.nom]) assert.equal(c2.verdicts.profil, profils[cas.nom], `${cas.nom} — profil`)
  }
})

siPaquet('LA ZONE GRISE — ses trois bandes et son SECOND SIGNAL, à l\'identique', (p) => {
  // « Au-delà du seuil haut, plafond Faible ; DANS LA ZONE GRISE, plafond
  //   seulement si un second signal confirme la casse ; sous la zone grise, pas
  //   de plafond. » Le couperet net d'avant faisait un palier entier pour un
  //   rejet d'audit d'écart — c'est la règle que ce contrôle tient.
  const cas = p.chaines.filter((c) => c.nom.startsWith('garde_fou_'))
  assert.equal(cas.length, 6)
  const attendu: Record<string, string> = {
    garde_fou_4faits_0rx: 'Bon', garde_fou_4faits_1rx: 'Bon',
    garde_fou_5faits_0rx: 'Bon', garde_fou_5faits_1rx: 'Faible',
    garde_fou_6faits_0rx: 'Faible', garde_fou_6faits_1rx: 'Faible',
  }
  for (const c of cas) {
    assert.equal(c.attendu.code2.verdicts.niveau, attendu[c.nom], `${c.nom} — le module`)
  }
})

siPaquet('VECTEURS GOLD — la lettre-équivalente suit le niveau CALCULÉ', (p) => {
  const attendu: Record<string, string> = {
    Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
  }
  for (const cas of p.p2_parfait) {
    const c2 = BRANCHEMENT_EXPRESSION.code2(cas.entree_p2, cas.sortie_code1, ctxDe(cas.params))
    const lettre = BRANCHEMENT_EXPRESSION.lettre(c2, ctxDe(cas.params))
    assert.equal(lettre, attendu[String(c2.verdicts.niveau)], `${cas.nom} — lettre`)
  }
})

siPaquet('LE CONFLIT GOLD ↔ RÈGLE DE COPIE8 EST REPRODUIT, jamais réparé', (p) => {
  // « La règle écrite (moyenne de 3 et 4 arrondie vers le bas) calcule "Bon", le
  //   centre du gold dit "Acquis". Dans la bande admise par l'incertitude
  //   déclarée, donc NON BLOQUANT — mais l'arbitrage revient à Louis. »
  //
  // ⛔ Ce test existe pour qu'aucune session ne « répare » le portage en montant
  //    le grade ou en descendant le gold : les deux côtés doivent dire « Bon ».
  const copie8 = p.p2_parfait.find((c) => c.nom === 'Copie8')
  assert.ok(copie8, 'le vecteur Copie8 a disparu du module')
  const c2 = BRANCHEMENT_EXPRESSION.code2(copie8.entree_p2, copie8.sortie_code1, ctxDe({}))
  assert.equal(c2.verdicts.niveau, 'Bon')
  assert.equal(copie8.gold?.niveau, 'Acquis')
  assert.deepEqual(copie8.gold?.bande, ['Bon', 'Acquis'])
})

siPaquet('LE CRIBLE DE LA RÉUSSITE — retenues et alertes, à l\'identique', (p) => {
  for (const cas of p.crible) {
    const { crible, alertes } = cribleReussites(cas.releve, cas.rejets, cas.grades)
    assert.deepEqual(crible, cas.attendu.crible, `${cas.nom} — crible`)
    assert.deepEqual(alertes, cas.attendu.alertes, `${cas.nom} — alertes`)
  }
})

siPaquet('CHAÎNE COMPLÈTE — `code1`, `code2` et `conformite` reproduisent le module', (p) => {
  for (const cas of p.chaines) {
    const ctx = ctxDe(cas.params, cas.texte)
    const c1 = BRANCHEMENT_EXPRESSION.code1({ p1: cas.releve }, ctx)

    // Le document que le juge lit — c'est LA comparaison qui compte : « un module
    // qui l'omet fait servir null à son juge, et c'est le seul défaut de ce
    // contrat dont rien ne témoigne ».
    assert.deepEqual(c1.document_p2, cas.attendu.code1.document_p2, `${cas.nom} — document_p2`)
    assert.deepEqual(c1.alertes, cas.attendu.code1.alertes, `${cas.nom} — alertes de code1`)

    // `mesures`, moins le canal privé que le portage ajoute pour la télémétrie
    // du §5 — que le module ne porte pas, puisqu'il ne la calcule pas.
    const mesures = { ...c1.mesures }
    delete mesures._pour_telemetrie
    assert.deepEqual(mesures, cas.attendu.code1.mesures, `${cas.nom} — mesures de code1`)

    const c2 = BRANCHEMENT_EXPRESSION.code2(cas.entree_p2, c1, ctx)
    assert.deepEqual(c2.verdicts, cas.attendu.code2.verdicts, `${cas.nom} — verdicts`)
    assert.deepEqual(c2.trace, cas.attendu.code2.trace, `${cas.nom} — trace`)
    assert.deepEqual(c2.alertes, cas.attendu.code2.alertes, `${cas.nom} — alertes de code2`)

    const conf = BRANCHEMENT_EXPRESSION.conformite!({ p1: cas.releve }, cas.entree_p2, c1, c2, ctx)
    assert.deepEqual(conf, cas.attendu.conformite, `${cas.nom} — conformite`)
  }
})

siPaquet('`exception_orthographe` — LE SEUL ENDROIT où la mécanique touche la lettre', (p) => {
  // ⭐ Le module l'a *acté* et le PORTE, mais AUCUN de ses vecteurs ne le
  //    couvre : le harnais le joue des deux côtés, sur la même fonction.
  const off = p.chaines.find((c) => c.nom === 'exception_orthographe_off')
  const on = p.chaines.find((c) => c.nom === 'exception_orthographe_on')
  assert.ok(off && on)
  const docOff = off.attendu.code1.document_p2 as { mesures_calculees: { faits_fluidite: number } }
  const docOn = on.attendu.code1.document_p2 as { mesures_calculees: { faits_fluidite: number } }
  // L'occurrence `accord_brouillant` sort AVANT le comptage et AVANT le document.
  assert.equal(docOff.mesures_calculees.faits_fluidite, 1)
  assert.equal(docOn.mesures_calculees.faits_fluidite, 0)
  // Et le portage le reproduit — c'est l'objet du test ci-dessus, redit ici sur
  // le point précis : le filtre est EN AVAL, jamais dans le prompt.
  const c1 = BRANCHEMENT_EXPRESSION.code1({ p1: on.releve }, ctxDe(on.params, on.texte))
  assert.ok(c1.alertes.some((a) => a.startsWith('exception_orthographe :')))
  assert.ok(c1.alertes.some((a) => a.includes("le prompt, lui, n'a pas bougé")))
})

// ── Ce que le portage ajoute, et que le module ne porte pas ─────────────────

siPaquet('LES NEUF OBSERVABLES DU §5 ont TOUS une valeur, ou une alerte NOMMÉE', (p) => {
  const NEUF = ['taux_sens_passe', 'densite_friction', 'attache_presente', 'densite_generique',
    'mot_impropre', 'savant_plaque', 'repetition_pauvre', 'reussites', 'orthographe']
  for (const cas of p.chaines) {
    const ctx = ctxDe(cas.params, cas.texte)
    const c1 = BRANCHEMENT_EXPRESSION.code1({ p1: cas.releve }, ctx)
    const c2 = BRANCHEMENT_EXPRESSION.code2(cas.entree_p2, c1, ctx)
    const { releve, alertes } = BRANCHEMENT_EXPRESSION.releve(c2, ctx)
    for (const code of NEUF) {
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

siPaquet('`densite_friction` compte l\'INTRA-PHRASE, jamais la monotonie', (p) => {
  // Le §5 : « faits de fluidité INTRA-PHRASE / 100 mots » ; le §3 range
  // `ouverture_monotone` et `moule_repete` dans l'ENTRE-PHRASES. Le module, lui,
  // ne connaît que `densite_fluidite`, qui compte les sept.
  const cas = p.chaines.find((c) => c.nom === 'code1_parfait')!
  const ctx = ctxDe(cas.params, cas.texte)
  const releve = JSON.parse(JSON.stringify(cas.releve)) as Record<string, unknown>
  ;(releve.faits as unknown[]).push({
    type: 'moule_repete',
    citations: [{ phrase: 5, citation: 'Cinquième phrase ici même' }],
  })
  const c1 = BRANCHEMENT_EXPRESSION.code1({ p1: releve }, ctx)
  const c2 = BRANCHEMENT_EXPRESSION.code2(cas.entree_p2, c1, ctx)
  const { releve: tele } = BRANCHEMENT_EXPRESSION.releve(c2, ctx)
  const doc = c1.document_p2 as { mesures_calculees: { densite_fluidite: number } }
  // La monotonie entre BIEN dans la densité de fluidité que P2 lit…
  assert.equal(doc.mesures_calculees.densite_fluidite > 0, true)
  // … et n'entre PAS dans l'observable de friction : `registre_oral` seul reste.
  const sansMonotonie = BRANCHEMENT_EXPRESSION.releve(
    BRANCHEMENT_EXPRESSION.code2(cas.entree_p2,
      BRANCHEMENT_EXPRESSION.code1({ p1: cas.releve }, ctx), ctx), ctx).releve
  assert.equal(tele.densite_friction, sansMonotonie.densite_friction)
})

siPaquet('`attache_presente` rend `n/a` quand il n\'y a AUCUNE attache à mesurer', (p) => {
  // Une phrase par paragraphe : le dénominateur est vide. Le module rend 0 % par
  // son `max(1, …)` d'affichage ; l'observable, lui, doit DIRE « pas d'occasion »
  // — rendre 1,0 déclarerait une réussite là où rien n'a été mesuré.
  const ctx = ctxDe({}, 'Une phrase seule.\n\nUne autre phrase seule.')
  const c1 = BRANCHEMENT_EXPRESSION.code1({ p1: {
    faits: [], phrases_a_reconstruire: [], phrases_perdues: [],
    phrases_sans_attache: [], reussites: [],
  } }, ctx)
  const c2 = BRANCHEMENT_EXPRESSION.code2(
    { grades: { fluidite: 3, precision: 3 }, etiquettes_rejetees: [] }, c1, ctx)
  const { releve, alertes } = BRANCHEMENT_EXPRESSION.releve(c2, ctx)
  assert.equal('attache_presente' in releve, false)
  assert.ok(alertes.some((a) => a.startsWith('attache_presente :') && a.includes('jamais 1')))
  assert.ok(p.module.competence === 'expression')
})

siPaquet('`orthographe` : une valeur ILLISIBLE rend une alerte, jamais un repli', (p) => {
  const ctx = ctxDe({}, 'Une phrase. Une autre.')
  const c1 = BRANCHEMENT_EXPRESSION.code1({ p1: {
    faits: [], phrases_a_reconstruire: [], phrases_perdues: [],
    phrases_sans_attache: [], reussites: [],
    orthographe: { total: 'beaucoup', citations: [{ phrase: 1, citation: 'x' }] },
  } }, ctx)
  const c2 = BRANCHEMENT_EXPRESSION.code2(
    { grades: { fluidite: 3, precision: 3 }, etiquettes_rejetees: [] }, c1, ctx)
  const { releve, alertes } = BRANCHEMENT_EXPRESSION.releve(c2, ctx)
  assert.equal('orthographe' in releve, false)
  assert.ok(alertes.some((a) => a.startsWith('orthographe :') && a.includes('total illisible')))
  assert.ok(p.module.params.includes('exception_orthographe'))
})

// ── Le pré-relevé, et les numéros de phrase qui en dépendent ────────────────

siPaquet('LA COPIE QUE P1 LIT EST RENUMÉROTÉE — sinon tout le relevé désigne à côté', (p) => {
  const cas = p.chaines.find((c) => c.nom === 'code1_parfait')!
  const { lignes, meta } = preReleve(cas.texte)
  assert.match(lignes, /^\[¶1\]\n {2}\[1\] Premier paragraphe\./)
  assert.match(lignes, /\[3\] Donc voilà\./)
  assert.equal(meta.nb_phrases, 6)
  assert.equal(meta.nb_paragraphes, 2)
  // C'est ce découpage qui fait que « Donc voilà. » est la phrase 3 — le relevé
  // du vecteur y accroche son `registre_oral`, et l'auto-retrait aussi.
  assert.deepEqual(meta.ouvertures_paragraphes, [1, 3])
})

siPaquet('LES CONNECTEURS D\'ÉCOLE — « Donc » ouvre, « On va donc voir » non', (p) => {
  const cas = p.chaines.find((c) => c.nom === 'code1_parfait')!
  const phrases = new Map<number, string>()
  const { lignes } = preReleve(cas.texte)
  for (const l of lignes.split('\n')) {
    const m = /^ {2}\[(\d+)\] (.*)$/.exec(l)
    if (m) phrases.set(Number(m[1]), m[2])
  }
  const d = connecteursEcole(phrases)
  assert.deepEqual(d.map((x) => x.phrase), [3])
  assert.equal(d[0].connecteur, 'donc')
})
