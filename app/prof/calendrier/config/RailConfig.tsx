import Link from 'next/link'

// Rail des catégories de configuration (colonne gauche du maître-détail).
// Rendu serveur : chaque item est un lien ?section= (linkable, rechargeable),
// à la manière du ?sem= déjà utilisé par la gestion des vacances. L'item actif
// garde en permanence un liseré sépia à gauche + un fond parchemin foncé.
export interface RailItem {
  key: string
  label: string
  sub: string
  warn?: string | null
}

export default function RailConfig({ active, items }: { active: string; items: RailItem[] }) {
  return (
    <aside className="w-[236px] flex-none flex flex-col gap-1.5 sticky top-5">
      <div className="font-ui text-[11px] font-semibold tracking-[0.16em] uppercase text-muet-clair px-1 pb-1.5">
        Paramètres
      </div>
      {items.map((it) => {
        const on = it.key === active
        return (
          <Link
            key={it.key}
            href={`/prof/calendrier/config?section=${it.key}`}
            aria-current={on ? 'page' : undefined}
            className={`flex flex-col gap-[3px] px-3.5 py-[11px] rounded-[10px] border border-l-[3px] transition-colors ${
              on
                ? 'bg-parchemin-fonce border-bordure border-l-liseret'
                : 'border-transparent hover:bg-parchemin-fonce/50'
            }`}
          >
            <span className="text-base font-semibold text-encre leading-tight">{it.label}</span>
            <span className="flex items-center gap-2 flex-wrap">
              <span className="font-ui text-[13px] text-muet">{it.sub}</span>
              {it.warn && (
                <span className="font-ui text-[11px] font-semibold text-attention bg-attention-teinte rounded-full px-2 py-px whitespace-nowrap">
                  {it.warn}
                </span>
              )}
            </span>
          </Link>
        )
      })}
      <p className="italic text-[12.5px] text-muet-clair px-1 pt-2.5 leading-snug">
        Fil de configuration : Fuseau → Semestres → Vacances → Classes.
      </p>
    </aside>
  )
}
