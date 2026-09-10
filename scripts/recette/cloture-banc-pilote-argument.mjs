// Vérification en lecture APRÈS --retirer du décor. Aucun identifiant privé dans le résultat.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import assert from 'node:assert/strict'
const r = JSON.parse(readFileSync('/tmp/pilote-argument-banc-decor.json', 'utf8'))
assert.equal(r.termine, true, 'Retirer le décor avant la vérification')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
assert.equal(new URL(url).hostname, 'aoakpxxlyvthzueaywna.supabase.co')
const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
const propres = readdirSync('/tmp/pilote-argument-banc').filter(f => f.endsWith('-depot.json')).map(f => JSON.parse(readFileSync('/tmp/pilote-argument-banc/' + f, 'utf8')))
const groupes = new Map()
for (const l of [...r.lignes, ...propres.map(d => ({ table: 'exercices', id: d.exercice })), ...[...r.depots,...propres.map(d => ({ id: d.depot }))].map(d => ({ table: 'exercices_depots', id: d.id }))]) {
  const ids = groupes.get(l.table) ?? new Set()
  ids.add(l.id); groupes.set(l.table, ids)
}
const comptes = await Promise.all([...groupes.entries()].map(async ([table,ids]) => {
  const { count, error } = await db.from(table).select('id', { head: true, count: 'exact' }).in('id', [...ids])
  if (error) throw error
  assert.equal(count, 0, 'Lignes restantes dans ' + table)
  return { table, identifiants_verifies: ids.size, restants: count }
}))
const { data: params, error: ep } = await db.from('scriptorium_params').select(Object.keys(r.params).join(',')).eq('id', 1).single()
if (ep) throw ep
assert.deepEqual(params, r.params, 'Paramètres restaurés exactement')
const { data: u, error: eu } = await db.auth.admin.getUserById(r.eleve)
assert.equal(u.user, null)
assert.equal(eu?.status, 404)
const source = JSON.parse(readFileSync('scripts/recette/pilote-argument/sujets-1hlp.json', 'utf8'))
const sujets = Array.isArray(source) ? source : source.sujets
assert.ok(Array.isArray(sujets), 'Format de banque connu')
const { data: conserves, count, error: es } = await db.from('exercices_sujets').select('id_import,enonce', { count: 'exact' }).in('id_import', sujets.map(s => s.id))
if (es) throw es
assert.equal(count, 20)
assert.equal(conserves.length, 20)
assert.ok(sujets.every(s => conserves.some(d => d.id_import === s.id && d.enonce === s.enonce)))
const bilan = { verifie_le: new Date().toISOString(), sandbox: true, production_touchee: false,
  compte_synthetique_supprime: true, lignes: comptes, parametres_restaures: params, sujets_1hlp_reels_conserves: count }
writeFileSync('scripts/recette/pilote-argument/banc/cloture.json', JSON.stringify(bilan, null, 2) + '\n')
console.log(JSON.stringify(bilan, null, 2))
