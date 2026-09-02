// ============================================================================
// C6 · L4 — LA COUTURE DU BRANCHEMENT DE L'ESSAI DE FRAGMENTS, par EXÉCUTION.
// ----------------------------------------------------------------------------
// « Une copie d'essai déposée dans Fragments produit-elle une ancre dans le
//   profil de compétences — et le professeur puis l'élève la voient-ils, chacun
//   par son module, sans que le retour de Fragments ait bougé ? »
//
// Six canaux, nommés au prompt, éprouvés ici par les fonctions que les écrans
// appellent — jamais par lecture de code :
//   ① l'assignation → ligne de plan + instance + dépôts, lus par `lireContexte` ;
//   ② la confirmation du dépôt → `photos_v1` → `transcription_v1`, `v1_remis_at`
//     SANS geste de l'élève ;
//   ③ le clic → `mesure_v1` → trois mesures `classe × sommatif` ;
//   ④ l'ancre → `competences_niveaux.ancre_derniere_*`, la matrice, les drapeaux ;
//   ⑤ la correction → `publier()` → la page de l'élève, `lu_at` ;
//   ⑥ le signal (`ouvert_par_prof_at`) → la tuile, DANS FRAGMENTS.
//
// ⚠️ LA BASE EST LA SANDBOX, et des élèves réels y travaillent : le décor est
//    semé dans la classe « Test », marqué EN BASE (le titre de l'essai, le titre
//    de la ligne de plan, la consigne de l'instance portent `COUTURE-C6L4`), le
//    registre s'écrit à chaque écriture, et `--retire` balaie PAR LA MARQUE même
//    sans registre. Le Storage est compté et purgé lui aussi.
//
// ⚠️ UN SEUL APPEL PAYÉ — la transcription d'UNE copie du compte de test
//    (`test@test.com`, jamais une copie d'élève réel), puis sa mesure par la
//    chaîne. `--sans-appel` sème la transcription et s'arrête avant la mesure.
//
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c6l4.mjs [--sans-appel] [--garde-le-decor]
//   … scripts/recette/couture-c6l4.mjs --retire
// ============================================================================

import fs from 'node:fs'
import { register } from 'node:module'
import { createClient } from '@supabase/supabase-js'

// `utils/codex-onglets/liste.ts` lit `next/navigation` : on complète l'extension.
register('./resolver-next-sans-extension.mjs', import.meta.url)

const RACINE = process.cwd()
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .map((l) => l.match(/^([A-Z_]+)=(.*)$/)).filter(Boolean)
  .map((m) => [m[1], m[2].replace(/^"|"$/g, '')]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const {
  brancherEssaiClasse, classesSansPlan, ouvrirLesDepotsDeLEssai, deposerLaCopieDansLaChaine,
  declencherLaMesureDeLEssai, debrancherEssaiClasse, essaiDeLInstance, essaiDuDepot,
  etatDeLaChaineDeLEssai, planValideDeLaClasse,
} = await import(`${RACINE}/utils/essai/branchement-serveur.ts`)
const { assigneAtDeLEssai, lundiDeLaDate, consigneDeLEssai } = await import(`${RACINE}/utils/essai/regles.ts`)
const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { estUneAncre } = await import(`${RACINE}/utils/routeur/mesure.ts`)
const { signauxDeLancement } = await import(`${RACINE}/utils/examens/signal.ts`)
const { examensEnClasseDeLEleve, passationsDeClasse } = await import(`${RACINE}/utils/codex-onglets/liste.ts`)
const { transcrireMaintenant } = await import(`${RACINE}/utils/passation/ouvrier.ts`)
const { reclamerJobs, etatDesJobs } = await import(`${RACINE}/utils/chaine/file.ts`)
const { tourDeFile } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const { lireConfig } = await import(`${RACINE}/utils/chaine/config.ts`)
const { publier, lireLesRetours, validerLaLecture } = await import(`${RACINE}/utils/passation/retours.ts`)
const { chargerVueProf, chargerVueEleve } = await import(`${RACINE}/utils/passation/vues.ts`)
const { lireDepotsDeLInstance } = await import(`${RACINE}/utils/passation/depots.ts`)
const { lireLesInstances } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
const { constituerLeVivier } = await import(`${RACINE}/utils/moteur/vivier.ts`)
const { comptesDeLaSemaine } = await import(`${RACINE}/utils/assiduite/collecte.ts`)
const { collecterCheminsInscriptions } = await import(`${RACINE}/utils/effacement.ts`)
const { chargerGrilleCompetences } = await import(`${RACINE}/utils/competences-classe.ts`)
const { chargerLAttentionDeLaClasse } = await import(`${RACINE}/utils/pilotage/attention-serveur.ts`)
const { jourDansFuseau } = await import(`${RACINE}/utils/fuseau.ts`)

const MARQUE = 'COUTURE-C6L4'
const REGISTRE = '.couture-c6l4.json'
const a = (n) => process.argv.includes(`--${n}`)
const SANS_APPEL = a('sans-appel')
const GARDE_LE_DECOR = a('garde-le-decor')
const FUSEAU = 'America/Toronto'
const CLASSE = 'Test'
/** Le compte de test — ses photos sont les seules qu'on renvoie au modèle. */
const COMPTE_DE_TEST = '89662514-ea26-4cc3-9708-c228eea6d136'
const COMPETENCES_DE_LESSAI = ['expression', 'argumentation', 'structure']

let ok = 0
let ko = 0
const dire = (bon, texte, detail = '') => {
  if (bon) ok++; else ko++
  console.log(`${bon ? '✓' : '✗'} ${texte}${detail ? `\n     ${detail}` : ''}`)
}
const note = (t) => console.log(`  · ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)
function lu(ou, { data, error }) {
  if (error) throw new Error(`${ou} — ${error.code ?? ''} ${error.message}`)
  return data
}

// ════════════════════════════════════════════════════════════════════════════
// LE REGISTRE — écrit À CHAQUE ÉCRITURE, jamais à la fin
// ════════════════════════════════════════════════════════════════════════════
const registre = {
  essaiId: null, lienId: null, classeId: null, eleveId: COMPTE_DE_TEST, inscriptionId: null,
  exerciceId: null, planifieId: null, depotIds: [], depotElo: null,
  fragmentsDepotId: null, storagePaths: [], niveauxAvant: [],
}
const sauver = () => fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

// ════════════════════════════════════════════════════════════════════════════
// A. LE POINT DE DÉPART
// ════════════════════════════════════════════════════════════════════════════
async function pointDeDepart() {
  titre('A. Le point de départ — PAR REQUÊTE')
  const p = lu('interrupteurs', await admin.from('scriptorium_params')
    .select('exercices_actif, routeur_actif, chaine_actif, fabrique_actif, '
      + 'competences_affichage_actif, passation_classe_actif, plan_evaluation_actif').eq('id', 1).maybeSingle())
  note(`interrupteurs : ${Object.entries(p).map(([k, v]) => `${k}=${v}`).join(' · ')}`)
  dire(p.passation_classe_actif && p.exercices_actif, 'les deux portes du flux de classe sont OUVERTES (mesuré)')
  dire(p.chaine_actif, '`chaine_actif` est ON — la mesure pourra tourner (mesuré, jamais basculé)')
  dire(p.plan_evaluation_actif, '`plan_evaluation_actif` est ON — le plan se lit')

  const classe = lu('classe', await admin.from('classes').select('id, nom, type_pedagogique')
    .eq('nom', CLASSE).maybeSingle())
  if (!classe) throw new Error(`classe « ${CLASSE} » introuvable`)
  registre.classeId = classe.id
  const insc = lu('inscription', await admin.from('inscriptions').select('id')
    .eq('eleve_id', COMPTE_DE_TEST).eq('classe_id', classe.id).eq('statut', 'active').maybeSingle())
  if (!insc) throw new Error('le compte de test n’est pas inscrit dans la classe Test')
  registre.inscriptionId = insc.id
  note(`classe « ${classe.nom} » ${classe.id.slice(0, 8)} · parcours=${classe.type_pedagogique ?? '∅'} · inscription d’Elo ${insc.id.slice(0, 8)}`)

  const plan = await planValideDeLaClasse(admin, classe.id)
  dire(!!plan, `⭐ la classe a un plan d'évaluation VALIDÉ courant (année ${plan?.anneeScolaire ?? '?'})`)

  const avant = {}
  for (const t of ['fragments_essais_epreuves', 'fragments_essais_classes', 'fragments_essai_depots',
    'fragments_essai_depot_photos', 'fragments_essai_depot_analyses']) {
    avant[t] = (await admin.from(t).select('id', { count: 'exact', head: true })).count
  }
  avant.lignesEssai = (await admin.from('scriptorium_exercices_planifies')
    .select('id', { count: 'exact', head: true }).eq('type_exercice', 'essai')).count
  note(`Fragments AVANT : ${Object.entries(avant).map(([k, v]) => `${k}=${v}`).join(' · ')}`)

  const sr = lu('statut de recette', await admin.from('competences_statut_recette')
    .select('competence, statut_recette, statut_recette_pose_le').in('competence', COMPETENCES_DE_LESSAI))
  dire(sr.every((s) => s.statut_recette === 'evaluee'),
    'les trois compétences de l’essai sont `evaluee` — la mesure comptera',
    sr.map((s) => `${s.competence}@${s.statut_recette_pose_le?.slice(0, 10)}`).join(' · '))

  const niv = lu('niveaux', await admin.from('competences_niveaux')
    .select('competence, lettre, lettre_initiale, profil_provisoire, ancre_derniere_date, ancre_derniere_valeur')
    .eq('eleve_id', COMPTE_DE_TEST).in('competence', COMPETENCES_DE_LESSAI))
  registre.niveauxAvant = niv
  note(`niveaux d’Elo AVANT : ${niv.map((n) => `${n.competence}=${n.lettre ?? '∅'}/ancre ${n.ancre_derniere_date ?? '∅'}`).join(' · ')}`)
  note('⚠️ Elo porte déjà des ancres (examen d’août) : la preuve de ④ est le DÉPLACEMENT de `ancre_derniere_date` à aujourd’hui, pas sa naissance.')
  sauver()
  return { classe, avant }
}

// ════════════════════════════════════════════════════════════════════════════
// B. ① L'ASSIGNATION — la ligne de plan, l'instance, les dépôts
// ════════════════════════════════════════════════════════════════════════════
async function assigner(classe) {
  titre('B. Canal ① — l’assignation de l’essai : ligne de plan + instance + dépôts')

  // ── Le refus sans plan, par la négative ────────────────────────────────────
  const actives = lu('classes', await admin.from('classes').select('id, nom').eq('statut', 'active'))
  const sans = await classesSansPlan(admin, actives.map((c) => c.id))
  if (sans.length > 0) {
    dire(true, `⛔ ${sans.length} classe(s) active(s) SANS plan validé — ${sans.join(', ')} — seraient REFUSÉES`)
    const { motifSansPlan } = await import(`${RACINE}/utils/essai/regles.ts`)
    note(`message : « ${motifSansPlan([sans[0]])} »`)
  } else note('toutes les classes actives ont un plan : le refus ne peut pas se montrer ici')

  const sem = lu('semestre', await admin.from('semesters').select('id').eq('is_active', true).maybeSingle())
  const dateEssai = jourDansFuseau(new Date(), FUSEAU)
  const epreuve = lu('épreuve', await admin.from('fragments_essais_epreuves').insert({
    titre: `${MARQUE} — essai de couture`, date_essai: dateEssai, duree_minutes: 120,
    consignes: 'Deux pages, sans notes. Appuie-toi sur tes fragments.',
    depots_ouverts: false, semestre_id: sem.id,
  }).select('id').single())
  registre.essaiId = epreuve.id; sauver()
  const lien = lu('lien', await admin.from('fragments_essais_classes').insert({
    essai_id: epreuve.id, classe_id: classe.id, date_essai: dateEssai, depots_ouverts: false,
  }).select('id').single())
  registre.lienId = lien.id; sauver()
  note(`essai ${epreuve.id.slice(0, 8)} · lien ${lien.id.slice(0, 8)} · date ${dateEssai}`)

  const b = await brancherEssaiClasse(admin, epreuve.id, classe.id)
  dire(b.ok, '⭐⭐ `brancherEssaiClasse` — poser un essai EST le planifier', b.ok ? '' : b.message)
  if (!b.ok) throw new Error(b.message)
  registre.exerciceId = b.data.exerciceId
  registre.planifieId = b.data.planifieId
  sauver()
  dire(!b.data.dejaBranche && b.data.depotsCrees === 7,
    `sept dépôts nés à l’ASSIGNATION — toute la classe, comme l’examen (créés : ${b.data.depotsCrees})`)

  // ── Vérifié PAR REQUÊTE ────────────────────────────────────────────────────
  const ligne = lu('ligne', await admin.from('scriptorium_exercices_planifies')
    .select('type_exercice, diagnostique, nature, lieu, module, origine, ancrage, statut, semaine_lundi, jour_prevu, titre, duree_estimee_min, plan_id, supprime_at')
    .eq('id', b.data.planifieId).single())
  dire(ligne.type_exercice === 'essai' && ligne.diagnostique === false && ligne.nature === 'evaluatif'
    && ligne.lieu === 'classe' && ligne.module === 'fragments',
    '⭐ la ligne de plan est LE couple réservé : essai × non diag × evaluatif × classe × fragments',
    `origine=${ligne.origine} · statut=${ligne.statut} · semaine=${ligne.semaine_lundi} · jour=${ligne.jour_prevu} · titre=« ${ligne.titre} » · ${ligne.duree_estimee_min} min`)
  dire(ligne.statut === 'concu' && ligne.origine === 'manuel' && ligne.semaine_lundi === lundiDeLaDate(dateEssai) && ligne.jour_prevu === dateEssai,
    'elle naît `concu`, `manuel`, ancrée au lundi de la date, le jour dans la semaine')

  const inst = lu('instance', await admin.from('exercices')
    .select('id, lieu, classe_id, statut, genre, cible_primaire, cran, paire_diagnostic, modes_par_competence, consigne_instanciee, exercice_planifie_id, optin_se_juger, optin_confiance_remise, exercices_types(code)')
    .eq('id', b.data.exerciceId).single())
  const typeCode = Array.isArray(inst.exercices_types) ? inst.exercices_types[0]?.code : inst.exercices_types?.code
  dire(typeCode === 'examen_diagnostique_essai' && inst.lieu === 'classe' && inst.classe_id === classe.id,
    '⭐ l’instance est du type de C4-L9, `lieu = classe`, dans la classe',
    `type=${typeCode} · statut=${inst.statut} · genre=${inst.genre ?? '∅'} · cible=${inst.cible_primaire ?? '∅'} · cran=${inst.cran ?? '∅'} · paire=${inst.paire_diagnostic}`)
  const modes = inst.modes_par_competence ?? {}
  dire(Object.keys(modes).sort().join(',') === 'argumentation,expression,structure' && Object.values(modes).every((v) => JSON.stringify(v) === '["composer"]'),
    'elle mesure Expression, Argumentation, Structure, les trois en `composer` — et RIEN d’autre')
  dire(inst.exercice_planifie_id === b.data.planifieId && inst.statut === 'assigne',
    'elle porte sa ligne de plan (`uk_exercices_planifie`) et naît `assigne`')
  dire(inst.genre === null && inst.cible_primaire === null && inst.cran === null,
    '`genre` ∅ (classe sans parcours), `cible_primaire` ∅ (repli alphabétique, avec son alerte), `cran` ∅ (type complet)')
  const consigne = typeof inst.consigne_instanciee === 'string' ? inst.consigne_instanciee : JSON.stringify(inst.consigne_instanciee)
  dire(consigne === consigneDeLEssai(`${MARQUE} — essai de couture`, 'Deux pages, sans notes. Appuie-toi sur tes fragments.'),
    '⭐ la consigne = le titre + les consignes communes — JAMAIS le thème de l’élève', `« ${consigne.replace(/\n/g, ' ⏎ ')} »`)

  const { depots } = await lireDepotsDeLInstance(admin, b.data.exerciceId)
  registre.depotIds = depots.map((d) => d.id); sauver()
  const elo = depots.find((d) => d.eleve_id === COMPTE_DE_TEST)
  registre.depotElo = elo?.id ?? null; sauver()
  dire(depots.length === 7 && depots.every((d) => d.statut === 'assigne'), 'sept dépôts `assigne`, un par inscrit actif')
  const brut = lu('dépôts bruts', await admin.from('exercices_depots').select('origine, assigne_at, echeance')
    .eq('exercice_id', b.data.exerciceId))
  dire(brut.every((d) => d.origine === 'prof'), '`origine = prof` — c’est le professeur qui pose l’essai, pas une troisième valeur')
  dire(brut.every((d) => new Date(d.assigne_at).getTime() === new Date(assigneAtDeLEssai(dateEssai)).getTime()),
    `⭐ \`assigne_at\` = midi UTC du lundi de la semaine de l’essai (${assigneAtDeLEssai(dateEssai)}) — l’essai pèse sur SA semaine`)

  const lienApres = lu('lien', await admin.from('fragments_essais_classes').select('exercice_id').eq('id', lien.id).single())
  dire(lienApres.exercice_id === b.data.exerciceId, '⭐ le lien essai ↔ instance est écrit — une colonne, un seul domicile')

  // ── L'idempotence ──────────────────────────────────────────────────────────
  const b2 = await brancherEssaiClasse(admin, epreuve.id, classe.id)
  dire(b2.ok && b2.data.dejaBranche && b2.data.depotsCrees === 0,
    'rebrancher ne crée RIEN — ni ligne, ni instance, ni dépôt (n’insérer que les manquants)')
  const nbLignes = (await admin.from('scriptorium_exercices_planifies').select('id', { count: 'exact', head: true })
    .eq('titre', `${MARQUE} — essai de couture`)).count
  dire(nbLignes === 1, 'une seule ligne de plan porte la marque')

  // ── « Sans qu'aucune valeur le nomme » : la même forme de ligne qu'un examen ──
  const examen = lu('examen', await admin.from('exercices_depots').select('*, exercices!inner(lieu, exercice_planifie_id)')
    .eq('exercices.lieu', 'classe').neq('exercice_id', b.data.exerciceId).limit(1))
  const mien = lu('mien', await admin.from('exercices_depots').select('*').eq('id', elo.id).single())
  const clesExamen = Object.keys(examen[0] ?? {}).filter((k) => k !== 'exercices').sort().join(',')
  dire(clesExamen === Object.keys(mien).sort().join(','),
    '⛔ AUCUNE VALEUR QUI LE NOMME : le dépôt d’essai a EXACTEMENT les colonnes d’un dépôt d’examen')

  // ── Ce que la chaîne LIT : lieu, forme, classe, compétences ────────────────
  titre('B bis. Ce que `lireContexte` lit — le seul contrôle qui vaut')
  const ctx = await lireContexte(admin, elo.id)
  dire(ctx.lieu === 'classe' && ctx.forme === 'sommatif' && ctx.classeId === classe.id,
    `⭐⭐ lieu=${ctx.lieu} · forme=${ctx.forme} · classe=${ctx.classeId?.slice(0, 8)} — une ANCRE, par la chaîne du dépôt`)
  dire(estUneAncre({ lieu: ctx.lieu, forme: ctx.forme }), '`estUneAncre` dit VRAI — la descente et le plafond s’appliqueront')
  dire(Object.keys(ctx.modesParCompetence).sort().join(',') === 'argumentation,expression,structure',
    'les trois compétences en `composer`, lues sur l’instance')

  // ── LA PREUVE PAR LA NÉGATIVE : sans ligne de plan, pas d'ancre ───────────
  await admin.from('exercices').update({ exercice_planifie_id: null }).eq('id', b.data.exerciceId)
  const ctx0 = await lireContexte(admin, elo.id)
  dire(ctx0.forme === 'formatif' && !estUneAncre({ lieu: ctx0.lieu, forme: ctx0.forme }),
    `⛔⛔ LE MÊME DÉPÔT SANS LIGNE DE PLAN : forme=${ctx0.forme}, \`estUneAncre\` FAUX — « une ancre qu'on ne sait pas éteindre n'est pas portée par le plan »`)
  await admin.from('exercices').update({ exercice_planifie_id: b.data.planifieId }).eq('id', b.data.exerciceId)
  const ctx1 = await lireContexte(admin, elo.id)
  dire(ctx1.forme === 'sommatif', 'ligne de plan remise : l’ancre revient')

  // ── uk_exercices_planifie : une ligne ⇔ au plus une instance ───────────────
  const { error: eDouble } = await admin.from('exercices').insert({
    type_id: (await admin.from('exercices').select('type_id').eq('id', b.data.exerciceId).single()).data.type_id,
    exercice_planifie_id: b.data.planifieId, classe_id: classe.id, lieu: 'classe',
    consigne_instanciee: `${MARQUE} — doublon`, modes_par_competence: { expression: ['composer'] }, statut: 'concu',
  })
  dire(eDouble?.code === '23505', 'une seconde instance sur la même ligne de plan est REFUSÉE (`uk_exercices_planifie`, 23505)')

  return { epreuveId: epreuve.id, exerciceId: b.data.exerciceId, planifieId: b.data.planifieId, depotElo: elo.id, dateEssai }
}

// ════════════════════════════════════════════════════════════════════════════
// C. ⑥ L'OUVERTURE — le signal, DANS FRAGMENTS
// ════════════════════════════════════════════════════════════════════════════
async function ouvrir(d) {
  titre('C. Canal ⑥ — l’ouverture des dépôts est le LANCEMENT, et la tuile naît dans Fragments')
  const avant = await signauxDeLancement(admin, COMPTE_DE_TEST, 'fragments')
  dire(!avant.some((s) => s.depotId === d.depotElo), 'avant l’ouverture : aucune tuile (le signal naît du lancement, pas de l’assignation)')

  await admin.from('fragments_essais_classes').update({ depots_ouverts: true }).eq('id', registre.lienId)
  const o = await ouvrirLesDepotsDeLEssai(admin, d.epreuveId, registre.classeId)
  dire(o.ok && o.data.ouverts === 7, `\`depots_ouverts\` → \`ouvrirLesDepots\` : ${o.ok ? o.data.ouverts : '?'} dépôts ouverts, \`ouvert_par_prof_at\` posé`)
  const dep = lu('dépôt', await admin.from('exercices_depots').select('statut, ouvert_par_prof_at').eq('id', d.depotElo).single())
  dire(dep.statut === 'ouvert' && dep.ouvert_par_prof_at != null, 'le dépôt d’Elo est `ouvert`, horodaté par le professeur')

  const apres = await signauxDeLancement(admin, COMPTE_DE_TEST, 'fragments')
  const s = apres.find((x) => x.depotId === d.depotElo)
  dire(!!s && s.href.startsWith('/eleve/modules/fragments-erudition/passation/') && s.href.endsWith('?vue=essai'),
    '⭐⭐ la tuile de l’élève MÈNE DANS FRAGMENTS, sous l’onglet Essai', s?.href ?? 'aucune tuile')
  const codex = await signauxDeLancement(admin, COMPTE_DE_TEST, 'codex')
  dire(!codex.some((x) => x.depotId === d.depotElo), '⛔ et PAS dans Codex — la règle du mode (`composer`) ne l’y envoie plus')

  const profFragments = await passationsDeClasse(admin, 'fragments')
  const profCodex = await passationsDeClasse(admin, 'codex')
  const mienne = (l) => l.filter((p) => p.href.includes(d.exerciceId))
  dire(mienne(profFragments).length === 1 && mienne(profCodex).length === 0,
    'côté professeur, la liste des passations la range sous Fragments, pas sous Codex', mienne(profFragments)[0]?.href ?? '')
}

// ════════════════════════════════════════════════════════════════════════════
// D. ② LE DÉPÔT — les pages, la transcription, `v1_remis_at` sans geste
// ════════════════════════════════════════════════════════════════════════════
async function deposer(d, avant) {
  titre('D. Canal ② — la copie déposée dans Fragments entre dans la chaîne')
  // Le dépôt de Fragments, tel que `creerUrlUploadEssaiPhotoEleve` le crée.
  const fd = lu('dépôt Fragments', await admin.from('fragments_essai_depots').insert({
    essai_id: d.epreuveId, eleve_id: COMPTE_DE_TEST, inscription_id: registre.inscriptionId, depose_par: 'eleve',
  }).select('id').single())
  registre.fragmentsDepotId = fd.id; sauver()

  // Les photos : celles du compte de test, copiées dans le dossier de CE dépôt
  // — exactement ce que l'écran de Fragments écrit (`essais/{élève}/{dépôt}/{n}.jpg`).
  const source = await photosDuCompteDeTest()
  if (!source.length) throw new Error('aucune photo du compte de test dans `essais`')
  const pages = source.slice(0, 3)
  for (let i = 0; i < pages.length; i++) {
    const chemin = `${COMPTE_DE_TEST}/${fd.id}/${i + 1}.jpg`
    const { error } = await admin.storage.from('essais').upload(chemin, pages[i].buffer, { contentType: 'image/jpeg', upsert: true })
    if (error) throw new Error(`upload : ${error.message}`)
    registre.storagePaths.push(chemin); sauver()
    lu('photo', await admin.from('fragments_essai_depot_photos').insert({ depot_id: fd.id, storage_path: chemin, ordre: i + 1 }).select('id').single())
  }
  note(`${pages.length} page(s) du compte de test déposées : ${pages.map((p) => `${Math.round(p.buffer.length / 1024)} Ko`).join(', ')}`)

  const c = await deposerLaCopieDansLaChaine(admin, fd.id)
  dire(c.ok, '⭐⭐ `deposerLaCopieDansLaChaine` — un appel, depuis la confirmation du dépôt', c.ok ? `${c.data.pages} pages · transcription ${c.data.transcription}` : c.message)
  if (!c.ok) throw new Error(c.message)
  dire(c.data.depotId === d.depotElo, 'il retrouve le dépôt de la chaîne par (élève × instance) — aucune valeur ne le nomme')

  const dep = lu('dépôt', await admin.from('exercices_depots').select('statut, photos_v1, transcription_v1, v1_remis_at').eq('id', d.depotElo).single())
  const ph = dep.photos_v1 ?? []
  dire(ph.length === pages.length && ph.every((p, i) => p.ordre === i + 1 && p.rotation === 0 && p.page_manquante === false
    && typeof p.somme_controle === 'string' && p.somme_controle !== '' && p.bucket === 'essais' && p.chemin?.startsWith(`${COMPTE_DE_TEST}/${fd.id}/`)),
    '⭐ `photos_v1` : la forme gardée (ordre, rotation 0, somme_controle, page_manquante), dans le bucket `essais` — AUCUN fichier copié',
    JSON.stringify(ph[0]))
  dire(ph.every((p) => /^\d+-[0-9a-f]+$/.test(p.somme_controle)), 'la somme de contrôle est la taille + l’empreinte que le stockage rend — jamais posée pour passer la garde')
  const codexAvant = (await admin.storage.from('codex').list(`passation/${COMPTE_DE_TEST}/${d.depotElo}`)).data ?? []
  dire(codexAvant.length === 0, 'rien n’a été écrit dans `codex` pour ce dépôt')

  const jobs = await etatDesJobs(admin, d.depotElo)
  dire(jobs.some((j) => j.etape === 'transcription_v1'), 'un job `transcription_v1` est en file — par le seul prompt qui fait foi', jobs.map((j) => `${j.etape}:${j.statut}`).join(' · '))

  const analyses = (await admin.from('fragments_essai_depot_analyses').select('id', { count: 'exact', head: true })).count
  dire(analyses === avant.fragments_essai_depot_analyses, '⛔ le retour propre de Fragments N’A PAS BOUGÉ (`fragments_essai_depot_analyses` intact)')

  if (SANS_APPEL) {
    note('--sans-appel : la transcription est SEMÉE (pas de modèle appelé).')
    await admin.from('exercices_depots').update({
      transcription_v1: TEXTE_SEME, confiance_ocr_v1: 0.9, transcription_v1_doutes: null,
      v1_remis_at: new Date().toISOString(), statut: 'v1_remis',
    }).eq('id', d.depotElo)
    await admin.from('exercices_jobs').update({ statut: 'abouti' }).eq('depot_id', d.depotElo).eq('etape', 'transcription_v1')
  } else {
    const t0 = Date.now()
    const { bilan, motif } = await transcrireMaintenant(admin, d.depotElo)
    dire(!!bilan, `⭐ UNE copie transcrite par le modèle — ${bilan ? `${bilan.appels} appel(s), ${bilan.nbBlocs} bloc(s), confiance ${bilan.confiance}, ${bilan.doutes} doute(s), ${Math.round((Date.now() - t0) / 1000)} s` : motif}`)
  }
  const dep2 = lu('dépôt', await admin.from('exercices_depots').select('statut, transcription_v1, confiance_ocr_v1, transcription_v1_doutes, v1_remis_at').eq('id', d.depotElo).single())
  dire((dep2.transcription_v1 ?? '').length > 0 && dep2.confiance_ocr_v1 != null,
    `\`transcription_v1\` (${(dep2.transcription_v1 ?? '').length} car.) et \`confiance_ocr_v1\` (${dep2.confiance_ocr_v1}) posées`,
    SANS_APPEL ? '' : `doutes : ${(dep2.transcription_v1_doutes ?? []).length} · extrait : « ${(dep2.transcription_v1 ?? '').slice(0, 90).replace(/\n/g, ' ⏎ ')}… »`)
  dire(dep2.v1_remis_at != null && dep2.statut === 'v1_remis',
    '⭐⭐ `v1_remis_at` EST POSÉ SANS GESTE DE L’ÉLÈVE — trois étapes, pas quatre (`06-` §1)')

  if (SANS_APPEL) {
    // Le re-dépôt : de nouvelles photos = une nouvelle transcription.
    const c2 = await deposerLaCopieDansLaChaine(admin, fd.id)
    const dep3 = lu('dépôt', await admin.from('exercices_depots').select('statut, transcription_v1, v1_remis_at').eq('id', d.depotElo).single())
    dire(c2.ok && c2.data.transcription === 'remise_en_file' && dep3.statut === 'ouvert' && dep3.v1_remis_at === null && dep3.transcription_v1 === null,
      'le RE-DÉPÔT efface la transcription, rouvre le dépôt et REMET le job en file (pas de second job)', c2.ok ? c2.data.transcription : c2.message)
    await admin.from('exercices_depots').update({
      transcription_v1: TEXTE_SEME, confiance_ocr_v1: 0.9, v1_remis_at: new Date().toISOString(), statut: 'v1_remis',
    }).eq('id', d.depotElo)
    await admin.from('exercices_jobs').update({ statut: 'abouti' }).eq('depot_id', d.depotElo).eq('etape', 'transcription_v1')
  } else {
    const couts = lu('coûts', await admin.from('api_couts').select('cout, phase, modele').eq('depot_id', d.depotElo).is('phase', null))
    note(`coût de la transcription (api_couts, phase NULL) : ${couts.length} ligne(s), ${couts.reduce((s, x) => s + Number(x.cout), 0).toFixed(4)} $ — ${couts[0]?.modele ?? ''}`)
    note('le re-dépôt n’est pas rejoué en mode payant (il coûterait une seconde transcription) — prouvé en --sans-appel.')
  }
  return fd.id
}

const TEXTE_SEME = `Le doute n'est pas l'ennemi de la connaissance : il en est la première condition. Descartes, pour fonder la science, commence par douter de tout, et ce doute n'est pas un renoncement mais une méthode.

Pourtant, douter de tout n'est pas tenable. Celui qui doute de tout ne peut plus agir, ni parler, ni même douter : car douter, c'est déjà tenir pour vrai qu'on doute. Le doute a donc une limite, et cette limite est le sujet qui doute.

Il faut donc distinguer deux doutes. Le doute sceptique, qui suspend tout jugement, et le doute méthodique, qui suspend pour mieux fonder. Le premier mène au silence, le second à la certitude.

Ainsi, on peut douter de tout, mais on ne peut pas douter de tout en même temps. Le doute est un outil, non une demeure.`

async function photosDuCompteDeTest() {
  const out = []
  const { data: dossiers } = await admin.storage.from('essais').list(COMPTE_DE_TEST, { limit: 100 })
  for (const d of dossiers ?? []) {
    if (registre.fragmentsDepotId && d.name === registre.fragmentsDepotId) continue
    const { data: fichiers } = await admin.storage.from('essais').list(`${COMPTE_DE_TEST}/${d.name}`, { limit: 100 })
    for (const f of (fichiers ?? []).filter((x) => Number(x.metadata?.size ?? 0) > 80_000).sort((x, y) => x.name.localeCompare(y.name))) {
      const { data: blob } = await admin.storage.from('essais').download(`${COMPTE_DE_TEST}/${d.name}/${f.name}`)
      if (blob) out.push({ buffer: Buffer.from(await blob.arrayBuffer()), source: `${d.name}/${f.name}` })
    }
    if (out.length) break
  }
  return out
}

// ════════════════════════════════════════════════════════════════════════════
// E. ③ LA MESURE — le clic, la file, trois mesures classe × sommatif
// ════════════════════════════════════════════════════════════════════════════
async function mesurer(d, fragmentsDepotId) {
  titre('E. Canal ③ — le clic du professeur met en file ; la chaîne mesure')
  const m = await declencherLaMesureDeLEssai(admin, d.epreuveId, registre.classeId)
  dire(m.ok && m.data.misEnFile === 1 && m.data.sansCopie === 6,
    `\`declencherLeLot\` : ${m.ok ? `${m.data.misEnFile} mise en file · ${m.data.dejaEnFile} déjà · ${m.data.sansCopie} sans copie` : m.message} — les six absents sont ÉCARTÉS, pas mesurés`)
  const m2 = await declencherLaMesureDeLEssai(admin, d.epreuveId, registre.classeId)
  dire(m2.ok && m2.data.misEnFile === 0 && m2.data.dejaEnFile === 1, 'un second clic ne crée AUCUN doublon (`cle_idempotence`)')
  const jobs = await etatDesJobs(admin, d.depotElo)
  dire(jobs.some((j) => j.etape === 'mesure_v1'), 'la file porte `mesure_v1` — PAR LA MÊME FILE, ET PAR AUCUN AUTRE CHEMIN')

  if (SANS_APPEL) {
    note('--sans-appel : la mesure n’est pas jouée (elle coûte des appels) — le job reste en file, il est retiré avec le décor.')
    return false
  }
  // La file, servie comme la route la sert : on réclame, on traite, on recommence
  // tant qu'un job de CE dépôt attend (mesure_v1 puis retour_v1).
  for (let tour = 0; tour < 4; tour++) {
    const pris = await reclamerJobs(admin, { limite: 20, bailMs: 300_000, etapes: ['mesure_v1', 'mesure_vf', 'retour_v1'] })
    const miens = pris.filter((j) => j.depot_id === d.depotElo)
    // ⚠️ Les jobs des autres dépôts réclamés au passage sont REPOSÉS : on ne les sert pas ici.
    for (const j of pris.filter((j) => j.depot_id !== d.depotElo)) {
      await admin.from('exercices_jobs').update({ statut: 'en_attente', bail_expire_at: null }).eq('id', j.id)
    }
    if (miens.length === 0) break
    const t0 = Date.now()
    const sorties = await tourDeFile(admin, miens, lireConfig())
    for (const s of sorties) note(`tour ${tour + 1} · ${s.job.etape} → ${s.erreur ? `ERREUR ${s.erreur}` : 'ok'} (${Math.round((Date.now() - t0) / 1000)} s)`)
  }
  const etat = await etatDesJobs(admin, d.depotElo)
  note(`jobs du dépôt : ${etat.map((j) => `${j.etape}:${j.statut}${j.echec_definitif ? ' (définitif)' : ''}`).join(' · ')}`)

  const mes = lu('mesures', await admin.from('competences_mesures')
    .select('competence, modes, lieu, forme, classe_id, genre, lettre_equivalente, instrument_version, delta_v1_vf, aide_consommee, sonde_montee, bonus, distance_contexte, mesure_at')
    .eq('depot_id', d.depotElo).order('competence'))
  dire(mes.length === 3 && mes.map((x) => x.competence).sort().join(',') === 'argumentation,expression,structure',
    `⭐⭐ TROIS MESURES — ${mes.map((x) => `${x.competence}=${x.lettre_equivalente ?? '∅'}`).join(' · ')}`)
  dire(mes.every((x) => x.lieu === 'classe' && x.forme === 'sommatif' && x.classe_id === registre.classeId),
    '⭐⭐ toutes `classe × sommatif`, avec la classe — des ANCRES')
  dire(mes.every((x) => JSON.stringify(x.modes) === '["composer"]' && x.instrument_version && x.delta_v1_vf === null),
    'mode `composer`, `instrument_version` écrite par la chaîne, `delta_v1_vf` NULL (jamais de vf en classe)')
  const sq = (await admin.from('exercices_squelettes').select('id', { count: 'exact', head: true }).eq('depot_id', d.depotElo)).count
  dire(sq === 3, `trois squelettes (${sq})`)
  const ret = lu('retours', await admin.from('exercices_retours').select('id, moment, published_at, registre_servi').eq('depot_id', d.depotElo))
  dire(ret.length >= 1 && ret.every((r) => r.published_at === null), '⛔ le retour EXISTE et N’EST PAS PUBLIÉ — en classe, il attend la case du professeur')

  // Champ par champ, à côté d'une mesure d'examen diagnostique.
  const ex = lu('examen', await admin.from('competences_mesures')
    .select('competence, modes, lieu, forme, classe_id, genre, lettre_equivalente, instrument_version, delta_v1_vf, aide_consommee, sonde_montee, bonus, distance_contexte')
    .eq('lieu', 'classe').eq('forme', 'sommatif').eq('competence', 'expression').neq('depot_id', d.depotElo).not('depot_id', 'is', null).limit(1))
  const mienne = mes.find((x) => x.competence === 'expression')
  if (ex[0] && mienne) {
    titre('E bis. Une mesure d’ESSAI à côté d’une mesure d’EXAMEN, champ par champ')
    for (const k of Object.keys(ex[0])) note(`${k.padEnd(20)} examen=${JSON.stringify(ex[0][k])}  essai=${JSON.stringify(mienne[k])}`)
    const memes = ['lieu', 'forme', 'modes'].every((k) => JSON.stringify(ex[0][k]) === JSON.stringify(mienne[k]))
    dire(memes, '⭐ lieu, forme et mode IDENTIQUES : l’essai passe par LA MÊME chaîne')
  }

  const c3 = await deposerLaCopieDansLaChaine(admin, fragmentsDepotId)
  dire(c3.ok && c3.data.transcription === 'conservee', 'un re-dépôt APRÈS la mesure conserve la copie mesurée — la mesure ne se dédouble pas')
  const nb2 = (await admin.from('competences_mesures').select('id', { count: 'exact', head: true }).eq('depot_id', d.depotElo)).count
  dire(nb2 === 3, 'toujours trois mesures (`uk_mesures_depot_competence`)')
  return true
}

// ════════════════════════════════════════════════════════════════════════════
// F. ④ L'ANCRE ATTEINT LE PROFIL
// ════════════════════════════════════════════════════════════════════════════
async function ancre(d, mesure) {
  titre('F. Canal ④ — l’ancre atteint le profil, et le professeur la voit')
  if (!mesure) { note('sans mesure (--sans-appel), pas d’ancre à montrer.'); return }
  const aujourdHui = jourDansFuseau(new Date(), FUSEAU)
  const niv = lu('niveaux', await admin.from('competences_niveaux')
    .select('competence, lettre, profil_provisoire, ancre_derniere_date, ancre_derniere_valeur')
    .eq('eleve_id', COMPTE_DE_TEST).in('competence', COMPETENCES_DE_LESSAI))
  for (const n of niv) {
    const av = registre.niveauxAvant.find((x) => x.competence === n.competence)
    note(`${n.competence.padEnd(14)} avant : lettre=${av?.lettre ?? '∅'} ancre=${av?.ancre_derniere_date ?? '∅'}/${av?.ancre_derniere_valeur ?? '∅'} · après : lettre=${n.lettre ?? '∅'} ancre=${n.ancre_derniere_date ?? '∅'}/${n.ancre_derniere_valeur ?? '∅'} · provisoire=${n.profil_provisoire}`)
  }
  dire(niv.length === 3 && niv.every((n) => n.ancre_derniere_date != null && n.ancre_derniere_valeur != null),
    '⭐⭐ `ancre_derniere_*` est écrite sur les trois compétences (par `ecrireLEtatApresMesure`, jamais par ce lot)')
  dire(niv.every((n) => n.ancre_derniere_date >= aujourdHui.slice(0, 10) || n.ancre_derniere_date === aujourdHui),
    `l’ancre est datée d’AUJOURD’HUI (${aujourdHui}) — elle a déplacé celle d’août`)
  note(`profil_provisoire=${niv.map((n) => n.profil_provisoire).join('/')} : en segment 2, la montée et la descente ne s’appliquent pas — chaque lettre sera jugée une fois à la bascule (14/09).`)

  const grille = await chargerGrilleCompetences(admin, registre.classeId, [COMPTE_DE_TEST], {})
  const col = (grille.colonnes ?? []).find((c) => c.competence === 'expression')
  const cell = col?.cellules?.find?.((c) => c.eleveId === COMPTE_DE_TEST) ?? col?.cellules?.[COMPTE_DE_TEST]
  dire(!!grille && (grille.incidents ?? []).length === 0, `la matrice de C6-L1 se charge pour la classe (${(grille.incidents ?? []).length} incident)`,
    cell ? JSON.stringify(cell).slice(0, 200) : `colonnes : ${(grille.colonnes ?? []).map((c) => c.competence).join(', ')}`)
  const nomDe = new Map([[COMPTE_DE_TEST, 'Elo']])
  const att = await chargerLAttentionDeLaClasse(admin, [COMPTE_DE_TEST], nomDe, FUSEAU, aujourdHui, {})
  dire(!!att && (att.incidents ?? []).length === 0, `les drapeaux de C6-L1 se chargent (${(att.incidents ?? []).length} incident)`,
    JSON.stringify(att).slice(0, 300))
}

// ════════════════════════════════════════════════════════════════════════════
// G. ⑤ LA CORRECTION ET LA PUBLICATION — dans Fragments, des deux côtés
// ════════════════════════════════════════════════════════════════════════════
async function corriger(d, mesure) {
  titre('G. Canal ⑤ — le professeur corrige et publie ; l’élève lit — chacun par Fragments')
  const vueProf = await chargerVueProf(admin, d.exerciceId, true)
  const copie = vueProf?.copies.find((c) => c.depotId === d.depotElo)
  dire(!!vueProf && vueProf.copies.length === 7 && !!copie && (copie.copie ?? '').length > 0 && copie.remiseLe != null,
    '`chargerVueProf` — la même vue que Codex et Aletheia : 7 copies, celle d’Elo transcrite et remise')
  const ess = await essaiDeLInstance(admin, d.exerciceId)
  dire(!!ess && ess.essaiId === d.epreuveId && ess.classeNom === CLASSE, '⭐ la page de passation du professeur retrouve SON essai par le lien (lecture inverse)')

  if (!mesure) {
    // Sans mesure, aucun retour n'est engendré : on en POSE un, à la forme de la chaîne, pour éprouver la publication.
    lu('retour fixture', await admin.from('exercices_retours').insert({
      depot_id: d.depotElo, moment: 'chaud',
      texte: [{ id: 'r1', competence: 'structure', nature: 'reussite', ancrage: { source: 'copie', citation: 'Le doute a donc une limite' }, texte: 'Ton troisième paragraphe distingue nettement deux doutes.' }],
      feed_forward: 'La prochaine fois, annonce la distinction dès le premier paragraphe.',
    }).select('id').single())
    note('⚠️ retour FIXTURE (--sans-appel) — ce script n’engendre aucun retour ici, il éprouve la publication.')
  }
  const p = await publier(admin, [d.depotElo])
  dire(p.ok && p.data.publies === 1, '`publier()` — la case du professeur : `published_at` posé', p.ok ? '' : p.message)
  const dep = lu('dépôt', await admin.from('exercices_depots').select('statut').eq('id', d.depotElo).single())
  dire(dep.statut === 'retour_publie', 'le dépôt passe `retour_publie` — la séquence de classe s’arrête là (jamais de vf)')

  const vueEleve = await chargerVueEleve(admin, d.depotElo, COMPTE_DE_TEST)
  dire(!!vueEleve && vueEleve.valide && !!vueEleve.retourPublie, '`chargerVueEleve` — la même vue : copie validée, retour publié visible')
  const e = await essaiDuDepot(admin, d.depotElo)
  dire(!!e && e.essaiId === d.epreuveId, 'la page de l’élève retrouve SON essai par le dépôt')
  const liste = await examensEnClasseDeLEleve(admin, COMPTE_DE_TEST, registre.classeId, 'fragments')
  const item = liste.find((x) => x.depotId === d.depotElo)
  dire(!!item && item.href.startsWith('/eleve/modules/fragments-erudition/passation/') && item.etat.ton === 'a_lire',
    '⭐⭐ l’inventaire de l’élève range l’essai sous FRAGMENTS, « retour à lire »', item ? `${item.href} · ${item.etat.libelle}` : 'absent')
  const listeCodex = await examensEnClasseDeLEleve(admin, COMPTE_DE_TEST, registre.classeId, 'codex')
  dire(!listeCodex.some((x) => x.depotId === d.depotElo), '⛔ et pas sous Codex')

  const retours = await lireLesRetours(admin, d.depotElo)
  const r = retours.find((x) => x.published_at)
  const l = await validerLaLecture(admin, r.id, COMPTE_DE_TEST)
  const rl = lu('retour', await admin.from('exercices_retours').select('lu_at').eq('id', r.id).single())
  dire(l.ok && rl.lu_at != null, 'l’élève valide sa lecture : `lu_at` posé — l’obligation de lecture tient')
}

// ════════════════════════════════════════════════════════════════════════════
// H. HORS ROUTAGE · ASSIDUITÉ · EFFACEMENT · RETRAIT REFUSÉ · FRAGMENTS INTACT
// ════════════════════════════════════════════════════════════════════════════
async function lesFrontieres(d, avant) {
  titre('H. Hors routage, assiduité mesurée, effacement, retrait, Fragments intact')
  const brut = await lireLesInstances(admin)
  const vivier = constituerLeVivier(brut.instances, {
    parcours: [null], coursVus: new Set(), positionsDeLecture: new Map(), instancesDejaDeposees: new Set(),
    classesDeLEleve: new Set([registre.classeId]),
  })
  const ecart = vivier.ecartes.find((e) => e.exerciceId === d.exerciceId)
  dire(!!ecart && ecart.motif === 'lieu_classe' && !vivier.retenus.some((r) => r.exerciceId === d.exerciceId),
    '⛔ HORS ROUTAGE : le vivier écarte l’instance, motif `lieu_classe`', ecart?.detail ?? 'non écartée ?!')

  // L'assiduité : ce que le dépôt fait au compte de la semaine de l'essai.
  const lundi = lundiDeLaDate(d.dateEssai)
  const depots = lu('dépôts d’Elo', await admin.from('exercices_depots').select('id, statut, assigne_at').eq('eleve_id', COMPTE_DE_TEST))
  const aCompter = depots.map((x) => ({ eleveId: COMPTE_DE_TEST, statut: x.statut, assigneAt: x.assigne_at, bonus: false }))
  const avec = comptesDeLaSemaine(aCompter, lundi, FUSEAU).parEleve.get(COMPTE_DE_TEST)
  const sans2 = comptesDeLaSemaine(depots.filter((x) => x.id !== d.depotElo).map((x) => ({ eleveId: COMPTE_DE_TEST, statut: x.statut, assigneAt: x.assigne_at, bonus: false })), lundi, FUSEAU).parEleve.get(COMPTE_DE_TEST)
  note(`semaine du ${lundi} — Elo SANS l’essai : ${JSON.stringify(sans2 ?? {})} · AVEC : ${JSON.stringify(avec ?? {})}`)
  dire((avec?.assignes ?? 0) === (sans2?.assignes ?? 0) + 1,
    '⭐ MESURÉ : l’essai entre au DÉNOMINATEUR de la semaine de `date_essai` (+1 assigné)')
  dire((avec?.termines ?? 0) === (sans2?.termines ?? 0) + 1, 'et, rendu, il compte comme fait (+1 terminé)')
  const absent = registre.depotIds.find((id) => id !== d.depotElo)
  const dA = lu('absent', await admin.from('exercices_depots').select('eleve_id, statut, assigne_at').eq('id', absent).single())
  const cA = comptesDeLaSemaine([{ eleveId: dA.eleve_id, statut: dA.statut, assigneAt: dA.assigne_at, bonus: false }], lundi, FUSEAU).parEleve.get(dA.eleve_id)
  note(`⚠️ un élève ABSENT à l’essai (dépôt \`${dA.statut}\`, jamais remis) : ${JSON.stringify(cA)} — il pèse sur sa semaine comme un exercice non rendu. À Louis.`)

  // L'effacement : les fichiers de l'essai sont atteints PAR FRAGMENTS, pas par codex.
  const chemins = await collecterCheminsInscriptions(admin, [registre.inscriptionId])
  dire(registre.storagePaths.every((p) => chemins.essais.includes(p)) && registre.storagePaths.every((p) => !chemins.codex.includes(p)),
    '⭐ l’effacement (loi 25) collecte les pages dans `essais` (par Fragments) et JAMAIS dans `codex`',
    `essais=${chemins.essais.length} · codex=${chemins.codex.length}`)

  // Le retrait : refusé, parce qu'Elo a écrit.
  const r = await debrancherEssaiClasse(admin, d.epreuveId, registre.classeId)
  dire(!r.ok && /copie/.test(r.message), '⛔ le RETRAIT de l’essai de la classe est REFUSÉ — un élève a écrit', r.ok ? 'accepté ?!' : r.message)

  const etat = await etatDeLaChaineDeLEssai(admin, d.epreuveId, registre.classeId)
  note(`ce que la page de l’essai montre : ${JSON.stringify(etat)}`)

  const apres = {}
  for (const t of ['fragments_essais_epreuves', 'fragments_essais_classes', 'fragments_essai_depots', 'fragments_essai_depot_photos', 'fragments_essai_depot_analyses']) {
    apres[t] = (await admin.from(t).select('id', { count: 'exact', head: true })).count
  }
  dire(apres.fragments_essai_depot_analyses === avant.fragments_essai_depot_analyses,
    '⭐⭐ LE RETOUR PROPRE DE FRAGMENTS N’A PAS BOUGÉ : `fragments_essai_depot_analyses` a gagné 0 ligne')
  dire(apres.fragments_essais_epreuves === avant.fragments_essais_epreuves + 1 && apres.fragments_essai_depots === avant.fragments_essai_depots + 1,
    'Fragments n’a gagné que ce que la recette y a écrit elle-même (1 essai, 1 dépôt, ses photos)')
}

// ════════════════════════════════════════════════════════════════════════════
// LE RETRAIT — par le registre, puis PAR LA MARQUE
// ════════════════════════════════════════════════════════════════════════════
async function retirer() {
  titre('Le retrait')
  let r = null
  if (fs.existsSync(REGISTRE)) r = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
  // 1. Par la marque : les épreuves marquées → leurs liens → leurs instances.
  const epreuves = lu('épreuves', await admin.from('fragments_essais_epreuves').select('id').like('titre', `${MARQUE}%`))
  const essaiIds = [...new Set([...(r?.essaiId ? [r.essaiId] : []), ...epreuves.map((e) => e.id)])]
  const liens = essaiIds.length ? lu('liens', await admin.from('fragments_essais_classes').select('id, exercice_id').in('essai_id', essaiIds)) : []
  const exerciceIds = [...new Set([...(r?.exerciceId ? [r.exerciceId] : []), ...liens.map((l) => l.exercice_id).filter(Boolean)])]
  const lignes = lu('lignes', await admin.from('scriptorium_exercices_planifies').select('id').like('titre', `${MARQUE}%`))
  const planifieIds = [...new Set([...(r?.planifieId ? [r.planifieId] : []), ...lignes.map((l) => l.id)])]
  const depots = exerciceIds.length ? lu('dépôts', await admin.from('exercices_depots').select('id').in('exercice_id', exerciceIds)) : []
  const depotIds = [...new Set([...(r?.depotIds ?? []), ...depots.map((d) => d.id)])]
  note(`marque : ${essaiIds.length} essai(s) · ${liens.length} lien(s) · ${exerciceIds.length} instance(s) · ${planifieIds.length} ligne(s) de plan · ${depotIds.length} dépôt(s)`)

  // 2. Les mesures (FK `set null` : elles survivraient au dépôt) et le monitoring.
  if (depotIds.length) {
    for (const t of ['competences_mesures', 'monitoring_mesures']) {
      const { error } = await admin.from(t).delete().in('depot_id', depotIds)
      note(error ? `⚠️ ${t} : ${error.message}` : `${t} : balayées par dépôt`)
    }
  }
  // 3. Les niveaux d'Elo : reposés tels qu'ils étaient (l'ancre de la recette ne doit pas rester).
  for (const n of r?.niveauxAvant ?? []) {
    const { error } = await admin.from('competences_niveaux').update({
      lettre: n.lettre, lettre_initiale: n.lettre_initiale, profil_provisoire: n.profil_provisoire,
      ancre_derniere_date: n.ancre_derniere_date, ancre_derniere_valeur: n.ancre_derniere_valeur,
    }).eq('eleve_id', COMPTE_DE_TEST).eq('competence', n.competence)
    note(error ? `⚠️ niveau ${n.competence} : ${error.message}` : `niveau ${n.competence} REPOSÉ (ancre ${n.ancre_derniere_date ?? '∅'})`)
  }
  // 4. Les liens, les instances (cascade : dépôts, jobs, squelettes, retours), les lignes de plan.
  if (liens.length) await admin.from('fragments_essais_classes').update({ exercice_id: null }).in('id', liens.map((l) => l.id))
  if (exerciceIds.length) {
    const { error } = await admin.from('exercices').delete().in('id', exerciceIds)
    note(error ? `⚠️ instances : ${error.message}` : `${exerciceIds.length} instance(s) retirée(s), dépôts en cascade`)
  }
  if (planifieIds.length) {
    const { error } = await admin.from('scriptorium_exercices_planifies').delete().in('id', planifieIds)
    note(error ? `⚠️ lignes de plan : ${error.message}` : `${planifieIds.length} ligne(s) de plan retirée(s)`)
  }
  // 5. Fragments : le Storage d'abord (les deux moitiés de la vérité), puis les lignes.
  const fds = essaiIds.length ? lu('dépôts Fragments', await admin.from('fragments_essai_depots').select('id, eleve_id').in('essai_id', essaiIds)) : []
  const chemins = new Set(r?.storagePaths ?? [])
  for (const fd of fds) {
    const { data: fichiers } = await admin.storage.from('essais').list(`${fd.eleve_id}/${fd.id}`, { limit: 100 })
    for (const f of fichiers ?? []) chemins.add(`${fd.eleve_id}/${fd.id}/${f.name}`)
  }
  if (chemins.size) {
    const { error } = await admin.storage.from('essais').remove([...chemins])
    note(error ? `⚠️ storage : ${error.message}` : `storage : ${chemins.size} fichier(s) retiré(s) de \`essais\``)
  }
  if (essaiIds.length) {
    const { error } = await admin.from('fragments_essais_epreuves').delete().in('id', essaiIds)
    note(error ? `⚠️ essais : ${error.message}` : `${essaiIds.length} essai(s) retiré(s) — liens, dépôts et photos en cascade`)
  }
  if (fs.existsSync(REGISTRE)) { fs.unlinkSync(REGISTRE); note('registre effacé') }

  // ⚠️ VÉRIFIÉ PAR REQUÊTE, jamais sur la foi des retours ci-dessus.
  const resteE = (await admin.from('fragments_essais_epreuves').select('id', { count: 'exact', head: true }).like('titre', `${MARQUE}%`)).count
  const resteL = (await admin.from('scriptorium_exercices_planifies').select('id', { count: 'exact', head: true }).like('titre', `${MARQUE}%`)).count
  const toutes = lu('instances', await admin.from('exercices').select('id, consigne_instanciee').eq('lieu', 'classe'))
  const resteX = toutes.filter((e) => JSON.stringify(e.consigne_instanciee ?? '').includes(MARQUE)).length
  const resteM = depotIds.length ? (await admin.from('competences_mesures').select('id', { count: 'exact', head: true }).in('depot_id', depotIds)).count : 0
  let resteS = 0
  for (const fd of fds) resteS += ((await admin.storage.from('essais').list(`${fd.eleve_id}/${fd.id}`)).data ?? []).length
  dire(resteE === 0 && resteL === 0 && resteX === 0 && resteM === 0 && resteS === 0,
    `⭐ AUCUNE trace de la recette : essais=${resteE} · lignes=${resteL} · instances=${resteX} · mesures=${resteM} · fichiers=${resteS}`)
}

// ════════════════════════════════════════════════════════════════════════════
async function principal() {
  console.log(`\n══ COUTURE C6·L4 — le branchement de l'essai de Fragments ${SANS_APPEL ? '(SANS APPEL)' : '(UNE copie payée)'} ══`)
  if (a('retire')) { await retirer(); return }
  const { classe, avant } = await pointDeDepart()
  const d = await assigner(classe)
  await ouvrir(d)
  const fragmentsDepotId = await deposer(d, avant)
  const mesure = await mesurer(d, fragmentsDepotId)
  await ancre(d, mesure)
  await corriger(d, mesure)
  await lesFrontieres(d, avant)
  console.log(`\n══ ${ok} ✓ · ${ko} ✗ ══`)
  if (GARDE_LE_DECOR) {
    note('--garde-le-decor : le décor reste pour le smoke à l’écran. Retirer ensuite : --retire')
    note(`essai ${registre.essaiId} · instance ${registre.exerciceId} · dépôt d’Elo ${registre.depotElo} · dépôt Fragments ${registre.fragmentsDepotId}`)
  } else {
    await retirer()
  }
  process.exit(ko === 0 ? 0 : 1)
}

principal().catch(async (e) => {
  console.error('\n✗✗ ARRÊT :', e.message ?? e)
  console.error('   le décor est retirable par : --retire')
  process.exit(1)
})
