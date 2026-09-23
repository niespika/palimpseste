#!/usr/bin/env node
// ============================================================================
// recette-antichambre.mjs — l'antichambre et le lancement en deux temps, à
// l'écran, au bac à sable (retours de classe du 22/09/2026). DEUX sessions
// isolées dans un même Chrome sans fenêtre (`Target.createBrowserContext`) :
// le professeur et Élo. Figurants : trois présences écrites en base (service-role).
//
//   node scripts/recette/recette-antichambre.mjs <dossier> --quiz <uuid>
//
// ⛔ BAC À SABLE UNIQUEMENT. Le script ouvre la porte pour la recette et la
//    REFERME à la fin, puis relit sa valeur par requête.
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
if (!SORTIE || !QUIZ) throw new Error('usage : recette-antichambre.mjs <dossier> --quiz <uuid>')
fs.mkdirSync(SORTIE, { recursive: true })
const BASE = 'http://localhost:3000'
const PORT = 9335
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

// Un onglet par personne, chacun dans SON contexte (cookies séparés).
async function onglet() {
  const { browserContextId } = await navigateur.envoie('Target.createBrowserContext')
  const { targetId } = await navigateur.envoie('Target.createTarget', { url: 'about:blank', browserContextId })
  const cdp = await ouvrir(`ws://127.0.0.1:${PORT}/devtools/page/${targetId}`)
  await cdp.envoie('Page.enable'); await cdp.envoie('Runtime.enable')
  cdp.ecouteurs.push((m) => { if (m.method === 'Page.javascriptDialogOpening') cdp.envoie('Page.handleJavaScriptDialog', { accept: true }) })
  cdp.taille = (l) => cdp.envoie('Emulation.setDeviceMetricsOverride', { width: l, height: 900, deviceScaleFactor: 1, mobile: l < 768 })
  cdp.va = async (url) => { await cdp.envoie('Page.navigate', { url }); await dors(2500) }
  cdp.capture = async (nom) => {
    const d = JSON.parse(await cdp.evalue('JSON.stringify({h: document.documentElement.scrollHeight, w: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})'))
    const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: d.cw, height: Math.min(d.h, 4000), scale: 1 } })
    fs.writeFileSync(`${SORTIE}/${nom}.png`, Buffer.from(shot.data, 'base64'))
    console.log(`  ${nom}.png — ${d.cw}×${d.h}${d.w > d.cw ? ` ⛔ DÉBORDE (${d.w})` : ''}`)
  }
  cdp.texte = (sel = 'main') => cdp.evalue(`(document.querySelector('${sel}') || document.body).innerText.replace(/\\s+/g, ' ').slice(0, 400)`)
  cdp.clicTexte = (t) => cdp.evalue(`(() => { const b = [...document.querySelectorAll('button, a')].find(x => x.textContent.trim().startsWith(${JSON.stringify(t)})); if (!b) return false; b.click(); return true })()`)
  cdp.glisse = (i, v) => cdp.evalue(`(() => { const el = document.querySelectorAll('input[type=range]')[${i}]; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '${v}'); el.dispatchEvent(new Event('input', { bubbles: true })); return true })()`)
  return cdp
}
async function connecter(cdp, email, page) {
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) throw new Error(error.message)
  await cdp.va(`${BASE}/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(page)}`)
}
const porte = async () => lu('porte', await admin.from('scriptorium_params').select('quazian_antichambre_actif').eq('id', 1).single()).quazian_antichambre_actif

const prof = await onglet()
const elo = await onglet()
try {
  console.log('1. Professeur : ouvrir la porte depuis Quazian → Paramètres → Passation')
  await prof.taille(1280)
  await connecter(prof, 'louis.sagnieres@gmail.com', '/prof/quazian/parametres?vue=passation')
  console.log('   porte avant :', await porte())
  await prof.capture('01-prof-porte-fermee-1280')
  console.log('   clic « Ouvrir » :', await prof.clicTexte('Ouvrir')); await dors(2500)
  console.log('   porte après :', await porte(), '—', await prof.evalue(`document.querySelector('p.text-ok, p.text-retard')?.textContent ?? ''`))

  console.log('2. Professeur : la page de lancement propose « Ouvrir l’antichambre »')
  await prof.va(`${BASE}/prof/quazian/quizz/${QUIZ}/lancer`)
  await prof.capture('02-prof-avant-antichambre-1280')
  console.log('   clic :', await prof.clicTexte('Ouvrir l’antichambre')); await dors(3000)
  const q1 = lu('quiz', await admin.from('quazian_quizzes').select('statut, antichambre_at, lance_at, ferme_at').eq('id', QUIZ).single())
  console.log('   en base :', JSON.stringify(q1))

  console.log('3. Élo : la bannière du module, puis l’antichambre')
  await elo.taille(375)
  await connecter(elo, env.TEST_ELEVE_EMAIL, '/eleve/modules/quazian?vue=quizz')
  console.log('   module :', (await elo.texte()).slice(0, 160))
  await elo.capture('03-eleve-banniere-375')
  await elo.va(`${BASE}/eleve/modules/quazian/quizz/${QUIZ}`)
  await elo.capture('04-eleve-antichambre-375')
  console.log('   essai : 100 sur Sydney')
  await elo.glisse(0, 100); await dors(300)
  await elo.clicTexte('Voir ce que ça rapporterait'); await dors(400)
  console.log('   ', await elo.evalue(`document.querySelector('[role=status]')?.innerText.replace(/\\s+/g,' ') ?? '(rien)'`))
  await elo.capture('05-eleve-essai-sydney-375')
  await elo.clicTexte('Recommencer l’essai'); await dors(300)
  await elo.glisse(0, 30); await elo.glisse(1, 70); await dors(300)
  await elo.clicTexte('Voir ce que ça rapporterait'); await dors(400)
  console.log('   30 Sydney / 70 Canberra :', await elo.evalue(`document.querySelector('[role=status]')?.innerText.replace(/\\s+/g,' ') ?? '(rien)'`))
  await elo.capture('06-eleve-essai-nuance-375')
  await elo.taille(1280); await dors(300); await elo.capture('06b-eleve-antichambre-1280'); await elo.taille(375)

  console.log('4. Figurants : trois autres élèves de la classe arrivent')
  const { data: quiz } = await admin.from('quazian_quizzes').select('classe_id').eq('id', QUIZ).single()
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const eloId = users.find((u) => u.email === env.TEST_ELEVE_EMAIL)?.id
  const autres = lu('inscrits', await admin.from('inscriptions').select('eleve_id').eq('classe_id', quiz.classe_id).eq('statut', 'active'))
    .map((r) => r.eleve_id).filter((id) => id !== eloId).sort()
  lu('présences', await admin.from('quazian_antichambre').upsert(autres.slice(0, 3).map((id) => ({ quiz_id: QUIZ, eleve_id: id, vu_at: new Date().toISOString() })), { onConflict: 'quiz_id,eleve_id' }))
  // Un quatrième est « passé puis reparti » : vu il y a une minute.
  lu('présence ancienne', await admin.from('quazian_antichambre').upsert({ quiz_id: QUIZ, eleve_id: autres[3], vu_at: new Date(Date.now() - 60000).toISOString() }, { onConflict: 'quiz_id,eleve_id' }))
  await dors(4000)
  console.log('   prof voit :', await prof.evalue(`document.querySelector('p.text-3xl')?.innerText.replace(/\\s+/g,' ')`))
  await prof.capture('07-prof-antichambre-1280')
  await prof.taille(375); await dors(500); await prof.capture('07b-prof-antichambre-375'); await prof.taille(1280)

  console.log('5. Professeur : lancer. Élo doit passer toute seule à la première question.')
  const avant = await elo.evalue('location.href')
  console.log('   clic « Lancer » :', await prof.clicTexte('Lancer le quiz maintenant')); await dors(3000)
  const q2 = lu('quiz', await admin.from('quazian_quizzes').select('statut, lance_at, ferme_at, duree_min').eq('id', QUIZ).single())
  console.log('   en base :', JSON.stringify(q2), '— fenêtre', Math.round((Date.parse(q2.ferme_at) - Date.parse(q2.lance_at)) / 60000), 'min')
  await prof.capture('08-prof-apres-lancement-1280')
  let apres = avant
  for (let i = 0; i < 12 && apres === avant; i++) { await dors(1000); apres = await elo.evalue('location.href') }
  await dors(2500)
  console.log('   Élo :', avant.replace(BASE, ''), '→', apres.replace(BASE, ''))
  console.log('   à l’écran :', (await elo.texte('body')).match(/Question 1\/\d+/)?.[0] ?? '(pas de question)')
  await elo.capture('09-eleve-premiere-question-375')

  console.log('6. Un élève en retard (sans session) : les consignes d’abord')
  const retard = users.find((u) => u.id === autres[4])?.email
  if (retard) {
    const tard = await onglet()
    await tard.taille(375)
    await connecter(tard, retard, `/eleve/modules/quazian/quizz/${QUIZ}`)
    console.log('   voit :', (await tard.texte()).slice(0, 200))
    await tard.capture('10-eleve-en-retard-375')
  }
} finally {
  console.log('7. La porte se referme')
  lu('fermeture', await admin.from('scriptorium_params').update({ quazian_antichambre_actif: false }).eq('id', 1).select('id'))
  console.log('   porte relue :', await porte())
  chrome.kill()
  process.exit(0)
}
