// ============================================================================
// LA TROISIÈME VOIE DANS LE VIVIER — en mémoire, sans rien poser. 10/09/2026. LECTURE SEULE.
// ----------------------------------------------------------------------------
// Lit la doctrine et les instances comme le cycle, calcule les cours vus et les
// notions vues d'UNE classe, puis joue `constituerLeVivier` deux fois : porte fermée,
// porte ouverte (simulée dans le contexte, la base n'est pas touchée). Compte les
// instances retenues / écartées par motif, sur les instances dont un matériau est
// rattaché par notions (celles de la salve THLP), et sur le tout.
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs scripts/recette/vivier-notions.mjs \
//        --classe THLP [--prod] [--simule "Les métamorphoses du moi"]
// `--simule` ajoute une notion aux notions vues (pour éprouver en bac à sable, où
// aucune classe n'a vu de cours des Métamorphoses).
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d }
const PROD = process.argv.includes('--prod')
const CLASSE = arg('--classe', 'THLP')
const SIMULE = arg('--simule', null)
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const { lireLesInstances, lireLesCoursVus, lireLesNotionsDesCours, notionsVuesDe } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
const { constituerLeVivier } = await import(`${RACINE}/utils/moteur/vivier.ts`)
const { chargerDoctrineDepuisBase } = await import(`${RACINE}/utils/fabrique/doctrine.ts`)
const { ensembleDeNotions } = await import(`${RACINE}/utils/fabrique/notions.ts`)

const { data: classes } = await admin.from('classes').select('id, nom, type_pedagogique').eq('nom', CLASSE)
const classe = classes?.[0]
if (!classe) { console.log(`classe « ${CLASSE} » introuvable`); process.exit(1) }
const parcours = classe.type_pedagogique ? [classe.type_pedagogique] : ['hlp']
const aujourdHui = new Date().toISOString().slice(0, 10)
const doctrine = await chargerDoctrineDepuisBase(admin)
const { instances, incidents } = await lireLesInstances(admin, doctrine)
const vus = await lireLesCoursVus(admin, [classe.id], aujourdHui)
const cours = vus.parClasse.get(classe.id) ?? new Set()
const notions = await lireLesNotionsDesCours(admin, [...cours])
const vues = notionsVuesDe(cours, notions.parCours)
if (SIMULE) for (const n of ensembleDeNotions([SIMULE])) vues.add(n)
console.log(`${PROD ? 'PRODUCTION' : 'bac à sable'} — ${classe.nom} (${parcours}) — ${instances.length} instance(s) lues, ${cours.size} cours vus, notions vues : ${[...vues].join(' · ') || '—'}`)
for (const i of incidents.slice(0, 5)) console.log(`  ⚠ ${i}`)

const parNotions = new Set(instances.filter((i) => i.materiaux.some((m) => m.coursEtat === 'notions')).map((i) => i.exerciceId))
console.log(`instances dont un matériau est rattaché par notions : ${parNotions.size}`)
const compte = (liste, cle) => { const m = new Map(); for (const x of liste) { const k = cle(x); m.set(k, (m.get(k) ?? 0) + 1) } return [...m].sort((p, q) => q[1] - p[1]) }
for (const actif of [false, true]) {
  const v = constituerLeVivier(instances, {
    parcours, coursVus: cours, notionsActif: actif, notionsVues: vues,
    positionsDeLecture: new Map(), instancesDejaDeposees: new Set(), classesDeLEleve: new Set([classe.id]),
  })
  const ret = v.retenus.filter((r) => parNotions.has(r.instance?.exerciceId ?? r.exerciceId))
  const ec = v.ecartes.filter((e) => parNotions.has(e.exerciceId))
  console.log(`\nporte ${actif ? 'OUVERTE (simulée)' : 'FERMÉE'} — retenues au total : ${v.retenus.length} ; par notions : retenues ${ret.length}, écartées ${ec.length}`)
  for (const [m, n] of compte(ec, (e) => e.motif)) console.log(`   écart ${m} : ${n}`)
}
