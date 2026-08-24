// ============================================================================
// RECETTE C4 · L5 — la chaîne de mesure, éprouvée PAR REQUÊTE ET SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Vérifié veut dire PAR REQUÊTE ET SUR PIÈCE, pas supposé. »   — le fait quand
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE — la file, la chaîne, la facture,
// le Monitoring —, avec le client admin. Il ne rejoue pas les tests unitaires :
// il éprouve ce qu'aucun test pur ne peut prouver, la MÉCANIQUE EN BASE.
//
//   A. la file            — mise en file idempotente, réclamation, BAIL
//   B. l'expiration       — un bail qui expire, une reprise, UN SEUL job
//   C. l'idempotence      — une reprise n'écrit JAMAIS une seconde mesure
//   D. la chaîne réelle   — un dépôt de synthèse en classe, un VRAI appel
//                           (l'étage du Monitoring, seul instrument ouvert),
//                           le journal par appel avec sa `phase`, la latence
//   E. la coupure         — plafond atteint → l'interrupteur DE LA CHAÎNE bascule,
//                           le dépôt RESTE EN FILE, rien n'est écrit à moitié
//   F. le nettoyage       — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/chaine-c4l5.mjs [--sans-appel]
//
// `--sans-appel` saute la partie D : aucune requête au fournisseur, aucun coût.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ── L'environnement, avant tout import de code applicatif ──────────────────
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = '/Users/louissagnieres/Documents/GitHub/palimpseste'
const { mettreEnFile, reclamerJobs, etatDesJobs, cleIdempotence, terminerJob } =
  await import(`${RACINE}/utils/chaine/file.ts`)
const { ecrireMesure } = await import(`${RACINE}/utils/chaine/mesures.ts`)
const { traiterDepot, tourDeFile } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const { lireConfig } = await import(`${RACINE}/utils/chaine/config.ts`)
const { competencesOuvertes, verifierCoherence, MANIFESTE_LU } = await import(`${RACINE}/utils/chaine/instruments.ts`)
const { controlerLaFacture } = await import(`${RACINE}/utils/chaine/couts-serveur.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const MARQUE = 'RECETTE-C4L5'
let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const dors = (ms) => new Promise((r) => setTimeout(r, ms))

// ── Le décor : un exercice de SYNTHÈSE EN CLASSE et son dépôt ──────────────
async function semer() {
  const { data: plan } = await admin.from('scriptorium_exercices_planifies')
    .select('id, classe_id:plan_id').eq('type_exercice', 'synthese').limit(1).maybeSingle()
  const { data: type } = await admin.from('exercices_types')
    .select('id').eq('code', 'argument').limit(1).maybeSingle()
  const { data: eleve } = await admin.from('exercices_depots')
    .select('eleve_id').limit(1).maybeSingle()
  if (!plan || !type || !eleve) throw new Error('décor introuvable (plan synthèse, type, élève)')

  const { data: ex, error: eEx } = await admin.from('exercices').insert({
    type_id: type.id, exercice_planifie_id: plan.id, lieu: 'classe',
    consigne_instanciee: { texte: `${MARQUE} — redis en dix lignes ce que tu as retenu du cours.` },
    modes_par_competence: { connaissance: ['composer'] },
    statut: 'assigne', cran: '8',
  }).select('id').single()
  if (eEx) throw new Error(`exercice de recette : ${eEx.message}`)

  const { data: dep, error: eDep } = await admin.from('exercices_depots').insert({
    eleve_id: eleve.eleve_id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis',
    texte_v1: "Je crois avoir compris l'essentiel du cours sur la liberté : Descartes distingue "
      + "la liberté d'indifférence et la liberté éclairée. En revanche ce passage me résiste, "
      + "celui sur la nécessité — je ne comprends pas comment elle peut coexister avec le choix. "
      + "On peut supposer que la nécessité porte sur les causes et non sur la délibération, "
      + "mais je n'en suis pas sûr.",
    confiance_declaree: { connaissance: 'moyenne' },
  }).select('id').single()
  if (eDep) throw new Error(`dépôt de recette : ${eDep.message}`)
  return { exerciceId: ex.id, depotId: dep.id, eleveId: eleve.eleve_id }
}

async function nettoyer(d) {
  if (!d) return
  await admin.from('api_couts').delete().eq('depot_id', d.depotId)
  await admin.from('monitoring_mesures').delete().eq('depot_id', d.depotId)
  // `monitoring_niveaux` est par ÉLÈVE, pas par dépôt : on le remet à ce que le
  // compte réel dit maintenant que les mesures de recette sont parties.
  for (const sd of ['lucidite_incompris', 'calibration_confiance']) {
    const { count } = await admin.from('monitoring_mesures')
      .select('id', { count: 'exact', head: true })
      .eq('eleve_id', d.eleveId).eq('sous_dimension', sd)
    // ⚠️ PAS d'`undefined` ici : `JSON.stringify` supprime la clé, supabase-js
    //    n'envoie pas la colonne, et le PATCH la laisse telle que la recette
    //    l'avait écrite — la sandbox ne revenait pas à son état d'avant.
    const propres = sd === 'lucidite_incompris'
      ? { taux: null, denominateur_fenetre: null, amplitude_courante: null, direction_courante: null }
      : { taux: null, denominateur_fenetre: null }
    await admin.from('monitoring_niveaux')
      .update({ n: count ?? 0, ...propres, updated_at: new Date().toISOString() })
      .eq('eleve_id', d.eleveId).eq('sous_dimension', sd)
  }
  await admin.from('competences_mesures').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_squelettes').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_retours').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_jobs').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_depots').delete().eq('id', d.depotId)
  await admin.from('exercices').delete().eq('id', d.exerciceId)
}

// ── Le décompte des lignes de Monitoring de l'élève, avant / après ─────────
async function niveauxDe(eleveId) {
  const { data } = await admin.from('monitoring_niveaux')
    .select('sous_dimension, n, taux, denominateur_fenetre, amplitude_courante, direction_courante')
    .eq('eleve_id', eleveId)
  return Object.fromEntries((data ?? []).map((l) => [l.sous_dimension, l]))
}

const etatInterrupteur = async () => (await admin.from('scriptorium_params')
  .select('chaine_actif, exercices_actif, routeur_actif, competences_affichage_actif, fabrique_actif')
  .limit(1).maybeSingle()).data

let decor = null
try {
  console.log('\n══ 0. L\'ÉTAT DU JOUR ═══════════════════════════════════════════')
  const ouvertes = competencesOuvertes()
  // ⭐ AMENDÉ PAR C4-L10 (22/08/2026). Cette ligne exigeait ZÉRO compétence
  //    ouverte, et c'était l'état du jour de C4-L5 : le seuil de la dérivation
  //    valait alors *versé et bancé*, qu'aucune fiche ne porte. C4-L10 l'a
  //    descendu à *relu et validé* — un alignement sur le `03-` §9 et le `01-`
  //    §3 — puis a branché l'Expression. Ce qui se vérifie ici n'est donc plus
  //    un COMPTE mais une COHÉRENCE : la chaîne n'ouvre que ce qui est à la
  //    fois dérivé et branché, et elle ne se contredit nulle part.
  dire(verifierCoherence().length === 0,
    `clause granulaire : ${ouvertes.length} compétence(s) ouverte(s) — `
    + `${ouvertes.length ? ouvertes.join(', ') : 'aucune'} — et AUCUN écart de cohérence`)
  dire(MANIFESTE_LU.monitoring.ouvert === true,
    `le Monitoring est ouvert à son statut PLAFOND (v${MANIFESTE_LU.monitoring.version})`)
  const av = await etatInterrupteur()
  dire(av.exercices_actif === false && av.routeur_actif === false
    && av.competences_affichage_actif === false && av.fabrique_actif === false,
    'les quatre interrupteurs existants sont à OFF')
  dire(av.chaine_actif === false, '`chaine_actif` naît à OFF')

  const idParams0 = (await admin.from('scriptorium_params').select('id').limit(1).single()).data.id
  decor = await semer()
  console.log(`  (décor : exercice ${decor.exerciceId}, dépôt ${decor.depotId})`)

  console.log('\n══ A. LA FILE ══════════════════════════════════════════════════')
  const m1 = await mettreEnFile(admin, decor.depotId, 'mesure_v1')
  const m2 = await mettreEnFile(admin, decor.depotId, 'mesure_v1')
  dire(m1.job && !m1.deja, 'un dépôt mis en file crée son job')
  dire(m2.deja && m2.job?.id === m1.job?.id,
    'le remettre en file NE CRÉE PAS un second job — la clé d\'idempotence tient')
  const { count: nJobs } = await admin.from('exercices_jobs')
    .select('id', { count: 'exact', head: true }).eq('depot_id', decor.depotId)
  dire(nJobs === 1, `un seul job en base (${nJobs})`)
  dire(m1.job.cle_idempotence === cleIdempotence(decor.depotId, 'mesure_v1'),
    'la clé d\'idempotence est celle que le code calcule')

  console.log('\n══ B. L\'EXPIRATION, PROVOQUÉE ═════════════════════════════════')
  // Un bail d'une seconde : c'est le job « tué après P1 » du fait quand.
  const pris1 = await reclamerJobs(admin, { limite: 5, bailMs: 1000 })
  dire(pris1.some((j) => j.depot_id === decor.depotId), 'le job se réclame, et prend son bail')
  const pris2 = await reclamerJobs(admin, { limite: 5, bailMs: 1000 })
  dire(!pris2.some((j) => j.depot_id === decor.depotId),
    'tant que le bail court, PERSONNE d\'autre ne le prend')
  await dors(1200)
  const pris3 = await reclamerJobs(admin, { limite: 5, bailMs: 60_000 })
  const repris = pris3.find((j) => j.depot_id === decor.depotId)
  dire(!!repris, 'le bail expiré, LE JOB SE REPREND')
  dire(repris?.tentatives === 2, `la reprise compte une tentative (${repris?.tentatives} — attendu 2)`)
  const { count: nJobs2 } = await admin.from('exercices_jobs')
    .select('id', { count: 'exact', head: true }).eq('depot_id', decor.depotId)
  dire(nJobs2 === 1, `TOUJOURS UN SEUL JOB après la reprise (${nJobs2})`)

  console.log('\n══ B-bis. CE QUE LA REVUE ADVERSARIALE A TROUVÉ ═══════════════')
  {
    // (1) UN ÉCHEC N'EST PAS TERMINAL tant que le plafond n'est pas atteint.
    const j = (await admin.from('exercices_jobs').select('*').eq('depot_id', decor.depotId).single()).data
    await terminerJob(admin, j, { statut: 'echoue', message: 'panne simulée' })
    const apres = (await admin.from('exercices_jobs').select('statut, echec_definitif, tentatives')
      .eq('id', j.id).single()).data
    dire(apres.statut === 'en_attente' && apres.echec_definitif === false,
      `un échec sous le plafond REMET EN FILE (statut « ${apres.statut} », définitif ${apres.echec_definitif}) `
      + `— sinon \`tentatives_max\` ne servait à rien et l'élève voyait « en cours » pour toujours`)
    const repris = await reclamerJobs(admin, { limite: 5, bailMs: 60_000 })
    dire(repris.some((x) => x.depot_id === decor.depotId), 'et il se réclame de nouveau')

    // (2) LE JETON DE BAIL : un ouvrier zombie ne clôt pas le job d'un autre.
    const vivant = (await admin.from('exercices_jobs').select('*').eq('id', j.id).single()).data
    const zombie = { ...vivant, tentatives: vivant.tentatives - 1 }
    const issue = await terminerJob(admin, zombie, { statut: 'abouti', message: 'le zombie' })
    const apresZombie = (await admin.from('exercices_jobs').select('statut, dernier_message')
      .eq('id', j.id).single()).data
    dire(issue.clos === false && apresZombie.statut === 'en_cours',
      `un ouvrier au bail périmé NE CLÔT PAS le job repris par un autre (statut « ${apresZombie.statut} »)`)

    // (3) UN JOB ÉPUISÉ devient VISIBLEMENT définitif, et libère la tête de file.
    await admin.from('exercices_jobs').update({ statut: 'en_cours', tentatives: 3, bail_expire_at: null })
      .eq('id', j.id)
    const apresEpuise = await reclamerJobs(admin, { limite: 5, bailMs: 60_000 })
    const etat = (await admin.from('exercices_jobs').select('statut, echec_definitif')
      .eq('id', j.id).single()).data
    dire(!apresEpuise.some((x) => x.depot_id === decor.depotId)
      && etat.echec_definitif === true && etat.statut === 'echoue',
      `un job épuisé est marqué \`echec_definitif\` et sort du select — sinon il occupait la `
      + `TÊTE DE FILE (tri \`created_at ASC\`) et le tour rendait zéro job`)

    // (4) UNE PANNE LOCALE ne gèle pas la file : le job se clôt, on continue.
    await admin.from('exercices_jobs').update({
      statut: 'en_attente', tentatives: 0, echec_definitif: false, bail_expire_at: null,
    }).eq('id', j.id)
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', idParams0)
    await admin.from('exercices_jobs').update({ etape: 'mesure_vf' }).eq('id', j.id)
    const pris = await reclamerJobs(admin, { limite: 5, bailMs: 60_000 })
    await tourDeFile(admin, pris.filter((x) => x.depot_id === decor.depotId), lireConfig())
    const local = (await admin.from('exercices_jobs').select('statut, echec_definitif, dernier_message')
      .eq('id', j.id).single()).data
    dire(local.statut === 'echoue' && /production en vf/.test(local.dernier_message ?? ''),
      `un dépôt sans version finale CLÔT SON JOB au lieu de le reposer — sinon il revenait en tête `
      + `de file à chaque tour, indéfiniment, et le \`break\` abandonnait tous les autres`)
    await admin.from('exercices_jobs').update({
      etape: 'mesure_v1', statut: 'en_attente', tentatives: 0, echec_definitif: false,
    }).eq('id', j.id)
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', idParams0)
  }

  console.log('\n══ C. UNE REPRISE N\'ÉCRIT JAMAIS UNE SECONDE MESURE ═══════════')
  const ligne = {
    eleve_id: decor.eleveId, competence: 'connaissance', modes: ['composer'],
    lettre_equivalente: 'C', observables: { etendue: 0.5 }, lieu: 'classe', forme: 'formatif',
    genre: null, classe_id: null, sonde_montee: false, distance_contexte: null,
    delai_jours: null, delai_mesures: null, aide_consommee: null,
    depot_id: decor.depotId, bonus: false, instrument_version: 'recette',
  }
  const e1 = await ecrireMesure(admin, ligne)
  const e2 = await ecrireMesure(admin, ligne)   // ← la reprise, avec le MÊME code
  dire(e1.ecrite && !e1.dejaLa, 'la première passe écrit la mesure')
  dire(!e2.ecrite && e2.dejaLa && !e2.erreur,
    'la reprise NE L\'ÉCRIT PAS — l\'index unique la refuse, et c\'est un succès du dispositif')
  const { count: nMes } = await admin.from('competences_mesures')
    .select('id', { count: 'exact', head: true }).eq('depot_id', decor.depotId)
  dire(nMes === 1, `UNE SEULE MESURE au bout (${nMes})`)
  await admin.from('competences_mesures').delete().eq('depot_id', decor.depotId)

  console.log('\n══ D. LA CHAÎNE, EN VRAI ══════════════════════════════════════')
  if (SANS_APPEL) {
    console.log('  (sautée — --sans-appel)')
  } else {
    await admin.from('scriptorium_params').update({ chaine_actif: true })
      .eq('id', (await admin.from('scriptorium_params').select('id').limit(1).single()).data.id)
    const avant = await niveauxDe(decor.eleveId)
    const t0 = Date.now()
    const bilan = await traiterDepot(admin, decor.depotId, 'v1', { config: lireConfig() })
    const duree = Date.now() - t0

    // ⚠️ CES DEUX ASSERTIONS FIGEAIENT LE MONDE D'AVANT C4-L10 — « aucune
    //    compétence n'entre », vrai quand `INSTRUMENTS` était vide. Les six sont
    //    ouvertes depuis le 23/08 : elles ENTRENT. Ce que la clause granulaire
    //    garantit n'est pas le vide, c'est que RIEN NE TOMBE EN SILENCE — une
    //    compétence entre parce qu'elle est ouverte, ou elle est écartée EN
    //    DISANT POURQUOI. On assère donc la règle.
    const ouvertesIci = new Set(competencesOuvertes())
    dire(bilan.competencesMesurees.every((c) => ouvertesIci.has(c)),
      'une compétence n\'entre dans la chaîne QUE si elle est ouverte — la clause granulaire '
      + `tient EN PRODUCTION (mesurées : ${bilan.competencesMesurees.join(', ') || 'aucune'})`)
    dire(bilan.competencesMesurees.length + bilan.competencesEcartees.length > 0,
      'la chaîne a CONSIDÉRÉ au moins une compétence — aucune ne disparaît sans trace')
    dire(bilan.competencesEcartees.every((e) => !!e.motif && e.motif.trim().length > 0),
      `toute compétence écartée DIT POURQUOI (${
        bilan.competencesEcartees.map((e) => e.competence).join(', ') || 'aucune écartée'})`)
    dire(bilan.monitoring.mesures >= 1,
      `l'étage du Monitoring a tourné : ${bilan.monitoring.mesures} mesure(s)`)
    dire(duree < 180_000, `le retour arrive en ${(duree / 1000).toFixed(1)} s — contrat : < 180 s`)

    const { data: mm } = await admin.from('monitoring_mesures')
      .select('sous_dimension, source, observables, amplitude_ecart, direction_ecart, competences_couvertes')
      .eq('depot_id', decor.depotId)
    const lucidite = (mm ?? []).find((l) => l.sous_dimension === 'lucidite_incompris')
    dire(!!lucidite, 'la lucidité est relevée SUR SON SITE — la synthèse en classe')
    dire(lucidite?.source === 'spontanee', `sa \`source\` est \`spontanee\` (${lucidite?.source})`)
    dire(lucidite?.observables?.aveu_incomprehension === 'signale',
      `l'aveu est relevé sur pièce : \`${lucidite?.observables?.aveu_incomprehension}\` `
      + '(la copie porte « ce passage me résiste »)')
    dire(lucidite?.observables?.marquage_supposition === 'distingue',
      `la supposition est relevée : \`${lucidite?.observables?.marquage_supposition}\` `
      + '(la copie porte « on peut supposer que »)')
    // Les deux sous-dimensions « n'ont pas la même forme d'état — leurs colonnes
    // ne se croisent pas » (fiche §3) : l'amplitude n'appartient qu'à la
    // calibration. `n/a` y dit « la table de conversion n'est pas écrite » ;
    // NULL, sur la lucidité, dit que la grandeur n'existe pas pour elle.
    dire(mm.every((l) => (l.sous_dimension === 'calibration_confiance'
      ? l.amplitude_ecart === 'n/a' && l.direction_ecart === 'n/a'
      : l.amplitude_ecart === null && l.direction_ecart === null)),
      'l\'amplitude est `n/a` sur la calibration et NULLE sur la lucidité — les deux formes '
      + 'd\'état ne se croisent pas, y compris dans `monitoring_mesures`')

    // ⚠️ CETTE ASSERTION FIGEAIT UN MONDE, et ce monde a pris fin le 23/08 :
    //    elle disait « AUCUNE mesure de calibration, la Connaissance n'est pas
    //    `evaluee` » — vrai tant que rien ne l'était. Ce que la règle garantit
    //    n'est pas l'absence : c'est que « la calibration NE COMPTE QUE SUR LES
    //    `evaluee` ». On l'écrit donc en BICONDITIONNELLE, vraie dans les deux
    //    mondes. ⛔ Et le statut se lit à sa source unique : la colonne de
    //    `competences_niveaux` est DORMANTE (`c4_statut_recette_global.sql`).
    const calib = (mm ?? []).find((l) => l.sous_dimension === 'calibration_confiance')
    const statutConnaissance = (await admin.from('competences_statut_recette')
      .select('statut_recette').eq('competence', 'connaissance').maybeSingle())
      .data?.statut_recette ?? 'mesuree_silencieusement'
    const connaissanceEvaluee = statutConnaissance === 'evaluee'
    dire(!!calib === connaissanceEvaluee,
      'la calibration NE COMPTE QUE SUR LES `evaluee` — Connaissance '
      + `« ${statutConnaissance} », mesure de calibration ${calib ? 'présente' : 'absente'}`)

    const apres = await niveauxDe(decor.eleveId)
    const nl = apres.lucidite_incompris
    const { count: nMesLuc } = await admin.from('monitoring_mesures')
      .select('id', { count: 'exact', head: true })
      .eq('eleve_id', decor.eleveId).eq('sous_dimension', 'lucidite_incompris')
    // L'invariant, et pas un delta : `n` COMPTE TOUTES LES MESURES de la
    // sous-dimension (§1.4), et il se recalcule en requête, jamais en compteur.
    dire(nl && nl.n === nMesLuc && nMesLuc >= 1,
      `\`monitoring_niveaux.n\` = le compte réel des mesures (n=${nl?.n}, mesures=${nMesLuc}) `
      + `— l'état d'avant portait n=${avant.lucidite_incompris?.n ?? 0}`)
    dire(nl && nl.taux === null && nl.denominateur_fenetre === 0,
      `dénominateur VIDE → taux NULL, jamais 0 (taux=${nl?.taux}, dénominateur=${nl?.denominateur_fenetre})`)
    dire(nl && nl.amplitude_courante === null && nl.direction_courante === null,
      'les colonnes de l\'autre sous-dimension restent NULL — les deux formes ne se croisent pas')

    const { data: couts } = await admin.from('api_couts')
      .select('module, phase, competence, version, modele, cout, tokens_entree, tokens_sortie, tokens_cache_lecture, tokens_cache_ecriture')
      .eq('depot_id', decor.depotId)
    dire((couts ?? []).length === bilan.appels,
      `le nombre d'appels SE LIT AU NOMBRE DE LIGNES : ${couts?.length} ligne(s) pour ${bilan.appels} appel(s)`)
    dire((couts ?? []).every((l) => l.phase === 'p1'),
      'la `phase` dit l\'étage — `p1` pour l\'extraction du Monitoring')
    dire((couts ?? []).every((l) => l.tokens_entree > 0 && l.tokens_sortie > 0),
      'les quatre compteurs de jetons sont renseignés')
    dire((couts ?? []).every((l) => l.modele && l.cout > 0),
      `le modèle et le coût sont journalisés (${couts?.[0]?.modele}, ${couts?.[0]?.cout} $)`)

    // ⚠️ « AUCUN squelette » était vrai quand rien n'entrait dans la chaîne. Ce
    //    que la règle dit du Monitoring n'est pas qu'il n'y ait AUCUN squelette :
    //    c'est qu'IL n'en écrive aucun. Les squelettes présents appartiennent aux
    //    compétences mesurées — jamais à lui.
    const { data: sq } = await admin.from('exercices_squelettes')
      .select('competence').eq('depot_id', decor.depotId)
    dire((sq ?? []).every((x) => x.competence !== 'monitoring'),
      'le Monitoring n\'écrit AUCUN squelette — les '
      + `${(sq ?? []).length} présent(s) sont ceux des compétences mesurées (${
        [...new Set((sq ?? []).map((x) => x.competence))].join(', ') || 'aucune'})`)
    const { count: nMes2 } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).eq('depot_id', decor.depotId)
    dire(nMes2 === 0,
      '`competences_mesures` reste vide : « le Monitoring n\'entre JAMAIS dans competences_mesures »')
  }

  console.log('\n══ E. LA COUPURE AUTOMATIQUE ══════════════════════════════════')
  const idParams = (await admin.from('scriptorium_params').select('id').limit(1).single()).data.id
  await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', idParams)
  // Un plafond d'un millième de cent : la facture du mois le dépasse forcément.
  const verdict = await controlerLaFacture(admin, 0.00001)
  dire(verdict.etat === 'coupure', `l'état de la facture est « ${verdict.etat} »`)
  const apresCoupure = await etatInterrupteur()
  dire(apresCoupure.chaine_actif === false, '`chaine_actif` est basculé à OFF par la coupure')
  dire(apresCoupure.exercices_actif === false && apresCoupure.routeur_actif === false
    && apresCoupure.competences_affichage_actif === false,
    'les TROIS du `07-` §1.5 ne sont PAS touchés — ils restent au professeur')

  const { data: jobAvant } = await admin.from('exercices_jobs')
    .select('id, statut, tentatives').eq('depot_id', decor.depotId).maybeSingle()
  await admin.from('exercices_jobs').update({ statut: 'en_attente', tentatives: 0, bail_expire_at: null })
    .eq('id', jobAvant.id)
  const jobs = await reclamerJobs(admin, { limite: 1, bailMs: 60_000 })
  const sorties = await tourDeFile(admin, jobs.filter((j) => j.depot_id === decor.depotId), lireConfig())
  const { data: jobApres } = await admin.from('exercices_jobs')
    .select('statut, tentatives, echec_definitif, dernier_message').eq('id', jobAvant.id).maybeSingle()
  dire(sorties.every((s) => !s.bilan), 'la chaîne ne traite rien quand elle est coupée')
  dire(jobApres.statut === 'en_attente' && jobApres.echec_definitif === false,
    `LE DÉPÔT RESTE EN FILE (statut « ${jobApres.statut} », échec définitif : ${jobApres.echec_definitif})`)
  dire(jobApres.tentatives === 0,
    `la tentative est RENDUE : la chaîne n'a pas échoué, elle n'a pas eu le droit de tourner (${jobApres.tentatives})`)
  dire(/coup|plafond|OFF/i.test(jobApres.dernier_message ?? ''),
    `le motif est lisible : « ${jobApres.dernier_message} »`)

  const etats = await etatDesJobs(admin, decor.depotId)
  dire(etats.length === 1 && etats[0].etape === 'mesure_v1',
    'l\'état de job est LISIBLE — étape, statut, échec définitif (la part de ce lot dans l\'écran de C4-L3)')

  console.log('\n══ F. LE NETTOYAGE ════════════════════════════════════════════')
  await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', idParams)
  const fin = await etatInterrupteur()
  dire(fin.chaine_actif === false && fin.exercices_actif === false && fin.routeur_actif === false
    && fin.competences_affichage_actif === false && fin.fabrique_actif === false,
    'LES CINQ INTERRUPTEURS SONT À OFF à la fin de la recette')
} catch (e) {
  ko++
  console.error('\n✗ ARRÊT :', e instanceof Error ? e.stack : e)
} finally {
  await nettoyer(decor)
  if (decor) {
    const { count } = await admin.from('exercices_depots')
      .select('id', { count: 'exact', head: true }).eq('id', decor.depotId)
    dire(count === 0, 'le décor de recette est retiré — la sandbox revient à son état d\'avant')
  }
  console.log(`\n═══ ${ok} passés · ${ko} échoués ═══\n`)
  process.exit(ko ? 1 : 0)
}
