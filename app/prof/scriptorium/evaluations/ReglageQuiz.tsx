'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reglerQuizAnnonce } from './actions'

// Réglage prof (D5) : les quiz conçus apparaissent-ils au calendrier ÉLÈVE avant
// leur lancement (« annoncés ») ou restent-ils invisibles jusqu'au lancement en
// classe (« surprise », défaut) ? N'a d'effet visible qu'au lot 7 (exposition élève).
export default function ReglageQuiz({ actif }: { actif: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function toggle() {
    setErr(null)
    setBusy(true)
    const res = await reglerQuizAnnonce(!actif)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-surface border border-bordure rounded-xl px-4 py-2 text-xs">
      <span className="text-encre-douce">
        Quiz au calendrier élève : <span className="text-encre">{actif ? 'annoncés' : 'surprise'}</span>
        <span className="text-muet"> — {actif ? 'un quiz conçu apparaît avant son lancement' : 'un quiz reste invisible jusqu’au lancement en classe'}</span>
      </span>
      <span className="flex items-center gap-2 flex-shrink-0">
        {err && <span className="text-retard">{err}</span>}
        <button onClick={toggle} disabled={busy} className="text-encre-douce hover:text-encre disabled:opacity-50">
          {busy ? '…' : actif ? 'Passer en surprise' : 'Passer en annoncés'}
        </button>
      </span>
    </div>
  )
}
