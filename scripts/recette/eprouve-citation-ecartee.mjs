// Épreuve PAR EXÉCUTION du geste « effacer une citation composée » — sandbox.
//   node --import ./scripts/register-calibration-resolver.mjs eprouve_citation.mjs           → liste
//   node … eprouve_citation.mjs --efface depotId|moment                                        → efface, relit, constate en base
import { register } from 'node:module'
register('data:text/javascript,' + encodeURIComponent(`
const CARTE = { 'next/navigation': 'next/navigation.js', 'next/headers': 'next/headers.js', 'next/cache': 'next/cache.js' }
export async function resolve(s, c, n) { return n(CARTE[s] ?? s, c) }`))
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v
const RACINE = process.cwd()
const { chargerLAttentionDeLaClasse } = await import(`${RACINE}/utils/pilotage/attention-serveur.ts`)
const { ecarterLesCitationsComposees } = await import(`${RACINE}/utils/pilotage/gestes-serveur.ts`)
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })
console.log('base :', env.NEXT_PUBLIC_SUPABASE_URL)

async function citations() {
  const { data: classes } = await admin.from('classes').select('id, nom')
  const out = []
  for (const c of classes ?? []) {
    const { data: ins } = await admin.from('inscriptions').select('eleve_id, profiles(display_name)').eq('classe_id', c.id)
    const ids = (ins ?? []).map((i) => i.eleve_id)
    const nomDe = new Map((ins ?? []).map((i) => [i.eleve_id, i.profiles?.display_name ?? '?']))
    if (ids.length === 0) continue
    const att = await chargerLAttentionDeLaClasse(admin, ids, nomDe, 'America/Toronto', '2026-09-03')
    for (const d of att.drapeaux.filter((d) => d.nature === 'citation_composee')) {
      out.push({ classe: c.nom, classeId: c.id, eleve: d.eleveNom, ref: d.geste?.ref, action: d.geste?.action, mot: d.geste?.mot })
    }
    if (att.incidents.length) console.log(`  ⚠ incidents (${c.nom}) :`, att.incidents)
  }
  return out
}

const avant = await citations()
console.log(`\n${avant.length} drapeau(x) « citation composée » en sandbox :`)
for (const d of avant) console.log(`  · ${d.classe} — ${d.eleve} — ${d.ref} — geste ${d.action}/« ${d.mot} »`)

const i = process.argv.indexOf('--efface')
if (i > 0) {
  const ref = process.argv[i + 1]
  const [depotId, moment] = ref.split('|')
  console.log(`\n→ efface ${ref}`)
  const r1 = await ecarterLesCitationsComposees(admin, [{ depotId, moment }])
  console.log('  1er geste :', r1)
  const r2 = await ecarterLesCitationsComposees(admin, [{ depotId, moment }])
  console.log('  2e geste (idempotence) :', r2)
  const { data } = await admin.from('exercices_retours').select('depot_id, moment, citation_composee_ecartee_at, published_at')
    .eq('depot_id', depotId).eq('moment', moment).maybeSingle()
  console.log('  en base :', data)
  const apres = await citations()
  console.log(`  drapeaux après : ${apres.length} (avant ${avant.length}) ; celui-là encore présent : ${apres.some((d) => d.ref === ref)}`)
}
