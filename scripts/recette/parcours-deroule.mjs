// ============================================================================
// LE PARCOURS D'UN DÉPÔT, MOMENT PAR MOMENT — captures aux trois tailles.
// ----------------------------------------------------------------------------
// Chrome sans fenêtre + CDP (patron `capture-gabarit-eleve.mjs`). Le script
// LIT l'écran et fait le geste qui s'impose : répartir les jetons, écrire puis
// « Enregistrer », déclarer sa chance, passer au second cas, faire les trois
// gestes de la remise, rendre, attendre le retour, tourner ses pages. À chaque
// changement d'état : une capture à 1280, une à 768 et une à 375.
//   node scripts/recette/parcours-deroule.mjs <depotId> <nom> <dossier> [--max N] [--port P]
// ⛔ Bac à sable seulement : la remise déclenche la chaîne (appels IA).
// ⚠️ Un lien magique en annule un autre : deux parcours ne se jouent PAS en
//    parallèle sur le même compte — en série, toujours.
// ⭐ 04/09 (soir) — « un écran, une tâche » : la colonne de droite tourne ses
//    pages (écrire → crédence → gestes → rendre → attente → retour point par
//    point). Sur téléphone (768 et 375), la capture montre le VOLET DU TRAVAIL
//    — la page courante —, sauf aux moments où le travail est de lire et de
//    surligner, où elle montre « Lire ».
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
const arg = (nom, defaut) => { const i = process.argv.indexOf(nom); return i > 0 ? Number(process.argv[i + 1]) : defaut }
const MAX = arg('--max', 40)
const PORT = arg('--port', 9339)
fs.mkdirSync(DOSSIER, { recursive: true })
const BASE = 'http://localhost:3000'
const TAILLES = [1280, 768, 375]
const dors = (ms) => new Promise((r) => setTimeout(r, ms))
const TEXTES = {
  1: 'Le passage en gras conclut alors que rien ne le justifie : « donc » relie deux idées sans que la raison du lien soit dite. Il manque la phrase qui explique pourquoi la distraction entraîne l’interdiction.',
  2: 'Ici encore, la conclusion arrive sans son appui : on affirme qu’il faut interdire, mais la raison qui fait passer du constat à la décision n’est pas écrite. Le lecteur doit la deviner.',
  vf: 'Le passage en gras conclut alors que rien ne le justifie. Le « donc » relie deux idées sans que la raison du lien soit dite : il manque la phrase qui explique pourquoi la distraction entraîne l’interdiction.\n\nC’est cette phrase, entre le constat et la décision, qui ferait de l’affirmation un argument.',
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
/** Sur téléphone, montrer le volet voulu : « Lire », ou le travail (la page courante). */
const montreLeVolet = (lire) => cdp.evalue(`(() => {
  const b = [...document.querySelectorAll('[role=group][aria-label] button')].filter((x) => x.offsetParent !== null)
  if (!b.length) return 'sans bascule'
  const ranges = [...document.querySelectorAll('input[type=range]')].length
  let cible
  if (${lire}) cible = b.find((x) => /^Lire|^Mon texte/.test(x.textContent.trim()))
  else if (ranges === 1 && b.some((x) => /^Crédence/.test(x.textContent.trim()))) cible = b.find((x) => /^Crédence/.test(x.textContent.trim()))
  else cible = b.find((x) => !/^Lire|^Mon texte/.test(x.textContent.trim()) && !/^Crédence/.test(x.textContent.trim()))
  if (!cible) return 'pas de cible'
  if (cible.getAttribute('aria-pressed') === 'true') return 'déjà'
  cible.click(); return 'basculé : ' + cible.textContent.trim()
})()`)
let n = 0
async function capture(etat, { lire = false } = {}) {
  n++
  for (const w of TAILLES) {
    await metrics(w); await dors(400)
    if (w < 1024) { await montreLeVolet(lire); await dors(450) }
    await cdp.evalue('window.scrollTo(0,0); true')
    const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    fs.writeFileSync(`${DOSSIER}/${NOM}-${String(n).padStart(2, '0')}-${etat}-${w}.png`, Buffer.from(shot.data, 'base64'))
  }
  await metrics(1280); await dors(300)
  console.log(`  [${n}] ${etat}`)
}
/** Ce que l'écran offre, lu dans le DOM. ⚠️ `innerText` rend les majuscules du CSS : regex insensibles à la casse. */
async function lire() {
  return cdp.evalue(`(() => {
    const t = document.body.innerText
    const boutons = [...document.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent !== null).map((b) => b.textContent.trim())
    const ta = [...document.querySelectorAll('textarea')].filter((x) => x.offsetParent !== null && !x.readOnly).map((x) => ({ rows: x.rows, vide: x.value.trim() === '' }))
    const ranges = [...document.querySelectorAll('input[type=range]')].filter((x) => x.offsetParent !== null).length
    const geste = /Ta thèse en une phrase/i.test(t) ? 'restitution' : /degré de confiance/i.test(t) ? 'confiance' : /Dans quelles conditions as-tu travaillé/i.test(t) ? 'conditions' : null
    return { boutons, textareas: ta, ranges, geste,
      enregistrer: boutons.includes('Enregistrer'),
      rendre: boutons.find((b) => /^Rendre/.test(b)) ?? null,
      suivant: boutons.find((b) => /^(Point suivant|Pour finir)/.test(b)) ?? null,
      lu: boutons.find((b) => /^J’ai lu mon retour/.test(b)) ?? null,
      reprendre: boutons.find((b) => /^Reprendre mon texte/.test(b)) ?? null,
      versionFinale: /version finale/i.test(t),
      preparation: /retour est en préparation/i.test(t),
      // ⚠️ Pas /Ton retour/ : la page de remise dit « ton retour se préparera ». Les titres des écrans de retour, eux, sont sûrs.
      retour: /Ce qui a bougé|Retour à mes exercices|Ce que tu as écrit|point \d+ sur \d+|pour finir/i.test(t) && !/retour est en préparation/i.test(t),
      fini: /Cet exercice est terminé|Cet exercice ne compte pas/i.test(t),
      surlignable: !!document.querySelector('p.cursor-text'), rienSurligne: /rien de surligné pour l’instant/i.test(t),
      pasEncoreOuvert: /pas encore ouvert/i.test(t), texte: t.slice(0, 200) }
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
/** Attendre qu'une lecture change de forme, ~14 s au plus. */
async function attendQue(pred, fois = 20) { for (let k = 0; k < fois; k++) { await dors(700); const e = await lire(); if (pred(e)) return e } return lire() }
/** Tourner les pages du retour et les capturer, jusqu'à « pour finir ». */
async function pagesDuRetour(prefixe) {
  let p = 1
  await capture(`${prefixe}-point-${p}`)
  for (let k = 0; k < 12; k++) {
    // ⭐ 05/09 — la case « J'ai lu ce point » ouvre « Point suivant » : on la coche AVANT de lire les boutons.
    await cdp.evalue(`(() => { const c = [...document.querySelectorAll('input[type=checkbox]')].find((x) => x.offsetParent !== null && !x.checked); if (c) c.click(); return !!c })()`)
    await dors(300)
    const e = await lire()
    if (!e.suivant) break
    const fin = /^Pour finir/.test(e.suivant)
    await clique(e.suivant); await dors(500); p++
    await capture(fin ? `${prefixe}-fin` : `${prefixe}-point-${p}`)
    if (fin) break
  }
}
try {
  let t
  for (let i = 0; i < 50 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await dors(200) } }
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r))
  cdp = new CDP(ws); await cdp.envoie('Page.enable'); await metrics(1280)
  // ⭐⭐ 07/09/2026 — FRANCHIR LA PAGE DES TRAVAUX, quand il y en a une.
  //    `proxy.ts` peut porter `TRAVAUX = true` : toute page humaine est alors
  //    réécrite vers `/travaux`, et le parcours ne verrait qu'elle. Le profil
  //    Chrome est NEUF à chaque run (`--user-data-dir`), donc aucun cookie de
  //    laissez-passer n'y survit : il faut le poser ici, avant le lien magique.
  // ⚠️ Sans `TRAVAUX_LAISSEZ_PASSER` dans l'environnement, on ne fait RIEN —
  //    c'est le cas normal, site ouvert. Le dépôt étant PUBLIC, il n'y a pas de
  //    valeur par défaut : sans la variable, il n'existe pas de laissez-passer.
  if (env.TRAVAUX_LAISSEZ_PASSER) {
    const chT = cdp.attendChargement()
    await cdp.envoie('Page.navigate', { url: `${BASE}/?atelier=${encodeURIComponent(env.TRAVAUX_LAISSEZ_PASSER)}` })
    await chT; await dors(400)
    console.log(NOM, '· laissez-passer des travaux posé')
  }
  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
  if (error) throw error
  const ch = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${lien.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex/exercice/${DEPOT}` })
  await ch; await dors(2500)
  console.log(NOM, '→', await cdp.evalue('location.pathname'))
  let etat = await lire()
  let cas = 1
  await capture(etat.surlignable ? 'cas1-a-surligner' : (etat.ranges >= 4 ? 'cas1-repondre' : 'cas1-ecrire'), { lire: etat.surlignable })
  for (let pas = 0; pas < MAX; pas++) {
    etat = await lire()
    if (etat.pasEncoreOuvert) { console.log('  porte fermée'); break }
    if (etat.fini) { await capture('fini'); break }
    if (etat.retour && !etat.rendre) {
      await pagesDuRetour('retour')
      // Au régime plein : valider la lecture, reprendre, écrire la version finale, la rendre, lire le retour final.
      const e = await lire()
      if (!(e.lu && e.versionFinale)) break
      await clique(e.lu); await attendQue((x) => !x.lu); await capture('retour-lu')
      const e2 = await lire()
      if (!e2.reprendre) break
      await clique(e2.reprendre); await dors(600); await capture('vf-ecrire')
      const i = (await lire()).textareas.findIndex((x) => x.rows >= 9)
      if (i < 0) break
      await cdp.evalue(`(() => { const x = [...document.querySelectorAll('textarea')].filter((x) => x.offsetParent !== null && !x.readOnly)[${i}]; x.focus(); x.select(); return true })()`)
      await cdp.envoie('Input.insertText', { text: TEXTES.vf }); await dors(300)
      await capture('vf-ecrit'); await clique('Enregistrer'); await dors(600); await capture('vf-rendre')
      const r = (await lire()).rendre; if (!r) break
      await clique(r); await attendQue((x) => x.preparation || x.retour, 60); await capture('vf-rendue')
      let fini = false
      for (let k = 0; k < 40 && !fini; k++) { await dors(5000); const e3 = await lire(); if (e3.retour && !e3.preparation) fini = true }
      if (fini) await pagesDuRetour('retour-final'); else await capture('vf-attente')
      break
    }
    if (etat.preparation) {
      console.log('  … retour en préparation, on attend')
      let fini = false
      for (let k = 0; k < 40 && !fini; k++) { await dors(5000); const e2 = await lire(); if (e2.retour || e2.fini) fini = true }
      if (!fini) { await capture('attente'); break }
      continue
    }
    // 1. surligner d'abord, si le texte s'y prête et que rien n'est encore posé
    if (etat.surlignable && etat.rienSurligne) {
      await cdp.evalue(`(() => { const p = document.querySelector('p.cursor-text'); const m = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let nd, x = null; while ((nd = m.nextNode())) { const r = /[A-Za-zÀ-ÿ]{5,}[^.]{0,40}\\./.exec(nd.textContent); if (r) { x = { nd, i: r.index, l: r[0].length }; break } } if (!x) return false; const r = document.createRange(); r.setStart(x.nd, x.i); r.setEnd(x.nd, x.i + x.l); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true })()`)
      await dors(400); await clique('Garde ce passage'); await dors(1500)
      await capture(`cas${cas}-surligne`, { lire: true }); continue
    }
    // 2. quatre candidats : cent jetons sur le second
    if (etat.ranges >= 4) {
      await posePlage(1, 100); await dors(300); await clique('Enregistrer ma réponse')
      await attendQue((e2) => e2.ranges === 0 || e2.retour)
      await capture(cas === 1 && (await lire()).boutons.some((b) => b.startsWith('Passer au second cas')) ? 'correction-du-premier-cas' : `cas${cas}-repondu`); continue
    }
    // 3. un champ vide : on écrit, on capture le texte écrit, puis « Enregistrer » tourne la page
    if (etat.textareas.some((x) => x.rows >= 9 && x.vide)) {
      const idx = etat.textareas.findIndex((x) => x.rows >= 9 && x.vide)
      await tape(idx, TEXTES[cas] ?? TEXTES[1]); await dors(400)
      await capture(`cas${cas}-ecrit`)
      await clique('Enregistrer'); await attendQue((e2) => !e2.textareas.some((x) => x.rows >= 9))
      const e2 = await lire()
      await capture(e2.ranges === 1 ? `cas${cas}-credence` : e2.geste ? `remise-${e2.geste}` : e2.rendre ? 'rendre' : `cas${cas}-enregistre`)
      continue
    }
    // 3 bis. un champ déjà écrit (rechargement) : « Enregistrer » tourne la page
    if (etat.textareas.some((x) => x.rows >= 9) && etat.enregistrer) {
      await clique('Enregistrer'); await attendQue((e2) => !e2.textareas.some((x) => x.rows >= 9)); continue
    }
    // 4. la chance d'avoir juste (un seul curseur) puis « Enregistrer »
    if (etat.ranges === 1) {
      await posePlage(0, 70); await dors(300); await clique('Enregistrer')
      await attendQue((e2) => e2.ranges === 0)
      await capture(cas === 1 && (await lire()).boutons.some((b) => b.startsWith('Passer au second cas')) ? 'correction-du-premier-cas' : `cas${cas}-credence-donnee`); continue
    }
    // 5. la correction du premier cas → le second
    if (etat.boutons.some((b) => b.startsWith('Passer au second cas'))) {
      await clique('Passer au second cas'); await dors(800); cas = 2
      const e2 = await lire()
      await capture('cas2-ouvert', { lire: e2.surlignable && e2.rienSurligne }); continue
    }
    // 6. les trois gestes de la remise, un par page
    if (etat.geste) {
      const geste = etat.geste
      if (geste === 'confiance') await cdp.evalue(`(() => { for (const f of document.querySelectorAll('fieldset')) { const b = f.querySelector('button'); if (b) b.click() } return true })()`)
      else if (geste === 'conditions') await cdp.evalue(`(() => { const b = [...document.querySelectorAll('button[aria-pressed]')].find((x) => x.offsetParent !== null && /temps|vite|pu/.test(x.textContent)); if (b) b.click(); return true })()`)
      else { const i = (await lire()).textareas.findIndex((x) => x.rows < 9); await tape(i < 0 ? 0 : i, 'Le lien entre le constat et la décision manquait dans les deux cas.') }
      await dors(300); await clique('Continuer')
      const e2 = await attendQue((x) => x.geste !== geste)
      await capture(e2.geste ? `remise-${e2.geste}` : e2.rendre ? 'rendre' : `remise-apres-${geste}`); continue
    }
    // 7. rendre
    if (etat.rendre) {
      await clique(etat.rendre)
      await attendQue((e2) => e2.preparation || e2.retour || e2.fini, 60)
      await capture('rendu'); continue
    }
    console.log('  rien à faire :', JSON.stringify(etat.boutons), etat.texte.slice(0, 80)); break
  }
} finally { chrome.kill() }
