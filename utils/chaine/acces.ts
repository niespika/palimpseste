import 'server-only'
// ============================================================================
// C4 · L5 — L'INTERRUPTEUR PROPRE DE LA CHAÎNE.
// ----------------------------------------------------------------------------
// « Il se construit DERRIÈRE SON PROPRE INTERRUPTEUR À OFF, pendant que les
//   trois du `07-` §1.5 restent à OFF aussi. »           — la mission
//
// « La coupure bascule L'INTERRUPTEUR DE LA CHAÎNE — le flag propre de ce lot,
//   JAMAIS l'un des trois du §1.5, qui commandent les élèves, le routeur et
//   l'affichage et RESTENT AU PROFESSEUR. »              — piège 49
//
// D'où deux fonctions, et la seconde n'écrit que dans `chaine_actif`.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

export async function chaineActive(admin: Admin): Promise<boolean> {
  const { data } = await admin
    .from('scriptorium_params').select('chaine_actif').limit(1).maybeSingle()
  return !!data?.chaine_actif
}

/**
 * La coupure automatique. Elle ne touche QUE `chaine_actif` — les trois
 * interrupteurs du §1.5 sont au professeur, et rien ici ne les lit ni ne les écrit.
 */
export async function couperLaChaine(admin: Admin, motif: string): Promise<void> {
  const { data } = await admin
    .from('scriptorium_params').select('id, chaine_actif').limit(1).maybeSingle()
  if (!data || data.chaine_actif === false) return
  const { error } = await admin
    .from('scriptorium_params').update({ chaine_actif: false }).eq('id', data.id)
  // supabase-js ne LÈVE pas : il retourne `{ error }`. Une coupure qui échoue en
  // silence est exactement le mode de panne que C11a a payé cher (cout-api.ts).
  console.error(`[chaine] COUPURE AUTOMATIQUE — ${motif}`
    + (error ? ` — ⚠️ ÉCHEC DE LA BASCULE : ${error.code} ${error.message}` : ' — interrupteur basculé à OFF'))
}

/** Rouvrir est un geste du professeur ; cette fonction existe pour la recette. */
export async function rouvrirLaChaine(admin: Admin): Promise<void> {
  const { data } = await admin
    .from('scriptorium_params').select('id').limit(1).maybeSingle()
  if (data) await admin.from('scriptorium_params').update({ chaine_actif: true }).eq('id', data.id)
}
