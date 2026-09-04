// ============================================================================
// ÉPREUVE — le surlignage AU DOIGT : la sélection est-elle gardée quand on
// touche « Garde ce passage » ? (signalements élèves des 03 et 04/09/2026)
// ----------------------------------------------------------------------------
// Chrome sans fenêtre + CDP, émulation tactile. La sélection est posée comme
// après un appui long (Range), puis le bouton reçoit un TAP (touchStart/End) —
// c'est le geste réel d'un téléphone, et c'est lui qui vide la sélection avant
// le `click`. On lit ensuite le journal des poses en base : écrit, ou pas.
//   node scripts/recette/epreuve-surlignage-tactile.mjs <depotId> [--souris]
// ============================================================================
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
if (!/aoakpxxlyvthzueaywna/.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error('bac à sable seulement')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const DEPOT = process.argv[2]
if (!DEPOT) throw new Error('usage : epreuve-surlignage-tactile.mjs <depotId> [--souris]')
const SOURIS = process.argv.includes('--souris')
/** ⭐ iOS Safari : un tap hors de la sélection l'EFFACE avant tout `click` — on rejoue cet effacement. */
const IOS = process.argv.includes('--ios')
const BASE = 'http://localhost:3000'; const PORT = 9338
const S = process.env.SCRATCH ?? '/tmp'
const dors = (ms) => new Promise((r) => setTimeout(r, ms))
async function poses() {
  const { data } = await admin.from('exercices_metacognition').select('credence').eq('depot_id', DEPOT).maybeSingle()
  const cred = Array.isArray(data?.credence) ? data.credence : []
  return cred.flatMap((e) => (e && Array.isArray(e.poses)) ? e.poses.map((p) => ({ cas: e.cas, zone: p.zone, at: p.at })) : [])
}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${S}/chrome-profil-tactile`, '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.attentes = new Map(); this.ecouteurs = []
    ws.addEventListener('message', (m) => { const msg = JSON.parse(m.data)
      if (msg.id && this.attentes.has(msg.id)) { const { res, rej } = this.attentes.get(msg.id); this.attentes.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result) }
      else if (msg.method) for (const e of this.ecouteurs) e(msg) })
  }
  envoie(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.attentes.set(id, { res, rej })) }
  async evalue(expression) { const r = await this.envoie('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 300)); return r.result.value }
  attendChargement() { return new Promise((res) => { const e = (m) => { if (m.method === 'Page.loadEventFired') { this.ecouteurs = this.ecouteurs.filter((x) => x !== e); res() } }; this.ecouteurs.push(e) }) }
}
try {
  let t
  for (let i = 0; i < 50 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await dors(200) } }
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r))
  const cdp = new CDP(ws)
  await cdp.envoie('Page.enable')
  await cdp.envoie('Emulation.setDeviceMetricsOverride', { width: 375, height: 800, deviceScaleFactor: 2, mobile: true })
  await cdp.envoie('Emulation.setTouchEmulationEnabled', { enabled: !SOURIS, maxTouchPoints: 5 })
  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
  if (error) throw error
  const ch = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${lien.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex/exercice/${DEPOT}` })
  await ch; await dors(2500)
  console.log('page :', await cdp.evalue('location.pathname + " · " + document.title'))
  const avant = await poses(); console.log('poses en base AVANT :', avant.length)
  // Le matériau à désigner : le <p> cliquable du composant de désignation.
  const info = await cdp.evalue(`(() => {
    const p = document.querySelector('p.cursor-text'); if (!p) return { erreur: 'pas de <p> de désignation visible' }
    const b = [...document.querySelectorAll('button')].find((x) => /Garde ce passage/.test(x.textContent))
    if (!b) return { erreur: 'pas de bouton « Garde ce passage »' }
    p.scrollIntoView({ block: 'start' })
    const rp = p.getBoundingClientRect(), rb = b.getBoundingClientRect()
    return { texte: p.textContent.slice(0, 60), p: [rp.left, rp.top, rp.width, rp.height], bouton: [rb.left + rb.width / 2, rb.top + rb.height / 2], bas: rb.bottom, hauteur: innerHeight }
  })()`)
  console.log('matériau :', JSON.stringify(info))
  if (info.erreur) throw new Error(info.erreur)
  if (info.bas > info.hauteur) { await cdp.evalue(`window.scrollBy(0, ${info.bas - info.hauteur + 40}); true`); await dors(300) }
  // 1) LA SÉLECTION, comme après un appui long : le premier mot de plus de 4 lettres.
  const sel = await cdp.evalue(`(() => {
    const p = document.querySelector('p.cursor-text')
    const marche = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let n; let m = null
    while ((n = marche.nextNode())) { const r = /[A-Za-zÀ-ÿ]{5,}/.exec(n.textContent); if (r) { m = { n, i: r.index, l: r[0].length, mot: r[0] }; break } }
    if (!m) return { erreur: 'aucun mot' }
    const r = document.createRange(); r.setStart(m.n, m.i); r.setEnd(m.n, m.i + m.l)
    const s = getSelection(); s.removeAllRanges(); s.addRange(r)
    return { mot: m.mot, selection: s.toString(), collapsed: s.isCollapsed }
  })()`)
  console.log('sélection posée :', JSON.stringify(sel))
  await dors(400)
  if (IOS) {
    const eff = await cdp.evalue(`(() => { getSelection().removeAllRanges(); return getSelection().toString() })()`)
    console.log('iOS — sélection effacée par le système avant le clic :', JSON.stringify(eff)); await dors(300)
  }
  // 2) LE GESTE SUR LE BOUTON : un TAP au doigt, ou un clic à la souris.
  const b = await cdp.evalue(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /Garde ce passage/.test(x.textContent)); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] })()`)
  if (SOURIS) {
    await cdp.envoie('Input.dispatchMouseEvent', { type: 'mousePressed', x: b[0], y: b[1], button: 'left', clickCount: 1 })
    await cdp.envoie('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b[0], y: b[1], button: 'left', clickCount: 1 })
  } else {
    await cdp.envoie('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b[0], y: b[1] }] })
    await dors(80)
    await cdp.envoie('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  }
  await dors(2000)
  const apresEcran = await cdp.evalue(`(() => { const t = document.body.innerText; const m = t.match(/(Sélectionne d’abord[^\\n]*|La sélection doit rester[^\\n]*|passage surligné|rien de surligné pour l’instant|enregistrement…|Ta sélection[^\\n]*|prêt[^\\n]*)/g); return { selectionApres: getSelection().toString(), messages: m } })()`)
  console.log('après le geste — sélection native :', JSON.stringify(apresEcran.selectionApres), '| messages :', JSON.stringify(apresEcran.messages))
  const apres = await poses(); console.log('poses en base APRÈS :', apres.length, apres.length > avant.length ? '→ ÉCRITE ✓' : '→ RIEN N’EST ÉCRIT ✗')
  const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png' })
  fs.writeFileSync(`${S}/epreuve-tactile-${SOURIS ? 'souris' : 'doigt'}${IOS ? '-ios' : ''}.png`, Buffer.from(shot.data, 'base64'))
} finally { chrome.kill() }
