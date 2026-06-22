'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

// Filtre par classe (multi-sélection). Aucune sélection explicite = toutes.
// Modulaire : la logique d'affichage vit dans la vue, ce composant ne pilote
// que le paramètre d'URL `classes`.
export default function FiltreClasses({
  classes,
  couleurs,
}: {
  classes: { id: string; nom: string }[]
  couleurs: Record<string, string>
}) {
  const router = useRouter()
  const sp = useSearchParams()
  const pathname = usePathname()

  const param = sp.get('classes')
  // null = toutes ; 'aucune' = ensemble vide ; sinon liste explicite.
  const selection = param === 'aucune' ? [] : param ? param.split(',').filter(Boolean) : null
  const estSel = (id: string) => selection === null || selection.includes(id)

  function pousser(next: string[] | null) {
    const params = new URLSearchParams(sp.toString())
    if (next === null || next.length === classes.length) params.delete('classes')
    else if (next.length === 0) params.set('classes', 'aucune') // sentinelle « rien »
    else params.set('classes', next.join(','))
    router.push(`${pathname}?${params.toString()}`)
  }

  function basculer(id: string) {
    const base = selection === null ? classes.map((c) => c.id) : [...selection]
    const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id]
    pousser(next)
  }

  if (classes.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => pousser(null)}
        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
          selection === null
            ? 'bg-stone-800 text-white border-stone-800'
            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
        }`}
      >
        Toutes
      </button>
      {classes.map((c) => {
        const actif = estSel(c.id)
        return (
          <button
            key={c.id}
            onClick={() => basculer(c.id)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1.5 ${
              actif ? 'border-stone-400 bg-white text-stone-800' : 'border-stone-200 bg-stone-50 text-stone-400'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: actif ? couleurs[c.id] ?? '#a8a29e' : '#d6d3d1' }}
            />
            {c.nom}
          </button>
        )
      })}
    </div>
  )
}
