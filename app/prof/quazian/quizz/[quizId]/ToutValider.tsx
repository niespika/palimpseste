'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { validerToutesQuestions } from '../actions'
import { libelleConfirmerToutValider, phraseEditionsOuvertes, phraseToutValider } from '@/utils/quazian-tout-valider'

// « ✓ Tout valider » demande confirmation (23/09) et ne valide QUE les questions
// affichées « à valider » dans la confirmation : une question ajoutée depuis un
// autre onglet reste à relire ; dans CET onglet, la page pose une `key` tirée de
// la liste, et la confirmation se referme dès que la liste change — le chiffre
// ne change jamais sous les yeux du professeur (revue du 23/09).
export function ToutValider({ quizId, ids, total }: { quizId: string; ids: string[]; total: number }) {
  const [confirmer, setConfirmer] = useState(false)
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enEdition, setEnEdition] = useState<number[]>([])
  const boutonRef = useRef<HTMLButtonElement>(null)
  const annulerRef = useRef<HTMLButtonElement>(null)
  const rendreLeFocus = useRef(false)
  const idPhrase = useId()

  // Au clavier : la confirmation s'ouvre sur « Annuler » (un Entrée réflexe ne
  // valide rien) ; refermée, le focus revient à « ✓ Tout valider ».
  useEffect(() => {
    if (confirmer) annulerRef.current?.focus()
    else if (rendreLeFocus.current) {
      rendreLeFocus.current = false
      boutonRef.current?.focus()
    }
  }, [confirmer])

  function ouvrir() {
    setErreur(null)
    // Les cartes ouvertes en modification, parmi celles qui seront validées.
    setEnEdition([...document.querySelectorAll<HTMLElement>('[data-edition-ouverte]')]
      .filter((e) => ids.includes(e.dataset.editionOuverte ?? ''))
      .map((e) => Number(e.dataset.numero))
      .filter((n) => Number.isInteger(n))
      .sort((a, b) => a - b))
    setConfirmer(true)
  }

  function fermer() {
    if (pending) return
    setErreur(null)
    rendreLeFocus.current = true
    setConfirmer(false)
  }

  async function valider() {
    if (pending) return
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('quizId', quizId)
      for (const id of ids) fd.append('id', id)
      const res = await validerToutesQuestions(fd)
      if (res && 'error' in res && res.error) {
        setErreur(res.error)
        return
      }
      setConfirmer(false)
    } catch {
      setErreur('L’opération n’a pas abouti (connexion coupée, ou session expirée). Recharge la page pour voir ce qui a été validé, puis réessaie.')
    } finally {
      setPending(false)
    }
  }

  if (!confirmer) {
    return (
      <button
        ref={boutonRef}
        type="button"
        onClick={ouvrir}
        className="px-4 py-2 text-sm bg-parchemin-fonce text-encre-douce rounded-lg hover:bg-bordure transition-colors"
      >
        ✓ Tout valider
      </button>
    )
  }

  const avis = phraseEditionsOuvertes(enEdition)
  return (
    <div
      role="group"
      aria-label="Confirmer la validation de toutes les questions"
      aria-describedby={idPhrase}
      onKeyDown={(e) => { if (e.key === 'Escape') fermer() }}
      className="max-w-xs rounded-xl border border-attention bg-attention-teinte p-3 text-sm"
    >
      <div id={idPhrase}>
        <p className="text-encre">{phraseToutValider(ids.length, total)}</p>
        {avis && <p className="mt-2 text-attention">{avis}</p>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={valider}
          disabled={pending}
          className="px-3 py-1 text-xs bg-ok text-surface rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Validation…' : libelleConfirmerToutValider(ids.length)}
        </button>
        <button
          ref={annulerRef}
          type="button"
          onClick={fermer}
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
