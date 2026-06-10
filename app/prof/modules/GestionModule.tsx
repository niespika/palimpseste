'use client'

import { useState } from 'react'
import { toggleModuleActif, sauvegarderAssignments } from './actions'
import type { Module, Profile } from '@/types'

interface Props {
  module: Module
  eleves: Profile[]
  elevesAssignes: string[] // IDs des élèves qui ont accès à ce module
}

export default function GestionModule({ module, eleves, elevesAssignes }: Props) {
  const [chargementActif, setChargementActif] = useState(false)
  const [chargementAssign, setChargementAssign] = useState(false)
  const [messageAssign, setMessageAssign] = useState<string | null>(null)
  const [selectionnes, setSelectionnes] = useState<Set<string>>(new Set(elevesAssignes))

  async function handleToggleActif() {
    setChargementActif(true)
    const formData = new FormData()
    formData.append('moduleId', module.id)
    formData.append('actif', String(module.actif))
    await toggleModuleActif(formData)
    setChargementActif(false)
  }

  async function handleSauvegarder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargementAssign(true)
    setMessageAssign(null)
    const formData = new FormData()
    formData.append('moduleId', module.id)
    selectionnes.forEach(id => formData.append('eleveIds', id))
    await sauvegarderAssignments(formData)
    setMessageAssign('Accès mis à jour.')
    setChargementAssign(false)
  }

  function toggleEleve(id: string) {
    setSelectionnes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-stone-900">{module.nom}</h3>
          {module.description && (
            <p className="text-sm text-stone-500 mt-0.5">{module.description}</p>
          )}
        </div>
        <button
          onClick={handleToggleActif}
          disabled={chargementActif}
          className={`flex-shrink-0 ml-4 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            module.actif
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          } disabled:opacity-50`}
        >
          {chargementActif ? '…' : module.actif ? 'Actif' : 'En construction'}
        </button>
      </div>

      {eleves.length === 0 ? (
        <p className="text-sm text-stone-400">Aucun élève inscrit pour l'instant.</p>
      ) : (
        <form onSubmit={handleSauvegarder}>
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            Accès élèves ({selectionnes.size}/{eleves.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-4">
            {eleves.map(eleve => (
              <label
                key={eleve.id}
                className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  checked={selectionnes.has(eleve.id)}
                  onChange={() => toggleEleve(eleve.id)}
                  className="rounded border-stone-300 text-stone-800 focus:ring-stone-400"
                />
                <span className="text-sm text-stone-700">{eleve.display_name}</span>
              </label>
            ))}
          </div>
          {messageAssign && (
            <p className="text-sm text-green-600 mb-3">{messageAssign}</p>
          )}
          <button
            type="submit"
            disabled={chargementAssign}
            className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50 transition-colors"
          >
            {chargementAssign ? 'Sauvegarde…' : 'Sauvegarder les accès'}
          </button>
        </form>
      )}
    </div>
  )
}
