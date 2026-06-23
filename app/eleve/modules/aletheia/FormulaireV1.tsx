'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreV1 } from './actions'
import { AIDES_V1_DEFAUT, type AidesV1 } from './aides-v1'

interface Props {
  livreId: string
  semaine: number
  theseInitial?: string
  argumentsInitial?: string
  accordInitial?: string
  questionsInitial?: string
  vocabulaireInitial?: string
  /** Bulles d'aide « comment remplir » (éditables par le prof, T6). */
  aides?: AidesV1
}

const champClasse =
  'w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y text-stone-900'

// Saisie V1 — 5 champs (SPEC §1) : idée principale, arguments, accord, questions, vocabulaire.
export default function FormulaireV1({
  livreId, semaine,
  theseInitial = '', argumentsInitial = '', accordInitial = '', questionsInitial = '', vocabulaireInitial = '',
  aides = AIDES_V1_DEFAUT,
}: Props) {
  const router = useRouter()
  const [these, setThese] = useState(theseInitial)
  const [args, setArgs] = useState(argumentsInitial)
  const [accord, setAccord] = useState(accordInitial)
  const [questions, setQuestions] = useState(questionsInitial)
  const [vocabulaire, setVocabulaire] = useState(vocabulaireInitial)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    const qs = questions.split('\n').map(q => q.trim()).filter(Boolean)
    const voc = vocabulaire.split('\n').map(v => v.trim()).filter(Boolean)
    if (!these.trim()) { setErreur('Écris l’idée principale du chapitre.'); return }
    if (!args.trim()) { setErreur('Indique les arguments avancés par l’auteur.'); return }
    if (!accord.trim()) { setErreur('Dis si tu es d’accord ou non, et pourquoi.'); return }
    if (qs.length === 0) { setErreur('Pose au moins une question (une par ligne).'); return }
    setChargement(true)
    try {
      const res = await soumettreV1(livreId, semaine, {
        these, arguments: args, accord, questions: qs, vocabulaire: voc,
      })
      if (res?.error) { setErreur(res.error); return }
      router.refresh()
    } finally {
      setChargement(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Idée principale <span className="font-normal">— ce que dit le chapitre, selon toi</span>
        </label>
        <textarea value={these} onChange={e => setThese(e.target.value)} rows={3}
          placeholder={aides.these}
          className={champClasse} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Arguments <span className="font-normal">— les raisons que l’auteur avance pour la soutenir</span>
        </label>
        <textarea value={args} onChange={e => setArgs(e.target.value)} rows={4}
          placeholder={aides.arguments}
          className={champClasse} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Ton accord <span className="font-normal">— es-tu d’accord ou non, et pourquoi ?</span>
        </label>
        <textarea value={accord} onChange={e => setAccord(e.target.value)} rows={3}
          placeholder={aides.accord}
          className={champClasse} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Tes questions <span className="font-normal">(2-3, une par ligne)</span>
        </label>
        <textarea value={questions} onChange={e => setQuestions(e.target.value)} rows={3}
          placeholder={aides.questions}
          className={champClasse} />
      </div>
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">
          Vocabulaire <span className="font-normal">— les mots que tu ne comprends pas (un par ligne, facultatif)</span>
        </label>
        <textarea value={vocabulaire} onChange={e => setVocabulaire(e.target.value)} rows={2}
          placeholder={aides.vocabulaire}
          className={champClasse} />
      </div>
      {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement}
        className="w-full bg-stone-800 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'Soumettre mon travail'}
      </button>
    </form>
  )
}
