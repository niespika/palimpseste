'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderPromptsAletheia } from './actions'

interface Initial {
  prompt_feedback_1: string | null; prompt_feedback_2: string | null; prompt_capstone: string | null
  prompt_reference: string | null; prompt_diag_inventaire: string | null; prompt_diag_niveau: string | null
  eval_questions_actif: boolean; deblocage_sequentiel: boolean
}
interface Defauts {
  feedback1: string; feedback2: string; capstone: string
  reference: string; diagInventaire: string; diagNiveau: string
}

const TEXTAREA = 'w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900'

function BlocPrompt({ label, value, onChange, defaut, hint, rows = 18, warn }: {
  label: string; value: string; onChange: (v: string) => void; defaut: string; hint: React.ReactNode; rows?: number; warn?: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-stone-700">{label}</label>
        <button type="button" onClick={() => onChange(defaut)} className="text-xs text-stone-500 hover:text-stone-700 underline">Restaurer la version par défaut</button>
      </div>
      <p className="text-xs text-stone-400 mb-2">{hint}</p>
      {warn && <p className="text-xs text-red-600 mb-2">{warn}</p>}
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} className={TEXTAREA} />
    </div>
  )
}

export default function FormulaireParametresAletheia({ initial, defauts }: { initial: Initial; defauts: Defauts }) {
  const router = useRouter()
  const [p1, setP1] = useState(initial.prompt_feedback_1 || defauts.feedback1)
  const [p2, setP2] = useState(initial.prompt_feedback_2 || defauts.feedback2)
  const [pC, setPC] = useState(initial.prompt_capstone || defauts.capstone)
  const [pRef, setPRef] = useState(initial.prompt_reference || defauts.reference)
  const [pInv, setPInv] = useState(initial.prompt_diag_inventaire || defauts.diagInventaire)
  const [pNiv, setPNiv] = useState(initial.prompt_diag_niveau || defauts.diagNiveau)
  const [evalQuestions, setEvalQuestions] = useState(initial.eval_questions_actif)
  const [deblocageSequentiel, setDeblocageSequentiel] = useState(initial.deblocage_sequentiel)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderPromptsAletheia({
      promptFeedback1: p1, promptFeedback2: p2, promptCapstone: pC,
      promptReference: pRef, promptDiagInventaire: pInv, promptDiagNiveau: pNiv,
      evalQuestions, deblocageSequentiel,
    })
    setEnregistrement(false)
    if (res.error) setMessage({ type: 'err', texte: res.error })
    else {
      setMessage({ type: 'ok', texte: 'Prompts enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  const [groupe, setGroupe] = useState<'retours' | 'diagnostic' | 'reglages'>('retours')

  const TUILES = [
    { cle: 'retours' as const, nom: 'Retours & carte', desc: 'Retour V1, retour final, carte d’architecture' },
    { cle: 'diagnostic' as const, nom: 'Diagnostic', desc: 'Référence, inventaire, niveau E→A' },
    { cle: 'reglages' as const, nom: 'Réglages', desc: 'Questions, déblocage séquentiel' },
  ]

  return (
    <div className="space-y-8">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Prompts IA d&apos;Aletheia. Enregistrer un prompt identique au défaut revient à utiliser le défaut (et ses évolutions futures).
      </div>

      {/* Navigation par tuiles (les modifications non enregistrées sont conservées en changeant de tuile) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TUILES.map(t => (
          <button
            key={t.cle}
            type="button"
            onClick={() => setGroupe(t.cle)}
            className={`text-left bg-white border border-stone-200 border-l-4 rounded-xl px-4 py-3 transition-colors hover:border-stone-400 ${
              groupe === t.cle ? 'border-l-stone-800 ring-2 ring-stone-300' : 'border-l-stone-300'
            }`}
          >
            <p className="font-medium text-stone-900">{t.nom}</p>
            <p className="text-xs text-stone-400 mt-0.5">{t.desc}</p>
          </button>
        ))}
      </div>

      {groupe === 'retours' && (
        <div className="space-y-8">
          <h4 className="text-sm font-semibold text-stone-600 border-b border-stone-200 pb-1">Retours élève &amp; carte</h4>

          <BlocPrompt
            label="Retour V1 — socratique, par section (5 champs)" value={p1} onChange={setP1} defaut={defauts.feedback1} rows={20}
            hint={<>Variables : <code>{'{texte_unite}'}</code>, <code>{'{these_eleve}'}</code>, <code>{'{arguments_eleve}'}</code>, <code>{'{accord_eleve}'}</code>, <code>{'{questions_eleve}'}</code>, <code>{'{vocabulaire_eleve}'}</code>, <code>{'{syntheses_precedentes}'}</code>, <code>{'{trajectoire_diagnostic}'}</code> (calibration). Sortie JSON <code>{'{ relances, accord, reponses_questions, vocabulaire:[{terme,definition}], remarque_questions }'}</code>.</>}
          />

          <BlocPrompt
            label="Retour final (VF) — reconstruction + architecture (livre entier)" value={p2} onChange={setP2} defaut={defauts.feedback2} rows={22}
            warn={<>⚠️ Le <strong>livre entier</strong> est envoyé au modèle. Garde la consigne de non-divulgation de l&apos;aval et les variables <code>{'{semaine_courante_N}'}</code> et <code>{'{livre_entier}'}</code>.</>}
            hint={<>Variables : <code>{'{livre_entier}'}</code>, <code>{'{these_initiale}'}</code>, <code>{'{arguments_initiale}'}</code>, <code>{'{accord_initial}'}</code>, <code>{'{these_vf}'}</code>, <code>{'{arguments_vf}'}</code>, <code>{'{accord_vf}'}</code>, <code>{'{syntheses_precedentes}'}</code>, <code>{'{architectures_precedentes}'}</code>, <code>{'{trajectoire_diagnostic}'}</code>, <code>{'{semaine_courante_N}'}</code>, <code>{'{total_semaines}'}</code>. Sortie JSON <code>{'{ synthese_modele, ajouts_verifies, nuances_et_erreurs, architecture_amont, architecture_aval_jalons }'}</code>.</>}
          />

          <BlocPrompt
            label="Carte d'architecture (capstone) — canonique, par livre" value={pC} onChange={setPC} defaut={defauts.capstone} rows={18}
            hint={<>Variables : <code>{'{livre_entier}'}</code>, <code>{'{structure_semaines}'}</code>. Sortie JSON <code>{'{ fil_conducteur, noeuds:[{chapitre,idee}], liens:[{de,vers,relation}] }'}</code>. Carte partagée, tous les liens aval révélés.</>}
          />
        </div>
      )}

      {groupe === 'diagnostic' && (
        <div className="space-y-8">
          <h4 className="text-sm font-semibold text-stone-600 border-b border-stone-200 pb-1">Diagnostic (usage prof, jamais montré à l&apos;élève)</h4>

          <BlocPrompt
            label="Référence par chapitre — socle du diagnostic" value={pRef} onChange={setPRef} defaut={defauts.reference} rows={16}
            hint={<>Variables : <code>{'{livre_entier}'}</code>, <code>{'{structure_semaines}'}</code>. Sortie JSON <code>{'{ chapitres:[{semaine,titre,these_canonique,arguments_cles[]}] }'}</code>. Une entrée par semaine.</>}
          />

          <BlocPrompt
            label="Diagnostic — phase 1 : inventaire (ancré au texte)" value={pInv} onChange={setPInv} defaut={defauts.diagInventaire} rows={16}
            hint={<>Variables : <code>{'{texte_semaine}'}</code>, <code>{'{these}'}</code>, <code>{'{arguments}'}</code>. Sortie JSON <code>{'{ these_eleve, these_mal_definie, arguments_captes, arguments_rates, arguments_deformes, note }'}</code>. Aucun niveau ici (anti-halo).</>}
          />

          <BlocPrompt
            label="Diagnostic — phase 2 : niveau E→A (sans la prose)" value={pNiv} onChange={setPNiv} defaut={defauts.diagNiveau} rows={14}
            warn={<>⚠️ Anti-halo : cette phase ne reçoit PAS la prose de l&apos;élève, seulement <code>{'{inventaire}'}</code> + la référence. Garde la variable <code>{'{inventaire}'}</code>.</>}
            hint={<>Variables : <code>{'{ref_these}'}</code>, <code>{'{ref_arguments}'}</code>, <code>{'{inventaire}'}</code>. Sortie JSON <code>{'{ niveau_these, niveau_arguments, these_mal_definie }'}</code> (lettres E,D,C,B,A ou null).</>}
          />
        </div>
      )}

      {groupe === 'reglages' && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-stone-700">Réglages</h4>
          <label className="flex items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={evalQuestions} onChange={e => setEvalQuestions(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-medium">Évaluer la qualité des questions</span> — affiche au retour V1 une remarque sur la profondeur des questions de l&apos;élève (champ <code>remarque_questions</code>). <span className="text-stone-400">Désactivé par défaut.</span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={deblocageSequentiel} onChange={e => setDeblocageSequentiel(e.target.checked)} className="mt-0.5" />
            <span>
              <span className="font-medium">Déblocage séquentiel des semaines</span> — la semaine N+1 ne s&apos;ouvre qu&apos;à la clôture (terminée) de la semaine N. <span className="text-stone-400">Désactivé par défaut (accès libre).</span>
            </span>
          </label>
        </div>
      )}

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {message.texte}
        </div>
      )}

      <button onClick={handleSauvegarder} disabled={enregistrement}
        className="bg-stone-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors">
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </button>
    </div>
  )
}
