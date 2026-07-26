// Tests de la partie PURE des coûts API (C11a-bis) : normalisation d'usage vers
// les 4 compteurs journalisés dans `api_couts`, et prix d'un appel.
// Exécution : `npm test`. Le point sensible est `normaliserUsage` : elle voit
// DEUX formes d'usage en circulation (brute Anthropic aux 12 sites
// Aletheia/Quazian, UsageIA normalisé aux 2 sites Scriptorium) et doit rendre la
// MÊME chose — avec l'écriture de cache TOTALISÉE, tous TTL confondus.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normaliserUsage, coutMessage, coutSelonModele } from './cout-usage'

// ── normaliserUsage — forme BRUTE Anthropic ─────────────────────────────────

test('normaliserUsage (Anthropic) : cas nominal sans cache', () => {
  assert.deepEqual(
    normaliserUsage({ input_tokens: 1200, output_tokens: 340 }),
    { entree: 1200, sortie: 340, cacheLecture: 0, cacheEcriture: 0 },
  )
})

test('normaliserUsage (Anthropic) : cache_creation par TTL → écriture TOTALISÉE', () => {
  // Le patron messagesAvecCache écrit en 1 h ; un mélange 5m+1h reste possible.
  assert.deepEqual(
    normaliserUsage({
      input_tokens: 80,
      output_tokens: 500,
      cache_read_input_tokens: 21000,
      cache_creation_input_tokens: 1500,
      cache_creation: { ephemeral_5m_input_tokens: 500, ephemeral_1h_input_tokens: 1000 },
    }),
    { entree: 80, sortie: 500, cacheLecture: 21000, cacheEcriture: 1500 },
  )
})

test('normaliserUsage (Anthropic) : total d’écriture SEUL (détail par TTL absent)', () => {
  assert.deepEqual(
    normaliserUsage({ input_tokens: 10, output_tokens: 20, cache_creation_input_tokens: 4096 }),
    { entree: 10, sortie: 20, cacheLecture: 0, cacheEcriture: 4096 },
  )
})

test('normaliserUsage (Anthropic) : détail par TTL SEUL (total absent) → rien n’est perdu', () => {
  assert.deepEqual(
    normaliserUsage({
      input_tokens: 10, output_tokens: 20,
      cache_creation: { ephemeral_5m_input_tokens: 300, ephemeral_1h_input_tokens: 700 },
    }),
    { entree: 10, sortie: 20, cacheLecture: 0, cacheEcriture: 1000 },
  )
})

test('normaliserUsage (Anthropic) : champs absents ou nuls → 0, jamais NaN', () => {
  assert.deepEqual(
    normaliserUsage({ input_tokens: 42, cache_read_input_tokens: null, cache_creation_input_tokens: null, cache_creation: null }),
    { entree: 42, sortie: 0, cacheLecture: 0, cacheEcriture: 0 },
  )
})

// ── normaliserUsage — forme NORMALISÉE (UsageIA d'utils/ia-fournisseur) ──────

test('normaliserUsage (UsageIA) : cacheEcriture5m + cacheEcriture1h sont SOMMÉS', () => {
  assert.deepEqual(
    normaliserUsage({ entree: 80, sortie: 500, cacheLecture: 21000, cacheEcriture5m: 500, cacheEcriture1h: 1000 }),
    { entree: 80, sortie: 500, cacheLecture: 21000, cacheEcriture: 1500 },
  )
})

test('normaliserUsage (UsageIA) : Gemini (cache implicite, aucune écriture facturée)', () => {
  assert.deepEqual(
    normaliserUsage({ entree: 4000, sortie: 900, cacheLecture: 12000, cacheEcriture5m: 0, cacheEcriture1h: 0 }),
    { entree: 4000, sortie: 900, cacheLecture: 12000, cacheEcriture: 0 },
  )
})

test('normaliserUsage : les deux formes du MÊME appel donnent le même résultat', () => {
  const brut = normaliserUsage({
    input_tokens: 80, output_tokens: 500, cache_read_input_tokens: 21000,
    cache_creation_input_tokens: 1500,
    cache_creation: { ephemeral_5m_input_tokens: 500, ephemeral_1h_input_tokens: 1000 },
  })
  const normalise = normaliserUsage({
    entree: 80, sortie: 500, cacheLecture: 21000, cacheEcriture5m: 500, cacheEcriture1h: 1000,
  })
  assert.deepEqual(brut, normalise)
})

// ── normaliserUsage — absence d'usage ───────────────────────────────────────

test('normaliserUsage : pas d’usage → null (« non mesuré » ≠ « 0 token »)', () => {
  // La distinction est le cœur de C11a : des colonnes NULL disent « on ne sait
  // pas », des zéros diraient (faussement) « rien n’a été consommé ».
  assert.equal(normaliserUsage(null), null)
  assert.equal(normaliserUsage(undefined), null)
})

test('normaliserUsage : usage vide mais PRÉSENT → compteurs à 0 (l’appel a bien eu lieu)', () => {
  assert.deepEqual(normaliserUsage({}), { entree: 0, sortie: 0, cacheLecture: 0, cacheEcriture: 0 })
})

// ── Prix (non-régression : la tarification ne bouge pas avec C11a-bis) ───────

test('coutMessage : Sonnet, entrée + sortie sans cache', () => {
  // 1 M d'entrée = 3 $, 1 M de sortie = 15 $.
  assert.equal(coutMessage({ input_tokens: 1_000_000, output_tokens: 1_000_000 }), 18)
  assert.equal(coutMessage(null), 0)
})

test('coutMessage : écriture de cache sans détail par TTL → prixée au tarif 5 min (1,25×)', () => {
  assert.equal(coutMessage({ cache_creation_input_tokens: 1_000_000 }), 3 * 1.25)
})

test('coutSelonModele : Haiku facturé à son tarif, modèle inconnu → repli Sonnet', () => {
  const usage = { entree: 1_000_000, sortie: 0, cacheLecture: 0, cacheEcriture5m: 0, cacheEcriture1h: 0 }
  assert.equal(coutSelonModele('claude-haiku-4-5', usage), 1)
  assert.equal(coutSelonModele('modele-jamais-vu', usage), 3)   // repli Sonnet : on préfère sur-estimer
})
