import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as calendrier from '../calendrier-grille'
import * as fuseau from '../fuseau'

const code = ts.transpileModule(readFileSync(new URL('./signaux-tableau.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
function decor(actif = false, attente = Promise.resolve()) {
  const appels: Array<{ nom: string; args: unknown[] }> = []
  const lire = (nom: string, resultat: unknown) => async (...args: unknown[]) => {
    appels.push({ nom, args }); await attente; return resultat
  }
  const deps: Record<string, unknown> = {
    'server-only': {}, '@/utils/calendrier-grille': calendrier, '@/utils/fuseau': fuseau,
    '@/utils/fuseau-serveur': { lireFuseau: async () => 'America/Toronto' },
    '@/utils/acces': { moduleIdsDesClasses: lire('modules', new Set(['a', 's', 'q'])) },
    '@/utils/scriptorium-rag': { lireReglagesRag: lire('rag', { actif }) },
    '@/utils/codex-onglets/liste': { retoursDExamenALire: lire('examens', [{ id: 'retour' }]) },
    './semaine-serveur': { signalDeLaSemaine: lire('semaine', { aFaire: true }) },
    './bonus-serveur': { signalDuPush: lire('push', { aSuggerer: true }) },
    './fiche-serveur': { fichesDejaServies: lire('fiche', false) },
  }
  const exports = {}
  runInNewContext(code, { exports, require: (nom: string) => {
    if (!(nom in deps)) throw new Error(nom)
    return deps[nom]
  } })
  const sut = exports as typeof import('./signaux-tableau')
  const db = { from: () => ({ select: () => ({ in: async () => ({ data: [
    { id: 'a', slug: 'aletheia', actif: true },
    { id: 's', slug: 'scriptorium', actif: true },
    { id: 'q', slug: 'quazian', actif: false },
  ] }) }) }) } as unknown as Parameters<typeof sut.chargerSignauxTableau>[0]
  return { appels, charger: (classes: Array<{ classe_id: string; classe_nom: string }>) =>
    sut.chargerSignauxTableau(db, db, 'eleve', classes) }
}
const normaliser = <T>(x: T): T => JSON.parse(JSON.stringify(x))

test('tableau élève : tous les lecteurs indépendants démarrent sans attendre le premier', async () => {
  let liberer!: () => void
  const d = decor(false, new Promise<void>((r) => { liberer = r }))
  const resultat = d.charger([{ classe_id: 'c1', classe_nom: 'Classe 1' }, { classe_id: 'c2', classe_nom: 'Classe 2' }])
  try {
    await new Promise<void>((r) => setImmediate(r))
    assert.deepEqual(d.appels.map((a) => a.nom).sort(), ['examens', 'fiche', 'modules', 'push', 'rag', 'semaine', 'semaine'])
  } finally { liberer() }
  const r = await resultat
  assert.deepEqual(normaliser(r.semaines.map((s) => s.classe)), ['Classe 1', 'Classe 2'])
  assert.equal(d.appels.filter((a) => a.nom === 'push').length, 1)
  assert.deepEqual(normaliser(d.appels.find((a) => a.nom === 'push')!.args[2]), ['c1', 'c2'])
  assert.deepEqual(normaliser(d.appels.find((a) => a.nom === 'modules')!.args[1]), ['c1', 'c2'])
  assert.deepEqual(normaliser(r.modulesActifs.map((m) => m.slug)), ['aletheia'])
  assert.equal(r.fichesVues, false)
  assert.deepEqual(normaliser(r.examensALire), [{ id: 'retour' }])
})

test('tableau élève : une classe sélectionnée conserve son périmètre ; RAG ON autorise Scriptorium', async () => {
  const d = decor(true)
  const r = await d.charger([{ classe_id: 'c2', classe_nom: 'Classe 2' }])
  assert.deepEqual(normaliser(r.semaines.map((s) => s.classe)), ['Classe 2'])
  assert.deepEqual(normaliser(d.appels.find((a) => a.nom === 'modules')!.args[1]), ['c2'])
  assert.deepEqual(normaliser(r.modulesActifs.map((m) => m.slug)), ['aletheia', 'scriptorium'])
})

test('tableau élève : sans inscription, aucun signal personnel demandé', async () => {
  const d = decor()
  const r = await d.charger([])
  assert.ok(d.appels.every((a) => ['modules', 'rag'].includes(a.nom)))
  assert.deepEqual(normaliser(r.semaines), [])
  assert.equal(r.push, null)
  assert.equal(r.fichesVues, true)
  assert.deepEqual(normaliser(r.examensALire), [])
})
