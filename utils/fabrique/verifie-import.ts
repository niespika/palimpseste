/* eslint-disable @typescript-eslint/no-explicit-any --
 * CE FICHIER LIT UNE ENTRÉE NON FIABLE : un JSON déposé, dont on ne sait RIEN
 * avant de l'avoir contrôlé. C'est précisément le travail de ce module — « tout
 * ce que le `08-` ne déclare pas est refusé » — et l'exprimer en types
 * n'ajouterait aucune garantie : la garantie EST le contrôle. Chaque accès passe
 * par `estObjet`, `liste`, `chaine` ou `nonVide`, qui narrowent à la lecture.
 * La dérogation s'arrête à ce fichier. */
// ============================================================================
// C4 · L8 — LES CONTRÔLES À L'IMPORT, portés en plateforme.
// ----------------------------------------------------------------------------
// Port fidèle de `generateur/verifie-import.py` (dépôt palimpseste-conception),
// qui applique « les dix-huit refus, les trois blocages et les neuf
// signalements, ET IL NE LES CONFOND PAS » (`08-` §7.4).
//   La liste fait foi au `08-` §7.1, §7.2 et §7.3 — elle se lit LÀ, jamais de
//   mémoire (piège 22). Chaque contrôle ci-dessous cite son numéro.
//
// LA PREUVE DU PORT, ET LA SEULE
//   `utils/fabrique/verifie-import.test.ts` rejoue LES MÊMES VECTEURS que
//   l'autotest du script — chaque refus provoqué un par un, les blocages, les
//   signalements — sur la doctrine dérivée des mêmes sources.
//
// ⚠️ TROIS DIFFÉRENCES ASSUMÉES AVEC LE CONTRÔLE HORS LIGNE. Le `08-` veut les
//   deux premières ; la troisième est une conséquence du port :
//   (1) « Les renvois se résolvent dans le fichier ET DANS CE QUI EST DÉJÀ EN
//       BASE : un `texte`, un `sujet`, un `materiau` visé peut venir d'un dépôt
//       antérieur. Le contrôle hors ligne ne voit que le fichier ; LE TIEN VOIT
//       LES DEUX » (piège 10). D'où `dejaEnBase`.
//   (2) L'IDEMPOTENCE : « une entrée dont l'`id` existe déjà est IGNORÉE —
//       jamais dupliquée, jamais écrasée en silence —, et l'import rend le
//       compte de ce qu'il a ignoré, BANQUE PAR BANQUE » (`08-` §1 ; piège 11).
//       Le contrôle hors ligne n'a pas de base : il ne peut pas l'ignorer.
//   (3) LE CRIBLE « CITE OU REFUSE » n'a pas d'équivalent ici. Le script s'arrête
//       quand une déclaration du `02-` §6 A a bougé mot pour mot ; la plateforme
//       n'a pas les sources sous la main, et son équivalent est le CONTRÔLE DE
//       DÉRIVATION (`scripts/derive-doctrine.py --verifie`). Le refus n° 17
//       « le contrôle a échoué » n'a donc pas de jumeau, et c'est voulu.
// ============================================================================

import {
  FORMAT_IMPORT, VERSION_IMPORT, MODES, PROVENANCES, SUPPORTS, LIEUX,
  competencesMesurables, type Doctrine,
} from './doctrine'
import { controleReference } from './verifie-reference'

// ── Le schéma : les seules clés que le `08-` déclare ────────────────────────
// « Tout ce qui n'est pas déclaré ici est refusé […] c'est par une clé inventée
// qu'une valeur retirée du modèle y reviendrait » (`08-` §1, refus n° 2).
const CLES: Record<string, ReadonlySet<string>> = {
  racine: new Set(['format', 'version', 'genere_le', 'genere_par',
    'textes', 'sujets', 'materiaux', 'exercices', 'demonstrations']),
  // ⚠️⚠️ C4-L16 — `notions` SUR `textes[]` : LA SOURCE LE DÉCLARE, ET LE SCRIPT
  //   LE REFUSE. C'est le SEUL vecteur où ce port et `verifie-import.py` ne
  //   rendent pas le même verdict, et le choix est délibéré.
  //   · Le `08-` §2, **VALIDÉ ET GELÉ**, porte la ligne : « `notions` — les
  //     notions du programme que ce texte met en jeu, MÊME CHAMP, MÊME FORME ET
  //     MÊME RÔLE QU'AU §3 » ; et le `07-` §2 demande explicitement de le porter.
  //   · Or `CLES["texte"]` du script ne contient PAS `notions` — vérifié en le
  //     jouant : un texte qui le porte sort en `✗ [R02] clé « notions » que le
  //     08- ne déclare pas`.
  //   ⭐ **ET LE MÊME SCRIPT LIT `texte.notions` VINGT LIGNES PLUS LOIN**, dans
  //     son propre signalement (`for nom, liste in (("sujet", sujets),
  //     ("texte", textes))`) : le champ était VOULU, seule la déclaration manque.
  //   ⛔ On ne modifie pas le script — c'est une pièce du manifeste. **La source
  //     gelée fait foi, le port accepte, et l'écart est rapporté, pas recopié.**
  //     Le choix est ÉPINGLÉ par un test (`verifie-import.test.ts`), et la ligne
  //     est au registre des dettes (D7).
  texte: new Set(['id', 'auteur', 'titre', 'reference', 'contenu',
    'decomposition', 'validee', 'cours', 'plan_de_lecture', 'notions']),
  sujet: new Set(['id', 'enonce', 'forme', 'notions', 'texte', 'cours']),
  demonstration: new Set(['id', 'competence', 'grain', 'theme', 'forme', 'corps']),
  materiau: new Set(['id', 'objet', 'support', 'contenu', 'observable', 'defaut',
    'version_corrigee', 'mode', 'famille']),
  observable: new Set(['code', 'competence']),
  exercice: new Set(['id', 'objet', 'cran', 'genre', 'lieu', 'modes',
    'observable_isole', 'materiau_source', 'materiau_cible', 'guide', 'cas', 'bonus']),
  materiau_ref: new Set(['provenance', 'support', 'texte', 'sujet', 'localisation', 'englobant']),
  // ⭐ C4-L14 — `pourquoi_juste` entre au jeu de clés du `cas` (format 1.2).
  //    Sans lui, une clé de plus valait refus n° 2 PAR CAS, donc sur tout
  //    exercice neuf : le port refusait le format que le générateur produit.
  cas: new Set(['consigne', 'materiau', 'defaut', 'distracteurs', 'reponse_attendue',
    'pourquoi_juste']),
  // ⚠️ La forme du distracteur était DÉJÀ portée ici avant que le `08-` §5.2 la
  //    déclare — « cette forme était appliquée par le contrôle machine sans
  //    qu'aucun document la déclare ; ce paragraphe paie la dette ».
  distracteur: new Set(['texte', 'pourquoi_faux']),
}

export interface VerdictEntree {
  refus: string[]
  blocages: string[]
  signalements: string[]
}

export interface VerdictImport {
  /** 0 = importable (blocages et signalements possibles) · 1 = au moins un refus. */
  code: 0 | 1
  refus: string[]
  blocages: string[]
  signalements: string[]
  annonces: string[]
  /** Ce qui a été ignoré, BANQUE PAR BANQUE — l'idempotence (`08-` §1). */
  ignores: Record<string, string[]>
  /**
   * Le verdict PAR ENTRÉE, indexé `banque|id`. C'est lui que l'écrivain lit :
   * « le REFUS est PAR ENTRÉE, et le rapport les nomme » — l'entrée refusée
   * n'entre pas, les autres entrent ; l'entrée BLOQUÉE entre et attend en file
   * (`08-` §7). Deux exceptions portent sur le fichier entier : le refus n° 1,
   * et le n° 2 à la racine — ils rendent `code` à 1 avec `fichierRefuse`.
   */
  entrees: Record<string, VerdictEntree>
  /** Le fichier entier ne passe pas — refus n° 1, ou n° 2 à la racine. */
  fichierRefuse: boolean
}

/** Ce que la base porte déjà — pour résoudre les renvois d'un dépôt antérieur
 *  et pour ignorer, banque par banque, ce qui existe (`08-` §1 ; piège 10). */
export interface DejaEnBase {
  textes?: Set<string>
  sujets?: Set<string>
  materiaux?: Set<string>
  exercices?: Set<string>
  demonstrations?: Set<string>
  /** Les textes déjà en base dont la référence est validée — pour le blocage n° 1. */
  textesValides?: Set<string>
  /** Le contenu des textes déjà en base — pour les bornes des intervalles (refus n° 16). */
  longueurTexte?: Record<string, number>
}

class Verdict {
  refus: string[] = []
  blocages: string[] = []
  signalements: string[] = []
  annonces: string[] = []
  /** L'entrée en cours de lecture — `banque|id`, ou null au niveau du fichier. */
  entree: string | null = null
  entrees: Record<string, VerdictEntree> = {}
  private sur(): VerdictEntree | null {
    if (!this.entree) return null
    return (this.entrees[this.entree] ??= { refus: [], blocages: [], signalements: [] })
  }
  refuse(ou: string, quoi: string, n: number) {
    const m = `[R${String(n).padStart(2, '0')}] ${ou} : ${quoi}`
    this.refus.push(m); this.sur()?.refus.push(m)
  }
  bloque(ou: string, quoi: string, n: number) {
    const m = `[B${n}] ${ou} : ${quoi}`
    this.blocages.push(m); this.sur()?.blocages.push(m)
  }
  signale(ou: string, quoi: string) {
    const m = `${ou} : ${quoi}`
    this.signalements.push(m); this.sur()?.signalements.push(m)
  }
}

// ── ⭐ C4-L16 — LES DIX-SEPT NOTIONS DU PROGRAMME (B.O. 2019) ────────────────
// Recopiées de `NOTIONS_TC` de `generateur/verifie-import.py`, AVEC LEURS
// ARTICLES ET LEURS CAPITALES, parce que le contrôle est un `in` exact des deux
// côtés et que « ce que tu construis doit rendre LES MÊMES VERDICTS SUR LES
// MÊMES VECTEURS ».
//
// ⛔ CE N'EST PAS UNE DONNÉE DE DOCTRINE, ET LE SCRIPT LE DIT DE LUI-MÊME :
//   « aucune source du chantier ne les porte, et le `08-` §3 dit que `notions`
//   est "une liste de mots". Elles sont ici parce qu'un mot hors de cette liste
//   ne se rattachera à AUCUN cours — le sujet entrerait en banque, passerait
//   tout, et resterait muet pour toujours. »
// ⛔ Elle n'entre donc PAS en base, elle ne se dérive PAS, et elle ne devient
//   PAS une liste fermée à l'écran : le `07-` §2 retire explicitement à ce lot
//   « la liste fermée des notions du programme ». **Le champ reste libre ; c'est
//   l'écran qui guide, pas une contrainte.** Son seul emploi est le signalement
//   ci-dessous, jumeau de celui du script.
// ⚠️ ET C'EST LE SEUL ENDROIT DU PORT QUI NE REPLIE RIEN : l'appariement de la
//   plateforme, lui, passe par `utils/fabrique/notions.ts`. Les deux règles ne
//   se confondent pas, et la divergence est au relevé.
const NOTIONS_TC: ReadonlySet<string> = new Set([
  "l'art", 'le bonheur', 'la conscience', 'le devoir', "l'État",
  "l'inconscient", 'la justice', 'le langage', 'la liberté', 'la nature',
  'la raison', 'la religion', 'la science', 'la technique', 'le temps',
  'le travail', 'la vérité',
])

const estObjet = (x: unknown): x is Record<string, any> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)
// ⚠️ PAS DE `liste()` COERCITIF ICI. Il y en avait un — `Array.isArray(x) ? x : []`
//    — et sa coercion muette rendait IMPORTABLE une banque dont une liste
//    racine était malformée. Ce qui coerce en silence ne doit pas exister à
//    portée de main : les listes racines passent par `listeRacine()`, qui REFUSE.
const chaine = (x: unknown): string => (typeof x === 'string' ? x : '')
const nonVide = (x: unknown): boolean => chaine(x).trim().length > 0

/**
 * ⚠️ LA VÉRITÉ DE PYTHON, PAS CELLE DE JAVASCRIPT.
 *
 * Le script qui fait foi écrit `elif d:`, `and r`, `if e.get("bonus")`. En
 * Python, `[]`, `{}`, `""` et `0` sont FAUX ; en JavaScript, `[]` et `{}` sont
 * VRAIS. Un générateur qui écrit « pas de distracteurs » en liste vide plutôt
 * qu'en `null` ferait donc refuser sa banque par la plateforme et accepter par
 * le script — deux verdicts sur le même fichier.
 *
 * `declare()` rend ce que Python appellerait « vrai » : quelque chose EST là.
 */
const declare = (x: unknown): boolean => {
  if (x === null || x === undefined || x === false) return false
  if (typeof x === 'string') return x.length > 0
  if (typeof x === 'number') return x !== 0
  if (Array.isArray(x)) return x.length > 0
  if (typeof x === 'object') return Object.keys(x as object).length > 0
  return Boolean(x)
}

/**
 * ⚠️ L'APPARTENANCE, SANS TRAVERSER `Object.prototype`.
 *
 * `'constructor' in d.objets` est VRAI sur un objet littéral, et
 * `d.objets['toString']` rend une fonction. Un fichier déposé avec
 * `"objet": "constructor"` faisait donc passer le contrôle d'objet inconnu,
 * puis TOMBER le contrôle entier sur un `TypeError`. Python teste sur un
 * `dict`, qui n'a pas de prototype : on fait pareil.
 */
const declaree = (m: Record<string, unknown>, cle: unknown): boolean =>
  typeof cle === 'string' && Object.hasOwn(m, cle)
/** La lecture qui va avec : rien ne remonte du prototype. */
const dans = <T>(m: Record<string, T>, cle: unknown): T | undefined =>
  (typeof cle === 'string' && Object.hasOwn(m, cle)) ? m[cle] : undefined

function clesInconnues(v: Verdict, ou: string, entree: unknown, schema: string, n = 2) {
  if (!estObjet(entree)) return
  for (const k of Object.keys(entree)) {
    if (!CLES[schema].has(k)) v.refuse(ou, `clé « ${k} » que le \`08-\` ne déclare pas`, n)
  }
}

/** `08-` §5 bis — le discriminant `forme` DIT CE QUE `corps` CONTIENT. */
function corpsDemoMalForme(forme: string, c: unknown): boolean {
  if (!estObjet(c)) return true
  const cles = new Set(Object.keys(c))
  if (forme === 'exemple') {
    return !([...cles].every((k) => k === 'texte' || k === 'trous') && nonVide(c.texte))
  }
  if (forme === 'checklist') {
    return !(cles.size === 1 && cles.has('points') && Array.isArray(c.points)
      && c.points.length > 0 && c.points.every((p: unknown) => nonVide(p)))
  }
  const volets = c.volets
  return !(cles.size === 1 && cles.has('volets') && Array.isArray(volets)
    && volets.length > 0 && volets.every((x: unknown) => estObjet(x)))
}

/** Le rattachement au cours (`08-` §2, refus n° 5) — **QUATRE états depuis le
 *  format 1.3** (C4-L16) : absent, `null` ou vide — jamais servable ; la chaîne
 *  réservée `"generique"` ; une liste de chaînes non vides ; ou la chaîne
 *  réservée **`"notions"`**, et l'entrée devient servable dès qu'un cours vu
 *  déclare l'une de ses `notions` (`01-` §4 couche 4).
 *
 *  L'EXISTENCE d'un cours ne se vérifie pas ici : « les cours vivent dans la
 *  plateforme et ce fichier se fabrique dehors » — l'appariement se fait à
 *  l'écran du dépôt (piège 15).
 *
 *  ⚠️ LE `08-` §7.1, REFUS N° 5, EST EN RETARD SUR SES PROPRES §2 ET §3 : il
 *  écrit encore « ni `"generique"`, ni une liste de chaînes ». Le §2 et le §3 du
 *  même document déclarent QUATRE états, et `verifie-import.py` accepte
 *  `"notions"`. On suit le §2/§3 et le script ; le `[faux]` est posé au point de
 *  l'erreur et la ligne est au registre des dettes (D7). */
function coursMalForme(v: Verdict, ou: string, entree: Record<string, any>) {
  const c = entree.cours
  if (c === undefined || c === null || (Array.isArray(c) && c.length === 0)
    || c === 'generique' || c === 'notions') return
  if (Array.isArray(c) && c.every((x) => nonVide(x))) return
  // ⛔ Le message énumère les QUATRE états : c'est lui que le professeur lit au
  //   rapport d'import, et « une autre chaîne réservée n'existe pas » — un
  //   `cours: "notion"`, au singulier, doit refuser.
  v.refuse(ou, `\`cours\` mal formé : ${JSON.stringify(c)} — attendu « generique », `
    + '« notions », une liste de chaînes, ou rien', 5)
}

/** Le couple { livre, semaine }, JAMAIS la semaine seule (`08-` §2, refus n° 5).
 *  « Une semaine déclarée seule serait un nombre comparable en apparence et
 *  faux en fait — le défaut même que cette échelle répare. » */
function planDeLectureMalForme(v: Verdict, ou: string, entree: Record<string, any>) {
  const p = entree.plan_de_lecture
  if (p === undefined || p === null) return
  const bien = estObjet(p)
    && Object.keys(p).length === 2 && 'livre' in p && 'semaine' in p
    && nonVide(p.livre)
    && typeof p.semaine === 'number' && Number.isInteger(p.semaine) && p.semaine >= 1
  if (bien) return
  v.refuse(ou, `\`plan_de_lecture\` mal formé : ${JSON.stringify(p)} — attendu `
    + '{"livre": une chaîne, "semaine": un ordinal}, ou rien', 5)
}

/** Le mode DE LA CONSIGNE — le réceptif s'il y en a un, `composer` sinon.
 *  Le `07-` §1.1 ne porte pas de champ « mode de l'exercice » : les modes se
 *  déclarent par compétence mesurée. C'est lui que la règle 4 regarde. */
function modeExercice(modes: Record<string, unknown> | undefined): string {
  const receptifs = new Set(Object.values(modes ?? {}).filter((m) => m !== 'composer'))
  return receptifs.size === 1 ? String([...receptifs][0]) : 'composer'
}

/**
 * Le contrôle d'un fichier d'import.
 *
 * @param banque    le JSON déposé, tel quel
 * @param d         la doctrine, dérivée des sources et lue en base
 * @param deja      ce que la base porte déjà (renvois et idempotence)
 */
export function controleImport(
  banque: unknown, d: Doctrine, deja: DejaEnBase = {},
): VerdictImport {
  const v = new Verdict()
  const ignores: Record<string, string[]> = {
    textes: [], sujets: [], materiaux: [], exercices: [], demonstrations: [],
  }
  const b: Record<string, any> = estObjet(banque) ? banque : {}

  // ── REFUS n° 1 — le fichier entier, AVANT TOUTE LECTURE ───────────────────
  if (b.format !== FORMAT_IMPORT) {
    v.refuse('fichier', `\`format\` inconnu : ${JSON.stringify(b.format)}`, 1)
    return rendre(v, ignores, true)
  }
  // « Le MAJEUR seul décide si l'import sait lire le fichier, et le mineur n'est
  // lu par personne » (`08-` §1). Un fichier de la 1.0 s'importe toujours.
  const majeure = String(b.version ?? '').split('.')[0]
  if (majeure !== VERSION_IMPORT.split('.')[0]) {
    v.refuse('fichier', `version majeure inconnue : ${JSON.stringify(b.version)}`, 1)
    return rendre(v, ignores, true)
  }
  // REFUS n° 2 — « à la racine, c'est LE FICHIER qui ne passe pas ».
  const avantRacine = v.refus.length
  clesInconnues(v, 'fichier', b, 'racine')
  const racineRefusee = v.refus.length > avantRacine

  // ⚠️ MAL FORMÉ N'EST PAS ABSENT — À LA RACINE AUSSI, ET C'EST LÀ QUE ÇA COÛTE
  // LE PLUS CHER. `liste()` coerce en tableau vide ; sur une BANQUE ENTIÈRE,
  // cette coercion est MUETTE ET DESTRUCTRICE : `"exercices": "x"` rendait
  // « 0 refus, 0 blocage, 0 signalement », le fichier était déclaré IMPORTABLE,
  // et l'écrivain — qui refait la même coercion (`import-ecriture.ts`) —
  // n'écrivait rien. Le professeur voyait une coche verte sur un dépôt disparu.
  // Le script qui fait foi, lui, S'ARRÊTE : `banque.get("textes") or []` garde
  // la valeur telle quelle et se casse dessus.
  // Une clé ABSENTE, `null` ou `[]` reste légitime — une banque n'est pas tenue
  // de porter les cinq listes, et `or []` les ramène toutes au même vide.
  const listeRacine = (nom: string, x: unknown): any[] => {
    if (Array.isArray(x)) return x
    if (declare(x)) {
      v.refuse('fichier', `\`${nom}\` n'est pas une liste : ${JSON.stringify(x)}`, 5)
    }
    return []
  }
  const textes = listeRacine('textes', b.textes)
  const sujets = listeRacine('sujets', b.sujets)
  const materiaux = listeRacine('materiaux', b.materiaux)
  const exercices = listeRacine('exercices', b.exercices)
  const demonstrations = listeRacine('demonstrations', b.demonstrations)
  v.annonces.push(`${textes.length} texte(s) · ${sujets.length} sujet(s) · `
    + `${materiaux.length} matériau(x) · ${exercices.length} exercice(s) · `
    + `${demonstrations.length} démonstration(s)`)

  // ── REFUS n° 3 — l'`id` d'abord, et l'`id` en double dans sa banque ───────
  for (const [nom, entrees] of [['textes', textes], ['sujets', sujets],
    ['materiaux', materiaux], ['exercices', exercices],
    ['demonstrations', demonstrations]] as Array<[string, any[]]>) {
    const vus = new Set<string>()
    for (const e of entrees) {
      const cle = estObjet(e) ? e.id : undefined
      if (!nonVide(cle)) { v.refuse(nom, 'une entrée sans `id`', 3); continue }
      if (vus.has(cle)) v.refuse(nom, `\`id\` en double : ${cle}`, 3)
      vus.add(cle)
      // L'IDEMPOTENCE : une entrée dont l'`id` existe déjà est IGNORÉE, jamais
      // dupliquée, jamais écrasée en silence (`08-` §1 ; piège 11).
      if ((deja as Record<string, Set<string> | undefined>)[nom]?.has(cle)) {
        ignores[nom].push(cle)
      }
    }
  }

  const _textes = new Map<string, Record<string, any>>()
  for (const t of textes) if (estObjet(t) && nonVide(t.id)) _textes.set(t.id, t)
  const _sujets = new Set(sujets.filter((s) => estObjet(s) && nonVide(s.id)).map((s) => s.id))
  const _mats = new Set(materiaux.filter((m) => estObjet(m) && nonVide(m.id)).map((m) => m.id))
  // Les renvois se résolvent dans le fichier ET en base (piège 10).
  const texteConnu = (id: unknown) => _textes.has(chaine(id)) || !!deja.textes?.has(chaine(id))
  const sujetConnu = (id: unknown) => _sujets.has(chaine(id)) || !!deja.sujets?.has(chaine(id))
  const matConnu = (id: unknown) => _mats.has(chaine(id)) || !!deja.materiaux?.has(chaine(id))

  const formes = new Set(Object.values(d.objets).flatMap((o) => o.genres))

  /** Les textes dont le BLOCAGE N° 2 force `validee` à `false` (`08-` §2). */
  const forcesNonValides = new Set<string>()

  // ── Les textes ────────────────────────────────────────────────────────────
  for (const [it, t] of textes.entries()) {
    // MAL FORMÉ N'EST PAS ABSENT : le script qui fait foi s'arrête ici,
    // et écarter l'entrée en silence rendait le fichier importable.
    if (!estObjet(t)) { v.refuse('textes', `l'entrée ${it} n'est pas un objet`, 5); continue }
    const ou = `texte ${t.id}`
    v.entree = `textes|${t.id}`
    clesInconnues(v, ou, t, 'texte')
    coursMalForme(v, ou, t)
    planDeLectureMalForme(v, ou, t)
    for (const champ of ['auteur', 'titre', 'reference', 'contenu']) {
      if (!nonVide(t[champ])) v.refuse(ou, `\`${champ}\` vide`, 3)
    }
    if (!estObjet(t.decomposition)) { v.refuse(ou, '`decomposition` absente', 17); continue }
    // REFUS n° 17 et BLOCAGE n° 2 — « la `decomposition` a son propre contrôle,
    // et l'import LE REJOUE » (`08-` §2 ; piège 14).
    const verd = controleReference(t.decomposition, chaine(t.contenu))
    if (verd.refus.length) v.refuse(ou, `décomposition refusée — ${verd.refus[0]}`, 17)
    else if (verd.blocages.length) {
      v.bloque(ou, `décomposition bloquée — ${verd.blocages[0]}`, 2)
      // ⚠️ « Un texte dont la décomposition est BLOQUÉE entre avec
      // `validee: false`, QUOI QUE LE FICHIER DÉCLARE » (`08-` §2 et §7.2 ;
      // piège 14). La valeur EFFECTIVE est donc fausse — et c'est ELLE que le
      // blocage n° 1 lit plus bas. Sans cette ligne, une instance bâtie sur ce
      // texte passait sans blocage et pouvait être validée sur une référence
      // non relue : ce que le `02-` §6 A interdit.
      forcesNonValides.add(chaine(t.id))
    }
    for (const s of verd.signalements) v.signale(ou, `décomposition — ${s}`)
  }

  // ── Les sujets ────────────────────────────────────────────────────────────
  for (const [is, s] of sujets.entries()) {
    // MAL FORMÉ N'EST PAS ABSENT : le script qui fait foi s'arrête ici,
    // et écarter l'entrée en silence rendait le fichier importable.
    if (!estObjet(s)) { v.refuse('sujets', `l'entrée ${is} n'est pas un objet`, 5); continue }
    const ou = `sujet ${s.id}`
    v.entree = `sujets|${s.id}`
    clesInconnues(v, ou, s, 'sujet')
    coursMalForme(v, ou, s)
    if (!nonVide(s.enonce)) v.refuse(ou, '`enonce` vide', 3)
    // « `forme` prend LES VALEURS DU `genre` » (`08-` §3 ; piège 17).
    if (s.forme !== undefined && s.forme !== null && !formes.has(s.forme)) {
      v.refuse(ou, `\`forme\` hors des valeurs du \`genre\` : ${JSON.stringify(s.forme)}`, 5)
    }
    if (declare(s.texte) && !texteConnu(s.texte)) v.refuse(ou, `renvoie au texte inconnu ${s.texte}`, 4)
  }

  // ── Les démonstrations (`08-` §5 bis) ─────────────────────────────────────
  const grains = new Set(Object.values(d.objets).map((o) => o.grain))
  for (const [idm, dm] of demonstrations.entries()) {
    // MAL FORMÉ N'EST PAS ABSENT : le script qui fait foi s'arrête ici,
    // et écarter l'entrée en silence rendait le fichier importable.
    if (!estObjet(dm)) { v.refuse('demonstrations', `l'entrée ${idm} n'est pas un objet`, 5); continue }
    const ou = `démonstration ${dm.id}`
    v.entree = `demonstrations|${dm.id}`
    clesInconnues(v, ou, dm, 'demonstration')
    if (!nonVide(dm.theme)) {
      v.refuse(ou, '`theme` vide — une démonstration porte toujours sur un thème, '
        + "et jamais celui de l'exercice servi", 3)
    }
    if (!declaree(d.modesAdmis, dm.competence)) {
      v.refuse(ou, `compétence inconnue : ${JSON.stringify(dm.competence)}`, 5)
    }
    if (!grains.has(dm.grain)) v.refuse(ou, `grain inconnu : ${JSON.stringify(dm.grain)}`, 5)
    const forme = dm.forme
    const attendu = d.formesDemonstration
    if (!declaree(attendu, forme)) {
      v.refuse(ou, `\`forme\` inconnue : ${JSON.stringify(forme)} — attendu `
        + Object.keys(attendu).sort().join(' · '), 5)
      continue
    }
    if (corpsDemoMalForme(forme, dm.corps)) {
      v.refuse(ou, `\`corps\` ne va pas avec la forme « ${forme} »`, 5)
    } else if (dm.grain !== dans(attendu, forme)) {
      // SIGNALEMENT, jamais refus : « l'appariement du `06-` §2 décrit une
      // progression qui déborde l'appariement, et la règle se discute au `06-` ».
      v.signale(ou, `forme « ${forme} » au grain « ${dm.grain} » — le \`06-\` §2 `
        + `l'attend au « ${dans(attendu, forme)} »`)
    }
  }

  v.entree = null

  // ── SIGNALEMENT n° 9 — les sans-rattachement, EN UNE SEULE LIGNE AGRÉGÉE ──
  // « Sans lui, un dépôt entier peut n'être jamais servi sans que rien ne le
  // dise ; la ligne disparaît dès que le professeur a trié » (`08-` §7.3).
  const sansSujet = sujets.filter((x) => estObjet(x) && !x.cours).length
  const sansTexte = textes.filter((x) => estObjet(x) && !x.cours).length
  if (sansSujet || sansTexte) {
    v.signale('fichier', `${sansSujet} sujet(s) et ${sansTexte} texte(s) sans `
      + "rattachement au cours — aucun ne sera servi tant qu'il n'est pas déclaré")
  }

  // ── ⭐ C4-L16 — LES DEUX SIGNALEMENTS DU FORMAT 1.3 ────────────────────────
  // ⚠️ ILS S'AJOUTENT À L'AGRÉGÉ CI-DESSUS, ILS NE LE REMPLACENT PAS. Un sujet
  //   en `"notions"` A un `cours` : il n'entre pas dans ce compte-là, et c'est
  //   juste. Ceux-ci sont d'une autre nature — **par entrée**, et non agrégés,
  //   parce que c'est l'entrée qu'il faut aller corriger.
  // ⛔ ILS SIGNALENT, ILS NE REFUSENT JAMAIS : « `0` = importable (blocages et
  //   signalements possibles), `1` = au moins un refus » (`08-` §7.4). Une
  //   mineure n'ajoute que des champs facultatifs, et un fichier ancien reste
  //   importable.

  // (a) L'ÉTAT « notions » SANS NOTIONS EST UN SILENCE, PAS UNE ERREUR DE FORME.
  //   Le sujet passe tous les contrôles, entre en banque, et ne sera JAMAIS
  //   servi — aucun cours ne pourra jamais déclarer l'une de ses notions,
  //   puisqu'il n'en a pas. **C'est exactement le défaut que le rattachement
  //   était fait pour éviter, retourné d'un cran** : il se signale, il ne se
  //   refuse pas.
  // ⚠️ `declare()`, ET SURTOUT PAS `Array.isArray()` : le script écrit
  //   `not (e.get("notions") or [])`, la vérité de PYTHON. Un `notions` qui
  //   serait une chaîne non vide est TRUTHY là-bas et ne signale pas ; un
  //   `Array.isArray` le tiendrait pour vide et signalerait — deux verdicts sur
  //   le même fichier, exactement ce que `declare()` existe pour empêcher.
  for (const [nom, liste] of [['sujet', sujets], ['texte', textes]] as const) {
    for (const e of liste) {
      if (!estObjet(e)) continue
      if (e.cours === 'notions' && !declare(e.notions)) {
        v.signale(`${nom} ${e.id}`, '`cours` vaut « notions » et `notions` est vide — '
          + 'il ne sera jamais servable, et rien ne le dira')
      }
    }
  }

  // (b) HORS PROGRAMME : le même silence, par l'autre bout. Une notion qui n'est
  //   pas au programme ne se rattachera à AUCUN cours.
  // ⚠️ UN SUJET HLP N'EST PAS REGARDÉ — son programme est en THÈMES de semestre,
  //   que rien ne déclare aujourd'hui. Le parcours « se lit dans le nom »
  //   (`08-` §3) : `_hlp`.
  // ⚠️ LA COMPARAISON EST UN `in` EXACT, SANS AUCUNE NORMALISATION — et c'est
  //   le comportement du script, recopié tel quel : « les mêmes verdicts sur les
  //   mêmes vecteurs ». `NOTIONS_TC` porte ses articles et ses capitales, si
  //   bien que « La Vérité » y serait signalée HORS PROGRAMME. ⭐ **Ce n'est pas
  //   un défaut à réparer dans ce port** : le contrôle d'IMPORT et l'APPARIEMENT
  //   de la plateforme (`utils/fabrique/notions.ts`) ne replient pas de la même
  //   façon, et c'est le second que la source décrit. Le fait est au relevé.
  for (const s of sujets) {
    if (!estObjet(s) || String(s.forme ?? '').endsWith('_hlp')) continue
    if (!Array.isArray(s.notions)) continue
    for (const n of s.notions) {
      if (!NOTIONS_TC.has(n as string)) {
        v.signale(`sujet ${s.id}`, `« ${String(n)} » n'est pas une notion du programme de `
          + 'terminale générale — aucun cours ne pourra la déclarer, et le sujet restera muet')
      }
    }
  }

  // ── Les matériaux ─────────────────────────────────────────────────────────
  for (const [im, m] of materiaux.entries()) {
    // MAL FORMÉ N'EST PAS ABSENT : le script qui fait foi s'arrête ici,
    // et écarter l'entrée en silence rendait le fichier importable.
    if (!estObjet(m)) { v.refuse('materiaux', `l'entrée ${im} n'est pas un objet`, 5); continue }
    const ou = `matériau ${m.id}`
    v.entree = `materiaux|${m.id}`
    clesInconnues(v, ou, m, 'materiau')
    if (!declaree(d.objets, m.objet)) v.refuse(ou, `objet inconnu : ${JSON.stringify(m.objet)}`, 5)
    if (!(SUPPORTS as readonly unknown[]).includes(m.support) || m.support == null) {
      v.refuse(ou, `\`support\` inconnu : ${JSON.stringify(m.support)}`, 5)
    }
    if (!nonVide(m.contenu)) v.refuse(ou, '`contenu` vide', 3)
    if (!(MODES as readonly unknown[]).includes(m.mode)) {
      v.refuse(ou, `mode inconnu : ${JSON.stringify(m.mode)}`, 5)
    }
    const obs = estObjet(m.observable) ? m.observable : {}
    clesInconnues(v, ou, obs, 'observable')
    if (!declaree(d.modesAdmis, obs.competence)) {
      v.refuse(ou, `compétence inconnue : ${JSON.stringify(obs.competence)}`, 5)
    }
    // ⚠️ « Le `defaut` d'un matériau n'est pas toujours un défaut : une réussite
    // calibrée s'injecte de la même façon » (`02-` §2.3.1 a).
    if (!nonVide(m.defaut)) {
      v.refuse(ou, '`defaut` vide — un matériau calibré déclare ce qu\'il porte (`02-` §2.3.4)', 3)
    }
  }

  const vises = new Set<string>()

  // ── Les exercices ─────────────────────────────────────────────────────────
  for (const [ie, e] of exercices.entries()) {
    // MAL FORMÉ N'EST PAS ABSENT : le script qui fait foi s'arrête ici,
    // et écarter l'entrée en silence rendait le fichier importable.
    if (!estObjet(e)) { v.refuse('exercices', `l'entrée ${ie} n'est pas un objet`, 5); continue }
    const ou = `exercice ${e.id}`
    v.entree = `exercices|${e.id}`
    clesInconnues(v, ou, e, 'exercice')

    const objet = e.objet
    const o = dans(d.objets, objet)
    if (!o) { v.refuse(ou, `objet inconnu : ${JSON.stringify(objet)}`, 5); continue }
    const cran = e.cran
    if (typeof cran !== 'number' || !Number.isInteger(cran) || !d.crans[cran]) {
      v.refuse(ou, `cran hors de 1–9 : ${JSON.stringify(cran)}`, 5); continue
    }
    const c = d.crans[cran]
    // REFUS n° 6 — le cran hors des `crans[]` de l'objet.
    if (!o.crans.has(cran)) v.refuse(ou, `cran ${cran} hors des \`crans[]\` de \`${objet}\``, 6)
    if (!(LIEUX as readonly unknown[]).includes(e.lieu)) {
      v.refuse(ou, `\`lieu\` inconnu : ${JSON.stringify(e.lieu)}`, 5)
    } else if (e.lieu === 'classe') {
      // SIGNALEMENT — « la passation en classe n'a pas de routeur : c'est le
      // professeur qui la pose » (`08-` §7.3).
      v.signale(ou, '`lieu` vaut `classe` — la passation en classe se pose par le '
        + 'professeur, pas par le routeur')
    }
    if (declare(e.bonus)) {
      v.signale(ou, '`bonus` à `true` à l\'import — le drapeau est une décision du routeur')
    }

    // REFUS n° 7 — le genre (`02-` §1.3).
    const genre = e.genre
    // ⚠️ `declare()` ET NON LA VÉRITÉ JAVASCRIPT : le script écrit `if not genre`
    //    et `elif genre`, où `[]` et `{}` sont FAUX. Sans lui, `genre: []` sur un
    //    objet qui n'en porte pas faisait REFUSER LE PROFESSEUR À TORT, et sur un
    //    objet terminal il sortait « genre inadmis » au lieu de « sans genre ».
    if (o.genres.length) {
      if (!declare(genre)) {
        v.refuse(ou, `\`${objet}\` est terminal : une instance sans genre est refusée (\`02-\` §1.3)`, 7)
      } else if (!o.genres.includes(genre)) {
        v.refuse(ou, `genre \`${genre}\` inadmis pour \`${objet}\` — ${o.genres.join(' · ')}`, 7)
      }
    } else if (declare(genre)) {
      v.refuse(ou, `\`genre\` non nul sur \`${objet}\`, qui n'en porte pas`, 7)
    }

    // Les deux matériaux (`08-` §5.1).
    // ⚠️ MAL FORMÉ N'EST PAS ABSENT. Le script qui fait foi s'ARRÊTE sur un
    // matériau écrit en chaîne ; le coercer à `null` ferait taire le refus
    // n° 11 (« le cran veut la cible nulle ») et rendrait le fichier importable.
    for (const [nom, brutMat] of [['materiau_source', e.materiau_source],
      ['materiau_cible', e.materiau_cible]] as Array<[string, unknown]>) {
      if (brutMat !== null && brutMat !== undefined && !estObjet(brutMat)) {
        v.refuse(ou, `${nom} mal formé : ${JSON.stringify(brutMat)} — attendu un objet `
          + '`{ provenance, support }`, ou `null`', 5)
      }
    }
    const ms = estObjet(e.materiau_source) ? e.materiau_source : null
    const mc = estObjet(e.materiau_cible) ? e.materiau_cible : null
    for (const [nom, m] of [['materiau_source', ms], ['materiau_cible', mc]] as Array<[string, any]>) {
      if (m === null || m === undefined) continue
      clesInconnues(v, `${ou} — ${nom}`, m, 'materiau_ref')
      if (!(PROVENANCES as readonly unknown[]).includes(m.provenance ?? null)) {
        v.refuse(ou, `${nom} : provenance inconnue ${JSON.stringify(m.provenance)}`, 5)
      }
      if (!(SUPPORTS as readonly unknown[]).includes(m.support ?? null)) {
        v.refuse(ou, `${nom} : support inconnu ${JSON.stringify(m.support)}`, 5)
      }
      if (m.provenance === 'texte_auteur') {
        const t = _textes.get(chaine(m.texte))
        const nBase = deja.longueurTexte?.[chaine(m.texte)]
        if (!t && nBase === undefined) {
          v.refuse(ou, `${nom} : texte inconnu ${JSON.stringify(m.texte)}`, 4)
        } else {
          // REFUS n° 16 — les intervalles indexent LE `contenu` DU TEXTE VISÉ,
          // caractère par caractère (`08-` §2 ; piège 13).
          const n = t ? chaine(t.contenu).length : (nBase as number)
          for (const champ of ['localisation', 'englobant']) {
            const iv = m[champ]
            const bien = Array.isArray(iv) && iv.length === 2
              && iv.every((x: unknown) => typeof x === 'number' && Number.isInteger(x))
              && 0 <= iv[0] && iv[0] < iv[1] && iv[1] <= n
            if (!bien) v.refuse(ou, `${nom} : \`${champ}\` hors des bornes du texte`, 16)
          }
          // « obligatoire et NON VIDE sur l'objet `phrase`, dont la règle
          // d'instance exige le co-texte » (`04-` §11).
          if (objet === 'phrase' && !declare(m.englobant)) {
            v.refuse(ou, `${nom} : \`englobant\` vide sur l'objet \`phrase\`, dont la `
              + "règle d'instance exige le co-texte", 16)
          }
        }
      }
      if (m.provenance === 'sujet' && !sujetConnu(m.sujet)) {
        v.refuse(ou, `${nom} : sujet inconnu ${JSON.stringify(m.sujet)}`, 4)
      }
    }

    // REFUS n° 18 — le support du `materiau_source` dans la plage de l'objet.
    if (ms && ms.provenance === 'texte_auteur' && !o.supportSource.includes(ms.support)) {
      v.refuse(ou, `\`support\` \`${ms.support}\` hors de la plage admise de `
        + `\`${objet}\` (${o.supportSource.join(' · ')})`, 18)
    }

    // REFUS n° 11 — la présence de la cible suit LE CRAN (`02-` §2.2).
    if (c.materiauCible === 'présent' && (mc === null || mc === undefined)) {
      v.refuse(ou, `le cran ${cran} exige un \`materiau_cible\`, il est nul`, 11)
    }
    if (c.materiauCible === 'null' && mc !== null && mc !== undefined) {
      v.refuse(ou, `le cran ${cran} veut \`materiau_cible\` nul`, 11)
    }

    // REFUS n° 8 — `explication_texte_tc` exige un texte d'auteur.
    if (genre === 'explication_texte_tc' && !(ms && ms.provenance === 'texte_auteur')) {
      v.refuse(ou, '`explication_texte_tc` exige un `texte_auteur` en matériau source (`02-` §1.3)', 8)
    }

    // REFUS n° 9 — les modes déclarés.
    let modes: Record<string, any> = estObjet(e.modes) ? e.modes : {}
    if (!estObjet(e.modes) || Object.keys(modes).length === 0) {
      v.refuse(ou, '`modes` vide — le mode s\'élit par compétence mesurée', 9)
      modes = {}
    }
    for (const [comp, m] of Object.entries(modes)) {
      if (!declaree(d.modesAdmis, comp)) {
        v.refuse(ou, `compétence inconnue : ${JSON.stringify(comp)}`, 5)
      } else if (!o.competences.includes(comp)) {
        v.refuse(ou, `\`${comp}\` ne figure pas dans le \`competences[]\` de \`${objet}\``, 9)
      } else if (!(dans(d.modesAdmis, comp) ?? []).includes(m as string)) {
        v.refuse(ou, `la compétence \`${comp}\` n'admet pas le mode \`${m}\` (\`02-\` §3)`, 9)
      }
    }
    const modeEx = modeExercice(modes)
    if (!o.modes.includes(modeEx)) {
      v.refuse(ou, `l'objet \`${objet}\` ne déclare pas le mode \`${modeEx}\``, 9)
    }
    if (competencesMesurables(d, objet, modeEx).length === 0) {
      v.refuse(ou, `couple (\`${objet}\`, \`${modeEx}\`) non déclarable : aucune `
        + "compétence de l'objet n'admet ce mode", 9)
    }

    // REFUS n° 10 — les quatre règles de conception (`02-` §2.3.3).
    const auteurSource = !!(ms && ms.provenance === 'texte_auteur')
    const auteurCible = !!(mc && mc.provenance === 'texte_auteur')
    for (const [comp, m] of Object.entries(modes)) {
      const admis = dans(d.modesAdmis, comp)
      if (!admis) continue
      const mono = admis.length === 1
      if (m !== 'composer' && !(auteurSource || auteurCible) && !mono) {
        v.refuse(ou, "règle 3 : aucun texte d'auteur servi, le seul mode déclarable "
          + `est \`composer\` — \`${comp}\` déclare \`${m}\``, 10)
      }
      if (auteurSource && m === 'composer') {
        if (comp === 'argumentation' || comp === 'questionnement') {
          v.refuse(ou, `règle 4 : un \`texte_auteur\` en source ferme \`composer\` pour \`${comp}\``, 10)
        } else if (comp === 'structure'
                   && !['restituer', 'évaluer', 'interroger'].includes(modeEx)) {
          v.refuse(ou, "règle 4 : `composer` n'est ouvert à la Structure sur un texte "
            + "d'auteur qu'en `restituer`, `évaluer` ou `interroger`", 10)
        }
      }
    }

    // REFUS n° 15 et BLOCAGE n° 3 — l'observable isolé.
    const obs = e.observable_isole
    if (c.isole) {
      if (!declare(obs)) {
        v.refuse(ou, `le cran ${cran} isole : \`observable_isole\` est exigé`, 15)
      } else {
        clesInconnues(v, `${ou} — observable_isole`, obs, 'observable')
        const routes = (d.routes[`${objet}|${modeEx}`] ?? [])
          .filter((r) => r.code === obs.code && r.competence === obs.competence)
        if (routes.length === 0) {
          v.refuse(ou, `l'observable \`${obs.code}\` (${obs.competence}) n'est routé `
            + `ni pour \`${objet}\`, ni pour \`${modeEx}\` (\`04-\`)`, 15)
        } else if (!routes.some((r) => r.crans.includes(cran))) {
          v.refuse(ou, `l'observable \`${obs.code}\` n'est pas routé au cran ${cran}`, 15)
        } else {
          // BLOCAGE n° 3 — « la route existe, la consigne manque : le professeur
          // tranche à l'écran » (`08-` §7.2 ; piège 23).
          const bloc = d.consignesIsolees[`${routes[0].competence}|${routes[0].section}`]
          if (!bloc || !(cran in bloc)) {
            v.bloque(ou, `l'observable \`${obs.code}\` n'a pas de consigne écrite pour `
              + `le cran ${cran} dans \`instances/\``, 3)
          }
        }
      }
    } else if (declare(obs)) {
      v.refuse(ou, `le cran ${cran} n'isole rien : \`observable_isole\` doit être nul (\`04-\` §14)`, 15)
    }

    // REFUS n° 12 — le guide suit le cran.
    if (c.guide === 'null' && declare(e.guide)) v.refuse(ou, `le cran ${cran} ne sert aucun guide`, 12)
    if ((c.guide === 'complet' || c.guide === 'léger') && !nonVide(e.guide)) {
      v.refuse(ou, `le cran ${cran} exige un guide ${c.guide}`, 12)
    }
    // SIGNALEMENT — « une consigne qui nomme un observable à un cran de
    // production ferait d'`exerce` un `isole` sans que personne l'ait décidé ».
    if (declare(e.guide) && !c.isole && !declare(obs)) {
      for (const r of d.routes[`${objet}|${modeEx}`] ?? []) {
        if (r.code && chaine(e.guide).includes(r.code)) {
          v.signale(ou, `le guide nomme l'observable \`${r.code}\` à un cran de `
            + 'production — `exerce` deviendrait `isole`')
          break
        }
      }
    }

    // REFUS n° 14 — les cas, et la paire.
    const cas = e.cas
    if (!Array.isArray(cas) || cas.length === 0) { v.refuse(ou, '`cas` vide', 14); continue }
    const attendus = c.geste === 'diagnostiquer' ? 2 : 1
    if (cas.length !== attendus) {
      v.refuse(ou, `${cas.length} cas déclaré(s) au cran ${cran}, ${attendus} attendu(s) — `
        + (attendus === 2 ? 'la paire est UN SEUL exercice, en deux temps'
          : 'seul le diagnostic va par paires'), 14)
    }
    if (attendus === 2 && cas.length === 2) {
      const a = cas[0]?.materiau
      const bb = cas[1]?.materiau
      if (a && a === bb) {
        v.refuse(ou, 'les deux cas de la paire visent le même matériau — un cas servi '
          + 'deux fois ne mesure aucun transfert', 14)
      }
    }

    cas.forEach((cs: any, i: number) => {
      const oc = `${ou} — cas ${i + 1}`
      clesInconnues(v, oc, cs, 'cas')
      if (!nonVide(cs?.consigne)) v.refuse(oc, '`consigne` vide', 3)
      if (declare(cs?.materiau)) {
        vises.add(cs.materiau)
        if (!matConnu(cs.materiau)) v.refuse(oc, `matériau inconnu : ${cs.materiau}`, 4)
      } else if (mc && mc.provenance === 'genere') {
        v.refuse(oc, '`materiau_cible` est `genere` mais le cas ne nomme aucun matériau', 4)
      }

      // REFUS n° 12 et n° 13 — l'appui suit le cran (`02-` §2.2 et §2.3.4).
      const dis = cs?.distracteurs
      if (c.distracteurs === 'présent') {
        if (!Array.isArray(dis)) {
          v.refuse(oc, `le cran ${cran} exige des distracteurs`, 12)
        } else if (dis.length < 3) {
          // Le PLANCHER : « l'instance en tire TROIS » (`02-` §5) — en deçà,
          // l'écran ne peut pas se composer.
          v.refuse(oc, `${dis.length} distracteur(s) en banque — l'instance en tire `
            + 'TROIS (`02-` §5) : l\'écran ne peut pas se composer', 13)
        } else {
          // La CIBLE : 10 à 15 (`02-` §6). Hors de là le tirage reste possible :
          // on SIGNALE, on ne refuse pas.
          if (!(dis.length >= 10 && dis.length <= 15)) {
            v.signale(oc, `${dis.length} distracteurs en banque — le \`02-\` §6 en veut de 10 à 15`)
          }
          // ⭐ C4-L14 — LE CANDIDAT MUET. « Un distracteur porte DEUX choses, et
          //    la seconde est pour l'élève : `pourquoi_faux`, ce qui lui sera
          //    montré quand la correction viendra » (`08-` §5.2). Sans elle, il
          //    « s'affichera sans que rien ne dise à l'élève en quoi il ratait »
          //    (`08-` §7.3).
          // ⚠️ LE SIGNALEMENT DU COMPTE DE BANQUE, JUSTE AU-DESSUS, RESTE : le
          //    nôtre S'AJOUTE, il ne le remplace pas — l'un parle de la taille de
          //    la banque, l'autre de ce que ses entrées disent.
          let muets = 0
          for (const dd of dis) {
            if (!estObjet(dd)) continue
            clesInconnues(v, oc, dd, 'distracteur')
            if (!nonVide(dd.pourquoi_faux)) muets += 1
          }
          // ⚠️ UNE SEULE LIGNE, AGRÉGÉE, QUI EN DONNE LE COMPTE (`08-` §7.3,
          //    le patron des entrées sans rattachement au cours) : quinze
          //    candidats muets ne font pas quinze signalements, ils font UN
          //    SEUL défaut de conception.
          if (muets) {
            v.signale(oc, `${muets} distracteur(s) sans \`pourquoi_faux\` — ils s'afficheront `
              + 'sans que rien ne dise à l\'élève en quoi ils rataient')
          }
        }
      } else if (declare(dis)) {
        v.refuse(oc, `le cran ${cran} ne sert aucun distracteur`, 12)
      }

      const r = cs?.reponse_attendue
      if (c.reponseAttendue === 'présent' && !nonVide(r)) {
        v.refuse(oc, `le cran ${cran} exige une \`reponse_attendue\``, 12)
      }
      if (c.reponseAttendue === 'null' && declare(r)) {
        v.refuse(oc, `le cran ${cran} ne déclare aucune \`reponse_attendue\``, 12)
      }

      // ⭐ C4-L14 — `pourquoi_juste`, format 1.2. « Là où la réponse attendue est
      //    un CANDIDAT, elle a besoin d'un pourquoi ; ailleurs, elle EST le
      //    pourquoi » (`08-` §5.2). Le discriminant est donc la présence des
      //    DISTRACTEURS — les crans 1 et 3 —, jamais celle de la réponse
      //    attendue, qui vit aussi aux crans 4 et 5.
      // ⚠️ SON ABSENCE SIGNALE, ELLE NE REFUSE JAMAIS : « une mineure n'ajoute
      //    que des champs FACULTATIFS ; casser la compatibilité, c'est
      //    incrémenter le majeur » (`08-` §1). Un fichier de la 1.1 s'importe
      //    toujours — sans quoi ce port casserait la banque déjà produite.
      // ⚠️ SA PRÉSENCE HORS DES CRANS 1 ET 3 EST LE REFUS N° 12, celui de
      //    « l'appui qui ne suit pas le cran » — le même que le distracteur, la
      //    réponse attendue et le guide hors de leurs crans. Pas un dix-neuvième.
      const pj = cs?.pourquoi_juste
      if (c.distracteurs === 'présent') {
        if (!nonVide(pj)) {
          v.signale(oc, 'aucun `pourquoi_juste` — la correction servie avant le cas suivant '
            + 'ne pourra montrer que la réponse, pas pourquoi elle est la bonne')
        }
      } else if (declare(pj)) {
        v.refuse(oc, `le cran ${cran} ne déclare aucun \`pourquoi_juste\` : sa `
          + '`reponse_attendue` EST déjà le pourquoi', 12)
      }

      const df = cs?.defaut
      if (c.defaut === 'présent' && !nonVide(df)) {
        v.refuse(oc, `le cran ${cran} exige un \`defaut\` — c'est lui qui décide quel `
          + 'observable est isolé', 12)
      }
      if (c.defaut === 'null' && declare(df)) v.refuse(oc, `le cran ${cran} n'injecte rien`, 12)
    })

    // ── BLOCAGE n° 1 — la référence non validée, SUR LES DEUX MATÉRIAUX ─────
    // « Le texte d'auteur n'est pas toujours en source : "réécris cette phrase
    // de Descartes" le met en CIBLE. Une cible sur une référence non validée
    // bloque comme une source » (`08-` §7.2 ; piège 23).
    const dejaVus = new Set<string>()
    for (const [mat, role] of [[ms, 'source'], [mc, 'cible']] as Array<[any, string]>) {
      if (!(mat && mat.provenance === 'texte_auteur')) continue
      const id = chaine(mat.texte)
      const t = _textes.get(id)
      let validee: boolean
      // La valeur EFFECTIVE, pas celle que le fichier déclare : le blocage n° 2
      // l'a peut-être forcée à `false` juste au-dessus.
      if (t) validee = declare(t.validee) && !forcesNonValides.has(id)
      else if (deja.textes?.has(id)) validee = !!deja.textesValides?.has(id)
      else continue      // renvoi mort : le refus n° 4 l'a déjà dit — et il est
                         // RÉPARABLE, quand le blocage attend un événement qui
                         // viendra (`08-` §7.2 ; piège 23).
      if (validee || dejaVus.has(id)) continue
      dejaVus.add(id)
      v.bloque(ou, `le matériau ${role} renvoie à la référence non validée « ${id} » `
        + '— aucune instance ne tourne dessus', 1)
    }
  }

  v.entree = null

  // ── Les signalements de banque (`08-` §7.3) ───────────────────────────────
  for (const m of materiaux) {
    if (estObjet(m) && nonVide(m.id) && !vises.has(m.id)) {
      v.signale(`matériau ${m.id}`, 'visé par aucune instance')
    }
  }
  const servis = new Set(exercices
    .filter((e) => estObjet(e) && estObjet(e.materiau_source))
    .map((e) => e.materiau_source.sujet))
  for (const s of sujets) {
    if (estObjet(s) && !servis.has(s.id)) v.signale(`sujet ${s.id}`, 'servi par aucune instance')
  }
  // « Une `famille` de matériaux qui ne compte qu'un membre : aucune paire ne
  // pourra s'y faire » (`08-` §7.3).
  const familles = new Map<string, string[]>()
  for (const m of materiaux) {
    if (!estObjet(m) || !m.famille) continue
    // ⚠️ Une `famille` est un libellé LIBRE : elle peut porter une barre
    // verticale, et deux familles distinctes se confondraient sous une même
    // étiquette. On sépare par un caractère qu'un libellé ne porte pas.
    const cle = `${m.objet}\u0000${m.famille}`
    const membres = familles.get(cle) ?? []
    membres.push(m.id)
    familles.set(cle, membres)
  }
  for (const [cle, membres] of familles) {
    if (membres.length < 2) {
      const [objet, f] = cle.split('\u0000')
      v.signale(`famille « ${f} » (${objet})`, 'un seul membre — aucune paire ne pourra s\'y faire')
    }
  }

  // ── ⭐ C4-L15 — LA LONGUEUR DU MATÉRIAU SUIT LE CRAN (`02-` §2.3.3) ───────
  signaleLesMateriauxTropLongs(v, d, materiaux, exercices)

  return rendre(v, ignores, racineRefusee)
}

/**
 * ⭐ C4-L15 — LE MATÉRIAU ENTIER SERVI LÀ OÙ UNE PART SUFFISAIT.
 * Port fidèle du bloc `entier` / `_fraction_du_cran` de
 * `generateur/verifie-import.py` — mêmes verdicts sur les mêmes vecteurs.
 *
 * ⚠️⚠️ **LE CONTRÔLE EST RELATIF, ET IL DOIT L'ÊTRE.** Le `02-` §2.3.3 dit une
 * FRACTION — « le quart », « la moitié » —, **jamais un compte de phrases** :
 * « un `paragraphe` ne tient pas en deux phrases », et son seul exemple chiffré
 * — « sur cinq phrases, le quart fait deux phrases et la moitié quatre » —
 * n'est ni 5/4 ni 5/2. **Le mesurable est le RAPPORT, pas la fraction.** On
 * compare donc le matériau servi au PLUS LONG DE SA PROPRE FAMILLE, ce qui vaut
 * aux treize objets sans qu'aucun nombre soit écrit ici. ⛔ Une mesure absolue
 * condamnerait les objets `macro` à tort.
 *
 * ⛔ **C'EST UN SIGNALEMENT, JAMAIS UN REFUS**, et il ne change pas le code de
 * sortie : « `0` = importable (blocages et signalements possibles) » (`08-`
 * §7.4). Une banque versée ne se bloque pas sur une mesure approchée. Il
 * S'AJOUTE aux neuf autres, il n'en remplace aucun — la signature de
 * `controleImport` ne bouge pas d'un caractère.
 *
 * ⚠️ **IL NE PORTE QUE SUR UN `materiau_cible` DE PROVENANCE `genere`**, et
 * c'est STRUCTUREL, pas une garde à écrire : on n'entre que par `cas.materiau`,
 * qui ne nomme qu'une entrée de `materiaux[]` — laquelle est `genere` par
 * construction, « ni `provenance` : elle vaut `genere` » —, et `cas.materiau`
 * n'est renseigné que « quand le `materiau_cible` est `genere` » (`08-` §4 et
 * §5.2). Appliqué à un `materiau_source` ou à un `texte_auteur`, il crierait
 * sur des textes que personne n'a fabriqués. *Et il ne concerne que les six
 * crans qui isolent : les trois crans de production n'ont pas de cible.*
 *
 * ⚠️⚠️ **LE `08-` NE DÉCLARE PAS CE CONTRÔLE** — `grep -i "longueur|fraction|
 * trop long"` y rend ZÉRO : ni au §4, ni dans les dix-huit refus, ni dans les
 * signalements du §7.3. **C'est une dette de SOURCE, portée au registre, et pas
 * un trou à boucher ici** : le `08-` est GELÉ, et il dit lui-même qu'« en cas de
 * divergence entre ce document et l'un d'eux, l'autre a raison et celui-ci est
 * en dette ». **La source de ce contrôle est le `02-` §2.3.3.**
 */
function signaleLesMateriauxTropLongs(
  v: Verdict, d: Doctrine, materiaux: any[], exercices: any[],
): void {
  /** Au-delà, le matériau servi EST le matériau entier. */
  const ENTIER = 0.90
  /** Les deux mots que le `02-` §2.3.3 écrit — les deux seuls qui mordent. */
  const FRACTIONS = ['quart', 'moitié'] as const

  /**
   * La fraction que le `02-` §2.3.3 admet à ce cran — `null` quand il admet le
   * matériau ENTIER (crans 1 et 9), quand le cran n'a pas de cible (2, 6, 8),
   * ou quand la doctrine en base ne porte pas encore la colonne.
   *
   * ⚠️ **On ne cherche PAS à vérifier la fraction elle-même** : « le plancher
   * de l'objet l'emporte sur elle », et « une mesure au caractère près
   * condamnerait les objets `macro` à tort ». Ce qu'on attrape est le vrai
   * défaut, celui qui a duré : **le matériau ENTIER servi à un cran qui
   * demandait une part.**
   */
  const fractionDuCran = (cran: unknown): string | null => {
    const lg = (typeof cran === 'number' ? d.crans[cran]?.longueur : null) ?? ''
    return FRACTIONS.find((mot) => lg.includes(mot)) ?? null
  }

  // Le plus long de chaque famille — la référence, et elle est RELATIVE.
  // ⚠️ Une `famille` est un libellé LIBRE : il peut porter une barre verticale,
  //    et deux familles distinctes se confondraient sous une même étiquette. On
  //    sépare par un caractère qu'un libellé ne porte pas — comme le fait déjà
  //    le signalement des familles à un seul membre, juste au-dessus.
  const cleFamille = (m: any) => `${m?.objet}\u0000${m?.famille}`
  const plein = new Map<string, number>()
  const parId = new Map<string, any>()
  for (const m of materiaux) {
    if (!estObjet(m)) continue
    if (nonVide(m.id)) parId.set(String(m.id), m)
    const c = cleFamille(m)
    plein.set(c, Math.max(plein.get(c) ?? 0, String(m.contenu ?? '').length))
  }

  for (const e of exercices) {
    if (!estObjet(e)) continue
    const part = fractionDuCran(e.cran)
    if (!part) continue
    v.entree = `exercices|${e.id}`
    // ⚠️ PAS DE COERCION MUETTE : on n'itère que sur un vrai tableau. Un
    //    `cas` malformé a déjà son refus ailleurs — ici, on ne mesure rien.
    const cas0 = Array.isArray(e.cas) ? e.cas : []
    for (const [i, cas] of cas0.entries()) {
      if (!estObjet(cas)) continue
      const m = parId.get(String(cas.materiau ?? ''))
      // ⚠️ UN MATÉRIAU QUI N'EST PAS DANS LE FICHIER NE SE MESURE PAS. Le
      //    contrôle est RELATIF à sa famille, et d'un dépôt antérieur on ne
      //    connaît ici ni le contenu ni les frères de famille : mesurer sur ce
      //    qu'on a signalerait le premier matériau d'une famille tronquée.
      //    ⭐ Le script hors ligne fait exactement de même (`if not m: continue`),
      //    et le renvoi mort, lui, a déjà son refus n° 4.
      if (!m) continue
      const ref = plein.get(cleFamille(m)) ?? 0
      if (!ref) continue
      if (String(m.contenu ?? '').length / ref >= ENTIER) {
        v.signale(`exercice ${e.id}, cas ${i + 1}`,
          `le \`02-\` §2.3.3 donne au cran ${e.cran} « ${d.crans[e.cran as number]?.longueur} » `
          + `du matériau, et \`${m.id}\` est le plus long de sa famille — c'est le matériau `
          + 'ENTIER qui est servi là où une part suffisait')
      }
    }
    v.entree = null
  }
}

function rendre(v: Verdict, ignores: Record<string, string[]>,
                fichierRefuse = false): VerdictImport {
  return {
    code: v.refus.length ? 1 : 0,
    refus: v.refus, blocages: v.blocages, signalements: v.signalements,
    annonces: v.annonces, ignores, entrees: v.entrees, fichierRefuse,
  }
}
