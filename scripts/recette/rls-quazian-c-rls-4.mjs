#!/usr/bin/env node
// ============================================================================
// rls-quazian-c-rls-4.mjs — la fuite de la BONNE RÉPONSE d'un quizz (C-RLS-4).
// ----------------------------------------------------------------------------
// ⛔ CE QUE LE DÉFAUT DIT : l'élève peut lire `quazian_questions.index_correct`
//    — la bonne réponse — d'un quizz `lance`, donc AVANT d'y répondre, par DEUX
//    chemins indépendants :
//      · CHEMIN 1 — la charge servie : `initialiserSession` renvoyait le champ
//        `indexCorrecteRandomise` dans les props de la passation ;
//      · CHEMIN 2 — PostgREST en direct : les policies de SELECT sur
//        `quazian_questions` ouvrent la LIGNE ENTIÈRE, colonne comprise (une
//        policy RLS ne restreint pas les colonnes).
//
// ⭐ Ce script ne fait AUCUNE écriture. Il se met dans la peau d'un élève
//    (clé anon + JWT élève, exactement comme le navigateur) et tente la lecture.
//
//   node scripts/recette/rls-quazian-c-rls-4.mjs
//
// Sortie : PASS/FAIL. **Code de sortie ≠ 0 tant que la fuite existe** — c'est
// l'épreuve par l'échec : on veut le voir ROUGE avant le correctif, VERT après.
//
// Variables (.env.local) : NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY
//                          TEST_ELEVE_EMAIL · TEST_ELEVE_PASSWORD
// ============================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

function chargerEnvLocal() {
  try {
    for (const ligne of readFileSync(join(RACINE, '.env.local'), 'utf8').split('\n')) {
      const m = ligne.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!m) continue
      let val = m[2].trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = val
    }
  } catch { /* pas de .env.local */ }
}
chargerEnvLocal()

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const EMAIL = process.env.TEST_ELEVE_EMAIL
const PASSWORD = process.env.TEST_ELEVE_PASSWORD

if (!URL || !ANON || !EMAIL || !PASSWORD) {
  console.error('⛔ manque NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / TEST_ELEVE_EMAIL / TEST_ELEVE_PASSWORD')
  process.exit(2)
}

// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une lecture mal posée se lit
//    alors comme une réponse négative — et c'est exactement ce qu'on mesure ici.
//    On distingue donc TOUJOURS « refusé » de « cassé ».
function lecture(nom, { data, error }) {
  return { nom, lignes: data ?? [], erreur: error ? `${error.code ?? ''} ${error.message}`.trim() : null }
}

const resultats = []
function dit(verdict, titre, detail) {
  resultats.push({ verdict, titre, detail })
  const marque = verdict === 'PASS' ? '✅ PASS' : verdict === 'FAIL' ? '⛔ FAIL' : '⚪ SKIP'
  console.log(`${marque}  ${titre}`)
  if (detail) console.log(`         ${detail}`)
}

const eleve = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } })

// ── Ouvrir une session ÉLÈVE, par le mot de passe ou, à défaut, par un lien ──
// ⭐ LE REPLI EST LE PATRON DU DÉPÔT, et il est ici VERSIONNÉ pour la première
//    fois : `auth.admin.generateLink({ type: 'magiclink' })` puis `verifyOtp`
//    sur le client ANON. La session obtenue est un vrai JWT d'élève — les
//    lectures qui suivent restent donc bien « dans la peau d'un élève ».
// ⚠️ POURQUOI IL EXISTE : le 29/08, `signInWithPassword` s'est mis à rendre
//    « Invalid login credentials » par intermittence sur un compte intact.
// ⛔⛔ LA CAUSE A ÉTÉ TROUVÉE LE 30/08, ET CE N'ÉTAIT NI L'AUTH NI LE COMPTE :
//    **`zsh` MANGE UNE PARTIE DU MOT DE PASSE quand on source `.env.local`.**
//    La valeur contient `$^#`, et `zsh` développe cette séquence en sourçant —
//    `abc$^#def` devient `abc0`. Le mot de passe de 20 octets arrivait donc à
//    11. `bash` ne le fait pas, et le parseur regex de ce fichier non plus :
//    l'échec ne survenait QUE dans les scripts chargeant l'environnement par
//    `set -a && . ./.env.local`. Mesuré : shell 11 octets / node 20, empreintes
//    différentes, et la connexion ACCEPTE le complet, REFUSE le tronqué.
//    ⭐ Sur les 12 clés de `.env.local`, **une seule** diverge — les autres
//    secrets n'ont jamais été affectés. ⭐ Parade : entourer la valeur
//    d'apostrophes dans `.env.local` (les deux chargeurs rendent alors 20).
// ⭐ CE REPLI RESTE UTILE POUR AUTANT : il ne dépend d'aucun mot de passe, et
//    la ligne « session par … » dit toujours par quelle voie la sonde est
//    entrée. *Un message d'erreur peut mentir sur sa cause — celui-ci a fait
//    accuser trois coupables innocents avant qu'on mesure.*
async function sessionEleve() {
  const parMdp = PASSWORD
    ? await eleve.auth.signInWithPassword({ email: EMAIL, password: PASSWORD })
    : { error: { message: 'aucun TEST_ELEVE_PASSWORD' } }
  if (parMdp.data?.user) return { user: parMdp.data.user, voie: 'mot de passe' }

  const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!SECRET) throw new Error(`connexion refusée (${parMdp.error?.message}) et pas de clé de service pour le repli.`)
  const admin = createClient(URL, SECRET, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data: lien, error: eLien } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
  if (eLien) throw new Error(`lien — ${eLien.message}`)
  const { data: ses, error: eOtp } = await eleve.auth.verifyOtp({
    type: 'magiclink', token_hash: lien.properties.hashed_token,
  })
  if (eOtp || !ses?.user) throw new Error(`vérification du lien — ${eOtp?.message ?? 'sans utilisateur'}`)
  return { user: ses.user, voie: `lien magique (le mot de passe est refusé : ${parMdp.error?.message})` }
}

let auth, voie
try { ({ user: auth, voie } = await sessionEleve()) }
catch (e) { console.error(`⛔ ${e.message}`); process.exit(2) }
auth = { user: auth }
console.log(`\nDans la peau de « ${EMAIL} » (${auth.user.id}) — session par ${voie}\n`)

// ── De quoi la base dispose-t-elle ? (vu par l'élève lui-même) ──────────────
const quizz = lecture('quizz visibles', await eleve
  .from('quazian_quizzes').select('id, statut, classe_id').in('statut', ['lance', 'ferme']))
if (quizz.erreur) {
  console.error(`⛔ lecture des quizz cassée : ${quizz.erreur}`)
  process.exit(2)
}
if (quizz.lignes.length === 0) {
  dit('SKIP', 'aucun quizz `lance`/`ferme` visible par cet élève',
    'la fuite est INERTE ici — elle redevient live au premier quizz lancé.')
  process.exit(0)
}
console.log(`${quizz.lignes.length} quizz \`lance\`/\`ferme\` visible(s) par l'élève.\n`)

// ── ÉPREUVE 1 — la colonne interdite, lue en direct ────────────────────────
// ⭐ C'est la forme la plus nue de l'exfiltration : on ne demande QUE la réponse.
const nue = lecture('index_correct seul', await eleve
  .from('quazian_questions').select('id, quiz_id, index_correct'))
if (nue.erreur) {
  dit('PASS', 'CHEMIN 2 — `select index_correct` en direct',
    `refusé par la base : ${nue.erreur}`)
} else {
  const fuites = nue.lignes.filter((q) => q.index_correct !== null && q.index_correct !== undefined)
  if (fuites.length === 0) {
    dit('PASS', 'CHEMIN 2 — `select index_correct` en direct',
      `${nue.lignes.length} ligne(s) rendue(s), AUCUNE ne porte la réponse.`)
  } else {
    dit('FAIL', 'CHEMIN 2 — `select index_correct` en direct',
      `${fuites.length} question(s) rendent leur BONNE RÉPONSE `
      + `(ex. ${fuites[0].id.slice(0, 8)} → index ${fuites[0].index_correct}).`)
  }
}

// ── ÉPREUVE 2 — la ligne entière, comme la sert une policy sans colonne ────
const pleine = lecture('ligne entière', await eleve
  .from('quazian_questions').select('*').limit(50))
if (pleine.erreur) {
  dit('PASS', 'CHEMIN 2 — `select *` sur `quazian_questions`', `refusé : ${pleine.erreur}`)
} else if (pleine.lignes.length === 0) {
  dit('PASS', 'CHEMIN 2 — `select *` sur `quazian_questions`', '0 ligne rendue à l\'élève.')
} else {
  const porteuses = pleine.lignes.filter((q) => 'index_correct' in q && q.index_correct != null)
  dit(porteuses.length ? 'FAIL' : 'PASS', 'CHEMIN 2 — `select *` sur `quazian_questions`',
    `${pleine.lignes.length} ligne(s) rendue(s), dont ${porteuses.length} portant \`index_correct\`.`)
}

// ── ÉPREUVE 3 — CHEMIN 1, la charge servie par l'action serveur ───────────
// ⛔ Contrôle STATIQUE, et il se dit tel : une action serveur ne se joue pas
//    depuis un script. On vérifie que le champ n'est plus NI sélectionné NI
//    renvoyé par `initialiserSession`.
// ⭐ `--source <chemin>` : pour la CONTRE-ÉPREUVE — rejouer le contrôle contre
//    une version d'AVANT le correctif et vérifier qu'il rougit encore.
const iSrc = process.argv.indexOf('--source')
const ACTIONS = iSrc > 0 && process.argv[iSrc + 1]
  ? process.argv[iSrc + 1]
  : join(RACINE, 'app/eleve/modules/quazian/quizz/[quizId]/actions.ts')
let source = ''
try { source = readFileSync(ACTIONS, 'utf8') } catch { /* absent */ }
if (!source) {
  dit('SKIP', 'CHEMIN 1 — la charge servie', `fichier introuvable : ${ACTIONS}`)
} else {
  // ⛔⛔ ON DÉCOMMENTE AVANT DE CHERCHER, et c'est une réparation du 29/08 :
  //    la première version de ce contrôle a rendu FAIL sur un code CORRIGÉ,
  //    parce que les commentaires qui EXPLIQUENT le correctif nomment
  //    forcément ce qu'il retire. *Un contrôle qui se trompe de cause est pire
  //    que pas de contrôle.*
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n')
  const debut = code.indexOf('export async function initialiserSession')
  const suite = code.indexOf('\nexport ', debut + 1)
  const corps = debut < 0 ? '' : code.slice(debut, suite < 0 ? code.length : suite)
  const selectionne = /index_correct/.test(corps)
  const renvoye = /indexCorrecteRandomise/.test(code)
  dit(selectionne || renvoye ? 'FAIL' : 'PASS', 'CHEMIN 1 — la charge servie par `initialiserSession`',
    selectionne || renvoye
      ? `\`index_correct\` sélectionné : ${selectionne} · \`indexCorrecteRandomise\` présent : ${renvoye}`
      : 'ni la colonne ni le champ dérivé n\'apparaissent dans la passation.')
}

// ── CONTRE-ÉPREUVE — ce que l'élève doit GARDER ──────────────────────────
// ⚠️ Un correctif qui ferme tout ferme aussi le quizz. Ici on vérifie que ses
//    PROPRES données lui restent lisibles ; les énoncés, eux, passent désormais
//    par le serveur (patron C1 : « la garde est le code »), pas par PostgREST.
const miennes = lecture('mes sessions', await eleve
  .from('quazian_sessions').select('id, quiz_id').eq('eleve_id', auth.user.id))
dit(miennes.erreur ? 'FAIL' : 'PASS', 'CONTRE-ÉPREUVE — l\'élève lit toujours ses propres sessions',
  miennes.erreur ? `cassé : ${miennes.erreur}` : `${miennes.lignes.length} session(s) lisible(s).`)

const echecs = resultats.filter((r) => r.verdict === 'FAIL')
console.log(`\n${resultats.length} contrôle(s) · ${echecs.length} FAIL\n`)
process.exit(echecs.length ? 1 : 0)
