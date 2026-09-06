// ============================================================================
// SMOKE DU CRAN 2 — « voici les pièces » (C7, 06/09) : un dépôt de décor sur un
// exercice de `gabarit-c2.json`, la remise d'une pièce, le verdict du juge lu
// sur `verdicts_cran`, le retour qui ne nomme que l'observable du constituant,
// l'étalon après la vf — et les captures aux trois tailles, par CDP.
// ----------------------------------------------------------------------------
//   node scripts/recette/smoke-cran2.mjs <cle> <dossier> [--retire] [--sans-parcours] [--port P]
//   ex. : node scripts/recette/smoke-cran2.mjs argument.garant.connecteur /tmp/smoke-c2
// ⛔ Bac à sable seulement : la remise déclenche la chaîne (appels IA).
// ⚠️ Prérequis MESURÉS, pas supposés : `gabarit_actif` ON (les pièces ne se
//    servent pas sans) et `juge_documents_actif` ON (sans lui, ni verdict ni
//    borne du retour — mesuré à OFF en bac à sable le 06/09). Le script les lit
//    et s'arrête s'ils manquent : il ne les allume pas.
// ⚠️ Un lien magique en annule un autre : jamais deux parcours en parallèle.
// ⭐ Patron : `decor-gabarit-eleve.mjs` (le décor, la marque EN BASE) et
//    `parcours-deroule.mjs` (le parcours par CDP, les captures).
// ============================================================================
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
if (!/aoakpxxlyvthzueaywna/.test(env.NEXT_PUBLIC_SUPABASE_URL)) throw new Error('bac à sable seulement')
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const args = process.argv.slice(2)
const CLE = args.find((a) => !a.startsWith('--')) ?? 'argument.garant.connecteur'
const DOSSIER = args.filter((a) => !a.startsWith('--'))[1] ?? `/tmp/smoke-cran2-${CLE.replace(/\./g, '-')}`
const arg = (nom, defaut) => { const i = args.indexOf(nom); return i > 0 ? Number(args[i + 1]) : defaut }
const PORT = arg('--port', 9349)
const MARQUE = '2026-09-06T02:02:02.202Z'          // la marque du décor, EN BASE — `--retire` la retrouve
const BASE = `http://localhost:${arg('--port-app', 3000)}`
const TAILLES = [1280, 768, 375]
const dors = (ms) => new Promise((r) => setTimeout(r, ms))

/** Les pièces que le smoke écrit — une PIÈCE, pas l'objet ; par objet, sur le sujet réel affiché. */
const PIECES = {
  argument: "Ce qui prend le regard prend l'attention : un élève qui regarde son écran n'écoute plus, et une classe qui n'écoute plus n'apprend plus.",
  transition: "Mais cet effort ne dit rien encore de la somme qu'on lui verse : on peut mériter une récompense sans que son montant soit juste.",
  plan: 'D\'abord, les réseaux sociaux sont utiles pour communiquer et s\'informer. Mais ils créent aussi une dépendance et réduisent les relations directes. Donc s\'en passer ferait gagner en autonomie et en tranquillité.',
  defaut: "Voici la pièce qui tient les autres ensemble : ce que les pièces servies ne disent pas encore, et sans quoi elles ne tiennent pas.",
}
const VF = (v1) => `${v1}\n\nAutrement dit, c'est ce lien-là qui fait tenir l'ensemble.`

// ── 0. Les interrupteurs, MESURÉS ─────────────────────────────────────────
const { data: params } = await admin.from('scriptorium_params').select('gabarit_actif, juge_documents_actif').limit(1).maybeSingle()
console.log('interrupteurs :', JSON.stringify(params))
if (!params?.gabarit_actif) throw new Error('`gabarit_actif` est OFF en bac à sable : les pièces ne se servent pas — rien à éprouver')
if (!params?.juge_documents_actif) console.warn('⚠️ `juge_documents_actif` est OFF : aucun verdict ne s\'écrira, le retour ne sera pas borné — le smoke le mesurera tel quel')

// ── 1. L'élève de test, l'exercice, le décor ───────────────────────────────
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
const u = users.find((x) => x.email === env.TEST_ELEVE_EMAIL)
if (!u) throw new Error('élève de test introuvable : ' + env.TEST_ELEVE_EMAIL)

const DECOR_PLAN = 'decor-plan-ordre-liste-c2'   // ⚠️ DÉCOR : un exercice de plan cloné, retiré par --retire
if (args.includes('--retire')) {
  const { data } = await admin.from('exercices_depots').delete().eq('eleve_id', u.id).eq('assigne_at', MARQUE).select('id')
  console.log('dépôts retirés :', data?.length ?? 0)
  const { data: dp } = await admin.from('exercices').select('id').eq('id_import', DECOR_PLAN)
  for (const e of dp ?? []) {
    await admin.from('exercices_depots').delete().eq('exercice_id', e.id)
    await admin.from('exercices_cas').delete().eq('exercice_id', e.id)
    const { error } = await admin.from('exercices').delete().eq('id', e.id)
    console.log('exercice de décor retiré :', e.id, error?.message ?? 'ok')
  }
  process.exit(0)
}
if (args.includes('--decor-plan')) {
  // ⭐ Le plan n'est plus en banque (« attend un écran à concevoir ») : on clone un cran 2 existant,
  //    on lui donne le type `plan`, le sujet de l'ancienne banque et ses trois thèses, dans le désordre.
  const { data: deja } = await admin.from('exercices').select('id').eq('id_import', DECOR_PLAN).maybeSingle()
  if (!deja) {
    const { data: modele } = await admin.from('exercices').select('*').like('id_import', 'ex-gab-transition-%-c2').limit(1).maybeSingle()
    const { data: type } = await admin.from('exercices_types').select('id').eq('code', 'plan').maybeSingle()
    const { data: sujet } = await admin.from('exercices_sujets').select('id').ilike('enonce', '%émission humoristique%').maybeSingle()
    if (!modele || !type || !sujet) throw new Error('décor du plan : modèle, type ou sujet introuvable')
    const { id: _id, created_at: _c, updated_at: _u, import_id: _i, ...reste } = modele
    const { data: neuf, error } = await admin.from('exercices').insert({
      ...reste, id_import: DECOR_PLAN, type_id: type.id, materiau_source_sujet_id: sujet.id, consigne_instanciee: '',
      modes_par_competence: { structure: ['composer'] },
    }).select('id').single()
    if (error) throw new Error('décor du plan : ' + error.message)
    const { error: eCas } = await admin.from('exercices_cas').insert({
      exercice_id: neuf.id, ordre: 1, constituant: "l'ordre, écrit", defaut: null, distracteurs: null, pourquoi_juste: null, probleme: null,
      pieces: [
        { nom: 'une thèse', texte: 'la liberté de plaisanter ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable' },
        { nom: 'une thèse', texte: 'cette liberté ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable' },
        { nom: 'une thèse', texte: 'une émission humoristique doit pouvoir plaisanter sur presque tout car le rire permet de critiquer les habitudes sans donner immédiatement une leçon' },
      ],
      reponse_attendue: "Une émission humoristique doit pouvoir plaisanter sur presque tout car le rire permet de critiquer les habitudes sans donner immédiatement une leçon. Mais la liberté de plaisanter ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable. Donc cette liberté ne signifie pas que les humoristes peuvent humilier gratuitement une personne reconnaissable.",
    })
    if (eCas) throw new Error('décor du plan, le cas : ' + eCas.message)
    console.log('exercice de décor créé :', neuf.id)
  } else console.log('exercice de décor déjà là :', deja.id)
}
const souche = args.includes('--decor-plan') ? DECOR_PLAN : `ex-gab-${CLE.replace(/\./g, '-')}-c2`
const { data: exs } = await admin.from('exercices').select('id, id_import, cran, type_id, genre, statut').eq('id_import', souche)
const ex = exs?.[0]
if (!ex) throw new Error(`aucun exercice ${souche} en bac à sable — la banque gabarit-c2.json n'est pas déposée`)
const { data: cas } = await admin.from('exercices_cas').select('ordre, constituant, pieces, reponse_attendue').eq('exercice_id', ex.id).order('ordre')
const c1 = cas?.[0]
if (!c1?.constituant || !Array.isArray(c1.pieces) || !c1.pieces.length) throw new Error('le cas ne porte ni constituant ni pièces : pas un cran 2 du gabarit')
const { data: type } = await admin.from('exercices_types').select('code').eq('id', ex.type_id).maybeSingle()
const objet = type?.code ?? 'defaut'
console.log(`exercice ${souche} (${ex.id}) · objet ${objet} · statut ${ex.statut} · constituant « ${c1.constituant} » · ${c1.pieces.length} pièces (${c1.pieces.map((p) => p.texte === null ? 'TROU' : p.texte.length).join('/')} car.) · attendue ${c1.reponse_attendue?.length ?? 0} car.`)

let { data: deja } = await admin.from('exercices_depots').select('id').eq('eleve_id', u.id).eq('exercice_id', ex.id).eq('assigne_at', MARQUE)
let depot = deja?.[0]
if (!depot) {
  const { data, error } = await admin.from('exercices_depots').insert({
    eleve_id: u.id, exercice_id: ex.id, origine: 'prof', statut: 'assigne', assigne_at: MARQUE,
    echeance: new Date(Date.now() + 7 * 86400e3).toISOString(),
  }).select('id').single()
  if (error) throw new Error(error.message)
  depot = data
}
console.log('dépôt :', depot.id, '→', `${BASE}/eleve/modules/codex/exercice/${depot.id}`)
if (args.includes('--sans-parcours')) process.exit(0)

// ── 2. Le parcours par CDP — le patron de `parcours-deroule.mjs` ───────────
fs.mkdirSync(DOSSIER, { recursive: true })
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
const montreLeVolet = (lire) => cdp.evalue(`(() => {
  const b = [...document.querySelectorAll('[role=group][aria-label] button')].filter((x) => x.offsetParent !== null)
  if (!b.length) return 'sans bascule'
  const cible = ${lire} ? b.find((x) => /^Lire|^Mon texte/.test(x.textContent.trim())) : b.find((x) => !/^Lire|^Mon texte|^Crédence/.test(x.textContent.trim()))
  if (!cible) return 'pas de cible'
  if (cible.getAttribute('aria-pressed') === 'true') return 'déjà'
  cible.click(); return 'basculé : ' + cible.textContent.trim()
})()`)
let n = 0
const deborde = []
async function capture(etat, { lire = false } = {}) {
  n++
  for (const w of TAILLES) {
    await metrics(w); await dors(400)
    if (w < 1024) { await montreLeVolet(lire); await dors(450) }
    await cdp.evalue('window.scrollTo(0,0); true')
    // ⚠️ `.page-tourne` fond en 220 ms : capturer plus tôt donne un écran « grisé » (Louis, 06/09).
    await dors(350)
    const m = JSON.parse(await cdp.evalue('JSON.stringify({ interne: window.innerWidth, doc: document.documentElement.scrollWidth })'))
    if (m.doc > m.interne) deborde.push(`${etat} @${w} : déborde de ${m.doc - m.interne} px`)
    const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    fs.writeFileSync(`${DOSSIER}/${objet}-${String(n).padStart(2, '0')}-${etat}-${w}.png`, Buffer.from(shot.data, 'base64'))
  }
  await metrics(1280); await dors(300)
  console.log(`  [${n}] ${etat}`)
}
async function lire() {
  return cdp.evalue(`(() => {
    const t = document.body.innerText
    const boutons = [...document.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent !== null).map((b) => b.textContent.trim())
    const ta = [...document.querySelectorAll('textarea')].filter((x) => x.offsetParent !== null && !x.readOnly).map((x) => ({ rows: x.rows, vide: x.value.trim() === '', trou: x.placeholder === 'Écris ici' }))
    const geste = /Ta thèse en une phrase/i.test(t) ? 'restitution' : /degré de confiance/i.test(t) ? 'confiance' : /Dans quelles conditions as-tu travaillé/i.test(t) ? 'conditions' : null
    return { boutons, textareas: ta, geste,
      // ⭐ le texte à trou : le champ « Écris ici » posé dans le fil, la légende « ce bloc = telle chose ».
      trou: !!document.querySelector('textarea[placeholder="Écris ici"]') || !!document.querySelector('[data-plan]'),
      plan: !!document.querySelector('[data-plan]'), lienVide: [...document.querySelectorAll('[data-plan] input')].filter((x) => x.value.trim() === '').length,
      legende: /c’est ce que tu écris/i.test(t), guide: /De quoi t.aider/i.test(t),
      consigne2: /le texte à compléter/i.test(t), ilManque: /il manque/i.test(t),
      piecesDansLesDocuments: /LES PIÈCES|Le texte à compléter/.test([...document.querySelectorAll('h3')].map((h) => h.textContent).join('|')),
      enregistrer: boutons.includes('Enregistrer'),
      rendre: boutons.find((b) => /^Rendre/.test(b)) ?? null,
      suivant: boutons.find((b) => /^(Point suivant|Pour finir)/.test(b)) ?? null,
      lu: boutons.find((b) => /^J’ai lu mon retour/.test(b)) ?? null,
      reprendre: boutons.find((b) => /^(Reprendre mon texte|Reprendre ma|Écrire ma version finale|Commencer ma version finale)/.test(b)) ?? null,
      versionFinale: /version finale/i.test(t), preparation: /retour est en préparation/i.test(t),
      retour: /Ce qui a bougé|Retour à mes exercices|Ce que tu as écrit|point \\d+ sur \\d+|pour finir/i.test(t) && !/retour est en préparation/i.test(t),
      etalon: /Un exemple de ce qui était attendu/i.test(t),
      pasEncoreOuvert: /pas encore ouvert/i.test(t), texte: t.slice(0, 200) }
  })()`)
}
const clique = (texte) => cdp.evalue(`(() => { const b = [...document.querySelectorAll('button')].find((x) => !x.disabled && x.offsetParent !== null && x.textContent.trim().startsWith(${JSON.stringify(texte)})); if (!b) return false; b.scrollIntoView({ block: 'center' }); b.click(); return true })()`)
async function tape(i, texte) {
  const ok = await cdp.evalue(`(() => { const x = [...document.querySelectorAll('textarea')].filter((x) => x.offsetParent !== null && !x.readOnly)[${i}]; if (!x) return false; x.scrollIntoView({ block: 'center' }); x.focus(); x.select(); return true })()`)
  if (!ok) return false
  await cdp.envoie('Input.insertText', { text: texte }); return true
}
async function attendQue(pred, fois = 20) { for (let k = 0; k < fois; k++) { await dors(700); const e = await lire(); if (pred(e)) return e } return lire() }
async function pagesDuRetour(prefixe) {
  let p = 1; await capture(`${prefixe}-point-${p}`)
  for (let k = 0; k < 12; k++) {
    await cdp.evalue(`(() => { const c = [...document.querySelectorAll('input[type=checkbox]')].find((x) => x.offsetParent !== null && !x.checked); if (c) c.click(); return !!c })()`)
    await dors(300); const e = await lire(); if (!e.suivant) break
    const fin = /^Pour finir/.test(e.suivant); await clique(e.suivant); await dors(500); p++
    await capture(fin ? `${prefixe}-fin` : `${prefixe}-point-${p}`); if (fin) break
  }
}
const constats = []
const constat = (ok, quoi) => { constats.push(`${ok ? '✓' : '✗'} ${quoi}`); console.log(`  ${ok ? '✓' : '✗'} ${quoi}`) }

try {
  let t
  for (let i = 0; i < 50 && !t; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json() } catch { await dors(200) } }
  const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r))
  cdp = new CDP(ws); await cdp.envoie('Page.enable'); await metrics(1280)
  const { data: lien, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
  if (error) throw error
  const ch = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${lien.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex/exercice/${depot.id}` })
  await ch; await dors(2500)
  console.log('→', await cdp.evalue('location.pathname'))

  let e = await lire()
  if (e.pasEncoreOuvert) throw new Error('porte fermée : l\'écran dit « pas encore ouvert »')
  if (args.includes('--reprise')) {
    // ⭐ La version finale seule, sur un dépôt dont le retour est lu.
    console.log('  boutons visibles :', JSON.stringify(e.boutons))
    if (e.lu) { await clique(e.lu); e = await attendQue((x) => !x.lu); console.log('  après validation :', JSON.stringify(e.boutons)) }
    // Le retour se relit page par page ; « Reprendre mon texte » n'est qu'à la dernière.
    if (!e.reprendre) { await pagesDuRetour('retour-relu'); e = await lire(); console.log('  en fin de retour :', JSON.stringify(e.boutons)) }
    if (e.lu) { await clique(e.lu); e = await attendQue((x) => !x.lu) }
    if (!e.reprendre) throw new Error('pas de bouton pour reprendre le texte — boutons : ' + JSON.stringify(e.boutons))
    await clique(e.reprendre); await dors(800); await capture('vf-ecrire')
    if ((await lire()).plan) {
      // Le plan en version finale : l'ordre est relu du texte ; on change le second mot qui lie.
      await cdp.evalue(`(() => { const x = [...document.querySelectorAll('[data-plan] input')][1]; x.focus(); x.select(); return true })()`)
      await cdp.envoie('Input.insertText', { text: 'c\'est pourquoi' }); await dors(300); await capture('vf-ecrite')
    } else {
      const i = (await lire()).textareas.findIndex((x) => x.trou || x.rows >= 9)
      if (i < 0) throw new Error('pas de champ pour la version finale')
      await tape(i, VF(PIECES[objet] ?? PIECES.defaut)); await dors(300); await capture('vf-ecrite')
    }
    await clique('Enregistrer'); await dors(800); await capture('vf-rendre')
    const r = (await lire()).rendre; if (!r) throw new Error('pas de bouton Rendre — boutons : ' + JSON.stringify((await lire()).boutons))
    await clique(r); await attendQue((x) => x.preparation || x.retour, 60); await capture('vf-rendue')
    let ok = false
    for (let k = 0; k < 40 && !ok; k++) { await dors(5000); const x = await lire(); if (x.retour && !x.preparation) ok = true }
    if (ok) await pagesDuRetour('retour-final')
    const e3 = await lire()
    constat(e3.etalon, 'l\'étalon « Un exemple de ce qui était attendu » est servi après la vf')
    await capture('etalon')
    const { data: d2 } = await admin.from('exercices_depots').select('verdicts_cran, texte_vf').eq('id', depot.id).maybeSingle()
    console.log('  texte_vf :', JSON.stringify(d2?.texte_vf).slice(0, 120))
    const vf = d2?.verdicts_cran?.vf ?? null
    constat(!!vf, `verdict du juge (vf) : ${vf ? `${vf.reussi ? 'RÉUSSI' : 'RATÉ'} — ${vf.motif}` : 'absent'}`)
    throw Object.assign(new Error('fin de la reprise'), { fin: true })
  }
  // ── L'écran d'ouverture : les pièces, la place vide, la consigne du 2, pas de guide ──
  constat(e.trou, 'le trou « Écris ici » est un champ posé dans le fil du texte')
  constat(e.legende, 'la légende nomme les moments et le trou')
  constat(!e.piecesDansLesDocuments, 'les morceaux ne sont pas dans « Les documents »')
  constat(e.consigne2, 'la consigne du cran 2 (« le texte à compléter ») est celle du 10- v0.9 §3')
  constat(!e.ilManque, 'le mot « il manque » n\'apparaît nulle part')
  constat(!e.guide, 'le guide « De quoi t\'aider » ne se sert pas')
  await capture('ouvert-documents', { lire: true })
  await capture('ouvert-ecrire')

  // ── Écrire la pièce, enregistrer, les gestes, rendre ──
  if (e.plan) {
    // Le plan : la troisième thèse en premier (deux clics « Monter »), puis « mais » et « donc ».
    await cdp.evalue(`(() => { const b = [...document.querySelectorAll('[data-plan] button[aria-label="Monter cette partie"]')]; b[2]?.click(); return true })()`)
    await dors(200)
    await cdp.evalue(`(() => { const b = [...document.querySelectorAll('[data-plan] button[aria-label="Monter cette partie"]')]; b[1]?.click(); return true })()`)
    await dors(200)
    const mots = ['mais', 'donc']
    for (let i = 0; i < 2; i++) {
      await cdp.evalue(`(() => { const x = [...document.querySelectorAll('[data-plan] input')][${i}]; x.focus(); return true })()`)
      await cdp.envoie('Input.insertText', { text: mots[i] }); await dors(150)
    }
    await dors(300); await capture('plan-ordonne')
    await clique('Enregistrer'); await attendQue((x) => !x.plan)
  } else {
    const idx = e.textareas.findIndex((x) => x.trou)
    if (idx < 0) throw new Error('pas de champ « Écris ici »')
    await tape(idx, PIECES[objet] ?? PIECES.defaut); await dors(400); await capture('piece-ecrite')
    await clique('Enregistrer'); await attendQue((x) => !x.textareas.some((y) => y.trou))
  }
  for (let pas = 0; pas < 8; pas++) {
    e = await lire()
    if (e.geste) {
      await capture(`se-juger-${e.geste}`)
      if (e.geste === 'confiance') await cdp.evalue(`(() => { for (const f of document.querySelectorAll('fieldset')) { const b = f.querySelector('button'); if (b) b.click() } return true })()`)
      else if (e.geste === 'conditions') await cdp.evalue(`(() => { const b = [...document.querySelectorAll('button[aria-pressed]')].find((x) => x.offsetParent !== null && /temps|vite|pu/.test(x.textContent)); if (b) b.click(); return true })()`)
      else { const i = (await lire()).textareas.findIndex((x) => x.rows < 9); await tape(i < 0 ? 0 : i, 'La pièce qui manquait est le lien entre les deux.') }
      await dors(300); await clique('Continuer'); await attendQue((x) => x.geste !== e.geste); continue
    }
    if (e.rendre) { await capture('rendre'); await clique(e.rendre); await attendQue((x) => x.preparation || x.retour, 60); await capture('rendu'); break }
    break
  }

  // ── Le retour, puis le verdict en base ──
  let fini = false
  for (let k = 0; k < 40 && !fini; k++) { await dors(5000); const x = await lire(); if (x.retour && !x.preparation) fini = true }
  if (!fini) { await capture('attente'); throw new Error('pas de retour après 200 s — chaîne à regarder (file, cron)') }
  await pagesDuRetour('retour')
  const { data: d1 } = await admin.from('exercices_depots').select('verdicts_cran, texte_v1').eq('id', depot.id).maybeSingle()
  const v1 = d1?.verdicts_cran?.v1 ?? null
  constat(!!v1, `verdict du juge (v1) sur \`verdicts_cran\` : ${v1 ? `${v1.reussi ? 'RÉUSSI' : 'RATÉ'} — ${v1.motif}` : 'absent (juge_documents_actif OFF ?)'}`)
  const { data: rets } = await admin.from('exercices_retours').select('moment, texte').eq('depot_id', depot.id)
  const chaud = (rets ?? []).find((r) => r.moment === 'chaud')
  const brut = typeof chaud?.texte === 'string' ? JSON.parse(chaud.texte) : chaud?.texte
  const points = Array.isArray(brut) ? brut : Array.isArray(brut?.points) ? brut.points : []
  console.log('  retour chaud :', points.length, 'points')
  for (const p of points) console.log(`    · [${p.nature}/${p.competence}] ${String(p.texte).slice(0, 140)}`)
  // La borne (décision 17) : les observables du constituant, lus dans la grille.
  const { data: pbs } = await admin.from('exercices_problemes').select('constituant, observable_code').eq('objet_code', objet)
  const nu = String(c1.constituant).toLowerCase().replace(/^(le|la|l'|l’|les)\s*/, '').split(/[,—]/)[0].trim()
  const permis = new Set((pbs ?? []).filter((p) => p.constituant && (nu.startsWith(p.constituant) || p.constituant.startsWith(nu))).map((p) => p.observable_code).filter(Boolean))
  console.log('  observables du constituant :', [...permis].join(', ') || '(aucun trouvé par le nom — à lire à la main)')
  constat(true, 'le retour est à relire à la main contre ces observables : le point qui nomme autre chose est un écart à la décision 17')

  // ── La version finale, puis l'étalon ──
  e = await lire()
  if (e.lu && e.versionFinale) {
    await clique(e.lu); await attendQue((x) => !x.lu); const e2 = await lire()
    if (e2.reprendre) {
      await clique(e2.reprendre); await dors(600)
      const i = (await lire()).textareas.findIndex((x) => x.trou || x.rows >= 9)
      await tape(i < 0 ? 0 : i, VF(PIECES[objet] ?? PIECES.defaut)); await dors(300)
      await clique('Enregistrer'); await dors(600); await capture('vf-rendre')
      const r = (await lire()).rendre; if (r) { await clique(r); await attendQue((x) => x.preparation || x.retour, 60) }
      let ok = false
      for (let k = 0; k < 40 && !ok; k++) { await dors(5000); const x = await lire(); if (x.retour && !x.preparation) ok = true }
      if (ok) await pagesDuRetour('retour-final')
      const e3 = await lire()
      constat(e3.etalon, 'l\'étalon « Un exemple de ce qui était attendu » est servi après la vf')
      await capture('etalon')
      const { data: d2 } = await admin.from('exercices_depots').select('verdicts_cran').eq('id', depot.id).maybeSingle()
      const vf = d2?.verdicts_cran?.vf ?? null
      constat(!!vf, `verdict du juge (vf) : ${vf ? `${vf.reussi ? 'RÉUSSI' : 'RATÉ'} — ${vf.motif}` : 'absent'}`)
    }
  } else constat(false, 'pas de version finale offerte (régime ?)')
} catch (e) {
  if (!(e && e.fin)) throw e
} finally {
  chrome.kill()
  console.log('\nCONSTATS\n' + constats.join('\n'))
  console.log(deborde.length ? '⛔ DÉBORDEMENTS :\n' + deborde.join('\n') : '✓ aucun débordement aux trois tailles')
  console.log('captures :', DOSSIER)
}
