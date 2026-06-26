'use client'

// Interrupteur (toggle) jetonné — piste verte (ok) à l'état actif, neutre sinon ;
// bouton clair. Réutilisable (accès modules, futurs réglages).

interface Props {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  disabled?: boolean
}

export default function Interrupteur({ checked, onChange, label, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment focus-visible:ring-offset-1 ${
        checked ? 'bg-ok' : 'bg-bordure'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-all ${
          checked ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}
