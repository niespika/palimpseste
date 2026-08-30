import 'server-only'
// ============================================================================
// CE QUE L'ACCUEIL LIT EN PLUS — la durée indicative, et l'échéance de la
// version finale quand il y en a une.
// ----------------------------------------------------------------------------
// Handoff « Codex Exercices (élève) » §3 : la ligne de méta dit « compétence ·
// forme · **durée** », et le groupe « En attente » distingue *le retour se
// prépare* de *le retour est là, une version finale suit*.
//
// ⭐ **DEUX ALLERS-RETOURS EN TOUT, PAS UN PAR LIGNE.** Les deux tables lues ici
//    sont de la DOCTRINE — `exercices_crans` (neuf lignes) et
//    `exercices_types_crans` — et elles se lisent EN LOT, sur les couples
//    réellement présents dans la liste. *« Un aller-retour Supabase depuis
//    Vercel coûte 160-332 ms » : une lecture par exercice ferait d'un onglet de
//    rangement l'écran le plus lent de l'application.*
//
// ⛔ **CETTE LECTURE NE VIT PAS DANS `exercicesMaisonDeLEleve`, ET C'EST VOULU.**
//    Cette liste-là sert AUSSI l'écran de la semaine, qui l'appelle quatre fois
//    (`utils/eleve/semaine-serveur.ts`) et n'a que faire d'une durée. Y greffer
//    ces lectures ferait payer à la semaine ce que seul l'accueil affiche.
//
// ⚠️ **ON N'ANNONCE JAMAIS UNE VERSION FINALE QUI N'EXISTERA PAS.** Le régime
//    est celui du CRAN (`exercices_crans.regime_v1vf` → `regimeDuCran`) : hors
//    du régime `plein`, « l'exercice se clôt au retour » (`06-` §2) et l'accueil
//    se tait. ⚠️ Une ESCALADE peut ajouter une version finale à un cran qui n'en
//    sert pas (`regimeDuDeroule`) — elle demande l'état d'escalade du dépôt, que
//    cette liste n'a pas. Le silence est alors le bon défaut : **promettre une
//    version finale qui n'arrive pas est pire que n'en promettre aucune**, et
//    l'écran du déroulé, lui, la dit toujours.
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une doctrine illisible n'est
//    pas « aucune durée » — on le dit au serveur, et l'écran se contente de la
//    ligne de méta sans durée (leçon C11a).
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { dureeIndicativeLisible } from '@/utils/deroule/duree'
import { echeanceDeLaVersionFinale, finDeSemaineDeTravail } from '@/utils/deroule/echeance'
import { regimeDuCran } from '@/utils/deroule/regime'
import { lireFuseau } from '@/utils/fuseau-serveur'
import type { ExerciceMaison } from './liste'

type Admin = SupabaseClient
type Ligne = Record<string, unknown>

/** Ce que l'accueil ajoute à une ligne, par dépôt. */
export interface MetaDAccueil {
  /** La durée indicative de l'instance, en minutes. `null` = rien à dire. */
  dureeMin: number | null
  /**
   * L'échéance de la version finale, en ISO. `null` dès qu'un doute existe :
   * pas de cran, régime non `plein`, v1 pas encore remise, ou retour pas encore
   * publié.
   */
  echeanceVf: string | null
}

export interface EnrichissementDAccueil {
  fuseau: string
  metas: Map<string, MetaDAccueil>
}

/**
 * ⭐ LA DURÉE ET L'ÉCHÉANCE DE VF, POUR TOUTE LA LISTE D'UN COUP.
 *
 * @param delaiVfJours celui de `lireLaPorte` — la page l'a déjà lu ; on ne
 *        relit pas `scriptorium_params` pour la même valeur.
 */
export async function enrichirLAccueil(
  admin: Admin, lignes: readonly ExerciceMaison[], delaiVfJours: number,
): Promise<EnrichissementDAccueil> {
  const fuseau = await lireFuseau()
  const metas = new Map<string, MetaDAccueil>()
  if (lignes.length === 0) return { fuseau, metas }

  const crans = [...new Set(lignes.map((l) => l.cran).filter((c): c is number => c !== null))]
  const types = [...new Set(lignes.map((l) => l.typeId).filter((t) => t !== ''))]

  const [durees, regimes] = await Promise.all([
    lireLesDurees(admin, types, crans),
    lireLesRegimes(admin, crans),
  ])

  for (const l of lignes) {
    metas.set(l.depotId, {
      dureeMin: l.cran === null ? null
        : dureeIndicativeLisible(durees.get(`${l.typeId}|${l.cran}`)),
      echeanceVf: echeanceDeLaVf(l, regimes, delaiVfJours, fuseau),
    })
  }
  return { fuseau, metas }
}

/**
 * ⚠️ L'ÉCHÉANCE NE SE CALCULE QUE POUR L'ÉTAT QUI LA DEMANDE — « retour à
 *    lire » : c'est la seule ligne de l'accueil qui a une reprise devant elle.
 *    La calculer partout ferait afficher une date sur une v1 pas encore rendue.
 */
function echeanceDeLaVf(
  l: ExerciceMaison, regimes: Map<number, string>, delaiJours: number, fuseau: string,
): string | null {
  if (l.etat.ton !== 'a_lire' || !l.v1RemiseLe || l.cran === null) return null
  const declare = regimes.get(l.cran)
  if (!declare) return null
  let regime: string
  try {
    // ⚠️ `regimeDuCran` LÈVE sur un libellé inconnu, et c'est juste : « la table
    //    des neuf crans en déclare trois ». Ici on ne s'arrête pas pour autant —
    //    une ligne de liste n'a pas à faire tomber tout l'onglet. On se tait.
    regime = regimeDuCran(declare)
  } catch (e) {
    console.error(`[codex-onglets] régime illisible au cran ${l.cran} — `
      + `${e instanceof Error ? e.message : String(e)}`)
    return null
  }
  if (regime !== 'plein') return null
  const v1 = new Date(l.v1RemiseLe)
  if (Number.isNaN(v1.getTime())) return null
  try {
    const e = echeanceDeLaVersionFinale({
      v1RemiseA: v1, delaiJours, finDeSemaine: finDeSemaineDeTravail(v1, fuseau),
    })
    return e.echeance.toISOString()
  } catch (e) {
    // `DelaiHorsDomaine` — le réglage est hors de 1..4. On signale et on se tait.
    console.error(`[codex-onglets] échéance de vf non calculable — `
      + `${e instanceof Error ? e.message : String(e)}`)
    return null
  }
}

/** `exercices_types_crans (type_id, cran) → duree_exercice_min`, en un appel. */
async function lireLesDurees(
  admin: Admin, types: readonly string[], crans: readonly number[],
): Promise<Map<string, unknown>> {
  const out = new Map<string, unknown>()
  if (types.length === 0 || crans.length === 0) return out
  const { data, error } = await admin
    .from('exercices_types_crans')
    .select('type_id, cran, duree_exercice_min')
    .in('type_id', types as string[])
    .in('cran', crans as number[])
  if (error) {
    console.error(`[codex-onglets] durées illisibles — ${error.code} ${error.message}`)
    return out
  }
  for (const r of (data ?? []) as unknown as Ligne[]) {
    out.set(`${String(r.type_id)}|${String(r.cran)}`, r.duree_exercice_min)
  }
  return out
}

/** `exercices_crans.cran → regime_v1vf`, en un appel. */
async function lireLesRegimes(
  admin: Admin, crans: readonly number[],
): Promise<Map<number, string>> {
  const out = new Map<number, string>()
  if (crans.length === 0) return out
  const { data, error } = await admin
    .from('exercices_crans').select('cran, regime_v1vf').in('cran', crans as number[])
  if (error) {
    console.error(`[codex-onglets] régimes illisibles — ${error.code} ${error.message}`)
    return out
  }
  for (const r of (data ?? []) as unknown as Ligne[]) {
    const c = typeof r.cran === 'number' ? r.cran : Number(r.cran)
    if (Number.isInteger(c) && typeof r.regime_v1vf === 'string') out.set(c, r.regime_v1vf)
  }
  return out
}
