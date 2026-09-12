// ============================================================================
// LA VUE « AVANT SA RÉPONSE » — l'exercice tel que l'élève l'a trouvé.
// ----------------------------------------------------------------------------
// ⭐⭐ Louis, 11/09 : « je ne vois que le dernier écran, je n'ai donc pas accès
//    à la seule chose qui m'importe vraiment : l'exercice AVANT que l'élève ne
//    réponde ». Le déroulé est UNE PAGE QUI TOURNE sur l'état du dépôt ; pour
//    revoir la première page, on lui rend un dépôt VIERGE — la même vue, avec
//    tout ce que l'élève a produit remis à zéro.
//
// ⚠️ MODULE PUR : il ne relit rien en base, il ne change que l'ÉTAT ; la
//    MATIÈRE (consigne, matériau marqué, candidats, pièces, sujet, guide) est
//    exactement celle que le chargeur a composée pour ce dépôt — et c'est elle
//    que le professeur veut relire.
//
// ⚠️ Ce qui n'est PAS remis à zéro, et pourquoi : `telemetrie` et `collages`
//    ne pilotent aucune page ; `piloteArgument` (crans 6·8) porte sa consigne et
//    sa préparation, qu'on garde ; `fermee` est déjà faux ou la vue est réduite.
// ============================================================================

import type { VueDuDeroule } from './vue'

export function vueAvantReponse(vue: VueDuDeroule): VueDuDeroule {
  return {
    ...vue,
    tempsCourant: vue.temps[0] ?? 'ecrire',
    etapePaire: vue.estUnePaire ? 'cas_1' : null,
    v1RemiseLe: null,
    texteV1: null,
    texteVf: null,
    microQuestionDue: false,
    motifDepassement: null,
    cas: vue.cas.map((c) => ({
      ...c, credenceDonnee: null, zoneDonnee: null, designationDonnee: false,
    })),
    corrections: vue.cas.map(() => null),
    verdictParCas: vue.cas.map(() => null),
    precisionParCas: vue.cas.map(() => null),
    passageParCas: vue.cas.map(() => null),
    // ⭐ L'étalon (« ce qu'il fallait voir ») ne se montre qu'après la vf.
    etalon: null,
    gestesRestants: [],
    confianceDeclaree: null,
    conditionsDeclarees: null,
    restitutionAChaud: null,
    seJuger: { servie: false, motif: null, offre: null },
    attente: { jobs: [], enCours: false, echecDefinitif: false, message: null },
    retourChaud: null,
    retourFinal: null,
    contestations: [],
    langue: { phrase: null, n: null, ancrages: [] },
    verdictCalibration: { lignes: [], phrase: null },
    fin: null,
    piloteArgument: vue.piloteArgument
      ? { ...vue.piloteArgument, trace: [], vfRemise: false } : vue.piloteArgument,
  }
}
