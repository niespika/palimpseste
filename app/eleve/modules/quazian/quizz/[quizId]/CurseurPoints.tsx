'use client'

// ─────────────────────────────────────────────────────────────────────────────
// LE CURSEUR D'UNE RÉPONSE — même geste que la crédence des exercices
// (`components/deroule/CredenceSaisie.tsx`, `Curseur`) : 0 à 100 au point près,
// flanqué de − et + qui avancent de 1, cibles de 44-48 px (l'écran est souvent
// un téléphone). ⚠️ Copié plutôt que partagé : le curseur des exercices sert en
// production et ce chantier n'y touche pas — unifier les deux est noté à
// `IDEES_post_rentree.md`.
// ─────────────────────────────────────────────────────────────────────────────
export function CurseurPoints({
  id, lettre, libelle, valeur, plafond, gele, retenu, surValeur,
}: {
  id: string
  lettre: string
  libelle: string
  valeur: number
  /** La valeur maximale atteignable, points restants compris. */
  plafond: number
  gele: boolean
  retenu: boolean
  surValeur: (v: number) => void
}) {
  const borner = (v: number) => Math.max(0, Math.min(100, Math.round(v)))
  return (
    <div className={`rounded-[11px] border p-3 sm:p-3.5 ${retenu
      ? 'border-saisie-retenue-bordure bg-saisie-retenue'
      : 'border-bordure bg-surface'}`}>
      <label htmlFor={id} className="flex gap-2 text-[15px] leading-[1.45] text-encre">
        <span className="w-4 shrink-0 text-xs font-bold text-muet leading-[1.9]">{lettre}</span>
        <span className="min-w-0">{libelle}</span>
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => surValeur(borner(valeur - 1))}
          disabled={gele || valeur <= 0}
          aria-label={`Retirer 1 point à la réponse ${lettre}`}
          className="size-12 shrink-0 rounded-[9px] border border-bordure-bouton bg-surface text-lg text-muet disabled:opacity-40 sm:size-11"
        >
          −
        </button>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={valeur}
          disabled={gele}
          onChange={(e) => surValeur(borner(Number(e.target.value)))}
          // Fond et teinte par `style` : la règle nue de `globals.css` sur les
          // `input` (fond blanc) l'emporte sur une classe `bg-*` (cf. `Curseur`).
          style={{ backgroundColor: 'transparent', accentColor: 'var(--bouton)' }}
          className="h-11 min-w-0 flex-1"
        />
        <button
          type="button"
          onClick={() => surValeur(borner(valeur + 1))}
          disabled={gele || valeur >= plafond}
          aria-label={`Ajouter 1 point à la réponse ${lettre}`}
          className="size-12 shrink-0 rounded-[9px] border border-bordure-bouton bg-surface text-lg text-muet disabled:opacity-40 sm:size-11"
        >
          +
        </button>
        <span className={`w-9 shrink-0 text-right text-[15px] font-semibold tabular-nums ${valeur > 0 ? 'text-encre' : 'text-muet'}`}>
          {valeur}
        </span>
      </div>
    </div>
  )
}
