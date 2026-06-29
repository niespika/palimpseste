'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { creerUploadImportPdf, analyserPdfImport, apercuPlage, supprimerImportPdf } from './actions'

interface Analyse { totalPages: number; scanne: boolean; pagesVides: number; pagesVidesPct: number; tropLong: boolean }
interface Ligne { titre: string; chapitres: string; debut: string; fin: string; off: string }
interface Apercu { debut?: string; fin?: string; vide?: boolean; error?: string }

const ligneVide = (): Ligne => ({ titre: '', chapitres: '', debut: '', fin: '', off: '' })

// Mode « 1 PDF découpé en semaines » : le prof dépose UN PDF, l'app compte les pages
// et détecte un éventuel scan, puis le prof indique pour chaque semaine la plage de
// pages (numéros IMPRIMÉS, corrigés par un décalage global). Aperçu du texte à chaque
// borne = garde-fou contre le décalage silencieux. Texte seul (le PDF n'est pas gardé).
export default function DecoupePdf({ nb, onReady }: { nb: number; onReady: (pret: boolean) => void }) {
  const [etat, setEtat] = useState<'vide' | 'upload' | 'analyse' | 'pret' | 'erreur'>('vide')
  const [erreur, setErreur] = useState<string | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [pagePdf1, setPagePdf1] = useState(1)   // page DU PDF où se trouve la page 1 IMPRIMÉE
  const [lignes, setLignes] = useState<Ligne[]>([])
  const [apercus, setApercus] = useState<Record<number, Apercu>>({})

  const decalage = pagePdf1 - 1
  const pret = etat === 'pret' && !!analyse && !analyse.tropLong
  const ligneAt = (i: number): Ligne => lignes[i] ?? ligneVide()

  // Si le nombre de semaines DIMINUE, on oublie les lignes/aperçus au-delà (sinon ils
  // réapparaissent avec d'anciennes valeurs en remontant). Ajustement en phase de rendu.
  const [prevNb, setPrevNb] = useState(nb)
  if (prevNb !== nb) {
    setPrevNb(nb)
    if (nb < prevNb) {
      setLignes(prev => (prev.length > nb ? prev.slice(0, nb) : prev))
      setApercus(prev => {
        const e = Object.entries(prev).filter(([k]) => Number(k) < nb)
        return e.length === Object.keys(prev).length ? prev : Object.fromEntries(e)
      })
    }
  }

  // Conserver le dernier importId pour le nettoyage au démontage (changement de mode / fermeture).
  const importIdRef = useRef<string | null>(null)
  useEffect(() => { importIdRef.current = importId }, [importId])
  useEffect(() => () => { if (importIdRef.current) void supprimerImportPdf(importIdRef.current) }, [])

  // Aperçu live (debounce) — vérification du contenu à chaque borne.
  useEffect(() => {
    if (!pret || !importId) return
    let annule = false
    const t = setTimeout(async () => {
      const next: Record<number, Apercu> = {}
      await Promise.all(Array.from({ length: nb }, (_, i) => i).map(async i => {
        const l = lignes[i]
        if (!l || !l.debut || !l.fin) return
        const debut = Number(l.debut), fin = Number(l.fin)
        if (!Number.isInteger(debut) || !Number.isInteger(fin)) return
        const off = l.off.trim() !== '' ? Number(l.off) : decalage
        const res = await apercuPlage(importId, debut + off, fin + off)
        if (!annule) next[i] = res
      }))
      if (!annule) setApercus(next)
    }, 500)
    // Annule l'application d'un aperçu déjà parti (redépôt / changement d'importId).
    return () => { annule = true; clearTimeout(t) }
  }, [lignes, decalage, importId, pret, nb])

  async function deposer(file: File) {
    setErreur(null)
    onReady(false)
    if (importIdRef.current) { void supprimerImportPdf(importIdRef.current); setImportId(null); setAnalyse(null) }
    setEtat('upload')
    let importIdLocal: string | null = null   // armé après l'upload : l'objet existe alors en bucket
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
      setEtat('pret')
      onReady(!a.tropLong)
    } catch (e) {
      // L'analyse peut lever (PDF corrompu, réseau) après un upload réussi → pas d'orphelin.
      if (importIdLocal) void supprimerImportPdf(importIdLocal)
      setErreur(`Erreur : ${e instanceof Error ? e.message : 'inconnue'}`)
      setEtat('erreur')
    }
  }

  function majLigne(i: number, champ: keyof Ligne, val: string) {
    setLignes(prev => {
      const n = prev.slice()
      while (n.length <= i) n.push(ligneVide())
      n[i] = { ...n[i], [champ]: val }
      return n
    })
  }

  // Avertissements trous/chevauchements, INDÉPENDANTS de l'ordre de saisie : on trie
  // les plages valides par page PDF de début avant de comparer les voisines.
  const plagesValides = Array.from({ length: nb }, (_, i) => {
    const l = ligneAt(i)
    if (!l.debut || !l.fin) return null
    const debut = Number(l.debut), fin = Number(l.fin)
    if (!Number.isInteger(debut) || !Number.isInteger(fin)) return null
    const off = l.off.trim() !== '' ? Number(l.off) : decalage
    if (!Number.isFinite(off)) return null
    return { semaine: i + 1, debutPdf: debut + off, finPdf: fin + off }
  }).filter((p): p is { semaine: number; debutPdf: number; finPdf: number } => p !== null)
    .sort((a, b) => a.debutPdf - b.debutPdf)
  const avertissements: string[] = []
  for (let i = 1; i < plagesValides.length; i++) {
    const a = plagesValides[i - 1], b = plagesValides[i]
    if (b.debutPdf <= a.finPdf) avertissements.push(`Les semaines ${a.semaine} et ${b.semaine} se chevauchent.`)
    else if (b.debutPdf > a.finPdf + 1) avertissements.push(`Pages ${a.finPdf + 1}–${b.debutPdf - 1} du PDF ne sont assignées à aucune semaine.`)
  }

  const inputCls = 'px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment'

  return (
    <div className="space-y-3">
      {/* Champs transmis à la server action */}
      <input type="hidden" name="mode" value="pdf_decoupe" />
      <input type="hidden" name="importId" value={importId ?? ''} />
      <input type="hidden" name="decalage" value={String(decalage)} />

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
        {analyse && (
          <p className="text-sm text-encre-douce">PDF de <span className="font-medium">{analyse.totalPages} pages</span> détecté.</p>
        )}
        {analyse?.tropLong && (
          <p className="text-retard text-sm">PDF trop long ({analyse.totalPages} pages, maximum 600). Allège-le ou crée le livre en deux fois.</p>
        )}
        {analyse?.scanne && !analyse.tropLong && (
          <p className="text-sm text-attention">
            ⚠ {analyse.pagesVides} page{analyse.pagesVides > 1 ? 's' : ''} sur {analyse.totalPages} semblent sans texte —
            le PDF est peut-être scanné. La création échouera pour toute semaine dont les pages n&apos;ont pas de texte sélectionnable.
          </p>
        )}
      </div>

      {pret && analyse && (
        <>
          <div className="border border-bordure rounded-lg p-3 space-y-1">
            <label className="block text-xs font-medium text-muet">
              Sur quelle page du PDF se trouve la <span className="font-medium">page 1 imprimée</span> du livre ?
            </label>
            <input
              type="number" min={1} max={analyse.totalPages} value={pagePdf1}
              onChange={e => setPagePdf1(Math.max(1, Number(e.target.value) || 1))}
              className={`${inputCls} w-24`}
            />
            <p className="text-xs text-muet">
              Tu saisis ensuite les numéros de page <span className="font-medium">imprimés</span> (ceux du sommaire). Si le livre a des
              pages liminaires (préface, chiffres romains) le décalage peut varier : <span className="font-medium">vérifie l&apos;aperçu de chaque plage</span>.
            </p>
          </div>

          <div className="space-y-3">
            {Array.from({ length: nb }, (_, i) => {
              const l = ligneAt(i)
              const ap = apercus[i]
              const debut = Number(l.debut), fin = Number(l.fin)
              const off = l.off.trim() !== '' ? Number(l.off) : decalage
              const aPlage = !!l.debut && !!l.fin && Number.isInteger(debut) && Number.isInteger(fin)
              return (
                <div key={i} className="border border-bordure rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium text-encre-douce">Semaine {i + 1}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input value={l.titre} onChange={e => majLigne(i, 'titre', e.target.value)} name={`decoupe_${i + 1}_titre`}
                      placeholder="Titre (ex. : Apollon et Dionysos)" className={inputCls} />
                    <input value={l.chapitres} onChange={e => majLigne(i, 'chapitres', e.target.value)} name={`decoupe_${i + 1}_chapitres`}
                      placeholder="Chapitres (ex. : Chap. 1-4)" className={inputCls} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-muet">Pages imprimées</label>
                    <input value={l.debut} onChange={e => majLigne(i, 'debut', e.target.value)} name={`decoupe_${i + 1}_debut`}
                      type="number" min={1} placeholder="de" className={`${inputCls} w-20`} />
                    <span className="text-xs text-muet">à</span>
                    <input value={l.fin} onChange={e => majLigne(i, 'fin', e.target.value)} name={`decoupe_${i + 1}_fin`}
                      type="number" min={1} placeholder="à" className={`${inputCls} w-20`} />
                    <input value={l.off} onChange={e => majLigne(i, 'off', e.target.value)} name={`decoupe_${i + 1}_decalage`}
                      type="number" placeholder="décalage propre" title="Laisser vide = décalage global" className={`${inputCls} w-32`} />
                  </div>
                  {aPlage && (
                    <p className="text-xs text-muet">Pages imprimées {debut}–{fin} → pages PDF {debut + off}–{fin + off}</p>
                  )}
                  {ap?.error && <p className="text-xs text-retard">{ap.error}</p>}
                  {ap?.vide && !ap.error && <p className="text-xs text-attention">⚠ Cette plage ne contient pas de texte (pages blanches ou scannées).</p>}
                  {ap && !ap.error && !ap.vide && (
                    <div className="text-xs text-encre-douce bg-parchemin-fonce/40 rounded p-2 space-y-1">
                      <p><span className="text-muet">Début :</span> {ap.debut || '—'}…</p>
                      <p><span className="text-muet">Fin :</span> {ap.fin || '—'}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {avertissements.length > 0 && (
            <div className="border border-attention bg-attention-teinte/40 rounded-lg p-3 space-y-1">
              {avertissements.map((a, i) => <p key={i} className="text-xs text-attention">⚠ {a}</p>)}
            </div>
          )}
        </>
      )}
    </div>
  )
}
