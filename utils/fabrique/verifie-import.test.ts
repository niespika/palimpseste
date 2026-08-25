/* eslint-disable @typescript-eslint/no-explicit-any -- Les vecteurs sont du JSON MALFORMÉ À DESSEIN — c'est leur raison d'être. */
// ============================================================================
// C4 · L8 — LA PREUVE DU PORT DE L'IMPORT, et la seule.
// ----------------------------------------------------------------------------
// « `generateur/verifie-import.py` les applique — et il ne les confond pas —
//   et son `--autotest` provoque CHAQUE REFUS UN PAR UN : ce que tu construis
//   doit rendre LES MÊMES VERDICTS SUR LES MÊMES VECTEURS » (piège 22 ;
//   `08-` §7.4 ; `generateur/README.md`).
//
// Ces vecteurs sont ceux de l'autotest du script, recopiés SANS ADAPTATION —
// sauf la fixture Descartes, que le test remplace par la référence de référence
// de `verifie-reference.test.ts` : le contrôle d'import ne fait que REJOUER le
// contrôle de la décomposition (refus n° 17, blocage n° 2), déjà éprouvé là.
//
// La doctrine vient de `doctrine.fixture.json`, SORTIE de
// `scripts/derive-doctrine.py --fixture` — les mêmes sources, le même
// assemblage qu'en production. Elle ne s'édite jamais à la main ;
// `--verifie` dit « FIXTURE : DIVERGE » si elle a cessé de venir des sources.
//
// Exécution : `npm test`.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { assemblerDoctrine, type LignesDoctrine } from './doctrine'
import { controleImport, type DejaEnBase } from './verifie-import'

const FIXTURE = path.join(process.cwd(), 'utils', 'fabrique', 'doctrine.fixture.json')
const doctrine = assemblerDoctrine(
  JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as LignesDoctrine)

// ── Le texte et la décomposition de référence ───────────────────────────────
// (les mêmes qu'à `verifie-reference.test.ts` : le contrôle d'import REJOUE
//  celui de la décomposition, il ne le refait pas)
const TEXTE_T = 'Le doute porte sur tout. Rien ne résiste. Mais qui doute existe. '
  + 'Que suis-je donc ? Une chose qui pense.'
const DECO_T = {
  phrases: [
    { n: 1, fonctions: ['explique'], statuts: ['hypothetique'] },
    { n: 2, fonctions: ['defend_these'], statuts: ['hypothetique'] },
    { n: 3, fonctions: ['defend_these'], statuts: ['affirme'] },
    { n: 4, fonctions: ['relance'], statuts: [] },
    { n: 5, fonctions: ['defend_these'], statuts: ['affirme'] },
  ],
  moments: [
    { m: 'M1', de: 1, a: 2, fonction: 'pose', cible: [], statuts: [],
      etiquette: 'le doute porte sur toute chose' },
    { m: 'M2', de: 3, a: 3, fonction: 'refute', cible: ['M1'], statuts: [],
      etiquette: 'celui qui doute ne peut pas ne pas etre' },
    { m: 'M3', de: 4, a: 5, fonction: 'precise', cible: ['M2'], statuts: [],
      etiquette: 'ce que je suis est une chose pensante' },
  ],
  concepts: [{ concept: 'doute', formes: ['doute'] }, { concept: 'penser', formes: ['pense'] }],
  lectures: [
    { n: 2, drapeau: 'dominante', lectures: ['Rien ne résiste au doute.'] },
    { n: 3, drapeau: 'equivalentes', lectures: ['Douter suppose exister.', 'Penser suppose exister.'] },
    { n: 5, drapeau: 'dominante', lectures: ['Je suis une chose qui pense.'] },
  ],
  armature: {
    question_directrice: 'Que reste-t-il de certain quand le doute a tout emporté ?',
    these: "Le doute lui-même atteste l'existence de celui qui doute.",
    these_phrases: [3, 5],
  },
  hesitation: [],
}

/** La banque minimale et conforme — le pendant de `_fixture(racine)`. */
const banque = () => JSON.parse(JSON.stringify({
  format: 'palimpseste/import-exercices', version: '1.2',
  genere_le: '2026-08-18', genere_par: 'autotest',
  textes: [{
    id: 'txt-descartes', auteur: 'Descartes', titre: 'Méditations métaphysiques',
    reference: 'II', contenu: TEXTE_T, decomposition: DECO_T, validee: true,
  }],
  sujets: [{ id: 'suj-doute', enonce: 'Peut-on douter de tout ?',
    forme: 'dissertation_tc', notions: ['la vérité'] }],
  materiaux: [
    { id: 'mat-a', objet: 'argument', support: 'extrait',
      contenu: 'Un argument fabriqué, premier cas.',
      observable: { code: 'garant_present', competence: 'argumentation' },
      defaut: 'le garant manque', version_corrigee: '…',
      mode: 'composer', famille: 'le garant manque' },
    { id: 'mat-b', objet: 'argument', support: 'extrait',
      contenu: 'Un argument fabriqué, second cas.',
      observable: { code: 'garant_present', competence: 'argumentation' },
      defaut: 'le garant manque', version_corrigee: '…',
      mode: 'composer', famille: 'le garant manque' },
  ],
  exercices: [{
    id: 'ex-a', objet: 'argument', cran: 4, genre: null, lieu: 'maison',
    modes: { argumentation: 'composer', expression: 'composer' },
    observable_isole: { code: 'garant_present', competence: 'argumentation' },
    materiau_source: { provenance: 'sujet', support: null, sujet: 'suj-doute' },
    materiau_cible: { provenance: 'genere', support: 'extrait' },
    guide: null, bonus: false,
    cas: [
      { consigne: 'Ici la raison manque. Dis où.', materiau: 'mat-a',
        defaut: 'le garant manque', distracteurs: null,
        reponse_attendue: 'le lien entre la preuve et la conclusion' },
      { consigne: 'Même famille, sans indication.', materiau: 'mat-b',
        defaut: 'le garant manque', distracteurs: null,
        reponse_attendue: 'le lien, encore' },
    ],
  }],
}))

type B = Record<string, any>
const casse = (f: (b: B) => void): B => { const b = banque(); f(b); return b }
const codes = (xs: string[]) => new Set(xs.map((x) => x.split(']')[0].replace('[', '')))
const aRefus = (v: { refus: string[] }, n: number) =>
  codes(v.refus).has(`R${String(n).padStart(2, '0')}`)
const aBlocage = (v: { blocages: string[] }, n: number) => codes(v.blocages).has(`B${n}`)
const contient = (xs: string[], f: string) => xs.some((x) => x.includes(f))

// ── La doctrine dérivée est bien celle des sources ──────────────────────────
test('la doctrine dérivée porte les treize objets, les neuf crans et ses routes', () => {
  assert.equal(Object.keys(doctrine.objets).length, 13)
  assert.equal(Object.keys(doctrine.crans).length, 9)
  assert.equal(Object.keys(doctrine.modesAdmis).length, 6)
  assert.equal(Object.keys(doctrine.routes).length, 46, '46 couples (objet × mode) ouverts')
  assert.deepEqual(doctrine.formesDemonstration,
    { exemple: 'micro', modelage: 'meso', checklist: 'macro' })
})

// ── La banque conforme passe ────────────────────────────────────────────────
test('la banque conforme : ni refus, ni blocage', () => {
  const v = controleImport(banque(), doctrine)
  assert.deepEqual(v.refus, [], 'refus inattendus')
  assert.deepEqual(v.blocages, [], 'blocages inattendus')
  assert.equal(v.code, 0)
})

// ── Les dix-huit refus, chacun provoqué ─────────────────────────────────────
const REFUS: Array<[string, (b: B) => void, number]> = [
  ['R01 format', (b) => { b.format = 'autre chose' }, 1],
  ['R01 version', (b) => { b.version = '9.0' }, 1],
  ['R02 clé inconnue', (b) => { b.exercices[0].credence_cible = 0.7 }, 2],
  ['R03 id absent', (b) => { delete b.exercices[0].id }, 3],
  ['R03 id double', (b) => { b.materiaux.push({ ...b.materiaux[0] }) }, 3],
  ['R04 renvoi mort', (b) => { b.exercices[0].cas[0].materiau = 'mat-zz' }, 4],
  ['R05 objet inconnu', (b) => { b.exercices[0].objet = 'le_truc' }, 5],
  ['R05 cran hors bornes', (b) => { b.exercices[0].cran = 12 }, 5],
  ['R07 genre sur objet non terminal', (b) => { b.exercices[0].genre = 'dissertation_tc' }, 7],
  ['R07 terminal sans genre', (b) => {
    Object.assign(b.exercices[0], {
      objet: 'introduction', genre: null,
      modes: { structure: 'composer', expression: 'composer' },
      observable_isole: null, cran: 8, materiau_cible: null,
      cas: [{ consigne: "Écris l'introduction.", materiau: null, defaut: null,
        distracteurs: null, reponse_attendue: null }],
    })
  }, 7],
  ['R08 explication sans texte', (b) => {
    Object.assign(b.exercices[0], {
      objet: 'introduction', genre: 'explication_texte_tc', cran: 8,
      modes: { structure: 'composer', expression: 'composer' },
      observable_isole: null, materiau_cible: null,
      cas: [{ consigne: "Écris l'introduction.", materiau: null, defaut: null,
        distracteurs: null, reponse_attendue: null }],
    })
  }, 8],
  ['R09 compétence hors competences[]', (b) => { b.exercices[0].modes.synthese = 'restituer' }, 9],
  ['R09 mode non admis', (b) => { b.exercices[0].modes.expression = 'expliquer' }, 9],
  ['R10 règle 3', (b) => { b.exercices[0].modes = { argumentation: 'expliquer' } }, 10],
  ['R10 règle 4', (b) => {
    b.exercices[0].materiau_source = {
      provenance: 'texte_auteur', support: 'extrait', texte: 'txt-descartes',
      localisation: [0, 40], englobant: [0, 100] }
    b.exercices[0].modes = { argumentation: 'composer' }
  }, 10],
  ["R11 cible nulle où le cran l'exige", (b) => { b.exercices[0].materiau_cible = null }, 11],
  ['R12 distracteur hors cran', (b) => {
    b.exercices[0].cas[0].distracteurs = [{ texte: 'x', pourquoi_faux: 'y' }]
  }, 12],
  ['R12 guide hors cran', (b) => { b.exercices[0].guide = 'un guide' }, 12],
  ["R13 sous le PLANCHER — deux distracteurs, l'instance en tire trois", (b) => {
    b.exercices[0].cran = 1
    for (const cs of b.exercices[0].cas) {
      cs.distracteurs = [0, 1].map((i) => ({ texte: `c${i}`, pourquoi_faux: 'r' }))
    }
  }, 13],
  // ⭐ C4-L14 — LE FORMAT 1.2. « Le n° 12 est UN SEUL refus, celui de l'appui
  //    qui ne suit pas le cran » : le `pourquoi_juste` y entre comme quatrième
  //    cas, jamais comme dix-neuvième refus.
  ['R12 un `pourquoi_juste` hors des crans 1 et 3', (b) => {
    b.exercices[0].cas[0].pourquoi_juste = "il n'a rien à faire ici"
  }, 12],
  ['R05 un `cours` mal formé', (b) => { b.sujets[0].cours = ['c-0012', 7] }, 5],
  ["R05 un `cours` qui n'est pas la chaîne réservée", (b) => { b.textes[0].cours = 'toujours' }, 5],
  // ⭐⭐ C4-L16 — LE FORMAT 1.3. Ce vecteur est LA MOITIÉ DE LA PREUVE du
  //   quatrième état : sans lui, un port qui accepterait N'IMPORTE QUELLE chaîne
  //   passerait « l'état bien formé » et « notions sans notions » sans rien
  //   contrôler. `"notion"`, au SINGULIER — « une autre chaîne réservée n'existe
  //   pas ».
  ["R05 C4-L16 — une autre chaîne réservée n'existe pas", (b) => { b.sujets[0].cours = 'notion' }, 5],
  ['R05 une semaine de plan de lecture SANS son livre', (b) => { b.textes[0].plan_de_lecture = 7 }, 5],
  ["R05 un plan de lecture dont la semaine n'est pas un ordinal", (b) => {
    b.textes[0].plan_de_lecture = { livre: 'liv-0001', semaine: 'sept' }
  }, 5],
  ['R05 une `forme` de démonstration hors de la liste', (b) => {
    b.demonstrations = [demo({ forme: 'video' })]
  }, 5],
  ['R05 un `corps` qui ne va pas avec la `forme`', (b) => {
    b.demonstrations = [demo({ corps: { points: ['a'] } })]
  }, 5],
  ['R03 une démonstration sans thème', (b) => { b.demonstrations = [demo({ theme: '  ' })] }, 3],
  ['R01 un majeur inconnu refuse le fichier entier', (b) => { b.version = '2.0' }, 1],
  ['R14 un seul cas au diagnostic', (b) => { b.exercices[0].cas = b.exercices[0].cas.slice(0, 1) }, 14],
  ['R14 deux fois le même matériau', (b) => { b.exercices[0].cas[1].materiau = 'mat-a' }, 14],
  ['R15 observable absent', (b) => { b.exercices[0].observable_isole = null }, 15],
  ['R15 observable non routé', (b) => {
    b.exercices[0].observable_isole = { code: 'densite_generique', competence: 'argumentation' }
  }, 15],
  ['R16 intervalle hors bornes', (b) => {
    b.exercices[0].materiau_source = {
      provenance: 'texte_auteur', support: 'extrait', texte: 'txt-descartes',
      localisation: [0, 999999], englobant: [0, 100] }
    b.exercices[0].modes = { expression: 'composer' }
  }, 16],
  ['R17 décomposition refusée', (b) => { b.textes[0].decomposition.phrases.pop() }, 17],
  ['R18 support hors plage', (b) => {
    b.exercices[0].materiau_source = {
      provenance: 'texte_auteur', support: 'mot', texte: 'txt-descartes',
      localisation: [0, 10], englobant: [0, 100] }
    b.exercices[0].modes = { expression: 'composer' }
  }, 18],
]

/**
 * ⭐ C4-L14 — UN CRAN 1 COMPLET, au sens du format 1.2 : douze candidats
 * MOTIVÉS (chacun son `pourquoi_faux`) et un `pourquoi_juste` par cas. C'est le
 * vecteur dont les deux suivants sont les dégradations — et c'est lui qui prouve
 * que le port ne signale rien quand tout est là.
 */
function cran1Complet(b: B) {
  const e = b.exercices[0]
  e.cran = 1
  for (const cs of e.cas) {
    cs.distracteurs = Array.from({ length: 12 },
      (_, i) => ({ texte: `c${i}`, pourquoi_faux: `r${i}` }))
    cs.pourquoi_juste = "parce qu'elle seule tient sur ce matériau"
  }
}

function demo(kw: Record<string, unknown> = {}) {
  return {
    id: 'dem-0001', competence: 'argumentation', grain: 'micro',
    theme: 'le hasard', forme: 'exemple',
    corps: { texte: 'Un argument tenu de bout en bout.' },
    ...kw,
  }
}

for (const [nom, f, n] of REFUS) {
  test(`IMPORT REFUS — ${nom}`, () => {
    const v = controleImport(casse(f), doctrine)
    assert.ok(aRefus(v, n),
      `R${n} attendu — rendus : ${JSON.stringify([...codes(v.refus)])} / ${JSON.stringify(v.refus.slice(0, 2))}`)
    assert.equal(v.code, 1)
  })
}

// ── Les vecteurs qui doivent PASSER ─────────────────────────────────────────
const PASSENT: Array<[string, (b: B) => void]> = [
  ['le rattachement au cours, bien formé', (b) => {
    b.sujets[0].cours = 'generique'; b.textes[0].cours = ['c-0012', 'c-0031']
  }],
  // ⭐ C4-L16 — LE QUATRIÈME ÉTAT, BIEN FORMÉ. Recopié SANS ADAPTATION de
  //   l'autotest du script (commit `87072d6`, 24/08).
  ["C4-L16 — l'état « notions » du format 1.3 est bien formé", (b) => {
    b.sujets[0].cours = 'notions'; b.sujets[0].notions = ['la vérité']
    b.textes[0].cours = 'generique'
  }],
  ['le plan de lecture, bien formé', (b) => {
    b.textes[0].plan_de_lecture = { livre: 'liv-0001', semaine: 7 }
  }],
  ['une démonstration bien formée', (b) => { b.demonstrations = [demo()] }],
  ['un fichier écrit contre la 1.0 reste importable en 1.1', (b) => { b.version = '1.0' }],
  ['un cran 1 COMPLET — douze candidats motivés, et un `pourquoi_juste`', cran1Complet],
]
for (const [nom, f] of PASSENT) {
  test(`IMPORT PASSE — ${nom}`, () => {
    const v = controleImport(casse(f), doctrine)
    assert.deepEqual(v.refus, [], 'devait passer')
    assert.deepEqual(v.blocages, [], 'devait passer sans blocage')
  })
}

// ── Les trois blocages ──────────────────────────────────────────────────────
test('IMPORT BLOCAGE B1 — référence non validée en SOURCE', () => {
  const v = controleImport(casse((b) => {
    b.textes[0].validee = false
    Object.assign(b.exercices[0], {
      materiau_source: { provenance: 'texte_auteur', support: 'extrait',
        texte: 'txt-descartes', localisation: [0, 40], englobant: [0, 100] },
      modes: { expression: 'composer' },
    })
  }), doctrine)
  assert.ok(aBlocage(v, 1), `B1 attendu — rendus : ${JSON.stringify(v.blocages)}`)
  assert.deepEqual(v.refus, [], 'devait BLOQUER, a REFUSÉ')
})

test('IMPORT BLOCAGE B1 — référence non validée EN CIBLE', () => {
  // « Réécris cette phrase de Descartes en langage clair » met le texte
  // d'auteur en CIBLE : une cible non validée bloque de la même façon.
  const v = controleImport(casse((b) => {
    b.textes[0].validee = false
    Object.assign(b.exercices[0], {
      cran: 5,
      materiau_source: { provenance: 'sujet', support: null, sujet: 'suj-doute' },
      materiau_cible: { provenance: 'texte_auteur', support: 'extrait',
        texte: 'txt-descartes', localisation: [0, 40], englobant: [0, 100] },
      cas: [{ consigne: 'Réécris ce passage sans le défaut.',
        defaut: 'le garant manque', distracteurs: null,
        reponse_attendue: 'le lien entre la preuve et la conclusion' }],
    })
  }), doctrine)
  assert.ok(aBlocage(v, 1), `B1 attendu — rendus : ${JSON.stringify(v.blocages)}`)
  assert.deepEqual(v.refus, [], 'devait BLOQUER, a REFUSÉ')
})

test('IMPORT BLOCAGE B2 — décomposition bloquée : le texte entre, validee forcée', () => {
  const v = controleImport(casse((b) => {
    // Un moment relationnel sans cible : le professeur tranche.
    b.textes[0].decomposition.moments[1].cible = []
  }), doctrine)
  assert.ok(aBlocage(v, 2), `B2 attendu — rendus : ${JSON.stringify(v.blocages)}`)
  assert.deepEqual(v.refus, [], 'devait BLOQUER, a REFUSÉ')
})

// ── Les signalements, qui n'arrêtent rien ───────────────────────────────────
const SIGNALEMENTS: Array<[string, (b: B) => void, string]> = [
  ['S1 sous la CIBLE — neuf distracteurs : le tirage reste possible', (b) => {
    b.exercices[0].cran = 1
    for (const cs of b.exercices[0].cas) {
      cs.distracteurs = Array.from({ length: 9 }, (_, i) => ({ texte: `c${i}`, pourquoi_faux: 'r' }))
    }
  }, '10 à 15'],
  ['S9 des entrées sans rattachement au cours — UNE ligne agrégée', () => {},
    'sans rattachement au cours'],
  ['S8 une checklist au grain micro — signalée, pas refusée', (b) => {
    b.demonstrations = [demo({ forme: 'checklist', grain: 'micro',
      corps: { points: ['poser le problème'] } })]
  }, "le `06-` §2 l'attend"],
  ['S4 un `lieu` `classe` à l\'import', (b) => { b.exercices[0].lieu = 'classe' },
    'la passation en classe se pose par le professeur'],
  ['S6 un `bonus` à `true` à l\'import', (b) => { b.exercices[0].bonus = true },
    'décision du routeur'],
  // ⭐ C4-L14 — LES DEUX SIGNALEMENTS DU FORMAT 1.2. Aucun des deux ne refuse :
  //    « une mineure n'ajoute que des champs FACULTATIFS » (`08-` §1), et un
  //    fichier de la 1.1 doit rester importable.
  ['S10 un cran 1 sans `pourquoi_juste` — la correction sera muette', (b) => {
    cran1Complet(b)
    for (const cs of b.exercices[0].cas) cs.pourquoi_juste = null
  }, 'aucun `pourquoi_juste`'],
  ['S11 deux distracteurs muets — UNE ligne, agrégée', (b) => {
    cran1Complet(b)
    for (const cs of b.exercices[0].cas) {
      cs.distracteurs[3].pourquoi_faux = ''
      cs.distracteurs[7].pourquoi_faux = '   '
    }
  }, '2 distracteur(s) sans'],
  // ⭐⭐ C4-L16 — LES DEUX SIGNALEMENTS DU FORMAT 1.3, recopiés SANS ADAPTATION
  //   des commits `87072d6` et `fd557a7` (24/08). Aucun des deux ne refuse : « il
  //   se SIGNALE, il ne se refuse pas ».
  //   ⚠️ ILS S'AJOUTENT À L'AGRÉGÉ « S9 », ils ne le remplacent pas : un sujet en
  //   `"notions"` A un `cours`, il n'entre pas dans ce compte-là.
  ['C4-L16 — « notions » sans notions ne sera JAMAIS servi, et on le dit', (b) => {
    b.sujets[0].cours = 'notions'; b.sujets[0].notions = []
    b.textes[0].cours = 'generique'
  }, 'il ne sera jamais servable'],
  ['C4-L16 — une notion hors du programme ne se rattachera à aucun cours', (b) => {
    b.sujets[0].forme = 'dissertation_tc'; b.sujets[0].notions = ['la connaissance']
  }, "n'est pas une notion du programme"],
]
for (const [nom, f, motif] of SIGNALEMENTS) {
  test(`IMPORT SIGNALEMENT — ${nom}`, () => {
    const v = controleImport(casse(f), doctrine)
    assert.ok(contient(v.signalements, motif),
      `aucun signalement ne dit « ${motif} » — rendus : ${JSON.stringify(v.signalements)}`)
    assert.deepEqual(v.refus, [], "un signalement n'arrête rien")
  })
}

// Les pendants NÉGATIFS : sans eux, un contrôle qui signalerait tout le temps
// passerait les tests d'à côté.
test('IMPORT — et il ne signale ni candidat muet ni pourquoi manquant', () => {
  // ⭐ C4-L14 — LE PENDANT NÉGATIF DES DEUX SIGNALEMENTS DU FORMAT 1.2, sur le
  //    MÊME vecteur que le « cran 1 complet » qui passe : un port qui signalerait
  //    toujours passerait S10 et S11 sans rien contrôler.
  const v = controleImport(casse(cran1Complet), doctrine)
  assert.ok(!contient(v.signalements, 'pourquoi'),
    `rien ne devait parler de « pourquoi » — rendus : ${JSON.stringify(v.signalements)}`)
})

test('IMPORT — rien n\'est signalé quand tout est rattaché', () => {
  const v = controleImport(casse((b) => {
    b.sujets[0].cours = 'generique'; b.textes[0].cours = 'generique'
  }), doctrine)
  assert.ok(!contient(v.signalements, 'sans rattachement au cours'))
})

test('IMPORT — la même checklist au grain macro ne signale rien', () => {
  const v = controleImport(casse((b) => {
    b.demonstrations = [demo({ forme: 'checklist', grain: 'macro',
      corps: { points: ['poser le problème'] } })]
  }), doctrine)
  assert.ok(!contient(v.signalements, "le `06-` §2 l'attend"))
})

// ════════════════════════════════════════════════════════════════════════════
// ⭐ C4-L16 — LE FORMAT 1.3 : LES PENDANTS NÉGATIFS, ET L'ÉCART ÉPINGLÉ
// ════════════════════════════════════════════════════════════════════════════

// ⭐⭐ LE PENDANT NÉGATIF DU SIGNALEMENT « HORS PROGRAMME », recopié sans
//   adaptation (commit `fd557a7`). Sans lui, un port qui signalerait TOUJOURS
//   passerait le vecteur positif sans rien contrôler.
//   ⚠️ Un sujet HLP n'est PAS regardé : son programme est en THÈMES de semestre,
//   que rien ne déclare aujourd'hui. Le parcours « se lit dans le nom » (`08-`
//   §3) : `_hlp`.
test("IMPORT — C4-L16 : et un sujet HLP n'est pas regardé — son programme est en thèmes", () => {
  const v = controleImport(casse((b) => {
    b.sujets[0].forme = 'essai_hlp'; b.sujets[0].notions = ['la parole']
  }), doctrine)
  assert.ok(!contient(v.signalements, "n'est pas une notion du programme"),
    `rien ne devait parler du programme — rendus : ${JSON.stringify(v.signalements)}`)
})

// ⭐ LE PENDANT NÉGATIF DE « notions SANS notions » : un sujet en `"notions"` QUI
//   EN DÉCLARE ne se signale pas, et il n'entre pas non plus dans l'agrégé S9 —
//   « il A un `cours` », et c'est juste.
test('IMPORT — C4-L16 : un « notions » qui déclare ses notions ne signale RIEN', () => {
  const v = controleImport(casse((b) => {
    b.sujets[0].cours = 'notions'; b.sujets[0].notions = ['la vérité']
    b.textes[0].cours = 'generique'
  }), doctrine)
  assert.ok(!contient(v.signalements, 'il ne sera jamais servable'),
    `rendus : ${JSON.stringify(v.signalements)}`)
  assert.ok(!contient(v.signalements, 'sans rattachement au cours'),
    'un sujet en « notions » A un `cours` : il n’entre pas dans l’agrégé')
  assert.deepEqual(v.refus, [], "un signalement n'arrête rien")
})

// ════════════════════════════════════════════════════════════════════════════
// ⛔⛔ L'ÉCART ASSUMÉ AVEC LE SCRIPT — LE SEUL, ET IL EST ÉPINGLÉ ICI
// ════════════════════════════════════════════════════════════════════════════
// `notions` SUR `textes[]` : LA SOURCE LE DÉCLARE, ET LE SCRIPT LE REFUSE.
//   · Le `08-` §2, **VALIDÉ ET GELÉ**, porte la ligne : « `notions` — les
//     notions du programme que ce texte met en jeu, MÊME CHAMP, MÊME FORME ET
//     MÊME RÔLE QU'AU §3 », et le `07-` §2 demande explicitement de le porter.
//   · `CLES["texte"]` de `generateur/verifie-import.py` ne le contient PAS —
//     vérifié EN LE JOUANT : un texte qui le porte sort en
//     `✗ [R02] clé « notions » que le 08- ne déclare pas`.
//   ⭐ Et **le même script LIT `texte.notions` vingt lignes plus loin**, dans son
//     propre signalement (`for nom, liste in (("sujet", sujets), ("texte",
//     textes))`) : **le champ était voulu, seule la déclaration manque.**
//   ⛔ On ne modifie pas le script — c'est une pièce du manifeste. La source
//     gelée fait foi, **ce port ACCEPTE**, et l'écart est rapporté (relevé) et
//     porté au registre des dettes (D7), jamais recopié.
// ⚠️ CE TEST EST LÀ POUR QU'UN JOUR ON SACHE QUE C'ÉTAIT UN CHOIX. Si le script
//   est corrigé et que les deux se rejoignent, il continue de passer ; s'il
//   tombe, c'est que quelqu'un a réaligné le port sur le script — et il devra
//   lire ce commentaire avant de le faire.
test("IMPORT — C4-L16 : `notions` sur un TEXTE passe ici, quand le script le REFUSE (écart assumé)", () => {
  const v = controleImport(casse((b) => {
    b.textes[0].cours = 'notions'; b.textes[0].notions = ['la vérité']
    b.sujets[0].cours = 'generique'
  }), doctrine)
  assert.deepEqual(v.refus, [],
    'le `08-` §2 déclare `notions` sur textes[] : ce port ne doit PAS refuser')
  assert.ok(!contient(v.signalements, 'il ne sera jamais servable'),
    'le texte déclare bien une notion')
})

test('IMPORT — C4-L16 : et un TEXTE en « notions » sans notions se signale, comme un sujet', () => {
  // ⭐ Le signalement (a) porte sur les DEUX banques, exactement comme au script.
  const v = controleImport(casse((b) => {
    b.textes[0].cours = 'notions'; b.textes[0].notions = []
    b.sujets[0].cours = 'generique'
  }), doctrine)
  assert.ok(contient(v.signalements, 'il ne sera jamais servable'),
    `rendus : ${JSON.stringify(v.signalements)}`)
  assert.deepEqual(v.refus, [], "un signalement n'arrête rien")
})

// ── ⭐ C4-L15 — LA LONGUEUR DU MATÉRIAU SUIT LE CRAN (`02-` §2.3.3) ─────────
// LES QUATRE VECTEURS DU CONTRÔLE DE LONGUEUR, RECOPIÉS SANS ADAPTATION du
// bloc « la longueur du matériau suit le cran » de l'autotest de
// `generateur/verifie-import.py` (commit `d6a31f8`, 24/08) : « ce que tu
// construis doit rendre LES MÊMES VERDICTS SUR LES MÊMES VECTEURS ».
//
// ⭐⭐ LES DEUX PENDANTS NÉGATIFS SONT LA MOITIÉ DE LA PREUVE : sans eux, un
//    contrôle qui signalerait TOUJOURS passerait le premier vecteur.
//
// La fixture porte `mat-a` et `mat-b` dans la MÊME famille (« le garant
// manque ») et de longueur voisine ; allonger `mat-a` en fait le plus long de
// sa famille, et l'exercice est au cran 4 — qui n'en demande « que le quart ».
const LONG = 'Une phrase. Une deuxième. Une troisième. Une quatrième. '
  + 'Et une cinquième, pour faire bonne mesure.'
const texteLong = (b: B) => { b.materiaux[0].contenu = LONG }

test('IMPORT SIGNALEMENT — le matériau ENTIER servi au cran 4, qui n\'en demande qu\'un quart', () => {
  const v = controleImport(casse(texteLong), doctrine)
  assert.ok(contient(v.signalements, "c'est le matériau ENTIER qui est servi"),
    `aucun signalement — rendus : ${JSON.stringify(v.signalements)}`)
  assert.deepEqual(v.refus, [], "un signalement n'arrête rien")
})

test('IMPORT — le même matériau au cran 9 ne signale RIEN : la source y admet le matériau entier', () => {
  // ⚠️ PENDANT NÉGATIF. Le `02-` §2.3.3 donne « le matériau entier » aux crans
  //    1 et 9 : `_fraction_du_cran` y rend `null`, et le contrôle ne part pas.
  const v = controleImport(casse((b) => {
    texteLong(b); b.exercices[0].cran = 9
  }), doctrine)
  assert.ok(!contient(v.signalements, 'matériau ENTIER qui est servi'),
    `il n'aurait rien dû signaler — rendus : ${JSON.stringify(v.signalements)}`)
})

test('IMPORT — une VERSION COURTE servie au cran 4 ne signale rien : c\'est ce que la source demande', () => {
  // ⚠️ PENDANT NÉGATIF, ET C'EST LUI QUI PROUVE QUE LA MESURE EST RELATIVE :
  //    le long reste en banque, mais le cas sert le COURT de la même famille.
  const v = controleImport(casse((b) => {
    texteLong(b)
    b.materiaux[1].contenu = 'Deux phrases. Rien de plus.'
    b.exercices[0].cas[0].materiau = 'mat-b'
    b.exercices[0].cas[1].materiau = 'mat-a'
  }), doctrine)
  assert.ok(!contient(v.signalements, 'cas 1 : le `02-` §2.3.3'),
    `le cas 1 n'aurait rien dû signaler — rendus : ${JSON.stringify(v.signalements)}`)
})

test('IMPORT — et le signalement ne REFUSE jamais, ni ne change le code de sortie', () => {
  // « `0` = importable (blocages et signalements possibles) » (`08-` §7.4).
  //   Une banque versée ne se bloque pas sur une mesure approchée.
  const v = controleImport(casse(texteLong), doctrine)
  assert.deepEqual(v.refus, [])
  assert.deepEqual(v.blocages, [])
  assert.equal(v.code, 0)
})

// ── Ce que la doctrine commande, et ce qui arrive quand elle se tait ────────

test('LONGUEUR — la doctrine porte SIX longueurs, et les trois crans de production se taisent', () => {
  // ⚠️ Les crans 2, 6 et 8 n'ont pas de `materiau_cible` : rien à mesurer.
  const avec = Object.values(doctrine.crans).filter((c) => c.longueur).map((c) => c.n).sort((a, x) => a - x)
  assert.deepEqual(avec, [1, 3, 4, 5, 7, 9])
  for (const n of [2, 6, 8]) assert.equal(doctrine.crans[n].longueur, null)
  // Et la FRACTION ne mord qu'aux quatre crans qui en demandent une part.
  assert.equal(doctrine.crans[3].longueur, 'le quart')
  assert.equal(doctrine.crans[7].longueur, 'la moitié')
  assert.equal(doctrine.crans[1].longueur, 'le matériau entier')
})

test('⚠️ LONGUEUR — une doctrine SANS la colonne ne signale rien, et ne lève pas', () => {
  // C'est l'état d'une base entre la migration et la re-dérivation. Le contrôle
  // se tait plutôt que de mesurer contre une fraction qu'il n'a pas.
  const brut = JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as LignesDoctrine
  for (const c of brut.exercices_crans) { delete c.marquage; delete c.longueur }
  const sansColonne = assemblerDoctrine(brut)
  const v = controleImport(casse(texteLong), sansColonne)
  assert.ok(!contient(v.signalements, 'matériau ENTIER qui est servi'))
  assert.deepEqual(v.refus, [])
})

// ── Ce que le contrôle hors ligne ne peut pas faire, et que celui-ci fait ────
// « Les renvois se résolvent dans le fichier ET dans ce qui est déjà en base :
//   le contrôle hors ligne ne voit que le fichier ; LE TIEN VOIT LES DEUX »
//   (piège 10).
test('BASE — un matériau d\'un dépôt antérieur résout le renvoi', () => {
  const b = casse((x) => { x.materiaux = [] })   // les matériaux sont partis
  const sans = controleImport(b, doctrine)
  assert.ok(aRefus(sans, 4), 'sans la base, le renvoi est mort')
  const deja: DejaEnBase = { materiaux: new Set(['mat-a', 'mat-b']) }
  const avec = controleImport(b, doctrine, deja)
  assert.ok(!aRefus(avec, 4), `avec la base, il se résout — ${JSON.stringify(avec.refus)}`)
})

test('BASE — un texte déjà en base, sa référence NON validée, bloque encore', () => {
  const b = casse((x) => {
    x.textes = []
    Object.assign(x.exercices[0], {
      materiau_source: { provenance: 'texte_auteur', support: 'extrait',
        texte: 'txt-ancien', localisation: [0, 40], englobant: [0, 100] },
      modes: { expression: 'composer' },
    })
  })
  const deja: DejaEnBase = {
    textes: new Set(['txt-ancien']), textesValides: new Set(),
    longueurTexte: { 'txt-ancien': 500 },
  }
  const v = controleImport(b, doctrine, deja)
  assert.deepEqual(v.refus, [], `ne devait pas refuser — ${JSON.stringify(v.refus)}`)
  assert.ok(aBlocage(v, 1), `B1 attendu — rendus : ${JSON.stringify(v.blocages)}`)
})

// « Une entrée dont l'`id` existe déjà est IGNORÉE — jamais dupliquée, jamais
//   écrasée en silence —, et l'import rend le compte de ce qu'il a ignoré,
//   BANQUE PAR BANQUE » (`08-` §1 ; piège 11).
test('BASE — l\'idempotence : le redépôt rend le compte des entrées ignorées', () => {
  const deja: DejaEnBase = {
    textes: new Set(['txt-descartes']),
    sujets: new Set(['suj-doute']),
    materiaux: new Set(['mat-a']),
    textesValides: new Set(['txt-descartes']),
  }
  const v = controleImport(banque(), doctrine, deja)
  assert.deepEqual(v.refus, [], 'un redépôt ne refuse rien')
  assert.deepEqual(v.ignores.textes, ['txt-descartes'])
  assert.deepEqual(v.ignores.sujets, ['suj-doute'])
  assert.deepEqual(v.ignores.materiaux, ['mat-a'])
  assert.deepEqual(v.ignores.exercices, [], "l'exercice, lui, est neuf")
})

// ── Deux contrôles que les sources ne peuvent pas provoquer aujourd'hui ──────
// Le REFUS n° 6 (« un cran hors des `crans[]` de l'objet ») et le BLOCAGE n° 3
// (« l'observable isolé n'a pas de consigne écrite pour son cran ») n'ont aucun
// vecteur possible : `crans[]` vaut « les neuf » sur les treize objets, et les
// 336 consignes couvrent les 56 observables aux six crans. Le `04-` §0 le dit :
// « ce que le champ change aujourd'hui : RIEN — et c'est le résultat, pas un
// oubli ; il vaut comme GARDE et comme DOMICILE de la première restriction qui
// viendra. » Ces deux sondes perturbent LA DOCTRINE EN MÉMOIRE — jamais la
// source, jamais la base — pour éprouver que la garde existe vraiment.
test('SONDE R06 — un cran retiré des `crans[]` de l\'objet fait refuser', () => {
  const perturbee = assemblerDoctrine(
    JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as LignesDoctrine)
  perturbee.objets.argument.crans.delete(4)
  const v = controleImport(banque(), perturbee)
  assert.ok(aRefus(v, 6), `R06 attendu — rendus : ${JSON.stringify(v.refus)}`)
})

test('SONDE B3 — une route sans consigne écrite pour son cran BLOQUE, sans refuser', () => {
  const perturbee = assemblerDoctrine(
    JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as LignesDoctrine)
  // On retire la consigne du cran 4 du bloc que la route nomme : la route
  // existe, la consigne manque — « le professeur tranche à l'écran ».
  const route = (perturbee.routes['argument|composer'] ?? [])
    .find((r) => r.code === 'garant_present' && r.competence === 'argumentation')
  assert.ok(route, 'la route de référence doit exister')
  delete perturbee.consignesIsolees[`${route!.competence}|${route!.section}`][4]
  const v = controleImport(banque(), perturbee)
  assert.ok(aBlocage(v, 3), `B3 attendu — rendus : ${JSON.stringify(v.blocages)}`)
  assert.deepEqual(v.refus, [], 'devait BLOQUER, a REFUSÉ')
})
