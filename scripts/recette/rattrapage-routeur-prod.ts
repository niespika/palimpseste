// ============================================================================
// rattrapage-routeur-prod.ts — REJOUER LA POSE DU ROUTEUR POUR DES ÉLÈVES
// NOMMÉS, EN PRODUCTION, SUR UN CYCLE DÉJÀ PASSÉ.
// ----------------------------------------------------------------------------
// ⛔ POURQUOI. Le passage du lundi peut laisser des élèves à zéro sans qu'aucune
//    trace n'en dise la raison : le bilan (`nonServis`, `ecartsDuVivier`,
//    `budgetsRefuses`) part aux journaux Vercel et n'est PAS persisté. Écrit le
//    07/09/2026, quand 7 élèves actifs sur 64 n'ont reçu aucun exercice au cycle
//    2026-09-07 — le premier sous le régime du gabarit.
// ⭐ IL APPELLE LE MÊME CODE QUE LE CRON — `poserLesSemainesDuRouteur` — avec
//    `elevesDemandes` et `cycleDemande`. Il est idempotent par `dejaServis` :
//    un élève qui porte déjà une décision sur le cycle est SAUTÉ. S'il ne décide
//    rien, il n'écrit rien — et le bilan imprimé dit alors POURQUOI.
// ⚠️ Il n'appelle PAS `poserLaSemaineDAssiduite` : la ligne de la semaine écoulée
//    existe déjà, et « une semaine non comptée ne se rattrape pas ».
// ⚠️ `poserLesSemainesDuRouteur` remplit aussi les MINUTES du cycle précédent sur
//    la ligne d'assiduité des élèves visés — recalcul idempotent, sauvegardé dans
//    le registre et reposé par `--retire`.
// ⛔⛔ PRODUCTION. Il lit `PROD_SUPABASE_URL` / `PROD_SUPABASE_SECRET_KEY`,
//    l'affiche, et n'écrit qu'avec `--pose`. `--constat` (défaut) ne fait que lire.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/rattrapage-routeur-prod.ts --eleves <uuid>,<uuid> \
//        [--cycle 2026-09-07] [--pose|--retire]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { poserLesSemainesDuRouteur } from '@/utils/moteur/cycle-serveur'

const PROD = 'ucmngachkxvvlegntuwh'
const REGISTRE = 'scripts/recette/.rattrapage-routeur-prod.registre.json'

for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[m[1]] === undefined) process.env[m[1]] = v
}
const URL = process.env.PROD_SUPABASE_URL!
const KEY = process.env.PROD_SUPABASE_SECRET_KEY!
if (!URL || !URL.includes(PROD) || !KEY) {
  console.error(`⛔ REFUS — PROD_SUPABASE_URL/SECRET_KEY absents ou inattendus. Vu : ${URL}`)
  process.exit(2)
}
const admin = createClient(URL, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

function lu<T>(quoi: string, r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(`${quoi} — ${r.error.message}`)
  return r.data as T
}
const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : null }
const vises = (arg('eleves') ?? '').split(',').map((x) => x.trim()).filter(Boolean)
const CYCLE = arg('cycle') ?? '2026-09-07'
const POSE = process.argv.includes('--pose')
const RETIRE = process.argv.includes('--retire')
const FUSEAU = 'America/Toronto'

if (!RETIRE && vises.length === 0) { console.error('⛔ --eleves <uuid>,<uuid> attendu'); process.exit(2) }

type Decision = { id: string; eleve_id: string; cycle_lundi: string; exercice_id: string | null }
type Depot = { id: string; eleve_id: string; exercice_id: string; assigne_at: string; statut: string }
type Assi = Record<string, unknown>

async function etat(ids: string[]) {
  const dec = lu('décisions', await admin.from('routeur_decisions')
    .select('id, eleve_id, cycle_lundi, exercice_id').eq('cycle_lundi', CYCLE).in('eleve_id', ids)) as Decision[]
  const dep = lu('dépôts', await admin.from('exercices_depots')
    .select('id, eleve_id, exercice_id, assigne_at, statut').eq('assigne_at', `${CYCLE}T12:00:00Z`).in('eleve_id', ids)) as Depot[]
  const assi = lu('assiduité', await admin.from('assiduite_hebdo')
    .select('*').in('eleve_id', ids)) as Assi[]
  return { dec, dep, assi }
}

function tableau(ids: string[], noms: Map<string, string>, e: Awaited<ReturnType<typeof etat>>) {
  for (const id of ids) {
    const d = e.dec.filter((x) => x.eleve_id === id).length
    const p = e.dep.filter((x) => x.eleve_id === id).length
    console.log(`  ${id.slice(0, 8)} ${(noms.get(id) ?? '?').padEnd(22)} décisions ${String(d).padStart(2)} · dépôts ${String(p).padStart(2)}`)
  }
}

console.log(`Base : ${URL} (PRODUCTION) · cycle ${CYCLE} · fuseau ${FUSEAU}`)

// ── `--retire` : défaire EXACTEMENT ce que la pose a écrit ──────────────────
if (RETIRE) {
  if (!fs.existsSync(REGISTRE)) { console.log('aucun registre : rien à retirer.'); process.exit(0) }
  const av = JSON.parse(fs.readFileSync(REGISTRE, 'utf8')) as {
    cycle: string; vises: string[]; dec: Decision[]; dep: Depot[]; assi: Assi[] }
  const ap = await etat(av.vises)
  const decNeuves = ap.dec.filter((x) => !av.dec.some((y) => y.id === x.id)).map((x) => x.id)
  const depNeufs = ap.dep.filter((x) => !av.dep.some((y) => y.id === x.id)).map((x) => x.id)
  // ⛔ Les dépôts d'abord : `exercices_depots.routeur_decision_id` pend aux décisions.
  if (depNeufs.length) lu('suppr dépôts', await admin.from('exercices_depots').delete().in('id', depNeufs).select('id'))
  if (decNeuves.length) lu('suppr décisions', await admin.from('routeur_decisions').delete().in('id', decNeuves).select('id'))
  for (const l of av.assi) {
    const { error } = await admin.from('assiduite_hebdo').upsert(l, { onConflict: 'eleve_id,cycle_lundi' })
    if (error) console.error(`  ⛔ assiduité non reposée : ${error.message}`)
  }
  console.log(`retiré : ${depNeufs.length} dépôt(s), ${decNeuves.length} décision(s) ; ${av.assi.length} ligne(s) d'assiduité reposées.`)
  const fin = await etat(av.vises)
  console.log(`vérifié par requête : décisions ${fin.dec.length} (avant ${av.dec.length}) · dépôts ${fin.dep.length} (avant ${av.dep.length})`)
  fs.unlinkSync(REGISTRE)
  process.exit(0)
}

const profils = lu('profils', await admin.from('profiles').select('id, display_name').in('id', vises)) as { id: string; display_name: string }[]
const noms = new Map(profils.map((p) => [p.id, p.display_name ?? '(sans nom)']))
const avant = await etat(vises)
console.log(`\nAVANT (${vises.length} élève(s) visés) :`)
tableau(vises, noms, avant)

if (!POSE) {
  console.log('\n⭐ `--pose` appellerait `poserLesSemainesDuRouteur` sur ces seuls élèves.')
  console.log('   Idempotent : un élève portant déjà une décision sur le cycle est SAUTÉ (`dejaServis`).')
  console.log('   S\'il ne décide rien, il n\'écrit rien — et le bilan dira pourquoi.')
  process.exit(0)
}

if (fs.existsSync(REGISTRE)) { console.error(`⛔ un rattrapage est déjà en cours (${REGISTRE}). \`--retire\` d'abord.`); process.exit(2) }
fs.writeFileSync(REGISTRE, JSON.stringify({ cycle: CYCLE, vises, ...avant }, null, 2))
console.log(`\nregistre AVANT écrit : ${REGISTRE}`)

const bilan = await poserLesSemainesDuRouteur(admin as never, FUSEAU, CYCLE, {
  cycleDemande: CYCLE,
  elevesDemandes: vises,
})

console.log('\n══ BILAN DU ROUTEUR ══')
console.log(`  attendus ${bilan.elevesAttendus} · servis ${bilan.elevesServis} · déjà servis ${bilan.dejaServis} · non servis ${bilan.nonServis.length}`)
console.log(`  exercices posés ${bilan.exercicesPoses} · décisions ${bilan.decisionsEcrites} · dépôts ${bilan.depotsPoses} · sondes ${bilan.sondesPosees}`)
console.log(`  segment ${bilan.segment} (${bilan.regime}) · routeur_actif ${bilan.routeurActif} · durée ${Math.round(bilan.dureeMs / 1000)} s`)
if (bilan.motif) console.log(`  motif global : ${bilan.motif}`)
console.log(`  sans cible ciblable ${bilan.sansCibleCiblable} · viviers vides ${bilan.viviersVides}`)
console.log(`  minutes remplies ${bilan.minutesRemplies} · sans ligne ${bilan.minutesSansLigne}`)
if (bilan.coupure) console.log(`  ⛔ COUPURE : ${JSON.stringify(bilan.coupure)}`)

if (bilan.nonServis.length) {
  console.log('\n── NON SERVIS, ET LEUR MOTIF ──')
  for (const n of bilan.nonServis) console.log(`  ${n.eleveId.slice(0, 8)} ${(noms.get(n.eleveId) ?? '?').padEnd(22)} ${n.motif}`)
}
if (bilan.budgetsRefuses.length) {
  console.log('\n── BUDGETS REFUSÉS ──')
  for (const b of bilan.budgetsRefuses) console.log(`  ${b.eleveId.slice(0, 8)} ${(noms.get(b.eleveId) ?? '?').padEnd(22)} ${b.motif}`)
}
if (Object.keys(bilan.ecartsDuVivier).length) {
  console.log('\n── LES ÉCARTS DU VIVIER, COMPTÉS (« un vide expliqué ») ──')
  for (const [m, n] of Object.entries(bilan.ecartsDuVivier).sort((a, b) => (b[1] as number) - (a[1] as number))) {
    console.log(`  ${String(n).padStart(6)}  ${m}`)
  }
}
if (bilan.ecartsAuPlancher.length) {
  console.log('\n── ÉCARTS AU PLANCHER ──')
  for (const e of bilan.ecartsAuPlancher) console.log(`  ${e.eleveId.slice(0, 8)} ${(noms.get(e.eleveId) ?? '?').padEnd(22)} ${e.assignees} min assignées, plancher ${e.plancher}, manque ${e.manque}`)
}
if (bilan.erreurs.length) {
  console.log('\n── ERREURS ──')
  for (const e of bilan.erreurs) console.log(`  ${e}`)
}

console.log('\nAPRÈS (vérifié par requête) :')
const apres = await etat(vises)
tableau(vises, noms, apres)
console.log(`\ntotal : décisions ${avant.dec.length} → ${apres.dec.length} · dépôts ${avant.dep.length} → ${apres.dep.length}`)
console.log(`⚠️ \`--retire\` défait exactement ce qui vient d'être écrit (registre : ${REGISTRE}).`)
