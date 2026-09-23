#!/usr/bin/env node
// ============================================================================
// decor-quazian-retours-classe.mjs — un quiz LANCÉ dans la classe Test du bac à
// sable, avec des élèves à des avancées différentes (retours de classe du
// 22/09/2026 : liste de la classe, avancée par élève).
// ----------------------------------------------------------------------------
// ⛔ BAC À SABLE UNIQUEMENT. Le script REFUSE toute autre base.
// ⭐ LA MARQUE VA EN BASE : chaque question porte `concept_tag = MARQUE`. Le
//    retrait retrouve le décor PAR la marque, puis vérifie PAR REQUÊTE.
//
//   node scripts/recette/decor-quazian-retours-classe.mjs [--constat|--seme|--retire]
//                                                        [--brouillon] [--classe <uuid>]
//   --brouillon  un quiz BROUILLON, questions validées, aucune session : le
//                point de départ de l'antichambre (on l'ouvre à l'écran)
//   --classe     une autre classe que Test (T5 : la classe en contexte d'Élo)
//   --ferme      un quiz FERMÉ où tout le monde, Élo comprise, a soumis : l'écran
//                de note, avec des erreurs (dont « tout sur une mauvaise »)
//
// Les questions sont COPIÉES du seul quiz réel du bac à sable (longueurs vraies :
// réponses jusqu'à 160 caractères). Les avancées semées, pour 7 élèves :
//   2 sans session (« Pas commencé ») · 1 à 0/N · 1 à 2/N · 1 à N−1/N
//   · 1 soumis N/N · 1 soumis avec 2 sans réponse.
// ============================================================================

import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DOSSIER = join(RACINE, 'backups', 'quazian-retours-classe-20260922')
const REGISTRE = join(DOSSIER, 'registre-decor.json')
const MARQUE = 'DECOR-RETOURS-CLASSE-2209'
const SANDBOX = 'aoakpxxlyvthzueaywna'
const argClasse = process.argv.indexOf('--classe')
const CLASSE_TEST = argClasse > 0 ? process.argv[argClasse + 1] : '05b39f0c-2d53-47ac-822d-623e17772edd'
const QUIZ_SOURCE = '72fe18d6'

const env = {}
for (const ligne of readFileSync(join(RACINE, '.env.local'), 'utf8').split('\n')) {
  const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
}
const URL = env.NEXT_PUBLIC_SUPABASE_URL
if (!URL?.includes(SANDBOX)) {
  console.error(`⛔ REFUS — ce décor ne se sème qu'en BAC À SABLE (${SANDBOX}). Vu : ${URL}`)
  process.exit(2)
}
const admin = createClient(URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

// supabase-js NE LÈVE PAS : tout passe par `lu`, qui lève.
function lu(quoi, { data, error }) {
  if (error) throw new Error(`${quoi} — ${error.message}`)
  return data
}
const a = (n) => process.argv.includes(`--${n}`)

function brier(jetons, ok) {
  const p = jetons.map((j) => j / 100)
  return Math.round((1 - p.reduce((s, x, i) => s + (x - (i === ok ? 1 : 0)) ** 2, 0)) * 10 * 1000) / 1000
}
function melange(n, graine) {
  const t = [...Array(n).keys()]
  let h = graine
  for (let i = n - 1; i > 0; i--) { h = (h * 1103515245 + 12345) % 2147483648; const j = h % (i + 1); [t[i], t[j]] = [t[j], t[i]] }
  return t
}

async function etat() {
  const questions = lu('questions marquées', await admin.from('quazian_questions').select('quiz_id').eq('concept_tag', MARQUE))
  const quizIds = [...new Set(questions.map((q) => q.quiz_id))]
  const sessions = quizIds.length ? lu('sessions', await admin.from('quazian_sessions').select('id').in('quiz_id', quizIds)) : []
  return { quizIds, nbQuestions: questions.length, nbSessions: sessions.length }
}

if (a('retire')) {
  const { quizIds } = await etat()
  for (const quizId of quizIds) {
    const sessions = lu('sessions', await admin.from('quazian_sessions').select('id').eq('quiz_id', quizId)).map((s) => s.id)
    if (sessions.length) lu('réponses', await admin.from('quazian_answers').delete().in('session_id', sessions))
    lu('notes', await admin.from('quazian_quiz_scores').delete().eq('quiz_id', quizId))
    lu('sessions', await admin.from('quazian_sessions').delete().eq('quiz_id', quizId))
    lu('questions', await admin.from('quazian_questions').delete().eq('quiz_id', quizId))
    lu('quiz', await admin.from('quazian_quizzes').delete().eq('id', quizId))
  }
  const apres = await etat()
  const restes = quizIds.length
    ? lu('quiz restants', await admin.from('quazian_quizzes').select('id').in('id', quizIds)).length : 0
  console.log(`retiré : ${quizIds.length} quiz — vérification par requête : ${apres.nbQuestions} question marquée, ${restes} quiz restant`)
  if (apres.nbQuestions || restes) process.exit(1)
  if (fs.existsSync(REGISTRE)) fs.rmSync(REGISTRE)
  process.exit(0)
}

const avant = await etat()
console.log(`constat : ${avant.quizIds.length} quiz de décor, ${avant.nbQuestions} questions marquées, ${avant.nbSessions} sessions`)
if (!a('seme')) process.exit(0)
if (avant.quizIds.length) { console.error('⛔ Un décor existe déjà : --retire d’abord.'); process.exit(1) }

const fermes = lu('quiz fermés', await admin.from('quazian_quizzes').select('id').eq('statut', 'ferme'))
const sourceId = fermes.find((q) => q.id.startsWith(QUIZ_SOURCE))?.id
if (!sourceId) throw new Error(`Quiz source ${QUIZ_SOURCE}… introuvable au bac à sable.`)
const quizSource = lu('quiz source', await admin.from('quazian_quizzes').select('scope_contenus').eq('id', sourceId).single())
const qsReelles = lu('questions source', await admin.from('quazian_questions').select('enonce, options, index_correct').eq('quiz_id', sourceId))
// 15 questions comme le quiz de T5 du 22/09 (les 5 réelles, trois fois) : c'est à
// 15 que les cases de navigation doivent se replier sur un téléphone.
const qsSource = [0, 1, 2].flatMap(() => qsReelles)
// Le compte de test d'Élo reste LIBRE (aucune session semée) : c'est avec lui
// que la recette ouvre la passation, à l'écran.
const { data: { users }, error: eUsers } = await admin.auth.admin.listUsers({ perPage: 1000 })
if (eUsers) throw new Error(`comptes — ${eUsers.message}`)
const elo = users.find((u) => u.email === env.TEST_ELEVE_EMAIL)?.id
const eleves = lu('inscrits Test', await admin.from('inscriptions').select('eleve_id').eq('classe_id', CLASSE_TEST).eq('statut', 'active'))
  .map((r) => r.eleve_id).sort((x, y) => (x === elo) - (y === elo) || x.localeCompare(y))
if (eleves.length < 6) throw new Error(`La classe Test n'a que ${eleves.length} élèves actifs.`)

fs.mkdirSync(DOSSIER, { recursive: true })
const maintenant = Date.now()
const BROUILLON = a('brouillon')
const FERME = a('ferme')
const quiz = lu('quiz', await admin.from('quazian_quizzes').insert(BROUILLON
  ? { statut: 'brouillon', classe_id: CLASSE_TEST, scope_contenus: quizSource.scope_contenus, duree_min: 15, nb_questions: qsSource.length }
  : FERME ? {
    statut: 'ferme', classe_id: CLASSE_TEST, scope_contenus: quizSource.scope_contenus, duree_min: 15,
    nb_questions: qsSource.length, lance_at: new Date(maintenant - 40 * 60000).toISOString(),
    ferme_at: new Date(maintenant - 20 * 60000).toISOString(), moyenne_cohorte: 0, ecart_type_cohorte: 0,
  } : {
    statut: 'lance', classe_id: CLASSE_TEST, scope_contenus: quizSource.scope_contenus, duree_min: 90,
    nb_questions: qsSource.length, lance_at: new Date(maintenant - 6 * 60000).toISOString(),
    ferme_at: new Date(maintenant + 84 * 60000).toISOString(),
  }).select('id').single())
fs.writeFileSync(REGISTRE, JSON.stringify({ quizId: quiz.id }, null, 2))
const questions = lu('questions', await admin.from('quazian_questions').insert(qsSource.map((q) => ({
  quiz_id: quiz.id, enonce: q.enonce, options: q.options, index_correct: q.index_correct,
  concept_tag: MARQUE, statut_validation: 'valide',
}))).select('id, index_correct'))
const N = questions.length

// Avancées : [réponses enregistrées, soumis ?] pour les 5 premiers élèves ; les autres n'ouvrent pas.
// Un brouillon n'a aucune session : personne n'a encore rien vu.
const PLAN = BROUILLON ? []
  : FERME ? eleves.map((_, k) => [k === eleves.length - 1 ? N : N - (k % 3), true]) // Élo (la dernière) : tout rendu
  : [[0, false], [2, false], [N - 1, false], [N, true], [N - 2, true]]
const REPARTITIONS = [[100, 0, 0, 0], [50, 50, 0, 0], [0, 100, 0, 0], [75, 0, 25, 0], [25, 25, 25, 25]]
for (let e = 0; e < PLAN.length; e++) {
  const [nb, soumis] = PLAN[e]
  const ordreQ = melange(N, e + 7).map((i) => questions[i].id)
  const ordreO = Object.fromEntries(questions.map((q, i) => [q.id, melange(4, e * 31 + i + 3)]))
  const session = lu('session', await admin.from('quazian_sessions').insert({
    quiz_id: quiz.id, eleve_id: eleves[e], started_at: new Date(maintenant - (6 - e) * 60000).toISOString(),
    ordre_questions: ordreQ, ordre_options: ordreO, est_rattrapage: false,
    ...(soumis ? { submitted_at: new Date(maintenant - 60000).toISOString(), auto_submitted: false } : {}),
  }).select('id').single())
  let total = 0
  const lignes = ordreQ.map((qid, k) => {
    const q = questions.find((x) => x.id === qid)
    const repondu = k < nb
    const r = repondu ? REPARTITIONS[(e + k) % REPARTITIONS.length] : [25, 25, 25, 25]
    const jetons = [0, 1, 2, 3].map((i) => r[(i - q.index_correct + 4) % 4])
    const score = brier(jetons, q.index_correct)
    total += score
    return { session_id: session.id, question_id: qid, p_a: jetons[0] / 100, p_b: jetons[1] / 100, p_c: jetons[2] / 100, p_d: jetons[3] / 100, repondu, ...(soumis ? { brier_brut: score / 10, score } : {}) }
  })
  const aEcrire = soumis ? lignes : lignes.filter((l) => l.repondu)
  if (aEcrire.length) lu('réponses', await admin.from('quazian_answers').insert(aEcrire))
  if (soumis) {
    const moyenne = total / N
    lu('note', await admin.from('quazian_quiz_scores').insert({ quiz_id: quiz.id, eleve_id: eleves[e], score_moyen: moyenne, note_formative_20: Math.min(Math.max(10 + moyenne, 0), 20), z_quiz: 0 }))
  }
}
const apres = await etat()
console.log(`semé : quiz ${quiz.id} (classe ${CLASSE_TEST.slice(0, 8)}…, ${eleves.length} inscrits), ${apres.nbQuestions} questions marquées, ${apres.nbSessions} sessions`)
console.log(`page prof : /prof/quazian/quizz/${quiz.id}/lancer`)
