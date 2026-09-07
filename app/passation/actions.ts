'use server'

// ============================================================================
// C4 · L4 — LES ACTIONS DU FLUX, PARTAGÉES PAR LES DEUX MODULES.
// ----------------------------------------------------------------------------
// « Ses écrans vivent dans CODEX (l'écriture diagnostique) et ALETHEIA (la
//   lecture diagnostique) — C'EST LE MÊME FLUX DANS DEUX MODULES, et ce qui
//   commande le comportement est le `lieu`, JAMAIS LE MODULE. »   — la mission
//
// D'où un seul jeu d'actions, ici, que les deux modules appellent. Deux jeux
// d'actions auraient fait deux flux, et le second aurait divergé.
//
// ⚠️ CE DOSSIER NE PORTE AUCUNE PAGE. `app/passation/` n'a pas de `page.tsx` :
//    un segment sans page n'est pas publiquement accessible (convention Next).
//    Les écrans, eux, vivent sous `/prof/codex`, `/prof/aletheia`,
//    `/eleve/modules/codex` et `/eleve/modules/aletheia` — « tes écrans se
//    posent dans Codex et Aletheia TELS QU'ILS SONT : ils ne réorganisent pas la
//    navigation, qui est C4-L6 et C5-L4 » (piège 55).
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf, garderEleve } from '@/utils/passation/garde'
import {
  ouvrirLesDepots, preparerDepotDesPhotos, enregistrerLesPhotos,
  mettreLaTranscriptionEnFile, validerLaTranscription, enregistrerLaTranscription,
  validerLaSaisieClavier, declencherLeLot, ecrireLeCommentaireGeneral,
  poserLeMessageReporte, journaliserCollageBloque, lireDepot, relancerLaMesure,
  clorLesDepots,
} from '@/utils/passation/depots'
import { depotClos } from '@/utils/passation/statuts'
// ⚠️ C10 · L2 — les instants se lisent DANS LE FUSEAU, les dates pures en UTC.
import { toISODate } from '@/utils/calendrier-grille'
import { lundiDuCycle } from '@/utils/deroule/echeance'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { transcrireMaintenant } from '@/utils/passation/ouvrier'
import { leverLesDrapeaux, offreSeJuger, enregistrerSeJuger,
  enregistrerConfianceRemise, offreCredence, enregistrerCredence } from '@/utils/passation/metacognition'
import {
  editerLeRetour, validerLesCorrections, publier, depublier, validerLaLecture,
} from '@/utils/passation/retours'
import type { Photo } from '@/utils/passation/photos'
import type { MoyenDeCollage } from '@/utils/passation/collage'
import type { PointRetour } from '@/utils/chaine/types'

export interface Reponse { ok: boolean; message: string }

const echec = (message: string): Reponse => ({ ok: false, message })
const succes = (message: string): Reponse => ({ ok: true, message })

/** Les écrans des deux modules — pour que le rafraîchissement n'en oublie aucun. */
function rafraichir(): void {
  revalidatePath('/prof/codex', 'layout')
  revalidatePath('/prof/aletheia', 'layout')
  revalidatePath('/eleve/modules/codex', 'layout')
  revalidatePath('/eleve/modules/aletheia', 'layout')
  // C6-L4 — le même flux dans un troisième module.
  revalidatePath('/prof/fragments-erudition', 'layout')
  revalidatePath('/eleve/modules/fragments-erudition', 'layout')
}

// ─────────────────────────────────────────────────────────────────────────────
// LE PROFESSEUR
// ─────────────────────────────────────────────────────────────────────────────

/** Les deux drapeaux — ils se lèvent JUSQU'À L'OUVERTURE DU DÉPÔT, pas après. */
export async function actionLeverLesDrapeaux(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const exerciceId = String(form.get('exercice_id') ?? '')
  const r = await leverLesDrapeaux(admin, exerciceId, {
    seJuger: form.get('se_juger') === 'on',
    confianceRemise: form.get('confiance_remise') === 'on',
  })
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes(`Drapeaux enregistrés — « se juger » ${r.data.seJuger ? 'levé' : 'baissé'}, `
    + `confiance de remise ${r.data.confianceRemise ? 'levée' : 'baissée'}.`)
}

/** ÉTAPE 4 — l'ouverture manuelle, jamais une fenêtre calendaire. */
export async function actionOuvrirLesDepots(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const exerciceId = String(form.get('exercice_id') ?? '')
  const r = await ouvrirLesDepots(admin, exerciceId)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes(`Dépôt ouvert pour ${r.data.ouverts} élève(s)`
    + (r.data.deja > 0 ? ` (${r.data.deja} l’étaient déjà).` : '.'))
}

/**
 * ÉTAPE 11 bis — LA CLÔTURE DES DÉPÔTS, miroir de l'ouverture.
 *
 * ⭐ ELLE VIENT AVANT L'ÉTAPE 12, ET L'ORDRE N'EST PAS INDIFFÉRENT (`02-` §6.D,
 *    `11 bis`) : `publier` ne bascule en « retour publié » que les dépôts
 *    `v1_remis` ou `ouvert` (`utils/passation/retours.ts`). Clore d'abord est ce
 *    qui empêche de repeindre en « retour publié » une copie jamais rendue.
 *
 * ⭐⭐ LA CONFIRMATION EST UNE GARDE, PAS UNE POLITESSE — patron du 01/09
 *    (`actionDesignation`, `app/deroule/actions.ts`) : l'écran pose la question,
 *    LE SERVEUR LA TIENT. Sans le champ `confirme`, l'action refuse. Un écran
 *    qui perdrait son second temps ne clôturerait pas la classe par accident.
 *
 * ⛔ `confirm()` EST INTERDIT côté écran — cinquième morsure documentée
 *    (`components/pilotage/ConfirmationRetrait.tsx`) : le dialogue natif rend
 *    `false` dans un aperçu embarqué, et le bouton paraît mort.
 */
export async function actionCloreLesDepots(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin, userId } = await garderProf(false)
  const exerciceId = String(form.get('exercice_id') ?? '')
  if (form.get('confirme') !== 'oui') {
    return echec('Clôture non confirmée : rien n’a été fait. '
      + 'Le geste se confirme à l’écran, et le serveur tient la confirmation.')
  }

  const r = await clorLesDepots(admin, exerciceId)
  if (!r.ok) return echec(r.message)
  const { clos, deja } = r.data

  // ── LE JOURNAL — `routeur_decisions.override_prof`, ET IL N'Y EN A PAS D'AUTRE
  //
  // « TOUT override du professeur SE JOURNALISE dans `routeur_decisions`, ORIGINE
  //   COMPRISE » (`07-` §1.5). Patron : `retirerLExercice`
  //   (`app/prof/routeur/actions.ts`), UNE LIGNE PAR DÉPÔT, comme lui.
  //
  // ⛔ LES AUTRES PORTES SONT FERMÉES D'AVANCE : `integrite_evenements` a un
  //    CHECK fermé à ('strike','blocage','deblocage') — il demanderait une
  //    migration ; `exercices.blocages` n'a pas le bon grain (l'exercice, pas
  //    l'élève). On n'ouvre pas un second journal.
  //
  // ⛔⛔ ET ON N'ÉCRIT JAMAIS `routeur_decision_id` SUR LE DÉPÔT. La ligne reste
  //    ORPHELINE — le seul lien est la clé `depot_id` DANS le JSON, exactement
  //    comme le retrait. Poser ce lien ferait tomber ces dépôts sous `C10-L1`
  //    (`utils/deroule/fermeture.ts` : `if (!q.routeurDecisionId) return false`),
  //    et ils seraient fermés deux fois par deux règles différentes.
  //
  // ⚠️ CE JOURNAL N'A AUCUN LECTEUR, et il n'en a jamais eu : 480 décisions en
  //    production, ZÉRO `override_prof` non nul, zéro en bac à sable — alors que
  //    38 dépôts sont `retire`. Ce geste en est la PREMIÈRE écriture réelle. La
  //    preuve du « fait quand » ne peut donc être qu'une requête en base.
  const fuseau = await lireFuseau()
  const echecsDeJournal: string[] = []
  for (const d of clos) {
    // ⛔⛔ LE `cycle_lundi` SE DÉRIVE, IL NE SE TRONQUE PAS. `assigne_at.slice(0,10)`
    //    prendrait le JOUR UTC d'un `timestamptz` : un dépôt du dimanche 20 h 30 à
    //    Toronto est le lundi 00 h 30 UTC, et l'insert serait REFUSÉ par
    //    `routeur_cycle_lundi_chk CHECK (EXTRACT(isodow FROM cycle_lundi) = 1)`.
    const cycleLundi = toISODate(lundiDuCycle(new Date(d.assigne_at), fuseau))
    const entree = {
      geste: 'cloture_passation', depot_id: d.id, motif: `instance ${exerciceId}`,
      par: userId, at: new Date().toISOString(),
      // La distinction que le `07-` §1.1 veut voir tenue, dite dans le sens de CE geste.
      note: '`abandonne` — le professeur CONSTATE un non-geste de l\'élève à la clôture '
        + 'd\'une passation en classe ; il n\'absout pas. Ne se confond jamais avec '
        + '`retire`, qui est une décision du professeur et SORT du dénominateur d\'assiduité.',
    }
    // ⚠️ SUPABASE-JS NE LÈVE PAS. Le patron du retrait n'attrape aucun `{ error }`
    //    sur ses deux écritures — c'est pourquoi on ne peut même pas affirmer que
    //    ses 38 `retire` ne sont pas passés par un journal échoué en silence. Ici,
    //    l'erreur est captée et REMONTÉE à l'écran.
    const { error } = await admin.from('routeur_decisions').insert({
      eleve_id: d.eleve_id, cycle_lundi: cycleLundi,
      regle_declenchee: 'override_prof', override_prof: [entree],
    })
    if (error) {
      console.error(`[passation] CLÔTURE JOURNALISÉE À MOITIÉ — dépôt ${d.id}, élève `
        + `${d.eleve_id}, cycle ${cycleLundi}`, { code: error.code, message: error.message })
      echecsDeJournal.push(d.id.slice(0, 8))
    }
  }

  rafraichir()
  const bouts = [`${clos.length} dépôt(s) clos`]
  if (deja > 0) bouts.push(`${deja} l’étaient déjà`)
  const fin = clos.length === 0
    ? 'Aucun dépôt n’attendait : rien n’a changé.'
    : 'Les copies remises n’ont pas bougé, et une remise après clôture est désormais refusée.'
  if (echecsDeJournal.length > 0) {
    // ⛔ On le DIT plutôt que de rendre `ok` : le statut est écrit, la trace manque,
    //    et un rejeu ne rattrapera pas — le filtre de statut ne trouvera plus rien.
    return echec(`${bouts.join(', ')}. ⚠️ MAIS LE JOURNAL A ÉCHOUÉ pour `
      + `${echecsDeJournal.length} d’entre eux (${echecsDeJournal.join(', ')}) : les dépôts sont `
      + 'clos, la trace du geste manque, et un rejeu ne la posera pas.')
  }
  return succes(`${bouts.join(', ')}. ${fin}`)
}

/** ÉTAPE 12 — le traitement en lot, par la MÊME file. */
export async function actionDeclencherLeLot(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const exerciceId = String(form.get('exercice_id') ?? '')
  const r = await declencherLeLot(admin, exerciceId)
  if (!r.ok) return echec(r.message)
  rafraichir()
  const bouts = [`${r.data.misEnFile} copie(s) mise(s) en file`]
  if (r.data.dejaEnFile) bouts.push(`${r.data.dejaEnFile} y étaient déjà`)
  if (r.data.sansCopie) bouts.push(`${r.data.sansCopie} sans copie remise, écartée(s)`)
  return succes(`${bouts.join(', ')}. Le traitement est différé : il tourne au fil de la file.`)
}

/**
 * LE RATTRAPAGE — remettre en file la mesure d'UNE copie.
 *
 * ⚠️ Ce n'est pas « déclencher le lot » en plus petit. Le lot ne peut rien pour
 *    une copie dont le job a ABOUTI sans écrire de retour : il la compte « déjà
 *    en file » et passe. Sans ce geste, cette copie n'a plus jamais de retour.
 */
export async function actionRelancerLaMesure(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const depotId = String(form.get('depot_id') ?? '')
  const r = await relancerLaMesure(admin, depotId)
  if (!r.ok) return echec(r.message)
  rafraichir()
  // ⭐ Dire CE QUI repart. Les deux chemins n'ont ni le même coût ni les mêmes
  //    effets, et le professeur paie l'un des deux : il a le droit de le savoir.
  return succes(r.data.etape === 'retour_v1'
    ? 'Le RETOUR SEUL est remis en file — un appel, depuis les jugements déjà écrits. '
      + 'Ni les mesures ni les jugements ne seront retouchés.'
    : 'La MESURE COMPLÈTE est remise en file — la copie sera rejugée. '
      + 'Les mesures déjà écrites ne seront pas réécrites.')
}

/** ÉTAPE 14 — il peut modifier le retour. */
export async function actionEditerLeRetour(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const retourId = String(form.get('retour_id') ?? '')
  let points: PointRetour[]
  try {
    points = JSON.parse(String(form.get('points') ?? '[]')) as PointRetour[]
  } catch {
    return echec('Le retour édité n’a pas pu être lu.')
  }
  const r = await editerLeRetour(admin, retourId, points)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Retour enregistré.')
}

/** ÉTAPE 15 — le commentaire général. AUCUNE NOTE. */
export async function actionCommentaireGeneral(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin, userId } = await garderProf(false)
  const depotId = String(form.get('depot_id') ?? '')
  const r = await ecrireLeCommentaireGeneral(
    admin, depotId, userId, String(form.get('commentaire') ?? ''))
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Commentaire enregistré.')
}

/** La règle 3 du `06-` §1 — le message reporté, sur le dépôt et nulle part ailleurs. */
export async function actionMessageReporte(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const depotId = String(form.get('depot_id') ?? '')
  const r = await poserLeMessageReporte(admin, depotId, String(form.get('message') ?? ''))
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Le message sera affiché à la prochaine passation en classe de cet élève.')
}

/** ÉTAPE 16 — valider en masse ou individuellement. */
export async function actionValiderLesCorrections(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin, userId } = await garderProf(false)
  const ids = form.getAll('depot_id').map(String).filter((x) => x !== '')
  const r = await validerLesCorrections(admin, ids, userId)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes(`${r.data.valides} correction(s) validée(s).`)
}

/** ÉTAPE 17 — la case de publication. */
export async function actionPublier(_prec: Reponse | null, form: FormData): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const ids = form.getAll('depot_id').map(String).filter((x) => x !== '')
  const r = await publier(admin, ids)
  if (!r.ok) return echec(r.message)
  rafraichir()
  const reste = r.data.sansRetour.length
    ? ` ${r.data.sansRetour.length} copie(s) sans retour n’ont rien à publier.`
    : ''
  return succes(`${r.data.publies} retour(s) publié(s) — l’élève devra valider sa lecture.${reste}`)
}

export async function actionDepublier(_prec: Reponse | null, form: FormData): Promise<Reponse> {
  const { admin } = await garderProf(false)
  const ids = form.getAll('depot_id').map(String).filter((x) => x !== '')
  const r = await depublier(admin, ids)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes(`${r.data.depublies} retour(s) dépublié(s).`)
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉLÈVE — il dépose LUI-MÊME, depuis son compte
// ─────────────────────────────────────────────────────────────────────────────

export async function actionPreparerLesPhotos(
  depotId: string, nb: number,
): Promise<{ ok: true; uploads: Array<{ ordre: number; path: string; token: string }> }
  | { ok: false; message: string }> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return { ok: false, message: 'La passation en classe n’est pas ouverte.' }
  const r = await preparerDepotDesPhotos(admin, depotId, userId, nb)
  return r.ok ? { ok: true, uploads: r.data.uploads } : { ok: false, message: r.message }
}

/**
 * Enregistre les photos, met la transcription en file, ET LA DÉCLENCHE.
 *
 * ⚠️ C'EST LE CHOIX DU PIÈGE 2, et il est motivé au relevé : file PLUS
 *    déclenchement immédiat. La file donne l'idempotence, la reprise et la
 *    visibilité de l'échec ; le déclenchement immédiat donne la seconde. Une
 *    tâche planifiée « ne tient pas la seconde » et reste le FILET.
 */
export async function actionEnvoyerLesPhotos(
  depotId: string, photos: Photo[],
): Promise<Reponse & { blocs?: number; confiance?: number | null }> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return echec('La passation en classe n’est pas ouverte.')

  const enr = await enregistrerLesPhotos(admin, depotId, userId, photos)
  if (!enr.ok) return echec(enr.message)

  const file = await mettreLaTranscriptionEnFile(admin, depotId)
  if (!file.ok) return echec(file.message)

  const { bilan, motif } = await transcrireMaintenant(admin, depotId)
  rafraichir()
  if (!bilan) {
    return {
      ok: true,
      message: motif
        ? `Photos envoyées. ${motif} — l’écran se mettra à jour.`
        : 'Photos envoyées. La transcription arrive.',
    }
  }
  return {
    ok: true,
    message: `Photos envoyées. Transcription faite en ${(bilan.dureeMs / 1000).toFixed(1)} s.`,
    blocs: bilan.nbBlocs,
    confiance: bilan.confiance,
  }
}

/** ÉTAPE 7 — l'élève relit et corrige. Le découpage se conserve TEL QUEL. */
export async function actionEnregistrerLaTranscription(
  depotId: string, texte: string,
): Promise<Reponse> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return echec('La passation en classe n’est pas ouverte.')
  const r = await enregistrerLaTranscription(admin, depotId, userId, texte)
  return r.ok ? succes('Enregistré.') : echec(r.message)
}

/** ÉTAPE 8 — il valide. Tout est sauvegardé. */
export async function actionValiderLaTranscription(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return echec('La passation en classe n’est pas ouverte.')
  const depotId = String(form.get('depot_id') ?? '')
  const r = await validerLaTranscription(admin, depotId, userId, String(form.get('texte') ?? ''))
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Copie validée.')
}

/** L'élève exempté rédige au clavier — sa copie reste une ancre. */
export async function actionValiderLaSaisieClavier(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return echec('La passation en classe n’est pas ouverte.')
  const depotId = String(form.get('depot_id') ?? '')
  const r = await validerLaSaisieClavier(admin, depotId, userId, String(form.get('texte') ?? ''))
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Copie validée.')
}

/**
 * Une tentative de collage bloquée — JOURNALISÉE SUR LE DÉPÔT et rapportée au
 * professeur (décision de Louis, 22/08) ; jamais un signal du faisceau.
 *
 * ⚠️ `moyen` est TYPÉ, et pas une chaîne libre : il voyage jusqu'à une garde en
 *    base qui ferme le domaine aux trois vecteurs de la source.
 */
export async function actionCollageBloque(
  depotId: string, moyen: MoyenDeCollage,
): Promise<void> {
  const { admin, userId } = await garderEleve(false)
  // ⛔ LA GARDE DE PROPRIÉTÉ, QUE SA JUMELLE DU DÉROULÉ PORTAIT DÉJÀ. Sans elle,
  //    un élève appelait cette action avec le `depotId` d'un AUTRE et lui
  //    fabriquait une accusation de collage (`journaliser_collage` écrit
  //    `where id = depotId`, sans filtre). La version `app/deroule/actions.ts`
  //    lit `lireDepotMaison(admin, depotId, userId)` avant ; ici, `lireDepot`
  //    porte `eleve_id` et suffit. Éprouvé en base : l'écriture croisée
  //    réussissait, elle est désormais refusée.
  const d = await lireDepot(admin, depotId)
  if (!d || d.eleve_id !== userId) return
  // ⭐ C10 · L2 — LA MÊME GARDE, AU MÊME ENDROIT, POUR LA MÊME RAISON. Le RPC
  //    `journaliser_collage` est `SECURITY INVOKER` et fait `update … where id =
  //    p_depot_id` SANS AUCUN FILTRE : ni statut, ni élève. La garde
  //    d'appartenance a déjà été ajoutée ICI, dans l'appelant, plutôt qu'au RPC
  //    (le toucher serait une migration, que ce lot n'a pas le droit de faire).
  //    La garde de clôture suit le même chemin.
  if (depotClos(d)) return
  await journaliserCollageBloque(admin, depotId, userId, moyen)
}

/** ÉTAPE 9 — « se juger », deux questions, jamais trois. */
export async function actionSeJuger(_prec: Reponse | null, form: FormData): Promise<Reponse> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return echec('La passation en classe n’est pas ouverte.')
  const depotId = String(form.get('depot_id') ?? '')
  const offre = await offreSeJuger(admin, depotId)
  const reponses: Record<string, string> = {}
  for (const q of offre.questions) {
    const v = form.get(`q:${q.observable_code}`)
    if (typeof v === 'string' && v !== '') reponses[q.observable_code] = v
  }
  const r = await enregistrerSeJuger(admin, depotId, userId, offre, reponses)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Merci — c’est enregistré.')
}

/** ÉTAPE 10 — la confiance de remise : UNE VALEUR PAR COMPÉTENCE. */
export async function actionConfianceRemise(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return echec('La passation en classe n’est pas ouverte.')
  const depotId = String(form.get('depot_id') ?? '')
  const parCompetence: Record<string, string> = {}
  for (const [cle, v] of form.entries()) {
    if (cle.startsWith('c:') && typeof v === 'string' && v !== '') {
      parCompetence[cle.slice(2)] = v
    }
  }
  const r = await enregistrerConfianceRemise(admin, depotId, userId, parCompetence)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Merci — c’est enregistré.')
}

/** La crédence — commandée par le GESTE, pas par le lieu. */
export async function actionCredence(_prec: Reponse | null, form: FormData): Promise<Reponse> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return echec('La passation en classe n’est pas ouverte.')
  const depotId = String(form.get('depot_id') ?? '')
  // ⛔ LA GARDE DE PROPRIÉTÉ, AVANT `offreCredence` — pas seulement dans
  //    `enregistrerCredence` plus bas. Sans elle, `offreCredence` servait, pour
  //    le `depot_id` d'un AUTRE élève, le CRAN et le GESTE de son instance (ou
  //    « périmètre illisible », un oracle d'existence). C'est le patron de la
  //    maison — `lireDepot` + `eleve_id !== userId` — posé au plus tôt.
  const d = await lireDepot(admin, depotId)
  if (!d || d.eleve_id !== userId) return echec('Ce dépôt n’est pas le vôtre.')
  const offre = await offreCredence(admin, depotId)
  if (!offre.servie) return echec(`La crédence n’est pas servie ici : ${offre.motif}`)

  // ⭐ UNE SAISIE PAR CAS — « il y en a une par diagnostic, donc DEUX sur une
  //    paire » (`07-` §1.2). Le formulaire préfixe donc chaque champ par
  //    l'ordre du cas : avant le 22/08 il n'en lisait qu'un, et le second temps
  //    d'une paire n'était jamais crédité.
  const saisies: Array<{ cas: number; valeurs: Record<string, number> | { pourcentage: number } }> = []
  for (const c of offre.cas) {
    if (offre.forme === 'jetons_sur_100') {
      const valeurs: Record<string, number> = {}
      let vu = false
      for (const cand of c.candidats) {
        const brut = form.get(`j:${c.ordre}:${cand}`)
        if (brut != null) vu = true
        valeurs[cand] = Number(brut ?? 0)
      }
      if (vu) saisies.push({ cas: c.ordre, valeurs })
    } else {
      // ⚠️ ABSENT N'EST PAS ZÉRO — la même règle que « `delta_v1_vf` NULL n'est
      //    pas 0 » (`06-` §6). Un champ manquant fabriqué en « 0 % de chances »
      //    serait une crédence INVENTÉE, et le Monitoring la croirait déclarée.
      //    On ne pousse rien : la garde d'`enregistrerCredence` refuse alors la
      //    saisie en nommant le cas qui manque.
      const brut = form.get(`pourcentage:${c.ordre}`)
      if (brut != null) {
        saisies.push({ cas: c.ordre, valeurs: { pourcentage: Number(brut) } })
      }
    }
  }
  const r = await enregistrerCredence(admin, depotId, userId, saisies)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Merci — c’est enregistré.')
}

/** L'OBLIGATION DE LECTURE — un seul domicile pour un seul geste : `lu_at`. */
export async function actionValiderLaLecture(
  _prec: Reponse | null, form: FormData,
): Promise<Reponse> {
  const { admin, userId } = await garderEleve(false)
  const retourId = String(form.get('retour_id') ?? '')
  const r = await validerLaLecture(admin, retourId, userId)
  if (!r.ok) return echec(r.message)
  rafraichir()
  return succes('Lecture validée.')
}

/** L'état d'attente, pour que l'écran de l'élève ne mente pas. */
export async function actionEtatDuDepot(depotId: string): Promise<{
  transcription: string | null
  confiance: number | null
  valide: boolean
} | null> {
  const { admin, userId } = await garderEleve(false)
  const d = await lireDepot(admin, depotId)
  if (!d || d.eleve_id !== userId) return null
  return {
    transcription: d.transcription_v1,
    confiance: d.confiance_ocr_v1,
    valide: d.v1_remis_at != null,
  }
}
