'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { genererQuestions, regenererQuestion } from '@/utils/generer-questions'
import { lireGatePlanActif, plansValidesCourants, synchroniserStatutExerciceQuiz, resoudreSemestrePourSemaine } from '@/utils/plan-exercices'
import { semainesCouvertes } from '@/app/prof/scriptorium/evaluations/plan-serveur'
import { resoudreCible } from '@/utils/quazian-cibles'

// Normalise une relation imbriquée Supabase (objet ou tableau) en un objet.
function un<T>(x: T | T[] | null | undefined): T | null {
  if (Array.isArray(x)) return x[0] ?? null
  return x ?? null
}

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// Résultat de création : erreur, ou succès (avec un signal `avis` optionnel — Q3).
type CreerQuizzResult = { error: string } | { success: true; quizId: string; avis?: string }

// Créer un quizz + générer ses questions
export async function creerQuizz(formData: FormData): Promise<CreerQuizzResult> {
  const { supabase } = await verifierProf()
  const admin = createAdminClient()

  const classeId = (formData.get('classe_id') as string) || null
  const dureeMin = parseInt(formData.get('duree_min') as string) || 25
  const nbQuestions = parseInt(formData.get('nb_questions') as string) || 20
  const scopeRaw = formData.getAll('scope_cibles') as string[]
  // Conception depuis le plan d'évaluation (Q1) — gate ON uniquement.
  const exerciceId = (formData.get('exercice_id') as string) || null

  if (scopeRaw.length === 0) return { error: 'Sélectionne au moins un contenu.' }
  if (!classeId) return { error: 'Sélectionne une classe.' }

  // C7·L1 — le périmètre est BI-SOURCE : des contenus de bibliothèque (le monde
  // d'aujourd'hui) et, pour une base qui en aurait encore, des unités héritées.
  // `resoudreCible` est aussi le garde-fou anti-spoiler : elle ne rend jamais un
  // LIVRE Aletheia ni un contenu en corbeille → une valeur forgée hors formulaire
  // ne passe pas. Avant ce lot, l'UI proposait `type='unite'` — zéro ligne depuis
  // la réorganisation (§4.1 du RAPPORT_Diagnostic_C7_quazian.md) : le formulaire
  // était vide et cette action refusait toujours faute de sélection.
  const cibles = (await Promise.all(scopeRaw.map((id) => resoudreCible(supabase, id)))).filter((c) => c !== null)
  if (cibles.length !== scopeRaw.length) {
    return { error: 'Un des contenus choisis n’est plus disponible (retiré, ou livre de lecture Aletheia). Refais ta sélection.' }
  }
  const contenuIds = cibles.filter((c) => c.bras === 'contenu').map((c) => c.id)
  const uniteIds = cibles.filter((c) => c.bras === 'unite').map((c) => c.id)

  // Cartes validées PARTAGÉES des contenus choisis — une requête par bras (plutôt
  // qu'un `.or()` à construire par concaténation d'uuid).
  const selectCarte = 'recto, verso, type, concept_tag'
  const [{ data: cartesContenu }, { data: cartesUnite }] = await Promise.all([
    contenuIds.length > 0
      ? supabase.from('quazian_flashcards').select(selectCarte)
          .in('contenu_id', contenuIds).eq('statut', 'valide').is('eleve_id', null)
      : Promise.resolve({ data: [] as { recto: string; verso: string; type: string; concept_tag: string }[] }),
    uniteIds.length > 0
      ? supabase.from('quazian_flashcards').select(selectCarte)
          .in('scriptorium_unite_id', uniteIds).eq('statut', 'valide').is('eleve_id', null)
      : Promise.resolve({ data: [] as { recto: string; verso: string; type: string; concept_tag: string }[] }),
  ])
  const cartes = [...(cartesContenu ?? []), ...(cartesUnite ?? [])]

  if (cartes.length < 5) {
    return { error: `Pas assez de cartes validées dans les contenus sélectionnés (${cartes.length} carte${cartes.length > 1 ? 's' : ''} trouvée${cartes.length > 1 ? 's' : ''}, minimum 5).` }
  }

  // Générer les questions via IA
  let questions
  try {
    questions = await genererQuestions(cartes, Math.min(nbQuestions, cartes.length * 2), classeId)
  } catch (e) {
    console.error('[quazian] génération questions :', e)
    return { error: "La génération IA a échoué (réponse inattendue du modèle). Réessaie." }
  }

  // ── Résolution du semestre ────────────────────────────────────────────────
  // Gate ON + conception depuis le plan (exercice_id) → Q7 : le semestre est celui
  // de la SEMAINE PLANIFIÉE de l'exercice (un quiz de S2 conçu pendant S1 compte en
  // S2), jamais is_active. Sinon (gate OFF, ou chemin direct) → is_active, LEGACY.
  const gateOn = await lireGatePlanActif(admin)
  let semesterId: string
  // Exercice à lier après création (Q2), résolu et validé ici (pré-lecture de confort).
  let exoALier: { id: string } | null = null
  // Q3 chemin direct : exercice à AUTO-CRÉER après la création du quiz.
  let autoCreer: { planId: string; semaineLundi: string } | null = null
  // Signal « pas de plan » (Q3, classe sans plan validé — quiz créé mais non prospectif).
  let avisSansPlan = false

  if (gateOn && exerciceId) {
    const { data: exo } = await admin
      .from('scriptorium_exercices_planifies')
      .select('id, type_exercice, statut, semaine_lundi, quiz_id, scriptorium_plans_evaluation(classe_id)')
      .eq('id', exerciceId)
      .is('supprime_at', null)
      .maybeSingle()
    if (!exo) return { error: "L'exercice planifié est introuvable ou a été retiré du plan." }
    if (exo.type_exercice !== 'quiz') return { error: "Cet exercice planifié n'est pas un quiz." }
    if (exo.statut === 'annule') return { error: 'Cet exercice planifié a été annulé.' }
    if (exo.quiz_id) return { error: 'Un quiz est déjà lié à cet exercice.' }
    const planClasse = un<{ classe_id: string }>(exo.scriptorium_plans_evaluation)?.classe_id ?? null
    if (planClasse !== classeId) return { error: 'La classe du quiz doit être celle du plan de cet exercice.' }
    const sid = await resoudreSemestrePourSemaine(admin, exo.semaine_lundi as string)
    if (!sid) return { error: "La semaine planifiée de cet exercice n'appartient à aucun semestre — recale l'exercice ou définis le semestre dans le Calendrier." }
    semesterId = sid
    exoALier = { id: exo.id as string }
  } else if (gateOn) {
    // Q3 — chemin direct (invariant PO 5 sans blocage). La classe a-t-elle un plan
    // EXPLOITABLE ? = plan validé courant ET couverture non vide. Un plan validé dont
    // la frise est vide (semestres archivés/année révolue, chevauchement bloquant) est
    // traité comme « pas de plan » → legacy + signal (mêmes prédicats côté serveur que
    // côté UI, qui masque le sélecteur quand aucune semaine n'est proposable).
    const plans = await plansValidesCourants(admin)
    const planClasse = plans.find((p) => p.classeId === classeId)
    let lundisCouverts: string[] = []
    if (planClasse) {
      const { data: planRow } = await admin
        .from('scriptorium_plans_evaluation').select('date_debut').eq('id', planClasse.id).maybeSingle()
      if (planRow?.date_debut) {
        const couv = await semainesCouvertes(planRow.date_debut as string)
        lundisCouverts = couv.couvertes.map((w) => w.dateDebutLundi)
      }
    }
    if (planClasse && lundisCouverts.length > 0) {
      // Le prof choisit la semaine prévue → auto-création de l'exercice (origine manuel).
      const semainePrevue = (formData.get('semaine_prevue') as string) || null
      if (!semainePrevue) return { error: 'Choisis la semaine prévue de ce quiz.' }
      // Revalidation serveur : la semaine doit être un LUNDI COUVERT du plan (le
      // sélecteur ne propose que ceux-là ; ferme une valeur forgée hors dropdown et
      // garantit un INSERT conforme — isodow=1, dans la couverture).
      if (!lundisCouverts.includes(semainePrevue)) return { error: 'La semaine choisie ne fait pas partie du plan de cette classe.' }
      const sid = await resoudreSemestrePourSemaine(admin, semainePrevue)
      if (!sid) return { error: "La semaine choisie n'appartient à aucun semestre — choisis-en une autre ou définis le semestre dans le Calendrier." }
      semesterId = sid
      autoCreer = { planId: planClasse.id, semaineLundi: semainePrevue }
    } else {
      // Pas de plan exploitable (aucun plan validé, ou couverture vide) → quiz créé
      // quand même (legacy is_active) + signal.
      const { data: semActif } = await supabase.from('semesters').select('id').eq('is_active', true).maybeSingle()
      if (!semActif) return { error: 'Aucun semestre actif. Définis-en un dans le Calendrier avant de créer un quizz.' }
      semesterId = semActif.id
      avisSansPlan = true
    }
  } else {
    // Gate OFF → LEGACY strictement inchangé. Semestre actif (ancrage notes de
    // semestre). Refuser sinon : un quizz sans semestre n'entrerait dans aucune note.
    const { data: semActif } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()
    if (!semActif) return { error: 'Aucun semestre actif. Définis-en un dans le Calendrier avant de créer un quizz.' }
    semesterId = semActif.id
  }

  // Créer le quizz en brouillon
  const { data: quizz, error: errQuizz } = await supabase
    .from('quazian_quizzes')
    .insert({
      classe_id: classeId,
      semester_id: semesterId,
      statut: 'brouillon',
      scope_unites: uniteIds,
      scope_contenus: contenuIds,
      duree_min: dureeMin,
      nb_questions: questions.length,
    })
    .select('id')
    .single()

  if (errQuizz || !quizz) return { error: errQuizz?.message ?? 'Erreur création quizz' }

  // Insérer les questions
  const rows = questions.map((q) => ({
    quiz_id: quizz.id,
    enonce: q.enonce,
    options: q.options,
    index_correct: q.index_correct,
    concept_tag: q.concept_tag,
    statut_validation: 'suggere',
  }))

  const { error: errQ } = await supabase.from('quazian_questions').insert(rows)
  if (errQ) return { error: errQ.message }

  // ── Liaison au plan (Q2 claim-UPDATE conditionnel) ────────────────────────
  // La pré-lecture ci-dessus est un confort TOCTOU ; SEUL ce claim ferme la course
  // « deux onglets conçoivent le même exercice ». where quiz_id is null → 0 ligne si
  // un autre a gagné → on supprime le quiz frais (encore brouillon, rien n'en dépend).
  if (exoALier) {
    const { data: claimed, error: eClaim } = await admin
      .from('scriptorium_exercices_planifies')
      .update({ quiz_id: quizz.id, updated_at: new Date().toISOString() })
      .eq('id', exoALier.id)
      .is('quiz_id', null)
      .neq('statut', 'annule') // ne pas revendiquer un exercice annulé (symétrie preparerSynthese)
      .is('supprime_at', null)
      .select('id')
    if (eClaim) {
      // Erreur DB transitoire (≠ course perdue) : NE PAS supprimer le quiz (travail IA).
      // Le brouillon reste utilisable ; la liaison au plan pourra être reprise.
      revalidatePath('/prof/quazian/quizz')
      return { success: true, quizId: quizz.id, avis: 'Le quiz est créé, mais sa liaison au plan a échoué (erreur passagère). Ouvre-le ; tu pourras relancer sa conception depuis le plan.' }
    }
    if (!claimed || claimed.length === 0) {
      // Course perdue (un autre onglet a posé quiz_id) : le quiz frais est un doublon
      // inutile, on le supprime (encore brouillon, rien n'en dépend).
      await supabase.from('quazian_questions').delete().eq('quiz_id', quizz.id)
      await supabase.from('quazian_quizzes').delete().eq('id', quizz.id)
      return { error: 'Un quiz vient d’être lié à cet exercice depuis un autre onglet. Ouvre le quiz existant.' }
    }
    // Q4 : statut de conception dérivé (les questions sont encore 'suggere' → a_concevoir).
    await synchroniserStatutExerciceQuiz(admin, quizz.id)
  } else if (autoCreer) {
    // Q3 — auto-création de l'exercice planifié (origine manuel), quiz_id posé d'emblée.
    // La semaine est déjà validée (lundi couvert) → l'INSERT ne peut échouer que sur
    // une erreur passagère, jamais sur une collision de créneau (pas d'index unique
    // applicable à un quiz manuel avec un quiz_id frais).
    const { error: eExo } = await admin.from('scriptorium_exercices_planifies').insert({
      plan_id: autoCreer.planId,
      type_exercice: 'quiz', diagnostique: false, nature: 'evaluatif', lieu: 'classe', module: 'quazian',
      ancrage: 'semaine', semaine_lundi: autoCreer.semaineLundi,
      origine: 'manuel', statut: 'a_concevoir', quiz_id: quizz.id,
    })
    if (eExo) {
      // Le quiz existe et reste utilisable ; seul son rattachement au plan a échoué.
      revalidatePath('/prof/quazian/quizz')
      return { success: true, quizId: quizz.id, avis: 'Le quiz est créé, mais son rattachement au plan a échoué. Tu peux le rattacher depuis la grille du plan.' }
    }
    await synchroniserStatutExerciceQuiz(admin, quizz.id)
  }

  revalidatePath('/prof/quazian/quizz')
  return {
    success: true,
    quizId: quizz.id,
    ...(avisSansPlan ? { avis: 'Cette classe n’a pas de plan annuel exploitable — le quiz n’apparaîtra pas au calendrier prospectif.' } : {}),
  }
}

// Valider une question
export async function validerQuestion(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string

  await supabase
    .from('quazian_questions')
    .update({ statut_validation: 'valide' })
    .eq('id', id)

  // Q4 : re-dérive `concu` de l'exercice lié (no-op gate OFF / quiz hors plan).
  await synchroniserStatutExerciceQuiz(createAdminClient(), quizId)
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Modifier une question manuellement
export async function modifierQuestion(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string
  const enonce = formData.get('enonce') as string
  const opt0 = formData.get('opt0') as string
  const opt1 = formData.get('opt1') as string
  const opt2 = formData.get('opt2') as string
  const opt3 = formData.get('opt3') as string
  const indexCorrect = parseInt(formData.get('index_correct') as string, 10)
  if (!Number.isInteger(indexCorrect) || indexCorrect < 0 || indexCorrect > 3) {
    return { error: 'Réponse correcte invalide (attendu : 0 à 3).' }
  }
  const conceptTag = formData.get('concept_tag') as string

  await supabase
    .from('quazian_questions')
    .update({
      enonce,
      options: [opt0, opt1, opt2, opt3],
      index_correct: indexCorrect,
      concept_tag: conceptTag,
      statut_validation: 'valide',
    })
    .eq('id', id)

  await synchroniserStatutExerciceQuiz(createAdminClient(), quizId) // Q4
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Régénérer les distracteurs d'une question
export async function regenererDisctracteurs(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string

  const { data: question } = await supabase
    .from('quazian_questions')
    .select('enonce, options, index_correct, concept_tag')
    .eq('id', id)
    .single()

  if (!question) return { error: 'Question introuvable' }

  const bonneReponse = question.options[question.index_correct]
  const nouvelle = await regenererQuestion(question.enonce, bonneReponse, question.concept_tag)

  await supabase
    .from('quazian_questions')
    .update({
      options: nouvelle.options,
      index_correct: nouvelle.index_correct,
      statut_validation: 'valide',
    })
    .eq('id', id)

  await synchroniserStatutExerciceQuiz(createAdminClient(), quizId) // Q4
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Valider toutes les questions d'un quizz
export async function validerToutesQuestions(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string

  await supabase
    .from('quazian_questions')
    .update({ statut_validation: 'valide' })
    .eq('quiz_id', quizId)

  await synchroniserStatutExerciceQuiz(createAdminClient(), quizId) // Q4
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Supprimer un quizz (brouillon seulement)
export async function supprimerQuizz(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string

  const { data: q } = await supabase
    .from('quazian_quizzes')
    .select('statut')
    .eq('id', id)
    .single()

  if (q?.statut !== 'brouillon') return { error: 'Seuls les brouillons peuvent être supprimés.' }

  // Q5 : l'exercice planifié lié retombe `a_concevoir` (gate ON). Fait AVANT le DELETE,
  // tant que quiz_id pointe encore le quiz ; le `on delete set null` de la FK n'est que
  // le filet (il nettoierait quiz_id mais laisserait le statut `concu` obsolète).
  // `.neq('statut','annule')` : ne JAMAIS ressusciter un tombstone (un exercice annulé
  // reste annulé ; sa FK quiz_id est nettoyée par le on delete set null au DELETE).
  const admin = createAdminClient()
  if (await lireGatePlanActif(admin)) {
    await admin
      .from('scriptorium_exercices_planifies')
      .update({ statut: 'a_concevoir', concu_at: null, quiz_id: null, updated_at: new Date().toISOString() })
      .eq('quiz_id', id)
      .is('supprime_at', null)
      .neq('statut', 'annule')
  }

  await supabase.from('quazian_quizzes').delete().eq('id', id)

  revalidatePath('/prof/quazian/quizz')
  return { success: true }
}
