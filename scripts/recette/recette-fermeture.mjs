#!/usr/bin/env node
// ============================================================================
// recette-fermeture.mjs — les scores PAR RÉPONSE n'existent qu'à la fermeture
// (revue du 23/09 : un élève qui soumettait en avance lisait son score par
// question et en tirait la bonne réponse). Au bac à sable : Élo passe et soumet
// à l'écran ; ses scores par réponse restent vides ; le professeur ferme à
// l'écran ; ils sont écrits, et l'écran de note s'affiche. ⛔ BAC À SABLE.
//
//   node scripts/recette/recette-fermeture.mjs <dossier> --quiz <uuid d'un quiz LANCÉ semé>
// ============================================================================
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
if (!env.NEXT_PUBLIC_SUPABASE_URL.includes('aoakpxxlyvthzueaywna')) throw new Error('⛔ bac à sable uniquement')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined }
const SORTIE = process.argv[2]
const QUIZ = arg('--quiz')
if (!SORTIE || !QUIZ) throw new Error('usage : recette-fermeture.mjs <dossier> --quiz <uuid>')
fs.mkdirSync(SORTIE, { recursive: true })
const BASE = 'http://localhost:3000'
const PORT = 9337
const MARQUE = 'DECOR-RETOURS-CLASSE-2209'
const dors = (ms) => new Promise((r) => setTimeout(r, ms))
const lu = (quoi, { data, error }) => { if (error) throw new Error(`${quoi} — ${error.message}`); return data }

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${SORTIE}/chrome-profil`, '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.attentes = new Map(); this.ecouteurs = []
    ws.addEventListener('message', (m) => {
      const msg = JSON.parse(m.data)
      if (msg.id && this.attentes.has(msg.id)) { const { res, rej } = this.attentes.get(msg.id); this.attentes.delete(msg.id); if (msg.error) rej(new Error(msg.error.message)); else res(msg.result) }
      else if (msg.method) for (const e of this.ecouteurs) e(msg)
    })
  }
  envoie(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.attentes.set(id, { res, rej })) }
  async evalue(expression) { const r = await this.envoie('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception)); return r.result.value }
}
async function ouvrir(url) { const ws = new WebSocket(url); await new Promise((r) => ws.addEventListener('open', r)); return new CDP(ws) }
let version
for (let i = 0; i < 50 && !version; i++) { try { version = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json() } catch { await dors(200) } }
const navigateur = await ouvrir(version.webSocketDebuggerUrl)
async function onglet() {
  const { browserContextId } = await navigateur.envoie('Target.createBrowserContext')
  const { targetId } = await navigateur.envoie('Target.createTarget', { url: 'about:blank', browserContextId })
  const cdp = await ouvrir(`ws://127.0.0.1:${PORT}/devtools/page/${targetId}`)
  await cdp.envoie('Page.enable'); await cdp.envoie('Runtime.enable')
  cdp.taille = (l) => cdp.envoie('Emulation.setDeviceMetricsOverride', { width: l, height: 900, deviceScaleFactor: 1, mobile: l < 768 })
  cdp.va = async (url) => { await cdp.envoie('Page.navigate', { url }); await dors(2500) }
  cdp.capture = async (nom, depuisSel) => {
    const y = depuisSel ? await cdp.evalue(`(() => { const e = document.querySelector('${depuisSel}'); return e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 120) : 0 })()`) : 0
    const d = JSON.parse(await cdp.evalue('JSON.stringify({h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})'))
    const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width: d.cw, height: Math.min(d.h - y, 1800), scale: 1 } })
    fs.writeFileSync(`${SORTIE}/${nom}.png`, Buffer.from(shot.data, 'base64'))
    console.log(`  ${nom}.png — ${d.cw}×${d.h}${d.w > d.cw ? ` ⛔ DÉBORDE (${d.w})` : ''}`)
  }
  return cdp
}
async function connecter(cdp, email, page) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) throw new Error(error.message)
  await cdp.va(`${BASE}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(page)}`)
}
const porte = async () => lu('porte', await admin.from('scriptorium_params').select('quazian_tuteur_actif').eq('id', 1).single()).quazian_tuteur_actif
async function envoyerAuTuteur(cdp, texte) {
  await cdp.evalue(`(() => { const t = document.querySelector('textarea[aria-label="Ta question sur le cours"]');
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(t, ${JSON.stringify(texte)});
    t.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  await dors(300)
  await cdp.evalue(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Envoyer').click()`)
}

const prof = await onglet()
const elo = await onglet()
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
const eloId = users.find((u) => u.email === env.TEST_ELEVE_EMAIL).id
const reponsesElo = async () => {
  const { data: s } = await admin.from('quazian_sessions').select('id, submitted_at').eq('quiz_id', QUIZ).eq('eleve_id', eloId).maybeSingle()
  if (!s) return { session: false }
  const { data: a } = await admin.from('quazian_answers').select('score, repondu').eq('session_id', s.id)
  return { soumise: !!s.submitted_at, lignes: a.length, sansScore: a.filter((x) => x.score === null).length, repondues: a.filter((x) => x.repondu).length }
}
try {
  console.log('1. Élo passe le quiz et soumet, à l’écran')
  await elo.taille(375)
  await connecter(elo, env.TEST_ELEVE_EMAIL, `/eleve/modules/quazian/quizz/${QUIZ}`)
  const glisse = (i, v) => elo.evalue(`(() => { const el = document.querySelectorAll('input[type=range]')[${i}]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '${v}'); el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  const clic = (t) => elo.evalue(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().startsWith(${JSON.stringify(t)}) || x.getAttribute('aria-label')?.startsWith(${JSON.stringify(t)})); if (!b) return false; b.click(); return true })()`)
  await glisse(0, 70); await glisse(1, 30); await dors(300)
  const n = await elo.evalue(`document.querySelectorAll('button[aria-label^="Question "]').length`)
  await clic(`Question ${n} `); await dors(1500)
  await glisse(2, 100); await dors(300)
  await clic('Revoir mes réponses'); await dors(1500)
  await clic('Envoyer mes réponses'); await dors(3000)
  console.log('   écran :', (await elo.evalue(`document.body.innerText`)).includes('Quizz soumis') ? '« Quizz soumis ! »' : '(pas de confirmation)')
  console.log('   en base, quiz encore lancé :', JSON.stringify(await reponsesElo()))

  console.log('2. Le professeur ferme le quiz, à l’écran')
  await prof.taille(1280)
  await connecter(prof, 'louis.sagnieres@gmail.com', `/prof/quazian/quizz/${QUIZ}/lancer`)
  await prof.evalue(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Fermer le quizz').click()`); await dors(800)
  await prof.evalue(`[...document.querySelectorAll('.fixed button')].find(b => b.textContent.trim() === 'Fermer le quizz').click()`); await dors(6000)
  const { data: q } = await admin.from('quazian_quizzes').select('statut').eq('id', QUIZ).single()
  console.log('   statut :', q.statut, '— réponses d’Élo :', JSON.stringify(await reponsesElo()))
  const { data: toutes } = await admin.from('quazian_sessions').select('id').eq('quiz_id', QUIZ)
  const { data: a } = await admin.from('quazian_answers').select('score').in('session_id', toutes.map((s) => s.id))
  console.log('   toutes copies : réponses', a.length, '— sans score', a.filter((x) => x.score === null).length)
  const { data: note } = await admin.from('quazian_quiz_scores').select('note_formative_20').eq('quiz_id', QUIZ).eq('eleve_id', eloId).single()
  console.log('   note d’Élo :', note.note_formative_20)

  console.log('3. Élo recharge : l’écran de note')
  await elo.va(`${BASE}/eleve/modules/quazian/quizz/${QUIZ}`)
  console.log('   ', (await elo.evalue(`document.querySelector('section')?.innerText.replace(/\\s+/g, ' ').slice(0, 240) ?? '(rien)'`)))
  await elo.capture('eleve-note-apres-fermeture-375')
} catch (e) {
  console.error('⛔ recette interrompue :', e)
} finally {
  chrome.kill()
  process.exit(0)
}
