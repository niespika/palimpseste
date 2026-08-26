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
} from '@/utils/passation/depots'
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
  return succes('Copie remise en file. Le traitement repart au prochain passage de la chaîne ; '
    + 'les mesures déjà écrites ne seront pas réécrites.')
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
