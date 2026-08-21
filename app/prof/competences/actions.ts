'use server'

// ============================================================================
// C4 · L8 — LE LIEU OÙ VIVENT LES COMPÉTENCES : les trois gestes.
// ----------------------------------------------------------------------------
// « Le professeur y DÉPOSE SES FICHES, il y LIT CE QU'ELLES PORTENT, et il y
//   DÉCLARE LE STATUT DE RECETTE de chacune, parmi les trois — et celui du
//   MONITORING, sur sa propre ligne, avec un avertissement avant de le valider
//   `evaluee`. C'EST LE SEUL ENDROIT D'OÙ UN STATUT SE POSE ; sans lui il se
//   pose en base, à la main, sans que rien ne le relise » (`07-` §2, C4-L8).
//
// ⚠️ Les deux PLANCHERS MÉCANIQUES sont gardés en base, par
//    `poser_statut_recette` (`c4_l8_fabrique.sql`). Les TROIS CONDITIONS DE BANC
//    — quinze copies, 80 % à ±1 palier, golds écrits avant — « ne sont gardées
//    par aucun mécanisme : c'est le professeur qui les vérifie avant de poser
//    `evaluee` » (`03-` §9 ; piège 6). L'écran ne les contrôle pas, ne les
//    devine pas, et NE LES AFFICHE PAS DEPUIS UNE VALEUR INVENTÉE.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/fabrique/acces'
import { lireFiche, FicheIllisible } from '@/utils/fabrique/fiche-competence'

export interface Retour { ok: boolean; message: string; details?: string[] }

/**
 * Le dépôt d'une fiche. « Le dépôt d'une fiche VERSE AUSSI sa section de
 * correspondance — la banque des questions "se juger", par observable » (§2).
 *
 * « Redéposer une fiche dont la VERSION a bougé remplace la correspondance et
 * change la version citée ; RIEN D'AUTRE NE LA CHANGE » (§1.1).
 */
export async function deposerFiche(_prec: Retour | null, form: FormData): Promise<Retour> {
  const { admin, userId } = await garderProf(false)
  const fichier = form.get('fiche')
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: false, message: 'Aucun fichier déposé.' }
  }
  const contenu = await fichier.text()

  let fiche
  try {
    fiche = lireFiche(contenu, fichier.name)
  } catch (e) {
    if (e instanceof FicheIllisible) return { ok: false, message: e.message }
    throw e
  }

  const { error: e1 } = await admin.from('competences_fiches').upsert({
    competence: fiche.competence,
    version: fiche.version,
    statut: fiche.statut,
    nom_fichier: fichier.name,
    contenu,
    deposee_par: userId,
    deposee_at: new Date().toISOString(),
  })
  if (e1) return { ok: false, message: `Le dépôt a échoué : ${e1.message}` }

  // La correspondance : le REMPLACEMENT est intégral — « redéposer une fiche
  // dont la VERSION a bougé REMPLACE la correspondance » (§1.1). Le Monitoring
  // n'en a pas (competences/monitoring.md §4).
  if (fiche.competence !== 'monitoring') {
    await admin.from('competences_correspondance').delete().eq('competence', fiche.competence)
    if (fiche.correspondance.length > 0) {
      const { error: e2 } = await admin.from('competences_correspondance').insert(
        fiche.correspondance.map((b) => ({
          competence: fiche.competence,
          observable_code: b.observable_code,
          dimension_eleve: b.dimension_eleve,
          question: b.question,
          reponses: b.reponses,
          fiche_version: fiche.version,
          ordre: b.ordre,
        })))
      if (e2) return { ok: false, message: `La correspondance n'a pas été versée : ${e2.message}` }
    }
  }

  revalidatePath('/prof/competences')
  const n = fiche.correspondance.length
  return {
    ok: true,
    message: `Fiche « ${fiche.competence} » déposée en version ${fiche.version} — `
      + (fiche.competence === 'monitoring'
        ? 'le Monitoring n\'a pas de correspondance, et c\'est la règle.'
        : `${n} bloc(s) de correspondance versés.`),
    details: fiche.avertissements,
  }
}

/**
 * Poser un statut de recette. « Le statut se pose sur LA COMPÉTENCE, et son état
 * vit PAR ÉLÈVE » (§1.3 ; piège 7), et « poser un statut EN ÉCRIT LA DATE DANS
 * LE MÊME GESTE » (§1.3) — c'est la fonction serveur qui le garantit.
 *
 * « Et l'activation par classe EN DÉCOULE, SANS SECOND GESTE : une compétence
 * déclarée `evaluee` l'est POUR TOUTES LES CLASSES » (§1.3).
 */
export async function poserStatut(_prec: Retour | null, form: FormData): Promise<Retour> {
  const { admin } = await garderProf(false)
  const competence = String(form.get('competence') ?? '')
  const statut = String(form.get('statut') ?? '')

  if (competence === 'monitoring') {
    // « Le passer à `evaluee` demande une CONFIRMATION, PRÉCÉDÉE D'UN
    // AVERTISSEMENT — l'instrument n'a pas de banc avant l'année qui le sert »
    // (§1.4 ; competences/monitoring.md §6 et §8 ; piège 4).
    if (statut === 'evaluee' && form.get('confirme') !== 'oui') {
      return { ok: false, message: 'Le passage du Monitoring à `evaluee` demande une confirmation.' }
    }
    const { data, error } = await admin.rpc('poser_statut_recette_monitoring', {
      p_statut: statut, p_pose_le: new Date().toISOString(),
    })
    if (error) return { ok: false, message: error.message }
    revalidatePath('/prof/competences')
    return { ok: true, message: `Monitoring → ${statut} — ${data ?? 0} ligne(s), ses deux sous-dimensions.` }
  }

  const { data, error } = await admin.rpc('poser_statut_recette', {
    p_competence: competence, p_statut: statut, p_pose_le: new Date().toISOString(),
  })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/prof/competences')
  revalidatePath('/prof/classes')
  return {
    ok: true,
    message: `${competence} → ${statut} — ${data ?? 0} ligne(s) d'élève, la date posée dans le même geste.`,
  }
}

/**
 * L'OPT-OUT, au profil de la classe. « Ce que le professeur peut poser, c'est un
 * opt-out, au profil de la classe, au tableau de pilotage — LA COMPÉTENCE QUE CE
 * COURS NE TRAVAILLE PAS — et c'est CE CHOIX-LÀ que
 * `competences_actives_par_classe` enregistre » (§1.3 ; piège 7).
 * « Aucune liste d'activation à cocher classe par classe, aucune ligne à la main. »
 */
export async function poserOptOut(_prec: Retour | null, form: FormData): Promise<Retour> {
  const { admin } = await garderProf(false)
  const classeId = String(form.get('classe_id') ?? '')
  const competence = String(form.get('competence') ?? '')
  const active = form.get('active') === 'oui'
  const { error } = await admin.from('competences_actives_par_classe').upsert({
    classe_id: classeId, competence, active, updated_at: new Date().toISOString(),
  })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/prof/competences')
  revalidatePath(`/prof/classes/${classeId}`)
  return {
    ok: true,
    message: active
      ? `${competence} redevient active dans ce cours.`
      : `${competence} : opt-out posé — ce cours ne la travaille pas.`,
  }
}
