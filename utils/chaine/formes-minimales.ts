/**
 * ⭐⭐ 02/09/2026 — LA FORME MINIMALE DE CHAQUE PHASE, pour les six compétences.
 *
 * Les trois appels de la chaîne passaient en `objet_libre` : « on exige un
 * objet, on ne prétend pas en connaître les clés ». Conséquence mesurée à
 * l'audit : un P1 qui rend `{}` — ou une seule clé — est une sortie VALIDE,
 * jamais relancée ; et les garde-fous « aucune unité → Absent » des branchements
 * écrivent alors une lettre E sans distinguer « copie sans unité » de « P1 n'a
 * rien relevé ».
 *
 * Ici, par prompt, les clés SANS LESQUELLES RIEN NE SE LIT — celles que le
 * squelette JSON du prompt déclare et que `code1`/`code2` lisent en premier.
 * Rien d'autre : la forme d'une fiche fait foi à la fiche (`03-` §1), et une
 * clé de plus n'est jamais un refus (`objet_ouvert`, `schema.ts`). Une sortie
 * qui manque une de ces clés est REJETÉE ET RELANCÉE (`01-` §12), comme le
 * retour l'est déjà ; et si la relance échoue, la compétence est écartée en le
 * disant — pas mesurée à vide.
 *
 * ⚠️ Éprouvé sur les 274 squelettes de production : aucune sortie réelle n'est
 * refusée par ces formes. Une clé qu'on y ajouterait doit repasser cette épreuve.
 */
import type { Competence } from './types'
import type { Forme } from './schema'

const liste = (): Forme => ({ type: 'liste', de: { type: 'objet_libre' } })
const objet = (): Forme => ({ type: 'objet_libre' })
const texte = (): Forme => ({ type: 'texte' })
const ouvert = (champs: Record<string, Forme>): Forme => ({ type: 'objet_ouvert', champs })

/** Par compétence, par tête de prompt (`P1`, `P1A`, `P1B`, `P2`). */
export const FORMES_MINIMALES: Readonly<Record<Competence, Readonly<Record<string, Forme>>>> = {
  expression: {
    P1: ouvert({ faits: liste() }),
    P2: ouvert({ niveau: texte(), grades: objet(), etiquettes_rejetees: liste(), reussites_rejetees: liste() }),
  },
  argumentation: {
    P1: ouvert({ unites: liste() }),
    P2: ouvert({ crible: objet() }),
  },
  structure: {
    P1: ouvert({ blocs: liste(), jointures: liste() }),
    P2: ouvert({ crible: objet() }),
  },
  questionnement: {
    P1: ouvert({ enjeu: texte(), forme_question: texte(), recadrages: liste() }),
    P2: ouvert({ crible: liste(), question_specifique: texte() }),
  },
  synthese: {
    P1A: ouvert({ unites: liste() }),
    P1B: ouvert({ alignement: liste() }),
    P2: ouvert({ crible: liste(), fidelite: liste() }),
  },
  connaissance: {
    P1: ouvert({ unites_mobilisees: liste() }),
    P2: ouvert({ unites: liste() }),
  },
}

/**
 * La forme à exiger d'un appel. `objet_libre` quand la table ne dit rien — un
 * prompt qu'elle ne connaît pas garde le comportement d'avant, il ne casse pas.
 */
export function formeMinimale(competence: Competence, tetePrompt: string): Forme {
  return FORMES_MINIMALES[competence]?.[tetePrompt] ?? { type: 'objet_libre' }
}

/**
 * La liste-colonne vertébrale d'un relevé : celle dont le vide, sur une copie
 * qui a des mots, dit « P1 n'a rien relevé » plutôt que « rien à relever ». Le
 * Questionnement n'en a pas — ses champs sont des constats, et `recadrages`
 * vide est un cas ordinaire.
 */
const COLONNE_VERTEBRALE: Readonly<Record<Competence, Readonly<Record<string, string>>>> = {
  expression: { P1: 'faits' },
  argumentation: { P1: 'unites' },
  structure: { P1: 'blocs' },
  questionnement: {},
  synthese: { P1A: 'unites' },
  connaissance: { P1: 'unites_mobilisees' },
}

/**
 * ⚠️ ALERTE, PAS REFUS. Un relevé vide sur une copie de N mots est possible
 * (une copie hors sujet, une liste de titres) ; on ne le refuse pas, on le
 * DIT — parce que la lettre qui en sortira est E, et que le professeur doit
 * pouvoir distinguer « l'élève n'a rien argumenté » de « le modèle n'a rien
 * lu ». Trancher plus loin change ce qui s'écrit en base : c'est à Louis.
 */
export function releveVide(
  competence: Competence, tetePrompt: string, artefact: unknown, production: string,
): string | null {
  const cle = COLONNE_VERTEBRALE[competence]?.[tetePrompt]
  if (!cle || artefact === null || typeof artefact !== 'object') return null
  const v = (artefact as Record<string, unknown>)[cle]
  if (!Array.isArray(v) || v.length > 0) return null
  const mots = production.trim() === '' ? 0 : production.trim().split(/\s+/).length
  if (mots === 0) return null
  return `RELEVÉ VIDE : ${tetePrompt} n'a relevé aucune entrée dans « ${cle} » sur une copie de `
    + `${mots} mot(s) — la lettre qui en sort dira « Absent » sans qu'on sache si c'est l'élève `
    + 'ou le modèle qui n\'a rien fait'
}
