import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PLAFOND_SORTIE_DEFAUT, PLAFOND_SORTIE_MAX,
  motifDeTroncature, plafondApresTroncature,
} from './plafond-sortie'

test('⭐⭐ une troncature DOUBLE le plafond — le défaut mesuré en prod le 31/08', () => {
  // Le cas réel : deux appels `p1 / structure` à exactement 2 000 jetons sur le
  // dépôt `c1431dc5`, aucun `p2`, et la compétence absente des mesures. Avec
  // cette règle, la relance repart à 4 000 et la sortie tient.
  assert.equal(plafondApresTroncature(PLAFOND_SORTIE_DEFAUT, PLAFOND_SORTIE_DEFAUT), 4000)
  assert.equal(plafondApresTroncature(4000, PLAFOND_SORTIE_DEFAUT), PLAFOND_SORTIE_MAX)
})

test('⛔ le plafond haut ne fait JAMAIS baisser ce que l’appelant a demandé', () => {
  // `utils/generateur/generateur-serveur.ts` demande 16 000. Un `Math.min` nu
  // contre PLAFOND_SORTIE_MAX le ramènerait à 8 000 : la relance serait PLUS
  // COURTE que l'appel qu'elle répare.
  assert.equal(plafondApresTroncature(16000, 16000), 32000)
  assert.ok(plafondApresTroncature(16000, 16000) > 16000,
    'la relance d’un appelant à 16 000 ne doit jamais redescendre')
  // `utils/passation/transcription.ts` demande 8 000 — déjà la borne : pas de
  // marge, et c'est légitime. Ce qui compte est qu'il ne DESCENDE pas.
  assert.equal(plafondApresTroncature(8000, 8000), 16000)
})

test('au plafond haut, la relance ne prétend pas en être une', () => {
  // `courant` déjà à la borne et `initial` au défaut : rien à relever.
  assert.equal(plafondApresTroncature(PLAFOND_SORTIE_MAX, PLAFOND_SORTIE_DEFAUT),
    PLAFOND_SORTIE_MAX)
  assert.match(motifDeTroncature(PLAFOND_SORTIE_MAX, PLAFOND_SORTIE_MAX),
    /déjà le plafond haut/)
})

test('⭐ le motif NOMME la troncature — sans lui, l’alerte accuse le modèle', () => {
  const m = motifDeTroncature(2000, 4000)
  assert.match(m, /COUPÉE/)
  assert.match(m, /2000/)
  assert.match(m, /4000/)
})

test('la règle est monotone et ne rend jamais moins que le plafond courant', () => {
  for (const initial of [500, 2000, 4000, 8000, 16000]) {
    let courant = initial
    for (let i = 0; i < 6; i += 1) {
      const suivant = plafondApresTroncature(courant, initial)
      assert.ok(suivant >= courant,
        `plafond ${courant} → ${suivant} : une relance ne rétrécit jamais`)
      assert.ok(suivant >= initial,
        `plafond ${suivant} est passé sous la demande de l’appelant (${initial})`)
      courant = suivant
    }
    // Elle CONVERGE : une boucle de troncatures ne peut pas coûter indéfiniment.
    assert.equal(courant, Math.max(PLAFOND_SORTIE_MAX, initial * 2),
      'la borne haute doit être atteinte, et ne plus bouger')
  }
})
