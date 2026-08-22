// ============================================================================
// C4 · L4 — OÙ VIVENT LES PHOTOS D'UNE COPIE, ET POURQUOI LÀ.
// ----------------------------------------------------------------------------
// « Les photos vont au BUCKET EXISTANT, déposées par URL SIGNÉE, métadonnées
//   EXIF PURGÉES »                                    — `07-` §1 ; `06-` §7, point 4
//
// ⚠️ AUCUN BUCKET NEUF. Le §1 dit « le bucket existant » : ce lot n'en crée pas.
//    Le bucket retenu est `codex`, celui des manuscrits — c'est déjà lui qui
//    porte les photos de V1 et de version finale de Codex, il est privé, et
//    `utils/effacement.ts` le purge déjà. Le flux vit dans DEUX modules
//    (« c'est le même flux dans deux modules, et ce qui commande le comportement
//    est le `lieu`, jamais le module »), et une passation d'Aletheia y dépose
//    donc aussi : le préfixe, lui, ne nomme aucun module — il nomme l'élève et
//    son dépôt, qui sont ce que les trois gestes d'effacement savent atteindre.
//
// ⚠️ TROIS GESTES ATTEIGNENT LES FICHIERS, PAS UN (piège 41 ; `06-` §7) :
//    l'effacement d'une classe, le retrait d'un élève d'une classe, et la
//    suppression d'un compte. Le chemin est donc `passation/<élève>/<dépôt>/…` :
//      · par ÉLÈVE, le préfixe suffit — c'est le geste « supprimer le compte » ;
//      · par DÉPÔT, la ligne `exercices_depots` porte l'élève ET l'exercice, et
//        `exercices.classe_id` porte la classe : les deux gestes de classe se
//        résolvent en une requête, sans que le chemin ait à porter la classe.
//    ⭐ Mettre la classe DANS le chemin aurait été le piège : un élève qui
//       change de classe, une classe renommée, et les fichiers deviennent
//       introuvables par le geste censé les emporter.
// ============================================================================

/** Le bucket existant. Aucun bucket neuf n'est créé par ce lot. */
export const BUCKET = 'codex'

/** Le préfixe de tout ce que ce lot dépose — il ne nomme aucun module. */
export const RACINE = 'passation'

/** Tout ce qui appartient à un élève, tous dépôts confondus. */
export function prefixeEleve(eleveId: string): string {
  return `${RACINE}/${eleveId}`
}

/** Tout ce qui appartient à un dépôt. */
export function prefixeDepot(eleveId: string, depotId: string): string {
  return `${prefixeEleve(eleveId)}/${depotId}`
}

/** Le chemin d'une page, à son rang. Le rang est dans le nom : l'ordre se relit. */
export function cheminPage(eleveId: string, depotId: string, ordre: number): string {
  return `${prefixeDepot(eleveId, depotId)}/${String(ordre).padStart(2, '0')}.jpg`
}

/** Un chemin appartient-il à ce lot ? — utile aux purges, qui ne devinent pas. */
export function estUnCheminDePassation(chemin: string): boolean {
  return chemin.startsWith(`${RACINE}/`)
}
