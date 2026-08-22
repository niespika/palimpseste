// Recette du deuxième écran : « un fichier d'import est REFUSÉ pour un motif
// lisible, PUIS ACCEPTÉ » — le même fichier, corrigé, redéposé sous les mêmes id.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })
const { deposerFichierImport } = await import(
  '/Users/louissagnieres/Documents/GitHub/palimpseste/utils/fabrique/import-ecriture.ts')

const { data: prof } = await admin.from('profiles').select('id').eq('role', 'prof').limit(1).single()
const chemin = process.argv[2]
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
