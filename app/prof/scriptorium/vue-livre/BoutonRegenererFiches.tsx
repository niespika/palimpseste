'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { regenererReferenceLivre } from '../actions'
import { useArtefactsLivre } from './ArtefactsLivreProvider'
import { BTN_PRIMAIRE, BTN_SECONDAIRE } from './ui'

// Régénération GLOBALE des fiches (décision projet : pas de génération par semaine).
// Double garde : confirmation « N fiches » (sauf contenu entièrement vide), puis
// needsConfirm serveur si des fiches ont été amendées à la main.
export default function BoutonRegenererFiches({ livreId, nbFiches, contenuVide, variante = 'secondaire' }: {
  livreId: string
  nbFiches: number
  contenuVide: boolean
  variante?: 'secondaire' | 'primaire'
}) {
  const router = useRouter()
  const { refEnCours, refBloquee } = useArtefactsLivre()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function lancer(force = false): Promise<void> {
    if (!force && !contenuVide && !confirm(`Cela régénérera les ${nbFiches} fiches du livre par l’IA. Continuer ?`)) return
    setBusy(true); setMsg(null)
    try {
      const res = await regenererReferenceLivre(livreId, force)
      if (res.needsConfirm) {
        if (confirm('Des fiches ont été amendées à la main. La régénération par l’IA écrasera ces modifications. Continuer ?')) return lancer(true)
        return
      }
      if (res.error) { setMsg(res.error); return }
      router.refresh()
    } finally { setBusy(false) }
  }

  const label = refEnCours && !refBloquee ? 'génération…'
    : refBloquee ? '↻ Relancer la génération'
    : contenuVide ? '↻ Générer les fiches (IA)'
    : '↻ Régénérer les fiches (IA)'

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => lancer(false)} disabled={busy || (refEnCours && !refBloquee)}
        className={variante === 'primaire' ? BTN_PRIMAIRE : BTN_SECONDAIRE}>
        {label}
      </button>
      {msg && <span className="font-ui text-[11px] text-retard">{msg}</span>}
    </span>
  )
}
