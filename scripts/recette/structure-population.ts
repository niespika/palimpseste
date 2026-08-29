// ============================================================================
// C4L10S-18 / C4L10S-19 — LES DEUX LECTURES DE `bloc_relie`, SUR LES COPIES
// RÉELLES DE PRODUCTION. Constat seul, aucune écriture, aucun appel de modèle.
// ----------------------------------------------------------------------------
// ⭐ Il ne réimplémente RIEN : il rejoue `BRANCHEMENT_STRUCTURE.code1/code2/
//   releve` — le vrai code, celui qui a écrit les mesures — sur les artefacts
//   `exercices_squelettes` déjà stockés. La trace de `code2` donne les comptes.
//
//   §5  (ce que le portage applique) : oui / TOUT LE TISSU, illisibles compris
//   §4.4 (la règle de modulation)    : oui / (oui + non), illisibles DEHORS
//
// Usage : npx tsx scripts/recette/structure-population.ts
// ============================================================================
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { BRANCHEMENT_STRUCTURE } from '../../utils/chaine/branchements/structure'
import type { ContexteBranchement } from '../../utils/chaine/instruments'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))

const ctx = (): ContexteBranchement => ({
  modes: ['composer'], cran: null, referent: null, exceptionOrthographe: false,
  contexteExercice: { copie: '', sujet: '', consigne: '', mode: 'composer' },
  prives: {}, sorties: {}, parametres: {},
} as ContexteBranchement)

async function main() {
const db = createClient(env.PROD_SUPABASE_URL!, env.PROD_SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } })
const { data, error } = await db.from('exercices_squelettes')
  .select('id, depot_id, artefact_extraction, artefact_jugement')
  .eq('competence', 'structure').order('id').limit(1000)
if (error) throw new Error(error.message)
console.log(`### ${data!.length} squelettes de Structure en PRODUCTION\n`)

let nJointures = 0, avecTissu = 0, bascule = 0, illisibles = 0, copiesAvecIllisible = 0
const dist: Record<string, number> = {}
const seuil = (x: number | null) => x === null ? 'n/a' : (x >= 0.5 ? 'atteint' : 'raté')

for (const s of data!) {
  const p1 = (s.artefact_extraction as Record<string, unknown> | null)?.p1
  const p2 = s.artefact_jugement
  let c1, c2, rel
  try {
    c1 = BRANCHEMENT_STRUCTURE.code1({ p1 }, ctx())
    c2 = BRANCHEMENT_STRUCTURE.code2(p2, c1, ctx())
    rel = BRANCHEMENT_STRUCTURE.releve!(c2, ctx())
  } catch (e) { console.log(`  ${s.id.slice(0, 8)} — LÈVE : ${(e as Error).message}`); continue }

  // ⭐ LU, PAS DÉDUIT : code1 rend les trois comptes.
  const m = c1.mesures as Record<string, number>
  const nTissu = Number(m.n_tissu ?? 0)
  const oui = Number(m.tissu_oui ?? 0)
  const non = Number(m.tissu_non ?? 0)
  const ill = nTissu - oui - non
  const br = rel.releve?.bloc_relie

  const j = (p1 as Record<string, unknown> | undefined)?.jointures
  nJointures += Array.isArray(j) ? j.length : 0
  if (nTissu > 0) avecTissu++
  illisibles += ill
  if (ill > 0) copiesAvecIllisible++

  const lect5 = nTissu > 0 ? oui / nTissu : null            // §5 — TOUT le tissu
  const lect4 = (oui + non) > 0 ? oui / (oui + non) : null  // §4.4 — illisibles dehors
  const flip = lect5 !== null && lect4 !== null && seuil(lect5) !== seuil(lect4)
  if (flip) bascule++
  if (ill > 0 || flip) {
    console.log(`  ${s.id.slice(0, 8)}  tissu ${nTissu} (${oui} oui / ${non} non / ${ill} illisible)` +
      `   §5 ${lect5?.toFixed(2)} ${seuil(lect5)}  ·  §4.4 ${lect4?.toFixed(2)} ${seuil(lect4)}` +
      `   ${flip ? '⛔ BASCULE' : '— même verdict'}`)
  }
  // contrôle : la valeur écrite doit être celle du §5
  if (typeof br === 'number' && lect5 !== null && Math.abs(br - lect5) > 1e-9) {
    console.log(`  ⚠️ ${s.id.slice(0, 8)} : bloc_relie écrit ${br} ≠ §5 recalculé ${lect5}`)
  }
  const k = br === null || br === undefined ? 'absent' : String(br)
  dist[k] = (dist[k] ?? 0) + 1
}

// ── C4L10S-19 : les QUATRE replis silencieux, comptés sur le corpus réel ──
const RE_B = /¶?\s*(\d+)\s*(?:→|->|—|-|à|,)\s*¶?\s*(\d+)/
// ⭐ LE VRAI CATALOGUE du module, recopié de structure.ts — pas deviné.
const ROLES = ['intro', 'developpement', 'bilan', 'conclusion']
const horsCat: Record<string, number> = {}
const STATUTS = ['oui', 'non', 'partiel']
let entreIllisible = 0, nJoint = 0, roleHors = 0, nBlocs = 0, statutHors = 0, nStat = 0
for (const s of data!) {
  const p1 = ((s.artefact_extraction as Record<string, unknown> | null)?.p1 ?? {}) as Record<string, unknown>
  for (const j of (Array.isArray(p1.jointures) ? p1.jointures : []) as Record<string, unknown>[]) {
    nJoint++
    if (!RE_B.test(String(j.entre ?? ''))) entreIllisible++
    const st = String(j.statut ?? '').trim().toLowerCase()
    if (st) { nStat++; if (!STATUTS.some((x) => st.startsWith(x))) statutHors++ }
  }
  for (const b of (Array.isArray(p1.blocs) ? p1.blocs : []) as Record<string, unknown>[]) {
    nBlocs++
    const r = String(b.role ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (!ROLES.some((x) => r.startsWith(x))) { roleHors++; horsCat[String(b.role)] = (horsCat[String(b.role)] ?? 0) + 1 }
  }
}
console.log(`\n### C4L10S-19 — les quatre replis silencieux, sur le corpus RÉEL`)
console.log(`  (a) relation_nommee illisible : ${illisibles}/${nJoint} jointures   ${illisibles ? '⛔' : '✅'}   (banc : 68/112)`)
console.log(`  (b) « entre » illisible → tissu par défaut : ${entreIllisible}/${nJoint}   ${entreIllisible ? '⛔' : '✅'}   (banc : 11/112)`)
console.log(`  (c) statut hors catalogue : ${statutHors}/${nStat} déclarés   ${statutHors ? '⛔' : '✅'}   (banc : jamais vu)`)
console.log(`  (d) role hors catalogue : ${roleHors}/${nBlocs} blocs   ${roleHors ? '⛔' : '✅'}   (banc : jamais vu)`)
if (roleHors) console.log(`      catalogue = ${JSON.stringify(ROLES)} · valeurs rencontrées hors catalogue : ${JSON.stringify(horsCat)}`)

console.log(`\n── jointures déclarées par P1, toutes copies : ${nJointures}`)
console.log(`── copies portant au moins une couture de TISSU : ${avecTissu}/${data!.length}`)
console.log(`── coutures de tissu à relation ILLISIBLE : ${illisibles}  (sur ${copiesAvecIllisible} copie(s))`)
console.log(`── copies où les deux lectures DIVERGENT au seuil de 0,5 : ${bascule}`)
console.log(`── distribution de bloc_relie : ${JSON.stringify(dist)}`)
}
main()
