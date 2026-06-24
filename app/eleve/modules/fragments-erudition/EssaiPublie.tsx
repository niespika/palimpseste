import type { EssaiDepotAnalyse } from '@/types/fragments'

const COULEUR_LETTRE: Record<string, string> = {
  A: 'bg-ok-teinte text-ok',
  B: 'bg-ok-teinte text-ok',
  C: 'bg-attention-teinte text-attention',
  D: 'bg-attention-teinte text-attention',
  E: 'bg-retard-teinte text-retard',
}

interface Props {
  analyse: EssaiDepotAnalyse
}

function BadgeLettre({ lettre }: { lettre: string | null }) {
  if (!lettre) return null
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${COULEUR_LETTRE[lettre] ?? 'bg-parchemin-fonce text-encre-douce'}`}>
      {lettre}
    </span>
  )
}

const DIMENSIONS = [
  { key: 'structure', label: 'Structure' },
  { key: 'expression', label: 'Expression' },
  { key: 'argumentation', label: 'Argumentation' },
  { key: 'connaissances', label: 'Connaissances' },
] as const

export default function EssaiPublie({ analyse }: Props) {
  return (
    <div className="space-y-5">
      {/* Vue d'ensemble des lettres */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DIMENSIONS.map(({ key, label }) => {
          const lettre = analyse[`lettre_${key}` as keyof EssaiDepotAnalyse] as string | null
          return (
            <div key={key} className="bg-parchemin-fonce rounded-xl p-3 text-center">
              <p className="text-xs text-muet mb-2">{label}</p>
              <BadgeLettre lettre={lettre} />
            </div>
          )
        })}
      </div>

      {/* Retours par dimension */}
      {DIMENSIONS.map(({ key, label }) => {
        const retour = analyse[`retour_${key}` as keyof EssaiDepotAnalyse] as string | null
        const lettre = analyse[`lettre_${key}` as keyof EssaiDepotAnalyse] as string | null
        if (!retour) return null
        return (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <BadgeLettre lettre={lettre} />
              <h4 className="text-sm font-medium text-encre-douce">{label}</h4>
            </div>
            <p className="text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{retour}</p>
          </div>
        )
      })}

      {/* Retour parcours */}
      {analyse.retour_parcours && (
        <div>
          <h4 className="text-sm font-medium text-encre-douce mb-2">Mise en perspective</h4>
          <p className="text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{analyse.retour_parcours}</p>
        </div>
      )}

      {/* Synthèse */}
      {analyse.synthese && (
        <div className="bg-parchemin-fonce border border-bordure rounded-xl p-4">
          <h4 className="text-sm font-medium text-encre-douce mb-2">Bilan général</h4>
          <p className="text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{analyse.synthese}</p>
        </div>
      )}

      {/* Note si visible */}
      {analyse.note_visible_eleve && analyse.note20_validee !== null && (
        <div className="bg-pigment text-surface rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-surface/70 mb-1">Note</p>
          <p className="text-3xl font-serif">{analyse.note20_validee}<span className="text-lg text-surface/70">/20</span></p>
        </div>
      )}
    </div>
  )
}
