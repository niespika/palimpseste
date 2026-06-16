'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toggleModuleActif } from './actions'
import type { Module } from '@/types'

interface Props {
  module: Module
  classesAvecAcces: string[]
}

export default function GestionModule({ module, classesAvecAcces }: Props) {
  const [chargementActif, setChargementActif] = useState(false)

  async function handleToggleActif() {
    setChargementActif(true)
    const formData = new FormData()
    formData.append('moduleId', module.id)
    formData.append('actif', String(module.actif))
    await toggleModuleActif(formData)
    setChargementActif(false)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
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

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Accès :</span>
        {classesAvecAcces.length > 0 ? (
          classesAvecAcces.map((nom) => (
            <span key={nom} className="text-xs bg-stone-100 text-stone-700 rounded-full px-2.5 py-0.5">
              {nom}
            </span>
          ))
        ) : (
          <span className="text-sm text-stone-400">aucune classe</span>
        )}
        <Link href="/prof/classes" className="text-xs text-stone-500 hover:text-stone-800 underline ml-1">
          gérer par classe →
        </Link>
      </div>
    </div>
  )
}
