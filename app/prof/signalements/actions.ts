'use server'
// ============================================================================
// LES GESTES DU PROFESSEUR SUR UN SIGNALEMENT.
// ----------------------------------------------------------------------------
// ⭐ TROIS GESTES, ET PAS UN DE PLUS : arbitrer un signalement, basculer la coche
//    « dans le pool », ouvrir ou fermer la porte. La CORRECTION de l'instance,
//    elle, n'est pas ici : elle a son écran depuis C4-L8, et « corriger une
//    instance se fait à l'écran — c'est aussi LE SEUL CHEMIN » (`07-` §1.1).
//    Un second formulaire d'édition serait deux écrans à tenir d'accord.
//
// ⚠️ TOUT LE TRAVAIL VIT À `utils/signalements/serveur.ts` : ce fichier garde la
//    porte, appelle, et revalide. Patron de `app/prof/routeur/actions.ts`.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'
import {
  arbitrerUnSignalement, basculerLePool, basculerLaPorteDuSignalement,
} from '@/utils/signalements/serveur'
import type { Arbitrage } from '@/utils/signalements/regles'

export interface RetourSignalement {
  ok: boolean
  message: string
  details?: string[]
}

function rafraichir(): void {
  revalidatePath('/prof/signalements')
  // ⚠️ L'arbitrage change le STATUT d'un dépôt : l'écran d'assiduité le compte,
  //    et celui de l'élève le sert. Les trois se revalident ensemble, sinon le
  //    professeur relit un chiffre d'avant son propre geste.
  revalidatePath('/prof/routeur')
  revalidatePath('/eleve/modules/codex', 'layout')
  revalidatePath('/eleve/modules/aletheia', 'layout')
}

export async function actionArbitrer(
  _prec: RetourSignalement | null, form: FormData,
): Promise<RetourSignalement> {
  const { admin, userId } = await garderProf(false)
  const id = String(form.get('signalement_id') ?? '')
  const brut = String(form.get('arbitrage') ?? '')
  if (!id) return { ok: false, message: 'Signalement manquant.' }
  if (brut !== 'confirme' && brut !== 'ecarte') {
    return { ok: false, message: `Arbitrage inconnu : « ${brut} ».` }
  }
  const r = await arbitrerUnSignalement(
    admin, id, brut as Arbitrage, userId, new Date().toISOString())
  if (r.ok) rafraichir()
  return r
}

export async function actionBasculerLePool(
  _prec: RetourSignalement | null, form: FormData,
): Promise<RetourSignalement> {
  const { admin } = await garderProf(false)
  const exerciceId = String(form.get('exercice_id') ?? '')
  if (!exerciceId) return { ok: false, message: 'Exercice manquant.' }
  // ⚠️ La case cochée VEUT DIRE « dans le pool ». Un `<input type="checkbox">`
  //    non coché n'envoie RIEN : l'absence de la clé est donc « hors du pool »,
  //    et c'est la lecture juste — pas un défaut à contourner par un champ caché.
  const dansLePool = form.get('dans_le_pool') === 'oui'
  const r = await basculerLePool(admin, exerciceId, dansLePool, new Date().toISOString())
  if (r.ok) rafraichir()
  return r
}

export async function actionBasculerLaPorte(
  _prec: RetourSignalement | null, form: FormData,
): Promise<RetourSignalement> {
  const { admin } = await garderProf(false)
  const actif = form.get('actif') === 'oui'
  const r = await basculerLaPorteDuSignalement(admin, actif)
  if (r.ok) rafraichir()
  return r
}
