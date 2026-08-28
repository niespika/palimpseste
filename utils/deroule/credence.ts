// ============================================================================
// C4 · L3 — LA CRÉDENCE : le quatrième geste, celui qui n'est pas à la remise.
// Module PUR.
// ----------------------------------------------------------------------------
// « Elle se déclare PENDANT l'exercice, AVANT QUE L'ÉLÈVE SACHE S'IL A RAISON,
//   aux SIX CRANS de diagnostiquer et de transformer, SANS CONDITION
//   d'`evaluee` ni de lieu » (`06-` §3 ; `02-` §5 ; la fiche §6, flux 4) —
//   « la vérité y est portée par le défaut injecté, non par un squelette
//   bancé ». UNE PAR DIAGNOSTIC, donc DEUX SUR UNE PAIRE (`07-` §1.2).
//
// SA FORME SUIT LE CRAN, et le `02-` §5 est exact :
//   · aux DEUX CRANS GUIDÉS — `diagnostic_guide` et `transformation_guidee` —,
//     l'écran sert QUATRE CANDIDATS (trois distracteurs tirés de la banque,
//     plus la `reponse_attendue`) et l'élève RÉPARTIT DES JETONS SUR 100 ;
//   · aux QUATRE AUTRES CRANS QUI ISOLENT — `diagnostic_nomme`,
//     `transformation_nommee`, `transformation_aveugle`, `diagnostic_fin` —,
//     l'écran NE SERT AUCUN CANDIDAT : l'élève répond, puis donne UN
//     POURCENTAGE UNIQUE sur sa propre réponse.
//
// ⭐ DÉCISION DE LOUIS — LE MÊLAGE DES CANDIDATS EST À CE LOT (piège 37).
//    `composerApercu` compose `[...tirerTrois(banque), reponseAttendue]` : la
//    bonne réponse n'est JAMAIS mêlée, elle tombe en dernière position à tous
//    les coups — constaté à l'écran. **L'aperçu du professeur reste tel quel** :
//    son tirage est DÉLIBÉRÉMENT déterministe, pour qu'un rechargement ne change
//    pas ce qu'il relit (piège 38 : on ne réécrit pas l'aperçu). **Le tirage
//    RÉEL DE LA PASSATION vit ici, et c'est lui qui doit mêler** — sans quoi un
//    élève apprend que la dernière est la bonne.
//
// ⚠️ LE MÊLAGE EST MÊLÉ, MAIS IL EST STABLE. Il est semé sur (dépôt × cas) :
//    un rechargement rend le MÊME ordre — sinon les jetons déjà posés ne
//    voudraient plus rien dire, et l'`index_correct` journalisé désignerait un
//    autre candidat. Ce qui varie d'un exercice à l'autre, c'est la POSITION de
//    la bonne réponse ; ce qui ne varie pas, c'est l'ordre à l'intérieur d'un
//    même cas.
//
// ⛔⛔ ET LE TIRAGE N'EST PAS AVEUGLE : IL ENCADRE LA RÉPONSE (`02-` §5).
//    « L'instance y tire » ne disait pas COMMENT, et un tirage au hasard rend
//    l'exercice **répondable sans lecture** : sur une banque dont la plupart des
//    candidats tombent du même côté, la `reponse_attendue` est la plus longue —
//    ou la plus courte — des QUATRE affichés dans la quasi-totalité des
//    tirages, et l'élève la reconnaît à sa taille. ⭐ **La mesure juste est
//    P(la réponse soit l'extrême des quatre SERVIS), pas son rapport au
//    vivier** : une réponse honnête à une banque de douze — rapport 1,04 — est
//    la plus longue des quatre dans 75 % des tirages dès que onze distracteurs
//    sur douze sont plus courts qu'elle.
//
// ⛔ LA RÈGLE : parmi les trois distracteurs tirés, **au moins un plus long et
//    au moins un plus court** que la réponse, chaque fois que la banque en porte
//    des deux côtés. *C'est un tirage CONTRAINT, pas un tirage arrangé : rien ne
//    dit lequel des encadrants sort, et le hasard fait tout le reste.*
//
// ⚠️ LÀ OÙ LA BANQUE N'EN PORTE QUE D'UN CÔTÉ, LE TIRAGE NE PEUT RIEN — et il
//    ne se plaint pas : « c'est un défaut de banque, et il se signale à
//    l'import » (`allure_trahit`, côté fabrique). **On sert quand même** :
//    refuser l'écran punirait l'élève d'un défaut de conception.
//
// ⚠️ L'ÉCRAN SAISIT, IL NE CALCULE RIEN : « le Monitoring ne reçoit que
//    l'accord crédence ↔ réussite, calculé EN AVAL » (`07-` §1.4 ; piège 23).
// ============================================================================

import type { CodeCran, FormeCredence, SaisieCredence } from './types'

/** Les deux crans où l'appui est DONNÉ en diagnostic ou en transformation. */
export const CRANS_GUIDES: readonly CodeCran[] = ['diagnostic_guide', 'transformation_guidee']

/** Les quatre autres crans qui isolent — aucun candidat, pourcentage unique. */
export const CRANS_QUI_ISOLENT_SANS_CANDIDAT: readonly CodeCran[] = [
  'diagnostic_nomme', 'transformation_nommee', 'transformation_aveugle', 'diagnostic_fin',
]

/** ⚠️ « TROIS DISTRACTEURS EN BANQUE SONT LE PLANCHER » (`02-` §5). */
export const PLANCHER_DISTRACTEURS = 3

/** Le nombre de candidats servis aux crans guidés — quatre, jamais quinze. */
export const CANDIDATS_SERVIS = 4

export function formeDeLaCredence(cran: CodeCran): FormeCredence | null {
  if (CRANS_GUIDES.includes(cran)) return 'repartition'
  if (CRANS_QUI_ISOLENT_SANS_CANDIDAT.includes(cran)) return 'pourcentage'
  return null   // les trois crans de production : pas de crédence
}

/**
 * ⚠️ LA BANQUE PORTE DEUX FORMES PHYSIQUES INCOMPATIBLES EN BASE, et ce n'est
 *    pas une hypothèse : l'IMPORT écrit des objets `{texte, pourquoi_faux}`
 *    (`08-` §5.2 ; `import-ecriture.ts`), l'ÉCRAN DE CONCEPTION écrit des
 *    chaînes (`app/prof/conception/actions.ts`). On LIT les deux et on ne
 *    normalise rien en base : réécrire la banque d'une instance importée la
 *    détruirait.
 *
 * ⭐ C4-L14 — CE BLOC PORTAIT UNE PHRASE DE PLUS, ET ELLE EST RENVERSÉE.
 *    Elle disait : « `pourquoi_faux` n'est pas servi à l'élève — c'est une note
 *    de conception. » **Personne ne l'avait jamais tranché** : la forme
 *    `candidats: string[]` est née pour l'APERÇU DU PROFESSEUR (C4-L8), elle est
 *    devenue le patron de l'élève par une instruction de réemploi, et le
 *    commentaire l'a justifiée après coup. **La décision inverse est prise le
 *    23/08 :** `pourquoi_faux` **est** servi à l'élève, à la correction, pour le
 *    seul candidat qu'il a le plus chargé (`correction.ts`). La phrase part avec
 *    elle ; le reste de ce bloc reste, et c'est lui qui tient la garde
 *    « on ne normalise rien en base ».
 */
export function texteDuCandidat(brut: unknown): string | null {
  if (typeof brut === 'string') return brut.trim() === '' ? null : brut
  if (brut && typeof brut === 'object') {
    const t = (brut as Record<string, unknown>).texte
    if (typeof t === 'string' && t.trim() !== '') return t
  }
  return null
}

/**
 * ⭐ C4-L14 — LE `pourquoi_faux` D'UN CANDIDAT SERVI, retrouvé PAR SON TEXTE.
 *
 * ⚠️ On entre par le TEXTE, jamais par un index : les `candidats` journalisés
 *    portent ce qui a été réellement affiché, **dans l'ordre réellement mêlé**,
 *    et cet ordre n'est pas celui de la banque — l'écran en sert TROIS quand
 *    elle en porte dix à quinze (`02-` §5). « Le texte retrouve son entrée en
 *    banque » : c'est ce que fait cette fonction, et rien de plus.
 *
 * ⚠️ LES DEUX FORMES PHYSIQUES, ENCORE (voir `texteDuCandidat`). Sur une
 *    instance **conçue en ligne**, un candidat est une CHAÎNE : il n'a pas de
 *    `pourquoi_faux`, et cette fonction rend `null` — l'écran se taira sur la
 *    réfutation **sans se taire sur le `pourquoi_juste`**, qui, lui, existe.
 *    ⛔ On ne normalise toujours rien en base : la normalisation est à C4-L11.
 *
 * @returns le motif, ou `null` — candidat introuvable, forme chaîne, motif vide.
 */
export function pourquoiFauxDuCandidat(brutBanque: unknown, texteServi: string): string | null {
  if (!Array.isArray(brutBanque)) return null
  for (const x of brutBanque) {
    if (texteDuCandidat(x) !== texteServi) continue
    if (!x || typeof x !== 'object') return null
    const pf = (x as Record<string, unknown>).pourquoi_faux
    return typeof pf === 'string' && pf.trim() !== '' ? pf : null
  }
  return null
}

export function lireLaBanque(brut: unknown): string[] {
  if (!Array.isArray(brut)) return []
  const out: string[] = []
  for (const x of brut) {
    const t = texteDuCandidat(x)
    if (t !== null) out.push(t)
  }
  return out
}

/**
 * Un générateur déterministe semé sur une chaîne. Même patron que
 * `conception.ts:tirerTrois` — hachage base 31, puis LCG type `glibc` — parce
 * qu'un second générateur qui se comporterait autrement rendrait les deux voies
 * incomparables au débogage.
 */
function graine(semence: string): () => number {
  let h = 0
  for (let i = 0; i < semence.length; i++) h = (h * 31 + semence.charCodeAt(i)) >>> 0
  return () => { h = (h * 1103515245 + 12345) >>> 0; return h }
}

/** Un Fisher-Yates semé : il mêle VRAIMENT, et il rend le même ordre deux fois. */
export function melerAvecGraine<T>(items: readonly T[], semence: string): T[] {
  const out = [...items]
  const suivant = graine(semence)
  for (let i = out.length - 1; i > 0; i--) {
    const j = suivant() % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * ⭐⭐ LES TROIS DISTRACTEURS, TIRÉS DE FAÇON À ENCADRER LA RÉPONSE (`02-` §5).
 * Port de `tirageEncadrant` (`generateur/web/index.html`), qui est la
 * spécification exécutable de la règle : elle est écrite, et elle est jouée.
 *
 * ⭐ **On prend d'abord UN plus court et UN plus long**, chacun au hasard parmi
 * les siens, puis on complète au hasard dans tout le reste, puis on mêle. *Ce
 * qui est contraint, c'est qu'il y ait un encadrant de chaque côté ; LEQUEL
 * sort ne l'est pas.*
 *
 * ⚠️ **ON TIRE SUR LES RANGS, PAS SUR LES TEXTES.** Une banque peut porter deux
 * fois la même chaîne — rien ne l'interdit —, et un tirage par texte en
 * perdrait un exemplaire en silence.
 *
 * ⚠️ **CHAQUE SOUS-TIRAGE A SA PROPRE SEMENCE.** Le mêlage de ce module est
 * « mêlé mais STABLE » : un rechargement doit rendre le même écran, sans quoi
 * les jetons déjà posés ne voudraient plus rien dire. Trois semences dérivées
 * d'une seule gardent cette promesse tout en évitant que les trois listes se
 * mêlent de la même manière.
 *
 * ⛔ **LA LONGUEUR SE COMPTE EN CARACTÈRES**, comme la fabrique et comme
 * `allure_trahit` : c'est l'allure à l'écran qui trahit, pas un compte de mots.
 *
 * @param banque   les candidats lisibles, dans l'ordre de la base.
 * @param attendue la `reponse_attendue`, déjà écartée du vide par l'appelant.
 * @param semence  le dépôt × cas — stable au rechargement.
 */
export function tirageEncadrant(
  banque: readonly string[], attendue: string, semence: string,
): string[] {
  const n = attendue.length
  const rangs = banque.map((_, i) => i)
  const courts = melerAvecGraine(rangs.filter((i) => banque[i].length < n), `${semence}|courts`)
  const longs = melerAvecGraine(rangs.filter((i) => banque[i].length > n), `${semence}|longs`)

  const pris: number[] = []
  if (courts.length) pris.push(courts[0])
  if (longs.length) pris.push(longs[0])

  // Le reste au hasard — y compris les candidats de MÊME longueur que la
  // réponse, qui n'encadrent ni d'un côté ni de l'autre mais restent des
  // distracteurs conçus.
  const reste = melerAvecGraine(rangs.filter((i) => !pris.includes(i)), `${semence}|reste`)
  for (const i of reste) {
    if (pris.length >= PLANCHER_DISTRACTEURS) break
    pris.push(i)
  }

  return melerAvecGraine(pris, `${semence}|tirage`)
    .slice(0, PLANCHER_DISTRACTEURS).map((i) => banque[i])
}

/** Ce que l'écran doit servir pour une saisie de crédence. */
export interface OffreCredence {
  forme: FormeCredence
  /**
   * ⚠️ Le patron élève rend `candidats: string[]` — **et JAMAIS LA LIGNE**
   * (piège 39). Vide hors des deux crans guidés.
   */
  candidats: string[]
  /**
   * L'index de la `reponse_attendue` dans `candidats`, APRÈS mêlage. Il part en
   * base avec la saisie sous le nom `index_correct`, que la chaîne lit
   * (`monitoring.ts:lireCredence`) : sans lui, la répartition ne se compare à
   * rien.
   */
  indexAttendue: number | null
  /**
   * ⚠️ « Trois distracteurs en banque sont le plancher ; EN DESSOUS, L'INSTANCE
   * NE PEUT PAS COMPOSER SON ÉCRAN — **signale, ne complète pas** » (piège 23).
   * Non nul = l'écran ne sert pas la crédence, et le professeur en est averti.
   */
  empechement: string | null
}

/**
 * ⭐ CE QUE L'ÉCRAN SERT POUR UNE SAISIE DE CRÉDENCE.
 *
 * @param cran     le cran de l'instance.
 * @param cas      le rang du cas : 1, ou 2 sur le second cas d'une paire.
 * @param depotId  la semence du mêlage, avec `cas` — stable au rechargement.
 * @param appui    la banque et la réponse attendue, telles que `exercices_cas`
 *                 les porte pour CE cas.
 */
export function offreDeCredence(
  cran: CodeCran,
  cas: number,
  depotId: string,
  appui: { distracteurs: unknown; reponseAttendue: string | null },
): OffreCredence {
  const forme = formeDeLaCredence(cran)
  if (forme === null) {
    return { forme: 'pourcentage', candidats: [], indexAttendue: null,
      empechement: `le cran ${cran} ne demande aucune crédence : elle se collecte aux six `
        + 'crans de diagnostiquer et de transformer, et à eux seuls' }
  }

  // Les quatre crans qui isolent sans candidat : l'élève donne un pourcentage
  // unique sur SA propre réponse. Rien n'est tiré d'aucune banque.
  if (forme === 'pourcentage') {
    return { forme, candidats: [], indexAttendue: null, empechement: null }
  }

  const banque = lireLaBanque(appui.distracteurs)
  const attendue = (appui.reponseAttendue ?? '').trim()

  if (attendue === '') {
    return { forme, candidats: [], indexAttendue: null,
      empechement: `cran ${cran} : la \`reponse_attendue\` manque. L'écran sert QUATRE `
        + 'candidats dont elle est le quatrième — sans elle, la répartition ne se compare '
        + 'à rien. On signale, on ne complète pas.' }
  }
  if (banque.length < PLANCHER_DISTRACTEURS) {
    return { forme, candidats: [], indexAttendue: null,
      empechement: `cran ${cran} : la banque porte ${banque.length} distracteur(s) lisible(s), `
        + `et le plancher est ${PLANCHER_DISTRACTEURS} (\`02-\` §5). L'instance ne peut pas `
        + 'composer son écran. **Signale, ne complète pas** — un distracteur fabriqué à la '
        + 'volée n\'a pas été conçu, et la crédence porterait sur autre chose.' }
  }

  // Le TIRAGE : trois distracteurs parmi la banque (« elle n'en affiche jamais
  // quinze »), puis la réponse attendue, PUIS LE MÊLAGE DES QUATRE.
  // ⛔ Le tirage ENCADRE la réponse — il ne mêle plus la banque pour en prendre
  //    les trois premiers. Voir `tirageEncadrant` et l'en-tête : le mêlage
  //    protégeait du « la dernière est la bonne », il ne protégeait pas du
  //    « la plus longue est la bonne ».
  const semence = `${depotId}|${cas}`
  const trois = tirageEncadrant(banque, attendue, semence)
  const candidats = melerAvecGraine([...trois, attendue], `${semence}|melange`)

  return { forme, candidats, indexAttendue: candidats.indexOf(attendue), empechement: null }
}

/**
 * La saisie, mise à la forme que la chaîne LIT (`monitoring.ts:lireCredence`).
 *
 * ⚠️ Les clés `jetons` / `index_correct` et `pourcentage` / `reussi` sont un
 *    CONTRAT avec C4-L5 : les renommer romprait la porte 2 en silence, puisque
 *    `lireCredence` rend `null` sur une forme qu'elle ne reconnaît pas — et un
 *    `null` y est simplement « pas d'accord à verser », jamais une erreur.
 *
 * ⚠️ `reussi` N'EST PAS ÉCRIT ICI, et c'est délibéré : aux quatre crans sans
 *    candidat, la justesse de la réponse libre de l'élève est un JUGEMENT (IA
 *    aux crans nommés, aveugle et fin — `02-` §2.3.4), et « l'écran saisit, il
 *    ne calcule rien ». Aux deux crans guidés, le jugement est ALGORITHMIQUE et
 *    n'a besoin de rien de plus : « le candidat le plus chargé EST la réponse »
 *    (la fiche §2) — la chaîne le relit des `jetons` et de l'`index_correct`.
 */
export function saisieARegistrer(
  cas: number,
  offre: OffreCredence,
  saisie: { jetons?: number[]; pourcentage?: number },
  maintenant: string,
): { valeur: Record<string, unknown> | null; refus: string | null } {
  if (offre.empechement) return { valeur: null, refus: offre.empechement }

  if (offre.forme === 'repartition') {
    const j = saisie.jetons
    if (!Array.isArray(j) || j.length !== CANDIDATS_SERVIS) {
      return { valeur: null, refus: `La répartition demande ${CANDIDATS_SERVIS} jetons, `
        + `un par candidat servi — reçu ${Array.isArray(j) ? j.length : 'aucun'}.` }
    }
    if (j.some((x) => !Number.isInteger(x) || x < 0 || x > 100)) {
      return { valeur: null, refus: 'Chaque part est un entier de 0 à 100.' }
    }
    if (j.reduce((a, b) => a + b, 0) !== 100) {
      return { valeur: null, refus: 'Les jetons se répartissent SUR 100 : leur somme fait 100.' }
    }
    if (offre.indexAttendue === null || offre.indexAttendue < 0) {
      return { valeur: null, refus: 'La réponse attendue n\'est pas parmi les candidats servis : '
        + 'la répartition ne se comparerait à rien.' }
    }
    const valeur: SaisieCredence & Record<string, unknown> = {
      cas, forme: 'repartition',
      jetons: [j[0], j[1], j[2], j[3]],
      // ⚠️ `choix` NE BOUGE PAS, et c'est délibéré : il part en base et la chaîne
      //    le relit. Sur une ÉGALITÉ il rend 0, qui ne désigne alors personne —
      //    et cette question-là ne se règle pas ici : la règle de l'égalité est
      //    une règle DE L'ÉCRAN DE CORRECTION, et elle vit à
      //    `correction.ts:leCandidatLePlusCharge` (C4-L14).
      choix: j.indexOf(Math.max(...j)),
      at: maintenant,
      // Les deux clés que la chaîne LIT, plus la trace de ce qui a été servi :
      // sans les candidats, un `index_correct` ne désigne plus rien de relisible.
      index_correct: offre.indexAttendue,
      candidats: offre.candidats,
    }
    return { valeur, refus: null }
  }

  const p = saisie.pourcentage
  if (typeof p !== 'number' || !Number.isInteger(p) || p < 0 || p > 100) {
    return { valeur: null, refus: 'La sûreté est un entier de 0 à 100.' }
  }
  const valeur: SaisieCredence & Record<string, unknown> = {
    cas, forme: 'pourcentage', pourcentage: p, at: maintenant,
  }
  return { valeur, refus: null }
}

/**
 * Combien de crédences ce déroulé attend — « une par diagnostic, DEUX SUR UNE
 * PAIRE » (`07-` §1.2 ; `02-` §2.3.1 a).
 */
export function credencesAttendues(cran: CodeCran, nombreDeCas: 1 | 2): number {
  return formeDeLaCredence(cran) === null ? 0 : nombreDeCas
}
