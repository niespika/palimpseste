'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PALETTE_CLASSES } from '@/utils/calendrier-couleurs'
import { definirCouleurClasse, definirJoursCours, repartirCouleursClasses } from './actions'
import PopoverPalette from './PopoverPalette'

const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] // 0 = lundi … 6 = dimanche
const JOURS_LONG = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

export interface ClasseRow {
  id: string
  nom: string
  couleur: string | null
  weekdays: number[]
}

// hex #rrggbb → rgba() avec alpha (pilule d'aperçu calendrier).
function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

export default function EcranClasses({ classes }: { classes: ClasseRow[] }) {
  const router = useRouter()
  const [filtre, setFiltre] = useState('')
  // Popover couleur : id de la classe + élément d'ancrage (pour positionner le
  // portal en fixed hors de la carte, sans être rogné par son overflow).
  const [open, setOpen] = useState<{ id: string; el: HTMLElement } | null>(null)
  const [busy, setBusy] = useState(false)
  // État optimiste (source de vérité de l'UI après action ; router.refresh()
  // resynchronise le calendrier + les compteurs du rail côté serveur).
  const [couleurs, setCouleurs] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(classes.map((c) => [c.id, c.couleur]))
  )
  const [jours, setJours] = useState<Record<string, number[]>>(() =>
    Object.fromEntries(classes.map((c) => [c.id, c.weekdays]))
  )

  // Couleur effective (celle rendue sur le calendrier) = couleur choisie, sinon
  // teinte de palette par position (aligné sur couleursParClasse).
  const effective = (c: ClasseRow, i: number) =>
    couleurs[c.id] ?? PALETTE_CLASSES[i % PALETTE_CLASSES.length]

  // Teintes déjà prises → noms des classes qui les utilisent (couleur EXPLICITE
  // seulement ; une classe « à configurer » ne réserve pas de teinte).
  const prisesParTeinte = useMemo(() => {
    const m = new Map<string, string[]>()
    for (const c of classes) {
      const col = couleurs[c.id]
      if (!col) continue
      const k = col.toLowerCase()
      m.set(k, [...(m.get(k) ?? []), c.nom])
    }
    return m
  }, [classes, couleurs])

  // Pour le popover d'une classe donnée : teintes prises par les AUTRES classes.
  function prisesSauf(nom: string): Map<string, string[]> {
    const m = new Map<string, string[]>()
    for (const [k, noms] of prisesParTeinte) {
      const autres = noms.filter((n) => n !== nom)
      if (autres.length) m.set(k, autres)
    }
    return m
  }

  const nbAConfigurer = classes.filter((c) => !couleurs[c.id]).length
  const visibles = classes.filter((c) => c.nom.toLowerCase().includes(filtre.trim().toLowerCase()))

  async function choisirCouleur(id: string, hex: string) {
    setOpen(null)
    const prec = couleurs[id] // pour revert si l'écriture échoue
    setCouleurs((p) => ({ ...p, [id]: hex }))
    setBusy(true)
    const res = await definirCouleurClasse(id, hex)
    setBusy(false)
    if (res.error) {
      setCouleurs((p) => ({ ...p, [id]: prec })) // rien n'a été persisté
      alert(res.error)
      return
    }
    router.refresh()
  }

  async function basculerJour(id: string, w: number) {
    const actuel = jours[id] ?? []
    const suivant = actuel.includes(w)
      ? actuel.filter((x) => x !== w)
      : [...actuel, w].sort((a, b) => a - b)
    setJours((p) => ({ ...p, [id]: suivant }))
    setBusy(true)
    const res = await definirJoursCours(id, suivant)
    setBusy(false)
    if (res.error) {
      setJours((p) => ({ ...p, [id]: actuel })) // revert : la base est inchangée
      alert(res.error)
      return
    }
    router.refresh()
  }

  async function couleursAuto() {
    const prec = couleurs // snapshot pour revert
    const n = Math.max(classes.length, 1)
    const next: Record<string, string | null> = {}
    classes.forEach((c, i) => {
      next[c.id] = PALETTE_CLASSES[Math.floor((i * PALETTE_CLASSES.length) / n) % PALETTE_CLASSES.length]
    })
    setCouleurs(next)
    setBusy(true)
    const res = await repartirCouleursClasses()
    setBusy(false)
    if (res.error) {
      setCouleurs(prec) // revert (écriture en masse échouée)
      alert(res.error)
      return
    }
    router.refresh()
  }

  if (classes.length === 0) {
    return <p className="text-sm text-muet">Aucune classe active.</p>
  }

  return (
    <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
      {/* Barre d'outils */}
      <div className="flex items-center gap-3.5 flex-wrap px-5 py-3.5 border-b border-bordure">
        <input
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          placeholder="🔍 Filtrer les classes…"
          className="w-[220px] border border-bordure-bouton rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pigment"
        />
        <span className="font-ui text-[13px] text-muet">
          {classes.length} classe{classes.length > 1 ? 's' : ''} active{classes.length > 1 ? 's' : ''}
          {nbAConfigurer > 0 && ` · ${nbAConfigurer} à configurer`}
        </span>
        <button
          type="button"
          onClick={couleursAuto}
          disabled={busy}
          className="ml-auto font-ui text-[13px] font-semibold text-encre-douce bg-white border border-puce rounded-lg px-3.5 py-1.5 whitespace-nowrap hover:bg-parchemin disabled:opacity-50"
        >
          🎨 Couleurs auto
        </button>
      </div>

      {/* Carte à défilement horizontal si la fenêtre est étroite */}
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          {/* En-tête de grille */}
          <div
            className="grid gap-3.5 px-5 pt-2.5 pb-2 font-ui text-[11px] font-semibold tracking-[0.14em] uppercase text-muet-clair"
            style={{ gridTemplateColumns: '110px 74px 236px 1fr', borderBottom: '1px solid #EFE7D6' }}
          >
            <span>Classe</span>
            <span>Couleur</span>
            <span>Jours de cours</span>
            <span>Aperçu calendrier</span>
          </div>

          {visibles.map((c) => {
            const i = classes.indexOf(c)
            const col = couleurs[c.id]
            const eff = effective(c, i)
            const joursSel = jours[c.id] ?? []
            return (
              <div
                key={c.id}
                className="grid gap-3.5 items-center px-5 py-2.5"
                style={{ gridTemplateColumns: '110px 74px 236px 1fr', borderBottom: '1px solid #EFE7D6' }}
              >
                {/* Classe */}
                <span className="text-base font-semibold text-encre truncate">{c.nom}</span>

                {/* Couleur */}
                <span className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => setOpen(open?.id === c.id ? null : { id: c.id, el: e.currentTarget })}
                    aria-label={`Couleur de ${c.nom}`}
                    className="w-[30px] h-5 rounded-[5px] box-border"
                    style={
                      col
                        ? { background: col, border: '1px solid rgba(34,28,22,.18)' }
                        : { background: '#fff', border: '1.5px dashed #C9BBA0' }
                    }
                  />
                  <span className="text-[9px] text-muet-clair">▾</span>
                </span>

                {/* Jours de cours */}
                <span className={`flex gap-1.5 ${busy ? 'opacity-60' : ''}`}>
                  {JOURS.map((lbl, w) => {
                    const on = joursSel.includes(w)
                    return (
                      <button
                        key={w}
                        type="button"
                        onClick={() => basculerJour(c.id, w)}
                        disabled={busy}
                        title={JOURS_LONG[w]}
                        aria-pressed={on}
                        aria-label={`${JOURS_LONG[w]}${on ? ' — jour de cours' : ''}`}
                        className="w-7 h-7 rounded-[7px] font-ui text-xs font-semibold flex items-center justify-center"
                        style={
                          on
                            ? { background: eff, color: '#FBF8F1', boxShadow: 'inset 0 0 0 1px rgba(34,28,22,.12)' }
                            : { background: '#fff', border: '1px solid #D8CCB4', color: '#C9BBA0' }
                        }
                      >
                        {lbl}
                      </button>
                    )
                  })}
                </span>

                {/* Aperçu calendrier */}
                <span className="min-w-0">
                  {col ? (
                    <span
                      className="inline-flex items-center rounded-[5px] px-2.5 py-0.5 text-[13.5px] whitespace-nowrap"
                      style={{ background: rgba(eff, 0.15), borderLeft: `3px solid ${eff}`, color: '#3A2E22' }}
                    >
                      {c.nom} · échéance
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-[5px] px-2.5 py-0.5 font-ui text-[12.5px] font-medium text-attention bg-attention-teinte whitespace-nowrap">
                      ⚠ à configurer — couleur par défaut utilisée
                    </span>
                  )}
                </span>
              </div>
            )
          })}

          {visibles.length === 0 && (
            <p className="text-sm text-muet px-5 py-4">Aucune classe ne correspond au filtre.</p>
          )}
        </div>
      </div>

      {/* Pied : auto-save */}
      <div className="px-5 py-2.5 bg-parchemin" style={{ borderTop: '1px solid #EFE7D6' }}>
        <span className="italic text-[13px] text-muet">
          <span className="not-italic font-bold text-ok">✔</span> Enregistré automatiquement à chaque
          clic.
        </span>
      </div>

      {/* Popover couleur (rendu une seule fois, portalisé hors de la carte). */}
      {open &&
        (() => {
          const c = classes.find((x) => x.id === open.id)
          if (!c) return null
          return (
            <PopoverPalette
              anchorEl={open.el}
              couleur={couleurs[c.id]}
              prises={prisesSauf(c.nom)}
              onPick={(hex) => choisirCouleur(c.id, hex)}
              onClose={() => setOpen(null)}
            />
          )
        })()}
    </div>
  )
}
