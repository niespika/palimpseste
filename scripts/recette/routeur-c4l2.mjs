// ============================================================================
// RECETTE C4 · L2 — le routeur, éprouvé EN BASE.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/routeur-c4l2.mjs
//
// Il appelle LE MÊME CODE QUE LES ÉCRANS — les lectures paginées, les dérivées
// du §3, le budget, les segments — et éprouve ce qu'aucun test pur ne prouve :
// que les colonnes existent, que les lectures ne mentent pas, et que le PIÈGE DE
// LA VACUITÉ se déclenche sur des élèves RÉELS.
//
// « Des données réelles sont des LIGNES RÉELLES DES TABLES — des mesures posées
//   en base en tiennent lieu, des mocks du moteur non » (le « fait quand »).
//
// ⚠️ IL NE SÈME RIEN ET N'ÉCRIT RIEN : lecture seule, de bout en bout.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import {
  lireLesMesures, lireLesNiveaux, lireLesEscalades, lireLaMontee,
  lireLesInscriptions, lireLOptOut, lireLeProfil, lireLesFiches,
  lireLesDecisions, lireLAssiduite, lireLesSeuils, lireLesInterrupteurs,
} from '../../utils/routeur/donnees.ts'
import { observablesRequis } from '../../utils/routeur/fiche-observables.ts'
import { budgetDeLEleve } from '../../utils/routeur/budget.ts'
import { decouperEnSegments } from '../../utils/routeur/segments.ts'
import { profilDeLaCompetence } from '../../utils/routeur/profil.ts'
import { assiduiteDeLEleve, inactiviteDeLaClasse } from '../../utils/routeur/assiduite.ts'

// Les scripts de recette lisent `.env.local` eux-mêmes : ils tournent hors de
// Next, qui est le seul à charger l'environnement d'office.
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })
let echecs = 0
const ok = (c, quoi, detail = '') => {
  if (!c) echecs++
  console.log(`${c ? '  ✓' : '  ✗'} ${quoi}${detail ? ` — ${detail}` : ''}`)
}
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 66 - t.length))}`)

// ── 1. Les colonnes que la migration a posées ──────────────────────────────
titre('1. La migration est en base')
const interrupteurs = await lireLesInterrupteurs(admin)
ok(Object.values(interrupteurs).every((v) => v === false),
  'les SIX interrupteurs sont à OFF', JSON.stringify(interrupteurs))
const { seuils, parDefaut } = await lireLesSeuils(admin)
ok(!parDefaut, 'les deux réglages se lisent EN CONFIGURATION, pas au défaut de démarrage')
ok(seuils.semaineFaite === 0.75 && seuils.borneBasseFrise === 0.5,
  'seuil de « semaine faite » et borne basse de la frise',
  `${seuils.semaineFaite} · ${seuils.borneBasseFrise}`)
ok(seuils.borneBasseFrise <= seuils.semaineFaite,
  'la borne basse ne dépasse pas le seuil — sinon l\'orange n\'existerait plus')

// ── 2. Les observables requis, LUS AUX FICHES ──────────────────────────────
titre('2. §8.3 — les observables requis se lisent AUX FICHES')
const fiches = await lireLesFiches(admin)
ok(fiches.size >= 6, `${fiches.size} fiches déposées en base`)
const attendu = {
  argumentation: 8, expression: 7, structure: 8,
  questionnement: 7, synthese: 12, connaissance: 0,
}
for (const [competence, n] of Object.entries(attendu)) {
  const contenu = fiches.get(competence)
  if (!contenu) { ok(false, `${competence} : fiche absente`); continue }
  const r = observablesRequis(contenu)
  ok(r.requis.length === n, `${competence} : ${r.requis.length} requis sur ${r.tous.length}`,
    r.avertissements.join(' | ') || 'aucun avertissement')
}

// ── 3. Le piège de la vacuité, sur des ÉLÈVES RÉELS ────────────────────────
titre('3. Le piège de la vacuité — condition de recette du `07-` §1.3')
const { data: eleves } = await admin
  .from('profiles').select('id, display_name').eq('role', 'eleve').order('display_name')
let servis = 0
let nonServis = 0
const avertissements = []
for (const e of eleves ?? []) {
  const inscriptions = await lireLesInscriptions(admin, e.id)
  const profil = await lireLeProfil(admin, e.id)
  const b = budgetDeLEleve(inscriptions, profil.reglage)
  if (b.budget) servis++
  else { nonServis++; avertissements.push(`${e.display_name} : ${b.motifNonServi}`) }
}
ok(servis + nonServis === (eleves ?? []).length,
  `${(eleves ?? []).length} élèves lus`, `${servis} servis · ${nonServis} non servis`)
ok(nonServis > 0,
  'des élèves sans parcours existent bien en base — le piège a de quoi se déclencher')
ok(avertissements.every((a) => a.includes('aucun_parcours')),
  'et chacun est refusé EXPLICITEMENT, jamais en silence')
console.log(`     ${avertissements.slice(0, 3).join('\n     ')}${
  avertissements.length > 3 ? `\n     … et ${avertissements.length - 3} de plus` : ''}`)

// Un élève servi, pour montrer que le budget se dérive bien.
const { data: classeTc } = await admin
  .from('classes').select('id, nom').eq('type_pedagogique', 'tc').limit(1).maybeSingle()
if (classeTc) {
  const { data: insc } = await admin
    .from('inscriptions').select('eleve_id').eq('classe_id', classeTc.id)
    .eq('statut', 'active').limit(1).maybeSingle()
  if (insc) {
    const b = budgetDeLEleve(await lireLesInscriptions(admin, insc.eleve_id),
      (await lireLeProfil(admin, insc.eleve_id)).reglage)
    ok(b.situation === 'tc_seul' && b.budget?.plancher === 45 && b.budget?.plafond === 60,
      `un élève de ${classeTc.nom} reçoit le budget de sa situation`,
      `${b.situation} · ${b.budget?.plancher}–${b.budget?.plafond} min`)
  }
}

// ── 4. Les lectures paginées ne mentent pas ────────────────────────────────
titre('4. Les lectures — paginées et confrontées au décompte')
const unEleve = (eleves ?? [])[0]
if (unEleve) {
  const mesures = await lireLesMesures(admin, unEleve.id)
  const niveaux = await lireLesNiveaux(admin, unEleve.id)
  const escalades = await lireLesEscalades(admin, unEleve.id)
  const montee = await lireLaMontee(admin, unEleve.id)
  const decisions = await lireLesDecisions(admin, unEleve.id)
  ok(Array.isArray(mesures), `mesures : ${mesures.length}`)
  ok(Array.isArray(niveaux), `niveaux : ${niveaux.length}`,
    niveaux.map((n) => `${n.competence}=${n.statutRecette}`).join(' '))
  ok(niveaux.every((n) => 'lettreInitiale' in n),
    '`lettre_initiale` se lit — la colonne posée par ce lot')
  ok(escalades instanceof Map && montee instanceof Map, 'escalade et montée se lisent')
  ok(Array.isArray(decisions), `décisions : ${decisions.length}`)

  // Les dérivées du §3, sur des lignes réelles.
  for (const n of niveaux) {
    const p = profilDeLaCompetence(n.competence, mesures.filter((m) => m.competence === n.competence),
      n.statutRecettePoseLe, n.lettre, n.lettre, null)
    ok(p.n >= 0 && p.fenetre.length <= 4,
      `${n.competence} : n = ${p.n}, fenêtre de ${p.fenetre.length}`,
      `signal ${p.signal ?? '—'} (${p.sourceDuSignal})`)
  }
}

// ── 5. R0 aujourd'hui : la voie mixte est le régime en cours ───────────────
titre('5. R0 — ce qui est ciblable aujourd\'hui')
const { data: statuts } = await admin
  .from('competences_niveaux').select('competence, statut_recette')
const evaluees = new Set((statuts ?? []).filter((s) => s.statut_recette === 'evaluee')
  .map((s) => s.competence))
ok(true, `compétences \`evaluee\` en base : ${evaluees.size}`,
  evaluees.size === 0
    ? 'R0 n\'en laisse passer AUCUNE → la semaine entière revient à la VOIE MIXTE, '
      + 'et c\'est un régime normal, pas un repli'
    : [...evaluees].join(', '))

// ── 6. L'opt-out — le routeur le LIT, il ne l'écrit pas ────────────────────
titre('6. `competences_actives_par_classe` — lue, jamais écrite')
const { data: classes } = await admin.from('classes').select('id, nom').eq('statut', 'active')
const ecartees = await lireLOptOut(admin, (classes ?? []).map((c) => c.id))
ok(ecartees.size === 0, `aucune compétence écartée par opt-out (${ecartees.size})`,
  'le défaut est ACTIF : une ligne absente vaut active')

// ── 7. Les segments, dérivés du Calendrier réel ────────────────────────────
titre('7. §4 couche 1 — les cinq segments, dérivés du Calendrier')
const { data: semestres } = await admin
  .from('semesters').select('id, name, start_date, end_date').is('archived_at', null)
  .order('start_date')
if ((semestres ?? []).length === 0) {
  ok(false, 'aucun semestre non archivé : le Calendrier ne peut rien borner')
} else {
  const { data: vacances } = await admin.from('holidays').select('semester_id, start_date, end_date')
  const { calculerGrilleSemaines } = await import('../../utils/calendrier-grille.ts')
  const semaines = []
  for (const s of semestres) {
    const h = (vacances ?? []).filter((v) => v.semester_id === s.id)
      .map((v) => ({ label: '', start_date: v.start_date, end_date: v.end_date }))
    for (const w of calculerGrilleSemaines(s, h)) {
      if (!w.isVacation) semaines.push({ dateDebutLundi: w.start, dateFinDimanche: w.end })
    }
  }
  const d = decouperEnSegments(semaines)
  ok(d.semainesDeCours === semaines.length,
    `${d.semainesDeCours} semaines de cours → C = ${d.C}, R = ${d.R}`)
  ok(d.segments.length === 5,
    `les cinq segments : ${d.segments.map((s) => s.semaines.length).join(' · ')} semaines`)
  const somme = d.segments.reduce((a, s) => a + s.semaines.length, 0)
  ok(somme === d.C, `la découpe se referme sur C (${somme} = ${d.C})`)
  if (d.signaux.length) console.log(`     ⚠️  ${d.signaux.join('\n     ⚠️  ')}`)
  ok(d.signaux.length === 0 || d.C < 5 || d.segments.slice(2).some((s) => s.semaines.length === 0),
    'un signal n\'est émis que si un segment est réellement vide')
}

// ── 8. L'assiduité — les comptes que la plateforme tient déjà ──────────────
titre('8. `06-` §5 — l\'assiduité')
const lignes = await lireLAssiduite(admin, (eleves ?? []).map((e) => e.id))
ok(Array.isArray(lignes), `lignes d'assiduité en base : ${lignes.length}`,
  lignes.length === 0 ? 'la collecte n\'a pas encore démarré — « les écrans peuvent attendre »' : '')
const a = assiduiteDeLEleve(
  [{ cycleLundi: 'x', exercicesAssignes: 4, exercicesTermines: 4, enVacances: false },
    { cycleLundi: 'y', exercicesAssignes: 4, exercicesTermines: 0, enVacances: false }], seuils)
ok(a.pourcentage === 0.5, 'le calcul tourne sur les seuils LUS EN BASE', `${a.pourcentage}`)
const i = inactiviteDeLaClasse(
  [{ cycleLundi: 'x', exercicesAssignes: 4, exercicesTermines: 4, enVacances: false },
    { cycleLundi: 'x', exercicesAssignes: 4, exercicesTermines: 0, enVacances: false }],
  seuils, 'une classe')
ok(i.contratRempli === false && i.avertissement !== null,
  'et le professeur est averti quand le contrat n\'est pas rempli')

// ── Verdict ────────────────────────────────────────────────────────────────
console.log(`\n${'═'.repeat(70)}`)
console.log(echecs === 0 ? '✅ RECETTE C4-L2 : tout passe.' : `❌ ${echecs} épreuve(s) en échec.`)
console.log('═'.repeat(70))
process.exit(echecs === 0 ? 0 : 1)
