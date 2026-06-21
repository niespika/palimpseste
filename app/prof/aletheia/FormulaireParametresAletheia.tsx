'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderPromptsAletheia } from './actions'

interface Props {
  promptFeedback1Initial: string
  promptFeedback1Defaut: string
  promptFeedback2Initial: string
  promptFeedback2Defaut: string
  promptCapstoneInitial: string
  promptCapstoneDefaut: string
  evalQuestionsInitial: boolean
  deblocageSequentielInitial: boolean
}

const TEXTAREA = 'w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900'

export default function FormulaireParametresAletheia({
  promptFeedback1Initial, promptFeedback1Defaut, promptFeedback2Initial, promptFeedback2Defaut, promptCapstoneInitial, promptCapstoneDefaut,
  evalQuestionsInitial, deblocageSequentielInitial,
}: Props) {
  const router = useRouter()
  const [p1, setP1] = useState(promptFeedback1Initial || promptFeedback1Defaut)
  const [p2, setP2] = useState(promptFeedback2Initial || promptFeedback2Defaut)
  const [pC, setPC] = useState(promptCapstoneInitial || promptCapstoneDefaut)
  const [evalQuestions, setEvalQuestions] = useState(evalQuestionsInitial)
  const [deblocageSequentiel, setDeblocageSequentiel] = useState(deblocageSequentielInitial)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderPromptsAletheia(p1, p2, pC, evalQuestions, deblocageSequentiel)
    setEnregistrement(false)
    if (res.error) setMessage({ type: 'err', texte: res.error })
    else {
      setMessage({ type: 'ok', texte: 'Prompts enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Prompts des retours IA d&apos;Aletheia. Enregistrer un prompt identique au défaut revient à utiliser le défaut (et ses évolutions futures).
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Retour 1 — socratique (par semaine)</label>
          <button type="button" onClick={() => setP1(promptFeedback1Defaut)} className="text-xs text-stone-500 hover:text-stone-700 underline">
            Restaurer la version par défaut
          </button>
        </div>
        <p className="text-xs text-stone-400 mb-2">
          Variables : <code>{'{texte_unite}'}</code>, <code>{'{resume_eleve}'}</code>, <code>{'{questions_eleve}'}</code>, <code>{'{syntheses_precedentes}'}</code>.
          Sortie JSON <code>{'{ questions_pour_avancer, reponses_a_tes_questions, remarque_questions }'}</code>.
        </p>
        <textarea value={p1} onChange={e => setP1(e.target.value)} rows={20} className={TEXTAREA} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Retour 2 — reconstruction + architecture (livre entier)</label>
          <button type="button" onClick={() => setP2(promptFeedback2Defaut)} className="text-xs text-stone-500 hover:text-stone-700 underline">
            Restaurer la version par défaut
          </button>
        </div>
        <p className="text-xs text-stone-400 mb-2">
          Variables : <code>{'{livre_entier}'}</code>, <code>{'{resume_initial_eleve}'}</code>, <code>{'{resume_vf_eleve}'}</code>, <code>{'{syntheses_precedentes}'}</code>, <code>{'{architectures_precedentes}'}</code>, <code>{'{semaine_courante_N}'}</code>, <code>{'{total_semaines}'}</code>.
          Sortie JSON <code>{'{ synthese_modele, nuances_et_erreurs, ajouts_a_verifier, architecture_amont, architecture_aval_jalons }'}</code>.
        </p>
        <p className="text-xs text-red-600 mb-2">
          ⚠️ Le <strong>livre entier</strong> est envoyé au modèle. Ton prompt DOIT garder la consigne de non-divulgation de l&apos;aval et la variable <code>{'{semaine_courante_N}'}</code>, sinon la suite du livre risque d&apos;être divulguée à l&apos;élève.
        </p>
        <textarea value={p2} onChange={e => setP2(e.target.value)} rows={22} className={TEXTAREA} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Capstone — carte d&apos;architecture finale</label>
          <button type="button" onClick={() => setPC(promptCapstoneDefaut)} className="text-xs text-stone-500 hover:text-stone-700 underline">
            Restaurer la version par défaut
          </button>
        </div>
        <p className="text-xs text-stone-400 mb-2">
          Variables : <code>{'{livre_entier}'}</code>, <code>{'{tous_les_devoilements}'}</code>, <code>{'{toutes_syntheses_eleve}'}</code>.
          Sortie JSON <code>{'{ fil_conducteur, noeuds:[{chapitre,idee}], liens:[{de,vers,relation}] }'}</code>. L&apos;élève a tout lu : tous les liens aval peuvent être révélés.
        </p>
        <textarea value={pC} onChange={e => setPC(e.target.value)} rows={20} className={TEXTAREA} />
      </div>

      <div className="border-t border-stone-200 pt-6 space-y-3">
        <h4 className="text-sm font-medium text-stone-700">Réglages</h4>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={evalQuestions} onChange={e => setEvalQuestions(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-medium">Évaluer la qualité des questions</span> — affiche au retour 1 une remarque sur la profondeur des questions de l&apos;élève (champ <code>remarque_questions</code>). <span className="text-stone-400">Désactivé par défaut.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-stone-700">
          <input type="checkbox" checked={deblocageSequentiel} onChange={e => setDeblocageSequentiel(e.target.checked)} className="mt-0.5" />
          <span>
            <span className="font-medium">Déblocage séquentiel des semaines</span> — la semaine N+1 ne s&apos;ouvre qu&apos;à la clôture (terminée) de la semaine N. <span className="text-stone-400">Désactivé par défaut (accès libre).</span>
          </span>
        </label>
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.texte}
        </div>
      )}

      <button onClick={handleSauvegarder} disabled={enregistrement}
        className="bg-stone-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors">
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les prompts'}
      </button>
    </div>
  )
}
