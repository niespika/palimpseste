import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { aAccesModule } from '@/utils/acces'
import { chargerEtatTravail, chargerTrace, marquerSyntheseLue } from '../../actions'
import { EcranV1 } from './EcranV1'
import { EcranVF } from './EcranVF'
import { tuilesTrace } from './TraceAffichage'
import ValidationLecture from '@/components/retours/ValidationLecture'
import BanniereRetoursNonLus from '@/components/retours/BanniereRetoursNonLus'
import { retoursNonLus } from '@/utils/retours-lus'
import { createAdminClient } from '@/utils/supabase/admin'
import { libelleSession } from '@/utils/codex-libelle'
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

  // Garde d'accès module : un élève sans accès Codex ne doit pas atteindre une synthèse par URL.
  const { data: mod } = await supabase.from('modules').select('id, actif').eq('slug', 'codex').maybeSingle()
  if (!mod?.actif || !(await aAccesModule(supabase, user.id, mod.id))) notFound()

  const { data: session } = await supabase
    .from('codex_sessions')
    .select('id, statut, contenu_id, scriptorium_unites(label)')
    .eq('id', sessionId)
    .single()

  if (!session) {
    return <div className="text-center py-16 text-muet text-sm">Synthèse introuvable.</div>
  }

  // Titre BI-SOURCE : unité (bras historique, lisible élève) OU cours (bras parcours)
  // résolu via ADMIN — scriptorium_contenus est RLS prof-only, une jointure user rendrait
  // null (§6.2). Le client user reste l'autorité d'accès (la session a passé la RLS).
  let uniteLabel = libelleSession(session.scriptorium_unites, null)
  if (!uniteLabel && session.contenu_id) {
    const { data: c } = await createAdminClient()
      .from('scriptorium_contenus').select('titre').eq('id', session.contenu_id as string).maybeSingle()
    uniteLabel = (c?.titre as string | undefined) ?? ''
  }

  const etat = await chargerEtatTravail(sessionId)
  const trace = session.statut === 'fermee' ? await chargerTrace(sessionId) : null

  // Bannière de blocage transversal sur les phases de rendu (V1 / VF).
  const enRendu = session.statut === 'phase_1' || session.statut === 'phase_2'
  const retoursALire = enRendu ? await retoursNonLus(createAdminClient(), user.id) : []

  // Consignes « comment faire » éditables par le prof (T6) ; repli sur le défaut.
  const { data: paramsCodex } = await supabase.from('codex_params').select('consigne_v1, consigne_vf').eq('id', 1).maybeSingle()
  const consigneV1 = paramsCodex?.consigne_v1 || CONSIGNE_V1_DEFAUT
  const consigneVf = paramsCodex?.consigne_vf || CONSIGNE_VF_DEFAUT

  // En phase 2, l'écran VF passe en atelier 2 colonnes → conteneur élargi pour
  // laisser de la place ; les autres états restent en colonne étroite (lecture).
  const large = session.statut === 'phase_2'

  return (
    <div className={large ? 'max-w-4xl mx-auto' : 'max-w-xl mx-auto'}>
      <Link href="/eleve/modules/codex" className="text-sm text-muet hover:text-encre-douce mb-6 inline-block">
        ← Retour
      </Link>
      {/* Identité Codex portée par la Barre 2 de l'en-tête. */}
      <div className="mt-2 mb-1">
        <h2 className="font-titre text-2xl text-encre leading-tight">{uniteLabel}</h2>
      </div>
      <p className="text-sm text-muet mb-6">
        {session.statut === 'phase_1' && 'Phase 1 — ta V1, de mémoire et livre fermé.'}
        {session.statut === 'phase_2' && 'Phase 2 — ta V-finale.'}
        {session.statut === 'fermee' && 'Synthèse terminée.'}
        {session.statut === 'brouillon' && 'La synthèse n\'a pas encore démarré.'}
      </p>

      {enRendu && <BanniereRetoursNonLus retours={retoursALire} />}

      {session.statut === 'phase_1' && <EcranV1 sessionId={sessionId} initial={etat} consigne={consigneV1} />}

      {session.statut === 'phase_2' && <EcranVF sessionId={sessionId} initial={etat} consigne={consigneVf} />}

      {session.statut === 'fermee' && (
        trace ? (
          <div className="space-y-6">
            {!trace.lu && (
              <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3 text-sm text-attention">
                À faire : lis ton retour, coche chaque partie, puis valide-le en bas de page.
              </div>
            )}
            <ValidationLecture
              tuiles={tuilesTrace(trace)}
              dejaLu={trace.lu}
              marquerAction={marquerSyntheseLue.bind(null, sessionId)}
            />
          </div>
        ) : (
          <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
            Ton retour sera disponible une fois validé par le professeur.
          </div>
        )
      )}

      {session.statut === 'brouillon' && (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
          Patiente — le professeur va lancer la synthèse.
        </div>
      )}
    </div>
  )
}
