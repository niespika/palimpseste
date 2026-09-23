import test from 'node:test'
import assert from 'node:assert/strict'
import { PAGE_POSTGREST, toutesLesPages } from './quazian-pages'

// Une « base » de n lignes servie par pages, comme PostgREST (plafond silencieux).
const base = (n: number) => async (debut: number, fin: number) =>
  ({ data: Array.from({ length: Math.max(0, Math.min(fin, n - 1) - debut + 1) }, (_, i) => debut + i), error: null })

test('toutes les lignes, au-delà du plafond de 1000', async () => {
  for (const n of [0, 1, 999, 1000, 1001, 2500, 3000]) {
    const { data, error } = await toutesLesPages(base(n))
    assert.equal(error, null)
    assert.equal(data.length, n, `n = ${n}`)
    assert.deepEqual(data.slice(-1), n ? [n - 1] : [])
  }
})

test('une page en échec rend l’erreur et aucune ligne (jamais une liste tronquée muette)', async () => {
  let appels = 0
  const { data, error } = await toutesLesPages(async (debut) => {
    appels++
    return debut === 0 ? { data: Array(PAGE_POSTGREST).fill(0), error: null } : { data: null, error: { message: 'panne' } }
  })
  assert.equal(error?.message, 'panne')
  assert.equal(data.length, 0)
  assert.equal(appels, 2)
})
