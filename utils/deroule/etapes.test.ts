// ============================================================================
// « UN ÉCRAN, UNE TÂCHE ». Ce que ce test GARDE :
//   · ⭐ que la page suit l'ordre du geste — écrire, crédence, gestes, rendre —
//     et que deux tâches ne se lèvent jamais ensemble ;
//   · ⭐ que la correction du premier cas passe devant tout, et qu'après la
//     remise il n'y a plus de page à tourner ;
//   · ⚠️ que le drapeau d'écran (`redactionFinie`) ne fait tourner la page
//     QU'ENTRE écrire et la suite — il ne ressuscite pas une crédence donnée ;
//   · ⚠️ que le compteur compte la suite SERVIE, et se tait après la remise.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  etapeDuTravail, etapesServies, rangDeLEtape, gestesServis, titreDeLEtape,
  libelleDuVoletDeTravail, tempsDeLaPage, type EtatDuTravail,
} from './etapes'

const base: EtatDuTravail = {
  moment: null, credenceEstLaReponse: false, enRedaction: true, credenceASaisir: true,
  gesteRestant: 'confiance', sansRemise: false, redactionFinie: false, sansEcriture: false, aucuneRemise: false,
}

test('la page suit l’ordre du geste, une tâche à la fois', () => {
  assert.equal(etapeDuTravail(base), 'ecrire')
  assert.equal(etapeDuTravail({ ...base, redactionFinie: true }), 'credence')
  assert.equal(etapeDuTravail({ ...base, redactionFinie: true, credenceASaisir: false }), 'confiance')
  assert.equal(etapeDuTravail(
    { ...base, redactionFinie: true, credenceASaisir: false, gesteRestant: 'restitution' }), 'restitution')
  assert.equal(etapeDuTravail(
    { ...base, redactionFinie: true, credenceASaisir: false, gesteRestant: null }), 'rendre')
})

test('la correction du premier cas passe devant tout ; après la remise, plus de page', () => {
  assert.equal(etapeDuTravail({ ...base, moment: 'correction_1', redactionFinie: true }), 'correction')
  assert.equal(etapeDuTravail({ ...base, moment: 'correction_1', enRedaction: false }), 'correction')
  assert.equal(etapeDuTravail({ ...base, enRedaction: false }), 'apres')
  assert.equal(etapeDuTravail({ ...base, enRedaction: false, redactionFinie: true }), 'apres')
})

test('aux crans à candidats, la page est « répondre » tant qu’on écrit', () => {
  assert.equal(etapeDuTravail({ ...base, credenceEstLaReponse: true }), 'repondre')
  assert.equal(etapeDuTravail({ ...base, credenceEstLaReponse: true, redactionFinie: true }), 'repondre')
})

test('sur une paire, le premier cas ne se rend pas : crédence donnée, on attend le serveur', () => {
  // Le cas 1, texte enregistré : la crédence.
  assert.equal(etapeDuTravail({ ...base, moment: 'cas_1', sansRemise: true, redactionFinie: true }), 'credence')
  // La crédence prise, l'étape serveur n'a pas encore tourné : on reste sur le champ.
  assert.equal(etapeDuTravail(
    { ...base, moment: 'cas_1', sansRemise: true, redactionFinie: true, credenceASaisir: false }), 'ecrire')
  // Le second cas, crédence donnée : la remise commence.
  assert.equal(etapeDuTravail(
    { ...base, moment: 'fin', sansRemise: false, redactionFinie: true, credenceASaisir: false }), 'confiance')
})

test('la suite servie, et le rang qu’on y lit', () => {
  const seule = etapesServies({
    estUnePaire: false, credenceEstLaReponse: false, credenceDemandee: true,
    gestes: ['confiance', 'conditions', 'restitution'], versionFinale: false,
  })
  assert.deepEqual(seule.map((s) => s.etape),
    ['ecrire', 'credence', 'confiance', 'conditions', 'restitution', 'rendre'])
  assert.deepEqual(rangDeLEtape(seule, 'credence', null), { rang: 2, total: 6 })
  assert.deepEqual(rangDeLEtape(seule, 'rendre', null), { rang: 6, total: 6 })
  assert.equal(rangDeLEtape(seule, 'apres', null), null)

  const paire = etapesServies({
    estUnePaire: true, credenceEstLaReponse: false, credenceDemandee: true,
    gestes: ['conditions', 'restitution'], versionFinale: false,
  })
  assert.deepEqual(paire.map((s) => `${s.etape}${s.cas ?? ''}`),
    ['ecrire1', 'credence1', 'correction1', 'ecrire2', 'credence2', 'conditions', 'restitution', 'rendre'])
  assert.deepEqual(rangDeLEtape(paire, 'ecrire', 2), { rang: 4, total: 8 })
  assert.deepEqual(rangDeLEtape(paire, 'correction', 1), { rang: 3, total: 8 })

  const sansCredence = etapesServies({
    estUnePaire: false, credenceEstLaReponse: false, credenceDemandee: false,
    gestes: ['confiance', 'conditions', 'restitution'], versionFinale: false,
  })
  assert.deepEqual(sansCredence.map((s) => s.etape),
    ['ecrire', 'confiance', 'conditions', 'restitution', 'rendre'])

  const candidats = etapesServies({
    estUnePaire: true, credenceEstLaReponse: true, credenceDemandee: true, gestes: [], versionFinale: false,
  })
  assert.deepEqual(candidats.map((s) => `${s.etape}${s.cas ?? ''}`), ['repondre1', 'correction1', 'repondre2'])

  const vf = etapesServies({
    estUnePaire: false, credenceEstLaReponse: false, credenceDemandee: true,
    gestes: ['conditions'], versionFinale: true,
  })
  assert.deepEqual(vf.map((s) => s.etape), ['ecrire', 'rendre'])
})

test('les gestes servis : la confiance quand une compétence la demande, la restitution au seul produire', () => {
  assert.deepEqual(gestesServis({ confianceDemandee: true, restitutionDemandee: true }),
    ['confiance', 'conditions', 'restitution'])
  assert.deepEqual(gestesServis({ confianceDemandee: false, restitutionDemandee: true }),
    ['conditions', 'restitution'])
  assert.deepEqual(gestesServis({ confianceDemandee: true, restitutionDemandee: false }),
    ['confiance', 'conditions'])
})

test('les gestes et la remise se lisent « Se juger » au fil ; les autres pages laissent le serveur dire', () => {
  assert.equal(tempsDeLaPage('confiance'), 'se_juger')
  assert.equal(tempsDeLaPage('conditions'), 'se_juger')
  assert.equal(tempsDeLaPage('restitution'), 'se_juger')
  assert.equal(tempsDeLaPage('rendre'), 'se_juger')
  assert.equal(tempsDeLaPage('ecrire'), null)
  assert.equal(tempsDeLaPage('credence'), null)
  assert.equal(tempsDeLaPage('apres'), null)
})

test('les libellés suivent la page', () => {
  assert.equal(titreDeLEtape('ecrire', 'rediger'), 'Ton écriture')
  assert.equal(titreDeLEtape('ecrire', 'surligner'), 'Ce que tu en dis')
  assert.equal(titreDeLEtape('credence', 'rediger'), 'Ta crédence')
  assert.equal(titreDeLEtape('conditions', 'rediger'), 'Avant de rendre')
  assert.equal(libelleDuVoletDeTravail('credence'), 'Crédence')
  assert.equal(libelleDuVoletDeTravail('restitution'), 'Rendre')
  assert.equal(libelleDuVoletDeTravail('correction'), 'La correction')
})


// ── ⭐⭐ LE 4(b) SURLIGNE ET NE DIT RIEN (Louis, 07/09/2026) ──────────────────
// *« Quand il y a juste du surlignage à faire, il ne devrait pas y avoir
// d'écriture. L'écriture ne vaut qu'au cran où on demande EN PLUS de nommer. »*

test('un cas sans écriture n’a pas de page « écrire » — il désigne', () => {
  const muet: EtatDuTravail = { ...base, sansEcriture: true }
  assert.equal(etapeDuTravail({ ...muet, redactionFinie: false }), 'designer')
  // La zone posée, la page tourne vers la crédence, comme un texte enregistré.
  assert.equal(etapeDuTravail({ ...muet, redactionFinie: true }), 'credence')
  // ⛔ Et le repli du premier cas d'une paire ne renvoie plus vers le champ.
  assert.equal(
    etapeDuTravail({ ...muet, redactionFinie: true, credenceASaisir: false, sansRemise: true }),
    'designer')
})

test('⛔ le cas qui écrit garde sa page — le drapeau est PAR CAS', () => {
  assert.equal(etapeDuTravail({ ...base, sansEcriture: false }), 'ecrire')
  assert.equal(etapeDuTravail({ ...base, sansEcriture: false, redactionFinie: true }), 'credence')
})

test('la suite d’une paire 4(a)/4(b) : le cas 1 écrit, le cas 2 surligne', () => {
  const suite = etapesServies({
    estUnePaire: true, credenceEstLaReponse: false, credenceDemandee: true,
    gestes: ['conditions'], versionFinale: false, sansEcriture: [false, true],
  })
  assert.deepEqual(suite.map((s) => [s.etape, s.cas]), [
    ['ecrire', 1], ['credence', 1], ['correction', 1],
    ['designer', 2], ['credence', 2],
    ['conditions', null], ['rendre', null],
  ])
})

test('la suite d’une paire 4(b)/4(b) : aucune page d’écriture', () => {
  const suite = etapesServies({
    estUnePaire: true, credenceEstLaReponse: false, credenceDemandee: true,
    gestes: [], versionFinale: false, sansEcriture: [true, true],
  })
  assert.equal(suite.filter((s) => s.etape === 'ecrire').length, 0)
  assert.equal(suite.filter((s) => s.etape === 'designer').length, 2)
})

test('sans le drapeau, rien ne bouge — les exercices d’avant ce lot', () => {
  const avant = etapesServies({
    estUnePaire: true, credenceEstLaReponse: false, credenceDemandee: true,
    gestes: ['conditions'], versionFinale: false,
  })
  assert.equal(avant.filter((s) => s.etape === 'designer').length, 0)
  assert.equal(avant.filter((s) => s.etape === 'ecrire').length, 2)
})

test('⛔ le titre ne promet plus « ce que tu en dis » là où l’élève ne dit rien', () => {
  assert.equal(titreDeLEtape('designer', 'surligner'), 'Le passage à surligner')
  assert.equal(titreDeLEtape('ecrire', 'surligner'), 'Ce que tu en dis')
  assert.equal(libelleDuVoletDeTravail('designer'), 'Surligner')
})
