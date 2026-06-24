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
    ? { label: '—', classe: 'text-muet', aide: 'Aucune carte révisée pour l’instant.' }
    : stabiliteMoyenne < 7
    ? { label: 'mémoire fragile', classe: 'text-retard', aide: 'À consolider : les cartes retombent vite sous le seuil de rappel.' }
    : stabiliteMoyenne < 30
    ? { label: 'en consolidation', classe: 'text-attention', aide: 'La mémoire se solidifie ; les intervalles s’allongent.' }
    : { label: 'mémoire durable', classe: 'text-ok', aide: 'Les cartes tiennent plusieurs semaines avant rappel.' }

  return (
    <div>
      <Link href="/prof/quazian/diagnostic" className="text-sm text-muet hover:text-encre-douce">
        ← Diagnostic classe
      </Link>

      <div className="mt-4 mb-6 flex items-end justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-serif text-encre">{profile?.display_name}</h3>
          {profile?.classe && <p className="text-sm text-muet">{profile.classe}</p>}
        </div>
        {semestre && (
          <div className="text-right">
            <p className="text-2xl font-serif text-encre">{semestre.note_finale_20?.toFixed(1)}/20</p>
            <p className="text-xs text-muet">note finale de semestre</p>
          </div>
        )}
      </div>

      {/* Stats FSRS */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
          <p className="text-2xl font-serif text-encre">{nbCartesVues}</p>
          <p className="text-xs text-muet mt-1">cartes en révision</p>
        </div>
        <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
          <p className="text-2xl font-serif text-encre">{stabiliteMoyenne.toFixed(1)}<span className="text-base text-muet">j</span></p>
          <p className={`text-xs mt-1 font-medium ${bandeStabilite.classe}`}>{bandeStabilite.label}</p>
        </div>
        <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
          <p className="text-2xl font-serif text-encre">{scores.length}</p>
          <p className="text-xs text-muet mt-1">quizz passés</p>
        </div>
      </div>

      {/* Explication de la stabilité FSRS */}
      <div className="bg-parchemin-fonce border border-bordure rounded-xl px-4 py-3 mb-6">
        <p className="text-xs text-muet leading-relaxed">
          <span className="font-medium text-encre-douce">Stabilité (FSRS)</span> = nombre de jours pendant lesquels l&apos;élève
          retient une carte avant que sa probabilité de rappel ne retombe sous la cible (90&nbsp;%). C&apos;est la
          <em> durabilité</em> de la mémoire, indépendante de la difficulté de la carte : plus elle est élevée, plus les
          intervalles de révision s&apos;allongent. {bandeStabilite.aide}
        </p>
      </div>

      {/* Historique des notes */}
      {scores.length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-4 mb-6">
          <h4 className="text-sm font-medium text-encre-douce mb-3">Historique des quizz</h4>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {scores.map((s, i) => {
              const note = s.note_formative_20 ?? 0
              const couleur = note >= 14 ? 'text-ok bg-ok-teinte' : note >= 10 ? 'text-attention bg-attention-teinte' : 'text-retard bg-retard-teinte'
              return (
                <div key={i} className={`shrink-0 text-center px-3 py-2 rounded-xl ${couleur}`}>
                  <p className="text-lg font-bold">{note.toFixed(1)}</p>
                  <p className="text-xs opacity-70">Q{i + 1}</p>
                </div>
              )
            })}
          </div>
          {semestre && (
            <div className="mt-3 pt-3 border-t border-bordure grid grid-cols-3 gap-2 text-xs text-center text-muet">
              <div>
                <p className="font-medium text-encre-douce">{semestre.note_relative_20?.toFixed(1)}/20</p>
                <p>Relative (rang)</p>
              </div>
              <div>
                <p className="font-medium text-encre-douce">{semestre.note_absolue_20?.toFixed(1)}/20</p>
                <p>Absolue (maîtrise)</p>
              </div>
              <div>
                <p className="font-bold text-encre">{semestre.note_finale_20?.toFixed(1)}/20</p>
                <p>Finale (blend)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Diagnostic concepts */}
      {ideesFausses.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-medium text-retard mb-2">
            Idées fausses — erreur confiante ({ideesFausses.length})
          </h4>
          <p className="text-xs text-muet mb-3">
            Score très négatif : se trompe avec assurance. À corriger en priorité.
          </p>
          <div className="space-y-1.5">
            {ideesFausses.map((d) => (
              <div key={d.concept_tag} className="flex items-center gap-3 bg-retard-teinte border border-retard rounded-xl px-4 py-2.5">
                <span className="text-sm text-retard font-medium flex-1">{d.concept_tag}</span>
                <span className="text-xs text-retard font-mono">{d.scoreMoyen.toFixed(1)}</span>
                <span className="text-xs text-retard">{d.nbQuestions} Q</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {lacunes.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-medium text-attention mb-2">
            Lacunes — incertitude honnête ({lacunes.length})
          </h4>
          <p className="text-xs text-muet mb-3">
            Score proche de 2.5 : ne sait pas et le sait. Remède : exposition répétée.
          </p>
          <div className="space-y-1.5">
            {lacunes.map((d) => (
              <div key={d.concept_tag} className="flex items-center gap-3 bg-attention-teinte border border-attention rounded-xl px-4 py-2.5">
                <span className="text-sm text-attention font-medium flex-1">{d.concept_tag}</span>
                <span className="text-xs text-attention font-mono">{d.scoreMoyen.toFixed(1)}</span>
                <span className="text-xs text-attention">{d.nbQuestions} Q</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {maitrise.length > 0 && (
        <section className="mb-5">
          <h4 className="text-sm font-medium text-ok mb-2">
            Maîtrisés ({maitrise.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {maitrise.map((d) => (
              <span key={d.concept_tag}
                className="text-xs px-3 py-1 bg-ok-teinte border border-ok text-ok rounded-full">
                {d.concept_tag} · {d.scoreMoyen.toFixed(1)}
              </span>
            ))}
          </div>
        </section>
      )}

      {diagnostic.length === 0 && (
        <p className="text-muet text-sm text-center py-8">
          Cet élève n'a pas encore participé à de quizz.
        </p>
      )}
    </div>
  )
}
