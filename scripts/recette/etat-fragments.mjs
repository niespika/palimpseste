#!/usr/bin/env node
// ============================================================================
// etat-fragments.mjs — le relevé du smoke `C-RLS-12` : le RE-DÉPÔT Fragments.
// ----------------------------------------------------------------------------
// ⛔ CE QU'ON ÉPROUVE. Jusqu'au 29/08, un re-dépôt effaçait les photos du
//    Storage **avant** de supprimer l'enregistrement — lequel échouait en
//    silence (le client de l'élève sur une policy DELETE `est_prof()`), si bien
//    que la contrainte `UNIQUE (inscription_id, semaine_id)` refusait ensuite le
//    nouveau dépôt : **l'élève voyait une erreur et ses photos étaient déjà
//    détruites**. Le correctif inverse l'ordre et passe par le client admin,
//    gardé par `.eq('eleve_id', userId)`.
//
// ⭐ CE SCRIPT N'ÉCRIT RIEN. Il photographie l'état — base ET Storage — pour
//    qu'on puisse le comparer AVANT le 1er dépôt, APRÈS, et APRÈS le re-dépôt.
//    *Le retour se vérifie par requête, jamais sur ce qu'un écran affiche.*
//
//   node scripts/recette/etat-fragments.mjs [--eleve <courriel>]
//
// LE CRITÈRE DE SUCCÈS, et il tient en une phrase :
//   après le RE-dépôt, il doit rester **UN** dépôt, portant **SES** photos, et
//   le Storage ne doit contenir que les fichiers de ce dépôt-là.
//   ⛔ L'ancien défaut se reconnaîtrait à : dépôt TOUJOURS l'ancien (même id
//      qu'avant le re-dépôt) ET 0 fichier au Storage.
// ============================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
for (const l of readFileSync(join(RACINE, '.env.local'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[m[1]] === undefined) process.env[m[1]] = v
}

const i = process.argv.indexOf('--eleve')
const COURRIEL = i > 0 ? process.argv[i + 1] : 'eleve1@test.com'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

// ⚠️ supabase-js NE LÈVE PAS : tout passe par `lu`, qui lève.
function lu(quoi, { data, error }) {
  if (error) throw new Error(`${quoi} — ${error.message}`)
  return data
}

const { data: comptes, error: eC } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (eC) throw new Error(`comptes — ${eC.message}`)
const u = comptes.users.find((x) => x.email?.toLowerCase() === COURRIEL.toLowerCase())
if (!u) throw new Error(`aucun compte « ${COURRIEL} »`)

console.log(`\n╭─ ${COURRIEL}  (${u.id.slice(0, 8)})`)

// ── La semaine ouverte, qui est la condition du geste ─────────────────────
const semaines = lu('semaines', await admin.from('fragments_semaines')
  .select('id, ouverte, date_limite').eq('ouverte', true))
console.log(`│  semaine(s) OUVERTE(s) : ${semaines.length}${semaines.map((s) => ` · ${s.id.slice(0, 8)} (limite ${s.date_limite})`).join('')}`)
if (semaines.length === 0) console.log('│  ⛔ AUCUNE semaine ouverte — le dépôt sera refusé avant d\'arriver au code éprouvé.')

// ── Les dépôts, et leurs photos ───────────────────────────────────────────
const depots = lu('dépôts', await admin.from('fragments_depots')
  .select('id, semaine_id, statut, created_at, photos_suspectes, photo_prise_at')
  .eq('eleve_id', u.id).order('created_at'))
console.log(`│  dépôts : ${depots.length}`)
for (const d of depots) {
  const photos = lu('photos', await admin.from('fragments_photos')
    .select('id, storage_path').eq('depot_id', d.id))
  console.log(`│    · ${d.id.slice(0, 8)} · semaine ${d.semaine_id.slice(0, 8)} · ${d.statut} · ${photos.length} photo(s) en base`)
  for (const p of photos) console.log(`│        ${p.storage_path}`)
}

// ── Le Storage, qui est l'autre moitié de la vérité ───────────────────────
// ⚠️ La base peut dire « 1 photo » pendant que le fichier n'existe plus : c'est
//    EXACTEMENT l'état que produisait le défaut. On lit donc les deux.
async function fichiers(prefixe) {
  const { data, error } = await admin.storage.from('fragments').list(prefixe, { limit: 100 })
  if (error) return [`⛔ ${error.message}`]
  const out = []
  for (const f of data) {
    if (f.id === null) out.push(...(await fichiers(`${prefixe}/${f.name}`)))
    else out.push(`${prefixe}/${f.name}`)
  }
  return out
}
const stock = await fichiers(u.id)
console.log(`│  Storage « fragments » sous ${u.id.slice(0, 8)}/ : ${stock.length} fichier(s)`)
for (const f of stock) console.log(`│    ${f}`)

// ── Le verdict, énoncé plutôt que déduit par le lecteur ───────────────────
const enBase = depots.length
const photosEnBase = depots.length
  ? lu('photos', await admin.from('fragments_photos').select('storage_path')
      .in('depot_id', depots.map((d) => d.id))).map((p) => p.storage_path)
  : []
const orphelines = photosEnBase.filter((p) => !stock.includes(p))
console.log('│')
if (enBase === 0) console.log('╰─ état : AUCUN dépôt. C\'est le point de départ du smoke.')
else if (orphelines.length) {
  console.log(`╰─ ⛔⛔ ${orphelines.length} photo(s) ANNONCÉE(S) EN BASE MAIS ABSENTE(S) DU STORAGE :`)
  for (const o of orphelines) console.log(`      ${o}`)
  console.log('      C\'est la signature exacte du défaut C-RLS-12.')
  process.exit(1)
} else console.log(`╰─ ✅ ${enBase} dépôt(s), ${photosEnBase.length} photo(s) annoncée(s), toutes PRÉSENTES au Storage.`)
