'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BlocPrompt from '@/components/BlocPrompt'
import { sauvegarderPromptsScriptorium } from './actions'

// Édition des 2 prompts de génération des artefacts du livre (carte + référence).
// Mêmes colonnes aletheia_params que /prof/aletheia, mais l'action sauvegarde ne
// touche QUE ces 2 colonnes (n'écrase pas les autres prompts gérés ailleurs).
export default function FormulaireParametresScriptorium({
  initial, defauts,
}: {
  initial: { prompt_capstone: string | null; prompt_reference: string | null }
  defauts: { capstone: string; reference: string }
}) {
  const router = useRouter()
  const [pC, setPC] = useState(initial.prompt_capstone || defauts.capstone)
  const [pRef, setPRef] = useState(initial.prompt_reference || defauts.reference)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderPromptsScriptorium({ promptCapstone: pC, promptReference: pRef })
    setEnregistrement(false)
    if (res.error) setMessage({ type: 'err', texte: res.error })
    else {
      setMessage({ type: 'ok', texte: 'Prompts enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3 text-sm text-attention">
        Prompts de génération des artefacts du livre (carte d&apos;architecture &amp; référence par chapitre), exécutés à la préparation du livre. Enregistrer un prompt identique au défaut revient à utiliser le défaut (et ses évolutions futures).
      </div>

      <BlocPrompt
        label="Carte d'architecture (capstone) — canonique, par livre" value={pC} onChange={setPC} defaut={defauts.capstone} rows={18}
        hint={<>Variables : <code>{'{livre_entier}'}</code>, <code>{'{structure_semaines}'}</code>. Sortie JSON <code>{'{ fil_conducteur, noeuds:[{chapitre,idee}], liens:[{de,vers,relation}] }'}</code>. Carte partagée, tous les liens aval révélés.</>}
      />

      <BlocPrompt
        label="Référence par chapitre — socle du diagnostic" value={pRef} onChange={setPRef} defaut={defauts.reference} rows={16}
        hint={<>Variables : <code>{'{livre_entier}'}</code>, <code>{'{structure_semaines}'}</code>. Sortie JSON <code>{'{ chapitres:[{semaine,titre,these_canonique,arguments_cles[]}] }'}</code>. Une entrée par semaine.</>}
      />

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-ok-teinte border border-ok text-ok' : 'bg-retard-teinte border border-retard text-retard'}`}>
          {message.texte}
        </div>
      )}

      <button onClick={handleSauvegarder} disabled={enregistrement}
        className="bg-bouton text-surface px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les prompts'}
      </button>
    </div>
  )
}
