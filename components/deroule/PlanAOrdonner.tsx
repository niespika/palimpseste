'use client'
// ============================================================================
// C7 — LE PLAN À ORDONNER : le cran 2 dont le trou est UN ORDRE (`10-` v0.9 :
// « le plan, dont le trou est un ordre » ; `09-` §7 : « l'ordre, écrit » — le
// geste : « Voici les thèses des parties, dans le désordre. Mets-les dans
// l'ordre, et écris entre chacune le « car » ou le « mais » qui oblige à passer
// à la suivante. »).
// ----------------------------------------------------------------------------
// ⭐ 06/09 — LES ARBITRAGES DE LOUIS sur la maquette : « il faut un trou pour le
//    mot de liaison en début de phrase, et il faut qu'on puisse déplacer les
//    moments du plan ». Chaque thèse est une carte, déplaçable par deux flèches
//    (au pouce comme à la souris — pas de glisser-déposer, qui ne marche pas sur
//    téléphone) ; devant la deuxième et les suivantes, un trou « Écris ici »
//    pour le mot qui lie. La première n'en a pas.
// ⭐ CE QUI S'ENREGISTRE : le PLAN ASSEMBLÉ (`composerLePlan`) — « Thèse A.
//    Mais thèse B. Donc thèse C. » —, dans `texte_v1` / `texte_vf` comme toute
//    production ; l'ordre et les mots n'ont pas d'autre domicile, et l'écran
//    les RELIT du texte (`lireLePlan`) au rechargement. Rien de neuf en base.
// ⚠️ Ce composant tient le contrat de `ChampDeRedaction` (télémétrie cumulée,
//    enregistrement automatique et à la demande, `onEtat`, la poignée
//    `enregistrer()`, le collage refusé) : le parent ne fait pas la différence.
//    Les mots qui lient sont des `<input>` d'un mot — pas des paragraphes : le
//    piège 24 (CRLF, `\n`) n'a pas d'objet ici.
// ============================================================================

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { composerLePlan, lireLePlan, type EtatDuPlan, type Piece } from '@/utils/gabarit/pieces'
import { nouvelleTelemetrie, accumuler, type EvenementDeSaisie } from '@/utils/deroule/telemetrie'
import type { TelemetrieSaisie } from '@/utils/deroule/types'
import { actionCollageBloque } from '@/app/deroule/actions'
import type { PoigneeDuChamp } from './ChampDeRedaction'

const AUTO_MS = 15_000
const RANGS = ['I', 'II', 'III', 'IV', 'V', 'VI']

export function PlanAOrdonner({
  depotId, theses, valeurInitiale, telemetrieInitiale = null, lectureSeule,
  onEnregistrer, apresEnregistrement, onEtat, suite = null, ref,
}: {
  depotId: string
  /** Les thèses servies, DANS LE DÉSORDRE de la banque. */
  theses: readonly Piece[]
  valeurInitiale: string
  telemetrieInitiale?: TelemetrieSaisie | null
  lectureSeule: boolean
  onEnregistrer: (texte: string, t: TelemetrieSaisie) => Promise<void>
  apresEnregistrement?: () => void
  onEtat?: (texte: string, t: TelemetrieSaisie) => void
  suite?: React.ReactNode
  ref?: Ref<PoigneeDuChamp>
}) {
  const [etat, setEtat] = useState<EtatDuPlan>(() =>
    lireLePlan(valeurInitiale, theses)
    ?? { ordre: theses.map((_, i) => i), liaisons: theses.map(() => '') })
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [enregistreA, setEnregistreA] = useState<string | null>(null)

  const texte = composerLePlan(theses, etat)
  const releve = useRef<TelemetrieSaisie>(telemetrieInitiale ?? nouvelleTelemetrie())
  const dernier = useRef<{ longueur: number; instant: number | null }>(
    { longueur: valeurInitiale.length,
      instant: telemetrieInitiale && telemetrieInitiale.sessions > 0 ? 0 : null })
  const sale = useRef(false)
  const courant = useRef(texte)

  useEffect(() => { onEtat?.(texte, releve.current) },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])

  function changer(suivant: EtatDuPlan) {
    const v = composerLePlan(theses, suivant)
    const instant = Date.now()
    const evenement: EvenementDeSaisie = {
      longueurAvant: dernier.current.longueur, longueurApres: v.length,
      instant, dernierInstant: dernier.current.instant,
    }
    releve.current = accumuler(releve.current, evenement)
    dernier.current = { longueur: v.length, instant }
    sale.current = true
    courant.current = v
    setEtat(suivant)
    onEtat?.(v, releve.current)
  }

  const bouger = (pos: number, vers: number) => {
    if (vers < 0 || vers >= etat.ordre.length) return
    const ordre = [...etat.ordre]
    ;[ordre[pos], ordre[vers]] = [ordre[vers]!, ordre[pos]!]
    // Les mots qui lient restent à leur PLACE (devant la 2e, la 3e…) : ils lient des positions.
    changer({ ordre, liaisons: etat.liaisons })
  }
  const lier = (pos: number, mot: string) => {
    const liaisons = [...etat.liaisons]
    liaisons[pos] = mot
    changer({ ordre: etat.ordre, liaisons })
  }

  const refuserLeCollage = useCallback(
    (moyen: 'raccourci' | 'glisser-deposer' | 'menu-contextuel') =>
      (e: React.SyntheticEvent) => { e.preventDefault(); void actionCollageBloque(depotId, moyen) },
    [depotId],
  )
  const marquerEnregistre = useCallback(() => setEnregistreA(
    new Date().toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })), [])

  useEffect(() => {
    if (lectureSeule) return
    const id = setInterval(() => {
      if (!sale.current) return
      sale.current = false
      void onEnregistrer(courant.current, releve.current).then(marquerEnregistre).catch(() => { sale.current = true })
    }, AUTO_MS)
    return () => clearInterval(id)
  }, [lectureSeule, onEnregistrer, marquerEnregistre])

  /** Le plan est complet quand chaque partie après la première a son mot qui lie. */
  const complet = etat.ordre.every((_, pos) => pos === 0 || (etat.liaisons[pos] ?? '').trim() !== '')

  const enregistrerMaintenant = useCallback(async (): Promise<boolean> => {
    if (enCours) return false
    if (courant.current.trim() === '') return false
    setEnCours(true); setMessage(null)
    try {
      await onEnregistrer(courant.current, releve.current)
      sale.current = false; marquerEnregistre(); return true
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'L’enregistrement a échoué.'); return false
    } finally { setEnCours(false) }
  }, [enCours, onEnregistrer, marquerEnregistre])

  useImperativeHandle(ref, () => ({ enregistrer: enregistrerMaintenant }), [enregistrerMaintenant])

  return (
    <div className="flex flex-col gap-3" data-plan>
      <ol className="flex flex-col gap-2.5" aria-label="Les thèses, à mettre dans l’ordre">
        {etat.ordre.map((idx, pos) => {
          const these = theses[idx]
          if (!these) return null
          return (
            <li
              key={idx}
              className="grid grid-cols-[auto_1fr_auto] items-start gap-2.5 rounded-[10px] border
                         border-bordure bg-surface px-3 py-2.5 font-corps text-[16.5px] leading-[1.7]"
            >
              <span className="min-w-[1.6em] pt-1 font-marque text-[12px] text-muet" aria-hidden>
                {RANGS[pos] ?? pos + 1}
              </span>
              <p className="m-0 text-encre">
                {pos > 0 && (
                  <input
                    type="text"
                    value={etat.liaisons[pos] ?? ''}
                    onChange={(e) => lier(pos, e.target.value)}
                    readOnly={lectureSeule}
                    placeholder="Écris ici"
                    aria-label="Le mot qui lie cette partie à la précédente"
                    size={7}
                    spellCheck
                    onPaste={refuserLeCollage('raccourci')}
                    onDrop={refuserLeCollage('glisser-deposer')}
                    onDragOver={(e) => e.preventDefault()}
                    onContextMenu={refuserLeCollage('menu-contextuel')}
                    style={{ backgroundColor: 'var(--pigment-teinte)' }}
                    className="mr-1.5 inline-block w-[7.5em] rounded-[6px] border-2 border-dashed
                               border-pigment/60 px-2 py-0.5 align-baseline font-corps text-[16.5px]
                               text-encre outline-none placeholder:italic placeholder:text-pigment
                               focus:border-solid focus:border-pigment"
                  />
                )}
                <span className="rounded-[5px] border border-attention/35 bg-attention-teinte px-1.5 py-0.5">
                  {these.texte}
                </span>
              </p>
              {!lectureSeule && (
                <span className="flex flex-col gap-1">
                  <button
                    type="button" onClick={() => bouger(pos, pos - 1)} disabled={pos === 0}
                    aria-label="Monter cette partie"
                    className="h-8 w-9 rounded-[6px] border border-bordure-bouton bg-surface-retrait
                               font-ui text-[13px] text-encre-douce disabled:opacity-35"
                  >↑</button>
                  <button
                    type="button" onClick={() => bouger(pos, pos + 1)} disabled={pos === etat.ordre.length - 1}
                    aria-label="Descendre cette partie"
                    className="h-8 w-9 rounded-[6px] border border-bordure-bouton bg-surface-retrait
                               font-ui text-[13px] text-encre-douce disabled:opacity-35"
                  >↓</button>
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {/* La légende — « ce bloc = telle chose » (Louis, 06/09). */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-1 font-corps text-[14px] leading-snug text-encre-douce">
        <div className="contents">
          <dt className="select-none font-ui text-[13px] text-attention" aria-hidden>▮</dt>
          <dd className="m-0">{theses[0]?.nom ?? 'une thèse'} — les flèches changent l’ordre.</dd>
        </div>
        <div className="contents">
          <dt className="select-none font-ui text-[13px] text-pigment" aria-hidden>▢</dt>
          <dd className="m-0 font-semibold text-encre">
            le mot qui lie
            <span className="font-normal text-encre-douce"> — « car », « mais », « donc »… : ce qui oblige à passer à la partie suivante. C’est ce que tu écris.</span>
          </dd>
        </div>
      </dl>

      {/* Ce qui sera rendu — le plan assemblé, tel que le lecteur le lira. */}
      <p className="rounded-[9px] border border-bordure bg-surface-retrait px-3.5 py-2.5 font-corps
                    text-[14.5px] leading-relaxed text-encre-douce">
        <span className="font-marque text-[10.5px] font-semibold uppercase tracking-[0.11em] text-muet">Ton plan, tel qu’il sera rendu · </span>
        {texte}
      </p>

      <p className="text-xs text-muet">
        <span className="text-encre-douce">
          {enregistreA ? `brouillon enregistré · ${enregistreA}` : 'enregistré tout seul'}
        </span>
        {' · '}Tu écris au clavier : <strong>le collage est désactivé</strong>.
      </p>
      {!lectureSeule && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <button
            type="button" onClick={() => { void enregistrerMaintenant().then((ok) => { if (ok) apresEnregistrement?.() }) }}
            disabled={enCours || !complet}
            className="min-h-12 shrink-0 rounded-[10px] bg-bouton px-6 py-3.5 font-ui text-[15px]
                       font-semibold text-bouton-texte disabled:opacity-40"
          >
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <p className="font-corps text-[14px] italic leading-snug text-muet">
            {complet ? suite : 'Écris le mot qui lie devant chaque partie, puis enregistre.'}
          </p>
        </div>
      )}
      {message && <p className="text-sm text-retard">{message}</p>}
    </div>
  )
}
