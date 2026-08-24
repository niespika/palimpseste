// ============================================================================
// RECETTE C4 · L9 — LA CONCEPTION DES EXAMENS DIAGNOSTIQUES, ÉPROUVÉE PAR
//                    REQUÊTE ET PAR LE MÊME CODE QUE LES ÉCRANS.
// ----------------------------------------------------------------------------
// « VÉRIFIÉ VEUT DIRE PAR REQUÊTE ET À L'ÉCRAN, PAS SUPPOSÉ. »     — le fait quand
//
// Ce script appelle LE MÊME CODE QUE LES DEUX ÉCRANS — le chargeur, le geste de
// conception, la lecture inverse, le signal de l'élève —, avec le client admin.
// Il ne rejoue pas les tests purs (`utils/examens/examens.test.ts`) : il éprouve
// LA MÉCANIQUE EN BASE.
//
//   A. le décor      — deux lignes de plan diagnostiques, UNE PAR MODULE
//   B. l'encart      — chacune s'affiche DANS SON MODULE, avec sa date
//   C. le refus      — un texte sans référence validée, ET LE MOTIF LA NOMME
//   D. la conception — un SUJET dans Codex, un TEXTE dans Aletheia
//   E. les deux se retrouvent — PAR REQUÊTE, DANS LES DEUX SENS
//   F. la `forme` vaut `sommatif` — LÀ OÙ LA CHAÎNE LA LIT, pas sur `exercices`
//   G. le claim      — deux conceptions sur la même ligne : la seconde perd
//   H. le flux de C4-L4 prend l'instance — SANS UNE LIGNE DE CHANGEMENT
//   I. le signal de l'élève — sur un dépôt RÉELLEMENT OUVERT par le professeur
//   J. les deux examens de la semaine 1 — un par module, et la garde du plan
//   K. le nettoyage  — tout ce que la recette a semé est retiré
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/examens-c4l9.mjs [--garde-le-decor]
//
// `--garde-le-decor` saute le nettoyage (K), pour aller voir À L'ÉCRAN ce que
// les étapes B, D et I ont produit — le « fait quand » l'exige pour le signal.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = '/Users/louissagnieres/Documents/GitHub/palimpseste'
const { examensAConcevoir, instancesParLigne } = await import(`${RACINE}/utils/examens/plan.ts`)
const { chargerConception, concevoirExamenDiagnostique, retirerExamenDiagnostique } =
  await import(`${RACINE}/utils/examens/conception.ts`)
const { signauxDeLancement } = await import(`${RACINE}/utils/examens/signal.ts`)
const { MODES_MESURES, CODE_TYPE } = await import(`${RACINE}/utils/examens/types.ts`)
const { ouvrirLesDepots } = await import(`${RACINE}/utils/passation/depots.ts`)
const { offreSeJuger, lirePerimetre } = await import(`${RACINE}/utils/passation/metacognition.ts`)
const { lireLesPortes } = await import(`${RACINE}/utils/passation/acces.ts`)
const { chargerVueEleve } = await import(`${RACINE}/utils/passation/vues.ts`)
const { lireContexte } = await import(`${RACINE}/utils/chaine/contexte.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const GARDE_LE_DECOR = process.argv.includes('--garde-le-decor')
const MARQUE = 'RECETTE C4-L9'

// ⚠️ LES INTERRUPTEURS RESTENT À OFF — la recette les bascule le temps d'une
//    vérification, et les REMET, ce qu'elle re-constate par requête à la fin.
//    Sans cela, un lot laisserait une porte ouverte derrière lui.
const poserPortes = async (exercices, passation) => {
  const { data } = await admin.from('scriptorium_params').select('id').limit(1).maybeSingle()
  await admin.from('scriptorium_params')
    .update({ exercices_actif: exercices, passation_classe_actif: passation }).eq('id', data.id)
}

let ok = 0, ko = 0
const dit = (v, quoi, detail = '') => {
  if (v) { ok++; console.log(`  ✓ ${quoi}${detail ? ` — ${detail}` : ''}`) }
  else { ko++; console.log(`  ✗ ${quoi}${detail ? ` — ${detail}` : ''}`) }
}
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 68 - t.length))}`)

// ⚠️ JSONB NE CONSERVE PAS L'ORDRE DES CLÉS : comparer deux `JSON.stringify`
//    ferait échouer une valeur pourtant identique. On compare le CONTENU.
const memesModes = (a, b) => {
  const ca = Object.keys(a ?? {}).sort(), cb = Object.keys(b ?? {}).sort()
  return ca.length === cb.length && ca.every((k, i) => k === cb[i])
    && ca.every((k) => JSON.stringify([...(a[k] ?? [])].sort())
                    === JSON.stringify([...(b[k] ?? [])].sort()))
}

// ═══════════════════════════════════════════════════════════════════════════
// A. LE DÉCOR — deux lignes de plan diagnostiques, UNE PAR MODULE
// ═══════════════════════════════════════════════════════════════════════════
titre('A. le décor')

const { data: plans } = await admin
  .from('scriptorium_plans_evaluation')
  .select('id, classe_id, classes(nom, statut)')
  .eq('statut', 'valide').is('supprime_at', null).limit(1)
const plan = plans?.[0]
if (!plan) {
  console.error('✗ Aucun plan d’évaluation VALIDÉ : la recette ne peut pas s’exécuter. '
    + 'Le plan préexiste, ce lot ne le construit pas.')
  process.exit(2)
}
console.log(`  plan ${plan.id} · classe ${plan.classes?.nom ?? plan.classe_id}`)

// Le lundi de la semaine 1 pour ce décor : un lundi passé, pour éprouver AUSSI
// le drapeau « en retard ». (Il ne se pose pas, il se LIT — cf. étape B.)
const lundi = (() => {
  const d = new Date(); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - 7)
  return d.toISOString().slice(0, 10)
})()

// ⚠️ CE QUE LA RECETTE SÈME ICI EST DU PLAN, ET LE PLAN N'EST PAS CE LOT : il
//    préexiste (`plan_evaluation_phase_a.sql`), et son écran de conception est
//    ailleurs (`GrillePlan.tsx`, « ＋ Ajouter un exercice… »). On écrit donc ce
//    que cet écran écrit, EXACTEMENT — la typologie est une liste FERMÉE de
//    couples (`exercices_typologie_chk`), rien ne s'y invente.
// ⭐ `origine = 'diagnostic'` + `fenetre_diagnostique = 'septembre'` : c'est la
//    forme réelle de la SEMAINE 1, et c'est elle que `uk_exercices_diagnostic`
//    garde (étape J).
const LIGNES = [
  { module: 'codex', type_exercice: 'ecriture', nature: 'evaluatif', lieu: 'classe' },
  { module: 'aletheia', type_exercice: 'lecture', nature: 'evaluatif', lieu: 'classe' },
]
const semees = []
for (const l of LIGNES) {
  const { data, error } = await admin.from('scriptorium_exercices_planifies').insert({
    plan_id: plan.id, ...l, diagnostique: true, ancrage: 'semaine',
    semaine_lundi: lundi, jour_prevu: null,
    fenetre_diagnostique: 'septembre', origine: 'diagnostic',
    statut: 'a_concevoir', note: MARQUE,
  }).select('id').single()
  if (error) {
    console.error(`✗ ligne de plan ${l.module} : ${error.message}`)
    console.error('  (une ligne diagnostique de la même fenêtre existe peut-être déjà : '
      + '`uk_exercices_diagnostic` n’en admet qu’une par plan × fenêtre × type.)')
    process.exit(2)
  }
  semees.push({ ...l, planifieId: data.id })
  console.log(`  semé : ligne de plan ${l.module} · ${data.id}`)
}

// ═══════════════════════════════════════════════════════════════════════════
// B. L'ENCART — chacune s'affiche DANS SON MODULE, avec sa date et son retard
// ═══════════════════════════════════════════════════════════════════════════
titre('B. « le professeur voit ce qu’il a à concevoir, dans son module »')

for (const s of semees) {
  const liste = await examensAConcevoir(admin, s.module)
  const mien = liste.find((e) => e.planifieId === s.planifieId)
  dit(!!mien, `la ligne ${s.module} s’affiche dans ${s.module}`)
  dit(mien?.echeance === lundi, 'avec SA DATE, lue à la ligne de plan',
    `échéance ${mien?.echeance} (lundi de la semaine, jour non calé)`)
  dit(mien?.enRetard === true, 'et son drapeau de retard, calculé — jamais saisi')
  dit(mien?.fenetre === 'septembre', 'la fenêtre diagnostique suit')
  dit(mien?.exerciceId === null, 'aucune instance encore : la lecture inverse est vide')

  const autre = s.module === 'codex' ? 'aletheia' : 'codex'
  const chezLautre = await examensAConcevoir(admin, autre)
  dit(!chezLautre.some((e) => e.planifieId === s.planifieId),
    `⭐ et elle NE s’affiche PAS dans ${autre} — chacun conçoit le sien`)
}

// ═══════════════════════════════════════════════════════════════════════════
// C. LE REFUS — un texte sans référence validée, ET LE MOTIF LA NOMME
// ═══════════════════════════════════════════════════════════════════════════
titre('C. « une référence non validée n’entre jamais en Phase 2 »')

const ligneAletheia = semees.find((s) => s.module === 'aletheia')
const ecranA = await chargerConception(admin, ligneAletheia.planifieId)
dit(!!ecranA, 'l’écran de conception charge')
dit(ecranA?.matiere === 'texte', 'dans Aletheia, le professeur choisit un TEXTE')

const refusables = (ecranA?.choix ?? []).filter((c) => c.refus !== null)
const servables = (ecranA?.choix ?? []).filter((c) => c.refus === null)
dit(refusables.length > 0, 'au moins un texte est refusable', `${refusables.length} refusable(s)`)
if (refusables.length > 0) {
  const r = refusables[0]
  dit(/référence/i.test(r.refus), '⭐ LE MOTIF NOMME LA RÉFÉRENCE', r.refus.slice(0, 110) + '…')
  // Et le geste refuse pour de bon, pas seulement à l'affichage : un écran
  // n'est pas une garde.
  const tente = await concevoirExamenDiagnostique(
    admin, ligneAletheia.planifieId, r.id, 'peu importe', { seJuger: true, confianceRemise: true })
  dit(tente.ok === false, '⭐ et LE GESTE REFUSE AUSSI — un écran n’est pas une garde')
  dit(/référence/i.test(tente.message ?? ''), 'son message nomme la référence lui aussi')
  const { count } = await admin.from('exercices')
    .select('id', { count: 'exact', head: true })
    .eq('exercice_planifie_id', ligneAletheia.planifieId)
  dit((count ?? 0) === 0, 'et RIEN n’a été écrit : aucune instance ne reste derrière le refus')
  const { data: apres } = await admin.from('scriptorium_exercices_planifies')
    .select('statut').eq('id', ligneAletheia.planifieId).maybeSingle()
  dit(apres?.statut === 'a_concevoir', 'la ligne de plan est restée « à concevoir »')
}
dit(servables.length > 0, 'au moins un texte est servable (référence validée)',
  `${servables.length} servable(s)`)

// ═══════════════════════════════════════════════════════════════════════════
// D. LA CONCEPTION — un SUJET dans Codex, un TEXTE dans Aletheia
// ═══════════════════════════════════════════════════════════════════════════
titre('D. la conception — et AUCUNE date n’est demandée')

const conçus = []
for (const s of semees) {
  const ecran = await chargerConception(admin, s.planifieId)
  const servable = (ecran?.choix ?? []).find((c) => c.refus === null)
  if (!servable) {
    dit(false, `${s.module} : aucun matériau servable`,
      s.module === 'codex'
        ? 'déposez un sujet dont la `forme` est admise par le type'
        : 'validez une référence décomposée')
    continue
  }
  const issue = await concevoirExamenDiagnostique(
    admin, s.planifieId, servable.id, servable.consigne,
    { seJuger: true, confianceRemise: true })
  dit(issue.ok === true, `${s.module} : l’examen se conçoit`, issue.ok ? '' : issue.message)
  if (!issue.ok) continue
  conçus.push({ ...s, exerciceId: issue.data.exerciceId, classeId: issue.data.classeId })

  const { data: ex } = await admin.from('exercices')
    .select('lieu, statut, cran, genre, paire_diagnostic, bonus, modes_par_competence, '
      + 'exercice_planifie_id, classe_id, reference_id, materiau_source_provenance, '
      + 'materiau_source_sujet_id, materiau_source_texte_id, optin_se_juger, '
      + 'optin_confiance_remise, fenetre_debut, fenetre_fin, borne_amont, '
      + 'exercices_types(code, nature)')
    .eq('id', issue.data.exerciceId).single()

  dit(ex.lieu === 'classe', '⭐ l’instance porte `lieu = classe` — c’est lui qui commande')
  dit(ex.statut === 'concu', 'son statut vaut `concu`')
  dit(ex.exercices_types.code === CODE_TYPE[s.module], 'son type est le bon',
    ex.exercices_types.code)
  dit(ex.exercices_types.nature === 'complet', 'de nature `complet` — une copie entière')
  dit(ex.cran === null, '⚠️ SANS CRAN — un cran faux ferait dériver le régime v1/vf et la durée')
  dit(ex.genre === null, '⚠️ sans `genre` — l’élection ne vaut que pour les objets terminaux')
  dit(ex.paire_diagnostic === false, '⚠️ sans `paire_diagnostic` — c’est le GESTE `diagnostiquer`')
  dit(ex.bonus === false, 'sans `bonus`')
  dit(ex.fenetre_debut === null && ex.fenetre_fin === null,
    '⭐ SANS FENÊTRE : l’écran n’a demandé AUCUNE date')
  dit(ex.borne_amont === null, 'sans `borne_amont` — un examen est HORS ROUTAGE')
  dit(ex.classe_id === plan.classe_id, 'la classe est celle DU PLAN, jamais choisie ici')
  dit(memesModes(ex.modes_par_competence, MODES_MESURES[s.module]),
    '⭐ `modes_par_competence` = l’arrêté du `01-` §10, recopié',
    JSON.stringify(ex.modes_par_competence))
  dit(ex.optin_se_juger === true && ex.optin_confiance_remise === true,
    '⭐ les DEUX drapeaux d’opt-in de classe sont posés')
  if (s.module === 'codex') {
    dit(ex.materiau_source_provenance === 'sujet' && !!ex.materiau_source_sujet_id,
      'le matériau est un SUJET, en provenance `sujet`')
    dit(ex.reference_id === null, 'et il ne porte aucune référence')
  } else {
    dit(ex.materiau_source_provenance === 'texte_auteur' && !!ex.materiau_source_texte_id,
      'le matériau est un TEXTE, en provenance `texte_auteur`')
    dit(!!ex.reference_id, '⭐ et il porte SA RÉFÉRENCE, celle qui est validée')
  }

  const { data: ligne } = await admin.from('scriptorium_exercices_planifies')
    .select('statut, concu_at').eq('id', s.planifieId).single()
  dit(ligne.statut === 'concu', '⭐ et LA LIGNE DE PLAN EST PASSÉE « CONÇUE »')
  dit(ligne.concu_at !== null, 'avec son horodatage')
}

// ═══════════════════════════════════════════════════════════════════════════
// E. « LES DEUX SE RETROUVENT L'UNE L'AUTRE » — par requête, DANS LES DEUX SENS
// ═══════════════════════════════════════════════════════════════════════════
titre('E. les deux se retrouvent — UNE SEULE COLONNE, DEUX LECTURES')

for (const c of conçus) {
  // Sens 1 : de l'INSTANCE vers la ligne, par `exercice_planifie_id`.
  const { data: versLaLigne } = await admin.from('exercices')
    .select('exercice_planifie_id').eq('id', c.exerciceId).single()
  dit(versLaLigne.exercice_planifie_id === c.planifieId,
    `${c.module} · de l’instance vers la ligne`, 'par `exercice_planifie_id`')
  // Sens 2 : de la LIGNE vers l'instance, par la lecture inverse.
  const inverse = await instancesParLigne(admin, [c.planifieId])
  dit(inverse.get(c.planifieId) === c.exerciceId,
    `${c.module} · de la ligne vers l’instance`, 'par la lecture inverse sur l’index unique')
}
// ⛔ Et AUCUNE colonne neuve n'est allée sur la ligne de plan.
const { data: colonnesPlan } = await admin.rpc('version').then(
  () => ({ data: null }), () => ({ data: null }))
void colonnesPlan
const { data: unePlanifiee } = await admin.from('scriptorium_exercices_planifies')
  .select('*').eq('id', semees[0].planifieId).single()
dit(!('exercice_id' in unePlanifiee),
  '⛔ AUCUN `exercice_id` n’a été posé sur la ligne de plan',
  'deux clés étrangères pour un lien = deux domiciles qui divergent')

// ═══════════════════════════════════════════════════════════════════════════
// F. LA `forme` VAUT `sommatif` — là où la chaîne la lit, pas sur `exercices`
// ═══════════════════════════════════════════════════════════════════════════
titre('F. la `forme` vaut `sommatif` — la seule preuve qui vaille')

// ⚠️ ELLE NE SE VÉRIFIE PAS EN LISANT `exercices` : LA `forme` N'Y EST PAS. Elle
//    se lit là où la chaîne l'ÉCRIT — `competences_mesures.forme` —, ou à défaut
//    en appelant le chemin de `utils/chaine/contexte.ts` sur l'instance. « Le
//    reste est une supposition sur du code qu'on n'a pas fait tourner. »
// ⚠️ TOUS LES INSCRITS ACTIFS, comme le fait l'assignation réelle
//    (`assignerALaClasse`, C4-L8) : « une ligne d'`exercices_depots` PAR ÉLÈVE,
//    créée DÈS L'ASSIGNATION » (§1.1). Un échantillon ne prouverait pas la même
//    chose — et l'élève de test doit en être, pour la vérification À L'ÉCRAN.
const { data: eleves } = await admin.from('inscriptions')
  .select('eleve_id').eq('classe_id', plan.classe_id).eq('statut', 'active')
const eleveIds = [...new Set((eleves ?? []).map((i) => i.eleve_id))]
dit(eleveIds.length > 0, 'la classe du plan porte au moins un élève inscrit',
  `${eleveIds.length} élève(s)`)

// Les dépôts naissent DÈS L'ASSIGNATION (`07-` §1.1) — l'assignation est le
// geste de C4-L8 (`assignerALaClasse`) ; on écrit ici EXACTEMENT ce qu'il écrit.
const deposes = []
for (const c of conçus) {
  const { data: dep, error } = await admin.from('exercices_depots').insert(
    eleveIds.map((eleveId) => ({
      eleve_id: eleveId, exercice_id: c.exerciceId,
      origine: 'prof', assigne_at: new Date().toISOString(), statut: 'assigne',
    }))).select('id, eleve_id')
  if (error) { dit(false, `${c.module} : dépôts créés`, error.message); continue }
  await admin.from('exercices').update({ statut: 'assigne' }).eq('id', c.exerciceId)
  deposes.push({ ...c, depots: dep })
  dit(dep.length === eleveIds.length, `${c.module} : un dépôt par élève, dès l’assignation`,
    `${dep.length} dépôt(s)`)
}

for (const d of deposes) {
  const ctx = await lireContexte(admin, d.depots[0].id)
  dit(ctx.forme === 'sommatif',
    `⭐ ${d.module} · la \`forme\` vaut \`sommatif\``,
    'lue par le chemin de la chaîne, sur l’instance réelle')
  dit(ctx.lieu === 'classe', `${d.module} · et le \`lieu\` vaut \`classe\` — C'EST UNE ANCRE`)
  dit(ctx.cran === null, `${d.module} · la chaîne tolère l’absence de cran`)
  dit(memesModes(ctx.modesParCompetence, MODES_MESURES[d.module]),
    `${d.module} · elle lit l’arrêté du \`01-\` §10 sur l’instance`)
}

// ═══════════════════════════════════════════════════════════════════════════
// G. LE CLAIM — deux conceptions sur la même ligne : la seconde perd
// ═══════════════════════════════════════════════════════════════════════════
titre('G. « une ligne de plan ⇔ au plus une instance »')

const premier = conçus[0]
if (premier) {
  const ecran = await chargerConception(admin, premier.planifieId)
  dit(ecran?.empechement !== null,
    'l’écran dit que la ligne porte déjà son instance', ecran?.empechement ?? '')
  const servable = (ecran?.choix ?? []).find((c) => c.refus === null)
  const second = await concevoirExamenDiagnostique(
    admin, premier.planifieId, servable?.id ?? '', 'seconde tentative',
    { seJuger: false, confianceRemise: false })
  dit(second.ok === false, '⭐ et la SECONDE CONCEPTION PERD')
  const { count } = await admin.from('exercices')
    .select('id', { count: 'exact', head: true })
    .eq('exercice_planifie_id', premier.planifieId)
  dit((count ?? 0) === 1, 'une seule instance revendique cette ligne de plan')
}

// ═══════════════════════════════════════════════════════════════════════════
// H et I. LE FLUX DE C4-L4 PREND L'INSTANCE, ET L'ÉLÈVE VOIT SON SIGNAL
// ═══════════════════════════════════════════════════════════════════════════
titre('H. le flux de C4-L4 prend l’instance — SANS UNE LIGNE DE CHANGEMENT')

for (const d of deposes) {
  // ⭐ L'OUVERTURE EST LE GESTE DU PROFESSEUR, PAS UNE LIGNE POSÉE À LA MAIN :
  //    on appelle `ouvrirLesDepots()` de C4-L4, tel quel.
  const issue = await ouvrirLesDepots(admin, d.exerciceId)
  dit(issue.ok === true, `${d.module} · \`ouvrirLesDepots\` accepte l’instance`,
    issue.ok ? `${issue.data.ouverts} dépôt(s) ouvert(s)` : issue.message)

  const vue = await chargerVueEleve(admin, d.depots[0].id, d.depots[0].eleve_id)
  dit(vue !== null, `${d.module} · \`chargerVueEleve\` rend une vue`)
  dit(vue?.ouvert === true, `${d.module} · le dépôt s’y voit OUVERT`)
  dit((vue?.consigne ?? '').length > 0, `${d.module} · l’élève lit sa consigne`,
    (vue?.consigne ?? '').split('\n')[0].slice(0, 60))
  if (d.module === 'aletheia') {
    dit((vue?.consigne ?? '').length > 200,
      '⭐ aletheia · LE TEXTE À EXPLIQUER EST DANS LA CONSIGNE',
      `${(vue?.consigne ?? '').length} caractères servis`)
  }
  dit(vue?.confiance?.servie === true,
    `${d.module} · la confiance de remise est SERVIE (le drapeau est levé)`)
}

// ═══════════════════════════════════════════════════════════════════════════
// H bis. ⭐ « SE JUGER » SE SERT SUR UN EXAMEN DIAGNOSTIQUE (C4-L9-bis)
// ═══════════════════════════════════════════════════════════════════════════
titre('H bis. « se juger » — le blocage de STRUCTURE est levé')

// ⚠️ DEUX CONDITIONS, ET UNE SEULE EST DE STRUCTURE. `offreSeJuger` exige
//    (1) un geste `produire` au grain `meso`/`macro` — c'est la STRUCTURE, et
//    c'est ce que C4-L9-bis répare — et (2) une compétence au statut `evaluee`,
//    qui est LA DÉCISION DU PROFESSEUR, posée à la fabrique.
// ⛔⛔ CE BLOC POSAIT UN STATUT PUIS LE RESTAURAIT. IL NE LE PEUT PLUS, ET IL NE
//     LE DOIT PLUS. Depuis `c4_statut_recette_global.sql`, le statut est GLOBAL
//     — UNE ligne par compétence — et le poser « le temps de la vérification »
//     changerait le statut POUR TOUS LES ÉLÈVES, pas pour les sept du décor.
//     Une recette ne décide pas à la place du professeur : elle LIT l'état.
// ⚠️  ET SES ASSERTIONS FIGEAIENT UN MONDE — « aucune compétence n'est
//     `evaluee` » — qui a pris fin le 23/08 : elles rendaient CINQ ROUGES sur un
//     système sain. On assère désormais LA RÈGLE, vraie dans les deux mondes :
//     « se juger » se sert EXACTEMENT quand la compétence servie est `evaluee`,
//     et le refus, s'il y en a un, ne porte JAMAIS sur le geste ni sur le grain
//     (c'est ce que C4-L9-bis a réparé, et c'est ce qui doit tenir).
const { data: statutsGlobaux } = await admin.from('competences_statut_recette')
  .select('competence, statut_recette')
const evaluees = new Set((statutsGlobaux ?? [])
  .filter((x) => x.statut_recette === 'evaluee').map((x) => x.competence))
console.log(`  (compétences \`evaluee\` en base : ${[...evaluees].join(', ') || 'AUCUNE'})`)

for (const d of deposes) {
  const offre = await offreSeJuger(admin, d.depots[0].id)
  // LA RÈGLE, dans les deux sens : servie ⟺ la compétence servie est `evaluee`.
  dit(offre.servie === (offre.competence != null && evaluees.has(offre.competence)),
    `⭐ ${d.module} · « SE JUGER » SE SERT EXACTEMENT quand la compétence l'est`,
    `servie=${offre.servie} · compétence=${offre.competence} · ${offre.motif ?? ''}`)
  // ⭐ CE QUI COMPTE, ET QUI VAUT DANS LES DEUX MONDES : quand ça refuse, le
  //    motif ne porte NI sur le geste NI sur le grain — c'est C4-L9-bis.
  dit(offre.servie || !/sans cran|geste .produire./.test(offre.motif ?? ''),
    `⭐ ${d.module} · un refus ne porte JAMAIS sur le geste ni sur le grain`,
    (offre.motif ?? '').slice(0, 90))
  if (!offre.servie) {
    console.log(`  · ${d.module} : « se juger » ne se sert pas — le reste de la forme ne se `
      + 'vérifie pas sur une offre absente.')
    continue
  }
  dit(offre.questions.length === 2,
    `⭐ ${d.module} · DEUX questions, jamais trois (\`02-\` §5, en classe)`,
    `${offre.questions.length} question(s)`)
  dit(offre.questions.every((q) => (q.reponses?.length ?? 0) > 0),
    `${d.module} · chacune avec sa liste FERMÉE de réponses`)
  dit(!!offre.version, `${d.module} · et la version de la fiche qui les a déposées`,
    String(offre.version))
  const p = await lirePerimetre(admin, d.depots[0].id)
  dit(p?.geste === 'produire', `⭐ ${d.module} · le geste dérivé vaut \`produire\``)
  dit(p?.grain === 'macro', `⭐ ${d.module} · et le grain STOCKÉ vaut \`macro\``)
  dit(p?.cranCode === null, `${d.module} · toujours SANS CRAN — rien n'a été inventé`)
}

// ⭐ ET LA DURÉE FANTÔME NE NAÎT PAS : sans cran, aucune ligne de durée.
const { count: dureesFantomes } = await admin.from('exercices_types_crans')
  .select('id', { count: 'exact', head: true })
  .in('type_id', await (async () => {
    const { data } = await admin.from('exercices_types').select('id').eq('nature', 'complet')
    return (data ?? []).map((x) => x.id)
  })())
dit((dureesFantomes ?? 0) === 0,
  '⭐ AUCUNE durée ne peut naître : `exercices_types_crans` ne porte aucune ligne pour ces types')

// ⛔ LA REMISE DES STATUTS A DISPARU AVEC LA POSE : il n'y a plus rien à
//    remettre, puisqu'on ne pose plus rien. C'est la meilleure garantie que
//    « la recette ne décide pas à la place du professeur » — elle n'écrit pas.
const { data: statutsApres } = await admin.from('competences_statut_recette')
  .select('competence, statut_recette')
dit(JSON.stringify(statutsApres) === JSON.stringify(statutsGlobaux),
  '⭐ LES STATUTS DE RECETTE N\'ONT PAS BOUGÉ — la recette ne les touche plus du tout')

titre('I. « au lancement, l’élève voit son signal, et entre par son module »')

// ⭐ D'ABORD PORTES FERMÉES : le signal est INERTE, jamais à moitié.
for (const d of deposes) {
  const rien = await signauxDeLancement(admin, d.depots[0].eleve_id, d.module)
  dit(rien.length === 0,
    `⭐ ${d.module} · portes FERMÉES, AUCUN signal — un lien vers une page close serait un piège`)
}

await poserPortes(true, true)
console.log('  (les deux portes élève sont ouvertes le temps de la vérification)')

for (const d of deposes) {
  const eleveId = d.depots[0].eleve_id
  const signaux = await signauxDeLancement(admin, eleveId, d.module)
  const mien = signaux.find((s) => s.depotId === d.depots[0].id)
  dit(!!mien, `${d.module} · le signal se lève pour l’élève`)
  dit(mien?.href === `/eleve/modules/${d.module}/passation/${d.depots[0].id}`,
    `⭐ ${d.module} · et il entre PAR SON MODULE`, mien?.href ?? '')
  dit(!!mien?.ouvertLe, 'le signal porte l’instant du geste du professeur')

  const autre = d.module === 'codex' ? 'aletheia' : 'codex'
  const chezLautre = await signauxDeLancement(admin, eleveId, autre)
  dit(!chezLautre.some((s) => s.depotId === d.depots[0].id),
    `⭐ ${d.module} · et il NE fuit PAS dans ${autre}`)
}

// Le signal s'éteint à la remise : il ouvre l'entrée, il ne suit pas le déroulé.
if (deposes.length > 0) {
  const d = deposes[0]
  await admin.from('exercices_depots').update({ statut: 'v1_remis' }).eq('id', d.depots[0].id)
  const apres = await signauxDeLancement(admin, d.depots[0].eleve_id, d.module)
  dit(!apres.some((s) => s.depotId === d.depots[0].id),
    'le signal s’éteint quand l’élève a remis — c’est un LANCEMENT, pas un suivi')
  await admin.from('exercices_depots').update({ statut: 'ouvert' }).eq('id', d.depots[0].id)
}

// ⭐ ET ON REFERME — puis on le CONSTATE, on ne le suppose pas.
await poserPortes(false, false)
const portes = await lireLesPortes(admin)
dit(!portes.exercicesActifs && !portes.passationActive,
  '⭐ les deux portes élève sont REFERMÉES, re-constatées par requête')

// ═══════════════════════════════════════════════════════════════════════════
// J. LES DEUX EXAMENS DE LA SEMAINE 1 — un par module, et la garde du plan
// ═══════════════════════════════════════════════════════════════════════════
titre('J. « les deux examens de la semaine 1 sont montés, un par module »')

dit(conçus.length === 2, 'DEUX examens conçus', conçus.map((c) => c.module).join(' + '))
dit(new Set(conçus.map((c) => c.module)).size === 2, 'un par module, jamais deux du même')

// ✓ LA GARANTIE EST DÉJÀ AU PLAN, ET ON S'EN SERT COMME D'UNE PREUVE, PAS D'UN
//   CHANTIER : `uk_exercices_diagnostic` — unique sur (plan_id,
//   fenetre_diagnostique, type_exercice) where origine = 'diagnostic' — admet
//   EXACTEMENT une ligne d'écriture et une de lecture par fenêtre.
const { error: eDouble } = await admin.from('scriptorium_exercices_planifies').insert({
  plan_id: plan.id, type_exercice: 'ecriture', diagnostique: true, nature: 'evaluatif',
  lieu: 'classe', module: 'codex', ancrage: 'semaine', semaine_lundi: lundi,
  fenetre_diagnostique: 'septembre', origine: 'diagnostic', statut: 'a_concevoir', note: MARQUE,
})
dit(eDouble?.code === '23505',
  '⭐ une SECONDE écriture diagnostique de septembre est refusée PAR LE PLAN',
  '`uk_exercices_diagnostic` — rien à construire pour ça')

// ═══════════════════════════════════════════════════════════════════════════
// K. LE NETTOYAGE — tout ce que la recette a semé est retiré
// ═══════════════════════════════════════════════════════════════════════════
if (GARDE_LE_DECOR) {
  titre('K. le nettoyage — SAUTÉ (--garde-le-decor)')
  console.log('  Le décor reste en base pour la vérification À L’ÉCRAN.')
  console.log('  Lignes de plan semées : ' + semees.map((s) => s.planifieId).join(', '))
  console.log('  Instances conçues     : ' + conçus.map((c) => c.exerciceId).join(', '))
  console.log('  Pour nettoyer : rejouer ce script sans `--garde-le-decor` ne suffira pas '
    + '(les lignes existent déjà) — retirer à la main, dans cet ordre : dépôts, instances, '
    + 'lignes de plan.')
} else {
  titre('K. le nettoyage')
  // L'ORDRE COMPTE : `exercices → scriptorium_exercices_planifies` est en
  // `on delete restrict`. Les dépôts partent en cascade avec leur instance.
  for (const c of conçus) {
    // Le CHEMIN INVERSE d'abord, tant que le lien pointe encore : la ligne de
    // plan revient `a_concevoir`, sinon son statut `concu` resterait obsolète.
    // (`retirerExamenDiagnostique` refuse une instance `assigne` — à raison ;
    //  la recette a assigné, elle défait donc dans le même ordre.)
    await admin.from('exercices_depots').delete().eq('exercice_id', c.exerciceId)
    await admin.from('exercices').update({ statut: 'concu' }).eq('id', c.exerciceId)
    const issue = await retirerExamenDiagnostique(admin, c.exerciceId)
    dit(issue.ok === true, `${c.module} · l’instance est retirée et la ligne revient`,
      issue.ok ? '' : issue.message)
  }
  for (const s of semees) {
    const { error } = await admin.from('scriptorium_exercices_planifies')
      .delete().eq('id', s.planifieId)
    dit(!error, `${s.module} · la ligne de plan semée est retirée`, error?.message ?? '')
  }
  // ⚠️ VÉRIFIÉ PAR REQUÊTE, jamais sur la foi des retours ci-dessus.
  const { count: resteLignes } = await admin.from('scriptorium_exercices_planifies')
    .select('id', { count: 'exact', head: true }).eq('note', MARQUE)
  dit((resteLignes ?? 0) === 0, '⭐ AUCUNE trace de la recette dans le plan')
  const { count: resteEx } = await admin.from('exercices')
    .select('id', { count: 'exact', head: true })
    .in('exercice_planifie_id', semees.map((s) => s.planifieId))
  dit((resteEx ?? 0) === 0, '⭐ AUCUNE instance de la recette ne reste')
}

titre('les six interrupteurs, re-constatés — comme les quatre lots joués avant')
const { data: gates } = await admin.from('scriptorium_params')
  .select('exercices_actif, routeur_actif, competences_affichage_actif, fabrique_actif, '
    + 'chaine_actif, passation_classe_actif').eq('id', 1).single()
for (const [nom, v] of Object.entries(gates)) dit(v === false, `\`${nom}\` est à OFF`)

console.log(`\n${'═'.repeat(72)}`)
console.log(`RECETTE C4-L9 — ${ok} vérification(s) passée(s), ${ko} en échec.`)
console.log('═'.repeat(72))
process.exit(ko === 0 ? 0 : 1)
