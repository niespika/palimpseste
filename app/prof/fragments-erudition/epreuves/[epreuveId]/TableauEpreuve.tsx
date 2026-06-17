'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { traiterImage, libererPreview, type ImageTraitee } from '@/utils/imageProcessing'
import {
  toggleDepotsClasse,
  creerEssaiProf,
  creerUrlUploadEssaiPhoto,
  confirmerUploadEssaiPhotos,
} from '../../essai-actions'

interface Eleve { id: string; display_name: string; classe: string | null; inscription_id: string }
interface EssaiRow { id: string; eleve_id: string; depose_par: string; created_at: string }
interface AnalyseRow {
  id: string; essai_id: string; statut: string
  lettre_structure: string | null; lettre_expression: string | null
  lettre_argumentation: string | null; lettre_connaissances: string | null
  note20_validee: number | null; publiee_at: string | null
}

interface Props {
  epreuve: { id: string; titre: string; depots_ouverts: boolean; duree_minutes: number }
  classeId: string
  eleves: Eleve[]
  essaiParEleve: Record<string, EssaiRow | undefined>
  analyseParEssai: Record<string, AnalyseRow | undefined>
  distribution: Record<string, Record<string, number>>
  notes20: number[]
}

const STATUT_LABELS: Record<string, { label: string; classe: string }> = {
  en_cours: { label: 'Analyse en cours…', classe: 'bg-blue-100 text-blue-700' },
  generee: { label: 'À valider', classe: 'bg-amber-100 text-amber-700' },
  erreur: { label: 'Erreur', classe: 'bg-red-100 text-red-700' },
  publiee: { label: 'Publiée ✓', classe: 'bg-green-100 text-green-700' },
}

const COULEUR_LETTRE: Record<string, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  D: 'bg-orange-100 text-orange-800',
  E: 'bg-red-100 text-red-800',
}

function telechargerCSV(eleves: Eleve[], essaiParEleve: Props['essaiParEleve'], analyseParEssai: Props['analyseParEssai'], titre: string) {
  const entete = ['Élève', 'Classe', 'Déposé', 'Structure', 'Expression', 'Argumentation', 'Connaissances', 'Note/20', 'Statut']
  const lignes = eleves.map(e => {
    const essai = essaiParEleve[e.id]
    const analyse = essai ? analyseParEssai[essai.id] : null
    return [
      `"${e.display_name}"`,
      `"${e.classe ?? ''}"`,
      essai ? 'Oui' : 'Non',
      analyse?.lettre_structure ?? '',
      analyse?.lettre_expression ?? '',
      analyse?.lettre_argumentation ?? '',
      analyse?.lettre_connaissances ?? '',
      analyse?.note20_validee !== null && analyse?.note20_validee !== undefined ? String(analyse.note20_validee) : '',
      analyse ? STATUT_LABELS[analyse.statut]?.label ?? analyse.statut : '',
    ]
  })
  const csv = [entete, ...lignes].map(r => r.join(',')).join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `essai-${titre.replace(/\s+/g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function DepotProfForm({ epreuveId, inscriptionId, onDone }: { epreuveId: string; inscriptionId: string; onDone: () => void }) {
  const [images, setImages] = useState<ImageTraitee[]>([])
  const [traitement, setTraitement] = useState(false)
  const [upload, setUpload] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [progression, setProgression] = useState('')

  async function handleFichiers(e: React.ChangeEvent<HTMLInputElement>) {
    const fichiers = Array.from(e.target.files ?? [])
    if (!fichiers.length) return
    if (images.length + fichiers.length > 12) { setErreur('Maximum 12 photos.'); return }
    setTraitement(true); setErreur(null)
    try {
      const nouvelles: ImageTraitee[] = []
      for (let i = 0; i < fichiers.length; i++) {
        setProgression(`Traitement ${i + 1}/${fichiers.length}…`)
        nouvelles.push(await traiterImage(fichiers[i]))
      }
      setImages(prev => [...prev, ...nouvelles])
    } catch { setErreur('Erreur de traitement.') }
    finally { setTraitement(false); setProgression('') }
  }

  function monter(i: number) {
    if (i === 0) return
    setImages(prev => { const n = [...prev]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n })
  }
  function descendre(i: number) {
    setImages(prev => { if (i === prev.length - 1) return prev; const n = [...prev]; [n[i], n[i+1]] = [n[i+1], n[i]]; return n })
  }
  function supprimer(i: number) {
    setImages(prev => { libererPreview(prev[i].previewUrl); return prev.filter((_, j) => j !== i) })
  }

  async function handleSoumettre() {
    if (!images.length) { setErreur('Ajoute au moins une photo.'); return }
    setUpload(true); setErreur(null)
    const supabase = createClient()
    try {
      setProgression('Création du dossier…')
      const essaiRes = await creerEssaiProf(epreuveId, inscriptionId)
      if (essaiRes.error || !essaiRes.data) { setErreur(essaiRes.error ?? 'Erreur'); return }
      const { essaiId } = essaiRes.data

      for (let i = 0; i < images.length; i++) {
        setProgression(`Envoi photo ${i + 1}/${images.length}…`)
        const urlRes = await creerUrlUploadEssaiPhoto(essaiId, i + 1, 'jpg')
        if (urlRes.error || !urlRes.data) { setErreur(urlRes.error ?? 'Erreur URL'); return }
        const { path, token } = urlRes.data
        const { error } = await supabase.storage.from('essais').uploadToSignedUrl(path, token, images[i].file, { contentType: 'image/jpeg' })
        if (error) { setErreur(error.message); return }
      }

      setProgression('Déclenchement de l\'analyse…')
      await confirmerUploadEssaiPhotos(essaiId)
      images.forEach(img => libererPreview(img.previewUrl))
      onDone()
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setUpload(false); setProgression('')
    }
  }

  return (
    <div className="mt-3 p-3 bg-stone-50 rounded-lg space-y-3">
      <input type="file" accept="image/*,.heic,.heif" multiple onChange={handleFichiers} className="hidden" id={`upload-${inscriptionId}`} />
      <label htmlFor={`upload-${inscriptionId}`} className="block w-full py-2 border border-dashed border-stone-300 rounded text-center text-sm text-stone-600 cursor-pointer hover:bg-stone-100">
        {traitement ? progression : `Ajouter des photos (${images.length}/12)`}
      </label>

      {images.length > 0 && (
        <div className="space-y-1">
          {images.map((img, i) => (
            <div key={img.previewUrl} className="flex items-center gap-2 bg-white rounded px-2 py-1">
              <span className="text-xs text-stone-400 w-4 text-center">{i + 1}</span>
              <img src={img.previewUrl} alt="" className="w-10 h-10 object-cover rounded" />
              <span className="text-xs text-stone-500 flex-1 truncate">{img.nom}</span>
              <button onClick={() => monter(i)} disabled={i === 0} className="text-stone-400 hover:text-stone-700 disabled:opacity-20 text-xs">▲</button>
              <button onClick={() => descendre(i)} disabled={i === images.length - 1} className="text-stone-400 hover:text-stone-700 disabled:opacity-20 text-xs">▼</button>
              <button onClick={() => supprimer(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      {erreur && <p className="text-red-600 text-xs">{erreur}</p>}
      {upload && <p className="text-blue-600 text-xs">{progression}</p>}

      <div className="flex gap-2">
        <button onClick={handleSoumettre} disabled={upload || traitement || !images.length}
          className="bg-stone-800 text-white px-3 py-1.5 rounded text-sm hover:bg-stone-700 disabled:opacity-50">
          {upload ? '…' : 'Déposer et analyser'}
        </button>
        <button onClick={onDone} className="px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-200 rounded">Annuler</button>
      </div>
    </div>
  )
}

export default function TableauEpreuve({ epreuve, classeId, eleves, essaiParEleve, analyseParEssai, distribution, notes20 }: Props) {
  const router = useRouter()
  const [depotPourEleve, setDepotPourEleve] = useState<string | null>(null)
  const [chargement, setChargement] = useState(false)

  async function handleToggleDepots() {
    setChargement(true)
    await toggleDepotsClasse(epreuve.id, classeId, !epreuve.depots_ouverts)
    setChargement(false)
    router.refresh()
  }

  // Histogramme du /20 (par tranches de 2 points) — l'essai porte un /20.
  const tranches20 = (() => {
    const buckets: { label: string; count: number }[] = []
    for (let bas = 0; bas < 20; bas += 2) {
      const haut = bas + 2
      const count = notes20.filter(n => n >= bas && (haut === 20 ? n <= 20 : n < haut)).length
      buckets.push({ label: `${bas}–${haut}`, count })
    }
    return buckets
  })()
  const max20 = Math.max(1, ...tranches20.map(t => t.count))

  const nbDeposes = eleves.filter(e => essaiParEleve[e.id]).length
  const nbPubliees = eleves.filter(e => {
    const essai = essaiParEleve[e.id]
    return essai && analyseParEssai[essai.id]?.statut === 'publiee'
  }).length

  return (
    <div className="space-y-6">
      {/* Contrôles */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleToggleDepots}
          disabled={chargement}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            epreuve.depots_ouverts
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {epreuve.depots_ouverts ? 'Fermer les dépôts' : 'Ouvrir les dépôts'}
        </button>
        <span className="text-sm text-stone-500">{nbDeposes}/{eleves.length} déposés · {nbPubliees} publiés</span>
        <button
          onClick={() => telechargerCSV(eleves, essaiParEleve, analyseParEssai, epreuve.titre)}
          className="ml-auto text-xs text-stone-600 hover:text-stone-900 px-3 py-1.5 rounded border border-stone-200 hover:border-stone-400 transition-colors"
        >
          Exporter CSV
        </button>
      </div>

      {/* Distribution */}
      {Object.values(distribution).some(d => Object.values(d).some(v => v > 0)) && (
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Répartition des lettres</p>
          <div className="grid grid-cols-4 gap-3">
            {(['structure', 'expression', 'argumentation', 'connaissances'] as const).map(dim => (
              <div key={dim}>
                <p className="text-xs text-stone-500 capitalize mb-1">{dim}</p>
                <div className="flex gap-1 flex-wrap">
                  {(['A', 'B', 'C', 'D', 'E'] as const).map(l => (
                    distribution[dim][l] > 0 && (
                      <span key={l} className={`text-xs px-1.5 py-0.5 rounded font-medium ${COULEUR_LETTRE[l]}`}>
                        {l}: {distribution[dim][l]}
                      </span>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Répartition des notes /20 (l'essai porte un /20) */}
      {notes20.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl p-4">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
            Répartition des notes /20 <span className="font-normal normal-case text-stone-400">({notes20.length} essai{notes20.length > 1 ? 's' : ''} noté{notes20.length > 1 ? 's' : ''})</span>
          </p>
          <div className="flex items-end gap-1.5 h-28">
            {tranches20.map(t => (
              <div key={t.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-xs text-stone-500 tabular-nums">{t.count > 0 ? t.count : ''}</span>
                <div
                  className="w-full bg-stone-700 rounded-t"
                  style={{ height: `${(t.count / max20) * 100}%`, minHeight: t.count > 0 ? '4px' : '0' }}
                />
                <span className="text-[10px] text-stone-400 tabular-nums">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tableau */}
      {eleves.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
          Aucun élève avec l'essai final activé.<br />
          <Link href="/prof/fragments-erudition/themes" className="text-stone-600 underline">
            Activer l'essai final dans Thèmes →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-stone-500 uppercase tracking-wide">Élève</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">Dépôt</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">Str.</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">Exp.</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">Arg.</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">Con.</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">Note</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-stone-500 uppercase tracking-wide">Statut</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {eleves.map(eleve => {
                const essai = essaiParEleve[eleve.id]
                const analyse = essai ? analyseParEssai[essai.id] : undefined
                const statutInfo = analyse ? STATUT_LABELS[analyse.statut] : null

                return (
                  <Fragment key={eleve.inscription_id}>
                    <tr className="border-t border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-2.5 font-medium text-stone-900 whitespace-nowrap">
                        <Link href={`/prof/fragments-erudition/eleve/${eleve.id}?classe=${classeId}`} className="hover:text-blue-700 hover:underline">
                          {eleve.display_name}
                        </Link>
                        {eleve.classe && <span className="text-xs text-stone-400 ml-1">{eleve.classe}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {essai ? (
                          <span className="text-xs text-stone-500">{essai.depose_par === 'prof' ? '(prof)' : '✓'}</span>
                        ) : (
                          <span className="text-xs text-stone-300">—</span>
                        )}
                      </td>
                      {(['lettre_structure', 'lettre_expression', 'lettre_argumentation', 'lettre_connaissances'] as const).map(k => (
                        <td key={k} className="px-3 py-2.5 text-center">
                          {analyse?.[k] ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${COULEUR_LETTRE[analyse[k]!]}`}>
                              {analyse[k]}
                            </span>
                          ) : <span className="text-stone-300">—</span>}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-center text-stone-700 tabular-nums">
                        {analyse?.note20_validee !== null && analyse?.note20_validee !== undefined ? `${analyse.note20_validee}/20` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {statutInfo ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statutInfo.classe}`}>{statutInfo.label}</span>
                        ) : <span className="text-xs text-stone-300">—</span>}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        {essai && analyse ? (
                          <Link
                            href={`/prof/fragments-erudition/essai/${essai.id}?epreuve=${epreuve.id}&classe=${classeId}`}
                            className="text-xs text-stone-500 hover:text-stone-800 underline"
                          >
                            Voir →
                          </Link>
                        ) : (
                          <button
                            onClick={() => setDepotPourEleve(depotPourEleve === eleve.id ? null : eleve.id)}
                            className="text-xs text-stone-500 hover:text-stone-800 underline"
                          >
                            Déposer
                          </button>
                        )}
                      </td>
                    </tr>
                    {depotPourEleve === eleve.id && (
                      <tr className="border-t border-stone-100 bg-stone-50">
                        <td colSpan={9} className="px-4 py-3">
                          <DepotProfForm
                            epreuveId={epreuve.id}
                            inscriptionId={eleve.inscription_id}
                            onDone={() => { setDepotPourEleve(null); router.refresh() }}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
