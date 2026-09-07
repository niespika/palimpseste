import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toISODate } from '../calendrier-grille'
import { lundiDuCycle } from './echeance'
import { comptesDeLaSemaine } from '../assiduite/collecte'
import { estFermee, vueFermee, MESSAGE_SEMAINE_FERMEE } from './fermeture'
import type { VueDuDeroule } from './vue'

// ⚠️ Le fuseau de l'école, celui du dépôt (`FUSEAU_DEFAUT`). Les épreuves du
//    dimanche soir n'ont de sens que dans un fuseau NÉGATIF par rapport à UTC.
const FUSEAU = 'America/Toronto'
const DECISION = 'd4c0ffee-0000-4000-8000-000000000001'

// ════════════════════════════════════════════════════════════════════════════
// LE PRÉDICAT — l'existence de la ligne, jamais la date
// ════════════════════════════════════════════════════════════════════════════

test('la ligne du cycle existe et le dépôt vient du routeur → fermé', () => {
  assert.equal(estFermee({
    assigneAt: '2026-08-31T12:00:00+00:00',
    routeurDecisionId: DECISION,
    fuseau: FUSEAU,
    cyclesComptes: new Set(['2026-08-31']),
  }), true)
})

test('un dépôt SANS décision de routeur reste ouvert — même élève, même cycle, ligne posée', () => {
  assert.equal(estFermee({
    assigneAt: '2026-08-31T12:00:00+00:00',
    routeurDecisionId: null,
    fuseau: FUSEAU,
    cyclesComptes: new Set(['2026-08-31']),
  }), false)
})

test('la ligne d’un AUTRE cycle ne ferme rien', () => {
  assert.equal(estFermee({
    assigneAt: '2026-08-31T12:00:00+00:00',
    routeurDecisionId: DECISION,
    fuseau: FUSEAU,
    cyclesComptes: new Set(['2026-08-24']),
  }), false)
})

test('la semaine EN COURS n’a jamais de ligne : elle reste ouverte, sans garde à écrire', () => {
  // Le déclencheur ne compte que la semaine ÉCOULÉE (`07-` §1.5). La clause
  // « un dépôt de la semaine courante reste ouvert » TOMBE du prédicat.
  assert.equal(estFermee({
    assigneAt: '2026-09-07T12:00:00+00:00',
    routeurDecisionId: DECISION,
    fuseau: FUSEAU,
    cyclesComptes: new Set(['2026-08-24', '2026-08-31']),
  }), false)
})

test('une semaine de VACANCES n’a jamais de ligne : son exercice ne se ferme jamais', () => {
  // Trou PERMANENT, et assumé : « les semaines de vacances sortent du
  // dénominateur PAR OMISSION ». ⛔ Le réparer en posant une ligne ferait entrer
  // la semaine au dénominateur, faux pour tout élève, chaque année.
  assert.equal(estFermee({
    assigneAt: '2026-12-21T12:00:00+00:00',
    routeurDecisionId: DECISION,
    fuseau: FUSEAU,
    cyclesComptes: new Set(['2026-12-14', '2027-01-04']),
  }), false)
})

// ── Les deux vides, et ils ne se confondent pas ─────────────────────────────

test('LECTURE EN ERREUR (null) : rien ne ferme — fermer sur une panne priverait un élève', () => {
  assert.equal(estFermee({
    assigneAt: '2026-08-31T12:00:00+00:00',
    routeurDecisionId: DECISION,
    fuseau: FUSEAU,
    cyclesComptes: null,
  }), false)
})

test('ENSEMBLE VIDE : ce n’est PAS une erreur — c’est un élève sans semaine comptée', () => {
  // ⛔⛔ C'est aussi ce que rend une lecture faite avec le MAUVAIS client :
  //    `assiduite_hebdo` n'a aucune policy élève et rend zéro ligne SANS erreur.
  //    Les deux se distinguent par le TYPE, et s'éprouvent séparément — la
  //    couture prouve le bon client en base, ce test prouve la règle.
  assert.equal(estFermee({
    assigneAt: '2026-08-31T12:00:00+00:00',
    routeurDecisionId: DECISION,
    fuseau: FUSEAU,
    cyclesComptes: new Set(),
  }), false)
})

test('un `assigne_at` absent ou illisible ne ferme rien — une semaine devinée serait pire', () => {
  for (const assigneAt of [null, '', 'pas une date']) {
    assert.equal(estFermee({
      assigneAt, routeurDecisionId: DECISION, fuseau: FUSEAU,
      cyclesComptes: new Set(['2026-08-31']),
    }), false, `assigneAt = ${JSON.stringify(assigneAt)}`)
  }
})

// ════════════════════════════════════════════════════════════════════════════
// ⭐ LE CONTRÔLE QUI VAUT TOUS LES AUTRES — ma dérivation EST celle qui compte
// ════════════════════════════════════════════════════════════════════════════

test('le dépôt du DIMANCHE 20 h 30 à l’école : ma fermeture et la COLLECTE tombent sur le même cycle', () => {
  // Dimanche 6 septembre 2026, 20 h 30 à Toronto = lundi 7 septembre 00 h 30 UTC.
  // Lu en UTC, il basculerait d'une semaine — à l'heure exacte à laquelle les
  // élèves déposent.
  const assigneAt = '2026-09-07T00:30:00+00:00'
  const cycleDeLaCollecte = toISODate(lundiDuCycle(new Date(assigneAt), FUSEAU))

  // ① la collecte le range bien sur la semaine du 31/08, pas sur celle du 07/09
  assert.equal(cycleDeLaCollecte, '2026-08-31')
  const tri = comptesDeLaSemaine(
    [{ eleveId: 'e1', assigneAt, statut: 'assigne', bonus: false }],
    '2026-08-31', FUSEAU,
  )
  assert.equal(tri.horsSemaine, 0, 'la collecte doit le compter DANS la semaine du 31/08')

  // ② et ma fermeture ferme sur CE cycle-là, pas sur l'autre
  const q = { assigneAt, routeurDecisionId: DECISION, fuseau: FUSEAU }
  assert.equal(estFermee({ ...q, cyclesComptes: new Set(['2026-08-31']) }), true)
  assert.equal(estFermee({ ...q, cyclesComptes: new Set(['2026-09-07']) }), false)
})

test('un dépôt du routeur est posé à MIDI UTC du lundi servi — le cas nominal de la prod', () => {
  // Mesuré en production le 07/09 : `assigne_at = 2026-08-31T12:00:00+00`.
  const assigneAt = '2026-08-31T12:00:00+00:00'
  assert.equal(toISODate(lundiDuCycle(new Date(assigneAt), FUSEAU)), '2026-08-31')
  assert.equal(estFermee({
    assigneAt, routeurDecisionId: DECISION, fuseau: FUSEAU,
    cyclesComptes: new Set(['2026-08-31']),
  }), true)
})

test('le message est celui de Louis, mot pour mot', () => {
  assert.equal(
    MESSAGE_SEMAINE_FERMEE,
    'Il n’est plus possible de travailler sur les exercices de cette semaine. '
    + 'De nouveaux exercices t’attendent.',
  )
})

// ════════════════════════════════════════════════════════════════════════════
// LA VUE RÉDUITE — et l'épreuve est « aucun secret ne fuit », pas « j'ai vidé »
// ════════════════════════════════════════════════════════════════════════════

/** Les treize champs qui SURVIVENT à la fermeture (mission, effet 2). */
const GARDES = [
  'depotId', 'ouvert', 'fermee', 'titre', 'consigne', 'texteV1', 'texteVf',
  'retourChaud', 'retourFinal', 'contestations', 'regime', 'echeance', 'v1RemiseLe',
] as const

/**
 * ⭐ UNE VUE FARCIE : **chaque** champ porte une chaîne reconnaissable. Le test
 *    ne vérifie pas que j'ai vidé ce que j'ai pensé à vider — il vérifie
 *    qu'AUCUN secret ne se retrouve dans la charge servie. C'est la seule forme
 *    qui attrape un champ oublié, et le 53ᵉ qu'un autre lot ajoutera.
 */
function vueFarcie(): VueDuDeroule {
  const s = (nom: string) => `SECRET_${nom}`
  return {
    depotId: 'GARDE_depotId',
    ouvert: true,
    fermee: false,
    titre: 'GARDE_titre',
    consigne: [{ type: 'texte', texte: 'GARDE_consigne' }] as unknown as VueDuDeroule['consigne'],
    texteV1: 'GARDE_texteV1',
    texteVf: 'GARDE_texteVf',
    retourChaud: { texte: 'GARDE_retourChaud' } as unknown as VueDuDeroule['retourChaud'],
    retourFinal: { texte: 'GARDE_retourFinal' } as unknown as VueDuDeroule['retourFinal'],
    contestations: [{ point: 'GARDE_contestations' }] as unknown as VueDuDeroule['contestations'],
    regime: 'plein',
    echeance: 'GARDE_echeance',
    v1RemiseLe: 'GARDE_v1RemiseLe',

    telemetrie: { v1: { signes_saisis: 4242 } } as unknown as VueDuDeroule['telemetrie'],
    credenceEstLaReponse: true,
    vfRequiseParEscalade: true,
    temps: [s('temps')] as unknown as VueDuDeroule['temps'],
    tempsCourant: s('tempsCourant') as unknown as VueDuDeroule['tempsCourant'],
    grain: s('grain') as unknown as VueDuDeroule['grain'],
    cranCode: s('cranCode'),
    geste: s('geste'),
    estUnePaire: true,
    etapePaire: s('etapePaire') as unknown as VueDuDeroule['etapePaire'],
    rappel: { observables: [s('rappel')], motif: s('rappelMotif'), formulationsManquantes: [s('rappelManq')] } as unknown as VueDuDeroule['rappel'],
    demonstration: { demonstration: s('demonstration'), avertissement: s('demoAvert'), ecartees: [{ id: s('demoEcartee'), motif: s('demoMotif') }] } as unknown as VueDuDeroule['demonstration'],
    demonstrationAvantLaTentative: true,
    contenuDemonstration: { texte: s('contenuDemonstration') } as unknown as VueDuDeroule['contenuDemonstration'],
    guide: s('guide'),
    etalon: { texte: s('etalon'), deplie: true },
    texteSupport: { texte: s('texteSupport') } as unknown as VueDuDeroule['texteSupport'],
    sujet: s('sujet'),
    coTexte: s('coTexte'),
    // ⛔⛔ LES DISTRACTEURS NE SONT PAS UN CHAMP : ils descendent sous le nom
    //    `candidats`, dans l'offre de crédence portée par `cas`.
    cas: [{ materiau: s('casMateriau'), offre: { candidats: [s('candidats')] } }] as unknown as VueDuDeroule['cas'],
    corrections: [{ texte: s('corrections') }] as unknown as VueDuDeroule['corrections'],
    dureeIndicativeMin: 4242,
    microQuestionDue: true,
    motifDepassement: s('motifDepassement'),
    collages: [{ moyen: s('collages') }] as unknown as VueDuDeroule['collages'],
    competencesDeLaConfiance: [s('competencesDeLaConfiance')] as unknown as VueDuDeroule['competencesDeLaConfiance'],
    gestesRestants: [s('gestesRestants')] as unknown as VueDuDeroule['gestesRestants'],
    confianceDeclaree: { c: s('confianceDeclaree') },
    conditionsDeclarees: { c: s('conditionsDeclarees') },
    restitutionAChaud: s('restitutionAChaud'),
    seJuger: { servie: true, motif: s('seJugerMotif'), offre: { q: s('seJugerOffre') } as unknown as VueDuDeroule['seJuger']['offre'] },
    attente: { jobs: [s('attenteJobs')], enCours: true, echecDefinitif: true, message: s('attenteMessage') } as unknown as VueDuDeroule['attente'],
    langue: { phrase: s('languePhrase'), n: 4242, ancrages: [s('langueAncrages')] } as unknown as VueDuDeroule['langue'],
    verdictCalibration: { lignes: [s('verdictLignes')], phrase: s('verdictPhrase') } as unknown as VueDuDeroule['verdictCalibration'],
    echeanceVf: { quand: s('echeanceVfQuand'), rognee: true, motif: s('echeanceVfMotif') },
    signalement: { ouvert: true, mien: { motif: s('signalement') } as unknown as VueDuDeroule['signalement']['mien'] },
    gabarit: { actif: true, exercice15: true, variante: 'a', sansDocuments: true },
    fiche: { libelle: s('ficheLibelle'), definition: s('ficheDefinition'), constituants: [{ n: 1, nom: s('ficheConstituant'), facultatif: false, question: s('ficheQuestion') }], test: s('ficheTest'), ditALEleve: s('ficheDit'), exemplaire: s('ficheExemplaire'), contreExemple: s('ficheContreExemple'), methode: true },
    fin: s('fin') as unknown as VueDuDeroule['fin'],
    avertissements: [s('avertissements')],
  }
}

test('la vue fermée ne laisse fuir AUCUN secret — la liste blanche tient, champ par champ', () => {
  const reduite = vueFermee(vueFarcie())
  const charge = JSON.stringify(reduite)
  const fuites = [...charge.matchAll(/SECRET_[A-Za-z]+/g)].map((m) => m[0])
  assert.deepEqual([...new Set(fuites)], [],
    `des champs sont partis dans la charge servie : ${[...new Set(fuites)].join(', ')}`)
  // ⛔ Et nommément les quatre que le « fait quand » exige absents, pas masqués.
  assert.equal(reduite.texteSupport, null, 'matériau')
  assert.deepEqual(reduite.cas, [], 'candidats / distracteurs / zones')
  assert.equal(reduite.sujet, null, 'sujet')
  assert.equal(reduite.etalon, null, 'réponse attendue')
  assert.equal(reduite.fiche, null, 'problème et constituants du gabarit')
})

test('la vue fermée GARDE les treize champs, à l’identique', () => {
  const pleine = vueFarcie()
  const reduite = vueFermee(pleine)
  for (const cle of GARDES) {
    if (cle === 'fermee') continue
    assert.deepEqual(reduite[cle], pleine[cle], `le champ ${cle} devait survivre`)
  }
  assert.equal(reduite.fermee, true, '`fermee` doit être vrai dans une vue fermée')
})

test('⛔⛔ `regime` SURVIT — sans lui la lecture cesse de clore, et le bilan ne s’ouvre jamais', () => {
  // `actionValiderLaLecture` charge la vue puis lit `vue.regime` pour décider si
  // la lecture pose `statut = 'clos'`. Vidé, le dépôt resterait `retour_publie`
  // pour toujours et la ligne `a_lire` pour toujours.
  for (const regime of ['plein', 'par_paires', 'sans_vf'] as const) {
    assert.equal(vueFermee({ ...vueFarcie(), regime }).regime, regime)
  }
})

test('`ouvert` n’est PAS la fermeture : il porte `exercices_actif`, et il passe intact', () => {
  assert.equal(vueFermee({ ...vueFarcie(), ouvert: false }).ouvert, false)
  assert.equal(vueFermee({ ...vueFarcie(), ouvert: true }).ouvert, true)
})

test('la vue fermée porte EXACTEMENT les mêmes clés que la vue pleine — aucune n’a disparu', () => {
  // ⚠️ Un champ SUPPRIMÉ de la charge ferait tomber l'écran ailleurs ; la
  //    réduction VIDE, elle n'ampute pas la forme.
  const pleine = vueFarcie()
  assert.deepEqual(
    Object.keys(vueFermee(pleine)).sort(),
    Object.keys(pleine).sort(),
  )
})
