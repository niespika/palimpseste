import Link from 'next/link'

// Toggle Activité / Compétences (segmented control). État porté par l'URL
// (?vue=activite|competences). L'actif est en bg-encre text-surface.

export type Vue = 'activite' | 'competences'

export default function BasculeVue({ vue, base, pleineLargeur }: { vue: Vue; base: string; pleineLargeur?: boolean }) {
  const seg = (v: Vue, label: string) => {
    const actif = vue === v
    return (
      <Link
        href={`${base}?vue=${v}`}
        aria-current={actif ? 'true' : undefined}
        className={`font-ui text-sm rounded-md px-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment flex items-center justify-center ${
          pleineLargeur ? 'flex-1 min-h-[44px]' : 'py-1.5'
        } ${actif ? 'bg-encre text-surface font-medium' : 'text-encre-douce hover:text-encre'}`}
      >
        {label}
      </Link>
    )
  }
  return (
    <div className={`inline-flex bg-parchemin-fonce border border-bordure rounded-lg p-0.5 ${pleineLargeur ? 'flex w-full' : ''}`}>
      {seg('activite', 'Activité')}
      {seg('competences', 'Compétences')}
    </div>
  )
}
