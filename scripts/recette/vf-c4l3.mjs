// ============================================================================
// RECETTE — LA VERSION FINALE, DE BOUT EN BOUT (`C4L3-14`, et la clause
//           requalifiée du `delta_v1_vf` au « fait quand » de C4-L7).
// ----------------------------------------------------------------------------
// Ce que six tours de C4-L10 n'ont jamais produit : un dépôt qui porte DEUX
// squelettes. Ils n'ont mesuré que des v1 — le retour final, lui, « se compare à
// DEUX squelettes », et sans vf il n'a rien à comparer.
//
//   A. le décor      — une v1 remise sur un dépôt de COMPTE DE TEST
//   B. la chaîne v1  — `chaine_actif` ON le temps d'un appel, puis OFF
//   C. la vf         — une révision qui EXPLICITE le garant resté implicite
//   D. la chaîne vf  — idem
//   E. les contrôles — DEUX squelettes · `delta_v1_vf` NULL **avec son alerte**
//                      · le retour final engendré depuis la comparaison
//
// ⚠️ `chaine_actif` VIT DANS LA BASE PARTAGÉE AVEC LA PRODUCTION, où le cron de
//    `/api/chaine` tourne À LA MINUTE. On l'ouvre donc pour UN appel et on le
//    referme, comme les six séances de C4-L10 — et on le re-constate à OFF à la
//    fin, même en cas d'échec (`finally`).
//
// ⚠️ LES TEXTES SONT ÉCRITS EN BASE AVEC DES `\n\n`, jamais par un formulaire :
//    « un formulaire HTML normalise en CRLF → `blocs()` lit UN SEUL BLOC »
//    (piège CRLF de C4-L4). Ce script ne l'éprouve pas — c'est C4-L3 qui l'attend.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/vf-c4l3.mjs
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.env.PALIMPSESTE_RACINE_DEPOT
  || '/Users/louissagnieres/Documents/GitHub/palimpseste'
const { traiterDepot } = await import(`${RACINE}/utils/chaine/chaine.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const EXERCICE = 'cd2fe916-b465-4e41-a81f-07f0650b4226'

let ok = 0
let ko = 0
const dire = (vrai, quoi, detail = '') => {
  console.log(`  ${vrai ? '✓' : '✗'} ${quoi}${detail ? ` — ${detail}` : ''}`)
  if (vrai) ok += 1; else ko += 1
}

// ── Les deux copies. La vf ne réécrit pas : elle EXPLICITE le garant. ────────
const V1 = `L'esprit à la naissance est comparable à une page blanche, sur laquelle rien n'est encore inscrit. Aucune idée ne nous précède.

On le voit chez l'enfant, qui ne sait rien du monde avant de l'avoir touché, goûté, entendu. Ses premières notions lui viennent des sens.

Donc tout ce que nous savons vient de l'expérience.`

const VF = `L'esprit à la naissance est comparable à une page blanche, sur laquelle rien n'est encore inscrit. Aucune idée ne nous précède, et c'est l'expérience seule qui viendra l'écrire.

On le voit chez l'enfant, qui ne sait rien du monde avant de l'avoir touché, goûté, entendu. Ses premières notions lui viennent des sens. Or si une idée était innée, elle se trouverait chez tous les enfants sans exception et dès l'origine : c'est précisément ce qu'on n'observe jamais.

Donc, puisque rien ne se trouve dans l'esprit qui n'ait d'abord été donné par les sens, tout ce que nous savons vient de l'expérience.`

// ── Le pilote de l'interrupteur ─────────────────────────────────────────────
async function lireLeFlag() {
  const { data, error } = await admin.from('scriptorium_params')
    .select('id, chaine_actif').limit(1).maybeSingle()
  if (error) throw new Error(`lecture de scriptorium_params : ${error.message}`)
  return data
}
async function poserLeFlag(id, valeur) {
  const { error } = await admin.from('scriptorium_params')
    .update({ chaine_actif: valeur }).eq('id', id)
  if (error) throw new Error(`écriture de chaine_actif : ${error.message}`)
}

/** Un appel de chaîne, fenêtre ouverte le temps strict de l'appel. */
async function chaineLeTempsDUnAppel(paramsId, depotId, version) {
  await poserLeFlag(paramsId, true)
  try {
    return await traiterDepot(admin, depotId, version)
  } finally {
    await poserLeFlag(paramsId, false)
  }
}

const params = await lireLeFlag()

console.log('\n── A. le décor — un dépôt de COMPTE DE TEST, v1 remise ──────────────────')
dire(params?.chaine_actif === false, '`chaine_actif` est à OFF avant la recette',
  String(params?.chaine_actif))

const { data: deps, error: eDeps } = await admin.from('exercices_depots')
  .select('id, eleve_id, statut').eq('exercice_id', EXERCICE).order('id')
if (eDeps) throw new Error(`dépôts : ${eDeps.message}`)
const { data: profils } = await admin.from('profiles')
  .select('id, display_name').in('id', deps.map((d) => d.eleve_id))
const nomDe = new Map((profils ?? []).map((p) => [p.id, p.display_name]))

// ⛔ LA GARDE QUI COMPTE : on ne touche JAMAIS un élève réel. Les seuls élèves
//    réels de la base sont ceux de THLP — Louis l'a nommé.
const { data: classes } = await admin.from('classes').select('id, nom')
const idTHLP = (classes ?? []).find((c) => c.nom === 'THLP')?.id
const { data: insTHLP } = await admin.from('inscriptions').select('eleve_id').eq('classe_id', idTHLP)
const reels = new Set((insTHLP ?? []).map((i) => i.eleve_id))
const candidats = deps.filter((d) => !reels.has(d.eleve_id))
dire(candidats.length === deps.length,
  'AUCUN dépôt de cet exercice n’appartient à un élève réel (THLP)',
  `${deps.length} dépôt(s), ${deps.length - candidats.length} réel(s)`)
if (candidats.length === 0) throw new Error('aucun dépôt sur compte de test — on s’arrête.')

const cible = candidats[0]
console.log(`  → dépôt retenu : ${cible.id.slice(0, 8)} · ${nomDe.get(cible.eleve_id)}`)

const instant = new Date().toISOString()
const { error: eV1 } = await admin.from('exercices_depots')
  .update({ texte_v1: V1, statut: 'v1_remis', v1_remis_at: instant, ouvert_at: instant })
  .eq('id', cible.id)
if (eV1) throw new Error(`remise v1 : ${eV1.message}`)
dire(true, 'v1 remise', `${V1.length} car., ${V1.split(/\n\s*\n/).length} bloc(s)`)

console.log('\n── B. la chaîne sur la v1 ──────────────────────────────────────────────')
const bilanV1 = await chaineLeTempsDUnAppel(params.id, cible.id, 'v1')
console.log(`  → ${bilanV1.appels} appel(s), ${Math.round(bilanV1.dureeMs / 1000)} s`)
dire(bilanV1.competencesMesurees.length > 0, 'au moins une compétence mesurée',
  bilanV1.competencesMesurees.join(', ') || 'AUCUNE')
dire(bilanV1.mesuresEcrites > 0, 'une mesure est écrite', String(bilanV1.mesuresEcrites))
dire(bilanV1.retourEcrit, 'un retour est engendré sur la v1')
for (const a of bilanV1.alertes) console.log(`     ⚠️  ${a}`)
for (const e of bilanV1.competencesEcartees) console.log(`     · écartée : ${e.competence} — ${e.motif}`)

console.log('\n── C. la version finale, remise ────────────────────────────────────────')
const instantVf = new Date().toISOString()
const { error: eVf } = await admin.from('exercices_depots')
  .update({ texte_vf: VF, statut: 'vf_remis', vf_remis_at: instantVf })
  .eq('id', cible.id)
if (eVf) throw new Error(`remise vf : ${eVf.message}`)
dire(true, 'vf remise', `${VF.length} car., ${VF.split(/\n\s*\n/).length} bloc(s)`)

console.log('\n── D. la chaîne sur la vf ──────────────────────────────────────────────')
const bilanVf = await chaineLeTempsDUnAppel(params.id, cible.id, 'vf')
console.log(`  → ${bilanVf.appels} appel(s), ${Math.round(bilanVf.dureeMs / 1000)} s`)
dire(bilanVf.competencesMesurees.length > 0, 'au moins une compétence traitée sur la vf',
  bilanVf.competencesMesurees.join(', ') || 'AUCUNE')
// « LA VF N'ÉCRIT JAMAIS DANS LES MESURES » (piège 16).
dire(bilanVf.mesuresEcrites === 0,
  '⭐ la vf n’écrit AUCUNE mesure — elle attache son delta à celle de la v1 (piège 16)',
  String(bilanVf.mesuresEcrites))
for (const a of bilanVf.alertes) console.log(`     ⚠️  ${a}`)

console.log('\n── E. les contrôles, en base ───────────────────────────────────────────')
const { data: sq } = await admin.from('exercices_squelettes')
  .select('competence, version, artefact_extraction, artefact_jugement')
  .eq('depot_id', cible.id)
const versions = new Set((sq ?? []).map((s) => s.version))
dire(versions.has('v1') && versions.has('vf'),
  '⭐⭐ LE DÉPÔT PORTE DEUX SQUELETTES — v1 ET vf',
  [...versions].join(' + ') || 'aucun')
dire((sq ?? []).every((s) => s.artefact_extraction !== null),
  'chaque squelette porte son extraction')

const { data: mes } = await admin.from('competences_mesures')
  .select('competence, lettre_equivalente, delta_v1_vf, observables')
  .eq('depot_id', cible.id)
dire((mes ?? []).length > 0, 'la mesure de la v1 est en base',
  (mes ?? []).map((m) => `${m.competence}=${m.lettre_equivalente}`).join(' · '))
dire((mes ?? []).every((m) => m.delta_v1_vf === null),
  '`delta_v1_vf` est NULL — aucune fiche ne définit son delta (item 47)')

// ⭐ LA CLAUSE REQUALIFIÉE DE C4-L7 : « calculé, OU NULL ACCOMPAGNÉ DE SON
//   ALERTE NOMMÉE ». Un NULL silencieux reste un échec de recette.
const alerteDelta = bilanVf.alertes.filter((a) => a.includes('delta_v1_vf'))
dire(alerteDelta.length > 0,
  '⭐⭐ LE NULL SE DÉCLARE — la clause requalifiée de C4-L7 est satisfaite',
  alerteDelta[0] ?? 'AUCUNE ALERTE : le NULL est SILENCIEUX, la clause échoue')

const { data: dep2 } = await admin.from('exercices_depots')
  .select('statut, texte_v1, texte_vf').eq('id', cible.id).maybeSingle()
dire(!!dep2?.texte_v1 && !!dep2?.texte_vf, 'les deux textes sont en base',
  `v1 ${dep2?.texte_v1?.length ?? 0} car. · vf ${dep2?.texte_vf?.length ?? 0} car.`)

// ⚠️ La table dit `moment`, pas `version`, et son `check` n'admet que deux
//    valeurs : `chaud` (la v1) et `final` (« le retour final engendré depuis la
//    comparaison des deux squelettes », `c4_l1_schema.sql` l.611-613).
const { data: ret, error: eRet } = await admin.from('exercices_retours')
  .select('moment, texte, registre_servi, published_at').eq('depot_id', cible.id)
if (eRet) throw new Error(`retours : ${eRet.message}`)
console.log(`  → ${(ret ?? []).length} retour(s) en base : ${(ret ?? []).map((r) => r.moment).join(', ') || '—'}`)
const retourFinal = (ret ?? []).find((r) => r.moment === 'final')
dire(!!retourFinal,
  '⭐⭐ LE RETOUR FINAL EST ENGENDRÉ — depuis la comparaison des deux squelettes')
if (retourFinal) {
  // ⚠️ `exercices_retours.texte` est une LISTE DE POINTS en jsonb, pas une
  //    chaîne : chaque point porte `nature`, `texte` et son `ancrage.citation`.
  //    Un `String(p)` rendait « [object Object] » — et le seul but de ce bloc
  //    est de RELIRE le retour (RR1-RR4, `C4L5-1bis`).
  const pts = Array.isArray(retourFinal.texte) ? retourFinal.texte : [retourFinal.texte]
  console.log('\n  ── le retour final, tel que l’élève le lira ──')
  for (const p of pts) {
    if (p && typeof p === 'object') {
      console.log(`     [${p.nature}] ${String(p.texte ?? '').replace(/\n/g, '\n       ')}`)
      if (p.ancrage?.citation) console.log(`        ↳ cite : « ${p.ancrage.citation} »`)
    } else {
      console.log(`     · ${String(p).replace(/\n/g, '\n       ')}`)
    }
  }
  if (retourFinal.registre_servi) console.log(`     registre : ${retourFinal.registre_servi}`)
}

const apres = await lireLeFlag()
console.log('')
dire(apres?.chaine_actif === false, '⭐ `chaine_actif` est REVENU à OFF', String(apres?.chaine_actif))

console.log('\n════════════════════════════════════════════════════════════════════════')
console.log(`RECETTE VF — ${ok} vérification(s) passée(s), ${ko} en échec.`)
console.log(`Appels payés : ${bilanV1.appels + bilanVf.appels}`)
console.log('════════════════════════════════════════════════════════════════════════\n')
