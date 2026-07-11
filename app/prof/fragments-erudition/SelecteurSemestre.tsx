'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { chargerContexteSemestreFragments, definirSemestreFragments } from './actions'

interface SemRef { id: string; label: string; courant: boolean }

// Sélecteur de semestre Fragments, rendu dans la Barre 2 de l'en-tête (sur la
// ligne de la devise). Il charge SES données lui-même (à la demande, uniquement
// quand il est monté = sur Fragments), pour éviter que le shell /prof interroge
// `semesters` sur toutes les routes prof. Puce déroulante conforme à la maquette.
export default function SelecteurSemestre() {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [data, setData] = useState<{ semestres: SemRef[]; actifId: string | null } | null>(null)

  useEffect(() => {
    let vivant = true
    chargerContexteSemestreFragments().then((ctx) => {
      if (vivant) setData({ semestres: ctx.semestres, actifId: ctx.semestre?.id ?? null })
    })
    return () => { vivant = false }
  }, [])

  if (!data || data.semestres.length === 0) return null

  function changer(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    // Optimiste : garder la puce sur le choix pendant le refresh serveur.
    setData((d) => (d ? { ...d, actifId: id } : d))
    demarrer(async () => {
      await definirSemestreFragments(id)
      router.refresh()
    })
  }

  return (
    <span className="relative inline-flex items-center transition-opacity" style={{ opacity: enCours ? 0.5 : 1 }}>
      <select
        value={data.actifId ?? ''}
        onChange={changer}
        disabled={enCours}
        aria-label="Semestre"
        className="font-ui text-[13px] appearance-none rounded-[7px] pl-[11px] pr-[26px] py-[4px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-pigment"
        style={{ color: '#5A6043', background: 'rgba(255,255,255,.55)', border: '1px solid #CDCFB6' }}
      >
        {data.semestres.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}{s.courant ? ' · courant' : ''}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-[10px] text-[10px]" style={{ color: '#5A6043' }}>▾</span>
    </span>
  )
}
