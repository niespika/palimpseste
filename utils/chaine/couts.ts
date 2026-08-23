// ============================================================================
// C4 · L5 — LES GARDE-FOUS RÉELS DE LA FACTURE.
// ----------------------------------------------------------------------------
// « Les garde-fous réels de la facture : le PLAFOND MENSUEL, l'ALERTE À 70 %, la
//   COUPURE AUTOMATIQUE, le PLAFOND D'APPELS PAR DÉPÔT — les valeurs vivent à la
//   configuration. […] La coupure bascule l'interrupteur DE LA CHAÎNE — le flag
//   propre de ce lot, jamais l'un des trois du §1.5 […] — EN LAISSANT LES DÉPÔTS
//   EN FILE : rien ne se perd, rien ne s'écrit à moitié, le traitement reprend à
//   la réouverture. »                            — la mission ; PROMPT, piège 49
//
// ⚠️ « `2N + 4` est un ORDRE DE GRANDEUR DE CONCEPTION et NE PILOTE RIEN — ni
//    plafond, ni projection, ni arbitrage » (`01-` §11 ; piège 49). Le plafond
//    d'appels par dépôt ci-dessous n'en est donc PAS dérivé : c'est un nombre de
//    configuration, et rien ne le calcule.
//
// Ce module est PUR. La lecture de la dépense et la bascule de l'interrupteur
// vivent dans `couts-serveur.ts`.
// ============================================================================

/** La mission le donne en clair, et lui seul est un chiffre du dispositif. */
export const SEUIL_ALERTE = 0.70

export type EtatFacture = 'normal' | 'alerte' | 'coupure'

export interface Facture {
  /** La dépense du mois en cours, en USD, telle que `api_couts` la porte. */
  depenseMois: number
  /** Le plafond mensuel, en USD. Il vient de la configuration. */
  plafondMensuel: number
}

/**
 * L'état de la facture. À l'atteinte du plafond, la coupure : elle bascule
 * l'interrupteur propre de la chaîne, et les dépôts RESTENT EN FILE.
 */
export function etatFacture(f: Facture): EtatFacture {
  if (!(f.plafondMensuel > 0)) return 'normal'
  if (f.depenseMois >= f.plafondMensuel) return 'coupure'
  if (f.depenseMois >= f.plafondMensuel * SEUIL_ALERTE) return 'alerte'
  return 'normal'
}

/** La part consommée, pour la trace — jamais pour une décision. */
export function partConsommee(f: Facture): number | null {
  if (!(f.plafondMensuel > 0)) return null
  return f.depenseMois / f.plafondMensuel
}

/**
 * Le plafond d'appels PAR DÉPÔT. Il compte les LIGNES d'`api_couts` rattachées
 * au dépôt — « le nombre d'appels d'un étage se lit au nombre de lignes »
 * (`07-` §1.2). Les deux temps de CODE n'y entrent pas : ce ne sont pas des
 * appels, et ils ne journalisent rien.
 */
export function depotAAtteintSonPlafond(appelsDejaFaits: number, plafondParDepot: number): boolean {
  return plafondParDepot > 0 && appelsDejaFaits >= plafondParDepot
}

/** Le premier jour du mois en cours, en UTC — la borne du compte mensuel. */
/**
 * Les appels qu'une erreur de chaîne porte — 0 quand elle n'en porte pas.
 *
 * ⭐ C4-L11. `SortieNonConforme` et `AppelInterrompu` (`./appel`) exposent tous
 * deux un `readonly appels` — « les appels RÉELLEMENT dépensés avant l'abandon
 * — L'APPELANT LES COMPTE ». L'appelant ne les comptait pas : sur un `rejected`
 * de l'`allSettled` des chaînes, le motif partait en alerte et le compte
 * tombait, alors que les lignes étaient déjà écrites au journal (`bilan.appels
 * = 0` avec TROIS lignes en base, constaté en vrai).
 *
 * ⚠️ CE N'EST PAS UNE GARDE, et il ne faut pas le lire comme telle : le bilan
 * est un CHIFFRE DE DIAGNOSTIC — « aucune décision n'en dépend, le plafond par
 * dépôt se lit au nombre de lignes en base ». Les deux gardes réelles sont
 * `controlerLaFacture` (la facture du mois) et `depotAAtteintSonPlafond`
 * ci-dessus (le plafond par dépôt) ; ni l'une ni l'autre ne passe par ici.
 *
 * On lit la PROPRIÉTÉ, pas la classe : une erreur re-levée à travers une
 * frontière de module perd son prototype, jamais son champ. Une erreur sans
 * `appels` — un bug, une lecture en base qui lève — n'a rien dépensé au modèle,
 * et 0 est alors la bonne réponse.
 */
export function appelsDeLErreur(raison: unknown): number {
  const n = (raison as { appels?: unknown } | null | undefined)?.appels
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0
}

export function debutDuMois(maintenant: Date): string {
  return new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1)).toISOString()
}
