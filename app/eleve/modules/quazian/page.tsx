import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { aAccesModule, inscriptionsModuleEleve } from '@/utils/acces'
import { messageSiBloque } from '@/utils/integrite'
import { chargerFileRevision, chargerStatsRevision, chargerToutesLesCartes } from './actions'
import { formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { QuazianDashboard } from './QuazianDashboard'
import BanniereIntegrite from '@/components/BanniereIntegrite'
import Tuile from '@/components/Tuile'
import { contexteClasseEleve } from '@/app/eleve/contexte-classe'
import ChoixClasseModule from '@/app/eleve/ChoixClasseModule'

type QuizListItem = { id: string; statut: string; lance_at: string | null; nb_questions: number }

export default async function QuazianElevePage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; cours?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const tz = await lireFuseau() // lance_at = instant → fuseau choisi
  // C7·L2 — deux onglets (règle R8) : « Flashcards » (défaut) et « Quizz ».
  // C7·L3 — `?cours=` ouvre la consultation d'UN cours (tuiles par cours) :
  // l'état vit dans l'URL, donc le retour arrière du navigateur y ramène.
  const { vue: vueParam, cours: coursParam } = await searchParams
  const vue = vueParam === 'quizz' ? 'quizz' : 'flashcards'
  // Le cours ouvert ne vaut que sur l'onglet Flashcards (le Quizz l'ignore).
  const coursOuvert = vue === 'flashcards' ? (coursParam ?? null) : null

  // Vérifier que le module est actif et assigné
  const { data: module } = await supabase
    .from('modules')
    .select('id, actif')
    .eq('slug', 'quazian')
    .single()

  if (!module?.actif) {
    return (
      <div className="text-center py-16 text-muet text-sm">
        Ce module n'est pas encore activé.
      </div>
    )
  }

  if (!(await aAccesModule(supabase, user.id, module.id))) {
    return (
      <div className="text-center py-16 text-muet text-sm">
        Tu n'as pas encore accès à ce module.
      </div>
    )
  }

  // C7·L2 — le module travaille UNE classe. En état « Toutes », on ne devine pas
  // laquelle : on la demande (item 3), le commutateur de l'en-tête restant offert
  // pour en changer sans repasser par le tableau de bord. Le choix ne porte que
  // sur les classes qui ont Quazian — en proposer une autre mènerait à « tu n'as
  // pas accès à ce module ».
  const { active, toutes } = await contexteClasseEleve(supabase, user.id)
  if (toutes) {
    return (
      <ChoixClasseModule
        inscriptions={await inscriptionsModuleEleve(supabase, user.id, module.id)}
        nomModule="Quazian"
      />
    )
  }

  // Quizz de la classe EN CONTEXTE (et non plus l'union des classes de l'élève,
  // qui montrait à un bi-classe les quizz de son autre classe — item 3).
  const classeIds = active ? [active.classe_id] : []
  const { data: quizzes } = classeIds.length > 0
    ? await supabase
        .from('quazian_quizzes')
        .select('id, statut, lance_at, ferme_at, nb_questions')
        .in('classe_id', classeIds)
        .in('statut', ['lance', 'ferme'])
        .order('lance_at', { ascending: false })
    : { data: [] }
  const quizList = (quizzes ?? []) as QuizListItem[]

  // État de soumission de l'élève par quizz
  const quizIds = quizList.map(q => q.id)
  const { data: sessions } = quizIds.length > 0
    ? await supabase.from('quazian_sessions').select('quiz_id, submitted_at').eq('eleve_id', user.id).in('quiz_id', quizIds)
    : { data: [] }
  const soumisMap = new Map<string, boolean>()
  for (const s of sessions ?? []) soumisMap.set(s.quiz_id as string, !!s.submitted_at)

  // Notes des quizz corrigés (affichées dans la liste) — une seule requête.
  // C7·L2 (item 6) — on affiche la NOTE FORMATIVE /20 déjà calculée et stockée,
  // celle que le prof voit dans son tableau. La liste montrait `score_moyen`
  // étiqueté « /10 » : ce champ est le score de Brier moyen, une valeur centrée
  // sur 0 (la note en est dérivée par `10 + score`), donc ni sur 10 ni comparable
  // au reste de l'app, qui note sur 20.
  const fermeIds = quizList.filter(q => q.statut === 'ferme').map(q => q.id)
  const { data: scores } = fermeIds.length > 0
    ? await supabase.from('quazian_quiz_scores').select('quiz_id, note_formative_20').eq('eleve_id', user.id).in('quiz_id', fermeIds)
    : { data: [] }
  const noteMap = new Map<string, number>()
  for (const s of scores ?? []) {
    if (s.note_formative_20 != null) noteMap.set(s.quiz_id as string, s.note_formative_20 as number)
  }

  // Quizz en cours non encore soumis → bannière d'appel (à faire)
  const quizzActif = quizList.find(q => q.statut === 'lance' && !soumisMap.get(q.id))

  // Blocage « petit malin » : la révision est gelée, mais le quizz reste accessible.
  const blocage = await messageSiBloque(createAdminClient(), user.id)

  // Données de révision (FSRS + consultation) — inutile de les charger si bloqué,
  // ni quand l'élève est sur l'onglet Quizz.
  let file: Awaited<ReturnType<typeof chargerFileRevision>> = []
  let stats: Awaited<ReturnType<typeof chargerStatsRevision>> | null = null
  let toutesCartes: Awaited<ReturnType<typeof chargerToutesLesCartes>> = []
  if (!blocage && vue === 'flashcards') {
    const [f, s, t] = await Promise.all([chargerFileRevision(), chargerStatsRevision(), chargerToutesLesCartes()])
    file = f; stats = s; toutesCartes = t
  }

  return (
    <div>
      {/* C7·L3 — la consultation d'un cours porte SON propre « ← Retour » (vers
          les tuiles) : en garder un second vers le tableau de bord juste au-dessus
          empilerait deux retours qui ne mènent pas au même endroit. */}
      {!coursOuvert && (
        <Link
          href="/eleve"
          className="text-sm text-encre-douce hover:text-encre mb-6 inline-flex items-center gap-1"
        >
          ← Retour
        </Link>
      )}

      {/* Bannière quizz actif (à faire) */}
      {quizzActif && (
        <Link
          href={`/eleve/modules/quazian/quizz/${quizzActif.id}`}
          className="block bg-ok-teinte border border-ok rounded-xl p-4 mb-6 hover:opacity-90 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-ok animate-pulse shrink-0" />
            <div>
              <p className="font-medium text-ok text-sm">Quizz en cours !</p>
              <p className="text-xs text-ok">Appuie pour participer →</p>
            </div>
          </div>
        </Link>
      )}

      {/* Identité du module et onglets portés par la Barre 2 de l'en-tête. */}

      {/* C7·L2 — les deux zones d'hier (Réviser en haut, Quizz en bas) sont
          devenues deux onglets. Le gel de l'intégrité garde sa règle : la
          révision est gelée, l'onglet Quizz reste ouvert. */}
      {vue === 'quizz' ? (
        <QuizzSection quizList={quizList} soumisMap={soumisMap} noteMap={noteMap} tz={tz} />
      ) : blocage ? (
        <BanniereIntegrite message={blocage} />
      ) : (
        <QuazianDashboard
          stats={stats!}
          file={file}
          toutesCartes={toutesCartes}
          coursOuvert={coursOuvert}
        />
      )}
    </div>
  )
}

// ── Section QUIZZ : une tuile par quiz, statut charté (+ note /20 si corrigé) ──
function QuizzSection({
  quizList, soumisMap, noteMap, tz,
}: {
  quizList: QuizListItem[]
  soumisMap: Map<string, boolean>
  /** Note formative /20 du quizz corrigé — même valeur que le tableau du prof. */
  noteMap: Map<string, number>
  tz: string
}) {
  if (quizList.length === 0) {
    return (
      <p className="text-muet text-sm">
        Aucun quizz pour l&apos;instant. Ton professeur n&apos;en a pas encore lancé.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {quizList.map(q => {
        const soumis = soumisMap.get(q.id)
        const date = q.lance_at ? formatInstant(q.lance_at, tz, { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
        let resume: React.ReactNode
        if (q.statut === 'lance' && !soumis) {
          resume = <span className="text-xs px-2 py-0.5 rounded-full bg-pigment-teinte text-pigment">ouvert — participer →</span>
        } else if (q.statut === 'lance' && soumis) {
          resume = <span className="text-xs text-muet">soumis — en attente du corrigé</span>
        } else if (q.statut === 'ferme' && soumis) {
          const note = noteMap.get(q.id)
          resume = (
            <span className="inline-flex items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-parchemin-fonce text-muet">corrigé</span>
              {note != null && <span className="font-medium text-encre">{note.toFixed(1)}/20</span>}
              <span className="text-info">revoir →</span>
            </span>
          )
        } else {
          resume = <span className="text-xs text-muet">terminé (non passé)</span>
        }
        return (
          <Tuile
            key={q.id}
            nom={date ? `Quizz du ${date}` : 'Quizz'}
            sousTitre={`${q.nb_questions} question${q.nb_questions > 1 ? 's' : ''}`}
            href={`/eleve/modules/quazian/quizz/${q.id}`}
            couleur="neutre"
            resume={resume}
          />
        )
      })}
    </div>
  )
}
