// ============================================================================
// COUTURE C5 · L4 — L'EXERCICE DE LECTURE, TRAVERSÉ EN NE CLIQUANT QUE SUR DES
//                   ONGLETS. Éprouvé par EXÉCUTION, jamais par lecture.
// ----------------------------------------------------------------------------
// ⭐⭐ LA COUTURE SE NOMME EN UNE PHRASE, et elle est la question même du lot :
//
//     « Un exercice de lecture, de sa conception à son retour lu, se traverse-t-il
//       d'un bout à l'autre en ne cliquant QUE sur des onglets ? »
//
// Elle traverse TROIS dépendances d'un coup — C5-L1 conçoit, C5-L2 fait passer,
// C5-L3 mesure — et DEUX lots de plus : C4-L4 pour la classe, C4-L9 pour
// l'examen diagnostique. Chaque couture se nomme sous la seule forme qui la rend
// vérifiable — QUI ÉCRIT · QUI LIT · UN CHEMIN RÉEL Y MÈNE-T-IL ?
//
// ⛔ PAS DE LECTURE DE CODE EN GUISE DE PREUVE. Ce script APPELLE les lectures
//    que les six onglets appellent — `exercicesMaisonDeLEleve(…, 'aletheia')`,
//    `passationsDeClasse(admin, 'aletheia')`, `examensAConcevoir(admin, 'aletheia')`,
//    `signauxDeLancement(…, 'aletheia')`, `etatChaineDeLaCopie()` — et constate,
//    pour chacune, QU'ELLE SERT SA LIGNE et QUE L'`href` QU'ELLE REND EST SERVI
//    PAR UNE ROUTE QUI ACCEPTE LE DÉPÔT (`chargerVueProf`, `chargerVueEleve`,
//    `chargerConception`, `lireDepotMaison`) ET PAR UN ONGLET QUI S'ALLUME
//    (`ongletActifParRoute`, sur la config RÉELLE).
//
// ⚠️ LA BASE EST LA SANDBOX, ET UN ÉLÈVE RÉEL Y TRAVAILLE. Ce script ne touche
//    QUE ce qu'il a semé, et il tient un REGISTRE sur disque que `--retire`
//    relit. ⛔ Il ne bascule AUCUN interrupteur : les six restent comme trouvés.
//    (Ils sont à ON en sandbox ET en prod depuis le 27/08 — constat de C5-L2,
//    non réparé ; la section B le RELÈVE et ne le change pas.)
//
// ⭐ LA SECTION E LIT LA PRODUCTION, EN LECTURE SEULE, par PostgREST — c'est le
//    seul endroit où le CAS MIXTE existe (« deux compétences passent, deux sont
//    écartées, le retour s'écrit, l'état devient `abouti` »). ⛔ L'exercice du bac
//    à sable `473b2c25` n'élit QUE des couples non couverts : il tombe en
//    `sans_retour`, qui servait DÉJÀ son motif — le prouver sur lui ne prouve
//    rien de neuf. Le script éprouve LES DEUX, et le dit.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c5l4.mjs [--seme] [--garde-le-decor]
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/couture-c5l4.mjs --retire
//
// ⚠️ LE RÉSOLVEUR DE CALIBRATION EST OBLIGATOIRE : les lectures des onglets
//    portent `import 'server-only'` et tirent `next/navigation`.
// ⛔ AUCUN APPEL DE MODÈLE N'EST PAYÉ : la couture de la mesure s'éprouve sur les
//    messages que la file RÉELLE a écrits (prod), plus un aller-retour en base.
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

// ── CE QUE LES SIX ONGLETS APPELLENT — et rien d'autre ──────────────────────
const { exercicesMaisonDeLEleve, passationsDeClasse } =
  await import(`${RACINE}/utils/codex-onglets/liste.ts`)
const { hrefDeLaPassationProf, hrefDuDeroule } =
  await import(`${RACINE}/utils/codex-onglets/regles.ts`)
const { signauxDeLancement } = await import(`${RACINE}/utils/examens/signal.ts`)
const { examensAConcevoir } = await import(`${RACINE}/utils/examens/plan.ts`)
const { etatChaineDeLaCopie, ETAPE_MESURE_V1 } =
  await import(`${RACINE}/utils/passation/file-copie.ts`)
// ── CE QUI SERT LES `href` QU'ELLES RENDENT ────────────────────────────────
const { lireDepotMaison } = await import(`${RACINE}/utils/deroule/depot.ts`)
const { chargerVueProf, chargerVueEleve } = await import(`${RACINE}/utils/passation/vues.ts`)
const { chargerConception } = await import(`${RACINE}/utils/examens/conception.ts`)
const { etatDesJobs, cleIdempotence } = await import(`${RACINE}/utils/chaine/file.ts`)
// ── CE QUI ÉCRIT LE MOTIF QUE L'ÉCRAN LIT (l'autre bout de la couture C5-L3) ─
const { motifDesEcartees } = await import(`${RACINE}/utils/chaine/chaine.ts`)
// ── LA BARRE D'ONGLETS, DANS SA CONFIG RÉELLE ──────────────────────────────
const { MODULES, ongletActifParRoute, sousOngletsPour } =
  await import(`${RACINE}/components/nav/configModules.ts`)
const { lireLaPorte } = await import(`${RACINE}/utils/deroule/acces.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'COUTURE-C5L4'
const REGISTRE = '.couture-c5l4.json'
const a = (n) => process.argv.includes(`--${n}`)
const GARDE_LE_DECOR = a('garde-le-decor')

let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (t) => console.log(`  · ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

/** supabase-js NE LÈVE PAS : il rend `{ error }`. Ici, on lève. */
function verifie(ou, { data, error }) {
  if (error) throw new Error(`${ou} — ${error.code ?? ''} ${error.message}`)
  return data
}

const aletheia = MODULES.find((m) => m.cle === 'aletheia')
const ongletsProf = sousOngletsPour(aletheia, 'prof')
const ongletsEleve = sousOngletsPour(aletheia, 'eleve')
const labelDe = (onglets, href) => onglets.find((o) => o.href === href)?.label ?? null
/** L'onglet qui S'ALLUME sur un `href` rendu par une liste. */
const ongletDe = (onglets, href) => labelDe(onglets, ongletActifParRoute(onglets, href.split('?')[0]))

let dernier = 0
const instant = () => { const t = Math.max(Date.now(), dernier + 1); dernier = t; return new Date(t).toISOString() }

// ════════════════════════════════════════════════════════════════════════════
// A. LE DÉCOR — un dépôt de lecture assigné · une passation de classe ouverte
// ════════════════════════════════════════════════════════════════════════════
//
// ⚠️ LA CLASSE EST LA VRAIE CLASSE D'UN ÉLÈVE RÉEL, et c'est le but : la liste
//    de l'onglet est BORNÉE par la classe en contexte (`01-` §2, « dans les
//    modules on reste par classe »). Une classe de recette ne prouverait rien de
//    ce filtre-là. ⛔ Aucun `profiles` n'est écrit — on leur pose des dépôts.
//
// ⭐⭐ LA PASSATION DE CLASSE PORTE `composer`, ET SA LIGNE DE PLAN DIT `lecture`.
//    C'est L'EXPLICATION DE TEXTE, et c'est LA contre-épreuve de l'ordre de
//    résolution (piège 34) : la règle des modes seule l'enverrait dans CODEX ;
//    la ligne de plan la range dans ALETHEIA, où le `06-` §1 la met. Si un jour
//    quelqu'un inverse les deux règles, CE décor-ci le fait tomber.
async function semer() {
  titre('A. Le décor — un dépôt de lecture, une passation de classe, une ligne de plan')

  const type = verifie('type `phrase`', await admin.from('exercices_types')
    .select('id, code, grain').eq('code', 'phrase').maybeSingle())
  if (!type) throw new Error('type `phrase` introuvable — le seed de C4-L1 manque.')

  // L'élève : un profil EXISTANT, avec une inscription active — sa classe borne tout.
  // ⭐ ON PRÉFÈRE UNE CLASSE QUI A UN PLAN D'ÉVALUATION VALIDÉ, et le motif n'est
  //    pas de confort : SANS LIGNE DE PLAN, la contre-épreuve de l'ordre de
  //    résolution (piège 34) est SANS OBJET — c'est la ligne de plan qui doit
  //    primer sur le mode, et il en faut une pour le montrer.
  const insc = verifie('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id, classes(nom)').eq('statut', 'active').order('eleve_id'))
  if (!insc.length) throw new Error('aucune inscription active en base.')
  const plansValides = verifie('plans validés', await admin
    .from('scriptorium_plans_evaluation').select('id, classe_id')
    .eq('statut', 'valide').is('supprime_at', null))
  const avecPlan = new Set(plansValides.map((p) => p.classe_id))
  const choisie = insc.find((i) => avecPlan.has(i.classe_id)) ?? insc[0]
  if (!avecPlan.has(choisie.classe_id)) {
    note('⚠️ aucune classe à la fois inscrite ET dotée d’un plan validé — la contre-épreuve '
      + 'de l’ordre de résolution se dira SANS OBJET.')
  }
  const nom = verifie('profil', await admin.from('profiles')
    .select('display_name').eq('id', choisie.eleve_id).maybeSingle())?.display_name ?? choisie.eleve_id
  note(`élève RÉEL (jamais écrit) : ${nom} · classe « ${choisie.classes?.nom ?? '?'} »`)

  const registre = { exercices: [], depots: [], lignesPlan: [], jobs: [] }
  const poser = async (champs, libelle) => {
    const ex = verifie(`instance « ${libelle} »`, await admin.from('exercices').insert({
      type_id: type.id, classe_id: choisie.classe_id, statut: 'assigne', cran: '8', ...champs,
    }).select('id').single())
    registre.exercices.push(ex.id)
    return ex.id
  }
  const deposer = async (exerciceId, champs, libelle) => {
    const d = verifie(`dépôt « ${libelle} »`, await admin.from('exercices_depots').insert({
      eleve_id: choisie.eleve_id, exercice_id: exerciceId, origine: 'prof',
      statut: 'assigne', assigne_at: instant(), ...champs,
    }).select('id').single())
    registre.depots.push(d.id)
    return d.id
  }

  // ── ① L'EXERCICE DE LECTURE À LA MAISON (C5-L2) — mode `expliquer`, donc
  //    « Aletheia sinon » (`01-` §2). C'est ce que l'onglet Exercices élève sert.
  const exMaison = await poser({
    lieu: 'maison',
    consigne_instanciee: `${MARQUE} — Explique ce que Kant appelle « l'état de tutelle ».`,
    modes_par_competence: { structure: ['expliquer'] },
    cible_primaire: 'structure',
  }, 'lecture · maison')
  const depotMaison = await deposer(exMaison, {}, 'lecture · maison')

  // ── ② LA PASSATION EN CLASSE (C4-L4) — et sa LIGNE DE PLAN de type `lecture`.
  //    ⭐ L'instance porte `composer` EXPRÈS : sans ligne de plan elle irait dans
  //       Codex. C'est la contre-épreuve de l'ordre de résolution.
  const plan = verifie('plan validé', await admin.from('scriptorium_plans_evaluation')
    .select('id, classe_id, classes(nom)').eq('statut', 'valide').is('supprime_at', null)
    .eq('classe_id', choisie.classe_id).limit(1).maybeSingle())

  let lignePlan = null
  if (plan) {
    const lundi = (() => {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - 7)
      return d.toISOString().slice(0, 10)
    })()
    // ⚠️ `uk_exercices_diagnostic` N'ADMET QU'UNE LIGNE par plan × fenêtre × type :
    //    si une lecture diagnostique de septembre existe déjà, l'insert est REFUSÉ,
    //    et c'est LA GARDE DU PLAN QUI PARLE, pas une panne. On essaie les trois
    //    fenêtres (`septembre` · `decembre` · `fevrier`, la liste fermée du
    //    schéma) plutôt que d'abandonner à la première.
    let dernierRefus = null
    for (const fenetre of ['septembre', 'decembre', 'fevrier']) {
      const { data, error } = await admin.from('scriptorium_exercices_planifies').insert({
        plan_id: plan.id, module: 'aletheia', type_exercice: 'lecture',
        nature: 'evaluatif', lieu: 'classe', diagnostique: true, ancrage: 'semaine',
        semaine_lundi: lundi, jour_prevu: null, fenetre_diagnostique: fenetre,
        origine: 'diagnostic', statut: 'a_concevoir', note: MARQUE,
      }).select('id').single()
      if (!error) {
        lignePlan = data.id
        registre.lignesPlan.push(data.id)
        note(`ligne de plan SEMÉE (${lignePlan}) · fenêtre ${fenetre} · semaine du ${lundi} `
          + '(passée → le retard doit s’afficher)')
        break
      }
      dernierRefus = `${error.code ?? ''} ${error.message}`
    }
    if (!lignePlan) note(`⚠️ les trois fenêtres sont prises : ${dernierRefus}`)
  } else {
    note('⚠️ aucun plan d’évaluation validé sur cette classe — la section B-② se dira SANS OBJET')
  }

  const exClasse = await poser({
    lieu: 'classe',
    consigne_instanciee: `${MARQUE} — Explication de texte : « Qu'est-ce que les Lumières ? »`,
    // ⭐ `composer` EXPRÈS : la règle des modes l'enverrait dans Codex.
    modes_par_competence: { expression: ['composer'] },
    cible_primaire: 'expression',
    fenetre_debut: null,   // ⚠️ NULLABLE — l'écran ne demande jamais de date.
    ...(lignePlan ? { exercice_planifie_id: lignePlan } : {}),
  }, 'lecture · classe (explication de texte)')
  // Le dépôt de classe est OUVERT PAR LE PROFESSEUR — c'est ce que le signal exige.
  const depotClasse = await deposer(exClasse, {
    statut: 'ouvert', ouvert_at: instant(), ouvert_par_prof_at: instant(),
  }, 'lecture · classe')

  // ── ③ UNE INSTANCE D'ÉCRITURE — pour éprouver la borne DANS L'AUTRE SENS.
  const exEcriture = await poser({
    lieu: 'maison',
    consigne_instanciee: `${MARQUE} — Rédige un paragraphe qui pose une thèse.`,
    modes_par_competence: { expression: ['composer'] },
    cible_primaire: 'expression',
  }, 'écriture · maison')
  const depotEcriture = await deposer(exEcriture, {}, 'écriture · maison')

  fs.writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))
  note(`registre écrit dans ${REGISTRE} — c'est lui que \`--retire\` relit`)
  return {
    eleveId: choisie.eleve_id, classeId: choisie.classe_id, nom,
    exMaison, depotMaison, exClasse, depotClasse, exEcriture, depotEcriture, lignePlan, registre,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// B. L'ONGLET EXERCICES DU PROFESSEUR — ce qu'il lit, et où ses `href` mènent
// ════════════════════════════════════════════════════════════════════════════
//
// COUTURE ①  qui écrit `exercices.exercice_planifie_id` ? la conception d'examen
//            (C4-L9) · qui la lit ? `passationsDeClasse` · quel chemin y mène ?
//            l'onglet Exercices du professeur, ligne « Passations en classe ».
// COUTURE ②  qui écrit la ligne de plan `a_concevoir` ? le plan d'évaluation ·
//            qui la lit ? `examensAConcevoir` · quel chemin ? le même onglet,
//            encart « Examens diagnostiques à concevoir ».
async function ongletExercicesProf(d) {
  titre('B. L’onglet EXERCICES du professeur — la liste, et les routes qu’elle vise')

  const porte = await lireLaPorte(admin)
  note(`\`exercices_actif\` : ${porte.exercicesActifs ? 'ON' : 'OFF'} — RELEVÉ, jamais touché`)

  // ── ① LES PASSATIONS EN CLASSE ────────────────────────────────────────────
  const passations = await passationsDeClasse(admin, 'aletheia')
  const mienne = passations.find((p) => p.exerciceId === d.exClasse)
  dire(!!mienne, `la liste de l’onglet sert la passation semée (${passations.length} au total)`)

  if (mienne) {
    dire(mienne.href === hrefDeLaPassationProf('aletheia', d.exClasse),
      `l’\`href\` rendu est \`${mienne.href}\` — la route d’ALETHEIA, pas celle de Codex`)
    dire(ongletDe(ongletsProf, mienne.href) === 'Exercices',
      `⭐ cet \`href\` ALLUME l’onglet « Exercices » (\`prefixes[]\`, config réelle)`)
    // ⭐ LA ROUTE ACCEPTE-T-ELLE LE DÉPÔT ? C'est la moitié qui manque toujours.
    const vue = await chargerVueProf(admin, d.exClasse, true)
    dire(!!vue, `⭐ et la ROUTE SERT : \`chargerVueProf\` rend une vue (${vue?.copies?.length ?? 0} copie(s))`)
  }

  // ⭐⭐ LA CONTRE-ÉPREUVE DE L'ORDRE DE RÉSOLUTION (piège 34).
  //    L'instance porte `composer` : la règle des MODES l'enverrait dans Codex.
  //    Sa ligne de plan dit `lecture` : elle doit rester dans ALETHEIA.
  const chezCodex = await passationsDeClasse(admin, 'codex')
  const fuite = chezCodex.some((p) => p.exerciceId === d.exClasse)
  if (d.lignePlan) {
    dire(!fuite, '⭐⭐ L’ORDRE NE S’INVERSE PAS : l’explication de texte porte `composer`, '
      + 'sa LIGNE DE PLAN dit `lecture` — elle N’APPARAÎT PAS dans la liste de Codex')
    dire(!!mienne, '  ↳ et elle apparaît bien dans celle d’Aletheia : la ligne de plan a primé sur le mode')
  } else {
    note('⚠️ sans ligne de plan, la règle 2 (le mode) s’applique : l’instance `composer` '
      + 'va dans CODEX, et c’est JUSTE. La contre-épreuve de l’ordre est SANS OBJET ici.')
    dire(fuite, '  ↳ à défaut de ligne de plan, l’atelier suit le mode (`01-` §2) — vérifié')
  }

  // ── ② L'ENCART DES EXAMENS DIAGNOSTIQUES À CONCEVOIR ──────────────────────
  const examens = await examensAConcevoir(admin, 'aletheia')
  note(`\`examensAConcevoir(admin, 'aletheia')\` rend ${examens.length} ligne(s)`)
  if (examens.length === 0) {
    note('⚠️ `EncartAConcevoir` REND `null` SUR LISTE VIDE, et la liste est vide quand la '
      + 'porte du plan est fermée : une page nue n’est PAS la preuve qu’il est cassé.')
  }
  for (const e of examens.slice(0, 3)) {
    const href = `/prof/aletheia/examen-diagnostique/${e.planifieId}`
    dire(ongletDe(ongletsProf, href) === 'Exercices',
      `l’\`href\` de « Concevoir → » (${e.planifieId.slice(0, 8)}…) allume « Exercices »`)
    const vue = await chargerConception(admin, e.planifieId)
    dire(!!vue && vue.module === 'aletheia',
      `⭐ et la ROUTE SERT : \`chargerConception\` rend une vue de module « ${vue?.module} »`)
  }
}

// ════════════════════════════════════════════════════════════════════════════
// C. L'ONGLET EXERCICES DE L'ÉLÈVE — la maison, et la borne des deux ateliers
// ════════════════════════════════════════════════════════════════════════════
//
// COUTURE ③  qui écrit `exercices_depots` en `maison` ? le routeur / la
//            conception · qui le lit ? `exercicesMaisonDeLEleve(…, 'aletheia')` ·
//            quel chemin ? l'onglet Exercices élève → le déroulé de C5-L2.
async function ongletExercicesEleve(d) {
  titre('C. L’onglet EXERCICES de l’élève — la maison, et la borne dans LES DEUX SENS')

  const porte = await lireLaPorte(admin)
  if (!porte.exercicesActifs) {
    note('⚠️ `exercices_actif` est à OFF : la liste naît derrière sa porte et sera VIDE. '
      + 'C’est le régime voulu — l’onglet s’affiche, son contenu dit pourquoi.')
  }

  const liste = await exercicesMaisonDeLEleve(admin, d.eleveId, d.classeId, 'aletheia')
  const mien = liste.find((x) => x.depotId === d.depotMaison)
  dire(!!mien, `l’onglet Exercices sert le dépôt de lecture semé (${liste.length} au total)`)

  if (mien) {
    dire(mien.href === hrefDuDeroule('aletheia', d.depotMaison),
      `l’\`href\` rendu est \`${mien.href}\` — le déroulé d’ALETHEIA`)
    dire(ongletDe(ongletsEleve, mien.href) === 'Exercices',
      '⭐ cet `href` ALLUME « Exercices » — et PAS « Livres », qui matche tout par préfixe')
    dire(mien.etat.ton === 'a_faire', `l’état de la ligne est « ${mien.etat.libelle} »`)
  }

  // ⭐ LA BORNE DES DEUX ATELIERS — c'est ce qui empêche le module de devenir un
  //    attribut d'URL (`lireDepotMaison`, option `atelier`, C5-L2).
  const parAletheia = await lireDepotMaison(admin, d.depotMaison, d.eleveId, { atelier: 'aletheia' })
  const parCodex = await lireDepotMaison(admin, d.depotMaison, d.eleveId, { atelier: 'codex' })
  dire(!!parAletheia, '⭐ la ROUTE SERT : `lireDepotMaison` accepte le dépôt à la porte d’Aletheia')
  dire(parCodex === null, '⛔ et la porte de CODEX le REFUSE — la borne joue dans les deux sens')

  // Et l'inverse : l'écriture n'entre pas dans la liste de lecture.
  const ecritureIci = liste.some((x) => x.depotId === d.depotEcriture)
  dire(!ecritureIci, '⛔ le dépôt d’ÉCRITURE n’apparaît PAS sous l’onglet Exercices d’Aletheia')
  const chezCodex = await exercicesMaisonDeLEleve(admin, d.eleveId, d.classeId, 'codex')
  dire(chezCodex.some((x) => x.depotId === d.depotEcriture),
    '  ↳ il apparaît bien sous celui de Codex : « deux ateliers, deux portes, un seul prédicat »')
  dire(!chezCodex.some((x) => x.depotId === d.depotMaison),
    '  ↳ et le dépôt de LECTURE n’apparaît pas chez Codex')
}

// ════════════════════════════════════════════════════════════════════════════
// D. L'ONGLET EXAMENS DE L'ÉLÈVE — le signal du LANCEMENT, et sa route
// ════════════════════════════════════════════════════════════════════════════
//
// COUTURE ④  qui écrit `ouvert_par_prof_at` ? `ouvrirLesDepots()` de C4-L4 ·
//            qui le lit ? `signauxDeLancement(…, 'aletheia')` · quel chemin ?
//            l'onglet EXAMENS de l'élève → la page de passation.
async function ongletExamensEleve(d) {
  titre('D. L’onglet EXAMENS de l’élève — le signal du lancement, et sa route')

  const signaux = await signauxDeLancement(admin, d.eleveId, 'aletheia')
  const mien = signaux.find((s) => s.depotId === d.depotClasse)
  dire(!!mien, `l’onglet Examens sert le dépôt de classe OUVERT (${signaux.length} signal/aux)`)

  if (mien) {
    dire(mien.href === `/eleve/modules/aletheia/passation/${d.depotClasse}`,
      `l’\`href\` rendu est \`${mien.href}\``)
    dire(ongletDe(ongletsEleve, mien.href) === 'Examens',
      '⭐ cet `href` ALLUME « Examens » — et PAS « Exercices », ni « Livres »')
    const vue = await chargerVueEleve(admin, d.depotClasse, d.eleveId)
    dire(!!vue, '⭐ et la ROUTE SERT : `chargerVueEleve` accepte le dépôt')
  }

  // ⛔ LE SIGNAL NE VA PAS SOUS EXERCICES : « celui-là naît de l'ASSIGNATION,
  //    celui-ci du LANCEMENT — deux événements, deux signaux ».
  const maison = await exercicesMaisonDeLEleve(admin, d.eleveId, d.classeId, 'aletheia')
  dire(!maison.some((x) => x.depotId === d.depotClasse),
    '⛔ le dépôt de CLASSE n’apparaît PAS sous Exercices — le partage du `06-` §1 tient')

  // Et le signal d'Aletheia n'est pas celui de Codex.
  const cotéCodex = await signauxDeLancement(admin, d.eleveId, 'codex')
  dire(!cotéCodex.some((s) => s.depotId === d.depotClasse),
    d.lignePlan
      ? '⛔ ni sous les Examens de CODEX — la ligne de plan `lecture` a primé sur `composer`'
      : '  (sans ligne de plan, la règle du mode s’applique — voir section B)')
}

// ════════════════════════════════════════════════════════════════════════════
// E. ⭐⭐ LA COPIE ABOUTIE QUI DIT SES ÉCARTÉES — le quatrième item de la boîte
// ════════════════════════════════════════════════════════════════════════════
//
// COUTURE ⑤  qui écrit le motif ? `motifDesEcartees()` (C5-L3), dans
//            `exercices_jobs.dernier_message` · qui le lit ? `etatDesJobs()` →
//            `etatChaineDeLaCopie()` → `EcranProf` · quel chemin y mène ?
//            l'onglet Exercices du professeur → la passation → « LA FILE ».
//
// ⭐ DEUX ÉPREUVES, ET LA PREMIÈRE EST LA VRAIE : la PRODUCTION, en LECTURE
//    SEULE. C'est le seul endroit où le CAS MIXTE existe.
async function laCopieQuiSeTaisait(d) {
  titre('E. ⭐⭐ LA COPIE `abouti` QUI DIT SES ÉCARTÉES — sur la PRODUCTION')

  // ── ① LA PRODUCTION, PAR POSTGREST, EN LECTURE SEULE ──────────────────────
  if (!env.PROD_SUPABASE_URL || !env.PROD_SUPABASE_SECRET_KEY) {
    note('⚠️ pas de `PROD_SUPABASE_*` en `.env.local` — l’épreuve de production est SAUTÉE.')
  } else {
    const prod = createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } })
    // ⚠️ LECTURE SEULE, ET RIEN QUE ÇA. Aucune écriture ne part vers la prod.
    const jobs = verifie('jobs de prod', await prod.from('exercices_jobs')
      .select('depot_id, etape, statut, echec_definitif, dernier_message')
      .like('dernier_message', '%écartée(s) —%').order('depot_id').limit(200))
    note(`${jobs.length} job(s) de PRODUCTION portent la marque des écartées`)

    if (jobs.length === 0) {
      note('⚠️ aucune ligne : rien à prouver ici, l’épreuve du bac à sable reste.')
    } else {
      // On reconstitue EXACTEMENT ce que l'écran reçoit : les jobs du dépôt, la
      // présence d'un retour, la présence d'une copie.
      const depots = [...new Set(jobs.map((j) => j.depot_id))]
      const retours = verifie('retours de prod', await prod.from('exercices_retours')
        .select('depot_id').in('depot_id', depots))
      const copies = verifie('dépôts de prod', await prod.from('exercices_depots')
        .select('id, transcription_v1').in('id', depots))
      const avecRetour = new Set(retours.map((r) => r.depot_id))
      const texteDe = new Map(copies.map((c) => [c.id, c.transcription_v1 ?? '']))

      let abouties = 0
      let disent = 0
      let taisent = 0
      for (const id of depots) {
        const siens = jobs.filter((j) => j.depot_id === id).map((j) => ({
          etape: j.etape, statut: j.statut,
          echec_definitif: j.echec_definitif, message: j.dernier_message,
        }))
        const e = etatChaineDeLaCopie({
          attente: siens,
          aUnRetour: avecRetour.has(id),
          aUneCopie: (texteDe.get(id) ?? '').trim().length > 0,
        })
        if (e.cle !== 'abouti') continue
        abouties++
        if (e.motif) disent++; else taisent++
      }
      note(`sur ${depots.length} dépôt(s), ${abouties} sont en état \`abouti\``)
      dire(abouties > 0, `⭐ LE CAS MIXTE EXISTE EN PROD : ${abouties} copie(s) \`abouti\` `
        + 'dont le job nomme des compétences écartées')
      dire(taisent === 0 && disent === abouties,
        `⭐⭐ ET ELLES LE DISENT TOUTES DÉSORMAIS : ${disent}/${abouties} servent leur motif `
        + `(${taisent} se taisent encore)`)

      // La preuve à l'œil : ce que le professeur lira sous « Traitement terminé. »
      const premier = depots.find((id) => {
        const siens = jobs.filter((j) => j.depot_id === id).map((j) => ({
          etape: j.etape, statut: j.statut,
          echec_definitif: j.echec_definitif, message: j.dernier_message,
        }))
        return etatChaineDeLaCopie({
          attente: siens, aUnRetour: avecRetour.has(id),
          aUneCopie: (texteDe.get(id) ?? '').trim().length > 0,
        }).cle === 'abouti'
      })
      if (premier) {
        const siens = jobs.filter((j) => j.depot_id === premier).map((j) => ({
          etape: j.etape, statut: j.statut,
          echec_definitif: j.echec_definitif, message: j.dernier_message,
        }))
        const e = etatChaineDeLaCopie({
          attente: siens, aUnRetour: avecRetour.has(premier),
          aUneCopie: (texteDe.get(premier) ?? '').trim().length > 0,
        })
        note(`ce que l’écran affiche maintenant, sur ${premier.slice(0, 8)}… :`)
        note(`  phrase : « ${e.phrase} »`)
        note(`  motif  : « ${(e.motif ?? '').slice(0, 160)}… »`)
        note(`  relançable : ${e.relancable} (rien n’attend le professeur — une trace n’est pas un état)`)
      }
    }
  }

  // ── ② L'ALLER-RETOUR EN BASE, DANS LE BAC À SABLE ────────────────────────
  //    ⭐ L'AUTRE MOITIÉ DE LA COUTURE : ce que `motifDesEcartees()` ÉCRIT est-il
  //       ce que `etatChaineDeLaCopie()` LIT, après un passage RÉEL par la base ?
  //       Le message est produit par LE VRAI ÉCRIVAIN, écrit dans une VRAIE ligne
  //       de `exercices_jobs`, relu par LE VRAI LECTEUR (`etatDesJobs`).
  titre('E-bis. L’aller-retour en base — l’écrivain de C5-L3, le lecteur de C5-L4')

  const fragment = motifDesEcartees({
    competencesEcartees: [
      { competence: 'structure', motif: 'mode « expliquer » non couvert par l’instrument de structure' },
      { competence: 'argumentation', motif: 'mode « expliquer » non couvert par l’instrument d’argumentation' },
    ],
  })
  dire(fragment.startsWith(', 2 écartée(s) — structure, argumentation'),
    `\`motifDesEcartees()\` écrit : « ${fragment.slice(0, 70)}… »`)

  const message = '2 mesurée(s), 2 écrite(s), 0 déjà là, retour écrit, 6 appel(s), 61 s' + fragment
  // ⚠️ `cle_idempotence` est NOT NULL, et elle ne s'invente pas : c'est
  //    `cleIdempotence(depotId, etape)` — la MÊME que `mettreEnFile` pose. Un
  //    décor qui la forgerait à la main écrirait une ligne que la file ne
  //    reconnaîtrait pas comme sienne.
  const job = verifie('job de décor', await admin.from('exercices_jobs').insert({
    depot_id: d.depotMaison, etape: ETAPE_MESURE_V1, statut: 'abouti',
    echec_definitif: false, dernier_message: message,
    cle_idempotence: cleIdempotence(d.depotMaison, ETAPE_MESURE_V1),
  }).select('id').single())
  d.registre.jobs.push(job.id)
  fs.writeFileSync(REGISTRE, JSON.stringify(d.registre, null, 2))

  // ⭐ ON RELIT PAR LE VRAI LECTEUR, PAS PAR LA VARIABLE QU'ON VIENT D'ÉCRIRE.
  const lus = await etatDesJobs(admin, d.depotMaison)
  const relu = lus.find((j) => j.etape === ETAPE_MESURE_V1)
  dire(!!relu && relu.message === message,
    '⭐ `etatDesJobs()` relit le message DEPUIS LA BASE, à l’octet près')

  const etat = etatChaineDeLaCopie({
    attente: lus.map((j) => ({
      etape: j.etape, statut: j.statut, echec_definitif: j.echec_definitif, message: j.message,
    })),
    aUnRetour: true,          // la mesure a abouti ET le retour est écrit — le CAS MIXTE
    aUneCopie: true,
  })
  dire(etat.cle === 'abouti', `l’état est \`${etat.cle}\` — le traitement EST terminé`)
  dire(etat.phrase === 'Traitement terminé.', 'la phrase ne change pas — rien n’a échoué')
  dire(etat.relancable === false, '⛔ et rien n’est relançable : une trace n’est pas un état')
  dire(!!etat.motif && etat.motif.startsWith('2 écartée(s) — structure, argumentation'),
    `⭐⭐ ET LE MOTIF EST SERVI : « ${(etat.motif ?? '').slice(0, 60)}… »`)
  dire(!(etat.motif ?? '').includes('mesurée(s)'),
    '  ↳ sans recopier le bilan qui le précède : « 2 mesurée(s) » n’est pas une nouvelle')

  // ⛔ ET LE SILENCE RESTE LA RÈGLE quand il n'y a rien à dire.
  const muet = etatChaineDeLaCopie({
    attente: [{ etape: ETAPE_MESURE_V1, statut: 'abouti', echec_definitif: false,
      message: '2 mesurée(s), 2 écrite(s), 0 déjà là, retour écrit, 3 appel(s), 12 s' }],
    aUnRetour: true, aUneCopie: true,
  })
  dire(muet.cle === 'abouti' && muet.motif === null,
    '⛔ sans écartées, l’écran se tait toujours — « un bandeau tout va bien ferait du bruit »')
}

// ════════════════════════════════════════════════════════════════════════════
// F. LA COUTURE, BOUT À BOUT — le parcours, onglet par onglet
// ════════════════════════════════════════════════════════════════════════════
//
// ⭐ « S'ATTEINT SANS CONNAÎTRE D'IDENTIFIANT » SE DÉMONTRE PAR UN CLIC. Chaque
//    ligne ci-dessous est un `href` RENDU PAR UNE LECTURE (jamais tapé à la
//    main), et l'onglet qui s'allume dessus.
async function laCoutureBoutABout(d) {
  titre('F. La couture — l’exercice de lecture traversé en ne cliquant que des onglets')

  const etapes = []
  // ① Le professeur conçoit. (Renvoi, décision de Louis : on ne déménage pas.)
  etapes.push(['prof', 'Onglet Exercices → « Concevoir un exercice de lecture → »',
    '/prof/conception/nouvelle?porte=aletheia', null])
  etapes.push(['prof', 'Onglet Exercices → « Les textes et leurs références → »',
    '/prof/conception/textes', null])
  // ② L'élève travaille à la maison.
  const liste = await exercicesMaisonDeLEleve(admin, d.eleveId, d.classeId, 'aletheia')
  const mien = liste.find((x) => x.depotId === d.depotMaison)
  if (mien) etapes.push(['eleve', 'Onglet Exercices → la ligne de son exercice', mien.href, 'Exercices'])
  // ③ L'élève passe en classe.
  const signaux = await signauxDeLancement(admin, d.eleveId, 'aletheia')
  const sig = signaux.find((s) => s.depotId === d.depotClasse)
  if (sig) etapes.push(['eleve', 'Onglet Examens → le signal de lancement', sig.href, 'Examens'])
  // ④ Le professeur suit la passation, et lit la file.
  const passations = await passationsDeClasse(admin, 'aletheia')
  const p = passations.find((x) => x.exerciceId === d.exClasse)
  if (p) etapes.push(['prof', 'Onglet Exercices → « Ouvrir → » sur la passation', p.href, 'Exercices'])
  // ⑤ Le professeur conçoit l'examen diagnostique.
  for (const e of await examensAConcevoir(admin, 'aletheia')) {
    etapes.push(['prof', 'Onglet Exercices → encart « Concevoir → »',
      `/prof/aletheia/examen-diagnostique/${e.planifieId}`, 'Exercices'])
    break
  }
  // ⑥ Le professeur revient à ses livres et ouvre la fiche d'un élève.
  etapes.push(['prof', 'Onglet Livres → « Voir le détail → » sur un élève',
    `/prof/aletheia/eleve/${d.eleveId}`, 'Livres'])
  // ⑦ L'élève retourne à sa séance de lecture.
  etapes.push(['eleve', 'Onglet Livres → une séance du livre',
    '/eleve/modules/aletheia/00000000-0000-0000-0000-000000000000/3', 'Livres'])

  for (const [role, quoi, href, attendu] of etapes) {
    const onglets = role === 'prof' ? ongletsProf : ongletsEleve
    if (attendu === null) {
      // Hors module : l'onglet ne s'allume pas, et c'est juste — c'est un RENVOI.
      dire(ongletDe(onglets, href) === null,
        `${quoi}\n    → ${href}  (hors module : un RENVOI, pas un onglet)`)
      continue
    }
    const allume = ongletDe(onglets, href)
    dire(allume === attendu, `${quoi}\n    → ${href}\n    → onglet allumé : « ${allume} »`)
  }
}

// ════════════════════════════════════════════════════════════════════════════
// G. LE RETRAIT — tout ce que le décor a semé, et rien d'autre
// ════════════════════════════════════════════════════════════════════════════
async function retirer() {
  titre('G. Le retrait — par le registre, puis par la marque')
  const registre = fs.existsSync(REGISTRE)
    ? JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
    : { exercices: [], depots: [], lignesPlan: [], jobs: [] }

  if ((registre.jobs ?? []).length) {
    verifie('jobs', await admin.from('exercices_jobs').delete().in('id', registre.jobs).select('id'))
    note(`${registre.jobs.length} job(s) retiré(s)`)
  }
  // Repli par la MARQUE — un décor semé sans registre se retrouve quand même.
  const marquees = []
  const PAGE = 500
  for (let de = 0; ; de += PAGE) {
    const { data, error, count } = await admin.from('exercices')
      .select('id, consigne_instanciee', { count: 'exact' }).order('id').range(de, de + PAGE - 1)
    if (error) throw new Error(`instances — ${error.message}`)
    for (const e of data ?? []) {
      if (JSON.stringify(e.consigne_instanciee ?? '').includes(MARQUE)) marquees.push(e.id)
    }
    if ((data ?? []).length < PAGE || de + PAGE >= (count ?? 0)) break
  }
  const ids = [...new Set([...(registre.exercices ?? []), ...marquees])]
  if (ids.length) {
    const deps = verifie('dépôts', await admin.from('exercices_depots')
      .select('id').in('exercice_id', ids))
    const dep = deps.map((x) => x.id)
    for (const t of ['exercices_jobs', 'exercices_retours', 'exercices_squelettes',
      'exercices_metacognition', 'competences_mesures', 'monitoring_mesures']) {
      if (dep.length) await admin.from(t).delete().in('depot_id', dep)
    }
    if (dep.length) {
      verifie('dépôts', await admin.from('exercices_depots').delete().in('id', dep).select('id'))
    }
    await admin.from('exercices_cas').delete().in('exercice_id', ids)
    verifie('instances', await admin.from('exercices').delete().in('id', ids).select('id'))
    note(`${ids.length} instance(s) retirée(s), dépôts et traces compris`)
  }

  // ⚠️⚠️ LES LIGNES DE PLAN PARTENT EN DERNIER, ET L'ORDRE N'EST PAS UNE
  //    PRÉFÉRENCE : `exercices.exercice_planifie_id` les référence
  //    (`exercices_exercice_planifie_id_fkey`), et les retirer d'abord rend
  //    `23503` — la contrainte parle, et le décor reste à moitié en base.
  //    ⛔ On ne touche QUE les lignes que CE décor a semées : registre ET marque.
  if ((registre.lignesPlan ?? []).length) {
    verifie('lignes de plan', await admin.from('scriptorium_exercices_planifies')
      .delete().in('id', registre.lignesPlan).eq('note', MARQUE).select('id'))
    note(`${registre.lignesPlan.length} ligne(s) de plan retirée(s)`)
  }
  // Repli : une ligne marquée que le registre aurait perdue.
  const orphelines = verifie('lignes marquées', await admin
    .from('scriptorium_exercices_planifies').select('id').eq('note', MARQUE))
  if (orphelines.length) {
    verifie('lignes orphelines', await admin.from('scriptorium_exercices_planifies')
      .delete().eq('note', MARQUE).select('id'))
    note(`${orphelines.length} ligne(s) de plan retrouvée(s) par la marque, et retirée(s)`)
  }

  if (fs.existsSync(REGISTRE)) fs.unlinkSync(REGISTRE)
  note('✓ registre effacé — la sandbox est comme trouvée')
}

// ════════════════════════════════════════════════════════════════════════════
if (a('retire')) {
  try { await retirer() } catch (e) { console.error(`\n✗ ${e.message}`); process.exit(1) }
  process.exit(0)
}

let decor = null
try {
  decor = await semer()
  await ongletExercicesProf(decor)
  await ongletExercicesEleve(decor)
  await ongletExamensEleve(decor)
  await laCopieQuiSeTaisait(decor)
  await laCoutureBoutABout(decor)
} catch (e) {
  console.error(`\n✗ ${e.message}`)
  ko++
} finally {
  if (!GARDE_LE_DECOR) {
    try { await retirer() } catch (e) { console.error(`\n⚠️ retrait incomplet : ${e.message}`) }
  } else {
    console.log(`\n⛔ \`--garde-le-decor\` : le décor RESTE. Retrait :`
      + `\n   node … scripts/recette/couture-c5l4.mjs --retire`)
  }
}

console.log(`\n${'═'.repeat(78)}`)
console.log(`COUTURE C5-L4 — ${ok} vert(s), ${ko} rouge(s)`)
console.log(ko === 0
  ? '⭐ LA COUTURE TIENT : l’exercice de lecture se traverse d’un bout à l’autre en '
    + 'ne cliquant que sur des onglets.'
  : '✗ la couture a un trou — il est ci-dessus, avec sa ligne.')
process.exit(ko === 0 ? 0 : 1)
