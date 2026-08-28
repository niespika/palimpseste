import 'server-only'
// ============================================================================
// ITEM 77 — LA PORTE DU RATISSAGE, CÔTÉ SERVEUR (`02-` §5, v5.9).
// ----------------------------------------------------------------------------
// ⛔⛔ POURQUOI CE MODULE EXISTE PLUTÔT QU'UN CHAMP DE PLUS SUR LA VUE.
//    Le verdict d'une zone se calcule contre la CIBLE, et la cible se dérive de
//    la `version_corrigee` — **qui EST la réponse** aux crans 7 et 9 (`02-`
//    §2.3.4). ⚠️ **Ni l'une ni l'autre ne descend à l'écran**, et le verdict non
//    plus : le servir à l'élève lui dirait, coup par coup, s'il a trouvé — il
//    lui suffirait de balayer le matériau pour que l'écran le renseigne.
//    `VueDuDeroule` est une charge utile CLIENT ; ce calcul n'y entre pas.
//
// ⭐ CE QU'IL REND, ET QUAND. Il ne parle que du RATISSAGE — « au moins 70 % du
//    matériau ET au moins 4 fois la cible » —, le seul verdict que la zone
//    rende SEULE et le seul qui se lise SANS appeler le modèle. *Les autres cas
//    attendent le jugement IA, et ils ne sont pas de ce lot.*
//
// ⚠️ IL EST APPELÉ À LA REMISE, ET AVANT L'ÉCRITURE DU STATUT : la chaîne est
//    déclenchée juste après, et elle relit le dépôt. Écrire `v1_remis` puis
//    corriger laisserait une fenêtre où le déclencheur verrait un dépôt à
//    mesurer.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { cibleDansLeMateriau, demandeUneDesignation, verdictDeLaZone } from './designation'
import { regimeDeMarquage } from './marquage'

type Admin = SupabaseClient

/** Ce que le signalement a besoin de dire, et rien de plus. */
export interface Ratissage {
  /** Le rang du cas — 1, ou 2 sur le second cas d'une paire. */
  cas: number
  /** La part du matériau que la zone prend, en pourcent entier. */
  partMateriau: number
  /** Combien de fois la cible, arrondi au dixième. */
  foisLaCible: number
  /**
   * ⭐ La crédence déclarée, en pourcent — **information, plus condition**
   * (`02-` §5). Elle ne décide de rien ici : elle voyage au motif pour que le
   * professeur confirme d'un coup d'œil. `null` = pas encore déclarée.
   */
  credence: number | null
}

/**
 * ⭐ LE PREMIER CAS QUI RATISSE, OU `null`.
 *
 * ⚠️ **Le premier suffit.** Un dépôt dont un seul cas ratisse est un dépôt qui
 * ne compte pas : chercher les deux ne changerait ni le statut, ni le nombre de
 * signalements, ni ce que le professeur a besoin de lire pour trancher.
 *
 * ⚠️ **Il ne lève jamais.** Un matériau manquant, une règle de cran absente,
 * une zone illisible : on rend `null` et la remise suit son cours. *Une porte
 * d'intégrité qui casse une remise ferait plus de dégâts que le ratissage
 * qu'elle attrape.*
 */
export async function leRatissageDuDepot(
  admin: Admin, depotId: string, exerciceId: string, cran: number | null,
): Promise<Ratissage | null> {
  if (cran == null) return null

  const { data: regleCran } = await admin.from('exercices_crans')
    .select('marquage').eq('cran', cran).maybeSingle()
  if (!demandeUneDesignation(regimeDeMarquage(regleCran?.marquage as string | null))) return null

  const { data: cas } = await admin.from('exercices_cas')
    .select('ordre, exercices_materiaux(contenu, version_corrigee)')
    .eq('exercice_id', exerciceId).order('ordre')
  if (!cas?.length) return null

  const { data: metacog } = await admin.from('exercices_metacognition')
    .select('credence').eq('depot_id', depotId).maybeSingle()
  const entrees = Array.isArray(metacog?.credence)
    ? (metacog.credence as Array<Record<string, unknown>>) : []

  for (const c of cas) {
    const mat = Array.isArray(c.exercices_materiaux)
      ? c.exercices_materiaux[0] : c.exercices_materiaux
    const contenu = (mat as { contenu?: string } | null)?.contenu ?? null
    const corrigee = (mat as { version_corrigee?: string } | null)?.version_corrigee ?? null
    if (!contenu) continue

    // ⛔ Pas de cible = le défaut est une ABSENCE, et la bascule du `02-` §5
    //    envoie l'exercice au texte libre. Il n'y a rien à ratisser : « le
    //    détecteur se lit APRÈS cette bascule, jamais avant ».
    const cible = cibleDansLeMateriau(contenu, corrigee)
    if (!cible) continue

    const entree = entrees.find((e) => e.cas === c.ordre)
    const z = entree?.zone
    if (!Array.isArray(z) || z.length !== 2
      || typeof z[0] !== 'number' || typeof z[1] !== 'number') continue

    const zone = [z[0], z[1]] as [number, number]
    const verdict = verdictDeLaZone(contenu, cible, zone)
    if (!verdict.nonFait) continue

    const large = zone[1] - zone[0]
    return {
      cas: c.ordre as number,
      partMateriau: Math.round((100 * large) / contenu.length),
      foisLaCible: Math.round((10 * large) / (cible[1] - cible[0])) / 10,
      credence: typeof entree?.pourcentage === 'number' ? entree.pourcentage : null,
    }
  }
  return null
}
