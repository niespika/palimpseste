// ============================================================================
// C7 · L1 — LE REGISTRE DES RÉUSSITES. « Une ligne par élève × objet × cran ×
// variante : réussites, échecs, dates. Elle SE DÉRIVE de ce qui existe —
// `competences_mesures`, la crédence de `exercices_metacognition`, le verdict
// de zone — et ne se déclare pas » (`10-Gabarit.md` §7 ; `01-` §3 amendé le
// 03/09). Aucune table neuve : ce module est le dériveur, et il est PUR.
// ----------------------------------------------------------------------------
// « Ce qui compte pour réussi » — la table du `10-` §7 :
//   1(a), 1(b), 3 : la majorité des jetons sur le bon candidat (`index_correct`).
//   4(a), 9, 5, 7 : le juge du cran (`juge-cran.ts`), contre ce qu'on tient pour vrai.
//   4(b)          : la zone est la cible ou la contient dans la tolérance (cas 2, 3, 4b).
//   2             : ⭐ 06/09 — le juge du cran, sur l'objet ASSEMBLÉ, × CONSTITUANT
//                   (`10-` §2 bis.1, §7) : « le registre lit "cran 2 réussi sur
//                   l'objet" sur la pièce JOINT ; les autres pièces s'y inscrivent
//                   à part, sous élève × objet × constituant ». C'est la ligne
//                   élève × objet × 2 × joint qui ouvre le 6.
//   6, 8          : les seuils des observables — ⚠️ NON DÉRIVÉ ICI : c'est le lot
//                   C7-L5 qui le lira au moteur ; ces lignes rendent `null`.
//   toute paire   : LE SECOND CAS est réussi seul ; le premier informe l'escalade.
// « Deux et deux » (décision 19) : deux réussites au cran d'en dessous débloquent
// le cran suivant ; deux échecs au même cran déclenchent les sondes.
// ⭐ C7-L7 (06/09, `10-` §7 amendé ; `01-` §8.10) — « deux et deux » se compte
//    SUR DEUX DEVOIRS DIFFÉRENTS, À UN CYCLE D'ÉCART AU MOINS : deux réussites
//    le même jour sur le même texte n'en sont qu'une ; et les sondes partent
//    DÈS DEUX ÉCHECS, consécutifs ou non — « l'élève ne séjourne pas aux crans
//    de reconnaissance ». Le devoir d'un dépôt est `exercices_cas.materiau_id`,
//    ou la souche de l'`id_import` au cran 2 ; un dépôt sans devoir connu (la
//    banque 1.4) est SON PROPRE devoir — deux textes de la banque 1.4 sont deux
//    textes. Le cycle d'écart se compte comme la quarantaine (`cycles.ts`).
// ⚠️ Les deux nombres « se revoient sur corpus, pas avant » : ils vivent ici.
// ============================================================================
import type { Version } from '../chaine/types'
import { issueDesVerdicts, type VerdictCran } from '../chaine/juge-cran'
import { cyclesEcoules, lundiDe } from '../routeur/cycles'

export type Issue = 'reussi' | 'rate'
export type Variante = 'a' | 'b' | null

export const REUSSITES_POUR_DEBLOQUER = 2
export const ECHECS_POUR_SONDER = 2

/** L'échelle de l'appui, « colonne par colonne du `02-` §2.1 : donné → nommé → absent ». */
export const ECHELLES: ReadonlyArray<readonly [number, number, number]> = [[1, 4, 9], [3, 5, 7], [2, 6, 8]]

/** Ce qu'un dépôt apporte au registre — lu en base, mis à cette forme par le serveur. */
export interface DepotPourLeRegistre {
  depotId: string
  objet: string
  cran: number
  variante: Variante
  /** L'instant qui date le dépôt — la remise de la dernière version. */
  at: string
  verdicts: Partial<Record<Version, VerdictCran>>
  /** Les entrées de la crédence, par cas — telles qu'écrites (`credence.ts`). */
  credence: unknown[]
  /** Le verdict de la porte de zone, par cas — `juste` compte seul (cas 2, 3). */
  zones: Array<{ cas: number; verdict: string | null }>
  /**
   * ⭐ 06/09 — AU CRAN 2 : le constituant que l'élève a écrit
   *    (`exercices_cas.constituant`), et s'il est LE JOINT de la fiche
   *    (`exercices_pieces.piece` sur cet objet). Absents — un lecteur d'avant ce
   *    lot —, la ligne se range sous le constituant « inconnu » et compte comme
   *    le joint : sur la banque du 06/09, la pièce servie EST le joint sur les
   *    38 exercices, et un registre qui ignorerait ces dépôts fermerait le 6 à tort.
   */
  constituant?: string | null
  joint?: boolean
  /**
   * ⭐ C7-L7 — LES DEVOIRS que le dépôt sert (`exercices_cas.materiau_id`, ou la
   *    souche de l'`id_import` au cran 2 — `devoirsDeLInstance`). Absent ou vide
   *    (un lecteur d'avant ce lot, la banque 1.4) : le dépôt est son propre devoir.
   */
  devoirs?: string[]
}

export interface LigneRegistre {
  objet: string
  cran: number
  variante: Variante
  /** ⭐ Cran 2 : le constituant de la ligne ; `null` ailleurs. Facultatif : une ligne d'avant ce lot n'en porte pas. */
  constituant?: string | null
  /** ⭐ Cran 2 : cette ligne est-elle celle du JOINT — celle qui compte pour « cran 2 réussi sur l'objet » ? Absent = oui. */
  joint?: boolean
  reussites: number
  echecs: number
  /** Les issues dans l'ordre du temps — la fin dit la série en cours. */
  serie: Issue[]
  dernierAt: string | null
  /**
   * ⭐ C7-L7 — chaque réussite avec sa date et ses devoirs, pour que « deux et
   *    deux » se compte sur deux devoirs à un cycle d'écart. Facultatif : une
   *    ligne de décor d'avant ce lot n'en porte pas, et compte alors comme hier.
   */
  reussitesDatees?: Array<{ at: string; devoirs: string[] }>
}

// ── L'issue d'un dépôt ───────────────────────────────────────────────────────

function jetonsDuCas(c: unknown): { cas: number; reussi: boolean } | null {
  if (!c || typeof c !== 'object') return null
  const o = c as Record<string, unknown>
  if (!Array.isArray(o.jetons) || typeof o.index_correct !== 'number' || typeof o.cas !== 'number') return null
  const j = o.jetons.map((x) => (typeof x === 'number' ? x : 0))
  const max = Math.max(...j)
  const gagnants = j.filter((x) => x === max).length
  // Une égalité ne désigne personne — comme à l'écran de correction (C4-L14).
  return { cas: o.cas, reussi: gagnants === 1 && j[o.index_correct] === max }
}

/**
 * L'issue d'UN dépôt, cran par cran. `null` quand rien ne permet de trancher —
 * un dépôt sans crédence, un juge qui a manqué, un cran que ce lot ne dérive pas.
 */
export function issueDuDepot(d: DepotPourLeRegistre): Issue | null {
  switch (d.cran) {
    case 1: case 3: {
      const cas = d.credence.map(jetonsDuCas).filter((x): x is { cas: number; reussi: boolean } => !!x)
      if (!cas.length) return null
      // « Toute paire : le second cas est réussi seul. »
      const dernier = cas.reduce((a, b) => (b.cas > a.cas ? b : a))
      return dernier.reussi ? 'reussi' : 'rate'
    }
    case 4: {
      // ⭐⭐ 07/09/2026 — « TOUTE PAIRE : LE SECOND CAS EST RÉUSSI SEUL », la règle
      //    écrite en tête de ce fichier, enfin appliquée. Le second cas d'une
      //    paire de cran 4 est TOUJOURS un 4(b) (`varianteDuCas`), **quelle que
      //    soit la variante de l'EXERCICE** : c'est donc la zone du DERNIER cas
      //    qui score, sur un « a » comme sur un « b ».
      // ⛔ Ce qu'on faisait avant : la garde lisait `d.variante === 'b'`, la
      //    variante de l'exercice — laquelle décrit son PREMIER cas. Sur une
      //    paire 4(a)/4(b) la branche ne s'exécutait donc jamais, la zone du cas
      //    2 était calculée puis JETÉE, et la paire était scorée sur
      //    l'échauffement. *L'écran, lui, montrait le cas 2 : les deux se sont
      //    contredits sur un dépôt réel (`e7784465`, 07/09) — registre `rate`,
      //    écran « Ta réponse est juste ». Décision de Louis le soir même.*
      // ⛔⛔ MAIS SEULEMENT SUR LE GABARIT, et ce n'est pas un détail. L'ancienne
      //    banque (variante NULLE) suit le `02-` §5 — « sélectionne PUIS dis ce
      //    qui cloche » — où le texte compte autant que la zone, et c'est le
      //    juge qui le lit. **Mesuré le 07/09 : 58 des 60 dépôts rendus de
      //    l'ancienne banque portent une zone.** Retirer la garde sans la
      //    remplacer les aurait tous rescorés sur la zone seule.
      if (d.variante !== null) {
        const dernier = [...d.zones].sort((a, b) => a.cas - b.cas).at(-1)
        if (dernier && dernier.verdict !== null) {
          return dernier.verdict === 'juste' ? 'reussi' : 'rate'
        }
        // ⭐ Pas de zone lisible : un dépôt d'AVANT le lot du 07/09, où rien
        //    n'obligeait l'élève à surligner. On retombe sur le juge plutôt que
        //    de rendre `null` — perdre une ligne de registre serait pire que la
        //    scorer sur l'échauffement.
      }
      return issueDesVerdicts(d.verdicts)
    }
    case 2: case 5: case 7: case 9:
      return issueDesVerdicts(d.verdicts)
    default:
      return null
  }
}

// ── Le registre ──────────────────────────────────────────────────────────────

const cle = (objet: string, cran: number, variante: Variante, constituant: string | null) =>
  `${objet}|${cran}|${variante ?? ''}|${constituant ?? ''}`

/** Les lignes d'UN élève, dérivées de ses dépôts. Les dépôts sans issue ne comptent pas. */
export function deriverLeRegistre(depots: readonly DepotPourLeRegistre[]): LigneRegistre[] {
  const lignes = new Map<string, LigneRegistre>()
  const tries = [...depots].sort((a, b) => a.at.localeCompare(b.at))
  for (const d of tries) {
    const issue = issueDuDepot(d)
    if (!issue) continue
    // Le constituant ne range que le cran 2 ; le joint y est vrai sauf dit autrement.
    const constituant = d.cran === 2 ? (d.constituant ?? null) : null
    const joint = d.cran === 2 ? d.joint !== false : true
    const k = cle(d.objet, d.cran, d.variante, constituant)
    const l = lignes.get(k) ?? {
      objet: d.objet, cran: d.cran, variante: d.variante, constituant, joint,
      reussites: 0, echecs: 0, serie: [], dernierAt: null, reussitesDatees: [],
    }
    if (issue === 'reussi') {
      l.reussites += 1
      // Un dépôt sans devoir connu est son propre devoir : deux textes de la
      // banque 1.4 sont deux textes, et on ne ferme pas la porte sur une absence.
      l.reussitesDatees!.push({ at: d.at, devoirs: d.devoirs?.length ? [...d.devoirs] : [d.depotId] })
    } else {
      l.echecs += 1
    }
    l.serie.push(issue)
    l.dernierAt = d.at
    lignes.set(k, l)
  }
  return [...lignes.values()]
}

/**
 * ⭐ C7-L7 — « Deux et deux » sur DEUX DEVOIRS DIFFÉRENTS, À UN CYCLE D'ÉCART AU
 *    MOINS (`10-` §7 amendé le 06/09 ; `01-` §8.10) : « deux réussites le même
 *    jour sur le même texte n'en sont qu'une, et la paire compte déjà pour une ».
 *    Le compte rendu est le nombre de réussites QUI COMPTENT : toutes quand il
 *    existe une paire sur deux devoirs disjoints à un cycle d'écart, UNE sinon
 *    (une réussite existe, elle ne redouble pas). Le cycle se compte en lundis,
 *    comme la quarantaine — jamais en jours.
 */
export function reussitesQuiComptent(
  reussites: ReadonlyArray<{ at: string; devoirs: readonly string[] }>,
): number {
  if (reussites.length < 2) return reussites.length
  for (let i = 0; i < reussites.length; i++) {
    for (let j = i + 1; j < reussites.length; j++) {
      const a = reussites[i]!, b = reussites[j]!
      const memeDevoir = a.devoirs.some((d) => b.devoirs.includes(d))
      if (memeDevoir) continue
      const [tot, tard] = a.at <= b.at ? [a, b] : [b, a]
      if (cyclesEcoules(tot.at, lundiDe(tard.at)) >= 1) return reussites.length
    }
  }
  return 1
}

function reussitesAuCran(registre: readonly LigneRegistre[], objet: string, cran: number): number {
  // Les variantes (a) et (b) d'un cran comptent ensemble ; au cran 2, SEULE la
  // ligne du joint compte pour « cran 2 réussi sur l'objet » (`10-` §2 bis.1).
  const lignes = registre.filter((l) => l.objet === objet && l.cran === cran && l.joint !== false)
  // Une ligne d'avant ce lot (sans dates) compte comme hier : ses réussites, telles quelles.
  if (lignes.some((l) => !l.reussitesDatees)) return lignes.reduce((n, l) => n + l.reussites, 0)
  return reussitesQuiComptent(lignes.flatMap((l) => l.reussitesDatees ?? []))
}

/** ⭐ C7-L7 — un cran est TENU sur un objet quand « deux et deux » y est atteint. */
export function cranTenu(registre: readonly LigneRegistre[], objet: string, cran: number): boolean {
  return reussitesAuCran(registre, objet, cran) >= REUSSITES_POUR_DEBLOQUER
}

/** Le nombre de réussites qui comptent à un cran — pour les motifs en clair. */
export function reussitesCompteesAuCran(registre: readonly LigneRegistre[], objet: string, cran: number): number {
  return reussitesAuCran(registre, objet, cran)
}

/**
 * Les crans DÉBLOQUÉS sur un objet — « un cran ne se sert sur un objet que si le
 * cran d'en dessous, sur le même geste et le même objet, a été réussi deux fois ».
 * Le bas de chaque échelle est toujours ouvert.
 *
 * ⚠️ La règle se lit PAR PAIRE, cran contre le cran d'en dessous — pas comme une
 *    chaîne depuis le bas : un élève qui a réussi deux fois au 4 a le 9 ouvert,
 *    même sans réussite inscrite au 1 (servi avant la porte, ou par le professeur).
 *    Le 4 lui-même n'est alors pas « débloqué » par le registre ; il est déjà
 *    réussi, et le routeur (C7-L5) lit les deux.
 */
export function cransDebloques(registre: readonly LigneRegistre[], objet: string): number[] {
  const out: number[] = []
  for (const echelle of ECHELLES) {
    out.push(echelle[0])
    for (let i = 1; i < echelle.length; i++) {
      // ⭐ C7-L5 — un cran s'ouvre aussi par SES PROPRES deux réussites : ce sont
      //    les sondes de montée réussies (`10-` §7, décision 14) — « le cran d'en
      //    dessous est tenu pour acquis et la porte s'ouvre ».
      if (reussitesAuCran(registre, objet, echelle[i - 1]!) >= REUSSITES_POUR_DEBLOQUER
        || reussitesAuCran(registre, objet, echelle[i]!) >= REUSSITES_POUR_DEBLOQUER) out.push(echelle[i]!)
    }
  }
  return out.sort((a, b) => a - b)
}

/**
 * Les crans où une SONDE DE MONTÉE est due — DEUX ÉCHECS, CONSÉCUTIFS OU NON,
 * sur le même objet et le même cran (`10-` §7, décisions 14 et 19, amendée le
 * 06/09 : « l'élève ne doit pas séjourner aux crans de reconnaissance »). La
 * sonde se sert au cran d'au-dessus de l'échelle ; ce module dit seulement OÙ
 * l'élève stagne. ⭐ C7-L7 : un `filter` sur la série, plus la fin de la série.
 */
export function cransOuLEleveStagne(registre: readonly LigneRegistre[], objet: string): number[] {
  const crans = new Set<number>()
  for (const l of registre) {
    if (l.objet !== objet) continue
    if (l.serie.filter((x) => x === 'rate').length >= ECHECS_POUR_SONDER) crans.add(l.cran)
  }
  return [...crans].sort((a, b) => a - b)
}

/** Le cran d'au-dessus dans l'échelle, ou `null` en haut. */
export function cranSuivant(cran: number): number | null {
  for (const e of ECHELLES) {
    const i = e.indexOf(cran)
    if (i >= 0) return e[i + 1] ?? null
  }
  return null
}
