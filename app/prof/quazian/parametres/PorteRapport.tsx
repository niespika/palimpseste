'use client'
// L'INTERRUPTEUR DES RAPPORTS DE FRAGILITÉS CONSERVÉS (23/09). Patron : `PorteTuteur.tsx`.
import { useActionState } from 'react'
import { actionBasculerRapport } from './actions-rapport'

export default function PorteRapport({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<{ ok: boolean; message: string } | null, FormData>(
    actionBasculerRapport, null)
  return (
    <section className="bg-surface border border-bordure rounded-xl p-5 space-y-2">
      <h4 className="text-sm font-medium text-encre-douce">Rapports de fragilités conservés</h4>
      <form action={action} className="flex flex-wrap items-baseline gap-3">
        <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
        <p className="min-w-0 flex-1 text-sm text-encre-douce">
          <strong className="text-encre">{actif ? 'Ouvert.' : 'Fermé.'}</strong>{' '}
          {actif
            ? 'Dans Diagnostic → Par classe, le rapport se génère pour la classe choisie et reste consultable, daté (le dernier en entier, les précédents repliés).'
            : 'Le rapport de fragilités mêle toutes les classes et n’est pas conservé : il disparaît en quittant la page.'}
        </p>
        <button type="submit" disabled={enCours}
          className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50">
          {enCours ? '…' : actif ? 'Fermer' : 'Ouvrir'}
        </button>
      </form>
      {retour && <p className={`text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>}
    </section>
  )
}
