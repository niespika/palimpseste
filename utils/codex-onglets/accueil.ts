// ============================================================================
// L'ACCUEIL DE L'ONGLET EXERCICES — TROIS GROUPES, UNE ACTION PAR LIGNE.
// Module PUR : aucun `server-only`, aucune base, aucune horloge implicite —
// l'instant et le fuseau se PASSENT en argument.
// ----------------------------------------------------------------------------
// Handoff « Codex Exercices (élève) » §3. La liste plate devient trois groupes,
// dans cet ordre : **À faire**, **En attente de ton retour**, **Terminés**.
//
// ⛔⛔ **AUCUN AGRÉGAT, AUCUNE BARRE DE PROGRESSION, AUCUN POURCENTAGE DE
//    COMPLÉTION** (`06-` §5 ; `01-` §9 ; handoff §3) : *« un onglet qui range
//    des exercices n'est pas un endroit où l'on découvre son niveau »*. Les
//    comptes que ce module rend sont des CARDINAUX DE GROUPE — « À faire · 2 »,
//    c'est-à-dire *combien de choses il te reste*, jamais *où tu en es*.
//    ⚠️ La différence n'est pas rhétorique : un compte de groupe ne se rapporte
//       à aucun total et ne peut donc pas se lire comme une note.
//
// ⭐ **LE GROUPE 2 SÉPARE DEUX CHOSES QUE LA LISTE PLATE MÉLANGEAIT** (handoff
//    §3) : *l'attente* — le retour se prépare, il n'y a RIEN à faire, donc
//    AUCUNE action — et *la reprise due* — le retour est arrivé, il est à lire,
//    et une version finale peut suivre. Offrir un bouton au premier ferait
//    cliquer l'élève sur un écran qui n'a rien à lui dire.
//
// ⚠️ **CE MODULE NE RETRIE RIEN.** `exercicesMaisonDeLEleve` a déjà trié par
//    `comparerLignes` — « ce qui appelle un geste d'abord, et à ton égal la plus
//    proche échéance en tête ». Grouper conserve cet ordre à l'intérieur de
//    chaque groupe : le handoff demande « le plus proche en premier », et c'est
//    exactement ce que le tri amont rend.
// ============================================================================

import type { ExerciceMaison } from './liste'
import type { TonEtat } from './regles'
// ⚠️ Imports RELATIFS, comme tous les modules purs du dépôt : le lanceur de
//    `npm test` ne résout pas l'alias `@/`.
import { NOM_COMPETENCE, type Competence } from '../deroule/types'
import { formatInstant } from '../fuseau'

// ─────────────────────────────────────────────────────────────────────────────
// LES TROIS GROUPES
// ─────────────────────────────────────────────────────────────────────────────

export type Groupe = 'a_faire' | 'en_attente' | 'termines'

/**
 * ⚠️ LA TABLE EST EXHAUSTIVE SUR `TonEtat`, et `Record` le garde : ajouter un
 *    ton sans lui donner de groupe ne compilerait pas. Un ton sans groupe
 *    ferait DISPARAÎTRE des lignes de l'écran, en silence.
 */
const GROUPE: Record<TonEtat, Groupe> = {
  a_faire: 'a_faire',
  en_cours: 'a_faire',
  // Les deux états de l'attente — voir l'en-tête : ils se distinguent par
  // l'ACTION, pas par le groupe.
  attente: 'en_attente',
  a_lire: 'en_attente',
  clos: 'termines',
}

export interface AccueilGroupe {
  cle: Groupe
  titre: string
  /** Le cardinal du groupe. ⛔ Jamais rapporté à un total : ce n'est pas un score. */
  compte: number
  /** La phrase d'appoint du titre, ou `null`. */
  murmure: string | null
  lignes: ExerciceMaison[]
}

const TITRE: Record<Groupe, string> = {
  a_faire: 'À faire',
  en_attente: 'En attente de ton retour',
  termines: 'Terminés',
}

const MURMURE: Record<Groupe, string> = {
  a_faire: 'le plus proche en premier',
  en_attente: 'rien à faire pour l’instant',
  termines: 'tu peux les relire',
}

const ORDRE: Groupe[] = ['a_faire', 'en_attente', 'termines']

/**
 * Les trois groupes, TOUJOURS dans le même ordre et TOUJOURS les trois — un
 * groupe vide se rend `compte: 0`, et c'est l'écran qui décide de ne pas
 * l'afficher. *Rendre une liste dont la longueur varie ferait dépendre la
 * position d'un groupe de ce qui l'a précédé.*
 */
export function grouperPourLAccueil(lignes: readonly ExerciceMaison[]): AccueilGroupe[] {
  return ORDRE.map((cle) => {
    const dedans = lignes.filter((l) => GROUPE[l.etat.ton] === cle)
    return {
      cle,
      titre: TITRE[cle],
      compte: dedans.length,
      murmure: dedans.length > 0 ? MURMURE[cle] : null,
      lignes: dedans,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// UNE SEULE ACTION PAR LIGNE
// ─────────────────────────────────────────────────────────────────────────────

export interface ActionDeLigne {
  libelle: string
  /** `true` = bouton plein (le vert estompé) ; `false` = bouton secondaire. */
  plein: boolean
}

/**
 * ⭐ **UNE ACTION, OU AUCUNE** (handoff §3, recette). Deux boutons sur une ligne
 *    demanderaient à l'élève de choisir entre deux façons d'entrer dans le même
 *    écran ; et « retour en préparation » n'en offre AUCUNE, parce qu'il n'y a
 *    rien à y faire.
 */
export function actionDeLaLigne(ton: TonEtat): ActionDeLigne | null {
  switch (ton) {
    case 'a_faire':  return { libelle: 'Commencer', plein: true }
    case 'en_cours': return { libelle: 'Reprendre', plein: false }
    case 'a_lire':   return { libelle: 'Ouvrir', plein: false }
    // ⛔ L'attente n'offre rien, et les terminés non plus : leur carte EST le
    //    lien (« tu peux les relire »), sans bouton qui appellerait un geste.
    case 'attente':
    case 'clos':     return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LA LIGNE DE MÉTA — « compétence · forme · durée »
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ⚠️ **LES COMPÉTENCES SONT CELLES QUE L'INSTANCE PEUT PORTER, PAS CELLES
 *    QU'ELLE A MESURÉES** (`02-` §6.B ; `ExerciceMaison.competences`). L'écran
 *    les nomme comme un SUJET DE TRAVAIL — « Argumentation » —, jamais comme un
 *    résultat : il n'y a ici ni lettre, ni palier, ni verdict.
 *
 * ⚠️ Un identifiant que la table ne connaît pas est ÉCARTÉ, jamais affiché nu :
 *    « expression_v2 » sous les yeux d'un élève ne veut rien dire.
 */
export function competencesLisibles(codes: readonly string[]): string[] {
  return codes
    .map((c) => NOM_COMPETENCE[c as Competence])
    .filter((n): n is string => typeof n === 'string')
}

/**
 * La ligne grise sous le titre : ce qu'il y a à faire, et combien de temps ça
 * prend. Les morceaux absents ne laissent pas de séparateur vide.
 */
export function metaDeLaLigne(l: {
  competences: readonly string[]
  estUnePaire: boolean
  dureeMin?: number | null
}): string {
  const morceaux: string[] = []
  const comps = competencesLisibles(l.competences)
  if (comps.length > 0) morceaux.push(comps.join(', '))
  morceaux.push(l.estUnePaire ? 'deux cas, l’un après l’autre' : 'un cas')
  if (typeof l.dureeMin === 'number' && l.dureeMin > 0) {
    morceaux.push(`environ ${l.dureeMin} min`)
  }
  return morceaux.join(' · ')
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉCHÉANCE — SUR CHAQUE LIGNE, ET SEULEMENT SI ELLE EXISTE
// ─────────────────────────────────────────────────────────────────────────────

/** En deçà, l'échéance porte la pastille `attention` (handoff §3). */
export const JOURS_PROCHE = 3

const MS_PAR_JOUR = 86_400_000

export interface EcheanceLisible {
  texte: string
  /** `true` → pastille `attention` ; `false` → filet neutre. */
  proche: boolean
}

/**
 * ⭐ « à rendre mer. 10 » — un INSTANT, donc lu DANS LE FUSEAU DE L'ÉCOLE
 *    (règle projet : instants → fuseau, dates pures → UTC). `echeance` est un
 *    `timestamptz` (`c4_l1_schema.sql`).
 *
 * ⚠️ **UNE ÉCHÉANCE DÉPASSÉE RESTE UNE ÉCHÉANCE, ET ELLE NE BLOQUE RIEN**
 *    (`06-` §6 : « tous tagués, aucun bloquant, jamais un verdict »). On la dit
 *    au passé — « à rendre » deviendrait faux —, on ne la peint pas en rouge, et
 *    on n'ajoute aucun mot de reproche.
 *
 * @returns `null` quand il n'y a pas d'échéance : « elle n'invente pas une
 *          urgence qu'elle ne porte pas » (`comparerLignes`).
 */
export function echeanceLisible(
  echeance: string | null, maintenantISO: string, fuseau: string,
): EcheanceLisible | null {
  if (!echeance) return null
  const quand = new Date(echeance)
  if (Number.isNaN(quand.getTime())) return null
  const jour = formatInstant(quand, fuseau, { weekday: 'short', day: 'numeric' })
  const restant = quand.getTime() - new Date(maintenantISO).getTime()
  if (restant < 0) return { texte: `à rendre ${jour} — dépassé`, proche: true }
  return { texte: `à rendre ${jour}`, proche: restant <= JOURS_PROCHE * MS_PAR_JOUR }
}

/**
 * La seconde ligne des cartes du groupe « En attente » — ce qui s'est passé, et
 * ce qui vient. Deux états, deux phrases (handoff §3).
 *
 * @param echeanceVf l'échéance de la version finale, quand le régime en sert
 *        une ET que le retour est publié. `null` partout ailleurs — **on ne
 *        promet pas une version finale à un exercice qui se clôt au retour**.
 */
export function attenduDeLaLigne(
  l: { etat: { ton: TonEtat }; v1RemiseLe: string | null; vfRemiseLe: string | null },
  echeanceVf: string | null,
  fuseau: string,
): string {
  const jour = (iso: string) => formatInstant(iso, fuseau, { weekday: 'long', day: 'numeric' })
  if (l.etat.ton === 'a_lire') {
    return echeanceVf
      ? `retour reçu · version finale à rendre avant ${
        formatInstant(echeanceVf, fuseau, { weekday: 'short', day: 'numeric' })}`
      : 'retour reçu · à lire'
  }
  if (l.vfRemiseLe) return `version finale rendue ${jour(l.vfRemiseLe)}`
  if (l.v1RemiseLe) return `rendue ${jour(l.v1RemiseLe)}`
  return 'rendue'
}
