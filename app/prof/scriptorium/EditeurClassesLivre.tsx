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
        <span className="text-xs text-muet">Classes :</span>
        {noms.length === 0
          ? <span className="text-xs text-attention">aucune</span>
          : noms.map(n => <span key={n} className="text-xs bg-info-teinte text-info px-1.5 py-0.5 rounded">{n}</span>)}
        <button onClick={() => { setSet(new Set(assignedClasseIds)); setEdition(true) }} className="text-xs text-muet hover:text-encre underline">Modifier</button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {classes.map(c => {
        const on = set.has(c.id)
        return (
          <button key={c.id} type="button" onClick={() => toggle(c.id)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${on ? 'bg-bouton text-surface border-bouton' : 'bg-surface text-encre-douce border-bordure hover:border-pigment'}`}>
            {c.nom}
          </button>
        )
      })}
      <button onClick={save} disabled={chargement} className="text-xs bg-bouton text-surface px-2 py-1 rounded disabled:opacity-50">{chargement ? '…' : 'Enregistrer'}</button>
      <button onClick={() => setEdition(false)} className="text-xs text-muet">Annuler</button>
    </div>
  )
}
