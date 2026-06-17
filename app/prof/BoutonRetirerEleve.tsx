'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { retirerEleve } from './classes/actions'

// Retrait d'un élève d'une classe depuis le détail du dashboard (action Lot 2).
export default function BoutonRetirerEleve({ classeId, eleveId, nom }: { classeId: string; eleveId: string; nom: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function retirer() {
    if (!confirm(`Retirer ${nom} de cette classe ? Son travail dans CETTE classe sera supprimé (compte et autres classes intacts).`)) return
    setPending(true)
    const fd = new FormData()
    fd.append('classeId', classeId)
    fd.append('eleveId', eleveId)
    await retirerEleve(fd)
    setPending(false)
    router.refresh()
  }

  return (
    <button
      onClick={retirer}
      disabled={pending}
      className="text-xs text-stone-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
    >
      {pending ? '…' : 'Retirer'}
    </button>
  )
}
