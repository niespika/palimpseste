// ============================================================================
// LA TROISIÈME VOIE — CE QU'ELLE OUVRIRAIT, classe par classe. 10/09/2026. LECTURE SEULE.
// ----------------------------------------------------------------------------
// Pour chaque classe active : les cours vus (le même `lireLesCoursVus` que le cycle),
// les notions qu'ils déclarent, et les sujets `cours_etat = 'notions'` que le filtre
// retiendrait porte ouverte. Ne pose rien, n'écrit rien.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs scripts/recette/notions-vues.mjs [--prod]
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const PROD = process.argv.includes('--prod')
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const { lireLesCoursVus, lireLesNotionsDesCours, notionsVuesDe } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
const { ensembleDeNotions } = await import(`${RACINE}/utils/fabrique/notions.ts`)
const { lireLaPorteNotions } = await import(`${RACINE}/utils/moteur/porte-notions.ts`)

const aujourdHui = new Date().toISOString().slice(0, 10)
const { data: classes } = await admin.from('classes').select('id, nom, type_pedagogique').eq('statut', 'active')
const { data: sujets } = await admin.from('exercices_sujets').select('id, enonce, notions, cours_etat, forme').eq('cours_etat', 'notions')
console.log(`${PROD ? 'PRODUCTION' : 'bac à sable'} — porte notions_actif : ${await lireLaPorteNotions(admin)} — ${sujets?.length ?? 0} sujet(s) rattachés par notions`)
for (const c of classes ?? []) {
  const vus = await lireLesCoursVus(admin, [c.id], aujourdHui)
  const cours = vus.parClasse.get(c.id) ?? new Set()
  const notions = await lireLesNotionsDesCours(admin, [...cours])
  const vues = notionsVuesDe(cours, notions.parCours)
  const servables = (sujets ?? []).filter((s) => [...ensembleDeNotions(s.notions)].some((n) => vues.has(n)))
  console.log(`\n${c.nom} (${c.type_pedagogique}) — ${cours.size} cours vu(s), notions vues : ${[...vues].join(' · ') || '—'}`)
  console.log(`  sujets par notions retenus : ${servables.length}`)
  for (const s of servables.slice(0, 60)) console.log(`   · ${s.forme} — ${s.enonce}`)
  for (const i of [...vus.incidents, ...notions.incidents]) console.log(`  ⚠ ${i}`)
}
