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
//
// Et, le soir même (`c8_theme_commentaire_prof.sql`), un TROISIÈME geste du
// professeur, « ni valider, ni modifier » : commenter.
//   · `commentaire_prof` + `commente_at` — le dernier commentaire du professeur.
// « Commenté » = le commentaire est plus récent que la proposition de l'élève ET
// que la validation du professeur : l'élève n'a pas encore répondu, le
// professeur n'a pas tranché depuis. Il s'éteint de lui-même (re-proposition ou
// validation) — rien à effacer, et le tableau de bord de l'élève le porte.
// ============================================================================

export interface EtatDuTheme {
  theme: string | null
  propose_at: string | null
  valide_at: string | null
  /** C8 — le commentaire du professeur (facultatif : les lecteurs d'avant ne l'ont pas). */
  commentaire_prof?: string | null
  commente_at?: string | null
}

export type StatutDuTheme = 'vide' | 'a_valider' | 'valide' | 'pose_par_le_prof' | 'commente'

const instant = (s: string | null | undefined): number | null => (s ? new Date(s).getTime() : null)

/**
 * « À valider » : l'élève a écrit, et le professeur n'a pas validé DEPUIS. Un
 * thème posé par le professeur sans proposition (`propose_at` nul) n'est jamais
 * « à valider » — c'est ce qui rend la migration inerte pour les thèmes existants.
 * ⚠️ Ne regarde PAS le commentaire : c'est `statutDuTheme` qui arbitre.
 */
export function themeAValider(t: Pick<EtatDuTheme, 'theme' | 'propose_at' | 'valide_at'>): boolean {
  if (!t.theme || t.theme.trim() === '') return false
  if (!t.propose_at) return false
  if (!t.valide_at) return true
  return new Date(t.propose_at).getTime() > new Date(t.valide_at).getTime()
}

/**
 * « Commenté » : le professeur a laissé un commentaire, et NI l'élève (nouvelle
 * proposition) NI le professeur (validation) n'ont agi depuis. Un commentaire
 * posé puis validé, ou auquel l'élève a répondu, ne compte plus.
 */
export function commentaireEnAttente(t: EtatDuTheme): boolean {
  const c = instant(t.commente_at)
  if (c == null) return false
  if (!t.commentaire_prof || t.commentaire_prof.trim() === '') return false
  const p = instant(t.propose_at)
  if (p != null && p > c) return false
  const v = instant(t.valide_at)
  if (v != null && v > c) return false
  return true
}

export function statutDuTheme(t: EtatDuTheme | null | undefined): StatutDuTheme {
  if (!t || !t.theme || t.theme.trim() === '') return 'vide'
  if (commentaireEnAttente(t)) return 'commente'
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
    case 'commente': return 'Ton professeur a laissé un commentaire : lis-le, puis propose ton thème à nouveau.'
    default: return 'Écris ici le thème sur lequel tu feras tes fragments ce semestre. Ton professeur le relira et le validera.'
  }
}

/** Le thème proposé, nettoyé ; `null` si vide. */
export function themePropose(brut: string | null | undefined): string | null {
  const t = (brut ?? '').replace(/\s+/g, ' ').trim()
  return t === '' ? null : t.slice(0, 300)
}

/** Le commentaire du professeur, nettoyé (retours à la ligne gardés) ; `null` si vide. */
export function commentaireProf(brut: string | null | undefined): string | null {
  const t = (brut ?? '').replace(/\r\n/g, '\n').trim()
  return t === '' ? null : t.slice(0, 1000)
}
