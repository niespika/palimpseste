#!/usr/bin/env node
// ============================================================================
// capture-fragments-eleve.mjs — LES CAPTURES PLEINE PAGE de l'écran Fragments
// élève, aux trois tailles, dans un Chrome sans fenêtre piloté par CDP.
// ----------------------------------------------------------------------------
// Pourquoi CDP : le volet de navigateur de la séance est CACHÉ, et un volet
// caché ne défile pas, ne calcule aucune sélection et rend des captures
// blanches sous la ligne de flottaison (cf. reference_smoke_par_cdp_volet_cache).
// Ici : lien magique (aucun mot de passe), `Emulation.setDeviceMetricsOverride`
// pour 1280 / 768 / 375, `Page.captureScreenshot` avec `captureBeyondViewport`.
//
//   node scripts/recette/capture-fragments-eleve.mjs <dossier-de-sortie> [--ouvre] [--valide]
//     --ouvre   ouvre tous les <details> avant la capture (variante « déplié »)
//     --valide  coche les cases du dernier retour et clique « J'ai tout lu » (ecrit)
// ============================================================================

import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SORTIE = process.argv[2]
if (!SORTIE) throw new Error('usage : capture-fragments-eleve.mjs <dossier> [--ouvre] [--valide]')
fs.mkdirSync(SORTIE, { recursive: true })
const OUVRE = process.argv.includes('--ouvre')
const VALIDE = process.argv.includes('--valide')
const EMAIL = 'test@test.com'
const INSC_TEST = '49084ce4-331d-48eb-9ba0-bb427dbe6696'
const BASE = 'http://localhost:3000'
const PORT = 9333
const PROFIL = `${SORTIE}/chrome-profil`
const LARGEURS = [1280, 768, 375]
const VUES = ['ecrit', 'oral', 'essai', 'synthese']

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

// Session élève par lien magique (consommé une fois).
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
if (error) throw new Error(error.message)
const next = encodeURIComponent(`/eleve/modules/fragments-erudition?inscription=${INSC_TEST}`)
const charge = cdp.attendChargement()
await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${next}` })
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
  await dors(1200)
}
async function capture(nom) {
  const { result } = await cdp.envoie('Runtime.evaluate', { expression: 'JSON.stringify({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight, cw: document.documentElement.clientWidth})', returnByValue: true })
  const dims = JSON.parse(result.value)
  const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: dims.cw, height: Math.min(dims.h, 6000), scale: 1 } })
  fs.writeFileSync(`${SORTIE}/${nom}.png`, Buffer.from(shot.data, 'base64'))
  console.log(`${nom}.png — page ${dims.cw}×${dims.h}${dims.w > dims.cw ? ` ⛔ DÉBORDE horizontalement (${dims.w})` : ''}`)
}

for (const largeur of LARGEURS) {
  await taille(largeur)
  for (const vue of VUES) {
    await va(`${BASE}/eleve/modules/fragments-erudition?vue=${vue}&inscription=${INSC_TEST}`)
    if (OUVRE) { await cdp.evalue(`document.querySelectorAll('details').forEach(d => d.open = true); 'ok'`); await dors(600) }
    await capture(`${vue}-${largeur}${OUVRE ? '-ouvert' : ''}`)
  }
}

if (VALIDE) {
  await taille(1280)
  await va(`${BASE}/eleve/modules/fragments-erudition?vue=ecrit&inscription=${INSC_TEST}`)
  const n = await cdp.evalue(`(() => { const cs = [...document.querySelectorAll('#retour input[type=checkbox]')]; cs.forEach(c => c.click()); return cs.length })()`)
  await dors(400)
  const clique = await cdp.evalue(`(() => { const b = [...document.querySelectorAll('#retour button')].find(b => /J’ai tout lu|J'ai tout lu|J’ai lu/.test(b.textContent)); if (!b || b.disabled) return 'bouton absent ou inactif'; b.click(); return 'cliqué' })()`)
  console.log(`validation : ${n} cases cochées, ${clique}`)
  await dors(3000)
  await capture('ecrit-1280-apres-validation')
  await taille(375)
  await va(`${BASE}/eleve/modules/fragments-erudition?vue=ecrit&inscription=${INSC_TEST}`)
  await capture('ecrit-375-apres-validation')
}

// La sonde qui tranche : chaque élément rogne-t-il ? (largeur voulue > largeur donnée)
await taille(375)
await va(`${BASE}/eleve/modules/fragments-erudition?vue=ecrit&inscription=${INSC_TEST}`)
const rognes = await cdp.evalue(`JSON.stringify([...document.querySelectorAll('main *')].filter(el => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).overflowX !== 'scroll' && !el.closest('.recharts-wrapper')).slice(0, 12).map(el => ({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 60), largeur: el.clientWidth, voulu: el.scrollWidth, texte: (el.textContent || '').trim().slice(0, 40) })))`)
console.log('éléments rognés à 375 px :', rognes)

ws.close()
chrome.kill()
