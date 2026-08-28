// ============================================================================
// C4 · L14 — LA CORRECTION SERVIE, ET CE QU'ELLE PORTE DÉSORMAIS.
// Module PUR. Il ne lit rien : on lui DONNE l'appui du cas et la crédence
// journalisée, il rend ce que l'écran affiche.
// ----------------------------------------------------------------------------
// CE QU'ELLE ÉTAIT, ET POURQUOI ÇA NE TENAIT PLUS.
//   La correction était la `reponse_attendue` **seule**, sous le titre « Ce
//   qu'il fallait voir ». Or depuis le `02-` §5 cette réponse, aux deux crans à
//   candidats, **est un candidat nu** — « l'écran sert QUATRE candidats : trois
//   distracteurs tirés de la banque, plus la `reponse_attendue` » — et un
//   candidat ne peut rien dire de lui-même. La correction portait donc un mot,
//   là où le `02-` §2.3.1 a attend qu'elle rende l'écart des deux crédences
//   interprétable.
//
// CE QU'ELLE PORTE MAINTENANT — TROIS CHOSES (`07-` §2, C4-L14) :
//   1. la bonne réponse ;
//   2. son **`pourquoi_juste`** (`08-` §5.2, format 1.2) ;
//   3. le **`pourquoi_faux` du SEUL candidat que l'élève a le plus chargé**.
//
// ⚠️ LE SEUL, PAS LES TROIS — et le motif est écrit : « l'effet de RENVERSEMENT
//    D'EXPERTISE dit que la rétroaction élaborée surcharge les élèves à faible
//    bagage et devient redondante pour les avancés » (`IDEES_post_rentree.md`).
//    Trois réfutations pour une erreur commise iraient contre. Le
//    `pourquoi_juste`, lui, se sert TOUJOURS : c'est une explication, pas trois.
//
// ⚠️ AUX CRANS 4 ET 5, L'INVERSE, et rien ne change pour eux : « là où la
//    réponse attendue est un candidat, elle a besoin d'un pourquoi ; ailleurs,
//    ELLE EST LE POURQUOI » (`08-` §5.2). Elle s'y sert seule, comme avant.
//
// ⚠️ AUCUNE DONNÉE N'EST À COLLECTER. `saisieARegistrer` journalise déjà
//    `jetons`, `choix`, `index_correct` et `candidats` (`credence.ts`) — et
//    c'est dans les `candidats` JOURNALISÉS, « ce qui a été réellement affiché,
//    dans l'ordre réellement mêlé », qu'on lit le candidat chargé. **Jamais dans
//    la banque entière** : elle en porte dix à quinze, l'écran n'en sert
//    QUE TROIS (`02-` §5 ; `04-` §0).
//
// ⛔ CE QUE CE MODULE NE FAIT PAS : la règle d'affichage **conditionnée à la
//    crédence** — l'effet d'hypercorrection. Le signal est là (`jetons[choix]`)
//    et la règle est PARQUÉE (`IDEES_post_rentree.md`) : elle demande son propre
//    travail, et ce lot ne la porte pas.
// ============================================================================

import { CRANS_GUIDES, pourquoiFauxDuCandidat } from './credence'
import { ETAPES_PAIRE, type EtapePaire } from './regime'
import type { CodeCran } from './types'

/**
 * ⭐⭐ LA RÈGLE DE L'ÉGALITÉ — écrite ici, et nulle part ailleurs.
 *
 * `saisieARegistrer` journalise `choix: j.indexOf(Math.max(...j))`, qui rend
 * **0** sur un 25/25/25/25. Or « le candidat le plus chargé » **n'existe pas**
 * sur une égalité : le `02-` §2.3.4 — « le candidat le plus chargé EST la
 * réponse » — ne dit rien de ce cas, et **servir la réfutation d'un candidat
 * que l'élève n'a pas choisi est pire que n'en servir aucune**.
 *
 * **LA RÈGLE ARRÊTÉE : sur une égalité, aucun candidat n'est le plus chargé.**
 * Cette fonction rend alors `null`, l'écran ne sert **pas** de `pourquoi_faux`,
 * il sert le `pourquoi_juste` **seul**, et **il dit pourquoi**. *L'absence est
 * honnête ; l'invention ne l'est pas.*
 *
 * ⛔ ELLE NE TOUCHE PAS À `choix`, et c'est délibéré : `choix` part en base et
 *    la chaîne le relit (contrat avec C4-L5). L'égalité est une règle **de
 *    l'écran de correction**, pas de la saisie. Hors égalité, les deux valeurs
 *    coïncident par construction.
 *
 * @param jetons la répartition journalisée, telle quelle.
 * @returns l'index du seul candidat le plus chargé, ou `null` — égalité, ou
 *          répartition illisible.
 */
export function leCandidatLePlusCharge(jetons: readonly unknown[]): number | null {
  if (!Array.isArray(jetons) || jetons.length === 0) return null
  const j: number[] = []
  for (const x of jetons) {
    if (typeof x !== 'number' || !Number.isFinite(x)) return null
    j.push(x)
  }
  const max = Math.max(...j)
  // ⚠️ C'est ICI que l'égalité se voit, et nulle part ailleurs : on compte
  //    COMBIEN de candidats atteignent le maximum. Deux, et il n'y a pas de
  //    « plus chargé ».
  if (j.filter((x) => x === max).length !== 1) return null
  return j.indexOf(max)
}

/** Pourquoi la correction ne sert AUCUNE réfutation — dit, jamais tu. */
export type MotifDeSilence =
  /** 25/25/25/25 : aucun candidat n'est le plus chargé. La règle ci-dessus. */
  | 'egalite'
  /** L'élève avait chargé la bonne réponse : il n'y a rien à réfuter. */
  | 'la_bonne_reponse_etait_chargee'
  /**
   * Le candidat chargé n'a pas de `pourquoi_faux`. Deux causes, toutes deux
   * légitimes : une instance **conçue en ligne**, dont la banque est faite de
   * CHAÎNES (`credence.ts`, les deux formes physiques), ou une banque importée
   * dont ce candidat était muet — que l'import a déjà **signalé** au professeur
   * (`08-` §7.3). On se tait plutôt que d'inventer.
   */
  | 'candidat_muet'
  /** La crédence journalisée n'est pas une répartition lisible. */
  | 'credence_illisible'

/** ⭐ CE QUE L'ÉCRAN DE CORRECTION SERT, POUR UN CAS. */
export interface CorrectionServie {
  /** La bonne réponse. Aux crans à candidats, c'est LE CANDIDAT, pas une prose. */
  reponse: string
  /** Pourquoi elle est la bonne. `null` = l'instance se tait, sans rien inventer. */
  pourquoiJuste: string | null
  /** La réfutation du SEUL candidat le plus chargé. `null` = aucune n'est due. */
  refutation: { candidat: string; pourquoiFaux: string } | null
  /** Pourquoi il n'y en a pas. `null` quand il y en a une, ou quand le cran
   *  n'en sert aucune — aux crans 4 et 5, la réponse attendue EST le pourquoi. */
  silence: MotifDeSilence | null
  /** Le cran sert-il quatre candidats ? Vrai aux crans 1 et 3, faux ailleurs. */
  surDesCandidats: boolean
  /** La réponse a-t-elle été DÉRIVÉE du matériau, faute d'être déclarée ?
   *  Vrai au cran 9, où la table des crans met `reponse_attendue` à `null`.
   *  L'écran s'en sert pour titrer : « Ce que tu aurais pu écrire », et non
   *  « Ce qu'il fallait voir » — ce n'est pas le même objet. */
  derivee: boolean
}

/**
 * ⭐ LE CRAN SERT-IL UNE CORRECTION, ET À QUEL TITRE ?
 *
 * Deux titres, et ils ne se recouvrent qu'au cran 1 :
 *   · **la paire** — « la correction du premier cas est servie AVANT le second »
 *     (`02-` §2.3.1 a) : les trois crans de diagnostic, 1, 4 et 9 ;
 *   · **le jugement algorithmique** — les deux crans guidés, 1 et 3 : « il n'y a
 *     ni extraction, ni squelette, donc rien que le modèle chaud puisse
 *     reformuler » (`06-` §2, temps 4). **Rien ne vient derrière.**
 *
 * ⛔ ET AILLEURS, NON — le cran 5 nommément. Sa `reponse_attendue` est **la
 *    version corrigée**, son jugement est IA, et sous escalade son régime devient
 *    `plein` : la servir après la crédence donnerait à l'élève la version
 *    réparée **avant sa version finale**, et le `delta_v1_vf` ne mesurerait plus
 *    rien. Ce module ne sert donc jamais un cran qui n'est ni une paire ni un
 *    cran guidé.
 */
export function correctionServieAuCran(
  geste: string | null, cranCode: CodeCran | string | null,
): boolean {
  if (geste === 'diagnostiquer') return true
  return cranCode !== null && (CRANS_GUIDES as readonly string[]).includes(cranCode)
}

/**
 * ⭐ LA CORRECTION DE CE CAS EST-ELLE DUE ?
 *
 * ⚠️ **La correction ne se sert qu'APRÈS la crédence DE SON CAS.** Sans quoi
 *    l'élève déclarerait sa sûreté en connaissant la réponse, et la porte 2 ne
 *    mesurerait plus rien (`regime.ts`). C'est la règle du troisième état ; le
 *    **sixième** obéit à la même.
 *
 * Sur une PAIRE, l'état fait foi — il porte déjà l'ordre, et l'ordre est celui
 * d'`ETAPES_PAIRE`. Hors paire, il n'y a pas d'état : la crédence du cas suffit.
 */
export function correctionDue(
  ordre: number,
  contexte: { estUnePaire: boolean; etape: EtapePaire | null; credenceDonnee: unknown },
): boolean {
  if (!contexte.estUnePaire) return contexte.credenceDonnee != null
  if (contexte.etape === null) return false
  const seuil: EtapePaire = ordre === 1 ? 'correction' : 'correction_2'
  // ⚠️ La comparaison se fait sur la LISTE ORDONNÉE, jamais sur une énumération
  //    recopiée : un septième état ajouté demain suivrait tout seul.
  return ETAPES_PAIRE.indexOf(contexte.etape) >= ETAPES_PAIRE.indexOf(seuil)
}

/**
 * ⭐⭐ CE QUE L'ÉCRAN AFFICHE — les trois choses, ou ce qui en tient lieu.
 *
 * @param appui             l'appui de CE cas, tel qu'`exercices_cas` le porte.
 * @param credence          la crédence journalisée de CE cas, telle quelle.
 * @param surDesCandidats   le cran sert-il quatre candidats ? (crans 1 et 3)
 * @returns `null` quand il n'y a rien à servir — une `reponse_attendue` vide,
 *          au cran 9 par exemple, où elle vaut `null` par la table des crans.
 */
export function composerLaCorrection(
  appui: { reponseAttendue: string | null; pourquoiJuste: string | null;
           distracteurs: unknown; versionCorrigee?: string | null },
  credence: unknown,
  surDesCandidats: boolean,
): CorrectionServie | null {
  // ⭐⭐ ITEM 78 — AU CRAN 9, LA CORRECTION EST DUE ET ELLE ÉTAIT VIDE.
  //    `correctionServieAuCran` la sert à tous les crans de diagnostic, 9
  //    compris ; mais la table des crans y met `reponse_attendue` à `null`
  //    (`02-` §2.2), si bien que ce module rendait `null` et que l'élève ne
  //    voyait RIEN entre les deux cas de la paire — alors que le `02-` §2.3.1 a
  //    veut que « la correction du premier cas soit servie AVANT le second ».
  // ⭐ LA RÉPONSE NE S'ÉCRIT PAS, ELLE SE DÉRIVE : elle EST la
  //    `version_corrigee` du matériau (`02-` §2.3.4). L'ajouter en base ferait
  //    un SECOND DOMICILE de ce que le matériau porte déjà, et les deux
  //    finiraient par diverger.
  // ⛔ ET SEULEMENT LÀ OÙ LA CORRECTION EST DUE. Aux crans 5 et 7, la version
  //    corrigée ne descend jamais : leur régime est « pas de vf, sauf
  //    escalade », et la servir donnerait la réponse AVANT la version finale —
  //    `delta_v1_vf` ne mesurerait plus rien. Le cran 9, lui, est « par
  //    paires » : il n'a pas de vf à protéger, et le second cas porte un AUTRE
  //    matériau. La garde de `vue.ts` — « `version_corrigee` n'en sort pas » —
  //    a pour motif la crédence, et `correctionDue` l'exige déjà.
  const declaree = (appui.reponseAttendue ?? '').trim()
  const derivee = declaree === ''
  const reponse = derivee ? (appui.versionCorrigee ?? '').trim() : declaree
  if (reponse === '') return null

  // Aux crans 4 et 5, la réponse attendue EST le pourquoi : elle se sert seule,
  // exactement comme avant ce lot. Rien à réfuter, rien à taire.
  if (!surDesCandidats) {
    return { reponse, pourquoiJuste: null, refutation: null, silence: null,
      surDesCandidats: false, derivee }
  }

  const pourquoiJuste = (appui.pourquoiJuste ?? '').trim() || null
  const muette = (silence: MotifDeSilence): CorrectionServie =>
    ({ reponse, pourquoiJuste, refutation: null, silence, surDesCandidats: true,
       derivee })

  if (!credence || typeof credence !== 'object') return muette('credence_illisible')
  const c = credence as Record<string, unknown>
  if (c.forme !== 'repartition' || !Array.isArray(c.candidats)) {
    return muette('credence_illisible')
  }

  const i = leCandidatLePlusCharge(Array.isArray(c.jetons) ? c.jetons : [])
  if (i === null) return muette('egalite')
  if (i === c.index_correct) return muette('la_bonne_reponse_etait_chargee')

  // ⚠️ LE TEXTE SERVI SE LIT DANS LES CANDIDATS JOURNALISÉS — « ce qui a été
  //    RÉELLEMENT AFFICHÉ, dans l'ordre réellement mêlé ». Puis « le texte
  //    retrouve son entrée en banque » : c'est là seulement qu'on va chercher
  //    son `pourquoi_faux`, jamais dans la banque prise en bloc.
  const candidat = c.candidats[i]
  if (typeof candidat !== 'string' || candidat.trim() === '') {
    return muette('credence_illisible')
  }
  const pourquoiFaux = pourquoiFauxDuCandidat(appui.distracteurs, candidat)
  if (pourquoiFaux === null) return muette('candidat_muet')

  return { reponse, pourquoiJuste, refutation: { candidat, pourquoiFaux },
    silence: null, surDesCandidats: true, derivee }
}
