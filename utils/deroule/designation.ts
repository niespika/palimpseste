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

/** Les sept cas de la table du `02-` §5 — leurs noms sont ceux de la source. */
export type CasDeZone = '0' | '1' | '2' | '2prime' | '3' | '4a' | '4b'

export interface VerdictZone {
  cas: CasDeZone
  /**
   * ⚠️ `mal_bornee` N'EST PAS UN VERDICT SUR LA RÉPONSE : la zone déborde, et
   * c'est le texte qui tranche. ⛔ `ratissage`, lui, EN EST UN — et c'est le
   * seul que la zone rende seule.
   */
  verdict: 'faux' | 'juste' | 'probablement_faux' | 'a_voir' | 'mal_bornee' | 'ratissage'
  /**
   * ⛔⛔ FAUX AUX DEUX CAS QUI FERMENT LA PORTE AVANT L'IA — et ils ne sont pas
   * de même nature. Le **cas 1** est une réponse FAUSSE : « le jugement se règle
   * sans rien lire », et rien d'autre ne s'ensuit. Le **cas 0** est une
   * NON-RÉPONSE : l'exercice est non fait, et le professeur reçoit un signal.
   * *Les confondre punirait l'élève qui s'est simplement trompé d'endroit.*
   */
  litLeTexte: boolean
  /**
   * ⭐ L'EXERCICE EST-IL NON FAIT ? Vrai au seul cas 0. *« Surligner tout n'est
   * pas une mauvaise réponse : c'est une absence de réponse, et une absence de
   * réponse ne se fait pas juger — elle se constate »* (Louis, 28/08).
   */
  nonFait: boolean
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

  // ⛔⛔ CAS 0 — LE RATISSAGE, ET IL SE LIT EN PREMIER. Il ne dépend pas de la
  //    position de la zone par rapport à la cible : une zone qui couvre le
  //    matériau le couvre, qu'elle contienne la cible ou non. Le lire après
  //    l'inclusion le ferait manquer sur une zone qui rate la cible tout en
  //    prenant tout le reste.
  if (estUnRatissage(texte, cible, [zd, zf])) {
    return { cas: '0', verdict: 'ratissage', litLeTexte: false, nonFait: true }
  }
  // Cas 1 — elle ne touche pas la cible. Une zone vide en fait partie.
  if (zf <= zd || zf <= cd || zd >= cf) {
    return { cas: '1', verdict: 'faux', litLeTexte: false, nonFait: false }
  }
  // Cas 3 — elle EST la cible.
  if (zd === cd && zf === cf) {
    return { cas: '3', verdict: 'juste', litLeTexte: true, nonFait: false }
  }
  // Elle contient la cible : reste à savoir si le débordement est toléré.
  if (zd <= cd && zf >= cf) {
    const [td, tf] = bornesTolerees(texte, cible)
    return zd >= td && zf <= tf
      ? { cas: '2', verdict: 'juste', litLeTexte: true, nonFait: false }
      : { cas: '2prime', verdict: 'mal_bornee', litLeTexte: true, nonFait: false }
  }
  // Cas 4b — incluse dans la cible, plus courte.
  if (zd >= cd && zf <= cf) {
    return { cas: '4b', verdict: 'a_voir', litLeTexte: true, nonFait: false }
  }
  // Cas 4a — elle chevauche : une part de la cible, et du texte en dehors.
  return { cas: '4a', verdict: 'probablement_faux', litLeTexte: true, nonFait: false }
}

// ── LE RATISSAGE ────────────────────────────────────────────────────────────

/**
 * ⛔⛔ LA BARRE DU RATISSAGE — **70 % du matériau ET 4 fois la cible**
 * *(décision de Louis, 28/08)*. ⚠️ **PROVISOIRES comme les autres seuils**, et
 * ici et ici seulement.
 *
 * ⭐⭐ **IL FAUT LES DEUX TERMES, ET LA MESURE L'IMPOSE — aucun ne tient seul.**
 *   · **La part du matériau seule accuserait des élèves parfaits** : sur les
 *     290 cibles de la banque du 28/08, **six couvrent déjà 90 à 100 % de leur
 *     matériau** — la bonne réponse y EST de tout surligner.
 *   · **Le rapport à la cible seul laisserait passer un quart des cas** : à
 *     quatre fois, **72 cas sur 290 ne peuvent pas l'atteindre**, même en
 *     surlignant tout, parce que la cible occupe déjà une grande part d'un
 *     matériau court.
 *
 * **La conjonction protège les deux bords** : là où la cible est déjà large on
 * ne peut pas ratisser, et là où le matériau est court il n'y a rien d'autre à
 * prendre. *218 cas sur 290 peuvent la déclencher.*
 */
export const RATISSAGE_PART_MATERIAU = 0.70
export const RATISSAGE_FOIS_LA_CIBLE = 4

/**
 * ⭐ « TOUT OU PRESQUE TOUT » — le seul verdict que la zone rende SEULE.
 *
 * ⛔⛔ **ET C'EST TOUT L'INTÉRÊT : IL NE COÛTE PAS UN APPEL D'IA.** *« Je ne
 * vais pas gaspiller des crédits pour un élève qui veut tricher »* — Louis,
 * 28/08. **Surligner tout n'est pas une mauvaise réponse : c'est une ABSENCE de
 * réponse**, et une absence de réponse ne se fait pas juger, elle se constate.
 *
 * ⚠️⚠️ **LA CRÉDENCE N'ENTRE PAS ICI, ET C'EST UN RENVERSEMENT.** Une première
 * rédaction en faisait une condition — « une zone large déclarée avec une
 * crédence basse est un élève qui dit : je ne suis pas sûr, je ratisse ».
 * ⭐ **L'argument tombe avec le relèvement de la barre** : on ne peut pas être
 * honnêtement incertain d'une NON-RÉPONSE. La crédence accompagne désormais les
 * cas que l'IA lit, et voyage dans le motif du signal — **information, plus
 * condition**.
 */
export function estUnRatissage(texte: string, cible: Intervalle, zone: Intervalle): boolean {
  const large = zone[1] - zone[0]
  if (large <= 0 || !texte.length) return false
  const cibleLarge = cible[1] - cible[0]
  if (cibleLarge <= 0) return false
  return large >= RATISSAGE_PART_MATERIAU * texte.length
    && large >= RATISSAGE_FOIS_LA_CIBLE * cibleLarge
}

/**
 * ⭐ LA CRÉDENCE « HAUTE », AUX TROIS CRANS QUI DÉSIGNENT.
 *
 * Ils servent un **pourcentage unique** sur la propre réponse de l'élève
 * (`02-` §5) : le seuil se lit donc sur ce pourcentage, et sur rien d'autre.
 *
 * ⚠️⚠️ **CE N'EST PLUS UNE CONDITION DE QUOI QUE CE SOIT — c'est une
 * INFORMATION.** Elle accompagne les cas que l'IA lit (2, 2′, 4a, 4b) et voyage
 * dans le motif du signalement, **pour que le professeur tranche d'un coup
 * d'œil** : « zone qui déborde, crédence 92 % » et « zone qui déborde, crédence
 * 15 % » ne se confirment pas de la même façon. *Le ratissage, lui, se voit
 * sans elle.*
 *
 * ⚠️ **PROVISOIRE, comme les seuils de tolérance** — il vit ici et ici seulement.
 */
export const CREDENCE_HAUTE_SEUIL = 70

export function credenceEstHaute(pourcentage: number | null | undefined): boolean | null {
  return typeof pourcentage === 'number' ? pourcentage >= CREDENCE_HAUTE_SEUIL : null
}
