'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreV1 } from './actions'

interface Props {
  livreId: string
  semaine: number
}

// Résumé (1-2 §) + questions (2-3, une par ligne) → soumission (V1).
export default function FormulaireResumeQuestions({ livreId, semaine }: Props) {
  const router = useRouter()
  const [resume, setResume] = useState('')
  const [questions, setQuestions] = useState('')
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    const qs = questions.split('\n').map(q => q.trim()).filter(Boolean)
    if (!resume.trim()) { setErreur('Écris un résumé.'); return }
    if (qs.length === 0) { setErreur('Pose au moins une question (une par ligne).'); return }
    setChargement(true)
    try {
      const res = await soumettreV1(livreId, semaine, resume, qs)
      if (res?.error) { setErreur(res.error); return }
      router.refresh()
    } finally {
      setChargement(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Ton résumé <span className="font-normal">(1-2 paragraphes)</span></label>
        <textarea
          value={resume}
          onChange={e => setResume(e.target.value)}
          rows={6}
          placeholder="Résume les chapitres lus cette semaine, avec tes propres mots."
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y text-stone-900"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Tes questions <span className="font-normal">(2-3, une par ligne)</span></label>
        <textarea
          value={questions}
          onChange={e => setQuestions(e.target.value)}
          rows={3}
          placeholder={'Une question par ligne…\nEx. : Pourquoi Nietzsche oppose-t-il Apollon et Dionysos ?'}
          className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y text-stone-900"
        />
      </div>
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement} className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'Soumettre mon résumé et mes questions'}
      </button>
    </form>
  )
}
