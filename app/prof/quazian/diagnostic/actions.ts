'use server'

import { createClient } from '@/utils/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { diagnostiquerEleve, type DiagnosticConcept } from '@/utils/diagnostic'
import {
  chargerLeDiagnosticParCible, type DiagnosticParCible,
} from '@/utils/quazian-diagnostic-serveur'
import { coutMessage, enregistrerCoutApi, normaliserUsage } from '@/utils/cout-api'
import { toutesLesPages } from '@/utils/quazian-pages'
import { createAdminClient } from '@/utils/supabase/admin'
import { lirePorteRapport } from '@/utils/quazian-rapports-serveur'
import { aDesFragilites, texteSansMarkdown } from '@/utils/quazian-rapports'

const MODELE = 'claude-sonnet-4-6'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase }
}

// Données brutes pour le diagnostic classe.
// `classeId` optionnel : scope les fragilités aux quizz de cette classe
// (drill-down par classe → élève). Sans, agrège toutes classes confondues.
export async function chargerDiagnosticClasse(classeId?: string) {
  const { supabase } = await verifierProf()

  // Quizz de la classe ciblée (pour scoper les réponses).
  let quizIds: Set<string> | null = null
  if (classeId) {
    const { data: qz, error: eQuiz } = await supabase.from('quazian_quizzes').select('id').eq('classe_id', classeId)
    if (eQuiz) return { diagnostics: {}, profilesMap: {}, conceptsClasse: {}, eleveIds: [], erreur: `les quizz de la classe : ${eQuiz.message}` }
    quizIds = new Set((qz ?? []).map((q) => q.id as string))
    if (quizIds.size === 0) return { diagnostics: {}, profilesMap: {}, conceptsClasse: {}, eleveIds: [], erreur: null }
  }

  // Toutes les réponses avec concept_tag depuis les quizz fermés — celles des
  // quizz de la classe, filtrées EN BASE (`!inner`), et par pages : PostgREST
  // s'arrête à 1000 lignes sans le dire (`utils/quazian-pages.ts`).
  const { data: reponses, error: eRep } = await toutesLesPages((debut, fin) => {
    let requete = supabase
      .from('quazian_answers')
      .select(`
        score, repondu,
        quazian_sessions!inner(eleve_id, quiz_id),
        quazian_questions!inner(concept_tag)
      `)
      .not('score', 'is', null)
    if (quizIds) requete = requete.in('quazian_sessions.quiz_id', [...quizIds])
    return requete.order('session_id', { ascending: true }).order('question_id', { ascending: true }).range(debut, fin)
  })
  if (eRep) return { diagnostics: {}, profilesMap: {}, conceptsClasse: {}, eleveIds: [], erreur: `les réponses de quizz : ${eRep.message}` }

  const reponsesScope = (reponses ?? []).filter((r) => {
    if (!quizIds) return true
    const s = r.quazian_sessions as unknown as { quiz_id: string }
    return quizIds.has(s.quiz_id)
  })

  // Profils
  const eleveIds = [...new Set(reponsesScope.map((r) => {
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
  for (const r of reponsesScope) {
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

  return { diagnostics, profilesMap, conceptsClasse, eleveIds, erreur: null as string | null }
}

// ⭐⭐ C6-L1 — LES DEUX FILS CASSÉS DU DIAGNOSTIC SONT RÉPARÉS, et le corps de
//    la lecture vit désormais à `utils/quazian-diagnostic-serveur.ts` — pour que
//    la couture puisse l'éprouver PAR EXÉCUTION. Ici, la garde de rôle, et rien
//    d'autre.
export async function chargerDiagnosticParUnite(): Promise<DiagnosticParCible> {
  const { supabase } = await verifierProf()
  return chargerLeDiagnosticParCible(supabase)
}

// Diagnostic d'un élève spécifique + retrievability FSRS
export async function chargerDiagnosticEleve(eleveId: string) {
  const { supabase } = await verifierProf()

  // Les réponses de CET élève, filtrées en base (jointure `!inner`), et par pages.
  const { data: reponses } = await toutesLesPages((debut, fin) => supabase
    .from('quazian_answers')
    .select(`
      score, repondu, p_a, p_b, p_c, p_d,
      quazian_sessions!inner(eleve_id),
      quazian_questions!inner(concept_tag, index_correct)
    `)
    .eq('quazian_sessions.eleve_id', eleveId)
    .not('score', 'is', null).order('session_id', { ascending: true }).order('question_id', { ascending: true })
    .range(debut, fin))

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
  // Un élève bi-classe a UNE note de semestre par classe (unicité
  // semester_id,classe_id,eleve_id) → on prend la meilleure note finale plutôt
  // que maybeSingle() (qui échouerait sur 2 lignes).
  const { data: semestreRows } = semActif
    ? await supabase
        .from('quazian_semester')
        .select('note_finale_20, note_relative_20, note_absolue_20')
        .eq('eleve_id', eleveId)
        .eq('semester_id', semActif.id)
        .order('note_finale_20', { ascending: false })
        .limit(1)
    : { data: null }
  const semestre = semestreRows?.[0] ?? null

  const nbCartesVues = etats?.length ?? 0
  const stabiliteMoyenne = etats && etats.length > 0
    ? etats.reduce((a, b) => a + b.stability, 0) / etats.length
    : 0

  return { diagnostic, scores: scores ?? [], semestre, nbCartesVues, stabiliteMoyenne }
}

// Rapport de fragilités IA
// Le contexte envoyé au modèle : les concepts en idée fausse et en lacune.
function composerContexte(conceptsClasse: Record<string, { idee_fausse: number; lacune: number; maitrise: number }>): string {
  const ideesFausses = Object.entries(conceptsClasse)
    .filter(([, v]) => v.idee_fausse > 0)
    .sort(([, a], [, b]) => b.idee_fausse - a.idee_fausse)
    .slice(0, 10)
  const lacunes = Object.entries(conceptsClasse)
    .filter(([, v]) => v.lacune > 0 && v.idee_fausse === 0)
    .sort(([, a], [, b]) => b.lacune - a.lacune)
    .slice(0, 10)
  return `CONCEPTS EN IDÉE FAUSSE (score très négatif, erreur confiante) :\n${
    ideesFausses.map(([c, v]) => `- ${c} : ${v.idee_fausse} élève(s)`).join('\n') || 'Aucun'
  }\n\nCONCEPTS EN LACUNE (score proche de 2.5, incertitude honnête) :\n${
    lacunes.map(([c, v]) => `- ${c} : ${v.lacune} élève(s)`).join('\n') || 'Aucun'
  }`
}

/**
 * Le rapport de fragilités D'UNE CLASSE, conservé et daté (Louis, 23/09 : « par
 * classe et daté » — le rapport d'hier n'était écrit nulle part et mêlait toutes
 * les classes). Porte `quazian_rapport_actif`.
 */
export async function genererRapportClasse(classeId: string): Promise<
  { rapport: { id: string; contenu: string; created_at: string } } | { rien: string } | { error: string }
> {
  const { supabase } = await verifierProf()
  if (!(await lirePorteRapport(createAdminClient()))) return { error: 'Les rapports conservés sont fermés dans les paramètres de Quazian.' }
  const { data: classe } = await supabase.from('classes').select('id, nom').eq('id', classeId).maybeSingle()
  if (!classe) return { error: 'Classe introuvable.' }

  const { conceptsClasse, erreur } = await chargerDiagnosticClasse(classeId)
  // Une lecture en échec ne fait JAMAIS un rapport daté sur une partie des réponses.
  if (erreur) return { error: `Lecture du diagnostic impossible (${erreur}) : aucun rapport n’a été demandé.` }
  const evalues = Object.keys(conceptsClasse).length
  if (evalues === 0) {
    return { rien: 'Aucune réponse de quiz corrigée pour cette classe : rien à analyser.' }
  }
  // Mesuré au bac à sable : sans fragilité, le modèle est payé pour écrire « rien à signaler ».
  if (!aDesFragilites(conceptsClasse)) {
    return { rien: `Rien à signaler : sur ${evalues} concept${evalues > 1 ? 's' : ''} évalué${evalues > 1 ? 's' : ''}, aucun n’est en idée fausse ni en lacune. Aucun rapport n’a été demandé à l’IA.` }
  }
  const client = new Anthropic()
  const message = await client.messages.create({
    model: MODELE,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Tu es un assistant pédagogique pour un professeur de philosophie au lycée. Analyse ces données de diagnostic de la classe ${classe.nom} et produis un rapport de fragilités concis (8-10 lignes max). Distingue clairement les idées fausses (à corriger en priorité) des lacunes (à exposer davantage). Formule des suggestions d'action concrètes. Écris en texte simple, sans Markdown : ni titre, ni astérisques, ni dièses ; des phrases, un paragraphe par idée.\n\n${composerContexte(conceptsClasse)}`,
    }],
  })
  const cout = coutMessage(message.usage)
  await enregistrerCoutApi('quazian', cout, { classeId, modele: MODELE, tokens: normaliserUsage(message.usage) })
  const contenu = texteSansMarkdown(message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join(''))
  if (!contenu) return { error: 'Le modèle n’a rien rendu. Réessaie.' }

  const { data: ligne, error } = await supabase.from('quazian_rapports_fragilites')
    .insert({ classe_id: classeId, contenu, modele: MODELE, cout })
    .select('id, contenu, created_at').single()
  // Le rapport a coûté : s'il ne s'enregistre pas, on le montre quand même, et on le dit.
  if (error || !ligne) {
    console.error(`[quazian] rapport non conservé (classe ${classeId}) — ${error?.message}`)
    return { error: `Le rapport n’a pas pu être conservé (${error?.message ?? 'erreur inconnue'}). Voici son texte : ${contenu}` }
  }
  return { rapport: ligne as { id: string; contenu: string; created_at: string } }
}

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
    model: MODELE,
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Tu es un assistant pédagogique pour un professeur de philosophie au lycée. Analyse ces données de diagnostic de la classe et produis un rapport de fragilités concis (8-10 lignes max). Distingue clairement les idées fausses (à corriger en priorité) des lacunes (à exposer davantage). Formule des suggestions d'action concrètes.\n\n${contexte}`,
    }],
  })
  // Non attribué (C11a-bis) : ce rapport agrège TOUTES les classes
  // (`chargerDiagnosticClasse()` sans `classeId`) et aucun élève en particulier.
  await enregistrerCoutApi('quazian', coutMessage(message.usage), {
    modele: MODELE, tokens: normaliserUsage(message.usage),
  })

  const rapport = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('')

  return { rapport }
}
