// ============================================================================
// C8 · FRAGMENTS — LE THÈME PROPOSÉ PAR L'ÉLÈVE, VALIDÉ PAR LE PROFESSEUR.
// ----------------------------------------------------------------------------
// Demande de Louis (02/09) : l'élève écrit son thème, le professeur reçoit un
// signal, relit et valide. Ce module est PUR : la seule règle, testable, que
// l'écran élève, la page Suivi et le « à faire » du professeur appliquent tous.
//
// Deux instants sur `fragments_themes` (`c8_theme_propose_par_eleve.sql`) :
//   · `propose_at` — la dernière écriture de l'ÉLÈVE ;
//   · `valide_at`  — la dernière validation du PROFESSEUR (sa propre édition
//     vaut validation).
// ============================================================================

export interface EtatDuTheme {
  theme: string | null
  propose_at: string | null
  valide_at: string | null
}

export type StatutDuTheme = 'vide' | 'a_valider' | 'valide' | 'pose_par_le_prof'

/**
 * « À valider » : l'élève a écrit, et le professeur n'a pas validé DEPUIS. Un
 * thème posé par le professeur sans proposition (`propose_at` nul) n'est jamais
 * « à valider » — c'est ce qui rend la migration inerte pour les thèmes existants.
 */
export function themeAValider(t: Pick<EtatDuTheme, 'theme' | 'propose_at' | 'valide_at'>): boolean {
  if (!t.theme || t.theme.trim() === '') return false
  if (!t.propose_at) return false
  if (!t.valide_at) return true
  return new Date(t.propose_at).getTime() > new Date(t.valide_at).getTime()
}

export function statutDuTheme(t: EtatDuTheme | null | undefined): StatutDuTheme {
  if (!t || !t.theme || t.theme.trim() === '') return 'vide'
  if (themeAValider(t)) return 'a_valider'
  if (t.valide_at) return 'valide'
  return 'pose_par_le_prof'
}

/** Ce que l'élève lit sous son thème. */
export function libelleEleve(statut: StatutDuTheme): string {
  switch (statut) {
    case 'a_valider': return 'Proposé — en attente de la validation de ton professeur.'
    case 'valide': return 'Validé par ton professeur.'
    case 'pose_par_le_prof': return 'Défini avec ton professeur.'
    default: return 'Écris ici le thème sur lequel tu feras tes fragments ce semestre. Ton professeur le relira et le validera.'
  }
}

/** Le thème proposé, nettoyé ; `null` si vide. */
export function themePropose(brut: string | null | undefined): string | null {
  const t = (brut ?? '').replace(/\s+/g, ' ').trim()
  return t === '' ? null : t.slice(0, 300)
}
