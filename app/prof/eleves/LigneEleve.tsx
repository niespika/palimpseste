'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { modifierEleve, reinitialiserMotDePasse, supprimerEleve } from './actions'
import { inscrireEleve, retirerEleve } from '@/app/prof/classes/actions'
import type { EleveAvecEmail } from '@/types'

export default function LigneEleve({
  eleve,
  classes,
}: {
  eleve: EleveAvecEmail
  classes: { id: string; nom: string }[]
}) {
  const router = useRouter()
  const [modeEdition, setModeEdition] = useState(false)
  const [modeReset, setModeReset] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingClasse, startClasse] = useTransition()

  async function handleModifier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('id', eleve.id)
    const resultat = await modifierEleve(formData)
    if (resultat?.error) setMessage(resultat.error)
    else { setModeEdition(false); setMessage(null) }
    setChargement(false)
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('id', eleve.id)
    const resultat = await reinitialiserMotDePasse(formData)
    if (resultat?.error) setMessage(resultat.error)
    else { setModeReset(false); setMessage('Mot de passe réinitialisé.') }
    setChargement(false)
  }

  async function handleSupprimer() {
    if (!confirm(`Supprimer le compte de ${eleve.display_name} ? Cette action est irréversible.`)) return
    setChargement(true)
    const formData = new FormData()
    formData.append('id', eleve.id)
    const resultat = await supprimerEleve(formData)
    if (resultat?.error) { setMessage(resultat.error); setChargement(false) }
  }

  // Affecter l'élève à une classe (non destructif, idempotent).
  function ajouterClasse(classeId: string) {
    if (!classeId) return
    setMessage(null)
    const fd = new FormData()
    fd.append('classeId', classeId)
    fd.append('eleveId', eleve.id)
    startClasse(async () => {
      const r = await inscrireEleve(fd)
      if (r?.error) setMessage(r.error)
      else router.refresh()
    })
  }

  // Retirer l'élève d'une classe — DESTRUCTIF (supprime son travail dans cette
  // classe). Même garde de confirmation que la gestion côté Classes.
  function retirerClasse(classeId: string, nomClasse: string) {
    if (!confirm(`Retirer ${eleve.display_name} de ${nomClasse} ? Son travail dans CETTE classe sera supprimé (compte et autres classes intacts).`)) return
    setMessage(null)
    const fd = new FormData()
    fd.append('classeId', classeId)
    fd.append('eleveId', eleve.id)
    startClasse(async () => {
      const r = await retirerEleve(fd)
      if (r?.error) setMessage(r.error)
      else router.refresh()
    })
  }

  const disponibles = classes.filter((c) => !eleve.classes.some((x) => x.id === c.id))

  if (modeEdition) {
    return (
      <tr className="bg-parchemin-fonce">
        <td colSpan={4} className="px-4 py-3">
          <form onSubmit={handleModifier} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-muet mb-1">Prénom / pseudonyme</label>
              <input
                name="displayName"
                defaultValue={eleve.display_name}
                required
                className="px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
              />
            </div>
            <p className="text-xs text-muet self-end mb-2">L&apos;inscription en classe se gère dans la colonne Classes.</p>
            {message && <p className="text-retard text-sm">{message}</p>}
            <button
              type="submit"
              disabled={chargement}
              className="bg-bouton text-surface px-3 py-1.5 rounded text-sm hover:opacity-90 disabled:opacity-50"
            >
              {chargement ? '…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={() => setModeEdition(false)}
              className="px-3 py-1.5 rounded text-sm text-encre-douce hover:bg-parchemin-fonce"
            >
              Annuler
            </button>
          </form>
        </td>
      </tr>
    )
  }

  if (modeReset) {
    return (
      <tr className="bg-parchemin-fonce">
        <td colSpan={4} className="px-4 py-3">
          <form onSubmit={handleReset} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-muet mb-1">
                Nouveau mot de passe pour {eleve.display_name}
              </label>
              <input
                name="nouveauMotDePasse"
                type="text"
                required
                minLength={8}
                className="px-2 py-1.5 border border-bordure rounded text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
                placeholder="Au moins 8 caractères"
              />
            </div>
            {message && <p className="text-retard text-sm">{message}</p>}
            <button
              type="submit"
              disabled={chargement}
              className="bg-bouton text-surface px-3 py-1.5 rounded text-sm hover:opacity-90 disabled:opacity-50"
            >
              {chargement ? '…' : 'Réinitialiser'}
            </button>
            <button
              type="button"
              onClick={() => setModeReset(false)}
              className="px-3 py-1.5 rounded text-sm text-encre-douce hover:bg-parchemin-fonce"
            >
              Annuler
            </button>
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-t border-bordure hover:bg-parchemin-fonce">
      <td className="px-4 py-3 text-sm font-medium">
        <Link href={`/prof/eleves/${eleve.id}`} className="text-encre hover:text-pigment hover:underline">
          {eleve.display_name}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          {eleve.classes.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 bg-parchemin-fonce border border-bordure rounded-full pl-2.5 pr-1.5 py-0.5 text-xs text-encre-douce"
            >
              {c.nom}
              <button
                type="button"
                onClick={() => retirerClasse(c.id, c.nom)}
                disabled={pendingClasse}
                aria-label={`Retirer de ${c.nom}`}
                className="text-muet hover:text-retard disabled:opacity-50 leading-none text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-full"
              >
                ×
              </button>
            </span>
          ))}
          <select
            value=""
            disabled={pendingClasse || disponibles.length === 0}
            onChange={(e) => ajouterClasse(e.target.value)}
            className="font-ui text-xs border border-bordure rounded-lg px-2 py-1 bg-surface text-encre-douce disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
          >
            <option value="">
              {disponibles.length === 0 ? 'Toutes les classes' : '+ Ajouter à une classe…'}
            </option>
            {disponibles.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-encre-douce">{eleve.email}</td>
      <td className="px-4 py-3 text-sm">
        <div className="flex gap-2">
          <button
            onClick={() => setModeEdition(true)}
            className="text-encre-douce hover:text-encre text-xs px-2 py-1 rounded hover:bg-parchemin-fonce"
          >
            Modifier
          </button>
          <button
            onClick={() => setModeReset(true)}
            className="text-encre-douce hover:text-encre text-xs px-2 py-1 rounded hover:bg-parchemin-fonce"
          >
            Mot de passe
          </button>
          <button
            onClick={handleSupprimer}
            disabled={chargement}
            className="text-retard hover:opacity-80 text-xs px-2 py-1 rounded hover:bg-retard-teinte disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
        {message && <p className="text-ok text-xs mt-1">{message}</p>}
      </td>
    </tr>
  )
}
