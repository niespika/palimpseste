// ============================================================================
// C4 · L15 — L'APERÇU DU PROFESSEUR : les deux règles qu'il doit MONTRER.
// ----------------------------------------------------------------------------
// « Une consigne juste au mauvais endroit de l'écran est une consigne fausse, et
//   c'est le seul moment où cela se voit. » L'aperçu est la spécification
//   exécutable du placement : s'il montre autre chose que ce que l'élève verra,
//   il ment. Ce test garde donc, sur la DOCTRINE RÉELLE (`doctrine.fixture.json`,
//   sortie de `scripts/derive-doctrine.py --fixture`) :
//   · ⭐ le MARQUAGE dans le matériau, cran par cran ;
//   · ⭐ le GUIDE REPLIÉ au cran 6, et lui seul — jamais au cran 2 ;
//   · ⛔ le TIRAGE des candidats INCHANGÉ : l'aperçu doit rester stable d'un
//     affichage à l'autre, et ce lot n'y touche pas.
// ============================================================================

import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { assemblerDoctrine, type LignesDoctrine } from './doctrine'
import { composerApercu } from './conception'
import { lireLaBanque } from '../deroule/credence'

const FIXTURE = path.join(process.cwd(), 'utils', 'fabrique', 'doctrine.fixture.json')
const brut = () => JSON.parse(fs.readFileSync(FIXTURE, 'utf-8')) as LignesDoctrine
const doctrine = assemblerDoctrine(brut())

const MATERIAU = 'La preuve est là, donc la conclusion tient.'
const CORRIGE = "La preuve est là, et parce qu'elle l'établit la conclusion tient."

/** Une instance minimale, dont on ne fait varier que ce qu'on éprouve. */
const instance = (cran: number, sur: Record<string, unknown> = {}) => ({
  objet: 'argument', cran,
  materiauSourceTexte: null as string | null,
  materiauCibleTexte: MATERIAU,
  guide: null as string | null,
  cas: [{
    consigne: 'Dis où la raison manque.',
    distracteurs: ['preuve', 'conclusion', 'tient', 'donc alors ici'] as string[] | null,
    reponseAttendue: 'donc',
    pourquoiJuste: null as string | null,
    materiauContenu: MATERIAU,
    materiauVersionCorrigee: CORRIGE as string | null,
  }],
  ...sur,
})

const marques = (a: ReturnType<typeof composerApercu>) =>
  (a!.cas[0].materiauCibleMarque ?? []).filter((s) => s.marque).map((s) => s.texte)

// ── LE MARQUAGE ────────────────────────────────────────────────────────────

test('APERÇU — au cran 1, les QUATRE candidats servis sont mis en évidence', () => {
  const a = composerApercu(doctrine, instance(1))!
  // Ce sont bien LES CANDIDATS QUE L'APERÇU SERT — trois tirés, plus la réponse
  // attendue —, et non la banque : le marquage colle à ce qui s'affiche à côté.
  assert.equal(a.cas[0].candidats.length, 4)
  for (const m of marques(a)) {
    assert.ok(a.cas[0].candidats.includes(m), `« ${m} » n'est pas un candidat servi`)
  }
  // ⚠️ « donc alors ici » fait TROIS mots : c'est un remplacement, pas un
  //    fragment du matériau — il ne se marque pas.
  assert.ok(!marques(a).includes('donc alors ici'))
})

for (const cran of [3, 5]) {
  test(`APERÇU — au cran ${cran}, le passage fautif et LUI SEUL`, () => {
    const a = composerApercu(doctrine, instance(cran))!
    assert.deepEqual(marques(a), ['donc'])
  })
}

for (const cran of [4, 7, 9]) {
  test(`APERÇU — au cran ${cran}, AUCUNE marque : « l'y trouver EST le travail »`, () => {
    const a = composerApercu(doctrine, instance(cran))!
    assert.deepEqual(marques(a), [])
    // Et le matériau est toujours là, entier.
    assert.equal(a.cas[0].materiauCible, MATERIAU)
    assert.equal((a.cas[0].materiauCibleMarque ?? []).map((s) => s.texte).join(''), MATERIAU)
  })
}

test('APERÇU — ⛔ la version corrigée ne ressort d\'AUCUN segment', () => {
  const a = composerApercu(doctrine, instance(3))!
  const rendu = (a.cas[0].materiauCibleMarque ?? []).map((s) => s.texte).join('')
  assert.equal(rendu, MATERIAU)
  for (const mot of ['parce', 'établit']) assert.ok(!rendu.includes(mot))
})

test('APERÇU — ⛔ LE TIRAGE DES CANDIDATS N\'A PAS BOUGÉ : il reste déterministe', () => {
  // « Son tirage est déterministe pour qu'un rechargement ne change pas ce que
  //   le professeur relit. » Le marquage se POSE dessus, il ne le retire pas.
  const banque = Array.from({ length: 12 }, (_, i) => `candidat ${i}`)
  const av = composerApercu(doctrine, instance(1, {
    cas: [{ ...instance(1).cas[0], distracteurs: banque }],
  }))!
  const ap = composerApercu(doctrine, instance(1, {
    cas: [{ ...instance(1).cas[0], distracteurs: banque }],
  }))!
  assert.deepEqual(av.cas[0].candidats, ap.cas[0].candidats)
  assert.equal(av.cas[0].candidats.length, 4)
})

// ── R2b — LES DEUX FORMES PHYSIQUES DU DISTRACTEUR ────────────────────────

test('⛔ R2b — les DEUX formes de distracteur donnent le MÊME marquage', () => {
  // ⚠️ `exercices_cas.distracteurs` porte deux formes en base, aujourd'hui, côte
  //    à côte : des OBJETS `{texte, pourquoi_faux}` à l'import (`08-` §5.2 —
  //    c'est celle que la banque réelle produit) et des CHAÎNES sur une instance
  //    conçue à l'écran. L'aperçu lisait les chaînes seules : sur la forme
  //    d'objet il servait des candidats VIDES et **sous-marquait le matériau**,
  //    un seul mot en évidence côté professeur quand l'élève en voyait quatre.
  // ⭐ `lireLaBanque` est le lecteur de l'écran ÉLÈVE, déjà éprouvé. Ce test
  //    garde que les deux voies passent désormais par lui — et il tombera si
  //    quelqu'un remet un lecteur qui ne connaît qu'une forme.
  const enChaines = ['preuve', 'conclusion', 'tient']
  const enObjets = enChaines.map((t) => ({ texte: t, pourquoi_faux: 'r' }))

  const marquesPour = (distracteurs: unknown) => {
    const a = composerApercu(doctrine, instance(1, {
      cas: [{ ...instance(1).cas[0], distracteurs: lireLaBanque(distracteurs) }],
    }))!
    return {
      candidats: a.cas[0].candidats,
      marques: (a.cas[0].materiauCibleMarque ?? []).filter((x) => x.marque).map((x) => x.texte),
    }
  }

  const chaines = marquesPour(enChaines)
  const objets = marquesPour(enObjets)
  assert.deepEqual(objets, chaines, 'les deux formes doivent rendre le même écran')
  // Et ce n'est pas « pareil parce que les deux sont vides » : QUATRE candidats,
  // et le matériau porte bien des marques.
  assert.equal(objets.candidats.length, 4)
  assert.ok(objets.candidats.every((c) => c.trim() !== ''), 'aucun candidat vide')
  assert.ok(objets.marques.length >= 2, `attendu plusieurs marques — ${JSON.stringify(objets.marques)}`)
})

// ── LE GUIDE ───────────────────────────────────────────────────────────────

const GUIDE_6 = 'Conclusion ? Preuve ? Quelle raison fait que cette preuve-là justifie '
  + 'cette conclusion-là ?'

const production = (cran: number, consigne: string, guide: string | null) => ({
  objet: 'argument', cran,
  materiauSourceTexte: null, materiauCibleTexte: null, guide,
  cas: [{ consigne, distracteurs: null, reponseAttendue: null,
    pourquoiJuste: null, materiauContenu: null, materiauVersionCorrigee: null }],
})

test('GUIDE — au cran 6, le bloc ne se sert PLUS quand la consigne le porte', () => {
  // ⭐⭐ « Les cinq patrons du cran 6 finissent tous par `<les appuis nommés>` :
  //    le guide EST la seconde moitié de la consigne, et le champ le répète.
  //    L'élève lit la même phrase deux fois, à dix lignes d'écart. »
  const a = composerApercu(doctrine, production(6, `Écris l'argument. ${GUIDE_6}`, GUIDE_6))!
  assert.equal(a.guide, null)
})

test('⛔ GUIDE — LE CRAN 2 NE SUIT PAS CETTE RÈGLE : sa case NOMME sans contenir', () => {
  // « Sa case est `<ce qui est servi>`, qui NOMME le guide sans le contenir —
  //   la consigne annonce, le bloc montre. »
  const servi = 'la conclusion et la preuve, fournies'
  const a = composerApercu(doctrine,
    production(2, `Voici ${servi}. Écris l'argument en t'appuyant dessus.`, servi))!
  assert.equal(a.guide, servi, 'au cran 2 le bloc reste servi')
})

test('⚠️ GUIDE — au cran 6, si la consigne NE porte PAS le guide, le bloc RESTE', () => {
  // ⚠️⚠️ LA GARDE. Par la voie d'import, « rien ne contrôle qu'une consigne de
  //    cran 6 porte son guide » : replier ferait d'un cran 6 un cran 8 en
  //    silence — le patron du cran 8 est celui du cran 6 amputé de sa case,
  //    mot pour mot, et la consigne resterait grammaticalement parfaite.
  const a = composerApercu(doctrine, production(6, "Écris l'argument.", GUIDE_6))!
  assert.equal(a.guide, GUIDE_6, "l'étayage ne disparaît pas en silence")
})

test('GUIDE — les blancs ne décident de rien : la comparaison porte sur le texte', () => {
  const a = composerApercu(doctrine,
    production(6, `Écris l'argument.\n  ${GUIDE_6.replace(/ /g, '  ')}`, GUIDE_6))!
  assert.equal(a.guide, null)
})

test('GUIDE — aux sept autres crans, la doctrine le met à `null` et rien ne change', () => {
  for (const cran of [1, 3, 4, 5, 7, 9]) {
    const a = composerApercu(doctrine, instance(cran, { guide: 'un guide égaré' }))!
    assert.equal(a.guide, null, `cran ${cran}`)
  }
  const huit = composerApercu(doctrine, production(8, "Écris l'argument.", 'un guide égaré'))!
  assert.equal(huit.guide, null, 'le cran 8 n\'a pas de guide')
})

// ── LE CAS VIDE — une base qui n'a pas reçu la re-dérivation ───────────────

test('⚠️ SANS LA COLONNE `marquage`, l\'aperçu montre le matériau NON MARQUÉ', () => {
  const rows = brut()
  for (const c of rows.exercices_crans) { delete c.marquage; delete c.longueur }
  const sansColonne = assemblerDoctrine(rows)
  const a = composerApercu(sansColonne, instance(1))!
  assert.deepEqual((a.cas[0].materiauCibleMarque ?? []).filter((s) => s.marque), [])
  assert.equal((a.cas[0].materiauCibleMarque ?? []).map((s) => s.texte).join(''), MATERIAU)
  // ⭐ Et le guide du cran 6, lui, ne dépend PAS des deux colonnes neuves : il
  //    se replie quand même, parce que sa condition vient de `exercices_crans.guide`,
  //    qui est en base depuis C4-L8.
  const g = composerApercu(sansColonne, production(6, `Écris l'argument. ${GUIDE_6}`, GUIDE_6))!
  assert.equal(g.guide, null)
})
