'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sauvegarderConfig, sauvegarderConfigOrale } from '../actions'
import { sauvegarderConfigEssai, sauvegarderSeuilPhoto } from '../essai-actions'

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
  seuilPhotoInitial: number
}

type SectionKey = 'bareme' | 'fragment' | 'oral' | 'essai' | 'synthese' | 'integrite'

const SECTIONS: { key: SectionKey; titre: string; sousTitre: string }[] = [
  { key: 'bareme', titre: 'Barème', sousTitre: 'Échelle des sections E–A' },
  { key: 'fragment', titre: 'Prompt Évaluation Fragment', sousTitre: 'Fragment hebdomadaire' },
  { key: 'oral', titre: 'Prompt Évaluation Oral', sousTitre: 'Présentation orale' },
  { key: 'essai', titre: 'Prompt Essai', sousTitre: 'Essai final + /20' },
  { key: 'synthese', titre: 'Prompt Synthèse', sousTitre: 'Bilan de fin de semestre' },
  { key: 'integrite', titre: 'Intégrité', sousTitre: 'Seuil anti-triche photo' },
]

function HintVariables({ vars }: { vars: string[] }) {
  return (
    <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3 text-sm text-attention">
      Variables disponibles :{' '}
      {vars.map(v => <code key={v} className="font-mono mr-1">{v}</code>)}
    </div>
  )
}

function EnTete({ label, onRestaurer }: { label: string; onRestaurer: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-encre-douce">{label}</label>
      <button type="button" onClick={onRestaurer} className="text-xs text-muet hover:text-encre-douce underline">
        Restaurer la version par défaut
      </button>
    </div>
  )
}

const TEXTAREA = 'w-full px-3 py-2 border border-bordure rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

export default function FormulaireParametres(props: Props) {
  const router = useRouter()
  const [prompt, setPrompt] = useState(props.promptInitial)
  const [bareme, setBareme] = useState(props.baremeInitial)
  const [rubrique, setRubrique] = useState(props.rubriqueInitial)
  const [promptOral, setPromptOral] = useState(props.promptOralInitial)
  const [supprimerAudio, setSupprimerAudio] = useState(props.supprimerAudioInitial)
  const [echelle, setEchelle] = useState(props.echelleInitiale)
  const [fourchette, setFourchette] = useState(props.fourchetteInitiale)
  const [promptEssai, setPromptEssai] = useState(props.promptEssaiInitial)
  const [promptSynthese, setPromptSynthese] = useState(props.promptSyntheseInitial)
  const [seuilPhoto, setSeuilPhoto] = useState(props.seuilPhotoInitial)
  const [section, setSection] = useState<SectionKey | null>(null)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const [r1, r2, r3, r4] = await Promise.all([
      sauvegarderConfig(prompt, bareme, rubrique),
      sauvegarderConfigOrale(promptOral, supprimerAudio),
      sauvegarderConfigEssai({
        echelle_lettres: echelle,
        fourchette_points: fourchette,
        prompt_evaluation_essai: promptEssai,
        prompt_synthese_semestre: promptSynthese,
      }),
      sauvegarderSeuilPhoto(seuilPhoto),
    ])
    setEnregistrement(false)
    if (r1.error || r2.error || r3.error || r4.error) {
      setMessage({ type: 'err', texte: r1.error ?? r2.error ?? r3.error ?? r4.error ?? 'Erreur' })
    } else {
      setMessage({ type: 'ok', texte: 'Paramètres enregistrés.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  return (
    <div className="space-y-5">
      {/* Tuiles : une seule section ouverte à la fois */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SECTIONS.map(s => {
          const active = section === s.key
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(active ? null : s.key)}
              className={`text-left rounded-xl px-4 py-3 transition-colors ${
                active
                  ? 'bg-pigment border border-pigment'
                  : 'bg-surface border border-bordure border-l-4 border-l-liseret hover:border-pigment hover:shadow-sm'
              }`}
            >
              <p className={`font-medium ${active ? 'text-surface' : 'text-encre'}`}>{s.titre}</p>
              <p className={`text-xs mt-0.5 ${active ? 'text-surface/75' : 'text-muet'}`}>{s.sousTitre}</p>
            </button>
          )
        })}
      </div>

      {/* Détail de la section choisie */}
      {section === 'bareme' && (
        <div className="bg-surface border border-bordure rounded-xl p-5 space-y-5">
          <div>
            <EnTete label="Rubrique partagée (échelle des sections E → A)" onRestaurer={() => setRubrique(props.rubriqueDefaut)} />
            <p className="text-xs text-muet mb-2">
              Source unique de l&apos;échelle des sections, importée par les 4 prompts via{' '}
              <code className="font-mono">{'{{rubrique}}'}</code>. Le /20 final (essai, synthèse) n&apos;y touche pas.
            </p>
            <textarea value={rubrique} onChange={e => setRubrique(e.target.value)} rows={8} className={TEXTAREA} />
          </div>
          <div>
            <EnTete label="Barème (0–4, legacy)" onRestaurer={() => setBareme(props.baremeDefaut)} />
            <textarea value={bareme} onChange={e => setBareme(e.target.value)} rows={6} className={TEXTAREA} />
          </div>
        </div>
      )}

      {section === 'fragment' && (
        <div className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
          <HintVariables vars={['{{theme}}', '{{description_theme}}', '{{numero_semaine}}', '{{historique}}', '{{bareme}}', '{{rubrique}}']} />
          <div>
            <EnTete label="Prompt d'évaluation du fragment" onRestaurer={() => setPrompt(props.promptDefaut)} />
            <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={30} className={TEXTAREA} />
          </div>
        </div>
      )}

      {section === 'oral' && (
        <div className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
          <HintVariables vars={['{{theme}}', '{{description_theme}}', '{{numero_semaine}}', '{{duree}}', '{{nb_mots}}', '{{debit}}', '{{transcription_orale}}', '{{dossier}}', '{{bareme}}']} />
          <div>
            <EnTete label="Prompt d'évaluation orale" onRestaurer={() => setPromptOral(props.promptOralDefaut)} />
            <textarea value={promptOral || props.promptOralDefaut} onChange={e => setPromptOral(e.target.value)} rows={20} className={TEXTAREA} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={supprimerAudio} onChange={e => setSupprimerAudio(e.target.checked)} className="rounded" />
            <span className="text-sm text-encre-douce">Supprimer automatiquement l&apos;audio à la publication (case pré-cochée par défaut)</span>
          </label>
        </div>
      )}

      {section === 'essai' && (
        <div className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
          <HintVariables vars={['{{question}}', '{{titre_epreuve}}', '{{duree}}', '{{consignes}}', '{{dossier}}', '{{echelle_lettres}}']} />
          <div>
            <EnTete label="Échelle de lettres (A–E)" onRestaurer={() => setEchelle(props.echelleDefaut)} />
            <textarea value={echelle || props.echelleDefaut} onChange={e => setEchelle(e.target.value)} rows={5} className={TEXTAREA} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-encre-douce whitespace-nowrap">Fourchette note /20 (± points)</label>
            <input
              type="number"
              value={fourchette}
              onChange={e => setFourchette(Number(e.target.value))}
              min={0} max={5} step={0.5}
              className="w-20 px-3 py-1.5 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment"
            />
            <span className="text-xs text-muet">Ex : 2 → fourchette de ±2 points autour de la note suggérée</span>
          </div>
          <div>
            <EnTete label="Prompt d'évaluation de l'essai" onRestaurer={() => setPromptEssai(props.promptEssaiDefaut)} />
            <textarea value={promptEssai || props.promptEssaiDefaut} onChange={e => setPromptEssai(e.target.value)} rows={25} className={TEXTAREA} />
          </div>
        </div>
      )}

      {section === 'synthese' && (
        <div className="bg-surface border border-bordure rounded-xl p-5 space-y-4">
          <HintVariables vars={['{{theme}}', '{{label_semestre}}', '{{date_debut}}', '{{date_fin}}', '{{taux_depot}}', '{{nb_retards}}', '{{dossier}}']} />
          <div>
            <EnTete label="Prompt de synthèse de semestre" onRestaurer={() => setPromptSynthese(props.promptSyntheseDefaut)} />
            <textarea value={promptSynthese || props.promptSyntheseDefaut} onChange={e => setPromptSynthese(e.target.value)} rows={20} className={TEXTAREA} />
          </div>
        </div>
      )}

      {section === 'integrite' && (
        <div className="bg-surface border border-bordure rounded-xl p-5 space-y-3">
          <div>
            <label className="text-sm font-medium text-encre-douce">Seuil « photo suspecte » (heures)</label>
            <p className="text-xs text-muet mt-1 mb-2">
              Une photo dont les métadonnées EXIF indiquent une prise de vue plus ancienne que ce seuil est
              signalée au professeur (sans bloquer le dépôt). Côté prof, le délai écoulé entre la prise et le
              dépôt s&apos;affiche sur l&apos;analyse. Défaut : 48 h (2 jours).
            </p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={seuilPhoto}
                onChange={e => setSeuilPhoto(Number(e.target.value))}
                min={1} max={720} step={1}
                className="w-24 px-3 py-1.5 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment"
              />
              <span className="text-xs text-muet">heures {seuilPhoto >= 48 ? `(≈ ${Math.round(seuilPhoto / 24)} jours)` : ''}</span>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          message.type === 'ok'
            ? 'bg-ok-teinte border border-ok text-ok'
            : 'bg-retard-teinte border border-retard text-retard'
        }`}>
          {message.texte}
        </div>
      )}

      <button
        onClick={handleSauvegarder}
        disabled={enregistrement}
        className="bg-bouton text-surface px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
      >
        {enregistrement ? 'Enregistrement…' : 'Enregistrer les paramètres'}
      </button>
    </div>
  )
}
