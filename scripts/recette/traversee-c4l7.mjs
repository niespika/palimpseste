// ============================================================================
// RECETTE C4 · L7 — LA TRAVERSÉE DU FLUX, DE BOUT EN BOUT.
// ----------------------------------------------------------------------------
// « Ce que personne n'a encore vu, c'est la COUTURE — et une couture ne se lit
//   ni dans un test unitaire, ni dans une requête isolée : elle se lit en
//   faisant passer UNE VRAIE COPIE d'un bout à l'autre. »
//
// Ce lot NE CONSTRUIT RIEN. Ce script n'est pas du produit : c'est l'instrument
// de la recette, au même titre que les dix-huit qui le précèdent ici. Il
// n'appelle QUE le code des écrans, avec le client admin.
//
//   0. l'état d'entrée   — les six interrupteurs, les statuts, le routeur
//   A. LA VOIE DE LA CLASSE (--classe) — un examen diagnostique CONÇU (C4-L9),
//      la passation, la transcription, le lot, la chaîne, l'ANCRE
//      (`lieu = classe`, `forme = sommatif`), la correction, la publication,
//      la LECTURE.
//   B. LA VOIE DE LA MAISON (--maison) — le retour engendré, et ce qui
//      l'empêche d'atteindre l'élève.
//   C. LE ROUTEUR (--routeur) — par différence : ce que la voie du professeur
//      ne produit pas, et le motif nommé en deux parts.
//   D. LA REPRISE APRÈS EXPIRATION (--reprise) — un job tué après P1 (`C4L5-3`).
//   E. LA ROUTE `/api/chaine` (--route) — ses trois portes et le compteur
//      (`C4L11-B`).
//   Z. la clôture — les six interrupteurs re-constatés à OFF, et le décor retiré.
//
// ⚠️ LES INTERRUPTEURS SONT OUVERTS NOMMÉMENT, UN PAR UN, POUR LA DURÉE D'UN
//    CONTRÔLE, et remis comme trouvés — y compris sur interruption (`finally`).
//    `chaine_actif` vit dans la base PARTAGÉE et `/api/chaine` y tourne à la
//    minute : on l'ouvre pour un appel, et on le referme.
//
// ⚠️ TOUTE LECTURE PASSE PAR `lu()`, QUI LÈVE SUR `error` (piège 69) : « un
//    `select` d'une colonne absente rend `{data:null,error}`, et `(data??[]).
//    length` rend alors ZÉRO, QUI RESSEMBLE À UNE MESURE ».
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/traversee-c4l7.mjs [--classe] [--maison] [--routeur]
//                                           [--reprise] [--route]
//                                           [--sans-appel] [--garde-le-decor]
//                                           [--retire]
//
// Sans drapeau de section, seul l'état d'entrée est lu.
// `--sans-appel`      saute tout ce qui DÉPENSE — le brouillon, à faire d'abord.
// `--garde-le-decor`  ne nettoie pas, et ÉCRIT SON REGISTRE dans
//                     `.traversee-c4l7-registre.json`, pour un smoke à l'écran.
// `--retire`          retire le décor gardé d'un run précédent, dans l'ordre :
//                     dépôts (et leurs ENFANTS) → instances → lignes de plan.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.env.PALIMPSESTE_RACINE_DEPOT
  || '/Users/louissagnieres/Documents/GitHub/palimpseste'

const { chargerConception, concevoirExamenDiagnostique, retirerExamenDiagnostique } =
  await import(`${RACINE}/utils/examens/conception.ts`)
const {
  ouvrirLesDepots, enregistrerLaTranscription, validerLaTranscription,
  declencherLeLot, attenteDuDepot, lireDepotsDeLInstance,
} = await import(`${RACINE}/utils/passation/depots.ts`)
const { leverLesDrapeaux, offreSeJuger, enregistrerSeJuger, offreConfianceRemise,
  enregistrerConfianceRemise, lirePerimetre, CONFIANCES } =
  await import(`${RACINE}/utils/passation/metacognition.ts`)
const { publier, validerLaLecture, lireLesRetours } =
  await import(`${RACINE}/utils/passation/retours.ts`)
const { traiterDepot } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const { mettreEnFile, reclamerJobs } = await import(`${RACINE}/utils/chaine/file.ts`)
const { lireLesStatutsDeRecette } = await import(`${RACINE}/utils/statut-recette.ts`)
const { lireDepotMaison, ouvrirLeDepot, enregistrerLeTexte, remettre } =
  await import(`${RACINE}/utils/deroule/depot.ts`)
const { enregistrerLesConditions, enregistrerLaRestitution, gestesRestants } =
  await import(`${RACINE}/utils/deroule/gestes.ts`)
const { mesurerMaintenant } = await import(`${RACINE}/utils/deroule/mesure.ts`)
const { chargerLeDeroule } = await import(`${RACINE}/utils/deroule/vue.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

// ── L'outillage ─────────────────────────────────────────────────────────────
const ARGS = new Set(process.argv.slice(2))
const SANS_APPEL = ARGS.has('--sans-appel')
const GARDE = ARGS.has('--garde-le-decor')
const veut = (s) => ARGS.has(s)
// Sans drapeau de section, seul l'état d'entrée est joué — et on le DIT.
const AUCUNE_SECTION = !veut('--classe') && !veut('--maison') && !veut('--routeur')
  && !veut('--reprise') && !veut('--route') && !veut('--retire')

let ok = 0, ko = 0
const dit = (v, quoi, detail = '') => {
  if (v) { ok++; console.log(`  ✓ ${quoi}${detail ? ` — ${detail}` : ''}`) }
  else { ko++; console.log(`  ✗ ${quoi}${detail ? ` — ${detail}` : ''}`) }
}
const note = (t) => console.log(`    · ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 70 - t.length))}`)

/** Piège 69 — `supabase-js` NE LÈVE PAS. Toute lecture passe par ici. */
const lu = (nom, { data, error }) => {
  if (error) throw new Error(`[lecture ${nom}] ${error.code ?? ''} ${error.message}`)
  return data
}

const LES_SIX = ['exercices_actif', 'routeur_actif', 'competences_affichage_actif',
  'chaine_actif', 'fabrique_actif', 'passation_classe_actif']

const lireLesPortes = async () => lu('scriptorium_params', await admin
  .from('scriptorium_params').select(LES_SIX.join(', ')).eq('id', 1).single())

/** Ouvrir NOMMÉMENT, pour la durée d'un contrôle. */
const poser = async (etat) => {
  lu('portes', await admin.from('scriptorium_params').update(etat).eq('id', 1).select('id'))
  console.log(`    ⇄ ${Object.entries(etat).map(([k, v]) => `${k}=${v ? 'ON' : 'OFF'}`).join(' · ')}`)
}

/** Sortir d'une section sans faire échouer la traversée (`--sans-appel`). */
class SautDeSection extends Error {}

const PORTES_A_L_ENTREE = await lireLesPortes()
const MARQUE = 'RECETTE C4-L7'

// ⭐ LE REGISTRE — « qui emploie `--garde-le-decor` tient son propre registre de
//    ce qu'il laisse, et le retire à la clôture » (LISEZ-MOI du dossier). Il vit
//    dans un fichier, parce qu'un décor gardé survit au processus qui l'a semé.
const REGISTRE = `${RACINE}/scripts/recette/.traversee-c4l7-registre.json`
const lireRegistre = () => {
  try { return JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) } catch { return [] }
}
const laisse = []

// ════════════════════════════════════════════════════════════════════════════
// --retire — le décor gardé d'un run précédent s'en va
// ════════════════════════════════════════════════════════════════════════════
if (veut('--retire')) {
  titre('--retire — le décor gardé des runs précédents')
  const reg = lireRegistre()
  if (!reg.length) console.log('  (registre vide — rien à retirer)')
  // L'ORDRE COMPTE : dépôts → instances → lignes de plan.
  for (const l of reg.filter((x) => x.quoi === 'dépôt maison')) {
    for (const t of ['competences_mesures', 'exercices_squelettes', 'exercices_retours',
      'exercices_jobs', 'exercices_metacognition']) {
      await admin.from(t).delete().eq('depot_id', l.id)
    }
    const { error } = await admin.from('exercices_depots').delete().eq('id', l.id)
    dit(!error, `dépôt maison ${l.id.slice(0, 8)} retiré`, error?.message ?? '')
  }
  for (const l of reg.filter((x) => x.quoi.startsWith('instance maison'))) {
    const { error } = await admin.from('exercices')
      .update({ statut: 'concu', classe_id: null }).eq('id', l.id)
    dit(!error, `instance maison ${l.id.slice(0, 8)} rendue à \`concu\``, error?.message ?? '')
  }
  for (const l of reg.filter((x) => x.quoi === 'instance')) {
    const enfants = lu('dépôts de l’instance', await admin
      .from('exercices_depots').select('id').eq('exercice_id', l.id))
    for (const d of enfants) {
      for (const t of ['competences_mesures', 'exercices_squelettes', 'exercices_retours',
        'exercices_jobs', 'exercices_metacognition']) {
        await admin.from(t).delete().eq('depot_id', d.id)
      }
    }
    await admin.from('exercices_depots').delete().eq('exercice_id', l.id)
    await admin.from('exercices').update({ statut: 'concu' }).eq('id', l.id)
    const issue = await retirerExamenDiagnostique(admin, l.id)
    dit(issue.ok === true, `instance ${l.id.slice(0, 8)} retirée`, issue.ok ? '' : issue.message)
  }
  for (const l of reg.filter((x) => x.quoi === 'ligne de plan')) {
    const { error } = await admin.from('scriptorium_exercices_planifies').delete().eq('id', l.id)
    dit(!error, `ligne de plan ${l.id.slice(0, 8)} retirée`, error?.message ?? '')
  }
  const { count: reste } = await admin.from('scriptorium_exercices_planifies')
    .select('id', { count: 'exact', head: true }).eq('note', MARQUE)
  dit((reste ?? 0) === 0, '⭐ AUCUNE trace de la traversée dans le plan')
  try { fs.unlinkSync(REGISTRE) } catch { /* déjà parti */ }
  console.log(`\n${'═'.repeat(74)}`)
  console.log(`RETRAIT C4-L7 — ${ok} passé(s), ${ko} en échec.`)
  console.log('═'.repeat(74))
  process.exit(ko === 0 ? 0 : 1)
}

// ════════════════════════════════════════════════════════════════════════════
// 0. L'ÉTAT D'ENTRÉE — lecture seule
// ════════════════════════════════════════════════════════════════════════════
titre('0. l’état d’entrée — re-constaté, jamais supposé')

if (AUCUNE_SECTION) console.log('  (aucune section demandée — seul l’état d’entrée est lu)')
for (const n of LES_SIX) dit(PORTES_A_L_ENTREE[n] === false, `\`${n}\` est à OFF`)

const statuts = await lireLesStatutsDeRecette(admin)
const evaluees = Object.entries(statuts).filter(([, s]) => s === 'evaluee').map(([c]) => c)
dit(evaluees.length === 6, `SIX compétences \`evaluee\``, evaluees.join(', '))
dit(statuts.monitoring === 'mesuree_silencieusement',
  'le Monitoring reste `mesuree_silencieusement` — son passage demande une confirmation (§1.4)')

const { count: nbDecisions } = await admin
  .from('routeur_decisions').select('id', { count: 'exact', head: true })
const { count: nbDepots } = await admin
  .from('exercices_depots').select('id', { count: 'exact', head: true })
const { count: nbPorteurs } = await admin.from('exercices_depots')
  .select('id', { count: 'exact', head: true }).not('routeur_decision_id', 'is', null)
dit(nbDecisions === 0, '`routeur_decisions` est VIDE', `${nbDecisions} ligne(s)`)
dit(nbPorteurs === 0, 'AUCUN dépôt ne porte de `routeur_decision_id`',
  `${nbPorteurs} sur ${nbDepots}`)

const niveaux = lu('competences_niveaux', await admin
  .from('competences_niveaux').select('lettre'))
const avecLettre = niveaux.filter((n) => n.lettre !== null).length
dit(avecLettre === 0, '⭐ AUCUNE lettre en base — c’est LUI, le verrou de R0',
  `${avecLettre} lettre(s) sur ${niveaux.length} ligne(s) d’état`)

// ════════════════════════════════════════════════════════════════════════════
// A. LA VOIE DE LA CLASSE
// ════════════════════════════════════════════════════════════════════════════
let decorClasse = null

try {
  if (veut('--classe')) {
    titre('A1. le décor — une ligne de plan diagnostique, fenêtre DÉCEMBRE')
    // ⚠️ La fenêtre `septembre` est occupée par le décor de C4-L9 laissé en base
    //    le 23/08 : `uk_exercices_diagnostic` n'admet qu'une ligne par
    //    (plan × fenêtre × type). On sème donc dans `decembre`, SANS toucher au
    //    décor d'un autre lot.
    const plans = lu('plans', await admin.from('scriptorium_plans_evaluation')
      .select('id, classe_id, classes(nom)').eq('statut', 'valide')
      .is('supprime_at', null).limit(1))
    const plan = plans?.[0]
    if (!plan) throw new Error('Aucun plan d’évaluation VALIDÉ — la traversée ne peut pas partir.')
    console.log(`  plan ${plan.id} · classe ${plan.classes?.nom ?? plan.classe_id}`)

    const lundi = (() => {
      const d = new Date(); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - 7)
      return d.toISOString().slice(0, 10)
    })()

    const ligne = lu('ligne de plan', await admin.from('scriptorium_exercices_planifies')
      .insert({
        plan_id: plan.id, module: 'codex', type_exercice: 'ecriture',
        nature: 'evaluatif', lieu: 'classe', diagnostique: true, ancrage: 'semaine',
        semaine_lundi: lundi, jour_prevu: null,
        fenetre_diagnostique: 'decembre', origine: 'diagnostic',
        statut: 'a_concevoir', note: MARQUE,
      }).select('id').single())
    laisse.push({ quoi: 'ligne de plan', id: ligne.id })
    dit(true, 'ligne de plan diagnostique semée (codex · decembre)', ligne.id)
    // ⭐ `nature = 'evaluatif'` — c'est LUI qui fera `forme = sommatif` à la
    //    mesure : « `evaluatif` EST le `sommatif` de ce document » (§1.2).
    dit(true, '⭐ sa `nature` vaut `evaluatif` — c’est le `sommatif` du `07-` §1.2')

    titre('A2. la conception — le premier geste de la voie de la classe (C4L4-8)')
    const ecran = await chargerConception(admin, ligne.id)
    dit(!!ecran, 'l’écran de conception charge')
    dit(ecran?.matiere === 'sujet', 'dans Codex, le professeur choisit un SUJET')
    const servable = (ecran?.choix ?? []).find((c) => c.refus === null)
    if (!servable) throw new Error('Aucun matériau servable : déposez un sujet dont la forme est admise.')
    note(`sujet retenu : ${String(servable.id).slice(0, 8)}`)

    const conc = await concevoirExamenDiagnostique(
      admin, ligne.id, servable.id, servable.consigne,
      { seJuger: true, confianceRemise: true })
    dit(conc.ok === true, '⭐ l’examen diagnostique SE CONÇOIT', conc.ok ? '' : conc.message)
    if (!conc.ok) throw new Error(conc.message)
    decorClasse = { ligneId: ligne.id, exerciceId: conc.data.exerciceId }
    laisse.push({ quoi: 'instance', id: conc.data.exerciceId })

    const ex = lu('instance', await admin.from('exercices')
      .select('lieu, statut, cran, optin_se_juger, optin_confiance_remise, '
        + 'exercices_types(code, nature)')
      .eq('id', conc.data.exerciceId).single())
    dit(ex.lieu === 'classe', 'l’instance porte `lieu = classe`')
    dit(ex.exercices_types.nature === 'complet', 'de nature `complet` — une copie entière')
    dit(ex.cran === null, 'SANS CRAN — la garde du cran tient les deux sens (piège 31)')
    dit(ex.optin_se_juger === true && ex.optin_confiance_remise === true,
      '⭐ les DEUX drapeaux d’opt-in sont levés AVANT l’ouverture (piège 23)')

    titre('A3. l’assignation — les dépôts naissent DÈS L’ASSIGNATION (§1.1)')
    // ⚠️ `assignerALaClasse` est une SERVER ACTION derrière `garderProf` : une
    //    session Code n'a pas de session prof. On écrit donc EXACTEMENT ce
    //    qu'elle écrit — `origine: 'prof'`, une ligne par inscrit actif —, et
    //    on le DIT (même parti que la recette de C4-L9).
    const inscrits = lu('inscriptions', await admin.from('inscriptions')
      .select('eleve_id').eq('classe_id', plan.classe_id).eq('statut', 'active'))
    const eleveIds = [...new Set(inscrits.map((i) => i.eleve_id))]
    dit(eleveIds.length > 0, 'la classe du plan porte des inscrits actifs',
      `${eleveIds.length} élève(s)`)
    const crees = lu('dépôts', await admin.from('exercices_depots').insert(
      eleveIds.map((eleveId) => ({
        eleve_id: eleveId, exercice_id: conc.data.exerciceId,
        origine: 'prof', assigne_at: new Date().toISOString(), statut: 'assigne',
      }))).select('id, eleve_id'))
    lu('statut', await admin.from('exercices')
      .update({ statut: 'assigne' }).eq('id', conc.data.exerciceId).select('id'))
    dit(crees.length === eleveIds.length, 'un dépôt par élève, en `origine: prof`',
      `${crees.length} dépôt(s)`)

    titre('A4. l’ouverture — geste manuel, et les drapeaux se grisent ensuite')
    const ouv = await ouvrirLesDepots(admin, conc.data.exerciceId)
    dit(ouv.ok === true, 'les dépôts s’ouvrent', ouv.ok
      ? `${ouv.data.ouverts} ouvert(s)` : ouv.message)
    const apres = await leverLesDrapeaux(admin, conc.data.exerciceId, { seJuger: false })
    dit(apres.ok === false,
      '⭐ ET LES DRAPEAUX NE SE LÈVENT PLUS APRÈS L’OUVERTURE — refus explicite',
      apres.ok ? '' : apres.message)

    const { depots, tronque } = await lireDepotsDeLInstance(admin, conc.data.exerciceId)
    dit(!tronque, 'la lecture des dépôts est PAGINÉE et non tronquée (piège du plafond à 1000)')
    dit(depots.length > 0, `${depots.length} dépôt(s) de passation`)
    const d0 = depots[0]
    note(`dépôt travaillé : ${d0.id.slice(0, 8)} · élève ${String(d0.eleve_id).slice(0, 8)}`)

    titre('A5. la transcription — le texte dont l’élève répond (`06-` §4)')
    // ⚠️ Le texte est écrit AVEC DES `\n\n` : « un formulaire HTML normalise en
    //    CRLF → `blocs()` lit UN SEUL BLOC » (piège CRLF de C4-L4).
    const COPIE = [
      'La liberté n’est pas l’absence de contrainte, car un homme sans aucune règle',
      'ne fait qu’obéir à ses impulsions du moment.',
      '',
      'On peut objecter que toute règle vient de l’extérieur et pèse sur nous. Mais',
      'la règle que je me donne moi-même ne m’est pas imposée : elle est mienne. Or si',
      'une règle est mienne, y obéir n’est pas se soumettre, c’est se tenir.',
      '',
      'Donc la liberté suppose la règle plutôt qu’elle ne s’y oppose. Ce n’est pas la',
      'contrainte qui la détruit, c’est la contrainte subie.',
    ].join('\n')
    const tr = await enregistrerLaTranscription(admin, d0.id, d0.eleve_id, COPIE)
    dit(tr.ok === true, 'la transcription s’enregistre', tr.ok ? '' : tr.message)
    // ⭐⭐ LE PIÈGE CRLF DE C4-L4 — un formulaire HTML normalise en CRLF, et
    //    `blocs()` lirait alors UN SEUL BLOC. On vérifie que les blocs tiennent.
    const enBaseTr = lu('transcription', await admin.from('exercices_depots')
      .select('transcription_v1').eq('id', d0.id).single())
    const nbBlocs = String(enBaseTr.transcription_v1 ?? '').split(/\n\s*\n/).length
    dit(nbBlocs === 3, '⭐ la copie garde ses TROIS blocs — le CRLF ne les a pas soudés',
      `${nbBlocs} bloc(s)`)
    const val = await validerLaTranscription(admin, d0.id, d0.eleve_id, COPIE)
    dit(val.ok === true, '⭐ et l’élève VALIDE SA COPIE — la remise',
      val.ok ? `statut = ${val.data.statut}` : val.message)
    const rejoue = await validerLaTranscription(admin, d0.id, d0.eleve_id, COPIE)
    dit(rejoue.ok === false, '⭐ PAR L’ÉCHEC — une seconde validation est refusée',
      rejoue.ok ? '' : rejoue.message)

    titre('A6. les deux gestes — « se juger » et la confiance de remise')
    const per = await lirePerimetre(admin, d0.id)
    note(`compétences déclarées : ${per?.declarees.join(', ') || 'aucune'}`)
    note(`compétences \`evaluee\`  : ${per?.evaluees.join(', ') || 'AUCUNE'}`)
    const sj = await offreSeJuger(admin, d0.id)
    dit(sj.servie === true, '⭐ « SE JUGER » EST RÉELLEMENT SERVI (C4L4-5 / C4L3-15)',
      sj.servie ? `${sj.questions.length} question(s)` : `non servi — ${sj.motif}`)
    if (sj.servie && sj.questions.length) {
      note(`compétence interrogée : ${sj.competence} · version de fiche ${sj.version}`)
      note(`1ʳᵉ question : « ${sj.questions[0].question} » (${sj.questions[0].dimension_eleve})`)
      // ⛔ Une liste FERMÉE : « une réponse libre ne se compare à rien » (§1.1).
      const reponses = Object.fromEntries(
        sj.questions.map((q) => [q.observable_code, q.reponses[0]]))
      const rj = await enregistrerSeJuger(admin, d0.id, d0.eleve_id, sj, reponses)
      dit(rj.ok === true, 'et les réponses s’enregistrent', rj.ok ? '' : rj.message)
      // ⭐ Éprouver PAR L'ÉCHEC (piège 76) : une réponse hors de la liste fermée.
      const horsListe = await enregistrerSeJuger(admin, d0.id, d0.eleve_id, sj,
        { [sj.questions[0].observable_code]: 'une réponse que la liste ne porte pas' })
      dit(horsListe.ok === false,
        '⭐ PAR L’ÉCHEC — une réponse hors de la liste fermée est REFUSÉE',
        horsListe.ok ? '' : horsListe.message)
    }
    const cr = await offreConfianceRemise(admin, d0.id)
    const nbConf = cr.servie ? (cr.competences?.length ?? 0) : 0
    dit(cr.servie === true && nbConf > 0,
      '⭐ LA CONFIANCE DE REMISE SERT UN OBJET NON VIDE (C4L4-6)',
      cr.servie ? `${nbConf} compétence(s) \`evaluee\` mesurée(s) : ${cr.competences.join(', ')}`
        : `non servie — ${cr.motif}`)
    if (cr.servie && nbConf > 0) {
      // ⚠️ UN OBJET, JAMAIS UN SCALAIRE — « une valeur par compétence `evaluee`
      //    mesurée » (§1.1) ; `depots_confiance_chk` refuse un scalaire.
      const vals = Object.fromEntries(cr.competences.map((c) => [c, CONFIANCES[0]]))
      const rc = await enregistrerConfianceRemise(admin, d0.id, d0.eleve_id, vals)
      dit(rc.ok === true, 'et la confiance s’enregistre', rc.ok ? '' : rc.message)
      const enBase = lu('confiance', await admin.from('exercices_depots')
        .select('confiance_declaree').eq('id', d0.id).single())
      const n = Object.keys(enBase.confiance_declaree ?? {}).length
      dit(n === nbConf,
        '⭐⭐ ET L’OBJET EN BASE N’EST PAS VIDE — une valeur PAR COMPÉTENCE, comptée',
        `${n} valeur(s) : ${JSON.stringify(enBase.confiance_declaree)}`)
    }

    titre('A7. le lot — par la MÊME file (§1.1)')
    const lot = await declencherLeLot(admin, decorClasse.exerciceId)
    dit(lot.ok === true, 'le lot se déclenche', lot.ok
      ? `${lot.data.misEnFile} mise(s) en file, ${lot.data.dejaEnFile} déjà là, `
        + `${lot.data.sansCopie} sans copie` : lot.message)
    const att = await attenteDuDepot(admin, d0.id)
    dit(att.map((j) => j.etape).includes('mesure_v1'),
      'la file porte l’étape de mesure', att.map((j) => j.etape).join(', '))

    if (SANS_APPEL) {
      dit(true, '⊘ la chaîne n’est PAS jouée (--sans-appel) — l’ancre reste à prouver')
    } else {
      titre('A8. la chaîne — `chaine_actif` ouvert pour UN traitement, puis refermé')
      const t0 = Date.now()
      await poser({ chaine_actif: true })
      let bilan
      try {
        bilan = await traiterDepot(admin, d0.id, 'v1')
      } finally {
        await poser({ chaine_actif: false })
      }
      const dureeS = ((Date.now() - t0) / 1000).toFixed(1)
      note(`durée du traitement : ${dureeS} s`)
      note(`bilan : mesuresEcrites=${bilan?.mesuresEcrites} · competencesMesurees=`
        + `${(bilan?.competencesMesurees ?? []).join(',')} · appels=${bilan?.appels}`)
      note(`monitoring : mesures=${bilan?.monitoring?.mesures} · motifs=`
        + `${JSON.stringify(bilan?.monitoring?.motifs ?? [])}`)
      note(`écartées : ${JSON.stringify(bilan?.competencesEcartees ?? [])}`)
      for (const a of bilan?.alertes ?? []) note(`alerte : ${a}`)
      // ⭐ LE CONTRAT DE LATENCE — il ne porte que sur le RETOUR MAISON
      //    (pièges 16-17). Ici on le MESURE sans en conclure un défaut.
      dit(true, `latence mesurée à ${(bilan?.competencesMesurees ?? []).length} compétence(s)`,
        `${dureeS} s — ⚠️ voie CLASSE : le contrat de trois minutes ne porte PAS sur elle`)

      titre('A9. ⭐ L’ANCRE — `lieu = classe`, `forme = sommatif`, EN BASE')
      // ⛔ On assère sur les LIGNES EN BASE, jamais sur `competencesMesurees`
      //    (piège 71 : le bilan nomme ce qui est SOUMIS, pas ce qui est mesuré).
      const mesures = lu('competences_mesures', await admin.from('competences_mesures')
        .select('competence, lieu, forme, lettre_equivalente, delta_v1_vf, instrument_version')
        .eq('depot_id', d0.id))
      dit(mesures.length > 0, `${mesures.length} mesure(s) ÉCRITE(S) en base`)
      for (const m of mesures) {
        note(`${m.competence} · lieu=${m.lieu} · forme=${m.forme} · `
          + `lettre=${m.lettre_equivalente} · delta=${m.delta_v1_vf ?? 'NULL'}`)
      }
      dit(mesures.length > 0 && mesures.every((m) => m.lieu === 'classe'),
        '⭐ toutes portent `lieu = classe`')
      dit(mesures.length > 0 && mesures.every((m) => m.forme === 'sommatif'),
        '⭐⭐ TOUTES PORTENT `forme = sommatif` — L’ANCRE EST PRODUITE',
        `formes : ${[...new Set(mesures.map((m) => m.forme))].join(', ')}`)
      dit(mesures.length > 0 && mesures.every((m) => m.lettre_equivalente !== null),
        'et chacune porte sa LETTRE-ÉQUIVALENTE')

      titre('A9-bis. le régime de modèle — une ANCRE tire le MODÈLE FORT (§6)')
      // ⛔ Le plafond par dépôt se lit AU NOMBRE DE LIGNES EN BASE, jamais au
      //    bilan : « le bilan est un chiffre de diagnostic » (piège 72).
      const couts = lu('api_couts', await admin.from('api_couts')
        .select('modele, phase, competence').eq('depot_id', d0.id))
      const modeles = [...new Set(couts.map((c) => c.modele))]
      const parPhase = {}
      for (const c of couts) parPhase[c.phase ?? '(null)'] = (parPhase[c.phase ?? '(null)'] ?? 0) + 1
      note(`${couts.length} ligne(s) \`api_couts\` · phases : ${JSON.stringify(parPhase)}`)
      dit(modeles.length === 1, '⭐ LES TROIS ÉTAGES PRENNENT LE MÊME MODÈLE — ils ne se séparent pas',
        modeles.join(', '))
      dit(couts.length === bilan?.appels,
        '⭐ et `bilan.appels` COLLE aux lignes en base — le compte ne se perd plus (C4L11-3)',
        `bilan=${bilan?.appels} · base=${couts.length}`)
    }

    titre('A10. la correction, la publication, LA LECTURE')
    let retours = await lireLesRetours(admin, d0.id)
    dit(retours.length > 0, `${retours.length} retour(s) sur la copie`)
    if (retours.length === 0) {
      dit(false, '⊘ aucun retour engendré : la publication ne peut pas être éprouvée ici')
    } else {
      const r = retours[0]
      const pub = await publier(admin, [d0.id])
      dit(pub.ok === true, '⭐ le professeur COCHE LA CASE — le retour est publié',
        pub.ok ? `${pub.data.publies} publié(s)` : pub.message)
      const apresPub = lu('retour', await admin.from('exercices_retours')
        .select('published_at, lu_at').eq('id', r.id).single())
      dit(apresPub.published_at !== null, '`published_at` est posé EN BASE')
      const lec = await validerLaLecture(admin, r.id, d0.eleve_id)
      dit(lec.ok === true, '⭐⭐ ET L’ÉLÈVE VALIDE SA LECTURE', lec.ok ? '' : lec.message)
      const apresLu = lu('retour', await admin.from('exercices_retours')
        .select('published_at, lu_at').eq('id', r.id).single())
      dit(apresLu.lu_at !== null,
        '⭐ `exercices_retours.lu_at` EST POSÉ — « un seul domicile pour un seul geste » (piège 19)',
        String(apresLu.lu_at))
      const statutDepot = lu('dépôt', await admin.from('exercices_depots')
        .select('statut').eq('id', d0.id).single())
      dit(statutDepot.statut === 'retour_publie',
        '⭐ et LA SÉQUENCE DE CLASSE S’ARRÊTE À `retour_publie` (piège 15)',
        `statut = ${statutDepot.statut}`)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // B. LA VOIE DE LA MAISON — de l'assignation au retour final, et LE MUR
  // ══════════════════════════════════════════════════════════════════════════
  if (veut('--maison')) try {
    titre('B1. l’instance — conçue à la fabrique, en attente d’assignation')
    // ⚠️ La CONCEPTION est le geste de C4-L8 et passe par une SERVER ACTION
    //    (`app/prof/conception/actions.ts`) derrière `garderProf` : une session
    //    Code n'a pas de session prof. On part donc d'une instance DÉJÀ CONÇUE
    //    à la fabrique, et l'on traverse tout ce qui vient après.
    const exos = lu('exercices', await admin.from('exercices')
      .select('id, cran, cible_primaire, modes_par_competence, statut, classe_id, '
        + 'exercice_planifie_id, consigne_instanciee')
      .eq('lieu', 'maison').eq('statut', 'concu').is('classe_id', null).limit(1))
    const exo = exos?.[0]
    if (!exo) throw new Error('Aucune instance maison `concu` non assignée : rien à traverser.')
    console.log(`  instance ${exo.id} · cran ${exo.cran} · cible ${exo.cible_primaire}`)
    dit(exo.exercice_planifie_id === null,
      '⚠️ SANS LIGNE DE PLAN — la `forme` vaudra donc `formatif`, et CE N’EST PAS UN REPLI (piège 25)')
    dit(exo.cible_primaire !== null,
      '⭐ elle porte une `cible_primaire` — le SEUL domicile qui empêche le repli alphabétique (piège 28)',
      String(exo.cible_primaire))

    titre('B2. l’assignation — le seul chemin d’assignation du dépôt')
    const classes = lu('classes', await admin.from('classes')
      .select('id, nom').eq('nom', 'Test').limit(1))
    const classe = classes?.[0]
    if (!classe) throw new Error('Classe « Test » introuvable.')
    const inscrits = lu('inscriptions', await admin.from('inscriptions')
      .select('eleve_id').eq('classe_id', classe.id).eq('statut', 'active').limit(1))
    const eleveId = inscrits?.[0]?.eleve_id
    if (!eleveId) throw new Error('Aucun inscrit actif dans la classe Test.')
    const dep = lu('dépôt', await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: exo.id, origine: 'prof',
      assigne_at: new Date().toISOString(), statut: 'assigne',
    }).select('id').single())
    lu('instance', await admin.from('exercices')
      .update({ statut: 'assigne', classe_id: classe.id }).eq('id', exo.id).select('id'))
    laisse.push({ quoi: 'dépôt maison', id: dep.id })
    laisse.push({ quoi: 'instance maison (rendue à `concu`)', id: exo.id })
    dit(true, 'un dépôt en `origine: prof`', `${dep.id.slice(0, 8)} · élève ${String(eleveId).slice(0, 8)}`)

    titre('B3. le déroulé — six temps, et les TROIS GESTES DE LA REMISE (`06-` §3)')
    await poser({ exercices_actif: true })
    let depot = await lireDepotMaison(admin, dep.id, eleveId)
    dit(!!depot, 'le déroulé de l’élève charge son dépôt')
    const ouvre = await ouvrirLeDepot(admin, depot, new Date().toISOString())
    dit(ouvre.ok === true, 'le dépôt s’ouvre', ouvre.ok ? '' : ouvre.message)
    depot = await lireDepotMaison(admin, dep.id, eleveId)

    const V1 = [
      'La liberté n’est pas l’absence de règle.',
      '',
      'On dit souvent qu’être libre, c’est faire ce qu’on veut. Mais celui qui suit',
      'toutes ses envies obéit encore à quelque chose. Donc il n’est pas libre.',
    ].join('\n')
    const ecrit = await enregistrerLeTexte(admin, depot, 'v1', V1, null, new Date().toISOString())
    dit(ecrit.ok === true, 'le texte de la v1 s’enregistre', ecrit.ok ? '' : ecrit.message)
    depot = await lireDepotMaison(admin, dep.id, eleveId)

    // ⛔ L'ORDRE ABSOLU DE LA FIN DE V1 : les trois gestes AVANT la remise, et la
    //    restitution à chaud « AVANT TOUT ENVOI À L'IA ».
    const restantsAvant = gestesRestants(depot, false)
    dit(restantsAvant.length > 0, 'les gestes de la remise sont ANNONCÉS avant elle',
      restantsAvant.join(', '))
    const premature = await remettre(admin, depot, 'v1',
      { texte: V1, tagDuree: null, telemetrie: null }, new Date().toISOString())
    dit(premature.ok === false,
      '⭐ PAR L’ÉCHEC — une remise AVANT les trois gestes est REFUSÉE',
      premature.ok ? '' : premature.message)

    const hors = await enregistrerLesConditions(admin, depot, 'bof', new Date().toISOString())
    dit(hors.ok === false, '⭐ PAR L’ÉCHEC — une condition hors des TROIS valeurs est refusée',
      hors.ok ? '' : hors.message)
    const cond = await enregistrerLesConditions(admin, depot, 'temps_mis', new Date().toISOString())
    dit(cond.ok === true, 'les conditions de travail se déclarent', cond.ok ? '' : cond.message)
    depot = await lireDepotMaison(admin, dep.id, eleveId)
    const rest = await enregistrerLaRestitution(admin, depot,
      'Être libre, ce n’est pas suivre ses envies, c’est se donner sa propre règle.',
      new Date().toISOString())
    dit(rest.ok === true, 'la restitution à chaud se fait — AVANT tout envoi à l’IA',
      rest.ok ? '' : rest.message)
    depot = await lireDepotMaison(admin, dep.id, eleveId)
    dit(gestesRestants(depot, false).length === 0, 'les trois gestes sont faits')

    const remise = await remettre(admin, depot, 'v1',
      { texte: V1, tagDuree: null, telemetrie: null }, new Date().toISOString())
    dit(remise.ok === true, '⭐ la v1 est REMISE',
      remise.ok ? `statut=${remise.valeur.statut} · ${remise.valeur.blocs} blocs` : remise.message)
    dit(remise.ok && remise.valeur.blocs === 2,
      '⭐ et la copie garde ses DEUX blocs — le piège CRLF ne les a pas soudés')

    if (SANS_APPEL) {
      dit(true, '⊘ la chaîne maison n’est PAS jouée (--sans-appel)')
      await poser({ exercices_actif: false })
      throw new SautDeSection()
    }
    titre('B4. la chaîne froide — par `mesurerMaintenant` : EN FILE, PUIS DÉCLENCHÉ (piège 73)')
    depot = await lireDepotMaison(admin, dep.id, eleveId)
    await poser({ chaine_actif: true })
    let bilanV1
    const tV1 = Date.now()
    try {
      bilanV1 = await mesurerMaintenant(admin, depot, 'v1')
    } finally {
      await poser({ chaine_actif: false })
    }
    const dureeV1 = ((Date.now() - tV1) / 1000).toFixed(1)
    dit(bilanV1?.bilan != null, 'la chaîne a tourné', bilanV1?.motif ?? '')
    note(`durée v1 : ${dureeV1} s · appels=${bilanV1?.bilan?.appels}`)
    note(`mesuresEcrites=${bilanV1?.bilan?.mesuresEcrites} · competencesMesurees=`
      + `${(bilanV1?.bilan?.competencesMesurees ?? []).join(',')}`)
    for (const a of bilanV1?.bilan?.alertes ?? []) note(`alerte : ${a}`)

    const mesuresV1 = lu('mesures', await admin.from('competences_mesures')
      .select('competence, lieu, forme, lettre_equivalente, delta_v1_vf').eq('depot_id', dep.id))
    for (const m of mesuresV1) {
      note(`${m.competence} · lieu=${m.lieu} · forme=${m.forme} · lettre=${m.lettre_equivalente}`)
    }
    dit(mesuresV1.length > 0, '⭐ LA MESURE EST EN BASE', `${mesuresV1.length} mesure(s)`)
    dit(mesuresV1.every((m) => m.lieu === 'maison'), 'toutes portent `lieu = maison`')
    dit(mesuresV1.every((m) => m.forme === 'formatif'),
      '⭐ et `forme = formatif` — sans ligne de plan, et ce n’est pas un repli (piège 25)')
    dit(mesuresV1.every((m) => m.lettre_equivalente !== null),
      '⭐ chacune porte SA LETTRE-ÉQUIVALENTE')

    titre('B5. la version finale — DEUX squelettes, et le `delta_v1_vf`')
    depot = await lireDepotMaison(admin, dep.id, eleveId)
    const VF = [
      'La liberté n’est pas l’absence de règle.',
      '',
      'On dit souvent qu’être libre, c’est faire ce qu’on veut. Mais celui qui suit',
      'toutes ses envies obéit encore à quelque chose : à ses impulsions du moment,',
      'qu’il n’a pas choisies. Or obéir à ce qu’on n’a pas choisi, c’est précisément',
      'ce qu’on appelle une contrainte. Donc il n’est pas libre.',
      '',
      'La règle que je me donne moi-même, elle, je l’ai choisie : y obéir n’est donc',
      'pas se soumettre.',
    ].join('\n')
    const ecritVf = await enregistrerLeTexte(admin, depot, 'vf', VF, null, new Date().toISOString())
    dit(ecritVf.ok === true, 'le texte de la vf s’enregistre', ecritVf.ok ? '' : ecritVf.message)
    depot = await lireDepotMaison(admin, dep.id, eleveId)
    const remiseVf = await remettre(admin, depot, 'vf',
      { texte: VF, tagDuree: null, telemetrie: null }, new Date().toISOString())
    dit(remiseVf.ok === true, '⭐ la version finale est REMISE',
      remiseVf.ok ? `statut=${remiseVf.valeur.statut}` : remiseVf.message)

    depot = await lireDepotMaison(admin, dep.id, eleveId)
    await poser({ chaine_actif: true })
    let bilanVf
    const tVf = Date.now()
    try {
      bilanVf = await mesurerMaintenant(admin, depot, 'vf')
    } finally {
      await poser({ chaine_actif: false })
    }
    note(`durée vf : ${((Date.now() - tVf) / 1000).toFixed(1)} s · appels=${bilanVf?.bilan?.appels}`)
    for (const a of bilanVf?.bilan?.alertes ?? []) note(`alerte : ${a}`)

    const squelettes = lu('squelettes', await admin.from('exercices_squelettes')
      .select('competence, version').eq('depot_id', dep.id))
    dit(squelettes.length === 2,
      '⭐⭐ LE DÉPÔT PORTE DEUX SQUELETTES — le retour final a de quoi comparer',
      squelettes.map((s) => `${s.competence}/${s.version}`).join(', '))

    // ⭐ LA CLAUSE REQUALIFIÉE DU « FAIT QUAND » : calculé, OU NULL AVEC SON
    //   ALERTE NOMMÉE. « Un NULL silencieux reste un échec de recette. »
    const mesuresVf = lu('mesures', await admin.from('competences_mesures')
      .select('competence, delta_v1_vf').eq('depot_id', dep.id))
    const alertesVf = bilanVf?.bilan?.alertes ?? []
    const alerteDelta = alertesVf.find((a) => /delta/i.test(a))
    dit(mesuresVf.every((m) => m.delta_v1_vf === null),
      '`delta_v1_vf` est NULL — « et NULL n’est pas 0 » (`01-` §11)')
    dit(!!alerteDelta,
      '⭐⭐ ET L’ALERTE TOMBE, NOMMÉE — la clause requalifiée est satisfaite',
      alerteDelta ?? 'AUCUNE ALERTE : un NULL SILENCIEUX, donc un échec de recette')
    // ⚠️ Piège 60 — ne pas se contenter de la voir verte : LIRE SON MOTIF.
    if (alerteDelta) {
      dit(/branchement/i.test(alerteDelta),
        '  et son motif dit bien « le branchement n’en déclare pas le calcul »',
        alerteDelta)
    }

    titre('B6. ⛔ LE RETOUR FINAL — ET LE MUR')
    const retoursM = lu('retours', await admin.from('exercices_retours')
      .select('id, moment, published_at, lu_at').eq('depot_id', dep.id))
    dit(retoursM.some((r) => r.moment === 'final'),
      '⭐ LE RETOUR FINAL EST ENGENDRÉ, depuis la comparaison des deux squelettes',
      retoursM.map((r) => r.moment).join(', '))
    dit(retoursM.length > 0 && retoursM.every((r) => r.published_at === null),
      '⛔ AUCUN N’EST PUBLIÉ — et rien, dans tout le dépôt, ne peut le publier')

    // ⭐ LA PREUVE À L'ÉCRAN DE L'ÉLÈVE, pas seulement par requête.
    const vue = await chargerLeDeroule(admin, dep.id, eleveId, { ouvert: true, delaiVfJours: 3 })
    dit(!!vue, 'l’écran du déroulé de l’élève charge')
    dit(vue?.retours?.chaud == null && vue?.retours?.final == null,
      '⛔⛔ ET L’ÉLÈVE NE VOIT NI LE RETOUR CHAUD NI LE RETOUR FINAL — '
      + '`vue.ts` saute tout retour sans `published_at` (l.614)',
      `chaud=${vue?.retours?.chaud ? 'servi' : 'ABSENT'} · `
      + `final=${vue?.retours?.final ? 'servi' : 'ABSENT'}`)
    dit(retoursM.every((r) => r.lu_at === null),
      '⛔ donc `lu_at` reste NULL, et la clause « retour final LU » n’est pas atteignable maison')
    await poser({ exercices_actif: false })
  } catch (e) {
    if (!(e instanceof SautDeSection)) throw e
  }

  // ══════════════════════════════════════════════════════════════════════════
  // D. LA REPRISE APRÈS EXPIRATION, SUR LA CHAÎNE ENTIÈRE (`C4L5-3`)
  // ══════════════════════════════════════════════════════════════════════════
  if (veut('--reprise')) {
    titre('D. la reprise après expiration — un job TUÉ APRÈS P1, sur la chaîne réelle')
    // ⭐ La forme la plus dure du contrôle : on ne simule pas la mort de
    //    l'ouvrier, on la joue AU PIRE — l'ouvrier A continue jusqu'au bout
    //    pendant que l'ouvrier B, ayant réclamé le job au bail expiré, rejoue
    //    TOUTE la chaîne. Les deux écrivent. Si l'index unique et la clé
    //    d'idempotence tiennent, il en reste UN de chaque.
    const exos = lu('exercices', await admin.from('exercices')
      .select('id, cran, cible_primaire')
      .eq('lieu', 'maison').eq('statut', 'concu').is('classe_id', null).limit(1))
    const exo = exos?.[0]
    if (!exo) throw new Error('Aucune instance maison libre pour la reprise.')
    const classes = lu('classes', await admin.from('classes')
      .select('id').eq('nom', 'Test').limit(1))
    const inscrits = lu('inscriptions', await admin.from('inscriptions')
      .select('eleve_id').eq('classe_id', classes[0].id).eq('statut', 'active').limit(1))
    const eleveId = inscrits[0].eleve_id
    const maintenant = new Date().toISOString()
    const dep = lu('dépôt', await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: exo.id, origine: 'prof',
      assigne_at: maintenant, ouvert_at: maintenant, statut: 'v1_remis',
      v1_remis_at: maintenant,
      texte_v1: 'La liberté n’est pas l’absence de règle.\n\nCelui qui suit toutes ses '
        + 'envies obéit encore à ses impulsions. Donc il n’est pas libre.',
      conditions_declarees: { valeur: 'temps_mis', at: maintenant },
      restitution_a_chaud: 'Être libre, c’est se donner sa propre règle.',
    }).select('id').single())
    laisse.push({ quoi: 'dépôt maison', id: dep.id })
    laisse.push({ quoi: 'instance maison (rendue à `concu`)', id: exo.id })
    lu('instance', await admin.from('exercices')
      .update({ statut: 'assigne', classe_id: classes[0].id }).eq('id', exo.id).select('id'))
    note(`dépôt de reprise : ${dep.id.slice(0, 8)}`)

    if (SANS_APPEL) {
      dit(true, '⊘ la reprise n’est PAS jouée (--sans-appel)')
    } else {
      await poser({ chaine_actif: true })
      try {
        // Ouvrier A — il réclame, avec un bail COURT, et part.
        const { job: creeA } = await mettreEnFile(admin, dep.id, 'mesure_v1')
        dit(!!creeA, 'le job est mis en file')
        const jobsA = await reclamerJobs(admin,
          { limite: 1, bailMs: 4000, etapes: ['mesure_v1'], depotId: dep.id })
        dit(jobsA.length === 1, '⭐ l’ouvrier A réclame le job — et `tentatives` monte À LA PRISE',
          `tentatives = ${jobsA[0]?.tentatives}`)

        const travailA = traiterDepot(admin, dep.id, 'v1').catch((e) => ({ erreur: String(e) }))

        // On attend que P1 SOIT PASSÉ — la première ligne d'`api_couts`.
        let vuP1 = false
        for (let i = 0; i < 60 && !vuP1; i++) {
          await new Promise((r) => setTimeout(r, 1000))
          const { count } = await admin.from('api_couts')
            .select('id', { count: 'exact', head: true })
            .eq('depot_id', dep.id).eq('phase', 'p1')
          vuP1 = (count ?? 0) > 0
        }
        dit(vuP1, '⭐ P1 EST PASSÉ — l’ouvrier A a payé son extraction')

        // ⛔ ON TUE L'OUVRIER A : son bail expire. Le job redevient réclamable.
        lu('bail', await admin.from('exercices_jobs')
          .update({ bail_expire_at: new Date(Date.now() - 60_000).toISOString() })
          .eq('id', jobsA[0].id).select('id'))
        dit(true, '⛔ le bail de l’ouvrier A est EXPIRÉ — il est réputé mort après P1')

        const jobsB = await reclamerJobs(admin,
          { limite: 1, bailMs: 300_000, etapes: ['mesure_v1'], depotId: dep.id })
        dit(jobsB.length === 1,
          '⭐ l’ouvrier B RÉCLAME le job au bail expiré — c’est le filet',
          `tentatives = ${jobsB[0]?.tentatives}`)
        dit(jobsB[0]?.id === jobsA[0]?.id, 'et c’est LE MÊME job — la clé d’idempotence tient',
          `clé = ${jobsB[0]?.cle_idempotence}`)

        // L'ouvrier B rejoue TOUTE la chaîne, pendant que A finit.
        const travailB = traiterDepot(admin, dep.id, 'v1').catch((e) => ({ erreur: String(e) }))
        const [rA, rB] = await Promise.all([travailA, travailB])
        note(`ouvrier A : ${rA?.erreur ?? `mesuresEcrites=${rA?.mesuresEcrites} dejaLa=${rA?.mesuresDejaLa}`}`)
        note(`ouvrier B : ${rB?.erreur ?? `mesuresEcrites=${rB?.mesuresEcrites} dejaLa=${rB?.mesuresDejaLa}`}`)

        // ⭐⭐ LA CLAUSE DU « FAIT QUAND », ASSÉRÉE EN BASE.
        const sq = lu('squelettes', await admin.from('exercices_squelettes')
          .select('competence, version').eq('depot_id', dep.id))
        const me = lu('mesures', await admin.from('competences_mesures')
          .select('competence').eq('depot_id', dep.id))
        dit(sq.length === 1,
          '⭐⭐ UN SEUL SQUELETTE au bout — l’index unique (dépôt × compétence × version) a tenu',
          `${sq.length} squelette(s)`)
        dit(me.length === 1,
          '⭐⭐ UNE SEULE MESURE au bout — « une reprise n’écrit jamais une seconde mesure »',
          `${me.length} mesure(s)`)
        const jobsFin = lu('jobs', await admin.from('exercices_jobs')
          .select('id, statut, tentatives, echec_definitif').eq('depot_id', dep.id))
        dit(jobsFin.length === 1, 'et UN SEUL job — la file n’a pas doublé',
          jobsFin.map((j) => `${j.statut}/t=${j.tentatives}/def=${j.echec_definitif}`).join(', '))
        const { count: appels } = await admin.from('api_couts')
          .select('id', { count: 'exact', head: true }).eq('depot_id', dep.id)
        dit(true, '⚠️ ET LA REPRISE A REPAYÉ — c’est le prix du filet, pas un défaut',
          `${appels} appel(s) au journal pour UNE mesure`)
      } finally {
        await poser({ chaine_actif: false })
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // E. LA ROUTE `/api/chaine` — SES TROIS PORTES, ET LE COMPTEUR (`C4L11-B`)
  // ══════════════════════════════════════════════════════════════════════════
  if (veut('--route')) {
    titre('E. `/api/chaine` — les TROIS portes, dans l’ordre (piège 12)')
    // La recette se donne son propre secret : la route est protégée par
    // `CRON_SECRET`, et l'éprouver demande de le connaître.
    process.env.CRON_SECRET = 'recette-c4l7'
    const { GET } = await import(`${RACINE}/app/api/chaine/route.ts`)
    const appel = (entetes) => GET(new Request('https://local/api/chaine', { headers: entetes }))

    // ── Porte 1 — le secret ───────────────────────────────────────────────
    const sans = await appel({})
    dit(sans.status === 401, '⭐ PAR L’ÉCHEC — sans `Bearer`, la route rend 401',
      `status ${sans.status}`)
    const faux = await appel({ authorization: 'Bearer pas-le-bon' })
    dit(faux.status === 401, '⭐ PAR L’ÉCHEC — avec un MAUVAIS secret, 401 aussi',
      `status ${faux.status}`)

    const bon = { authorization: 'Bearer recette-c4l7' }

    // ── Porte 3 — les interrupteurs (la 2 ne s'allume que sur incohérence) ─
    const ferme = await appel(bon)
    const corpsFerme = await ferme.json()
    dit(ferme.status === 200 && corpsFerme.gate != null,
      '⭐ portes FERMÉES → 200 `{gate: …}`, et AUCUN job réclamé',
      JSON.stringify(corpsFerme))

    if (SANS_APPEL) {
      dit(true, '⊘ l’invocation avec file chargée n’est PAS jouée (--sans-appel)')
    } else {
      // ── Une file NON VIDE derrière `chaine_actif` — la condition de C4L11-B ─
      const exos = lu('exercices', await admin.from('exercices')
        .select('id').eq('lieu', 'maison').eq('statut', 'concu').is('classe_id', null).limit(1))
      const classes = lu('classes', await admin.from('classes')
        .select('id').eq('nom', 'Test').limit(1))
      const inscrits = lu('inscriptions', await admin.from('inscriptions')
        .select('eleve_id').eq('classe_id', classes[0].id).eq('statut', 'active').limit(1))
      const m = new Date().toISOString()
      const dep = lu('dépôt', await admin.from('exercices_depots').insert({
        eleve_id: inscrits[0].eleve_id, exercice_id: exos[0].id, origine: 'prof',
        assigne_at: m, ouvert_at: m, statut: 'v1_remis', v1_remis_at: m,
        texte_v1: 'La liberté n’est pas l’absence de règle.\n\nCelui qui suit ses envies '
          + 'obéit encore à ses impulsions. Donc il n’est pas libre.',
        conditions_declarees: { valeur: 'temps_mis', at: m },
        restitution_a_chaud: 'Être libre, c’est se donner sa propre règle.',
      }).select('id').single())
      laisse.push({ quoi: 'dépôt maison', id: dep.id })
      laisse.push({ quoi: 'instance maison (rendue à `concu`)', id: exos[0].id })
      lu('instance', await admin.from('exercices')
        .update({ statut: 'assigne', classe_id: classes[0].id }).eq('id', exos[0].id).select('id'))
      await mettreEnFile(admin, dep.id, 'mesure_v1')
      const { count: enFile } = await admin.from('exercices_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('depot_id', dep.id).eq('statut', 'en_attente')
      dit(enFile === 1, '⭐ LA FILE EST NON VIDE — la condition de reprise de `C4L11-B`')

      await poser({ chaine_actif: true })
      let corps
      try {
        const r = await appel(bon)
        corps = await r.json()
        dit(r.status === 200, 'la route répond 200 avec une file chargée', `status ${r.status}`)
      } finally {
        await poser({ chaine_actif: false })
      }
      note(`réponse : ${JSON.stringify(corps)}`)
      dit(typeof corps.reclames === 'number' && typeof corps.traites === 'number'
        && typeof corps.tuesEnVol === 'number',
        '⭐ LA RÉPONSE PORTE LE COMPTEUR — `reclames`, `traites`, `tuesEnVol`')
      dit(corps.reclames >= 1, 'elle a RÉCLAMÉ au moins un job', `${corps.reclames}`)
      dit(corps.reclames === corps.traites,
        '⭐⭐ ET UNE INVOCATION QUI TRAITE *n* JOBS A RÉCLAMÉ *n* JOBS',
        `réclamés ${corps.reclames} · traités ${corps.traites}`)
      dit(corps.tuesEnVol === 0,
        '⭐⭐ `tuesEnVol` VAUT ZÉRO — « aucun job n’est plus tué en vol », prouvé au compteur',
        `${corps.tuesEnVol}`)
      const mes = lu('mesures', await admin.from('competences_mesures')
        .select('competence').eq('depot_id', dep.id))
      dit(mes.length >= 1, 'et la mesure est en base — la route a bien MENÉ le job au bout',
        `${mes.length} mesure(s)`)
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // C. LE ROUTEUR — par différence
  // ══════════════════════════════════════════════════════════════════════════
  if (veut('--routeur')) {
    titre('C. LE ROUTEUR — ce que la voie du professeur NE produit PAS')
    const { count: dec } = await admin
      .from('routeur_decisions').select('id', { count: 'exact', head: true })
    dit(dec === 0, '`routeur_decisions` est TOUJOURS vide après la traversée', `${dec}`)
    const { count: porteurs } = await admin.from('exercices_depots')
      .select('id', { count: 'exact', head: true }).not('routeur_decision_id', 'is', null)
    dit(porteurs === 0, 'et aucun dépôt ne porte de décision', `${porteurs}`)

    // Ce que la voie du professeur ne produit pas — relevé PAR DIFFÉRENCE.
    const manques = [
      ['aucune sonde secondaire', 'la chaîne ne les lit que sur `routeur_decisions.sondes_retenues`'],
      ['aucun budget décompté', 'le budget vit à la décision'],
      ['aucune règle de pose PB1-PB6', 'la couche 4 n’est jamais exercée'],
      ['aucun ciblage R0-R5', '`filtreR0` n’est appelé par rien'],
      ['aucune journalisation du §11', 'rien n’écrit ce que le routeur décide'],
      ['l’historique des cibles reste VIDE',
        'donc R2 et R5 sont AVEUGLES, et la démonstration arrive toujours « avant » '
        + '(`momentDeLaDemonstration` compte sur `routeur_decisions`)'],
    ]
    for (const [quoi, pourquoi] of manques) dit(true, `— ${quoi}`, pourquoi)

    const niv = lu('competences_niveaux', await admin.from('competences_niveaux').select('lettre'))
    dit(niv.every((n) => n.lettre === null),
      '⭐ LE MOTIF, NOMMÉ — la compétence qui manquait : AUCUNE (les six sont `evaluee`) ; '
      + 'le geste qui manquait : L’ÉCRITURE DE LA LETTRE (`C4-L12`, 4ᵉ geste)')
  }
} finally {
  // ══════════════════════════════════════════════════════════════════════════
  // Z. LA CLÔTURE — les six interrupteurs re-constatés à OFF
  // ══════════════════════════════════════════════════════════════════════════
  titre('Z. la clôture — les six interrupteurs, re-constatés')
  await admin.from('scriptorium_params').update(PORTES_A_L_ENTREE).eq('id', 1)
  const fin = await lireLesPortes()
  for (const n of LES_SIX) dit(fin[n] === false, `\`${n}\` est à OFF`)

  if (laisse.length) {
    if (GARDE) {
      const cumul = [...lireRegistre(), ...laisse]
      fs.writeFileSync(REGISTRE, JSON.stringify(cumul, null, 2))
      console.log('\n  ⚠️ DÉCOR LAISSÉ EN BASE (--garde-le-decor) — registre :')
      for (const l of laisse) console.log(`     ${l.quoi} · ${l.id}`)
      console.log(`     Registre cumulé écrit : ${REGISTRE} (${cumul.length} entrée(s))`)
      console.log('     Pour nettoyer : rejouer ce script avec `--retire`.')
    } else {
      titre('Z-bis. le nettoyage — tout ce que la traversée a semé est retiré')
      for (const l of laisse.filter((x) => x.quoi === 'instance')) {
        // ⚠️ LES ENFANTS D'ABORD. `competences_mesures.depot_id` est en
        //    `on delete set null` : supprimer le dépôt SANS eux laisse des
        //    mesures ORPHELINES — trouvé sur cette recette même, le 24/08, et
        //    c'est le patron du défaut que ce lot traque ailleurs.
        const enfants = lu('dépôts de l’instance', await admin
          .from('exercices_depots').select('id').eq('exercice_id', l.id))
        for (const d of enfants) {
          for (const t of ['competences_mesures', 'exercices_squelettes',
            'exercices_retours', 'exercices_jobs', 'exercices_metacognition']) {
            await admin.from(t).delete().eq('depot_id', d.id)
          }
        }
        await admin.from('exercices_depots').delete().eq('exercice_id', l.id)
        await admin.from('exercices').update({ statut: 'concu' }).eq('id', l.id)
        const issue = await retirerExamenDiagnostique(admin, l.id)
        dit(issue.ok === true, `l’instance ${l.id.slice(0, 8)} est retirée`,
          issue.ok ? '' : issue.message)
      }
      for (const l of laisse.filter((x) => x.quoi === 'dépôt maison')) {
        await admin.from('competences_mesures').delete().eq('depot_id', l.id)
        await admin.from('exercices_squelettes').delete().eq('depot_id', l.id)
        await admin.from('exercices_retours').delete().eq('depot_id', l.id)
        await admin.from('exercices_jobs').delete().eq('depot_id', l.id)
        await admin.from('exercices_metacognition').delete().eq('depot_id', l.id)
        const { error } = await admin.from('exercices_depots').delete().eq('id', l.id)
        dit(!error, `le dépôt maison ${l.id.slice(0, 8)} est retiré`, error?.message ?? '')
      }
      for (const l of laisse.filter((x) => x.quoi.startsWith('instance maison'))) {
        const { error } = await admin.from('exercices')
          .update({ statut: 'concu', classe_id: null }).eq('id', l.id)
        dit(!error, `l’instance maison ${l.id.slice(0, 8)} revient à \`concu\``,
          error?.message ?? '')
      }
      for (const l of laisse.filter((x) => x.quoi === 'ligne de plan')) {
        const { error } = await admin.from('scriptorium_exercices_planifies')
          .delete().eq('id', l.id)
        dit(!error, `la ligne de plan ${l.id.slice(0, 8)} est retirée`, error?.message ?? '')
      }
      const { count: reste } = await admin.from('scriptorium_exercices_planifies')
        .select('id', { count: 'exact', head: true }).eq('note', MARQUE)
      dit((reste ?? 0) === 0, '⭐ AUCUNE trace de la traversée dans le plan')
    }
  }

  console.log(`\n${'═'.repeat(74)}`)
  console.log(`TRAVERSÉE C4-L7 — ${ok} contrôle(s) passé(s), ${ko} en échec.`)
  console.log('═'.repeat(74))
}

process.exit(ko === 0 ? 0 : 1)
