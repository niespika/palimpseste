// ============================================================================
// FRAGMENTS (élève) — LE BILAN DU SEMESTRE, avec le sceau déployé en grand.
// ----------------------------------------------------------------------------
// Handoff `design_handoff_fragments_eleve` (G) : le sceau (≈116 px) centré,
// sur-titre « FRAGMENTS · BILAN DU SEMESTRE », le thème en titre ; puis le
// bilan (liseré olive), points forts (vert) et axes de progrès (ambre) côte à
// côte sur ordi, la note /20 sur fond olive si elle est visible.
// ⭐ C'est le seul écran du module où le sceau vit dans le corps de page : la
//    Barre 2 le porte partout ailleurs (convention des modules, Louis 03/09).
// ============================================================================

import SceauModule from '@/components/nav/SceauModule'
import type { FragmentSynthese } from '@/types/fragments'

interface Props {
  synthese: FragmentSynthese
  /** Le thème du semestre, en titre sous le sceau (null → sans titre). */
  theme?: string | null
}

export default function BilanSemestre({ synthese, theme = null }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center gap-3 pt-2">
        <SceauModule cle="fragments" size={116} anneau={false} />
        <div className="min-w-0 max-w-full">
          <p className="font-marque text-[12px] sm:text-[13px] font-semibold uppercase tracking-[0.2em] text-pigment">
            Fragments · Bilan du semestre
          </p>
          {theme && <h2 className="font-titre text-2xl sm:text-3xl text-encre leading-tight mt-1">{theme}</h2>}
        </div>
      </div>

      {synthese.synthese && (
        <div className="rounded-r-xl border-l-4 border-liseret bg-surface px-5 py-4">
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-pigment mb-2">Bilan du semestre</p>
          <p className="font-corps text-[15px] text-encre leading-relaxed whitespace-pre-wrap">{synthese.synthese}</p>
        </div>
      )}

      {(synthese.points_forts || synthese.axes_progres) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {synthese.points_forts && (
            <div className="bg-ok-teinte border border-ok rounded-xl p-4">
              <h4 className="font-ui text-sm font-semibold text-ok mb-1.5">Points forts</h4>
              <p className="font-corps text-sm text-ok leading-relaxed whitespace-pre-wrap">{synthese.points_forts}</p>
            </div>
          )}
          {synthese.axes_progres && (
            <div className="bg-attention-teinte border border-attention rounded-xl p-4">
              <h4 className="font-ui text-sm font-semibold text-attention mb-1.5">Axes de progrès</h4>
              <p className="font-corps text-sm text-attention leading-relaxed whitespace-pre-wrap">{synthese.axes_progres}</p>
            </div>
          )}
        </div>
      )}

      {synthese.note_visible_eleve && synthese.note20_validee !== null && (
        <div className="bg-pigment text-surface rounded-xl px-5 py-4 text-center">
          <p className="font-ui text-xs text-surface/70 mb-1">Note de semestre</p>
          <p className="font-titre text-4xl font-semibold leading-none">{synthese.note20_validee}<span className="text-lg text-surface/70">/20</span></p>
        </div>
      )}
    </div>
  )
}
