// ============================================================================
// COUTURE C6 · L2 — CE QUE LA CHAÎNE A MESURÉ ET ÉCRIT ATTEINT-IL L'ŒIL DE
//                   L'ÉLÈVE — ET SON CLIC LE RAMÈNE-T-IL AU TRAVAIL ?
//                   Éprouvé par EXÉCUTION, jamais par lecture.
// ----------------------------------------------------------------------------
// ⭐⭐ CINQ CANAUX À NOMMER, ET QUATRE ÉTAIENT COUPÉS AU 28/08. Chaque couture se
//    nomme sous la seule forme qui la rend vérifiable — QUI ÉCRIT · QUI LIT ·
//    UN CHEMIN RÉEL Y MÈNE-T-IL ?
//
//   ① etat-serveur + chaîne → `competences_mesures` → le décompte `n`   ✅ passait
//   ② etatDesObservables → `ilYAProgression`         → PERSONNE          ⛔ coupé
//   ③ chaine/retour → `exercices_retours.action_revision` → un PROFIL    ⛔ coupé
//   ④ le prof / le routeur → `exercices_depots`      → le tableau de bord ⛔ coupé
//   ⑤ `exercicesMaisonDeLEleve`                      → un écran de semaine ⛔ coupé
//
// ⛔ PAS DE LECTURE DE CODE EN GUISE DE PREUVE. Ce script APPELLE les lectures
//    que les trois écrans appellent — `signalDeLaSemaine` (le tableau de bord),
//    `chargerLaSemaineDeLEleve` (la semaine), `chargerLeProfilDeLEleve` (le
//    profil) et `chargerLesFichesDeCompetence` (les fiches) —, puis il CONSTATE
//    que chacune sert sa ligne.
//
// ⛔ AUCUN APPEL DE MODÈLE N'EST PAYÉ : tout le décor est semé en base.
//
// ⚠️ LA BASE EST LA SANDBOX, ET DES ÉLÈVES RÉELS Y TRAVAILLENT. Ce script ne
//    touche QUE ce qu'il a semé, et il tient un REGISTRE sur disque que
//    `--retire` relit. ⛔ Il ne bascule AUCUN des six interrupteurs.
//
// ⚠️⚠️ IL EMPRUNTE DEUX CHOSES À UN ÉLÈVE RÉEL, ET LES REPOSE :
//    · son `competences_niveaux` pour la compétence semée — `profil_provisoire`
//      doit passer à FAUX pour que la lettre puisse s'afficher, et la `lettre`
//      doit exister. **Les valeurs d'avant sont dans le registre**, `null`
//      compris. ⛔ « Une recette qui remet un interrupteur en écrivant une
//      constante ne le remet pas : elle l'impose. »
//    · ses deux marques de `profiles` (C6-L2) — le choix des lettres et la date
//      de service des fiches. Mêmes règles.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c6l2.mjs [--garde-le-decor]
//   node … scripts/recette/couture-c6l2.mjs --decor-ecran
//   node … scripts/recette/couture-c6l2.mjs --retire
//
// ⭐ `--decor-ecran` sème le décor ET S'ARRÊTE LÀ. C'est le seul moyen de VOIR
//    les trois écrans avec de la matière dedans, et surtout d'exercer ce que la
//    couture NE PEUT PAS exercer : les server actions elles-mêmes (la bascule
//    des lettres, la marque de service). ⚠️ Ce script les CONTOURNE — il appelle
//    les lecteurs directement, donc ni l'enveloppe `'use server'`, ni la garde
//    de session, ni `revalidatePath`. **Seul un clic dans un navigateur teste ce
//    chemin-là.**
//    ⛔ IL NE SE NETTOIE PAS TOUT SEUL : `--retire`.
//
// ⚠️ LE RÉSOLVEUR DE CALIBRATION EST OBLIGATOIRE : les lectures des pages
//    portent `import 'server-only'`.
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

// ── CE QUE LES TROIS ÉCRANS APPELLENT, ET RIEN D'AUTRE ─────────────────────
const { signalDeLaSemaine, chargerLaSemaineDeLEleve } =
  await import(`${RACINE}/utils/eleve/semaine-serveur.ts`)
const { chargerLeProfilDeLEleve } = await import(`${RACINE}/utils/eleve/profil-serveur.ts`)
const {
  chargerLesFichesDeCompetence, fichesDejaServies, marquerLesFichesServies,
  lireLeChoixDesLettres, ecrireLeChoixDesLettres,
} = await import(`${RACINE}/utils/eleve/fiche-serveur.ts`)
// ── LES RÈGLES QUE LE LOT N'A PAS RECOPIÉES ────────────────────────────────
const { lundiDuCycle } = await import(`${RACINE}/utils/deroule/echeance.ts`)
const { toISODate } = await import(`${RACINE}/utils/calendrier-grille.ts`)
// ⛔ Le seuil se LIT de C4-L2 : un script qui écrirait 2/3 en dur ne
//    contrôlerait plus rien le jour où il change.
const { FENETRE_EVIDENCE, SEUIL_ACQUISITION } = await import(`${RACINE}/utils/routeur/config.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'COUTURE-C6L2'
const REGISTRE = '.couture-c6l2.json'
const a = (n) => process.argv.includes(`--${n}`)
/** `--cle valeur` ou `--cle=valeur`. */
const valeurOption = (cle) => {
  const i = process.argv.indexOf(`--${cle}`)
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1]
  }
  const eq = process.argv.find((x) => x.startsWith(`--${cle}=`))
  return eq ? eq.slice(cle.length + 3) : null
}
const GARDE_LE_DECOR = a('garde-le-decor')

let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (t) => console.log(`  · ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

/** supabase-js NE LÈVE PAS : il rend `{ error }`. Ici, on lève. */
function verifie(ou, { data, error }) {
  if (error) throw new Error(`${ou} — ${error.code ?? ''} ${error.message}`)
  return data
}

const FUSEAU = 'America/Toronto'
const COMPETENCE = 'argumentation'
const MAINTENANT = new Date()
const CYCLE = toISODate(lundiDuCycle(MAINTENANT, FUSEAU))

/** Un instant du cycle courant, décalé de `h` heures après son lundi 09 h UTC. */
const dansLeCycle = (h) =>
  new Date(new Date(`${CYCLE}T09:00:00Z`).getTime() + h * 3600_000).toISOString()

/**
 * ⭐⭐ L'INSTANT OÙ LE CYCLE COMMENCE **DANS LE FUSEAU DE L'ÉCOLE**, cherché avec
 *    `lundiDuCycle` — jamais reconstruit à la main. Minuit UTC n'est pas minuit
 *    à Toronto : une mesure du dimanche soir y basculerait d'une semaine.
 */
function debutDuCycle() {
  let t = new Date(`${CYCLE}T12:00:00Z`)
  for (let i = 0; i < 48; i++) {
    const precedent = new Date(t.getTime() - 3600_000)
    if (toISODate(lundiDuCycle(precedent, FUSEAU)) !== CYCLE) return t
    t = precedent
  }
  return t
}

/**
 * ⛔⛔ LES MESURES « D'AVANT LE CYCLE » DOIVENT TOMBER **APRÈS LA BORNE DE
 *    RECETTE**, sinon `mesuresQuiComptent` les écarte et le décor ment.
 *    *Trouvé en jouant cette recette : six mesures semées, TROIS comptées — la
 *    borne d'`argumentation` est au 23/08 21 h 19, et trois dates du décor la
 *    précédaient.* On lit donc la borne en base et on sème DEDANS.
 */
function creneauAvantLeCycle(borne, combien) {
  const fin = debutDuCycle().getTime() - 60_000
  const plancher = borne ? new Date(borne).getTime() + 60_000 : fin - 30 * 86_400_000
  const debut = Math.max(plancher, fin - 30 * 86_400_000)
  if (debut >= fin) return null
  const pas = (fin - debut) / (combien + 1)
  return Array.from({ length: combien }, (_, i) => new Date(debut + pas * (i + 1)).toISOString())
}

/**
 * Un point de retour BIEN FORMÉ — la forme que `retour_segmente_bien_forme()`
 * exige en base, relevée sur un retour réel du bac à sable.
 * ⚠️ L'`id` est STABLE et porte le numéro du point (`07-` §3).
 */
const pointDeRetour = (num, texte) => ([{
  id: `${MARQUE.toLowerCase()}:v1:${num}`,
  texte,
  nature: 'point_de_travail',
  ancrage: { source: 'copie', citation: 'une phrase de la copie semée par la recette' },
  competence: COMPETENCE,
}])

// ════════════════════════════════════════════════════════════════════════════
// A. LE DÉCOR — un élève, deux ateliers, un retour publié, six mesures
// ════════════════════════════════════════════════════════════════════════════
async function semer() {
  titre('A. Le décor — deux exercices maison (codex + aletheia), un retour publié, six mesures')

  const insc = verifie('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id, classes(nom)').eq('statut', 'active').order('eleve_id'))
  if (!insc.length) throw new Error('aucune inscription active en base.')

  // ⭐⭐ ON CHOISIT UN ÉLÈVE SANS AUCUNE MESURE **QUI COMPTE** SUR LA COMPÉTENCE
  //    SEMÉE, ET LE MOTIF EST UNE LEÇON DE CETTE RECETTE. Le premier jeu a semé
  //    six mesures chez un élève qui en portait DÉJÀ UNE : `n` valait 7, les deux
  //    fenêtres d'évidence se décalaient d'un cran, et « en progrès » tombait à
  //    « ni progrès ni stagnation ». ⛔ Le décor n'était pas faux — il était
  //    POSÉ SUR UNE DONNÉE RÉELLE QU'IL NE COMPTAIT PAS. *Une recette qui ne
  //    maîtrise pas son point de départ ne prouve rien.*
  //
  // ⚠️ « QUI COMPTE » N'EST PAS « QUI EXISTE », et la nuance décide : une mesure
  //    ANTÉRIEURE À LA BORNE DE RECETTE est écartée par `mesuresQuiComptent`, donc
  //    elle ne décale aucune fenêtre. On lit donc la borne AVANT de choisir.
  const borneRecette = verifie('borne de recette', await admin
    .from('competences_statut_recette')
    .select('statut_recette_pose_le').eq('competence', COMPETENCE).maybeSingle())
    ?.statut_recette_pose_le ?? null
  let reqMesures = admin.from('competences_mesures')
    .select('eleve_id').eq('competence', COMPETENCE).eq('sonde_montee', false)
  if (borneRecette) reqMesures = reqMesures.gte('mesure_at', borneRecette)
  const dejaMesures = verifie('mesures qui comptent', await reqMesures)
  const occupes = new Set((dejaMesures ?? []).map((m) => m.eleve_id))

  // ⭐ `--eleve <courriel>` — pour SEMER SUR LE COMPTE DE TEST, celui que Louis
  //    ouvrira. Sans lui, on prend le premier élève libre.
  //    ⛔ L'option NE CONTOURNE PAS le contrôle : si le compte visé porte déjà des
  //       mesures qui comptent, on REFUSE plutôt que de fausser la preuve.
  const courriel = valeurOption('eleve')
  let libre
  if (courriel) {
    const { data: comptes, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (error) throw new Error(`comptes — ${error.message}`)
    const u = comptes.users.find((x) => x.email?.toLowerCase() === courriel.toLowerCase())
    if (!u) throw new Error(`aucun compte « ${courriel} » dans auth.users.`)
    libre = insc.find((i) => i.eleve_id === u.id)
    if (!libre) throw new Error(`« ${courriel} » n'a aucune inscription ACTIVE.`)
    if (occupes.has(u.id)) {
      throw new Error(`« ${courriel} » porte déjà une mesure d'${COMPETENCE} QUI COMPTE : `
        + 'le décor de progression fausserait les fenêtres. Choisir un autre compte.')
    }
    note(`⭐ élève VISÉ par --eleve : ${courriel}`)
  } else {
    libre = insc.find((i) => !occupes.has(i.eleve_id))
  }
  if (!libre) {
    throw new Error(`tous les élèves actifs portent déjà une mesure d'${COMPETENCE} qui compte : `
      + 'le décor de progression ne peut pas se poser sans compter leurs mesures. '
      + 'Condition de reprise : choisir une compétence libre, ou compter l’existant.')
  }
  const eleveId = libre.eleve_id
  const classeId = libre.classe_id
  const nom = verifie('profil', await admin.from('profiles')
    .select('display_name').eq('id', eleveId).maybeSingle())?.display_name ?? eleveId
  note(`élève RÉEL : ${nom} · classe « ${libre.classes?.nom ?? '?'} » · cycle du ${CYCLE}`)
  note(`aucune mesure d'${COMPETENCE} chez lui avant le décor `
    + `(${occupes.size} élève(s) en portent, écartés du choix)`)

  const registre = {
    eleveId, classeId, cycle: CYCLE,
    exercices: [], depots: [], retours: [], mesures: [], niveau: null, profil: null,
  }

  // ── Ce qu'on emprunte au profil de l'élève, et qu'on reposera ──────────────
  const niveauAvant = verifie('niveau', await admin.from('competences_niveaux')
    .select('lettre, lettre_initiale, profil_provisoire, ancre_derniere_date, ancre_derniere_valeur')
    .eq('eleve_id', eleveId).eq('competence', COMPETENCE).maybeSingle())
  registre.niveau = { existait: !!niveauAvant, avant: niveauAvant ?? null }
  const profilAvant = verifie('marques', await admin.from('profiles')
    .select('competences_lettres_affichees, fiches_competences_servies_at')
    .eq('id', eleveId).maybeSingle())
  registre.profil = profilAvant ?? null
  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

  // ── Un type d'exercice réel, pour que les FK tiennent ─────────────────────
  // ⚠️ LE CRAN EST OBLIGATOIRE — un `CHECK` en base le dit : « une instance
  //    CONÇUE porte son cran ». On prend un type et un cran qui EXISTENT à la
  //    doctrine (`exercices_types_crans`), jamais un numéro inventé : le cran
  //    porte LE NUMÉRO (`utils/cran.ts`), et un cran hors table n'a pas de durée.
  const cran = verifie('cran de doctrine', await admin.from('exercices_types_crans')
    .select('type_id, cran').order('type_id').order('cran').limit(1).maybeSingle())
  if (!cran) throw new Error('aucun `exercices_types_crans` en base : le décor ne peut pas se poser.')
  const type = { id: cran.type_id }
  note(`type ${String(cran.type_id).slice(0, 8)} · cran ${cran.cran} (lus à la doctrine)`)

  // ── Deux instances MAISON, une par atelier ────────────────────────────────
  // ⚠️ L'ATELIER SUIT LE MODE, jamais une colonne : `composer` → codex, sinon
  //    aletheia (`atelierDUnFormatif`, `01-` §2). Le décor pose donc UNE
  //    instance de chaque, pour éprouver que l'écran couvre les DEUX.
  const instances = [
    { atelier: 'codex', modes: { [COMPETENCE]: ['composer'] },
      consigne: `${MARQUE} — Rédige un paragraphe argumenté sur la liberté.` },
    { atelier: 'aletheia', modes: { [COMPETENCE]: ['expliquer'] },
      consigne: `${MARQUE} — Explique comment l'auteur soutient sa thèse.` },
  ]
  for (const i of instances) {
    const ex = verifie(`instance ${i.atelier}`, await admin.from('exercices').insert({
      // ⚠️ LE STATUT SE LIT DU `CHECK`, jamais d'une intuition : la contrainte
      //    `exercices_statut_check` n'admet que `a_concevoir`, `concu`, `assigne`,
      //    `clos`. Une instance servie à un élève est ASSIGNÉE.
      type_id: type.id, classe_id: classeId, lieu: 'maison', statut: 'assigne', cran: cran.cran,
      consigne_instanciee: i.consigne, modes_par_competence: i.modes,
    }).select('id').single())
    i.exerciceId = ex.id
    registre.exercices.push(ex.id)
  }

  // ── Deux dépôts ASSIGNÉS DANS LE CYCLE COURANT ────────────────────────────
  // ⚠️ `assigne_at` EST LE SEUL CHEMIN TOTAL vers la semaine d'un dépôt, et il
  //    se lit DANS LE FUSEAU DE L'ÉCOLE. ⛔ On ne le laisse JAMAIS au
  //    `default now()` : le rattachement au cycle deviendrait celui de l'heure
  //    de la recette (leçon C4-L12).
  const depots = [
    { ...instances[0], statut: 'assigne', assigneAt: dansLeCycle(1) },
    { ...instances[1], statut: 'vf_remis', assigneAt: dansLeCycle(2) },
  ]
  for (const d of depots) {
    const dep = verifie(`dépôt ${d.atelier}`, await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: d.exerciceId, statut: d.statut,
      assigne_at: d.assigneAt, origine: 'prof',
      echeance: new Date(new Date(`${CYCLE}T09:00:00Z`).getTime() + 6 * 86_400_000).toISOString(),
    }).select('id').single())
    d.depotId = dep.id
    registre.depots.push(dep.id)
  }
  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))
  note(`deux dépôts posés : ${depots[0].depotId.slice(0, 8)} (codex, assigné) · `
    + `${depots[1].depotId.slice(0, 8)} (aletheia, version finale rendue)`)

  // ── UN RETOUR PUBLIÉ, avec son `action_revision` ──────────────────────────
  // ⛔ `published_at` EST LA PORTE : un retour non publié ne se montre JAMAIS à
  //    l'élève. Le décor en pose UN publié, pour que le canal ③ ait de la
  //    matière — et le contrôle vérifiera qu'un NON publié reste invisible.
  const GESTE = 'Reprends ton troisième argument et écris, en une phrase, la raison '
    + 'qui le relie à ta conclusion.'
  const retourPublie = verifie('retour publié', await admin.from('exercices_retours').insert({
    depot_id: depots[1].depotId, moment: 'chaud',
    // ⚠️ LE `texte` EST SEGMENTÉ, ET LA BASE LE VÉRIFIE : `retours_texte_segmente_chk`
    //    appelle `retour_segmente_bien_forme()`. « Chaque point d'un retour porte
    //    un identifiant STABLE — sans lui, une contestation ne peut pas désigner
    //    ce qu'elle conteste » (`07-` §3). On respecte la forme réelle, pas une
    //    approximation qui passerait pour une donnée.
    texte: pointDeRetour('01', `${MARQUE} — point de travail sur la justification.`),
    action_revision: { texte: GESTE },
    published_at: dansLeCycle(30),
  }).select('id').single())
  registre.retours.push(retourPublie.id)

  // ⚠️ ET UN NON PUBLIÉ, PLUS RÉCENT : s'il sortait, la porte ne serait pas une
  //    porte. Le contrôle ④ le vérifie explicitement.
  const NON_PUBLIE = 'CE GESTE NE DOIT JAMAIS ATTEINDRE L\'ÉLÈVE.'
  const retourCache = verifie('retour non publié', await admin.from('exercices_retours').insert({
    depot_id: depots[0].depotId, moment: 'chaud',
    texte: pointDeRetour('02', `${MARQUE} — point de travail, non publié.`),
    action_revision: { texte: NON_PUBLIE },
    published_at: null,
  }).select('id').single())
  registre.retours.push(retourCache.id)
  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

  // ── SIX MESURES, dessinées pour lever LES TROIS LECTURES À LA FOIS ────────
  // ⭐ Quatre AVANT le cycle, deux PENDANT. La forme est calculée, pas devinée :
  //
  //   observable         avant le cycle        pendant   → ce que chaque lecture voit
  //   ─────────────────  ────────────────────  ────────  ─────────────────────────────
  //   objection_traitee  non, non, oui, oui    oui, oui  bilan : ÉCART 1 (0,5 → 1)
  //   garant_present     0.9 ×4                0.2 ×2    bilan : ÉCART 2 (1 → 0)
  //   lien_explicite     0.2, 0.2, 0.2, 0.9    0.9, 0.9  profil : PROGRESSION
  //
  // ⚠️ LA PROGRESSION SE LIT D'UNE FENÊTRE À LA SUIVANTE, sur les SIX mesures :
  //    avant = les 4 dernières des 5 premières → `lien_explicite` 2/4 = 0,5, non
  //    acquis ; après = les 4 dernières des 6 → 3/4 = 0,75, ACQUIS. Un observable
  //    passe donc à acquis, et c'est exactement la définition du `01-` §8.2.
  const borne = verifie('borne de recette', await admin.from('competences_statut_recette')
    .select('statut_recette_pose_le').eq('competence', COMPETENCE).maybeSingle())
    ?.statut_recette_pose_le ?? null
  const avant = creneauAvantLeCycle(borne, 4)
  if (!avant) {
    throw new Error('aucun créneau entre la borne de recette ('
      + `${borne}) et le début du cycle (${debutDuCycle().toISOString()}) : le décor `
      + 'd’un « avant » ne peut pas se poser, et les deux écarts du bilan sont '
      + 'donc inéprouvables aujourd’hui. Condition de reprise : une borne de '
      + 'recette antérieure d’au moins quelques heures au lundi du cycle.')
  }
  note(`borne de recette (${COMPETENCE}) : ${borne ?? 'aucune'} · `
    + `début du cycle : ${debutDuCycle().toISOString()}`)
  const SEQUENCE = [
    { at: avant[0], objection_traitee: 'non', garant_present: 0.9, lien_explicite: 0.2 },
    { at: avant[1], objection_traitee: 'non', garant_present: 0.9, lien_explicite: 0.2 },
    { at: avant[2], objection_traitee: 'oui', garant_present: 0.9, lien_explicite: 0.2 },
    { at: avant[3], objection_traitee: 'oui', garant_present: 0.9, lien_explicite: 0.9 },
    { at: dansLeCycle(3), objection_traitee: 'oui', garant_present: 0.2, lien_explicite: 0.9 },
    { at: dansLeCycle(4), objection_traitee: 'oui', garant_present: 0.2, lien_explicite: 0.9 },
  ]
  for (const [i, m] of SEQUENCE.entries()) {
    const { at, ...observables } = m
    const mes = verifie(`mesure ${i + 1}`, await admin.from('competences_mesures').insert({
      eleve_id: eleveId, competence: COMPETENCE, mesure_at: at,
      observables, lieu: 'maison', forme: 'formatif', modes: ['composer'],
      // ⛔ JAMAIS une sonde de montée : `mesuresQuiComptent` les retire, et le
      //    décompte `n` serait faux.
      sonde_montee: false,
      // ⭐⭐ CHAQUE MESURE PORTE LA MARQUE DE LA RECETTE, ET C'EST UNE LEÇON PAYÉE.
      //    Le premier jeu ne marquait rien : le registre sur disque était le SEUL
      //    moyen de retrouver ce qui avait été semé. Deux runs ont donc laissé
      //    onze mesures orphelines — l'un tué par un `| head` (SIGPIPE, avant le
      //    retrait), l'autre interrompu par une contrainte AVANT que le registre
      //    ne soit écrit. ⛔ **Un décor qu'on ne sait retrouver que par un
      //    fichier local n'est pas retirable.** `instrument_version` porte
      //    désormais la marque, et `--retire` balaie DESSUS en plus du registre.
      instrument_version: MARQUE,
      // ⚠️ `uk_mesures_depot_competence` — UNE mesure par (dépôt × compétence).
      //    Une seule des deux mesures du cycle porte donc le dépôt rendu ; l'autre
      //    reste sans rattachement, ce qui est le cas ordinaire d'une mesure de
      //    trajectoire. ⭐ Et cela sert la preuve : le dépôt qu'on clôt ensuite
      //    n'a AUCUNE mesure, donc le bilan doit dire qu'une copie lui manque.
      depot_id: i === 4 ? depots[1].depotId : null,
    }).select('id').single())
    registre.mesures.push(mes.id)
    // ⚠️ LE REGISTRE S'ÉCRIT À CHAQUE LIGNE, jamais à la fin d'une boucle : une
    //    interruption au milieu laisserait sinon tout ce qui précède orphelin.
    fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))
  }
  note(`six mesures posées (4 avant le cycle, 2 dedans) · fenêtre d'évidence = ${FENETRE_EVIDENCE}`
    + ` · seuil d'acquisition > ${SEUIL_ACQUISITION.toFixed(3)}`)

  // ── Le niveau : la lettre existe, le profil n'est plus provisoire ─────────
  // ⚠️ SANS CELA, LA TROISIÈME CONDITION NE PEUT PAS SE PROUVER. Au 28/08,
  //    `profil_provisoire` est VRAI sur les 149 lignes de production et les 102
  //    du bac à sable : la lettre ne se prouve à l'écran qu'ici, ou après la
  //    bascule réelle (la quatrième semaine d'enseignement).
  verifie('niveau semé', await admin.from('competences_niveaux').upsert({
    eleve_id: eleveId, competence: COMPETENCE,
    lettre: 'C', lettre_initiale: niveauAvant?.lettre_initiale ?? 'C',
    profil_provisoire: false,
  }, { onConflict: 'eleve_id,competence' }).select('competence'))

  return { eleveId, classeId, nom, depots, geste: GESTE, nonPublie: NON_PUBLIE }
}

// ════════════════════════════════════════════════════════════════════════════
// B. LES CINQ CANAUX — chacun par la lecture que son écran appelle
// ════════════════════════════════════════════════════════════════════════════
async function lesCanaux(d) {
  titre('B. ④ — LE TABLEAU DE BORD : une tuile naît-elle de l’ASSIGNATION ?')
  const signal = await signalDeLaSemaine(admin, d.eleveId, d.classeId, CYCLE, FUSEAU, MAINTENANT)
  dire(signal.total >= 2,
    `le signal du tableau de bord voit ${signal.total} exercice(s) du cycle `
    + `(attendu : au moins les 2 semés)`)
  dire(signal.aFaire >= 1,
    `dont ${signal.aFaire} attend(ent) un geste — la tuile s’allume`)
  // ⚠️ Le dépôt `vf_remis` n'attend plus rien : il compte au total, pas au « à faire ».
  // ⭐⭐ TROUVÉ EN JOUANT CETTE RECETTE, ET C'EST JUSTE : un dépôt `vf_remis`
  //    dont le retour est PUBLIÉ MAIS NON LU compte encore au « à faire ».
  //    `etatDeLExercice` met l'obligation de lecture DEVANT le statut du dépôt
  //    (`02-` §6.D, étape 17) : « le retour devient visible quand il coche la
  //    case de publication, AVEC OBLIGATION POUR L'ÉLÈVE DE VALIDER SA LECTURE ».
  //    ⛔ La semaine ne se referme donc pas tant qu'un retour n'est pas lu — et
  //       c'est la preuve que la tuile ne s'éteint pas trop tôt.
  dire(signal.aFaire === signal.total,
    'un retour PUBLIÉ NON LU tient la semaine ouverte — l’obligation de lecture '
    + 'passe devant le statut du dépôt')

  titre('B. ⑤ — L’ÉCRAN DE LA SEMAINE : la liste, les deux ateliers, la frise')
  const semaine = await chargerLaSemaineDeLEleve(admin, d.eleveId, d.classeId, CYCLE, FUSEAU)
  dire(semaine.incidents.length === 0,
    `aucun incident de lecture${semaine.incidents.length ? ' — ' + semaine.incidents.join(' · ') : ''}`)
  dire(semaine.porteOuverte, 'la porte `exercices_actif` est ouverte, et l’écran le sait')
  const miens = semaine.exercices.filter((e) => d.depots.some((x) => x.depotId === e.depotId))
  dire(miens.length === 2, `les DEUX dépôts semés sont à l’écran (${miens.length}/2)`)
  const ateliers = new Set(miens.map((e) => e.atelier))
  dire(ateliers.has('codex') && ateliers.has('aletheia'),
    `⭐ LES DEUX ATELIERS SONT COUVERTS : ${[...ateliers].sort().join(' + ')} `
    + '— une liste par atelier en aurait manqué un')
  dire(miens.every((e) => e.href.includes('/exercice/')),
    '⭐ CHAQUE LIGNE MÈNE AU DÉROULÉ À SIX TEMPS (C4-L3) — un lien, pas une impasse')
  dire(semaine.frise.total === semaine.exercices.length
    && semaine.frise.cases.length === semaine.frise.total,
    `la frise porte une case par exercice (${semaine.frise.faits}/${semaine.frise.total} faits)`)
  dire(!('pourcentage' in semaine.frise) && !('bande' in semaine.frise),
    '⛔ LA FRISE NE PORTE NI POURCENTAGE NI BANDE — ce sont ceux du professeur')

  titre('B. ⑤bis — LE RÉCAPITULATIF : les forces, et AUCUNE faiblesse')
  dire(semaine.moment === 'recapitulatif',
    `un dépôt attend encore un geste → premier temps (« ${semaine.moment} »)`)
  dire(semaine.bilan.length === 0,
    '⛔ LES DEUX TEMPS NE S’AFFICHENT JAMAIS ENSEMBLE : le bilan est vide ici')
  const arg = semaine.recapitulatif.find((b) => b.competence === 'Argumentation')
  dire(!!arg, 'l’Argumentation est au récapitulatif — lue SUR LES EXERCICES POSÉS')
  if (arg) {
    note(`« ${arg.competence} » · ${arg.nbExercices} exercice(s)`)
    note(`forces : ${arg.forces.join(' · ') || '(aucune)'}`)
    note(`on regarde : ${arg.dimensionsRegardees.slice(0, 3).join(' · ')}…`)
    dire(arg.forces.length > 0,
      '⭐ SES FORCES SONT NOMMÉES — les observables ACQUIS, par leur `dimension_eleve`')
    dire(arg.dimensionsRegardees.length > 0,
      '⭐ « CE QU’IL DOIT SURVEILLER » = les dimensions que la semaine MESURE, sans verdict')
  }
  const texteRecap = JSON.stringify(semaine.recapitulatif)
  dire(!/faible|faiblesse|tu rates|échou|à revoir/i.test(texteRecap),
    '⛔⛔ LE RÉCAPITULATIF NE NOMME AUCUNE FAIBLESSE — sinon « se juger » aurait sa réponse')

  return semaine
}

// ════════════════════════════════════════════════════════════════════════════
// C. LE BILAN — les deux écarts, un de chaque sens
// ════════════════════════════════════════════════════════════════════════════
async function leBilan(d) {
  titre('C. ⑤ter — LE BILAN : « les deux écarts qui instruisent », un de chaque sens')

  // ⭐ « À la fin » = plus aucun dépôt du cycle n'attend un geste. Deux gestes
  //    restent : rendre le dépôt `assigne`, et VALIDER LA LECTURE du retour.
  verifie('clôture du dépôt', await admin.from('exercices_depots')
    .update({ statut: 'clos' }).eq('id', d.depots[0].depotId))

  // ⛔⛔ ET LA LECTURE DU RETOUR EST BIEN UN GESTE : tant qu'elle manque, l'écran
  //    reste au récapitulatif. On le CONSTATE avant de la poser.
  const encore = await chargerLaSemaineDeLEleve(admin, d.eleveId, d.classeId, CYCLE, FUSEAU)
  dire(encore.moment === 'recapitulatif',
    '⭐⭐ UN RETOUR PUBLIÉ NON LU RETIENT LE BILAN — « obligation pour l’élève de '
    + `valider sa lecture » (\`02-\` §6.D) ; l'écran reste au récapitulatif`)

  // L'élève valide sa lecture — le dernier geste de la semaine.
  verifie('lecture validée', await admin.from('exercices_retours')
    .update({ lu_at: MAINTENANT.toISOString() })
    .eq('depot_id', d.depots[1].depotId).not('published_at', 'is', null))
  // ⚠️ Le retour NON publié, lui, reste non publié : il ne doit toujours pas sortir.

  const semaine = await chargerLaSemaineDeLEleve(admin, d.eleveId, d.classeId, CYCLE, FUSEAU)
  dire(semaine.moment === 'bilan',
    `plus aucun geste attendu → second temps (« ${semaine.moment} »)`)
  dire(semaine.recapitulatif.length === 0,
    '⛔ LES DEUX TEMPS NE S’AFFICHENT JAMAIS ENSEMBLE : le récapitulatif est vide ici')

  const b = semaine.bilan.find((x) => x.competence === 'Argumentation')
  dire(!!b, 'le bilan porte l’Argumentation')
  if (b) {
    note(`bonne surprise : ${b.bonneSurprise.join(' · ') || '(aucune)'}`)
    note(`angle mort    : ${b.angleMort.join(' · ') || '(aucun)'}`)
    note(`le reste      : confirmé ${b.confirme.length} · connu ${b.connu.length}`)
    dire(b.bonneSurprise.length > 0,
      '⭐⭐ ÉCART 1 — BIEN RÉUSSI LÀ OÙ IL ÉTAIT FAIBLE (semé : `objection_traitee`, 0,5 → 1)')
    dire(b.angleMort.length > 0,
      '⭐⭐ ÉCART 2 — MOINS BIEN RÉUSSI LÀ OÙ IL A DES FORCES (semé : `garant_present`, 1 → 0)')
    dire(b.formulationsManquantes.length === 0,
      `aucun observable élu sans \`dimension_eleve\``
      + `${b.formulationsManquantes.length ? ' — ' + b.formulationsManquantes.join(', ') : ''}`)
    const t = JSON.stringify(b)
    dire(!/garant_present|objection_traitee|lien_explicite|seuil|taux/i.test(t),
      '⛔⛔ RR4 — AUCUN CODE D’OBSERVABLE, AUCUN SEUIL, AUCUN TAUX dans ce que l’écran reçoit')
  }

  // ⭐ « Une copie non mesurée n'a ni réussite ni écart, et le silence est un
  //    mensonge » : le dépôt qu'on vient de clore ne porte AUCUNE mesure.
  dire(semaine.manque.incomplet && semaine.manque.copiesNonMesurees >= 1,
    `⭐ LE BILAN DIT CE QUI MANQUE : ${semaine.manque.copiesNonMesurees} copie(s) non encore mesurée(s)`)
  return semaine
}

// ════════════════════════════════════════════════════════════════════════════
// D. LE PROFIL — les trois mots, et les trois conditions d'une lettre
// ════════════════════════════════════════════════════════════════════════════
async function leProfil(d) {
  titre('D. ①②③ — LE PROFIL : « travaillé N fois · en progrès · prochaine étape »')

  // ── Sans le choix de l'élève : AUCUNE LETTRE ──────────────────────────────
  await ecrireLeChoixDesLettres(admin, d.eleveId, false)
  const masque = await chargerLeProfilDeLEleve(admin, d.eleveId, false)
  dire(masque.incidents.length === 0,
    `aucun incident de lecture${masque.incidents.length ? ' — ' + masque.incidents.join(' · ') : ''}`)
  dire(masque.competences.every((c) => c.lettre === null),
    '⛔ SANS LE CHOIX DE L’ÉLÈVE, AUCUNE LETTRE — « un défaut à "affiché" n’est pas un choix »')
  dire(masque.lettres.raison === 'choix_de_l_eleve',
    `la raison du silence est bien le choix (« ${masque.lettres.raison} »)`)

  // ── Avec le choix : LA LETTRE ARRIVE ──────────────────────────────────────
  await ecrireLeChoixDesLettres(admin, d.eleveId, true)
  const relu = await lireLeChoixDesLettres(admin, d.eleveId)
  dire(relu === true, '⭐ LE CHOIX SE PERSISTE ET SE RELIT (`profiles`, C6-L2)')
  const p = await chargerLeProfilDeLEleve(admin, d.eleveId, true)
  const c = p.competences.find((x) => x.competence === COMPETENCE)
  dire(!!c && c.lettre !== null,
    `⭐⭐ AVEC LES TROIS CONDITIONS RÉUNIES, LA LETTRE S’AFFICHE : « ${c?.lettre} » `
    + '— « une bascule qui ne montre jamais rien n’est pas un choix »')

  // ── ① LE DÉCOMPTE ─────────────────────────────────────────────────────────
  dire(c?.n === 6,
    `⭐ ① « travaillé ${c?.n} fois » — le décompte RÉEL des mesures qui comptent (semé : 6)`)

  // ── ② LA PROGRESSION, CALCULÉE À LA LECTURE ───────────────────────────────
  note(`progression : ${c?.progression.etat} (motif : ${c?.progression.motif ?? 'aucun'})`)
  dire(c?.progression.etat === 'progres',
    '⭐⭐ ② « EN PROGRÈS » — `ilYAProgression` a enfin un appelant de PRODUCTION, '
    + 'et il dit vrai sur un décor où un observable passe à acquis')

  // ⚠️ Et le canal ② se coupe proprement quand la fenêtre n'est pas pleine :
  //    c'est l'état de TOUS les élèves réels aujourd'hui.
  const autre = p.competences.find((x) => x.competence !== COMPETENCE && x.n < FENETRE_EVIDENCE)
  dire(!autre || autre.progression.etat === 'pas_assez_de_mesures',
    '⛔ ET IL SE TAIT QUAND IL NE SAIT PAS : une compétence sous la fenêtre rend '
    + '« pas_assez_de_mesures », jamais « en progrès »')
  if (autre) note(`exemple : ${autre.nom} — n=${autre.n}, « ${autre.progression.etat} »`)

  // ── ③ LE GESTE CONCRET ────────────────────────────────────────────────────
  dire(!!p.geste, '⭐⭐ ③ « PROCHAINE ÉTAPE » — un écran de PROFIL lit enfin '
    + '`exercices_retours.action_revision`')
  if (p.geste) {
    note(`geste : « ${p.geste.texte.slice(0, 70)}… »`)
    dire(p.geste.texte === d.geste,
      'c’est bien le texte que la chaîne a écrit — ni résumé, ni reformulé')
    dire(p.geste.texte !== d.nonPublie,
      '⛔⛔ ET LE RETOUR NON PUBLIÉ, PLUS RÉCENT, N’EST PAS SORTI — `published_at` est la porte')
    dire(!!p.geste.publieLe, `il porte sa date de publication (${p.geste.publieLe.slice(0, 10)})`)
    dire(p.geste.href.includes('/exercice/'),
      '⭐ ET IL RAMÈNE AU TRAVAIL : le geste porte le lien du déroulé')
    dire(p.geste.competence === null,
      '⚠️ AUCUNE COMPÉTENCE N’EST NOMMÉE, et c’est JUSTE : `cible_retenue` et '
      + '`cible_primaire` sont vides — « le dernier conseil que Calame t’a donné » '
      + 'est honnête, « ton geste pour l’Argumentation » ne le serait pas')
  }

  // ── RR4, sur ce que l'écran reçoit vraiment ───────────────────────────────
  const brut = JSON.stringify(p.competences)
  const interdits = ['"taux"', '"tauxFenetre"', '"serie"', '"sens"', '"reussies"',
    '"denominateur"', '"reussiesFenetre"', '"denominateurFenetre"', '"code"']
  const trouves = interdits.filter((k) => brut.includes(k))
  dire(trouves.length === 0,
    `⛔⛔ RR4 — AUCUN DES CHAMPS INTERDITS D’\`ObservableEleve\` N’ATTEINT L’ÉCRAN`
    + `${trouves.length ? ' — TROUVÉS : ' + trouves.join(', ') : ''}`)
  return p
}

// ════════════════════════════════════════════════════════════════════════════
// E. LES FICHES — six, génériques, sans un observable ni un seuil
// ════════════════════════════════════════════════════════════════════════════
async function lesFiches(d) {
  titre('E. LES FICHES — six exactement, et la septième dite plutôt qu’effacée')
  const inv = await chargerLesFichesDeCompetence(admin)
  dire(inv.incidents.length === 0,
    `aucun incident de lecture${inv.incidents.length ? ' — ' + inv.incidents.join(' · ') : ''}`)
  dire(inv.fiches.length === 6, `⭐ SIX FICHES RENDUES (${inv.fiches.length})`)
  dire(inv.ecartees.some((e) => e.competence === 'monitoring'),
    '⭐ LA SEPTIÈME LIGNE — `monitoring` — EST ÉCARTÉE AVEC SON MOTIF, jamais en silence')
  for (const e of inv.ecartees) note(`écartée : ${e.competence} — ${e.motif.slice(0, 80)}…`)
  dire(inv.fiches.every((f) => f.texte.length > 100),
    'chaque fiche porte son paragraphe « ce que la compétence regarde »')
  dire(inv.fiches.every((f) => f.dimensions.length > 0),
    'chaque fiche porte ses dimensions, en langue élève')

  const brut = JSON.stringify(inv.fiches)
  dire(!/Ni observable, ni seuil, ni décompte/.test(brut),
    '⛔ LA LIGNE DE FABRICATION EN ITALIQUE NE SORT PAS — c’est une consigne, pas le texte')
  dire(!/garant_present|lien_explicite|objection_traitee|densite_friction|savant_plaque/.test(brut),
    '⛔⛔ AUCUN CODE D’OBSERVABLE DANS LES SIX FICHES')
  dire(!/travaillé \d+ fois|acquis|ta lettre/i.test(brut),
    '⛔⛔ LA FICHE EST GÉNÉRIQUE : elle ne parle jamais de CET élève-là')

  // ── « Servie une fois — à la rentrée » ────────────────────────────────────
  await admin.from('profiles')
    .update({ fiches_competences_servies_at: null }).eq('id', d.eleveId)
  dire((await fichesDejaServies(admin, d.eleveId)) === false,
    'avant le premier passage, la fiche n’est PAS servie — la tuile de découverte s’allume')
  await marquerLesFichesServies(admin, d.eleveId, MAINTENANT.toISOString())
  dire((await fichesDejaServies(admin, d.eleveId)) === true,
    '⭐ APRÈS LE PREMIER PASSAGE, LA MARQUE EST POSÉE — la tuile s’éteint')
  const avant = verifie('marque', await admin.from('profiles')
    .select('fiches_competences_servies_at').eq('id', d.eleveId).maybeSingle())
  await marquerLesFichesServies(admin, d.eleveId, new Date(Date.now() + 60_000).toISOString())
  const apres = verifie('marque', await admin.from('profiles')
    .select('fiches_competences_servies_at').eq('id', d.eleveId).maybeSingle())
  dire(avant.fiches_competences_servies_at === apres.fiches_competences_servies_at,
    '⚠️ ET ELLE EST IDEMPOTENTE : un second passage ne réécrit pas la date du premier')
}

// ════════════════════════════════════════════════════════════════════════════
// F. LE RETRAIT — ce qu'on a semé s'en va, ce qu'on a emprunté revient
// ════════════════════════════════════════════════════════════════════════════
async function retirer() {
  titre('F. Le retrait')
  if (!fs.existsSync(REGISTRE)) {
    note('aucun registre — on balaie tout de même PAR LA MARQUE.')
    await balayer()
    return
  }
  const r = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))

  for (const [table, ids] of [
    ['competences_mesures', r.mesures], ['exercices_retours', r.retours],
    ['exercices_depots', r.depots], ['exercices', r.exercices],
  ]) {
    if (!ids?.length) continue
    const { error } = await admin.from(table).delete().in('id', ids)
    note(error ? `⚠️ ${table} : ${error.message}` : `${table} : ${ids.length} ligne(s) retirée(s)`)
  }

  // ⭐⭐ LE NIVEAU REVIENT À CE QU'IL ÉTAIT, `null` COMPRIS. « Une recette qui
  //    remet un interrupteur en écrivant une constante ne le remet pas : elle
  //    l'impose. »
  if (r.niveau) {
    if (!r.niveau.existait) {
      const { error } = await admin.from('competences_niveaux').delete()
        .eq('eleve_id', r.eleveId).eq('competence', r.cycle ? 'argumentation' : 'argumentation')
      note(error ? `⚠️ niveau : ${error.message}` : 'niveau RETIRÉ (il n’existait pas avant)')
    } else {
      const { error } = await admin.from('competences_niveaux').update({
        lettre: r.niveau.avant.lettre,
        lettre_initiale: r.niveau.avant.lettre_initiale,
        profil_provisoire: r.niveau.avant.profil_provisoire,
        ancre_derniere_date: r.niveau.avant.ancre_derniere_date,
        ancre_derniere_valeur: r.niveau.avant.ancre_derniere_valeur,
      }).eq('eleve_id', r.eleveId).eq('competence', 'argumentation')
      note(error ? `⚠️ niveau : ${error.message}`
        : `niveau REPOSÉ tel qu’il était (lettre ${r.niveau.avant.lettre ?? 'null'}, `
          + `provisoire ${r.niveau.avant.profil_provisoire})`)
    }
  }

  // ⭐ LES DEUX MARQUES DE `profiles` REVIENNENT TELLES QUE TROUVÉES, `null` compris.
  if (r.profil) {
    const { error } = await admin.from('profiles').update({
      competences_lettres_affichees: r.profil.competences_lettres_affichees,
      fiches_competences_servies_at: r.profil.fiches_competences_servies_at,
    }).eq('id', r.eleveId)
    note(error ? `⚠️ marques : ${error.message}`
      : `marques REPOSÉES telles que trouvées (lettres `
        + `${r.profil.competences_lettres_affichees ?? 'null'}, service `
        + `${r.profil.fiches_competences_servies_at ?? 'null'})`)
  }

  fs.unlinkSync(REGISTRE)
  note('registre effacé')
  await balayer()
}

/**
 * ⭐⭐ LE BALAYAGE PAR LA MARQUE — le filet sous le registre.
 *
 * ⛔ UN DÉCOR QU'ON NE SAIT RETROUVER QUE PAR UN FICHIER LOCAL N'EST PAS
 *    RETIRABLE. Le registre disparaît avec une interruption, un `| head`
 *    (SIGPIPE), un `rm` distrait. La marque, elle, est EN BASE.
 *
 * ⚠️ IL NE TOUCHE QUE CE QUI PORTE LA MARQUE : les instances dont la consigne la
 *    cite, et les mesures dont `instrument_version` la porte. Les dépôts et les
 *    retours partent par cascade avec leur instance. ⛔ Aucune ligne réelle ne
 *    peut y passer — une mesure réelle porte une version d'instrument (« 4.3 »,
 *    « 3.2 »), jamais le nom d'une recette.
 */
async function balayer() {
  const restes = verifie('mesures marquées', await admin
    .from('competences_mesures').select('id').eq('instrument_version', MARQUE))
  if (restes?.length) {
    const { error } = await admin.from('competences_mesures').delete()
      .eq('instrument_version', MARQUE)
    note(error ? `⚠️ balayage des mesures : ${error.message}`
      : `balayage : ${restes.length} mesure(s) marquée(s) retirée(s)`)
  }
  // ⚠️ `consigne_instanciee` est un JSONB (`07-` §1.1) : le `like` de PostgREST
  //    ne s'y applique pas (« operator does not exist: jsonb ~~ unknown »). On
  //    filtre donc EN JS, sur une lecture bornée aux instances de la maison.
  const toutes = verifie('instances', await admin
    .from('exercices').select('id, consigne_instanciee').eq('lieu', 'maison'))
  const instances = (toutes ?? []).filter((e) =>
    JSON.stringify(e.consigne_instanciee ?? '').includes(MARQUE))
  if (instances.length) {
    // Les dépôts (et leurs retours) partent par cascade avec l'instance.
    const { error: eDep } = await admin.from('exercices_depots').delete()
      .in('exercice_id', instances.map((i) => i.id))
    if (eDep) note(`⚠️ balayage des dépôts : ${eDep.message}`)
    const { error } = await admin.from('exercices').delete()
      .in('id', instances.map((i) => i.id))
    note(error ? `⚠️ balayage des instances : ${error.message}`
      : `balayage : ${instances.length} instance(s) marquée(s) retirée(s)`)
  }
  if (!restes?.length && !instances.length) note('balayage : aucun reste marqué')
}

// ════════════════════════════════════════════════════════════════════════════
if (a('retire')) {
  try { await retirer() } catch (e) { console.error(`\n✗ ${e.message}`); process.exit(1) }
  process.exit(0)
}

if (a('decor-ecran')) {
  try {
    const d = await semer()
    await ecrireLeChoixDesLettres(admin, d.eleveId, true)
    await admin.from('profiles').update({ fiches_competences_servies_at: null }).eq('id', d.eleveId)
    console.log(`\n${'═'.repeat(78)}`)
    console.log('⭐ DÉCOR SEMÉ ET NON CONSOMMÉ — à voir à l’écran, connecté en ÉLÈVE :')
    console.log(`   élève : ${d.nom}`)
    console.log('   1. http://localhost:3000/eleve — la tuile « Mes exercices de la semaine »')
    console.log('      (née de l’ASSIGNATION), et la tuile « Les six compétences »')
    console.log('   2. cliquez-la → http://localhost:3000/eleve/semaine : le récapitulatif,')
    console.log('      la frise, puis la liste — chaque ligne mène au déroulé à six temps')
    console.log('   3. http://localhost:3000/eleve/moi — « travaillé 6 fois · en progrès »,')
    console.log('      la prochaine étape, et LA BASCULE DES LETTRES (les deux sens)')
    console.log('   4. http://localhost:3000/eleve/moi/competences — les six fiches')
    console.log('   ⛔ Les lettres de Fragments ne doivent PLUS être au tableau de bord,')
    console.log('      et doivent l’être encore dans le module Fragments (« Ton parcours »).')
    console.log(`\n   retrait : node … scripts/recette/couture-c6l2.mjs --retire`)
  } catch (e) { console.error(`\n✗ ${e.message}`); process.exit(1) }
  process.exit(0)
}

let decor = null
try {
  decor = await semer()
  await lesCanaux(decor)
  await leProfil(decor)
  await leBilan(decor)
  await lesFiches(decor)
} catch (e) {
  console.error(`\n✗ ${e.message}`)
  console.error(e.stack)
  ko++
} finally {
  if (!GARDE_LE_DECOR) {
    try { await retirer() } catch (e) { console.error(`\n⚠️ retrait incomplet : ${e.message}`) }
  } else {
    console.log(`\n⛔ \`--garde-le-decor\` : le décor RESTE. Retrait :`
      + `\n   node … scripts/recette/couture-c6l2.mjs --retire`)
  }
}

console.log(`\n${'═'.repeat(78)}`)
console.log(`COUTURE C6-L2 — ${ok} vert(s), ${ko} rouge(s)`)
console.log(ko === 0
  ? '⭐ LA COUTURE TIENT : ce que la chaîne a mesuré et écrit atteint l’œil de l’élève, '
    + 'et son clic le ramène au travail.'
  : '✗ la couture a un trou — il est ci-dessus, avec sa ligne.')
process.exit(ko === 0 ? 0 : 1)
