// ============================================================================
// RECETTE C4 · L13 — LES COMPTEURS D'ASSIDUITÉ, DE BOUT EN BOUT.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/assiduite-c4l13.mjs [--garde-le-decor]
//
// ⭐ POURQUOI UNE TRAVERSÉE, ET PAS UN COUP D'ŒIL À L'ÉCRAN. Le « fait quand »
//    du lot demande que « les écrans de C4-L2 cessent de lire un décor » — or à
//    l'écran, un semis et une mesure sont INDISCERNABLES : `assiduite_hebdo` n'a
//    aucune colonne de provenance, et aucun garde côté lecture ne peut les
//    départager. La seule preuve possible est donc celle-ci : semer de VRAIS
//    dépôts, faire tourner le vrai déclencheur, et CONFRONTER la ligne posée au
//    compte des dépôts, recompté indépendamment par requête.
//
// ⚠️ IL ÉCRIT DANS DES TABLES VIVANTES. Tout ce qu'il sème pend à UNE instance
//    marquée `[RECETTE C4-L13]` : le nettoyage supprime par `exercice_id`, jamais
//    par une coïncidence de valeurs (c'est exactement la faute du décor de C4-L2,
//    qui supprimait `assiduite_hebdo` sur `minutes_assignees = 50`).
//
// ⚠️ Toute lecture passe par `lu()`, QUI LÈVE — « supabase-js ne lève pas : un
//    select d'une colonne absente rend {data: null, error}, et (data ?? []).length
//    rend alors zéro, qui ressemble à une mesure ».
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
// Le code applicatif (la route, `createAdminClient`) lit `process.env` : sans
// cette ligne, la route monte un client sans URL et échoue « supabaseUrl is required ».
for (const [k, v] of Object.entries(env)) process.env[k] ??= v
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const MARQUE = '[RECETTE C4-L13]'
const GARDE = process.argv.includes('--garde-le-decor')

// La semaine comptée : le premier lundi de travail du semestre non archivé.
// (Résolue à l'exécution — jamais une date en dur.)
let SEMAINE = null

let ok = 0
let ko = 0
const lu = (nom, { data, error }) => { if (error) throw new Error(`${nom} : ${error.message}`); return data }
const titre = (t) => console.log(`\n${'─'.repeat(74)}\n${t}\n${'─'.repeat(74)}`)
const note = (t) => console.log(`   ${t}`)
const dit = (cond, libelle, detail = '') => {
  if (cond) ok++; else ko++
  console.log(`  ${cond ? '✓' : '✗'} ${libelle}${detail ? `  — ${detail}` : ''}`)
}

const seme = { exercices: [], depots: [], semaines: new Set() }

async function main() {
  // ══════════════════════════════════════════════════════════════════════════
  titre('A. L’ÉTAT D’ENTRÉE — ce qu’on trouve avant d’écrire une ligne')
  // ══════════════════════════════════════════════════════════════════════════
  const { count: avant } = await admin.from('assiduite_hebdo')
    .select('*', { count: 'exact', head: true })
  dit(avant === 0, '`assiduite_hebdo` est VIDE au départ', `${avant} ligne(s)`)
  if (avant !== 0) {
    note('⚠️ La table n’est pas vide. Regarde les minutes AVANT de continuer : une ligne dont')
    note('   `minutes_assignees = 50` et `minutes_budget_plancher = 45` est un SEMIS DE DÉCOR.')
  }

  const inter = lu('interrupteurs', await admin.from('scriptorium_params')
    .select('exercices_actif, routeur_actif, competences_affichage_actif, '
      + 'fabrique_actif, chaine_actif, passation_classe_actif').eq('id', 1).maybeSingle())
  const tousOff = Object.values(inter).every((v) => v === false)
  dit(tousOff, '⛔ les SIX interrupteurs sont à OFF, et ce lot n’en bouge aucun',
    JSON.stringify(inter))

  const seuils = lu('seuils', await admin.from('scriptorium_params')
    .select('assiduite_seuil_semaine_faite').eq('id', 1).maybeSingle())
  const SEUIL = Number(seuils.assiduite_seuil_semaine_faite)
  dit(Number.isFinite(SEUIL), '⛔ le seuil est LU EN CONFIGURATION, jamais 0,75 en dur',
    `assiduite_seuil_semaine_faite = ${SEUIL}`)

  // La semaine de travail réelle, résolue par le même code que l'écrivain.
  const { semainesDeTravail } = await import(`${RACINE}/utils/assiduite/collecte.ts`)
  const semestres = lu('semestres', await admin.from('semesters')
    .select('id, start_date, end_date').is('archived_at', null).order('start_date'))
  const vacances = lu('vacances', await admin.from('holidays')
    .select('semester_id, label, start_date, end_date'))
  const grille = semainesDeTravail(semestres, vacances)
  if (!grille.length) throw new Error('aucune semaine de travail : le Calendrier est vide.')
  SEMAINE = grille[0].lundi
  seme.semaines.add(SEMAINE)
  dit(new Date(`${SEMAINE}T00:00:00Z`).getUTCDay() === 1,
    `la semaine comptée est un LUNDI ISO — la base refuse tout autre jour`,
    `${SEMAINE} (semaine pédagogique ${grille[0].numero})`)

  const fuseau = (lu('fuseau', await admin.from('calendrier_params')
    .select('fuseau').eq('id', 1).maybeSingle()))?.fuseau ?? 'America/Toronto'
  note(`fuseau de l’école : ${fuseau}`)

  // La population attendue — active × active, DÉDOUBLONNÉE.
  const classes = lu('classes', await admin.from('classes').select('id, nom').eq('statut', 'active'))
  const inscr = lu('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id').eq('statut', 'active')
    .in('classe_id', classes.map((c) => c.id)))
  const POPULATION = [...new Set(inscr.map((i) => i.eleve_id))]
  dit(POPULATION.length > 0, '⭐ la population visée : les élèves ACTIFS, DÉDOUBLONNÉS',
    `${inscr.length} inscription(s) → ${POPULATION.length} élève(s)`)
  dit(inscr.length >= POPULATION.length,
    inscr.length > POPULATION.length
      ? '⛔⛔ UN ÉLÈVE EST INSCRIT DANS DEUX CLASSES — sans dédoublonnage, l’upsert porterait '
        + 'deux fois la même clé et Postgres REFUSERAIT TOUT LE LOT (21000)'
      : 'aucun élève multi-classes dans cette base — le dédoublonnage reste la garde',
    `${inscr.length - POPULATION.length} doublon(s)`)

  // ══════════════════════════════════════════════════════════════════════════
  titre('B. LA ROUTE — sa garde, éprouvée PAR L’ÉCHEC')
  // ══════════════════════════════════════════════════════════════════════════
  const appelSansSecret = async () => {
    delete process.env.CRON_SECRET
    const mod = await import(`${RACINE}/app/api/assiduite/hebdo/route.ts`)
    return mod.GET(new Request('https://local/api/assiduite/hebdo'))
  }
  const rSansVar = await appelSansSecret()
  dit(rSansVar.status === 401,
    '⭐ PAR L’ÉCHEC — `CRON_SECRET` ABSENTE DE L’ENVIRONNEMENT → 401. Un déploiement sans la '
    + 'variable est FERMÉ, pas ouvert', `status ${rSansVar.status}`)

  process.env.CRON_SECRET = 'recette-c4l13'
  const { GET } = await import(`${RACINE}/app/api/assiduite/hebdo/route.ts`)
  const appel = (entetes) => GET(new Request('https://local/api/assiduite/hebdo', { headers: entetes }))

  const rSans = await appel({})
  dit(rSans.status === 401, '⭐ PAR L’ÉCHEC — sans `Bearer`, 401', `status ${rSans.status}`)
  const rFaux = await appel({ authorization: 'Bearer pas-le-bon' })
  dit(rFaux.status === 401, '⭐ PAR L’ÉCHEC — avec un MAUVAIS secret, 401 aussi', `status ${rFaux.status}`)
  const rParam = await appel({})
  dit(rParam.status === 401,
    'la garde est un EN-TÊTE, pas un paramètre — une URL ne l’ouvre pas', `status ${rParam.status}`)

  const bon = { authorization: 'Bearer recette-c4l13' }
  const rBon = await appel(bon)
  const bilanRoute = await rBon.json()
  dit(rBon.status === 200, '200 dès que le secret passe, le corps portant le BILAN',
    `status ${rBon.status}`)
  note(`bilan de la route (semaine réelle écoulée) : ${JSON.stringify(bilanRoute)}`)
  if (bilanRoute.semaineLundi) seme.semaines.add(bilanRoute.semaineLundi)

  dit(typeof bilanRoute.elevesAttendus === 'number'
    && typeof bilanRoute.lignesPosees === 'number'
    && typeof bilanRoute.lignesFigees === 'number',
    '⭐⭐ LE BILAN PORTE LE COMPTEUR — `elevesAttendus`, `lignesPosees`, `lignesFigees` '
    + 'SE COMPARENT : c’est ce qui distingue « rien à compter » de « pas passé »')

  if (bilanRoute.semaineDeTravail === false) {
    dit(bilanRoute.motif !== null && bilanRoute.lignesPosees === 0,
      '⭐ semaine HORS CALENDRIER → aucune ligne, ET LE MOTIF EST DIT — une collecte muette '
      + 'serait indiscernable d’une semaine légitimement vide')
    dit(typeof bilanRoute.depotsOrphelins === 'number',
      '⚠️ et le bilan compte les dépôts ORPHELINS de cette semaine — ceux qu’aucune ligne '
      + 'ne comptera', `${bilanRoute.depotsOrphelins} dépôt(s)`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  titre('C. LE SEMIS — de VRAIS dépôts, sur une VRAIE semaine de travail')
  // ══════════════════════════════════════════════════════════════════════════
  const type = lu('type', await admin.from('exercices_types')
    .select('id, code, crans_admis').eq('code', 'argument').maybeSingle())
  if (!type) throw new Error('type `argument` introuvable.')
  const cran = (type.crans_admis ?? ['3'])[0]

  // ⚠️ `uk_depots_eleve_exercice unique (eleve_id, exercice_id)` : UN dépôt par
  //    (élève × exercice). Quatre exercices assignés dans la semaine sont donc
  //    QUATRE INSTANCES, pas quatre dépôts sur la même.
  const instances = []
  for (let i = 0; i < 4; i++) {
    const x = lu(`instance ${i + 1}`, await admin.from('exercices').insert({
      type_id: type.id, lieu: 'maison', statut: 'assigne', cran,
      consigne_instanciee: { marque: MARQUE, consigne: `Instance ${i + 1} de recette C4-L13.` },
    }).select('id').single())
    instances.push(x.id)
    seme.exercices.push(x.id)
  }
  note(`4 instances semées (${MARQUE}) — la contrainte d’unicité impose une instance par dépôt`)

  // Mercredi de la semaine comptée, et le DIMANCHE SOIR à l'école.
  const jour = (n) => {
    const d = new Date(`${SEMAINE}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + n)
    return d
  }
  const mercredi = new Date(jour(2).getTime() + 14 * 3600_000).toISOString()
  // Dimanche 20 h 30 à Toronto = LUNDI 00 h 30 UTC. Lu en UTC, il ouvrirait la
  // semaine SUIVANTE ; lu dans le fuseau, il clôt celle-ci.
  const dimancheSoir = new Date(jour(7).getTime() + 30 * 60_000).toISOString()

  const [e1, e2, e3, e4] = POPULATION
  // [élève, statut, instant, index d'instance]
  const plan = [
    // élève 1 — quatre rendus, dont UN LE DIMANCHE SOIR À L’ÉCOLE.
    [e1, 'clos', mercredi, 0], [e1, 'v1_remis', mercredi, 1],
    [e1, 'vf_remis', mercredi, 2], [e1, 'retour_publie', dimancheSoir, 3],
    // élève 2 — deux rendus sur quatre : sous le seuil.
    [e2, 'clos', mercredi, 0], [e2, 'v1_remis', mercredi, 1],
    [e2, 'assigne', mercredi, 2], [e2, 'ouvert', mercredi, 3],
    // élève 3 — trois rendus, plus UN ABANDON, qui RESTE au dénominateur.
    [e3, 'clos', mercredi, 0], [e3, 'v1_remis', mercredi, 1],
    [e3, 'vf_remis', mercredi, 2], [e3, 'abandonne', mercredi, 3],
    // élève 4 — un rendu, plus UN RETRAIT, qui EN SORT.
    [e4, 'clos', mercredi, 0], [e4, 'retire', mercredi, 1],
  ].filter(([id]) => id)

  const poses = lu('dépôts', await admin.from('exercices_depots').insert(
    plan.map(([eleve_id, statut, assigne_at, i]) => ({
      eleve_id, exercice_id: instances[i], origine: 'prof', statut, assigne_at,
    }))).select('id'))
  seme.depots.push(...poses.map((d) => d.id))
  dit(poses.length === plan.length, `${poses.length} dépôts RÉELS semés sur la semaine ${SEMAINE}`)
  note(`dont un le DIMANCHE SOIR à l’école (${dimancheSoir}) — lundi 00 h 30 en UTC`)

  // ══════════════════════════════════════════════════════════════════════════
  titre('D. LE DÉCLENCHEUR TOURNE — et la ligne posée se CONFRONTE aux dépôts')
  // ══════════════════════════════════════════════════════════════════════════
  const { poserLaSemaineDAssiduite } = await import(`${RACINE}/utils/assiduite/collecte-serveur.ts`)
  // `aujourdHui` DANS la semaine comptée : elle est « en cours », donc calculable.
  const bilan = await poserLaSemaineDAssiduite(admin, fuseau, SEMAINE, SEMAINE)
  note(`bilan : ${JSON.stringify(bilan)}`)

  dit(bilan.semaineDeTravail === true && bilan.erreurs.length === 0,
    'la semaine est une semaine de TRAVAIL, et rien n’a échoué')
  dit(bilan.seuilSemaineFaite === SEUIL,
    '⭐ le seuil POSÉ est celui de la configuration — sinon la vue SQL et la frise de l’écran '
    + 'donneraient DEUX chiffres, sans une alerte', `${bilan.seuilSemaineFaite}`)
  dit(bilan.lignesPosees === POPULATION.length,
    '⭐⭐ UNE LIGNE PAR ÉLÈVE ACTIF — « même à zéro ». Sans les lignes vides, une semaine sans '
    + 'assignation DISPARAÎTRAIT du dénominateur au lieu d’y entrer',
    `${bilan.lignesPosees} posée(s) / ${bilan.elevesAttendus} attendue(s)`)
  dit(bilan.depotsRetires === 1,
    '⛔ le dépôt RETIRÉ est sorti du dénominateur, et le bilan le compte à part',
    `${bilan.depotsRetires} retiré(s)`)

  // ⭐ LA CONFRONTATION — on recompte les dépôts PAR REQUÊTE, sans le code testé.
  const lignes = lu('lignes', await admin.from('assiduite_hebdo')
    .select('eleve_id, cycle_lundi, exercices_assignes, exercices_termines, semaine_faite, '
      + 'minutes_assignees, minutes_budget_plancher, minutes_budget_plafond')
    .eq('cycle_lundi', SEMAINE))
  dit(lignes.length === POPULATION.length,
    'PAR REQUÊTE : autant de lignes en base que d’élèves actifs', `${lignes.length}`)

  const RENDUS = ['v1_remis', 'retour_publie', 'vf_remis', 'clos']
  const attendu = new Map()
  for (const [id, statut] of plan) {
    if (statut === 'retire') continue
    const a = attendu.get(id) ?? { assignes: 0, termines: 0 }
    a.assignes++
    if (RENDUS.includes(statut)) a.termines++
    attendu.set(id, a)
  }
  let concordent = 0
  for (const l of lignes) {
    const a = attendu.get(l.eleve_id) ?? { assignes: 0, termines: 0 }
    if (l.exercices_assignes === a.assignes && l.exercices_termines === a.termines) concordent++
    else note(`   ✗ ${l.eleve_id.slice(0, 8)} : base ${l.exercices_assignes}/${l.exercices_termines} `
      + `≠ recompte ${a.assignes}/${a.termines}`)
  }
  dit(concordent === lignes.length,
    '⭐⭐ LES DEUX AGRÉGATS SE CALCULENT DEPUIS DES DÉPÔTS RÉELS — chaque ligne concorde avec '
    + 'un recompte INDÉPENDANT des dépôts', `${concordent}/${lignes.length}`)

  const l1 = lignes.find((l) => l.eleve_id === e1)
  dit(l1 && l1.exercices_assignes === 4 && l1.exercices_termines === 4 && l1.semaine_faite === true,
    '⭐ LE DÉPÔT DU DIMANCHE SOIR EST COMPTÉ DANS LA SEMAINE QUI S’ACHÈVE — lu en UTC il aurait '
    + 'ouvert la SUIVANTE', `${l1?.exercices_termines}/${l1?.exercices_assignes}`)
  const l2 = lignes.find((l) => l.eleve_id === e2)
  dit(l2 && l2.exercices_termines === 2 && l2.semaine_faite === false,
    'deux rendus sur quatre : SOUS le seuil, semaine non faite', `${l2?.exercices_termines}/4`)
  const l3 = lignes.find((l) => l.eleve_id === e3)
  dit(l3 && l3.exercices_assignes === 4 && l3.exercices_termines === 3 && l3.semaine_faite === true,
    '⚠️ `abandonne` RESTE au dénominateur — « un non-geste de l’ÉLÈVE, et l’assiduité mesure '
    + 'l’élève »', `${l3?.exercices_termines}/${l3?.exercices_assignes}`)
  const l4 = lignes.find((l) => l.eleve_id === e4)
  dit(l4 && l4.exercices_assignes === 1 && l4.exercices_termines === 1,
    '⛔ `retire` EN SORT — « une décision du professeur »', `${l4?.exercices_termines}/${l4?.exercices_assignes}`)

  const vides = lignes.filter((l) => l.exercices_assignes === 0)
  dit(vides.length > 0 && vides.every((l) => l.semaine_faite === true),
    '⚠️⚠️ une ligne À ZÉRO se lit « FAITE PAR CONSTRUCTION » — `completion()` rend `null`, et ce '
    + 'n’est pas 0. C’est la règle, pas un défaut, et le défaut de la base disait l’inverse',
    `${vides.length} ligne(s) à zéro, toutes `
    + `${vides.every((l) => l.semaine_faite) ? 'faites' : 'PAS toutes faites'}`)

  dit(lignes.every((l) => l.minutes_assignees === null && l.minutes_budget_plancher === null
    && l.minutes_budget_plafond === null),
    '⛔⛔ AUCUNE MINUTE POSÉE — les trois colonnes sont à `C4-L12`, sur la MÊME ligne')

  // ══════════════════════════════════════════════════════════════════════════
  titre('E. LE PARTAGE AVEC C4-L12 — les minutes d’autrui SURVIVENT au cron')
  // ══════════════════════════════════════════════════════════════════════════
  // On joue ce que C4-L12 fera : remplir les minutes de la ligne déjà posée.
  const { error: eMin } = await admin.from('assiduite_hebdo')
    .update({ minutes_assignees: 95, minutes_budget_plancher: 45, minutes_budget_plafond: 60 })
    .eq('cycle_lundi', SEMAINE).eq('eleve_id', e1)
  dit(!eMin, 'C4-L12 remplit les minutes de la ligne que C4-L13 a posée (simulé)')

  // Puis le cron repasse sur la MÊME semaine, en cours.
  const rejoue = await poserLaSemaineDAssiduite(admin, fuseau, SEMAINE, SEMAINE)
  dit(rejoue.lignesPosees === POPULATION.length, 'le cron repasse sur la semaine EN COURS',
    `${rejoue.lignesPosees} ligne(s) réécrite(s)`)
  const apres = lu('relecture', await admin.from('assiduite_hebdo')
    .select('eleve_id, minutes_assignees, minutes_budget_plancher, minutes_budget_plafond')
    .eq('cycle_lundi', SEMAINE))
  const m1 = apres.find((l) => l.eleve_id === e1)
  dit(m1 && m1.minutes_assignees === 95 && m1.minutes_budget_plancher === 45
    && m1.minutes_budget_plafond === 60,
    '⭐⭐ LES MINUTES DE C4-L12 ONT SURVÉCU — une clé qu’on n’envoie pas garde sa valeur',
    `${m1?.minutes_assignees}/${m1?.minutes_budget_plancher}-${m1?.minutes_budget_plafond}`)
  const autres = apres.filter((l) => l.eleve_id !== e1)
  dit(autres.every((l) => l.minutes_assignees === null),
    '⭐⭐ ET AUCUNE AUTRE LIGNE N’A ÉTÉ CONTAMINÉE — l’upsert en lot unifie ses colonnes, et une '
    + 'clé présente sur une seule ligne mettrait toutes les autres à NULL. Le jeu de clés est '
    + 'HOMOGÈNE, et une garde le vérifie avant chaque envoi')

  // ══════════════════════════════════════════════════════════════════════════
  titre('F. LE RETRAIT NE RÉTROAGIT PAS — « un chiffre déjà montré ne bouge plus »')
  // ══════════════════════════════════════════════════════════════════════════
  const avantRetrait = lu('avant', await admin.from('assiduite_hebdo')
    .select('exercices_assignes, exercices_termines, updated_at')
    .eq('cycle_lundi', SEMAINE).eq('eleve_id', e2).maybeSingle())
  note(`élève 2 avant retrait : ${avantRetrait.exercices_termines}/${avantRetrait.exercices_assignes}`)

  // Le professeur retire un exercice APRÈS coup.
  const cible = poses[plan.findIndex(([id, s]) => id === e2 && s === 'assigne')]
  lu('retrait', await admin.from('exercices_depots')
    .update({ statut: 'retire' }).eq('id', cible.id).select('id'))

  // La semaine est désormais ARRÊTÉE : on rejoue avec un « aujourd'hui » postérieur.
  const semaineSuivante = new Date(`${SEMAINE}T00:00:00Z`)
  semaineSuivante.setUTCDate(semaineSuivante.getUTCDate() + 7)
  const plusTard = semaineSuivante.toISOString().slice(0, 10)
  const gele = await poserLaSemaineDAssiduite(admin, fuseau, plusTard, SEMAINE)
  note(`bilan (semaine arrêtée) : ${JSON.stringify(gele)}`)

  dit(gele.lignesPosees === 0 && gele.lignesFigees === POPULATION.length,
    '⛔⛔ AUCUNE LIGNE RÉÉCRITE — la semaine est arrêtée, et « un chiffre déjà montré au '
    + 'professeur ne bouge plus »', `${gele.lignesPosees} posée(s), ${gele.lignesFigees} figée(s)`)
  dit(gele.motif !== null, 'et le bilan DIT pourquoi il n’a rien posé', gele.motif ?? '')

  const apresRetrait = lu('après', await admin.from('assiduite_hebdo')
    .select('exercices_assignes, exercices_termines')
    .eq('cycle_lundi', SEMAINE).eq('eleve_id', e2).maybeSingle())
  dit(apresRetrait.exercices_assignes === avantRetrait.exercices_assignes
    && apresRetrait.exercices_termines === avantRetrait.exercices_termines,
    '⭐⭐ LE CHIFFRE N’A PAS BOUGÉ malgré le retrait — « le retrait sort du dénominateur, MAIS '
    + 'POUR L’AVENIR SEULEMENT »',
    `${apresRetrait.exercices_termines}/${apresRetrait.exercices_assignes}`)

  // Et le rattrapage d'une ligne MANQUANTE reste licite : une semaine jamais
  // comptée n'a jamais été montrée à personne.
  lu('trou', await admin.from('assiduite_hebdo').delete()
    .eq('cycle_lundi', SEMAINE).eq('eleve_id', e3).select('eleve_id'))
  const rattrape = await poserLaSemaineDAssiduite(admin, fuseau, plusTard, SEMAINE)
  dit(rattrape.lignesPosees === 1 && rattrape.lignesFigees === POPULATION.length - 1,
    '⭐ mais une ligne MANQUANTE se rattrape — jamais comptée, jamais montrée',
    `${rattrape.lignesPosees} posée(s), ${rattrape.lignesFigees} figée(s)`)

  // ══════════════════════════════════════════════════════════════════════════
  titre('G. L’IDEMPOTENCE — un cron se rejoue, et rien ne double')
  // ══════════════════════════════════════════════════════════════════════════
  await poserLaSemaineDAssiduite(admin, fuseau, SEMAINE, SEMAINE)
  await poserLaSemaineDAssiduite(admin, fuseau, SEMAINE, SEMAINE)
  const { count: total } = await admin.from('assiduite_hebdo')
    .select('*', { count: 'exact', head: true }).eq('cycle_lundi', SEMAINE)
  dit(total === POPULATION.length,
    '⭐ trois passages, toujours une ligne par élève — l’upsert sur `(eleve_id, cycle_lundi)` est '
    + 'idempotent PAR CONSTRUCTION', `${total} ligne(s)`)

  const horodatages = lu('updated_at', await admin.from('assiduite_hebdo')
    .select('updated_at').eq('cycle_lundi', SEMAINE).eq('eleve_id', e1).maybeSingle())
  dit(horodatages.updated_at !== null,
    '⚠️ `updated_at` est posé par la charge — la colonne n’a AUCUN trigger, et son `default` ne '
    + 'joue qu’à l’INSERT', horodatages.updated_at)

  // ══════════════════════════════════════════════════════════════════════════
  titre('H. LA VUE DU TAUX D’INACTIVITÉ — elle relit la colonne, sans qu’on y touche')
  // ══════════════════════════════════════════════════════════════════════════
  const vue = lu('vue', await admin.from('assiduite_hebdo_classe')
    .select('classe_id, cycle_lundi, eleves, eleves_inactifs, taux_inactivite')
    .eq('cycle_lundi', SEMAINE))
  dit(vue.length > 0, '⛔ la vue `assiduite_hebdo_classe` lit ce que le cron a posé — on ne l’a '
    + 'pas touchée, et elle n’a aucun lecteur de code', JSON.stringify(vue))
}

async function nettoyer() {
  titre('◀ NETTOYAGE — par `exercice_id`, jamais par coïncidence de valeurs')
  for (const l of seme.semaines) {
    const { error } = await admin.from('assiduite_hebdo').delete().eq('cycle_lundi', l)
    console.log(`  ${error ? '✗' : '✓'} assiduité de la semaine ${l}${error ? ` : ${error.message}` : ''}`)
  }
  if (seme.exercices.length) {
    const { error: eD } = await admin.from('exercices_depots').delete().in('exercice_id', seme.exercices)
    console.log(`  ${eD ? '✗' : '✓'} dépôts semés${eD ? ` : ${eD.message}` : ` (${seme.depots.length})`}`)
    const { error: eE } = await admin.from('exercices').delete().in('id', seme.exercices)
    console.log(`  ${eE ? '✗' : '✓'} instance de recette${eE ? ` : ${eE.message}` : ''}`)
  }
  const { count } = await admin.from('assiduite_hebdo').select('*', { count: 'exact', head: true })
  const { count: dep } = await admin.from('exercices_depots').select('*', { count: 'exact', head: true })
  console.log(`\n  Vérification PAR REQUÊTE : assiduite_hebdo = ${count} ligne(s) · `
    + `exercices_depots = ${dep} ligne(s)`)
}

console.log(`\n▶ RECETTE C4-L13 — les compteurs d’assiduité, de bout en bout`)
try {
  await main()
} catch (e) {
  ko++
  console.error(`\n✗ INTERROMPU : ${e.message}`)
} finally {
  if (GARDE) console.log('\n⚠️ --garde-le-decor : le décor RESTE en base. Rejoue sans le drapeau.')
  else await nettoyer()
}
console.log(`\n${'═'.repeat(74)}\n  ${ok} vérification(s) passée(s) · ${ko} en échec\n${'═'.repeat(74)}\n`)
process.exit(ko === 0 ? 0 : 1)
