// ============================================================================
// RECETTE C5 · L3 — LES MESURES EN RÉCEPTION, ET LA COUTURE AVEC C4-L5.
// ----------------------------------------------------------------------------
// « VÉRIFIÉ VEUT DIRE PAR REQUÊTE ET SUR PIÈCE, PAS SUPPOSÉ. »
//
// ⭐⭐ LA COUTURE QUE CE SCRIPT ÉPROUVE — convention du `PLAN_DE_CHANTIER.md` §5,
//    posée le 27/08, dont C5-L3 est le premier destinataire. Le lot dépend de
//    **C4-L5**, et la question se nomme en une phrase :
//
//      « LA CHAÎNE SAIT-ELLE SERVIR UN INSTRUMENT **RÉCEPTIF** DE BOUT EN BOUT,
//        SUR UN DÉPÔT RÉEL, ET ÉCRIRE SA MESURE ? »
//
//    ⛔ Ce n'est PAS la clause du « fait quand ». C'est la preuve que **le chemin
//       existe**, indépendamment de ce qui y circule — et elle se joue même si le
//       verrou du manifeste ferme les quatre compétences.
//
// ⭐ LES QUATRE COUTURES, NOMMÉES SOUS LA SEULE FORME QUI LES REND VÉRIFIABLES —
//    *qui écrit cette colonne · qui la lit · un chemin réel y mène-t-il ?*
//
//   ① `exercices.modes_par_competence`
//        écrite par : l'écran de conception (`concevoirInstance`) et
//                     `MODES_MESURES` (`utils/examens/types.ts`, `01-` §10)
//        lue par    : `lireContexte` → `ctx.modesParCompetence` →
//                     `competencesDeLExercice` → **la porte de mode** (C5-L3)
//        chemin réel : OUI — un exercice `assigne` × `classe` en PROD l'élit.
//
//   ② `exercices.reference_id` → `exercices_references.contenu`
//        écrite par : `concevoirInstance` depuis `referenceValidee` (C5-L2)
//        lue par    : `lireContexte` → `ctx.reference` → **la tranche** (C5-L3)
//                     → `contexteExercice.reference` → `armatureDe` /
//                     `referenceDuContexte`
//        chemin réel : OUI — 3 références validées en bac à sable, 2 en prod.
//
//   ③ `exercices_squelettes` (`artefact_extraction`, `artefact_jugement`)
//        écrite par : `chaineDUneCompetence` (C4-L5)
//        lue par    : le retour, et la relecture RR1-RR4
//        chemin réel : c'est ce que ce script fait passer.
//
//   ④ `competences_mesures.modes` — « une LISTE, jamais une valeur » (`07-` §1.2)
//        écrite par : `ecrireLaMesure` (C4-L5)
//        lue par    : `utils/routeur/donnees.ts:86` → `proportions.ts` →
//                     `ciblage.ts` — **le signal de ciblage par groupe de modes**
//        chemin réel : c'est là que la porte de mode empêche une mesure fausse
//                     d'entrer dans le groupe réceptif.
//
// ⚠️ ELLE NE DEMANDE PAS DE RÉPARER CE QU'ELLE RÉVÈLE. Ce que le passage montre
//    se dépose au `SUIVI_tests_manuels.md` avec sa condition de reprise.
//
// ----------------------------------------------------------------------------
// LES SECTIONS, dans l'ordre :
//   A. le décor     — un texte RÉEL à référence VALIDÉE, une instance de
//                     LECTURE qui élit QUATRE compétences — deux que l'instrument
//                     couvre, deux qu'il ne couvre pas —, son dépôt
//   B. ② LA PORTE   — la preuve DANS LES DEUX SENS, sur LE MÊME dépôt : les deux
//                     couvertes passent, les deux non couvertes sont écartées
//                     AVEC LEUR MOTIF
//   C. ④ LA TRANCHE — `valeursServies` sur la VRAIE référence en base : ce que
//                     chaque règle lit, ce qu'elle écarte, et le sort de `relance`
//   D. ③ LA COUTURE — la traversée PAYANTE : squelette, verdict, lettre, `modes`
//                     en base, et ⭐ LA PREUVE PAR L'ÉCHEC — zéro appel payé sur
//                     les deux compétences écartées
//   E. le nettoyage — tout ce que la recette a semé est retiré, par requête
//
// ----------------------------------------------------------------------------
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/reception-c5l3.mjs [--avec-chaine] [--garde-le-decor]
//
// `--avec-chaine`  joue la section D jusqu'au bout : LA CHAÎNE PART, DES APPELS
//                  SONT PAYÉS (compter ~6 : Questionnement p1+p2, Synthèse
//                  p1a+p1b+p2, retour). Sans lui, tout le reste se joue quand
//                  même et AUCUN modèle n'est appelé.
//
// ⛔ MODE DE RETRAIT. Sans `--garde-le-decor`, la section E retire TOUT ce que le
//    script a semé — classe, instances, dépôts, et les six tables filles — par
//    requête, et elle le fait aussi sur interruption. Le décor se reconnaît à sa
//    classe, dont le nom commence par « RECETTE-C5L3 ». Pour le retirer à la
//    main après un `--garde-le-decor` :
//        delete from exercices_depots where exercice_id in
//          (select id from exercices where classe_id in
//             (select id from classes where nom like 'RECETTE-C5L3%'));
//    (précédé des six tables filles ci-dessous, dans l'ordre de `nettoyer()`).
//
// ⚠️ LA BASE EST LA SANDBOX, ET UN ÉLÈVE RÉEL Y TRAVAILLE. La recette ne touche
//    QUE ce qu'elle a semé. Le TEXTE et sa RÉFÉRENCE sont RÉUTILISÉS EN LECTURE
//    SEULE : rien n'y est écrit.
// ============================================================================

import { register } from 'node:module'

// La cale de résolution des sous-chemins `next/…` (patron de C4-L3 et C5-L2).
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

const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)
const { competencesDeLExercice, tourDeFile } = await import(`${RACINE}/utils/chaine/chaine.ts`)
const { mettreEnFile, reclamerJobs } = await import(`${RACINE}/utils/chaine/file.ts`)
const { lireConfig } = await import(`${RACINE}/utils/chaine/config.ts`)
const { etatCompetence, modeNonCouvert } = await import(`${RACINE}/utils/chaine/instruments.ts`)
const { regleDeLecture, trancheDeReference } = await import(`${RACINE}/utils/chaine/tranche.ts`)
const { referenceValidee } = await import(`${RACINE}/utils/reference-validee.ts`)
const { lireDepotMaison, remettre } = await import(`${RACINE}/utils/deroule/depot.ts`)
const { chargerLeDeroule } = await import(`${RACINE}/utils/deroule/vue.ts`)
const { enregistrerLesConditions, enregistrerLaRestitution, enregistrerLaConfiance } =
  await import(`${RACINE}/utils/deroule/gestes.ts`)
const { COMPETENCES } = await import(`${RACINE}/utils/chaine/types.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

// ⭐⭐ LE TEXTE — Descartes, « Méditations métaphysiques », à référence VALIDÉE
//    et à matériau source. Réutilisé EN LECTURE SEULE.
//
// ⭐ POURQUOI CELUI-CI ET PAS CELUI DE C5-L1. Sa référence porte **17 phrases,
//    dont QUATRE (5, 11, 14, 16) dont `relance` est la SEULE fonction** — c'est
//    exactement le cas que le `05-` §1 nomme (« une phrase dont `relance` est la
//    seule fonction ne porte aucun contenu à restituer et n'est donc pas une
//    unité pour la Synthèse ») et la dette `C4L10SY-21`. Le texte de Kant est
//    validé lui aussi, mais sa référence n'en porte aucune : la tranche y serait
//    inerte, donc non prouvée. *On éprouve une règle là où elle mord.*
const TEXTE_ID = '64aba512-0612-47e1-994a-62e901252e34'
// L'englobant : « l'étendue réellement lue » — les deux premiers paragraphes.
// La localisation : la phrase du trompeur, dans cet englobant.
const ENGLOBANT = [0, 806]
const LOCALISATION = [334, 434]

const AVEC_CHAINE = process.argv.includes('--avec-chaine')
const GARDE_LE_DECOR = process.argv.includes('--garde-le-decor')
const MARQUE = 'RECETTE-C5L3'

let ok = 0
let ko = 0
const dire = (bon, texte) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${texte}`) }
const note = (texte) => console.log(`  · ${texte}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 72 - t.length))}`)

// ⚠️⚠️ LE PREMIER DES TROIS PIÈGES DE `supabase-js`, ET IL A MORDU DANS CE
//    SCRIPT MÊME, AU PREMIER TOUR PAYANT : **il ne lève pas, il rend `{ error }`**.
//    La lecture des mesures portait `.eq('version', 'v1')` — or
//    `competences_mesures` **n'a PAS de colonne `version`** (la version vit sur
//    le SQUELETTE ; « la vf n'écrit jamais dans les mesures »). PostgREST a rendu
//    `42703`, `data` est sorti `null`, et la recette a annoncé **« 0 mesure »**
//    sur un tour où les mesures étaient écrites. *Une lecture ratée n'est pas
//    « rien à faire ».* Tout `select` de ce script passe donc par ici.
const lire = async (libelle, requete) => {
  const { data, error } = await requete
  if (error) {
    dire(false, `LECTURE RATÉE — ${libelle} : ${error.code} ${error.message}`)
    return null
  }
  return data
}

const seme = { classes: [], exercices: [], depots: [] }

// ── A. LE DÉCOR ─────────────────────────────────────────────────────────────
async function semer() {
  titre('A. Le décor — un texte RÉEL, une instance qui élit LES DEUX CAS, un dépôt')

  const { data: texte, error: eTexte } = await admin.from('exercices_textes')
    .select('id, auteur, titre, reference_id').eq('id', TEXTE_ID).maybeSingle()
  if (eTexte || !texte) {
    throw new Error(`le texte de C5-L1 est introuvable (${TEXTE_ID}) : ${eTexte?.message ?? 'absent'}`)
  }
  const verdict = await referenceValidee(admin, TEXTE_ID)
  dire(verdict.ok && !!verdict.referenceId,
    `la référence du texte est VALIDÉE — ${texte.auteur} · ${texte.titre} · ${verdict.referenceId}`)
  if (!verdict.ok) throw new Error('sans référence validée, rien de ce lot ne se prouve.')

  const { data: type } = await admin.from('exercices_types')
    .select('id, code').eq('code', 'phrase').maybeSingle()
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

  // ⭐⭐ UNE SEULE INSTANCE, QUATRE COMPÉTENCES — ET C'EST LE POINT. Le « fait
  //    quand » demande la conformité « dans les DEUX SENS » : par le succès sur
  //    un couple que l'instrument couvre, par l'ÉCHEC sur un couple qu'il ne
  //    couvre pas. Les faire porter par LE MÊME DÉPÔT est ce qui rend la preuve
  //    incontestable — même contexte, même copie, même tour de chaîne.
  //  · `questionnement × expliquer` — COUVERT (une grille pour les cinq modes)
  //  · `synthese × restituer`       — COUVERT (mono-mode, réceptif)
  //  · `argumentation × expliquer`  — NON COUVERT (admis, sans instrument)
  //  · `structure × expliquer`      — NON COUVERT — *le couple même que C5-L2 a
  //                                   fait mesurer par l'instrument de composition*
  const { data: ex, error: eEx } = await admin.from('exercices').insert({
    type_id: type.id, classe_id: classe.id, statut: 'assigne',
    lieu: 'maison', cran: '8',
    consigne_instanciee: `${MARQUE} — Explique comment, chez Descartes, l'hypothèse du `
      + 'trompeur conduit à une certitude, et dis de quelle nature est cette certitude.',
    modes_par_competence: {
      questionnement: ['expliquer'],
      synthese: ['restituer'],
      argumentation: ['expliquer'],
      structure: ['expliquer'],
    },
    cible_primaire: 'questionnement',
    materiau_source_provenance: 'texte_auteur',
    materiau_source_support: 'extrait',
    materiau_source_texte_id: TEXTE_ID,
    materiau_source_englobant: ENGLOBANT,
    materiau_source_localisation: LOCALISATION,
    reference_id: verdict.referenceId,
  }).select('id').single()
  if (eEx) throw new Error(`instance de lecture : ${eEx.message}`)
  seme.exercices.push(ex.id)

  const { data: depot, error: eDepot } = await admin.from('exercices_depots').insert({
    eleve_id: eleve, exercice_id: ex.id, origine: 'prof', statut: 'assigne',
    assigne_at: new Date().toISOString(),
  }).select('id').single()
  if (eDepot) throw new Error(`dépôt : ${eDepot.message}`)
  seme.depots.push(depot.id)

  note(`décor : classe ${classe.id} · instance ${ex.id} · dépôt ${depot.id}`)
  return { eleve, classeId: classe.id, exercice: ex.id, depot: depot.id, referenceId: verdict.referenceId }
}

// ── B. ② LA PORTE DE MODE ───────────────────────────────────────────────────
async function laPorte(d) {
  titre('B. ② LA PORTE DE MODE — la preuve DANS LES DEUX SENS, sur LE MÊME dépôt')

  const ctx = await lireContexte(admin, d.depot)
  dire(Object.keys(ctx.modesParCompetence).length === 4,
    `la couture ① tient : \`modes_par_competence\` descend jusqu'au contexte — `
    + `${JSON.stringify(ctx.modesParCompetence)}`)

  const { mesurees, ecartees } = competencesDeLExercice(ctx)
  dire(mesurees.sort().join(',') === 'questionnement,synthese',
    `⭐ LES DEUX GRILLES RÉCEPTIVES QUI EXISTENT PASSENT : ${mesurees.join(', ')}`)

  const parMode = ecartees.filter((e) => /non couvert/.test(e.motif))
  dire(parMode.length === 2 && parMode.map((e) => e.competence).sort().join(',') === 'argumentation,structure',
    `⭐⭐⭐ LA PREUVE PAR L'ÉCHEC : ${parMode.length} compétence(s) écartée(s) PAR LA PORTE DE MODE `
    + `— ${parMode.map((e) => e.competence).join(', ')}`)
  for (const e of ecartees) note(`écartée — ${e.competence} : ${e.motif}`)

  // ⭐ LE MOTIF EST SERVI : le bilan d'un dépôt l'affiche. « Un motif faux ne se
  //    lit pas comme un commentaire faux — il se croit. »
  const m = parMode.find((e) => e.competence === 'structure')?.motif ?? ''
  dire(/expliquer/.test(m) && /structure/.test(m) && /composer/.test(m) && /COMPOSITION/.test(m),
    'le motif servi nomme LES TROIS choses : la compétence, le mode élu, et le fait que '
    + 'l\'instrument ne le couvre pas')

  // ⛔ ET C'EST BIEN LE MODE QUI DÉCIDE, PAS LE STATUT NI L'OUVERTURE : les
  //    quatre compétences sont `evaluee` et ouvertes.
  const statuts = ['questionnement', 'synthese', 'argumentation', 'structure']
    .map((c) => `${c}=${ctx.statutsRecette[c]}`)
  dire(statuts.every((s) => s.endsWith('evaluee')),
    `⭐ les quatre sont \`evaluee\` ET ouvertes — seul LE MODE les sépare : ${statuts.join(' · ')}`)

  // ⛔ CONTRE-ÉPREUVE : la porte ne retire rien à ce qui mesurait déjà.
  const enComposer = COMPETENCES
    .filter((c) => c !== 'synthese')
    .every((c) => modeNonCouvert(c, ['composer'], etatCompetence(c).branchement) === null)
  dire(enComposer,
    '⛔ CONTRE-ÉPREUVE — la porte n\'ouvre rien et ne RETIRE rien : les cinq compétences '
    + 'admises en `composer` y passent toutes, exactement comme avant ce lot')

  return { ctx, mesurees, ecartees }
}

// ── C. ④ LA TRANCHE DE RÉFÉRENCE ────────────────────────────────────────────
async function laTranche(d, ctx) {
  titre('C. ④ LA TRANCHE — `valeursServies` sur la VRAIE référence en base')

  dire(ctx.reference != null,
    'la couture ② tient : `exercices.reference_id` → `exercices_references.contenu` descend '
    + 'jusqu\'au contexte de la chaîne')
  dire(ctx.materiau != null && ctx.materiau.length > 0,
    `et le MATÉRIAU descend avec elle, par la même jointure (${ctx.materiau?.length ?? 0} caractères) — `
    + '« les deux descendent ensemble, ou aucun »')
  if (ctx.reference == null) return

  const phrases = ctx.reference.phrases ?? []
  const relanceSeule = phrases.filter((p) => (p.fonctions ?? []).length === 1
    && p.fonctions[0] === 'relance')
  note(`la référence porte ${phrases.length} phrases et ${(ctx.reference.moments ?? []).length} moments ; `
    + `${relanceSeule.length} phrase(s) ont \`relance\` pour SEULE fonction`)

  // ⭐ LA SYNTHÈSE — sa règle se lit sur SA FICHE, jamais recopiée.
  const rSyn = regleDeLecture('synthese', etatCompetence('synthese').instrument)
  dire(Array.isArray(rSyn?.fonctionsPhrase) && !rSyn.fonctionsPhrase.includes('relance'),
    `⭐ la règle de la Synthèse se lit sur son bloc machine dérivé — `
    + `\`fonctions_reference\` = [${rSyn?.fonctionsPhrase?.join(', ')}], et \`relance\` n'y est pas`)

  const tSyn = trancheDeReference(ctx.reference, 'synthese', etatCompetence('synthese').instrument)
  dire(tSyn.alertes.length === 0,
    '⭐⭐ `relance` EST DÉCLARÉE AU `02-` ET NON LUE : elle est écartée EN SILENCE, sans une '
    + `alerte — c'est l'asymétrie de \`valeursServies\`, et c'est ce qui bouche le trou de \`C4L10SY-21\``)
  dire(tSyn.ecarte.length === relanceSeule.length + phrases.filter((p) => (p.fonctions ?? [])
    .includes('relance') && p.fonctions.length > 1).length,
    `et le JOURNAL de l'exclusion la nomme : ${tSyn.ecarte.length} unité(s) restreinte(s)`)
  for (const e of tSyn.ecarte.slice(0, 6)) note(`  écarté — ${e.ou} : ${e.valeurs.join(', ')}`)

  // ⛔ ET L'UNITÉ N'EST PAS RETIRÉE : les moments réclameraient une unité absente.
  const apres = tSyn.reference.phrases ?? []
  dire(apres.length === phrases.length
    && (tSyn.reference.moments ?? []).length === (ctx.reference.moments ?? []).length,
    `⛔ aucune unité n'est RETIRÉE (${apres.length} phrases, ${(tSyn.reference.moments ?? []).length} `
    + 'moments) — la retirer ferait mentir les moments, dont l\'intervalle `de..a` est garanti contigu')

  // ⭐ LE QUESTIONNEMENT — il ne lit qu'un champ, et l'armature descend intacte.
  const tQ = trancheDeReference(ctx.reference, 'questionnement',
    etatCompetence('questionnement').instrument)
  const qd = tQ.reference?.armature?.question_directrice
  dire(typeof qd === 'string' && qd.length > 0,
    `⭐⭐ LA TRANCHE DU QUESTIONNEMENT — tout est retranché sauf ce qu'il lit, et `
    + `\`armature.question_directrice\` descend INTACTE : « ${String(qd).slice(0, 70)} »`)
  const toutVide = (tQ.reference.phrases ?? []).every((p) => (p.fonctions ?? []).length === 0
    && (p.statuts ?? []).length === 0)
  dire(toutVide,
    'et aucune fonction ni aucun statut d\'unité ne lui parvient — « le module n\'en lit aucun autre »')
}

// ── D. ③ LA COUTURE, PAR EXÉCUTION ──────────────────────────────────────────
async function laCouture(d) {
  titre('D. ③ LA COUTURE — la traversée d\'un dépôt RÉEL, jusqu\'à la mesure en base')

  const COPIE = 'Descartes suppose d\'abord que tout ce qu\'il perçoit est faux, jusqu\'à son '
    + 'propre corps.\r\n\r\n'
    + 'Il introduit alors un trompeur très puissant : mais s\'il est trompé, c\'est bien qu\'il '
    + 'est quelque chose. « Je suis, j\'existe » devient donc nécessairement vrai chaque fois '
    + 'qu\'il le prononce, et la tromperie même sert la preuve au lieu de la ruiner.\r\n\r\n'
    + 'On peut se demander de quelle durée est cette certitude : elle ne vaut qu\'aussi '
    + 'longtemps qu\'il pense, et elle est donc une certitude d\'existence, non de nature.'

  // ⚠️ LES TROIS GESTES AVANT LA REMISE — « la restitution à chaud se fait AVANT
  //    la remise : c'est elle qui doit partir avant tout envoi à l'IA ». Le
  //    déroulé les impose, et une recette qui les saute ne remet rien (C4-L3).
  const frais = await lireDepotMaison(admin, d.depot, d.eleve)
  if (!frais) { dire(false, 'le dépôt n\'est pas lisible par le déroulé'); return }
  await enregistrerLaRestitution(admin, frais,
    'Descartes doute de tout, puis trouve dans le doute même une certitude.',
    new Date().toISOString())
  const apresRestit = await lireDepotMaison(admin, d.depot, d.eleve)
  await enregistrerLesConditions(admin, apresRestit, 'temps_mis', new Date().toISOString())
  const apresCond = await lireDepotMaison(admin, d.depot, d.eleve)
  const vue = await chargerLeDeroule(admin, d.depot, d.eleve,
    { ouvert: true, delaiVfJours: 3, atelier: 'aletheia' })
  if (vue?.competencesDeLaConfiance?.length) {
    await enregistrerLaConfiance(admin, apresCond,
      Object.fromEntries(vue.competencesDeLaConfiance.map((c) => [c, 'moyennement_sur'])),
      vue.competencesDeLaConfiance, new Date().toISOString())
    // ⭐ CE QUE L'ÉCRAN DEMANDE À L'ÉLÈVE EST DÉJÀ FILTRÉ PAR LA PORTE : il ne
    //    réclame pas la confiance d'une compétence que la chaîne va écarter.
    note(`l'écran demande la confiance sur : ${vue.competencesDeLaConfiance.join(', ')}`)
  }
  const avantRemise = await lireDepotMaison(admin, d.depot, d.eleve)
  const remis = await remettre(admin, avantRemise, 'v1',
    { texte: COPIE, tagDuree: null, telemetrie: null }, new Date().toISOString())
  dire(remis.ok, `la v1 est remise : ${remis.ok ? 'oui' : remis.message}`)
  const enBase = await lire('exercices_depots', admin.from('exercices_depots')
    .select('texte_v1').eq('id', d.depot).maybeSingle())
  if (!enBase) return
  dire(!enBase.texte_v1.includes('\r'),
    `le CRLF est normalisé avant l'écriture : ${(enBase.texte_v1.match(/\r/g) ?? []).length} CR en base`)

  if (!AVEC_CHAINE) {
    note('⊘ `--avec-chaine` absent : la chaîne ne part pas, aucun appel n\'est payé. '
      + 'La couture ③ et la couture ④ restent à jouer.')
    return
  }

  // ⭐⭐ ON PASSE PAR LA FILE, PAS PAR `traiterDepot` EN DIRECT — et c'est ce qui
  //    a fait la différence. Les deux résumés qui persistent le bilan
  //    (`resume()` et `resumeBilan()`) ne sont appelés QUE par la file ; un
  //    appel direct court-circuite `exercices_jobs.dernier_message`, donc le
  //    SEUL canal que l'écran prof lise. *Une recette qui court-circuite le
  //    chemin de production ne prouve pas le chemin de production.*
  const debut = Date.now()
  let bilan = null
  try {
    // Le patron est celui de la production — `app/api/chaine/route.ts` :
    // `lireConfig()` est SYNCHRONE, et `reclamerJobs` prend un objet d'options.
    const config = lireConfig()
    await mettreEnFile(admin, d.depot, 'mesure_v1')
    const jobs = await reclamerJobs(admin, {
      limite: 5, bailMs: config.bailMs, depotId: d.depot,
    })
    const miens = jobs.filter((j) => j.depot_id === d.depot)
    dire(miens.length === 1, `la file porte ${miens.length} job(s) pour ce dépôt`)
    const sorties = await tourDeFile(admin, miens, config)
    bilan = sorties[0]?.bilan ?? null
    if (!bilan) { dire(false, `la file n'a rendu aucun bilan : ${sorties[0]?.erreur ?? '—'}`); return }
  } catch (e) {
    dire(false, `la chaîne a levé : ${e.message}`)
    return
  }
  const secondes = ((Date.now() - debut) / 1000).toFixed(1)
  note(`chaîne : ${bilan.competencesMesurees.join(', ') || 'aucune'} · ${secondes} s`)
  for (const a of bilan.alertes ?? []) note(`alerte : ${a}`)
  dire(Number(secondes) < 180, `le contrat de latence est tenu : ${secondes} s < 180 s (01- §12)`)

  // ⭐⭐⭐ LA PREUVE PAR L'ÉCHEC, EN BASE — le nombre d'appels se lit AU NOMBRE
  //    DE LIGNES d'`api_couts`, jamais à un compteur.
  const couts = await lire('api_couts', admin.from('api_couts')
    .select('competence, phase').eq('depot_id', d.depot).limit(1000))
  const parCompetence = {}
  for (const c of couts ?? []) {
    parCompetence[c.competence ?? '(sans)'] = (parCompetence[c.competence ?? '(sans)'] ?? 0) + 1
  }
  note(`\`api_couts\` : ${(couts ?? []).length} ligne(s) — ${JSON.stringify(parCompetence)}`)
  dire(!parCompetence.argumentation && !parCompetence.structure,
    '⭐⭐⭐ ZÉRO APPEL PAYÉ sur `argumentation` et `structure` — la porte mord AVANT la dépense, '
    + 'et c\'est le patron des slots : « un appel dépensé sur une chaîne qui produirait des trous '
    + 'est un appel perdu »')

  // ── COUTURE ③ — les squelettes.
  const sq = await lire('exercices_squelettes', admin.from('exercices_squelettes')
    .select('competence, artefact_extraction, artefact_jugement, instrument_version')
    .eq('depot_id', d.depot).eq('version', 'v1'))
  const avecJugement = (sq ?? []).filter((s) => s.artefact_jugement != null)
  dire(avecJugement.length > 0,
    `⭐⭐ COUTURE ③ — ${(sq ?? []).length} squelette(s) écrit(s), dont ${avecJugement.length} `
    + `avec leur VERDICT : ${(sq ?? []).map((s) => s.competence).join(', ')}`)
  dire((sq ?? []).every((s) => !['argumentation', 'structure'].includes(s.competence)),
    '⛔ et AUCUN squelette de composition n\'a été écrit sur une copie de lecture')

  // ── COUTURE ④ — les mesures, et `modes` en base.
  // ⛔ PAS DE `.eq('version', …)` ICI : `competences_mesures` n'a pas cette
  //    colonne — la version vit sur le squelette, et « la vf n'écrit jamais dans
  //    les mesures, elle attache SON DELTA à celle de la v1 » (`07-` §1.2).
  const mes = await lire('competences_mesures', admin.from('competences_mesures')
    .select('competence, modes, lettre_equivalente, sonde_montee, instrument_version, delta_v1_vf')
    .eq('depot_id', d.depot))
  for (const m of mes ?? []) {
    note(`mesure — ${m.competence} · modes=${JSON.stringify(m.modes)} · `
      + `lettre=${m.lettre_equivalente ?? 'NULL'} · instrument ${m.instrument_version}`)
  }
  const receptives = (mes ?? []).filter((m) => (m.modes ?? [])
    .some((x) => ['restituer', 'expliquer', 'évaluer', 'interroger'].includes(x)))
  dire(receptives.length > 0,
    `⭐⭐⭐ COUTURE ④ — ${receptives.length} MESURE(S) DE RÉCEPTION EN BASE, et \`modes\` porte `
    + `bien le mode réceptif élu : ${receptives.map((m) => `${m.competence}×${(m.modes ?? []).join('+')}`).join(', ')}`)
  dire((mes ?? []).every((m) => !['argumentation', 'structure'].includes(m.competence)),
    '⛔ et AUCUNE mesure fausse n\'est entrée dans le signal de ciblage réceptif du routeur '
    + '(`01-` §3 : « une mesure appartient à un groupe dès qu\'elle porte un mode du groupe »)')
  const avecLettre = (mes ?? []).filter((m) => m.lettre_equivalente != null)
  dire(avecLettre.length > 0,
    `⭐⭐⭐ LE « FAIT QUAND » — squelette, verdict ET LETTRE-ÉQUIVALENTE, sur une copie de `
    + `LECTURE : ${avecLettre.map((m) => `${m.competence}=${m.lettre_equivalente}`).join(', ')}`)

  // ── LE MONITORING — une compétence écartée pour cause de mode ne doit pas
  //    entrer dans `competences_couvertes[]`, « faute de quoi on ne saura jamais
  //    relire la mesure » (`07-` §1.4).
  const mon = await lire('monitoring_mesures', admin.from('monitoring_mesures')
    .select('sous_dimension, competences_couvertes').eq('depot_id', d.depot))
  for (const m of mon ?? []) {
    note(`monitoring — ${m.sous_dimension} · couvertes=${JSON.stringify(m.competences_couvertes)}`)
  }
  dire((mon ?? []).every((m) => !(m.competences_couvertes ?? [])
    .some((c) => ['argumentation', 'structure'].includes(c))),
    '⭐ et une compétence écartée POUR CAUSE DE MODE n\'entre pas dans `competences_couvertes[]` '
    + '— « faute de quoi on ne saura jamais relire la mesure » (`07-` §1.4)')

  // ── ⭐⭐⭐ LE MOTIF ATTEINT-IL LA BASE ? — le défaut trouvé au smoke prof.
  //    `competencesDeLExercice` prétendait que « le bilan d'un dépôt affiche »
  //    son motif ; il ne vivait que dans la valeur de retour EN MÉMOIRE.
  //    `exercices_jobs.dernier_message` est le SEUL canal que l'écran prof lise
  //    (`etatDesJobs` → `utils/passation/depots.ts`). *Un motif que personne ne
  //    peut lire n'est pas un motif.*
  const jobs = await lire('exercices_jobs', admin.from('exercices_jobs')
    .select('etape, statut, dernier_message').eq('depot_id', d.depot)
    .order('created_at', { ascending: true }))
  for (const j of jobs ?? []) {
    note(`job ${j.etape} · ${j.statut} · ${String(j.dernier_message ?? '—').slice(0, 200)}`)
  }
  const messages = (jobs ?? []).map((j) => j.dernier_message ?? '').join(' ')
  dire(/écartée\(s\)/.test(messages) && /argumentation/.test(messages) && /structure/.test(messages),
    '⭐⭐⭐ LE MOTIF DE LA PORTE ATTEINT LA BASE — `exercices_jobs.dernier_message` porte les deux '
    + 'compétences écartées, et c\'est ce que l\'écran prof lit')
  dire(/non couvert/.test(messages),
    'et il porte le MOTIF, pas seulement le nombre — « non couvert » y est en toutes lettres')

  // ── LE RETOUR — et l'ancrage, dont C5-L2 demande le compte.
  const retour = await lire('exercices_retours', admin.from('exercices_retours')
    .select('texte, published_at, registre_servi').eq('depot_id', d.depot)
    .eq('moment', 'chaud').maybeSingle())
  dire(bilan.retourEcrit && !!retour,
    `le retour de réception est écrit (registre ${retour?.registre_servi ?? '—'})`)
  if (retour) {
    const points = Array.isArray(retour.texte) ? retour.texte : []
    const surCopie = points.filter((p) => p.ancrage?.source === 'copie').length
    const surTexte = points.filter((p) => p.ancrage?.source === 'texte_support').length
    // ⭐ LA DONNÉE QUE C5-L2 A DEMANDÉE, ET QUI MANQUE À LOUIS POUR TRANCHER : la
    //    règle 1 du gabarit (§4, GELÉ) fait ancrer « sur une citation DU
    //    SQUELETTE » — et le squelette est fait de la COPIE — quand RR3 suppose
    //    qu'un point puisse citer le TEXTE SUPPORT. Le compte se dit, même nul.
    dire(true, `⭐ ANCRAGE DU RETOUR DE RÉCEPTION — ${surCopie} point(s) sur « copie », `
      + `${surTexte} sur « texte_support », sur ${points.length}. `
      + '*C\'est la donnée que la question de source de C5-L2 attend.*')
  }
}

// ── E. LE NETTOYAGE ─────────────────────────────────────────────────────────
async function nettoyer() {
  titre('E. Le nettoyage — tout ce que la recette a semé est retiré')
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
  note(`retiré : ${classeIds.length} classe(s) · ${exIds.length} instance(s) · ${depIds.length} dépôt(s)`)
}

// ── LE DÉROULÉ ──────────────────────────────────────────────────────────────
let interrompu = false
process.on('SIGINT', async () => { interrompu = true; await nettoyer(); process.exit(130) })

let decor = null
try {
  decor = await semer()
  const { ctx } = await laPorte(decor)
  await laTranche(decor, ctx)
  await laCouture(decor)
} catch (e) {
  dire(false, `INTERROMPU : ${e.message}`)
  console.error(e)
} finally {
  if (!interrompu) await nettoyer()
}

console.log(`\n${'═'.repeat(78)}`)
console.log(`RECETTE C5-L3 — ${ok} vert(s), ${ko} rouge(s).`)
if (!AVEC_CHAINE) console.log('⊘ jouée SANS `--avec-chaine` : la couture ③/④ n\'a pas été traversée.')
console.log('═'.repeat(78))
process.exit(ko > 0 ? 1 : 0)
