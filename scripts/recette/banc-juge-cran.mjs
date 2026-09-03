// ============================================================================
// C7 · L1 — LE BANC DU JUGE DU CRAN, sur des dépôts EXISTANTS.
// ----------------------------------------------------------------------------
// « Fait quand : […] sur un banc de dépôts existants, le verdict change là où le
// juge inventait » (`07-` §2, C7-L1). Pour chaque dépôt jugé aux crans 4·5·7·9,
// le juge tranche DEUX fois : avec LES DOCUMENTS (le devoir d'élève, l'énoncé,
// la version corrigée, la réponse attendue, la zone), puis À L'AVEUGLE (la
// consigne et la copie seules — ce que le juge d'hier recevait).
// ⛔ AUCUNE ÉCRITURE EN BASE : `jugerUneEntree` ne touche pas au dépôt. Les
//    appels, eux, sont réels et facturés (module `exercices-chaine-juge`).
// `--retour` (un dépôt) : rejoue aussi la mesure et engendre le retour À BLANC
//    avec le verdict, pour voir si Calame cite le passage.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/banc-juge-cran.mjs [--prod] [--limite N] [--retour]
// ============================================================================
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = fs.readFileSync('.env.local', 'utf8')
const g = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^"|"$/g, '') : null
}
const prod = process.argv.includes('--prod')
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? Number(process.argv[i + 1]) : d }
const LIMITE = arg('--limite', 8)
const url = prod ? g('PROD_SUPABASE_URL') : g('NEXT_PUBLIC_SUPABASE_URL')
const key = prod ? g('PROD_SUPABASE_SECRET_KEY') : g('SUPABASE_SERVICE_ROLE_KEY')
process.env.ANTHROPIC_API_KEY = g('ANTHROPIC_API_KEY')
process.env.SUPABASE_SERVICE_ROLE_KEY = key
process.env.NEXT_PUBLIC_SUPABASE_URL = url
const admin = createClient(url, key, { auth: { persistSession: false } })
console.log(`base : ${url.match(/https:\/\/([a-z]+)\./)?.[1]} (${prod ? 'PRODUCTION' : 'bac à sable'})`)

const { lireContexteDuDepot, rejouerUneCompetence, cibleDuRetour, engendrerLeRetour } =
  await import('../../utils/chaine/chaine.ts')
const { jugerUneEntree, entreeDuContexte } = await import('../../utils/chaine/juge-cran-serveur.ts')
const { JUGE_AUX_CRANS } = await import('../../utils/chaine/juge-cran.ts')
const { lireConfig } = await import('../../utils/chaine/config.ts')
const { modeleDeLaChaine } = await import('../../utils/chaine/modele.ts')
const { COMPETENCES } = await import('../../utils/chaine/types.ts')
const config = lireConfig()

const { data: depots, error } = await admin.from('exercices_depots')
  .select('id, statut, v1_remis_at, exercices(cran)')
  .in('statut', ['v1_remis', 'retour_publie', 'vf_remis', 'clos'])
  .order('v1_remis_at', { ascending: false }).limit(200)
if (error) { console.error(error); process.exit(1) }
const cibles = (depots ?? [])
  .filter((d) => JUGE_AUX_CRANS.has(Number(d.exercices?.cran)))
  .slice(0, LIMITE)
console.log(`${cibles.length} dépôt(s) aux crans 4·5·7·9 — deux verdicts chacun, aucune écriture\n`)

const aveugle = (e) => ({
  ...e, texteSupport: null,
  cas: e.cas.map((c) => ({ ordre: c.ordre, materiau: null, versionCorrigee: null, defaut: null,
    reponseAttendue: null, passageFautif: null, zone: null, choix: null })),
})
const court = (t, n = 70) => (t ?? '—').replace(/\s+/g, ' ').slice(0, n)

let appels = 0, differents = 0, passagesA = 0, sansDocs = 0
const lignes = []
for (const d of cibles) {
  const ctx = await lireContexteDuDepot(admin, d.id)
  const production = ctx.productionV1
  if (!production) { console.log(`  ${d.id.slice(0, 8)} — pas de production v1`); continue }
  const modele = modeleDeLaChaine({ lieu: ctx.lieu, forme: ctx.forme, diagnostic: ctx.paireDiagnostic }, config)
  const entree = entreeDuContexte(ctx, 'v1', production)
  const docs = entree.cas.filter((c) => c.materiau || c.defaut || c.versionCorrigee).length
  if (!docs) sansDocs++
  const attribution = { eleveId: ctx.eleveId, classeId: ctx.classeId, depotId: ctx.depotId, version: 'v1' }
  const A = await jugerUneEntree(admin, { entree, modele, attribution })
  const B = await jugerUneEntree(admin, { entree: aveugle(entree), modele, attribution })
  appels += A.appels + B.appels
  const a = A.verdict, b = B.verdict
  if (a && b && a.reussi !== b.reussi) differents++
  if (a?.passage) passagesA++
  lignes.push({ id: d.id.slice(0, 8), cran: ctx.cran, objet: ctx.objet,
    docs: `${A.verdict ? 'ok' : 'REFUS'}·${a ? (a.reussi ? 'réussi' : 'raté') : '—'}`,
    aveugle: `${B.verdict ? 'ok' : 'REFUS'}·${b ? (b.reussi ? 'réussi' : 'raté') : '—'}`,
    probleme_docs: court(a?.probleme_vu, 60), probleme_aveugle: court(b?.probleme_vu, 60),
    passage: court(a?.passage, 50) })
  console.log(`  ${d.id.slice(0, 8)} cran ${ctx.cran} ${ctx.objet} — documents : ${lignes.at(-1).docs} · aveugle : ${lignes.at(-1).aveugle}`)
  if (a) console.log(`      motif (documents) : ${court(a.motif, 160)}`)
  if (b) console.log(`      motif (aveugle)   : ${court(b.motif, 160)}`)
  for (const al of [...A.alertes, ...B.alertes]) console.log(`      ⚠️ ${al}`)

  // `--ecrire` (bac à sable seulement) : le verdict AVEC documents s'écrit sur le
  // dépôt, par le chemin réel (`jugerLeCran`) — pour éprouver la colonne et sa contrainte.
  if (process.argv.includes('--ecrire') && a && !prod) {
    const { jugerLeCran } = await import('../../utils/chaine/juge-cran-serveur.ts')
    const j = await jugerLeCran(admin, { ctx, version: 'v1', modele, production })
    appels += j.appels
    const { data: relu } = await admin.from('exercices_depots').select('verdicts_cran').eq('id', d.id).maybeSingle()
    console.log(`      écrit sur le dépôt : ${j.verdict ? 'oui' : 'NON'} · relu : ${JSON.stringify(relu?.verdicts_cran)?.slice(0, 160)}`)
    for (const al of j.alertes) console.log(`      ⚠️ ${al}`)
  }

  if (process.argv.includes('--retour') && lignes.length === 1 && a) {
    console.log('\n  — retour À BLANC avec le verdict (la mesure est rejouée : sept appels)')
    const squelettes = []
    for (const c of COMPETENCES) {
      const r = await rejouerUneCompetence(admin, { depotId: d.id, competence: c, version: 'v1', modele, ctx })
      if (r?.squelette) { squelettes.push(r.squelette); appels += r.appels }
    }
    const cible = cibleDuRetour(ctx, squelettes.map((s) => s.competence))
    const ctxOuvert = { ...ctx, jugeDocumentsActif: true }
    const verdict = { ...a, version: 'v1', cran: ctx.cran, at: new Date().toISOString(), modele }
    const b2 = await engendrerLeRetour(admin, {
      ctx: ctxOuvert, version: 'v1', modele, squelettes, registre: null, cible, sansEcriture: true, verdictCran: verdict,
    })
    appels += b2.appels
    const points = b2.retour?.points ?? []
    const cite = a.passage ? points.some((p) => (p.ancrage?.citation ?? '').includes(a.passage) || (p.texte ?? '').includes(a.passage)) : null
    console.log(`  retour : ${points.length} point(s) · cite le passage du juge : ${cite === null ? 'aucun passage' : cite}`)
    for (const p of points) console.log(`    · [${p.nature}] ${court(p.texte, 200)}`)
    for (const al of b2.alertes) console.log(`    ⚠️ ${al}`)
  }
}
console.log('\n' + ['id', 'cran', 'objet', 'documents', 'aveugle', 'problème vu (documents)', 'problème vu (aveugle)', 'passage cité'].join(' | '))
for (const l of lignes) console.log([l.id, l.cran, l.objet, l.docs, l.aveugle, l.probleme_docs, l.probleme_aveugle, l.passage].join(' | '))
console.log(`\n${lignes.length} dépôt(s) · verdict différent avec/sans documents : ${differents} · passage cité (documents) : ${passagesA} · dépôts sans documents en banque : ${sansDocs} · appels : ${appels}`)
