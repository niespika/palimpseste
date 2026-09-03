// Fragments (élève) — la carte « à faire maintenant » : une chose à la fois, dans l'ordre des urgences.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { carteAFaire, type FaitsAFaire } from './fragments-a-faire'

const semaine = { numero: 5, reclamee: true, limite: 'dimanche 27 septembre', echue: false }

const base: FaitsAFaire = {
  themeStatut: 'valide',
  semaine,
  depose: false,
  depotEnRetard: false,
  retourDeLaSemaine: false,
  gateActif: false,
  retoursAilleurs: [],
}

test('la semaine réclamée, sans dépôt : « dépose ton fragment », avec l’échéance et le bouton', () => {
  const c = carteAFaire(base)
  assert.equal(c.genre, 'a_deposer')
  assert.match(c.titre, /Semaine 5/)
  assert.match(c.texte, /dimanche 27 septembre/)
  assert.deepEqual(c.action, { libelle: 'Déposer', href: '#depot' })
})

test('le gate passe avant TOUT — même avant un fragment en retard et un thème vide', () => {
  const c = carteAFaire({ ...base, gateActif: true, themeStatut: 'vide', semaine: { ...semaine, echue: true } })
  assert.equal(c.genre, 'retour_a_lire')
  assert.equal(c.action?.href, '#retour')
})

test('un retour non lu ailleurs bloque le dépôt : la carte y mène', () => {
  const c = carteAFaire({ ...base, retoursAilleurs: [{ label: 'Codex — retour', href: '/eleve/modules/codex' }] })
  assert.equal(c.genre, 'bloque_ailleurs')
  assert.equal(c.action?.href, '/eleve/modules/codex')
  assert.match(c.texte, /Codex — retour/)
  const deux = carteAFaire({ ...base, retoursAilleurs: [{ label: 'a', href: '/a' }, { label: 'b', href: '/b' }] })
  assert.match(deux.titre, /Des retours/)
  assert.equal(deux.action?.href, '/a')
})

test('l’échéance passée sans dépôt : en retard, ton minium, et on peut encore déposer', () => {
  const c = carteAFaire({ ...base, semaine: { ...semaine, echue: true } })
  assert.equal(c.genre, 'en_retard')
  assert.equal(c.ton, 'retard')
  assert.equal(c.action?.href, '#depot')
})

test('une semaine NON réclamée échue ne met personne en retard (C8-L4) : facultatif', () => {
  const c = carteAFaire({ ...base, semaine: { ...semaine, reclamee: false, echue: true } })
  assert.equal(c.genre, 'facultatif')
  assert.equal(c.ton, 'neutre')
})

test('le thème passe avant le dépôt de la semaine : vide → l’écrire ; commenté → répondre', () => {
  assert.equal(carteAFaire({ ...base, themeStatut: 'vide' }).genre, 'theme_a_ecrire')
  assert.equal(carteAFaire({ ...base, themeStatut: 'vide' }).action?.href, '#theme')
  assert.equal(carteAFaire({ ...base, themeStatut: 'commente' }).genre, 'theme_commente')
  // … mais pas avant un fragment EN RETARD (urgence 90 contre 85).
  assert.equal(carteAFaire({ ...base, themeStatut: 'commente', semaine: { ...semaine, echue: true } }).genre, 'en_retard')
})

test('déposé sans retour : en préparation, sans bouton ; en retard, on le dit', () => {
  const c = carteAFaire({ ...base, depose: true })
  assert.equal(c.genre, 'retour_en_preparation')
  assert.equal(c.action, null)
  assert.match(carteAFaire({ ...base, depose: true, depotEnRetard: true }).titre, /en retard/)
})

test('déposé, retour publié et lu : à jour', () => {
  const c = carteAFaire({ ...base, depose: true, retourDeLaSemaine: true })
  assert.equal(c.genre, 'a_jour')
  assert.equal(c.ton, 'ok')
})

test('aucune semaine ouverte : la carte le dit, sans bouton — mais le thème vide passe avant', () => {
  assert.equal(carteAFaire({ ...base, semaine: null }).genre, 'aucune_semaine')
  assert.equal(carteAFaire({ ...base, semaine: null, themeStatut: 'vide' }).genre, 'theme_a_ecrire')
})
