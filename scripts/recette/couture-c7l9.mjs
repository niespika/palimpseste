// ============================================================================
// COUTURE C7 · L9 — « SUR UN CRAN QUI ISOLE, LE JUGE EST LA MESURE », ÉPROUVÉE PAR
// EXÉCUTION, EN BAC À SABLE. Patron : `couture-c7l8.mjs`.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c7l9.mjs [--constat|--essai|--retire] [--sans-trajectoire]
//          [--seulement-trajectoire] [--eleve-trajectoire <email|id>]
//
// Les coutures du prompt, sous la forme vérifiable — qui écrit · qui lit · un
// chemin réel y mène-t-il — puis le « fait quand », point par point :
//   ① C7-L1 → C7-L9 : le juge ÉCRIT `verdicts_cran`, `issueDuDepot` (C7-L7) LE LIT,
//     `traiterDepot` en dérive la mesure convertie — dépôt A au cran 5, origine
//     `routeur`, porte OUVERTE : zéro ligne p1/p2, une ligne juge, une ligne retour ;
//     UNE mesure, la valeur convertie sur le seul observable de la clé, `n/a`
//     ailleurs, `lettre_equivalente` NULL (fait quand 1) ;
//   ② la fenêtre d'évidence LIT cette mesure par `statutDeLaMesure` sans cas
//     particulier, et le taux pondéré rend 0,6 pour une réussite au cran 5 (fait quand 2) ;
//   ③ porte FERMÉE, le même exercice suit la chaîne d'hier — dépôt B : p1, p2, une
//     lettre ; et un dépôt `prof` porte ouverte suit aussi la chaîne d'hier (piège 4) ;
//   ④ C7-L8 → C7-L9 : la clé du cas (`ctx.cle`) se lit INDÉPENDAMMENT de
//     `chaine_cle_actif` (piège 29) — l'essai tourne `chaine_cle_actif` à OFF ;
//   ⑤ les crans 1·3 : la clôture met le dépôt en file, la chaîne accepte un dépôt
//     SANS production, dérive l'issue de la crédence, écrit la mesure, et
//     N'APPELLE PERSONNE — zéro ligne `api_couts` (piège 11) ;
//   ⑥ la vf au cran 2 : le juge rejoue à l'aveugle, un second verdict sur
//     `verdicts_cran['vf']`, `delta_v1_vf` ∈ {−1, 0, +1} sur la mesure de la v1,
//     AUCUNE seconde mesure (fait quand 4) ;
//   ⑦ le rejeu du retour sous le régime : aucun squelette à relire, le verdict stocké ;
//   ⑧ le signal de trajectoire → une sonde de montée au 6·8 dans `routeur_decisions`,
//     avec son motif (fait quand 3) — sur un élève de décor à lettre, quatre mesures
//     de décor qui acquièrent la majorité des requis, une pose réelle ;
//   ⑨ le retour ne cite que le passage du juge et ne nomme qu'une dimension —
//     `banc-citations-origine.mjs` en bac à sable, à lancer après (fait quand 5).
//
// ⛔ BAC À SABLE UNIQUEMENT — refus explicite sinon. `--essai` ÉCRIT (décor) et le
//    dit : la porte `juge_mesure_actif` est OUVERTE le temps de l'essai et REMISE
//    comme trouvée (`chaine_cle_actif` aussi, remise) ; les dépôts de décor portent
//    la marque EN BASE (`assigne_at = MARQUE`) ; l'état de l'élève de test (lettres,
//    escalade, montée, niveaux de Monitoring) est écrit sur disque AVANT et reposé
//    par `--retire`, qui vérifie par requête. La trajectoire (⑧) pose un cycle réel
//    sur un élève de décor : ses décisions, dépôts, assiduité et mesures de décor
//    sont retirés de même.
// ⚠️ `--essai` dépense : quatre dépôts avec appel, ~8 appels (juge, Calame ; le
//    dépôt B porte fermée : p1, p2, retour, juge).
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
for (const [k, v] of Object.entries(env)) process.env[k] ??= v
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const REGISTRE = path.join(RACINE, 'scripts/recette/.couture-c7l9.json')
const MARQUE = '2026-09-07T09:09:09.909Z'
const INSTRUMENT_DECOR = 'decor-c7l9'
const FUSEAU = 'America/Toronto'
const CYCLE = '2026-09-14'
const a = (n) => process.argv.includes(`--${n}`)

const { traiterDepot, rejouerLeRetour, lireContexteDuDepot } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const { lireLaPorteJugeMesure, basculerLaPorteJugeMesure } = await import(`${RACINE}/utils/chaine/porte-mesure.ts`)
const { lireLaPorteChaineCle, basculerLaPorteChaineCle } = await import(`${RACINE}/utils/chaine/porte-cle.ts`)
const { statutDeLaMesure, tauxDeReussite, NA } = await import(`${RACINE}/utils/chaine/observables.ts`)
const { etatCompetence, valeursDesParametres } = await import(`${RACINE}/utils/chaine/instruments.ts`)
const { cloturerLeCranGuide } = await import(`${RACINE}/utils/deroule/depot.ts`)
const { mettreLaMesureEnFile } = await import(`${RACINE}/utils/deroule/mesure.ts`)
const { fenetreDEvidence } = await import(`${RACINE}/utils/chaine/mesures.ts`)
const { poidsDuCran } = await import(`${RACINE}/utils/routeur/config.ts`)
const { lireLesNiveaux, lireLesFiches } = await import(`${RACINE}/utils/routeur/donnees.ts`)
const { observablesRequis } = await import(`${RACINE}/utils/routeur/fiche-observables.ts`)
const { poserLesSemainesDuRouteur } = await import(`${RACINE}/utils/moteur/cycle-serveur.ts`)

const lu = (quoi, r) => { if (r.error) throw new Error(`${quoi} — ${r.error.code} ${r.error.message}`); return r.data }
const titre = (t) => console.log(`\n${'═'.repeat(78)}\n${t}\n${'═'.repeat(78)}`)
let ok = 0, ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const un = (x) => (Array.isArray(x) ? x[0] ?? null : x)

// ── L'élève de test ──────────────────────────────────────────────────────────
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 })
const eleve = users.find((x) => x.email === env.TEST_ELEVE_EMAIL)
if (!eleve) throw new Error('élève de test introuvable : ' + env.TEST_ELEVE_EMAIL)

// ── Les portes, MESURÉES ─────────────────────────────────────────────────────
const { data: p } = await admin.from('scriptorium_params').select('*').eq('id', 1).maybeSingle()
const portes = { juge_mesure_actif: !!p?.juge_mesure_actif, juge_documents_actif: !!p?.juge_documents_actif,
  chaine_cle_actif: !!p?.chaine_cle_actif, gabarit_actif: !!p?.gabarit_actif, chaine_actif: !!p?.chaine_actif }
console.log(`bac à sable ${SANDBOX} — portes : ${Object.entries(portes).map(([k, v]) => `${k} ${v ? 'ON' : 'OFF'}`).join(' · ')} ; colonne juge_mesure_actif ${'juge_mesure_actif' in (p ?? {}) ? 'présente' : 'ABSENTE'}`)

// ── Les instances 1.5 ────────────────────────────────────────────────────────
const { data: gab } = await admin.from('exercices').select('id, id_import, cran, variante, statut, observable_isole_code, observable_isole_competence, exercices_types(code, grain)').like('id_import', 'ex-gab-%').order('id_import')
const exDe = (souche, cran, variante = null) => (gab ?? []).find((e) => e.id_import.includes(souche) && e.cran === cran && (variante === null || e.variante === variante))

async function constat() {
  titre('--constat — ce que la base porte (lecture seule)')
  const parCran = {}
  for (const e of gab ?? []) { parCran[e.cran] ??= { total: 0, concu: 0 }; parCran[e.cran].total++; if (e.statut === 'concu') parCran[e.cran].concu++ }
  console.log(`instances 1.5 : ${(gab ?? []).length} — par cran ${Object.entries(parCran).map(([c, v]) => `${c}: ${v.total} (${v.concu} concu)`).join(' · ')}`)
  const { data: cas } = await admin.from('exercices_cas').select('exercice_id').not('probleme', 'is', null)
  console.log(`cas avec \`probleme\` : ${(cas ?? []).length}`)
  const { data: convertis } = await admin.from('competences_mesures').select('id, competence, depot_id').is('lettre_equivalente', null).not('depot_id', 'is', null)
  console.log(`mesures sans lettre avec dépôt (converties, ou d'un autre lot) : ${(convertis ?? []).length}`)
  const { data: decors } = await admin.from('exercices_depots').select('id, statut, exercice_id').eq('eleve_id', eleve.id).eq('assigne_at', MARQUE)
  console.log(`dépôts de décor de cette couture en base : ${decors?.length ?? 0}`)
  const { count: nbVerdicts } = await admin.from('exercices_depots').select('id', { count: 'exact', head: true }).not('verdicts_cran', 'is', null)
  console.log(`dépôts avec un verdict de cran : ${nbVerdicts}`)
  console.log(`\nexercices de l'essai : A cran 5 ${exDe('argument-garant-connecteur', 5)?.id_import ?? '—'} · B cran 5 ${exDe('argument-garant-absent', 5)?.id_import ?? '—'} · C cran 1(a) ${exDe('argument-garant-absent', 1, 'a')?.id_import ?? '—'} · D cran 2 ${exDe('argument-garant-circulaire', 2)?.id_import ?? '—'}`)
}

// ════════════════════════════════════════════════════════════════════════════
// LE DÉCOR
// ════════════════════════════════════════════════════════════════════════════
const TABLES_ETAT = ['competences_niveaux', 'competences_escalade', 'competences_montee', 'monitoring_niveaux']
async function registreAvant(decor) {
  const etat = {}
  for (const t of TABLES_ETAT) etat[t] = lu(t, await admin.from(t).select('*').eq('eleve_id', eleve.id)) ?? []
  // `--seulement-trajectoire` : le registre de l'essai précédent est conservé (l'état de
  // l'élève de test y est déjà) et complété du décor de la trajectoire.
  const existant = fs.existsSync(REGISTRE) ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) : null
  const reg = a('seulement-trajectoire') && existant ? { ...existant } : { marque: MARQUE, eleve: eleve.id, porteAvant: portes.juge_mesure_actif, porteCleAvant: portes.chaine_cle_actif, etat }
  reg.decor = null
  Object.assign(reg, {
    decor: decor ? { eleveId: decor.id, niveaux: lu('niveaux décor', await admin.from('competences_niveaux').select('*').eq('eleve_id', decor.id)),
      assi: lu('assiduité décor', await admin.from('assiduite_hebdo').select('*').eq('eleve_id', decor.id)),
      dec: lu('décisions', await admin.from('routeur_decisions').select('id').eq('eleve_id', decor.id).limit(5000)),
      // ⚠️ hors les dépôts marqués de cette couture : ils partent par la marque, pas par ici.
      dep: lu('dépôts', await admin.from('exercices_depots').select('id').eq('eleve_id', decor.id).neq('assigne_at', MARQUE).limit(5000)),
      ex: (gab ?? []).map((e) => ({ id: e.id, statut: e.statut })) } : null,
    ecritLe: new Date().toISOString() })
  fs.writeFileSync(REGISTRE, JSON.stringify(reg, null, 2))
  console.log(`registre AVANT écrit : ${REGISTRE} (porte ${reg.porteAvant ? 'ON' : 'OFF'}, clé ${reg.porteCleAvant ? 'ON' : 'OFF'} ; ${TABLES_ETAT.map((t) => `${t} ${etat[t].length}`).join(', ')})`)
  return reg
}
async function poserUnDepot(ex, texteV1, { origine = 'routeur', statut = 'v1_remis', remis = true } = {}) {
  const ligne = { eleve_id: eleve.id, exercice_id: ex.id, origine, statut, texte_v1: texteV1,
    assigne_at: MARQUE, v1_remis_at: remis ? new Date().toISOString() : null, echeance: new Date(Date.now() + 7 * 86400e3).toISOString() }
  const { data, error } = await admin.from('exercices_depots').insert(ligne).select('id').single()
  if (error) throw new Error(`dépôt sur ${ex.id_import} : ${error.message}`)
  return data.id
}
const coutDe = async (depotId) => {
  const { data } = await admin.from('api_couts').select('phase, cout, module').eq('depot_id', depotId)
  const parPhase = {}; let cout = 0
  for (const r of data ?? []) { const k = r.phase ?? `NULL(${r.module})`; parPhase[k] = (parPhase[k] ?? 0) + 1; cout += Number(r.cout) }
  return { appels: (data ?? []).length, parPhase, cout: Number(cout.toFixed(4)), p1p2: (data ?? []).filter((r) => r.phase === 'p1' || r.phase === 'p2').length }
}
const enBase = async (depotId) => {
  const mes = lu('mesures', await admin.from('competences_mesures').select('competence, observables, lettre_equivalente, sonde_montee, delta_v1_vf, instrument_version').eq('depot_id', depotId))
  const sq = lu('squelettes', await admin.from('exercices_squelettes').select('competence, version').eq('depot_id', depotId))
  const ret = lu('retour', await admin.from('exercices_retours').select('moment, texte').eq('depot_id', depotId))
  const dep = lu('dépôt', await admin.from('exercices_depots').select('verdicts_cran, statut').eq('id', depotId).maybeSingle())
  const jobs = lu('jobs', await admin.from('exercices_jobs').select('etape, statut').eq('depot_id', depotId))
  return { mesures: mes ?? [], squelettes: sq ?? [], retours: ret ?? [], verdicts: dep?.verdicts_cran ?? {}, statut: dep?.statut, jobs: jobs ?? [] }
}
const gardes = (obs) => Object.entries(obs ?? {}).filter(([, v]) => v !== NA).map(([k, v]) => `${k}=${JSON.stringify(v)}`)
const montrer = (nom, bilan) => {
  console.log(`bilan ${nom} : mesurées ${bilan.competencesMesurees.join(', ') || '—'} ; écrites ${bilan.mesuresEcrites} ; retour ${bilan.retourEcrit ? 'écrit' : 'NON écrit'} ; ${bilan.appels} appels (base ${bilan.appelsEnBase})`)
  console.log(`  écartées : ${bilan.competencesEcartees.map((e) => `${e.competence} — ${e.motif.slice(0, 90)}`).join('\n             ') || 'aucune'}`)
  console.log(`  alertes : ${bilan.alertes.map((x) => x.slice(0, 150)).join('\n           ') || 'aucune'}`)
}

// ── L'élève de décor de la trajectoire (patron couture-c7l7) ─────────────────
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null }
async function eleveDeTrajectoire() {
  // `--eleve-trajectoire <email|id>` : l'élève de test lui-même convient (lettre C en
  // Argumentation) — mesuré le 07/09 : le bac à sable n'a AUCUN élève TC seul.
  const voulu = arg('--eleve-trajectoire')
  if (voulu) {
    const u = users.find((x) => x.email === voulu || x.id === voulu)
    if (!u) throw new Error(`élève « ${voulu} » introuvable`)
    return u
  }
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
    // Une ligne de niveau en Argumentation suffit : la lettre de décor (D) se pose à l'essai
    // et se repose au retrait — mesuré le 07/09 : AUCUN élève du bac à sable n'a de lettre.
    const niv = await lireLesNiveaux(admin, id)
    if (niv.some((n) => n.competence === 'argumentation')) return u
  }
  return null
}

async function essai() {
  if (!portes.juge_documents_actif) throw new Error('juge_documents_actif est OFF : le lot n\'a pas de sens sans le juge (piège 5) — ouvrir le juge d\'abord')
  const decor = a('sans-trajectoire') ? null : await eleveDeTrajectoire()
  const reg = await registreAvant(decor)
  const A5 = exDe('argument-garant-connecteur', 5), B5 = exDe('argument-garant-absent', 5)
  const C1 = exDe('argument-garant-absent', 1, 'a'), D2 = exDe('argument-garant-circulaire', 2)
  if (!A5 || !B5 || !C1 || !D2) throw new Error('exercices de décor introuvables')
  // ④ — la clé se lit INDÉPENDAMMENT de chaine_cle_actif : l'essai tourne C7-L8 à OFF.
  await basculerLaPorteChaineCle(admin, false)

  try {
    await basculerLaPorteJugeMesure(admin, true)
    if (a('seulement-trajectoire')) { await trajectoire(decor); return }
    // ── ① dépôt A, cran 5, origine routeur, porte OUVERTE ────────────────────
    titre('① porte OUVERTE — dépôt A (cran 5, origine `routeur`) : le juge, puis la mesure convertie, puis Calame')
    const jetable = await lireContexteDuDepot(admin, await poserUnDepot(A5, 'x'))
    const passage = jetable.casPourLeRetour[0]?.passageMarque ?? jetable.casPourLeRetour[0]?.passageFautif ?? ''
    await admin.from('exercices_depots').delete().eq('id', jetable.depotId)
    const v1A = /^Donc il faut interdire/.test(passage)
      ? "Donc, puisque ce qui prend le regard prend l'attention et qu'un élève qui n'écoute plus n'apprend plus, il faut interdire les téléphones portables au lycée."
      : `${passage.replace(/\.\s*$/, '')}, car ce qui prend le regard prend l'attention.`
    const A = await poserUnDepot(A5, v1A)
    const ctxA = await lireContexteDuDepot(admin, A)
    dire(ctxA.jugeMesureActif === true && ctxA.origine === 'routeur' && ctxA.chaineCleActif === false, `④ le contexte lit la porte (${ctxA.jugeMesureActif}), l'origine (${ctxA.origine}), et chaine_cle_actif est OFF (${ctxA.chaineCleActif})`)
    dire(ctxA.cle?.lecture === 'ok' && !!ctxA.cle?.observableCode, `④ la clé « ${ctxA.cle?.cle} » → ${ctxA.cle?.observableCode} (${ctxA.cle?.observableCompetence}) se lit porte C7-L8 FERMÉE (piège 29)`)
    const bilanA = await traiterDepot(admin, A, 'v1')
    montrer('A', bilanA)
    const baseA = await enBase(A), coutA = await coutDe(A)
    const comp = ctxA.cle?.observableCompetence, code = ctxA.cle?.observableCode
    dire(coutA.p1p2 === 0, `fait quand (1) — ZÉRO ligne p1/p2 dans api_couts : ${JSON.stringify(coutA.parPhase)}`)
    dire((coutA.parPhase['NULL(exercices-chaine-juge)'] ?? 0) === 1 && (coutA.parPhase.retour ?? 0) === 1, `fait quand (1) — une ligne juge et une ligne retour (${coutA.appels} appels, ${coutA.cout} $)`)
    dire(baseA.mesures.length === 1 && baseA.mesures[0].competence === comp, `fait quand (1) — UNE mesure, sur ${comp}`)
    const obsA = baseA.mesures[0]?.observables ?? {}
    dire(gardes(obsA).length === 1 && gardes(obsA)[0].startsWith(`${code}=`), `fait quand (1) — la valeur convertie sur le seul observable de la clé : ${gardes(obsA).join(', ') || '(aucun)'} ; ${Object.keys(obsA).length - gardes(obsA).length} autre(s) à n/a`)
    dire(baseA.mesures[0]?.lettre_equivalente === null, `fait quand (1) — lettre_equivalente NULL (${baseA.mesures[0]?.lettre_equivalente})`)
    dire(baseA.squelettes.length === 0, `aucun squelette écrit (${baseA.squelettes.length}) — « AUCUN squelette » (01- §11)`)
    dire(!!baseA.verdicts.v1, `le verdict du juge est sur le dépôt : ${baseA.verdicts.v1 ? `${baseA.verdicts.v1.reussi ? 'RÉUSSI' : 'RATÉ'} — ${String(baseA.verdicts.v1.motif).slice(0, 80)}` : 'aucun'}`)
    const issueA = baseA.verdicts.v1?.reussi
    const inst = etatCompetence(comp).instrument, entree = inst?.observables_mesure[code], params = valeursDesParametres(inst)
    dire(statutDeLaMesure(obsA[code], entree, params) === (issueA ? 'reussie' : 'ratee'), `la mesure se relit comme le verdict : ${statutDeLaMesure(obsA[code], entree, params)} (verdict ${issueA ? 'réussi' : 'raté'})`)
    dire(bilanA.retourEcrit && baseA.retours.some((r) => r.moment === 'chaud'), `le retour chaud est écrit — ${un(baseA.retours.filter((r) => r.moment === 'chaud'))?.texte?.length ?? 0} point(s)`)
    for (const pt of un(baseA.retours.filter((r) => r.moment === 'chaud'))?.texte ?? []) console.log(`  · [${pt.nature}] ${pt.competence} — « ${pt.ancrage?.citation ?? '(sans citation)'} » — ${String(pt.texte).slice(0, 110)}`)
    const citations = (un(baseA.retours.filter((r) => r.moment === 'chaud'))?.texte ?? []).map((pt) => pt.ancrage?.citation).filter(Boolean)
    dire(citations.every((c) => (baseA.verdicts.v1?.passage ?? '').includes(c) || c.includes(baseA.verdicts.v1?.passage ?? ' ') || v1A.includes(c)), `fait quand (5) sur le décor — ${citations.length} citation(s), toutes dans la copie ; passage du juge : « ${String(baseA.verdicts.v1?.passage ?? '').slice(0, 60)} »`)

    // ── ② la fenêtre d'évidence et le taux pondéré ─────────────────────────────
    titre('② la fenêtre d\'évidence lit la mesure par `statutDeLaMesure` ; le taux pondéré rend 0,6 au cran 5')
    const fen = await fenetreDEvidence(admin, eleve.id, comp)
    const derniere = fen[fen.length - 1]
    dire(!!derniere && derniere.lettre_equivalente === null && statutDeLaMesure(derniere.observables?.[code], entree, params) !== 'sans_objet', `la dernière mesure de la fenêtre (${fen.length}) est la convertie, statut ${derniere ? statutDeLaMesure(derniere.observables?.[code], entree, params) : '—'}`)
    const t = tauxDeReussite([obsA[code]], entree, params, [poidsDuCran(5)])
    dire(t.denominateur === 0.6 && t.reussies === (issueA ? 0.6 : 0), `fait quand (2) — taux pondéré au cran 5 : réussies ${t.reussies}, dénominateur ${t.denominateur}, taux ${t.taux}`)

    // ── ③ porte FERMÉE — dépôt B, la chaîne d'hier ; et un dépôt `prof` porte ouverte ─
    titre('③ porte FERMÉE — dépôt B (cran 5) suit la chaîne d\'hier ; porte OUVERTE, un dépôt `prof` aussi (piège 4)')
    await basculerLaPorteJugeMesure(admin, false)
    const jetB = await lireContexteDuDepot(admin, await poserUnDepot(B5, 'x'))
    const passageB = jetB.casPourLeRetour[0]?.passageMarque ?? jetB.casPourLeRetour[0]?.passageFautif ?? ''
    await admin.from('exercices_depots').delete().eq('id', jetB.depotId)
    const B = await poserUnDepot(B5, `${passageB.replace(/\.\s*$/, '')} : or on ne protège bien que ce que l'on connaît.`)
    const bilanB = await traiterDepot(admin, B, 'v1')
    montrer('B', bilanB)
    const baseB = await enBase(B), coutB = await coutDe(B)
    dire(coutB.p1p2 >= 2 && baseB.mesures.length >= 1 && baseB.mesures.every((m) => m.lettre_equivalente !== null), `porte fermée : ${coutB.p1p2} lignes p1/p2, ${baseB.mesures.length} mesure(s) avec lettre (${baseB.mesures.map((m) => `${m.competence}=${m.lettre_equivalente}`).join(', ')}), ${baseB.squelettes.length} squelette(s) — la chaîne d'hier`)
    dire(!bilanB.alertes.some((x) => x.includes('C7-L9')), 'porte fermée : aucune alerte du lot')
    console.log(`coût B (porte fermée) : ${coutB.appels} appels ${JSON.stringify(coutB.parPhase)} · ${coutB.cout} $ — contre A : ${coutA.appels} appels · ${coutA.cout} $`)
    dire(coutA.appels < coutB.appels && coutA.cout < coutB.cout, `le coût par dépôt baisse : ${coutB.appels} → ${coutA.appels} appels, ${coutB.cout} → ${coutA.cout} $`)
    await basculerLaPorteJugeMesure(admin, true)
    // un dépôt `prof` porte ouverte : hors périmètre, sans un mot — on ne le TRAITE pas (un tour de plus), on lit le régime par le contexte
    const P = await poserUnDepot(exDe('argument-garant-absent', 7), 'x', { origine: 'prof' })
    const ctxP = await lireContexteDuDepot(admin, P)
    const { regimeJugeMesure } = await import(`${RACINE}/utils/chaine/juge-mesure.ts`)
    const rP = regimeJugeMesure(ctxP, (c) => Object.keys(etatCompetence(c).instrument?.observables_mesure ?? {}))
    dire(rP.actif === false && rP.alertes.length === 0, `piège 4 — un dépôt \`prof\` au cran 7, porte ouverte : régime inactif (${rP.actif}), sans un mot (${rP.alertes.length} alerte)`)
    await admin.from('exercices_depots').delete().eq('id', P)

    // ── ⑤ le cran 1 : la clôture → la file → la mesure sans appel ─────────────
    titre('⑤ cran 1(a) — dépôt C : crédence, clôture, file, mesure convertie SANS APPEL (piège 11)')
    const C = await poserUnDepot(C1, null, { statut: 'assigne', remis: false })
    const { data: casC } = await admin.from('exercices_cas').select('ordre').eq('exercice_id', C1.id).order('ordre')
    const nbCas = (casC ?? []).length
    const credence = (casC ?? []).map((c) => ({ cas: c.ordre, jetons: [100, 0, 0, 0], index_correct: 0 }))
    lu('crédence', await admin.from('exercices_metacognition').upsert({ depot_id: C, credence, updated_at: new Date().toISOString() }, { onConflict: 'depot_id' }))
    const clot = await cloturerLeCranGuide(admin, C, new Date().toISOString())
    dire(clot.ok && !clot.valeur?.dejaClos, `clôture du cran guidé : ${clot.ok ? 'clos' : clot.message}`)
    const file = await mettreLaMesureEnFile(admin, C, 'v1')
    dire(!file.erreur, `mise en file mesure_v1 : ${file.erreur ?? 'ok'}${file.deja ? ' (déjà)' : ''}`)
    const bilanC = await traiterDepot(admin, C, 'v1')
    montrer('C', bilanC)
    const baseC = await enBase(C), coutC = await coutDe(C)
    dire(coutC.appels === 0, `piège 11 — ZÉRO ligne api_couts (${coutC.appels})`)
    dire(baseC.mesures.length === 1 && baseC.mesures[0].lettre_equivalente === null, `une mesure convertie, lettre nulle : ${gardes(baseC.mesures[0]?.observables ?? {}).join(', ') || '(aucun)'} — issue de la crédence (${nbCas} cas, tous les jetons sur le bon candidat)`)
    dire(baseC.retours.length === 0 && baseC.squelettes.length === 0, `aucun retour, aucun squelette (${baseC.retours.length}, ${baseC.squelettes.length})`)
    dire(baseC.statut === 'clos', `le dépôt reste \`clos\` (${baseC.statut})`)

    // ── ⑥ la vf au cran 2 : le juge rejoue à l'aveugle, le delta des verdicts ────
    titre('⑥ cran 2 — dépôt D : v1 puis vf ; un second verdict sur `verdicts_cran.vf`, delta_v1_vf, AUCUNE seconde mesure (fait quand 4)')
    const D = await poserUnDepot(D2, "Ce qui prend le regard prend l'attention : un élève qui regarde son écran n'écoute plus, et une classe qui n'écoute plus n'apprend plus.")
    const bilanD = await traiterDepot(admin, D, 'v1')
    montrer('D v1', bilanD)
    const baseD1 = await enBase(D)
    dire(baseD1.mesures.length === 1 && !!baseD1.verdicts.v1, `v1 : une mesure (${baseD1.mesures[0]?.competence}, lettre ${baseD1.mesures[0]?.lettre_equivalente}), verdict v1 ${baseD1.verdicts.v1 ? (baseD1.verdicts.v1.reussi ? 'RÉUSSI' : 'RATÉ') : 'absent'}`)
    lu('vf', await admin.from('exercices_depots').update({ texte_vf: "Or, ce qui prend le regard prend l'attention ; donc un élève qui regarde son écran n'écoute plus, et une classe qui n'écoute plus n'apprend plus.", statut: 'vf_remis', vf_remis_at: new Date().toISOString() }).eq('id', D))
    const bilanDvf = await traiterDepot(admin, D, 'vf')
    montrer('D vf', bilanDvf)
    const baseD2 = await enBase(D), coutD = await coutDe(D)
    dire(!!baseD2.verdicts.vf && !!baseD2.verdicts.v1, `fait quand (4) — deux verdicts : v1 ${baseD2.verdicts.v1?.reussi ? 'RÉUSSI' : 'RATÉ'}, vf ${baseD2.verdicts.vf?.reussi ? 'RÉUSSI' : 'RATÉ'}`)
    dire(baseD2.mesures.length === 1, `fait quand (4) — AUCUNE seconde mesure (${baseD2.mesures.length})`)
    const delta = baseD2.mesures[0]?.delta_v1_vf
    dire([-1, 0, 1].includes(delta), `fait quand (4) — delta_v1_vf = ${delta} ∈ {−1, 0, +1}`)
    dire(coutD.p1p2 === 0, `zéro ligne p1/p2 sur les deux versions : ${JSON.stringify(coutD.parPhase)}`)
    dire(baseD2.retours.some((r) => r.moment === 'final'), `le retour final est écrit (${baseD2.retours.map((r) => r.moment).join(', ')})`)

    // ── ⑦ le rejeu du retour sous le régime ────────────────────────────────────
    titre('⑦ le REJEU du retour de A (sans écriture) : aucun squelette à relire, le verdict stocké')
    const rejeu = await rejouerLeRetour(admin, A, { sansEcriture: true })
    console.log(`  alertes : ${rejeu.alertes.map((x) => x.slice(0, 140)).join('\n           ') || 'aucune'}`)
    dire((rejeu.retourEngendre?.points ?? []).length > 0 && !rejeu.alertes.some((x) => /squelette de « /.test(x)), `le retour se rejoue sans squelette : ${(rejeu.retourEngendre?.points ?? []).length} point(s)`)

    await trajectoire(decor)

    console.log(`\ndépôts de décor : A ${A} · B ${B} · C ${C} · D ${D} — \`--retire\` les repose ; lancer ensuite \`banc-citations-origine.mjs --depuis 2026-09-07\` (fait quand 5).`)
  } finally {
    await basculerLaPorteJugeMesure(admin, reg.porteAvant)
    await basculerLaPorteChaineCle(admin, reg.porteCleAvant)
    dire((await lireLaPorteJugeMesure(admin)) === reg.porteAvant && (await lireLaPorteChaineCle(admin)) === reg.porteCleAvant, `portes remises comme trouvées (juge_mesure ${reg.porteAvant ? 'ON' : 'OFF'}, chaine_cle ${reg.porteCleAvant ? 'ON' : 'OFF'})`)
  }
}

// ── ⑧ la trajectoire : quatre mesures de décor, une pose réelle ──────────────
async function trajectoire(decor) {
    if (decor) {
      titre(`⑧ la trajectoire → une sonde de montée au 6·8 (fait quand 3) — élève de décor ${decor.email}, cycle ${CYCLE}`)
      // « Une compétence sans lettre ne se sonde pas » : la lettre de décor, D (patron couture-c7l7), reposée par --retire.
      lu('lettre de décor', await admin.from('competences_niveaux').update({ lettre: 'D' }).eq('eleve_id', decor.id).eq('competence', 'argumentation').select('competence'))
      const fiches = await lireLesFiches(admin)
      const requis = observablesRequis(fiches.get('argumentation') ?? '').requis
      const instA = etatCompetence('argumentation').instrument
      const obsAcquis = {}
      for (const k of Object.keys(instA.observables_mesure)) obsAcquis[k] = NA
      for (const k of requis) { const e = instA.observables_mesure[k]; if (e) obsAcquis[k] = e.reussie === 'vaut' ? (Array.isArray(e.valeur_reussie) ? e.valeur_reussie[0] : e.valeur_reussie) : (e.reussie === 'au_plus' || e.reussie === 'moins_de' ? 0 : 1) }
      console.log(`  requis de la fiche : ${requis.join(', ')} · quatre mesures de décor les acquièrent (lettre nulle, sans dépôt : poids 1)`)
      const lignes = [1, 2, 3, 4].map((i) => ({ eleve_id: decor.id, competence: 'argumentation', modes: ['composer'], lettre_equivalente: null, observables: obsAcquis,
        lieu: 'maison', forme: 'formatif', genre: null, classe_id: null, sonde_montee: false, distance_contexte: null, delai_jours: null, delai_mesures: null,
        aide_consommee: null, depot_id: null, bonus: false, instrument_version: INSTRUMENT_DECOR, mesure_at: new Date(Date.now() - (5 - i) * 86400e3).toISOString() }))
      lu('mesures de décor', await admin.from('competences_mesures').insert(lignes))
      const aConcevoir = (gab ?? []).filter((e) => e.statut === 'a_concevoir').map((e) => e.id)
      for (let i = 0; i < aConcevoir.length; i += 200) lu('concu', await admin.from('exercices').update({ statut: 'concu' }).in('id', aConcevoir.slice(i, i + 200)).select('id'))
      const b = await poserLesSemainesDuRouteur(admin, FUSEAU, CYCLE, { cycleDemande: CYCLE, elevesDemandes: [decor.id] })
      console.log(`  pose : ${JSON.stringify({ eleves: b.elevesServis, exercices: b.exercicesPoses, sondes: b.sondesPosees, ecartsDuVivier: b.ecartsDuVivier, erreurs: (b.erreurs ?? []).slice(0, 3) })}`)
      const { data: decs } = await admin.from('routeur_decisions').select('exercice_id, cible_retenue, regle_declenchee, sondes_retenues, alternatives_ecartees, exercices(cran, id_import)').eq('eleve_id', decor.id).eq('cycle_lundi', CYCLE)
      const traj = (decs ?? []).flatMap((d) => (d.sondes_retenues ?? []).filter((s) => /^trajectoire_/.test(s.motif)).map((s) => ({ ...s, cran: un(d.exercices)?.cran, id_import: un(d.exercices)?.id_import })))
      const journal = (decs ?? []).map((d) => d.alternatives_ecartees?.trajectoire).find(Boolean) ?? []
      console.log(`  décisions ${decs?.length ?? 0} · sondes de trajectoire ${traj.length} : ${traj.map((s) => `${s.competence} ${s.motif} (${s.detail}) sur ${s.id_import} cran ${s.cran}, sonde_montee ${s.sonde_montee}`).join(' | ') || 'aucune'}`)
      console.log(`  journal de trajectoire : ${JSON.stringify(journal).slice(0, 400)}`)
      dire(traj.length >= 1 && traj.every((s) => s.sonde_montee && [6, 8].includes(Number(s.cran))), `fait quand (3) — routeur_decisions porte une sonde de montée au 6 ou 8 avec son motif`)
      if (!traj.length) dire(journal.some((j) => j.issue === 'sans_substrat' || j.issue === 'hors_budget'), `à défaut, le signal est journalisé (${journal.map((j) => `${j.competence} ${j.motif} → ${j.issue}`).join(', ') || 'rien'})`)
    } else {
      titre('⑧ la trajectoire — SAUTÉE (--sans-trajectoire, ou aucun élève de décor : TC seul, sans dépôt du gabarit, avec une ligne en Argumentation)')
    }
}

// ════════════════════════════════════════════════════════════════════════════
// LE RETRAIT — par marque, vérifié par requête ; l'état de l'élève reposé
// ════════════════════════════════════════════════════════════════════════════
async function retire() {
  titre('--retire — le décor part, l\'état de l\'élève est reposé')
  const reg = fs.existsSync(REGISTRE) ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) : null
  const { data: deps } = await admin.from('exercices_depots').select('id').eq('eleve_id', eleve.id).eq('assigne_at', MARQUE)
  const ids = (deps ?? []).map((d) => d.id)
  console.log(`${ids.length} dépôt(s) de décor`)
  for (const t of ['api_couts', 'monitoring_mesures', 'competences_mesures', 'exercices_squelettes', 'exercices_retours', 'exercices_jobs', 'exercices_metacognition']) {
    if (!ids.length) break
    const { error, count } = await admin.from(t).delete({ count: 'exact' }).in('depot_id', ids)
    console.log(`  ${t} : ${error ? 'ERREUR ' + error.message : `${count ?? 0} ligne(s) retirée(s)`}`)
  }
  if (ids.length) { const { count, error } = await admin.from('exercices_depots').delete({ count: 'exact' }).in('id', ids); console.log(`  exercices_depots : ${error ? error.message : `${count} retiré(s)`}`) }
  if (reg) {
    for (const t of TABLES_ETAT) {
      await admin.from(t).delete().eq('eleve_id', eleve.id)
      if (reg.etat[t]?.length) { const { error } = await admin.from(t).insert(reg.etat[t]); if (error) console.log(`  ⚠️ ${t} non reposé : ${error.message}`) }
      const { count } = await admin.from(t).select('*', { count: 'exact', head: true }).eq('eleve_id', eleve.id)
      dire(count === (reg.etat[t]?.length ?? 0), `${t} reposé : ${count} ligne(s) (registre ${reg.etat[t]?.length ?? 0})`)
    }
    if (reg.decor) {
      const d = reg.decor
      const { count: nMes } = await admin.from('competences_mesures').delete({ count: 'exact' }).eq('eleve_id', d.eleveId).eq('instrument_version', INSTRUMENT_DECOR)
      console.log(`  mesures de décor de la trajectoire retirées : ${nMes}`)
      const depAvant = new Set(d.dep.map((x) => x.id)), decAvant = new Set(d.dec.map((x) => x.id))
      const depNow = lu('dépôts', await admin.from('exercices_depots').select('id').eq('eleve_id', d.eleveId).neq('assigne_at', MARQUE).limit(5000))
      const depSuppr = depNow.filter((x) => !depAvant.has(x.id)).map((x) => x.id)
      for (const t of ['api_couts', 'competences_mesures', 'exercices_squelettes', 'exercices_retours', 'exercices_jobs', 'exercices_metacognition']) if (depSuppr.length) await admin.from(t).delete().in('depot_id', depSuppr)
      if (depSuppr.length) lu('suppr dépôts', await admin.from('exercices_depots').delete().in('id', depSuppr).select('id'))
      const decNow = lu('décisions', await admin.from('routeur_decisions').select('id').eq('eleve_id', d.eleveId).limit(5000))
      const decSuppr = decNow.filter((x) => !decAvant.has(x.id)).map((x) => x.id)
      if (decSuppr.length) lu('suppr décisions', await admin.from('routeur_decisions').delete().in('id', decSuppr).select('id'))
      for (const n of d.niveaux) { const { error } = await admin.from('competences_niveaux').upsert(n, { onConflict: 'eleve_id,competence' }); if (error) console.log(`  ⚠️ niveau non reposé : ${error.message}`) }
      await admin.from('assiduite_hebdo').delete().eq('eleve_id', d.eleveId)
      for (const l of d.assi) { const { error } = await admin.from('assiduite_hebdo').upsert(l, { onConflict: 'eleve_id,cycle_lundi' }); if (error) console.log(`  ⚠️ assiduité non reposée : ${error.message}`) }
      // l'état dérivé du cycle posé (escalade, montée) : reposé au registre AVANT s'il en avait — sinon, ce que la pose a écrit part
      for (const t of ['competences_escalade', 'competences_montee']) await admin.from(t).delete().eq('eleve_id', d.eleveId).gte('updated_at', reg.ecritLe)
      const aReposer = d.ex.filter((e) => e.statut === 'a_concevoir').map((e) => e.id)
      for (let i = 0; i < aReposer.length; i += 200) lu('a_concevoir', await admin.from('exercices').update({ statut: 'a_concevoir' }).in('id', aReposer.slice(i, i + 200)).select('id'))
      const { count: nDep } = await admin.from('exercices_depots').select('*', { count: 'exact', head: true }).eq('eleve_id', d.eleveId).neq('assigne_at', MARQUE)
      const { count: nDec } = await admin.from('routeur_decisions').select('*', { count: 'exact', head: true }).eq('eleve_id', d.eleveId)
      const { count: nEx } = await admin.from('exercices').select('*', { count: 'exact', head: true }).like('id_import', 'ex-gab-%').eq('statut', 'a_concevoir')
      dire(nDep === d.dep.length && nDec === d.dec.length && nEx === aReposer.length, `élève de décor reposé : dépôts ${nDep} (${d.dep.length}), décisions ${nDec} (${d.dec.length}), instances a_concevoir ${nEx} (${aReposer.length})`)
    }
    await basculerLaPorteJugeMesure(admin, reg.porteAvant)
    await basculerLaPorteChaineCle(admin, reg.porteCleAvant)
    dire((await lireLaPorteJugeMesure(admin)) === reg.porteAvant && (await lireLaPorteChaineCle(admin)) === reg.porteCleAvant, `portes remises comme au registre (juge_mesure ${reg.porteAvant ? 'ON' : 'OFF'}, chaine_cle ${reg.porteCleAvant ? 'ON' : 'OFF'})`)
  } else console.log('  (pas de registre : l\'état de l\'élève n\'est pas touché, les portes non plus)')
  const { count } = await admin.from('exercices_depots').select('*', { count: 'exact', head: true }).eq('eleve_id', eleve.id).eq('assigne_at', MARQUE)
  dire(count === 0, 'plus aucun dépôt de décor en base (vérifié par requête)')
}

if (a('retire')) await retire()
else if (a('essai')) { await constat(); await essai() }
else await constat()
console.log(`\n${ok} ✓ · ${ko} ✗`)
process.exit(ko ? 1 : 0)
