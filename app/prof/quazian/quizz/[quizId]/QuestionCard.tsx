'use client'

import { useState } from 'react'
import { validerQuestion, modifierQuestion, regenererDisctracteurs, refuserQuestion } from '../actions'

interface Question {
  id: string
  enonce: string
  options: string[]
  index_correct: number
  concept_tag: string
  statut_validation: string
}

const LETTRES = ['A', 'B', 'C', 'D']
// Une panne pendant un appel laissait la carte figée, boutons inactifs et sans un
// mot (23/09) : chaque geste rattrape l'exception et libère la carte. Le message
// ne présume pas la cause — connexion coupée, ou session expirée ; les échecs
// connus (refus, modèle en échec) reviennent en `{ error }`, avec leur phrase.
const SANS_REPONSE = 'L’opération n’a pas abouti (connexion coupée, ou session expirée). Recharge la page pour voir ce qui a été enregistré, puis réessaie.'

export function QuestionCard({
  question,
  numero,
  quizId,
  readOnly,
}: {
  question: Question
  numero: number
  quizId: string
  readOnly: boolean
}) {
  const [mode, setMode] = useState<'vue' | 'edit'>('vue')
  const [pending, setPending] = useState(false)
  const [enonce, setEnonce] = useState(question.enonce)
  const [options, setOptions] = useState([...question.options])
  const [correct, setCorrect] = useState(question.index_correct)
  const [tag, setTag] = useState(question.concept_tag)
  const [confirmerRefus, setConfirmerRefus] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  function ouvrirEdition() {
    setEnonce(question.enonce)
    setOptions([...question.options])
    setCorrect(question.index_correct)
    setTag(question.concept_tag)
    setConfirmerRefus(false)
    setErreur(null)
    setMode('edit')
  }

  async function handleRefuser() {
    if (pending) return
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('id', question.id)
      fd.append('quizId', quizId)
      const resultat = await refuserQuestion(fd)
      if (resultat.error) setErreur(resultat.error)
    } catch {
      setErreur('Le refus n’a pas pu être confirmé. Réessaie.')
    } finally {
      setPending(false)
    }
  }

  async function handleValider() {
    if (pending) return
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('id', question.id)
      fd.append('quizId', quizId)
      await validerQuestion(fd)
    } catch {
      setErreur(SANS_REPONSE)
    } finally {
      setPending(false)
    }
  }

  async function handleModifier() {
    if (pending) return
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('id', question.id)
      fd.append('quizId', quizId)
      fd.append('enonce', enonce)
      options.forEach((o, i) => fd.append(`opt${i}`, o))
      fd.append('index_correct', String(correct))
      fd.append('concept_tag', tag)
      // ⛔ 23/09 — un refus (brouillon lancé, antichambre ouverte, champ vide) ou
      //    une panne GARDE l'éditeur ouvert avec la saisie : avant, il se
      //    refermait, et « Modifier » repartait de la question enregistrée —
      //    le texte tapé était perdu.
      const res = await modifierQuestion(fd)
      if (res && 'error' in res && res.error) {
        setErreur(res.error)
        return
      }
      setMode('vue')
    } catch {
      setErreur('La modification n’a pas abouti (connexion coupée, ou session expirée) : elle n’est peut-être pas enregistrée. Ton texte est gardé ici ; réessaie.')
    } finally {
      setPending(false)
    }
  }

  async function handleRegenerer() {
    if (pending) return
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('id', question.id)
      fd.append('quizId', quizId)
      const res = await regenererDisctracteurs(fd)
      setErreur(res && 'error' in res && res.error ? res.error : null)
    } catch {
      setErreur(SANS_REPONSE)
    } finally {
      setPending(false)
    }
  }

  const estValide = question.statut_validation === 'valide'

  if (mode === 'edit') {
    return (
      // `data-edition-ouverte` : « ✓ Tout valider » le lit pour prévenir qu'une
      // correction n'est pas encore enregistrée (23/09).
      <div className="bg-surface border border-bordure rounded-xl p-4" data-edition-ouverte={question.id} data-numero={numero}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-muet font-mono">Q{numero}</span>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="ml-auto px-2 py-0.5 text-xs border border-bordure rounded-lg w-36"
            placeholder="concept_tag"
          />
        </div>
        {/* 4 lignes, agrandissables : en prod (23/09), énoncés de 86 caractères en
            médiane, 131 au 9e décile, 343 au plus — deux lignes en cachaient un tiers. */}
        <textarea
          value={enonce}
          onChange={(e) => setEnonce(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-bordure rounded-lg mb-3 resize-y"
        />
        <div className="space-y-2 mb-4">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCorrect(i)}
                className={`w-6 h-6 shrink-0 rounded-full text-xs font-bold border transition-colors ${
                  correct === i
                    ? 'bg-ok text-surface border-ok'
                    : 'bg-surface text-muet border-bordure hover:border-encre-douce'
                }`}
              >
                {LETTRES[i]}
              </button>
              <input
                type="text"
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? e.target.value : o))}
                className="min-w-0 flex-1 px-3 py-1.5 text-sm border border-bordure rounded-lg"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleModifier}
            disabled={pending}
            className="px-3 py-1 text-xs bg-bouton text-surface rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {pending ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
          <button
            onClick={() => { setErreur(null); setMode('vue') }}
            disabled={pending}
            className="px-3 py-1 text-xs bg-parchemin-fonce text-encre-douce rounded-lg hover:bg-bordure disabled:opacity-50"
          >
            Annuler
          </button>
        </div>
        {erreur && <p role="alert" className="mt-2 text-sm text-retard">{erreur}</p>}
      </div>
    )
  }

  return (
    <div className={`bg-surface border rounded-xl p-4 ${estValide ? 'border-bordure' : 'border-attention'}`}>
      <div className="flex items-start gap-2 mb-3">
        <span className="text-xs text-muet font-mono shrink-0">Q{numero}</span>
        {question.concept_tag && (
          <span className="text-xs text-muet truncate">{question.concept_tag}</span>
        )}
        {estValide ? (
          <span className="ml-auto text-xs text-ok shrink-0">✓</span>
        ) : (
          <span className="ml-auto text-xs text-attention shrink-0">à valider</span>
        )}
      </div>

      <p className="text-sm font-medium text-encre mb-3">{question.enonce}</p>

      <div className="space-y-1.5 mb-4">
        {question.options.map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              i === question.index_correct
                ? 'bg-ok-teinte text-ok border border-ok'
                : 'bg-parchemin-fonce text-encre-douce'
            }`}
          >
            <span className="font-mono text-xs font-bold">{LETTRES[i]}</span>
            {opt}
            {i === question.index_correct && <span className="ml-auto text-xs">✓</span>}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2 flex-wrap">
          {!estValide && (
            <button
              onClick={handleValider}
              disabled={pending}
              className="px-3 py-1 text-xs bg-ok text-surface rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              ✓ Valider
            </button>
          )}
          <button
            onClick={ouvrirEdition}
            disabled={pending}
            className="px-3 py-1 text-xs bg-parchemin-fonce text-encre-douce rounded-lg hover:bg-bordure disabled:opacity-50"
          >
            Modifier
          </button>
          <button
            onClick={handleRegenerer}
            disabled={pending}
            className="px-3 py-1 text-xs text-pigment hover:bg-pigment-teinte rounded-lg transition-colors disabled:opacity-50"
          >
            ↻ Nouveaux distracteurs
          </button>
          {!confirmerRefus && (
            <button
              onClick={() => { setErreur(null); setConfirmerRefus(true) }}
              disabled={pending}
              className="px-3 py-1 text-xs text-retard hover:bg-retard-teinte rounded-lg transition-colors disabled:opacity-50"
            >
              Refuser
            </button>
          )}
        </div>
      )}
      {!readOnly && confirmerRefus && (
        <div className="mt-3 text-sm">
          <p className="text-encre-douce mb-2">Refuser cette question ? Elle sera supprimée du quiz.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefuser}
              disabled={pending}
              className="px-3 py-1 text-xs text-retard hover:bg-retard-teinte rounded-lg disabled:opacity-50"
            >
              {pending ? 'Refus en cours…' : 'Confirmer le refus'}
            </button>
            <button
              onClick={() => setConfirmerRefus(false)}
              disabled={pending}
              className="px-3 py-1 text-xs bg-parchemin-fonce text-encre-douce rounded-lg hover:bg-bordure disabled:opacity-50"
            >
              Garder
            </button>
          </div>
        </div>
      )}
      {erreur && <p role="alert" className="mt-2 text-sm text-retard">{erreur}</p>}
    </div>
  )
}
