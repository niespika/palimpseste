// ============================================================================
// RETRAIT D'UNE CLÉ DU GABARIT — bac à sable seulement. Louis, 04/09/2026 :
// une clé qu'il ÉCARTE se refabrique, et l'import REFUSE un `id_import` déjà
// en base : il faut d'abord sortir ses huit exercices (les cas partent en
// cascade), puis ses matériaux (cas et témoins), puis redéposer le fichier.
// ----------------------------------------------------------------------------
//   node scripts/recette/retirer-gabarit.mjs <cle> [<cle> …] [--applique]
//   node scripts/recette/retirer-gabarit.mjs --tout [--applique]
// Sans `--applique` : un RELEVÉ, rien n'est écrit. Les dépôts posés sur ces
// exercices partent AVEC eux (`exercices_depots → exercices` est en cascade) :
// le relevé les compte, et on ne les perd qu'en le sachant.
// ⛔ Jamais en production : les élèves y auront ouvert des dépôts dès lundi.
// ============================================================================
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
if (!/aoakpxxlyvthzueaywna/.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error('bac à sable seulement')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const applique = process.argv.includes('--applique')
const tout = process.argv.includes('--tout')
const cles = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!tout && cles.length === 0) { console.log('usage : retirer-gabarit.mjs <cle> … | --tout  [--applique]'); process.exit(1) }

// La souche d'une clé, comme `gabarit.assemble` la forme : `gab-<objet>-<reste>`, points → tirets.
const limace = (s, n) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, n).replace(/-$/, '')
const souches = cles.map((k) => `gab-${limace(k.split('.')[0], 14)}-${limace(k.split('.').slice(1).join('.'), 30)}`)
const exDe = (id) => tout ? /^ex-gab-/.test(id) : souches.some((s) => new RegExp(`^ex-${s}-c\\d[ab]?(-\\d\\d)?$`).test(id))
const matDe = (id) => tout ? /^mat-gab-/.test(id) : souches.some((s) => new RegExp(`^mat-${s}-[ab](t\\d)?(-\\d\\d)?$`).test(id))

const { data: ex, error: e1 } = await admin.from('exercices').select('id, id_import').like('id_import', 'ex-gab-%').limit(5000)
if (e1) throw new Error(e1.message)
const { data: mats, error: e2 } = await admin.from('exercices_materiaux').select('id, id_import').like('id_import', 'mat-gab-%').limit(5000)
if (e2) throw new Error(e2.message)
const exVises = ex.filter((e) => exDe(e.id_import)); const matVises = mats.filter((m) => matDe(m.id_import))
const { data: dep } = await admin.from('exercices_depots').select('id, exercice_id').in('exercice_id', exVises.map((e) => e.id))
console.log(`bac à sable — ${exVises.length} exercice(s), ${matVises.length} matériau(x), ${dep?.length ?? 0} dépôt(s) posé(s) dessus`)
for (const s of souches) console.log(`  · ${s} : ${exVises.filter((e) => e.id_import.includes(s)).length} ex., ${matVises.filter((m) => m.id_import.includes(s)).length} mat.`)
if (!applique) { console.log('relevé seulement — ajoute --applique'); process.exit(0) }

// Les cas d'abord (le déclencheur `garde_cas_de_la_paire` est différé, mais on ne
// lui laisse rien à compter), puis les exercices, puis les matériaux devenus orphelins.
const ids = exVises.map((e) => e.id)
for (let i = 0; i < ids.length; i += 100) {
  const tranche = ids.slice(i, i + 100)
  const { error } = await admin.from('exercices_cas').delete().in('exercice_id', tranche); if (error) throw new Error('cas : ' + error.message)
  const { error: e3 } = await admin.from('exercices').delete().in('id', tranche); if (e3) throw new Error('exercices : ' + e3.message)
}
const mids = matVises.map((m) => m.id)
for (let i = 0; i < mids.length; i += 100) {
  const { error } = await admin.from('exercices_materiaux').delete().in('id', mids.slice(i, i + 100))
  if (error) throw new Error('matériaux : ' + error.message)
}
console.log(`retirés : ${ids.length} exercice(s), ${mids.length} matériau(x)`)
