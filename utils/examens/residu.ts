// ============================================================================
// QU'EST-CE QU'UNE CONCEPTION RÉSIDUELLE ? — la règle, pure et éprouvée.
// ----------------------------------------------------------------------------
// ⭐ LE DÉFAUT QUI A TOUT PRODUIT, TROUVÉ SUR LA PROD DE 1HLP LE 25/08.
//    Avant le correctif du même jour, « Retirer du plan » TOMBSTONAIT la ligne
//    (`statut = 'annule'`) et LAISSAIT DERRIÈRE ELLE l'instance conçue. En
//    montant sa classe, Louis a ajouté puis retiré six lignes en dix minutes ;
//    trois d'entre elles avaient été conçues, et leurs instances sont restées
//    dans la liste des passations — sans aucune sortie, puisque leur ligne
//    n'était plus au plan.
//
//    État relevé en production (lecture PostgREST, 26/08) :
//      · `eace9dff` écriture → ligne `58bb576e` **annulée** · 24 dépôts · 0 contenu
//      · `260c433c` lecture  → ligne `f50761f1` **annulée** · 25 dépôts · 0 contenu
//      · `364359ce` écriture → ligne `2292fa8d` **conçue**  · 25 dépôts · 17 copies
//
// ⚠️ ET VOICI CE QUE J'AVAIS RATÉ : une instance résiduelle porte quand même un
//    `exercice_planifie_id` — celui d'une ligne ANNULÉE. Tester « la colonne
//    est-elle nulle » disait donc « elle est au plan », et l'écran refusait de
//    proposer la suppression du résidu même. La question n'est pas *y a-t-il un
//    identifiant*, c'est *la ligne est-elle encore vivante*.
//
// ⚠️ Fichier PUR — aucun `server-only`, aucun accès base (glob de `npm test`).
//    Le lecteur vit à `residu-serveur.ts`, à côté.
// ============================================================================

/** Ce qu'on lit de la ligne de plan pour juger. `null` = l'instance n'en a aucune. */
export interface LignePourResidu {
  statut: string
  supprime_at: string | null
}

export type EtatDeConception =
  /** Rattachée à une ligne VIVANTE du plan — elle s'y retire, pas ici. */
  | { residu: false }
  /** Aucune ligne : conçue hors plan. */
  | { residu: true; motif: 'sans-ligne' }
  /** Sa ligne existe mais elle est annulée ou supprimée : le plan l'a oubliée. */
  | { residu: true; motif: 'ligne-annulee' }

/**
 * Cette conception est-elle un résidu — c'est-à-dire une instance que le plan
 * ne désigne plus ?
 *
 * ⛔ Une ligne `annule` ne compte PAS comme un rattachement. C'est l'état où
 *    « Retirer du plan » laisse la ligne : elle n'apparaît plus dans la grille,
 *    ne se retire plus, et ne peut donc plus servir de porte à quoi que ce soit.
 *    Une instance qui y pend est aussi orpheline qu'une instance sans ligne —
 *    elle l'est seulement d'une façon qui ne se voit pas.
 */
export function etatDeConception(ligne: LignePourResidu | null): EtatDeConception {
  if (!ligne) return { residu: true, motif: 'sans-ligne' }
  if (ligne.supprime_at !== null && ligne.supprime_at !== undefined) {
    return { residu: true, motif: 'ligne-annulee' }
  }
  if (ligne.statut === 'annule') return { residu: true, motif: 'ligne-annulee' }
  return { residu: false }
}

/** Phrase d'écran — ce que l'instance est, dite au professeur. */
export function phraseEtat(etat: EtatDeConception): string {
  if (!etat.residu) return 'Elle est rattachée à une ligne vivante du plan d’évaluation de la classe.'
  return etat.motif === 'sans-ligne'
    ? 'Elle n’appartient à aucun plan d’évaluation — c’est le résidu d’un examen conçu deux fois.'
    : 'Sa ligne de plan a été retirée : le plan ne la désigne plus. C’est un résidu, '
      + 'resté dans la liste des passations sans aucune sortie.'
}
