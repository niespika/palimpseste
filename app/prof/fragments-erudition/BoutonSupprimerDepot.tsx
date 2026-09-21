'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { supprimerDepot } from './actions'

// Fiche élève (prof) — SUPPRIMER UN DÉPÔT. Le geste emporte en cascade les photos,
// l'analyse et ses pistes : la confirmation le dit, et nomme la semaine.
export default function BoutonSupprimerDepot({ depotId, numeroSemaine, analysePubliee }: { depotId: string; numeroSemaine: number | null; analysePubliee: boolean }) {
  const router = useRouter()
  const [enCours, demarrer] = useTransition()
  const [erreur, setErreur] = useState<string | null>(null)

  function surClic() {
    const sem = numeroSemaine != null ? `de la semaine ${numeroSemaine}` : 'de cette semaine'
    const msg = `Supprimer le dépôt ${sem} ? Les photos, l’analyse et ses pistes seront effacées${analysePubliee ? ' — le retour est PUBLIÉ, l’élève ne le verra plus' : ''}. L’élève (ou vous) pourra déposer de nouveau.`
    if (!window.confirm(msg)) return
    setErreur(null)
    demarrer(async () => {
      const fd = new FormData()
      fd.append('depotId', depotId)
      const r = await supprimerDepot(fd)
      if ('error' in r && r.error) { setErreur(r.error); return }
      router.refresh()
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={surClic} disabled={enCours} className="font-ui text-xs text-retard hover:underline disabled:opacity-40">
        {enCours ? 'Suppression…' : 'Supprimer'}
      </button>
      {erreur && <span className="font-ui text-xs text-retard">{erreur}</span>}
    </span>
  )
}
