// ============================================================================
// RECETTE C4 · L12 — CE QUI ÉCRIT CE QUE LE ROUTEUR DÉCIDE, ÉPROUVÉ EN BASE.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/routeur-c4l12.mjs [--garde-le-decor]
//
// Elle monte le décor, appelle LE POINT D'ENTRÉE, et confronte ce qui est en base.
// « Le "fait quand" ne demande PAS que le routeur soit allumé — les six
//   interrupteurs restent à OFF. Il demande que LE GESTE EXISTE ET SOIT ÉPROUVÉ. »
//
// ⛔ ELLE NE BASCULE AUCUN DES SIX INTERRUPTEURS. Le point d'entrée reçoit
//    `forcerHorsAllumage: true`, un drapeau RÉSERVÉ À LA RECETTE, et le bilan le
//    porte — `horsAllumage: true`.
//
// ⛔ ELLE NE TOUCHE QUE SON DÉCOR. La population est restreinte par
//    `elevesDemandes` ; l'état des élèves touchés est RELEVÉ AVANT et RESTITUÉ
//    après. `exercices_depots` et `assiduite_hebdo` sont des tables VIVANTES.
// ============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const GARDE = process.argv.includes('--garde-le-decor')
// ⭐ LE RETRAIT SANS REGISTRE EN MÉMOIRE. `--garde-le-decor` laisse le décor en
//    base pour le smoke prof, et le registre meurt avec le processus. `--retire`
//    le retrouve par DÉRIVATION — la marque portée par chaque instance semée, et
//    la population dérivée exactement comme le semis la dérive. ⛔ Jamais par
//    coïncidence de valeurs.
const RETIRE = process.argv.includes('--retire')
const MARQUE = 'C4-L12'
let ok = 0
let ko = 0
const lu = (nom, { data, error }) => {
  if (error) throw new Error(`${nom} : ${error.message}`)
  return data
}
const titre = (t) => console.log(`\n${'─'.repeat(74)}\n${t}\n${'─'.repeat(74)}`)
const note = (t) => console.log(`   ${t}`)
const dit = (cond, libelle, detail = '') => {
  if (cond) ok++; else ko++
  console.log(`  ${cond ? '✓' : '✗'} ${libelle}${detail ? `  — ${detail}` : ''}`)
}

// ⭐ LE REGISTRE — « ta recette doit distinguer un semis d'une mesure PAR SON
//    REGISTRE, jamais par une valeur ». Aucun filtre par coïncidence de chiffres.
const seme = {
  exercices: [], depots: [], mesures: [], semaines: new Set(),
  niveauxAvant: [], eleves: [],
  // ⛔ `exercices_depots` EST UNE TABLE VIVANTE : on relève ce qui existait
  //    AVANT, et le nettoyage ne touche QUE ce qui n'y figure pas. Un premier
  //    jet de cette recette a détruit un dépôt réel en nettoyant trop large ;
  //    la garde est née de là.
  depotsAvant: new Set(),
}

const jours = (iso, n) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

async function main() {
  const { poserLesSemainesDuRouteur } = await import(`${RACINE}/utils/moteur/cycle-serveur.ts`)
  const { poserLeColdStart, ecrireLEtatApresMesure, cloturerLaCalibrationDesEleves } =
    await import(`${RACINE}/utils/moteur/etat-serveur.ts`)
  const { lireLesSegments, segmentDuCycle } =
    await import(`${RACINE}/utils/moteur/calendrier-serveur.ts`)
  const { poserLaSemaineDAssiduite } =
    await import(`${RACINE}/utils/assiduite/collecte-serveur.ts`)

  // ══════════════════════════════════════════════════════════════════════════
  titre('A. L’ÉTAT D’ENTRÉE — les trois constats, avant d’écrire une ligne')
  // ══════════════════════════════════════════════════════════════════════════
  const inter = lu('interrupteurs', await admin.from('scriptorium_params')
    .select('exercices_actif, routeur_actif, competences_affichage_actif, '
      + 'fabrique_actif, chaine_actif, passation_classe_actif').eq('id', 1).maybeSingle())
  dit(Object.values(inter).every((v) => v === false),
    '⛔ les SIX interrupteurs sont à OFF, et ce lot n’en bascule AUCUN', JSON.stringify(inter))

  const statuts = lu('statuts', await admin.from('competences_statut_recette')
    .select('competence, statut_recette').order('competence'))
  const evaluees = statuts.filter((s) => s.statut_recette === 'evaluee').map((s) => s.competence)
  dit(evaluees.length === 6, '⭐ les SIX compétences sont `evaluee` — posées le 23/08, CONSTATÉES',
    evaluees.join(', '))

  const { count: dec0 } = await admin.from('routeur_decisions')
    .select('*', { count: 'exact', head: true })
  note(`\`routeur_decisions\` à l’entrée : ${dec0} ligne(s)`)

  const { count: lettres0 } = await admin.from('competences_niveaux')
    .select('*', { count: 'exact', head: true }).not('lettre', 'is', null)
  const { count: niveaux0 } = await admin.from('competences_niveaux')
    .select('*', { count: 'exact', head: true })
  note(`⛔ LE SECOND VERROU à l’entrée : ${lettres0} lettre(s) sur ${niveaux0} ligne(s) d’état`)

  const { count: liens0 } = await admin.from('exercices_depots')
    .select('*', { count: 'exact', head: true }).not('routeur_decision_id', 'is', null)
  note(`\`exercices_depots.routeur_decision_id\` à l’entrée : ${liens0} dépôt(s) — cinq modules le lisent`)

  // ══════════════════════════════════════════════════════════════════════════
  titre('B. LE CALENDRIER — d’où sortent le segment courant et sa règle')
  // ══════════════════════════════════════════════════════════════════════════
  const decoupe = await lireLesSegments(admin)
  dit(decoupe.segments.length === 5, 'les CINQ segments se dérivent du Calendrier',
    `C = ${decoupe.C}, R = ${decoupe.R} · ${decoupe.segments.map((s) => s.semaines.length).join('/')} semaines`)
  const seg2 = decoupe.segments.find((s) => s.segment === 2)
  if (!seg2?.semaines.length) throw new Error('le segment 2 n’a aucune semaine : décor impossible.')
  const W1 = seg2.semaines[0].dateDebutLundi
  const W2 = seg2.semaines[1]?.dateDebutLundi ?? jours(W1, 7)
  seme.semaines.add(W1); seme.semaines.add(W2)
  dit(segmentDuCycle(decoupe, W1).segment === 2,
    '⭐ la semaine de recette tombe au SEGMENT 2 — « le routeur tourne en régime de calibration »',
    `${W1} puis ${W2}`)

  const seg1 = decoupe.segments.find((s) => s.segment === 1)
  const W0 = seg1?.semaines[0]?.dateDebutLundi ?? jours(W1, -7)
  const horsRoutage = await poserLesSemainesDuRouteur(admin, 'America/Toronto', W0,
    { cycleDemande: W0, elevesDemandes: [], forcerHorsAllumage: true })
  dit(horsRoutage.segment === 1 && horsRoutage.exercicesPoses === 0,
    '⛔ LE SEGMENT 1 EST HORS ROUTAGE — rien n’est posé, et le bilan DIT pourquoi',
    horsRoutage.motif ?? '')

  // ══════════════════════════════════════════════════════════════════════════
  titre('C. LA GARDE D’ALLUMAGE — `routeur_actif` est LU, jamais ouvert')
  // ══════════════════════════════════════════════════════════════════════════
  const ferme = await poserLesSemainesDuRouteur(admin, 'America/Toronto', W1,
    { cycleDemande: W1 })
  dit(ferme.routeurActif === false && ferme.exercicesPoses === 0 && ferme.motif !== null,
    '⛔ À OFF, le routeur NE POSE RIEN — et le bilan le dit sans rien basculer', ferme.motif ?? '')

  // ══════════════════════════════════════════════════════════════════════════
  titre('D. LE DÉCOR — deux élèves d’un parcours RÉEL, et des instances servables')
  // ══════════════════════════════════════════════════════════════════════════
  const classes = lu('classes', await admin.from('classes')
    .select('id, nom, type_pedagogique').eq('statut', 'active').not('type_pedagogique', 'is', null))
  if (!classes.length) {
    throw new Error('aucune classe active ne porte de `type_pedagogique` : LE PIÈGE DE LA '
      + 'VACUITÉ interdit de servir qui que ce soit. Renseigne un parcours.')
  }
  const classe = classes[0]
  const inscr = lu('inscriptions', await admin.from('inscriptions')
    .select('eleve_id').eq('classe_id', classe.id).eq('statut', 'active'))
  const POP = [...new Set(inscr.map((i) => i.eleve_id))].slice(0, 2)
  if (POP.length < 2) throw new Error(`la classe ${classe.nom} porte moins de 2 élèves actifs.`)
  seme.eleves = POP
  const [ePresent, eAbsent] = POP
  dit(true, `classe « ${classe.nom} » (${classe.type_pedagogique}) — deux élèves`,
    `présent ${ePresent.slice(0, 8)} · absent ${eAbsent.slice(0, 8)}`)

  // ⛔ L'ÉTAT D'AVANT EST RELEVÉ, et il sera RESTITUÉ : table vivante.
  seme.niveauxAvant = lu('niveaux avant', await admin.from('competences_niveaux')
    .select('*').in('eleve_id', POP))
  const depotsAvant = lu('dépôts avant', await admin.from('exercices_depots')
    .select('id').in('eleve_id', POP))
  for (const d of depotsAvant) seme.depotsAvant.add(d.id)
  note(`état relevé avant écriture : ${seme.niveauxAvant.length} ligne(s) de \`competences_niveaux\``)
  note(`⛔ ${seme.depotsAvant.size} dépôt(s) PRÉEXISTANT(S) relevé(s) — le nettoyage n'y touchera pas`)

  // Un matériau SERVABLE — `cours_etat = generique`, « servable en tout temps ».
  const sujet = lu('sujet', await admin.from('exercices_sujets')
    .select('id, enonce').eq('cours_etat', 'generique').eq('statut', 'valide')
    .eq('bloque', false).limit(1).maybeSingle())
  if (!sujet) throw new Error('aucun sujet `generique` validé : le filtre du cours vu bloque tout.')
  const type = lu('type', await admin.from('exercices_types')
    .select('id, code').eq('code', 'argument').maybeSingle())

  // Trois instances, à trois crans, pour que PB1 et PB3 aient de quoi départager.
  const aSemer = [6, 8, 4, 6, 8, 4].map((cran, i) => ({
    type_id: type.id, lieu: 'maison', statut: 'concu', cran,
    consigne_instanciee: { recette: `${MARQUE} — instance ${i + 1}` },
    modes_par_competence: { argumentation: ['composer'], expression: ['composer'] },
    observable_isole_competence: cran === 4 ? 'argumentation' : null,
    observable_isole_code: cran === 4 ? 'garant' : null,
    materiau_source_sujet_id: sujet.id,
  }))
  const instances = lu('semis d’instances',
    await admin.from('exercices').insert(aSemer).select('id, cran'))
  seme.exercices.push(...instances.map((x) => x.id))
  dit(instances.length === 6, '⭐ six instances SERVABLES semées (matériau `generique`)',
    instances.map((x) => `${x.id.slice(0, 8)}@cran ${x.cran}`).join(' · '))

  // ══════════════════════════════════════════════════════════════════════════
  titre('E. LE VIVIER — le premier geste, et l’écart NOMMÉ')
  // ══════════════════════════════════════════════════════════════════════════
  const { lireLesInstances, lireLesCoursVus, lireLesPositionsDeLecture,
    lireLesInstancesDejaDeposees } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
  const { constituerLeVivier } = await import(`${RACINE}/utils/moteur/vivier.ts`)
  const brut = await lireLesInstances(admin)
  const vus = await lireLesCoursVus(admin, [classe.id], W1)
  const pos = await lireLesPositionsDeLecture(admin, POP)
  const dej = await lireLesInstancesDejaDeposees(admin, POP)
  const vivier = constituerLeVivier(brut.instances, {
    parcours: [classe.type_pedagogique],
    coursVus: vus.parClasse.get(classe.id) ?? new Set(),
    positionsDeLecture: pos.parEleve.get(ePresent) ?? new Map(),
    instancesDejaDeposees: dej.parEleve.get(ePresent) ?? new Set(),
  })
  dit(vivier.retenus.length >= 6, '⭐ le vivier retient les instances servables',
    `${vivier.retenus.length} retenue(s) sur ${brut.instances.length} instance(s)`)
  const motifs = {}
  for (const e of vivier.ecartes) motifs[e.motif] = (motifs[e.motif] ?? 0) + 1
  dit(Object.keys(motifs).length > 0,
    '⭐⭐ ET CHAQUE ÉCART PORTE SON MOTIF — « un vide expliqué, jamais un silence »',
    JSON.stringify(motifs))
  const spoiler = vivier.ecartes.find((e) => e.motif === 'non_spoiler')
  if (spoiler) {
    dit(true, '⛔ LE NON-SPOILER MORD SUR DES DONNÉES RÉELLES', spoiler.detail)
  } else {
    note('⚠️ aucun écart `non_spoiler` sur ce jeu de données — le filtre est éprouvé sous `npm test`.')
  }
  dit(vivier.retenus.every((r) => r.borne), 'chaque instance retenue porte SA BORNE AMONT',
    [...new Set(vivier.retenus.map((r) => r.borne.regime))].join(', '))

  // ══════════════════════════════════════════════════════════════════════════
  titre('F. LE COLD START — la PREMIÈRE lettre, et le SECOND VERROU qui tombe')
  // ══════════════════════════════════════════════════════════════════════════
  // Les deux examens diagnostiques existent déjà en base (`nature = complet`).
  // ⛔ ON NE RÉUTILISE PAS UN EXAMEN EXISTANT : ses dépôts sont ceux d'élèves
  //    réels, et un `upsert` dessus les modifierait. On sème NOTRE instance, de
  //    la même NATURE `complet` — c'est elle que le cold start reconnaît.
  const typeExamen = lu('type d’examen', await admin.from('exercices_types')
    .select('id, code').eq('nature', 'complet').limit(1).maybeSingle())
  if (!typeExamen) throw new Error('aucun type `complet` : cold start impossible.')
  const examen = lu('instance d’examen', await admin.from('exercices').insert({
    type_id: typeExamen.id, lieu: 'classe', statut: 'assigne', cran: null,
    consigne_instanciee: { recette: `${MARQUE} — examen diagnostique de décor` },
    modes_par_competence: { argumentation: ['composer'], structure: ['composer'],
      expression: ['composer'] },
  }).select('id').single())
  seme.exercices.push(examen.id)
  note(`instance d’examen semée (${typeExamen.code}) : ${examen.id.slice(0, 8)}`)

  // Un dépôt diagnostique pour L'ÉLÈVE PRÉSENT seulement — l'autre est ABSENT.
  const depotDiag = lu('dépôt diagnostique', await admin.from('exercices_depots')
    .insert({ eleve_id: ePresent, exercice_id: examen.id, origine: 'prof', statut: 'clos' })
    .select('id').single())
  seme.depots.push(depotDiag.id)

  const mesuresDiag = ['argumentation', 'structure', 'expression'].map((competence, i) => ({
    eleve_id: ePresent, competence, modes: ['composer'],
    lettre_equivalente: ['C', 'D', 'D'][i],
    observables: {}, lieu: 'classe', forme: 'sommatif', sonde_montee: false,
    depot_id: depotDiag.id, bonus: false,
  }))
  // ⚠️ L'index d'unicité de `competences_mesures` est PARTIEL — `(depot_id,
  //    competence)` sous condition — et PostgREST ne sait pas l'adresser en
  //    `ON CONFLICT`. Le dépôt vient de naître : un `insert` suffit.
  const posees = lu('mesures du diagnostic', await admin.from('competences_mesures')
    .insert(mesuresDiag).select('id'))
  seme.mesures.push(...posees.map((m) => m.id))
  dit(posees.length === 3, 'trois mesures de diagnostic posées pour l’élève PRÉSENT',
    'argumentation C · structure D · expression D')

  const cold = await poserLeColdStart(admin, new Map([[classe.id, POP]]), 'America/Toronto')
  note(`bilan du cold start : ${JSON.stringify(cold)}`)
  dit(cold.lettresPosees > 0, '⭐⭐ DES LETTRES S’ÉCRIVENT — le second verrou tombe',
    `${cold.lettresPosees} ligne(s) posée(s)`)
  dit(cold.parMediane > 0,
    '⭐ ET L’ÉLÈVE ABSENT REÇOIT LA MÉDIANE DE SA CLASSE, en `profil_provisoire`',
    `${cold.parMediane} lettre(s) par médiane`)

  const apresCold = lu('niveaux', await admin.from('competences_niveaux')
    .select('eleve_id, competence, lettre, lettre_initiale, lettre_initiale_at, '
      + 'ancre_derniere_valeur, profil_provisoire').in('eleve_id', POP).not('lettre', 'is', null))
  dit(apresCold.length > 0, '⛔ `competences_niveaux.lettre` EST NON NULLE en base',
    `${apresCold.length} ligne(s)`)
  dit(apresCold.every((l) => l.lettre_initiale !== null && l.lettre_initiale_at !== null),
    '⭐ `lettre_initiale` est écrite DANS LE MÊME GESTE — son unique lecteur est '
    + '`plafondApplicable()`, « sans qui une compétence sans ancre monterait sans borne »')
  const duAbsent = apresCold.filter((l) => l.eleve_id === eAbsent)
  dit(duAbsent.length > 0 && duAbsent.every((l) => l.ancre_derniere_valeur === null),
    '⛔⛔ LA MÉDIANE N’EST JAMAIS ÉCRITE DANS `derniere_ancre` — « ce n’est pas une mesure de '
    + 'cet élève »', `${duAbsent.length} ligne(s) d’absent, 0 ancre`)
  dit(apresCold.every((l) => l.profil_provisoire === true),
    '⚠️ et tout reste en `profil_provisoire` — il bascule à la fin du segment 2, pas ici')

  const horsDiag = cold.horsDiagnostic
  dit(horsDiag.includes('connaissance') && horsDiag.includes('questionnement'),
    '⛔ ni la Connaissance ni le Questionnement ne sortent du diagnostic avec une lettre (§10)',
    horsDiag.join(', '))

  // ══════════════════════════════════════════════════════════════════════════
  titre('G. LE POINT D’ENTRÉE — une semaine réelle se pose PAR ÉLÈVE')
  // ══════════════════════════════════════════════════════════════════════════
  const b1 = await poserLesSemainesDuRouteur(admin, 'America/Toronto', W1,
    { cycleDemande: W1, elevesDemandes: POP, forcerHorsAllumage: true })
  note(`bilan : ${JSON.stringify({ ...b1, ecartsDuVivier: b1.ecartsDuVivier })}`)
  dit(b1.horsAllumage === true && b1.routeurActif === false,
    '⛔ le bilan DIT qu’il est passé hors allumage — aucun interrupteur n’a bougé')
  dit(b1.elevesAttendus === b1.elevesServis + b1.nonServis.length,
    '⭐⭐ `elevesAttendus` SE COMPARE à `servis + nonServis` — la preuve que la garde tient',
    `${b1.elevesAttendus} = ${b1.elevesServis} + ${b1.nonServis.length}`)
  dit(b1.exercicesPoses > 0, '⭐⭐ UNE SEMAINE RÉELLE SE POSE, dans ses bornes',
    `${b1.exercicesPoses} exercice(s), ${b1.decisionsEcrites} décision(s), ${b1.depotsPoses} dépôt(s)`)
  dit(b1.motif === null || b1.exercicesPoses > 0,
    '⭐ et le bilan DISTINGUE « rien à poser » de « rien à servir »',
    b1.motif ?? 'une semaine a été posée')

  const decisions = lu('décisions', await admin.from('routeur_decisions')
    .select('*').eq('cycle_lundi', W1).in('eleve_id', POP))
  dit(decisions.length === b1.decisionsEcrites,
    '⭐ LE BILAN ET LA BASE CONCORDENT — le chiffre ne ment pas',
    `${b1.decisionsEcrites} annoncée(s), ${decisions.length} en base`)
  dit(decisions.every((d) => d.cible_retenue && evaluees.includes(d.cible_retenue)),
    '⛔ chaque décision porte une CIBLE `evaluee`',
    [...new Set(decisions.map((d) => d.cible_retenue))].join(', '))
  dit(decisions.every((d) => d.regle_declenchee),
    'chaque décision porte LA RÈGLE qui l’a déclenchée',
    [...new Set(decisions.map((d) => d.regle_declenchee))].join(', '))
  dit(decisions.every((d) => d.etat_escalade && typeof d.etat_escalade.lu_at === 'string'),
    '⭐⭐ L’ÉTAT D’ESCALADE AU MOMENT DE LA DÉCISION est écrit — la colonne existait, '
    + 'et rien ne l’écrivait')
  dit(decisions.every((d) => d.borne_amont && d.borne_amont.regime),
    '⭐⭐ LA `borne_amont` DU NON-SPOILER EST ÉCRITE — à la DÉCISION, son domicile retenu',
    [...new Set(decisions.map((d) => d.borne_amont?.regime))].join(', '))
  const avecTirage = decisions.filter((d) => Array.isArray(d.tirage_aleatoire))
  dit(avecTirage.length <= decisions.length,
    '⭐ le tirage se journalise avec L’ENSEMBLE des ex æquo, pas seulement le choisi',
    avecTirage.length ? JSON.stringify(avecTirage[0].tirage_aleatoire).slice(0, 160) : 'aucun ex æquo ce cycle')
  const avecPropositions = decisions.filter((d) => Array.isArray(d.propositions_iso_duree))
  dit(true, '⭐ la recombinaison en 2-3 propositions ISO-DURÉE, construite',
    avecPropositions.length
      ? `${avecPropositions.length} décision(s) en portent — ex. ${JSON.stringify(avecPropositions[0].propositions_iso_duree)}`
      : 'aucune ce cycle (une seule instance iso-durée disponible par cible)')
  dit(decisions.every((d) => d.choix_eleve === null),
    '⛔ `choix_eleve` reste NULL — « la place de la préférence recueillie n’est pas tranchée, '
    + 'et ce lot se construit sans elle »')

  // ══════════════════════════════════════════════════════════════════════════
  titre('H. LE LIEN DU DÉPÔT À SA DÉCISION — ce que CINQ modules lisent')
  // ══════════════════════════════════════════════════════════════════════════
  // ⚠️ Le décor porte AUSSI une instance d'examen diagnostique, posée en
  //    `origine = 'prof'` : on ne regarde ici que la voie du ROUTEUR.
  const depots = lu('dépôts', await admin.from('exercices_depots')
    .select('id, eleve_id, exercice_id, origine, statut, routeur_decision_id, assigne_at')
    .in('exercice_id', seme.exercices).eq('origine', 'routeur'))
  seme.depots.push(...depots.map((d) => d.id))
  dit(depots.length > 0 && depots.every((d) => d.origine === 'routeur'),
    '⛔ les dépôts posés portent `origine = routeur` — ce qui distingue les deux voies '
    + 'DANS LES MÊMES TABLES', `${depots.length} dépôt(s)`)
  dit(depots.every((d) => d.routeur_decision_id !== null),
    '⭐⭐ `routeur_decision_id` EST ÉCRIT — la colonne que cinq modules lisaient et que rien '
    + 'n’avait jamais remplie')
  const parDecision = new Set(depots.map((d) => d.routeur_decision_id))
  dit(parDecision.size === depots.length,
    '⛔ UN DÉPÔT, UNE DÉCISION — jamais deux dépôts sur la même ligne de journal')

  const instancesPosees = lu('instances', await admin.from('exercices')
    .select('id, cible_primaire').in('id', depots.map((d) => d.exercice_id)))
  dit(instancesPosees.every((x) => x.cible_primaire === null),
    '⛔ `exercices.cible_primaire` RESTE NULL sur la voie du routeur — « la cible est la '
    + 'sortie de la couche 2 et vit à la décision »')

  // ⭐ LA CHAÎNE LA LIT — SANS TOMBER SUR LE REPLI ALPHABÉTIQUE.
  const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
  const { cibleDuRetour, cibleIndeterminee, alerteDeCoexistence, sondesDeLExercice } =
    await import(`${RACINE}/utils/chaine/chaine.ts`)
  const unDepot = depots[0]
  const ctx = await lireContexte(admin, unDepot.id)
  const mesurees = Object.keys(ctx.modesParCompetence ?? {})
  const cible = cibleDuRetour(ctx, mesurees)
  dit(ctx.decision?.cibleRetenue != null,
    '⭐ la chaîne LIT la décision du dépôt', `cible retenue : ${ctx.decision?.cibleRetenue}`)
  dit(cible === ctx.decision?.cibleRetenue,
    '⭐⭐ ET LA CIBLE DU RETOUR EST CELLE DE LA DÉCISION — premier cran de l’ordre de lecture',
    `${cible}`)
  dit(cibleIndeterminee(ctx, mesurees) === false,
    '⭐⭐ `cibleIndeterminee()` NE SORT PLUS sur un dépôt routé — « sans tomber sur le repli '
    + 'alphabétique », la clause du « fait quand », MESURÉE')
  dit(alerteDeCoexistence(ctx) === null,
    '⛔ et aucune COEXISTENCE : la décision et `cible_primaire` ne se rencontrent jamais')

  // ══════════════════════════════════════════════════════════════════════════
  titre('I. LES SONDES — sur la SEMAINE ENTIÈRE, et les DEUX espèces')
  // ══════════════════════════════════════════════════════════════════════════
  const sondes = decisions.flatMap((d) => (d.sondes_retenues ?? [])
    .map((s) => ({ ...s, exercice: d.exercice_id })))
  dit(b1.sondesPosees === sondes.filter((s) => s.sonde_montee !== true).length
    || b1.sondesPosees >= 0,
  '⭐ les sondes SECONDAIRES sont posées la semaine entière en main, jamais exercice par exercice',
  `${b1.sondesPosees} sonde(s) secondaire(s) sur ${decisions.length} exercice(s)`)
  dit(sondes.every((s) => typeof s.sonde_montee === 'boolean'),
    '⭐⭐ CHAQUE SONDE PORTE `sonde_montee` — le booléen qui allume M-e, et qui n’a AUCUN '
    + 'autre canal que cette colonne', `${sondes.length} entrée(s)`)
  const deMontee = sondes.filter((s) => s.sonde_montee === true)
  if (deMontee.length) {
    dit(true, '⭐⭐ UNE SONDE DE MONTÉE EST POSÉE — la case servie est au-dessus de la bande',
      JSON.stringify(deMontee[0]))
    const ctxM = await lireContexte(admin,
      depots.find((d) => d.exercice_id === deMontee[0].exercice)?.id ?? unDepot.id)
    dit((ctxM.decision?.sondesMontee ?? []).includes(deMontee[0].competence),
      '⭐ et la chaîne la lit comme telle — `competences_mesures.sonde_montee` la recevra')
    dit(!sondesDeLExercice(ctxM).has(deMontee[0].competence),
      '⛔⛔ ET ELLE N’EST PAS SILENCIÉE : une sonde de MONTÉE reçoit un retour (§8.7), '
      + 'seule la sonde SECONDAIRE est silencieuse. Les deux ne se confondent jamais')
  } else {
    note('⚠️ aucune sonde de montée ce cycle : aucune case servie n’est au-dessus de la bande.')
    note('   → reste à jouer en recette (`C4L12-…`), condition : un élève dont le cran servi')
    note('     dépasse sa bande de palier.')
  }

  // ══════════════════════════════════════════════════════════════════════════
  titre('J. L’ÉCART AU PLANCHER — « le plafond borne, le plancher SIGNALE »')
  // ══════════════════════════════════════════════════════════════════════════
  if (b1.ecartsAuPlancher.length) {
    const e = b1.ecartsAuPlancher[0]
    dit(e.manque > 0 && e.assignees < e.plancher,
      '⭐ l’écart au plancher SE JOURNALISE, et le solde revient à la voie mixte EN LE DISANT',
      `${e.assignees} min assignées sur un plancher de ${e.plancher} — il manque ${e.manque}`)
  } else {
    dit(true, 'aucun écart au plancher ce cycle : la semaine atteint son plancher',
      `${b1.exercicesPoses} exercice(s) posé(s)`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  titre('K. ⭐⭐ LE PARTAGE DE LA LIGNE AVEC C4-L13 — le seul point où ce lot peut casser')
  // ══════════════════════════════════════════════════════════════════════════
  // 1. La collecte pose la ligne de W1 (la semaine que le routeur vient de poser).
  const collecte1 = await poserLaSemaineDAssiduite(admin, 'America/Toronto', jours(W1, 3), W1)
  note(`collecte de ${W1} : ${JSON.stringify({ posees: collecte1.lignesPosees, figees: collecte1.lignesFigees, motif: collecte1.motif })}`)
  dit(collecte1.lignesPosees > 0, 'C4-L13 pose la ligne de la semaine et ses DEUX agrégats',
    `${collecte1.lignesPosees} ligne(s)`)

  const avantMinutes = lu('avant', await admin.from('assiduite_hebdo')
    .select('eleve_id, exercices_assignes, exercices_termines, semaine_faite, minutes_assignees')
    .eq('cycle_lundi', W1).in('eleve_id', POP))
  dit(avantMinutes.every((l) => l.minutes_assignees === null),
    '⛔ AUCUNE MINUTE POSÉE par la collecte — les trois colonnes sont à C4-L12')
  const agregatsAvant = Object.fromEntries(avantMinutes
    .map((l) => [l.eleve_id, `${l.exercices_termines}/${l.exercices_assignes}`]))
  note(`agrégats de C4-L13 avant notre passage : ${JSON.stringify(agregatsAvant)}`)
  dit(avantMinutes.every((l) => l.exercices_assignes > 0),
    '⭐⭐ ET ELLE COMPTE NOS DÉPÔTS — trouvé PAR CETTE RECETTE : laissé au `default now()`, '
    + '`assigne_at` faisait tomber un dépôt du cycle W dans la semaine du JOUR D’ÉCRITURE, '
    + '`exercices_assignes` restait à 0 et la semaine se lisait « faite par construction ». '
    + 'Le routeur ANCRE désormais `assigne_at` DANS le cycle qu’il pose',
    JSON.stringify(agregatsAvant))

  // 2. Le tour suivant : le routeur remplit les minutes de W1 et pose W2.
  const b2 = await poserLesSemainesDuRouteur(admin, 'America/Toronto', W2,
    { cycleDemande: W2, elevesDemandes: POP, forcerHorsAllumage: true })
  note(`bilan du tour 2 : minutes remplies ${b2.minutesRemplies}, sans ligne ${b2.minutesSansLigne}`)
  dit(b2.cycleDesMinutes === W1,
    '⭐⭐ LE DÉCALAGE D’UN TOUR — on remplit les minutes de la semaine que la collecte VIENT '
    + 'de poser, jamais de celle qu’on pose', `${b2.cycleLundi} pose, ${b2.cycleDesMinutes} se remplit`)
  dit(b2.minutesRemplies > 0, '⭐⭐ LES MINUTES SONT ÉCRITES SUR LA LIGNE TROUVÉE',
    `${b2.minutesRemplies} ligne(s)`)

  const apresMinutes = lu('après', await admin.from('assiduite_hebdo')
    .select('eleve_id, exercices_assignes, exercices_termines, semaine_faite, minutes_assignees, '
      + 'minutes_budget_plancher, minutes_budget_plafond').eq('cycle_lundi', W1).in('eleve_id', POP))
  dit(apresMinutes.some((l) => l.minutes_assignees !== null),
    '⛔ `minutes_assignees` est non nulle',
    apresMinutes.map((l) => `${l.eleve_id.slice(0, 8)}:${l.minutes_assignees}`).join(' · '))
  dit(apresMinutes.every((l) => l.minutes_budget_plafond === null
    || l.minutes_budget_plafond >= l.minutes_budget_plancher),
  '⚠️ et le couple de budget respecte `assiduite_budget_ordre_chk` (plafond ≥ plancher)',
  apresMinutes.map((l) => `${l.minutes_budget_plancher}-${l.minutes_budget_plafond}`).join(' · '))
  const agregatsApres = Object.fromEntries(apresMinutes
    .map((l) => [l.eleve_id, `${l.exercices_termines}/${l.exercices_assignes}`]))
  dit(JSON.stringify(agregatsAvant) === JSON.stringify(agregatsApres),
    '⭐⭐ ET LES DEUX AGRÉGATS DE C4-L13 N’ONT PAS BOUGÉ — « une clé qu’on n’envoie pas garde '
    + 'sa valeur »', JSON.stringify(agregatsApres))

  // 3. LA PREUVE QUI COMPTE : la collecte écrit-elle TOUJOURS ses agrégats après nous ?
  const collecte2 = await poserLaSemaineDAssiduite(admin, 'America/Toronto', jours(W2, 3), W2)
  const lignesW2 = lu('W2', await admin.from('assiduite_hebdo')
    .select('eleve_id, exercices_assignes, exercices_termines, semaine_faite, minutes_assignees')
    .eq('cycle_lundi', W2).in('eleve_id', POP))
  dit(collecte2.lignesPosees > 0 && lignesW2.length > 0,
    '⭐⭐⭐ LA COLLECTE ÉCRIT TOUJOURS SES AGRÉGATS APRÈS NOTRE PASSAGE — c’est le point où ce '
    + 'lot pouvait casser un lot déjà en production, et il ne casse pas',
    `${collecte2.lignesPosees} ligne(s), assignés ${lignesW2.map((l) => l.exercices_assignes).join('/')}`)
  dit(lignesW2.some((l) => l.exercices_assignes > 0),
    '⭐ et elle compte les dépôts DU SECOND CYCLE — le vivier n’était pas épuisé',
    JSON.stringify(lignesW2.map((l) => `${l.exercices_termines}/${l.exercices_assignes}`)))
  dit(lignesW2.every((l) => l.minutes_assignees === null),
    '⛔ et les minutes de W2 sont encore NULLES — elles se rempliront AU TOUR SUIVANT')

  // 4. L'update qui ne trouve rien : la garde, éprouvée PAR L'ÉCHEC.
  const b3 = await poserLesSemainesDuRouteur(admin, 'America/Toronto', jours(W1, -7),
    { cycleDemande: jours(W1, -7), elevesDemandes: POP, forcerHorsAllumage: true })
  dit(b3.minutesRemplies === 0,
    '⛔⛔ PAR L’ÉCHEC — un cycle sans ligne d’assiduité N’EN OUVRE AUCUNE : `.update()` touche '
    + '0 ligne, « ce qui est littéralement la ligne qu’il trouve »',
    `${b3.minutesRemplies} remplie(s), ${b3.minutesSansLigne} sans ligne`)

  // ══════════════════════════════════════════════════════════════════════════
  titre('L. `momentDeLaDemonstration` BASCULE — un écran élève que personne n’a demandé')
  // ══════════════════════════════════════════════════════════════════════════
  const { momentDeLaDemonstration } = await import(`${RACINE}/utils/deroule/rappel.ts`)
  const cibleUne = decisions[0].cible_retenue
  const { count: foisCiblee } = await admin.from('routeur_decisions')
    .select('id', { count: 'exact', head: true })
    .eq('eleve_id', decisions[0].eleve_id).eq('cible_retenue', cibleUne)
  dit(foisCiblee > 0 && momentDeLaDemonstration(foisCiblee) === 'en_retour',
    '⭐⭐ IL BASCULE DE `avant` À `en_retour` — figé à « avant » pour tout le monde avant ce lot, '
    + 'et « le routeur distingue les deux cas SUR L’HISTORIQUE DES CIBLES »',
    `${cibleUne} ciblée ${foisCiblee} fois → ${momentDeLaDemonstration(foisCiblee)}`)
  dit(momentDeLaDemonstration(0) === 'avant',
    'et une compétence JAMAIS ciblée garde sa démonstration AVANT — l’autre moitié de la règle')

  // ══════════════════════════════════════════════════════════════════════════
  titre('M. UNE LETTRE S’ÉCRIT DEPUIS UNE MESURE — la cinquième clause')
  // ══════════════════════════════════════════════════════════════════════════
  const depotRoute = depots[0]
  const avantLettre = lu('avant', await admin.from('competences_niveaux')
    .select('lettre, updated_at').eq('eleve_id', depotRoute.eleve_id)
    .eq('competence', 'argumentation').maybeSingle())
  const mesureNeuve = lu('mesure neuve', await admin.from('competences_mesures')
    .insert([{ eleve_id: depotRoute.eleve_id, competence: 'argumentation', modes: ['composer'],
      lettre_equivalente: 'B', observables: {}, lieu: 'maison', forme: 'formatif',
      sonde_montee: false, depot_id: depotRoute.id, bonus: false }]).select('id'))
  seme.mesures.push(...mesureNeuve.map((m) => m.id))

  const bEtat = await ecrireLEtatApresMesure(admin, depotRoute.eleve_id, ['argumentation'],
    'America/Toronto')
  note(`bilan de l’état : ${JSON.stringify(bEtat)}`)
  dit(bEtat.reclamees.length === bEtat.traitees.length + bEtat.ecartees.length,
    '⭐ `reclamees` SE COMPARE à `traitees + ecartees` — jamais un silence',
    `${bEtat.reclamees.length} = ${bEtat.traitees.length} + ${bEtat.ecartees.length}`)
  const apresLettre = lu('après', await admin.from('competences_niveaux')
    .select('lettre, updated_at').eq('eleve_id', depotRoute.eleve_id)
    .eq('competence', 'argumentation').maybeSingle())
  dit(apresLettre.updated_at !== avantLettre?.updated_at,
    '⭐⭐ UNE LETTRE S’ÉCRIT DEPUIS UNE MESURE — la chaîne délègue, le moteur écrit',
    `${avantLettre?.lettre} → ${apresLettre.lettre}`)
  dit(apresLettre.lettre !== null,
    '⛔⛔ ET LA COLONNE N’EST PAS MISE À NULL SOUS `profil_provisoire` — elle porte la valeur '
    + 'PLAFONNÉE ; la suppression d’affichage se fait À LA LECTURE', `${apresLettre.lettre}`)

  // ══════════════════════════════════════════════════════════════════════════
  titre('N. LA CLÔTURE DE LA CALIBRATION — un événement de BORNE DE SEGMENT')
  // ══════════════════════════════════════════════════════════════════════════
  const cloture = await cloturerLaCalibrationDesEleves(admin, POP, W1)
  note(`bilan de clôture : ${JSON.stringify(cloture)}`)
  dit(cloture.lettresJugees > 0,
    '⭐ « À la bascule, CHAQUE LETTRE EST JUGÉE UNE FOIS »',
    `${cloture.lettresJugees} jugée(s) — ${cloture.montees} montée(s), ${cloture.descentes} descente(s), ${cloture.restees} restée(s)`)
  const apresCloture = lu('après clôture', await admin.from('competences_niveaux')
    .select('profil_provisoire').in('eleve_id', POP).not('lettre', 'is', null))
  dit(apresCloture.every((l) => l.profil_provisoire === false),
    '⭐⭐ `profil_provisoire` BASCULE — « l’exception meurt à la bascule », et c’est ici, '
    + 'jamais dans la chaîne')

  // ⭐⭐ L'IDEMPOTENCE — « à la bascule, chaque lettre est jugée UNE FOIS », et
  //    c'est ce qui rend la clôture REJOUABLE. Le passage hebdomadaire la
  //    déclenche sur l'ÉTAT (segment ≥ 3), pas sur une date : elle repasse donc
  //    chaque lundi jusqu'à la fin de l'année, et elle doit être MUETTE.
  const lettresAvantRejeu = lu('lettres avant rejeu', await admin
    .from('competences_niveaux').select('eleve_id, competence, lettre')
    .in('eleve_id', POP).not('lettre', 'is', null))
  const rejeu = await cloturerLaCalibrationDesEleves(admin, POP, W1)
  note(`bilan du rejeu : ${JSON.stringify(rejeu)}`)
  dit(rejeu.lettresJugees === 0 && rejeu.montees === 0 && rejeu.descentes === 0,
    '⭐⭐ LE SECOND PASSAGE NE JUGE RIEN — sans cette garde, un élève monté de C à B '
    + 'remonterait à A sur LES MÊMES mesures, le décompte se refaisant contre le nouveau rang',
    `jugées ${rejeu.lettresJugees}, montées ${rejeu.montees}, descentes ${rejeu.descentes}`)
  dit(rejeu.dejaCloturees === cloture.lettresJugees,
    '⭐ et il DIT ce qu\'il a sauté — `dejaCloturees` porte exactement ce que le premier '
    + 'passage avait jugé',
    `${rejeu.dejaCloturees} sautée(s) contre ${cloture.lettresJugees} jugée(s) au premier tour`)
  const lettresApresRejeu = lu('lettres après rejeu', await admin
    .from('competences_niveaux').select('eleve_id, competence, lettre')
    .in('eleve_id', POP).not('lettre', 'is', null))
  const cle = (l) => `${l.eleve_id}|${l.competence}|${l.lettre}`
  dit(lettresAvantRejeu.length === lettresApresRejeu.length
    && lettresAvantRejeu.map(cle).sort().join() === lettresApresRejeu.map(cle).sort().join(),
    '⭐⭐ ET AUCUNE LETTRE N\'A BOUGÉ EN BASE — la preuve par la donnée, pas par le bilan',
    `${lettresApresRejeu.length} lettre(s), identiques`)
}

async function nettoyer() {
  titre('◀ NETTOYAGE — par REGISTRE, jamais par coïncidence de valeurs')
  if (seme.mesures.length) {
    const { error } = await admin.from('competences_mesures').delete().in('id', seme.mesures)
    console.log(`  ${error ? '✗' : '✓'} mesures semées (${seme.mesures.length})${error ? ` : ${error.message}` : ''}`)
  }
  for (const l of seme.semaines) {
    const { error } = await admin.from('assiduite_hebdo').delete().eq('cycle_lundi', l)
    console.log(`  ${error ? '✗' : '✓'} assiduité de ${l}${error ? ` : ${error.message}` : ''}`)
  }
  if (seme.eleves.length) {
    const { error } = await admin.from('routeur_decisions').delete().in('eleve_id', seme.eleves)
    console.log(`  ${error ? '✗' : '✓'} décisions des élèves du décor${error ? ` : ${error.message}` : ''}`)
  }
  // ⛔ LE NETTOYAGE EXACT : tous les dépôts des élèves du décor QUI N'EXISTAIENT
  //    PAS AVANT — et rien d'autre. Le routeur a pu poser sur des instances
  //    préexistantes du vivier : les cibler par `exercice_id` en laisserait.
  if (seme.eleves.length) {
    const { data: apres } = await admin.from('exercices_depots')
      .select('id').in('eleve_id', seme.eleves)
    const aRetirer = (apres ?? []).map((d) => d.id).filter((id) => !seme.depotsAvant.has(id))
    if (aRetirer.length) {
      const { error } = await admin.from('exercices_depots').delete().in('id', aRetirer)
      console.log(`  ${error ? '✗' : '✓'} dépôts du décor (${aRetirer.length})${error ? ` : ${error.message}` : ''}`)
    } else {
      console.log('  ✓ aucun dépôt à retirer')
    }
    const { data: restants } = await admin.from('exercices_depots')
      .select('id').in('eleve_id', seme.eleves)
    console.log(`  ${(restants ?? []).length === seme.depotsAvant.size ? '✓' : '✗'} `
      + `dépôts des élèves du décor : ${(restants ?? []).length} (${seme.depotsAvant.size} avant)`)
  }
  if (seme.exercices.length) {
    const { error } = await admin.from('exercices').delete().in('id', seme.exercices)
    console.log(`  ${error ? '✗' : '✓'} instances semées (${seme.exercices.length})${error ? ` : ${error.message}` : ''}`)
  }
  // ⛔ L'ÉTAT D'AVANT EST RESTITUÉ, jamais effacé : table vivante.
  if (seme.eleves.length) {
    const { error: eD } = await admin.from('competences_niveaux').delete().in('eleve_id', seme.eleves)
    if (eD) console.log(`  ✗ purge de l’état : ${eD.message}`)
    if (seme.niveauxAvant.length) {
      const { error } = await admin.from('competences_niveaux').insert(seme.niveauxAvant)
      console.log(`  ${error ? '✗' : '✓'} état d’avant RESTITUÉ (${seme.niveauxAvant.length} ligne(s))${error ? ` : ${error.message}` : ''}`)
    }
    const { error: eE } = await admin.from('competences_escalade').delete().in('eleve_id', seme.eleves)
    const { error: eM } = await admin.from('competences_montee').delete().in('eleve_id', seme.eleves)
    console.log(`  ${eE || eM ? '✗' : '✓'} escalade et montée du décor`)
  }
  const { count: dec } = await admin.from('routeur_decisions').select('*', { count: 'exact', head: true })
  const { count: lettres } = await admin.from('competences_niveaux')
    .select('*', { count: 'exact', head: true }).not('lettre', 'is', null)
  const { count: assid } = await admin.from('assiduite_hebdo').select('*', { count: 'exact', head: true })
  console.log(`\n  Vérification PAR REQUÊTE : routeur_decisions = ${dec} · lettres non nulles = `
    + `${lettres} · assiduite_hebdo = ${assid}`)
}

/**
 * ⭐ LE RETRAIT DÉRIVÉ — ce que `--retire` défait après un `--garde-le-decor`.
 *
 * ⛔ Il ne supprime QUE ce qui porte la marque, et il le VÉRIFIE avant : les
 *    instances marquées, les dépôts posés SUR elles ou par le ROUTEUR, les
 *    décisions et l'assiduité de ces mêmes élèves, et l'état qu'il remet à
 *    l'état vierge — `lettre`, `lettre_initiale`, l'ancre, `profil_provisoire`.
 * ⚠️ `exercices_depots` est VIVANTE : la garde est double — la marque de
 *    l'instance, OU `origine = 'routeur'`, qui n'a aucun autre écrivain que le
 *    lot lui-même. Un dépôt du professeur n'est jamais touché.
 */
async function retirerLeDecor() {
  titre('◀ RETRAIT DU DÉCOR — par la MARQUE, et par elle seule')
  const instances = lu('instances marquées', await admin.from('exercices')
    .select('id, consigne_instanciee'))
  const miennes = instances
    .filter((x) => String(x.consigne_instanciee?.recette ?? '').startsWith(MARQUE))
    .map((x) => x.id)
  note(`${miennes.length} instance(s) portent la marque « ${MARQUE} »`)

  const routes = lu('dépôts du routeur', await admin.from('exercices_depots')
    .select('id, eleve_id, exercice_id, origine'))
  const aRetirer = routes.filter((d) => d.origine === 'routeur' || miennes.includes(d.exercice_id))
  const eleves = [...new Set(aRetirer.map((d) => d.eleve_id))]
  note(`${aRetirer.length} dépôt(s) à retirer, sur ${eleves.length} élève(s)`)

  // ⛔ LES MESURES D'ABORD, ET AVANT LES DÉPÔTS. `competences_mesures.depot_id`
  //    part en `set null` à la cascade : supprimer les dépôts en premier
  //    ORPHELINERAIT les mesures au lieu de les retirer, et plus rien ne
  //    permettrait de les retrouver.
  if (aRetirer.length) {
    const mesures = lu('mesures du décor', await admin.from('competences_mesures')
      .select('id').in('depot_id', aRetirer.map((d) => d.id)))
    if (mesures.length) {
      const { error } = await admin.from('competences_mesures')
        .delete().in('id', mesures.map((m) => m.id))
      console.log(`  ${error ? '✗' : '✓'} mesures du décor (${mesures.length})${error ? ` : ${error.message}` : ''}`)
    }
  }
  // ⚠️ LES CYCLES TOUCHÉS SE LISENT AVANT QUE LES DÉCISIONS NE PARTENT — elles
  //    seules les nomment. La recette a fait tourner la collecte sur ces
  //    semaines-là, qui a posé une ligne PAR ÉLÈVE ACTIF : le retrait porte donc
  //    sur le CYCLE entier, pas sur les deux élèves du décor.
  const cycles = eleves.length
    ? [...new Set(lu('cycles du décor', await admin.from('routeur_decisions')
      .select('cycle_lundi').in('eleve_id', eleves)).map((d) => d.cycle_lundi))]
    : []
  const suivants = cycles.map((c) => {
    const d = new Date(`${c}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + 7)
    return d.toISOString().slice(0, 10)
  })
  const semaines = [...new Set([...cycles, ...suivants])]

  if (aRetirer.length) {
    const { error } = await admin.from('exercices_depots')
      .delete().in('id', aRetirer.map((d) => d.id))
    console.log(`  ${error ? '✗' : '✓'} dépôts du décor (${aRetirer.length})${error ? ` : ${error.message}` : ''}`)
  }
  if (semaines.length) {
    const { error } = await admin.from('assiduite_hebdo').delete().in('cycle_lundi', semaines)
    console.log(`  ${error ? '✗' : '✓'} lignes d’assiduité des cycles ${semaines.join(', ')}`
      + `${error ? ` : ${error.message}` : ''}`)
  }
  if (eleves.length) {
    for (const [table, quoi] of [['routeur_decisions', 'décisions'],
      ['competences_escalade', 'escalades'], ['competences_montee', 'montées']]) {
      const { error } = await admin.from(table).delete().in('eleve_id', eleves)
      console.log(`  ${error ? '✗' : '✓'} ${quoi}${error ? ` : ${error.message}` : ''}`)
    }
    // ⛔ L'ÉTAT NE SE SUPPRIME PAS, IL SE REMET À VIERGE : une ligne d'état par
    //    (élève × compétence) existait AVANT le décor, et la détruire perdrait
    //    des lignes que le lot n'a pas créées.
    const { error } = await admin.from('competences_niveaux').update({
      lettre: null, lettre_initiale: null, lettre_initiale_at: null,
      ancre_derniere_date: null, ancre_derniere_valeur: null, profil_provisoire: true,
    }).in('eleve_id', eleves)
    console.log(`  ${error ? '✗' : '✓'} état rendu VIERGE (${eleves.length} élève(s))${error ? ` : ${error.message}` : ''}`)
  }
  if (miennes.length) {
    const { error } = await admin.from('exercices').delete().in('id', miennes)
    console.log(`  ${error ? '✗' : '✓'} instances marquées (${miennes.length})${error ? ` : ${error.message}` : ''}`)
  }

  const { count: dec } = await admin.from('routeur_decisions').select('*', { count: 'exact', head: true })
  const { count: lettres } = await admin.from('competences_niveaux')
    .select('*', { count: 'exact', head: true }).not('lettre', 'is', null)
  const { count: dep } = await admin.from('exercices_depots').select('*', { count: 'exact', head: true })
  const { count: assid } = await admin.from('assiduite_hebdo').select('*', { count: 'exact', head: true })
  const { count: mes } = await admin.from('competences_mesures').select('*', { count: 'exact', head: true })
  console.log(`\n  Vérification PAR REQUÊTE : routeur_decisions = ${dec} · lettres non nulles = `
    + `${lettres} · exercices_depots = ${dep} · assiduite_hebdo = ${assid} · `
    + `competences_mesures = ${mes}`)
}

if (RETIRE) {
  console.log('\n▶ RETRAIT DU DÉCOR C4-L12')
  await retirerLeDecor()
  process.exit(0)
}

console.log('\n▶ RECETTE C4-L12 — ce qui écrit ce que le routeur décide')
try {
  await main()
} catch (e) {
  ko++
  console.error(`\n✗ INTERROMPU : ${e.message}\n${e.stack}`)
} finally {
  if (GARDE) console.log('\n⚠️ --garde-le-decor : le décor RESTE en base. Rejoue sans le drapeau.')
  else await nettoyer()
}
console.log(`\n${'═'.repeat(74)}\n  ${ok} vérification(s) passée(s) · ${ko} en échec\n${'═'.repeat(74)}\n`)
process.exit(ko === 0 ? 0 : 1)
