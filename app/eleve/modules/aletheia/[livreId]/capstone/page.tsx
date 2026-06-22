import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, chargerCapstoneLivre, toutesSemainesDone } from '../../data'
import PollStatut from '../../PollStatut'
import BoutonImprimerCapstone from '../../BoutonImprimerCapstone'

export default async function PageCapstone({ params }: { params: Promise<{ livreId: string }> }) {
  const { livreId } = await params
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { moduleActif, active } = await contexteAletheia(supabase, user.id)
  if (!moduleActif || !active) notFound()
  if (!(await livreAccessible(admin, [active.classe_id], livreId))) notFound()

  // Anti-spoiler : la carte du livre révèle toute l'architecture aval. L'élève ne
  // peut y accéder qu'après avoir lui-même terminé toutes ses semaines.
  if (!(await toutesSemainesDone(admin, user.id, livreId))) notFound()

  const { data: livre } = await admin.from('scriptorium_unites').select('label').eq('id', livreId).maybeSingle()
  const cap = await chargerCapstoneLivre(admin, livreId)

  if (!cap || cap.statut !== 'READY' || !cap.contenu) {
    return (
      <div className="space-y-5 pb-8">
        <Link href="/eleve/modules/aletheia" className="text-sm text-stone-500 hover:text-stone-700">← Planning</Link>
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-stone-500 text-sm">
          {cap?.statut === 'PENDING'
            ? 'Ta carte d’architecture est en cours de préparation. Cette page se mettra à jour automatiquement.'
            : 'La carte d’architecture n’est pas encore disponible.'}
        </div>
        <PollStatut actif={cap?.statut === 'PENDING'} />
      </div>
    )
  }

  const { fil_conducteur, noeuds, liens } = cap.contenu

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <Link href="/eleve/modules/aletheia" className="text-sm text-stone-500 hover:text-stone-700">← Planning</Link>
        <BoutonImprimerCapstone />
      </div>

      <div>
        {livre?.label && <p className="text-xs text-stone-400">{livre.label as string}</p>}
        <h2 className="text-xl font-serif text-stone-900">✦ Carte d&apos;architecture du livre</h2>
        <p className="text-sm text-stone-500 mt-1">La vue d&apos;ensemble du mouvement argumentatif, maintenant que tu as tout lu.</p>
      </div>

      {fil_conducteur && (
        <section className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-medium text-stone-900 mb-2">Fil conducteur</h3>
          <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">{fil_conducteur}</p>
        </section>
      )}

      {noeuds.length > 0 && (
        <section className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-medium text-stone-900 mb-3">Les chapitres</h3>
          <ul className="space-y-2">
            {noeuds.map((n, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-stone-800">{n.chapitre}</span>
                <span className="text-stone-600"> — {n.idee}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {liens.length > 0 && (
        <section className="bg-white border border-stone-200 rounded-xl p-5">
          <h3 className="font-medium text-stone-900 mb-3">Comment les chapitres s&apos;enchaînent</h3>
          <ul className="space-y-2">
            {liens.map((l, i) => (
              <li key={i} className="text-sm text-stone-700">
                <span className="font-medium text-stone-800">{l.de}</span>
                <span className="text-stone-400"> → </span>
                <span className="font-medium text-stone-800">{l.vers}</span>
                <span className="text-stone-600"> : {l.relation}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
