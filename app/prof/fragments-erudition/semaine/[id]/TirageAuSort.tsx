'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { tirerOrateur, mettreAJourPresentation, annulerPresentation } from '../../actions'
import type { FragmentPresentation } from '@/types/fragments'

interface EleveEligible {
  id: string
  display_name: string
  classe: string | null
  nbPresentations: number
}

interface PresentationAvecEleve extends FragmentPresentation {
  eleve: { display_name: string; classe: string | null } | null
}

interface Props {
  semaineId: string
  eligibles: EleveEligible[]
  presentations: PresentationAvecEleve[]
}

export default function TirageAuSort({ semaineId, eligibles, presentations }: Props) {
  const router = useRouter()
  const [excluIds, setExcluIds] = useState<Set<string>>(new Set())
  const [animation, setAnimation] = useState(false)
  const [affichage, setAffichage] = useState<string | null>(null)
  const [resultat, setResultat] = useState<{
    presentationId: string
    eleve: { id: string; display_name: string; classe: string | null } | null
  } | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  // Présentation active pour cette semaine (statut 'tire')
  const presentationActive = presentations.find(p => p.statut === 'tire')

  function toggleExclu(id: string) {
    setExcluIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleTirer() {
    setErreur(null)
    setChargement(true)

    const res = await tirerOrateur(semaineId, Array.from(excluIds))
    if (res.error || !res.data) {
      setErreur(res.error ?? 'Erreur inconnue')
      setChargement(false)
      return
    }

    const gagnant = res.data

    // Animation : cycling rapide sur les noms éligibles non exclus
    const candidats = eligibles
      .filter(e => !excluIds.has(e.id))
      .map(e => e.display_name)

    if (candidats.length > 1) {
      setAnimation(true)
      let i = 0
      const interval = setInterval(() => {
        setAffichage(candidats[i % candidats.length])
        i++
      }, 80)

      setTimeout(() => {
        clearInterval(interval)
        setAnimation(false)
        setAffichage(gagnant.eleve?.display_name ?? '?')
        setResultat(gagnant)
        setChargement(false)
        router.refresh()
      }, 1500)
    } else {
      setAffichage(gagnant.eleve?.display_name ?? '?')
      setResultat(gagnant)
      setChargement(false)
      router.refresh()
    }
  }

  async function handleStatut(presentationId: string, statut: 'presente' | 'reporte') {
    setChargement(true)
    await mettreAJourPresentation(presentationId, statut)
    setResultat(null)
    setAffichage(null)
    setChargement(false)
    router.refresh()
  }

  async function handleAnnuler(presentationId: string) {
    setChargement(true)
    await annulerPresentation(presentationId)
    setResultat(null)
    setAffichage(null)
    setChargement(false)
    router.refresh()
  }

  const eligiblesNonExclus = eligibles.filter(e => !excluIds.has(e.id))

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
      <h3 className="font-medium text-stone-900">Tirage au sort</h3>

      {/* Historique des présentations de cette semaine */}
      {presentations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Présentations</p>
          <div className="space-y-1.5">
            {presentations.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-stone-800 font-medium">
                  {p.eleve?.display_name ?? '—'}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.statut === 'presente' ? 'bg-green-100 text-green-700' :
                    p.statut === 'reporte' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {p.statut === 'presente' ? 'A présenté ✓' :
                     p.statut === 'reporte' ? 'Reporté' : 'Tiré'}
                  </span>
                  {p.statut === 'tire' && (
                    <>
                      <button
                        onClick={() => handleStatut(p.id, 'presente')}
                        disabled={chargement}
                        className="text-xs text-green-700 hover:bg-green-50 px-2 py-0.5 rounded border border-green-200"
                      >
                        A présenté
                      </button>
                      <button
                        onClick={() => handleStatut(p.id, 'reporte')}
                        disabled={chargement}
                        className="text-xs text-amber-700 hover:bg-amber-50 px-2 py-0.5 rounded border border-amber-200"
                      >
                        Reporter
                      </button>
                      <button
                        onClick={() => handleAnnuler(p.id)}
                        disabled={chargement}
                        className="text-xs text-stone-400 hover:text-stone-700 px-2 py-0.5 rounded hover:bg-stone-100"
                      >
                        Retirer
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Zone d'animation / résultat */}
      {(animation || affichage) && (
        <div className={`rounded-xl border-2 py-8 text-center transition-all ${
          animation
            ? 'border-stone-300 bg-stone-50'
            : 'border-green-300 bg-green-50'
        }`}>
          <p className={`text-3xl font-serif font-medium transition-all ${
            animation ? 'text-stone-400 blur-[1px]' : 'text-green-800'
          }`}>
            {affichage}
          </p>
          {!animation && resultat?.eleve?.classe && (
            <p className="text-sm text-green-600 mt-1">{resultat.eleve.classe}</p>
          )}
        </div>
      )}

      {/* Bouton principal (si pas de tirage actif) */}
      {!presentationActive && !resultat && eligibles.length > 0 && (
        <div className="space-y-4">
          {/* Exclusions manuelles */}
          <div>
            <p className="text-xs text-stone-500 mb-2">
              Élèves éligibles ({eligiblesNonExclus.length}/{eligibles.length}) — décocher pour exclure :
            </p>
            <div className="flex flex-wrap gap-2">
              {eligibles.map(e => (
                <label key={e.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  excluIds.has(e.id)
                    ? 'bg-stone-100 border-stone-300 text-stone-400 line-through'
                    : 'bg-white border-stone-300 text-stone-700 hover:border-stone-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={!excluIds.has(e.id)}
                    onChange={() => toggleExclu(e.id)}
                    className="sr-only"
                  />
                  {e.display_name}
                  {e.nbPresentations > 0 && (
                    <span className="text-stone-400">({e.nbPresentations}×)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleTirer}
            disabled={chargement || animation || eligiblesNonExclus.length === 0}
            className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {animation ? '…' : chargement ? 'Tirage…' : "Tirer l'orateur de la semaine"}
          </button>
        </div>
      )}

      {eligibles.length === 0 && (
        <p className="text-sm text-stone-400 italic">
          Aucun élève n'a déposé pour cette semaine — le tirage n'est pas disponible.
        </p>
      )}

      {erreur && <p className="text-sm text-red-600">{erreur}</p>}
    </div>
  )
}
