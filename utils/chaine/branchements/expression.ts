// ============================================================================
// C4 · L10 — LE BRANCHEMENT DE L'EXPRESSION. Tout le calcul, aucun jugement.
// ----------------------------------------------------------------------------
// EXTRACTION, PAS RÉGÉNÉRATION. Ce fichier est le portage, fonction pour
// fonction, de `copies-tests/expression/code.py` (dépôt de conception), lui-même
// extrait de `banc-expression.py` v1.7 par plages de lignes. Il encode LES SIX
// ERREURS RÉELLEMENT MESURÉES EN JUILLET et les entrées v1.7 du 31/07 : « le
// régénérer depuis la fiche les jetterait » (`CONTRAT-MODULES.md` §7, acté le
// 31/07/2026).
//
//   La table d'extraction du contrat §7, suivie à la lettre :
//     pre_p1     ← `pre_releve`
//     code1      ← `mesures_du_releve` + `appliquer_audit` + `auto_retrait_connecteurs`
//                  + `connecteurs_ecole` + `stats_pour_p2`
//     code2      ← `croisement` + `verdict_p2`
//     conformite ← `controle_existence_citations` (+ contrôles v1.7)
//
// ⚠️ LA FICHE FAIT FOI POUR LA RÈGLE, LE MODULE POUR LE CALCUL. Lire la fiche
//    pour comprendre (`competences/expression.md`, §3 le squelette, §4 les
//    règles et le bloc machine, §5 les observables) ; lire le module pour
//    porter. Là où les deux se rencontrent — le croisement, les garde-fous, les
//    trois seuils —, ils disent la même chose, et le module la dit en nombres.
//
// ⭐ CE QUE LE PORTAGE AJOUTE, ET QUI N'EST PAS DANS LE MODULE : les NEUF
//    OBSERVABLES DE TÉLÉMÉTRIE du §5 de la fiche. Ce ne sont pas les
//    `OBSERVABLES` du module — ceux-là (`niveau`, `fluidite`, `precision`,
//    `profil`) sont ce que le BANC compare aux golds, et les deux ensembles
//    n'ont pas un seul élément commun. Le `03-` §1, gelé, dit qui les applique :
//    « il n'est pas appliqué par le module mais par LA CHAÎNE FROIDE ». Porter
//    le module ne suffit donc pas : c'est la moitié du travail, et l'autre
//    moitié ne se voit pas.
//
// ⛔ AUCUN SEUIL EN DUR pour la télémétrie : les seuils de réussite vivent au
//    bloc machine de la fiche, l'instrument dérivé les porte, et `observables.ts`
//    lit le verdict contre eux. Ici, on rend des VALEURS.
// ============================================================================

import { arrondi } from '../arrondi'
import type {
  BranchementCompetence, ContexteBranchement, RenduPrePhase, SortieCode1, SortieCode2,
} from '../instruments'

// ── Les constantes du module, à l'identique ────────────────────────────────

const NIVEAUX = ['Absent', 'Faible', 'Moyen', 'Bon', 'Acquis'] as const

/** `00-referentiel.md` §2 — la triple nomenclature, dans l'ordre du §2 de la fiche. */
const LETTRE_DU_NIVEAU: Record<string, string> = {
  Absent: 'E', Faible: 'D', Moyen: 'C', Bon: 'B', Acquis: 'A',
}

// GARDE-FOU BAS — v1.7, entrée 10 du lot. Le couperet net à 5,0 de la v1.4
// faisait un palier entier pour un rejet d'audit d'écart. LES TROIS SEUILS SONT
// PROVISOIRES (réglage empirique), et ils vivent au bloc machine de la fiche :
// ces valeurs-ci ne sont que le REPLI, quand l'instrument n'en porte pas.
const SEUIL_DENSITE_DEFAUT = 5.5
const SEUIL_ZONE_GRISE_DEFAUT = 4.5
const SEUIL_TAUX_RX_DEFAUT = 0.10

// v1.6 — la répartition des étiquettes du catalogue entre les deux dimensions.
// Liste FERMÉE : une étiquette absente des deux ensembles est signalée « hors
// catalogue », jamais comptée en silence.
const ETIQUETTES_FLUIDITE = new Set([
  'rupture_construction', 'phrase_surchargee', 'referent_flou',
  'accord_brouillant', 'registre_oral', 'ouverture_monotone', 'moule_repete',
])
const ETIQUETTES_PRECISION = new Set([
  'mot_generique', 'periphrase_vague', 'mot_impropre', 'savant_plaque',
  'repetition_pauvre',
])

/**
 * ⭐ LA FRICTION EST INTRA-PHRASE, ET LE MODULE NE LA COMPTE PAS.
 *
 * Le §5 de la fiche définit `densite_friction` comme « faits de fluidité
 * INTRA-PHRASE / 100 mots », et le §3 partage explicitement la fluidité en deux
 * tables : « dans la phrase » (les cinq ci-dessous) et « entre les phrases »
 * (`ouverture_monotone`, `moule_repete`, l'entre-phrases du même bloc). Le §2 le
 * redit : « friction — la norme est violée mais le sens passe du premier coup ».
 *
 * ⚠️ Le module, lui, ne connaît que `densite_fluidite`, qui compte LES SEPT :
 *    c'est le nombre que P2 lit pour poser son grade, et il ne bouge pas. Prendre
 *    `densite_fluidite` pour `densite_friction` ferait porter à l'observable la
 *    monotonie, que le §5 range ailleurs — et gonflerait sa valeur sans que rien
 *    ne le dise. Les deux nombres coexistent, chacun pour son usage.
 */
const ETIQUETTES_FRICTION = new Set([
  'rupture_construction', 'phrase_surchargee', 'referent_flou',
  'accord_brouillant', 'registre_oral',
])

/** §5 : `densite_generique` = (`mot_generique` + `periphrase_vague`) / 100 mots. */
const ETIQUETTES_GENERIQUE = new Set(['mot_generique', 'periphrase_vague'])

const TYPES_REUSSITE = ['formule', 'variation', 'mot_juste'] as const

// Au-delà de ce nombre de citations pour un seul type, quelque chose est
// pathologique (boucle du modèle, copie aberrante) : on le signale.
const SEUIL_ALERTE_CITATIONS = 30

// ════════════════════════════════════════════════════════════════════════════
// v1.7, entrée 5 du lot — LES CONNECTEURS D'ÉCOLE, LISTE FERMÉE.
//
// Reconnaître un connecteur d'école en début de phrase est une détection de
// motif dans une liste fermée — un calcul, donc du code, pas un jugement du
// modèle. La détection porte sur le DÉBUT DE LA PHRASE elle-même.
//
// La liste est FERMÉE et arbitrée par Louis (30 juillet 2026). Les formes sont
// écrites sous leur graphie normalisée — c'est ce que produit `normConnecteur`,
// et cela absorbe les variantes d'OCR (« c'est-à-dire », « C est a dire »).
// ════════════════════════════════════════════════════════════════════════════
const CONNECTEURS_ECOLE = [
  'tout d abord', 'ensuite', 'enfin',
  'premierement', 'deuxiemement', 'troisiemement',
  'pour conclure', 'en conclusion', 'pour finir',
  'c est a dire', 'en effet', 'ainsi', 'donc', 'alors',
] as const
/** « Par exemple » ne compte QUE répété : au moins deux ouvertures de phrase. */
const CONNECTEUR_SI_REPETE = 'par exemple'
const SEUIL_REPETITION_PAR_EXEMPLE = 2

const ACCENTS_SOURCE = 'àâäáãåéèêëíìîïóòôöõúùûüýÿñçœæ'
const ACCENTS_CIBLE = 'aaaaaaeeeeiiiiooooouuuuyyncoa'

const STOPWORDS = new Set([
  'avec', 'dans', 'pour', 'sans', 'sous', 'vers', 'chez', 'entre', 'contre',
  'mais', 'donc', 'ainsi', 'alors', 'aussi', 'comme', 'cette', 'celui',
  'celle', 'ceux', 'celles', 'elle', 'elles', 'nous', 'vous', 'leur',
  'leurs', 'être', 'sont', 'était', 'étaient', 'été', 'sera', 'serait',
  'avoir', 'avait', 'avaient', 'aura', 'aurait', 'plus', 'très', 'tout',
  'tous', 'toute', 'toutes', 'même', 'mêmes', 'autre', 'autres', 'quand',
  'lorsque', 'lorsqu', 'parce', 'puisque', 'dont', 'quel', 'quelle',
  'quels', 'quelles', 'peut', 'peuvent', 'faut', 'bien', 'cela', 'ceci',
  'encore', 'jamais', 'toujours', 'notre', 'votre',
])

// ── Les formes que la chaîne reçoit — du JSON de modèle, jamais des types ───
//
// ⚠️ Rien ici n'est garanti : ce sont des sorties de modèle, déjà validées en
//    FORME par `appel.ts` (un objet), jamais en contenu. Chaque accès descend
//    donc par un accesseur qui rend `undefined` plutôt que de lever — « une
//    entrée dont le type n'est pas celui qu'attend le contrat rend une ALERTE,
//    jamais une exception » (`CONTRAT-MODULES.md` §3).

type Objet = Record<string, unknown>

function estObjet(v: unknown): v is Objet {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function liste(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}
function texte(v: unknown): string {
  return typeof v === 'string' ? v : ''
}
/**
 * `undefined` → `null`. Python n'a qu'une absence, `None`, et elle se sérialise
 * en `null` ; JavaScript en a deux. Une clé rendue `undefined` DISPARAÎT du JSON,
 * là où le module en écrit une à `null` — deux documents différents servis au
 * même juge, et la comparaison des deux portages crierait faux là où le calcul
 * est juste.
 */
function ouNull<T>(v: T | undefined): T | null {
  return v === undefined ? null : v
}

/**
 * `int()` de Python, à l'identique — et c'est utile : `int(3.7)` vaut 3,
 * `int("3")` vaut 3, `int("3.5")` LÈVE, `int(True)` vaut 1, `int(None)` lève.
 * Un grade rendu en chaîne par le modèle doit se lire ; un grade rendu en
 * « 3,5 » doit être refusé, pas arrondi en douce.
 */
function versEntier(v: unknown): number | null {
  if (typeof v === 'boolean') return v ? 1 : 0
  if (typeof v === 'number') return Number.isFinite(v) ? Math.trunc(v) : null
  if (typeof v === 'string' && /^\s*[+-]?\d+\s*$/.test(v)) return Number.parseInt(v.trim(), 10)
  return null
}

// ── Le socle : tokeniseurs, découpe, pré-relevé ────────────────────────────

function decoupePhrases(par: string): string[] {
  return par.trim().split(/(?<=[.!?…])\s+/).map((p) => p.trim()).filter(Boolean)
}

/**
 * LE TOKENISEUR DE COMPTAGE. Il fixe `nb_mots`, donc TOUTES les densités, donc
 * les seuils du garde-fou bas. Il n'a pas bougé depuis la v1.2 — voir
 * `motsPourAffichage` juste en dessous, et pourquoi les deux restent séparés.
 */
function motsDe(t: string): string[] {
  return t.match(/[A-Za-zÀ-ÖØ-öø-ÿŒœ-]+/g) ?? []
}

/**
 * v1.7, entrée 4 — LE TOKENISEUR D'AFFICHAGE, apostrophe comprise. Il ne sert
 * qu'à composer les ouvertures de phrase du pré-relevé, pour qu'elles
 * s'affichent entières : « Tout d'abord » au lieu de « Tout d ».
 *
 * POURQUOI IL EST SÉPARÉ DE `motsDe` : ajouter l'apostrophe à la classe de
 * comptage fait de « l'homme » un mot au lieu de deux — 8,5 % des mots d'une
 * copie, 4,4 % d'une autre —, donc RELÈVE TOUTES LES DENSITÉS d'autant, et
 * resserre EN SILENCE les seuils 4,5 / 5,5. L'arbitrage revient à Louis.
 */
function motsPourAffichage(t: string): string[] {
  return t.match(/[A-Za-zÀ-ÖØ-öø-ÿŒœ’'-]+/g) ?? []
}

export interface MetaCopie {
  nb_mots: number
  nb_phrases: number
  nb_paragraphes: number
  ouvertures_paragraphes: number[]
  longueurs_phrases: number[]
  ouvertures_phrases: string[]
  repetitions_mecaniques: Record<string, number>
}

/**
 * Copie renumérotée + statistiques mécaniques — « gratuit et parfaitement
 * stable » (fiche §3).
 *
 * v1.2.1 : un PARAGRAPHE = un bloc séparé par ligne(s) vide(s) ; les retours à
 * la ligne internes (retours durs d'OCR) sont joints en espaces avant le
 * découpage en phrases.
 */
export function preReleve(copie: string): { lignes: string; stats: string; meta: MetaCopie } {
  const paras = (copie ?? '').trim().split(/\n\s*\n+/)
    .map((b) => b.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const lignes: string[] = []
  const longueurs: number[] = []
  const ouvertures: string[] = []
  const ouverturesPar: number[] = []
  const tousMots: string[] = []
  let n = 0
  paras.forEach((par, i) => {
    lignes.push(`[¶${i + 1}]`)
    ouverturesPar.push(n + 1)
    for (const ph of decoupePhrases(par)) {
      n += 1
      const mots = motsDe(ph)
      longueurs.push(mots.length)
      const motsAff = motsPourAffichage(ph)
      ouvertures.push(motsAff.length ? motsAff.slice(0, 2).join(' ') : '—')
      for (const m of mots) tousMots.push(m.toLowerCase())
      lignes.push(`  [${n}] ${ph}`)
    }
  })
  const comptes = new Map<string, number>()
  for (const w of tousMots) {
    if (w.length >= 4 && !STOPWORDS.has(w)) comptes.set(w, (comptes.get(w) ?? 0) + 1)
  }
  // `sorted(reps.items(), key=lambda x: (-x[1], x[0]))` — compte décroissant,
  // puis le mot par ORDRE DE POINTS DE CODE (jamais une comparaison localisée :
  // `localeCompare` rangerait « été » ailleurs que Python).
  const reps: Record<string, number> = {}
  for (const [w, c] of [...comptes.entries()].sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))) {
    if (c >= 3) reps[w] = c
  }
  const meta: MetaCopie = {
    nb_mots: tousMots.length, nb_phrases: n, nb_paragraphes: paras.length,
    ouvertures_paragraphes: ouverturesPar,
    longueurs_phrases: longueurs, ouvertures_phrases: ouvertures,
    repetitions_mecaniques: reps,
  }
  const listeReps = Object.entries(reps).map(([w, c]) => `« ${w} » ×${c}`).join(', ')
  const stats = [
    `Mots : ${meta.nb_mots} ; phrases : ${n} ; paragraphes : ${paras.length}.`,
    'Longueurs des phrases (mots) : '
      + longueurs.map((l, i) => `[${i + 1}]=${l}`).join(' ') + '.',
    'Mots répétés (≥3, mots-outils exclus) : ' + (listeReps || 'aucun') + '.',
    'NB : découpage automatique naïf — une « phrase » très longue peut être une '
      + "ponctuation manquante : c'est une donnée.",
  ].join('\n')
  return { lignes: lignes.join('\n'), stats, meta }
}

/**
 * v1.7, entrée 6.3 — CE QUE P2 REÇOIT DU PRÉ-RELEVÉ MÉCANIQUE.
 *
 * `ouvertures_phrases` en sort, et c'était la voie de contamination mesurée :
 * 52 des 53 rejets fantômes de l'audit Copie11 étaient des citations bien
 * formées RECOPIÉES DE CETTE LISTE — P2 rejetait des choses qui n'étaient pas au
 * relevé. `ouvertures_paragraphes` en sort aussi (décision de Louis, 30/07) : le
 * filtre D2 est appliqué par le programme AVANT que le squelette soit écrit.
 * *Un champ qu'on ne peut pas utiliser mais qu'on peut lire est une invitation à
 * s'en servir.* `nb_paragraphes` RESTE : il situe l'échelle de la copie.
 */
export function statsPourP2(meta: MetaCopie): Record<string, unknown> {
  const hors = new Set(['ouvertures_phrases', 'ouvertures_paragraphes'])
  return Object.fromEntries(Object.entries(meta).filter(([k]) => !hors.has(k)))
}

/**
 * v1.6.1 — Les phrases numérotées de la copie, pour le contrôle d'existence.
 * MÊME segmentation que `preReleve()` : si l'une change un jour, l'autre doit
 * changer avec elle.
 */
export function phrasesDeLaCopie(copie: string): Map<number, string> {
  const paras = (copie ?? '').trim().split(/\n\s*\n+/)
    .map((b) => b.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const phrases = new Map<number, string>()
  let n = 0
  for (const par of paras) for (const ph of decoupePhrases(par)) phrases.set(++n, ph)
  return phrases
}

// ── Les connecteurs d'école ─────────────────────────────────────────────────

/**
 * Graphie normalisée pour la détection des connecteurs. On neutralise ici les
 * ACCENTS — au contraire de l'appariement des citations, où un accent qui change
 * est justement ce qu'on veut voir : ici on reconnaît un motif de surface dans
 * une liste fermée, pas une citation d'élève.
 */
function normConnecteur(s: string): string {
  let t = (s ?? '').toLowerCase()
  t = [...t].map((c) => {
    const i = ACCENTS_SOURCE.indexOf(c)
    return i >= 0 ? ACCENTS_CIBLE[i] : c
  }).join('')
  t = t.replace(/[’'‘`\-–—]/g, ' ').replace(/[^a-z0-9 ]+/g, ' ')
  return t.replace(/\s+/g, ' ').trim()
}

/**
 * Le texte s'ouvre-t-il SUR ce connecteur ? Frontière de mot exigée : une phrase
 * qui commence par « Alors » compte, « Alorsque » (soudure d'OCR) non.
 */
function ouvreSur(normalise: string, connecteur: string): boolean {
  return normalise === connecteur || normalise.startsWith(`${connecteur} `)
}

/**
 * Le texte porte-t-il un connecteur, sans s'y réduire ? Sert UNIQUEMENT à la
 * trace : ces occurrences-là restent au relevé, et c'est P2 qui en juge.
 */
function contientUnConnecteur(normalise: string): boolean {
  const t = ` ${normalise} `
  return [...CONNECTEURS_ECOLE, CONNECTEUR_SI_REPETE].some((c) => t.includes(` ${c} `))
}

export interface DetectionConnecteur { phrase: number; connecteur: string }

/** v1.7, entrée 5 — les phrases OUVERTES par un connecteur d'école. */
export function connecteursEcole(phrases: Map<number, string>): DetectionConnecteur[] {
  const trouves: DetectionConnecteur[] = []
  const parExemple: DetectionConnecteur[] = []
  for (const n of [...phrases.keys()].sort((a, b) => a - b)) {
    const t = normConnecteur(phrases.get(n) ?? '')
    if (!t) continue
    if (ouvreSur(t, CONNECTEUR_SI_REPETE)) {
      parExemple.push({ phrase: n, connecteur: CONNECTEUR_SI_REPETE })
      continue
    }
    // Le plus long d'abord : la règle protège d'ajouts futurs mal ordonnés.
    for (const c of [...CONNECTEURS_ECOLE].sort((a, b) => b.length - a.length)) {
      if (ouvreSur(t, c)) { trouves.push({ phrase: n, connecteur: c }); break }
    }
  }
  if (parExemple.length >= SEUIL_REPETITION_PAR_EXEMPLE) trouves.push(...parExemple)
  return trouves.sort((a, b) => a.phrase - b.phrase)
}

export interface TraceAutoRetrait {
  note: string
  phrases_a_connecteur: number[]
  detections: DetectionConnecteur[]
  occurrences_retirees: Array<{ type: string; phrase: number | null; citation: unknown; connecteur: string | null; famille: string }>
  nb_occurrences_retirees: number
  occurrences_gardees_contenant_un_connecteur: Array<{ type: string; phrase: unknown; citation: unknown }>
}

/**
 * v1.7, entrée 6.1 — L'AUTO-RETRAIT, DÉTERMINISTE ET TRACÉ.
 *
 * Toute occurrence du relevé dont la CITATION EST un connecteur de la liste
 * fermée, à une phrase signalée, sort du relevé et des comptes. Une occurrence
 * qui CONTIENT un connecteur sans s'y réduire (« on va tout d'abord commencer »,
 * `registre_oral`) RESTE au relevé : c'est P2 qui en juge.
 *
 * Pourquoi retirer DU RELEVÉ et pas seulement des comptes : P2 ne peut rejeter
 * que ce qu'il lit. Laisser l'occurrence visible tout en l'ayant déjà soustraite
 * ouvrirait une DOUBLE SOUSTRACTION — P2 la rejetterait, et l'audit la retirerait
 * une seconde fois.
 *
 * Mutation en place de `p1`, et renvoi de la trace brut/net.
 */
export function autoRetraitConnecteurs(p1: Objet, detections: DetectionConnecteur[]): TraceAutoRetrait {
  const signalees = new Set(detections.map((d) => d.phrase))
  const retires: TraceAutoRetrait['occurrences_retirees'] = []
  const restantsContenant: TraceAutoRetrait['occurrences_gardees_contenant_un_connecteur'] = []
  for (const f of liste(p1.faits)) {
    if (!estObjet(f)) continue
    const typ = typeof f.type === 'string' ? f.type : '?'
    const gardees: unknown[] = []
    for (const c of liste(f.citations)) {
      // Une entrée qui n'est pas un objet levait une erreur et emportait tout le
      // passage, là où le contrat exige une alerte (§3).
      if (!estObjet(c)) {
        retires.push({ type: typ, phrase: null, citation: ouNull(c), connecteur: null, famille: 'illisible' })
        continue
      }
      const ph = typeof c.phrase === 'number' ? c.phrase : null
      const cit = normConnecteur(texte(c.citation))
      const estConnecteur = (CONNECTEURS_ECOLE as readonly string[]).includes(cit)
        || cit === CONNECTEUR_SI_REPETE
      if (ph !== null && signalees.has(ph) && estConnecteur) {
        retires.push({
          type: typ, phrase: ph, citation: ouNull(c.citation), connecteur: cit,
          famille: ETIQUETTES_FLUIDITE.has(typ) ? 'fluidite'
            : ETIQUETTES_PRECISION.has(typ) ? 'precision' : 'hors-catalogue',
        })
      } else {
        gardees.push(c)
        if (ph !== null && signalees.has(ph) && contientUnConnecteur(cit)) {
          restantsContenant.push({ type: typ, phrase: ph, citation: ouNull(c.citation) })
        }
      }
    }
    f.citations = gardees
  }
  return {
    note: "v1.7, entrée 6.1 du lot. Retiré du relevé ET des comptes : une occurrence dont la "
      + "citation EST un connecteur de la liste fermée, à une phrase ouverte par un connecteur. "
      + "Une occurrence qui contient un connecteur sans s'y réduire reste au relevé : c'est P2 "
      + 'qui en juge.',
    phrases_a_connecteur: [...signalees].sort((a, b) => a - b),
    detections,
    occurrences_retirees: retires,
    nb_occurrences_retirees: retires.length,
    occurrences_gardees_contenant_un_connecteur: restantsContenant,
  }
}

// ── L'appariement des citations ─────────────────────────────────────────────

/**
 * Normalisation minimale pour apparier une citation de rejet à une citation du
 * relevé. On n'en fait pas plus — un appariement trop permissif retirerait la
 * mauvaise occurrence.
 *
 * v1.7, entrée 4 : les guillemets sont RETIRÉS au lieu d'être convertis. La
 * discipline JSON de P1 lui fait encadrer les mots de l'élève de « … » ; quand
 * cet encadrement passe dans la citation elle-même, la conversion laissait deux
 * chaînes différentes et l'appariement exact échouait.
 *
 * ⚠️ Les ACCENTS ne sont PAS neutralisés : une citation qui corrige « desir » en
 *    « désir » est une réécriture, et le contrôle d'existence est là pour la voir.
 */
function norm(s: unknown): string {
  const t = texte(s).toLowerCase().trim()
  return t.replace(/[«»"“”]/g, ' ').replace(/’/g, "'").replace(/\s+/g, ' ').trim()
}

/**
 * v1.6.1 — Normalisation pour le contrôle d'existence : guillemets français ET
 * droits retirés (la discipline JSON de P1 impose « … » là où la copie porte
 * "…" — ce n'est pas une infidélité), apostrophe typographique unifiée.
 */
function normExistence(s: unknown): string {
  const t = texte(s).toLowerCase().trim()
  return t.replace(/[«»"“”]/g, ' ').replace(/’/g, "'").replace(/\s+/g, ' ').trim()
}

// ── Les mesures du relevé ───────────────────────────────────────────────────

export interface MesuresReleve {
  note: string
  connecteurs_ecole: { phrases: number[]; note: string }
  types: Array<{ type: string; famille: string; occurrences: number }>
  faits_fluidite: number
  faits_precision: number
  faits_hors_catalogue: number
  faits_total: number
  phrases_a_reconstruire: number
  phrases_perdues: number
  phrases_sans_attache: number
  taux_rx: number | null
  taux_rx_pourcent: number | null
  taux_sens_passe: number | null
  taux_sans_attache_pourcent: number
  densite_fluidite: number | null
  densite_lexique: number | null
  densite_totale: number | null
  reussites_par_type: string[]
  alertes: string[]
}

/**
 * v1.6 — TOUS les comptes, taux et densités, calculés EN CODE.
 *
 * Pourquoi : le pilote du 29 juillet a montré que P2 ne fait pas l'arithmétique
 * de façon fiable — il a compté les citations au lieu des totaux sur une copie,
 * ajouté les phrases à reconstruire au compte des faits de fluidité sur l'autre,
 * annoncé une densité incohérente avec le nombre de faits cité dans la même
 * phrase, et affirmé deux phrases perdues absentes du relevé. Aucune de ces
 * erreurs n'est une question de formulation : ce sont des sommes et des
 * quotients, et un programme les fait exactement.
 *
 * Le comptage porte sur les CITATIONS, une par occurrence. v1.7 (entrée 5) : il
 * est appelé APRÈS l'auto-retrait — les comptes que P2 lit sont donc déjà nets.
 */
export function mesuresDuReleve(
  p1: Objet, meta: MetaCopie, detections: DetectionConnecteur[] = [],
): MesuresReleve {
  const types: MesuresReleve['types'] = []
  let nFlu = 0; let nLex = 0; let nHors = 0
  const alertes: string[] = []
  for (const f of liste(p1.faits)) {
    if (!estObjet(f)) {
      // Le module lèverait ici ; le contrat §3 veut une alerte, jamais une
      // exception — « elle traverserait le banc et emporterait la trace ».
      alertes.push('entrée de `faits` illisible (ce n\'est pas un objet) — non comptée')
      continue
    }
    const typ = typeof f.type === 'string' ? f.type : '?'
    const n = liste(f.citations).length
    let fam: string
    if (ETIQUETTES_FLUIDITE.has(typ)) { fam = 'fluidite'; nFlu += n }
    else if (ETIQUETTES_PRECISION.has(typ)) { fam = 'precision'; nLex += n }
    else {
      fam = 'hors-catalogue'; nHors += n
      alertes.push(`étiquette hors catalogue : « ${typ} » (${n} occurrence(s)) `
        + '— non comptée dans les densités')
    }
    if (n > SEUIL_ALERTE_CITATIONS) {
      alertes.push(`« ${typ} » : ${n} citations, au-delà du seuil d'alerte `
        + `(${SEUIL_ALERTE_CITATIONS}) — à vérifier à la main`)
    }
    // Le champ « total » ne devrait plus exister (prompt v1.6). S'il traîne et
    // contredit le comptage, on le signale sans jamais s'y fier.
    if (f.total !== undefined && f.total !== null) {
      const decl = versEntier(f.total)
      if (decl === null) {
        alertes.push(`« ${typ} » : champ total illisible (${JSON.stringify(f.total)}) — ignoré`)
      } else if (decl !== n) {
        alertes.push(`« ${typ} » : le relevé déclare total=${decl} pour ${n} citation(s) `
          + '— le comptage des citations fait foi (prompt v1.6)')
      }
    }
    types.push({ type: typ, famille: fam, occurrences: n })
  }

  const nbMots = meta.nb_mots || 0
  const nbPhr = meta.nb_phrases || 0
  const nbPar = meta.nb_paragraphes || 0
  const recon = liste(p1.phrases_a_reconstruire).length
  const perdues = liste(p1.phrases_perdues).length
  const sansAtt = liste(p1.phrases_sans_attache).length
  const denomAtt = Math.max(1, nbPhr - nbPar)
  const d = (n: number) => (nbMots ? arrondi((n / nbMots) * 100, 2) : null)

  const typesReussite = new Set<string>()
  for (const r of liste(p1.reussites)) {
    if (estObjet(r) && typeof r.type === 'string' && r.type) typesReussite.add(r.type)
  }

  return {
    note: 'Comptes, taux et densités calculés par le programme depuis les citations du relevé. '
      + 'AVANT audit de P2. Densités pour 100 mots. Nets de l\'auto-retrait des connecteurs '
      + "d'école (v1.7).",
    connecteurs_ecole: {
      phrases: detections.map((x) => x.phrase),
      note: "Phrases ouvertes par un connecteur d'école, détectées par le programme sur une liste "
        + 'fermée. Les occurrences qui se réduisaient à l\'un d\'eux ont déjà été retirées des '
        + 'comptes ci-dessus.',
    },
    types,
    faits_fluidite: nFlu,
    faits_precision: nLex,
    faits_hors_catalogue: nHors,
    faits_total: nFlu + nLex,
    phrases_a_reconstruire: recon,
    phrases_perdues: perdues,
    phrases_sans_attache: sansAtt,
    taux_rx: nbPhr ? arrondi((recon + perdues) / nbPhr, 4) : null,
    taux_rx_pourcent: nbPhr ? arrondi(((recon + perdues) / nbPhr) * 100, 1) : null,
    taux_sens_passe: nbPhr ? arrondi(1 - (recon + perdues) / nbPhr, 4) : null,
    taux_sans_attache_pourcent: arrondi((sansAtt / denomAtt) * 100, 1),
    densite_fluidite: d(nFlu),
    densite_lexique: d(nLex),
    densite_totale: d(nFlu + nLex),
    reussites_par_type: [...typesReussite].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
    alertes,
  }
}

// ── L'audit des étiquettes rejetées par P2 ──────────────────────────────────

export interface ApresAudit {
  faits_fluidite: number
  faits_precision: number
  faits_total: number
  densite_fluidite: number | null
  densite_lexique: number | null
  densite_totale: number | null
  rejets_appliques: Array<{ type: string; phrase: unknown; raison: unknown; apparie_par: string }>
  rejets_non_apparies: Array<Record<string, unknown>>
  rejets_deja_auto_retires: Array<Record<string, unknown>>
  nb_rejets_demandes: number
  nb_rejets_appliques: number
  nb_rejets_deja_auto_retires: number
  /**
   * ⭐ AJOUT DU PORTAGE, et il ne change aucun chiffre du module : le détail des
   *    retraits PAR ÉTIQUETTE. Le module ne compte les retraits que par FAMILLE
   *    — c'est tout ce dont le garde-fou bas a besoin —, mais SEPT des neuf
   *    observables du §5 se comptent par étiquette, APRÈS audit. Sans ce détail,
   *    il faudrait refaire l'appariement une seconde fois, donc lui donner deux
   *    domiciles.
   */
  retires_par_type: Record<string, number>
}

/**
 * v1.6 — retire du comptage les occurrences que P2 a rejetées, et recalcule.
 *
 * L'appariement se fait sur (type, phrase, citation) après normalisation
 * minimale. UN REJET QU'ON NE RETROUVE PAS N'EST JAMAIS SOUSTRAIT : il est
 * consigné dans `rejets_non_apparies`. C'est la règle du chantier — pas de
 * soustraction silencieuse.
 *
 * v1.7 — `autoRetirees` reçoit les occurrences que l'auto-retrait a déjà ôtées.
 * Un rejet qui vise l'une d'elles est classé À PART : rien n'est soustrait deux
 * fois, et surtout il n'est PAS compté comme rejet fantôme. La distinction
 * compte — « zéro rejet non apparié » est un témoin de non-régression.
 */
export function appliquerAudit(
  p1: Objet, mesures: MesuresReleve, rejets: unknown, nbMots: number | null,
  autoRetirees: TraceAutoRetrait['occurrences_retirees'] = [],
): ApresAudit {
  const occ: Array<{ type: string; phrase: unknown; cit: string; retiree: boolean }> = []
  for (const f of liste(p1.faits)) {
    if (!estObjet(f)) continue
    const typ = typeof f.type === 'string' ? f.type : '?'
    for (const c of liste(f.citations)) {
      if (!estObjet(c)) continue
      occ.push({ type: typ, phrase: ouNull(c.phrase), cit: norm(c.citation), retiree: false })
    }
  }
  const famille = (typ: string) => (ETIQUETTES_FLUIDITE.has(typ) ? 'fluidite'
    : ETIQUETTES_PRECISION.has(typ) ? 'precision' : 'hors-catalogue')

  // Les clés composites passent par `JSON.stringify` : un séparateur littéral
  // serait ambigu dès qu'une étiquette en porterait un.
  const cle2 = (t: unknown, p: unknown) => JSON.stringify([t, p])
  const cle3 = (t: unknown, p: unknown, c: string) => JSON.stringify([t, p, c])
  const auto = new Set(autoRetirees.map((o) => cle2(o.type, o.phrase)))
  const autoCit = new Set(autoRetirees.map((o) => cle3(o.type, o.phrase, norm(o.citation))))

  const retires: Record<string, number> = { fluidite: 0, precision: 0, 'hors-catalogue': 0 }
  const retiresParType: Record<string, number> = {}
  const apparies: ApresAudit['rejets_appliques'] = []
  const nonApparies: ApresAudit['rejets_non_apparies'] = []
  const dejaAuto: ApresAudit['rejets_deja_auto_retires'] = []

  for (const r of liste(rejets)) {
    if (!estObjet(r)) {
      nonApparies.push({ rejet: r, motif: 'entrée illisible' })
      continue
    }
    const typ = typeof r.type === 'string' ? r.type : '?'
    const phr = ouNull(r.phrase)
    const cit = norm(r.citation)

    // 1er essai : appariement EXACT sur (type, phrase, citation).
    let cible = occ.find((o) => !o.retiree && o.type === typ && o.phrase === phr && o.cit === cit)
    let voie = 'type+phrase+citation'

    // Repli : si la citation ne correspond pas mais qu'il ne reste QU'UNE
    // occurrence de ce type dans cette phrase, l'occurrence visée est sans
    // ambiguïté. Dès qu'il y a DEUX candidates, on refuse plutôt que de deviner.
    if (!cible) {
      const cands = occ.filter((o) => !o.retiree && o.type === typ && o.phrase === phr)
      if (cands.length === 1) { [cible] = cands; voie = 'type+phrase (citation non identique)' }
    }

    if (cible) {
      cible.retiree = true
      retires[famille(typ)] += 1
      retiresParType[typ] = (retiresParType[typ] ?? 0) + 1
      apparies.push({ type: typ, phrase: phr, raison: ouNull(r.raison), apparie_par: voie })
    } else if (autoCit.has(cle3(typ, phr, cit)) || auto.has(cle2(typ, phr))) {
      dejaAuto.push({
        type: typ, phrase: phr, citation: ouNull(r.citation), raison: ouNull(r.raison),
        motif: "occurrence déjà retirée par l'auto-retrait des connecteurs d'école (v1.7, entrée "
          + "6.1) — aucune soustraction supplémentaire, et ce n'est pas un rejet fantôme",
      })
    } else {
      const deja = occ.some((o) => o.retiree && o.type === typ && o.phrase === phr)
      nonApparies.push({
        type: typ, phrase: phr, citation: ouNull(r.citation), raison: ouNull(r.raison),
        motif: deja
          ? 'toutes les occurrences de ce type dans cette phrase sont déjà retirées'
          : "aucune occurrence du relevé ne correspond, et l'appariement par (type, phrase) est "
            + 'ambigu ou vide',
      })
    }
  }

  const nFlu = Math.max(0, mesures.faits_fluidite - retires.fluidite)
  const nLex = Math.max(0, mesures.faits_precision - retires.precision)
  const d = (n: number) => (nbMots ? arrondi((n / nbMots) * 100, 2) : null)

  return {
    faits_fluidite: nFlu,
    faits_precision: nLex,
    faits_total: nFlu + nLex,
    densite_fluidite: d(nFlu),
    densite_lexique: d(nLex),
    densite_totale: d(nFlu + nLex),
    rejets_appliques: apparies,
    rejets_non_apparies: nonApparies,
    rejets_deja_auto_retires: dejaAuto,
    nb_rejets_demandes: liste(rejets).length,
    nb_rejets_appliques: apparies.length,
    nb_rejets_deja_auto_retires: dejaAuto.length,
    retires_par_type: retiresParType,
  }
}

// ── Le croisement ───────────────────────────────────────────────────────────

export interface Croisement {
  niveau_calcule: string | null
  moyenne_grades?: number
  profil_calcule?: string
  ecart_grades?: number
  densite_totale_apres_audit?: number | null
  seuil_densite?: number
  seuil_zone_grise?: number
  seuil_taux_rx_second_signal?: number
  taux_rx_du_releve?: number | null
  garde_fou_grade_zero?: boolean
  garde_fou_bas?: boolean
  garde_fou_bas_zone_grise?: boolean
  garde_fou_bas_applicable: boolean
  motifs: string[]
}

/**
 * LE CROISEMENT, CALCULÉ EN CODE (acté le 30 juillet 2026).
 *
 * « niveau = moyenne des deux grades arrondie vers le bas ; garde-fou : un grade
 * à 0 → plafond D » (fiche §4, point 4). La règle était déclarée « mécanique »
 * dans le prompt mais EXÉCUTÉE PAR LE MODÈLE — et le run 3 l'a prise en défaut
 * (Copie11, passage 2 : « Acquis » avec les grades 4 et 3, dont la moyenne 3,5
 * vaut Bon). Le niveau rendu par le modèle est conservé comme donnée, et tout
 * désaccord est signalé.
 *
 * v1.7 (entrée 10) — LE GARDE-FOU BAS PASSE EN ZONE GRISE. Le couperet net à 5,0
 * faisait un palier entier pour un rejet d'audit d'écart : 14 cellules sur 25 à
 * moins de 2 faits du seuil sur Copie2. Prix assumé, dit une fois : une copie
 * saturée mais qui ne casse pas à la lecture peut rester Moyen. Si le second
 * signal est indisponible, ON NE PLAFONNE PAS et on le dit — jamais en silence.
 */
export function croisement(
  grades: unknown, totalApresAudit: number | null, nbMots: number | null,
  tauxRx: number | null = null,
  seuil = SEUIL_DENSITE_DEFAUT,
  seuilZoneGrise = SEUIL_ZONE_GRISE_DEFAUT,
  seuilTauxRx = SEUIL_TAUX_RX_DEFAUT,
): Croisement {
  const g = estObjet(grades) ? grades : {}
  const f = versEntier(g.fluidite)
  const p = versEntier(g.precision)
  if (f === null || p === null) {
    return { niveau_calcule: null, motifs: ['grades illisibles'], garde_fou_bas_applicable: false }
  }
  if (!(f >= 0 && f <= 4 && p >= 0 && p <= 4)) {
    return { niveau_calcule: null, motifs: [`grades hors bornes : ${f}/${p}`],
      garde_fou_bas_applicable: false }
  }

  const moyenne = (f + p) / 2
  let idx = Math.floor(moyenne)
  const motifs = [`moyenne ${nombrePython(moyenne)} arrondie vers le bas → ${NIVEAUX[idx]}`]

  const gfZero = f === 0 || p === 0
  if (gfZero && idx > 1) {
    motifs.push('garde-fou : un grade à 0 → plafond Faible')
    idx = 1
  }

  let densite: number | null = null
  let applicable = false
  if (nbMots) {
    const total = versEntier(totalApresAudit)
    if (total !== null) { densite = arrondi((total / nbMots) * 100, 2); applicable = true }
  }

  const trx = tauxRx == null ? null : (Number.isFinite(Number(tauxRx)) ? Number(tauxRx) : null)
  const trxPc = trx === null ? null : arrondi(trx * 100, 1)
  const seuilPc = arrondi(seuilTauxRx * 100, 1)

  let gfBas = false
  let zoneGrise = false
  if (applicable && densite !== null) {
    if (densite >= seuil) {
      gfBas = true
      motifs.push(`garde-fou bas : densité totale après audit ${nombrePython(densite)} `
        + `≥ ${nombrePython(seuil)} → plafond Faible`)
    } else if (densite >= seuilZoneGrise) {
      zoneGrise = true
      if (trx === null) {
        motifs.push(`zone grise [${nombrePython(seuilZoneGrise)} ; ${nombrePython(seuil)}[ : densité `
          + `${nombrePython(densite)}, mais le second signal (taux_rx) est indisponible → PAS de `
          + "plafond, et l'absence de signal est consignée")
      } else if (trx >= seuilTauxRx) {
        gfBas = true
        motifs.push(`garde-fou bas : densité ${nombrePython(densite)} en zone grise `
          + `[${nombrePython(seuilZoneGrise)} ; ${nombrePython(seuil)}[ ET second signal `
          + `taux_rx ${nombrePython(trxPc)} % ≥ ${nombrePython(seuilPc)} % → plafond Faible`)
      } else {
        motifs.push(`zone grise [${nombrePython(seuilZoneGrise)} ; ${nombrePython(seuil)}[ : densité `
          + `${nombrePython(densite)}, second signal taux_rx ${nombrePython(trxPc)} % `
          + `< ${nombrePython(seuilPc)} % → pas de plafond`)
      }
    } else {
      motifs.push(`garde-fou bas non déclenché : densité ${nombrePython(densite)} `
        + `< ${nombrePython(seuilZoneGrise)}`)
    }
  } else {
    motifs.push('garde-fou bas NON APPLIQUÉ : total après audit indisponible (relevé illisible ?)')
  }

  if (gfBas && idx > 1) idx = 1

  const ecart = Math.abs(f - p)
  const profil = ecart <= 1 ? 'diagonale' : (f > p ? 'fluide-imprecis' : 'precis-raide')

  return {
    niveau_calcule: NIVEAUX[idx],
    moyenne_grades: moyenne,
    profil_calcule: profil,
    ecart_grades: ecart,
    densite_totale_apres_audit: densite,
    seuil_densite: seuil,
    seuil_zone_grise: seuilZoneGrise,
    seuil_taux_rx_second_signal: seuilTauxRx,
    taux_rx_du_releve: trx,
    garde_fou_grade_zero: gfZero,
    garde_fou_bas: gfBas,
    garde_fou_bas_zone_grise: zoneGrise,
    garde_fou_bas_applicable: applicable,
    motifs,
  }
}

/**
 * L'écriture d'un nombre dans une TRACE, telle que Python l'écrit — « 2.5 » et
 * non « 2,5 », « 5.5 » et non « 5.5000000001 », et l'entier flottant garde son
 * « .0 » : `f"{2.0}"` rend « 2.0 ».
 *
 * ⚠️ La trace se compare, mot pour mot, à celle du module (« une trace qui
 *    diverge dit qu'un chemin de calcul a changé, même quand le verdict tombe
 *    juste »). Un « 2 » là où Python écrit « 2.0 » ferait crier faux tout le
 *    contrôle, et masquerait les vraies divergences.
 */
function nombrePython(n: number | null): string {
  if (n === null) return 'None'
  return Number.isInteger(n) ? `${n}.0` : String(n)
}

// ── Le verdict de P2, rassemblé ─────────────────────────────────────────────

export interface VerdictP2 extends Croisement {
  niveau_modele: unknown
  fluidite: unknown
  precision: unknown
  profil_modele: unknown
  confiance: unknown
  apres_audit: ApresAudit
  nb_etiquettes_rejetees: number
  nb_rejets_non_apparies: number
  croisement_conforme: boolean | null
  profil_conforme: boolean | null
  crible_reussites?: CribleReussites
}

/**
 * Rassemble ce que P2 a rendu — deux grades et une liste de rejets — et ce que
 * le code calcule : les comptes après audit, le croisement, le profil. LE NIVEAU
 * QUI FAIT FOI EST `niveau_calcule`. Depuis la v1.6, P2 ne rend plus aucun
 * nombre : il n'y a donc plus rien à réconcilier de ce côté.
 */
export function verdictP2(
  p2: Objet, p1: Objet, mesures: MesuresReleve, nbMots: number | null,
  seuil = SEUIL_DENSITE_DEFAUT, seuilZoneGrise = SEUIL_ZONE_GRISE_DEFAUT,
  seuilTauxRx = SEUIL_TAUX_RX_DEFAUT,
  autoRetirees: TraceAutoRetrait['occurrences_retirees'] = [],
): VerdictP2 {
  const g = estObjet(p2.grades) ? p2.grades : {}
  const apres = appliquerAudit(p1, mesures, p2.etiquettes_rejetees, nbMots, autoRetirees)
  // v1.7 (entrée 10) : le second signal de la zone grise est le taux de phrases
  // à reconstruire ou perdues, calculé par le programme au relevé.
  const c = croisement(g, apres.faits_total, nbMots, mesures.taux_rx, seuil, seuilZoneGrise, seuilTauxRx)
  const nm = texte(p2.niveau).trim().toLowerCase()
  const nc = (c.niveau_calcule ?? '').trim().toLowerCase()
  const pm = texte(p2.profil).trim().toLowerCase()
  const pc = (c.profil_calcule ?? '').trim().toLowerCase()
  return {
    niveau_modele: ouNull(p2.niveau),
    fluidite: ouNull(g.fluidite),
    precision: ouNull(g.precision),
    profil_modele: ouNull(p2.profil),
    confiance: ouNull(p2.confiance),
    apres_audit: apres,
    nb_etiquettes_rejetees: apres.nb_rejets_demandes,
    nb_rejets_non_apparies: apres.rejets_non_apparies.length,
    ...c,
    croisement_conforme: (nm && nc) ? nm === nc : null,
    profil_conforme: (pm && pc) ? pm === pc : null,
  }
}

// ── Le crible de la réussite ────────────────────────────────────────────────

export interface CribleReussites {
  retenues_par_type: Record<string, number>
  nb_entrees: number
  nb_rejets_apparies: number
  rejets_non_apparies: Array<Record<string, unknown>>
}

/**
 * Le crible de la réussite (fiche §3 et §7) — appliqué CÔTÉ CODE.
 *
 * Le juge NOMME (un procédé en un mot, ou le mot générique remplacé) ; ici on ne
 * juge rien. Trois choses, et trois seulement :
 *
 *   1. apparier chaque rejet à une entrée de `reussites`, sur (type, phrase,
 *      citation normalisée). Un rejet qu'on ne retrouve pas n'est JAMAIS
 *      soustrait — même règle que l'audit : pas de soustraction silencieuse ;
 *   2. compter les réussites RETENUES par type ;
 *   3. signaler la contradiction du juge avec lui-même — un grade 4 posé alors
 *      qu'il a rejeté toutes les réussites qui l'ouvraient. C'est la seule façon
 *      de rendre le crible opposable : le grade reste celui du modèle, LE
 *      DÉSACCORD EST LA DONNÉE.
 *
 * *Sans crible, la réussite serait le seul jugement de P1 que l'audit ne peut
 * pas corriger — et c'est celui qui ouvre le palier le plus haut* (fiche §2).
 */
export function cribleReussites(
  p1: Objet, rejets: unknown, grades: unknown,
): { crible: CribleReussites; alertes: string[] } {
  const entrees = liste(p1.reussites).filter(estObjet)
  const index = entrees.map((r) => ({
    type: ouNull(r.type), phrase: ouNull(r.phrase), cit: norm(r.citation), rejetee: false,
  }))
  const nonApparies: Array<Record<string, unknown>> = []
  const alertes: string[] = []
  for (const rj of liste(rejets)) {
    if (!estObjet(rj)) {
      nonApparies.push({ rejet: rj, motif: 'entrée illisible' })
      continue
    }
    const cible = index.find((e) => !e.rejetee && e.type === rj.type
      && e.phrase === rj.phrase && e.cit === norm(rj.citation))
    if (!cible) {
      nonApparies.push({ rejet: rj,
        motif: 'aucune réussite du relevé ne porte ce (type, phrase, citation)' })
    } else {
      cible.rejetee = true
    }
  }
  const retenues: Record<string, number> = {}
  for (const t of TYPES_REUSSITE) {
    retenues[t] = index.filter((e) => e.type === t && !e.rejetee).length
  }
  if (nonApparies.length) {
    alertes.push(`${nonApparies.length} rejet(s) de réussite non apparié(s) `
      + "— rien n'a été retiré pour eux")
  }
  const g = estObjet(grades) ? grades : {}
  if (g.fluidite === 4 && !(retenues.formule + retenues.variation)) {
    alertes.push('CRIBLE_CONTRE_GRADE — fluidité 4 posée sans aucune réussite `formule` ou '
      + '`variation` retenue au crible')
  }
  if (g.precision === 4 && !retenues.mot_juste) {
    alertes.push('CRIBLE_CONTRE_GRADE — précision 4 posée sans aucune réussite `mot_juste` '
      + 'retenue au crible')
  }
  return {
    crible: {
      retenues_par_type: retenues,
      nb_entrees: index.length,
      nb_rejets_apparies: index.filter((e) => e.rejetee).length,
      rejets_non_apparies: nonApparies,
    },
    alertes,
  }
}

// ── Le contrôle d'existence des citations ───────────────────────────────────

export interface AlerteExistence {
  source: string
  type: string
  phrase: unknown
  citation: unknown
  etat: 'citation_vide' | 'mauvaise_phrase' | 'introuvable' | 'illisible'
  phrases_ou_le_segment_existe?: number[]
}

/**
 * v1.6.1 — CONTRÔLE D'EXISTENCE DES CITATIONS (alerte seule).
 *
 * Pourquoi : le rapport du 30 juillet 2026 a montré que P1 RÉGÉNÈRE les
 * citations au lieu de les copier — 15 infidèles sur 138, dont une traduction
 * (« can » pour « peut »), comptée dans les densités. L'audit de P2 est aveugle à
 * l'existence : il n'a pas la copie. Ce contrôle est le filet.
 *
 * Ce qu'il ne fait PAS (décision explicite, fiche §8) : il ne retire rien des
 * comptes. « Le contrôle d'existence des citations ALERTE SANS RETIRER » — le
 * pari se ferme au premier lot réel, qui dira quelle part des alertes sont de
 * vraies inventions et quelle part des artefacts de normalisation.
 */
export function controleExistenceCitations(
  p1: Objet, phrases: Map<number, string>,
): AlerteExistence[] {
  const normees = new Map<number, string>()
  for (const [n, t] of phrases) normees.set(n, normExistence(t))
  const alertes: AlerteExistence[] = []

  const verifie = (source: string, typ: string, ph: unknown, cit: unknown) => {
    const cn = normExistence(cit)
    if (!cn) {
      alertes.push({ source, type: typ, phrase: ouNull(ph), citation: ouNull(cit), etat: 'citation_vide' })
      return
    }
    if (typeof ph === 'number' && normees.has(ph) && normees.get(ph)!.includes(cn)) return
    const ailleurs = [...normees.entries()].filter(([, t]) => t.includes(cn)).map(([n]) => n)
    alertes.push({ source, type: typ, phrase: ouNull(ph), citation: ouNull(cit),
      etat: ailleurs.length ? 'mauvaise_phrase' : 'introuvable',
      phrases_ou_le_segment_existe: ailleurs })
  }

  for (const f of liste(p1.faits)) {
    if (!estObjet(f)) {
      alertes.push({ source: 'faits', type: '?', phrase: null, citation: ouNull(f), etat: 'illisible',
        phrases_ou_le_segment_existe: [] })
      continue
    }
    const typ = typeof f.type === 'string' ? f.type : '?'
    for (const c of liste(f.citations)) {
      if (!estObjet(c)) {
        alertes.push({ source: 'faits', type: typ, phrase: null, citation: ouNull(c), etat: 'illisible',
          phrases_ou_le_segment_existe: [] })
        continue
      }
      verifie('faits', typ, c.phrase, c.citation)
    }
  }
  for (const r of liste(p1.reussites)) {
    if (!estObjet(r)) {
      alertes.push({ source: 'reussites', type: '?', phrase: null, citation: ouNull(r), etat: 'illisible',
        phrases_ou_le_segment_existe: [] })
      continue
    }
    verifie('reussites', typeof r.type === 'string' ? r.type : '?', r.phrase, r.citation)
  }
  return alertes
}

/**
 * Résumé mécanique d'un squelette, porté au relevé pour qu'une relecture n'ait
 * pas à rouvrir le squelette entier pour connaître la forme du relevé.
 */
export function indexReleve(p1: Objet, nbMots: number | null): Record<string, unknown> {
  const faits: Record<string, number> = {}
  let ncit = 0
  for (const f of liste(p1.faits)) {
    if (!estObjet(f)) continue
    const n = liste(f.citations).length
    faits[typeof f.type === 'string' ? f.type : '?'] = n
    ncit += n
  }
  const total = ncit
  const ortho = estObjet(p1.orthographe) ? p1.orthographe : {}
  return {
    phrases_a_reconstruire: liste(p1.phrases_a_reconstruire).map((x) => (estObjet(x) ? ouNull(x.n) : null)),
    phrases_perdues: liste(p1.phrases_perdues).map((x) => (estObjet(x) ? ouNull(x.n) : null)),
    phrases_sans_attache_apres_filtre: liste(p1.phrases_sans_attache),
    faits_par_type: faits,
    faits_total: total,
    nb_citations: ncit,
    nb_reussites: liste(p1.reussites).length,
    orthographe_total: ouNull(ortho.total),
    densite_totale_pour_100_mots: nbMots ? arrondi((total / nbMots) * 100, 2) : null,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LES CROCHETS DU CONTRAT
// ════════════════════════════════════════════════════════════════════════════

/** Les trois seuils, lus À L'INSTRUMENT DÉRIVÉ ; les défauts ne sont qu'un repli. */
function seuils(params: Readonly<Record<string, number | string>>) {
  const lire = (nom: string, defaut: number) => {
    const v = params[nom]
    return typeof v === 'number' && Number.isFinite(v) ? v : defaut
  }
  return {
    densite: lire('seuil_densite', SEUIL_DENSITE_DEFAUT),
    zoneGrise: lire('seuil_zone_grise', SEUIL_ZONE_GRISE_DEFAUT),
    tauxRx: lire('seuil_taux_rx', SEUIL_TAUX_RX_DEFAUT),
  }
}

/**
 * `pre_p1` — le pré-relevé mécanique. Il rend DEUX des trois slots de P1 :
 * `{copie}` (RENUMÉROTÉE) et `{pre_releve}`. Le troisième, `{sujet}`, vient du
 * contexte de l'exercice, pas d'ici.
 *
 * ⚠️ LA COPIE QUE P1 LIT N'EST PAS LA COPIE BRUTE, et c'est capital : les numéros
 *    de phrase que le relevé rend s'y réfèrent. Passer la brute ferait désigner à
 *    tout le relevé les mauvaises phrases — et rien ne le dirait.
 *
 * ⭐ Le module déclare `pre_p1(texte, params)` là où le contrat §2 et le banc
 *    passent LE CONTEXTE (`pre_<phase>(contexte, params)`). Le portage suit LE
 *    CONTRAT — c'est lui qui est au manifeste — et lit la copie dans le contexte,
 *    ce que le module veut dire. *L'écart est relevé : joué tel quel, le banc
 *    lèverait sur l'Expression comme sur la Connaissance.*
 */
function prePhaseP1(ctx: ContexteBranchement): RenduPrePhase {
  const { lignes, stats } = preReleve(ctx.contexteExercice.copie ?? '')
  return { copie: lignes, pre_releve: stats }
}

/**
 * `code1` — du relevé brut de P1 au document que P2 lira. DANS L'ORDRE v1.7 :
 * filtre D2 des ouvertures → `exception_orthographe` → auto-retrait des
 * connecteurs → mesures → contrôle d'existence (sur le BRUT).
 *
 * Mutations sur une COPIE DE TRAVAIL ; le relevé brut reste disponible pour
 * l'audit et pour le contrôle d'existence.
 */
function code1(
  artefactsP1: Record<string, unknown>, ctx: ContexteBranchement,
): SortieCode1 {
  const brut = artefactsP1.p1
  const texteCopie = ctx.contexteExercice.copie ?? ''
  if (!estObjet(brut)) {
    return { mesures: {}, document_p2: null,
      alertes: ['P1 illisible : aucun document pour P2'] }
  }
  const { stats: _stats, meta } = preReleve(texteCopie)
  const phrasesCopie = phrasesDeLaCopie(texteCopie)

  const obj = JSON.parse(JSON.stringify(brut)) as Objet
  const objBrut = JSON.parse(JSON.stringify(brut)) as Objet

  // Filtre mécanique D2 (acquis du run 2) : la première phrase d'un paragraphe
  // ne peut pas être « sans attache » — l'entre-blocs est à la STRUCTURE, pas à
  // l'Expression.
  const ouv = new Set(meta.ouvertures_paragraphes)
  const sa = liste(obj.phrases_sans_attache)
  const rejetes = sa.filter((x) => typeof x === 'number' && ouv.has(x))
  if (rejetes.length) {
    obj.phrases_sans_attache = sa.filter((x) => !(typeof x === 'number' && ouv.has(x)))
  }

  // `exception_orthographe` — LE FILTRE EN AVAL (fiche §4 ; `07-` §1.3). Il tombe
  // ICI : après le relevé, avant le comptage ET avant le document que P2 lira,
  // pour que ni les densités ni le juge ne voient l'occurrence. Retirer après le
  // comptage laisserait le grade inchangé et ne servirait à rien.
  //
  // ⚠️ LE PROMPT N'EST JAMAIS MODIFIÉ — P1 relève exactement les mêmes faits pour
  //    tous les élèves. « Un prompt modifié par élève ferait diverger
  //    l'`instrument_version` et rendrait ses mesures incomparables. » C'est le
  //    SEUL endroit où la mécanique touche la lettre.
  const traceOrtho: string[] = []
  if (ctx.exceptionOrthographe) {
    const restants: unknown[] = []
    let retires = 0
    for (const f of liste(obj.faits)) {
      if (estObjet(f) && f.type === 'accord_brouillant') {
        retires += liste(f.citations).length
        continue
      }
      restants.push(f)
    }
    obj.faits = restants
    traceOrtho.push(`exception_orthographe : ${retires} occurrence(s) \`accord_brouillant\` `
      + 'retirée(s) du relevé avant comptage et avant le document de P2 (fiche §4) — le prompt, '
      + "lui, n'a pas bougé")
  }

  const detections = connecteursEcole(phrasesCopie)
  const traceAuto = autoRetraitConnecteurs(obj, detections)
  const mesures = mesuresDuReleve(obj, meta, detections)
  const existence = controleExistenceCitations(objBrut, phrasesCopie)

  const document = {
    stats_mecaniques: statsPourP2(meta),
    releve_p1: obj,
    mesures_calculees: mesures,
  }

  const alertes = [...mesures.alertes]
  if (traceAuto.nb_occurrences_retirees) {
    alertes.push(`auto-retrait : ${traceAuto.nb_occurrences_retirees} occurrence(s) réduite(s) `
      + "à un connecteur d'école, retirée(s) du relevé et des comptes (tracé)")
  }
  alertes.push(...traceOrtho)
  if (rejetes.length) {
    alertes.push(`filtre D2 : ${rejetes.length} ouverture(s) de paragraphe rejetée(s) de `
      + `phrases_sans_attache (${JSON.stringify(rejetes)})`)
  }
  if (existence.length) {
    alertes.push(`citations : ${existence.length} infidèle(s) au contrôle d'existence `
      + "(alerte seule — rien retiré, rien ajouté au document de P2)")
  }

  return {
    mesures: {
      meta: { nb_mots: meta.nb_mots, nb_phrases: meta.nb_phrases,
        nb_paragraphes: meta.nb_paragraphes },
      releve: indexReleve(obj, meta.nb_mots),
      releve_brut_avant_auto_retrait: indexReleve(objBrut, meta.nb_mots),
      auto_retrait_connecteurs: traceAuto,
      ouvertures_rejetees_du_sans_attache: rejetes,
      exception_orthographe: ctx.exceptionOrthographe,
      controle_existence_citations: {
        note: 'Alerte seule (v1.6.1, 30/07/2026) : rien n\'est retiré des comptes, rien n\'est '
          + 'ajouté au document de P2. Contrôle passé sur le relevé BRUT (v1.7).',
        nb_citations_infideles: existence.length,
        alertes: existence,
      },
      // ⭐ Ce que la TÉLÉMÉTRIE lira, et que le module ne porte pas : le pré-relevé
      //    dont `code2` a besoin pour compter les observables du §5 par étiquette.
      _pour_telemetrie: { meta, mesures_avant_audit: mesures, releve_p1: obj },
    },
    document_p2: document,
    alertes,
  }
}

// ── Les neuf observables du §5, et le silence qu'ils feraient ──────────────

const OBSERVABLES_TELEMETRIE = [
  'taux_sens_passe', 'densite_friction', 'attache_presente', 'densite_generique',
  'mot_impropre', 'savant_plaque', 'repetition_pauvre', 'reussites', 'orthographe',
] as const

/**
 * Les NEUF observables de télémétrie du §5, comptés APRÈS AUDIT.
 *
 * ⭐ POURQUOI APRÈS AUDIT : « la chaîne froide les dérive du RELEVÉ JUGÉ »
 *    (`07-` §2, entrée C4-L5). L'audit est le crible où P2 rejette les étiquettes
 *    que la citation ne porte pas — « ce crible PROTÈGE L'ÉLÈVE d'un relevé trop
 *    zélé » (fiche §4, étape 1). Une étiquette rejetée n'est pas un fait de la
 *    langue de l'élève : la compter contre lui serait mesurer le zèle de P1.
 *
 * ⚠️ Chaque observable a SA VALEUR, OU SON ALERTE NOMMÉE. Une entrée absente
 *    rendrait `n/a`, `n/a` sort du dénominateur du taux, et l'escalade N1/N2
 *    deviendrait aveugle sur cet observable POUR TOUJOURS, SANS UN SYMPTÔME. Une
 *    absence délibérée SE DÉCLARE.
 */
function telemetrie(
  meta: MetaCopie, avantAudit: MesuresReleve, releveJuge: Objet, apres: ApresAudit,
  crible: CribleReussites,
): { valeurs: Record<string, number | string | boolean | null>; alertes: string[] } {
  const valeurs: Record<string, number | string | boolean | null> = {}
  const alertes: string[] = []
  const nbMots = meta.nb_mots || 0

  // Les comptes PAR ÉTIQUETTE, après audit : le relevé (déjà net de
  // l'auto-retrait et du filtre D2) moins ce que l'audit a apparié.
  const parType: Record<string, number> = {}
  for (const f of liste(releveJuge.faits)) {
    if (!estObjet(f)) continue
    const typ = typeof f.type === 'string' ? f.type : '?'
    parType[typ] = (parType[typ] ?? 0) + liste(f.citations).length
  }
  const apresAudit = (typ: string) => Math.max(0, (parType[typ] ?? 0) - (apres.retires_par_type[typ] ?? 0))
  const densiteDe = (etiquettes: Set<string>, code: string): number | null => {
    if (!nbMots) {
      alertes.push(`${code} : la copie ne porte AUCUN mot comptable — densité sans dénominateur, `
        + 'valeur non déclarée (`n/a`), jamais 0')
      return null
    }
    let n = 0
    for (const t of etiquettes) n += apresAudit(t)
    return arrondi((n / nbMots) * 100, 2)
  }

  // 1. `taux_sens_passe` — proportion de phrases dont le sens passe du premier
  //    coup. « LE signal de la coupure D/C. » L'audit ne le touche pas : P2
  //    rejette des ÉTIQUETTES, jamais un tag de sens.
  if (avantAudit.taux_sens_passe === null) {
    alertes.push('taux_sens_passe : la copie ne porte aucune phrase — proportion sans '
      + 'dénominateur, valeur non déclarée (`n/a`), jamais 0')
  } else {
    valeurs.taux_sens_passe = avantAudit.taux_sens_passe
  }

  // 2. `densite_friction` — faits de fluidité INTRA-PHRASE / 100 mots (§5). Ce
  //    n'est PAS `densite_fluidite`, qui compte aussi la monotonie (§3).
  const friction = densiteDe(ETIQUETTES_FRICTION, 'densite_friction')
  if (friction !== null) valeurs.densite_friction = friction

  // 3. `attache_presente` — proportion de phrases, HORS OUVERTURES DE PARAGRAPHE,
  //    qui s'accrochent à la précédente.
  //
  //    ⚠️ Le dénominateur est ici `nb_phrases − nb_paragraphes`, SANS le
  //       `max(1, …)` du module. Le module en a besoin pour ne pas diviser par
  //       zéro dans un affichage ; l'observable, lui, doit dire « pas d'occasion »
  //       — une copie d'une phrase par paragraphe n'a AUCUNE attache à mesurer, et
  //       lui rendre 1,0 serait déclarer une réussite là où rien n'a été mesuré.
  const denomAttache = meta.nb_phrases - meta.nb_paragraphes
  if (denomAttache <= 0) {
    alertes.push('attache_presente : aucune phrase hors ouverture de paragraphe — il n\'y a '
      + 'aucune attache à mesurer, valeur non déclarée (`n/a`), jamais 1')
  } else {
    valeurs.attache_presente = arrondi(1 - avantAudit.phrases_sans_attache / denomAttache, 4)
  }

  // 4-7. Les quatre observables lexicaux, par étiquette, après audit (§5).
  const generique = densiteDe(ETIQUETTES_GENERIQUE, 'densite_generique')
  if (generique !== null) valeurs.densite_generique = generique
  for (const code of ['mot_impropre', 'savant_plaque', 'repetition_pauvre'] as const) {
    const v = densiteDe(new Set([code]), code)
    if (v !== null) valeurs[code] = v
  }

  // 8. `reussites` — « au moins une réussite citée ET RETENUE AU CRIBLE — la
  //    condition du grade 4 » (bloc machine, `sens`). C'est donc le compte des
  //    RETENUES, jamais celui des entrées du relevé.
  valeurs.reussites = Object.values(crible.retenues_par_type).reduce((a, b) => a + b, 0)

  // 9. `orthographe` — comptage, TÉLÉMÉTRIE SEULE : « aucune mesure n'y est
  //    réussie ni ratée » (bloc machine, `reussie: sans_objet`). Le total est
  //    déclaré par P1 à côté de ses citations ; on le confronte au comptage, et
  //    une valeur illisible rend UNE ALERTE, JAMAIS UNE VALEUR PAR DÉFAUT.
  //
  //    ⚠️ `exception_orthographe` ne le touche pas, et c'est voulu : le filtre
  //       retire `accord_brouillant` de la LISTE DE FAITS, jamais de la liste
  //       `orthographe` — « toute faute d'accord qui laisse la lecture unique est
  //       bénigne et va dans `orthographe` » (fiche §3).
  const ortho = estObjet(releveJuge.orthographe) ? releveJuge.orthographe : null
  if (!ortho) {
    alertes.push("orthographe : le relevé de P1 ne porte pas de bloc `orthographe` — valeur non "
      + 'déclarée (`n/a`), jamais 0')
  } else {
    const declare = versEntier(ortho.total)
    const cites = liste(ortho.citations).length
    if (declare === null) {
      alertes.push(`orthographe : total illisible (${JSON.stringify(ortho.total)}) — valeur non `
        + 'déclarée (`n/a`), jamais un repli sur le comptage des citations')
    } else {
      valeurs.orthographe = declare
      if (declare !== cites) {
        alertes.push(`orthographe : le relevé déclare total=${declare} pour ${cites} citation(s) `
          + '— la valeur déclarée est retenue, l\'écart est consigné')
      }
    }
  }

  // Le contrôle de complétude, et il est le cœur du « fait quand » : AUCUN des
  // neuf ne part en silence.
  for (const code of OBSERVABLES_TELEMETRIE) {
    if (!(code in valeurs) && !alertes.some((a) => a.startsWith(`${code} :`))) {
      alertes.push(`${code} : observable du §5 NON CALCULÉ, et sans motif — c'est le trou que le `
        + 'lot existe pour fermer (`01-` §8.2 : il sortirait du dénominateur sans un symptôme)')
    }
  }
  return { valeurs, alertes }
}

/**
 * `code2` — l'audit des rejets puis le croisement. Trois clés publiques, et deux
 * canaux privés.
 *
 * LE NIVEAU QUI FAIT FOI EST LE NIVEAU CALCULÉ ; celui du modèle est conservé en
 * donnée et tout désaccord est signalé.
 */
function code2(
  artefactP2: unknown, sortieCode1: SortieCode1, ctx: ContexteBranchement,
): SortieCode2 {
  // Les trois seuils viennent du BLOC MACHINE de la fiche, servis par
  // l'instrument dérivé — « aucun seuil en dur nulle part : la table est la
  // seule maison des seuils » (`CONTRAT-MODULES.md` §4). Les défauts de ce
  // fichier ne sont qu'un repli, et ils valent ceux de la fiche.
  //
  // ⚠️ `exception_orthographe` est déclaré au bloc machine comme paramètre, mais
  //    sa valeur est celle DE L'ÉLÈVE (`profiles`, `07-` §1.3) : la chaîne la
  //    sert par `ctx.exceptionOrthographe`, et `code1` seul la lit. Le défaut du
  //    bloc machine (`false`) est le comportement hors exception, jamais une
  //    valeur à recopier.
  const params = ctx.parametres
  const doc = estObjet(sortieCode1.document_p2) ? sortieCode1.document_p2 : {}
  const p1 = doc.releve_p1
  const mesures = doc.mesures_calculees as MesuresReleve | undefined
  const stats = estObjet(doc.stats_mecaniques) ? doc.stats_mecaniques : {}
  const nbMots = typeof stats.nb_mots === 'number' ? stats.nb_mots : null
  const pourTele = estObjet(sortieCode1.mesures._pour_telemetrie)
    ? sortieCode1.mesures._pour_telemetrie as { meta: MetaCopie }
    : null

  if (!estObjet(artefactP2) || !estObjet(p1) || !mesures || !estObjet(mesures as unknown)) {
    return {
      verdicts: { niveau: null, fluidite: null, precision: null, profil: null },
      trace: [],
      alertes: ['CODE2_SANS_ENTREE — P2, relevé ou mesures illisibles : aucun verdict calculé'],
      _audit: {},
      _telemetrie: { valeurs: {}, alertes: OBSERVABLES_TELEMETRIE.map((c) => `${c} : la chaîne `
        + "n'a pas d'entrée exploitable (P2, relevé ou mesures illisibles) — valeur non déclarée") },
    }
  }

  const s = seuils(params)
  const traceAuto = estObjet(sortieCode1.mesures.auto_retrait_connecteurs)
    ? sortieCode1.mesures.auto_retrait_connecteurs as unknown as TraceAutoRetrait
    : null
  const auto = traceAuto?.occurrences_retirees ?? []
  const v = verdictP2(artefactP2, p1, mesures, nbMots, s.densite, s.zoneGrise, s.tauxRx, auto)

  const alertes: string[] = []
  if (v.niveau_calcule === null) {
    alertes.push(`croisement impossible : ${v.motifs.join(' ; ')}`)
  }
  if (v.croisement_conforme === false) {
    alertes.push(`le modèle disait « ${String(v.niveau_modele)} », le croisement calcule `
      + `« ${v.niveau_calcule} » — le calcul fait foi, le désaccord est la donnée`)
  }
  if (v.profil_conforme === false) {
    alertes.push(`profil du modèle « ${String(v.profil_modele)} » contre profil calculé `
      + `« ${v.profil_calcule} »`)
  }
  if (v.nb_rejets_non_apparies) {
    alertes.push(`${v.nb_rejets_non_apparies} rejet(s) d'audit non apparié(s) — rien n'a été `
      + 'soustrait pour eux')
  }

  const { crible, alertes: aCrible } = cribleReussites(
    p1, artefactP2.reussites_rejetees, artefactP2.grades)
  alertes.push(...aCrible)
  v.crible_reussites = crible

  const tele = pourTele
    ? telemetrie(pourTele.meta, mesures, p1, v.apres_audit, crible)
    : { valeurs: {}, alertes: OBSERVABLES_TELEMETRIE.map((c) => `${c} : le pré-relevé de Code1 `
        + "n'est pas parvenu à Code2 — valeur non déclarée (`n/a`)") }

  return {
    verdicts: {
      niveau: v.niveau_calcule,
      fluidite: (v.fluidite ?? null) as number | string | null,
      precision: (v.precision ?? null) as number | string | null,
      profil: v.profil_calcule ?? null,
    },
    trace: [...v.motifs],
    alertes,
    // Canal PRIVÉ du crochet `conformite` (`CONTRAT` §3) : le tiret bas le
    // déclare, et rien d'autre ne le lit.
    _audit: v,
    // Canal PRIVÉ de la télémétrie — même marque, même règle. Il ne va pas au
    // banc : les observables du §5 n'entrent dans aucun gold.
    _telemetrie: tele,
  }
}

/**
 * `conformite` — P2 est-il resté dans son rôle de juge : rien de calculé, pas de
 * fantômes, pas de niveau contraire au croisement.
 */
const CHAMPS_INTERDITS_P2 = ['faits_total', 'densite', 'densites', 'comptes',
  'total', 'taux', 'mesures'] as const

function conformite(
  _artefactsP1: Record<string, unknown>, artefactP2: unknown,
  _sortieCode1: SortieCode1, sortieCode2: SortieCode2,
): string[] {
  const alertes: string[] = []
  if (estObjet(artefactP2)) {
    for (const champ of CHAMPS_INTERDITS_P2) {
      if (champ in artefactP2) {
        alertes.push(`CONFORMITE — P2 rend un champ de calcul « ${champ} » : depuis la v1.6, `
          + 'tout nombre vient du bloc de mesures, pas du modèle')
      }
    }
  }
  const d = estObjet(sortieCode2._audit) ? sortieCode2._audit as unknown as VerdictP2 : null
  for (const r of d?.apres_audit?.rejets_non_apparies ?? []) {
    alertes.push(`CONFORMITE — rejet fantôme : ${String(r.type)} / phrase ${String(r.phrase)} `
      + `(${String(r.motif)})`)
  }
  if (d?.croisement_conforme === false) {
    alertes.push('CONFORMITE — le niveau déclaré par P2 contredit le croisement calculé '
      + '(donnée conservée, calcul fait foi)')
  }
  return alertes
}

// ════════════════════════════════════════════════════════════════════════════
// LE BRANCHEMENT
// ════════════════════════════════════════════════════════════════════════════

export const BRANCHEMENT_EXPRESSION: BranchementCompetence = {
  /**
   * ⭐ C5-L3 — `composer` SEUL. L'Expression est mono-mode (fiche §6), la table
   *    dérivée `competences_modes_admis` ne lui admet que `composer`, et elle
   *    n'est pas de celles à qui le `03-` §4 permet une grille réceptive. **Ici
   *    l'admis et le couvert coïncident**, et c'est le cas le plus simple des six.
   */
  modesCouverts: ['composer'],
  /**
   * UN SEUL APPEL D'EXTRACTION, TOUJOURS. L'Expression est mono-mode
   * (`composer` seul, fiche §6) et n'a ni référent ni aligneur : la Synthèse est
   * la seule des six à en avoir deux.
   */
  extractions: () => [{
    cle: 'p1',
    tetePrompt: 'P1',
    // `{sujet}` n'est pas ici : il vient du contexte de l'exercice.
    slotsFournis: ['copie', 'pre_releve'],
    pre: prePhaseP1,
  }],

  /** Un seul slot au prompt P2 : c'est le document, sans déclaration. */
  jugement: () => ({ tetePrompt: 'P2' }),

  code1,

  code2,

  conformite,

  /**
   * `00-referentiel.md` §2 — Absent/Faible/Moyen/Bon/Acquis = E/D/C/B/A. Le
   * palier vient du niveau CALCULÉ, jamais de celui que le modèle a déclaré.
   */
  lettre: (c2) => {
    const niveau = c2.verdicts?.niveau
    return typeof niveau === 'string' ? (LETTRE_DU_NIVEAU[niveau] ?? null) : null
  },

  releve: (c2) => {
    const t = estObjet(c2._telemetrie)
      ? c2._telemetrie as { valeurs: Record<string, number | string | boolean | null>; alertes: string[] }
      : null
    // « Ce qui récapitule RECOPIE la trace, il ne la recalcule jamais » (§3).
    if (!t) {
      return { releve: {},
        alertes: ['les observables de télémétrie ne sont pas parvenus de Code2 — les neuf du §5 '
          + 'sortiraient en `n/a`'] }
    }
    return { releve: t.valeurs, alertes: t.alertes }
  },

  /**
   * ⛔ `delta` N'EST PAS DÉCLARÉ, ET C'EST UNE ABSENCE MOTIVÉE.
   *
   * « Ce que "comparer deux squelettes" veut dire dépend de la grille : la source
   * ne le définit pas hors de la fiche, donc le branchement le porte » — or LA
   * FICHE DE L'EXPRESSION NE LE DÉFINIT NULLE PART : ni son §4, ni son §5, ni son
   * bloc machine ne disent ce que comparer un relevé de v1 à un relevé de version
   * finale veut dire pour elle. L'inventer ici serait trancher une règle de
   * grille depuis le code, ce qu'aucun lot ne fait.
   *
   * La chaîne le dit alors par une alerte et laisse NULL — c'est le comportement
   * voulu. ⚠️ ET NULL N'EST PAS 0 : « ne rends jamais 0 pour "rien changé" » —
   * une passation en classe n'a pas de version finale, et les deux cas ne se
   * confondent pas. *Ce que ça coûte tant que la fiche se tait : N2 reste aveugle
   * au signal de réceptivité sur l'Expression. La question est au relevé.*
   */
}

