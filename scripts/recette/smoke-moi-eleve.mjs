// ============================================================================
// SMOKE « Moi » élève — ouvrir la page RÉELLE avec des DONNÉES RÉELLES.
// ----------------------------------------------------------------------------
// ⛔ LECTURE SEULE côté données. La seule écriture est celle de Supabase Auth
//    quand il minte un magiclink — aucun décor semé, aucun interrupteur touché.
//
// Il classe les élèves du BAC À SABLE par ce que l'écran aura à porter (le `n`
// total, la longueur du geste, le nombre de forces), puis minte un lien de
// session pour celui qu'on demande.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/smoke-moi-eleve.mjs [--classe] [--lien <nom|email>]
// ============================================================================

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
const { lireLeChoixDesLettres } = await import(`${R}/utils/eleve/fiche-serveur.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const valeur = (cle) => {
  const i = process.argv.indexOf(`--${cle}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : null
}

const { data: eleves } = await admin.from('profiles').select('id, display_name').eq('role', 'eleve')
const lignes = []
for (const e of eleves ?? []) {
  const p = await chargerLeProfilDeLEleve(admin, e.id, await lireLeChoixDesLettres(admin, e.id))
  lignes.push({
    id: e.id,
    nom: e.display_name ?? '(sans nom)',
    n: p.competences.reduce((s, c) => s + c.n, 0),
    lettres: p.competences.filter((c) => c.lettre).length,
    forces: p.competences.reduce((s, c) => s + c.forces.length, 0),
    geste: p.geste ? p.geste.texte.length : 0,
  })
}
lignes.sort((a, b) => (b.n * 10 + b.geste / 100) - (a.n * 10 + a.geste / 100))
console.log('\nÉlèves du bac à sable, classés par ce que l’écran aura à porter :')
for (const l of lignes.slice(0, 10)) {
  console.log(`  ${l.nom.padEnd(24)} n=${String(l.n).padStart(2)} · lettres ${l.lettres} · forces ${String(l.forces).padStart(2)} · geste ${String(l.geste).padStart(3)} car.`)
}

const cible = valeur('lien')
if (cible) {
  const l = lignes.find((x) => x.nom.toLowerCase().includes(cible.toLowerCase()))
  if (!l) { console.error(`\n✗ aucun élève ne correspond à « ${cible} »`); process.exit(1) }
  const { data: u, error: eU } = await admin.auth.admin.getUserById(l.id)
  if (eU || !u?.user?.email) { console.error(`✗ pas d’email pour ${l.nom}`); process.exit(1) }
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: u.user.email })
  if (error) { console.error(`✗ ${error.message}`); process.exit(1) }
  const h = data.properties.hashed_token
  console.log(`\n${l.nom} · n=${l.n} · geste ${l.geste} car.`)
  console.log(`http://localhost:3000/auth/confirm?token_hash=${h}&type=magiclink&next=/eleve/moi\n`)
}
