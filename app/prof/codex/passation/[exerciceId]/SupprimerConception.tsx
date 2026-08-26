'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supprimerConceptionOrpheline } from '@/app/prof/examens-diagnostiques/actions'

// ---------------------------------------------------------------------------
// SUPPRIMER UNE CONCEPTION HORS PLAN.
//
// Ne s'affiche que sur une instance SANS ligne de plan et SANS copie écrite —
// autrement dit sur le résidu d'un examen conçu deux fois, une fois ses copies
// réunies ailleurs. « Retirer du plan » ne peut rien pour elle : elle n'est
// dans aucun plan.
//
// ⚠️ Confirmation en deux temps, comme partout ici : le geste est irréversible
//    et emporte les dépôts d'assignation avec l'exercice. La garde serveur
//    revérifie tout — l'écran ne fait que proposer.
// ---------------------------------------------------------------------------

export default function SupprimerConception({ exerciceId }: { exerciceId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirme, setConfirme] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function supprimer() {
    setErr(null)
    setBusy(true)
    try {
      const fd = new FormData()
      fd.set('exercice_id', exerciceId)
      const res = await supprimerConceptionOrpheline(null, fd)
      if (!res.ok) { setErr(res.message); return }
      router.push('/prof/codex')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'La suppression a échoué.')
    } finally {
      setBusy(false)
      setConfirme(false)
    }
  }

  return (
    <div className="rounded-xl border border-bordure bg-parchemin-fonce px-4 py-3 mb-4">
      <p className="font-corps text-sm text-encre">
        Cette conception n’appartient à <strong>aucun plan d’évaluation</strong> et ne porte
        aucune copie écrite — c’est le résidu d’un examen conçu deux fois.
      </p>
      {!confirme ? (
        <button
          type="button" onClick={() => setConfirme(true)} disabled={busy}
          className="mt-2.5 font-ui text-[13px] font-semibold text-encre-douce bg-surface border border-puce rounded-lg px-3 py-1.5 hover:bg-parchemin disabled:opacity-50"
        >
          Supprimer cette conception…
        </button>
      ) : (
        <div className="mt-2.5 flex items-center gap-3 flex-wrap">
          <span className="font-ui text-[12.5px] text-retard">
            Supprimer définitivement cette conception et ses assignations ?
          </span>
          <button
            type="button" onClick={supprimer} disabled={busy}
            className="font-ui text-[13px] font-semibold bg-retard-teinte text-retard px-3.5 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? 'Suppression…' : 'Oui, supprimer'}
          </button>
          <button
            type="button" onClick={() => setConfirme(false)} disabled={busy}
            className="font-ui text-[13px] text-muet hover:text-encre disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
      )}
      {err && <p className="font-ui text-[12.5px] text-retard mt-2">{err}</p>}
    </div>
  )
}
