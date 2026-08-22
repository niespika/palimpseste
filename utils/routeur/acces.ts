// ============================================================================
// C4 · L2 — LA GARDE DES ÉCRANS DU PILOTAGE, ET LA LECTURE DE L'INTERRUPTEUR.
// ----------------------------------------------------------------------------
// ⚠️ CE FICHIER N'EST PAS PUR — il touche la base. Aucune règle n'y vit : les
//    règles sont dans les `*.ts` purs du dossier, et `npm test` les éprouve.
//
// « `routeur_actif` RESTE À OFF — le routeur prend ses couches à l'allumage
//   SANS RIEN CHANGER AU SCHÉMA NI AUX ÉCRANS » (`07-` §5 ; piège 54).
//
// LA COUPURE QUE CELA POSE, ET ELLE EST NETTE :
//   · les QUATRE ÉCRANS de ce lot sont ceux du PROFESSEUR QUI PILOTE. Ils se
//     visitent, interrupteur à OFF ou à ON — « aucun des trois ne nomme le
//     professeur qui prépare » (le même partage que C4-L8, `utils/fabrique/acces.ts`).
//     Ils LISENT `routeur_actif` POUR LE MONTRER, jamais pour se fermer ;
//   · le MOTEUR, lui, est derrière `routeur_actif` : tant qu'il est à OFF, le
//     routeur n'assigne rien. « Si l'allumage exige un changement, quelque chose
//     est mal construit. »
// ============================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type Admin = ReturnType<typeof createAdminClient>

export interface AccesRouteur {
  admin: Admin
  userId: string
  /** `07-` §5 — l'interrupteur qui commande LE MOTEUR, jamais ces écrans. */
  routeurActif: boolean
}

/**
 * Le professeur, et lui seul. Redirige un élève, refuse un anonyme.
 * `redirection` à `false` pour les actions serveur, qui jettent au lieu de rediriger.
 * *Patron repris de `utils/fabrique/acces.ts` — un seul geste, un seul domicile.*
 */
export async function garderProf(redirection = true): Promise<AccesRouteur> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (redirection) redirect('/login')
    throw new Error('Non authentifié')
  }
  const { data: moi } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') {
    if (redirection) redirect('/eleve')
    throw new Error('Accès refusé')
  }
  const admin = createAdminClient()
  const { data: params } = await admin
    .from('scriptorium_params').select('routeur_actif').limit(1).maybeSingle()
  return { admin, userId: user.id, routeurActif: !!params?.routeur_actif }
}

// ⚠️ `lireLesSeuils` et `lireLesInterrupteurs` vivent dans `donnees.ts`, et non
//    ici : ce fichier importe `next/navigation` pour `redirect`, que le résolveur
//    des scripts de recette ne charge pas. Un lecteur de configuration doit
//    rester appelable HORS d'une requête Next — sinon la recette en base ne peut
//    pas éprouver ce que l'écran lit.
export { lireLesSeuils, lireLesInterrupteurs } from './donnees'
