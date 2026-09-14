'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'

/**
 * Le cadre de projection : barre discrète (titre, retour, plein écran) et le deck
 * en dessous. Le plein écran porte sur le CADRE qui contient l'iframe, pas sur la
 * page : la barre disparaît, le deck occupe l'écran, ses propres raccourcis
 * clavier continuent de fonctionner (le focus est donné à l'iframe).
 */
export default function Presentation({ url, titre }: { url: string; titre: string }) {
  const cadre = useRef<HTMLDivElement>(null)
  const iframe = useRef<HTMLIFrameElement>(null)
  const [pleinEcran, setPleinEcran] = useState(false)
  // Safari iPhone ne met aucun élément en plein écran : le bouton disparaît, « Onglet » reste.
  const pleinEcranPossible = useSyncExternalStore(() => () => {}, () => !!document.fullscreenEnabled, () => true)

  const basculer = useCallback(async () => {
    const el = cadre.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch { /* Safari iPhone : pas de plein écran sur un élément */ }
    iframe.current?.focus()
  }, [])

  useEffect(() => {
    const onChange = () => setPleinEcran(!!document.fullscreenElement)
    // « F » depuis la page (le deck, lui, garde ses touches quand il a le focus).
    const onKey = (e: KeyboardEvent) => { if (e.key === 'f' || e.key === 'F') void basculer() }
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('keydown', onKey)
    }
  }, [basculer])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-encre">
      {!pleinEcran && (
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 bg-surface border-b border-bordure text-sm">
          <div className="min-w-0 flex items-center gap-3">
            <Link href="/prof/scriptorium?vue=cours" className="text-muet hover:text-encre flex-shrink-0">← Scriptorium</Link>
            <span className="text-encre font-medium truncate">{titre}</span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-muet hover:text-encre">Onglet ↗</a>
            {pleinEcranPossible && (
              <button type="button" onClick={basculer} className="bg-bouton text-surface px-3 py-1 rounded text-xs hover:opacity-90" title="Touche F">
                Plein écran
              </button>
            )}
          </div>
        </div>
      )}
      <div ref={cadre} className="flex-1 min-h-0 bg-encre">
        {/* ⛔ `sandbox` SANS `allow-same-origin` : le deck tourne dans une origine opaque,
            sans accès aux cookies de session ni à cette page. Mesuré le 14/09 sur un
            deck de Louis : aucun `localStorage` ; fenêtre présentateur par `postMessage`
            vers toute origine (traverse l'origine opaque) ; export par téléchargement ;
            touche F → `requestFullscreen` (d’où `allow="fullscreen"`). */}
        <iframe
          ref={iframe} src={url} title={titre}
          className="w-full h-full border-0 bg-surface"
          sandbox="allow-scripts allow-popups allow-modals allow-downloads"
          allow="fullscreen"
          onLoad={() => iframe.current?.focus()}
        />
      </div>
    </div>
  )
}
