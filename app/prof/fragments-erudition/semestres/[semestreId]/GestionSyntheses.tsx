'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  genererSynthese,
  genererSynthesesLot,
  sauvegarderSynthese,
  validerNoteSynthese,
  publierSynthese,
  depublierSynthese,
} from '../../essai-actions'

interface Eleve { id: string; display_name: string; classe: string | null }
interface SyntheseRow {
  id: string; eleve_id: string; statut: string
  synthese: string | null; points_forts: string | null; axes_progres: string | null
  note20_suggeree: number | null; note20_min: number | null; note20_max: number | null
  note20_justification: string | null; note20_validee: number | null; note_visible_eleve: boolean
  notes_prof: string | null; publiee_at: string | null
}

interface Props {
  semestreId: string
  eleves: Eleve[]
  syntheseParEleve: Record<string, SyntheseRow | undefined>
  classes: string[]
}

const STATUT_LABELS: Record<string, { label: string; classe: string }> = {
  en_cours: { label: 'Génération…', classe: 'bg-blue-100 text-blue-700' },
  generee: { label: 'À valider', classe: 'bg-amber-100 text-amber-700' },
  erreur: { label: 'Erreur', classe: 'bg-red-100 text-red-700' },
  publiee: { label: 'Publiée ✓', classe: 'bg-green-100 text-green-700' },
}

function EditorSyntheseRow({ synthese, onDone }: { synthese: SyntheseRow; eleve: Eleve; semestreId: string; onDone: () => void }) {
  const router = useRouter()
  const [syntheseTexte, setSyntheseTexte] = useState(synthese.synthese ?? '')
  const [pointsForts, setPointsForts] = useState(synthese.points_forts ?? '')
  const [axesProgres, setAxesProgres] = useState(synthese.axes_progres ?? '')
  const [notesProf, setNotesProf] = useState(synthese.notes_prof ?? '')
  const [note20, setNote20] = useState<number | ''>(synthese.note20_validee ?? '')
  const [noteVisible, setNoteVisible] = useState(synthese.note_visible_eleve)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)
  const [hors, setHors] = useState(false)

  async function handleSauvegarder() {
    setChargement(true)
    const res = await sauvegarderSynthese(synthese.id, {
      synthese: syntheseTexte,
      points_forts: pointsForts,
      axes_progres: axesProgres,
      notes_prof: notesProf,
    })
    setChargement(false)
    if ('error' in res && res.error) setMessage({ type: 'err', texte: res.error as string })
    else { setMessage({ type: 'ok', texte: 'Enregistré.' }); setTimeout(() => setMessage(null), 2500) }
  }

  async function handleNote() {
    const n = note20 === '' ? null : Number(note20)
    if (n !== null && synthese.note20_min !== null && synthese.note20_max !== null) {
      if ((n < synthese.note20_min || n > synthese.note20_max) && !hors) {
        setHors(true)
        setMessage({ type: 'err', texte: `Note hors fourchette (${synthese.note20_min}–${synthese.note20_max}). Cliquez à nouveau.` })
        return
      }
    }
    setHors(false)
    setChargement(true)
    await validerNoteSynthese(synthese.id, n, noteVisible)
    setChargement(false)
    setMessage({ type: 'ok', texte: 'Note enregistrée.' })
    setTimeout(() => setMessage(null), 2500)
  }

  async function handlePublier() {
    setChargement(true)
    await handleSauvegarder()
    await validerNoteSynthese(synthese.id, note20 === '' ? null : Number(note20), noteVisible)
    await publierSynthese(synthese.id)
    setChargement(false)
    router.refresh()
    onDone()
  }

  async function handleDepublier() {
    setChargement(true)
    await depublierSynthese(synthese.id)
    setChargement(false)
    router.refresh()
    onDone()
  }

  return (
    <div className="space-y-4 py-3">
      {/* Note suggérée */}
      {synthese.note20_suggeree !== null && (
        <div className="bg-stone-50 rounded-lg p-3">
          <p className="text-xs font-medium text-stone-500 mb-1">Note suggérée par l'IA</p>
          <p className="text-xl font-serif text-stone-800">
            {synthese.note20_suggeree}/20
            <span className="text-sm text-stone-400 ml-2">fourchette {synthese.note20_min}–{synthese.note20_max}</span>
          </p>
          {synthese.note20_justification && (
            <p className="text-xs text-stone-500 mt-1">{synthese.note20_justification}</p>
          )}
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <input
              type="number"
              value={note20}
              onChange={e => { setNote20(e.target.value === '' ? '' : Number(e.target.value)); setHors(false) }}
              min={0} max={20} step={0.5}
              className="w-20 px-2 py-1 border border-stone-200 rounded text-sm"
              placeholder="/20"
            />
            <label className="flex items-center gap-1 text-xs text-stone-600 cursor-pointer">
              <input type="checkbox" checked={noteVisible} onChange={e => setNoteVisible(e.target.checked)} className="rounded" />
              Visible par l'élève
            </label>
            <button onClick={handleNote} disabled={chargement} className="text-xs bg-stone-200 text-stone-800 px-2 py-1 rounded hover:bg-stone-300">Valider</button>
          </div>
        </div>
      )}

      {[
        { label: 'Synthèse', val: syntheseTexte, set: setSyntheseTexte, rows: 5 },
        { label: 'Points forts', val: pointsForts, set: setPointsForts, rows: 3 },
        { label: 'Axes de progrès', val: axesProgres, set: setAxesProgres, rows: 3 },
        { label: 'Notes prof (privées)', val: notesProf, set: setNotesProf, rows: 2 },
      ].map(({ label, val, set, rows }) => (
        <div key={label}>
          <label className="block text-xs font-medium text-stone-500 mb-1">{label}</label>
          <textarea
            value={val}
            onChange={e => set(e.target.value)}
            rows={rows}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-stone-900"
          />
        </div>
      ))}

      {message && (
        <div className={`rounded-lg px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.texte}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={handleSauvegarder} disabled={chargement} className="bg-stone-200 text-stone-800 px-3 py-1.5 rounded text-sm hover:bg-stone-300 disabled:opacity-50">
          {chargement ? '…' : 'Enregistrer'}
        </button>
        {synthese.statut === 'generee' && (
          <button onClick={handlePublier} disabled={chargement} className="bg-stone-800 text-white px-3 py-1.5 rounded text-sm hover:bg-stone-700 disabled:opacity-50">
            Publier
          </button>
        )}
        {synthese.statut === 'publiee' && (
          <button onClick={handleDepublier} disabled={chargement} className="text-sm text-stone-500 hover:text-stone-700 underline">Dépublier</button>
        )}
        <button onClick={onDone} className="text-xs text-stone-400 hover:text-stone-600 underline">Fermer</button>
      </div>
    </div>
  )
}

export default function GestionSyntheses({ semestreId, eleves, syntheseParEleve, classes }: Props) {
  const router = useRouter()
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [classeSelectionnee, setClasseSelectionnee] = useState<string>('')
  const [ouvertPourEleve, setOuvertPourEleve] = useState<string | null>(null)

  async function handleGenererUn(eleveId: string) {
    setEnCours(true)
    await genererSynthese(eleveId, semestreId)
    setEnCours(false)
    setMessage('Génération en cours…')
    setTimeout(() => { setMessage(null); router.refresh() }, 2000)
  }

  async function handleGenererLot() {
    const elevesFiltres = classeSelectionnee
      ? eleves.filter(e => e.classe === classeSelectionnee)
      : eleves
    const ids = elevesFiltres.map(e => e.id)
    if (!ids.length) return
    setEnCours(true)
    const res = await genererSynthesesLot(ids, semestreId)
    setEnCours(false)
    setMessage(`Génération lancée pour ${res.count} élèves…`)
    setTimeout(() => { setMessage(null); router.refresh() }, 3000)
  }

  const nbGeneres = eleves.filter(e => {
    const s = syntheseParEleve[e.id]
    return s && (s.statut === 'generee' || s.statut === 'publiee')
  }).length
  const nbPublies = eleves.filter(e => syntheseParEleve[e.id]?.statut === 'publiee').length

  return (
    <div className="space-y-6">
      {/* Génération en lot */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-stone-600">{nbGeneres}/{eleves.length} générées · {nbPublies} publiées</span>
        {classes.length > 0 && (
          <select
            value={classeSelectionnee}
            onChange={e => setClasseSelectionnee(e.target.value)}
            className="px-2 py-1.5 border border-stone-200 rounded text-sm"
          >
            <option value="">Toute la classe</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <button
          onClick={handleGenererLot}
          disabled={enCours}
          className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-700 disabled:opacity-50"
        >
          {enCours ? 'Génération…' : `Générer ${classeSelectionnee ? `(${classeSelectionnee})` : 'tout'}`}
        </button>
        {message && <span className="text-sm text-blue-600">{message}</span>}
      </div>

      {/* Liste par élève */}
      <div className="space-y-2">
        {eleves.map(eleve => {
          const synthese = syntheseParEleve[eleve.id]
          const statutInfo = synthese ? STATUT_LABELS[synthese.statut] : null
          const estOuvert = ouvertPourEleve === eleve.id

          return (
            <div key={eleve.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <span className="font-medium text-stone-900 text-sm">{eleve.display_name}</span>
                  {eleve.classe && <span className="text-xs text-stone-400 ml-1">{eleve.classe}</span>}
                  {synthese?.note20_validee !== null && synthese?.note20_validee !== undefined && (
                    <span className="ml-2 text-xs text-stone-600">{synthese.note20_validee}/20{synthese.note_visible_eleve ? ' (visible)' : ''}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {statutInfo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statutInfo.classe}`}>{statutInfo.label}</span>
                  )}
                  {(synthese?.statut === 'generee' || synthese?.statut === 'publiee') ? (
                    <button
                      onClick={() => setOuvertPourEleve(estOuvert ? null : eleve.id)}
                      className="text-xs text-stone-500 hover:text-stone-800 underline"
                    >
                      {estOuvert ? 'Fermer' : 'Valider'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleGenererUn(eleve.id)}
                      disabled={enCours || synthese?.statut === 'en_cours'}
                      className="text-xs text-stone-500 hover:text-stone-800 underline disabled:opacity-40"
                    >
                      {synthese?.statut === 'en_cours' ? 'En cours…' : synthese ? 'Relancer' : 'Générer'}
                    </button>
                  )}
                </div>
              </div>

              {estOuvert && synthese && (synthese.statut === 'generee' || synthese.statut === 'publiee') && (
                <div className="px-4 border-t border-stone-100">
                  <EditorSyntheseRow
                    synthese={synthese}
                    eleve={eleve}
                    semestreId={semestreId}
                    onDone={() => setOuvertPourEleve(null)}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
