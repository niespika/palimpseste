// ============================================================================
// RECETTE C4 · L10 · ARGUMENTATION — LA DEUXIÈME COMPÉTENCE, ÉPROUVÉE SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Un dépôt réel traverse la chaîne et écrit UN SQUELETTE, UNE MESURE ET SA
//   LETTRE-ÉQUIVALENTE. »                        — le « fait quand » de C4-L10
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE, avec le client admin. Il ne
// rejoue pas les tests unitaires — ceux-là confrontent le portage au module de
// calibration, sans base et sans appel. Il éprouve ce qu'aucun test pur ne peut
// prouver : QU'UNE MESURE S'ÉCRIT VRAIMENT.
//
// ⭐⭐ ET IL ÉPROUVE UNE CHOSE DE PLUS QUE SON AÎNÉ, PARCE QU'IL EST LE DEUXIÈME.
//    L'alerte de repli alphabétique « mord à la deuxième compétence branchée » ;
//    sa condition de fermeture était « AVANT LA DEUXIÈME COMPÉTENCE BRANCHÉE »,
//    et C4-L11 l'a tenue. La partie C le vérifie EN BASE, sur trois instances :
//    une qui vise l'Argumentation, une qui vise l'Expression — et le repli
//    alphabétique aurait dit « argumentation », donc c'est elle qui discrimine —,
//    et une qui ne vise rien, où l'alerte doit tomber.
//
//   A. l'état du jour     — la cohérence, ce qui est ouvert, ce qui attend
//   B. le décor           — un `paragraphe` de la maison qui mesure LES DEUX
//   C. la cible du retour — la `cible_primaire` bat l'ordre alphabétique
//   D. les slots          — le prompt assemblé, ses blocs balisés, sa tête
//                           cachable, et PLUS AUCUN `{copie}` ni `{sujet}` littéral
//   E. la chaîne réelle   — les appels, DEUX squelettes, DEUX mesures, la lettre
//                           de l'Argumentation, ses NEUF observables, le journal
//   F. l'idempotence      — une reprise n'écrit JAMAIS une seconde mesure
//   G. le nettoyage       — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/argumentation-c4l10.mjs [--sans-appel | --retire]
//
// `--sans-appel` saute la partie E : aucune requête au fournisseur, aucun coût.
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
const { traiterDepot, cibleDuRetour, cibleIndeterminee, competencesDeLExercice } =
  await import(`${RACINE}/utils/chaine/chaine.ts`)
const {
  competencesOuvertes, competencesEnAttenteDeBranchement, etatCompetence, verifierCoherence,
  valeursDesParametres,
} = await import(`${RACINE}/utils/chaine/instruments.ts`)
const { separerTete, messageDuGabarit, slotsDu } = await import(`${RACINE}/utils/chaine/slots.ts`)
const { lireStatutsRecette, lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const RETIRE_SEUL = process.argv.includes('--retire')
const MARQUE = 'RECETTE-C4L10-ARG'
let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)

// ── La copie de recette. Elle est écrite POUR PORTER DES FAITS D'ARGUMENT ──
// que le §3 de la fiche nomme : une unité au garant explicite, une au lien
// seulement asserté (connecteur sans raison), une preuve qui reformule la thèse,
// une source citée sans rien de déplié, et une objection réellement traitée.
// Elle n'est PAS une copie d'élève réelle — les copies-tests ne sortent jamais
// de leur dépôt, et « jeu de test intouchable » vaut aussi dans l'autre sens.
const COPIE = [
  "La liberté n'est pas l'absence de règle. Quand une société supprime ses lois, "
  + "chacun n'a plus que sa force pour garantir ce qu'il veut faire ; or ce qui "
  + 'ne tient que par la force du plus fort peut lui être repris à tout instant, '
  + 'si bien que ce que la loi retire en pouvoir immédiat, elle le rend en '
  + 'sécurité durable.',
  "L'homme moderne travaille sans cesse. Donc il n'est plus libre de son temps.",
  "La technique nous rend dépendants, parce que nous dépendons d'elle pour vivre.",
  "La liberté suppose la contrainte. En effet, comme le montre Le Contrat social, "
  + 'la liberté véritable est celle qui s\'accorde à la loi.',
  "On m'objectera que la contrainte est toujours subie, et donc contraire à toute "
  + "liberté. Mais une règle que l'on s'est donnée à soi-même n'est pas subie : "
  + "l'objection vaut contre la contrainte imposée, pas contre celle que l'on "
  + 'choisit.',
].join('\n\n')

const CONSIGNE = `${MARQUE} — rédige un paragraphe argumenté : défends une thèse sur la `
  + 'liberté, donne une preuve, écris le lien, et réponds à une objection.'

// ── Le décor ────────────────────────────────────────────────────────────────
async function semer() {
  const { data: type } = await admin.from('exercices_types')
    .select('id, code, crans_admis, competences').eq('code', 'paragraphe').maybeSingle()
  if (!type) throw new Error('décor introuvable : le type `paragraphe` n\'est pas au seed')
  for (const c of ['argumentation', 'expression']) {
    if (!(type.competences ?? []).includes(c)) {
      throw new Error(`le type \`paragraphe\` ne mesure pas « ${c} »`)
    }
  }
  const { data: eleve } = await admin.from('exercices_depots')
    .select('eleve_id').limit(1).maybeSingle()
  if (!eleve) throw new Error('décor introuvable : aucun élève avec un dépôt')

  /** Une instance + son dépôt. `cible` peut être `null` : c'est le troisième cas. */
  const uneInstance = async (cible, texte) => {
    const { data: ex, error: eEx } = await admin.from('exercices').insert({
      type_id: type.id,
      lieu: 'maison',
      // ⚠️ La consigne est CE QUE LE SLOT `{sujet}` recevra : la table `exercices`
      //    porte la consigne instanciée et la PROVENANCE de ses matériaux, jamais
      //    le texte d'un sujet distinct (`07-` §1.1).
      consigne_instanciee: { texte: CONSIGNE },
      // LES DEUX compétences, et c'est le point : l'Argumentation est la
      // DEUXIÈME branchée, donc la première à faire coexister deux chaînes.
      modes_par_competence: { argumentation: ['composer'], expression: ['composer'] },
      statut: 'assigne',
      // ⚠️ LE NUMÉRO, jamais le code : C4-L11 a tranché la forme du `cran` en
      //    base (`integer`, `check between 1 and 9`). Un cran de PRODUCTION.
      cran: 6,
      cible_primaire: cible,
    }).select('id').single()
    if (eEx) throw new Error(`exercice de recette : ${eEx.message}`)
    const { data: dep, error: eDep } = await admin.from('exercices_depots').insert({
      eleve_id: eleve.eleve_id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis',
      texte_v1: texte,
    }).select('id').single()
    if (eDep) throw new Error(`dépôt de recette : ${eDep.message}`)
    return { exerciceId: ex.id, depotId: dep.id, eleveId: eleve.eleve_id }
  }

  return {
    eleveId: eleve.eleve_id,
    // Celle qui traverse la chaîne pour de vrai — elle vise l'Argumentation.
    vise_argumentation: await uneInstance('argumentation', COPIE),
    // ⭐ CELLE QUI DISCRIMINE : le repli alphabétique dirait « argumentation »
    //    (elle passe avant « expression »), donc seule une `cible_primaire`
    //    réellement lue peut rendre « expression ».
    vise_expression: await uneInstance('expression', COPIE),
    // Et celle qui ne vise rien : l'alerte doit tomber.
    sans_cible: await uneInstance(null, COPIE),
  }
}

const chaque = (d) => [d.vise_argumentation, d.vise_expression, d.sans_cible].filter(Boolean)

/** Le geste symétrique. Un décor semé se retire — même si le tour a cassé. */
async function nettoyer(d) {
  if (!d) return
  for (const x of Array.isArray(d) ? d : chaque(d)) {
    if (x.depotId) {
      await admin.from('api_couts').delete().eq('depot_id', x.depotId)
      await admin.from('monitoring_mesures').delete().eq('depot_id', x.depotId)
      await admin.from('competences_mesures').delete().eq('depot_id', x.depotId)
      await admin.from('exercices_squelettes').delete().eq('depot_id', x.depotId)
      await admin.from('exercices_retours').delete().eq('depot_id', x.depotId)
      await admin.from('exercices_jobs').delete().eq('depot_id', x.depotId)
      await admin.from('exercices_depots').delete().eq('id', x.depotId)
    }
    await admin.from('exercices').delete().eq('id', x.exerciceId)
  }
}

/** Retrouve un décor laissé par un tour précédent, par sa MARQUE. */
async function decorLaisse() {
  const { data } = await admin.from('exercices')
    .select('id, consigne_instanciee, exercices_depots(id, eleve_id)')
  const trouves = (data ?? []).filter((e) =>
    JSON.stringify(e.consigne_instanciee ?? {}).includes(MARQUE))
  return trouves.flatMap((e) => ((e.exercices_depots ?? []).length
    ? e.exercices_depots.map((d) => ({ exerciceId: e.id, depotId: d.id, eleveId: d.eleve_id }))
    : [{ exerciceId: e.id, depotId: null, eleveId: null }]))
}

const etatInterrupteur = async () => (await admin.from('scriptorium_params')
  .select('id, chaine_actif').limit(1).maybeSingle()).data

// ── LE TOUR ─────────────────────────────────────────────────────────────────

if (RETIRE_SEUL) {
  const laisses = await decorLaisse()
  await nettoyer(laisses)
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
  dire(ouvertes.includes('argumentation') && ouvertes.length === 2,
    `DEUX compétences ouvertes, l'Argumentation comprise : ${ouvertes.join(', ') || 'aucune'}`)
  const attente = competencesEnAttenteDeBranchement()
  note(`en attente de branchement (C4-L10 se rejoue pour elles) : ${attente.join(', ') || 'aucune'}`)
  const etat = etatCompetence('argumentation')
  dire(etat.instrument?.version === '4.2',
    `l'instrument dérivé porte la VERSION DE LA FICHE : ${etat.instrument?.version}`)
  dire(Object.keys(etat.instrument?.observables_mesure ?? {}).length === 9,
    `neuf observables de télémétrie au bloc machine (§5) : ${
      Object.keys(etat.instrument?.observables_mesure ?? {}).length}`)
  dire(Object.keys(valeursDesParametres(etat.instrument)).length === 0,
    'l\'Argumentation ne déclare AUCUN paramètre — `PARAMS` est vide des deux côtés')
  dire(paramsAvant?.chaine_actif === false, '`chaine_actif` est à OFF avant la recette')

  console.log('\n══ B. LE DÉCOR ═════════════════════════════════════════════════')
  decor = await semer()
  for (const [nom, d] of Object.entries(decor)) {
    if (nom === 'eleveId') continue
    note(`${nom} : exercice ${d.exerciceId.slice(0, 8)} · dépôt ${d.depotId.slice(0, 8)}`)
  }
  const statuts = await lireStatutsRecette(admin, decor.eleveId)
  dire(statuts.argumentation === 'mesuree_silencieusement',
    `l'Argumentation NAÎT \`mesuree_silencieusement\` — statut lu : ${statuts.argumentation}. `
    + 'Ce script n\'en pose aucun : le professeur choisit (`01-` §3 ; `03-` §9)')

  console.log('\n══ C. LA CIBLE DU RETOUR — LE PIÈGE QUI MORD À LA DEUXIÈME ═════')
  // ⚠️⚠️ « Brancher quand même ne casse rien de visible, et c'est exactement le
  //    problème : le retour et le squelette de version finale s'attacheraient à
  //    la compétence dont le nom vient en premier dans l'alphabet. » On le lit
  //    EN BASE, à travers `lireContexte`, sur les trois instances.
  for (const [nom, attendu] of [['vise_argumentation', 'argumentation'],
    ['vise_expression', 'expression'], ['sans_cible', 'argumentation']]) {
    const ctx = await lireContexte(admin, decor[nom].depotId)
    const { mesurees } = competencesDeLExercice(ctx)
    const cible = cibleDuRetour(ctx, mesurees)
    const flou = cibleIndeterminee(ctx, mesurees)
    dire(mesurees.length === 2,
      `${nom} : DEUX compétences mesurées — ${mesurees.join(', ')}`)
    dire(cible === attendu, `${nom} : la cible du retour est « ${cible} » (attendu « ${attendu} »)`)
    if (nom === 'vise_expression') {
      dire(!flou && cible === 'expression',
        '⭐ LA `cible_primaire` BAT L\'ORDRE ALPHABÉTIQUE : le repli aurait dit '
        + '« argumentation ». C4-L11 est joué, et cela se voit ici.')
    }
    if (nom === 'sans_cible') {
      dire(flou,
        '⭐ SANS `cible_primaire`, L\'ALERTE TOMBE — c\'est le repli assumé comme '
        + 'convention, et il se DIT dès qu\'il sert sur plus d\'une compétence')
    }
    if (nom === 'vise_argumentation') {
      dire(!flou, 'vise_argumentation : aucune alerte de repli — la cible est déclarée')
    }
  }

  console.log('\n══ D. LES SLOTS ════════════════════════════════════════════════')
  // Les mêmes fonctions que la chaîne, sur les mêmes entrées — et sans appel.
  const branchement = etat.branchement
  const ctxSlots = {
    modes: ['composer'], cran: 6, referent: null, exceptionOrthographe: false,
    contexteExercice: { sujet: CONSIGNE, consigne: CONSIGNE, copie: COPIE, mode: 'composer' },
    prives: {}, sorties: {}, parametres: valeursDesParametres(etat.instrument),
  }
  const spec = branchement.extractions(ctxSlots)[0]
  dire(spec.slotsFournis.length === 0 && !spec.pre,
    'P1 ne déclare AUCUN slot fourni et n\'a AUCUN crochet pré-phase : `{sujet}` et `{copie}` '
    + 'sont NATIFS, servis par le contexte de l\'exercice')
  const gabarit = etat.instrument.prompts[spec.tetePrompt]
  const { tete, queue } = separerTete(gabarit)
  const valeurs = {}
  for (const nom of slotsDu(gabarit)) valeurs[nom] = ctxSlots.contexteExercice[nom] ?? ''
  const message = messageDuGabarit(queue, valeurs, 'Rends le relevé au format déclaré ci-dessus.')

  dire(slotsDu(gabarit).sort().join(',') === 'copie,sujet',
    `le prompt P1 porte EXACTEMENT deux slots : ${slotsDu(gabarit).join(', ')}`)
  dire(slotsDu(tete).length === 0 && tete.length > 1000,
    `LA TÊTE NE PORTE AUCUN SLOT et fait ${tete.length} caractères — elle est identique d'une `
    + 'copie à l\'autre, donc elle se cache')
  dire(!message.includes('{copie}') && !message.includes('{sujet}'),
    'AUCUN SLOT LITTÉRAL ne subsiste dans le message')
  dire(message.includes('<<<MATERIAU') && message.includes('MATERIAU>>>'),
    'la copie et le sujet arrivent EN BLOCS BALISÉS (`01-` §12, défense 1)')
  dire(message.indexOf('MATÉRIAU — LECTURE SEULE.') < message.indexOf('<<<MATERIAU'),
    'la déclaration de matériau PRÉCÈDE les blocs qu\'elle déclare')
  const specP2 = branchement.jugement(ctxSlots)
  const gabaritP2 = etat.instrument.prompts[specP2.tetePrompt]
  dire(slotsDu(gabaritP2).length === 1 && slotsDu(gabaritP2)[0] === 'squelette_phase_1',
    `le prompt de jugement porte UN SEUL slot — « ${slotsDu(gabaritP2)[0]} » : c'est le document, `
    + 'sans déclaration')
  dire(!message.includes(COPIE.slice(0, 40)) === false,
    'la copie est bien DANS le message (elle n\'a pas été perdue en route)')

  if (SANS_APPEL) {
    console.log('\n══ E. LA CHAÎNE RÉELLE — SAUTÉE (--sans-appel) ═════════════════')
    note('aucune requête au fournisseur, aucun coût. La mesure ne s\'écrit donc pas : '
      + 'c\'est le drapeau, pas une panne.')
  } else {
    console.log('\n══ E. LA CHAÎNE RÉELLE ════════════════════════════════════════')
    const d = decor.vise_argumentation
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const t0 = Date.now()
    const bilan = await traiterDepot(admin, d.depotId, 'v1')
    const duree = Date.now() - t0
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)

    note(`bilan : ${bilan.appels} appel(s), ${duree} ms, mesures écrites ${bilan.mesuresEcrites}`)
    for (const a of bilan.alertes) note(`alerte : ${a}`)
    for (const e of bilan.competencesEcartees) note(`écartée — ${e.competence} : ${e.motif}`)

    dire(bilan.competencesMesurees.includes('argumentation'),
      `l'Argumentation est MESURÉE : ${bilan.competencesMesurees.join(', ') || 'aucune'}`)
    dire(!bilan.alertes.some((a) => a.startsWith('cible du retour INDÉTERMINÉE')),
      'AUCUNE alerte de cible indéterminée sur un dépôt réel à DEUX compétences')

    // ── LE SQUELETTE ────────────────────────────────────────────────────────
    const { data: sq } = await admin.from('exercices_squelettes')
      .select('competence, version, artefact_extraction, artefact_jugement, instrument_version, modele')
      .eq('depot_id', d.depotId)
    dire((sq ?? []).length === 2,
      `DEUX squelettes — un par (dépôt × version × compétence) : ${(sq ?? []).length}`)
    const s0 = (sq ?? []).find((x) => x.competence === 'argumentation')
    dire(!!s0?.artefact_extraction && !!s0?.artefact_jugement,
      'le squelette de l\'Argumentation porte SES DEUX artefacts — l\'extraction et le jugement')
    dire(s0?.instrument_version === '4.2',
      `\`instrument_version\` EST la ligne VERSION de la fiche : ${s0?.instrument_version}`)
    const p1 = s0?.artefact_extraction?.p1 ?? {}
    dire(Array.isArray(p1.unites) && p1.unites.length > 0,
      `le relevé de P1 porte ${(p1.unites ?? []).length} unité(s) argumentative(s)`)
    note(`statuts déclarés : ${JSON.stringify((p1.unites ?? []).map((u) => u.statut_du_lien))}`)
    note(`objections : ${JSON.stringify((p1.objections ?? []).map((o) => o.traitement))}`)
    // ⚠️ « Le modèle ne rend ni niveau, ni dimension, ni décompte » (`01-` §11).
    const p2 = s0?.artefact_jugement ?? {}
    dire(!('niveau' in p2) && !('palier_base' in p2) && !('seuil_franchi' in p2),
      `P2 NE REND AUCUN NIVEAU : champs rendus — ${Object.keys(p2).join(', ')}`)
    note(`crible : ${JSON.stringify(p2?.crible ?? null).slice(0, 300)}…`)

    // ── LA MESURE, ET SA LETTRE ─────────────────────────────────────────────
    const { data: me } = await admin.from('competences_mesures')
      .select('competence, lettre_equivalente, observables, modes, lieu, forme, '
        + 'instrument_version, delta_v1_vf')
      .eq('depot_id', d.depotId)
    dire((me ?? []).length === 2, `DEUX mesures, une par compétence : ${(me ?? []).length}`)
    const m0 = (me ?? []).find((x) => x.competence === 'argumentation')
    dire(['E', 'D', 'C', 'B', 'A'].includes(m0?.lettre_equivalente),
      `LA LETTRE-ÉQUIVALENTE est un palier du référentiel : « ${m0?.lettre_equivalente} »`)
    dire(m0?.delta_v1_vf === null,
      '`delta_v1_vf` est NULL — et NULL n\'est pas 0 : il n\'y a pas de version finale')

    // ── LES NEUF OBSERVABLES ────────────────────────────────────────────────
    const NEUF = Object.keys(etat.instrument.observables_mesure).sort()
    const obs = m0?.observables ?? {}
    dire(Object.keys(obs).sort().join(',') === NEUF.join(','),
      `les NEUF observables du §5 sont écrits : ${Object.keys(obs).sort().join(', ')}`)
    note(`valeurs : ${NEUF.map((c) => `${c}=${JSON.stringify(obs[c])}`).join(' · ')}`)
    const nas = NEUF.filter((c) => obs[c] === 'n/a')
    dire(nas.length === 0,
      nas.length ? `⚠️ ${nas.length} observable(s) à \`n/a\` : ${nas.join(', ')} — chacun doit `
        + 'porter son alerte nommée au bilan' : 'AUCUN observable ne sort en `n/a` sur cette copie')

    // ── LE JOURNAL, PAR APPEL ET PAR PHASE ──────────────────────────────────
    const { data: co } = await admin.from('api_couts')
      .select('phase, competence, version, modele, tokens_entree, tokens_sortie')
      .eq('depot_id', d.depotId)
    const phases = (co ?? []).map((c) => c.phase).sort()
    // ⚠️ UNE LIGNE PAR APPEL, ET NON PAR PHASE. « La `phase` dit l'étage, pas le
    //    nombre d'appels » (`07-` §1.2).
    dire(phases.filter((p) => p === 'p1').length >= 2 && phases.filter((p) => p === 'p2').length >= 2,
      `le journal porte UNE LIGNE PAR APPEL, avec sa phase : ${phases.join(', ')}`)
    dire((co ?? []).some((c) => c.competence === 'argumentation'),
      'les appels de l\'Argumentation sont RATTACHÉS à elle — dépôt, compétence, version')
    // ⚠️ Les deux temps de CODE ne journalisent rien : ce ne sont pas des appels.
    dire(!(co ?? []).some((c) => ['code1', 'code2'].includes(c.phase)),
      'aucune ligne `code1` ni `code2` : « les deux temps de code ne journalisent rien »')
    dire(bilan.retourEcrit || bilan.alertes.some((a) => a.startsWith('retour refusé')),
      `le retour est ${bilan.retourEcrit ? 'ENGENDRÉ ET ÉCRIT' : 'REFUSÉ AVEC SON MOTIF'} — `
      + 'jamais écrit à moitié, jamais tu')

    // ── LE RETOUR, SUR PIÈCE ────────────────────────────────────────────────
    // ⭐ Le tour de l'Expression n'a jamais pu le lire : sa copie de recette ne
    //    portait AUCUNE réussite citable, et la règle 2 du gabarit refusait le
    //    retour. Cette copie-ci en porte une — c'est la condition de reprise
    //    nommée à C4L10-14 et à C4L5-1bis. On le SORT donc du décor avant de le
    //    retirer, plutôt que de le jeter sans l'avoir lu.
    if (bilan.retourEcrit) {
      // ⚠️ `registre_servi`, jamais `registre` : la colonne porte LA TRACE, pas
      //    l'état (`07-` §1.2). Et l'erreur se LIT — supabase-js ne lève pas,
      //    il rend `{ error }`, et un select sur une colonne absente rendrait
      //    `data: null`, donc « 0 point » sans que rien ne dise pourquoi.
      const { data: re, error: eRe } = await admin.from('exercices_retours')
        .select('moment, registre_servi, texte, points_ids, published_at, lu_at')
        .eq('depot_id', d.depotId)
      dire(!eRe, `le retour se relit sans erreur${eRe ? ` — ${eRe.code} ${eRe.message}` : ''}`)
      const r0 = (re ?? [])[0]
      const points = Array.isArray(r0?.texte) ? r0.texte : null
      dire(Array.isArray(points) && points.length > 0,
        `LE RETOUR SE REND SEGMENTÉ — ${Array.isArray(points) ? points.length : 0} point(s), `
        + 'jamais un bloc que l\'écran devrait découper (`07-` §1.2)')
      for (const pt of points ?? []) {
        dire(!!pt.id && typeof pt.texte === 'string' && pt.texte.trim() !== '',
          `point « ${pt.id} » : identifiant stable + texte non vide`)
      }
      dire(r0?.published_at == null,
        '`published_at` est NULL — le retour est écrit, PAS PUBLIÉ : rien n\'est lisible par '
        + 'l\'élève avant la publication (`07-` §1.2)')
      note(`registre servi : ${r0?.registre_servi}`)
      console.log('\n  ┌── LE RETOUR, TEL QU\'IL EST ÉCRIT ──────────────────────────')
      for (const pt of points ?? []) {
        console.log(`  │ [${pt.id}]${pt.ancrage ? ` ⟨${JSON.stringify(pt.ancrage)}⟩` : ''}`)
        for (const l of String(pt.texte).split('\n')) console.log(`  │   ${l}`)
      }
      console.log('  └────────────────────────────────────────────────────────────\n')
      // RR4 — « le retour ne révèle jamais la grille complète » : aucun nom
      // d'observable, aucun palier, aucune note ne doit y paraître.
      const tout = (points ?? []).map((x) => String(x.texte)).join(' ')
      const fuites = ['garant_present', 'lien_explicite', 'preuve_circulaire', 'garant_circulaire',
        'source_cosmetique', 'garant_ambigu', 'garant_vague', 'objection_traitee', 'nb_limites',
        'palier_base', 'seuil_franchi', 'cosmetique', 'Acquis', '/20']
        .filter((m) => tout.includes(m))
      dire(fuites.length === 0,
        fuites.length ? `⚠️ RR4 — le retour laisse passer : ${fuites.join(', ')}`
          : 'RR4 — AUCUN nom d\'observable, aucun palier, aucune note dans le texte servi')
    }

    // ── F. L'IDEMPOTENCE ────────────────────────────────────────────────────
    console.log('\n══ F. L\'IDEMPOTENCE ═══════════════════════════════════════════')
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const bis = await traiterDepot(admin, d.depotId, 'v1')
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)
    const { count: nMesures } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotId)
    const { count: nSquelettes } = await admin.from('exercices_squelettes')
      .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotId)
    dire(nMesures === 2, `UNE reprise n'écrit JAMAIS une seconde mesure : ${nMesures}`)
    dire(nSquelettes === 2,
      `l'index unique (dépôt × compétence × version) tient : ${nSquelettes} squelette(s)`)
    note(`la reprise a compté ${bis.mesuresDejaLa} mesure(s) déjà là`)
  }
} catch (e) {
  ko++
  console.error(`\n✗ LE TOUR A CASSÉ : ${e?.message ?? e}`)
  if (e?.stack) console.error(e.stack.split('\n').slice(1, 5).join('\n'))
} finally {
  console.log('\n══ G. LE NETTOYAGE ═════════════════════════════════════════════')
  await nettoyer(decor)
  const restes = await decorLaisse()
  if (restes.length) await nettoyer(restes)
  const restesBis = await decorLaisse()
  dire(restesBis.length === 0,
    `le décor semé est RETIRÉ — restes portant « ${MARQUE} » : ${restesBis.length}`)
  const apres = await etatInterrupteur()
  dire(apres?.chaine_actif === false, '`chaine_actif` est REVENU à OFF')
  const { data: n } = await admin.from('competences_niveaux')
    .select('statut_recette').eq('competence', 'argumentation')
  const poses = (n ?? []).filter((x) => x.statut_recette === 'evaluee')
  dire(poses.length === 0,
    `AUCUN statut \`evaluee\` n'a été posé sur l'Argumentation — pas même « pour tester » : ${
      poses.length}`)
}

console.log(`\n══ ${ko === 0 ? 'RECETTE VERTE' : 'RECETTE ROUGE'} — ${ok} vert(s), ${ko} rouge(s) ══\n`)
process.exit(ko === 0 ? 0 : 1)
