import 'server-only'
// ============================================================================
// CODEX — L'ÉPREUVE MINUTÉE, CÔTÉ SERVEUR. 24/09/2026.
// ----------------------------------------------------------------------------
// La porte, la lecture de l'épreuve d'une instance, ses quatre gestes
// (régler, lancer, ajouter du temps, annuler le lancement) et L'OUVERTURE
// AUTOMATIQUE DU DÉPÔT à la moitié du temps de rédaction.
//
// ⭐⭐ L'OUVERTURE AUTOMATIQUE EST PARESSEUSE, ET C'EST VOULU. Aucune tâche
//    planifiée ne la déclenche : la moindre LECTURE de l'épreuve après l'heure
//    — la page de l'élève, son sondage, l'onglet Examens, la page projetée, son
//    sondage, l'écran de passation — appelle `ouvrirLesDepots`, INCHANGÉ. Un
//    seul écrivain de l'ouverture, un seul verrou (`ouvert_par_prof_at`), une
//    seule machine d'états : `depotOuvert`, le signal, la vue et les onze
//    chemins d'écriture de l'élève ne savent pas qu'une horloge existe.
//    L'élève qui attend sur sa page la sonde toutes les quinze secondes : c'est
//    lui qui ouvre, au plus tard quinze secondes après l'heure.
//    ⚠️ `ouvert_par_prof_at` porte donc aussi une ouverture « par l'horloge ».
//       Le nom date d'avant ; le sens n'a pas bougé — c'est le PROFESSEUR qui a
//       fixé l'heure en préparant l'épreuve (décision de Louis, 24/09, qui
//       amende l'étape 4 du `02-` §6.D : « de manière automatique »).
//
// ⛔ RIEN NE SE FERME ICI. La fin de la relecture est un affichage ; la clôture
//    reste le geste du professeur (`clorLesDepots`, étape 11 bis).
//
// ⛔ LA PORTE D'ABORD, LES COLONNES ENSUITE. Porte fermée (ou absente), rien ici
//    ne lit `epreuve_*` : le code part avant `codex_epreuve_minutee.sql`.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { lireLesReglages } from '@/utils/scriptorium-params'
import { ouvrirLesDepots } from '@/utils/passation/depots'
import { passationOuverteAEleve } from '@/utils/passation/acces'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { CODE_TYPE } from './types'
import {
  etatDeLEpreuve, ouvertureAutomatique, MINUTE, BORNES_REDACTION, BORNES_RELECTURE,
  CONSIGNES_PRATIQUES_MAX, type EtatEpreuve,
} from './epreuve'

type Admin = SupabaseClient
type Ligne = Record<string, unknown>
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const un = (v: unknown): Ligne => lig(Array.isArray(v) ? v[0] : v)
const entier = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null)

export interface Refus { ok: false; message: string }
export interface Succes<T> { ok: true; data: T }
export type Issue<T> = Succes<T> | Refus
const refus = (message: string): Refus => ({ ok: false, message })
const ok = <T>(data: T): Succes<T> => ({ ok: true, data })

// ─────────────────────────────────────────────────────────────────────────────
// LA PORTE — `scriptorium_params.epreuve_minutee_actif`
// ─────────────────────────────────────────────────────────────────────────────

/** Lecture TOLÉRANTE : colonne absente (migration non jouée) ou illisible ⇒ OFF. */
export async function lireLaPorteEpreuve(admin: Admin): Promise<boolean> {
  const { data, error } = await lireLesReglages(admin)
  if (error) return false
  return !!(data as { epreuve_minutee_actif?: boolean } | null)?.epreuve_minutee_actif
}

export async function basculerLaPorteEpreuve(
  admin: Admin, actif: boolean,
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ epreuve_minutee_actif: actif })
    .eq('id', 1).select('epreuve_minutee_actif')
  if (error) {
    return { ok: false, message: error.code === '42703'
      ? 'La migration `codex_epreuve_minutee.sql` n’est pas jouée sur cette base : la porte n’existe pas encore.'
      : `Bascule refusée : ${error.message}` }
  }
  // ⚠️ Un `update` qui ne touche AUCUNE ligne ne rend pas d'erreur.
  if (!data || data.length === 0) {
    return { ok: false, message: 'Aucune ligne de configuration à mettre à jour (`scriptorium_params` id = 1 est absente).' }
  }
  return { ok: true, message: actif
    ? 'L’épreuve minutée est ouverte : sujet libre et durées à la conception, page projetée, lancement, dépôt automatique à la moitié du temps de rédaction.'
    : 'L’épreuve minutée est fermée : la conception et la passation redeviennent celles d’hier. Rien n’est effacé.' }
}

// ─────────────────────────────────────────────────────────────────────────────
// LIRE L'ÉPREUVE D'UNE INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

export interface EpreuveDeLInstance {
  exerciceId: string
  lieu: string
  statut: string
  classeId: string | null
  /** Seul l'ESSAI de Codex porte une épreuve minutée (la conception ne la pose que là). */
  estUnEssaiCodex: boolean
  redactionMin: number | null
  relectureMin: number | null
  /** L'instant du lancement, ou null. */
  debut: string | null
  /** L'instant de l'ouverture automatique, POSÉ au lancement — jamais recalculé. */
  ouverture: string | null
  consignesPratiques: string | null
  /** Le sujet et les consignes de travail — ce que lit l'élève, et le juge. */
  consigne: string
  /** La ligne de plan (son jour prévu borne le sondage de l'onglet élève). */
  planifieId: string | null
}

/** Préparée = une durée de rédaction est posée : c'est elle qui fait l'épreuve minutée. */
export function estPreparee(e: EpreuveDeLInstance | null): e is EpreuveDeLInstance & { redactionMin: number } {
  return !!e && e.redactionMin != null
}

/** La frise d'une épreuve préparée, à l'instant donné — l'heure d'ouverture POSÉE fait foi. */
export function friseDe(
  e: EpreuveDeLInstance & { redactionMin: number }, maintenantMs: number,
): EtatEpreuve {
  return etatDeLEpreuve({ debut: e.debut, ouverture: e.ouverture, redactionMin: e.redactionMin,
    relectureMin: e.relectureMin ?? 0 }, maintenantMs)
}

const CHAMPS_EPREUVE = 'id, lieu, statut, classe_id, consigne_instanciee, epreuve_redaction_min, '
  + 'epreuve_relecture_min, epreuve_debut_at, epreuve_ouverture_at, consignes_pratiques, exercices_types(code), '
  + 'exercice_planifie_id'

function normaliser(l: Ligne): EpreuveDeLInstance {
  return {
    exerciceId: txt(l.id),
    lieu: txt(l.lieu),
    statut: txt(l.statut),
    classeId: txt(l.classe_id) || null,
    estUnEssaiCodex: txt(un(l.exercices_types).code) === CODE_TYPE.codex,
    redactionMin: entier(l.epreuve_redaction_min),
    relectureMin: entier(l.epreuve_relecture_min),
    debut: txt(l.epreuve_debut_at) || null,
    ouverture: txt(l.epreuve_ouverture_at) || null,
    consignesPratiques: txt(l.consignes_pratiques) || null,
    consigne: enTexte(l.consigne_instanciee),
    planifieId: txt(l.exercice_planifie_id) || null,
  }
}

/**
 * L'épreuve d'une instance — ou `null` si la porte est fermée, si l'instance
 * n'existe pas, ou si la lecture échoue (on le dit au serveur : une lecture
 * ratée ne se lit pas comme « pas d'épreuve » sans trace).
 */
export async function lireLEpreuve(admin: Admin, exerciceId: string): Promise<EpreuveDeLInstance | null> {
  if (!(await lireLaPorteEpreuve(admin))) return null
  const { data, error } = await admin
    .from('exercices').select(CHAMPS_EPREUVE).eq('id', exerciceId).maybeSingle()
  if (error) {
    console.error(`[epreuve] instance ${exerciceId} illisible — ${error.code} ${error.message}`)
    return null
  }
  return data ? normaliser(data as unknown as Ligne) : null
}

// ─────────────────────────────────────────────────────────────────────────────
// L'OUVERTURE AUTOMATIQUE — paresseuse, par `ouvrirLesDepots` inchangé
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Si l'heure d'ouverture est passée et qu'un dépôt attend encore (`assigne`),
 * l'ouvre — par le MÊME geste que le bouton du professeur. Rend le nombre de
 * dépôts ouverts à l'instant (0 le plus souvent : c'est déjà fait).
 *
 * ⚠️ IDEMPOTENTE ET SANS COURSE : `ouvrirLesDepots` ne touche que les dépôts
 *    `assigne`, par une seule mise à jour — deux sondages simultanés ouvrent la
 *    classe une fois. Un dépôt clos (`abandonne`) n'est jamais rouvert.
 */
export async function ouvrirSiLHeureEstVenue(
  admin: Admin, e: EpreuveDeLInstance | null, maintenantMs: number = Date.now(),
): Promise<number> {
  if (!estPreparee(e) || !e.debut || e.lieu !== 'classe') return 0
  if (!friseDe(e, maintenantMs).ouvertureVenue) return 0

  // Le cas courant — tout est déjà ouvert — ne coûte qu'un compte, pas une écriture.
  const { count, error: eCompte } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true })
    .eq('exercice_id', e.exerciceId).eq('statut', 'assigne')
  if (eCompte) {
    console.error(`[epreuve] dépôts illisibles (${e.exerciceId}) — ${eCompte.code} ${eCompte.message}`)
    return 0
  }
  if (!count) return 0

  const r = await ouvrirLesDepots(admin, e.exerciceId)
  if (!r.ok) {
    console.error(`[epreuve] OUVERTURE AUTOMATIQUE REFUSÉE (${e.exerciceId}) — ${r.message}`)
    return 0
  }
  console.log(`[epreuve] dépôt ouvert automatiquement à la moitié du temps (${e.exerciceId}) — `
    + `${r.data.ouverts} dépôt(s).`)
  return r.data.ouverts
}

/** Lire, puis ouvrir si l'heure est venue — ce que font toutes les lectures. */
export async function lireEtOuvrirSiVenue(
  admin: Admin, exerciceId: string,
): Promise<{ epreuve: EpreuveDeLInstance | null; ouverts: number }> {
  const epreuve = await lireLEpreuve(admin, exerciceId)
  const ouverts = await ouvrirSiLHeureEstVenue(admin, epreuve)
  return { epreuve, ouverts }
}

// ─────────────────────────────────────────────────────────────────────────────
// LES GESTES DU PROFESSEUR
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que partagent les quatre gestes : la porte, l'instance, un essai de Codex en classe. */
async function epreuveAModifier(admin: Admin, exerciceId: string): Promise<Issue<EpreuveDeLInstance>> {
  if (!(await lireLaPorteEpreuve(admin))) {
    return refus('L’épreuve minutée est fermée (Codex → Paramètres) : rien ne se règle ni ne se lance.')
  }
  const e = await lireLEpreuve(admin, exerciceId)
  if (!e) return refus('Instance introuvable.')
  if (e.lieu !== 'classe') return refus('Cette instance n’est pas une passation en classe.')
  if (!e.estUnEssaiCodex) return refus('Seul l’examen écrit de Codex se minute.')
  if (e.statut === 'clos') return refus('Cette passation est close.')
  return ok(e)
}

/**
 * Régler l'épreuve : les deux durées (AVANT le lancement seulement) et les
 * consignes pratiques (à tout moment — une coquille se corrige en pleine
 * épreuve). Un champ `undefined` n'est pas touché ; `null` l'efface.
 */
export async function reglerLEpreuve(
  admin: Admin, exerciceId: string,
  reglage: { redactionMin?: number | null; relectureMin?: number | null; consignesPratiques?: string | null },
): Promise<Issue<EpreuveDeLInstance>> {
  const p = await epreuveAModifier(admin, exerciceId)
  if (!p.ok) return p
  const e = p.data
  const maj: Ligne = {}

  const touchesDurees = reglage.redactionMin !== undefined || reglage.relectureMin !== undefined
  if (touchesDurees && e.debut) {
    return refus('L’épreuve est lancée : les durées ne se règlent plus. Ajoutez du temps avec « +5 min ».')
  }
  if (reglage.redactionMin !== undefined) {
    const v = reglage.redactionMin
    if (v != null && (v < BORNES_REDACTION.min || v > BORNES_REDACTION.max)) {
      return refus(`La rédaction dure entre ${BORNES_REDACTION.min} et ${BORNES_REDACTION.max} minutes.`)
    }
    maj.epreuve_redaction_min = v
  }
  if (reglage.relectureMin !== undefined) {
    const v = reglage.relectureMin
    if (v != null && (v < BORNES_RELECTURE.min || v > BORNES_RELECTURE.max)) {
      return refus(`La relecture dure entre ${BORNES_RELECTURE.min} et ${BORNES_RELECTURE.max} minutes.`)
    }
    maj.epreuve_relecture_min = v
  }
  if (reglage.consignesPratiques !== undefined) {
    const v = (reglage.consignesPratiques ?? '').replace(/\r\n?/g, '\n').trim()
    if (v.length > CONSIGNES_PRATIQUES_MAX) {
      return refus(`Les consignes pratiques tiennent en ${CONSIGNES_PRATIQUES_MAX} caractères au plus.`)
    }
    maj.consignes_pratiques = v === '' ? null : v
  }
  if (Object.keys(maj).length === 0) return ok(e)
  // ⭐ Revue du 24/09 : une rédaction sans temps de relecture menait la
  //    projection de « rédaction » droit à « Temps écoulé : valide » — sans
  //    laisser à la classe le temps de photographier ni de relire. Les deux
  //    durées vont ensemble (0 reste possible, s'il est voulu).
  const redactionApres = 'epreuve_redaction_min' in maj ? maj.epreuve_redaction_min : e.redactionMin
  const relectureApres = 'epreuve_relecture_min' in maj ? maj.epreuve_relecture_min : e.relectureMin
  if (redactionApres != null && relectureApres == null) {
    return refus('Fixez aussi la durée de relecture : c’est le temps où la classe photographie sa copie et la relit.')
  }
  if (redactionApres == null && relectureApres != null) {
    return refus('Une durée de relecture sans durée de rédaction ne minute rien : fixez d’abord la rédaction.')
  }

  let requete = admin.from('exercices').update(maj).eq('id', exerciceId)
  // La garde du « avant le lancement » est TENUE PAR LA BASE, pas seulement lue.
  if (touchesDurees) requete = requete.is('epreuve_debut_at', null)
  const { data, error } = await requete.select('id')
  if (error) return refus(`Le réglage n’a pas été enregistré : ${error.message}`)
  if (!data || data.length === 0) {
    return refus('L’épreuve vient d’être lancée : les durées ne se règlent plus. Rechargez la page.')
  }
  const relue = await lireLEpreuve(admin, exerciceId)
  return relue ? ok(relue) : refus('Réglage enregistré, mais l’épreuve n’a pas pu être relue.')
}

/**
 * LANCER L'ÉPREUVE — l'instant qui fait foi, posé UNE fois.
 *
 * Il faut une durée de rédaction, et des dépôts (l'assignation les crée : sans
 * elle, aucun élève n'a de page où lire le sujet). Le sujet apparaît alors sur
 * les tablettes, et le minuteur part.
 */
export async function lancerLEpreuve(admin: Admin, exerciceId: string): Promise<Issue<{ debut: string }>> {
  const p = await epreuveAModifier(admin, exerciceId)
  if (!p.ok) return p
  const e = p.data
  if (e.debut) return refus('L’épreuve est déjà lancée.')
  if (e.redactionMin == null) return refus('Fixez d’abord la durée de rédaction.')
  if (e.statut !== 'assigne') {
    return refus('Assignez d’abord l’examen à la classe : c’est l’assignation qui donne à chaque élève sa page.')
  }
  const { count } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true }).eq('exercice_id', exerciceId)
  if (!count) return refus('Aucun élève n’a de dépôt pour cet examen : assignez-le d’abord à la classe.')

  const maintenant = Date.now()
  const debut = new Date(maintenant).toISOString()
  // ⭐ L'heure d'ouverture est POSÉE ICI, une fois : un « +5 min » ne la déplacera pas.
  const ouverture = new Date(ouvertureAutomatique(maintenant, e.redactionMin)).toISOString()
  const { data, error } = await admin.from('exercices')
    .update({ epreuve_debut_at: debut, epreuve_ouverture_at: ouverture })
    .eq('id', exerciceId).is('epreuve_debut_at', null)   // posé UNE fois : deux clics, un lancement
    .select('epreuve_debut_at')
  if (error) return refus(`Le lancement a échoué : ${error.message}`)
  if (!data || data.length === 0) return refus('L’épreuve vient d’être lancée ailleurs. Rechargez la page.')
  return ok({ debut: txt(lig(data[0]).epreuve_debut_at) || debut })
}

/**
 * ANNULER LE LANCEMENT — le filet d'un clic trop tôt. Seulement tant qu'aucun
 * dépôt n'est ouvert : après, des élèves photographient peut-être déjà, et le
 * sujet est de toute façon connu.
 */
export async function annulerLeLancement(admin: Admin, exerciceId: string): Promise<Issue<null>> {
  const p = await epreuveAModifier(admin, exerciceId)
  if (!p.ok) return p
  if (!p.data.debut) return refus('L’épreuve n’est pas lancée.')
  const { count } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true })
    .eq('exercice_id', exerciceId).not('ouvert_par_prof_at', 'is', null)
  if (count) return refus('Le dépôt est déjà ouvert : le lancement ne s’annule plus.')
  const { error } = await admin.from('exercices')
    .update({ epreuve_debut_at: null, epreuve_ouverture_at: null }).eq('id', exerciceId)
  if (error) return refus(`L’annulation a échoué : ${error.message}`)
  return ok(null)
}

/**
 * AJOUTER DU TEMPS à la phase EN COURS : à la rédaction pendant la rédaction,
 * à la relecture ensuite — et après la fin, la relecture REPREND pour cinq
 * minutes à partir de maintenant (revue du 24/09 : sans ça, le clic répondait
 * « ajouté » sans rien changer au tableau).
 * ⭐ L'heure d'ouverture du dépôt ne bouge PAS : elle est posée au lancement.
 */
export async function ajouterDuTemps(
  admin: Admin, exerciceId: string, minutes: number,
): Promise<Issue<EpreuveDeLInstance>> {
  const p = await epreuveAModifier(admin, exerciceId)
  if (!p.ok) return p
  const e = p.data
  if (!e.debut || e.redactionMin == null) return refus('L’épreuve n’est pas lancée.')
  const maintenantMs = Date.now()
  const etat = friseDe(e as EpreuveDeLInstance & { redactionMin: number }, maintenantMs)

  const colonne = etat.phase === 'redaction' ? 'epreuve_redaction_min' : 'epreuve_relecture_min'
  const actuel = etat.phase === 'redaction' ? e.redactionMin : (e.relectureMin ?? 0)
  const bornes = etat.phase === 'redaction' ? BORNES_REDACTION : BORNES_RELECTURE
  const neuf = etat.phase === 'fin' && etat.finRedactionMs != null
    // Après la fin : la relecture court jusqu'à MAINTENANT + `minutes`.
    ? Math.ceil((maintenantMs - etat.finRedactionMs) / MINUTE) + minutes
    : actuel + minutes
  if (neuf > bornes.max) return refus(`Au plus ${bornes.max} minutes.`)

  // Écriture OPTIMISTE : si la valeur a bougé entre la lecture et l'écriture
  // (deux clics, deux onglets), rien n'est écrit — on ne double pas un ajout.
  let requete = admin.from('exercices').update({ [colonne]: neuf }).eq('id', exerciceId)
  requete = e.relectureMin == null && colonne === 'epreuve_relecture_min'
    ? requete.is(colonne, null)
    : requete.eq(colonne, actuel)
  const { data, error } = await requete.select('id')
  if (error) return refus(`Le temps n’a pas été ajouté : ${error.message}`)
  if (!data || data.length === 0) return refus('La durée vient de changer ailleurs. Réessayez.')
  const relue = await lireLEpreuve(admin, exerciceId)
  return relue ? ok(relue) : refus('Temps ajouté, mais l’épreuve n’a pas pu être relue.')
}

// ─────────────────────────────────────────────────────────────────────────────
// CE QUE VOIENT LES ÉCRANS
// ─────────────────────────────────────────────────────────────────────────────

export interface CompteDesCopies {
  total: number
  ouverts: number
  remis: number
  /** Le PREMIER instant d'ouverture d'un dépôt (ISO) : le fait, pas l'horloge. */
  ouvertLe: string | null
}

/** Le compte de la classe, pour la barre du professeur (jamais projeté nominativement). */
export async function compterLesCopies(admin: Admin, exerciceId: string): Promise<CompteDesCopies> {
  const { data, error } = await admin.from('exercices_depots')
    .select('statut, ouvert_par_prof_at, v1_remis_at').eq('exercice_id', exerciceId)
  if (error) {
    console.error(`[epreuve] compte illisible (${exerciceId}) — ${error.code} ${error.message}`)
    return { total: 0, ouverts: 0, remis: 0, ouvertLe: null }
  }
  const rows = (data ?? []) as unknown as Ligne[]
  const vivants = rows.filter((d) => txt(d.statut) !== 'retire')
  const ouvertures = vivants.map((d) => txt(d.ouvert_par_prof_at)).filter(Boolean).sort()
  return {
    total: vivants.length,
    ouverts: ouvertures.length,
    remis: vivants.filter((d) => d.v1_remis_at != null).length,
    ouvertLe: ouvertures[0] ?? null,
  }
}

/**
 * Une épreuve active : l'onglet Examens charge son dépôt par `chargerVueEleve` et
 * rend l'écran de l'épreuve lui-même — le sujet, l'heure, le dépôt, la relecture.
 */
export interface EpreuveEnCours {
  depotId: string
  /** La copie est validée : l'épreuve reste à l'écran jusqu'à 30 min après la fin de la relecture ou la validation. */
  valide: boolean
  /** L'instant du lancement (ms) — l'onglet montre la plus récente d'abord. */
  debutMs: number
}

/** Après la fin de la relecture, une copie validée reste à l'écran encore ce temps (« se juger »). */
const GRACE_APRES_FIN = 30 * 60_000

/**
 * Les épreuves ACTIVES de l'élève, QUELLE QUE SOIT la classe choisie dans l'en-tête
 * (vu au bac à sable le 24/09 : un élève resté sur son autre classe ne voyait que
 * le signal, et devait appuyer — l'épreuve en cours est la sienne, pas celle d'un
 * contexte) :
 *   · `enCours` — LANCÉES, copie non validée — ou validée, tant que l'épreuve n'est
 *     pas finie (fin de la relecture + 30 min : le temps de « se juger »). Pendant
 *     ce temps, l'onglet Examens DEVIENT l'écran de l'épreuve (commentaires de Louis
 *     sur la planche du 24/09 : « si l'épreuve est en cours, le sujet doit toujours
 *     être affiché » ; « si le dépôt est ouvert, […] on doit directement voir le
 *     bouton pour faire le dépôt ») ;
 *   · `aVenir` — préparées (durée fixée) mais pas lancées : un NOMBRE, jamais un
 *     titre ni un sujet — l'onglet s'en sert seulement pour se relire seul et
 *     montrer l'épreuve à l'instant du lancement, sans que l'élève recharge.
 * Chaque lecture ouvre ce qui doit l'être : une épreuve dont l'heure est passée
 * sort d'ici et devient un signal de lancement ordinaire.
 */
export async function epreuvesDeLEleve(
  admin: Admin, eleveId: string,
  /**
   * Les classes où l'élève est INSCRIT (inscription active), toutes — pas la
   * seule classe en contexte. ⚠️ Revue du 24/09 : sans elle, un élève sorti de
   * la classe après l'assignation (ses dépôts restent) voyait le sujet au
   * lancement, et sa lecture ouvrait le dépôt de cette classe.
   */
  classesInscrites: readonly string[],
): Promise<{ enCours: EpreuveEnCours[]; aVenir: number }> {
  const vide = { enCours: [], aVenir: 0 }
  if (!(await lireLaPorteEpreuve(admin))) return vide
  // ⚠️ La passation d'abord : une carte qui mènerait à « Cet écran n'est pas
  //    encore ouvert » serait un lien qui promet une porte close (revue du 24/09).
  if (!(await passationOuverteAEleve(admin))) return vide
  const { data, error } = await admin
    .from('exercices_depots')
    .select('id, exercice_id, statut, ouvert_par_prof_at, v1_remis_at, '
      + 'exercices!inner(id, lieu, classe_id, epreuve_redaction_min)')
    .eq('eleve_id', eleveId)
    .in('statut', ['assigne', 'ouvert', 'v1_remis'])
    .eq('exercices.lieu', 'classe')
    .not('exercices.epreuve_redaction_min', 'is', null)
  if (error) {
    console.error(`[epreuve] épreuves de l'élève illisibles — ${error.code} ${error.message}`)
    return vide
  }
  const enCours: EpreuveEnCours[] = []
  let aVenir = 0
  const aujourdhui = jourDansLeFuseau(Date.now(), await lireFuseau())
  for (const d of (data ?? []) as unknown as Ligne[]) {
    if (!classesInscrites.includes(txt(un(d.exercices).classe_id))) continue
    const { epreuve } = await lireEtOuvrirSiVenue(admin, txt(d.exercice_id))
    if (!estPreparee(epreuve) || !epreuve.estUnEssaiCodex) continue
    if (!epreuve.debut) {
      // ⭐ Revue du 24/09 : l'onglet ne se relit pour une épreuve À VENIR que le JOUR
      //    prévu au plan (ou si aucun jour n'est posé) — pas pendant les jours qui
      //    séparent l'assignation de l'épreuve.
      // ⚠️ Revue du 24/09 : un dépôt déjà ouvert à la main (épreuve préparée, jamais
      //    lancée) n'attend plus rien — le compter relisait l'onglet toute la journée.
      const jour = await jourPrevu(admin, epreuve.planifieId)
      if (txt(d.statut) === 'assigne' && (jour == null || jour === aujourdhui)) aVenir++
      continue
    }
    const etat = friseDe(epreuve, Date.now())
    if (etat.ouvertureMs == null) continue
    const valide = d.v1_remis_at != null
    if (valide) {
      // ⚠️ Revue du 24/09 : la grâce court aussi depuis la VALIDATION — un élève qui
      //    valide tard (absent, transcription relancée) voyait l'épreuve disparaître
      //    à l'instant même, sans « se juger » ni la confiance.
      const remise = Date.parse(txt(d.v1_remis_at))
      const depuis = Math.max(etat.finRelectureMs ?? 0, Number.isFinite(remise) ? remise : 0)
      if (Date.now() > depuis + GRACE_APRES_FIN) continue
    }
    enCours.push({ depotId: txt(d.id), valide, debutMs: Date.parse(epreuve.debut) })
  }
  enCours.sort((a, b) => b.debutMs - a.debutMs || a.depotId.localeCompare(b.depotId))
  return { enCours, aVenir }
}

/**
 * Le sujet en texte, quelle que soit la forme stockée — RECOPIE exacte de
 * `enTexte` (`utils/passation/vues.ts`), qui importe ce module : l'importer
 * d'ici ferait une boucle.
 */
function enTexte(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map((c, i) => `${i + 1}. ${enTexte(c)}`).join('\n\n')
  if (v && typeof v === 'object') {
    const o = v as Ligne
    if (typeof o.texte === 'string') return o.texte
    if (typeof o.consigne === 'string') return o.consigne
  }
  return ''
}

/** Le jour (AAAA-MM-JJ) d'un instant, DANS LE FUSEAU du professeur. */
function jourDansLeFuseau(ms: number, fuseau: string): string {
  return new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: fuseau })
    .format(new Date(ms))
}

/** Le jour prévu de la ligne de plan — une date PURE (`jour_prevu`), ou null. */
async function jourPrevu(admin: Admin, planifieId: string | null): Promise<string | null> {
  if (!planifieId) return null
  const { data } = await admin.from('scriptorium_exercices_planifies')
    .select('jour_prevu').eq('id', planifieId).maybeSingle()
  return txt(lig(data).jour_prevu) || null
}

