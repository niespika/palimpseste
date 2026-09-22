'use client'

import { useState, type FormEvent } from 'react'
import { ajouterQuestions } from '../actions'

export function AjouterQuestions({ quizId }: { quizId: string }) {
  const [nb, setNb] = useState('3')
  const [consigne, setConsigne] = useState('')
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function generer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setErreur(null)
    setMessage(null)
    const fd = new FormData(event.currentTarget)
    try {
      const resultat = await ajouterQuestions(fd)
      if (resultat.error) {
        setErreur(resultat.error)
      } else if (resultat.success) {
        setMessage(resultat.message)
        setNb('3')
        setConsigne('')
      }
    } catch {
      setErreur('La génération n’a pas pu être confirmée. Ta consigne est conservée.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={generer} aria-busy={pending} className="mt-6 bg-surface border border-bordure rounded-xl p-4 space-y-3">
      <input type="hidden" name="quizId" value={quizId} />
      <label className="flex flex-wrap items-center gap-2 text-sm text-encre">
        Générer
        <input
          type="number" name="nb" min={1} max={10} step={1} required
          value={nb} onChange={(e) => setNb(e.target.value)} disabled={pending}
          aria-label="Nombre de questions supplémentaires"
          className="w-16 px-2 py-1 border border-bordure rounded-lg disabled:opacity-50"
        />
        question(s) de plus
      </label>
      <label className="block text-sm text-encre-douce">
        Consigne (facultatif)
        <input
          type="text" name="consigne" maxLength={300}
          value={consigne} onChange={(e) => setConsigne(e.target.value)} disabled={pending}
          placeholder="Plutôt sur Descartes, plus difficile, sur les dates…"
          className="mt-1 block w-full min-w-0 px-3 py-2 text-sm border border-bordure rounded-lg disabled:opacity-50"
        />
      </label>
      <button type="submit" disabled={pending} className="px-3 py-2 text-sm bg-bouton text-surface rounded-lg hover:opacity-90 disabled:opacity-50">
        {pending ? 'Génération en cours…' : 'Générer les questions'}
      </button>
      {erreur && <p role="alert" className="text-sm text-retard">{erreur}</p>}
      {message && <p role="status" className="text-sm text-ok">{message}</p>}
    </form>
  )
}
