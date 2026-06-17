'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  classeId: string
  eligibles: EleveEligible[]
  presentations: PresentationAvecEleve[]
}

export default function TirageAuSort({ semaineId, classeId, eligibles, presentations }: Props) {
  const router = useRouter()
  const [excluIds, setExcluIds] = useState<Set<string>>(new Set())
  const [nombre, setNombre] = useState(1)
  const [animation, setAnimation] = useState(false)
  const [affichage, setAffichage] = useState<string | null>(null)
  const [tireFait, setTireFait] = useState(false)
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

  // Fixer le nombre puis DÉSIGNER ce nombre d'élèves : on tire N orateurs
  // distincts (pondéré), chacun excluant les précédents.
  async function handleTirer() {
    setErreur(null)
    setChargement(true)

    const candidats = eligibles.filter(e => !excluIds.has(e.id)).map(e => e.display_name)
    const cible = Math.min(nombre, candidats.length)
    if (cible < 1) { setErreur('Aucun élève éligible.'); setChargement(false); return }

    // Petite animation de suspense
    setAnimation(true)
    let i = 0
    const interval = setInterval(() => { setAffichage(candidats[i % candidats.length]); i++ }, 80)

    const exclus = new Set(excluIds)
    const gagnants: string[] = []
    for (let k = 0; k < cible; k++) {
      const res = await tirerOrateur(semaineId, classeId, Array.from(exclus))
      if (res.error || !res.data) { if (k === 0) setErreur(res.error ?? 'Erreur inconnue'); break }
      if (res.data.eleve?.display_name) gagnants.push(res.data.eleve.display_name)
      if (res.data.eleve?.id) exclus.add(res.data.eleve.id)
    }

    clearInterval(interval)
    setAnimation(false)
    setAffichage(gagnants.length > 0 ? gagnants.join(', ') : null)
    setTireFait(gagnants.length > 0)
    setChargement(false)
    router.refresh()
  }

  async function handleStatut(presentationId: string, statut: 'presente' | 'reporte') {
    setChargement(true)
    await mettreAJourPresentation(presentationId, statut)
    setTireFait(false)
    setAffichage(null)
    setChargement(false)
    router.refresh()
  }

  async function handleAnnuler(presentationId: string) {
    setChargement(true)
    await annulerPresentation(presentationId)
    setTireFait(false)
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
                <div className="flex items-center gap-2">
                  <span className="text-stone-800 font-medium">{p.eleve?.display_name ?? '—'}</span>
                  <Link
                    href={`/prof/fragments-erudition/presentation/${p.id}`}
                    className="text-xs text-stone-400 hover:text-stone-700 underline"
                  >
                    Fiche
                  </Link>
                </div>
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
          <p className={`text-2xl font-serif font-medium transition-all ${
            animation ? 'text-stone-400 blur-[1px]' : 'text-green-800'
          }`}>
            {affichage}
          </p>
        </div>
      )}

      {/* Bouton principal (si pas de tirage actif) */}
      {!presentationActive && !tireFait && eligibles.length > 0 && (
        <div className="space-y-4">
          {/* Nombre d'orateurs à désigner */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500">Nombre d&apos;orateurs</label>
            <input
              type="number"
              min={1}
              max={eligiblesNonExclus.length || 1}
              value={nombre}
              onChange={e => setNombre(Math.max(1, Number(e.target.value)))}
              className="w-16 px-2 py-1 border border-stone-300 rounded text-sm"
            />
          </div>
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
            {animation || chargement ? 'Tirage…' : `Désigner ${nombre} orateur${nombre > 1 ? 's' : ''}`}
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
