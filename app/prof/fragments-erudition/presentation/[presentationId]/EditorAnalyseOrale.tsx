'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  sauvegarderAnalyseOrale,
  publierAnalyseOrale,
  depublierAnalyseOrale,
  relancerTranscription,
  relancerAnalyseOrale,
  getSignedUrlAudio,
} from '../../actions'
import type { FragmentOral, FragmentAnalyseOrale } from '@/types/fragments'

interface Props {
  oral: FragmentOral
  analyseOrale: FragmentAnalyseOrale | null
  presentationId: string
  supprimerAudioParDefaut: boolean
}

const STATUT_LABELS: Record<string, { label: string; classe: string }> = {
  enregistre: { label: 'En cours de transcription…', classe: 'bg-blue-100 text-blue-700' },
  transcrit:  { label: 'Analyse en cours…',           classe: 'bg-blue-100 text-blue-700' },
  analyse:    { label: 'À valider',                    classe: 'bg-amber-100 text-amber-700' },
  erreur:     { label: 'Erreur',                       classe: 'bg-red-100 text-red-700' },
  publie:     { label: 'Publiée ✓',                    classe: 'bg-green-100 text-green-700' },
}

function NoteButtons({ valeur, onChange }: { valeur: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
            valeur === n
              ? 'bg-stone-800 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

export default function EditorAnalyseOrale({ oral, analyseOrale, presentationId, supprimerAudioParDefaut }: Props) {
  const router = useRouter()
  const estEnCours = oral.statut === 'enregistre' || oral.statut === 'transcrit'
  const peutEditer = oral.statut === 'analyse' || oral.statut === 'publie'

  const [integration, setIntegration] = useState(analyseOrale?.retour_integration ?? '')
  const [pistes, setPistes] = useState(analyseOrale?.retour_pistes ?? '')
  const [completude, setCompletude] = useState(analyseOrale?.retour_completude ?? '')
  const [oralRetour, setOralRetour] = useState(analyseOrale?.retour_oral ?? '')
  const [commentaire, setCommentaire] = useState(analyseOrale?.commentaire_general ?? '')
  const [noteContenu, setNoteContenu] = useState(analyseOrale?.note_contenu ?? 0)
  const [noteStructure, setNoteStructure] = useState(analyseOrale?.note_structure ?? 0)
  const [noteExpression, setNoteExpression] = useState(analyseOrale?.note_expression ?? 0)
  const [notesProf, setNotesProf] = useState(analyseOrale?.notes_prof ?? '')
  const [supprimerAudio, setSupprimerAudio] = useState(supprimerAudioParDefaut && !oral.audio_supprime)
  const [transcriptionOuverte, setTranscriptionOuverte] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  // Auto-refresh si en cours
  useEffect(() => {
    if (!estEnCours) return
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [estEnCours, router])

  // Charger l'URL audio signée
  const chargerAudio = useCallback(async () => {
    if (!oral.storage_path || oral.audio_supprime) return
    const url = await getSignedUrlAudio(oral.storage_path)
    setAudioUrl(url)
  }, [oral.storage_path, oral.audio_supprime])

  useEffect(() => { chargerAudio() }, [chargerAudio])

  async function handleSauvegarder() {
    if (!analyseOrale) return
    setChargement(true)
    const res = await sauvegarderAnalyseOrale(analyseOrale.id, {
      retour_integration: integration,
      retour_pistes: pistes,
      retour_completude: completude,
      retour_oral: oralRetour,
      commentaire_general: commentaire,
      note_contenu: noteContenu,
      note_structure: noteStructure,
      note_expression: noteExpression,
      notes_prof: notesProf,
    })
    setChargement(false)
    if ('error' in res && res.error) setMessage({ type: 'err', texte: res.error as string })
    else { setMessage({ type: 'ok', texte: 'Enregistré.' }); setTimeout(() => setMessage(null), 2500) }
  }

  async function handlePublier() {
    if (!analyseOrale) return
    setChargement(true)
    await handleSauvegarder()
    const res = await publierAnalyseOrale(analyseOrale.id, oral.id, presentationId, supprimerAudio)
    setChargement(false)
    if ('error' in res && res.error) setMessage({ type: 'err', texte: 'Erreur publication' })
    else router.refresh()
  }

  async function handleDepublier() {
    if (!analyseOrale) return
    setChargement(true)
    const res = await depublierAnalyseOrale(analyseOrale.id, oral.id)
    setChargement(false)
    if ('error' in res && res.error) setMessage({ type: 'err', texte: 'Erreur dépublication' })
    else router.refresh()
  }

  async function handleRelancerTranscription() {
    setChargement(true)
    await relancerTranscription(oral.id)
    setChargement(false)
    router.refresh()
  }

  async function handleRelancerAnalyse() {
    setChargement(true)
    await relancerAnalyseOrale(oral.id)
    setChargement(false)
    router.refresh()
  }

  const { label: statutLabel, classe: statutClasse } = STATUT_LABELS[oral.statut] ?? { label: oral.statut, classe: 'bg-stone-100 text-stone-600' }

  return (
    <div className="space-y-4">
      {/* Statut */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutClasse}`}>
          {statutLabel}
        </span>
        {oral.statut === 'erreur' && (
          <div className="flex gap-2">
            <button onClick={handleRelancerTranscription} disabled={chargement} className="text-xs text-stone-600 hover:text-stone-900 underline">
              Relancer la transcription
            </button>
            {oral.transcription && !oral.transcription.startsWith('ERREUR transcription') && (
              <button onClick={handleRelancerAnalyse} disabled={chargement} className="text-xs text-stone-600 hover:text-stone-900 underline">
                Relancer l'analyse
              </button>
            )}
          </div>
        )}
      </div>

      {/* En cours : spinner */}
      {estEnCours && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-500">
            {oral.statut === 'enregistre' ? 'Transcription en cours via Groq Whisper…' : 'Analyse IA en cours via Claude…'}
          </p>
          <p className="text-xs text-stone-400">La page se rafraîchit automatiquement.</p>
        </div>
      )}

      {/* Statistiques de l'oral */}
      {oral.nb_mots && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
            <p className="text-lg font-serif text-stone-800">
              {oral.duree_secondes ? `${Math.floor(oral.duree_secondes / 60)}:${String(oral.duree_secondes % 60).padStart(2, '0')}` : '—'}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">Durée</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
            <p className="text-lg font-serif text-stone-800">{oral.nb_mots ?? '—'}</p>
            <p className="text-xs text-stone-500 mt-0.5">Mots</p>
          </div>
          <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
            <p className={`text-lg font-serif ${
              (oral.debit_mots_minute ?? 0) < 120 ? 'text-orange-600' :
              (oral.debit_mots_minute ?? 0) > 160 ? 'text-orange-600' : 'text-green-700'
            }`}>
              {oral.debit_mots_minute ?? '—'}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">mots/min</p>
            <p className="text-xs text-stone-400">repère : 120–160</p>
          </div>
        </div>
      )}

      {/* Audio player */}
      {!oral.audio_supprime && audioUrl && (
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-2">Écouter l'enregistrement</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}
      {oral.audio_supprime && (
        <p className="text-xs text-stone-400 italic px-1">Audio supprimé après publication.</p>
      )}

      {/* Transcription */}
      {oral.transcription && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setTranscriptionOuverte(o => !o)}
            className="w-full px-4 py-3 text-left text-sm font-medium text-stone-700 flex items-center justify-between hover:bg-stone-50"
          >
            <span>Transcription</span>
            <span className="text-stone-400">{transcriptionOuverte ? '▲' : '▼'}</span>
          </button>
          {transcriptionOuverte && (
            <div className="px-4 pb-4 text-sm text-stone-700 leading-relaxed whitespace-pre-wrap border-t border-stone-100 pt-3">
              {oral.transcription.startsWith('ERREUR') ? (
                <p className="text-red-600">{oral.transcription}</p>
              ) : oral.transcription}
            </div>
          )}
        </div>
      )}

      {/* Analyse éditable */}
      {peutEditer && analyseOrale && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
          {/* Notes */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Contenu', val: noteContenu, set: setNoteContenu },
              { label: 'Structure', val: noteStructure, set: setNoteStructure },
              { label: 'Expression', val: noteExpression, set: setNoteExpression },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <p className="text-xs text-stone-500 mb-1.5">{label}</p>
                <NoteButtons valeur={val} onChange={set} />
              </div>
            ))}
          </div>

          {/* Sections */}
          {[
            { label: 'Commentaire général', val: commentaire, set: setCommentaire },
            { label: 'Intégration des retours', val: integration, set: setIntegration },
            { label: 'Pistes mobilisées', val: pistes, set: setPistes },
            { label: 'Complétude', val: completude, set: setCompletude },
            { label: 'Qualités orales', val: oralRetour, set: setOralRetour },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
              <textarea
                value={val}
                onChange={e => set(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Note personnelle (non visible par l'élève)</label>
            <textarea
              value={notesProf}
              onChange={e => setNotesProf(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
              placeholder="Usage privé"
            />
          </div>

          {message && (
            <div className={`rounded-lg px-3 py-2 text-sm ${
              message.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.texte}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleSauvegarder}
              disabled={chargement}
              className="bg-stone-200 text-stone-800 px-4 py-2 rounded-lg text-sm hover:bg-stone-300 disabled:opacity-50 transition-colors"
            >
              {chargement ? '…' : 'Enregistrer'}
            </button>

            {oral.statut === 'analyse' && (
              <div className="flex items-center gap-3">
                {!oral.audio_supprime && (
                  <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={supprimerAudio}
                      onChange={e => setSupprimerAudio(e.target.checked)}
                      className="rounded"
                    />
                    Supprimer l'audio à la publication
                  </label>
                )}
                <button
                  onClick={handlePublier}
                  disabled={chargement}
                  className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
                >
                  Publier
                </button>
              </div>
            )}

            {oral.statut === 'publie' && (
              <button
                onClick={handleDepublier}
                disabled={chargement}
                className="text-sm text-stone-500 hover:text-stone-700 underline"
              >
                Dépublier
              </button>
            )}

            <button
              onClick={handleRelancerAnalyse}
              disabled={chargement}
              className="text-xs text-stone-400 hover:text-stone-600 underline"
            >
              Relancer l'analyse
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
