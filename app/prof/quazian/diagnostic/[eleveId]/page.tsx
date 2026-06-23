import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { chargerDiagnosticEleve } from '../actions'

export default async function DiagnosticElevePage({
  params,
}: {
  params: Promise<{ eleveId: string }>
}) {
  const { eleveId } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, classe')
    .eq('id', eleveId)
    .single()

  const { diagnostic, scores, semestre, nbCartesVues, stabiliteMoyenne } =
    await chargerDiagnosticEleve(eleveId)

  const ideesFausses = diagnostic.filter((d) => d.profil === 'idee_fausse')
  const lacunes = diagnostic.filter((d) => d.profil === 'lacune')
  const maitrise = diagnostic.filter((d) => d.profil === 'maitrise')

  // Lecture qualitative de la stabilité FSRS (intervalle de rétention en jours).
  const bandeStabilite = nbCartesVues === 0
    ? { label: '—', classe: 'text-stone-400', aide: 'Aucune carte révisée pour l’instant.' }
    : stabiliteMoyenne < 7
    ? { label: 'mémoire fragile', classe: 'text-red-600', aide: 'À consolider : les cartes retombent vite sous le seuil de rappel.' }
    : stabiliteMoyenne < 30
    ? { label: 'en consolidation', classe: 'text-amber-600', aide: 'La mémoire se solidifie ; les intervalles s’allongent.' }
    : { label: 'mémoire durable', classe: 'text-green-600', aide: 'Les cartes tiennent plusieurs semaines avant rappel.' }

  return (
    <div>
      <Link href="/prof/quazian/diagnostic" className="text-sm text-stone-500 hover:text-stone-700">
        ← Diagnostic classe
      </Link>

      <div className="mt-4 mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif text-stone-900">{profile?.display_name}</h3>
          {profile?.classe && <p className="text-sm text-stone-400">{profile.classe}</p>}
        </div>
        {semestre && (
          <div className="text-right">
            <p className="text-2xl font-serif text-stone-900">{semestre.note_finale_20?.toFixed(1)}/20</p>
            <p className="text-xs text-stone-400">note finale de semestre</p>
          </div>
        )}
      </div>

      {/* Stats FSRS */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-serif text-stone-900">{nbCartesVues}</p>
          <p className="text-xs text-stone-400 mt-1">cartes en révision</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-serif text-stone-900">{stabiliteMoyenne.toFixed(1)}<span className="text-base text-stone-400">j</span></p>
          <p className={`text-xs mt-1 font-medium ${bandeStabilite.classe}`}>{bandeStabilite.label}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-serif text-stone-900">{scores.length}</p>
          <p className="text-xs text-stone-400 mt-1">quizz passés</p>
        </div>
      </div>

      {/* Explication de la stabilité FSRS */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 mb-6">
        <p className="text-xs text-stone-500 leading-relaxed">
          <span className="font-medium text-stone-700">Stabilité (FSRS)</span> = nombre de jours pendant lesquels l&apos;élève
          retient une carte avant que sa probabilité de rappel ne retombe sous la cible (90&nbsp;%). C&apos;est la
          <em> durabilité</em> de la mémoire, indépendante de la difficulté de la carte : plus elle est élevée, plus les
          intervalles de révision s&apos;allongent. {bandeStabilite.aide}
        </p>
      </div>

      {/* Historique des notes */}
      {scores.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-medium text-stone-600 mb-3">Historique des quizz</h4>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {scores.map((s, i) => {
              const note = s.note_formative_20 ?? 0
              const couleur = note >= 14 ? 'text-green-700 bg-green-50' : note >= 10 ? 'text-amber-700 bg-amber-50' : 'text-red-700 bg-red-50'
              return (
                <div key={i} className={`shrink-0 text-center px-3 py-2 rounded-xl ${couleur}`}>
                  <p className="text-lg font-bold">{note.toFixed(1)}</p>
                  <p className="text-xs opacity-70">Q{i + 1}</p>
                </div>
              )
            })}
          </div>
          {semestre && (
            <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-3 gap-2 text-xs text-center text-stone-500">
              <div>
                <p className="font-medium text-stone-700">{semestre.note_relative_20?.toFixed(1)}/20</p>
                <p>Relative (rang)</p>
              </div>
              <div>
                <p className="font-medium text-stone-700">{semestre.note_absolue_20?.toFixed(1)}/20</p>
                <p>Absolue (maîtrise)</p>
              </div>
              <div>
                <p className="font-bold text-stone-900">{semestre.note_finale_20?.toFixed(1)}/20</p>
                <p>Finale (blend)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic concepts */}
      {ideesFausses.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-medium text-red-700 mb-2">
            Idées fausses — erreur confiante ({ideesFausses.length})
          </h4>
          <p className="text-xs text-stone-400 mb-3">
            Score très négatif : se trompe avec assurance. À corriger en priorité.
          </p>
          <div className="space-y-1.5">
            {ideesFausses.map((d) => (
              <div key={d.concept_tag} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <span className="text-sm text-red-800 font-medium flex-1">{d.concept_tag}</span>
                <span className="text-xs text-red-600 font-mono">{d.scoreMoyen.toFixed(1)}</span>
                <span className="text-xs text-red-400">{d.nbQuestions} Q</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {lacunes.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-medium text-amber-700 mb-2">
            Lacunes — incertitude honnête ({lacunes.length})
          </h4>
          <p className="text-xs text-stone-400 mb-3">
            Score proche de 2.5 : ne sait pas et le sait. Remède : exposition répétée.
          </p>
          <div className="space-y-1.5">
            {lacunes.map((d) => (
              <div key={d.concept_tag} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
                <span className="text-sm text-amber-800 font-medium flex-1">{d.concept_tag}</span>
                <span className="text-xs text-amber-600 font-mono">{d.scoreMoyen.toFixed(1)}</span>
                <span className="text-xs text-amber-400">{d.nbQuestions} Q</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {maitrise.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-medium text-green-700 mb-2">
            Maîtrisés ({maitrise.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {maitrise.map((d) => (
              <span key={d.concept_tag}
                className="text-xs px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full">
                {d.concept_tag} · {d.scoreMoyen.toFixed(1)}
              </span>
            ))}
          </div>
        </section>
      )}

      {diagnostic.length === 0 && (
        <p className="text-stone-400 text-sm text-center py-8">
          Cet élève n'a pas encore participé à de quizz.
        </p>
      )}
    </div>
  )
}
