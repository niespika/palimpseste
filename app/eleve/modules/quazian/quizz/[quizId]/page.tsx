import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { aAccesModule, classeAModule, classeIdsActives } from '@/utils/acces'
import { initialiserSession, chargerRetourQuizz, etatNoteVue } from './actions'
import { PassationJetons } from './PassationJetons'
import BoutonVuNote from './BoutonVuNote'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireAntichambreAt, lirePorteAntichambre } from '@/utils/quazian-antichambre-serveur'
import { AntichambreEleve } from './AntichambreEleve'
import { Consignes } from './Consignes'
import { BaremePartage } from './BaremePartage'
import { BoutonTuteur } from './BoutonTuteur'
import { lirePorteTuteur } from '@/utils/quazian-tuteur-serveur'
import { erreurAssuree } from '@/utils/quazian-tuteur'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import { bilanPartage, contributionsQuestion, ecrireCalcul, nombre, signe } from '@/utils/quazian-explication-note'

const LETTRES = ['A', 'B', 'C', 'D']

export default async function PassationPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>
  searchParams: Promise<{ commencer?: string }>
}) {
  const { quizId } = await params
  const { commencer } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Garde d'accès module : un élève sans accès Quazian ne doit pas atteindre un quizz par URL.
  const { data: mod } = await supabase.from('modules').select('id, actif').eq('slug', 'quazian').maybeSingle()
  if (!mod?.actif || !(await aAccesModule(supabase, user.id, mod.id))) notFound()

  const { data: quizz } = await supabase
    .from('quazian_quizzes')
    .select('statut, ferme_at, classe_id')
    .eq('id', quizId)
    .single()

  if (!quizz) {
    // Un brouillon est caché par la RLS élève — c'est voulu. Son ANTICHAMBRE,
    // elle, se montre (22/09) : porte ouverte, antichambre ouverte, classe de
    // l'élève. Rien d'autre n'en sort : aucune question tant que dure l'attente.
    if (await antichambreVisible(supabase, user.id, quizId)) return <AntichambreEleve quizId={quizId} />
    return <div className="text-center py-16 text-muet">Quizz introuvable.</div>
  }

  // Garde de classe (C1/A4) : le correctif du bug 0.3 ne couvrait que la LISTE.
  // Même scoping ici : un élève d'une autre classe qui ouvre l'URL directe voit
  // le même refus que si le quizz n'existait pas (pas de données servies). Les
  // server actions appliquent la même garde (chargerQuizAccessible).
  const classeIds = await classeIdsActives(supabase, user.id)
  if (!quizz.classe_id || !classeIds.includes(quizz.classe_id as string)) {
    return <div className="text-center py-16 text-muet">Quizz introuvable.</div>
  }

  // Retour post-quizz si fermé et soumis
  if (quizz.statut === 'ferme') {
    const retour = await chargerRetourQuizz(quizId)
    const noteVue = await etatNoteVue(quizId)

    if ('error' in retour) {
      return (
        <div className="max-w-xl mx-auto text-center py-16 text-encre-douce text-sm">
          <p>{retour.error}</p>
          <Link href="/eleve/modules/quazian" className="mt-4 inline-block text-muet underline text-sm">
            Retour
          </Link>
        </div>
      )
    }

    // Retours de classe du 22/09 (point 7) : la note s'EXPLIQUE. Chaque réponse
    // dit ce qu'elle a rapporté ou coûté ; la somme fait le score de la question,
    // la moyenne des scores fait la note (`utils/quazian-explication-note.ts`).
    const details = retour.questions.map((q) => {
      const jetons = q.mesJetons ?? ([25, 25, 25, 25] as [number, number, number, number])
      const parts = contributionsQuestion(jetons, q.indexCorrect)
      return { q, jetons, parts, score: parts.reduce((a, b) => a + b, 0) }
    })
    const n = details.length
    const total = details.reduce((a, d) => a + d.score, 0)
    const moyenne = n > 0 ? total / n : 0
    // Au millième, comme le détail des questions : l'élève qui refait le calcul
    // tombe juste, et « arrondie à » part du même nombre (revue finale du 23/09 :
    // deux arrondis sur deux nombres se contredisaient sur ~5 % des copies).
    const moyenne2 = Math.round(moyenne * 1000) / 1000
    const note = retour.noteFormative
    const noteCalculee = Math.round((10 + moyenne2) * 1000) / 1000
    const note1 = note !== null ? Math.round(noteCalculee * 10) / 10 : null
    // Point 8 : « En parler avec le tuteur » sous une erreur assurée (≥ 70 points
    // sur une mauvaise réponse) — porte ouverte, tuteur actif, classe qui l'a.
    const adminTuteur = createAdminClient()
    const [porteTuteur, reglagesRag, classeATuteur] = await Promise.all([
      lirePorteTuteur(adminTuteur),
      lireReglagesRag(adminTuteur),
      classeAModule(supabase, quizz.classe_id as string, 'scriptorium'),
    ])
    const tuteurOffert = porteTuteur && reglagesRag.actif && classeATuteur
    const aPoints = (x: number) => `${x < 0 ? '−' : ''}${nombre(Math.abs(x), 3)} point${Math.abs(x) > 1 || x === 0 ? 's' : ''}`

    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Link href="/eleve/modules/quazian" className="text-sm text-encre-douce hover:text-encre inline-block">
          ← Retour
        </Link>
        <h2 className="text-xl font-serif text-pigment">Résultats du quizz</h2>

        {note1 !== null && (
          <section className="bg-surface border border-bordure rounded-2xl p-4 sm:p-5 shadow-sm">
            <p className="text-3xl font-serif text-encre tabular-nums">
              {nombre(note1, 1)} <span className="text-lg text-muet">/ 20</span>
            </p>
            <div className="mt-2 space-y-1 text-sm text-encre-douce leading-relaxed tabular-nums">
              <p>Chaque question te rapporte entre <strong className="text-encre">−10</strong> et <strong className="text-encre">+10</strong> points.</p>
              <p>Tes {n} questions ensemble : <strong className="text-encre">{aPoints(total)}</strong>.</p>
              <p>
                Ta moyenne : {total < 0 ? '−' : ''}{nombre(Math.abs(total), 3)} ÷ {n} = <strong className="text-encre">{signe(moyenne2)}</strong> par question.
              </p>
              <p>
                Ta note : 10 {moyenne2 < 0 ? '−' : '+'} {nombre(Math.abs(moyenne2), 3)} = {nombre(noteCalculee, 3)}
                {Math.abs(noteCalculee - note1) > 0.001 ? <>, arrondie à <strong className="text-encre">{nombre(note1, 1)} / 20</strong>.</> : <> <strong className="text-encre">/ 20</strong>.</>}
              </p>
            </div>
            <p className="mt-3 text-sm text-attention leading-relaxed">
              {bilanPartage(details.map((d) => ({ jetons: d.jetons, indexCorrect: d.q.indexCorrect })))}
            </p>
          </section>
        )}

        {/* « J'ai vu ma note » EN HAUT (revue finale du 23/09) : tant qu'il n'est
            pas coché, l'élève ne peut rien rendre ailleurs, et c'est ici qu'on
            l'envoie — la page fait maintenant plusieurs écrans de long. */}
        <BoutonVuNote quizId={quizId} dejaVu={noteVue} />

        <BaremePartage />

        <p className="pt-2 text-xs text-muet">Question par question — dans l’ordre où tu les as vues</p>
        {details.map(({ q, jetons, parts, score }, i) => {
          const calcul = ecrireCalcul(parts)
          return (
            <div key={q.id} className={`bg-surface border rounded-xl p-4 ${score < 0 ? 'border-retard' : 'border-bordure'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muet">Question {i + 1}</p>
                <span className={`text-sm font-bold tabular-nums ${score > 5 ? 'text-ok' : score >= 0 ? 'text-attention' : 'text-retard'}`}>
                  {signe(score)}
                </span>
              </div>
              <p className="text-sm font-medium text-encre mb-2 leading-snug">{q.enonce}</p>

              {/* Le texte de la réponse garde toute la largeur (160 caractères à 375 px) ;
                  ses deux nombres vont dessous : « 50 points → +7,5 ». */}
              <div className="space-y-1.5">
                {q.options.map((opt, j) => {
                  const estCorrect = j === q.indexCorrect
                  const v = parts[j]
                  return (
                    <div
                      key={j}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        estCorrect ? 'bg-ok-teinte border border-ok text-ok' : 'bg-parchemin-fonce text-encre-douce'
                      }`}
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-xs font-bold w-4 shrink-0">{LETTRES[j]}</span>
                        <span className="flex-1 min-w-0 leading-snug">{opt}{estCorrect && ' ✓'}</span>
                      </div>
                      <p className="mt-0.5 text-right tabular-nums">
                        <span className={jetons[j] > 0 ? 'text-encre' : 'text-muet'}>
                          {jetons[j]} point{jetons[j] > 1 ? 's' : ''}
                        </span>
                        <span className="text-muet"> → </span>
                        <span className={`font-semibold ${v > 0 ? 'text-ok' : v < 0 ? 'text-retard' : 'text-muet'}`}>{signe(v)}</span>
                      </p>
                    </div>
                  )
                })}
              </div>
              {calcul && <p className="mt-2 text-xs text-encre-douce tabular-nums">Calcul : {calcul}</p>}
              {!q.repondu && (
                <p className="mt-1 text-xs text-muet">Sans réponse : 25 points ont été comptés sur chaque réponse.</p>
              )}
              {tuteurOffert && q.repondu && erreurAssuree(q.mesJetons, q.indexCorrect) !== null && (
                <BoutonTuteur questionId={q.id} />
              )}
            </div>
          )
        })}

      </div>
    )
  }

  // L'élève qui arrive APRÈS le lancement (22/09) : quand le quiz est passé par
  // l'antichambre, il lit d'abord les consignes — mais le chrono, lui, tourne
  // déjà. Celui qui attendait dans l'antichambre arrive avec `?commencer=1`, et
  // celui qui a déjà une session reprend sa copie sans détour.
  if (quizz.statut === 'lance' && commencer !== '1') {
    const admin = createAdminClient()
    if (await lirePorteAntichambre(admin) && await lireAntichambreAt(admin, quizId)) {
      const { data: session } = await supabase
        .from('quazian_sessions').select('id').eq('quiz_id', quizId).eq('eleve_id', user.id).maybeSingle()
      const expire = !!quizz.ferme_at && Date.parse(quizz.ferme_at as string) <= Date.now() // eslint-disable-line react-hooks/purity -- Server Component, rendu une fois par requête
      if (!session && expire) {
        return (
          <div className="max-w-xl mx-auto text-center py-16">
            <h2 className="text-xl font-serif text-encre">Le temps est écoulé</h2>
            <p className="mt-2 text-sm text-encre-douce">Ce quiz n’accepte plus de réponse. Ton professeur va le fermer.</p>
            <Link href="/eleve/modules/quazian" className="mt-4 inline-block text-sm text-muet underline">Retour</Link>
          </div>
        )
      }
      if (!session) {
        const minutes = quizz.ferme_at
          // eslint-disable-next-line react-hooks/purity -- Server Component : rendu une fois par requête, Date.now() est sûr ici
          ? Math.max(0, Math.round((new Date(quizz.ferme_at as string).getTime() - Date.now()) / 60000))
          : null
        return (
          <div className="max-w-xl mx-auto space-y-4">
            <div>
              <h2 className="text-xl font-serif text-encre">Le quiz a déjà commencé</h2>
              {minutes !== null && (
                <p className="mt-1 text-sm text-attention">
                  Il reste environ {minutes} minute{minutes > 1 ? 's' : ''} : lis ceci, puis commence.
                </p>
              )}
            </div>
            <Consignes />
            <Link
              href={`/eleve/modules/quazian/quizz/${quizId}?commencer=1`}
              className="block w-full py-3 text-center text-sm bg-ok text-surface rounded-xl hover:opacity-90 font-medium"
            >
              Commencer le quiz →
            </Link>
          </div>
        )
      }
    }
  }

  // Passation en cours
  const donnees = await initialiserSession(quizId)

  if ('error' in donnees) {
    return (
      <div className="text-center py-16 text-muet text-sm">
        <p>{donnees.error}</p>
        <Link href="/eleve/modules/quazian" className="mt-4 inline-block underline">Retour</Link>
      </div>
    )
  }

  if (donnees.soumis) {
    return (
      <div className="text-center py-16">
        <div className="text-3xl mb-4">✓</div>
        <h3 className="text-lg font-serif text-encre mb-2">Quizz soumis</h3>
        <p className="text-sm text-encre-douce mb-4">
          Le retour sera disponible une fois que ton professeur ferme le quizz.
        </p>
        <Link href="/eleve/modules/quazian" className="text-sm text-muet underline">
          Retour
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PassationJetons
        sessionId={donnees.sessionId}
        quizId={quizId}
        questions={donnees.questions}
        reponsesInitiales={donnees.reponsesExistantes}
        fermeAt={quizz.ferme_at}
      />
    </div>
  )
}

/**
 * L'antichambre d'un brouillon est-elle visible pour CET élève ? Porte ouverte,
 * antichambre ouverte, quiz de sa classe (garde du code : le brouillon est lu au
 * service-role, la RLS élève le cache).
 */
async function antichambreVisible(
  supabase: Awaited<ReturnType<typeof createClient>>, eleveId: string, quizId: string,
): Promise<boolean> {
  const admin = createAdminClient()
  if (!(await lirePorteAntichambre(admin))) return false
  const [{ data: q }, classeIds, ouverte] = await Promise.all([
    admin.from('quazian_quizzes').select('statut, classe_id').eq('id', quizId).maybeSingle(),
    classeIdsActives(supabase, eleveId),
    lireAntichambreAt(admin, quizId),
  ])
  return !!ouverte && q?.statut === 'brouillon' && !!q.classe_id && classeIds.includes(q.classe_id as string)
}
