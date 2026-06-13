'use client'

import { useState, useEffect, useCallback } from 'react'
import { fermerQuizz } from './actions'

interface EleveStatut {
  id: string
  display_name: string
  soumis: boolean
  submitted_at: string | null
  score_moyen: number | null
  auto: boolean
}

interface Props {
  quizId: string
  statut: string
  fermeAt: string | null
  eleves: EleveStatut[]
  moyenneCohorte: number | null
  ecartTypeCohorte: number | null
}

export function TableauLive({ quizId, statut, fermeAt, eleves: elevesInit, moyenneCohorte, ecartTypeCohorte }: Props) {
  const [eleves, setEleves] = useState(elevesInit)
  const [pending, setPending] = useState(false)
  const [secondesRestantes, setSecondesRestantes] = useState<number | null>(null)

  // Timer
  useEffect(() => {
    if (!fermeAt || statut !== 'lance') return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(fermeAt).getTime() - Date.now()) / 1000))
      setSecondesRestantes(diff)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [fermeAt, statut])

  // Rafraîchissement automatique toutes les 10s pendant le live
  const rafraichir = useCallback(async () => {
    if (statut !== 'lance') return
    const res = await fetch(`/api/quazian/live/${quizId}`)
    if (res.ok) {
      const data = await res.json()
      setEleves(data.eleves)
    }
  }, [quizId, statut])

  useEffect(() => {
    if (statut !== 'lance') return
    const interval = setInterval(rafraichir, 10000)
    return () => clearInterval(interval)
  }, [rafraichir, statut])

  async function handleFermer() {
    if (!confirm('Fermer le quizz maintenant ? Les élèves non soumis seront auto-soumis avec 25/25/25/25.')) return
    setPending(true)
    const fd = new FormData()
    fd.append('quizId', quizId)
    await fermerQuizz(fd)
    setPending(false)
  }

  const nbSoumis = eleves.filter((e) => e.soumis).length
  const total = eleves.length

  function formatTemps(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div>
      {/* En-tête statut */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              {statut === 'lance' && (
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              )}
              <span className="font-medium text-stone-900">
                {statut === 'lance' ? 'Quizz en cours' : 'Quizz terminé'}
              </span>
            </div>
            <p className="text-sm text-stone-500 mt-1">
              {nbSoumis}/{total} élève{total > 1 ? 's' : ''} {statut === 'lance' ? 'ont soumis' : 'ont participé'}
            </p>
            {secondesRestantes !== null && secondesRestantes > 0 && (
              <p className={`text-2xl font-mono font-bold mt-2 ${secondesRestantes < 60 ? 'text-red-600' : 'text-stone-700'}`}>
                {formatTemps(secondesRestantes)}
              </p>
            )}
            {secondesRestantes === 0 && statut === 'lance' && (
              <p className="text-sm text-red-600 mt-1">Temps écoulé — ferme le quizz</p>
            )}
          </div>

          {statut === 'lance' && (
            <button
              onClick={handleFermer}
              disabled={pending}
              className="px-5 py-2.5 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {pending ? 'Fermeture…' : 'Fermer le quizz'}
            </button>
          )}
        </div>

        {/* Barre de progression */}
        {total > 0 && (
          <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${(nbSoumis / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats cohorte (quizz fermé) */}
      {statut === 'ferme' && moyenneCohorte !== null && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-stone-900">{moyenneCohorte.toFixed(2)}</p>
            <p className="text-xs text-stone-400 mt-1">score moyen cohorte</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-serif text-stone-900">
              {Math.min(Math.max(10 + moyenneCohorte, 0), 20).toFixed(1)}/20
            </p>
            <p className="text-xs text-stone-400 mt-1">note formative moyenne</p>
          </div>
        </div>
      )}

      {/* Tableau élèves */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs text-stone-400">
              <th className="text-left px-4 py-3">Élève</th>
              <th className="text-center px-4 py-3">Statut</th>
              {statut === 'ferme' && <th className="text-right px-4 py-3">Score</th>}
              {statut === 'ferme' && <th className="text-right px-4 py-3">Note /20</th>}
            </tr>
          </thead>
          <tbody>
            {eleves.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-stone-400 py-8">
                  Aucun élève n'a encore démarré le quizz.
                </td>
              </tr>
            )}
            {eleves.map((e) => (
              <tr key={e.id} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-3 text-stone-800">{e.display_name}</td>
                <td className="px-4 py-3 text-center">
                  {e.soumis ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      {e.auto ? 'Auto-soumis' : 'Soumis'}
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-500 rounded-full">
                      En cours…
                    </span>
                  )}
                </td>
                {statut === 'ferme' && (
                  <td className="px-4 py-3 text-right font-mono text-stone-700">
                    {e.score_moyen != null ? e.score_moyen.toFixed(2) : '—'}
                  </td>
                )}
                {statut === 'ferme' && (
                  <td className="px-4 py-3 text-right font-medium text-stone-900">
                    {e.score_moyen != null
                      ? `${Math.min(Math.max(10 + e.score_moyen, 0), 20).toFixed(1)}/20`
                      : '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
