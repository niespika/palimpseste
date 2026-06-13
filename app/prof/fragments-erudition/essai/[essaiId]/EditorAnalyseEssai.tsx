'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  sauvegarderAnalyseEssai,
  validerNoteEssai,
  publierAnalyseEssai,
  depublierAnalyseEssai,
  relancerAnalyseEssai,
  getSignedUrlsEssaiPhotos,
} from '../../essai-actions'
import type { EssaiAnalyse } from '@/types/fragments'

interface Props {
  essaiId: string
  photos: { id: string; storage_path: string; ordre: number }[]
  analyse: EssaiAnalyse | null
  fourchettePoints: number
}

const LETTRES = ['A', 'B', 'C', 'D', 'E'] as const
type Lettre = typeof LETTRES[number]

const STATUT_LABELS: Record<string, { label: string; classe: string }> = {
  en_cours: { label: 'Analyse en cours…', classe: 'bg-blue-100 text-blue-700' },
  generee: { label: 'À valider', classe: 'bg-amber-100 text-amber-700' },
  erreur: { label: 'Erreur', classe: 'bg-red-100 text-red-700' },
  publiee: { label: 'Publiée ✓', classe: 'bg-green-100 text-green-700' },
}

const COULEUR_LETTRE: Record<string, string> = {
  A: 'bg-green-100 text-green-800 border-green-300',
  B: 'bg-blue-100 text-blue-800 border-blue-300',
  C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  D: 'bg-orange-100 text-orange-800 border-orange-300',
  E: 'bg-red-100 text-red-800 border-red-300',
}

function LettreButtons({ valeur, onChange }: { valeur: Lettre | ''; onChange: (l: Lettre) => void }) {
  return (
    <div className="flex gap-1">
      {LETTRES.map(l => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`w-8 h-8 rounded text-sm font-medium border transition-colors ${
            valeur === l
              ? COULEUR_LETTRE[l] + ' border'
              : 'bg-stone-100 text-stone-600 border-transparent hover:bg-stone-200'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

export default function EditorAnalyseEssai({ essaiId, photos, analyse, fourchettePoints }: Props) {
  const router = useRouter()
  const estEnCours = analyse?.statut === 'en_cours'
  const peutEditer = analyse?.statut === 'generee' || analyse?.statut === 'publiee'

  const [transcription, setTranscription] = useState(analyse?.transcription ?? '')
  const [lettreStructure, setLettreStructure] = useState<Lettre | ''>((analyse?.lettre_structure as Lettre) ?? '')
  const [lettreExpression, setLettreExpression] = useState<Lettre | ''>((analyse?.lettre_expression as Lettre) ?? '')
  const [lettreArgumentation, setLettreArgumentation] = useState<Lettre | ''>((analyse?.lettre_argumentation as Lettre) ?? '')
  const [lettreConnaissances, setLettreConnaissances] = useState<Lettre | ''>((analyse?.lettre_connaissances as Lettre) ?? '')
  const [retourStructure, setRetourStructure] = useState(analyse?.retour_structure ?? '')
  const [retourExpression, setRetourExpression] = useState(analyse?.retour_expression ?? '')
  const [retourArgumentation, setRetourArgumentation] = useState(analyse?.retour_argumentation ?? '')
  const [retourConnaissances, setRetourConnaissances] = useState(analyse?.retour_connaissances ?? '')
  const [retourParcours, setRetourParcours] = useState(analyse?.retour_parcours ?? '')
  const [synthese, setSynthese] = useState(analyse?.synthese ?? '')
  const [notesProf, setNotesProf] = useState(analyse?.notes_prof ?? '')
  const [note20, setNote20] = useState<number | ''>(analyse?.note20_validee ?? '')
  const [noteVisible, setNoteVisible] = useState(analyse?.note_visible_eleve ?? false)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [photoAgrandie, setPhotoAgrandie] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)
  const [noteHorsFourchette, setNoteHorsFourchette] = useState(false)

  useEffect(() => {
    if (!estEnCours) return
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [estEnCours, router])

  const chargerPhotos = useCallback(async () => {
    if (!photos.length) return
    const paths = photos.map(p => p.storage_path)
    const urls = await getSignedUrlsEssaiPhotos(paths)
    setPhotoUrls(urls)
  }, [photos])

  useEffect(() => { chargerPhotos() }, [chargerPhotos])

  async function handleSauvegarder() {
    if (!analyse) return
    setChargement(true)
    const res = await sauvegarderAnalyseEssai(analyse.id, {
      transcription,
      lettre_structure: lettreStructure,
      lettre_expression: lettreExpression,
      lettre_argumentation: lettreArgumentation,
      lettre_connaissances: lettreConnaissances,
      retour_structure: retourStructure,
      retour_expression: retourExpression,
      retour_argumentation: retourArgumentation,
      retour_connaissances: retourConnaissances,
      retour_parcours: retourParcours,
      synthese,
      notes_prof: notesProf,
    })
    setChargement(false)
    if ('error' in res && res.error) setMessage({ type: 'err', texte: res.error as string })
    else { setMessage({ type: 'ok', texte: 'Enregistré.' }); setTimeout(() => setMessage(null), 2500) }
  }

  async function handleValiderNote() {
    if (!analyse) return
    const n = note20 === '' ? null : Number(note20)
    if (n !== null && analyse.note20_min !== null && analyse.note20_max !== null) {
      if (n < analyse.note20_min || n > analyse.note20_max) {
        if (!noteHorsFourchette) {
          setNoteHorsFourchette(true)
          setMessage({ type: 'err', texte: `Note hors fourchette (${analyse.note20_min}–${analyse.note20_max}). Cliquez à nouveau pour confirmer.` })
          return
        }
      }
    }
    setNoteHorsFourchette(false)
    setChargement(true)
    await validerNoteEssai(analyse.id, n, noteVisible)
    setChargement(false)
    setMessage({ type: 'ok', texte: 'Note enregistrée.' })
    setTimeout(() => setMessage(null), 2500)
  }

  async function handlePublier() {
    if (!analyse) return
    setChargement(true)
    await handleSauvegarder()
    await validerNoteEssai(analyse.id, note20 === '' ? null : Number(note20), noteVisible)
    const res = await publierAnalyseEssai(analyse.id)
    setChargement(false)
    if ('error' in res && res.error) setMessage({ type: 'err', texte: 'Erreur publication' })
    else router.refresh()
  }

  async function handleDepublier() {
    if (!analyse) return
    setChargement(true)
    const res = await depublierAnalyseEssai(analyse.id)
    setChargement(false)
    if ('error' in res && res.error) setMessage({ type: 'err', texte: 'Erreur dépublication' })
    else router.refresh()
  }

  async function handleRelancer() {
    setChargement(true)
    await relancerAnalyseEssai(essaiId)
    setChargement(false)
    router.refresh()
  }

  const { label: statutLabel, classe: statutClasse } = analyse
    ? (STATUT_LABELS[analyse.statut] ?? { label: analyse.statut, classe: 'bg-stone-100 text-stone-600' })
    : { label: 'Pas encore analysé', classe: 'bg-stone-100 text-stone-500' }

  return (
    <div className="space-y-6">
      {/* Statut */}
      <div className="flex items-center gap-3 flex-wrap">
        {analyse && (
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statutClasse}`}>
            {statutLabel}
          </span>
        )}
        {analyse?.statut === 'erreur' && (
          <button onClick={handleRelancer} disabled={chargement} className="text-xs text-stone-600 hover:text-stone-900 underline">
            Relancer l'analyse
          </button>
        )}
        {!analyse && (
          <p className="text-sm text-stone-500">Les photos ont été déposées. L'analyse va démarrer automatiquement.</p>
        )}
      </div>

      {/* Spinner */}
      {estEnCours && (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-500">Analyse IA en cours (transcription + évaluation)…</p>
          <p className="text-xs text-stone-400">La page se rafraîchit automatiquement.</p>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-3">Photos de l'essai ({photos.length})</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => setPhotoAgrandie(photoUrls[photo.storage_path] ?? null)}
                className="relative aspect-[3/4] rounded-lg overflow-hidden border border-stone-200 hover:border-stone-400 transition-colors"
              >
                {photoUrls[photo.storage_path] ? (
                  <img src={photoUrls[photo.storage_path]} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-stone-100 flex items-center justify-center">
                    <span className="text-xs text-stone-400">{i + 1}</span>
                  </div>
                )}
                <span className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1 rounded">{i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {photoAgrandie && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPhotoAgrandie(null)}
        >
          <img src={photoAgrandie} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
          <button
            onClick={() => setPhotoAgrandie(null)}
            className="absolute top-4 right-4 text-white text-2xl hover:text-stone-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Note suggérée */}
      {peutEditer && analyse && analyse.note20_suggeree !== null && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-1">Note suggérée par l'IA</p>
          <p className="text-2xl font-serif text-stone-800">
            {analyse.note20_suggeree}/20
            <span className="text-sm text-stone-400 ml-2">fourchette {analyse.note20_min}–{analyse.note20_max}</span>
          </p>
          {analyse.note20_justification && (
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">{analyse.note20_justification}</p>
          )}
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Note validée</label>
              <input
                type="number"
                value={note20}
                onChange={e => { setNote20(e.target.value === '' ? '' : Number(e.target.value)); setNoteHorsFourchette(false) }}
                min={0}
                max={20}
                step={0.5}
                className="w-24 px-2 py-1.5 border border-stone-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ex: 13"
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-stone-600 cursor-pointer">
              <input
                type="checkbox"
                checked={noteVisible}
                onChange={e => setNoteVisible(e.target.checked)}
                className="rounded"
              />
              Montrer la note à l'élève
            </label>
            <button
              onClick={handleValiderNote}
              disabled={chargement}
              className="bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg text-sm hover:bg-stone-300 disabled:opacity-50"
            >
              Valider la note
            </button>
          </div>
        </div>
      )}

      {/* Éditeur */}
      {peutEditer && analyse && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-5">
          {/* Lettres */}
          <div>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Évaluation par lettres</p>
            <div className="grid grid-cols-2 gap-4">
              {([
                { label: 'Structure', val: lettreStructure, set: setLettreStructure },
                { label: 'Expression', val: lettreExpression, set: setLettreExpression },
                { label: 'Argumentation', val: lettreArgumentation, set: setLettreArgumentation },
                { label: 'Connaissances', val: lettreConnaissances, set: setLettreConnaissances },
              ] as const).map(({ label, val, set }) => (
                <div key={label}>
                  <p className="text-xs text-stone-500 mb-1.5">{label}</p>
                  <LettreButtons valeur={val} onChange={set as (l: Lettre) => void} />
                </div>
              ))}
            </div>
          </div>

          {/* Retours par dimension */}
          {([
            { label: 'Retour — Structure', val: retourStructure, set: setRetourStructure },
            { label: 'Retour — Expression', val: retourExpression, set: setRetourExpression },
            { label: 'Retour — Argumentation', val: retourArgumentation, set: setRetourArgumentation },
            { label: 'Retour — Connaissances', val: retourConnaissances, set: setRetourConnaissances },
            { label: 'Ton parcours', val: retourParcours, set: setRetourParcours },
            { label: 'Synthèse', val: synthese, set: setSynthese },
          ] as const).map(({ label, val, set }) => (
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

          {/* Transcription */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Transcription</label>
            <textarea
              value={transcription}
              onChange={e => setTranscription(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
            />
          </div>

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

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={handleSauvegarder}
              disabled={chargement}
              className="bg-stone-200 text-stone-800 px-4 py-2 rounded-lg text-sm hover:bg-stone-300 disabled:opacity-50"
            >
              {chargement ? '…' : 'Enregistrer'}
            </button>

            {analyse.statut === 'generee' && (
              <button
                onClick={handlePublier}
                disabled={chargement}
                className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-700 disabled:opacity-50"
              >
                Publier
              </button>
            )}

            {analyse.statut === 'publiee' && (
              <button
                onClick={handleDepublier}
                disabled={chargement}
                className="text-sm text-stone-500 hover:text-stone-700 underline"
              >
                Dépublier
              </button>
            )}

            <button
              onClick={handleRelancer}
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
