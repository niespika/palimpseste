import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { bornesLues, servirLeTexteSupport, trancheServie } from './texte-support'

// ============================================================================
// C5 · L2 — LE TEXTE D'AUTEUR SERVI À L'ÉLÈVE, TENU PAR UN TEST.
// ----------------------------------------------------------------------------
// Ce que ces vecteurs protègent, et rien d'autre :
//   · c'est L'ENGLOBANT qui s'affiche — « l'étendue réellement lue » (`02-` §6 B.1) ;
//   · la SÉLECTION se marque DEDANS, et ses bornes se ramènent à la tranche ;
//   · ⛔ **PAS UN OCTET N'EST RETOUCHÉ** — la concaténation des segments REND la
//     tranche à l'identique. C'est la promesse de C4-L15, et elle vaut ici mot
//     pour mot : « marquer n'est pas baliser ».
// ============================================================================

// Un texte avec des accents, une apostrophe française, un retour à la ligne et
// des espaces multiples : tout ce qu'une normalisation étourdie détruirait.
const TEXTE = 'Je suppose donc que tout est faux.\nJe me persuade que rien n’a jamais été.\n\n'
  + 'Mais moi, qui suis-je ?  Une chose qui pense.'

describe('les bornes, telles que la base les rend', () => {
  test('un `int[]` de deux bornes se lit ; tout le reste vaut « rien de déclaré »', () => {
    assert.deepEqual(bornesLues([3, 12]), [3, 12])
    assert.equal(bornesLues(null), null)
    assert.equal(bornesLues([]), null)
    assert.equal(bornesLues([5]), null)
    // ⚠️ Fin ≤ début : un intervalle vide n'est pas une sélection.
    assert.equal(bornesLues([7, 7]), null)
    assert.equal(bornesLues([9, 4]), null)
    assert.equal(bornesLues(['a', 'b']), null)
  })
})

describe("la tranche servie — l'englobant, ou le texte entier", () => {
  test('⭐ un englobant absent sert LE TEXTE ENTIER, et non le vide', () => {
    const t = trancheServie(TEXTE, null)
    assert.equal(t.texte, TEXTE)
    assert.deepEqual(t.bornes, [0, TEXTE.length])
  })

  test('un englobant sert exactement sa plage, base 0, fin exclue', () => {
    const t = trancheServie(TEXTE, [3, 11])
    assert.equal(t.texte, TEXTE.slice(3, 11))
    assert.deepEqual(t.bornes, [3, 11])
  })

  test('⚠️ un englobant qui déborde se RABOTE — un écran mort serait pire', () => {
    const t = trancheServie(TEXTE, [10, TEXTE.length + 500])
    assert.equal(t.texte, TEXTE.slice(10))
    assert.deepEqual(t.bornes, [10, TEXTE.length])
  })

  test('un englobant entièrement hors du texte retombe sur le texte entier', () => {
    assert.equal(trancheServie(TEXTE, [900, 950]).texte, TEXTE)
  })
})

describe('la sélection, marquée DANS la tranche', () => {
  test('⛔⛔ PAS UN OCTET RETOUCHÉ : la concaténation des segments EST la tranche', () => {
    for (const englobant of [null, [0, 40], [34, TEXTE.length]] as const) {
      for (const loc of [null, [3, 12], [40, 60]] as const) {
        const servi = servirLeTexteSupport(TEXTE, englobant, loc)
        assert.ok(servi)
        assert.equal(servi.segments.map((s) => s.texte).join(''), servi.texte,
          `englobant ${JSON.stringify(englobant)} · localisation ${JSON.stringify(loc)}`)
      }
    }
  })

  test('⭐ la localisation est marquée, et ses bornes sont celles du TEXTE ENTIER', () => {
    // « Je me persuade » commence au caractère 34 du texte entier.
    const debut = TEXTE.indexOf('Je me persuade')
    const fin = debut + 'Je me persuade'.length
    const servi = servirLeTexteSupport(TEXTE, [debut - 4, fin + 10], [debut, fin])
    assert.ok(servi)
    assert.equal(servi.selectionMarquee, true)
    assert.equal(servi.segments.filter((s) => s.marque).map((s) => s.texte).join(''),
      'Je me persuade')
  })

  test('sans localisation, la tranche est servie EN UN SEUL segment non marqué', () => {
    const servi = servirLeTexteSupport(TEXTE, [0, 20], null)
    assert.ok(servi)
    assert.equal(servi.selectionMarquee, false)
    assert.deepEqual(servi.segments, [{ texte: TEXTE.slice(0, 20), marque: false }])
  })

  test('⚠️ une localisation HORS de l’englobant ne se marque pas — on ne devine pas', () => {
    // `empechementsDeLaSelection` (C5-L1) l'interdit à la saisie ; une instance
    // d'avant ce contrôle peut la porter, et marquer au hasard serait pire.
    const servi = servirLeTexteSupport(TEXTE, [0, 20], [60, 70])
    assert.ok(servi)
    assert.equal(servi.selectionMarquee, false)
    assert.equal(servi.segments.map((s) => s.texte).join(''), servi.texte)
  })

  test('un texte absent ou vide ne sert RIEN — l’écran n’ouvre pas une section vide', () => {
    assert.equal(servirLeTexteSupport(null, null, null), null)
    assert.equal(servirLeTexteSupport('', [0, 5], [0, 2]), null)
  })

  test('la localisation qui couvre TOUTE la tranche rend un seul segment marqué', () => {
    const servi = servirLeTexteSupport(TEXTE, [3, 11], [3, 11])
    assert.ok(servi)
    assert.deepEqual(servi.segments, [{ texte: TEXTE.slice(3, 11), marque: true }])
  })
})
