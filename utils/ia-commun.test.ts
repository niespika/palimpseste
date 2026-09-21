import { test } from 'node:test'
import assert from 'node:assert/strict'
import { champJsonSuspect, REGLE_JSON_TEXTE } from './ia-commun'

// La forme EXACTE de l'analyse de Nina P. (S3, 21/09) après le schéma : quatre
// champs qui sont les morceaux d'une phrase coupée à un guillemet droit.
test('champJsonSuspect : la signature de Nina — un champ qui commence par une virgule', () => {
  const texte = JSON.stringify({
    transcription: 'Nina …',
    retour_langue: '8. « Pour répondre à la question ',
    retour_style: ', manque de virgules et de guillemets : « Pour répondre à la question ',
    retour_contenu: ',  il faut… » → forme correcte : « Pour répondre à la question ',
    commentaire_general: ' », voici la correction.',
  })
  assert.equal(champJsonSuspect(texte), 'retour_style')
})

test('champJsonSuspect : une réponse saine ne lève rien, tableaux et objets imbriqués compris', () => {
  const texte = '```json\n' + JSON.stringify({
    transcription: '« bonne réponse », elle ne fait que changer.',
    notes: { decouvertes: 2 },
    pistes_nouvelles: ['Lire Montaigne (les Essais).', '… et Rousseau'],
    bilan_pistes: [{ piste_id: 'x', justification: 'Suivie en partie.' }],
  }) + '\n```'
  assert.equal(champJsonSuspect(texte), null)
})

test('champJsonSuspect : un texte qui n’est pas du JSON n’est pas « suspect » (c’est un autre défaut)', () => {
  assert.equal(champJsonSuspect('pas du json'), null)
})

test('champJsonSuspect : dans un tableau, le chemin désigne l’élément', () => {
  assert.equal(champJsonSuspect(JSON.stringify({ oublis: [{ titre: 'ok', detail: ') fin de phrase' }] })), 'oublis[0].detail')
})

test('REGLE_JSON_TEXTE interdit le guillemet droit et propose « »', () => {
  assert.match(REGLE_JSON_TEXTE, /guillemet droit/)
  assert.match(REGLE_JSON_TEXTE, /« … »/)
})
