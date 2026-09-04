// ============================================================================
// ALLUMAGE — Aletheia, étayage par niveau : préparer les livres d'une base (spec § 10, E9, pas 3).
// ----------------------------------------------------------------------------
//   node --import ./scripts/register-calibration-resolver.mjs scripts/recette/aletheia-allumage-livres.mjs --base sandbox|prod (--livre <id> | --tous) [--sans-fiches] [--sans-passages]
// Pour chaque livre : 1. la découpe en phrases ; 2. la fiche RÉGÉNÉRÉE (porte ouverte : elle porte
// alors les propositions du « je ne sais pas ») — la fiche d'avant est SAUVEGARDÉE dans
// scripts/recette/sauvegardes/ ; 3. les passages clés de toutes les séances.
// ⚠️ Écrit dans la base visée. `--base prod` n'est joué que sur autorisation explicite de Louis
//    (04/09 : « vas-y pour le script »). La porte de l'étayage est OUVERTE le temps de la
//    génération si elle était fermée, puis REFERMÉE — la régénération de fiche la lit.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const require = createRequire(path.join(RACINE, 'package.json'))
const { createClient } = require('@supabase/supabase-js')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('--base'), LIVRE = arg('--livre'), TOUS = process.argv.includes('--tous')
if (!['sandbox', 'prod'].includes(BASE) || (!LIVRE && !TOUS)) { console.error('usage : --base sandbox|prod (--livre <id> | --tous) [--sans-fiches] [--sans-passages]'); process.exit(1) }

const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const [URL, CLE] = BASE === 'prod' ? [env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY] : [env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY]
const REF_ATTENDUE = BASE === 'prod' ? 'ucmngachkxvvlegntuwh' : 'aoakpxxlyvthzueaywna'
if (!(URL ?? '').includes(REF_ATTENDUE)) { console.error(`⛔ la base ${BASE} n'est pas ${REF_ATTENDUE} — arrêt`); process.exit(2) }
console.log(`base : ${BASE} (${REF_ATTENDUE})`)
// Les modules de l'app (createAdminClient, Anthropic) lisent process.env : on y met la base VISÉE.
process.env.NEXT_PUBLIC_SUPABASE_URL = URL
process.env.SUPABASE_SERVICE_ROLE_KEY = CLE
if (env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
const admin = createClient(URL, CLE, { auth: { persistSession: false } })

const { genererDecoupeLivre, lireLaPorteEtayage, basculerLaPorteEtayage } = await import('@/utils/aletheia/decoupage-serveur')
const { genererReferenceLivre } = await import('@/utils/aletheia-retours')
const { genererPassagesLivre } = await import('@/utils/aletheia/passages-serveur')

const { data: livres } = await admin.from('scriptorium_unites').select('id, label, nb_semaines').eq('type', 'livre').is('supprime_at', null).order('label')
const cibles = (livres ?? []).filter(l => TOUS || l.id === LIVRE)
if (cibles.length === 0) { console.error('aucun livre visé'); process.exit(1) }
console.log('livres :', cibles.map(l => `${l.label} (${l.id.slice(0, 8)})`).join(' · '))

const porteAvant = await lireLaPorteEtayage(admin)
console.log('porte de l’étayage :', porteAvant ? 'ouverte' : 'FERMÉE — ouverte le temps de la génération')
if (!porteAvant) { const r = await basculerLaPorteEtayage(admin, true); if (!r.ok) { console.error('✖', r.message); process.exit(1) } }
const SAUV = path.join(RACINE, 'scripts', 'recette', 'sauvegardes'); fs.mkdirSync(SAUV, { recursive: true })
try {
  for (const l of cibles) {
    console.log(`\n═══ ${l.label}`)
    const d = await genererDecoupeLivre(admin, l.id)
    console.log(d.ok ? `✔ découpe : ${d.nbPhrases} phrases, ${d.nbMasques} masques` : `✖ découpe : ${d.message}`)
    if (!process.argv.includes('--sans-fiches')) {
      const { data: avant } = await admin.from('aletheia_livre_reference').select('*').eq('scriptorium_livre_id', l.id).maybeSingle()
      const f = path.join(SAUV, `${BASE}-${l.id.slice(0, 8)}-fiche-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
      fs.writeFileSync(f, JSON.stringify(avant ?? null, null, 1)); console.log('  sauvegarde de la fiche d’avant :', path.relative(RACINE, f))
      await admin.from('aletheia_livre_reference').upsert({ scriptorium_livre_id: l.id, statut: 'PENDING', contenu: null, erreur_at: null, amende_par_prof: false, updated_at: new Date().toISOString() }, { onConflict: 'scriptorium_livre_id' })
      const t0 = Date.now(); await genererReferenceLivre(l.id)
      const { data: ref } = await admin.from('aletheia_livre_reference').select('statut, contenu').eq('scriptorium_livre_id', l.id).maybeSingle()
      const fiches = Array.isArray(ref?.contenu) ? ref.contenu : []
      console.log(`✔ fiche : ${ref?.statut} — ${fiches.length} séance(s), ${fiches.filter(x => x.these_eleve).length} avec propositions, ${((Date.now() - t0) / 1000).toFixed(0)} s`)
      if (ref?.statut !== 'READY') { console.log('  ✖ fiche non prête : passages sautés'); continue }
    }
    if (!process.argv.includes('--sans-passages')) {
      const t0 = Date.now(); const r = await genererPassagesLivre(admin, l.id)
      if (!r.ok) { console.log('✖ passages :', r.message); continue }
      const ok = r.resultats.filter(x => !x.erreur)
      console.log(`✔ passages : ${ok.reduce((n, x) => n + x.passages, 0)} sur ${ok.length} séance(s), ${r.resultats.filter(x => x.erreur).length} erreur(s), ${r.resultats.reduce((n, x) => n + x.rejets.length, 0) } rejet(s), ${((Date.now() - t0) / 1000).toFixed(0)} s`)
      for (const x of r.resultats.filter(x => x.erreur)) console.log(`   S${x.semaine} ✖ ${x.erreur}`)
    }
  }
} finally {
  if (!porteAvant) { const r = await basculerLaPorteEtayage(admin, false); console.log('\nporte refermée :', r.ok ? 'oui' : r.message) }
}
const { data: bilan } = await admin.from('aletheia_livre_reference').select('scriptorium_livre_id, statut, contenu')
for (const b of bilan ?? []) { const c = Array.isArray(b.contenu) ? b.contenu : []; console.log(`bilan ${b.scriptorium_livre_id.slice(0, 8)} : ${b.statut}, ${c.length} fiches, ${c.filter(x => x.passages_cles?.length).length} avec passages, ${c.filter(x => x.these_eleve).length} avec propositions`) }
process.exit(0)
