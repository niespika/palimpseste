// Mesure avant/après en lecture seule. Ne conserve aucun profil individuel.
// node --import ./scripts/register-calibration-resolver.mjs scripts/recette/performance-navigation.mjs --production-lecture-seule
// --sandbox lit à la place la base configurée pour le développement.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const root = process.cwd()
const require = createRequire(path.join(root, 'package.json'))
require('@next/env').loadEnvConfig(root, false, { info() {}, error() {} })
const production = process.argv.includes('--production-lecture-seule')
if (!production && !process.argv.includes('--sandbox')) throw new Error('Choisir --sandbox ou --production-lecture-seule après autorisation.')
const url = production ? process.env.PROD_SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL
const key = production ? process.env.PROD_SUPABASE_SECRET_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Configuration de base absente')
// lireFuseau crée son propre client admin : même base pour toutes les lectures.
process.env.NEXT_PUBLIC_SUPABASE_URL = url
process.env.SUPABASE_SERVICE_ROLE_KEY = key
const nativeFetch = globalThis.fetch
let requetes = []
globalThis.fetch = async (input, init = {}) => {
  const cible = new URL(typeof input === 'string' ? input : input.url ?? input)
  const methode = init.method ?? input.method ?? 'GET'
  if (cible.origin !== new URL(url).origin || !['GET', 'HEAD'].includes(methode)) throw new Error('Mesure strictement en lecture seule')
  const debut = performance.now()
  const r = await nativeFetch(input, { ...init, signal: AbortSignal.timeout(20000) })
  const body = await r.clone().arrayBuffer()
  requetes.push({ table: cible.pathname.split('/').at(-1), methode, ms: Math.round(performance.now() - debut), octets: body.byteLength, statut: r.status })
  return r
}
const { createClient } = require('@supabase/supabase-js')
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'palimpseste-routeur-'))
try {
  const avantPath = path.join(dossier, 'avant.ts')
  fs.writeFileSync(avantPath, execFileSync('git', ['show', 'fbf4c63:app/prof/routeur/serveur.ts'], { cwd: root }))
  const avant = await import(pathToFileURL(avantPath).href)
  const apres = await import(pathToFileURL(path.join(root, 'app/prof/routeur/serveur.ts')).href)
  const semaine = '2026-09-07'
  // Réchauffer les deux variantes avant les trois paires alternées.
  const reference = await avant.chargerAssignation(admin, semaine)
  await apres.chargerAssignation(admin, semaine, reference.routeurActif)
  const mesures = []
  let identiques = true
  for (let paire = 0; paire < 3; paire++) {
    const charges = {}
    const variantes = paire % 2 ? ['apres', 'avant'] : ['avant', 'apres']
    for (const nom of variantes) {
      requetes = []
      const debut = performance.now()
      const charge = nom === 'avant'
        ? await avant.chargerAssignation(admin, semaine)
        : await apres.chargerAssignation(admin, semaine, reference.routeurActif)
      if (charge.incidents.length || requetes.some((r) => r.statut >= 400)) throw new Error('Mesure invalide : lecture incomplète')
      charges[nom] = charge
      const m = { paire, nom, dureeMs: Math.round(performance.now() - debut), depots: charge.depots.length, requetes: requetes.length, lectures: requetes }
      mesures.push(m)
      console.log(JSON.stringify({ ...m, lectures: undefined }))
    }
    identiques &&= isDeepStrictEqual(charges.avant, charges.apres)
  }
  const resultat = { date: new Date().toISOString(), base: production ? 'production' : 'sandbox', revisionAvant: 'fbf4c63',
    semaine, flagDejaLuParLaGarde: true, donneesAfficheesIdentiques: identiques, mesures }
  const sortie = path.join(os.tmpdir(), 'palimpseste-performance-navigation.json')
  fs.writeFileSync(sortie, JSON.stringify(resultat, null, 2) + '\n')
  console.log(JSON.stringify({ donneesAfficheesIdentiques: identiques, sortie }))
  if (!identiques) throw new Error('Les données ont changé entre les deux lectures ou diffèrent : contrôler avant livraison')
} finally {
  fs.rmSync(dossier, { recursive: true, force: true })
}
