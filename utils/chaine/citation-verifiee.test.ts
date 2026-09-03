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

// ============================================================================
// ⭐⭐ 31/08 — LE CO-TEXTE, LE TROISIÈME TEXTE.
// ----------------------------------------------------------------------------
// Aux crans de production (2·6·8) l'exercice DONNE une matière : l'argument à
// illustrer, les paragraphes à coudre. Ce co-texte est un VRAI, tiré de
// `banque.json` (`mat-exemple-composer-cotexte`) — pas une invention de test.
// ⛔ Il n'est PAS une source d'ancrage : `ancrage.source` reste `copie` ou
//    `texte_support`. Il ne sert qu'à NOMMER la provenance quand une citation
//    étiquetée « copie » est en réalité l'énoncé qu'on avait donné à l'élève.
// ============================================================================

const CO_TEXTE = "Se passer de réseaux sociaux n'est pas seulement une affaire de volonté. "
  + "Quand un groupe entier organise sa vie commune sur une messagerie, celui qui n'y est pas "
  + 'ne renonce pas à un divertissement : il perd l’information ordinaire que les autres '
  + 'échangent sans même y penser.'

test('⛔⛔ une citation « copie » qui est en fait L’ÉNONCÉ est écartée, et NOMMÉE', () => {
  // Le pire des cas : l'élève lirait sa propre consigne sous « tu écris ».
  const a = { source: 'copie' as const, citation: "il perd l'information ordinaire" }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null, coTexte: CO_TEXTE })
  assert.equal(j.ancrage, null)
  assert.match(j.motif ?? '', /DU TEXTE DE DÉPART/)
})

test('le co-texte ne gêne pas une citation légitime de la copie', () => {
  const a = { source: 'copie' as const, citation: 'un temps de repos' }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null, coTexte: CO_TEXTE })
  assert.deepEqual(j.ancrage, a)
  assert.equal(j.motif, null)
})

test('sans co-texte, le contrôle se comporte exactement comme avant', () => {
  const a = { source: 'copie' as const, citation: "il perd l'information ordinaire" }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null })
  assert.equal(j.ancrage, null)
  assert.match(j.motif ?? '', /introuvable dans la copie/)
})

// ============================================================================
// ⭐⭐ 02/09 — LA RÉPARATION : le code sert le texte de l'ÉLÈVE, pas celui du modèle.
// ============================================================================

test('⭐⭐ une citation à un détail près est RÉPARÉE — la citation servie est celle de la copie', () => {
  // « Tout dabord » : l'élève n'a pas mis d'apostrophe, le modèle l'a « corrigé ».
  const a = { source: 'copie' as const, citation: "Tout d'abord, les vacances sont un temps de repos." }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null })
  assert.ok(j.ancrage)
  // ⚠️ La ponctuation finale tombe avec le pliage : les bornes s'arrêtent au dernier mot.
  assert.equal(j.ancrage!.citation, 'Tout dabord, les vacances sont un temps de repos')
  assert.equal(j.ancrage!.source, 'copie')
  assert.match(j.motif ?? '', /^citation réparée \(normalisation\) : /)
})

test('une citation où le modèle a changé UN mot est réparée par l\'approché, et le motif porte le score', () => {
  const a = { source: 'copie' as const, citation: "Ensuite, travailler durant l'été permet de gagner un peu d'argent de poche." }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null })
  assert.equal(j.ancrage!.citation, "Ensuite, travailler pendant l'été permet de gagner un peu d'argent de poche")
  assert.match(j.motif ?? '', /réparée \(approché 0\.9\d\)/)
})

test('une citation qui ne diffère que par la casse tient à l\'étage exact : elle est servie telle quelle', () => {
  const a = { source: 'copie' as const, citation: 'LES VACANCES SONT UN TEMPS DE REPOS' }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null })
  assert.deepEqual(j.ancrage, a)
  assert.equal(j.motif, null)
})

test('⛔ la réparation ne touche pas à RR3 : une phrase du texte support reste écartée et nommée', () => {
  const a = { source: 'copie' as const, citation: 'car ce qui est dissous est sans sensation' }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: TEXTE_SUPPORT })
  assert.equal(j.ancrage, null)
  assert.match(j.motif ?? '', /phrase DU TEXTE SUPPORT/)
})

test('⛔ une citation composée reste écartée, et le motif dit pourquoi quand il le sait', () => {
  const a = { source: 'copie' as const, citation: 'les vacances servent à se reposer et à gagner de l\'argent' }
  const j = jugerLAncrage(a, { production: COPIE, texteSupport: null })
  assert.equal(j.ancrage, null)
  assert.match(j.motif ?? '', /citation écartée — introuvable dans la copie/)
})
