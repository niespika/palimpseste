import Link from 'next/link'
import type { EtatFiche } from './utils'
import { INTITULE } from './ui'

const PASTILLE: Record<EtatFiche, string> = {
  prete: 'bg-ok',
  amendee: 'bg-info',
  a_generer: 'border-[1.4px] border-puce',
}

// Rail des séances (colonne gauche, sticky) : une ligne par séance, pastille
// d'état à droite, sélection portée par l'URL (?semaine=N).
export default function RailSemaines({ semaines, semaineSel, hrefBase }: {
  semaines: { semaine: number; titre: string; etat: EtatFiche }[]
  semaineSel: number
  hrefBase: string
}) {
  return (
    <div className="sticky top-24 bg-surface border border-bordure rounded-[10px] pt-3 pb-2.5">
      <div className={`${INTITULE} px-4 pb-2`}>Fiches par séance</div>
      <div className="flex flex-col">
        {semaines.map(s => {
          const sel = s.semaine === semaineSel
          return (
            <Link
              key={s.semaine}
              href={`${hrefBase}&semaine=${s.semaine}`}
              scroll={false}
              aria-current={sel ? 'page' : undefined}
              className={`flex items-center gap-2 py-[6.5px] pl-[13px] pr-4 border-l-[3px] transition-colors ${
                sel ? 'bg-pigment-teinte border-l-pigment' : 'border-l-transparent hover:bg-parchemin-fonce'
              }`}
            >
              <span className={`font-ui font-semibold text-[11px] w-[25px] flex-none ${sel ? 'text-pigment' : 'text-muet-clair'}`}>S{s.semaine}</span>
              <span className={`font-corps text-[15px] truncate flex-1 ${sel ? 'font-semibold text-encre' : 'text-encre-douce'}`}>{s.titre}</span>
              <span className={`w-[7px] h-[7px] rounded-full flex-none box-border ${PASTILLE[s.etat]}`} />
            </Link>
          )
        })}
        {semaines.length === 0 && (
          <p className="font-corps italic text-sm text-muet px-4 py-1">Aucune séance dans ce livre.</p>
        )}
      </div>
      <div className="mx-4 mt-2.5 pt-[9px] border-t border-dashed border-bordure-bouton flex gap-[11px] flex-wrap font-ui text-[11px] text-muet-clair">
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-ok" />prête</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-info" />amendée</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full border-[1.4px] border-puce box-border" />à générer</span>
      </div>
    </div>
  )
}
