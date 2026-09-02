// ============================================================================
// LE PLAN DE TRAVAIL DU DÉROULÉ. Ce que ce test GARDE :
//   · ⭐ que la CRÉDENCE l'emporte sur la désignation quand les deux drapeaux
//     se lèvent — un écran qui montrerait la sélection sans les jetons rendrait
//     l'exercice impossible à finir ;
//   · ⭐ que le temps 2 CHANGE DE NOM selon la forme (handoff §4) : « Écrire »
//     au-dessus de quatre curseurs demanderait ce que l'écran n'offre pas ;
//   · ⚠️ que l'état d'un temps se lit sur la POSITION dans la liste SERVIE —
//     une paire n'en sert que quatre, et « Réviser » n'y est pas « à venir »
//     par défaut : il n'y est pas du tout ;
//   · ⚠️ que le compteur du téléphone se TAIT plutôt que d'afficher « 0 / 6 ».
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  formeDuTravail, libelleDuTemps, etatDuTemps, rangDuTemps, colonnesDuPlan, titreDuTravail,
  ecranDuDeroule, tempsAffiche,
} from './plan-de-travail'
import { tempsServis } from './regime'

test('la forme suit les deux drapeaux, et la crédence l’emporte', () => {
  assert.equal(
    formeDuTravail({ credenceEstLaReponse: false, designationDemandee: false }), 'rediger')
  assert.equal(
    formeDuTravail({ credenceEstLaReponse: true, designationDemandee: false }), 'choisir')
  assert.equal(
    formeDuTravail({ credenceEstLaReponse: false, designationDemandee: true }), 'surligner')
  // ⭐ Les deux ensemble n'existent pas au `02-` §5 ; si une instance mal formée
  //    les levait, l'écran doit rester FINISSABLE.
  assert.equal(
    formeDuTravail({ credenceEstLaReponse: true, designationDemandee: true }), 'choisir')
})

test('le temps 2 change de nom selon la forme, les autres jamais', () => {
  assert.equal(libelleDuTemps('ecrire', 'rediger'), 'Écrire')
  assert.equal(libelleDuTemps('ecrire', 'choisir'), 'Répondre')
  assert.equal(libelleDuTemps('ecrire', 'surligner'), 'Surligner et répondre')
  for (const forme of ['rediger', 'choisir', 'surligner'] as const) {
    assert.equal(libelleDuTemps('preparer', forme), 'Préparer')
    assert.equal(libelleDuTemps('se_juger', forme), 'Se juger')
    assert.equal(libelleDuTemps('retour', forme), 'Retour')
    assert.equal(libelleDuTemps('reviser', forme), 'Réviser')
    assert.equal(libelleDuTemps('retour_final', forme), 'Retour final')
  }
})

test('l’état d’un temps se lit sur la position dans la liste SERVIE', () => {
  const plein = tempsServis('plein')
  assert.deepEqual(plein.map((t) => etatDuTemps(t, 'se_juger', plein)),
    ['fait', 'fait', 'courant', 'a_venir', 'a_venir', 'a_venir'])

  // ⚠️ La paire (régime `sans_vf`) ne sert QUE quatre temps : « Réviser » n'y
  //    est pas, et le fil n'a pas à s'en inventer un.
  const court = tempsServis('sans_vf')
  assert.equal(court.length, 4)
  assert.equal(court.includes('reviser'), false)
  assert.deepEqual(court.map((t) => etatDuTemps(t, 'retour', court)),
    ['fait', 'fait', 'fait', 'courant'])
})

test('un temps hors de la liste servie n’est jamais « fait »', () => {
  const court = tempsServis('sans_vf')
  assert.equal(etatDuTemps('reviser', 'retour', court), 'a_venir')
})

test('le compteur du téléphone se tait plutôt que de mentir', () => {
  const plein = tempsServis('plein')
  assert.deepEqual(rangDuTemps('ecrire', plein), { rang: 2, total: 6 })
  assert.deepEqual(rangDuTemps('retour', tempsServis('sans_vf')), { rang: 4, total: 4 })
  assert.equal(rangDuTemps('reviser', tempsServis('sans_vf')), null)
  assert.equal(rangDuTemps('ecrire', []), null)
})

test('le ratio des colonnes suit la forme, et le titre du travail aussi', () => {
  assert.match(colonnesDuPlan('rediger'), /400px/)
  assert.equal(colonnesDuPlan('choisir'), colonnesDuPlan('surligner'))
  assert.doesNotMatch(colonnesDuPlan('choisir'), /400px/)

  assert.equal(titreDuTravail('rediger'), 'Ton écriture')
  assert.equal(titreDuTravail('choisir'), 'Ta réponse')
  assert.equal(titreDuTravail('surligner'), 'Ce que tu en dis')
})

// ── Quel écran l'élève a sous les yeux ──────────────────────────────────────

test('la porte fermée passe avant tout', () => {
  assert.equal(ecranDuDeroule({ ouvert: false, tempsCourant: 'se_juger', forme: 'rediger',
    corrections: [], aUnRetour: true, seJugerAServir: true }), 'ferme')
})

test('⚠️ « se juger » passe devant tout le reste', () => {
  assert.equal(ecranDuDeroule({ ouvert: true, tempsCourant: 'se_juger', forme: 'rediger',
    corrections: [], aUnRetour: true, seJugerAServir: true }), 'se_juger')
  assert.equal(ecranDuDeroule({ ouvert: true, tempsCourant: 'se_juger', forme: 'choisir',
    corrections: [{}], aUnRetour: false, seJugerAServir: true }), 'se_juger')
})

test('⛔⛔ « se juger » SANS question ne fait pas une page blanche — smoke du 30/08', () => {
  // La phase est servie, l'offre est vide : l'écran exclusif rendait du VIDE.
  const b = { ouvert: true, tempsCourant: 'se_juger' as const, forme: 'rediger' as const,
    corrections: [], seJugerAServir: false }
  // Rien à demander, rien encore reçu : le plan de travail, qui porte l'attente.
  assert.equal(ecranDuDeroule({ ...b, aUnRetour: false }), 'travail')
  // Rien à demander, le retour est là : c'est lui qu'on montre.
  assert.equal(ecranDuDeroule({ ...b, aUnRetour: true }), 'retour_texte')
})

test('⭐⭐ aux crans guidés, l’écran suit la CORRECTION, pas le temps', () => {
  // `tempsCourant` reste « écrire » de bout en bout : l'élève ne remet rien.
  const base = { ouvert: true, tempsCourant: 'ecrire' as const, forme: 'choisir' as const,
    aUnRetour: false, seJugerAServir: false }
  assert.equal(ecranDuDeroule({ ...base, corrections: [null] }), 'travail')
  assert.equal(ecranDuDeroule({ ...base, corrections: [{}] }), 'retour_choix')
})

test('⭐ sur une paire, la bascule attend la correction du DERNIER cas', () => {
  const base = { ouvert: true, tempsCourant: 'ecrire' as const, forme: 'choisir' as const,
    aUnRetour: false, seJugerAServir: false }
  // Correction du cas 1 servie, cas 2 encore devant : l'écran reste au travail.
  assert.equal(ecranDuDeroule({ ...base, corrections: [{}, null] }), 'travail')
  assert.equal(ecranDuDeroule({ ...base, corrections: [{}, {}] }), 'retour_choix')
})

test('le retour d’un texte s’ouvre à la révision et au retour final', () => {
  const b = { ouvert: true, forme: 'rediger' as const, corrections: [], aUnRetour: false,
    seJugerAServir: true }
  assert.equal(ecranDuDeroule({ ...b, tempsCourant: 'reviser' }), 'retour_texte')
  assert.equal(ecranDuDeroule({ ...b, tempsCourant: 'retour_final' }), 'retour_texte')
  assert.equal(ecranDuDeroule({ ...b, tempsCourant: 'ecrire' }), 'travail')
})

test('⛔⛔ « retour » couvre L’ATTENTE **et** L’ARRIVÉE — smoke du 30/08', () => {
  // Le même temps sert les deux : `tempsCourantDe` le rend dès la remise, et le
  // garde comme état TERMINAL aux régimes sans version finale.
  const b = { ouvert: true, tempsCourant: 'retour' as const, forme: 'rediger' as const,
    corrections: [], seJugerAServir: true }
  // Rien n'est encore arrivé : le plan de travail, qui porte l'encart d'attente.
  assert.equal(ecranDuDeroule({ ...b, aUnRetour: false }), 'travail')
  // ⛔ Le défaut mesuré : le retour PUBLIÉ n'apparaissait nulle part.
  assert.equal(ecranDuDeroule({ ...b, aUnRetour: true }), 'retour_texte')
  // Et il vaut pour les trois formes qui ne sont pas un choix.
  assert.equal(ecranDuDeroule({ ...b, forme: 'surligner', aUnRetour: true }), 'retour_texte')
})

test('⛔ le temps AFFICHÉ ne ment jamais dans l’autre sens', () => {
  // Le fil dit « Retour » là où le serveur dit « écrire » ou « réviser »…
  assert.equal(tempsAffiche('retour_choix', 'ecrire', false), 'retour')
  assert.equal(tempsAffiche('retour_texte', 'reviser', false), 'retour')
  // …mais dès que l'élève a repris son texte, il redit « Réviser ».
  assert.equal(tempsAffiche('retour_texte', 'reviser', true), 'reviser')
  // …et quand « se juger » n'a rien à servir, il ne se montre pas au-dessus
  // d'un écran qui a déjà passé la main.
  assert.equal(tempsAffiche('retour_texte', 'se_juger', false), 'retour')
  assert.equal(tempsAffiche('travail', 'se_juger', false), 'retour')
  // Partout ailleurs, il rend le temps du serveur, tel quel.
  assert.equal(tempsAffiche('travail', 'ecrire', false), 'ecrire')
  assert.equal(tempsAffiche('se_juger', 'se_juger', false), 'se_juger')
  assert.equal(tempsAffiche('retour_texte', 'retour_final', false), 'retour_final')
})

// ── 01/09 — le volet du téléphone suit la forme ──────────────────────────────
test('le téléphone s’ouvre sur la matière quand il faut y surligner, sur le travail sinon', async () => {
  const { voletInitial } = await import('./plan-de-travail')
  assert.equal(voletInitial('surligner'), 'lire')
  assert.equal(voletInitial('rediger'), 'ecrire')
  assert.equal(voletInitial('choisir'), 'ecrire')
})
