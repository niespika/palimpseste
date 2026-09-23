#!/usr/bin/env node
// ============================================================================
// recette-tuteur.mjs — « En parler avec le tuteur » après une erreur assurée, et
// la pause du tuteur pendant un quiz (retours de classe, point 8), à l'écran,
// au bac à sable. Deux sessions isolées (professeur, Élo) dans un Chrome sans
// fenêtre. ⛔ BAC À SABLE UNIQUEMENT. Ouvre la porte pour la recette et la
// REFERME à la fin (relue par requête). ⚠️ UN appel au modèle du tuteur
// (gemini flash-lite) : c'est lui que la recette éprouve.
//
//   node scripts/recette/recette-tuteur.mjs <dossier> --quiz <uuid d'un quiz FERMÉ semé>
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
if (!SORTIE || !QUIZ) throw new Error('usage : recette-tuteur.mjs <dossier> --quiz <uuid>')
fs.mkdirSync(SORTIE, { recursive: true })
const BASE = 'http://localhost:3000'
const PORT = 9336
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
let quizPause = null
const PAUSE_SEULE = process.argv.includes('--pause-seule')
try {
  if (PAUSE_SEULE) {
    // Seulement la pause : aucun appel au modèle (la route refuse avant).
    await elo.taille(375)
    await connecter(elo, env.TEST_ELEVE_EMAIL, '/eleve/modules/scriptorium')
    const { data: ins } = await admin.from('inscriptions').select('classe_id').eq('statut', 'active')
      .eq('eleve_id', (await admin.auth.admin.listUsers({ perPage: 1000 })).data.users.find((u) => u.email === env.TEST_ELEVE_EMAIL).id)
    const qz = lu('quiz pause', await admin.from('quazian_quizzes').insert({ statut: 'lance', classe_id: ins[0].classe_id, duree_min: 10, nb_questions: 1, lance_at: new Date().toISOString(), ferme_at: new Date(Date.now() + 10 * 60000).toISOString() }).select('id').single())
    lu('question marquée', await admin.from('quazian_questions').insert({ quiz_id: qz.id, enonce: 'Décor', options: ['a', 'b', 'c', 'd'], index_correct: 0, concept_tag: MARQUE, statut_validation: 'valide' }))
    await envoyerAuTuteur(elo, 'Une longue question que je ne veux pas perdre.')
    await dors(4000)
    console.log('   message :', await elo.evalue(`[...document.querySelectorAll('p')].find(p => p.textContent.includes('⚠'))?.textContent ?? '(aucun)'`))
    console.log('   saisie après refus :', JSON.stringify(await elo.evalue(`document.querySelector('textarea[aria-label="Ta question sur le cours"]').value`)))
    console.log('   bulle d’élève restée au fil :', await elo.evalue(`document.body.innerText.includes('Une longue question que je ne veux pas perdre.')`))
    throw new Error('fin (pause seule)')
  }
  console.log('1. Professeur : ouvrir « En parler avec le tuteur » (Quazian → Paramètres → Passation)')
  await prof.taille(1280)
  await connecter(prof, 'louis.sagnieres@gmail.com', '/prof/quazian/parametres?vue=passation')
  console.log('   porte avant :', await porte())
  console.log('   clic :', await prof.evalue(`(() => { const s = [...document.querySelectorAll('section')].find(x => x.textContent.includes('tuteur, après le quiz')); const b = s && [...s.querySelectorAll('button')].find(x => x.textContent.trim() === 'Ouvrir'); if (!b) return false; b.click(); return true })()`))
  await dors(2500)
  console.log('   porte après :', await porte())
  await prof.capture('01-prof-portes-1280')

  console.log('2. Élo : l’écran de note, les boutons')
  await elo.taille(375)
  await connecter(elo, env.TEST_ELEVE_EMAIL, `/eleve/modules/quazian/quizz/${QUIZ}`)
  const nb = await elo.evalue(`[...document.querySelectorAll('button')].filter(b => b.textContent.includes('En parler avec le tuteur')).length`)
  console.log('   boutons « En parler avec le tuteur » :', nb)
  await elo.evalue(`document.querySelectorAll('form button')[0]?.closest('div.rounded-xl')?.setAttribute('data-recette', 'carte')`)
  await elo.capture('02-eleve-carte-bouton-375', '[data-recette="carte"]')

  console.log('3. Élo : clic → le tuteur s’ouvre avec le message écrit par l’application')
  await elo.evalue(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('En parler avec le tuteur')).click()`)
  let url = ''
  for (let i = 0; i < 15 && !url.includes('/scriptorium'); i++) { await dors(1000); url = await elo.evalue('location.href') }
  await dors(2500)
  console.log('   adresse :', url.replace(BASE, ''))
  console.log('   premier message :', (await elo.evalue(`[...document.querySelectorAll('p.whitespace-pre-wrap')].map(p => p.innerText).join(' ¶ ')`)).slice(0, 400))
  await elo.capture('03-eleve-tuteur-ouverture-375')
  const convId = new URL(url).searchParams.get('conv')
  const { data: conv } = await admin.from('scriptorium_conversations').select('quiz_question_id, classe_id').eq('id', convId).single()
  console.log('   en base : conversation rattachée à une question :', !!conv?.quiz_question_id)

  console.log('4. Élo répond ; le tuteur (un appel au modèle) doit connaître la question')
  await envoyerAuTuteur(elo, 'Je pensais que c’était ça parce que ça me semblait le plus logique. Pourquoi c’est faux ?')
  let reponse = ''
  for (let i = 0; i < 40; i++) {
    await dors(1000)
    const ps = JSON.parse(await elo.evalue(`JSON.stringify([...document.querySelectorAll('p.whitespace-pre-wrap')].map(p => p.innerText))`))
    reponse = ps.at(-1) ?? ''
    if (ps.length >= 3 && reponse.length > 80 && !(await elo.evalue(`[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Stop')`))) break
  }
  console.log('   réponse du tuteur :', reponse.replace(/\s+/g, ' ').slice(0, 500))
  await elo.capture('04-eleve-tuteur-reponse-375')
  await elo.taille(1280); await dors(500); await elo.capture('04b-eleve-tuteur-reponse-1280'); await elo.taille(375)
  await dors(3000)
  const { data: couts } = await admin.from('api_couts').select('module, cout').eq('module', 'quazian-tuteur').order('created_at', { ascending: false }).limit(1)
  console.log('   coût compté à part :', JSON.stringify(couts))

  console.log('5. Pause : un quiz est lancé dans la classe → le tuteur refuse')
  const qz = lu('quiz pause', await admin.from('quazian_quizzes').insert({ statut: 'lance', classe_id: conv.classe_id, duree_min: 10, nb_questions: 1, lance_at: new Date().toISOString(), ferme_at: new Date(Date.now() + 10 * 60000).toISOString() }).select('id').single())
  quizPause = qz.id
  lu('question marquée', await admin.from('quazian_questions').insert({ quiz_id: qz.id, enonce: 'Décor', options: ['a', 'b', 'c', 'd'], index_correct: 0, concept_tag: MARQUE, statut_validation: 'valide' }))
  await envoyerAuTuteur(elo, 'Et alors, Platon ?')
  await dors(4000)
  console.log('   message affiché :', await elo.evalue(`[...document.querySelectorAll('p')].find(p => p.textContent.includes('⚠'))?.textContent ?? '(aucun)'`))
  await elo.capture('05-eleve-tuteur-en-pause-375')
} catch (e) {
  if (!String(e).includes('fin (pause seule)')) console.error('⛔ recette interrompue :', e)
} finally {
  console.log('6. Ménage : porte refermée, quiz de pause retiré par le décor')
  lu('fermeture', await admin.from('scriptorium_params').update({ quazian_tuteur_actif: false }).eq('id', 1).select('id'))
  console.log('   porte relue :', await porte())
  chrome.kill()
  process.exit(0)
}
