import 'server-only'
// ============================================================================
// C4 · L3 — LA PORTE DU DÉROULÉ, ET QUI ENTRE.
// ----------------------------------------------------------------------------
// ⭐ L'ÉCRAN NAÎT DERRIÈRE `exercices_actif`, À OFF (`07-` §1.5, §5) — c'est
//    l'interrupteur du professeur qui répond à *« les élèves peuvent-ils faire
//    des exercices ? »*, et le déroulé maison est exactement cela.
//
// ⚠️ **N'EN DÉTOURNE AUCUN AUTRE** (piège 48). `chaine_actif`, `fabrique_actif`
//    et `passation_classe_actif` appartiennent à leurs lots, et lier cet écran à
//    l'un d'eux **le fermerait pour une raison qui ne le regarde pas** :
//      · `chaine_actif` est celui que **la coupure automatique de facture**
//        bascule (`utils/chaine/acces.ts`) — un élève ne doit pas perdre l'accès
//        à sa consigne et à son brouillon parce que la facture du mois a coupé.
//        Quand la chaîne est fermée, le dépôt part quand même EN FILE et l'écran
//        affiche un **état d'attente explicite** : c'est le comportement voulu
//        (`01-` §12), pas une panne ;
//      · `passation_classe_actif` est à C4-L4, et une passation en classe n'a
//        pas ces six temps.
//
// ⚠️ **UNE PORTE ILLISIBLE SE FERME** — jamais l'inverse (leçon C11a) :
//    supabase-js NE LÈVE PAS, il rend `{ error }`, et une lecture ignorée
//    ouvrirait la porte en silence.
//
// Patron : `utils/passation/acces.ts` (C4-L4) et `utils/fabrique/acces.ts`.
// ============================================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

/** Ce que l'élève peut faire, et le réglage que le déroulé lit avec. */
export interface EtatDuDeroule {
  /** `exercices_actif` — et lui seul. */
  exercicesActifs: boolean
  /**
   * Le délai de rendu de la version finale, en jours (`06-` §2). Il SE RÈGLE :
   * `scriptorium_params.vf_delai_jours`, borné 1..4 par la base.
   */
  delaiVfJours: number
}

/** Le défaut de la source, quand la lecture ne rend rien. */
export const DELAI_VF_DEFAUT = 3

export async function lireLaPorte(admin: Admin): Promise<EtatDuDeroule> {
  const { data, error } = await admin
    .from('scriptorium_params')
    .select('exercices_actif, vf_delai_jours')
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error(`[deroule] porte ILLISIBLE — ${error.code} ${error.message} : `
      + 'elle est tenue pour FERMÉE.')
    return { exercicesActifs: false, delaiVfJours: DELAI_VF_DEFAUT }
  }
  return {
    exercicesActifs: !!data?.exercices_actif,
    // `?? DELAI_VF_DEFAUT` et non `|| ` : 0 n'est pas une valeur licite, mais
    // le `||` avalerait aussi un réglage volontaire s'il le devenait un jour.
    delaiVfJours: (data?.vf_delai_jours as number | null) ?? DELAI_VF_DEFAUT,
  }
}

export interface AccesEleveDeroule {
  admin: Admin
  userId: string
  /** `exercices_actif`. Faux = l'écran se ferme, poliment. */
  ouvert: boolean
  delaiVfJours: number
}

/**
 * ⚠️ Contrairement à `utils/passation/garde.ts:garderEleve`, celui-ci VÉRIFIE LE
 *    RÔLE. Le patron historique des modules élève le fait
 *    (`app/eleve/modules/codex/actions.ts:verifierEleve`), il ne coûte qu'une
 *    lecture, et le client admin qui suit **contourne la RLS** : sans ce
 *    contrôle, la seule chose qui distingue un élève d'un professeur sur ces
 *    écrans serait l'URL.
 *
 * ⚠️ Il ne vérifie NI la classe NI le module : c'est la propriété du DÉPÔT qui
 *    fait foi ici (`lireDepotMaison` la contrôle), parce qu'un dépôt est déjà
 *    par (élève × exercice) et qu'un exercice porte sa classe.
 */
export async function garderEleveDeroule(redirection = true): Promise<AccesEleveDeroule> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    if (redirection) redirect('/login')
    throw new Error('Non authentifié')
  }
  const { data: moi } = await supabase
    .from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (moi?.role !== 'eleve') {
    if (redirection) redirect('/')
    throw new Error('Accès refusé')
  }
  const admin = createAdminClient()
  const porte = await lireLaPorte(admin)
  return {
    admin, userId: user.id,
    ouvert: porte.exercicesActifs,
    delaiVfJours: porte.delaiVfJours,
  }
}

/** Pour la recette seule : ouvrir et refermer sont des gestes du professeur. */
export async function poserExercicesActifs(admin: Admin, actif: boolean): Promise<void> {
  const { error } = await admin
    .from('scriptorium_params').update({ exercices_actif: actif }).eq('id', 1)
  if (error) throw new Error(`exercices_actif : ${error.code} ${error.message}`)
}
