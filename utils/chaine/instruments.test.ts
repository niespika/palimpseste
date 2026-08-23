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
  etatCompetence, valeursDesParametres, verifierCoherence,
} from './instruments'
import { COMPETENCES } from './types'

test('l\'instrument dérivé et son branchement sont COHÉRENTS', () => {
  assert.deepEqual(verifierCoherence(), [])
})

test('TROIS COMPÉTENCES SONT OUVERTES — dérivées ET branchées (C4-L10)', () => {
  // ⭐ L'Expression le 22/08, l'Argumentation puis la Structure le 23/08. « Une
  //    compétence de plus est une compétence de plus à la rentrée, pas un lot de
  //    plus. » ⚠️ L'ordre est celui de `COMPETENCES` (`07-` §1.2), pas celui des
  //    branchements : `competencesOuvertes()` filtre la liste des six.
  assert.deepEqual(competencesOuvertes(), ['expression', 'argumentation', 'structure'])
  for (const c of ['expression', 'argumentation', 'structure'] as const) {
    const e = etatCompetence(c)
    assert.equal(e.ouverte, true, c)
    assert.equal(e.motif, null, c)
    assert.equal(e.instrument?.competence, c)
    assert.ok(e.branchement, c)
  }
})

test('LES TROIS AUTRES SONT DÉRIVÉES, ET ATTENDENT LEUR BRANCHEMENT', () => {
  // ⚠️ Dérivée n'est pas branchée, et c'est un état NORMAL : C4-L10 se rejoue
  //    une compétence à la fois. Ce n'est pas une incohérence — mais ce n'est
  //    pas tacite non plus, et c'est tout l'objet de cette liste.
  assert.deepEqual(competencesEnAttenteDeBranchement(),
    ['connaissance', 'synthese', 'questionnement'])
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
