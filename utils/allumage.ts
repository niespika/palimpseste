// ============================================================================
// L'ALLUMAGE — LES SIX INTERRUPTEURS, ET CE QU'ILS COMMANDENT (`07-` §5).
// ----------------------------------------------------------------------------
// Ce fichier ne décide rien : il RECOPIE ce que le §5 déclare, pour qu'un écran
// puisse le dire au professeur. La table `scriptorium_params` (id = 1) reste le
// seul domicile de la valeur.
//
// ⭐ DEUX NATURES, ET ELLES NE SE MÊLENT PAS. Le §5 est explicite : « Les trois
//    ci-dessus répondent à des questions DU PROFESSEUR — ce qu'il décide
//    d'ouvrir, et dans quel ordre. Les trois ci-dessous répondent à une question
//    DE CHANTIER : ce lot est-il construit et éprouvé ? » — « c'est pourquoi ils
//    ne se mélangent pas aux premiers ». Un écran qui les afficherait en une
//    seule liste de six cases effacerait précisément cette distinction.
//
// ⛔ AUCUN LOT N'EN CRÉE UN SEPTIÈME. « Un onglet, une liste, une porte ne sont
//    pas des fonctionnalités à gater » (§5). Cette liste est CLOSE.
//
// ⚠️ `exercices_retour_longueur` vit au même endroit et N'EST PAS des nôtres :
//    « ce n'est pas un septième interrupteur — il n'ouvre ni ne ferme rien »
//    (§5, ajouté par C4-L11). Il ne se règle pas ici.
//
// ⚠️ LA LECTURE A DÉJÀ SON DOMICILE — `lireLesInterrupteurs`, dans
//    `utils/routeur/donnees.ts`, écrite par C4-L2 et déjà appelée par le
//    pilotage. On la RÉEMPLOIE, on n'en écrit pas une seconde : « deux champs
//    pour la même chose sont deux domiciles qui divergent ».
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { lireLesInterrupteurs } from '@/utils/routeur/donnees'

type Admin = ReturnType<typeof createAdminClient>

export { lireLesInterrupteurs }

/** Les six noms, et **rien d'autre** — l'ordre est celui du §5. */
export const INTERRUPTEURS = [
  'exercices_actif',
  'routeur_actif',
  'competences_affichage_actif',
  'fabrique_actif',
  'chaine_actif',
  'passation_classe_actif',
] as const

export type Interrupteur = (typeof INTERRUPTEURS)[number]

/**
 * Les deux natures du §5.
 *
 * · `professeur` — « ce qu'il décide d'ouvrir, et dans quel ordre » ;
 * · `chantier`   — « ce lot est-il construit et éprouvé ? ».
 */
export type NatureDInterrupteur = 'professeur' | 'chantier'

export interface FicheDInterrupteur {
  nom: Interrupteur
  nature: NatureDInterrupteur
  /** Le titre lisible — court, il nomme la chose, pas la question. */
  titre: string
  /** ⚠️ « La question à laquelle il répond », RECOPIÉE du §5, mot pour mot. */
  question: string
  /** Le lot qui l'a posé. `null` pour les trois du professeur, nés avec C4-L1. */
  posePar: string | null
  /** Ce qu'il ouvre ou ferme réellement, établi sur les lecteurs du dépôt. */
  commande: string[]
  /** Ce qu'il faut savoir avant de le basculer. `null` quand il n'y a rien. */
  avertissement: string | null
}

/**
 * ⭐ CE QUE CHACUN COMMANDE — relevé sur les LECTEURS RÉELS du dépôt, jamais
 *    deviné. Un interrupteur dont on ne sait pas ce qu'il ouvre ne se bascule
 *    pas : on l'essaie, et on appelle « bug » ce qu'on n'a pas compris.
 */
export const FICHES: Record<Interrupteur, FicheDInterrupteur> = {
  exercices_actif: {
    nom: 'exercices_actif',
    nature: 'professeur',
    titre: 'Les exercices',
    question: 'les élèves peuvent-ils faire des exercices ?',
    posePar: null,
    commande: [
      'le déroulé de l’élève à la maison — sans lui, l’écran se ferme poliment',
      'le module Codex côté élève, et la liste de ses exercices',
      'la face élève de la passation en classe, avec `passation_classe_actif`',
    ],
    avertissement: null,
  },
  routeur_actif: {
    nom: 'routeur_actif',
    nature: 'professeur',
    titre: 'Le routeur',
    question: 'le routeur choisit-il, ou le professeur planifie-t-il ?',
    posePar: null,
    commande: [
      'le MOTEUR du routeur — à OFF, rien n’est assigné automatiquement',
    ],
    avertissement:
      '⚠️ L’OUVRIR NE SUFFIT PAS À ALLUMER LE ROUTEUR, et il faut le savoir avant de '
      + 'conclure à une panne : le ciblage exige d’une compétence qu’elle soit `evaluee` '
      + 'ET qu’elle porte une LETTRE. Les six sont `evaluee` — mais rien n’écrit encore '
      + 'la lettre, et c’est le quatrième geste de C4-L12. À ON, cet interrupteur ne '
      + 'produira donc aucune décision tant que ce lot n’est pas joué. '
      + '(Les écrans de pilotage, eux, ne se ferment pas derrière lui : ils le lisent '
      + 'pour le montrer, et restent ouverts — ils préparent l’allumage.)',
  },
  competences_affichage_actif: {
    nom: 'competences_affichage_actif',
    nature: 'professeur',
    titre: 'L’affichage des lettres',
    question: 'les lettres sont-elles visibles ?',
    posePar: null,
    commande: [
      'la lettre de compétence au profil de classe',
    ],
    avertissement: null,
  },
  fabrique_actif: {
    nom: 'fabrique_actif',
    nature: 'chantier',
    titre: 'La fabrique',
    question: 'les écrans où le professeur fabrique sont-ils ouverts ?',
    posePar: 'C4-L8',
    commande: [
      'le dépôt du corpus et sa file de validation',
      'la conception en ligne, l’édition et l’aperçu',
      'l’écran des compétences — où se posent les statuts de recette',
    ],
    avertissement:
      'À OFF, ces écrans s’affichent quand même et DISENT pourquoi ils sont vides : '
      + '« un vide expliqué, jamais un onglet qui clignote » (§5).',
  },
  chaine_actif: {
    nom: 'chaine_actif',
    nature: 'chantier',
    titre: 'La chaîne froide',
    question: 'la chaîne froide a-t-elle le droit de tourner ?',
    posePar: 'C4-L5',
    commande: [
      'les MESURES de la file — `mesure_v1` et `mesure_vf`',
      'à OFF, les dépôts restent en file : rien n’est perdu, tout attend',
    ],
    avertissement:
      '⭐ LE SEUL DES SIX QU’UNE MACHINE BASCULE. La coupure automatique de coût '
      + 'l’éteint quand le plafond mensuel est atteint, « en laissant les dépôts en '
      + 'file ». S’il se referme sans que vous y touchiez, ce n’est pas une panne — '
      + 'c’est la facture. C’est aussi pourquoi aucun écran ne s’en sert comme garde.',
  },
  passation_classe_actif: {
    nom: 'passation_classe_actif',
    nature: 'chantier',
    titre: 'La passation en classe',
    question: 'le flux de la passation en classe est-il construit et éprouvé ?',
    posePar: 'C4-L4',
    commande: [
      'l’écran professeur de la passation — ouvrir, transcrire, corriger, publier',
      'la TRANSCRIPTION dans la file (`transcription_v1`)',
    ],
    avertissement:
      '⚠️ LE PLUS FERMÉ GAGNE, ET IL NE GAGNE QUE D’UN CÔTÉ. Pour l’ÉLÈVE, la '
      + 'passation demande celui-ci ET `exercices_actif` : ouvrir l’un sans l’autre '
      + 'ne lui montre rien. Pour le PROFESSEUR, celui-ci suffit — il corrige avant '
      + 'que les élèves aient accès à quoi que ce soit.',
  },
}

/** Les six, dans l'ordre du §5, prêtes à afficher. */
export const FICHES_ORDONNEES: FicheDInterrupteur[] = INTERRUPTEURS.map((n) => FICHES[n])

/** Vrai si `n` est l'un des six — la garde d'une valeur venue d'un formulaire. */
export function estUnInterrupteur(n: string): n is Interrupteur {
  return (INTERRUPTEURS as readonly string[]).includes(n)
}

/**
 * ⭐ BASCULER UN INTERRUPTEUR — le geste que le §5 confie au professeur, et que
 *    rien dans le dépôt ne servait : `poserPassationClasse` porte le commentaire
 *    « ouvrir et refermer sont des gestes du professeur ; ceci existe pour la
 *    recette », et aucun écran ne les basculait.
 *
 * ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une écriture dont on ignore
 *    le retour échoue EN SILENCE — et un interrupteur qu'on croit basculé sans
 *    qu'il le soit est pire que pas d'écran du tout. L'erreur est donc rendue à
 *    l'appelant, jamais avalée.
 *
 * ⚠️⚠️ UN `update` QUI NE TROUVE PAS SA LIGNE RÉUSSIT — il rend `error: null` et
 *    zéro ligne touchée. Sur une base où `scriptorium_params` n'aurait pas sa
 *    ligne `id = 1`, refermer un interrupteur « marcherait » sans rien écrire :
 *    la relecture rendrait `false`, qui est justement ce qu'on voulait poser.
 *    **La relecture seule ne voit donc que la moitié du cas.** D'où le
 *    `.select('id')`, qui compte ce qui a réellement bougé. *(Le patron
 *    `rag_actif` contourne le même écueil par un `upsert`.)*
 *
 * ⚠️ ET ON RELIT APRÈS AVOIR ÉCRIT : la valeur rendue est celle de la BASE,
 *    jamais celle qu'on croit avoir posée.
 */
export async function basculerLInterrupteur(
  admin: Admin, nom: Interrupteur, actif: boolean,
): Promise<{ ok: boolean; erreur: string | null; etat: Record<string, boolean> | null }> {
  const { data, error } = await admin
    .from('scriptorium_params').update({ [nom]: actif }).eq('id', 1).select('id')
  if (error) {
    console.error(`[allumage] ${nom} NON BASCULÉ — ${error.code} ${error.message}`)
    return { ok: false, erreur: `${error.code} ${error.message}`, etat: null }
  }
  if (!data || data.length === 0) {
    console.error(`[allumage] ${nom} NON BASCULÉ — aucune ligne \`scriptorium_params\` id = 1`)
    return {
      ok: false,
      erreur: 'aucune ligne `scriptorium_params` (id = 1) — rien n’a été écrit',
      etat: null,
    }
  }
  const etat = await lireLesInterrupteurs(admin)
  // La base fait foi : si elle ne porte pas ce qu'on vient d'écrire, on le dit.
  if (etat[nom] !== actif) {
    return {
      ok: false,
      erreur: `l’écriture est passée sans erreur, mais la base rend ${etat[nom]}`,
      etat,
    }
  }
  return { ok: true, erreur: null, etat }
}
