'use client'
// C7 — L'INTERRUPTEUR DU GABARIT DES EXERCICES. Patron : `PorteCopieAnnotee.tsx`.
import { useActionState } from 'react'
import { actionBasculerGabarit, type RetourPorte } from './actions-gabarit'

export default function PorteGabarit({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorte | null, FormData>(
    actionBasculerGabarit, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Le gabarit des exercices</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'Le gabarit est ouvert.' : 'Le gabarit est fermé.'}
            </strong>{' '}
            {actif
              ? 'Les exercices entrés au format 1.5 — variantes, problèmes nommés par leur clé, pièces du cran 2 — se servent sous le régime du gabarit, objet par objet. La banque d’avant ne change pas.'
              : 'Toute la banque se sert sous le régime d’avant. Les exercices au format 1.5 entrent en base mais ne se servent pas encore.'}
          </p>
          <button type="submit" disabled={enCours}
            className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2
                       font-ui text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50">
            {enCours ? '…' : actif ? 'Fermer' : 'Ouvrir'}
          </button>
        </form>
        {retour && (
          <p className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>
        )}
      </div>
    </section>
  )
}
