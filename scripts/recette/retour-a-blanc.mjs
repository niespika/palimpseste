// ============================================================================
// RETOUR À BLANC — éprouver un changement de GABARIT sur des copies RÉELLES.
// ----------------------------------------------------------------------------
// ⛔ AUCUNE ÉCRITURE EN BASE (`sansEcriture: true`). Le retour engendré est rendu
//    à ce script, jamais à `exercices_retours` : le retour d'un élève réel n'est
//    pas touché. ⚠️ Les APPELS au modèle, eux, sont réels et facturés.
//
// ⭐ Il réutilise les SQUELETTES DÉJÀ EN BASE — `rejouerLeRetour` ne rejoue ni
//    P1 ni P2. Un dépôt coûte donc UN appel, pas sept.
//
// Ce qu'il compte, et pourquoi : la règle 1 du gabarit Calame a été amendée le
// 31/08 pour dire « NE RÉPÈTE PAS la citation dans ta phrase ». La prose est le
// seul domicile de citation qui REFUSE encore (l'ancrage, lui, s'élague). Donc
// « combien de citations restent dans la prose » EST le taux de rejeu à venir.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/retour-a-blanc.mjs [nombre-de-depots]
// ============================================================================
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = fs.readFileSync('.env.local', 'utf8')
const g = (k) => {
  const m = env.match(new RegExp(`^${k}=(.*)$`, 'm'))
  return m ? m[1].trim().replace(/^"|"$/g, '') : null
}
process.env.ANTHROPIC_API_KEY = g('ANTHROPIC_API_KEY')
process.env.SUPABASE_SERVICE_ROLE_KEY = g('PROD_SUPABASE_SECRET_KEY')
process.env.NEXT_PUBLIC_SUPABASE_URL = g('PROD_SUPABASE_URL')

const admin = createClient(g('PROD_SUPABASE_URL'), g('PROD_SUPABASE_SECRET_KEY'),
  { auth: { persistSession: false } })

const { rejouerUneCompetence, lireContexteDuDepot, cibleDuRetour, engendrerLeRetour } =
  await import('../../utils/chaine/chaine.ts')
const { COMPETENCES } = await import('../../utils/chaine/types.ts')
const { citationsAttribueesDansLaProse } = await import('../../utils/chaine/retour.ts')
const { citationTient } = await import('../../utils/chaine/citation-verifiee.ts')

const combien = Number(process.argv[2] ?? 4)
const { data: ret } = await admin.from('exercices_retours').select('depot_id').limit(combien * 3)
const depots = [...new Set((ret ?? []).map((r) => r.depot_id))].slice(0, combien)

console.log(`\n${depots.length} dépôt(s) rejoué(s) — gabarit AMENDÉ, aucune écriture\n`)

let prose = 0, proseFausse = 0, avecCitation = 0, elagues = 0, ok = 0, appels = 0
for (const id of depots) {
  try {
    // ⚠️ ON REFAIT LA MESURE, on ne la relit pas : les squelettes en base ont été
    //    produits par des instruments ANTÉRIEURS (structure 3.3 contre 3.4), et
    //    `rejouerLeRetour` refuse — à raison — de servir un jugement périmé.
    const ctx = await lireContexteDuDepot(admin, id)
    const squelettes = []
    for (const c of COMPETENCES) {
      const r = await rejouerUneCompetence(admin, {
        depotId: id, competence: c, version: 'v1', modele: 'claude-sonnet-4-6', ctx,
      })
      if (r?.squelette) { squelettes.push(r.squelette); appels += r.appels }
    }
    if (!squelettes.length) { console.log(`  ${id.slice(0, 8)} — aucune compétence mesurable`); continue }

    const cible = cibleDuRetour(ctx, squelettes.map((s) => s.competence))
    const b = await engendrerLeRetour(admin, {
      ctx, version: 'v1', modele: 'claude-sonnet-4-6', squelettes,
      registre: null, cible, sansEcriture: true,
    })
    appels += b.appels
    const points = b.retour?.points ?? []
    const prod = ctx.productionV1

    let p = 0, pf = 0
    for (const pt of points) {
      if (pt.ancrage?.citation) avecCitation++
      else elagues++
      for (const c of citationsAttribueesDansLaProse(pt.texte ?? '')) {
        p++; prose++
        if (!citationTient(prod, c)) { pf++; proseFausse++ }
      }
    }
    ok++
    console.log(`  ${id.slice(0, 8)} — ${points.length} point(s) · `
      + `${points.filter((x) => x.ancrage).length} avec citation servie · `
      + `prose : ${p} citation(s), ${pf} fausse(s)`
      + (b.alertes.length ? `\n              ${b.alertes.slice(0, 3).join(' | ').slice(0, 160)}` : ''))
  } catch (e) {
    console.log(`  ${id.slice(0, 8)} — ✖ ${String(e?.message ?? e).slice(0, 110)}`)
  }
}

console.log(`\n════ RÉSULTAT ════`)
console.log(`  dépôts rejoués                   : ${ok}/${depots.length}   (${appels} appels)`)
console.log(`  points AVEC citation servie      : ${avecCitation}`)
console.log(`  points élagués (sans citation)   : ${elagues}`)
console.log(`  citations DANS LA PROSE          : ${prose}   ← la règle 1 amendée en demande ZÉRO`)
console.log(`  … dont fausses, donc REFUS       : ${proseFausse}`)
