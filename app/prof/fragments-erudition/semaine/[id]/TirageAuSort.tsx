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
    <div className="bg-surface border border-bordure rounded-xl p-5 space-y-5">
      <h3 className="font-medium text-encre">Tirage au sort</h3>

      {/* Historique des présentations de cette semaine */}
      {presentations.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muet uppercase tracking-wide">Présentations</p>
          <div className="space-y-1.5">
            {presentations.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-encre font-medium">{p.eleve?.display_name ?? '—'}</span>
                  <Link
                    href={`/prof/fragments-erudition/presentation/${p.id}`}
                    className="text-xs text-muet hover:text-encre-douce underline"
                  >
                    Fiche
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    p.statut === 'presente' ? 'bg-ok-teinte text-ok' :
                    p.statut === 'reporte' ? 'bg-attention-teinte text-attention' :
                    'bg-info-teinte text-info'
                  }`}>
                    {p.statut === 'presente' ? 'A présenté ✓' :
                     p.statut === 'reporte' ? 'Reporté' : 'Tiré'}
                  </span>
                  {p.statut === 'tire' && (
                    <>
                      <button
                        onClick={() => handleStatut(p.id, 'presente')}
                        disabled={chargement}
                        className="text-xs text-ok hover:bg-ok-teinte px-2 py-0.5 rounded border border-ok"
                      >
                        A présenté
                      </button>
                      <button
                        onClick={() => handleStatut(p.id, 'reporte')}
                        disabled={chargement}
                        className="text-xs text-attention hover:bg-attention-teinte px-2 py-0.5 rounded border border-attention"
                      >
                        Reporter
                      </button>
                      <button
                        onClick={() => handleAnnuler(p.id)}
                        disabled={chargement}
                        className="text-xs text-muet hover:text-encre-douce px-2 py-0.5 rounded hover:bg-parchemin-fonce"
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
            ? 'border-bordure bg-parchemin-fonce'
            : 'border-ok bg-ok-teinte'
        }`}>
          <p className={`text-2xl font-serif font-medium transition-all ${
            animation ? 'text-muet blur-[1px]' : 'text-ok'
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
            <label className="text-xs text-muet">Nombre d&apos;orateurs</label>
            <input
              type="number"
              min={1}
              max={eligiblesNonExclus.length || 1}
              value={nombre}
              onChange={e => setNombre(Math.max(1, Number(e.target.value)))}
              className="w-16 px-2 py-1 border border-bordure rounded text-sm"
            />
          </div>
          {/* Exclusions manuelles */}
          <div>
            <p className="text-xs text-muet mb-2">
              Élèves éligibles ({eligiblesNonExclus.length}/{eligibles.length}) — décocher pour exclure :
            </p>
            <div className="flex flex-wrap gap-2">
              {eligibles.map(e => (
                <label key={e.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  excluIds.has(e.id)
                    ? 'bg-parchemin-fonce border-bordure text-muet line-through'
                    : 'bg-surface border-bordure text-encre-douce hover:border-pigment'
                }`}>
                  <input
                    type="checkbox"
                    checked={!excluIds.has(e.id)}
                    onChange={() => toggleExclu(e.id)}
                    className="sr-only"
                  />
                  {e.display_name}
                  {e.nbPresentations > 0 && (
                    <span className="text-muet">({e.nbPresentations}×)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleTirer}
            disabled={chargement || animation || eligiblesNonExclus.length === 0}
            className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {animation || chargement ? 'Tirage…' : `Désigner ${nombre} orateur${nombre > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {eligibles.length === 0 && (
        <p className="text-sm text-muet italic">
          Aucun élève n'a déposé pour cette semaine — le tirage n'est pas disponible.
        </p>
      )}

      {erreur && <p className="text-sm text-retard">{erreur}</p>}
    </div>
  )
}
