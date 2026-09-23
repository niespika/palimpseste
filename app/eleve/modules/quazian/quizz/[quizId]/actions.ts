'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classeIdsActives } from '@/utils/acces'
import { calculerScoreBrier, JETONS_NEUTRE, shuffleArray } from '@/utils/brier'
import { lancer } from '@/utils/lancer'
import { remettreDansOrdreEleve, type QuestionRetourEleve } from '@/utils/quazian-ordre-eleve'

async function verifierEleve() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'eleve') throw new Error('Accès refusé')
  return { supabase, userId: user.id }
}

// Garde de classe (C1/A4 — le correctif du bug 0.3 étendu au quiz individuel) :
// le quizz doit appartenir à une classe où l'élève a une inscription ACTIVE —
// même scoping que la liste (`.in('classe_id', classeIds)` de page.tsx). Un
// quizz d'une autre classe (ou sans classe) → null, refus propre sans données.
// Défense applicative EN PLUS de la RLS SELECT (le socle quazian pré-lot1
// n'est pas versionné, ses policies peuvent être plus larges).
async function chargerQuizAccessible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  quizId: string
) {
  // 17/09 — le quizz et les inscriptions ne dépendent pas l'un de l'autre : cette
  // garde joue à chaque réponse enregistrée, les deux lectures partent ensemble.
  const [{ data: quizz }, classeIds] = await Promise.all([
    supabase
      .from('quazian_quizzes')
      .select('statut, ferme_at, classe_id, moyenne_cohorte, ecart_type_cohorte')
      .eq('id', quizId)
      .single(),
    classeIdsActives(supabase, userId),
  ])
  if (!quizz) return null
  if (!quizz.classe_id || !classeIds.includes(quizz.classe_id as string)) return null
  return quizz
}

export interface QuestionPassation {
  id: string             // id de la question originale
  enonce: string
  options: string[]      // dans l'ordre randomisé pour cet élève
  // ⛔⛔ PLUS D'`optionMapping` ICI — revue du 22/09. L'ordre du mélange partait
  //    au navigateur ; tant que la bonne réponse était en tête en base (15 sur 15
  //    en prod), « la réponse dont le mapping vaut 0 » ÉTAIT la bonne réponse,
  //    lisible dans le source de la page. Le serveur relit l'ordre de la session.
  //    (Les réponses sont aussi remêlées en base : `melangerReponses`.)
  // ⛔⛔ PAS DE BONNE RÉPONSE ICI — C-RLS-4, 29/08. Le champ
  //    `indexCorrecteRandomise` a vécu là, servi à la PASSATION, donc lisible
  //    AVANT de répondre : la charge de l'action part au navigateur, où elle
  //    se lit. *Il n'était consommé nulle part* — son commentaire annonçait
  //    « pour le retour post-quizz », mais le retour passe par
  //    `chargerRetourQuizz`, qui a ses propres gardes (soumis ET quizz fermé).
  //    Le retirer est donc une SUPPRESSION, pas un arbitrage.
}

export interface DonneesPassation {
  sessionId: string
  questions: QuestionPassation[]
  reponsesExistantes: Record<string, [number, number, number, number]>
  soumis: boolean
  quizFerme: boolean
}

// Initialiser ou récupérer la session d'un élève
export async function initialiserSession(quizId: string): Promise<DonneesPassation | { error: string }> {
  const { supabase, userId } = await verifierEleve()

  const quizz = await chargerQuizAccessible(supabase, userId, quizId)
  if (!quizz) return { error: 'Quizz introuvable' }
  if (quizz.statut === 'brouillon') return { error: 'Ce quizz n\'est pas encore lancé.' }

  const quizFerme = quizz.statut === 'ferme'

  // Session existante ?
  const { data: sessionExist } = await supabase
    .from('quazian_sessions')
    .select('id, ordre_questions, ordre_options, submitted_at')
    .eq('quiz_id', quizId)
    .eq('eleve_id', userId)
    .maybeSingle()

  // Lecture serveur (C1 · C-RLS-4) : plus aucune policy de LECTURE élève sur
  // `quazian_questions` — la ligne entière portait `index_correct`, et une
  // policy RLS ne restreint pas les colonnes. La garde est le code, et c'est
  // `chargerQuizAccessible` ci-dessus (la classe de l'élève), plus stricte que
  // la policy qu'elle remplace : celle-là ne vérifiait pas la classe.
  // ⛔ NE PAS y ajouter `index_correct` : cette charge part au navigateur.
  const { data: questions, error: eQuestions } = await createAdminClient()
    .from('quazian_questions')
    .select('id, enonce, options')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true })

  // ⚠️ UNE PANNE N'EST PAS UN VIDE. `supabase-js` NE LÈVE PAS : sans ce test,
  //    une lecture en échec rendait `data: null` et l'élève lisait « Aucune
  //    question trouvée » — le message d'un quizz mal conçu pour ce qui est une
  //    panne de lecture. Les deux cas se disent maintenant séparément.
  if (eQuestions) return { error: `Lecture des questions impossible : ${eQuestions.message}` }
  if (!questions || questions.length === 0) return { error: 'Aucune question trouvée.' }

  let sessionId: string
  let ordreQuestions: string[]
  let ordreOptions: Record<string, number[]>

  if (sessionExist) {
    sessionId = sessionExist.id
    ordreQuestions = sessionExist.ordre_questions as string[]
    ordreOptions = sessionExist.ordre_options as Record<string, number[]>
  } else {
    if (quizFerme) return { error: 'Ce quizz est terminé.' }

    // Créer la session avec randomisation par élève
    // ⛔ Graine ALÉATOIRE (revue du 23/09) : l'ancienne (`userId + id`) se
    //    recalculait avec le code du dépôt, public — et `ordre_options` est de
    //    toute façon stocké dans la session : la graine n'a pas à se rejouer.
    ordreQuestions = shuffleArray(questions.map((q) => q.id), crypto.randomUUID())
    ordreOptions = {}
    for (const q of questions) {
      ordreOptions[q.id] = shuffleArray([0, 1, 2, 3], crypto.randomUUID())
    }

    // Écriture serveur (C1) : plus aucune policy d'écriture élève sur
    // quazian_sessions — l'insert passe par le client admin, gardé par la
    // garde de classe ci-dessus (chargerQuizAccessible).
    const { data: nouvelleSession, error } = await createAdminClient()
      .from('quazian_sessions')
      .insert({
        quiz_id: quizId,
        eleve_id: userId,
        started_at: new Date().toISOString(),
        ordre_questions: ordreQuestions,
        ordre_options: ordreOptions,
        est_rattrapage: false,
      })
      .select('id')
      .single()

    if (error || !nouvelleSession) return { error: 'Erreur création session' }
    sessionId = nouvelleSession.id
  }

  // Réponses existantes
  const { data: reponsesDB, error: erreurReponses } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d')
    .eq('session_id', sessionId)
  if (erreurReponses) return { error: 'Lecture de tes réponses impossible. Recharge la page pour réessayer.' }

  const reponsesMap: Record<string, [number, number, number, number]> = {}
  for (const r of reponsesDB ?? []) {
    // Points ENTIERS : 0,55 × 100 vaut 55,00000000000001 en JS — la question
    // rechargée ne faisait plus 100 tout rond, et « Suivant » restait bloqué.
    const originaux = [r.p_a, r.p_b, r.p_c, r.p_d].map((p) => Math.round(p * 100))
    const mapping = ordreOptions[r.question_id] ?? [0, 1, 2, 3]
    reponsesMap[r.question_id] = mapping.map((i) => originaux[i]) as [number, number, number, number]
  }

  // Construire les questions dans l'ordre randomisé
  const qMap: Record<string, typeof questions[0]> = {}
  for (const q of questions) qMap[q.id] = q

  const questionsPassation: QuestionPassation[] = ordreQuestions.map((qId) => {
    const q = qMap[qId]
    const mapping = ordreOptions[qId] ?? [0, 1, 2, 3]
    const optionsRandomisees = mapping.map((i) => q.options[i])

    return {
      id: q.id,
      enonce: q.enonce,
      options: optionsRandomisees,
    }
  })

  return {
    sessionId,
    questions: questionsPassation,
    reponsesExistantes: reponsesMap,
    soumis: !!sessionExist?.submitted_at,
    quizFerme,
  }
}

// Sauvegarder la réponse à une question (jetons dans l'ordre randomisé)
export async function sauvegarderReponse(
  sessionId: string,
  questionId: string,
  jetonsRandomises: [number, number, number, number],
  // Ignoré : un onglet ouvert avant le déploiement l'envoie encore. L'ordre fait
  // foi depuis la SESSION, jamais depuis le navigateur.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mappingIgnore?: unknown,
): Promise<{ error?: string; ferme?: boolean }> {
  const { supabase, userId } = await verifierEleve()
  if (!Array.isArray(jetonsRandomises) || jetonsRandomises.length !== 4
      || jetonsRandomises.some((j) => !Number.isFinite(j) || j < 0 || j > 100)
      || Math.abs(jetonsRandomises.reduce((a, b) => a + b, 0) - 100) > 0.001) {
    return { error: 'Répartis les 100 points avant de continuer.' }
  }

  // Garde serveur : aucune écriture après soumission, fermeture du quizz ou échéance.
  // Le timer / l'auto-submit côté client ne protègent rien (l'action est appelable
  // directement) → sans ça, un élève peut éditer ses réponses après l'expiration.
  const { data: session, error: erreurSession } = await supabase
    .from('quazian_sessions')
    .select('quiz_id, submitted_at, ordre_options')
    .eq('id', sessionId)
    .eq('eleve_id', userId)
    .maybeSingle()
  if (erreurSession) return { error: 'Lecture de ta session impossible. Réessaie.' }
  if (!session || session.submitted_at) return { error: 'Cette session n’est plus modifiable.' }
  // L'ordre des réponses de CETTE question pour CET élève : celui de sa session.
  // Une question que la session ne connaît pas n'est pas la sienne.
  const optionMapping = (session.ordre_options as Record<string, number[]> | null)?.[questionId]
  if (!Array.isArray(optionMapping) || optionMapping.length !== 4 || new Set(optionMapping).size !== 4
      || optionMapping.some((i) => !Number.isInteger(i) || i < 0 || i > 3)) {
    return { error: 'Cette question ne fait pas partie de ton quiz.' }
  }
  // Garde de classe (C1) en plus du statut/échéance : même helper que la page.
  const quizzGarde = await chargerQuizAccessible(supabase, userId, session.quiz_id as string)
  if (!quizzGarde) return { error: 'Quizz inaccessible. Réessaie.' }
  if (quizzGarde.statut !== 'lance' || (quizzGarde.ferme_at && new Date(quizzGarde.ferme_at as string) <= new Date())) {
    return { error: 'Le temps est écoulé. Seules les réponses déjà enregistrées seront soumises.', ferme: true }
  }

  // Remettre dans l'ordre original
  const jetonsOriginaux: [number, number, number, number] = [0, 0, 0, 0]
  for (let i = 0; i < 4; i++) {
    jetonsOriginaux[optionMapping[i]] = jetonsRandomises[i]
  }

  const [pa, pb, pc, pd] = jetonsOriginaux.map((j) => j / 100)

  // Écriture serveur (C1) : quazian_answers n'a plus de policy d'écriture
  // élève — l'upsert passe par le client admin, la propriété de la session et
  // l'état du quizz ayant été revalidés ci-dessus.
  const { error } = await createAdminClient().from('quazian_answers').upsert({
    session_id: sessionId,
    question_id: questionId,
    p_a: pa,
    p_b: pb,
    p_c: pc,
    p_d: pd,
    repondu: true,
  }, { onConflict: 'session_id,question_id' })
  return error ? { error: 'Ta réponse n’a pas été enregistrée. Réessaie.' } : {}
}

// Soumettre le quizz
export async function soumettreQuizz(sessionId: string, quizId: string): Promise<{ error?: string }> {
  const { supabase, userId } = await verifierEleve()
  const admin = createAdminClient()

  const maintenant = new Date().toISOString()

  // Stats cohorte (figées si quizz déjà fermé), chargées une fois et réutilisées plus bas.
  // Garde de classe (C1) incluse : un quizz hors-classe → refus avant toute écriture.
  // 17/09 — les questions partent en même temps que la garde : deux LECTURES, toutes
  // deux avant le verrou, et leurs refus sont lus dans l'ordre d'avant.
  const pQuestions = lancer(admin
    .from('quazian_questions')
    .select('id, index_correct')
    .eq('quiz_id', quizId))
  const quizz = await chargerQuizAccessible(supabase, userId, quizId)
  if (!quizz) return { error: 'Quizz introuvable' }

  // ⛔⛔ LES QUESTIONS SE LISENT AVANT LE VERROU, ET C'EST L'ORDRE QUI COMPTE.
  //    Elles étaient lues APRÈS : une lecture en échec laissait alors l'élève
  //    `submitted_at` posé, SANS note, devant un écran de succès — et le
  //    compare-and-set `.is('submitted_at', null)` lui interdisait de
  //    recommencer. *On s'arrête avant de figer quoi que ce soit* — c'est la
  //    doctrine que `fermerQuizz` écrit déjà pour le professeur.
  // ⭐ Aucune course : les questions d'un quizz ne bougent pas pendant la
  //    passation, contrairement aux réponses, dont l'instantané a besoin du
  //    verrou (`sauvegarderReponse` refuse dès que `submitted_at` est posé).
  const { data: questions, error: eQuestions } = await pQuestions

  if (eQuestions) return { error: `Lecture des questions impossible : ${eQuestions.message}` }
  // ⚠️ `length === 0` autant que `null` : `scoreMoyen /= questions.length`
  //    écrirait un NaN. La garde jumelle existe dans `fermerQuizz`, elle
  //    manquait ici — et elle ne pouvait pas s'y trouver tant que la lecture
  //    venait après le verrou, puisqu'il était déjà trop tard pour refuser.
  if (questions.length === 0) return { error: 'Ce quizz n’a aucune question — rien à noter.' }

  // Verrou one-shot : marquer la session soumise SEULEMENT si elle appartient à l'élève et
  // n'est pas déjà soumise (compare-and-set sur submitted_at IS NULL). Empêche un re-scoring
  // après coup (re-soumission pour améliorer son score) et la double soumission.
  // Écriture serveur (C1) : le client admin bypasse la RLS → le compare-and-set
  // `.eq('eleve_id', userId)` reste la garde de propriété, NE PAS le retirer.
  const { data: verrou } = await admin
    .from('quazian_sessions')
    .update({ submitted_at: maintenant, auto_submitted: false })
    .eq('id', sessionId)
    .eq('eleve_id', userId)
    // ⛔ LA SESSION DOIT ÊTRE CELLE DU QUIZZ NOTÉ, PAS D'UN AUTRE. Sans ce
    //    `.eq('quiz_id', quizId)`, un élève appelait `soumettreQuizz(sessionD'unQuizX,
    //    Y)` : le verrou passait (la session est bien à lui), les questions
    //    chargées étaient celles de Y, les réponses celles de X — aucune ne
    //    correspondait, et l'upsert écrasait sa note de Y par un score de
    //    « tout non répondu ». La note se pose désormais sur le quizz de la session.
    .eq('quiz_id', quizId)
    .is('submitted_at', null)
    .select('id')
  if (!verrou || verrou.length === 0) return {} // déjà soumise, pas la sienne, ou pas ce quizz

  // Récupérer les réponses de cette session.
  // ⛔ CELLE-CI NE PEUT PAS REMONTER AVANT LE VERROU : c'est lui qui fige
  //    l'instantané — `sauvegarderReponse` n'écrit plus une fois `submitted_at`
  //    posé. Lire avant, ce serait manquer la dernière réponse de l'élève.
  // ⭐ Alors son échec RELÂCHE le verrou, plutôt que de noter un élève sur des
  //    réponses qu'on n'a pas lues : sans ce rattrapage, `repMap` restait vide
  //    et les six questions étaient notées aux JETONS_NEUTRE, en silence.
  const { data: reponses, error: eReponses } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d, repondu')
    .eq('session_id', sessionId)

  if (eReponses) {
    // ⚠️ On ne relâche QUE le verrou qu'on vient de poser : le
    //    `.eq('submitted_at', maintenant)` garantit qu'aucune autre écriture
    //    n'est écrasée. Le quizz redevient ouvert — un état réparable.
    await admin
      .from('quazian_sessions')
      .update({ submitted_at: null })
      .eq('id', sessionId)
      .eq('eleve_id', userId)
      .eq('submitted_at', maintenant)
    return { error: `Lecture des réponses impossible : ${eReponses.message} — ta soumission n’a pas été enregistrée, réessaie.` }
  }

  const repMap: Record<string, typeof reponses extends (infer T)[] | null ? T : never> = {}
  for (const r of reponses ?? []) repMap[r.question_id] = r

  let scoreMoyen = 0
  const answersToInsert: Record<string, unknown>[] = []
  const answersToUpdate = []

  // ⛔⛔ PAS DE SCORE PAR RÉPONSE TANT QUE LE QUIZ TOURNE (revue du 23/09). La
  //    policy élève laisse lire SES réponses, colonnes comprises : un élève qui
  //    soumettait en avance lisait son `score` par question — et avec ses propres
  //    points, le score DÉSIGNE la bonne réponse (10 × (2·p_bonne − Σp²)), qu'il
  //    pouvait passer aux autres. Les scores par réponse s'écrivent à la
  //    FERMETURE (`fermerQuizz`) ; la note, elle, se calcule ici, en mémoire
  //    (une seule moyenne ne trahit aucune question). Quiz déjà fermé : tout de suite.
  const scoresTout = quizz.statut !== 'lance'
  for (const q of questions) {
    const rep = repMap[q.id]
    let jetons: [number, number, number, number] = JETONS_NEUTRE

    if (rep) {
      jetons = [rep.p_a * 100, rep.p_b * 100, rep.p_c * 100, rep.p_d * 100]
    }

    const score = calculerScoreBrier(jetons, q.index_correct)
    scoreMoyen += score

    if (!rep) {
      answersToInsert.push({
        session_id: sessionId,
        question_id: q.id,
        p_a: 0.25, p_b: 0.25, p_c: 0.25, p_d: 0.25,
        repondu: false,
        ...(scoresTout ? { brier_brut: score / 10, score } : {}),
      })
    } else if (scoresTout) {
      answersToUpdate.push({ question_id: q.id, brier_brut: score / 10, score })
    }
  }

  scoreMoyen /= questions.length

  // Écritures serveur (C1) : la session vient d'être verrouillée au nom de
  // l'élève — les scores s'écrivent en admin (plus de policy d'écriture élève).
  // 17/09 — les MÊMES écritures, par paquets : chacune porte sur sa propre ligne
  // (`session_id`, `question_id`), aucune ne dépend d'une autre. En série, c'était
  // un aller-retour par question répondue avant que l'élève voie « soumis ».
  // ⚠️ Par SIX, pas toutes à la fois : une classe entière soumet dans la même minute,
  //    et trente élèves × vingt questions d'un coup, c'est une rafale que la base
  //    n'a pas à encaisser.
  // ⚠️ supabase-js NE LÈVE PAS, et ces écritures n'ont jamais été contrôlées : un
  //    score par réponse resté à NULL ne se voyait nulle part. On le dit au journal —
  //    la NOTE, elle, se calcule en mémoire ci-dessous et n'en dépend pas.
  const ecritures = [
    ...(answersToInsert.length > 0
      ? [() => admin.from('quazian_answers').insert(answersToInsert)] : []),
    ...answersToUpdate.map((a) => () => admin.from('quazian_answers')
      .update({ brier_brut: a.brier_brut, score: a.score })
      .eq('session_id', sessionId)
      .eq('question_id', a.question_id)),
  ]
  for (let i = 0; i < ecritures.length; i += 6) {
    const resultats = await Promise.all(ecritures.slice(i, i + 6).map((ecrire) => ecrire()))
    for (const r of resultats) {
      if (r.error) console.error(`[quazian] score par réponse NON ÉCRIT (session ${sessionId}) — ${r.error.code} ${r.error.message}`)
    }
  }

  // submitted_at est déjà posé par le verrou one-shot en début de fonction.

  let zQuiz = 0
  if (quizz.statut === 'ferme' && quizz.ecart_type_cohorte && quizz.ecart_type_cohorte > 0) {
    zQuiz = (scoreMoyen - quizz.moyenne_cohorte!) / quizz.ecart_type_cohorte
  }

  // Écriture serveur (C1) : la NOTE ne s'écrit plus jamais avec le JWT élève —
  // client admin uniquement, calcul 100 % serveur (Brier ci-dessus).
  await admin.from('quazian_quiz_scores').upsert({
    quiz_id: quizId,
    eleve_id: userId,
    score_moyen: scoreMoyen,
    note_formative_20: Math.min(Math.max(10 + scoreMoyen, 0), 20),
    z_quiz: zQuiz,
  }, { onConflict: 'quiz_id,eleve_id' })

  return {}
}

// Récupérer le retour post-quizz
export async function chargerRetourQuizz(quizId: string): Promise<{
  questions: QuestionRetourEleve[]
  scoreMoyen: number | null
  noteFormative: number | null
} | { error: string }> {
  const { supabase, userId } = await verifierEleve()

  const { data: session } = await supabase
    .from('quazian_sessions')
    .select('id, ordre_questions, ordre_options, submitted_at')
    .eq('quiz_id', quizId)
    .eq('eleve_id', userId)
    .maybeSingle()

  if (!session || !session.submitted_at) return { error: 'Pas de session soumise.' }

  // Garde de classe (C1) : le retour d'un quizz hors-classe n'est pas servi.
  const quizz = await chargerQuizAccessible(supabase, userId, quizId)
  if (!quizz) return { error: 'Quizz introuvable.' }
  if (quizz.statut !== 'ferme') return { error: 'Le quizz n\'est pas encore corrigé.' }

  // Lecture serveur (C-RLS-4). ⭐ ICI la bonne réponse SORT, et c'est voulu :
  // c'est le retour. Trois gardes la précèdent, toutes au-dessus — session
  // SOUMISE, quizz FERMÉ, quizz de la classe de l'élève.
  const { data: questions, error: eQuestions } = await createAdminClient()
    .from('quazian_questions')
    .select('id, enonce, options, index_correct')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true })

  // ⛔ SANS CE TEST, UN RETOUR VIDE ÉTAIT MUET. `(questions ?? []).map(...)`
  //    plus bas rendait une liste vide : l'élève voyait son écran de retour
  //    sans une question, et rien nulle part ne disait pourquoi. Une panne se
  //    dit ; un quizz sans question, c'est autre chose, et ça ne peut pas
  //    arriver ici (le quizz est `ferme`, donc il a été passé).
  if (eQuestions) return { error: `Lecture des questions impossible : ${eQuestions.message}` }

  const { data: reponses, error: eReponses } = await supabase
    .from('quazian_answers')
    .select('question_id, p_a, p_b, p_c, p_d, repondu, score')
    .eq('session_id', session.id)

  // ⚠️ Ici l'échec ne peut rien figer — le retour ne fait que LIRE. Mais un
  //    retour qui montre « non répondu » partout parce que la lecture a raté
  //    ment à l'élève sur ce qu'il a fait : on préfère le dire.
  if (eReponses) return { error: `Lecture de tes réponses impossible : ${eReponses.message}` }

  const { data: scoreData } = await supabase
    .from('quazian_quiz_scores')
    .select('score_moyen, note_formative_20')
    .eq('quiz_id', quizId)
    .eq('eleve_id', userId)
    .single()

  // L'ordre de SA passation — questions et réponses —, pas celui de la base :
  // la lettre qu'il lit ici est celle qu'il a lue pendant le quiz.
  const result = remettreDansOrdreEleve(
    questions ?? [],
    reponses ?? [],
    session.ordre_questions as string[] | null,
    session.ordre_options as Record<string, number[]> | null,
  )

  return {
    questions: result,
    scoreMoyen: scoreData?.score_moyen ?? null,
    noteFormative: scoreData?.note_formative_20 ?? null,
  }
}

// L'élève a-t-il déjà validé avoir vu sa note de quizz ? (best-effort : false si la
// colonne note_vue_at n'est pas encore migrée — cf. retours_lus.sql).
export async function etatNoteVue(quizId: string): Promise<boolean> {
  try {
    const { supabase, userId } = await verifierEleve()
    const { data } = await supabase
      .from('quazian_quiz_scores')
      .select('note_vue_at')
      .eq('quiz_id', quizId)
      .eq('eleve_id', userId)
      .maybeSingle()
    return !!data?.note_vue_at
  } catch {
    return false
  }
}

// Validation « j'ai vu ma note » (source transversale). Quazian reste TOUJOURS
// ouvert : ne pas valider ne bloque rien dans Quazian, mais bloque les rendus des
// AUTRES modules tant que la note n'est pas vue. Idempotent.
export async function marquerNoteVue(quizId: string): Promise<{ success: true } | { error: string }> {
  try {
    const { supabase, userId } = await verifierEleve()
    const admin = createAdminClient()
    // La note n'est « à valider » que si le quizz est corrigé (fermé) et qu'un score existe.
    // Garde de classe (C1) incluse — marquerNoteVue écrit en admin, AUCUNE RLS ne le protège.
    const quizz = await chargerQuizAccessible(supabase, userId, quizId)
    if (!quizz || quizz.statut !== 'ferme') return { error: 'Le quizz n’est pas encore corrigé.' }
    const { error } = await admin
      .from('quazian_quiz_scores')
      .update({ note_vue_at: new Date().toISOString() })
      .eq('quiz_id', quizId)
      .eq('eleve_id', userId)
      .is('note_vue_at', null)
    if (error) return { error: 'Action indisponible pour le moment, réessaie.' }
    revalidatePath(`/eleve/modules/quazian/quizz/${quizId}`)
    revalidatePath('/eleve/modules/quazian')
    return { success: true }
  } catch {
    return { error: 'Action indisponible pour le moment, réessaie.' }
  }
}
