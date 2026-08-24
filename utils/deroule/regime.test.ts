// ============================================================================
// C4 · L3 — LE RÉGIME. Ce que ce test GARDE : que l'escalade entre bien dans la
// dérivation. « Un écran qui grave "cran → régime" en dur ne servira jamais la
// vf d'escalade — le delta vaudra NULL, et NULL n'est pas 0 : N2 serait
// aveugle » (piège 8 ; `01-` §8.5).
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  regimeDuCran, regimeDuDeroule, RegimeInconnu, tempsServis, versionFinaleServie,
  nombreDeCas, credenceDemandee, etapeDeLaPaire, ETAPES_PAIRE, statutApresRemise, deroulTermine,
  SANS_ESCALADE, type EscaladePesante,
} from './regime'

// Les trois libellés que `exercices_crans.regime_v1vf` porte en base, vérifiés
// par requête le 22/08 sur les neuf crans.
const PLEIN = 'plein'
const PAIRES = 'par paires'
const SANS_VF = 'pas de vf, sauf escalade'

const INSTANCE_ISOLANTE = {
  observableIsoleCode: 'garant_cite', observableIsoleCompetence: 'argumentation',
}
const N2_SUR_LE_MEME: EscaladePesante = {
  degre: 'N2', observable: 'garant_cite', competence: 'argumentation',
}

test('les trois libellés de la doctrine se traduisent, et eux seuls', () => {
  assert.equal(regimeDuCran(PLEIN), 'plein')
  assert.equal(regimeDuCran(PAIRES), 'par_paires')
  assert.equal(regimeDuCran(SANS_VF), 'sans_vf')
})

test('un libellé inconnu ARRÊTE — deviner le régime déciderait à la place de la source', () => {
  assert.throws(() => regimeDuCran('plein, sauf le mardi'), RegimeInconnu)
})

test('sans escalade, un cran de transformation ne sert AUCUNE version finale', () => {
  const r = regimeDuDeroule(SANS_VF, INSTANCE_ISOLANTE, SANS_ESCALADE)
  assert.equal(r.regime, 'sans_vf')
  assert.equal(r.vfRequiseParEscalade, false)
})

test('⭐ SOUS ESCALADE, sur l’observable ciblé, la vf DEVIENT REQUISE (`01-` §8.5)', () => {
  const r = regimeDuDeroule(SANS_VF, INSTANCE_ISOLANTE, N2_SUR_LE_MEME)
  assert.equal(r.regime, 'plein', 'sans quoi le delta vaudrait NULL, et N2 serait aveugle')
  assert.equal(r.vfRequiseParEscalade, true)
})

test('l’escalade est indexée PAR OBSERVABLE : un autre observable ne fait rien', () => {
  const ailleurs: EscaladePesante = {
    degre: 'N2', observable: 'objection_traitee', competence: 'argumentation',
  }
  assert.equal(regimeDuDeroule(SANS_VF, INSTANCE_ISOLANTE, ailleurs).regime, 'sans_vf')
})

test('la même compétence ne suffit pas : il faut le MÊME observable', () => {
  const memeCompetenceAutreObservable: EscaladePesante = {
    degre: 'N1', observable: 'autre_chose', competence: 'argumentation',
  }
  assert.equal(
    regimeDuDeroule(SANS_VF, INSTANCE_ISOLANTE, memeCompetenceAutreObservable).regime, 'sans_vf')
})

test('un exercice qui n’isole AUCUN observable ne porte l’observable de personne', () => {
  const sansIsolation = { observableIsoleCode: null, observableIsoleCompetence: null }
  assert.equal(regimeDuDeroule(SANS_VF, sansIsolation, N2_SUR_LE_MEME).regime, 'sans_vf')
})

test('N1 suffit : l’exception vaut « pendant une escalade active, N1 ET AU-DELÀ »', () => {
  const n1: EscaladePesante = { ...N2_SUR_LE_MEME, degre: 'N1' }
  assert.equal(regimeDuDeroule(SANS_VF, INSTANCE_ISOLANTE, n1).regime, 'plein')
})

test('une PAIRE reste une paire sous escalade — on ne re-diagnostique pas une copie corrigée', () => {
  assert.equal(regimeDuDeroule(PAIRES, INSTANCE_ISOLANTE, N2_SUR_LE_MEME).regime, 'par_paires')
})

test('un cran de production est déjà plein : l’escalade n’a rien à y requérir', () => {
  const r = regimeDuDeroule(PLEIN, INSTANCE_ISOLANTE, N2_SUR_LE_MEME)
  assert.equal(r.regime, 'plein')
  assert.equal(r.vfRequiseParEscalade, false, 'la vf n’est pas requise PAR L’ESCALADE : elle l’était déjà')
})

test('les temps 5 et 6 ne sont servis QU’AU RÉGIME PLEIN (`06-` §2)', () => {
  assert.deepEqual(tempsServis('plein'),
    ['preparer', 'ecrire', 'se_juger', 'retour', 'reviser', 'retour_final'])
  assert.deepEqual(tempsServis('par_paires'), ['preparer', 'ecrire', 'se_juger', 'retour'])
  assert.deepEqual(tempsServis('sans_vf'), ['preparer', 'ecrire', 'se_juger', 'retour'])
  assert.equal(versionFinaleServie('sans_vf'), false)
})

test('un diagnostic est UN exercice en DEUX cas ; les deux autres gestes en ont un', () => {
  assert.equal(nombreDeCas('diagnostiquer'), 2)
  assert.equal(nombreDeCas('transformer'), 1)
  assert.equal(nombreDeCas('produire'), 1)
})

test('la crédence se collecte aux SIX crans de diagnostiquer et de transformer, jamais en produire', () => {
  assert.equal(credenceDemandee('diagnostiquer'), true)
  assert.equal(credenceDemandee('transformer'), true)
  assert.equal(credenceDemandee('produire'), false)
})

test('⭐ la correction du premier cas ne se sert QU’APRÈS sa crédence', () => {
  // Répondu au cas 1, mais pas encore de crédence : on est encore à la crédence 1,
  // donc la correction n'est pas servie — sinon l'élève déclarerait sa sûreté en
  // connaissant la réponse, et la porte 2 ne mesurerait plus rien.
  assert.equal(etapeDeLaPaire(['une réponse', null], [null, null]), 'credence_1')
  assert.equal(etapeDeLaPaire(['une réponse', null], [{ cas: 1 }, null]), 'correction')
})

test('la paire avance cas 1 → crédence 1 → correction → cas 2 → crédence 2 → CORRECTION 2', () => {
  assert.equal(etapeDeLaPaire([null, null], [null, null]), 'cas_1')
  assert.equal(etapeDeLaPaire(['  ', null], [null, null]), 'cas_1', 'un blanc n’est pas une réponse')
  assert.equal(etapeDeLaPaire(['a', 'b'], [{ cas: 1 }, null]), 'credence_2')
  // ⭐ C4-L14 — LE CAS TERMINAL A CHANGÉ, et c'est là que ça se voit. La
  //    fonction ne rendait JAMAIS `cas_2` et rendait `credence_2` deux fois :
  //    un sixième état ajouté en bout de liste, sans toucher ce `return`, serait
  //    resté INATTEIGNABLE — et le second cas serait resté muet.
  assert.equal(etapeDeLaPaire(['a', 'b'], [{ cas: 1 }, { cas: 2 }]), 'correction_2',
    'le cas du transfert reçoit LA MÊME CORRECTION que le premier — décision de Louis, 23/08')
})

test('⭐⭐ AUX CRANS À CANDIDATS, LA CRÉDENCE EST LA RÉPONSE — sans quoi la correction ne sort JAMAIS', () => {
  // Le défaut trouvé au smoke élève du 24/08, et qu'aucun test ne voyait : ces
  // tests-ci éprouvaient la fonction PURE avec des réponses fabriquées, quand le
  // défaut était dans l'APPEL. Aux crans 1 et 3 l'élève NE RÉDIGE PAS — le
  // jugement est algorithmique —, donc `texte_v1`/`texte_vf` restent `null`.
  const AUCUN_TEXTE = [null, null]

  // ⛔ AVANT : sans le drapeau, on reste bloqué à `cas_1` POUR TOUJOURS, même
  //    avec la crédence donnée. C'est ce qui privait l'élève de sa correction.
  assert.equal(etapeDeLaPaire(AUCUN_TEXTE, [{ cas: 1 }, null]), 'cas_1',
    'sans le drapeau, la crédence ne fait pas avancer : c’est le bug du 24/08')

  // ✅ APRÈS : la crédence tient lieu de réponse, et la paire avance.
  assert.equal(etapeDeLaPaire(AUCUN_TEXTE, [null, null], true), 'cas_1')
  assert.equal(etapeDeLaPaire(AUCUN_TEXTE, [{ cas: 1 }, null], true), 'correction',
    'la crédence du cas 1 donnée ⇒ sa correction est due, et le cas 2 est offert')
  assert.equal(etapeDeLaPaire(AUCUN_TEXTE, [{ cas: 1 }, { cas: 2 }], true), 'correction_2',
    'les deux crédences données ⇒ le cas du transfert reçoit la sienne')

  // ⚠️ Et le texte rédigé n'entre PLUS en compte quand la crédence est la
  //    réponse : un `texte_v1` qui traînerait ne doit pas faire sauter d'étape.
  assert.equal(etapeDeLaPaire(['un texte qui traîne', null], [null, null], true), 'cas_1',
    'la crédence commande seule — le texte ne fait pas avancer')
})

test('aux crans SANS candidats, rien ne change — l’élève rédige, et c’est sa réponse', () => {
  // Le défaut réparé ne doit pas déborder : au cran 4 (`diagnostic_nomme`) et
  // aux autres, l'élève écrit, et au régime `par_paires` `texte_v1` porte sa
  // réponse au cas 1, `texte_vf` celle au cas 2.
  assert.equal(etapeDeLaPaire([null, null], [{ cas: 1 }, null], false), 'cas_1',
    'une crédence sans réponse écrite ne fait pas avancer un cran qui demande d’écrire')
  assert.equal(etapeDeLaPaire(['une réponse', null], [null, null], false), 'credence_1')
  assert.equal(etapeDeLaPaire(['une réponse', null], [{ cas: 1 }, null], false), 'correction')
  // ⭐ Le défaut par défaut est le comportement d'AVANT : le drapeau est opt-in.
  assert.equal(etapeDeLaPaire(['une réponse', null], [{ cas: 1 }, null]), 'correction',
    'sans troisième argument, le comportement est inchangé')
})

test('⭐ le sixième état vient APRÈS la crédence 2, jamais avant', () => {
  // La même règle que le troisième état : « la correction ne se sert qu'une fois
  // la crédence donnée — sans quoi l'élève déclarerait sa sûreté en connaissant
  // la réponse, et la porte 2 ne mesurerait plus rien ».
  assert.equal(etapeDeLaPaire(['a', 'b'], [{ cas: 1 }, null]), 'credence_2')
  assert.equal(ETAPES_PAIRE.length, 6)
  assert.deepEqual(ETAPES_PAIRE,
    ['cas_1', 'credence_1', 'correction', 'cas_2', 'credence_2', 'correction_2'])
})

test('la remise fait avancer le statut, et jamais au-delà de ce que la version dit', () => {
  assert.equal(statutApresRemise('v1'), 'v1_remis')
  assert.equal(statutApresRemise('vf'), 'vf_remis')
})

test('le déroulé se clôt au RETOUR FINAL au régime plein, au RETOUR CHAUD aux deux autres', () => {
  assert.equal(deroulTermine('plein', { retourFinalLu: false, retourChaudLu: true }), false)
  assert.equal(deroulTermine('plein', { retourFinalLu: true, retourChaudLu: true }), true)
  assert.equal(deroulTermine('sans_vf', { retourFinalLu: false, retourChaudLu: true }), true)
  assert.equal(deroulTermine('par_paires', { retourFinalLu: false, retourChaudLu: true }), true)
})
