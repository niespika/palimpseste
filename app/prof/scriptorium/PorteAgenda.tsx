'use client'
// ============================================================================
// L'AGENDA DE CLASSE — L'INTERRUPTEUR `agenda_classe_actif`, basculé DEPUIS ICI
// (Paramètres de Scriptorium), comme les autres portes. Patron : `PorteNotions.tsx`.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerAgenda, type RetourPorteAgenda } from './actions-agenda'

export default function PorteAgenda({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorteAgenda | null, FormData>(
    actionBasculerAgenda, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">L’agenda de classe — évènements libres et intitulés d’évaluation</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'L’agenda de classe est ouvert.' : 'L’agenda de classe est fermé.'}
            </strong>{' '}
            {actif
              ? 'Le calendrier propose « Ajouter un évènement » (une lecture à finir, une sortie, un rappel) pour une ou plusieurs classes ; les élèves voient ceux qui leur sont destinés. Dans le plan d’évaluation, chaque exercice peut recevoir un intitulé, lu aux deux calendriers — à l’élève seulement sur un examen annoncé.'
              : 'Aucun évènement libre n’est proposé ni affiché, et les exercices du plan se lisent par leur seul type (« Quiz »). Rien n’est effacé : ce qui a été saisi réapparaît à l’ouverture.'}
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
