// ============================================================================
// LE GESTE DE RATTRAPAGE — remettre en file les retours REFUSÉS d'avant le rejeu
// automatique.
// ----------------------------------------------------------------------------
// ⚠️⚠️ POURQUOI IL FAUT UN GESTE, ET POURQUOI IL NE SERT QU'UNE FOIS.
//    Le rejeu automatique (`programmerLeRejeuDuRetour`, `utils/chaine/chaine.ts`)
//    ne s'arme QUE sur un job que la file vient de traiter. Les copies refusées
//    AVANT son déploiement ont un job `abouti` : la file ne les réclamera plus
//    jamais, et **rien ne les débloquera tout seul**. Ce script les remet en
//    file, une fois. Ensuite, le mécanisme prend le relais et s'arrête seul.
//
// ⭐ CE QUI SE PASSE APRÈS, ET C'EST LE POINT.
//    Le geste est celui de l'HUMAIN : `relancerUnJob` **rend ses tentatives au
//    job** (tentatives → 0), délibérément. La file reprend alors :
//      · prise 1 → refus → remise (le compteur RESTE à 1)
//      · prise 2 → refus → remise (2)
//      · prise 3 → ⭐ TOLÉRANCE : si le refus est de FORME (règle 2, règle 5),
//        **le retour est écrit et publié**, avec son motif au message du job —
//        *« on accepte le retour tel quel, mais le prof doit relire »* ;
//        si le refus est une FALSIFICATION (RR3, RR4, règle 6), il ne l'est
//        JAMAIS, et le job finit `echec_definitif` — donc VISIBLE à l'élève.
//
// ⚠️ CE QUE ÇA COÛTE : **un appel chaud par tour et par copie**, soit jusqu'à
//    trois par copie (~0,023 $ l'appel). Le cron tourne à la minute : compter
//    trois à quatre minutes pour que tout soit retombé.
//
// ⛔ LA BASE NE SE DEVINE PAS. Sans `--prod`, le script vise le BAC À SABLE.
//    Sans `--joue`, il ne fait que DIRE ce qu'il ferait.
//
// ⚠️⚠️ **ET IL NE LIT PAS LE MESSAGE D'UN JOB COMME UN ÉTAT — c'est l'erreur qui
//    a fait croire à TROIS copies bloquées alors qu'il n'y en avait qu'UNE.**
//    `dernier_message` décrit le DERNIER PASSAGE DE CE JOB-LÀ : un `mesure_v1`
//    qui a dit « retour non écrit » le garde pour toujours, **même quand un
//    `retour_v1` a réussi vingt minutes plus tard**. *Une trace n'est pas un
//    état.* Le script ne s'en sert donc que pour TROUVER des candidats ; ce qui
//    décide, c'est **l'existence du retour en base**.
//
// ⚠️ ET « RETOUR NON PUBLIÉ » N'EST PAS « RETOUR MANQUANT ». En CLASSE,
//    `published_at` **est la case que coche le professeur** — « publier
//    automatiquement là court-circuiterait son geste ». Un retour de classe non
//    publié attend son professeur : **il n'y a rien à rejouer.**
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/rattraper-retours-refuses.mjs [--prod] [--joue]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const PROD = process.argv.includes('--prod')
const JOUE = process.argv.includes('--joue')

const URL = PROD ? env.PROD_SUPABASE_URL : env.NEXT_PUBLIC_SUPABASE_URL
const CLE = PROD ? env.PROD_SUPABASE_SECRET_KEY : env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !CLE) { console.error('base introuvable dans .env.local'); process.exit(2) }

const { mettreEnFile, relancerUnJob } = await import(`${process.cwd()}/utils/chaine/file.ts`)
const { refusDeFormeSeulement } = await import(`${process.cwd()}/utils/chaine/retour.ts`)

const admin = createClient(URL, CLE, { auth: { autoRefreshToken: false, persistSession: false } })

console.log(`\nBASE : ${PROD ? '⚠️  PROD' : 'bac à sable'} — ${URL}`)
console.log(`MODE : ${JOUE ? '⚠️  JOUÉ (des appels seront payés)' : 'à blanc (rien n’est touché)'}\n`)

// ── Qui est concerné : un job abouti dont le message porte un refus de retour ─
const { data: jobs, error } = await admin
  .from('exercices_jobs')
  .select('depot_id, etape, statut, tentatives, tentatives_max, dernier_message')
  .eq('statut', 'abouti')
  .like('dernier_message', '%retour refusé%')
if (error) { console.error(`file illisible : ${error.message}`); process.exit(1) }

// ⛔ On ne rattrape QUE ce qui n'a toujours pas de retour : un dépôt dont le
//    retour a fini par être écrit n'a rien à rejouer.
const parDepot = new Map()
for (const j of jobs ?? []) {
  const motif = (j.dernier_message.match(/retour refusé : (.+?)(?:, \d+ appel|$)/) || [, ''])[1]
  const p = parDepot.get(j.depot_id) ?? { motifs: new Set(), etapes: new Set() }
  if (motif) p.motifs.add(motif.trim())
  p.etapes.add(j.etape)
  parDepot.set(j.depot_id, p)
}
if (parDepot.size === 0) { console.log('✓ aucun retour refusé en attente — rien à rattraper.'); process.exit(0) }

const ids = [...parDepot.keys()]
const { data: retours } = await admin.from('exercices_retours')
  .select('depot_id, moment, published_at').in('depot_id', ids)
const retourChaud = new Map(
  (retours ?? []).filter((r) => r.moment === 'chaud').map((r) => [r.depot_id, r]))

// Le `lieu` décide de ce que « non publié » veut dire — voir l'en-tête.
const { data: lieux } = await admin.from('exercices_depots')
  .select('id, exercices!inner(lieu)').in('id', ids)
const lieuDe = new Map((lieux ?? []).map((x) => {
  const e = Array.isArray(x.exercices) ? x.exercices[0] : x.exercices
  return [x.id, e?.lieu ?? '?']
}))

let aFaire = 0
for (const [depotId, p] of parDepot) {
  const motifs = [...p.motifs]
  const r = retourChaud.get(depotId)
  const lieu = lieuDe.get(depotId) ?? '?'
  if (r) {
    console.log(`⊘ ${depotId} — LE RETOUR EXISTE (écrit, ${r.published_at ? 'publié' : 'NON publié'}).`)
    console.log(`    ${r.published_at
      ? 'Rien à faire.'
      : lieu === 'classe'
        ? 'En CLASSE, `published_at` est la case du PROFESSEUR : il attend son geste, '
          + 'et c\'est le comportement voulu. Rien à rejouer.'
        : '⚠️ À LA MAISON, la chaîne publie elle-même : un retour non publié est ANORMAL. '
          + 'À regarder — ce script ne le répare pas.'}`)
    console.log('    ⚠️ Le message du job disait « retour non écrit » : c\'est la trace d\'un '
      + 'passage ANTÉRIEUR, pas un état.')
    continue
  }
  aFaire++
  const forme = refusDeFormeSeulement(motifs)
  console.log(`${JOUE ? '▶' : '·'} ${depotId}`)
  console.log(`    motif  : ${motifs.join(' | ')}`)
  console.log(`    nature : ${forme
    ? '⭐ FORME — sera SERVI à la 3ᵉ tentative, avec « à relire » au message du job'
    : '⛔ FALSIFICATION — ne sera JAMAIS servi ; le job finira `echec_definitif`, visible à l’élève'}`)
  console.log(`    étapes en file : ${[...p.etapes].join(', ')} · lieu = ${lieu}`)
  if (lieu === 'classe') {
    console.log('    ⚠️ EN CLASSE : le retour rejoué NE SERA PAS PUBLIÉ — il ira au professeur, '
      + 'qui le publie. Le garde-fou de la 3ᵉ tentative y est donc structurellement tenu.')
  }
  if (!JOUE) continue

  // Le job `retour_v1` n'existe pas toujours : la première fois, le refus vient
  // de `mesure_v1`. On le crée s'il manque, on le relance s'il est là.
  const { deja, erreur } = await mettreEnFile(admin, depotId, 'retour_v1')
  if (erreur) { console.log(`    ✗ mise en file : ${erreur}`); continue }
  if (!deja) { console.log('    ✓ job `retour_v1` CRÉÉ — il partira au prochain tour du cron.'); continue }
  const { relance, raison } = await relancerUnJob(
    admin, depotId, 'retour_v1', 'rattrapage manuel — rejeu du retour refusé')
  console.log(`    ${relance ? '✓' : '✗'} ${raison}`)
}

console.log(`\n${'─'.repeat(72)}`)
if (!JOUE) {
  console.log(`À BLANC — ${aFaire} copie(s) seraient remises en file.`)
  console.log('Pour jouer :  … rattraper-retours-refuses.mjs'
    + `${PROD ? ' --prod' : ''} --joue`)
} else {
  console.log(`${aFaire} copie(s) remises en file. Le cron tourne à la minute :`)
  console.log('compter trois à quatre tours. Puis re-jouer ce script À BLANC pour vérifier')
  console.log('qu’il ne reste rien.')
}
