// LA CLAUSE GRANULAIRE, éprouvée. « Une compétence dont la fiche n'a pas passé
// sa porte reste HORS DE LA CHAÎNE — pas d'instrument dérivé, pas de mesure. »
//
// ⭐ AMENDÉ PAR C4-L10 (22/08/2026). Ce fichier assertait « AUCUNE des six
//    compétences n'entre dans la chaîne », et c'était l'état du jour de C4-L5 :
//    le seuil de la dérivation valait *versé et bancé*, qu'aucune fiche ne
//    porte. Le seuil est descendu à *relu et validé* — un alignement sur le
//    `03-` §9 et le `01-` §3, qui confient les conditions de banc AU PROFESSEUR
//    —, et l'Expression est branchée. Le test dit donc désormais LA RÈGLE, et
//    non plus un compte : ce qui est ouvert est ce qui est dérivé ET branché,
//    ce qui ne l'est pas DIT POURQUOI, et rien ne se contredit.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import {
  CALAME, MANIFESTE_LU, MONITORING, competencesEnAttenteDeBranchement, competencesOuvertes,
  etatCompetence, modeNonCouvert, valeursDesParametres, verifierCoherence,
} from './instruments'
import { COMPETENCES, MODES } from './types'

test('l\'instrument dérivé et son branchement sont COHÉRENTS', () => {
  assert.deepEqual(verifierCoherence(), [])
})

test('LES SIX COMPÉTENCES SONT OUVERTES — dérivées ET branchées (C4-L10)', () => {
  // ⭐ L'Expression le 22/08 ; l'Argumentation, la Structure, la Connaissance,
  //    le Questionnement puis LA SYNTHÈSE le 23/08. « Une compétence de plus est
  //    une compétence de plus à la rentrée, pas un lot de plus » — et il n'en
  //    reste plus. ⚠️ L'ordre est celui de `COMPETENCES` (`07-` §1.2), pas celui
  //    des branchements : `competencesOuvertes()` filtre la liste des six.
  assert.deepEqual(competencesOuvertes(), [...COMPETENCES])
  for (const c of COMPETENCES) {
    const e = etatCompetence(c)
    assert.equal(e.ouverte, true, c)
    assert.equal(e.motif, null, c)
    assert.equal(e.instrument?.competence, c)
    assert.ok(e.branchement, c)
  }
})

test('AUCUNE N\'ATTEND PLUS SON BRANCHEMENT — C4-L10 est joué pour les six', () => {
  // ⚠️ Dérivée n'est pas branchée, et c'était un état NORMAL tant que C4-L10 se
  //    rejouait une compétence à la fois. La liste est désormais VIDE, et c'est
  //    ce qui se contrôle : une reprise qui importerait un instrument sans son
  //    branchement la ferait repousser, et la compétence serait silencieusement
  //    muette.
  // ⭐ Le blocage nommé de la Synthèse — son `code1` ne rendait pas
  //    `document_p2`, « le seul défaut de ce contrat dont rien ne témoigne »
  //    (`CONTRAT` §2) — a été RÉPARÉ au chantier de conception le 23/08, sur
  //    mandat de Louis, avant l'ouverture.
  assert.deepEqual(competencesEnAttenteDeBranchement(), [])
  for (const c of COMPETENCES) {
    assert.equal(!!MANIFESTE_LU.competences[c]?.ouverte, true,
      `${c} : la fiche devrait dériver — le seuil est *relu et validé*`)
  }
})

test('chaque compétence fermée DIT POURQUOI — le motif se montre, il ne se devine pas', () => {
  for (const c of COMPETENCES) {
    const e = etatCompetence(c)
    if (e.ouverte) { assert.equal(e.motif, null); continue }
    // ⚠️ Ce motif est SERVI : `competencesDeLExercice` le pose dans le bilan
    //    d'un dépôt, que le professeur lit. Un motif faux se croit.
    assert.match(e.motif ?? '', /dériv|branch|import/i)
    assert.doesNotMatch(e.motif ?? '', /banc/i)
  }
})

test('LES SIX FICHES DÉRIVENT, et l\'Expression porte ses NEUF observables du §5', () => {
  const e = etatCompetence('expression')
  assert.deepEqual(Object.keys(e.instrument!.observables_mesure).sort(), [
    'attache_presente', 'densite_friction', 'densite_generique', 'mot_impropre',
    'orthographe', 'repetition_pauvre', 'reussites', 'savant_plaque', 'taux_sens_passe',
  ])
  // Les prompts viennent du DÉRIVÉ, jamais d'ici — « aucun prompt ne se tape ».
  assert.deepEqual(Object.keys(e.instrument!.prompts).sort(), ['P1', 'P2'])
  assert.match(e.instrument!.prompts.P1, /^# RÔLE/)
  assert.match(e.instrument!.statut, /RELUE ET VALIDÉE/)
})

test('L\'ARGUMENTATION porte ses NEUF observables du §5, et AUCUN paramètre', () => {
  const e = etatCompetence('argumentation')
  assert.deepEqual(Object.keys(e.instrument!.observables_mesure).sort(), [
    'garant_ambigu', 'garant_circulaire', 'garant_present', 'garant_vague',
    'lien_explicite', 'nb_limites', 'objection_traitee', 'preuve_circulaire',
    'source_cosmetique',
  ])
  // ⚠️ Les deux dénominateurs sont des PHRASES, pas des codes : le relevé porte
  //    une entrée sous ce nom exact, sans quoi les cinq `comptage rapporté`
  //    n'auraient rien à diviser et sortiraient en `n/a` (`01-` §8.2).
  assert.equal(e.instrument!.observables_mesure.preuve_circulaire.rapporte_a,
    'les unités du décompte')
  assert.equal(e.instrument!.observables_mesure.nb_limites.rapporte_a,
    'les unités du décompte, écartées comprises')
  // « Si tu te surprends à vouloir un seuil réglable, c'est qu'une valeur est en
  //   dur dans le module » — il n'y en a aucune : `PARAMS` est vide des deux côtés.
  assert.deepEqual(valeursDesParametres(e.instrument!), {})
  assert.deepEqual(Object.keys(e.instrument!.prompts).sort(), ['P1', 'P2'])
  assert.match(e.instrument!.statut, /RELUE ET VALIDÉE/)
})

test('LA STRUCTURE porte ses HUIT observables du §5, et le SEUL `prepare_copie`', () => {
  const e = etatCompetence('structure')
  assert.deepEqual(Object.keys(e.instrument!.observables_mesure).sort(), [
    'bloc_relie', 'bloc_unite', 'charniere_formule', 'charniere_motivee',
    'derive', 'jointure_presente', 'plan_tenu', 'promesse_presente',
  ])
  // Les DEUX dénominateurs, sous le nom EXACT que la fiche leur donne.
  assert.equal(e.instrument!.observables_mesure.charniere_formule.rapporte_a,
    'les charnières du squelette')
  assert.equal(e.instrument!.observables_mesure.derive.rapporte_a,
    'les blocs de développement')
  // ⭐ `plan_tenu` est le SEUL observable des trois compétences ouvertes à porter
  //    un `sans_objet_si` : « n/a sans annonce, et n/a n'est ni réussi ni raté ».
  assert.equal(e.instrument!.observables_mesure.plan_tenu.sans_objet_si, 'n/a')
  // Aucun paramètre : la pondération cohérence/cohésion reste la question
  // ouverte du §8, et « le jour où elle se tranche, elle entre en paramètre ».
  assert.deepEqual(valeursDesParametres(e.instrument!), {})
  assert.deepEqual(Object.keys(e.instrument!.prompts).sort(), ['P1', 'P2'])
  assert.match(e.instrument!.statut, /RELUE ET VALIDÉE/)
  // ⭐⭐ ET LE CROCHET QUI N'EXISTE QUE POUR ELLE : « les lignes vides sont des
  //    frontières de blocs ». C'est une copie RENUMÉROTÉE que P1 reçoit, et ce
  //    sont ces numéros que tout le relevé désigne.
  assert.equal(typeof etatCompetence('structure').branchement!.prepareCopie, 'function')
  assert.equal(etatCompetence('expression').branchement!.prepareCopie, undefined)
  assert.equal(etatCompetence('argumentation').branchement!.prepareCopie, undefined)
})

test('les PARAMÈTRES se lisent APLATIS — un bloc lu tel quel serait un objet', () => {
  // ⚠️ La fiche écrit un BLOC par paramètre (`defaut`, `bornes`, `statut`). Lu
  //    tel quel, un `seuil_parametre` rendrait un objet, la comparaison au seuil
  //    deviendrait impossible, et l'observable sortirait EN SILENCE du
  //    dénominateur du taux. Deux fiches en portent dix (connaissance, synthese).
  const p = valeursDesParametres(etatCompetence('expression').instrument!)
  assert.equal(p.seuil_densite, 5.5)
  assert.equal(p.seuil_zone_grise, 4.5)
  assert.equal(p.seuil_taux_rx, 0.1)
  // `exception_orthographe` est un booléen : il n'est pas un seuil, et sa valeur
  // est celle DE L'ÉLÈVE, servie par le contexte (`07-` §1.3).
  assert.equal('exception_orthographe' in p, false)
})

test('le Monitoring est au statut PLAFOND qu\'il déclare : son étage se construit', () => {
  assert.equal(MANIFESTE_LU.monitoring.ouvert, true)
  assert.equal(MONITORING.version, MANIFESTE_LU.monitoring.version)
  assert.match(MONITORING.prompt_extraction, /^SYSTÈME — EXTRACTION · MONITORING/)
})

test('le prompt du Monitoring est DÉRIVÉ de sa fiche — deux variables, pas trois', () => {
  assert.deepEqual([...MONITORING.variables], ['CONSIGNE', 'REPONSE_ELEVE'])
  assert.deepEqual([...MONITORING.champs_sortie],
    ['aveu_incomprehension', 'confiance_declaree', 'marquage_supposition'])
})

test('le catalogue du Monitoring porte `spontanee` / `sollicitee` — la source fait foi', () => {
  assert.deepEqual(MONITORING.bloc_machine.squelette.catalogue.sources, ['spontanee', 'sollicitee'])
})

test('`n/a` est une VALEUR DÉCLARÉE dans les deux échelles du Monitoring', () => {
  assert.equal(MONITORING.bloc_machine.observables.calibration.valeurs.includes('n/a'), true)
  assert.equal(MONITORING.bloc_machine.observables.amplitude_ecart.valeurs.includes('n/a'), true)
})

test('le gabarit de Calame est DÉRIVÉ du `07-` §4, avec ses trois variables', () => {
  assert.deepEqual([...CALAME.variables], ['COMPETENCE', 'MOMENT', 'REGISTRE'])
  assert.match(CALAME.gabarit, /^SYSTÈME — CALAME · RETOUR FORMATIF/)
  // « Les règles 1 à 6 et la règle 8 sont verrouillées » (§4).
  assert.deepEqual([...CALAME.regles_verrouillees], [1, 2, 3, 4, 5, 6, 8])
  assert.deepEqual([...CALAME.sections_editables], ['ton', 'longueur'])
})

test('le gabarit ne porte AUCUNE variable au-delà des trois', () => {
  const tokens = [...CALAME.gabarit.matchAll(/\{\{\s*([A-Z_]+)/g)].map((m) => m[1])
  assert.deepEqual([...new Set(tokens)].sort(), ['COMPETENCE', 'MOMENT', 'REGISTRE'])
})

test('le manifeste porte les empreintes de ses sources — c\'est ce qui rend la divergence lisible', () => {
  assert.match(MANIFESTE_LU.sources['07-Implementation.md'].empreinte, /^[0-9a-f]{64}$/)
  assert.match(MANIFESTE_LU.sources['competences/monitoring.md'].empreinte, /^[0-9a-f]{64}$/)
  // ⚠️ PAS de version en dur ici. Le `07-` a avancé trois fois pendant la seule
  //    séance qui l'a écrit : un test qui épingle « 2.8 » ne garde rien, il crie
  //    faux à chaque édition du professeur. Ce qui garde l'identité, c'est le
  //    `--verifie` ci-dessous, qui compare le dérivé À SA SOURCE.
  assert.match(MANIFESTE_LU.sources['07-Implementation.md'].version, /^\d+\.\d+$/)
})

// ── Le contrôle de dérivation, CÂBLÉ ────────────────────────────────────────
//
// `--verifie` est le seul organe capable de dire que les dérivés ont menti — et
// rien ne l'exécutait. La suite passait donc sur des dérivés périmés : au moment
// où ce test a été écrit, `07-Implementation.md` avait avancé de deux versions
// et l'application servait un gabarit estampillé d'une version disparue, sans
// qu'aucun signal ne se lève. Les assertions ci-dessus comparent le dérivé À
// LUI-MÊME : elles ne peuvent structurellement rien voir.

// ⚠️ Le dépôt de conception vit à un chemin ABSOLU hors de ce dépôt. Le fixer en
// dur ici faisait SAUTER le contrôle partout ailleurs que sur la machine du
// professeur — et un `npm test` vert sans le contrôle ne prouve rien (C4-L11).
// `PALIMPSESTE_RACINE_CONCEPTION` déclare la racine ; à défaut, le chemin du
// professeur tient lieu de défaut. Le `--racine` est passé au script : les deux
// bouts lisent la MÊME racine, jamais deux.
const RACINE_CONCEPTION = process.env.PALIMPSESTE_RACINE_CONCEPTION
  || '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

test('les dérivés sont IDENTIQUES à leurs sources (derive-instruments.py --verifie)', (t) => {
  if (!existsSync(RACINE_CONCEPTION)) {
    // Pas de dépôt de conception sous la main : on ne crie pas faux.
    t.skip('dépôt de conception absent')
    return
  }
  const r = spawnSync('python3',
    ['scripts/derive-instruments.py', '--racine', RACINE_CONCEPTION, '--verifie'],
    { encoding: 'utf-8' })
  assert.equal(r.status, 0,
    'les dérivés ont divergé de leurs sources — rejouer `derive-instruments.py --ecris`\n'
    + `${r.stdout}${r.stderr}`)
})

// ════════════════════════════════════════════════════════════════════════════
// C5 · L3 — LA PORTE DE MODE. « Des compétences dont la grille réceptive
// existe » (`07-` §2) : ces cinq mots sont une garde, et la voici éprouvée.
//
// ⭐ La preuve se fait DANS LES DEUX SENS : par le succès (les deux instruments
//    qui couvrent un mode réceptif le déclarent) et PAR L'ÉCHEC (les deux qui
//    ne le couvrent pas refusent, avec un motif qui nomme ce qui manque).
// ════════════════════════════════════════════════════════════════════════════

test('LES SIX BRANCHEMENTS DÉCLARENT LEURS MODES COUVERTS, et aucun n’est vide', () => {
  // ⛔ Une liste vide n'est pas « il couvre tout » : ce serait rouvrir la porte
  //    par le bas. `verifierCoherence()` le refuse AU CHARGEMENT.
  for (const c of COMPETENCES) {
    const b = etatCompetence(c).branchement
    assert.ok(b, c)
    assert.ok(Array.isArray(b!.modesCouverts), `${c} : modesCouverts absent`)
    assert.ok(b!.modesCouverts.length > 0, `${c} : modesCouverts VIDE`)
    for (const m of b!.modesCouverts) {
      assert.ok((MODES as readonly string[]).includes(m), `${c} : « ${m} » n'est pas un mode`)
    }
  }
})

test('LA COUVERTURE, COMPÉTENCE PAR COMPÉTENCE — la fiche §4 fait foi', () => {
  const attendu: Record<string, string[]> = {
    // Les quatre mono-mode de composition — admis et couvert coïncident.
    expression: ['composer'],
    connaissance: ['composer'],
    // ⛔ LES DEUX QUI FERMENT. La table dérivée `competences_modes_admis` admet
    //    l'Argumentation en `composer · expliquer · évaluer` et la Structure en
    //    `composer · expliquer` — vérifié en base, dans les DEUX bases. Leurs
    //    instruments ne couvrent que `composer` : leur grille réceptive vit en
    //    prose à leur fiche §3, sans prompt marqué ni enum au bloc machine.
    argumentation: ['composer'],
    structure: ['composer'],
    // ⭐ LES DEUX QUI EXISTENT. La Synthèse est mono-mode `restituer`, qui EST un
    //    mode réceptif : sa grille réceptive est son instrument unique. Le
    //    Questionnement a UNE SEULE grille pour les cinq modes, « la cascade est
    //    celle ci-dessus, INCHANGÉE » (fiche §4).
    synthese: ['restituer'],
    questionnement: ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger'],
  }
  for (const c of COMPETENCES) {
    assert.deepEqual([...etatCompetence(c).branchement!.modesCouverts], attendu[c], c)
  }
})

test('L’ÉCART ADMIS / COUVERT VAUT EXACTEMENT TROIS COUPLES, et ce sont eux que la porte ferme', () => {
  // ⭐ « Admis » n'est pas « couvert » : la table dérivée dit ce qu'une
  //    compétence PEUT INSTANCIER (`02-` §3), le branchement dit ce que son
  //    INSTRUMENT SAIT MESURER. *Les 13 couples admis sont vérifiés en base ;
  //    ils sont recopiés ici comme ATTENDU DE TEST, jamais comme source.*
  const admis: Record<string, string[]> = {
    expression: ['composer'],
    connaissance: ['composer'],
    argumentation: ['composer', 'expliquer', 'évaluer'],
    structure: ['composer', 'expliquer'],
    synthese: ['restituer'],
    questionnement: ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger'],
  }
  assert.equal(Object.values(admis).flat().length, 13, 'la table dérivée porte 13 couples')
  const ecart: string[] = []
  for (const c of COMPETENCES) {
    const couverts = etatCompetence(c).branchement!.modesCouverts as readonly string[]
    for (const m of admis[c]) if (!couverts.includes(m)) ecart.push(`${c}×${m}`)
  }
  assert.deepEqual(ecart.sort(),
    ['argumentation×expliquer', 'argumentation×évaluer', 'structure×expliquer'])
})

test('LA PORTE REFUSE — et son motif nomme la compétence, le mode et ce qui manque', () => {
  const b = etatCompetence('argumentation').branchement
  const motif = modeNonCouvert('argumentation', ['expliquer'], b)
  assert.ok(motif, 'argumentation × expliquer doit être refusée')
  // ⭐ Ce motif est SERVI : le bilan d'un dépôt l'affiche. « Un motif faux ne se
  //    lit pas comme un commentaire faux — il se croit. »
  assert.match(motif!, /expliquer/)
  assert.match(motif!, /argumentation/)
  assert.match(motif!, /composer/)
  assert.match(motif!, /COMPOSITION/)
  assert.match(motif!, /modesCouverts/)
})

test('LA PORTE LAISSE PASSER ce que l’instrument couvre — elle n’ouvre rien, elle ferme', () => {
  // ⭐ Les deux grilles réceptives qui EXISTENT passent, et c'est tout l'objet.
  assert.equal(modeNonCouvert('synthese', ['restituer'], etatCompetence('synthese').branchement), null)
  for (const m of ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger']) {
    assert.equal(
      modeNonCouvert('questionnement', [m], etatCompetence('questionnement').branchement), null, m)
  }
  // ⛔ Et elle ne retire RIEN à ce qui mesurait déjà : les six en `composer`,
  //    sauf la Synthèse, que la table n'admet pas en `composer`.
  for (const c of ['expression', 'argumentation', 'structure', 'connaissance', 'questionnement'] as const) {
    assert.equal(modeNonCouvert(c, ['composer'], etatCompetence(c).branchement), null, c)
  }
})

test('LA LECTURE EST PRUDENTE : un seul mode non couvert suffit à refuser', () => {
  // ⚠️ `modes_par_competence[c]` est une LISTE (`07-` §1.2). On refuse dès qu'UN
  //    mode élu n'est pas couvert, et non « dès qu'aucun ne l'est » : la mesure
  //    porterait le mode non couvert dans sa colonne `modes`, donc entrerait
  //    dans le groupe de ciblage réceptif (`01-` §3).
  //    *Mesuré : 504 couples en bac à sable, 488 en prod, AUCUN à plus d'un mode.*
  const b = etatCompetence('structure').branchement
  const motif = modeNonCouvert('structure', ['composer', 'expliquer'], b)
  assert.ok(motif, 'un mode couvert ne rachète pas un mode non couvert')
  assert.match(motif!, /expliquer/)
  assert.doesNotMatch(motif!, /« composer » non couvert/)
})

test('UNE LISTE VIDE NE REFUSE RIEN — inventer un `composer` implicite serait décider', () => {
  // ⚠️ Mesuré : zéro couple à liste vide dans les deux bases. La chaîne se
  //    comporte alors comme avant cette porte.
  assert.equal(modeNonCouvert('argumentation', [], etatCompetence('argumentation').branchement), null)
  assert.equal(modeNonCouvert('argumentation', ['  '], etatCompetence('argumentation').branchement), null)
})

test('`évaluer` SANS ACCENT est accepté EN ENTRÉE — le précédent est MODES_RECEPTIFS', () => {
  // « La forme accentuée est celle de la source ; la forme sans accent est
  //   acceptée en entrée » (`questionnement.ts`). La déclaration, elle, ne
  //   connaît que la forme accentuée : `Mode` la type.
  assert.equal(
    modeNonCouvert('questionnement', ['evaluer'], etatCompetence('questionnement').branchement), null)
  assert.ok(modeNonCouvert('argumentation', ['evaluer'], etatCompetence('argumentation').branchement))
})

test('UN BRANCHEMENT SANS MODE DÉCLARÉ EST REFUSÉ AU CHARGEMENT — et FERMÉ PAR DÉFAUT en aval', () => {
  // ⭐ Le patron est celui des slots : « un appel dépensé sur une chaîne qui
  //    produirait des trous est un appel perdu, et la mesure qui en sort est
  //    fausse. » `verifierCoherence()` attrape la déclaration vide AU CHARGEMENT
  //    — c'est là que le refus doit tomber.
  // ⛔ ET SI ELLE PASSAIT QUAND MÊME, LA PORTE REFUSE TOUT plutôt que de tout
  //    laisser passer. *Une garde qui existe contre un silence ne doit pas se
  //    taire quand sa propre déclaration manque.*
  const vrai = etatCompetence('argumentation').branchement!
  const sansModes = { ...vrai, modesCouverts: [] as never[] }
  const motif = modeNonCouvert('argumentation', ['expliquer'], sansModes)
  assert.ok(motif, 'une déclaration vide refuse, elle n’ouvre pas')
  assert.match(motif!, /AUCUN mode couvert/)
  assert.match(motif!, /verifierCoherence/)
  // Et aucun des six n'est dans ce cas aujourd'hui.
  assert.deepEqual(verifierCoherence(), [])
})
