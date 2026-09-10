// Contrôles serveur hors Next, sans base ni appel IA :
// node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./scripts/register-calibration-resolver.mjs --test scripts/recette/fermeture-pilote-argument.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { portePilote, lireContratPilote } from '../../utils/pilote-argument/serveur.ts'

function baseParametres(resultat) {
  const lectures = []
  const admin = { from(table) {
    lectures.push(table)
    assert.equal(table, 'scriptorium_params', 'Un pilote fermé ne lit pas les contrats')
    return { select(champs) {
      assert.equal(champs, 'pilote_argument_actif')
      return { eq(cle, valeur) {
        assert.equal(cle, 'id'); assert.equal(valeur, 1)
        return { async maybeSingle() { return resultat } }
      } }
    } }
  } }
  return { admin, lectures }
}

test('un exercice ordinaire ne lit ni le flag ni les nouvelles tables', async () => {
  const admin = { from() { assert.fail('Aucune requête pilote attendue') } }
  for (const idImport of [null, undefined, '', 'existant-argument-6']) {
    assert.equal(await lireContratPilote(admin, 'exercice-ordinaire', idImport), null)
  }
})

test('avant migration ou avec flag OFF, un pilote reste inaccessible avant toute lecture du contrat', async () => {
  const resultats = [
    { data: { pilote_argument_actif: false }, error: null },
    { data: null, error: null },
    { data: null, error: { code: '42703', message: 'colonne absente' } },
    { data: null, error: { code: 'PGRST204', message: 'colonne absente du cache' } },
  ]
  for (const resultat of resultats) {
    const { admin, lectures } = baseParametres(resultat)
    assert.equal(await portePilote(admin), false)
    await assert.rejects(lireContratPilote(admin, 'exercice-pilote', 'pilote-argument-exemple'), /pilote argument est fermé/)
    assert.deepEqual(lectures, ['scriptorium_params','scriptorium_params'])
  }
})

test('seul true ouvre la porte, une panne reste une erreur explicite', async () => {
  for (const valeur of [false, null, undefined, 1, 'true', true]) {
    const { admin } = baseParametres({ data: { pilote_argument_actif: valeur }, error: null })
    assert.equal(await portePilote(admin), valeur === true)
  }
  const { admin } = baseParametres({ data: null, error: { code: '08006', message: 'connexion interrompue' } })
  await assert.rejects(portePilote(admin), /Porte pilote illisible.*connexion interrompue/)
})
