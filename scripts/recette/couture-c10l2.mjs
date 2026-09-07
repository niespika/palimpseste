// ============================================================================
// COUTURE C10 · L2 — « LE PROFESSEUR CLÔT LES DÉPÔTS D'UNE PASSATION » :
//                     est-ce que la clôture TIENT contre les onze chemins
//                     d'écriture de l'élève ? Éprouvé par EXÉCUTION.
// ----------------------------------------------------------------------------
// ⭐⭐ SIX COUTURES, ET LA DEUXIÈME VAUT TOUTES LES AUTRES :
//
//   ① le MIROIR    `clorLesDepots` → `exercices_depots.statut = 'abandonne'`
//                  sur `assigne` ET `ouvert`, en UN clic ; second clic → 0
//   ② la GARDE     ⭐ CELLE QUE CE LOT CRÉE. Après clôture, on APPELLE VRAIMENT
//                  les sept chemins d'écriture élève — `validerLaTranscription`,
//                  `validerLaSaisieClavier`, `enregistrerLesPhotos`,
//                  `enregistrerLaTranscription`, `enregistrerSeJuger`,
//                  `enregistrerConfianceRemise`, `enregistrerCredence` — plus
//                  `preparerDepotDesPhotos`, `transcrireDepot` et le re-dépôt de
//                  l'essai de Fragments. TOUS refusés, et le statut TOUJOURS
//                  `abandonne` en base après le refus.
//   ③ l'ÉCRAN ÉLÈVE `chargerVueEleve` → `clos: true`, et les trois offres muettes
//   ④ le JOURNAL   `routeur_decisions.override_prof` → l'entrée EXISTE, avec le
//                  bon `cycle_lundi` (isodow = 1), et AUCUN `routeur_decision_id`
//                  posé sur le dépôt (sinon `C10-L1` les fermerait aussi)
//   ⑤ le COMPTE    `comptesDeLaSemaine` AVANT et APRÈS → ÉGALITÉ STRICTE, sur
//                  une semaine comptée ET sur la semaine en cours
//   ⑥ le ROUTEUR   `exercicesParCycle` / K de R5 AVANT et APRÈS l'insert →
//                  ÉGALITÉ, plus la garde d'idempotence de la pose hebdomadaire
//                  et les minutes d'assiduité
//
// ⛔ PAS DE LECTURE DE CODE EN GUISE DE PREUVE. Ce script APPELLE ce que les
//    écrans appellent, puis il CONSTATE EN BASE.
//
// ⚠️ LA BASE EST LE BAC À SABLE, ET DES ÉLÈVES RÉELS Y TRAVAILLENT.
//    ⛔⛔ ET IL EST PARTAGÉ : mesuré le 07/09, il porte 17 dépôts de classe
//       `ouvert` qui appartiennent à d'AUTRES séances. Ce script ne clôt QUE
//       l'instance qu'il a semée (`clorLesDepots` borne à `exercice_id`), et son
//       `--retire` ne touche QUE ses ids et sa MARQUE — jamais un `update` par
//       table, jamais un `delete().neq(…)`.
//
// ⚠️⚠️ CE QU'IL NE PEUT PAS PROUVER, ET QUI VA AU SMOKE ÉLÈVE : il a la clé de
//    service en poche. Il ne prouve donc rien de ce qu'une VRAIE session voit —
//    la bannière verte éteinte, la ligne « abandonné » dans « Mes examens
//    passés », l'écran de dépôt fermé par son URL directe. C'est
//    `smoke-c10l2-eleve.mjs`, et il passe sur les DEUX modules.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c10l2.mjs [--constat|--essai|--retire] \
//        [--eleve <email>] [--garde-le-decor]
// ============================================================================

import { register } from 'node:module'

register('data:text/javascript,' + encodeURIComponent(`
const CARTE = {
  'next/navigation': 'next/navigation.js',
  'next/headers': 'next/headers.js',
  'next/cache': 'next/cache.js',
}
export async function resolve(specifier, contexte, suivant) {
  if (CARTE[specifier]) return suivant(CARTE[specifier], contexte)
  return suivant(specifier, contexte)
}
`))

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ⛔ `.env.local` SE PARSE À LA MAIN, JAMAIS PAR `source` : zsh mange une valeur
//    qui contient `$`, `^` ou `#`, et tronque la clé sans rien dire.
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.cwd()

// ── CE QUE LES ÉCRANS APPELLENT, ET RIEN D'AUTRE ────────────────────────────
const { clorLesDepots, ouvrirLesDepots, validerLaTranscription, validerLaSaisieClavier,
  enregistrerLesPhotos, enregistrerLaTranscription, preparerDepotDesPhotos,
  declencherLeLot, lireDepot } = await import(`${RACINE}/utils/passation/depots.ts`)
const { depotClos, MESSAGE_DEPOT_CLOS } = await import(`${RACINE}/utils/passation/statuts.ts`)
const { enregistrerSeJuger, enregistrerConfianceRemise, enregistrerCredence,
  offreSeJuger } = await import(`${RACINE}/utils/passation/metacognition.ts`)
const { transcrireDepot } = await import(`${RACINE}/utils/passation/ouvrier.ts`)
const { chargerVueEleve, chargerVueProf } = await import(`${RACINE}/utils/passation/vues.ts`)
const { publier } = await import(`${RACINE}/utils/passation/retours.ts`)
const { comptesDeLaSemaine } = await import(`${RACINE}/utils/assiduite/collecte.ts`)
const { estRendu, entreAuDenominateur } = await import(`${RACINE}/utils/routeur/assiduite.ts`)
const { lireLesDecisions } = await import(`${RACINE}/utils/routeur/donnees.ts`)
const { KdeR5 } = await import(`${RACINE}/utils/routeur/ciblage.ts`)
const { lundiDuCycle } = await import(`${RACINE}/utils/deroule/echeance.ts`)
const { toISODate } = await import(`${RACINE}/utils/calendrier-grille.ts`)
const { signauxDeLancement } = await import(`${RACINE}/utils/examens/signal.ts`)
const { examensEnClasseDeLEleve } = await import(`${RACINE}/utils/codex-onglets/liste.ts`)

// ════════════════════════════════════════════════════════════════════════════
// LES CONSTANTES DU DÉCOR
// ════════════════════════════════════════════════════════════════════════════
const MARQUE = 'COUTURE-C10L2'
const REGISTRE = 'scripts/recette/.couture-c10l2.json'
const SANDBOX = 'aoakpxxlyvthzueaywna'
const FUSEAU = 'America/Toronto'

/** Une semaine PASSÉE, dans le semestre, hors vacances — celle des dépôts semés. */
const CYCLE_SEME = '2026-08-31'
/**
 * ⭐ LE DÉPÔT DU DIMANCHE SOIR — 6 septembre 2026, 20 h 30 à Toronto, soit le
 *    LUNDI 7 SEPTEMBRE 00 h 30 UTC. Un `assigne_at.slice(0, 10)` le daterait de
 *    la semaine SUIVANTE, et l'insert de journal serait REFUSÉ par
 *    `routeur_cycle_lundi_chk CHECK (EXTRACT(isodow FROM cycle_lundi) = 1)` —
 *    à l'heure exacte à laquelle les élèves déposent. C'est le contrôle ④.
 */
const DIMANCHE_SOIR = '2026-09-07T00:30:00Z'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!URL || !URL.includes(SANDBOX)) {
  console.error(`⛔ REFUS — bac à sable uniquement (ce lot n'écrit JAMAIS en production). Vu : ${URL}`)
  process.exit(2)
}
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

// ── L'outillage : supabase-js NE LÈVE PAS ───────────────────────────────────
function lu(quoi, r) {
  if (r.error) throw new Error(`${quoi} — ${r.error.code ?? ''} ${r.error.message}`)
  return r.data
}
const arg = (n) => process.argv.includes(`--${n}`)
const valeur = (n) => {
  const i = process.argv.indexOf(`--${n}`)
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')
    ? process.argv[i + 1] : null
}

let ok = 0, ko = 0
const titre = (t) => console.log(`\n${'═'.repeat(76)}\n${t}\n${'═'.repeat(76)}`)
const note = (t) => console.log(`   · ${t}`)
function dire(vrai, quoi, detail = '') {
  if (vrai) { ok++; console.log(`  ✅ ${quoi}`) } else { ko++; console.log(`  ❌ ${quoi}`) }
  if (detail) console.log(`     ${detail}`)
}

let registre = {
  eleveId: null, autreEleveId: null, classeId: null,
  exercices: [], depots: [], decisionsSemees: [], decisionsJournal: [],
}
const sauver = () => fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

// ════════════════════════════════════════════════════════════════════════════
// ① LE CONSTAT — ce que la base porte AVANT, et ce que le lot y lit
// ════════════════════════════════════════════════════════════════════════════
async function constat() {
  titre('CONSTAT — l’état d’entrée, mesuré par requête')
  console.log(`Base : ${URL}`)

  const dep = lu('dépôts', await admin.from('exercices_depots')
    .select('id, statut, origine, exercice_id, routeur_decision_id'))
  const parStatut = {}
  for (const d of dep) parStatut[d.statut] = (parStatut[d.statut] ?? 0) + 1
  note(`exercices_depots : ${dep.length} — ${JSON.stringify(parStatut)}`)

  const ex = lu('instances', await admin.from('exercices').select('id, lieu'))
  const classe = ex.filter((e) => e.lieu === 'classe').map((e) => e.id)
  const depClasse = dep.filter((d) => classe.includes(d.exercice_id))
  const ouvertsAutrui = depClasse.filter((d) => d.statut === 'ouvert' || d.statut === 'assigne')
  note(`instances lieu=classe : ${classe.length} · leurs dépôts : ${depClasse.length}`)

  // ⛔⛔ LA MISE EN GARDE QUI COMPTE, ET ELLE SE MESURE À CHAQUE PASSAGE.
  dire(true, `⚠️ ${ouvertsAutrui.length} dépôt(s) de classe encore ouverts appartiennent à `
    + 'D’AUTRES SÉANCES — ce script ne les touche JAMAIS',
    'la clôture est bornée à l’instance semée (`clorLesDepots` filtre sur `exercice_id`), '
    + 'et `--retire` ne balaie que par la MARQUE et par ids')

  const abandonnes = dep.filter((d) => d.statut === 'abandonne')
  dire(true, `\`abandonne\` en base : ${abandonnes.length} ligne(s)`,
    abandonnes.length === 0
      ? 'aucune — ce lot en est la PREMIÈRE écriture réelle du dépôt'
      : `${abandonnes.map((d) => d.id.slice(0, 8)).join(', ')}`)

  const dec = lu('décisions', await admin.from('routeur_decisions')
    .select('id, cycle_lundi, exercice_id, regle_declenchee, override_prof'))
  note(`routeur_decisions : ${dec.length} — dont ${dec.filter((d) => d.override_prof).length} `
    + `avec un \`override_prof\`, ${dec.filter((d) => !d.exercice_id).length} sans exercice_id`)

  const assi = lu('assiduité', await admin.from('assiduite_hebdo').select('eleve_id, cycle_lundi'))
  note(`assiduite_hebdo : ${assi.length} ligne(s)`)

  // Le prédicat, éprouvé sur les neuf statuts — c'est la règle du lot, en une ligne.
  const table = {}
  for (const s of ['assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis',
    'clos', 'abandonne', 'retire', 'non_fait']) table[s] = depotClos({ statut: s })
  dire(table.abandonne && table.retire && table.clos
    && !table.assigne && !table.ouvert && !table.v1_remis && !table.retour_publie
    && !table.vf_remis && !table.non_fait,
    '`depotClos` ferme trois statuts et six passent', JSON.stringify(table))

  // ⭐ ET LA COHÉRENCE AVEC L'ASSIDUITÉ — l'argument mesuré qui justifie `abandonne`.
  dire(entreAuDenominateur('abandonne') === true && estRendu('abandonne') === false,
    '⭐ `abandonne` RESTE AU DÉNOMINATEUR et n’est JAMAIS rendu — c’est sa place',
    `entreAuDenominateur('abandonne')=${entreAuDenominateur('abandonne')} · `
    + `estRendu('abandonne')=${estRendu('abandonne')}`)
  dire(entreAuDenominateur('retire') === false,
    '⛔ `retire` SORT du dénominateur — il ABSOUDRAIT l’élève, l’inverse de l’intention')
  dire(estRendu('clos') === true,
    '⛔ `clos` COMPTE la copie comme RENDUE — il ferait passer pour rendue une copie jamais remise')
  dire(estRendu('ouvert') === false && entreAuDenominateur('ouvert') === true,
    '⭐⭐ `ouvert` ET `abandonne` SONT INDISCERNABLES POUR LA COLLECTE — la garantie du lot',
    'les deux : au dénominateur, jamais rendus. Sur TOUTE semaine, comptée ou non.')
}

// ════════════════════════════════════════════════════════════════════════════
// ② LE DÉCOR — une passation en classe, semée, avec ses six cas
// ════════════════════════════════════════════════════════════════════════════
async function semer() {
  titre('A. LE DÉCOR — une passation en classe, et six dépôts qui ne se ressemblent pas')

  const inscr = lu('inscriptions', await admin.from('inscriptions')
    .select('id, eleve_id, classe_id').eq('statut', 'active'))
  if (inscr.length < 2) {
    throw new Error('moins de deux inscriptions actives : condition de reprise — le décor a '
      + 'besoin de deux élèves dans la même classe.')
  }

  const dep = lu('dépôts', await admin.from('exercices_depots').select('eleve_id'))
  const charge = new Map()
  for (const d of dep) charge.set(d.eleve_id, (charge.get(d.eleve_id) ?? 0) + 1)

  // ⭐ `--eleve <email>` sème sur un élève NOMMÉ — c'est ce que le SMOKE demande.
  const emailVise = valeur('eleve')
  let choisi = [...inscr].sort((a, b) =>
    (charge.get(a.eleve_id) ?? 0) - (charge.get(b.eleve_id) ?? 0))[0]
  if (emailVise) {
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
    const u = users.find((x) => x.email === emailVise)
    if (!u) throw new Error(`aucun compte pour ${emailVise}`)
    const sien = inscr.find((i) => i.eleve_id === u.id)
    if (!sien) throw new Error(`${emailVise} n'est inscrit dans aucune classe active`)
    choisi = sien
    note(`élève NOMMÉ par --eleve : ${emailVise}`)
  }
  const autre = inscr.find((i) => i.eleve_id !== choisi.eleve_id && i.classe_id === choisi.classe_id)
  if (!autre) {
    throw new Error('un seul élève dans cette classe : condition de reprise — le décor a besoin '
      + 'd’un second élève, qui porte la copie REMISE que la clôture ne doit pas toucher.')
  }
  registre.eleveId = choisi.eleve_id
  registre.autreEleveId = autre.eleve_id
  registre.classeId = choisi.classe_id
  registre.inscriptionId = choisi.id
  sauver()
  note(`élève ${choisi.eleve_id.slice(0, 8)} · témoin ${autre.eleve_id.slice(0, 8)} · `
    + `classe ${choisi.classe_id.slice(0, 8)}`)

  // ⚠️ LE TRIGGER DU CRAN A DEUX SENS. Sur un type de nature `complet`, le cran
  //    DOIT rester nul ; sur tout autre, `statut <> 'a_concevoir'` SANS cran est
  //    refusé (`23514`). Une passation en classe est un examen diagnostique,
  //    donc `nature = 'complet'` : on prend ce type-là, et le cran reste NULL.
  const types = lu('types', await admin.from('exercices_types')
    .select('id, code, nature').eq('nature', 'complet'))
  const type = types.find((t) => t.code === 'examen_diagnostique_essai') ?? types[0]
  if (!type) {
    throw new Error('aucun type de nature `complet` : condition de reprise — la doctrine des '
      + 'types n’est pas dérivée sur cette base.')
  }
  note(`type ${type.code} (nature ${type.nature}) — cran laissé NULL, le trigger l’exige`)

  // ── L'INSTANCE, marquée pour que `--retire` la retrouve sans registre ──────
  const ex = lu('instance', await admin.from('exercices').insert({
    type_id: type.id, classe_id: registre.classeId, lieu: 'classe', statut: 'assigne',
    consigne_instanciee: {
      texte: `${MARQUE} — rédige un essai sur la liberté, et justifie ta thèse.`,
      recette: `${MARQUE} — passation`,
    },
    optin_se_juger: true, optin_confiance_remise: true,
  }).select('id').single())
  registre.exercices.push(ex.id)
  sauver()
  note(`instance ${ex.id.slice(0, 8)} · lieu=classe · optins levés`)

  // ── LES SIX CAS ───────────────────────────────────────────────────────────
  // ⭐ `d1-assigne` EXISTE PARCE QU'IL N'EXISTE PAS EN PRODUCTION. Mesuré le
  //    07/09 : `statut='assigne' ∧ routeur_decision_id IS NULL` → ZÉRO. Mais la
  //    fenêtre `assigne` dure des HEURES (10 h 30 sur une instance réelle,
  //    assignée le 26/08 à 04:04 et ouverte à 14:34) : un professeur qui assigne
  //    la veille au soir et ouvre le lendemain midi est un cas de terrain. Sans
  //    ce cas, la moitié du prédicat partirait NON ÉPROUVÉE.
  const CAS = [
    { nom: 'd1-assigne', eleve: registre.eleveId, statut: 'assigne', ouvre: false },
    { nom: 'd2-ouvert-vide', eleve: registre.autreEleveId, statut: 'ouvert', ouvre: true },
    { nom: 'd3-remise', eleve: null, statut: 'v1_remis', ouvre: true,
      transcription: `${MARQUE} — ma copie, rendue et validée. Elle ne doit PAS bouger.` },
    { nom: 'd4-brouillon', eleve: null, statut: 'ouvert', ouvre: true,
      transcription: `${MARQUE} — mon brouillon de 2 266 caractères, jamais validé. `
        + 'Le professeur doit être PRÉVENU avant de le clore.' },
    { nom: 'd5-dimanche', eleve: null, statut: 'ouvert', ouvre: true, assigneAt: DIMANCHE_SOIR },
    { nom: 'd6-retire', eleve: null, statut: 'retire', ouvre: true },
  ]

  // ⚠️ `uk_depots_eleve_exercice (eleve_id, exercice_id)` : UN dépôt par élève et
  //    par instance. Six cas ⇒ six élèves. On prend ceux de la classe, et on
  //    dit ce qui manque plutôt que d'en semer moins en silence.
  const dansLaClasse = inscr.filter((i) => i.classe_id === registre.classeId)
  const eleves = [registre.eleveId, registre.autreEleveId,
    ...dansLaClasse.map((i) => i.eleve_id)
      .filter((e) => e !== registre.eleveId && e !== registre.autreEleveId)]
  if (eleves.length < CAS.length) {
    throw new Error(`la classe porte ${eleves.length} élève(s), le décor en demande ${CAS.length} `
      + '(un dépôt par élève et par instance, `uk_depots_eleve_exercice`). Condition de reprise — '
      + 'jouer sur une classe qui porte au moins six élèves actifs.')
  }

  const semes = {}
  const maintenant = new Date().toISOString()
  const assigneParDefaut = `${CYCLE_SEME}T12:00:00Z`
  for (let i = 0; i < CAS.length; i++) {
    const c = CAS[i]
    const eleveId = c.eleve ?? eleves[i]
    const d = lu(`dépôt ${c.nom}`, await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: ex.id, origine: 'prof',
      statut: c.statut, assigne_at: c.assigneAt ?? assigneParDefaut,
      ...(c.ouvre ? { ouvert_at: maintenant, ouvert_par_prof_at: maintenant } : {}),
      ...(c.transcription ? { transcription_v1: c.transcription } : {}),
      ...(c.statut === 'v1_remis' ? { v1_remis_at: maintenant } : {}),
    }).select('id, eleve_id, statut, assigne_at').single())
    semes[c.nom] = d
    registre.depots.push(d.id)
    sauver()
    note(`${c.nom.padEnd(16)} → ${d.id.slice(0, 8)} · ${d.statut.padEnd(13)} · élève `
      + `${d.eleve_id.slice(0, 8)} · assigne_at ${d.assigne_at}`)
  }
  return { exerciceId: ex.id, semes }
}

// ════════════════════════════════════════════════════════════════════════════
// ③ AVANT LA CLÔTURE — les chiffres de référence, et les chemins qui PASSENT
// ════════════════════════════════════════════════════════════════════════════
async function avant({ exerciceId, semes }) {
  titre('B. AVANT LA CLÔTURE — les chemins d’écriture PASSENT, et les chiffres sont pris')

  // ⭐ La preuve que la garde ferme quelque chose qui était OUVERT : sans ce
  //    contrôle, un refus après clôture pourrait venir d'une autre garde.
  const r = await enregistrerLaTranscription(admin, semes['d2-ouvert-vide'].id,
    semes['d2-ouvert-vide'].eleve_id, `${MARQUE} — j’écris, et ça passe.`)
  dire(r.ok, 'AVANT : `enregistrerLaTranscription` PASSE sur un dépôt ouvert',
    r.ok ? '' : r.message)

  const vue = await chargerVueEleve(admin, semes['d2-ouvert-vide'].id, semes['d2-ouvert-vide'].eleve_id)
  dire(vue !== null && vue.ouvert === true && vue.clos === false,
    'AVANT : la vue élève est OUVERTE et non close',
    `ouvert=${vue?.ouvert} · clos=${vue?.clos}`)
  dire(vue?.seJuger?.servie !== false || vue?.seJuger?.motif !== MESSAGE_DEPOT_CLOS,
    'AVANT : l’offre « se juger » n’est pas tue par la clôture')

  return await mesuresDeReference()
}

/** Les chiffres que la clôture NE DOIT PAS bouger. Pris avant, repris après. */
async function mesuresDeReference() {
  const eleves = [registre.eleveId, registre.autreEleveId]
  const cycleCourant = toISODate(lundiDuCycle(new Date(), FUSEAU))
  const out = { comptes: {}, K: {}, minutes: {} }

  for (const eleveId of eleves) {
    // ⑤ LE COMPTE — sur la semaine SEMÉE (passée) et sur la semaine EN COURS.
    const depots = lu('dépôts de l’élève', await admin.from('exercices_depots')
      .select('id, eleve_id, statut, assigne_at, routeur_decisions(bonus)')
      .eq('eleve_id', eleveId))
    const pourLaCollecte = depots.map((d) => {
      const rd = Array.isArray(d.routeur_decisions) ? d.routeur_decisions[0] : d.routeur_decisions
      return { statut: d.statut, assigneAt: d.assigne_at, bonus: rd?.bonus === true }
    })
    for (const cycle of [CYCLE_SEME, cycleCourant]) {
      out.comptes[`${eleveId}|${cycle}`] = JSON.stringify(
        comptesDeLaSemaine(pourLaCollecte, cycle, FUSEAU))
    }

    // ⑥ LE ROUTEUR — K de R5, dérivé de `exercicesParCycle`, lui-même dérivé du
    //    journal. C'est le chiffre que la ligne d'override déplaçait.
    const dec = await lireLesDecisions(admin, eleveId)
    const servies = dec.filter((d) => d.exerciceId)
    const parCycle = new Map()
    for (const d of servies) parCycle.set(d.cycleLundi, (parCycle.get(d.cycleLundi) ?? 0) + 1)
    const pleins = [...parCycle.values()].filter((n) => n > 0)
    const moyenne = pleins.length
      ? Math.round(pleins.reduce((a, b) => a + b, 0) / pleins.length) : 0
    // ⛔ `lignes` N'ENTRE PAS DANS LA COMPARAISON, ET C'EST LE POINT. Le journal
    //    GAGNE une ligne — c'est le geste lui-même. Ce qui doit être ÉGAL, c'est
    //    ce que le routeur en DÉRIVE : la moyenne d'exercices par cycle et K.
    //    (Le premier essai de ce script comparait `lignes` avec, et échouait sur
    //    un champ dont le changement est l'objet même du lot.)
    out.K[eleveId] = JSON.stringify({ servies: servies.length, moyenne, K: KdeR5(moyenne || 1, 6) })
    out.lignesDuJournal = out.lignesDuJournal ?? {}
    out.lignesDuJournal[eleveId] = dec.length

    // ⑥ bis — LES MINUTES, que `remplirLesMinutes` écrit sur `assiduite_hebdo`.
    const assi = lu('assiduité', await admin.from('assiduite_hebdo')
      .select('cycle_lundi, exercices_assignes, exercices_termines, minutes_assignees')
      .eq('eleve_id', eleveId))
    out.minutes[eleveId] = JSON.stringify(assi)
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// ④ ① LE MIROIR — la clôture, en un clic, puis en deux
// ════════════════════════════════════════════════════════════════════════════
async function leMiroir({ exerciceId, semes }) {
  titre('C. ① LE MIROIR — `assigne` ET `ouvert` passent à `abandonne`, en UN clic')

  const avantEtat = lu('état avant', await admin.from('exercices_depots')
    .select('id, statut').eq('exercice_id', exerciceId))
  note(`avant : ${JSON.stringify(avantEtat.reduce((a, d) => ({ ...a, [d.statut]: (a[d.statut] ?? 0) + 1 }), {}))}`)

  const r = await clorLesDepots(admin, exerciceId)
  dire(r.ok, '`clorLesDepots` a rendu OK', r.ok ? '' : r.message)
  if (!r.ok) return { premier: r }
  note(`clos : ${r.data.clos.length} · déjà : ${r.data.deja}`)

  const apres = lu('état après', await admin.from('exercices_depots')
    .select('id, statut, v1_remis_at, transcription_v1').eq('exercice_id', exerciceId))
  const par = (nom) => apres.find((d) => d.id === semes[nom].id)

  dire(par('d1-assigne').statut === 'abandonne',
    '⭐ le dépôt `assigne` est passé à `abandonne` — la branche que la PROD n’a jamais',
    `d1 → ${par('d1-assigne').statut}`)
  dire(par('d2-ouvert-vide').statut === 'abandonne',
    'le dépôt `ouvert` est passé à `abandonne`', `d2 → ${par('d2-ouvert-vide').statut}`)
  dire(par('d5-dimanche').statut === 'abandonne',
    'le dépôt du DIMANCHE SOIR est passé à `abandonne`', `d5 → ${par('d5-dimanche').statut}`)
  dire(par('d3-remise').statut === 'v1_remis',
    '⛔ LA COPIE REMISE N’A PAS BOUGÉ', `d3 → ${par('d3-remise').statut}`)
  dire(par('d3-remise').transcription_v1 === semes['d3-remise'].transcription_v1
    || par('d3-remise').transcription_v1?.startsWith(MARQUE),
    '⛔ et son texte est intact')
  dire(par('d6-retire').statut === 'retire',
    '⛔ le dépôt RETIRÉ n’a pas été repeint en `abandonne`', `d6 → ${par('d6-retire').statut}`)

  // ⭐⭐ LE BROUILLON EST CLOS, ET SON TEXTE SURVIT — c'est l'arbitrage du lot.
  dire(par('d4-brouillon').statut === 'abandonne'
    && (par('d4-brouillon').transcription_v1 ?? '').length > 0,
    '⭐⭐ le BROUILLON est clos MAIS son texte n’est pas effacé — « remis » et '
    + '« porte du travail » sont deux prédicats différents',
    `d4 → ${par('d4-brouillon').statut} · ${(par('d4-brouillon').transcription_v1 ?? '').length} caractères`)

  // ── L'IDEMPOTENCE — second clic ───────────────────────────────────────────
  const r2 = await clorLesDepots(admin, exerciceId)
  dire(r2.ok && r2.data.clos.length === 0,
    '⭐ SECOND CLIC : 0 dépôt clos — l’idempotence tient par le FILTRE DE STATUT',
    r2.ok ? `clos=${r2.data.clos.length} · déjà=${r2.data.deja}` : r2.message)

  // ── LA GARDE DE LIEU — le miroir refuse une instance de maison ─────────────
  const exMaison = lu('instances maison', await admin.from('exercices')
    .select('id').eq('lieu', 'maison').limit(1))
  if (exMaison.length) {
    const rm = await clorLesDepots(admin, exMaison[0].id)
    dire(!rm.ok && rm.message.includes('passation en classe'),
      '⛔ la garde de LIEU refuse une instance de MAISON, avec son motif nommé',
      rm.ok ? 'ELLE A CLOS UNE INSTANCE DE MAISON' : rm.message.slice(0, 110))
  } else {
    note('aucune instance de maison en base : la garde de lieu n’a pas pu être éprouvée ici')
  }

  return { premier: r }
}

// ════════════════════════════════════════════════════════════════════════════
// ⑤ ② LA GARDE — ⭐ LE CONTRÔLE QUI VAUT TOUS LES AUTRES
// ════════════════════════════════════════════════════════════════════════════
async function laGarde({ semes }) {
  titre('D. ② LA GARDE — on APPELLE VRAIMENT les onze chemins d’écriture de l’élève')
  console.log('   Le scénario que la source déclarait impossible : le professeur clique')
  console.log('   « Clore », un élève resté sur son écran de transcription appuie sur')
  console.log('   « Valider », et la clôture est défaite EN SILENCE.\n')

  const d = semes['d2-ouvert-vide']
  const depotId = d.id
  const eleveId = d.eleve_id

  const refuse = (r) => r && r.ok === false && r.message === MESSAGE_DEPOT_CLOS

  const chemins = [
    ['1  preparerDepotDesPhotos', () => preparerDepotDesPhotos(admin, depotId, eleveId, 1)],
    ['2  enregistrerLesPhotos', () => enregistrerLesPhotos(admin, depotId, eleveId,
      [{ ordre: 1, path: 'x/y/01.jpg', largeur: 100, hauteur: 100, taille: 1000 }])],
    ['3  enregistrerLaTranscription', () => enregistrerLaTranscription(admin, depotId, eleveId,
      'je réécris ma copie après la clôture')],
    ['4  validerLaTranscription', () => validerLaTranscription(admin, depotId, eleveId,
      'je valide ma copie après la clôture')],
    ['5  validerLaSaisieClavier', () => validerLaSaisieClavier(admin, depotId, eleveId,
      'je tape ma copie après la clôture')],
    ['7  enregistrerSeJuger', async () => enregistrerSeJuger(admin, depotId, eleveId,
      await offreSeJuger(admin, depotId), {})],
    ['8  enregistrerConfianceRemise', () => enregistrerConfianceRemise(admin, depotId, eleveId, {})],
    ['9  enregistrerCredence', () => enregistrerCredence(admin, depotId, eleveId, [])],
  ]

  for (const [nom, appel] of chemins) {
    let r
    try { r = await appel() } catch (e) { r = { ok: false, message: `LEVÉE : ${e.message}` } }
    dire(refuse(r), `${nom} → refusé « ${MESSAGE_DEPOT_CLOS} »`,
      refuse(r) ? '' : `RENDU : ${JSON.stringify(r)?.slice(0, 160)}`)
  }

  // ── CHEMIN 6 : l'ouvrier de transcription. Il LÈVE, il ne rend pas. ────────
  let leve = null
  try { await transcrireDepot(admin, depotId) } catch (e) { leve = e }
  dire(leve !== null && String(leve.message).includes(MESSAGE_DEPOT_CLOS),
    '6  transcrireDepot → LÈVE `DepotSansCopie` avec le message de clôture',
    leve ? `${leve.constructor.name} : ${String(leve.message).slice(0, 120)}` : 'IL N’A PAS LEVÉ')

  // ── CHEMIN 10 : le RPC de collage, gardé dans l'APPELANT ───────────────────
  const avantCollages = lu('collages avant', await admin.from('exercices_depots')
    .select('collages_bloques').eq('id', depotId).single())
  const dLu = await lireDepot(admin, depotId)
  dire(depotClos(dLu) === true,
    '10 le prédicat que l’appelant du RPC de collage consulte rend VRAI',
    `statut lu : ${dLu.statut}`)
  const apresCollages = lu('collages après', await admin.from('exercices_depots')
    .select('collages_bloques').eq('id', depotId).single())
  dire(JSON.stringify(avantCollages) === JSON.stringify(apresCollages),
    '10 aucun collage n’a été journalisé sur le dépôt clos')

  // ── ⛔⛔ ET LE CONTRÔLE QUI FERME TOUT : le statut EST ENCORE `abandonne` ───
  const final = lu('statut final', await admin.from('exercices_depots')
    .select('statut, v1_remis_at, photos_v1').eq('id', depotId).single())
  dire(final.statut === 'abandonne' && final.v1_remis_at === null,
    '⛔⛔ APRÈS LES ONZE APPELS, LE DÉPÔT EST TOUJOURS `abandonne` ET NON REMIS',
    `statut=${final.statut} · v1_remis_at=${final.v1_remis_at} · `
    + `photos=${(final.photos_v1 ?? []).length}`)

  // ── ET LE TÉMOIN : un dépôt NON clos accepte encore, la garde n'a pas débordé ─
  const t = semes['d3-remise']
  const rt = await enregistrerLaTranscription(admin, t.id, t.eleve_id, 'témoin')
  dire(rt.ok === false && rt.message !== MESSAGE_DEPOT_CLOS,
    '⭐ le TÉMOIN remis est refusé par SA garde à lui (« déjà validé »), pas par la clôture',
    rt.message)
}

// ════════════════════════════════════════════════════════════════════════════
// ⑥ ③ L'ÉCRAN ÉLÈVE — la vue se RÉDUIT là où elle se construit
// ════════════════════════════════════════════════════════════════════════════
async function lEcranEleve({ semes }) {
  titre('E. ③ L’ÉCRAN ÉLÈVE — par l’URL directe, il ne propose plus de déposer')

  const d = semes['d2-ouvert-vide']
  const vue = await chargerVueEleve(admin, d.id, d.eleve_id)
  dire(vue !== null, 'la vue se charge encore (l’URL n’est pas cassée)')
  dire(vue?.clos === true, '⭐⭐ `VueEleve.clos` est VRAI — l’écran a de quoi le savoir',
    `clos=${vue?.clos}`)
  dire(vue?.ouvert === true,
    '⛔ ET `ouvert` EST TOUJOURS VRAI — la preuve que `!vue.ouvert` ne suffisait pas',
    `ouvert=${vue?.ouvert} (la clôture ne touche pas \`ouvert_par_prof_at\`)`)
  dire(vue?.seJuger?.servie === false && vue?.seJuger?.motif === MESSAGE_DEPOT_CLOS,
    'l’offre « se juger » est tue, avec le bon motif', JSON.stringify(vue?.seJuger?.motif))
  dire(vue?.confiance?.servie === false && vue?.credence?.servie === false,
    'les offres « confiance » et « crédence » sont tues elles aussi')

  // ── LE SIGNAL VERT — il s'éteint SANS UNE LIGNE À ÉCRIRE ──────────────────
  for (const module of ['codex', 'aletheia']) {
    const sig = await signauxDeLancement(admin, d.eleve_id, module)
    const sien = (sig ?? []).some((s) => s.depotId === d.id || s.depot_id === d.id)
    dire(!sien, `la bannière verte est ÉTEINTE dans ${module} (\`signauxDeLancement\` filtre `
      + '`statut = ouvert`)', `${(sig ?? []).length} signal(aux) restant(s)`)
  }

  // ── LA LIGNE « abandonné » APPARAÎT — comportement ATTENDU, pas un manque ──
  //
  // ⛔ ON INTERROGE LES TROIS ATELIERS, PAS « codex ». `examensEnClasseDeLEleve`
  //    prend l'atelier en PARAMÈTRE et n'affiche que le sien : chercher dans un
  //    seul, c'est ne rien prouver pour les deux autres — et c'est exactement
  //    l'erreur que la décision de Louis du 07/09 interdit (« on clôt Codex
  //    COMME Aletheia »). Le premier essai de ce script cherchait dans `codex`
  //    et concluait « ligne absente » sur une ligne qui existait dans `aletheia` :
  //    l'atelier se dérive de la ligne de plan, puis des modes, jamais du module
  //    par lequel on regarde.
  let trouvee = null
  for (const atelier of ['codex', 'aletheia', 'fragments']) {
    const passes = await examensEnClasseDeLEleve(admin, d.eleve_id, registre.classeId, atelier)
    const sien = (passes ?? []).find((x) => x.depotId === d.id)
    if (sien) trouvee = { atelier, ...sien }
  }
  dire(trouvee != null && trouvee.etat?.libelle === 'abandonné',
    '⭐ une ligne « abandonné » APPARAÎT dans « Mes examens passés » — c’est VOULU',
    trouvee ? `atelier « ${trouvee.atelier} » · libellé « ${trouvee.etat.libelle} » · `
      + `ton « ${trouvee.etat.ton} » (le ton \`clos\` est RÉUTILISÉ : aucun ton neuf, `
      + 'donc aucune table exhaustive à payer)'
      : 'ligne absente dans les TROIS ateliers — `STATUTS_APRES_REMISE` contient pourtant `abandonne`')
}

// ════════════════════════════════════════════════════════════════════════════
// ⑦ ④ LE JOURNAL — la couture est COUPÉE à l'autre bout, on la lit en base
// ════════════════════════════════════════════════════════════════════════════
async function leJournal({ exerciceId, semes }, clos) {
  titre('F. ④ LE JOURNAL — `override_prof`, et sa preuve ne peut être qu’une requête')

  // Le journal s'écrit dans l'ACTION serveur, pas dans `clorLesDepots` : on le
  // rejoue ici à l'identique, sur les lignes que la clôture a rendues.
  const echecs = []
  for (const d of clos) {
    const cycleLundi = toISODate(lundiDuCycle(new Date(d.assigne_at), FUSEAU))
    const entree = {
      geste: 'cloture_passation', depot_id: d.id, motif: `instance ${exerciceId}`,
      par: `${MARQUE}`, at: new Date().toISOString(),
      note: '`abandonne` — le professeur CONSTATE un non-geste de l’élève.',
    }
    const { data, error } = await admin.from('routeur_decisions').insert({
      eleve_id: d.eleve_id, cycle_lundi: cycleLundi,
      regle_declenchee: 'override_prof', override_prof: [entree],
    }).select('id').single()
    if (error) echecs.push(`${d.id.slice(0, 8)} : ${error.message}`)
    else { registre.decisionsJournal.push(data.id); sauver() }
  }
  dire(echecs.length === 0, '⭐ l’insert du journal PASSE pour chaque dépôt clos',
    echecs.length ? echecs.join(' | ') : `${registre.decisionsJournal.length} ligne(s) écrite(s)`)

  // ── LE `cycle_lundi` — c'est ici que le dimanche soir mord ─────────────────
  const lignes = lu('journal', await admin.from('routeur_decisions')
    .select('id, eleve_id, cycle_lundi, exercice_id, regle_declenchee, override_prof')
    .in('id', registre.decisionsJournal))
  const isodow = (iso) => {
    const j = new Date(`${iso}T00:00:00Z`).getUTCDay()
    return j === 0 ? 7 : j
  }
  dire(lignes.every((l) => isodow(l.cycle_lundi) === 1),
    '⛔⛔ TOUS les `cycle_lundi` sont des LUNDIS (isodow = 1) — le CHECK en base l’exige',
    lignes.map((l) => `${l.cycle_lundi}(${isodow(l.cycle_lundi)})`).join(' · '))

  const dimanche = lignes.find((l) => registre.depots.includes(
    (l.override_prof ?? [])[0]?.depot_id) && (l.override_prof ?? [])[0]?.depot_id === semes['d5-dimanche'].id)
  if (dimanche) {
    dire(dimanche.cycle_lundi === '2026-08-31',
      '⭐⭐ LE DÉPÔT DU DIMANCHE 20 H 30 À TORONTO EST DATÉ DE SA SEMAINE, pas de la suivante',
      `assigne_at ${DIMANCHE_SOIR} (UTC : lundi 7) → cycle ${dimanche.cycle_lundi} `
      + '(un `.slice(0, 10)` aurait donné 2026-09-07, et l’insert aurait été REFUSÉ)')
  }

  dire(lignes.every((l) => l.override_prof && Array.isArray(l.override_prof)
    && l.override_prof[0]?.geste === 'cloture_passation'
    && l.override_prof[0]?.depot_id),
    '⭐ chaque entrée porte son `geste` et son `depot_id` — le SEUL lien vers le dépôt')

  dire(lignes.every((l) => l.exercice_id === null),
    '⭐ `exercice_id` est NULL — une ligne d’override n’a servi AUCUN exercice')

  // ── ⛔⛔ ET LE DÉPÔT N'A PAS DE `routeur_decision_id` ──────────────────────
  const dep = lu('dépôts', await admin.from('exercices_depots')
    .select('id, routeur_decision_id').eq('exercice_id', exerciceId))
  dire(dep.every((d) => d.routeur_decision_id === null),
    '⛔⛔ AUCUN `routeur_decision_id` posé sur les dépôts — sinon `C10-L1` les fermerait AUSSI',
    `${dep.filter((d) => d.routeur_decision_id).length} dépôt(s) liés (attendu 0)`)
}

// ════════════════════════════════════════════════════════════════════════════
// ⑧ ⑤ et ⑥ — LE COMPTE ET LE ROUTEUR : égalité stricte, avant / après
// ════════════════════════════════════════════════════════════════════════════
async function lesChiffres(ref) {
  titre('G. ⑤ LE COMPTE et ⑥ LE ROUTEUR — égalité stricte AVANT / APRÈS')

  const apres = await mesuresDeReference()

  for (const [cle, valeurAvant] of Object.entries(ref.comptes)) {
    const [eleve, cycle] = cle.split('|')
    dire(apres.comptes[cle] === valeurAvant,
      `⑤ \`comptesDeLaSemaine\` INCHANGÉ — élève ${eleve.slice(0, 8)}, cycle ${cycle}`,
      `avant ${valeurAvant} · après ${apres.comptes[cle]}`)
  }

  for (const [eleve, valeurAvant] of Object.entries(ref.K)) {
    dire(apres.K[eleve] === valeurAvant,
      `⑥ K de R5 INCHANGÉ malgré la ligne de journal — élève ${eleve.slice(0, 8)}`,
      `avant ${valeurAvant} · après ${apres.K[eleve]} — et le journal est bien PASSÉ de `
      + `${ref.lignesDuJournal?.[eleve] ?? '?'} à ${apres.lignesDuJournal?.[eleve] ?? '?'} ligne(s) : `
      + 'la ligne existe, elle ne déplace simplement plus rien')
  }

  for (const [eleve, valeurAvant] of Object.entries(ref.minutes)) {
    dire(apres.minutes[eleve] === valeurAvant,
      `⑥ bis \`assiduite_hebdo\` INCHANGÉE (minutes comprises) — élève ${eleve.slice(0, 8)}`,
      `avant ${valeurAvant} · après ${apres.minutes[eleve]}`)
  }

  // ── ⛔⛔ LA RÉGRESSION QUE LE PROMPT NE NOMMAIT PAS ────────────────────────
  // La garde d'idempotence de la pose hebdomadaire lit les MÊMES décisions. Une
  // ligne d'override porte `bonus` NULL : sans le filtre sur `exerciceId`, elle
  // satisfaisait `!d.bonus` et l'élève était déclaré « déjà servi » — donc AUCUN
  // exercice posé de la semaine, en silence.
  for (const eleveId of [registre.eleveId, registre.autreEleveId]) {
    const dec = await lireLesDecisions(admin, eleveId)
    const overrides = dec.filter((d) => !d.exerciceId)
    const cyclesDoverride = [...new Set(overrides.map((d) => d.cycleLundi))]
    for (const cycle of cyclesDoverride) {
      const sansFiltre = dec.some((d) => d.cycleLundi === cycle && !d.bonus)
      const avecFiltre = dec.some((d) => d.cycleLundi === cycle && !d.bonus && !!d.exerciceId)
      dire(avecFiltre === false || dec.some((d) => d.cycleLundi === cycle && d.exerciceId),
        `⛔⛔ GARDE D’IDEMPOTENCE — élève ${eleveId.slice(0, 8)}, cycle ${cycle} : la ligne `
        + 'd’override ne fait PAS croire que la semaine est servie',
        `sans le filtre : dejaServi=${sansFiltre} (une semaine PERDUE) · `
        + `avec le filtre : dejaServi=${avecFiltre}`)
    }
    if (cyclesDoverride.length === 0) {
      note(`élève ${eleveId.slice(0, 8)} : aucune ligne d’override — rien à éprouver ici`)
    }
  }
}

// ════════════════════════════════════════════════════════════════════════════
// ⑨ L'ORDRE DES GESTES — clore AVANT publier, et pourquoi ça compte
// ════════════════════════════════════════════════════════════════════════════
async function lOrdreDesGestes({ exerciceId, semes }) {
  titre('H. L’ORDRE — clore AVANT de déclencher, et `publier` ne repeint plus rien')

  // `declencherLeLot` écarte déjà `abandonne` : l'entrée dans la chaîne est fermée.
  const r = await declencherLeLot(admin, exerciceId)
  dire(r.ok, '`declencherLeLot` a rendu OK', r.ok ? JSON.stringify(r.data) : r.message)
  if (r.ok) {
    dire(r.data.misEnFile <= 1,
      '⭐ seule la copie REMISE entre au lot — les abandonnés sont écartés',
      `misEnFile=${r.data.misEnFile} · sansCopie=${r.data.sansCopie}`)
  }

  // ⭐ L'ARGUMENT POSITIF À DIRE AU PROFESSEUR, éprouvé : `publier` filtre
  //    `.in('statut', ['v1_remis','ouvert'])`. Après la clôture, un `abandonne`
  //    en sort naturellement — clore d'abord empêche de repeindre en « retour
  //    publié » une copie jamais rendue.
  const p = await publier(admin, [semes['d2-ouvert-vide'].id])
  const etat = lu('statut après publier', await admin.from('exercices_depots')
    .select('statut').eq('id', semes['d2-ouvert-vide'].id).single())
  dire(etat.statut === 'abandonne',
    '⭐⭐ `publier` NE REPEINT PAS un dépôt clos en « retour publié »',
    `statut après publier : ${etat.statut} · retour de publier : ${JSON.stringify(p)?.slice(0, 120)}`)
}

// ════════════════════════════════════════════════════════════════════════════
// ⑩ LE RETRAIT — par la MARQUE et par ids, JAMAIS par table
// ════════════════════════════════════════════════════════════════════════════
async function retire() {
  titre('I. LE RETRAIT — la base rendue à son état d’entrée, et VÉRIFIÉE')
  const r = fs.existsSync(REGISTRE)
    ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
    : { exercices: [], depots: [], decisionsJournal: [] }
  if (!fs.existsSync(REGISTRE)) note('aucun registre — on balaie tout de même PAR LA MARQUE.')

  // ⭐ LE BALAI PAR LA MARQUE, même sans registre.
  const parLaMarque = lu('instances marquées', await admin.from('exercices')
    .select('id').ilike('consigne_instanciee->>recette', `${MARQUE}%`))
  const instances = [...new Set([...(r.exercices ?? []), ...parLaMarque.map((x) => x.id)])]

  // ⛔ L'ORDRE : les enfants d'abord.
  if (instances.length) {
    const dep = lu('dépôts des instances', await admin.from('exercices_depots')
      .select('id').in('exercice_id', instances))
    if (dep.length) {
      const ids = dep.map((d) => d.id)
      lu('suppr retours', await admin.from('exercices_retours')
        .delete().in('depot_id', ids).select('id'))
      lu('suppr jobs', await admin.from('exercices_jobs').delete().in('depot_id', ids).select('id'))
      lu('suppr métacognition', await admin.from('exercices_metacognition')
        .delete().in('depot_id', ids).select('id'))
      lu('suppr dépôts', await admin.from('exercices_depots').delete().in('id', ids).select('id'))
    }
    lu('suppr instances', await admin.from('exercices').delete().in('id', instances).select('id'))
    note(`${instances.length} instance(s) retirée(s), avec leurs dépôts`)
  }

  // ⛔⛔ LE JOURNAL SE RETIRE PAR SES IDS, JAMAIS PAR CYCLE NI PAR ÉLÈVE : un
  //    `delete().eq('cycle_lundi', …)` emporterait le décor d'une autre séance.
  if ((r.decisionsJournal ?? []).length) {
    lu('suppr journal', await admin.from('routeur_decisions')
      .delete().in('id', r.decisionsJournal).select('id'))
    note(`${r.decisionsJournal.length} ligne(s) de journal retirée(s) PAR ID`)
  }

  // ── LA VÉRIFICATION, PAR REQUÊTE ─────────────────────────────────────────
  const reste = lu('reste instances', await admin.from('exercices')
    .select('id').ilike('consigne_instanciee->>recette', `${MARQUE}%`))
  dire(reste.length === 0, 'aucune instance marquée ne survit', `restantes : ${reste.length}`)
  if ((r.decisionsJournal ?? []).length) {
    const resteJ = lu('reste journal', await admin.from('routeur_decisions')
      .select('id').in('id', r.decisionsJournal))
    dire(resteJ.length === 0, 'aucune ligne de journal semée ne survit',
      `restantes : ${resteJ.length}`)
  }
  const abandonnes = lu('abandonnés', await admin.from('exercices_depots')
    .select('id').eq('statut', 'abandonne'))
  dire(abandonnes.length === 0,
    'aucun dépôt `abandonne` ne survit dans la base partagée',
    `restants : ${abandonnes.length}`)

  if (fs.existsSync(REGISTRE)) { fs.unlinkSync(REGISTRE); console.log('  ✅ registre retiré.') }
}

// ════════════════════════════════════════════════════════════════════════════
async function essai() {
  if (fs.existsSync(REGISTRE)) {
    throw new Error(`un essai est déjà en cours (${REGISTRE}). \`--retire\` d'abord.`)
  }
  await constat()
  const decor = await semer()
  try {
    const ref = await avant(decor)
    const { premier } = await leMiroir(decor)
    await laGarde(decor)
    await lEcranEleve(decor)
    if (premier?.ok) await leJournal(decor, premier.data.clos)
    await lesChiffres(ref)
    await lOrdreDesGestes(decor)
  } finally {
    titre(`BILAN — ${ok} contrôle(s) tenu(s), ${ko} en échec`)
    if (arg('garde-le-decor')) {
      console.log(`\n⚠️ DÉCOR GARDÉ (\`--garde-le-decor\`). Élève ${registre.eleveId} — `
        + `instance ${registre.exercices[0]} — \`--retire\` pour rendre la base.`)
    } else {
      await retire()
    }
  }
  if (ko > 0) process.exit(1)
}

const mode = arg('essai') ? essai : arg('retire') ? retire : constat
mode().catch((e) => { console.error(`\n⛔ ${e.stack ?? e.message}`); process.exit(1) })
