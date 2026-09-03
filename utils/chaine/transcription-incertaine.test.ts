import { test } from 'node:test'
import assert from 'node:assert/strict'
import { alerteTranscriptionIncertaine, motifDeTranscription } from './transcription-incertaine'

test('une copie saisie au clavier ne dit rien, quelle que soit la confiance', () => {
  assert.equal(alerteTranscriptionIncertaine({ version: 'v1', origine: { transcrite: false, confiance: 0.2 }, seuil: 0.8 }), null)
})

test('une transcription au-dessus du seuil ne dit rien', () => {
  assert.equal(alerteTranscriptionIncertaine({ version: 'v1', origine: { transcrite: true, confiance: 0.958 }, seuil: 0.8 }), null)
  assert.equal(alerteTranscriptionIncertaine({ version: 'v1', origine: { transcrite: true, confiance: 0.8 }, seuil: 0.8 }), null)
})

test('⭐ le cas réel de production : confiance 0,529 → alerte nommée, chiffrée, et abrégée', () => {
  const a = alerteTranscriptionIncertaine({ version: 'v1', origine: { transcrite: true, confiance: 0.529 }, seuil: 0.8 })
  assert.match(a ?? '', /^TRANSCRIPTION INCERTAINE \(v1\) : confiance 0\.53 sous le seuil 0\.80/)
  assert.equal(motifDeTranscription([a!]), ', transcription incertaine (0,53)')
})

test('une seule passe (confiance NULLE) est dite, pas tue', () => {
  const a = alerteTranscriptionIncertaine({ version: 'vf', origine: { transcrite: true, confiance: null }, seuil: 0.8 })
  assert.match(a ?? '', /confiance NULLE/)
  assert.equal(motifDeTranscription([a!]), ', transcription incertaine (nulle)')
})

test('sans alerte, aucun abrégé', () => {
  assert.equal(motifDeTranscription(['autre chose']), '')
})
