// ============================================================================
// RÉPARATION — `monitoring_mesures.competences_couvertes`, contre les mesures
// RÉELLEMENT écrites.
// ----------------------------------------------------------------------------
// ⛔ POURQUOI ELLE A EXISTÉ. `competencesQuiComptent()` ne filtrait que sur le
//    STATUT DE RECETTE, quand ses entrées viennent de `ctx.confianceDeclaree` —
//    ce que l'ÉLÈVE a déclaré à sa remise. Une compétence déclarée mais NON
//    MESURÉE (écartée par la porte de mode de C5-L3, ou par tout autre motif)
//    entrait donc dans `competences_couvertes[]` avec un `niveau` à `null` : la
//    ligne prétendait couvrir ce qu'elle n'avait pas mesuré, et le `07-` §1.4
//    dit exactement pourquoi c'est grave — *« faute de quoi on ne saura jamais
//    relire la mesure »*.
//
// ⭐ LE CODE EST CORRIGÉ (27/08) : `competencesQuiComptent()` prend les niveaux
//    obtenus et écarte, avec son motif nommé, ce que la chaîne n'a pas mesuré.
//    **Ce script répare les lignes écrites AVANT ce correctif.**
//
// ⚠️ IL NE DEVRAIT PLUS JAMAIS RIEN TROUVER. S'il trouve quelque chose sur des
//    lignes postérieures au 27/08, c'est que le correctif a régressé.
//
// ⭐ CE QU'IL FAIT, ET IL NE DEVINE RIEN : il lit les mesures RÉELLEMENT écrites
//    dans `competences_mesures` pour chaque dépôt, et retranche de la ligne de
//    Monitoring tout ce qui n'y figure pas — `competences_couvertes`, plus les
//    trois volets de `observables.confiance_de_remise` (`niveaux`, `confiances`,
//    `par_competence`). *La base fait foi contre elle-même.*
//
// ⭐ IDEMPOTENT : une seconde passe rend « 0 à réparer ». Il SAUVEGARDE les
//    lignes avant écriture (dans `/tmp`, hors du dépôt : elles portent des
//    données d'élèves et n'ont rien à faire dans git).
//
// ⚠️ IL ÉCRIT EN PRODUCTION. Sans `--ecris`, il tourne À BLANC et imprime le
//    diff ligne par ligne.
//
// Joué le 27/08/2026 sur l'exercice `b5f7a719` : 8 lignes réparées, sur mandat
// explicite de Louis. Voir `RELEVE_C5_L3_2026-08-27.md` et `C5L3-20`.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/reparer-competences-couvertes.mjs [<exerciceId>] [--ecris]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const ECRIS = process.argv.includes('--ecris')
const env = Object.fromEntries(fs.readFileSync('.env.local','utf-8').split('\n')
  .filter(l=>l.includes('=')&&!l.trim().startsWith('#'))
  .map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]))
const db = createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY,{auth:{persistSession:false}})
const EX = process.argv.find(a => /^[0-9a-f-]{36}$/.test(a)) ?? 'b5f7a719-d79e-4dcf-aab3-4281a5956e17'

const { data: dd } = await db.from('exercices_depots').select('id, statut').eq('exercice_id',EX).limit(100)
const ids=(dd??[]).filter(d=>d.statut==='v1_remis').map(d=>d.id)

// LES MESURES RÉELLEMENT ÉCRITES, par dépôt — la vérité de référence.
const { data: mes } = await db.from('competences_mesures').select('depot_id, competence').in('depot_id', ids).limit(500)
const mesureesPar = {}
for (const m of mes??[]) (mesureesPar[m.depot_id] ??= new Set()).add(m.competence)

const { data: mon, error } = await db.from('monitoring_mesures').select('*').in('depot_id', ids).order('id')
if (error) { console.log('ERREUR lecture:', error.message); process.exit(1) }

// SAUVEGARDE — la réparation doit être réversible.
const sauve = `/tmp/monitoring_mesures_avant_${Date.now()}.json`
fs.writeFileSync(sauve, JSON.stringify(mon, null, 2))
console.log(`sauvegarde des ${mon.length} lignes → ${sauve}\n`)

let touchees = 0, deja = 0
for (const m of mon) {
  const reellementMesurees = mesureesPar[m.depot_id] ?? new Set()
  const couvAvant = m.competences_couvertes ?? []
  const couvApres = couvAvant.filter(c => reellementMesurees.has(c))
  const o = JSON.parse(JSON.stringify(m.observables ?? {}))
  const cr = o.confiance_de_remise
  if (cr) {
    for (const champ of ['niveaux','confiances']) {
      if (cr[champ]) for (const c of Object.keys(cr[champ])) if (!reellementMesurees.has(c)) delete cr[champ][c]
    }
    if (Array.isArray(cr.par_competence)) {
      cr.par_competence = cr.par_competence.filter(p => reellementMesurees.has(p.competence))
    }
  }
  const change = JSON.stringify(couvAvant) !== JSON.stringify(couvApres)
    || JSON.stringify(m.observables) !== JSON.stringify(o)
  if (!change) { deja++; continue }
  touchees++
  const retires = couvAvant.filter(c => !reellementMesurees.has(c))
  console.log(`${m.id.slice(0,8)} · dépôt ${m.depot_id.slice(0,8)}`)
  console.log(`   couvertes : ${JSON.stringify(couvAvant)} → ${JSON.stringify(couvApres)}  (retiré : ${retires.join(', ')})`)
  console.log(`   par_competence : ${(m.observables?.confiance_de_remise?.par_competence??[]).length} → ${(cr?.par_competence??[]).length} entrée(s)`)
  if (ECRIS) {
    const { error: e } = await db.from('monitoring_mesures')
      .update({ competences_couvertes: couvApres, observables: o }).eq('id', m.id)
    if (e) console.log(`   ✗ ÉCRITURE REFUSÉE : ${e.code} ${e.message}`)
    else console.log('   ✓ écrite')
  }
}
console.log(`\n${touchees} ligne(s) à réparer, ${deja} déjà conforme(s). ${ECRIS ? 'ÉCRITES.' : '(à blanc — relancer avec --ecris)'}`)
