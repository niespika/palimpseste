// ============================================================================
// SMOKE C10 · L2 — « LE PROFESSEUR CLÔT LES DÉPÔTS », vu depuis de VRAIES
//                  sessions (professeur ET élève), sur les DEUX modules,
//                  aux trois largeurs.
// ----------------------------------------------------------------------------
// ⭐⭐⭐ POURQUOI CE SCRIPT EXISTE, ET POURQUOI LA COUTURE NE SUFFIT PAS.
//    `couture-c10l2.mjs` a la clé de service en poche : il prouve que le serveur
//    refuse, jamais que l'ÉCRAN dit quelque chose. Or trois faits ne se voient
//    que d'ici :
//      · la bannière verte de lancement, ÉTEINTE ;
//      · la ligne « abandonné » qui APPARAÎT dans « Mes examens passés » — un
//        comportement ATTENDU, pas un manque ;
//      · l'écran de passation atteint PAR SON URL DIRECTE, qui ne propose plus
//        de déposer (c'est le trou que `!vue.ouvert` ne fermait pas :
//        `ouvert_par_prof_at` reste non nul après la clôture).
//
// ⛔⛔ SUR LES DEUX MODULES, ET C'EST UNE DÉCISION DE LOUIS DU 07/09, PAS UNE
//    OPTION. Le décor sème donc DEUX instances de classe — une dont l'atelier se
//    dérive en `codex` (un mode `composer`), une en `aletheia` (aucun) —, parce
//    qu'en production la PLUS GROSSE des quatre passations est une passation de
//    LECTURE : 10 dépôts sur 15. Un smoke qui ne passe que sur Codex vérifie
//    cinq bannières sur quinze en croyant les avoir toutes vues.
//
// ⛔ PAR CDP, ET PAS AUTREMENT. `chrome --headless --window-size=375` NE FAIT PAS
//    un écran de 375 px (Chrome impose une largeur minimale et recadre) : il faut
//    `Emulation.setDeviceMetricsOverride`. Et le débordement horizontal se MESURE
//    (`document.scrollWidth` contre `window.innerWidth`), il ne se regarde pas.
//
// ⛔⛔ UN LIEN MAGIQUE EN ANNULE UN AUTRE : jamais deux parcours en parallèle.
//    Ce script ouvre donc la session PROFESSEUR d'abord, capture ses écrans,
//    PUIS la session élève — dans un seul processus, deux onglets, jamais deux
//    scripts côte à côte.
//
// ⚠️ IL ÉCRIT, ET IL LE DIT : il sème son décor, il CLIQUE sur « Clore » (par la
//    vraie page, pas par l'action), et il retire tout à la fin (`--garde-le-decor`
//    pour l'inspecter). Bac à sable UNIQUEMENT.
//
// Usage :
//   npm run dev   (dans un autre terminal)
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/smoke-c10l2.mjs <dossier> [--largeurs 1280,768,375] \
//        [--garde-le-decor]
// ============================================================================

import fs from 'node:fs'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))

const SANDBOX = 'aoakpxxlyvthzueaywna'
if (!env.NEXT_PUBLIC_SUPABASE_URL?.includes(SANDBOX)) {
  console.error(`⛔ REFUS — bac à sable uniquement. Vu : ${env.NEXT_PUBLIC_SUPABASE_URL}`)
  process.exit(2)
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SORTIE = process.argv[2]
if (!SORTIE || SORTIE.startsWith('--')) {
  throw new Error('usage : smoke-c10l2.mjs <dossier> [--largeurs …] [--garde-le-decor]')
}
fs.mkdirSync(SORTIE, { recursive: true })
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null }
const a = (n) => process.argv.includes(n)
const LARGEURS = (arg('--largeurs') ?? '1280,768,375').split(',').map(Number)
// ⭐ `--base` : le smoke ne suppose plus le port. Une AUTRE séance peut tenir
//    le 3000 — et un serveur qui recompile fait échouer des contrôles justes.
const BASE = arg('--base') ?? 'http://localhost:3000'
const PORT = 9418
const MARQUE = 'SMOKE-C10L2'
/**
 * ⛔⛔ LE VERROU, ET IL A ÉTÉ PAYÉ. `retirer()` balaie PAR LA MARQUE — c'est ce
 *    qui le rend robuste sans registre, et c'est aussi ce qui fait que DEUX
 *    essais qui se chevauchent s'effacent l'un l'autre : mesuré le 07/09, un
 *    essai encore en vol a balayé le décor d'un second au milieu de sa course,
 *    qui a conclu « l'écran de passation rend 404 » et « la base ne porte aucun
 *    dépôt » — sur un code parfaitement correct. Le verrou refuse le second.
 */
const VERROU = 'scripts/recette/.smoke-c10l2.lock'
const EMAIL_PROF = 'louis.sagnieres@gmail.com'

let ok = 0, ko = 0
const dire = (v, quoi, det = '') => {
  if (v) { ok++; console.log(`  ✅ ${quoi}`) } else { ko++; console.log(`  ❌ ${quoi}`) }
  if (det) console.log(`     ${det}`)
}
const lu = (quoi, r) => {
  if (r.error) throw new Error(`${quoi} — ${r.error.code ?? ''} ${r.error.message}`)
  return r.data
}
const dors = (ms) => new Promise((r) => setTimeout(r, ms))

// ════════════════════════════════════════════════════════════════════════════
// LE DÉCOR — deux instances de classe, une par atelier, sur l'élève de test
// ════════════════════════════════════════════════════════════════════════════
async function semer() {
  console.log('════ LE DÉCOR — deux passations, une par module ════')
  // ⛔⛔ UN DÉCOR RESTÉ D'UN ESSAI PRÉCÉDENT REND CE SMOKE MENTEUR, ET C'EST
  //    MESURÉ : un premier essai tué en vol (un `| head` qui ferme le tuyau)
  //    a laissé deux instances `ouvert` en base. Le run suivant a clos SES
  //    instances, et l'écran élève a montré la bannière verte des ANCIENNES —
  //    le smoke a conclu « la bannière n'est pas éteinte » sur un code correct.
  //    On refuse de semer par-dessus, et on dit comment nettoyer.
  const restes = lu('décor résiduel', await admin.from('exercices')
    .select('id').ilike('consigne_instanciee->>recette', `${MARQUE}%`))
  if (restes.length) {
    throw new Error(`${restes.length} instance(s) d'un essai précédent traînent encore `
      + `(${restes.map((x) => x.id.slice(0, 8)).join(', ')}). Jouer d'abord `
      + `\`node … scripts/recette/smoke-c10l2.mjs <dossier> --retire-seul\`.`)
  }
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
  const eleve = users.find((u) => u.email === env.TEST_ELEVE_EMAIL)
  if (!eleve) throw new Error(`aucun compte pour ${env.TEST_ELEVE_EMAIL}`)

  const inscrs = lu('inscriptions de l’élève', await admin.from('inscriptions')
    .select('id, classe_id, classes(nom)').eq('eleve_id', eleve.id).eq('statut', 'active'))
  if (!inscrs.length) throw new Error(`${env.TEST_ELEVE_EMAIL} n'est inscrit nulle part`)
  const inscrDecor = inscrs[0]
  const classeId = inscrDecor.classe_id

  const camarades = lu('camarades', await admin.from('inscriptions')
    .select('eleve_id').eq('classe_id', classeId).eq('statut', 'active'))
  const eleves = [eleve.id, ...camarades.map((c) => c.eleve_id).filter((e) => e !== eleve.id)]
  console.log(`   · élève ${eleve.id.slice(0, 8)} · classe ${classeId.slice(0, 8)} `
    + `« ${inscrDecor.classes?.nom} » · ${eleves.length} élève(s)`)

  const types = lu('types', await admin.from('exercices_types')
    .select('id, code, nature').eq('nature', 'complet'))
  const type = types.find((t) => t.code === 'examen_diagnostique_essai') ?? types[0]

  // ⭐ L'ATELIER SE DÉRIVE DES MODES, jamais du module par lequel on regarde :
  //    `atelierDUnFormatif` rend `codex` si un mode vaut `composer`, `aletheia`
  //    sinon. C'est ce qui donne UNE instance par module, sans ligne de plan.
  const INSTANCES = [
    { atelier: 'codex', modes: { expression: ['composer'] } },
    { atelier: 'aletheia', modes: {} },
  ]

  const decor = { eleveId: eleve.id, classeId, inscriptionId: inscrDecor.id, instances: [] }
  for (const inst of INSTANCES) {
    const ex = lu(`instance ${inst.atelier}`, await admin.from('exercices').insert({
      type_id: type.id, classe_id: classeId, lieu: 'classe', statut: 'assigne',
      consigne_instanciee: {
        texte: `${MARQUE} ${inst.atelier} — rédige un essai sur la liberté, et justifie ta thèse.`,
        recette: `${MARQUE} — ${inst.atelier}`,
      },
      modes_par_competence: inst.modes,
      optin_se_juger: true, optin_confiance_remise: true,
    }).select('id').single())

    const maintenant = new Date().toISOString()
    // ⭐ ON SÈME TOUTE LA CLASSE : la confirmation du professeur doit être vue
    //    avec autant de noms que possible (le pire cas de la PROD est 23).
    const depots = []
    for (let i = 0; i < eleves.length; i++) {
      const d = lu('dépôt', await admin.from('exercices_depots').insert({
        eleve_id: eleves[i], exercice_id: ex.id, origine: 'prof',
        // Un dépôt REMIS chez un camarade : la clôture ne doit pas le toucher,
        // et le professeur doit le voir rester intact.
        statut: i === 1 ? 'v1_remis' : 'ouvert',
        assigne_at: '2026-08-31T12:00:00Z',
        ouvert_at: maintenant, ouvert_par_prof_at: maintenant,
        ...(i === 1 ? { v1_remis_at: maintenant, transcription_v1: `${MARQUE} — ma copie rendue.` } : {}),
        // ⭐ Un BROUILLON chez l'élève de test : la confirmation doit le NOMMER
        //    À PART (« porte une copie non validée »).
        ...(i === 0 ? { transcription_v1: `${MARQUE} — mon brouillon, jamais validé.` } : {}),
      }).select('id, eleve_id, statut').single())
      depots.push(d)
    }
    decor.instances.push({ atelier: inst.atelier, exerciceId: ex.id, depots })
    console.log(`   · ${inst.atelier.padEnd(9)} instance ${ex.id.slice(0, 8)} · ${depots.length} dépôts`)
  }
  fs.writeFileSync(`${SORTIE}/decor.json`, JSON.stringify(decor, null, 2))
  return decor
}

async function retirer(decor) {
  console.log('\n════ LE RETRAIT — par la MARQUE et par ids ════')
  const parLaMarque = lu('instances marquées', await admin.from('exercices')
    .select('id').ilike('consigne_instanciee->>recette', `${MARQUE}%`))
  const ids = [...new Set([...(decor?.instances ?? []).map((i) => i.exerciceId),
    ...parLaMarque.map((x) => x.id)])]
  if (ids.length) {
    const dep = lu('dépôts', await admin.from('exercices_depots').select('id').in('exercice_id', ids))
    if (dep.length) {
      const dids = dep.map((d) => d.id)
      lu('suppr retours', await admin.from('exercices_retours').delete().in('depot_id', dids).select('id'))
      lu('suppr jobs', await admin.from('exercices_jobs').delete().in('depot_id', dids).select('id'))
      lu('suppr métacog', await admin.from('exercices_metacognition').delete().in('depot_id', dids).select('id'))
      lu('suppr dépôts', await admin.from('exercices_depots').delete().in('id', dids).select('id'))
    }
    lu('suppr instances', await admin.from('exercices').delete().in('id', ids).select('id'))
  }
  // ⛔⛔ LE JOURNAL SE RETIRE PAR SON GESTE ET SES DÉPÔTS, jamais par cycle ni par
  //    élève : un `delete().eq('cycle_lundi', …)` emporterait une autre séance.
  const journal = lu('journal', await admin.from('routeur_decisions')
    .select('id, override_prof').eq('regle_declenchee', 'override_prof'))
  const miennes = journal.filter((l) => (l.override_prof ?? []).some(
    (e) => e?.geste === 'cloture_passation' && String(e?.motif ?? '').includes('instance ')
      && ids.some((x) => String(e.motif).includes(x))))
  if (miennes.length) {
    lu('suppr journal', await admin.from('routeur_decisions')
      .delete().in('id', miennes.map((l) => l.id)).select('id'))
  }
  const reste = lu('reste', await admin.from('exercices_depots').select('id').eq('statut', 'abandonne'))
  console.log(`   · ${ids.length} instance(s) · ${miennes.length} ligne(s) de journal retirées · `
    + `${reste.length} dépôt(s) \`abandonne\` restants en base (attendu 0)`)
}

// ════════════════════════════════════════════════════════════════════════════
// LE MOTEUR CDP
// ════════════════════════════════════════════════════════════════════════════
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
  /**
   * ⛔⛔ TOUT APPEL CDP A UNE ÉCHÉANCE. Sans elle, une promesse qui ne revient
   *    jamais fige le script SANS RIEN DIRE — mesuré : le smoke est resté bloqué
   *    à la deuxième largeur, indéfiniment, pendant que la page était
   *    parfaitement rendue. Un contrôle qui ne rend jamais la main n'est pas un
   *    contrôle lent : c'est un contrôle muet.
   */
  envoie(method, params = {}, echeance = 30000) {
    const id = ++this.id
    this.ws.send(JSON.stringify({ id, method, params }))
    return new Promise((res, rej) => {
      const minuteur = setTimeout(() => {
        this.attentes.delete(id)
        rej(new Error(`CDP ${method} sans réponse après ${echeance / 1000} s`))
      }, echeance)
      this.attentes.set(id, {
        res: (v) => { clearTimeout(minuteur); res(v) },
        rej: (e) => { clearTimeout(minuteur); rej(e) },
      })
    })
  }
  async evalue(expression, echeance = 30000) {
    const r = await this.envoie('Runtime.evaluate',
      { expression, awaitPromise: true, returnByValue: true }, echeance)
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

async function cible() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })
      return await r.json()
    } catch { await dors(200) }
  }
  throw new Error('Chrome ne répond pas')
}

/**
 * ⛔ PAS UN DÉLAI FIXE : en `next dev`, la PREMIÈRE visite d'une route la compile.
 *
 * ⛔⛔ ET « plus de 80 caractères dans `main` » NE SUFFIT PAS — mesuré au premier
 *    essai de ce script, qui a photographié DIX-HUIT écrans de plume d'attente
 *    en croyant les avoir vus : l'en-tête et la navigation vivent DANS `main`,
 *    et ils dépassent 80 caractères à eux seuls pendant que le Suspense du
 *    contenu tourne encore. On attend donc que le mot « chargement » ait
 *    DISPARU du contenu, ET qu'un bouton porte une FIBRE REACT — cliquer avant
 *    l'hydratation ne fait rien du tout (leçon d'`aletheia-smoke-eleve.mjs`).
 */
async function attendreLeContenu(cdp, { hydrate = false, marqueur = null } = {}) {
  // ⛔⛔ NE PAS ATTENDRE LA DISPARITION DE « chargement » : mesuré ici, ce mot
  //    vient de CINQ `SPAN.font-titre` de l'EN-TÊTE DU SITE, dont les plumes ne
  //    se résolvent jamais quand le volet est masqué. Les guetter fait attendre
  //    30 s par écran pour rien, et ne dit rien du contenu.
  //    ⭐ On attend LA CHOSE QU'ON VIENT VOIR — un marqueur donné par l'appelant
  //    —, à défaut une longueur de contenu.
  // ⛔⛔ LA SONDE A UNE ÉCHÉANCE COURTE, ET C'EST LE POINT. Avaler l'erreur d'un
  //    appel à 30 s dans une boucle de 150 tours ne BORNE rien : il la MULTIPLIE
  //    — mesuré, le smoke pouvait rester une heure sur une seule largeur. Deux
  //    secondes : un appel qui ne revient pas rend `false`, la boucle compte, et
  //    sa borne de 60 s tient vraiment.
  const sonde = async (expr) => {
    try { return await cdp.evalue(expr, 2000) } catch { return false }
  }
  const PRET = marqueur
    ? `(() => { const m = document.querySelector("main"); return !!m && `
      + `${marqueur}.test(m.innerText || "") })()`
    : '(() => { const m = document.querySelector("main");'
      + ' return !!m && (m.innerText || "").trim().length > 300 })()'
  // ⛔ 60 s, PAS 20 : en `next dev`, la PREMIÈRE visite d'une route la compile,
  //    et un serveur qui vient de voir ses fichiers réécrits met bien plus que
  //    vingt secondes. Mesuré : à 20 s, la garde rendait la main sur une page
  //    non hydratée, le clic partait dans le vide, et le smoke déclarait la
  //    confirmation absente — sur un écran parfaitement correct.
  let vu = false
  for (let i = 0; i < 150; i++) {
    if (await sonde(PRET)) { vu = true; break }
    await dors(400)
  }
  if (!vu) console.log(`     ⚠️ contenu attendu ABSENT après 60 s${marqueur ? ` (${marqueur})` : ''}`
    + ' — le serveur compile-t-il encore ?')
  return vu
  if (hydrate) {
    // ⭐ LA FIBRE REACT — sans elle, `b.click()` part dans le vide : le DOM est
    //    là, l'état ne l'est pas, et rien ne se passe. C'est ce qui a fait dire
    //    au premier essai « le bouton se clique ✅ » sur un clic sans effet.
    for (let i = 0; i < 40; i++) {
      const h = await sonde('(() => { const b = [...document.querySelectorAll("main button")];'
        + ' return b.length > 0 && b.some(el => Object.keys(el).some(k => k.startsWith("__reactFiber"))) })()')
      if (h) break
      await dors(500)
    }
  }
  await dors(700)
}

async function capturer(cdp, nom, url, { largeurs = LARGEURS, marqueur = null } = {}) {
  const mesures = []
  for (const largeur of largeurs) {
    await cdp.envoie('Emulation.setDeviceMetricsOverride',
      { width: largeur, height: 900, deviceScaleFactor: 1, mobile: largeur < 768,
        screenWidth: largeur, screenHeight: 900 })
    const c = cdp.attendChargement()
    await cdp.envoie('Page.navigate', { url: BASE + url })
    // ⛔⛔ ON COURSE L'ÉVÉNEMENT DE CHARGEMENT, ON NE L'ATTEND PAS SEUL. Mesuré :
    //    `capturer` visite la MÊME url une fois par largeur, et Chrome ne relève
    //    pas `Page.loadEventFired` sur une navigation identique — le smoke restait
    //    bloqué indéfiniment à la DEUXIÈME largeur, sur une page parfaitement
    //    rendue. C'est `attendreLeContenu` qui décide que la page est là, pas
    //    l'événement.
    await Promise.race([c, dors(15000)])
    await attendreLeContenu(cdp, { marqueur })
    // ⚠️ LE TEXTE MESURÉ EST CELUI DE `main`, PAS DU `body` : la navigation du
    //    site occupait les 300 premiers caractères et masquait tout le contenu.
    const m = JSON.parse(await cdp.evalue(
      'JSON.stringify({ interne: window.innerWidth, doc: document.documentElement.scrollWidth,'
      + ' hauteur: document.documentElement.scrollHeight,'
      + ' txt: ((document.querySelector("main") || document.body).innerText || "")'
      + '   .replace(/\\n+/g, " · ") })'))
    const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png',
      clip: { x: 0, y: 0, width: largeur, height: Math.min(m.hauteur, 4000), scale: 1 },
      captureBeyondViewport: true })
    fs.writeFileSync(`${SORTIE}/${nom}-${largeur}.png`, Buffer.from(shot.data, 'base64'))
    const deborde = m.doc > m.interne
    if (deborde) ko++; else ok++
    console.log(`  ${deborde ? '❌' : '✅'} ${nom.padEnd(30)} @${String(largeur).padStart(4)} — `
      + `doc ${m.doc} / écran ${m.interne}${deborde ? ` ⛔ DÉBORDE de ${m.doc - m.interne} px` : ''}`)
    mesures.push(m)
  }
  return mesures[0]
}

// ════════════════════════════════════════════════════════════════════════════
// ⭐ `--retire-seul` : balayer un décor laissé par un essai tué, sans rien semer
//    ni ouvrir Chrome. C'est le mode de reprise que le refus ci-dessus indique.
if (a('--retire-seul')) {
  await retirer(null)
  fs.rmSync(VERROU, { force: true })
  process.exit(0)
}

if (fs.existsSync(VERROU)) {
  console.error(`⛔ REFUS — un essai est déjà en cours ou a été tué en vol (${VERROU}, `
    + `posé ${fs.readFileSync(VERROU, 'utf-8').trim()}). Son \`retirer()\` balaie PAR LA MARQUE et `
    + 'emporterait le décor de celui-ci au milieu de sa course. Attendre sa fin, ou jouer '
    + '`--retire-seul`.')
  process.exit(2)
}
fs.writeFileSync(VERROU, new Date().toISOString())

let decor = null
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SORTIE}/chrome-profil`, '--hide-scrollbars', 'about:blank',
], { stdio: 'ignore' })

try {
  decor = await semer()

  const t = await cible()
  const ws = new WebSocket(t.webSocketDebuggerUrl)
  await new Promise((r) => ws.addEventListener('open', r))
  const cdp = new CDP(ws)
  await cdp.envoie('Page.enable')
  await cdp.envoie('Network.enable')

  // ══════════════════════════════════════════════════════════════════════════
  // I. LE PROFESSEUR — la confirmation, avec ses noms, aux trois largeurs
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n════ I. LE PROFESSEUR — la confirmation, avec ses noms ════')
  const { data: lienProf, error: eP } = await admin.auth.admin
    .generateLink({ type: 'magiclink', email: EMAIL_PROF })
  if (eP) throw eP
  let ch = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=`
    + `${lienProf.properties.hashed_token}&type=magiclink&next=/prof/codex` })
  await ch; await dors(2500)
  const ouP = await cdp.evalue('location.pathname')
  if (ouP.includes('/login') || ouP === '/') {
    throw new Error(`la session PROF ne s’est pas ouverte (${ouP}) : lien consommé ou serveur absent ?`)
  }
  console.log(`   session prof ouverte — ${ouP}`)

  for (const inst of decor.instances) {
    const route = inst.atelier === 'codex' ? 'codex' : 'aletheia'
    const url = `/prof/${route}/passation/${inst.exerciceId}`

    // 1 · l'écran AVANT le clic : le bouton, avec son compte
    const m1 = await capturer(cdp, `prof-${inst.atelier}-1-avant`, url,
      { marqueur: '/Clore les d[ée]p[ôo]ts/' })
    dire(/Clore les d[ée]p[ôo]ts — \d+ en attente/.test(m1.txt),
      `PROF ${inst.atelier} — le bouton « Clore les dépôts » est sur la page, avec son COMPTE`,
      (m1.txt.match(/Clore les d[ée]p[ôo]ts[^·]*/) ?? ['—'])[0].slice(0, 120))
    // ⭐ LA PLACE EST UN FAIT, PAS UN RANGEMENT : le geste vient AVANT l'étape 12.
    dire(m1.txt.indexOf('Clore les d') < m1.txt.indexOf('DÉCLENCHER')
      && m1.txt.indexOf('DÉCLENCHER') > 0,
      `PROF ${inst.atelier} — ⭐ la clôture est AVANT « 2 · Déclencher l’analyse en lot »`,
      `« Clore » à ${m1.txt.indexOf('Clore les d')}, « DÉCLENCHER » à ${m1.txt.indexOf('DÉCLENCHER')}`)

    // 2 · le PREMIER TEMPS : on clique, et la confirmation nomme les élèves
    //     ⛔ `confirm()` est interdit — si le geste passait par le dialogue natif,
    //        ce clic ne montrerait RIEN (il rend `false` en aperçu embarqué).
    await cdp.envoie('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
    ch = cdp.attendChargement()
    await cdp.envoie('Page.navigate', { url: BASE + url })
    await Promise.race([ch, dors(15000)])
    await attendreLeContenu(cdp, { hydrate: true, marqueur: '/Clore les d[ée]p[ôo]ts/' })
    // ⛔⛔ LE CLIC SE REJOUE JUSQU'À CE QUE LA CONFIRMATION PARAISSE. Un clic sur
    //    un bouton dont la fibre React n'est pas encore montée ne fait RIEN, et
    //    ne rend aucune erreur : le smoke disait « le bouton se clique ✅ » puis
    //    « la confirmation est absente ❌ » sur un écran juste. On réessaie, et
    //    ce qui est asserté est LA CONFIRMATION, jamais le clic.
    let clique = 'jamais tenté'
    let vueLaConfirmation = false
    for (let essai = 1; essai <= 6 && !vueLaConfirmation; essai++) {
      clique = await cdp.evalue(`(() => {
        const b = [...document.querySelectorAll('main button')]
          .find(x => /Clore les d[ée]p[ôo]ts — \\d+ en attente/i.test(x.textContent || ''))
        if (!b) return 'BOUTON INTROUVABLE'
        if (b.disabled) return 'BOUTON DÉSACTIVÉ'
        b.click(); return 'ok'
      })()`)
      vueLaConfirmation = await attendreLeContenu(cdp, { marqueur: '/vont? passer à/' })
      if (!vueLaConfirmation) console.log(`     … essai ${essai} : la confirmation n’a pas paru`)
    }
    dire(vueLaConfirmation,
      `PROF ${inst.atelier} — le bouton s’ouvre sur la confirmation`,
      vueLaConfirmation ? '' : `dernier retour du clic : ${clique}`)

    const conf = await cdp.evalue('document.querySelector("main").innerText')
    dire(/constat/i.test(conf) && /absol/i.test(conf),
      `PROF ${inst.atelier} — ⭐⭐ la confirmation dit « CONSTAT », pas absolution`,
      (conf.match(/[^\n]*constat[^\n]*/i) ?? ['—'])[0].slice(0, 200))
    dire(/copie non validée/i.test(conf),
      `PROF ${inst.atelier} — ⭐ le brouillon est NOMMÉ À PART (« copie non validée »)`,
      (conf.match(/[^\n]*copie non valid[^\n]*/i) ?? ['—'])[0].slice(0, 200))
    dire(/dénominateur/i.test(conf),
      `PROF ${inst.atelier} — la confirmation dit que le dépôt RESTE au dénominateur`)
    // ⭐ TOUS LES NOMS EN CLAIR, sans « et N autres », sans troncature.
    const nomsAnnonces = (conf.match(/vont? passer à « abandonné » ?:([\s\S]*?)(?:\d+ de ces|« Abandonné »)/) ?? [])[1] ?? ''
    const lignes = nomsAnnonces.split('\n').map((x) => x.trim()).filter(Boolean)
    dire(lignes.length === inst.depots.length - 1 && !/et \d+ autres/i.test(conf),
      `PROF ${inst.atelier} — ⭐ les ${inst.depots.length - 1} noms sont EN CLAIR, aucun « et N autres »`,
      lignes.join(' | ').slice(0, 240))

    // la confirmation ouverte, aux trois largeurs — sans recharger (elle est en état)
    for (const largeur of LARGEURS) {
      await cdp.envoie('Emulation.setDeviceMetricsOverride',
        { width: largeur, height: 900, deviceScaleFactor: 1, mobile: largeur < 768,
          screenWidth: largeur, screenHeight: 900 })
      await dors(500)
      const m = JSON.parse(await cdp.evalue(
        'JSON.stringify({ interne: window.innerWidth, doc: document.documentElement.scrollWidth,'
        + ' hauteur: document.documentElement.scrollHeight })'))
      const shot = await cdp.envoie('Page.captureScreenshot', { format: 'png',
        clip: { x: 0, y: 0, width: largeur, height: Math.min(m.hauteur, 4000), scale: 1 },
        captureBeyondViewport: true })
      fs.writeFileSync(`${SORTIE}/prof-${inst.atelier}-2-confirmation-${largeur}.png`,
        Buffer.from(shot.data, 'base64'))
      const deborde = m.doc > m.interne
      if (deborde) ko++; else ok++
      console.log(`  ${deborde ? '❌' : '✅'} ${`prof-${inst.atelier}-2-confirmation`.padEnd(30)} `
        + `@${String(largeur).padStart(4)} — doc ${m.doc} / écran ${m.interne}`
        + `${deborde ? ` ⛔ DÉBORDE de ${m.doc - m.interne} px` : ''}`)
    }

    // 3 · le SECOND TEMPS : on confirme pour de vrai
    await cdp.envoie('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
    ch = cdp.attendChargement()
    const soumis = await cdp.evalue(`(() => {
      const b = [...document.querySelectorAll('main button[type=submit]')]
        .find(x => /^Clore \\d+ d[ée]p[ôo]t/i.test((x.textContent || '').trim()))
      if (!b) return 'SOUMISSION INTROUVABLE'
      b.click(); return 'ok'
    })()`)
    dire(soumis === 'ok', `PROF ${inst.atelier} — le second temps se soumet`, String(soumis))
    await Promise.race([ch, dors(12000)])
    await attendreLeContenu(cdp, { hydrate: true, marqueur: '/Aucun d[ée]p[ôo]t n’attend/' })
    const apres = await cdp.evalue('document.querySelector("main").innerText')
    dire(/dépôt\(s\) clos|dépôts? clos/i.test(apres),
      `PROF ${inst.atelier} — ⭐ l’écran ANNONCE ce qu’il a fait`,
      (apres.match(/[^\n]*clos[^\n]*/i) ?? ['—'])[0].slice(0, 200))

    const enBase = lu('statuts', await admin.from('exercices_depots')
      .select('statut').eq('exercice_id', inst.exerciceId))
    const compte = enBase.reduce((acc, d) => ({ ...acc, [d.statut]: (acc[d.statut] ?? 0) + 1 }), {})
    dire((compte.abandonne ?? 0) === inst.depots.length - 1 && (compte.v1_remis ?? 0) === 1,
      `PROF ${inst.atelier} — ⛔ EN BASE : tout est \`abandonne\` sauf la copie REMISE`,
      JSON.stringify(compte))

    await capturer(cdp, `prof-${inst.atelier}-3-apres`, url,
      { marqueur: '/Aucun d[ée]p[ôo]t n’attend/' })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // II. L'ÉLÈVE — depuis une VRAIE session, sur les DEUX modules
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n════ II. L’ÉLÈVE — vraie session, les DEUX modules ════')
  const { data: lienE, error: eE } = await admin.auth.admin
    .generateLink({ type: 'magiclink', email: env.TEST_ELEVE_EMAIL })
  if (eE) throw eE
  ch = cdp.attendChargement()
  await cdp.envoie('Page.navigate', { url: `${BASE}/auth/confirm?token_hash=`
    + `${lienE.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex` })
  await ch; await dors(2500)

  // ⛔⛔ LE COOKIE DE CLASSE — trouvé au smoke du 07/09. `eleve_classe` porte un
  //    id d'INSCRIPTION, et l'élève de test est inscrit dans DEUX classes : sans
  //    lui, les captures montrent un écran parfaitement rendu et parfaitement
  //    vide du décor.
  await cdp.envoie('Network.setCookie', {
    name: 'eleve_classe', value: decor.inscriptionId, domain: 'localhost', path: '/',
  })
  const ouE = await cdp.evalue('location.pathname')
  if (ouE.includes('/login') || ouE === '/') {
    throw new Error(`la session ÉLÈVE ne s’est pas ouverte (${ouE})`)
  }
  console.log(`   session élève ouverte — ${ouE} · classe en contexte ${decor.inscriptionId.slice(0, 8)}`)

  for (const inst of decor.instances) {
    const route = inst.atelier === 'codex' ? 'codex' : 'aletheia'
    const sien = inst.depots.find((d) => d.eleve_id === decor.eleveId)

    // ① L'ÉCRAN DE PASSATION, PAR SON URL DIRECTE — le trou que ce lot ferme
    const m = await capturer(cdp, `eleve-${inst.atelier}-1-passation-close`,
      `/eleve/modules/${route}/passation/${sien.id}`, { marqueur: '/Ce d[ée]p[ôo]t est clos/' })
    dire(/Ce dépôt est clos/i.test(m.txt),
      `ÉLÈVE ${inst.atelier} — ⭐⭐ PAR L’URL DIRECTE, l’écran dit « Ce dépôt est clos. »`,
      m.txt.slice(0, 220))
    // ⛔ LE CONTRÔLE PORTE SUR LES COMMANDES, PAS SUR LES MOTS. Le premier essai
    //    cherchait « Déposer » dans le texte et tombait sur SA PROPRE phrase de
    //    refus (« tu ne peux plus y déposer de copie ») : un écran parfaitement
    //    fermé s'y déclarait ouvert. On compte les BOUTONS et les CHAMPS.
    const commandes = await cdp.evalue(`JSON.stringify({
      boutons: [...document.querySelectorAll('main button')].map(b => (b.textContent||'').trim()),
      champs: document.querySelectorAll('main textarea, main input[type=file]').length,
    })`)
    const c = JSON.parse(commandes)
    const gestes = c.boutons.filter((b) => /valider|envoyer|photo|page|d[ée]poser|enregistrer/i.test(b))
    dire(gestes.length === 0 && c.champs === 0,
      `ÉLÈVE ${inst.atelier} — ⛔ AUCUNE commande de dépôt ne subsiste : 0 bouton de geste, 0 champ`,
      `boutons : ${c.boutons.join(' | ') || '(aucun)'} · champs de saisie : ${c.champs}`)

    // ② LA LISTE — la bannière verte éteinte, la ligne « abandonné » présente
    const urlListe = inst.atelier === 'codex' ? '/eleve/modules/codex' : '/eleve/modules/aletheia/exercices'
    const ml = await capturer(cdp, `eleve-${inst.atelier}-2-liste`, urlListe)
    dire(!new RegExp(`${MARQUE} ${inst.atelier}[\\s\\S]{0,120}(Commencer|Déposer|à faire)`, 'i').test(ml.txt),
      `ÉLÈVE ${inst.atelier} — la bannière verte de lancement est ÉTEINTE`,
      ml.txt.slice(0, 220))

    const urlPasses = inst.atelier === 'codex'
      ? '/eleve/modules/codex/examens' : '/eleve/modules/aletheia/examens'
    const mp = await capturer(cdp, `eleve-${inst.atelier}-3-examens-passes`, urlPasses,
      { marqueur: '/abandonné/' })
    dire(/abandonné/i.test(mp.txt),
      `ÉLÈVE ${inst.atelier} — ⭐ la ligne « abandonné » APPARAÎT dans « Mes examens passés » `
      + '— c’est un comportement VOULU, pas un manque',
      mp.txt.slice(0, 220))
  }

  console.log(`\n════ ${ok} contrôle(s) tenu(s), ${ko} en échec ════`)
} finally {
  chrome.kill(); await dors(400)
  fs.rmSync(VERROU, { force: true })
  if (a('--garde-le-decor')) {
    console.log(`\n⚠️ DÉCOR GARDÉ — voir ${SORTIE}/decor.json.`)
  } else if (decor) {
    await retirer(decor)
  }
}
if (ko > 0) process.exit(1)
