// ============================================================================
// BANC C7 · L7 — LES DEUX COMPTEURS DE L'OBJET, ET CE QUE LA RÈGLE AURAIT POSÉ.
// Lecture seule.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/banc-objet.mjs [--prod] [--jours 21] [--cycle 2026-08-31]
//
// `01-` §11 (06/09) : « le nombre d'objets ouverts par élève et par cycle, et le
// temps de passage méthode → ouvert → tenu, par objet et par palier » — « un
// banc, pas une table » : les deux compteurs se DÉRIVENT du journal
// (`routeur_decisions.alternatives_ecartees.objet`), en requête.
//   ① objets par élève × cycle, par état (méthode / ouvert / sonde) ;
//   ② temps de passage : la première décision `methode` de l'objet, la première
//     `ouvert`, la première où il est écarté `objet_tenu` ;
//   ③ sur une semaine réelle (fait quand 6) : ce que la règle aurait posé à la
//     place de ce qui l'a été — deux objets en méthode la première semaine, la
//     séquence du palier sur chacun, les autres objets attendant leur tour.
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
const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d }
const PROD = process.argv.includes('--prod')
const JOURS = Number(arg('--jours', 21))
const CYCLE = arg('--cycle', null)
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const { sequenceDeMethode } = await import(`${RACINE}/utils/moteur/vivier.ts`)

const un = (x) => (Array.isArray(x) ? x[0] ?? null : x)
const compte = (liste, cle) => { const m = new Map(); for (const x of liste) { const k = cle(x); m.set(k, (m.get(k) ?? 0) + 1) } return [...m].sort((p, q) => q[1] - p[1]) }
const fmt = (m) => m.map(([k, n]) => `${k} ${n}`).join(' · ') || 'aucun'
const moyenne = (xs) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(2) : '—')

const depuis = new Date(Date.now() - JOURS * 86_400_000).toISOString().slice(0, 10)
let q = admin.from('routeur_decisions')
  .select('id, eleve_id, cycle_lundi, cible_retenue, bonus, degrade, created_at, alternatives_ecartees, exercices(cran, id_import, exercices_types(code))')
  .order('cycle_lundi', { ascending: true }).order('created_at', { ascending: true }).order('id', { ascending: true }).limit(20000)
q = CYCLE ? q.eq('cycle_lundi', CYCLE) : q.gte('cycle_lundi', depuis)
const { data: decisions, error } = await q
if (error) throw new Error(error.message)
const lignes = (decisions ?? []).map((d) => {
  const ex = un(d.exercices)
  return { ...d, objet: un(ex?.exercices_types)?.code ?? '?', cran: ex?.cran ?? null, gabarit: /^ex-gab-/.test(ex?.id_import ?? ''),
    o: d.alternatives_ecartees?.objet ?? null }
})
console.log(`${PROD ? 'PRODUCTION' : 'bac à sable'} — ${lignes.length} décision(s) ${CYCLE ? `sur le cycle ${CYCLE}` : `depuis ${depuis}`}, `
  + `${new Set(lignes.map((l) => l.eleve_id)).size} élève(s), cycles ${[...new Set(lignes.map((l) => l.cycle_lundi))].join(', ')} · `
  + `portant l'état de l'objet (C7-L7) : ${lignes.filter((l) => l.o).length}`)

// ── ① OBJETS PAR ÉLÈVE × CYCLE, PAR ÉTAT ──────────────────────────────────────
console.log('\n① objets par élève × cycle')
const parEleveCycle = new Map()
for (const l of lignes) {
  const k = `${l.eleve_id}|${l.cycle_lundi}`
  const m = parEleveCycle.get(k) ?? new Map()
  const etat = l.o ? l.o.etat : 'inconnu (avant C7-L7)'
  if (!m.has(l.objet) || m.get(l.objet) === 'inconnu (avant C7-L7)') m.set(l.objet, etat)
  parEleveCycle.set(k, m)
}
const parCycle = new Map()
for (const [k, m] of parEleveCycle) {
  const cycle = k.split('|')[1]
  const c = parCycle.get(cycle) ?? { eleves: 0, objets: [], methode: [], ouvert: [], tenu: [], inconnu: [] }
  c.eleves += 1
  c.objets.push(m.size)
  for (const [, etat] of m) (c[etat === 'inconnu (avant C7-L7)' ? 'inconnu' : etat] ?? c.inconnu).push(1)
  parCycle.set(cycle, c)
}
for (const [cycle, c] of [...parCycle].sort()) {
  console.log(`  ${cycle} : ${c.eleves} élève(s) · objets par élève ${moyenne(c.objets)} (min ${Math.min(...c.objets)}, max ${Math.max(...c.objets)}) · `
    + `en méthode ${c.methode.length} · ouverts ${c.ouvert.length} · tenus (servis en sonde) ${c.tenu.length} · sans état ${c.inconnu.length}`)
}
const ecartes = lignes.flatMap((l) => l.o?.ecartes ?? []).map((e) => `${e.motif}`)
console.log('  objets écartés au journal (toutes décisions, avec doublons par ligne) :', fmt(compte(ecartes, (x) => x)))

// ── ② TEMPS DE PASSAGE méthode → ouvert → tenu ─────────────────────────────────
console.log('\n② temps de passage méthode → ouvert → tenu, par élève × objet (en cycles)')
const vies = new Map()
for (const l of lignes) {
  if (!l.o) continue
  const k = `${l.eleve_id}|${l.objet}`
  const v = vies.get(k) ?? { methode: null, ouvert: null, tenu: null, palier: l.o.palier ?? null }
  if (l.o.etat === 'methode' && !v.methode) v.methode = l.cycle_lundi
  if (l.o.etat === 'ouvert' && !v.ouvert) v.ouvert = l.cycle_lundi
  for (const e of l.o.ecartes ?? []) {
    if (e.motif === 'objet_tenu' && e.objet) {
      const kk = `${l.eleve_id}|${e.objet}`
      const vv = vies.get(kk) ?? { methode: null, ouvert: null, tenu: null, palier: null }
      if (!vv.tenu) vv.tenu = l.cycle_lundi
      vies.set(kk, vv)
    }
  }
  vies.set(k, v)
}
const semaines = (a, b) => (a && b ? Math.round((Date.parse(b) - Date.parse(a)) / (7 * 86_400_000)) : null)
const mo = [...vies.values()].map((v) => semaines(v.methode, v.ouvert)).filter((x) => x !== null)
const ot = [...vies.values()].map((v) => semaines(v.ouvert, v.tenu)).filter((x) => x !== null)
console.log(`  ${vies.size} couple(s) élève × objet · entrés en méthode ${[...vies.values()].filter((v) => v.methode).length} · passés ouverts ${[...vies.values()].filter((v) => v.ouvert).length} · tenus ${[...vies.values()].filter((v) => v.tenu).length}`)
console.log(`  méthode → ouvert : ${mo.length} mesuré(s), moyenne ${moyenne(mo)} cycle(s) · ouvert → tenu : ${ot.length} mesuré(s), moyenne ${moyenne(ot)} cycle(s)`)
const parPalier = compte([...vies.values()].filter((v) => v.methode), (v) => v.palier ?? '?')
console.log('  par palier de la cible (objets entrés) :', fmt(parPalier))

// ── ③ CE QUE LA RÈGLE AURAIT POSÉ À LA PLACE (fait quand 6) ────────────────────
console.log('\n③ sur la semaine réelle : ce que la règle aurait posé à la place de ce qui l\'a été')
const { data: niveaux } = await admin.from('competences_niveaux').select('eleve_id, competence, lettre').in('eleve_id', [...new Set(lignes.map((l) => l.eleve_id))])
const lettre = new Map((niveaux ?? []).map((n) => [`${n.eleve_id}|${n.competence}`, n.lettre]))
let poses = 0, auraient = 0, exercicesGardes = 0
const objetsServis = [], objetsGardes = []
const tombes = new Map()
for (const [k, m] of parEleveCycle) {
  const [eleve, cycle] = k.split('|')
  const siennes = lignes.filter((l) => l.eleve_id === eleve && l.cycle_lundi === cycle && !l.bonus)
  poses += siennes.length
  // Semaine 1 pour tous (aucun objet servi sous le gabarit avant le 07/09) : deux objets en méthode —
  // les deux premiers que la pose a atteints —, la séquence du palier de leur cible sur chacun.
  const ordreObjets = [...new Set(siennes.map((l) => l.objet))]
  const gardes = ordreObjets.slice(0, 2)
  objetsServis.push(ordreObjets.length); objetsGardes.push(gardes.length)
  for (const o of gardes) {
    const cible = siennes.find((l) => l.objet === o)?.cible_retenue ?? null
    const seq = sequenceDeMethode(cible ? lettre.get(`${eleve}|${cible}`) ?? null : null, false)
    auraient += seq.length
    exercicesGardes += siennes.filter((l) => l.objet === o).length
  }
  for (const l of siennes) if (!gardes.includes(l.objet)) tombes.set(l.objet, (tombes.get(l.objet) ?? 0) + 1)
}
console.log(`  posés ${poses} exercice(s) sur ${objetsServis.length} élève-cycle(s) · objets distincts par élève ${moyenne(objetsServis)} (max ${Math.max(0, ...objetsServis)})`)
console.log(`  la règle aurait gardé 2 objets par élève (${moyenne(objetsGardes)} en moyenne) et posé ${auraient} exercice(s) — la séquence de méthode du palier (sans cran 2) — `
  + `contre ${exercicesGardes} réellement posés sur ces deux objets ; ${poses - exercicesGardes} exercice(s) sur d'autres objets seraient tombés :`)
console.log('  par objet :', fmt([...tombes].sort((a, b) => b[1] - a[1])))
console.log('\n⚠️ Lecture : les états manquent sur les décisions d\'avant C7-L7 ; la première pose réelle sous la règle (lundi 14/09, 18:00 UTC) remplira ① et ②.')
