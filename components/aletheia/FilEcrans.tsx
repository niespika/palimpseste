'use client'

import { useEffect, useRef } from 'react'

// ============================================================================
// LE FIL D'ÉCRANS — Aletheia, refonte des écrans élève (04/09/2026).
// ----------------------------------------------------------------------------
// « Un écran = une tâche ». Un moment de la séance se joue en écrans enchaînés :
// en haut le compteur (« Séance 2 · 3 / 5 » + points), le titre, le corps ; en bas
// UNE barre FIXE (sticky au bas de la fenêtre, au-dessus de la barre d'onglets sur
// téléphone) qui porte les seuls contrôles de l'écran : une bascule à deux états
// (texte / réponse…), et « Suivant » — jamais deux boutons qui font la même chose.
// L'état des écrans vit chez l'appelant (index contrôlé) : « Précédent » retrouve
// ce qui était écrit. Le composant ne connaît ni la base ni les actions.
// ============================================================================

export interface Bascule {
  a: string
  b: string
  /** 0 = a, 1 = b */
  actif: 0 | 1
  onChange: (etat: 0 | 1) => void
  /** Sur ordinateur (lg), les deux côtés tiennent côte à côte : la bascule disparaît. */
  mobileSeulement?: boolean
}

export interface EcranFil {
  id: string
  titre: string
  corps: React.ReactNode
  /** Le bouton principal de la barre ; absent ⇒ pas de bouton (la bascule seule). */
  suivant?: { label: string; onClick: () => void; disabled?: boolean; secondaire?: boolean; /** Ne se montre qu'à partir de lg (l'état mobile n'a que la bascule). */ lgSeulement?: boolean } | null
  /** « Précédent » (défaut : oui dès le 2ᵉ écran). */
  precedent?: boolean
  bascule?: Bascule | null
  /** Message d'erreur sous le corps, au-dessus de la barre. */
  erreur?: string | null
}

export interface Props {
  /** Le libellé du compteur : « Séance 2 · Rappel », « Retour · 3 / 7 »… */
  fil: string
  ecrans: EcranFil[]
  index: number
  onIndex: (i: number) => void
  /** Titre porté par le compteur à droite (défaut : « i / n »). */
  compteur?: string
}

export const BARRE_BAS = 'sticky lg:static bottom-[calc(56px+env(safe-area-inset-bottom))] sm:bottom-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-0 pt-2 pb-3 bg-parchemin/95 backdrop-blur border-t border-bordure sm:border-0 sm:bg-transparent sm:backdrop-blur-0'

export function BoutonFil({ label, onClick, disabled, secondaire, type = 'button' }: { label: string; onClick?: () => void; disabled?: boolean; secondaire?: boolean; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={secondaire
        ? 'w-full min-h-11 rounded-xl border border-bordure-bouton text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50'
        : 'w-full min-h-11 rounded-xl bg-bouton text-bouton-texte text-sm font-medium hover:opacity-90 disabled:opacity-50'}>
      {label}
    </button>
  )
}

export function BasculeFil({ a, b, actif, onChange }: Bascule) {
  const seg = (etat: 0 | 1, label: string) => (
    <button type="button" role="tab" aria-selected={actif === etat} onClick={() => onChange(etat)}
      className={`flex-1 min-h-11 text-sm transition-colors ${actif === etat ? 'bg-pigment text-parchemin font-medium' : 'text-encre-douce hover:bg-parchemin-fonce'}`}>
      {label}
    </button>
  )
  return (
    <div role="tablist" className="flex rounded-xl border border-bordure-bouton overflow-hidden bg-surface">
      {seg(0, a)}{seg(1, b)}
    </div>
  )
}

export default function FilEcrans({ fil, ecrans, index, onIndex, compteur }: Props) {
  const i = Math.min(Math.max(index, 0), Math.max(ecrans.length - 1, 0))
  const e = ecrans[i]
  const haut = useRef<HTMLDivElement>(null)
  // Changer d'écran ramène en haut du fil (le titre), pas en haut de la page.
  const precedentIndex = useRef(i)
  useEffect(() => {
    if (precedentIndex.current !== i) {
      precedentIndex.current = i
      haut.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
  }, [i])
  if (!e) return null
  const precedent = e.precedent ?? i > 0
  return (
    <div ref={haut} className="scroll-mt-20">
      <div className="flex items-center justify-between font-ui text-[11px] tracking-[0.06em] text-muet uppercase">
        <span>{fil}</span>
        <span className="flex items-center gap-1.5" aria-label={`écran ${i + 1} sur ${ecrans.length}`}>
          <span className="flex gap-1" aria-hidden>
            {ecrans.map((x, k) => <i key={x.id} className={`block w-1.5 h-1.5 rounded-full ${k <= i ? 'bg-pigment' : 'bg-bordure'}`} />)}
          </span>
          <span className="normal-case tracking-normal">{compteur ?? `${i + 1} / ${ecrans.length}`}</span>
        </span>
      </div>
      <h3 className="font-titre text-[22px] leading-tight text-encre mt-2 mb-3 text-balance">{e.titre}</h3>
      <div className="min-w-0">{e.corps}</div>
      {e.erreur && <p className="text-retard text-sm mt-3" role="alert">{e.erreur}</p>}
      <div className={`${BARRE_BAS} mt-4 space-y-2`}>
        {e.bascule && <div className={e.bascule.mobileSeulement ? 'lg:hidden' : ''}><BasculeFil {...e.bascule} /></div>}
        {e.suivant && <div className={e.suivant.lgSeulement ? 'hidden lg:block' : ''}><BoutonFil label={e.suivant.label} onClick={e.suivant.onClick} disabled={e.suivant.disabled} secondaire={e.suivant.secondaire} /></div>}
        {precedent && (
          <button type="button" onClick={() => onIndex(i - 1)} className="w-full min-h-9 text-xs text-muet hover:text-encre-douce">← Précédent</button>
        )}
      </div>
    </div>
  )
}
