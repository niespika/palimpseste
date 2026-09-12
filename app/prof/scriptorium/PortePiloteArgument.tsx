'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { actionBasculerPiloteArgument, actionBasculerBanqueArgument } from './actions-pilote-argument'

export default function PortePiloteArgument({ actif, disponible, banqueActive, banqueDisponible, distributionOuverte }: {
  actif: boolean; disponible: boolean; banqueActive: boolean; banqueDisponible: boolean; distributionOuverte: boolean
}) {
  const [retour, action, enCours] = useActionState(actionBasculerPiloteArgument, null)
  const [retourBanque, actionBanque, banqueEnCours] = useActionState(actionBasculerBanqueArgument, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Le pilote argument — crans 6 et 8</h2>
      <div className="space-y-3 rounded-xl border border-bordure bg-surface p-4">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 basis-64 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {!disponible ? 'Le pilote est indisponible.' : actif ? 'Le pilote est ouvert.' : 'Le pilote est fermé.'}
            </strong>{' '}
            {!disponible
              ? 'Sa configuration doit être installée avant de pouvoir l’ouvrir.'
              : 'Pour TC, 1HLP et THLP. Le professeur peut attribuer un exercice ; la banque peut aussi le distribuer lorsque la porte ci-dessous est ouverte.'}
          </p>
          <button type="submit" disabled={enCours || !disponible}
            className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2 font-ui text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50">
            {enCours ? '…' : actif ? 'Fermer le pilote' : 'Ouvrir le pilote'}
          </button>
        </form>
        {disponible && <p className="font-corps text-sm text-encre-douce">
          Fermer le pilote suspend aussi l’accès aux exercices déjà attribués et leurs retours. Les travaux sont conservés.
        </p>}
        {actif && <Link href="/prof/conception/pilote-argument"
          className="inline-flex min-h-11 items-center rounded-[10px] border border-bordure-bouton px-4 py-2 font-ui text-sm text-encre-douce hover:bg-parchemin-fonce">
          Attribuer un exercice du pilote
        </Link>}
        {retour && <p role="status" className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>}
        <form action={actionBanque} className="flex flex-wrap items-baseline gap-3 border-t border-bordure pt-3">
          <input type="hidden" name="actif" value={banqueActive ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 basis-64 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {!banqueDisponible ? 'La distribution automatique est indisponible.' : banqueActive ? 'La porte de distribution automatique est ouverte.' : 'La porte de distribution automatique est fermée.'}
            </strong>{' '}
            {!banqueDisponible ? 'Sa configuration doit être installée.' : 'Les crans 6 et 8 rejoignent la banque selon les prérequis et les sujets accessibles à chaque classe. Fermer cette porte arrête les nouvelles attributions automatiques ; les travaux déjà attribués sont conservés.'}
          </p>
          <button type="submit" disabled={banqueEnCours || !banqueDisponible}
            className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2 font-ui text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50">
            {banqueEnCours ? '…' : banqueActive ? 'Fermer la distribution automatique' : 'Ouvrir la distribution automatique'}
          </button>
        </form>
        {banqueDisponible && (!actif || !distributionOuverte) && <p className="font-corps text-sm text-encre-douce">
          La distribution attend aussi l’ouverture du pilote, du routeur et des exercices.
        </p>}
        {retourBanque && <p role="status" className={`font-ui text-xs ${retourBanque.ok ? 'text-ok' : 'text-retard'}`}>{retourBanque.message}</p>}
      </div>
    </section>
  )
}
