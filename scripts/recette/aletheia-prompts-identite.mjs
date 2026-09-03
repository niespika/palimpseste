// ============================================================================
// RECETTE — Aletheia E3 : les prompts par défaut, bloc argumentatif (vide) injecté,
// sont IDENTIQUES À L'OCTET PRÈS à ceux d'avant E3 (fixture prise le 03/09 avant la
// première retouche). C'est la garantie « porte fermée ⇒ rien ne change ».
//   node --import ./scripts/register-calibration-resolver.mjs scripts/recette/aletheia-prompts-identite.mjs
// E5 : les placeholders {bloc_passages} / {bloc_rappel} / {bloc_reponses} sont vidés de même.
// (Pas un test `npm test` : aletheia-retours.ts importe `server-only` et des alias `@/`
//  que le résolveur des tests ne connaît pas ; le résolveur de calibration, si.)
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as m from '@/utils/aletheia-retours'
import { assemblerPrompt, BLOCS_DEFAUT, GABARITS } from '@/utils/aletheia/gabarits'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const avant = JSON.parse(fs.readFileSync(path.join(RACINE, 'utils/aletheia/fixtures/prompts-avant-e3.json'), 'utf8'))
const apres = {
  feedback_v1: m.PROMPT_FEEDBACK_V1_DEFAUT, feedback_vf: m.PROMPT_FEEDBACK_VF_DEFAUT,
  diag_inventaire: m.PROMPT_DIAG_INVENTAIRE_DEFAUT, diag_niveau: m.PROMPT_DIAG_NIVEAU_DEFAUT,
  reference: m.PROMPT_REFERENCE_DEFAUT, capstone: m.PROMPT_CAPSTONE_DEFAUT,
}
let ko = 0
for (const [cle, texte] of Object.entries(apres)) {
  const assemble = assemblerPrompt(texte, '').split('{bloc_passages}').join('').split('{bloc_rappel}').join('').split('{bloc_reponses}').join('').split('{bloc_passages_vf}').join('')
  const ok = assemble === avant[cle]
  if (!ok) {
    ko++
    let i = 0; while (i < assemble.length && assemble[i] === avant[cle][i]) i++
    console.log(`✖ ${cle} : diverge à l'octet ${i} — avant « ${JSON.stringify(avant[cle].slice(i, i + 60))} » / après « ${JSON.stringify(assemble.slice(i, i + 60))} »`)
  } else console.log(`✔ ${cle} : identique (${texte.length} car, placeholder ${texte.includes('{bloc_gabarit}') ? 'présent' : 'absent'})`)
}
// Et chaque prompt qui porte le placeholder l'a EXACTEMENT une fois.
for (const [cle, texte] of Object.entries(apres)) {
  const n = texte.split('{bloc_gabarit}').length - 1
  if (n > 1) { ko++; console.log(`✖ ${cle} : ${n} placeholders`) }
}
// Et les blocs non vides s'assemblent sans laisser de placeholder.
for (const g of GABARITS) for (const [cle, bloc] of Object.entries(BLOCS_DEFAUT[g])) {
  if (bloc.includes('{bloc_gabarit}')) { ko++; console.log(`✖ bloc ${g}/${cle} contient le placeholder`) }
}
console.log(ko === 0 ? '\nIDENTITÉ : OK' : `\nIDENTITÉ : ${ko} écart(s)`)
process.exit(ko === 0 ? 0 : 1)
