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

  // ⚠️ UN REMPLACEMENT QUI NE REMPLACE RIEN EST UNE DESTRUCTION.
  //   « Redéposer une fiche dont la VERSION a bougé REMPLACE la correspondance »
  //   (§1.1) — remplace, pas efface. Or `lireFiche` ne jette pas quand la
  //   section de correspondance ne se lit plus : elle avertit. Supprimer d'abord
  //   et n'insérer rien ensuite viderait la banque des questions « se juger »
  //   d'une compétence déjà `evaluee`, en annonçant un succès. Le plancher
  //   mécanique ne garderait rien : il garde la TRANSITION vers `evaluee`, pas
  //   l'état de celles qui y sont déjà.
  //   Donc : si la lecture ne rend AUCUN bloc alors que la base en porte, on
  //   refuse le dépôt ENTIER, et on dit pourquoi.
  const aCorrespondance = fiche.competence !== 'monitoring'
  if (aCorrespondance && fiche.correspondance.length === 0) {
    const { count, error: eLecture } = await admin
      .from('competences_correspondance')
      .select('observable_code', { count: 'exact', head: true })
      .eq('competence', fiche.competence)
    if (eLecture) {
      return { ok: false, message: `Impossible de lire la correspondance en place : ${eLecture.message}` }
    }
    if ((count ?? 0) > 0) {
      return {
        ok: false,
        message: `Cette fiche ne porte aucune correspondance lisible, et ${count} bloc(s) sont `
          + 'déjà en base pour cette compétence. Le dépôt est refusé : le remplacer par rien '
          + 'effacerait les questions « se juger » sans que personne le voie.',
        details: [...fiche.avertissements,
          'Vérifiez le titre de la section — « La correspondance observable → formulation » — '
          + 'et la table à quatre colonnes qui le suit.'],
      }
    }
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

  // Le Monitoring n'a pas de correspondance (competences/monitoring.md §4).
  if (aCorrespondance && fiche.correspondance.length > 0) {
    const { error: eSuppr } = await admin.from('competences_correspondance')
      .delete().eq('competence', fiche.competence)
    if (eSuppr) {
      return { ok: false, message: `L'ancienne correspondance n'a pas pu être retirée : ${eSuppr.message}` }
    }
    const { data: posees, error: e2 } = await admin.from('competences_correspondance').insert(
      fiche.correspondance.map((b) => ({
        competence: fiche.competence,
        observable_code: b.observable_code,
        dimension_eleve: b.dimension_eleve,
        question: b.question,
        reponses: b.reponses,
        fiche_version: fiche.version,
        ordre: b.ordre,
      }))).select('observable_code')
    if (e2) {
      return {
        ok: false,
        message: `La correspondance n'a PAS été versée, et l'ancienne a été retirée : ${e2.message}`,
        details: ['Redéposez la fiche : la compétence n’est pas déclarable `evaluee` en l’état.'],
      }
    }
    if ((posees ?? []).length !== fiche.correspondance.length) {
      return {
        ok: false,
        message: `${(posees ?? []).length} bloc(s) versés sur ${fiche.correspondance.length} lus. `
          + 'Redéposez la fiche.',
      }
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
    // ⚠️ « 0 ligne » n'est pas un succès : le statut vit PAR ÉLÈVE (§1.3), et
    // sans ligne il n'a aucun domicile. L'annoncer en vert contredirait le
    // bandeau, qui affichera « aucun statut posé » au rafraîchissement.
    const n = Number(data ?? 0)
    return n > 0
      ? { ok: true, message: `Monitoring → ${statut} — ${n} ligne(s), ses deux sous-dimensions.` }
      : { ok: false, message: 'Aucune ligne où poser ce statut : aucun élève n’a d’inscription '
          + 'active. Le statut n’a pas de domicile tant qu’il n’y en a pas.' }
  }

  const { data, error } = await admin.rpc('poser_statut_recette', {
    p_competence: competence, p_statut: statut, p_pose_le: new Date().toISOString(),
  })
  if (error) return { ok: false, message: error.message }
  revalidatePath('/prof/competences')
  revalidatePath('/prof/classes')
  const n = Number(data ?? 0)
  return n > 0
    ? { ok: true,
      message: `${competence} → ${statut} — ${n} ligne(s) d'élève, la date posée dans le même geste.` }
    : { ok: false,
      message: 'Aucune ligne où poser ce statut : aucun élève n’a d’inscription active. '
        + 'Le statut vit par élève, et sans ligne il n’a pas de domicile.' }
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
  const { data, error } = await admin.from('competences_actives_par_classe').upsert({
    classe_id: classeId, competence, active, updated_at: new Date().toISOString(),
  }).select('classe_id')
  if (error) return { ok: false, message: error.message }
  if ((data ?? []).length === 0) {
    return { ok: false, message: 'Aucune ligne écrite — l’opt-out n’a pas été posé.' }
  }
  revalidatePath('/prof/competences')
  revalidatePath(`/prof/classes/${classeId}`)
  return {
    ok: true,
    message: active
      ? `${competence} redevient active dans ce cours.`
      : `${competence} : opt-out posé — ce cours ne la travaille pas.`,
  }
}
