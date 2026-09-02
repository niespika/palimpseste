// ============================================================================
// LE PLAN DE TRAVAIL DU DÉROULÉ — ce que la FORME de l'exercice commande à
// l'écran. Module PUR : aucun `server-only`, aucune base, aucune I/O.
// ----------------------------------------------------------------------------
// Handoff « Codex Exercices (élève) » §4 : *« la colonne qui porte le travail
// est la plus large »*. Trois formes, trois répartitions, et le fil des temps
// ne nomme pas le temps 2 de la même façon dans les trois.
//
// ⛔ **CE MODULE NE DÉCIDE AUCUNE DOCTRINE.** Il ne lit ni le cran, ni la cible,
//    ni `indexAttendue` : il reçoit DEUX DRAPEAUX que la vue a déjà posés —
//    « la crédence est-elle la réponse ? » et « ce cas demande-t-il une
//    désignation ? » — et il en tire une MISE EN PAGE. Faire dépendre la forme
//    d'un numéro de cran écrit ici recopierait une règle qui vit ailleurs
//    (`utils/deroule/credence.ts`, `utils/deroule/designation.ts`), et les deux
//    finiraient par diverger.
//
// ⚠️ **LE FIL N'AFFICHE QUE LES TEMPS RÉELLEMENT SERVIS** (handoff §4) : quatre
//    sur une paire ou un exercice au jugement algorithmique, six au régime
//    plein. C'est déjà ce que `tempsServis` rend — on ne recompte rien ici.
// ============================================================================

import type { Temps } from './types'

/**
 * Les trois formes de travail que l'écran sait mettre en page.
 *
 * · `rediger`   — l'élève écrit ; l'écriture prend la plus grande part ;
 * · `choisir`   — les quatre lectures REMPLACENT le champ : « la réponse c'est
 *                 la crédence » (décision de Louis, 24/08) ;
 * · `surligner` — le travail est DANS la matière (crans 4, 7 et 9).
 */
export type FormeDuTravail = 'rediger' | 'choisir' | 'surligner'

/**
 * ⚠️ L'ORDRE DES DEUX TESTS COMPTE, et il n'est pas symétrique. Un cran qui
 *    sert quatre candidats ne demande jamais de désignation (`02-` §5 : les
 *    candidats sont aux crans 1 et 3, la désignation aux crans 4, 7 et 9) —
 *    mais si les deux drapeaux se levaient ensemble sur une instance mal
 *    formée, c'est la CRÉDENCE qui l'emporte : elle est la réponse, et un écran
 *    qui montrerait la sélection sans le champ des jetons rendrait l'exercice
 *    impossible à finir.
 */
export function formeDuTravail(
  a: { credenceEstLaReponse: boolean; designationDemandee: boolean },
): FormeDuTravail {
  if (a.credenceEstLaReponse) return 'choisir'
  if (a.designationDemandee) return 'surligner'
  return 'rediger'
}

/** Les deux volets du téléphone : la MATIÈRE, ou le TRAVAIL. */
export type Volet = 'lire' | 'ecrire'

/**
 * ⭐ LE VOLET SUR LEQUEL LE TÉLÉPHONE S'OUVRE — 01/09.
 *
 * Sous `lg`, l'écran ne montre qu'une colonne à la fois, et il s'ouvrait
 * toujours sur « Écrire ». Or aux crans 4, 7 et 9 le travail COMMENCE dans la
 * matière : « surligne l'endroit » s'adresse à un texte que l'élève ne voyait
 * pas — il ouvrait l'exercice sur un champ de réponse vide, sans le passage à
 * trouver. Le volet suit donc la forme : la matière d'abord quand il faut y
 * désigner, le travail sinon. ⚠️ Ce n'est que l'état INITIAL ; la bascule reste
 * à l'élève.
 */
export function voletInitial(forme: FormeDuTravail): Volet {
  return forme === 'surligner' ? 'lire' : 'ecrire'
}

/**
 * Le libellé du temps 2, qui SUIT LA FORME (handoff §4, écrans 2a/2b/2c).
 * *« Écrire » au-dessus de quatre curseurs de jetons demanderait à l'élève une
 * chose que l'écran ne lui offre pas.*
 */
const TEMPS_2: Record<FormeDuTravail, string> = {
  rediger: 'Écrire',
  choisir: 'Répondre',
  surligner: 'Surligner et répondre',
}

const LIBELLE: Record<Temps, string> = {
  preparer: 'Préparer',
  ecrire: 'Écrire',
  se_juger: 'Se juger',
  retour: 'Retour',
  reviser: 'Réviser',
  retour_final: 'Retour final',
}

export function libelleDuTemps(temps: Temps, forme: FormeDuTravail): string {
  return temps === 'ecrire' ? TEMPS_2[forme] : LIBELLE[temps]
}

/**
 * Où en est un temps du fil — `fait` porte le ✓, `courant` le pigment plein,
 * `a_venir` le simple filet (handoff §4).
 *
 * ⚠️ **`fait` SE LIT SUR LA POSITION, jamais sur une trace.** Le temps courant
 *    vient du serveur (`tempsCourantDe`) ; tout ce qui le précède DANS LA LISTE
 *    SERVIE est derrière l'élève. Un temps absent de la liste n'a pas d'état —
 *    il n'existe pas pour cet exercice.
 */
export type EtatDuTemps = 'fait' | 'courant' | 'a_venir'

export function etatDuTemps(
  temps: Temps, tempsCourant: Temps, servis: readonly Temps[],
): EtatDuTemps {
  if (temps === tempsCourant) return 'courant'
  const i = servis.indexOf(temps)
  const j = servis.indexOf(tempsCourant)
  if (i < 0 || j < 0) return 'a_venir'
  return i < j ? 'fait' : 'a_venir'
}

/**
 * Le compteur discret du téléphone — « 2 / 6 » (handoff §4).
 * @returns `null` quand le temps courant n'est pas dans la liste servie : on
 *          n'affiche pas « 0 / 6 », qui ne veut rien dire.
 */
export function rangDuTemps(
  tempsCourant: Temps, servis: readonly Temps[],
): { rang: number; total: number } | null {
  const i = servis.indexOf(tempsCourant)
  if (i < 0 || servis.length === 0) return null
  return { rang: i + 1, total: servis.length }
}

/**
 * ⭐ LE RATIO DES COLONNES SUIT CE QUE L'EXERCICE DEMANDE (handoff §4) :
 *   · rédiger   — matière 400 / écriture 640 ;
 *   · choisir   — 520 / 520, égales ;
 *   · surligner — 520 / 520, égales (la matière porte déjà le geste).
 *
 * Rendu en classes de grille, sur la colonne de 1040 du layout élève. Sous
 * `lg`, il n'y a plus de colonnes du tout : le téléphone bascule Lire/Écrire.
 */
export function colonnesDuPlan(forme: FormeDuTravail): string {
  return forme === 'rediger' ? 'lg:grid-cols-[400px_minmax(0,1fr)]' : 'lg:grid-cols-2'
}

/**
 * Le titre de la colonne de droite — ce que l'élève y produit.
 * ⚠️ Il ne nomme JAMAIS une compétence ni un observable (RR4).
 */
export function titreDuTravail(forme: FormeDuTravail): string {
  if (forme === 'choisir') return 'Ta réponse'
  if (forme === 'surligner') return 'Ce que tu en dis'
  return 'Ton écriture'
}

// ─────────────────────────────────────────────────────────────────────────────
// QUEL ÉCRAN L'ÉLÈVE A SOUS LES YEUX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Les cinq écrans du déroulé (handoff §4 à §6) :
 *   · `ferme`        — la porte `exercices_actif` est fermée ;
 *   · `travail`      — 2a / 2b / 2c, selon la forme ;
 *   · `se_juger`     — 2d, **un écran À LUI SEUL**, sans matière ni champ ;
 *   · `retour_texte` — 2e, la v1 et son retour CÔTE À CÔTE ;
 *   · `retour_choix` — 2f, la correction et la répartition posée.
 */
export type EcranDuDeroule = 'ferme' | 'travail' | 'se_juger' | 'retour_texte' | 'retour_choix'

/**
 * ⭐⭐ **L'ÉCRAN NE SE LIT PAS SUR LE SEUL `tempsCourant`, ET C'EST UN CONSTAT,
 *    PAS UN CHOIX.** Aux deux crans guidés l'élève NE REMET RIEN — sa crédence
 *    est sa réponse —, donc `v1_remis_at` reste nul et `tempsCourantDe` rend
 *    « écrire » **jusqu'à la fin de l'exercice**. Un écran piloté par le seul
 *    temps servirait donc le plan de saisie par-dessus une correction déjà
 *    donnée : *l'élève relirait ses curseurs à côté de la bonne réponse.*
 *
 * ⭐ La bascule vers `retour_choix` se fait sur la correction du **DERNIER** cas,
 *    jamais du premier : sur une paire, la correction du cas 1 se sert AVANT le
 *    cas 2 (`02-` §2.3.1 a) — refermer là ferait disparaître le cas du
 *    transfert, qui porte toute la raison d'être de la paire.
 *
 * ⚠️ `se_juger` PASSE DEVANT TOUT : « se juger après avoir lu le retour ne
 *    mesurerait plus la métacognition » (`06-` §2). C'est le parent qui tient
 *    cet ordre, et il le tient ici.
 *
 * ⛔⛔ **`retour` NE SIGNIFIE PAS « LE RETOUR EST LÀ »** — trouvé au smoke élève
 *    du 30/08, sur un cran par paires. `tempsCourantDe` rend « retour » DÈS la
 *    remise, pendant que la chaîne travaille encore, ET le garde comme état
 *    TERMINAL aux régimes sans version finale : *le même temps couvre l'attente
 *    et l'arrivée.* Il faut donc regarder si un retour EXISTE — sans quoi
 *    l'écran servait le plan de travail par-dessus un retour publié, et **le
 *    retour n'apparaissait nulle part**.
 */
export function ecranDuDeroule(a: {
  ouvert: boolean
  tempsCourant: Temps
  forme: FormeDuTravail
  /** `corrections[i]` est celle de `cas[i]` — `null` = rien à servir. */
  corrections: ReadonlyArray<unknown>
  /** Un retour de la chaîne est-il publié — chaud ou final ? */
  aUnRetour: boolean
  /**
   * ⛔⛔ **LA PHASE PEUT ÊTRE SERVIE ET N'AVOIR RIEN À SERVIR** — mesuré au
   *    smoke du 30/08, en bac à sable, sur un cran 2. `phaseServie` dit OUI, et
   *    l'offre sort avec **zéro question** : « la banque ne portait aucune
   *    question pour les observables élus » (`SeJuger`). L'écran de « se juger »
   *    étant désormais EXCLUSIF, il rendait alors **une page blanche** — et
   *    « jamais un écran muet » (`01-` §12).
   * ⚠️ Vrai seulement si l'offre porte AU MOINS UNE question : c'est la même
   *    garde que `SeJuger` applique en son for intérieur, remontée d'un cran
   *    pour que le choix d'écran la voie.
   */
  seJugerAServir: boolean
}): EcranDuDeroule {
  if (!a.ouvert) return 'ferme'
  if (a.tempsCourant === 'se_juger' && a.seJugerAServir) return 'se_juger'
  if (a.forme === 'choisir') {
    const derniere = a.corrections.length > 0 ? a.corrections[a.corrections.length - 1] : null
    return derniere != null ? 'retour_choix' : 'travail'
  }
  if (a.tempsCourant === 'reviser' || a.tempsCourant === 'retour_final') return 'retour_texte'
  // ⚠️ « retour » SANS retour, c'est L'ATTENTE : on reste au plan de travail,
  //    qui porte l'encart « ton retour est en préparation » et se rafraîchit
  //    tout seul. Basculer ferait un écran vide qui promet ce qui n'existe pas.
  // ⚠️ Un « se juger » SANS question tombe ici aussi : la copie est rendue, il
  //    n'y a rien à demander à l'élève, et ce qui l'attend est son retour.
  if (a.tempsCourant === 'retour' || a.tempsCourant === 'se_juger') {
    return a.aUnRetour ? 'retour_texte' : 'travail'
  }
  return 'travail'
}

/**
 * ⚠️ **LE TEMPS QUE LE FIL MET EN ÉVIDENCE — de la PRÉSENTATION, et rien
 *    d'autre.** Aux crans guidés, `tempsCourant` reste « écrire » alors que
 *    l'élève lit sa correction : le fil dirait « Répondre » au-dessus d'un écran
 *    qui ne demande plus rien. Aux crans à version finale, `tempsCourantDe`
 *    passe à « réviser » dès la publication du retour, alors que l'élève n'a
 *    encore rien repris : le fil sauterait « Retour » sans que l'élève l'ait vu.
 *
 * ⛔ **CETTE VALEUR NE PILOTE AUCUNE LOGIQUE.** Elle ne décide ni ce qui
 *    s'affiche, ni ce qui s'enregistre : le `tempsCourant` du serveur reste seul
 *    maître, ici comme dans les actions.
 */
export function tempsAffiche(
  ecran: EcranDuDeroule, tempsCourant: Temps, reprisEnMain: boolean,
): Temps {
  if (ecran === 'retour_choix') return 'retour'
  if (ecran === 'retour_texte' && tempsCourant === 'reviser' && !reprisEnMain) return 'retour'
  // ⚠️ Un « se juger » qui n'a rien à servir laisse le temps courant sur
  //    `se_juger` alors que l'écran a déjà passé la main : le fil montrerait
  //    « Se juger » au-dessus d'un retour. On dit ce que l'élève VOIT.
  if (ecran !== 'se_juger' && tempsCourant === 'se_juger') return 'retour'
  return tempsCourant
}
