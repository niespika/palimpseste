// ============================================================================
// BANC C7 · L5 — CE QUE LA PORTE DES CRANS FERAIT SUR LE CORPUS. Lecture seule.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/banc-porte-registre.mjs [--prod] [--jours 14]
//
// « Mesuré sur corpus avant d'être ouvert » (`07-` §2, C7-L5). Pour chaque élève
// qui a des dépôts, on dérive son registre, puis on regarde les dépôts que le
// routeur lui a POSÉS ces derniers jours : lesquels la porte aurait fermés,
// lesquels seraient des sondes, lesquels tombent en semaine de méthode.
// ⛔ Aucune écriture. En `--prod`, la clé de service de production ne sert qu'à lire.
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
const JOURS = Number(process.argv[process.argv.indexOf('--jours') + 1]) || 14
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const { lireLeRegistreDesReussites } = await import(`${RACINE}/utils/registre/reussites-serveur.ts`)
const { porteDeLObjet, statutDeService } = await import(`${RACINE}/utils/registre/porte.ts`)
const { cranNumero } = await import(`${RACINE}/utils/cran.ts`)

const depuis = new Date(Date.now() - JOURS * 86_400_000).toISOString()
const { data: recents, error } = await admin.from('exercices_depots')
  .select('id, eleve_id, assigne_at, origine, statut, exercices(cran, exercices_types(code))')
  .gte('assigne_at', depuis).eq('origine', 'routeur').limit(5000)
if (error) throw new Error(error.message)
const un = (x) => (Array.isArray(x) ? x[0] ?? null : x)
const parEleve = new Map()
for (const d of recents) {
  const ex = un(d.exercices); const objet = un(ex?.exercices_types)?.code; const cran = cranNumero(ex?.cran)
  if (!objet || cran == null) continue
  parEleve.set(d.eleve_id, [...(parEleve.get(d.eleve_id) ?? []), { objet, cran, statut: d.statut, assigneAt: d.assigne_at }])
}
console.log(`${PROD ? 'PRODUCTION' : 'bac à sable'} — ${recents.length} dépôt(s) posés par le routeur depuis ${JOURS} jours, ${parEleve.size} élève(s)`)

const compte = { ouvert: 0, sonde: 0, methode: 0, ferme: 0 }
const parCran = new Map(); const fermesParObjet = new Map(); const sondesDues = []
let elevesAvecRegistre = 0, lignesRegistre = 0
for (const [eleveId, depots] of parEleve) {
  const { registre } = await lireLeRegistreDesReussites(admin, eleveId)
  if (registre.length) { elevesAvecRegistre += 1; lignesRegistre += registre.length }
  // Les objets déjà servis AVANT le premier dépôt récent : tout dépôt plus ancien.
  const { data: anciens } = await admin.from('exercices_depots')
    .select('exercices(exercices_types(code))').eq('eleve_id', eleveId).lt('assigne_at', depuis)
  const dejaServis = new Set((anciens ?? []).map((a) => un(un(a.exercices)?.exercices_types)?.code).filter(Boolean))
  for (const d of depots) {
    const p = porteDeLObjet(registre, d.objet, dejaServis.has(d.objet))
    const s = statutDeService(p, d.cran)
    compte[s] += 1
    const k = `${d.cran}`; const c = parCran.get(k) ?? { ouvert: 0, sonde: 0, methode: 0, ferme: 0 }; c[s] += 1; parCran.set(k, c)
    if (s === 'ferme') fermesParObjet.set(d.objet, (fermesParObjet.get(d.objet) ?? 0) + 1)
    if (p.sondes.length) sondesDues.push(`${eleveId.slice(0, 8)} ${d.objet} → sonde au ${p.sondes.join('/')}`)
  }
}
const total = Object.values(compte).reduce((a, b) => a + b, 0)
console.log(`\nregistre : ${elevesAvecRegistre} élève(s) avec au moins une ligne, ${lignesRegistre} ligne(s) au total`)
console.log(`\nce que la porte aurait dit des ${total} dépôts posés :`)
for (const k of ['ouvert', 'methode', 'sonde', 'ferme']) console.log(`   ${k.padEnd(8)} ${String(compte[k]).padStart(4)}  (${total ? Math.round(100 * compte[k] / total) : 0} %)`)
console.log('\npar cran :')
for (const [c, v] of [...parCran].sort((a, b) => Number(a[0]) - Number(b[0]))) console.log(`   cran ${c} : ouvert ${v.ouvert} · méthode ${v.methode} · sonde ${v.sonde} · FERMÉ ${v.ferme}`)
console.log('\nfermés, par objet :', [...fermesParObjet].sort((a, b) => b[1] - a[1]).map(([o, n]) => `${o} ${n}`).join(' · ') || 'aucun')
console.log(`\nsondes de montée dues (élève × objet) : ${new Set(sondesDues).size}`, [...new Set(sondesDues)].slice(0, 8))
