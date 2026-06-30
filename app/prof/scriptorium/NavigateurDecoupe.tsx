'use client'

import { useEffect, useMemo, useState } from 'react'

export interface Pos { p: number; l: number }
export interface Semaine { titre: string; chapitres: string; debut: Pos | null; fin: Pos | null }
type Champ = 'debut' | 'fin'

export const semaineVide = (): Semaine => ({ titre: '', chapitres: '', debut: null, fin: null })
const enc = (q: Pos) => q.p * 100000 + q.l

// Validité d'ensemble : chaque semaine a un début ET une fin, début ≤ fin, sans
// chevauchement entre semaines (les trous, eux, sont autorisés/avertis).
export function estValide(ws: Semaine[], n: number): boolean {
  const rs: { s: number; e: number }[] = []
  for (let i = 0; i < n; i++) {
    const w = ws[i]
    if (!w || !w.debut || !w.fin) return false
    const s = enc(w.debut), e = enc(w.fin)
    if (s > e) return false
    rs.push({ s, e })
  }
  for (let i = 1; i < rs.length; i++)
    if (rs[i].s <= rs[i - 1].e) return false   // ordre du livre + non-chevauchement (slots consécutifs)
  return true
}

// Navigateur de découpe PARTAGÉ : on feuillette un texte (pages = tableau de textes
// de page) et on pose, pour chaque semaine, un marqueur de DÉBUT et de FIN à la ligne
// près. Source-agnostique : alimenté par les pages d'un PDF (création) ou par le texte
// réassemblé d'un livre existant (modification, une seule « page »).
// - emettreChamps : rend les inputs cachés decoupe_N_* (soumission par FormData, création).
// - onEtat : remonte (semaines, valide) au parent (bouton + données, modification).
export default function NavigateurDecoupe({
  pages, nb, bornesInitiales, emettreChamps = false, modeModification = false, onEtat,
}: {
  pages: string[]
  nb: number
  bornesInitiales?: Semaine[]
  emettreChamps?: boolean
  modeModification?: boolean
  onEtat: (semaines: Semaine[], valide: boolean) => void
}) {
  const [semaines, setSemaines] = useState<Semaine[]>(() => (bornesInitiales ?? []).map(s => ({ ...s })))
  const [arme, setArme] = useState<{ w: number; champ: Champ } | null>(null)
  const [page, setPage] = useState(1)

  // Redimensionne le tableau des semaines quand nb change (préserve la saisie). En rendu.
  const [prevNb, setPrevNb] = useState(nb)
  if (prevNb !== nb) {
    setPrevNb(nb)
    setSemaines(prev => {
      const base = prev.slice(0, nb)
      while (base.length < nb) base.push(semaineVide())
      return base
    })
    if (arme && arme.w >= nb) setArme(null)
  }

  const lignesParPage = useMemo(() => pages.map(p => p.split('\n')), [pages])
  const sem = (i: number): Semaine => semaines[i] ?? semaineVide()
  const lignesDe = (p: number): string[] => lignesParPage[p - 1] ?? []
  const totalPages = pages.length

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

  useEffect(() => { onEtat(semaines, valide) }, [semaines, valide, onEtat])

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

  // Index de ligne GLOBAL (pour compter les lignes hors semaines, toutes pages confondues).
  const compteLignes = lignesParPage.map(a => a.length)
  const globalDe = (q: Pos) => compteLignes.slice(0, q.p - 1).reduce((a, b) => a + b, 0) + q.l
  const totalLignes = compteLignes.reduce((a, b) => a + b, 0)

  const messages: { type: 'erreur' | 'info'; texte: string }[] = []
  for (let i = 0; i < nb; i++) {
    const s = sem(i)
    if (s.debut && s.fin && enc(s.debut) > enc(s.fin)) messages.push({ type: 'erreur', texte: `Semaine ${i + 1} : la fin est avant le début.` })
  }
  // Ordre du livre + chevauchement, sur les semaines consécutives (ordre des slots).
  for (let i = 1; i < nb; i++) {
    const a = sem(i - 1), b = sem(i)
    if (a.debut && a.fin && b.debut && b.fin && enc(b.debut) <= enc(a.fin))
      messages.push({ type: 'erreur', texte: `Les semaines ${i} et ${i + 1} ne sont pas dans l'ordre du texte (ou se chevauchent).` })
  }
  for (let i = 0; i < nb; i++) {
    const s = sem(i)
    if (!s.debut || !s.fin) messages.push({ type: 'info', texte: `Semaine ${i + 1} : ${!s.debut ? 'début' : 'fin'} à placer.` })
  }
  // Lignes hors de toute semaine : informatif en création (front-matter sauté volontairement),
  // mais DESTRUCTIF en modification (texte définitivement retiré du livre).
  const completes = Array.from({ length: nb }, (_, i) => sem(i)).filter(s => s.debut && s.fin)
  const couvertes = completes.reduce((a, s) => a + (globalDe(s.fin as Pos) - globalDe(s.debut as Pos) + 1), 0)
  const horsSemaines = totalLignes - couvertes
  if (completes.length > 0 && horsSemaines > 0) {
    messages.push(modeModification
      ? { type: 'erreur', texte: `${horsSemaines} ligne(s) seront DÉFINITIVEMENT retirées du livre (hors de toute semaine).` }
      : { type: 'info', texte: `${horsSemaines} ligne(s) ne sont dans aucune semaine.` })
  }

  const posTexte = (q: Pos | null) => (q ? (totalPages > 1 ? `p.${q.p} l.${q.l}` : `l.${q.l}`) : '—')
  const inputCls = 'px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment'

  return (
    <div className="flex flex-col lg:flex-row gap-3">
      {/* Texte feuilletable */}
      <div className="flex-1 space-y-2">
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Page précédente" onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-2 py-1 border border-bordure rounded text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40" disabled={page <= 1}>‹</button>
            <span className="text-xs text-muet">Page</span>
            <input type="number" min={1} max={totalPages} value={page}
              onChange={e => setPage(Math.max(1, Math.min(totalPages, Number(e.target.value) || 1)))}
              className={`${inputCls} w-20`} />
            <span className="text-xs text-muet">/ {totalPages}</span>
            <button type="button" aria-label="Page suivante" onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="ml-auto px-2 py-1 border border-bordure rounded text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-40" disabled={page >= totalPages}>›</button>
          </div>
        )}

        <p className="text-xs text-muet">
          {cible
            ? <>À placer : <span className="font-medium text-encre-douce">{cible.champ === 'debut' ? 'début' : 'fin'} de la semaine {cible.w + 1}</span> — clique la ligne {cible.champ === 'debut' ? 'où elle commence' : 'où elle finit'}.</>
            : 'Toutes les bornes sont placées. Tu peux ajuster en cliquant un repère à droite.'}
        </p>

        <div className="border border-bordure rounded-lg p-2 max-h-96 overflow-auto bg-surface">
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
                <span className="text-sm text-encre leading-snug">{txt || ' '}</span>
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
              {emettreChamps && (
                <>
                  <input type="hidden" name={`decoupe_${i + 1}_titre`} value={s.titre} />
                  <input type="hidden" name={`decoupe_${i + 1}_chapitres`} value={s.chapitres} />
                  <input type="hidden" name={`decoupe_${i + 1}_debutPage`} value={s.debut?.p ?? ''} />
                  <input type="hidden" name={`decoupe_${i + 1}_debutLigne`} value={s.debut?.l ?? ''} />
                  <input type="hidden" name={`decoupe_${i + 1}_finPage`} value={s.fin?.p ?? ''} />
                  <input type="hidden" name={`decoupe_${i + 1}_finLigne`} value={s.fin?.l ?? ''} />
                </>
              )}
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
  )
}
