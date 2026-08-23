// ============================================================================
// RECETTE C4 · L10 · CONNAISSANCE — LA QUATRIÈME COMPÉTENCE, ÉPROUVÉE SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Un dépôt réel traverse la chaîne et écrit UN SQUELETTE, UNE MESURE ET SA
//   LETTRE-ÉQUIVALENTE. »                        — le « fait quand » de C4-L10
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE, avec le client admin. Il ne
// rejoue pas les tests unitaires — ceux-là confrontent le portage au module de
// calibration, sans base et sans appel. Il éprouve ce qu'aucun test pur ne peut
// prouver : CE QUE LA CHAÎNE ÉCRIT VRAIMENT, ET OÙ ELLE S'ARRÊTE.
//
// ⚠️⚠️ ET IL RAPPORTE UN FAIT QUI N'EST PAS UNE PANNE. La Connaissance juge
//    contre DEUX RÉFÉRENTS, et le premier est LE CORPUS DU COURS DE LA CLASSE —
//    « c'est lui qui fait foi quand le cours diverge de la doctrine des
//    manuels » (fiche §1). Son `pre_p2` le réclame au contexte de l'exercice ;
//    LA CHAÎNE N'EN PORTE AUCUN, et aucune source du chantier n'en déclare un.
//    Servi à `null`, il ARRÊTE la mesure en nommant le slot — « c'est ainsi
//    qu'un module dit *le contexte ne porte pas ce qu'il me faut* sans jamais
//    lever d'exception ni inventer une valeur » (`CONTRAT` §2). ⭐ La fiche le
//    sait et l'écrit elle-même, à son §8, dans « LES VRAIES QUESTIONS
//    OUVERTES » : *« Le corpus de cours n'est déclaré dans aucune source qui
//    fait foi […] Le premier référent de la Justesse repose donc sur un objet
//    que le chantier n'a jamais écrit »*, et sa condition de fermeture est
//    « la séance qui écrira l'assembleur, ou celle qui déclarera le corpus dans
//    une source ». **Ce script le CONSTATE en base plutôt que de le supposer.**
//
//   A. l'état du jour     — la cohérence, ce qui est ouvert, ce qui attend
//   B. le décor           — un `paragraphe` de la maison qui mesure LES QUATRE
//   C. la cible du retour — la `cible_primaire` bat l'ordre alphabétique
//   D. LES SEPT SLOTS     — le pré-relevé mécanique, la tête cacheable, et LE
//                           REFUS DU CORPUS, joué sans un appel
//   E. la chaîne réelle   — les appels, les squelettes, les mesures, et LE POINT
//                           EXACT où la Connaissance s'arrête
//   F. l'idempotence      — une reprise n'écrit JAMAIS une seconde mesure
//   G. le nettoyage       — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/connaissance-c4l10.mjs [--sans-appel | --retire]
//
// `--sans-appel` saute la partie E : aucune requête au fournisseur, aucun coût.
// `--retire`     ne fait que le geste symétrique : il retire un décor laissé.
//
// ⛔ CE SCRIPT NE POSE AUCUN STATUT DE RECETTE, ET N'EN PROPOSE AUCUN. Le
//    professeur choisit, à l'écran de C4-L8. Une compétence naît
//    `mesuree_silencieusement` — « l'oubli n'envoie jamais un verdict faux à un
//    élève ».
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
//    raison qui n'en était pas une.
const VERSION_ATTENDUE = MANIFESTE_LU.competences.connaissance?.version
const { separerTete, messageDuGabarit, slotsDu, refusSlotsJugement } =
  await import(`${RACINE}/utils/chaine/slots.ts`)
const { lireStatutsRecette, lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const RETIRE_SEUL = process.argv.includes('--retire')
const MARQUE = 'RECETTE-C4L10-CON'
let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)

// ── La copie de recette. Elle est écrite POUR PORTER DES FAITS QUE LE §3 NOMME ─
// des unités de CHACUN des quatre registres — une référence d'auteur, un concept
// du cours, un exemple, une donnée —, une unité manifestement PLAQUÉE (juste,
// mais qui ne travaille pas), et UNE MENTION VIDE (« comme le dit Kant ») qui ne
// doit créer AUCUNE unité. Elle n'est PAS une copie d'élève réelle : les
// copies-tests ne sortent jamais de leur dépôt, et « jeu de test intouchable »
// vaut aussi dans l'autre sens.
const COPIE = [
  'La technique nous rend-elle plus libres ? Bergson soutient que l\'intelligence '
  + 'est d\'abord une faculté de fabriquer des outils, et que l\'homme est un '
  + 'homo faber avant d\'être un homo sapiens : c\'est par l\'outil qu\'il élargit '
  + 'son action sur le monde.',

  'Il faut ici distinguer la liberté d\'indifférence et la liberté éclairée, '
  + 'distinction que nous avons vue en cours : la première n\'est qu\'un pouvoir '
  + 'de choisir au hasard, la seconde suppose que l\'on sache pourquoi l\'on '
  + 'choisit. La technique augmente la première sans garantir la seconde.',

  'L\'exemple de l\'imprimerie le montre : elle a multiplié les livres '
  + 'disponibles, mais elle n\'a pas rendu les lecteurs plus attentifs, et les '
  + 'contemporains de Gutenberg s\'en plaignaient déjà.',

  'On estime aujourd\'hui qu\'un adulte consulte son téléphone plus de cent '
  + 'cinquante fois par jour, ce qui donne une idée assez nette de la dépendance '
  + 'que l\'outil installe sans qu\'on l\'ait choisie.',

  'La théorie des quatre causes d\'Aristote — matérielle, formelle, efficiente et '
  + 'finale — est d\'ailleurs l\'une des plus célèbres de toute la philosophie '
  + 'antique. Comme le dit Kant, il faut y réfléchir.',
].join('\n\n')

const CONSIGNE = `${MARQUE} — rédige un paragraphe qui mobilise ce que tu as appris : `
  + 'auteurs, notions du cours, exemples, données.'

// ── Le décor ────────────────────────────────────────────────────────────────
async function semer() {
  const { data: type } = await admin.from('exercices_types')
    .select('id, code, crans_admis, competences').eq('code', 'paragraphe').maybeSingle()
  if (!type) throw new Error('décor introuvable : le type `paragraphe` n\'est pas au seed')
  for (const c of ['connaissance', 'argumentation', 'expression', 'structure']) {
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
      // ⚠️ La consigne est CE QUE LES SLOTS `{sujet}` ET `{consigne}` recevront :
      //    la table `exercices` porte la consigne instanciée et la PROVENANCE de
      //    ses matériaux, jamais le texte d'un sujet distinct (`07-` §1.1).
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

  // ⭐ QUATRE compétences sur la même instance — c'est la première fois.
  const LES_QUATRE = {
    connaissance: ['composer'], structure: ['composer'],
    argumentation: ['composer'], expression: ['composer'],
  }
  return {
    eleveId: eleve.eleve_id,
    // Celle qui traverse la chaîne pour de vrai — elle vise la Connaissance.
    vise_connaissance: await uneInstance('connaissance', COPIE, LES_QUATRE),
    // ⭐ CELLE QUI DISCRIMINE : le repli alphabétique dirait « argumentation »
    //    (elle passe avant « connaissance »), donc seule une `cible_primaire`
    //    réellement lue peut rendre « connaissance ».
    vise_connaissance_bis: await uneInstance('connaissance', COPIE,
      { connaissance: ['composer'], argumentation: ['composer'] }),
    // Et celle qui ne vise rien : l'alerte doit tomber.
    sans_cible: await uneInstance(null, COPIE, LES_QUATRE),
  }
}

const chaque = (d) => [d.vise_connaissance, d.vise_connaissance_bis, d.sans_cible].filter(Boolean)

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
  dire(ouvertes.includes('connaissance') && ouvertes.length === 4,
    `QUATRE compétences ouvertes, la Connaissance comprise : ${ouvertes.join(', ') || 'aucune'}`)
  const attente = competencesEnAttenteDeBranchement()
  dire(attente.length === 2,
    `en attente de branchement (C4-L10 se rejoue pour elles) : ${attente.join(', ') || 'aucune'}`)
  const etat = etatCompetence('connaissance')
  dire(!!VERSION_ATTENDUE && etat.instrument?.version === VERSION_ATTENDUE,
    'l\'instrument dérivé porte la VERSION DE LA FICHE que le manifeste déclare : '
    + `${etat.instrument?.version} (manifeste : ${VERSION_ATTENDUE})`)
  const obs = Object.keys(etat.instrument?.observables_mesure ?? {})
  dire(obs.length === 8, `huit observables de télémétrie au bloc machine (§5) : ${obs.length}`)
  // ⚠️⚠️ LA FORME DÉRIVÉE EST UN BLOC PAR PARAMÈTRE, jamais une valeur à plat —
  //    et la Connaissance est l'une des DEUX fiches qui en portent l'essentiel.
  //    « Un `seuil_parametre` lu sur le bloc rend un objet, la comparaison au
  //    seuil devient impossible, et l'observable sort EN SILENCE du dénominateur. »
  const plats = valeursDesParametres(etat.instrument)
  dire(Object.keys(plats).length === 6,
    `SIX paramètres, lus par \`valeursDesParametres()\` : ${
      Object.entries(plats).map(([k, v]) => `${k}=${v}`).join(', ')}`)
  dire(Object.values(plats).every((v) => typeof v === 'number'),
    '⭐ ils sortent en NOMBRES — la forme dérivée est un BLOC (`defaut`, `bornes`, '
    + '`statut`), et `valeursDesParametres()` est le seul domicile qui l\'aplatit')
  dire(typeof etat.instrument?.parametres?.seuil_ratio_haut === 'object',
    '⚠️ et `instrument.parametres` porte bien un OBJET : le lire à plat rendrait un bloc')
  dire(etat.branchement?.delta === undefined,
    '`delta` n\'est PAS déclaré : le mot n\'apparaît PAS UNE FOIS dans la fiche '
    + '(QUATRIÈME fiche sur quatre à se taire)')
  dire(typeof etat.branchement?.conformite === 'function',
    '⭐ `conformite` est déclaré — la Connaissance est l\'un des DEUX modules sur six à '
    + 'porter le contrôle d\'existence des citations, et le seul à le porter LÀ')
  dire(paramsAvant?.chaine_actif === false, '`chaine_actif` est à OFF avant la recette')

  console.log('\n══ B. LE DÉCOR ═════════════════════════════════════════════════')
  decor = await semer()
  for (const [nom, d] of Object.entries(decor)) {
    if (nom === 'eleveId') continue
    note(`${nom} : exercice ${d.exerciceId.slice(0, 8)} · dépôt ${d.depotId.slice(0, 8)}`)
  }
  const statuts = await lireStatutsRecette(admin, decor.eleveId)
  dire(statuts.connaissance === 'mesuree_silencieusement',
    `la Connaissance NAÎT \`mesuree_silencieusement\` — statut lu : ${statuts.connaissance}. `
    + 'Ce script n\'en pose aucun : le professeur choisit (`01-` §3 ; `03-` §9)')

  console.log('\n══ C. LA CIBLE DU RETOUR — LA `cible_primaire` BAT L\'ALPHABET ══')
  for (const [nom, attendu, nMesurees] of [['vise_connaissance', 'connaissance', 4],
    ['vise_connaissance_bis', 'connaissance', 2], ['sans_cible', 'argumentation', 4]]) {
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
        + 'qui n\'est visée par personne')
    } else {
      dire(!flou && cible === 'connaissance',
        `⭐ ${nom} : la \`cible_primaire\` BAT L'ORDRE ALPHABÉTIQUE — le repli aurait dit `
        + '« argumentation ». C4-L11 est joué, et cela se voit ici pour la QUATRIÈME fois.')
    }
  }

  console.log('\n══ D. LES SEPT SLOTS, ET LE REFUS DU CORPUS ════════════════════')
  const branchement = etat.branchement
  const ctxSlots = {
    modes: ['composer'], cran: 6, referent: null, exceptionOrthographe: false,
    contexteExercice: { sujet: CONSIGNE, consigne: CONSIGNE, copie: COPIE, mode: 'composer' },
    prives: {}, sorties: {}, parametres: plats,
  }
  const spec = branchement.extractions(ctxSlots)[0]
  const gabarit = etat.instrument.prompts[spec.tetePrompt]
  dire(slotsDu(gabarit).sort().join(',') === 'consigne,pre_releve,production',
    `⭐ le prompt P1 porte TROIS slots : ${slotsDu(gabarit).sort().join(', ')}`)
  dire([...spec.slotsFournis].sort().join(',') === 'pre_releve,production',
    `\`pre_p1\` en sert DEUX ; \`{consigne}\` est NATIF : ${spec.slotsFournis.join(', ')}`)

  // ⭐ LE PRÉ-RELEVÉ MÉCANIQUE — « le relevé cite en numéros, le code convertit ».
  const rendu = spec.pre(ctxSlots)
  const nPhrases = Number(/\((\d+) phrases, (\d+) mots\)/.exec(rendu.pre_releve)?.[1] ?? -1)
  const nMots = Number(/\((\d+) phrases, (\d+) mots\)/.exec(rendu.pre_releve)?.[2] ?? -1)
  dire(rendu.production === COPIE, '`pre_p1` sert la production TELLE QUELLE dans son slot')
  dire(nPhrases > 5 && rendu.pre_releve.startsWith('[1] '),
    `⭐ le pré-relevé numérote les phrases : ${nPhrases} phrases, ${nMots} mots, à partir de [1]`)
  dire(new RegExp(`\\[${nPhrases}\\] `).test(rendu.pre_releve),
    `la numérotation va jusqu'à [${nPhrases}] — aucune phrase n'est perdue`)

  const { tete, queue } = separerTete(gabarit)
  const valeurs = {}
  for (const nom of slotsDu(gabarit)) {
    valeurs[nom] = rendu[nom] ?? ctxSlots.contexteExercice[nom] ?? ''
  }
  const message = messageDuGabarit(queue, valeurs, 'Rends le relevé au format déclaré ci-dessus.')
  dire(slotsDu(tete).length === 0 && tete.length > 1000,
    `LA TÊTE NE PORTE AUCUN SLOT et fait ${tete.length} caractères — elle est identique d'une `
    + 'copie à l\'autre, donc elle se cache')
  dire(!message.includes('{production}') && !message.includes('{pre_releve}')
    && !message.includes('{consigne}'),
  'AUCUN SLOT LITTÉRAL ne subsiste dans le message')
  dire(message.includes('<<<MATERIAU') && message.includes('MATERIAU>>>'),
    'les trois matériaux arrivent EN BLOCS BALISÉS (`01-` §12, défense 1)')
  dire(message.includes('[1] La technique nous rend-elle plus libres ?'),
    'le message porte le pré-relevé NUMÉROTÉ — ce sont ces numéros que le relevé citera')

  // ── LE PROMPT DE JUGEMENT, ET SES QUATRE SLOTS ──────────────────────────
  const specP2 = branchement.jugement(ctxSlots)
  const gabaritP2 = etat.instrument.prompts[specP2.tetePrompt]
  dire(slotsDu(gabaritP2).length === 4,
    `⭐⭐ le prompt de jugement porte QUATRE slots — le maximum du corpus : ${
      slotsDu(gabaritP2).sort().join(', ')}`)
  dire(specP2.slotDocument === 'releve_phase_1',
    '⭐ `SLOT_DOCUMENT_P2` est DÉCLARÉ, jamais deviné par soustraction — « jusqu\'au jour '
    + 'où un `pre_p2` incomplet ferait passer le relevé entier dans le slot du référent »')
  const { refus } = refusSlotsJugement(gabaritP2, specP2.slotDocument, specP2.slotsFournis, [])
  dire(refus.length === 0,
    `le contrôle des DEUX SENS tombe AU CHARGEMENT, et il est vert : ${refus.length} refus`)

  // ⚠️⚠️ LE FAIT DU JOUR, CONSTATÉ ET NON SUPPOSÉ.
  const servisSansCorpus = specP2.preP2(ctxSlots)
  dire(servisSansCorpus.corpus_cours === null,
    '⚠️⚠️ `pre_p2` SERT `corpus_cours` À `null` : le contexte de l\'exercice n\'en porte '
    + 'aucun, et AUCUN fournisseur natif ne l\'a')
  dire(servisSansCorpus.consigne === CONSIGNE && servisSansCorpus.restitution_de_cours === 'non',
    `les deux autres métadonnées, elles, sont servies : consigne (${
      String(servisSansCorpus.consigne).length} car.), restitution_de_cours = « ${
      servisSansCorpus.restitution_de_cours} »`)
  const ctxAvecCorpus = {
    ...ctxSlots,
    contexteExercice: { ...ctxSlots.contexteExercice, corpus_cours: 'Le cours de la classe.' },
  }
  dire(specP2.preP2(ctxAvecCorpus).corpus_cours === 'Le cours de la classe.',
    '⭐ et il le sert dès que le contexte le porte : le canal est bon, c\'est LA SOURCE '
    + 'qui manque (fiche §8, « vraies questions ouvertes »)')

  if (SANS_APPEL) {
    console.log('\n══ E. LA CHAÎNE RÉELLE — SAUTÉE (--sans-appel) ═════════════════')
    note('aucune requête au fournisseur, aucun coût. La mesure ne s\'écrit donc pas : '
      + 'c\'est le drapeau, pas une panne.')
  } else {
    console.log('\n══ E. LA CHAÎNE RÉELLE ════════════════════════════════════════')
    const d = decor.vise_connaissance
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const t0 = Date.now()
    const bilan = await traiterDepot(admin, d.depotId, 'v1')
    const duree = Date.now() - t0
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)

    note(`bilan : ${bilan.appels} appel(s), ${duree} ms, mesures écrites ${bilan.mesuresEcrites}`)
    note(`⭐ LATENCE À QUATRE CHAÎNES EN PARALLÈLE : ${Math.round(duree / 1000)} s`)
    for (const a of bilan.alertes) note(`alerte : ${a}`)
    for (const e of bilan.competencesEcartees) note(`écartée — ${e.competence} : ${e.motif}`)

    // ⚠️⚠️ CE QUI EST ATTENDU, ET QUI N'EST PAS UNE PANNE.
    const refusCorpus = (bilan.alertes ?? [])
      .find((x) => x.startsWith('connaissance : ') && x.includes('corpus_cours'))
    dire(!!refusCorpus,
      '⚠️⚠️ LA CONNAISSANCE N\'ÉCRIT AUCUNE MESURE, ET LA CHAÎNE LE DIT PAR UNE ALERTE '
      + 'NOMMÉE — jamais un trou silencieux')
    dire(/REFUS.*corpus_cours/.test(refusCorpus ?? ''),
      `⭐ ET L'ALERTE NOMME LE SLOT : « ${refusCorpus ?? '(aucune)'} »`)
    // ⭐⭐ LE FAIT DE VOCABULAIRE QUE CE LOT EST LE PREMIER À RENDRE VISIBLE, et il
    //    appartient au bilan de C4-L5, pas à ce lot. `competencesMesurees` nomme
    //    CE QUE L'EXERCICE SOUMET à la chaîne froide — il se calcule AVANT les
    //    passages (`competencesFroides.filter(ouvertes.has)`) —, et
    //    `competencesEcartees` ne porte que les écartements DE PRÉ-VOL (statut
    //    `differee`, compétence non branchée) ou les chaînes qui ONT LEVÉ. Une
    //    chaîne qui tourne et REFUSE proprement, elle, reste dans « mesurées » et
    //    dit son motif en alerte. ⭐ LE CHIFFRE QUI NE MENT PAS EST
    //    `mesuresEcrites` — et `resumerBilan` affiche bien les deux côte à côte.
    //    ⚠️ La Connaissance est LA PREMIÈRE compétence du chantier à être refusée
    //    EN COURS DE CHAÎNE plutôt qu'au pré-vol : le cas n'existait pas avant.
    //    *Relevé, jamais corrigé ici : `chaine.ts` est bâtie et éprouvée.*
    dire(bilan.competencesMesurees.includes('connaissance')
      && bilan.mesuresEcrites === 3 && bilan.competencesMesurees.length === 4,
    `⭐⭐ QUATRE compétences SOUMISES (${bilan.competencesMesurees.join(', ')}), TROIS mesures `
    + `ÉCRITES (${bilan.mesuresEcrites}) : c'est \`mesuresEcrites\` qui dit la vérité, et `
    + '`competencesMesurees` nomme ce qui a été SOUMIS — un refus en cours de chaîne '
    + 'n\'en sort pas (bilan de C4-L5 ; relevé, non corrigé)')
    dire((bilan.competencesEcartees ?? []).length === 0,
      `AUCUN écartement de PRÉ-VOL : les quatre compétences étaient bien éligibles (${
        (bilan.competencesEcartees ?? []).length})`)

    // ── LE SQUELETTE — il est écrit AVANT le jugement ────────────────────────
    const { data: sq } = await admin.from('exercices_squelettes')
      .select('competence, version, artefact_extraction, artefact_jugement, instrument_version, modele')
      .eq('depot_id', d.depotId)
    const s0 = (sq ?? []).find((x) => x.competence === 'connaissance')
    dire(!!s0, `⭐ LE SQUELETTE DE LA CONNAISSANCE EST ÉCRIT — ${(sq ?? []).length} squelette(s) `
      + `en tout : ${(sq ?? []).map((x) => x.competence).join(', ')}`)
    dire(!!s0?.artefact_extraction && !s0?.artefact_jugement,
      'il porte SON EXTRACTION et PAS son jugement — la chaîne s\'est arrêtée entre les deux, '
      + 'exactement là où le contrat le prescrit')
    dire(s0?.instrument_version === VERSION_ATTENDUE,
      `\`instrument_version\` EST la ligne VERSION de la fiche : ${s0?.instrument_version}`)

    // ⭐ LE RELEVÉ RÉEL — ce que P1 a trouvé dans la copie.
    const p1 = s0?.artefact_extraction?.p1 ?? {}
    const unites = p1.unites_mobilisees ?? []
    dire(Array.isArray(unites) && unites.length > 0,
      `le relevé de P1 porte ${unites.length} unité(s) mobilisée(s)`)
    note(`registres relevés : ${JSON.stringify([...new Set(unites.map((u) => u.type))])}`)
    note(`sources relevées : ${JSON.stringify([...new Set(unites.map((u) => u.source))])}`)
    note(`mentions vides : ${JSON.stringify(p1.mentions_vides ?? [])}`)
    // ⚠️ « Le modèle ne rend ni niveau, ni dimension, ni décompte » (`01-` §11).
    const interdits = ['niveau', 'diversite', 'registres', 'sources', 'justesse', 'palier']
      .filter((k) => k in p1)
    dire(interdits.length === 0,
      `P1 NE REND AUCUN DÉCOMPTE : champs rendus — ${Object.keys(p1).join(', ')}`)
    // ⚠️ ET IL EST AVEUGLE AU SAVOIR ATTENDU : aucun verdict de justesse au relevé.
    const juges = unites.filter((u) => 'justesse' in u || 'attribution' in u || 'apropos' in u)
    dire(juges.length === 0,
      `⭐ LE RELEVÉ EST AVEUGLE : ${juges.length} unité(s) portent un verdict — « c'est ce `
      + 'qui l\'empêche de corriger l\'élève en le relevant » (fiche §3)')

    // ── CE QUE `code1` EN TIRE, sur le relevé RÉEL ───────────────────────────
    const c1 = branchement.code1(s0?.artefact_extraction ?? {}, { ...ctxSlots, parametres: plats })
    note(`code1 sur le relevé réel : ${JSON.stringify(c1.mesures)}`)
    for (const a of c1.alertes) note(`  alerte code1 : ${a}`)
    dire(typeof c1.mesures.n_unites === 'number' && typeof c1.mesures.registres === 'number',
      `⭐ LES DEUX COMPTES SONT CALCULÉS SUR UNE COPIE RÉELLE : ${c1.mesures.n_unites} unité(s), `
      + `${c1.mesures.registres} registre(s), ${c1.mesures.sources} source(s)`)
    dire('document_p2' in c1,
      '`document_p2` est présent — « le seul défaut de ce contrat dont rien ne témoigne »')

    // ── LA MESURE : aucune pour la Connaissance, trois pour les autres ───────
    const { data: me } = await admin.from('competences_mesures')
      .select('competence, lettre_equivalente, observables, instrument_version, delta_v1_vf')
      .eq('depot_id', d.depotId)
    dire(!(me ?? []).some((x) => x.competence === 'connaissance'),
      '⚠️ AUCUNE MESURE de Connaissance — et c\'est la bonne conduite : une mesure écrite '
      + 'sans référent aurait été une lettre fausse servie à un élève')
    dire((me ?? []).length === 3,
      `TROIS mesures écrites, pour les trois autres : ${
        (me ?? []).map((x) => `${x.competence}=${x.lettre_equivalente}`).join(', ')}`)
    dire((me ?? []).every((x) => ['E', 'D', 'C', 'B', 'A'].includes(x.lettre_equivalente)),
      'et leurs lettres sont des paliers du référentiel — la chaîne des trois aînées '
      + 'n\'est pas emportée par l\'arrêt de la quatrième')
  }

  console.log('\n══ F. L\'IDEMPOTENCE ═══════════════════════════════════════════')
  if (SANS_APPEL) {
    note('sautée : elle n\'a de sens qu\'après un passage réel.')
  } else {
    const d = decor.vise_connaissance
    const { count: avant } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotId)
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const bis = await traiterDepot(admin, d.depotId, 'v1')
    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)
    const { count: apres } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotId)
    dire(avant === apres,
      `une reprise n'écrit AUCUNE seconde mesure : ${avant} avant, ${apres} après `
      + `(${bis.appels} appel(s) — les chaînes déjà écrites ne se rejouent pas)`)
  }
} catch (e) {
  ko++
  console.log(`\n✗ EXCEPTION : ${e?.message ?? e}`)
  console.log(e?.stack ?? '')
} finally {
  console.log('\n══ G. LE NETTOYAGE — le geste est SYMÉTRIQUE ═══════════════════')
  try {
    if (paramsAvant) {
      await admin.from('scriptorium_params')
        .update({ chaine_actif: paramsAvant.chaine_actif }).eq('id', paramsAvant.id)
      const apres = await etatInterrupteur()
      dire(apres?.chaine_actif === paramsAvant.chaine_actif,
        `\`chaine_actif\` est rendu à son état d'avant : ${apres?.chaine_actif}`)
    }
    await nettoyer(decor)
    const restants = await decorLaisse()
    dire(restants.length === 0,
      `plus aucune entrée « ${MARQUE} » en base : ${restants.length}`)
  } catch (e) {
    ko++
    console.log(`✗ nettoyage : ${e?.message ?? e}`)
  }
  console.log(`\n═══ ${ok} contrôle(s) vert(s), ${ko} rouge(s). ═══`)
  process.exit(ko ? 1 : 0)
}
