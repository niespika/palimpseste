// ============================================================================
// COUTURE C6 · L3 — CE QUE L'ÉLÈVE **DEMANDE** LUI REVIENT-IL COMME UN EXERCICE
//                   NORMAL — ET LE DISPOSITIF SAIT-IL ENSUITE QUE C'EST LUI QUI
//                   L'A DEMANDÉ ? Éprouvé par EXÉCUTION, jamais par lecture.
// ----------------------------------------------------------------------------
// ⭐⭐ CINQ CANAUX À NOMMER, ET QUATRE ÉTAIENT COUPÉS AU 28/08 :
//
//   ① `C4-L2` → `profiles.budget_optionnel_min`  → un consommateur   ⛔ coupé
//   ② le pull → `exercices_depots` + `routeur_decisions` → le déroulé ⛔ coupé
//   ③ le pull → la marque `bonus` → `competences_mesures.bonus`      ⚠️ mi-passé
//   ④ `exercicesMaisonDeLEleve` → `friseDeLaSemaine`                 ⚠️ ne distinguait pas
//   ⑤ le push (une lecture) → la liste des tuiles d'`app/eleve/page` ⛔ coupé
//
// ⛔ PAS DE LECTURE DE CODE EN GUISE DE PREUVE. Ce script APPELLE ce que les
//    écrans appellent — `servirUnExerciceDePlus`, `lireLeQuotaDuCycle`,
//    `chargerLaSemaineDeLEleve`, `signalDuPush`, `lireContexte`, `ecrireMesure`,
//    `comptesDeLaSemaine` — puis il CONSTATE EN BASE, par requête.
//
// ⛔ AUCUN APPEL DE MODÈLE N'EST PAYÉ : tout le décor se sème en base.
//    ⚠️ Un seul maillon reste donc non exercé, et il est nommé au §I : la ligne
//       `bonus: ctx.bonus` de `chaine.ts`, qui vit à l'intérieur d'un étage à
//       deux appels froids. Ce script la REPRODUIT à l'identique autour du VRAI
//       `lireContexte` et du VRAI `ecrireMesure` — les deux bouts qu'elle relie.
//
// ⚠️ LA BASE EST LA SANDBOX, ET DES ÉLÈVES RÉELS Y TRAVAILLENT. Ce script ne
//    touche QUE ce qu'il a semé. ⭐ Chaque ligne semée porte LA MARQUE EN BASE,
//    le registre s'écrit À CHAQUE ÉCRITURE, et `--retire` BALAIE PAR LA MARQUE
//    même sans registre — c'est la parade que `C6-L2` a payée en laissant onze
//    mesures orphelines (un `| head` en SIGPIPE, une contrainte).
//
// ⚠️⚠️ IL EMPRUNTE DEUX CHOSES, ET IL LES REPOSE :
//    · la `lettre` et `profil_provisoire` de `competences_niveaux` pour la
//      compétence semée — R0 exige « `evaluee` ET une lettre », et le bac à sable
//      porte 102 niveaux dont la lettre est NULLE ;
//    · `exercices_actif`, LE TEMPS D'UN APPEL, pour éprouver la porte fermée.
//      ⛔ « Une recette qui remet un interrupteur en écrivant une constante ne
//      le remet pas : elle l'impose » — la valeur trouvée est écrite au registre
//      AVANT la bascule, et remise par le registre, y compris sur interruption.
//    ⛔ Aucun autre interrupteur n'est touché, et aucun n'est ouvert.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c6l3.mjs [--garde-le-decor]
//   node … scripts/recette/couture-c6l3.mjs --decor-ecran
//   node … scripts/recette/couture-c6l3.mjs --retire
// ============================================================================

import { register } from 'node:module'

// ── La cale de résolution des sous-chemins `next/…` (patron de C4-L3) ───────
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
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.cwd()

// ── CE QUE LES DEUX CANAUX APPELLENT, ET RIEN D'AUTRE ──────────────────────
const { servirUnExerciceDePlus, lireLeQuotaDuCycle } =
  await import(`${RACINE}/utils/moteur/bonus-serveur.ts`)
const { signalDuPush } = await import(`${RACINE}/utils/eleve/bonus-serveur.ts`)
const { chargerLaSemaineDeLEleve } = await import(`${RACINE}/utils/eleve/semaine-serveur.ts`)
const { poserLesSemainesDuRouteur } = await import(`${RACINE}/utils/moteur/cycle-serveur.ts`)
const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { ecrireMesure } = await import(`${RACINE}/utils/chaine/mesures.ts`)
const { comptesDeLaSemaine } = await import(`${RACINE}/utils/assiduite/collecte.ts`)
const { lundiDuCycle } = await import(`${RACINE}/utils/deroule/echeance.ts`)
const { lireLesSegments, segmentDuCycle } =
  await import(`${RACINE}/utils/moteur/calendrier-serveur.ts`)
const { toISODate } = await import(`${RACINE}/utils/calendrier-grille.ts`)
// ⛔ Les constantes se LISENT de C4-L2 : un script qui écrirait 3 ou 5 en dur ne
//    contrôlerait plus rien le jour où elles changent.
const { CYCLES_DU_PLANCHER_DE_MESURE, RELIQUAT_PERDU_MIN } =
  await import(`${RACINE}/utils/routeur/config.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'COUTURE-C6L3'
const REGISTRE = '.couture-c6l3.json'
const a = (n) => process.argv.includes(`--${n}`)
const GARDE_LE_DECOR = a('garde-le-decor')

const FUSEAU = 'America/Toronto'
const COMPETENCE = 'argumentation'
/**
 * ⚠️⚠️ LE CYCLE NE SE SUPPOSE PAS : IL SE CHERCHE.
 *   · le **SEGMENT 1 EST HORS ROUTAGE** — « il sert les deux examens
 *     diagnostiques imposés en classe » (`01-` §4) —, et le bac à sable démarre
 *     son Semestre 1 le 2026-08-24 : la semaine COURANTE y est donc au segment 1,
 *     où le moteur ne pose rien ;
 *   · et il faut **deux élèves SANS aucun dépôt sur ce cycle**, sans quoi le
 *     pull compterait des exercices réels dans son quota (PB5) — « un décor posé
 *     sur une donnée réelle qu'il ne compte pas ne prouve rien ».
 * ⛔ Le cycle retenu est donc CHERCHÉ, et il est DIT. Un cycle écrit en dur ici
 *    aurait péri au premier changement de calendrier.
 */
let CYCLE = toISODate(lundiDuCycle(new Date(), FUSEAU))

let ok = 0
let ko = 0
const dire = (bon, texte, detail = '') => {
  if (bon) ok++; else ko++
  console.log(`${bon ? '✓' : '✗'} ${texte}${detail ? `\n     ${detail}` : ''}`)
}
const note = (t) => console.log(`  · ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

/** supabase-js NE LÈVE PAS : il rend `{ error }`. Ici, on lève. */
function lu(ou, { data, error }) {
  if (error) throw new Error(`${ou} — ${error.code ?? ''} ${error.message}`)
  return data
}

// ════════════════════════════════════════════════════════════════════════════
// LE REGISTRE — écrit À CHAQUE ÉCRITURE, jamais à la fin
// ════════════════════════════════════════════════════════════════════════════
// ⛔⛔ « UN DÉCOR QU'ON NE SAIT RETROUVER QUE PAR UN FICHIER LOCAL N'EST PAS
//    RETIRABLE. » Deux runs de `C6-L2` ont laissé onze mesures orphelines —
//    l'un tué par un `| head` (SIGPIPE) AVANT le retrait, l'autre interrompu par
//    une contrainte AVANT que le registre ne soit écrit. On écrit donc le
//    registre à chaque insert, et `--retire` balaie PAR LA MARQUE même sans lui.
const registre = {
  cycle: CYCLE, eleveId: null, autreEleveId: null, classeId: null,
  exercices: [], depots: [], mesures: [], decisions: [],
  niveau: null, porteAvant: null,
}
const sauver = () => fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

/**
 * ⭐⭐ LA PORTE SE REMET MÊME SUR INTERRUPTION. Le patron est celui de
 *    `lecture-c5l2.mjs` : on MÉMORISE ce qu'on a trouvé, et on Y REVIENT —
 *    interruption comprise. ⛔ On ne réécrit jamais une constante « vraie » :
 *    on repose exactement la valeur relevée, `null` compris.
 */
async function remettreLaPorte() {
  if (registre.porteAvant === null || registre.porteAvant === undefined) return
  const { error } = await admin.from('scriptorium_params')
    .update({ exercices_actif: registre.porteAvant }).eq('id', 1)
  if (error) console.error(`⚠️⚠️ PORTE NON REMISE (${registre.porteAvant}) : ${error.message}`)
  else note(`porte remise TELLE QUE TROUVÉE : exercices_actif = ${registre.porteAvant}`)
  registre.porteAvant = null
  sauver()
}
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => { await remettreLaPorte(); process.exit(130) })
}
process.on('uncaughtException', async (e) => {
  console.error(e)
  await remettreLaPorte()
  process.exit(1)
})

// ════════════════════════════════════════════════════════════════════════════
// A. LE POINT DE DÉPART — mesuré, jamais recopié
// ════════════════════════════════════════════════════════════════════════════
async function pointDeDepart() {
  titre('A. Le point de départ — l’allumage et la marque, PAR REQUÊTE')

  const p = lu('interrupteurs', await admin.from('scriptorium_params')
    .select('exercices_actif, routeur_actif, chaine_actif, fabrique_actif, '
      + 'competences_affichage_actif, passation_classe_actif').eq('id', 1).maybeSingle())
  note(`interrupteurs trouvés : ${Object.entries(p).map(([k, v]) => `${k}=${v}`).join(' · ')}`)
  dire(p.exercices_actif === true,
    '⭐ `exercices_actif` — LA PORTE DE CE LOT — est OUVERTE', 'mesurée, pas recopiée')

  const marques = lu('marques', await admin.from('routeur_decisions')
    .select('id', { count: 'exact', head: true }).eq('bonus', true))
  const nbMarques = lu('compte', await admin.from('routeur_decisions')
    .select('id').eq('bonus', true))
  const nbMesures = lu('mesures marquées', await admin.from('competences_mesures')
    .select('id').eq('bonus', true))
  note(`état de la marque AVANT : ${nbMarques.length} décision(s) · ${nbMesures.length} mesure(s)`)
  void marques

  registre.porteAvant = null
  sauver()
  return { nbMarquesAvant: nbMarques.length, nbMesuresAvant: nbMesures.length }
}

// ════════════════════════════════════════════════════════════════════════════
// B. LE DÉCOR
// ════════════════════════════════════════════════════════════════════════════
async function semer() {
  titre('B. Le décor — un élève SANS dépôt du cycle, un vivier servable, une lettre')

  // ⛔ LE PIÈGE DE LA VACUITÉ : sans `type_pedagogique`, aucun budget, donc
  //    aucun quota — et le pull refuserait pour la bonne raison, sans rien
  //    prouver du reste.
  const classes = lu('classes', await admin.from('classes')
    .select('id, nom, type_pedagogique').eq('statut', 'active')
    .not('type_pedagogique', 'is', null))
  if (!classes.length) {
    throw new Error('aucune classe active ne porte de `type_pedagogique` : le piège de la '
      + 'vacuité interdit de servir qui que ce soit. Condition de reprise : renseigner un parcours.')
  }
  const classe = classes[0]
  registre.classeId = classe.id

  const inscr = lu('inscriptions', await admin.from('inscriptions')
    .select('eleve_id').eq('classe_id', classe.id).eq('statut', 'active').order('eleve_id'))
  const candidats = [...new Set(inscr.map((i) => i.eleve_id))]
  if (candidats.length < 2) {
    throw new Error(`la classe ${classe.nom} porte moins de 2 élèves actifs : la preuve « la même `
      + 'instance, imposée à un AUTRE élève, reste `bonus = false` » demande deux comptes.')
  }

  // ⛔⛔ ON CHERCHE UN CYCLE **AU SEGMENT ≥ 2** OÙ DEUX ÉLÈVES SONT SANS DÉPÔT.
  //    Deux raisons, et aucune n'est un confort :
  //    · le SEGMENT 1 EST HORS ROUTAGE, et le moteur n'y pose rien ;
  //    · un élève qui porte déjà un dépôt du cycle fausserait le quota — le pull
  //      COMPTE les exercices posés (PB5) et les minutes servies. « Un décor posé
  //      sur une donnée réelle qu'il ne compte pas ne prouve rien. »
  const tousDepots = lu('dépôts', await admin.from('exercices_depots')
    .select('eleve_id, assigne_at').in('eleve_id', candidats))
  const cycleDe = (d) => (d.assigne_at
    ? toISODate(lundiDuCycle(new Date(d.assigne_at), FUSEAU)) : null)
  const occupesParCycle = new Map()
  for (const d of tousDepots) {
    const c = cycleDe(d)
    if (!c) continue
    occupesParCycle.set(c, (occupesParCycle.get(c) ?? new Set()).add(d.eleve_id))
  }

  const decoupe = await lireLesSegments(admin)
  const candidatsDeCycle = decoupe.segments
    .filter((sg) => sg.segment >= 2)
    .flatMap((sg) => sg.semaines.map((w) => w.dateDebutLundi))
    .sort()
  let libres = null
  for (const c of candidatsDeCycle) {
    const pris = occupesParCycle.get(c) ?? new Set()
    const l = candidats.filter((e) => !pris.has(e))
    if (l.length >= 2) { CYCLE = c; registre.cycle = c; libres = l; break }
  }
  if (!libres) {
    throw new Error('aucun cycle au segment ≥ 2 ne laisse 2 élèves sans dépôt. Condition de '
      + 'reprise : jouer sur une classe dont les élèves n’ont pas encore de semaine posée, ou '
      + 'compter l’existant plutôt que le supposer nul.')
  }
  const sg = segmentDuCycle(decoupe, CYCLE)
  note(`⭐ CYCLE CHERCHÉ, PAS SUPPOSÉ : ${CYCLE} (segment ${sg.segment}) — la semaine courante `
    + `(${toISODate(lundiDuCycle(new Date(), FUSEAU))}) est au segment `
    + `${segmentDuCycle(decoupe, toISODate(lundiDuCycle(new Date(), FUSEAU))).segment ?? '—'}`)
  const [eleveId, autreEleveId] = libres
  const occupes = occupesParCycle.get(CYCLE) ?? new Set()
  registre.eleveId = eleveId
  registre.autreEleveId = autreEleveId
  sauver()

  const nom = lu('profil', await admin.from('profiles')
    .select('display_name').eq('id', eleveId).maybeSingle())?.display_name ?? eleveId
  note(`classe « ${classe.nom} » (${classe.type_pedagogique}) · cycle du ${CYCLE}`)
  note(`élève RÉEL : ${nom} — AUCUN dépôt sur ce cycle (${occupes.size} élève(s) écartés)`)
  note(`second élève (pour la preuve NÉGATIVE de la marque) : ${autreEleveId.slice(0, 8)}`)

  // ── Le budget : sa VALEUR n'est pas de ce lot, on la LIT ──────────────────
  const profilBudget = lu('budget', await admin.from('profiles')
    .select('budget_optionnel_min').eq('id', eleveId).maybeSingle())
  note('⑴ profiles.budget_optionnel_min = '
    + (profilBudget?.budget_optionnel_min ?? 'null (défaut de situation : 30 min)'))

  // ── Un matériau SERVABLE : `cours_etat = generique` ───────────────────────
  const sujet = lu('sujet', await admin.from('exercices_sujets')
    .select('id').eq('cours_etat', 'generique').eq('statut', 'valide')
    .eq('bloque', false).limit(1).maybeSingle())
  if (!sujet) {
    throw new Error('aucun sujet `generique` validé : le filtre du cours vu écarte TOUT, et le '
      + 'vivier serait vide pour une raison qui n’est pas celle qu’on éprouve.')
  }

  // ── Les instances : assez pour une semaine ET plusieurs bonus ─────────────
  // ⚠️ LE CRAN EST OBLIGATOIRE et il porte LE NUMÉRO ; la DURÉE se dérive du
  //    couple (type × cran) à la doctrine — elle ne se saisit jamais à la main.
  const type = lu('type', await admin.from('exercices_types')
    .select('id, code').eq('code', 'argument').maybeSingle())
  if (!type) throw new Error('type `argument` absent de la doctrine.')
  const crans = lu('crans du type', await admin.from('exercices_types_crans')
    .select('cran, duree_exercice_min').eq('type_id', type.id).order('cran'))
  if (!crans.length) throw new Error(`aucun cran déclaré pour le type ${type.code}.`)
  note(`durées dérivées (type ${type.code}) : `
    + crans.map((c) => `cran ${c.cran} = ${c.duree_exercice_min} min`).join(' · '))

  // Douze instances : de quoi remplir un plafond de 60 min ET un quota de 30.
  const aSemer = Array.from({ length: 12 }, (_, i) => {
    const c = crans[i % crans.length]
    return {
      type_id: type.id, classe_id: classe.id, lieu: 'maison', statut: 'concu', cran: c.cran,
      consigne_instanciee: { recette: `${MARQUE} — instance ${i + 1}` },
      modes_par_competence: { [COMPETENCE]: ['composer'] },
      materiau_source_sujet_id: sujet.id,
    }
  })
  const instances = lu('semis d’instances',
    await admin.from('exercices').insert(aSemer).select('id, cran'))
  registre.exercices.push(...instances.map((x) => x.id))
  sauver()
  dire(instances.length === 12, '⭐ douze instances SERVABLES semées (matériau `generique`)',
    `crans : ${[...new Set(instances.map((i) => i.cran))].join(', ')}`)

  // ── La lettre : R0 exige « `evaluee` ET une lettre » ─────────────────────
  // ⚠️ Le bac à sable porte 102 niveaux dont la lettre est NULLE. Sans elle, la
  //    liste de priorité sort vide et le pull refuse pour `liste_vide` — un vrai
  //    refus, mais pas celui qu'on éprouve ici.
  const niveauAvant = lu('niveau', await admin.from('competences_niveaux')
    .select('lettre, lettre_initiale, profil_provisoire')
    .eq('eleve_id', eleveId).eq('competence', COMPETENCE).maybeSingle())
  registre.niveau = { existait: !!niveauAvant, avant: niveauAvant ?? null }
  sauver()
  const posee = { eleve_id: eleveId, competence: COMPETENCE, lettre: 'D',
    lettre_initiale: 'D', profil_provisoire: false }
  if (niveauAvant) {
    lu('lettre', await admin.from('competences_niveaux')
      .update({ lettre: 'D', lettre_initiale: 'D', profil_provisoire: false })
      .eq('eleve_id', eleveId).eq('competence', COMPETENCE))
  } else {
    lu('lettre', await admin.from('competences_niveaux').insert(posee))
  }
  note(`lettre EMPRUNTÉE : ${COMPETENCE} passe à D (avant : `
    + `${niveauAvant?.lettre ?? 'null'}, provisoire ${niveauAvant?.profil_provisoire ?? 'n/a'})`)

  return { classe, eleveId, autreEleveId }
}

// ════════════════════════════════════════════════════════════════════════════
// C. LA SEMAINE — posée par le VRAI moteur, jamais simulée
// ════════════════════════════════════════════════════════════════════════════
async function poserLaSemaine(eleveId) {
  titre('C. La semaine — posée par `poserLesSemainesDuRouteur`, le vrai moteur')

  const bilan = await poserLesSemainesDuRouteur(admin, FUSEAU, CYCLE,
    { cycleDemande: CYCLE, elevesDemandes: [eleveId] })
  if (bilan.erreurs.length) for (const e of bilan.erreurs.slice(0, 5)) note(`⚠️ ${e}`)
  dire(bilan.exercicesPoses > 0,
    '⭐ le moteur pose la semaine de cet élève', `${bilan.exercicesPoses} exercice(s) · `
    + `${bilan.decisionsEcrites} décision(s) · ${bilan.depotsPoses} dépôt(s) · `
    + `${bilan.sondesPosees} sonde(s) · segment ${bilan.segment}`)
  if (bilan.exercicesPoses === 0) {
    throw new Error(`la semaine est vide (motif : ${bilan.motif ?? 'aucun'}) — le décor ne tient `
      + 'pas, et le pull n’aurait rien à reprendre.')
  }

  const dec = lu('décisions du cycle', await admin.from('routeur_decisions')
    .select('id, exercice_id, bonus').eq('eleve_id', eleveId).eq('cycle_lundi', CYCLE))
  registre.decisions.push(...dec.map((d) => d.id))
  const dep = lu('dépôts du cycle', await admin.from('exercices_depots')
    .select('id, exercice_id').eq('eleve_id', eleveId)
    .in('exercice_id', dec.map((d) => d.exercice_id)))
  registre.depots.push(...dep.map((d) => d.id))
  sauver()

  dire(dec.every((d) => d.bonus === false),
    '⛔ AUCUNE décision de la semaine n’est marquée `bonus` — l’imposé reste imposé',
    `${dec.length} décision(s), toutes à false`)
  return { bilan, decisionsSemaine: dec, depotsSemaine: dep }
}

// ════════════════════════════════════════════════════════════════════════════
// D. LE PULL — « il le REÇOIT », et ça se prouve PAR LE DÉPÔT
// ════════════════════════════════════════════════════════════════════════════
async function leCanalDeuxEtTrois(eleveId, decisionsSemaine) {
  titre('D. ② LE PULL → `exercices_depots` + `routeur_decisions` → le déroulé')

  const quotaAvant = await lireLeQuotaDuCycle(admin, eleveId, CYCLE)
  dire(quotaAvant && quotaAvant.consomme === 0,
    '⭐ ① le quota du cycle se LIT, et il est intact',
    `optionnel ${quotaAvant?.optionnel} min · consommé ${quotaAvant?.consomme} · `
    + `restant ${quotaAvant?.restant}`)

  const avant = lu('dépôts avant', await admin.from('exercices_depots')
    .select('id').eq('eleve_id', eleveId))
  const r = await servirUnExerciceDePlus(admin, eleveId, CYCLE, FUSEAU, CYCLE)
  if (r.incidents.length) for (const i of r.incidents.slice(0, 5)) note(`⚠️ ${i}`)
  dire(!!r.servi, '⭐⭐ LE PULL SERT UN EXERCICE', r.servi
    ? `dépôt ${r.servi.depotId.slice(0, 8)} · cible ${r.servi.competence} · ${r.servi.dureeMin} min`
    : `refusé : ${r.motif} — « ${r.phrase} »`)
  if (!r.servi) throw new Error('le pull n’a rien servi : la suite n’a plus d’objet.')

  registre.depots.push(r.servi.depotId)
  registre.decisions.push(r.servi.decisionId)
  sauver()

  // ⛔⛔ « IL LE REÇOIT » SE PROUVE PAR LE DÉPÔT, JAMAIS PAR UN MESSAGE DE SUCCÈS.
  const apres = lu('dépôts après', await admin.from('exercices_depots')
    .select('id, exercice_id, origine, statut, assigne_at, echeance, routeur_decision_id')
    .eq('eleve_id', eleveId))
  const neuf = apres.find((d) => !avant.some((x) => x.id === d.id))
  dire(!!neuf && apres.length === avant.length + 1,
    '⭐⭐ UNE LIGNE NEUVE EXISTE EN BASE — pas un message, une ligne',
    `${avant.length} → ${apres.length} dépôt(s)`)
  dire(neuf?.origine === 'routeur',
    '⛔ `origine = routeur` — DEMANDÉ par l’élève, DÉCIDÉ par le routeur',
    'le `CHECK` n’a que deux valeurs, et le bonus n’en demande pas une troisième')
  dire(neuf?.statut === 'assigne',
    '⭐ le dépôt s’ouvre au premier temps du déroulé à six temps', `statut ${neuf?.statut}`)
  dire(neuf?.routeur_decision_id === r.servi.decisionId,
    '⭐ « un dépôt, une décision » — le lien est écrit')

  // ⛔⛔ `assigne_at` SE POSE, IL NE SE LAISSE PAS AU DÉFAUT.
  const attendu = `${CYCLE}T12:00:00`
  dire(!!neuf?.assigne_at && neuf.assigne_at.startsWith(attendu.slice(0, 13)),
    '⛔⛔ `assigne_at` EST ANCRÉ À MIDI UTC DU LUNDI DU CYCLE, pas à l’instant du clic',
    `posé : ${neuf?.assigne_at} · attendu : ${attendu}Z — « à minuit UTC, un lundi UTC est `
    + 'encore le DIMANCHE à Toronto »')

  titre('D bis. ③ LA MARQUE — posée au JOURNAL, et relue')
  const dJ = lu('décision du bonus', await admin.from('routeur_decisions')
    .select('*').eq('id', r.servi.decisionId).maybeSingle())
  dire(dJ?.bonus === true,
    '⭐⭐ `routeur_decisions.bonus = true` — LA MARQUE EST POSÉE, ET AU JOURNAL')

  // ── La ligne, champ par champ, À CÔTÉ d’une ligne de semaine ordinaire ────
  const dS = lu('décision de semaine', await admin.from('routeur_decisions')
    .select('*').eq('id', decisionsSemaine[0].id).maybeSingle())
  console.log('\n  ── La ligne du BONUS, à côté d’une ligne de SEMAINE ──')
  for (const cle of ['cycle_lundi', 'cible_retenue', 'regle_declenchee', 'bonus', 'degrade',
    'borne_amont', 'sondes_retenues', 'propositions_iso_duree', 'choix_eleve',
    'tirage_aleatoire', 'etat_escalade']) {
    const court = (v) => {
      const s = JSON.stringify(v)
      return s === undefined ? 'undefined' : s.length > 58 ? `${s.slice(0, 55)}…` : s
    }
    console.log(`     ${cle.padEnd(24)} semaine=${court(dS?.[cle]).padEnd(60)} bonus=${court(dJ?.[cle])}`)
  }

  dire(dJ?.cible_retenue !== null && !!dJ?.regle_declenchee,
    '⭐ « SERVI PAR LES MÊMES RÈGLES » : le bonus porte SA CIBLE et SA RÈGLE',
    `cible ${dJ?.cible_retenue} · règle ${dJ?.regle_declenchee}`)
  dire(Array.isArray(dJ?.tirage_aleatoire) && dJ.tirage_aleatoire.length > 0,
    '⛔ `01-` §11 point 5 — LE TIRAGE EST JOURNALISÉ, comme pour la semaine',
    `${dJ?.tirage_aleatoire?.length ?? 0} départage(s) consigné(s)`)

  // ⛔⛔ AUCUNE SONDE SECONDAIRE SUR UN BONUS.
  const sondes = Array.isArray(dJ?.sondes_retenues) ? dJ.sondes_retenues : []
  const secondaires = sondes.filter((s) => s?.sonde_montee !== true)
  dire(secondaires.length === 0,
    '⛔⛔ AUCUNE SONDE SECONDAIRE — « la phase C a placé les siennes à la construction, '
    + 'QUAND IL N’EXISTAIT PAS »',
    `${sondes.length} sonde(s) au total, dont ${sondes.length - secondaires.length} de MONTÉE `
    + '(elles, elles restent : elles vivent sur l’exercice)')

  return { premierBonus: r.servi, depotBonus: neuf }
}

// ════════════════════════════════════════════════════════════════════════════
// E. L'ABUS — « jamais au-delà » se prouve par l'ABUS, pas par l'usage
// ════════════════════════════════════════════════════════════════════════════
async function lAbus(eleveId) {
  titre('E. L’abus — deux fois de suite, puis jusqu’à épuisement, puis UNE FOIS DE TROP')

  const q0 = await lireLeQuotaDuCycle(admin, eleveId, CYCLE)
  note(`quota après le premier bonus : ${q0.consomme}/${q0.optionnel} min consommées, `
    + `${q0.restant} restantes`)

  const servis = []
  let dernier = null
  for (let i = 0; i < 12; i++) {
    const r = await servirUnExerciceDePlus(admin, eleveId, CYCLE, FUSEAU, CYCLE)
    dernier = r
    if (!r.servi) break
    servis.push(r.servi)
    registre.depots.push(r.servi.depotId)
    registre.decisions.push(r.servi.decisionId)
    sauver()
  }
  note(`${servis.length} bonus de plus servis avant l’arrêt`)

  const q1 = await lireLeQuotaDuCycle(admin, eleveId, CYCLE)
  dire(q1.consomme <= q1.optionnel,
    '⛔⛔ « JAMAIS AU-DELÀ » — le quota n’est JAMAIS dépassé',
    `${q1.consomme} min consommées sur ${q1.optionnel} autorisées`)
  dire(!dernier.servi,
    '⭐ LE COMPTE S’ARRÊTE, il ne boucle pas', `motif : ${dernier.motif}`)
  dire(['quota_epuise', 'ne_tient_pas', 'vivier_vide'].includes(dernier.motif),
    '⛔⛔ ET L’ÉCRAN DIT POURQUOI — jamais un silence',
    `« ${dernier.phrase} »`)
  // ⭐ PB6 vaut ici comme à la semaine : « on ajoute un exercice TANT QU'IL EN
  //   EXISTE UN QUI TIENNE sous le plafond ; on s'arrête quand il n'en reste
  //   aucun ». L'arrêt a donc DEUX visages, et les deux sont justes — le quota
  //   sous le seuil (`quota_epuise`), ou un reliquat où rien ne tient
  //   (`ne_tient_pas`). Dans les deux cas, ce qui reste est PERDU.
  dire(q1.restant < RELIQUAT_PERDU_MIN
    ? dernier.motif === 'quota_epuise'
    : dernier.motif === 'ne_tient_pas' || dernier.motif === 'vivier_vide',
    '⭐ PB6 — L’ARRÊT PORTE LE BON MOTIF, et le reliquat est perdu dans les deux cas',
    `restant : ${q1.restant} min (seuil ${RELIQUAT_PERDU_MIN}) → motif « ${dernier.motif} »`)

  // ⛔ ET LE QUOTA NE SE REPORTE PAS : le cycle suivant repart du plein.
  const cycleSuivant = toISODate(new Date(Date.parse(`${CYCLE}T00:00:00Z`) + 7 * 86_400_000))
  const qSuivant = await lireLeQuotaDuCycle(admin, eleveId, cycleSuivant)
  dire(qSuivant.consomme === 0 && qSuivant.restant === qSuivant.optionnel,
    '⛔⛔ LE QUOTA NE SE REPORTE PAS : le cycle suivant repart du plein',
    `${cycleSuivant} : ${qSuivant.restant}/${qSuivant.optionnel} min — « les minutes non `
    + 'utilisées sont PERDUES, sans report ni écrêtage »')

  return { servis, dernier }
}

// ════════════════════════════════════════════════════════════════════════════
// F. LE DOUBLE CLIC — la garde MÉCANIQUE, pas un booléen d'écran
// ════════════════════════════════════════════════════════════════════════════
async function leDoubleClic(autreEleveId) {
  titre('F. Le double clic — « deux appels concurrents ne servent qu’UN exercice »')

  // On l'éprouve sur le SECOND élève, dont le quota est intact.
  const niveauAvant = lu('niveau', await admin.from('competences_niveaux')
    .select('lettre, lettre_initiale, profil_provisoire')
    .eq('eleve_id', autreEleveId).eq('competence', COMPETENCE).maybeSingle())
  registre.niveauAutre = { existait: !!niveauAvant, avant: niveauAvant ?? null }
  sauver()
  if (niveauAvant) {
    lu('lettre', await admin.from('competences_niveaux')
      .update({ lettre: 'D', lettre_initiale: 'D', profil_provisoire: false })
      .eq('eleve_id', autreEleveId).eq('competence', COMPETENCE))
  } else {
    lu('lettre', await admin.from('competences_niveaux').insert({
      eleve_id: autreEleveId, competence: COMPETENCE, lettre: 'D',
      lettre_initiale: 'D', profil_provisoire: false }))
  }

  const bilan = await poserLesSemainesDuRouteur(admin, FUSEAU, CYCLE,
    { cycleDemande: CYCLE, elevesDemandes: [autreEleveId] })
  note(`semaine du second élève : ${bilan.exercicesPoses} exercice(s)`)
  const decA = lu('décisions', await admin.from('routeur_decisions')
    .select('id, exercice_id').eq('eleve_id', autreEleveId).eq('cycle_lundi', CYCLE))
  registre.decisions.push(...decA.map((d) => d.id))
  const depA = lu('dépôts', await admin.from('exercices_depots')
    .select('id').eq('eleve_id', autreEleveId)
    .in('exercice_id', decA.map((d) => d.exercice_id)))
  registre.depots.push(...depA.map((d) => d.id))
  sauver()

  const avant = lu('dépôts avant', await admin.from('exercices_depots')
    .select('id').eq('eleve_id', autreEleveId))

  // ⭐⭐ DEUX APPELS CONCURRENTS, LANCÉS SANS `await` ENTRE EUX.
  const [r1, r2] = await Promise.all([
    servirUnExerciceDePlus(admin, autreEleveId, CYCLE, FUSEAU, CYCLE),
    servirUnExerciceDePlus(admin, autreEleveId, CYCLE, FUSEAU, CYCLE),
  ])
  for (const r of [r1, r2]) if (r.servi) {
    registre.depots.push(r.servi.depotId); registre.decisions.push(r.servi.decisionId)
  }
  sauver()

  const apres = lu('dépôts après', await admin.from('exercices_depots')
    .select('id, exercice_id, routeur_decision_id').eq('eleve_id', autreEleveId))
  const neufs = apres.filter((d) => !avant.some((x) => x.id === d.id))
  dire(neufs.length === 1,
    '⛔⛔ DEUX APPELS CONCURRENTS N’ONT SERVI QU’UN SEUL EXERCICE',
    `${neufs.length} dépôt(s) neuf(s) — la clé uk_depots_eleve_exercice est le claim`)
  const perdant = [r1, r2].find((r) => !r.servi)
  dire(!!perdant && perdant.motif === 'un_a_la_fois',
    '⭐ ET LE PERDANT LE DIT — jamais un succès qui n’a rien écrit',
    perdant ? `« ${perdant.phrase} »` : 'les deux ont servi : LA GARDE N’A PAS MORDU')

  // ⛔ ET AUCUNE DÉCISION ORPHELINE N’EST RESTÉE.
  const orphelines = lu('décisions du cycle', await admin.from('routeur_decisions')
    .select('id, exercice_id').eq('eleve_id', autreEleveId).eq('cycle_lundi', CYCLE)
    .eq('bonus', true))
  const idsDepots = new Set(apres.map((d) => d.routeur_decision_id).filter(Boolean))
  const sansDepot = orphelines.filter((d) => !idsDepots.has(d.id))
  dire(sansDepot.length === 0,
    '⛔ AUCUNE DÉCISION ORPHELINE — le perdant retire la ligne qu’il venait d’écrire',
    `${orphelines.length} décision(s) bonus, ${sansDepot.length} sans dépôt`)

  const servi = [r1, r2].find((r) => r.servi)
  return { autreEleveId, bonusDeLAutre: servi?.servi ?? null }
}

// ════════════════════════════════════════════════════════════════════════════
// G. LA MARQUE ATTEINT LA MESURE — le troisième saut, en base
// ════════════════════════════════════════════════════════════════════════════
async function laMarqueAtteintLaMesure(depotBonus, eleveId, autreEleveId) {
  titre('G. ③ LA MARQUE → `utils/chaine/contexte.ts` → `competences_mesures.bonus`')

  // ⭐ LE VRAI `lireContexte`, pas une requête écrite ici.
  const ctxBonus = await lireContexte(admin, depotBonus.id)
  dire(ctxBonus.bonus === true,
    '⭐⭐ `lireContexte` RELIT LA MARQUE au journal', `ctx.bonus = ${ctxBonus.bonus}`)
  dire(ctxBonus.decision?.bonus === true,
    '⭐ et elle vient bien de LA DÉCISION, pas de l’instance')

  // ⛔⛔ LA PREUVE NÉGATIVE : LA MÊME INSTANCE, IMPOSÉE À UN AUTRE ÉLÈVE.
  //    C'est le défaut exact qu'`exercices.bonus` aurait produit : « entre
  //    élèves, une instance se ressert — une instance, plusieurs dépôts ».
  //
  // ⚠️⚠️ ET LE TÉMOIN SE CHOISIT, IL NE SE SUPPOSE PAS. Le premier jeu de cette
  //    recette a pris le « second élève » du décor — qui portait DÉJÀ un dépôt
  //    sur cette instance, et un dépôt BONUS : la preuve négative relisait donc
  //    son propre bonus et rendait `true`. ⛔ Le décor n'était pas faux, il était
  //    POSÉ SUR UNE DONNÉE QU'IL NE COMPTAIT PAS — la leçon de `C6-L2`, à
  //    l'identique. On cherche donc un élève SANS AUCUN dépôt sur cette instance.
  const instance = depotBonus.exercice_id
  const porteurs = new Set((lu('porteurs', await admin.from('exercices_depots')
    .select('eleve_id').eq('exercice_id', instance))).map((d) => d.eleve_id))
  const tousEleves = [...new Set((lu('élèves actifs', await admin.from('inscriptions')
    .select('eleve_id').eq('statut', 'active').order('eleve_id'))).map((i) => i.eleve_id))]
  const temoin = tousEleves.find((e) => !porteurs.has(e))
  if (!temoin) {
    throw new Error(`tous les élèves actifs portent déjà un dépôt sur l'instance `
      + `${instance.slice(0, 8)} : la preuve négative n'a pas de témoin. Condition de reprise : `
      + 'jouer sur une base où une instance servable n’a pas encore été assignée à tout le monde.')
  }
  note(`témoin de la preuve NÉGATIVE : ${temoin.slice(0, 8)} — il ne porte AUCUN dépôt sur `
    + `l'instance ${instance.slice(0, 8)}`)
  const decImposee = lu('décision imposée', await admin.from('routeur_decisions').insert({
    eleve_id: temoin, cycle_lundi: CYCLE, exercice_id: instance,
    cible_retenue: COMPETENCE, regle_declenchee: 'R2',
    alternatives_ecartees: { recette: MARQUE }, sondes_retenues: [],
    // ⛔ FAUX — c'est tout l'objet de la preuve.
    bonus: false,
  }).select('id').single())
  registre.decisions.push(decImposee.id)
  const depotImpose = lu('dépôt imposé', await admin.from('exercices_depots').insert({
    eleve_id: temoin, exercice_id: instance, origine: 'routeur',
    routeur_decision_id: decImposee.id, assigne_at: `${CYCLE}T12:00:00Z`,
  }).select('id, exercice_id').single())
  registre.depots.push(depotImpose.id)
  sauver()
  const ctxImpose = await lireContexte(admin, depotImpose.id)
  dire(ctxImpose.bonus === false,
    '⛔⛔ LA MÊME INSTANCE, IMPOSÉE À UN AUTRE ÉLÈVE, RESTE `bonus = false`',
    `instance ${instance.slice(0, 8)} — demandée par l’un, imposée à l’autre. `
    + '⭐ C’est exactement ce qu’`exercices.bonus` n’aurait PAS su dire.')

  // ── L'ÉCRITURE DE LA MESURE, par le VRAI `ecrireMesure` ───────────────────
  // ⚠️ Le seul maillon non exercé de tout le canal est la ligne `bonus:
  //    ctx.bonus` de `mesurerUneCompetence` — elle vit à l'intérieur d'un étage
  //    à DEUX APPELS FROIDS, et ce script n'en paie aucun. On la REPRODUIT
  //    telle quelle, autour du vrai contexte et du vrai écrivain.
  const ligne = (ctx, depotId) => ({
    eleve_id: ctx.eleveId, competence: COMPETENCE, modes: ['composer'],
    lettre_equivalente: 'D', observables: {}, lieu: ctx.lieu, forme: ctx.forme,
    genre: ctx.genre, classe_id: ctx.classeId,
    sonde_montee: ctx.decision?.sondesMontee?.includes(COMPETENCE) ?? false,
    depot_id: depotId,
    bonus: ctx.bonus,                       // ← la ligne 851 de `chaine.ts`, mot pour mot
    instrument_version: MARQUE,             // ⭐ LA MARQUE EN BASE, pour le balayage
  })
  const e1 = await ecrireMesure(admin, ligne(ctxBonus, depotBonus.id))
  const e2 = await ecrireMesure(admin, ligne(ctxImpose, depotImpose.id))
  dire(e1.ecrite && e2.ecrite, '⭐ deux mesures écrites par le VRAI `ecrireMesure`',
    `bonus : ${e1.ecrite} · imposé : ${e2.ecrite}`)

  const mesures = lu('mesures semées', await admin.from('competences_mesures')
    .select('id, eleve_id, depot_id, bonus').eq('instrument_version', MARQUE))
  registre.mesures.push(...mesures.map((m) => m.id))
  sauver()
  const mB = mesures.find((m) => m.depot_id === depotBonus.id)
  const mI = mesures.find((m) => m.depot_id === depotImpose.id)
  dire(mB?.bonus === true,
    '⭐⭐⭐ `competences_mesures.bonus = true` — LE CANAL EST BRANCHÉ DE BOUT EN BOUT',
    'c’est le seul bout que la source déclare deux fois, et il porte la bonne valeur')
  dire(mI?.bonus === false,
    '⛔⛔ ET LA MESURE DE L’EXERCICE IMPOSÉ RESTE FAUSSE, sur la MÊME instance',
    'le fait est par (élève × exercice), et il l’est resté')
  void eleveId
  void autreEleveId
  return { depotImpose }
}

// ════════════════════════════════════════════════════════════════════════════
// H. LA FRISE — l'assigné et le demandé ne se confondent plus
// ════════════════════════════════════════════════════════════════════════════
async function laFrise(eleveId) {
  titre('H. ④ `exercicesMaisonDeLEleve` → `friseDeLaSemaine` — elle SAIT distinguer')

  // ⚠️ LA CLASSE BORNE LA LISTE, PAS LE PROFIL : on lit COMME LA PAGE le fait en
  //    état « Toutes » — une lecture par inscription, puis la fusion. Lire une
  //    seule classe cacherait la moitié du travail d'un bi-classe.
  const inscriptions = lu('inscriptions', await admin.from('inscriptions')
    .select('classe_id').eq('eleve_id', eleveId).eq('statut', 'active'))
  const parClasse = []
  for (const i of inscriptions) {
    parClasse.push(await chargerLaSemaineDeLEleve(admin, eleveId, i.classe_id, CYCLE, FUSEAU))
  }
  for (const s of parClasse) {
    for (const inc of s.incidents.slice(0, 2)) note(`⚠️ ${inc}`)
  }
  const exercices = parClasse.flatMap((s) => s.exercices)
  const frise = {
    faits: parClasse.reduce((n, s) => n + s.frise.faits, 0),
    total: parClasse.reduce((n, s) => n + s.frise.total, 0),
    enPlus: {
      faits: parClasse.reduce((n, s) => n + s.frise.enPlus.faits, 0),
      total: parClasse.reduce((n, s) => n + s.frise.enPlus.total, 0),
    },
  }
  const bonusListes = exercices.filter((e) => e.bonus)

  // ⚠️⚠️ CE QUE LE PASSAGE RÉVÈLE, ET QUI N'EST PAS DE CE LOT — voir §L.
  //    Un dépôt dont l'instance porte le `classe_id` d'une classe où l'élève
  //    n'est PAS inscrit n'apparaît sur AUCUN de ses écrans.
  const depotsDuCycle = lu('dépôts du cycle', await admin.from('exercices_depots')
    .select('id, exercice_id, assigne_at, routeur_decisions(bonus), exercices!inner(classe_id)')
    .eq('eleve_id', eleveId))
  const siennes = new Set(inscriptions.map((i) => i.classe_id))
  const duCycle = depotsDuCycle.filter((d) => d.assigne_at
    && toISODate(lundiDuCycle(new Date(d.assigne_at), FUSEAU)) === CYCLE)
  const invisibles = duCycle.filter((d) => {
    const c = (Array.isArray(d.exercices) ? d.exercices[0] : d.exercices)?.classe_id
    return c != null && !siennes.has(c)
  })
  if (invisibles.length) {
    note(`⚠️⚠️ ${invisibles.length} dépôt(s) du cycle sont INVISIBLES sur tous ses écrans — `
      + 'leur instance porte le `classe_id` d’une classe où il n’est pas inscrit (voir §L).')
  }

  dire(bonusListes.length > 0,
    '⭐ la lecture de la semaine RELIT la marque, exercice par exercice',
    `${bonusListes.length} exercice(s) marqué(s) sur ${exercices.length} vus `
    + `(${duCycle.length} dépôt(s) en base, dont ${invisibles.length} invisible(s) — §L)`)
  dire(frise.enPlus.total === bonusListes.length
    && frise.total === exercices.length - bonusListes.length,
    '⭐⭐ LA FRISE DISTINGUE : « X sur Y » ne compte QUE l’imposé',
    `frise ${frise.faits}/${frise.total} imposés · ${frise.enPlus.faits}/`
    + `${frise.enPlus.total} demandés en plus`)
  dire(parClasse.every((s) => s.moment === 'recapitulatif' || s.moment === 'bilan'
    || s.moment === 'vide'),
    '⭐ et le moment de l’écran se lit toujours sur la semaine IMPOSÉE',
    parClasse.map((s) => s.moment).join(' · '))
  return { frise, exercices, invisibles }
}

// ════════════════════════════════════════════════════════════════════════════
// L. CE QUE LE PASSAGE RÉVÈLE — et qui n'est PAS de ce lot
// ════════════════════════════════════════════════════════════════════════════
/**
 * ⚠️⚠️ UN CONSTAT, PAS UN CONTRÔLE. « Elle ne demande pas de réparer ce qu'elle
 *    révèle » : ce bloc MESURE et NOMME, il ne fait échouer personne — le défaut
 *    appartient à la couche 4 du routeur, pas au budget optionnel.
 *
 * ⛔⛔ `constituerLeVivier` NE FILTRE PAS PAR `classe_id`, quand
 *    `exercicesMaisonDeLEleve` filtre par `visibleDansLaClasse`. Le routeur peut
 *    donc assigner à un élève une instance d'une classe où il n'est PAS inscrit :
 *    le dépôt existe, l'élève ne le voit sur AUCUN de ses écrans, et l'assiduité
 *    le compte quand même au dénominateur. ⚠️ Le défaut vaut pour LA POSE
 *    HEBDOMADAIRE autant que pour le bonus — c'est un trou ENTRE deux lots.
 */
async function ceQueLePassageRevele() {
  titre('L. Ce que le passage révèle — un CONSTAT, déposé, jamais réparé ici')

  const depots = lu('dépôts du routeur', await admin.from('exercices_depots')
    .select('id, eleve_id, exercices!inner(classe_id, lieu)').eq('origine', 'routeur'))
  const inscriptions = lu('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id').eq('statut', 'active'))
  const classesDe = new Map()
  for (const i of inscriptions) {
    classesDe.set(i.eleve_id, (classesDe.get(i.eleve_id) ?? new Set()).add(i.classe_id))
  }
  const hors = depots.filter((d) => {
    const ex = Array.isArray(d.exercices) ? d.exercices[0] : d.exercices
    if (ex?.lieu !== 'maison' || ex?.classe_id == null) return false
    return !(classesDe.get(d.eleve_id) ?? new Set()).has(ex.classe_id)
  })
  note(`⚠️⚠️ CONSTAT : ${hors.length} dépôt(s) d'origine ROUTEUR portent une instance dont la `
    + 'classe n’est PAS une classe de l’élève.')
  note('   `constituerLeVivier` ne filtre pas par `classe_id` ; `exercicesMaisonDeLEleve` filtre '
    + 'par `visibleDansLaClasse`. Le dépôt existe et l’élève ne le voit nulle part.')
  note('   ⛔ Ce n’est PAS C6-L3 : le défaut vaut pour la pose HEBDOMADAIRE de C4-L12 autant que '
    + 'pour le bonus. Déposé à la boîte de `C4-L12` et au `SUIVI_tests_manuels.md`.')
  return hors.length
}

// ════════════════════════════════════════════════════════════════════════════
// I. LE PUSH — il suggère, ET IL N'ASSIGNE RIEN
// ════════════════════════════════════════════════════════════════════════════
async function lePush(eleveId, classeId) {
  titre('I. ⑤ LE PUSH → la liste des tuiles — « une suggestion, JAMAIS une assignation »')

  // Une compétence `evaluee`, à C ou moins, SANS MESURE depuis le plancher.
  const autre = 'structure'
  const niveauAvant = lu('niveau', await admin.from('competences_niveaux')
    .select('lettre, lettre_initiale, profil_provisoire')
    .eq('eleve_id', eleveId).eq('competence', autre).maybeSingle())
  registre.niveauPush = { competence: autre, existait: !!niveauAvant, avant: niveauAvant ?? null }
  sauver()
  if (niveauAvant) {
    lu('lettre push', await admin.from('competences_niveaux')
      .update({ lettre: 'E', lettre_initiale: 'E', profil_provisoire: false })
      .eq('eleve_id', eleveId).eq('competence', autre))
  } else {
    lu('lettre push', await admin.from('competences_niveaux').insert({
      eleve_id: eleveId, competence: autre, lettre: 'E',
      lettre_initiale: 'E', profil_provisoire: false }))
  }
  note(`${autre} passe à E, sans aucune mesure — le plancher est de `
    + `${CYCLES_DU_PLANCHER_DE_MESURE} cycles`)

  const avant = lu('dépôts avant', await admin.from('exercices_depots')
    .select('id').eq('eleve_id', eleveId))
  const p = await signalDuPush(admin, eleveId, [classeId], CYCLE, FUSEAU)
  if (p.incidents.length) for (const i of p.incidents) note(`⚠️ ${i}`)
  dire(p.aSuggerer, '⭐⭐ LE PUSH SUGGÈRE', p.suggestions.length
    ? p.suggestions.map((s) => `${s.competence}@${s.lettre} (${s.cyclesSansMesure ?? 'jamais'})`).join(' · ')
    : 'aucune suggestion')
  dire(p.suggestions.some((s) => s.competence === autre),
    `⭐ et elle porte sur la compétence sans mesure depuis ${CYCLES_DU_PLANCHER_DE_MESURE} cycles`,
    `en tête : ${p.competenceDite ?? '—'}`)
  dire(!p.suggestions.some((s) => s.lettre === 'B' || s.lettre === 'A'),
    '⛔ AUCUNE compétence au-dessus de C n’est suggérée')

  // ⛔⛔ LA PREUVE PAR LA NÉGATIVE — « la clause la plus facile à croire tenue ».
  const apres = lu('dépôts après', await admin.from('exercices_depots')
    .select('id').eq('eleve_id', eleveId))
  dire(apres.length === avant.length,
    '⛔⛔ ET ELLE N’A RIEN ASSIGNÉ : aucune ligne neuve dans `exercices_depots`',
    `${avant.length} → ${apres.length} — « une suggestion qui assigne est exactement le `
    + 'défaut que la source nomme »')
  return p
}

// ════════════════════════════════════════════════════════════════════════════
// J. L'ASSIDUITÉ — mesuré, pas raisonné
// ════════════════════════════════════════════════════════════════════════════
async function lAssiduite(eleveId) {
  titre('J. L’assiduité — ce que le bonus y fait, MESURÉ')

  const lignes = lu('dépôts du cycle', await admin.from('exercices_depots')
    .select('eleve_id, statut, assigne_at, routeur_decisions(bonus)').eq('eleve_id', eleveId))
  const depots = lignes.map((l) => {
    const d = Array.isArray(l.routeur_decisions) ? l.routeur_decisions[0] : l.routeur_decisions
    return { eleveId: l.eleve_id, statut: l.statut, assigneAt: l.assigne_at,
      bonus: d?.bonus === true }
  })
  const tri = comptesDeLaSemaine(depots, CYCLE, FUSEAU)
  const c = tri.parEleve.get(eleveId) ?? { assignes: 0, termines: 0 }

  // Le même compte, SANS la règle — pour montrer ce que l'oubli aurait coûté.
  const sansLaRegle = comptesDeLaSemaine(depots.map((d) => ({ ...d, bonus: false })), CYCLE, FUSEAU)
  const cSans = sansLaRegle.parEleve.get(eleveId) ?? { assignes: 0, termines: 0 }

  dire(tri.bonus > 0, '⭐ le bonus est COMPTÉ à part — « un vide expliqué »',
    `${tri.bonus} bonus sortis du dénominateur`)
  dire(c.assignes < cSans.assignes,
    '⛔⛔ SANS LA RÈGLE, LE DÉNOMINATEUR AURAIT GONFLÉ DE CE QUE L’ÉLÈVE A DEMANDÉ',
    `avec la règle : ${c.termines}/${c.assignes} · sans elle : ${cSans.termines}/${cSans.assignes} `
    + '— « un bonus NON rendu abaisse l’assiduité d’un élève qui en a fait PLUS que les autres »')
  const completion = (x) => (x.assignes === 0 ? null : x.termines / x.assignes)
  note(`complétion avec la règle : ${completion(c) ?? 'null (rien d’assigné)'} · `
    + `sans elle : ${completion(cSans) ?? 'null'}`)
}

// ════════════════════════════════════════════════════════════════════════════
// K. LA PORTE — empruntée le temps d'un appel, et REMISE
// ════════════════════════════════════════════════════════════════════════════
async function laPorte(eleveId) {
  titre('K. La porte — « un lien vers un écran fermé est une promesse cassée »')

  const avant = lu('porte', await admin.from('scriptorium_params')
    .select('exercices_actif').eq('id', 1).maybeSingle())?.exercices_actif
  // ⛔ LA VALEUR TROUVÉE EST ÉCRITE AU REGISTRE **AVANT** LA BASCULE.
  registre.porteAvant = avant
  sauver()
  note(`porte trouvée : exercices_actif = ${avant} — mémorisée AVANT toute bascule`)

  lu('fermeture', await admin.from('scriptorium_params')
    .update({ exercices_actif: false }).eq('id', 1))
  try {
    const r = await servirUnExerciceDePlus(admin, eleveId, CYCLE, FUSEAU, CYCLE)
    dire(!r.servi && r.motif === 'porte_fermee',
      '⛔ PORTE FERMÉE : le pull refuse, et il DIT pourquoi', `« ${r.phrase} »`)
    dire(!/actif|interrupteur/i.test(r.phrase),
      '⛔ ET LA PHRASE NE NOMME AUCUN INTERRUPTEUR — l’élève n’a pas à les connaître')
    const p = await signalDuPush(admin, eleveId, [registre.classeId], CYCLE, FUSEAU)
    dire(!p.aSuggerer,
      '⛔ ET LA TUILE DU PUSH NE NAÎT PAS : elle porte un lien, donc elle lit sa porte')
  } finally {
    await remettreLaPorte()
  }
  const apres = lu('porte', await admin.from('scriptorium_params')
    .select('exercices_actif').eq('id', 1).maybeSingle())?.exercices_actif
  dire(apres === avant,
    '⭐⭐ LA PORTE EST REVENUE TELLE QU’ON L’A TROUVÉE — vérifié PAR REQUÊTE',
    `avant ${avant} → après ${apres}`)
}

// ════════════════════════════════════════════════════════════════════════════
// LE RETRAIT
// ════════════════════════════════════════════════════════════════════════════
async function retirer() {
  titre('Le retrait')
  if (fs.existsSync(REGISTRE)) {
    const r = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
    if (r.porteAvant !== null && r.porteAvant !== undefined) {
      const { error } = await admin.from('scriptorium_params')
        .update({ exercices_actif: r.porteAvant }).eq('id', 1)
      note(error ? `⚠️ porte : ${error.message}` : `porte remise à ${r.porteAvant}`)
    }
    for (const [table, ids] of [
      ['competences_mesures', r.mesures], ['exercices_depots', r.depots],
      ['routeur_decisions', r.decisions], ['exercices', r.exercices],
    ]) {
      if (!ids?.length) continue
      const { error } = await admin.from(table).delete().in('id', ids)
      note(error ? `⚠️ ${table} : ${error.message}` : `${table} : ${ids.length} ligne(s) visée(s)`)
    }
    for (const [cle, eleve] of [['niveau', r.eleveId], ['niveauAutre', r.autreEleveId],
      ['niveauPush', r.eleveId]]) {
      const n = r[cle]
      if (!n || !eleve) continue
      const competence = n.competence ?? COMPETENCE
      if (!n.existait) {
        const { error } = await admin.from('competences_niveaux').delete()
          .eq('eleve_id', eleve).eq('competence', competence)
        note(error ? `⚠️ ${cle} : ${error.message}` : `${cle} RETIRÉ (il n’existait pas avant)`)
      } else {
        const { error } = await admin.from('competences_niveaux').update({
          lettre: n.avant.lettre, lettre_initiale: n.avant.lettre_initiale,
          profil_provisoire: n.avant.profil_provisoire,
        }).eq('eleve_id', eleve).eq('competence', competence)
        note(error ? `⚠️ ${cle} : ${error.message}`
          : `${cle} REPOSÉ tel qu’il était (lettre ${n.avant.lettre ?? 'null'})`)
      }
    }
    fs.unlinkSync(REGISTRE)
    note('registre effacé')
  } else {
    note('aucun registre — on balaie tout de même PAR LA MARQUE.')
  }
  await balayer()
}

/**
 * ⭐⭐ LE BALAYAGE PAR LA MARQUE — le filet sous le registre.
 * ⛔ « Un décor qu'on ne sait retrouver que par un fichier local n'est pas
 *    retirable » : le registre disparaît avec une interruption, un `| head`
 *    (SIGPIPE), un `rm` distrait. La marque, elle, est EN BASE.
 */
async function balayer() {
  const mesures = lu('mesures marquées', await admin
    .from('competences_mesures').select('id').eq('instrument_version', MARQUE))
  if (mesures.length) {
    const { error } = await admin.from('competences_mesures').delete()
      .eq('instrument_version', MARQUE)
    note(error ? `⚠️ balayage des mesures : ${error.message}`
      : `balayage : ${mesures.length} mesure(s) marquée(s) retirée(s)`)
  }
  // ⚠️ `consigne_instanciee` est un JSONB : le `like` de PostgREST ne s'y
  //    applique pas. On filtre EN JS, sur les instances de la maison.
  const toutes = lu('instances', await admin
    .from('exercices').select('id, consigne_instanciee').eq('lieu', 'maison'))
  const nôtres = toutes.filter((e) =>
    JSON.stringify(e.consigne_instanciee ?? '').includes(MARQUE))
  if (nôtres.length) {
    const ids = nôtres.map((i) => i.id)
    // Les dépôts partent d'abord (ils portent la FK vers la décision), puis les
    // décisions, puis les instances.
    const { error: eDep } = await admin.from('exercices_depots').delete().in('exercice_id', ids)
    if (eDep) note(`⚠️ balayage des dépôts : ${eDep.message}`)
    const { error: eDec } = await admin.from('routeur_decisions').delete().in('exercice_id', ids)
    if (eDec) note(`⚠️ balayage des décisions : ${eDec.message}`)
    const { error: eEx } = await admin.from('exercices').delete().in('id', ids)
    note(eEx ? `⚠️ balayage des instances : ${eEx.message}`
      : `balayage : ${nôtres.length} instance(s) marquée(s) retirée(s)`)
  }
  // ⚠️ ET LE RETOUR SE VÉRIFIE PAR REQUÊTE, jamais sur la sortie du script.
  const restes = lu('restes', await admin.from('competences_mesures')
    .select('id').eq('instrument_version', MARQUE))
  const restesEx = (lu('restes ex', await admin.from('exercices')
    .select('id, consigne_instanciee').eq('lieu', 'maison')))
    .filter((e) => JSON.stringify(e.consigne_instanciee ?? '').includes(MARQUE))
  dire(restes.length === 0 && restesEx.length === 0,
    '⭐ RETOUR VÉRIFIÉ PAR REQUÊTE : plus aucune ligne marquée',
    `${restes.length} mesure(s) · ${restesEx.length} instance(s)`)
}

// ════════════════════════════════════════════════════════════════════════════
// LE DÉCOR D'ÉCRAN — pour l'ŒIL, et pour le seul chemin que la couture contourne
// ════════════════════════════════════════════════════════════════════════════
/**
 * ⭐⭐ CE QUE CE MODE EXISTE POUR ÉPROUVER, ET QUE RIEN D'AUTRE N'ÉPROUVE : la
 *    SERVER ACTION elle-même. La couture ci-dessus appelle `servirUnExerciceDePlus`
 *    directement — donc ni l'enveloppe `'use server'`, ni la garde de session, ni
 *    `revalidatePath`. ⛔ « `export type` dans un module `'use server'` TUE TOUT
 *    LE MODULE À L'EXÉCUTION », et `tsc`, `npm test` et les recettes passent tous
 *    les trois sans rien dire : **seul un clic dans un navigateur teste ce
 *    chemin-là.**
 *
 * ⚠️ IL SÈME SUR LE CYCLE **COURANT**, parce que l'offre ne s'affiche que là :
 *    « les minutes non utilisées sont perdues » — une semaine passée n'a plus de
 *    quota à offrir. ⛔ Il ne fait donc PAS tourner le moteur (le cycle courant
 *    peut être au segment 1, hors routage) : il pose les dépôts à la main.
 *
 * ⛔ IL NE SE NETTOIE PAS TOUT SEUL : `--retire`.
 */
async function decorDEcran() {
  titre('Le décor d’écran — pour l’ŒIL, et pour la server action')

  const courriel = env.TEST_ELEVE_EMAIL
  if (!courriel) throw new Error('TEST_ELEVE_EMAIL absent du `.env.local`.')
  const { data: comptes, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error(`comptes — ${error.message}`)
  const u = comptes.users.find((x) => x.email?.toLowerCase() === courriel.toLowerCase())
  if (!u) throw new Error(`aucun compte « ${courriel} » dans auth.users.`)
  const eleveId = u.id

  const insc = lu('inscriptions', await admin.from('inscriptions')
    .select('classe_id, classes(nom, type_pedagogique)')
    .eq('eleve_id', eleveId).eq('statut', 'active'))
  const avecParcours = insc.find((i) => i.classes?.type_pedagogique)
  if (!avecParcours) {
    throw new Error(`« ${courriel} » n'a aucune classe active avec un \`type_pedagogique\` : `
      + 'le piège de la vacuité l’écarterait, et l’écran dirait « aucun budget ».')
  }
  const classeId = avecParcours.classe_id
  const cycle = toISODate(lundiDuCycle(new Date(), FUSEAU))
  registre.cycle = cycle
  registre.eleveId = eleveId
  registre.classeId = classeId
  sauver()
  note(`élève ${courriel} · classe « ${avecParcours.classes.nom } » · cycle COURANT du ${cycle}`)

  const sujet = lu('sujet', await admin.from('exercices_sujets')
    .select('id').eq('cours_etat', 'generique').eq('statut', 'valide')
    .eq('bloque', false).limit(1).maybeSingle())
  const type = lu('type', await admin.from('exercices_types')
    .select('id').eq('code', 'argument').maybeSingle())
  const crans = lu('crans', await admin.from('exercices_types_crans')
    .select('cran').eq('type_id', type.id).order('cran'))

  // Trois instances : deux IMPOSÉES (rendues) et une DEMANDÉE (rendue aussi),
  // pour que le bilan s'ouvre ET que l'offre puisse s'offrir.
  const aSemer = [0, 1, 2].map((i) => ({
    type_id: type.id, classe_id: classeId, lieu: 'maison', statut: 'assigne',
    cran: crans[i % crans.length].cran,
    consigne_instanciee: { recette: `${MARQUE} — écran ${i + 1}` },
    modes_par_competence: { [COMPETENCE]: ['composer'] },
    materiau_source_sujet_id: sujet?.id ?? null,
  }))
  const instances = lu('instances', await admin.from('exercices').insert(aSemer).select('id'))
  registre.exercices.push(...instances.map((x) => x.id))
  sauver()

  for (const [i, inst] of instances.entries()) {
    const estBonus = i === 2
    const dec = lu('décision', await admin.from('routeur_decisions').insert({
      eleve_id: eleveId, cycle_lundi: cycle, exercice_id: inst.id,
      cible_retenue: COMPETENCE, regle_declenchee: 'R2',
      alternatives_ecartees: { recette: MARQUE }, sondes_retenues: [],
      bonus: estBonus,
    }).select('id').single())
    registre.decisions.push(dec.id)
    const dep = lu('dépôt', await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: inst.id, origine: 'routeur',
      routeur_decision_id: dec.id, statut: 'clos',
      assigne_at: `${cycle}T12:00:00Z`,
    }).select('id').single())
    registre.depots.push(dep.id)
    sauver()
    note(`${estBonus ? '⭐ DEMANDÉ en plus' : 'imposé'} — dépôt ${dep.id.slice(0, 8)} (clos)`)
  }

  // La lettre du PUSH : une compétence `evaluee`, à E, sans aucune mesure.
  const autre = 'structure'
  const niveauAvant = lu('niveau', await admin.from('competences_niveaux')
    .select('lettre, lettre_initiale, profil_provisoire')
    .eq('eleve_id', eleveId).eq('competence', autre).maybeSingle())
  registre.niveauPush = { competence: autre, existait: !!niveauAvant, avant: niveauAvant ?? null }
  sauver()
  if (niveauAvant) {
    lu('lettre', await admin.from('competences_niveaux')
      .update({ lettre: 'E', lettre_initiale: 'E', profil_provisoire: false })
      .eq('eleve_id', eleveId).eq('competence', autre))
  } else {
    lu('lettre', await admin.from('competences_niveaux').insert({
      eleve_id: eleveId, competence: autre, lettre: 'E',
      lettre_initiale: 'E', profil_provisoire: false }))
  }
  note(`${autre} passe à E sans mesure — la tuile du push doit naître`)

  const q = await lireLeQuotaDuCycle(admin, eleveId, cycle)
  note(`quota du cycle : ${q?.consomme}/${q?.optionnel} min — restant ${q?.restant}`)
  const p = await signalDuPush(admin, eleveId, insc.map((i) => i.classe_id), cycle, FUSEAU)
  note(`push : ${p.aSuggerer ? `SUGGÈRE ${p.competenceDite}` : 'muet'}`)

  console.log('\n  ⭐ Décor posé. Ouvre /eleve/semaine et /eleve.')
  console.log('  ⛔ `--retire` pour le retirer.')
}

// ════════════════════════════════════════════════════════════════════════════
async function main() {
  if (a('retire')) { await retirer(); return }
  if (a('decor-ecran')) { await decorDEcran(); return }

  console.log(`\n╔══ COUTURE C6·L3 — « en faire plus » ══ cycle du ${CYCLE} ══`)
  const depart = await pointDeDepart()
  let decor = null
  try {
    decor = await semer()
    const { decisionsSemaine } = await poserLaSemaine(decor.eleveId)
    const { depotBonus } = await leCanalDeuxEtTrois(decor.eleveId, decisionsSemaine)
    await lAbus(decor.eleveId)
    await leDoubleClic(decor.autreEleveId)
    await laMarqueAtteintLaMesure(depotBonus, decor.eleveId, decor.autreEleveId)
    await laFrise(decor.eleveId)
    await lePush(decor.eleveId, decor.classe.id)
    await lAssiduite(decor.eleveId)
    await laPorte(decor.eleveId)
    await ceQueLePassageRevele()
  } finally {
    await remettreLaPorte()
    if (!GARDE_LE_DECOR) await retirer()
    else note('⚠️ décor GARDÉ (--garde-le-decor) — `--retire` pour le retirer.')
  }

  titre('Le bilan')
  note(`marques AVANT : ${depart.nbMarquesAvant} décision(s) · ${depart.nbMesuresAvant} mesure(s)`)
  const apresD = lu('marques', await admin.from('routeur_decisions').select('id').eq('bonus', true))
  const apresM = lu('mesures', await admin.from('competences_mesures').select('id').eq('bonus', true))
  note(`marques APRÈS retrait : ${apresD.length} décision(s) · ${apresM.length} mesure(s)`)
  console.log(`\n${ko === 0 ? '✅' : '❌'} ${ok} contrôle(s) vert(s), ${ko} rouge(s).`)
  process.exit(ko === 0 ? 0 : 1)
}

await main()
