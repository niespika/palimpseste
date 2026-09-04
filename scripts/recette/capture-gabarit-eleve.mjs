// ============================================================================
// C7-L3 — LES CAPTURES de la console du gabarit, aux trois tailles, dans un
// Chrome sans fenêtre piloté par CDP (patron `capture-fragments-eleve.mjs`).
//   node scripts/recette/capture-gabarit-eleve.mjs <dossier> [cle]
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
if (!SORTIE) throw new Error('usage : capture-gabarit-eleve.mjs <dossier> [cle]')
fs.mkdirSync(SORTIE, { recursive: true })
const MARQUE = '2026-09-04T03:14:15.926Z'
const BASE = 'http://localhost:3000'
const PORT = 9337
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null }
const LARGEURS = (arg('--largeurs') ?? '1280,768,375').split(',').map(Number)
const SEULEMENT = arg('--seulement')
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
const u = users.find((x) => x.email === env.TEST_ELEVE_EMAIL)
const { data: depots } = await admin.from('exercices_depots')
  .select('id, exercices(id_import, cran, variante)').eq('eleve_id', u.id).eq('assigne_at', MARQUE)
const liste = (depots ?? []).map((d) => ({ id: d.id, nom: d.exercices.id_import.replace(/^ex-gab-/, '') }))
  .filter((d) => !SEULEMENT || d.nom.includes(SEULEMENT))
  .sort((a, b) => a.nom.localeCompare(b.nom))
console.log(liste.length, 'dépôt(s) à capturer')

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${SORTIE}/chrome-profil`, '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })
const dors = (ms) => new Promise((r) => setTimeout(r, ms))
async function cible() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' }); return await r.json() } catch { await dors(200) }
  }
  throw new Error('Chrome ne répond pas')
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.attentes = new Map(); this.ecouteurs = []
    ws.addEventListener('message', (m) => { const msg = JSON.parse(m.data)
      if (msg.id && this.attentes.has(msg.id)) { const { res, rej } = this.attentes.get(msg.id); this.attentes.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result) }
      else if (msg.method) for (const e of this.ecouteurs) e(msg) })
  }
  envoie(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.attentes.set(id, { res, rej })) }
  async evalue(expression) { const r = await this.envoie('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value }
  attendChargement() { return new Promise((res) => { const e = (m) => { if (m.method === 'Page.loadEventFired') { this.ecouteurs = this.ecouteurs.filter((x) => x !== e); res() } }; this.ecouteurs.push(e) }) }
}
try {
  const t = await cible()
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  const cdp = new CDP(ws)
  await cdp.envoie('Page.enable')
  // La session, par lien magique : une fois, puis les cookies tiennent.
  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
  if (error) throw error
  const premier = liste[0]
  const charge = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${lien.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex/exercice/${premier.id}` })
  await charge; await dors(2500)
  const titre0 = await cdp.evalue('document.title + " | " + location.pathname')
  console.log('session :', titre0)
  for (const d of liste) {
    for (const largeur of LARGEURS) {
      await cdp.envoie('Emulation.setDeviceMetricsOverride', { width: largeur, height: 900, deviceScaleFactor: 1, mobile: largeur < 768 })
      const ch = cdp.attendChargement()
      await cdp.envoie('Page.navigate', { url: `${BASE}/eleve/modules/codex/exercice/${d.id}` })
      await ch; await dors(2200)
      // Ouvrir l'exercice si le bouton d'ouverture est là (temps 0), puis attendre.
      await cdp.evalue(`(async () => { const b = [...document.querySelectorAll('button')].find(x => /commencer|ouvrir/i.test(x.textContent)); if (b) { b.click(); await new Promise(r => setTimeout(r, 1800)) } return true })()`)
      const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
      const nom = `${SORTIE}/${d.nom}-${largeur}.png`
      fs.writeFileSync(nom, Buffer.from(shot.data, 'base64'))
      const txt = await cdp.evalue(`(document.body.innerText || '').slice(0, 400).replace(/\\n+/g, ' ')`)
      console.log(`  ${d.nom} @${largeur} → ${nom} · ${txt.slice(0, 120)}`)
    }
  }
} finally { chrome.kill() }
