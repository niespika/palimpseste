// ============================================================================
// LES EXERCICES DU GABARIT PASSENT `concu` — le geste de la validation en file,
// en masse, sans l'écran. Louis, 04/09/2026 : « passer les instances importées
// de `a_concevoir` à `concu` (elles n'entrent au vivier qu'en `concu`) ».
// ----------------------------------------------------------------------------
//   node scripts/recette/passer-concu.mjs [--prod] [--applique]
// Sans `--applique` : un RELEVÉ, rien n'est écrit.
// Miroir EXACT de `validerEnFile` (`app/prof/corpus/actions.ts`) : `a_concevoir`
// → `concu`, `updated_at` posé, et JAMAIS une entrée bloquée (`08-` §7 ; « la
// validation EST le geste de conception », `07-` §5, piège 24). Ne touche que
// les instances importées par la fabrique du gabarit (`id_import` en `ex-gab-`).
// ============================================================================
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
const PROD = process.argv.includes('--prod'); const applique = process.argv.includes('--applique')
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: ex, error } = await admin.from('exercices').select('id, id_import, statut, bloque').like('id_import', 'ex-gab-%').limit(5000)
if (error) throw new Error(error.message)
const parStatut = {}; for (const e of ex) parStatut[e.statut] = (parStatut[e.statut] ?? 0) + 1
const aPasser = ex.filter((e) => e.statut === 'a_concevoir' && !e.bloque)
const bloques = ex.filter((e) => e.statut === 'a_concevoir' && e.bloque)
console.log(`${PROD ? 'PRODUCTION' : 'bac à sable'} — ${ex.length} exercice(s) du gabarit ${JSON.stringify(parStatut)} · à passer concu : ${aPasser.length} · bloqués (restent) : ${bloques.length}`)
if (!applique) { console.log('relevé seulement — ajoute --applique'); process.exit(0) }
let n = 0
for (const e of aPasser) {
  const { data, error: e2 } = await admin.from('exercices')
    .update({ statut: 'concu', updated_at: new Date().toISOString() })
    .eq('id', e.id).eq('statut', 'a_concevoir').eq('bloque', false).select('id')
  if (e2) { console.log('  ✗', e.id_import, e2.message); continue }
  n += (data ?? []).length
}
const { data: apres } = await admin.from('exercices').select('statut').like('id_import', 'ex-gab-%').limit(5000)
const ap = {}; for (const e of apres ?? []) ap[e.statut] = (ap[e.statut] ?? 0) + 1
console.log(`passés concu : ${n} · après : ${JSON.stringify(ap)}`)
