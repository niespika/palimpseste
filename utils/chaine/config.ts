// ============================================================================
// C4 · L5 — LA CONFIGURATION DE LA CHAÎNE.
// ----------------------------------------------------------------------------
// « Les identifiants des deux modèles vivent À LA CONFIGURATION » (`07-` §6) ;
// « le plafond mensuel, l'alerte à 70 %, la coupure automatique, le plafond
//   d'appels par dépôt — LES VALEURS VIVENT À LA CONFIGURATION » (la mission).
//
// Le §1 ne nomme AUCUNE colonne pour ces valeurs. « Une donnée que rien ne nomme
// se signale, elle ne s'invente pas » (piège 5) : on ne crée donc pas de table,
// et la configuration est l'environnement — le seul domicile que le dépôt ait
// déjà pour ce genre de valeur (patron `CRON_SECRET`, `ANTHROPIC_API_KEY`).
//
// ⚠️ L'INTERRUPTEUR, lui, est en base : la coupure automatique doit pouvoir le
//    basculer, et le professeur le rouvrir. Il vit au même emplacement que les
//    existants — `scriptorium_params.chaine_actif`, à OFF (piège 49).
//
// ⚠️ Les défauts ci-dessous sont des valeurs de DÉMARRAGE, pas des décisions :
//    `configurationADeclarer()` dit lesquelles n'ont pas été posées, et le relevé
//    de séance les porte comme une question au professeur.
// ============================================================================

import type { ConfigModeles } from './modele'

export interface ConfigChaine extends ConfigModeles {
  /** USD par mois. La coupure automatique se déclenche à ce chiffre. */
  plafondMensuelUsd: number
  /**
   * Le nombre maximal d'appels de modèle rattachés à UN dépôt.
   * ⚠️ Ce nombre n'est PAS dérivé de « 2N + 4 », qui ne pilote rien (`01-` §11).
   */
  plafondAppelsParDepot: number
  /** Le contrat de latence : « le retour arrive en moins de trois minutes » (`01-` §12). */
  latenceCibleMs: number
  /** Le bail d'un job : au-delà, il est réputé expiré et se reprend (`07-` §1.1). */
  bailMs: number
}

const DEFAUTS: ConfigChaine = {
  // Les deux identifiants que le dépôt connaît déjà (`utils/cout-usage.ts`,
  // table des TARIFS) — ils tiennent lieu de défaut, la configuration décide.
  fort: 'claude-sonnet-4-6',
  economique: 'claude-haiku-4-5',
  // « Construis le partage DÉBRAYABLE : tout-au-fort tant que la contre-épreuve
  //   n'a pas tranché » (piège 11). Le défaut est donc le partage ÉTEINT.
  partageActif: false,
  /**
   * ⭐⭐ 31/08/2026 — RELEVÉ DE 25 À 150 $, décision de Louis : *« lève le
   *    plafond pour cette semaine, on verra combien ça me coûte réellement à la
   *    fin de la semaine 1 »*.
   *
   * ⛔ LE MOTIF EST MESURÉ, pas prudentiel. Coût réel d'un dépôt en production :
   *    **0,126 $ en médiane** (moyenne 0,146, max 0,328), 7 appels par dépôt.
   *    À 62 élèves × 6 exercices, la semaine coûte **46,86 $** — au-dessus de 25.
   *    L'ancien plafond coupait donc vers le **198ᵉ dépôt**, soit trois exercices
   *    par élève, EN MILIEU DE PREMIÈRE SEMAINE. Et la coupure n'est pas douce :
   *    `couperLaChaine` bascule `chaine_actif` à OFF **pour toute la classe**, et
   *    l'alerte à 70 % n'est qu'un `console.error` — personne n'est prévenu.
   *
   * ⚠️ CE N'EST PAS UN BUDGET, C'EST UNE FENÊTRE DE MESURE. 150 laisse passer un
   *    mois plein à la cadence haute (62 × 12 ≈ 94 $) tout en gardant une borne
   *    contre l'emballement. **À revoir à la fin de la semaine 1, sur la dépense
   *    réelle** — c'est la seule valeur qui vaudra quelque chose.
   *
   * ⭐ Et le vrai levier est ailleurs : `partageActif` ci-dessus. Tant qu'il est
   *    à `false`, TOUT part au modèle fort, exercices compris. Haiku coûte le
   *    tiers de Sonnet (1/5 contre 3/15 par million) ; le partage est écrit,
   *    éprouvé, et n'attend que la contre-épreuve du `07-` §6.
   */
  plafondMensuelUsd: 150,
  plafondAppelsParDepot: 40,
  latenceCibleMs: 3 * 60 * 1000,
  bailMs: 5 * 60 * 1000,
}

function nombre(nom: string, defaut: number): number {
  const brut = process.env[nom]
  if (brut == null || brut.trim() === '') return defaut
  const v = Number(brut)
  return Number.isFinite(v) && v >= 0 ? v : defaut
}

function texte(nom: string, defaut: string): string {
  const brut = process.env[nom]
  return brut && brut.trim() !== '' ? brut.trim() : defaut
}

export function lireConfig(): ConfigChaine {
  return {
    fort: texte('CHAINE_MODELE_FORT', DEFAUTS.fort),
    economique: texte('CHAINE_MODELE_ECONOMIQUE', DEFAUTS.economique),
    partageActif: (process.env.CHAINE_PARTAGE_MODELE ?? '').toLowerCase() === 'on',
    plafondMensuelUsd: nombre('CHAINE_PLAFOND_MENSUEL_USD', DEFAUTS.plafondMensuelUsd),
    plafondAppelsParDepot: nombre('CHAINE_PLAFOND_APPELS_PAR_DEPOT', DEFAUTS.plafondAppelsParDepot),
    latenceCibleMs: nombre('CHAINE_LATENCE_CIBLE_MS', DEFAUTS.latenceCibleMs),
    bailMs: nombre('CHAINE_BAIL_MS', DEFAUTS.bailMs),
  }
}

/** Les valeurs qui n'ont pas été posées, et qui tournent donc sur un défaut. */
export function configurationADeclarer(): string[] {
  const manquantes: string[] = []
  for (const nom of ['CHAINE_MODELE_FORT', 'CHAINE_MODELE_ECONOMIQUE',
    'CHAINE_PLAFOND_MENSUEL_USD', 'CHAINE_PLAFOND_APPELS_PAR_DEPOT']) {
    if (!process.env[nom]) manquantes.push(nom)
  }
  return manquantes
}

export const CONFIG_DEFAUTS = DEFAUTS
