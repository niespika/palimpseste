'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { passerPhase2, fermerSeance } from '../../actions'

interface EleveStatut {
  id: string
  display_name: string
  travail_id: string | null
  v1_envoyee: boolean
  vf_envoyee: boolean
  analyse_v1_statut: string
  analyse_vf_statut: string
  statut_validation: string | null
}

interface Props {
  sessionId: string
  statut: string
  phaseFinAt: string | null
  eleves: EleveStatut[]
}

const ANALYSE_LABEL: Record<string, string> = {
  vide: '',
  en_cours: 'analyse…',
  prete: 'prête',
  erreur: 'erreur',
}

export function TableauSeance({ sessionId, statut, phaseFinAt, eleves: elevesInit }: Props) {
  const router = useRouter()
  const [eleves, setEleves] = useState(elevesInit)
  const [pending, setPending] = useState(false)
  const [secondesRestantes, setSecondesRestantes] = useState<number | null>(null)

  const enLive = statut === 'phase_1' || statut === 'phase_2'

  // Chrono de la phase courante
  useEffect(() => {
    if (!phaseFinAt || !enLive) return
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(phaseFinAt).getTime() - Date.now()) / 1000))
      setSecondesRestantes(diff)
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [phaseFinAt, enLive])

  // Rafraîchissement des statuts élèves toutes les 8 s pendant le live
  const rafraichir = useCallback(async () => {
    if (!enLive) return
    const res = await fetch(`/api/codex/live/${sessionId}`)
    if (res.ok) {
      const data = await res.json()
      setEleves(data.eleves)
      // Si le serveur indique un autre statut (ex. fermé ailleurs), recharger
      if (data.statut !== statut) router.refresh()
    }
  }, [sessionId, enLive, statut, router])

  useEffect(() => {
    if (!enLive) return
    const interval = setInterval(rafraichir, 8000)
    return () => clearInterval(interval)
  }, [rafraichir, enLive])

  async function handlePasserPhase2() {
    if (!confirm('Passer en phase 2 ? Les élèves réécrivent leur V-finale avec les suggestions sous les yeux.')) return
    setPending(true)
    const fd = new FormData()
    fd.append('sessionId', sessionId)
    await passerPhase2(fd)
    setPending(false)
    router.refresh()
  }

  async function handleFermer() {
    if (!confirm('Fermer la séance maintenant ?')) return
    setPending(true)
    const fd = new FormData()
    fd.append('sessionId', sessionId)
    await fermerSeance(fd)
    setPending(false)
    router.refresh()
  }

  const phaseACompter = statut === 'phase_1' ? 'v1_envoyee' : 'vf_envoyee'
  const nbEnvoyes = eleves.filter((e) => e[phaseACompter as 'v1_envoyee' | 'vf_envoyee']).length
  const total = eleves.length

  function formatTemps(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  const titrePhase =
    statut === 'phase_1' ? 'Phase 1 — V1' : statut === 'phase_2' ? 'Phase 2 — V-finale' : 'Séance fermée'

  return (
    <div>
      {/* En-tête statut */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              {enLive && <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />}
              <span className="font-medium text-stone-900">{titrePhase}</span>
            </div>
            {enLive && (
              <p className="text-sm text-stone-500 mt-1">
                {nbEnvoyes}/{total} {statut === 'phase_1' ? 'V1 envoyée' : 'V-finale envoyée'}{nbEnvoyes > 1 ? 's' : ''}
              </p>
            )}
            {enLive && secondesRestantes !== null && secondesRestantes > 0 && (
              <p className={`text-2xl font-mono font-bold mt-2 ${secondesRestantes < 60 ? 'text-red-600' : 'text-stone-700'}`}>
                {formatTemps(secondesRestantes)}
              </p>
            )}
            {enLive && secondesRestantes === 0 && (
              <p className="text-sm text-red-600 mt-1">Temps écoulé</p>
            )}
          </div>

          <div className="flex gap-2">
            {statut === 'phase_1' && (
              <button
                onClick={handlePasserPhase2}
                disabled={pending}
                className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {pending ? '…' : 'Passer en phase 2'}
              </button>
            )}
            {enLive && (
              <button
                onClick={handleFermer}
                disabled={pending}
                className="px-5 py-2.5 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {pending ? '…' : 'Fermer'}
              </button>
            )}
          </div>
        </div>

        {enLive && total > 0 && (
          <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${(nbEnvoyes / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {statut === 'fermee' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          La séance est fermée. Le retour critique de la V-finale est à valider dans l&apos;onglet{' '}
          <Link href="/prof/codex/validation" className="underline font-medium">Validation</Link>.
        </div>
      )}

      {/* Tableau élèves */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 text-xs text-stone-400">
              <th className="text-left px-4 py-3">Élève</th>
              <th className="text-center px-4 py-3">V1</th>
              <th className="text-center px-4 py-3">V-finale</th>
              <th className="text-center px-4 py-3">Validation</th>
            </tr>
          </thead>
          <tbody>
            {eleves.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-stone-400 py-8">
                  Aucun élève assigné au module Codex pour cette classe.
                </td>
              </tr>
            )}
            {eleves.map((e) => (
              <tr key={e.id} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-3 text-stone-800">{e.display_name}</td>
                <td className="px-4 py-3 text-center">
                  <StatutCellule
                    envoyee={e.v1_envoyee}
                    analyse={e.analyse_v1_statut}
                    href={e.travail_id ? `/prof/codex/travail/${e.travail_id}/v1` : null}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatutCellule
                    envoyee={e.vf_envoyee}
                    analyse={e.analyse_vf_statut}
                    href={e.travail_id ? `/prof/codex/validation/${e.travail_id}` : null}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {e.statut_validation === 'valide' ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Validé</span>
                  ) : e.vf_envoyee ? (
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">À valider</span>
                  ) : (
                    <span className="text-xs text-stone-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatutCellule({ envoyee, analyse, href }: { envoyee: boolean; analyse: string; href?: string | null }) {
  if (!envoyee) return <span className="text-xs text-stone-300">en cours…</span>
  if (analyse === 'en_cours') return <span className="text-xs text-stone-400">{ANALYSE_LABEL.en_cours}</span>
  if (analyse === 'erreur') return <span className="text-xs text-red-500">erreur</span>
  // Analyse prête → cliquable vers les retours IA (V1 ou VF).
  if (href) {
    return (
      <Link href={href} className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors">
        Voir →
      </Link>
    )
  }
  return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">✓</span>
}
