'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { retirerExercice } from './scriptorium/evaluations/actions'

// ---------------------------------------------------------------------------
// Le retrait d'un exercice depuis le tableau de bord — ET SON ÉCHEC, DIT TOUT HAUT.
//
// Avant ce composant, le bouton vivait dans un `<form action={…}>` dont l'action
// serveur jetait la valeur de retour :
//
//     await retirerExercice(formData)   // le { error } partait à la poubelle
//     revalidatePath('/prof')
//
// Un refus — plan désactivé, instance portant du travail élève, synthèse déjà
// lancée — ne laissait donc AUCUNE trace : le bouton semblait simplement mort.
// Constaté en production le 25/08 sur trois lignes de 1HLP, et c'est ce qui a
// fait dire « il n'y a rien qui le permet » alors qu'un bouton était là.
//
// ⚠️ Le patron est celui de `GrillePlan.tsx` (`act`) : état local, l'erreur
//    s'affiche à côté du bouton, et on ne rafraîchit QUE si l'action a réussi.
//    Rafraîchir après un échec effacerait le message avant qu'il soit lu.
// ---------------------------------------------------------------------------

export default function BoutonRetirerDuPlan({ exerciceId }: { exerciceId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function retirer() {
    setErr(null)
    setBusy(true)
    try {
      const fd = new FormData()
      fd.set('exercice_id', exerciceId)
      const res = await retirerExercice(fd)
      if (res.error) { setErr(res.error); return }
      router.refresh()
    } catch (e) {
      // Une action serveur qui lève (réseau, session expirée) ne doit pas non
      // plus se taire : c'est le défaut qu'on répare.
      setErr(e instanceof Error ? e.message : 'Le retrait a échoué.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={retirer}
        disabled={busy}
        className="font-ui text-xs text-muet hover:text-retard disabled:opacity-50"
      >
        {busy ? 'Retrait…' : 'Retirer du plan'}
      </button>
      {err && <span className="font-ui text-xs text-retard w-full mt-1">{err}</span>}
    </>
  )
}
