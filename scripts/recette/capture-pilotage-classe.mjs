#!/usr/bin/env node
// ============================================================================
// capture-pilotage-classe.mjs — LA MATRICE « ACTIVITÉ » du pilotage d'une classe
// (`/prof/classes/<id>`), aux trois tailles, dans un Chrome sans fenêtre (CDP).
// ----------------------------------------------------------------------------
// Même mécanique que `capture-fragments-eleve.mjs` : lien magique (aucun mot de
// passe), `Emulation.setDeviceMetricsOverride` pour 1280 / 768 / 375,
// `Page.captureScreenshot` au-delà de la fenêtre, et la mesure du débordement.
// ⚠️ La matrice défile horizontalement DANS son cadre (`overflow-x-auto`) : le
//    débordement mesuré est celui de la PAGE, pas celui du tableau.
//
//   node scripts/recette/capture-pilotage-classe.mjs <dossier-de-sortie> [--classe <uuid>] [--email <prof>]
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
if (!SORTIE || SORTIE.startsWith('--')) throw new Error('usage : capture-pilotage-classe.mjs <dossier> [--classe <uuid>] [--email <prof>]')
fs.mkdirSync(SORTIE, { recursive: true })
const CLASSE = arg('--classe') ?? '05b39f0c-2d53-47ac-822d-623e17772edd' // « Test », bac à sable
const EMAIL = arg('--email') ?? 'louis.sagnieres@gmail.com'
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

// Session professeur par lien magique (consommé une fois).
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
if (error) throw new Error(error.message)
const PAGE = `/prof/classes/${CLASSE}?vue=activite`
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

for (const largeur of LARGEURS) {
  await taille(largeur)
  await va(`${BASE}${PAGE}`)
  await capture(`activite-${largeur}`)
}

// Ce que la matrice DIT, ligne par ligne (en-têtes + cellules) — pour relire sans image.
const texte = await cdp.evalue(`JSON.stringify([...document.querySelectorAll('table tr')].map(tr => [...tr.children].map(c => c.innerText.replace(/\\n/g, ' · ').trim())))`)
for (const ligne of JSON.parse(texte)) console.log(ligne.join(' | '))

// La sonde qui tranche à 375 px : quel élément rogne (largeur voulue > largeur donnée) ?
const rognes = await cdp.evalue(`JSON.stringify([...document.querySelectorAll('main *')].filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).overflowX !== 'scroll').slice(0, 12).map(el => ({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), largeur: el.clientWidth, voulu: el.scrollWidth, texte: (el.textContent || '').trim().slice(0, 40) })))`)
console.log('éléments rognés à 375 px :', rognes)

ws.close()
chrome.kill()
