'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { verifierSurlignageNuance, choisirPassageAmont, comparerSyntheseAction } from '@/app/eleve/modules/aletheia/actions'
import type { RetourFinalPrepare, NuancePreparee, PairePreparee, ExtraitPassage } from '@/utils/aletheia/retour-vf-serveur'
import type { ComparaisonSynthese, NuanceDetail } from '@/utils/aletheia/retour-vf'
import { ESSAIS_MAX } from '@/utils/aletheia/fenetre'

// ============================================================================
// (E7) LE RETOUR FINAL AGI — trois morceaux d'écran, un par tuile du retour final.
//  · NuanceAgie : la phrase de l'élève à gauche, le texte à droite, la pivot surlignée,
//    UNE flèche à partir de 1024 px (même dessin que la copie annotée) ; en dessous, la
//    couleur partagée tient lieu de flèche. À C et au-dessus, l'élève surligne d'abord.
//  · PairesAgies : les liens amont en paires d'extraits ; à C et au-dessus l'élève choisit
//    parmi des libellés, le serveur confirme, puis la paire s'affiche.
//  · SyntheseAgie : la synthèse par phrases, à surligner ; le code compare aux manques.
// Rien de secret dans le navigateur : pivots et extraits amont arrivent du serveur.
// ============================================================================

const VERDICT: Record<NuanceDetail['verdict'], { libelle: string; classe: string }> = {
  confirme: { libelle: 'Le texte te donne raison', classe: 'text-ok' },
  infirme: { libelle: 'Le texte dit autre chose', classe: 'text-retard' },
  precise: { libelle: 'Le texte précise', classe: 'text-attention' },
}

// ── LA flèche — une seule, de l'extrait de l'élève à la pivot, à partir de 1024 px ──
function Fleche({ cadre, visible }: { cadre: React.RefObject<HTMLDivElement | null>; visible: boolean }) {
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
    const dessiner = () => {
      const c = cadre.current
      if (!visible || !large || !c) { setTrace(null); return }
      const e = c.querySelector<HTMLElement>('[data-extrait]'), p = c.querySelector<HTMLElement>('[data-pivot]')
      if (!e || !p) { setTrace(null); return }
      const rc = c.getBoundingClientRect(), re = e.getBoundingClientRect(), rp = p.getBoundingClientRect()
      const x1 = re.right - rc.left, y1 = re.top + re.height / 2 - rc.top
      const x2 = rp.left - rc.left, y2 = rp.top + rp.height / 2 - rc.top
      const dx = Math.max(24, (x2 - x1) / 2)
      setTrace({ d: `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`, x1, y1, x2, y2 })
    }
    const demander = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(dessiner) }
    demander()
    window.addEventListener('resize', demander)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', demander) }
  }, [visible, large, cadre])
  if (!trace) return null
  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <path d={trace.d} fill="none" stroke="var(--pigment)" strokeWidth={2} strokeDasharray="4 3" />
      <circle cx={trace.x1} cy={trace.y1} r={3} fill="var(--pigment)" />
      <circle cx={trace.x2} cy={trace.y2} r={3} fill="var(--pigment)" />
    </svg>
  )
}

// ── 1. La nuance prioritaire ──────────────────────────────────────────────────
export function NuanceAgie({ livreId, semaine, nuance, forme }: { livreId: string; semaine: number; nuance: NuancePreparee; forme: RetourFinalPrepare['forme'] }) {
  const cadre = useRef<HTMLDivElement>(null)
  const [pivot, setPivot] = useState<string[] | null>(nuance.pivot)
  const [selection, setSelection] = useState<string[]>([])
  const [essais, setEssais] = useState(nuance.etat.essais)
  const [verdictCode, setVerdictCode] = useState<string | undefined>(nuance.etat.verdict_code)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const aSurligner = !!nuance.fenetre && forme !== 'montre' && !pivot
  const v = VERDICT[nuance.verdict]
  const pivotSet = new Set(pivot ?? [])
  const selSet = new Set(selection)

  async function verifier() {
    if (selection.length === 0) { setMessage('Touche au moins une phrase avant de vérifier.'); return }
    setBusy(true)
    try {
      const r = await verifierSurlignageNuance(livreId, semaine, selection)
      if ('error' in r && r.error) { setMessage(r.error); return }
      if (!('verdict' in r)) { setMessage('La vérification a échoué — réessaie.'); return }
      setVerdictCode(r.verdict); setEssais(r.essais); setMessage(r.message)
      if (r.pivot) { setPivot(r.pivot); setSelection([]) }
    } catch { setMessage('La vérification a échoué — réessaie.') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <div ref={cadre} className="relative grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 lg:gap-8">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muet mb-1">Ce que tu as écrit</p>
          <p data-extrait className={`font-corps text-[15px] leading-relaxed text-encre rounded px-1 ${pivot ? 'bg-pigment-teinte' : ''}`}>{nuance.extrait_eleve}</p>
        </div>
        <div>
          {nuance.fenetre ? (
            <div className="bg-parchemin border border-bordure rounded-lg px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muet mb-1.5">
                {pivot ? 'Ce que dit le texte, dans notre version' : forme === 'fenetre' ? 'Cherche la phrase qui tranche dans ces lignes — touche-la pour la surligner' : 'Cherche la phrase qui tranche dans cette moitié de séance — touche-la pour la surligner'}
              </p>
              <p className="font-corps text-[15px] leading-relaxed text-encre">
                {nuance.fenetre.phrases.map(ph => {
                  const evid = pivotSet.has(ph.id), sel = selSet.has(ph.id)
                  const cls = evid ? 'bg-pigment-teinte rounded px-0.5 shadow-[inset_0_-2px_0_var(--pigment)]' : sel ? 'bg-attention-teinte rounded px-0.5' : ''
                  const premierePivot = evid && (pivot ?? [])[0] === ph.id
                  const basculer = () => { setSelection(s => sel ? s.filter(x => x !== ph.id) : [...s, ph.id]); setMessage(null) }
                  return aSurligner
                    ? <span key={ph.id} data-phrase={ph.id} role="button" tabIndex={0} aria-pressed={sel} onClick={basculer}
                        onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); basculer() } }}
                        className={`cursor-pointer ${cls} hover:bg-attention-teinte/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded`}>{ph.texte} </span>
                    : <span key={ph.id} data-phrase={ph.id} {...(premierePivot ? { 'data-pivot': true } : {})} className={cls}>{ph.texte} </span>
                })}
              </p>
              {aSurligner && (
                <div className="flex items-center gap-3 flex-wrap mt-2">
                  <button type="button" onClick={verifier} disabled={busy}
                    className="bg-bouton text-surface px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
                    {busy ? 'Vérification…' : `Vérifier${essais ? ` (essai ${essais + 1}/${ESSAIS_MAX})` : ''}`}
                  </button>
                  {message && <p className={`text-xs ${verdictCode === 'juste' ? 'text-ok' : 'text-attention'}`}>{message}</p>}
                </div>
              )}
              {!aSurligner && message && <p className={`text-xs mt-2 ${verdictCode === 'juste' ? 'text-ok' : 'text-attention'}`}>{message}{verdictCode !== 'juste' ? ' La phrase est maintenant surlignée.' : ''}</p>}
            </div>
          ) : (
            <p className="text-sm text-encre-douce">{nuance.note}</p>
          )}
        </div>
        <Fleche cadre={cadre} visible={!!pivot && !!nuance.fenetre} />
      </div>
      {(pivot || !nuance.fenetre) && (
        <div className="bg-surface border border-bordure rounded-lg px-3 py-2">
          <p className={`text-xs font-medium ${v.classe}`}>{v.libelle}</p>
          {nuance.fenetre && nuance.note && <p className="text-sm text-encre-douce mt-1">{nuance.note}</p>}
        </div>
      )}
      {nuance.autres.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-muet hover:text-encre">{nuance.autres.length === 1 ? 'Une autre nuance' : `${nuance.autres.length} autres nuances`}</summary>
          <ul className="mt-2 space-y-2">
            {nuance.autres.map((n, i) => (
              <li key={i} className="text-sm border-l-2 border-bordure pl-3">
                <p className="text-encre-douce italic">« {n.extrait_eleve} »</p>
                <p className="text-encre"><span className={`text-xs font-medium ${VERDICT[n.verdict].classe}`}>{VERDICT[n.verdict].libelle}</span>{n.note ? ` — ${n.note}` : ''}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

// ── 2. Les paires amont ───────────────────────────────────────────────────────
function Extrait({ e, titre, teinte }: { e: ExtraitPassage; titre: string; teinte: boolean }) {
  return (
    <div className={`rounded-lg border border-bordure px-3 py-2.5 ${teinte ? 'bg-pigment-teinte/40' : 'bg-parchemin'}`}>
      <p className="text-[11px] uppercase tracking-wide text-muet mb-1">{titre}</p>
      <p className="font-corps text-[15px] leading-relaxed text-encre">{e.texte}</p>
      <p className="text-xs text-muet mt-1">{e.libelle}</p>
    </div>
  )
}

function PaireAgie({ livreId, semaine, paire }: { livreId: string; semaine: number; paire: PairePreparee }) {
  const [amont, setAmont] = useState<ExtraitPassage | null>(paire.amont)
  const [juste, setJuste] = useState<boolean | undefined>(paire.etat.juste)
  const [choix, setChoix] = useState<string | undefined>(paire.etat.choix)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function choisir(id: string) {
    setBusy(true); setChoix(id)
    try {
      const r = await choisirPassageAmont(livreId, semaine, paire.index, id)
      if ('error' in r && r.error) { setMessage(r.error); return }
      if (!('juste' in r)) { setMessage('Le choix n’a pas pu être vérifié — réessaie.'); return }
      setJuste(r.juste); setAmont(r.amont ?? null)
    } catch { setMessage('Le choix n’a pas pu être vérifié — réessaie.') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-encre"><span className="text-xs uppercase tracking-wide text-muet mr-2">Lien</span>{paire.relation}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Extrait e={paire.courant} titre={`Cette séance (${paire.courant.semaine})`} teinte />
        {amont
          ? <Extrait e={amont} titre={`Déjà lu — séance ${amont.semaine}`} teinte />
          : (
            <div className="bg-parchemin border border-bordure rounded-lg px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muet mb-1.5">Quel passage déjà lu répond à celui-ci ?</p>
              <ul className="space-y-1.5">
                {paire.options.map(o => (
                  <li key={o.id}>
                    <button type="button" disabled={busy} onClick={() => choisir(o.id)}
                      className={`w-full text-left text-sm px-2.5 py-1.5 rounded-lg border ${choix === o.id ? 'border-pigment bg-pigment-teinte' : 'border-bordure bg-surface hover:bg-pigment-teinte/40'} disabled:opacity-60`}>
                      <span className="text-xs text-muet mr-2">séance {o.semaine}</span>{o.libelle}
                    </button>
                  </li>
                ))}
              </ul>
              {message && <p className="text-xs text-attention mt-2">{message}</p>}
            </div>
          )}
      </div>
      {juste !== undefined && amont && (
        <p className={`text-xs ${juste ? 'text-ok' : 'text-attention'}`}>{juste ? 'C’est celui-là.' : 'Ce n’était pas celui-là : voici le passage qui répond.'}</p>
      )}
    </div>
  )
}

export function PairesAgies({ livreId, semaine, paires }: { livreId: string; semaine: number; paires: PairePreparee[] }) {
  return (
    <div className="space-y-4">
      {paires.map(p => <PaireAgie key={p.index} livreId={livreId} semaine={semaine} paire={p} />)}
    </div>
  )
}

// ── 3. La synthèse à surligner ────────────────────────────────────────────────
export function SyntheseAgie({ livreId, semaine, phrases, comparaison: initiale }: { livreId: string; semaine: number; phrases: { id: string; texte: string }[]; comparaison: ComparaisonSynthese | null }) {
  const [selection, setSelection] = useState<string[]>(initiale?.surlignage ?? [])
  const [comparaison, setComparaison] = useState<ComparaisonSynthese | null>(initiale)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const selSet = new Set(selection)
  const manques = new Set(comparaison?.manques ?? []), reperes = new Set(comparaison?.reperes ?? []), dejaLa = new Set(comparaison?.deja_la ?? [])

  async function comparer() {
    setBusy(true)
    try {
      const r = await comparerSyntheseAction(livreId, semaine, selection)
      if ('error' in r && r.error) { setMessage(r.error); return }
      if (!('comparaison' in r) || !r.comparaison) { setMessage('La comparaison a échoué — réessaie.'); return }
      setComparaison(r.comparaison)
    } catch { setMessage('La comparaison a échoué — réessaie.') } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-encre-douce">{comparaison ? 'Ta comparaison :' : 'Surligne ce que cette synthèse dit et que ta version ne disait pas. Touche les phrases, puis compare.'}</p>
      <p className="font-corps text-base leading-relaxed text-encre">
        {phrases.map(ph => {
          const sel = selSet.has(ph.id)
          const cls = comparaison
            ? manques.has(ph.id) ? 'bg-attention-teinte rounded px-0.5 shadow-[inset_0_-2px_0_var(--attention)]'
              : reperes.has(ph.id) ? 'bg-ok-teinte rounded px-0.5'
              : dejaLa.has(ph.id) ? 'bg-pigment-teinte/50 rounded px-0.5 line-through decoration-muet'
              : ''
            : sel ? 'bg-pigment-teinte rounded px-0.5 shadow-[inset_0_-2px_0_var(--pigment)]' : ''
          const basculer = () => { setSelection(s => sel ? s.filter(x => x !== ph.id) : [...s, ph.id]); setMessage(null) }
          return comparaison
            ? <span key={ph.id} data-phrase={ph.id} className={cls}>{ph.texte} </span>
            : <span key={ph.id} data-phrase={ph.id} role="button" tabIndex={0} aria-pressed={sel} onClick={basculer}
                onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); basculer() } }}
                className={`cursor-pointer ${cls} hover:bg-pigment-teinte/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded`}>{ph.texte} </span>
        })}
      </p>
      {comparaison ? (
        <div className="text-sm">
          <p className="text-encre">{comparaison.message}</p>
          <p className="text-xs text-muet mt-1">
            <span className="bg-ok-teinte px-1 rounded">vert</span> = manque repéré ·
            <span className="bg-attention-teinte px-1 rounded ml-1">orangé</span> = manque qui t’a échappé ·
            <span className="bg-pigment-teinte/50 px-1 rounded ml-1 line-through">barré</span> = tu l’avais déjà.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" onClick={comparer} disabled={busy}
            className="bg-bouton text-surface px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 disabled:opacity-50">
            {busy ? 'Comparaison…' : selection.length ? 'Comparer' : 'Rien ne manquait — comparer'}
          </button>
          {message && <p className="text-xs text-attention">{message}</p>}
        </div>
      )}
    </div>
  )
}
