'use client'

import { useActionState } from 'react'
import { actionBasculerRetoursARelire } from './actions-retours-a-relire'
import type { RetourPorteRelecture } from '@/utils/pilotage/porte-retours-a-relire'

export default function PorteRetoursARelire({ depuis, disponible }: {
  depuis: string | null; disponible: boolean
}) {
  const [retour, action, enCours] = useActionState<RetourPorteRelecture | null, FormData>(
    actionBasculerRetoursARelire, null)
  const date = retour?.ok ? retour.depuis : depuis
  const actif = !!date
  const dateLisible = date && Number.isFinite(Date.parse(date))
    ? new Intl.DateTimeFormat('fr-CA', {
      timeZone: 'America/Toronto', dateStyle: 'long', timeStyle: 'short',
    }).format(new Date(date)) : null

  return (
    <section id="retours-a-relire" aria-labelledby="titre-retours-a-relire" className="space-y-2 scroll-mt-56">
      <h2 id="titre-retours-a-relire" className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">
        Retours à relire
      </h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
        <form action={action} className="flex flex-wrap items-start gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <input type="hidden" name="depuis" value={date ?? ''} />
          <div className="min-w-0 flex-1 basis-64 space-y-2 font-corps text-sm text-encre-douce">
            <p><strong className="font-ui text-encre">{actif ? 'Le signal est activé.' : 'Le signal est désactivé.'}</strong></p>
            <p>
              Signaler dans le panneau d’attention les retours publiés malgré un problème de forme.
              Le signal disparaît dès que l’élève a lu le retour ou que tu l’as corrigé.
            </p>
            <p>Seuls les retours créés après l’activation sont concernés. Les anciens retours restent à l’écart.</p>
            {dateLisible && <p className="font-ui text-xs">Actif depuis le {dateLisible} (heure de Montréal).</p>}
            {!actif && <p className="font-ui text-xs">Chaque activation fixe un nouveau point de départ.</p>}
          </div>
          <button type="submit" disabled={enCours || !disponible}
            className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2 font-ui text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50">
            {enCours ? 'Enregistrement…' : actif ? 'Désactiver' : 'Activer'}
          </button>
        </form>
        {!disponible && <p className="font-ui text-xs text-muet">Ce réglage est indisponible pour le moment.</p>}
        <p role="status" className={`font-ui text-xs ${retour?.ok ? 'text-ok' : 'text-retard'}`}>
          {retour?.message}
        </p>
      </div>
    </section>
  )
}
