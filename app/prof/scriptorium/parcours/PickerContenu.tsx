'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ajouterCreneau, type RefCreneau } from '../actions'
import type { CiblesPicker } from './donnees'

// Panneau « + Ajouter » d'une semaine : onglets internes Textes / Cours / Livres
// + recherche. Un livre s'ajoute entier ou en tranche (bornes dans son étendue).
export default function PickerContenu({
  parcoursId,
  semaine,
  cibles,
  onClose,
}: {
  parcoursId: string
  semaine: number
  cibles: CiblesPicker
  onClose: () => void
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'textes' | 'cours' | 'livres'>('textes')
  const [q, setQ] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [livreTranche, setLivreTranche] = useState<string | null>(null)
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')

  const filtresContenu = useMemo(() => {
    if (tab === 'livres') return []
    const src = tab === 'textes' ? cibles.textes : cibles.cours
    const s = q.trim().toLowerCase()
    return src.filter(c => !s || c.titre.toLowerCase().includes(s) || (c.auteur ?? '').toLowerCase().includes(s))
  }, [tab, q, cibles.textes, cibles.cours])
  const filtresLivres = useMemo(() => {
    if (tab !== 'livres') return []
    const s = q.trim().toLowerCase()
    return cibles.livres.filter(l => !s || l.label.toLowerCase().includes(s))
  }, [tab, q, cibles.livres])

  async function ajouter(ref: RefCreneau) {
    setErreur(null)
    setChargement(true)
    const res = await ajouterCreneau(parcoursId, semaine, ref)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    router.refresh()
    onClose()
  }

  async function ajouterLivreTranche(livreId: string, max: number) {
    const d = Number(debut), f = Number(fin)
    if (!Number.isInteger(d) || !Number.isInteger(f) || d < 1 || f < d || f > max) {
      setErreur(`Tranche invalide (1–${max}).`)
      return
    }
    await ajouter({ livreId, semaineDebut: d, semaineFin: f })
  }

  const ongletBtn = (t: typeof tab) =>
    `text-xs px-2 py-1 rounded ${tab === t ? 'bg-pigment text-surface' : 'text-encre-douce hover:bg-pigment-teinte'}`

  return (
    <div className="border border-pigment rounded-lg p-3 bg-surface space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button onClick={() => { setTab('textes'); setLivreTranche(null) }} className={ongletBtn('textes')}>Textes</button>
          <button onClick={() => { setTab('cours'); setLivreTranche(null) }} className={ongletBtn('cours')}>Cours</button>
          <button onClick={() => { setTab('livres'); setLivreTranche(null) }} className={ongletBtn('livres')}>Livres</button>
        </div>
        <button onClick={onClose} className="text-xs text-muet hover:text-encre">Fermer ✕</button>
      </div>

      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Rechercher…"
        className="w-full px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment"
      />

      {erreur && <p className="text-retard text-xs">{erreur}</p>}

      <div className="max-h-64 overflow-y-auto space-y-1">
        {tab !== 'livres' && (
          filtresContenu.length === 0 ? (
            <p className="text-xs text-muet px-1">
              {q.trim() ? 'Aucun résultat.' : `Aucun ${tab === 'textes' ? 'texte' : 'cours'} — crée-en dans l'onglet dédié.`}
            </p>
          ) : (
            filtresContenu.map(c => (
              <button
                key={c.id}
                disabled={chargement}
                onClick={() => ajouter({ contenuId: c.id })}
                className="w-full text-left px-2 py-1.5 rounded border border-bordure hover:border-pigment text-sm text-encre disabled:opacity-50"
              >
                {c.titre}{c.auteur ? <span className="text-muet"> · {c.auteur}</span> : null}
              </button>
            ))
          )
        )}

        {tab === 'livres' && (
          cibles.livres.length === 0 ? (
            <p className="text-xs text-muet px-1">Aucun livre. Crée un livre dans Ressources → Livres.</p>
          ) : filtresLivres.length === 0 ? (
            <p className="text-xs text-muet px-1">Aucun résultat.</p>
          ) : (
            filtresLivres.map(l => (
              <div key={l.id} className="border border-bordure rounded p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-encre min-w-0 truncate">
                    {l.label} <span className="text-muet text-xs">· {l.maxSemaine} sem.</span>
                  </span>
                  <div className="flex gap-1 flex-shrink-0">
                    <button disabled={chargement} onClick={() => ajouter({ livreId: l.id })}
                      className="text-xs bg-bouton text-surface px-2 py-1 rounded disabled:opacity-50">Entier</button>
                    <button onClick={() => { setLivreTranche(livreTranche === l.id ? null : l.id); setDebut(''); setFin(''); setErreur(null) }}
                      className="text-xs border border-bordure px-2 py-1 rounded text-encre-douce">Tranche…</button>
                  </div>
                </div>
                {livreTranche === l.id && (
                  <div className="flex items-center gap-2 mt-2">
                    <input value={debut} onChange={e => setDebut(e.target.value)} type="number" min={1} max={l.maxSemaine} placeholder="début"
                      className="w-20 px-2 py-1 border border-bordure rounded text-xs text-encre" />
                    <span className="text-muet text-xs">→</span>
                    <input value={fin} onChange={e => setFin(e.target.value)} type="number" min={1} max={l.maxSemaine} placeholder="fin"
                      className="w-20 px-2 py-1 border border-bordure rounded text-xs text-encre" />
                    <button disabled={chargement} onClick={() => ajouterLivreTranche(l.id, l.maxSemaine)}
                      className="text-xs bg-bouton text-surface px-2 py-1 rounded disabled:opacity-50">Ajouter</button>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}
