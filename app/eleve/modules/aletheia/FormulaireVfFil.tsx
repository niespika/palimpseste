'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreVf } from './actions'
import type { RetourV1 } from './types'
import type { LibellesSeance } from '@/utils/aletheia/gabarits'
import FilEcrans, { type EcranFil } from '@/components/aletheia/FilEcrans'

// ============================================================================
// LA RÉÉCRITURE, UN CHAMP PAR ÉCRAN — porte de l'étayage OUVERTE (refonte 04/09).
// Chaque écran a sa bascule « Le retour / Ta version finale » dans la barre du bas :
// d'un côté la seule relance qui concerne ce champ, la réponse déjà donnée et le premier
// jet ; de l'autre le champ, pré-rempli du premier jet. Sur ordinateur : deux colonnes.
// (Porte fermée : `FormulaireVfClassique`.)
// ============================================================================

interface Props {
  livreId: string
  semaine: number
  numeroSeance: number
  libelles: LibellesSeance
  retour: RetourV1
  reponses: { relance: number; texte: string }[]
  /** Rôle du passage désigné par chaque relance (`these`, `argument:2`…), par identifiant de passage. */
  rolesPassages: Record<string, string>
  v1: { these: string; arguments: string; accord: string; champ_fixe: string }
  initial: { these: string; arguments: string; accord: string; champ_fixe: string }
}

const champClasse = 'w-full px-3 py-2.5 border border-bordure rounded-lg text-[15px] font-corps leading-relaxed focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre bg-surface'

function Bulle({ titre, accent, children }: { titre: string; accent: 'liseret' | 'pigment'; children: React.ReactNode }) {
  return (
    <section className={`bg-surface border border-bordure border-l-4 ${accent === 'liseret' ? 'border-l-liseret' : 'border-l-pigment'} rounded-xl p-4`}>
      <p className="font-ui text-[11px] tracking-[0.08em] uppercase text-muet mb-1.5">{titre}</p>
      <div className="font-corps text-[15px] leading-relaxed text-encre space-y-2">{children}</div>
    </section>
  )
}

export default function FormulaireVfFil({ livreId, semaine, numeroSeance, libelles: g, retour: rv, reponses, rolesPassages, v1, initial }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [vues, setVues] = useState<Record<string, 0 | 1>>({})
  const [these, setThese] = useState(initial.these)
  const [args, setArgs] = useState(initial.arguments)
  const [accord, setAccord] = useState(initial.accord)
  const [champFixe, setChampFixe] = useState(initial.champ_fixe)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)
  const avecFixe = !!g.champFixe
  const avance = () => { setErreur(null); setIndex(i => i + 1) }

  // Quelle relance concerne quel champ : par le rôle du passage désigné ; sans passage, la
  // 1ʳᵉ relance va au champ 1, les autres au champ 2.
  const relances = rv.relances ?? []
  const detail = rv.relances_detail ?? []
  const roleDe = (i: number) => { const p = detail[i]?.passage; return p ? (rolesPassages[p] ?? '') : (i === 0 ? 'these' : 'argument') }
  const pour = (champ: 'these' | 'argument') => relances.map((q, i) => ({ q, i })).filter(({ i }) => roleDe(i).startsWith(champ))
  const reponseDe = (i: number) => reponses.find(r => r.relance === i)?.texte ?? ''

  const regard = (liste: { q: string; i: number }[], premierJet: string, bulleAccord?: string) => (
    <div className="space-y-3">
      {liste.map(({ q, i }) => (
        <Bulle key={i} titre={`Relance ${i + 1}`} accent="liseret">
          <p>{q}</p>
          {reponseDe(i) && <p className="text-sm text-encre-douce italic">Tu as répondu : « {reponseDe(i)} »</p>}
        </Bulle>
      ))}
      {bulleAccord && <Bulle titre="Ce que le retour dit de ta réponse" accent="pigment"><p>{bulleAccord}</p></Bulle>}
      {liste.length === 0 && !bulleAccord && <p className="text-sm text-muet">Aucune relance ne vise ce champ : relis ton premier jet et précise-le.</p>}
      {premierJet && <p className="text-sm text-encre-douce italic whitespace-pre-wrap">Ton premier jet : « {premierJet} »</p>}
    </div>
  )

  const champs: { id: string; question: string; valeur: string; set: (s: string) => void; regard: React.ReactNode; requis: string }[] = [
    { id: 'these', question: g.champ1.question, valeur: these, set: setThese, regard: regard(pour('these'), v1.these), requis: 'Réécris ta réponse à la première question.' },
    { id: 'arguments', question: g.champ2.question, valeur: args, set: setArgs, regard: regard(pour('argument'), v1.arguments), requis: 'Réécris ta réponse à la deuxième question.' },
    ...(avecFixe ? [{ id: 'fixe', question: g.champFixe!.question, valeur: champFixe, set: setChampFixe, regard: regard([], v1.champ_fixe), requis: 'Réécris ta réponse sur la thèse que l’auteur préfère.' }] : []),
    { id: 'accord', question: g.tournante.question, valeur: accord, set: setAccord, regard: regard([], v1.accord, rv.accord ?? undefined), requis: 'Réécris ta réponse à la dernière question.' },
  ]

  async function soumettre() {
    setErreur(null)
    for (const c of champs) if (!c.valeur.trim()) { setErreur(c.requis); return }
    setChargement(true)
    try {
      const res = await soumettreVf(livreId, semaine, { these_vf: these, arguments_vf: args, accord_vf: accord, ...(avecFixe ? { champ_fixe_vf: champFixe } : {}) })
      if (res?.error) { setErreur(res.error); return }
      if (res?.avertissement) { setAvertissement(res.avertissement); return }
      router.refresh()
    } catch { setErreur('L’envoi a échoué — ton texte est toujours là. Vérifie ta connexion et réessaie.') }
    finally { setChargement(false) }
  }

  if (avertissement) {
    return (
      <div className="bg-attention-teinte border border-attention rounded-xl p-5 space-y-3">
        <p className="text-sm text-attention">{avertissement}</p>
        <button onClick={() => setAvertissement(null)} className="text-sm font-medium text-attention underline hover:opacity-80">J’ai compris →</button>
      </div>
    )
  }

  const ecrans: EcranFil[] = champs.map((c, k) => {
    const vue = vues[c.id] ?? 0
    const dernier = k === champs.length - 1
    return {
      id: c.id, titre: `Réécrire · ${c.question}`,
      corps: (
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-6 lg:items-start">
          <div className={vue === 0 ? '' : 'hidden lg:block'}>{c.regard}</div>
          <div className={vue === 1 ? '' : 'hidden lg:block'}>
            <p className="text-sm text-encre-douce mb-2">Ta version finale</p>
            <textarea value={c.valeur} onChange={e => c.set(e.target.value)} rows={8} className={champClasse} />
          </div>
        </div>
      ),
      bascule: { a: 'Le retour', b: 'Ta version finale', actif: vue, onChange: v => setVues(x => ({ ...x, [c.id]: v })), mobileSeulement: true },
      suivant: dernier
        ? { label: chargement ? 'Envoi…' : 'Soumettre ma version finale', onClick: () => { void soumettre() }, disabled: chargement, lgSeulement: vue === 0 }
        : { label: 'Suivant →', onClick: avance, disabled: !c.valeur.trim(), lgSeulement: vue === 0 },
    }
  })
  const i = Math.min(index, ecrans.length - 1)
  const courant = { ...ecrans[i], erreur }
  return <FilEcrans fil={`Séance ${numeroSeance} · Réécriture`} ecrans={ecrans.map((e, k) => (k === i ? courant : e))} index={i} onIndex={setIndex} />
}
