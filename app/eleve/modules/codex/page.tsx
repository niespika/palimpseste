import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { aAccesModule } from '@/utils/acces'
import { chargerSyntheseActive, chargerHistorique } from './actions'

export default async function CodexElevePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: module } = await supabase
    .from('modules')
    .select('id, actif')
    .eq('slug', 'codex')
    .single()

  if (!module?.actif) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">Ce module n&apos;est pas encore activé.</div>
    )
  }

  if (!(await aAccesModule(supabase, user.id, module.id))) {
    return (
      <div className="text-center py-16 text-stone-400 text-sm">Tu n&apos;as pas encore accès à ce module.</div>
    )
  }

  const [synthese, historique] = await Promise.all([chargerSyntheseActive(), chargerHistorique()])
  const live = synthese && (synthese.statut === 'phase_1' || synthese.statut === 'phase_2') ? synthese : null

  return (
    <div>
      <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-flex items-center gap-1">
        ← Retour
      </Link>

      <h2 className="text-xl font-serif text-stone-900 mb-2 mt-2">Codex</h2>
      <p className="text-sm text-stone-500 mb-6">Écrire de mémoire le récapitulatif d&apos;une unité, puis l&apos;améliorer.</p>

      {live && (
        <Link
          href={`/eleve/modules/codex/synthese/${live.id}`}
          className="block bg-green-50 border border-green-300 rounded-xl p-5 hover:bg-green-100 transition-colors mb-6"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0" />
            <div>
              <p className="font-medium text-green-800 text-sm">Synthèse en cours — {live.unite_label}</p>
              <p className="text-xs text-green-600">
                {live.statut === 'phase_1'
                  ? 'Phase 1 : écris ta V1, livre fermé → appuie pour commencer'
                  : 'Phase 2 : réécris ta V-finale avec les suggestions → appuie pour continuer'}
              </p>
            </div>
          </div>
        </Link>
      )}

      {historique.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 mb-3">Mes synthèses</h3>
          <div className="space-y-2">
            {historique.map((s) => (
              <Link
                key={s.id}
                href={`/eleve/modules/codex/synthese/${s.id}`}
                className="flex items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-stone-300 transition-colors"
              >
                <p className="text-sm font-medium text-stone-800 truncate">{s.unite_label}</p>
                {s.validee ? (
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full shrink-0">retour prêt</span>
                ) : (
                  <span className="text-xs text-stone-400 shrink-0">en attente</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!live && historique.length === 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center">
          <p className="text-stone-500 text-sm">Aucune synthèse pour le moment.</p>
        </div>
      )}
    </div>
  )
}
