'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { verifierSurlignageNuance, choisirPassageAmont, comparerSyntheseAction } from '@/app/eleve/modules/aletheia/actions'
import type { RetourFinalPrepare, NuancePreparee, PairePreparee, ExtraitPassage } from '@/utils/aletheia/retour-vf-serveur'
import type { ComparaisonSynthese, NuanceDetail } from '@/utils/aletheia/retour-vf'
import { ESSAIS_MAX } from '@/utils/aletheia/fenetre'
import { phraseDuLien } from '@/utils/aletheia/retour-vf'
import { useContexteLecture } from '@/components/retours/ValidationLecture'
import { BARRE_BAS, BasculeFil, BoutonFil } from '@/components/aletheia/FilEcrans'
import { PageDuLivre } from '@/components/aletheia/PageDuLivre'

// ============================================================================
// (E7, refonte 04/09) LE RETOUR FINAL AGI — trois parties, chacune en écrans d'une tâche,
// avec SA barre du bas (bascule + un seul bouton) : la partie se clôt par ce bouton, qui
// appelle la validation de lecture (`useContexteLecture`).
//  · NuanceAgie : (C et au-dessus) surligner la phrase qui tranche → le verdict, avec la bascule
//    « Le texte / Ce que le retour dit » ; à E-D directement le verdict. Flèche ≥ 1024 px.
//  · PairesAgies : un lien par écran ; à C+ choisir parmi des libellés, le serveur confirme.
//  · SyntheseAgie : surligner ce qui manquait à ta version → la comparaison → clore.
// Rien de secret dans le navigateur : pivots et extraits amont arrivent du serveur.
// ============================================================================

const VERDICT: Record<NuanceDetail['verdict'], { libelle: string; classe: string }> = {
  confirme: { libelle: 'Le texte te donne raison', classe: 'text-ok' },
  infirme: { libelle: 'Le texte dit autre chose', classe: 'text-retard' },
  precise: { libelle: 'Le texte précise', classe: 'text-attention' },
}

function Barre({ children }: { children: React.ReactNode }) { return <div className={`${BARRE_BAS} mt-4 space-y-2`}>{children}</div> }

/** Le bouton qui clôt la partie : « J'ai lu → partie suivante », ou la clôture de la séance. */
function BoutonPartie({ label }: { label?: string }) {
  const ctx = useContexteLecture()
  if (!ctx) return null
  return (
    <>
      <BoutonFil label={ctx.pending ? '…' : (label ?? (ctx.estDerniere ? '✓ J’ai lu mon retour — clore la séance' : 'J’ai lu → partie suivante'))} onClick={ctx.estDerniere ? ctx.valider : ctx.marquerLue} disabled={ctx.pending} />
      {ctx.erreur && <p className="text-retard text-sm text-center">{ctx.erreur}</p>}
    </>
  )
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
  const [vue, setVue] = useState<0 | 1>(0)
  const [passe, setPasse] = useState(false)   // « Suivant » cliqué après un surlignage mérité
  const merite = !!pivot
  const aSurligner = !!nuance.fenetre && forme !== 'montre' && !(merite && passe)
  const v = VERDICT[nuance.verdict]

  async function verifier() {
    if (selection.length === 0) { setMessage('Surligne au moins une phrase avant de vérifier.'); return }
    setBusy(true)
    try {
      const r = await verifierSurlignageNuance(livreId, semaine, selection)
      if ('error' in r && r.error) { setMessage(r.error); return }
      if (!('verdict' in r)) { setMessage('La vérification a échoué — réessaie.'); return }
      setVerdictCode(r.verdict); setEssais(r.essais); setMessage(r.message)
      if (r.pivot) { setPivot(r.pivot); setSelection([]) }
    } catch { setMessage('La vérification a échoué — réessaie.') } finally { setBusy(false) }
  }

  const extrait = <p data-extrait className={`font-corps text-[16px] leading-relaxed text-encre rounded-lg px-3 py-2 ${merite || !nuance.fenetre ? 'bg-pigment-teinte' : 'bg-surface border border-bordure'}`}>{nuance.extrait_eleve}</p>
  const verdict = (
    <div>
      <p className={`font-ui text-sm font-medium ${v.classe}`}>{v.libelle}</p>
      {nuance.note && <p className="font-corps text-[15px] leading-relaxed text-encre mt-1">{nuance.note}</p>}
      {nuance.autres.length > 0 && (
        <details className="mt-3">
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

  // Écran A (C et au-dessus) : surligner la phrase qui tranche.
  if (aSurligner && nuance.fenetre) {
    return (
      <div>
        <p className="font-ui text-[11px] tracking-[0.08em] uppercase text-muet mb-1">Ce que tu as écrit</p>
        {extrait}
        <p className="text-xs text-muet mt-3 mb-2">{forme === 'fenetre' ? 'Cherche dans ces lignes la phrase qui tranche, surligne-la, puis vérifie.' : 'Cherche dans cette moitié de séance la phrase qui tranche, surligne-la, puis vérifie.'}</p>
        <PageDuLivre phrases={nuance.fenetre.phrases} enEvidence={pivot ?? []} selection={selection} cliquable={!merite}
          onBascule={id => { setSelection(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); setMessage(null) }} />
        {message && <p className={`text-sm mt-2 ${verdictCode === 'juste' ? 'text-ok' : 'text-attention'}`}>{message}{pivot && verdictCode !== 'juste' ? ' La phrase est maintenant surlignée.' : ''}</p>}
        <Barre>
          {merite
            ? <BoutonFil label="Ce que le retour dit →" onClick={() => setPasse(true)} />
            : <BoutonFil label={busy ? 'Vérification…' : `Vérifier${essais ? ` (essai ${essais + 1}/${ESSAIS_MAX})` : ''}`} onClick={() => { void verifier() }} disabled={busy} />}
        </Barre>
      </div>
    )
  }

  // Écran B : le verdict — ta phrase en tête ; le texte OU ce que le retour dit (bascule sur
  // téléphone ; deux colonnes et la flèche sur ordinateur).
  return (
    <div>
      <p className="font-ui text-[11px] tracking-[0.08em] uppercase text-muet mb-1">Ce que tu as écrit</p>
      <div ref={cadre} className="relative lg:grid lg:grid-cols-[2fr_3fr] lg:gap-8 lg:items-start">
        <div>
          {extrait}
          <div className={`mt-4 ${nuance.fenetre && vue === 0 ? 'hidden lg:block' : ''}`}>{verdict}</div>
        </div>
        {nuance.fenetre && (
          <div className={vue === 0 ? '' : 'hidden lg:block'}>
            <PageDuLivre phrases={nuance.fenetre.phrases} enEvidence={pivot ?? []} legende="ce que dit le texte · dans notre version" />
          </div>
        )}
        <Fleche cadre={cadre} visible={!!pivot && !!nuance.fenetre} />
      </div>
      <Barre>
        {nuance.fenetre && <div className="lg:hidden"><BasculeFil a="Le texte" b="Ce que le retour dit" actif={vue} onChange={setVue} /></div>}
        <div className={nuance.fenetre && vue === 0 ? 'hidden lg:block' : ''}><BoutonPartie /></div>
      </Barre>
    </div>
  )
}

// ── 2. Les paires amont — un lien par écran ───────────────────────────────────
function Extrait({ e, titre }: { e: ExtraitPassage; titre: string }) {
  return <PageDuLivre phrases={[{ id: e.id, texte: e.texte }]} enEvidence={[e.id]} legende={`${titre} · ${e.libelle}`} />
}

export function PairesAgies({ livreId, semaine, paires, jalons = [] }: { livreId: string; semaine: number; paires: PairePreparee[]; /** Les jalons aval, montrés sur le dernier lien. */ jalons?: string[] }) {
  const [k, setK] = useState(0)
  const [etats, setEtats] = useState<Record<number, { amont: ExtraitPassage | null; juste?: boolean; choix?: string; message?: string; busy: boolean }>>(
    () => Object.fromEntries(paires.map(p => [p.index, { amont: p.amont, juste: p.etat.juste, choix: p.etat.choix, busy: false }])))
  const paire = paires[Math.min(k, paires.length - 1)]
  if (!paire) return null
  const e = etats[paire.index]
  const maj = (patch: Partial<typeof e>) => setEtats(x => ({ ...x, [paire.index]: { ...x[paire.index], ...patch } }))
  const dernier = k >= paires.length - 1

  async function choisir(id: string) {
    maj({ busy: true, choix: id })
    try {
      const r = await choisirPassageAmont(livreId, semaine, paire.index, id)
      if ('error' in r && r.error) { maj({ message: r.error, busy: false }); return }
      if (!('juste' in r)) { maj({ message: 'Le choix n’a pas pu être vérifié — réessaie.', busy: false }); return }
      maj({ juste: r.juste, amont: r.amont ?? null, busy: false })
    } catch { maj({ message: 'Le choix n’a pas pu être vérifié — réessaie.', busy: false }) }
  }

  return (
    <div>
      <p className="font-ui text-[11px] tracking-[0.08em] uppercase text-muet mb-1">Lien {k + 1} sur {paires.length}</p>
      <p className="font-corps text-[16px] leading-relaxed text-encre mb-3">{phraseDuLien(paire.relation, paire.amont?.semaine ?? paire.options[0]?.semaine ?? null)}</p>
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-3 lg:space-y-0">
        <Extrait e={paire.courant} titre={`cette séance`} />
        {e.amont
          ? <Extrait e={e.amont} titre={`déjà lu · séance ${e.amont.semaine}`} />
          : (
            <div>
              <p className="text-sm text-encre-douce mb-2">Quel passage déjà lu répond à celui-ci ?</p>
              <ul className="space-y-1.5">
                {paire.options.map(o => (
                  <li key={o.id}>
                    <button type="button" disabled={e.busy} onClick={() => { void choisir(o.id) }}
                      className={`w-full text-left text-[15px] font-corps leading-snug px-3 py-2.5 rounded-lg border ${e.choix === o.id ? 'border-pigment bg-pigment-teinte' : 'border-bordure bg-surface hover:bg-pigment-teinte/40'} disabled:opacity-60`}>
                      <span className="font-ui text-xs text-muet mr-2">séance {o.semaine}</span>{o.libelle}
                    </button>
                  </li>
                ))}
              </ul>
              {e.message && <p className="text-xs text-attention mt-2">{e.message}</p>}
            </div>
          )}
      </div>
      {e.juste !== undefined && e.amont && (
        <p className={`text-sm mt-3 ${e.juste ? 'text-ok' : 'text-attention'}`}>{e.juste ? 'C’est celui-là.' : 'Ce n’était pas celui-là : voici le passage qui répond.'}</p>
      )}
      {dernier && e.amont && jalons.length > 0 && (
        <div className="mt-4 pt-3 border-t border-bordure">
          <p className="font-ui text-[11px] tracking-[0.08em] uppercase text-muet mb-1">Jalons à venir</p>
          <ul className="list-disc list-inside space-y-1 font-corps text-[15px] leading-relaxed text-encre-douce">{jalons.map((x, i) => <li key={i}>{x}</li>)}</ul>
        </div>
      )}
      <Barre>
        {e.amont
          ? (dernier ? <BoutonPartie /> : <BoutonFil label="Lien suivant →" onClick={() => setK(k + 1)} />)
          : <BoutonFil label="Choisis un passage ci-dessus" disabled />}
        {k > 0 && <button type="button" onClick={() => setK(k - 1)} className="w-full min-h-9 text-xs text-muet hover:text-encre-douce">← Lien précédent</button>}
      </Barre>
    </div>
  )
}

// ── 3. La synthèse à surligner ────────────────────────────────────────────────
export function SyntheseAgie({ livreId, semaine, phrases, comparaison: initiale }: { livreId: string; semaine: number; phrases: { id: string; texte: string }[]; comparaison: ComparaisonSynthese | null }) {
  const [selection, setSelection] = useState<string[]>(initiale?.surlignage ?? [])
  const [comparaison, setComparaison] = useState<ComparaisonSynthese | null>(initiale)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const manques = comparaison?.manques ?? [], reperes = comparaison?.reperes ?? []

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
    <div>
      <p className="text-sm text-encre-douce mb-2">{comparaison ? comparaison.message : 'Surligne ce que cette synthèse dit et que ta version ne disait pas. Touche les phrases, puis compare.'}</p>
      <PageDuLivre phrases={phrases} legende="la synthèse modèle" cliquable={!comparaison}
        enEvidence={comparaison ? manques : []} selection={comparaison ? reperes : selection}
        onBascule={id => { setSelection(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); setMessage(null) }} />
      {comparaison && (
        <p className="text-xs text-muet mt-2">
          <span className="bg-attention-teinte px-1 rounded">orangé</span> = manque que tu as repéré ·
          <span className="bg-pigment-teinte px-1 rounded ml-1">bleu</span> = manque qui t’a échappé.
        </p>
      )}
      {message && <p className="text-xs text-attention mt-2">{message}</p>}
      <Barre>
        {comparaison
          ? <BoutonPartie />
          : <BoutonFil label={busy ? 'Comparaison…' : selection.length ? 'Comparer' : 'Rien ne manquait — comparer'} onClick={() => { void comparer() }} disabled={busy} />}
      </Barre>
    </div>
  )
}
