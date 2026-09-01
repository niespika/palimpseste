'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sauvegarderSections } from './actions'
import { validerPlages, ordonnerPlages, type PlageSection } from '@/utils/scriptorium-sections'

// Éditeur de DÉCOUPE d'un cours en sections (RAG L2) — modèle PLAGES, calqué sur
// la découpe livre (feedback PO) : chaque section a un TITRE, un NIVEAU
// (chapitre/sous-chapitre — grain fin pour le « vu » partiel) et une plage de
// lignes DÉBUT–FIN (saisie numérique OU pose au clic sur la page). Un §§ peut
// vivre DANS un § (chapitre et ses parties, amendement PO 31/08) ; le chapitre ne
// garde alors que ses lignes PROPRES — le rail les compte. Chevauchement PARTIEL
// interdit ; lignes hors section tolérées (écartées de la matière — bruit PDF).
// La page du cours est À GAUCHE, une seule feuille à défilement continu ; le
// rail d'édition est À DROITE (sticky). Esthétique provisoire (refonte Design à
// venir) — la charte reste celle du module.

type Champ = 'debut' | 'fin'
interface SectionEdit { titre: string; niveau: 1 | 2; debut: number | null; fin: number | null }
interface Cible { index: number; champ: Champ }

const sectionVide = (): SectionEdit => ({ titre: '', niveau: 1, debut: null, fin: null })

export default function EditeurSections({
  contenuId, titre, auteur, texte, plagesInitiales, texteChange, nbSectionsExistantes, nbInstances,
}: {
  contenuId: string
  titre: string
  auteur: string | null
  texte: string
  plagesInitiales: PlageSection[] | null   // null = jamais découpé, ou texte changé (cf. texteChange)
  texteChange: boolean                      // des sections existent mais ne correspondent plus au texte
  nbSectionsExistantes: number
  nbInstances: number                       // parcours de classe référençant ce cours (re-découpe consciente)
}) {
  const router = useRouter()
  const lignes = useMemo(() => texte.split('\n'), [texte])

  const [sections, setSections] = useState<SectionEdit[]>(() =>
    plagesInitiales?.length
      ? plagesInitiales.map(p => ({ titre: p.titre, niveau: p.niveau, debut: p.debut, fin: p.fin }))
      : [sectionVide()],
  )
  const [arme, setArme] = useState<Cible | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Taille du texte de la feuille (A− / A+) — même mémo que la découpe livre.
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

  // ── Cible armée : borne que le prochain clic sur la page renseigne ──────────
  // Sans armement explicite, la prochaine borne MANQUANTE (ordre du rail) est visée
  // — même logique que la découpe livre (prochaineBorne).
  function prochaineCible(list: SectionEdit[]): Cible | null {
    for (let i = 0; i < list.length; i++) {
      if (list[i].debut == null) return { index: i, champ: 'debut' }
      if (list[i].fin == null) return { index: i, champ: 'fin' }
    }
    return null
  }
  const cible = arme ?? prochaineCible(sections)

  // ── Plan : ordre CANONIQUE (un chapitre avant ses sous-chapitres), parenté et
  // lignes PROPRES — miroir de ce que le serveur écrira (ordonnerPlages puis
  // decouperPlages). Les cartes du rail gardent l'ordre de saisie ; c'est
  // l'étiquette (§ 2, §§ 2.1) qui porte la place réelle dans la découpe.
  const plan = useMemo(() => {
    const completes = sections
      .map((s, i) => ({ i, debut: s.debut, fin: s.fin, niveau: s.niveau }))
      .filter((x): x is { i: number; debut: number; fin: number; niveau: 1 | 2 } =>
        x.debut != null && x.fin != null && x.debut <= x.fin)
    const etiquette = new Map<number, string>()
    const parent = new Map<number, number>()
    const propres = new Map<number, number>()   // index → lignes que la section garde en propre
    const profondeur = new Map<number, number>() // ligne → 1 (chapitre) | 2 (sous-chapitre)
    const sousCompteur = new Map<number, number>()
    const pile: { i: number; debut: number; fin: number; niveau: 1 | 2 }[] = []
    let chapitres = 0
    for (const p of ordonnerPlages(completes)) {
      while (pile.length && pile[pile.length - 1].fin < p.debut) pile.pop()
      const englobante = pile.length ? pile[pile.length - 1] : null
      // Seul cas d'imbrication admis (cf. validerPlages) : §§ entièrement dans un §.
      const imbrique = !!englobante && p.fin <= englobante.fin && englobante.niveau === 1 && p.niveau === 2
      propres.set(p.i, p.fin - p.debut + 1)
      if (imbrique && englobante) {
        parent.set(p.i, englobante.i)
        const n = (sousCompteur.get(englobante.i) ?? 0) + 1
        sousCompteur.set(englobante.i, n)
        etiquette.set(p.i, `${etiquette.get(englobante.i) ?? '·'}.${n}`)
        propres.set(englobante.i, (propres.get(englobante.i) ?? 0) - (p.fin - p.debut + 1))
      } else {
        chapitres++
        etiquette.set(p.i, String(chapitres))
      }
      for (let l = p.debut; l <= p.fin; l++) {
        profondeur.set(l, Math.max(profondeur.get(l) ?? 0, imbrique ? 2 : 1))
      }
      pile.push(p)
    }
    return { etiquette, parent, propres, profondeur }
  }, [sections])

  // ── Marquage des lignes : bornes posées (la couverture vient du plan) ───────
  const marques = useMemo(() => {
    const debuts = new Map<number, number[]>() // ligne → index de sections
    const fins = new Map<number, number[]>()
    sections.forEach((s, i) => {
      if (s.debut != null) { const a = debuts.get(s.debut) ?? []; a.push(i); debuts.set(s.debut, a) }
      if (s.fin != null) { const a = fins.get(s.fin) ?? []; a.push(i); fins.set(s.fin, a) }
    })
    return { debuts, fins }
  }, [sections])

  const horsSection = useMemo(() => {
    let n = 0
    for (let l = 1; l <= lignes.length; l++) {
      if (!plan.profondeur.has(l) && lignes[l - 1].trim() !== '') n++
    }
    return n
  }, [lignes, plan])

  // Un chapitre que ses sous-chapitres couvrent entièrement n'a plus de matière :
  // il reste un intitulé (le corpus et Quazian sautent les sections vides).
  const sansMatiere = useMemo(
    () => sections
      .map((s, i) => ({ titre: s.titre.trim() || `section ${plan.etiquette.get(i) ?? i + 1}`, propres: plan.propres.get(i) }))
      .filter(x => x.propres === 0),
    [sections, plan],
  )

  // ── Validation (cœur pur partagé avec le serveur) ───────────────────────────
  const incompletes = sections.some(s => s.debut == null || s.fin == null)
  const probleme = incompletes
    ? null // les bornes à placer sont signalées par la cible, pas en erreur
    : validerPlages(
        sections.map(s => ({ titre: s.titre, niveau: s.niveau, debut: s.debut as number, fin: s.fin as number })),
        lignes.length,
      )
  const pretAEnregistrer = !incompletes && !probleme && sections.length > 0

  // ── Gestes ──────────────────────────────────────────────────────────────────
  function poserLigne(ln: number) {
    setErreur(null)
    if (cible) {
      const { index, champ } = cible
      setSections(prev => prev.map((s, i) => {
        if (i !== index) return s
        // Poser un début après la fin (ou une fin avant le début) déplace l'autre
        // borne sur la même ligne plutôt que de créer une plage inversée.
        if (champ === 'debut') return { ...s, debut: ln, fin: s.fin != null && s.fin < ln ? ln : s.fin }
        return { ...s, fin: ln, debut: s.debut != null && s.debut > ln ? ln : s.debut }
      }))
      setArme(null)
      return
    }
    // Aucune borne à placer : cliquer une borne existante la « reprend » (ré-armement).
    const surDebut = marques.debuts.get(ln)
    if (surDebut?.length) { setArme({ index: surDebut[0], champ: 'debut' }); return }
    const surFin = marques.fins.get(ln)
    if (surFin?.length) { setArme({ index: surFin[0], champ: 'fin' }) }
  }
  function majSection(index: number, patch: Partial<SectionEdit>) {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }
  function majBorne(index: number, champ: Champ, brut: string) {
    setErreur(null)
    if (brut === '') { majSection(index, { [champ]: null } as Partial<SectionEdit>); return }
    const n = Number(brut)
    if (!Number.isInteger(n)) return
    majSection(index, { [champ]: Math.min(lignes.length, Math.max(1, n)) } as Partial<SectionEdit>)
  }
  function ajouterSection() {
    setErreur(null)
    setSections(prev => [...prev, sectionVide()])
    setArme(null) // prochaineCible visera le début de la nouvelle section
  }
  function retirerSection(index: number) {
    setErreur(null)
    setSections(prev => prev.filter((_, i) => i !== index))
    setArme(null)
  }
  function allerA(ligne: number | null) {
    if (ligne == null) return
    document.getElementById(`sec-ligne-${ligne}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  async function enregistrer(plages: PlageSection[], dejaConfirme: boolean) {
    setErreur(null)
    setChargement(true)
    let res = await sauvegarderSections(contenuId, plages, lignes.length, dejaConfirme)
    if (res.needsConfirm) {
      const ok = confirm(
        `Ce cours vit dans ${res.nbInstances} parcours de classe : la re-découpe re-matérialise leurs éléments. ` +
        `Les « vus » sont conservés quand les titres correspondent exactement ; un élément déplacé de semaine à la main est replacé sur la semaine de son créneau. Continuer ?`,
      )
      if (!ok) { setChargement(false); return }
      res = await sauvegarderSections(contenuId, plages, lignes.length, true)
    }
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    router.push('/prof/scriptorium?vue=cours')
    router.refresh()
  }

  function enregistrerDecoupe() {
    if (!pretAEnregistrer) return
    void enregistrer(
      sections.map(s => ({ titre: s.titre, niveau: s.niveau, debut: s.debut as number, fin: s.fin as number })),
      false,
    )
  }
  function effacerDecoupe() {
    const ok = confirm(
      `Effacer la découpe (${nbSectionsExistantes} section${nbSectionsExistantes > 1 ? 's' : ''}) ? ` +
      `Dans les parcours de classe, le cours redevient un élément entier (« vu » conservé seulement si toutes ses sections l'étaient).`,
    )
    if (!ok) return
    void enregistrer([], true)
  }

  if (!texte.trim()) {
    return (
      <div className="space-y-3" data-module="scriptorium">
        <Link href="/prof/scriptorium?vue=cours" className="inline-block text-sm text-muet hover:text-encre">← Cours</Link>
        <p className="text-sm text-muet">
          « {titre} » n’a pas de corps de texte — ajoute-lui un texte (bouton « Modifier » dans la liste des cours) avant de le découper en sections.
        </p>
      </div>
    )
  }

  const puce = (i: number, niveau: 1 | 2) => {
    const et = plan.etiquette.get(i)
    return `${niveau === 2 ? '§§' : '§'}${et ? ` ${et}` : ''}`
  }

  return (
    <div className="space-y-3" data-module="scriptorium">
      {/* ── Barre d'en-tête ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link href="/prof/scriptorium?vue=cours" className="text-sm text-muet hover:text-encre">← Cours</Link>
          <h2 className="font-titre text-lg text-encre leading-tight truncate">
            Découpe — {titre}{auteur ? <span className="text-muet font-normal"> · {auteur}</span> : null}
          </h2>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-ui text-xs text-muet">
            {lignes.length} lignes · {sections.length} section{sections.length > 1 ? 's' : ''}
            {nbInstances > 0 && <> · dans {nbInstances} parcours de classe</>}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => changerTaille(-1)} className="px-2 py-0.5 border border-bordure rounded text-xs text-encre-douce hover:bg-parchemin-fonce" aria-label="Réduire le texte">A−</button>
            <button type="button" onClick={() => changerTaille(1)} className="px-2 py-0.5 border border-bordure rounded text-xs text-encre-douce hover:bg-parchemin-fonce" aria-label="Agrandir le texte">A+</button>
          </div>
        </div>
      </div>

      {texteChange && (
        <div className="flex items-center gap-2 rounded-lg bg-retard-teinte border border-retard/30 px-3 py-2">
          <span className="text-retard">⚠</span>
          <span className="font-corps text-sm text-retard">
            Le texte du cours a changé depuis la dernière découpe ({nbSectionsExistantes} section{nbSectionsExistantes > 1 ? 's' : ''}) : les bornes ne correspondent plus — replace-les, puis enregistre.
          </span>
        </div>
      )}

      <p className="font-ui text-xs text-muet px-1">
        {cible
          ? <>À placer : <span className="font-medium text-encre-douce">{cible.champ === 'debut' ? 'début' : 'fin'} de la section {plan.etiquette.get(cible.index) ?? cible.index + 1}</span> — clique la ligne {cible.champ === 'debut' ? 'où elle commence' : 'où elle finit'} (ou saisis le numéro dans le rail).</>
          : 'Toutes les bornes sont placées. Clique une borne sur la page pour la reprendre, ou un champ début/fin dans le rail.'}
      </p>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ── Page du cours (GAUCHE) : une seule feuille, défilement continu ── */}
        <div className="flex-1 min-w-0 w-full rounded-xl border border-bordure bg-parchemin-fonce p-4 order-2 lg:order-1">
          <div className="relative mx-auto max-w-2xl">
            {/* Effet de pile de feuillets (patron découpe livre) */}
            <div aria-hidden className="absolute inset-0 translate-x-[6px] translate-y-[7px] bg-parchemin border border-bordure rounded-lg opacity-50" />
            <div aria-hidden className="absolute inset-0 translate-x-[3px] translate-y-[3px] bg-parchemin border border-bordure rounded-lg opacity-75" />
            <div className="relative bg-parchemin border border-bordure rounded-lg shadow-sm">
              <div className="px-8 sm:px-10 pt-6 pb-2 text-center border-b border-bordure min-h-[1.25rem]">
                <span className="font-marque text-[10px] tracking-[0.22em] text-muet/80 uppercase">{titre}</span>
              </div>
              <div className="px-8 sm:px-10 py-4 font-corps" style={{ fontSize: `${taille}px` }}>
                {lignes.map((txt, idx) => {
                  const ln = idx + 1
                  const debuts = marques.debuts.get(ln)
                  const fins = marques.fins.get(ln)
                  const profondeur = plan.profondeur.get(ln) ?? 0
                  const reperes: string[] = []
                  for (const i of debuts ?? []) reperes.push(`▸ ${puce(i, sections[i].niveau)} début`)
                  for (const i of fins ?? []) reperes.push(`${puce(i, sections[i].niveau)} fin ◂`)
                  return (
                    <button
                      type="button"
                      key={ln}
                      id={`sec-ligne-${ln}`}
                      onClick={() => poserLigne(ln)}
                      aria-label={cible
                        ? `Placer ${cible.champ === 'debut' ? 'le début' : 'la fin'} de la section à la ligne ${ln}`
                        : `Ligne ${ln}`}
                      className={`group w-full text-left flex gap-3 items-baseline rounded px-1 -mx-1 transition-colors hover:bg-pigment-teinte ${
                        reperes.length ? 'bg-pigment-teinte/70' : profondeur === 2 ? 'bg-pigment-teinte/45' : profondeur === 1 ? 'bg-pigment-teinte/25' : ''
                      }`}
                    >
                      <span className="w-8 shrink-0 text-right font-ui text-[0.7em] text-muet/50 pt-1 select-none">{ln}</span>
                      <span className={`flex-1 min-w-0 leading-[1.5] ${reperes.length ? 'font-medium text-encre' : profondeur > 0 ? 'text-encre' : 'text-encre/60'}`}>
                        {txt || ' '}
                      </span>
                      {reperes.length > 0 && (
                        <span className="shrink-0 self-center font-ui text-[0.78em] font-bold text-pigment whitespace-nowrap">
                          {reperes.join('  ')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Rail d'édition (DROITE, sticky) ─────────────────────────────── */}
        <div className="lg:w-96 w-full flex-shrink-0 space-y-2 order-1 lg:order-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          {sections.map((s, i) => {
            const et = plan.etiquette.get(i)
            const estEnfant = plan.parent.has(i)
            const estCible = cible?.index === i
            return (
              <div key={i} className={`rounded-lg border bg-surface p-2.5 space-y-2 ${estCible ? 'border-pigment/50' : 'border-bordure'} ${estEnfant ? 'ml-5 border-l-2 border-l-pigment/40' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="font-ui text-[11px] text-muet w-14 flex-shrink-0">
                    {et ? `${s.niveau === 2 ? '§§' : '§'} ${et}` : 'À placer'}
                  </span>
                  <input
                    value={s.titre}
                    onChange={e => majSection(i, { titre: e.target.value })}
                    placeholder="Titre (ex. : II. Le déterminisme)"
                    className={`flex-1 min-w-0 px-2 py-1 border rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment ${s.titre.trim() ? 'border-bordure' : 'border-retard/50'}`}
                  />
                  {sections.length > 1 && (
                    <button
                      type="button"
                      onClick={() => retirerSection(i)}
                      title="Retirer cette section (les lignes redeviennent hors section)"
                      className="flex-shrink-0 w-6 h-6 rounded-full border border-bordure text-xs text-muet hover:text-retard hover:bg-retard-teinte"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={s.niveau}
                    onChange={e => majSection(i, { niveau: e.target.value === '2' ? 2 : 1 })}
                    className="px-2 py-1 border border-bordure rounded text-xs text-encre-douce bg-surface focus:outline-none focus:ring-2 focus:ring-pigment"
                    aria-label="Niveau de la section"
                  >
                    <option value={1}>§ Chapitre</option>
                    <option value={2}>§§ Sous-chapitre</option>
                  </select>
                  <label className="flex items-center gap-1 font-ui text-xs text-muet">
                    début
                    <input
                      type="number" min={1} max={lignes.length}
                      value={s.debut ?? ''}
                      onChange={e => majBorne(i, 'debut', e.target.value)}
                      onFocus={() => setArme({ index: i, champ: 'debut' })}
                      placeholder="l."
                      className={`w-16 px-1.5 py-1 border rounded text-xs text-encre focus:outline-none focus:ring-2 focus:ring-pigment ${estCible && cible?.champ === 'debut' ? 'border-pigment/60 bg-pigment-teinte/40' : 'border-bordure'}`}
                    />
                  </label>
                  <label className="flex items-center gap-1 font-ui text-xs text-muet">
                    fin
                    <input
                      type="number" min={1} max={lignes.length}
                      value={s.fin ?? ''}
                      onChange={e => majBorne(i, 'fin', e.target.value)}
                      onFocus={() => setArme({ index: i, champ: 'fin' })}
                      placeholder="l."
                      className={`w-16 px-1.5 py-1 border rounded text-xs text-encre focus:outline-none focus:ring-2 focus:ring-pigment ${estCible && cible?.champ === 'fin' ? 'border-pigment/60 bg-pigment-teinte/40' : 'border-bordure'}`}
                    />
                  </label>
                  {s.debut != null && (
                    <button type="button" onClick={() => allerA(s.debut)} className="font-ui text-[11px] text-muet hover:text-encre">
                      voir{s.fin != null ? ` · ${s.fin - s.debut + 1} l.` : ''}
                      {/* Un chapitre ne sert au tuteur que ses lignes PROPRES : celles
                          qu'aucun de ses sous-chapitres ne prend. */}
                      {s.fin != null && plan.propres.get(i) !== s.fin - s.debut + 1
                        ? ` dont ${plan.propres.get(i)} propre${(plan.propres.get(i) ?? 0) > 1 ? 's' : ''}`
                        : ''}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={ajouterSection}
            className="w-full border border-dashed border-bordure rounded-lg py-2 text-sm text-encre-douce hover:bg-parchemin-fonce"
          >
            + Ajouter une section
          </button>
          <p className="font-ui text-[11px] text-muet px-1 leading-snug">
            Un « §§ Sous-chapitre » dont les bornes tiennent dans celles d’un « § Chapitre » s’y imbrique :
            le chapitre garde alors ses lignes propres (chapeau, chute), ses parties portent le reste.
          </p>

          {(probleme || horsSection > 0 || sansMatiere.length > 0) && (
            <div className="space-y-1">
              {probleme && <p className="font-ui text-xs text-retard">⚠ {probleme}</p>}
              {sansMatiere.map((x, k) => (
                <p key={k} className="font-ui text-xs text-attention">
                  ℹ « {x.titre} » n’a aucune ligne propre : ses sous-chapitres portent tout le texte — le chapitre restera un intitulé, sans matière pour le tuteur.
                </p>
              ))}
              {horsSection > 0 && (
                <p className="font-ui text-xs text-attention">
                  ℹ {horsSection} ligne{horsSection > 1 ? 's' : ''} (non vide{horsSection > 1 ? 's' : ''}) hors de toute section — écartée{horsSection > 1 ? 's' : ''} de la matière du cours découpé.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={enregistrerDecoupe}
              disabled={chargement || !pretAEnregistrer}
              className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
            >
              {chargement ? '…' : 'Enregistrer la découpe'}
            </button>
            {nbSectionsExistantes > 0 && (
              <button
                type="button"
                onClick={effacerDecoupe}
                disabled={chargement}
                className="px-3 py-2 text-sm text-muet hover:text-retard disabled:opacity-50"
              >
                Effacer la découpe
              </button>
            )}
          </div>
          {erreur && <p className="text-retard text-sm">{erreur}</p>}
        </div>
      </div>
    </div>
  )
}
