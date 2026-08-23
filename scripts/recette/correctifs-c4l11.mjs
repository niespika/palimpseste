// ============================================================================
// RECETTE C4 · L11 — LES CORRECTIFS, ÉPROUVÉS PAR REQUÊTE ET SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Vérifié veut dire PAR REQUÊTE ET À L'ÉCRAN, pas supposé. Pour ce lot en
//   particulier : LE REPLI ALPHABÉTIQUE ET LE `NaN` NE SE VOIENT SUR AUCUN TEST
//   VERT — ils se prouvent en faisant traverser la chaîne à un dépôt réel sur
//   deux compétences, et en lisant ce que le contexte rend. Un lot de correctifs
//   qui rend `npm test` vert sans avoir fait tourner la chaîne n'a rien prouvé. »
//                                                       — le « fait quand »
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE, avec le client admin, sur des
// instances RÉELLES semées puis retirées.
//
//   A. `cible_primaire` — la colonne DESCEND jusqu'à la chaîne (le piège du
//      `select` de `depot.ts`), et elle COMMANDE la cible du retour ;
//   B. les cinq champs qui étaient vides — `cran`, `cranCode`, `regimeV1vf`,
//      `servable`, `patronProduction` — sur une instance de CHACUNE des deux
//      formes d'avant la conversion ;
//   C. la forme unique du `cran`, sous contrainte, éprouvée PAR L'ÉCHEC ;
//   D. le bilan qui compte les appels d'une compétence qui a levé ;
//   E. la garde de budget : la réservation par étape, avant `reclamerJobs` ;
//   F. le nettoyage — tout ce que la recette a semé est retiré.
//
// ⚠️ AUCUN APPEL DE MODÈLE. Ce script n'éprouve que la MÉCANIQUE EN BASE et les
//    lectures ; les appels réels de la chaîne sont ceux de `chaine-c4l5.mjs` et
//    d'`expression-c4l10.mjs`, déjà joués. Rien ici ne coûte un centime.
//
// ⚠️ LES SIX INTERRUPTEURS NE SONT PAS TOUCHÉS — ce script ne bascule rien, et
//    il les re-constate à la fin.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/correctifs-c4l11.mjs
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.env.PALIMPSESTE_RACINE_DEPOT
  || '/Users/louissagnieres/Documents/GitHub/palimpseste'
const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { cibleDuRetour, cibleIndeterminee, alerteDeCoexistence } =
  await import(`${RACINE}/utils/chaine/chaine.ts`)
const { appelsDeLErreur } = await import(`${RACINE}/utils/chaine/couts.ts`)
const { cranNumero, cranEstUnCode } = await import(`${RACINE}/utils/cran.ts`)
const { competencesOuvertes } = await import(`${RACINE}/utils/chaine/instruments.ts`)
const { ciblePrimaireDeLInstance, ciblePrimaireRetenue } =
  await import(`${RACINE}/utils/fabrique/conception.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'RECETTE-C4L11'
let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (t) => console.log(`  ℹ ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 70 - t.length))}`)

const registre = { exercices: [], depots: [] }

// ─────────────────────────────────────────────────────────────────────────────
// LE DÉCOR — deux instances, une par forme d'avant la conversion
// ─────────────────────────────────────────────────────────────────────────────

async function semer() {
  const { data: eleve } = await admin.from('exercices_depots').select('eleve_id').limit(1).maybeSingle()
  if (!eleve) throw new Error('aucun élève avec un dépôt : décor introuvable')

  // `paragraphe` mesure `expression` ET `structure` — les deux compétences que
  // le « fait quand » veut voir se départager.
  const { data: type } = await admin.from('exercices_types')
    .select('id, code, grain').eq('code', 'paragraphe').maybeSingle()
  if (!type) throw new Error('type `paragraphe` introuvable')

  const instances = []
  // ⭐ LES DEUX FORMES D'AVANT LA CONVERSION. Depuis `c4_l11_cran_forme.sql`, la
  //    colonne est un `integer` sous contrainte : on écrit donc le NUMÉRO des
  //    deux côtés, et ce qu'on éprouve est que le cran de CHAQUE FORME D'ORIGINE
  //    — le 6 qui s'écrivait « 6 », et le 8 qui s'écrivait « production_autonome »
  //    — rend aujourd'hui ses cinq champs. C'est le cas qui rendait `NaN`.
  // ⚠️ Le cran 3 s'ajoute pour une raison précise, dite au relevé : `servable` et
  //    `patronProduction` sont MUTUELLEMENT EXCLUSIFS PAR DOCTRINE. Aux trois
  //    crans de PRODUCTION, « les tables “Ce qui est servable ici” n'ont rien à
  //    en dire » (`04-` §14) et c'est le PATRON qui porte la couche type ; aux
  //    six crans qui ISOLENT, c'est l'inverse. Les cinq champs ne peuvent donc
  //    JAMAIS être renseignés ensemble sur une même instance — ce qui se prouve
  //    est qu'AUCUN N'EST VIDE POUR UNE MAUVAISE RAISON, dans les deux régimes.
  for (const [cran, formeDOrigine] of [
    [6, 'le NUMÉRO — cran de PRODUCTION'],
    [8, 'le CODE (`production_autonome`) — cran de PRODUCTION'],
    [3, 'le CODE (`transformation_guidee`) — cran qui ISOLE'],
  ]) {
    const { data: ex, error } = await admin.from('exercices').insert({
      type_id: type.id, lieu: 'maison', statut: 'assigne', cran,
      consigne_instanciee: `${MARQUE} — écris un paragraphe sur la liberté.`,
      modes_par_competence: { expression: ['composer'], structure: ['composer'] },
      // ⭐ LA CIBLE PRIMAIRE, POSÉE SUR LA SECONDE PAR ORDRE ALPHABÉTIQUE :
      //    `expression` < `structure`. Si la colonne ne descend pas jusqu'à la
      //    chaîne, le repli rendrait `expression` — et le défaut serait invisible.
      cible_primaire: 'structure',
    }).select('id').single()
    if (error) throw new Error(`instance (cran ${cran}) : ${error.message}`)
    registre.exercices.push(ex.id)

    const { data: dep, error: eDep } = await admin.from('exercices_depots').insert({
      eleve_id: eleve.eleve_id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis',
      texte_v1: 'La liberté n\'est pas l\'absence de contrainte. Elle suppose au contraire '
        + 'que l\'on sache pourquoi l\'on agit. Un homme qui suit son penchant sans le savoir '
        + 'n\'est pas plus libre qu\'une pierre qui tombe.',
    }).select('id').single()
    if (eDep) throw new Error(`dépôt (cran ${cran}) : ${eDep.message}`)
    registre.depots.push(dep.id)
    instances.push({ exerciceId: ex.id, depotId: dep.id, cran, formeDOrigine })
  }
  return instances
}

async function nettoyer() {
  titre('F. Le nettoyage — tout ce que la recette a semé est retiré')
  for (const id of registre.depots) await admin.from('exercices_depots').delete().eq('id', id)
  for (const id of registre.exercices) await admin.from('exercices').delete().eq('id', id)
  const { count } = await admin.from('exercices')
    .select('id', { count: 'exact', head: true }).ilike('consigne_instanciee', `%${MARQUE}%`)
  dire((count ?? 0) === 0, `aucun reste du décor en base : ${count ?? 0} instance(s)`)
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('════ RECETTE C4 · L11 — LES CORRECTIFS ════')
  note(`compétences OUVERTES à la chaîne : ${JSON.stringify(competencesOuvertes())}`)

  const instances = await semer()

  // ── A. `cible_primaire` ───────────────────────────────────────────────────
  titre('A. `cible_primaire` — elle DESCEND, et elle COMMANDE')

  const ctx0 = await lireContexte(admin, instances[0].depotId)
  dire(ctx0.ciblePrimaire === 'structure',
    'SUR PIÈCE — `lireContexte` rend `ciblePrimaire = structure` : la colonne descend du '
    + `\`select\` de \`depot.ts\` jusqu'à la chaîne (rendu : ${JSON.stringify(ctx0.ciblePrimaire)})`)

  // ⭐ LE DÉPARTAGE, sur DEUX compétences mesurées. `expression` est première par
  //    ordre alphabétique : si la cible est `structure`, c'est que la colonne a
  //    commandé — et rien d'autre ne pouvait la rendre.
  const deux = ['expression', 'structure']
  dire(cibleDuRetour(ctx0, deux) === 'structure',
    'LE DÉPARTAGE — sur deux compétences mesurées, la cible est `structure`, la SECONDE par '
    + `ordre alphabétique : la \`cible_primaire\` commande (rendu : ${cibleDuRetour(ctx0, deux)})`)
  dire(cibleIndeterminee(ctx0, deux) === false,
    "L'ALERTE NE SE LÈVE PLUS quand la `cible_primaire` porte : le repli n'a pas servi")

  // Et sans la colonne : le repli reprend, avec son alerte.
  const sansCible = { ...ctx0, ciblePrimaire: null }
  dire(cibleDuRetour(sansCible, deux) === 'expression',
    'SANS `cible_primaire` ni décision, le repli ALPHABÉTIQUE reprend — et rend `expression`')
  dire(cibleIndeterminee(sansCible, deux) === true,
    "…et L'ALERTE SE LÈVE : « elle ne se supprime pas, elle se resserre »")
  dire(cibleIndeterminee(sansCible, ['expression']) === false,
    "…mais jamais sur UNE SEULE compétence : rien n'est indéterminé quand il n'y a rien à départager")

  // ── LA PREMIÈRE BRANCHE EST DORMANTE, ET ON LE CONSTATE PLUTÔT QUE DE LE TAIRE
  // ⚠️⚠️ RIEN NE PERSISTE DE DÉCISION DE ROUTEUR. Le moteur est écrit et éprouvé
  //    (`utils/routeur/`, fonctions pures), mais aucun code n'écrit
  //    `routeur_decisions.cible_retenue` ni `exercices_depots.routeur_decision_id`.
  //    Les deux contrôles qui suivent tournent donc sur un contexte SYNTHÉTIQUE —
  //    et ils le disent, pour que personne ne les lise comme un chemin vivant.
  const { count: nDecisions } = await admin.from('routeur_decisions')
    .select('id', { count: 'exact', head: true }).not('cible_retenue', 'is', null)
  const { count: nDepotsDecides } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true }).not('routeur_decision_id', 'is', null)
  dire((nDecisions ?? 0) === 0 && (nDepotsDecides ?? 0) === 0,
    `CONSTAT — la branche « décision du routeur » est DORMANTE : ${nDecisions ?? 0} décision(s) `
    + `portant une cible, ${nDepotsDecides ?? 0} dépôt(s) en portant une. ⭐ Donc AVANT ce lot, `
    + '100 % des dépôts tombaient sur le repli alphabétique — la `cible_primaire` est aujourd\'hui '
    + 'le SEUL domicile qui puisse l\'empêcher.')

  // La DÉCISION du routeur passe devant, et la coexistence SE DIT.
  // ⚠️ SYNTHÉTIQUE — voir le constat ci-dessus : ce contexte n'existe pas en base.
  const avecDecision = { ...ctx0, decision: { ...ctx0.decision, cibleRetenue: 'expression' } }
  dire(cibleDuRetour(avecDecision, deux) === 'expression',
    "L'ORDRE DE LECTURE tient (contexte SYNTHÉTIQUE) : la DÉCISION du routeur passe devant la "
    + '`cible_primaire`')
  const coex = alerteDeCoexistence(avecDecision)
  dire(typeof coex === 'string' && coex.includes('COEXISTENCE'),
    'LA COEXISTENCE QUE LA SOURCE DIT IMPOSSIBLE SE DIT (contexte SYNTHÉTIQUE), elle ne se '
    + "tranche pas en silence — garde posée d'avance, jamais vue tomber en vrai")
  dire(alerteDeCoexistence(ctx0) === null,
    "…et elle ne se dit QUE là : pas d'alerte quand il n'y a pas de décision")

  // ⭐ La règle de l'écran : « quand il n'y en a qu'une possible, l'écran la pose
  //    sans la demander ». Un champ toujours affiché serait un écart à la source.
  const rProduire2 = ciblePrimaireDeLInstance({
    geste: 'produire', observableCompetence: null, competences: ['expression', 'structure'] })
  dire(rProduire2.demande === true && rProduire2.candidates.length === 2,
    "L'ÉCRAN DEMANDE quand il y a un choix : produire × 2 compétences → 2 candidates")
  const rProduire1 = ciblePrimaireDeLInstance({
    geste: 'produire', observableCompetence: null, competences: ['expression'] })
  dire(rProduire1.demande === false && rProduire1.imposee === 'expression',
    "L'ÉCRAN NE DEMANDE PAS quand l'instance ne mesure qu'une compétence")
  const rIsole = ciblePrimaireDeLInstance({
    geste: 'diagnostiquer', observableCompetence: 'structure',
    competences: ['expression', 'structure'] })
  dire(rIsole.demande === false && rIsole.imposee === 'structure',
    "L'ÉCRAN NE DEMANDE PAS à un cran qui ISOLE : « l'instance n'a qu'une cible » (01- §5)")
  dire(ciblePrimaireRetenue(rProduire2, 'connaissance') === null,
    "LE SERVEUR RE-DÉRIVE : un choix hors des compétences mesurées est écarté, pas écrit")

  // ── B. les cinq champs qui étaient vides ──────────────────────────────────
  titre('B. Les cinq champs — sur une instance de CHACUNE des deux formes')
  for (const inst of instances) {
    const ctx = await lireContexte(admin, inst.depotId)
    const cinq = {
      cran: ctx.cran, cranCode: ctx.cranCode, regimeV1vf: ctx.regimeV1vf,
      servable: ctx.servable.length, patronProduction: ctx.patronProduction,
    }
    // Les trois qui doivent TOUJOURS être là, quel que soit le cran.
    dire(ctx.cran != null && !!ctx.cranCode && !!ctx.regimeV1vf,
      `cran ${inst.cran} (${inst.formeDOrigine}) — ${JSON.stringify(cinq)}`)
    dire(!Number.isNaN(ctx.cran),
      `cran ${inst.cran} — \`cran\` n'est PAS NaN : c'est ${JSON.stringify(ctx.cran)}`)
    // ⭐ Et la COUCHE TYPE est portée, par l'un OU par l'autre — jamais par les
    //    deux, et jamais par aucun : c'est le partage du `04-` §14.
    const isole = [1, 3, 4, 5, 7, 9].includes(inst.cran)
    dire(isole ? (ctx.servable.length > 0 && ctx.patronProduction === null)
      : (ctx.servable.length === 0 && !!ctx.patronProduction),
      `cran ${inst.cran} — la couche type est portée par `
      + `${isole ? '`servable` SEUL (le cran isole)' : '`patronProduction` SEUL (cran de production)'}`
      + ' — le partage du `04-` §14, jamais un trou')
  }

  // ── C. la forme du `cran`, éprouvée PAR L'ÉCHEC ───────────────────────────
  titre('C. La forme du `cran` — une seule, et la contrainte la tient')
  const { data: formes } = await admin.from('exercices').select('cran')
  const valeurs = (formes ?? []).map((r) => r.cran)
  dire(valeurs.every((v) => v === null || (typeof v === 'number' && v >= 1 && v <= 9)),
    `EN BASE — les ${valeurs.length} crans sont des NUMÉROS de 1 à 9 (ou NULL) : `
    + `${JSON.stringify([...new Set(valeurs)].sort())}`)

  const { data: t } = await admin.from('exercices_types').select('id').eq('code', 'paragraphe').maybeSingle()
  const { error: eForme } = await admin.from('exercices').insert({
    type_id: t.id, lieu: 'maison', statut: 'a_concevoir', cran: 42,
    consigne_instanciee: `${MARQUE} — épreuve par l'échec`,
  }).select('id')
  dire(!!eForme && String(eForme.message).includes('exercices_cran_forme_chk'),
    `PAR L'ÉCHEC — un cran hors de 1–9 est REFUSÉ par la contrainte de forme `
    + `(${eForme ? eForme.code : 'AUCUNE ERREUR — la garde ne tient pas'})`)

  const { error: eCode } = await admin.from('exercices').insert({
    type_id: t.id, lieu: 'maison', statut: 'a_concevoir', cran: 'production_autonome',
    consigne_instanciee: `${MARQUE} — épreuve par l'échec, l'ancienne forme`,
  }).select('id')
  dire(!!eCode,
    `PAR L'ÉCHEC — l'ANCIENNE FORME (un code) est refusée : la base ne porte plus deux formes `
    + `(${eCode ? eCode.code : 'AUCUNE ERREUR — la conversion ne tient pas'})`)

  dire(cranNumero(6) === 6 && cranNumero('6') === 6 && cranNumero('') === null
    && cranNumero('production_autonome') === null && cranNumero(0) === null && cranNumero(10) === null,
    '`cranNumero` ne rend jamais NaN ni 0 : un cran, ou `null`')
  dire(cranEstUnCode('production_autonome') && !cranEstUnCode('6') && !cranEstUnCode(null),
    '`cranEstUnCode` distingue « pas de cran » de « un cran dans l’ancienne forme »')

  // ── D. le bilan qui perd les appels ───────────────────────────────────────
  titre('D. Le bilan — les appels d’une compétence qui a levé ne se perdent plus')
  class SortieNonConformeFactice extends Error {
    constructor(appels) { super('sortie non conforme'); this.appels = appels }
  }
  dire(appelsDeLErreur(new SortieNonConformeFactice(3)) === 3,
    'une erreur qui PORTE ses appels les rend : 3 appels comptés, pas jetés')
  dire(appelsDeLErreur(new Error('bug')) === 0,
    "une erreur qui n'en porte pas rend 0 : elle n'a rien dépensé au modèle")

  // ── E. la garde de budget ─────────────────────────────────────────────────
  titre('E. La garde de budget — la RÉSERVATION, avant `reclamerJobs`')
  const source = fs.readFileSync(`${RACINE}/app/api/chaine/route.ts`, 'utf-8')
  const sansCommentaires = source.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')
  dire(sansCommentaires.includes('reserveDeLEtape'),
    'SUR PIÈCE — la route calcule une RÉSERVE PAR ÉTAPE')
  dire(sansCommentaires.indexOf('reserveDeLEtape(e, config.latenceCibleMs)')
    < sansCommentaires.indexOf('await reclamerJobs'),
    'SUR PIÈCE — la réserve est comparée au reste AVANT `reclamerJobs`, jamais après')
  dire(sansCommentaires.includes('tuesEnVol: reclames - traites'),
    'SUR PIÈCE — la réponse porte le COMPTEUR : « une invocation qui traite n jobs doit avoir '
    + 'réclamé n jobs »')
  dire(/export const maxDuration = 300\b/.test(sansCommentaires),
    '`maxDuration` est à 300 s — au-dessus du contrat de trois minutes')
  const vercel = JSON.parse(fs.readFileSync(`${RACINE}/vercel.json`, 'utf-8'))
  const cron = (vercel.crons ?? []).find((c) => c.path === '/api/chaine')
  dire(!!cron && cron.schedule === '* * * * *',
    `SUR PIÈCE — une tâche planifiée VISE la route : ${cron ? cron.schedule : 'AUCUNE'}`)

  // ── Les six interrupteurs, re-constatés ───────────────────────────────────
  titre('Les six interrupteurs — re-constatés')
  const { data: p } = await admin.from('scriptorium_params')
    .select('exercices_actif, routeur_actif, competences_affichage_actif, chaine_actif, '
      + 'passation_classe_actif, fabrique_actif').eq('id', 1).maybeSingle()
  const tousOff = Object.values(p ?? {}).every((v) => v === false)
  dire(tousOff, `les six sont à OFF : ${JSON.stringify(p)}`)

  await nettoyer()

  console.log(`\n════ ${ok} passé(s), ${ko} échoué(s) ════`)
  process.exit(ko === 0 ? 0 : 1)
}

try {
  await main()
} catch (e) {
  console.error('\n✗ LA RECETTE A LEVÉ :', e)
  await nettoyer().catch(() => {})
  process.exit(1)
}
