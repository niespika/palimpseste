'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reassignerClassesLivre } from './actions'

interface Props {
  uniteId: string
  classes: { id: string; nom: string }[]
  assignedClasseIds: string[]
}

// Édition des classes d'un livre AU NIVEAU DU LIVRE (un seul jeu pour toutes les
// semaines) — la source de vérité du planning élève (scriptorium_unite_classes).
export default function EditeurClassesLivre({ uniteId, classes, assignedClasseIds }: Props) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [set, setSet] = useState<Set<string>>(new Set(assignedClasseIds))

  const noms = classes.filter(c => assignedClasseIds.includes(c.id)).map(c => c.nom)

  function toggle(id: string) {
    setSet(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  async function save() {
    setChargement(true)
    await reassignerClassesLivre(uniteId, [...set])
    setChargement(false)
    setEdition(false)
    router.refresh()
  }

  if (!edition) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-stone-400">Classes :</span>
        {noms.length === 0
          ? <span className="text-xs text-amber-600">aucune</span>
          : noms.map(n => <span key={n} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{n}</span>)}
        <button onClick={() => { setSet(new Set(assignedClasseIds)); setEdition(true) }} className="text-xs text-stone-500 hover:text-stone-800 underline">Modifier</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {classes.map(c => {
        const on = set.has(c.id)
        return (
          <button key={c.id} type="button" onClick={() => toggle(c.id)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${on ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-300 hover:border-stone-400'}`}>
            {c.nom}
          </button>
        )
      })}
      <button onClick={save} disabled={chargement} className="text-xs bg-stone-800 text-white px-2 py-1 rounded disabled:opacity-50">{chargement ? '…' : 'Enregistrer'}</button>
      <button onClick={() => setEdition(false)} className="text-xs text-stone-500">Annuler</button>
    </div>
  )
}
