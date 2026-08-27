import 'server-only'
// ============================================================================
// C5 · L1 — LE GÉNÉRATEUR DE LA RÉFÉRENCE DÉCOMPOSÉE, en plateforme.
// ----------------------------------------------------------------------------
// « Trois passages, dans l'ordre, et L'ORDRE EST LE REMÈDE » (`05-` §2). Autour
// d'eux, LE CODE, qui fait tout ce qui se calcule (`05-` §1) : il segmente le
// texte en phrases et les numérote, il retrouve les occurrences des concepts, il
// rend l'union des statuts, et il contrôle la conformité au format AVANT que la
// référence soit soumise au professeur.
//
// ⭐ CE FICHIER EST LA PHRASE QUE LE LOT REND FAUSSE. L'écran de la conception
//    écrivait : « Aucun appel de modèle ici : ce qui s'engendre — matériaux,
//    appuis, références — s'engendre au générateur, HORS PLATEFORME, et arrive
//    par l'import. » Elle a été corrigée là où elle est écrite
//    (`app/prof/conception/page.tsx`) : le générateur de la RÉFÉRENCE est ici ;
//    les matériaux et les appuis, eux, arrivent toujours par l'import.
//
// ⚠️ CE FICHIER N'EST PAS TESTABLE SOUS `npm test` — `appel.ts` importe
//    'server-only'. Tout ce qui se calcule est donc SORTI D'ICI : les messages,
//    les schémas et l'assemblage vivent à `format.ts`, les dérivations de
//    lecture à `lecture.ts`, et les deux sont couverts. Ce fichier n'orchestre.
//
// ⚠️ ON RÉEMPLOIE `appeler()` (`utils/chaine/appel.ts`), ON N'EN ÉCRIT PAS UN
//    SECOND. Il porte quatre choses qu'on ne veut pas réécrire : la mise en
//    cache du préfixe stable, LA JOURNALISATION DU COÛT PAR APPEL dans
//    `api_couts`, l'ABSENCE D'OUTIL (vraie par construction — `AppelIA` n'a pas
//    de champ `tools`), et la relance bornée sur sortie non conforme.
//
// ⚠️ ET LA `phase` VAUT `NULL`. La contrainte n'admet que `p1`, `p2`, `retour`
//    ou NULL, et « la `phase` dit L'ÉTAGE […] NULL hors exercices » (`07-` §1.2) :
//    LE GÉNÉRATEUR N'EST PAS UN ÉTAGE DE LA CHAÎNE FROIDE. Trois appels par
//    texte, et « le nombre d'appels se lit AU NOMBRE DE LIGNES, jamais à un
//    compteur ».
//
// ⛔ ET IL N'EMPRUNTE PAS `chaine_actif`. C'est le seul des six interrupteurs
//    qu'une MACHINE bascule — la coupure automatique de coût —, et « une facture
//    qui coupe le 12 du mois fermerait un écran que personne n'a décidé de
//    fermer » (`07-` §5). L'interrupteur de ce lot est `fabrique_actif`.
// ============================================================================

import { appeler, SortieNonConforme, AppelInterrompu } from '@/utils/chaine/appel'
import { lireConfig } from '@/utils/chaine/config'
import { controleReference, phrasesDuTexte, type VerdictReference }
  from '@/utils/fabrique/verifie-reference'
import { PROMPTS_GENERATEUR } from './derive/prompts'
import {
  FORME_G1, FORME_G2, FORME_G3, messageG1, messageG2, messageG3,
  phrasesDefendThese, assembler,
  type SortieG1, type SortieG2, type SortieG3,
} from './format'

/** Le journal des coûts porte ce module. `exercices-chaine` est celui de la
 *  chaîne froide ; le générateur n'en est pas un étage, et il le dit. */
export const MODULE_COUT = 'exercices-generateur'

/** Les rôles — courts, invariants, et ils ne cachent rien : ils ne pèsent rien.
 *  Ils reprennent le « Tu ne notes rien » que les prompts écrivent eux-mêmes. */
const SYSTEME: Record<'G1' | 'G2' | 'G3', string> = {
  G1: 'Tu qualifies, tu ne notes rien.',
  G2: 'Tu établis des lectures, tu ne notes rien.',
  G3: 'Tu rassembles ce qui est établi, tu ne notes rien.',
}

export interface PassageJoue {
  passage: 'G1' | 'G2' | 'G3'
  /** Les appels RÉELLEMENT dépensés — donc les lignes attendues à `api_couts`. */
  appels: number
  /** Quand un passage ne se joue pas, la raison. `null` s'il s'est joué. */
  saute: string | null
}

export interface Decomposition {
  /** La référence au format du `02-` §6 A — les six clés, et rien d'autre. */
  reference: Record<string, unknown>
  /** Le verdict du contrôle QUI FAIT FOI, sur l'assemblage entier. */
  verdict: VerdictReference
  passages: PassageJoue[]
  appels: number
  modele: string
  /** La segmentation qui fait foi, telle qu'elle est partie au modèle. */
  phrases: string[]
}

/** Le générateur a échoué avant d'avoir une référence : rien n'est écrit. */
export class GenerationInterrompue extends Error {
  readonly passage: 'G1' | 'G2' | 'G3'
  readonly appels: number
  readonly motifs: string[]
  constructor(passage: 'G1' | 'G2' | 'G3', message: string, appels: number, motifs: string[]) {
    super(message)
    this.passage = passage
    this.appels = appels
    this.motifs = motifs
  }
}

export interface AttributionGenerateur {
  /** `null` est licite : « un coût non attribuable reste une ligne valide ». */
  classeId?: string | null
}

/**
 * Les trois passages, DANS L'ORDRE, sur un texte d'auteur.
 *
 * ⚠️ L'ORDRE N'EST PAS UN DÉTAIL D'IMPLÉMENTATION. « Un seul appel qui rendrait
 *    tout d'un coup rouvrirait le halo que les trois passages ferment » : G2 ne
 *    peut pas travailler sur une liste que G1 est en train de fabriquer, et G3,
 *    s'il passait d'abord, plierait tout le détail vers sa thèse (`05-` §2).
 *    Les trois `await` se suivent, et ce n'est pas une paresse de parallélisme.
 *
 * ⚠️ LE VERDICT NE DÉCIDE PAS ICI. Cette fonction rend la référence ET son
 *    verdict ; c'est l'appelant qui décide de l'écrire ou non — « on régénère,
 *    on ne dérange pas le professeur » (`05-` §4.1).
 */
export async function engendrerLaReference(
  texte: string, attribution: AttributionGenerateur = {},
): Promise<Decomposition> {
  const modele = lireConfig().fort
  const phrases = phrasesDuTexte(texte)
  const passages: PassageJoue[] = []
  let appels = 0

  const commun = {
    modele,
    // NULL, et c'est le point : le générateur n'est pas un étage de la chaîne.
    phase: null as null,
    forme: FORME_G1,
    attribution: { module: MODULE_COUT, classeId: attribution.classeId ?? null },
  }

  // ── G1 — la qualification : les phrases, PUIS les moments, PUIS les concepts
  const g1 = await joue<SortieG1>('G1', {
    ...commun,
    systeme: SYSTEME.G1,
    prefixeCacheable: PROMPTS_GENERATEUR.prompts.G1,
    message: messageG1(phrases),
    forme: FORME_G1,
    // Un texte de 400 mots donne un JSON d'une centaine d'entrées : le défaut
    // de 2000 jetons de `appeler()` le tronquerait, et une sortie tronquée est
    // un JSON illisible — donc une relance, donc un appel payé pour rien.
    maxTokensSortie: 16000,
  }, passages)
  appels += passages[passages.length - 1].appels

  // ── G2 — les lectures défendables, sur les SEULES phrases en `defend_these`
  const demandees = phrasesDefendThese(g1)
  let g2: SortieG2 = { lectures: [] }
  if (demandees.length === 0) {
    // ⚠️ CE N'EST PAS UNE ÉCONOMIE DÉGUISÉE. G2 « reçoit la liste des phrases sur
    //    lesquelles travailler » : une liste vide n'a rien à lui demander, et
    //    l'appel serait payé pour une réponse vide. Le passage est DIT sauté —
    //    « le nombre d'appels se lit au nombre de lignes » reste vrai, et le
    //    relevé de l'écran porte la raison.
    passages.push({ passage: 'G2', appels: 0,
      saute: 'aucune phrase en `defend_these` : G2 n\'a rien à établir.' })
  } else {
    g2 = await joue<SortieG2>('G2', {
      ...commun,
      systeme: SYSTEME.G2,
      prefixeCacheable: PROMPTS_GENERATEUR.prompts.G2,
      message: messageG2(phrases, demandees),
      forme: FORME_G2,
      maxTokensSortie: 16000,
    }, passages)
    appels += passages[passages.length - 1].appels
  }

  // ── G3 — l'armature, EN DERNIER, et il reçoit tout
  const g3 = await joue<SortieG3>('G3', {
    ...commun,
    systeme: SYSTEME.G3,
    prefixeCacheable: PROMPTS_GENERATEUR.prompts.G3,
    message: messageG3(phrases, g1, g2),
    forme: FORME_G3,
    maxTokensSortie: 4000,
  }, passages)
  appels += passages[passages.length - 1].appels

  const reference = assembler(g1, g2, g3)
  // LE CONTRÔLE QUI FAIT FOI — treize refus, deux blocages, sept signalements,
  // « et il ne les confond pas » (`05-` §4.7).
  const verdict = controleReference(reference, texte)
  return { reference, verdict, passages, appels, modele, phrases }
}

/** Un passage, son appel, et ce qu'il coûte quand il échoue. */
async function joue<T>(
  passage: 'G1' | 'G2' | 'G3',
  demande: Parameters<typeof appeler>[0],
  passages: PassageJoue[],
): Promise<T> {
  try {
    const r = await appeler<T>(demande)
    passages.push({ passage, appels: r.appels, saute: null })
    return r.valeur
  } catch (e) {
    // ⚠️ UN APPEL QUI ÉCHOUE A COÛTÉ, et l'appelant doit pouvoir le dire : les
    //    lignes déjà écrites à `api_couts` ne s'effacent pas parce que la suite
    //    n'a pas abouti.
    if (e instanceof SortieNonConforme) {
      passages.push({ passage, appels: e.appels, saute: 'sortie non conforme' })
      throw new GenerationInterrompue(passage,
        `${passage} n'a pas rendu une sortie conforme, même après relance.`,
        e.appels, e.motifs)
    }
    if (e instanceof AppelInterrompu) {
      passages.push({ passage, appels: e.appels, saute: 'appel interrompu' })
      throw new GenerationInterrompue(passage,
        `${passage} n'a pas abouti : ${e.message}`, e.appels, [e.message])
    }
    passages.push({ passage, appels: 0, saute: 'erreur' })
    throw new GenerationInterrompue(passage,
      `${passage} a échoué : ${e instanceof Error ? e.message : String(e)}`, 0, [])
  }
}
