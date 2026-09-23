// ============================================================================
// LE TABLEAU EN DIRECT D'UNE PASSATION (retours de classe du 22/09/2026).
//
// Deux lecteurs le composaient chacun de leur côté — la page de lancement et la
// route de sondage (`/api/quazian/live/[quizId]`) — et tous deux listaient les
// élèves ayant accès au MODULE Quazian, toutes classes confondues : mesuré en
// prod le 22/09, 64 élèves à l'écran pour un quiz de T5 qui en compte 23.
// Une liste qui vit à deux endroits diverge ; elle se compose ici, une fois.
//
// ⭐ La classe du QUIZ fait la liste — plus les élèves qui ont une session sur
//    ce quiz sans avoir d'inscription ACTIVE dans la classe (inscription passée
//    à un autre statut) : leur copie et leur note ne disparaissent pas du tableau.
//    ⚠️ Un retrait par `retirer_inscription` supprime ses sessions : il n'apparaît plus.
// ============================================================================

export interface LigneTableauLive {
  id: string
  display_name: string
  // `commence` distingue « a ouvert le quizz » de « est dans la classe » : sans
  // lui, un élève qui n'a jamais ouvert était compté comme « en cours » et
  // annoncé comme futur auto-soumis, alors qu'il n'aura simplement AUCUNE note.
  commence: boolean
  soumis: boolean
  submitted_at: string | null
  score_moyen: number | null
  auto: boolean
  /** Questions dont la réponse est ENREGISTRÉE — l'élève l'a validée en passant
   *  à une autre question. Celle qu'il a sous les yeux ne compte qu'après. */
  repondues: number
  /** Une session sur ce quiz, mais aucune inscription active dans sa classe. */
  horsClasse: boolean
}

export function composerTableauLive(entree: {
  inscrits: string[]
  profils: { id: string; display_name: string | null }[]
  sessions: { id: string; eleve_id: string; submitted_at: string | null; auto_submitted: boolean | null }[]
  scores: { eleve_id: string; score_moyen: number | null }[]
  /** Réponses enregistrées (`repondu = true`), par session. */
  reponduesParSession: Record<string, number>
  /** Un ancien quiz sans classe : personne n'y est « plus inscrit ». */
  sansClasse?: boolean
}): LigneTableauLive[] {
  const inscrits = new Set(entree.inscrits)
  const sessionParEleve = new Map(entree.sessions.map((s) => [s.eleve_id, s]))
  const scoreParEleve = new Map(entree.scores.map((s) => [s.eleve_id, s.score_moyen]))
  const nomParEleve = new Map(entree.profils.map((p) => [p.id, p.display_name]))

  const ids = [...new Set([...entree.inscrits, ...entree.sessions.map((s) => s.eleve_id)])]
  return ids
    .map((id) => {
      const session = sessionParEleve.get(id)
      return {
        id,
        display_name: nomParEleve.get(id) ?? 'Élève sans nom',
        commence: !!session,
        soumis: !!session?.submitted_at,
        submitted_at: session?.submitted_at ?? null,
        score_moyen: scoreParEleve.get(id) ?? null,
        auto: session?.auto_submitted ?? false,
        repondues: session ? (entree.reponduesParSession[session.id] ?? 0) : 0,
        horsClasse: !entree.sansClasse && !inscrits.has(id),
      }
    })
    .sort((a, b) => a.display_name.localeCompare(b.display_name, 'fr'))
}
