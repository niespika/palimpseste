#!/usr/bin/env node
// ────────────────────────────────────────────────────────────────────────────
// Juge de sévérité « spoiler aval » sur les sorties VF générées (vf_gen_*.json).
// Classe chaque sortie au niveau le PLUS ÉLEVÉ atteint : 0 (ouverture) / 1 (teaser,
// voulu) / 2 (spoiler : révèle la réponse/conclusion → cible ~0). Sonnet @ T=0.
//   node aletheia_calibration/judge.mjs           # prend le dernier vf_gen_*.json
//   node aletheia_calibration/judge.mjs <fichier>
// ────────────────────────────────────────────────────────────────────────────
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
for (const l of readFileSync(join(DIR, '..', '.env.local'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
}
const RES = join(DIR, 'resultats')
const fichier = process.argv[2] || join(RES, readdirSync(RES).filter(f => f.startsWith('vf_gen_')).sort().at(-1))
const data = JSON.parse(readFileSync(fichier, 'utf8'))
const sorties = data.sorties
const ref1 = JSON.parse(readFileSync(join(DIR, 'fixtures', 'reference.json'), 'utf8'))[0].contenu.find(c => c.semaine === 1)

const RUBRIQUE = `Un élève finit la SEMAINE 1 d'un livre de 4 semaines (« Essai d'autocritique » de Nietzsche). Il ne doit pas se faire spoiler les semaines 2 à 4 (l'AVAL). Un tuteur IA lui a renvoyé des « jalons aval » censés donner ENVIE de lire la suite.

CONTENU DÉJÀ LU EN SEMAINE 1 (le résumer, le reformuler ou y renvoyer n'est JAMAIS un spoiler) :
Thèse de la semaine 1 : ${ref1.these_canonique}
Points de la semaine 1 : ${ref1.arguments_cles.map(a => '— ' + a).join('\n')}

Échelle (classe au niveau le PLUS ÉLEVÉ atteint par UN jalon OU la synthèse) :
- 0 : aucune référence à la suite.
- 1 — TEASER (AUTORISÉ, encouragé par le prof) : nomme un motif/figure/question à venir, et PEUT promettre ou caractériser qu'une réponse viendra (« tu découvriras plus loin pourquoi… », « la réponse te surprendra », « garde en tête la figure du satyre ») — DU MOMENT QU'IL NE DIT PAS CE QU'EST cette réponse. L'élève sait qu'un fil/une réponse l'attend, jamais son contenu.
- 2 — SPOILER (à proscrire) : énonce le CONTENU d'une réponse/conclusion/thèse/jugement propre à l'AVAL (au-delà de ce qui est déjà en semaine 1 ci-dessus) — l'élève APPREND la réponse elle-même. Ex. « il existe deux pessimismes : celui de la force vs celui de l'épuisement », « Nietzsche juge son livre impossible », « le satyre signifie X ».

TEST DÉCISIF : après lecture, l'élève CONNAÎT-IL une conclusion de l'aval qui n'était pas déjà en semaine 1 (→ 2), ou sait-il seulement qu'une réponse l'attend (→ 1) ? Résumer fidèlement la semaine 1 = niveau 0 ou 1, JAMAIS 2.`

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
let appels = 0
async function juger(s) {
  const prompt = `${RUBRIQUE}\n\n## Jalons aval produits par le tuteur\n${JSON.stringify(s.architecture_aval_jalons, null, 1)}\n\n## Synthèse de la semaine (au cas où un spoiler s'y glisse)\n${s.synthese_modele}\n\nRenvoie UNIQUEMENT un JSON : {"niveau": 0|1|2, "pire": "le jalon ou passage le plus révélateur (verbatim court)", "raison": "courte justification"}`
  appels++
  const r = await client.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 512, temperature: 0, messages: [{ role: 'user', content: prompt }] })
  const t = r.content[0]?.type === 'text' ? r.content[0].text : ''
  try { const j = JSON.parse(t.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim()); return { niveau: Number(j.niveau), pire: j.pire || '', raison: j.raison || '' } }
  catch { return { niveau: -1, pire: '', raison: 'parse échec' } }
}
async function pool(taches, n) { const res = []; let i = 0; const w = async () => { while (i < taches.length) { const k = i++; res[k] = await taches[k]() } }; await Promise.all(Array.from({ length: Math.min(n, taches.length) }, w)); return res }

console.log(`Juge sévérité spoiler — ${sorties.length} sorties de ${fichier.split('/').at(-1)}\n`)
const verdicts = await pool(sorties.map(s => () => juger(s)), 4)
const jug = sorties.map((s, i) => ({ ...s, ...verdicts[i] }))

// Agrégation
const parGroupe = {}
for (const j of jug) {
  const key = `${j.payload} T=${j.temperature}`
  parGroupe[key] = parGroupe[key] || { n0: 0, n1: 0, n2: 0, err: 0 }
  if (j.niveau === 0) parGroupe[key].n0++
  else if (j.niveau === 1) parGroupe[key].n1++
  else if (j.niveau === 2) parGroupe[key].n2++
  else parGroupe[key].err++
}
console.log('Scénario                          | niv0 | niv1(teaser) | niv2(SPOILER) | err')
console.log('----------------------------------|------|--------------|---------------|----')
for (const [k, v] of Object.entries(parGroupe)) {
  console.log(`${k.padEnd(33)} |  ${String(v.n0).padStart(2)}  |      ${String(v.n1).padStart(2)}      |       ${String(v.n2).padStart(2)}      | ${v.err}`)
}
const niv2 = jug.filter(j => j.niveau === 2)
console.log(`\n=== TOTAL : niv0=${jug.filter(j=>j.niveau===0).length} niv1=${jug.filter(j=>j.niveau===1).length} NIV2=${niv2.length} err=${jug.filter(j=>j.niveau===-1).length} (sur ${jug.length}) ===`)
if (niv2.length) {
  console.log(`\n🔴 LES ${niv2.length} CAS NIVEAU 2 (spoilers à examiner) :`)
  niv2.forEach(j => console.log(`\n• [${j.payload} T=${j.temperature}] ${j.raison}\n  PIRE: ${j.pire}`))
}
writeFileSync(fichier.replace('vf_gen_', 'vf_juge_'), JSON.stringify({ meta: { ...data.meta, juge: 'sonnet@T0', appels }, parGroupe, verdicts: jug.map(j => ({ payload: j.payload, temperature: j.temperature, niveau: j.niveau, pire: j.pire, raison: j.raison, jalons: j.architecture_aval_jalons })) }, null, 2))
console.log(`\nAppels juge: ${appels}`)
