// Banc EN LECTURE SEULE — ce que les retours citent : la copie de l'élève, ou le
// texte d'origine (le devoir servi) que l'élève a recopié ?
//   node --import ./scripts/register-calibration-resolver.mjs scripts/recette/banc-citations-origine.mjs [--prod] [--depuis 2026-08-31] [--limite 400]
// Louis, 06/09 : « plusieurs élèves m'ont signalé des retours de l'IA qui citaient
// le texte original et non leur réponse ». On classe chaque citation « Tu écris »
// (ancrage.citation des points du retour chaud) en quatre cases : dans la copie
// seulement · dans la copie ET dans le matériau (recopié) · dans le matériau
// seulement (fuite) · nulle part. Par cran.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = fs.readFileSync('.env.local', 'utf8')
const g = (k) => { const m = env.match(new RegExp(`^${k}=(.*)$`, 'm')); return m ? m[1].trim().replace(/^"|"$/g, '') : null }
const prod = process.argv.includes('--prod')
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d }
const DEPUIS = arg('--depuis', '2026-08-31')
const LIMITE = Number(arg('--limite', 400))
const url = prod ? g('PROD_SUPABASE_URL') : g('NEXT_PUBLIC_SUPABASE_URL')
const key = prod ? g('PROD_SUPABASE_SECRET_KEY') : g('SUPABASE_SERVICE_ROLE_KEY')
process.env.SUPABASE_SERVICE_ROLE_KEY = key
process.env.NEXT_PUBLIC_SUPABASE_URL = url
const admin = createClient(url, key, { auth: { persistSession: false } })
console.log(`base : ${url.match(/https:\/\/([a-z]+)\./)?.[1]} (${prod ? 'PRODUCTION' : 'bac à sable'}) — retours chauds depuis ${DEPUIS}, lecture seule\n`)
const { lireContexteDuDepot } = await import('../../utils/chaine/chaine.ts')

const norm = (s) => String(s ?? '').normalize('NFC').replace(/[’‘`´]/g, "'").replace(/[«»“”"]/g, '"').replace(/\s+/g, ' ').trim().toLowerCase()
const morceaux = (c) => norm(c).split(/\s*(?:\[\.\.\.\]|\[…\]|\.\.\.|…)\s*/).map((m) => m.replace(/^["\s]+|["\s]+$/g, '')).filter((m) => m.length >= 4)
const dedans = (cit, texte) => { const t = norm(texte); const ms = morceaux(cit); return ms.length > 0 && ms.every((m) => t.includes(m)) }

const { data: retours, error } = await admin.from('exercices_retours')
  .select('depot_id, moment, texte, created_at')
  .eq('moment', 'chaud').gte('created_at', DEPUIS)
  .order('created_at', { ascending: false }).limit(LIMITE)
if (error) { console.error(error); process.exit(1) }
console.log(`${retours.length} retour(s) chaud(s)`)

const cases = () => ({ copie: 0, recopie: 0, fuite: 0, nulle: 0, points: 0, sansCit: 0 })
const parCran = {}; const tot = cases(); let sansMateriau = 0, depots = 0
const fuites = []
for (const r of retours) {
  let ctx
  try { ctx = await lireContexteDuDepot(admin, r.depot_id) } catch (e) { console.log(`  ${r.depot_id.slice(0, 8)} contexte illisible : ${e.message}`); continue }
  if (!ctx) continue
  depots++
  const mat = [ctx.materiau, ...(ctx.casPourLeRetour ?? []).map((c) => c.materiau)].filter(Boolean).join('\n')
  if (!mat) sansMateriau++
  const copie = ctx.productionV1 ?? ''
  const k = `cran ${ctx.cran ?? '?'}`
  parCran[k] ??= cases()
  const pts = Array.isArray(r.texte) ? r.texte : []
  for (const p of pts) {
    parCran[k].points++; tot.points++
    const cit = p?.ancrage?.citation
    if (!cit) { parCran[k].sansCit++; tot.sansCit++; continue }
    const dansCopie = dedans(cit, copie), dansMat = mat ? dedans(cit, mat) : false
    const c = dansCopie && dansMat ? 'recopie' : dansCopie ? 'copie' : dansMat ? 'fuite' : 'nulle'
    parCran[k][c]++; tot[c]++
    if (c === 'fuite' || c === 'recopie') fuites.push({ id: r.depot_id.slice(0, 8), date: String(r.created_at).slice(0, 10), cran: ctx.cran, objet: ctx.objet, c, cit: String(cit).replace(/\s+/g, ' ').slice(0, 90) })
  }
}
const ligne = (k, v) => `${k.padEnd(9)} | ${String(v.points).padStart(6)} | ${String(v.sansCit).padStart(8)} | ${String(v.copie).padStart(12)} | ${String(v.recopie).padStart(19)} | ${String(v.fuite).padStart(15)} | ${String(v.nulle).padStart(9)}`
console.log(`\n${depots} dépôt(s) lus · ${sansMateriau} sans matériau en contexte\n`)
console.log('cran      | points | sans cit | copie seule  | copie ET matériau   | matériau seul  | nulle part')
for (const k of Object.keys(parCran).sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)))) console.log(ligne(k, parCran[k]))
console.log(ligne('TOTAL', tot))
console.log('\nexemples (recopié ou fuite) :')
for (const f of fuites.slice(0, 25)) console.log(`  ${f.id} ${f.date} cran ${f.cran} ${f.objet ?? ''} [${f.c}] « ${f.cit} »`)
