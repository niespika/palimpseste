// ============================================================================
// COUTURE C7 · L8 — LA CHAÎNE À L'HEURE DE LA CLÉ, ÉPROUVÉE PAR EXÉCUTION, EN BAC À SABLE.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c7l8.mjs [--constat|--essai|--retire] [--cle argument.garant.absent] [--cle2 argument.garant.connecteur]
//   ⚠️ `uk_depots_eleve_exercice` : UN dépôt par (élève × exercice) — le dépôt A (porte ouverte)
//      se pose sur le cran 5 d'une SECONDE clé du même objet et du même observable.
//
// Les cinq coutures du prompt, sous la forme vérifiable — qui écrit · qui lit ·
// un chemin réel y mène-t-il — puis le « fait quand », point par point, chacun
// avec sa requête et son résultat :
//   ① la clé du cas → l'observable, comptée sur toutes les instances 1.5 du bac
//     à sable, par objet — combien de cas portent une clé, combien de clés
//     rendent un observable, combien n'en rendent aucun ;
//   ② la copie : un dépôt de décor au cran 5, `texte_v1` = le passage seul, et
//     le juge reçoit le devoir RÉASSEMBLÉ (`casPourLeRetour[].reassemble`) ;
//   ③ la mesure : porte OUVERTE, `traiterDepot` sur ce dépôt (sans décision : la
//     cible est la compétence de l'observable isolé, aucune sonde) — UNE mesure,
//     UN squelette, les autres observables à `n/a`, les compétences écartées
//     AVEC LEUR MOTIF ; porte FERMÉE, le même exercice mesure large (N) ;
//   ④ les squelettes → le retour : les points ne portent que la compétence de la
//     clé ; le REJEU d'un dépôt mesuré porte fermée est borné au retour
//     (`rejouerLeRetour`, sans écriture) ;
//   ⑤ l'ancrage : aucune citation « copie ET matériau » hors du passage à
//     corriger sur les retours de décor (le classement du banc) ; le signal de
//     recopie au cran 7 ; le « se juger » au cran 2 sur un objet méso ; et le
//     coût par dépôt AVANT / APRÈS (`api_couts`, par phase).
//
// ⛔ BAC À SABLE UNIQUEMENT — refus explicite sinon. `--essai` ÉCRIT (décor) et le
//    dit : la porte `chaine_cle_actif` est OUVERTE le temps de l'essai et REMISE
//    comme trouvée ; les dépôts de décor portent la marque EN BASE
//    (`assigne_at = MARQUE`, `origine = 'prof'`) ; l'état de l'élève de décor
//    (lettres, escalade, montée, niveaux de Monitoring) est écrit sur disque
//    AVANT et reposé par `--retire`, qui vérifie par requête.
// ⚠️ `--essai` dépense : quatre dépôts, ~20 appels (P1/P2, retour, juge, Monitoring).
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
const REGISTRE = path.join(RACINE, 'scripts/recette/.couture-c7l8.json')
const MARQUE = '2026-09-07T07:07:07.707Z'
const arg = (n) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : null }
const a = (n) => process.argv.includes(`--${n}`)
const CLE = arg('--cle') ?? 'argument.garant.absent'
const SOUCHE = CLE.replace(/\./g, '-')
const CLE2 = arg('--cle2') ?? 'argument.garant.connecteur'
const SOUCHE2 = CLE2.replace(/\./g, '-')

const { traiterDepot, rejouerLeRetour, lireContexteDuDepot } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const { lireLaPorteChaineCle, basculerLaPorteChaineCle } = await import(`${RACINE}/utils/chaine/porte-cle.ts`)
const { citationTient } = await import(`${RACINE}/utils/chaine/citation-verifiee.ts`)
const { passagesACorriger } = await import(`${RACINE}/utils/chaine/cle.ts`)

const lu = (quoi, r) => { if (r.error) throw new Error(`${quoi} — ${r.error.code} ${r.error.message}`); return r.data }
const titre = (t) => console.log(`\n${'═'.repeat(78)}\n${t}\n${'═'.repeat(78)}`)
let ok = 0, ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const un = (x) => (Array.isArray(x) ? x[0] ?? null : x)

// ── L'élève de décor ─────────────────────────────────────────────────────────
const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 200 })
const eleve = users.find((x) => x.email === env.TEST_ELEVE_EMAIL)
if (!eleve) throw new Error('élève de test introuvable : ' + env.TEST_ELEVE_EMAIL)

// ── Les portes, MESURÉES ─────────────────────────────────────────────────────
const { data: p } = await admin.from('scriptorium_params').select('*').eq('id', 1).maybeSingle()
const portes = { chaine_cle_actif: !!p?.chaine_cle_actif, gabarit_actif: !!p?.gabarit_actif, juge_documents_actif: !!p?.juge_documents_actif, chaine_actif: !!p?.chaine_actif }
console.log(`bac à sable ${SANDBOX} — portes : ${Object.entries(portes).map(([k, v]) => `${k} ${v ? 'ON' : 'OFF'}`).join(' · ')} ; colonne chaine_cle_actif ${'chaine_cle_actif' in (p ?? {}) ? 'présente' : 'ABSENTE'}`)

// ── Les instances 1.5 de la clé ──────────────────────────────────────────────
const { data: gab } = await admin.from('exercices').select('id, id_import, cran, variante, observable_isole_code, observable_isole_competence, exercices_types(code, grain)').like('id_import', 'ex-gab-%').order('id_import')
const deLaCle = (gab ?? []).filter((e) => e.id_import.includes(SOUCHE))
const deLaCle2 = (gab ?? []).filter((e) => e.id_import.includes(SOUCHE2))
const exAuCran = (n, objet) => (objet ? (gab ?? []).find((e) => e.cran === n && un(e.exercices_types)?.code === objet && un(e.exercices_types)?.grain === 'meso') : deLaCle.find((e) => e.cran === n))

// ════════════════════════════════════════════════════════════════════════════
// ① LA CLÉ DU CAS → L'OBSERVABLE, par objet, des nombres
// ════════════════════════════════════════════════════════════════════════════
async function constat() {
  titre('① la clé du cas → l\'observable — les instances 1.5 du bac à sable')
  const { data: cas } = await admin.from('exercices_cas').select('exercice_id, ordre, probleme').not('probleme', 'is', null)
  const { data: probs } = await admin.from('exercices_problemes').select('cle, observable_code, observable_competence, observable_route')
  const parCle = new Map((probs ?? []).map((x) => [x.cle, x]))
  const parEx = new Map()
  for (const c of cas ?? []) { if (!parEx.has(c.exercice_id)) parEx.set(c.exercice_id, c.probleme) }
  const parObjet = {}
  let avecCle = 0, avecObs = 0, sansObs = 0, absentes = 0
  for (const e of gab ?? []) {
    const objet = un(e.exercices_types)?.code ?? '?'
    parObjet[objet] ??= { instances: 0, cle: 0, observable: 0, sans: 0 }
    parObjet[objet].instances++
    const cle = parEx.get(e.id) ?? null
    if (!cle) continue
    parObjet[objet].cle++; avecCle++
    const pr = parCle.get(cle)
    if (!pr) { absentes++; parObjet[objet].sans++; continue }
    if (pr.observable_route !== false && pr.observable_code) { avecObs++; parObjet[objet].observable++ } else { sansObs++; parObjet[objet].sans++ }
  }
  console.log(`${(gab ?? []).length} instances 1.5 · ${avecCle} avec une clé sur un cas · ${avecObs} clés → observable routé · ${sansObs} sans observable · ${absentes} absentes de la doctrine`)
  for (const [o, v] of Object.entries(parObjet).sort()) console.log(`  ${o.padEnd(12)} instances ${String(v.instances).padStart(3)} · clé ${String(v.cle).padStart(3)} · observable ${String(v.observable).padStart(3)} · sans ${v.sans}`)
  console.log(`${(probs ?? []).length} problèmes dérivés, dont ${(probs ?? []).filter((x) => !x.observable_code || x.observable_route === false).length} sans observable routé`)
  dire(avecCle === (gab ?? []).length && sansObs === 0 && absentes === 0, `① toutes les instances 1.5 portent une clé, et chaque clé rend un observable (${avecObs}/${(gab ?? []).length})`)
  const c5 = exAuCran(5), c7 = exAuCran(7), c2 = exAuCran(2, 'argument')
  console.log(`\nexercices de l'essai : cran 5 ${c5?.id_import ?? '—'} · cran 7 ${c7?.id_import ?? '—'} · cran 2 (méso, argument) ${c2?.id_import ?? '—'}`)
  const { data: decors } = await admin.from('exercices_depots').select('id, statut, exercice_id').eq('eleve_id', eleve.id).eq('assigne_at', MARQUE)
  console.log(`dépôts de décor de cette couture en base : ${decors?.length ?? 0}`)
}

// ════════════════════════════════════════════════════════════════════════════
// LE DÉCOR
// ════════════════════════════════════════════════════════════════════════════
const TABLES_ETAT = ['competences_niveaux', 'competences_escalade', 'competences_montee', 'monitoring_niveaux']
async function registreAvant() {
  const etat = {}
  for (const t of TABLES_ETAT) etat[t] = lu(t, await admin.from(t).select('*').eq('eleve_id', eleve.id)) ?? []
  const reg = { marque: MARQUE, eleve: eleve.id, porteAvant: portes.chaine_cle_actif, etat, ecritLe: new Date().toISOString() }
  fs.writeFileSync(REGISTRE, JSON.stringify(reg, null, 2))
  console.log(`registre AVANT écrit : ${REGISTRE} (porte ${reg.porteAvant ? 'ON' : 'OFF'} ; ${TABLES_ETAT.map((t) => `${t} ${etat[t].length}`).join(', ')})`)
  return reg
}
async function poserUnDepot(ex, texteV1) {
  const ligne = { eleve_id: eleve.id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis', texte_v1: texteV1,
    assigne_at: MARQUE, v1_remis_at: new Date().toISOString(), echeance: new Date(Date.now() + 7 * 86400e3).toISOString() }
  const { data, error } = await admin.from('exercices_depots').insert(ligne).select('id').single()
  if (error) throw new Error(`dépôt sur ${ex.id_import} : ${error.message}`)
  return data.id
}
const materiauDe = async (ex) => {
  const { data } = await admin.from('exercices_cas').select('ordre, probleme, exercices_materiaux(contenu, version_corrigee)').eq('exercice_id', ex.id).order('ordre')
  return (data ?? []).map((c) => ({ ordre: c.ordre, probleme: c.probleme, contenu: un(c.exercices_materiaux)?.contenu ?? null, corrigee: un(c.exercices_materiaux)?.version_corrigee ?? null }))
}
const coutDe = async (depotId) => {
  const { data } = await admin.from('api_couts').select('phase, cout, tokens_entree, tokens_sortie, module').eq('depot_id', depotId)
  const parPhase = {}; let cout = 0, jetons = 0
  for (const r of data ?? []) { const k = r.phase ?? `NULL(${r.module})`; parPhase[k] = (parPhase[k] ?? 0) + 1; cout += Number(r.cout); jetons += Number(r.tokens_entree ?? 0) + Number(r.tokens_sortie ?? 0) }
  return { appels: (data ?? []).length, parPhase, cout: Number(cout.toFixed(4)), jetons }
}
const enBase = async (depotId) => {
  const mes = lu('mesures', await admin.from('competences_mesures').select('competence, observables, lettre_equivalente, sonde_montee').eq('depot_id', depotId))
  const sq = lu('squelettes', await admin.from('exercices_squelettes').select('competence, version').eq('depot_id', depotId))
  const ret = lu('retour', await admin.from('exercices_retours').select('moment, texte').eq('depot_id', depotId).eq('moment', 'chaud').maybeSingle())
  const dep = lu('dépôt', await admin.from('exercices_depots').select('verdicts_cran').eq('id', depotId).maybeSingle())
  return { mesures: mes ?? [], squelettes: sq ?? [], points: Array.isArray(ret?.texte) ? ret.texte : [], verdict: dep?.verdicts_cran?.v1 ?? null }
}
/** Le classement du banc — copie / copie ET matériau (dans, hors passage) / matériau seul / nulle part. */
const classerLesCitations = (points, ctx) => {
  const mats = ctx.casPourLeRetour.map((c) => c.materiau).filter(Boolean)
  const passages = passagesACorriger(ctx.casPourLeRetour)
  const copie = ctx.productionV1 ?? ''
  const out = { points: points.length, sansCit: 0, copie: 0, recopieHors: 0, recopieDans: 0, fuite: 0, nulle: 0 }
  for (const pt of points) {
    const cit = pt?.ancrage?.citation
    if (!cit) { out.sansCit++; continue }
    const dansCopie = citationTient(copie, cit), dansMat = mats.some((m) => citationTient(m, cit)), dansPassage = passages.some((p) => citationTient(p, cit))
    if (dansCopie && dansMat) out[dansPassage ? 'recopieDans' : 'recopieHors']++
    else if (dansCopie) out.copie++
    else if (dansMat) out.fuite++
    else out.nulle++
  }
  return out
}

async function essai() {
  const reg = await registreAvant()
  const c5 = exAuCran(5), c7 = exAuCran(7), c2 = exAuCran(2, 'argument'), c5bis = deLaCle2.find((e) => e.cran === 5)
  if (!c5 || !c7 || !c2 || !c5bis) throw new Error('exercices de décor introuvables (cran 5, 7 de la clé ; cran 5 de la seconde clé ; cran 2 méso argument)')
  console.log(`dépôt A sur ${c5bis.id_import} (${c5bis.observable_isole_code}, ${c5bis.observable_isole_competence}) — la contrainte (élève × exercice) interdit deux dépôts sur le cran 5 de la même clé`)
  if (!portes.gabarit_actif) console.log('⚠️ gabarit_actif OFF : le cran 2 ne servira pas ses pièces ni son « se juger »')
  if (!portes.juge_documents_actif) console.log('⚠️ juge_documents_actif OFF : aucun verdict de cran')

  // ── ② la copie : le passage seul, et le devoir réassemblé ──────────────────
  titre('② la copie du cran 5 — `texte_v1` = le passage seul ; le juge reçoit `reassemble`')
  const [cas5] = await materiauDe(c5)
  const ctx5vide = await lireContexteDuDepot(admin, await poserUnDepot(c5, 'x')) // un dépôt jetable pour lire le passage marqué
  const passage = ctx5vide.casPourLeRetour[0]?.passageMarque ?? ctx5vide.casPourLeRetour[0]?.passageFautif ?? ''
  console.log(`matériau du cas 1 : ${cas5.contenu.length} car. · passage marqué (le trou) : « ${passage.slice(0, 120)}${passage.length > 120 ? '…' : ''} » (${passage.length} car.)`)
  // La réécriture de l'élève : le passage seul, avec le garant qui manquait.
  const v1Passage = `${passage.replace(/\.\s*$/, '')} : or on ne protège bien que ce que l'on connaît.`
  await admin.from('exercices_depots').delete().eq('id', ctx5vide.depotId)

  // ── ③ porte FERMÉE d'abord : la mesure d'hier, large ──────────────────────
  titre('③ porte FERMÉE — la chaîne d\'hier mesure large (dépôt B, cran 5)')
  await basculerLaPorteChaineCle(admin, false)
  const B = await poserUnDepot(c5, v1Passage)
  const ctxB = await lireContexteDuDepot(admin, B)
  dire(ctxB.productionV1 === v1Passage && ctxB.productionV1.length < cas5.contenu.length / 2, `② la production est le passage seul (${ctxB.productionV1.length} car. contre ${cas5.contenu.length} au matériau)`)
  dire(!!ctxB.casPourLeRetour[0]?.reassemble, `② le cas porte \`reassemble\` (avant ${ctxB.casPourLeRetour[0]?.reassemble?.avant.length ?? 0} car., après ${ctxB.casPourLeRetour[0]?.reassemble?.apres.length ?? 0} car.) — le juge lit le devoir réassemblé`)
  dire(ctxB.cle?.cle === CLE && ctxB.cle?.lecture === 'ok' && ctxB.cle?.observableCode === c5.observable_isole_code, `① la clé du cas est lue : « ${ctxB.cle?.cle} » → ${ctxB.cle?.observableCode} (${ctxB.cle?.observableCompetence}), lecture ${ctxB.cle?.lecture}`)
  dire(ctxB.chaineCleActif === false, 'porte fermée, lue par `lireContexte`')
  dire(ctxB.decision === null, '⚠️ dépôt de décor SANS décision : la cible sera la compétence de l\'observable isolé, aucune sonde (on ne fabrique pas de décision à la main)')
  const bilanB = await traiterDepot(admin, B, 'v1')
  const baseB = await enBase(B)
  console.log(`bilan B : mesurées ${bilanB.competencesMesurees.join(', ')} ; écartées ${bilanB.competencesEcartees.map((e) => `${e.competence} (${e.motif.slice(0, 40)}…)`).join(' | ') || 'aucune'} ; retour ${bilanB.retourEcrit ? 'écrit' : 'NON écrit'} ; ${bilanB.appels} appels`)
  console.log(`  alertes : ${bilanB.alertes.map((x) => x.slice(0, 110)).join('\n           ') || 'aucune'}`)
  dire(baseB.mesures.length >= 2, `porte fermée : ${baseB.mesures.length} mesure(s) écrite(s) — ${baseB.mesures.map((m) => m.competence).join(', ')} (la chaîne d'hier, large)`)
  dire(!bilanB.alertes.some((x) => x.includes('C7-L8')), 'porte fermée : aucune alerte du lot')
  const coutB = await coutDe(B)
  console.log(`coût B (porte fermée) : ${coutB.appels} appels ${JSON.stringify(coutB.parPhase)} · ${coutB.jetons} jetons · ${coutB.cout} $`)

  // ── ③ porte OUVERTE : la mesure sur la seule compétence de la clé ─────────
  titre('③ porte OUVERTE — la mesure ne porte que la compétence de l\'observable de la clé (dépôt A, cran 5)')
  await basculerLaPorteChaineCle(admin, true)
  const ctxAvide = await lireContexteDuDepot(admin, await poserUnDepot(c5bis, 'x'))
  const passageBis = ctxAvide.casPourLeRetour[0]?.passageMarque ?? ctxAvide.casPourLeRetour[0]?.passageFautif ?? ''
  await admin.from('exercices_depots').delete().eq('id', ctxAvide.depotId)
  const [cas5bis] = await materiauDe(c5bis)
  console.log(`matériau du cas 1 : ${cas5bis.contenu.length} car. · passage marqué : « ${passageBis.slice(0, 120)}${passageBis.length > 120 ? '…' : ''} »`)
  // La réécriture de l'élève : le passage seul, avec le garant qui manquait — sur CE devoir
  // (le premier essai réutilisait le garant des zoos sur le devoir des téléphones : le juge
  // a dit RATÉ, Calame n'a trouvé aucune réussite, la règle 2 a refusé le retour — un
  // défaut du décor, pas du lot).
  const v1PassageBis = /^Donc il faut interdire/.test(passageBis)
    ? "Donc, puisque ce qui prend le regard prend l'attention et qu'un élève qui n'écoute plus n'apprend plus, il faut interdire les téléphones portables au lycée."
    : `${passageBis.replace(/\.\s*$/, '')}, car ce qui prend le regard prend l'attention.`
  const A = await poserUnDepot(c5bis, v1PassageBis)
  const ctxA = await lireContexteDuDepot(admin, A)
  dire(ctxA.productionV1.length < cas5bis.contenu.length / 2, `② la production de A est le passage seul (${ctxA.productionV1.length} car. contre ${cas5bis.contenu.length})`)
  dire(ctxA.chaineCleActif === true, 'porte ouverte, lue par `lireContexte`')
  const bilanA = await traiterDepot(admin, A, 'v1')
  const baseA = await enBase(A)
  console.log(`bilan A : mesurées ${bilanA.competencesMesurees.join(', ')} ; retour ${bilanA.retourEcrit ? 'écrit' : 'NON écrit'} ; ${bilanA.appels} appels`)
  console.log(`  écartées : ${bilanA.competencesEcartees.map((e) => `${e.competence} — ${e.motif}`).join('\n             ') || 'aucune'}`)
  console.log(`  alertes : ${bilanA.alertes.map((x) => x.slice(0, 140)).join('\n           ') || 'aucune'}`)
  const comp = ctxA.cle?.observableCompetence, code = ctxA.cle?.observableCode
  dire(bilanA.competencesMesurees.length === 1 && bilanA.competencesMesurees[0] === comp, `fait quand (2) — la mesure ne porte que la cible : ${bilanA.competencesMesurees.join(', ')} (aucune sonde : pas de décision)`)
  dire(bilanA.competencesEcartees.length >= 1 && bilanA.competencesEcartees.every((e) => /C7-L8/.test(e.motif)), `les ${bilanA.competencesEcartees.length} autres compétences sont écartées AVEC UN MOTIF servi (C7-L8)`)
  dire(baseA.mesures.length === 1 && baseA.mesures[0].competence === comp, `en base : ${baseA.mesures.length} mesure — ${baseA.mesures.map((m) => m.competence).join(', ')}`)
  const obs = baseA.mesures[0]?.observables ?? {}
  const gardes = Object.entries(obs).filter(([, v]) => v !== 'n/a').map(([k]) => k)
  dire(gardes.length <= 1 && (gardes.length === 0 || gardes[0] === code), `la mesure ne GARDE que l'observable de la clé : ${gardes.join(', ') || '(aucun — n/a partout)'} ; ${Object.keys(obs).length - gardes.length} autre(s) à n/a ; lettre_equivalente ${baseA.mesures[0]?.lettre_equivalente ?? 'null'} (piège 11 : ce que code2 rend avec un seul observable — MESURÉ, à lire au relevé)`)
  console.log(`  observables écrits : ${JSON.stringify(obs)}`)
  dire(baseA.squelettes.length >= 1 && baseA.squelettes.every((s) => s.competence === comp), `${baseA.squelettes.length} squelette(s), tous de ${comp}`)
  dire(bilanA.retourEcrit && baseA.points.length > 0 && baseA.points.every((pt) => pt.competence === comp), `fait quand (2) — les ${baseA.points.length} points du retour ne portent que ${comp}`)
  dire(baseA.verdict !== null || !portes.juge_documents_actif, `le verdict du juge du cran est là (${baseA.verdict ? `${baseA.verdict.reussi ? 'RÉUSSI' : 'RATÉ'} — ${String(baseA.verdict.motif).slice(0, 80)}` : 'aucun'}) — le juge ne bouge pas`)
  for (const pt of baseA.points) console.log(`  · [${pt.nature}] ${pt.competence} — « ${pt.ancrage?.citation ?? '(sans citation)'} » — ${String(pt.texte).slice(0, 110)}`)
  const classA = classerLesCitations(baseA.points, ctxA)
  dire(classA.recopieHors === 0, `fait quand (1) sur le décor — citations : copie ${classA.copie} · copie ET matériau DANS le passage ${classA.recopieDans} · HORS passage ${classA.recopieHors} · matériau seul ${classA.fuite} · nulle part ${classA.nulle} · sans citation ${classA.sansCit}`)
  const elagues = bilanA.alertes.filter((x) => x.includes('recopiée du devoir'))
  console.log(`  citations élaguées comme recopiées : ${elagues.length}${elagues.length ? ' — ' + elagues.map((x) => x.slice(0, 120)).join(' | ') : ''}`)
  const coutA = await coutDe(A)
  console.log(`coût A (porte ouverte) : ${coutA.appels} appels ${JSON.stringify(coutA.parPhase)} · ${coutA.jetons} jetons · ${coutA.cout} $`)
  dire(coutA.appels < coutB.appels && coutA.cout < coutB.cout, `fait quand (4) sur le décor — le coût par dépôt baisse : ${coutB.appels} → ${coutA.appels} appels, ${coutB.cout} → ${coutA.cout} $ (N compétences → une)`)

  // ── ④ le rejeu d'un dépôt mesuré porte FERMÉE : borné au retour ───────────
  titre('④ le REJEU du dépôt B (mesuré porte fermée, N squelettes) — porte ouverte, sans écriture')
  const rejeuB = await rejouerLeRetour(admin, B, { sansEcriture: true })
  const ptsB = rejeuB.retourEngendre?.points ?? []
  console.log(`  alertes : ${rejeuB.alertes.map((x) => x.slice(0, 140)).join('\n           ') || 'aucune'}`)
  dire(rejeuB.alertes.some((x) => /retour borné à/.test(x)), 'le rejeu dit qu\'il a borné le retour et combien de squelettes il a écartés (piège 13)')
  dire(ptsB.length > 0 && ptsB.every((pt) => pt.competence === comp), `les ${ptsB.length} points rejoués ne portent que ${comp} — le filtre vit au même endroit pour la mesure et le rejeu`)
  for (const pt of ptsB) console.log(`  · [${pt.nature}] ${pt.competence} — « ${pt.ancrage?.citation ?? '(sans citation)'} »`)

  // ── ⑤ le signal de recopie au cran 7 (pas d'écran à trou) ─────────────────
  titre('⑤ le signal de recopie — dépôt D au cran 7, v1 = le devoir recopié')
  const [cas7] = await materiauDe(c7)
  const v1Recopie = cas7.corrigee ?? cas7.contenu   // l'élève recopie le devoir en y glissant la correction
  const D = await poserUnDepot(c7, v1Recopie)
  const bilanD = await traiterDepot(admin, D, 'v1')
  const recopie = bilanD.alertes.find((x) => x.startsWith('recopie du devoir'))
  dire(!!recopie, `le signal est journalisé : ${recopie ?? '(absent)'}`)
  dire(!bilanD.alertes.some((x) => /refus|strike/i.test(x) && /recopie/.test(x)), 'un signal, jamais un refus ni un strike')
  const baseD = await enBase(D)
  const classD = classerLesCitations(baseD.points, await lireContexteDuDepot(admin, D))
  console.log(`  retour D : ${baseD.points.length} points — copie ${classD.copie} · recopie DANS passage ${classD.recopieDans} · HORS ${classD.recopieHors} · sans cit ${classD.sansCit} ; élaguées comme recopiées : ${bilanD.alertes.filter((x) => x.includes('recopiée du devoir')).length}`)
  for (const pt of baseD.points) console.log(`  · [${pt.nature}] ${pt.competence} — « ${pt.ancrage?.citation ?? '(sans citation)'} »`)
  dire(classD.recopieHors === 0, 'fait quand (1) sur le décor du cran 7 — aucune citation copie ET matériau hors du passage')
  const coutD = await coutDe(D)
  console.log(`coût D : ${coutD.appels} appels ${JSON.stringify(coutD.parPhase)} · ${coutD.cout} $`)

  // ── ⑤ le « se juger » au cran 2, objet méso ───────────────────────────────
  titre('⑤ le « se juger » — dépôt C au cran 2 (objet méso), porte ouverte puis fermée')
  const C = await poserUnDepot(c2, "Ce qui prend le regard prend l'attention : un élève qui regarde son écran n'écoute plus, et une classe qui n'écoute plus n'apprend plus.")
  await admin.from('exercices_depots').update({ statut: 'assigne', v1_remis_at: null }).eq('id', C)
  let vue = null
  try {
    const { chargerLeDeroule } = await import(`${RACINE}/utils/deroule/vue.ts`)
    const offre = async () => { const v = await chargerLeDeroule(admin, C, eleve.id, { ouvert: true, delaiVfJours: 7 }); return v?.seJuger ?? null }
    vue = await offre()
    const ctxC = await lireContexteDuDepot(admin, C)
    console.log(`  cran 2 ${c2.id_import} — clé « ${ctxC.cle?.cle} » → ${ctxC.cle?.observableCode} (${ctxC.cle?.observableCompetence}) ; servable porte des codes : ${ctxC.servable.slice(0, 3).map((s) => `${s.competence}|${s.observable_code}`).join(', ')}…`)
    const qs = vue?.offre?.questions ?? []
    console.log(`  porte OUVERTE : servie ${vue?.servie} (${vue?.motif ?? '—'}) ; ${qs.length} question(s) : ${qs.map((q) => `${q.competence}|${q.observable_code}`).join(', ') || 'aucune'} ; sans question : ${(vue?.offre?.sansQuestion ?? []).join(', ') || 'aucun'}`)
    dire(qs.length > 0 && qs.every((q) => q.competence === ctxC.cle?.observableCompetence), `fait quand (3) — les questions ne portent que la compétence de la clé (${ctxC.cle?.observableCompetence})`)
    dire(qs.length > 0 && qs[0].observable_code === ctxC.cle?.observableCode, `fait quand (3) — la première question est celle de l'observable de la clé (${qs[0]?.observable_code ?? '—'})`)
    await basculerLaPorteChaineCle(admin, false)
    const vueF = await offre()
    const qsF = vueF?.offre?.questions ?? []
    console.log(`  porte FERMÉE : ${qsF.length} question(s) : ${qsF.map((q) => `${q.competence}|${q.observable_code}`).join(', ') || 'aucune'}`)
    dire(true, `porte fermée : l'élection d'hier (${new Set(qsF.map((q) => q.competence)).size} compétence(s))`)
    await basculerLaPorteChaineCle(admin, true)
  } catch (e) {
    console.log(`  ⚠️ \`chargerLeDeroule\` n'a pas pu être appelé hors Next : ${e.message.slice(0, 200)}`)
    dire(false, 'fait quand (3) — à lire à l\'écran (smoke-cran2.mjs), pas ici')
  }

  // ── la porte, remise comme trouvée ────────────────────────────────────────
  await basculerLaPorteChaineCle(admin, reg.porteAvant)
  dire((await lireLaPorteChaineCle(admin)) === reg.porteAvant, `porte remise comme trouvée (${reg.porteAvant ? 'ON' : 'OFF'})`)
  console.log(`\ndépôts de décor : A ${A} · B ${B} · C ${C} · D ${D} — \`--retire\` les repose.`)
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
    await basculerLaPorteChaineCle(admin, reg.porteAvant)
    dire((await lireLaPorteChaineCle(admin)) === reg.porteAvant, `porte remise comme au registre (${reg.porteAvant ? 'ON' : 'OFF'})`)
  } else console.log('  (pas de registre : l\'état de l\'élève n\'est pas touché, la porte non plus)')
  const { count } = await admin.from('exercices_depots').select('*', { count: 'exact', head: true }).eq('eleve_id', eleve.id).eq('assigne_at', MARQUE)
  dire(count === 0, 'plus aucun dépôt de décor en base (vérifié par requête)')
}

if (a('retire')) await retire()
else if (a('essai')) { await constat(); await essai() }
else await constat()
console.log(`\n${ok} ✓ · ${ko} ✗`)
process.exit(ko ? 1 : 0)
