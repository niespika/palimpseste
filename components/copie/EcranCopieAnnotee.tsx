'use client'
// ============================================================================
// LA COPIE ANNOTÉE — l'écran du professeur, pour UN dépôt.
// Handoff : `design_handoff_copie_annotee/HANDOFF.md` (éprouvé le 03/09).
// ----------------------------------------------------------------------------
// À gauche la copie, surlignée par couches ; à droite les cartes, par
// compétence, dans les mots de l'élève, avec le verdict qui s'y rattache. UNE
// flèche, celle de l'annotation active — les autres sont des numéros : mesuré
// en prod, une copie porte jusqu'à ~40 surlignages, et quarante flèches ne se
// lisent pas.
//
// ⛔ Rien n'est réécrit dans la copie : les segments viennent de
//    `segmenterEnCouches`, dont la concaténation rend le texte à l'octet près.
// ============================================================================

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { VueCopieAnnotee } from '@/utils/copie/vue'
import { NOM_FAMILLE, type Annotation, type Famille, type EnTeteCompetence } from '@/utils/copie/annotations'
import { segmenterEnCouches, type SegmentCouche } from '@/utils/copie/couches'
import { CommentaireEtMessage } from '@/components/passation/EcranProf'

/**
 * Les classes PAR FAMILLE, écrites en toutes lettres — Tailwind ne compose pas
 * un nom de classe à l'exécution. Les couleurs sont les jetons `--comp-*` de
 * `globals.css` ; le retour prend le pigment du module.
 */
const STYLE: Record<Famille, { fond: string; trait: string; bord: string; contour: string; filet: string }> = {
  expression: { fond: 'bg-comp-expression-teinte', trait: 'bg-comp-expression', bord: 'border-comp-expression', contour: 'outline-comp-expression', filet: 'shadow-[inset_0_-2px_0_var(--comp-expression)]' },
  argumentation: { fond: 'bg-comp-argumentation-teinte', trait: 'bg-comp-argumentation', bord: 'border-comp-argumentation', contour: 'outline-comp-argumentation', filet: 'shadow-[inset_0_-2px_0_var(--comp-argumentation)]' },
  structure: { fond: 'bg-comp-structure-teinte', trait: 'bg-comp-structure', bord: 'border-comp-structure', contour: 'outline-comp-structure', filet: 'shadow-[inset_0_-2px_0_var(--comp-structure)]' },
  connaissance: { fond: 'bg-comp-connaissance-teinte', trait: 'bg-comp-connaissance', bord: 'border-comp-connaissance', contour: 'outline-comp-connaissance', filet: 'shadow-[inset_0_-2px_0_var(--comp-connaissance)]' },
  synthese: { fond: 'bg-comp-synthese-teinte', trait: 'bg-comp-synthese', bord: 'border-comp-synthese', contour: 'outline-comp-synthese', filet: 'shadow-[inset_0_-2px_0_var(--comp-synthese)]' },
  questionnement: { fond: 'bg-comp-questionnement-teinte', trait: 'bg-comp-questionnement', bord: 'border-comp-questionnement', contour: 'outline-comp-questionnement', filet: 'shadow-[inset_0_-2px_0_var(--comp-questionnement)]' },
  retour: { fond: 'bg-pigment-teinte', trait: 'bg-bouton', bord: 'border-liseret', contour: 'outline-liseret', filet: 'shadow-[inset_0_-2px_0_var(--pigment)]' },
}

const ORDRE: Famille[] = ['expression', 'argumentation', 'structure', 'connaissance', 'synthese', 'questionnement', 'retour']

export function EcranCopieAnnotee(
  { vue, basePassation, baseCopie }: { vue: VueCopieAnnotee; basePassation: string; baseCopie: string },
) {
  const familles = useMemo<Famille[]>(() => {
    const presentes = new Set<Famille>(vue.annote.competences.map((c) => c.competence))
    if (vue.annote.retour) presentes.add('retour')
    return ORDRE.filter((f) => presentes.has(f))
  }, [vue])
  const [actives, setActives] = useState<Set<Famille>>(() => new Set(familles))
  const [actif, setActif] = useState<string | null>(null)
  const parId = useMemo(() => new Map(vue.annote.toutes.map((a) => [a.id, a])), [vue])
  const cadre = useRef<HTMLDivElement>(null)
  const colonneCopie = useRef<HTMLDivElement>(null)

  const segments = useMemo(() => segmenterEnCouches(
    vue.production ?? '',
    vue.annote.toutes.filter((a) => actives.has(a.famille)).map((a) => ({ id: a.id, intervalles: a.intervalles })),
  ), [vue, actives])

  function basculer(f: Famille) {
    setActives((s) => { const n = new Set(s); if (n.has(f)) n.delete(f); else n.add(f); return n })
    setActif(null)
  }
  function seule(f: Famille) { setActives(new Set([f])); setActif(null) }

  /** Depuis la copie : on active, et la carte vient à l'écran. */
  function depuisLaCopie(ids: string[]) {
    const i = actif ? ids.indexOf(actif) : -1
    const id = ids[(i + 1) % ids.length]!
    setActif(id)
    document.querySelector<HTMLElement>(`[data-bulle="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }
  /** Depuis une carte : on active, et le passage vient à l'écran dans la colonne de la copie. */
  function depuisLaCarte(id: string) {
    setActif(id)
    document.querySelector<HTMLElement>(`[data-marque~="${id}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const production = vue.production ?? ''

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link href={`${basePassation}/${vue.exerciceId}`} className="text-sm text-encre-douce underline">
          ← Passation
        </Link>
        <h1 className="font-cinzel text-xl text-encre">{vue.eleve}</h1>
        <span className="text-xs uppercase tracking-wide text-muet">
          {vue.lieu} · {vue.statut.replace(/_/g, ' ')}{vue.auClavier ? ' · tapée au clavier' : ''}
        </span>
        {vue.versions.length > 1 && (
          <nav className="ml-auto flex gap-1 text-xs">
            {vue.versions.map((v) => (
              <Link key={v} href={`${baseCopie}/${vue.depotId}?version=${v}`}
                className={`rounded px-2 py-0.5 ${v === vue.version ? 'bg-bouton text-parchemin' : 'border border-bordure-bouton text-encre-douce'}`}>
                {v}
              </Link>
            ))}
          </nav>
        )}
      </header>
      {vue.consigne && (
        <details className="text-sm text-encre-douce">
          <summary className="cursor-pointer">La consigne</summary>
          <p className="mt-1 whitespace-pre-wrap">{vue.consigne}</p>
        </details>
      )}

      {/* LES FILTRES — une compétence, ou plusieurs. */}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Compétences affichées">
        {familles.map((f) => {
          const n = f === 'retour'
            ? (vue.annote.retour?.annotations.length ?? 0)
            : (vue.annote.competences.find((c) => c.competence === f)?.annotations.length ?? 0)
          const on = actives.has(f)
          return (
            <button key={f} type="button" onClick={() => basculer(f)} onDoubleClick={() => seule(f)}
              title="Clic : afficher ou masquer · double-clic : seulement celle-ci"
              aria-pressed={on}
              className={`rounded-full border px-3 py-1 text-xs ${on ? `${STYLE[f].fond} ${STYLE[f].bord} text-encre` : 'border-bordure-bouton text-muet'}`}>
              {NOM_FAMILLE[f]} <span className="tabular-nums">({n})</span>
            </button>
          )
        })}
        {actives.size < familles.length && (
          <button type="button" onClick={() => { setActives(new Set(familles)); setActif(null) }}
            className="text-xs text-encre-douce underline">tout afficher</button>
        )}
      </div>

      <div ref={cadre} className="relative grid gap-6 lg:grid-cols-2">
        {/* LA COPIE */}
        <div ref={colonneCopie}
          className="rounded-lg border border-bordure bg-parchemin p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
          <h2 className="mb-2 text-xs uppercase tracking-wide text-muet-clair">La copie</h2>
          {production
            ? <Copie segments={segments} parId={parId} actif={actif} onClic={depuisLaCopie} />
            : <p className="text-sm italic text-muet">Aucune copie lue pour cette version.</p>}
        </div>

        {/* LE PANNEAU */}
        <div className="space-y-4 lg:min-w-0">
          {vue.annote.competences.filter((c) => actives.has(c.competence)).map((c) => (
            <CarteCompetence key={c.competence} enTete={c.enTete}
              annotations={c.annotations} nonRetrouvees={c.nonRetrouvees}
              actif={actif} onClic={depuisLaCarte} />
          ))}
          {vue.annote.retour && actives.has('retour') && (
            <section className={`rounded-lg border p-4 ${STYLE.retour.bord}`}>
              <h2 className="font-cinzel text-sm text-encre">
                Retour de la machine
                <span className="ml-2 text-xs font-normal uppercase tracking-wide text-muet">
                  {vue.annote.retour.moment} · {vue.annote.retour.publie ? 'publié' : 'non publié'}
                  {vue.annote.retour.edite ? ' · modifié par vous' : ''}
                </span>
              </h2>
              <Bulles annotations={vue.annote.retour.annotations} actif={actif} onClic={depuisLaCarte} />
              <NonRetrouvees annotations={vue.annote.retour.nonRetrouvees} />
              {vue.annote.retour.feedForward && (
                <p className="mt-3 text-sm text-encre-douce"><strong>Pour la suite :</strong> {vue.annote.retour.feedForward}</p>
              )}
            </section>
          )}
          {vue.annote.competences.length === 0 && !vue.annote.retour && (
            <p className="text-sm italic text-muet">
              Aucun squelette ni retour pour ce dépôt : la chaîne n’a pas encore mesuré cette copie.
            </p>
          )}
        </div>

        <Fleche cadre={cadre} defilant={colonneCopie} actif={actif} famille={actif ? parId.get(actif)?.famille ?? null : null} />
      </div>

      <section className="rounded-lg border border-bordure bg-surface p-4">
        <h2 className="text-xs uppercase tracking-wide text-muet-clair">Votre lecture</h2>
        <CommentaireEtMessage depotId={vue.depotId} commentaire={vue.commentaire} messageReporte={vue.messageReporte} />
      </section>

      <button type="button" onClick={() => colonneCopie.current?.scrollIntoView({ behavior: 'smooth' })}
        className="fixed bottom-4 right-4 rounded-full border border-bordure-bouton bg-surface px-3 py-2 text-xs text-encre-douce shadow lg:hidden">
        ↑ la copie
      </button>
    </div>
  )
}

// ── la copie surlignée ──────────────────────────────────────────────────────

function Copie({ segments, parId, actif, onClic }: {
  segments: SegmentCouche[]
  parId: Map<string, Annotation>
  actif: string | null
  onClic: (ids: string[]) => void
}) {
  return (
    <p className="whitespace-pre-wrap font-corps text-[15px] leading-7 text-encre">
      {segments.map((s, i) => {
        if (!s.ids.length) return <span key={i}>{s.texte}</span>
        // Le fond est celui de l'annotation la plus COURTE (un mot dans une
        // phrase reste visible) ; le filet bas dit qu'une autre est dessous.
        const annots = s.ids.map((id) => parId.get(id)).filter((a): a is Annotation => !!a)
        const courte = [...annots].sort((a, b) => etendue(a) - etendue(b))[0]!
        const autre = annots.find((a) => a.famille !== courte.famille)
        const estActif = actif != null && s.ids.includes(actif)
        const st = STYLE[courte.famille]
        return (
          <mark key={i} data-marque={s.ids.join(' ')} data-actif={estActif || undefined}
            onClick={() => onClic(s.ids)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClic(s.ids) } }}
            title={annots.map((a) => `${a.numero} ${a.titre}`).join(' · ')}
            className={`cursor-pointer rounded-sm box-decoration-clone text-encre ${st.fond} ${autre ? STYLE[autre.famille].filet : ''} ${
              estActif ? `outline outline-2 outline-offset-1 ${STYLE[(actif ? parId.get(actif)?.famille : undefined) ?? courte.famille].contour}` : ''}`}>
            {s.debuts.map((id) => {
              const a = parId.get(id); if (!a) return null
              return (
                <sup key={id} className={`mr-0.5 select-none rounded px-1 font-mono text-[10px] font-semibold text-parchemin ${STYLE[a.famille].trait}`}>
                  {a.numero}
                </sup>
              )
            })}
            {s.texte}
          </mark>
        )
      })}
    </p>
  )
}

function etendue(a: Annotation): number {
  return a.intervalles.reduce((n, [d, f]) => n + (f - d), 0)
}

// ── les cartes ──────────────────────────────────────────────────────────────

function CarteCompetence({ enTete, annotations, nonRetrouvees, actif, onClic }: {
  enTete: EnTeteCompetence
  annotations: Annotation[]
  nonRetrouvees: Annotation[]
  actif: string | null
  onClic: (id: string) => void
}) {
  const st = STYLE[enTete.competence]
  return (
    <section className={`rounded-lg border p-4 ${st.bord}`}>
      <h2 className="flex flex-wrap items-baseline gap-x-2 font-cinzel text-sm text-encre">
        {NOM_FAMILLE[enTete.competence]}
        {enTete.lettre && <span className={`rounded px-1.5 font-mono text-xs text-parchemin ${st.trait}`}>{enTete.lettre}</span>}
        <span className="text-xs font-normal uppercase tracking-wide text-muet">
          {[enTete.niveau, enTete.profil, enTete.confiance ? `confiance ${enTete.confiance}` : null].filter(Boolean).join(' · ')}
          {enTete.grades.length ? ` · ${enTete.grades.map((g) => `${g.nom} ${g.valeur}`).join(', ')}` : ''}
        </span>
      </h2>
      {enTete.sansJugement && (
        <p className="mt-1 text-xs italic text-attention">P1 écrit, P2 refusé : pas de jugement pour cette compétence.</p>
      )}
      {enTete.cePlafonne && <p className="mt-2 text-sm text-encre"><strong>Ce qui plafonne :</strong> {enTete.cePlafonne}</p>}
      {enTete.levier && <p className="mt-1 text-sm text-encre"><strong>Levier :</strong> {enTete.levier}</p>}
      {enTete.justification && (
        <details className="mt-1 text-sm text-encre-douce">
          <summary className="cursor-pointer text-xs uppercase tracking-wide text-muet-clair">Justification ancrée</summary>
          <p className="mt-1 whitespace-pre-wrap">{enTete.justification}</p>
        </details>
      )}
      <Bulles annotations={annotations} actif={actif} onClic={onClic} />
      <NonRetrouvees annotations={nonRetrouvees} />
    </section>
  )
}

function Bulles({ annotations, actif, onClic }: {
  annotations: Annotation[]; actif: string | null; onClic: (id: string) => void
}) {
  if (!annotations.length) return <p className="mt-2 text-sm italic text-muet">Rien de relevé.</p>
  return (
    <ol className="mt-3 space-y-2">
      {annotations.map((a) => <Bulle key={a.id} a={a} estActif={a.id === actif} onClic={onClic} />)}
    </ol>
  )
}

function Bulle({ a, estActif, onClic }: { a: Annotation; estActif: boolean; onClic: (id: string) => void }) {
  const st = STYLE[a.famille]
  const cliquable = a.intervalles.length > 0
  const ton = a.nature === 'reussite' ? 'text-ok' : a.nature === 'defaut' || a.nature === 'point_de_travail' ? 'text-retard' : 'text-encre-douce'
  return (
    <li data-bulle={a.id}
      className={`rounded border p-2 text-sm ${estActif ? `border-2 ${st.bord} ${st.fond}` : 'border-bordure'}`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <button type="button" onClick={() => cliquable && onClic(a.id)} disabled={!cliquable}
          title={cliquable ? 'Voir le passage dans la copie' : 'Ce point ne désigne aucun passage'}
          className={`rounded px-1.5 font-mono text-xs font-semibold text-parchemin ${st.trait} ${cliquable ? '' : 'opacity-50'}`}>
          {a.numero}
        </button>
        <span className={`text-xs uppercase tracking-wide ${ton}`}>{a.titre}</span>
        {a.methode && a.methode !== 'exact' && (
          <span className="text-[10px] text-muet" title="Citation retrouvée à un détail près (accent, blanc, faute) — le même repérage que la chaîne">
            ≈ {a.methode === 'normalise' ? 'normalisée' : 'approchée'}
          </span>
        )}
      </div>
      {a.citation && (
        <p className="mt-1 text-encre">
          <span className="text-xs text-muet">{a.source === 'texte_support' ? 'Le texte dit ' : ''}</span>
          <span className="font-corps italic">« {a.citation} »</span>
        </p>
      )}
      {a.detail && <p className="mt-1 text-encre">{a.detail}</p>}
      {a.verdicts.map((v, i) => (
        <p key={i} className="mt-1 border-l-2 border-retard pl-2 text-encre">
          <span className="font-semibold">⤷ {v.titre}</span>{v.raison ? ` — ${v.raison}` : ''}
        </p>
      ))}
      {a.champs.length > 0 && (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs text-encre-douce">
          {a.champs.map((c, i) => (
            <div key={i} className="contents">
              <dt className="text-muet">{c.nom}</dt>
              <dd className="min-w-0 break-words">{c.valeur}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  )
}

function NonRetrouvees({ annotations }: { annotations: Annotation[] }) {
  if (!annotations.length) return null
  return (
    <details className="mt-2 text-sm">
      <summary className="cursor-pointer text-xs uppercase tracking-wide text-attention">
        Non retrouvées dans la copie ({annotations.length})
      </summary>
      <p className="mt-1 text-xs text-muet">
        La machine cite ces mots, le code ne les retrouve pas dans la copie : rien n’est surligné plutôt que surligné à côté.
      </p>
      <ol className="mt-1 space-y-1">
        {annotations.map((a) => (
          <li key={a.id} data-bulle={a.id} className="rounded border border-dashed border-attention p-2">
            <span className="font-mono text-xs text-muet">{a.numero}</span>{' '}
            <span className="text-xs uppercase tracking-wide text-muet">{a.titre}</span>
            <p className="font-corps italic text-encre">« {a.citation} »</p>
            {a.detail && <p className="text-encre-douce">{a.detail}</p>}
          </li>
        ))}
      </ol>
    </details>
  )
}

// ── LA flèche — une seule, vers l'annotation active, à partir de 1024 px ────

function Fleche({ cadre, defilant, actif, famille }: {
  cadre: React.RefObject<HTMLDivElement | null>
  defilant: React.RefObject<HTMLDivElement | null>
  actif: string | null
  famille: Famille | null
}) {
  const [trace, setTrace] = useState<{ d: string; x1: number; y1: number; x2: number; y2: number } | null>(null)
  const [large, setLarge] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const maj = () => setLarge(mq.matches)
    maj(); mq.addEventListener('change', maj)
    return () => mq.removeEventListener('change', maj)
  }, [])

  useLayoutEffect(() => {
    let rafId = 0
    // Tout passe par le rAF — jamais un setState synchrone dans l'effet.
    const dessiner = () => {
      if (!actif || !large) { setTrace(null); return }
      const c = cadre.current
      const m = document.querySelector<HTMLElement>(`[data-marque~="${actif}"]`)
      const b = document.querySelector<HTMLElement>(`[data-bulle="${actif}"]`)
      if (!c || !m || !b) { setTrace(null); return }
      const rc = c.getBoundingClientRect(), rm = m.getBoundingClientRect(), rb = b.getBoundingClientRect()
      const zone = defilant.current?.getBoundingClientRect()
      // le surlignage a-t-il défilé hors de la colonne ? alors pas de trait vers le vide
      if (zone && (rm.bottom < zone.top || rm.top > zone.bottom)) { setTrace(null); return }
      const x1 = rm.right - rc.left, y1 = rm.top + rm.height / 2 - rc.top
      const x2 = rb.left - rc.left, y2 = rb.top + 14 - rc.top
      const dx = Math.max(24, (x2 - x1) / 2)
      setTrace({ d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 })
    }
    const demander = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(dessiner) }
    demander()
    window.addEventListener('scroll', demander, true)
    window.addEventListener('resize', demander)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('scroll', demander, true); window.removeEventListener('resize', demander) }
  }, [actif, large, cadre, defilant])

  if (!trace || !famille) return null
  const couleur = famille === 'retour' ? 'var(--pigment)' : `var(--comp-${famille})`
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <path d={trace.d} fill="none" stroke={couleur} strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={trace.x1} cy={trace.y1} r={3} fill={couleur} />
      <circle cx={trace.x2} cy={trace.y2} r={3} fill={couleur} />
    </svg>
  )
}
