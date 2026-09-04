// ============================================================================
// SMOKE ÉLÈVE — Aletheia (étayage par niveau, écrans refondus le 04/09). BAC À SABLE seulement.
// ----------------------------------------------------------------------------
// Un Chrome SANS FENÊTRE piloté par CDP (le volet du navigateur caché n'hydrate jamais une
// page), un lien magique pour le compte élève de test, la page d'une séance, et un mode :
//   node scripts/recette/aletheia-smoke-eleve.mjs --livre <id> --semaine 2 --mode <mode> [--reponses f.json] [--tag t] [--clore]
//   modes : ecran        · captures 1280 / 768 / 375 de la page telle quelle
//           viewport     · la barre du bas est-elle FIXE ? fenêtre seule à 375 avant/après défilement
//           presentation · les 4 écrans de la présentation, puis la séance (ouvert_at en base)
//           fil          · la saisie une question par écran (--reponses = [rappel?, q1, q2-blocage, q2-phrase, q3, q4, q5] ; la question 2 passe par « je ne sais pas »)
//           retour-fil   · le retour au fil : relances (faux → bonne phrase), bascule, réponses (--reponses)
//           vf-fil       · la réécriture au fil (--reponses = 3 ou 4 champs), soumission
//           final-fil    · le retour final partie par partie (nuance, liens, synthèse) ; --clore
//           v1 | vf      · les formulaires d'AVANT (porte fermée) — remplissage direct des textareas
// Prérequis : un Chrome lancé ainsi —
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 --user-data-dir=/tmp/palimpseste-chrome --no-first-run about:blank &
// et le serveur de la branche sur le port 3100 (`.claude/launch.json`, entrée palimpseste-etayage).
// Les captures vont dans scripts/recette/captures/ (ignoré par git : voir .gitignore).
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const require = createRequire(path.join(RACINE, 'package.json'))
const { createClient } = require('@supabase/supabase-js')
const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d }
const LIVRE = arg('--livre'), SEMAINE = arg('--semaine', '1'), MODE = arg('--mode', 'ecran'), BASE = arg('--base', 'http://localhost:3100')
if (!LIVRE) { console.error('usage : --livre <id> --semaine n --mode ecran|viewport|presentation|fil|retour-fil|vf-fil|final-fil|v1|vf'); process.exit(1) }
const REPONSES = arg('--reponses') ? JSON.parse(fs.readFileSync(arg('--reponses'), 'utf8')) : null
const TAG = arg('--tag', `${LIVRE.slice(0, 8)}-s${SEMAINE}-${MODE}`)
const CAPTURES = path.join(RACINE, 'scripts', 'recette', 'captures')

const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
if (!env.NEXT_PUBLIC_SUPABASE_URL.includes('aoakpxxlyvthzueaywna')) { console.error('⛔ pas le bac à sable'); process.exit(2) }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// ── CDP minimal ──────────────────────────────────────────────────────────────
const cible = await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json()
const ws = new WebSocket(cible.webSocketDebuggerUrl)
await new Promise(r => ws.addEventListener('open', r))
let id = 0; const attentes = new Map()
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && attentes.has(m.id)) { attentes.get(m.id)(m); attentes.delete(m.id) } })
const cdp = (method, params = {}) => new Promise((res, rej) => { const i = ++id; attentes.set(i, m => m.error ? rej(new Error(method + ' : ' + JSON.stringify(m.error))) : res(m.result)); ws.send(JSON.stringify({ id: i, method, params })) })
const evalJs = async (expr) => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? '')); return r.result.value }
const dodo = ms => new Promise(r => setTimeout(r, ms))
const metrics = (w, h, mobile) => cdp('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile })
const ecrire = (nom, data) => { fs.mkdirSync(CAPTURES, { recursive: true }); const f = path.join(CAPTURES, `${TAG}-${nom}.png`); fs.writeFileSync(f, Buffer.from(data, 'base64')); return f }
const capture = async (nom) => ecrire(nom, (await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })).data)
const vue = async (nom) => ecrire(nom, (await cdp('Page.captureScreenshot', { format: 'png' })).data)
const cap3 = async (nom) => { await metrics(375, 812, true); await dodo(450); await capture(`${nom}-375`); await metrics(1280, 900, false); await dodo(350); await capture(`${nom}-1280`) }
await cdp('Page.enable'); await cdp('Runtime.enable'); await metrics(1280, 900, false)

// ── Lien magique → page de la séance ─────────────────────────────────────────
const route = `/eleve/modules/aletheia/${LIVRE}/${SEMAINE}`
const { data: lien, error: eL } = await admin.auth.admin.generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
if (eL) { console.error('lien magique :', eL.message); process.exit(1) }
await cdp('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=${lien.properties.hashed_token}&type=magiclink&next=${encodeURIComponent(route)}` })
const attendre = async (cond, ms = 40000, pas = 1000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await evalJs(cond)) return true } catch { } await dodo(pas) } return false }
await attendre(`location.pathname === ${JSON.stringify(route)}`, 30000)
// « prêt » = un bouton (ou textarea) de <main> porte une fibre React. Remplir AVANT l'hydratation
// vide le champ (l'état contrôlé repart à vide).
const pret = `location.pathname === ${JSON.stringify(route)} && (() => { const els = [...document.querySelectorAll('main textarea, main button')]; return els.length > 0 && els.some(el => Object.keys(el).some(k => k.startsWith('__reactFiber'))) })()`
for (let essai = 1; essai <= 3; essai++) { await cdp('Page.navigate', { url: BASE + route }); if (await attendre(pret, 25000)) break; console.log(`⚠ essai ${essai} : page non hydratée`) }
await dodo(1200)
const texte = async () => evalJs("document.querySelector('main')?.innerText ?? document.body.innerText")
const titre = () => evalJs("document.querySelector('main h3')?.textContent ?? ''")
const compteur = () => evalJs("document.querySelector('main [aria-label^=\"écran\"]')?.getAttribute('aria-label') ?? ''")
const bouton = (re) => evalJs(`(() => { const b = [...document.querySelectorAll('main button')].find(b => ${re}.test(b.textContent.trim()) && b.offsetParent !== null); if (!b) return 'absent'; if (b.disabled) return 'désactivé'; b.click(); return b.textContent.trim() })()`)
const messages = () => evalJs("[...document.querySelectorAll('main .text-ok, main .text-attention, main .text-retard')].map(e => e.innerText).filter(Boolean).join(' | ')")
const SET = "const set = (el, v) => { const d = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set; d.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })) };"
const remplirPremier = (v) => evalJs(`(() => { ${SET} const el = document.querySelector('main textarea, main input[type=text], main input:not([type])'); if (!el) return 'aucun champ'; set(el, ${JSON.stringify(v)}); return el.tagName })()`)
const travail = async (cols) => (await admin.from('aletheia_travaux').select(cols).eq('scriptorium_livre_id', LIVRE).eq('semaine_index', Number(SEMAINE)).maybeSingle()).data
const fiche = async () => { const { data } = await admin.from('aletheia_livre_reference').select('contenu').eq('scriptorium_livre_id', LIVRE).maybeSingle(); return data?.contenu ?? [] }
const passageDe = (contenu, id) => contenu.flatMap(c => c.passages_cles ?? []).find(p => p.id === id)
console.log(`=== ${MODE} · ${route} ===`)

if (MODE === 'ecran') {
  console.log((await texte()).slice(0, 1200))
}

if (MODE === 'viewport') {
  // --ecran N : avancer de N écrans (Suivant / Chercher / Répondre…) avant de capturer.
  for (let n = 0; n < Number(arg('--ecran', '0')); n++) { console.log('   →', await bouton('/^(Suivant|Répondre|Chercher|Lire le passage|Ta réponse →)/')); await dodo(800) }
  console.log('écran :', await titre())
  await metrics(375, 812, true); await dodo(600)
  await evalJs('window.scrollTo(0, 0)'); await dodo(300); await vue('375-haut')
  await evalJs('window.scrollTo(0, 420)'); await dodo(500); await vue('375-defile')
  console.log('barre :', JSON.stringify(await evalJs("(() => { const b = [...document.querySelectorAll('main button')].find(b => /Suivant|Commencer|Répondre|Chercher|Lire|Passer|Vérifier|J’ai lu/.test(b.textContent)); if (!b) return null; const r = b.getBoundingClientRect(); const nav = document.querySelector('nav[aria-label=\"Navigation principale\"]')?.getBoundingClientRect(); return { bouton: b.textContent.trim(), boutonBas: Math.round(r.bottom), navHaut: nav ? Math.round(nav.top) : null, fenetre: innerHeight, scrollY: Math.round(scrollY), pageHaut: Math.round(document.documentElement.scrollHeight) } })()")))
  await metrics(1280, 900, false); await dodo(500); await evalJs('window.scrollTo(0, 0)'); await dodo(300); await vue('1280')
}

if (MODE === 'presentation') {
  for (let n = 0; n < 4; n++) {
    console.log(`— ${await titre()}`); await cap3(`pres-${n}`)
    console.log('   →', await bouton('/^(Suivant|Commencer)/')); await dodo(800)
  }
  const ok = await attendre("/Question 1|Avant de commencer/.test(document.body.innerText)", 30000, 1500)
  console.log(ok ? '✔ la séance s’ouvre' : '✖ la séance ne s’ouvre pas'); await dodo(2500)
  const { data: etat } = await admin.from('aletheia_eleve_etat').select('*')
  console.log('base : état', JSON.stringify(etat), '· travail', JSON.stringify(await travail('statut, ouvert_at')))
}

if (MODE === 'fil') {
  const vals = REPONSES ?? []; let k = 0
  for (let n = 0; n < 12; n++) {
    const t = await titre(); console.log(`— ${await compteur()} · ${t}`)
    await metrics(375, 812, true); await dodo(450); await capture(`fil-${n}-375`); await metrics(1280, 900, false); await dodo(350)
    if (/Question 2$/.test(t)) { await evalJs("[...document.querySelectorAll('main button')].find(b => b.textContent.trim() === 'Je ne sais pas').click()"); await dodo(500); console.log('   → je ne sais pas :', await titre()); await capture(`fil-${n}-jnsp-375`) }
    if (await evalJs("!!document.querySelector('main textarea, main input[type=text], main input:not([type])')")) { console.log('   remplir :', await remplirPremier(vals[k++] ?? 'Réponse de test.')); await dodo(300) }
    const r = await bouton('/^(Suivant|Soumettre)/'); console.log('   →', r)
    if (/Soumettre/.test(r)) break
    await dodo(700)
  }
  await dodo(4000)
  const err = await evalJs("document.querySelector('.text-retard')?.innerText ?? ''"); if (err) console.log('⚠', err)
  console.log((await attendre("/Relance 1|Ton rappel|Ta version finale/.test(document.body.innerText)", 150000, 3000)) ? '✔ retour affiché' : '✖ pas de retour après 150 s')
  console.log('base :', JSON.stringify(await travail('statut, forme, rappel, questions')))
}

if (MODE === 'retour-fil') {
  const tr = await travail('retour_v1, forme'); const contenu = await fiche()
  const pivots = (tr.retour_v1.relances_detail ?? []).map(d => passageDe(contenu, d.passage)?.pivots?.[0]?.[0] ?? null)
  console.log('forme', tr.forme, '· pivots', pivots)
  const vals = REPONSES ?? []; let k = 0, rel = 0
  for (let n = 0; n < 16; n++) {
    const t = await titre(); console.log(`— ${await compteur()} · ${t}`); await cap3(`rfil-${n}`)
    if (/^Surligne la phrase/.test(t)) {
      const pivot = pivots[rel]
      console.log('   faux →', await evalJs(`(() => { const b = [...document.querySelectorAll('main [role=button][data-phrase]')].filter(x => x.dataset.phrase !== ${JSON.stringify(pivot)})[2]; b.click(); return b.dataset.phrase })()`))
      console.log('   ', await bouton('/^Vérifier/')); await dodo(3500); console.log('   verdict :', await messages())
      await evalJs("[...document.querySelectorAll('main [role=button][data-phrase][aria-pressed=true]')].forEach(x => x.click())")
      console.log('   la bonne →', await evalJs(`(() => { const b = document.querySelector('main [role=button][data-phrase=${JSON.stringify(pivot)}]'); if (!b) return 'absent'; b.click(); return b.dataset.phrase })()`))
      console.log('   ', await bouton('/^Vérifier/')); await dodo(3500); console.log('   verdict :', await messages()); await cap3(`rfil-${n}-juste`)
      console.log('   →', await bouton('/^Ta réponse/'))
    } else if (/ta réponse$/.test(t)) {
      await metrics(375, 812, true); await dodo(300); console.log('   bascule →', await bouton('/^Ta réponse$/')); await dodo(400); await capture(`rfil-${n}-reponse-375`); await metrics(1280, 900, false); await dodo(300)
      await evalJs(`(() => { ${SET} set(document.querySelector('main textarea'), ${JSON.stringify(vals[k++] ?? 'Réponse de test.')}); return 1 })()`); await dodo(300)
      console.log('   →', await bouton('/^Suivant/')); rel++
    } else {
      const r = await bouton('/^(Suivant|Répondre|Chercher|Lire le passage|Passer)/'); console.log('   →', r)
      if (/Passer/.test(r)) break
    }
    await dodo(800)
  }
  await dodo(4000)
  console.log((await attendre("/Ta version finale/i.test(document.body.innerText)", 30000, 2000)) ? '✔ réécriture ouverte' : '✖ réécriture non ouverte')
  console.log('base :', JSON.stringify((await travail('reponses_relances')).reponses_relances))
}

if (MODE === 'vf-fil') {
  const vals = REPONSES ?? []
  for (let n = 0; n < 5; n++) {
    console.log(`— ${await compteur()} · ${await titre()}`)
    await metrics(375, 812, true); await dodo(450); await capture(`vfil-${n}-retour-375`)
    console.log('   bascule →', await bouton('/^Ta version finale$/')); await dodo(400); await capture(`vfil-${n}-champ-375`)
    await metrics(1280, 900, false); await dodo(350); if (n === 0) await capture(`vfil-${n}-1280`)
    await evalJs(`(() => { ${SET} set(document.querySelector('main textarea'), ${JSON.stringify(vals[n] ?? 'Version finale de test.')}); return 1 })()`); await dodo(300)
    const r = await bouton('/^(Suivant|Soumettre)/'); console.log('   →', r)
    if (/Soumettre/.test(r)) break
    await dodo(700)
  }
  await dodo(4000)
  console.log((await attendre("/partie par partie/i.test(document.body.innerText)", 150000, 3000)) ? '✔ retour final affiché' : '✖ pas de retour final après 150 s')
}

if (MODE === 'final-fil') {
  await attendre("/partie par partie/i.test(document.body.innerText)", 20000)
  const tr = await travail('id, retour_vf, forme, statut'); if (tr?.statut !== 'FEEDBACK2_READY') { console.log('✖ pas en FEEDBACK2_READY :', tr?.statut); ws.close(); process.exit(1) }
  const contenu = await fiche()
  const nd = tr.retour_vf.nuances_detail ?? [], ap = tr.retour_vf.amont_paires ?? [], sc = tr.retour_vf.synthese_couverture ?? []
  console.log(`forme ${tr.forme} · nuances ${nd.length} (→ ${nd[0]?.passage}) · paires ${ap.length} · couverture ${sc.length}`)
  const pivot = passageDe(contenu, nd[0]?.passage)?.pivots?.[0]?.[0]
  await dodo(1000)
  const partie = () => evalJs("(document.querySelector('main')?.innerText.match(/PARTIE \\d · [^\\n]+/g) ?? []).pop() ?? ''")
  const suivre = async () => { const r = await bouton('/^(J’ai lu|✓ J’ai lu)/'); if (r !== 'absent') return r; return evalJs("(() => { const c = document.querySelector('main input[type=checkbox]'); if (!c) return 'absent'; c.click(); return 'coché' })()") }
  for (let etape = 1; etape <= 4; etape++) {
    await dodo(1000); const t = await partie(); console.log(`— ${t}`)
    if (/NUANCES/.test(t)) {
      await cap3(`ffil-${etape}-a`)
      if (pivot && tr.forme !== 'montre') {
        await evalJs(`(() => { const b = [...document.querySelectorAll('main [role=button][data-phrase]')].filter(x => x.dataset.phrase !== ${JSON.stringify(pivot)})[1]; b.click(); return 1 })()`)
        console.log('   ', await bouton('/^Vérifier/')); await dodo(3500); console.log('   verdict 1 :', await messages())
        await evalJs("[...document.querySelectorAll('main [role=button][data-phrase][aria-pressed=true]')].forEach(x => x.click())")
        await evalJs(`document.querySelector('main [role=button][data-phrase=${JSON.stringify(pivot)}]')?.click()`)
        console.log('   ', await bouton('/^Vérifier/')); await dodo(3500); console.log('   verdict 2 :', await messages()); await cap3(`ffil-${etape}-b`)
        console.log('   ', await bouton('/^Ce que le retour dit/')); await dodo(600)
      }
      console.log('   flèche :', await evalJs("document.querySelectorAll('main svg path[stroke-dasharray]').length")); await cap3(`ffil-${etape}-c`)
    } else if (/ARCHITECTURE/.test(t)) {
      for (let k = 0; k < ap.length; k++) {
        await cap3(`ffil-${etape}-lien${k}`)
        const bonne = passageDe(contenu, ap[k].passage_amont)?.libelle
        const autres = contenu.flatMap(c => c.passages_cles ?? []).filter(p => p.id !== ap[k].passage_amont).map(p => p.libelle)
        const cible = k === 0 ? bonne : autres[k % autres.length]
        const r = await evalJs(`(() => { const bs = [...document.querySelectorAll('main button')].filter(b => b.textContent.includes(${JSON.stringify(cible ?? '∅')}) && b.offsetParent !== null); if (!bs.length) return 'absent'; bs[0].click(); return bs[0].textContent.slice(0, 50) })()`)
        console.log(`   lien ${k + 1} : « ${r} »`); await dodo(3500); console.log('   ', await messages())
        if (k < ap.length - 1) { console.log('   ', await bouton('/^Lien suivant/')); await dodo(600) }
      }
    } else if (/SYNTH/.test(t)) {
      await cap3(`ffil-${etape}-a`)
      const absentes = sc.filter(c => c.etat === 'absent').map(c => c.id)
      for (const id of absentes.slice(0, Math.max(0, absentes.length - 1))) await evalJs(`document.querySelector('main [role=button][data-phrase=${JSON.stringify(id)}]')?.click()`)
      console.log('   ', await bouton('/[Cc]omparer/')); await dodo(3500)
      console.log('   message :', await evalJs("document.querySelector('main')?.innerText.match(/(Tu as repéré|Ta version disait|Ce qui manquait|Les \\d+ manques)[^\\n]*/)?.[0] ?? ''")); await cap3(`ffil-${etape}-b`)
    } else await cap3(`ffil-${etape}`)
    if (etape === 4 && !process.argv.includes('--clore')) { console.log('   (clôture non demandée : --clore)'); break }
    const r = await suivre(); console.log('   →', r)
    if (/clore/.test(r)) break
  }
  await dodo(5000)
  console.log('base :', JSON.stringify(await travail('statut, retour_vf_agi, comparaison_synthese')))
}

if (MODE === 'v1' || MODE === 'vf') {
  const n = await evalJs("document.querySelectorAll('main textarea').length")
  console.log(`textareas : ${n} ; réponses fournies : ${REPONSES?.length}`)
  await evalJs(`(() => { ${SET} const vals = ${JSON.stringify(REPONSES ?? [])}; [...document.querySelectorAll('main textarea')].forEach((el, i) => set(el, vals[i] ?? '')); return 1 })()`)
  await capture('rempli-1280')
  await evalJs("(() => { const b = [...document.querySelectorAll('button[type=submit]')].find(x => /Soumettre/.test(x.textContent)); b.click(); return 1 })()")
  await dodo(4000)
  const err = await evalJs("document.querySelector('.text-retard')?.innerText ?? document.querySelector('.text-attention')?.innerText ?? ''"); if (err) console.log('⚠', err)
  const cible = MODE === 'v1' ? "/Pour creuser|Réponses à tes questions|Ta version finale|Relance 1/.test(document.body.innerText)" : "/partie par partie|Synthèse modèle/.test(document.body.innerText)"
  console.log((await attendre(cible, 150000, 3000)) ? '✔ retour affiché' : '✖ pas de retour après 150 s')
}

const f1 = await capture('1280'); await metrics(768, 1024, false); await dodo(800); const f2 = await capture('768'); await metrics(375, 812, true); await dodo(800); const f3 = await capture('375')
console.log('captures :', path.relative(RACINE, f1), path.relative(RACINE, f2), path.relative(RACINE, f3))
ws.close(); process.exit(0)
