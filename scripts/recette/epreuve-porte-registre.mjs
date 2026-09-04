// ============================================================================
// ÉPREUVE C7 · L5 — LA PORTE DES CRANS SUR UN ÉLÈVE, EN BAC À SABLE.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/epreuve-porte-registre.mjs [objet]
//
// « Fait quand : sur un élève de décor, le cran 4 n'est servi qu'après deux
//   réussites au cran 1 sur le même objet, et deux échecs au cran 1 déclenchent
//   une sonde au cran 4. » (`07-` §2, C7-L5)
// Le registre RÉEL de l'élève de test est lu, puis trois registres de DÉCOR en
// sont dérivés (deux réussites / une seule / deux échecs de suite au cran 1), et
// LA COUCHE 4 ELLE-MÊME (`constituerLeVivier`) est appelée sur les instances
// réelles de l'objet. Rien n'est écrit.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
if (!/aoakpxxlyvthzueaywna/.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error('bac à sable seulement')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const OBJET = process.argv[2] ?? 'argument'

const { lireLaPorteDesCrans } = await import(`${RACINE}/utils/registre/porte-serveur.ts`)
const { porteDeLObjet, statutDeService } = await import(`${RACINE}/utils/registre/porte.ts`)
const { lireLesInstances } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
const { constituerLeVivier } = await import(`${RACINE}/utils/moteur/vivier.ts`)

const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
const u = users.find((x) => x.email === env.TEST_ELEVE_EMAIL)
if (!u) throw new Error('élève de test introuvable')
const lundi = (() => { const d = new Date(); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10) })()

console.log(`── LE REGISTRE RÉEL de ${u.email} (cycle du ${lundi}) ──`)
const porte = await lireLaPorteDesCrans(admin, u.id, lundi)
console.log('porte active (gabarit_actif) :', porte.actif, '| incidents :', porte.incidents.length ? porte.incidents : 'aucun')
for (const l of porte.registre.filter((l) => l.objet === OBJET).sort((a, b) => a.cran - b.cran)) {
  console.log(`   ${l.objet} · cran ${l.cran}${l.variante ?? ''} : ${l.reussites} réussite(s), ${l.echecs} échec(s) — série ${l.serie.join(' → ')}`)
}
if (!porte.registre.some((l) => l.objet === OBJET)) console.log(`   (aucune ligne sur « ${OBJET} »)`)
console.log('   objets déjà servis avant ce cycle :', [...porte.dejaServis].sort().join(', ') || 'aucun')
const reelle = porte.de(OBJET)
console.log(`   porte réelle sur « ${OBJET} » : ouverts [${reelle.ouverts}] · sondes [${reelle.sondes}] · méthode ${reelle.methode}`)

// Les instances réelles de l'objet — les mêmes que la couche 4 lirait.
const { instances, incidents } = await lireLesInstances(admin)
if (incidents.length) console.log('   incidents de lecture :', incidents.length)
const miennes = instances.filter((i) => i.objet === OBJET && i.cranNumero !== null)
  .map((i) => ({ ...i, statut: 'concu' }))   // ⚠️ décor : les instances de la vague sont `a_concevoir`
console.log(`   ${miennes.length} instance(s) de « ${OBJET} » (statut forcé à concu pour l'épreuve)`)

const ctx = { parcours: ['tc'], coursVus: new Set(), positionsDeLecture: new Map(), instancesDejaDeposees: new Set(), classesDeLEleve: new Set() }
const ligne = (cran, serie) => ({ objet: OBJET, cran, variante: null, reussites: serie.filter((x) => x === 'reussi').length, echecs: serie.filter((x) => x === 'rate').length, serie, dernierAt: '2026-09-04T00:00:00Z' })
const decors = [
  ['A. deux réussites au cran 1 (déjà servi)', porteDeLObjet([ligne(1, ['reussi', 'reussi'])], OBJET, true)],
  ['B. une seule réussite au cran 1', porteDeLObjet([ligne(1, ['rate', 'reussi'])], OBJET, true)],
  ['C. deux échecs de suite au cran 1', porteDeLObjet([ligne(1, ['reussi', 'rate', 'rate'])], OBJET, true)],
  ['D. objet jamais servi — la semaine de méthode', porteDeLObjet([], OBJET, false)],
  ['E. le registre réel', reelle],
]
for (const [titre, p] of decors) {
  const v = constituerLeVivier(miennes, { ...ctx, porte: { actif: true, de: () => p } })
  const parCran = new Map()
  for (const r of v.retenus) { const k = `${r.instance.cranNumero}`; parCran.set(k, [...(parCran.get(k) ?? []), r.porte]) }
  const fermes = v.ecartes.filter((e) => e.motif === 'porte_registre')
  const autres = v.ecartes.filter((e) => e.motif !== 'porte_registre')
  console.log(`\n── ${titre} — ouverts [${p.ouverts}] · sondes [${p.sondes}] · méthode ${p.methode}`)
  for (const [cran, statuts] of [...parCran].sort()) console.log(`   cran ${cran} : ${statuts.length} servie(s) — ${[...new Set(statuts)].join('/')}`)
  const fermesParCran = new Map()
  for (const e of fermes) { const c = miennes.find((i) => i.exerciceId === e.exerciceId)?.cranNumero; fermesParCran.set(c, (fermesParCran.get(c) ?? 0) + 1) }
  for (const [c, n] of [...fermesParCran].sort()) console.log(`   cran ${c} : ${n} FERMÉE(S) — ${fermes.find((e) => miennes.find((i) => i.exerciceId === e.exerciceId)?.cranNumero === c)?.detail}`)
  if (autres.length) console.log(`   (${autres.length} écartée(s) pour d'autres motifs : ${[...new Set(autres.map((e) => e.motif))].join(', ')})`)
}
