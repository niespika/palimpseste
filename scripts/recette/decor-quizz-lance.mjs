#!/usr/bin/env node
// ============================================================================
// decor-quizz-lance.mjs — le décor qui rend la PASSATION Quazian jouable.
// ----------------------------------------------------------------------------
// ⛔ POURQUOI IL EXISTE. Depuis `72561ce` (C-RLS-4), trois lectures d'
//    `app/eleve/modules/quazian/quizz/[quizId]/actions.ts` sont passées au client
//    admin, et `soumettreQuizz` a changé d'ordre. Or **aucune base ne porte de
//    quizz `lance`** : `initialiserSession` en création, `sauvegarderReponse` et
//    `soumettreQuizz` sont à **zéro passage**. `tsc` et `npm test` ne voient rien
//    de tout cela — une action serveur morte ne se voit qu'au clic.
//
// ⛔ BAC À SABLE UNIQUEMENT. Le script REFUSE toute autre base.
// ⛔ IL NE SE NETTOIE PAS TOUT SEUL — c'est tout son objet. `--retire`.
//
//   node scripts/recette/decor-quizz-lance.mjs [--constat|--seme|--retire|--lien]
//                                              [--vide|--remets]
//
//   --constat  (défaut) n'écrit RIEN : dit ce qui existe et ce qui serait semé
//   --seme     sème DEUX quizz `lance` marqués, avec leurs questions
//   --lien     minte un lien de session élève SANS mot de passe (magiclink)
//   --vide     déplace les questions du quizz B vers le A → B n'a plus de
//              question : c'est L'ÉPREUVE PAR L'ÉCHEC du réordonnancement du
//              verrou (`soumettreQuizz` doit refuser AVANT de poser
//              `submitted_at`, pas après)
//   --remets   défait `--vide`
//   --retire   balaie le décor PAR LA MARQUE, puis vérifie PAR REQUÊTE
//
// ⭐ LA MARQUE VA EN BASE, pas seulement au registre : chaque question porte
//    `concept_tag = 'DECOR-C-RLS-4'`. Un registre sur disque ne suffit pas — un
//    SIGPIPE ou une contrainte laisserait le décor derrière.
// ⭐ ET C'EST POURQUOI `--vide` DÉPLACE AU LIEU DE SUPPRIMER : supprimer les
//    questions effacerait la marque, et le quizz vide deviendrait introuvable.
// ============================================================================

import fs from 'node:fs'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const REGISTRE = 'scripts/recette/.decor-quizz-lance.json'
const MARQUE = 'DECOR-C-RLS-4'
const SANDBOX = 'aoakpxxlyvthzueaywna'

for (const ligne of readFileSync(join(RACINE, '.env.local'), 'utf8').split('\n')) {
  const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[m[1]] === undefined) process.env[m[1]] = v
}

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const CLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = process.env.TEST_ELEVE_EMAIL
if (!URL?.includes(SANDBOX)) {
  console.error(`⛔ REFUS — ce décor ne se sème qu'en BAC À SABLE (${SANDBOX}). Vu : ${URL}`)
  process.exit(2)
}
const admin = createClient(URL, CLE, { auth: { autoRefreshToken: false, persistSession: false } })

// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une lecture mal posée se lit
//    comme une réponse négative. Tout passe donc par `lu`, qui LÈVE.
function lu(quoi, { data, error }) {
  if (error) throw new Error(`${quoi} — ${error.message}`)
  return data
}
const a = (n) => process.argv.includes(`--${n}`)
const dire = (s) => console.log(s)

function registreLu() {
  return fs.existsSync(REGISTRE) ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) : null
}
function registreEcrit(r) { fs.writeFileSync(REGISTRE, JSON.stringify(r, null, 2)) }

// ── Ce que la base porte, marqué ou non ────────────────────────────────────
async function etat() {
  const marquees = lu('questions marquées', await admin
    .from('quazian_questions').select('id, quiz_id').eq('concept_tag', MARQUE))
  const quizIds = [...new Set(marquees.map((q) => q.quiz_id))]
  const quizz = quizIds.length
    ? lu('quizz du décor', await admin.from('quazian_quizzes')
        .select('id, statut, classe_id').in('id', quizIds))
    : []
  const reg = registreLu()
  // ⭐ Le balayage prend l'UNION de la marque et du registre : si le script est
  //    mort entre la création d'un quizz et l'insert de ses questions, le quizz
  //    n'a pas de marque et seul le registre le connaît.
  const orphelins = (reg?.quizz ?? []).filter((id) => !quizIds.includes(id))
  return { marquees, quizIds, quizz, orphelins, reg }
}

const QUESTIONS = [
  { enonce: 'Décor de recette — laquelle de ces bases est le bac à sable ?',
    options: ['aoakpxx…', 'ucmngach…', 'aucune', 'les deux'], index_correct: 0 },
  { enonce: 'Décor de recette — une policy RLS peut-elle restreindre une COLONNE ?',
    options: ['oui', 'non', 'seulement en SELECT', 'seulement pour anon'], index_correct: 1 },
  { enonce: 'Décor de recette — que rend `supabase-js` quand une lecture échoue ?',
    options: ['il lève', 'un `{ error }`', 'undefined', 'une exception typée'], index_correct: 1 },
]

async function constat() {
  const e = await etat()
  dire(`\nBase : ${URL}`)
  dire(`Quizz du décor en base : ${e.quizz.length}${e.quizz.length ? ' — ' + e.quizz.map((q) => `${q.id.slice(0, 8)} (${q.statut})`).join(', ') : ''}`)
  dire(`Questions marquées « ${MARQUE} » : ${e.marquees.length}`)
  dire(`Orphelins connus du seul registre : ${e.orphelins.length}`)
  const tous = lu('tous les quizz', await admin.from('quazian_quizzes').select('id, statut'))
  dire(`\nLA BASE ENTIÈRE : ${tous.length} quizz — ${JSON.stringify(
    tous.reduce((m, q) => ({ ...m, [q.statut]: (m[q.statut] ?? 0) + 1 }), {}))}`)
  if (!e.quizz.length) {
    dire(`\n⭐ CE QUE \`--seme\` ÉCRIRAIT : 2 quizz \`lance\` + ${QUESTIONS.length} questions chacun,`)
    dire(`   dans la classe de « ${EMAIL} », marquées \`concept_tag = ${MARQUE}\`.`)
  }
}

async function seme() {
  const e = await etat()
  if (e.quizz.length) {
    throw new Error(`le décor est DÉJÀ semé (${e.quizz.length} quizz). Condition de reprise : \`--retire\` d'abord.`)
  }
  const comptes = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (comptes.error) throw new Error(`comptes — ${comptes.error.message}`)
  const u = comptes.data.users.find((x) => x.email?.toLowerCase() === EMAIL.toLowerCase())
  if (!u) throw new Error(`aucun compte « ${EMAIL} »`)
  const insc = lu('inscriptions', await admin.from('inscriptions')
    .select('classe_id').eq('eleve_id', u.id).eq('statut', 'active'))
  if (!insc.length) throw new Error(`« ${EMAIL} » n'a aucune inscription active`)
  const classeId = insc[0].classe_id
  dire(`élève ${EMAIL} (${u.id.slice(0, 8)}) · classe ${classeId.slice(0, 8)}`)

  const registre = { marque: MARQUE, eleveId: u.id, classeId, quizz: [], questions: [] }
  registreEcrit(registre)

  for (const nom of ['A', 'B']) {
    const q = lu(`quizz ${nom}`, await admin.from('quazian_quizzes').insert({
      statut: 'lance', classe_id: classeId, duree_min: 25,
      nb_questions: QUESTIONS.length, lance_at: new Date().toISOString(),
    }).select('id').single())
    registre.quizz.push(q.id)
    registreEcrit(registre) // ⭐ le registre s'écrit À CHAQUE insert, pas à la fin
    const lignes = QUESTIONS.map((x) => ({ ...x, quiz_id: q.id, concept_tag: MARQUE, statut_validation: 'valide' }))
    const posees = lu(`questions ${nom}`, await admin.from('quazian_questions').insert(lignes).select('id'))
    registre.questions.push(...posees.map((p) => ({ id: p.id, quizOrigine: q.id })))
    registreEcrit(registre)
    dire(`✅ quizz ${nom} ${q.id.slice(0, 8)} · statut lance · ${posees.length} questions marquées`)
  }
  const v = await etat()
  dire(`\nVÉRIFIÉ PAR REQUÊTE : ${v.quizz.length} quizz, ${v.marquees.length} questions marquées.`)
  dire(`Registre : ${REGISTRE}`)
}

async function vide() {
  const reg = registreLu()
  if (!reg?.quizz?.length) throw new Error('aucun registre : rien à vider.')
  const [qA, qB] = reg.quizz
  const bougees = lu('déplacement', await admin.from('quazian_questions')
    .update({ quiz_id: qA }).eq('quiz_id', qB).eq('concept_tag', MARQUE).select('id'))
  dire(`⚠️ ${bougees.length} question(s) déplacées de B (${qB.slice(0, 8)}) vers A (${qA.slice(0, 8)}).`)
  const restantes = lu('contrôle', await admin.from('quazian_questions').select('id').eq('quiz_id', qB))
  dire(`VÉRIFIÉ PAR REQUÊTE : le quizz B porte ${restantes.length} question(s). La marque, elle, est intacte.`)
}

async function remets() {
  const reg = registreLu()
  if (!reg?.questions?.length) throw new Error('aucun registre : rien à remettre.')
  const [, qB] = reg.quizz
  const aRendre = reg.questions.filter((q) => q.quizOrigine === qB).map((q) => q.id)
  const rendues = lu('retour', await admin.from('quazian_questions')
    .update({ quiz_id: qB }).in('id', aRendre).select('id'))
  const restantes = lu('contrôle', await admin.from('quazian_questions').select('id').eq('quiz_id', qB))
  dire(`✅ ${rendues.length} rendues · VÉRIFIÉ PAR REQUÊTE : le quizz B porte ${restantes.length} question(s).`)
}

async function lien() {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
  if (error) throw new Error(`lien — ${error.message}`)
  const h = data.properties.hashed_token
  dire(`\n⭐ Session élève SANS mot de passe (patron C6-L2) — ouvrir :\n`)
  dire(`http://localhost:3000/auth/confirm?token_hash=${h}&type=magiclink&next=/eleve/modules/quazian\n`)
}

async function retire() {
  const e = await etat()
  const cibles = [...new Set([...e.quizIds, ...e.orphelins])]
  if (!cibles.length) { dire('rien à retirer : aucun quizz marqué, aucun orphelin au registre.'); return }
  dire(`⚠️ AVANT : ${cibles.length} quizz, ${e.marquees.length} questions marquées.`)
  // ⛔ L'ORDRE COMPTE : les enfants d'abord. On ne se fie pas à une cascade
  //    qu'on n'a pas mesurée.
  for (const t of ['quazian_answers']) {
    const sess = lu('sessions', await admin.from('quazian_sessions').select('id').in('quiz_id', cibles))
    if (sess.length) lu(t, await admin.from(t).delete().in('session_id', sess.map((s) => s.id)).select('id'))
  }
  for (const t of ['quazian_quiz_scores', 'quazian_sessions']) {
    lu(t, await admin.from(t).delete().in('quiz_id', cibles).select('id'))
  }
  lu('questions', await admin.from('quazian_questions').delete().in('quiz_id', cibles).select('id'))
  lu('quizz', await admin.from('quazian_quizzes').delete().in('id', cibles).select('id'))

  // ⭐ LE RETOUR SE VÉRIFIE PAR REQUÊTE, jamais sur le mot « supprimé ».
  const v = await etat()
  const resteQuizz = lu('contrôle quizz', await admin.from('quazian_quizzes').select('id, statut').in('id', cibles))
  dire(`\nVÉRIFIÉ PAR REQUÊTE — questions marquées restantes : ${v.marquees.length} · quizz du décor restants : ${resteQuizz.length}`)
  if (v.marquees.length || resteQuizz.length) throw new Error('⛔ LE DÉCOR N\'EST PAS ENTIÈREMENT RETIRÉ.')
  if (fs.existsSync(REGISTRE)) fs.unlinkSync(REGISTRE)
  const tous = lu('tous les quizz', await admin.from('quazian_quizzes').select('id, statut'))
  dire(`✅ décor retiré. La base revient à ${tous.length} quizz.`)
}

const mode = a('seme') ? seme : a('retire') ? retire : a('vide') ? vide
  : a('remets') ? remets : a('lien') ? lien : constat
try { await mode() } catch (e) { console.error(`\n⛔ ${e.message}`); process.exit(1) }
