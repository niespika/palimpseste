'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ajouterContenu } from './actions'

interface Props {
  unites: { id: string; label: string }[]
  classes: { id: string; nom: string }[]
}

export default function FormulaireContenu({ unites, classes }: Props) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [uniteChoisie, setUniteChoisie] = useState('')
  const [classesChoisies, setClassesChoisies] = useState<Set<string>>(new Set())

  function toggleClasse(id: string) {
    setClassesChoisies(prev => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    if (classesChoisies.size === 0) { setErreur('Assigne au moins une classe.'); return }
    const fd = new FormData(e.currentTarget)
    classesChoisies.forEach(id => fd.append('classeIds', id))
    setChargement(true)
    const res = await ajouterContenu(fd)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setOuvert(false)
    setUniteChoisie('')
    setClassesChoisies(new Set())
    router.refresh()
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors"
      >
        + Ajouter du contenu
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-medium text-stone-900">Nouveau contenu</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Unité</label>
          <select
            name="uniteId"
            value={uniteChoisie}
            onChange={e => setUniteChoisie(e.target.value)}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900"
          >
            <option value="">— Nouvelle unité —</option>
            {unites.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
          {uniteChoisie === '' && (
            <input
              name="nouvelleUnite"
              placeholder="Nom de l'unité (ex. : Le bonheur)"
              className="mt-2 w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Semaine</label>
          <input
            name="semaine"
            type="number"
            min={1}
            max={52}
            placeholder="N°"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Nom du contenu</label>
          <input
            name="nom"
            required
            placeholder="Ex. : Texte de Spinoza"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Classes concernées</label>
        {classes.length === 0 ? (
          <p className="text-sm text-stone-400">Aucune classe.</p>
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
                    on ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {c.nom}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Corps — texte <span className="font-normal">(collé ou extrait du fichier)</span></label>
        <textarea
          name="texte"
          rows={5}
          placeholder="Colle ici le texte du cours, l'extrait, etc."
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y text-stone-900"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Fichier <span className="font-normal">(image, ou PDF/DOCX/TXT → texte extrait)</span></label>
          <input
            type="file"
            name="fichier"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif"
            className="w-full text-sm text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-stone-500 mb-1">Légende <span className="font-normal">(si image — optionnel)</span></label>
          <input
            name="legende"
            placeholder="Description de l'image (carte, schéma…)"
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 text-stone-900"
          />
        </div>
      </div>

      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={chargement} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50">
          {chargement ? '…' : 'Ajouter'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">
          Annuler
        </button>
      </div>
    </form>
  )
}
