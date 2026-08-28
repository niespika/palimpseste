import 'server-only'
// ============================================================================
// C6 · L2 — LE LECTEUR DES FICHES DITES À L'ÉLÈVE.
// ----------------------------------------------------------------------------
// Les RÈGLES vivent à `fiche.ts`, pures et éprouvées. Ici, on LIT deux tables,
// et on ne fabrique aucun texte.
//
// ⛔ AUCUN `eleveId` N'ENTRE ICI, ET C'EST LA GARANTIE DE LA SOURCE : « elle ne
//    parle jamais de ce que cet élève-là a produit » (`06-` §5). La fiche est
//    GÉNÉRIQUE ; le profil est personnel. Deux écrans voisins, aucun mélange.
//
// ⚠️ LES VERSIONS DE PRODUCTION SONT EN AVANCE SUR CELLES DU BAC À SABLE — relevé
//    le 28/08 : expression 3.2/3.1 · argumentation 4.3/4.1 · structure 3.3/3.1 ·
//    connaissance 2.2/2.1 · synthèse 3.4/3.2 · questionnement 2.2/2.1.
//    ⭐ Le `### 1.1` est pourtant IDENTIQUE des deux côtés, au caractère près
//       (726 · 785 · 756 · 824 · 734 · 788) : les montées de version n'ont pas
//       touché le texte servi à l'élève. **Aligner les deux bases n'est pas ce
//       lot ; conclure de l'une sur l'autre serait sa faute** — d'où la version
//       rendue avec chaque fiche.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { inventaireDesFiches, type InventaireDesFiches } from './fiche'
import type { DimensionDite } from './profil'

type Admin = SupabaseClient

/**
 * ⭐ LES SIX FICHES, ET SIX EXACTEMENT.
 *
 * ⚠️ `competences_fiches` porte SEPT lignes dans les deux bases. La septième est
 *    `monitoring`, et `inventaireDesFiches` l'écarte AVEC SON MOTIF — la trace
 *    sert la revue, jamais l'élève.
 */
export async function chargerLesFichesDeCompetence(
  admin: Admin,
): Promise<InventaireDesFiches & { incidents: string[] }> {
  const incidents: string[] = []

  const [rFiches, rCorresp] = await Promise.all([
    admin.from('competences_fiches').select('competence, version, contenu'),
    admin.from('competences_correspondance')
      .select('competence, observable_code, dimension_eleve, ordre'),
  ])

  // ⚠️ supabase-js NE LÈVE PAS. Une fiche illisible n'est pas « pas de fiche » :
  //    on le dit, et l'écran le dit à l'élève.
  if (rFiches.error) {
    incidents.push(`les fiches : ${rFiches.error.code} ${rFiches.error.message}`)
    return { fiches: [], ecartees: [], incidents }
  }
  if (rCorresp.error) {
    incidents.push(`les noms des dimensions : ${rCorresp.error.code} ${rCorresp.error.message}`)
  }

  const dimensionsPar = new Map<string, DimensionDite[]>()
  for (const d of rCorresp.data ?? []) {
    const c = d.competence as string
    const l = dimensionsPar.get(c) ?? []
    l.push({
      observableCode: d.observable_code as string,
      dimensionEleve: (d.dimension_eleve ?? '') as string,
      ordre: (d.ordre ?? 0) as number,
    })
    dimensionsPar.set(c, l)
  }

  const inv = inventaireDesFiches(
    (rFiches.data ?? []).map((f) => ({
      competence: f.competence as string,
      version: (f.version ?? '?') as string,
      contenu: (f.contenu ?? '') as string,
    })),
    dimensionsPar,
  )
  return { ...inv, incidents }
}

// ════════════════════════════════════════════════════════════════════════════
// « SERVIE UNE FOIS — À LA RENTRÉE » : la marque, et son geste
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⭐ « SERVIE UNE FOIS » EST DEUX CHOSES, ET LA PREMIÈRE EST UN GESTE.
 *    *Consultable* est une page ; *servie une fois* est une **poussée**, au
 *    premier passage (`06-` §5). Sans marque, la fiche ne serait que
 *    consultable — la moitié de la phrase.
 *
 * ⚠️ LA MARQUE VIT SUR `profiles`, ET C'EST UNE MIGRATION :
 *    `fiches_competences_servies_at` (`c6_l2_marques_eleve.sql`, nullable, sans
 *    défaut). **NULL = jamais servie.**
 *
 * ⛔ ÉCRITURE CÔTÉ SERVEUR, PAR LE CLIENT ADMIN : la policy self-service de
 *    `profiles` est MORTE et le reste (`07-` §1.3, C1).
 */
export async function fichesDejaServies(admin: Admin, eleveId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('profiles').select('fiches_competences_servies_at').eq('id', eleveId).maybeSingle()
  // ⚠️ En cas d'erreur on répond « déjà servie » : une tuile de découverte qui
  //    ne s'allume pas est un manque ; une tuile qui se rallume à chaque visite
  //    parce qu'on n'a pas su lire est une nuisance quotidienne.
  if (error) return true
  return data?.fiches_competences_servies_at != null
}

/** ⚠️ IDEMPOTENT : la marque ne se repose pas si elle est déjà là (`is` null). */
export async function marquerLesFichesServies(
  admin: Admin, eleveId: string, maintenant: string,
): Promise<void> {
  const { error } = await admin
    .from('profiles')
    .update({ fiches_competences_servies_at: maintenant })
    .eq('id', eleveId)
    .is('fiches_competences_servies_at', null)
  if (error) console.error(`[eleve/fiche] marque de service — ${error.code} ${error.message}`)
}

/**
 * ⭐ LE CHOIX DE L'ÉLÈVE D'AFFICHER SES LETTRES — la TROISIÈME condition.
 *
 * ⛔ NULL VAUT MASQUÉ, et c'est le cœur de la règle : « un défaut à "affiché"
 *    n'est pas un choix » ; « le système ne le décide pas pour lui » (`06-` §5).
 */
export async function lireLeChoixDesLettres(admin: Admin, eleveId: string): Promise<boolean> {
  const { data, error } = await admin
    .from('profiles').select('competences_lettres_affichees').eq('id', eleveId).maybeSingle()
  // ⚠️ En cas d'erreur : MASQUÉ. L'erreur inverse afficherait une lettre que
  //    l'élève n'a pas demandée — exactement ce que le `06-` §5 interdit.
  if (error) return false
  return data?.competences_lettres_affichees === true
}

export async function ecrireLeChoixDesLettres(
  admin: Admin, eleveId: string, affichees: boolean,
): Promise<void> {
  const { error } = await admin
    .from('profiles').update({ competences_lettres_affichees: affichees }).eq('id', eleveId)
  if (error) console.error(`[eleve/fiche] choix des lettres — ${error.code} ${error.message}`)
}
