'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inscrireEleve, retirerEleve, definirModulesClasse } from './actions'
import ConfirmationEffacement from './ConfirmationEffacement'

interface Props {
  classe: {
    id: string
    nom: string
    niveau: string | null
    filiere: string | null
    annee_scolaire: string
    statut: string
  }
  inscrits: { id: string; display_name: string }[]
  tousEleves: { id: string; display_name: string }[]
  modules: { id: string; nom: string; actif: boolean }[]
  moduleIdsAssignes: string[]
}

const NIVEAU_LABEL: Record<string, string> = { '1ere': 'Première', terminale: 'Terminale' }

export function GestionClasse({ classe, inscrits, tousEleves, modules, moduleIdsAssignes }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [selEleve, setSelEleve] = useState('')
  const [selModules, setSelModules] = useState<Set<string>>(new Set(moduleIdsAssignes))
  const [messageModules, setMessageModules] = useState<string | null>(null)

  const inscritsIds = new Set(inscrits.map((e) => e.id))
  const disponibles = tousEleves.filter((e) => !inscritsIds.has(e.id))

  async function action(fn: (fd: FormData) => Promise<unknown>, fd: FormData) {
    setPending(true)
    await fn(fd)
    setPending(false)
    router.refresh()
  }

  async function handleInscrire() {
    if (!selEleve) return
    const fd = new FormData()
    fd.append('classeId', classe.id)
    fd.append('eleveId', selEleve)
    setSelEleve('')
    await action(inscrireEleve, fd)
  }

  async function handleRetirer(eleveId: string) {
    const fd = new FormData()
    fd.append('classeId', classe.id)
    fd.append('eleveId', eleveId)
    await action(retirerEleve, fd)
  }

  async function handleSauverModules() {
    setPending(true)
    setMessageModules(null)
    const fd = new FormData()
    fd.append('classeId', classe.id)
    selModules.forEach((id) => fd.append('moduleIds', id))
    await definirModulesClasse(fd)
    setPending(false)
    setMessageModules('Accès mis à jour.')
    router.refresh()
  }

  function toggleModule(id: string) {
    setSelModules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sousTitre = [classe.niveau ? NIVEAU_LABEL[classe.niveau] ?? classe.niveau : null, classe.filiere, classe.annee_scolaire]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-stone-900">{classe.nom}</h3>
            {classe.statut === 'fermee' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">fermée</span>
            )}
          </div>
          {sousTitre && <p className="text-xs text-stone-400 mt-0.5">{sousTitre}</p>}
        </div>
        <ConfirmationEffacement classeId={classe.id} classeNom={classe.nom} nbEleves={inscrits.length} />
      </div>

      {/* Élèves inscrits */}
      <div className="mb-4">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
          Élèves ({inscrits.length})
        </p>
        {inscrits.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {inscrits.map((e) => (
              <span key={e.id} className="inline-flex items-center gap-1.5 text-sm bg-stone-100 text-stone-700 rounded-full pl-3 pr-1.5 py-1">
                {e.display_name}
                <button
                  onClick={() => handleRetirer(e.id)}
                  disabled={pending}
                  title="Retirer de la classe"
                  className="text-stone-400 hover:text-red-600 disabled:opacity-50 w-4 h-4 leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-stone-400 mb-2">Aucun élève inscrit.</p>
        )}

        {disponibles.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selEleve}
              onChange={(e) => setSelEleve(e.target.value)}
              className="text-sm border border-stone-300 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="">Ajouter un élève…</option>
              {disponibles.map((e) => (
                <option key={e.id} value={e.id}>{e.display_name}</option>
              ))}
            </select>
            <button
              onClick={handleInscrire}
              disabled={pending || !selEleve}
              className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50"
            >
              Inscrire
            </button>
          </div>
        )}
      </div>

      {/* Accès modules */}
      <div className="border-t border-stone-100 pt-4">
        <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
          Accès aux modules
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {modules.map((m) => (
            <label key={m.id} className="flex items-center gap-1.5 text-sm cursor-pointer bg-stone-50 hover:bg-stone-100 rounded-lg px-2.5 py-1">
              <input
                type="checkbox"
                checked={selModules.has(m.id)}
                onChange={() => toggleModule(m.id)}
                className="accent-stone-700"
              />
              <span className="text-stone-700">{m.nom}</span>
              {!m.actif && <span className="text-xs text-stone-400">(inactif)</span>}
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSauverModules}
            disabled={pending}
            className="text-sm px-3 py-1.5 bg-stone-800 text-white rounded-lg hover:bg-stone-900 disabled:opacity-50"
          >
            Sauvegarder les accès
          </button>
          {messageModules && <span className="text-sm text-green-600">{messageModules}</span>}
        </div>
      </div>
    </div>
  )
}
