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
// ⚠️ DEUX DIFFÉRENCES ASSUMÉES AVEC LE CONTRÔLE HORS LIGNE, et le `08-` les veut
//   toutes les deux :
//   (1) « Les renvois se résolvent dans le fichier ET DANS CE QUI EST DÉJÀ EN
//       BASE : un `texte`, un `sujet`, un `materiau` visé peut venir d'un dépôt
//       antérieur. Le contrôle hors ligne ne voit que le fichier ; LE TIEN VOIT
//       LES DEUX » (piège 10). D'où `dejaEnBase`.
//   (2) L'IDEMPOTENCE : « une entrée dont l'`id` existe déjà est IGNORÉE —
//       jamais dupliquée, jamais écrasée en silence —, et l'import rend le
//       compte de ce qu'il a ignoré, BANQUE PAR BANQUE » (`08-` §1 ; piège 11).
//       Le contrôle hors ligne n'a pas de base : il ne peut pas l'ignorer.
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
  texte: new Set(['id', 'auteur', 'titre', 'reference', 'contenu',
    'decomposition', 'validee', 'cours', 'plan_de_lecture']),
  sujet: new Set(['id', 'enonce', 'forme', 'notions', 'texte', 'cours']),
  demonstration: new Set(['id', 'competence', 'grain', 'theme', 'forme', 'corps']),
  materiau: new Set(['id', 'objet', 'support', 'contenu', 'observable', 'defaut',
    'version_corrigee', 'mode', 'famille']),
  observable: new Set(['code', 'competence']),
  exercice: new Set(['id', 'objet', 'cran', 'genre', 'lieu', 'modes',
    'observable_isole', 'materiau_source', 'materiau_cible', 'guide', 'cas', 'bonus']),
  materiau_ref: new Set(['provenance', 'support', 'texte', 'sujet', 'localisation', 'englobant']),
  cas: new Set(['consigne', 'materiau', 'defaut', 'distracteurs', 'reponse_attendue']),
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

const estObjet = (x: unknown): x is Record<string, any> =>
  typeof x === 'object' && x !== null && !Array.isArray(x)
const liste = (x: unknown): any[] => (Array.isArray(x) ? x : [])
const chaine = (x: unknown): string => (typeof x === 'string' ? x : '')
const nonVide = (x: unknown): boolean => chaine(x).trim().length > 0

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

/** Le rattachement au cours (`08-` §2, refus n° 5). L'EXISTENCE d'un cours ne se
 *  vérifie pas ici : « les cours vivent dans la plateforme et ce fichier se
 *  fabrique dehors » — l'appariement se fait à l'écran du dépôt (piège 15). */
function coursMalForme(v: Verdict, ou: string, entree: Record<string, any>) {
  const c = entree.cours
  if (c === undefined || c === null || (Array.isArray(c) && c.length === 0) || c === 'generique') return
  if (Array.isArray(c) && c.every((x) => nonVide(x))) return
  v.refuse(ou, `\`cours\` mal formé : ${JSON.stringify(c)} — attendu « generique », `
    + 'une liste de chaînes, ou rien', 5)
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

  const textes = liste(b.textes)
  const sujets = liste(b.sujets)
  const materiaux = liste(b.materiaux)
  const exercices = liste(b.exercices)
  const demonstrations = liste(b.demonstrations)
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

  // ── Les textes ────────────────────────────────────────────────────────────
  for (const t of textes) {
    if (!estObjet(t)) continue
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
    else if (verd.blocages.length) v.bloque(ou, `décomposition bloquée — ${verd.blocages[0]}`, 2)
    for (const s of verd.signalements) v.signale(ou, `décomposition — ${s}`)
  }

  // ── Les sujets ────────────────────────────────────────────────────────────
  for (const s of sujets) {
    if (!estObjet(s)) continue
    const ou = `sujet ${s.id}`
    v.entree = `sujets|${s.id}`
    clesInconnues(v, ou, s, 'sujet')
    coursMalForme(v, ou, s)
    if (!nonVide(s.enonce)) v.refuse(ou, '`enonce` vide', 3)
    // « `forme` prend LES VALEURS DU `genre` » (`08-` §3 ; piège 17).
    if (s.forme !== undefined && s.forme !== null && !formes.has(s.forme)) {
      v.refuse(ou, `\`forme\` hors des valeurs du \`genre\` : ${JSON.stringify(s.forme)}`, 5)
    }
    if (s.texte && !texteConnu(s.texte)) v.refuse(ou, `renvoie au texte inconnu ${s.texte}`, 4)
  }

  // ── Les démonstrations (`08-` §5 bis) ─────────────────────────────────────
  const grains = new Set(Object.values(d.objets).map((o) => o.grain))
  for (const dm of demonstrations) {
    if (!estObjet(dm)) continue
    const ou = `démonstration ${dm.id}`
    v.entree = `demonstrations|${dm.id}`
    clesInconnues(v, ou, dm, 'demonstration')
    if (!nonVide(dm.theme)) {
      v.refuse(ou, '`theme` vide — une démonstration porte toujours sur un thème, '
        + "et jamais celui de l'exercice servi", 3)
    }
    if (!(dm.competence in d.modesAdmis)) {
      v.refuse(ou, `compétence inconnue : ${JSON.stringify(dm.competence)}`, 5)
    }
    if (!grains.has(dm.grain)) v.refuse(ou, `grain inconnu : ${JSON.stringify(dm.grain)}`, 5)
    const forme = dm.forme
    const attendu = d.formesDemonstration
    if (!(forme in attendu)) {
      v.refuse(ou, `\`forme\` inconnue : ${JSON.stringify(forme)} — attendu `
        + Object.keys(attendu).sort().join(' · '), 5)
      continue
    }
    if (corpsDemoMalForme(forme, dm.corps)) {
      v.refuse(ou, `\`corps\` ne va pas avec la forme « ${forme} »`, 5)
    } else if (dm.grain !== attendu[forme]) {
      // SIGNALEMENT, jamais refus : « l'appariement du `06-` §2 décrit une
      // progression qui déborde l'appariement, et la règle se discute au `06-` ».
      v.signale(ou, `forme « ${forme} » au grain « ${dm.grain} » — le \`06-\` §2 `
        + `l'attend au « ${attendu[forme]} »`)
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

  // ── Les matériaux ─────────────────────────────────────────────────────────
  for (const m of materiaux) {
    if (!estObjet(m)) continue
    const ou = `matériau ${m.id}`
    v.entree = `materiaux|${m.id}`
    clesInconnues(v, ou, m, 'materiau')
    if (!(m.objet in d.objets)) v.refuse(ou, `objet inconnu : ${JSON.stringify(m.objet)}`, 5)
    if (!(SUPPORTS as readonly unknown[]).includes(m.support) || m.support == null) {
      v.refuse(ou, `\`support\` inconnu : ${JSON.stringify(m.support)}`, 5)
    }
    if (!nonVide(m.contenu)) v.refuse(ou, '`contenu` vide', 3)
    if (!(MODES as readonly unknown[]).includes(m.mode)) {
      v.refuse(ou, `mode inconnu : ${JSON.stringify(m.mode)}`, 5)
    }
    const obs = estObjet(m.observable) ? m.observable : {}
    clesInconnues(v, ou, obs, 'observable')
    if (!(obs.competence in d.modesAdmis)) {
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
  for (const e of exercices) {
    if (!estObjet(e)) continue
    const ou = `exercice ${e.id}`
    v.entree = `exercices|${e.id}`
    clesInconnues(v, ou, e, 'exercice')

    const objet = e.objet
    const o = d.objets[objet]
    if (!o) { v.refuse(ou, `objet inconnu : ${JSON.stringify(objet)}`, 5); continue }
    const cran = e.cran
    if (typeof cran !== 'number' || !Number.isInteger(cran) || !(cran in d.crans)) {
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
    if (e.bonus) {
      v.signale(ou, '`bonus` à `true` à l\'import — le drapeau est une décision du routeur')
    }

    // REFUS n° 7 — le genre (`02-` §1.3).
    const genre = e.genre
    if (o.genres.length) {
      if (!genre) {
        v.refuse(ou, `\`${objet}\` est terminal : une instance sans genre est refusée (\`02-\` §1.3)`, 7)
      } else if (!o.genres.includes(genre)) {
        v.refuse(ou, `genre \`${genre}\` inadmis pour \`${objet}\` — ${o.genres.join(' · ')}`, 7)
      }
    } else if (genre) {
      v.refuse(ou, `\`genre\` non nul sur \`${objet}\`, qui n'en porte pas`, 7)
    }

    // Les deux matériaux (`08-` §5.1).
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
          if (objet === 'phrase' && !m.englobant) {
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
      if (!(comp in d.modesAdmis)) {
        v.refuse(ou, `compétence inconnue : ${JSON.stringify(comp)}`, 5)
      } else if (!o.competences.includes(comp)) {
        v.refuse(ou, `\`${comp}\` ne figure pas dans le \`competences[]\` de \`${objet}\``, 9)
      } else if (!d.modesAdmis[comp].includes(m as string)) {
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
      if (!(comp in d.modesAdmis)) continue
      const mono = d.modesAdmis[comp].length === 1
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
      if (!obs) {
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
    } else if (obs) {
      v.refuse(ou, `le cran ${cran} n'isole rien : \`observable_isole\` doit être nul (\`04-\` §14)`, 15)
    }

    // REFUS n° 12 — le guide suit le cran.
    if (c.guide === 'null' && e.guide) v.refuse(ou, `le cran ${cran} ne sert aucun guide`, 12)
    if ((c.guide === 'complet' || c.guide === 'léger') && !nonVide(e.guide)) {
      v.refuse(ou, `le cran ${cran} exige un guide ${c.guide}`, 12)
    }
    // SIGNALEMENT — « une consigne qui nomme un observable à un cran de
    // production ferait d'`exerce` un `isole` sans que personne l'ait décidé ».
    if (e.guide && !c.isole && !obs) {
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
      if (cs?.materiau) {
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
          for (const dd of dis) clesInconnues(v, oc, dd, 'distracteur')
        }
      } else if (dis) {
        v.refuse(oc, `le cran ${cran} ne sert aucun distracteur`, 12)
      }

      const r = cs?.reponse_attendue
      if (c.reponseAttendue === 'présent' && !nonVide(r)) {
        v.refuse(oc, `le cran ${cran} exige une \`reponse_attendue\``, 12)
      }
      if (c.reponseAttendue === 'null' && r) {
        v.refuse(oc, `le cran ${cran} ne déclare aucune \`reponse_attendue\``, 12)
      }

      const df = cs?.defaut
      if (c.defaut === 'présent' && !nonVide(df)) {
        v.refuse(oc, `le cran ${cran} exige un \`defaut\` — c'est lui qui décide quel `
          + 'observable est isolé', 12)
      }
      if (c.defaut === 'null' && df) v.refuse(oc, `le cran ${cran} n'injecte rien`, 12)
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
      if (t) validee = !!t.validee
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
    const cle = `${m.objet}|${m.famille}`
    const membres = familles.get(cle) ?? []
    membres.push(m.id)
    familles.set(cle, membres)
  }
  for (const [cle, membres] of familles) {
    if (membres.length < 2) {
      const [objet, f] = cle.split('|')
      v.signale(`famille « ${f} » (${objet})`, 'un seul membre — aucune paire ne pourra s\'y faire')
    }
  }

  return rendre(v, ignores, racineRefusee)
}

function rendre(v: Verdict, ignores: Record<string, string[]>,
                fichierRefuse = false): VerdictImport {
  return {
    code: v.refus.length ? 1 : 0,
    refus: v.refus, blocages: v.blocages, signalements: v.signalements,
    annonces: v.annonces, ignores, entrees: v.entrees, fichierRefuse,
  }
}
