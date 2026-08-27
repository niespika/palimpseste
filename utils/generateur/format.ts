// ============================================================================
// C5 · L1 — LES TROIS PASSAGES : ce qui part, ce qui revient, ce qu'on assemble.
// ----------------------------------------------------------------------------
// « Trois passages, et l'ordre est le remède » (`05-` §2) :
//   G1 qualifie   — les phrases, PUIS les moments, PUIS les concepts ;
//   G2 établit    — les lectures défendables, sur les SEULES phrases en
//                   `defend_these`, « une sélection qui n'existe pas avant que
//                   les fonctions de phrase soient posées » ;
//   G3 écrit      — l'armature, EN DERNIER, et il reçoit tout.
//
// ⛔ CE MODULE NE PORTE NI LE FORMAT NI SES LISTES. Le format fait foi au `02-`
//    §6 A ; son contrôle machine est `controleReference`
//    (`utils/fabrique/verifie-reference.ts`), et c'est le SEUL endroit du dépôt
//    où les quatre listes fermées sont recopiées. Ici, les schémas de sortie
//    sont STRUCTURELS — des formes et des types, aucune liste de valeurs — et
//    `defend_these`, dont G2 a besoin pour savoir sur quoi travailler,
//    s'IMPORTE de là (piège 4).
//
// ⚠️ LES DEUX CONTRÔLES NE SE CONFONDENT PAS, ET ILS NE SE REMPLACENT PAS :
//    · le SCHÉMA, ici, est la défense 2 du `01-` §12 — « une sortie non conforme
//      est REJETÉE ET RELANCÉE, jamais interprétée ». Elle est structurelle, elle
//      est par passage, et elle relance UN passage plutôt que tout régénérer ;
//    · le CONTRÔLE DU FORMAT, lui, juge l'assemblage entier et décide des treize
//      refus, des deux blocages et des sept signalements (`05-` §4.1 à §4.3).
//    Le second reste l'autorité ; le premier lui épargne les cas où un passage
//    a simplement mal répondu.
//
// ⚠️ « Aucun chiffre : ni pondération, ni pourcentage, ni degré de confiance.
//    AUCUN CHAMP N'EN DEMANDE » (`05-` §1, et les trois prompts le répètent).
//    Les schémas ci-dessous n'en déclarent aucun, et la garde des clés inconnues
//    ferme la porte par laquelle une crédence chiffrée reviendrait.
// ============================================================================

import type { Forme } from '../chaine/schema'
import { messageAvecMateriau } from '../chaine/anti-injection'
import { FONCTIONS_PHRASE } from '../fabrique/verifie-reference'

/** La valeur qui OUVRE les lectures défendables (`02-` §6 A). Importée, jamais
 *  recopiée — elle appartient à la liste que le contrôle porte. */
const DEFEND_THESE = FONCTIONS_PHRASE[0]

// ════════════════════════════════════════════════════════════════════════════
// CE QUI PART — le texte, phrases NUMÉROTÉES
// ════════════════════════════════════════════════════════════════════════════

/**
 * « Il présente le texte avec ses numéros. LES NUMÉROS DE PHRASE SONT LA SEULE
 * FAÇON DONT LE MODÈLE DÉSIGNE UN ENDROIT » (`05-` §1).
 *
 * Les phrases arrivent DÉJÀ SEGMENTÉES par la segmentation qui fait foi
 * (`phrasesDuTexte`) : ce module ne segmente rien.
 */
export function presentationNumerotee(phrases: readonly string[]): string {
  return phrases.map((p, i) => `${i + 1}. ${p}`).join('\n')
}

const NOM_TEXTE = "le texte d'auteur, phrases numérotées"
const NOM_G1 = 'la qualification déjà établie (G1)'
const NOM_G2 = 'les lectures défendables déjà établies (G2)'

/**
 * ⚠️ UN TEXTE D'AUTEUR QUI PART AU MODÈLE EST DU MATÉRIAU, JAMAIS UNE
 *    INSTRUCTION. Les trois messages passent donc par `messageAvecMateriau`
 *    (`utils/chaine/anti-injection.ts`) — bornes `<<<MATERIAU` / `MATERIAU>>>`,
 *    neutralisation de toute tentative de refermer la balise depuis l'intérieur.
 *    Le patron existe : on le réemploie, on ne le réécrit pas (piège 15).
 *
 * ⚠️ ET LES SORTIES DE G1 ET G2 SONT DU MATÉRIAU AUSSI, quand elles repartent à
 *    G3 : leurs étiquettes et leurs lectures sont de la prose libre écrite À
 *    PARTIR du texte d'auteur. Les passer nues rouvrirait par la porte de
 *    derrière ce que le premier bloc ferme.
 */
export function messageG1(phrases: readonly string[]): string {
  return messageAvecMateriau(
    [{ nom: NOM_TEXTE, contenu: presentationNumerotee(phrases) }],
    'Qualifie ce texte en suivant TA SEULE TÂCHE, dans son ordre, et rends le '
    + 'JSON du FORMAT DE SORTIE — rien avant, rien après.')
}

export function messageG2(
  phrases: readonly string[], numerosDemandes: readonly number[],
): string {
  return messageAvecMateriau(
    [{ nom: NOM_TEXTE, contenu: presentationNumerotee(phrases) }],
    'Les phrases sur lesquelles travailler — celles qui défendent une thèse — '
    + `sont : ${numerosDemandes.join(', ')}.\n`
    + 'Lis TOUT le texte, n\'écris que sur ces phrases-là, et rends le JSON du '
    + 'FORMAT DE SORTIE — rien avant, rien après.')
}

export function messageG3(
  phrases: readonly string[], g1: SortieG1, g2: SortieG2,
): string {
  return messageAvecMateriau(
    [
      { nom: NOM_TEXTE, contenu: presentationNumerotee(phrases) },
      { nom: NOM_G1, contenu: JSON.stringify(g1, null, 2) },
      { nom: NOM_G2, contenu: JSON.stringify(g2, null, 2) },
    ],
    'Écris l\'armature de ce texte et rends le JSON du FORMAT DE SORTIE — '
    + 'rien avant, rien après.')
}

// ════════════════════════════════════════════════════════════════════════════
// CE QUI REVIENT — les schémas, STRUCTURELS
// ════════════════════════════════════════════════════════════════════════════

export interface SortieG1 {
  phrases: Array<{ n: number; fonctions: string[]; statuts: string[] }>
  moments: Array<{
    m: string; de: number; a: number; fonction: string
    cible: string[]; statuts: string[]; etiquette: string
  }>
  concepts: Array<{ concept: string; formes: string[] }>
  hesitation?: string[]
}

export interface SortieG2 {
  lectures: Array<{ n: number; drapeau: string; lectures: string[] }>
  hesitation?: string[]
}

export interface SortieG3 {
  armature: { question_directrice: string; these: string; these_phrases: number[] }
  hesitation?: string[]
}

const LISTE_DE_TEXTES: Forme = { type: 'liste', de: { type: 'texte' } }
const HESITATION: Forme = LISTE_DE_TEXTES

/**
 * ⚠️ AUCUN `enum` DANS CES SCHÉMAS, ET C'EST DÉLIBÉRÉ. Déclarer ici la liste des
 *    fonctions ou des statuts serait recopier le `02-` §6 A une seconde fois, et
 *    deux copies d'une liste fermée divergent — « c'est arrivé une fois au
 *    catalogue de l'Expression » (`05-` §4.7). Une valeur hors liste passe donc
 *    le schéma et tombe sur le REFUS N° 5 du contrôle qui fait foi, à sa place.
 */
export const FORME_G1: Forme = {
  type: 'objet',
  champs: {
    phrases: {
      type: 'liste',
      de: {
        type: 'objet',
        champs: {
          n: { type: 'nombre', entier: true, min: 1 },
          fonctions: LISTE_DE_TEXTES,
          statuts: LISTE_DE_TEXTES,
        },
      },
    },
    moments: {
      type: 'liste',
      de: {
        type: 'objet',
        champs: {
          m: { type: 'texte' },
          de: { type: 'nombre', entier: true, min: 1 },
          a: { type: 'nombre', entier: true, min: 1 },
          fonction: { type: 'texte' },
          cible: LISTE_DE_TEXTES,
          statuts: LISTE_DE_TEXTES,
          etiquette: { type: 'texte' },
        },
      },
    },
    concepts: {
      type: 'liste',
      de: {
        type: 'objet',
        champs: { concept: { type: 'texte' }, formes: LISTE_DE_TEXTES },
      },
    },
    hesitation: HESITATION,
  },
  optionnels: ['hesitation'],
}

export const FORME_G2: Forme = {
  type: 'objet',
  champs: {
    lectures: {
      type: 'liste',
      de: {
        type: 'objet',
        champs: {
          n: { type: 'nombre', entier: true, min: 1 },
          drapeau: { type: 'texte' },
          lectures: LISTE_DE_TEXTES,
        },
      },
    },
    hesitation: HESITATION,
  },
  optionnels: ['hesitation'],
}

export const FORME_G3: Forme = {
  type: 'objet',
  champs: {
    armature: {
      type: 'objet',
      champs: {
        question_directrice: { type: 'texte' },
        these: { type: 'texte' },
        these_phrases: { type: 'liste', de: { type: 'nombre', entier: true, min: 1 } },
      },
    },
    hesitation: HESITATION,
  },
  optionnels: ['hesitation'],
}

// ════════════════════════════════════════════════════════════════════════════
// CE QU'ON ASSEMBLE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Les phrases sur lesquelles G2 travaille — « les SEULES phrases en
 * `defend_these` » (`02-` §6 A ; `05-` §2). Triées : le message qui les liste
 * est lu par un humain quand il faut le relire.
 */
export function phrasesDefendThese(g1: SortieG1): number[] {
  return (g1.phrases ?? [])
    .filter((p) => (p.fonctions ?? []).includes(DEFEND_THESE))
    .map((p) => p.n)
    .sort((a, b) => a - b)
}

/**
 * L'assemblage — les six clés que `CLES.racine` déclare, et rien d'autre.
 *
 * ⚠️ LES TROIS `hesitation` FUSIONNENT, ET CHACUNE DIT DE QUEL PASSAGE ELLE
 *    VIENT. Le format n'en déclare qu'une, à la racine ; mais G3 est « le seul
 *    passage autorisé à contredire le précédent », et c'est dans SON hésitation
 *    que le professeur trouve la raison d'un blocage d'armature (`05-` §4.2).
 *    Fondre les trois sans dire laquelle est laquelle lui retirerait justement
 *    ce qui rend le blocage lisible.
 *
 * ⛔ ET RIEN N'EST AJOUTÉ. Pas d'intervalle, pas d'occurrence, pas de compte :
 *    « un champ que le format ne déclare pas » est le refus n° 11, et la sortie
 *    qui ne casse rien est la dérivation à la lecture (`utils/generateur/lecture.ts`).
 */
export function assembler(g1: SortieG1, g2: SortieG2, g3: SortieG3): Record<string, unknown> {
  const hesitation = [
    ...(g1.hesitation ?? []).map((x) => `G1 — ${x}`),
    ...(g2.hesitation ?? []).map((x) => `G2 — ${x}`),
    ...(g3.hesitation ?? []).map((x) => `G3 — ${x}`),
  ]
  return {
    phrases: g1.phrases,
    moments: g1.moments,
    concepts: g1.concepts,
    lectures: g2.lectures,
    armature: g3.armature,
    hesitation,
  }
}
