// ============================================================================
// RECETTE C4 · L10 · SYNTHÈSE — LA SIXIÈME ET DERNIÈRE, ÉPROUVÉE SUR PIÈCE.
// ----------------------------------------------------------------------------
// « Un dépôt réel traverse la chaîne et écrit UN SQUELETTE, UNE MESURE ET SA
//   LETTRE-ÉQUIVALENTE. »                        — le « fait quand » de C4-L10
//
// Ce script appelle LE MÊME CODE QUE LA ROUTE, avec le client admin. Il ne
// rejoue pas les tests unitaires — ceux-là confrontent le portage au module de
// calibration, sur 6 069 cas, sans base et sans appel. Il éprouve ce qu'aucun
// test pur ne peut prouver : CE QUE LA CHAÎNE ÉCRIT VRAIMENT, ET OÙ ELLE
// S'ARRÊTE.
//
// ⭐⭐ LA SYNTHÈSE EST LA SEULE DES SIX DONT LA CHAÎNE A UNE AUTRE FORME —
//    TROIS APPELS, ET DEUX QUAND LE RÉFÉRENT EST LE COURS. « Relevé aveugle →
//    aligneur → juge → code », « parce que l'alignement EST sa mesure » (`01-`
//    §11) ; sur le référent cours, « l'aligneur ne tourne pas » (`07-` §1.2).
//    Ce script joue LES DEUX, et il les distingue EN BASE plutôt que de les
//    supposer :
//    · référent COURS — la synthèse en classe (`01-` §10) : `contexte.ts` le
//      dérive de la ligne de plan (`type_exercice = 'synthese'` × `lieu =
//      'classe'`), l'aligneur ne tourne pas, ET LA MESURE S'ÉCRIT ;
//    · référent TEXTE — un exercice qui porte une `reference_id` : l'aligneur
//      réclame `{reference_decomposee}`, la chaîne NE DESCEND PAS la référence
//      décomposée, le slot est servi à `null`, et la mesure S'ARRÊTE EN LE
//      NOMMANT ;
//    · SANS RÉFÉRENT — ni l'un ni l'autre : « sans référent, il ne reste rien à
//      mesurer qui soit de la Synthèse » (fiche §1), et elle s'arrête pareil.
//    ⭐ LA DIFFÉRENCE D'AVEC LE CORPUS DE COURS DE LA CONNAISSANCE : là, aucune
//      source ne déclarait l'objet ; ici LA SOURCE LE DÉCLARE, l'écran de
//      conception le valide, et `exercices_references` le porte — c'est LA
//      CHAÎNE qui ne le sert pas. C'est le MÊME canal que celui du
//      Questionnement, et `exercices_references` porte les DEUX choses qui
//      manquent : `contenu` (la référence) et `source_contenu_id →
//      scriptorium_contenus.texte_extrait` (le matériau, dont le pré-relevé a
//      besoin pour la compression et les recouvrements).
//
//   A. l'état du jour     — la cohérence, LES SIX ouvertes, aucune en attente
//   B. le décor           — trois instances, une par référent
//   C. la cible du retour — la `cible_primaire` bat l'ordre alphabétique
//   D. LES SEPT SLOTS     — deux étages d'extraction, et LES DEUX RÉFÉRENTS
//                           joués sans un appel
//   E. la chaîne réelle   — les appels, les squelettes, les mesures, la lettre,
//                           et LE POINT EXACT où le référent texte s'arrête
//   F. l'idempotence      — une reprise n'écrit JAMAIS une seconde mesure
//   G. le nettoyage       — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/synthese-c4l10.mjs [--sans-appel | --retire]
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
const VERSION_ATTENDUE = MANIFESTE_LU.competences.synthese?.version
const { separerTete, messageDuGabarit, slotsDu, refusSlotsJugement, refusSlotsExtraction } =
  await import(`${RACINE}/utils/chaine/slots.ts`)
const { lireStatutsRecette, lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { statutDeLaMesure } = await import(`${RACINE}/utils/chaine/observables.ts`)
const { DENOM_APPORTS, DENOM_UNITES_APPARIEES, OBSERVABLES_TEXTE_SEULEMENT } =
  await import(`${RACINE}/utils/chaine/branchements/synthese.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

/**
 * ⚠️⚠️ `supabase-js` NE LÈVE PAS — il rend `{ data: null, error }`. Une lecture
 *    dont on ignore le retour échoue INVISIBLEMENT, et `(data ?? []).length`
 *    rend alors ZÉRO, qui ressemble à une mesure. *Item 39 de la boîte aux
 *    lettres — « c'est le retour ignoré qui ment, pas le champ ».*
 */
function lu(nom, { data, error }) {
  if (error) throw new Error(`lecture « ${nom} » : ${error.message}`)
  return data
}

const SANS_APPEL = process.argv.includes('--sans-appel')
const RETIRE_SEUL = process.argv.includes('--retire')
const MARQUE = 'RECETTE-C4L10-SYN'

let ok = 0; let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)

// ── La copie de recette ─────────────────────────────────────────────────────
// Elle est écrite POUR PORTER DES FAITS QUE LE §3 NOMME, et pour que le crible
// du §4 ait de quoi trancher :
//   · plusieurs UNITÉS citables — aucun contenu supposé ;
//   · un RAPPORT non additif ÉCRIT, avec les mots qui le portent (« Alors que »),
//     et un rapport ADDITIF (« De plus ») qui ne relie rien : le contraste est ce
//     que `mobilisation_reliee` mesure ;
//   · un APPORT DÉPLOYÉ — « économie du passé » — qui recouvre deux unités et
//     RELIT le matériau à travers lui : candidat au seuil ;
//   · un CHAPEAU VIDE — « une question complexe » — qui doit sortir `vide` au
//     premier test du crible, avant qu'on lui compte ses unités.
// ⭐ Les deux apports font des comptes ASYMÉTRIQUES — la parade des items 11 et
//    20 de la boîte aux lettres — et le second est écarté du numérateur du
//    premier tout en restant une TENTATIVE au dénominateur.
// Elle n'est PAS une copie d'élève réelle : les copies-tests ne sortent jamais de
// leur dépôt, et « jeu de test intouchable » vaut aussi dans l'autre sens.
const COPIE = [
  'Le cours a d\'abord montré que la mémoire n\'est pas un magasin où les souvenirs '
  + 'attendraient intacts qu\'on vienne les chercher. De plus, il a rappelé que le '
  + 'souvenir se reconstruit à chaque fois qu\'on le convoque.',

  'Alors que l\'oubli passe d\'ordinaire pour une défaillance, le cours en a fait '
  + 'une sélection : un esprit qui garderait tout serait incapable d\'agir, puisqu\'il '
  + 'ne pourrait plus distinguer ce qui compte de ce qui ne compte pas.',

  'Conserver et perdre sont donc les deux gestes d\'une même économie du passé. '
  + 'C\'est à travers cette économie que se comprend la reconstruction du souvenir : '
  + 'ce qui remonte n\'est pas ce qui a été gardé, mais ce que le présent réclame.',

  'Tout cela montre bien que la mémoire est une question complexe.',
].join('\n\n')

const CONSIGNE = `${MARQUE} — restitue en une centaine de mots ce que le cours a établi `
  + 'sur la mémoire et l\'oubli.'

// ── Le décor ────────────────────────────────────────────────────────────────
async function semer() {
  // ⭐ `paragraphe` est l'un des QUATRE objets où la Synthèse figure (fiche §6),
  //    et l'un des TROIS où elle est ciblable aux crans de production.
  const type = lu('exercices_types', await admin.from('exercices_types')
    .select('id, code, competences').eq('code', 'paragraphe').maybeSingle())
  if (!type) throw new Error('décor introuvable : le type `paragraphe` n\'est pas au seed')
  if (!(type.competences ?? []).includes('synthese')) {
    throw new Error('le type `paragraphe` ne mesure pas « synthese »')
  }
  // ⭐ LA LIGNE DE PLAN QUI FAIT LE RÉFÉRENT COURS. `contexte.ts` :
  //    `estSyntheseEnClasse = typeExercice === 'synthese' && lieu === 'classe'`,
  //    et le premier vient de `scriptorium_exercices_planifies.type_exercice`.
  // ⚠️ `uk_exercices_planifie` est UNIQUE : une ligne de plan ne porte qu'UN
  //    exercice (C4-L9). On prend donc une ligne LIBRE, jamais la première venue.
  const plans = lu('scriptorium_exercices_planifies', await admin
    .from('scriptorium_exercices_planifies').select('id, type_exercice, lieu, nature')
    .eq('type_exercice', 'synthese').eq('lieu', 'classe'))
  const prises = new Set((lu('exercices (plans pris)', await admin.from('exercices')
    .select('exercice_planifie_id').not('exercice_planifie_id', 'is', null)) ?? [])
    .map((e) => e.exercice_planifie_id))
  const plan = (plans ?? []).find((x) => !prises.has(x.id))
  if (!plan) {
    throw new Error('décor introuvable : aucune ligne de plan `synthese` × `classe` LIBRE — '
      + 'la synthèse en classe est le lieu de mesure de cette compétence (`01-` §10)')
  }
  // ⭐ ET LA RÉFÉRENCE VALIDÉE, qui fait le référent TEXTE. On ne la fabrique
  //    pas : « une référence non validée n'entre JAMAIS dans une phase de
  //    jugement » — le décor emprunte celle que la base porte déjà.
  const reference = lu('exercices_references', await admin.from('exercices_references')
    .select('id, localisation, validee_at').not('validee_at', 'is', null)
    .limit(1).maybeSingle())
  if (!reference) throw new Error('décor introuvable : aucune référence décomposée VALIDÉE')

  const eleve = lu('exercices_depots (un élève)', await admin.from('exercices_depots')
    .select('eleve_id').limit(1).maybeSingle())
  if (!eleve) throw new Error('décor introuvable : aucun élève avec un dépôt')

  /** Une instance + son dépôt. `cible` peut être `null` : c'est le troisième cas. */
  const uneInstance = async (cible, competences, extra) => {
    const { data: ex, error: eEx } = await admin.from('exercices').insert({
      type_id: type.id,
      lieu: 'maison',
      // ⚠️ La consigne est CE QUE LE SLOT `{consigne}` RECEVRA : la table
      //    `exercices` porte la consigne instanciée et la PROVENANCE de ses
      //    matériaux, jamais le texte d'un sujet distinct (`07-` §1.1).
      consigne_instanciee: { texte: CONSIGNE },
      modes_par_competence: competences,
      statut: 'assigne',
      // ⚠️ LE NUMÉRO, jamais le code : C4-L11 a tranché la forme du `cran`.
      cran: 6,
      cible_primaire: cible,
      ...extra,
    }).select('id').single()
    if (eEx) throw new Error(`exercice de recette : ${eEx.message}`)
    const { data: dep, error: eDep } = await admin.from('exercices_depots').insert({
      eleve_id: eleve.eleve_id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis',
      texte_v1: COPIE,
    }).select('id').single()
    if (eDep) throw new Error(`dépôt de recette : ${eDep.message}`)
    return { exerciceId: ex.id, depotId: dep.id, eleveId: eleve.eleve_id }
  }

  // ⚠️ MONO-MODE `restituer` : « la table des modes admis n'ouvre à la Synthèse
  //    que `restituer` » (fiche §1, acté), et la clause mono-mode l'y tient
  //    quel que soit le matériau servi.
  const LES_DEUX = { synthese: ['restituer'], expression: ['composer'] }
  return {
    eleveId: eleve.eleve_id,
    planId: plan.id,
    referenceId: reference.id,
    localisation: reference.localisation,
    // ⭐ CELLE QUI MESURE : la synthèse en classe, référent COURS.
    referent_cours: await uneInstance('synthese', LES_DEUX,
      { lieu: 'classe', exercice_planifie_id: plan.id }),
    // ⚠️ CELLE QUI S'ARRÊTE : une référence décomposée, référent TEXTE.
    referent_texte: await uneInstance('synthese', LES_DEUX, { reference_id: reference.id }),
    // ⚠️ Et celle qui ne déclare aucun référent : elle s'arrête aussi.
    sans_referent: await uneInstance('synthese', LES_DEUX, {}),
    // Celle qui ne vise rien : l'alerte de repli alphabétique doit tomber.
    // ⚠️ Sans ligne de plan — `uk_exercices_planifie` est UNIQUE, et une ligne de
    //    plan ne porte QU'UN exercice (C4-L9). Ce cas-ci n'éprouve pas le
    //    référent, il éprouve la cible du retour.
    sans_cible: await uneInstance(null, LES_DEUX, {}),
  }
}

const chaque = (d) => [d.referent_cours, d.referent_texte, d.sans_referent, d.sans_cible]
  .filter(Boolean)

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
  const data = lu('exercices (décor laissé)', await admin.from('exercices')
    .select('id, consigne_instanciee, exercices_depots(id, eleve_id)'))
  const trouves = (data ?? []).filter((e) =>
    JSON.stringify(e.consigne_instanciee ?? {}).includes(MARQUE))
  return trouves.flatMap((e) => ((e.exercices_depots ?? []).length
    ? e.exercices_depots.map((d) => ({ exerciceId: e.id, depotId: d.id, eleveId: d.eleve_id }))
    : [{ exerciceId: e.id, depotId: null, eleveId: null }]))
}

const etatInterrupteur = async () => lu('scriptorium_params', await admin
  .from('scriptorium_params').select('id, chaine_actif').limit(1).maybeSingle())

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
  dire(ouvertes.includes('synthese') && ouvertes.length === 6,
    `⭐⭐ LES SIX COMPÉTENCES SONT OUVERTES : ${ouvertes.join(', ') || 'aucune'}`)
  const attente = competencesEnAttenteDeBranchement()
  dire(attente.length === 0,
    `⭐ AUCUNE n'attend plus son branchement — C4-L10 est joué pour les six${
      attente.length ? ` (reste : ${attente.join(', ')})` : ''}`)
  const etat = etatCompetence('synthese')
  dire(!!VERSION_ATTENDUE && etat.instrument?.version === VERSION_ATTENDUE,
    'l\'instrument dérivé porte la VERSION DE LA FICHE que le manifeste déclare : '
    + `${etat.instrument?.version} (manifeste : ${VERSION_ATTENDUE})`)
  const obs = Object.keys(etat.instrument?.observables_mesure ?? {})
  dire(obs.length === 13,
    `⭐ TREIZE observables de télémétrie au bloc machine (§5) — le plus gros paquet des `
    + `six, quand le module n'en rend que trois : ${obs.length}`)
  // ⭐ LES DEUX DÉNOMINATEURS, sous leur nom EXACT.
  const denoms = [...new Set(Object.values(etat.instrument?.observables_mesure ?? {})
    .map((e) => e.rapporte_a).filter(Boolean))]
  dire(denoms.length === 2 && denoms.includes(DENOM_APPORTS)
    && denoms.includes(DENOM_UNITES_APPARIEES),
  `⭐ DEUX \`rapporte_a\` distincts, et le relevé les porte sous ce nom : ${
    denoms.map((d) => `« ${d} »`).join(' et ')}`)
  // ⚠️ La forme dérivée est un BLOC par paramètre, jamais une valeur à plat —
  //    et cette fiche est l'une des DEUX qui en portent l'essentiel.
  const plats = valeursDesParametres(etat.instrument)
  dire(Object.keys(etat.instrument?.parametres ?? {}).length === 6,
    `SIX paramètres au bloc machine : ${Object.keys(etat.instrument?.parametres ?? {}).join(', ')}`)
  dire(Object.keys(plats).length === 5 && plats.compression_cible === undefined,
    '⭐ et `valeursDesParametres()` en rend CINQ : `compression_cible` a `defaut: null` à la '
    + 'fiche, il est donc ABSENT — exactement comme `params.get()` rend `None` côté Python. '
    + `Lus à plat : ${Object.entries(plats).map(([k, v]) => `${k}=${v}`).join(', ')}`)
  dire(typeof etat.instrument?.parametres?.part_essentielles_bon === 'object'
    && typeof plats.part_essentielles_bon === 'number',
  '⚠️ `instrument.parametres` porte bien un BLOC (`defaut`/`bornes`/`statut`) — le lire à '
  + 'plat rendrait un objet, et la comparaison au seuil deviendrait impossible EN SILENCE')
  dire(etat.branchement?.delta === undefined,
    '`delta` n\'est PAS déclaré : le mot n\'apparaît PAS UNE FOIS dans la fiche '
    + '(SIXIÈME fiche sur six à se taire — le corpus entier)')
  dire(typeof etat.branchement?.conformite === 'function',
    '`conformite` est déclaré, et la chaîne l\'appelle à CHAQUE passage')
  dire(etat.branchement?.prepareCopie === undefined,
    '⭐ AUCUN `prepare_copie` — la Structure est la seule des six à en définir un')
  dire(paramsAvant?.chaine_actif === false, '`chaine_actif` est à OFF avant la recette')

  console.log('\n══ B. LE DÉCOR ═════════════════════════════════════════════════')
  decor = await semer()
  note(`ligne de plan « synthese × classe » : ${decor.planId.slice(0, 8)}`)
  note(`référence décomposée validée : ${decor.referenceId.slice(0, 8)} — « ${decor.localisation} »`)
  for (const [nom, d] of Object.entries(decor)) {
    if (!d?.depotId) continue
    note(`${nom} : exercice ${d.exerciceId.slice(0, 8)} · dépôt ${d.depotId.slice(0, 8)}`)
  }
  const statuts = await lireStatutsRecette(admin, decor.eleveId)
  dire(statuts.synthese === 'mesuree_silencieusement',
    `la Synthèse NAÎT \`mesuree_silencieusement\` — statut lu : ${statuts.synthese}. `
    + 'Ce script n\'en pose aucun : le professeur choisit (`01-` §3 ; `03-` §9)')

  // ⭐⭐ LE RÉFÉRENT, DÉRIVÉ EN BASE — le fait qui commande toute la forme de la chaîne.
  const ctxCours = await lireContexte(admin, decor.referent_cours.depotId)
  const ctxTexte = await lireContexte(admin, decor.referent_texte.depotId)
  const ctxSans = await lireContexte(admin, decor.sans_referent.depotId)
  dire(ctxCours.referent === 'cours' && ctxCours.estSyntheseEnClasse,
    '⭐ LA SYNTHÈSE EN CLASSE A LE COURS POUR RÉFÉRENT, et `contexte.ts` le dérive de la '
    + 'LIGNE DE PLAN — `type_exercice = synthese` × `lieu = classe` (`01-` §10)')
  dire(ctxTexte.referent === 'texte' && !ctxTexte.estSyntheseEnClasse,
    '⭐ un exercice qui porte une `reference_id` a le TEXTE pour référent')
  dire(ctxSans.referent === null,
    '⚠️ et sans l\'un ni l\'autre, le référent est `null` — « sans référent, il ne reste '
    + 'rien à mesurer qui soit de la Synthèse » (fiche §1)')

  console.log('\n══ C. LA CIBLE DU RETOUR — LA `cible_primaire` BAT L\'ALPHABET ══')
  for (const [nom, attendu] of [['referent_cours', 'synthese'], ['referent_texte', 'synthese'],
    ['sans_cible', 'expression']]) {
    const ctx = await lireContexte(admin, decor[nom].depotId)
    const { mesurees } = competencesDeLExercice(ctx)
    const cible = cibleDuRetour(ctx, mesurees)
    const flou = cibleIndeterminee(ctx, mesurees)
    note(`${nom} : ${mesurees.length} compétence(s) mesurée(s) — ${mesurees.join(', ')}`)
    dire(cible === attendu, `${nom} : la cible du retour est « ${cible} » (attendu « ${attendu} »)`)
    if (nom === 'sans_cible') {
      dire(flou,
        '⭐ SANS `cible_primaire`, L\'ALERTE TOMBE — et le repli désigne « expression », '
        + 'qui n\'est visée par personne')
    } else {
      dire(!flou && cible === 'synthese',
        `⭐ ${nom} : la \`cible_primaire\` BAT L'ORDRE ALPHABÉTIQUE — le repli aurait dit `
        + '« expression ». C4-L11 est joué, et cela se voit ici pour la SIXIÈME fois.')
    }
  }

  console.log('\n══ D. LES SEPT SLOTS, ET LES DEUX ÉTAGES D\'EXTRACTION ═════════')
  const branchement = etat.branchement
  const ctxDe = (referent) => ({
    modes: ['restituer'], cran: 6, referent, exceptionOrthographe: false,
    contexteExercice: { sujet: CONSIGNE, consigne: CONSIGNE, copie: COPIE, mode: 'restituer' },
    prives: {}, sorties: {}, parametres: plats,
  })

  // ⭐⭐ LA FORME DE LA CHAÎNE, RÉFÉRENT PAR RÉFÉRENT.
  const specsCours = branchement.extractions(ctxDe('cours'))
  const specsTexte = branchement.extractions(ctxDe('texte'))
  const specsSans = branchement.extractions(ctxDe(null))
  dire(specsCours.length === 1 && specsCours[0].tetePrompt === 'P1A',
    '⭐⭐ RÉFÉRENT COURS : UN SEUL étage d\'extraction — « l\'aligneur ne tourne pas » '
    + `(\`07-\` §1.2) : ${specsCours.map((s) => s.tetePrompt).join(' → ')}`)
  dire(specsTexte.length === 2 && specsTexte.map((s) => s.tetePrompt).join(',') === 'P1A,P1B',
    '⭐⭐ RÉFÉRENT TEXTE : DEUX étages — « relevé aveugle → aligneur », « parce que '
    + `l'alignement EST sa mesure » (\`01-\` §11) : ${specsTexte.map((s) => s.tetePrompt).join(' → ')}`)
  dire(specsSans.length === 2,
    'SANS RÉFÉRENT : l\'aligneur est demandé lui aussi, et c\'est son slot vide qui '
    + 'arrêtera la mesure en le nommant')

  // ── P1A — le relevé aveugle, et son canal privé ──────────────────────────
  const p1a = specsCours[0]
  const gabaritP1A = etat.instrument.prompts[p1a.tetePrompt]
  dire(slotsDu(gabaritP1A).sort().join(',') === 'consigne,pre_releve,production',
    `⭐ le prompt P1A porte TROIS slots — un natif, deux servis : ${
      slotsDu(gabaritP1A).sort().join(', ')}`)
  const refusP1A = refusSlotsExtraction(gabaritP1A, p1a.slotsFournis,
    ['sujet', 'copie', 'consigne', 'mode'], 'P1A')
  dire(refusP1A.length === 0,
    `le contrôle des DEUX SENS tombe AU CHARGEMENT, et il est vert : ${refusP1A.length} refus`)
  const rendu1a = p1a.pre(ctxDe('cours'))
  const slotsRendus = Object.keys(rendu1a).filter((k) => !k.startsWith('_')).sort()
  const privesRendus = Object.keys(rendu1a).filter((k) => k.startsWith('_')).sort()
  dire(slotsRendus.join(',') === 'pre_releve,production' && privesRendus.join(',') === '_mesures',
    '⭐ `_mesures` part sous UN TIRET BAS — « le tiret bas dit canal privé, jamais prompt » ; '
    + `slots : ${slotsRendus.join(', ')} · privés : ${privesRendus.join(', ')} `
    + `(${Object.keys(rendu1a._mesures).join(', ')})`)
  note(`pré-relevé servi : ${JSON.stringify(rendu1a.pre_releve).slice(0, 160)}…`)
  dire(rendu1a._mesures.taux_compression === null && rendu1a._mesures.mots_materiau === 0,
    '⚠️ LE MATÉRIAU N\'EST PAS SERVI : `taux_compression` est NULL, et `taux_compression` '
    + 'sortira en `n/a` — le §5 l\'exclut des observables REQUIS, « un signal de conformité '
    + 'de consigne, pas de compétence »')
  dire(String(rendu1a.pre_releve).includes('matériau non servi')
    && !String(rendu1a.pre_releve).includes('aucune'),
  '⛔ et le slot NE MENT PAS : il ne dit pas « aucune » reprise littérale quand il n\'a rien '
  + 'cherché. *C\'est le seul point où le portage s\'écarte du module — le banc, lui, sert '
  + 'toujours une source.*')

  // ── P1B — l'aligneur, et le slot qui arrête ─────────────────────────────
  const p1b = specsTexte[1]
  const gabaritP1B = etat.instrument.prompts[p1b.tetePrompt]
  dire(slotsDu(gabaritP1B).sort().join(',') === 'recouvrements,reference_decomposee,unites_relevees',
    `⭐ le prompt P1B porte TROIS slots, tous servis par \`pre_p1b\` : ${
      slotsDu(gabaritP1B).sort().join(', ')}`)
  const rendu1b = p1b.pre({ ...ctxDe('texte'), sorties: { p1a: { unites: [{ u: 1 }] } } })
  dire(rendu1b.reference_decomposee === null,
    '⚠️⚠️ `{reference_decomposee}` EST SERVI À `null` : le contexte de l\'exercice ne porte '
    + 'AUCUNE référence décomposée, et aucun fournisseur natif ne l\'a. « Un slot servi à '
    + '`null` arrête la mesure EN LE NOMMANT » — le comportement voulu (`CONTRAT` §2)')
  const rendu1bServi = p1b.pre({
    ...ctxDe('texte'),
    sorties: { p1a: { unites: [{ u: 1 }] } },
    contexteExercice: {
      ...ctxDe('texte').contexteExercice,
      reference: JSON.stringify({ unites: [{ u: 1, fonctions: ['defend_these'] }] }),
    },
  })
  dire(typeof rendu1bServi.reference_decomposee === 'string'
    && rendu1bServi.reference_decomposee.includes('defend_these'),
  '⭐ et il le sert dès que le contexte le porte : LE CANAL EST BON, c\'est LA CHAÎNE qui ne '
  + 'le descend pas. `exercices_references` porte pourtant `contenu` ET le texte source '
  + '(`source_contenu_id → scriptorium_contenus.texte_extrait`) — un seul geste ferme les deux '
  + 'manques, et il ferme AUSSI celui du Questionnement.')

  // ── P2 — un seul slot, et c'est le document ─────────────────────────────
  const specP2 = branchement.jugement(ctxDe('cours'))
  const gabaritP2 = etat.instrument.prompts[specP2.tetePrompt]
  dire(slotsDu(gabaritP2).join(',') === 'squelette',
    `⭐ le prompt de jugement porte UN SEUL slot : ${slotsDu(gabaritP2).join(', ')}`)
  dire(specP2.slotDocument === undefined && specP2.preP2 === undefined,
    '⭐ `SLOT_DOCUMENT_P2` ne se déclare pas — « quand le prompt n\'a qu\'un slot, c\'est lui, '
    + 'sans déclaration » —, et il n\'y a AUCUN `pre_p2` : tout ce que le juge lit passe par '
    + '`document_p2`. *« Le relevé n\'atteint P2 que par `document_p2` » (`CONTRAT` §2).*')
  const { refus } = refusSlotsJugement(gabaritP2, specP2.slotDocument ?? null,
    specP2.slotsFournis ?? [], [])
  dire(refus.length === 0, `et le contrôle du jugement est vert : ${refus.length} refus`)

  const { tete, queue } = separerTete(gabaritP1A)
  const valeurs = {}
  for (const nom of slotsDu(gabaritP1A)) {
    valeurs[nom] = rendu1a[nom] ?? ctxDe('cours').contexteExercice[nom] ?? ''
  }
  const message = messageDuGabarit(queue, valeurs, 'Rends le relevé au format déclaré ci-dessus.')
  dire(slotsDu(tete).length === 0 && tete.length > 1000,
    `LA TÊTE NE PORTE AUCUN SLOT et fait ${tete.length} caractères — elle est identique d'une `
    + 'copie à l\'autre, donc elle se cache')
  dire(!message.includes('{production}') && !message.includes('{consigne}'),
    'AUCUN SLOT LITTÉRAL ne subsiste dans le message')
  dire(message.includes('<<<MATERIAU') && message.includes('MATERIAU>>>'),
    'les matériaux arrivent EN BLOCS BALISÉS (`01-` §12, défense 1)')

  if (SANS_APPEL) {
    console.log('\n══ E. LA CHAÎNE RÉELLE — SAUTÉE (--sans-appel) ═════════════════')
    note('aucune requête au fournisseur, aucun coût. La mesure ne s\'écrit donc pas : '
      + 'c\'est le drapeau, pas une panne.')
  } else {
    console.log('\n══ E. LA CHAÎNE RÉELLE ════════════════════════════════════════')
    const d = decor.referent_cours
    await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', paramsAvant.id)
    const t0 = Date.now()
    const bilan = await traiterDepot(admin, d.depotId, 'v1')
    const duree = Date.now() - t0

    note(`bilan : ${bilan.appels} appel(s), ${duree} ms, mesures écrites ${bilan.mesuresEcrites}`)
    note(`⭐ LATENCE À DEUX CHAÎNES EN PARALLÈLE : ${Math.round(duree / 1000)} s`)
    // ⚠️ LE RETOUR — item 37 de la boîte aux lettres : `fuitesRR4` cherche chaque
    //    code D'OBSERVABLE EN SOUS-CHAÎNE, et sur les treize de cette fiche UN
    //    SEUL est un mot français ordinaire — `elagage`. Il n'est protégé QUE PAR
    //    SON ACCENT : un retour qui écrirait « élagage » ne déclenche rien
    //    (`é` ≠ `e`, et `fuitesRR4` ne replie pas les accents), un retour qui
    //    écrirait « elagage » ferait refuser tout le retour.
    note(`retour engendré : ${bilan.retourEcrit === true ? 'oui' : JSON.stringify(bilan.retourEcrit)}`)
    for (const a of bilan.alertes) note(`alerte : ${a}`)
    for (const e of bilan.competencesEcartees) note(`écartée — ${e.competence} : ${e.motif}`)

    // ── LE SQUELETTE, LA MESURE, LA LETTRE ─────────────────────────────────
    const sq = lu('exercices_squelettes', await admin.from('exercices_squelettes')
      .select('competence, version, artefact_extraction, artefact_jugement, instrument_version, modele')
      .eq('depot_id', d.depotId))
    const s0 = (sq ?? []).find((x) => x.competence === 'synthese')
    dire(!!s0, `⭐ LE SQUELETTE DE LA SYNTHÈSE EST ÉCRIT — ${(sq ?? []).length} squelette(s) `
      + `en tout : ${(sq ?? []).map((x) => x.competence).join(', ')}`)
    dire(!!s0?.artefact_extraction && !!s0?.artefact_jugement,
      'il porte SON EXTRACTION ET SON JUGEMENT — la chaîne est allée jusqu\'au bout')
    dire(s0?.instrument_version === VERSION_ATTENDUE,
      `\`instrument_version\` EST LA LIGNE VERSION DE LA FICHE, et rien d'autre : ${
        s0?.instrument_version}`)
    if (s0?.artefact_extraction) {
      // ⭐⭐ LA COLONNE PORTE LES ARTEFACTS PAR PHASE — `{ p1a: {…} }` —, et c'est
      //    LA SYNTHÈSE qui a fait exister cette forme : elle est la seule à avoir
      //    deux étages. Sur le référent cours, il n'y en a qu'UN.
      const phases = Object.keys(s0.artefact_extraction)
      dire(phases.join(',') === 'p1a',
        `⭐⭐ L'EXTRACTION EST RANGÉE PAR PHASE, et le cours n'en a qu'UNE : ${phases.join(', ')}`)
      const p1 = s0.artefact_extraction.p1a ?? s0.artefact_extraction
      note(`relevé P1A — ${(p1.unites ?? []).length} unité(s), ${(p1.rapports ?? []).length} `
        + `rapport(s) [${(p1.rapports ?? []).map((r) => r.nature).join(', ')}], `
        + `${(p1.apports ?? []).length} apport(s) [${(p1.apports ?? [])
          .map((a) => JSON.stringify(a.terme_cite)).join(', ')}], `
        + `these_forme : ${JSON.stringify(p1.these_forme)}`)
      // ⭐ LE MODÈLE NE REND NI NIVEAU, NI DIMENSION, NI DÉCOMPTE (`01-` §11).
      const interdits = ['niveau', 'palier', 'palier_base', 'seuil_franchi', 'lettre', 'note']
      dire(!Object.keys(p1).some((k) => interdits.includes(k.toLowerCase())),
        '⭐ P1A NE REND NI NIVEAU, NI PALIER, NI DÉCOMPTE — « tu relèves, tu ne juges pas »')
      dire(!('alignement' in p1),
        '⭐ ET AUCUN ALIGNEMENT : sur le cours, l\'aligneur n\'a pas tourné')
    }
    if (s0?.artefact_jugement) {
      const p2 = s0.artefact_jugement
      note(`jugement P2 — ${(p2.crible ?? []).length} apport(s) criblé(s) [${
        (p2.crible ?? []).map((c) => c.verdict).join(', ')}], ${
        (p2.fidelite ?? []).length} fidélité(s), confiance : ${JSON.stringify(p2.confiance)}`)
      note(`ce_qui_plafonne : ${JSON.stringify(p2.ce_qui_plafonne)}`)
      note(`levier : ${JSON.stringify(p2.levier)}`)
      const interdits = ['niveau', 'palier', 'palier_base', 'seuil_franchi', 'lettre', 'note']
      dire(!Object.keys(p2).some((k) => interdits.includes(k.toLowerCase())),
        '⭐ P2 NE REND NI NIVEAU, NI LETTRE, NI DÉCOMPTE — « tu ne rends ni niveau, ni '
        + 'dimension, ni décompte », et `conformite` le re-signalerait')
      dire((p2.fidelite ?? []).length === 0,
        '⭐ ET AUCUNE FIDÉLITÉ : « la fidélité — référent texte seulement » (§4), et le prompt '
        + 'dit « si aucun alignement ne t\'est fourni, rends `fidelite: []` »')
    }

    // ⚠️ PAS de colonne `alertes` sur cette table — les alertes vivent au bilan.
    const mes = lu('competences_mesures', await admin.from('competences_mesures')
      .select('competence, lettre_equivalente, observables, delta_v1_vf, instrument_version')
      .eq('depot_id', d.depotId))
    const m0 = (mes ?? []).find((x) => x.competence === 'synthese')
    dire(!!m0, `⭐ LA MESURE EST ÉCRITE — ${(mes ?? []).length} mesure(s) en tout : ${
      (mes ?? []).map((x) => `${x.competence}=${x.lettre_equivalente}`).join(', ')}`)
    dire(!!m0?.lettre_equivalente && 'EDCBA'.includes(m0.lettre_equivalente),
      `⭐ ET SA LETTRE-ÉQUIVALENTE : ${m0?.lettre_equivalente} (E/D/C/B/A — \`00-\` §2)`)
    dire(m0?.delta_v1_vf === null,
      '`delta_v1_vf` est NULL — la fiche ne définit pas ce que comparer deux squelettes '
      + 'voudrait dire, et NULL n\'est pas 0')

    // ── LES TREIZE OBSERVABLES DU §5, EN BASE ──────────────────────────────
    const volet = etat.instrument.observables_mesure
    const ecrits = m0?.observables ?? {}
    const manquants = Object.keys(volet).filter((c) => !(c in ecrits))
    dire(manquants.length === 0,
      `⭐⭐ LES TREIZE OBSERVABLES DU §5 SONT EN BASE — aucun n'est absent (${
        Object.keys(ecrits).length} entrées écrites)`)
    const na = Object.entries(ecrits).filter(([, v]) => v === 'n/a').map(([c]) => c)
    for (const [code, entree] of Object.entries(volet)) {
      const s = statutDeLaMesure(ecrits[code], entree, plats)
      note(`  ${code} → ${JSON.stringify(ecrits[code])} → ${s}`)
    }
    // ⭐ Les HUIT du référent texte sont `n/a` sur le cours, et c'est la fiche qui
    //    le veut — « actifs sur le référent texte seulement ». Ce n'est pas un
    //    trou : le relevé le DIT par une alerte nommée.
    const attendusNa = OBSERVABLES_TEXTE_SEULEMENT.filter((c) => na.includes(c))
    dire(attendusNa.length === OBSERVABLES_TEXTE_SEULEMENT.length,
      `⭐ LES HUIT DU RÉFÉRENT TEXTE SONT \`n/a\` sur le cours, comme le §5 le veut : ${
        attendusNa.join(', ')}`)
    const surprises = na.filter((c) => !OBSERVABLES_TEXTE_SEULEMENT.includes(c))
    dire(surprises.length === 0,
      `et AUCUN autre n'est en \`n/a\`${surprises.length ? ` — ${surprises.join(', ')}` : ''}`)
    dire(typeof ecrits.mobilisation_reliee === 'number',
      `⭐ \`mobilisation_reliee\` PORTE UNE VALEUR : ${ecrits.mobilisation_reliee}`)
    dire(ecrits.apport_organisateur === 'oui' || ecrits.apport_organisateur === 'non',
      `⭐ et \`apport_organisateur\` — l'observable du seuil — un verdict : ${
        ecrits.apport_organisateur}`)

    // ⚠️⚠️ LE RÉFÉRENT TEXTE — le fait du jour, constaté EN BASE.
    const dt = decor.referent_texte
    const bilanT = await traiterDepot(admin, dt.depotId, 'v1')
    note(`référent texte — bilan : ${bilanT.appels} appel(s), mesures écrites ${bilanT.mesuresEcrites}`)
    for (const a of bilanT.alertes) note(`alerte : ${a}`)
    const refusRef = (bilanT.alertes ?? [])
      .find((x) => x.startsWith('synthese : ') && x.includes('reference_decomposee'))
    dire(!!refusRef,
      '⚠️⚠️ SUR LE RÉFÉRENT TEXTE, LA SYNTHÈSE N\'ÉCRIT AUCUNE MESURE, ET LA CHAÎNE LE DIT '
      + 'PAR UNE ALERTE NOMMÉE — jamais un trou silencieux')
    dire(/REFUS.*reference_decomposee/.test(refusRef ?? ''),
      `⭐ ET L'ALERTE NOMME LE SLOT : « ${refusRef ?? '(aucune)'} »`)
    const mesT = lu('competences_mesures (référent texte)', await admin
      .from('competences_mesures').select('competence, lettre_equivalente')
      .eq('depot_id', dt.depotId))
    dire(!(mesT ?? []).some((x) => x.competence === 'synthese'),
      `⭐ et AUCUNE mesure de synthèse n'est écrite sur ce dépôt — les autres, si : ${
        (mesT ?? []).map((x) => `${x.competence}=${x.lettre_equivalente}`).join(', ') || 'aucune'}`)
    const sqT = lu('exercices_squelettes (référent texte)', await admin
      .from('exercices_squelettes').select('competence, artefact_extraction')
      .eq('depot_id', dt.depotId))
    const s0T = (sqT ?? []).find((x) => x.competence === 'synthese')
    dire(!s0T,
      '⭐ et AUCUN squelette non plus : la chaîne s\'arrête AVANT le premier appel de la '
      + 'phase qui manque — le refus tombe au service des slots, pas après')

    console.log('\n══ F. L\'IDEMPOTENCE ═══════════════════════════════════════════')
    // ⚠️ « Un squelette par (dépôt × version × compétence), et l'index unique le
    //    garde. Une reprise MET À JOUR la ligne. » La reprise rejoue donc bien la
    //    chaîne — ce n'est pas un cache —, et ce qu'elle ne fait jamais, c'est
    //    écrire une SECONDE mesure.
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
