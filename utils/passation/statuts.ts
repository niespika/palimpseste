// ============================================================================
// C10 · L2 — CE QU'UN DÉPÔT CLOS N'ACCEPTE PLUS. Le prédicat, pur, et un seul.
// ----------------------------------------------------------------------------
// « Une remise après clôture est refusée. »   — `02-exercices.md` §6.D, `11 bis`
//
// ⛔⛔ CE FICHIER EXISTE PARCE QUE LA SOURCE SE TROMPAIT. Le `07-` §2, entrée
//    `C10-L2`, écrit : « le chemin de remise refuse déjà "Ce dépôt est clos" ».
//    MESURÉ LE 07/09/2026 : la chaîne « Ce dépôt est clos. » n'apparaissait
//    qu'UNE fois dans tout `utils/passation/` — `depots.ts:243`, à l'intérieur
//    de `preparerDepotDesPhotos`, c'est-à-dire la PRÉPARATION DES URL D'ENVOI,
//    qui n'écrit rien dans `exercices_depots`. Les DIX autres chemins d'écriture
//    de l'élève ne lisaient pas `statut` du tout. Sans cette garde, la clôture
//    du professeur était défaite en silence par le premier élève resté sur son
//    écran de transcription : `validerLaTranscription` repose `v1_remis`, sans
//    erreur, sans trace, `tsc` et les tests verts.
//
// ⭐ ET LA GARDE PARTAGÉE NE SUFFISAIT PAS : `depotOuvert(d)` est
//    `d.ouvert_par_prof_at != null` (`depots.ts`), une colonne que la clôture NE
//    TOUCHE PAS — elle reste vraie après le clic. Mesuré en production le
//    07/09 : `ouvert_par_prof_at` non nul sur 15/15 des dépôts à clore.
//
// ⛔ POURQUOI UN FICHIER À PART, ET NON « à côté de `depotOuvert` ». Parce que
//    `depots.ts` ouvre par `import 'server-only'` : un test pur ne peut pas
//    l'importer — éprouvé, `ERR_MODULE_NOT_FOUND: Cannot find package
//    'server-only'`. Or la règle du lot est « écris au moins un test pur sous
//    `utils/` » (le glob de `npm test` est `utils/**/*.test.ts`). La règle vit
//    donc ici, pure ; `depots.ts` la ré-exporte pour que le site de lecture
//    reste celui de `depotOuvert`.
//
// ⛔ IL N'Y A AUCUN FILET EN BASE, et il ne faut pas s'y attendre. Mesuré le
//    07/09 (bac à sable) : une seule policy sur `exercices_depots`
//    (`exercices_depots_prof_all`), AUCUNE policy élève — toutes les écritures
//    passent déjà en service-role —, un seul trigger (`trg_depot_lieu`) qui ne
//    refuse que `vf_remis` et les champs de version finale, et AUCUNE contrainte
//    de transition entre statuts. La garde écrite ici est la SEULE.
// ============================================================================

/**
 * Les neuf valeurs de `exercices_depots.statut`, dans l'ordre du CHECK en base.
 *
 * ⚠️ MESURÉ EN BASE, PAS RECOPIÉ D'UN FICHIER : `exercices_depots_statut_check`
 *    porte ces neuf valeurs (bac à sable, 07/09/2026). Le fichier
 *    `c4_l1_schema.sql:454` est en retard — il n'en liste que sept ; `retire`
 *    est venu de `c4_l8_fabrique.sql` et `non_fait` de
 *    `c6_designation_non_fait.sql`. La BASE fait foi.
 *
 * ⭐ Elle est exportée pour que le test les énumère TOUS : un dixième statut
 *    ajouté un jour sans passer par ici fera tomber le test, au lieu de traverser
 *    la garde en silence.
 */
export const STATUTS_DU_DEPOT = [
  'assigne', 'ouvert', 'v1_remis', 'retour_publie', 'vf_remis',
  'clos', 'abandonne', 'retire', 'non_fait',
] as const

/** Le message que l'élève lit, et il est déjà écrit : `depots.ts:243`, mot pour mot. */
export const MESSAGE_DEPOT_CLOS = 'Ce dépôt est clos.'

/**
 * Le dépôt n'accepte plus aucune écriture de l'élève.
 *
 * ⭐ TROIS STATUTS, ET C'EST LA LISTE QUI EXISTAIT DÉJÀ — celle de la seule
 *    garde du dossier (`preparerDepotDesPhotos`). Ce lot ne l'élargit pas : il
 *    la SORT de son unique site d'appel pour la poser aux neuf.
 *
 * ⚠️ `non_fait` N'EN EST PAS, et c'est mesuré, pas oublié : il désigne un
 *    exercice que le professeur a marqué non fait sur le déroulé de la MAISON
 *    (`c6_designation_non_fait.sql`), et l'élève y garde ses gestes. La garde
 *    d'écriture de la classe n'a rien à y voir.
 *
 * ⛔ ET `vf_remis` NON PLUS : en classe, la séquence s'arrête à `retour_publie`
 *    (`07-` §1.1), et le trigger `trg_depot_lieu` refuse déjà `vf_remis` sur un
 *    dépôt de classe. Un dépôt de passation ne peut pas y être.
 */
export function depotClos(d: { statut: string }): boolean {
  return d.statut === 'retire' || d.statut === 'abandonne' || d.statut === 'clos'
}
