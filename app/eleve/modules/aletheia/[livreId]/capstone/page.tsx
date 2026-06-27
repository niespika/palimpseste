import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { contexteAletheia, livreAccessible, chargerCapstoneLivre, toutesSemainesDone } from '../../data'
import PollStatut from '../../PollStatut'
import BoutonImprimerCapstone from '../../BoutonImprimerCapstone'
import Pastille from '@/components/Pastille'

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
        <Link href="/eleve/modules/aletheia" className="text-sm text-muet hover:text-encre-douce">← Planning</Link>
        <div className="bg-surface border border-bordure rounded-xl p-8 flex flex-col items-center text-center">
          <span className="opacity-85"><Pastille module="aletheia" size={76} /></span>
          <p className="font-titre text-xl text-encre mt-4">
            {cap?.statut === 'PENDING' ? 'Ta carte d’architecture se prépare' : 'Carte d’architecture indisponible'}
          </p>
          <p className="font-corps text-sm text-encre-douce mt-1.5 max-w-sm">
            {cap?.statut === 'PENDING'
              ? 'Tu as terminé le livre ! La page se mettra à jour automatiquement.'
              : 'La carte d’architecture n’est pas encore disponible.'}
          </p>
        </div>
        <PollStatut actif={cap?.statut === 'PENDING'} />
      </div>
    )
  }

  const { fil_conducteur, noeuds, liens } = cap.contenu

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <Link href="/eleve/modules/aletheia" className="text-sm text-muet hover:text-encre-douce">← Planning</Link>
        <BoutonImprimerCapstone />
      </div>

      {/* En-tête héros : le sceau déployé en grand — la carte est une page à garder. */}
      <div className="flex flex-col items-center text-center">
        <Pastille module="aletheia" size={112} />
        <p className="font-marque text-xs sm:text-sm font-semibold tracking-[0.2em] text-pigment mt-3 uppercase">
          Aletheia{livre?.label ? ` · ${livre.label as string}` : ''}
        </p>
        <h2 className="font-titre text-3xl text-encre leading-tight mt-1">✦ La carte d&apos;architecture du livre</h2>
        <p className="font-corps text-sm text-muet mt-2 max-w-md">La vue d&apos;ensemble du mouvement argumentatif, maintenant que tu as tout lu.</p>
      </div>

      {fil_conducteur && (
        <section className="bg-surface border border-bordure border-l-4 border-l-liseret rounded-xl p-5">
          <p className="font-ui text-xs tracking-[0.1em] text-attention uppercase mb-2">Fil conducteur</p>
          <p className="font-corps text-base text-encre whitespace-pre-wrap leading-relaxed">{fil_conducteur}</p>
        </section>
      )}

      {noeuds.length > 0 && (
        <section className="bg-surface border border-bordure rounded-xl p-5">
          <h3 className="font-titre text-xl text-encre mb-3">Les chapitres</h3>
          <ul className="space-y-2">
            {noeuds.map((n, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-encre">{n.chapitre}</span>
                <span className="text-encre-douce"> — {n.idee}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {liens.length > 0 && (
        <section className="bg-surface border border-bordure rounded-xl p-5">
          <h3 className="font-titre text-xl text-encre mb-3">Comment les chapitres s&apos;enchaînent</h3>
          <ul className="space-y-2">
            {liens.map((l, i) => (
              <li key={i} className="text-sm text-encre-douce">
                <span className="font-medium text-encre">{l.de}</span>
                <span className="text-muet"> → </span>
                <span className="font-medium text-encre">{l.vers}</span>
                <span className="text-encre-douce"> : {l.relation}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
