'use server'

// ============================================================================
// CODEX — L'ÉPREUVE MINUTÉE : LES ACTIONS DE LA PAGE PROJETÉE ET DE LA
// TABLETTE. 24/09/2026.
// ----------------------------------------------------------------------------
// Le travail vit à `utils/examens/epreuve-serveur.ts` ; ce fichier garde, appelle,
// rafraîchit. Patron : `app/passation/actions.ts`.
//
// ⛔ UN FICHIER `'use server'` N'EXPORTE QUE DES FONCTIONS ASYNC : un `export
//    type { … }` y tue TOUT le module à l'exécution, sans que `tsc` ni les tests
//    ne le voient (24/08). Les formes de retour sont des `interface` locales.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf, garderEleve } from '@/utils/passation/garde'
import { lireDepot, ouvrirLesDepots } from '@/utils/passation/depots'
import { depotClos } from '@/utils/passation/statuts'
import {
  lireEtOuvrirSiVenue, compterLesCopies, reglerLEpreuve, lancerLEpreuve, annulerLeLancement,
  ajouterDuTemps, lireLaPorteEpreuve, basculerLaPorteEpreuve, epreuvesDeLEleve, signatureDesEpreuves,
} from '@/utils/examens/epreuve-serveur'
import { lireDuree, BORNES_REDACTION, BORNES_RELECTURE } from '@/utils/examens/epreuve'
import { createClient } from '@/utils/supabase/server'
import { contexteClasseEleve } from '@/app/eleve/contexte-classe'

export interface ReponseEpreuve { ok: boolean; message: string }

/** Ce que la page projetée relit toutes les quinze secondes. */
export interface EtatProjete {
  /** L'heure du SERVEUR : le poste du projecteur peut avoir une horloge fausse. */
  maintenant: string
  debut: string | null
  redactionMin: number | null
  relectureMin: number | null
  consignesPratiques: string | null
  /** L'heure d'ouverture automatique POSÉE au lancement. */
  ouverture: string | null
  compte: { total: number; ouverts: number; remis: number; ouvertLe: string | null }
  /** La passation en classe est-elle ouverte aux élèves (`passation_classe_actif`) ? */
  passationActive: boolean
}

/** Ce que la tablette relit toutes les quinze secondes. */
export interface EtatDeMonEpreuve {
  maintenant: string
  lancee: boolean
  /** L'heure d'ouverture posée au lancement : la tablette se redessine si elle change. */
  ouverture: string | null
  ouvert: boolean
  clos: boolean
}

function rafraichir(exerciceId?: string): void {
  revalidatePath('/prof/codex', 'layout')
  revalidatePath('/eleve/modules/codex', 'layout')
  if (exerciceId) revalidatePath(`/prof/codex/passation/${exerciceId}/projection`)
}

// ─────────────────────────────────────────────────────────────────────────────
// LE PROFESSEUR
// ─────────────────────────────────────────────────────────────────────────────

/** Le sondage de la page projetée — et l'ouverture automatique si l'heure est venue. */
export async function actionEtatDeLEpreuve(exerciceId: string): Promise<EtatProjete | null> {
  const { admin, actif } = await garderProf(false)
  const { epreuve, ouverts } = await lireEtOuvrirSiVenue(admin, exerciceId)
  if (!epreuve) return null
  if (ouverts > 0) rafraichir(exerciceId)
  return {
    maintenant: new Date().toISOString(),
    debut: epreuve.debut,
    redactionMin: epreuve.redactionMin,
    relectureMin: epreuve.relectureMin,
    consignesPratiques: epreuve.consignesPratiques,
    ouverture: epreuve.ouverture,
    compte: await compterLesCopies(admin, exerciceId),
    passationActive: actif,
  }
}

/** Régler l'épreuve depuis la page projetée : durées (avant le lancement), consignes pratiques. */
export async function actionReglerLEpreuve(
  _prec: ReponseEpreuve | null, form: FormData,
): Promise<ReponseEpreuve> {
  const { admin } = await garderProf(false)
  const exerciceId = String(form.get('exercice_id') ?? '')
  const reglage: Parameters<typeof reglerLEpreuve>[2] = {}
  if (form.has('redaction_min')) {
    const r = lireDuree(form.get('redaction_min'), BORNES_REDACTION)
    if (!r.ok) return { ok: false, message: `Durée de rédaction : ${r.message}` }
    reglage.redactionMin = r.valeur
  }
  if (form.has('relecture_min')) {
    const r = lireDuree(form.get('relecture_min'), BORNES_RELECTURE)
    if (!r.ok) return { ok: false, message: `Durée de relecture : ${r.message}` }
    reglage.relectureMin = r.valeur
  }
  if (form.has('consignes_pratiques')) {
    reglage.consignesPratiques = String(form.get('consignes_pratiques') ?? '')
  }
  const r = await reglerLEpreuve(admin, exerciceId, reglage)
  if (!r.ok) return { ok: false, message: r.message }
  rafraichir(exerciceId)
  return { ok: true, message: 'Enregistré.' }
}

export async function actionLancerLEpreuve(exerciceId: string): Promise<ReponseEpreuve> {
  const { admin } = await garderProf(false)
  const r = await lancerLEpreuve(admin, exerciceId)
  if (!r.ok) return { ok: false, message: r.message }
  rafraichir(exerciceId)
  return { ok: true, message: 'L’épreuve est lancée : le sujet s’affiche sur les tablettes.' }
}

export async function actionAnnulerLeLancement(exerciceId: string): Promise<ReponseEpreuve> {
  const { admin } = await garderProf(false)
  const r = await annulerLeLancement(admin, exerciceId)
  if (!r.ok) return { ok: false, message: r.message }
  rafraichir(exerciceId)
  return { ok: true, message: 'Lancement annulé : le sujet ne s’affiche plus sur les tablettes.' }
}

export async function actionAjouterDuTemps(exerciceId: string): Promise<ReponseEpreuve> {
  const { admin } = await garderProf(false)
  const r = await ajouterDuTemps(admin, exerciceId, 5)
  if (!r.ok) return { ok: false, message: r.message }
  rafraichir(exerciceId)
  return { ok: true, message: '5 minutes ajoutées.' }
}

/**
 * Ouvrir le dépôt TOUT DE SUITE, sans attendre la moitié du temps — le geste
 * manuel d'hier, gardé pour les cas que l'horloge ne prévoit pas. La page le
 * demande en deux temps : ouvrir ne se défait pas.
 */
export async function actionOuvrirLeDepotMaintenant(exerciceId: string): Promise<ReponseEpreuve> {
  const { admin } = await garderProf(false)
  if (!(await lireLaPorteEpreuve(admin))) {
    return { ok: false, message: 'L’épreuve minutée est fermée : ouvrez le dépôt depuis l’écran de passation.' }
  }
  const r = await ouvrirLesDepots(admin, exerciceId)
  if (!r.ok) return { ok: false, message: r.message }
  rafraichir(exerciceId)
  return { ok: true, message: `Dépôt ouvert pour ${r.data.ouverts} élève(s).` }
}

/** L'interrupteur, depuis Codex → Paramètres. */
export async function actionBasculerLEpreuve(
  _prec: ReponseEpreuve | null, form: FormData,
): Promise<ReponseEpreuve> {
  const { admin } = await garderProf(false)
  const r = await basculerLaPorteEpreuve(admin, String(form.get('actif') ?? '') === 'oui')
  if (r.ok) {
    revalidatePath('/prof/codex', 'layout')
    revalidatePath('/eleve/modules/codex', 'layout')
  }
  return r
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉLÈVE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Le sondage de la tablette : l'épreuve est-elle lancée, le dépôt ouvert ? Et
 * C'EST LUI QUI OUVRE le plus souvent : trente tablettes sondent pendant que la
 * page projetée n'est qu'une — la première qui passe après l'heure ouvre la
 * classe entière, par le geste du professeur (`ouvrirLesDepots`).
 */
/**
 * ⭐ 24/09 (3ᵉ revue) — LA VEILLE DE L'ONGLET EXAMENS, en action légère. Avant,
 *    l'onglet se RECHARGEAIT entier toutes les 15 s, et seulement si un dépôt
 *    `assigne` à durée fixée était prévu le jour même AU MOMENT DU RENDU : des
 *    durées fixées juste avant le lancement (la page projetée y invite), une
 *    assignation en début d'heure ou un jour prévu déplacé laissaient les
 *    tablettes sur « Rien en classe » après « Lancer ». Désormais : armée dès que
 *    la porte est ouverte, elle lit la signature des épreuves actives, et l'onglet
 *    ne se recharge qu'à un changement. Sa lecture ouvre aussi le dépôt à l'heure.
 */
export async function actionSignatureDesEpreuves(): Promise<string | null> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return null
  const supabase = await createClient()
  const { inscriptions } = await contexteClasseEleve(supabase, userId)
  const epreuves = await epreuvesDeLEleve(admin, userId, inscriptions.map((i) => i.classe_id))
  return signatureDesEpreuves(epreuves)
}

export async function actionEtatDeMonEpreuve(depotId: string): Promise<EtatDeMonEpreuve | null> {
  const { admin, userId, ouvert } = await garderEleve(false)
  if (!ouvert) return null
  const d = await lireDepot(admin, depotId)
  if (!d || d.eleve_id !== userId || d.exercice.lieu !== 'classe') return null
  const { epreuve, ouverts } = await lireEtOuvrirSiVenue(admin, d.exercice_id)
  const relu = ouverts > 0 ? await lireDepot(admin, depotId) : d
  if (ouverts > 0) rafraichir()
  return {
    maintenant: new Date().toISOString(),
    lancee: !!epreuve?.debut,
    ouverture: epreuve?.ouverture ?? null,
    ouvert: (relu ?? d).ouvert_par_prof_at != null,
    clos: depotClos(relu ?? d),
  }
}
