// ============================================================================
// RECETTE C4 · L10 · QUESTIONNEMENT — LA CINQUIÈME COMPÉTENCE, ÉPROUVÉE SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Un dépôt réel traverse la chaîne et écrit UN SQUELETTE, UNE MESURE ET SA
//   LETTRE-ÉQUIVALENTE. »                        — le « fait quand » de C4-L10
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE, avec le client admin. Il ne
// rejoue pas les tests unitaires — ceux-là confrontent le portage au module de
// calibration, sans base et sans appel. Il éprouve ce qu'aucun test pur ne peut
// prouver : CE QUE LA CHAÎNE ÉCRIT VRAIMENT, ET OÙ ELLE S'ARRÊTE.
//
// ⚠️⚠️ ET IL RAPPORTE UN FAIT QUI N'EST PAS UNE PANNE, MAIS QUI N'EST PAS NON
//    PLUS CELUI DE LA CONNAISSANCE. Le Questionnement juge contre UN RÉFÉRENT
//    QUI CHANGE AVEC LE MODE : « les termes exacts du sujet en `composer`, le
//    problème réel du texte dans les modes réceptifs, tel que la référence
//    décomposée le porte — c'est son champ `armature.question_directrice`, et le
//    module n'en lit aucun autre » (fiche §4).
//    · En `composer`, le référent est LE SUJET : natif, la chaîne l'a, LA MESURE
//      S'ÉCRIT.
//    · Dans les quatre modes réceptifs, la chaîne NE DESCEND PAS la référence
//      décomposée — `contexte.ts` ne lit `exercices.reference_id` que pour en
//      déduire un référent `texte | cours | null` —, le slot est servi à `null`,
//      et la mesure S'ARRÊTE EN LE NOMMANT.
//    ⭐ LA DIFFÉRENCE D'AVEC LE CORPUS DE COURS : là, aucune source ne déclarait
//      l'objet ; ici LA SOURCE LE DÉCLARE, l'écran de conception le valide et la
//      table `exercices_references` le porte — c'est LA CHAÎNE qui ne le sert
//      pas. **Ce script le CONSTATE en base plutôt que de le supposer.**
//    ⚠️ Et il mord chez les HLP, où le Questionnement n'est ciblé QU'en modes
//      autres que `composer` (`01-` §3, R2).
//
//   A. l'état du jour     — la cohérence, ce qui est ouvert, ce qui attend
//   B. le décor           — une `problematisation`, l'objet PROPRE de la
//                           compétence, qui mesure LES TROIS
//   C. la cible du retour — la `cible_primaire` bat l'ordre alphabétique
//   D. LES CINQ SLOTS     — deux natifs à P1, trois à P2, et LES DEUX RÉFÉRENTS
//                           joués sans un appel
//   E. la chaîne réelle   — les appels, les squelettes, les mesures, la lettre,
//                           et LE POINT EXACT où le mode réceptif s'arrête
//   F. l'idempotence      — une reprise n'écrit JAMAIS une seconde mesure
//   G. le nettoyage       — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/questionnement-c4l10.mjs [--sans-appel | --retire]
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
  verifierCoherence, competencesOuvertes, competencesEnAttenteDeBranchement,
  etatCompetence, valeursDesParametres, MANIFESTE_LU,
} = await import(`${RACINE}/utils/chaine/instruments.ts`)
const VERSION_ATTENDUE = MANIFESTE_LU.competences.questionnement?.version
const { separerTete, messageDuGabarit, slotsDu, refusSlotsJugement } =
  await import(`${RACINE}/utils/chaine/slots.ts`)
const { lireStatutsRecette, lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { statutDeLaMesure } = await import(`${RACINE}/utils/chaine/observables.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

/**
 * ⚠️⚠️ `supabase-js` NE LÈVE PAS — il rend `{ data: null, error }`. Une lecture
 *    dont on ignore le retour échoue INVISIBLEMENT, et `(data ?? []).length`
 *    rend alors ZÉRO, qui ressemble à une mesure. C'est ce qui a fait rougir ce
 *    script à son premier tour, sur une colonne qui n'existe pas
 *    (`competences_mesures.alertes`) : la chaîne avait bien écrit ses trois
 *    mesures, et la RECETTE lisait mal. *Le même motif que l'item 31 de la boîte
 *    aux lettres — « la recette lisait le mauvais champ et rougissait pour
 *    rien ».*
 */
function lu(nom, { data, error }) {
  if (error) throw new Error(`lecture « ${nom} » : ${error.message}`)
  return data
}

const SANS_APPEL = process.argv.includes('--sans-appel')
const RETIRE_SEUL = process.argv.includes('--retire')
const MARQUE = 'RECETTE-C4L10-QUE'

let ok = 0; let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)

// ── La copie de recette. Elle est écrite POUR PORTER DES FAITS QUE LE §3 NOMME ─
// une QUESTION EXPLICITE, deux notions ARTICULÉES (leur opposition est dite), un
// ENJEU ÉNONCÉ (ce qu'une réponse changerait), une RÉPONSE CONCURRENTE ÉNONCÉE
// et citable, puis DEUX recadrages : l'un qui déplace ET se reprend — il doit
// ouvrir le seuil —, l'autre purement VERBAL — « mais qu'est-ce que la liberté,
// au fond ? » posé et aussitôt abandonné —, qui doit alimenter
// `recadrage_verbal` sans rien élever. ⭐ Les deux recadrages font des comptes
// ASYMÉTRIQUES, ce qui est la parade des items 11 et 20 de la boîte aux lettres.
// Elle n'est PAS une copie d'élève réelle : les copies-tests ne sortent jamais de
// leur dépôt, et « jeu de test intouchable » vaut aussi dans l'autre sens.
const COPIE = [
  'Obéir à la loi, est-ce renoncer à sa liberté ? La question mérite d\'être posée, '
  + 'car les deux termes semblent d\'abord s\'exclure : obéir, c\'est se soumettre à '
  + 'une volonté qui n\'est pas la mienne, et être libre, c\'est n\'obéir qu\'à '
  + 'soi-même. Pourtant une loi commune peut être la condition de ma liberté plutôt '
  + 'que son contraire.',

  'Ce qui se joue ici n\'est pas mince : selon la réponse qu\'on apporte, on tiendra '
  + 'l\'État soit pour l\'ennemi naturel de l\'individu, soit pour ce qui rend sa '
  + 'liberté effective. On pourrait en effet soutenir, à l\'inverse de ce que je viens '
  + 'de dire, que toute obéissance est une aliénation et que seule l\'anarchie serait '
  + 'conforme à la liberté : c\'est la réponse que donnent les libertariens.',

  'Mais il faut ici s\'arrêter sur le mot « obéir ». Tant qu\'on entend par là '
  + 'exécuter un ordre reçu, la question n\'a qu\'une réponse. Si l\'on distingue '
  + 'obéir à un maître et obéir à une règle que l\'on s\'est donnée, ce n\'est plus la '
  + 'même question : ce qu\'il faut alors trancher n\'est plus si l\'obéissance nie la '
  + 'liberté, mais à quelles conditions une règle peut être dite mienne.',

  'C\'est bien sous cette question nouvelle que la suite se conduira : nous chercherons '
  + 'd\'abord à quelles conditions une règle peut être tenue pour mienne, puis nous '
  + 'verrons que ces conditions ne sont réunies ni dans la contrainte pure ni dans '
  + 'l\'absence de règle.',

  'Mais au fond, qu\'est-ce que la liberté ? La question est vaste. Revenons à notre '
  + 'sujet : la loi commune permet à chacun de prévoir ce que les autres feront.',
].join('\n\n')

const CONSIGNE = `${MARQUE} — construis la problématique que ce sujet appelle : `
  + '« Obéir à la loi, est-ce renoncer à sa liberté ? »';

// ── Le décor ────────────────────────────────────────────────────────────────
async function semer() {
  // ⭐ `problematisation` est L'OBJET PROPRE du Questionnement — « le seul dont
  //    elle soit la raison d'être » (fiche §6). Il mesure TROIS compétences :
  //    expression, questionnement, structure.
  const { data: type } = await admin.from('exercices_types')
    .select('id, code, crans_admis, competences').eq('code', 'problematisation').maybeSingle()
  if (!type) throw new Error('décor introuvable : le type `problematisation` n\'est pas au seed')
  for (const c of ['questionnement', 'expression', 'structure']) {
    if (!(type.competences ?? []).includes(c)) {
      throw new Error(`le type \`problematisation\` ne mesure pas « ${c} »`)
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
      // ⚠️ La consigne est CE QUE LE SLOT `{sujet}` RECEVRA : la table
      //    `exercices` porte la consigne instanciée et la PROVENANCE de ses
      //    matériaux, jamais le texte d'un sujet distinct (`07-` §1.1).
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

  const LES_TROIS = {
    questionnement: ['composer'], expression: ['composer'], structure: ['composer'],
  }
  return {
    eleveId: eleve.eleve_id,
    // Celle qui traverse la chaîne pour de vrai — elle vise le Questionnement.
    vise_questionnement: await uneInstance('questionnement', COPIE, LES_TROIS),
    // ⭐ CELLE QUI DISCRIMINE : le repli alphabétique dirait « expression » (elle
    //    passe avant « questionnement »), donc seule une `cible_primaire`
    //    réellement lue peut rendre « questionnement ».
    vise_questionnement_bis: await uneInstance('questionnement', COPIE,
      { questionnement: ['composer'], expression: ['composer'] }),
    // ⚠️⚠️ ET CELLE DU MODE RÉCEPTIF — le fait du jour. La même copie, le même
    //    sujet, mais `interroger` : le référent devient le problème réel du
    //    texte, et la chaîne n'en porte aucun.
    mode_receptif: await uneInstance('questionnement', COPIE,
      { questionnement: ['interroger'], expression: ['composer'] }),
    // Et celle qui ne vise rien : l'alerte doit tomber.
    sans_cible: await uneInstance(null, COPIE, LES_TROIS),
  }
}

const chaque = (d) => [d.vise_questionnement, d.vise_questionnement_bis, d.mode_receptif,
  d.sans_cible].filter(Boolean)

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
  // ⚠️ LE COMPTE ÉTAIT FIGÉ au jour de l'écriture. Les six sont ouvertes depuis
  //    le 23/08 : ce qui compte est que CELLE-CI le soit, pas combien elles sont.
  dire(ouvertes.includes('questionnement'),
    `le Questionnement est OUVERTE à la chaîne — ${ouvertes.length} au total : ${
      ouvertes.join(', ') || 'aucune'}`)
  const attente = competencesEnAttenteDeBranchement()
  // ⚠️ Idem. La règle, elle, ne bouge pas : rien ne peut être À LA FOIS ouvert
  //    et en attente de branchement.
  dire(attente.every((c) => !ouvertes.includes(c)),
    `en attente de branchement : ${attente.join(', ') || 'aucune'} — et aucune n'est `
    + 'déjà ouverte')
  const etat = etatCompetence('questionnement')
  dire(!!VERSION_ATTENDUE && etat.instrument?.version === VERSION_ATTENDUE,
    'l\'instrument dérivé porte la VERSION DE LA FICHE que le manifeste déclare : '
    + `${etat.instrument?.version} (manifeste : ${VERSION_ATTENDUE})`)
  const obs = Object.keys(etat.instrument?.observables_mesure ?? {})
  dire(obs.length === 9, `neuf observables de télémétrie au bloc machine (§5) : ${obs.length}`)
  // ⭐⭐ LE SEUL OBSERVABLE DU CORPUS QUI SOIT DANS LES DEUX LISTES.
  dire(obs.includes('question_specifique')
    && (etat.instrument?.bloc_machine?.observables ?? {}).question_specifique !== undefined,
  '⭐⭐ `question_specifique` EST DANS LES DEUX LISTES — le seul du corpus sur 24 observables '
  + 'de module et 56 de télémétrie (`03-` §9). Un seul calcul, deux lectures.')
  // ⭐ UN SEUL paramètre, et il est TEXTUEL : aucun `PARAMS_FLOTTANTS` ici.
  const plats = valeursDesParametres(etat.instrument)
  dire(Object.keys(plats).length === 1 && plats.conjonction_bon === 'stricte',
    `UN SEUL paramètre, lu par \`valeursDesParametres()\` : ${
      Object.entries(plats).map(([k, v]) => `${k}=${v}`).join(', ')}`)
  dire(typeof plats.conjonction_bon === 'string'
    && typeof etat.instrument?.parametres?.conjonction_bon === 'object',
  '⭐ il sort en TEXTE, et `instrument.parametres` porte bien un BLOC — le lire à plat '
  + 'rendrait un objet, et aucun seuil de cette fiche n\'est un NOMBRE : le huitième écart '
  + 'de langage (`str()` d\'un flottant) ne peut pas mordre ici')
  dire(etat.branchement?.delta === undefined,
    '`delta` n\'est PAS déclaré : le mot n\'apparaît PAS UNE FOIS dans la fiche '
    + '(CINQUIÈME fiche sur cinq à se taire)')
  dire(typeof etat.branchement?.conformite === 'function',
    '`conformite` est déclaré, et la chaîne l\'appelle à CHAQUE passage')
  dire(etat.branchement?.prepareCopie === undefined,
    '⭐ AUCUN `prepare_copie` — la Structure est la seule des six à en définir un')
  dire(paramsAvant?.chaine_actif === false, '`chaine_actif` est à OFF avant la recette')

  console.log('\n══ B. LE DÉCOR ═════════════════════════════════════════════════')
  decor = await semer()
  for (const [nom, d] of Object.entries(decor)) {
    if (nom === 'eleveId') continue
    note(`${nom} : exercice ${d.exerciceId.slice(0, 8)} · dépôt ${d.depotId.slice(0, 8)}`)
  }
  const statuts = await lireStatutsRecette(admin, decor.eleveId)
  // ⚠️ CETTE ASSERTION FIGEAIT UNE VALEUR — vraie tant que le professeur n'avait
  //    rien posé. Il a posé les six le 23/08. Ce que le script garantit n'est pas
  //    la VALEUR du statut, c'est qu'IL N'Y TOUCHE PAS. On DIT ce qu'on a lu.
  note(`statut de recette lu pour le Questionnement : \`${statuts.questionnement}\` — ce script n'en `
    + 'pose aucun, le professeur choisit (`01-` §3 ; `03-` §9)')

  console.log('\n══ C. LA CIBLE DU RETOUR — LA `cible_primaire` BAT L\'ALPHABET ══')
  for (const [nom, attendu, nMesurees] of [['vise_questionnement', 'questionnement', 3],
    ['vise_questionnement_bis', 'questionnement', 2], ['sans_cible', 'expression', 3]]) {
    const ctx = await lireContexte(admin, decor[nom].depotId)
    const { mesurees } = competencesDeLExercice(ctx)
    const cible = cibleDuRetour(ctx, mesurees)
    const flou = cibleIndeterminee(ctx, mesurees)
    dire(mesurees.length === nMesurees,
      `${nom} : ${nMesurees} compétence(s) mesurée(s) — ${mesurees.join(', ')}`)
    dire(cible === attendu, `${nom} : la cible du retour est « ${cible} » (attendu « ${attendu} »)`)
    if (nom === 'sans_cible') {
      dire(flou,
        '⭐ SANS `cible_primaire`, L\'ALERTE TOMBE — et le repli désigne « expression », '
        + 'qui n\'est visée par personne')
    } else {
      dire(!flou && cible === 'questionnement',
        `⭐ ${nom} : la \`cible_primaire\` BAT L'ORDRE ALPHABÉTIQUE — le repli aurait dit `
        + '« expression ». C4-L11 est joué, et cela se voit ici pour la CINQUIÈME fois.')
    }
  }

  console.log('\n══ D. LES CINQ SLOTS, ET LES DEUX RÉFÉRENTS ════════════════════')
  const branchement = etat.branchement;
  const ctxDe = (mode) => ({
    modes: [mode], cran: 6, referent: mode === 'composer' ? null : 'texte',
    exceptionOrthographe: false,
    contexteExercice: { sujet: CONSIGNE, consigne: CONSIGNE, copie: COPIE, mode },
    prives: {}, sorties: {}, parametres: plats,
  })
  const ctxSlots = ctxDe('composer')
  const spec = branchement.extractions(ctxSlots)[0]
  const gabarit = etat.instrument.prompts[spec.tetePrompt]
  dire(slotsDu(gabarit).sort().join(',') === 'copie,sujet',
    `⭐ le prompt P1 porte DEUX slots, ET LES DEUX SONT NATIFS : ${slotsDu(gabarit).sort().join(', ')}`)
  dire([...spec.slotsFournis].length === 0 && spec.pre === undefined,
    '⭐ AUCUN crochet pré-phase à P1 — le cas le plus simple des six : le module ne définit '
    + 'ni `pre_p1` ni `prepare_copie`')

  const { tete, queue } = separerTete(gabarit)
  const valeurs = {}
  for (const nom of slotsDu(gabarit)) valeurs[nom] = ctxSlots.contexteExercice[nom] ?? ''
  const message = messageDuGabarit(queue, valeurs, 'Rends le relevé au format déclaré ci-dessus.')
  dire(slotsDu(tete).length === 0 && tete.length > 1000,
    `LA TÊTE NE PORTE AUCUN SLOT et fait ${tete.length} caractères — elle est identique d'une `
    + 'copie à l\'autre, donc elle se cache')
  dire(!message.includes('{copie}') && !message.includes('{sujet}'),
    'AUCUN SLOT LITTÉRAL ne subsiste dans le message')
  dire(message.includes('<<<MATERIAU') && message.includes('MATERIAU>>>'),
    'les deux matériaux arrivent EN BLOCS BALISÉS (`01-` §12, défense 1)')

  // ── LE PROMPT DE JUGEMENT, SES TROIS SLOTS, ET LE DOCUMENT DÉCLARÉ ──────
  const specP2 = branchement.jugement(ctxSlots)
  const gabaritP2 = etat.instrument.prompts[specP2.tetePrompt]
  dire(slotsDu(gabaritP2).sort().join(',') === 'nature_referent,referent,squelette_phase_1',
    `⭐ le prompt de jugement porte TROIS slots : ${slotsDu(gabaritP2).sort().join(', ')}`)
  dire(specP2.slotDocument === 'squelette_phase_1',
    '⭐ `SLOT_DOCUMENT_P2` est DÉCLARÉ par le module, jamais deviné par soustraction — et '
    + 'LE DOCUMENT N\'EST PAS LE RÉFÉRENT : les intervertir ferait lire au juge le référent '
    + 'à la place du relevé, et rendre des verdicts propres sur rien')
  const { refus } = refusSlotsJugement(gabaritP2, specP2.slotDocument, specP2.slotsFournis, [])
  dire(refus.length === 0,
    `le contrôle des DEUX SENS tombe AU CHARGEMENT, et il est vert : ${refus.length} refus`)

  // ⚠️⚠️ LE FAIT DU JOUR, CONSTATÉ ET NON SUPPOSÉ — LES DEUX RÉFÉRENTS.
  const enComposer = specP2.preP2(ctxSlots)
  dire(enComposer.nature_referent === 'sujet' && enComposer.referent === CONSIGNE,
    `⭐ EN \`composer\`, LE RÉFÉRENT EST LE SUJET, et la chaîne l'a : nature « ${
      enComposer.nature_referent} », ${String(enComposer.referent).length} caractères`)
  const enReceptif = specP2.preP2(ctxDe('interroger'))
  dire(enReceptif.nature_referent === 'texte' && enReceptif.referent === null,
    '⚠️⚠️ DANS LES MODES RÉCEPTIFS, `pre_p2` SERT `referent` À `null` : le contexte de '
    + 'l\'exercice ne porte AUCUNE référence décomposée, et aucun fournisseur natif ne l\'a')
  const ctxAvecRef = {
    ...ctxDe('interroger'),
    contexteExercice: {
      ...ctxDe('interroger').contexteExercice,
      reference: JSON.stringify({ armature: { question_directrice: 'ce que le doute laisse intact' } }),
    },
  }
  dire(specP2.preP2(ctxAvecRef).referent === 'ce que le doute laisse intact',
    '⭐ et il le sert dès que le contexte le porte, SOUS LE SEUL CHAMP QUE LE MODULE LIT — '
    + '`armature.question_directrice` : le canal est bon, c\'est LA CHAÎNE qui ne le descend pas '
    + '(`contexte.ts` ne lit `reference_id` que pour en déduire `texte | cours | null`)')

  if (SANS_APPEL) {
    console.log('\n══ E. LA CHAÎNE RÉELLE — SAUTÉE (--sans-appel) ═════════════════')
    note('aucune requête au fournisseur, aucun coût. La mesure ne s\'écrit donc pas : '
      + 'c\'est le drapeau, pas une panne.')
  } else {
    console.log('\n══ E. LA CHAÎNE RÉELLE ════════════════════════════════════════')
    const d = decor.vise_questionnement
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const t0 = Date.now()
    const bilan = await traiterDepot(admin, d.depotId, 'v1')
    const duree = Date.now() - t0

    note(`bilan : ${bilan.appels} appel(s), ${duree} ms, mesures écrites ${bilan.mesuresEcrites}`)
    note(`⭐ LATENCE À TROIS CHAÎNES EN PARALLÈLE : ${Math.round(duree / 1000)} s`)
    for (const a of bilan.alertes) note(`alerte : ${a}`)
    for (const e of bilan.competencesEcartees) note(`écartée — ${e.competence} : ${e.motif}`)

    // ── LE SQUELETTE, LA MESURE, LA LETTRE ─────────────────────────────────
    const sq = lu('exercices_squelettes', await admin.from('exercices_squelettes')
      .select('competence, version, artefact_extraction, artefact_jugement, instrument_version, modele')
      .eq('depot_id', d.depotId))
    const s0 = (sq ?? []).find((x) => x.competence === 'questionnement')
    dire(!!s0, `⭐ LE SQUELETTE DU QUESTIONNEMENT EST ÉCRIT — ${(sq ?? []).length} squelette(s) `
      + `en tout : ${(sq ?? []).map((x) => x.competence).join(', ')}`)
    dire(!!s0?.artefact_extraction && !!s0?.artefact_jugement,
      'il porte SON EXTRACTION ET SON JUGEMENT — la chaîne est allée jusqu\'au bout')
    dire(s0?.instrument_version === VERSION_ATTENDUE,
      `\`instrument_version\` EST LA LIGNE VERSION DE LA FICHE, et rien d'autre : ${
        s0?.instrument_version}`)
    if (s0?.artefact_extraction) {
      // ⚠️ La colonne porte les artefacts PAR PHASE — `{ p1: {…} }` — parce que
      //    la Synthèse en a DEUX. Le relevé du Questionnement est donc sous `p1`.
      const p1 = s0.artefact_extraction.p1 ?? s0.artefact_extraction
      note(`relevé P1 — forme_question : ${JSON.stringify(p1.forme_question)}, `
        + `notions_en_tension : ${JSON.stringify(p1.notions_en_tension)}, `
        + `enjeu : ${JSON.stringify(p1.enjeu)}, `
        + `reponses_concurrentes : ${JSON.stringify(p1.reponses_concurrentes)}, `
        + `${(p1.recadrages ?? []).length} recadrage(s)`)
      // ⭐ LE MODÈLE NE REND NI NIVEAU, NI DIMENSION, NI DÉCOMPTE (`01-` §11).
      const interdits = ['niveau', 'palier', 'palier_base', 'seuil_franchi', 'lettre', 'note']
      dire(!Object.keys(p1).some((k) => interdits.includes(k.toLowerCase())),
        '⭐ P1 NE REND NI NIVEAU, NI PALIER, NI DÉCOMPTE — « tu relèves, tu ne juges pas »')
    }
    if (s0?.artefact_jugement) {
      const p2 = s0.artefact_jugement
      note(`jugement P2 — question_propre : ${JSON.stringify(p2.question_propre)}, `
        + `question_specifique : ${JSON.stringify(p2.question_specifique)}, `
        + `${(p2.crible ?? []).length} requalification(s), confiance : ${JSON.stringify(p2.confiance)}`)
      const interdits = ['niveau', 'palier', 'palier_base', 'seuil_franchi', 'lettre', 'note']
      dire(!Object.keys(p2).some((k) => interdits.includes(k.toLowerCase())),
        '⭐ P2 NE REND NI NIVEAU, NI LETTRE, NI DÉCOMPTE — « tu ne rends ni niveau, ni '
        + 'dimension, ni décompte », et `conformite` le re-signalerait')
    }

    // ⚠️ PAS de colonne `alertes` sur cette table — les alertes vivent au
     //    bilan, jamais en base. La demander rendait `data: null` EN SILENCE.
     const mes = lu('competences_mesures', await admin.from('competences_mesures')
       .select('competence, lettre_equivalente, observables, delta_v1_vf, instrument_version')
       .eq('depot_id', d.depotId))
    const m0 = (mes ?? []).find((x) => x.competence === 'questionnement')
    dire(!!m0, `⭐ LA MESURE EST ÉCRITE — ${(mes ?? []).length} mesure(s) en tout : ${
      (mes ?? []).map((x) => `${x.competence}=${x.lettre_equivalente}`).join(', ')}`)
    dire(!!m0?.lettre_equivalente && 'EDCBA'.includes(m0.lettre_equivalente),
      `⭐ ET SA LETTRE-ÉQUIVALENTE : ${m0?.lettre_equivalente} (E/D/C/B/A — \`00-\` §2)`)
    dire(m0?.delta_v1_vf === null,
      '`delta_v1_vf` est NULL — la fiche ne définit pas ce que comparer deux squelettes '
      + 'voudrait dire, et NULL n\'est pas 0')

    // ── LES NEUF OBSERVABLES DU §5, EN BASE ────────────────────────────────
    const volet = etat.instrument.observables_mesure
    const ecrits = m0?.observables ?? {}
    const manquants = Object.keys(volet).filter((c) => !(c in ecrits))
    dire(manquants.length === 0,
      `⭐⭐ LES NEUF OBSERVABLES DU §5 SONT EN BASE — aucun n'est absent (${
        Object.keys(ecrits).length} entrées écrites)`)
    const na = Object.entries(ecrits).filter(([, v]) => v === 'n/a').map(([c]) => c)
    note(`observables : ${Object.entries(ecrits)
      .map(([c, v]) => `${c}=${typeof v === 'number' ? v.toFixed(2) : v}`).join(' · ')}`)
    note(`en \`n/a\` : ${na.length ? na.join(', ') : 'aucun'}`)
    for (const [code, entree] of Object.entries(volet)) {
      const s = statutDeLaMesure(ecrits[code], entree, plats)
      note(`  ${code} → ${JSON.stringify(ecrits[code])} → ${s}`)
    }
    // ⚠️⚠️ LE CONTRÔLE QUE CE LOT A OUVERT : `question_presente` porte le seul
    //    `valeur_reussie` EN LISTE du corpus. Lu en scalaire, il serait `ratee`
    //    à CHAQUE mesure — sur un observable REQUIS de l'escalade (§5).
    dire(statutDeLaMesure('question_explicite', volet.question_presente, plats) === 'reussie',
      '⚠️⚠️ `question_presente` PEUT ÊTRE RÉUSSIE — son `valeur_reussie` est une LISTE, et '
      + '`observables.ts` la lit désormais comme telle (correctif de socle, écrit une fois '
      + 'pour les six)')

    // ⚠️⚠️ LE MODE RÉCEPTIF — le fait du jour, constaté EN BASE.
    const dr = decor.mode_receptif
    const bilanR = await traiterDepot(admin, dr.depotId, 'v1')
    note(`mode réceptif — bilan : ${bilanR.appels} appel(s), mesures écrites ${bilanR.mesuresEcrites}`)
    for (const a of bilanR.alertes) note(`alerte : ${a}`)
    const refusRef = (bilanR.alertes ?? [])
      .find((x) => x.startsWith('questionnement : ') && x.includes('referent'))
    dire(!!refusRef,
      '⚠️⚠️ EN MODE RÉCEPTIF, LE QUESTIONNEMENT N\'ÉCRIT AUCUNE MESURE, ET LA CHAÎNE LE DIT '
      + 'PAR UNE ALERTE NOMMÉE — jamais un trou silencieux')
    dire(/REFUS.*referent/.test(refusRef ?? ''),
      `⭐ ET L'ALERTE NOMME LE SLOT : « ${refusRef ?? '(aucune)'} »`)
    const mesR = lu('competences_mesures (mode réceptif)', await admin
       .from('competences_mesures').select('competence, lettre_equivalente')
       .eq('depot_id', dr.depotId))
    dire(!(mesR ?? []).some((x) => x.competence === 'questionnement'),
      `⭐ et AUCUNE mesure de questionnement n'est écrite sur ce dépôt — les autres, si : ${
        (mesR ?? []).map((x) => `${x.competence}=${x.lettre_equivalente}`).join(', ') || 'aucune'}`)

    console.log('\n══ F. L\'IDEMPOTENCE ═══════════════════════════════════════════')
    // ⚠️ « Un squelette par (dépôt × version × compétence), et l'index unique le
    //    garde. Une reprise MET À JOUR la ligne. » La reprise rejoue donc bien la
    //    chaîne — ce n'est pas un cache —, et ce qu'elle ne fait jamais, c'est
    //    écrire une SECONDE mesure. Le bilan le dit par `mesuresDejaLa`.
    const { count: avant } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotId)
    const bilan2 = await traiterDepot(admin, d.depotId, 'v1')
    const { count: apres } = await admin.from('competences_mesures')
      .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotId)
    dire(avant === apres,
      `une reprise n'écrit AUCUNE seconde mesure : ${avant} avant, ${apres} après `
      + `(${bilan2.appels} appel(s) — l'index unique garde la ligne)`)
    dire(bilan2.mesuresDejaLa === avant && bilan2.mesuresEcrites === 0,
      `⭐ et le bilan le DIT : ${bilan2.mesuresDejaLa} déjà là, ${bilan2.mesuresEcrites} écrite(s)`)

    await admin.from('scriptorium_params').update({ chaine_actif: false }).eq('id', paramsAvant.id)
  }
} catch (e) {
  ko++
  console.log(`\n✗ LE TOUR A CASSÉ : ${e?.message ?? e}`)
  if (e?.stack) console.log(String(e.stack).split('\n').slice(1, 5).join('\n'))
} finally {
  // Un décor semé se retire — même si le tour a cassé, et l'interrupteur revient
  // à ce qu'il était.
  console.log('\n══ G. LE NETTOYAGE ═════════════════════════════════════════════')
  await nettoyer(decor)
  const laisses = await decorLaisse()
  await nettoyer(laisses)
  if (paramsAvant) {
    await admin.from('scriptorium_params')
      .update({ chaine_actif: paramsAvant.chaine_actif }).eq('id', paramsAvant.id)
  }
  const apres = await etatInterrupteur()
  dire((await decorLaisse()).length === 0,
    'plus aucune entrée ne porte la marque de la recette')
  dire(apres?.chaine_actif === paramsAvant?.chaine_actif,
    `\`chaine_actif\` est rendu à son état d'avant : ${apres?.chaine_actif}`)
}

console.log(`\n══ ${ok} vert(s), ${ko} rouge(s) ═══════════════════════════════════`)
process.exit(ko ? 1 : 0)
