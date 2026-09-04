// Recette du deuxième écran : « un fichier d'import est REFUSÉ pour un motif
// lisible, PUIS ACCEPTÉ » — le même fichier, corrigé, redéposé sous les mêmes id.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
// ⭐ `--prod` : le dépôt en PRODUCTION, avec les clés `PROD_*` du même `.env.local`
//    (on ne les échange jamais dans le fichier). Sans le drapeau : le bac à sable.
const PROD = process.argv.includes('--prod')
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY.replace(/^['"]|['"]$/g, ''),
    { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } })
console.log(PROD ? '⚠ PRODUCTION' : 'bac à sable')
const { deposerFichierImport } = await import(
  '/Users/louissagnieres/Documents/GitHub/palimpseste/utils/fabrique/import-ecriture.ts')

const { data: prof } = await admin.from('profiles').select('id').eq('role', 'prof').limit(1).single()
const chemin = process.argv.slice(2).find((a) => !a.startsWith('--'))
const brut = JSON.parse(fs.readFileSync(chemin, 'utf-8'))
const r = await deposerFichierImport(admin, brut, chemin.split('/').pop(), prof.id)
console.log('verdict :', r.verdict.code === 0 ? 'IMPORTABLE' : 'REFUS',
            '· fichier refusé :', r.verdict.fichierRefuse)
for (const x of r.verdict.refus) console.log('  ✗', x)
for (const x of r.verdict.blocages) console.log('  ⊘', x)
for (const x of r.verdict.signalements) console.log('  ·', x)
for (const x of r.incidents) console.log('  !', x)
console.log('entrées :', JSON.stringify(r.entres))
console.log('refusées :', JSON.stringify(r.refuses), '· bloquées :', JSON.stringify(r.bloques))
console.log('ignorées :', JSON.stringify(Object.fromEntries(
  Object.entries(r.verdict.ignores).filter(([, v]) => v.length))))
