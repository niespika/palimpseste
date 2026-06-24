'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ecarterRappelClasse } from './classes/actions'
import ConfirmationEffacement from './classes/ConfirmationEffacement'
import type { ClasseRappel } from '@/utils/rappels'

const NIVEAU_LABEL: Record<string, string> = { '1ere': 'Première', terminale: 'Terminale' }

// Rappels de fin d'année (Lot 2) affichés sur le dashboard. « Cette classe
// continue » écarte le rappel pour de bon ; « Effacer » lance le flux à 3 étapes.
export default function RappelsClasses({ classes }: { classes: ClasseRappel[] }) {
  const router = useRouter()
  const [pending, setPending] = useState<string | null>(null)

  if (classes.length === 0) return null

  async function continuer(id: string) {
    setPending(id)
    const fd = new FormData()
    fd.append('id', id)
    await ecarterRappelClasse(fd)
    setPending(null)
    router.refresh()
  }

  return (
    <div className="mb-8 space-y-3">
      {classes.map((c) => {
        const sousTitre = [c.niveau ? NIVEAU_LABEL[c.niveau] ?? c.niveau : null, c.filiere, c.annee_scolaire]
          .filter(Boolean).join(' · ')
        return (
          <div key={c.id} className="bg-attention-teinte border border-attention rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-attention">
                <span className="font-medium">Fin d'année</span> — la classe « {c.nom} » arrive-t-elle à terme ?
              </p>
              {sousTitre && <p className="text-xs text-attention/70 mt-0.5">{sousTitre}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => continuer(c.id)}
                disabled={pending === c.id}
                className="text-xs px-3 py-1.5 rounded-lg bg-surface border border-attention text-attention hover:bg-attention-teinte disabled:opacity-50"
              >
                {pending === c.id ? '…' : 'Cette classe continue'}
              </button>
              <ConfirmationEffacement classeId={c.id} classeNom={c.nom} variante="bouton" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
