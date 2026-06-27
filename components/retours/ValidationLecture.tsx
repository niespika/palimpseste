'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ACCENT, type Accent } from '@/components/aletheia/VueRetours'

// Composant transversal de validation de lecture d'un retour (Fragments écrit/essai,
// Codex, Aletheia VF). Chaque tuile = une carte titrée. Quand il y a PLUSIEURS
// tuiles, une case à cocher par tuile ; le bouton « J'ai tout lu » n'est actif que
// si TOUTES sont cochées. À une seule tuile : pas de case, bouton direct. Le clic
// appelle la Server Action de marquage passée en prop (pose le *_lu_at serveur).
// `node` = contenu SANS en-tête (l'en-tête/case est fourni ici).
//
// Mode `sequentiel` (opt-in, Aletheia retour final) : divulgation progressive —
// une partie révélée à la fois, cochée avant d'ouvrir la suivante, parties lues
// repliées en bandeau « Lu » (re-dépliables), la dernière partie portant le bouton
// de clôture. Réservé à la SAISIE de validation (dejaLu === false) ; la logique de
// marquage est identique (même `marquerAction`).

export interface TuileRetour {
  id: string
  titre: string
  node: React.ReactNode
  accent?: Accent
}

interface Props {
  tuiles: TuileRetour[]
  dejaLu: boolean
  /** Server Action liée, ex. validerLectureRetour.bind(null, id). */
  marquerAction: () => Promise<{ error?: string; success?: boolean } | void>
  labelBouton?: string
  introMessage?: string
  /** true = divulgation progressive (opt-in). Sans ça : comportement empilé historique. */
  sequentiel?: boolean
}

// Couleur de texte de l'accent (le surtitre « PARTIE N » du mode séquentiel).
// Pendant de la map `ACCENT` (qui ne fournit que les liserés border-l-*).
const ACCENT_TEXTE: Record<Accent, string> = {
  violet: 'text-liseret',
  amber: 'text-attention',
  green: 'text-ok',
  stone: 'text-muet',
  sky: 'text-info',
  minium: 'text-minium',
  pigment: 'text-pigment',
  or: 'text-liseret',
}

export default function ValidationLecture({ tuiles, dejaLu, marquerAction, labelBouton, introMessage, sequentiel }: Props) {
  const router = useRouter()
  const [cochees, setCochees] = useState<Set<string>>(new Set())
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Mode séquentiel : partie courante révélée + parties lues re-dépliées (éphémère).
  const [index, setIndex] = useState(0)
  const [rouvertes, setRouvertes] = useState<Set<string>>(new Set())

  const multi = tuiles.length > 1
  const avecCases = multi && !dejaLu
  const toutCoche = !avecCases || tuiles.every((t) => cochees.has(t.id))

  function toggle(id: string) {
    setCochees((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleRouverte(id: string) {
    setRouvertes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function valider() {
    setErreur(null)
    setPending(true)
    try {
      const res = await marquerAction()
      if (res && 'error' in res && res.error) {
        setErreur(res.error)
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  // ── Mode séquentiel (Aletheia retour final) ──────────────────────────────────
  if (sequentiel && !dejaLu) {
    const total = tuiles.length
    return (
      <div className="space-y-3">
        {/* Fil de progression « partie par partie » */}
        <div>
          <p className="font-ui text-xs text-encre-douce">Ton retour, partie par partie</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex items-center gap-1.5">
              {tuiles.map((t, i) => (
                <span
                  key={t.id}
                  aria-hidden
                  className={`h-2 w-2 rounded-full ${i <= index ? 'bg-pigment' : 'border border-bordure'}`}
                />
              ))}
            </div>
            <span className="font-ui text-xs text-muet">{index + 1} / {total}</span>
          </div>
        </div>

        {introMessage && <p className="text-xs text-muet">{introMessage}</p>}

        {tuiles.map((tuile, i) => {
          if (i > index) return null

          // Parties lues : bandeau replié, re-dépliable.
          if (i < index) {
            const ouvert = rouvertes.has(tuile.id)
            return (
              <div key={tuile.id} className="bg-parchemin-fonce border border-bordure rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleRouverte(tuile.id)}
                  aria-expanded={ouvert}
                  className="w-full min-h-[44px] flex items-center gap-2.5 px-4 py-2.5 text-left"
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full bg-pigment-teinte text-pigment flex items-center justify-center text-xs"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span className="flex-1 text-sm text-encre-douce">Partie {i + 1} · {tuile.titre}</span>
                  <span className="font-ui text-xs text-muet shrink-0">{ouvert ? 'replier' : 'déplier'}</span>
                </button>
                {ouvert && <div className="px-4 pb-4 pt-1 border-t border-bordure">{tuile.node}</div>}
              </div>
            )
          }

          // Partie courante (i === index).
          const estDerniere = i === total - 1
          const accentBord = ACCENT[tuile.accent ?? 'stone']
          const accentTexte = ACCENT_TEXTE[tuile.accent ?? 'stone']
          const restant = total - index - 1
          return (
            <div key={tuile.id}>
              <div className={`bg-surface border border-bordure border-l-4 ${accentBord} rounded-xl overflow-hidden`}>
                <div className="p-4 space-y-2">
                  <p className={`font-ui text-xs tracking-[0.1em] uppercase ${accentTexte}`}>
                    Partie {i + 1} · {tuile.titre}
                  </p>
                  <div>{tuile.node}</div>
                </div>

                {estDerniere ? (
                  <div className="px-4 pb-4 pt-1 space-y-2">
                    <button
                      onClick={valider}
                      disabled={pending}
                      className="w-full bg-bouton text-surface rounded-xl py-3 font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
                    >
                      {pending ? '…' : labelBouton ?? '✓ J’ai lu mon retour — clore la semaine'}
                    </button>
                    <p className="text-xs text-muet text-center">En validant, tu confirmes avoir lu les {total} parties.</p>
                    {erreur && <p className="text-retard text-sm text-center">{erreur}</p>}
                  </div>
                ) : (
                  <label className="flex items-center gap-2.5 px-4 py-3 min-h-[44px] border-t border-bordure bg-pigment-teinte cursor-pointer">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => setIndex(index + 1)}
                      className="h-4 w-4 shrink-0 accent-bouton cursor-pointer"
                    />
                    <span className="text-sm font-medium text-bouton">J’ai lu cette partie</span>
                  </label>
                )}
              </div>

              {!estDerniere && (
                <p className="text-xs text-muet mt-2 px-1">
                  {restant > 1
                    ? `${restant} autres parties apparaîtront, une par une, après chaque validation.`
                    : `Dernière partie — ${tuiles[total - 1].titre} — à venir.`}
                </p>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const enteteClasses = 'flex items-center gap-2.5 px-4 py-2.5 border-b border-bordure bg-parchemin-fonce'

  return (
    <div className="space-y-3">
      {avecCases && (
        <p className="text-xs text-muet">{introMessage ?? 'Coche chaque partie pour confirmer que tu l’as lue.'}</p>
      )}

      {tuiles.map((t) => (
        <div key={t.id} className="bg-surface border border-bordure rounded-xl overflow-hidden">
          {avecCases ? (
            <label className={`${enteteClasses} cursor-pointer`}>
              <input
                type="checkbox"
                checked={cochees.has(t.id)}
                onChange={() => toggle(t.id)}
                className="h-4 w-4 shrink-0 accent-bouton cursor-pointer"
              />
              <span className="text-sm font-medium text-encre-douce">{t.titre}</span>
            </label>
          ) : (
            <div className={enteteClasses}>
              {dejaLu && <span className="text-ok text-sm" aria-hidden>✓</span>}
              <span className="text-sm font-medium text-encre-douce">{t.titre}</span>
            </div>
          )}
          <div className="p-4">{t.node}</div>
        </div>
      ))}

      {dejaLu ? (
        <div className="bg-ok-teinte border border-ok rounded-xl px-4 py-3 text-sm text-ok text-center">
          ✓ Retour lu
        </div>
      ) : (
        <>
          <button
            onClick={valider}
            disabled={pending || !toutCoche}
            className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {pending ? '…' : labelBouton ?? (multi ? 'J’ai tout lu' : 'J’ai lu mon retour')}
          </button>
          {avecCases && !toutCoche && (
            <p className="text-xs text-muet text-center">Coche les {tuiles.length} parties pour activer le bouton.</p>
          )}
          {erreur && <p className="text-retard text-sm">{erreur}</p>}
        </>
      )}
    </div>
  )
}
