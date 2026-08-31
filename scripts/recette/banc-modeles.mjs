// ============================================================================
// BANC DE COMPARAISON DES MODÈLES — la contre-épreuve du `07-` §6.
// ----------------------------------------------------------------------------
// « Deux modèles, et le partage suit la NATURE DE LA MESURE. […] La condition de
//   recette du RÉGIME — une contre-épreuve sur squelettes gelés, compétence par
//   compétence, MÊME LETTRE OU TOUT PASSE AU MODÈLE FORT — […] construis le
//   partage DÉBRAYABLE (tout-au-fort tant que la contre-épreuve n'a pas
//   tranché). »                                     — `07-` §6 ; PROMPT, piège 11
//
// ⛔⛔ CE BANC EST LA CONTRE-ÉPREUVE QUI MANQUAIT, et son absence est la SEULE
//    raison pour laquelle `partageActif` vaut `false` : tout tourne aujourd'hui
//    sur le modèle fort, exercices de maison compris, à trois fois le prix.
//
// CE QU'IL FAIT, ET CE QU'IL NE FAIT PAS
//   · il rejoue LA VRAIE CHAÎNE — `rejouerUneCompetence`, donc les mêmes
//     prompts, les mêmes crochets, la même agrégation. Le seul paramètre qui
//     change est le modèle ;
//   · il N'ÉCRIT RIEN : ni squelette, ni delta, ni mesure. On peut donc le
//     lancer sur la PRODUCTION sans y toucher — et les copies réelles sont le
//     seul corpus qui vaille ;
//   · ⚠️ il DÉPENSE : les appels sont réels et journalisés dans `api_couts`.
//     Le coût est estimé AVANT de partir, et il faut le confirmer.
//   · il ne compare QUE LA LETTRE et les observables. Le retour chaud est hors
//     champ : comparer des proses ne se mesure pas.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/banc-modeles.mjs [options]
//
//   --base=prod|sandbox    d'où viennent les dépôts        (défaut : prod)
//   --depots=N             combien de dépôts au plus       (défaut : 5)
//   --modeles=a,b,c        les identifiants à comparer
//                          (défaut : claude-sonnet-4-6,claude-haiku-4-5,
//                                    gemini-3.5-flash-lite)
//   --depot=<uuid>         un dépôt précis, répétable
//   --oui                  ne pas demander confirmation du coût estimé
//   --a-blanc              n'appelle RIEN : dit seulement ce qui serait fait
//
// ⚠️ LIRE AVANT DE CONCLURE : un banc lancé sur les examens diagnostiques ne
//    répond PAS à la question du partage. Ceux-là sont des ANCRES (`lieu`
//    classe × `forme` sommatif) et restent sur le modèle fort par doctrine,
//    quel que soit le résultat. Le partage ne concerne que la TRAJECTOIRE —
//    les exercices de maison. Le banc le dit dans son en-tête, à chaque passage.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ── L'environnement, lu SANS passer par le shell ────────────────────────────
// ⛔ `set -a; . ./.env.local` tronque une valeur qui contient `$`, `^` ou `#`,
//    et le message d'erreur ment alors sur sa cause.
function env(chemin = '.env.local') {
  const out = {}
  for (const ligne of fs.readFileSync(chemin, 'utf8').split('\n')) {
    if (!ligne || ligne.trimStart().startsWith('#') || !ligne.includes('=')) continue
    const [cle, ...reste] = ligne.split('=')
    out[cle.trim()] = reste.join('=').trim().replace(/^["']|["']$/g, '')
  }
  return out
}

const E = env()
const args = process.argv.slice(2)
const opt = (nom, defaut) => {
  const t = args.find((a) => a.startsWith(`--${nom}=`))
  return t ? t.slice(nom.length + 3) : defaut
}
const drapeau = (nom) => args.includes(`--${nom}`)

const BASE = opt('base', 'prod')
const MAX_DEPOTS = Number(opt('depots', '5'))
const MODELES = opt('modeles', 'claude-sonnet-4-6,claude-haiku-4-5,gemini-3.5-flash-lite')
  .split(',').map((m) => m.trim()).filter(Boolean)
const DEPOTS_DEMANDES = args.filter((a) => a.startsWith('--depot=')).map((a) => a.slice(8))
const A_BLANC = drapeau('a-blanc')

if (BASE === 'prod') {
  process.env.NEXT_PUBLIC_SUPABASE_URL = E.PROD_SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY = E.PROD_SUPABASE_SECRET_KEY
} else {
  process.env.NEXT_PUBLIC_SUPABASE_URL = E.NEXT_PUBLIC_SUPABASE_URL
  process.env.SUPABASE_SERVICE_ROLE_KEY = E.SUPABASE_SERVICE_ROLE_KEY
}
process.env.ANTHROPIC_API_KEY = E.ANTHROPIC_API_KEY
process.env.GEMINI_API_KEY = E.GEMINI_API_KEY

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const { rejouerUneCompetence, lireContexteDuDepot } = await import('../../utils/chaine/chaine.ts')
const { COMPETENCES } = await import('../../utils/chaine/types.ts')
const { TARIFS } = await import('../../utils/cout-usage.ts')

const titre = (t) => console.log(`\n${'═'.repeat(78)}\n${t}\n${'═'.repeat(78)}`)

// ── 1. Les dépôts à rejouer ─────────────────────────────────────────────────
titre(`BANC DE COMPARAISON DES MODÈLES — base ${BASE.toUpperCase()}`)

let depots
if (DEPOTS_DEMANDES.length) {
  const { data } = await admin.from('exercices_depots')
    .select('id, exercice_id, texte_v1, transcription_v1').in('id', DEPOTS_DEMANDES)
  depots = data ?? []
} else {
  // Les dépôts qui portent une production — sans elle, il n'y a rien à mesurer.
  const { data } = await admin.from('exercices_depots')
    .select('id, exercice_id, texte_v1, transcription_v1')
    .not('v1_remis_at', 'is', null).order('v1_remis_at', { ascending: false }).limit(200)
  depots = (data ?? []).filter((d) => (d.texte_v1 ?? d.transcription_v1 ?? '').trim() !== '')
    .slice(0, MAX_DEPOTS)
}
if (!depots.length) { console.log('Aucun dépôt avec production. Rien à comparer.'); process.exit(0) }

// ── 2. ⚠️ ANCRE OU TRAJECTOIRE ? Le banc le DIT, il ne le suppose pas ───────
const exIds = [...new Set(depots.map((d) => d.exercice_id))]
const { data: exs } = await admin.from('exercices')
  .select('id, lieu, cran, exercice_planifie_id').in('id', exIds)
const planIds = (exs ?? []).map((e) => e.exercice_planifie_id).filter(Boolean)
const { data: plans } = planIds.length
  ? await admin.from('scriptorium_exercices_planifies').select('id, nature').in('id', planIds)
  : { data: [] }
const natureDe = new Map((plans ?? []).map((p) => [p.id, p.nature]))
const exDe = new Map((exs ?? []).map((e) => [e.id, e]))

let ancres = 0
for (const d of depots) {
  const e = exDe.get(d.exercice_id)
  const forme = natureDe.get(e?.exercice_planifie_id) === 'evaluatif' ? 'sommatif' : 'formatif'
  if (e?.lieu === 'classe' && forme === 'sommatif') ancres += 1
}
console.log(`\n${depots.length} dépôt(s) · ${MODELES.length} modèle(s) : ${MODELES.join(' · ')}`)
if (ancres) {
  console.log(
    `\n⚠️  ${ancres}/${depots.length} de ces dépôts sont des ANCRES (classe × sommatif).`
    + '\n    Elles restent sur le modèle FORT par doctrine (`07-` §6), quel que soit'
    + '\n    le résultat de ce banc. Le partage ne concerne que la TRAJECTOIRE —'
    + '\n    les exercices de maison. Sur ce corpus-ci, le banc donne un signal,'
    + '\n    PAS la réponse à la question du partage.')
}

// ── 3. Le coût estimé, AVANT de dépenser ────────────────────────────────────
// L'estimation vient de la dépense RÉELLE déjà journalisée, jamais d'un devis :
// 0,126 $ par dépôt en médiane sur Sonnet (mesuré le 31/08, 67 dépôts).
const COUT_SONNET_PAR_DEPOT = 0.126
const ratio = (m) => {
  const t = TARIFS[m] ?? TARIFS['claude-sonnet-4-6']
  const s = TARIFS['claude-sonnet-4-6']
  return (t.entree / s.entree + t.sortie / s.sortie) / 2
}
const estime = MODELES.reduce((acc, m) => acc + ratio(m) * COUT_SONNET_PAR_DEPOT, 0) * depots.length
console.log(`\nCoût estimé : ~${estime.toFixed(2)} $ `
  + `(${depots.length} dépôts × ${MODELES.map((m) => `${(ratio(m) * COUT_SONNET_PAR_DEPOT).toFixed(3)} $`).join(' + ')})`)
console.log('⚠️  Estimation à partir de la dépense réelle mesurée, pas d\'un devis.'
  + '\n    Éprouvée le 31/08 sur un dépôt : annoncé 0,18 $, dépensé 0,258 $ — elle tombe'
  + '\n    BAS d\'environ 40 %, parce que le rapport des tarifs ignore l\'écriture de cache,'
  + '\n    qui coûte plus cher sur le modèle fort. Prends-la pour un ordre de grandeur.')

if (A_BLANC) { console.log('\n--a-blanc : rien n\'a été appelé.'); process.exit(0) }
if (!drapeau('oui')) {
  console.log('\nRelancer avec --oui pour dépenser réellement.')
  process.exit(0)
}

// ── 4. Le rejeu, dépôt par dépôt, modèle par modèle ─────────────────────────
const lignes = []
for (const d of depots) {
  let ctx
  try { ctx = await lireContexteDuDepot(admin, d.id) }
  catch (e) { console.log(`  ⚠️ dépôt ${d.id.slice(0, 8)} illisible : ${e.message}`); continue }

  const cibles = Object.keys(ctx.modesParCompetence ?? {}).filter((c) => COMPETENCES.includes(c))
  if (!cibles.length) { console.log(`  · dépôt ${d.id.slice(0, 8)} : aucune compétence ciblée`); continue }
  console.log(`\n· dépôt ${d.id.slice(0, 8)} — cran ${ctx.cran ?? 'aucun'} · ${cibles.join(', ')}`)

  for (const competence of cibles) {
    // ⭐ La lettre DÉJÀ écrite par la chaîne de production, quand elle existe :
    //    c'est la référence, et elle n'a rien coûté.
    const { data: dejaLa } = await admin.from('competences_mesures')
      .select('lettre_equivalente').eq('depot_id', d.id).eq('competence', competence).maybeSingle()

    const parModele = {}
    for (const modele of MODELES) {
      try {
        const r = await rejouerUneCompetence(admin, {
          depotId: d.id, competence, version: 'v1', modele, ctx,
        })
        parModele[modele] = r ? r.lettre : null
        console.log(`    ${competence.padEnd(15)} ${modele.padEnd(24)} → `
          + `${r ? (r.lettre ?? 'aucune lettre') : 'compétence fermée'}`
          + (r?.alerte ? `  ⚠️ ${r.alerte.slice(0, 80)}` : ''))
      } catch (e) {
        parModele[modele] = null
        console.log(`    ${competence.padEnd(15)} ${modele.padEnd(24)} → ✖ ${e.message.slice(0, 70)}`)
      }
    }
    lignes.push({ depot: d.id, competence, enBase: dejaLa?.lettre_equivalente ?? null, parModele })
  }
}

// ── 5. Le verdict — « même lettre, ou tout passe au modèle fort » ───────────
titre('ACCORD DES LETTRES')
if (!lignes.length) { console.log('Aucune mesure rejouée.'); process.exit(0) }

const REF = MODELES[0]
console.log(`Référence : ${REF}\n`)
for (const m of MODELES.slice(1)) {
  const comparables = lignes.filter((l) => l.parModele[REF] && l.parModele[m])
  const accord = comparables.filter((l) => l.parModele[REF] === l.parModele[m])
  const taux = comparables.length ? (100 * accord.length / comparables.length).toFixed(1) : '—'
  console.log(`${m.padEnd(26)} ${accord.length}/${comparables.length} lettres identiques  (${taux} %)`)
  for (const l of comparables.filter((x) => x.parModele[REF] !== x.parModele[m])) {
    console.log(`   ✖ ${l.depot.slice(0, 8)} ${l.competence.padEnd(15)} `
      + `${REF} → ${l.parModele[REF]}   ${m} → ${l.parModele[m]}`)
  }
}

console.log(
  '\n⛔ LE SEUIL EST LA DOCTRINE, PAS UN POURCENTAGE QUE CE SCRIPT CHOISIRAIT :'
  + '\n   « même lettre, ou tout passe au modèle fort » (`07-` §6). Un désaccord,'
  + '\n   même unique, est un désaccord — c\'est au professeur de dire s\'il le tolère.')
