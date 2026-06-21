'use server'

import { createClient } from '@/utils/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { diagnostiquerEleve, type DiagnosticConcept } from '@/utils/diagnostic'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase }
}

// Données brutes pour le diagnostic classe
export async function chargerDiagnosticClasse() {
  const { supabase } = await verifierProf()

  // Toutes les réponses avec concept_tag depuis les quizz fermés
  const { data: reponses } = await supabase
    .from('quazian_answers')
    .select(`
      score, repondu,
      quazian_sessions!inner(eleve_id),
      quazian_questions!inner(concept_tag)
    `)
    .not('score', 'is', null)

  // Profils
  const eleveIds = [...new Set((reponses ?? []).map((r) => {
    const s = r.quazian_sessions as unknown as { eleve_id: string }
    return s.eleve_id
  }))]

  const { data: profiles } = eleveIds.length > 0
    ? await supabase.from('profiles').select('id, display_name, classe').in('id', eleveIds)
    : { data: [] }

  const profilesMap: Record<string, { display_name: string; classe: string | null }> = {}
  for (const p of profiles ?? []) profilesMap[p.id] = p

  // Grouper les réponses par élève
  const parEleve: Record<string, Array<{ concept_tag: string; score: number }>> = {}
  for (const r of reponses ?? []) {
    const session = r.quazian_sessions as unknown as { eleve_id: string }
    const question = r.quazian_questions as unknown as { concept_tag: string }
    const eleveId = session.eleve_id
    if (!parEleve[eleveId]) parEleve[eleveId] = []
    parEleve[eleveId].push({ concept_tag: question.concept_tag, score: r.score })
  }

  // Diagnostiquer chaque élève
  const diagnostics: Record<string, DiagnosticConcept[]> = {}
  for (const [eleveId, reps] of Object.entries(parEleve)) {
    diagnostics[eleveId] = diagnostiquerEleve(reps)
  }

  // Concepts fragiles au niveau classe (idées fausses ou lacunes répandues)
  const conceptsClasse: Record<string, { idee_fausse: number; lacune: number; maitrise: number }> = {}
  for (const diag of Object.values(diagnostics)) {
    for (const d of diag) {
      if (!conceptsClasse[d.concept_tag]) conceptsClasse[d.concept_tag] = { idee_fausse: 0, lacune: 0, maitrise: 0 }
      if (d.profil === 'idee_fausse') conceptsClasse[d.concept_tag].idee_fausse++
      else if (d.profil === 'lacune') conceptsClasse[d.concept_tag].lacune++
      else if (d.profil === 'maitrise') conceptsClasse[d.concept_tag].maitrise++
    }
  }

  return { diagnostics, profilesMap, conceptsClasse, eleveIds }
}

// Diagnostic d'un élève spécifique + retrievability FSRS
export async function chargerDiagnosticEleve(eleveId: string) {
  const { supabase } = await verifierProf()

  const { data: reponses } = await supabase
    .from('quazian_answers')
    .select(`
      score, repondu, p_a, p_b, p_c, p_d,
      quazian_sessions!inner(eleve_id),
      quazian_questions!inner(concept_tag, index_correct)
    `)
    .not('score', 'is', null)

  const repEleve = (reponses ?? []).filter((r) => {
    const s = r.quazian_sessions as unknown as { eleve_id: string }
    return s.eleve_id === eleveId
  }).map((r) => {
    const q = r.quazian_questions as unknown as { concept_tag: string; index_correct: number }
    return { concept_tag: q.concept_tag, score: r.score, repondu: r.repondu }
  })

  const diagnostic = diagnostiquerEleve(repEleve)

  // États FSRS de l'élève
  const { data: etats } = await supabase
    .from('quazian_card_states')
    .select('flashcard_id, stability, state, due')
    .eq('eleve_id', eleveId)

  // Scores quizz
  const { data: scores } = await supabase
    .from('quazian_quiz_scores')
    .select('score_moyen, note_formative_20, z_quiz, quiz_id')
    .eq('eleve_id', eleveId)
    .order('quiz_id')

  // Note du semestre actif (une note de semestre par semestre désormais).
  const { data: semActif } = await supabase
    .from('semesters')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()
  const { data: semestre } = semActif
    ? await supabase
        .from('quazian_semester')
        .select('note_finale_20, note_relative_20, note_absolue_20')
        .eq('eleve_id', eleveId)
        .eq('semester_id', semActif.id)
        .maybeSingle()
    : { data: null }

  const nbCartesVues = etats?.length ?? 0
  const stabiliteMoyenne = etats && etats.length > 0
    ? etats.reduce((a, b) => a + b.stability, 0) / etats.length
    : 0

  return { diagnostic, scores: scores ?? [], semestre, nbCartesVues, stabiliteMoyenne }
}

// Rapport de fragilités IA
export async function genererRapportFragilites(): Promise<{ rapport: string } | { error: string }> {
  await verifierProf()

  const { conceptsClasse } = await chargerDiagnosticClasse()

  // Construire le contexte pour l'IA
  const ideesFausses = Object.entries(conceptsClasse)
    .filter(([, v]) => v.idee_fausse > 0)
    .sort(([, a], [, b]) => b.idee_fausse - a.idee_fausse)
    .slice(0, 10)

  const lacunes = Object.entries(conceptsClasse)
    .filter(([, v]) => v.lacune > 0 && v.idee_fausse === 0)
    .sort(([, a], [, b]) => b.lacune - a.lacune)
    .slice(0, 10)

  const contexte = `CONCEPTS EN IDÉE FAUSSE (score très négatif, erreur confiante) :\n${
    ideesFausses.map(([c, v]) => `- ${c} : ${v.idee_fausse} élève(s)`).join('\n') || 'Aucun'
  }\n\nCONCEPTS EN LACUNE (score proche de 2.5, incertitude honnête) :\n${
    lacunes.map(([c, v]) => `- ${c} : ${v.lacune} élève(s)`).join('\n') || 'Aucun'
  }`

  const client = new Anthropic()
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Tu es un assistant pédagogique pour un professeur de philosophie au lycée. Analyse ces données de diagnostic de la classe et produis un rapport de fragilités concis (8-10 lignes max). Distingue clairement les idées fausses (à corriger en priorité) des lacunes (à exposer davantage). Formule des suggestions d'action concrètes.\n\n${contexte}`,
    }],
  })

  const rapport = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  return { rapport }
}
