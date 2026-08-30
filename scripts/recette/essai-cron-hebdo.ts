// ============================================================================
// essai-cron-hebdo.ts — FAIRE TOURNER LE DÉCLENCHEUR HEBDOMADAIRE, EN BAC À
// SABLE, AVANT QUE LA PRODUCTION LE FASSE POUR DE VRAI.
// ----------------------------------------------------------------------------
// ⛔ POURQUOI. `routeur_decisions` est à **0 dans LES DEUX bases** : ce chemin
//    d'écriture n'a jamais tourné NULLE PART. Or le cron de production le
//    déclenche le lundi 2026-08-31 à 09:30 UTC, sur 62 élèves.
//
// ⭐ CE QUE CE SCRIPT REJOUE, À L'IDENTIQUE. Les deux fonctions prennent
//    `aujourdHui` en paramètre — on leur passe donc **2026-08-31**, et l'ordre
//    est celui de la route : la COLLECTE d'abord (elle pose la ligne de la
//    semaine écoulée), le ROUTEUR ensuite (il remplit les minutes de CETTE
//    ligne, puis pose la semaine qui commence). ⛔ Inverser perdrait les
//    minutes en silence.
//
// ⛔ BAC À SABLE UNIQUEMENT — refus explicite sinon.
// ⚠️ IL ÉCRIT, ET LE DIT : `assiduite_hebdo`, `routeur_decisions`,
//    `exercices_depots`, et surtout **`competences_niveaux`** — le cold start
//    pose la première lettre là où elle est nulle (98 lignes sur 102 au 30/08).
//    ⭐ Il ne l'écrase jamais : « une lettre existante ne s'écrase pas ».
//    Le registre garde l'état AVANT, et `--retire` le repose.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/essai-cron-hebdo.ts [--constat|--essai|--retire]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { poserLaSemaineDAssiduite } from '@/utils/assiduite/collecte-serveur'
import { poserLesSemainesDuRouteur } from '@/utils/moteur/cycle-serveur'

const REGISTRE = 'scripts/recette/.essai-cron-hebdo.json'
const SANDBOX = 'aoakpxxlyvthzueaywna'
const LUNDI = '2026-08-31'   // le jour que le cron verra
const FUSEAU = 'America/Toronto'

for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[m[1]] === undefined) process.env[m[1]] = v
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
if (!URL.includes(SANDBOX)) { console.error(`⛔ REFUS — bac à sable uniquement. Vu : ${URL}`); process.exit(2) }
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } })

// ⚠️ supabase-js NE LÈVE PAS.
function lu<T>(quoi: string, r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(`${quoi} — ${r.error.message}`)
  return r.data as T
}
const a = (n: string) => process.argv.includes(`--${n}`)

async function socle() {
  const niveaux = lu('niveaux', await admin.from('competences_niveaux').select('*'))
  const assi = lu('assiduite', await admin.from('assiduite_hebdo').select('eleve_id, cycle_lundi'))
  const dec = lu('décisions', await admin.from('routeur_decisions').select('id'))
  const dep = lu('dépôts', await admin.from('exercices_depots').select('id'))
  return { niveaux, assi, dec, dep }
}

async function constat() {
  const s = await socle()
  console.log(`\nBase : ${URL}`)
  console.log(`  competences_niveaux : ${s.niveaux.length} · lettre nulle (le cold start y écrira) : `
    + `${(s.niveaux as { lettre: string | null }[]).filter((n) => n.lettre === null).length}`)
  console.log(`  assiduite_hebdo : ${s.assi.length} · routeur_decisions : ${s.dec.length} · exercices_depots : ${s.dep.length}`)
  console.log(`\n⭐ \`--essai\` rejouerait le cron du ${LUNDI} : collecte PUIS routeur, dans cet ordre.`)
}

async function essai() {
  if (fs.existsSync(REGISTRE)) throw new Error(`un essai est déjà en cours (${REGISTRE}). \`--retire\` d'abord.`)
  const avant = await socle()
  fs.writeFileSync(REGISTRE, JSON.stringify(avant, null, 2))
  console.log(`registre écrit : ${REGISTRE} (${avant.niveaux.length} niveaux, ${avant.dep.length} dépôts)`)

  console.log(`\n════ LE CRON DU ${LUNDI}, REJOUÉ ════`)
  const t0 = Date.now()
  const collecte = await poserLaSemaineDAssiduite(admin as never, FUSEAU, LUNDI)
  const t1 = Date.now()
  console.log(`\n① COLLECTE — ${((t1 - t0) / 1000).toFixed(1)} s`)
  console.log('  ' + JSON.stringify(collecte, null, 2).split('\n').join('\n  ').slice(0, 1200))

  const routeur = await poserLesSemainesDuRouteur(admin as never, FUSEAU, LUNDI)
  const t2 = Date.now()
  console.log(`\n② ROUTEUR — ${((t2 - t1) / 1000).toFixed(1)} s`)
  const r = routeur as unknown as Record<string, unknown>
  // ⭐ On imprime D'ABORD les compteurs et les ÉCARTS DU VIVIER — c'est eux qui
  //    disent POURQUOI rien n'est posé. La liste des non-servis, elle, se répète.
  for (const k of ['segment', 'regime', 'routeurActif', 'motif', 'elevesAttendus', 'elevesServis',
    'sansCibleCiblable', 'viviersVides', 'exercicesPoses', 'decisionsEcrites', 'depotsPoses',
    'minutesRemplies', 'minutesSansLigne']) console.log(`  ${k} : ${JSON.stringify(r[k])}`)
  console.log(`  ecartsDuVivier : ${JSON.stringify(r.ecartsDuVivier, null, 2).split('\n').join('\n  ')}`)
  console.log(`  ecartsAuPlancher : ${JSON.stringify(r.ecartsAuPlancher).slice(0, 600)}`)
  const ns = (r.nonServis ?? []) as { motif: string }[]
  const motifs = new Map<string, number>()
  for (const x of ns) motifs.set(x.motif.slice(0, 90), (motifs.get(x.motif.slice(0, 90)) ?? 0) + 1)
  console.log(`  nonServis : ${ns.length} — motifs distincts :`)
  for (const [m, n2] of motifs) console.log(`    ×${n2} ${m}…`)
  console.log(`  erreurs : ${JSON.stringify((r.erreurs as string[] ?? []).slice(0, 6))}`)

  const apres = await socle()
  const dt = (t2 - t0) / 1000
  console.log(`\n════ TOTAL ${dt.toFixed(1)} s pour ${new Set((avant.niveaux as {eleve_id:string}[]).map((n) => n.eleve_id)).size} élèves ════`)
  console.log(`  assiduite_hebdo   ${avant.assi.length} → ${apres.assi.length}`)
  console.log(`  routeur_decisions ${avant.dec.length} → ${apres.dec.length}`)
  console.log(`  exercices_depots  ${avant.dep.length} → ${apres.dep.length}`)
  console.log(`  competences_niveaux, lettre nulle : `
    + `${(avant.niveaux as {lettre:string|null}[]).filter((n) => n.lettre === null).length} → `
    + `${(apres.niveaux as {lettre:string|null}[]).filter((n) => n.lettre === null).length}`)
  // ⭐ L'EXTRAPOLATION, qui est tout l'objet de l'essai.
  const eleves = 17, prod = 62
  console.log(`\n⭐ EXTRAPOLATION À LA PRODUCTION : ${dt.toFixed(1)} s pour ${eleves} élèves `
    + `⇒ ~${(dt * prod / eleves).toFixed(0)} s pour ${prod}. Plafond de la route : 300 s.`)
  console.log(`⚠️ Depuis CETTE machine, la latence Supabase est ~338 ms ; depuis Vercel (iad1) elle `
    + `mesure 160-332 ms. L'ordre de grandeur est comparable, la mesure reste indicative.`)
}

async function retire() {
  if (!fs.existsSync(REGISTRE)) { console.log('aucun registre : rien à retirer.'); return }
  const avant = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
  const depAvant = new Set((avant.dep as { id: string }[]).map((d) => d.id))
  const decAvant = new Set((avant.dec as { id: string }[]).map((d) => d.id))

  // ⛔ L'ORDRE : les enfants d'abord. Les dépôts nés de l'essai référencent les décisions.
  const depMaintenant = lu('dépôts', await admin.from('exercices_depots').select('id'))
  const aSupprimer = (depMaintenant as { id: string }[]).filter((d) => !depAvant.has(d.id)).map((d) => d.id)
  if (aSupprimer.length) lu('suppr dépôts', await admin.from('exercices_depots').delete().in('id', aSupprimer).select('id'))
  const decMaintenant = lu('décisions', await admin.from('routeur_decisions').select('id'))
  const decSuppr = (decMaintenant as { id: string }[]).filter((d) => !decAvant.has(d.id)).map((d) => d.id)
  if (decSuppr.length) lu('suppr décisions', await admin.from('routeur_decisions').delete().in('id', decSuppr).select('id'))
  lu('suppr assiduité', await admin.from('assiduite_hebdo').delete().neq('eleve_id', '00000000-0000-0000-0000-000000000000').select('eleve_id'))

  // ⭐ Les niveaux se REPOSENT tels qu'ils étaient — le cold start en a écrit.
  for (const n of avant.niveaux as Record<string, unknown>[]) {
    const { error } = await admin.from('competences_niveaux').upsert(n as never, { onConflict: 'eleve_id,competence' })
    if (error) console.error(`  ⛔ niveau non reposé : ${error.message}`)
  }

  // ⭐ LE RETOUR SE VÉRIFIE PAR REQUÊTE.
  const apres = await socle()
  console.log(`\nVÉRIFIÉ PAR REQUÊTE — dépôts ${apres.dep.length} (avant ${avant.dep.length}) · `
    + `décisions ${apres.dec.length} (${avant.dec.length}) · assiduité ${apres.assi.length} (${avant.assi.length})`)
  console.log(`  niveaux à lettre nulle : `
    + `${(apres.niveaux as {lettre:string|null}[]).filter((n) => n.lettre === null).length} `
    + `(avant ${(avant.niveaux as {lettre:string|null}[]).filter((n) => n.lettre === null).length})`)
  fs.unlinkSync(REGISTRE)
  console.log('✅ registre retiré.')
}

const mode = a('essai') ? essai : a('retire') ? retire : constat
mode().catch((e) => { console.error(`\n⛔ ${e.message}`); process.exit(1) })
