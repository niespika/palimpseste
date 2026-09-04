// ============================================================================
// RECETTE — Aletheia E7/E9 : rejouer l'appel VF d'un travail du BAC À SABLE (T = 0 : même
// prompt ⇒ même sortie), pour mesurer l'effet d'une retouche de prompt sur les sorties E7.
//   node --import ./scripts/register-calibration-resolver.mjs scripts/recette/aletheia-rejoue-vf.mjs --travail <id>
// Remet le travail en VF_SUBMITTED, appelle genererRetourVf, rétablit le statut d'avant.
// ============================================================================
import fs from 'node:fs'
const env = Object.fromEntries(fs.readFileSync('/Users/louissagnieres/Documents/GitHub/palimpseste/.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
for (const k of Object.keys(env)) if (env[k] && !process.env[k]) process.env[k] = env[k]
if (!env.NEXT_PUBLIC_SUPABASE_URL.includes('aoakpxxlyvthzueaywna')) { console.error('⛔ pas le bac à sable'); process.exit(2) }
const { createClient } = await import('@supabase/supabase-js')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const i = process.argv.indexOf('--travail'); const id = i >= 0 ? process.argv[i + 1] : null
if (!id) { console.error('usage : --travail <id>'); process.exit(1) }
const { data: avant } = await admin.from('aletheia_travaux').select('statut, retour_vf').eq('id', id).single()
console.log('avant :', avant.statut, '· nuances_detail', (avant.retour_vf?.nuances_detail ?? []).length, '· paires', (avant.retour_vf?.amont_paires ?? []).length, '· couverture', (avant.retour_vf?.synthese_couverture ?? []).length)
await admin.from('aletheia_travaux').update({ statut: 'VF_SUBMITTED' }).eq('id', id)
const t0 = Date.now()
const { genererRetourVf } = await import('@/utils/aletheia-retours')
await genererRetourVf(id)
const { data: apres } = await admin.from('aletheia_travaux').select('statut, retour_vf').eq('id', id).single()
console.log(`après (${((Date.now() - t0) / 1000).toFixed(1)} s) :`, apres.statut, '· nuances_detail', (apres.retour_vf?.nuances_detail ?? []).length, '· paires', (apres.retour_vf?.amont_paires ?? []).length, '· couverture', (apres.retour_vf?.synthese_couverture ?? []).length)
for (const n of apres.retour_vf?.nuances_detail ?? []) console.log(`   ${n.priorite} [${n.verdict}] → ${n.passage} : ${n.note.slice(0, 90)}`)
await admin.from('aletheia_travaux').update({ statut: avant.statut }).eq('id', id)
console.log('statut rétabli :', avant.statut)
