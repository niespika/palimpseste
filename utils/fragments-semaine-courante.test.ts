import test from 'node:test'
import assert from 'node:assert/strict'
import { semaineCourante } from './fragments-semaine-courante'

const S = (n: number | null, debut: string, extra: Partial<{ ouverte: boolean; is_vacation: boolean }> = {}) => ({
  id: `s${n ?? 'v'}-${debut}`,
  numero: n,
  date_debut: debut,
  ouverte: extra.ouverte ?? false,
  is_vacation: extra.is_vacation ?? false,
})

// Le semestre 1 mesuré en prod le 13/09 : compte à partir de la S3.
const semaines = [
  S(1, '2026-08-24'), S(2, '2026-08-31'), S(3, '2026-09-07', { ouverte: true }),
  S(4, '2026-09-14'), S(5, '2026-09-21'), S(null, '2026-10-26', { is_vacation: true }),
  S(10, '2026-11-02'),
]


test('semaineCourante — rend la semaine demandée par l’URL quand elle existe', () => {
    assert.equal(semaineCourante(semaines, 3, '2026-09-13', 's5-2026-09-21')?.numero, 5)
})
test('semaineCourante — ignore une semaine demandée qui n’existe pas', () => {
    assert.equal(semaineCourante(semaines, 3, '2026-09-13', 'inconnue')?.numero, 3)
})
test('semaineCourante — préfère la semaine OUVERTE, même si aujourd’hui est ailleurs', () => {
    assert.equal(semaineCourante(semaines, 3, '2026-11-05')?.numero, 3)
})
test('semaineCourante — sans semaine ouverte, prend celle qui contient aujourd’hui', () => {
    const fermees = semaines.map((s) => ({ ...s, ouverte: false }))
    assert.equal(semaineCourante(fermees, 3, '2026-09-16')?.numero, 4)
})
test('semaineCourante — pendant les vacances, remonte à la dernière semaine comptée', () => {
    const fermees = semaines.map((s) => ({ ...s, ouverte: false }))
    assert.equal(semaineCourante(fermees, 3, '2026-10-28')?.numero, 5)
})
test('semaineCourante — avant la première semaine comptée, l’ouvre quand même (jamais la S1)', () => {
    const fermees = semaines.map((s) => ({ ...s, ouverte: false }))
    assert.equal(semaineCourante(fermees, 3, '2026-08-25')?.numero, 3)
})
test('semaineCourante — rend null sans aucune semaine', () => {
    assert.equal(semaineCourante([], 3, '2026-09-13'), null)
})
test('semaineCourante — une semaine de vacances demandée par l’URL est ignorée', () => {
  assert.equal(semaineCourante(semaines, 3, '2026-09-13', 'sv-2026-10-26')?.numero, 3)
})
