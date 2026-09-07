import 'server-only'
// ============================================================================
// C10 · L1 — LE LECTEUR DES CYCLES COMPTÉS. Il lit, il ne décide de rien.
// ----------------------------------------------------------------------------
// ⛔⛔ `assiduite_hebdo` A LA RLS ACTIVE ET **UNE SEULE** POLICY —
//    `assiduite_hebdo_prof_all`, `role = 'prof'`. **IL N'Y A AUCUNE POLICY
//    ÉLÈVE, ET C'EST UN INVARIANT VOULU** (mesuré au `pg_policies` du bac à
//    sable le 07/09 : une policy, `ALL`, `EXISTS (… p.role = 'prof')`).
//
//    ⭐ Ce que cela veut dire pour ce fichier : **lue depuis un client à session
//    élève, cette table rend ZÉRO LIGNE, SANS ERREUR** — et le lot ne fermerait
//    jamais rien, pour personne, pour toujours, avec `tsc` vert, les tests verts
//    et un écran parfaitement normal. C'est le défaut le plus cher de ce lot, et
//    le seul qu'aucun test ne voit.
//
//    ⭐ La parade est celle de tout le code élève : **la garde est le CODE, pas
//    la policy** (`utils/deroule/depot.ts` : « le client admin contourne la
//    RLS »). Tous les chemins que ce lot touche tournent déjà en service-role —
//    `chargerLeDeroule`, `lireDepotMaison`, `exercicesMaisonDeLEleve`,
//    `chargerLaSemaineDeLEleve`. **Ce lecteur EXIGE donc un client `admin`**, et
//    il se prouve depuis une VRAIE session élève au smoke, jamais depuis un
//    script qui a la clé de service en poche.
//
// ⛔⛔ ET IL N'ÉCRIT RIEN. La ligne `assiduite_hebdo` est **partagée** : `C4-L13`
//    y pose `exercices_assignes`, `exercices_termines`, `semaine_faite`, et
//    `C4-L12` y remplit les trois colonnes de minutes dans la même requête,
//    juste après. Un `upsert` d'ici sur cette clé effacerait le budget de
//    l'autre lot. **On lit. Point.**
// ============================================================================

import { cache } from 'react'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * ⚠️ `cycles === null` VEUT DIRE « JE N'AI PAS PU LIRE », et l'appelant NE FERME
 *    RIEN dans ce cas (`estFermee` le refuse en première ligne). Un ensemble
 *    VIDE, lui, est une réponse : cet élève n'a aucune semaine comptée.
 *    `supabase-js` ne lève pas — tout passe par `{ error }` —, et l'incident se
 *    DIT au journal serveur plutôt que de se taire.
 */
export interface CyclesComptes {
  cycles: ReadonlySet<string> | null
  incident: string | null
}

/**
 * ⭐ UNE SEULE REQUÊTE, POUR TOUT L'ÉCRAN — et `cache()` de React la rend unique
 *    PAR RENDU même quand plusieurs appelants la demandent : « Ma semaine »
 *    appelle `exercicesMaisonDeLEleve` deux fois (Codex et Aletheia) et la
 *    voudrait deux fois. ⛔ Jamais une lecture par exercice :
 *    « un aller-retour Supabase coûte 160 à 332 ms depuis Vercel », et la liste
 *    de Codex en compte jusqu'à une quinzaine.
 *
 * ⚠️ Aucune pagination ici, et c'est mesuré : une ligne par élève et par semaine
 *    ÉCOULÉE — l'année scolaire en produit une quarantaine, très loin du plafond
 *    de 1000 lignes que PostgREST impose sans le dire. *Si un jour cette lecture
 *    devait porter plusieurs élèves, elle passerait par `lirePagine`.*
 */
export const cyclesComptesDeLEleve = cache(async (
  eleveId: string,
): Promise<CyclesComptes> => {
  // ⭐ Le client est fabriqué ICI, comme `lireFuseau` le fait : c'est ce qui
  //    permet à `cache()` de dédupliquer sur le SEUL `eleveId` — un client passé
  //    en argument serait un objet neuf à chaque appel, donc un cache toujours
  //    manqué. ⛔ Et il est `admin` : voir le bandeau, c'est le point du fichier.
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('assiduite_hebdo')
    .select('cycle_lundi')
    .eq('eleve_id', eleveId)

  if (error) {
    const incident = `assiduité hebdomadaire illisible — ${error.code} ${error.message}`
    console.error(`[fermeture] ${incident}`)
    return { cycles: null, incident }
  }

  const cycles = new Set<string>()
  for (const ligne of data ?? []) {
    const c = (ligne as { cycle_lundi: string | null }).cycle_lundi
    // ⚠️ `cycle_lundi` est un `date` NOT NULL, contraint au lundi ISO
    //    (`assiduite_lundi_chk`) : PostgREST le rend déjà en `YYYY-MM-DD`, qui
    //    est exactement la forme que `toISODate(lundiDuCycle(…))` produit. On ne
    //    le reformate pas — un second formatage serait un second domicile.
    if (c) cycles.add(c)
  }
  return { cycles, incident: null }
})
