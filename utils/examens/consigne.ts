// ============================================================================
// C4 · L9 — CE QUE L'ÉLÈVE LIT. Pur : aucune base, aucun réseau.
// ----------------------------------------------------------------------------
// « Une consigne dit quatre choses : ce qu'il y a à faire, ce qu'il faut
//   produire, CE SUR QUOI ON TRAVAILLE, ce qui aide. »              — `07-` §1.1
//
// ⚠️ CE FICHIER NE DÉCIDE D'AUCUNE FORMULATION PÉDAGOGIQUE, et c'est voulu :
//    « une donnée que RIEN ne nomme se signale, elle ne s'invente pas ». Aucune
//    source n'arrête le texte d'une consigne d'examen diagnostique.
//    ⭐ C5-L1, 26/08 — ET LA RAISON EST DÉSORMAIS CONNUE : `consigne_gabarit`
//    n'était pas une donnée manquante, c'était UN RELIQUAT d'un modèle « une
//    consigne par objet » remplacé par « une banque par objet × mode × cran »
//    (`exercices_routes`, dérivée depuis C4-L8). Elle est RETIRÉE de la
//    déclaration du `07-` §1.1 sur décision de Louis. Ce commentaire disait
//    « NULL et le reste » : il aurait fallu dire « elle n'a jamais eu de
//    contenu à porter ». Ce qui est composé
//    ici n'est donc qu'un POINT DE DÉPART : il nomme l'exercice (avec le libellé
//    du type, tiré du `01-` §10) et sert le matériau. **C'est le professeur qui
//    l'arrête à l'écran, et c'est le texte qu'il arrête que l'élève lit**
//    (`02-` §6 B.1, point 7 ; il vit sur l'instance sous le nom de
//    `consigne_instanciee`, `07-` §1.1).
//
// ⚠️ POURQUOI LE TEXTE ENTIER ENTRE DANS LA CONSIGNE, côté Aletheia. Le flux de
//    la passation (C4-L4) sert à l'élève `consigne_instanciee`, et RIEN D'AUTRE
//    (`utils/passation/vues.ts`, `chargerVueEleve`). Un texte laissé au seul
//    `materiau_source_texte_id` ne s'afficherait NULLE PART, et l'élève aurait à
//    expliquer un texte qu'il ne voit pas. « Le flux de C4-L4 prend l'instance
//    SANS RIEN CHANGER » : c'est donc à l'instance de porter ce qu'il faut lire.
// ============================================================================

import { normaliserRetours } from '../passation/transcription-calcul'

/** L'en-tête bibliographique d'un texte — auteur, titre, localisation. */
export function enTete(auteur: string, titre: string, reference: string): string {
  return [auteur, titre].filter((x) => x.trim() !== '').join(', ')
    + (reference.trim() !== '' ? ` — ${reference.trim()}` : '')
}

/** La consigne de départ d'un examen d'ÉCRITURE : l'énoncé du sujet, tel quel. */
export function consigneDepuisLeSujet(intitule: string, enonce: string): string {
  return `${intitule}\n\n${enonce.trim()}`
}

/** La consigne de départ d'un examen de LECTURE : l'en-tête, puis le texte. */
export function consigneDepuisLeTexte(
  intitule: string, entete: string, texte: string,
): string {
  return `${intitule}\n\n${entete}\n\n${texte.trim()}`
}

/**
 * ⚠️ LE PIÈGE CRLF, ET IL EST SILENCIEUX. Un `<textarea>` d'un formulaire HTML
 *    rend ses retours à la ligne en **CRLF** ; le découpage en blocs
 *    (`blocs()`, `utils/passation/transcription-calcul.ts`) coupe sur `\n\n` et
 *    lirait alors UN SEUL BLOC. Sur une consigne, la conséquence est cosmétique
 *    — mais on normalise ici comme partout ailleurs, plutôt que de laisser un
 *    domicile où la règle ne vaut pas. `normaliserRetours` est la MÊME fonction
 *    que le déroulé (C4-L3) et la passation (C4-L4) : on la réutilise, on ne la
 *    réécrit pas.
 * ⚠️ AUCUN `trim()` PAR LIGNE, aucune fusion de lignes vides : le découpage se
 *    conserve. Seul le saut final est retiré — il vient du champ, pas du texte.
 */
export function consigneANoter(saisie: string): string {
  return normaliserRetours(saisie).replace(/\n+$/, '')
}
