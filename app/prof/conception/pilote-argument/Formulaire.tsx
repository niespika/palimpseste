'use client'
import { useState } from 'react'
import { attribuerArgument } from './actions'
import type { CompetencePilote } from '@/utils/pilote-argument/contrat'
import { COMPETENCES_PILOTE } from '@/utils/pilote-argument/competences'

export function FormulaireArgument({ classeId, sujets }: { classeId: string; sujets: { id: string; enonce: string }[] }) {
  const [message,setMessage] = useState('')
  const [occupe,setOccupe] = useState(false)
  const [fait,setFait] = useState(false)
  const [requete] = useState(() => crypto.randomUUID())
  const classe = 'min-h-11 w-full rounded-lg border border-bordure bg-surface p-2 font-ui text-encre'
  async function soumettre(form: FormData) {
    if (occupe || fait) return
    setOccupe(true)
    setMessage('')
    try {
      const r = await attribuerArgument({ requeteId: requete, classeId, sujetId: String(form.get('sujet')),
        cran: Number(form.get('cran')) as 6 | 8, principale: form.get('principale') as CompetencePilote,
        secondaire: (form.get('secondaire') || null) as CompetencePilote | null })
      setMessage(r.message); setFait(r.ok)
    } catch { setMessage('L’attribution n’a pas abouti. Réessaie.') }
    finally { setOccupe(false) }
  }
  // Une réponse serveur refusée doit conserver le sujet et les options saisis.
  return <form onSubmit={event => { event.preventDefault(); void soumettre(new FormData(event.currentTarget)) }} className="max-w-3xl space-y-5">
    <fieldset className="space-y-3"><legend className="mb-3 font-titre text-lg">Sujet ouvert pour cette classe</legend>
      {sujets.map((s,i) => <label key={s.id} className="flex items-start gap-3 rounded-xl border border-bordure bg-surface p-4 font-corps text-lg">
        <input required type="radio" name="sujet" value={s.id} defaultChecked={i===0} className="mt-1.5" />{s.enonce}
      </label>)}
    </fieldset>
    <div className="grid gap-4 sm:grid-cols-3">
      <label>Cran<select name="cran" className={classe}><option value="6">6 · Avec préparation</option><option value="8">8 · Sans aide avant V1</option></select></label>
      <label>Principale<select name="principale" className={classe}>{COMPETENCES_PILOTE.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
      <label>Secondaire<select name="secondaire" className={classe}><option value="">Aucune</option>{COMPETENCES_PILOTE.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
    </div>
    <button disabled={occupe || fait || !sujets.length} className="min-h-12 rounded-xl bg-bouton px-5 py-3 font-ui font-semibold text-bouton-texte disabled:opacity-50">{occupe ? 'Attribution…' : 'Attribuer à la classe'}</button>
    {message && <p role="status" className="font-ui text-encre">{message}</p>}
  </form>
}
