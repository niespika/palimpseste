// Vrais lecteurs et chargeur ; seule l'interface Supabase est simulée.
// Vérifie surtout le nombre de lectures, la pagination et les erreurs : aucune base distante.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import * as budgets from './budget'
import * as assiduite from './assiduite'

type Ligne = Record<string, unknown>
type Requete = { table: string; head: boolean; range?: [number, number]; filtres: [string, unknown][] }
function base(tables: Record<string, Ligne[]>, panne?: (q: Requete) => boolean) {
  const requetes: Requete[] = []
  return {
    requetes,
    from(table: string) {
      const q: Requete = { table, head: false, filtres: [] }
      const ordre: string[] = []
      let seul = false
      const chaine = {
        select(_c: string, o?: { head?: boolean }) { q.head = !!o?.head; return chaine },
        eq(c: string, v: unknown) { q.filtres.push([c, v]); return chaine },
        in(c: string, v: unknown[]) { q.filtres.push([c, v]); return chaine },
        order(c: string) { ordre.push(c); return chaine },
        range(a: number, b: number) { q.range = [a, b]; return chaine },
        limit(n: number) { q.range = [0, n - 1]; return chaine },
        maybeSingle() { seul = true; return chaine },
        then(ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) {
          requetes.push(q)
          if (panne?.(q)) return Promise.resolve({ data: null, count: null, error: { message: 'panne simulée' } }).then(ok, ko)
          let lignes = (tables[table] ?? []).filter((r) => q.filtres.every(([c, v]) => Array.isArray(v) ? v.includes(r[c]) : r[c] === v))
          lignes = [...lignes].sort((a, b) => {
            for (const c of ordre) {
              const d = String(a[c]).localeCompare(String(b[c]))
              if (d) return d
            }
            return 0
          })
          const count = lignes.length
          // Comme PostgREST : une réponse non paginée ne dépasse pas 1 000 lignes.
          lignes = lignes.slice(q.range?.[0] ?? 0, (q.range?.[1] ?? 999) + 1)
          return Promise.resolve({ data: q.head ? null : seul ? lignes[0] ?? null : lignes, count, error: null }).then(ok, ko)
        },
      }
      return chaine
    },
  }
}

function charger<T>(fichier: string, deps: Record<string, unknown>): T {
  const exports = {}
  const code = ts.transpileModule(readFileSync(new URL('../../' + fichier, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  runInNewContext(code, { exports, require: (nom: string) => {
    if (!(nom in deps)) throw new Error('Dépendance inattendue : ' + nom)
    return deps[nom]
  } })
  return exports as T
}
const lecteurs = charger<typeof import('./donnees')>('utils/routeur/donnees.ts', {
  'server-only': {}, '@/utils/cran': {}, '@/utils/statut-recette': {}, '@/utils/chaine/types': {},
  './assiduite': assiduite,
})
const serveur = charger<typeof import('../../app/prof/routeur/serveur')>('app/prof/routeur/serveur.ts', {
  'server-only': {}, '@/utils/supabase/admin': {}, '@/utils/fuseau-serveur': {}, '@/utils/fuseau': {},
  '@/utils/routeur/donnees': lecteurs, '@/utils/routeur/budget': budgets,
  '@/utils/routeur/assiduite': assiduite, '@/utils/moteur/calendrier-serveur': {}, '@/utils/signalements/serveur': {},
})
const normaliser = <T>(v: T): T => JSON.parse(JSON.stringify(v))
const admin = (b: ReturnType<typeof base>) => b as unknown as Parameters<typeof serveur.chargerBudgets>[0]
function decor(n = 65): Record<string, Ligne[]> {
  return {
    profiles: Array.from({ length: n }, (_, i) => ({
      id: `e${String(i).padStart(4, '0')}`, display_name: `Élève ${String(i).padStart(4, '0')}`, role: 'eleve',
      budget_plancher_min: null, budget_plafond_min: null, budget_optionnel_min: null,
      preference_recueillie_at: null,
    })),
    inscriptions: Array.from({ length: n }, (_, i) => ({
      eleve_id: `e${String(i).padStart(4, '0')}`, classe_id: 'tc', statut: 'active',
      classes: { nom: 'TC', type_pedagogique: 'tc', statut: 'active' },
    })),
    assiduite_hebdo: [],
    scriptorium_params: [{ routeur_actif: true }],
  }
}

test('pilotage : 65 budgets en 8 lectures, et aucun aller-retour individuel', async () => {
  const b = base(decor())
  const r = await serveur.chargerBudgets(admin(b))
  assert.equal(r.eleves.length, 65)
  assert.deepEqual(normaliser(r.incidents), [])
  assert.equal(b.requetes.length, 8)
  assert.ok(b.requetes.every((q) => !q.filtres.some(([c]) => c === 'id')))
  assert.deepEqual(normaliser(r.eleves[0].budget.budget), { plancher: 45, plafond: 60, optionnel: 30 })
  assert.equal(r.routeurActif, true)
})

test('pilotage : bi-classe, réglage, préférence, assiduité et classe inactive conservés', async () => {
  const d = decor(3)
  Object.assign(d.profiles[0], { budget_optionnel_min: 0, preference_recueillie_at: '2026-09-01T12:00:00Z' })
  d.inscriptions.push({ eleve_id: 'e0000', classe_id: 'hlp', statut: 'active', classes: { nom: 'HLP', type_pedagogique: 'hlp', statut: 'active' } })
  d.inscriptions[1].classes = { nom: 'Ancienne classe', type_pedagogique: 'tc', statut: 'inactive' }
  d.inscriptions[2].classes = { nom: 'Classe sans parcours', type_pedagogique: null, statut: 'active' }
  d.assiduite_hebdo.push({ eleve_id: 'e0000', cycle_lundi: '2026-08-31', exercices_assignes: 5, exercices_termines: 4 })
  const r = await serveur.chargerBudgets(admin(base(d)))
  assert.equal(r.nonServis, 2)
  assert.deepEqual(normaliser(r.eleves[0].budget.budget), { plancher: 90, plafond: 120, optionnel: 0 })
  assert.equal(r.eleves[0].preferenceRecueillieAt, '2026-09-01T12:00:00Z')
  assert.ok(r.eleves[0].assiduite)
  assert.equal(r.eleves[1].budget.motifNonServi, 'aucune_inscription')
  assert.equal(r.eleves[2].budget.motifNonServi, 'aucun_parcours')
  assert.match(r.eleves[2].budget.avertissements[0], /Classe sans parcours/)
})

test('pilotage : plus de 1 000 élèves et inscriptions, sans troncature', async () => {
  const b = base(decor(1001))
  const r = await serveur.chargerBudgets(admin(b))
  assert.equal(r.eleves.length, 1001)
  assert.deepEqual(normaliser(r.incidents), [])
  assert.equal(b.requetes.length, 10)
  assert.ok(b.requetes.some((q) => q.table === 'profiles' && q.range?.[0] === 1000))
  assert.ok(b.requetes.some((q) => q.table === 'inscriptions' && q.range?.[0] === 1000))
})

for (const table of ['profiles', 'inscriptions', 'assiduite_hebdo']) {
  test(`pilotage : erreur ${table} signalée, sans inventer d'élèves non servis`, async () => {
    const r = await serveur.chargerBudgets(admin(base(decor(3), (q) => q.table === table)))
    assert.ok(r.incidents.some((i) => i.includes('panne simulée')))
    assert.equal(r.nonServis, 0)
    assert.equal(r.eleves.length, table === 'assiduite_hebdo' ? 3 : 0)
    if (table === 'assiduite_hebdo') assert.ok(r.eleves.every((e) => e.assiduite === null))
  })
}

test('pilotage : échec de deuxième page, aucune liste partielle affichée comme complète', async () => {
  const r = await serveur.chargerBudgets(admin(base(decor(1001), (q) => q.table === 'profiles' && q.range?.[0] === 1000)))
  assert.equal(r.eleves.length, 0)
  assert.ok(r.incidents.length > 0)
})
