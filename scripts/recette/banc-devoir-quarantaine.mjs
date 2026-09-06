// ============================================================================
// BANC C7 · L6 — CE QUE LA QUARANTAINE DES DEVOIRS AURAIT FERMÉ. Lecture seule.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/banc-devoir-quarantaine.mjs [--prod] [--jours 14] [--cycles 2]
//
// `01-` v5.9 §8.10 : « un devoir servi à un élève au cycle N ne lui est pas
// resservi avant le cycle N + 2 ». Pour chaque dépôt du routeur des N derniers
// jours, on regarde si l'élève avait DÉJÀ un dépôt sur le même devoir (le même
// matériau fabriqué, ou le devoir de la clé au cran 2) à moins de `cycles`
// cycles : c'est ce que la règle aurait écarté. On compte aussi, par objet, les
// élèves qui n'auraient plus eu aucun devoir frais.
// ⛔ Aucune écriture. En `--prod`, la clé de service ne sert qu'à lire.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? Number(process.argv[i + 1]) : d }
const PROD = process.argv.includes('--prod')
const JOURS = arg('--jours', 14)
const CYCLES = arg('--cycles', 2)
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const { devoirsDeLInstance } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
const { lundiDe, cyclesEcoules } = await import(`${RACINE}/utils/moteur/vivier.ts`)

const depuis = new Date(Date.now() - JOURS * 86_400_000).toISOString()
const un = (x) => (Array.isArray(x) ? x[0] ?? null : x)
const { data: mats } = await admin.from('exercices_materiaux').select('id, id_import').limit(10000)
const parImport = new Map((mats ?? []).filter((m) => m.id_import).map((m) => [m.id_import, m.id]))
// TOUS les dépôts des élèves concernés (la quarantaine lit l'histoire entière), puis les récents.
const { data: recents, error } = await admin.from('exercices_depots')
  .select('id, eleve_id, assigne_at, origine, exercices(id_import, cran, exercices_types(code), exercices_cas(materiau_id))')
  .gte('assigne_at', depuis).eq('origine', 'routeur').limit(5000)
if (error) throw new Error(error.message)
const eleves = [...new Set(recents.map((d) => d.eleve_id))]
const { data: tous } = await admin.from('exercices_depots')
  .select('id, eleve_id, assigne_at, exercices(id_import, exercices_cas(materiau_id))').in('eleve_id', eleves).limit(20000)
const histo = new Map()   // eleve → devoir → [dates]
for (const d of tous ?? []) {
  const ex = un(d.exercices)
  for (const dev of devoirsDeLInstance(ex?.id_import ?? null, ex?.exercices_cas ?? null, parImport)) {
    const m = histo.get(d.eleve_id) ?? new Map(); histo.set(d.eleve_id, m)
    m.set(dev, [...(m.get(dev) ?? []), { at: d.assigne_at, id: d.id }])
  }
}
console.log(`${PROD ? 'PRODUCTION' : 'bac à sable'} — ${recents.length} dépôt(s) du routeur depuis ${JOURS} jours, ${eleves.length} élève(s), quarantaine de ${CYCLES} cycle(s)`)
let fermes = 0, sansDevoir = 0, memeSemaine = 0
const parObjet = new Map(), parCran = new Map(), exemples = []
const objetsParEleve = new Map()
for (const d of recents) {
  const ex = un(d.exercices); const objet = un(ex?.exercices_types)?.code ?? '?'
  const devoirs = devoirsDeLInstance(ex?.id_import ?? null, ex?.exercices_cas ?? null, parImport)
  if (!devoirs.length) { sansDevoir += 1; continue }
  const cycle = lundiDe(d.assigne_at)
  const m = histo.get(d.eleve_id) ?? new Map()
  // un dépôt ANTÉRIEUR sur le même devoir, à moins de CYCLES cycles du cycle de ce dépôt
  let ferme = null
  // ⚠️ Le passage du 31/08 a posé 480 dépôts AU MÊME INSTANT : à date égale, c'est
  //    l'identifiant qui ordonne, sinon aucune paire de la même semaine ne se voit.
  for (const dev of devoirs) for (const { at, id } of m.get(dev) ?? []) {
    if (at > d.assigne_at || (at === d.assigne_at && id >= d.id)) continue
    const n = cyclesEcoules(at, cycle)
    if (n < CYCLES && (!ferme || at > ferme.at)) ferme = { dev, at, n }
  }
  const k = `${d.eleve_id}|${objet}`; objetsParEleve.set(k, (objetsParEleve.get(k) ?? { n: 0, fermes: 0 }))
  objetsParEleve.get(k).n += 1
  if (ferme) {
    fermes += 1; objetsParEleve.get(k).fermes += 1
    if (ferme.n === 0) memeSemaine += 1
    parObjet.set(objet, (parObjet.get(objet) ?? 0) + 1); parCran.set(ex?.cran, (parCran.get(ex?.cran) ?? 0) + 1)
    if (exemples.length < 8) exemples.push(`${d.eleve_id.slice(0, 8)} ${objet}/${ex?.cran} — même devoir servi le ${ferme.at.slice(0, 10)} (${ferme.n} cycle(s) avant)`)
  }
}
console.log(`\nce que la quarantaine aurait ÉCARTÉ : ${fermes} dépôt(s) sur ${recents.length - sansDevoir} (${sansDevoir} sans devoir) — dont ${memeSemaine} la même semaine`)
console.log('par objet :', [...parObjet].sort((a, b) => b[1] - a[1]).map(([o, n]) => `${o} ${n}`).join(' · ') || 'aucun')
console.log('par cran  :', [...parCran].sort((a, b) => a[0] - b[0]).map(([c, n]) => `${c} ${n}`).join(' · ') || 'aucun')
const sansFrais = [...objetsParEleve.entries()].filter(([, v]) => v.n > 0 && v.fermes === v.n)
console.log(`\nélève × objet où TOUT aurait été écarté (« sans devoir frais », servi dégradé + signal) : ${sansFrais.length}`,
  [...sansFrais.reduce((m, [k]) => m.set(k.split('|')[1], (m.get(k.split('|')[1]) ?? 0) + 1), new Map())].map(([o, n]) => `${o} ${n}`).join(' · '))
console.log('\nexemples :'); for (const e of exemples) console.log('  ', e)
