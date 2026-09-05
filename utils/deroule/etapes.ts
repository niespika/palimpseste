// ============================================================================
// « UN ÉCRAN, UNE TÂCHE » — LES ÉTAPES DE LA COLONNE DE TRAVAIL (Louis, 04/09/2026).
// Module PUR : aucune base, aucune I/O.
// ----------------------------------------------------------------------------
// Dix commentaires sur la galerie des écrans, et un seul principe : *« 1 tâche
// par écran, c'est le principe directeur »*. La colonne de droite devient une
// PAGE QUI TOURNE — le champ, OU la crédence, OU un geste, OU le bouton de
// remise — jamais deux ensemble. Ce module dit QUELLE page l'élève a sous les
// yeux, et à quel rang de la suite elle se trouve.
//
// ⛔ **CE MODULE NE DÉCIDE RIEN DE CE QUI S'ENREGISTRE.** Le serveur reste seul
//    maître du temps courant, des crédences données, des gestes restants ; ce
//    qui vient de l'écran est UN drapeau, `redactionFinie` — l'élève a cliqué
//    « Enregistrer » et tourné la page —, et il ne s'écrit nulle part.
//
// ⚠️ Deux étapes n'existent qu'ici : `ecrire` et `credence` ne sont séparées
//    que par ce drapeau. Aux crans sans crédence (2·6·8) l'écriture mène aux
//    gestes ; aux six crans qui la demandent, elle mène à la crédence, et la
//    crédence — donnée — mène aux gestes ou, sur une paire, à la correction du
//    premier cas (c'est le serveur qui fait avancer l'étape de la paire).
// ============================================================================

import type { MomentDeLaPaire } from './paire'
import type { Temps } from './types'

export type GesteDeLaRemise = 'confiance' | 'conditions' | 'restitution'

/**
 * Les pages que la colonne de travail sait tourner :
 *   · `ecrire`     — le champ, et son bouton « Enregistrer » ;
 *   · `repondre`   — les quatre lectures et les jetons (crans 1 et 3) ;
 *   · `credence`   — « À quel point es-tu sûr ? », seule ;
 *   · les trois gestes, un par page, dans l'ordre de la doctrine (`06-` §3) ;
 *   · `rendre`     — le bouton, et rien d'autre à faire ;
 *   · `correction` — la correction du premier cas d'une paire, seule ;
 *   · `apres`      — la copie est rendue : l'attente, ce qui a été rendu.
 */
export type EtapeDuTravail =
  | 'ecrire' | 'repondre' | 'credence'
  | GesteDeLaRemise
  | 'rendre' | 'correction' | 'apres'

export interface EtatDuTravail {
  /** Le moment de la paire, `null` hors paire (`utils/deroule/paire.ts`). */
  moment: MomentDeLaPaire | null
  /** La crédence EST-elle la réponse (crans 1 et 3) ? */
  credenceEstLaReponse: boolean
  /** Le temps courant permet-il encore d'écrire cette version ? */
  enRedaction: boolean
  /** Une offre de crédence existe pour ce cas, sans empêchement, et n'est pas donnée. */
  credenceASaisir: boolean
  /** Le premier des gestes restants — `null` quand il n'en reste aucun. */
  gesteRestant: GesteDeLaRemise | null
  /** Sur une paire, le premier cas ne se rend pas ; le second non plus avant sa crédence. */
  sansRemise: boolean
  /** ÉTAT D'ÉCRAN : l'élève a enregistré et tourné la page (ou la crédence est donnée). */
  redactionFinie: boolean
}

/**
 * ⭐ LA PAGE COURANTE. L'ordre des tests est l'ordre du geste : la correction
 *    du premier cas passe devant tout (elle a son écran) ; après la remise il
 *    n'y a plus de page à tourner ; puis écrire → crédence → gestes → rendre.
 *
 * ⚠️ Sur une paire, une crédence donnée au premier cas fait passer l'étape
 *    serveur à `correction` : entre la saisie et le rafraîchissement, le moment
 *    est encore `cas_1` et la crédence est prise — on reste sur `ecrire`, une
 *    fraction de seconde, plutôt que d'inventer une page de remise qui n'a pas
 *    lieu d'être.
 */
export function etapeDuTravail(e: EtatDuTravail): EtapeDuTravail {
  if (e.moment === 'correction_1') return 'correction'
  if (!e.enRedaction) return 'apres'
  if (e.credenceEstLaReponse) return 'repondre'
  if (!e.redactionFinie) return 'ecrire'
  if (e.credenceASaisir) return 'credence'
  if (e.sansRemise) return 'ecrire'
  if (e.gesteRestant) return e.gesteRestant
  return 'rendre'
}

/** Une étape de la suite, et le cas qu'elle concerne (une paire en a deux). */
export interface EtapeServie {
  etape: EtapeDuTravail
  cas: 1 | 2 | null
}

/**
 * ⭐ LA SUITE DES ÉTAPES D'UN EXERCICE, telle que le compteur la lit — « 3 / 7 ».
 *
 * · une rédaction : écrire, (crédence), les gestes servis, rendre ;
 * · une paire à rédaction : écrire, (crédence), la correction du premier cas,
 *   puis le second cas de même, puis les gestes et la remise ;
 * · des candidats : répondre, (la correction, répondre) ;
 * · la version finale : écrire, rendre.
 *
 * ⚠️ `gestes` sont TOUS les gestes que la remise sert — faits ou non —, pas les
 *    restants : le serveur ne rend que ceux-là, et la colonne les complète de ce
 *    qu'elle sait déjà déclaré.
 */
export function etapesServies(a: {
  estUnePaire: boolean
  credenceEstLaReponse: boolean
  credenceDemandee: boolean
  gestes: readonly GesteDeLaRemise[]
  versionFinale: boolean
}): EtapeServie[] {
  if (a.versionFinale) return [{ etape: 'ecrire', cas: null }, { etape: 'rendre', cas: null }]
  if (a.credenceEstLaReponse) {
    return a.estUnePaire
      ? [{ etape: 'repondre', cas: 1 }, { etape: 'correction', cas: 1 }, { etape: 'repondre', cas: 2 }]
      : [{ etape: 'repondre', cas: null }]
  }
  const unCas = (cas: 1 | 2 | null): EtapeServie[] => [
    { etape: 'ecrire', cas },
    ...(a.credenceDemandee ? [{ etape: 'credence' as const, cas }] : []),
  ]
  const fin: EtapeServie[] = [
    ...a.gestes.map((g) => ({ etape: g, cas: null })),
    { etape: 'rendre', cas: null },
  ]
  if (!a.estUnePaire) return [...unCas(null), ...fin]
  return [...unCas(1), { etape: 'correction', cas: 1 }, ...unCas(2), ...fin]
}

/**
 * Le rang de la page courante dans la suite — `null` après la remise, où il
 * n'y a plus rien à compter, et pour toute page qui n'est pas dans la suite.
 */
export function rangDeLEtape(
  suite: readonly EtapeServie[], etape: EtapeDuTravail, cas: 1 | 2 | null,
): { rang: number; total: number } | null {
  const i = suite.findIndex((s) => s.etape === etape && (s.cas === null || cas === null || s.cas === cas))
  if (i < 0) return null
  return { rang: i + 1, total: suite.length }
}

/**
 * Les gestes que la remise sert — la confiance seulement quand une compétence
 * évaluée la demande (`gestes.ts` : `competencesQuiDemandentLaConfiance`), les
 * deux autres toujours. ⚠️ Un miroir de `gestesRestants`, complété de ce qui
 * est déjà déclaré ; il ne sert qu'au COMPTEUR, jamais à décider quel geste
 * vient — c'est `vue.gestesRestants[0]` qui le dit.
 */
export function gestesServis(
  a: { confianceDemandee: boolean; restitutionDemandee: boolean },
): GesteDeLaRemise[] {
  return [
    ...(a.confianceDemandee ? ['confiance' as const] : []),
    'conditions' as const,
    ...(a.restitutionDemandee ? ['restitution' as const] : []),
  ]
}

/**
 * ⭐ 05/09 — LE TEMPS DU FIL QUE LA PAGE FAIT LIRE (Louis : « on est toujours
 *    dans Se juger ») : les gestes de la remise et la remise elle-même sont le
 *    temps « Se juger » ; les autres pages laissent le fil au temps du serveur.
 * ⛔ De la PRÉSENTATION, comme `tempsAffiche` : rien ne s'y décide.
 */
export function tempsDeLaPage(etape: EtapeDuTravail): Temps | null {
  return etape === 'confiance' || etape === 'conditions' || etape === 'restitution'
    || etape === 'rendre' ? 'se_juger' : null
}

/** Le titre de la page, en Cinzel au-dessus de la colonne. */
export function titreDeLEtape(etape: EtapeDuTravail, forme: 'rediger' | 'choisir' | 'surligner'): string {
  switch (etape) {
    case 'ecrire': return forme === 'surligner' ? 'Ce que tu en dis' : 'Ton écriture'
    case 'repondre': return 'Ta réponse'
    case 'credence': return 'Ta crédence'
    case 'confiance': case 'conditions': case 'restitution': return 'Avant de rendre'
    case 'rendre': return 'Rendre'
    case 'correction': return 'La correction du premier cas'
    case 'apres': return 'Ta copie'
  }
}

/**
 * Le libellé du volet de TRAVAIL sur le téléphone, qui suit la page : « Écrire »
 * tant qu'on écrit, « Crédence » quand elle est à déclarer, « Rendre » pour les
 * gestes et la remise, « La correction » entre les deux cas d'une paire.
 */
export function libelleDuVoletDeTravail(etape: EtapeDuTravail): string {
  switch (etape) {
    case 'ecrire': return 'Écrire'
    case 'repondre': return 'Répondre'
    case 'credence': return 'Crédence'
    case 'confiance': case 'conditions': case 'restitution': case 'rendre': return 'Rendre'
    case 'correction': return 'La correction'
    case 'apres': return 'Ta copie'
  }
}
