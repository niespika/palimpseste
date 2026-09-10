'use client'
import { useState } from 'react'
import { actionRelectureArgument } from '@/app/deroule/actions'
import type { AffichagePilote, ReponseRelecture } from '@/utils/pilote-argument/contrat'

export function PreparationArgument({ offre }: { offre: AffichagePilote }) {
  if (!offre.modele) return null
  return <section className="flex min-w-0 flex-col gap-4 rounded-xl border border-bordure bg-surface p-4 text-encre">
    <h3 className="font-marque text-sm">Construire un argument</h3>
    <p className="font-corps text-base leading-relaxed">Un exemple pour observer les fonctions de l’argument :</p>
    {offre.modele.annotations.map(a => <div key={a.libelle}>
      <p className="font-ui text-xs font-semibold text-pigment">{a.libelle}</p>
      <p className="mt-1 font-corps text-base leading-relaxed">{a.passage}</p>
    </div>)}
    <details><summary className="cursor-pointer py-2 font-ui text-sm">Comment cet argument se construit</summary>
      <p className="font-corps text-base leading-relaxed">{offre.modele.construction}</p>
    </details>
    <h3 className="font-marque text-sm">Prépare ton argument</h3>
    <ol className="list-decimal space-y-3 pl-5 font-corps text-base leading-relaxed">
      {offre.preparation.map(q => <li key={q.id}>{q.preparation}</li>)}
    </ol>
  </section>
}

export function RelectureArgument({ depotId, offre, texte, initiale, apres }: {
  depotId: string; offre: AffichagePilote; texte: string; initiale: ReponseRelecture[]; apres: () => void
}) {
  const [reponses, setReponses] = useState<ReponseRelecture[]>(initiale)
  const [message, setMessage] = useState('')
  const [occupe, setOccupe] = useState(false)
  const changer = (r: ReponseRelecture) => setReponses(rs => [...rs.filter(x => x.question_id !== r.question_id), r])
  async function enregistrer() {
    setOccupe(true)
    try {
      const r = await actionRelectureArgument(depotId, texte, reponses)
      if (r.ok) apres()
      else setMessage(r.message)
    } catch { setMessage('La relecture n’a pas été enregistrée. Réessaie.') }
    finally { setOccupe(false) }
  }
  return <section className="flex min-w-0 flex-col gap-5" aria-label="Relire mon argument">
    <h3 className="font-marque text-lg text-encre">Relis ton argument</h3>
    <p className="whitespace-pre-wrap break-words rounded-xl border border-bordure bg-surface p-4 font-corps text-base leading-relaxed text-encre">{texte}</p>
    {offre.preparation.map(q => {
      const r = reponses.find(r => r.question_id === q.id)
      return <fieldset key={q.id} className="min-w-0 space-y-3 rounded-xl border border-bordure p-4">
        <legend className="max-w-full px-1 font-corps text-base text-encre">{q.relecture}</legend>
        <p className="font-ui text-sm text-muet">{offre.invitation}</p>
        {offre.reponses.map(a => <label key={a.code} className="flex min-h-11 items-center gap-3 font-ui text-sm text-encre">
          <input type="radio" name={q.id} value={a.code} checked={r?.etat === a.code}
            onChange={() => changer({ question_id: q.id, etat: a.code as ReponseRelecture['etat'], passage: r?.passage })} />
          {a.libelle}
        </label>)}
        <label className="block font-ui text-sm text-muet">Passage de ton texte (facultatif)
          <input className="mt-2 min-h-11 w-full rounded-lg border border-bordure bg-surface p-2 text-encre"
            disabled={!r} value={r?.passage ?? ''} onChange={e => r && changer({ ...r, passage: e.target.value })} />
        </label>
      </fieldset>
    })}
    {message && <p role="alert" className="font-ui text-sm text-attention">{message}</p>}
    <button type="button" disabled={occupe} onClick={enregistrer}
      className="min-h-12 rounded-xl bg-bouton p-3 font-ui font-semibold text-bouton-texte disabled:opacity-50">
      {occupe ? 'Enregistrement…' : 'Terminer ma relecture'}
    </button>
  </section>
}
