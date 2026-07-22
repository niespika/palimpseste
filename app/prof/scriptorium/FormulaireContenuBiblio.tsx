'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerContenu } from './actions'

// Formulaire d'ajout d'un item de bibliothèque. Le `type` (texte|cours) est FIXÉ
// par l'onglet (implicite, champ caché) : pas d'unité / semaine / classe ici.
export default function FormulaireContenuBiblio({ type }: { type: 'texte' | 'cours' }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const estTexte = type === 'texte'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    setChargement(true)
    const res = await creerContenu(fd)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    // Fermer démonte le formulaire (inputs non contrôlés → vides à la réouverture).
    // Pas de e.currentTarget.reset() : après un await, currentTarget est null.
    setOuvert(false)
    // Un COURS importé avec un corps de texte enchaîne sur sa découpe en sections
    // (RAG L2, décision 3 : le prof déclare chapitres/sous-chapitres à l'import).
    if (type === 'cours' && res.aTexte && res.id) {
      router.push(`/prof/scriptorium?vue=cours&decouper=${res.id}`)
      router.refresh()
      return
    }
    router.refresh()
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
      >
        {estTexte ? '+ Ajouter un texte' : '+ Ajouter un cours'}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
      <input type="hidden" name="type" value={type} />
      <h3 className="text-sm font-medium text-encre">{estTexte ? 'Nouveau texte' : 'Nouveau cours'}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Titre</label>
          <input
            name="titre"
            required
            placeholder={estTexte ? 'Ex. : Éthique, Spinoza (extrait)' : 'Ex. : Le bonheur — leçon 1'}
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muet mb-1">Auteur <span className="font-normal">(optionnel)</span></label>
          <input
            name="auteur"
            placeholder={estTexte ? 'Ex. : Spinoza' : ''}
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muet mb-1">Chapitres / références <span className="font-normal">(ex. : Chap. 1-4 — optionnel)</span></label>
        <input
          name="chapitres"
          placeholder="Repère de lecture (optionnel)"
          className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muet mb-1">Corps — texte <span className="font-normal">(collé ou extrait du fichier)</span></label>
        <textarea
          name="texte"
          rows={6}
          placeholder={estTexte ? 'Colle ici le texte à étudier…' : 'Colle ici le contenu du cours…'}
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
