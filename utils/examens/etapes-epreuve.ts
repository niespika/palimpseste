// ============================================================================
// CODEX — LES ÉTAPES DE LA VÉRIFICATION, CÔTÉ ÉLÈVE. 24/09/2026. Module PUR.
// ----------------------------------------------------------------------------
// Commentaire de Louis sur la planche des maquettes : « l'élève devrait voir
// clairement les étapes de la vérification. On peut aller s'inspirer de ce qui
// se fait pour les exercices. » Proposition dessinée, puis acceptée (« c'est pas
// mal du tout ») : un FIL d'étapes en tête de l'écran — Déposer · Relire ·
// Te juger · Ta confiance —, puis UNE TÂCHE PAR ÉCRAN après la validation, comme
// la page qui tourne des exercices (`utils/deroule/etapes.ts`), puis la fin.
//
// ⛔ CE MODULE NE DÉCIDE RIEN DE CE QUI S'ENREGISTRE. Il lit des faits posés par
//    le serveur (la transcription est là, la copie est validée, un geste est
//    servi, un geste est fait) et dit quelle page l'élève a sous les yeux. Les
//    actions serveur restent seules juges de ce qu'elles acceptent.
//
// ⚠️ L'ORDRE DES GESTES EST CELUI DE LA DOCTRINE (`02-` §6.D) : la crédence, là
//    où un cran la demande (jamais pour l'essai d'examen, qui n'a pas de cran —
//    constat du 22/08 dans `utils/passation/metacognition.ts`), puis « se
//    juger » (étape 9), puis la confiance de remise (étape 10). C'est aussi
//    l'ordre dans lequel l'écran d'hier les empilait.
// ============================================================================

export type EtapeEpreuve = 'deposer' | 'relire' | 'credence' | 'juger' | 'confiance' | 'fini'

/** Les faits que l'écran lit — tous posés par le serveur (`chargerVueEleve`). */
export interface FaitsDeLEpreuve {
  /** La machine a rendu un texte (non vide) à relire. */
  transcrit: boolean
  /** La copie est validée (`v1_remis_at`). */
  valide: boolean
  /** Un geste est SERVI quand son offre l'est ET qu'il a quelque chose à demander. */
  credenceServie: boolean
  credenceFaite: boolean
  jugerServi: boolean
  jugerFait: boolean
  confianceServie: boolean
  confianceFaite: boolean
}

export interface EtapeDuFil {
  etape: Exclude<EtapeEpreuve, 'fini'>
  libelle: string
}

/** Les libellés du fil — texte ÉLÈVE, relu par Louis sur la planche. */
export const LIBELLES_ETAPES: Record<Exclude<EtapeEpreuve, 'fini'>, string> = {
  deposer: 'Déposer',
  relire: 'Relire',
  credence: 'Ta crédence',
  juger: 'Te juger',
  confiance: 'Ta confiance',
}

/** La suite des étapes de CE dépôt : les deux premières toujours, puis les gestes servis. */
export function suiteDesEtapes(f: FaitsDeLEpreuve): EtapeDuFil[] {
  const suite: EtapeDuFil['etape'][] = ['deposer', 'relire']
  if (f.credenceServie) suite.push('credence')
  if (f.jugerServi) suite.push('juger')
  if (f.confianceServie) suite.push('confiance')
  return suite.map((etape) => ({ etape, libelle: LIBELLES_ETAPES[etape] }))
}

/**
 * La page que l'élève a sous les yeux. Avant la validation : déposer tant que la
 * machine n'a rien rendu, relire ensuite. Après : le premier geste servi et pas
 * encore fait, dans l'ordre de la doctrine ; aucun, c'est la fin.
 */
export function etapeCourante(f: FaitsDeLEpreuve): EtapeEpreuve {
  if (!f.valide) return f.transcrit ? 'relire' : 'deposer'
  if (f.credenceServie && !f.credenceFaite) return 'credence'
  if (f.jugerServi && !f.jugerFait) return 'juger'
  if (f.confianceServie && !f.confianceFaite) return 'confiance'
  return 'fini'
}

/** Le rang d'une étape dans la suite — « 3 / 4 » —, ou null pour la fin. */
export function rangDeLEtape(
  suite: readonly EtapeDuFil[], etape: EtapeEpreuve,
): { rang: number; total: number } | null {
  const i = suite.findIndex((e) => e.etape === etape)
  return i < 0 ? null : { rang: i + 1, total: suite.length }
}

/** Reste-t-il une étape APRÈS celle-ci ? — « Enregistrer et continuer » ou « … et terminer ». */
export function resteUneEtapeApres(f: FaitsDeLEpreuve, etape: EtapeEpreuve): boolean {
  const suite = suiteDesEtapes(f).map((e) => e.etape)
  const i = suite.indexOf(etape as EtapeDuFil['etape'])
  if (i < 0) return false
  // Les étapes suivantes déjà faites ne comptent pas : on n'y retourne pas.
  return suite.slice(i + 1).some((e) =>
    (e === 'credence' && !f.credenceFaite)
    || (e === 'juger' && !f.jugerFait)
    || (e === 'confiance' && !f.confianceFaite))
}

/** Le nombre, écrit en lettres jusqu'à trois — « réponds à ces deux questions ». */
export function enLettres(n: number): string {
  return ['zéro', 'une', 'deux', 'trois'][n] ?? String(n)
}
