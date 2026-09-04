// ============================================================================
// LE PARCOURS D'UN DÉPÔT, MOMENT PAR MOMENT — captures aux deux tailles.
// ----------------------------------------------------------------------------
// Chrome sans fenêtre + CDP (patron `capture-gabarit-eleve.mjs`). Le script
// LIT l'écran et fait le geste qui s'impose : répartir les jetons, écrire,
// déclarer sa chance, passer au second cas, faire les trois gestes de la
// remise, rendre, attendre le retour. À chaque changement d'état : une capture
// à 1280 et une à 375.
//   node scripts/recette/parcours-deroule.mjs <depotId> <nom> <dossier> [--max N]
// ⛔ Bac à sable seulement : la remise déclenche la chaîne (appels IA).
// ============================================================================
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
if (!/aoakpxxlyvthzueaywna/.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error('bac à sable seulement')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const [DEPOT, NOM, DOSSIER] = process.argv.slice(2)
if (!DEPOT || !NOM || !DOSSIER) throw new Error('usage : parcours-deroule.mjs <depotId> <nom> <dossier>')
const MAX = Number(process.argv[process.argv.indexOf('--max') + 1]) || 24
fs.mkdirSync(DOSSIER, { recursive: true })
const BASE = 'http://localhost:3000'; const PORT = 9339
const dors = (ms) => new Promise((r) => setTimeout(r, ms))
const TEXTES = {
  1: 'Le passage en gras conclut alors que rien ne le justifie : « donc » relie deux idées sans que la raison du lien soit dite. Il manque la phrase qui explique pourquoi la distraction entraîne l’interdiction.',
  2: 'Ici encore, la conclusion arrive sans son appui : on affirme qu’il faut interdire, mais la raison qui fait passer du constat à la décision n’est pas écrite. Le lecteur doit la deviner.',
}
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${DOSSIER}/chrome-profil`, '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.attentes = new Map(); this.ecouteurs = []
    ws.addEventListener('message', (m) => { const msg = JSON.parse(m.data)
      if (msg.id && this.attentes.has(msg.id)) { const { res, rej } = this.attentes.get(msg.id); this.attentes.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result) }
      else if (msg.method) for (const e of this.ecouteurs) e(msg) })
  }
  envoie(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.attentes.set(id, { res, rej })) }
  async evalue(expression) { const r = await this.envoie('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400)); return r.result.value }
  attendChargement() { return new Promise((res) => { const e = (m) => { if (m.method === 'Page.loadEventFired') { this.ecouteurs = this.ecouteurs.filter((x) => x !== e); res() } }; this.ecouteurs.push(e) }) }
}
let cdp
const metrics = (w) => cdp.envoie('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 })
let n = 0
async function capture(etat) {
  n++
  for (const w of [1280, 375]) {
    await metrics(w); await dors(500)
    await cdp.evalue('window.scrollTo(0,0); true')
    const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    fs.writeFileSync(`${DOSSIER}/${NOM}-${String(n).padStart(2, '0')}-${etat}-${w}.png`, Buffer.from(shot.data, 'base64'))
  }
  await metrics(1280); await dors(300)
  console.log(`  [${n}] ${etat}`)
}
/** Ce que l'écran offre, lu dans le DOM. */
async function lire() {
  return cdp.evalue(`(() => {
    const t = document.body.innerText
    const boutons = [...document.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent !== null).map((b) => b.textContent.trim())
    const ta = [...document.querySelectorAll('textarea')].filter((x) => x.offsetParent !== null && !x.readOnly).map((x) => ({ rows: x.rows, vide: x.value.trim() === '' }))
    const ranges = [...document.querySelectorAll('input[type=range]')].filter((x) => x.offsetParent !== null).length
    const geste = /Ta thèse en une phrase/.test(t) ? 'restitution' : /Comment te sens-tu/.test(t) ? 'confiance' : /Dans quelles conditions as-tu travaillé/.test(t) ? 'conditions' : null
    const gestesFaits = /Tu as fait les trois gestes/.test(t)
    return { boutons, textareas: ta, ranges, geste, gestesFaits, preparation: /retour est en préparation/.test(t), retour: /Ton retour|Ce qui a bougé|Retour à mes exercices|Ce que tu as écrit/i.test(t) && !/retour est en préparation/i.test(t), surlignable: !!document.querySelector('p.cursor-text'), rienSurligne: /rien de surligné pour l’instant/.test(t), pasEncoreOuvert: /pas encore ouvert/.test(t), texte: t.slice(0, 200) }
  })()`)
}
const clique = (texte) => cdp.evalue(`(() => { const b = [...document.querySelectorAll('button')].find((x) => !x.disabled && x.offsetParent !== null && x.textContent.trim().startsWith(${JSON.stringify(texte)})); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
const posePlage = (i, v) => cdp.evalue(`(() => { const r = [...document.querySelectorAll('input[type=range]')].filter((x) => x.offsetParent !== null)[${i}]; if (!r) return false; const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(r, '${v}'); r.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
async function tape(selecteurIndex, texte) {
  const ok = await cdp.evalue(`(() => { const x = [...document.querySelectorAll('textarea')].filter((x) => x.offsetParent !== null && !x.readOnly)[${selecteurIndex}]; if (!x) return false; x.scrollIntoView({ block: 'center' }); x.focus(); return true })()`)
  if (!ok) return false
  await cdp.envoie('Input.insertText', { text: texte })
  return true
}
try {
  let t
  for (let i = 0; i < 50 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await dors(200) } }
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r))
  cdp = new CDP(ws); await cdp.envoie('Page.enable'); await metrics(1280)
  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
  if (error) throw error
  const ch = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${lien.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex/exercice/${DEPOT}` })
  await ch; await dors(2500)
  console.log(NOM, '→', await cdp.evalue('location.pathname'))
  let etat = await lire()
  let cas = 1
  await capture(etat.surlignable ? 'cas1-a-surligner' : (etat.ranges >= 4 ? 'cas1-repondre' : 'cas1-ecrire'))
  for (let pas = 0; pas < MAX; pas++) {
    etat = await lire()
    if (etat.pasEncoreOuvert) { console.log('  porte fermée'); break }
    if (etat.retour) { await capture('retour'); break }
    if (etat.preparation) {
      console.log('  … retour en préparation, on attend')
      let fini = false
      for (let k = 0; k < 40 && !fini; k++) { await dors(5000); const e2 = await lire(); if (e2.retour) fini = true }
      await capture(fini ? 'retour' : 'attente'); break
    }
    // 1. surligner d'abord, si le texte s'y prête et que rien n'est encore posé
    if (etat.surlignable && etat.rienSurligne) {
      await cdp.evalue(`(() => { const p = document.querySelector('p.cursor-text'); const m = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let nd, x = null; while ((nd = m.nextNode())) { const r = /[A-Za-zÀ-ÿ]{5,}[^.]{0,40}\\./.exec(nd.textContent); if (r) { x = { nd, i: r.index, l: r[0].length }; break } } if (!x) return false; const r = document.createRange(); r.setStart(x.nd, x.i); r.setEnd(x.nd, x.i + x.l); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true })()`)
      await dors(400); await clique('Garde ce passage'); await dors(1500)
      await capture(`cas${cas}-surligne`); continue
    }
    // 2. quatre candidats : cent jetons sur le second
    if (etat.ranges >= 4) {
      await posePlage(1, 100); await dors(300); await clique('Enregistrer ma réponse')
      for (let k = 0; k < 20; k++) { await dors(700); const e2 = await lire(); if (e2.ranges === 0 || e2.retour) break }
      await capture(cas === 1 && (await lire()).boutons.some((b) => b.startsWith('Passer au second cas')) ? 'correction-du-premier-cas' : `cas${cas}-repondu`); continue
    }
    // 3. un champ vide : on écrit, puis on attend l'enregistrement automatique
    if (etat.textareas.some((x) => x.rows >= 9 && x.vide)) {
      const idx = etat.textareas.findIndex((x) => x.rows >= 9 && x.vide)
      await tape(idx, TEXTES[cas] ?? TEXTES[1]); await dors(16500)
      await capture(`cas${cas}-ecrit`); continue
    }
    // 4. la chance d'avoir juste (un seul curseur) puis « Enregistrer »
    if (etat.ranges === 1) {
      await posePlage(0, 70); await dors(300); await clique('Enregistrer')
      for (let k = 0; k < 20; k++) { await dors(700); const e2 = await lire(); if (e2.ranges === 0) break }
      await capture(cas === 1 && (await lire()).boutons.some((b) => b.startsWith('Passer au second cas')) ? 'correction-du-premier-cas' : `cas${cas}-credence-donnee`); continue
    }
    // 5. la correction du premier cas → le second
    if (etat.boutons.some((b) => b.startsWith('Passer au second cas'))) {
      await clique('Passer au second cas'); await dors(800); cas = 2
      await capture('cas2-ouvert'); continue
    }
    // 6. les trois gestes de la remise
    if (etat.geste) {
      const geste = etat.geste
      if (geste === 'confiance') await cdp.evalue(`(() => { for (const f of document.querySelectorAll('fieldset')) { const b = f.querySelector('button'); if (b) b.click() } return true })()`)
      else if (geste === 'conditions') await cdp.evalue(`(() => { const b = [...document.querySelectorAll('button[aria-pressed]')].find((x) => x.offsetParent !== null); if (b) b.click(); return true })()`)
      else { const i = (await lire()).textareas.findIndex((x) => x.rows < 9); await tape(i < 0 ? 0 : i, 'Le lien entre le constat et la décision manquait dans les deux cas.') }
      await dors(300); await clique('Continuer')
      for (let k = 0; k < 20; k++) { await dors(700); const e2 = await lire(); if (e2.geste !== geste) break }
      await capture(`remise-apres-${geste}`); continue
    }
    // 7. rendre
    const rendre = etat.boutons.find((b) => b.startsWith('Rendre'))
    if (rendre && (etat.gestesFaits || !/Avant de rendre/.test(await cdp.evalue('document.body.innerText')))) {
      await clique(rendre)
      for (let k = 0; k < 20; k++) { await dors(700); const e2 = await lire(); if (e2.preparation || e2.retour) break }
      await capture('rendu'); continue
    }
    console.log('  rien à faire :', JSON.stringify(etat.boutons), etat.texte.slice(0, 80)); break
  }
} finally { chrome.kill() }
