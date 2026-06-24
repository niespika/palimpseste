import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { chargerEtatTravail, chargerTrace } from '../../actions'
import { EcranV1 } from './EcranV1'
import { EcranVF } from './EcranVF'
import { TraceAffichage } from './TraceAffichage'
import { BoutonLu } from './BoutonLu'
import { CONSIGNE_V1_DEFAUT, CONSIGNE_VF_DEFAUT } from '../../consignes'

export default async function SyntheseElevePage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('codex_sessions')
    .select('id, statut, scriptorium_unites(label)')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return <div className="text-center py-16 text-stone-400 text-sm">Synthèse introuvable.</div>
  }

  const u = session.scriptorium_unites as { label: string } | { label: string }[] | null
  const uniteLabel = Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? ''

  const etat = await chargerEtatTravail(sessionId)
  const trace = session.statut === 'fermee' ? await chargerTrace(sessionId) : null

  // Consignes « comment faire » éditables par le prof (T6) ; repli sur le défaut.
  const { data: paramsCodex } = await supabase.from('codex_params').select('consigne_v1, consigne_vf').eq('id', 1).maybeSingle()
  const consigneV1 = paramsCodex?.consigne_v1 || CONSIGNE_V1_DEFAUT
  const consigneVf = paramsCodex?.consigne_vf || CONSIGNE_VF_DEFAUT

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/eleve/modules/codex" className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-block">
        ← Retour
      </Link>
      <h2 className="text-xl font-serif text-stone-900 mb-1 mt-2">{uniteLabel}</h2>
      <p className="text-sm text-stone-500 mb-6">
        {session.statut === 'phase_1' && 'Phase 1 — ta V1, de mémoire et livre fermé.'}
        {session.statut === 'phase_2' && 'Phase 2 — ta V-finale.'}
        {session.statut === 'fermee' && 'Synthèse terminée.'}
        {session.statut === 'brouillon' && 'La synthèse n\'a pas encore démarré.'}
      </p>

      {session.statut === 'phase_1' && <EcranV1 sessionId={sessionId} initial={etat} consigne={consigneV1} />}

      {session.statut === 'phase_2' && <EcranVF sessionId={sessionId} initial={etat} consigne={consigneVf} />}

      {session.statut === 'fermee' && (
        trace ? (
          <div className="space-y-6">
            {!trace.lu && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                À faire : lis ton retour, puis marque-le comme lu en bas de page.
              </div>
            )}
            <TraceAffichage trace={trace} />
            <BoutonLu sessionId={sessionId} luInitial={trace.lu} />
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
            Ton retour sera disponible une fois validé par le professeur.
          </div>
        )
      )}

      {session.statut === 'brouillon' && (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
          Patiente — le professeur va lancer la synthèse.
        </div>
      )}
    </div>
  )
}
