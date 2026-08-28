// ============================================================================
// ITEM 77 — LA DÉSIGNATION DANS LE MATÉRIAU : l'élève sélectionne, puis dit.
// Module PUR. Aucun `server-only`, aucune base, aucune I/O, aucune horloge.
// ----------------------------------------------------------------------------
// ⭐ LA RÈGLE (`02-` §5, « L'élève DÉSIGNE dans le matériau », v5.8) : aux crans
//    4, 7 et 9, l'élève ne recopie plus le passage, il le SÉLECTIONNE, puis il
//    dit ce qui cloche. « Le jugement cesse d'être une EXTRACTION — retrouver,
//    dans une phrase libre, de quel passage l'élève parle — pour devenir une
//    COMPARAISON DE BORNES. »
//
// ⭐⭐ RIEN N'EST DÉCLARÉ, TOUT SE DÉRIVE, ET C'EST LE POINT.
//    · **QUELS CRANS** : ceux dont le régime de marquage est `rien` — « l'y
//      trouver EST le travail ». Aucune colonne neuve sur `exercices_crans` ;
//      le cran commande, jamais la présence d'un champ (même forme que
//      `marquage.ts`).
//    · **LA CIBLE** : le diff `contenu` ↔ `version_corrigee`, le MÊME calcul
//      qu'aux crans 3 et 5 — `intervalleDuPassageFautif`, qui partage son
//      domicile avec le marquage. ⛔ Mais la cible SE SITUE là où le marquage
//      CHERCHE : un passage d'un seul mot qui revient se marque partout, et ne
//      se désigne qu'à un endroit.
//    Aucun champ neuf, ni au cas, ni au matériau, ni au format d'import : la
//    dérivation du 28/08 le confirme, seule l'empreinte du `02-` a bougé.
//
// ⛔⛔ UN DÉFAUT SUR ONZE EST UNE ABSENCE, ET ON NE SURLIGNE PAS UNE ABSENCE.
//    Là où la `version_corrigee` AJOUTE au lieu de remplacer — un garant qui
//    manque, une attache absente —, le diff est vide et il n'y a rien à
//    désigner. **Mesuré sur la banque du 28/08 : 30 cas sur 320, et 9 % aux
//    trois crans également** (cran 4 : 12/128 · cran 7 : 6/64 · cran 9 :
//    12/128). L'exercice bascule alors en TEXTE LIBRE.
//
// ⚠️⚠️ LA BASCULE SE LIT AVANT LA TABLE DES VERDICTS, JAMAIS APRÈS. Sur une
//    absence, le cas 1 se déclencherait sur une zone vide et **compterait faux
//    un élève qui a raison**. C'est pourquoi `verdictDeLaZone` exige une cible
//    non nulle : le type interdit l'ordre inverse.
//
// ⚠️ CE MODULE NE JUGE PAS LE TEXTE LIBRE. Il rend, pour chaque cas, s'il faut
//    le lire — et aux crans 4, 7 et 9 c'est l'IA qui juge (`02-` §2.2). « Le
//    seul cas où le jugement se règle sans rien lire » est le cas 1, et c'est
//    tout l'intérêt de la désignation.
// ============================================================================

import { intervalleDuPassageFautif, type RegimeMarquage } from './marquage'

/** Base 0, fin EXCLUE — la convention de `materiau_source_localisation`. */
export type Intervalle = readonly [number, number]

/**
 * ⭐ LES TROIS CRANS QUI DEMANDENT UNE DÉSIGNATION, DÉRIVÉS DU MARQUAGE.
 *
 * `rien` est la cellule des crans 4, 7 et 9 — et d'eux seuls. ⚠️ **`null` n'est
 * PAS `rien`** : c'est l'absence de règle (crans 2, 6 et 8, qui n'ont pas de
 * matériau, et une base qui n'a pas reçu la re-dérivation). « Rien à marquer »
 * est une décision ; « pas de matériau » est une absence — et on ne demande pas
 * de désigner dans un matériau qui n'existe pas.
 */
export function demandeUneDesignation(regime: RegimeMarquage | null): boolean {
  return regime === 'rien'
}

/**
 * ⭐ LA CIBLE — le passage que l'élève doit désigner, dérivé du diff.
 *
 * @returns l'intervalle du passage fautif, ou **`null` quand le diff est vide**
 *   — le défaut est une ABSENCE, il n'y a rien à désigner, et l'exercice
 *   bascule en texte libre. ⛔ `null` n'est pas une panne : c'est la moitié de
 *   la règle.
 *
 * ⚠️ **La `version_corrigee` NE RESSORT PAS** : `motsAMarquer` ne rend que des
 * tranches de `contenu`, et cette fonction ne rend que des positions. *C'est la
 * réponse — aux crans 7 et 9 elle vaut correction (`02-` §2.3.4).*
 *
 * ⛔⛔ **LA CIBLE SE SITUE, ELLE NE SE CHERCHE PAS.** C'est ce qui la sépare du
 * marquage : celui-ci CHERCHE — « chacun là où il apparaît » —, elle désigne
 * **un endroit**, celui que le diff pointe. *Un passage fautif d'un seul mot
 * qui revient dans le matériau — « il » — rendait, cherché, l'englobant de ses
 * occurrences : 29 mots au lieu d'un, et plus aucune zone ne pouvait manquer
 * une cible aussi large.* Le calcul vit à `marquage.ts`, en un seul domicile
 * avec celui du marquage.
 */
export function cibleDansLeMateriau(
  contenu: string | null | undefined, versionCorrigee: string | null | undefined,
): Intervalle | null {
  return intervalleDuPassageFautif(contenu, versionCorrigee)
}

// ── LA TOLÉRANCE ────────────────────────────────────────────────────────────

/**
 * ⭐ « AU PLUS UN MOT DE TROP DE CHAQUE CÔTÉ » — décision de Louis, 28/08.
 *
 * ⛔ **ET NON UN POURCENTAGE SEUL, QUI SE RETOURNE CONTRE LES PETITES CIBLES.**
 * 20 % d'une cible de trente signes fait six caractères, c'est-à-dire moins d'un
 * mot ; or **une sélection se fait à la souris, et elle tombe sur des frontières
 * de mots**. ⚠️ Et les petites cibles ne sont pas un cas d'école : sur les 290
 * cibles mesurées le 28/08, la médiane fait **8 mots**, le maximum **105**, et
 * **81 — plus d'une sur quatre — n'en font qu'UN SEUL**.
 */
const UN_MOT = 1

/**
 * ⚠️⚠️ LES DEUX CHIFFRES DU SECOND SEUIL SONT **PROVISOIRES**, ET LA SOURCE LE
 * DIT : « ils se calibrent sur copies réelles ; ils n'ont pas de valeur arrêtée
 * avant d'avoir été vus » (`02-` §5). Ils vivent ici, et **ici seulement**, pour
 * qu'une calibration soit un changement d'un seul endroit.
 *
 * ⭐ Le second seuil n'existe que parce que « un mot de chaque côté » est
 * **sévère sur les cibles longues et large sur les courtes** : sur une cible
 * d'un mot il tolère 300 %, sur une cible de quarante il exige la borne au mot
 * près. Le pourcentage rattrape la queue de la distribution, il ne la commande
 * pas — d'où le `Math.max` : **on ne resserre jamais en deçà d'un mot**.
 */
export const CIBLE_LONGUE_MOTS = 20
export const TOLERANCE_CIBLE_LONGUE = 0.15

/** Le début du mot qui précède `i`, blancs franchis. `0` s'il n'y en a pas. */
function versLaGauche(texte: string, i: number, mots: number): number {
  let p = i
  for (let k = 0; k < mots; k++) {
    while (p > 0 && /\s/.test(texte[p - 1])) p--
    while (p > 0 && !/\s/.test(texte[p - 1])) p--
  }
  return p
}

/** La fin du mot qui suit `i`, blancs franchis. `texte.length` s'il n'y en a pas. */
function versLaDroite(texte: string, i: number, mots: number): number {
  let p = i
  for (let k = 0; k < mots; k++) {
    while (p < texte.length && /\s/.test(texte[p])) p++
    while (p < texte.length && !/\s/.test(texte[p])) p++
  }
  return p
}

/** Le nombre de mots d'une tranche — la mesure qui décide si la cible est longue. */
function motsDe(texte: string, [d, f]: Intervalle): number {
  const t = texte.slice(d, f).trim()
  return t === '' ? 0 : t.split(/\s+/).length
}

/**
 * ⭐ LES BORNES TOLÉRÉES AUTOUR DE LA CIBLE — un mot de chaque côté, et le
 * pourcentage en second seuil sur les cibles longues.
 *
 * ⚠️ **Le `Math.max` n'est pas une commodité** : sans lui, un pourcentage
 * calculé sur une cible courte rendrait une tolérance PLUS PETITE qu'un mot, et
 * on retomberait exactement dans le défaut que la règle en mots corrige.
 */
export function bornesTolerees(texte: string, cible: Intervalle): Intervalle {
  const parMots = [versLaGauche(texte, cible[0], UN_MOT),
    versLaDroite(texte, cible[1], UN_MOT)] as const
  if (motsDe(texte, cible) < CIBLE_LONGUE_MOTS) return parMots

  const marge = Math.round((cible[1] - cible[0]) * TOLERANCE_CIBLE_LONGUE)
  return [Math.min(parMots[0], Math.max(0, cible[0] - marge)),
    Math.max(parMots[1], Math.min(texte.length, cible[1] + marge))]
}

// ── LE VERDICT DE LA ZONE ───────────────────────────────────────────────────

/** Les six cas de la table du `02-` §5 — leurs noms sont ceux de la source. */
export type CasDeZone = '1' | '2' | '2prime' | '3' | '4a' | '4b'

export interface VerdictZone {
  cas: CasDeZone
  /**
   * ⚠️ `couverture` N'EST PAS UN VERDICT SUR LA RÉPONSE : c'est le seul cas où
   * la zone déclenche un second test (`02-` §5). L'élève peut avoir raison.
   */
  verdict: 'faux' | 'juste' | 'probablement_faux' | 'a_voir' | 'couverture'
  /** ⛔ Faux au seul cas 1 — « le jugement se règle sans rien lire ». */
  litLeTexte: boolean
}

/**
 * ⭐⭐ LA ZONE, FACE À LA CIBLE — la table du `02-` §5, et rien de plus.
 *
 * ⚠️ **L'ORDRE DES TESTS EST LA TABLE ELLE-MÊME.** L'égalité se reconnaît avant
 * l'inclusion — sans quoi le cas 3 tomberait en cas 2 —, et le débordement
 * toléré avant le débordement de couverture.
 *
 * ⛔ **CETTE FONCTION EXIGE UNE CIBLE.** Sur une absence (`cibleDansLeMateriau`
 * rend `null`), il n'y a rien à comparer et l'appeler compterait faux un élève
 * qui a raison : la bascule se lit AVANT, et le type l'impose.
 *
 * @param zone la sélection de l'élève. Une zone **vide** (`f <= d`) est traitée
 *   comme le cas 1 : ne rien désigner, c'est ne pas désigner la cible.
 */
export function verdictDeLaZone(
  texte: string, cible: Intervalle, zone: Intervalle,
): VerdictZone {
  const [zd, zf] = [Math.max(0, zone[0]), Math.min(texte.length, zone[1])]
  const [cd, cf] = cible

  // Cas 1 — elle ne touche pas la cible. Une zone vide en fait partie.
  if (zf <= zd || zf <= cd || zd >= cf) {
    return { cas: '1', verdict: 'faux', litLeTexte: false }
  }
  // Cas 3 — elle EST la cible.
  if (zd === cd && zf === cf) return { cas: '3', verdict: 'juste', litLeTexte: true }

  // Elle contient la cible : reste à savoir si le débordement est toléré.
  if (zd <= cd && zf >= cf) {
    const [td, tf] = bornesTolerees(texte, cible)
    return zd >= td && zf <= tf
      ? { cas: '2', verdict: 'juste', litLeTexte: true }
      : { cas: '2prime', verdict: 'couverture', litLeTexte: true }
  }
  // Cas 4b — incluse dans la cible, plus courte.
  if (zd >= cd && zf <= cf) return { cas: '4b', verdict: 'a_voir', litLeTexte: true }

  // Cas 4a — elle chevauche : une part de la cible, et du texte en dehors.
  return { cas: '4a', verdict: 'probablement_faux', litLeTexte: true }
}

// ── LE SURLIGNAGE DE COUVERTURE ─────────────────────────────────────────────

/**
 * ⭐⭐ « QUE LE PETIT MALIN ENVOIE UN SIGNAL » — Louis, 27/08 — ET IL FAUT LES
 * TROIS CONDITIONS.
 *
 * *« Le petit malin qui surligne presque tout le texte juste pour espérer
 * trouver, et qui écrit un truc flou pour essayer d'avoir raison. »*
 *   1. une zone au-delà de la tolérance — le cas **2′** ;
 *   2. une justification **qui ne nomme rien de précis** ;
 *   3. une **crédence haute**.
 *
 * ⛔⛔ **SANS LA TROISIÈME, ON PUNIRAIT L'HONNÊTETÉ.** Une zone large déclarée
 * avec une crédence BASSE est un élève qui dit « je ne suis pas sûr, je
 * ratisse » — et il a raison de le dire.
 *
 * ⚠️⚠️ **LA DEUXIÈME CONDITION N'EST PAS ALGORITHMIQUE, ET CE MODULE NE LA
 * FABRIQUE PAS.** Aux crans 4, 7 et 9 le jugement est **IA** (`02-` §2.2) :
 * « une justification qui ne nomme rien de précis » est un jugement sur le
 * texte, pas une mesure sur des bornes. Elle entre donc ici **en paramètre**,
 * et cette fonction rend `null` tant qu'elle n'est pas connue — *un `null` est
 * « on ne sait pas encore », jamais « ce n'est pas un petit malin ».* C'est la
 * même discipline que le troisième état des signaux du faisceau.
 *
 * ⛔ **ET CE QUI EN SORT NE PASSE PAS PAR LE FAISCEAU** (`02-` §5, décision de
 * Louis du 28/08) : ni huitième signal, ni entrée du cinquième — celui-ci se
 * glose au `06-` §6 par « un texte excellent, et un élève incapable de dire
 * pourquoi », c'est le **sous-confiant**, et le petit malin est **l'exact pôle
 * opposé**. Le canal est le signalement direct, sans strike, que le professeur
 * confirme.
 */
export function couvertureSuspecte(
  verdict: VerdictZone,
  justificationNommeQuelqueChose: boolean | null,
  credenceHaute: boolean | null,
): boolean | null {
  if (verdict.cas !== '2prime') return false
  if (justificationNommeQuelqueChose === null || credenceHaute === null) return null
  return !justificationNommeQuelqueChose && credenceHaute
}

/**
 * ⭐ LA CRÉDENCE « HAUTE », AUX TROIS CRANS QUI DÉSIGNENT.
 *
 * Ils servent un **pourcentage unique** sur la propre réponse de l'élève
 * (`02-` §5) : le seuil se lit donc sur ce pourcentage, et sur rien d'autre.
 *
 * ⚠️ **PROVISOIRE, comme les deux seuils de tolérance** — il vit ici et ici
 * seulement. *Un élève qui se déclare sûr à 70 % sur une zone qui couvre tout
 * le matériau dit déjà quelque chose ; le chiffre exact se règle sur copies.*
 */
export const CREDENCE_HAUTE_SEUIL = 70

export function credenceEstHaute(pourcentage: number | null | undefined): boolean | null {
  return typeof pourcentage === 'number' ? pourcentage >= CREDENCE_HAUTE_SEUIL : null
}
