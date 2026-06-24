import type { FragmentSynthese } from '@/types/fragments'

interface Props {
  synthese: FragmentSynthese
}

export default function BilanSemestre({ synthese }: Props) {
  return (
    <div className="space-y-5">
      {synthese.synthese && (
        <div>
          <h4 className="text-sm font-medium text-encre-douce mb-2">Bilan du semestre</h4>
          <p className="text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{synthese.synthese}</p>
        </div>
      )}

      {synthese.points_forts && (
        <div className="bg-ok-teinte border border-ok rounded-xl p-4">
          <h4 className="text-sm font-medium text-ok mb-2">Points forts</h4>
          <p className="text-sm text-ok leading-relaxed whitespace-pre-wrap">{synthese.points_forts}</p>
        </div>
      )}

      {synthese.axes_progres && (
        <div className="bg-attention-teinte border border-attention rounded-xl p-4">
          <h4 className="text-sm font-medium text-attention mb-2">Axes de progrès</h4>
          <p className="text-sm text-attention leading-relaxed whitespace-pre-wrap">{synthese.axes_progres}</p>
        </div>
      )}

      {synthese.note_visible_eleve && synthese.note20_validee !== null && (
        <div className="bg-pigment text-surface rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-surface/70 mb-1">Note de semestre</p>
          <p className="text-3xl font-serif">{synthese.note20_validee}<span className="text-lg text-surface/70">/20</span></p>
        </div>
      )}
    </div>
  )
}
