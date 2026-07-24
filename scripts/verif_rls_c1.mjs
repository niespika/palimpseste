#!/usr/bin/env node
// ============================================================================
// verif_rls_c1.mjs — vérification empirique des policies RLS élève (C1, A5).
// ----------------------------------------------------------------------------
// TENTE, avec un compte élève de test (anon key + JWT élève, exactement comme le
// navigateur), les écritures/lectures INTERDITES que ferme `c1_rls_eleve.sql`,
// et vérifie qu'elles sont REFUSÉES (0 ligne écrite / valeur inchangée / erreur).
// Zéro dépendance service-role : on reste dans la peau d'un « petit malin ».
//
// À lancer APRÈS que Louis a exécuté c1_rls_eleve.sql en sandbox (cf. SUIVI_SQL.md)
// et APRÈS que le compte élève de test a fait au moins : un quiz Quazian complet,
// une séance Codex, une séance Aletheia (sinon certains contrôles sont SKIP).
//
//   node scripts/verif_rls_c1.mjs
//
// Variables (dans .env.local ou l'environnement) :
//   NEXT_PUBLIC_SUPABASE_URL       (déjà présent)
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  (déjà présent)
//   TEST_ELEVE_EMAIL     — email du compte élève de test
//   TEST_ELEVE_PASSWORD  — son mot de passe
//   TEST_QUIZ_HORS_CLASSE      (optionnel) — id d'un quiz d'une AUTRE classe
//   TEST_CODEX_SESSION_HORS    (optionnel) — id d'une session Codex d'une AUTRE
//                                            classe, ou un brouillon
//
// Sortie : un tableau PASS/FAIL. Code de sortie ≠ 0 si une écriture interdite a
// réussi (régression de sécurité) ou si une lecture légitime a cassé.
// ============================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..')

// ── Chargement de .env.local (parseur minimal, sans dépendance) ──────────────
function chargerEnvLocal() {
  try {
    const brut = readFileSync(join(RACINE, '.env.local'), 'utf8')
    for (const ligne of brut.split('\n')) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      const cle = m[1]
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (process.env[cle] === undefined) process.env[cle] = val
    }
  } catch {
    // pas de .env.local : on se rabat sur l'environnement
  }
}
chargerEnvLocal()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EMAIL = process.env.TEST_ELEVE_EMAIL
const PASSWORD = process.env.TEST_ELEVE_PASSWORD

if (!URL || !ANON) {
  console.error('✗ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquants (.env.local).')
  process.exit(2)
}
if (!EMAIL || !PASSWORD) {
  console.error('✗ TEST_ELEVE_EMAIL / TEST_ELEVE_PASSWORD manquants.')
  console.error('  Renseigne un compte élève de test, puis relance :')
  console.error('  TEST_ELEVE_EMAIL=… TEST_ELEVE_PASSWORD=… node scripts/verif_rls_c1.mjs')
  process.exit(2)
}

// Client « navigateur » : anon key + session élève (RLS s'applique, comme PostgREST direct).
const sb = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } })

// ── Journal des résultats ────────────────────────────────────────────────────
const resultats = []
let echecs = 0
function noter(etat, titre, detail = '') {
  resultats.push({ etat, titre, detail })
  const tag = etat === 'PASS' ? '\x1b[32mPASS\x1b[0m'
    : etat === 'FAIL' ? '\x1b[31mFAIL\x1b[0m'
    : '\x1b[33mSKIP\x1b[0m'
  console.log(`  ${tag}  ${titre}${detail ? '  — ' + detail : ''}`)
  if (etat === 'FAIL') echecs++
}

// Une tentative d'ÉCRITURE est un SUCCÈS DE SÉCURITÉ si elle n'écrit rien.
// Avec une policy SELECT-only : UPDATE/DELETE affectent 0 ligne (data == []),
// INSERT lève une erreur RLS (42501). Les deux = « refusé ».
function ecritureRefusee({ data, error }) {
  if (error) return { refuse: true, pourquoi: `erreur ${error.code ?? ''} ${error.message}`.trim() }
  if (Array.isArray(data) && data.length === 0) return { refuse: true, pourquoi: '0 ligne écrite' }
  return { refuse: false, pourquoi: `${Array.isArray(data) ? data.length : 1} ligne(s) écrite(s) !` }
}

async function main() {
  console.log('\n════════ verif_rls_c1 — RLS élève (compte de test) ════════\n')

  // ── Connexion élève ────────────────────────────────────────────────────────
  const { data: sess, error: errAuth } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
  if (errAuth || !sess?.user) {
    console.error(`✗ Connexion élève impossible : ${errAuth?.message ?? 'inconnue'}`)
    process.exit(2)
  }
  const eleveId = sess.user.id
  const { data: prof } = await sb.from('profiles').select('role').eq('id', eleveId).maybeSingle()
  console.log(`Connecté : ${EMAIL}  (id ${eleveId.slice(0, 8)}…, rôle ${prof?.role ?? '?'})`)
  if (prof?.role !== 'eleve') {
    console.error('✗ Ce compte n’a pas le rôle « eleve ». Utilise un vrai compte élève de test.')
    process.exit(2)
  }
  console.log('')

  // ── 0. Contrôles positifs : les LECTURES légitimes doivent MARCHER ──────────
  // (SELECT own conservé : quazian_* + profil self + codex_sessions)
  console.log('— Contrôles positifs (les lectures de l’élève doivent passer) —')
  for (const t of ['quazian_quiz_scores', 'quazian_sessions']) {
    const { error } = await sb.from(t).select('*').limit(1)
    if (error) noter('FAIL', `lecture de ses ${t}`, `cassée : ${error.message}`)
    else noter('PASS', `lecture de ses ${t}`, 'ok')
  }
  {
    const { data, error } = await sb.from('profiles').select('role').eq('id', eleveId).maybeSingle()
    if (error || !data) noter('FAIL', 'lecture de son profil', `cassée : ${error?.message ?? 'aucune ligne'} (verifierEleve en dépend)`)
    else noter('PASS', 'lecture de son profil', 'ok')
  }

  // Tables FERMÉES (aucune policy élève) : la lecture doit renvoyer 0 ligne.
  for (const t of ['codex_travaux', 'aletheia_travaux']) {
    const { data, error } = await sb.from(t).select('id').eq('eleve_id', eleveId)
    if (!error && (data ?? []).length === 0) noter('PASS', `${t} FERMÉ (lecture élève)`, '0 ligne')
    else if ((data ?? []).length > 0) noter('FAIL', `${t} FERMÉ`, `${data.length} ligne(s) LISIBLE(S) — policy élève encore présente`)
    else noter('SKIP', `${t} FERMÉ`, `erreur : ${error?.message}`)
  }

  // On récupère un id propre par table pour les tests UPDATE (tables SELECT-own).
  const ownId = async (table) => {
    const { data } = await sb.from(table).select('id').eq('eleve_id', eleveId).limit(1).maybeSingle()
    return data?.id ?? null
  }
  const idScore = await ownId('quazian_quiz_scores')
  const idSession = await ownId('quazian_sessions')
  const { data: monAnswer } = await sb
    .from('quazian_answers').select('session_id, question_id')
    .in('session_id', idSession ? [idSession] : ['00000000-0000-0000-0000-000000000000'])
    .limit(1).maybeSingle()

  // Un UPDATE interdit = refusé (0 ligne) ET valeur inchangée après re-lecture.
  async function testUpdate(table, id, patch, champ, valeurForgee) {
    if (!id) { noter('SKIP', `UPDATE interdit ${table}.${champ}`, 'aucune ligne (fais d’abord le flux)'); return }
    const { data: avant } = await sb.from(table).select(champ).eq('id', id).maybeSingle()
    const r = ecritureRefusee(await sb.from(table).update(patch).eq('id', id).select('id'))
    const { data: apres } = await sb.from(table).select(champ).eq('id', id).maybeSingle()
    const inchange = JSON.stringify(avant?.[champ]) === JSON.stringify(apres?.[champ])
    if (r.refuse && inchange) noter('PASS', `UPDATE interdit ${table}.${champ}`, r.pourquoi)
    else if (!r.refuse) noter('FAIL', `UPDATE interdit ${table}.${champ}`, `ÉCRIT (${valeurForgee}) — policy trop permissive`)
    else noter('FAIL', `UPDATE interdit ${table}.${champ}`, 'valeur modifiée malgré 0 ligne annoncée')
  }
  // Écriture interdite sur table FERMÉE : filtrée par eleve_id (0 ligne si fermée ;
  // compte de test dédié, donc sans risque même si une régression laissait ouvert).
  async function testFerme(table, patch, champ, valeurForgee) {
    const r = ecritureRefusee(await sb.from(table).update(patch).eq('eleve_id', eleveId).select('id'))
    noter(r.refuse ? 'PASS' : 'FAIL', `UPDATE interdit ${table}.${champ}`,
      r.refuse ? r.pourquoi : `ÉCRIT (${valeurForgee}) — policy encore ouverte`)
  }

  // ── 0ter. profiles — ESCALADE DE PRIVILÈGE (le contrôle le plus grave) ──────
  console.log('\n— profiles (escalade & anti-triche) —')
  {
    const { data: avant } = await sb.from('profiles').select('role').eq('id', eleveId).maybeSingle()
    const r = ecritureRefusee(await sb.from('profiles').update({ role: 'prof' }).eq('id', eleveId).select('id'))
    const { data: apres } = await sb.from('profiles').select('role').eq('id', eleveId).maybeSingle()
    const inchange = avant?.role === apres?.role && apres?.role !== 'prof'
    if (r.refuse && inchange) noter('PASS', 'UPDATE interdit profiles.role (escalade → prof)', r.pourquoi)
    else noter('FAIL', 'UPDATE interdit profiles.role', 'ESCALADE POSSIBLE — l’élève peut devenir prof !')
  }
  {
    const r = ecritureRefusee(await sb.from('profiles')
      .update({ integrite_strikes: 0, integrite_bloque: false }).eq('id', eleveId).select('id'))
    noter(r.refuse ? 'PASS' : 'FAIL', 'UPDATE interdit profiles.integrite_* (auto-déblocage)',
      r.refuse ? r.pourquoi : 'L’ÉLÈVE PEUT SE DÉSTRIKER / DÉBLOQUER')
  }
  {
    // INSERT forgé d'un profil prof (id aléatoire) : refusé par with_check
    // (auth.uid()=id). Un id aléatoire ≠ auth.uid → jamais collé à un compte réel.
    const faux = '11111111-2222-3333-4444-555555555555'
    const r = ecritureRefusee(await sb.from('profiles')
      .insert({ id: faux, role: 'prof' }).select('id'))
    if (!r.refuse) await sb.from('profiles').delete().eq('id', faux) // ménage best-effort
    noter(r.refuse ? 'PASS' : 'FAIL', 'INSERT interdit profiles (profil prof forgé)',
      r.refuse ? r.pourquoi : 'LIGNE PROF FORGÉE INSÉRÉE')
  }

  // ── 1. Quazian — falsification de note / réécriture / re-scoring ────────────
  console.log('\n— Quazian (notes & passation) —')
  await testUpdate('quazian_quiz_scores', idScore, { score_moyen: 9.99, note_formative_20: 20 }, 'note_formative_20', '20/20')
  await testUpdate('quazian_quiz_scores', idScore, { note_vue_at: new Date().toISOString() }, 'note_vue_at', 'lu (contourne le gate)')
  await testUpdate('quazian_sessions', idSession, { submitted_at: null, auto_submitted: false }, 'submitted_at', 're-ouvrir la session')
  if (monAnswer) {
    const r = ecritureRefusee(await sb.from('quazian_answers')
      .update({ p_a: 1, p_b: 0, p_c: 0, p_d: 0, score: 10 })
      .eq('session_id', monAnswer.session_id).eq('question_id', monAnswer.question_id).select('question_id'))
    if (r.refuse) noter('PASS', 'UPDATE interdit quazian_answers (réécrire après coup)', r.pourquoi)
    else noter('FAIL', 'UPDATE interdit quazian_answers', 'RÉPONSE RÉÉCRITE — policy trop permissive')
  } else {
    noter('SKIP', 'UPDATE interdit quazian_answers', 'aucune réponse')
  }

  // ── 2. Codex — table FERMÉE : toute écriture élève doit être refusée ────────
  // (pas d'id à cibler — la table n'est pas lisible ; on filtre par eleve_id, un
  // UPDATE sans policy renvoie 0 ligne. Pas de DELETE ici : destructeur si ouvert.)
  console.log('\n— Codex (table fermée : auto-validation & gate) —')
  {
    const r1 = ecritureRefusee(await sb.from('codex_travaux')
      .update({ statut_validation: 'valide', valide_par: eleveId, valide_at: new Date().toISOString() })
      .eq('eleve_id', eleveId).select('id'))
    noter(r1.refuse ? 'PASS' : 'FAIL', 'UPDATE interdit codex_travaux.statut_validation',
      r1.refuse ? r1.pourquoi : 'AUTO-VALIDATION ÉCRITE — policy encore ouverte')
    const r2 = ecritureRefusee(await sb.from('codex_travaux')
      .update({ synthese_lu_at: new Date().toISOString() })
      .eq('eleve_id', eleveId).select('id'))
    noter(r2.refuse ? 'PASS' : 'FAIL', 'UPDATE interdit codex_travaux.synthese_lu_at',
      r2.refuse ? r2.pourquoi : 'GATE CONTOURNÉ — policy encore ouverte')
  }

  // ── 3. Aletheia — table FERMÉE : machine à états, retours, spoiler ──────────
  console.log('\n— Aletheia (table fermée : machine à états & retours) —')
  await testFerme('aletheia_travaux', { statut: 'DONE' }, 'statut', 'DONE (saut d’état)')
  await testFerme('aletheia_travaux', { retour_vf_lu_at: new Date().toISOString() }, 'retour_vf_lu_at', 'lu (contourne le gate)')
  await testFerme('aletheia_travaux', { retour_v1: { force: true } }, 'retour_v1', 'retour IA falsifié')

  // ── 4. INSERT forgé (défense d’ensemble ; refus attendu par absence de policy) ──
  console.log('\n— INSERT forgés (doivent être refusés) —')
  {
    const { data: unQuiz } = await sb.from('quazian_quizzes').select('id').limit(1).maybeSingle()
    if (unQuiz) {
      const r = ecritureRefusee(await sb.from('quazian_quiz_scores')
        .insert({ quiz_id: unQuiz.id, eleve_id: eleveId, score_moyen: 9.99, note_formative_20: 20, z_quiz: 9 })
        .select('quiz_id'))
      if (r.refuse) noter('PASS', 'INSERT interdit quazian_quiz_scores (note forgée)', r.pourquoi)
      else { noter('FAIL', 'INSERT interdit quazian_quiz_scores', 'NOTE FORGÉE ÉCRITE'); await sb.from('quazian_quiz_scores').delete().eq('quiz_id', unQuiz.id).eq('eleve_id', eleveId) }
    } else {
      noter('SKIP', 'INSERT interdit quazian_quiz_scores', 'aucun quiz visible')
    }
  }

  // ── 5. Lecture inter-classes (optionnel, ids fournis par Louis) ─────────────
  console.log('\n— Lectures inter-classes (optionnel) —')
  const quizHors = process.env.TEST_QUIZ_HORS_CLASSE
  if (quizHors) {
    const { data } = await sb.from('quazian_quizzes').select('id').eq('id', quizHors).maybeSingle()
    if (!data) noter('PASS', 'lecture quiz d’une autre classe', 'refusée (0 ligne)')
    else noter('FAIL', 'lecture quiz d’une autre classe', 'QUIZ HORS-CLASSE LISIBLE')
  } else {
    noter('SKIP', 'lecture quiz d’une autre classe', 'TEST_QUIZ_HORS_CLASSE non fourni')
  }
  const codexHors = process.env.TEST_CODEX_SESSION_HORS
  if (codexHors) {
    const { data } = await sb.from('codex_sessions').select('id, statut').eq('id', codexHors).maybeSingle()
    if (!data) noter('PASS', 'lecture session Codex hors-classe / brouillon', 'refusée (0 ligne)')
    else noter('FAIL', 'lecture session Codex hors-classe / brouillon', `LISIBLE (statut ${data.statut})`)
  } else {
    noter('SKIP', 'lecture session Codex hors-classe / brouillon', 'TEST_CODEX_SESSION_HORS non fourni')
  }

  // ── Bilan ────────────────────────────────────────────────────────────────
  const nb = (e) => resultats.filter((r) => r.etat === e).length
  console.log('\n════════════════════════════════════════════════════════════')
  console.log(`  ${nb('PASS')} PASS · ${nb('FAIL')} FAIL · ${nb('SKIP')} SKIP`)
  if (echecs > 0) {
    console.log('\x1b[31m  ✗ Des écritures/lectures interdites ont réussi. NE PAS activer avant correction.\x1b[0m')
  } else if (nb('SKIP') > 0) {
    console.log('\x1b[33m  ⚠ Aucune faille détectée, mais des contrôles ont été SKIP (données de test manquantes).\x1b[0m')
  } else {
    console.log('\x1b[32m  ✓ Aucune écriture interdite possible.\x1b[0m')
  }
  console.log('════════════════════════════════════════════════════════════\n')
  await sb.auth.signOut()
  process.exit(echecs > 0 ? 1 : 0)
}

main().catch((e) => { console.error('Erreur inattendue :', e); process.exit(2) })
