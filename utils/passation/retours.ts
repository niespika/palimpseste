import 'server-only'
// ============================================================================
// C4 · L4 — L'ÉCRAN DE CORRECTION, côté serveur : révéler, éditer, valider,
//           publier, et faire valider la lecture.
// ----------------------------------------------------------------------------
// Étapes 13 à 17 du `02-exercices.md` §6.D, et l'obligation de lecture.
//
// ⚠️ CE LOT N'ENGENDRE AUCUN RETOUR. « Le retour arrive DÉJÀ SEGMENTÉ dans
//    `exercices_retours.texte` — un tableau `jsonb` de points à identifiants
//    stables. NE LE DÉCOUPE PAS : AFFICHE-LE » (piège 3 ; §1.2). C'est C4-L5
//    qui l'écrit, au traitement en lot.
//
// ⚠️ AUCUNE NOTE NE SE SAISIT, NULLE PART (piège 30). « Il n'y a aucun champ
//    `note` dans le schéma, et c'est une règle, pas un oubli » (`06-` §5).
//
// ⚠️ L'ÉDITION DU PROFESSEUR NE VAUT QUE POUR LES PASSATIONS EN CLASSE (piège 29 ;
//    §1.2) : `texte_edite_par_prof` reste NULL sur tout retour formatif de la
//    maison, et la garde serveur est en base. « Aucun écran d'édition ne se
//    construit côté maison » — celui-ci refuse le `lieu` `maison`.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PointRetour } from '@/utils/chaine/types'
import {
  refuserEdition, identifiantsInconnus, PREFIXE_POINT_DU_PROF,
} from './revelation'

// La révélation graduée et la forme du retour édité vivent au PUR
// (`revelation.ts`) : le filtrage d'un cran est exactement le genre de code
// qu'un test doit tenir. Ré-export pour que l'écran n'ait qu'un import.
export {
  CRANS_DE_REVELATION, CRAN_INITIAL, auCran, sommaireDuRetour,
  accompagnementVisible, refuserEdition, PREFIXE_POINT_DU_PROF,
} from './revelation'
export type { CranRevelation, SommaireDuRetour, RefusEdition } from './revelation'

type Admin = SupabaseClient

export interface Refus { ok: false; message: string }
export interface Succes<T = undefined> { ok: true; data: T }
export type Issue<T = undefined> = Succes<T> | Refus
const refus = (message: string): Refus => ({ ok: false, message })
const ok = <T>(data: T): Succes<T> => ({ ok: true, data })

export interface RetourDeCopie {
  id: string
  depot_id: string
  moment: 'chaud' | 'final'
  texte: PointRetour[] | null
  texte_edite_par_prof: PointRetour[] | null
  action_revision: unknown
  feed_forward: string | null
  registre_servi: string | null
  published_at: string | null
  lu_at: string | null
}

const CHAMPS = 'id, depot_id, moment, texte, texte_edite_par_prof, action_revision, '
  + 'feed_forward, registre_servi, published_at, lu_at'

export async function lireLesRetours(admin: Admin, depotId: string): Promise<RetourDeCopie[]> {
  const { data, error } = await admin
    .from('exercices_retours').select(CHAMPS).eq('depot_id', depotId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error(`[passation] retours illisibles (${depotId}) — ${error.code} ${error.message}`)
    return []
  }
  return (data ?? []) as unknown as RetourDeCopie[]
}

/**
 * Ce que l'écran affiche : le texte ÉDITÉ s'il existe, l'engendré sinon.
 *
 * ⚠️ Un tableau VIDE édité par le professeur n'est pas « pas d'édition » : c'est
 *    « le professeur a tout retiré », et la garde en base l'autorise
 *    expressément (`retour_segmente_bien_forme(…, false)` accepte `[]`). D'où le
 *    test sur `!= null`, jamais sur la longueur.
 */
export function pointsAAfficher(r: RetourDeCopie): PointRetour[] {
  return r.texte_edite_par_prof != null ? r.texte_edite_par_prof : (r.texte ?? [])
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 14 — IL PEUT MODIFIER LE RETOUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Écrit l'édition du professeur.
 *
 * ⚠️ ELLE CONSERVE LES IDENTIFIANTS, ELLE N'EN REFABRIQUE PAS (piège 31) : les
 *    identifiants viennent du retour engendré et sont ce sur quoi la
 *    contestation s'accroche. Cette fonction refuse un point dont l'identifiant
 *    n'existe pas dans le retour engendré — sauf s'il est explicitement marqué
 *    comme ajouté par le professeur (préfixe `prof:`), parce que « il peut
 *    modifier le retour » veut aussi dire « ajouter une remarque ».
 */
export async function editerLeRetour(
  admin: Admin, retourId: string, points: PointRetour[],
): Promise<Issue> {
  const { data, error: eLecture } = await admin.from('exercices_retours')
    .select('id, texte, depot_id, exercices_depots!inner(exercice_id, exercices!inner(lieu))')
    .eq('id', retourId).maybeSingle()
  if (eLecture) return refus(`Lecture du retour impossible : ${eLecture.message}`)
  if (!data) return refus('Retour introuvable.')

  const lieu = lieuDuRetour(data)
  if (lieu !== 'classe') {
    // « Aucun écran d'édition ne se construit côté maison » (§1.2 ; piège 29).
    return refus('Ce retour vient d’un exercice fait à la maison : il ne s’édite pas. '
      + 'L’édition, la validation et la publication appartiennent au flux de classe.')
  }

  const mauvais = refuserEdition(points)
  if (mauvais) return refus(mauvais.motif)

  const inconnus = identifiantsInconnus(points, (data.texte ?? []) as PointRetour[])
  if (inconnus.length) {
    return refus(`Identifiant(s) inconnu(s) : ${inconnus.join(', ')}. `
      + 'Un point ajouté par le professeur porte un identifiant préfixé « '
      + `${PREFIXE_POINT_DU_PROF} » ; les autres conservent celui du retour engendré.`)
  }

  const { error } = await admin.from('exercices_retours')
    .update({ texte_edite_par_prof: points, updated_at: new Date().toISOString() })
    .eq('id', retourId)
  if (error) {
    // 23514 = la garde de forme. On la traduit, plutôt que de la montrer nue.
    if (error.code === '23514') {
      return refus('La forme du retour édité a été refusée par la base : chaque point doit porter '
        + 'un identifiant stable et un texte non vide.')
    }
    return refus(`L’édition n’a pas été enregistrée : ${error.message}`)
  }
  return ok(undefined)
}

function lieuDuRetour(brut: unknown): string | null {
  const r = brut as Record<string, unknown>
  const depot = Array.isArray(r.exercices_depots) ? r.exercices_depots[0] : r.exercices_depots
  if (!depot || typeof depot !== 'object') return null
  const ex = (depot as Record<string, unknown>).exercices
  const e = Array.isArray(ex) ? ex[0] : ex
  if (!e || typeof e !== 'object') return null
  const lieu = (e as Record<string, unknown>).lieu
  return typeof lieu === 'string' ? lieu : null
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPES 16 ET 17 — VALIDER, PUIS PUBLIER PAR CASE À COCHER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ÉTAPE 16 — « Il valide EN MASSE OU INDIVIDUELLEMENT. »
 *
 * Valider n'est pas publier : c'est le geste par lequel le professeur arrête sa
 * correction. Il se pose sur le DÉPÔT — `corrige_par` et `corrige_at` (§1.1) —,
 * et rien de neuf ne se crée pour lui.
 *
 * ⚠️ IL N'Y A AUCUNE NOTE (piège 30) : valider une correction, ce n'est pas
 *    noter une copie.
 */
export async function validerLesCorrections(
  admin: Admin, depotIds: readonly string[], profId: string,
): Promise<Issue<{ valides: number }>> {
  if (depotIds.length === 0) return refus('Aucune copie sélectionnée.')
  const maintenant = new Date().toISOString()
  const { data, error } = await admin.from('exercices_depots')
    .update({ corrige_par: profId, corrige_at: maintenant, updated_at: maintenant })
    .in('id', depotIds as string[])
    .select('id')
  if (error) return refus(`La validation a échoué : ${error.message}`)
  return ok({ valides: (data ?? []).length })
}

/**
 * ÉTAPE 17 — « Le retour devient visible QUAND IL COCHE LA CASE DE PUBLICATION,
 * avec OBLIGATION POUR L'ÉLÈVE DE VALIDER SA LECTURE. »
 *
 * `exercices_retours.published_at` EST la case (§1.2 ; piège 32) ; le dépôt
 * passe alors à `retour_publie`.
 *
 * ⚠️ LA SÉQUENCE DE CLASSE S'ARRÊTE LÀ (piège 4 ; §1.1) : `assigne` → `ouvert`
 *    → `v1_remis` → `retour_publie`. Aucune version finale.
 */
export async function publier(
  admin: Admin, depotIds: readonly string[],
): Promise<Issue<{ publies: number; sansRetour: string[] }>> {
  if (depotIds.length === 0) return refus('Aucune copie sélectionnée.')
  const maintenant = new Date().toISOString()

  const { data: retours, error: eLecture } = await admin.from('exercices_retours')
    .select('id, depot_id, published_at').in('depot_id', depotIds as string[])
  if (eLecture) return refus(`Lecture des retours impossible : ${eLecture.message}`)

  const avecRetour = new Set((retours ?? []).map((r) => String(r.depot_id)))
  const sansRetour = depotIds.filter((id) => !avecRetour.has(id))
  const aPublier = (retours ?? []).filter((r) => !r.published_at).map((r) => String(r.id))

  if (aPublier.length) {
    const { error } = await admin.from('exercices_retours')
      .update({ published_at: maintenant, updated_at: maintenant })
      .in('id', aPublier)
    if (error) return refus(`La publication a échoué : ${error.message}`)
  }

  // Le dépôt suit le retour, et pas l'inverse : c'est la case qui commande.
  const depotsPublies = [...avecRetour]
  if (depotsPublies.length) {
    const { error } = await admin.from('exercices_depots')
      .update({ statut: 'retour_publie', updated_at: maintenant })
      .in('id', depotsPublies)
      .in('statut', ['v1_remis', 'ouvert'])
    if (error) return refus(`Le statut des dépôts n’a pas suivi : ${error.message}`)
  }
  return ok({ publies: aPublier.length, sansRetour: [...sansRetour] })
}

/** Dépublier — la case se décoche. Le retour redevient invisible à l'élève. */
export async function depublier(
  admin: Admin, depotIds: readonly string[],
): Promise<Issue<{ depublies: number }>> {
  if (depotIds.length === 0) return refus('Aucune copie sélectionnée.')
  const maintenant = new Date().toISOString()
  const { data, error } = await admin.from('exercices_retours')
    .update({ published_at: null, updated_at: maintenant })
    .in('depot_id', depotIds as string[])
    .select('id')
  if (error) return refus(`La dépublication a échoué : ${error.message}`)
  // ⚠️ `lu_at` n'est PAS effacé : un élève qui a lu a lu, et refaire disparaître
  //    sa lecture rouvrirait un blocage qu'il avait honnêtement levé.
  const { error: eStatut } = await admin.from('exercices_depots')
    .update({ statut: 'v1_remis', updated_at: maintenant })
    .in('id', depotIds as string[]).eq('statut', 'retour_publie')
  if (eStatut) return refus(`Le statut des dépôts n’a pas suivi : ${eStatut.message}`)
  return ok({ depublies: (data ?? []).length })
}

// ─────────────────────────────────────────────────────────────────────────────
// L'OBLIGATION DE LECTURE — un seul domicile pour un seul geste
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « L'élève DOIT valider sa lecture — `lu_at`. La validation de lecture ne vit
 * pas [sur le dépôt] mais SUR LE RETOUR : un seul domicile pour un seul geste »
 * (§1.1 ; piège 32). Rien n'est dupliqué côté dépôt.
 *
 * ⚠️ LA PORTE DE LA CONTESTATION RESTE OUVERTE (piège 33). « Toute contestation
 *    individuelle atteint un humain » (`06-` §7, point 2), et l'écran de
 *    contestation est C4-L3 : ma part est de ne pas fermer sa porte — les
 *    identifiants stables survivent à la publication, et `lu_at` ne les efface
 *    ni ne les fige.
 */
export async function validerLaLecture(
  admin: Admin, retourId: string, eleveId: string,
): Promise<Issue> {
  const { data, error: eLecture } = await admin.from('exercices_retours')
    .select('id, published_at, lu_at, exercices_depots!inner(eleve_id)')
    .eq('id', retourId).maybeSingle()
  if (eLecture) return refus(`Lecture impossible : ${eLecture.message}`)
  if (!data) return refus('Retour introuvable.')

  const depot = Array.isArray(data.exercices_depots) ? data.exercices_depots[0] : data.exercices_depots
  if ((depot as { eleve_id?: string } | null)?.eleve_id !== eleveId) {
    return refus('Ce retour n’est pas le vôtre.')
  }
  if (!data.published_at) return refus('Ce retour n’est pas encore publié.')
  if (data.lu_at) return ok(undefined)      // déjà lu : le geste est idempotent

  const { error } = await admin.from('exercices_retours')
    .update({ lu_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', retourId)
  return error ? refus(`La validation de lecture a échoué : ${error.message}`) : ok(undefined)
}

/** Ce que l'élève doit lire avant de pouvoir rendre autre chose. */
export async function retoursNonLus(admin: Admin, eleveId: string): Promise<RetourDeCopie[]> {
  const { data, error } = await admin.from('exercices_retours')
    .select(`${CHAMPS}, exercices_depots!inner(eleve_id)`)
    .eq('exercices_depots.eleve_id', eleveId)
    .not('published_at', 'is', null)
    .is('lu_at', null)
    .order('published_at', { ascending: true })
  if (error) {
    console.error(`[passation] retours non lus illisibles (${eleveId}) — ${error.code} ${error.message}`)
    return []
  }
  return (data ?? []) as unknown as RetourDeCopie[]
}
