'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { modifierEleve, reinitialiserMotDePasse, supprimerEleve, renvoyerInvitation } from './actions'
import { inscrireEleve, retirerEleve } from '@/app/prof/classes/actions'
import type { EleveAvecEmail } from '@/types'

type Msg = { type: 'ok' | 'erreur'; texte: string }

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
  const [message, setMessage] = useState<Msg | null>(null)
  const [messageClasse, setMessageClasse] = useState<Msg | null>(null)
  const [pendingClasse, startClasse] = useTransition()

  // Une seule opération à la fois sur la ligne (évite Supprimer ↔ retrait-classe
  // en parallèle, qui touchent des données qui se recouvrent).
  const occupe = pendingClasse || chargement

  async function handleModifier(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('id', eleve.id)
    const resultat = await modifierEleve(formData)
    if (resultat?.error) setMessage({ type: 'erreur', texte: resultat.error })
    else { setModeEdition(false); setMessage(null) }
    setChargement(false)
  }

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const formData = new FormData(e.currentTarget)
    formData.append('id', eleve.id)
    const resultat = await reinitialiserMotDePasse(formData)
    if (resultat?.error) setMessage({ type: 'erreur', texte: resultat.error })
    else { setModeReset(false); setMessage({ type: 'ok', texte: 'Mot de passe réinitialisé.' }) }
    setChargement(false)
  }

  async function handleSupprimer() {
    if (occupe) return
    if (!confirm(`Supprimer le compte de ${eleve.display_name} ? Cette action est irréversible.`)) return
    setChargement(true)
    const formData = new FormData()
    formData.append('id', eleve.id)
    const resultat = await supprimerEleve(formData)
    if (resultat?.error) { setMessage({ type: 'erreur', texte: resultat.error }); setChargement(false) }
  }

  async function handleInviter() {
    if (occupe) return
    setChargement(true)
    setMessage(null)
    const formData = new FormData()
    formData.append('id', eleve.id)
    const resultat = await renvoyerInvitation(formData)
    setMessage(resultat?.error
      ? { type: 'erreur', texte: resultat.error }
      : { type: 'ok', texte: `Invitation envoyée à ${eleve.email}.` })
    setChargement(false)
  }

  // Affecter l'élève à une classe (non destructif, idempotent).
  function ajouterClasse(classeId: string) {
    if (!classeId) return
    const nom = classes.find((c) => c.id === classeId)?.nom ?? 'la classe'
    setMessageClasse(null)
    startClasse(async () => {
      const r = await inscrireEleve(toFd(classeId, eleve.id))
      if (r?.error) setMessageClasse({ type: 'erreur', texte: r.error })
      else { setMessageClasse({ type: 'ok', texte: `Ajouté à ${nom}.` }); router.refresh() }
    })
  }

  // Retirer l'élève d'une classe — DESTRUCTIF (supprime son travail dans cette
  // classe). Même garde de confirmation que la gestion côté Classes.
  function retirerClasse(classeId: string, nomClasse: string) {
    if (occupe) return
    if (!confirm(`Retirer ${eleve.display_name} de ${nomClasse} ? Son travail dans CETTE classe sera supprimé (compte et autres classes intacts).`)) return
    setMessageClasse(null)
    startClasse(async () => {
      const r = await retirerEleve(toFd(classeId, eleve.id))
      if (r?.error) setMessageClasse({ type: 'erreur', texte: r.error })
      else router.refresh()
    })
  }

  function toFd(classeId: string, eleveId: string) {
    const fd = new FormData()
    fd.append('classeId', classeId)
    fd.append('eleveId', eleveId)
    return fd
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
            {message && <p className={`text-sm ${message.type === 'ok' ? 'text-ok' : 'text-retard'}`}>{message.texte}</p>}
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
            {message && <p className={`text-sm ${message.type === 'ok' ? 'text-ok' : 'text-retard'}`}>{message.texte}</p>}
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
      <td className="px-4 py-3 text-sm font-medium align-top">
        <Link href={`/prof/eleves/${eleve.id}`} className="text-encre hover:text-pigment hover:underline">
          {eleve.display_name}
        </Link>
        {eleve.jamaisConnecte && (
          <span className="block font-ui text-[11px] text-muet mt-0.5">Pas encore connecté</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm align-top">
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
                disabled={occupe}
                aria-label={`Retirer ${eleve.display_name} de ${c.nom}`}
                className="text-muet hover:text-retard disabled:opacity-50 leading-none text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment rounded-full"
              >
                ×
              </button>
            </span>
          ))}
          <select
            value=""
            disabled={occupe || disponibles.length === 0}
            onChange={(e) => ajouterClasse(e.target.value)}
            aria-label={`Ajouter ${eleve.display_name} à une classe`}
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
        {messageClasse && (
          <p className={`text-xs mt-1 ${messageClasse.type === 'ok' ? 'text-ok' : 'text-retard'}`}>{messageClasse.texte}</p>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-encre-douce align-top">{eleve.email}</td>
      <td className="px-4 py-3 text-sm align-top">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleInviter}
            disabled={occupe}
            title="Envoyer un courriel pour que l'élève (re)définisse son mot de passe"
            className="text-pigment hover:opacity-80 text-xs px-2 py-1 rounded hover:bg-parchemin-fonce disabled:opacity-50"
          >
            {eleve.jamaisConnecte ? 'Inviter' : 'Renvoyer l’invit.'}
          </button>
          <button
            onClick={() => setModeEdition(true)}
            disabled={occupe}
            className="text-encre-douce hover:text-encre text-xs px-2 py-1 rounded hover:bg-parchemin-fonce disabled:opacity-50"
          >
            Modifier
          </button>
          <button
            onClick={() => setModeReset(true)}
            disabled={occupe}
            className="text-encre-douce hover:text-encre text-xs px-2 py-1 rounded hover:bg-parchemin-fonce disabled:opacity-50"
          >
            Mot de passe
          </button>
          <button
            onClick={handleSupprimer}
            disabled={occupe}
            className="text-retard hover:opacity-80 text-xs px-2 py-1 rounded hover:bg-retard-teinte disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
        {message && <p className={`text-xs mt-1 ${message.type === 'ok' ? 'text-ok' : 'text-retard'}`}>{message.texte}</p>}
      </td>
    </tr>
  )
}
