import 'server-only'
// ============================================================================
// LE CADRE D'UNE DÉSIGNATION — ce que le serveur doit savoir pour accepter une
// zone, et RIEN DE PLUS.
// ----------------------------------------------------------------------------
// ⭐⭐ 01/09 — `actionDesignation` rechargeait LA VUE ENTIÈRE (`chargerLeDeroule`,
//    ~30 requêtes en série) pour n'en lire que deux choses : le cran demande-t-il
//    une désignation, et quelle est la longueur du matériau de ce cas. Puis elle
//    revalidait la page, ce qui REMONTAIT le composant de sélection (`key` tirée
//    de la zone) — sélection native et poignées perdues à chaque geste. *C'est
//    l'une des raisons pour lesquelles « c'est difficile de surligner ».*
//
// Ce module lit ces deux choses en deux requêtes, et l'action n'a plus besoin
// de revalider : la zone vit dans l'état du composant jusqu'au prochain rendu
// serveur, où `lireLaDesignation` (`vue.ts`) la relit de la base.
//
// ⚠️ MÊME SOURCE QUE LA VUE ET QUE LE VERDICT (`ratissage-serveur.ts`) :
//    `exercices_crans.marquage` → `regimeDeMarquage` → `demandeUneDesignation`,
//    et la longueur du matériau est celle de `contenu`, dont la concaténation
//    des segments servis est la copie exacte (« pas un octet retouché »).
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { cranNumero } from '@/utils/cran'
import { demandeUneDesignation } from './designation'
import { regimeDeMarquage } from './marquage'

type Admin = ReturnType<typeof createAdminClient>

export interface CadreDeDesignation {
  /** Le cran de l'exercice demande-t-il une désignation dans le matériau ? */
  demandee: boolean
  /** La longueur du matériau servi pour CE cas, en caractères — `null` sans matériau. */
  taille: number | null
}

export async function lireLeCadreDeLaDesignation(
  admin: Admin, exercice: { id: string; cran: unknown }, cas: number,
): Promise<CadreDeDesignation> {
  const cran = cranNumero(exercice.cran as never)
  if (cran == null) return { demandee: false, taille: null }

  const { data: regle } = await admin.from('exercices_crans')
    .select('marquage').eq('cran', cran).maybeSingle()
  const demandee = demandeUneDesignation(regimeDeMarquage(regle?.marquage as string | null))
  if (!demandee) return { demandee: false, taille: null }

  const { data: ligne } = await admin.from('exercices_cas')
    .select('ordre, exercices_materiaux(contenu)')
    .eq('exercice_id', exercice.id).eq('ordre', cas).maybeSingle()
  const mat = Array.isArray(ligne?.exercices_materiaux)
    ? ligne.exercices_materiaux[0] : ligne?.exercices_materiaux
  const contenu = (mat as { contenu?: string | null } | null | undefined)?.contenu
  return { demandee: true, taille: typeof contenu === 'string' ? contenu.length : null }
}
