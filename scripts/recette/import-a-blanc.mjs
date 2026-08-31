// ============================================================================
// IMPORT À BLANC — ce que `deposerFichierImport` FERAIT, sans rien écrire.
// ----------------------------------------------------------------------------
// ⛔ AUCUNE ÉCRITURE. On appelle les VRAIES fonctions — `chargerDoctrineDepuisBase`,
//    `lireDejaEnBase`, `controleImport` — et on s'arrête juste avant l'écriture.
//
// ⚠️⚠️ CE QU'IL FAUT SAVOIR AVANT DE LANCER LE VRAI IMPORT : l'écrivain fait
//    `.insert()`, JAMAIS `.upsert()`. Ce qui est déjà en base par son `id_import`
//    est IGNORÉ — donc un ré-import n'AMENDE PAS une instance existante, il ne
//    fait qu'ajouter ce qui manque. Une instance déjà entrée garde ses colonnes
//    telles quelles, `cotexte_materiau_id` compris.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/import-a-blanc.mjs <banque.json> [prod|sandbox]
// ============================================================================
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = fs.readFileSync('.env.local', 'utf8')
const g = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^"|"$/g, '') : null
}
const base = process.argv[3] ?? 'prod'
const [url, cle] = base === 'prod'
  ? [g('PROD_SUPABASE_URL'), g('PROD_SUPABASE_SECRET_KEY')]
  : [g('NEXT_PUBLIC_SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY')]
const admin = createClient(url, cle, { auth: { persistSession: false } })

const { chargerDoctrineDepuisBase } = await import('../../utils/fabrique/doctrine.ts')
const { lireDejaEnBase } = await import('../../utils/fabrique/import-ecriture.ts')
const { controleImport } = await import('../../utils/fabrique/verifie-import.ts')

const chemin = process.argv[2]
const banque = JSON.parse(fs.readFileSync(chemin, 'utf8'))
const doctrine = await chargerDoctrineDepuisBase(admin)
const deja = await lireDejaEnBase(admin)
const v = controleImport(banque, doctrine, deja)

const n = (x) => (x ?? []).length
console.log(`\n${chemin.split('/').pop()} → ${base}`)
console.log(`verdict : ${v.code === 0 ? '✅ IMPORTABLE' : '⛔ REFUS'} · fichier refusé : ${v.fichierRefuse}`)
console.log(`refus ${n(v.refus)} · blocages ${n(v.blocages)} · signalements ${n(v.signalements)}`)
for (const x of (v.refus ?? []).slice(0, 10)) console.log('   ✗', String(x).slice(0, 150))

// Ce qui ENTRERAIT vraiment : ce que le fichier porte, moins ce que la base a déjà.
console.log('\nCE QUI ENTRERAIT (le fichier moins ce que la base porte déjà) :')
for (const [cle2, ensemble] of [['textes', deja.textes], ['sujets', deja.sujets],
  ['materiaux', deja.materiaux], ['exercices', deja.exercices]]) {
  const dans = banque[cle2] ?? []
  const neufs = dans.filter((x) => !ensemble.has(String(x.id)))
  const ignores = new Set((v.ignores?.[cle2] ?? []).map(String))
  const retenus = neufs.filter((x) => !ignores.has(String(x.id)))
  console.log(`  ${cle2.padEnd(11)} ${String(retenus.length).padStart(4)} neuf(s)`
    + `   · déjà en base ${String(dans.length - neufs.length).padStart(4)}`
    + `   · écartés par le contrôle ${neufs.length - retenus.length}`)
}
