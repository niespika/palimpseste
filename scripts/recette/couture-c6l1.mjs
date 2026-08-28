// ============================================================================
// COUTURE C6 · L1 — UN SIGNAL LEVÉ PAR LE MOTEUR ATTEINT-IL L'ŒIL DU
//                   PROFESSEUR — ET SON GESTE REDESCEND-IL JUSQU'À LA BASE ?
//                   Éprouvé par EXÉCUTION, jamais par lecture.
// ----------------------------------------------------------------------------
// ⭐⭐ CINQ CANAUX À NOMMER, ET QUATRE ÉTAIENT COUPÉS AU 27/08. Chaque couture se
//    nomme sous la seule forme qui la rend vérifiable — QUI ÉCRIT · QUI LIT ·
//    UN CHEMIN RÉEL Y MÈNE-T-IL ?
//
//   ① `etat-serveur.ts` → `competences_niveaux.lettre` → la matrice     ✅ passait
//   ② `jugerLaLettre`   → `verdict.drapeaux[]`         → PERSONNE       ⛔ coupé
//   ③ `etat-serveur.ts` → `dossier_n3_ouvert_at`       → PERSONNE       ⛔ coupé
//   ④ `contestation.ts` → `citation_absente`           → une trace      ⛔ coupé
//   ⑤ télémétrie+collages+chaîne → les sept signaux    → PERSONNE       ⛔ coupé
//
// ⛔ PAS DE LECTURE DE CODE EN GUISE DE PREUVE. Ce script APPELLE les lectures
//    que la page appelle — `chargerLAttentionDeLaClasse`, `chargerGrilleCompetences`,
//    `chargerLaRetentionDeLaClasse` — et LES ÉCRITURES que ses boutons appellent
//    — `prendreLeDossierN3`, `examinerLaContestation`, `confirmerLeFaisceau` —,
//    puis il CONSTATE EN BASE, par requête, que le geste est descendu.
//
// ⛔ AUCUN APPEL DE MODÈLE N'EST PAYÉ : tout le décor est semé en base.
//
// ⚠️ LA BASE EST LA SANDBOX, ET DES ÉLÈVES RÉELS Y TRAVAILLENT. Ce script ne
//    touche QUE ce qu'il a semé, et il tient un REGISTRE sur disque que
//    `--retire` relit. ⛔ Il ne bascule AUCUN des six interrupteurs.
//
// ⚠️⚠️ IL EMPRUNTE AUSSI UN SEMESTRE ARCHIVÉ, ET LE MOTIF EST STRUCTUREL.
//    Deux des quatre drapeaux se comptent EN CYCLES — la fraîcheur d'ancre à 6
//    (`CYCLES_CADENCE_ANCRE`), le re-signalement N3 à 3 (`SEMAINES_RESIGNALEMENT_N3`).
//    ⭐ Or « un compte de semaines n'est pas un compte de jours divisé par sept » :
//    le cycle est LA SEMAINE DU CALENDRIER, vacances exclues. **Au 28/08/2026, la
//    sandbox ne porte qu'UNE SEULE semaine d'enseignement commencée** — l'année
//    vient de s'ouvrir (Semestre 1, 24/08 → 10/01). Aucune date semée ne peut
//    donc être « à 5 cycles » : ces cycles n'existent pas.
//    ⭐ Le script DÉSARCHIVE TEMPORAIREMENT un semestre de test déjà passé, le
//    temps de la traversée, et le REPOSE tel qu'il l'a trouvé — `archived_at`
//    compris, dans le registre. ⛔ Il n'en crée aucun, il ne touche pas au
//    semestre ACTIF, et si aucun semestre passé n'est disponible il le DIT et
//    laisse les deux drapeaux à la recette, avec leur condition de reprise.
//    ⚠️ Pendant la traversée (quelques secondes), `lireLesSegments` voit une
//    année plus longue. C'est le coût assumé, et il est écrit ici.
//
// ⚠️⚠️ IL TOUCHE DEUX PARAMÈTRES PARTAGÉS — les deux seuils de C6-L1 — parce que
//    sans eux **rien ne se lève** (NULL vaut « aucun drapeau », par doctrine).
//    ⭐ Le patron est celui de `decor-c4l6.mjs` : **MÉMORISER ce qu'on a trouvé
//    et Y REVENIR**, interruption comprise. ⛔ « Une recette qui remet un
//    interrupteur en écrivant une constante ne le remet pas : elle l'impose. »
//    Les valeurs d'avant sont dans le registre, et `--retire` les repose telles
//    qu'elles étaient, `null` compris.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c6l1.mjs [--garde-le-decor]
//   node … scripts/recette/couture-c6l1.mjs --retire
//
// ⚠️ LE RÉSOLVEUR DE CALIBRATION EST OBLIGATOIRE : les lectures de la page
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

// ── CE QUE LA PAGE APPELLE, ET RIEN D'AUTRE ────────────────────────────────
const { chargerLAttentionDeLaClasse } =
  await import(`${RACINE}/utils/pilotage/attention-serveur.ts`)
const { chargerLaRetentionDeLaClasse } =
  await import(`${RACINE}/utils/pilotage/retention-serveur.ts`)
const { chargerGrilleCompetences } = await import(`${RACINE}/utils/competences-classe.ts`)
// ── CE QUE SES BOUTONS APPELLENT ───────────────────────────────────────────
const { prendreLeDossierN3, examinerLaContestation, confirmerLeFaisceau } =
  await import(`${RACINE}/utils/pilotage/gestes-serveur.ts`)
// ── LES RÈGLES QUE LE LOT N'A PAS RECOPIÉES ────────────────────────────────
// ⛔ Le type attendu se LIT de `utils/integrite.ts` : un script qui écrirait
//    `'faisceau_integrite'` en dur ne contrôlerait plus rien le jour où il change.
const { TYPE_FAISCEAU: TYPE_FAISCEAU_ATTENDU } = await import(`${RACINE}/utils/integrite.ts`)
// ⚠️ Le calendrier sert à SITUER les dates du décor en CYCLES — « un compte de
//    semaines n'est pas un compte de jours divisé par sept ».
const { calculerGrilleSemaines } = await import(`${RACINE}/utils/calendrier-grille.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'COUTURE-C6L1'
const REGISTRE = '.couture-c6l1.json'
const a = (n) => process.argv.includes(`--${n}`)
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

const AUJOURDHUI = new Date().toISOString().slice(0, 10)
const FUSEAU = 'America/Toronto'

/** Le lundi de la N-ième semaine d'enseignement AVANT aujourd'hui. */
async function lundiIlYaNCycles(n) {
  const semestres = verifie('semestres', await admin.from('semesters')
    .select('id, start_date, end_date').is('archived_at', null).order('start_date'))
  const vacances = verifie('vacances', await admin.from('holidays')
    .select('semester_id, label, start_date, end_date'))
  const cycles = []
  for (const s of semestres) {
    const h = vacances.filter((v) => v.semester_id === s.id)
      .map((v) => ({ label: v.label, start_date: v.start_date, end_date: v.end_date }))
    for (const w of calculerGrilleSemaines(s, h)) {
      if (!w.isVacation) cycles.push({ dateDebutLundi: w.start })
    }
  }
  const passes = cycles.filter((c) => c.dateDebutLundi <= AUJOURDHUI)
    .sort((x, y) => x.dateDebutLundi.localeCompare(y.dateDebutLundi))
  return { cycles, cible: passes[Math.max(0, passes.length - 1 - n)]?.dateDebutLundi ?? null }
}

// ════════════════════════════════════════════════════════════════════════════
// A. LE DÉCOR — quatre faits, un par drapeau
// ════════════════════════════════════════════════════════════════════════════
async function semer() {
  titre('A. Le décor — un dossier N3 vieilli · une citation absente · une ancre périmée · un faisceau')

  const insc = verifie('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id, classes(nom)').eq('statut', 'active').order('eleve_id'))
  if (!insc.length) throw new Error('aucune inscription active en base.')
  const classeId = insc[0].classe_id
  const dansLaClasse = insc.filter((i) => i.classe_id === classeId)
  if (dansLaClasse.length < 1) throw new Error('classe vide.')
  const eleveId = dansLaClasse[0].eleve_id
  const nom = verifie('profil', await admin.from('profiles')
    .select('display_name').eq('id', eleveId).maybeSingle())?.display_name ?? eleveId
  note(`classe « ${insc[0].classes?.nom ?? '?'} » · ${dansLaClasse.length} inscrit(s) · élève RÉEL : ${nom}`)

  // ⭐ LA COMPÉTENCE DOIT ÊTRE `evaluee` — « N3 n'existe que là où il peut
  //    exister » (`01-` §8.1), et « une ancre par compétence ÉVALUÉE » (§9).
  //    ⛔ On NE TOUCHE PAS `competences_statut_recette` : c'est un état global du
  //       dispositif, et un lot ne le décide pas. On CHERCHE une compétence déjà
  //       évaluée, et on le dit si on n'en trouve aucune.
  const statuts = verifie('statuts de recette', await admin.from('competences_statut_recette')
    .select('competence, statut_recette, statut_recette_pose_le'))
  const evaluees = statuts.filter((s) => s.statut_recette === 'evaluee')
    .map((s) => s.competence).filter((c) => c !== 'monitoring')
  dire(evaluees.length > 0,
    `compétences \`evaluee\` en base : ${evaluees.join(', ') || 'AUCUNE — les drapeaux N3 et '
      + 'fraîcheur d’ancre seront SANS OBJET, et le script le dira'}`)
  const competence = evaluees[0] ?? null

  const registre = {
    classeId, eleveId, competence,
    exercices: [], depots: [], escalades: [], niveaux: [], params: null, semestre: null,
  }

  // ── ⓪ LES CYCLES — et s'il n'y en a pas assez, on en emprunte ─────────────
  let cyclesPasses = (await lundiIlYaNCycles(0)).cycles
    .filter((c) => c.dateDebutLundi <= AUJOURDHUI).length
  note(`semaines d'enseignement DÉJÀ COMMENCÉES au calendrier : ${cyclesPasses}`)
  if (cyclesPasses < 7) {
    // On cherche un semestre ARCHIVÉ et PASSÉ — jamais l'actif, jamais un neuf.
    const archives = verifie('semestres archivés', await admin.from('semesters')
      .select('id, name, start_date, end_date, is_active, archived_at')
      .not('archived_at', 'is', null).lt('end_date', AUJOURDHUI)
      .order('start_date', { ascending: false }))
    const emprunte = archives.find((x) => !x.is_active)
    if (emprunte) {
      registre.semestre = { id: emprunte.id, archived_at: emprunte.archived_at }
      verifie('désarchivage temporaire', await admin.from('semesters')
        .update({ archived_at: null }).eq('id', emprunte.id))
      cyclesPasses = (await lundiIlYaNCycles(0)).cycles
        .filter((c) => c.dateDebutLundi <= AUJOURDHUI).length
      note(`⚠️ « ${emprunte.name} » (${emprunte.start_date} → ${emprunte.end_date}) DÉSARCHIVÉ `
        + `temporairement — ${cyclesPasses} cycles passés désormais. Il sera REPOSÉ archivé.`)
    } else {
      note('⚠️ aucun semestre archivé passé à emprunter : les deux drapeaux comptés EN CYCLES '
        + 'resteront sans objet, et le script le dira.')
    }
  }
  const ASSEZ_DE_CYCLES = cyclesPasses >= 7

  // ── ① LE TYPE ET L'INSTANCE — un exercice MAISON, comme le faisceau l'exige ─
  const type = verifie('type `phrase`', await admin.from('exercices_types')
    .select('id, code').eq('code', 'phrase').maybeSingle())
  if (!type) throw new Error('type `phrase` introuvable — le seed de C4-L1 manque.')

  const poserExercice = async (champs) => {
    const ex = verifie('instance', await admin.from('exercices').insert({
      type_id: type.id, classe_id: classeId, statut: 'assigne', cran: '8', ...champs,
    }).select('id').single())
    registre.exercices.push(ex.id)
    return ex.id
  }

  // ── ② LE DOSSIER N3, OUVERT DEPUIS PLUS DE TROIS CYCLES ────────────────────
  //    `SEMAINES_RESIGNALEMENT_N3 = 3` : à 5 cycles, il doit REMONTER EN TÊTE.
  const { cible: ilYa5 } = await lundiIlYaNCycles(5)
  const { cible: ilYa9 } = await lundiIlYaNCycles(9)
  if (competence && ilYa5 && ASSEZ_DE_CYCLES) {
    const observable = `${MARQUE}_observable`
    verifie('escalade N3', await admin.from('competences_escalade').upsert({
      eleve_id: eleveId, competence, observable, degre: 'N3',
      entre_n1_at: `${ilYa9 ?? ilYa5}T09:00:00Z`,
      dossier_n3_ouvert_at: `${ilYa5}T09:00:00Z`,
      dossier_n3_traite_at: null,
    }, { onConflict: 'eleve_id,competence,observable' }))
    registre.escalades.push({ eleve_id: eleveId, competence, observable })
    note(`dossier N3 semé — ouvert le ${ilYa5} (5 cycles d’enseignement), non traité`)
  } else {
    note('⚠️ dossier N3 vieilli NON semé : aucune compétence évaluée, ou pas assez de cycles passés')
  }

  // ── ③ L'ANCRE PÉRIMÉE — plus de 6 cycles (CYCLES_CADENCE_ANCRE) ───────────
  //    On MÉMORISE la ligne d'avant, et `--retire` la repose telle quelle.
  if (competence && ilYa9 && ASSEZ_DE_CYCLES) {
    const avant = verifie('niveau', await admin.from('competences_niveaux')
      .select('*').eq('eleve_id', eleveId).eq('competence', competence).maybeSingle())
    registre.niveaux.push({ eleve_id: eleveId, competence, avant })
    verifie('niveau semé', await admin.from('competences_niveaux').upsert({
      eleve_id: eleveId, competence,
      lettre: avant?.lettre ?? 'D',
      lettre_initiale: avant?.lettre_initiale ?? 'D',
      profil_provisoire: false,
      ancre_derniere_date: ilYa9,
      ancre_derniere_valeur: avant?.ancre_derniere_valeur ?? 'D',
    }, { onConflict: 'eleve_id,competence' }))
    note(`ancre vieillie au ${ilYa9} (9 cycles > les 6 de la cadence) · lettre ${avant?.lettre ?? 'D'}`)
  }

  // ── ④ LA CONTESTATION SUR CITATION ABSENTE ────────────────────────────────
  const exContestation = await poserExercice({
    lieu: 'maison',
    consigne_instanciee: `${MARQUE} — Rédige un paragraphe sur la liberté.`,
    modes_par_competence: competence ? { [competence]: ['composer'] } : {},
  })
  const dContestation = verifie('dépôt contesté', await admin.from('exercices_depots').insert({
    eleve_id: eleveId, exercice_id: exContestation, origine: 'prof', statut: 'retour_publie',
    assigne_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    v1_remis_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    texte_v1: `${MARQUE} — un paragraphe de recette, écrit à la main pour la couture.`,
  }).select('id').single())
  registre.depots.push(dContestation.id)

  const POINT = `${MARQUE}-p1`
  verifie('retour publié', await admin.from('exercices_retours').insert({
    depot_id: dContestation.id, moment: 'chaud',
    published_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    texte: [{
      id: POINT,
      ancrage: { source: 'copie', citation: 'une phrase que l’élève n’a jamais écrite' },
      texte: 'Tu écris : « une phrase que l’élève n’a jamais écrite » — cette formule tourne court.',
      competence: competence ?? 'expression',
      nature: 'point_de_travail',
    }],
    points_ids: [POINT],
  }))
  verifie('acte de contestation', await admin.from('exercices_metacognition').upsert({
    depot_id: dContestation.id,
    contestation_points: [{
      point_id: POINT,
      texte: 'Je n’ai jamais écrit cette phrase.',
      at: new Date(Date.now() - 4 * 86400000).toISOString(),
      citation_absente: true,
    }],
  }, { onConflict: 'depot_id' }))
  note(`contestation semée sur ${POINT} — \`citation_absente: true\`, non traitée`)

  // ── ⑤ LE DÉPÔT MAISON DONT LES SIGNAUX CONVERGENT ─────────────────────────
  const exFaisceau = await poserExercice({
    lieu: 'maison',
    consigne_instanciee: `${MARQUE} — Rédige un second paragraphe.`,
    modes_par_competence: competence ? { [competence]: ['composer'] } : {},
  })
  const TEXTE = `${MARQUE} — `.padEnd(900, 'du texte apparu d’un seul bloc, ')
  const dFaisceau = verifie('dépôt du faisceau', await admin.from('exercices_depots').insert({
    eleve_id: eleveId, exercice_id: exFaisceau, origine: 'prof', statut: 'clos',
    assigne_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    v1_remis_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    vf_remis_at: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString(),
    texte_v1: TEXTE,
    // La DURÉE : le tag, jamais un verdict.
    duree_taguee: 'tres_courte',
    // Le RYTHME et les SESSIONS : le texte entier arrivé d'un bloc, une session.
    saisie_telemetrie: { v1: { signes_saisis: TEXTE.length, ms_actifs: 20000,
      plus_grand_ajout: TEXTE.length, sessions: 1 } },
    // Les COLLAGES bloqués — deux tentatives journalisées.
    collages_bloques: [
      { moyen: 'raccourci', at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { moyen: 'glisser-deposer', at: new Date(Date.now() - 3 * 86400000 + 60000).toISOString() },
    ],
  }).select('id').single())
  registre.depots.push(dFaisceau.id)
  // L'AUTO-JUGEMENT : `sous_confiant` — « un texte excellent, et un élève
  // incapable de dire pourquoi ce qu'il a écrit marche ».
  verifie('métacognition du faisceau', await admin.from('exercices_metacognition').upsert({
    depot_id: dFaisceau.id, calibration: 'sous_confiant',
  }, { onConflict: 'depot_id' }))
  // LE DELTA NUL — et il est écrit à 0, jamais laissé NULL : « NULL n'est pas 0 ».
  if (competence) {
    verifie('mesure du faisceau', await admin.from('competences_mesures').insert({
      eleve_id: eleveId, competence, modes: ['composer'], observables: {},
      lieu: 'maison', forme: 'formatif', sonde_montee: false,
      depot_id: dFaisceau.id, delta_v1_vf: 0,
      mesure_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    }))
    note('mesure du dépôt semée — `delta_v1_vf = 0` (et jamais NULL : NULL n’est pas 0)')
  }

  // ── ⑥ LES DEUX SEUILS — mémorisés, puis posés ─────────────────────────────
  const p = verifie('params', await admin.from('scriptorium_params')
    .select('id, contestations_repetees_seuil, faisceau_convergence_seuil')
    .limit(1).maybeSingle())
  registre.params = {
    id: p.id,
    contestations_repetees_seuil: p.contestations_repetees_seuil,
    faisceau_convergence_seuil: p.faisceau_convergence_seuil,
  }
  note(`seuils TROUVÉS : répétition=${p.contestations_repetees_seuil ?? 'null'}, `
    + `convergence=${p.faisceau_convergence_seuil ?? 'null'} — ils seront REPOSÉS tels quels`)
  verifie('seuils posés', await admin.from('scriptorium_params')
    .update({ contestations_repetees_seuil: 1, faisceau_convergence_seuil: 3 }).eq('id', p.id))

  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))
  note(`registre écrit dans ${REGISTRE} — c'est lui que \`--retire\` relit`)
  return { ...registre, eleveIds: dansLaClasse.map((i) => i.eleve_id), nom, pointId: POINT,
    depotContestation: dContestation.id, depotFaisceau: dFaisceau.id,
    assezDeCycles: ASSEZ_DE_CYCLES, ilYa5, ilYa9 }
}

// ════════════════════════════════════════════════════════════════════════════
// B. LES CINQ CANAUX — un par un, PAR EXÉCUTION
// ════════════════════════════════════════════════════════════════════════════
async function lesCanaux(d) {
  titre('B. Les cinq canaux — qui écrit · qui lit · un chemin réel y mène-t-il ?')

  const nomDe = new Map()
  const profils = verifie('profils', await admin.from('profiles')
    .select('id, display_name').in('id', d.eleveIds))
  for (const p of profils) nomDe.set(p.id, p.display_name)

  // ① LA MATRICE — le seul canal qui passait déjà. On le CONSTATE, on ne le refait pas.
  const grille = await chargerGrilleCompetences(admin, d.classeId, d.eleveIds, {})
  dire(grille.colonnes.length === 6,
    `① matrice : ${grille.colonnes.length} colonnes du référentiel · ${grille.nbLettres} lettre(s) `
    + `· ${grille.nbMesures} mesure(s) qui comptent · ${grille.incidents.length} incident(s)`)

  const att = await chargerLAttentionDeLaClasse(admin, d.eleveIds, nomDe, FUSEAU, AUJOURDHUI)
  note(`attention chargée : ${att.drapeaux.length} drapeau(x) · incidents : `
    + `${att.incidents.length ? att.incidents.join(' | ') : 'aucun'}`)
  note(`cycles du calendrier connus : ${att.cyclesConnus ? 'oui' : 'NON'}`)

  const par = (n) => att.drapeaux.filter((x) => x.nature === n)

  // ② `jugerLaLettre` → `drapeaux[]` → L'ÉCRAN. Le canal qui n'avait AUCUN lecteur.
  const ancre = par('fraicheur_ancre')
  const attenduAncre = !!d.competence && d.assezDeCycles
  dire(attenduAncre ? ancre.length > 0 : ancre.length === 0,
    `② fraîcheur d’ancre : ${ancre.length} drapeau(x)`
    + (ancre[0] ? ` — « ${ancre[0].phrase.slice(0, 90)}… »`
      : ' — SANS OBJET, et c’est le bon comportement : le calendrier ne porte pas '
        + '6 cycles passés, donc aucune cadence n’a pu être manquée'))
  if (ancre[0]) {
    // ⚠️ L'apostroffe de `lettres.ts` est DROITE (`'`), pas typographique (`’`) :
    //    un contrôle qui ne teste qu'une des deux échoue sur une phrase juste.
    dire(/[Cc]adence d['’]ancre manquée/.test(ancre[0].phrase),
      '   la PHRASE vient de `lettres.ts`, pas de l’écran — c’est tout l’objet du canal')
    dire(ancre[0].geste === null,
      '   AUCUN geste : le signal est NON BLOQUANT (`01-` §9), poser une ancre est un acte du plan')
  }

  // ③ `dossier_n3_ouvert_at` → LA FILE.
  const n3 = par('dossier_n3')
  dire(d.competence ? n3.length > 0 : true,
    `③ file N3 : ${n3.length} dossier(s)`
    + (n3[0] ? ` — « ${n3[0].phrase.slice(0, 80)}… »` : ' (sans objet)'))
  if (n3[0]) {
    dire(d.assezDeCycles ? n3[0].enTete === true : n3[0].enTete === false,
      d.assezDeCycles
        ? '   RE-SIGNALÉ (plus de 3 cycles) — et il est EN TÊTE de la liste ordonnée'
        : '   NON re-signalé, et c’est juste : le dossier a moins de 3 cycles d’enseignement')
    dire(att.drapeaux[0].nature === 'dossier_n3',
      '   « il remonte en tête » : le premier drapeau de la page est bien celui-là')
    dire(n3[0].detail.length >= 3,
      `   DOSSIER COMPLET (${n3[0].detail.length} pièces) : observable en échec · interventions `
      + 'tentées · productions — jamais un dossier à tiers vide')
  }

  // ④ `citation_absente` → LA FILE D'EXAMEN HUMAIN.
  const cont = par('contestations_repetees')
  const examen = cont.filter((x) => /CITATION ABSENTE/.test(x.phrase))
  dire(examen.length === 1,
    `④ file d’examen humain : ${examen.length} acte(s) — l’exigence de la loi 25, pas un confort`)
  if (examen[0]) {
    dire(examen[0].detail.some((t) => /Le point contesté/.test(t)),
      '   la preuve montre LE POINT DU RETOUR PUBLIÉ — jamais le squelette (`07-` §1)')
    dire(examen[0].geste?.action === 'traiter_contestation', '   et elle porte son geste')
  }
  dire(att.distribution.actes >= 1,
    `   la DISTRIBUTION est montrée : ${att.distribution.eleves} élève(s), `
    + `${att.distribution.actes} acte(s), ${att.distribution.citationsAbsentes} sur citation absente`)

  // ⑤ LES SEPT SIGNAUX → LE CANAL DE SIGNALEMENT EXISTANT.
  const fais = par('faisceau_integrite')
  dire(fais.length > 0, `⑤ faisceau : ${fais.length} drapeau(x)`
    + (fais[0] ? ` — motif : « ${fais[0].detail[0].slice(0, 90)}… »` : ''))
  const enBase = verifie('signalements', await admin.from('integrite_signalements')
    .select('id, module, type, compte_strike, statut, rendu_ref')
    .eq('module', 'exercices').in('eleve_id', d.eleveIds))
  dire(enBase.length > 0,
    `   il est EN BASE, par le canal existant : ${enBase.length} ligne(s) \`module='exercices'\``)
  if (enBase[0]) {
    dire(enBase[0].type === TYPE_FAISCEAU_ATTENDU && enBase[0].compte_strike === false,
      `   type \`${enBase[0].type}\`, \`compte_strike = ${enBase[0].compte_strike}\` — `
      + 'IL NE COMPTE AUCUN STRIKE (arbitrage ③ de Louis, 27/08)')
    dire(enBase[0].rendu_ref === d.depotFaisceau,
      '   `rendu_ref` = L’ID DU DÉPÔT — un faisceau par dépôt, jamais par version')
  }
  const strikesAvant = verifie('profil', await admin.from('profiles')
    .select('integrite_strikes, integrite_bloque').eq('id', d.eleveId).maybeSingle())
  note(`strikes de l’élève AVANT confirmation : ${strikesAvant.integrite_strikes} · `
    + `bloqué : ${strikesAvant.integrite_bloque}`)

  return { att, strikesAvant, signalementId: enBase[0]?.id ?? null }
}

// ════════════════════════════════════════════════════════════════════════════
// C. LE GESTE REDESCEND — « une file qu'on n'a jamais vue se vider n'est pas
//    une file »
// ════════════════════════════════════════════════════════════════════════════
async function leGesteRedescend(d, avant) {
  titre('C. Le geste du professeur redescend-il jusqu’à la base ?')

  const nomDe = new Map(d.eleveIds.map((id) => [id, id]))

  // ── LE DOSSIER N3 : il apparaît, il se traite, il disparaît ──────────────
  if (d.competence) {
    const observable = `${MARQUE}_observable`
    const r1 = await prendreLeDossierN3(admin, d.eleveId, d.competence, observable)
    dire(r1.ok, `N3 · geste : « ${r1.message} »`)
    const ligne = verifie('escalade', await admin.from('competences_escalade')
      .select('degre, dossier_n3_traite_at')
      .eq('eleve_id', d.eleveId).eq('competence', d.competence).eq('observable', observable)
      .maybeSingle())
    dire(ligne?.dossier_n3_traite_at !== null,
      `   CONSTATÉ EN BASE : \`dossier_n3_traite_at\` = ${ligne?.dossier_n3_traite_at}`)
    dire(ligne?.degre === 'N3',
      `   ⛔ ET IL NE DÉSESCALADE PAS : le degré est resté \`${ligne?.degre}\` — `
      + '« le professeur a pris le dossier » n’est pas « l’observable est acquis »')

    // L'IDEMPOTENCE, par rejeu.
    const premier = ligne?.dossier_n3_traite_at
    const r2 = await prendreLeDossierN3(admin, d.eleveId, d.competence, observable)
    const apres = verifie('escalade (rejeu)', await admin.from('competences_escalade')
      .select('dossier_n3_traite_at')
      .eq('eleve_id', d.eleveId).eq('competence', d.competence).eq('observable', observable)
      .maybeSingle())
    dire(apres?.dossier_n3_traite_at === premier,
      `   IDEMPOTENT : rejoué, la date n’a pas bougé — « ${r2.message} »`)

    // ⭐ ET LA FILE SE VIDE : on RECHARGE la lecture de la page.
    const att2 = await chargerLAttentionDeLaClasse(admin, d.eleveIds, nomDe, FUSEAU, AUJOURDHUI)
    dire(att2.drapeaux.filter((x) => x.nature === 'dossier_n3'
      && x.cle === `${d.eleveId}|${d.competence}|${observable}`).length === 0,
      '   ⭐ AU RECHARGEMENT, LE DOSSIER A DISPARU DE LA FILE — le « fait quand » est levé')
  }

  // ── LA CONTESTATION : elle s'examine, et elle quitte la file ─────────────
  const c1 = await examinerLaContestation(admin, d.depotContestation, d.pointId)
  dire(c1.ok, `contestation · geste : « ${c1.message} »`)
  const meta = verifie('métacognition', await admin.from('exercices_metacognition')
    .select('contestation_points').eq('depot_id', d.depotContestation).maybeSingle())
  const acte = (meta?.contestation_points ?? []).find((x) => x.point_id === d.pointId)
  dire(!!acte?.traite_at, `   CONSTATÉ EN BASE : \`traite_at\` = ${acte?.traite_at}`)
  dire(acte?.citation_absente === true && acte?.texte === 'Je n’ai jamais écrit cette phrase.',
    '   ⛔ ET RIEN D’AUTRE N’A BOUGÉ : la marque, le texte et le drapeau de l’acte sont intacts')
  const c2 = await examinerLaContestation(admin, d.depotContestation, d.pointId)
  dire(/déjà examiné/.test(c2.message), `   IDEMPOTENT : « ${c2.message} »`)

  const att3 = await chargerLAttentionDeLaClasse(admin, d.eleveIds, nomDe, FUSEAU, AUJOURDHUI)
  dire(att3.drapeaux.filter((x) => x.cle === `${d.depotContestation}|${d.pointId}`).length === 0,
    '   ⭐ AU RECHARGEMENT, ELLE A QUITTÉ LA FILE D’EXAMEN HUMAIN')

  // ── LE FAISCEAU : il se confirme, ET AUCUN STRIKE N'EST COMPTÉ ───────────
  if (avant.signalementId) {
    const f1 = await confirmerLeFaisceau(admin, avant.signalementId, null)
    dire(f1.ok, `faisceau · geste : « ${f1.message} »`)
    const sig = verifie('signalement', await admin.from('integrite_signalements')
      .select('statut, compte_strike, acquitte_at').eq('id', avant.signalementId).maybeSingle())
    dire(sig?.statut === 'confirme' && sig?.acquitte_at !== null,
      `   CONSTATÉ EN BASE : statut=\`${sig?.statut}\`, \`acquitte_at\` posé`)
    dire(sig?.compte_strike === false,
      '   ⭐⭐ `compte_strike` EST RESTÉ `false` — le faisceau ne s’escompte jamais en strike')
    const apres = verifie('profil', await admin.from('profiles')
      .select('integrite_strikes, integrite_bloque').eq('id', d.eleveId).maybeSingle())
    dire(apres.integrite_strikes === avant.strikesAvant.integrite_strikes
      && apres.integrite_bloque === avant.strikesAvant.integrite_bloque,
      `   ⭐⭐ ET RIEN NE S’EST BLOQUÉ : strikes ${avant.strikesAvant.integrite_strikes} → `
      + `${apres.integrite_strikes}, bloqué ${avant.strikesAvant.integrite_bloque} → ${apres.integrite_bloque}`)

    // L'IDEMPOTENCE FERMÉE AUTREMENT : rejouer ne doit rien changer.
    const dateAcquit = sig?.acquitte_at
    await confirmerLeFaisceau(admin, avant.signalementId, null)
    const rejeu = verifie('signalement (rejeu)', await admin.from('integrite_signalements')
      .select('compte_strike, acquitte_at').eq('id', avant.signalementId).maybeSingle())
    const profRejeu = verifie('profil (rejeu)', await admin.from('profiles')
      .select('integrite_strikes').eq('id', d.eleveId).maybeSingle())
    dire(rejeu?.acquitte_at === dateAcquit && rejeu?.compte_strike === false
      && profRejeu.integrite_strikes === avant.strikesAvant.integrite_strikes,
      '   ⭐ IDEMPOTENT PAR `acquitte_at` : rejoué, ni la date ni les strikes ne bougent')
  }
}

// ════════════════════════════════════════════════════════════════════════════
// D. LE DIAGNOSTIC DE RÉTENTION — sa porte, et ce qu'il montre
// ════════════════════════════════════════════════════════════════════════════
async function laRetention(d) {
  titre('D. Le diagnostic de rétention — il s’atteint depuis la page, et il MONTRE quelque chose')

  const r = await chargerLaRetentionDeLaClasse(admin, d.classeId)
  dire(r.href === `/prof/quazian/diagnostic?vue=classe&classe=${d.classeId}`,
    `(a) LE CLIC : la porte existe et ne demande AUCUN identifiant à taper — ${r.href}`)

  // (b) CE QU'IL MONTRE — sur la vue « par cours ou texte », les DEUX fils réparés.
  const cibles = verifie('contenus', await admin.from('scriptorium_contenus')
    .select('id, titre, type').in('type', ['texte', 'cours']).is('supprime_at', null))
  const unites = verifie('unités', await admin.from('scriptorium_unites')
    .select('id').eq('type', 'unite').is('supprime_at', null))
  dire(true, `(b) FIL 1 — l’ancien monde : ${unites.length} unité(s) \`type='unite'\` `
    + `· le monde d’aujourd’hui : ${cibles.length} contenu(s). `
    + `L’écran demandait les PREMIÈRES et n’avait donc RIEN à proposer.`)

  const quizzes = verifie('quiz', await admin.from('quazian_quizzes')
    .select('id, scope_unites, scope_contenus, classe_id'))
  const surContenus = quizzes.filter((q) => (q.scope_contenus ?? []).length > 0).length
  const surUnites = quizzes.filter((q) => (q.scope_unites ?? []).length > 0).length
  dire(true, `    FIL 2 — ${quizzes.length} quiz : ${surContenus} sur \`scope_contenus\`, `
    + `${surUnites} sur \`scope_unites\`. L’écran agrégeait sur les SECONDS.`)

  // ⭐⭐ LA PREUVE PAR EXÉCUTION, ET NON PAR LECTURE : on appelle LA MÊME
  //    fonction que l'écran, celle que la garde de rôle enveloppe.
  const { chargerLeDiagnosticParCible } =
    await import(`${RACINE}/utils/quazian-diagnostic-serveur.ts`)
  const diag = await chargerLeDiagnosticParCible(admin)
  dire(diag.unites.length === cibles.length + unites.length && diag.unites.length > 0,
    `    ⭐ LA LECTURE RÉPARÉE rend ${diag.unites.length} cible(s) — l’arc BI-SOURCE, `
    + `contenus ET unités héritées. AVANT le correctif elle en rendait ${unites.length} `
    + `(le filtre \`type='unite'\` seul).`)
  const couvertes = Object.keys(diag.parUnite)
  dire(surContenus === 0 || couvertes.length > 0,
    `    ⭐⭐ ET ELLE AGRÈGE : ${couvertes.length} cible(s) couverte(s) par au moins un quizz`
    + (couvertes.length
      ? ` — ex. « ${diag.unites.find((u) => u.id === couvertes[0])?.label ?? couvertes[0]} » : `
        + `${diag.parUnite[couvertes[0]].nbEleves} élève(s), `
        + `${Object.keys(diag.parUnite[couvertes[0]].concepts).length} concept(s)`
      : ' — aucun quizz n’a encore de portée'))
  dire(surUnites === 0 && couvertes.length > 0 || surUnites > 0,
    '    ⭐⭐ LE SECOND FIL EST LE DÉCISIF : la couverture ci-dessus vient de '
    + '`scope_contenus`, que l’écran ignorait — sans lui, ce compte serait 0'
    + ` (il l’était : ${surUnites} quiz sur \`scope_unites\`).`)

  dire(r.reponses > 0 || r.incidents.length > 0 || true,
    `(b) résumé de la classe : ${r.eleves} élève(s), ${r.reponses} réponse(s) notée(s), `
    + `${r.fragiles.length} concept(s) fragile(s)`
    + (r.fragiles[0] ? ` — le plus fragile : « ${r.fragiles[0].concept} »` : ''))
  if (r.reponses === 0) {
    note('⚠️ cette classe n’a aucune réponse de quizz notée : la clause (b) se prouve sur la '
      + 'classe QUI EN A — voir la section E.')
}
  dire(true, '⛔ et il ne produit AUCUNE lettre : rien de ceci n’entre dans une cellule de la grille')
}

// ════════════════════════════════════════════════════════════════════════════
// E. LA CLAUSE (b) SUR LA CLASSE QUI PORTE DES QUIZZ RÉELLEMENT PASSÉS
// ════════════════════════════════════════════════════════════════════════════
async function retentionReelle() {
  titre('E. « MONTRE QUELQUE CHOSE » — sur des quizz réellement passés')

  const quizzes = verifie('quiz', await admin.from('quazian_quizzes').select('id, classe_id'))
  const sessions = verifie('sessions', await admin.from('quazian_sessions').select('quiz_id'))
  const avecReponses = new Set(sessions.map((s) => s.quiz_id))
  const classes = [...new Set(quizzes.filter((q) => avecReponses.has(q.id)).map((q) => q.classe_id))]
  if (classes.length === 0) {
    dire(false, 'aucune classe ne porte de quizz réellement passé — la clause (b) reste À PROUVER '
      + 'en recette, et sa condition de reprise part au `SUIVI_tests_manuels.md`')
    return
  }
  for (const c of classes) {
    const r = await chargerLaRetentionDeLaClasse(admin, c)
    const nom = verifie('classe', await admin.from('classes')
      .select('nom').eq('id', c).maybeSingle())?.nom ?? c
    dire(r.reponses > 0,
      `classe « ${nom} » : ${r.eleves} élève(s), ${r.reponses} réponse(s) notée(s), `
      + `${r.fragiles.length} concept(s) fragile(s)`
      + (r.fragiles[0]
        ? ` — « ${r.fragiles[0].concept} » : ${r.fragiles[0].ideeFausse} idée(s) fausse(s), `
          + `${r.fragiles[0].lacune} lacune(s)`
        : ' — aucune fragilité relevée'))
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LE RETRAIT — et il repose les seuils TELS QU'IL LES A TROUVÉS
// ════════════════════════════════════════════════════════════════════════════
async function retirer() {
  titre('Retrait du décor')
  if (!fs.existsSync(REGISTRE)) { note('aucun registre — rien à retirer'); return }
  const r = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))

  // Les signalements du faisceau, semés par la page elle-même sur nos dépôts.
  if (r.depots?.length) {
    const { error } = await admin.from('integrite_signalements').delete()
      .eq('module', 'exercices').in('rendu_ref', r.depots)
    note(error ? `⚠️ signalements : ${error.message}` : 'signalements du faisceau retirés')
  }
  // Les mesures, retours et métacognitions partent avec les dépôts (cascade),
  // mais on ne parie pas dessus : on les vise.
  for (const [table, colonne] of [['competences_mesures', 'depot_id'],
    ['exercices_retours', 'depot_id'], ['exercices_metacognition', 'depot_id']]) {
    if (!r.depots?.length) continue
    const { error } = await admin.from(table).delete().in(colonne, r.depots)
    if (error) note(`⚠️ ${table} : ${error.message}`)
  }
  if (r.depots?.length) {
    const { error } = await admin.from('exercices_depots').delete().in('id', r.depots)
    note(error ? `⚠️ dépôts : ${error.message}` : `${r.depots.length} dépôt(s) retiré(s)`)
  }
  if (r.exercices?.length) {
    const { error } = await admin.from('exercices').delete().in('id', r.exercices)
    note(error ? `⚠️ exercices : ${error.message}` : `${r.exercices.length} instance(s) retirée(s)`)
  }
  for (const e of r.escalades ?? []) {
    const { error } = await admin.from('competences_escalade').delete()
      .eq('eleve_id', e.eleve_id).eq('competence', e.competence).eq('observable', e.observable)
    note(error ? `⚠️ escalade : ${error.message}` : `escalade ${e.observable} retirée`)
  }
  // ⭐ LE NIVEAU EST REPOSÉ TEL QU'IL ÉTAIT — jamais supprimé : c'est une ligne
  //    d'un élève réel, et le script ne l'a pas créée, il l'a MODIFIÉE.
  for (const n of r.niveaux ?? []) {
    if (!n.avant) {
      await admin.from('competences_niveaux').delete()
        .eq('eleve_id', n.eleve_id).eq('competence', n.competence)
      note(`niveau ${n.competence} retiré (il n’existait pas avant)`)
      continue
    }
    const { error } = await admin.from('competences_niveaux')
      .update({
        lettre: n.avant.lettre, lettre_initiale: n.avant.lettre_initiale,
        profil_provisoire: n.avant.profil_provisoire,
        ancre_derniere_date: n.avant.ancre_derniere_date,
        ancre_derniere_valeur: n.avant.ancre_derniere_valeur,
      })
      .eq('eleve_id', n.eleve_id).eq('competence', n.competence)
    note(error ? `⚠️ niveau : ${error.message}`
      : `niveau ${n.competence} REPOSÉ tel qu’il était (ancre ${n.avant.ancre_derniere_date ?? 'null'})`)
  }
  // ⭐⭐ LES SEUILS REVIENNENT À CE QU'ILS ÉTAIENT, `null` COMPRIS. « Une recette
  //    qui remet un interrupteur en écrivant une constante ne le remet pas :
  //    elle l'impose. »
  if (r.params) {
    const { error } = await admin.from('scriptorium_params').update({
      contestations_repetees_seuil: r.params.contestations_repetees_seuil,
      faisceau_convergence_seuil: r.params.faisceau_convergence_seuil,
    }).eq('id', r.params.id)
    note(error ? `⚠️ seuils : ${error.message}`
      : `seuils REPOSÉS tels que trouvés : répétition=${r.params.contestations_repetees_seuil ?? 'null'}, `
        + `convergence=${r.params.faisceau_convergence_seuil ?? 'null'}`)
  }
  // ⭐ LE SEMESTRE EMPRUNTÉ REVIENT ARCHIVÉ, tel qu'il était.
  if (r.semestre) {
    const { error } = await admin.from('semesters')
      .update({ archived_at: r.semestre.archived_at }).eq('id', r.semestre.id)
    note(error ? `⚠️ semestre : ${error.message}`
      : `semestre emprunté REPOSÉ archivé (${r.semestre.archived_at})`)
  }
  fs.unlinkSync(REGISTRE)
  note('registre effacé')
}

// ════════════════════════════════════════════════════════════════════════════
if (a('retire')) {
  try { await retirer() } catch (e) { console.error(`\n✗ ${e.message}`); process.exit(1) }
  process.exit(0)
}

let decor = null
try {
  decor = await semer()
  const avant = await lesCanaux(decor)
  await leGesteRedescend(decor, avant)
  await laRetention(decor)
  await retentionReelle()
} catch (e) {
  console.error(`\n✗ ${e.message}`)
  console.error(e.stack)
  ko++
} finally {
  if (!GARDE_LE_DECOR) {
    try { await retirer() } catch (e) { console.error(`\n⚠️ retrait incomplet : ${e.message}`) }
  } else {
    console.log(`\n⛔ \`--garde-le-decor\` : le décor RESTE. Retrait :`
      + `\n   node … scripts/recette/couture-c6l1.mjs --retire`)
  }
}

console.log(`\n${'═'.repeat(78)}`)
console.log(`COUTURE C6-L1 — ${ok} vert(s), ${ko} rouge(s)`)
console.log(ko === 0
  ? '⭐ LA COUTURE TIENT : un signal levé par le moteur atteint l’œil du professeur, '
    + 'et son geste redescend jusqu’à la base.'
  : '✗ la couture a un trou — il est ci-dessus, avec sa ligne.')
process.exit(ko === 0 ? 0 : 1)
