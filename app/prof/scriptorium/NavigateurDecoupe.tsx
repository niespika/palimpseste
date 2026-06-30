'use client'

import { useEffect, useMemo, useState } from 'react'
import { apparierSignets, type Signet } from './decoupe-utils'
import BarreInfos from './decoupe/BarreInfos'
import PageLivre, { type Repere } from './decoupe/PageLivre'
import FriseSemaines from './decoupe/FriseSemaines'
import GuidePleinCadre from './decoupe/GuidePleinCadre'

export interface Pos { p: number; l: number }
export interface Semaine { titre: string; chapitres: string; debut: Pos | null; fin: Pos | null }
export type Champ = 'debut' | 'fin'
export interface Cible { w: number; champ: Champ }

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
// réassemblé d'un livre existant (modification, re-paginé en pages de lecture).
// - emettreChamps : rend les inputs cachés decoupe_N_* (soumission par FormData, création).
// - onEtat : remonte (semaines, valide) au parent (bouton + données, modification).
// - meta / signets / onRemplacer : présentation (barre fine, titres de signets, remplacement).
export default function NavigateurDecoupe({
  pages, nb, bornesInitiales, emettreChamps = false, modeModification = false, onEtat,
  meta, signets, onRemplacer,
}: {
  pages: string[]
  nb: number
  bornesInitiales?: Semaine[]
  emettreChamps?: boolean
  modeModification?: boolean
  onEtat: (semaines: Semaine[], valide: boolean) => void
  meta?: { titre?: string; auteur?: string | null; texteSelectionnable?: boolean }
  signets?: Signet[] | null
  onRemplacer?: () => void
}) {
  const [semaines, setSemaines] = useState<Semaine[]>(() => (bornesInitiales ?? []).map(s => ({ ...s })))
  const [arme, setArme] = useState<Cible | null>(null)
  const [page, setPage] = useState(1)
  const [friseVisible, setFriseVisible] = useState(true)
  // Taille du texte de la page (px), pilotée par le prof (A− / A+) et mémorisée.
  // Initialiseur paresseux : ce composant ne se monte qu'après interaction (upload /
  // ouverture de l'éditeur), donc toujours côté client → pas de souci d'hydratation.
  const [taille, setTaille] = useState<number>(() => {
    try {
      const v = typeof window !== 'undefined' ? window.localStorage.getItem('scriptorium_decoupe_taille') : null
      const n = v ? Number(v) : NaN
      if (n >= 9 && n <= 22) return n
    } catch { /* localStorage indisponible */ }
    return 13
  })
  const changerTaille = (delta: number) => setTaille(t => {
    const n = Math.min(22, Math.max(9, t + delta))
    try { window.localStorage.setItem('scriptorium_decoupe_taille', String(n)) } catch { /* noop */ }
    return n
  })

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

  function prochaineBorne(ws: Semaine[]): Cible | null {
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
  // Arme une borne ET navigue vers sa page (clic depuis la frise / le guide).
  function armerEtAller(w: number, champ: Champ) {
    setArme({ w, champ })
    const q = sem(w)[champ]
    if (q && q.p >= 1 && q.p <= totalPages) setPage(q.p)
  }

  // Index de ligne GLOBAL (pour compter les lignes hors semaines, toutes pages confondues).
  const compteLignes = lignesParPage.map(a => a.length)
  const globalDe = (q: Pos) => compteLignes.slice(0, q.p - 1).reduce((a, b) => a + b, 0) + q.l
  const totalLignes = compteLignes.reduce((a, b) => a + b, 0)

  // Messages d'ordre/complétude (le cas « hors semaine » est extrait en bannière, ci-dessous).
  const messages: { type: 'erreur' | 'info'; texte: string }[] = []
  for (let i = 0; i < nb; i++) {
    const s = sem(i)
    if (s.debut && s.fin && enc(s.debut) > enc(s.fin)) messages.push({ type: 'erreur', texte: `Semaine ${i + 1} : la fin est avant le début.` })
  }
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
  const afficherHors = completes.length > 0 && horsSemaines > 0

  const posTexte = (q: Pos | null) => (q ? (totalPages > 1 ? `p.${q.p} l.${q.l}` : `l.${q.l}`) : '—')

  // Marqueurs de borne posés sur la page courante (ln → [{w, champ}]).
  const reperesPage = new Map<number, Repere[]>()
  for (let w = 0; w < nb; w++) {
    const s = sem(w)
    if (s.debut && s.debut.p === page) { const a = reperesPage.get(s.debut.l) ?? []; a.push({ w, champ: 'debut' }); reperesPage.set(s.debut.l, a) }
    if (s.fin && s.fin.p === page) { const a = reperesPage.get(s.fin.l) ?? []; a.push({ w, champ: 'fin' }); reperesPage.set(s.fin.l, a) }
  }

  // Signets → titres : appariés par titre (dans la page PDF en création ; globalement
  // en re-découpe où la pagination est synthétique). Mémoïsé (recalcul si pages/signets).
  const signetsParCle = useMemo(
    () => apparierSignets(lignesParPage, signets, { parPage: !modeModification }),
    [lignesParPage, signets, modeModification],
  )
  const titresPage = new Map<number, { niveau: number; titre: string }>()
  for (let l = 1; l <= lignesDe(page).length; l++) {
    const v = signetsParCle.get(`${page}:${l}`)
    if (v) titresPage.set(l, v)
  }

  // Lignes destructives (re-découpe) sur la page courante : non couvertes par une semaine.
  const destructivesPage = new Set<number>()
  if (modeModification && afficherHors) {
    const ranges = completes.map(s => [globalDe(s.debut as Pos), globalDe(s.fin as Pos)] as const)
    for (let l = 1; l <= lignesDe(page).length; l++) {
      const g = globalDe({ p: page, l })
      if (!ranges.some(([a, b]) => g >= a && g <= b)) destructivesPage.add(l)
    }
  }

  const mode = modeModification ? 'modification' : 'creation'
  const pageLivre = (
    <PageLivre
      lignes={lignesDe(page)} page={page} totalPages={totalPages}
      titreCourant={meta?.titre ?? ''} plein={!friseVisible} taille={taille} cible={cible}
      reperes={reperesPage} titres={titresPage} destructives={destructivesPage}
      onPoser={poserLigne}
    />
  )

  return (
    <div className="space-y-3" data-module="scriptorium">
      <BarreInfos
        mode={mode} titre={meta?.titre ?? ''} auteur={meta?.auteur} nbPages={totalPages}
        nbSignets={signets?.length ?? 0} texteSelectionnable={meta?.texteSelectionnable}
        sousTitre={modeModification ? `Texte réassemblé des ${nb} semaines · re-paginé en pages de lecture · signets conservés` : undefined}
        page={page} totalPages={totalPages}
        onPage={p => setPage(Math.max(1, Math.min(totalPages, p)))}
        friseVisible={friseVisible} onToggleFrise={() => setFriseVisible(v => !v)}
        taille={taille} onTaille={changerTaille}
        onRemplacer={mode === 'creation' ? onRemplacer : undefined}
      />

      <p className="font-ui text-xs text-muet px-1">
        {cible
          ? <>À placer : <span className="font-medium text-encre-douce">{cible.champ === 'debut' ? 'début' : 'fin'} de la semaine {cible.w + 1}</span> — clique la ligne {cible.champ === 'debut' ? 'où elle commence' : 'où elle finit'}.</>
          : friseVisible
            ? 'Toutes les bornes sont placées. Tu peux ajuster en cliquant un repère dans la frise, ou une ligne sur la page.'
            : 'Toutes les bornes sont placées. Tu peux ajuster en cliquant un repère sur la page.'}
      </p>

      {friseVisible ? (
        <div className="flex flex-col lg:flex-row gap-4">
          <FriseSemaines
            semaines={semaines} nb={nb} cible={cible} totalPages={totalPages}
            emettreChamps={emettreChamps} posTexte={posTexte}
            onArme={armerEtAller} onEffacer={effacerBorne} onMajTexte={majTexte}
          />
          {/* Fond plus sombre derrière la page → la page (parchemin) ressort en plus clair. */}
          <div className="flex-1 min-w-0 rounded-xl border border-bordure bg-parchemin-fonce p-4">{pageLivre}</div>
        </div>
      ) : (
        <div className="rounded-xl border border-bordure overflow-hidden bg-parchemin-fonce">
          <div className="py-5 px-4">{pageLivre}</div>
          <GuidePleinCadre semaines={semaines} nb={nb} cible={cible} posTexte={posTexte} onArme={armerEtAller} />
          {/* En plein cadre, les champs cachés doivent rester montés (la frise est masquée). */}
          {emettreChamps && Array.from({ length: nb }, (_, i) => {
            const s = sem(i)
            return (
              <div key={i} hidden>
                <input type="hidden" name={`decoupe_${i + 1}_titre`} value={s.titre} />
                <input type="hidden" name={`decoupe_${i + 1}_chapitres`} value={s.chapitres} />
                <input type="hidden" name={`decoupe_${i + 1}_debutPage`} value={s.debut?.p ?? ''} />
                <input type="hidden" name={`decoupe_${i + 1}_debutLigne`} value={s.debut?.l ?? ''} />
                <input type="hidden" name={`decoupe_${i + 1}_finPage`} value={s.fin?.p ?? ''} />
                <input type="hidden" name={`decoupe_${i + 1}_finLigne`} value={s.fin?.l ?? ''} />
              </div>
            )
          })}
        </div>
      )}

      {(messages.length > 0 || afficherHors) && (
        <div className="space-y-1.5">
          {messages.map((m, i) => (
            <p key={i} className={`font-ui text-xs ${m.type === 'erreur' ? 'text-retard' : 'text-attention'}`}>⚠ {m.texte}</p>
          ))}
          {afficherHors && (modeModification ? (
            <div className="flex items-center gap-2 rounded-lg bg-retard-teinte border border-retard/30 px-3 py-2">
              <span className="text-retard">⚠</span>
              <span className="font-corps text-sm text-retard">
                <b>{horsSemaines} ligne{horsSemaines > 1 ? 's' : ''} hors de toute semaine ser{horsSemaines > 1 ? 'ont' : 'a'} DÉFINITIVEMENT retirée{horsSemaines > 1 ? 's' : ''} du livre</b> (barrée{horsSemaines > 1 ? 's' : ''} sur la page).
              </span>
            </div>
          ) : (
            <p className="font-ui text-xs text-muet">ℹ {horsSemaines} ligne{horsSemaines > 1 ? 's' : ''} ne sont dans aucune semaine (front-matter ignoré).</p>
          ))}
        </div>
      )}
    </div>
  )
}
