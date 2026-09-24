'use server'

import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { genererQuestions, regenererQuestion, genererQuestionsSupplementaires, normaliserDemandeQuestions } from '@/utils/generer-questions'
import { lireGatePlanActif, plansValidesCourants, synchroniserStatutExerciceQuiz, resoudreSemestrePourSemaine } from '@/utils/plan-exercices'
import { semainesCouvertes } from '@/app/prof/scriptorium/evaluations/plan-serveur'
import { resoudreCible } from '@/utils/quazian-cibles'
import { classeAModule } from '@/utils/acces'
import { lireAntichambreAt, lirePorteAntichambre } from '@/utils/quazian-antichambre-serveur'
import { phraseEcartees } from '@/utils/quazian-controle-questions'
import type { Generation, QuestionEcartee } from '@/utils/generer-questions'

// L'antichambre ouverte (22/09) fige le brouillon : des élèves attendent devant
// ce quiz. Tolérant — porte fermée ou colonne absente ⇒ pas d'antichambre.
async function antichambreOuverte(quizId: string): Promise<boolean> {
  const admin = createAdminClient()
  return (await lirePorteAntichambre(admin)) && !!(await lireAntichambreAt(admin, quizId))
}
const REFUS_ANTICHAMBRE = 'L’antichambre de ce quiz est ouverte : referme-la avant de le modifier.'

/**
 * La garde des gestes qui RÉÉCRIVENT une question (revue du 23/09). Avant, seul
 * l'écran les cachait : un onglet resté ouvert pouvait « Modifier » ou tirer de
 * « Nouveaux distracteurs » sur un quiz LANCÉ — et depuis le remêlage à
 * l'enregistrement, la bonne réponse y change de place alors que les points des
 * élèves sont enregistrés par position. Brouillon seulement, antichambre fermée.
 */
async function refusSiNonModifiable(
  supabase: Awaited<ReturnType<typeof createClient>>, quizId: string, id: string,
): Promise<string | null> {
  const { data: q, error } = await supabase
    .from('quazian_questions').select('quiz_id, quazian_quizzes!inner(statut)').eq('id', id).maybeSingle()
  if (error || !q) return 'Question introuvable.'
  if (q.quiz_id !== quizId) return 'Cette question ne fait plus partie de ce quiz.'
  const statut = (q.quazian_quizzes as unknown as { statut: string } | { statut: string }[])
  const s = Array.isArray(statut) ? statut[0]?.statut : statut?.statut
  if (s !== 'brouillon') return 'Seul un brouillon se modifie.'
  if (await antichambreOuverte(quizId)) return REFUS_ANTICHAMBRE
  return null
}

// 23/09 — ce que le contrôle des questions générées dit au professeur. Un lot
// entièrement écarté porte ses motifs (`AucuneQuestionRetenue`) : ce n'est pas
// une panne du modèle. Reconnu par sa forme, pas par `instanceof`.
function ecarteesDe(e: unknown): QuestionEcartee[] | null {
  const ecartees = (e as { ecartees?: unknown } | null)?.ecartees
  return Array.isArray(ecartees) && ecartees.length > 0 ? ecartees as QuestionEcartee[] : null
}
function bilanControle(g: Generation): string {
  return [
    phraseEcartees(g.ecartees),
    g.relecture ? '' : 'La relecture automatique n’a pas pu vérifier tous les énoncés : relis les mises en situation avant de valider.',
  ].filter(Boolean).join(' ')
}

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

async function cartesDuPerimetre(supabase: SupabaseClient, contenuIds: string[], uniteIds: string[]) {
  const selectCarte = 'recto, verso, type, concept_tag'
  const [contenus, unites] = await Promise.all([
    contenuIds.length > 0
      ? supabase.from('quazian_flashcards').select(selectCarte)
          .in('contenu_id', contenuIds).eq('statut', 'valide').is('eleve_id', null)
      : Promise.resolve({ data: [], error: null }),
    uniteIds.length > 0
      ? supabase.from('quazian_flashcards').select(selectCarte)
          .in('scriptorium_unite_id', uniteIds).eq('statut', 'valide').is('eleve_id', null)
      : Promise.resolve({ data: [], error: null }),
  ])
  return { cartes: [...(contenus.data ?? []), ...(unites.data ?? [])], error: contenus.error ?? unites.error }
}

async function actualiserNombreQuestions(supabase: SupabaseClient, quizId: string) {
  const compter = () => supabase
    .from('quazian_questions').select('id', { count: 'exact', head: true }).eq('quiz_id', quizId)
  let lecture = await compter()
  let erreur: string | null = null
  for (;;) {
    if (lecture.error || lecture.count === null) {
      erreur = 'Les questions ont changé, mais leur nombre n’a pas pu être relu.'
      break
    }
    const nombre = lecture.count
    const { error } = await supabase.from('quazian_quizzes').update({ nb_questions: nombre }).eq('id', quizId)
    if (error) {
      erreur = 'Les questions ont changé, mais leur compteur n’a pas pu être enregistré.'
      break
    }
    // Deux onglets peuvent ajouter ensemble : un ancien UPDATE peut finir après
    // le plus récent. Relire le COUNT après l'écriture et reprendre s'il a changé.
    lecture = await compter()
    if (!lecture.error && lecture.count === nombre) break
  }
  await synchroniserStatutExerciceQuiz(createAdminClient(), quizId)
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  revalidatePath('/prof/quazian/quizz')
  return erreur
}

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
  // Accès & classes · L1 — on ne conçoit pas pour une classe qui n'a pas Quazian.
  if (!(await classeAModule(supabase, classeId, 'quazian'))) {
    return { error: 'Cette classe n’a pas le module Quazian. Donne-lui le module depuis sa fiche, ou choisis une autre classe.' }
  }

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
  const { cartes, error: erreurCartes } = await cartesDuPerimetre(supabase, contenuIds, uniteIds)
  if (erreurCartes) return { error: 'Impossible de lire les cartes des contenus sélectionnés.' }

  if (cartes.length < 5) {
    return { error: `Pas assez de cartes validées dans les contenus sélectionnés (${cartes.length} carte${cartes.length > 1 ? 's' : ''} trouvée${cartes.length > 1 ? 's' : ''}, minimum 5).` }
  }

  // Générer les questions via IA — contrôlées (23/09) : ce qui échoue au contrôle
  // après une réécriture est écarté, et le professeur en est averti.
  let questions
  let avisControle = ''
  try {
    const demandees = Math.min(nbQuestions, cartes.length * 2)
    const generation = await genererQuestions(cartes, demandees, classeId)
    questions = generation.questions
    if (generation.ecartees.length > 0) {
      avisControle = `Quiz créé avec ${questions.length} question${questions.length > 1 ? 's' : ''} sur ${demandees} : ${bilanControle(generation)} Tu peux en ajouter depuis le quiz.`
    } else if (!generation.relecture) {
      avisControle = bilanControle(generation)
    }
  } catch (e) {
    console.error('[quazian] génération questions :', e)
    const ecartees = ecarteesDe(e)
    if (ecartees) return { error: `Aucune question n’a été retenue : ${phraseEcartees(ecartees)} Réessaie.` }
    return { error: "La génération IA a échoué (réponse inattendue du modèle). Réessaie." }
  }
  const avec = (...avis: (string | false)[]) => avis.filter(Boolean).join(' ') || undefined

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
      return { success: true, quizId: quizz.id, avis: avec('Le quiz est créé, mais sa liaison au plan a échoué (erreur passagère). Ouvre-le ; tu pourras relancer sa conception depuis le plan.', avisControle) }
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
      return { success: true, quizId: quizz.id, avis: avec('Le quiz est créé, mais son rattachement au plan a échoué. Tu peux le rattacher depuis la grille du plan.', avisControle) }
    }
    await synchroniserStatutExerciceQuiz(admin, quizz.id)
  }

  revalidatePath('/prof/quazian/quizz')
  const avis = avec(avisSansPlan && 'Cette classe n’a pas de plan annuel exploitable — le quiz n’apparaîtra pas au calendrier prospectif.', avisControle)
  return { success: true, quizId: quizz.id, ...(avis ? { avis } : {}) }
}

// Refuser retire réellement la question ; aucun lecteur élève ne filtre un statut « refusé ».
export async function refuserQuestion(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string
  const { data: quiz, error: erreurQuiz } = await supabase
    .from('quazian_quizzes').select('statut').eq('id', quizId).single()
  if (erreurQuiz) return { error: 'Impossible de lire le quiz.' }
  if (quiz?.statut !== 'brouillon') return { error: 'Seul un brouillon se modifie.' }
  if (await antichambreOuverte(quizId)) return { error: REFUS_ANTICHAMBRE }

  const { data, error } = await supabase.from('quazian_questions')
    .delete().eq('quiz_id', quizId).eq('id', id).select('id')
  if (error) return { error: error.code === '23503' ? 'Cette question a déjà été répondue.' : 'La question n’a pas pu être refusée.' }
  if (!data?.length) return { error: 'Cette question ne fait plus partie de ce quiz.' }
  const erreur = await actualiserNombreQuestions(supabase, quizId)
  return erreur ? { error: erreur } : { success: true }
}

export async function ajouterQuestions(formData: FormData) {
  const { supabase } = await verifierProf()
  const quizId = formData.get('quizId') as string
  const { data: quiz, error: erreurQuiz } = await supabase
    .from('quazian_quizzes').select('statut, scope_contenus, scope_unites, classe_id').eq('id', quizId).single()
  if (erreurQuiz) return { error: 'Impossible de lire le quiz.' }
  if (quiz?.statut !== 'brouillon') return { error: 'Seul un brouillon se modifie.' }
  if (await antichambreOuverte(quizId)) return { error: REFUS_ANTICHAMBRE }
  const demande = normaliserDemandeQuestions(formData.get('nb'), formData.get('consigne'))
  if ('error' in demande) return { error: demande.error }

  const { cartes, error: erreurCartes } = await cartesDuPerimetre(supabase, quiz.scope_contenus ?? [], quiz.scope_unites ?? [])
  if (erreurCartes) return { error: 'Impossible de lire les cartes du périmètre du quiz.' }
  if (cartes.length < 5) return { error: `Pas assez de cartes validées dans le périmètre (${cartes.length}, minimum 5).` }
  const { data: dejaPosees, error: erreurQuestions } = await supabase
    .from('quazian_questions').select('enonce, concept_tag').eq('quiz_id', quizId).order('created_at', { ascending: true })
  if (erreurQuestions) return { error: 'Impossible de lire les questions déjà posées.' }

  let questions
  let ecartees = ''
  try {
    const generation = await genererQuestionsSupplementaires(cartes, demande.nb, dejaPosees ?? [], demande.consigne, quiz.classe_id)
    questions = generation.questions
    ecartees = bilanControle(generation)
  } catch (e) {
    console.error('[quazian] questions supplémentaires :', e)
    const motifs = ecarteesDe(e)
    if (motifs) return { error: `Aucune question n’a été retenue : ${phraseEcartees(motifs)} Réessaie.` }
    return { error: 'La génération IA n’a rendu aucune question exploitable. Réessaie.' }
  }
  // L'appel IA est long : le brouillon doit encore être modifiable à son retour.
  const { data: actuel, error: erreurStatut } = await supabase
    .from('quazian_quizzes').select('statut').eq('id', quizId).single()
  if (erreurStatut) return { error: 'Impossible de relire le quiz ; aucune question ajoutée.' }
  if (actuel?.statut !== 'brouillon') return { error: 'Seul un brouillon se modifie.' }
  // L'antichambre a pu s'ouvrir pendant l'appel IA (20 à 60 s) : pas de question
  // non relue devant des élèves qui attendent (revue du 22/09).
  if (await antichambreOuverte(quizId)) return { error: REFUS_ANTICHAMBRE }
  const { error } = await supabase.from('quazian_questions').insert(
    questions.map((q) => ({ ...q, quiz_id: quizId, statut_validation: 'suggere' })),
  )
  if (error) return { error: 'Les questions générées n’ont pas pu être enregistrées.' }
  const erreur = await actualiserNombreQuestions(supabase, quizId)
  if (erreur) return { error: erreur }
  return { success: true, message: `${questions.length} question${questions.length > 1 ? 's' : ''} ajoutée${questions.length > 1 ? 's' : ''} sur ${demande.nb} demandée${demande.nb > 1 ? 's' : ''}.${ecartees ? ' ' + ecartees : ''}` }
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
  const texte = (cle: string) => String(formData.get(cle) ?? '').trim()
  const enonce = texte('enonce')
  const options = [0, 1, 2, 3].map((i) => texte(`opt${i}`))
  const indexCorrect = parseInt(formData.get('index_correct') as string, 10)
  if (!Number.isInteger(indexCorrect) || indexCorrect < 0 || indexCorrect > 3) {
    return { error: 'Réponse correcte invalide (attendu : 0 à 3).' }
  }
  // 23/09 — une réponse vide passait, et s'affichait telle quelle aux élèves ;
  // deux réponses identiques aussi (« Kant » et « kant ») : une seule rapportait.
  if (!enonce || options.some((o) => !o)) {
    return { error: 'L’énoncé et les quatre réponses doivent être remplis.' }
  }
  if (new Set(options.map((o) => o.toLocaleLowerCase('fr'))).size < options.length) {
    return { error: 'Deux réponses sont identiques : l’élève ne pourrait pas les distinguer.' }
  }
  const refus = await refusSiNonModifiable(supabase, quizId, id)
  if (refus) return { error: refus }

  // supabase-js ne lève pas : l'échec d'une écriture se LIT. Avant (revue du
  // 23/09), une modification perdue répondait « succès ».
  const { data, error } = await supabase
    .from('quazian_questions')
    .update({
      enonce,
      options,
      index_correct: indexCorrect,
      concept_tag: texte('concept_tag'),
      statut_validation: 'valide',
    })
    .eq('id', id)
    .eq('quiz_id', quizId)
    .select('id')
  if (error) return { error: 'La modification n’a pas pu être enregistrée. Réessaie.' }
  if (!data?.length) return { error: 'Cette question ne fait plus partie de ce quiz.' }

  await synchroniserStatutExerciceQuiz(createAdminClient(), quizId) // Q4
  revalidatePath(`/prof/quazian/quizz/${quizId}`)
  return { success: true }
}

// Régénérer les distracteurs d'une question
export async function regenererDisctracteurs(formData: FormData) {
  const { supabase } = await verifierProf()
  const id = formData.get('id') as string
  const quizId = formData.get('quizId') as string
  const refus = await refusSiNonModifiable(supabase, quizId, id)
  if (refus) return { error: refus }

  const { data: question } = await supabase
    .from('quazian_questions')
    .select('enonce, options, index_correct, concept_tag')
    .eq('id', id)
    .single()

  if (!question) return { error: 'Question introuvable' }

  const bonneReponse = question.options[question.index_correct]
  // Un échec du modèle se DIT comme tel (revue du 23/09) : l'exception remontait
  // à la carte, qui parlait d'une panne de connexion.
  let nouvelle
  try {
    nouvelle = await regenererQuestion(question.enonce, bonneReponse, question.concept_tag)
  } catch (e) {
    console.error('[quazian] nouveaux distracteurs :', e)
    return { error: 'La génération des nouveaux distracteurs a échoué. Réessaie.' }
  }
  // L'appel IA dure 5 à 30 s : le quiz a pu être lancé entre-temps. On relit
  // AVANT d'écrire — sinon des élèves répondraient à une question dont la bonne
  // réponse change de place sous leurs points (revue finale du 23/09).
  const refusApres = await refusSiNonModifiable(supabase, quizId, id)
  if (refusApres) return { error: refusApres }

  // L'écriture se LIT, comme dans `modifierQuestion`.
  const { data: ecrites, error } = await supabase
    .from('quazian_questions')
    .update({
      options: nouvelle.options,
      index_correct: nouvelle.index_correct,
      statut_validation: 'valide',
    })
    .eq('id', id)
    .eq('quiz_id', quizId)
    .select('id')
  if (error) return { error: 'Les nouveaux distracteurs n’ont pas pu être enregistrés. Réessaie.' }
  if (!ecrites?.length) return { error: 'Cette question ne fait plus partie de ce quiz.' }

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
  if (await antichambreOuverte(id)) return { error: 'L’antichambre de ce quiz est ouverte : referme-la avant de le supprimer.' }

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
