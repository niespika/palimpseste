'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { getSignedUrlsProf } from '../../actions'
import {
  sauvegarderAnalyse,
  publierAnalyse,
  depublierAnalyse,
  relancerAnalyse,
  mettreAJourPiste,
  supprimerPiste,
  ajouterPiste,
} from '../../actions'
import type { FragmentAnalyse, FragmentPiste, FragmentPhoto, StatutPiste } from '@/types/fragments'

interface Props {
  depotId: string
  eleveId: string
  commentaireEleve: string | null
  photos: FragmentPhoto[]
  analyse: FragmentAnalyse | null
  pistes: FragmentPiste[]
}

const LABELS_STATUT: Record<string, { label: string; classes: string }> = {
  en_cours:  { label: 'Analyse en cours…', classes: 'bg-blue-100 text-blue-700' },
  generee:   { label: 'À valider', classes: 'bg-amber-100 text-amber-700' },
  erreur:    { label: 'Erreur', classes: 'bg-red-100 text-red-700' },
  publiee:   { label: 'Publiée ✓', classes: 'bg-green-100 text-green-700' },
}

function NoteInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-stone-700 w-28 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              value === n
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-stone-400">/4</span>
    </div>
  )
}

function ChampTexte({
  label,
  value,
  onChange,
  rows = 4,
  optional = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  optional?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700 mb-1">
        {label}
        {optional && <span className="text-stone-400 font-normal ml-1">(optionnel)</span>}
      </label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
      />
    </div>
  )
}

export default function EditorAnalyse({
  depotId,
  eleveId,
  commentaireEleve,
  photos,
  analyse: analyseInitiale,
  pistes: pistesInitiales,
}: Props) {
  const router = useRouter()
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [indexPhoto, setIndexPhoto] = useState(0)
  const [chargementPhotos, setChargementPhotos] = useState(true)
  const [transcriptionOuverte, setTranscriptionOuverte] = useState(false)

  const [analyse, setAnalyse] = useState(analyseInitiale)
  const [pistes, setPistes] = useState(pistesInitiales)

  // Champs éditables
  const [noteDecouvertes, setNoteDecouvertes] = useState(analyseInitiale?.note_decouvertes ?? 0)
  const [noteSources, setNoteSources] = useState(analyseInitiale?.note_sources ?? 0)
  const [noteReflexions, setNoteReflexions] = useState(analyseInitiale?.note_reflexions ?? 0)
  const [transcription, setTranscription] = useState(analyseInitiale?.transcription ?? '')
  const [retourProgres, setRetourProgres] = useState(analyseInitiale?.retour_progres ?? '')
  const [retourLangue, setRetourLangue] = useState(analyseInitiale?.retour_langue ?? '')
  const [retourStyle, setRetourStyle] = useState(analyseInitiale?.retour_style ?? '')
  const [retourContenu, setRetourContenu] = useState(analyseInitiale?.retour_contenu ?? '')
  const [commentaireGeneral, setCommentaireGeneral] = useState(analyseInitiale?.commentaire_general ?? '')
  const [notesProf, setNotesProf] = useState(analyseInitiale?.notes_prof ?? '')

  const [nouvellePiste, setNouvellePiste] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  // Rafraîchir si l'analyse est "en_cours"
  useEffect(() => {
    if (analyse?.statut !== 'en_cours') return
    const interval = setInterval(() => router.refresh(), 5000)
    return () => clearInterval(interval)
  }, [analyse?.statut, router])

  // Charger les URLs signées des photos
  useEffect(() => {
    async function charger() {
      const chemins = photos.map(p => p.storage_path)
      const nouvellesUrls = await getSignedUrlsProf(chemins)
      setUrls(nouvellesUrls)
      setChargementPhotos(false)
    }
    charger()
  }, [photos])

  // Resynchroniser les champs quand l'analyse change côté serveur (après refresh).
  // Motif assumé de synchro props→state ; un remount par `key` serait plus invasif.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setAnalyse(analyseInitiale)
    setPistes(pistesInitiales)
    if (analyseInitiale) {
      setNoteDecouvertes(analyseInitiale.note_decouvertes ?? 0)
      setNoteSources(analyseInitiale.note_sources ?? 0)
      setNoteReflexions(analyseInitiale.note_reflexions ?? 0)
      setTranscription(analyseInitiale.transcription ?? '')
      setRetourProgres(analyseInitiale.retour_progres ?? '')
      setRetourLangue(analyseInitiale.retour_langue ?? '')
      setRetourStyle(analyseInitiale.retour_style ?? '')
      setRetourContenu(analyseInitiale.retour_contenu ?? '')
      setCommentaireGeneral(analyseInitiale.commentaire_general ?? '')
      setNotesProf(analyseInitiale.notes_prof ?? '')
    }
  }, [analyseInitiale, pistesInitiales])
  /* eslint-enable react-hooks/set-state-in-effect */

  const photoActuelle = photos[indexPhoto]
  const urlActuelle = photoActuelle ? urls[photoActuelle.storage_path] : null

  async function handleSauvegarder() {
    if (!analyse) return
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderAnalyse(analyse.id, {
      note_decouvertes: noteDecouvertes,
      note_sources: noteSources,
      note_reflexions: noteReflexions,
      transcription,
      retour_progres: retourProgres,
      retour_langue: retourLangue,
      retour_style: retourStyle,
      retour_contenu: retourContenu,
      commentaire_general: commentaireGeneral,
      notes_prof: notesProf,
    })
    setEnregistrement(false)
    if (res.error) {
      setMessage({ type: 'err', texte: res.error })
    } else {
      setMessage({ type: 'ok', texte: 'Modifications enregistrées.' })
      setTimeout(() => setMessage(null), 3000)
      router.refresh()
    }
  }

  async function handlePublier() {
    if (!analyse) return
    setEnregistrement(true)
    // Sauvegarder d'abord, puis publier
    await sauvegarderAnalyse(analyse.id, {
      note_decouvertes: noteDecouvertes,
      note_sources: noteSources,
      note_reflexions: noteReflexions,
      transcription,
      retour_progres: retourProgres,
      retour_langue: retourLangue,
      retour_style: retourStyle,
      retour_contenu: retourContenu,
      commentaire_general: commentaireGeneral,
      notes_prof: notesProf,
    })
    const res = await publierAnalyse(analyse.id)
    setEnregistrement(false)
    if (res.error) {
      setMessage({ type: 'err', texte: res.error })
    } else {
      setMessage({ type: 'ok', texte: 'Retour publié — l\'élève y a maintenant accès.' })
      router.refresh()
    }
  }

  async function handleDepublier() {
    if (!analyse) return
    setEnregistrement(true)
    const res = await depublierAnalyse(analyse.id)
    setEnregistrement(false)
    if (!res.error) router.refresh()
  }

  async function handleRelancer() {
    setEnregistrement(true)
    setMessage(null)
    const res = await relancerAnalyse(depotId, eleveId)
    setEnregistrement(false)
    if (res.error) {
      setMessage({ type: 'err', texte: res.error })
    } else {
      setMessage({ type: 'ok', texte: 'Analyse relancée — la page se mettra à jour automatiquement.' })
      router.refresh()
    }
  }

  async function handleSupprimerPiste(pisteId: string) {
    await supprimerPiste(pisteId)
    setPistes(prev => prev.filter(p => p.id !== pisteId))
  }

  async function handleChangerStatutPiste(pisteId: string, statut: StatutPiste) {
    await mettreAJourPiste(pisteId, statut)
    setPistes(prev => prev.map(p => p.id === pisteId ? { ...p, statut } : p))
  }

  async function handleAjouterPiste() {
    if (!analyse || !nouvellePiste.trim()) return
    const res = await ajouterPiste(analyse.id, eleveId, nouvellePiste.trim())
    if (!res.error) {
      setNouvellePiste('')
      router.refresh()
    }
  }

  const statutInfo = analyse ? LABELS_STATUT[analyse.statut] : null

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* ===== Colonne gauche : photos ===== */}
      <div className="lg:w-[45%] flex-shrink-0">
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden sticky top-4">
          {/* Visionneuse photo */}
          <div className="bg-stone-900 relative" style={{ minHeight: 300 }}>
            {chargementPhotos ? (
              <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
                Chargement des photos…
              </div>
            ) : urlActuelle ? (
              <TransformWrapper key={urlActuelle}>
                <TransformComponent
                  wrapperStyle={{ width: '100%', maxHeight: 480 }}
                  contentStyle={{ width: '100%' }}
                >
                  <img
                    src={urlActuelle}
                    alt={`Photo ${indexPhoto + 1}`}
                    className="w-full object-contain max-h-[480px]"
                  />
                </TransformComponent>
              </TransformWrapper>
            ) : (
              <div className="flex items-center justify-center h-64 text-stone-400 text-sm">
                Photo introuvable
              </div>
            )}
          </div>

          {/* Navigation photos */}
          {photos.length > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-stone-100 bg-stone-50">
              <button
                onClick={() => setIndexPhoto(i => Math.max(0, i - 1))}
                disabled={indexPhoto === 0}
                className="text-sm text-stone-500 hover:text-stone-800 disabled:opacity-30 px-2 py-1"
              >
                ← Précédente
              </button>
              <span className="text-xs text-stone-500">
                {indexPhoto + 1} / {photos.length}
              </span>
              <button
                onClick={() => setIndexPhoto(i => Math.min(photos.length - 1, i + 1))}
                disabled={indexPhoto === photos.length - 1}
                className="text-sm text-stone-500 hover:text-stone-800 disabled:opacity-30 px-2 py-1"
              >
                Suivante →
              </button>
            </div>
          )}

          {/* Miniatures */}
          {photos.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => setIndexPhoto(i)}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === indexPhoto ? 'border-stone-800' : 'border-transparent hover:border-stone-400'
                  }`}
                >
                  {urls[photo.storage_path] && (
                    <img
                      src={urls[photo.storage_path]}
                      alt={`Miniature ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Commentaire élève */}
          {commentaireEleve && (
            <div className="px-4 py-3 border-t border-stone-100">
              <p className="text-xs text-stone-500 mb-0.5">Commentaire de l'élève</p>
              <p className="text-sm text-stone-700 italic">"{commentaireEleve}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== Colonne droite : analyse ===== */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Statut + coût */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {statutInfo && (
            <span className={`text-sm px-3 py-1 rounded-full font-medium ${statutInfo.classes}`}>
              {statutInfo.label}
            </span>
          )}
          {analyse?.cout_api && (
            <span className="text-xs text-stone-400">
              Coût : ~${analyse.cout_api.toFixed(4)}
            </span>
          )}
        </div>

        {/* Pas encore d'analyse */}
        {!analyse && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-6 text-center">
            <p className="text-stone-500 text-sm mb-4">
              Aucune analyse pour ce dépôt.
            </p>
            <button
              onClick={handleRelancer}
              disabled={enregistrement}
              className="text-sm bg-stone-800 text-white px-4 py-2 rounded-lg hover:bg-stone-700 disabled:opacity-50"
            >
              Lancer l'analyse
            </button>
          </div>
        )}

        {/* Analyse en cours */}
        {analyse?.statut === 'en_cours' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <p className="text-blue-700 text-sm">
              L'analyse est en cours… Cette page se rafraîchit automatiquement.
            </p>
          </div>
        )}

        {/* Erreur */}
        {analyse?.statut === 'erreur' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 text-sm mb-3">
              L'analyse a échoué. Tu peux la relancer ci-dessous.
            </p>
            <button
              onClick={handleRelancer}
              disabled={enregistrement}
              className="text-sm bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              Relancer l'analyse
            </button>
          </div>
        )}

        {/* Analyse disponible */}
        {analyse && (analyse.statut === 'generee' || analyse.statut === 'publiee') && (
          <>
            {/* Transcription (repliée par défaut) */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setTranscriptionOuverte(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <span>Transcription du manuscrit</span>
                <span className="text-stone-400">{transcriptionOuverte ? '▲' : '▼'}</span>
              </button>
              {transcriptionOuverte && (
                <div className="px-4 pb-4">
                  <textarea
                    value={transcription}
                    onChange={e => setTranscription(e.target.value)}
                    rows={12}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-stone-700 mb-2">Notes (0–4)</p>
              <NoteInput label="Découvertes" value={noteDecouvertes} onChange={setNoteDecouvertes} />
              <NoteInput label="Sources" value={noteSources} onChange={setNoteSources} />
              <NoteInput label="Réflexions" value={noteReflexions} onChange={setNoteReflexions} />
            </div>

            {/* Retours */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
              <p className="text-sm font-medium text-stone-700">Retour pédagogique</p>
              <ChampTexte label="Progrès" value={retourProgres} onChange={setRetourProgres} optional />
              <ChampTexte label="Langue" value={retourLangue} onChange={setRetourLangue} rows={4} />
              <ChampTexte label="Style" value={retourStyle} onChange={setRetourStyle} rows={4} />
              <ChampTexte label="Contenu" value={retourContenu} onChange={setRetourContenu} rows={4} />
              <ChampTexte label="Commentaire général" value={commentaireGeneral} onChange={setCommentaireGeneral} rows={4} />
              <ChampTexte label="Note personnelle du prof" value={notesProf} onChange={setNotesProf} optional rows={2} />
            </div>

            {/* Pistes */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-stone-700">Pistes proposées</p>

              {pistes.length === 0 && (
                <p className="text-sm text-stone-400 italic">Aucune piste pour cette analyse.</p>
              )}

              {pistes.map(piste => (
                <div
                  key={piste.id}
                  className="flex items-start gap-3 bg-stone-50 rounded-xl p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {piste.est_rappel && (
                        <span className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                          Rappel
                        </span>
                      )}
                      <select
                        value={piste.statut}
                        onChange={e => handleChangerStatutPiste(piste.id, e.target.value as StatutPiste)}
                        className="text-xs border border-stone-200 rounded-lg px-2 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 text-stone-900"
                      >
                        <option value="proposee">Proposée</option>
                        <option value="suivie">Suivie ✓</option>
                        <option value="partiellement_suivie">Part. suivie</option>
                        <option value="abandonnee">Abandonnée</option>
                      </select>
                    </div>
                    <p className="text-sm text-stone-700">{piste.contenu}</p>
                  </div>
                  <button
                    onClick={() => handleSupprimerPiste(piste.id)}
                    className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                    title="Supprimer cette piste"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Ajouter une piste */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={nouvellePiste}
                  onChange={e => setNouvellePiste(e.target.value)}
                  placeholder="Ajouter une piste…"
                  className="flex-1 px-3 py-2 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-stone-900"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAjouterPiste() } }}
                />
                <button
                  onClick={handleAjouterPiste}
                  disabled={!nouvellePiste.trim()}
                  className="text-sm px-3 py-2 bg-stone-800 text-white rounded-xl hover:bg-stone-700 disabled:opacity-40"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* Messages */}
            {message && (
              <div className={`rounded-xl px-4 py-3 text-sm ${
                message.type === 'ok'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                {message.texte}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 flex-wrap pb-8">
              <button
                onClick={handleSauvegarder}
                disabled={enregistrement}
                className="px-4 py-2.5 border border-stone-300 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
              >
                {enregistrement ? 'Enregistrement…' : 'Enregistrer les modifications'}
              </button>

              {analyse.statut === 'publiee' ? (
                <button
                  onClick={handleDepublier}
                  disabled={enregistrement}
                  className="px-4 py-2.5 border border-orange-300 rounded-xl text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-50 transition-colors"
                >
                  Dépublier
                </button>
              ) : (
                <button
                  onClick={handlePublier}
                  disabled={enregistrement}
                  className="px-4 py-2.5 bg-stone-800 text-white rounded-xl text-sm font-medium hover:bg-stone-700 disabled:opacity-50 transition-colors"
                >
                  {enregistrement ? 'Publication…' : 'Publier le retour →'}
                </button>
              )}

              <button
                onClick={handleRelancer}
                disabled={enregistrement}
                className="px-4 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors"
              >
                Relancer l'analyse
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
