// ⛔ LECTURE SEULE — le croisement « toutes les dimensions × celles qui sont acquises »
//    se fait-il vraiment à l'écran, sans nouveau champ ?
import { register } from 'node:module'
register('data:text/javascript,' + encodeURIComponent(`
const CARTE = { 'next/navigation':'next/navigation.js','next/headers':'next/headers.js','next/cache':'next/cache.js' }
export async function resolve(s, c, n) { return CARTE[s] ? n(CARTE[s], c) : n(s, c) }
`))
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
const R = process.cwd()
const { chargerLeProfilDeLEleve } = await import(`${R}/utils/eleve/profil-serveur.ts`)
const { chargerLesFichesDeCompetence, lireLeChoixDesLettres } = await import(`${R}/utils/eleve/fiche-serveur.ts`)

for (const [nom, url, cle] of [
  ['sandbox', env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY],
  ['prod', env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY],
]) {
  const admin = createClient(url, cle, { auth: { autoRefreshToken: false, persistSession: false } })
  console.log(`\n══ ${nom.toUpperCase()} ══`)
  const { fiches } = await chargerLesFichesDeCompetence(admin)
  const dimsPar = new Map(fiches.map((f) => [f.competence, f.dimensions]))
  const { data: eleves } = await admin.from('profiles').select('id, display_name').eq('role', 'eleve')
  let doublons = 0, horsFiche = 0, cellules = 0, marquees = []
  const horsFicheEx = new Set()
  for (const e of eleves ?? []) {
    const p = await chargerLeProfilDeLEleve(admin, e.id, await lireLeChoixDesLettres(admin, e.id))
    for (const c of p.competences) {
      if (c.forces.length === 0) continue
      cellules++
      if (new Set(c.forces).size !== c.forces.length) doublons++
      const dims = dimsPar.get(c.competence) ?? []
      for (const f of c.forces) if (!dims.includes(f)) { horsFiche++; horsFicheEx.add(`${c.competence} : « ${f} »`) }
      marquees.push(`${c.forces.length}/${dims.length}`)
      if (c.formulationsManquantes.length) {
        console.log(`  ⚠ formulations manquantes ${c.competence} : ${c.formulationsManquantes.join(', ')}`)
      }
    }
  }
  console.log(`cellules avec forces : ${cellules}`)
  console.log(`  cellules où une force est RÉPÉTÉE : ${doublons}`)
  console.log(`  forces ABSENTES de la liste des dimensions de la fiche : ${horsFiche}`)
  for (const x of horsFicheEx) console.log(`     · ${x}`)
  const compte = {}
  for (const m of marquees) compte[m] = (compte[m] ?? 0) + 1
  console.log(`  « marquées / total » : ${Object.entries(compte).sort().map(([k, v]) => `${k}→${v}`).join(' · ')}`)
}
