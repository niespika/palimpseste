// ============================================================================
// RECETTE C4 · L10 — UNE COMPÉTENCE OUVERTE, ÉPROUVÉE PAR REQUÊTE ET SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Un dépôt réel traverse la chaîne et écrit UN SQUELETTE, UNE MESURE ET SA
//   LETTRE-ÉQUIVALENTE. »                        — le « fait quand » de C4-L10
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE, avec le client admin. Il ne
// rejoue pas les tests unitaires — ceux-là confrontent le portage au module de
// calibration, sans base et sans appel. Il éprouve ce qu'aucun test pur ne peut
// prouver : QU'UNE MESURE S'ÉCRIT VRAIMENT.
//
//   A. l'état du jour     — la cohérence, ce qui est ouvert, ce qui attend
//   B. le décor           — un exercice de la maison qui mesure l'Expression
//   C. les slots          — le prompt assemblé, ses blocs balisés, sa tête
//                           cachable, et PLUS AUCUN `{copie}` littéral
//   D. la chaîne réelle   — deux vrais appels, un squelette, une mesure, sa
//                           lettre, ses NEUF observables, le journal par phase
//   E. l'idempotence      — une reprise n'écrit JAMAIS une seconde mesure
//   F. le nettoyage       — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/expression-c4l10.mjs [--sans-appel | --retire]
//
// `--sans-appel` saute la partie D : aucune requête au fournisseur, aucun coût.
// `--retire`     ne fait que le geste symétrique : il retire un décor laissé.
//
// ⛔ CE SCRIPT NE POSE AUCUN STATUT DE RECETTE, ET N'EN PROPOSE AUCUN. Le
//    professeur choisit, à l'écran de C4-L8. Une compétence naît
//    `mesuree_silencieusement` — « l'oubli n'envoie jamais un verdict faux à un
//    élève » —, et c'est exactement ce que cette recette vérifie : elle mesure,
//    elle écrit, ET AUCUNE LETTRE N'EST SERVIE À PERSONNE.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ── L'environnement, avant tout import de code applicatif ──────────────────
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = '/Users/louissagnieres/Documents/GitHub/palimpseste'
const { traiterDepot } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const {
  competencesOuvertes, competencesEnAttenteDeBranchement, etatCompetence, verifierCoherence,
  valeursDesParametres,
} = await import(`${RACINE}/utils/chaine/instruments.ts`)
const { separerTete, messageDuGabarit, slotsDu } = await import(`${RACINE}/utils/chaine/slots.ts`)
const { lireStatutsRecette } = await import(`${RACINE}/utils/chaine/contexte.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const RETIRE_SEUL = process.argv.includes('--retire')
const MARQUE = 'RECETTE-C4L10'
let ok = 0

// ⛔ LE STATUT DE RECETTE NE SE LIT PLUS DANS `competences_niveaux` : cette
//    colonne est DORMANTE depuis `c4_statut_recette_global.sql` — le statut est
//    GLOBAL, une ligne par compétence dans `competences_statut_recette`.
// ⚠️ ET L'ASSERTION DE CLÔTURE A CHANGÉ DE FORME. Elle disait « AUCUN statut
//    `evaluee` n'a été posé » — vrai quand rien ne l'était, FAUX depuis que le
//    professeur les a posés délibérément (23/08). Ce que la recette doit
//    garantir n'est pas que le statut soit d'une valeur : c'est qu'ELLE N'Y AIT
//    PAS TOUCHÉ. On le mesure donc par un AVANT/APRÈS, pas par une constante.
const statutDEntree = (await admin.from('competences_statut_recette')
  .select('statut_recette').eq('competence', 'expression').maybeSingle()).data?.statut_recette ?? null
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)

// ── La copie de recette. Elle est écrite POUR PORTER DES FAITS DE LANGUE ───
// que le catalogue du §3 nomme : de l'oral transcrit, des passe-partout, une
// répétition pauvre, une phrase qui part de travers. Elle n'est pas une copie
// d'élève réelle — les copies-tests ne sortent jamais de leur dépôt, et « jeu de
// test intouchable » vaut aussi dans l'autre sens.
const COPIE = [
  "La liberté c'est quelque chose d'important pour les gens qui veulent faire "
  + "des choses. En voulant être libre sans contraintes, la société ne peut pas "
  + "fonctionner correctement. Du coup on peut dire que la liberté elle a des "
  + 'limites.',
  "Les gens qui sont en colère ils font des choses qu'ils regrettent après. "
  + "C'est pour ça qu'il faut faire attention à ce qu'on fait quand on fait "
  + 'quelque chose. La chose la plus importante est de faire les choses bien.',
].join('\n\n')

// ── Le décor ────────────────────────────────────────────────────────────────
async function semer() {
  const { data: type } = await admin.from('exercices_types')
    .select('id, code, crans_admis, competences').eq('code', 'paragraphe').maybeSingle()
  if (!type) throw new Error('décor introuvable : le type `paragraphe` n\'est pas au seed')
  if (!(type.competences ?? []).includes('expression')) {
    throw new Error('le type `paragraphe` ne mesure pas l\'Expression')
  }
  const { data: eleve } = await admin.from('exercices_depots')
    .select('eleve_id').limit(1).maybeSingle()
  if (!eleve) throw new Error('décor introuvable : aucun élève avec un dépôt')

  const { data: ex, error: eEx } = await admin.from('exercices').insert({
    type_id: type.id, lieu: 'maison',
    // ⚠️ La consigne est CE QUE LE SLOT `{sujet}` recevra : la table `exercices`
    //    porte la consigne instanciée et la PROVENANCE de ses matériaux, jamais
    //    le texte d'un sujet distinct (`07-` §1.1).
    consigne_instanciee: {
      texte: `${MARQUE} — rédige un paragraphe qui défend une thèse sur la liberté.`,
    },
    modes_par_competence: { expression: ['composer'] },
    statut: 'assigne',
    // Un cran de PRODUCTION (2, 6 ou 8) : « dès que l'élève écrit, sa langue est
    // mesurable, et un cran de production le fait toujours écrire » (fiche §6).
    cran: '6',
  }).select('id').single()
  if (eEx) throw new Error(`exercice de recette : ${eEx.message}`)

  const { data: dep, error: eDep } = await admin.from('exercices_depots').insert({
    eleve_id: eleve.eleve_id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis',
    texte_v1: COPIE,
  }).select('id').single()
  if (eDep) throw new Error(`dépôt de recette : ${eDep.message}`)
  return { exerciceId: ex.id, depotId: dep.id, eleveId: eleve.eleve_id }
}

/** Le geste symétrique. Un décor semé se retire — même si le tour a cassé. */
async function nettoyer(d) {
  if (!d) return
  await admin.from('api_couts').delete().eq('depot_id', d.depotId)
  await admin.from('monitoring_mesures').delete().eq('depot_id', d.depotId)
  await admin.from('competences_mesures').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_squelettes').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_retours').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_jobs').delete().eq('depot_id', d.depotId)
  await admin.from('exercices_depots').delete().eq('id', d.depotId)
  await admin.from('exercices').delete().eq('id', d.exerciceId)
}

/** Retrouve un décor laissé par un tour précédent, par sa MARQUE. */
async function decorLaisse() {
  const { data } = await admin.from('exercices')
    .select('id, consigne_instanciee, exercices_depots(id, eleve_id)')
  const trouves = (data ?? []).filter((e) =>
    JSON.stringify(e.consigne_instanciee ?? {}).includes(MARQUE))
  return trouves.flatMap((e) => (e.exercices_depots ?? []).map((d) => ({
    exerciceId: e.id, depotId: d.id, eleveId: d.eleve_id,
  })).concat(e.exercices_depots?.length ? [] : [{ exerciceId: e.id, depotId: null, eleveId: null }]))
}

const etatInterrupteur = async () => (await admin.from('scriptorium_params')
  .select('id, chaine_actif').limit(1).maybeSingle()).data

// ── LE TOUR ─────────────────────────────────────────────────────────────────

if (RETIRE_SEUL) {
  const laisses = await decorLaisse()
  for (const d of laisses) {
    if (d.depotId) await nettoyer(d)
    else await admin.from('exercices').delete().eq('id', d.exerciceId)
  }
  console.log(`\n— décor retiré : ${laisses.length} entrée(s) portant « ${MARQUE} ».`)
  process.exit(0)
}

let decor = null
const paramsAvant = await etatInterrupteur()
try {
  console.log('\n══ A. L\'ÉTAT DU JOUR ═══════════════════════════════════════════')
  const ecarts = verifierCoherence()
  dire(ecarts.length === 0, `\`verifierCoherence()\` ne rend AUCUN écart${
    ecarts.length ? ` — ${ecarts.join(' | ')}` : ''}`)
  const ouvertes = competencesOuvertes()
  dire(ouvertes.includes('expression'),
    `l'Expression est OUVERTE à la chaîne — ouvertes : ${ouvertes.join(', ') || 'aucune'}`)
  const attente = competencesEnAttenteDeBranchement()
  note(`en attente de branchement (C4-L10 se rejoue pour elles) : ${attente.join(', ') || 'aucune'}`)
  const etat = etatCompetence('expression')
  dire(etat.instrument?.version === '3.2',
    `l'instrument dérivé porte la VERSION DE LA FICHE : ${etat.instrument?.version}`)
  dire(Object.keys(etat.instrument?.observables_mesure ?? {}).length === 9,
    `neuf observables de télémétrie au bloc machine (§5) : ${
      Object.keys(etat.instrument?.observables_mesure ?? {}).length}`)
  dire(paramsAvant?.chaine_actif === false, '`chaine_actif` est à OFF avant la recette')

  console.log('\n══ B. LE DÉCOR ═════════════════════════════════════════════════')
  decor = await semer()
  note(`exercice ${decor.exerciceId.slice(0, 8)} · dépôt ${decor.depotId.slice(0, 8)} `
    + `· élève ${decor.eleveId.slice(0, 8)}`)
  const statuts = await lireStatutsRecette(admin, decor.eleveId)
  // ⚠️ CETTE ASSERTION FIGEAIT UNE VALEUR — « NAÎT `mesuree_silencieusement` » —
  //    vraie tant que le professeur n'avait rien posé. Il a posé les six le
  //    23/08. Ce que le script doit garantir n'est pas la VALEUR du statut,
  //    c'est qu'IL N'Y TOUCHE PAS : c'est l'avant/après de la clôture qui le
  //    prouve. Ici, on se contente de DIRE ce qu'on a lu.
  note(`statut de recette lu pour l'Expression : \`${statuts.expression}\` — ce script n'en `
    + 'pose aucun, le professeur choisit (`01-` §3 ; `03-` §9)')

  console.log('\n══ C. LES SLOTS ════════════════════════════════════════════════')
  // Les mêmes fonctions que la chaîne, sur les mêmes entrées — et sans appel.
  const branchement = etat.branchement
  const ctx = {
    modes: ['composer'], cran: '6', referent: null, exceptionOrthographe: false,
    contexteExercice: {
      sujet: `${MARQUE} — rédige un paragraphe qui défend une thèse sur la liberté.`,
      consigne: `${MARQUE} — rédige un paragraphe qui défend une thèse sur la liberté.`,
      copie: COPIE, mode: 'composer',
    },
    prives: {}, sorties: {}, parametres: valeursDesParametres(etat.instrument),
  }
  const spec = branchement.extractions(ctx)[0]
  const gabarit = etat.instrument.prompts[spec.tetePrompt]
  const { tete, queue } = separerTete(gabarit)
  const fournis = spec.pre(ctx)
  const valeurs = {}
  for (const nom of slotsDu(gabarit)) valeurs[nom] = fournis[nom] ?? ctx.contexteExercice[nom] ?? ''
  const message = messageDuGabarit(queue, valeurs, 'Rends le relevé au format déclaré ci-dessus.')

  dire(slotsDu(tete).length === 0 && tete.length > 1000,
    `LA TÊTE NE PORTE AUCUN SLOT et fait ${tete.length} caractères — elle est identique d'une `
    + 'copie à l\'autre, donc elle se cache')
  dire(!message.includes('{copie}') && !message.includes('{pre_releve}')
    && !message.includes('{sujet}'),
    'AUCUN SLOT LITTÉRAL ne subsiste dans le message — avant ce lot, le modèle recevait la '
    + 'chaîne « {copie} »')
  dire(message.includes('<<<MATERIAU') && message.includes('MATERIAU>>>'),
    'la copie, le pré-relevé et le sujet arrivent EN BLOCS BALISÉS (`01-` §12, défense 1)')
  dire(message.includes('[¶1]') && message.includes('[1] La liberté'),
    'LA COPIE QUE P1 LIT EST RENUMÉROTÉE — les numéros de phrase du relevé s\'y réfèrent')
  dire(message.indexOf('MATÉRIAU — LECTURE SEULE.') < message.indexOf('<<<MATERIAU'),
    'la déclaration de matériau PRÉCÈDE les blocs qu\'elle déclare')
  const specP2 = branchement.jugement(ctx)
  dire(slotsDu(etat.instrument.prompts[specP2.tetePrompt]).length === 1,
    'le prompt de jugement porte UN SEUL slot : c\'est le document, sans déclaration')

  if (SANS_APPEL) {
    console.log('\n══ D. LA CHAÎNE RÉELLE — SAUTÉE (--sans-appel) ═════════════════')
    note('aucune requête au fournisseur, aucun coût. La mesure ne s\'écrit donc pas : '
      + 'c\'est le drapeau, pas une panne.')
  } else {
    console.log('\n══ D. LA CHAÎNE RÉELLE ════════════════════════════════════════')
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const t0 = Date.now()
    const bilan = await traiterDepot(admin, decor.depotId, 'v1')
    const duree = Date.now() - t0
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)

    note(`bilan : ${bilan.appels} appel(s), ${duree} ms, mesures écrites ${bilan.mesuresEcrites}`)
    for (const a of bilan.alertes) note(`alerte : ${a}`)
    for (const e of bilan.competencesEcartees) note(`écartée — ${e.competence} : ${e.motif}`)

    dire(bilan.competencesMesurees.includes('expression'),
      `l'Expression est MESURÉE : ${bilan.competencesMesurees.join(', ') || 'aucune'}`)

    // ── LE SQUELETTE ────────────────────────────────────────────────────────
    const { data: sq } = await admin.from('exercices_squelettes')
      .select('competence, version, artefact_extraction, artefact_jugement, instrument_version, modele')
      .eq('depot_id', decor.depotId)
    dire((sq ?? []).length === 1, `UN squelette, et un seul : ${(sq ?? []).length}`)
    const s0 = (sq ?? [])[0]
    dire(!!s0?.artefact_extraction && !!s0?.artefact_jugement,
      'le squelette porte SES DEUX artefacts — l\'extraction et le jugement')
    dire(s0?.instrument_version === '3.2',
      `\`instrument_version\` EST la ligne VERSION de la fiche : ${s0?.instrument_version}`)
    note(`relevé de P1 : ${JSON.stringify(s0?.artefact_extraction).slice(0, 200)}…`)
    note(`jugement de P2 : ${JSON.stringify(s0?.artefact_jugement).slice(0, 200)}…`)

    // ── LA MESURE, ET SA LETTRE ─────────────────────────────────────────────
    const { data: me } = await admin.from('competences_mesures')
      .select('competence, lettre_equivalente, observables, modes, lieu, forme, instrument_version, delta_v1_vf')
      .eq('depot_id', decor.depotId)
    dire((me ?? []).length === 1, `UNE mesure, et une seule : ${(me ?? []).length}`)
    const m0 = (me ?? [])[0]
    dire(['E', 'D', 'C', 'B', 'A'].includes(m0?.lettre_equivalente),
      `LA LETTRE-ÉQUIVALENTE est un palier du référentiel : « ${m0?.lettre_equivalente} »`)
    dire(m0?.delta_v1_vf === null,
      '`delta_v1_vf` est NULL — et NULL n\'est pas 0 : il n\'y a pas de version finale')

    // ── LES NEUF OBSERVABLES ────────────────────────────────────────────────
    const NEUF = Object.keys(etat.instrument.observables_mesure).sort()
    const obs = m0?.observables ?? {}
    dire(Object.keys(obs).sort().join(',') === NEUF.join(','),
      `les NEUF observables du §5 sont écrits : ${Object.keys(obs).sort().join(', ')}`)
    const nas = NEUF.filter((c) => obs[c] === 'n/a')
    note(`valeurs : ${NEUF.map((c) => `${c}=${JSON.stringify(obs[c])}`).join(' · ')}`)
    dire(nas.length === 0,
      nas.length ? `⚠️ ${nas.length} observable(s) à \`n/a\` : ${nas.join(', ')} — chacun doit `
        + 'porter son alerte nommée au bilan' : 'AUCUN observable ne sort en `n/a` sur cette copie')

    // ── LE JOURNAL, PAR APPEL ET PAR PHASE ──────────────────────────────────
    const { data: co } = await admin.from('api_couts')
      .select('phase, competence, version, modele, tokens_entree, tokens_sortie')
      .eq('depot_id', decor.depotId)
    const phases = (co ?? []).map((c) => c.phase).sort()
    // ⚠️ UNE LIGNE PAR APPEL, ET NON PAR PHASE. « La `phase` dit l'étage, pas le
    //    nombre d'appels » (`07-` §1.2) : une sortie refusée est RELANCÉE, et
    //    l'appel refusé a coûté — « un coût qu'on ne journalise pas est un coût
    //    qu'on ne verra jamais ». Deux lignes en `p2` disent donc une relance,
    //    pas un défaut de comptage.
    dire(phases.filter((p) => p === 'p1').length >= 1 && phases.filter((p) => p === 'p2').length >= 1,
      `le journal porte UNE LIGNE PAR APPEL, avec sa phase : ${phases.join(', ')}`)
    // Trois lignes attendues quand le retour part : p1, p2, retour. Au-delà,
    // ce sont des RELANCES — une sortie refusée puis redemandée.
    const relances = phases.length - new Set(phases).size
    if (relances > 0) {
      note(`⚠️ ${relances} relance(s) : une sortie a été refusée puis redemandée. Le coût du `
        + "refus est journalisé — « un coût qu'on ne journalise pas est un coût qu'on ne verra "
        + 'jamais ».')
    }
    dire(bilan.retourEcrit || bilan.alertes.some((a) => a.startsWith('retour refusé')),
      `le retour est ${bilan.retourEcrit ? 'ENGENDRÉ ET ÉCRIT' : 'REFUSÉ AVEC SON MOTIF'} — `
      + 'jamais écrit à moitié, jamais tu')
    if (!bilan.retourEcrit) {
      note('⚠️ RELEVÉ — le retour est refusé, et LA MESURE EST ÉCRITE QUAND MÊME : la chaîne '
        + 'dégrade proprement. Voir le relevé de séance : la règle 2 de Calame exige de '
        + "COMMENCER PAR UNE RÉUSSITE CITÉE, la règle 1 interdit d'en inventer une, et cette "
        + "copie n'en porte aucune au relevé.")
    }
    dire((co ?? []).every((c) => c.competence === 'expression' && c.version === 'v1'),
      'chaque ligne de coût est rattachée à SON exercice — dépôt, compétence, version')

    // ── E. L'IDEMPOTENCE ────────────────────────────────────────────────────
    console.log('\n══ E. L\'IDEMPOTENCE ═══════════════════════════════════════════')
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const bis = await traiterDepot(admin, decor.depotId, 'v1')
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)
    const { count: nMesures } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).eq('depot_id', decor.depotId)
    const { count: nSquelettes } = await admin.from('exercices_squelettes')
      .select('id', { count: 'exact', head: true }).eq('depot_id', decor.depotId)
    dire(nMesures === 1, `UNE reprise n'écrit JAMAIS une seconde mesure : ${nMesures}`)
    dire(nSquelettes === 1,
      `l'index unique (dépôt × compétence × version) tient : ${nSquelettes} squelette(s)`)
    note(`la reprise a compté ${bis.mesuresDejaLa} mesure(s) déjà là`)
  }
} catch (e) {
  ko++
  console.error(`\n✗ LE TOUR A CASSÉ : ${e?.message ?? e}`)
  if (e?.stack) console.error(e.stack.split('\n').slice(1, 5).join('\n'))
} finally {
  console.log('\n══ F. LE NETTOYAGE ═════════════════════════════════════════════')
  await nettoyer(decor)
  const restes = await decorLaisse()
  dire(restes.length === 0, `le décor semé est RETIRÉ — restes portant « ${MARQUE} » : ${restes.length}`)
  const apres = await etatInterrupteur()
  dire(apres?.chaine_actif === false, '`chaine_actif` est REVENU à OFF')
  const statutDeSortie = (await admin.from('competences_statut_recette')
    .select('statut_recette').eq('competence', 'expression').maybeSingle()).data?.statut_recette ?? null
  dire(statutDeSortie === statutDEntree,
    `LA RECETTE N'A PAS TOUCHÉ AU STATUT DE l'Expression — ni « pour tester » : `
    + `${statutDEntree} à l'entrée, ${statutDeSortie} à la sortie`)
}

console.log(`\n══ ${ko === 0 ? 'RECETTE VERTE' : 'RECETTE ROUGE'} — ${ok} vert(s), ${ko} rouge(s) ══\n`)
process.exit(ko === 0 ? 0 : 1)
