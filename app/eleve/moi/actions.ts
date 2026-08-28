'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ecrireLeChoixDesLettres, marquerLesFichesServies } from '@/utils/eleve/fiche-serveur'

// ============================================================================
// C6 · L2 — LES DEUX SEULES ÉCRITURES DE CE LOT.
// ----------------------------------------------------------------------------
// ⛔⛔ AUCUN `export type` ICI. « `export type` dans un module `'use server'` TUE
//    TOUT LE MODULE À L'EXÉCUTION » — et `tsc`, `npm test` et les recettes
//    passent tous les trois sans rien dire. Si ce fichier a besoin d'un type,
//    il vit ailleurs.
//
// ⛔ TOUTES LES ÉCRITURES PASSENT PAR LE SERVEUR (`07-` §1), et l'identité vient
//    de la SESSION, jamais d'un paramètre : un identifiant d'élève reçu du
//    client laisserait écrire sur le profil d'un autre.
//
// ⚠️ AUCUN CRLF ICI — ce lot n'a pas de `<textarea>`. Le seul argument est un
//    booléen. (La règle reste : un formulaire rend du CRLF, la base stocke du
//    LF, et `new FormData()` ne le montre pas — y compris en server action.)
// ============================================================================

/**
 * `06-` §5 — « c'est l'élève qui choisit d'en voir plus […] le système ne le
 * décide pas pour lui ».
 *
 * ⚠️ Ce choix ne suffit jamais seul : les lettres demandent aussi
 * `competences_affichage_actif` à ON et `profil_provisoire` à faux. La garde est
 * dans `utils/eleve/profil.ts`, lue par la page — jamais ici.
 */
export async function basculerLesLettres(affichees: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await ecrireLeChoixDesLettres(createAdminClient(), user.id, affichees)
  revalidatePath('/eleve/moi')
}

/**
 * `06-` §5 — « servie une fois, à la rentrée ». La marque se pose AU PREMIER
 * PASSAGE sur les fiches, et elle éteint la tuile de découverte.
 *
 * ⚠️ IDEMPOTENTE : `marquerLesFichesServies` n'écrit que si la marque est vide.
 *    Un second passage ne réécrit pas la date du premier.
 */
export async function marquerLesFichesCommeServies() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await marquerLesFichesServies(createAdminClient(), user.id, new Date().toISOString())
  revalidatePath('/eleve')
}
