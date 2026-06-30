'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { creerUploadImportPdf, analyserPdfImport, chargerPagesImport, supprimerImportPdf } from './actions'

interface Pos { p: number; l: number }
interface Semaine { titre: string; chapitres: string; debut: Pos | null; fin: Pos | null }
interface Analyse { totalPages: number; scanne: boolean; pagesVides: number; pagesVidesPct: number; tropLong: boolean }
type Champ = 'debut' | 'fin'

const semaineVide = (): Semaine => ({ titre: '', chapitres: '', debut: null, fin: null })
const enc = (q: Pos) => q.p * 100000 + q.l

// Validité d'ensemble : chaque semaine a un début ET une fin, début ≤ fin, sans
// chevauchement entre semaines (les trous, eux, sont autorisés).
function estValide(ws: Semaine[], n: number): boolean {
  const rs: { s: number; e: number }[] = []
  for (let i = 0; i < n; i++) {
    const w = ws[i]
    if (!w || !w.debut || !w.fin) return false
    const s = enc(w.debut), e = enc(w.fin)
    if (s > e) return false
    rs.push({ s, e })
  }
  for (let i = 0; i < rs.length; i++)
    for (let j = i + 1; j < rs.length; j++)
      if (rs[i].s <= rs[j].e && rs[j].s <= rs[i].e) return false
  return true
}

// Mode « 1 PDF découpé » : le prof feuillette le PDF (texte page par page) et pose,
// pour chaque semaine, un marqueur de DÉBUT et un de FIN à la ligne près. Pas de
// décalage à calculer (on marque sur la vraie page) ; la coupe tombe pile au bon
// endroit même en milieu de page. Texte seul (le PDF n'est pas conservé).
export default function DecoupePdf({ nb, onReady }: { nb: number; onReady: (pret: boolean) => void }) {
  const [etat, setEtat] = useState<'vide' | 'upload' | 'analyse' | 'pret' | 'erreur'>('vide')
  const [erreur, setErreur] = useState<string | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [analyse, setAnalyse] = useState<Analyse | null>(null)
  const [pages, setPages] = useState<string[] | null>(null)
  const [page, setPage] = useState(1)
  const [semaines, setSemaines] = useState<Semaine[]>([])
  const [arme, setArme] = useState<{ w: number; champ: Champ } | null>(null)

  // Redimensionne le tableau des semaines quand nb change (préserve la saisie). En rendu.
  const [prevNb, setPrevNb] = useState(nb)
  if (prevNb !== nb) {
    setPrevNb(nb)
    setSemaines(prev => {
      const base = prev.slice(0, nb)
      while (base.length < nb) base.push(semaineVide())
      return base
    })
    if (arme && arme.w >= nb) setArme(null)   // ne pas viser une semaine qui n'existe plus
  }

  const sem = (i: number): Semaine => semaines[i] ?? semaineVide()
  const lignesDe = (p: number): string[] => (pages?.[p - 1] ?? '').split('\n')

  // Prochaine borne à placer (début1, fin1, début2, fin2, …) ; null si tout est placé.
  function prochaineBorne(ws: Semaine[]): { w: number; champ: Champ } | null {
    for (let w = 0; w < nb; w++) {
      const s = ws[w] ?? semaineVide()
      if (!s.debut) return { w, champ: 'debut' }
      if (!s.fin) return { w, champ: 'fin' }
    }
    return null
  }
  const cible = arme ?? prochaineBorne(semaines)
  const valide = estValide(semaines, nb)

  // Notifie le parent (active/désactive le bouton « Ajouter »). onReady est opaque ici.
  useEffect(() => { onReady(valide) }, [valide, onReady])

  // Nettoyage de l'import transitoire au démontage (changement de mode / fermeture).
  const importIdRef = useRef<string | null>(null)
  useEffect(() => { importIdRef.current = importId }, [importId])
  useEffect(() => () => { if (importIdRef.current) void supprimerImportPdf(importIdRef.current) }, [])

  async function deposer(file: File) {
    setErreur(null)
    onReady(false)
    if (importIdRef.current) { void supprimerImportPdf(importIdRef.current); importIdRef.current = null }
    setImportId(null); setAnalyse(null); setPages(null); setSemaines([]); setArme(null); setPage(1)
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

  function normaliser(): Semaine[] {
    const base = semaines.slice(0, nb)
    while (base.length < nb) base.push(semaineVide())
    return base
  }
  function poserLigne(ligne: number) {
    if (!cible) return
    const base = normaliser()
    base[cible.w] = { ...base[cible.w], [cible.champ]: { p: page, l: ligne } }
    setSemaines(base)
    setArme(null)
  }
  function effacerBorne(w: number, champ: Champ) {
    const base = normaliser()
    base[w] = { ...base[w], [champ]: null }
    setSemaines(base)
    setArme({ w, champ })
  }
  function majTexte(w: number, champ: 'titre' | 'chapitres', val: string) {
    const base = normaliser()
    base[w] = { ...base[w], [champ]: val }
    setSemaines(base)
  }

  // Messages : chevauchements (bloquants) + trous (informatifs). Lignes calculables
  // côté client car on a tout le texte.
  function suivante(q: Pos): Pos { const ln = lignesDe(q.p).length; return q.l < ln ? { p: q.p, l: q.l + 1 } : { p: q.p + 1, l: 1 } }
  const messages: { type: 'erreur' | 'info'; texte: string }[] = []
  const completes = Array.from({ length: nb }, (_, i) => ({ i, s: sem(i) }))
    .filter(x => x.s.debut && x.s.fin)
    .map(x => ({ w: x.i + 1, ds: enc(x.s.debut as Pos), de: enc(x.s.fin as Pos), debut: x.s.debut as Pos, fin: x.s.fin as Pos }))
    .sort((a, b) => a.ds - b.ds)
  for (let i = 1; i < completes.length; i++) {
    const a = completes[i - 1], b = completes[i]
    if (b.ds <= a.de) messages.push({ type: 'erreur', texte: `Les semaines ${a.w} et ${b.w} se chevauchent.` })
    else if (b.ds > enc(suivante(a.fin))) messages.push({ type: 'info', texte: `Un passage entre les semaines ${a.w} et ${b.w} n'est dans aucune semaine.` })
  }
  // Fin avant début (bloque le bouton) — on dit pourquoi.
  for (const c of completes)
    if (c.ds > c.de) messages.push({ type: 'erreur', texte: `Semaine ${c.w} : la fin est avant le début.` })
  // Bornes encore à poser (explique le bouton grisé).
  for (let i = 0; i < nb; i++) {
    const s = sem(i)
    if (!s.debut || !s.fin) messages.push({ type: 'info', texte: `Semaine ${i + 1} : ${!s.debut ? 'début' : 'fin'} à placer.` })
  }

  const posTexte = (q: Pos | null) => (q ? `p.${q.p} l.${q.l}` : '—')
  const inputCls = 'px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment'

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
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Navigateur de pages */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <button type="button" aria-label="Page précédente" onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2 py-1 border border-bordure rounded text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40" disabled={page <= 1}>‹</button>
              <span className="text-xs text-muet">Page</span>
              <input type="number" min={1} max={analyse.totalPages} value={page}
                onChange={e => setPage(Math.max(1, Math.min(analyse.totalPages, Number(e.target.value) || 1)))}
                className={`${inputCls} w-20`} />
              <span className="text-xs text-muet">/ {analyse.totalPages}</span>
              <button type="button" aria-label="Page suivante" onClick={() => setPage(p => Math.min(analyse.totalPages, p + 1))}
                className="ml-auto px-2 py-1 border border-bordure rounded text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40" disabled={page >= analyse.totalPages}>›</button>
            </div>

            <p className="text-xs text-muet">
              {cible
                ? <>À placer : <span className="font-medium text-encre-douce">{cible.champ === 'debut' ? 'début' : 'fin'} de la semaine {cible.w + 1}</span> — clique la ligne {cible.champ === 'debut' ? 'où elle commence' : 'où elle finit'}.</>
                : 'Toutes les bornes sont placées. Tu peux ajuster en cliquant un repère à droite.'}
            </p>

            <div className="border border-bordure rounded-lg p-2 max-h-80 overflow-auto bg-surface">
              {lignesDe(page).map((txt, idx) => {
                const ln = idx + 1
                const reperes = Array.from({ length: nb }, (_, w) => sem(w))
                  .flatMap((s, w) => [
                    s.debut && s.debut.p === page && s.debut.l === ln ? `S${w + 1} début` : null,
                    s.fin && s.fin.p === page && s.fin.l === ln ? `S${w + 1} fin` : null,
                  ]).filter(Boolean) as string[]
                const marque = reperes.length > 0
                return (
                  <button type="button" key={ln} onClick={() => poserLigne(ln)}
                    aria-label={cible ? `Placer ${cible.champ === 'debut' ? 'début' : 'fin'} de la semaine ${cible.w + 1} à la ligne ${ln}` : `Ligne ${ln}`}
                    className={`w-full flex gap-2 items-start text-left px-2 py-0.5 rounded hover:bg-pigment-teinte ${marque ? 'bg-pigment-teinte' : ''}`}>
                    <span className="text-[11px] text-muet font-mono min-w-[20px] text-right pt-0.5">{ln}</span>
                    <span className="text-sm text-encre leading-snug">{txt || ' '}</span>
                    {marque && <span className="ml-auto text-[11px] font-medium text-liseret whitespace-nowrap">{reperes.join(' · ')}</span>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Panneau des semaines */}
          <div className="lg:w-72 space-y-2">
            <p className="text-xs font-medium text-muet">Semaines</p>
            {Array.from({ length: nb }, (_, i) => {
              const s = sem(i)
              const slot = (champ: Champ, label: string) => {
                const val = s[champ]
                const actif = cible?.w === i && cible.champ === champ
                return (
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setArme({ w: i, champ })}
                      className={`flex-1 text-left px-2 py-1 rounded border text-xs ${actif ? 'border-liseret bg-pigment-teinte text-encre' : val ? 'border-bordure text-encre-douce' : 'border-dashed border-bordure text-muet'}`}>
                      {label} : {posTexte(val)}
                    </button>
                    {val && (
                      <button type="button" aria-label={`Effacer ${label} de la semaine ${i + 1}`} onClick={() => effacerBorne(i, champ)}
                        className="px-1.5 py-1 text-xs text-muet hover:text-retard">✕</button>
                    )}
                  </div>
                )
              }
              return (
                <div key={i} className="border border-bordure rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-muet bg-parchemin-fonce rounded px-1.5 py-0.5">S{i + 1}</span>
                    <input value={s.titre} onChange={e => majTexte(i, 'titre', e.target.value)} placeholder="Titre…"
                      className={`${inputCls} flex-1 !py-1 text-xs`} />
                  </div>
                  <input value={s.chapitres} onChange={e => majTexte(i, 'chapitres', e.target.value)} placeholder="Chapitres (ex. : Chap. 1-4)"
                    className={`${inputCls} w-full !py-1 text-xs`} />
                  {slot('debut', 'Début')}
                  {slot('fin', 'Fin')}
                  <input type="hidden" name={`decoupe_${i + 1}_titre`} value={s.titre} />
                  <input type="hidden" name={`decoupe_${i + 1}_chapitres`} value={s.chapitres} />
                  <input type="hidden" name={`decoupe_${i + 1}_debutPage`} value={s.debut?.p ?? ''} />
                  <input type="hidden" name={`decoupe_${i + 1}_debutLigne`} value={s.debut?.l ?? ''} />
                  <input type="hidden" name={`decoupe_${i + 1}_finPage`} value={s.fin?.p ?? ''} />
                  <input type="hidden" name={`decoupe_${i + 1}_finLigne`} value={s.fin?.l ?? ''} />
                </div>
              )
            })}

            {messages.length > 0 && (
              <div className="space-y-1">
                {messages.map((m, i) => (
                  <p key={i} className={`text-xs ${m.type === 'erreur' ? 'text-retard' : 'text-attention'}`}>⚠ {m.texte}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
