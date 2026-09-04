'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { soumettreVf } from './actions'
import type { LibellesSeance } from '@/utils/aletheia/gabarits'

interface Props {
  livreId: string
  semaine: number
  theseInitial?: string
  argumentsInitial?: string
  accordInitial?: string
  champFixeInitial?: string
  /** (E3) Les questions du gabarit de la séance. Absent ⇒ libellés d'avant. */
  libelles?: LibellesSeance
}

const champClasse =
  'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'

// Réécriture (VF) — 3 champs retravaillés (SPEC §1) : idée principale, arguments,
// accord (+ la question fixe du dialogué, E3). Les questions et le vocabulaire ne se
// réécrivent pas. Pré-rempli avec la V1.
export default function FormulaireVfClassique({ livreId, semaine, theseInitial = '', argumentsInitial = '', accordInitial = '', champFixeInitial = '', libelles }: Props) {
  const router = useRouter()
  const [these, setThese] = useState(theseInitial)
  const [args, setArgs] = useState(argumentsInitial)
  const [accord, setAccord] = useState(accordInitial)
  const [champFixe, setChampFixe] = useState(champFixeInitial)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avertissement, setAvertissement] = useState<string | null>(null)
  const g = libelles
  const avecFixe = !!g?.champFixe

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (!these.trim()) { setErreur(g ? 'Réécris ta réponse à la première question.' : 'Réécris l’idée principale.'); return }
    if (!args.trim()) { setErreur(g ? 'Réécris ta réponse à la deuxième question.' : 'Réécris les arguments.'); return }
    if (avecFixe && !champFixe.trim()) { setErreur('Réécris ta réponse sur la thèse que l’auteur préfère.'); return }
    if (!accord.trim()) { setErreur(g ? 'Réécris ta réponse à la dernière question.' : 'Réécris ton accord.'); return }
    setChargement(true)
    try {
      const res = await soumettreVf(livreId, semaine, {
        these_vf: these, arguments_vf: args, accord_vf: accord,
        ...(avecFixe ? { champ_fixe_vf: champFixe } : {}),
      })
      if (res?.error) { setErreur(res.error); return }
      if (res?.avertissement) { setAvertissement(res.avertissement); return }
      router.refresh()
    } catch {
      // (B2) La Server Action a REJETÉ (réseau coupé, session expirée, déploiement en
      // cours). Sans ce catch, échec silencieux ; le texte réécrit reste dans le
      // formulaire (state React) → renvoi possible sans rien retaper.
      setErreur('L’envoi a échoué — ton texte est toujours là. Vérifie ta connexion et réessaie.')
    } finally {
      setChargement(false)
    }
  }

  if (avertissement) {
    return (
      <div className="bg-attention-teinte border border-attention rounded-xl p-5 space-y-3">
        <p className="text-sm text-attention">{avertissement}</p>
        <button onClick={() => setAvertissement(null)}
          className="text-sm font-medium text-attention underline hover:opacity-80">
          J’ai compris →
        </button>
      </div>
    )
  }

  const nb = avecFixe ? 'quatre' : 'trois'
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-muet">Reprends tes {nb} champs en tenant compte du retour : corrige, précise, approfondis.</p>
      <div>
        <label className="block text-xs font-medium text-muet mb-1">{g ? g.champ1.question : 'Idée principale'}</label>
        <textarea value={these} onChange={e => setThese(e.target.value)} rows={3} className={champClasse} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muet mb-1">{g ? g.champ2.question : 'Arguments'}</label>
        <textarea value={args} onChange={e => setArgs(e.target.value)} rows={4} className={champClasse} />
      </div>
      {g?.champFixe && (
        <div>
          <label className="block text-xs font-medium text-muet mb-1">{g.champFixe.question}</label>
          <textarea value={champFixe} onChange={e => setChampFixe(e.target.value)} rows={3} className={champClasse} />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-muet mb-1">{g ? g.tournante.question : 'Ton accord'}</label>
        <textarea value={accord} onChange={e => setAccord(e.target.value)} rows={3} className={champClasse} />
      </div>
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <button type="submit" disabled={chargement}
        className="w-full bg-bouton text-surface py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
        {chargement ? 'Envoi…' : 'Soumettre ma version finale'}
      </button>
    </form>
  )
}
