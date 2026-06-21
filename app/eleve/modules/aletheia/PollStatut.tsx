'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Rafraîchit la route tant qu'un retour IA est en cours de génération (after()),
// jusqu'à ce que le statut avance côté serveur (puis `actif` repasse à false).
export default function PollStatut({ actif }: { actif: boolean }) {
  const router = useRouter()
  useEffect(() => {
    if (!actif) return
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [actif, router])
  return null
}
