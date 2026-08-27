// ============================================================================
// RECETTE C5 · L2 — LA PASSATION DE LECTURE, ÉPROUVÉE PAR REQUÊTE.
// ----------------------------------------------------------------------------
// « VÉRIFIÉ VEUT DIRE PAR REQUÊTE ET SUR PIÈCE, PAS SUPPOSÉ. »
//
// Ce script appelle LE MÊME CODE QUE LES ÉCRANS — la liste, la porte, le
// chargeur du déroulé, le contexte de la chaîne, le contrôle du retour —, avec
// le client admin. Il ne rejoue pas les tests unitaires : il éprouve ce
// qu'aucun test pur ne peut prouver, LA MÉCANIQUE EN BASE.
//
// LES TROIS CHOSES, dans l'ordre, plus le « fait quand » :
//   A. le décor        — un texte RÉEL à référence validée, une instance de
//                        LECTURE à la maison, son dépôt
//   B. ① LA PORTE      — la liste par atelier, les deux routes, et la borne
//                        DANS LES DEUX SENS ; la porte `exercices_actif`
//   C. ② LE TEXTE      — l'englobant servi, la sélection marquée, et ⛔ PAS UN
//                        OCTET RETOUCHÉ, comparé à la base
//   D. ③ LA RÉFÉRENCE  — `exercices.reference_id` posée : la chaîne a le texte,
//                        ET la garde en base MORD (prouvé PAR L'ÉCHEC)
//   E. RR3             — le texte support balisé au modèle, et ⭐ LA PREUVE PAR
//                        L'ÉCHEC : une phrase de l'auteur étiquetée « copie »
//   F. la traversée    — le déroulé jusqu'à la remise, puis la chaîne (payante)
//   G. le nettoyage    — tout ce que la recette a semé est retiré, par requête
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/lecture-c5l2.mjs [--avec-chaine] [--garde-le-decor]
//
// `--avec-chaine`     joue la section F jusqu'au bout : LA CHAÎNE PART, DES
//                     APPELS SONT PAYÉS. Sans lui, la traversée s'arrête à la
//                     remise et la file est nettoyée — aucun modèle n'est appelé.
// ⛔ `--garde-le-decor` SAUTE LE NETTOYAGE ; qui l'emploie tient son propre
//    registre de ce qu'il laisse.
//
// ⭐ DEUX MODES À PART, POUR LE SMOKE À L'ÉCRAN — ils ne jouent AUCUNE
//    vérification : ils posent le décor dans une classe RÉELLE, pour un élève
//    RÉEL, parce que la liste de l'élève est bornée par sa classe en contexte
//    (`01-` §2) et qu'une classe de recette n'y apparaîtrait jamais.
//
//   --decor-smoke <eleveId> <classeId>   sème deux instances (une de LECTURE,
//                                        une d'ÉCRITURE) et leurs dépôts, et
//                                        imprime les quatre URL à éprouver ;
//   --retirer-smoke <classeId>           les retire, elles et tout ce qui en
//                                        dépend.
//
//   ⛔ Ce décor NE SE NETTOIE PAS TOUT SEUL : qui le sème tient son registre.
//
// ⚠️ LA BASE EST LA SANDBOX, ET UN ÉLÈVE RÉEL Y TRAVAILLE. La recette ne touche
//    QUE ce qu'elle a semé — sauf `scriptorium_params.exercices_actif`, remis à
//    l'identique en fin de course et sur interruption. Le TEXTE et sa RÉFÉRENCE
//    sont ceux de C5-L1, RÉUTILISÉS EN LECTURE SEULE : rien n'y est écrit.
// ============================================================================

import { register } from 'node:module'

// ── La cale de résolution des sous-chemins `next/…` (patron de C4-L3) ───────
register('data:text/javascript,' + encodeURIComponent(`
const CARTE = {
  'next/navigation': 'next/navigation.js',
  'next/headers': 'next/headers.js',
  'next/cache': 'next/cache.js',
}
export async function resolve(specifier, contexte, suivant) {
  if (CARTE[specifier]) return suivant(CARTE[specifier], contexte)
  return suivant(specifier, contexte)
}
`))

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.cwd()

const { lireLaPorte, poserExercicesActifs } =
  await import(`${RACINE}/utils/deroule/acces.ts`)
const { lireDepotMaison, ouvrirLeDepot, remettre } =
  await import(`${RACINE}/utils/deroule/depot.ts`)
const { chargerLeDeroule } = await import(`${RACINE}/utils/deroule/vue.ts`)
const { enregistrerLesConditions, enregistrerLaRestitution, enregistrerLaConfiance } =
  await import(`${RACINE}/utils/deroule/gestes.ts`)
const { exercicesMaisonDeLEleve } = await import(`${RACINE}/utils/codex-onglets/liste.ts`)
const { atelierDUnFormatif, hrefDuDeroule } =
  await import(`${RACINE}/utils/codex-onglets/regles.ts`)
const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { controlerRetour, controlerRR3, assemblerRetour } =
  await import(`${RACINE}/utils/chaine/retour.ts`)
const { referenceValidee } = await import(`${RACINE}/utils/reference-validee.ts`)
const { servirLeTexteSupport } = await import(`${RACINE}/utils/lecture/texte-support.ts`)
const { traiterDepot, rejouerLeRetour } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const { mettreEnFile, cleIdempotence } = await import(`${RACINE}/utils/chaine/file.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

// ── LE TEXTE RÉEL, ET LA SÉLECTION QUE C5-L1 A CAPTÉE À LA SOURIS ───────────
// `Qu'est-ce que les Lumières ?`, déposé et décomposé le 26/08, référence
// VALIDÉE. ⭐ 413–482 est exactement la borne que le smoke prof de C5-L1 a
// posée à la souris — on la rejoue, côté élève.
const TEXTE_ID = '886d790d-87f2-4f2b-9ad3-67c703fa0645'
const ENGLOBANT = [101, 512]
const LOCALISATION = [413, 482]

// ── Les deux modes du SMOKE À L'ÉCRAN, avant toute autre chose ──────────────
const iDecor = process.argv.indexOf('--decor-smoke')
const iRetrait = process.argv.indexOf('--retirer-smoke')
const MARQUE_SMOKE = 'SMOKE-C5L2'

if (iRetrait >= 0) {
  const classeId = process.argv[iRetrait + 1]
  if (!classeId) { console.error('usage : --retirer-smoke <classeId>'); process.exit(2) }
  const { data: exs } = await admin.from('exercices')
    .select('id, consigne_instanciee').eq('classe_id', classeId)
  const ids = (exs ?? [])
    .filter((e) => JSON.stringify(e.consigne_instanciee ?? '').includes(MARQUE_SMOKE))
    .map((e) => e.id)
  if (!ids.length) { console.log('rien à retirer'); process.exit(0) }
  const { data: deps } = await admin.from('exercices_depots').select('id').in('exercice_id', ids)
  const dep = (deps ?? []).map((d) => d.id)
  for (const t of ['exercices_jobs', 'exercices_retours', 'exercices_squelettes',
    'exercices_metacognition', 'competences_mesures', 'monitoring_mesures']) {
    if (dep.length) await admin.from(t).delete().in('depot_id', dep)
  }
  if (dep.length) await admin.from('exercices_depots').delete().in('id', dep)
  await admin.from('exercices_cas').delete().in('exercice_id', ids)
  const { error } = await admin.from('exercices').delete().in('id', ids)
  console.log(error ? `⚠️ ${error.message}`
    : `retiré : ${ids.length} instance(s), ${dep.length} dépôt(s)`)
  process.exit(error ? 1 : 0)
}

if (iDecor >= 0) {
  const [eleveId, classeId] = [process.argv[iDecor + 1], process.argv[iDecor + 2]]
  if (!eleveId || !classeId) {
    console.error('usage : --decor-smoke <eleveId> <classeId>'); process.exit(2)
  }
  const { data: type } = await admin.from('exercices_types')
    .select('id').eq('code', 'phrase').maybeSingle()
  const { data: tx } = await admin.from('exercices_textes')
    .select('reference_id').eq('id', TEXTE_ID).maybeSingle()
  if (!type || !tx?.reference_id) {
    console.error('le type `phrase` ou le texte de C5-L1 manque.'); process.exit(2)
  }
  const poser = async (champs) => {
    const { data, error } = await admin.from('exercices').insert({
      type_id: type.id, classe_id: classeId, statut: 'assigne', lieu: 'maison', cran: '8', ...champs,
    }).select('id').single()
    if (error) throw new Error(error.message)
    const { data: d, error: e2 } = await admin.from('exercices_depots').insert({
      eleve_id: eleveId, exercice_id: data.id, origine: 'prof', statut: 'assigne',
      assigne_at: new Date().toISOString(),
    }).select('id').single()
    if (e2) throw new Error(e2.message)
    return d.id
  }
  const lecture = await poser({
    consigne_instanciee: `${MARQUE_SMOKE} — Explique ce que Kant appelle « l'état de tutelle », `
      + 'puis montre pourquoi la devise **Sapere aude** y répond. Appuie-toi sur les mots du texte.',
    modes_par_competence: { structure: ['expliquer'] },
    cible_primaire: 'structure',
    materiau_source_provenance: 'texte_auteur',
    materiau_source_support: 'extrait',
    materiau_source_texte_id: TEXTE_ID,
    materiau_source_englobant: ENGLOBANT,
    materiau_source_localisation: LOCALISATION,
    reference_id: tx.reference_id,
  })
  const ecriture = await poser({
    consigne_instanciee: `${MARQUE_SMOKE} — Rédige un paragraphe qui pose une **thèse** `
      + "et l'appuie sur une raison.",
    modes_par_competence: { expression: ['composer'] },
    cible_primaire: 'expression',
  })
  const base = 'http://localhost:3000/eleve/modules'
  console.log(`LECTURE  → ${base}/aletheia/exercice/${lecture}`)
  console.log(`         ⛔ ${base}/codex/exercice/${lecture}    (doit rendre 404)`)
  console.log(`ÉCRITURE → ${base}/codex/exercice/${ecriture}`)
  console.log(`         ⛔ ${base}/aletheia/exercice/${ecriture} (doit rendre 404)`)
  console.log(`\nretrait : node … scripts/recette/lecture-c5l2.mjs --retirer-smoke ${classeId}`)
  process.exit(0)
}

// ── ⭐⭐ LE MODE DE MESURE DE L'ANCRAGE (`C5L2b-7`) ─────────────────────────
//
// **La question, et elle est ouverte.** Le `01-` §12 (RR3) suppose qu'un point
// puisse citer LE TEXTE ; la **règle 1 du gabarit** (§4, GELÉ) fait ancrer
// « sur une citation DU SQUELETTE », et le squelette est fait de LA COPIE.
// **Six points sur trois tirages s'étaient tous ancrés sur « copie ».**
// C5-L2-bis ajoute une instruction — CONDITIONNÉE au texte support — qui dit ce
// que chaque étiquette désigne. ⚠️ **Savoir si elle change quelque chose ne se
// lit pas : ça se tire.**
//
// ⭐ **LE DÉCOR EST CHOISI POUR INVITER LA CITATION DU TEXTE** : la copie
//    CONTREDIT l'auteur sur le point central — elle dit que la tutelle vient
//    d'un manque d'intelligence, quand le texte dit « NON PAS à une insuffisance
//    de l'entendement, MAIS à une insuffisance de la résolution et du courage ».
//    *Si le modèle doit citer le texte un jour, c'est là.*
//
// ⚠️ **PAYANT** : un `traiterDepot` (3 appels) puis N−1 `rejouerLeRetour`
//    (1 appel chacun, ~0,023 $) — le rejeu ne refait ni P1 ni P2.
const iMesure = process.argv.indexOf('--mesure-ancrage')

const AVEC_CHAINE = process.argv.includes('--avec-chaine')
const GARDE_LE_DECOR = process.argv.includes('--garde-le-decor')
const MARQUE = 'RECETTE-C5L2'

let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

const seme = { classes: [], exercices: [], depots: [] }
let porteInitiale = null

async function semer() {
  titre('A. Le décor — un texte RÉEL, une instance de LECTURE, un dépôt')

  const { data: texte, error: eTexte } = await admin.from('exercices_textes')
    .select('id, auteur, titre, reference, reference_id, contenu_id, statut, '
      + 'scriptorium_contenus(texte_extrait)')
    .eq('id', TEXTE_ID).maybeSingle()
  if (eTexte || !texte) {
    throw new Error(`le texte de C5-L1 est introuvable (${TEXTE_ID}) : ${eTexte?.message ?? 'absent'}`)
  }
  const contenu = Array.isArray(texte.scriptorium_contenus)
    ? texte.scriptorium_contenus[0] : texte.scriptorium_contenus
  const entier = contenu?.texte_extrait ?? ''
  dire(entier.length > 0, `le texte d'auteur est en base : ${texte.auteur} · ${texte.titre} `
    + `(${entier.length} caractères)`)

  // ⭐ LA GARDE DE C5-L1, ET SON IDENTIFIANT DE RÉFÉRENCE.
  const verdict = await referenceValidee(admin, TEXTE_ID)
  dire(verdict.ok, `la référence du texte est VALIDÉE — ${verdict.motif ?? 'aucun blocage'}`)
  dire(verdict.referenceId === texte.reference_id && !!verdict.referenceId,
    '⭐ `referenceValidee` rend L\'IDENTIFIANT de la référence : '
    + `${verdict.referenceId} — c'est lui, et lui seul, que la conception recopie sur l'instance`)

  const { data: type } = await admin.from('exercices_types')
    .select('id, code, grain').eq('code', 'phrase').maybeSingle()
  if (!type) throw new Error('type `phrase` introuvable — le seed de C4-L1 manque.')

  const { data: eleves } = await admin.from('profiles')
    .select('id, display_name').eq('role', 'eleve').order('created_at').limit(1)
  if (!(eleves ?? []).length) throw new Error('il faut un élève en base.')
  const eleve = eleves[0].id
  note(`élève de test (profil EXISTANT, réutilisé, jamais écrit) : ${eleves[0].display_name}`)

  const { data: classe, error: eClasse } = await admin.from('classes')
    .insert({ nom: `${MARQUE}-classe`, annee_scolaire: '2026-2027' }).select('id').single()
  if (eClasse) throw new Error(`classe de recette : ${eClasse.message}`)
  seme.classes.push(classe.id)

  const poserExercice = async (champs, libelle) => {
    const { data, error } = await admin.from('exercices')
      .insert({ type_id: type.id, classe_id: classe.id, statut: 'assigne', ...champs })
      .select('id').single()
    if (error) throw new Error(`instance « ${libelle} » : ${error.message}`)
    seme.exercices.push(data.id)
    return data.id
  }
  const poserDepot = async (exerciceId, libelle) => {
    const { data, error } = await admin.from('exercices_depots').insert({
      eleve_id: eleve, exercice_id: exerciceId, origine: 'prof', statut: 'assigne',
      assigne_at: new Date().toISOString(),
    }).select('id').single()
    if (error) throw new Error(`dépôt « ${libelle} » : ${error.message}`)
    seme.depots.push(data.id)
    return data.id
  }

  // ── L'INSTANCE DE LECTURE — cran 8 (`production_autonome`, régime PLEIN,
  //    donc LES SIX TEMPS), mode `expliquer` : « Aletheia sinon » (`01-` §2).
  //    ⭐ `reference_id` est posée EXACTEMENT comme `concevoirInstance` la pose
  //    depuis ce lot : la valeur que rend `referenceValidee`.
  const exLecture = await poserExercice({
    lieu: 'maison',
    cran: '8',
    consigne_instanciee: `${MARQUE} — Explique ce que Kant appelle « l'état de tutelle », `
      + 'et montre pourquoi la devise **Sapere aude** y répond.',
    modes_par_competence: { structure: ['expliquer'] },
    cible_primaire: 'structure',
    materiau_source_provenance: 'texte_auteur',
    materiau_source_support: 'extrait',
    materiau_source_texte_id: TEXTE_ID,
    materiau_source_englobant: ENGLOBANT,
    materiau_source_localisation: LOCALISATION,
    reference_id: verdict.referenceId,
  }, 'lecture — expliquer')
  const depotLecture = await poserDepot(exLecture, 'lecture')

  // ── L'INSTANCE D'ÉCRITURE — pour éprouver la borne DANS L'AUTRE SENS.
  const exEcriture = await poserExercice({
    lieu: 'maison',
    cran: '8',
    consigne_instanciee: `${MARQUE} — Rédige un paragraphe qui pose une thèse.`,
    modes_par_competence: { expression: ['composer'] },
    cible_primaire: 'expression',
  }, 'écriture — composer')
  const depotEcriture = await poserDepot(exEcriture, 'écriture')

  // ── UNE INSTANCE DE LECTURE SANS `reference_id` — l'état d'AVANT ce lot.
  const exAveugle = await poserExercice({
    lieu: 'maison',
    cran: '8',
    consigne_instanciee: `${MARQUE} — la même, mais SANS \`reference_id\` sur l'instance.`,
    modes_par_competence: { structure: ['expliquer'] },
    cible_primaire: 'structure',
    materiau_source_provenance: 'texte_auteur',
    materiau_source_support: 'extrait',
    materiau_source_texte_id: TEXTE_ID,
    materiau_source_englobant: ENGLOBANT,
    materiau_source_localisation: LOCALISATION,
    reference_id: null,
  }, 'lecture — référence débranchée')
  const depotAveugle = await poserDepot(exAveugle, 'aveugle')

  note(`décor : classe ${classe.id} · 3 instances · 3 dépôts`)
  return {
    eleve, classeId: classe.id, entier,
    exLecture, depotLecture, exEcriture, depotEcriture, exAveugle, depotAveugle,
    referenceId: verdict.referenceId,
  }
}

// ── ① LA PORTE ──────────────────────────────────────────────────────────────
async function laPorte(d) {
  titre('B. ① LA PORTE — la liste par atelier, et la borne DANS LES DEUX SENS')

  porteInitiale = (await lireLaPorte(admin)).exercicesActifs
  note(`\`exercices_actif\` trouvé à ${porteInitiale ? 'ON' : 'OFF'} — il sera remis tel quel`)

  // 1. La porte ferme la liste, et elle se lit DANS le module.
  await poserExercicesActifs(admin, false)
  const fermee = await exercicesMaisonDeLEleve(admin, d.eleve, d.classeId, 'aletheia')
  dire(fermee.length === 0,
    '`exercices_actif` à OFF : la liste de lecture est VIDE — un lien qui mènerait à une '
    + 'page fermée est un lien qui promet une porte close')
  await poserExercicesActifs(admin, true)

  // 2. La liste d'ALETHEIA porte l'exercice de lecture, et LUI SEUL.
  const lecture = await exercicesMaisonDeLEleve(admin, d.eleve, d.classeId, 'aletheia')
  const ecriture = await exercicesMaisonDeLEleve(admin, d.eleve, d.classeId, 'codex')
  const idsLecture = lecture.map((x) => x.depotId)
  const idsEcriture = ecriture.map((x) => x.depotId)
  dire(idsLecture.includes(d.depotLecture) && !idsEcriture.includes(d.depotLecture),
    '⭐⭐ L\'EXERCICE DE LECTURE APPARAÎT — sous Aletheia, et jamais sous Codex. '
    + '(Avant ce lot il n\'avait NI LIEN, NI LISTE, NI ADRESSE.)')
  dire(idsEcriture.includes(d.depotEcriture) && !idsLecture.includes(d.depotEcriture),
    'et l\'exercice d\'écriture reste sous Codex, jamais sous Aletheia — la borne joue '
    + 'DANS LES DEUX SENS')

  // 3. Le href mène à la route de son atelier.
  const ligne = lecture.find((x) => x.depotId === d.depotLecture)
  dire(ligne?.href === hrefDuDeroule('aletheia', d.depotLecture)
    && ligne.href === `/eleve/modules/aletheia/exercice/${d.depotLecture}`,
    `le lien mène à sa route : ${ligne?.href}`)
  note(`titre servi : « ${ligne?.titre?.slice(0, 60)}… » · état : ${ligne?.etat?.libelle}`)

  // 4. ⭐⭐ LA BORNE À LA PORTE — le prédicat, appliqué des deux côtés.
  const parCodex = await lireDepotMaison(admin, d.depotLecture, d.eleve, { atelier: 'codex' })
  const parAletheia = await lireDepotMaison(admin, d.depotLecture, d.eleve, { atelier: 'aletheia' })
  dire(parCodex === null && parAletheia !== null,
    '⭐⭐ LA ROUTE DE CODEX REFUSE UN DÉPÔT DE LECTURE. Avant ce lot elle le SERVAIT à '
    + 'qui connaissait son identifiant — le module était un attribut d\'URL.')
  const ecritureParAletheia = await lireDepotMaison(admin, d.depotEcriture, d.eleve, { atelier: 'aletheia' })
  const ecritureParCodex = await lireDepotMaison(admin, d.depotEcriture, d.eleve, { atelier: 'codex' })
  dire(ecritureParAletheia === null && ecritureParCodex !== null,
    'et la route d\'Aletheia refuse un dépôt d\'écriture — deux ateliers, deux portes, '
    + 'UN SEUL PRÉDICAT')

  // 5. Le prédicat est bien celui du `01-` §2, lu sur la base.
  const { data: ex } = await admin.from('exercices')
    .select('modes_par_competence').eq('id', d.exLecture).maybeSingle()
  dire(atelierDUnFormatif(ex.modes_par_competence) === 'aletheia',
    `l'atelier se lit sur les MODES, en base : ${JSON.stringify(ex.modes_par_competence)} `
    + '→ aletheia (« Codex s\'il porte `composer`, Aletheia sinon »)')
}

// ── ② LE TEXTE ──────────────────────────────────────────────────────────────
async function leTexte(d) {
  titre('C. ② LE TEXTE — l\'englobant servi, la sélection marquée, PAS UN OCTET')

  const vue = await chargerLeDeroule(admin, d.depotLecture, d.eleve,
    { ouvert: true, delaiVfJours: 3, atelier: 'aletheia' })
  if (!vue) throw new Error('le déroulé ne se charge pas — la suite est sans objet.')

  dire(vue.texteSupport !== null,
    '⭐⭐ LE DÉROULÉ SERT UN TEXTE D\'AUTEUR. (Avant ce lot il servait TOUJOURS la banque '
    + 'de matériaux fabriqués — `exercices_cas` → `exercices_materiaux` — et l\'élève lisait '
    + 'la consigne, et rien d\'autre.)')
  if (!vue.texteSupport) return vue

  const attendu = d.entier.slice(ENGLOBANT[0], ENGLOBANT[1])
  dire(vue.texteSupport.texte === attendu,
    `c'est L'ENGLOBANT qui est servi — caractères ${ENGLOBANT[0]}–${ENGLOBANT[1]}, `
    + `${vue.texteSupport.texte.length} caractères, identiques à la base`)
  dire(vue.texteSupport.texte !== d.entier,
    `et ce n'est PAS le texte entier (${d.entier.length} caractères) : « c'est l'étendue `
    + 'réellement lue » (`02-` §6 B.1)')

  const concat = vue.texteSupport.segments.map((s) => s.texte).join('')
  dire(concat === attendu,
    '⛔⛔ PAS UN OCTET RETOUCHÉ — la concaténation des segments REND la tranche à '
    + 'l\'identique (la promesse de C4-L15, tenue ici)')

  const marque = vue.texteSupport.segments.filter((s) => s.marque).map((s) => s.texte).join('')
  const selection = d.entier.slice(LOCALISATION[0], LOCALISATION[1])
  dire(vue.texteSupport.selectionMarquee && marque === selection,
    `⭐ la SÉLECTION du professeur est marquée DEDANS : « ${marque} » `
    + `(caractères ${LOCALISATION[0]}–${LOCALISATION[1]} — la borne même que le smoke prof `
    + 'de C5-L1 a captée à la souris)')

  dire(vue.texteSupport.auteur === 'Kant',
    `l'identité du texte se dit à l'élève : ${[vue.texteSupport.auteur, vue.texteSupport.titre]
      .filter(Boolean).join(' · ')}`)

  // ⚠️ CE QUE LA BANQUE NE POUVAIT PAS SERVIR — le constat qui rend le lot utile.
  const { data: cas } = await admin.from('exercices_cas')
    .select('ordre, materiau_id').eq('exercice_id', d.exLecture)
  dire((cas ?? []).length === 0 || (cas ?? []).every((c) => c.materiau_id === null),
    '⚠️ et `exercices_cas.materiau_id` est NULL sur cette instance : la voie de la banque '
    + 'n\'aurait RIEN servi — ce n\'est pas un réglage, c\'est une absence')
  dire(vue.cas.every((c) => c.materiau === null),
    'le `CasServi.materiau` (la banque) reste donc à `null` — les deux canaux ne se '
    + 'confondent pas')

  // ⛔ RIEN DE LA RÉFÉRENCE DÉCOMPOSÉE NE DESCEND À L'ÉCRAN (RR4).
  const rendu = JSON.stringify(vue)
  dire(!/question_directrice|lectures_defendables|"armature"|"moments"/.test(rendu),
    '⛔ RR4 : ni armature, ni moments, ni lectures défendables ne descendent à l\'écran — '
    + '« elles sont la grille de la réception ET la réponse »')
  return vue
}

// ── ③ LA RÉFÉRENCE ──────────────────────────────────────────────────────────
async function laReference(d) {
  titre('D. ③ LA RÉFÉRENCE — le canal ouvert, et la garde en base qui MORD')

  const ctx = await lireContexte(admin, d.depotLecture)
  dire(ctx.referent === 'texte' && ctx.reference !== null && ctx.materiau !== null,
    '⭐⭐ LA CHAÎNE A LE TEXTE SOUS LA MAIN : `referent` = texte, `reference` non nulle, '
    + `\`materiau\` non nul (${String(ctx.materiau).length} caractères)`)
  dire(ctx.texteSupport !== null && ctx.texteSupport.texte.length === ENGLOBANT[1] - ENGLOBANT[0],
    'et `texteSupport` porte L\'ENGLOBANT — jamais le texte entier : contrôler l\'étiquette '
    + 'contre le texte entier déclarerait « du texte » une phrase que l\'élève n\'a pas vue')

  const ctxAveugle = await lireContexte(admin, d.depotAveugle)
  dire(ctxAveugle.referent === null && ctxAveugle.reference === null && ctxAveugle.materiau === null,
    '⛔ ET SANS `exercices.reference_id`, TOUT LE CANAL EST MUET — `referent`, `reference` '
    + 'et `materiau` sont nuls. C\'était l\'état de TOUTE instance conçue en ligne : '
    + '« le modèle à qui l\'on demande de citer l\'auteur n\'a jamais l\'auteur sous la main »')
  dire(ctxAveugle.texteSupport !== null,
    '⚠️ mais le TEXTE SUPPORT, lui, descend quand même : il vient de '
    + '`materiau_source_texte_id`, pas de la référence — les deux canaux sont distincts')

  // ── ⭐ LA GARDE EN BASE, PROUVÉE PAR L'ÉCHEC ──────────────────────────────
  // `garde_reference_validee` fait `select e.reference_id … if v_ref is null
  // then return new` : elle SORT avant de contrôler quoi que ce soit. On le
  // montre des deux côtés, sur une référence NON VALIDÉE.
  const { data: refNonValidee } = await admin.from('exercices_references')
    .select('id').is('validee_at', null).limit(1).maybeSingle()
  if (!refNonValidee) {
    note('⊘ aucune référence NON validée en base : la garde ne peut pas être éprouvée ici')
  } else {
    await admin.from('exercices').update({ reference_id: refNonValidee.id }).eq('id', d.exLecture)
    const tentative = await admin.from('exercices_squelettes').upsert({
      depot_id: d.depotLecture, competence: 'structure', version: 'v1',
      artefact_extraction: { recette: MARQUE },
      artefact_jugement: { recette: MARQUE },
    }, { onConflict: 'depot_id,competence,version' })
    dire(!!tentative.error && /référence non validée/i.test(tentative.error.message ?? ''),
      `⭐ LA GARDE EN BASE MORD : ${tentative.error?.message?.slice(0, 120) ?? 'ELLE N’A PAS TIRÉ'}`)

    // Et le contre-essai : `reference_id` NULL → elle ne contrôle RIEN.
    await admin.from('exercices').update({ reference_id: null }).eq('id', d.exLecture)
    const aveugle = await admin.from('exercices_squelettes').upsert({
      depot_id: d.depotLecture, competence: 'structure', version: 'v1',
      artefact_extraction: { recette: MARQUE },
      artefact_jugement: { recette: MARQUE },
    }, { onConflict: 'depot_id,competence,version' })
    dire(!aveugle.error,
      '⛔ ET AVEC `reference_id` À NULL, ELLE LAISSE PASSER — c\'était l\'état de toutes les '
      + 'instances conçues en ligne : « deux lecteurs, deux colonnes ; l\'un mord, l\'autre '
      + 'est aveugle »')
    await admin.from('exercices_squelettes').delete().eq('depot_id', d.depotLecture)
    await admin.from('exercices').update({ reference_id: d.referenceId }).eq('id', d.exLecture)
  }
}

// ── RR3 ─────────────────────────────────────────────────────────────────────
async function rr3(d) {
  titre('E. RR3 — le texte au modèle, et LA PREUVE PAR L\'ÉCHEC')

  const ctx = await lireContexte(admin, d.depotLecture)
  const support = ctx.texteSupport?.texte ?? null

  // 1. Le texte part au modèle, et il part BALISÉ (défense 1).
  const { message } = assemblerRetour('SYSTÈME — CALAME ({{COMPETENCE}}, {{MOMENT}}) {{REGISTRE}}', {
    moment: 'v1', registre: 'descriptif', palierAttribue: true,
    personnalite: { identite: 'Tu es Calame.', ton: 'Phrases courtes.' },
    competencePrimaire: 'structure',
    couchesCompetence: [{ competence: 'structure', vocabulaire: [], correspondance: [] }],
    coucheType: { consigne: ctx.consigne, grain: ctx.grain, servable: ctx.servable },
    squelettes: [{ competence: 'structure', extraction: {}, jugement: {} }],
    etatAnterieur: null,
    texteSupport: support,
  })
  dire(/MATÉRIAU — LECTURE SEULE/.test(message) && /<<<MATERIAU nom="le texte support/.test(message)
    && message.includes('Sapere aude'),
    '⭐ LE TEXTE D\'AUTEUR ARRIVE AU MODÈLE, DANS UN BLOC BALISÉ (défense 1). '
    + 'L\'appel du retour était le SEUL de la chaîne à concaténer ses morceaux à la main.')
  note(`message assemblé : ${message.length} caractères, dont ${support?.length ?? 0} de texte support`)

  // 2. ⭐⭐ LA PREUVE PAR L'ÉCHEC — une phrase de l'auteur étiquetée « copie ».
  const copie = 'Kant appelle état de tutelle le fait de ne pas oser penser par soi-même.'
  const phraseDeLAuteur = 'Aie le courage de te servir de ton propre entendement'
  dire(support.includes(phraseDeLAuteur),
    `la phrase choisie est bien DANS le texte servi : « ${phraseDeLAuteur} »`)

  const fabrique = {
    points: [
      { competence: 'structure', nature: 'reussite',
        ancrage: { source: 'copie', citation: phraseDeLAuteur },
        texte: 'tu écris une formule qui frappe' },
    ],
    action_revision: 'reprends ta première phrase et dis en quoi elle répond à la consigne',
    feed_forward: null,
  }
  const verdict = controlerRetour(fabrique, {
    moment: 'v1', grain: ctx.grain, codesObservables: [], competencesAdmises: ['structure'],
    production: copie, texteSupport: support,
  })
  dire(verdict.verdict.ok, 'la sortie fabriquée est CONFORME AU SCHÉMA — ce n\'est donc pas la '
    + 'défense 2 qui l\'attrape, c\'est bien le contrôle du retour')
  dire(verdict.controle.refus.some((x) => /RR3/.test(x)),
    `⭐⭐⭐ LE CONTRÔLE L'ATTRAPE : ${verdict.controle.refus.find((x) => /RR3/.test(x))?.slice(0, 150)}`)
  note('⛔ et elle ne glisse PAS jusqu\'à l\'écran pour y devenir une contestation : le refus '
    + 'empêche l\'écriture du retour, donc sa publication (`chaine.ts`).')

  // 3. Le sens inverse — chacune de son côté ne lève rien.
  const bon = {
    points: [
      { competence: 'structure', nature: 'reussite',
        ancrage: { source: 'copie', citation: 'ne pas oser penser par soi-même' },
        texte: 'tu nommes ce que Kant vise' },
      { competence: 'structure', nature: 'point_de_travail',
        ancrage: { source: 'texte_support', citation: phraseDeLAuteur },
        texte: 'le texte tient la devise pour une réponse — ton explication ne la relie pas' },
    ],
    action_revision: 'relie ta dernière phrase à la devise', feed_forward: null,
  }
  const propre = controlerRetour(bon, {
    moment: 'v1', grain: ctx.grain, codesObservables: [], competencesAdmises: ['structure'],
    production: copie, texteSupport: support,
  })
  dire(propre.controle.refus.length === 0 && propre.controle.alertes.length === 0,
    'et un retour dont chaque citation est DE SON CÔTÉ ne lève ni refus ni alerte')

  // 4. Le contrôle ne se tait jamais.
  const muet = controlerRR3(bon.points, { production: copie, texteSupport: null })
  dire(muet.refus.length === 0 && muet.alertes.some((x) => /NON EXÉCUTÉ/.test(x)),
    '⛔ sans texte support, le contrôle NE REFUSE RIEN et NE SE TAIT PAS : '
    + `« ${muet.alertes[0]?.slice(0, 110)} »`)
}

// ── LA TRAVERSÉE ────────────────────────────────────────────────────────────
async function traverser(d) {
  titre('F. LE « FAIT QUAND » — un exercice de lecture TRAVERSE le déroulé')

  const depot = await lireDepotMaison(admin, d.depotLecture, d.eleve, { atelier: 'aletheia' })
  await ouvrirLeDepot(admin, depot, new Date().toISOString())

  const vue = await chargerLeDeroule(admin, d.depotLecture, d.eleve,
    { ouvert: true, delaiVfJours: 3, atelier: 'aletheia' })
  dire(vue.regime === 'plein' && vue.temps.length === 6,
    `le cran 8 sert LES SIX TEMPS (régime ${vue.regime}) : ${vue.temps.join(' → ')}`)

  // ⭐ LE CRLF — le piège qui a mordu TROIS FOIS. Un `<textarea>` soumet en
  //    CRLF ; `blocs()` cherche `\n[ \t]*\n`. On remet une copie EN CRLF, comme
  //    un vrai formulaire, et on éprouve ce qui atterrit en base.
  // ⭐ ET LA COPIE CITE L'AUTEUR — c'est ce que fait un élève qui explique un
  //    texte, et c'est le cas qui rend RR3 délicat : la phrase de Kant est
  //    ALORS dans la copie, donc l'ancrer sur « copie » est LÉGITIME. Le
  //    contrôle interroge la copie D'ABORD ; il ne crie donc pas faux ici.
  const COPIE = 'Kant appelle état de tutelle le fait de ne pas oser penser par soi-même.\r\n\r\n'
    + 'Ce n\'est pas un manque d\'intelligence, mais un manque de courage : il écrit '
    + '« Aie le courage de te servir de ton propre entendement ! », ce qui fait de la '
    + 'sortie de tutelle une décision et non un progrès.\r\n\r\n'
    + 'La devise répond donc à la définition, parce qu\'elle vise le courage et non le savoir.'
  dire(COPIE.includes('\r\n'), 'la copie est soumise EN CRLF, comme un vrai `<textarea>`')

  const frais = await lireDepotMaison(admin, d.depotLecture, d.eleve)
  await enregistrerLaRestitution(admin, frais, 'Kant appelle tutelle le refus de penser seul.',
    new Date().toISOString())
  const apresRestit = await lireDepotMaison(admin, d.depotLecture, d.eleve)
  await enregistrerLesConditions(admin, apresRestit, 'temps_mis', new Date().toISOString())
  const apresCond = await lireDepotMaison(admin, d.depotLecture, d.eleve)
  if (vue.competencesDeLaConfiance.length) {
    await enregistrerLaConfiance(admin, apresCond,
      Object.fromEntries(vue.competencesDeLaConfiance.map((c) => [c, 'moyennement_sur'])),
      vue.competencesDeLaConfiance, new Date().toISOString())
  }
  const avantRemise = await lireDepotMaison(admin, d.depotLecture, d.eleve)
  const remis = await remettre(admin, avantRemise, 'v1',
    { texte: COPIE, tagDuree: null, telemetrie: null }, new Date().toISOString())
  dire(remis.ok, `la remise passe les trois gestes : ${remis.ok ? 'v1 remise' : remis.message}`)

  const { data: enBase } = await admin.from('exercices_depots')
    .select('texte_v1, statut').eq('id', d.depotLecture).maybeSingle()
  dire(!enBase.texte_v1.includes('\r'),
    `⭐ LE CRLF EST NORMALISÉ AVANT L'ÉCRITURE : ${(enBase.texte_v1.match(/\r/g) ?? []).length} CR `
    + 'en base (le piège qui a mordu trois fois — C4-L4, C4-L16, C5-L1)')
  dire(remis.valeur?.blocs === 3,
    `et la copie compte ${remis.valeur?.blocs} BLOCS, pas un seul : « une copie saisie sans `
    + 'retour à la ligne est lue comme dépourvue d\'architecture — défaillance forte »')

  if (!AVEC_CHAINE) {
    note('⊘ `--avec-chaine` absent : la chaîne ne part pas, aucun appel n\'est payé. '
      + 'La clause « rend un retour » reste à jouer.')
    return
  }

  // ── LA CHAÎNE PART — ET ELLE DÉPENSE ───────────────────────────────────────
  const { count: avant } = await admin.from('api_couts')
    .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotLecture)
  const debut = Date.now()
  let bilan = null
  try {
    bilan = await traiterDepot(admin, d.depotLecture, 'v1')
  } catch (e) {
    dire(false, `la chaîne a levé : ${e.message}`)
    return
  }
  const secondes = ((Date.now() - debut) / 1000).toFixed(1)
  const { count: apres } = await admin.from('api_couts')
    .select('id', { count: 'exact', head: true }).eq('depot_id', d.depotLecture)

  note(`chaîne : ${bilan.competencesMesurees.join(', ') || 'aucune compétence'} · `
    + `${(apres ?? 0) - (avant ?? 0)} ligne(s) à \`api_couts\` · ${secondes} s`)
  for (const a of bilan.alertes ?? []) note(`alerte : ${a}`)
  dire((apres ?? 0) - (avant ?? 0) > 0,
    '⭐ le nombre d\'appels se lit AU NOMBRE DE LIGNES d\'`api_couts`, jamais à un compteur')
  dire(Number(secondes) < 180,
    `le contrat de latence est tenu : ${secondes} s < 180 s (01- §12)`)

  const { data: retour } = await admin.from('exercices_retours')
    .select('texte, published_at, registre_servi').eq('depot_id', d.depotLecture)
    .eq('moment', 'chaud').maybeSingle()
  dire(bilan.retourEcrit && !!retour,
    `⭐⭐ LE RETOUR EST ÉCRIT (registre ${retour?.registre_servi ?? '—'}) et PUBLIÉ `
    + `(${retour?.published_at ?? 'non publié'})`)
  if (!retour) return

  const points = Array.isArray(retour.texte) ? retour.texte : []
  const support = (await lireContexte(admin, d.depotLecture)).texteSupport?.texte ?? ''
  const { data: dep } = await admin.from('exercices_depots')
    .select('texte_v1').eq('id', d.depotLecture).maybeSingle()
  const verdict = controlerRR3(points, { production: dep.texte_v1, texteSupport: support })
  const surTexte = points.filter((p) => p.ancrage?.source === 'texte_support')
  const surCopie = points.filter((p) => p.ancrage?.source === 'copie')
  dire(verdict.refus.length === 0,
    `⭐⭐⭐ LE « FAIT QUAND », PAR LE SUCCÈS : ${points.length} point(s) ancré(s) `
    + `(${surCopie.length} « copie », ${surTexte.length} « texte_support »), `
    + `AUCUNE citation n'attribue à l'élève une phrase de l'auteur`)
  // ⚠️ LE COMPTE SE DIT, MÊME QUAND IL EST NUL. La règle 1 du gabarit fait
  //    ancrer « sur une citation DU SQUELETTE », et le squelette est fait de la
  //    copie : le canal `texte_support` n'est donc PAS le cas courant. Ce qui se
  //    prouve ici est la clause du « fait quand » — aucune phrase de l'auteur
  //    attribuée à l'élève —, et le compte dit ce que le tirage a réellement fait.
  if (surTexte.length === 0) {
    note('⚠️ aucun point ancré sur `texte_support` à ce tirage : la moitié « par le succès » '
      + 'porte sur les citations de COPIE, toutes retrouvées dans la copie. Le canal '
      + '`texte_support` est servi et contrôlé, il n\'a simplement pas été employé ici.')
  }
  for (const a of verdict.alertes) note(`alerte RR3 : ${a}`)
  for (const p of points) {
    note(`  [${p.ancrage?.source}] « ${String(p.ancrage?.citation).slice(0, 70)} »`)
  }
}

// ── LE NETTOYAGE ────────────────────────────────────────────────────────────
async function nettoyer() {
  titre('G. Le nettoyage — tout ce que la recette a semé est retiré')
  if (porteInitiale !== null) {
    await poserExercicesActifs(admin, porteInitiale)
    note(`\`exercices_actif\` remis à ${porteInitiale ? 'ON' : 'OFF'}`)
  }
  if (GARDE_LE_DECOR) {
    note(`⛔ \`--garde-le-decor\` : rien n'est retiré. À la main : classes LIKE « ${MARQUE}% ».`)
    return
  }
  const { data: classes } = await admin.from('classes').select('id').like('nom', `${MARQUE}%`)
  const classeIds = [...new Set([...(classes ?? []).map((c) => c.id), ...seme.classes])]
  const { data: exs } = classeIds.length
    ? await admin.from('exercices').select('id').in('classe_id', classeIds)
    : { data: [] }
  const exIds = [...new Set([...(exs ?? []).map((e) => e.id), ...seme.exercices])]
  const { data: deps } = exIds.length
    ? await admin.from('exercices_depots').select('id').in('exercice_id', exIds)
    : { data: [] }
  const depIds = [...new Set([...(deps ?? []).map((x) => x.id), ...seme.depots])]

  for (const [table, colonne, ids] of [
    ['exercices_jobs', 'depot_id', depIds],
    ['exercices_retours', 'depot_id', depIds],
    ['exercices_squelettes', 'depot_id', depIds],
    ['exercices_metacognition', 'depot_id', depIds],
    ['competences_mesures', 'depot_id', depIds],
    ['monitoring_mesures', 'depot_id', depIds],
  ]) {
    if (!ids.length) continue
    const { error } = await admin.from(table).delete().in(colonne, ids)
    if (error) note(`⚠️ ${table} : ${error.code} ${error.message}`)
  }
  if (depIds.length) {
    const { error } = await admin.from('exercices_depots').delete().in('id', depIds)
    if (error) note(`⚠️ dépôts : ${error.code} ${error.message}`)
  }
  if (exIds.length) {
    await admin.from('exercices_cas').delete().in('exercice_id', exIds)
    const { error } = await admin.from('exercices').delete().in('id', exIds)
    if (error) note(`⚠️ instances : ${error.code} ${error.message}`)
  }
  if (classeIds.length) {
    const { error } = await admin.from('classes').delete().in('id', classeIds)
    if (error) note(`⚠️ classes : ${error.code} ${error.message}`)
  }
  const { count: reste } = await admin.from('classes')
    .select('id', { count: 'exact', head: true }).like('nom', `${MARQUE}%`)
  dire((reste ?? 0) === 0, `aucune classe « ${MARQUE}% » ne survit : ${reste ?? 0}`)

  // ⚠️ Le TEXTE et sa RÉFÉRENCE sont ceux de C5-L1 : on vérifie qu'on ne les a
  //    pas touchés — la recette les a lus, jamais écrits.
  const { data: t } = await admin.from('exercices_textes')
    .select('reference_id, statut').eq('id', TEXTE_ID).maybeSingle()
  dire(!!t && t.statut === 'valide',
    `le texte de C5-L1 est intact (statut ${t?.statut}, référence ${t?.reference_id})`)
}

// ── ⭐⭐ LA MESURE DE L'ANCRAGE ──────────────────────────────────────────────
async function mesurerLAncrage(tirages) {
  titre(`H. ⭐⭐ L'ANCRAGE, MESURÉ — ${tirages} tirage(s) sur une copie qui CONTREDIT l'auteur`)

  const { data: type } = await admin.from('exercices_types').select('id').eq('code', 'phrase').single()
  const { data: tx } = await admin.from('exercices_textes')
    .select('reference_id').eq('id', TEXTE_ID).single()
  const { data: eleves } = await admin.from('profiles').select('id').eq('role', 'eleve').limit(1)
  const { data: classe } = await admin.from('classes')
    .insert({ nom: `${MARQUE}-ancrage`, annee_scolaire: '2026-2027' }).select('id').single()
  seme.classes.push(classe.id)

  // ⛔ LA COPIE DIT LE CONTRAIRE DU TEXTE, sur le point central. C'est
  //    exactement l'endroit où un retour de lecture DEVRAIT citer l'auteur.
  const COPIE = 'Kant appelle « état de tutelle » le fait de ne pas se servir de son entendement '
    + "sans la conduite d'un autre. C'est donc une forme d'incapacité intellectuelle.\n\n"
    + 'Si tant de gens restent mineurs, c\'est parce qu\'ils ne sont pas assez intelligents pour '
    + 'penser seuls : leur entendement ne suffit pas, et il leur faut un guide.\n\n'
    + 'La devise des Lumières leur demande donc de s\'instruire davantage.'

  const { data: ex } = await admin.from('exercices').insert({
    type_id: type.id, classe_id: classe.id, statut: 'assigne', lieu: 'maison', cran: '8',
    consigne_instanciee: `${MARQUE} — Explique ce que Kant appelle « l'état de tutelle » et d'où `
      + 'elle vient, en t\'appuyant sur les mots du texte.',
    modes_par_competence: { structure: ['expliquer'] }, cible_primaire: 'structure',
    materiau_source_provenance: 'texte_auteur', materiau_source_support: 'extrait',
    materiau_source_texte_id: TEXTE_ID,
    materiau_source_englobant: ENGLOBANT, materiau_source_localisation: LOCALISATION,
    reference_id: tx.reference_id,
  }).select('id').single()
  seme.exercices.push(ex.id)
  const { data: dep } = await admin.from('exercices_depots').insert({
    eleve_id: eleves[0].id, exercice_id: ex.id, origine: 'prof', statut: 'v1_remis',
    assigne_at: new Date().toISOString(), v1_remis_at: new Date().toISOString(),
    texte_v1: COPIE,
  }).select('id').single()
  seme.depots.push(dep.id)
  note(`copie semée : ${COPIE.length} caractères, 3 paragraphes, et elle CONTREDIT le texte`)

  const ctx = await lireContexte(admin, dep.id)
  dire(ctx.texteSupport !== null, 'le texte support descend bien jusqu\'à la chaîne')

  const lignes = []
  for (let t = 1; t <= tirages; t++) {
    const avant = (await admin.from('api_couts').select('id', { count: 'exact', head: true })
      .eq('depot_id', dep.id)).count ?? 0
    let bilan
    try {
      bilan = t === 1
        ? await traiterDepot(admin, dep.id, 'v1')
        : await rejouerLeRetour(admin, dep.id, {})
    } catch (e) { note(`tirage ${t} : la chaîne a levé — ${e.message}`); continue }
    const apres = (await admin.from('api_couts').select('id', { count: 'exact', head: true })
      .eq('depot_id', dep.id)).count ?? 0

    const { data: r } = await admin.from('exercices_retours')
      .select('texte').eq('depot_id', dep.id).eq('moment', 'chaud').maybeSingle()
    const pts = Array.isArray(r?.texte) ? r.texte : []
    const surTexte = pts.filter((p) => p.ancrage?.source === 'texte_support')
    const v = controlerRR3(pts, { production: COPIE, texteSupport: ctx.texteSupport.texte })
    lignes.push({ t, pts: pts.length, surTexte: surTexte.length, appels: apres - avant,
      ecrit: bilan?.retourEcrit, refus: v.refus.length, alertes: v.alertes.length })
    console.log(`  tirage ${t} : ${pts.length} point(s) · ${surTexte.length} « texte_support » · `
      + `${apres - avant} appel(s) · RR3 ${v.refus.length ? '✗ REFUS' : '✓'}`)
    for (const p of pts) {
      console.log(`      [${p.ancrage?.source}] ${p.nature} — « ${String(p.ancrage?.citation).slice(0, 58)} »`)
    }
    for (const a of v.alertes) note(`  alerte RR3 : ${a.slice(0, 110)}`)
  }

  const total = lignes.reduce((n, l) => n + l.pts, 0)
  const surTexte = lignes.reduce((n, l) => n + l.surTexte, 0)
  const appels = lignes.reduce((n, l) => n + l.appels, 0)
  console.log(`\n  ┌${'─'.repeat(64)}`)
  console.log(`  │ ${lignes.length} tirage(s) · ${total} point(s) ancré(s) · ${appels} appel(s)`)
  console.log(`  │ ⭐ ancrés sur « texte_support » : ${surTexte} / ${total}`)
  console.log(`  │ RR3 : ${lignes.reduce((n, l) => n + l.refus, 0)} refus, `
    + `${lignes.reduce((n, l) => n + l.alertes, 0)} alerte(s)`)
  console.log(`  └${'─'.repeat(64)}`)
  dire(lignes.every((l) => l.refus === 0),
    'AUCUN refus RR3 sur les tirages — le contrôle ne crie pas faux')
  if (surTexte === 0) {
    console.log('\n  ⛔ ZÉRO point ancré sur le texte : L\'INSTRUCTION NE SUFFIT PAS.')
    console.log('     La règle 1 du gabarit domine, et la question redevient une DÉCISION DE')
    console.log('     SOURCE (`07-` §4 est GELÉ — relevé C5-L2 §6).')
  } else {
    console.log(`\n  ⭐⭐ ${surTexte} point(s) ancré(s) SUR LE TEXTE : l'instruction MORD.`)
  }
}

// ── LA COURSE ───────────────────────────────────────────────────────────────
process.on('SIGINT', async () => { await nettoyer(); process.exit(130) })

if (iMesure >= 0) {
  const n = Number(process.argv[iMesure + 1]) || 3
  try { await mesurerLAncrage(n) } catch (e) { ko++; console.error(`✗ ${e.message}\n${e.stack}`) }
  finally { await nettoyer() }
  console.log(`\nMESURE — ${ok} OK, ${ko} échec(s).`)
  process.exit(ko === 0 ? 0 : 1)
}

try {
  const d = await semer()
  await laPorte(d)
  await leTexte(d)
  await laReference(d)
  await rr3(d)
  await traverser(d)
} catch (e) {
  ko++
  console.error(`\n✗ ARRÊT : ${e.message}\n${e.stack}`)
} finally {
  await nettoyer()
}

console.log(`\n${'═'.repeat(78)}`)
console.log(`RECETTE C5-L2 — ${ok} vérification(s) OK, ${ko} échec(s).`)
console.log('═'.repeat(78))
process.exit(ko === 0 ? 0 : 1)
