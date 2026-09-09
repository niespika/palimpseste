// Vrai cache React dans de vrais rendus RSC séparés ; seules les I/O sont simulées.
// Lancé par utils/navigation-contexte.test.ts avec la condition react-server.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
const require = createRequire(import.meta.url)
// Même initialisation qu'un serveur Next, y compris le contexte après un await.
require('next/dist/server/node-environment-baseline')
const React = require('react')
const { renderToReadableStream } = require('next/dist/compiled/react-server-dom-webpack/server.edge')
const ts = require('typescript')
const root = new URL('../../../', import.meta.url)
function charger(fichier, deps) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL(fichier, root), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  runInNewContext(code, { exports, process, require: (nom) => {
    if (!(nom in deps)) throw new Error('Dépendance inattendue : ' + nom)
    return deps[nom]
  } })
  return exports
}
const normaliser = (x) => JSON.parse(JSON.stringify(x))
async function rendu(fn) {
  let valeur, erreur
  async function Probe() { valeur = await fn(); return null }
  const stream = renderToReadableStream(React.createElement(Probe), {}, { onError(e) { erreur = e } })
  await new Response(stream).text()
  if (erreur) throw erreur
  return valeur
}
function decor() {
  const lectures = []
  let utilisateur = { id: 'eleve-1' }, role = 'eleve', cookie, instances = 0
  const tables = {
    inscriptions: [
      { id: 'i2', eleve_id: 'eleve-1', classe_id: 'c2', classe: { nom: 'Z' }, statut: 'active' },
      { id: 'i1', eleve_id: 'eleve-1', classe_id: 'c1', classe: [{ nom: 'A' }], statut: 'active' },
      { id: 'i3', eleve_id: 'eleve-2', classe_id: 'c3', classe: null, statut: 'active' },
      { id: 'i4', eleve_id: 'eleve-1', classe_id: 'c4', classe: { nom: 'Ancienne' }, statut: 'inactive' },
    ],
  }
  function client() {
    instances++
    return {
      auth: { async getUser() { lectures.push('auth'); return { data: { user: utilisateur } } } },
      from(table) {
        const filtres = []
        const q = {
          select() { return q }, eq(c, v) { filtres.push([c, v]); return q },
          limit() { return q }, single() { return q }, maybeSingle() { return q },
          then(ok, ko) {
            lectures.push(table)
            const data = table === 'profiles' ? { role, display_name: 'Compte de recette' }
              : table === 'scriptorium_params' ? { routeur_actif: false }
              : (tables[table] ?? []).filter((r) => filtres.every(([c, v]) => r[c] === v))
            return Promise.resolve({ data, error: null }).then(ok, ko)
          },
        }
        return q
      },
    }
  }
  const cookies = async () => ({ get: () => cookie ? { value: cookie } : undefined, getAll: () => [], set() {} })
  const serveur = charger('utils/supabase/server.ts', { '@supabase/ssr': { createServerClient: client }, 'next/headers': { cookies }, react: React })
  const identite = charger('utils/supabase/identite.ts', { 'server-only': {}, react: React, './server': serveur })
  const contexte = charger('app/eleve/contexte-classe.ts', {
    'server-only': {}, react: React, 'next/headers': { cookies },
    './contexte-classe-valeurs': { COOKIE_CLASSE_ELEVE: 'classe', VALEUR_TOUTES: 'toutes' },
  })
  let admins = 0
  const garde = charger('utils/routeur/acces.ts', {
    'next/navigation': { redirect(url) { throw new Error('redirect:' + url) } },
    '@/utils/supabase/identite': identite,
    '@/utils/supabase/admin': { createAdminClient() { admins++; return client() } }, './donnees': {},
  })
  return { ...serveur, ...identite, ...contexte, ...garde, lectures,
    instances: () => instances, admins: () => admins,
    user: (u) => { utilisateur = u }, role: (r) => { role = r }, cookie: (c) => { cookie = c }, tables }
}

test('64 appels concurrents partagent identité/client dans un rendu ; le suivant relit tout', async () => {
  const d = decor()
  await rendu(async () => {
    const r = await Promise.all(Array.from({ length: 64 }, () => d.lireIdentite()))
    assert.ok(r.every((v) => v === r[0]))
    assert.equal(await d.createClient(), r[0].supabase)
  })
  assert.deepEqual(d.lectures, ['auth', 'profiles'])
  assert.equal(d.instances(), 1)
  d.user({ id: 'eleve-2' }); d.role('prof')
  const r = await rendu(d.lireIdentite)
  assert.equal(r.user.id, 'eleve-2')
  assert.equal(r.profile.role, 'prof')
  assert.deepEqual(d.lectures, ['auth', 'profiles', 'auth', 'profiles'])
  assert.equal(d.instances(), 2)
})

test('session absente : aucune lecture du profil ni client administrateur', async () => {
  const d = decor(); d.user(null)
  assert.equal((await rendu(d.lireIdentite)).profile, null)
  await assert.rejects(rendu(() => d.garderProf()), /redirect:\/login/)
  await assert.rejects(rendu(() => d.garderProf(false)), /Non authentifié/)
  assert.ok(d.lectures.every((l) => l === 'auth'))
  assert.equal(d.admins(), 0)
})

test('garde : refus élève, professeur autorisé même flag OFF, rôle relu après révocation', async () => {
  const d = decor()
  await assert.rejects(rendu(() => d.garderProf()), /redirect:\/eleve/)
  await assert.rejects(rendu(() => d.garderProf(false)), /Accès refusé/)
  assert.equal(d.admins(), 0)
  d.role('prof')
  assert.equal((await rendu(() => d.garderProf(false))).routeurActif, false)
  d.role('eleve')
  await assert.rejects(rendu(() => d.garderProf(false)), /Accès refusé/)
  assert.equal(d.admins(), 1)
})

test('contexte partagé, tri et filtrage conservés ; le cookie peut changer dans le même rendu', async () => {
  const d = decor()
  await rendu(async () => {
    const client = await d.createClient()
    const [a, b] = await Promise.all([d.contexteClasseEleve(client, 'eleve-1'), d.contexteClasseEleve(client, 'eleve-1')])
    assert.equal(a.inscriptions, b.inscriptions)
    assert.deepEqual(normaliser(a.inscriptions.map((i) => i.id)), ['i1', 'i2'])
    assert.equal(a.active.id, 'i1')
    d.cookie('i2')
    assert.equal((await d.contexteClasseEleve(client, 'eleve-1')).active.id, 'i2')
    d.cookie('toutes')
    assert.deepEqual(normaliser(await d.classeIdsDuContexte(client, 'eleve-1')), ['c1', 'c2'])
    const autre = await d.contexteClasseEleve(client, 'eleve-2')
    assert.equal(autre.active.id, 'i3')
    assert.equal(autre.toutes, false)
    assert.equal(autre.active.classe_nom, '—')
  })
  assert.deepEqual(d.lectures, ['inscriptions', 'inscriptions'])
  // Nouvelle requête, inscription retirée entre-temps : le cache précédent ne fuit pas.
  d.tables.inscriptions = []
  const r = await rendu(async () => d.contexteClasseEleve(await d.createClient(), 'eleve-1'))
  assert.deepEqual(normaliser(r), { inscriptions: [], active: null, toutes: false })
  assert.equal(d.lectures.length, 3)
})
