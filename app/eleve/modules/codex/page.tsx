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
      <div className="text-center py-16 text-muet text-sm">Ce module n&apos;est pas encore activé.</div>
    )
  }

  if (!(await aAccesModule(supabase, user.id, module.id))) {
    return (
      <div className="text-center py-16 text-muet text-sm">Tu n&apos;as pas encore accès à ce module.</div>
    )
  }

  const [synthese, historique] = await Promise.all([chargerSyntheseActive(), chargerHistorique()])
  const live = synthese && (synthese.statut === 'phase_1' || synthese.statut === 'phase_2') ? synthese : null

  // À faire (T4) : retours validés par le prof mais pas encore lus par l'élève.
  const aLire = historique.filter((s) => s.validee && !s.lu)

  return (
    <div>
      <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce mb-6 inline-flex items-center gap-1">
        ← Retour
      </Link>

      <h2 className="text-xl font-serif text-pigment mb-2 mt-2">Codex</h2>
      <p className="text-sm text-muet mb-6">Écrire de mémoire le récapitulatif d&apos;une unité, puis l&apos;améliorer.</p>

      {live && (
        <Link
          href={`/eleve/modules/codex/synthese/${live.id}`}
          className="block bg-ok-teinte border border-ok rounded-xl p-5 hover:opacity-90 transition-colors mb-6"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-ok animate-pulse shrink-0" />
            <div>
              <p className="font-medium text-ok text-sm">Synthèse en cours — {live.unite_label}</p>
              <p className="text-xs text-ok">
                {live.statut === 'phase_1'
                  ? 'Phase 1 : écris ta V1, livre fermé → appuie pour commencer'
                  : 'Phase 2 : réécris ta V-finale avec les suggestions → appuie pour continuer'}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* À faire : retour(s) à lire */}
      {aLire.length > 0 && (
        <Link
          href={`/eleve/modules/codex/synthese/${aLire[0].id}`}
          className="block bg-attention-teinte border border-attention rounded-xl p-4 hover:opacity-90 transition-colors mb-6"
        >
          <p className="font-medium text-attention text-sm">
            À faire : {aLire.length} retour{aLire.length > 1 ? 's' : ''} à lire
          </p>
          <p className="text-xs text-attention">
            {aLire.length === 1 ? aLire[0].unite_label : `dont ${aLire[0].unite_label}`} → appuie pour le consulter
          </p>
        </Link>
      )}

      {historique.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-muet mb-3">Mes synthèses</h3>
          <div className="space-y-2">
            {historique.map((s) => (
              <Link
                key={s.id}
                href={`/eleve/modules/codex/synthese/${s.id}`}
                className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
              >
                <p className="text-sm font-medium text-encre truncate">{s.unite_label}</p>
                {s.validee && !s.lu ? (
                  <span className="text-xs px-2 py-0.5 bg-attention-teinte text-attention rounded-full shrink-0">à lire</span>
                ) : s.validee && s.lu ? (
                  <span className="text-xs px-2 py-0.5 bg-parchemin-fonce text-muet rounded-full shrink-0">lu</span>
                ) : (
                  <span className="text-xs text-muet shrink-0">en attente</span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!live && historique.length === 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center">
          <p className="text-muet text-sm">Aucune synthèse pour le moment.</p>
        </div>
      )}
    </div>
  )
}
