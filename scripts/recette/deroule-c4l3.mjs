// ============================================================================
// RECETTE C4 · L3 — LE DÉROULÉ DE L'ÉLÈVE, À LA MAISON, ÉPROUVÉ PAR REQUÊTE.
// ----------------------------------------------------------------------------
// « VÉRIFIÉ VEUT DIRE PAR REQUÊTE ET SUR PIÈCE, PAS SUPPOSÉ. »      — le fait quand
//
// Ce script appelle LE MÊME CODE QUE LES ÉCRANS — la porte, le dépôt, les six
// temps, les quatre gestes, la file, l'aide, le régime —, avec le client admin.
// Il ne rejoue pas les tests unitaires : il éprouve ce qu'aucun test pur ne peut
// prouver, LA MÉCANIQUE EN BASE.
//
//   A. le décor        — une classe, quatre instances de recette, leurs dépôts
//   B. la porte        — `exercices_actif`, et LUI SEUL (piège 48)
//   C. les trois gardes— autre élève · lieu classe · ⭐ `retire` (piège 41)
//   D. les horodatages — ouvert → v1_remis → juger → vf_remis, PAR REQUÊTE
//   E. ⭐⭐ LES RETOURS À LA LIGNE — le CRLF d'un formulaire, jusqu'à la mesure
//   F. le collage      — trois vecteurs journalisés, ZÉRO signalement d'intégrité
//   G. les trois gestes— l'ORDRE de la remise, et la confiance qui NE se sert pas
//   H. la crédence     — deux cas, ⭐ le mêlage (piège 37), les deux clés lues
//   I. la file         — clé d'idempotence, un seul job, le job REPOSÉ
//   J. l'aide consommée— le compteur, et ce qu'on ne peut pas prouver aujourd'hui
//   K. le régime       — l'escalade N2 qui fait naître la version finale
//   L. le nettoyage    — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/deroule-c4l3.mjs [--sans-appel] [--garde-le-decor]
//
// `--sans-appel`      saute tout ce qui DÉPENSE. ⚠️ Aujourd'hui `chaine_actif`
//                     est à OFF : la section I ne dépense RIEN (`traiterDepot`
//                     lève `ChaineSuspendue` avant le premier appel), et elle est
//                     donc jouée quand même — le script le DIT à l'écran. Elle
//                     n'est sautée que si la chaîne est ouverte.
// `--garde-le-decor`  ne nettoie pas, pour un smoke à l'écran ensuite. ⚠️ Les
//                     interrupteurs sont remis comme trouvés MÊME AVEC ce
//                     drapeau : rouvrir la porte est un geste du professeur.
//
// ⚠️ LA BASE EST LA SANDBOX, ET UN ÉLÈVE RÉEL Y TRAVAILLE. La recette ne touche
//    QUE ce qu'elle a semé ; l'unique exception est `scriptorium_params`
//    (`exercices_actif`), remis à l'identique en fin de course et sur
//    interruption. Les élèves de test sont des `profiles` EXISTANTS, réutilisés :
//    rien n'est écrit sur leur profil.
// ============================================================================

import { register } from 'node:module'

// ── La cale de résolution des sous-chemins `next/…` ─────────────────────────
// `utils/deroule/acces.ts` importe `next/navigation` (pour `redirect`) et
// `@/utils/supabase/server` (qui importe `next/headers`). Hors de Next, Node
// exige l'extension : `next/navigation` n'existe pas, `next/navigation.js` oui.
// Les deux hooks de `register-calibration-resolver.mjs` ne couvrent que les
// imports RELATIFS et l'alias `@/…` ; celui-ci complète, et lui seul.
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

// ── L'environnement, avant tout import de code applicatif ───────────────────
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = '/Users/louissagnieres/Documents/GitHub/palimpseste'

const { lireLaPorte, poserExercicesActifs, DELAI_VF_DEFAUT } =
  await import(`${RACINE}/utils/deroule/acces.ts`)
const {
  lireDepotMaison, ouvrirLeDepot, enregistrerLeTexte, remettre,
  repondreALaMicroQuestion, compterUneAide, collagesDuDepot, AIDES_COMPTEES,
} = await import(`${RACINE}/utils/deroule/depot.ts`)
const { chargerLeDeroule } = await import(`${RACINE}/utils/deroule/vue.ts`)
const {
  enregistrerLaConfiance, enregistrerLesConditions, enregistrerLaRestitution,
  enregistrerLaCredence, ouvrirSeJuger, enregistrerSeJuger,
} = await import(`${RACINE}/utils/deroule/gestes.ts`)
const { mesurerMaintenant, attenteDuDepot, registreDuRetour, etapeDe } =
  await import(`${RACINE}/utils/deroule/mesure.ts`)
const { offreDeCredence, saisieARegistrer, CANDIDATS_SERVIS, PLANCHER_DISTRACTEURS } =
  await import(`${RACINE}/utils/deroule/credence.ts`)
const { regimeDuDeroule, tempsServis, nombreDeCas, credenceDemandee } =
  await import(`${RACINE}/utils/deroule/regime.ts`)
const { blocs, normaliserRetours } =
  await import(`${RACINE}/utils/passation/transcription-calcul.ts`)
const { journaliserCollageBloque } = await import(`${RACINE}/utils/passation/depots.ts`)
const { MOYENS_DE_COLLAGE } = await import(`${RACINE}/utils/passation/collage.ts`)
const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { cleIdempotence } = await import(`${RACINE}/utils/chaine/file.ts`)
const { competencesOuvertes } = await import(`${RACINE}/utils/chaine/instruments.ts`)

// ── Les deux clients ────────────────────────────────────────────────────────
// `admin` est le client NU : c'est LUI qui fait les requêtes de vérification —
// « par requête » veut dire sur la base telle qu'elle est, sans intermédiaire.
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const GARDE_LE_DECOR = process.argv.includes('--garde-le-decor')
const MARQUE = 'RECETTE-C4L3'

let ok = 0
let ko = 0
let na = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const manque = (texte) => { na++; console.log(`⊘ ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

/**
 * UNE HORLOGE STRICTEMENT CROISSANTE. Les six horodatages du §1.1 se comparent
 * dans l'ordre : deux écritures tombées dans la même milliseconde rendraient la
 * comparaison indécidable, et un `<=` masquerait une inversion réelle. On pose
 * donc des instants qui ne peuvent pas être égaux, et on éprouve un `<` strict.
 */
let dernierInstant = 0
const instant = () => {
  const t = Math.max(Date.now(), dernierInstant + 1)
  dernierInstant = t
  return new Date(t).toISOString()
}

// ── L'état d'avant, pour tout remettre exactement ───────────────────────────
let portesInitiales = null
const TABLES_TOUCHEES = [
  'classes', 'exercices', 'exercices_cas', 'exercices_depots', 'exercices_jobs',
  'exercices_retours', 'exercices_metacognition', 'exercices_squelettes',
  'competences_escalade', 'competences_mesures', 'integrite_signalements',
]
let comptesAvant = {}

/** Ce que la recette a semé — le nettoyage ne devine rien, il relit ce registre. */
const seme = { classes: [], exercices: [], depots: [], escalades: [] }

async function compter(table, filtre = (q) => q) {
  const { count, error } = await filtre(
    admin.from(table).select('*', { count: 'exact', head: true }))
  if (error) return { n: null, erreur: `${error.code} ${error.message}` }
  return { n: count ?? 0, erreur: null }
}

async function comptesDeToutes() {
  const out = {}
  for (const t of TABLES_TOUCHEES) out[t] = (await compter(t)).n
  return out
}

/** La ligne brute du dépôt, telle que la BASE la porte — jamais via le code. */
async function ligneDuDepot(depotId, colonnes = '*') {
  const { data, error } = await admin.from('exercices_depots')
    .select(colonnes).eq('id', depotId).maybeSingle()
  if (error) throw new Error(`lecture du dépôt ${depotId} : ${error.code} ${error.message}`)
  return data
}

/** Le dépôt tel que le LOT le lit — le seul point d'entrée, cale comprise. */
const relire = (depotId, eleveId) => lireDepotMaison(admin, depotId, eleveId)

// ════════════════════════════════════════════════════════════════════════════
// LE MATÉRIAU DE LA RECETTE
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ LA COPIE QUI PORTE LE PIÈGE. Quatre paragraphes séparés par des lignes
 * vides, EN CRLF — « la soumission d'un formulaire HTML normalise la valeur
 * d'un `<textarea>` en CRLF » (`07-` §3 ; piège 24). `blocs()` cherche
 * `\n[ \t]*\n`, que `\r\n\r\n` ne matche pas : sans normalisation, cette copie
 * se lit comme UN SEUL BLOC, donc « dépourvue d'architecture », DÉFAILLANCE
 * FORTE. Ni la recette de C4-L4 ni les tests Node, qui envoient des `\n`, ne le
 * voyaient.
 *
 * Deux pièges de trim y sont cousus exprès : le deuxième paragraphe est INDENTÉ
 * de deux espaces et se TERMINE par une espace.
 */
const PARAGRAPHES_V1 = [
  'Premier paragraphe : la thèse est posée, et elle tient.\r\n'
    + 'Elle court sur deux lignes, sans ligne vide entre elles.',
  '  Deuxième paragraphe, indenté de deux espaces à dessein — un trim() le mangerait. ',
  'Troisième paragraphe : l’objection, celle qu’on préférerait ne pas entendre.',
  'Quatrième paragraphe : la réponse à l’objection, puis la conclusion.',
]
const COPIE_V1_CRLF = PARAGRAPHES_V1.join('\r\n\r\n')

const COPIE_VF_CRLF = [
  'Premier paragraphe, révisé : la thèse est posée, et la transition l’annonce.\r\n'
    + 'Elle court toujours sur deux lignes.',
  '  Deuxième paragraphe, toujours indenté. ',
  'Troisième paragraphe : l’objection, reprise avec son garant.',
  'Quatrième paragraphe : la réponse, et la conclusion qui ne répète plus.',
].join('\r\n\r\n')

/** Une télémétrie de faisceau licite pour la garde `depots_saisie_telemetrie_chk`. */
const TELEMETRIE_V1 = {
  signes_saisis: 1420, ms_actifs: 730_000, plus_grand_ajout: 37, sessions: 3,
}

/** La banque de la paire — SIX distracteurs, bien au-dessus du plancher de trois. */
const BANQUE_CAS_1 = [
  'le vocabulaire est imprécis',
  'la thèse n’est pas annoncée',
  'la conclusion répète l’introduction',
  'l’exemple ne soutient pas la thèse',
  'la preuve est absente',
  'la question n’est pas posée',
]
const BANQUE_CAS_2 = [
  'la thèse change en cours de route',
  'l’objection n’est pas traitée',
  'le plan n’est pas annoncé',
  'la référence est plaquée',
  'la transition manque',
  'la définition est circulaire',
]
const ATTENDUE_CAS_1 = 'le lien entre la preuve et la conclusion n’est pas écrit'
const ATTENDUE_CAS_2 = 'le lien : la loi punit ce que la communauté tient pour un tort'

// ════════════════════════════════════════════════════════════════════════════
// LE CONTRÔLE D'ENTRÉE
// ════════════════════════════════════════════════════════════════════════════

async function controleDEntree() {
  titre('Le contrôle d’entrée de la recette')

  portesInitiales = await lireLaPorte(admin)
  const { data: paramsAvant } = await admin.from('scriptorium_params')
    .select('exercices_actif, chaine_actif, vf_delai_jours').eq('id', 1).maybeSingle()
  portesInitiales.chaineActif = !!paramsAvant?.chaine_actif
  note(`portes AVANT : exercices_actif=${portesInitiales.exercicesActifs}, `
    + `chaine_actif=${portesInitiales.chaineActif}, `
    + `vf_delai_jours=${portesInitiales.delaiVfJours} (défaut de la source : ${DELAI_VF_DEFAUT})`)

  // ══════════════════════════════════════════════════════════════════════════
  // ⭐ LA NON-RÉGRESSION QUI COMPTE LE PLUS — `exercices.cible_primaire`.
  // --------------------------------------------------------------------------
  // Le 22/08, cette recette a trouvé que `utils/deroule/depot.ts` sélectionnait
  // `exercices.cible_primaire` — UNE COLONNE QUI N'EXISTE PAS EN BASE. Ce n'est
  // pas un accident de sandbox : la décision du 21/08 (`07-` §1.1 ;
  // `CONTEXTE.md`) a REPORTÉ sa création à un lot de correctifs, et le lot
  // voisin l'écrivait déjà noir sur blanc (`utils/passation/metacognition.ts`,
  // piège 51 : « aucune colonne `cible_primaire` sur `exercices` »).
  //
  // ⚠️ LA CONSÉQUENCE ÉTAIT TOTALE ET MUETTE : PostgREST fait échouer la requête
  //    ENTIÈRE en `42703`, donc `lireDepotMaison` — LE SEUL POINT D'ENTRÉE du
  //    déroulé — rendait `null` pour TOUS les dépôts, donc `chargerLeDeroule`
  //    aussi, et l'écran disait « exercice introuvable » à tout le monde sans
  //    autre symptôme.
  //
  // Le lot a été corrigé le jour même : la colonne est sortie du SELECT et du
  // type, et la cible se lisait sur la DÉCISION du routeur — son domicile de
  // sortie.
  //
  // ⭐⭐ C4-L11 A RETOURNÉ CETTE ASSERTION, ET C'ÉTAIT LE PLAN. Elle était écrite
  //    À L'ENVERS EXPRÈS — « ne nomme PLUS `cible_primaire` » —, pour tenir tant
  //    que le report tenait, et ce fichier disait lui-même que « ce report est
  //    désormais dû ». La colonne existe depuis C4-L11, et le SELECT DOIT
  //    la nommer : sans elle, la colonne existerait « et ne descendrait jamais
  //    jusqu'à la chaîne ». L'assertion se RETOURNE, elle ne se supprime pas :
  //    c'est le même garde-fou, dans l'autre sens.
  // ══════════════════════════════════════════════════════════════════════════
  const { error: eCible } = await admin.from('exercices').select('id, cible_primaire').limit(1)
  dire(!eCible,
    'EN BASE — `exercices.cible_primaire` EXISTE (C4-L11 ; `07-` §1.1, NULLABLE)'
    + `${eCible ? ` — ${eCible.code} ${eCible.message}` : ''}`)

  // Sur pièce : le SELECT du lot, commentaires ôtés, LA NOMME.
  const sourceDepot = fs.readFileSync(`${RACINE}/utils/deroule/depot.ts`, 'utf-8')
  const blocChamps = sourceDepot.slice(sourceDepot.indexOf('const CHAMPS ='),
    sourceDepot.indexOf('function normaliser('))
  const selectSansCommentaires = blocChamps.split('\n')
    .filter((l) => !l.trim().startsWith('//')).join('\n')
  dire(selectSansCommentaires.includes('cible_primaire'),
    'SUR PIÈCE — le SELECT de `utils/deroule/depot.ts` (commentaires ôtés) NOMME '
    + '`cible_primaire` : la colonne descend jusqu’à la chaîne')

  // Et par appel, sur du RÉEL : le point d'entrée rend un dépôt.
  const { data: unMaison } = await admin.from('exercices_depots')
    .select('id, eleve_id, exercices!inner(lieu)').eq('exercices.lieu', 'maison').limit(1)
  if (unMaison?.length) {
    const vivant = await lireDepotMaison(admin, unMaison[0].id, unMaison[0].eleve_id)
    dire(vivant !== null,
      `NON-RÉGRESSION — \`lireDepotMaison\` rend ${vivant === null ? 'NULL' : 'UN DÉPÔT'} sur le `
      + `dépôt maison RÉEL ${unMaison[0].id.slice(0, 8)} de la sandbox : le point d’entrée du `
      + 'déroulé est VIVANT, et l’écran n’est plus « introuvable » pour tout le monde')
  } else {
    manque('aucun dépôt maison préexistant en base : la non-régression ne peut pas être éprouvée '
      + 'sur du réel avant le semis.')
  }

  // ── Ce que la chaîne ouvre : rien, et il faut le dire avant de compter ────
  const ouvertes = competencesOuvertes()
  note(`compétences OUVERTES à la chaîne : ${ouvertes.length ? ouvertes.join(', ') : 'AUCUNE'} — `
    + 'depuis C4-L10 (22/08), l’Expression est dérivée ET branchée ; une mesure ne s’écrit '
    + 'toutefois que si le professeur a posé un statut de recette (sections G et J).')

  // ── Une discordance de fond, constatée par requête, hors manifeste du lot ─
  const { data: crans } = await admin.from('exercices').select('id, cran, lieu').order('created_at')
  const auCode = (crans ?? []).filter((e) => e.cran && !Number.isFinite(Number(e.cran)))
  const auNumero = (crans ?? []).filter((e) => e.cran && Number.isFinite(Number(e.cran)))
  note(`⚠️ OBSERVATION (hors manifeste C4-L3, portée au relevé, NON corrigée) — `
    + `\`exercices.cran\` porte DEUX formes en base : ${auCode.length} ligne(s) au CODE, `
    + `${auNumero.length} au NUMÉRO.`)
  note(`   au CODE   : ${auCode.map((e) => `${e.id} (${e.cran}, ${e.lieu})`).join(' · ')}`)
  note(`   au NUMÉRO : ${auNumero.map((e) => `${e.id} (${e.cran}, ${e.lieu})`).join(' · ')}`)
  note('   `utils/deroule/vue.ts` lit `exercices_crans` PAR CODE ; '
    + '`utils/chaine/contexte.ts` fait `Number(cran)` et lit PAR NUMÉRO. La contre-épreuve des '
    + 'deux formes est jouée après le décor.')

  comptesAvant = await comptesDeToutes()
  note(`comptes AVANT : ${Object.entries(comptesAvant).map(([t, n]) => `${t}=${n}`).join(' · ')}`)
}

// ════════════════════════════════════════════════════════════════════════════
// A. LE DÉCOR
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⚠️ LA RECETTE JOUE LE RÔLE DE L'ASSIGNATION, ET C'EST DÉLIBÉRÉ.
 *    « La ligne d'`exercices_depots` existe DÈS L'ASSIGNATION — le déroulé la
 *    fait AVANCER, il ne la crée pas » (`07-` §1.1). C'est C4-L8 qui la crée ;
 *    ici on la sème à la main, faute d'écran de conception. LE CODE DE C4-L3
 *    N'INSÈRE AUCUN DÉPÔT, et c'est ce que la section D éprouve.
 *
 * ⚠️ Les élèves sont des `profiles` EXISTANTS de rôle `eleve` : on n'en crée
 *    aucun, et on n'écrit RIEN sur leur profil.
 */
async function semer() {
  titre('A. Le décor — semé, et rien d’autre n’est touché')

  const { data: type, error: eType } = await admin.from('exercices_types')
    .select('id, code, grain').eq('code', 'argument').maybeSingle()
  if (eType || !type) throw new Error('type `argument` introuvable — le seed de C4-L1 manque.')
  dire(type.grain === 'meso',
    `le type réutilisé est \`argument\`, grain ${type.grain} — les 15 types existent, `
    + 'la recette n’en crée aucun')

  const { data: eleves, error: eEleves } = await admin.from('profiles')
    .select('id, display_name').eq('role', 'eleve').order('created_at').limit(2)
  if (eEleves) throw new Error(`profils élèves illisibles : ${eEleves.message}`)
  if ((eleves ?? []).length < 2) throw new Error('il faut deux élèves en base pour la garde 1.')
  const eleveA = eleves[0].id
  const eleveB = eleves[1].id
  note(`élèves de test (profils EXISTANTS, réutilisés, jamais écrits) : `
    + `${eleves[0].display_name} · ${eleves[1].display_name}`)

  const { data: classe, error: eClasse } = await admin.from('classes')
    .insert({ nom: `${MARQUE}-classe`, annee_scolaire: '2026-2027' }).select('id').single()
  if (eClasse) throw new Error(`classe de recette : ${eClasse.message}`)
  seme.classes.push(classe.id)

  const poserExercice = async (champs, libelle) => {
    const { data, error } = await admin.from('exercices')
      .insert({ type_id: type.id, classe_id: classe.id, statut: 'assigne', ...champs })
      .select('id').single()
    if (error) throw new Error(`instance « ${libelle} » : ${error.message}`)
    seme.exercices.push(data.id)
    return data.id
  }
  const poserDepot = async (eleveId, exerciceId, libelle) => {
    const { data, error } = await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: exerciceId, origine: 'prof', statut: 'assigne',
      assigne_at: instant(),
    }).select('id, eleve_id, exercice_id, statut').single()
    if (error) throw new Error(`dépôt « ${libelle} » : ${error.message}`)
    seme.depots.push(data.id)
    return data
  }

  // ── 1. L'instance de PRODUCTION — régime plein, et du `**gras**` en consigne
  const exProd = await poserExercice({
    lieu: 'maison',
    cran: '8',  // production_autonome
    consigne_instanciee: `${MARQUE} — Peut-on douter de tout ? Rédige un paragraphe qui pose `
      + 'une **thèse**, l’appuie sur une *raison*, et examine une **objection**.',
    modes_par_competence: { expression: ['composer'], structure: ['composer'] },
    optin_se_juger: false, optin_confiance_remise: false,
  }, 'production_autonome')
  const depotA = await poserDepot(eleveA, exProd, 'A — la traversée')
  const depotB = await poserDepot(eleveB, exProd, 'B — l’autre élève, puis les trois gestes')

  // ── 2. L'instance de CLASSE — pour la deuxième garde de lecture
  const exClasse = await poserExercice({
    lieu: 'classe',
    cran: '8',  // production_autonome
    consigne_instanciee: `${MARQUE} — une passation EN CLASSE, qui n’a pas ces six temps.`,
    modes_par_competence: { expression: ['composer'] },
  }, 'lieu classe')
  const depotClasse = await poserDepot(eleveA, exClasse, 'classe')

  // ── 3. LA PAIRE de diagnostic — deux consignes, deux cas, deux banques
  // ⚠️ `exercices_paire_chk` : `consigne_instanciee` doit être un TABLEAU de 2.
  const exPaire = await poserExercice({
    lieu: 'maison',
    cran: '1',  // diagnostic_guide
    paire_diagnostic: true,
    consigne_instanciee: [
      `${MARQUE} — Cas 1 : quel **défaut** ce raisonnement porte-t-il ?`,
      `${MARQUE} — Cas 2 : même famille, à toi seul.`,
    ],
    modes_par_competence: { argumentation: ['composer'] },
  }, 'diagnostic_guide (paire)')
  // ⚠️ `materiau_id` NULL des DEUX côtés : le trigger `garde_cas_de_la_paire`
  //    ne refuse la paire que lorsque les DEUX cas nomment le MÊME matériau.
  for (const [ordre, banque, attendue] of [
    [1, BANQUE_CAS_1, ATTENDUE_CAS_1], [2, BANQUE_CAS_2, ATTENDUE_CAS_2],
  ]) {
    const { error } = await admin.from('exercices_cas').insert({
      exercice_id: exPaire, ordre,
      defaut: 'la preuve et la conclusion sont là, le lien qui les tient ne l’est pas',
      distracteurs: banque, reponse_attendue: attendue,
    })
    if (error) throw new Error(`cas ${ordre} de la paire : ${error.message}`)
  }
  const depotPaire = await poserDepot(eleveA, exPaire, 'paire')
  dire(BANQUE_CAS_1.length >= 4,
    `la banque du cas 1 porte ${BANQUE_CAS_1.length} distracteurs (plancher `
    + `${PLANCHER_DISTRACTEURS}, l’écran en sert ${CANDIDATS_SERVIS} au total)`)

  // ── 4. L'instance de TRANSFORMATION — pour le régime et l'escalade
  const exTransfo = await poserExercice({
    lieu: 'maison',
    cran: '3',  // transformation_guidee
    consigne_instanciee: `${MARQUE} — Réécris ce passage sans le défaut.`,
    modes_par_competence: { argumentation: ['composer'] },
    observable_isole_code: 'garant_present',
    observable_isole_competence: 'argumentation',
  }, 'transformation_guidee')
  const depotTransfo = await poserDepot(eleveA, exTransfo, 'transformation')

  const decor = {
    classeId: classe.id, eleveA, eleveB,
    exProd, exClasse, exPaire, exTransfo,
    depotA, depotB, depotClasse, depotPaire, depotTransfo,
  }
  note(`décor : classe ${classe.id} · 4 instances · 5 dépôts`)
  return decor
}

// ════════════════════════════════════════════════════════════════════════════
// L'OBSERVATION — LES DEUX FORMES DE `exercices.cran`, MISES CÔTE À CÔTE
// ----------------------------------------------------------------------------
// ⚠️ HORS MANIFESTE DE C4-L3 : rien n'est corrigé ici, et aucun contrôle n'est
//    compté. Ce bloc EXPOSE ce que `lireContexte` rend sur une instance dont le
//    `cran` porte le CODE, et sur une instance dont il porte le NUMÉRO — la
//    contre-épreuve qui rend l'écart lisible plutôt que supposé.
//
//    `utils/deroule/types.ts` tranche pourtant : « le CODE est la clé partout
//    côté application — `exercices.cran` porte le code, pas le numéro ». La
//    couche TYPE de la chaîne, elle, fait `Number(cran)` : sur une instance au
//    code, `Number('production_autonome')` vaut NaN, la requête à
//    `exercices_routes` part avec `cran=eq.NaN` (400, avalé par un `{ data }`
//    sans `error`), et cinq champs du contexte reviennent vides.
// ════════════════════════════════════════════════════════════════════════════

async function observationDesDeuxFormes(d) {
  titre('Observation — les deux formes de `exercices.cran`, mises côte à côte')

  const resume = (ctx) => `cran=${JSON.stringify(ctx.cran)} · `
    + `cranCode=${JSON.stringify(ctx.cranCode)} · regimeV1vf=${JSON.stringify(ctx.regimeV1vf)} · `
    + `servable=${ctx.servable.length} entrée(s) · `
    + `patronProduction=${ctx.patronProduction === null ? 'null' : 'présent'}`

  const ctxCode = await lireContexte(admin, d.depotA.id)
  note(`AU CODE — instance ${d.exProd.slice(0, 8)} (cran « production_autonome »), dépôt `
    + `${d.depotA.id.slice(0, 8)} : ${resume(ctxCode)}`)

  const { data: numerique } = await admin.from('exercices_depots')
    .select('id, exercice_id, exercices!inner(cran, lieu)')
    .eq('exercices.lieu', 'maison').limit(50)
  const auNumero = (numerique ?? []).find(
    (x) => Number.isFinite(Number(x.exercices?.cran)))
  if (auNumero) {
    // ⚠️ LECTURE SEULE sur une ligne préexistante : `lireContexte` n'écrit rien.
    const ctxNum = await lireContexte(admin, auNumero.id)
    note(`AU NUMÉRO — instance ${auNumero.exercice_id.slice(0, 8)} (cran « `
      + `${auNumero.exercices.cran} »), dépôt ${auNumero.id.slice(0, 8)} : ${resume(ctxNum)}`)
  } else {
    note('AU NUMÉRO — aucun dépôt maison sur une instance au numéro : pas de contre-épreuve.')
  }
  note('⚠️ La vue, elle, s’en tire : `vue.ts` relit `exercices_crans` PAR CODE et récupère le '
    + 'geste, le `regime_v1vf` et le guide. C’est la couche TYPE de la chaîne qui est aveugle '
    + 'sur les instances au code — porté au relevé.')
}

// ════════════════════════════════════════════════════════════════════════════
// B. LA PORTE
// ════════════════════════════════════════════════════════════════════════════

async function laPorte(d) {
  titre('B. La porte — `exercices_actif`, ET LUI SEUL (piège 48)')

  const vueAvec = async () => {
    const porte = await lireLaPorte(admin)
    return {
      porte,
      vue: await chargerLeDeroule(admin, d.depotA.id, d.eleveA,
        { ouvert: porte.exercicesActifs, delaiVfJours: porte.delaiVfJours }),
    }
  }

  await poserExercicesActifs(admin, false)
  const ferme = await vueAvec()
  dire(ferme.porte.exercicesActifs === false && ferme.vue !== null && ferme.vue.ouvert === false,
    `\`exercices_actif\` à false → \`lireLaPorte\` rend ${ferme.porte.exercicesActifs} et la vue `
    + `rend ouvert=${ferme.vue === null ? 'AUCUNE VUE' : ferme.vue.ouvert}`)

  await poserExercicesActifs(admin, true)
  const ouvert = await vueAvec()
  dire(ouvert.porte.exercicesActifs === true && ouvert.vue !== null && ouvert.vue.ouvert === true,
    `\`exercices_actif\` à true → \`lireLaPorte\` rend ${ouvert.porte.exercicesActifs} et la vue `
    + `rend ouvert=${ouvert.vue === null ? 'AUCUNE VUE' : ouvert.vue.ouvert}`)

  // ⚠️ AUCUN AUTRE INTERRUPTEUR N'EST DÉTOURNÉ — la vérification est par requête.
  const { data: p } = await admin.from('scriptorium_params')
    .select('chaine_actif, routeur_actif, fabrique_actif, passation_classe_actif, '
      + 'competences_affichage_actif').eq('id', 1).maybeSingle()
  dire(p.chaine_actif === portesInitiales.chaineActif,
    `\`chaine_actif\` n’a pas bougé : ${portesInitiales.chaineActif} avant, ${p.chaine_actif} après `
    + '— « un élève ne doit pas perdre l’accès à sa consigne parce que la facture a coupé »')
  const autres = ['routeur_actif', 'fabrique_actif', 'passation_classe_actif',
    'competences_affichage_actif']
  dire(autres.every((k) => p[k] === false),
    `les quatre autres interrupteurs sont intacts : ${autres.map((k) => `${k}=${p[k]}`).join(', ')}`)

  return ouvert.porte
}

// ════════════════════════════════════════════════════════════════════════════
// C. LES TROIS GARDES DE LECTURE
// ════════════════════════════════════════════════════════════════════════════

async function lesTroisGardes(d) {
  titre('C. Les trois gardes de lecture — par requête ET par appel')

  // ── 1. Un dépôt d'un AUTRE élève ─────────────────────────────────────────
  const ligneB = await ligneDuDepot(d.depotB.id, 'id, eleve_id, statut')
  const autre = await relire(d.depotB.id, d.eleveA)
  dire(ligneB.eleve_id === d.eleveB && autre === null,
    `garde 1 — le dépôt ${d.depotB.id.slice(0, 8)} appartient (PAR REQUÊTE) à `
    + `${ligneB.eleve_id.slice(0, 8)} ; lu au nom de ${d.eleveA.slice(0, 8)}, il rend `
    + `${autre === null ? 'null' : 'UN DÉPÔT'}`)

  // ── 2. Un dépôt dont l'exercice est `lieu = 'classe'` ────────────────────
  const { data: exC } = await admin.from('exercices').select('lieu').eq('id', d.exClasse).maybeSingle()
  const enClasse = await relire(d.depotClasse.id, d.eleveA)
  dire(exC.lieu === 'classe' && enClasse === null,
    `garde 2 — l’exercice porte (PAR REQUÊTE) lieu=« ${exC.lieu} » ; son dépôt, pourtant à cet `
    + `élève, rend ${enClasse === null ? 'null' : 'UN DÉPÔT'} — le déroulé en six temps est celui `
    + 'de la MAISON')

  // ── 3. ⭐ Le dépôt `retire` — LE FILTRE QUE PERSONNE NE POSAIT (piège 41) ──
  const avant = await relire(d.depotB.id, d.eleveB)
  dire(avant !== null,
    `garde 3, témoin — au statut « ${(await ligneDuDepot(d.depotB.id, 'statut')).statut} », le `
    + 'dépôt SE LIT : le null qui suit ne vient pas d’ailleurs')

  const statutAvant = (await ligneDuDepot(d.depotB.id, 'statut')).statut
  await admin.from('exercices_depots').update({ statut: 'retire' }).eq('id', d.depotB.id)
  const enBase = await ligneDuDepot(d.depotB.id, 'statut')
  const retire = await relire(d.depotB.id, d.eleveB)
  dire(enBase.statut === 'retire' && retire === null,
    `garde 3 — statut « ${enBase.statut} » EN BASE, et \`lireDepotMaison\` rend `
    + `${retire === null ? 'null' : 'UN DÉPÔT'} : « retire est une décision du PROFESSEUR », `
    + 'et un dépôt retiré ne se présente plus à l’élève')

  await admin.from('exercices_depots').update({ statut: statutAvant }).eq('id', d.depotB.id)
  const remis = await ligneDuDepot(d.depotB.id, 'statut')
  dire(remis.statut === statutAvant,
    `le statut est remis comme trouvé : « ${remis.statut} »`)
}

// ════════════════════════════════════════════════════════════════════════════
// D. LES HORODATAGES
// ════════════════════════════════════════════════════════════════════════════

async function lesHorodatages(d) {
  titre('D. Les horodatages — « chaque transition est horodatée », PAR REQUÊTE')

  const HORO = 'statut, ouvert_at, v1_remis_at, juger_debut_at, juger_fin_at, vf_remis_at'
  const depart = await ligneDuDepot(d.depotA.id, HORO)
  dire(Object.entries(depart).filter(([k]) => k !== 'statut').every(([, v]) => v === null)
    && depart.statut === 'assigne',
    `avant tout geste : statut « ${depart.statut} », et les cinq horodatages sont NULL`)

  // ── L'ouverture — à la maison, C'EST L'ÉLÈVE QUI OUVRE ───────────────────
  let dep = await relire(d.depotA.id, d.eleveA)
  if (!dep) { dire(false, 'le dépôt A est illisible : la suite de D ne peut pas être jouée'); return }
  const ouv = await ouvrirLeDepot(admin, dep, instant())
  const apresOuverture = await ligneDuDepot(d.depotA.id, HORO)
  dire(ouv.ok && apresOuverture.ouvert_at !== null && apresOuverture.statut === 'ouvert',
    `\`ouvert_at\` = ${apresOuverture.ouvert_at} et statut « ${apresOuverture.statut} » — `
    + 'l’ouverture est un geste de l’élève, pas du professeur (`ouvert_par_prof_at` est au canal '
    + 'classe)')

  // ⚠️ IDEMPOTENCE : « `ouvert_at` ne se réécrit jamais, sans quoi le chronomètre
  //    ouverture → dépôt repartirait à chaque visite ».
  dep = await relire(d.depotA.id, d.eleveA)
  const ouv2 = await ouvrirLeDepot(admin, dep, instant())
  const apresSecondAppel = await ligneDuDepot(d.depotA.id, HORO)
  dire(ouv2.ok && ouv2.valeur?.deja === true
    && apresSecondAppel.ouvert_at === apresOuverture.ouvert_at,
    `second appel d’\`ouvrirLeDepot\` : deja=${ouv2.valeur?.deja}, et \`ouvert_at\` vaut TOUJOURS `
    + `${apresSecondAppel.ouvert_at} — le chronomètre ne repart pas`)

  // ── Le brouillon (la copie du piège E), puis les deux gestes prérequis ────
  dep = await relire(d.depotA.id, d.eleveA)
  const enr = await enregistrerLeTexte(admin, dep, 'v1', COPIE_V1_CRLF, TELEMETRIE_V1, instant())
  dire(enr.ok && enr.valeur?.blocs === 4,
    `le brouillon s’enregistre et le code compte ${enr.valeur?.blocs} bloc(s) — la section E le `
    + 'reprend en base')

  note('les deux gestes prérequis de la remise sont posés ici (ils sont ÉPROUVÉS en G, sur le '
    + 'dépôt B, qui est resté vierge exprès)')
  dep = await relire(d.depotA.id, d.eleveA)
  await enregistrerLaRestitution(admin, dep, 'Ma thèse : on ne peut pas douter de tout à la '
    + 'fois, parce que douter suppose quelque chose de stable.', instant())
  dep = await relire(d.depotA.id, d.eleveA)
  await enregistrerLesConditions(admin, dep, 'temps_mis', instant())

  // ── La remise de la v1 ───────────────────────────────────────────────────
  dep = await relire(d.depotA.id, d.eleveA)
  const rem = await remettre(admin, dep, 'v1',
    { texte: COPIE_V1_CRLF, tagDuree: null, telemetrie: null }, instant())
  const apresV1 = await ligneDuDepot(d.depotA.id, HORO)
  dire(rem.ok && apresV1.v1_remis_at !== null && apresV1.statut === 'v1_remis',
    `\`v1_remis_at\` = ${apresV1.v1_remis_at}, statut « ${apresV1.statut} »`)

  // ── « Se juger » : ouverture puis clôture, DEUX instants distincts ────────
  // ⚠️ C4-L4 pose les deux horodatages au même instant, et la durée y vaut zéro.
  //    À la maison on ouvre à l'affichage et on ferme au dépôt.
  dep = await relire(d.depotA.id, d.eleveA)
  const ouvJuger = await ouvrirSeJuger(admin, dep, instant())
  dep = await relire(d.depotA.id, d.eleveA)
  const finJuger = await enregistrerSeJuger(admin, dep, {
    questions: [], version: null, reponses: {}, comparaison: [], calibration: null, tirage: null,
  }, instant())
  const apresJuger = await ligneDuDepot(d.depotA.id, HORO)
  dire(ouvJuger.ok && finJuger.ok
    && apresJuger.juger_debut_at !== null && apresJuger.juger_fin_at !== null,
    `\`juger_debut_at\` = ${apresJuger.juger_debut_at} · \`juger_fin_at\` = `
    + `${apresJuger.juger_fin_at}`)
  dire(apresJuger.juger_debut_at !== apresJuger.juger_fin_at,
    'les deux horodatages de « se juger » sont DISTINCTS — la phase a une durée, contrairement '
    + 'au canal classe')

  // ── La remise de la version finale ───────────────────────────────────────
  dep = await relire(d.depotA.id, d.eleveA)
  const remVf = await remettre(admin, dep, 'vf',
    { texte: COPIE_VF_CRLF, tagDuree: null, telemetrie: null }, instant())
  const fin = await ligneDuDepot(d.depotA.id, HORO)
  dire(remVf.ok && fin.vf_remis_at !== null && fin.statut === 'vf_remis',
    `\`vf_remis_at\` = ${fin.vf_remis_at}, statut « ${fin.statut} »`)

  // ── ⭐ L'ORDRE, éprouvé sur les cinq valeurs relues en une seule requête ──
  const suite = [
    ['ouvert_at', fin.ouvert_at], ['v1_remis_at', fin.v1_remis_at],
    ['juger_debut_at', fin.juger_debut_at], ['juger_fin_at', fin.juger_fin_at],
    ['vf_remis_at', fin.vf_remis_at],
  ]
  dire(suite.every(([, v]) => v !== null),
    `les cinq horodatages sont posés et NON NULS : ${suite.map(([k]) => k).join(' → ')}`)
  const inversions = suite.slice(1).filter(([, v], i) => !(new Date(suite[i][1]) < new Date(v)))
  dire(inversions.length === 0,
    `l’ordre chronologique est STRICT : ${inversions.length} inversion(s) — `
    + suite.map(([k, v]) => `${k}=${v?.slice(11, 23)}`).join(' < '))

  // ── La micro-question de dépassement — elle n'écrit que sur une RÉPONSE ──
  const avantMicro = await ligneDuDepot(d.depotA.id, 'motif_depassement')
  await repondreALaMicroQuestion(admin, d.depotA.id, 'difficulte', instant())
  const apresMicro = await ligneDuDepot(d.depotA.id, 'motif_depassement')
  dire(avantMicro.motif_depassement === null && apresMicro.motif_depassement === 'difficulte',
    `\`motif_depassement\` : NULL tant qu’elle n’est pas répondue, « ${apresMicro.motif_depassement} » `
    + 'après — « l’absence n’est pas une valeur »')
}

// ════════════════════════════════════════════════════════════════════════════
// E. LES RETOURS À LA LIGNE — LE CŒUR DE LA RECETTE
// ════════════════════════════════════════════════════════════════════════════

async function lesRetoursALaLigne(d) {
  titre('E. ⭐⭐ Les retours à la ligne — le CRLF d’un formulaire, jusqu’à la mesure')

  // Ce que le piège vaut, dit en clair AVANT la vérification.
  const naif = COPIE_V1_CRLF.split(/\n[ \t]*\n+/).filter((b) => b.trim() !== '').length
  note(`la copie envoyée porte ${PARAGRAPHES_V1.length} paragraphes séparés par \\r\\n\\r\\n. `
    + `Un découpage qui NE NORMALISE PAS y compte ${naif} bloc(s) — « une copie dépourvue `
    + 'd’architecture », DÉFAILLANCE FORTE, et ni les tests Node ni la recette de C4-L4 ne la '
    + 'voyaient.')

  // ── 1 et 2. Ce que la BASE porte, relu PAR REQUÊTE ───────────────────────
  const { texte_v1: stocke, texte_vf: stockeVf } =
    await ligneDuDepot(d.depotA.id, 'texte_v1, texte_vf')
  dire(typeof stocke === 'string' && !stocke.includes('\r'),
    `aucun \\r ne subsiste dans \`texte_v1\` : ${(stocke.match(/\r/g) ?? []).length} occurrence(s)`)
  dire(blocs(stocke).length === 4,
    `\`blocs(texte_v1)\` en compte ${blocs(stocke).length} — QUATRE, comme la copie`)
  dire(stocke.startsWith('Premier paragraphe') && stocke.includes('\n  Deuxième paragraphe'),
    'l’indentation de deux espaces du 2ᵉ paragraphe a SURVÉCU — le texte n’a pas été trim()é '
    + 'en son sein')
  dire(stocke.includes('un trim() le mangerait. \n'),
    'l’espace en fin de ligne interne a SURVÉCU aussi — seul le saut de ligne FINAL est retiré')
  dire(stocke === normaliserRetours(COPIE_V1_CRLF).replace(/\n+$/, ''),
    'la copie stockée est EXACTEMENT la copie envoyée, aux \\r près : rien d’autre n’a été touché')
  dire(typeof stockeVf === 'string' && !stockeVf.includes('\r') && blocs(stockeVf).length === 4,
    `la version finale suit la même règle : ${(stockeVf.match(/\r/g) ?? []).length} \\r, `
    + `${blocs(stockeVf).length} bloc(s)`)

  // ── 3. ⭐ CE QUE L'EXTRACTION RECEVRAIT — le « jusqu'à la mesure » ────────
  const ctx = await lireContexte(admin, d.depotA.id)
  dire(blocs(ctx.productionV1 ?? '').length === 4,
    `\`lireContexte().productionV1\` — CE QUE LA CHAÎNE LIT — porte `
    + `${blocs(ctx.productionV1 ?? '').length} bloc(s)`)
  dire((ctx.productionV1 ?? '').includes('\n  Deuxième paragraphe'),
    'et l’extraction reçoit l’indentation intacte : la Structure se mesure sur le découpage tel '
    + 'qu’il est écrit sur la page')
  dire(blocs(ctx.productionVf ?? '').length === 4,
    `\`productionVf\` porte ${blocs(ctx.productionVf ?? '').length} bloc(s) — le delta v1→vf ne `
    + 'comparera pas quatre blocs à un seul')
}

// ════════════════════════════════════════════════════════════════════════════
// F. LE COLLAGE
// ════════════════════════════════════════════════════════════════════════════

async function leCollage(d) {
  titre('F. Le collage — trois vecteurs journalisés, ZÉRO signalement d’intégrité')

  const integriteAvant = (await compter('integrite_signalements')).n

  for (const moyen of MOYENS_DE_COLLAGE) {
    await journaliserCollageBloque(admin, d.depotA.id, d.eleveA, moyen)
  }

  const { collages_bloques: brut } = await ligneDuDepot(d.depotA.id, 'collages_bloques')
  const lus = Array.isArray(brut) ? brut : []
  dire(lus.length === 3,
    `\`exercices_depots.collages_bloques\` porte ${lus.length} entrée(s) — les trois vecteurs `
    + 'que la source nomme')
  dire(lus.every((c) => typeof c?.at === 'string' && c.at.trim() !== ''),
    `chaque entrée porte son \`at\` : ${lus.map((c) => String(c?.at).slice(11, 19)).join(' · ')}`)
  const moyensVus = lus.map((c) => c?.moyen)
  dire(MOYENS_DE_COLLAGE.every((m) => moyensVus.includes(m)),
    `chaque entrée porte son \`moyen\` : ${moyensVus.join(' · ')}`)

  // Et la relecture par le code du lot, pas seulement par la colonne.
  const dep = await relire(d.depotA.id, d.eleveA)
  dire(dep !== null && collagesDuDepot(dep).length === 3,
    `\`collagesDuDepot\` — ce que l’écran du professeur lira — en rend `
    + `${dep === null ? 'n/a' : collagesDuDepot(dep).length}`)

  // ⚠️ « Rien n'y est écrit, et ce n'est pas un oubli » : la journalisation
  //    alimente le FAISCEAU, elle n'accuse pas.
  const integriteApres = (await compter('integrite_signalements')).n
  dire(integriteApres === integriteAvant,
    `\`integrite_signalements\` : ${integriteAvant} avant, ${integriteApres} après — RIEN n’y est `
    + 'écrit, et ce n’est pas un oubli : « la convergence seule fait un drapeau »')
}

// ════════════════════════════════════════════════════════════════════════════
// G. LES TROIS GESTES DE LA REMISE
// ════════════════════════════════════════════════════════════════════════════

async function lesTroisGestes(d, porte) {
  titre('G. Les trois gestes de la remise — l’ORDRE, et la confiance qui NE se sert PAS')

  // ── La confiance : elle NE SE PRÉSENTE PAS, et c'est le cas nominal ───────
  const vue = await chargerLeDeroule(admin, d.depotB.id, d.eleveB,
    { ouvert: porte.exercicesActifs, delaiVfJours: porte.delaiVfJours })
  if (!vue) { dire(false, 'la vue du dépôt B est nulle : G ne peut pas être jouée'); return }
  // ⛔ LE STATUT NE SE LIT PLUS PAR ÉLÈVE : il est GLOBAL, une ligne par
  //    compétence (`c4_statut_recette_global.sql`), et la colonne de
  //    `competences_niveaux` est DORMANTE.
  // ⚠️⚠️ ET CETTE SECTION FIGEAIT UN MONDE — « zéro compétence `evaluee` » —
  //    qui a pris fin le 23/08. Ce que la fiche §6 flux 2 garantit n'est pas
  //    l'absence du geste : c'est que **le geste se présente EXACTEMENT quand
  //    une compétence évaluée le porte**. On l'écrit donc en INVARIANT, vrai
  //    dans les deux mondes, et l'on n'invente aucun attendu.
  const { data: statuts } = await admin.from('competences_statut_recette')
    .select('competence, statut_recette')
  const evaluees = (statuts ?? []).filter((x) => x.statut_recette === 'evaluee')
  note(`compétences \`evaluee\` en base : ${evaluees.length} — ${
    evaluees.map((x) => x.competence).join(', ') || 'AUCUNE'}`)

  const gesteOffert = vue.competencesDeLaConfiance.length > 0
  dire(gesteOffert === vue.gestesRestants.includes('confiance'),
    `\`competencesDeLaConfiance\` (${vue.competencesDeLaConfiance.length}) et les gestes restants `
    + `[${vue.gestesRestants.join(', ')}] DISENT LA MÊME CHOSE — l'un ne se présente pas sans l'autre`)
  dire(!gesteOffert || evaluees.length > 0,
    'le geste ne se présente JAMAIS sans compétence `evaluee` (fiche §6, flux 2)')

  let dep = await relire(d.depotB.id, d.eleveB)
  // ⛔ ON N'ÉCRIT QUE DANS LE CAS DU REFUS, et c'est délibéré : écrire une
  //    confiance quand le geste EST offert changerait l'état du dépôt, et une
  //    assertion plus bas dans cette même section vérifie que
  //    `confiance_declaree` reste NULL. Une recette ne se marche pas dessus.
  if (!gesteOffert) {
    const conf = await enregistrerLaConfiance(admin, dep, { expression: 'moyenne' }, [], instant())
    dire(!conf.ok && /ne se présente pas/.test(conf.message),
      `le geste n'est pas offert, et l'écriture est refusée mécaniquement : « ${conf.message} »`)
  } else {
    note('le geste EST offert (au moins une compétence `evaluee`) — l\'écriture n\'est pas '
      + 'tentée ici pour ne pas perturber la suite de la section')
  }

  // ── L'ORDRE : `remettre` REFUSE tant que les deux gestes manquent ─────────
  dep = await relire(d.depotB.id, d.eleveB)
  await ouvrirLeDepot(admin, dep, instant())
  dep = await relire(d.depotB.id, d.eleveB)
  await enregistrerLeTexte(admin, dep, 'v1',
    'Une copie brève, mais non vide.\r\n\r\nEt un second paragraphe.', null, instant())

  dep = await relire(d.depotB.id, d.eleveB)
  const sansRien = await remettre(admin, dep, 'v1',
    { texte: 'Une copie brève, mais non vide.', tagDuree: null, telemetrie: null }, instant())
  dire(!sansRien.ok && /restitution à chaud/.test(sansRien.message),
    `sans restitution : la remise REFUSE — « ${sansRien.message} »`)

  dep = await relire(d.depotB.id, d.eleveB)
  const rest = await enregistrerLaRestitution(admin, dep,
    'Ma thèse : la loi ne dit pas ce qui est juste, elle dit ce que la cité punit.', instant())
  dep = await relire(d.depotB.id, d.eleveB)
  const sansConditions = await remettre(admin, dep, 'v1',
    { texte: 'Une copie brève, mais non vide.', tagDuree: null, telemetrie: null }, instant())
  dire(rest.ok && !sansConditions.ok && /conditions de travail/.test(sansConditions.message),
    `restitution posée, conditions manquantes : la remise REFUSE ENCORE — « ${sansConditions.message} »`)

  // Le domaine des conditions est FERMÉ, et la garde n'est pas qu'à l'écran.
  // ⚠️ Il faut l'éprouver AVANT la remise : après, c'est l'autre garde — « les
  //    conditions se déclarent à la remise de la v1 » — qui répond la première.
  dep = await relire(d.depotB.id, d.eleveB)
  const horsDomaine = await enregistrerLesConditions(admin, dep, 'plutot_bien', instant())
  dire(!horsDomaine.ok && /trois valeurs/.test(horsDomaine.message),
    `une quatrième valeur de conditions est refusée : « ${horsDomaine.message} »`)

  dep = await relire(d.depotB.id, d.eleveB)
  const cond = await enregistrerLesConditions(admin, dep, 'au_plus_vite', instant())
  dep = await relire(d.depotB.id, d.eleveB)
  const enfin = await remettre(admin, dep, 'v1',
    { texte: 'Une copie brève, mais non vide.\r\n\r\nEt un second paragraphe.',
      tagDuree: null, telemetrie: null }, instant())
  dire(cond.ok && enfin.ok,
    `les deux gestes posés, la remise PASSE (statut ${enfin.valeur?.statut}, `
    + `${enfin.valeur?.blocs} bloc(s))`)

  // ── Ce que la base porte, par requête ────────────────────────────────────
  const ligne = await ligneDuDepot(d.depotB.id,
    'restitution_a_chaud, conditions_declarees, confiance_declaree, statut')
  dire(typeof ligne.restitution_a_chaud === 'string' && ligne.restitution_a_chaud.length > 0,
    `\`restitution_a_chaud\` est écrite (${ligne.restitution_a_chaud.length} caractères, `
    + 'plafond 400 — « trente secondes au clavier »)')
  dire(ligne.conditions_declarees?.valeur === 'au_plus_vite'
    && typeof ligne.conditions_declarees?.at === 'string',
    `\`conditions_declarees\` = ${JSON.stringify(ligne.conditions_declarees)} — un objet, pour que `
    + 'la règle des « trois `pas_pu` d’affilée » puisse se compter dans l’ordre')
  // ⚠️ LE MOTIF A CHANGÉ, PAS L'ATTENDU. Il disait « aucune compétence
  //    `evaluee`, donc aucune valeur » — vrai jusqu'au 23/08. La raison vraie
  //    est plus simple et ne dépend d'aucun monde : L'ÉLÈVE N'EN A DÉCLARÉ
  //    AUCUNE, et rien ne pose de valeur à sa place.
  dire(ligne.confiance_declaree === null,
    `\`confiance_declaree\` reste NULL (${JSON.stringify(ligne.confiance_declaree)}) : l’élève `
    + 'n’a rien déclaré — jamais un défaut posé à la place de l’élève')

  // Et l'ordre tient DANS L'AUTRE SENS : une fois la v1 remise, les trois gestes
  // se ferment — « un jugement porté après le retour ne mesure plus l'élève ».
  dep = await relire(d.depotB.id, d.eleveB)
  const tropTard = await enregistrerLaRestitution(admin, dep, 'Je me ravise.', instant())
  dire(!tropTard.ok && /avant la remise/.test(tropTard.message),
    `après la remise, la restitution se ferme : « ${tropTard.message} »`)
}

// ════════════════════════════════════════════════════════════════════════════
// H. LA CRÉDENCE ET LA PAIRE
// ════════════════════════════════════════════════════════════════════════════

async function laCredenceEtLaPaire(d, porte) {
  titre('H. La crédence et la paire — deux cas, le mêlage, les deux clés que la chaîne lit')

  const charger = () => chargerLeDeroule(admin, d.depotPaire.id, d.eleveA,
    { ouvert: porte.exercicesActifs, delaiVfJours: porte.delaiVfJours })

  // ── 1. DEUX cas, et une offre de crédence par cas ────────────────────────
  let vue = await charger()
  if (!vue) { dire(false, 'la vue de la paire est nulle : H ne peut pas être jouée'); return }
  dire(vue.estUnePaire && vue.cas.length === 2,
    `l’instance est une paire et la vue rend ${vue.cas.length} cas — « UNE ligne, DEUX cas, `
    + 'un seul dépôt, DEUX crédences, UNE mesure »')
  dire(nombreDeCas('diagnostiquer') === 2 && credenceDemandee('diagnostiquer'),
    'le geste `diagnostiquer` commande deux cas et demande la crédence (`02-` §5)')
  const offres = vue.cas.map((c) => c.credence)
  dire(offres.every((o) => o && o.forme === 'repartition' && o.empechement === null),
    `les deux offres sont servies en « répartition » : `
    + `${offres.map((o) => o?.forme ?? 'AUCUNE').join(' · ')}`)
  dire(offres.every((o) => o?.candidats.length === CANDIDATS_SERVIS),
    `chaque offre sert ${offres.map((o) => o?.candidats.length).join(' et ')} candidats — `
    + `${CANDIDATS_SERVIS}, jamais la banque entière`)
  dire(vue.cas.every((c) => !JSON.stringify(c).includes('pourquoi_faux')),
    'aucune note de conception (`pourquoi_faux`) ne sort vers l’élève')

  // ── 2. ⭐ LE MÊLAGE (piège 37) — la bonne réponse ne tombe pas toujours 4ᵉ ─
  const appui1 = { distracteurs: BANQUE_CAS_1, reponseAttendue: ATTENDUE_CAS_1 }
  const rangs = []
  for (let i = 0; i < 12; i++) {
    const faux = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`
    rangs.push(offreDeCredence('diagnostic_guide', 1, faux, appui1).indexAttendue)
  }
  const distincts = [...new Set(rangs)]
  dire(distincts.length >= 2,
    `sur 12 dépôts simulés, la \`reponse_attendue\` tombe aux rangs [${rangs.join(',')}] — `
    + `${distincts.length} position(s) distincte(s) : elle N’EST PAS toujours la dernière`)
  const stable = offreDeCredence('diagnostic_guide', 1, d.depotPaire.id, appui1)
  const stable2 = offreDeCredence('diagnostic_guide', 1, d.depotPaire.id, appui1)
  dire(JSON.stringify(stable.candidats) === JSON.stringify(stable2.candidats),
    'et le mêlage est STABLE sur (dépôt × cas) : un rechargement rend le même ordre, sinon les '
    + 'jetons déjà posés ne voudraient plus rien dire')

  // ── 4 (avant). La correction du cas 1 n'est PAS servie avant sa crédence ──
  let dep = await relire(d.depotPaire.id, d.eleveA)
  await enregistrerLeTexte(admin, dep, 'v1',
    'Le lien entre la preuve et la conclusion me paraît manquer.', null, instant())
  vue = await charger()
  dire(vue.etapePaire === 'credence_1' && vue.correctionDuPremierCas === null,
    `le cas 1 est répondu mais non crédencé : étape « ${vue.etapePaire} », `
    + `\`correctionDuPremierCas\` = ${JSON.stringify(vue.correctionDuPremierCas)} — sans quoi `
    + 'l’élève déclarerait sa sûreté en connaissant la réponse')

  // ── 3. La saisie, et LES DEUX CLÉS QUE LA CHAÎNE LIT ─────────────────────
  const offre = vue.cas[0].credence
  const jetons = [10, 20, 30, 40]
  const { valeur, refus } = saisieARegistrer(1, offre, { jetons }, instant())
  dire(valeur !== null && refus === null,
    `\`saisieARegistrer\` accepte quatre jetons de somme ${jetons.reduce((a, b) => a + b, 0)}`)
  const mauvais = saisieARegistrer(1, offre, { jetons: [10, 20, 30, 39] }, instant())
  dire(mauvais.valeur === null && /somme fait 100/.test(mauvais.refus ?? ''),
    `une somme de 99 est refusée : « ${mauvais.refus} »`)

  dep = await relire(d.depotPaire.id, d.eleveA)
  const ecrite = await enregistrerLaCredence(admin, dep, 1, valeur, instant())
  const { data: meta } = await admin.from('exercices_metacognition')
    .select('credence').eq('depot_id', d.depotPaire.id).maybeSingle()
  const tableau = Array.isArray(meta?.credence) ? meta.credence : null
  dire(ecrite.ok && tableau !== null && tableau.length === 1,
    `\`exercices_metacognition.credence\` est un TABLEAU de ${tableau?.length ?? 'n/a'} entrée(s) `
    + '— « plusieurs valeurs par dépôt : une par diagnostic, donc deux sur une paire »')
  const e0 = tableau?.[0] ?? {}
  dire(Array.isArray(e0.jetons) && e0.jetons.length === CANDIDATS_SERVIS
    && typeof e0.index_correct === 'number',
    `l’entrée porte LES DEUX CLÉS QUE LA CHAÎNE LIT (\`monitoring.ts:lireCredence\`) : `
    + `jetons=${JSON.stringify(e0.jetons)} · index_correct=${e0.index_correct}`)
  dire(e0.candidats?.[e0.index_correct] === ATTENDUE_CAS_1,
    `et \`index_correct\` désigne bien la réponse attendue dans les candidats journalisés `
    + `(rang ${e0.index_correct})`)

  // ── 4 (après). La correction est servie une fois la crédence donnée ──────
  vue = await charger()
  dire(vue.etapePaire === 'correction' && vue.correctionDuPremierCas === ATTENDUE_CAS_1,
    `après la crédence : étape « ${vue.etapePaire} », et la correction du cas 1 est servie — `
    + `« ${String(vue.correctionDuPremierCas).slice(0, 48)}… »`)

  // Et l'écrasement se fait PAR CAS : redéposer le cas 2 n'efface pas le cas 1.
  const offre2 = vue.cas[1].credence
  const saisie2 = saisieARegistrer(2, offre2, { jetons: [25, 25, 25, 25] }, instant())
  dep = await relire(d.depotPaire.id, d.eleveA)
  await enregistrerLaCredence(admin, dep, 2, saisie2.valeur, instant())
  const { data: meta2 } = await admin.from('exercices_metacognition')
    .select('credence').eq('depot_id', d.depotPaire.id).maybeSingle()
  const deux = Array.isArray(meta2?.credence) ? meta2.credence : []
  dire(deux.length === 2 && deux[0].cas === 1 && deux[1].cas === 2
    && JSON.stringify(deux[0].jetons) === JSON.stringify(jetons),
    `la crédence du cas 2 s’ajoute SANS effacer celle du cas 1 : ${deux.length} entrées, `
    + `cas ${deux.map((c) => c.cas).join(' et ')}, jetons du cas 1 intacts `
    + `(${JSON.stringify(deux[0].jetons)})`)
}

// ════════════════════════════════════════════════════════════════════════════
// I. LA MISE EN FILE ET LE DÉCLENCHEUR
// ════════════════════════════════════════════════════════════════════════════

async function laFile(d) {
  titre('I. La mise en file et le déclencheur — la clé, l’idempotence, le job REPOSÉ')

  const { data: p } = await admin.from('scriptorium_params')
    .select('chaine_actif').eq('id', 1).maybeSingle()
  if (SANS_APPEL && p.chaine_actif) {
    manque('section I SAUTÉE — `--sans-appel` et `chaine_actif` est OUVERT : `traiterDepot` '
      + 'partirait au fournisseur, et cette section dépenserait.')
    return
  }
  note(`\`chaine_actif\` = ${p.chaine_actif} : \`traiterDepot\` lèvera \`ChaineSuspendue\` AVANT `
    + 'tout appel. CETTE SECTION NE DÉPENSE RIEN, elle est donc jouée même sous `--sans-appel`.')

  const dep = await relire(d.depotA.id, d.eleveA)
  if (!dep) { dire(false, 'le dépôt A est illisible : I ne peut pas être jouée'); return }

  // Le registre est ASSEMBLÉ ici et ÉLU par C4-L2 — on le dit avant de partir.
  const { registre, motif: motifRegistre } = await registreDuRetour(admin, dep)
  note(`registre du retour, élu par C4-L2 : « ${registre} » — ${motifRegistre}`)

  // ── 1. La clé d'idempotence ──────────────────────────────────────────────
  const bilan1 = await mesurerMaintenant(admin, dep, 'v1')
  const { data: jobs1 } = await admin.from('exercices_jobs')
    .select('id, etape, statut, tentatives, cle_idempotence, echec_definitif, dernier_message')
    .eq('depot_id', d.depotA.id).eq('etape', etapeDe('v1'))
  dire((jobs1 ?? []).length === 1,
    `un job \`mesure_v1\` existe : ${(jobs1 ?? []).length} ligne(s) dans \`exercices_jobs\``)
  dire(jobs1?.[0]?.cle_idempotence === cleIdempotence(d.depotA.id, 'mesure_v1'),
    `sa \`cle_idempotence\` vaut « ${jobs1?.[0]?.cle_idempotence} » — soit `
    + `\`<depotId>:mesure_v1\``)

  // ── 2. ⭐ L'IDEMPOTENCE ──────────────────────────────────────────────────
  const dep2 = await relire(d.depotA.id, d.eleveA)
  const bilan2 = await mesurerMaintenant(admin, dep2, 'v1')
  const { data: jobs2 } = await admin.from('exercices_jobs')
    .select('id, statut, tentatives, dernier_message')
    .eq('depot_id', d.depotA.id).eq('etape', etapeDe('v1'))
  dire((jobs2 ?? []).length === 1,
    `après un SECOND déclenchement : TOUJOURS ${(jobs2 ?? []).length} job — un double-clic ne `
    + 'paie pas deux mesures')
  dire(bilan2.dejaEnFile === true,
    `et le second appel le SAIT : dejaEnFile=${bilan2.dejaEnFile}`)

  // ── ⚠️ LE JOB EST REPOSÉ, ET SA TENTATIVE LUI EST RENDUE ─────────────────
  const job = jobs2?.[0]
  dire(job?.statut === 'en_attente',
    `\`chaine_actif\` à OFF → le job est revenu en « ${job?.statut} » : « rien ne se perd, le `
    + 'traitement reprend à la réouverture ». Ce n’est PAS un échec.')
  dire(job?.tentatives === 0,
    `sa tentative lui a été RENDUE : tentatives=${job?.tentatives} — sans quoi trois suspensions `
    + 'suffiraient à faire un `echec_definitif` sur une copie jamais traitée')
  dire(bilan1.bilan === null && /suspendu/.test(bilan1.motif ?? ''),
    `et l’écran a de quoi parler — motif : « ${bilan1.motif} »`)

  // ── 3. L'état d'attente, lisible ─────────────────────────────────────────
  const attente = await attenteDuDepot(admin, d.depotA.id)
  dire(attente.jobs.length === 1 && attente.enCours === true
    && attente.echecDefinitif === false && typeof attente.message === 'string',
    `\`attenteDuDepot\` rend un état EXPLICITE : ${attente.jobs.length} job, `
    + `enCours=${attente.enCours}, echecDefinitif=${attente.echecDefinitif}, `
    + `message=« ${String(attente.message).slice(0, 60)}… »`)
  dire(attente.jobs.every((j) => j.etape === 'mesure_v1' || j.etape === 'mesure_vf'),
    `l’attente ne rend QUE les étapes de mesure : ${attente.jobs.map((j) => j.etape).join(', ')}`)
}

// ════════════════════════════════════════════════════════════════════════════
// J. L'AIDE CONSOMMÉE
// ════════════════════════════════════════════════════════════════════════════

async function laideConsommee(d) {
  titre('J. L’aide consommée — le compteur, et ce qui ne peut PAS être prouvé aujourd’hui')

  const depart = (await ligneDuDepot(d.depotA.id, 'aide_consommee')).aide_consommee
  for (const aide of AIDES_COMPTEES) {
    const dep = await relire(d.depotA.id, d.eleveA)
    if (!dep) break
    await compterUneAide(admin, dep, aide, instant())
  }
  const total = (await ligneDuDepot(d.depotA.id, 'aide_consommee')).aide_consommee
  dire(total === depart + 3,
    `\`aide_consommee\` : ${depart} → ${total} après trois dépliages `
    + `(${AIDES_COMPTEES.join(' · ')})`)

  // Le domaine des aides est FERMÉ : « la fiche » du `01-` §11 n'a pas d'écran
  // avant C6-L2, et le compteur ne porte que les aides que CET écran sert.
  const depAide = await relire(d.depotA.id, d.eleveA)
  const inconnue = await compterUneAide(admin, depAide, 'fiche_de_competence', instant())
  const apresInconnue = (await ligneDuDepot(d.depotA.id, 'aide_consommee')).aide_consommee
  dire(!inconnue.ok && apresInconnue === total,
    `une aide hors du domaine est refusée sans rien écrire (« ${inconnue.message} », `
    + `compteur toujours à ${apresInconnue})`)

  // ── ⭐ CE QUE LE DÉCLENCHEUR PASSE À LA CHAÎNE — prouvé SUR PIÈCE ─────────
  const source = fs.readFileSync(`${RACINE}/utils/deroule/mesure.ts`, 'utf-8')
  const appel = source.slice(source.indexOf('await traiterDepot('),
    source.indexOf('await traiterDepot(') + 320)
  const passe = /aideConsommee:\s*depot\.aide_consommee/.test(appel)
  dire(passe,
    'SUR PIÈCE — `utils/deroule/mesure.ts` passe bien la valeur à la chaîne : '
    + `\`${(appel.match(/aideConsommee:[^\n]*/) ?? ['(absent)'])[0].trim()}\` — « c’est TOI qui la `
    + 'portes » (piège 35), la chaîne la RECOPIE et ne la calcule jamais')

  // ── ⚠️ CE QU'ON NE PEUT PAS PROUVER, ET POURQUOI ─────────────────────────
  // ⚠️ LE MOTIF DE CE ⊘ A CHANGÉ, ET IL FAUT LE DIRE. Il invoquait « la porte
  //    est la PREMIÈRE FICHE VERSÉE ET BANCÉE » — cette porte est OUVERTE depuis
  //    C4-L10 : les six compétences sont branchées. Le seul obstacle restant est
  //    que LA CHAÎNE N'A PAS TOURNÉ sur ce dépôt (mode `--sans-appel`, ou
  //    `chaine_actif` à OFF). Le contrôle peut donc VERDIR — il le fait dès
  //    qu'une mesure existe.
  const ouvertes = competencesOuvertes()
  const { data: mes } = await admin.from('competences_mesures')
    .select('competence, aide_consommee').eq('depot_id', d.depotA.id)
  if ((mes ?? []).length > 0) {
    const attendue = (await ligneDuDepot(d.depotA.id, 'aide_consommee')).aide_consommee ?? null
    dire((mes ?? []).every((m) => m.aide_consommee === attendue),
      `⭐ LE BOUT-EN-BOUT EST ÉPROUVÉ : \`aide_consommee\` = ${attendue} au dépôt, et `
      + `${(mes ?? []).map((m) => `${m.competence}=${m.aide_consommee}`).join(' · ')} en mesure `
      + '— la chaîne la RECOPIE, elle ne la calcule pas')
  } else {
    manque(`le bout-en-bout \`aide_consommee\` → \`competences_mesures.aide_consommee\` n’est pas `
      + `éprouvé ICI : ${ouvertes.length} compétence(s) ouverte(s) à la chaîne — la porte de C4-L10 `
      + 'est donc LEVÉE —, mais la chaîne n’a pas tourné sur ce dépôt (0 mesure, constaté par '
      + 'requête) : `--sans-appel`, ou `chaine_actif` à OFF. Ce n’est pas un vert.')
  }
}

// ════════════════════════════════════════════════════════════════════════════
// K. LE RÉGIME ET L'ESCALADE
// ════════════════════════════════════════════════════════════════════════════

async function leRegimeEtLEscalade(d, porte) {
  titre('K. Le régime et l’escalade — la version finale que N2 fait naître')

  // Le module PUR, d'abord : c'est lui qui porte la règle.
  const sans = regimeDuDeroule('pas de vf, sauf escalade',
    { observableIsoleCode: 'garant_present', observableIsoleCompetence: 'argumentation' })
  dire(sans.regime === 'sans_vf' && sans.vfRequiseParEscalade === false,
    `le cran \`transformation_guidee\` déclare « pas de vf, sauf escalade » → régime `
    + `« ${sans.regime} » sans escalade`)

  const charger = () => chargerLeDeroule(admin, d.depotTransfo.id, d.eleveA,
    { ouvert: porte.exercicesActifs, delaiVfJours: porte.delaiVfJours })

  // ── L'escalade N2 sur l'observable QUE L'INSTANCE ISOLE ──────────────────
  const { error: eEsc } = await admin.from('competences_escalade').insert({
    eleve_id: d.eleveA, competence: 'argumentation', observable: 'garant_present',
    degre: 'N2', entre_n1_at: instant(),
  })
  if (eEsc) { dire(false, `escalade de recette non semée : ${eEsc.message}`); return }
  seme.escalades.push({ eleve: d.eleveA, competence: 'argumentation', observable: 'garant_present' })

  const avec = await charger()
  if (!avec) { dire(false, 'la vue de l’instance de transformation est nulle'); return }
  dire(avec.regime === 'plein' && avec.vfRequiseParEscalade === true,
    `escalade N2 posée EN BASE sur (argumentation × garant_present) → la vue rend régime `
    + `« ${avec.regime} », vfRequiseParEscalade=${avec.vfRequiseParEscalade}`)
  dire(avec.temps.includes('reviser') && avec.temps.includes('retour_final'),
    `et les six temps sont servis : ${avec.temps.join(' → ')}`)

  // ── L'escalade retirée : le régime redescend, et les temps 5 et 6 tombent ─
  await admin.from('competences_escalade').delete()
    .eq('eleve_id', d.eleveA).eq('competence', 'argumentation').eq('observable', 'garant_present')
  seme.escalades.pop()
  const { count: reste } = await admin.from('competences_escalade')
    .select('eleve_id', { count: 'exact', head: true })
    .eq('eleve_id', d.eleveA).eq('observable', 'garant_present')
  const sansEsc = await charger()
  dire(reste === 0 && sansEsc.regime === 'sans_vf' && sansEsc.vfRequiseParEscalade === false,
    `escalade retirée (${reste} ligne en base) → régime « ${sansEsc.regime} », `
    + `vfRequiseParEscalade=${sansEsc.vfRequiseParEscalade}`)
  dire(sansEsc.temps.length === 4
    && !sansEsc.temps.includes('reviser') && !sansEsc.temps.includes('retour_final'),
    `LES TEMPS 5 ET 6 NE SONT PAS SERVIS : ${sansEsc.temps.join(' → ')} `
    + `(${sansEsc.temps.length} temps) — « ne force pas un \`vf_remis\` qui n’existe pas »`)
  dire(sansEsc.echeanceVf.quand === null,
    `et aucune échéance de version finale n’est calculée : ${JSON.stringify(sansEsc.echeanceVf)}`)
  dire(JSON.stringify(tempsServis('sans_vf')) === JSON.stringify(sansEsc.temps),
    'la vue ne fait que relayer `tempsServis(regime)` : rien n’est gravé en dur à l’écran')
}

// ════════════════════════════════════════════════════════════════════════════
// L. LE NETTOYAGE
// ════════════════════════════════════════════════════════════════════════════

let nettoyageFait = false

async function nettoyer() {
  if (nettoyageFait) return
  nettoyageFait = true
  titre('L. Le nettoyage — tout ce que la recette a semé est retiré')

  // ── Les interrupteurs, TOUJOURS — même sous `--garde-le-decor` ───────────
  if (portesInitiales) {
    await poserExercicesActifs(admin, portesInitiales.exercicesActifs)
    const apres = await lireLaPorte(admin)
    const { data: p } = await admin.from('scriptorium_params')
      .select('chaine_actif, vf_delai_jours').eq('id', 1).maybeSingle()
    dire(apres.exercicesActifs === portesInitiales.exercicesActifs
      && p.chaine_actif === portesInitiales.chaineActif
      && p.vf_delai_jours === portesInitiales.delaiVfJours,
      `les interrupteurs sont remis EXACTEMENT comme trouvés : exercices_actif=`
      + `${apres.exercicesActifs}, chaine_actif=${p.chaine_actif}, `
      + `vf_delai_jours=${p.vf_delai_jours}`)
  }

  if (GARDE_LE_DECOR) {
    note('⚠️ `--garde-le-decor` : le décor RESTE en base. Pour le smoke à l’écran, c’est au '
      + 'professeur d’ouvrir `exercices_actif` — la recette ne laisse jamais une porte ouverte '
      + 'derrière elle.')
    note(`à retirer à la main : classes LIKE « ${MARQUE}% » et tout ce qui en dépend.`)
    return
  }

  // ── Les escalades éventuellement restées (interruption en pleine section K)
  for (const e of seme.escalades) {
    await admin.from('competences_escalade').delete()
      .eq('eleve_id', e.eleve).eq('competence', e.competence).eq('observable', e.observable)
  }

  // ── Le périmètre : le registre du semis, ÉLARGI par la marque ────────────
  const { data: classes } = await admin.from('classes').select('id').like('nom', `${MARQUE}%`)
  const classeIds = [...new Set([...(classes ?? []).map((c) => c.id), ...seme.classes])]
  const { data: exs } = classeIds.length
    ? await admin.from('exercices').select('id').in('classe_id', classeIds)
    : { data: [] }
  const exIds = [...new Set([...(exs ?? []).map((e) => e.id), ...seme.exercices])]
  const { data: deps } = exIds.length
    ? await admin.from('exercices_depots').select('id').in('exercice_id', exIds)
    : { data: [] }
  const depIds = [...new Set([...(deps ?? []).map((x) => x.id), ...seme.depots])]

  // ── L'ORDRE DES DÉPENDANCES ──────────────────────────────────────────────
  if (depIds.length) {
    for (const t of ['exercices_jobs', 'exercices_retours', 'exercices_metacognition',
      'exercices_squelettes', 'competences_mesures', 'api_couts']) {
      const { error } = await admin.from(t).delete().in('depot_id', depIds)
      if (error && error.code !== '42P01') note(`⚠️ ${t} : ${error.code} ${error.message}`)
    }
    const { error } = await admin.from('exercices_depots').delete().in('id', depIds)
    if (error) note(`⚠️ exercices_depots : ${error.code} ${error.message}`)
  }
  if (exIds.length) {
    await admin.from('exercices_cas').delete().in('exercice_id', exIds)
    const { error } = await admin.from('exercices').delete().in('id', exIds)
    if (error) note(`⚠️ exercices : ${error.code} ${error.message}`)
  }
  if (classeIds.length) {
    const { error } = await admin.from('classes').delete().in('id', classeIds)
    if (error) note(`⚠️ classes : ${error.code} ${error.message}`)
  }

  // ── LA PREUVE : les comptes, table par table, avant et après ─────────────
  const apres = await comptesDeToutes()
  const ecarts = TABLES_TOUCHEES
    .map((t) => ({ t, avant: comptesAvant[t], apres: apres[t] }))
    .filter((x) => x.avant !== x.apres)
  dire(ecarts.length === 0,
    `la base est revenue à son état d’avant, table par table : `
    + (ecarts.length === 0
      ? TABLES_TOUCHEES.map((t) => `${t}=${apres[t]}`).join(' · ')
      : `ÉCARTS — ${ecarts.map((x) => `${x.t} ${x.avant}→${x.apres}`).join(' · ')}`))

  const { count: resteMarque } = await admin.from('classes')
    .select('id', { count: 'exact', head: true }).like('nom', `${MARQUE}%`)
  dire((resteMarque ?? 0) === 0,
    `aucune classe « ${MARQUE}% » ne survit : ${resteMarque ?? 0}`)
}

// ════════════════════════════════════════════════════════════════════════════

async function principal() {
  console.log(`\n══ RECETTE C4·L3 — le déroulé de l’élève, à la maison`
    + `${SANS_APPEL ? ' (SANS APPEL)' : ''}${GARDE_LE_DECOR ? ' (DÉCOR GARDÉ)' : ''}`)

  await controleDEntree()
  const decor = await semer()
  await observationDesDeuxFormes(decor)
  const porte = await laPorte(decor)
  await lesTroisGardes(decor)
  await lesHorodatages(decor)
  await lesRetoursALaLigne(decor)
  await leCollage(decor)
  await lesTroisGestes(decor, porte)
  await laCredenceEtLaPaire(decor, porte)
  await laFile(decor)
  await laideConsommee(decor)
  await leRegimeEtLEscalade(decor, porte)
  await nettoyer()
}

let sortie = 0
try {
  await principal()
} catch (e) {
  console.error('\n✗ RECETTE INTERROMPUE —', e)
  ko++
  sortie = 1
  try { await nettoyer() } catch (e2) { console.error('  · nettoyage best-effort :', e2) }
}

console.log(`\n══ ${ok + ko + na} contrôles, ${ok} passés, ${ko} échoués, ${na} non éprouvés (⊘)`)
process.exitCode = ko > 0 || sortie === 1 ? 1 : 0
