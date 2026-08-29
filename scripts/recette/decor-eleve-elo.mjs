// ============================================================================
// DÉCOR D'ÉCRAN — LE PROFIL D'ÉLO, POUR TRAVAILLER L'UI ÉLÈVE
// ----------------------------------------------------------------------------
// Ce n'est PAS une recette : il n'éprouve rien, il ne rend aucun verdict. Il
// SÈME un élève crédible et S'ARRÊTE LÀ, pour qu'on puisse regarder les écrans
// avec de la matière dedans — l'affichage des compétences et la passation des
// exercices.
//
// L'ÉTAT VISÉ, au 2026-08-28 : une élève qui a passé ses DEUX examens
// diagnostiques EN CLASSE, reçu son RETOUR IA sur chacun, dont les compétences
// SONT MESURÉES (des ancres, donc des lettres), et qui FAIT SES PREMIERS
// EXERCICES à la maison — dans les quatre états que la liste sait rendre.
//
// ⛔ IL NE SE NETTOIE PAS TOUT SEUL — c'est tout son objet. `--retire`.
//
// ── CE QU'IL RESPECTE, ET POURQUOI ─────────────────────────────────────────
//
// ⭐⭐ LA MARQUE VA EN BASE, JAMAIS SEULEMENT SUR DISQUE. Un décor qu'on ne sait
//    retrouver que par un fichier local n'est pas retirable (leçon payée deux
//    fois : un `| head` (SIGPIPE) et une contrainte, onze mesures orphelines).
//    Ici la marque a TROIS domiciles en base :
//      · `competences_mesures.instrument_version = MARQUE`
//      · `exercices_retours.texte[].id` préfixé `decor-eleve-elo:`
//      · `exercices_jobs.cle_idempotence` préfixée `DECOR-ELEVE-ELO:`
//    ⭐ Et les DÉPÔTS se retrouvent SANS le registre, par deux chemins :
//      · le `depot_id` des mesures, des retours et des jobs marqués ;
//      · le COUPLE (Élo × les quatre instances), qui sont des constantes de ce
//        fichier — et le contrôle d'entrée refuse de semer si l'une porte déjà
//        un dépôt d'Élo, ce qui rend le couple univoque.
//      ⛔ `exercices_depots` n'a aucune colonne texte libre, et on n'en détourne
//         AUCUNE : `conditions_declarees` est un GESTE du déroulé
//         (`utils/deroule/gestes.ts:114`) et `message_lisibilite_reporte`
//         appartient au canal classe (`utils/passation/depots.ts:544`). Un
//         champ qui porte un sens n'est pas un drapeau de provenance.
//    Le registre est le confort ; la base est le filet.
//
// ⭐ EMPRUNTER ET REPOSER. Les deux examens et les six lignes de niveau EXISTENT
//    déjà : on ne les crée pas, on les MODIFIE. Leur état d'avant est relevé et
//    écrit au registre AVANT le premier geste, et reposé au retrait — `null`
//    compris. « Une recette qui remet un interrupteur en écrivant une constante
//    ne le remet pas : elle l'impose. »
//
// ⭐ LES OBSERVABLES SE DÉRIVENT DE L'INSTRUMENT, ILS NE SE RECOPIENT PAS.
//    Le script n'écrit aucun seuil en dur : il lit `instrumentDuRouteur(c)` —
//    le même que la chaîne et les écrans —, et pour chaque observable il
//    FABRIQUE une valeur qui réussit ou rate SON seuil d'aujourd'hui. Le jour où
//    une fiche change de seuil, le décor reste cohérent tout seul.
//
// ⚠️ LES INTERRUPTEURS NE SONT PAS TOUCHÉS. Ils sont mesurés au contrôle
//    d'entrée, et le script REFUSE si l'un des trois nécessaires est fermé. Un
//    décor destiné à rester à l'écran ne peut pas emprunter une porte : il la
//    rendrait fermée en partant. Le geste est celui de Louis.
//
// ── CE QU'IL NE FAIT PAS, ET C'EST DÉLIBÉRÉ ────────────────────────────────
//
// ⛔ IL N'APPELLE PAS LA CHAÎNE. Décision de Louis, 28/08 : les mesures et les
//    retours sont FABRIQUÉS. Le texte des retours est donc écrit à la main, sur
//    le gabarit d'un vrai retour de production — il a la forme et le registre
//    des vrais, il n'en est pas un. Aucun appel API, aucun coût, déterministe.
//
// ⛔ IL N'ÉCRIT AUCUN `routeur_decisions`. Nous sommes en SEGMENT 1
//    (`cycle-serveur.ts:176` : « segment 1 : HORS ROUTAGE »), et le routeur n'y
//    pose rien : en semaine de diagnostic, c'est le professeur qui donne. Les
//    dépôts portent donc `origine = 'prof'`, ce qui est le cas nominal — écrire
//    une décision de routeur au segment 1 serait un mensonge dans la donnée.
//
// ⛔ IL N'ÉCRIT AUCUN `exercices_squelettes`. `vue.ts:880-884` le dit :
//    « l'absence est le cas nominal », l'encart de langue ne s'affiche pas et
//    ce n'est pas une panne.
//
// ⛔ IL NE TOUCHE PAS À LA CLASSE « Test ». Le dépôt corrigé du 22/08, ses deux
//    mesures et sa mesure de monitoring restent où ils sont. Le contexte par
//    défaut d'Élo est T5 (`localeCompare` met « T5 » avant « Test »), et tout
//    ce qui est semé ici est sur T5.
//
// ── USAGE ──────────────────────────────────────────────────────────────────
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/decor-eleve-elo.mjs [--seme|--etat|--retire]
//
//   --seme    (défaut) sème le décor et le laisse
//   --etat    ne touche à rien : dit ce qui est en base aujourd'hui
//   --retire  retire le semé et repose l'emprunté
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

// ── CE QUE LE DÉCOR LIT AU LIEU DE LE RECOPIER ─────────────────────────────
const { instrumentDuRouteur } = await import(`${RACINE}/utils/moteur/etat-serveur.ts`)
const { lundiDuCycle } = await import(`${RACINE}/utils/deroule/echeance.ts`)
const { toISODate } = await import(`${RACINE}/utils/calendrier-grille.ts`)
const { FENETRE_EVIDENCE } = await import(`${RACINE}/utils/routeur/config.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'DECOR-ELEVE-ELO'
const PREFIXE_POINT = 'decor-eleve-elo'
const REGISTRE = 'scripts/recette/.decor-eleve-elo.json'

const a = (n) => process.argv.includes(`--${n}`)

let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (t) => console.log(`  · ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

/** ⛔ supabase-js NE LÈVE PAS : il rend `{ error }`. Ici, on lève. */
function verifie(quoi, { data, error }) {
  if (error) throw new Error(`${quoi} : ${error.message}`)
  return data
}
function ecrit(quoi, { error }) {
  if (error) throw new Error(`${quoi} : ${error.message}`)
}

// ════════════════════════════════════════════════════════════════════════════
// LES IDENTITÉS — toutes mesurées en base, aucune inventée
// ════════════════════════════════════════════════════════════════════════════

const ELO = '89662514-ea26-4cc3-9708-c228eea6d136'
const T5 = 'a5281830-356a-46b5-aa03-cc79054749bf'
const PROF = '1a85a093-f845-4b2e-97c1-2b2ce17578a3'

/** Les deux examens diagnostiques, DÉJÀ EN BASE, rattachés au plan de T5. */
const EXAM_ESSAI = 'ad5707d6-a498-4c87-82a7-e3fe6cba5160'    // Codex, écriture
const EXAM_EXPLIC = '1c273b89-f688-49bf-a238-c604f7388720'   // Aletheia, lecture

/**
 * Les quatre instances de la maison, prises dans la vague `vgen1` — les seules
 * réellement servables à Élo (matériau `cours_etat = 'generique'`, `classe_id`
 * NULL, `statut = 'concu'`). ⚠️ Elles portent toutes `composer`, donc l'atelier
 * est CODEX pour les quatre : la vague vgen1 n'a AUCUNE instance de lecture, et
 * l'onglet Exercices d'Aletheia restera donc vide. C'est l'état du réel, pas un
 * oubli.
 */
const MAISON = [
  { cle: 'E1', exercice: '8a9dcbb5-66d2-43c8-93e4-791617ff46f6', objet: 'partie', cran: 4 },
  { cle: 'E2', exercice: '1a9fd547-2a01-412d-88f6-2d3e7700f424', objet: 'introduction', cran: 4 },
  { cle: 'E3', exercice: 'a4a8399a-74f5-4e49-900a-30bbd2e1128d', objet: 'introduction', cran: 5 },
  { cle: 'E4', exercice: '4120b917-a50d-4f16-b586-ea24c409c630', objet: 'conclusion', cran: 4 },
]

// ════════════════════════════════════════════════════════════════════════════
// LE TEMPS — tout tombe dans le cycle courant, et le fuseau décide
// ════════════════════════════════════════════════════════════════════════════
//
// ⚠️⚠️ LE PIÈGE DU FUSEAU, ET IL A DÉJÀ MORDU EN BASE. `assigne_at` est LE SEUL
//    chemin vers la semaine d'un dépôt (`semaine-serveur.ts:117`), et le cycle
//    se calcule EN FUSEAU, pas en UTC : le dépôt `d1f6bc88` porte
//    `2026-08-24T00:16Z`, qui est un DIMANCHE 20 h 16 à Toronto — il tombe donc
//    dans le cycle du 17/08, une semaine trop tôt, et n'apparaît nulle part.
//    ⛔ On ne laisse JAMAIS `assigne_at` au `default now()` (leçon C4-L12), et
//       on vise le MILIEU de journée pour ne jamais frôler une bascule.

/** `YYYY-MM-DDTHH:mm:ssZ` — midi-et-quelque à Toronto (UTC-4 en août). */
const t = (jour, heureToronto = 13) =>
  `2026-08-${String(jour).padStart(2, '0')}T${String(heureToronto + 4).padStart(2, '0')}:00:00.000Z`

// ════════════════════════════════════════════════════════════════════════════
// LES OBSERVABLES — dérivés de l'instrument, jamais recopiés
// ════════════════════════════════════════════════════════════════════════════

/** Le seuil que la fiche déclare aujourd'hui (patron de `observables.ts`). */
function seuilDe(entree, parametres) {
  if (entree.seuil !== undefined) return entree.seuil
  if (entree.seuil_parametre !== undefined) return parametres[entree.seuil_parametre]
  return undefined
}

/**
 * ⭐ Une valeur qui RÉUSSIT (ou RATE) le seuil de cet observable-là, aujourd'hui.
 *
 * C'est l'inverse de `statutDeLaMesure` : au lieu de lire un verdict depuis une
 * valeur, on fabrique une valeur depuis un verdict voulu. Aucun seuil n'est
 * écrit ici — ils sont tous lus de l'instrument.
 */
function valeurPour(entree, parametres, reussir) {
  if (entree.reussie === 'sans_objet') return 'n/a'

  // Un binaire n'a pas de seuil : il vaut ce que la fiche nomme, ou autre chose.
  if (entree.reussie === 'vaut') {
    const att = entree.valeur_reussie
    const attendue = Array.isArray(att) ? att[0] : att
    if (reussir) return attendue
    const echelle = entree.echelle ?? []
    const autre = echelle.find((v) => (Array.isArray(att) ? !att.includes(v) : v !== att))
    if (autre !== undefined) return autre
    if (typeof attendue === 'boolean') return !attendue
    return attendue === 'oui' ? 'non' : 'oui'
  }

  const seuil = seuilDe(entree, parametres)
  if (seuil === undefined) return 'n/a'

  // Ordinal : on raisonne en RANGS dans l'échelle, jamais sur la valeur.
  const echelle = entree.echelle
  if (Array.isArray(echelle) && echelle.length > 0) {
    const rs = echelle.indexOf(seuil)
    if (rs < 0) return 'n/a'
    const vise = {
      au_moins: reussir ? rs : rs - 1,
      au_plus: reussir ? rs : rs + 1,
      plus_de: reussir ? rs + 1 : rs,
      moins_de: reussir ? rs - 1 : rs,
    }[entree.reussie]
    if (vise === undefined) return 'n/a'
    return echelle[Math.min(echelle.length - 1, Math.max(0, vise))]
  }

  if (typeof seuil !== 'number') return 'n/a'
  const borne = (entree.famille === 'proportion' || entree.famille === 'comptage rapporté')
  const pas = borne ? 0.2 : 1
  const net = (x) => {
    const v = borne ? Math.min(1, Math.max(0, x)) : Math.max(0, x)
    return Math.round(v * 10000) / 10000
  }
  switch (entree.reussie) {
    case 'au_moins': return reussir ? net(seuil + pas / 2) : net(seuil - pas)
    case 'au_plus': return reussir ? net(seuil) : net(seuil + pas)
    case 'plus_de': return reussir ? net(seuil + pas / 2) : net(seuil)
    case 'moins_de': return reussir ? net(seuil - pas / 2) : net(seuil)
    default: return 'n/a'
  }
}

/**
 * Le volet `observables` d'une mesure : une entrée par observable déclaré —
 * « aucun trou silencieux » (`observables.ts`).
 *
 * @param competence    la compétence mesurée
 * @param partReussie   la part d'observables réussis, entre 0 et 1
 * @param forces        des codes qu'on veut réussis quoi qu'il arrive
 * @param faiblesses    des codes qu'on veut ratés quoi qu'il arrive
 */
function observablesDe(competence, partReussie, forces = [], faiblesses = []) {
  const instrument = instrumentDuRouteur(competence)
  if (!instrument) return null
  const codes = Object.keys(instrument.observablesMesure)
  const sortie = {}
  codes.forEach((code, i) => {
    const entree = instrument.observablesMesure[code]
    let reussir
    if (forces.includes(code)) reussir = true
    else if (faiblesses.includes(code)) reussir = false
    // Déterministe et réparti : pas de `Math.random`, le décor doit se rejouer.
    else reussir = ((i + 1) / codes.length) <= partReussie
    sortie[code] = valeurPour(entree, instrument.parametres, reussir)
  })
  return sortie
}

// ════════════════════════════════════════════════════════════════════════════
// LE MATÉRIAU D'ÉCRAN — copies, retours, commentaires
// ════════════════════════════════════════════════════════════════════════════
//
// ⚠️ Ces textes sont ÉCRITS À LA MAIN sur le gabarit d'un vrai retour de
//    production : ils en ont la forme (`PointRetour`) et le registre, ils n'en
//    sont pas. Aucun n'est sorti d'un modèle.

const COPIE_ESSAI = `Est-ce une bonne chose de devoir suivre un cours de philosophie ?

On peut se demander si le cours de philosophie sert vraiment à quelque chose. Beaucoup d'élèves disent que c'est inutile et qu'on ferait mieux d'avoir plus de maths. Mais je pense que c'est quand même une bonne chose.

D'abord, la philosophie apprend à réfléchir. Quand on lit un texte de Descartes ou de Platon, on voit que les questions qu'ils se posent sont encore les nôtres aujourd'hui. Par exemple la question de savoir si on peut être sûr de quelque chose. Cela nous apprend à ne pas croire tout ce qu'on nous dit, ce qui est très important avec les réseaux sociaux et les fake news.

Ensuite, la philosophie permet de mieux s'exprimer. En dissertation on apprend à construire un raisonnement, à donner des arguments, à répondre aux objections. C'est utile pour plus tard, dans le travail et dans la vie en général.

Cependant on peut objecter que le cours est obligatoire, et que quelque chose d'obligatoire ne peut pas vraiment être une réflexion libre. Si on est forcé de réfléchir, est-ce qu'on réfléchit vraiment ? C'est vrai que le programme et les notes créent une pression. Mais sans obligation, beaucoup d'élèves n'y viendraient jamais, et ils ne sauraient pas ce qu'ils manquent.

Pour conclure, je pense que le cours de philosophie est une bonne chose parce qu'il apprend à penser par soi-même, même si le fait qu'il soit obligatoire pose un petit problème.`

const COPIE_EXPLIC = `Dans ce texte, Descartes cherche à savoir ce qu'il est vraiment. Il vient de douter de tout, même de son corps, et il se demande ce qui reste.

Il dit d'abord qu'il ne peut pas être sûr d'avoir un corps, parce que peut-être qu'un mauvais génie le trompe. Mais même si on le trompe, il faut bien qu'il existe pour être trompé. Donc il existe.

Ensuite il se demande ce qu'il est. Il répond qu'il est une chose qui pense. C'est-à-dire une chose qui doute, qui comprend, qui veut, qui imagine aussi et qui sent.

Ce passage est important parce que c'est le premier point fixe que Descartes trouve après avoir tout remis en question. Le doute lui servait à trouver quelque chose de certain, et il l'a trouvé dans la pensée elle-même. On ne peut pas douter qu'on doute.`

const COMMENTAIRE_ESSAI =
  'Ta copie tient debout du début à la fin, et l\'objection du quatrième paragraphe est un vrai geste — '
  + 'tu ne l\'as pas posée pour la forme. Ce qui te coûte le plus, c\'est le vocabulaire : plusieurs mots '
  + 'sont employés dans un sens approchant. On reprend ça ensemble.'

const COMMENTAIRE_EXPLIC =
  'Tu as bien suivi le fil de l\'argument, et tu n\'as rien inventé qui ne soit dans le texte — c\'est le '
  + 'plus difficile. Il manque encore le détail des lignes : tu résumes là où on attend que tu expliques.'

// ════════════════════════════════════════════════════════════════════════════
// LE PLAN DU DÉCOR — ce qui est semé, dans l'ordre du temps
// ════════════════════════════════════════════════════════════════════════════
//
// ⭐ L'ORDRE DES MESURES D'EXPRESSION EST CALCULÉ, PAS DÉCORATIF. Pour que le
//    profil dise « en progrès », `progressionALaLecture` compare deux fenêtres
//    et exige la fenêtre PLEINE (4). Sur `attache_presente` :
//      m1 raté · m2 réussi · m3 réussi · m4 réussi
//    → avant (m1,m2,m3) = 2/3, et 2/3 n'est PAS > 2/3 : non acquis
//    → après (m1..m4)   = 3/4 > 2/3 : acquis      ⇒ il y a progression.
//    ⚠️ « Dépasse : strictement » (`observables.ts:estAcquis`) — c'est ce
//       strictement qui fait tout, et c'est pour ça que m1 doit rater.

const FORCE_EXPRESSION = 'attache_presente'

/** Les cinq mesures d'expression, dans l'ordre chronologique voulu. */
const CHRONO_EXPRESSION = [
  { quand: t(26, 10), reussir: false }, // E4, la conclusion faite à la maison
  { quand: t(26, 14), reussir: true },  // l'explication de texte, en classe
  { quand: t(27, 11), reussir: true },  // E1, la partie faite à la maison
  { quand: t(28, 15), reussir: true },  // l'essai, en classe — la plus récente
]

// ════════════════════════════════════════════════════════════════════════════
// LE CONTRÔLE D'ENTRÉE — on mesure, on ne recopie pas
// ════════════════════════════════════════════════════════════════════════════

async function controleDEntree() {
  titre('A. le contrôle d\'entrée — tout est mesuré')

  const profil = verifie('profil d\'Élo', await admin.from('profiles')
    .select('id, role, display_name, competences_lettres_affichees, fiches_competences_servies_at')
    .eq('id', ELO).maybeSingle())
  if (!profil) throw new Error(`Élo (${ELO}) est introuvable dans \`profiles\`.`)
  if (profil.role !== 'eleve') throw new Error(`Élo porte le rôle « ${profil.role} », pas « eleve ».`)
  dire(true, `Élo est là : « ${profil.display_name} », rôle ${profil.role}`)

  const insc = verifie('inscription T5', await admin.from('inscriptions')
    .select('id, statut').eq('eleve_id', ELO).eq('classe_id', T5).maybeSingle())
  if (!insc || insc.statut !== 'active') {
    throw new Error('Élo n\'est pas inscrite ACTIVE en T5 — condition de reprise : la réinscrire.')
  }
  dire(true, 'Élo est inscrite active en T5')

  // ⚠️ L'ALLUMAGE SE MESURE, IL NE SE RECOPIE PAS — et il bouge entre deux
  //    séances. On REFUSE plutôt que d'emprunter : un décor d'écran qui
  //    emprunterait une porte la rendrait fermée en partant.
  const portes = verifie('portes', await admin.from('scriptorium_params')
    .select('exercices_actif, passation_classe_actif, competences_affichage_actif, plan_evaluation_actif')
    .eq('id', 1).maybeSingle())
  const requises = ['exercices_actif', 'passation_classe_actif', 'competences_affichage_actif']
  const fermees = requises.filter((p) => !portes?.[p])
  if (fermees.length) {
    throw new Error(`porte(s) fermée(s) : ${fermees.join(', ')}. `
      + 'Ce script ne touche AUCUN interrupteur — le geste est le tien. '
      + 'Condition de reprise : les rallumer, puis rejouer.')
  }
  dire(true, `les trois portes nécessaires sont ouvertes (${requises.join(' · ')})`)

  // Le cycle courant, calculé par le code de la maison, jamais à la main.
  const fuseauLigne = verifie('fuseau', await admin.from('calendrier_params')
    .select('fuseau').eq('id', 1).maybeSingle())
  const fuseau = fuseauLigne?.fuseau ?? 'America/Toronto'
  const cycle = toISODate(lundiDuCycle(new Date(), fuseau))
  dire(true, `fuseau « ${fuseau} » · cycle courant ${cycle}`)

  // Toutes les dates semées doivent tomber dans ce cycle-là.
  const dansLeCycle = [t(24), t(26), t(27), t(28)]
    .every((x) => toISODate(lundiDuCycle(new Date(x), fuseau)) === cycle)
  if (!dansLeCycle) {
    throw new Error(`les dates du décor ne tombent plus dans le cycle courant (${cycle}). `
      + 'Condition de reprise : décaler les constantes `t(…)` sur la semaine en cours.')
  }
  dire(true, 'les quatre dates du décor tombent bien dans le cycle courant')

  // ⭐ LA BORNE DE RECETTE : une mesure ANTÉRIEURE au statut ne compte pas
  //    (`mesuresQuiComptent`). C'est ce qui rend muettes les deux mesures
  //    d'Élo du 23/08 — et ce qui rendrait muet tout ce décor s'il était semé
  //    trop tôt.
  const statuts = verifie('statuts de recette', await admin.from('competences_statut_recette')
    .select('competence, statut_recette, statut_recette_pose_le'))
  const evaluees = (statuts ?? []).filter((s) => s.statut_recette === 'evaluee')
  const bornes = new Map(evaluees.map((s) => [s.competence, s.statut_recette_pose_le]))
  const tropTot = [...bornes.entries()]
    .filter(([, borne]) => borne && new Date(borne) >= new Date(t(24)))
    .map(([c]) => c)
  if (tropTot.length) {
    throw new Error(`la borne de recette de ${tropTot.join(', ')} est postérieure au décor : `
      + 'ses mesures ne compteraient pas. Condition de reprise : décaler les dates.')
  }
  dire(evaluees.length === 6, `${evaluees.length}/6 compétences « evaluee », bornes antérieures au décor`)

  // Les six instruments doivent être ouverts, sinon aucun observable ne se dérive.
  const sansInstrument = ['expression', 'argumentation', 'structure',
    'connaissance', 'synthese', 'questionnement'].filter((c) => !instrumentDuRouteur(c))
  if (sansInstrument.length) {
    throw new Error(`instrument non ouvert pour : ${sansInstrument.join(', ')}.`)
  }
  dire(true, 'les six instruments sont ouverts et dérivent leurs observables')

  // Les deux examens, et leur ligne de plan `evaluatif` — c'est elle qui fait
  // l'ancre (`formeDepuisLePlan`), et sans ancre il n'y a aucune lettre.
  const examens = verifie('examens', await admin.from('exercices_depots')
    .select('id, statut, exercice_id, exercices!inner(lieu, exercice_planifie_id)')
    .in('id', [EXAM_ESSAI, EXAM_EXPLIC]))
  if ((examens ?? []).length !== 2) {
    throw new Error('les deux dépôts d\'examen diagnostique ne sont plus en base.')
  }
  for (const e of examens) {
    if (e.exercices.lieu !== 'classe') throw new Error(`l'examen ${e.id} n'est plus en classe.`)
    if (!e.exercices.exercice_planifie_id) {
      throw new Error(`l'examen ${e.id} a perdu sa ligne de plan : sans elle, la mesure serait `
        + '`formatif`, donc pas une ancre, donc aucune lettre.')
    }
  }
  dire(true, 'les deux examens sont là, en classe, rattachés à leur ligne de plan')

  const plans = verifie('lignes de plan', await admin.from('scriptorium_exercices_planifies')
    .select('id, nature, type_exercice, module')
    .in('id', examens.map((e) => e.exercices.exercice_planifie_id)))
  const nonEvaluatif = (plans ?? []).filter((p) => p.nature !== 'evaluatif')
  if (nonEvaluatif.length) {
    throw new Error(`ligne(s) de plan non « evaluatif » : ${nonEvaluatif.map((p) => p.id).join(', ')}.`)
  }
  dire(true, `les deux lignes de plan sont « evaluatif » (${plans.map((p) => p.module).join(' · ')})`)

  // Les quatre instances de la maison sont-elles toujours servables ?
  const instances = verifie('instances maison', await admin.from('exercices')
    .select('id, statut, lieu, classe_id, cran, modes_par_competence')
    .in('id', MAISON.map((m) => m.exercice)))
  if ((instances ?? []).length !== MAISON.length) {
    throw new Error('une ou plusieurs instances de la maison ont disparu de la banque.')
  }
  for (const i of instances) {
    if (i.lieu !== 'maison' || i.statut !== 'concu') {
      throw new Error(`l'instance ${i.id} n'est plus « concu »/« maison ».`)
    }
  }
  dire(true, `les ${MAISON.length} instances de la maison sont conçues et servables`)

  // ⚠️ `uk_depots_eleve_exercice` : un seul dépôt par (élève, instance).
  const dejaLa = verifie('dépôts existants', await admin.from('exercices_depots')
    .select('id, exercice_id').eq('eleve_id', ELO))
  const collision = (dejaLa ?? []).filter((d) => MAISON.some((m) => m.exercice === d.exercice_id))
  if (collision.length) {
    throw new Error(`Élo a déjà un dépôt sur ${collision.length} des instances visées `
      + `(${collision.map((d) => d.id).join(', ')}) — \`uk_depots_eleve_exercice\` refuserait. `
      + 'Condition de reprise : `--retire` d\'abord.')
  }
  dire(true, 'aucune collision de dépôt sur les instances visées')

  return { profil, fuseau, cycle, bornes, examens, plans }
}

// ════════════════════════════════════════════════════════════════════════════
// EMPRUNTER — relever l'état d'avant, et l'écrire AVANT le premier geste
// ════════════════════════════════════════════════════════════════════════════

async function emprunter(entree) {
  titre('B. emprunter — l\'état d\'avant, relevé et écrit au registre')

  const registre = { marque: MARQUE, seme_le: new Date().toISOString(), cycle: entree.cycle }

  // Les deux examens, colonne par colonne : on les MODIFIE, on ne les crée pas.
  const avant = verifie('examens avant', await admin.from('exercices_depots')
    .select('*').in('id', [EXAM_ESSAI, EXAM_EXPLIC]))
  registre.examens = avant
  dire(avant.length === 2, `${avant.length} dépôt(s) d'examen relevés en entier`)

  const niveaux = verifie('niveaux avant', await admin.from('competences_niveaux')
    .select('*').eq('eleve_id', ELO))
  registre.niveaux = niveaux ?? []
  dire(true, `${registre.niveaux.length} ligne(s) de \`competences_niveaux\` relevée(s)`)

  registre.profil = {
    competences_lettres_affichees: entree.profil.competences_lettres_affichees,
    fiches_competences_servies_at: entree.profil.fiches_competences_servies_at,
  }
  dire(true, 'les deux colonnes de `profiles` relevées '
    + `(lettres : ${JSON.stringify(entree.profil.competences_lettres_affichees)})`)

  // Le filet du filet : ce qui existait AVANT, pour ne jamais l'emporter.
  const depots = verifie('dépôts avant', await admin.from('exercices_depots')
    .select('id').eq('eleve_id', ELO))
  registre.depots_avant = (depots ?? []).map((d) => d.id)
  const mesures = verifie('mesures avant', await admin.from('competences_mesures')
    .select('id').eq('eleve_id', ELO))
  registre.mesures_avant = (mesures ?? []).map((m) => m.id)
  dire(true, `garde : ${registre.depots_avant.length} dépôt(s) et `
    + `${registre.mesures_avant.length} mesure(s) préexistants, jamais touchés`)

  registre.semes = { depots: [], retours: [], jobs: [], mesures: [] }
  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))
  dire(true, `registre écrit : ${REGISTRE}`)
  return registre
}

/** Le registre s'écrit APRÈS CHAQUE INSERT — pas à la fin (leçon du SIGPIPE). */
function noter(registre, quoi, id) {
  registre.semes[quoi].push(id)
  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))
}

// ════════════════════════════════════════════════════════════════════════════
// SEMER ① — les deux examens diagnostiques, jusqu'au retour publié
// ════════════════════════════════════════════════════════════════════════════

/** Une page de copie manuscrite, à la forme que `photos_bien_formees` impose. */
const photo = (depotId, n) => ({
  ordre: n,
  chemin: `passation/${ELO}/${depotId}/${String(n).padStart(2, '0')}.jpg`,
  rotation: 0,
  page_manquante: false,
  somme_controle: `${MARQUE}:${depotId}:${n}`,
})

/**
 * Un point de retour, à la forme que `retour_segmente_bien_forme` impose.
 * ⭐ L'`id` porte la MARQUE : c'est un des trois domiciles en base.
 */
const point = (cle, n, competence, nature, texte, citation) => ({
  id: `${PREFIXE_POINT}:${cle}:${String(n).padStart(2, '0')}`,
  texte,
  nature,
  ancrage: { source: 'copie', citation },
  competence,
})

async function semerLesExamens(registre) {
  titre('C. les deux examens diagnostiques — jusqu\'au retour publié')

  // ⛔ AUCUN CHAMP `*_vf` NI `statut = 'vf_remis'` : le trigger
  //    `garde_depot_lieu()` REFUSE tout cela sur `lieu = 'classe'` — « en
  //    classe, la séquence s'arrête à retour_publie ».

  // ── L'explication de texte (Aletheia), passée le mardi ──────────────────
  ecrit('examen explication', await admin.from('exercices_depots').update({
    statut: 'retour_publie',
    photos_v1: [photo(EXAM_EXPLIC, 1)],
    transcription_v1: COPIE_EXPLIC,
    confiance_ocr_v1: 0.94,
    confiance_declaree: { expression: 'moyenne', synthese: 'faible' },
    juger_debut_at: t(25, 11),
    juger_fin_at: t(25, 11),
    v1_remis_at: t(25, 11),
    corrige_par: PROF,
    corrige_at: t(26, 14),
    commentaire_general: COMMENTAIRE_EXPLIC,
  }).eq('id', EXAM_EXPLIC))
  dire(true, 'explication de texte → `retour_publie`, copie + transcription posées')

  // ── L'essai (Codex), passé le vendredi — le plus récent ─────────────────
  ecrit('examen essai', await admin.from('exercices_depots').update({
    statut: 'retour_publie',
    photos_v1: [photo(EXAM_ESSAI, 1), photo(EXAM_ESSAI, 2)],
    transcription_v1: COPIE_ESSAI,
    confiance_ocr_v1: 0.91,
    confiance_declaree: { structure: 'moyenne', expression: 'faible', argumentation: 'moyenne' },
    juger_debut_at: t(28, 10),
    juger_fin_at: t(28, 10),
    v1_remis_at: t(28, 10),
    corrige_par: PROF,
    corrige_at: t(28, 15),
    commentaire_general: COMMENTAIRE_ESSAI,
  }).eq('id', EXAM_ESSAI))
  dire(true, 'essai → `retour_publie`, copie sur deux pages posée')

  // ── Les jobs de la chaîne, aboutis ──────────────────────────────────────
  // ⚠️ `cle_idempotence` est UNIQUE et porte la MARQUE : deuxième domicile.
  for (const [depotId, cle] of [[EXAM_EXPLIC, 'explic'], [EXAM_ESSAI, 'essai']]) {
    for (const etape of ['transcription_v1', 'mesure_v1']) {
      const j = verifie(`job ${etape}`, await admin.from('exercices_jobs').insert({
        depot_id: depotId,
        etape,
        statut: 'abouti',
        tentatives: 1,
        cle_idempotence: `${MARQUE}:${cle}:${etape}`,
        dernier_message: `${MARQUE} — décor d'écran, aucun appel réel.`,
      }).select('id').single())
      noter(registre, 'jobs', j.id)
    }
  }
  dire(true, '4 jobs `abouti` posés (transcription + mesure, pour les deux)')

  // ── Les deux retours, dont UN NON LU ────────────────────────────────────
  // ⭐ L'explication est LUE, l'essai NE L'EST PAS : c'est ce qui allume la
  //    tuile « retour à lire » du tableau de bord, et l'état `a_lire` de la
  //    liste. On veut les DEUX états à l'écran.
  // ⛔ `texte_edite_par_prof` reste NULL : le renseigner MASQUERAIT le texte de
  //    la chaîne (`pointsAAfficher = texte_edite_par_prof ?? texte`).

  const pointsExplic = [
    point('explic', 1, 'synthese', 'reussite',
      'Tu suis le fil de l\'argument sans jamais ajouter ce qui n\'y est pas — c\'est exactement '
      + 'ce qu\'on demande dans une explication, et c\'est le plus difficile.',
      'Mais même si on le trompe, il faut bien qu\'il existe pour être trompé.'),
    point('explic', 2, 'synthese', 'point_de_travail',
      'Ton dernier paragraphe dit ce que le texte fait, mais pas comment il le fait. Reprends la '
      + 'phrase « une chose qui pense » et montre, mot à mot, ce que Descartes range dedans.',
      'Il répond qu\'il est une chose qui pense.'),
    point('explic', 3, 'expression', 'point_de_travail',
      'Tu écris « point fixe » sans l\'expliquer, alors que c\'est toi qui l\'introduis. Quand un mot '
      + 'n\'est pas dans le texte, c\'est à toi de dire ce qu\'il veut dire.',
      'c\'est le premier point fixe que Descartes trouve'),
  ]
  const rExplic = verifie('retour explication', await admin.from('exercices_retours').insert({
    depot_id: EXAM_EXPLIC,
    moment: 'chaud',
    texte: pointsExplic,
    points_ids: pointsExplic.map((p) => p.id),
    action_revision: {
      texte: 'Reprends le troisième paragraphe et écris, en deux phrases, ce que Descartes range '
        + 'sous le mot « penser » — en citant les mots du texte.',
    },
    registre_servi: 'descriptif',
    published_at: t(26, 14),
    lu_at: t(26, 18),
  }).select('id').single())
  noter(registre, 'retours', rExplic.id)
  dire(true, 'retour de l\'explication : publié ET LU (3 points)')

  const pointsEssai = [
    point('essai', 1, 'argumentation', 'reussite',
      'Tu poses une vraie objection au quatrième paragraphe, et tu y réponds — tu ne la mets pas '
      + 'là pour la forme. C\'est le geste le plus solide de ta copie.',
      'Si on est forcé de réfléchir, est-ce qu\'on réfléchit vraiment ?'),
    point('essai', 2, 'structure', 'point_de_travail',
      'Tes trois premiers paragraphes s\'enchaînent par « D\'abord », « Ensuite » : ce sont des '
      + 'étiquettes, pas des liens. Dis pourquoi le second argument vient APRÈS le premier.',
      'Ensuite, la philosophie permet de mieux s\'exprimer.'),
    point('essai', 3, 'expression', 'point_de_travail',
      'Le mot « réflexion » sert trois fois pour trois choses différentes. Choisis à chaque fois '
      + 'le mot exact — « examen », « doute », « raisonnement ».',
      'quelque chose d\'obligatoire ne peut pas vraiment être une réflexion libre'),
    point('essai', 4, 'argumentation', 'point_de_travail',
      'Tu affirmes que sans obligation « beaucoup d\'élèves n\'y viendraient jamais » sans rien qui '
      + 'l\'appuie. Une raison a besoin de son garant.',
      'sans obligation, beaucoup d\'élèves n\'y viendraient jamais'),
  ]
  const rEssai = verifie('retour essai', await admin.from('exercices_retours').insert({
    depot_id: EXAM_ESSAI,
    moment: 'chaud',
    texte: pointsEssai,
    points_ids: pointsEssai.map((p) => p.id),
    action_revision: {
      texte: 'Reprends la charnière entre ton deuxième et ton troisième paragraphe, et écris en une '
        + 'phrase la raison qui fait que le second argument vient après le premier.',
    },
    registre_servi: 'descriptif',
    published_at: t(28, 15),
    lu_at: null,
  }).select('id').single())
  noter(registre, 'retours', rEssai.id)
  dire(true, 'retour de l\'essai : publié et NON LU (4 points) — c\'est lui qui allume la tuile')
}

// ════════════════════════════════════════════════════════════════════════════
// SEMER ② — les premiers exercices de la maison, dans quatre états
// ════════════════════════════════════════════════════════════════════════════

// ⭐⭐ LES QUATRE ÉTATS, ET CE QUI LES SÉPARE VRAIMENT (`etatDeLExercice`,
//    `utils/codex-onglets/regles.ts:169`) :
//      · `assigne`       → `a_faire`  « à faire »
//      · `ouvert`        → `en_cours` « commencé »
//      · `retour_publie` → `a_lire`   « retour à lire »
//      · `clos`          → `clos`     « terminé »
//
// ⛔⛔ ET LE PIÈGE QUI M'A MORDU : `lu_at` NE SUFFIT PAS À CLORE. La lecture ne
//    passe devant le statut que dans un sens — `if (retour.publie && !retour.lu)
//    return 'a_lire'` — et un dépôt resté `retour_publie` retombe sur le `case`,
//    qui rend `a_lire` LUI AUSSI. Poser `lu_at` sans avancer le statut fabrique
//    donc un état que l'application ne distingue pas du précédent, et la frise
//    compte « 0 fait sur 4 » là où l'élève en a rendu deux.
//    ⭐ Ce que fait le vrai geste : `validerLaLecture`
//       (`utils/deroule/contestation.ts:157-190`) pose `lu_at` PUIS `statut =
//       'clos'` — « si le régime le dit ». Le cran 4 de E4 déclare
//       `regime_v1vf = 'par paires'`, donc PAS `plein`, donc c'est le retour
//       CHAUD qui clôt, et il n'y a aucune version finale à attendre. `clos`
//       sans `vf` est ici l'état juste, pas un raccourci.
const ETAT_MAISON = {
  E1: { statut: 'retour_publie', ouvert: t(27, 9), remis: t(27, 11), retour: { publie: t(27, 14), lu: null } },
  E2: { statut: 'ouvert', ouvert: t(28, 9), remis: null, retour: null },
  E3: { statut: 'assigne', ouvert: null, remis: null, retour: null },
  E4: { statut: 'clos', ouvert: t(25, 9), remis: t(25, 10), retour: { publie: t(26, 10), lu: t(26, 12) } },
}

const BROUILLON_E2 =
  'L\'introduction doit poser le problème. Ici le sujet demande si un robot peut faire un bon '
  + 'professeur. Il faut d\'abord se demander ce qu\'on attend d\'un professeur, parce que si on '
  + 'attend seulement qu\'il transmette des connaissances, alors'

const COPIE_E1 =
  'La partie prend le sujet tel qu\'il est donné et y répond tout de suite. Mais le mot « limiter » '
  + 'n\'a pas qu\'un sens : on peut plafonner le nombre de vols par personne, ou bien augmenter le '
  + 'prix du billet. Ce n\'est pas la même chose, parce que la première mesure vaut pour tout le '
  + 'monde et la seconde n\'arrête que ceux qui n\'ont pas d\'argent. Il fallait donc commencer par '
  + 'demander de quelle limitation on parle avant de répondre.'

const COPIE_E4 =
  'Pour conclure, l\'uniforme ne règle pas le problème des inégalités, il le rend seulement moins '
  + 'visible. On a vu que les différences réapparaissent ailleurs, dans les chaussures ou le '
  + 'téléphone. Mais rendre une inégalité moins visible n\'est peut-être pas rien : reste à savoir '
  + 'si c\'est ce qu\'on demande à l\'école.'

const PRODUCTION = { E1: COPIE_E1, E2: BROUILLON_E2, E4: COPIE_E4 }

async function semerLaMaison(registre) {
  titre('D. les premiers exercices de la maison — quatre états, un par ligne')

  const parCle = {}
  for (const m of MAISON) {
    const e = ETAT_MAISON[m.cle]
    const ligne = {
      eleve_id: ELO,
      exercice_id: m.exercice,
      // ⛔ SEGMENT 1 = HORS ROUTAGE : c'est le professeur qui donne, et
      //    `routeur_decision_id` reste NULL. Écrire une décision de routeur
      //    ici serait un mensonge dans la donnée.
      origine: 'prof',
      routeur_decision_id: null,
      // ⚠️ JAMAIS le `default now()` : `assigne_at` EST le chemin vers la semaine.
      assigne_at: t(24, 9),
      echeance: t(30, 20),
      statut: e.statut,
      ouvert_at: e.ouvert,
      v1_remis_at: e.remis,
      texte_v1: PRODUCTION[m.cle] ?? null,
      duree_taguee: m.cran <= 3 ? 'courte' : 'moyenne',
      conditions_declarees: e.remis ? { valeur: 'temps_mis', at: e.remis } : null,
      confiance_declaree: e.remis ? { structure: 'moyenne' } : null,
    }
    const d = verifie(`dépôt ${m.cle}`, await admin.from('exercices_depots')
      .insert(ligne).select('id').single())
    noter(registre, 'depots', d.id)
    parCle[m.cle] = d.id
    note(`${m.cle} · ${m.objet} cran ${m.cran} → ${e.statut}`)
  }
  dire(true, `${MAISON.length} dépôts de la maison posés sur le cycle courant`)

  // ── Les retours de la maison ────────────────────────────────────────────
  // ⛔ `texte_edite_par_prof` DOIT rester NULL : le trigger
  //    `garde_retour_maison_non_edite()` REFUSE toute édition sur un retour de
  //    la maison — « l'édition appartient au flux de classe ».
  const retoursMaison = {
    E1: {
      points: [
        point('e1', 1, 'questionnement', 'reussite',
          'Tu as vu que « limiter » cachait deux mesures différentes, et tu l\'as montré en les '
          + 'nommant toutes les deux. C\'est exactement le geste attendu.',
          'on peut plafonner le nombre de vols par personne, ou bien augmenter le prix du billet'),
        point('e1', 2, 'argumentation', 'point_de_travail',
          'Tu dis que la seconde mesure « n\'arrête que ceux qui n\'ont pas d\'argent » — c\'est '
          + 'juste, mais tu ne dis pas au nom de quoi c\'est un problème. Nomme la raison.',
          'la seconde n\'arrête que ceux qui n\'ont pas d\'argent'),
        point('e1', 3, 'connaissance', 'point_de_travail',
          'Rien dans ta réponse ne vient du cours. Une distinction vue en classe t\'aurait donné '
          + 'le mot juste pour séparer ces deux mesures.',
          'Ce n\'est pas la même chose'),
      ],
      revision: 'Reprends ta troisième phrase et ajoute, après « pas d\'argent », la raison qui fait '
        + 'de cette différence une injustice.',
    },
    E4: {
      points: [
        point('e4', 1, 'structure', 'reussite',
          'Ta conclusion ne répète pas le développement : elle en tire quelque chose. La dernière '
          + 'phrase rouvre même la question, et c\'est bien vu.',
          'reste à savoir si c\'est ce qu\'on demande à l\'école'),
        point('e4', 2, 'expression', 'point_de_travail',
          '« Ce n\'est peut-être pas rien » dit deux fois la même chose en creux. Dis-le une fois, '
          + 'en positif.',
          'n\'est peut-être pas rien'),
      ],
      revision: 'Réécris ton avant-dernière phrase en affirmant ce que l\'uniforme fait, au lieu de '
        + 'dire ce qu\'il n\'est pas.',
    },
  }

  for (const [cle, r] of Object.entries(retoursMaison)) {
    const e = ETAT_MAISON[cle]
    const ligne = verifie(`retour ${cle}`, await admin.from('exercices_retours').insert({
      depot_id: parCle[cle],
      moment: 'chaud',
      texte: r.points,
      points_ids: r.points.map((p) => p.id),
      action_revision: { texte: r.revision },
      registre_servi: 'descriptif',
      published_at: e.retour.publie,
      lu_at: e.retour.lu,
    }).select('id').single())
    noter(registre, 'retours', ligne.id)
  }
  dire(true, 'retours de la maison : E1 publié NON LU (`a_lire`) · E4 publié et LU (`clos`)')

  return parCle
}

// ════════════════════════════════════════════════════════════════════════════
// SEMER ③ — les mesures : cinq ancres en classe, huit formatives à la maison
// ════════════════════════════════════════════════════════════════════════════
//
// ⭐⭐ CE QUI FAIT UNE ANCRE, ET DONC UNE LETTRE : `lieu = 'classe'` ET
//    `forme = 'sommatif'` (`utils/routeur/mesure.ts:83` : `estUneAncre`). Et
//    `sommatif` vient de la ligne de plan `nature = 'evaluatif'`
//    (`formeDepuisLePlan`). Les deux examens l'ont ; les exercices de la maison
//    ne l'ont pas, et leurs mesures sont donc `formatif` — ce qui est juste.

async function semerLesMesures(registre, parCle) {
  titre('E. les mesures — les ancres d\'abord, les formatives ensuite')

  const lignes = []
  let iExpression = 0

  /** Une mesure, avec ses observables DÉRIVÉS de l'instrument du jour. */
  const mesure = (competence, mode, lieu, forme, lettre, depotId, quand, part, forces, faiblesses) => {
    const observables = observablesDe(competence, part, forces, faiblesses)
    if (!observables) throw new Error(`instrument fermé pour ${competence}`)
    return {
      eleve_id: ELO,
      competence,
      modes: [mode],
      lettre_equivalente: lettre,
      observables,
      lieu,
      forme,
      classe_id: T5,
      sonde_montee: false,
      depot_id: depotId,
      bonus: false,
      // ⭐ LA MARQUE EN BASE — premier domicile, et celui qui rend les dépôts
      //    retrouvables même sans registre.
      instrument_version: MARQUE,
      mesure_at: quand,
    }
  }

  /** L'expression suit sa chronologie calculée (voir CHRONO_EXPRESSION). */
  const expression = (lieu, forme, lettre, depotId, part) => {
    const pas = CHRONO_EXPRESSION[iExpression]
    iExpression += 1
    return mesure('expression', 'composer', lieu, forme, lettre, depotId, pas.quand, part,
      pas.reussir ? [FORCE_EXPRESSION] : [], pas.reussir ? [] : [FORCE_EXPRESSION])
  }

  // ── m1 : E4, la conclusion faite à la maison (mardi) ────────────────────
  lignes.push(expression('maison', 'formatif', 'D', parCle.E4, 0.45))
  lignes.push(mesure('structure', 'composer', 'maison', 'formatif', 'C', parCle.E4, t(26, 10), 0.7,
    ['bloc_unite'], []))
  lignes.push(mesure('questionnement', 'composer', 'maison', 'formatif', 'D', parCle.E4, t(26, 10), 0.4,
    [], ['question_specifique']))

  // ── m2 : l'explication de texte, EN CLASSE — deux ancres ────────────────
  // ⚠️ LA PORTE DE MODE écarte `structure` et `argumentation` de l'explication :
  //    leurs instruments ne couvrent que « composer », et l'examen les demande
  //    en « expliquer » (`modeNonCouvert`). Deux mesures, pas quatre — c'est ce
  //    que la chaîne réelle aurait fait, et le message de prod le dit mot pour
  //    mot.
  lignes.push(expression('classe', 'sommatif', 'D', EXAM_EXPLIC, 0.5))
  lignes.push(mesure('synthese', 'restituer', 'classe', 'sommatif', 'D', EXAM_EXPLIC, t(26, 14), 0.45,
    ['mobilisation_reliee'], ['apport_organisateur']))

  // ── m3 : E1, la partie faite à la maison (jeudi) ────────────────────────
  lignes.push(expression('maison', 'formatif', 'C', parCle.E1, 0.6))
  lignes.push(mesure('questionnement', 'composer', 'maison', 'formatif', 'C', parCle.E1, t(27, 11), 0.65,
    ['question_presente', 'notions_en_tension'], []))
  lignes.push(mesure('connaissance', 'composer', 'maison', 'formatif', 'E', parCle.E1, t(27, 11), 0.2,
    [], ['mobilisation']))
  lignes.push(mesure('argumentation', 'composer', 'maison', 'formatif', 'C', parCle.E1, t(27, 11), 0.55,
    ['lien_explicite'], ['garant_present']))
  lignes.push(mesure('structure', 'composer', 'maison', 'formatif', 'C', parCle.E1, t(27, 11), 0.6,
    [], []))

  // ── m4 : l'essai, EN CLASSE — trois ancres, les plus récentes ───────────
  lignes.push(expression('classe', 'sommatif', 'D', EXAM_ESSAI, 0.55))
  lignes.push(mesure('structure', 'composer', 'classe', 'sommatif', 'C', EXAM_ESSAI, t(28, 15), 0.6,
    ['bloc_unite'], ['charniere_motivee']))
  lignes.push(mesure('argumentation', 'composer', 'classe', 'sommatif', 'C', EXAM_ESSAI, t(28, 15), 0.6,
    ['objection_traitee'], ['garant_present']))

  for (const l of lignes) {
    const m = verifie(`mesure ${l.competence}`, await admin.from('competences_mesures')
      .insert(l).select('id').single())
    noter(registre, 'mesures', m.id)
  }

  const ancres = lignes.filter((l) => l.lieu === 'classe' && l.forme === 'sommatif')
  dire(true, `${lignes.length} mesures posées, dont ${ancres.length} ANCRES (classe × sommatif)`)
  for (const c of ['expression', 'argumentation', 'structure', 'synthese', 'connaissance', 'questionnement']) {
    const n = lignes.filter((l) => l.competence === c).length
    const nA = ancres.filter((l) => l.competence === c).length
    note(`${c.padEnd(15)} ${n} mesure(s), ${nA} ancre(s)`
      + (n >= FENETRE_EVIDENCE ? '  ⭐ fenêtre d\'évidence PLEINE' : `  (${n} sur ${FENETRE_EVIDENCE})`))
  }
  return lignes
}

// ════════════════════════════════════════════════════════════════════════════
// SEMER ④ — les lettres, UNE COMPÉTENCE À LA FOIS
// ════════════════════════════════════════════════════════════════════════════
//
// ⛔⛔ POURQUOI ON N'APPELLE PAS `ecrireLEtatApresMesure` ICI, ET POURQUOI ON
//    ÉCRIT UNE LIGNE À LA FOIS. Cette fonction envoie UN SEUL `upsert` en lot
//    pour toutes les compétences touchées, et `ligneDeNiveau` produit des jeux
//    de clés DIFFÉRENTS selon que la compétence a déjà une lettre ou non
//    (9 clés contre 7). `verifierLesLignesDeNiveau` LÈVE sur des clés
//    hétérogènes — et l'alerte ne remonte pas au bilan : le lot entier est
//    perdu EN SILENCE.
//    ⚠️ Ce n'est pas une hypothèse : c'est mesuré EN PRODUCTION, 13 élèves sur
//       13 — 13 mesures de `synthese`, 0 ligne de niveau `synthese`, et le
//       niveau `expression` figé au passage. (Constat déposé à
//       `IDEES_post_rentree.md` ; le corriger n'est pas le travail d'ici.)

const LETTRES = {
  // Les quatre qui ont une ancre — leur lettre vient de la DERNIÈRE.
  expression: { lettre: 'D', ancre: t(28, 15) },
  argumentation: { lettre: 'C', ancre: t(28, 15) },
  structure: { lettre: 'C', ancre: t(28, 15) },
  synthese: { lettre: 'D', ancre: t(26, 14) },
  // ⛔ Les deux autres n'ont AUCUNE ancre — « sa première lettre vient de sa
  //    première ancre » (`01-` §9). Elles restent SANS LETTRE, et c'est un
  //    état vrai : l'écran dira « travaillé N fois » sans lettre.
  connaissance: null,
  questionnement: null,
}

async function semerLesLettres() {
  titre('F. les lettres — une compétence à la fois, et vérifiées ensuite')

  for (const [competence, l] of Object.entries(LETTRES)) {
    const ligne = {
      eleve_id: ELO,
      competence,
      lettre: l?.lettre ?? null,
      lettre_initiale: l?.lettre ?? null,
      lettre_initiale_at: l ? l.ancre : null,
      ancre_derniere_date: l ? l.ancre.slice(0, 10) : null,
      ancre_derniere_valeur: l?.lettre ?? null,
      // ⭐ SANS CECI, AUCUNE LETTRE NE S'AFFICHE, quoi qu'on écrive.
      //    `01-` §9 : « tant qu'il est vrai, AUCUNE LETTRE NE S'AFFICHE ».
      //    Le seul écrivain réel est `cloturerLaCalibrationDesEleves`, un
      //    événement de FIN DE SEGMENT 2 : le décor le simule.
      profil_provisoire: false,
    }
    // ⛔ Une ligne à la fois — jamais un lot. Voir le bloc ci-dessus.
    ecrit(`niveau ${competence}`, await admin.from('competences_niveaux')
      .upsert(ligne, { onConflict: 'eleve_id,competence' }))
  }
  dire(true, '6 lignes de niveau écrites une par une (4 avec lettre, 2 sans ancre donc sans lettre)')

  // ⭐ LE CHOIX DE L'ÉLÈVE — troisième et dernière condition de la lettre.
  //    `06-` §5 : « c'est l'élève qui choisit d'en voir plus ».
  ecrit('choix des lettres', await admin.from('profiles')
    .update({ competences_lettres_affichees: true }).eq('id', ELO))
  dire(true, '`competences_lettres_affichees` = true (le choix de l\'élève, simulé)')
}

// ════════════════════════════════════════════════════════════════════════════
// VÉRIFIER — par requête, jamais par supposition
// ════════════════════════════════════════════════════════════════════════════

async function verifierParRequete() {
  titre('G. la vérification — relue en base, pas supposée')

  const depots = verifie('dépôts', await admin.from('exercices_depots')
    .select('id, statut, assigne_at, exercices!inner(lieu, classe_id)').eq('eleve_id', ELO))
  const enClasse = depots.filter((d) => d.exercices.lieu === 'classe' && d.statut === 'retour_publie')
  dire(enClasse.length >= 2, `${enClasse.length} dépôt(s) de CLASSE en \`retour_publie\``)

  const maison = depots.filter((d) => d.exercices.lieu === 'maison'
    && d.exercices.classe_id === null)
  dire(maison.length >= MAISON.length, `${maison.length} dépôt(s) de MAISON servables`)

  const mesures = verifie('mesures', await admin.from('competences_mesures')
    .select('competence, lieu, forme, lettre_equivalente, mesure_at')
    .eq('eleve_id', ELO).eq('instrument_version', MARQUE))
  const ancres = mesures.filter((m) => m.lieu === 'classe' && m.forme === 'sommatif')
  dire(ancres.length === 5, `${mesures.length} mesures marquées, dont ${ancres.length} ancres`)

  const niveaux = verifie('niveaux', await admin.from('competences_niveaux')
    .select('competence, lettre, profil_provisoire').eq('eleve_id', ELO))
  const avecLettre = niveaux.filter((n) => n.lettre !== null)
  const provisoires = niveaux.filter((n) => n.profil_provisoire)
  dire(avecLettre.length === 4, `${avecLettre.length}/6 lignes portent une lettre `
    + `(${avecLettre.map((n) => `${n.competence[0].toUpperCase()}${n.competence.slice(1, 4)}=${n.lettre}`).join(' ')})`)
  dire(provisoires.length === 0, `${provisoires.length} ligne(s) encore \`profil_provisoire\` `
    + '(il en faut 0 pour que les lettres sortent)')

  const profil = verifie('profil', await admin.from('profiles')
    .select('competences_lettres_affichees').eq('id', ELO).maybeSingle())
  dire(profil?.competences_lettres_affichees === true, '`competences_lettres_affichees` = true')

  const retours = verifie('retours', await admin.from('exercices_retours')
    .select('depot_id, published_at, lu_at').in('depot_id', depots.map((d) => d.id)))
  const publies = retours.filter((r) => r.published_at)
  const nonLus = publies.filter((r) => !r.lu_at)
  dire(publies.length >= 4, `${publies.length} retour(s) publié(s), dont ${nonLus.length} NON LU(S)`)
}

// ════════════════════════════════════════════════════════════════════════════
// L'ÉTAT — sans rien toucher
// ════════════════════════════════════════════════════════════════════════════

async function etat() {
  titre('L\'ÉTAT EN BASE — aucune écriture')

  const mesures = verifie('mesures marquées', await admin.from('competences_mesures')
    .select('id, competence, depot_id').eq('instrument_version', MARQUE))
  note(`mesures marquées « ${MARQUE} » : ${mesures.length}`)

  const jobs = verifie('jobs marqués', await admin.from('exercices_jobs')
    .select('id, depot_id').like('cle_idempotence', `${MARQUE}%`))
  note(`jobs marqués : ${jobs.length}`)

  const retours = verifie('retours', await admin.from('exercices_retours')
    .select('id, depot_id, texte'))
  const marques = retours.filter((r) => JSON.stringify(r.texte ?? '').includes(PREFIXE_POINT))
  note(`retours marqués : ${marques.length}`)

  const depotsDeduits = new Set([
    ...mesures.map((m) => m.depot_id), ...jobs.map((j) => j.depot_id),
    ...marques.map((r) => r.depot_id),
  ].filter(Boolean))
  note(`dépôts déduits de la marque : ${depotsDeduits.size}`)

  const registre = fs.existsSync(REGISTRE) ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) : null
  note(registre
    ? `registre présent, semé le ${registre.seme_le} — ${registre.semes.depots.length} dépôt(s) créé(s)`
    : 'aucun registre sur disque (la marque suffit au retrait)')

  const niveaux = verifie('niveaux', await admin.from('competences_niveaux')
    .select('competence, lettre, profil_provisoire').eq('eleve_id', ELO))
  note(`niveaux : ${niveaux.filter((n) => n.lettre).length}/6 avec lettre, `
    + `${niveaux.filter((n) => n.profil_provisoire).length} provisoire(s)`)
}

// ════════════════════════════════════════════════════════════════════════════
// RETIRER — la marque d'abord, le registre ensuite, et l'ordre des enfants
// ════════════════════════════════════════════════════════════════════════════

async function retirer() {
  titre('LE RETRAIT — par la marque, puis par le registre')

  const registre = fs.existsSync(REGISTRE)
    ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) : null
  if (!registre) note('⚠️ aucun registre : on retire par la seule marque, et on ne repose rien.')

  // ── 1. Retrouver les dépôts semés, PAR LA BASE ──────────────────────────
  const mesures = verifie('mesures marquées', await admin.from('competences_mesures')
    .select('id, depot_id').eq('instrument_version', MARQUE))
  const jobs = verifie('jobs marqués', await admin.from('exercices_jobs')
    .select('id, depot_id').like('cle_idempotence', `${MARQUE}%`))
  const tousRetours = verifie('retours', await admin.from('exercices_retours')
    .select('id, depot_id, texte'))
  const retoursMarques = tousRetours
    .filter((r) => JSON.stringify(r.texte ?? '').includes(PREFIXE_POINT))

  // ⭐⭐ LE COUPLE (ÉLÈVE × INSTANCE) EST UNE MARQUE À LUI SEUL, ET IL NE
  //    DOIT RIEN AU REGISTRE. `exercices_depots` n'a aucune colonne texte
  //    libre — et détourner `conditions_declarees` ou
  //    `message_lisibilite_reporte`, qui portent chacune un sens, serait un
  //    hijack, pas une marque. Mais les quatre instances sont des CONSTANTES DE
  //    CE FICHIER, et le contrôle d'entrée REFUSE de semer si Élo porte déjà un
  //    dépôt sur l'une d'elles : un dépôt d'Élo sur l'une de ces quatre
  //    instances ne peut donc être QUE de ce script.
  //    ⛔ Sans cela, E2 et E3 — `ouvert` et `assigne`, sans mesure, sans retour,
  //       sans job — ne se retrouveraient QUE par le fichier local, et un
  //       registre perdu les laisserait en base pour toujours.
  const parCouple = verifie('dépôts (élève × instances)', await admin.from('exercices_depots')
    .select('id').eq('eleve_id', ELO).in('exercice_id', MAISON.map((m) => m.exercice)))

  const deduits = new Set([
    ...mesures.map((m) => m.depot_id), ...jobs.map((j) => j.depot_id),
    ...retoursMarques.map((r) => r.depot_id),
    ...(parCouple ?? []).map((d) => d.id),
  ].filter(Boolean))
  const duRegistre = new Set(registre?.semes?.depots ?? [])
  const candidats = new Set([...deduits, ...duRegistre])
  note(`retrouvés en base : ${deduits.size} · au registre : ${duRegistre.size}`)

  // ⛔ LA GARDE : jamais un dépôt qui existait AVANT. Un premier jet d'une
  //    recette voisine a détruit un dépôt réel en nettoyant trop large.
  const preexistants = new Set(registre?.depots_avant ?? [EXAM_ESSAI, EXAM_EXPLIC])
  const aSupprimer = [...candidats].filter((id) => !preexistants.has(id))
  const aReposer = [...candidats].filter((id) => preexistants.has(id))
  note(`${aSupprimer.length} dépôt(s) à supprimer · ${aReposer.length} dépôt(s) à reposer`)

  // ── 2. Les enfants AVANT le parent ──────────────────────────────────────
  // ⚠️⚠️ `competences_mesures.depot_id` est en ON DELETE SET NULL : supprimer un
  //    dépôt avant ses mesures les laisse ORPHELINES, invisibles à tout
  //    contrôle qui compte par dépôt. Cette leçon a coûté trois mesures.
  if (mesures.length) {
    ecrit('retrait des mesures', await admin.from('competences_mesures')
      .delete().eq('instrument_version', MARQUE))
    dire(true, `${mesures.length} mesure(s) marquée(s) retirée(s)`)
  }
  const mesuresRegistre = (registre?.semes?.mesures ?? [])
    .filter((id) => !(registre?.mesures_avant ?? []).includes(id))
  if (mesuresRegistre.length) {
    await admin.from('competences_mesures').delete().in('id', mesuresRegistre)
  }

  if (retoursMarques.length) {
    ecrit('retrait des retours', await admin.from('exercices_retours')
      .delete().in('id', retoursMarques.map((r) => r.id)))
    dire(true, `${retoursMarques.length} retour(s) marqué(s) retiré(s)`)
  }
  if (jobs.length) {
    ecrit('retrait des jobs', await admin.from('exercices_jobs')
      .delete().like('cle_idempotence', `${MARQUE}%`))
    dire(true, `${jobs.length} job(s) marqué(s) retiré(s)`)
  }
  for (const id of aSupprimer) {
    await admin.from('exercices_squelettes').delete().eq('depot_id', id)
    await admin.from('exercices_metacognition').delete().eq('depot_id', id)
  }

  // ── 3. Les dépôts semés ─────────────────────────────────────────────────
  if (aSupprimer.length) {
    ecrit('retrait des dépôts', await admin.from('exercices_depots')
      .delete().in('id', aSupprimer))
    dire(true, `${aSupprimer.length} dépôt(s) semé(s) retiré(s)`)
  }

  // ── 4. REPOSER les deux examens, colonne par colonne, `null` compris ────
  //
  // ⛔⛔ ET VOICI CE QUE LA MARQUE NE SAIT PAS FAIRE. Les dépôts semés se
  //    retrouvent sans le registre ; l'ÉTAT D'AVANT des deux examens, lui, ne se
  //    déduit de rien — c'est une information qui n'existe que là où on l'a
  //    écrite. Sans registre, on ne repose donc PAS : on le DIT, et on laisse le
  //    geste à qui sait. « Reposer en écrivant une constante, ce n'est pas
  //    reposer : c'est imposer. »
  if (!registre?.examens) {
    console.log('\n⚠️  AUCUN REGISTRE : les deux examens diagnostiques RESTENT DÉCORÉS.')
    console.log('   Leur état d\'avant (statut « ouvert », copies et retours absents) n\'est')
    console.log('   déductible d\'aucune marque. Ce qu\'il reste à faire à la main, sur')
    console.log(`   ${EXAM_ESSAI} et ${EXAM_EXPLIC} :`)
    console.log('     statut → \'ouvert\' ; photos_v1, transcription_v1, confiance_ocr_v1,')
    console.log('     confiance_declaree, juger_debut_at, juger_fin_at, v1_remis_at,')
    console.log('     corrige_par, corrige_at, commentaire_general → NULL.')
  }
  for (const avant of registre?.examens ?? []) {
    const { id, created_at: _c, updated_at: _u, ...colonnes } = avant
    ecrit(`repose de l'examen ${id}`, await admin.from('exercices_depots')
      .update(colonnes).eq('id', id))
    dire(true, `examen ${id.slice(0, 8)} reposé (statut « ${avant.statut} »)`)
  }

  // ── 5. REPOSER les niveaux et le profil ─────────────────────────────────
  if (registre?.niveaux) {
    const avait = new Set(registre.niveaux.map((n) => n.competence))
    const maintenant = verifie('niveaux', await admin.from('competences_niveaux')
      .select('competence').eq('eleve_id', ELO))
    const enTrop = (maintenant ?? []).filter((n) => !avait.has(n.competence))
    if (enTrop.length) {
      await admin.from('competences_niveaux').delete()
        .eq('eleve_id', ELO).in('competence', enTrop.map((n) => n.competence))
    }
    for (const n of registre.niveaux) {
      const { updated_at: _u, ...colonnes } = n
      ecrit(`repose du niveau ${n.competence}`, await admin.from('competences_niveaux')
        .upsert(colonnes, { onConflict: 'eleve_id,competence' }))
    }
    dire(true, `${registre.niveaux.length} ligne(s) de niveau reposée(s) telles qu'avant`)
  }
  if (registre?.profil) {
    ecrit('repose du profil', await admin.from('profiles')
      .update(registre.profil).eq('id', ELO))
    dire(true, 'les deux colonnes de `profiles` reposées '
      + `(lettres : ${JSON.stringify(registre.profil.competences_lettres_affichees)})`)
  }

  // ── 6. Vérifier le retour PAR REQUÊTE ───────────────────────────────────
  const resteM = verifie('reste mesures', await admin.from('competences_mesures')
    .select('id').eq('instrument_version', MARQUE))
  const resteJ = verifie('reste jobs', await admin.from('exercices_jobs')
    .select('id').like('cle_idempotence', `${MARQUE}%`))
  const resteR = verifie('reste retours', await admin.from('exercices_retours').select('id, texte'))
  const resteRM = resteR.filter((r) => JSON.stringify(r.texte ?? '').includes(PREFIXE_POINT))
  dire(resteM.length === 0, `reste de mesures marquées : ${resteM.length}`)
  dire(resteJ.length === 0, `reste de jobs marqués : ${resteJ.length}`)
  dire(resteRM.length === 0, `reste de retours marqués : ${resteRM.length}`)

  const orphelines = verifie('mesures orphelines', await admin.from('competences_mesures')
    .select('id, competence, mesure_at').eq('eleve_id', ELO).is('depot_id', null))
  dire(orphelines.length === 0, `mesure(s) d'Élo sans dépôt : ${orphelines.length}`)

  if (fs.existsSync(REGISTRE)) fs.unlinkSync(REGISTRE)
  note('registre effacé')
}

// ════════════════════════════════════════════════════════════════════════════

async function semer() {
  const entree = await controleDEntree()
  const registre = await emprunter(entree)
  await semerLesExamens(registre)
  const parCle = await semerLaMaison(registre)
  await semerLesMesures(registre, parCle)
  await semerLesLettres()
  await verifierParRequete()

  titre('CE QU\'IL Y A À REGARDER')
  console.log(`
  Connecte-toi en élève (${env.TEST_ELEVE_EMAIL ?? 'le compte d\'Élo'}), contexte de classe « T5 ».

    /eleve                              le tableau de bord — la tuile « retour à lire »
    /eleve/semaine                      la semaine : frise, compétences, bilan
    /eleve/moi                          le profil — « où j'en suis », les lettres
    /eleve/moi/competences              les six fiches
    /eleve/modules/codex                les exercices : a_lire · en_cours · a_faire · clos
    /eleve/modules/codex/examens        l'essai diagnostique et son retour NON LU
    /eleve/modules/aletheia/examens     l'explication de texte et son retour LU

  ⛔ Pour tout défaire :  node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \\
       --import ./scripts/register-calibration-resolver.mjs \\
       scripts/recette/decor-eleve-elo.mjs --retire
`)
}

try {
  if (a('retire')) await retirer()
  else if (a('etat')) await etat()
  else await semer()
} catch (e) {
  console.error(`\n✗ ${e.message}`)
  console.error('  Rien n\'a été poursuivi au-delà de ce point. '
    + `Le registre (${REGISTRE}) dit ce qui était déjà semé ; \`--retire\` le retire.`)
  process.exit(1)
}

console.log(`\n${ko === 0 ? '✓' : '✗'} ${ok} vert(s), ${ko} rouge(s)`)
process.exit(ko === 0 ? 0 : 1)
