// ============================================================================
// DÉCOR — C7-L3 : les huit exercices du gabarit d'une clé, assignés à l'élève
// de test du bac à sable, pour regarder la console avec de la matière dedans.
// ----------------------------------------------------------------------------
// ⛔ Bac à sable seulement. ⭐ La marque va EN BASE : `origine = 'prof'` et un
//    `assigne_at` posé à une seconde précise, que `--retire` retrouve.
//   node scripts/recette/decor-gabarit-eleve.mjs [cle] [--retire]
// ============================================================================
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
if (!/aoakpxxlyvthzueaywna/.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error('bac à sable seulement')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })
const MARQUE = '2026-09-04T03:14:15.926Z'
const CLE = process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'argument.garant.connecteur'
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
const u = users.find((x) => x.email === env.TEST_ELEVE_EMAIL)
if (!u) throw new Error('élève de test introuvable : ' + env.TEST_ELEVE_EMAIL)

if (process.argv.includes('--retire')) {
  const { data } = await admin.from('exercices_depots').delete().eq('eleve_id', u.id).eq('assigne_at', MARQUE).select('id')
  console.log('retirés :', data?.length ?? 0)
  process.exit(0)
}
const souche = CLE.replace(/\./g, '-')
const { data: tousGab } = await admin.from('exercices').select('id, id_import, cran, variante').like('id_import', 'ex-gab-%').order('id_import')
const ex = (tousGab ?? []).filter((e) => e.id_import.includes(souche))
if (!ex.length) throw new Error('aucun exercice pour ' + souche + ' parmi ' + (tousGab ?? []).length)
const { data: deja } = await admin.from('exercices_depots').select('exercice_id').eq('eleve_id', u.id).eq('assigne_at', MARQUE)
const dejaIds = new Set((deja ?? []).map((d) => d.exercice_id))
const lignes = ex.filter((e) => !dejaIds.has(e.id)).map((e) => ({
  eleve_id: u.id, exercice_id: e.id, origine: 'prof', statut: 'assigne', assigne_at: MARQUE,
  echeance: new Date(Date.now() + 7 * 86400e3).toISOString(),
}))
if (lignes.length) {
  const { error } = await admin.from('exercices_depots').insert(lignes)
  if (error) throw new Error(error.message)
}
const { data: tous } = await admin.from('exercices_depots').select('id, exercice_id').eq('eleve_id', u.id).eq('assigne_at', MARQUE)
for (const e of ex) {
  const d = (tous ?? []).find((x) => x.exercice_id === e.id)
  console.log(`${e.id_import.padEnd(44)} cran ${e.cran}${e.variante ?? ''}  dépôt ${d?.id ?? '—'}`)
}
console.log('élève :', u.id)
