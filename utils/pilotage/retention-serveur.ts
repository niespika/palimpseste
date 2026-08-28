import 'server-only'
// ============================================================================
// C6 · L1 — LE DIAGNOSTIC DE RÉTENTION, RANGÉ À CÔTÉ DE LA MATRICE.
// ----------------------------------------------------------------------------
// « Le diagnostic de rétention s'y range plutôt que dans un onglet à part »
//   (`07-` §2, C6-L1), et l'arbitrage ② de Louis du 27/08 en tire deux
//   conséquences : **il déménage sous cette page ET ses deux fils cassés se
//   réparent** — « ranger un écran qui ne montre rien n'est pas le ranger ».
//
// ⛔⛔ ET IL NE PRODUIT AUCUNE LETTRE. « Quazian : mesure continue de la
//    Connaissance… IL N'ÉCRIT PAS DANS LE PROFIL DE COMPÉTENCES » (`01-` §2), et
//    « c'est le signal du RENVOI HORS ROUTEUR, jamais une lettre » (`01-` §6,
//    R4). Ce résumé se range À CÔTÉ de la grille ; **il n'entre dans aucune
//    cellule**, et rien de ce qu'il compte ne touche la colonne Connaissance.
//    *Une colonne « Connaissance » nourrie de flashcards serait le contraire
//    exact de la règle.*
//
// ⚠️ NE PAS CONFONDRE QUATRE CHOSES QUI PORTENT LE MOT « DIAGNOSTIC » : le geste
//    `diagnostiquer` (un cran) · l'examen diagnostique (l'ancre, `01-` §10) · le
//    diagnostic de compréhension (Aletheia, prof-only) · et le diagnostic de
//    RÉTENTION (Quazian — celui-ci). Les libellés d'ici n'en désignent qu'un.
//
// ⛔ CE MODULE NE REFAIT PAS LE DIAGNOSTIC : il appelle `diagnostiquerEleve`
//    (`utils/diagnostic.ts`), le même juge que l'écran complet.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { diagnostiquerEleve } from '@/utils/diagnostic'

type Admin = ReturnType<typeof createAdminClient>

export interface RetentionDeLaClasse {
  /** Combien d'élèves de la classe ont au moins une réponse de quizz notée. */
  eleves: number
  /** Combien de réponses notées ont été lues, tous quizz de la classe confondus. */
  reponses: number
  /** Les concepts les plus fragiles — idées fausses d'abord, lacunes ensuite. */
  fragiles: Array<{ concept: string; ideeFausse: number; lacune: number; maitrise: number }>
  /** ⛔ « Une lecture ratée n'est pas une base vide. » */
  incidents: string[]
  /** L'adresse de l'écran complet — la PORTE, depuis cette page. */
  href: string
}

/**
 * LE RÉSUMÉ, BORNÉ À LA CLASSE REGARDÉE.
 *
 * ⚠️ Le périmètre est celui des **quizz de la classe** (`quazian_quizzes.classe_id`),
 *    exactement comme `chargerDiagnosticClasse(classeId)` de l'écran complet —
 *    et non la population d'élèves : un quizz appartient à une classe, lui.
 *
 * ⚠️ `supabase-js` NE LÈVE PAS : chaque lecture ratée devient un incident, et
 *    l'écran dit qu'il ne sait pas plutôt que d'afficher « aucune fragilité ».
 */
export async function chargerLaRetentionDeLaClasse(
  admin: Admin, classeId: string,
): Promise<RetentionDeLaClasse> {
  const incidents: string[] = []
  const href = `/prof/quazian/diagnostic?vue=classe&classe=${classeId}`

  const { data: quiz, error: eQuiz } = await admin
    .from('quazian_quizzes').select('id').eq('classe_id', classeId)
  if (eQuiz) {
    incidents.push(`les quizz de la classe : ${eQuiz.message}`)
    return { eleves: 0, reponses: 0, fragiles: [], incidents, href }
  }
  const quizIds = new Set(((quiz ?? []) as Array<{ id: string }>).map((q) => q.id))
  if (quizIds.size === 0) return { eleves: 0, reponses: 0, fragiles: [], incidents, href }

  const { data: reponses, error: eRep } = await admin
    .from('quazian_answers')
    .select('score, quazian_sessions!inner(eleve_id, quiz_id), quazian_questions!inner(concept_tag)')
    .not('score', 'is', null)
  if (eRep) {
    incidents.push(`les réponses de quizz : ${eRep.message}`)
    return { eleves: 0, reponses: 0, fragiles: [], incidents, href }
  }

  const parEleve = new Map<string, Array<{ concept_tag: string; score: number }>>()
  let lues = 0
  for (const r of (reponses ?? []) as unknown as Array<{
    score: number
    quazian_sessions: { eleve_id: string; quiz_id: string }
    quazian_questions: { concept_tag: string }
  }>) {
    const s = r.quazian_sessions
    if (!s || !quizIds.has(s.quiz_id)) continue
    lues += 1
    const lot = parEleve.get(s.eleve_id) ?? []
    lot.push({ concept_tag: r.quazian_questions.concept_tag, score: r.score })
    parEleve.set(s.eleve_id, lot)
  }

  const compte = new Map<string, { ideeFausse: number; lacune: number; maitrise: number }>()
  for (const reps of parEleve.values()) {
    for (const d of diagnostiquerEleve(reps)) {
      const c = compte.get(d.concept_tag) ?? { ideeFausse: 0, lacune: 0, maitrise: 0 }
      if (d.profil === 'idee_fausse') c.ideeFausse += 1
      else if (d.profil === 'lacune') c.lacune += 1
      else if (d.profil === 'maitrise') c.maitrise += 1
      compte.set(d.concept_tag, c)
    }
  }

  // Les idées fausses pèsent double — le même ordre que l'écran complet, pour
  // que les deux ne se contredisent jamais.
  const fragiles = [...compte]
    .map(([concept, c]) => ({ concept, ...c }))
    .filter((c) => c.ideeFausse > 0 || c.lacune > 0)
    .sort((a, b) => (b.ideeFausse * 2 + b.lacune) - (a.ideeFausse * 2 + a.lacune))

  return { eleves: parEleve.size, reponses: lues, fragiles, incidents, href }
}
