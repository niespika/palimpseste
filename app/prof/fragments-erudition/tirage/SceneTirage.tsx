'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { tirerOrateur } from '../actions'
import { cadenceDefilement, formaterDuree, messageTirage, suiteDuRalenti } from '@/utils/fragments-oral'

export interface CandidatTirage {
  id: string
  nom: string
  theme: string | null
  nbPresentations: number
}

export interface TireDuJour {
  presentationId: string
  eleveId: string
  nom: string
  theme: string | null
  statut: 'tire' | 'presente' | 'reporte'
}

interface Props {
  semaineId: string
  classeId: string
  classeNom: string
  semaineLibelle: string
  dureeSecondes: number
  candidats: CandidatTirage[]
  tiresInitiaux: TireDuJour[]
}

type Phase = 'attente' | 'defile' | 'revele'

// Le corps du sujet suit sa longueur : mesuré en prod le 15/09, 27 à 285
// caractères (médiane 86). À 292 caractères en 4xl, le temps imparti passait
// sous le pli d'un projecteur 1280 × 720 ; en 2xl il tient.
function tailleSujet(theme: string): string {
  if (theme.length <= 120) return 'text-2xl sm:text-3xl lg:text-4xl'
  if (theme.length <= 200) return 'text-xl sm:text-2xl lg:text-3xl'
  return 'text-lg sm:text-xl lg:text-2xl'
}

// ----------------------------------------------------------------------------
// La scène : ce que la classe voit sur le projecteur. Trois moments — l'attente
// (un bouton), le défilement des noms, la révélation (le nom, un petit mot, le
// sujet, le temps imparti). Les réglages (exclure un élève, la liste des tirés)
// vivent dans un pli en bas, fermé par défaut, pour ne pas encombrer l'écran.
// ----------------------------------------------------------------------------
export default function SceneTirage({ semaineId, classeId, classeNom, semaineLibelle, dureeSecondes, candidats, tiresInitiaux }: Props) {
  const [phase, setPhase] = useState<Phase>('attente')
  const [affiche, setAffiche] = useState<string>('')
  const [gagnant, setGagnant] = useState<TireDuJour | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [tires, setTires] = useState<TireDuJour[]>(tiresInitiaux)
  const [excluIds, setExcluIds] = useState<Set<string>>(new Set())
  const [erreur, setErreur] = useState<string | null>(null)
  const [pleinEcran, setPleinEcran] = useState(false)
  const cadreRef = useRef<HTMLDivElement>(null)
  // Toutes les minuteries d'un tirage (défilement rapide, suspense, ralenti) :
  // vidées au tirage suivant et au démontage — revue 15/09.
  const minuteriesRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const monteRef = useRef(true)
  const enCoursRef = useRef(false)

  function purgerMinuteries() {
    minuteriesRef.current.forEach(clearTimeout)
    minuteriesRef.current = []
  }

  useEffect(() => {
    monteRef.current = true
    const onChange = () => setPleinEcran(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      monteRef.current = false
      document.removeEventListener('fullscreenchange', onChange)
      purgerMinuteries()
    }
  }, [])

  const dejaTires = new Set(tires.map(t => t.eleveId))
  const enLice = candidats.filter(c => !excluIds.has(c.id) && !dejaTires.has(c.id))

  function toggleExclu(id: string) {
    setExcluIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function basculerPleinEcran() {
    const el = cadreRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await el.requestFullscreen()
    } catch {
      // Navigateur sans plein écran (iPhone) : la page reste telle quelle.
    }
  }

  async function tirer() {
    if (enCoursRef.current) return
    setErreur(null)
    const noms = enLice.map(c => c.nom)
    if (noms.length === 0) { setErreur('Plus personne à tirer : tous les élèves ayant déposé sont tirés ou exclus.'); return }
    enCoursRef.current = true
    purgerMinuteries()
    setPhase('defile')
    setGagnant(null)

    // Le défilement rapide, le temps que le serveur tire.
    let i = Math.floor(Math.random() * noms.length)
    setAffiche(noms[i])
    const rapide = setInterval(() => { i = (i + 1) % noms.length; setAffiche(noms[i]) }, 70)
    minuteriesRef.current.push(rapide as unknown as ReturnType<typeof setTimeout>)

    let res: Awaited<ReturnType<typeof tirerOrateur>>
    try {
      const exclus = [...excluIds, ...dejaTires]
      const debut = Date.now()
      res = await tirerOrateur(semaineId, classeId, exclus)
      // Au moins une seconde de suspense, même si le serveur répond vite.
      const reste = Math.max(0, 1000 - (Date.now() - debut))
      await new Promise<void>(r => { minuteriesRef.current.push(setTimeout(r, reste)) })
    } catch (e) {
      // Session expirée, réseau coupé : on ne laisse pas les noms défiler à jamais.
      res = { error: e instanceof Error ? e.message : 'Le tirage a échoué.', data: null }
    } finally {
      clearInterval(rapide)
    }
    if (!monteRef.current) { enCoursRef.current = false; return }

    if (res.error || !res.data?.eleve?.id) {
      enCoursRef.current = false
      setPhase('attente')
      setErreur(res.error ?? 'Le tirage a échoué.')
      return
    }
    const eleveId = res.data.eleve.id
    const candidat = candidats.find(c => c.id === eleveId)
    const nouveau: TireDuJour = {
      presentationId: res.data.presentationId,
      eleveId,
      nom: candidat?.nom ?? res.data.eleve.display_name ?? '—',
      theme: candidat?.theme ?? null,
      statut: 'tire',
    }

    // Le ralenti : quatorze noms de plus en plus lents, le dernier est le bon.
    const suite = suiteDuRalenti(noms, nouveau.nom)
    let delai = 0
    suite.forEach((nom, k) => {
      delai += cadenceDefilement(k, suite.length)
      minuteriesRef.current.push(setTimeout(() => setAffiche(nom), delai))
    })
    minuteriesRef.current.push(setTimeout(() => {
      enCoursRef.current = false
      setGagnant(nouveau)
      setMessage(prev => messageTirage(prev))
      setTires(prev => [...prev, nouveau])
      setPhase('revele')
    }, delai + 350))
  }

  const minutes = Math.round(dureeSecondes / 60)

  return (
    <div ref={cadreRef} className={`bg-parchemin text-encre flex flex-col ${pleinEcran ? 'min-h-screen p-6 sm:p-12' : 'min-h-[80vh]'}`}>
      {/* La barre du prof — discrète, hors de la scène */}
      <div className="flex items-center justify-between gap-3 font-ui text-sm text-muet flex-wrap">
        <Link href={`/prof/fragments-erudition?semaine=${semaineId}&classe=${classeId}`} className="hover:text-encre-douce">
          ← {semaineLibelle} · {classeNom}
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline">{candidats.length} dépôt{candidats.length > 1 ? 's' : ''} · {enLice.length} en lice</span>
          <button onClick={basculerPleinEcran} aria-pressed={pleinEcran} className="border border-bordure-bouton px-3 py-1 rounded-lg hover:bg-parchemin-fonce transition-colors">
            {pleinEcran ? 'Quitter le plein écran' : 'Plein écran'}
          </button>
        </div>
      </div>

      {/* La scène */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 sm:gap-6 py-6 px-2" aria-live="polite">
        {phase === 'attente' && (
          <>
            <p className="font-ui text-xs sm:text-sm uppercase tracking-[0.3em] text-muet">Présentation orale · {classeNom}</p>
            <h1 className="font-serif text-4xl sm:text-6xl text-encre">Tirage au sort</h1>
            {candidats.length === 0 ? (
              <p className="text-lg text-muet italic max-w-xl">Personne n’a déposé de fragment cette semaine — il n’y a rien à tirer.</p>
            ) : (
              <p className="text-lg sm:text-xl text-encre-douce max-w-xl">
                {enLice.length} élève{enLice.length > 1 ? 's' : ''} en lice
                {tires.length > 0 ? ` · ${tires.length} déjà tiré${tires.length > 1 ? 's' : ''}` : ''}
              </p>
            )}
            <button
              onClick={tirer}
              disabled={enLice.length === 0}
              className="bg-bouton text-bouton-texte font-ui text-lg sm:text-2xl px-8 sm:px-12 py-3 sm:py-4 rounded-2xl hover:opacity-90 disabled:opacity-40 transition-colors shadow-sm"
            >
              {tires.length > 0 ? 'Relancer le tirage' : 'Tirer au sort'}
            </button>
          </>
        )}

        {phase !== 'attente' && <h1 className="sr-only">Tirage au sort · {classeNom}</h1>}
        {phase === 'defile' && (
          <>
            <p className="font-ui text-xs sm:text-sm uppercase tracking-[0.3em] text-muet">Le sort hésite…</p>
            <p className="font-serif text-5xl sm:text-7xl lg:text-8xl text-encre-douce blur-[0.5px] break-words max-w-full px-4">{affiche}</p>
          </>
        )}

        {phase === 'revele' && gagnant && (
          <>
            <p className="font-ui text-xs sm:text-sm uppercase tracking-[0.3em] text-pigment">C’est à toi</p>
            <p className="font-serif text-5xl sm:text-7xl lg:text-8xl text-encre break-words max-w-full px-4">{gagnant.nom}</p>
            {message && <p className="font-serif italic text-2xl sm:text-3xl text-encre max-w-3xl">{message}</p>}
            <div className="mt-1 sm:mt-2 w-full max-w-4xl bg-surface border border-bordure rounded-2xl px-6 sm:px-10 py-5 sm:py-6">
              <p className="font-ui text-xs uppercase tracking-[0.25em] text-muet mb-3">Ton sujet</p>
              {gagnant.theme ? (
                <p className={`font-serif leading-snug text-encre text-balance ${tailleSujet(gagnant.theme)}`}>{gagnant.theme}</p>
              ) : (
                <p className="text-lg text-muet italic">Aucun sujet enregistré pour ce semestre.</p>
              )}
            </div>
            <p className="font-ui text-base sm:text-xl text-encre-douce">
              Tu as <span className="font-medium text-encre">{minutes} minutes</span>
              <span className="text-muet"> ({formaterDuree(dureeSecondes)})</span>.
            </p>
            <button onClick={tirer} disabled={enLice.length === 0} className="mt-4 font-ui text-sm text-muet hover:text-encre-douce underline disabled:opacity-40 disabled:no-underline">
              {enLice.length === 0 ? 'Plus personne à tirer' : 'Relancer un tirage'}
            </button>
          </>
        )}

        {erreur && <p className="text-sm text-retard">{erreur}</p>}
      </div>

      {/* Les réglages — fermés par défaut ; en plein écran ils restent là, discrets,
          pour exclure un absent sans sortir de la projection */}
      {(
        <details className={`group bg-surface border border-bordure rounded-xl ${pleinEcran ? 'opacity-60 hover:opacity-100' : ''}`}>
          <summary className="cursor-pointer select-none px-4 py-2.5 font-ui text-sm text-encre-douce hover:text-encre flex items-center gap-2">
            <span className="text-muet-clair transition-transform group-open:rotate-90" aria-hidden="true">›</span>
            Réglages du tirage — exclure, déjà tirés
          </summary>
          <div className="px-4 pb-4 space-y-4">
            {tires.length > 0 && (
              <div>
                <p className="font-ui text-xs text-muet uppercase tracking-wide mb-2">Tirés cette semaine</p>
                <ul className="space-y-1 text-sm">
                  {tires.map(t => (
                    <li key={t.presentationId} className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-encre">{t.nom}</span>
                      <span className={`font-ui text-[11px] px-2 py-0.5 rounded-full ${
                        t.statut === 'presente' ? 'bg-ok-teinte text-ok' : t.statut === 'reporte' ? 'bg-attention-teinte text-attention' : 'bg-info-teinte text-info'
                      }`}>
                        {t.statut === 'presente' ? 'A présenté ✓' : t.statut === 'reporte' ? 'Reporté' : 'Tiré'}
                      </span>
                      <Link href={`/prof/fragments-erudition/presentation/${t.presentationId}`} className="font-ui text-xs text-muet hover:text-encre-douce underline">
                        Fiche · enregistrer
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="font-ui text-xs text-muet-clair mt-1">« A présenté », « Reporter », « Retirer » : dans l’onglet Semaine.</p>
              </div>
            )}
            <div>
              <p className="font-ui text-xs text-muet mb-2">
                Élèves ayant déposé ({enLice.length} en lice sur {candidats.length}) — décocher pour exclure :
              </p>
              <div className="flex flex-wrap gap-2">
                {candidats.map(c => {
                  const tire = dejaTires.has(c.id)
                  const exclu = excluIds.has(c.id)
                  return (
                    <label key={c.id} className={`inline-flex items-center gap-1.5 font-ui text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      tire ? 'bg-info-teinte border-bordure text-info cursor-default'
                        : exclu ? 'bg-parchemin-fonce border-bordure text-muet line-through cursor-pointer'
                        : 'bg-surface border-bordure text-encre-douce hover:border-pigment cursor-pointer'
                    }`}>
                      <input type="checkbox" checked={!exclu && !tire} disabled={tire} onChange={() => toggleExclu(c.id)} className="sr-only" />
                      {c.nom}
                      {c.nbPresentations > 0 && <span className="text-muet">({c.nbPresentations}×)</span>}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </details>
      )}
    </div>
  )
}
