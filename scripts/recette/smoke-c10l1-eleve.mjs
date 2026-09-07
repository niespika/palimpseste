// ============================================================================
// SMOKE ÉLÈVE C10 · L1 — LA SEMAINE COMPTÉE SE FERME, VUE DEPUIS UNE VRAIE
//                        SESSION D'ÉLÈVE, aux trois largeurs.
// ----------------------------------------------------------------------------
// ⭐⭐⭐ POURQUOI CE SCRIPT EXISTE, ET POURQUOI LA COUTURE NE SUFFIT PAS.
//    `assiduite_hebdo` n'a **aucune policy élève** — une seule policy, `prof`.
//    Lue depuis un client à session ÉLÈVE, elle rend **zéro ligne, SANS erreur** :
//    la fermeture ne se déclencherait jamais, pour personne, pour toujours, avec
//    `tsc` vert, 2500 tests verts et un écran parfaitement normal.
//    ⛔ `couture-c10l1.mjs` NE PEUT PAS voir ce défaut : il a la clé de service
//    en poche. **Seul ce chemin-ci le prouve** — un lien magique, une vraie
//    session, la page réelle.
//
// ⛔ PAR CDP, ET PAS AUTREMENT. `chrome --headless --window-size=375` NE FAIT PAS
//    un écran de 375 px (Chrome impose une largeur minimale et recadre) : il faut
//    `Emulation.setDeviceMetricsOverride`. Et le débordement horizontal se MESURE
//    (`document.scrollWidth` contre `window.innerWidth`), il ne se regarde pas.
//
// ⚠️ LECTURE SEULE. Le décor est celui de `couture-c10l1.mjs --essai --eleve
//    <email> --garde-le-decor` ; ce script n'écrit rien (sauf ce que Supabase
//    Auth écrit en mintant le lien).
//
// Usage :
//   node scripts/recette/couture-c10l1.mjs --essai --eleve test@test.com --garde-le-decor
//   node scripts/recette/smoke-c10l1-eleve.mjs <dossier> [--largeurs 1280,768,375]
//   node scripts/recette/couture-c10l1.mjs --retire
// ============================================================================

import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SORTIE = process.argv[2]
if (!SORTIE) throw new Error('usage : smoke-c10l1-eleve.mjs <dossier> [--largeurs …]')
fs.mkdirSync(SORTIE, { recursive: true })
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null }
const LARGEURS = (arg('--largeurs') ?? '1280,768,375').split(',').map(Number)
const BASE = 'http://localhost:3000'
const PORT = 9412
const REGISTRE = 'scripts/recette/.couture-c10l1.json'

if (!fs.existsSync(REGISTRE)) {
  throw new Error('aucun décor : jouer d’abord `couture-c10l1.mjs --essai --eleve '
    + `${env.TEST_ELEVE_EMAIL} --garde-le-decor\`.`)
}
const registre = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))

// ── Ce que le décor a semé, relu EN BASE : on ne devine aucun identifiant ────
const { data: semes, error: eD } = await admin.from('exercices_depots')
  .select('id, statut, origine, routeur_decision_id, assigne_at, texte_v1, '
    + 'exercices(consigne_instanciee)')
  .in('id', registre.depots).eq('eleve_id', registre.eleveId)
if (eD) throw new Error(eD.message)
const nomDe = (d) => (d.exercices?.consigne_instanciee?.recette ?? '')
  .replace(/^COUTURE-C10L1 — /, '').split(' :')[0].trim() || d.id.slice(0, 8)

/** Les écrans à montrer, dans l'ordre où l'on veut les lire. */
const ECRANS = [
  ...semes.map((d) => ({ nom: `deroule-${nomDe(d)}`, url: `/eleve/modules/codex/exercice/${d.id}`,
    dit: `${d.statut} · ${d.origine}` })),
  { nom: 'liste-codex', url: '/eleve/modules/codex', dit: 'la liste — « fermé », sans bouton' },
  { nom: 'ma-semaine-precedente', url: '/eleve/semaine?cycle=2026-08-31',
    dit: 'la semaine comptée : les fermés, la frise, le bilan' },
  { nom: 'ma-semaine-bilan', url: '/eleve/semaine?cycle=2026-08-31&vue=bilan',
    dit: 'le bilan de la semaine comptée' },
  { nom: 'ma-semaine-en-cours', url: '/eleve/semaine',
    dit: '⛔ la semaine EN COURS : rien ne doit y être fermé' },
]
console.log(`${semes.length} dépôt(s) semé(s) · ${ECRANS.length} écran(s) × ${LARGEURS.length} largeurs`)

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SORTIE}/chrome-profil`, '--hide-scrollbars', 'about:blank',
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
  constructor(ws) {
    this.ws = ws; this.id = 0; this.attentes = new Map(); this.ecouteurs = []
    ws.addEventListener('message', (m) => {
      const msg = JSON.parse(m.data)
      if (msg.id && this.attentes.has(msg.id)) {
        const { res, rej } = this.attentes.get(msg.id); this.attentes.delete(msg.id)
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result)
      } else if (msg.method) for (const e of this.ecouteurs) e(msg)
    })
  }
  envoie(method, params = {}) {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((res, rej) => this.attentes.set(id, { res, rej }))
  }
  async evalue(expression) {
    const r = await this.envoie('Runtime.evaluate',
      { expression, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
    return r.result.value
  }
  attendChargement() {
    return new Promise((res) => {
      const e = (m) => {
        if (m.method === 'Page.loadEventFired') {
          this.ecouteurs = this.ecouteurs.filter((x) => x !== e); res()
        }
      }
      this.ecouteurs.push(e)
    })
  }
}

const MESSAGE = 'Il n’est plus possible de travailler sur les exercices de cette semaine.'
/** Ce qui ne doit JAMAIS apparaître dans une page fermée — la marque du décor suffit. */
let ok = 0, ko = 0
const dire = (v, quoi, det = '') => {
  if (v) { ok++; console.log(`  ✅ ${quoi}`) } else { ko++; console.log(`  ❌ ${quoi}`) }
  if (det) console.log(`     ${det}`)
}

try {
  const t = await cible()
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  const cdp = new CDP(ws)
  await cdp.envoie('Page.enable')

  // ── LA SESSION, par lien magique : une fois, puis les cookies tiennent ────
  const { data: lien, error } = await admin.auth.admin
    .generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
  if (error) throw error
  let ch = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=`
    + `${lien.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex` })
  await ch; await dors(3000)
  const ou = await cdp.evalue('location.pathname')
  console.log(`\nsession ouverte — ${ou}`)
  if (ou.includes('/login') || ou === '/') {
    throw new Error(`la session ne s’est pas ouverte (${ou}) : lien consommé ou serveur absent ?`)
  }

  // ⭐⭐ LA PREUVE QUI COMPTE — depuis cette VRAIE session élève, la fermeture
  //    se voit-elle ? Si `assiduite_hebdo` était lue avec le mauvais client,
  //    tout serait normal ici, et tout serait faux.
  console.log('\n════ LA PREUVE DU CLIENT (piège 8) ════')
  const unFerme = semes.find((d) => d.routeur_decision_id && d.statut === 'assigne'
    && d.assigne_at.startsWith('2026-08-31'))
  ch = cdp.attendChargement()
  await cdp.envoie('Emulation.setDeviceMetricsOverride',
    { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await cdp.envoie('Page.navigate', { url: `${BASE}/eleve/modules/codex/exercice/${unFerme.id}` })
  await ch; await dors(2500)
  const texte = await cdp.evalue('document.body.innerText')
  dire(texte.includes(MESSAGE),
    '⭐⭐ DEPUIS UNE VRAIE SESSION ÉLÈVE, L’EXERCICE FERMÉ DIT LE MESSAGE DE LOUIS',
    texte.includes(MESSAGE)
      ? 'la lecture d’`assiduite_hebdo` passe bien en service-role depuis le chemin élève'
      : '⛔⛔ LE DÉFAUT LE PLUS CHER DU LOT : la table n’a aucune policy élève, elle rend zéro '
        + 'ligne SANS erreur, et rien ne se ferme — en silence.')
  dire(!/Semaine terminée[\s\S]*Commencer|Reprendre mon texte|Remettre/i.test(texte)
    || !texte.includes(MESSAGE),
    'aucun bouton de travail ne subsiste sur l’écran fermé')

  // ── LES ÉCRANS, AUX TROIS LARGEURS ───────────────────────────────────────
  console.log('\n════ LES ÉCRANS, AUX TROIS LARGEURS ════')
  for (const e of ECRANS) {
    for (const largeur of LARGEURS) {
      await cdp.envoie('Emulation.setDeviceMetricsOverride',
        { width: largeur, height: 900, deviceScaleFactor: 1, mobile: largeur < 768,
          screenWidth: largeur, screenHeight: 900 })
      const c = cdp.attendChargement()
      await cdp.envoie('Page.navigate', { url: BASE + e.url })
      await c
      // ⛔ PAS UN DÉLAI FIXE. En `next dev`, la PREMIÈRE visite d'une route la
      //    compile : 2,4 s suffisent parfois et jamais la première fois, et la
      //    capture montre alors « chargement » — un smoke qui photographie une
      //    plume d'attente ne prouve rien. On attend que le Suspense ait rendu.
      for (let i = 0; i < 40; i++) {
        const t = await cdp.evalue('(document.body.innerText || "")')
        if (t.length > 200 && !/chargement/i.test(t)) break
        await dors(500)
      }
      await dors(400)
      const m = JSON.parse(await cdp.evalue(
        'JSON.stringify({ interne: window.innerWidth, doc: document.documentElement.scrollWidth,'
        + ' hauteur: document.documentElement.scrollHeight,'
        + ' txt: (document.body.innerText || "").replace(/\\n+/g, " · ").slice(0, 260) })'))
      const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png',
        clip: { x: 0, y: 0, width: largeur, height: Math.min(m.hauteur, 3000), scale: 1 },
        captureBeyondViewport: true })
      const nom = `${SORTIE}/${e.nom}-${largeur}.png`
      fs.writeFileSync(nom, Buffer.from(shot.data, 'base64'))
      const deborde = m.doc > m.interne
      if (deborde) ko++; else ok++
      console.log(`  ${deborde ? '❌' : '✅'} ${e.nom.padEnd(28)} @${String(largeur).padStart(4)} `
        + `— doc ${m.doc} / écran ${m.interne}`
        + `${deborde ? ` ⛔ DÉBORDE de ${m.doc - m.interne} px` : ''} → ${nom}`)
      if (largeur === LARGEURS[0]) console.log(`     ${m.txt}`)
    }
  }
  console.log(`\n════ ${ok} contrôle(s) tenu(s), ${ko} en échec ════`)
} finally {
  chrome.kill(); await dors(400)
}
if (ko > 0) process.exit(1)
