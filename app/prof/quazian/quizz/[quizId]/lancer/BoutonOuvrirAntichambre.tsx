'use client'

// « Ouvrir l'antichambre » qui DIT son refus (revue du 22/09) : porte fermée
// entre-temps, question arrivée à valider… Un clic sans effet visible ne se
// distingue pas d'un bouton mort.
import { useActionState } from 'react'
import { ouvrirAntichambre } from './actions'

export function BoutonOuvrirAntichambre({ quizId }: { quizId: string }) {
  const [retour, action, enCours] = useActionState(
    async (_prec: { error?: string } | null, fd: FormData) => {
      const r = await ouvrirAntichambre(fd)
      return 'error' in r && r.error ? { error: r.error } : null
    },
    null,
  )
  return (
    <form action={action}>
      <input type="hidden" name="quizId" value={quizId} />
      <button
        type="submit"
        disabled={enCours}
        className="px-8 py-3 bg-bouton text-surface rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors font-medium"
      >
        {enCours ? '…' : 'Ouvrir l’antichambre'}
      </button>
      {retour?.error && <p role="alert" className="mt-2 text-sm text-retard">{retour.error}</p>}
    </form>
  )
}
