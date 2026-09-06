// ============================================================================
// COUTURE C7 · L7 — LE ROUTEUR PAR OBJET, ÉPROUVÉ PAR EXÉCUTION, EN BAC À SABLE.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c7l7.mjs [--constat|--essai|--retire] [--eleve <email|id>]
//
// Les cinq coutures du prompt, sous la forme vérifiable — qui écrit · qui lit ·
// un chemin réel y mène-t-il — puis le « fait quand », point par point, chacun
// avec sa requête et son résultat :
//   ① la clé de l'instance → l'observable (`lireLesInstances`), comptée sur les
//     328 exercices 1.5 du bac à sable, par objet et par compétence ;
//   ② le registre de décor : deux réussites sur LE MÊME devoir le même jour ⇒ pas
//     tenu ; sur DEUX devoirs à un cycle d'écart ⇒ le cran suivant s'ouvre ; toute
//     la bande tenue ⇒ `tenu` ;
//   ③ la porte et la quarantaine : un objet ouvert reçoit UN exercice, sur un
//     AUTRE devoir ; en méthode, le même devoir aux crans de la séquence ;
//   ④ une pose complète en bac à sable, deux cycles de suite, constatée EN BASE
//     PAR REQUÊTE : chaque décision porte l'état de l'objet, l'observable élu et
//     son motif ;
//   ⑤ le pull, après la semaine posée : le suivant dans l'ordre par objet ; un
//     objet déjà servi ce cycle n'en reçoit pas un second ; plus rien ⇒ le motif.
//
// ⛔ BAC À SABLE UNIQUEMENT — refus explicite sinon. `--essai` ÉCRIT (décor) et le
//    dit : les lettres de l'élève de décor (D en Argumentation et en Structure),
//    les 328 instances 1.5 passées `concu` (elles n'entrent au vivier qu'ainsi),
//    puis les décisions et les dépôts que la pose écrit. Le registre AVANT est
//    écrit sur disque ; `--retire` repose tout, et le vérifie par requête.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const SANDBOX = 'aoakpxxlyvthzueaywna'
if (!(env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes(SANDBOX)) { console.error('⛔ REFUS — bac à sable uniquement.'); process.exit(2) }
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const REGISTRE = path.join(RACINE, 'scripts/recette/.couture-c7l7.json')
const FUSEAU = 'America/Toronto'
const CYCLE_1 = '2026-09-14'   // le premier lundi du segment 3 en bac à sable — R1, R2, R3, R5 s'allument
const CYCLE_2 = '2026-09-21'
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null }
const a = (n) => process.argv.includes(`--${n}`)

const { lireLesInstances, lireLesDevoirsServis } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
const { constituerLeVivier, candidatsPour, bornerLaMethode } = await import(`${RACINE}/utils/moteur/vivier.ts`)
const { contexteDesObjets, cransPortesParLaBanque, ordonnerParObjet, vieDeLObjet } = await import(`${RACINE}/utils/moteur/objets.ts`)
const { etatDeLObjet } = await import(`${RACINE}/utils/registre/objet.ts`)
const { deriverLeRegistre, cransDebloques } = await import(`${RACINE}/utils/registre/reussites.ts`)
const { porteDeLObjet } = await import(`${RACINE}/utils/registre/porte.ts`)
const { lireLaPorteDesCrans } = await import(`${RACINE}/utils/registre/porte-serveur.ts`)
const { poserLesSemainesDuRouteur, composerPourUnEleve, retenusPourLaPose } = await import(`${RACINE}/utils/moteur/cycle-serveur.ts`)
const { poserLaSemaine } = await import(`${RACINE}/utils/routeur/semaine.ts`)
// ⚠️ `bonus-serveur.ts` importe `next/navigation` (par `utils/deroule/acces.ts`) et ne se
//    charge pas hors de Next : la couture ⑤ rejoue sa reprise À L'IDENTIQUE — mêmes
//    `retenusPourLaPose`, `candidatsPour(…, compo.objets)` et `poserLaSemaine(…, { dejaPoses,
//    maxAPoser: 1 })` —, en mémoire, sans écrire. Le bouton lui-même n'est pas de ce lot.
const { chargerDoctrineDepuisBase } = await import(`${RACINE}/utils/fabrique/doctrine.ts`)
const { instrumentDuRouteur } = await import(`${RACINE}/utils/moteur/etat-serveur.ts`)
const { lireLesSegments, segmentDuCycle } = await import(`${RACINE}/utils/moteur/calendrier-serveur.ts`)
const { lireLesInscriptions, lireLeProfil, lireLesNiveaux, lireLesFiches } = await import(`${RACINE}/utils/routeur/donnees.ts`)
const { budgetDeLEleve } = await import(`${RACINE}/utils/routeur/budget.ts`)

const lu = (quoi, r) => { if (r.error) throw new Error(`${quoi} — ${r.error.code} ${r.error.message}`); return r.data }
/** Un dépôt RÉUSSI de décor, au sens du `10-` §7 : les jetons aux crans 1 et 3, le juge du cran ailleurs. */
const depotReussi = (objet, id, cran, at, devoirs) => ({
  depotId: id, objet, cran, variante: null, at, devoirs, zones: [],
  credence: cran === 1 || cran === 3 ? [{ cas: 1, jetons: [100, 0, 0, 0], index_correct: 0 }] : [],
  verdicts: cran === 1 || cran === 3 ? {} : { v1: { reussi: true, probleme_present: false, probleme_vu: null, passage: null, motif: 'décor', version: 'v1', cran, at, modele: 'décor' } },
})
const un = (x) => (Array.isArray(x) ? x[0] ?? null : x)
const titre = (t) => console.log(`\n${'═'.repeat(78)}\n${t}\n${'═'.repeat(78)}`)
const compte = (liste, cle) => { const m = new Map(); for (const x of liste) { const k = cle(x); m.set(k, (m.get(k) ?? 0) + 1) } return [...m].sort((p, q) => q[1] - p[1]) }
const fmt = (m) => m.map(([k, n]) => `${k} ${n}`).join(' · ') || 'aucun'

// ── L'ÉLÈVE DE DÉCOR ─────────────────────────────────────────────────────────
async function eleveDeDecor() {
  const voulu = arg('--eleve')
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 })
  if (voulu) {
    const u = users.find((x) => x.email === voulu || x.id === voulu)
    if (!u) throw new Error(`élève « ${voulu} » introuvable`)
    return u
  }
  // Le premier élève actif en TC seul, sans aucun dépôt sur un exercice du gabarit
  // (sa semaine 1 est devant lui), avec une lettre en Argumentation et en Structure.
  const { data: classes } = await admin.from('classes').select('id, type_pedagogique').eq('statut', 'active')
  const tc = new Set((classes ?? []).filter((c) => c.type_pedagogique === 'tc').map((c) => c.id))
  const { data: ins } = await admin.from('inscriptions').select('eleve_id, classe_id').eq('statut', 'active').limit(5000)
  const parEleve = new Map()
  for (const i of ins ?? []) parEleve.set(i.eleve_id, [...(parEleve.get(i.eleve_id) ?? []), i.classe_id])
  const { data: depots } = await admin.from('exercices_depots').select('eleve_id, exercices!inner(id_import)').like('exercices.id_import', 'ex-gab-%').limit(10000)
  const dejaGabarit = new Set((depots ?? []).map((d) => d.eleve_id))
  for (const [id, cl] of parEleve) {
    if (!cl.every((c) => tc.has(c)) || dejaGabarit.has(id)) continue
    const u = users.find((x) => x.id === id)
    if (!u || u.email === env.TEST_ELEVE_EMAIL) continue
    const niv = await lireLesNiveaux(admin, id)
    if (niv.some((n) => n.competence === 'argumentation' && n.lettre) && niv.some((n) => n.competence === 'structure' && n.lettre)) return u
  }
  throw new Error('aucun élève de décor : TC seul, sans dépôt du gabarit, avec une lettre en Argumentation et en Structure')
}

async function socle(eleveId) {
  const niveaux = lu('niveaux', await admin.from('competences_niveaux').select('*').eq('eleve_id', eleveId))
  const dec = lu('décisions', await admin.from('routeur_decisions').select('id').limit(20000))
  const dep = lu('dépôts', await admin.from('exercices_depots').select('id').limit(20000))
  const assi = lu('assiduité', await admin.from('assiduite_hebdo').select('*').eq('eleve_id', eleveId))
  const ex = lu('exercices', await admin.from('exercices').select('id, statut').like('id_import', 'ex-gab-%').limit(5000))
  return { niveaux, dec, dep, assi, ex }
}

// ── ① LA CLÉ DE L'INSTANCE → L'OBSERVABLE ────────────────────────────────────
async function coutureUn(doctrine) {
  titre('① LA CLÉ DE L\'INSTANCE → L\'OBSERVABLE — `lireLesInstances`, sur les exercices 1.5 du bac à sable')
  const { instances, incidents } = await lireLesInstances(admin, doctrine)
  const gab = instances.filter((i) => i.cle !== null && i.cle !== undefined)
  const { data: ex } = await admin.from('exercices').select('id').like('id_import', 'ex-gab-%').limit(5000)
  console.log(`exercices 1.5 en base : ${(ex ?? []).length} · instances lues avec une clé : ${gab.length} · incidents de lecture : ${incidents.length}`)
  const avecObs = gab.filter((i) => i.observable)
  const sansObs = gab.filter((i) => !i.observable)
  console.log(`clés distinctes : ${new Set(gab.map((i) => i.cle)).size} · instances avec observable : ${avecObs.length} · sans observable (clé sans route) : ${sansObs.length}`)
  console.log('sans observable, par clé :', fmt(compte(sansObs, (i) => i.cle)))
  console.log('avec observable, par objet :', fmt(compte(avecObs, (i) => i.objet)))
  console.log('avec observable, par compétence :', fmt(compte(avecObs, (i) => i.observable.competence)))
  // ⚠️ Piège 19 — un code de la grille absent de l'instrument est un code que la chaîne ne mesure pas.
  const horsInstrument = new Map()
  const connus = new Map()
  for (const i of avecObs) {
    const comp = i.observable.competence
    if (!connus.has(comp)) connus.set(comp, new Set(Object.keys(instrumentDuRouteur(comp)?.observablesMesure ?? {})))
    if (!connus.get(comp).has(i.observable.code)) horsInstrument.set(comp, (horsInstrument.get(comp) ?? new Map()).set(i.observable.code, (horsInstrument.get(comp)?.get(i.observable.code) ?? 0) + 1))
  }
  console.log('codes ABSENTS de l\'instrument (instances) :', [...horsInstrument].map(([c, m]) => `${c} → ${[...m].map(([k, n]) => `${k} ${n}`).join(', ')}`).join(' | ') || 'aucun')
  // Piège 14 — sous le gabarit, `ciblables` se réduit à la compétence de l'observable.
  const vivier = constituerLeVivier(gab.map((i) => ({ ...i, statut: 'concu' })), { parcours: ['tc'], coursVus: new Set(), positionsDeLecture: new Map(), instancesDejaDeposees: new Set(), classesDeLEleve: new Set() })
  const ecarts = vivier.retenus.filter((r) => r.instance.observable && (r.ciblables.length !== 1 || r.ciblables[0] !== r.instance.observable.competence))
  console.log(`retenues au vivier (statut forcé concu, sans porte) : ${vivier.retenus.length} · dont ciblables ≠ {compétence de l'observable} : ${ecarts.length}`
    + (ecarts.length ? ` — ex. ${ecarts.slice(0, 3).map((r) => `${r.instance.objet}/${r.instance.cranNumero} ciblables [${r.ciblables}] obs ${r.instance.observable.competence}`).join(' ; ')}` : ''))
  console.log('écarts du vivier :', fmt(compte(vivier.ecartes, (e) => e.motif)))
  return { instances, gab }
}

// ── ② LE REGISTRE DE DÉCOR ───────────────────────────────────────────────────
function coutureDeux() {
  titre('② LE REGISTRE → `etatDeLObjet` — trois registres de décor (patron `epreuve-porte-registre.mjs`)')
  const BANQUE = [1, 2, 3, 4, 5, 7, 9]
  const depot = (id, cran, at, devoirs) => depotReussi('argument', id, cran, at, devoirs)
  const A = deriverLeRegistre([depot('d1', 1, '2026-09-01T10:00:00Z', ['dev-a']), depot('d2', 1, '2026-09-01T11:00:00Z', ['dev-a'])])
  const vA = etatDeLObjet(A, 'argument', true, 'D', BANQUE)
  console.log(`A. deux réussites au 1, MÊME devoir, MÊME jour : crans débloqués [${cransDebloques(A, 'argument')}] · état ${vA.etat} · cran à servir ${vA.cranAServir} — ${vA.motif}`)
  const B = deriverLeRegistre([depot('d1', 1, '2026-09-01T10:00:00Z', ['dev-a']), depot('d2', 1, '2026-09-08T10:00:00Z', ['dev-b'])])
  const vB = etatDeLObjet(B, 'argument', true, 'D', BANQUE)
  console.log(`B. deux réussites au 1, DEUX devoirs, un cycle d'écart : crans débloqués [${cransDebloques(B, 'argument')}] · état ${vB.etat} · cran à servir ${vB.cranAServir}`)
  const C = deriverLeRegistre([1, 2, 3, 4, 5].flatMap((c) => [depot(`${c}a`, c, '2026-09-01T10:00:00Z', [`dev-${c}a`]), depot(`${c}b`, c, '2026-09-08T10:00:00Z', [`dev-${c}b`])]))
  const vC = etatDeLObjet(C, 'argument', true, 'D', BANQUE)
  console.log(`C. toute la bande d'E-D tenue : état ${vC.etat} · bande [${vC.bande}] — ${vC.motif}`)
  const vD = etatDeLObjet(C, 'argument', false, 'D', BANQUE)
  console.log(`D. le même registre, objet jamais servi sous le gabarit : état ${vD.etat}`)
  const vE = etatDeLObjet([], 'argument', true, 'D', [1, 3, 4, 5, 7, 9])
  console.log(`E. la banque de production (sans cran 2) : bande [${vE.bande}] · absents [${vE.cransAbsents}] · cran à servir ${vE.cranAServir}`)
  const ok = vA.etat === 'ouvert' && vA.cranAServir === 1 && vB.cranAServir === 2 && vC.etat === 'tenu' && vD.etat === 'methode' && vE.cranAServir === 1
  console.log(ok ? '✅ couture ② tenue' : '⛔ couture ② NON tenue')
  return ok
}

// ── ③ LA PORTE ET LA QUARANTAINE, avec l'ordre par objet ─────────────────────
function coutureTrois(gab, doctrine) {
  titre('③ LA PORTE ET LA QUARANTAINE → la phase B par objet — décor sur les instances réelles de « argument »')
  const miennes = gab.filter((i) => i.objet === 'argument' && i.cranNumero !== null).map((i) => ({ ...i, statut: 'concu' }))
  const devoirs = [...new Set(miennes.flatMap((i) => i.devoirs))]
  console.log(`${miennes.length} instance(s) de « argument » · ${devoirs.length} devoir(s) distinct(s) · crans ${fmt(compte(miennes, (i) => i.cranNumero))}`)
  const base = { parcours: ['tc'], coursVus: new Set(), positionsDeLecture: new Map(), instancesDejaDeposees: new Set(), classesDeLEleve: new Set() }
  const paliers = new Map([['argumentation', 'D']])
  const cransParObjet = cransPortesParLaBanque(miennes)
  // a) En MÉTHODE : le même devoir aux crans de la séquence.
  const porteM = { actif: true, de: (o) => porteDeLObjet([], o, false) }
  const vM = constituerLeVivier(miennes, { ...base, porte: porteM, devoirsServis: new Map(), cycleLundi: CYCLE_2 })
  const bM = bornerLaMethode(vM.retenus, ['argumentation'], paliers, true, 2)
  console.log(`a) méthode : ${bM.retenus.length} retenue(s) sur un seul devoir ? ${new Set(bM.retenus.map((r) => r.methode?.devoir)).size === 1} — séquence ${bM.retenus.map((r) => r.instance.cranNumero).join(' → ')} (devoir ${(bM.retenus[0]?.methode?.devoir ?? '?').slice(0, 8)})`)
  // b) OUVERT : le devoir de la méthode a été servi le cycle d'avant ; UN exercice, sur un AUTRE devoir.
  const devoirServi = bM.retenus[0]?.methode?.devoir
  const registre = deriverLeRegistre([]) // rien de réussi encore : le 1 reste le cran non tenu le plus bas
  const porteO = { actif: true, de: (o) => porteDeLObjet(registre, o, true) }
  const vO = constituerLeVivier(miennes, { ...base, porte: porteO, devoirsServis: new Map([[devoirServi, `${CYCLE_1}T12:00:00Z`]]), cycleLundi: CYCLE_2 })
  const enQuarantaine = vO.ecartes.filter((e) => e.motif === 'devoir_en_quarantaine')
  const ctx = contexteDesObjets({ registre, dejaServis: new Set(['argument']), paliers, cransParObjet, observables: new Map(), mesuresParCode: new Map(), plafond: 60, situation: 'tc_seul' })
  const ordonnes = ordonnerParObjet(candidatsPour(vO.retenus, 'argumentation', []), vO.retenus, 'argumentation', [], ctx).sort((p, q) => p.ordre.rang - q.ordre.rang)
  const semaine = poserLaSemaine([{ competence: 'argumentation', regle: 'R2', motif: '' }], { plancher: 45, plafond: 60, optionnel: 30 },
    (comp, poses) => candidatsPour(vO.retenus, comp, poses, false, ctx))
  const posesArg = semaine.exercices.map((e) => vO.retenus.find((r) => r.instance.exerciceId === e.candidat.exerciceId))
  console.log(`b) ouvert : ${enQuarantaine.length} instance(s) du devoir servi écartée(s) \`devoir_en_quarantaine\` · candidats ordonnés ${ordonnes.length} (crans ${[...new Set(ordonnes.map((c) => c.cran))].join(',')}) `
    + `· la phase B pose ${semaine.exercices.length} exercice(s) sur « argument » — cran ${posesArg.map((r) => r?.instance.cranNumero).join(',')}, devoir ${posesArg.map((r) => (r?.devoir.ids[0] ?? '?').slice(0, 8)).join(',')} ≠ ${String(devoirServi).slice(0, 8)} ? ${posesArg.every((r) => !r?.devoir.ids.includes(devoirServi))}`)
  console.log(`   motif d'arrêt de la phase B : ${semaine.journal.motifArret}`)
  console.log(`   écarts par objet : ${[...ctx.journal.ecartes.values()].map((e) => `${e.motif} — ${e.detail.slice(0, 110)}`).join(' | ') || 'aucun'}`)
  const ok = bM.retenus.length >= 3 && new Set(bM.retenus.map((r) => r.methode?.devoir)).size === 1 && enQuarantaine.length > 0
    && semaine.exercices.length === 1 && posesArg.every((r) => !r?.devoir.ids.includes(devoirServi)) && posesArg[0]?.instance.cranNumero === 1
  console.log(ok ? '✅ couture ③ tenue' : '⛔ couture ③ NON tenue')
  return ok
}

// ── LES DÉCISIONS EN BASE, LUES PAR REQUÊTE ──────────────────────────────────
async function decisionsDuCycle(eleveId, cycle) {
  const { data, error } = await admin.from('routeur_decisions')
    .select('id, cycle_lundi, cible_retenue, regle_declenchee, bonus, degrade, alternatives_ecartees, sondes_retenues, exercices(cran, id_import, exercices_types(code), exercices_cas(materiau_id, probleme))')
    .eq('eleve_id', eleveId).eq('cycle_lundi', cycle).order('created_at', { ascending: true }).order('id', { ascending: true })
  if (error) throw new Error(error.message)
  return data ?? []
}
function decrire(d) {
  const ex = un(d.exercices); const o = d.alternatives_ecartees?.objet ?? null
  const dev = (d.alternatives_ecartees?.devoir?.ids ?? []).map((x) => x.slice(0, 8)).join('+')
  return `${(un(ex?.exercices_types)?.code ?? '?').padEnd(11)} cran ${ex?.cran} · ${d.cible_retenue?.padEnd(13)} · devoir ${dev || '∅'} · `
    + (o ? `objet ${o.etat}/${o.entree}${o.cran_a_servir ? ` (à servir ${o.cran_a_servir})` : ''} · obs ${o.observable?.code ?? '∅'} [${o.observable?.regle ?? '∅'}]` : 'objet ∅')
    + (d.alternatives_ecartees?.methode ? ` · méthode rang ${d.alternatives_ecartees.methode.rang}/${d.alternatives_ecartees.methode.sequence.join('·')}` : '')
    + (d.bonus ? ' · BONUS' : '') + (d.alternatives_ecartees?.porte_registre ? ` · porte ${d.alternatives_ecartees.porte_registre}` : '')
}

// ── ④ ET ⑤ — LA POSE ET LE PULL, EN BASE ─────────────────────────────────────
async function essai() {
  if (fs.existsSync(REGISTRE)) throw new Error(`un essai est déjà en cours (${REGISTRE}). \`--retire\` d'abord.`)
  const u = await eleveDeDecor()
  const eleveId = u.id
  titre(`L'ÉLÈVE DE DÉCOR : ${u.email} (${eleveId.slice(0, 8)})`)
  const ins = await lireLesInscriptions(admin, eleveId)
  const profil = await lireLeProfil(admin, eleveId)
  const budget = budgetDeLEleve(ins, profil.reglage)
  const niveaux = await lireLesNiveaux(admin, eleveId)
  console.log(`inscriptions ${ins.map((i) => `${i.classeNom}/${i.typePedagogique}`).join(', ')} · situation ${budget.situation} · budget ${JSON.stringify(budget.budget)}`)
  console.log(`lettres ${niveaux.map((n) => `${n.competence}=${n.lettre ?? '∅'}`).join(' · ')}`)
  const decoupe = await lireLesSegments(admin)
  for (const c of [CYCLE_1, CYCLE_2]) console.log(`cycle ${c} : ${segmentDuCycle(decoupe, c).motif}`)

  const avant = await socle(eleveId)
  fs.writeFileSync(REGISTRE, JSON.stringify({ eleveId, email: u.email, ...avant }, null, 2))
  console.log(`\nregistre AVANT écrit : ${REGISTRE} (${avant.niveaux.length} niveaux, ${avant.dec.length} décisions, ${avant.dep.length} dépôts, ${avant.assi.length} lignes d'assiduité, ${avant.ex.length} exercices 1.5 dont ${avant.ex.filter((e) => e.statut === 'a_concevoir').length} a_concevoir)`)

  // LE DÉCOR, ET IL SE DIT : D en Argumentation et en Structure (la séquence E-D,
  // et la bande 1·2·3·4·5 — voir la question ouverte sur le palier C au relevé),
  // et les instances 1.5 passées `concu` (le geste de `passer-concu.mjs`).
  for (const comp of ['argumentation', 'structure']) {
    const n = niveaux.find((x) => x.competence === comp)
    if (n && n.lettre !== 'D' && n.lettre !== 'E') {
      lu(`lettre ${comp}`, await admin.from('competences_niveaux').update({ lettre: 'D' }).eq('eleve_id', eleveId).eq('competence', comp).select('competence'))
      console.log(`décor : ${comp} ${n.lettre} → D`)
    }
  }
  const aPasser = avant.ex.filter((e) => e.statut === 'a_concevoir').map((e) => e.id)
  for (let i = 0; i < aPasser.length; i += 200) {
    lu('passer concu', await admin.from('exercices').update({ statut: 'concu' }).in('id', aPasser.slice(i, i + 200)).eq('statut', 'a_concevoir').select('id'))
  }
  console.log(`décor : ${aPasser.length} instance(s) 1.5 passée(s) concu`)

  const doctrine = await chargerDoctrineDepuisBase(admin)
  const { gab } = await coutureUn(doctrine)
  const ok2 = coutureDeux()
  const ok3 = coutureTrois(gab, doctrine)

  // ④ SEMAINE 1 — la pose, en base.
  titre(`④ LA POSE ET LE JOURNAL — semaine 1, cycle ${CYCLE_1}, \`poserLesSemainesDuRouteur\` sur le seul élève de décor`)
  const porteAvant = await lireLaPorteDesCrans(admin, eleveId, CYCLE_1)
  console.log(`porte active ${porteAvant.actif} · objets déjà servis sous le gabarit avant ${CYCLE_1} : [${[...porteAvant.dejaServis]}] · registre ${porteAvant.registre.length} ligne(s)`)
  const b1 = await poserLesSemainesDuRouteur(admin, FUSEAU, CYCLE_1, { cycleDemande: CYCLE_1, elevesDemandes: [eleveId] })
  console.log(`bilan : segment ${b1.segment} · servis ${b1.elevesServis}/${b1.elevesAttendus} · exercices ${b1.exercicesPoses} · décisions ${b1.decisionsEcrites} · dépôts ${b1.depotsPoses} · écart au plancher ${JSON.stringify(b1.ecartsAuPlancher)} · erreurs ${JSON.stringify(b1.erreurs.slice(0, 4))}`)
  console.log(`écarts du vivier : ${JSON.stringify(b1.ecartsDuVivier)}`)
  if (b1.nonServis.length) console.log('non servis :', JSON.stringify(b1.nonServis))
  const d1 = await decisionsDuCycle(eleveId, CYCLE_1)
  console.log(`\n${d1.length} décision(s) en base pour ${CYCLE_1} (requête sur routeur_decisions) :`)
  for (const d of d1) console.log('  ', decrire(d))
  const objets1 = [...new Set(d1.map((d) => un(d.exercices)?.exercices_types?.code ?? un(un(d.exercices)?.exercices_types)?.code))]
  const enMethode1 = d1.filter((d) => d.alternatives_ecartees?.objet?.etat === 'methode')
  const ecartes1 = d1[0]?.alternatives_ecartees?.objet?.ecartes ?? []
  console.log(`objets servis : [${objets1}] · décisions en méthode : ${enMethode1.length}/${d1.length} · semaine_1 au journal : ${d1[0]?.alternatives_ecartees?.objet?.semaine_1}`)
  console.log(`objets écartés au journal : ${ecartes1.map((e) => `${e.objet} ${e.motif}`).join(' · ') || 'aucun'}`)
  const fq1a = objets1.length === 2 && enMethode1.length === d1.length && d1.length > 0
  console.log(fq1a ? '✅ fait quand (1a) : la semaine 1 pose deux objets en méthode' : '⛔ fait quand (1a) NON tenu')

  // ④ SEMAINE 2 — un exercice sur chacun des deux, sur un autre devoir ; un troisième objet entre (un seul, en TC).
  titre(`④ LA POSE ET LE JOURNAL — semaine 2, cycle ${CYCLE_2}`)
  const porte2 = await lireLaPorteDesCrans(admin, eleveId, CYCLE_2)
  const devoirs2 = await lireLesDevoirsServis(admin, [eleveId])
  console.log(`objets déjà servis sous le gabarit avant ${CYCLE_2} : [${[...porte2.dejaServis]}] · devoirs servis : ${[...devoirs2.parEleve.get(eleveId) ?? []].map(([d, at]) => `${d.slice(0, 8)}@${at.slice(0, 10)}`).join(', ')}`)
  const b2 = await poserLesSemainesDuRouteur(admin, FUSEAU, CYCLE_2, { cycleDemande: CYCLE_2, elevesDemandes: [eleveId] })
  console.log(`bilan : servis ${b2.elevesServis}/${b2.elevesAttendus} · exercices ${b2.exercicesPoses} · décisions ${b2.decisionsEcrites} · dépôts ${b2.depotsPoses} · minutes remplies ${b2.minutesRemplies} · erreurs ${JSON.stringify(b2.erreurs.slice(0, 4))}`)
  console.log(`écarts du vivier : ${JSON.stringify(b2.ecartsDuVivier)}`)
  const d2 = await decisionsDuCycle(eleveId, CYCLE_2)
  console.log(`\n${d2.length} décision(s) en base pour ${CYCLE_2} :`)
  for (const d of d2) console.log('  ', decrire(d))
  const devoirsS1 = new Set(d1.flatMap((d) => d.alternatives_ecartees?.devoir?.ids ?? []))
  const ouverts2 = d2.filter((d) => d.alternatives_ecartees?.objet?.etat === 'ouvert')
  const neufs2 = [...new Set(d2.filter((d) => d.alternatives_ecartees?.objet?.etat === 'methode').map((d) => d.alternatives_ecartees.objet.objet))]
  const autreDevoir = ouverts2.every((d) => !(d.alternatives_ecartees?.devoir?.ids ?? []).some((x) => devoirsS1.has(x)))
  const unParObjet = [...compte(ouverts2, (d) => d.alternatives_ecartees.objet.objet)].every(([, n]) => n === 1)
  console.log(`objets ouverts servis : ${fmt(compte(ouverts2, (d) => d.alternatives_ecartees.objet.objet))} · un par objet ? ${unParObjet} · sur un autre devoir que la semaine 1 ? ${autreDevoir}`)
  console.log(`objets neufs en méthode : [${neufs2}] (TC : un seul attendu) · écartés au journal : ${(d2[0]?.alternatives_ecartees?.objet?.ecartes ?? []).map((e) => `${e.objet} ${e.motif}`).join(' · ') || 'aucun'}`)
  const fq1b = ouverts2.length >= 1 && unParObjet && autreDevoir && neufs2.length === 1
  console.log(fq1b ? '✅ fait quand (1b) : un exercice par objet ouvert, sur un autre devoir, et un troisième objet en méthode' : '⚠️ fait quand (1b) : à lire ligne par ligne ci-dessus')

  // (2) LE BUDGET ÉPUISÉ — en mémoire, sur la composition réelle du cycle 2 : le plafond réduit à 20 min.
  titre('FAIT QUAND (2) — le budget épuisé : aucun objet neuf n\'entre, et la décision le dit (en mémoire, plafond 20)')
  const contexte = await contextePose(eleveId, CYCLE_2, doctrine)
  const compo = await composerPourUnEleve(admin, contexte, () => 0.5)
  compo.decisions = compo.decisions.filter((d) => d.cycleLundi !== CYCLE_2)
  const retenus = retenusPourLaPose(compo).retenus
  if (compo.objets) compo.objets.plafond = 20
  const s20 = poserLaSemaine(compo.listeComplete, { ...compo.budget.budget, plafond: 20 },
    (comp, poses) => candidatsPour(retenus, comp, poses, compo.expressionEnSecondaire, compo.objets), compo.journal.tirer('phase_b'))
  const horsBudget = [...(compo.objets?.journal.ecartes.values() ?? [])].filter((e) => e.motif === 'objet_entree_hors_budget')
  console.log(`posés ${s20.exercices.length} (${s20.exercices.map((e) => `${retenus.find((r) => r.instance.exerciceId === e.candidat.exerciceId)?.instance.objet}/${e.candidat.cran}`).join(', ')}) · arrêt : ${s20.journal.motifArret}`)
  console.log(`objets neufs hors budget : ${horsBudget.map((e) => `${e.objet} — ${e.detail}`).join(' | ') || 'aucun'}`)
  console.log(horsBudget.length ? '✅ fait quand (2) : l\'entrée hors budget est dite' : '⚠️ fait quand (2) : aucun objet neuf candidat à cette composition (voir écarts)')

  // (3) ENTRE DEUX OBJETS OUVERTS, CELUI DONT L'OBSERVABLE EST NON ACQUIS PASSE D'ABORD — en mémoire, observables de décor.
  titre('FAIT QUAND (3) — entre deux objets ouverts, l\'observable non acquis d\'abord, motif journalisé (en mémoire)')
  {
    // Deux objets de la même compétence, tenus pour OUVERTS par décor : le premier servi, et un second de la banque.
    const oA = [...porte2.dejaServis][0] ?? 'argument'
    const comp0 = contexte.instances.find((i) => i.cle && i.objet === oA)?.observable?.competence ?? 'argumentation'
    const oB = [...new Set(contexte.instances.filter((i) => i.cle && i.objet !== oA && i.observable?.competence === comp0).map((i) => i.objet))][0]
    const inst = contexte.instances.filter((i) => i.cle && (i.objet === oA || i.objet === oB) && i.cranNumero === 1)
    const comp = comp0
    const codesA = [...new Set(inst.filter((i) => i.objet === oA).map((i) => i.observable?.code).filter(Boolean))]
    const codesB = [...new Set(inst.filter((i) => i.objet === oB).map((i) => i.observable?.code).filter(Boolean))]
    const decor = (acquis) => contexteDesObjets({ registre: [], dejaServis: new Set([oA, oB]), paliers: new Map([[comp, 'D']]),
      cransParObjet: cransPortesParLaBanque(contexte.instances), observables: new Map([[comp, { acquis: new Set(acquis), connus: new Set([...codesA, ...codesB]) }]]),
      mesuresParCode: new Map(), plafond: 60, situation: 'tc_seul' })
    const v = constituerLeVivier(inst, { parcours: ['tc'], coursVus: new Set(), positionsDeLecture: new Map(), instancesDejaDeposees: new Set(), classesDeLEleve: new Set(),
      porte: { actif: true, de: (o) => porteDeLObjet([], o, true) } })
    const premier = (ctxO) => { const o = ordonnerParObjet(candidatsPour(v.retenus, comp, []), v.retenus, comp, [], ctxO).sort((p, q) => p.ordre.rang - q.ordre.rang); return o[0] }
    const pA = premier(decor(codesA)); const pB = premier(decor(codesB))
    const objetDe = (c) => v.retenus.find((r) => r.instance.exerciceId === c?.exerciceId)?.instance.objet
    console.log(`objets « ${oA} » (codes ${codesA}) et « ${oB} » (codes ${codesB}), compétence ${comp}, ${v.retenus.length} instance(s) au cran 1`)
    console.log(`  ${oA} acquis ⇒ premier : ${objetDe(pA)} — ${pA?.ordre.motif}`)
    console.log(`  ${oB} acquis ⇒ premier : ${objetDe(pB)} — ${pB?.ordre.motif}`)
    const ok = objetDe(pA) === oB && objetDe(pB) === oA
    console.log(ok ? '✅ fait quand (3) tenu' : '⚠️ fait quand (3) : voir ci-dessus')
  }

  // (4) UN OBJET TENU N'EST PLUS POSÉ AU CENTRE ET N'APPARAÎT QU'EN SONDE — en mémoire, registre de décor.
  titre('FAIT QUAND (4) — un objet tenu n\'est plus posé au centre et n\'apparaît qu\'en sonde (en mémoire, registre de décor)')
  {
    const objet = [...porte2.dejaServis][0]
    const inst = contexte.instances.filter((i) => i.cle && i.objet === objet)
    const comp = inst[0]?.observable?.competence ?? 'argumentation'
    const registre = deriverLeRegistre([1, 2, 3, 4, 5].flatMap((c) => [
      depotReussi(objet, `${c}a`, c, '2026-08-31T10:00:00Z', [`x${c}a`]),
      depotReussi(objet, `${c}b`, c, '2026-09-07T10:00:00Z', [`x${c}b`])]))
    const porte = { actif: true, de: (o) => porteDeLObjet(registre, o, true) }
    const v = constituerLeVivier(inst, { parcours: ['tc'], coursVus: new Set(), positionsDeLecture: new Map(), instancesDejaDeposees: new Set(), classesDeLEleve: new Set(), porte })
    const ctxT = contexteDesObjets({ registre, dejaServis: new Set([objet]), paliers: new Map([[comp, 'D']]), cransParObjet: cransPortesParLaBanque(contexte.instances),
      observables: new Map(), mesuresParCode: new Map(), plafond: 60, situation: 'tc_seul' })
    const vie = vieDeLObjet(ctxT, objet, comp)
    const o = ordonnerParObjet(candidatsPour(v.retenus, comp, []), v.retenus, comp, [], ctxT).sort((p, q) => p.ordre.rang - q.ordre.rang)
    const crans = [...new Set(o.map((c) => v.retenus.find((r) => r.instance.exerciceId === c.exerciceId)?.instance.cranNumero))]
    console.log(`« ${objet} » — registre : crans 1..5 tenus (deux devoirs, un cycle d'écart) · porte ouvre [${porte.de(objet).ouverts}] · état ${vie.etat} · bande [${vie.bande}]`)
    console.log(`  retenues au vivier ${v.retenus.length} (crans ${[...new Set(v.retenus.map((r) => r.instance.cranNumero))].sort()}) · ordonnées ${o.length}, crans [${crans}] — ${o[0]?.ordre.motif ?? '(rien)'}`)
    console.log(`  écarts : ${[...ctxT.journal.ecartes.values()].map((e) => `${e.motif}`).join(', ') || 'aucun'}`)
    const ok = vie.etat === 'tenu' && crans.every((c) => c > 5) && [...ctxT.journal.ecartes.values()].some((e) => e.motif === 'objet_tenu')
    console.log(ok ? '✅ fait quand (4) tenu' : '⚠️ fait quand (4) : voir ci-dessus')
  }

  // (5) AU CRAN 6, L'EXERCICE PORTE UNE CIBLE SECONDAIRE QUAND LE GRAIN L'AUTORISE — sur la banque 1.4 du bac à sable.
  titre('FAIT QUAND (5) — au cran 6, une cible secondaire quand le grain l\'autorise (banque 1.4, en mémoire)')
  {
    // Décor : les textes de la banque 1.4 sont rattachés par notions, que la couche 4 ne lit pas encore
    // (`cours_par_notions_non_lu`) — on les tient pour génériques, pour éprouver PB4 seul.
    const six = contexte.instances.filter((i) => !i.cle && i.cranNumero === 6)
      .map((i) => ({ ...i, materiaux: i.materiaux.map((m) => ({ ...m, coursEtat: 'generique' })) }))
    const v = constituerLeVivier(six, { parcours: ['tc', 'hlp'], coursVus: new Set(), positionsDeLecture: new Map(), instancesDejaDeposees: new Set(), classesDeLEleve: new Set() })
    const avec = []; const sans = []
    for (const r of v.retenus) for (const comp of r.ciblables) {
      const c = candidatsPour([r], comp, [])[0]
      if (!c) continue
      ;(c.ciblesSecondaires.length ? avec : sans).push(`${r.instance.objet}/${r.instance.grain}→${comp}+${c.ciblesSecondaires.join('+') || '∅'}`)
    }
    console.log(`instances 1.4 au cran 6 : ${six.length} · retenues (parcours tc+hlp, sans cours) : ${v.retenus.length} · écarts ${fmt(compte(v.ecartes, (e) => e.motif))}`)
    console.log(`  avec cible secondaire : ${avec.length} — ${avec.slice(0, 6).join(' ; ')}${avec.length > 6 ? ' …' : ''}`)
    console.log(`  sans (grain micro, ou une seule ciblable) : ${sans.length} — ${sans.slice(0, 4).join(' ; ')}`)
    console.log(avec.length ? '✅ fait quand (5) tenu' : '⚠️ fait quand (5) : aucune instance retenue au cran 6')
  }

  // ⑤ LE PULL — après la semaine 2 posée : la reprise de `bonus-serveur.ts`, rejouée à l'identique, en mémoire.
  titre(`⑤ LE PULL → la reprise de \`bonus-serveur.ts\`, après la semaine du ${CYCLE_2} — le suivant dans l'ordre par objet`)
  {
    const compoP = await composerPourUnEleve(admin, contexte, () => 0.5)
    const retenusP = retenusPourLaPose(compoP).retenus
    const parId = new Map(contexte.instances.map((i) => [i.exerciceId, i]))
    const dejaPoses = d2.filter((d) => !d.bonus).map((d) => {
      const inst = parId.get(un(d.exercices)?.id ?? '') ?? contexte.instances.find((i) => i.exerciceId === d.exercice_id)
      return inst && d.cible_retenue ? { candidat: { exerciceId: inst.exerciceId, competence: d.cible_retenue, grain: inst.grain, geste: inst.geste, cran: inst.cranCode ?? '',
        mode: (inst.modesParCompetence[d.cible_retenue] ?? [])[0] ?? '', dureeMin: inst.dureeMin ?? 0, ciblesSecondaires: [],
        ordre: { rang: 0, objet: inst.objet, motif: 'déjà posé cette semaine' } }, regle: 'R1', departageParPB3: false, tirage: false, tour: d.alternatives_ecartees?.tour_de_pb5 ?? 0 } : null
    }).filter(Boolean)
    const minutesSemaine = dejaPoses.reduce((n, e) => n + e.candidat.dureeMin, 0)
    const objetsSemaine = new Set(dejaPoses.map((e) => e.candidat.ordre.objet))
    let restant = compoP.budget.budget.optionnel
    const poses = [...dejaPoses]
    console.log(`semaine posée : ${dejaPoses.length} exercice(s), ${minutesSemaine} min, objets [${[...objetsSemaine]}] · quota optionnel ${restant} min`)
    for (let i = 0; i < 4; i++) {
      if (compoP.objets) compoP.objets.plafond = minutesSemaine + restant
      const passe = poserLaSemaine(compoP.listeComplete, { ...compoP.budget.budget, plafond: minutesSemaine + restant },
        (comp, p) => candidatsPour(retenusP, comp, p, compoP.expressionEnSecondaire, compoP.objets), compoP.journal.tirer('phase_b'), { dejaPoses: poses, maxAPoser: 1 })
      const elu = passe.posesDeCettePasse[0]
      if (!elu) { console.log(`pull ${i + 1} : rien ne tient — ${passe.journal.motifArret} · écarts par objet : ${[...(compoP.objets?.journal.ecartes.values() ?? [])].map((e) => `${e.objet} ${e.motif}`).join(', ') || 'aucun'}`); break }
      const r = retenusP.find((x) => x.instance.exerciceId === elu.candidat.exerciceId)
      const objet = r?.instance.objet
      const dejaServiCeCycle = objetsSemaine.has(objet) || poses.slice(dejaPoses.length).some((p) => p.candidat.ordre?.objet === objet)
      console.log(`pull ${i + 1} : ${objet}/${r?.instance.cranNumero} (${elu.candidat.competence}, ${elu.candidat.dureeMin} min) · ${elu.candidat.ordre?.motif ?? ''} · objet déjà servi ce cycle en ouvert ? ${dejaServiCeCycle && r?.porte !== 'methode'}`)
      poses.push(elu); restant -= elu.candidat.dureeMin
      if (restant <= 0) { console.log('quota épuisé'); break }
    }
  }

  titre('RÉCAPITULATIF')
  console.log(`couture ② ${ok2 ? '✅' : '⛔'} · couture ③ ${ok3 ? '✅' : '⛔'} · fait quand (1a) ${fq1a ? '✅' : '⛔'} · (1b) ${fq1b ? '✅' : '⚠️'}`)
  const apres = await socle(eleveId)
  console.log(`décisions ${avant.dec.length} → ${apres.dec.length} · dépôts ${avant.dep.length} → ${apres.dep.length} · ⚠️ \`--retire\` repose tout.`)
}

async function contextePose(eleveId, cycle, doctrine) {
  const { lireLesInstancesDejaDeposees, lireLesPositionsDeLecture, lireLesCoursVus } = await import(`${RACINE}/utils/moteur/vivier-serveur.ts`)
  const decoupe = await lireLesSegments(admin)
  const s = segmentDuCycle(decoupe, cycle)
  const { instances } = await lireLesInstances(admin, doctrine)
  const inscriptions = await lireLesInscriptions(admin, eleveId)
  const [positions, dejaDeposees, devoirsServis, coursVus, fiches] = await Promise.all([
    lireLesPositionsDeLecture(admin, [eleveId]), lireLesInstancesDejaDeposees(admin, [eleveId]),
    lireLesDevoirsServis(admin, [eleveId]), lireLesCoursVus(admin, inscriptions.map((i) => i.classeId), cycle), lireLesFiches(admin)])
  const vus = new Set(); for (const c of inscriptions.map((i) => i.classeId)) for (const x of coursVus.parClasse.get(c) ?? []) vus.add(x)
  return { eleveId, cycleLundi: cycle, segment: s.segment, fuseau: FUSEAU, maintenant: new Date().toISOString(), echeance: cycle, decoupe, modesAdmis: doctrine.modesAdmis,
    instances, positions: positions.parEleve.get(eleveId) ?? new Map(), dejaDeposees: dejaDeposees.parEleve.get(eleveId) ?? new Set(),
    devoirsServis: devoirsServis.parEleve.get(eleveId) ?? new Map(), inscriptions, coursVus: vus, fiches }
}

// ── LE RETRAIT — par marque, vérifié par requête ─────────────────────────────
async function retire() {
  if (!fs.existsSync(REGISTRE)) { console.log('aucun registre : rien à retirer.'); return }
  const avant = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
  const depAvant = new Set(avant.dep.map((d) => d.id)); const decAvant = new Set(avant.dec.map((d) => d.id))
  const depNow = lu('dépôts', await admin.from('exercices_depots').select('id').limit(20000))
  const depSuppr = depNow.filter((d) => !depAvant.has(d.id)).map((d) => d.id)
  if (depSuppr.length) lu('suppr dépôts', await admin.from('exercices_depots').delete().in('id', depSuppr).select('id'))
  const decNow = lu('décisions', await admin.from('routeur_decisions').select('id').limit(20000))
  const decSuppr = decNow.filter((d) => !decAvant.has(d.id)).map((d) => d.id)
  if (decSuppr.length) lu('suppr décisions', await admin.from('routeur_decisions').delete().in('id', decSuppr).select('id'))
  for (const n of avant.niveaux) {
    const { error } = await admin.from('competences_niveaux').upsert(n, { onConflict: 'eleve_id,competence' })
    if (error) console.error(`  ⛔ niveau non reposé : ${error.message}`)
  }
  lu('assiduité', await admin.from('assiduite_hebdo').delete().eq('eleve_id', avant.eleveId).select('eleve_id'))
  for (const l of avant.assi) { const { error } = await admin.from('assiduite_hebdo').upsert(l, { onConflict: 'eleve_id,cycle_lundi' }); if (error) console.error(`  ⛔ assiduité non reposée : ${error.message}`) }
  const aReposer = avant.ex.filter((e) => e.statut === 'a_concevoir').map((e) => e.id)
  for (let i = 0; i < aReposer.length; i += 200) {
    lu('reposer a_concevoir', await admin.from('exercices').update({ statut: 'a_concevoir' }).in('id', aReposer.slice(i, i + 200)).select('id'))
  }
  const apres = await socle(avant.eleveId)
  console.log(`VÉRIFIÉ PAR REQUÊTE — dépôts ${apres.dep.length} (avant ${avant.dep.length}) · décisions ${apres.dec.length} (${avant.dec.length}) · `
    + `assiduité ${apres.assi.length} (${avant.assi.length}) · niveaux ${apres.niveaux.map((n) => `${n.competence}=${n.lettre ?? '∅'}`).join(' ')} · `
    + `exercices 1.5 a_concevoir ${apres.ex.filter((e) => e.statut === 'a_concevoir').length} (${avant.ex.filter((e) => e.statut === 'a_concevoir').length})`)
  fs.unlinkSync(REGISTRE)
  console.log('✅ registre retiré.')
}

async function constat() {
  const u = await eleveDeDecor()
  console.log(`élève de décor retenu : ${u.email} (${u.id})`)
  const s = await socle(u.id)
  console.log(`décisions ${s.dec.length} · dépôts ${s.dep.length} · exercices 1.5 ${s.ex.length} (${s.ex.filter((e) => e.statut === 'a_concevoir').length} a_concevoir)`)
  console.log(`⭐ \`--essai\` poserait les cycles ${CYCLE_1} et ${CYCLE_2} pour lui, puis le pull ; \`--retire\` repose tout.`)
}

const mode = a('essai') ? essai : a('retire') ? retire : constat
mode().catch((e) => { console.error(`\n⛔ ${e.message}\n${e.stack?.split('\n').slice(1, 4).join('\n') ?? ''}`); process.exit(1) })
