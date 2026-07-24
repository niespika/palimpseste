import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cibleInterneSure } from './redirection-interne'

const O = 'https://palimpseste.ink'
const D = '/finaliser-inscription'

// ── Chemins internes légitimes : conservés (query/hash préservés) ─────────────
test('cibleInterneSure : chemin interne simple conservé', () => {
  assert.equal(cibleInterneSure('/finaliser-inscription', O, D), '/finaliser-inscription')
  assert.equal(cibleInterneSure('/eleve', O, D), '/eleve')
})

test('cibleInterneSure : query et hash préservés', () => {
  assert.equal(cibleInterneSure('/eleve?x=1#frag', O, D), '/eleve?x=1#frag')
})

test('cibleInterneSure : racine « / » acceptée', () => {
  assert.equal(cibleInterneSure('/', O, D), '/')
})

// ── Open redirect : toutes les formes hors-site → défaut ──────────────────────
test('cibleInterneSure : protocol-relative « //evil » rejeté', () => {
  assert.equal(cibleInterneSure('//evil.com', O, D), D)
  assert.equal(cibleInterneSure('//evil.com/path', O, D), D)
})

test('cibleInterneSure : backslash « /\\evil » (normalisé en //) rejeté', () => {
  assert.equal(cibleInterneSure('/\\evil.com', O, D), D)
})

test('cibleInterneSure : URL absolue (même schéma ou autre) rejetée', () => {
  assert.equal(cibleInterneSure('https://evil.com', O, D), D)
  assert.equal(cibleInterneSure('http://evil.com/x', O, D), D)
  assert.equal(cibleInterneSure('https://palimpseste.ink.evil.com', O, D), D)
})

test('cibleInterneSure : injection de tabulation/CRLF (supprimée par le parseur) rejetée', () => {
  assert.equal(cibleInterneSure('/\t/evil.com', O, D), D)
  assert.equal(cibleInterneSure('/\r\n//evil.com', O, D), D)
})

test('cibleInterneSure : contournement par NORMALISATION de chemin (// reconstruit) rejeté', () => {
  // La normalisation WHATWG garde notre origine mais reconstruit un pathname « //evil.com »
  // qui redevient externe une fois re-parsé par l'appelant → doit tomber sur le défaut.
  assert.equal(cibleInterneSure('/.//evil.com', O, D), D)
  assert.equal(cibleInterneSure('/..//evil.com', O, D), D)
  assert.equal(cibleInterneSure('/%2e//evil.com', O, D), D)
  assert.equal(cibleInterneSure('/./\\/evil.com', O, D), D)
  assert.equal(cibleInterneSure('/.//.//evil.com', O, D), D)
})

test('cibleInterneSure : schéma exotique / relatif sans « / » → défaut', () => {
  assert.equal(cibleInterneSure('javascript:alert(1)', O, D), D)
  assert.equal(cibleInterneSure('relative/path', O, D), D)
  assert.equal(cibleInterneSure('mailto:x@y.z', O, D), D)
})

test('cibleInterneSure : null / undefined / vide → défaut', () => {
  assert.equal(cibleInterneSure(null, O, D), D)
  assert.equal(cibleInterneSure(undefined, O, D), D)
  assert.equal(cibleInterneSure('', O, D), D)
})

// ── Cas limites internes : restent sur notre origine (donc sûrs) ──────────────
test('cibleInterneSure : « %2F » encodé reste interne (404 chez nous, jamais externe)', () => {
  // Non décodé par le parseur → le chemin reste sur notre hôte : pas de fuite.
  const out = cibleInterneSure('/%2F%2Fevil.com', O, D)
  assert.equal(out, '/%2F%2Fevil.com')
})

test('cibleInterneSure : la sortie reste TOUJOURS sur notre origine (jamais off-site)', () => {
  // Garde-fou fort : on re-résout la sortie et on exige la même origine — une cible
  // « //evil.com » satisferait startsWith('/') tout en fuyant, d'où le contrôle d'origine.
  const attaques = [
    '//evil.com', '/\\evil.com', 'https://evil.com', '/\t/evil.com',
    '/.//evil.com', '/..//evil.com', '/%2e//evil.com', '/./\\/evil.com',
  ]
  for (const next of [...attaques, '/ok', '/', '/a?b#c']) {
    const out = cibleInterneSure(next, O, D)
    assert.ok(out.startsWith('/') && !out.startsWith('//') && !out.startsWith('/\\'), `sortie non interne pour ${JSON.stringify(next)} → ${JSON.stringify(out)}`)
    assert.equal(new URL(out, O).origin, O, `sortie hors-origine pour ${JSON.stringify(next)} → ${JSON.stringify(out)}`)
  }
})
