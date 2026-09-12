'use server'

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/routeur/acces'

type RetourPortePilote = { ok: boolean; message: string }

export async function actionBasculerPiloteArgument(
  _prec: RetourPortePilote | null, form: FormData,
): Promise<RetourPortePilote> {
  return basculerPorte(form, 'pilote_argument_actif')
}

export async function actionBasculerBanqueArgument(
  _prec: RetourPortePilote | null, form: FormData,
): Promise<RetourPortePilote> {
  return basculerPorte(form, 'pilote_argument_banque_actif')
}

async function basculerPorte(form: FormData, colonne: 'pilote_argument_actif' | 'pilote_argument_banque_actif'): Promise<RetourPortePilote> {
  const { admin } = await garderProf(false)
  const valeur = form.get('actif')
  if (valeur !== 'oui' && valeur !== 'non') {
    return { ok: false, message: 'Choix invalide. Recharge la page puis réessaie.' }
  }
  const actif = valeur === 'oui'
  const { data, error } = await admin.from('scriptorium_params')
    .update({ [colonne]: actif }).eq('id', 1).select(colonne).maybeSingle()
  if (error || (data as Record<string, unknown> | null)?.[colonne] !== actif) {
    return { ok: false, message: 'Le changement n’a pas pu être enregistré. Recharge la page puis réessaie.' }
  }
  revalidatePath('/prof/scriptorium')
  revalidatePath('/prof/conception', 'layout')
  revalidatePath('/eleve', 'layout')
  if (colonne === 'pilote_argument_banque_actif') {
    return { ok: true, message: actif ? 'La distribution automatique est ouverte.' : 'La distribution automatique est fermée. Les exercices déjà attribués restent accessibles si le pilote est ouvert.' }
  }
  return { ok: true, message: actif ? 'Le pilote est ouvert.' : 'Le pilote est fermé. Les travaux sont conservés.' }
}
