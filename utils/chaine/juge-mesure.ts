// ============================================================================
// C7 · L9 — « SUR UN CRAN QUI ISOLE, LE JUGE EST LA MESURE » : LA PART PURE.
// ----------------------------------------------------------------------------
// ⛔ CE FICHIER N'IMPORTE RIEN DE `chaine.ts` NI DE `contexte.ts` (`server-only`) :
//    ce qui est ici se prouve sous `npm test` (patron `cle.ts`, C7-L8).
//
// Décisions de Louis, séance d'arbitrage du 07/09/2026 (`07-` §2, entrée C7-L9 ;
// `01-` v5.15 §8.2, §8.8, §11 ; `03-` v2.2 §1 ; `10-` v0.13 §6, §7) :
//   (1) aux crans 1·2·3·4·5·7·9 SERVIS PAR LE ROUTEUR, ni P1 ni P2 ne tournent :
//       la mesure est LE VERDICT DU CRAN — celui du juge (C7-L1) aux 2·4·5·7·9,
//       celui de l'algorithme aux 1·3 — converti en valeur extrême de la famille
//       de l'observable isolé (`valeurDuVerdict`, `observables.ts`), `n/a` ailleurs ;
//   (2) la lettre-équivalente est NULLE sur ces mesures ;
//   (3) le poids par cran n'entre que dans le taux (`config.ts`, `POIDS_PAR_CRAN`) ;
//   (4) en vf, le juge rejoue à l'aveugle et `delta_v1_vf` est la différence des
//       deux verdicts, +1 · 0 · −1, NULL sans vf ;
//   (5) Calame reçoit le verdict, la copie, les documents et la dimension — jamais
//       un squelette (`07-` §4 bis).
//
// ⭐ LE PÉRIMÈTRE SE LIT SUR TROIS CHOSES (piège 4) : le cran, le lieu et la
//    forme. Une passation en classe, une ancre, les crans 6·8 : la chaîne d'hier.
//
// ⛔⛔ L'ORIGINE DU DÉPÔT N'EN FAIT PLUS PARTIE — garde retirée le 07/09/2026 au
//    soir, sur mesure, à la demande de Louis.
//    · CE QUE LA DÉCISION DIT VRAIMENT (`RELEVE_Arbitrage_Crans_Isoles_2026-09-07`
//      §142) : « les mesures EN CLASSE, les ANCRES et les crans 6·8 gardent la
//      valeur réelle ». Les trois sont nommés, et les trois ont DÉJÀ leur propre
//      condition ici (`lieu`, `forme`, `CRANS_QUI_ISOLENT`). L'origine n'y était
//      pas : « servis par le routeur » DÉCRIVAIT le corpus du jour — le même
//      relevé note §19 que les 480 dépôts d'alors étaient « tous d'origine
//      `routeur` ». Une observation était devenue une garde.
//    · CE QU'ELLE COÛTAIT : sur les 688 dépôts de crans qui isolent en prod,
//      21 sont `origine = 'prof'` (crans 1·3·4, **tous `lieu: maison`**) — les
//      exercices posés à la main. Ils tournaient sur la chaîne d'hier : P1 et P2
//      en plus du juge, et `sansReussiteAdmise` jamais posé, donc la règle 2
//      exigeait une réussite sur une copie que la chaîne venait de déclarer en
//      défaillance forte. **Le retour était refusé et rien ne le rejouait.**
//      Mesuré sur le dépôt `e7784465` (Élo, cran 4, 07/09) : 4 appels au lieu de
//      2, 0,086 $, un `D` écrit, aucun retour publié.
//    · ET C'EST LE CHEMIN DE RECETTE DE LOUIS : tant que la garde était là, il ne
//      pouvait pas éprouver en production le régime qu'il venait d'arbitrer.
//    ⚠️ Un dépôt hors gabarit reste exclu par les gardes d'AVAL, pas par celle-ci :
//       sans `probleme` sur le cas, `observableDeLaCle` rend `null` (piège 9).
// ⛔ Tout passe par UNE porte, `juge_mesure_actif` (`porte-mesure.ts`) — qui n'a
//    de sens que `juge_documents_actif` ouvert (piège 5) : fermée, chaque
//    fonction d'ici rend « inactif », et la chaîne est celle d'hier à l'octet.
// ============================================================================
import { observableDeLaCle, type CleDuCas, type ObservableDeLaCle } from './cle'
import type { EntreeObservableMesure } from './instruments'
import { NA, statutDeLaMesure, valeurDuVerdict, type Observables, type ValeurObservable } from './observables'
import type { Forme, Lieu } from './types'

/** `07-` §2, C7-L9 — les crans qui isolent, servis par le routeur. Les 6·8 : la chaîne d'hier. */
export const CRANS_QUI_ISOLENT: ReadonlySet<number> = new Set([1, 2, 3, 4, 5, 7, 9])

/** « Il n'y a pas de retour IA, c'est juste de l'algo » (Louis, 24/08) : aux 1·3, personne n'est appelé. */
export const CRANS_SANS_APPEL: ReadonlySet<number> = new Set([1, 3])

export interface RegimeJugeMesure {
  /** Vrai quand le lot s'applique à CE dépôt : le juge est la mesure. */
  actif: boolean
  /** Ce que la chaîne DIT quand la porte est ouverte et que le lot ne s'applique pas. */
  alertes: string[]
  /** L'observable de la clé, tel que le lot le lit — présent quand `actif`. */
  observable: ObservableDeLaCle | null
}

/**
 * ⭐⭐ LA PORTE, ET LE PÉRIMÈTRE — le seul endroit qui décide « ce dépôt est un
 *    cran qui isole servi par le routeur, et le juge en est la mesure ».
 *
 * ⚠️ L'observable de la clé se lit sur `ctx.cle` DIRECTEMENT — `cleDuCas` la lit
 *    quelle que soit `chaine_cle_actif` (`contexte.ts`) — et non par
 *    `observableDeLaCleServie`, qui rend `null` porte C7-L8 fermée : le lot lit
 *    LE SIEN, il ne dérive pas la porte d'un voisin (piège 29). Le code de
 *    l'observable doit être dans `observables_mesure` de l'instrument de sa
 *    compétence — `codesDeLInstrument` — sinon rien ne se convertit (piège 7).
 */
export function regimeJugeMesure(
  ctx: {
    jugeMesureActif: boolean
    jugeDocumentsActif: boolean
    cran: number | null
    lieu: Lieu
    forme: Forme
    cle: CleDuCas | null
  },
  codesDeLInstrument: (competence: string) => readonly string[] | null,
): RegimeJugeMesure {
  const inactif = (...alertes: string[]): RegimeJugeMesure => ({ actif: false, alertes, observable: null })
  if (!ctx.jugeMesureActif) return inactif()
  // Piège 5 — « aucun verdict ne peut exister » sans le juge : la chaîne d'hier, ET une alerte nommée.
  if (!ctx.jugeDocumentsActif) {
    return inactif('`juge_mesure_actif` sans `juge_documents_actif` : rien ne change — le juge est fermé, '
      + 'aucun verdict ne peut exister (C7-L9, piège 5)')
  }
  if (ctx.cran == null || !CRANS_QUI_ISOLENT.has(ctx.cran)) return inactif()
  // ⛔ Pas de garde sur `exercices_depots.origine` : voir l'en-tête du fichier.
  //    Un exercice de maison formatif est le même objet, qu'il ait été tiré par
  //    le routeur ou posé à la main.
  if (ctx.lieu !== 'maison' || ctx.forme !== 'formatif') return inactif()
  // Piège 9 — « sans observable de clé, il n'y a rien à convertir : la chaîne d'hier ».
  const o = observableDeLaCle({ chaineCleActif: true, cle: ctx.cle })
  if (!o) {
    return inactif(ctx.cle
      ? `clé « ${ctx.cle.cle} » sans observable routé (lecture ${ctx.cle.lecture}) : rien à convertir, la mesure d'hier (C7-L9, piège 9)`
      : 'cran qui isole SANS clé (aucun `probleme` sur le cas — la banque 1.4, retirée du routage le 07/09) : rien à convertir, la mesure d\'hier (C7-L9, piège 9)')
  }
  const codes = codesDeLInstrument(o.competence)
  if (!codes) {
    return inactif(`clé « ${o.cle} » : l'instrument de ${o.competence} est absent ou fermé — rien à convertir, la mesure d'hier (C7-L9)`)
  }
  // Piège 7 — les cinq observables du `09-` sans entrée `observables_mesure` :
  // « aucune ligne de mesure, le verdict reste sur `verdicts_cran` ».
  if (!codes.includes(o.code)) {
    return { actif: true, observable: o, alertes: [
      `clé « ${o.cle} » : observable « ${o.code} » de ${o.competence} SANS entrée \`observables_mesure\` — `
      + 'le verdict s\'écrit sur le dépôt seul, AUCUNE ligne de mesure (C7-L9, piège 7 ; 03- §1, DETTES D10)',
    ] }
  }
  return { actif: true, observable: o, alertes: [] }
}

/** Vrai quand l'observable du régime a une entrée `observables_mesure` — donc une mesure à écrire. */
export function observableMesurable(
  regime: RegimeJugeMesure, codesDeLInstrument: (competence: string) => readonly string[] | null,
): boolean {
  if (!regime.actif || !regime.observable) return false
  return (codesDeLInstrument(regime.observable.competence) ?? []).includes(regime.observable.code)
}

/**
 * ⭐ LA MESURE CONVERTIE — ce qui s'écrit dans `competences_mesures.observables` :
 *    le verdict sur le SEUL observable de la clé, `n/a` partout ailleurs, « exactement
 *    comme `restreindreLesObservables` de C7-L8 les met » (piège 7 ; « `n/a` n'est
 *    jamais 0 », `01-` §8.2). Le volet est celui de l'instrument DÉRIVÉ.
 */
export function observablesConvertis(
  volet: Record<string, EntreeObservableMesure>,
  code: string,
  reussi: boolean,
  parametres: Record<string, number | string> = {},
): { observables: Observables; alerte: string | null } {
  const observables: Observables = {}
  for (const k of Object.keys(volet)) observables[k] = NA
  const entree = volet[code]
  if (!entree) {
    return { observables, alerte: `observable « ${code} » absent de l'instrument : rien à convertir` }
  }
  const { valeur, alerte } = valeurDuVerdict(code, entree, reussi, parametres)
  observables[code] = valeur
  return { observables, alerte: alerte ? `${alerte.observable} : ${alerte.motif}` : null }
}

/**
 * ⭐ `01-` §11, amendement du 07/09 — « aux crans qui isolent servis par le routeur,
 *    le delta est la différence des deux VERDICTS du juge : raté puis réussi = +1,
 *    réussi puis raté = −1, sinon 0 ». Sans l'un des deux : NULL — et NULL n'est
 *    pas 0 (`integrite-faisceau.ts`, `deltaFort` en dépendent).
 */
export function deltaDesVerdicts(
  v1: { reussi: boolean } | null | undefined, vf: { reussi: boolean } | null | undefined,
): number | null {
  if (!v1 || !vf) return null
  return Number(vf.reussi) - Number(v1.reussi)
}

/**
 * ⭐ `07-` §4 bis — « l'état antérieur comme UNE SUITE DE VERDICTS » : « raté,
 *    réussi, réussi », jamais « 0, 1, 1 ». Se lit sur la fenêtre d'évidence par
 *    `statutDeLaMesure` — une mesure convertie s'y lit sans cas particulier, et
 *    une mesure d'hier aussi. Les `sans_objet` ne disent rien.
 */
export function suiteDeVerdicts(
  fenetre: ReadonlyArray<{ observables: Record<string, unknown> | null }>,
  code: string,
  entree: EntreeObservableMesure,
  parametres: Record<string, number | string> = {},
): string {
  const mots: string[] = []
  for (const m of fenetre) {
    const s = statutDeLaMesure(m.observables?.[code] as ValeurObservable | undefined, entree, parametres)
    if (s === 'reussie') mots.push('réussi')
    else if (s === 'ratee') mots.push('raté')
  }
  return mots.join(', ')
}

/**
 * Une mesure CONVERTIE se reconnaît à sa lettre nulle SUR un dépôt d'un cran qui
 * isole (piège 16 : « choisis, dis-le ») — c'est le choix fait ici, sans trace de
 * plus : une ancre ou une mesure d'hier porte une lettre, une mesure convertie
 * n'en porte jamais.
 */
export function estUneMesureConvertie(m: { lettre_equivalente: string | null }, cran: number | null): boolean {
  return m.lettre_equivalente === null && cran != null && CRANS_QUI_ISOLENT.has(cran)
}
