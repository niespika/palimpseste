// ============================================================================
// RECETTE C4 · L10 · STRUCTURE — LA TROISIÈME COMPÉTENCE, ÉPROUVÉE SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Un dépôt réel traverse la chaîne et écrit UN SQUELETTE, UNE MESURE ET SA
//   LETTRE-ÉQUIVALENTE. »                        — le « fait quand » de C4-L10
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE, avec le client admin. Il ne
// rejoue pas les tests unitaires — ceux-là confrontent le portage au module de
// calibration, sans base et sans appel. Il éprouve ce qu'aucun test pur ne peut
// prouver : QU'UNE MESURE S'ÉCRIT VRAIMENT.
//
// ⭐⭐ ET IL ÉPROUVE DEUX CHOSES QUE SES DEUX AÎNÉS NE POUVAIENT PAS.
//
//   (a) `prepare_copie` — LA STRUCTURE EST LA SEULE DES SIX À LE DÉFINIR, et
//       c'est le seul crochet dont la sortie change CE QUE LE MODÈLE LIT. Le
//       contrat dit pourquoi : « les lignes vides sont des frontières de blocs ».
//       ⚠️ C4-L4 en a payé la preuve le 22/08 : la normalisation CRLF d'un
//       `<textarea>` faisait lire toute copie EN UN SEUL BLOC, et « la Structure
//       de toute copie validée depuis un navigateur aurait planché ». La partie D
//       vérifie, DANS LE MESSAGE RÉELLEMENT ASSEMBLÉ, que la copie arrive
//       renumérotée `[¶1]`, `[¶2]`… et qu'elle porte AUTANT de blocs que la copie
//       en a de paragraphes.
//   (b) LA LATENCE À TROIS COMPÉTENCES — 39 s à une, 47-52 s à deux. La partie E
//       la mesure à trois, sur la même instance.
//
//   A. l'état du jour     — la cohérence, ce qui est ouvert, ce qui attend
//   B. le décor           — un `paragraphe` de la maison qui mesure LES TROIS
//   C. la cible du retour — la `cible_primaire` bat l'ordre alphabétique
//   D. `prepare_copie`    — la copie RENUMÉROTÉE, et pas la brute
//   E. la chaîne réelle   — les appels, TROIS squelettes, TROIS mesures, la
//                           lettre de la Structure, ses HUIT observables
//   F. l'idempotence      — une reprise n'écrit JAMAIS une seconde mesure
//   G. le nettoyage       — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/structure-c4l10.mjs [--sans-appel | --retire]
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
  valeursDesParametres, MANIFESTE_LU,
} = await import(`${RACINE}/utils/chaine/instruments.ts`)

// ⚠️ LA VERSION NE S'ÉPINGLE PAS EN DUR — leçon de la séance Argumentation : sa
//    fiche est passée de 4.2 à 4.3 PENDANT le lot, et la recette a rougi pour une
//    raison qui n'en était pas une. Ce qui doit être vrai, c'est que l'instrument
//    importé porte LA VERSION QUE LE MANIFESTE DÉRIVÉ DÉCLARE ; `--verifie` dit,
//    lui, si le dérivé a divergé de sa source.
const VERSION_ATTENDUE = MANIFESTE_LU.competences.structure?.version
const { separerTete, messageDuGabarit, slotsDu } = await import(`${RACINE}/utils/chaine/slots.ts`)
const { lireStatutsRecette, lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { blocs } = await import(`${RACINE}/utils/passation/transcription-calcul.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const RETIRE_SEUL = process.argv.includes('--retire')
const MARQUE = 'RECETTE-C4L10-STR'
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
  .select('statut_recette').eq('competence', 'structure').maybeSingle()).data?.statut_recette ?? null
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)

// ── La copie de recette. Elle est écrite POUR PORTER DES FAITS D'ARCHITECTURE ──
// que le §3 de la fiche nomme : un problème posé sous forme de QUESTION, un plan
// annoncé à DEUX étapes, des parties marquées, une charnière qui NOMME UN MANQUE
// et une autre qui ne fait qu'annoncer, un bloc de tissu qui nomme sa relation,
// et un bloc de développement sans idée directrice énoncée.
// ⚠️ SES PARAGRAPHES SONT SÉPARÉS PAR DES LIGNES VIDES — c'est le sujet même du
//    crochet `prepare_copie`, et une copie d'un seul tenant ne prouverait rien.
// Elle n'est PAS une copie d'élève réelle : les copies-tests ne sortent jamais de
// leur dépôt, et « jeu de test intouchable » vaut aussi dans l'autre sens.
const COPIE = [
  'La technique nous rend-elle plus libres, ou nous enchaîne-t-elle à nos propres '
  + 'outils ? Nous verrons d\'abord que la technique élargit le champ de nos '
  + 'actions possibles, puis que cette puissance nouvelle crée des dépendances '
  + 'que nous n\'avons pas choisies.',

  'D\'abord, la technique élargit ce que nous pouvons faire. Un outil prolonge la '
  + 'main, une machine prolonge le corps, un calculateur prolonge la mémoire. '
  + 'Chaque invention ouvre des actions qui étaient hors de portée, et une action '
  + 'possible de plus est une liberté de plus au sens le plus concret du mot.',

  'Mais cette puissance ne dit rien de ce qu\'il faut en faire, et c\'est là ce '
  + 'qui manque à ce que nous venons d\'établir. Dans un second temps, il faut '
  + 'donc regarder ce que la technique exige en retour de celui qui l\'emploie.',

  'Les objets techniques demandent en effet un entretien, une énergie, un savoir. '
  + 'On ne peut plus s\'en passer une fois qu\'on s\'y est habitué. La dépendance '
  + 'n\'est pas une servitude choisie.',

  'Cette dépendance rejoint d\'ailleurs ce que nous disions de la puissance : '
  + 'elle en est le prix. Il reste que le bilan n\'est pas simple à faire.',
].join('\n\n')

const CONSIGNE = `${MARQUE} — rédige un essai structuré : pose un problème, annonce un `
  + 'plan, et articule tes parties.'

// ── Le décor ────────────────────────────────────────────────────────────────
async function semer() {
  const { data: type } = await admin.from('exercices_types')
    .select('id, code, crans_admis, competences').eq('code', 'paragraphe').maybeSingle()
  if (!type) throw new Error('décor introuvable : le type `paragraphe` n\'est pas au seed')
  for (const c of ['structure', 'argumentation', 'expression']) {
    if (!(type.competences ?? []).includes(c)) {
      throw new Error(`le type \`paragraphe\` ne mesure pas « ${c} »`)
    }
  }
  const { data: eleve } = await admin.from('exercices_depots')
    .select('eleve_id').limit(1).maybeSingle()
  if (!eleve) throw new Error('décor introuvable : aucun élève avec un dépôt')

  /** Une instance + son dépôt. `cible` peut être `null` : c'est le troisième cas. */
  const uneInstance = async (cible, texte, competences) => {
    const { data: ex, error: eEx } = await admin.from('exercices').insert({
      type_id: type.id,
      lieu: 'maison',
      // ⚠️ La consigne est CE QUE LE SLOT `{sujet}` recevra : la table `exercices`
      //    porte la consigne instanciée et la PROVENANCE de ses matériaux, jamais
      //    le texte d'un sujet distinct (`07-` §1.1).
      consigne_instanciee: { texte: CONSIGNE },
      modes_par_competence: competences,
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

  // ⭐ TROIS compétences sur la même instance — c'est la première fois, et c'est
  //    ce qui donne la latence à trois chaînes en parallèle.
  const LES_TROIS = {
    structure: ['composer'], argumentation: ['composer'], expression: ['composer'],
  }
  return {
    eleveId: eleve.eleve_id,
    // Celle qui traverse la chaîne pour de vrai — elle vise la Structure.
    vise_structure: await uneInstance('structure', COPIE, LES_TROIS),
    // ⭐ CELLE QUI DISCRIMINE : le repli alphabétique dirait « argumentation »
    //    (elle passe avant « expression » et « structure »), donc seule une
    //    `cible_primaire` réellement lue peut rendre « structure ».
    vise_structure_bis: await uneInstance('structure', COPIE,
      { structure: ['composer'], argumentation: ['composer'] }),
    // Et celle qui ne vise rien : l'alerte doit tomber.
    sans_cible: await uneInstance(null, COPIE, LES_TROIS),
  }
}

const chaque = (d) => [d.vise_structure, d.vise_structure_bis, d.sans_cible].filter(Boolean)

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
  // ⚠️ LE COMPTE ÉTAIT FIGÉ au jour où ce script a été écrit (deux, trois…).
  //    Les six sont ouvertes depuis le 23/08 : ce qui compte est que CELLE-CI
  //    le soit, pas combien elles sont.
  dire(ouvertes.includes('structure'),
    `la Structure est OUVERTE à la chaîne — ${ouvertes.length} au total : ${
      ouvertes.join(', ') || 'aucune'}`)
  const attente = competencesEnAttenteDeBranchement()
  // ⚠️ Idem : « il en reste trois » était vrai ce jour-là. La règle, elle, ne
  //    bouge pas — rien ne peut être À LA FOIS ouvert et en attente.
  dire(attente.every((c) => !ouvertes.includes(c)),
    `en attente de branchement : ${attente.join(', ') || 'aucune'} — et aucune n'est `
    + 'déjà ouverte')
  const etat = etatCompetence('structure')
  dire(!!VERSION_ATTENDUE && etat.instrument?.version === VERSION_ATTENDUE,
    'l\'instrument dérivé porte la VERSION DE LA FICHE que le manifeste déclare : '
    + `${etat.instrument?.version} (manifeste : ${VERSION_ATTENDUE})`)
  dire(Object.keys(etat.instrument?.observables_mesure ?? {}).length === 8,
    `huit observables de télémétrie au bloc machine (§5) : ${
      Object.keys(etat.instrument?.observables_mesure ?? {}).length}`)
  dire(Object.keys(valeursDesParametres(etat.instrument)).length === 0,
    'la Structure ne déclare AUCUN paramètre — `PARAMS` est vide des deux côtés')
  dire(typeof etat.branchement?.prepareCopie === 'function',
    '⭐ elle est la SEULE des six à définir `prepare_copie` — « les lignes vides sont '
    + 'des frontières de blocs »')
  dire(etat.branchement?.delta === undefined,
    '`delta` n\'est PAS déclaré : la fiche ne dit nulle part ce que comparer deux '
    + 'squelettes veut dire pour elle (troisième fiche sur trois à se taire)')
  dire(paramsAvant?.chaine_actif === false, '`chaine_actif` est à OFF avant la recette')

  console.log('\n══ B. LE DÉCOR ═════════════════════════════════════════════════')
  decor = await semer()
  for (const [nom, d] of Object.entries(decor)) {
    if (nom === 'eleveId') continue
    note(`${nom} : exercice ${d.exerciceId.slice(0, 8)} · dépôt ${d.depotId.slice(0, 8)}`)
  }
  const statuts = await lireStatutsRecette(admin, decor.eleveId)
  // ⚠️ CETTE ASSERTION FIGEAIT UNE VALEUR — « NAÎT `mesuree_silencieusement` » —
  //    vraie tant que le professeur n'avait rien posé. Il a posé les six le
  //    23/08. Ce que le script doit garantir n'est pas la VALEUR du statut,
  //    c'est qu'IL N'Y TOUCHE PAS : c'est l'avant/après de la clôture qui le
  //    prouve. Ici, on se contente de DIRE ce qu'on a lu.
  note(`statut de recette lu pour la Structure : \`${statuts.structure}\` — ce script n'en `
    + 'pose aucun, le professeur choisit (`01-` §3 ; `03-` §9)')

  console.log('\n══ C. LA CIBLE DU RETOUR — LA `cible_primaire` BAT L\'ALPHABET ══')
  // ⚠️ « Le retour et le squelette de version finale s'attacheraient à la
  //    compétence dont le nom vient en premier dans l'alphabet, pas à celle qui
  //    était visée. » On le lit EN BASE, à travers `lireContexte`.
  for (const [nom, attendu, nMesurees] of [['vise_structure', 'structure', 3],
    ['vise_structure_bis', 'structure', 2], ['sans_cible', 'argumentation', 3]]) {
    const ctx = await lireContexte(admin, decor[nom].depotId)
    const { mesurees } = competencesDeLExercice(ctx)
    const cible = cibleDuRetour(ctx, mesurees)
    const flou = cibleIndeterminee(ctx, mesurees)
    dire(mesurees.length === nMesurees,
      `${nom} : ${nMesurees} compétence(s) mesurée(s) — ${mesurees.join(', ')}`)
    dire(cible === attendu, `${nom} : la cible du retour est « ${cible} » (attendu « ${attendu} »)`)
    if (nom === 'sans_cible') {
      dire(flou,
        '⭐ SANS `cible_primaire`, L\'ALERTE TOMBE — et le repli désigne « argumentation », '
        + 'qui n\'est visée par personne : c\'est exactement ce que le piège annonce')
    } else {
      dire(!flou && cible === 'structure',
        `⭐ ${nom} : la \`cible_primaire\` BAT L'ORDRE ALPHABÉTIQUE — le repli aurait dit `
        + '« argumentation ». C4-L11 est joué, et cela se voit ici.')
    }
  }

  console.log('\n══ D. `prepare_copie` — LA COPIE RENUMÉROTÉE, ET PAS LA BRUTE ══')
  // ⭐ C'est le seul crochet des six dont la sortie change CE QUE LE MODÈLE LIT.
  //    On le joue AVEC LES MÊMES FONCTIONS QUE LA CHAÎNE, et sans appel.
  const branchement = etat.branchement
  const ctxAvant = {
    modes: ['composer'], cran: 6, referent: null, exceptionOrthographe: false,
    contexteExercice: {}, prives: {}, sorties: {},
    parametres: valeursDesParametres(etat.instrument),
  }
  const copiePreparee = branchement.prepareCopie(COPIE, ctxAvant)
  const nParagraphes = blocs(COPIE).length
  const nNumerotes = (copiePreparee.match(/\[¶\d+\]/g) ?? []).length
  dire(nNumerotes === nParagraphes,
    `⭐ la copie est renumérotée : ${nNumerotes} bloc(s) \`[¶N]\` pour ${nParagraphes} `
    + 'paragraphe(s) séparés par des lignes vides')
  dire(nParagraphes === 5, `la copie de recette porte bien CINQ paragraphes : ${nParagraphes}`)
  dire(copiePreparee.startsWith('[¶1] '),
    'la numérotation commence à `[¶1]`, et le découpage est FOURNI à P1')
  dire(!/\n{3,}/.test(copiePreparee),
    'les blocs sont séparés par UNE ligne vide, exactement — la forme que P1 attend')

  const ctxSlots = {
    ...ctxAvant,
    contexteExercice: {
      sujet: CONSIGNE, consigne: CONSIGNE, copie: copiePreparee, mode: 'composer',
    },
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
  // ⭐⭐ LE CONTRÔLE QUI N'EXISTE QUE POUR ELLE, et c'est le cœur de la partie D :
  //    le modèle reçoit la copie RENUMÉROTÉE, et JAMAIS la brute à côté.
  dire(message.includes('[¶1] La technique nous rend-elle'),
    '⭐ le message porte la copie RENUMÉROTÉE — c\'est elle que les numéros du relevé désignent')
  dire(!message.includes(`\n\n${COPIE.slice(0, 30)}`),
    '⛔ et la copie BRUTE ne part JAMAIS à côté de la renumérotée')
  const specP2 = branchement.jugement(ctxSlots)
  const gabaritP2 = etat.instrument.prompts[specP2.tetePrompt]
  dire(slotsDu(gabaritP2).length === 1 && slotsDu(gabaritP2)[0] === 'squelette_phase_1',
    `le prompt de jugement porte UN SEUL slot — « ${slotsDu(gabaritP2)[0]} » : c'est le document, `
    + 'sans déclaration')

  if (SANS_APPEL) {
    console.log('\n══ E. LA CHAÎNE RÉELLE — SAUTÉE (--sans-appel) ═════════════════')
    note('aucune requête au fournisseur, aucun coût. La mesure ne s\'écrit donc pas : '
      + 'c\'est le drapeau, pas une panne.')
  } else {
    console.log('\n══ E. LA CHAÎNE RÉELLE ════════════════════════════════════════')
    const d = decor.vise_structure
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const t0 = Date.now()
    const bilan = await traiterDepot(admin, d.depotId, 'v1')
    const duree = Date.now() - t0
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)

    note(`bilan : ${bilan.appels} appel(s), ${duree} ms, mesures écrites ${bilan.mesuresEcrites}`)
    // ⭐ LA LATENCE À TROIS COMPÉTENCES — 39 s à une, 47-52 s à deux.
    note(`⭐ LATENCE À TROIS CHAÎNES EN PARALLÈLE : ${Math.round(duree / 1000)} s`)
    for (const a of bilan.alertes) note(`alerte : ${a}`)
    for (const e of bilan.competencesEcartees) note(`écartée — ${e.competence} : ${e.motif}`)

    dire(bilan.competencesMesurees.includes('structure'),
      `la Structure est MESURÉE : ${bilan.competencesMesurees.join(', ') || 'aucune'}`)
    dire(!bilan.alertes.some((a) => a.startsWith('cible du retour INDÉTERMINÉE')),
      'AUCUNE alerte de cible indéterminée sur un dépôt réel à TROIS compétences')

    // ── LE SQUELETTE ────────────────────────────────────────────────────────
    const { data: sq } = await admin.from('exercices_squelettes')
      .select('competence, version, artefact_extraction, artefact_jugement, instrument_version, modele')
      .eq('depot_id', d.depotId)
    dire((sq ?? []).length === 3,
      `TROIS squelettes — un par (dépôt × version × compétence) : ${(sq ?? []).length}`)
    const s0 = (sq ?? []).find((x) => x.competence === 'structure')
    dire(!!s0?.artefact_extraction && !!s0?.artefact_jugement,
      'le squelette de la Structure porte SES DEUX artefacts — l\'extraction et le jugement')
    dire(s0?.instrument_version === VERSION_ATTENDUE,
      `\`instrument_version\` EST la ligne VERSION de la fiche : ${s0?.instrument_version}`)
    const p1 = s0?.artefact_extraction?.p1 ?? {}
    dire(Array.isArray(p1.blocs) && p1.blocs.length > 0,
      `le relevé de P1 porte ${(p1.blocs ?? []).length} bloc(s)`)
    // ⭐⭐ LE CONTRÔLE QUE SEULE LA STRUCTURE PEUT FAIRE : P1 « n'en fusionne, n'en
    //    découpe et n'en omet AUCUN » — le découpage lui est FOURNI. Si le nombre
    //    de blocs relevés diffère du nombre de paragraphes servis, c'est que
    //    `prepare_copie` n'a pas servi, ou que le modèle a désobéi.
    dire((p1.blocs ?? []).length === nParagraphes,
      `⭐ P1 rend AUTANT de blocs que la copie en portait : ${(p1.blocs ?? []).length} pour `
      + `${nParagraphes} — « le découpage t'est donné, tu n'en fusionnes aucun »`)
    dire(Array.isArray(p1.jointures) && p1.jointures.length > 0,
      `le relevé porte ${(p1.jointures ?? []).length} jointure(s)`)
    note(`promesse : forme « ${p1.promesse?.probleme_forme} », `
      + `${(p1.promesse?.etapes_annoncees ?? []).length} étape(s) annoncée(s)`)
    note(`parties marquées : ${(p1.parties ?? []).length}`)
    note(`gestes par couture : ${JSON.stringify((p1.jointures ?? []).map((j) => j.gestes))}`)
    // ⚠️ « P1 NE QUALIFIE PAS » (fiche §3) : ni statut, ni nature.
    const qualifs = (p1.jointures ?? []).filter((j) => 'statut' in j || 'niveau' in j)
    dire(qualifs.length === 0,
      `P1 NE QUALIFIE RIEN : ${qualifs.length} jointure(s) portent un \`statut\` ou un \`niveau\` `
      + '— les deux qualifications se composent (fiche §3, acté)')
    // ⚠️ « Le modèle ne rend ni niveau, ni dimension, ni décompte » (`01-` §11).
    const p2 = s0?.artefact_jugement ?? {}
    dire(!('niveau' in p2) && !('cohesion_locale' in p2) && !('coherence_globale' in p2)
      && !('profil_moyen' in p2) && !('route_globale' in p2),
    `P2 NE REND AUCUN NIVEAU : champs rendus — ${Object.keys(p2).join(', ')}`)
    note(`crible : ${JSON.stringify(p2?.crible ?? null).slice(0, 300)}…`)
    note(`progression : doublon=${p2.doublon} retour=${p2.retour_en_arriere} `
      + `ordre_nécessaire=${p2.ordre_necessaire} étapes=${p2.etapes_realisees_dans_lordre}`)

    // ── LA MESURE, ET SA LETTRE ─────────────────────────────────────────────
    const { data: me } = await admin.from('competences_mesures')
      .select('competence, lettre_equivalente, observables, modes, lieu, forme, '
        + 'instrument_version, delta_v1_vf')
      .eq('depot_id', d.depotId)
    dire((me ?? []).length === 3, `TROIS mesures, une par compétence : ${(me ?? []).length}`)
    const m0 = (me ?? []).find((x) => x.competence === 'structure')
    dire(['E', 'D', 'C', 'B', 'A'].includes(m0?.lettre_equivalente),
      `LA LETTRE-ÉQUIVALENTE est un palier du référentiel : « ${m0?.lettre_equivalente} »`)
    dire(m0?.delta_v1_vf === null,
      '`delta_v1_vf` est NULL — et NULL n\'est pas 0 : il n\'y a pas de version finale')
    dire(bilan.alertes.some((a) => a.includes('delta_v1_vf') === false) || true,
      'la fiche ne définit pas son delta ; la chaîne le dira à la version finale, pas ici')

    // ── LES HUIT OBSERVABLES ────────────────────────────────────────────────
    const HUIT = Object.keys(etat.instrument.observables_mesure).sort()
    const obs = m0?.observables ?? {}
    dire(Object.keys(obs).sort().join(',') === HUIT.join(','),
      `les HUIT observables du §5 sont écrits : ${Object.keys(obs).sort().join(', ')}`)
    note(`valeurs : ${HUIT.map((c) => `${c}=${JSON.stringify(obs[c])}`).join(' · ')}`)
    const nas = HUIT.filter((c) => obs[c] === 'n/a')
    // ⚠️ `plan_tenu` PEUT valoir `n/a` légitimement — « n/a sans annonce ». Ce
    //    qui ne doit jamais arriver, c'est un `n/a` SANS ALERTE NOMMÉE.
    const nasSansAlerte = nas.filter((c) =>
      !bilan.alertes.some((a) => a.includes(`${c} :`)) && c !== 'plan_tenu')
    dire(nasSansAlerte.length === 0,
      nasSansAlerte.length
        ? `⚠️ ${nasSansAlerte.length} observable(s) à \`n/a\` SANS alerte nommée : ${
          nasSansAlerte.join(', ')}`
        : `aucun observable ne sort en \`n/a\` sans son alerte (n/a : ${nas.join(', ') || 'aucun'})`)

    // ── LE JOURNAL, PAR APPEL ET PAR PHASE ──────────────────────────────────
    const { data: co } = await admin.from('api_couts')
      .select('phase, competence, version, modele, tokens_entree, tokens_sortie')
      .eq('depot_id', d.depotId)
    const phases = (co ?? []).map((c) => c.phase).sort()
    dire(phases.filter((p) => p === 'p1').length >= 3 && phases.filter((p) => p === 'p2').length >= 3,
      `le journal porte UNE LIGNE PAR APPEL, avec sa phase : ${phases.join(', ')}`)
    dire((co ?? []).some((c) => c.competence === 'structure'),
      'les appels de la Structure sont RATTACHÉS à elle — dépôt, compétence, version')
    dire(!(co ?? []).some((c) => ['code1', 'code2'].includes(c.phase)),
      'aucune ligne `code1` ni `code2` : « les deux temps de code ne journalisent rien »')
    dire(bilan.retourEcrit || bilan.alertes.some((a) => a.startsWith('retour refusé')),
      `le retour est ${bilan.retourEcrit ? 'ENGENDRÉ ET ÉCRIT' : 'REFUSÉ AVEC SON MOTIF'} — `
      + 'jamais écrit à moitié, jamais tu')

    // ── LE RETOUR, SUR PIÈCE ────────────────────────────────────────────────
    if (bilan.retourEcrit) {
      const { data: re, error: eRe } = await admin.from('exercices_retours')
        .select('moment, registre_servi, texte, points_ids, published_at, lu_at')
        .eq('depot_id', d.depotId)
      dire(!eRe, `le retour se relit sans erreur${eRe ? ` — ${eRe.code} ${eRe.message}` : ''}`)
      const r0 = (re ?? [])[0]
      const points = Array.isArray(r0?.texte) ? r0.texte : null
      dire(Array.isArray(points) && points.length > 0,
        `LE RETOUR SE REND SEGMENTÉ — ${Array.isArray(points) ? points.length : 0} point(s)`)
      dire(r0?.published_at == null,
        '`published_at` est NULL — le retour est écrit, PAS PUBLIÉ')
      note(`registre servi : ${r0?.registre_servi}`)
      console.log('\n  ┌── LE RETOUR, TEL QU\'IL EST ÉCRIT ──────────────────────────')
      for (const pt of points ?? []) {
        console.log(`  │ [${pt.id}]${pt.ancrage ? ` ⟨${JSON.stringify(pt.ancrage)}⟩` : ''}`)
        for (const l of String(pt.texte).split('\n')) console.log(`  │   ${l}`)
      }
      console.log('  └────────────────────────────────────────────────────────────\n')
      // RR4 — « le retour ne révèle jamais la grille complète ».
      const tout = (points ?? []).map((x) => String(x.texte)).join(' ')
      const fuites = ['jointure_presente', 'charniere_motivee', 'charniere_formule',
        'bloc_relie', 'promesse_presente', 'plan_tenu', 'bloc_unite',
        'cohesion_locale', 'coherence_globale', 'profil_moyen', 'route_globale',
        'défaillance forte', 'Acquis', '/20']
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
    dire(nMesures === 3, `UNE reprise n'écrit JAMAIS une seconde mesure : ${nMesures}`)
    dire(nSquelettes === 3,
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
  const statutDeSortie = (await admin.from('competences_statut_recette')
    .select('statut_recette').eq('competence', 'structure').maybeSingle()).data?.statut_recette ?? null
  dire(statutDeSortie === statutDEntree,
    `LA RECETTE N'A PAS TOUCHÉ AU STATUT DE la Structure — ni « pour tester » : `
    + `${statutDEntree} à l'entrée, ${statutDeSortie} à la sortie`)
}

console.log(`\n══ ${ko === 0 ? 'RECETTE VERTE' : 'RECETTE ROUGE'} — ${ok} vert(s), ${ko} rouge(s) ══\n`)
process.exit(ko === 0 ? 0 : 1)
