'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderConfig, sauvegarderConfigOrale } from '../actions'
import { sauvegarderConfigEssai } from '../essai-actions'

interface Props {
  promptInitial: string
  baremeInitial: string
  promptDefaut: string
  baremeDefaut: string
  rubriqueInitial: string
  rubriqueDefaut: string
  promptOralInitial: string
  promptOralDefaut: string
  supprimerAudioInitial: boolean
  echelleInitiale: string
  echelleDefaut: string
  fourchetteInitiale: number
  promptEssaiInitial: string
  promptEssaiDefaut: string
  promptSyntheseInitial: string
  promptSyntheseDefaut: string
}

export default function FormulaireParametres({
  promptInitial,
  baremeInitial,
  promptDefaut,
  baremeDefaut,
  rubriqueInitial,
  rubriqueDefaut,
  promptOralInitial,
  promptOralDefaut,
  supprimerAudioInitial,
  echelleInitiale,
  echelleDefaut,
  fourchetteInitiale,
  promptEssaiInitial,
  promptEssaiDefaut,
  promptSyntheseInitial,
  promptSyntheseDefaut,
}: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState(promptInitial)
  const [bareme, setBareme] = useState(baremeInitial)
  const [rubrique, setRubrique] = useState(rubriqueInitial)
  const [promptOral, setPromptOral] = useState(promptOralInitial)
  const [supprimerAudio, setSupprimerAudio] = useState(supprimerAudioInitial)
  const [echelle, setEchelle] = useState(echelleInitiale)
  const [fourchette, setFourchette] = useState(fourchetteInitiale)
  const [promptEssai, setPromptEssai] = useState(promptEssaiInitial)
  const [promptSynthese, setPromptSynthese] = useState(promptSyntheseInitial)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const [r1, r2, r3] = await Promise.all([
      sauvegarderConfig(prompt, bareme, rubrique),
      sauvegarderConfigOrale(promptOral, supprimerAudio),
      sauvegarderConfigEssai({
        echelle_lettres: echelle,
        fourchette_points: fourchette,
        prompt_evaluation_essai: promptEssai,
        prompt_synthese_semestre: promptSynthese,
      }),
    ])
    setEnregistrement(false)
    if (r1.error || r2.error || r3.error) {
      setMessage({ type: 'err', texte: r1.error ?? r2.error ?? r3.error ?? 'Erreur' })
    } else {
      setMessage({ type: 'ok', texte: 'Paramètres enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Fragments hebdomadaires ───────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Les variables disponibles dans le prompt sont :{' '}
        <code className="font-mono">{'{{theme}}'}</code>,{' '}
        <code className="font-mono">{'{{description_theme}}'}</code>,{' '}
        <code className="font-mono">{'{{numero_semaine}}'}</code>,{' '}
        <code className="font-mono">{'{{historique}}'}</code>,{' '}
        <code className="font-mono">{'{{bareme}}'}</code>,{' '}
        <code className="font-mono">{'{{rubrique}}'}</code>.
      </div>

      {/* Rubrique partagée : importée par les 4 prompts via {{rubrique}}. */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Rubrique partagée (échelle des sections E → A)</label>
          <button
            type="button"
            onClick={() => setRubrique(rubriqueDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <p className="text-xs text-stone-400 mb-2">
          Source unique de l&apos;échelle des sections, importée par les 4 prompts via{' '}
          <code className="font-mono">{'{{rubrique}}'}</code>. Le /20 final (essai, synthèse) n&apos;y touche pas.
        </p>
        <textarea
          value={rubrique}
          onChange={e => setRubrique(e.target.value)}
          rows={8}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Barème (0–4, legacy)</label>
          <button
            type="button"
            onClick={() => setBareme(baremeDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={bareme}
          onChange={e => setBareme(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt d'évaluation</label>
          <button
            type="button"
            onClick={() => setPrompt(promptDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          rows={30}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.type === 'ok'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.texte}
        </div>
      )}

      {/* ── Oral ─────────────────────────────────────────────────────── */}
      <hr className="border-stone-200" />
      <h3 className="text-sm font-medium text-stone-700">Évaluation orale</h3>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Variables disponibles :{' '}
        {['{{theme}}', '{{description_theme}}', '{{numero_semaine}}', '{{duree}}', '{{nb_mots}}', '{{debit}}', '{{transcription_orale}}', '{{dossier}}', '{{bareme}}'].map(v => (
          <code key={v} className="font-mono mr-1">{v}</code>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt d'évaluation orale</label>
          <button
            type="button"
            onClick={() => setPromptOral(promptOralDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={promptOral || promptOralDefaut}
          onChange={e => setPromptOral(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={supprimerAudio}
            onChange={e => setSupprimerAudio(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-stone-700">
            Supprimer automatiquement l'audio à la publication (case pré-cochée par défaut)
          </span>
        </label>
      </div>

      {/* ── Essai final ──────────────────────────────────────────────── */}
      <hr className="border-stone-200" />
      <h3 className="text-sm font-medium text-stone-700">Essai final</h3>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Variables disponibles :{' '}
        {['{{question}}', '{{titre_epreuve}}', '{{duree}}', '{{consignes}}', '{{dossier}}', '{{echelle_lettres}}'].map(v => (
          <code key={v} className="font-mono mr-1">{v}</code>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Échelle de lettres (A–E)</label>
          <button
            type="button"
            onClick={() => setEchelle(echelleDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={echelle || echelleDefaut}
          onChange={e => setEchelle(e.target.value)}
          rows={5}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-stone-700 whitespace-nowrap">
          Fourchette note /20 (± points)
        </label>
        <input
          type="number"
          value={fourchette}
          onChange={e => setFourchette(Number(e.target.value))}
          min={0}
          max={5}
          step={0.5}
          className="w-20 px-3 py-1.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <span className="text-xs text-stone-500">Ex : 2 → fourchette de ±2 points autour de la note suggérée</span>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt d'évaluation de l'essai</label>
          <button
            type="button"
            onClick={() => setPromptEssai(promptEssaiDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={promptEssai || promptEssaiDefaut}
          onChange={e => setPromptEssai(e.target.value)}
          rows={25}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      {/* ── Synthèse de semestre ─────────────────────────────────────── */}
      <hr className="border-stone-200" />
      <h3 className="text-sm font-medium text-stone-700">Synthèse de semestre</h3>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
        Variables disponibles :{' '}
        {['{{theme}}', '{{label_semestre}}', '{{date_debut}}', '{{date_fin}}', '{{taux_depot}}', '{{nb_retards}}', '{{dossier}}'].map(v => (
          <code key={v} className="font-mono mr-1">{v}</code>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-stone-700">Prompt de synthèse de semestre</label>
          <button
            type="button"
            onClick={() => setPromptSynthese(promptSyntheseDefaut)}
            className="text-xs text-stone-500 hover:text-stone-700 underline"
          >
            Restaurer la version par défaut
          </button>
        </div>
        <textarea
          value={promptSynthese || promptSyntheseDefaut}
          onChange={e => setPromptSynthese(e.target.value)}
          rows={20}
          className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
        />
      </div>

      <button
        onClick={handleSauvegarder}
        disabled={enregistrement}
        className="bg-stone-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
      >
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </button>
    </div>
  )
}
