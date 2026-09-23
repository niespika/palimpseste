// ============================================================================
// « POURQUOI PARTAGER TES POINTS » — les six repères, calculés par
// `REPERES` (jamais tapés). Décision de Louis, 22/09 : ce tableau, plus clair
// que les trois phrases d'abord prévues, sert À LA FOIS dans l'antichambre, chez
// l'élève en retard et sur l'écran de note.
// ============================================================================
import { REPERES, signe } from '@/utils/quazian-explication-note'

export function BaremePartage({ intro = true }: { intro?: boolean }) {
  return (
    <div className="bg-surface border border-bordure rounded-2xl p-4 sm:p-5 shadow-sm">
      <h3 className="text-base font-medium text-encre">Pourquoi partager tes points</h3>
      {intro && (
        <p className="mt-1 text-sm text-encre-douce leading-relaxed">
          Ce que rapporte une question, selon la façon dont tu places tes 100 points :
        </p>
      )}
      <ul className="mt-2">
        {REPERES.map((r) => (
          <li key={r.libelle} className="flex items-baseline justify-between gap-3 border-t border-bordure py-1.5 text-sm">
            <span className="text-encre-douce">{r.libelle}</span>
            <span className={`shrink-0 font-semibold tabular-nums ${r.points < 0 ? 'text-retard' : 'text-encre'}`}>{signe(r.points)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
