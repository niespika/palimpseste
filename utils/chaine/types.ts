// ============================================================================
// C4 · L5 — LE VOCABULAIRE DE LA CHAÎNE FROIDE.
// ----------------------------------------------------------------------------
// Rien ici n'est une règle : ce sont les noms que les autres modules partagent.
// Les listes fermées viennent des sources, et chaque constante cite la sienne.
// ============================================================================

/** `07-` §1.2 — « la compétence en identifiant NU : pas de préfixe ». */
export const COMPETENCES = ['expression', 'argumentation', 'structure',
  'connaissance', 'synthese', 'questionnement'] as const
export type Competence = (typeof COMPETENCES)[number]

/** `02-` §3 — les cinq modes. `modes` est une LISTE, jamais une valeur (§1.2). */
export const MODES = ['composer', 'restituer', 'expliquer', 'évaluer', 'interroger'] as const
export type Mode = (typeof MODES)[number]

/** `01-` §3 — « deux valeurs et pas davantage, toujours connu ». */
export type Lieu = 'maison' | 'classe'

/** `07-` §1.2 — la forme de la mesure. Une ancre est `classe` ET `sommatif` (`01-` §10). */
export type Forme = 'formatif' | 'sommatif'

/** `07-` §1.2 — « par dépôt × version × compétence mesurée ». */
export type Version = 'v1' | 'vf'

/** `07-` §1.2 — la `phase` dit l'ÉTAGE, jamais le nombre d'appels. */
export type Phase = 'p1' | 'p2' | 'retour'

/** `01-` §11 — calculée, jamais jugée ; NULL sans dépôt d'origine. */
export type DistanceContexte = 'meme_type' | 'meme_famille' | 'transfert'

/** `01-` §8.7 — trois registres. Il est DONNÉ à la chaîne, elle ne l'élit pas. */
export type Registre = 'descriptif' | 'demonstratif' | 'interrogatif'

/** `01-` §3 — les trois statuts de recette. */
export type StatutRecette = 'evaluee' | 'mesuree_silencieusement' | 'differee'

/** `07-` §1.4 — les deux sous-dimensions du Monitoring. */
export type SousDimension = 'calibration_confiance' | 'lucidite_incompris'

/** `competences/monitoring.md` §5 — la `source` est un champ, pas un commentaire. */
export type SourceMonitoring = 'spontanee' | 'sollicitee'

/** `02-` §1.1 — le grain de l'objet ; il borne ce que le RETOUR nomme (`07-` §4, règle 2). */
export type Grain = 'micro' | 'meso' | 'macro'

/** `00-referentiel.md` §3 — l'échelle commune, du plus bas au plus haut. */
export const PALIERS = ['E', 'D', 'C', 'B', 'A'] as const
export type Palier = (typeof PALIERS)[number]

/**
 * Un point de retour — `07-` §1.2 : « une liste de points, chacun avec son
 * identifiant stable, son ancrage et son texte — jamais un bloc que l'écran
 * devrait découper ».
 */
export interface PointRetour {
  /** Stable : c'est sur lui que la contestation s'accroche (§1.2). */
  id: string
  /**
   * Ce à quoi le point s'ancre — la citation, et sa source (RR3).
   *
   * ⚠️⚠️ **FACULTATIF DEPUIS LE 31/08, ET CE N'EST PAS UN DÉTAIL DE TYPAGE.** Le
   *    code vérifie chaque citation contre la copie et **écarte** celle qu'il
   *    n'y retrouve pas (`elaguerLesAncrages`) : un point peut donc arriver à
   *    l'écran avec son texte et sans son bloc de citation. La garde en base l'a
   *    suivi le même jour (`retour_ancrage_elague.sql`), et `RetourSegmente.tsx`
   *    le gérait déjà — *« une citation vide n'est pas montrée »*.
   */
  ancrage?: { source: 'copie' | 'texte_support'; citation: string }
  texte: string
  /** La compétence dont le point parle — le retour est mono-focal en N1 (`01-` §8.4). */
  competence: Competence | 'monitoring'
  /** Ce que le point fait : une réussite citée, ou un point de travail (§4, règles 2 et 4). */
  nature: 'reussite' | 'point_de_travail'
}

/** Ce que la chaîne rend pour un retour — le texte SEGMENTÉ, et rien d'autre. */
export interface RetourSegmente {
  points: PointRetour[]
  /** `07-` §4, règle 5 — l'action de révision (v1) ou le pont (vf). Le modèle l'écrit. */
  action_revision: string | null
  feed_forward: string | null
}

/** Le verdict d'un observable, tel que P2 le rend et que le retour le lit. */
export interface VerdictObservable {
  observable: string
  /** La valeur relevée — un nombre, une étiquette, ou `n/a` (CONTRAT-MODULES §3). */
  valeur: number | string | null
  /** `07-` §4, règle 4 — « le champ `levier` du verdict », lu PAR SON NOM. */
  levier?: string | null
  citations?: Array<{ source: 'copie' | 'texte_support'; citation: string }>
}
