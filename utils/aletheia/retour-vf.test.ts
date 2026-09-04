// Tests de garde du retour final agi (E7). Exécution : `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { phrasesSynthese, blocPassagesVf, lireNuances, lirePaires, lireCouverture, comparerSynthese, optionsAmont, phraseDuLien } from './retour-vf'

const SYN = 'Platon montre que l’amour désire ce qu’il n’a pas. Diotime en fait une montée vers le Beau. Alcibiade incarne l’échec de cette montée.'

test('la synthèse est numérotée par phrases y{semaine}-{n}, par le découpeur unique', () => {
  const p = phrasesSynthese(3, SYN)
  assert.deepEqual(p.map(x => x.id), ['y3-1', 'y3-2', 'y3-3'])
  assert.equal(p[1].texte, 'Diotime en fait une montée vers le Beau.')
  assert.deepEqual(phrasesSynthese(3, '   '), [])
})

test('le bloc de prompt est vide sans repère, complet avec', () => {
  assert.equal(blocPassagesVf([], [], []), '')
  const b = blocPassagesVf([{ id: 'k3-1', libelle: 'la phrase de Diotime', role: 'these' }], [{ id: 'k2-1', semaine: 2, libelle: 'le mythe', }], phrasesSynthese(3, SYN))
  assert.ok(b.includes('- k3-1 · these — la phrase de Diotime'))
  assert.ok(b.includes('- k2-1 · semaine 2 — le mythe'))
  assert.ok(b.includes('[y3-2] Diotime'))
  assert.ok(b.includes('nuances_detail') && b.includes('architecture_amont_paires') && b.includes('synthese_couverture'))
  // Sans amont : pas de tâche « paires », la couverture est numérotée 7.
  const b2 = blocPassagesVf([{ id: 'k3-1', libelle: 'x', role: 'these' }], [], phrasesSynthese(3, SYN))
  assert.ok(!b2.includes('architecture_amont_paires') && b2.includes('7. COUVERTURE'))
})

test('nuances : passage inconnu → null, une seule priorité 1 qui désigne un passage', () => {
  const ids = new Set(['k3-1', 'k3-2'])
  const n = lireNuances([
    { extrait_eleve: 'Socrate résiste.', passage: 'k9-9', verdict: 'infirme', note: 'n1', priorite: 1 },
    { extrait_eleve: 'Alcibiade est ivre.', passage: 'k3-2', verdict: 'precise', note: 'n2', priorite: 2 },
    { extrait_eleve: '', passage: 'k3-1' },
    { extrait_eleve: 'x', verdict: 'bizarre' },
  ], ids)
  assert.equal(n.length, 3)
  assert.equal(n[0].passage, 'k3-2')          // la première qui désigne un passage passe en tête
  assert.equal(n[0].priorite, 1)
  assert.equal(n[1].passage, null)
  assert.deepEqual(n.map(x => x.priorite), [1, 2, 3])
  assert.equal(n[2].verdict, 'confirme')
  assert.deepEqual(lireNuances('rien', ids), [])
})

test('paires : identifiants connus des deux côtés, sans doublon, relation bornée', () => {
  const p = lirePaires([
    { passage_courant: 'k3-1', passage_amont: 'k2-1', relation: 'reprend le mythe des moitiés pour le dépasser vraiment cette fois-ci encore une fois de plus' },
    { passage_courant: 'k3-1', passage_amont: 'k2-1', relation: 'doublon' },
    { passage_courant: 'k3-1', passage_amont: 'k3-2', relation: 'pas amont' },
    { passage_courant: 'k7-1', passage_amont: 'k2-1', relation: 'pas courant' },
  ], new Set(['k3-1', 'k3-2']), new Set(['k2-1']))
  assert.equal(p.length, 1)
  assert.equal(p[0].relation.split(' ').length, 16)   // une phrase complète tient en 30 mots au plus
})

test('couverture : phrase non jugée = présente ; comparaison par surlignage', () => {
  const ids = ['y3-1', 'y3-2', 'y3-3']
  const c = lireCouverture([{ id: 'y3-2', etat: 'absent' }, { id: 'y3-3', etat: 'absent' }, { id: 'y9-9', etat: 'absent' }], ids)
  assert.deepEqual(c.map(x => x.etat), ['present', 'absent', 'absent'])
  const r1 = comparerSynthese(c, ['y3-2'])
  assert.deepEqual([r1.reperes, r1.manques, r1.deja_la], [['y3-2'], ['y3-3'], []])
  assert.ok(r1.message.startsWith('Tu as repéré 1 des 2 manques'))
  const r2 = comparerSynthese(c, ['y3-1', 'y3-2', 'y3-3'])
  assert.equal(r2.manques.length, 0)
  assert.ok(r2.message.includes('les 2 manques') && r2.message.includes('tu l’avais déjà'))
  const r3 = comparerSynthese(c, [])
  assert.ok(r3.message.includes('t’ont échappé'))
  const r4 = comparerSynthese(lireCouverture([], ids), [])
  assert.ok(r4.message.includes('disait déjà tout'))
})

test('options amont : la bonne est dedans, au plus quatre, ordre du livre, déterministe', () => {
  const tous = [1, 2, 3, 4, 5, 6].map(i => ({ id: `k${i}-1`, semaine: i, libelle: `l${i}` }))
  const o = optionsAmont(tous[4], tous, 17)
  assert.equal(o.length, 4)
  assert.ok(o.some(p => p.id === 'k5-1'))
  assert.deepEqual(o.map(p => p.semaine), [...o.map(p => p.semaine)].sort((a, b) => a - b))
  assert.deepEqual(optionsAmont(tous[4], tous, 17), o)
  assert.deepEqual(optionsAmont(tous[0], [tous[0]], 3).map(p => p.id), ['k1-1'])
})

test('le lien amont devient une phrase lisible seule', () => {
  assert.equal(phraseDuLien('reprend : le moi déforme l’autre comme il déforme le souvenir', 1), 'Cette phrase reprend une idée déjà lue à la séance 1 : le moi déforme l’autre comme il déforme le souvenir.')
  assert.equal(phraseDuLien('précise : connaître transforme le connaissant', null), 'Cette phrase précise une idée déjà lue : connaître transforme le connaissant.')
  assert.equal(phraseDuLien('Cette phrase répond à ce que la séance 1 disait de la morale', 1), 'Cette phrase répond à ce que la séance 1 disait de la morale.')
  assert.equal(phraseDuLien('', 1), '')
})
