import type { FragmentSynthese } from '@/types/fragments'

interface Props {
  synthese: FragmentSynthese
}

export default function BilanSemestre({ synthese }: Props) {
  return (
    <div className="space-y-5">
      {synthese.synthese && (
        <div>
          <h4 className="text-sm font-medium text-stone-700 mb-2">Bilan du semestre</h4>
          <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{synthese.synthese}</p>
        </div>
      )}

      {synthese.points_forts && (
        <div className="bg-green-50 border border-green-100 rounded-xl p-4">
          <h4 className="text-sm font-medium text-green-800 mb-2">Points forts</h4>
          <p className="text-sm text-green-900 leading-relaxed whitespace-pre-wrap">{synthese.points_forts}</p>
        </div>
      )}

      {synthese.axes_progres && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2">Axes de progrès</h4>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{synthese.axes_progres}</p>
        </div>
      )}

      {synthese.note_visible_eleve && synthese.note20_validee !== null && (
        <div className="bg-stone-800 text-white rounded-xl px-5 py-4 text-center">
          <p className="text-xs text-stone-400 mb-1">Note de semestre</p>
          <p className="text-3xl font-serif">{synthese.note20_validee}<span className="text-lg text-stone-400">/20</span></p>
        </div>
      )}
    </div>
  )
}
