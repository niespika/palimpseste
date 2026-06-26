'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ajouterLivre } from './actions'

interface Props {
  classes: { id: string; nom: string }[]
}

// Ajout d'un « livre » Scriptorium (lecture autonome multi-semaines, module Aletheia).
// Flux distinct de l'ajout d'unité : titre + durée + date de début + classes,
// puis un bloc par semaine (PDF d'ancrage + titre + référence de chapitres).
export default function FormulaireLivre({ classes }: Props) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [nb, setNb] = useState(8)
  const [classesChoisies, setClassesChoisies] = useState<Set<string>>(new Set())

  function toggleClasse(id: string) {
    setClassesChoisies(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  function reset() {
    setOuvert(false)
    setNb(8)
    setClassesChoisies(new Set())
    setErreur(null)
  }

  // Limite des Server Actions (next.config.ts : 50 Mo) ; on garde une marge.
  const TAILLE_MAX = 45 * 1024 * 1024

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    if (classesChoisies.size === 0) { setErreur('Assigne au moins une classe.'); return }
    const fd = new FormData(e.currentTarget)
    classesChoisies.forEach(id => fd.append('classeIds', id))

    // Garde de taille : tous les PDF transitent dans une seule requête.
    let total = 0
    for (const [, v] of fd.entries()) if (v instanceof File) total += v.size
    if (total > TAILLE_MAX) {
      setErreur(`Total des PDF trop volumineux (${Math.round(total / 1024 / 1024)} Mo > 45 Mo). Allège les fichiers ou crée le livre en deux fois.`)
      return
    }

    setChargement(true)
    try {
      const res = await ajouterLivre(fd)
      if (res?.error) { setErreur(res.error); return }
      reset()
      router.refresh()
    } catch {
      setErreur("L'envoi a échoué (fichiers peut-être trop volumineux). Réessaie avec des PDF plus légers.")
    } finally {
      setChargement(false)
    }
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="w-full bg-surface border border-bordure text-encre py-2.5 rounded-xl text-sm font-medium hover:bg-parchemin-fonce transition-colors"
      >
        + Ajouter un livre
      </button>
    )
  }

  const semaines = Array.from({ length: nb }, (_, i) => i + 1)

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-medium text-encre">Nouveau livre <span className="font-normal text-muet">(lecture autonome — Aletheia)</span></h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-3">
          <label className="block text-xs font-medium text-muet mb-1">Titre du livre</label>
          <input
            name="titre"
            required
            placeholder="Ex. : La Naissance de la tragédie"
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Nombre de semaines</label>
          <input
            name="nbSemaines"
            type="number"
            min={1}
            max={52}
            value={nb}
            onChange={e => setNb(Math.max(1, Math.min(52, Number(e.target.value) || 1)))}
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-muet mb-1">Date de début de la lecture</label>
          <input
            name="dateDebut"
            type="date"
            required
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muet mb-1">Classes concernées</label>
        {classes.length === 0 ? (
          <p className="text-sm text-muet">Aucune classe.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {classes.map(c => {
              const on = classesChoisies.has(c.id)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClasse(c.id)}
                  className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                    on ? 'bg-bouton text-surface border-bouton' : 'bg-surface text-encre-douce border-bordure hover:border-pigment'
                  }`}
                >
                  {c.nom}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Un bloc par semaine : PDF d'ancrage + titre + chapitres à lire */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muet">
          Programme par semaine
          <span className="font-normal text-muet"> — le PDF sert d&apos;ancrage à l&apos;IA, l&apos;élève lit son propre exemplaire</span>
        </p>
        {semaines.map(n => (
          <div key={n} className="border border-bordure rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-encre-douce">Semaine {n}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                name={`semaine_${n}_titre`}
                placeholder={`Titre (ex. : Apollon et Dionysos)`}
                className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment"
              />
              <input
                name={`semaine_${n}_chapitres`}
                placeholder="Chapitres (ex. : Chap. 1-4)"
                className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment"
              />
            </div>
            <input
              type="file"
              name={`semaine_${n}_pdf`}
              accept=".pdf,.docx,.txt"
              className="w-full text-sm text-encre-douce file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-parchemin-fonce file:text-encre-douce hover:file:bg-bordure"
            />
          </div>
        ))}
      </div>

      {erreur && <p className="text-retard text-sm">{erreur}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={chargement} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {chargement ? 'Ajout en cours…' : 'Ajouter le livre'}
        </button>
        <button type="button" onClick={reset} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
          Annuler
        </button>
      </div>
    </form>
  )
}
