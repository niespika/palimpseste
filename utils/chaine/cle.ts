// ============================================================================
// C7 · L8 — « LA CHAÎNE À L'HEURE DE LA CLÉ » : LA PART PURE, donc éprouvable.
// ----------------------------------------------------------------------------
// ⛔ CE FICHIER N'IMPORTE RIEN DE `chaine.ts` NI DE `contexte.ts` (`server-only`),
//    et c'est tout son intérêt : ce qui est ici se prouve sous `npm test`.
//
// Ce que le lot construit, et rien d'autre (décisions de Louis, 06/09) :
//   (1) la production envoyée à la chaîne est ce que l'élève a écrit — et la
//       chaîne SIGNALE une v1 qui reproduit le devoir (`signalDeRecopie`) ;
//   (2) sur un exercice qui isole avec une clé, la chaîne ne mesure QUE LA
//       COMPÉTENCE DE L'OBSERVABLE DE LA CLÉ — ni toutes les compétences, ni les
//       sondes de la décision (« à l'exception des crans 6 et 8, ça n'a plus
//       aucun sens ») —, la mesure ne GARDE que cet observable (les autres codes
//       passent à `n/a`, qui « n'est jamais 0 » : ils sortent du dénominateur),
//       et le retour ne parle que de lui (`competencesFroidesDe`,
//       `restreindreLesObservables`) ;
//   (3) le « se juger » n'interroge que cette compétence, l'observable de la
//       clé EN TÊTE (`mettreEnTete`) ;
//   (4) une citation présente dans le matériau ET dans la copie s'écarte, sauf
//       sur le passage à corriger (`retour.ts`, `elaguerLesAncrages`).
//
// ⭐ Ce qui distingue « un exercice qui isole avec une clé » d'un autre, c'est
//    `exercices_cas.probleme` (non nul ⇒ gabarit 1.5), jamais le cran ni la
//    porte : un cran 5 de la banque 1.4 isole SANS clé, et rien d'ici ne le
//    touche. L'observable d'une clé se lit dans la doctrine DÉRIVÉE
//    (`exercices_problemes.observable_code` / `observable_competence`), jamais
//    dans le `09-`.
// ⛔ Tout passe par UNE porte, `chaine_cle_actif` (`porte-cle.ts`) : fermée,
//    chaque fonction d'ici rend ce qu'elle rendait hier — et les tests le prouvent.
// ============================================================================
import { citationTient } from './citation-verifiee'
import { NA, type Observables } from './observables'
import type { Competence, Version } from './types'

/** La clé du cas, et ce que la doctrine dérivée en dit. */
export interface CleDuCas {
  /** `exercices_cas.probleme` — la clé `objet.constituant.variante`. */
  cle: string
  /** `exercices_problemes.observable_code` — `null` sur 19 clés du `09-` sur 205. */
  observableCode: string | null
  observableCompetence: Competence | null
  /** Faux sur les cases ⚠️ du `09-` §14 : « la mesure n'existera pas tant que le routage n'a pas bougé ». */
  observableRoute: boolean
  /**
   * Comment la clé a été lue. ⚠️ `illisible` n'est JAMAIS « isole avec une clé » :
   * « dans le doute, on mesure large » — supabase-js ne lève pas.
   */
  lecture: 'ok' | 'sans_observable' | 'absente_de_la_doctrine' | 'illisible'
}

/** L'observable que la clé isole — ce que la chaîne mesure, ce dont le retour parle. */
export interface ObservableDeLaCle {
  cle: string
  code: string
  competence: Competence
}

/**
 * ⭐⭐ LA PORTE, ET LA CLÉ — le seul endroit qui décide « ce dépôt isole avec une
 *    clé, et le lot s'applique ». `null` dans TOUS les autres cas : porte fermée,
 *    pas de clé (banque 1.4, crans de production), clé sans observable routé,
 *    lecture ratée. Chaque appelant lit ce `null` comme « la chaîne d'hier ».
 */
export function observableDeLaCle(
  ctx: { chaineCleActif: boolean; cle: CleDuCas | null },
): ObservableDeLaCle | null {
  if (!ctx.chaineCleActif || !ctx.cle) return null
  const c = ctx.cle
  if (c.lecture !== 'ok' || !c.observableRoute || !c.observableCode || !c.observableCompetence) return null
  return { cle: c.cle, code: c.observableCode, competence: c.observableCompetence }
}

/**
 * Ce que la chaîne DIT quand la clé est là mais ne mène à rien — « ne plante pas,
 * n'invente pas un observable » (piège 4). `null` quand tout va bien, ou sans clé.
 */
export function alerteDeLaCle(cle: CleDuCas | null): string | null {
  if (!cle) return null
  switch (cle.lecture) {
    case 'ok':
      if (!cle.observableRoute || !cle.observableCode) {
        return `clé « ${cle.cle} » sans observable routé (\`observable_route\` faux ou code nul) : `
          + 'la chaîne mesure comme hier, le retour n\'est pas borné (C7-L8, piège 4)'
      }
      if (!cle.observableCompetence) {
        return `clé « ${cle.cle} » : observable « ${cle.observableCode} » sans compétence dans la `
          + 'doctrine dérivée — la chaîne mesure comme hier (C7-L8)'
      }
      return null
    case 'sans_observable':
      return `clé « ${cle.cle} » sans observable routé : la chaîne mesure comme hier, le retour `
        + 'n\'est pas borné (C7-L8, piège 4)'
    case 'absente_de_la_doctrine':
      return `clé « ${cle.cle} » absente de la doctrine dérivée (\`exercices_problemes\`) : `
        + 'la chaîne mesure comme hier (C7-L8)'
    case 'illisible':
      return `clé « ${cle.cle} » : \`exercices_problemes\` illisible — une lecture ratée n'est jamais `
        + '« isole avec une clé », la chaîne mesure large (C7-L8, piège 28)'
  }
}

/**
 * ⭐⭐ LA CIBLE, À L'HEURE DE LA CLÉ. « C'est l'observable servi qui est mesuré » :
 *    si la décision dit une autre cible, ALERTE, et la clé l'emporte (piège 10).
 *    Sans clé : la cible d'hier, telle que l'appelant l'a calculée.
 */
export function cibleAvecLaCle(
  observable: ObservableDeLaCle | null,
  cibleDHier: Competence | null,
  decision: { cibleRetenue: string | null } | null,
): { cible: Competence | null; alerte: string | null } {
  if (!observable) return { cible: cibleDHier, alerte: null }
  const declaree = decision?.cibleRetenue ?? null
  const alerte = declaree && declaree !== observable.competence
    ? `la décision du routeur retient « ${declaree} », la clé « ${observable.cle} » isole `
      + `« ${observable.competence} » : la clé l'emporte, c'est l'observable servi qui est mesuré (C7-L8)`
    : null
  return { cible: observable.competence, alerte }
}

/**
 * ⭐⭐ `competencesFroides` — C'EST LA LIGNE (piège 10).
 *
 * Hier : `version === 'v1' ? mesurees : (cible ? [cible] : [])`. Et c'est encore
 * cela sans observable de clé — À L'OCTET.
 *
 * Avec : en v1, la SEULE compétence de l'observable de la clé — les autres
 * compétences que l'instance déclare sont ÉCARTÉES AVEC UN MOTIF SERVI (« un
 * motif servi, jamais un silence »), les sondes de la décision comprises
 * (décision de Louis, 06/09 au soir : aucune sonde secondaire sur un exercice
 * qui isole). ⚠️ `sondesMontee` n'est pas une sonde secondaire : c'est la cible
 * elle-même, marquée M-e — elle reste, puisque c'est la cible qu'on mesure.
 * ⚠️ Si la compétence de la clé n'est pas mesurable (écartée en amont — non
 *    branchée, `differee`, mode non couvert), il n'y a RIEN à mesurer sur
 *    l'observable isolé : la liste est vide, et l'alerte le dit. La clause
 *    granulaire ne change pas ; elle s'applique à une compétence au lieu de six.
 */
export function competencesFroidesDe(a: {
  version: Version
  mesurees: readonly Competence[]
  cible: Competence | null
  observable: ObservableDeLaCle | null
  sondes: readonly string[]
}): { froides: Competence[]; ecartees: Array<{ competence: string; motif: string }>; alertes: string[] } {
  if (a.version !== 'v1') return { froides: a.cible ? [a.cible] : [], ecartees: [], alertes: [] }
  if (!a.observable) return { froides: [...a.mesurees], ecartees: [], alertes: [] }
  const o = a.observable
  const ecartees: Array<{ competence: string; motif: string }> = []
  const alertes: string[] = []
  for (const c of a.mesurees) {
    if (c === o.competence) continue
    const sondee = a.sondes.includes(c)
    ecartees.push({
      competence: c,
      motif: sondee
        ? `sonde de la décision NON mesurée : cet exercice isole l'observable « ${o.code} » de `
          + `${o.competence} (clé « ${o.cle} »), et aucune sonde secondaire n'y a de sens (C7-L8)`
        : `hors de l'observable isolé par la clé « ${o.cle} » : la chaîne ne mesure que `
          + `${o.competence} (C7-L8)`,
    })
  }
  const sondesNonMesurees = a.sondes.filter((s) => s !== o.competence && a.mesurees.includes(s as Competence))
  if (sondesNonMesurees.length) {
    alertes.push(`${sondesNonMesurees.length} sonde(s) de la décision non mesurée(s) sur un exercice qui isole `
      + `— ${sondesNonMesurees.join(', ')} — journalisée(s), non mesurée(s) (C7-L8 ; à C7-L7 de cesser d'en poser là)`)
  }
  if (!a.mesurees.includes(o.competence)) {
    alertes.push(`la compétence de l'observable de la clé — ${o.competence} — n'est pas mesurable sur `
      + 'ce dépôt (écartée en amont, voir son motif) : rien à mesurer sur l\'observable isolé, aucun squelette (C7-L8)')
    return { froides: [], ecartees, alertes }
  }
  return { froides: [o.competence], ecartees, alertes }
}

/**
 * ⭐ PIÈCE (2), forme (a) — Louis, 06/09 au soir : « un seul P1 et un seul P2, sur
 *    la compétence de la clé, et la mesure NE GARDE que l'observable de la clé ».
 *    Les autres codes passent à `n/a` : « `n/a` n'est jamais 0 » — ils sortent du
 *    dénominateur de la fenêtre d'évidence, de l'escalade et de la lettre, ce qui
 *    est exactement « ne pas mesurer ». La forme (b) — restreindre P2 — est un
 *    instrument neuf, hors de ce lot (`IDEES_post_rentree.md`, 06/09).
 * ⚠️ Si le code de la clé n'est PAS parmi les observables de l'instrument, on ne
 *    restreint RIEN (la mesure d'hier), et l'appelant en fait une alerte.
 */
export function restreindreLesObservables(
  observables: Observables, code: string,
): { observables: Observables; retires: string[]; horsInstrument: boolean } {
  if (!(code in observables)) return { observables, retires: [], horsInstrument: true }
  const out: Observables = {}
  const retires: string[] = []
  for (const [k, v] of Object.entries(observables)) {
    if (k === code) { out[k] = v; continue }
    if (v !== NA) retires.push(k)
    out[k] = NA
  }
  return { observables: out, retires, horsInstrument: false }
}

/**
 * ⭐ PIÈCE (3) — l'observable de la clé PASSE EN TÊTE des candidates ; la fragilité
 *    puis le tirage ordonnent le reste (l'ordre reçu est celui de `candidates()`,
 *    on ne le refait pas). Sans cible : l'ordre reçu, à l'identique.
 */
export function mettreEnTete<T extends { competence: string; observable_code: string }>(
  ordonnees: readonly T[], tete: { competence: string; code: string } | null,
): T[] {
  if (!tete) return [...ordonnees]
  const i = ordonnees.findIndex((c) => c.competence === tete.competence && c.observable_code === tete.code)
  if (i < 0) return [...ordonnees]
  return [ordonnees[i], ...ordonnees.slice(0, i), ...ordonnees.slice(i + 1)]
}

/** Les phrases d'un texte, telles que la ponctuation les découpe — au moins `min` mots. */
export function phrasesDe(texte: string, min = 4): string[] {
  return texte.split(/(?<=[.!?…])\s+|\n+/)
    .map((p) => p.trim())
    .filter((p) => p.split(/\s+/).filter(Boolean).length >= min)
}

/**
 * ⭐ PIÈCE (1) — LE SIGNAL : une v1 qui reproduit le devoir. Aux crans de
 *    transformation (3·5·7), on compare la production au matériau du cas —
 *    la longueur, et les phrases du matériau retrouvées TELLES QUELLES
 *    (`citationTient`, le tokeniseur du dépôt, jamais un second).
 * ⛔ Un signal, jamais un refus, jamais un strike : « écarter, jamais refuser »
 *    vaut ici aussi, et le canal d'intégrité n'est pas fait pour un élève qui a
 *    recopié son texte de départ. Le SEUIL se lit sur corpus, pas d'avance : on
 *    journalise le ratio et le compte, et Louis fixe la barre. `null` sans
 *    matériau, ou hors des crans 3·5·7.
 */
export function signalDeRecopie(
  production: string | null | undefined,
  cran: number | null,
  cas: ReadonlyArray<{ ordre: number; materiau: string | null }>,
): string | null {
  if (!production || cran == null || ![3, 5, 7].includes(cran)) return null
  const lignes: string[] = []
  for (const c of cas) {
    if (!c.materiau || !c.materiau.trim()) continue
    const phrases = phrasesDe(c.materiau)
    const retrouvees = phrases.filter((p) => citationTient(production, p)).length
    const ratio = production.length / Math.max(1, c.materiau.length)
    lignes.push(`cas ${c.ordre} : v1 = ${ratio.toFixed(2)} × le matériau ; ${retrouvees} phrase(s) sur `
      + `${phrases.length} du devoir retrouvée(s) telle(s) quelle(s)`)
  }
  if (!lignes.length) return null
  return `recopie du devoir (C7-L8, cran ${cran}) — ${lignes.join(' · ')}`
}

/**
 * ⭐ PIÈCE (4) — « SAUF SUR LE PASSAGE À CORRIGER », un seul domicile pour la zone :
 *    le passage marqué (`marquerLeMateriau`, la règle du `10-` §5 — le passage
 *    fautif étendu aux bornes de sa phrase), sinon le passage que le diff
 *    désigne. ⛔ Aucun diff recalculé ici.
 */
export function passagesACorriger(
  cas: ReadonlyArray<{ passageMarque?: string | null; passageFautif: string | null }>,
): string[] {
  return cas.map((c) => c.passageMarque || c.passageFautif).filter((p): p is string => !!p && p.trim() !== '')
}

/**
 * Le nom d'un observable, en clair — celui de la fiche (`exercices_routes.observable_nom`)
 * quand la couche type le porte, sinon la dimension dite à l'élève, sinon le code.
 * RR4 : c'est pour le PROMPT de Calame ; le retour, lui, ne nomme jamais un code.
 */
export function nomDeLObservable(
  o: { code: string; competence: string },
  servable: ReadonlyArray<{ competence: string; observable_nom: string; observable_code?: string }>,
  correspondance: Readonly<Record<string, ReadonlyArray<{ observable_code: string; dimension_eleve: string }>>>,
): { nom: string; dimension: string | null } {
  const s = servable.find((x) => x.competence === o.competence && x.observable_code === o.code)
  const d = (correspondance[o.competence] ?? []).find((x) => x.observable_code === o.code)?.dimension_eleve ?? null
  return { nom: s?.observable_nom ?? d ?? o.code, dimension: d }
}
