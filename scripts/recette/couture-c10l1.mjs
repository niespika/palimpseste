// ============================================================================
// COUTURE C10 · L1 — « LA SEMAINE COMPTÉE SE FERME » : est-ce que la LIGNE
//                     d'assiduité, écrite par un cron, FERME vraiment les
//                     exercices du routeur ? Éprouvé par EXÉCUTION.
// ----------------------------------------------------------------------------
// ⭐⭐ QUATRE COUTURES, ET AUCUNE NE SE PROUVE EN LISANT DU CODE :
//
//   ① la LIGNE       `poserLaSemaineDAssiduite` (le cron) → `cyclesComptesDeLEleve`
//   ② la SEMAINE     `assigne_at` → `lundiDuCycle(instant, fuseau)`, LA MÊME
//                    dérivation que `comptesDeLaSemaine` — sinon la fermeture et
//                    le comptage désignent deux semaines différentes
//   ③ la VOIE DU PROF `routeur_decision_id` → le discriminant de la source
//   ④ la LECTURE     `validerLaLecture` → `statut = 'clos'` → le bilan s'ouvre
//
// ⛔ PAS DE LECTURE DE CODE EN GUISE DE PREUVE. Ce script APPELLE ce que les
//    écrans appellent — `poserLaSemaineDAssiduite`, `cyclesComptesDeLEleve`,
//    `chargerLeDeroule`, `exercicesMaisonDeLEleve`, `chargerLaSemaineDeLEleve`,
//    `validerLaLecture`, `comptesDeLaSemaine` — puis il CONSTATE EN BASE.
//
// ⛔⛔ IL N'ÉCRIT AUCUN STATUT DE FERMETURE, PARCE QU'IL N'EN EXISTE PAS. Si ce
//    script se surprenait à tamponner quoi que ce soit pour « fermer », c'est
//    que le lot aurait perdu son prédicat en route.
//
// ⚠️ LA BASE EST LE BAC À SABLE, ET DES ÉLÈVES RÉELS Y TRAVAILLENT.
//    ⭐ Chaque ligne semée porte LA MARQUE, le registre s'écrit À CHAQUE
//       ÉCRITURE, et `--retire` balaie PAR LA MARQUE même sans registre.
//    ⛔⛔ ET L'ASSIDUITÉ SE RETIRE PAR IDENTITÉ, JAMAIS PAR TABLE. Deux scripts
//       du dépôt effacent `assiduite_hebdo` EN ENTIER — `essai-cron-hebdo.ts
//       --retire` (un `delete().neq(eleve_id, 000…)`) et `routeur-c4l12.mjs
//       --retire` (tout le cycle, tous élèves) : dans un bac à sable partagé,
//       ils emportent le décor d'une AUTRE séance avec le leur. Ici, on note les
//       couples (élève, cycle) présents AVANT, et on ne retire que les nouveaux.
//
// ⚠️⚠️ CE QUE CE SCRIPT NE PEUT PAS PROUVER, ET QUI VA AU SMOKE ÉLÈVE : le
//    REFUS du portier (`app/deroule/actions.ts`) passe par `garderEleveDeroule`,
//    donc par des cookies de session — il n'y a pas de session ici. Et surtout,
//    ce script a la clé de service en poche : il ne peut PAS prouver que la
//    lecture d'`assiduite_hebdo` marche depuis une vraie session élève. C'est
//    exactement le défaut que la table peut cacher (aucune policy élève ⇒ zéro
//    ligne, SANS erreur), et il ne se voit que depuis le lien magique.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c10l1.mjs [--constat|--essai|--retire] [--garde-le-decor]
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

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.cwd()

// ── CE QUE LES ÉCRANS APPELLENT, ET RIEN D'AUTRE ────────────────────────────
const { poserLaSemaineDAssiduite } = await import(`${RACINE}/utils/assiduite/collecte-serveur.ts`)
const { comptesDeLaSemaine } = await import(`${RACINE}/utils/assiduite/collecte.ts`)
const { cyclesComptesDeLEleve } = await import(`${RACINE}/utils/deroule/fermeture-serveur.ts`)
const { estFermee, vueFermee, MESSAGE_SEMAINE_FERMEE } =
  await import(`${RACINE}/utils/deroule/fermeture.ts`)
const { chargerLeDeroule } = await import(`${RACINE}/utils/deroule/vue.ts`)
const { lireDepotMaison } = await import(`${RACINE}/utils/deroule/depot.ts`)
const { validerLaLecture } = await import(`${RACINE}/utils/deroule/contestation.ts`)
const { exercicesMaisonDeLEleve } = await import(`${RACINE}/utils/codex-onglets/liste.ts`)
const { chargerLaSemaineDeLEleve } = await import(`${RACINE}/utils/eleve/semaine-serveur.ts`)
const { lundiDuCycle } = await import(`${RACINE}/utils/deroule/echeance.ts`)
const { toISODate } = await import(`${RACINE}/utils/calendrier-grille.ts`)

// ════════════════════════════════════════════════════════════════════════════
// LES CONSTANTES DU DÉCOR
// ════════════════════════════════════════════════════════════════════════════
const MARQUE = 'COUTURE-C10L1'
const REGISTRE = 'scripts/recette/.couture-c10l1.json'
const SANDBOX = 'aoakpxxlyvthzueaywna'
const FUSEAU = 'America/Toronto'
const COMPETENCE = 'argumentation'

/** La semaine que le décor fera COMPTER — passée, dans le semestre, hors vacances. */
const CYCLE_FERME = '2026-08-31'
/** La semaine EN COURS : elle n'a jamais de ligne, et rien ne doit l'y mettre. */
const CYCLE_OUVERT = '2026-09-07'
/**
 * ⭐ LE DÉPÔT DU DIMANCHE SOIR — 6 septembre 2026, 20 h 30 à Toronto, soit le
 *    LUNDI 7 SEPTEMBRE 00 h 30 UTC. Lu en UTC il basculerait d'une semaine, à
 *    l'heure exacte à laquelle les élèves déposent. C'est le contrôle ②.
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
  eleveId: null, classeId: null, temoinId: null,
  exercices: [], depots: [], decisions: [], retours: [],
  assiduiteAvant: [], assiduitePosee: [],
}
const sauver = () => fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

/** La clé d'une ligne d'assiduité — c'est par elle qu'on retire, jamais par table. */
const cle = (l) => `${l.eleve_id}|${l.cycle_lundi}`

const pointDeRetour = (num, texte) => ([{
  id: `${MARQUE.toLowerCase()}:v1:${num}`,
  texte,
  nature: 'point_de_travail',
  ancrage: { source: 'copie', citation: 'une phrase de la copie semée par la recette' },
  competence: COMPETENCE,
}])

// ════════════════════════════════════════════════════════════════════════════
// ① LE CONSTAT — ce que la base porte AVANT, et ce que le lot y lit
// ════════════════════════════════════════════════════════════════════════════
async function constat() {
  titre('CONSTAT — l’état d’entrée, mesuré par requête')
  console.log(`Base : ${URL}`)

  const assi = lu('assiduité', await admin.from('assiduite_hebdo')
    .select('eleve_id, cycle_lundi'))
  const parCycle = {}
  for (const a of assi) parCycle[a.cycle_lundi] = (parCycle[a.cycle_lundi] ?? 0) + 1
  note(`assiduite_hebdo : ${assi.length} ligne(s) — ${JSON.stringify(parCycle)}`)

  const dep = lu('dépôts', await admin.from('exercices_depots')
    .select('id, origine, routeur_decision_id, statut, assigne_at'))
  const routeur = dep.filter((d) => d.routeur_decision_id !== null)
  note(`exercices_depots : ${dep.length} — dont ${routeur.length} avec une décision de routeur`)

  // ⭐ LE CONTRÔLE ③ SE FAIT À CHAQUE PASSAGE, décor ou pas : une divergence
  //    entre les deux discriminants est une TROUVAILLE À DÉPOSER, jamais un cas
  //    à traiter en silence. La clé étrangère est `ON DELETE SET NULL` : une
  //    décision supprimée laisserait `origine = 'routeur'` SANS décision.
  const div1 = dep.filter((d) => d.origine === 'routeur' && d.routeur_decision_id === null)
  const div2 = dep.filter((d) => d.origine === 'prof' && d.routeur_decision_id !== null)
  dire(div1.length === 0 && div2.length === 0,
    '③ LES DEUX DISCRIMINANTS CONCORDENT — `origine` et `routeur_decision_id`',
    `origine=routeur sans décision : ${div1.length} · origine=prof avec décision : ${div2.length}`
    + ' (attendu 0 et 0 ; une divergence non nulle se dépose au relevé)')

  const classes = lu('classes', await admin.from('classes').select('id, nom').eq('statut', 'active'))
  note(`classes actives : ${classes.length}`)
  console.log(`\n⭐ \`--essai\` sèmerait le décor, ferait poser la ligne du ${CYCLE_FERME} par le`)
  console.log('   VRAI écrivain du cron, puis éprouverait les quatre coutures.')
}

// ════════════════════════════════════════════════════════════════════════════
// ② LE DÉCOR — huit dépôts dessinés pour lever chaque clause du « fait quand »
// ════════════════════════════════════════════════════════════════════════════
async function semer() {
  titre('A. LE DÉCOR — huit dépôts, un par clause du « fait quand »')

  const classes = lu('classes', await admin.from('classes').select('id, nom').eq('statut', 'active'))
  if (!classes.length) throw new Error('aucune classe active : condition de reprise — en créer une.')
  const inscr = lu('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id').eq('statut', 'active')
    .in('classe_id', classes.map((c) => c.id)))
  if (!inscr.length) throw new Error('aucun élève inscrit dans une classe active.')

  // ⭐ On prend l'élève qui porte le MOINS de dépôts : le décor pèse moins sur
  //    ses écrans, et les contrôles de la semaine restent lisibles.
  const dep = lu('dépôts', await admin.from('exercices_depots').select('eleve_id'))
  const charge = new Map()
  for (const d of dep) charge.set(d.eleve_id, (charge.get(d.eleve_id) ?? 0) + 1)
  // ⭐ `--eleve <email>` sème sur un élève NOMMÉ — c'est ce que le SMOKE demande :
  //    le lien magique se minte sur une adresse, et seule une VRAIE session élève
  //    peut prouver que la lecture d'`assiduite_hebdo` fonctionne (ce script-ci a
  //    la clé de service en poche, et ne prouve donc rien de ce côté-là).
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
  registre.eleveId = choisi.eleve_id
  registre.classeId = choisi.classe_id
  // ⭐⭐ UN SECOND ÉLÈVE, ET IL EST NÉCESSAIRE — pas un luxe. La semaine du
  //    premier porte un dépôt de la VOIE DU PROFESSEUR qui reste OUVERT (c'est
  //    la preuve ③), et un exercice ouvert retient légitimement le bilan. Le
  //    témoin porte donc UNIQUEMENT des dépôts du routeur : c'est sur lui que se
  //    prouve « le bilan s'ouvre malgré les non faits ».
  const temoin = inscr.find((i) => i.eleve_id !== choisi.eleve_id
    && i.classe_id === choisi.classe_id)
  if (!temoin) {
    throw new Error('un seul élève dans cette classe : le témoin du bilan n’a pas de support. '
      + 'Condition de reprise — jouer sur une classe active qui porte au moins deux élèves.')
  }
  registre.temoinId = temoin.eleve_id
  note(`élève : ${choisi.eleve_id.slice(0, 8)} (classe ${choisi.classe_id.slice(0, 8)}, `
    + `${charge.get(choisi.eleve_id) ?? 0} dépôt(s) avant)`)

  // ⛔ L'ÉTAT D'ENTRÉE DE L'ASSIDUITÉ, AVANT TOUTE ÉCRITURE — c'est lui qui rend
  //    le retrait chirurgical possible.
  registre.assiduiteAvant = lu('assiduité avant',
    await admin.from('assiduite_hebdo').select('eleve_id, cycle_lundi')).map(cle)
  sauver()
  note(`assiduite_hebdo AVANT : ${registre.assiduiteAvant.length} ligne(s) — le retrait ne `
    + 'touchera QUE les couples absents de cette liste')

  // ⚠️ UN TYPE QUI DÉCLARE SES CRANS, et pas n'importe lequel : la base exige
  //    qu'« une instance conçue porte son cran » — statut `assigne` sans cran est
  //    REFUSÉ (`23514`). On lit le cran, on ne l'invente pas.
  const types = lu('types', await admin.from('exercices_types').select('id, code'))
  let typeId = null, cran = null
  for (const t of types) {
    const crans = lu('crans du type', await admin.from('exercices_types_crans')
      .select('cran').eq('type_id', t.id).order('cran'))
    if (crans.length) { typeId = t.id; cran = crans[0].cran; break }
  }
  if (!typeId) {
    throw new Error('aucun type d’exercice ne déclare de cran : condition de reprise — '
      + 'jouer sur une base où la doctrine est dérivée (`exercices_types_crans` non vide).')
  }
  note(`type ${typeId.slice(0, 8)} · cran ${cran} (lu, jamais inventé)`)

  // ── Les huit cas, dessinés ─────────────────────────────────────────────────
  const CAS = [
    { nom: 'd1-assigne',      statut: 'assigne',  cycle: CYCLE_FERME,  routeur: true,  bonus: false, brouillon: null, retour: null },
    { nom: 'd2-brouillon',    statut: 'ouvert',   cycle: CYCLE_FERME,  routeur: true,  bonus: false, brouillon: `${MARQUE} — mon brouillon, laissé en plan un vendredi soir.`, retour: null },
    { nom: 'd3-retour-nonlu', statut: 'retour_publie', cycle: CYCLE_FERME, routeur: true, bonus: false, brouillon: `${MARQUE} — ma v1, rendue et corrigée.`, retour: 'publie' },
    { nom: 'd4-vf',           statut: 'vf_remis', cycle: CYCLE_FERME,  routeur: true,  bonus: false, brouillon: `${MARQUE} — ma v1.`, vf: `${MARQUE} — ma version finale.`, retour: null },
    { nom: 'd5-bonus',        statut: 'assigne',  cycle: CYCLE_FERME,  routeur: true,  bonus: true,  brouillon: null, retour: null },
    { nom: 'd6-voie-du-prof', statut: 'assigne',  cycle: CYCLE_FERME,  routeur: false, bonus: false, brouillon: null, retour: null },
    { nom: 'd7-semaine-en-cours', statut: 'assigne', cycle: CYCLE_OUVERT, routeur: true, bonus: false, brouillon: null, retour: null },
    { nom: 'd8-dimanche-2030', statut: 'assigne', cycle: CYCLE_FERME,  routeur: true,  bonus: false, brouillon: null, retour: null, assigneAt: DIMANCHE_SOIR },
  ]

  const semes = {}
  for (const c of CAS) {
    const ex = lu(`instance ${c.nom}`, await admin.from('exercices').insert({
      type_id: typeId, classe_id: registre.classeId, lieu: 'maison', statut: 'assigne',
      cran,
      // ⚠️ `texte` EST LA CLÉ QUE L'ÉCRAN LIT : `titreDeLaConsigne` prend la
      //    première ligne non vide de `consigne_instanciee.texte`, et retombe sur
      //    « Exercice » sinon. Un décor qui ne la porte pas donne un smoke où
      //    TOUS les titres se ressemblent — trouvé au smoke du 07/09.
      //    ⭐ `recette` reste à côté : c'est par elle que `--retire` balaie.
      consigne_instanciee: {
        texte: `${c.nom} — rédige un paragraphe argumenté sur la liberté, et justifie ta thèse.`,
        recette: `${MARQUE} — ${c.nom}`,
      },
      modes_par_competence: { [COMPETENCE]: ['composer'] },
    }).select('id').single())
    registre.exercices.push(ex.id)
    sauver()

    let decisionId = null
    if (c.routeur) {
      const dec = lu(`décision ${c.nom}`, await admin.from('routeur_decisions').insert({
        eleve_id: registre.eleveId, cycle_lundi: c.cycle, exercice_id: ex.id,
        cible_retenue: COMPETENCE, regle_declenchee: 'R2',
        alternatives_ecartees: { recette: MARQUE }, sondes_retenues: [], bonus: c.bonus,
      }).select('id').single())
      decisionId = dec.id
      registre.decisions.push(dec.id)
      sauver()
    }

    const d = lu(`dépôt ${c.nom}`, await admin.from('exercices_depots').insert({
      eleve_id: registre.eleveId, exercice_id: ex.id,
      // ⛔ `origine` suit la décision : c'est l'invariant que le contrôle ③ garde.
      origine: c.routeur ? 'routeur' : 'prof',
      routeur_decision_id: decisionId,
      statut: c.statut,
      assigne_at: c.assigneAt ?? `${c.cycle}T12:00:00Z`,
      texte_v1: c.brouillon,
      texte_vf: c.vf ?? null,
      // ⚠️ `v1_remis_at` est LE discriminant du brouillon à l'écran : sans lui,
      //    « ton brouillon » deviendrait « ce que tu as rendu ».
      v1_remis_at: c.statut === 'ouvert' || c.statut === 'assigne' ? null : `${c.cycle}T15:00:00Z`,
      vf_remis_at: c.vf ? `${c.cycle}T18:00:00Z` : null,
    }).select('id').single())
    registre.depots.push(d.id)
    semes[c.nom] = { depotId: d.id, exerciceId: ex.id, decisionId, ...c }
    sauver()

    if (c.retour === 'publie') {
      const r = lu(`retour ${c.nom}`, await admin.from('exercices_retours').insert({
        depot_id: d.id, moment: 'chaud',
        texte: pointDeRetour('01', `${MARQUE} — ton troisième argument n’est pas relié à ta conclusion.`),
        action_revision: { texte: 'Relie ton troisième argument à ta conclusion, en une phrase.' },
        published_at: `${c.cycle}T16:00:00Z`,
      }).select('id').single())
      registre.retours.push(r.id)
      sauver()
    }
    note(`${c.nom.padEnd(22)} dépôt ${d.id.slice(0, 8)} · ${c.statut.padEnd(14)} · `
      + `${c.routeur ? (c.bonus ? 'routeur/BONUS' : 'routeur') : 'PROF (sans décision)'} · `
      + `assigne_at ${(c.assigneAt ?? `${c.cycle}T12:00:00Z`)}`)
  }

  // ── LE TÉMOIN DU BILAN : QUE du routeur, sur la semaine qui sera comptée ──
  note(`témoin du bilan : ${registre.temoinId.slice(0, 8)} — deux dépôts du ROUTEUR seulement`)
  const CAS_TEMOIN = [
    { nom: 't1-jamais-fait',  statut: 'assigne', retour: null },
    { nom: 't2-retour-nonlu', statut: 'retour_publie', retour: 'publie',
      brouillon: `${MARQUE} — la copie du témoin.` },
  ]
  for (const c of CAS_TEMOIN) {
    const ex = lu(`instance ${c.nom}`, await admin.from('exercices').insert({
      type_id: typeId, classe_id: registre.classeId, lieu: 'maison', statut: 'assigne', cran,
      consigne_instanciee: {
        texte: `${c.nom} — rédige un paragraphe argumenté sur la liberté, et justifie ta thèse.`,
        recette: `${MARQUE} — ${c.nom}`,
      },
      modes_par_competence: { [COMPETENCE]: ['composer'] },
    }).select('id').single())
    registre.exercices.push(ex.id); sauver()
    const dec = lu(`décision ${c.nom}`, await admin.from('routeur_decisions').insert({
      eleve_id: registre.temoinId, cycle_lundi: CYCLE_FERME, exercice_id: ex.id,
      cible_retenue: COMPETENCE, regle_declenchee: 'R2',
      alternatives_ecartees: { recette: MARQUE }, sondes_retenues: [], bonus: false,
    }).select('id').single())
    registre.decisions.push(dec.id); sauver()
    const d = lu(`dépôt ${c.nom}`, await admin.from('exercices_depots').insert({
      eleve_id: registre.temoinId, exercice_id: ex.id, origine: 'routeur',
      routeur_decision_id: dec.id, statut: c.statut,
      assigne_at: `${CYCLE_FERME}T12:00:00Z`,
      texte_v1: c.brouillon ?? null,
      v1_remis_at: c.statut === 'assigne' ? null : `${CYCLE_FERME}T15:00:00Z`,
    }).select('id').single())
    registre.depots.push(d.id)
    semes[c.nom] = { depotId: d.id, exerciceId: ex.id, decisionId: dec.id, ...c }
    sauver()
    if (c.retour === 'publie') {
      const r = lu(`retour ${c.nom}`, await admin.from('exercices_retours').insert({
        depot_id: d.id, moment: 'chaud',
        texte: pointDeRetour('02', `${MARQUE} — ton argument mérite un exemple.`),
        action_revision: { texte: 'Ajoute un exemple à ton argument.' },
        published_at: `${CYCLE_FERME}T16:00:00Z`,
      }).select('id').single())
      registre.retours.push(r.id); sauver()
    }
    note(`${c.nom.padEnd(22)} dépôt ${d.id.slice(0, 8)} · ${c.statut} · routeur`)
  }
  return semes
}

// ════════════════════════════════════════════════════════════════════════════
// ③ AVANT LA LIGNE — tout doit être OUVERT
// ════════════════════════════════════════════════════════════════════════════
async function avantLaLigne(semes) {
  titre('B. AVANT LE COMPTAGE — pas de ligne, donc rien n’est fermé')

  const { cycles, incident } = await cyclesComptesDeLEleve(registre.eleveId)
  dire(incident === null, '① le lecteur lit sans incident (service-role)', `incident : ${incident}`)
  dire(cycles !== null && !cycles.has(CYCLE_FERME),
    `① aucune ligne sur ${CYCLE_FERME} : le lecteur rend un ensemble SANS ce cycle`,
    `cycles comptés de cet élève : ${JSON.stringify([...(cycles ?? [])])}`)

  const liste = await exercicesMaisonDeLEleve(admin, registre.eleveId, registre.classeId)
  const miens = liste.filter((l) => registre.depots.includes(l.depotId))
  dire(miens.length > 0 && miens.every((l) => l.fermee === false),
    'AUCUN des dépôts semés n’est fermé tant que la ligne n’existe pas',
    `${miens.length} dépôt(s) vus, ${miens.filter((l) => l.fermee).length} fermé(s) — attendu 0`)

  const vue = await chargerLeDeroule(admin, semes['d1-assigne'].depotId, registre.eleveId,
    { ouvert: true, delaiVfJours: 3 })
  dire(vue !== null && vue.fermee === false,
    'le chargeur sert une vue PLEINE — `fermee = false`',
    `fermee = ${vue?.fermee}`)
}

// ════════════════════════════════════════════════════════════════════════════
// ④ LE CRON, POUR DE VRAI — c'est la couture ①
// ════════════════════════════════════════════════════════════════════════════
async function poserLaLigne() {
  titre(`C. LE VRAI ÉCRIVAIN — \`poserLaSemaineDAssiduite\` sur la semaine ${CYCLE_FERME}`)

  // ⛔⛔ LA SEMAINE EST NOMMÉE, ET C'EST UNE SEMAINE PASSÉE. Ce point d'entrée
  //    sait poser une semaine quelconque : l'appeler sur la semaine COURANTE
  //    fermerait la semaine courante et invaliderait toute la preuve.
  const bilan = await poserLaSemaineDAssiduite(admin, FUSEAU, CYCLE_OUVERT, CYCLE_FERME)
  note(`semaineDeTravail : ${bilan.semaineDeTravail} · motif : ${bilan.motif ?? '—'}`)
  note(`élèves attendus : ${bilan.elevesAttendus} · lignes posées : ${bilan.lignesPosees}`)
  if (bilan.erreurs?.length) note(`erreurs : ${JSON.stringify(bilan.erreurs)}`)

  const apres = lu('assiduité après', await admin.from('assiduite_hebdo')
    .select('eleve_id, cycle_lundi'))
  const avant = new Set(registre.assiduiteAvant)
  registre.assiduitePosee = apres.map(cle).filter((k) => !avant.has(k))
  sauver()
  note(`lignes NÉES de ce passage : ${registre.assiduitePosee.length} — ce sont les seules `
    + 'que `--retire` supprimera')

  dire(registre.assiduitePosee.some((k) => k === `${registre.eleveId}|${CYCLE_FERME}`),
    `① LA LIGNE (${CYCLE_FERME}) EXISTE POUR NOTRE ÉLÈVE — écrite par le VRAI cron`,
    'c’est le marqueur, et il n’y en a pas d’autre : aucun statut, aucune colonne')

  const { cycles } = await cyclesComptesDeLEleve(registre.eleveId)
  dire(cycles !== null && cycles.has(CYCLE_FERME),
    '① ET LE LECTEUR DU LOT LA VOIT — la couture « qui écrit → qui lit » tient',
    `cycles lus : ${JSON.stringify([...(cycles ?? [])])}`)
  dire(cycles !== null && !cycles.has(CYCLE_OUVERT),
    `① la semaine EN COURS (${CYCLE_OUVERT}) n’a PAS de ligne — elle n’en a jamais`,
    'le déclencheur ne compte que la semaine écoulée : la clause « la semaine courante '
    + 'reste ouverte » tombe du prédicat, sans garde à écrire')
  return cycles
}

// ════════════════════════════════════════════════════════════════════════════
// ⑤ APRÈS LA LIGNE — tout se ferme, et rien de plus que ce qui doit se fermer
// ════════════════════════════════════════════════════════════════════════════
async function apresLaLigne(semes, cycles) {
  titre('D. APRÈS LE COMPTAGE — la fermeture, et ses preuves NÉGATIVES')

  // ── ② LA DÉRIVATION, CONFRONTÉE À CELLE QUI COMPTE ────────────────────────
  const monCycle = toISODate(lundiDuCycle(new Date(DIMANCHE_SOIR), FUSEAU))
  const tri = comptesDeLaSemaine(
    [{ eleveId: registre.eleveId, assigneAt: DIMANCHE_SOIR, statut: 'assigne', bonus: false }],
    CYCLE_FERME, FUSEAU)
  dire(monCycle === CYCLE_FERME && tri.horsSemaine === 0,
    '② LE DÉPÔT DU DIMANCHE 20 h 30 — ma dérivation ET la collecte disent la MÊME semaine',
    `ma dérivation : ${monCycle} · la collecte le range hors-semaine : ${tri.horsSemaine} fois `
    + `(attendu ${CYCLE_FERME} et 0). Lu en UTC il serait tombé sur ${DIMANCHE_SOIR.slice(0, 10)}.`)

  // ── LA LISTE : les quatre surfaces suivent le producteur unique ───────────
  const liste = await exercicesMaisonDeLEleve(admin, registre.eleveId, registre.classeId)
  const parDepot = new Map(liste.map((l) => [l.depotId, l]))
  const vu = (nom) => parDepot.get(semes[nom].depotId)

  dire(vu('d1-assigne')?.fermee === true && vu('d1-assigne')?.etat.ton === 'ferme'
    && vu('d1-assigne')?.etat.libelle === 'fermé',
    'un `assigne` du routeur est FERMÉ, et il se lit « fermé »',
    `ton : ${vu('d1-assigne')?.etat.ton} · libellé : ${vu('d1-assigne')?.etat.libelle}`)
  dire(vu('d2-brouillon')?.etat.ton === 'ferme',
    'un `ouvert` avec brouillon est FERMÉ lui aussi', `ton : ${vu('d2-brouillon')?.etat.ton}`)
  dire(vu('d3-retour-nonlu')?.fermee === true && vu('d3-retour-nonlu')?.etat.ton === 'a_lire',
    '⛔⛔ UN RETOUR PUBLIÉ NON LU RESTE « à lire », MÊME FERMÉ — la lecture reste due',
    `fermee : ${vu('d3-retour-nonlu')?.fermee} · ton : ${vu('d3-retour-nonlu')?.etat.ton} `
    + '(l’obligation de lecture passe DEVANT — `06-` §2 temps 6)')
  dire(vu('d4-vf')?.fermee === true && vu('d4-vf')?.etat.ton === 'attente',
    'un `vf_remis` fermé reste `attente` — « rendu, retour en préparation » est vrai',
    `ton : ${vu('d4-vf')?.etat.ton} (« fermé sans retour » est à C9, pas à ce lot)`)
  dire(vu('d5-bonus')?.fermee === true && vu('d5-bonus')?.bonus === true,
    'un BONUS se ferme comme un imposé, par le même test, sans branche',
    `fermee : ${vu('d5-bonus')?.fermee} · bonus : ${vu('d5-bonus')?.bonus}`)

  // ── ③ LES DEUX PREUVES NÉGATIVES ─────────────────────────────────────────
  dire(vu('d6-voie-du-prof')?.fermee === false && vu('d6-voie-du-prof')?.etat.ton === 'a_faire',
    '③ UN DÉPÔT SANS DÉCISION DE ROUTEUR RESTE OUVERT — même élève, même cycle, ligne posée',
    `fermee : ${vu('d6-voie-du-prof')?.fermee} · ton : ${vu('d6-voie-du-prof')?.etat.ton} `
    + '(la voie du professeur est à C10-L2)')
  dire(vu('d7-semaine-en-cours')?.fermee === false,
    `un dépôt de la SEMAINE EN COURS (${CYCLE_OUVERT}) reste ouvert`,
    `fermee : ${vu('d7-semaine-en-cours')?.fermee}`)
  dire(vu('d8-dimanche-2030')?.fermee === true,
    '② le dépôt du DIMANCHE 20 h 30 est bien fermé — il appartient à la semaine comptée',
    `fermee : ${vu('d8-dimanche-2030')?.fermee}`)

  // ── ⛔⛔ LA RÉDUCTION : ce que l'élève ne doit pas voir NE PART PAS ────────
  const vue = await chargerLeDeroule(admin, semes['d2-brouillon'].depotId, registre.eleveId,
    { ouvert: true, delaiVfJours: 3 })
  dire(vue?.fermee === true, 'le chargeur sert une vue FERMÉE', `fermee : ${vue?.fermee}`)
  const charge = JSON.stringify(vue)
  const interdits = ['texteSupport', 'sujet', 'coTexte', 'cas', 'corrections', 'etalon',
    'demonstration', 'contenuDemonstration', 'guide', 'rappel', 'langue', 'verdictCalibration',
    'gestesRestants', 'competencesDeLaConfiance', 'fiche']
  const nonVides = interdits.filter((k) => {
    const v = vue?.[k]
    if (v === null || v === undefined) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'object') return Object.values(v).some((x) =>
      x !== null && x !== false && !(Array.isArray(x) && x.length === 0))
    return v !== '' && v !== false
  })
  dire(nonVides.length === 0,
    '⛔⛔ NI MATÉRIAU, NI CANDIDATS, NI ZONES, NI RÉPONSE ATTENDUE — ABSENTS de la charge',
    nonVides.length ? `champs encore pleins : ${nonVides.join(', ')}`
      : `${interdits.length} champs vérifiés vides ; charge servie : ${charge.length} octets`)
  dire(vue?.consigne?.length > 0 && vue?.texteV1 === semes['d2-brouillon'].brouillon,
    'MAIS la consigne et le BROUILLON survivent, tels quels — aucun texte n’est effacé',
    `consigne : ${vue?.consigne?.length} jeton(s) · brouillon : ${JSON.stringify(vue?.texteV1)}`)
  dire(vue?.v1RemiseLe === null,
    '`v1RemiseLe` survit, et c’est lui qui fait dire « ton brouillon » plutôt que « ta réponse »')
  dire(typeof vue?.regime === 'string' && vue.regime.length > 0,
    '⛔⛔ `regime` SURVIT — sans lui la lecture cesse de clore, et le bilan ne s’ouvre JAMAIS',
    `regime : ${vue?.regime}`)

  // ── LE MOMENT DE LA SEMAINE : le bilan, et ce qui le retient ─────────────
  const sem = await chargerLaSemaineDeLEleve(admin, registre.eleveId, [registre.classeId],
    CYCLE_FERME)
  note(`« Ma semaine » sur ${CYCLE_FERME} : moment = ${sem.moment} · frise ${sem.frise.faits}/`
    + `${sem.frise.total} · incidents : ${JSON.stringify(sem.incidents)}`)
  dire(sem.moment === 'recapitulatif',
    '⭐ LE BILAN DE CET ÉLÈVE RESTE RETENU — et c’est JUSTE : sa semaine porte un dépôt de la '
    + 'VOIE DU PROFESSEUR que ce lot ne ferme pas',
    'un exercice réellement ouvert retient légitimement le bilan. ⚠️ CONSÉQUENCE À DIRE : '
    + 'une semaine mêlant routeur et professeur ne verra son bilan qu’une fois le dépôt du '
    + 'professeur clos — c’est-à-dire une fois `C10-L2` joué. La preuve du bilan se fait donc '
    + 'sur le TÉMOIN, dont la semaine n’a que du routeur.')
  const fermesVus = sem.exercices.filter((e) => e.ton === 'ferme').length
  dire(fermesVus >= 3, `« Ma semaine » voit ${fermesVus} exercice(s) fermé(s) sans rendu`)
  dire(sem.frise.faits < sem.frise.total,
    '⛔⛔ LA FRISE NE COMPTE PAS UN FERMÉ COMME UN FAIT — « un décompte réel » (`06-` §5)',
    `${sem.frise.faits} sur ${sem.frise.total} : sans cette clause elle dirait `
    + `${sem.frise.total} sur ${sem.frise.total} sans que l’élève ait rien fait`)

  return sem
}

// ════════════════════════════════════════════════════════════════════════════
// ⑥ LA LECTURE — la seule porte de sortie, et c'est la couture ④
// ════════════════════════════════════════════════════════════════════════════
async function laLecture(semes) {
  titre('E. LA LECTURE DU RETOUR — la seule porte de sortie de l’exercice fermé')

  const depotId = semes['d3-retour-nonlu'].depotId
  const depot = await lireDepotMaison(admin, depotId, registre.eleveId)
  const vue = await chargerLeDeroule(admin, depotId, registre.eleveId,
    { ouvert: true, delaiVfJours: 3 })
  dire(vue?.fermee === true && vue?.retourChaud !== null,
    'la vue fermée PORTE le retour — c’est ce qui rend le bouton de lecture atteignable',
    `fermee : ${vue?.fermee} · retourChaud : ${vue?.retourChaud ? 'servi' : 'absent'}`)

  // ⛔⛔ C'EST L'ÉLÈVE QUI ÉCRIT CE STATUT, PAS CE LOT. `validerLaLecture` pose
  //    `statut = 'clos'` quand elle clôt le déroulé, et elle existait avant nous.
  //    La clause « aucun statut n'est écrit » parle de LA FERMETURE, pas des
  //    gestes qui restent permis.
  const issue = await validerLaLecture(admin, depot, 'chaud', vue.regime, new Date().toISOString())
  dire(issue?.ok !== false, 'la validation de lecture est ACCEPTÉE sur un exercice FERMÉ',
    `issue : ${JSON.stringify(issue).slice(0, 200)}`)

  const apres = lu('dépôt après lecture', await admin.from('exercices_depots')
    .select('statut').eq('id', depotId).single())
  const retour = lu('retour après lecture', await admin.from('exercices_retours')
    .select('lu_at').eq('depot_id', depotId).eq('moment', 'chaud').single())
  dire(retour.lu_at !== null, '④ `lu_at` EST POSÉ — le retour est lu', `lu_at : ${retour.lu_at}`)
  note(`statut du dépôt après lecture : ${apres.statut} (régime ${vue.regime})`)

}

// ⭐⭐⭐ L'ARBITRAGE DU LOT, ÉPROUVÉ SUR LE TÉMOIN — sa semaine n'a QUE du routeur :
//     un exercice jamais fait (fermé) et un retour publié NON LU.
async function leBilanDuTemoin(semes) {
  titre('E bis. LE TÉMOIN — le bilan s’ouvre sur les NON FAITS, mais pas sur un retour non lu')

  const avant = await chargerLaSemaineDeLEleve(admin, registre.temoinId, [registre.classeId],
    CYCLE_FERME)
  const tons = avant.exercices.map((e) => e.ton).sort()
  note(`sa semaine : ${avant.exercices.length} exercice(s), tons ${JSON.stringify(tons)}`)
  dire(tons.includes('ferme') && tons.includes('a_lire'),
    'le décor est bien celui qu’on veut : un FERMÉ jamais fait, et un retour publié NON LU')
  dire(avant.moment === 'recapitulatif',
    '⛔⛔ LE BILAN EST RETENU PAR LE RETOUR NON LU — `C6-L2` survit INTACTE',
    'la mission dit « le bilan s’ouvre même sur des exercices NON FAITS » : `a_faire` et '
    + '`en_cours`, jamais rendus. Un retour publié non lu n’est PAS un exercice non fait — '
    + 'c’est un exercice rendu, corrigé, dont l’élève n’a pas ouvert le retour. Les deux '
    + 'phrases tiennent. ⚠️ C’est l’arbitrage du lot, porté en tête du relevé : si Louis veut '
    + 'l’autre lecture, elle est à lui.')

  // ── LA PORTE DE SORTIE ───────────────────────────────────────────────────
  const depotId = semes['t2-retour-nonlu'].depotId
  const depot = await lireDepotMaison(admin, depotId, registre.temoinId)
  const vue = await chargerLeDeroule(admin, depotId, registre.temoinId,
    { ouvert: true, delaiVfJours: 3 })
  const issue = await validerLaLecture(admin, depot, 'chaud', vue.regime, new Date().toISOString())
  dire(issue?.ok !== false, 'la lecture est acceptée sur l’exercice fermé du témoin')

  const apres = await chargerLaSemaineDeLEleve(admin, registre.temoinId, [registre.classeId],
    CYCLE_FERME)
  dire(apres.moment === 'bilan',
    '④⭐⭐ ET LE BILAN S’OUVRE — malgré l’exercice JAMAIS FAIT de la semaine',
    `moment : ${avant.moment} → ${apres.moment} · frise ${apres.frise.faits}/`
    + `${apres.frise.total}`)
  dire(apres.manque.nonFaits > 0,
    '⭐ ET IL DIT COMBIEN N’ONT PAS ÉTÉ FAITS — « un vide s’explique »',
    `nonFaits : ${apres.manque.nonFaits} · copiesNonMesurees : `
    + `${apres.manque.copiesNonMesurees} — un exercice jamais rendu n’est PAS une copie qui `
    + 'attend sa correction, et le bilan ne les confond pas')
  dire(apres.frise.faits < apres.frise.total,
    '⭐ et la frise reste HONNÊTE — le fermé jamais fait n’y compte pas pour un fait',
    `${apres.frise.faits} sur ${apres.frise.total}`)
}

// ════════════════════════════════════════════════════════════════════════════
// ⑦ LE FAIL-OPEN — une lecture en ERREUR ne ferme rien
// ════════════════════════════════════════════════════════════════════════════
function leFailOpen() {
  titre('F. LES DEUX VIDES — et ils ne se confondent pas')
  const q = { assigneAt: `${CYCLE_FERME}T12:00:00Z`, routeurDecisionId: 'une-decision',
    fuseau: FUSEAU }
  dire(estFermee({ ...q, cyclesComptes: null }) === false,
    '⚠️ LECTURE EN ERREUR (`null`) : rien ne ferme — fermer sur une panne priverait un élève '
    + 'd’un travail qui compte encore')
  dire(estFermee({ ...q, cyclesComptes: new Set() }) === false,
    '⛔⛔ ENSEMBLE VIDE : ce n’est PAS une erreur — et c’est ce que rendrait une lecture faite '
    + 'avec le MAUVAIS client',
    '`assiduite_hebdo` n’a AUCUNE policy élève : lue depuis une session élève elle rend zéro '
    + 'ligne SANS erreur, et plus rien ne se fermerait jamais, en silence. Le fail-open protège '
    + 'd’une panne ; il ne protège PAS d’un mauvais client. ⚠️ Ce script a la clé de service en '
    + 'poche : SEUL LE SMOKE ÉLÈVE, par lien magique, peut prouver ce point-là.')
  dire(estFermee({ ...q, cyclesComptes: new Set([CYCLE_FERME]) }) === true,
    'et l’ensemble qui porte le cycle ferme, lui')
  dire(MESSAGE_SEMAINE_FERMEE
    === 'Il n’est plus possible de travailler sur les exercices de cette semaine. '
      + 'De nouveaux exercices t’attendent.',
    'le message servi est celui de Louis, mot pour mot')
  dire(typeof vueFermee === 'function', 'la réduction est un module pur, éprouvé par `npm test`')
}

// ════════════════════════════════════════════════════════════════════════════
// ⑧ LE RETRAIT — par la MARQUE et par IDENTITÉ, jamais par table
// ════════════════════════════════════════════════════════════════════════════
async function retire() {
  titre('G. LE RETRAIT — la base rendue à son état d’entrée, et VÉRIFIÉE')
  const r = fs.existsSync(REGISTRE)
    ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
    : { exercices: [], depots: [], decisions: [], retours: [], assiduitePosee: [] }
  if (!fs.existsSync(REGISTRE)) {
    note('aucun registre — on balaie tout de même PAR LA MARQUE.')
  }

  // ⭐ LE BALAI PAR LA MARQUE, même sans registre : les instances portent la
  //    marque dans leur consigne, et leurs dépôts tombent par cascade
  //    (`exercices_depots_exercice_id_fkey ON DELETE CASCADE`).
  const parLaMarque = lu('instances marquées', await admin.from('exercices')
    .select('id, consigne_instanciee')
    .ilike('consigne_instanciee->>recette', `${MARQUE}%`))
  const instances = [...new Set([...r.exercices, ...parLaMarque.map((x) => x.id)])]

  // ⛔ L'ORDRE : les enfants d'abord.
  if (r.retours.length) {
    lu('suppr retours', await admin.from('exercices_retours').delete().in('id', r.retours).select('id'))
  }
  if (instances.length) {
    const dep = lu('dépôts des instances', await admin.from('exercices_depots')
      .select('id').in('exercice_id', instances))
    if (dep.length) {
      lu('suppr retours des dépôts', await admin.from('exercices_retours')
        .delete().in('depot_id', dep.map((d) => d.id)).select('id'))
      lu('suppr dépôts', await admin.from('exercices_depots')
        .delete().in('id', dep.map((d) => d.id)).select('id'))
    }
    lu('suppr décisions', await admin.from('routeur_decisions')
      .delete().in('exercice_id', instances).select('id'))
    lu('suppr instances', await admin.from('exercices').delete().in('id', instances).select('id'))
    note(`${instances.length} instance(s) retirée(s), avec leurs dépôts et leurs décisions`)
  }

  // ⛔⛔ L'ASSIDUITÉ SE RETIRE PAR IDENTITÉ. Un `delete()` sur la table emporterait
  //    le décor d'une autre séance — c'est exactement ce que font
  //    `essai-cron-hebdo.ts --retire` et `routeur-c4l12.mjs --retire`.
  let retirees = 0
  for (const k of r.assiduitePosee ?? []) {
    const [eleveId, cycle] = k.split('|')
    const { error } = await admin.from('assiduite_hebdo')
      .delete().eq('eleve_id', eleveId).eq('cycle_lundi', cycle)
    if (error) console.error(`  ⛔ ligne non retirée (${k}) : ${error.message}`)
    else retirees++
  }
  note(`assiduite_hebdo : ${retirees} ligne(s) retirée(s) PAR IDENTITÉ (élève × cycle), `
    + 'aucune autre touchée')

  // ── LA VÉRIFICATION, PAR REQUÊTE ─────────────────────────────────────────
  const resteInst = lu('reste instances', await admin.from('exercices')
    .select('id').ilike('consigne_instanciee->>recette', `${MARQUE}%`))
  const assi = lu('assiduité', await admin.from('assiduite_hebdo').select('eleve_id, cycle_lundi'))
  const cles = new Set(assi.map(cle))
  const survivantes = (r.assiduitePosee ?? []).filter((k) => cles.has(k))
  dire(resteInst.length === 0, 'aucune instance marquée ne survit',
    `restantes : ${resteInst.length}`)
  dire(survivantes.length === 0, 'aucune ligne d’assiduité semée ne survit',
    `restantes : ${survivantes.length}`)
  dire(assi.length === (r.assiduiteAvant?.length ?? assi.length),
    'assiduite_hebdo est rendue à son cardinal d’entrée',
    `${assi.length} ligne(s) (avant : ${r.assiduiteAvant?.length ?? '—'})`)

  if (fs.existsSync(REGISTRE)) { fs.unlinkSync(REGISTRE); console.log('  ✅ registre retiré.') }
}

// ════════════════════════════════════════════════════════════════════════════
async function essai() {
  if (fs.existsSync(REGISTRE)) {
    throw new Error(`un essai est déjà en cours (${REGISTRE}). \`--retire\` d'abord.`)
  }
  await constat()
  const semes = await semer()
  try {
    await avantLaLigne(semes)
    const cycles = await poserLaLigne()
    await apresLaLigne(semes, cycles)
    await laLecture(semes)
    await leBilanDuTemoin(semes)
    leFailOpen()
  } finally {
    titre(`BILAN — ${ok} contrôle(s) tenu(s), ${ko} en échec`)
    if (arg('garde-le-decor')) {
      console.log(`\n⚠️ DÉCOR GARDÉ (\`--garde-le-decor\`). Élève ${registre.eleveId} — `
        + `\`--retire\` pour rendre la base.`)
    } else {
      await retire()
    }
  }
  if (ko > 0) process.exit(1)
}

const mode = arg('essai') ? essai : arg('retire') ? retire : constat
mode().catch((e) => { console.error(`\n⛔ ${e.stack ?? e.message}`); process.exit(1) })
