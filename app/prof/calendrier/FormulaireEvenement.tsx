'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { creerEvenementAgenda, modifierEvenementAgenda } from './actions'
import { TITRE_MAX, DETAIL_MAX } from '@/utils/calendrier-agenda'

// L'agenda de classe (18/09) — le formulaire d'UN évènement libre : titre, date,
// classe(s), détail, visibilité. En création, une ligne par classe cochée ; en
// modification, la classe ne change pas (une ligne = une classe).
export interface EvenementAModifier {
  id: string
  titre: string
  date: string
  detail: string | null
  visible_eleves: boolean
}

export default function FormulaireEvenement({
  classes,
  couleurs,
  dateDefaut,
  classesPreselection,
  existant,
  onFermer,
}: {
  classes: { id: string; nom: string }[]
  couleurs: Record<string, string>
  dateDefaut: string
  classesPreselection?: string[]
  existant?: EvenementAModifier
  onFermer: () => void
}) {
  const router = useRouter()
  const [titre, setTitre] = useState(existant?.titre ?? '')
  const [date, setDate] = useState(existant?.date ?? dateDefaut)
  const [detail, setDetail] = useState(existant?.detail ?? '')
  const [visible, setVisible] = useState(existant?.visible_eleves ?? true)
  const [sel, setSel] = useState<Set<string>>(new Set(classesPreselection ?? (classes.length === 1 ? [classes[0].id] : [])))
  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function enregistrer(ev: React.FormEvent) {
    ev.preventDefault()
    setBusy(true); setErreur(null)
    const res = existant
      ? await modifierEvenementAgenda({ id: existant.id, titre, date, detail: detail || null, visible_eleves: visible })
      : await creerEvenementAgenda({ titre, date, detail: detail || null, visible_eleves: visible, classe_ids: [...sel] })
    setBusy(false)
    if (res.error) { setErreur(res.error); return }
    onFermer()
    // Suivre l'évènement : aller au jour où il est posé (sinon il disparaîtrait
    // de la vue courante sans un mot).
    router.push(`/prof/calendrier?vue=jour&date=${date}`)
    router.refresh()
  }

  const champ = 'w-full border border-bordure rounded-lg bg-white px-3 py-2 font-corps text-sm text-encre'
  return (
    <form onSubmit={enregistrer} className="bg-surface border border-bordure rounded-xl p-4 space-y-3 max-w-xl">
      <p className="font-ui text-[11px] uppercase tracking-wider text-muet font-bold">
        {existant ? 'Modifier l’évènement' : 'Nouvel évènement'}
      </p>
      <label className="block space-y-1">
        <span className="font-ui text-xs text-muet">Titre</span>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} maxLength={TITRE_MAX} required autoFocus
          placeholder="Avoir terminé la lecture de Candide" className={champ} />
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="block space-y-1">
          <span className="font-ui text-xs text-muet">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={champ} />
        </label>
        <label className="flex items-end gap-2 pb-2 font-ui text-sm text-encre-douce">
          <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} className="w-4 h-4" />
          Visible des élèves
        </label>
      </div>
      {!existant && (
        <fieldset className="space-y-1">
          <legend className="font-ui text-xs text-muet">Classe(s)</legend>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const on = sel.has(c.id)
              return (
                <label key={c.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm cursor-pointer focus-within:ring-2 focus-within:ring-encre ${on ? 'border-encre bg-parchemin-fonce text-encre' : 'border-bordure text-muet'}`}>
                  <input type="checkbox" className="sr-only" checked={on}
                    onChange={() => setSel((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n })} />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: couleurs[c.id] ?? '#a8a29e' }} />
                  {c.nom}
                </label>
              )
            })}
          </div>
        </fieldset>
      )}
      <label className="block space-y-1">
        <span className="font-ui text-xs text-muet">Détail (facultatif)</span>
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} maxLength={DETAIL_MAX} rows={2}
          placeholder="Chapitres 1 à 12 ; on en discute en classe." className={champ} />
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={busy} className="text-sm bg-bouton text-surface px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">
          {busy ? '…' : existant ? 'Enregistrer' : 'Ajouter'}
        </button>
        <button type="button" onClick={onFermer} className="text-sm text-muet hover:text-encre-douce">annuler</button>
        {erreur && <span className="text-xs text-retard">{erreur}</span>}
      </div>
    </form>
  )
}
