'use client'
// ============================================================================
// L'INTERRUPTEUR DE L'ANTICHAMBRE (retours de classe du 22/09/2026). Il vit dans
// Paramètres de Quazian, sur `scriptorium_params` comme les autres portes.
// Patron : `app/prof/scriptorium/PorteCopieAnnotee.tsx`.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerAntichambre } from './actions-antichambre'

export default function PorteAntichambre({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<{ ok: boolean; message: string } | null, FormData>(
    actionBasculerAntichambre, null)
  return (
    <section className="bg-surface border border-bordure rounded-xl p-5 space-y-2">
      <h4 className="text-sm font-medium text-encre-douce">L’antichambre avant le quiz</h4>
      <form action={action} className="flex flex-wrap items-baseline gap-3">
        <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
        <p className="min-w-0 flex-1 text-sm text-encre-douce">
          <strong className="text-encre">{actif ? 'Ouverte.' : 'Fermée.'}</strong>{' '}
          {actif
            ? 'Un quiz se lance en deux temps : tu ouvres l’antichambre, les élèves y lisent les consignes et s’essaient sur une question qui ne compte pas ; tu vois qui est là, et tu lances — le chrono part à ce moment.'
            : 'Un quiz se lance en un geste, comme avant : le chrono part tout de suite.'}
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
