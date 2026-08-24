'use server'
// ============================================================================
// C4 · L3 — LES ACTIONS DU DÉROULÉ, CÔTÉ ÉLÈVE, À LA MAISON.
// ----------------------------------------------------------------------------
// ⚠️ CE DOSSIER N'A PAS DE `page.tsx`, et c'est volontaire : il n'est donc pas
//    routable. Il porte le jeu d'actions PARTAGÉ par les écrans du déroulé, où
//    qu'ils vivent — patron de `app/passation/actions.ts` (C4-L4).
//
// ⚠️ **LE DÉROULÉ ÉCRIT PAR DES ROUTES SERVEUR, JAMAIS EN DIRECT DEPUIS LE
//    CLIENT** (`07-` §1 ; piège 46). Il n'y a aucune policy élève sur les tables
//    du moteur : le client admin contourne la RLS, et **c'est ici que vit la
//    garde**. Chaque action relit le dépôt par `lireDepotMaison`, qui filtre sur
//    `eleve_id`, exige `lieu = 'maison'` et écarte les `retire`.
//
// ⚠️ **CE LOT N'APPELLE JAMAIS UN MODÈLE.** La génération des retours appartient
//    à la chaîne (C4-L5) : ici on MET EN FILE, on ATTEND VISIBLEMENT, et on
//    AFFICHE. Le seul endroit qui touche la chaîne est `mesurerMaintenant`.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderEleveDeroule } from '@/utils/deroule/acces'
import { chargerLeDeroule, tagALaRemise, type VueDuDeroule } from '@/utils/deroule/vue'
import {
  lireDepotMaison, ouvrirLeDepot, enregistrerLeTexte, remettre,
  repondreALaMicroQuestion, compterUneAide, type AideDepliee, type DepotMaison,
} from '@/utils/deroule/depot'
import {
  enregistrerLaConfiance, enregistrerLesConditions, enregistrerLaRestitution,
  enregistrerLaCredence, ouvrirSeJuger, enregistrerSeJuger,
} from '@/utils/deroule/gestes'
import { contester, validerLaLecture, pointsContestes } from '@/utils/deroule/contestation'
import { mesurerMaintenant, attenteDuDepot } from '@/utils/deroule/mesure'
import { saisieARegistrer } from '@/utils/deroule/credence'
import { comparerAuSquelette, gardeIndetermine } from '@/utils/deroule/juger'
import { estMotifLicite } from '@/utils/deroule/duree'
import { journaliserCollageBloque } from '@/utils/passation/depots'
import { estUnMoyen, type MoyenDeCollage } from '@/utils/passation/collage'
import { messageSiBloque } from '@/utils/integrite'
import { messageSiRetoursNonLus } from '@/utils/retours-lus'
import type { TelemetrieSaisie, Version } from '@/utils/deroule/types'

export interface Reponse { ok: boolean; message: string }
const echec = (message: string): Reponse => ({ ok: false, message })
const succes = (message: string): Reponse => ({ ok: true, message })

function rafraichir(): void {
  revalidatePath('/eleve/modules/codex', 'layout')
  revalidatePath('/eleve/modules/aletheia', 'layout')
}

/**
 * Le portier commun. ⚠️ **Les deux gardes transverses jouent AVANT toute
 * écriture** : le blocage d'intégrité (« un type de signalement est un STRIKE,
 * qui parle d'effort et **bloque les dépôts au seuil** ») et le gate de lecture
 * (« un retour non lu bloque tous les rendus »).
 *
 * ⚠️ Elles NE JOUENT PAS sur les lectures ni sur la télémétrie : un élève bloqué
 *    doit pouvoir lire son écran et comprendre pourquoi, pas se heurter à un mur
 *    muet.
 */
async function portier(depotId: string, ecriture = true): Promise<
  { erreur: Reponse } | { admin: Awaited<ReturnType<typeof garderEleveDeroule>>['admin']
    userId: string; depot: DepotMaison; delaiVfJours: number }> {
  const { admin, userId, ouvert, delaiVfJours } = await garderEleveDeroule(false)
  if (!ouvert) return { erreur: echec('Les exercices ne sont pas ouverts.') }

  const depot = await lireDepotMaison(admin, depotId, userId)
  if (!depot) return { erreur: echec('Exercice introuvable.') }

  if (ecriture) {
    const blocage = await messageSiBloque(admin, userId)
    if (blocage) return { erreur: echec(blocage) }
    const gateLecture = await messageSiRetoursNonLus(admin, userId)
    if (gateLecture) return { erreur: echec(gateLecture) }
  }
  return { admin, userId, depot, delaiVfJours }
}

// ── La vue ──────────────────────────────────────────────────────────────────

export async function actionChargerLeDeroule(depotId: string): Promise<VueDuDeroule | null> {
  const { admin, userId, ouvert, delaiVfJours } = await garderEleveDeroule(false)
  return chargerLeDeroule(admin, depotId, userId, { ouvert, delaiVfJours })
}

/**
 * ⭐ LE SONDAGE DE L'ATTENTE — « l'attente du retour est un ÉTAT EXPLICITE,
 * JAMAIS UN ÉCRAN MUET » (`07-` §3 ; `01-` §12). *Un écran muet fait recharger,
 * et une reprise mal gardée écrit une seconde mesure.*
 *
 * ⚠️ C4-L4 avait écrit son crochet de sondage (`actionEtatDuDepot`) et **ne
 *    l'avait jamais appelé** ; celui-ci EST appelé, par l'écran, tant que
 *    l'attente court.
 */
export async function actionEtatDeLAttente(depotId: string): Promise<{
  enCours: boolean; echecDefinitif: boolean; message: string | null; retourPret: boolean
} | null> {
  const p = await portier(depotId, false)
  if ('erreur' in p) return null
  const attente = await attenteDuDepot(p.admin, depotId)
  const { data } = await p.admin.from('exercices_retours')
    .select('moment').eq('depot_id', depotId).not('published_at', 'is', null)
  return {
    enCours: attente.enCours,
    echecDefinitif: attente.echecDefinitif,
    message: attente.message,
    retourPret: (data ?? []).length > 0,
  }
}

// ── Temps 1 et 2 ────────────────────────────────────────────────────────────

export async function actionOuvrir(depotId: string): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const r = await ouvrirLeDepot(p.admin, p.depot, new Date().toISOString())
  rafraichir()
  return r.ok ? succes('') : echec(r.message)
}

export async function actionEnregistrerBrouillon(
  depotId: string, version: Version, texte: string, telemetrie: TelemetrieSaisie | null,
): Promise<Reponse & { blocs?: number }> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const r = await enregistrerLeTexte(
    p.admin, p.depot, version, texte, telemetrie, new Date().toISOString())
  if (!r.ok) return echec(r.message)
  return { ok: true, message: 'Enregistré.', blocs: r.valeur?.blocs }
}

/**
 * ⭐ LE COLLAGE — refusé sur les TROIS VECTEURS, et **chaque tentative bloquée
 * est journalisée** (`06-` §1).
 *
 * ⚠️ **UN LOT LE RÉUTILISE, IL N'EN CRÉE PAS UN SECOND** (`07-` §1.2) : la
 *    colonne `collages_bloques`, la RPC atomique `journaliser_collage` et le
 *    module pur `collage.ts` sont ceux de C4-L4 — ce lot n'en écrit aucun
 *    second. Seule l'ACTION est propre, parce que celle de C4-L4 lit la porte de
 *    la passation en classe, qui ne regarde pas la maison.
 *
 * ⚠️ Elle ne passe PAS par `portier` en écriture : une trace se journalise même
 *    quand un blocage d'intégrité court — c'est justement là qu'elle compte.
 */
export async function actionCollageBloque(depotId: string, moyen: string): Promise<void> {
  if (!estUnMoyen(moyen)) {
    console.error(`[deroule] moyen de collage inconnu : ${moyen}. Les trois vecteurs de `
      + '`06-` §1, et eux seuls.')
    return
  }
  const { admin, userId } = await garderEleveDeroule(false)
  const depot = await lireDepotMaison(admin, depotId, userId)
  if (!depot) return
  await journaliserCollageBloque(admin, depotId, userId, moyen as MoyenDeCollage)
}

/**
 * La MICRO-QUESTION de dépassement (`02-` §2.4). **Jamais notée, jamais renvoyée
 * comme jugement.** ⚠️ `motif_depassement` reste NULL si elle n'a pas été
 * déclenchée ou pas répondue — cette action n'est appelée que sur une réponse.
 */
export async function actionMicroQuestion(depotId: string, motif: string): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  if (!estMotifLicite(motif)) return echec('Deux réponses possibles : une pause, ou une difficulté.')
  const r = await repondreALaMicroQuestion(p.admin, depotId, motif, new Date().toISOString())
  return r.ok ? succes('') : echec(r.message)
}

/** ⭐ Le compteur d'aide — voir `depot.ts:compterUneAide` (décision du PO, 22/08). */
export async function actionCompterUneAide(depotId: string, aide: string): Promise<void> {
  const p = await portier(depotId, false)
  if ('erreur' in p) return
  await compterUneAide(p.admin, p.depot, aide as AideDepliee, new Date().toISOString())
}

// ── Les trois gestes de la remise, DANS CET ORDRE ───────────────────────────

export async function actionConfiance(
  depotId: string, valeurs: Record<string, string>,
): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const vue = await chargerLeDeroule(p.admin, depotId, p.userId,
    { ouvert: true, delaiVfJours: p.delaiVfJours })
  if (!vue) return echec('Exercice introuvable.')
  const r = await enregistrerLaConfiance(
    p.admin, p.depot, valeurs, vue.competencesDeLaConfiance, new Date().toISOString())
  rafraichir()
  return r.ok ? succes('') : echec(r.message)
}

export async function actionConditions(depotId: string, valeur: string): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const r = await enregistrerLesConditions(p.admin, p.depot, valeur, new Date().toISOString())
  rafraichir()
  return r.ok ? succes('') : echec(r.message)
}

export async function actionRestitution(depotId: string, texte: string): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const r = await enregistrerLaRestitution(p.admin, p.depot, texte, new Date().toISOString())
  rafraichir()
  return r.ok ? succes('') : echec(r.message)
}

// ── Le quatrième geste — la crédence ────────────────────────────────────────

export async function actionCredence(
  depotId: string, cas: number, saisie: { jetons?: number[]; pourcentage?: number },
): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const vue = await chargerLeDeroule(p.admin, depotId, p.userId,
    { ouvert: true, delaiVfJours: p.delaiVfJours })
  const offre = vue?.cas.find((c) => c.ordre === cas)?.credence
  if (!offre) return echec('Cet exercice ne demande pas de crédence sur ce cas.')

  const { valeur, refus: motif } = saisieARegistrer(cas, offre, saisie, new Date().toISOString())
  if (!valeur) return echec(motif ?? 'Saisie refusée.')
  const r = await enregistrerLaCredence(p.admin, p.depot, cas, valeur, new Date().toISOString())
  rafraichir()
  return r.ok ? succes('') : echec(r.message)
}

// ── Temps 3 — « se juger » ──────────────────────────────────────────────────

export async function actionOuvrirSeJuger(depotId: string): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const r = await ouvrirSeJuger(p.admin, p.depot, new Date().toISOString())
  return r.ok ? succes('') : echec(r.message)
}

/**
 * ⭐ « SE JUGER » — les réponses, la comparaison, la garde.
 *
 * ⚠️ **La comparaison est du CODE, jamais le modèle** (`06-` §2) ; **jamais
 *    notée** ; et **le Monitoring tourne EN DERNIER** (la fiche §2) : ce qui
 *    s'écrit ici est une saisie et sa comparaison, jamais un verdict composé.
 */
export async function actionSeJuger(
  depotId: string, reponses: Record<string, string>,
): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const vue = await chargerLeDeroule(p.admin, depotId, p.userId,
    { ouvert: true, delaiVfJours: p.delaiVfJours })
  const offre = vue?.seJuger.offre
  if (!vue?.seJuger.servie || !offre) {
    return echec('Cette phase n’est pas servie sur cet exercice.')
  }

  // Le squelette, s'il existe. ⚠️ Absent, la garde `indetermine` joue (cas 2 :
  // « l'instrument n'a rendu aucun niveau ») — jamais un verdict par défaut.
  const competences = [...new Set(offre.questions.map((q) => q.competence))]
  const parCompetence: Record<string, Record<string, never> | undefined> = {}
  if (competences.length > 0) {
    const { data } = await p.admin.from('competences_mesures')
      .select('competence, observables').eq('depot_id', depotId).in('competence', competences)
    for (const m of (data ?? []) as Array<{ competence: string; observables: unknown }>) {
      parCompetence[m.competence] = (m.observables ?? {}) as Record<string, never>
    }
  }

  const comparaison = comparerAuSquelette(offre.questions, reponses, parCompetence)
  const garde = gardeIndetermine(
    comparaison,
    !!p.depot.confiance_declaree,
    competences.some((c) => parCompetence[c] !== undefined),
  )

  const r = await enregistrerSeJuger(p.admin, p.depot, {
    questions: offre.questions,
    version: offre.version,
    reponses,
    comparaison,
    // ⚠️ Le seul verdict que l'écran a le droit de poser. `bien_calibre` /
    //    `surconfiant` / `sous_confiant` appartiennent à `calibrationDe`, en
    //    aval, et le Monitoring tourne en dernier.
    calibration: garde.indetermine ? 'indetermine' : null,
    tirage: offre.tirage,
  }, new Date().toISOString())
  rafraichir()
  return r.ok ? succes('') : echec(r.message)
}

// ── La remise, et le déclencheur ────────────────────────────────────────────

/**
 * ⭐ LA REMISE — et **le dépôt appelle LUI-MÊME le déclencheur** (piège 34).
 *
 * ⚠️ « Le contrat de trois minutes exige que la file se réclame DANS LA MINUTE
 *    qui suit le dépôt » (`07-` §1.1). La tâche planifiée est le filet ; elle ne
 *    tient pas le contrat à elle seule. **Et un déclencheur qui manque ne se
 *    voit nulle part : la file se remplit normalement, elle ne se vide jamais.**
 */
export async function actionRemettre(
  depotId: string, version: Version, texte: string, telemetrie: TelemetrieSaisie | null,
): Promise<Reponse & { enAttente?: boolean }> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur

  const vue = await chargerLeDeroule(p.admin, depotId, p.userId,
    { ouvert: true, delaiVfJours: p.delaiVfJours })
  if (!vue) return echec('Exercice introuvable.')

  // ⚠️ « Les temps 5 et 6 suivent le `regime_v1vf` et NE SONT PAS SERVIS là où
  //    il n'y a pas de version finale » (`06-` §2). Une vf sur un cran qui n'en
  //    a pas n'est pas une erreur de l'élève : c'est un écran qui n'aurait pas
  //    dû l'offrir. On refuse quand même — la garde ne coûte rien.
  if (version === 'vf' && vue.regime !== 'plein') {
    return echec('Cet exercice se clôt au retour : il n’y a pas de version finale à rendre.')
  }

  const maintenant = new Date()
  const reelMs = p.depot.ouvert_at
    ? maintenant.getTime() - new Date(p.depot.ouvert_at).getTime() : null
  const tag = version === 'v1' ? tagALaRemise(vue.dureeIndicativeMin, reelMs) : null

  const r = await remettre(p.admin, p.depot, version,
    { texte, tagDuree: tag, telemetrie }, maintenant.toISOString())
  if (!r.ok) return echec(r.message)

  // Le dépôt est écrit : on relit pour que le déclencheur voie l'état à jour
  // (le `aide_consommee` qu'il passe à la chaîne, notamment).
  const frais = await lireDepotMaison(p.admin, depotId, p.userId)
  const bilan = frais ? await mesurerMaintenant(p.admin, frais, version) : null

  rafraichir()
  if (bilan?.bilan) {
    return { ok: true, message: 'Remis. Ton retour arrive.', enAttente: false }
  }
  return {
    ok: true,
    enAttente: true,
    message: bilan?.motif
      ? `Remis. ${bilan.motif}.`
      : 'Remis. Ton retour est en préparation — l’écran se met à jour tout seul.',
  }
}

// ── Temps 4 — la contestation, et la lecture ────────────────────────────────

export async function actionContester(
  depotId: string, pointId: string, texte: string,
): Promise<Reponse> {
  const p = await portier(depotId)
  if ('erreur' in p) return p.erreur
  const vue = await chargerLeDeroule(p.admin, depotId, p.userId,
    { ouvert: true, delaiVfJours: p.delaiVfJours })
  const point = [...(vue?.retourChaud?.points ?? []), ...(vue?.retourFinal?.points ?? [])]
    .find((x) => x.id === pointId)
  if (!point) return echec('Ce point n’est pas dans ton retour.')

  const production = vue?.texteVf ?? vue?.texteV1 ?? null
  const r = await contester(p.admin, p.depot, { point, texte, production },
    new Date().toISOString())
  rafraichir()
  if (!r.ok) return echec(r.message)
  return succes(r.valeur?.citationAbsente
    // ⚠️ L'exigence d'EXAMEN HUMAIN de la loi (`06-` §2 et §7) : on le DIT.
    ? 'C’est noté, et c’est ton professeur qui va le regarder : la citation ne se retrouve '
      + 'pas dans ta copie.'
    : 'C’est noté. Ton professeur le verra ; rien ne change automatiquement.')
}

export async function actionValiderLaLecture(
  depotId: string, moment: 'chaud' | 'final',
): Promise<Reponse> {
  // ⚠️ Pas de `messageSiRetoursNonLus` ici : c'est précisément le geste qui
  //    déverrouille. L'exiger avant de pouvoir lire fermerait la porte à clé de
  //    l'intérieur.
  const p = await portier(depotId, false)
  if ('erreur' in p) return p.erreur
  const vue = await chargerLeDeroule(p.admin, depotId, p.userId,
    { ouvert: true, delaiVfJours: p.delaiVfJours })
  if (!vue) return echec('Exercice introuvable.')
  const r = await validerLaLecture(p.admin, p.depot, moment, vue.regime, new Date().toISOString())
  rafraichir()
  return r.ok ? succes('Lecture validée.') : echec(r.message)
}

/** Les points déjà contestés — lecture seule, pour l'écran. */
export async function actionPointsContestes(depotId: string): Promise<string[]> {
  const p = await portier(depotId, false)
  if ('erreur' in p) return []
  const { data } = await p.admin.from('exercices_metacognition')
    .select('contestation_points').eq('depot_id', depotId).maybeSingle()
  return pointsContestes(data?.contestation_points).map((c) => c.point_id)
}

// ⛔ NE JAMAIS RÉ-EXPORTER UN TYPE D'ICI — trouvé au smoke élève du 24/08.
//    Ce fichier porte `'use server'`, et un module de server actions ne peut
//    exporter QUE des fonctions async. Un `export type { … }` y est accepté par
//    `tsc` — le type existe à la compilation — mais le compilateur le laisse
//    devenir un export de VALEUR, et le module entier meurt à l'évaluation :
//    `ReferenceError: Competence is not defined`.
//    ⚠️ CE N'EST PAS UNE PANNE PARTIELLE : c'est TOUT le déroulé élève qui se
//    tait — la crédence, la remise, la contestation, la validation de lecture.
//    Et rien ne le voyait : `tsc --noEmit` passe, `npm test` passe, la page se
//    RENVOIE normalement ; seule une action, à l'écran, échoue.
//    Le type se lit à sa source : `@/utils/deroule/types`.
