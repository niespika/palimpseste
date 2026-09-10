// ============================================================================
// assigner-a-la-main-prod.ts — POSER DES EXERCICES À DES ÉLÈVES NOMMÉS,
// COMME LE PROFESSEUR, EN PRODUCTION.
// ----------------------------------------------------------------------------
// ⛔ POURQUOI. Le 07/09/2026, six élèves n'ont reçu aucun exercice au cycle
//    2026-09-07 : ils ont FINI leur calibration (>= 3 mesures partout), et au
//    segment 2 le routeur ne cible que les compétences SOUS ce seuil — sa liste
//    de priorité est donc vide (`sansCibleCiblable`, mesuré au rejeu). Le
//    segment 3 s'ouvre le 14/09 et rouvre le ciblage : ceci est un pont d'une
//    semaine, décidé par Louis le 07/09.
// ⭐ IL N'EMPRUNTE PAS LA VOIE `app/prof/conception/actions.ts` : celle-là
//    assigne une CLASSE ENTIÈRE et bascule l'instance en `statut = 'assigne'`
//    avec un `classe_id` — ce qui la SORTIRAIT du vivier commun du gabarit. Ici
//    on pose le dépôt seul, sur la forme exacte de celui du routeur
//    (`cycle-serveur.ts` : `assigne_at` à MIDI UTC du lundi du cycle), avec
//    `origine: 'prof'`. Les instances ne sont pas touchées.
// ⚠️ `assigne_at` à midi UTC ancre le dépôt dans la semaine d'assiduité du cycle
//    posé — à minuit UTC il tomberait dans la semaine PRÉCÉDENTE à Toronto.
// ⚠️ Un exercice DÉJÀ déposé à cet élève n'est jamais reproposé
//    (« resservir la même instance au même élève serait un défaut silencieux »).
// ⛔⛔ PRODUCTION. `--constat` (défaut) ne fait que lire. `--pose` écrit.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/assigner-a-la-main-prod.ts [--pose|--retire]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const PROD = 'ucmngachkxvvlegntuwh'
const REGISTRE = 'scripts/recette/.assigner-a-la-main-prod.registre.json'
const CYCLE = '2026-09-07'
const ASSIGNE_AT = `${CYCLE}T12:00:00Z`
const ECHEANCE = '2026-09-13T23:59:59Z'
// La séquence de méthode que le routeur a servie à toute la cohorte ce soir.
const CRANS = [1, 3, 4]

// Les cibles nominatives restent dans un fichier LOCAL ignoré par Git.
// --plan permet de choisir un autre fichier local ; aucun identifiant réel en source.
type Cible = { id: string; nom: string; competence: string | null; combien: number }
const cheminPlan = process.argv.includes('--plan')
  ? process.argv[process.argv.indexOf('--plan') + 1]
  : 'scripts/recette/.assigner-a-la-main-prod.plan.json'
function chargerPlan(): Cible[] {
  if (!cheminPlan || !fs.existsSync(cheminPlan)) throw new Error('Plan local absent : fournir --plan <fichier.json>. Aucune écriture effectuée.')
  const data: unknown = JSON.parse(fs.readFileSync(cheminPlan, 'utf8'))
  if (!Array.isArray(data) || data.length === 0) throw new Error('Le plan local doit contenir au moins une cible.')
  const ids = new Set<string>()
  return data.map((item: unknown, i: number) => {
    if (!item || typeof item !== 'object') throw new Error(`Cible ${i + 1} invalide.`)
    const c = item as Record<string, unknown>
    if (typeof c.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(c.id)
      || ids.has(c.id.toLowerCase()) || !(c.competence === null || (typeof c.competence === 'string' && c.competence.trim()))
      || typeof c.combien !== 'number' || !Number.isInteger(c.combien) || c.combien < 1 || c.combien > 50) {
      throw new Error(`Cible ${i + 1} invalide ou dupliquée.`)
    }
    ids.add(c.id.toLowerCase())
    return { id: c.id, nom: `Élève ${i + 1}`, competence: c.competence as string | null, combien: c.combien }
  })
}
const PLAN = process.argv.includes('--retire') ? [] : chargerPlan()

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
const POSE = process.argv.includes('--pose')
const RETIRE = process.argv.includes('--retire')

console.log(`Base : ${URL} (PRODUCTION) · cycle ${CYCLE}`)

if (RETIRE) {
  if (!fs.existsSync(REGISTRE)) { console.log('aucun registre : rien à retirer.'); process.exit(0) }
  const ids = (JSON.parse(fs.readFileSync(REGISTRE, 'utf8')) as { depots: string[] }).depots
  const ote = lu('suppr dépôts', await admin.from('exercices_depots').delete().in('id', ids).select('id')) as { id: string }[]
  console.log(`retiré : ${ote.length} dépôt(s) sur ${ids.length} inscrits au registre.`)
  fs.unlinkSync(REGISTRE)
  process.exit(0)
}

type Ex = {
  id: string; cran: number | null; statut: string; bloque: boolean | null; lieu: string | null
  classe_id: string | null; id_import: string | null
  modes_par_competence: Record<string, unknown> | null
  exercices_types: { code: string } | { code: string }[] | null
}
const un = <T>(x: T | T[] | null): T | null => (Array.isArray(x) ? x[0] ?? null : x)

const tous = lu('exercices', await admin.from('exercices')
  .select('id, cran, statut, bloque, lieu, classe_id, id_import, modes_par_competence, exercices_types(code)')
  .eq('statut', 'concu').limit(2000)) as Ex[]
// Le vivier servable du gabarit, tel que `cransPortesParLaBanque` le borne.
const vivier = tous.filter((e) => !e.bloque && e.lieu !== 'classe' && !e.classe_id
  && (e.id_import ?? '').startsWith('ex-gab-') && e.cran !== null && CRANS.includes(Number(e.cran)))
console.log(`vivier retenu : ${vivier.length} instance(s) du gabarit aux crans ${CRANS.join('·')}`)

const cibles = PLAN.map((p) => p.id)
const deja = lu('dépôts', await admin.from('exercices_depots')
  .select('eleve_id, exercice_id').in('eleve_id', cibles)) as { eleve_id: string; exercice_id: string }[]
const dejaDe = new Map<string, Set<string>>()
for (const id of cibles) dejaDe.set(id, new Set())
for (const d of deja) dejaDe.get(d.eleve_id)?.add(d.exercice_id)

const aPoser: Array<{ eleve_id: string; exercice_id: string; origine: string; assigne_at: string; echeance: string; statut: string }> = []
console.log('')
for (const p of PLAN) {
  const exclus = dejaDe.get(p.id) ?? new Set<string>()
  const pool = vivier.filter((e) => !exclus.has(e.id)
    && (p.competence === null || Object.keys(e.modes_par_competence ?? {}).includes(p.competence)))
  // ⭐ LA SÉQUENCE DE MÉTHODE, ÉTALÉE : un exercice par cran, en tournant sur
  //    1·3·4 — jamais trois fois le cran 1, qui n'est pas une semaine de travail.
  //    Le décalage par rang d'élève évite que deux élèves reçoivent le même lot.
  const rang = PLAN.findIndex((x) => x.id === p.id)
  const pris: Ex[] = []
  const objetsVus = new Set<string>()
  for (let tour = 0; pris.length < p.combien && tour < 10; tour++) {
    for (const cran of CRANS) {
      if (pris.length >= p.combien) break
      const auCran = pool.filter((x) => Number(x.cran) === cran && !pris.some((y) => y.id === x.id))
      if (auCran.length === 0) continue
      // Au premier tour on refuse un objet déjà pris, pour étaler les objets.
      const frais = tour === 0
        ? auCran.filter((x) => !objetsVus.has(un(x.exercices_types)?.code ?? '?'))
        : auCran
      const choix = (frais.length ? frais : auCran)
      const e = choix[(rang + tour) % choix.length]!
      objetsVus.add(un(e.exercices_types)?.code ?? '?')
      pris.push(e)
    }
  }
  const detail = pris.map((e) => `${un(e.exercices_types)?.code ?? '?'}/c${e.cran}`).join(' ')
  console.log(`  ${p.nom.padEnd(18)} cible ${String(p.competence ?? 'méthode (aucune lettre)').padEnd(16)} → ${pris.length}/${p.combien} : ${detail}`)
  if (pris.length < p.combien) console.log(`     ⚠️ seulement ${pris.length} candidat(s) : ${pool.length} dans le pool, ${exclus.size} déjà déposés à cet élève.`)
  for (const e of pris) {
    aPoser.push({ eleve_id: p.id, exercice_id: e.id, origine: 'prof',
      assigne_at: ASSIGNE_AT, echeance: ECHEANCE, statut: 'assigne' })
  }
}

console.log(`\ntotal à poser : ${aPoser.length} dépôt(s)`)
if (!POSE) { console.log('\n⭐ `--pose` les écrirait. Rien n\'a été écrit.'); process.exit(0) }
if (fs.existsSync(REGISTRE)) { console.error(`⛔ une pose est déjà en cours (${REGISTRE}). \`--retire\` d'abord.`); process.exit(2) }

const poses = lu('insert dépôts', await admin.from('exercices_depots').insert(aPoser as never[]).select('id, eleve_id')) as { id: string; eleve_id: string }[]
fs.writeFileSync(REGISTRE, JSON.stringify({ cycle: CYCLE, depots: poses.map((p) => p.id) }, null, 2))
console.log(`\nposés : ${poses.length} dépôt(s) — registre : ${REGISTRE}`)

console.log('\nAPRÈS (vérifié par requête) :')
const fin = lu('vérif', await admin.from('exercices_depots')
  .select('eleve_id, statut, origine').eq('assigne_at', ASSIGNE_AT).in('eleve_id', cibles)) as { eleve_id: string; statut: string; origine: string }[]
for (const p of PLAN) {
  const s = fin.filter((x) => x.eleve_id === p.id)
  console.log(`  ${p.nom.padEnd(18)} ${s.length} dépôt(s) au cycle ${CYCLE} (${[...new Set(s.map((x) => x.origine))].join(',') || '—'})`)
}
console.log(`\n⚠️ \`--retire\` supprime exactement ces ${poses.length} dépôts.`)
