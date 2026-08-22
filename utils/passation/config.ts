// ============================================================================
// C4 · L4 — CE QUI VIT À LA CONFIGURATION.
// ----------------------------------------------------------------------------
// Le §1 ne nomme AUCUNE colonne pour ces valeurs, et « une donnée que rien ne
// nomme se signale » (piège 5). On ne crée donc pas de table : la configuration
// est l'environnement — le seul domicile que le dépôt ait déjà pour ce genre de
// valeur (patron `utils/chaine/config.ts`, C4-L5 ; `CRON_SECRET`).
//
// ⚠️ LE MODÈLE DE LA TRANSCRIPTION N'EST PAS UN CHOIX DE RÉGIME DE MODÈLE.
//    « Le régime de modèle suit LA MESURE, jamais le canal » (§6), et il ne
//    connaît que trois étages — `p1`, `p2`, `retour` — qui « prennent le même
//    modèle ». La transcription n'en est aucun : elle n'est pas une mesure, elle
//    fabrique ce sur quoi la mesure portera. « Ta part est de NE RIEN FORCER —
//    ne passe aucun modèle en paramètre depuis ton écran » (piège 50) : rien
//    ici n'atteint `utils/chaine/modele.ts`, qui reste seul à décider du modèle
//    des trois étages.
//
// ⚠️ Le défaut est le modèle FORT, et c'est un choix qui se dit : une faute de
//    transcription ne se rattrape nulle part en aval — « c'est sur elle que
//    l'Expression se mesure » (piège 16) —, et le §6 note que la transcription
//    « surestime l'Expression, et davantage chez les élèves faibles ». Le
//    modèle économique creuserait ce biais connu. Le chiffre à surveiller est
//    au relevé : deux appels par copie, ~140 copies, deux à trois fois l'an.
// ============================================================================

export interface ConfigPassation {
  /** Le modèle qui transcrit. Doit savoir lire une image. */
  modeleTranscription: string
  /** Le nombre de passes. `06-` §4 : « le désaccord entre DEUX passes ». */
  passes: number
  /** Le plafond de photos qu'une copie peut porter — l'écran le dit à l'élève. */
  pagesMax: number
  /** Ce qu'on s'autorise à attendre d'une transcription avant de la déclarer perdue. */
  delaiTranscriptionMs: number
}

const DEFAUTS: ConfigPassation = {
  // L'un des deux identifiants que le dépôt connaît déjà (`utils/cout-usage.ts`,
  // table des TARIFS) — et le seul des trois qui lise une image.
  modeleTranscription: 'claude-sonnet-4-6',
  // ⚠️ DEUX, et ce n'est pas un réglage : « `confiance_ocr` est le désaccord
  //    entre DEUX passes » (`06-` §4). Le champ existe pour que le nombre soit
  //    LU quelque part plutôt qu'écrit deux fois dans le code ; le mettre à 1
  //    supprime `confiance_ocr`, et `transcrire()` le dit alors en clair.
  passes: 2,
  pagesMax: 12,
  delaiTranscriptionMs: 120_000,
}

function nombre(nom: string, defaut: number): number {
  const brut = process.env[nom]
  if (brut == null || brut.trim() === '') return defaut
  const v = Number(brut)
  return Number.isFinite(v) && v > 0 ? v : defaut
}

export function lireConfigPassation(): ConfigPassation {
  const brutPasses = process.env.PASSATION_PASSES
  return {
    modeleTranscription: (process.env.PASSATION_MODELE_TRANSCRIPTION ?? '').trim()
      || DEFAUTS.modeleTranscription,
    passes: brutPasses && brutPasses.trim() !== '' ? Math.max(1, Math.trunc(Number(brutPasses) || 2)) : DEFAUTS.passes,
    pagesMax: Math.trunc(nombre('PASSATION_PAGES_MAX', DEFAUTS.pagesMax)),
    delaiTranscriptionMs: nombre('PASSATION_DELAI_TRANSCRIPTION_MS', DEFAUTS.delaiTranscriptionMs),
  }
}

/** Les valeurs qui n'ont pas été posées, et qui tournent donc sur un défaut. */
export function configurationADeclarer(): string[] {
  return ['PASSATION_MODELE_TRANSCRIPTION'].filter((n) => !process.env[n])
}

export const CONFIG_PASSATION_DEFAUTS = DEFAUTS
