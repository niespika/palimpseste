// ============================================================================
// C4 · L12 — LA CADENCE, ÉPROUVÉE À L'HORLOGE SIMULÉE. « Une coupure ne passe
// par aucun `catch` » : c'est la file qui doit s'arrêter, et le dire.
// ============================================================================

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { enFileBornee, tempsRestantMs } from './cadence'

function horlogeSimulee(budgetMs: number | null) {
  let t = 1_000
  return {
    horloge: { depart: 1_000, budgetMs, maintenant: () => t },
    avance: (ms: number) => { t += ms },
  }
}

describe('tempsRestantMs', () => {
  it('sans borne, rend null — la recette et les scripts ne se coupent pas', () => {
    assert.equal(tempsRestantMs({ depart: 0, budgetMs: null, maintenant: () => 10 }), null)
  })
  it('ne descend jamais sous zéro', () => {
    assert.equal(tempsRestantMs({ depart: 0, budgetMs: 100, maintenant: () => 500 }), 0)
    assert.equal(tempsRestantMs({ depart: 0, budgetMs: 100, maintenant: () => 40 }), 60)
  })
})

describe('enFileBornee', () => {
  it('⭐ traite tout quand le budget tient, dans l’ordre, et ne rend aucun restant', async () => {
    const s = horlogeSimulee(10_000)
    const vus: number[] = []
    const b = await enFileBornee([1, 2, 3, 4, 5], { concurrence: 2, horloge: s.horloge },
      async (n) => { vus.push(n); s.avance(100); return n * 10 })
    assert.deepEqual(vus, [1, 2, 3, 4, 5])
    assert.deepEqual(b.traites.map((t) => t.resultat), [10, 20, 30, 40, 50])
    assert.deepEqual(b.restants, [])
    assert.equal(b.coupeApresMs, null)
  })

  it('⛔⛔ s’ARRÊTE AVANT le budget et REND les restants — le vide s’explique', async () => {
    // Chaque item coûte 100 ms ; le budget en laisse passer trois.
    const s = horlogeSimulee(300)
    const b = await enFileBornee(['a', 'b', 'c', 'd', 'e'], { concurrence: 1, horloge: s.horloge },
      async (x) => { s.avance(100); return x.toUpperCase() })
    assert.deepEqual(b.traites.map((t) => t.resultat), ['A', 'B', 'C'])
    assert.deepEqual(b.restants, ['d', 'e'])
    assert.equal(b.coupeApresMs, 300)
  })

  it('⭐ un item COMMENCÉ va jusqu’au bout — on ne coupe jamais entre décision et dépôt', async () => {
    const s = horlogeSimulee(150)
    let acheves = 0
    const b = await enFileBornee([1, 2, 3], { concurrence: 1, horloge: s.horloge },
      async () => { s.avance(200); acheves += 1; return acheves })
    // Le premier a dépassé le budget en cours de route : il est achevé, pas abandonné.
    assert.equal(acheves, 1)
    assert.deepEqual(b.restants, [2, 3])
  })

  it('⭐ la concurrence est respectée : jamais plus de N de front', async () => {
    const s = horlogeSimulee(null)
    let deFront = 0
    let max = 0
    const b = await enFileBornee(Array.from({ length: 10 }, (_, i) => i),
      { concurrence: 3, horloge: s.horloge },
      async (i) => {
        deFront += 1
        max = Math.max(max, deFront)
        await new Promise((r) => setTimeout(r, 2))
        deFront -= 1
        return i
      })
    assert.equal(max, 3)
    assert.equal(b.traites.length, 10)
    assert.deepEqual(b.restants, [])
  })

  it('sans borne, ne coupe jamais', async () => {
    const s = horlogeSimulee(null)
    const b = await enFileBornee([1, 2, 3], { concurrence: 2, horloge: s.horloge },
      async (n) => { s.avance(1_000_000); return n })
    assert.deepEqual(b.restants, [])
    assert.equal(b.coupeApresMs, null)
  })

  it('une liste vide rend une file vide', async () => {
    const s = horlogeSimulee(10)
    const b = await enFileBornee([], { concurrence: 4, horloge: s.horloge }, async (n: number) => n)
    assert.deepEqual(b.traites, [])
    assert.deepEqual(b.restants, [])
  })
})
