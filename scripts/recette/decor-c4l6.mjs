// ============================================================================
// DÉCOR C4 · L6 — DES EXERCICES DE MAISON POUR DEUX ÉLÈVES NOMMÉS.
// ----------------------------------------------------------------------------
// « L'élève trouve SON EXERCICE À FAIRE sous Exercices. »      — `07-` §2, C4-L6
//
// Ce script n'éprouve rien : il SÈME le décor que la recette de C4-L6 réclame,
// et il le RETIRE. Les deux restes de recette qu'il débloque sont C4L6-12 (la
// porte du déroulé, franchie avec des données réelles) et C4L6-13 (le filtre de
// classe sur un bi-classe).
//
// ⚠️ `consigne_instanciee` est du JSONB, et `ilike` n'existe pas dessus —
//    « operator does not exist: jsonb ~~* unknown ». Le repli par la marque lit
//    donc les instances et FILTRE EN JS, en PAGINANT : supabase-js plafonne
//    toute réponse à MILLE LIGNES SANS RIEN SIGNALER, et un repli qui ne voit
//    que les mille premières laisserait passer ce qu'il est censé rattraper.
//
// ⚠️ CE N'EST PAS UNE MIGRATION, et il n'y a rien à écrire au `SUIVI_SQL.md` :
//    aucun DDL, aucune colonne, aucune garde. Des LIGNES DE DONNÉES, semées par
//    le client admin, et retirables.
//
// ⚠️ LES ÉLÈVES SONT DES `profiles` EXISTANTS, JAMAIS ÉCRITS. On ne crée aucun
//    compte, on ne touche à aucun profil : on leur pose des dépôts, c'est tout.
//    C'est la discipline de `deroule-c4l3.mjs`, reprise telle quelle.
//
// ⚠️ LA CLASSE EST LEUR VRAIE CLASSE, et c'est le but : la liste de l'onglet est
//    bornée par la classe en contexte (`01-` §2, « dans les modules on reste par
//    classe »). Une classe de recette ne prouverait rien de ce filtre-là.
//
// ⭐ L'INTERRUPTEUR EST REMIS COMME TROUVÉ, TOUJOURS. La liste de l'onglet naît
//    derrière `exercices_actif` — un lien qui mènerait à une page fermée est un
//    lien qui promet une porte close. `--ouvre` le bascule pour la durée du
//    smoke ; `--retire` le remet à ce qu'il était. **Rouvrir la porte reste un
//    geste du professeur** : sans `--ouvre`, ce script n'y touche pas.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/decor-c4l6.mjs --seme [--ouvre] [--eleves=Elo,Alice]
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/decor-c4l6.mjs --synthese
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/decor-c4l6.mjs --examen
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/decor-c4l6.mjs --retire
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/decor-c4l6.mjs --etat
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/decor-c4l6.mjs --biclasse
//
// ⚠️ `--biclasse` APPELLE LE CODE DE L'ÉCRAN (`exercicesMaisonDeLEleve`), qui
//    porte `import 'server-only'` : il lui faut le résolveur de calibration,
//    comme aux quatre recettes. Les trois autres gestes s'en passent.
// ============================================================================

import { register } from 'node:module'

// ── La cale de résolution des sous-chemins `next/…` ─────────────────────────
// `utils/deroule/acces.ts` — que `liste.ts` lit pour sa porte — importe
// `next/navigation` (pour `redirect`) et `@/utils/supabase/server` (qui importe
// `next/headers`). Hors de Next, Node exige l'extension : `next/navigation`
// n'existe pas, `next/navigation.js` oui. Les deux hooks de
// `register-calibration-resolver.mjs` ne couvrent que les imports RELATIFS et
// l'alias `@/…` ; celui-ci complète, et lui seul. *Copié de
// `deroule-c4l3.mjs`, où il est né — et pour la même raison.*
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

import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'


const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = 'DECOR-C4L6'
/** Le registre de ce qui a été semé — le retrait ne devine rien, il le relit. */
const REGISTRE = '.decor-c4l6.json'

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1]
const a = (n) => process.argv.includes(`--${n}`)
const NOMS = (arg('eleves') ?? 'Elo,Alice').split(',').map((s) => s.trim()).filter(Boolean)

const dire = (t) => console.log(`  ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 66 - t.length))}`)

/** supabase-js NE LÈVE PAS : il rend `{ error }`. Ici, on lève. */
function verifie(where, { data, error }) {
  if (error) throw new Error(`${where} — ${error.code ?? ''} ${error.message}`)
  return data
}

/**
 * Les instances qui portent la marque — LUES EN PAGINANT, FILTRÉES EN JS.
 * ⚠️ Pagination + tri sur une clé unique + confrontation au `count: 'exact'` :
 *    la discipline maison contre le plafond silencieux de mille lignes.
 */
async function instancesMarquees() {
  const PAGE = 500
  const out = []
  let de = 0
  for (;;) {
    const { data, error, count } = await admin.from('exercices')
      .select('id, consigne_instanciee', { count: 'exact' })
      .order('id').range(de, de + PAGE - 1)
    if (error) throw new Error(`instances — ${error.code} ${error.message}`)
    for (const e of data ?? []) {
      if (JSON.stringify(e.consigne_instanciee ?? '').includes(MARQUE)) out.push(e.id)
    }
    de += (data ?? []).length
    if ((data ?? []).length < PAGE || de >= (count ?? 0)) break
  }
  return out
}

let dernier = 0
const instant = () => {
  const t = Math.max(Date.now(), dernier + 1)
  dernier = t
  return new Date(t).toISOString()
}

/** J+n en date pure, pour une échéance. */
const dansNJours = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

// ════════════════════════════════════════════════════════════════════════════

async function lireInterrupteurs() {
  return verifie('scriptorium_params', await admin.from('scriptorium_params')
    .select('id, exercices_actif').limit(1).maybeSingle())
}

async function poserExercicesActifs(actif) {
  const p = await lireInterrupteurs()
  if (!p) throw new Error('`scriptorium_params` est vide.')
  verifie('bascule exercices_actif', await admin.from('scriptorium_params')
    .update({ exercices_actif: actif }).eq('id', p.id).select('id'))
}

async function semer() {
  titre('Le décor — semé pour des élèves NOMMÉS, dans LEUR classe')

  const type = verifie('type `argument`', await admin.from('exercices_types')
    .select('id, code, grain').eq('code', 'argument').maybeSingle())
  if (!type) throw new Error('type `argument` introuvable — le seed de C4-L1 manque.')
  dire(`type réutilisé : \`${type.code}\` (${type.grain}) — aucun type n'est créé`)

  const profils = verifie('profils', await admin.from('profiles')
    .select('id, display_name').eq('role', 'eleve').in('display_name', NOMS))
  for (const n of NOMS) {
    if (!profils.some((p) => p.display_name === n)) throw new Error(`élève « ${n} » introuvable.`)
  }

  // La classe en contexte de chaque élève : la liste de l'onglet est bornée par
  // elle, et c'est ce filtre qu'on veut voir jouer pour de vrai.
  const insc = verifie('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id, classes(nom)')
    .in('eleve_id', profils.map((p) => p.id)).eq('statut', 'active'))

  const registre = { exercices: [], depots: [], porteAvant: null }

  for (const p of profils) {
    const mienne = insc.filter((i) => i.eleve_id === p.id)
    if (mienne.length === 0) throw new Error(`« ${p.display_name} » n'a aucune inscription active.`)
    const classeId = mienne[0].classe_id
    const classeNom = mienne[0].classes?.nom ?? '?'
    dire(`${p.display_name} → classe « ${classeNom} »`
      + (mienne.length > 1 ? ` (⚠️ bi-classe : ${mienne.length} inscriptions)` : ''))

    // ── Trois exercices, trois ÉTATS — pour que la liste montre son tri.
    //    ⚠️ TOUS `lieu = 'maison'` et TOUS en `composer` : c'est ce couple qui
    //       les range sous Codex (`06-` §1 ; `01-` §2). Un exercice de classe
    //       irait sous l'onglet Examens, un exercice sans `composer` irait dans
    //       Aletheia — et ni l'un ni l'autre ne prouverait cette liste-ci.
    const lots = [
      { statut: 'assigne', echeance: dansNJours(3),
        consigne: `${MARQUE} — Peut-on se fier à ses sens ? Rédige un paragraphe qui pose une `
          + 'thèse, l’appuie sur une raison, et examine une objection.' },
      { statut: 'ouvert', echeance: dansNJours(6), ouvert: true,
        consigne: `${MARQUE} — « La liberté, c’est faire ce qu’on veut. » Rédige un paragraphe `
          + 'qui discute cette définition.' },
      { statut: 'assigne', echeance: null,
        consigne: `${MARQUE} — Rédige un paragraphe argumenté sur un sujet de ton choix, `
          + 'sans échéance : celui-ci se range en fin de liste.' },
    ]

    for (const l of lots) {
      const ex = verifie(`instance (${p.display_name})`, await admin.from('exercices').insert({
        type_id: type.id, classe_id: classeId, lieu: 'maison', statut: 'assigne',
        cran: '8', consigne_instanciee: l.consigne,  // cran 8 = production_autonome
        modes_par_competence: { expression: ['composer'], structure: ['composer'] },
      }).select('id').single())
      registre.exercices.push(ex.id)

      const d = verifie(`dépôt (${p.display_name})`, await admin.from('exercices_depots').insert({
        eleve_id: p.id, exercice_id: ex.id, origine: 'prof', statut: l.statut,
        assigne_at: instant(), echeance: l.echeance,
        ...(l.ouvert ? { ouvert_at: instant() } : {}),
      }).select('id').single())
      registre.depots.push(d.id)
    }
    dire(`  ↳ 3 exercices de maison semés (à faire · commencé · sans échéance)`)
  }

  if (a('ouvre')) {
    const avant = await lireInterrupteurs()
    registre.porteAvant = !!avant.exercices_actif
    await poserExercicesActifs(true)
    dire(`⚠️ \`exercices_actif\` OUVERT pour le smoke (il était à `
      + `${registre.porteAvant ? 'ON' : 'OFF'}) — \`--retire\` le remettra.`)
  } else {
    dire('`exercices_actif` NON touché — la liste restera vide tant qu’il est fermé. '
      + 'Relance avec `--ouvre` pour le smoke.')
  }

  writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))
  titre('Semé')
  dire(`${registre.exercices.length} instances · ${registre.depots.length} dépôts`)
  dire(`registre écrit dans ${REGISTRE} — c'est lui que \`--retire\` relit`)
}

async function retirer() {
  titre('Le retrait — tout ce que le décor a semé')
  if (!existsSync(REGISTRE)) {
    dire(`aucun registre (${REGISTRE}) : rien à retirer, ou décor semé ailleurs.`)
    dire('repli — on retire par la MARQUE, sur la consigne :')
  }
  const registre = existsSync(REGISTRE)
    ? JSON.parse(readFileSync(REGISTRE, 'utf8'))
    : { exercices: [], depots: [], porteAvant: null }

  // ⚠️ LES LIGNES DE PLAN sont du PLAN DU PROFESSEUR : elles partent en premier,
  //    et on ne touche QUE celles que ce décor a semées (registre + marque).
  if ((registre.lignesPlan ?? []).length > 0) {
    verifie('retrait des lignes de plan', await admin.from('scriptorium_exercices_planifies')
      .delete().in('id', registre.lignesPlan).eq('note', MARQUE).select('id'))
    dire(`${registre.lignesPlan.length} ligne(s) de plan retirée(s)`)
  }

  // ⭐ Les séances d'abord — `codex_travaux` part en cascade avec sa séance
  //    (`on delete cascade`), donc une seule suppression suffit.
  if ((registre.sessions ?? []).length > 0) {
    verifie('retrait des séances', await admin.from('codex_sessions')
      .delete().in('id', registre.sessions).select('id'))
    dire(`${registre.sessions.length} séance(s) retirée(s), travaux compris`)
  }

  // ⭐ Les dépôts D'ABORD : `exercices_depots.exercice_id` référence l'instance.
  if (registre.depots.length > 0) {
    verifie('retrait des dépôts', await admin.from('exercices_depots')
      .delete().in('id', registre.depots).select('id'))
  }

  // Repli par la marque — un décor semé sans registre se retrouve quand même.
  const orphelines = await instancesMarquees()
  const ids = [...new Set([...registre.exercices, ...orphelines])]
  if (ids.length > 0) {
    // Les dépôts d'une instance retrouvée par la marque partent avec elle.
    verifie('dépôts orphelins', await admin.from('exercices_depots')
      .delete().in('exercice_id', ids).select('id'))
    verifie('retrait des instances', await admin.from('exercices')
      .delete().in('id', ids).select('id'))
  }
  dire(`${ids.length} instance(s) retirée(s), dépôts compris`)

  if (registre.porteAvant !== null) {
    await poserExercicesActifs(registre.porteAvant)
    dire(`\`exercices_actif\` remis à ${registre.porteAvant ? 'ON' : 'OFF'} — comme trouvé`)
  }

  const reste = await instancesMarquees()
  dire(reste.length === 0
    ? `✓ aucune trace de ${MARQUE} ne survit`
    : `✗ ${reste.length} instance(s) survivent — à regarder`)
  if (existsSync(REGISTRE)) unlinkSync(REGISTRE)
}

async function etat() {
  titre(`L'état — ce que ${MARQUE} porte en base`)
  const ex = await instancesMarquees()
  dire(`${ex.length} instance(s)`)
  if (ex.length > 0) {
    // ⚠️ PAS D'EMBED SUR `profiles` : `exercices_depots` y a PLUS D'UNE relation
    //    (l'élève, et qui a corrigé) — PostgREST refuse de choisir (PGRST201).
    //    On lit les noms à part, ce qui est de toute façon plus lisible.
    const d = verifie('dépôts', await admin.from('exercices_depots')
      .select('id, statut, echeance, eleve_id').in('exercice_id', ex).order('id'))
    const noms = new Map((verifie('noms', await admin.from('profiles')
      .select('id, display_name').in('id', [...new Set(d.map((x) => x.eleve_id))]))
    ).map((p) => [p.id, p.display_name]))
    for (const x of d) {
      dire(`  ${noms.get(x.eleve_id) ?? x.eleve_id} · ${x.statut}`
        + ` · échéance ${x.echeance ?? '—'} · /eleve/modules/codex/exercice/${x.id}`)
    }
  }
  const reg = existsSync(REGISTRE) ? JSON.parse(readFileSync(REGISTRE, 'utf8')) : {}
  const lp = verifie('lignes de plan', await admin.from('scriptorium_exercices_planifies')
    .select('id, statut, semaine_lundi').eq('note', MARQUE))
  for (const x of lp) {
    dire(`  ligne de plan ${x.statut} · semaine du ${x.semaine_lundi}`
      + ` · /prof/codex/examen-diagnostique/${x.id}`)
  }
  if ((reg.sessions ?? []).length > 0) {
    const ses = verifie('séances', await admin.from('codex_sessions')
      .select('id, statut').in('id', reg.sessions))
    for (const x of ses) dire(`  séance ${x.statut} · /prof/codex/synthese/${x.id}`)
  }
  const p = await lireInterrupteurs()
  dire(`\`exercices_actif\` : ${p?.exercices_actif ? 'ON' : 'OFF'}`)
}

/**
 * ⭐ LE DÉCOR DE L'ENCART « EXAMENS DIAGNOSTIQUES À CONCEVOIR » (C4-L9).
 *
 * *« Le professeur voit ce qu'il a à concevoir, DANS SON MODULE. »* — `07-` §2
 *
 * ⚠️ `EncartAConcevoir` REND `null` SUR LISTE VIDE, et la liste était vide : le
 *    gate du plan est pourtant à ON *(l'écran affiche « Synthèses à préparer »)*
 *    — il n'existait simplement **aucune ligne de plan diagnostique
 *    `a_concevoir`**, les recettes retirant les leurs. *Une page nue n'était pas
 *    la preuve qu'il est cassé.*
 *
 * ⚠️ CE QU'ON ÉCRIT ICI EST DU PLAN, ET LE PLAN N'EST PAS CE LOT. Il préexiste,
 *    et son écran d'édition est ailleurs *(`GrillePlan.tsx`)*. On écrit donc ce
 *    que cet écran écrit, **exactement** : la typologie est une **liste fermée
 *    de couples** *(`exercices_typologie_chk`)* — `ecriture` × diagnostique ⇒
 *    Codex —, et rien ne s'y invente. *Patron repris de
 *    `scripts/recette/examens-c4l9.mjs`, section A.*
 *
 * ⚠️ `uk_exercices_diagnostic` N'ADMET QU'UNE LIGNE par plan × fenêtre × type :
 *    si une écriture diagnostique de septembre existe déjà, l'insert est refusé
 *    — et c'est la garde du plan qui parle, pas une panne.
 *
 * ⭐ LE LUNDI EST CELUI D'UNE SEMAINE PASSÉE, pour que le **drapeau de retard**
 *    se voie. Il ne se pose pas, il se **lit** — l'encart le calcule.
 */
async function examen() {
  titre('Le décor de l’encart — une ligne de plan diagnostique à concevoir')

  const plan = verifie('plan validé', await admin.from('scriptorium_plans_evaluation')
    .select('id, classe_id, classes(nom)')
    .eq('statut', 'valide').is('supprime_at', null).limit(1).maybeSingle())
  if (!plan) throw new Error('aucun plan d’évaluation VALIDÉ — le plan préexiste, ce décor ne le crée pas.')
  dire(`plan de la classe « ${plan.classes?.nom ?? plan.classe_id} »`)

  const lundi = (() => {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) - 7)
    return d.toISOString().slice(0, 10)
  })()

  const { data, error } = await admin.from('scriptorium_exercices_planifies').insert({
    // ⚠️ `module` est NOT NULL, et il ne se déduit pas de `type_exercice` : la
    //    ligne porte les deux. `examensAConcevoir` filtre sur `type_exercice`
    //    (`ecriture` ⇒ Codex) ; la colonne `module`, elle, est ce que l'écran du
    //    plan écrit. Les omettre l'un ou l'autre fait refuser l'insert.
    plan_id: plan.id, module: 'codex', type_exercice: 'ecriture',
    nature: 'evaluatif', lieu: 'classe',
    diagnostique: true, ancrage: 'semaine', semaine_lundi: lundi, jour_prevu: null,
    fenetre_diagnostique: 'septembre', origine: 'diagnostic',
    statut: 'a_concevoir', note: MARQUE,
  }).select('id').single()
  if (error) {
    throw new Error(`ligne de plan — ${error.code ?? ''} ${error.message}\n`
      + '  (une écriture diagnostique de septembre existe peut-être déjà : '
      + '`uk_exercices_diagnostic` n’en admet qu’une par plan × fenêtre × type.)')
  }

  const registre = existsSync(REGISTRE)
    ? JSON.parse(readFileSync(REGISTRE, 'utf8'))
    : { exercices: [], depots: [], porteAvant: null }
  registre.lignesPlan = [...(registre.lignesPlan ?? []), data.id]
  writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

  dire(`ligne semée · semaine du ${lundi} (passée → le retard doit s’afficher)`)
  dire('')
  dire('À voir depuis l’onglet Exercices :')
  dire('  1. /prof/codex → l’encart « Examens diagnostiques à concevoir · 1 »')
  dire(`  2. « Concevoir → » → /prof/codex/examen-diagnostique/${data.id}`)
  dire('  ⚠️ L’écran de conception vit derrière `fabrique_actif`, qui est à OFF :')
  dire('     il s’ouvrira en le disant. C’est le régime voulu, pas une panne.')
}

/**
 * ⭐ LE DÉCOR DE LA REVUE — « la revue complète d'une synthèse rendue » (`07-` §2).
 *
 * Ce n'est pas un chantier, c'est un PARCOURS à quatre écrans, et le lot est fait
 * quand il tient bout à bout SANS QUITTER L'ONGLET EXERCICES :
 *
 *    la liste → `synthese/<id>` (le tableau de la séance)
 *             → `travail/<id>/v1` (la V1 d'un élève)
 *             → `validation/<id>` (le retour, l'édition, la publication)
 *
 * ⚠️ IL FALLAIT DES DONNÉES POUR LE CLIQUER : la sandbox ne portait AUCUNE
 *    `codex_sessions`. Sans séance, pas de tuile de classe, pas de ligne, pas de
 *    tableau, pas de V1 — le parcours existait dans le code et rien ne
 *    l'alimentait.
 *
 * ⚠️ LA SÉANCE NAÎT `fermee`, ET C'EST LE POINT : la revue est ce que le
 *    professeur fait QUAND LES COPIES SONT RENDUES. Une séance en direct
 *    (`phase_1` / `phase_2`) montrerait le pilotage, pas la revue.
 *
 * ⚠️ LE BRAS BI-SOURCE : `codex_sessions_source_chk` veut `contenu_id` OU
 *    `scriptorium_unite_id`. On prend `contenu_id` — le chemin NOMINAL depuis le
 *    recâblage du 14/08 —, sur un contenu de type `cours` déjà en base.
 *
 * ⚠️ `photos_v1` / `photos_vf` NON VIDES, sans quoi les deux cellules du tableau
 *    ne sont pas cliquables : `StatutCellule` ne pose son lien que sur une
 *    version ENVOYÉE. Ce sont des chemins de décor, aucun fichier n'est déposé
 *    au bucket — les écrans de revue lisent le TEXTE OCR, pas les images.
 */
async function synthese() {
  titre('Le décor de la revue — une synthèse en classe RENDUE')

  const contenu = verifie('contenu', await admin.from('scriptorium_contenus')
    .select('id, titre').eq('type', 'cours').limit(1).maybeSingle())
  if (!contenu) throw new Error('aucun contenu de type `cours` en base.')

  const classe = verifie('classe', await admin.from('classes')
    .select('id, nom').eq('nom', 'Test').maybeSingle())
  if (!classe) throw new Error('classe « Test » introuvable.')

  const eleve = verifie('élève', await admin.from('profiles')
    .select('id, display_name').eq('display_name', NOMS[0]).maybeSingle())
  if (!eleve) throw new Error(`élève « ${NOMS[0]} » introuvable.`)

  const registre = existsSync(REGISTRE)
    ? JSON.parse(readFileSync(REGISTRE, 'utf8'))
    : { exercices: [], depots: [], porteAvant: null }

  const session = verifie('séance', await admin.from('codex_sessions').insert({
    classe_id: classe.id, contenu_id: contenu.id, statut: 'fermee',
    duree_phase_min: 25, lance_at: instant(), phase_2_at: instant(), ferme_at: instant(),
  }).select('id').single())

  const travail = verifie('travail', await admin.from('codex_travaux').insert({
    session_id: session.id, eleve_id: eleve.id,
    photos_v1: [`${MARQUE}/v1-page-01.jpg`],
    texte_v1_ocr: `${MARQUE} — V1. Les Lumières sont un mouvement du XVIIIe siècle qui met la `
      + 'raison au centre. Kant en donne une définition : la sortie de l’homme hors de sa '
      + 'minorité, dont il est lui-même responsable.',
    ocr_confiance_v1: 0.94,
    suggestions_v1: {
      oublis: [{ titre: 'La tolérance', detail: 'Le cours nomme la tolérance parmi les combats des Lumières ; elle n’apparaît pas.' }],
      erreurs: [{ type: 'imprécision', titre: 'Le siècle', detail: 'Le mouvement déborde le XVIIIe : préciser plutôt « des Lumières ».' }],
      ortho: null,
    },
    analyse_v1_statut: 'prete',
    photos_vf: [`${MARQUE}/vf-page-01.jpg`],
    texte_vf_ocr: `${MARQUE} — V-finale. Les Lumières sont un mouvement européen qui met la raison `
      + 'au centre et qui combat pour la tolérance. Kant en donne la définition la plus connue : '
      + 'la sortie de l’homme hors de sa minorité, dont il est lui-même responsable.',
    ocr_confiance_vf: 0.91,
    // ⚠️ LA FORME DE `retour_critique` N'EST PAS LIBRE — c'est `RetourCritique`
    //    (`app/prof/codex/validation/actions.ts`), et l'éditeur du professeur la
    //    rend champ par champ. Deux listes portent des OBJETS à clés fixes
    //    (`erreurs_corrections`, `suivi_suggestions`, `ajouts`), deux portent des
    //    CHAÎNES NUES (`pouvait_aller_plus_loin`, `non_ameliore`). Un décor qui
    //    s'en écarte fait tomber l'écran sur « Objects are not valid as a React
    //    child » — c'est arrivé, et c'était le décor, jamais l'écran.
    retour_critique: {
      erreurs_corrections: [{
        concept_tag: 'lumieres',
        description: 'La V1 bornait les Lumières au XVIIIe siècle.',
        correction: 'Le mouvement déborde le siècle : parler « des Lumières », pas du XVIIIe.',
        importance: 2,
      }],
      suivi_suggestions: [{
        suggestion: 'Ajouter la tolérance parmi les combats des Lumières',
        statut: 'suivie',
        commentaire: 'Reprise en V-finale, au bon endroit.',
      }],
      pouvait_aller_plus_loin: [
        'La définition de Kant est citée, jamais discutée : que veut dire « minorité » ici ?',
      ],
      non_ameliore: [],
      ajouts: [{ titre: 'La tolérance', contenu: 'Ajoutée en V-finale, absente de la V1.' }],
    },
    synthese_completee: `${MARQUE} — synthèse complétée (décor).`,
    analyse_vf_statut: 'prete',
    statut_validation: 'en_attente',
  }).select('id').single())

  registre.sessions = [...(registre.sessions ?? []), session.id]
  writeFileSync(REGISTRE, JSON.stringify(registre, null, 2))

  dire(`séance « ${contenu.titre} » · classe « ${classe.nom} » · statut FERMÉE`)
  dire(`travail de ${eleve.display_name} — V1 et V-finale envoyées, analyses PRÊTES, non validé`)
  dire('')
  dire('Le parcours, à cliquer depuis l’onglet Exercices :')
  dire(`  1. /prof/codex  → tuile « ${classe.nom} » → la ligne « ${contenu.titre} »`)
  dire(`  2. /prof/codex/synthese/${session.id}`)
  dire(`  3. colonne V1        → /prof/codex/travail/${travail.id}/v1`)
  dire(`  4. colonne V-finale  → /prof/codex/validation/${travail.id}`)
  dire('  · et « File de validation » doit maintenant porter le compte 1.')
}

/**
 * ⭐ LE FILTRE DE CLASSE, ÉPROUVÉ SUR UN VRAI BI-CLASSE — et par LE CODE DE
 *    L'ÉCRAN, jamais par une requête écrite pour l'occasion.
 *
 * *« Dans les modules on reste PAR CLASSE »* (`01-` §2) : un élève inscrit dans
 * deux classes ne doit JAMAIS voir sous ses onglets Codex le travail de l'autre.
 * Le décor sème un exercice DANS CHACUNE de ses classes, puis interroge la liste
 * une fois par classe en contexte — et retire tout, quoi qu'il arrive.
 */
async function biclasse() {
  titre('Le filtre de classe — sur un élève réellement BI-CLASSE')

  // ⚠️ IMPORT PARESSEUX, ET CE N'EST PAS UN DÉTAIL. `liste.ts` porte
  //    `import 'server-only'` et tire `next/navigation` : le charger AU NIVEAU
  //    SUPÉRIEUR le rendrait obligatoire pour LES QUATRE gestes — et `--retire`,
  //    celui qui remet la sandbox comme elle était, **échouerait** dès qu'on
  //    l'appelle sans le résolveur de calibration. Le geste de nettoyage ne doit
  //    dépendre de rien.
  const { exercicesMaisonDeLEleve } = await import('../../utils/codex-onglets/liste.ts')

  const insc = verifie('inscriptions', await admin.from('inscriptions')
    .select('eleve_id, classe_id, classes(nom)').eq('statut', 'active'))
  const parEleve = new Map()
  for (const i of insc) parEleve.set(i.eleve_id, [...(parEleve.get(i.eleve_id) ?? []), i])
  const [eleveId, ses] = [...parEleve.entries()].find(([, v]) => v.length > 1) ?? []
  if (!eleveId) { dire('aucun élève bi-classe en base — rien à éprouver.'); return }

  const nom = verifie('nom', await admin.from('profiles')
    .select('display_name').eq('id', eleveId).maybeSingle())?.display_name ?? eleveId
  dire(`${nom} · ${ses.map((i) => i.classes?.nom).join(' + ')}`)

  const type = verifie('type', await admin.from('exercices_types')
    .select('id').eq('code', 'argument').maybeSingle())
  const poses = []
  try {
    for (const i of ses) {
      const ex = verifie('instance', await admin.from('exercices').insert({
        type_id: type.id, classe_id: i.classe_id, lieu: 'maison', statut: 'assigne',
        cran: '8',  // production_autonome
        consigne_instanciee: `${MARQUE}-BICLASSE — exercice de « ${i.classes?.nom} ».`,
        modes_par_competence: { expression: ['composer'] },
      }).select('id').single())
      const d = verifie('dépôt', await admin.from('exercices_depots').insert({
        eleve_id: eleveId, exercice_id: ex.id, origine: 'prof', statut: 'assigne',
        assigne_at: instant(),
      }).select('id').single())
      poses.push({ exId: ex.id, depotId: d.id, classeId: i.classe_id, nom: i.classes?.nom })
    }

    let bon = true
    for (const p of poses) {
      // ⚠️ LE CODE DE L'ÉCRAN, avec cette classe en contexte.
      const liste = await exercicesMaisonDeLEleve(admin, eleveId, p.classeId)
      const miens = liste.filter((l) => poses.some((q) => q.depotId === l.depotId))
      const attendu = miens.length === 1 && miens[0].depotId === p.depotId
      bon = bon && attendu
      dire(`${attendu ? '✓' : '✗'} en contexte « ${p.nom} » : `
        + `${miens.length} des ${poses.length} exercices semés `
        + `(${attendu ? 'le sien, et lui seul' : 'ATTENDU 1, le sien'})`)
    }
    dire(bon
      ? '✓ le travail de l’autre classe ne franchit pas le filtre'
      : '✗ CLOISONNEMENT ROMPU — à regarder avant tout le reste')
  } finally {
    // Le décor de ce contrôle part TOUJOURS, échec compris.
    if (poses.length > 0) {
      await admin.from('exercices_depots').delete().in('id', poses.map((p) => p.depotId))
      await admin.from('exercices').delete().in('id', poses.map((p) => p.exId))
      dire(`décor du contrôle retiré (${poses.length} instances)`)
    }
  }
}

const geste = a('retire') ? retirer : a('etat') ? etat
  : a('biclasse') ? biclasse : a('synthese') ? synthese : a('examen') ? examen
  : a('seme') ? semer : null
if (!geste) {
  console.error('Passe --seme [--ouvre], --synthese, --examen, --retire, --etat, ou --biclasse.')
  process.exit(1)
}
try { await geste() } catch (e) { console.error(`\n✗ ${e.message}`); process.exit(1) }
