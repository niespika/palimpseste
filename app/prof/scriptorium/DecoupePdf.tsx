'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { creerUploadImportPdf, analyserPdfImport, chargerPagesImport, supprimerImportPdf } from './actions'
import NavigateurDecoupe, { type Semaine } from './NavigateurDecoupe'

interface Analyse { totalPages: number; scanne: boolean; pagesVides: number; pagesVidesPct: number; tropLong: boolean }

// Mode CRÉATION « 1 PDF découpé » : dépôt + analyse du PDF, puis découpe via le
// navigateur PARTAGÉ (pages = texte page par page du PDF). Texte seul (PDF non conservé).
export default function DecoupePdf({ nb, onReady }: { nb: number; onReady: (pret: boolean) => void }) {
  const [etat, setEtat] = useState<'vide' | 'upload' | 'analyse' | 'pret' | 'erreur'>('vide')
  const [erreur, setErreur] = useState<string | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [pages, setPages] = useState<string[] | null>(null)

  const importIdRef = useRef<string | null>(null)
  useEffect(() => { importIdRef.current = importId }, [importId])
  useEffect(() => () => { if (importIdRef.current) void supprimerImportPdf(importIdRef.current) }, [])

  const handleEtat = useCallback((_s: Semaine[], valide: boolean) => onReady(valide), [onReady])

  async function deposer(file: File) {
    setErreur(null)
    onReady(false)
    if (importIdRef.current) { void supprimerImportPdf(importIdRef.current); importIdRef.current = null }
    setImportId(null); setAnalyse(null); setPages(null)
    setEtat('upload')
    let importIdLocal: string | null = null
    try {
      const supabase = createClient()
      const prep = await creerUploadImportPdf()
      if (prep.error || !prep.importId || !prep.path || !prep.token) { setErreur(prep.error ?? 'Préparation impossible.'); setEtat('erreur'); return }
      const { error: upErr } = await supabase.storage.from('scriptorium').uploadToSignedUrl(prep.path, prep.token, file, { contentType: 'application/pdf' })
      if (upErr) { setErreur(`Envoi du PDF impossible : ${upErr.message}`); setEtat('erreur'); return }
      importIdLocal = prep.importId
      setEtat('analyse')
      const a = await analyserPdfImport(prep.importId)
      if (a.error || a.totalPages == null) { setErreur(a.error ?? 'Analyse impossible.'); setEtat('erreur'); void supprimerImportPdf(prep.importId); return }
      setImportId(prep.importId)
      setAnalyse({ totalPages: a.totalPages, scanne: !!a.scanne, pagesVides: a.pagesVides ?? 0, pagesVidesPct: a.pagesVidesPct ?? 0, tropLong: !!a.tropLong })
      if (a.tropLong) { setEtat('pret'); return }
      const pg = await chargerPagesImport(prep.importId)
      if (pg.error || !pg.pages) { setErreur(pg.error ?? 'Chargement du texte impossible.'); setEtat('erreur'); void supprimerImportPdf(prep.importId); return }
      setPages(pg.pages)
      setEtat('pret')
    } catch (e) {
      if (importIdLocal) void supprimerImportPdf(importIdLocal)
      setErreur(`Erreur : ${e instanceof Error ? e.message : 'inconnue'}`)
      setEtat('erreur')
    }
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="mode" value="pdf_decoupe" />
      <input type="hidden" name="importId" value={importId ?? ''} />

      <div className="border border-bordure rounded-lg p-3 space-y-2">
        <label className="block text-xs font-medium text-muet">PDF du livre (texte sélectionnable, pas un scan)</label>
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={etat === 'upload' || etat === 'analyse'}
          onChange={e => { const f = e.target.files?.[0]; if (f) void deposer(f) }}
          className="w-full text-sm text-encre-douce file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-parchemin-fonce file:text-encre-douce hover:file:bg-bordure"
        />
        {etat === 'upload' && <p className="text-sm text-muet">Envoi du PDF…</p>}
        {etat === 'analyse' && <p className="text-sm text-muet">Analyse du PDF…</p>}
        {erreur && <p className="text-retard text-sm">{erreur}</p>}
        {analyse && <p className="text-sm text-encre-douce">PDF de <span className="font-medium">{analyse.totalPages} pages</span> détecté.</p>}
        {analyse?.tropLong && (
          <p className="text-retard text-sm">PDF trop long ({analyse.totalPages} pages, maximum 600). Allège-le ou crée le livre en deux fois.</p>
        )}
        {analyse?.scanne && !analyse.tropLong && (
          <p className="text-sm text-attention">
            ⚠ {analyse.pagesVides} page{analyse.pagesVides > 1 ? 's' : ''} sur {analyse.totalPages} semblent sans texte —
            le PDF est peut-être scanné. La création échouera pour toute semaine sans texte sélectionnable.
          </p>
        )}
      </div>

      {etat === 'pret' && pages && analyse && !analyse.tropLong && (
        <NavigateurDecoupe pages={pages} nb={nb} emettreChamps onEtat={handleEtat} />
      )}
    </div>
  )
}
