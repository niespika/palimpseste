'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { construireDecoupeSemaine, rendreTranche } from '@/utils/aletheia/decoupage'
import { bornesPassage, MAX_PASSAGES, type PassageCle } from '@/utils/aletheia/passages'
import { genererPassagesCles, realignerPassagesCles } from '../actions'
import { BADGE, BTN_SECONDAIRE_SM, CHAMP, INTITULE } from './ui'

// ============================================================================
// (E4) Les passages clés d'une séance, côté prof : lecture (passage rendu, pivots
// surlignées), édition (bornes par phrases entières, pivots par alternatives,
// libellé), génération IA et ré-alignement. La découpe est RECALCULÉE depuis le
// texte courant de la séance (module pur) : un passage dont la version diffère est
// marqué « périmé » — rien n'est deviné, le ré-alignement se demande.
// ============================================================================

interface Props {
  livreId: string
  semaine: number
  texte: string | null
  passages: PassageCle[]
  /** Empreinte de la découpe stockée en base (null ⇒ pas de découpe : périmé partout). */
  versionDecoupe: string | null
  mode: 'lecture' | 'edition'
  onChange?: (p: PassageCle[]) => void
  /** Lecture : la génération IA est possible (fiche prête). */
  peutGenerer?: boolean
}

const ROLES = ['these', 'argument:1', 'argument:2', 'argument:3', 'argument:4', 'argument:5', 'concept', 'reponse']

export default function PassagesCles({ livreId, semaine, texte, passages, versionDecoupe, mode, onChange, peutGenerer }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const d = useMemo(() => construireDecoupeSemaine(semaine, texte ?? ''), [semaine, texte])
  const rendu = (id: string) => { const p = d.phrases.find(x => x.id === id); return p ? rendreTranche(texte ?? '', p.bornes, d.masques) : '' }
  const perime = (p: PassageCle) => !versionDecoupe || p.decoupage_version !== versionDecoupe
  const idxDe = (id: string) => d.phrases.findIndex(x => x.id === id)

  async function generer() {
    setBusy(true); setMsg(null)
    try {
      const r = await genererPassagesCles(livreId, [semaine])
      setMsg(r.error ?? r.resume ?? null)
      if (r.success) router.refresh()
    } finally { setBusy(false) }
  }
  async function realigner() {
    setBusy(true); setMsg(null)
    try {
      const r = await realignerPassagesCles(livreId)
      setMsg(r.error ?? r.resume ?? null)
      if (r.success) router.refresh()
    } finally { setBusy(false) }
  }

  // ── Lecture ────────────────────────────────────────────────────────────────
  if (mode === 'lecture') {
    return (
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-[7px]">
          <div className={INTITULE}>Passages clés</div>
          <span className="font-corps italic text-[12.5px] text-muet-clair">ce que le retour V1 désigne ; montrés à E-D, à chercher à C-B-A</span>
          {peutGenerer && (
            <button type="button" onClick={generer} disabled={busy} className={`${BTN_SECONDAIRE_SM} ml-auto`}>
              {busy ? 'Génération…' : passages.length ? '↻ Régénérer (IA)' : '✦ Générer les passages (IA)'}
            </button>
          )}
          {passages.some(perime) && (
            <button type="button" onClick={realigner} disabled={busy} className={BTN_SECONDAIRE_SM}>⇄ Ré-aligner sur le texte</button>
          )}
        </div>
        {msg && <p className="font-ui text-xs text-encre-douce mb-2">{msg}</p>}
        {passages.length === 0 ? (
          <p className="font-corps italic text-[14px] text-muet">Aucun passage clé pour cette séance.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {passages.map(p => {
              const b = bornesPassage(d, p)
              const pivotIds = new Set(p.pivots.flat())
              return (
                <div key={p.id} className={`border rounded-[9px] px-[13px] py-2.5 ${p.revoir || perime(p) ? 'border-attention bg-attention-teinte/30' : 'border-bordure bg-parchemin'}`}>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`${BADGE} bg-pigment-teinte text-pigment`}>{p.role}</span>
                    <span className="font-corps text-[14.5px] text-encre">{p.libelle}</span>
                    <span className="font-ui text-[11px] text-muet-clair ml-auto">{p.phrase_debut} → {p.phrase_fin}</span>
                    {p.revoir && <span className={`${BADGE} bg-attention-teinte text-attention`}>à revoir</span>}
                    {!p.revoir && perime(p) && <span className={`${BADGE} bg-attention-teinte text-attention`}>périmé</span>}
                  </div>
                  {b ? (
                    <p className="font-corps text-[14px] leading-[1.55] text-encre-douce">
                      {d.phrases.filter(ph => idxDe(ph.id) >= idxDe(p.phrase_debut) && idxDe(ph.id) <= idxDe(p.phrase_fin)).map(ph => (
                        pivotIds.has(ph.id)
                          ? <mark key={ph.id} className="bg-liseret/30 text-encre rounded px-0.5">{rendu(ph.id)} </mark>
                          : <span key={ph.id}>{rendu(ph.id)} </span>
                      ))}
                    </p>
                  ) : (
                    <p className="font-corps italic text-[13px] text-attention">Bornes introuvables dans le texte courant — à ré-aligner ou à refaire.</p>
                  )}
                  {p.pivots.length > 1 && <p className="font-ui text-[11px] text-muet-clair mt-1">{p.pivots.length} pivots recevables</p>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ── Édition ────────────────────────────────────────────────────────────────
  const maj = (i: number, patch: Partial<PassageCle>) => onChange?.(passages.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const options = d.phrases.map(ph => ({ id: ph.id, texte: `${ph.id} — ${rendu(ph.id).slice(0, 70)}${rendu(ph.id).length > 70 ? '…' : ''}` }))
  const dansPassage = (p: PassageCle) => options.filter(o => idxDe(o.id) >= idxDe(p.phrase_debut) && idxDe(o.id) <= idxDe(p.phrase_fin))
  const ajouter = () => {
    if (passages.length >= MAX_PASSAGES || d.phrases.length < 2) return
    const a = d.phrases[0].id, b = d.phrases[Math.min(3, d.phrases.length - 1)].id
    onChange?.([...passages, { id: `k${semaine}-${passages.length + 1}`, role: 'these', libelle: '', phrase_debut: a, phrase_fin: b, pivots: [[d.phrases[1].id]], pivots_texte: [] }])
  }
  return (
    <div>
      <label className={`${INTITULE} block mb-1.5`}>Passages clés</label>
      {d.phrases.length === 0 ? <p className="font-corps italic text-[13px] text-muet">Pas de texte pour cette séance.</p> : (
        <div className="flex flex-col gap-3">
          {passages.map((p, i) => (
            <div key={i} className="border border-bordure rounded-[9px] px-[13px] py-2.5 flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <select value={ROLES.includes(p.role) ? p.role : 'concept'} onChange={e => maj(i, { role: e.target.value })} className={`${CHAMP} sm:max-w-[150px]`}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <input value={p.libelle} onChange={e => maj(i, { libelle: e.target.value })} placeholder="Ce que l’élève cherche (le lieu, pas la réponse)" className={CHAMP} />
                <button type="button" onClick={() => onChange?.(passages.filter((_, j) => j !== i))} className="text-muet hover:text-retard px-1">✕</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="font-ui text-[11px] text-muet-clair">Première phrase
                  <select value={p.phrase_debut} onChange={e => maj(i, { phrase_debut: e.target.value })} className={CHAMP}>
                    {options.map(o => <option key={o.id} value={o.id}>{o.texte}</option>)}
                  </select>
                </label>
                <label className="font-ui text-[11px] text-muet-clair">Dernière phrase
                  <select value={p.phrase_fin} onChange={e => maj(i, { phrase_fin: e.target.value })} className={CHAMP}>
                    {options.map(o => <option key={o.id} value={o.id}>{o.texte}</option>)}
                  </select>
                </label>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-ui text-[11px] text-muet-clair">Pivots (une par alternative ; « + la suivante » pour deux phrases)</span>
                {p.pivots.map((alt, k) => (
                  <div key={k} className="flex gap-2 items-center flex-wrap">
                    <select value={alt[0] ?? ''} onChange={e => { const v = e.target.value; const suite = d.phrases[idxDe(v) + 1]?.id; maj(i, { pivots: p.pivots.map((x, m) => (m === k ? (alt.length === 2 && suite ? [v, suite] : [v]) : x)) }) }} className={CHAMP}>
                      {dansPassage(p).map(o => <option key={o.id} value={o.id}>{o.texte}</option>)}
                    </select>
                    <label className="font-ui text-[11px] text-muet-clair whitespace-nowrap flex items-center gap-1">
                      <input type="checkbox" checked={alt.length === 2} onChange={e => { const suite = d.phrases[idxDe(alt[0]) + 1]?.id; maj(i, { pivots: p.pivots.map((x, m) => (m === k ? (e.target.checked && suite ? [alt[0], suite] : [alt[0]]) : x)) }) }} />
                      + la suivante
                    </label>
                    {p.pivots.length > 1 && <button type="button" onClick={() => maj(i, { pivots: p.pivots.filter((_, m) => m !== k) })} className="text-muet hover:text-retard px-1">✕</button>}
                  </div>
                ))}
                <button type="button" onClick={() => maj(i, { pivots: [...p.pivots, [p.phrase_debut]] })} className="font-ui text-xs text-muet hover:text-encre underline self-start">+ Ajouter une alternative</button>
              </div>
            </div>
          ))}
          {passages.length < MAX_PASSAGES && (
            <button type="button" onClick={ajouter} className="font-ui text-xs text-muet hover:text-encre underline self-start">+ Ajouter un passage</button>
          )}
        </div>
      )}
    </div>
  )
}
