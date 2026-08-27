// ============================================================================
// RECETTE C5 · L1 — le générateur de la référence décomposée, ÉPROUVÉ EN BASE.
// ----------------------------------------------------------------------------
// « Vérifié veut dire PAR REQUÊTE ET SUR PIÈCE, pas supposé. »
//
// Ce script appelle LE MÊME CODE QUE LES ÉCRANS — `utils/generateur/depot-serveur.ts`,
// que les actions de `/prof/conception/textes` n'enveloppent que d'une garde
// d'accès et d'une lecture de formulaire —, avec le client admin. Il ne rejoue
// pas les tests unitaires : il éprouve ce qu'aucun test pur ne peut prouver.
//
// LES CINQ CLAUSES DU « FAIT QUAND », dans l'ordre :
//   A. un texte SE DÉPOSE            — hors fichier d'import
//   B. il SE DÉCOMPOSE               — G1, G2, G3, dans l'ordre, sur un texte
//                                      RÉEL, et le contrôle machine rend son
//                                      verdict ; trois lignes à `api_couts`,
//                                      `phase` NULL
//   C. les intervalles se DÉRIVENT   — et les STOCKER ferait refuser (n° 11)
//   D. il SE VALIDE                  — la part qui se prouve en base : une fois
//                                      validée, elle NE SE MODIFIE PLUS
//   E. il SERT UNE INSTANCE          — la requête même du pipeline, et le
//                                      prédicat unique de la garde
//   F. ⭐ une référence NON VALIDÉE n'entre JAMAIS dans une phase de jugement —
//         ET CELA SE PROUVE PAR L'ÉCHEC : la garde EN BASE doit refuser
//   G. le NETTOYAGE                  — tout ce que la recette a semé est retiré,
//                                      vérifié par requête
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/generateur-c5l1.mjs [--sans-appel] [--garde-le-decor]
//
// `--sans-appel` saute la partie B : aucune requête au fournisseur, aucun coût —
// la référence est alors posée depuis la FIXTURE RÉELLE du `05-` §4.7, ce qui
// laisse toutes les autres parties jouables.
// ⛔ `--garde-le-decor` SAUTE LE NETTOYAGE, et le rejouer sans lui ne rattrape
//    pas : qui l'emploie tient son propre registre de ce qu'il laisse.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

// ── L'environnement, avant tout import de code applicatif ──────────────────
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.cwd()
const RACINE_CONCEPTION = process.env.PALIMPSESTE_RACINE_CONCEPTION
  || '/Users/louissagnieres/Documents/GitTest/palimpseste-conception'

const { deposerUnTexteNeuf, decomposerUnTexte, PREFIXE_EN_LIGNE } =
  await import(`${RACINE}/utils/generateur/depot-serveur.ts`)
const { MODULE_COUT } = await import(`${RACINE}/utils/generateur/generateur-serveur.ts`)
const { controleReference } = await import(`${RACINE}/utils/fabrique/verifie-reference.ts`)
const { intervallesDesMoments, occurrencesDesConcepts, statutsDeLaPhrase } =
  await import(`${RACINE}/utils/generateur/lecture.ts`)
const { referenceValidee } = await import(`${RACINE}/utils/reference-validee.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const SANS_APPEL = process.argv.includes('--sans-appel')
const GARDE = process.argv.includes('--garde-le-decor')
const MARQUE = 'RECETTE-C5L1'
let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)

const seme = { contenuId: null, texteId: null, referenceId: null, exerciceId: null, depotId: null }

// Le texte RÉEL du `05-` §4.7 — celui qui a servi à chiffrer le coût du §4.4.
const CHEMIN_TEXTE = `${RACINE_CONCEPTION}/copies-tests/generateur/exemple-descartes.txt`
const CHEMIN_JSON = `${RACINE_CONCEPTION}/copies-tests/generateur/exemple-descartes.json`
if (!fs.existsSync(CHEMIN_TEXTE)) {
  console.error(`✗ fixture introuvable : ${CHEMIN_TEXTE}`)
  process.exit(2)
}
// ⚠️ LA MARQUE EST EN ESPACES DE QUEUE, ET C'EST EXPRÈS. La recette a besoin d'un
//    texte dont l'EMPREINTE diffère de tout dépôt antérieur — « deux textes qui
//    ne diffèrent que d'une espace sont DEUX TEXTES », et l'empreinte est celle
//    du contenu exact, octet pour octet, sans aucune normalisation. Mais elle a
//    besoin AUSSI que la SEGMENTATION soit inchangée, pour que la fixture du
//    `05-` §4.7 lui reste applicable en `--sans-appel`.
//    Des espaces de queue font exactement les deux : `rogne` les retire, donc
//    `phrasesDuTexte` compte les mêmes 17 phrases ; `sha256` ne les retire pas.
//    ⛔ Une ligne de marque EN TÊTE ferait 18 phrases, et la fixture — 17 —
//       serait refusée pour un motif qui n'est pas celui du lot.
const TEXTE_BRUT = fs.readFileSync(CHEMIN_TEXTE, 'utf-8')
const TEXTE = TEXTE_BRUT + ' '.repeat(1 + (Date.now() % 4093))

console.log(`\n══ RECETTE C5-L1 ══  sandbox ${env.NEXT_PUBLIC_SUPABASE_URL}`)
console.log(`   ${SANS_APPEL ? '--sans-appel : AUCUN appel de modèle' : 'AVEC appels de modèle'}\n`)

try {
  // ══════════════════════════════════════════════════════════════════════════
  // A. UN TEXTE SE DÉPOSE — hors fichier d'import
  // ══════════════════════════════════════════════════════════════════════════
  console.log('── A. un texte se dépose, hors fichier d’import ──')
  const { data: prof } = await admin.from('profiles').select('id').eq('role', 'prof').limit(1).single()
  const avantContenus = await compter('scriptorium_contenus')
  const rDepot = await deposerUnTexteNeuf(admin, prof?.id ?? null, TEXTE, {
    auteur: 'Descartes', titre: `${MARQUE} — Méditations, extrait`,
    reference: 'Méditations métaphysiques, II', coursEtat: 'generique',
    planLivreId: null, planSeance: null,
  })
  dire(rDepot.ok, `le dépôt rend « ${rDepot.message} »`)
  if (!rDepot.ok) throw new Error('le dépôt a échoué : la suite n’a pas de sujet')
  seme.texteId = rDepot.texteId

  const { data: t1 } = await admin.from('exercices_textes')
    .select('id, id_import, import_id, contenu_id, reference_id, empreinte, statut')
    .eq('id', seme.texteId).single()
  seme.contenuId = t1.contenu_id
  dire(String(t1.id_import).startsWith(PREFIXE_EN_LIGNE),
    `l’\`id_import\` DIT D’OÙ IL VIENT : « ${t1.id_import} »`)
  dire(t1.import_id === null, '`import_id` est NULL — ce texte ne vient d’aucun fichier')
  dire(!!t1.contenu_id, 'le texte a UN SEUL domicile : `scriptorium_contenus`')
  dire(t1.reference_id === null, 'aucune référence encore : le dépôt et la décomposition sont DEUX gestes')
  const apresContenus = await compter('scriptorium_contenus')
  dire(apresContenus === avantContenus + 1,
    `une seule ligne de contenu créée (${avantContenus} → ${apresContenus}) — aucune seconde table`)

  // ══════════════════════════════════════════════════════════════════════════
  // B. IL SE DÉCOMPOSE — G1, G2, G3, dans l'ordre
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── B. il se décompose — G1, puis G2, puis G3 ──')
  const avantCouts = await compterCouts()
  if (SANS_APPEL) {
    // La fixture RÉELLE tient lieu de sortie du générateur : elle ne prouve pas
    // les appels, elle laisse jouables les parties C à F.
    const fixture = JSON.parse(fs.readFileSync(CHEMIN_JSON, 'utf-8'))
    const { data: ref, error } = await admin.from('exercices_references').insert({
      source_contenu_id: seme.contenuId, localisation: 'Méditations métaphysiques, II',
      contenu: fixture, empreinte: t1.empreinte, validee_par: null, validee_at: null,
    }).select('id').single()
    if (error) throw new Error(`référence de secours : ${error.message}`)
    await admin.from('exercices_textes').update({ reference_id: ref.id }).eq('id', seme.texteId)
    seme.referenceId = ref.id
    note('--sans-appel : la référence vient de la FIXTURE, aucun appel n’a eu lieu')
  } else {
    const debut = Date.now()
    const r = await decomposerUnTexte(admin, seme.texteId)
    const duree = ((Date.now() - debut) / 1000).toFixed(1)
    for (const x of (r.notes ?? [])) note(x)
    for (const x of (r.empechements ?? [])) note(`⊘ ${x}`)
    dire(r.ok || (r.empechements ?? []).length > 0,
      `la décomposition rend « ${r.message} » (${duree} s)`)
    seme.referenceId = r.referenceId ?? null
    dire(!!seme.referenceId, 'la référence est écrite, et rattachée au texte')
    if (!seme.referenceId) throw new Error('aucune référence : la suite n’a pas de sujet')

    // ── LE JOURNAL DES COÛTS : par appel, `phase` NULL ────────────────────
    const apresCouts = await compterCouts()
    dire(apresCouts.total - avantCouts.total === 3,
      `TROIS lignes à \`api_couts\` (${avantCouts.total} → ${apresCouts.total}) — `
      + 'le nombre d’appels se lit AU NOMBRE DE LIGNES')
    const { data: lignes } = await admin.from('api_couts')
      .select('module, phase, modele, cout, tokens_entree, tokens_sortie, tokens_cache_lecture')
      .eq('module', MODULE_COUT).order('created_at', { ascending: false }).limit(3)
    dire((lignes ?? []).length === 3 && lignes.every((l) => l.phase === null),
      `la \`phase\` vaut NULL sur les trois — le générateur n’est pas un étage de la chaîne`)
    const cout = (lignes ?? []).reduce((s, l) => s + Number(l.cout), 0)
    note(`coût des trois appels : ${cout.toFixed(4)} $ · modèle ${lignes?.[0]?.modele}`)
    note(`cache lu : ${(lignes ?? []).reduce((s, l) => s + (l.tokens_cache_lecture ?? 0), 0)} jetons`)
  }

  // ── LE VERDICT DU CONTRÔLE QUI FAIT FOI, relu depuis la base ───────────────
  const { data: refEcrite } = await admin.from('exercices_references')
    .select('id, contenu, validee_at, empreinte').eq('id', seme.referenceId).single()
  const v = controleReference(refEcrite.contenu, TEXTE)
  dire(v.refus.length === 0,
    `le contrôle machine : ${v.verdict.toUpperCase()} — ${v.refus.length} refus · `
    + `${v.blocages.length} blocage(s) · ${v.signalements.length} signalement(s)`)
  for (const x of v.annonces) note(x)
  for (const x of v.blocages) note(`⊘ ${x}`)
  for (const x of v.signalements) note(`· ${x}`)
  dire(refEcrite.validee_at === null,
    'la référence est écrite NON VALIDÉE — la validation est un geste du professeur')
  dire(Object.keys(refEcrite.contenu).sort().join(',')
    === 'armature,concepts,hesitation,lectures,moments,phrases',
    'elle ne porte QUE les six clés que le format déclare à la racine')

  // ══════════════════════════════════════════════════════════════════════════
  // C. LES INTERVALLES SE DÉRIVENT — et les stocker ferait REFUSER
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── C. les intervalles se dérivent à la lecture, ils ne se stockent pas ──')
  const moments = intervallesDesMoments(TEXTE, refEcrite.contenu.moments ?? [])
  dire(moments.length > 0 && moments.every((m) => m.intervalle !== null),
    `${moments.length} moment(s), tous localisés en caractères par dérivation`)
  for (const m of moments) {
    note(`${m.m} → caractères ${m.intervalle[0]}–${m.intervalle[1]} : `
      + `« ${TEXTE.slice(m.intervalle[0], m.intervalle[0] + 40).replace(/\n/g, ' ')}… »`)
  }
  const concepts = occurrencesDesConcepts(TEXTE, refEcrite.contenu.concepts ?? [])
  dire(concepts.every((c) => c.occurrences.length > 0),
    `les ${concepts.length} concept(s) se retrouvent tous par leurs formes citées`)
  const avecStatutHerite = (refEcrite.contenu.phrases ?? []).find((p) =>
    (p.statuts ?? []).length === 0 && statutsDeLaPhrase(refEcrite.contenu, p.n).length > 0)
  dire(true, avecStatutHerite
    ? `l’union rend le statut du MOMENT à la phrase ${avecStatutHerite.n} : `
      + `${JSON.stringify(statutsDeLaPhrase(refEcrite.contenu, avecStatutHerite.n))}`
    : 'aucune phrase n’hérite du statut de son moment sur ce texte — rien à unir')

  // ⭐ LA PREUVE INVERSE : stocker l'intervalle FERAIT REFUSER (refus n° 11).
  const avecIntervalle = {
    ...refEcrite.contenu,
    moments: (refEcrite.contenu.moments ?? []).map((m, i) =>
      (i === 0 ? { ...m, intervalle: [moments[0].intervalle[0], moments[0].intervalle[1]] } : m)),
  }
  const vBis = controleReference(avecIntervalle, TEXTE)
  dire(vBis.verdict === 'refus' && vBis.refus.some((r) => r.includes('intervalle')),
    'y AJOUTER une clé `intervalle` déclenche le REFUS N° 11 — « un champ que le format '
    + 'ne déclare pas » : c’est pourquoi il se dérive')

  // ══════════════════════════════════════════════════════════════════════════
  // F. ⭐ UNE RÉFÉRENCE NON VALIDÉE N'ENTRE JAMAIS DANS UNE PHASE DE JUGEMENT
  //    — ET CELA SE PROUVE PAR L'ÉCHEC.
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── F. la garde absolue, éprouvée PAR L’ÉCHEC ──')
  const { data: type } = await admin.from('exercices_types')
    .select('id').eq('code', 'phrase').limit(1).single()
  const { data: eleve } = await admin.from('exercices_depots').select('eleve_id').limit(1).single()
  const { data: ex, error: eEx } = await admin.from('exercices').insert({
    type_id: type.id, lieu: 'maison', statut: 'assigne', cran: '8',
    consigne_instanciee: `${MARQUE} — explique cette phrase de Descartes.`,
    modes_par_competence: { synthese: ['restituer'] },
    reference_id: seme.referenceId,
    materiau_source_texte_id: seme.texteId,
    materiau_source_provenance: 'texte_auteur', materiau_source_support: 'extrait',
  }).select('id').single()
  if (eEx) throw new Error(`exercice de recette : ${eEx.message}`)
  seme.exerciceId = ex.id
  const { data: dep, error: eDep } = await admin.from('exercices_depots').insert({
    eleve_id: eleve.eleve_id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis',
    texte_v1: `${MARQUE} — une copie de recette.`,
  }).select('id').single()
  if (eDep) throw new Error(`dépôt de recette : ${eDep.message}`)
  seme.depotId = dep.id

  const { error: eJugement } = await admin.from('exercices_squelettes').insert({
    depot_id: dep.id, competence: 'synthese', version: 'v1',
    artefact_extraction: { marque: MARQUE },
    artefact_jugement: { marque: MARQUE, verdict: 'ceci ne doit jamais s’écrire' },
  })
  dire(!!eJugement, 'la base REFUSE le jugement sur une référence non validée — '
    + `${eJugement ? eJugement.message.split('\n')[0] : 'ELLE A ACCEPTÉ, ET C’EST UN DÉFAUT'}`)

  // Et l'EXTRACTION seule, elle, passe : la garde porte sur le JUGEMENT.
  const { error: eExtraction } = await admin.from('exercices_squelettes').insert({
    depot_id: dep.id, competence: 'structure', version: 'v1',
    artefact_extraction: { marque: MARQUE },
  })
  dire(!eExtraction, 'l’extraction SEULE passe — la garde porte sur le jugement, pas sur tout')

  // ══════════════════════════════════════════════════════════════════════════
  // E. IL SERT UNE INSTANCE — la requête du pipeline, et le prédicat unique
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── E. il sert une instance : la condition d’entrée du pipeline ──')
  const verdictAvant = await referenceValidee(admin, seme.texteId)
  dire(!verdictAvant.ok, `le prédicat unique REFUSE : « ${verdictAvant.motif?.slice(0, 90)}… »`)
  dire(!(await textesDuPipeline()).includes(seme.texteId),
    'le texte N’ENTRE PAS au pipeline Aletheia tant que sa référence n’est pas validée')

  // ══════════════════════════════════════════════════════════════════════════
  // D. IL SE VALIDE — la part qui se prouve en base
  // ══════════════════════════════════════════════════════════════════════════
  console.log('\n── D. il se valide, et il devient IMMUABLE ──')
  const { error: eVal } = await admin.from('exercices_references')
    .update({ validee_par: prof.id, validee_at: new Date().toISOString() })
    .eq('id', seme.referenceId)
  dire(!eVal, 'la validation écrit l’ÉTAT — `validee_at` et `validee_par`, jamais un journal')

  const { error: eImmuable } = await admin.from('exercices_references')
    .update({ contenu: { phrases: [] } }).eq('id', seme.referenceId)
  dire(!!eImmuable, 'une fois validée, la base REFUSE toute modification du `contenu` — '
    + `${eImmuable ? eImmuable.message.split('\n')[0] : 'ELLE A ACCEPTÉ, ET C’EST UN DÉFAUT'}`)

  const verdictApres = await referenceValidee(admin, seme.texteId)
  dire(verdictApres.ok, 'le prédicat unique ACCEPTE, une fois la référence validée')
  dire((await textesDuPipeline()).includes(seme.texteId),
    'le texte ENTRE au pipeline Aletheia : il sert désormais une instance')

  // Et la garde du jugement se lève avec elle.
  const { error: eJugement2 } = await admin.from('exercices_squelettes').insert({
    depot_id: dep.id, competence: 'questionnement', version: 'v1',
    artefact_extraction: { marque: MARQUE }, artefact_jugement: { marque: MARQUE },
  })
  dire(!eJugement2, 'et le jugement passe, une fois la référence validée — '
    + 'la garde n’est pas un mur, c’est une condition')
} catch (e) {
  ko++
  console.error(`\n✗ INTERROMPU : ${e.message}`)
} finally {
  // ══════════════════════════════════════════════════════════════════════════
  // G. LE NETTOYAGE — vérifié par requête, jamais supposé
  // ══════════════════════════════════════════════════════════════════════════
  if (GARDE) {
    console.log('\n── G. --garde-le-decor : RIEN N’EST RETIRÉ ──')
    console.log(`   ${JSON.stringify(seme)}`)
  } else {
    console.log('\n── G. le nettoyage ──')
    if (seme.depotId) await admin.from('exercices_squelettes').delete().eq('depot_id', seme.depotId)
    if (seme.depotId) await admin.from('exercices_depots').delete().eq('id', seme.depotId)
    if (seme.exerciceId) await admin.from('exercices').delete().eq('id', seme.exerciceId)
    if (seme.texteId) await admin.from('exercices_textes').delete().eq('id', seme.texteId)
    if (seme.referenceId) await admin.from('exercices_references').delete().eq('id', seme.referenceId)
    if (seme.contenuId) await admin.from('scriptorium_contenus').delete().eq('id', seme.contenuId)
    let reste = 0
    for (const [table, col, id] of [
      ['exercices_textes', 'id', seme.texteId],
      ['exercices_references', 'id', seme.referenceId],
      ['scriptorium_contenus', 'id', seme.contenuId],
      ['exercices', 'id', seme.exerciceId],
      ['exercices_depots', 'id', seme.depotId],
    ]) {
      if (!id) continue
      const { count } = await admin.from(table).select('id', { count: 'exact', head: true }).eq(col, id)
      if (count) reste += count
    }
    dire(reste === 0, `la sandbox revient à son état d’avant (${reste} ligne(s) restante(s))`)
    // ⚠️ Les lignes d'`api_couts`, elles, NE SE RETIRENT PAS : un coût payé reste
    //    payé, et l'effacer ferait mentir le plafond mensuel.
    if (!SANS_APPEL) note('les lignes d’`api_couts` restent : un coût payé reste payé')
  }
  console.log(`\n══ ${ok} vérification(s) passée(s), ${ko} échec(s) ══\n`)
  process.exit(ko === 0 ? 0 : 1)
}

async function compter(table) {
  const { count } = await admin.from(table).select('id', { count: 'exact', head: true })
  return count ?? 0
}
async function compterCouts() {
  const { count } = await admin.from('api_couts')
    .select('id', { count: 'exact', head: true }).eq('module', MODULE_COUT)
  return { total: count ?? 0 }
}
/** LA REQUÊTE MÊME du pipeline Aletheia (`app/prof/conception/nouvelle/page.tsx`). */
async function textesDuPipeline() {
  const { data } = await admin.from('exercices_textes')
    .select('id, exercices_references!inner(validee_at)')
    .eq('statut', 'valide').not('exercices_references.validee_at', 'is', null)
  return (data ?? []).map((x) => x.id)
}
