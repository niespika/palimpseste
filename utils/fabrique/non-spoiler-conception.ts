// ============================================================================
// C5 · L1 — LE NON-SPOILER À LA CONCEPTION : quelle borne s'applique, et dite.
// ----------------------------------------------------------------------------
// « Le choix de l'extrait ou de la tranche — NON-SPOILER : SEUL L'AMONT EXPOSÉ
//   EST SERVI. »                                            — `07-` §2, C5-L1
//
// ⛔ CE MODULE NE PORTE PAS LA RÈGLE, ET N'EN ÉCRIT PAS UNE SECONDE. La règle du
//    non-spoiler est au `01-` §4 — hors du manifeste de ce lot — et elle est
//    DÉJÀ ÉCRITE EN CODE : `filtreDuNonSpoiler` (`utils/moteur/vivier.ts`,
//    C4-L12), avec ses quatre régimes et sa `borne_amont` journalisée. On
//    l'appelle ; on ne la réécrit pas.
//
// ⚠️⚠️ ET SURTOUT : ON NE FABRIQUE PAS UNE « POSITION DE LA CLASSE ». Le filtre
//    est PER-ÉLÈVE — « la borne de la classe n'est pas la sienne » (`01-` §4) —
//    et l'écran de conception ne connaît aucun élève : le professeur y bâtit une
//    instance POUR UNE CLASSE. Une seconde échelle, calculée pour la classe,
//    serait une règle neuve, prise à une source qui n'est pas au manifeste.
//
// ⭐ CE QUI RESTE, ET C'EST TOUT CE QUE CE MODULE FAIT : dire QUELLE BORNE
//    S'APPLIQUERA. Elle se lit sur le texte seul — le couple { livre, séance } —,
//    elle ne dépend d'aucun élève, et c'est elle que la décision journalisera.
//    L'écran l'affiche ; le tri par élève, lui, reste au routeur.
//
// ⚠️ L'ÉCHELLE EST UNE, et trois choses qui lui ressemblent n'en sont pas
//    (`07-` §1.1) : la séance du plan est L'ORDINAL DE DÉCOUPAGE DU LIVRE dans le
//    Scriptorium (`scriptorium_documents.semaine`), comparée PAR ÉGALITÉ à la
//    dernière que l'élève a lui-même TERMINÉE. Ce n'est ni la semaine du parcours
//    de la classe, ni le numéro affiché à l'élève.
//
// ⚠️ ET LE COUPLE NE SE SÉPARE JAMAIS — le `CHECK` `textes_plan_couple_chk`
//    garantit que la séance et le livre vont ENSEMBLE : on lit le couple.
// ============================================================================

import { filtreDuNonSpoiler, type BorneAmont, type MateriauRattache } from '../moteur/vivier'

export interface TexteRattache {
  id: string
  /** `exercices_textes.plan_livre_id` → l'ARTEFACT de référence, pas le livre. */
  planLivreReferenceId: string | null
  /** `exercices_textes.plan_semaine` — l'ordinal, jamais une date. */
  planSeance: number | null
}

/**
 * La borne d'amont qu'une instance bâtie sur ce texte portera.
 *
 * ⚠️ ON APPELLE LE FILTRE AVEC UNE CARTE DE POSITIONS VIDE, et c'est exact : à la
 *    conception, AUCUN élève n'est en jeu. Ce qu'on lit de son verdict n'est donc
 *    PAS `retenue` — qui ne veut rien dire sans élève — mais la `borne` qu'il
 *    journalise : le régime, le couple, et l'ordinal exigé.
 */
export function borneDeConception(texte: TexteRattache): BorneAmont {
  const materiau: MateriauRattache = {
    sorte: 'texte',
    id: texte.id,
    role: 'source',
    // Le rattachement au COURS est la couche 4 du routeur, pas le non-spoiler :
    // ces champs ne pèsent pas sur la borne, et on ne les invente pas.
    coursEtat: 'aucun',
    coursApparies: [],
    coursDeclares: 0,
    planLivreReferenceId: texte.planLivreReferenceId,
    planSemaine: texte.planSeance,
    // ⚠️ Le statut et le blocage de la file n'entrent pas dans le NON-SPOILER :
    //    ils écartent un texte ailleurs, par d'autres filtres. Les poser au plus
    //    ouvert ici garantit que ce module ne rend qu'UNE chose — la borne
    //    d'amont —, et qu'il n'écarte jamais un texte pour un autre motif.
    statut: 'valide',
    bloque: false,
  }
  return filtreDuNonSpoiler([materiau], new Map()).borne
}

/**
 * Ce que l'écran DIT de cette borne. Une phrase, au professeur, qui ne prétend
 * jamais savoir où en est un élève.
 */
export function phraseDeLaBorne(borne: BorneAmont, titreDuLivre?: string | null): string {
  if (borne.regime === 'hors_livre') {
    return 'Ce texte ne relève d’aucun plan de lecture : le non-spoiler n’a rien à comparer, '
      + 'et rien ne borne ce que vous sélectionnez dedans.'
  }
  const livre = titreDuLivre?.trim() || 'le livre déclaré'
  return `Ce texte relève de la séance ${borne.seanceMaxExigee} de ${livre}. `
    + 'Toute instance bâtie dessus ne sera servie qu’aux élèves qui ont terminé cette séance : '
    + 'la position de lecture est PAR ÉLÈVE — « la borne de la classe n’est pas la sienne » — '
    + 'et un élève dont la position est inconnue ne la reçoit pas.'
}
