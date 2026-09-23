#!/usr/bin/env node
// ============================================================================
// capture-quazian-retours-classe.mjs — les écrans des retours de classe du
// 22/09/2026, aux trois tailles, dans un Chrome sans fenêtre (CDP). Même
// mécanique que `capture-pilotage-classe.mjs`. BAC À SABLE UNIQUEMENT.
//
//   node scripts/recette/capture-quazian-retours-classe.mjs <dossier> --quiz <uuid> [--retour <uuid>]
// ============================================================================

import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined }
const SORTIE = process.argv[2]
if (!SORTIE || SORTIE.startsWith('--')) throw new Error('usage : capture-quazian-retours-classe.mjs <dossier> --quiz <uuid> [--retour <uuid>]')
if (!env.NEXT_PUBLIC_SUPABASE_URL.includes('aoakpxxlyvthzueaywna')) throw new Error('⛔ bac à sable uniquement')
fs.mkdirSync(SORTIE, { recursive: true })
const QUIZ = arg('--quiz')
const RETOUR = arg('--retour')
const PASSATION = arg('--passation')
const EMAIL = 'louis.sagnieres@gmail.com'
const BASE = 'http://localhost:3000'
const PORT = 9334
const PROFIL = `${SORTIE}/chrome-profil`
const LARGEURS = [1280, 768, 375]

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFIL}`, '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })
const dors = (ms) => new Promise((r) => setTimeout(r, ms))

async function cible() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
      return await r.json()
    } catch { await dors(200) }
  }
  throw new Error('Chrome ne répond pas')
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.attentes = new Map(); this.ecouteurs = []
    ws.addEventListener('message', (m) => {
      const msg = JSON.parse(m.data)
      if (msg.id && this.attentes.has(msg.id)) { const { res, rej } = this.attentes.get(msg.id); this.attentes.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result) }
      else if (msg.method) for (const e of this.ecouteurs) e(msg)
    })
  }
  envoie(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.attentes.set(id, { res, rej })) }
  async evalue(expression) { const r = await this.envoie('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception)); return r.result.value }
  attendChargement() { return new Promise((res) => { const e = (m) => { if (m.method === 'Page.loadEventFired') { this.ecouteurs = this.ecouteurs.filter((x) => x !== e); res() } }; this.ecouteurs.push(e) }) }
}

const t = await cible()
const ws = new WebSocket(t.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener('open', r))
const cdp = new CDP(ws)
await cdp.envoie('Page.enable')
await cdp.envoie('Runtime.enable')
// La passation pose un `beforeunload` (verrou de page) : on accepte tout dialogue.
cdp.ecouteurs.push((m) => { if (m.method === 'Page.javascriptDialogOpening') cdp.envoie('Page.handleJavaScriptDialog', { accept: true }) })

// Session professeur par lien magique (consommé une fois).
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
if (error) throw new Error(error.message)
const PAGE = `/prof/quazian/quizz/${QUIZ}/lancer`
const charge = cdp.attendChargement()
await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(PAGE)}` })
await charge
await dors(1500)
console.log('session :', await cdp.evalue('location.href'))

async function taille(largeur) {
  await cdp.envoie('Emulation.setDeviceMetricsOverride', { width: largeur, height: 900, deviceScaleFactor: 1, mobile: largeur < 768 })
}
async function va(url) {
  const c = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url })
  await c
  await dors(1500)
}
async function capture(nom) {
  const dims = JSON.parse(await cdp.evalue('JSON.stringify({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, cw: document.documentElement.clientWidth})'))
  const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: dims.cw, height: Math.min(dims.h, 4000), scale: 1 } })
  fs.writeFileSync(`${SORTIE}/${nom}.png`, Buffer.from(shot.data, 'base64'))
  console.log(`${nom}.png — page ${dims.cw}×${dims.h}${dims.w > dims.cw ? ` ⛔ DÉBORDE horizontalement (${dims.w})` : ''}`)
}


async function connecter(email, page) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) throw new Error(error.message)
  await va(`${BASE}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(page)}`)
}
const lignes = () => cdp.evalue(`JSON.stringify([...document.querySelectorAll('table tr')].map(tr => [...tr.children].map(c => c.innerText.replace(/\\n/g, ' · ').trim())))`)

if (QUIZ) for (const largeur of LARGEURS) {
  await taille(largeur)
  await va(`${BASE}${PAGE}`)
  await capture(`prof-lancer-${largeur}`)
}
if (QUIZ) for (const l of JSON.parse(await lignes())) console.log(l.join(' | '))
// La route de sondage rend la même liste que la page.
if (QUIZ) console.log('route :', await cdp.evalue(`fetch('/api/quazian/live/${QUIZ}').then(r => r.json()).then(j => JSON.stringify({ n: j.eleves?.length, q: j.nbQuestions, r: j.eleves?.map(e => e.repondues + (e.soumis ? 's' : '')) }))`))

if (RETOUR) {
  await connecter(env.TEST_ELEVE_EMAIL, `/eleve/modules/quazian/quizz/${RETOUR}`)
  for (const largeur of LARGEURS) {
    await taille(largeur)
    await va(`${BASE}/eleve/modules/quazian/quizz/${RETOUR}`)
    await capture(`eleve-retour-${largeur}`)
  }
  // Point 8 : la première carte qui porte « En parler avec le tuteur », à l'écran.
  await taille(375); await va(`${BASE}/eleve/modules/quazian/quizz/${RETOUR}`)
  const yBouton = await cdp.evalue(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes('En parler avec le tuteur')); if (!b) return -1; const carte = b.closest('div.bg-surface.border') || b; return Math.max(0, carte.getBoundingClientRect().top + scrollY - 20) })()`)
  if (yBouton >= 0) {
    const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: yBouton, width: 375, height: 1100, scale: 1 } })
    fs.writeFileSync(`${SORTIE}/eleve-carte-tuteur-375.png`, Buffer.from(shot.data, 'base64'))
    console.log('eleve-carte-tuteur-375.png')
  } else console.log('aucun bouton « En parler avec le tuteur »')
  console.log('retour élève :', await cdp.evalue(`JSON.stringify([...document.querySelectorAll('main .space-y-4 > div')].map(d => d.innerText.replace(/\\n/g, ' · ').slice(0, 300)))`))
}
if (PASSATION) {
  // Un glissé au doigt, tel que React le reçoit : valeur posée par le setter natif, puis `input`.
  const glisse = (lettre, v) => cdp.evalue(`(() => {
    const el = [...document.querySelectorAll('input[type=range]')]['ABCD'.indexOf('${lettre}')]
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '${v}')
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return true })()`)
  const valeurs = () => cdp.evalue(`JSON.stringify([...document.querySelectorAll('input[type=range]')].map(e => +e.value))`)
  const total = () => cdp.evalue(`[...document.querySelectorAll('span')].find(s => /sur 100/.test(s.textContent))?.textContent`)
  await connecter(env.TEST_ELEVE_EMAIL, `/eleve/modules/quazian/quizz/${PASSATION}`)
  for (const largeur of LARGEURS) {
    await taille(largeur)
    await va(`${BASE}/eleve/modules/quazian/quizz/${PASSATION}`)
    await capture(`eleve-passation-vide-${largeur}`)
  }
  console.log('au départ :', await valeurs(), '—', await total())
  // La fuite du 22/09 : l'ordre du mélange ne doit plus figurer dans la page.
  console.log('« optionMapping » dans la page :', await cdp.evalue(`document.documentElement.outerHTML.includes('optionMapping')`))
  await glisse('A', 70); await dors(300)
  await glisse('B', 60); await dors(300)
  console.log('A poussé à 70, puis B poussé à 60 :', await valeurs(), '—', await total())
  const plusB = await cdp.evalue(`document.querySelector('[aria-label="Ajouter 1 point à la réponse B"]').disabled`)
  console.log('bouton + de B grisé :', plusB)
  await capture('eleve-passation-plafond-375')
  await taille(1280); await dors(400)
  await capture('eleve-passation-plafond-1280')

  // Les cases à trois états : Q1 répondue (70/30), Q2 ouverte sans y toucher, Q3 à l'écran.
  const clic = (sel) => cdp.evalue(`(() => { const b = document.querySelector('${sel}'); if (!b) return false; b.click(); return true })()`)
  const casesDites = () => cdp.evalue(`JSON.stringify([...document.querySelectorAll('button[aria-label^="Question "]')].map(b => b.getAttribute('aria-label')).slice(0, 5))`)
  await clic('[aria-label^="Question 2 "]'); await dors(1500)
  await clic('[aria-label^="Question 3 "]'); await dors(800)
  await glisse('C', 50); await dors(200); await glisse('D', 50); await dors(200)
  console.log('cases :', await casesDites())
  for (const largeur of [375, 768, 1280]) { await taille(largeur); await dors(400); await capture(`eleve-cases-${largeur}`) }
  // Jusqu'à la dernière, puis le récapitulatif.
  const n = await cdp.evalue(`document.querySelectorAll('button[aria-label^="Question "]').length`)
  await clic(`[aria-label^="Question ${n} "]`); await dors(1500)
  await glisse('B', 100); await dors(300)
  await cdp.evalue(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Revoir mes réponses')).click()`); await dors(1500)
  console.log('récapitulatif :', await cdp.evalue(`[...document.querySelectorAll('h3')].map(h => h.textContent).join(' | ')`), '—', await cdp.evalue(`document.querySelector('p.text-attention')?.textContent ?? ''`))
  for (const largeur of [375, 768, 1280]) { await taille(largeur); await dors(400); await capture(`eleve-recap-${largeur}`) }
}
ws.close()
chrome.kill()
