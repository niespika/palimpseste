// ⭐⭐ Le contrôle qui décide de ce que l'élève lit sous « Tu écris ».
//    Les cas ci-dessous sont TIRÉS DE LA PRODUCTION du 31/08/2026 — pas
//    inventés : chacun est une citation qu'un retour a réellement portée.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { citationTient, jugerLAncrage } from './citation-verifiee'

const COPIE = [
  "Tout dabord, les vacances sont un temps de repos.",
  "Ensuite, travailler pendant l'été permet de gagner un peu d'argent de poche.",
  "Finalement, cela démontre une certaine déshumanisation des élèves, en",
  "négligeant leur bien-être, et d'une certaine manière une certaine fermeture",
  "d'esprit.",
].join('\n')

const TEXTE_SUPPORT = "La mort n'est rien pour nous, car ce qui est dissous est sans sensation."

test('une citation verbatim tient', () => {
  assert.equal(citationTient(COPIE, 'les vacances sont un temps de repos'), true)
})

test('⭐⭐ UNE CITATION ÉLIDÉE TIENT — le contrôle strict la refusait à tort', () => {
  // ⛔ MESURÉ : 7 des 56 citations que le contrôle verbatim strict refusait
  //    étaient de cette forme — trois occurrences d'un même tic, reliées par
  //    des points de suspension. Ce test est la preuve du correctif.
  const elidee = 'une certaine déshumanisation [...] une certaine fermeture'
  assert.equal(citationTient(COPIE, elidee), true)
  assert.equal(citationTient(COPIE, 'Tout dabord [...] Ensuite [...] Finalement'), true)
  assert.equal(citationTient(COPIE, 'les vacances … un temps de repos'), true)
})

test("une citation composée par le modèle ne tient pas", () => {
  // Le cas réel : « Épicure exploite le concept de mort comme une fausse
  // sensation » — une phrase que PERSONNE n'a écrite, servie sous « tu écris ».
  assert.equal(citationTient(COPIE, 'les vacances servent à se reposer'), false)
})

test("⛔ l'élision ne fait pas passer n'importe quoi : chaque morceau est exigé", () => {
  assert.equal(citationTient(COPIE, 'les vacances sont un temps de repos [...] et ceci est faux'), false)
})

test('⛔ IL ÉCHOUE FERMÉ — sans production, rien ne se sert', () => {
  assert.equal(citationTient(null, 'les vacances sont un temps de repos'), false)
  assert.equal(citationTient('', 'les vacances sont un temps de repos'), false)
})

test('⛔ une citation réduite à des miettes sous le plancher ne tient pas', () => {
  assert.equal(citationTient(COPIE, '… … …'), false)
  assert.equal(citationTient(COPIE, 'et'), false)
})

test('la comparaison est celle de `citationsIntrouvables` : guillemets et apostrophes aplatis', () => {
  assert.equal(citationTient(COPIE, "d’une certaine manière"), true)
  assert.equal(citationTient(COPIE, '« les vacances sont un temps de repos »'), true)
})

test('un ancrage vérifié passe tel quel', () => {
  const a = { source: 'copie' as const, citation: 'un temps de repos' }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null })
  assert.deepEqual(j.ancrage, a)
  assert.equal(j.motif, null)
})

test("⭐⭐ RR3 — une citation « copie » qui est une phrase DE L'AUTEUR est écartée, et NOMMÉE", () => {
  const a = { source: 'copie' as const, citation: "car ce qui est dissous est sans sensation" }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: TEXTE_SUPPORT })
  assert.equal(j.ancrage, null)
  assert.match(j.motif ?? '', /phrase DU TEXTE SUPPORT/)
})

test('une citation introuvable partout est écartée, sans que le point soit perdu', () => {
  const a = { source: 'copie' as const, citation: 'une phrase que personne n’a écrite ici' }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: TEXTE_SUPPORT })
  assert.equal(j.ancrage, null)
  assert.match(j.motif ?? '', /introuvable dans la copie/)
})

test('un ancrage « texte_support » se vérifie contre le texte servi, pas contre la copie', () => {
  const a = { source: 'texte_support' as const, citation: "La mort n'est rien pour nous" }
  assert.deepEqual(
    jugerLAncrage(a, { production: COPIE, texteSupport: TEXTE_SUPPORT }).ancrage, a)
  assert.equal(
    jugerLAncrage(a, { production: COPIE, texteSupport: null }).ancrage, null)
})

test('un ancrage absent ou vide ne produit aucun motif — il n’y avait rien à écarter', () => {
  assert.deepEqual(jugerLAncrage(null, { production: COPIE, texteSupport: null }),
    { ancrage: null, motif: null })
  assert.deepEqual(
    jugerLAncrage({ source: 'copie', citation: '  ' }, { production: COPIE, texteSupport: null }),
    { ancrage: null, motif: null })
})
