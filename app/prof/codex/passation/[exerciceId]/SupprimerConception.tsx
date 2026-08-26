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

export default function SupprimerConception(
  { exerciceId, horsPlan }: { exerciceId: string; horsPlan: boolean },
) {
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
      {/* ⚠️ LE BLOC S'AFFICHE DÈS QU'IL N'Y A AUCUNE COPIE, et il DIT son état —
          il ne se cache plus quand la suppression est impossible. Un bouton
          absent n'explique rien : cherchant pourquoi il ne s'affichait pas, on
          ne pouvait que deviner entre « pas déployé », « rattachée au plan » et
          « une copie traîne ». Une phrase coûte moins qu'une déduction fausse. */}
      <p className="font-corps text-sm text-encre">
        Cette conception ne porte <strong>aucune copie écrite</strong>.{' '}
        {horsPlan
          ? 'Elle n’appartient à aucun plan d’évaluation — c’est le résidu d’un examen conçu deux fois.'
          : 'Mais elle est RATTACHÉE au plan d’évaluation de la classe.'}
      </p>
      {!horsPlan ? (
        <p className="font-ui text-[12.5px] text-muet mt-1.5">
          Une conception au plan ne se supprime pas ici : elle se retire depuis le plan de la
          classe (Scriptorium → Classes → Plan d’évaluation), qui emporte la ligne avec elle.
        </p>
      ) : !confirme ? (
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
