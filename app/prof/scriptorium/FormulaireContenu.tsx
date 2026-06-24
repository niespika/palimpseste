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
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
      >
        + Ajouter des unités
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-medium text-encre">Nouveau contenu</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Unité</label>
          <select
            name="uniteId"
            value={uniteChoisie}
            onChange={e => setUniteChoisie(e.target.value)}
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          >
            <option value="">— Nouvelle unité —</option>
            {unites.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
          {uniteChoisie === '' && (
            <input
              name="nouvelleUnite"
              placeholder="Nom de l'unité (ex. : Le bonheur)"
              className="mt-2 w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Semaine</label>
          <input
            name="semaine"
            type="number"
            min={1}
            max={52}
            placeholder="N°"
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Nom du contenu</label>
          <input
            name="nom"
            required
            placeholder="Ex. : Texte de Spinoza"
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muet mb-1">Type de contenu</label>
        <select
          name="objetType"
          defaultValue="cours"
          className="w-full sm:w-72 px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
        >
          <option value="cours">Cours (leçon)</option>
          <option value="texte">Texte d&apos;étude (source pour Quazian)</option>
        </select>
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

      <div>
        <label className="block text-xs font-medium text-muet mb-1">Corps — texte <span className="font-normal">(collé ou extrait du fichier)</span></label>
        <textarea
          name="texte"
          rows={5}
          placeholder="Colle ici le texte du cours, l'extrait, etc."
          className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Fichier <span className="font-normal">(image, ou PDF/DOCX/TXT → texte extrait)</span></label>
          <input
            type="file"
            name="fichier"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,.gif"
            className="w-full text-sm text-encre-douce file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-parchemin-fonce file:text-encre-douce hover:file:bg-bordure"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Légende <span className="font-normal">(si image — optionnel)</span></label>
          <input
            name="legende"
            placeholder="Description de l'image (carte, schéma…)"
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
      </div>

      {erreur && <p className="text-retard text-sm">{erreur}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={chargement} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {chargement ? '…' : 'Ajouter'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">
          Annuler
        </button>
      </div>
    </form>
  )
}
