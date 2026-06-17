'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toggleModuleActif, accorderAccesClasse, retirerAccesClasse } from './actions'

interface ClasseRef { id: string; nom: string }
interface Props {
  module: { id: string; nom: string; description: string | null; actif: boolean }
  classesAvecAcces: ClasseRef[]
  classesDisponibles: ClasseRef[]
}

// Détail d'un module (Lot 4) : bascule actif/fermé + gestion de l'accès PAR CLASSE
// (accorder via déroulant, retirer). Aucun réglage par élève.
export default function DetailModule({ module, classesAvecAcces, classesDisponibles }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [sel, setSel] = useState('')

  async function lancer(fn: (fd: FormData) => Promise<unknown>, fd: FormData) {
    setPending(true)
    await fn(fd)
    setPending(false)
    router.refresh()
  }

  function handleToggle() {
    const fd = new FormData()
    fd.append('moduleId', module.id)
    fd.append('actif', String(module.actif))
    lancer(toggleModuleActif, fd)
  }

  function handleAccorder() {
    if (!sel) return
    const fd = new FormData()
    fd.append('moduleId', module.id)
    fd.append('classeId', sel)
    setSel('')
    lancer(accorderAccesClasse, fd)
  }

  function handleRetirer(classeId: string) {
    const fd = new FormData()
    fd.append('moduleId', module.id)
    fd.append('classeId', classeId)
    lancer(retirerAccesClasse, fd)
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-stone-900">{module.nom}</h3>
          {module.description && <p className="text-sm text-stone-500 mt-0.5">{module.description}</p>}
        </div>
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
            module.actif
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {pending ? '…' : module.actif ? 'Actif' : 'Fermé'}
        </button>
      </div>

      <div className="px-5 py-4 space-y-3">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Classes ayant accès</p>

        {classesAvecAcces.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {classesAvecAcces.map((c) => (
              <span key={c.id} className="inline-flex items-center gap-1.5 text-sm bg-stone-100 text-stone-700 rounded-full pl-3 pr-1.5 py-1">
                {c.nom}
                <button
                  onClick={() => handleRetirer(c.id)}
                  disabled={pending}
                  title="Retirer l'accès"
                  className="text-stone-400 hover:text-red-600 disabled:opacity-50 w-4 h-4 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400">Aucune classe n'a accès à ce module.</p>
        )}

        {classesDisponibles.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <select
              value={sel}
              onChange={(e) => setSel(e.target.value)}
              className="text-sm border border-stone-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Accorder l'accès à une classe…</option>
              {classesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <button
              onClick={handleAccorder}
              disabled={pending || !sel}
              className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50"
            >
              Accorder
            </button>
          </div>
        )}

        {!module.actif && (
          <p className="text-xs text-stone-400 pt-1">
            Module fermé : même avec un accès de classe, les élèves ne le voient pas tant qu'il n'est pas actif.
          </p>
        )}
      </div>
    </div>
  )
}
