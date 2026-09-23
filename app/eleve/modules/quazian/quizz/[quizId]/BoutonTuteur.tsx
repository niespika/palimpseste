'use client'

// « En parler avec le tuteur → » sous une question ratée avec 70 points ou plus
// (retours de classe, point 8). Le refus se DIT : un bouton sans effet ne se
// distingue pas d'un bouton mort.
import { useActionState } from 'react'
import { ouvrirTuteur } from './actions-tuteur'

export function BoutonTuteur({ questionId }: { questionId: string }) {
  const [retour, action, enCours] = useActionState(ouvrirTuteur, null)
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="questionId" value={questionId} />
      <button
        type="submit"
        disabled={enCours}
        className="w-full min-h-11 rounded-xl border border-bordure-bouton bg-surface px-4 py-2 text-sm text-encre hover:bg-parchemin-fonce disabled:opacity-50"
      >
        {enCours ? 'Ouverture…' : 'En parler avec le tuteur →'}
      </button>
      {retour?.error && <p role="alert" className="mt-1.5 text-sm text-retard">{retour.error}</p>}
    </form>
  )
}
