import 'server-only'
// ============================================================================
// C4 · L4 — LE FLUX DE LA PASSATION EN CLASSE, côté serveur.
// ----------------------------------------------------------------------------
// Les dix-huit étapes du `02-exercices.md` §6.D, et rien d'autre. Ce module ne
// mesure rien, ne route rien, n'escalade rien : il ouvre, dépose, transcrit,
// valide, met en file, corrige, publie.
//
// ⚠️ CE LOT NE CRÉE AUCUNE LIGNE DE DÉPÔT. « `exercices_depots` est créée DÈS
//    L'ASSIGNATION, pas au dépôt » (§1.1 ; piège 7) — et c'est C4-L8 qui le
//    fait déjà (`app/prof/conception/actions.ts`, `assignerALaClasse` : une
//    ligne par élève inscrit, `origine` `prof`). Ici, l'ouverture du professeur
//    ne fait que les HORODATER. Un lot qui créerait la ligne au moment de la
//    photo priverait de sa ligne l'élève qui ne dépose rien — or c'est elle qui
//    porte « sa fenêtre, son déroulé », et c'est elle que l'assiduité compte
//    (§1.5 ; piège 57).
//
// ⚠️ TOUTES LES ÉCRITURES D'ÉLÈVE PASSENT PAR LE SERVEUR (§1 ; piège 52).
//    C4-L1 n'a posé AUCUNE policy élève sur les vingt tables — vérifié par
//    requête le 22/08 : une seule policy par table, `*_prof_all`. Ce lot est LE
//    PREMIER à faire écrire un élève dans ces tables, et il n'ouvre aucune
//    lecture : tout passe par le client admin, dans des actions serveur qui
//    vérifient que l'élève est bien celui du dépôt.
//
// ⚠️ AUCUNE NOTE, NULLE PART. « Il n'y a aucun champ `note` dans le schéma, et
//    c'est une règle, pas un oubli » (`06-` §5 ; `02-` §6.D, étape 15 ; §1.1).
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { mettreEnFile, etatDesJobs, relancerUnJob, type EtatLisible } from '@/utils/chaine/file'
import { ETAPE_MESURE_V1, ETAPE_RETOUR_V1 } from './file-copie'
import { cheminPage, prefixeDepot, BUCKET } from './chemins'
import { refuserPhotos, renumeroter, type Photo } from './photos'
import { lireConfigPassation } from './config'
import { normaliserRetours, type Doute } from './transcription-calcul'
import type { CollageBloque, MoyenDeCollage } from './collage'

type Admin = SupabaseClient

/**
 * La séquence d'une passation en CLASSE : elle s'arrête à `retour_publie`.
 *
 * « Aucune version finale en classe […] La garde serveur `garde_depot_lieu`
 * refuse en `classe` le statut `vf_remis` et les CINQ champs de version finale »
 * (piège 4 ; §1.1). ⚠️ Corollaire : `delta_v1_vf` est NULL sur ces dépôts, ET
 * NULL N'EST PAS ZÉRO — lire ce NULL comme un zéro fabriquerait un faux signal
 * du faisceau (`06-` §6). Rien ici ne l'écrit ni ne le lit.
 */
export const SEQUENCE_CLASSE = ['assigne', 'ouvert', 'v1_remis', 'retour_publie'] as const
export type StatutClasse = (typeof SEQUENCE_CLASSE)[number]

export interface Refus { ok: false; message: string }
export interface Succes<T = undefined> { ok: true; data: T }
export type Issue<T = undefined> = Succes<T> | Refus

const refus = (message: string): Refus => ({ ok: false, message })
const ok = <T>(data: T): Succes<T> => ({ ok: true, data })

// ─────────────────────────────────────────────────────────────────────────────
// CE QU'ON LIT
// ─────────────────────────────────────────────────────────────────────────────

export interface DepotDePassation {
  id: string
  eleve_id: string
  exercice_id: string
  statut: string
  photos_v1: Photo[] | null
  /** La copie de l'élève EXEMPTÉ, tapée au clavier — il n'y a pas eu de photo. */
  texte_v1: string | null
  transcription_v1: string | null
  confiance_ocr_v1: number | null
  transcription_v1_doutes: Doute[] | null
  confiance_declaree: Record<string, string> | null
  message_lisibilite_reporte: string | null
  ouvert_par_prof_at: string | null
  ouvert_at: string | null
  v1_remis_at: string | null
  juger_debut_at: string | null
  juger_fin_at: string | null
  commentaire_general: string | null
  corrige_par: string | null
  corrige_at: string | null
  /** Le journal des tentatives de collage BLOQUÉES — rapporté au professeur. */
  collages_bloques: CollageBloque[] | null
  /** L'instance dont il vient — le `lieu` commande tout, jamais le module. */
  exercice: {
    id: string
    lieu: string
    classe_id: string | null
    consigne_instanciee: unknown
    optin_se_juger: boolean
    optin_confiance_remise: boolean
    cran: string | null
    statut: string
  }
}

const CHAMPS_DEPOT =
  'id, eleve_id, exercice_id, statut, photos_v1, texte_v1, transcription_v1, '
  + 'confiance_ocr_v1, '
  + 'transcription_v1_doutes, confiance_declaree, message_lisibilite_reporte, '
  + 'ouvert_par_prof_at, ouvert_at, v1_remis_at, juger_debut_at, juger_fin_at, '
  + 'commentaire_general, corrige_par, corrige_at, collages_bloques, '
  + 'exercice:exercices!inner(id, lieu, classe_id, consigne_instanciee, optin_se_juger, '
  + 'optin_confiance_remise, cran, statut)'

function normaliser(brut: unknown): DepotDePassation | null {
  if (!brut || typeof brut !== 'object') return null
  const d = brut as Record<string, unknown>
  const ex = Array.isArray(d.exercice) ? d.exercice[0] : d.exercice
  if (!ex || typeof ex !== 'object') return null
  return { ...(d as unknown as DepotDePassation), exercice: ex as DepotDePassation['exercice'] }
}

export async function lireDepot(admin: Admin, depotId: string): Promise<DepotDePassation | null> {
  const { data, error } = await admin
    .from('exercices_depots').select(CHAMPS_DEPOT).eq('id', depotId).maybeSingle()
  if (error) {
    console.error(`[passation] dépôt illisible ${depotId} — ${error.code} ${error.message}`)
    return null
  }
  return normaliser(data)
}

/**
 * Tous les dépôts d'une instance — le tableau de la classe, côté professeur.
 *
 * ⚠️ PAGINÉ. supabase-js « plafonne toute réponse à mille lignes sans rien
 *    signaler » — c'est la panne de `chaine_depense_du_mois` réparée le 21/08 et
 *    celle que C4-L8-bis va réparer sur la doctrine (piège 61). Une classe de
 *    trente-cinq ne l'atteint pas ; un jour où l'écran lira plusieurs instances,
 *    si. On pagine, et on confronte au décompte que la base annonce.
 */
export async function lireDepotsDeLInstance(
  admin: Admin, exerciceId: string,
): Promise<{ depots: DepotDePassation[]; tronque: boolean }> {
  const PAGE = 500
  const out: DepotDePassation[] = []
  let de = 0
  let annonce: number | null = null
  for (;;) {
    const { data, error, count } = await admin
      .from('exercices_depots').select(CHAMPS_DEPOT, { count: 'exact' })
      .eq('exercice_id', exerciceId)
      .order('id', { ascending: true })       // clé UNIQUE : une page ne saute rien
      .range(de, de + PAGE - 1)
    if (error) {
      console.error(`[passation] dépôts illisibles (${exerciceId}) — ${error.code} ${error.message}`)
      return { depots: out, tronque: true }
    }
    if (annonce == null) annonce = count ?? null
    const lot = (data ?? []).map(normaliser).filter((d): d is DepotDePassation => d !== null)
    out.push(...lot)
    if (lot.length < PAGE) break
    de += PAGE
  }
  // Le contrôle qui compte : ce qu'on a lu contre ce que la base annonce.
  const tronque = annonce != null && out.length !== annonce
  if (tronque) {
    console.error(`[passation] LECTURE TRONQUÉE — ${out.length} dépôt(s) lus, ${annonce} annoncés `
      + `par la base pour l'instance ${exerciceId}.`)
  }
  return { depots: out, tronque }
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 4 — L'OUVERTURE DU DÉPÔT, ACTION MANUELLE DU PROFESSEUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « Le professeur OUVRE LE DÉPÔT au bout d'une quarantaine de minutes — c'est
 * une ACTION MANUELLE, jamais une fenêtre calendaire » (`02-` §6.D, étape 4 ;
 * piège 8). Elle s'horodate à `ouvert_par_prof_at` (§1.1).
 *
 * ⚠️ ELLE COMMANDE DEUX CHOSES, et la seconde est un garde-fou de terrain :
 *    le dépôt des photos, ET la relisibilité de la transcription — « la
 *    transcription n'est relisible qu'APRÈS que le professeur a ouvert le
 *    dépôt » (`02-` §6.D). Voir `depotOuvert()`.
 *
 * ⚠️ AUCUNE MINUTERIE NE FERME QUOI QUE CE SOIT (piège 10) : « la durée est
 *    indicative » (`02-` §2.4), et c'est l'ouverture du dépôt qui fait passer à
 *    la suite. Rien ici ne lit `fenetre_fin`.
 */
export async function ouvrirLesDepots(
  admin: Admin, exerciceId: string,
): Promise<Issue<{ ouverts: number; deja: number }>> {
  const { data: ex, error: eEx } = await admin
    .from('exercices').select('id, lieu, statut').eq('id', exerciceId).maybeSingle()
  if (eEx) return refus(`Lecture de l'instance impossible : ${eEx.message}`)
  if (!ex) return refus('Instance inconnue.')
  if (ex.lieu !== 'classe') {
    // « Ce qui commande le comportement est le `lieu`, jamais le module. »
    return refus('Cette instance n’est pas une passation en classe : son `lieu` vaut '
      + `« ${String(ex.lieu)} ». L’ouverture manuelle du dépôt n’a de sens qu’en classe.`)
  }

  const maintenant = new Date().toISOString()
  // On n'ouvre QUE ce qui attend : un élève déjà à `v1_remis` ne redescend pas,
  // et un dépôt `retire` ou `abandonne` n'est pas rouvert par mégarde.
  const { data: ouverts, error } = await admin.from('exercices_depots')
    .update({ statut: 'ouvert', ouvert_at: maintenant, ouvert_par_prof_at: maintenant })
    .eq('exercice_id', exerciceId).eq('statut', 'assigne')
    .select('id')
  if (error) return refus(`L'ouverture a échoué : ${error.message}`)

  // Un dépôt déjà ouvert garde SON horodatage : « l'ouverture manuelle du
  // dépôt » est un instant, pas un état qu'on repose à chaque clic.
  const { count: deja } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true })
    .eq('exercice_id', exerciceId).not('ouvert_par_prof_at', 'is', null)

  return ok({ ouverts: (ouverts ?? []).length, deja: Math.max(0, (deja ?? 0) - (ouverts ?? []).length) })
}

/** Le garde-fou de terrain, lisible partout : rien n'est relisible avant l'ouverture. */
export function depotOuvert(d: DepotDePassation): boolean {
  return d.ouvert_par_prof_at != null
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 5 — L'ÉLÈVE DÉPOSE LUI-MÊME, DEPUIS SON COMPTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Prépare les URL signées. « L'élève dépose LUI-MÊME, depuis son compte » —
 * « ce qui règle l'appariement élève ↔ pages SANS en-tête pré-imprimé, SANS
 * code à scanner et SANS journal de réattribution » (`06-` §1 ; piège 9).
 * Aucun QR, aucun en-tête imprimé, aucun écran de réattribution n'est fabriqué.
 */
export async function preparerDepotDesPhotos(
  admin: Admin, depotId: string, eleveId: string, nb: number,
): Promise<Issue<{ uploads: Array<{ ordre: number; path: string; token: string }> }>> {
  const config = lireConfigPassation()
  const d = await lireDepot(admin, depotId)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')
  if (d.exercice.lieu !== 'classe') return refus('Ce dépôt n’est pas une passation en classe.')
  if (!depotOuvert(d)) {
    return refus('Le dépôt n’est pas encore ouvert : le professeur l’ouvre quand la rédaction est finie.')
  }
  if (d.statut === 'retire' || d.statut === 'abandonne' || d.statut === 'clos') {
    return refus('Ce dépôt est clos.')
  }
  if (d.v1_remis_at) return refus('Tu as déjà validé ta copie.')
  if (nb < 1) return refus('Ajoute au moins une page.')
  if (nb > config.pagesMax) return refus(`Maximum ${config.pagesMax} pages.`)

  // On efface ce qui traînait : un second dépôt ne se superpose pas au premier.
  const prefixe = prefixeDepot(eleveId, depotId)
  const { data: existants } = await admin.storage.from(BUCKET).list(prefixe)
  if (existants && existants.length > 0) {
    await admin.storage.from(BUCKET).remove(existants.map((f) => `${prefixe}/${f.name}`))
  }

  const uploads: Array<{ ordre: number; path: string; token: string }> = []
  for (let ordre = 1; ordre <= nb; ordre++) {
    const chemin = cheminPage(eleveId, depotId, ordre)
    const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(chemin)
    if (error || !data) return refus(`Préparation impossible : ${error?.message ?? 'aucune URL'}`)
    uploads.push({ ordre, path: data.path, token: data.token })
  }
  return ok({ uploads })
}

/**
 * Enregistre `photos[]` et met la transcription en file.
 *
 * ⚠️ AUCUN SEUIL « PHOTO SUSPECTE » (piège 11). L'EXIF est purgé à la
 *    compression, côté client (`utils/imageProcessing.ts`), « parce que la loi
 *    25 l'exige » (`06-` §7, point 4) — pas pour en tirer un signal : la
 *    passation est « en classe, à la main, sous surveillance », et « le
 *    faisceau ne regarde que le formatif fait à la maison » (`06-` §6).
 */
export async function enregistrerLesPhotos(
  admin: Admin, depotId: string, eleveId: string, photos: Photo[],
): Promise<Issue<{ photos: Photo[] }>> {
  const d = await lireDepot(admin, depotId)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')
  if (!depotOuvert(d)) return refus('Le dépôt n’est pas encore ouvert.')
  if (d.v1_remis_at) return refus('Tu as déjà validé ta copie.')

  const rangees = renumeroter(photos)
  const mauvais = refuserPhotos(rangees)
  if (mauvais) return refus(mauvais.motif)

  const { error } = await admin.from('exercices_depots')
    .update({ photos_v1: rangees, updated_at: new Date().toISOString() })
    .eq('id', depotId)
  if (error) return refus(`Les photos n’ont pas été enregistrées : ${error.message}`)
  return ok({ photos: rangees })
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 6 — LA TRANSCRIPTION, EN QUELQUES SECONDES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'étape de file de ce lot. Le commentaire d'`EtapeChaine` disait :
 * « C4-L4 en ajoutera les siennes, ici même » — c'est fait, dans `file.ts`.
 */
export const ETAPE_TRANSCRIPTION = 'transcription_v1' as const

/**
 * Met la transcription en file. C'EST LE SEUL DÉCLENCHEMENT.
 *
 * ⚠️ FILE **PLUS DÉCLENCHEMENT IMMÉDIAT** — c'est le choix que le piège 2
 *    demandait de faire et de motiver. Les deux voies du §1.1 sont « le dépôt
 *    appelle lui-même le déclencheur » et « une tâche planifiée à la minute » ;
 *    la seconde « ne tient pas la seconde », or la transcription doit revenir
 *    « en quelques secondes, pendant l'heure de cours » (`02-` §6.D).
 *
 *    Pourquoi la file quand même, plutôt que l'appel direct hors file :
 *      · l'IDEMPOTENCE. Un élève qui tape deux fois sur « envoyer » paierait
 *        deux transcriptions — donc QUATRE appels, à deux passes la copie. La
 *        clé `dépôt:étape` la rend gratuite ;
 *      · la REPRISE. Un appel direct qui échoue est perdu, et l'élève est devant
 *        un écran vide pendant l'heure de cours. Le bail et `tentatives_max`
 *        rendent la reprise automatique ;
 *      · la VISIBILITÉ. `echec_definitif` est l'état que l'écran interroge ; un
 *        appel direct n'a pas d'état, il a un silence ;
 *      · le FILET. « Une tâche planifiée est due DANS LES DEUX CAS » (§1.1) —
 *        elle reprend les jobs dont le bail a expiré et que plus aucun dépôt ne
 *        rappelle. Sans file, il n'y a rien à reprendre.
 *    Le coût de ce choix est une écriture de plus par copie ; le coût de
 *    l'autre est une copie perdue par panne.
 */
export async function mettreLaTranscriptionEnFile(
  admin: Admin, depotId: string,
): Promise<Issue<{ deja: boolean }>> {
  const { job, deja, erreur } = await mettreEnFile(admin, depotId, ETAPE_TRANSCRIPTION)
  if (erreur) return refus(`La transcription n’a pas pu être mise en file : ${erreur}`)
  if (!job) return refus('La transcription n’a pas pu être mise en file.')
  return ok({ deja })
}

export async function attenteDuDepot(admin: Admin, depotId: string): Promise<EtatLisible[]> {
  return etatDesJobs(admin, depotId)
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPES 7 ET 8 — L'ÉLÈVE RELIT, CORRIGE, VALIDE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'édition libre de la transcription, puis sa validation.
 *
 * « LE CONTRÔLE DE LA TRANSCRIPTION EST UNE CORRECTION, PAS UN SIGNALEMENT »
 * (`02-` §6.D ; piège 13) : l'élève édite librement, la mesure porte sur la
 * version corrigée, AUCUNE version double n'est conservée, AUCUN drapeau
 * d'écart n'est levé, AUCUN compteur de corrections n'existe.
 * ⚠️ C'est pourquoi cette fonction ÉCRASE `transcription_v1` et ne garde rien
 *    de ce qu'elle remplace.
 *
 * ⚠️ LE DÉCOUPAGE SE CONSERVE (piège 14 ; `07-` §3 ; `06-` §4). Le texte est
 *    écrit TEL QUEL : aucun `trim` par ligne, aucune normalisation d'espaces,
 *    aucune fusion de lignes vides. « Une transcription qui fusionne deux
 *    paragraphes fabrique une copie sans architecture, et la copie est lue en
 *    défaillance forte. » Seul le saut de ligne final est retiré — il vient du
 *    champ, pas de la copie.
 */
export async function validerLaTranscription(
  admin: Admin, depotId: string, eleveId: string, texte: string,
): Promise<Issue<{ statut: string }>> {
  const d = await lireDepot(admin, depotId)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')
  if (!depotOuvert(d)) return refus('Le dépôt n’est pas encore ouvert.')
  if (d.v1_remis_at) return refus('Tu as déjà validé ta copie.')
  if (texte.trim() === '') {
    return refus('La transcription est vide : relis ta copie avant de valider.')
  }

  const maintenant = new Date().toISOString()
  const { error } = await admin.from('exercices_depots').update({
    transcription_v1: normaliserRetours(texte).replace(/\n+$/, ''),
    statut: 'v1_remis',
    v1_remis_at: maintenant,
    updated_at: maintenant,
  }).eq('id', depotId)
  if (error) return refus(`La validation a échoué : ${error.message}`)
  return ok({ statut: 'v1_remis' })
}

/** L'édition au fil de l'eau, avant validation — même règle sur le découpage. */
export async function enregistrerLaTranscription(
  admin: Admin, depotId: string, eleveId: string, texte: string,
): Promise<Issue> {
  const d = await lireDepot(admin, depotId)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')
  if (!depotOuvert(d)) return refus('Le dépôt n’est pas encore ouvert.')
  if (d.v1_remis_at) return refus('Tu as déjà validé ta copie.')
  const { error } = await admin.from('exercices_depots')
    .update({ transcription_v1: normaliserRetours(texte).replace(/\n+$/, ''), updated_at: new Date().toISOString() })
    .eq('id', depotId)
  return error ? refus(`Enregistrement impossible : ${error.message}`) : ok(undefined)
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 12 — LE TRAITEMENT EN LOT, AU DÉCLENCHEMENT DU PROFESSEUR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « Le soir même ou un autre jour, il DÉCLENCHE L'ANALYSE EN LOT d'un clic »
 * (`02-` §6.D, étape 12).
 *
 * ⚠️ PAR LA MÊME FILE, ET PAR AUCUN AUTRE CHEMIN (piège 1) : « le jour où une
 *    passation de classe se traite hors de la file, il y a deux systèmes de
 *    mesure et le second est invisible au premier ». On met CHAQUE dépôt en
 *    file — `mesure_v1`, l'étape de C4-L5 — et on laisse la route tourner.
 *
 * ⚠️ CE LOT NE MESURE RIEN. Il n'appelle ni `traiterDepot`, ni la chaîne : il
 *    écrit en file, et c'est tout.
 */
export async function declencherLeLot(
  admin: Admin, exerciceId: string,
): Promise<Issue<{ misEnFile: number; dejaEnFile: number; sansCopie: number }>> {
  const { depots, tronque } = await lireDepotsDeLInstance(admin, exerciceId)
  if (tronque) {
    return refus('La liste des dépôts n’a pas pu être lue en entier : rien n’a été mis en file. '
      + 'Un lot déclenché sur une liste tronquée oublierait des copies en silence.')
  }
  let misEnFile = 0
  let dejaEnFile = 0
  let sansCopie = 0
  for (const d of depots) {
    // Une copie non remise n'entre pas dans le lot : la chaîne la refuserait en
    // « dépôt sans production », ce qui brûlerait une tentative pour rien.
    if (!d.v1_remis_at || !(d.transcription_v1 ?? '').trim()) { sansCopie++; continue }
    if (d.statut === 'retire' || d.statut === 'abandonne') { sansCopie++; continue }
    const { job, deja, erreur } = await mettreEnFile(admin, d.id, 'mesure_v1')
    if (erreur || !job) {
      console.error(`[passation] dépôt ${d.id} NON mis en file — ${erreur ?? 'aucun job'}`)
      continue
    }
    if (deja) dejaEnFile++
    else misEnFile++
  }
  return ok({ misEnFile, dejaEnFile, sansCopie })
}

/**
 * RELANCER LE TRAITEMENT D'UNE COPIE — et rejouer LE MOINS POSSIBLE.
 *
 * ⛔ `declencherLeLot` NE PEUT PAS LE FAIRE, par construction : `mettreEnFile`
 *    est idempotent sur (dépôt, étape). Une copie dont la mesure a ABOUTI
 *    ressort du lot en « déjà en file » — comptée, rassurante, et pas
 *    retouchée. Si son retour a été refusé, le lot ne la répare JAMAIS.
 *
 * ⭐⭐ ET ON NE REJOUE PAS TOUT POUR AUTANT. Quand les mesures sont écrites et
 *    que seul le retour manque, c'est `retour_v1` qui part : UN appel au lieu de
 *    sept, et surtout AUCUN squelette réécrit. Rejouer l'étape complète
 *    réécrivait les squelettes sans réécrire les mesures — après quoi le
 *    jugement stocké et la lettre stockée ne parlaient plus du même tirage.
 *
 * ⚠️ LA GARDE ANTI-BOUCLE. Si un `retour_v1` a déjà échoué DÉFINITIVEMENT — sa
 *    garde de version l'a refusé, par exemple —, on ne le repropose pas : on
 *    repart sur la mesure complète, qui rejugera. Sans cela, le professeur
 *    cliquerait indéfiniment sur un raccourci que la chaîne refuse.
 */
export async function relancerLaMesure(
  admin: Admin, depotId: string,
): Promise<Issue<{ etape: string; raison: string }>> {
  if (!depotId) return refus('Aucune copie désignée.')
  const { data: d, error } = await admin.from('exercices_depots')
    .select('id, v1_remis_at, transcription_v1, texte_v1, statut')
    .eq('id', depotId).maybeSingle()
  if (error) return refus(`La copie n’a pas pu être lue : ${error.message}`)
  if (!d) return refus('Cette copie n’existe pas.')

  // Les mêmes gardes que le lot, et pour la même raison : une copie sans
  // production ferait brûler une tentative pour un refus certain.
  const production = ((d.transcription_v1 as string | null) ?? (d.texte_v1 as string | null) ?? '').trim()
  if (!d.v1_remis_at || !production) {
    return refus('Cette copie n’a rien de lisible : la chaîne la refuserait aussitôt.')
  }
  if (d.statut === 'retire' || d.statut === 'abandonne') {
    return refus('Cette copie est retirée : elle n’entre pas dans la chaîne.')
  }

  const [{ count: nbMesures }, { count: nbRetours }, jobs] = await Promise.all([
    admin.from('competences_mesures').select('id', { count: 'exact', head: true }).eq('depot_id', depotId),
    admin.from('exercices_retours').select('id', { count: 'exact', head: true })
      .eq('depot_id', depotId).eq('moment', 'chaud'),
    etatDesJobs(admin, depotId),
  ])

  const retourDejaRefuse = jobs.some((j) => j.etape === ETAPE_RETOUR_V1 && j.echec_definitif)
  const leRaccourciSuffit = (nbMesures ?? 0) > 0 && (nbRetours ?? 0) === 0 && !retourDejaRefuse

  if (leRaccourciSuffit) {
    const existe = jobs.some((j) => j.etape === ETAPE_RETOUR_V1)
    if (!existe) {
      const { job, erreur } = await mettreEnFile(admin, depotId, ETAPE_RETOUR_V1)
      if (erreur || !job) return refus(`Mise en file impossible — ${erreur ?? 'aucun job'}.`)
      return ok({ etape: ETAPE_RETOUR_V1, raison: 'mis en file' })
    }
    const r = await relancerUnJob(
      admin, depotId, ETAPE_RETOUR_V1, 'remis en file à la main par le professeur')
    if (!r.relance) return refus(`Remise en file impossible — ${r.raison}.`)
    return ok({ etape: ETAPE_RETOUR_V1, raison: r.raison })
  }

  const r = await relancerUnJob(
    admin, depotId, ETAPE_MESURE_V1, 'remis en file à la main par le professeur')
  if (!r.relance) return refus(`Remise en file impossible — ${r.raison}.`)
  return ok({ etape: ETAPE_MESURE_V1, raison: r.raison })
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 15 — LE COMMENTAIRE GÉNÉRAL, APRÈS LECTURE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « Après lecture, il saisit un COMMENTAIRE GÉNÉRAL. AUCUNE NOTE NE SE SAISIT
 * ICI : elle reste sur la copie papier et va dans l'outil de bulletin »
 * (`02-` §6.D, étape 15 ; `06-` §5 ; piège 30).
 */
export async function ecrireLeCommentaireGeneral(
  admin: Admin, depotId: string, profId: string, commentaire: string,
): Promise<Issue> {
  const maintenant = new Date().toISOString()
  const { error } = await admin.from('exercices_depots').update({
    commentaire_general: commentaire.trim() === '' ? null : commentaire,
    corrige_par: profId,
    corrige_at: maintenant,
    updated_at: maintenant,
  }).eq('id', depotId)
  return error ? refus(`Le commentaire n’a pas été enregistré : ${error.message}`) : ok(undefined)
}

// ─────────────────────────────────────────────────────────────────────────────
// LE MESSAGE REPORTÉ DE LISIBILITÉ — un seul domicile, et il est sur le dépôt
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « "Exercice à refaire lisiblement" N'EXISTE PAS — inapplicable à une passation
 * collective : la copie est écrite et l'heure est passée. C'est un MESSAGE
 * REPORTÉ, affiché à la passation suivante » (`06-` §1, règle 3).
 *
 * ⚠️ IL A DÉJÀ UN DOMICILE, ET IL EST SUR LE DÉPÔT (piège 35) :
 *    `exercices_depots.message_lisibilite_reporte`, « propre au canal classe »
 *    (§1.1, posé par C4-L1). Le `06-` §1 écrit « mémorisé au profil » ; le
 *    schéma, qui met la règle en œuvre, l'a logé sur le dépôt. ON NE CRÉE PAS
 *    un second domicile — deux copies d'une même donnée divergent, et c'est la
 *    plus récemment touchée qui gagne par accident.
 *
 * Le message se pose sur LA copie qui a posé problème, et se LIT au dépôt de
 * classe suivant : d'où la lecture ci-dessous, qui remonte au dernier dépôt de
 * classe de l'élève qui en porte un.
 */
export async function poserLeMessageReporte(
  admin: Admin, depotId: string, message: string,
): Promise<Issue> {
  const { error } = await admin.from('exercices_depots')
    .update({
      message_lisibilite_reporte: message.trim() === '' ? null : message.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', depotId)
  return error ? refus(`Le message n’a pas été enregistré : ${error.message}`) : ok(undefined)
}

/**
 * Le message que l'élève doit voir à SA passation suivante : le plus récent
 * posé sur l'un de ses dépôts de classe ANTÉRIEURS à celui-ci.
 */
export async function lireLeMessageReporte(
  admin: Admin, eleveId: string, depotCourantId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from('exercices_depots')
    .select('message_lisibilite_reporte, assigne_at, exercices!inner(lieu)')
    .eq('eleve_id', eleveId)
    .eq('exercices.lieu', 'classe')
    .neq('id', depotCourantId)
    .not('message_lisibilite_reporte', 'is', null)
    .order('assigne_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error(`[passation] message reporté illisible (élève ${eleveId}) — `
      + `${error.code} ${error.message}`)
    return null
  }
  const m = (data as unknown as { message_lisibilite_reporte?: string } | null)
  return m?.message_lisibilite_reporte ?? null
}

// ─────────────────────────────────────────────────────────────────────────────
// L'EXEMPTION DE LISIBILITÉ — une bascule, JAMAIS un motif
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « L'exemption se déclare UNE FOIS, AU PROFIL, et bascule automatiquement
 * l'élève en saisie clavier pour les passations en classe » (`06-` §1, règle 4).
 *
 * ⚠️ « Le profil ne stocke QUE la bascule, JAMAIS LE MOTIF » (`06-` §7, point 3 ;
 *    §1.3 ; piège 36) — marque pédagogique, jamais diagnostic médical. Il n'y a
 *    aucune colonne de motif, et ce lot n'en ajoute pas, « pas même pour la
 *    mémoire du professeur ».
 *
 * ⚠️ « Aucun élève n'écrit sa propre ligne de `profiles` » (§1.3 ; piège 38) :
 *    la policy self-service a été retirée par `c1_rls_eleve.sql` et doit le
 *    rester. Cette lecture passe par le client admin, côté serveur.
 */
export async function eleveExempte(admin: Admin, eleveId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('profiles').select('mode_saisie_force').eq('id', eleveId).maybeSingle()
  if (error) {
    console.error(`[passation] exemption illisible (${eleveId}) — ${error.code} ${error.message}`)
    return false
  }
  return data?.mode_saisie_force === 'ecran'
}

/**
 * L'élève exempté rédige AU CLAVIER, et sa copie est une ANCRE.
 *
 * « Les champs de rédaction refusent le collage — raccourci clavier,
 * glisser-déposer, menu contextuel », et « CHAQUE TENTATIVE BLOQUÉE EST
 * JOURNALISÉE » (`06-` §1 ; piège 37). Le refus est posé côté écran ; ici, le
 * journal.
 *
 * ⭐ DÉCISION DE LOUIS, 22/08 : ELLE SE RAPPORTE AU PROFESSEUR. Elle a vécu
 *    quelques heures en `console.warn` — un journal que personne ne lit, qui
 *    expire avec les journaux de l'hébergeur, et que le professeur ne voit
 *    jamais. Elle s'écrit désormais sur le dépôt, et l'écran de correction la
 *    montre.
 *
 * ⚠️ CE N'EST TOUJOURS PAS UN SIGNAL D'INTÉGRITÉ, et le motif tient. « La
 *    journalisation d'une tentative alimente le faisceau, qui ne regarde que la
 *    maison » (`06-` §6) ; et le §7 de la SPEC ne fait jamais d'un signal isolé
 *    un drapeau — c'est la CONVERGENCE qui part au professeur, par
 *    `signalerEnAttenteIA`, avec confirmation humaine. On n'écrit donc rien dans
 *    `integrite_signalements`. ⚠️ Rectification d'un motif FAUX qui traînait
 *    ici : `integrite_signalements_module_check` NOMME BIEN `codex` et
 *    `aletheia`, et `type` n'a aucune contrainte — le canal aurait accepté la
 *    ligne (et son `unique (eleve_id, module, rendu_ref)` n'en aurait gardé
 *    qu'une, quand il en faut N). C'est la doctrine qui l'interdit, pas la forme
 *    de la table.
 *
 * ⚠️ L'AJOUT EST ATOMIQUE, par RPC : un lire-modifier-écrire perdrait une
 *    tentative sur deux `Cmd+V` rapprochés — c'est exactement ce qu'on compte.
 * ⚠️ ELLE NE LÈVE JAMAIS. Une tentative de collage n'est pas un geste dont
 *    l'échec doive interrompre un élève en train de composer.
 */
export async function journaliserCollageBloque(
  admin: Admin, depotId: string, eleveId: string, moyen: MoyenDeCollage,
): Promise<void> {
  const { error } = await admin.rpc('journaliser_collage', {
    p_depot_id: depotId, p_moyen: moyen,
  })
  if (error) {
    console.error(`[passation] collage BLOQUÉ mais NON JOURNALISÉ — dépôt ${depotId}, élève `
      + `${eleveId}, moyen ${moyen} — ${error.code} ${error.message}`)
    return
  }
  console.warn(`[passation] collage bloqué et journalisé — dépôt ${depotId}, élève ${eleveId}, `
    + `moyen ${moyen}. Rapporté au professeur ; aucun signalement d'intégrité.`)
}

/** L'élève écrit-il au clavier plutôt qu'à la main ? La question, en un seul endroit. */
export async function saisieAuClavier(admin: Admin, eleveId: string): Promise<boolean> {
  return eleveExempte(admin, eleveId)
}

/**
 * Le texte saisi au clavier par un élève exempté — il remplit `texte_v1`, et
 * non `transcription_v1` : il n'y a pas eu de photo, donc rien à transcrire.
 * La chaîne lit l'un ou l'autre (`utils/chaine/contexte.ts`, `production()`).
 */
export async function validerLaSaisieClavier(
  admin: Admin, depotId: string, eleveId: string, texte: string,
): Promise<Issue<{ statut: string }>> {
  const d = await lireDepot(admin, depotId)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')
  if (!depotOuvert(d)) return refus('Le dépôt n’est pas encore ouvert.')
  if (d.v1_remis_at) return refus('Tu as déjà validé ta copie.')
  if (!(await eleveExempte(admin, eleveId))) {
    return refus('Cette passation se rédige à la main : la saisie au clavier est un aménagement '
      + 'qui se déclare au profil.')
  }
  if (texte.trim() === '') return refus('Ta copie est vide.')

  const maintenant = new Date().toISOString()
  const { error } = await admin.from('exercices_depots').update({
    texte_v1: normaliserRetours(texte).replace(/\n+$/, ''),
    statut: 'v1_remis',
    v1_remis_at: maintenant,
    updated_at: maintenant,
  }).eq('id', depotId)
  if (error) return refus(`La validation a échoué : ${error.message}`)
  return ok({ statut: 'v1_remis' })
}
