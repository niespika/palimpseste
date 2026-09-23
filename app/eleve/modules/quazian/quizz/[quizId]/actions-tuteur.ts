'use server'

// ============================================================================
// « EN PARLER AVEC LE TUTEUR » depuis l'écran de note (retours de classe,
// point 8). Crée — ou retrouve — la conversation rattachée à la question, y pose
// le premier message composé par le code, et ouvre le tuteur DANS LA CLASSE DU
// QUIZ. ⛔ Aucun type exporté d'un fichier `'use server'`.
// ============================================================================

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { classeAModule, classeIdsActives, inscriptionEleveClasse } from '@/utils/acces'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import { chargerContexteQuestion, lirePorteTuteur, quizEnCoursPourClasses } from '@/utils/quazian-tuteur-serveur'
import { erreurAssuree, messageOuverture } from '@/utils/quazian-tuteur'
import { COOKIE_CLASSE_ELEVE } from '@/app/eleve/contexte-classe-valeurs'

export async function ouvrirTuteur(_prec: { error?: string } | null, formData: FormData): Promise<{ error?: string } | null> {
  const questionId = String(formData.get('questionId') ?? '')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const admin = createAdminClient()
  const [{ data: profil }, porte, reglages] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    lirePorteTuteur(admin),
    lireReglagesRag(admin),
  ])
  if (profil?.role !== 'eleve') return { error: 'Réservé aux élèves.' }
  if (!porte || !reglages.actif) return { error: 'Le tuteur n’est pas disponible pour le moment.' }
  // La pause du tuteur vaut aussi ici : pas de discussion ouverte pour être
  // refusée au premier message (revue du 23/09).
  const enCours = await quizEnCoursPourClasses(admin, await classeIdsActives(supabase, user.id))
  if (enCours) {
    const heure = new Date(enCours.fermeAt).toLocaleTimeString('fr-CA', { timeZone: await lireFuseau(), hour: '2-digit', minute: '2-digit' })
    return { error: `Le tuteur est en pause pendant le quiz. Il revient à ${heure}.` }
  }

  // Les gardes de `chargerRetourQuizz` : quiz FERMÉ, copie SOUMISE — sinon rien.
  const ctx = await chargerContexteQuestion(admin, questionId, user.id)
  if (!ctx) return { error: 'Cette question n’est pas disponible.' }
  const [inscription, aLeModule] = await Promise.all([
    inscriptionEleveClasse(supabase, user.id, ctx.classeId),
    classeAModule(supabase, ctx.classeId, 'scriptorium'),
  ])
  if (!inscription || !aLeModule) return { error: 'Le tuteur n’est pas ouvert pour cette classe.' }
  // Le seuil se revérifie ici : le bouton n'est qu'un affichage.
  if (erreurAssuree(ctx.jetons, ctx.indexCorrect) === null) return { error: 'Cette question n’ouvre pas de discussion.' }

  const existante = async () => (await admin.from('scriptorium_conversations').select('id')
    .eq('eleve_id', user.id).eq('quiz_question_id', questionId).is('supprime_at', null).maybeSingle()).data?.id as string | undefined
  let convId = await existante()
  if (!convId) {
    const { data: conv, error } = await admin.from('scriptorium_conversations')
      .insert({ eleve_id: user.id, classe_id: ctx.classeId, titre: `Quiz — ${ctx.enonce}`.slice(0, 60), quiz_question_id: questionId })
      .select('id').single()
    // Double clic : l'index unique a refusé la jumelle — on rejoint la première.
    if (error?.code === '23505') convId = await existante()
    else if (error || !conv) return { error: 'La discussion n’a pas pu s’ouvrir. Réessaie.' }
    else {
      convId = conv.id as string
      const { error: eMsg } = await admin.from('scriptorium_messages')
        .insert({ conversation_id: convId, role: 'assistant', contenu: messageOuverture(ctx) })
      if (eMsg) {
        // Sans son premier message, le fil resterait vide À JAMAIS (on retrouve la
        // conversation existante sans le réécrire) : on la retire, et on le dit.
        console.error(`[tuteur] premier message non écrit (conversation ${convId}) — ${eMsg.message}`)
        await admin.from('scriptorium_conversations').delete().eq('id', convId)
        return { error: 'La discussion n’a pas pu s’ouvrir. Réessaie.' }
      }
    }
  }
  if (!convId) return { error: 'La discussion n’a pas pu s’ouvrir. Réessaie.' }

  // Le tuteur s'ouvre dans la classe du QUIZ (un élève bi-classe pouvait être
  // ailleurs en contexte : la conversation n'y aurait pas été listée).
  ;(await cookies()).set(COOKIE_CLASSE_ELEVE, inscription, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  redirect(`/eleve/modules/scriptorium?conv=${convId}`)
}
