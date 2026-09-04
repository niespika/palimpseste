'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { repondreRelances, verifierSurlignage } from './actions'
import type { RetourV1 } from './types'
import type { RelanceDetail } from '@/utils/aletheia/retour-v1'
import type { FenetreServie } from '@/utils/aletheia/fenetre-serveur'
import { ESSAIS_MAX } from '@/utils/aletheia/fenetre'
import FilEcrans, { type EcranFil } from '@/components/aletheia/FilEcrans'
import { PageDuLivre } from '@/components/aletheia/PageDuLivre'

// ============================================================================
// LE RETOUR, ET RÉPONDRE AUX RELANCES — en fil d'écrans (refonte 04/09).
//  1. le rappel jugé (dès la 2ᵉ séance) ;
//  2. pour chaque relance : la question → (formes fenêtre / demi-séance : chercher et
//     surligner la phrase, vérifier) → répondre, avec la bascule « Le texte / Ta réponse »
//     dans la barre du bas (sur ordinateur : deux colonnes, pas de bascule) ;
//  3. la bulle de la question tournante ; 4. les réponses aux questions ; 5. le vocabulaire ;
//  le dernier écran envoie les réponses et ouvre la réécriture.
// Aucune pivot dans le navigateur avant d'être servie par le serveur.
// ============================================================================

interface Props {
  livreId: string
  semaine: number
  numeroSeance: number
  retour: RetourV1
  questionsEleve: string[]
  rappelEleve: string | null
  titres?: { relances: string; tournante: string }
  fenetres: FenetreServie[]
  surlignagesInitiaux: Record<number, { verdict_code?: string; essais?: number; surlignage?: string[] }>
}

type EtatRelance = { selection: string[]; verdict?: string; message?: string; essais: number; pivot?: string[]; busy: boolean; vue: 0 | 1 }
const champClasse = 'w-full px-3 py-2.5 border border-bordure rounded-lg text-[15px] font-corps leading-relaxed focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre bg-surface'

function Bulle({ titre, accent, children }: { titre: string; accent: 'ok' | 'attention' | 'liseret' | 'pigment'; children: React.ReactNode }) {
  const bord = { ok: 'border-l-ok', attention: 'border-l-attention', liseret: 'border-l-liseret', pigment: 'border-l-pigment' }[accent]
  return (
    <section className={`bg-surface border border-bordure border-l-4 ${bord} rounded-xl p-4`}>
      <p className="font-ui text-[11px] tracking-[0.08em] uppercase text-muet mb-1.5">{titre}</p>
      <div className="font-corps text-[15px] leading-relaxed text-encre">{children}</div>
    </section>
  )
}

export default function ReponsesRelancesFil({ livreId, semaine, numeroSeance, retour: rv, questionsEleve, rappelEleve, titres, fenetres, surlignagesInitiaux }: Props) {
  const router = useRouter()
  const relances = rv.relances ?? []
  const detail: RelanceDetail[] = rv.relances_detail ?? []
  const [index, setIndex] = useState(0)
  const [reponses, setReponses] = useState<string[]>(relances.map(() => ''))
  const [etats, setEtats] = useState<Record<number, EtatRelance>>(() => Object.fromEntries(relances.map((_, i) => {
    const s = surlignagesInitiaux[i]
    return [i, { selection: s?.surlignage ?? [], verdict: s?.verdict_code, essais: s?.essais ?? 0, busy: false, vue: 0 }]
  })))
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const maj = (i: number, patch: Partial<EtatRelance>) => setEtats(e => ({ ...e, [i]: { ...e[i], ...patch } }))
  const fenetreDe = (i: number) => fenetres.find(f => f.relance === i)
  const merite = (i: number) => { const e = etats[i]; return e.verdict === 'juste' || e.essais >= ESSAIS_MAX || !!e.pivot }
  // L'écran « chercher » existe pour les formes fenêtre / demi-séance ; une fois la phrase méritée il
  // reste en place (le verdict s'y lit) et son bouton devient « Ta réponse → ».
  const aChercher = (i: number) => { const f = fenetreDe(i); return !!f && f.forme !== 'montre' }
  const avance = () => { setErreur(null); setIndex(i => i + 1) }

  async function verifier(i: number) {
    const e = etats[i]
    if (e.selection.length === 0) { maj(i, { message: 'Surligne au moins une phrase avant de vérifier.' }); return }
    maj(i, { busy: true })
    try {
      const r = await verifierSurlignage(livreId, semaine, i, e.selection)
      if ('error' in r && r.error) { maj(i, { message: r.error, busy: false }); return }
      if (!('verdict' in r)) { maj(i, { message: 'La vérification a échoué — réessaie.', busy: false }); return }
      maj(i, { verdict: r.verdict, message: r.message, essais: r.essais ?? e.essais + 1, pivot: r.pivot, busy: false, ...(r.pivot ? { selection: [] } : {}) })
    } catch { maj(i, { message: 'La vérification a échoué — réessaie.', busy: false }) }
  }

  async function envoyer() {
    setErreur(null)
    const j = reponses.findIndex(r => !r.trim())
    if (j >= 0) { setErreur(`Il manque ta réponse à la relance ${j + 1}.`); return }
    setChargement(true)
    try {
      const res = await repondreRelances(livreId, semaine, reponses)
      if (res?.error) { setErreur(res.error); return }
      router.refresh()
    } catch { setErreur('L’envoi a échoué — tes réponses sont toujours là. Vérifie ta connexion et réessaie.') }
    finally { setChargement(false) }
  }

  const ecrans: EcranFil[] = []
  if (rv.rappel && rappelEleve) ecrans.push({
    id: 'rappel', titre: 'Ton rappel de la séance dernière',
    corps: <>
      <Bulle titre={rv.rappel.verdict === 'juste' ? 'Juste' : rv.rappel.verdict === 'partiel' ? 'En partie' : 'À côté'} accent={rv.rappel.verdict === 'juste' ? 'ok' : 'attention'}>{rv.rappel.phrase}</Bulle>
      <p className="text-sm text-encre-douce italic mt-3">Tu avais écrit : « {rappelEleve} »</p>
    </>,
    suivant: { label: 'Suivant →', onClick: avance },
  })
  relances.forEach((q, i) => {
    const d = detail[i]; const f = fenetreDe(i); const e = etats[i]
    const libelle = d?.libelle
    ecrans.push({
      id: `relance-${i}`, titre: `Relance ${i + 1}`,
      corps: <>
        <p className="font-corps text-[16px] leading-relaxed text-encre">{q}</p>
        {libelle && <p className="text-xs text-muet mt-3">À chercher : <span className="text-encre-douce">{libelle}</span></p>}
      </>,
      suivant: { label: f ? (aChercher(i) ? (merite(i) ? 'Revoir la phrase →' : 'Chercher dans le texte →') : 'Lire le passage →') : 'Répondre →', onClick: avance },
    })
    if (f && aChercher(i)) {
      const merited = merite(i)
      ecrans.push({
        id: `chercher-${i}`, titre: 'Surligne la phrase',
        corps: <>
          <p className="text-xs text-muet mb-2">{f.forme === 'fenetre' ? 'Cherche dans ces lignes la phrase qui répond, surligne-la, puis vérifie.' : 'Cherche dans cette moitié de séance la phrase qui répond, surligne-la, puis vérifie.'}</p>
          <PageDuLivre phrases={f.phrases} enEvidence={e.pivot ?? []} selection={e.selection} cliquable={!merited}
            onBascule={id => maj(i, { selection: e.selection.includes(id) ? e.selection.filter(x => x !== id) : [...e.selection, id], message: undefined })} />
          {e.message && <p className={`text-sm mt-2 ${e.verdict === 'juste' ? 'text-ok' : 'text-attention'}`}>{e.message}{e.pivot && e.verdict !== 'juste' ? ' La phrase est maintenant surlignée.' : ''}</p>}
        </>,
        suivant: merited
          ? { label: 'Ta réponse →', onClick: avance }
          : { label: e.busy ? 'Vérification…' : `Vérifier${e.essais ? ` (essai ${e.essais + 1}/${ESSAIS_MAX})` : ''}`, onClick: () => { void verifier(i) }, disabled: e.busy },
      })
    }
    const evid = f ? (f.forme === 'montre' ? (f.enEvidence ?? []) : (e.pivot ?? [])) : []
    const reponse = (
      <>
        <p className="text-sm text-encre-douce italic mb-2">{q}</p>
        <textarea value={reponses[i]} onChange={ev => setReponses(reponses.map((r, k) => (k === i ? ev.target.value : r)))} rows={5} placeholder="Une ou deux phrases." className={champClasse} />
      </>
    )
    ecrans.push({
      id: `repondre-${i}`, titre: `Relance ${i + 1} · ta réponse`,
      corps: f ? (
        <div className="lg:grid lg:grid-cols-[2fr_3fr] lg:gap-6 lg:items-start">
          <div className={e.vue === 1 ? '' : 'hidden lg:block'}>{reponse}</div>
          <div className={e.vue === 0 ? '' : 'hidden lg:block'}>
            <p className="text-xs text-muet mb-2 lg:hidden">{f.forme === 'montre' ? 'Voici le passage, la phrase importante est surlignée. Puis passe à « Ta réponse ».' : 'Relis le passage, la phrase trouvée est surlignée. Puis passe à « Ta réponse ».'}</p>
            <PageDuLivre phrases={f.forme === 'montre' ? f.phrases : fenetres.find(x => x.relance === i)!.phrases} enEvidence={evid} selection={[]} />
          </div>
        </div>
      ) : reponse,
      bascule: f ? { a: 'Le texte', b: 'Ta réponse', actif: e.vue, onChange: v => maj(i, { vue: v }), mobileSeulement: true } : null,
      suivant: (!f || e.vue === 1)
        ? { label: 'Suivant →', onClick: avance, disabled: !reponses[i].trim() }
        : { label: 'Suivant →', onClick: avance, disabled: !reponses[i].trim(), lgSeulement: true },
    })
  })
  if (rv.accord) ecrans.push({
    id: 'tournante', titre: titres?.tournante ?? 'Sur ton accord',
    corps: <p className="font-corps text-[16px] leading-relaxed text-encre">{rv.accord}</p>,
    suivant: { label: 'Suivant →', onClick: avance },
  })
  if (rv.reponses_questions?.length) ecrans.push({
    id: 'questions', titre: 'Réponses à tes questions',
    corps: <div className="space-y-4">{rv.reponses_questions.map((r, k) => (
      <div key={k}>{questionsEleve[k] && <p className="font-ui text-sm font-medium text-encre-douce mb-1">{questionsEleve[k]}</p>}<p className="font-corps text-[15px] leading-relaxed text-encre">{r}</p></div>
    ))}</div>,
    suivant: { label: 'Suivant →', onClick: avance },
  })
  ecrans.push({
    id: 'vocabulaire', titre: 'Vocabulaire',
    corps: rv.vocabulaire?.length ? (
      <div className="space-y-2">
        {rv.vocabulaire.map((v, k) => <p key={k} className="font-corps text-[15px] leading-relaxed text-encre"><b>{v.terme}</b> — {v.definition}</p>)}
        <p className="text-xs text-muet pt-2">Ces mots deviennent des cartes à réviser dans Quazian.</p>
      </div>
    ) : <p className="text-sm text-encre-douce">Aucun mot demandé cette fois.</p>,
    suivant: { label: chargement ? 'Envoi…' : 'Passer à la réécriture →', onClick: () => { void envoyer() }, disabled: chargement },
  })

  const i = Math.min(index, ecrans.length - 1)
  const courant = { ...ecrans[i], erreur }
  return <FilEcrans fil={`Séance ${numeroSeance} · Ton retour`} ecrans={ecrans.map((e, k) => (k === i ? courant : e))} index={i} onIndex={setIndex} />
}
