'use client'
// L'INTERRUPTEUR « EN PARLER AVEC LE TUTEUR » (retours de classe, point 8).
// Patron : `PorteAntichambre.tsx`.
import { useActionState } from 'react'
import { actionBasculerTuteur } from './actions-tuteur'

export default function PorteTuteur({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<{ ok: boolean; message: string } | null, FormData>(
    actionBasculerTuteur, null)
  return (
    <section className="bg-surface border border-bordure rounded-xl p-5 space-y-2">
      <h4 className="text-sm font-medium text-encre-douce">En parler avec le tuteur, après le quiz</h4>
      <form action={action} className="flex flex-wrap items-baseline gap-3">
        <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
        <p className="min-w-0 flex-1 text-sm text-encre-douce">
          <strong className="text-encre">{actif ? 'Ouvert.' : 'Fermé.'}</strong>{' '}
          {actif
            ? 'Sur l’écran de note, une question ratée avec 70 points ou plus sur une mauvaise réponse porte un bouton « En parler avec le tuteur ». Le tuteur s’ouvre avec un premier message écrit par l’application, puis la discussion continue ; son coût est compté à part.'
            : 'Pas de bouton vers le tuteur sur l’écran de note.'}
          {' '}Dans tous les cas, le tuteur est en pause pendant un quiz de la classe.
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
