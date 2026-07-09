'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  modifierParcours,
  supprimerParcours,
  retirerCreneau,
  reordonnerCreneaux,
  deplacerCreneau,
} from '../actions'
import PickerContenu from './PickerContenu'
import type { ParcoursDetail, CreneauResolu, CiblesPicker } from './donnees'

function badgeClasse(c: CreneauResolu): string {
  if (c.etat === 'contenu_retire' || c.etat === 'livre_retire') return 'bg-parchemin-fonce text-muet'
  if (c.etat === 'tranche_a_revoir') return 'bg-attention-teinte text-attention'
  if (c.badge === 'Texte') return 'bg-ok-teinte text-ok'
  if (c.badge === 'Livre') return 'bg-info-teinte text-info'
  return 'bg-parchemin-fonce text-muet'
}

function LigneCreneau({
  c, premier, dernier, nbSemaines, chargement, onMonter, onDescendre, onDeplacer, onRetirer,
}: {
  c: CreneauResolu
  premier: boolean
  dernier: boolean
  nbSemaines: number
  chargement: boolean
  onMonter: () => void
  onDescendre: () => void
  onDeplacer: (ns: number) => void
  onRetirer: () => void
}) {
  const retire = c.etat === 'contenu_retire' || c.etat === 'livre_retire'
  return (
    <div className="flex items-center gap-2 border border-bordure rounded px-2 py-1.5">
      <div className="flex flex-col leading-none">
        <button onClick={onMonter} disabled={premier || chargement} className="text-[10px] text-muet hover:text-encre disabled:opacity-30" title="Monter">▲</button>
        <button onClick={onDescendre} disabled={dernier || chargement} className="text-[10px] text-muet hover:text-encre disabled:opacity-30" title="Descendre">▼</button>
      </div>
      <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${badgeClasse(c)}`}>{c.badge}</span>
      <span className={`text-sm min-w-0 truncate ${retire ? 'text-muet line-through' : 'text-encre'}`}>
        {c.titre}
        {c.trancheLabel && <span className="text-muet text-xs"> — {c.trancheLabel}</span>}
        {c.etat === 'tranche_a_revoir' && <span className="text-attention text-xs"> · à revoir</span>}
      </span>
      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
        {nbSemaines > 1 && (
          <select
            value={c.semaine}
            onChange={e => onDeplacer(Number(e.target.value))}
            disabled={chargement}
            title="Déplacer vers la semaine"
            className="text-xs border border-bordure rounded px-1 py-0.5 text-encre-douce disabled:opacity-50"
          >
            {Array.from({ length: nbSemaines }, (_, i) => i + 1).map(n => <option key={n} value={n}>S{n}</option>)}
          </select>
        )}
        <button onClick={onRetirer} disabled={chargement} className="text-xs text-muet hover:text-retard disabled:opacity-50">Retirer</button>
      </div>
    </div>
  )
}

export default function GrilleParcours({ parcours, cibles }: { parcours: ParcoursDetail; cibles: CiblesPicker }) {
  const router = useRouter()
  const [pickerSemaine, setPickerSemaine] = useState<number | null>(null)
  const [editionEntete, setEditionEntete] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const semaines = Array.from({ length: parcours.nbSemaines }, (_, i) => i + 1)
  const parSemaine = (s: number) => parcours.creneaux.filter(c => c.semaine === s).sort((a, b) => a.ordre - b.ordre)

  async function agir(fn: () => Promise<{ error?: string }>) {
    setErreur(null)
    setChargement(true)
    const res = await fn()
    setChargement(false)
    if (res?.error) { setErreur(res.error); return false }
    router.refresh()
    return true
  }

  async function monter(semaine: number, id: string) {
    const ids = parSemaine(semaine).map(c => c.id)
    const i = ids.indexOf(id)
    if (i <= 0) return
    ;[ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]
    await agir(() => reordonnerCreneaux(parcours.id, semaine, ids))
  }
  async function descendre(semaine: number, id: string) {
    const ids = parSemaine(semaine).map(c => c.id)
    const i = ids.indexOf(id)
    if (i < 0 || i >= ids.length - 1) return
    ;[ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]
    await agir(() => reordonnerCreneaux(parcours.id, semaine, ids))
  }

  async function handleSupprimerParcours() {
    if (!confirm(`Supprimer le parcours « ${parcours.titre} » ? (son ordonnancement et ses assignations de classe sont perdus)`)) return
    const ok = await agir(() => supprimerParcours(parcours.id))
    if (ok) router.push('/prof/scriptorium?vue=parcours')
  }

  async function handleEnregistrerEntete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const titre = (fd.get('titre') as string) ?? ''
    const nbSemaines = Number(fd.get('nbSemaines'))
    const description = (fd.get('description') as string) ?? ''
    setErreur(null)
    setChargement(true)
    let res = await modifierParcours(parcours.id, { titre, nbSemaines, description })
    if (res.needsConfirm) {
      const ok = confirm(`${res.nbCreneauxAuDela} créneau(x) au-delà de la semaine ${nbSemaines} seront supprimés. Continuer ?`)
      if (!ok) { setChargement(false); return }
      res = await modifierParcours(parcours.id, { titre, nbSemaines, description }, true)
    }
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setEditionEntete(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <Link href="/prof/scriptorium?vue=parcours" className="text-sm text-muet hover:text-encre">← Tous les parcours</Link>
        <div className="flex gap-2">
          <button onClick={() => setEditionEntete(v => !v)} className="text-xs text-muet hover:text-encre">Modifier</button>
          <button onClick={handleSupprimerParcours} disabled={chargement} className="text-xs text-muet hover:text-retard disabled:opacity-50">Supprimer</button>
        </div>
      </div>

      {editionEntete ? (
        <form onSubmit={handleEnregistrerEntete} className="bg-surface border border-bordure rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input name="titre" defaultValue={parcours.titre} required placeholder="Titre"
              className="sm:col-span-2 px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
            <input name="nbSemaines" type="number" min={1} max={52} defaultValue={parcours.nbSemaines} required placeholder="Semaines"
              className="px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
          </div>
          <textarea name="description" defaultValue={parcours.description ?? ''} rows={2} placeholder="Description (optionnel)"
            className="w-full px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment resize-y" />
          {erreur && <p className="text-retard text-sm">{erreur}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={chargement} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{chargement ? '…' : 'Enregistrer'}</button>
            <button type="button" onClick={() => setEditionEntete(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Annuler</button>
          </div>
        </form>
      ) : (
        <div>
          <h2 className="text-lg font-marque text-encre">{parcours.titre}</h2>
          <p className="text-sm text-muet">
            {parcours.nbSemaines} semaine{parcours.nbSemaines > 1 ? 's' : ''}
            {parcours.description ? ` · ${parcours.description}` : ''}
          </p>
        </div>
      )}

      {erreur && !editionEntete && <p className="text-retard text-sm">{erreur}</p>}

      <div className="space-y-2">
        {semaines.map(s => {
          const cs = parSemaine(s)
          return (
            <div key={s} className="border border-bordure rounded-lg">
              <div className="flex items-center justify-between px-3 py-2 border-b border-bordure bg-parchemin-fonce/40">
                <span className="text-xs font-medium text-encre-douce uppercase tracking-wide">Semaine {s}</span>
                <button onClick={() => setPickerSemaine(pickerSemaine === s ? null : s)} className="text-xs text-pigment hover:underline">
                  {pickerSemaine === s ? 'Fermer' : '+ Ajouter'}
                </button>
              </div>
              <div className="p-2 space-y-1.5">
                {cs.length === 0 && pickerSemaine !== s && <p className="text-xs text-muet px-1">Aucun contenu.</p>}
                {cs.map((c, i) => (
                  <LigneCreneau
                    key={c.id}
                    c={c}
                    premier={i === 0}
                    dernier={i === cs.length - 1}
                    nbSemaines={parcours.nbSemaines}
                    chargement={chargement}
                    onMonter={() => monter(s, c.id)}
                    onDescendre={() => descendre(s, c.id)}
                    onDeplacer={(ns) => { void agir(() => deplacerCreneau(c.id, ns)) }}
                    onRetirer={() => { void agir(() => retirerCreneau(c.id)) }}
                  />
                ))}
                {pickerSemaine === s && (
                  <PickerContenu parcoursId={parcours.id} semaine={s} cibles={cibles} onClose={() => setPickerSemaine(null)} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
