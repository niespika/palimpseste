'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Composant transversal de validation de lecture d'un retour (Fragments écrit/essai,
// Codex, Aletheia VF). Chaque tuile = une carte titrée. Quand il y a PLUSIEURS
// tuiles, une case à cocher par tuile ; le bouton « J'ai tout lu » n'est actif que
// si TOUTES sont cochées. À une seule tuile : pas de case, bouton direct. Le clic
// appelle la Server Action de marquage passée en prop (pose le *_lu_at serveur).
// `node` = contenu SANS en-tête (l'en-tête/case est fourni ici).

export interface TuileRetour {
  id: string
  titre: string
  node: React.ReactNode
}

interface Props {
  tuiles: TuileRetour[]
  dejaLu: boolean
  /** Server Action liée, ex. validerLectureRetour.bind(null, id). */
  marquerAction: () => Promise<{ error?: string; success?: boolean } | void>
  labelBouton?: string
  introMessage?: string
}

export default function ValidationLecture({ tuiles, dejaLu, marquerAction, labelBouton, introMessage }: Props) {
  const router = useRouter()
  const [cochees, setCochees] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const multi = tuiles.length > 1
  const avecCases = multi && !dejaLu
  const toutCoche = !avecCases || tuiles.every((t) => cochees.has(t.id))

  function toggle(id: string) {
    setCochees((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function valider() {
    setErreur(null)
    setPending(true)
    try {
      const res = await marquerAction()
      if (res && 'error' in res && res.error) {
        setErreur(res.error)
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  const enteteClasses = 'flex items-center gap-2.5 px-4 py-2.5 border-b border-bordure bg-parchemin-fonce'

  return (
    <div className="space-y-3">
      {avecCases && (
        <p className="text-xs text-muet">{introMessage ?? 'Coche chaque partie pour confirmer que tu l’as lue.'}</p>
      )}

      {tuiles.map((t) => (
        <div key={t.id} className="bg-surface border border-bordure rounded-xl overflow-hidden">
          {avecCases ? (
            <label className={`${enteteClasses} cursor-pointer`}>
              <input
                type="checkbox"
                checked={cochees.has(t.id)}
                onChange={() => toggle(t.id)}
                className="h-4 w-4 shrink-0 accent-bouton cursor-pointer"
              />
              <span className="text-sm font-medium text-encre-douce">{t.titre}</span>
            </label>
          ) : (
            <div className={enteteClasses}>
              {dejaLu && <span className="text-ok text-sm" aria-hidden>✓</span>}
              <span className="text-sm font-medium text-encre-douce">{t.titre}</span>
            </div>
          )}
          <div className="p-4">{t.node}</div>
        </div>
      ))}

      {dejaLu ? (
        <div className="bg-ok-teinte border border-ok rounded-xl px-4 py-3 text-sm text-ok text-center">
          ✓ Retour lu
        </div>
      ) : (
        <>
          <button
            onClick={valider}
            disabled={pending || !toutCoche}
            className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {pending ? '…' : labelBouton ?? (multi ? 'J’ai tout lu' : 'J’ai lu mon retour')}
          </button>
          {avecCases && !toutCoche && (
            <p className="text-xs text-muet text-center">Coche les {tuiles.length} parties pour activer le bouton.</p>
          )}
          {erreur && <p className="text-retard text-sm">{erreur}</p>}
        </>
      )}
    </div>
  )
}
