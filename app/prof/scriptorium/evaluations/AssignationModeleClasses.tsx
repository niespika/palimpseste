'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChampDate from '@/app/prof/calendrier/config/ChampDate'
import { assignerModeleClasse, retirerModeleClasse } from './actions'
import type { LigneAssignationModele } from './modele-serveur'

function fmtDate(iso: string): string {
  return iso.split('-').reverse().join('/') // 2026-09-07 → 07/09/2026
}

function LigneRow({ modeleId, defautDate, ligne }: { modeleId: string; defautDate: string; ligne: LigneAssignationModele }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function assigner(date: string | null) {
    setErr(null); setInfo(null); setBusy(true)
    const res = await assignerModeleClasse(modeleId, ligne.classeId, date)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    if (res.ignore) { setInfo('Classe déjà servie pour cette année — ignorée.'); router.refresh(); return }
    if (res.horsPeriode) {
      setInfo(`${res.horsPeriode} exercice(s) du modèle, antérieur(s) au début de cette classe, n’ont pas été repris.`)
    }
    router.refresh()
  }
  async function retirer() {
    setErr(null); setInfo(null); setBusy(true)
    const res = await retirerModeleClasse(modeleId, ligne.classeId)
    setBusy(false)
    if (res.error) { setErr(res.error); return }
    router.refresh()
  }
  async function onSubmitDate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const date = (fd.get('dateDebut') as string) || null
    await assigner(date)
  }

  return (
    <div className="border border-bordure rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-medium text-encre">
          {ligne.nom}
          {ligne.typePedagogique && <span className="text-muet text-xs"> · {ligne.typePedagogique.toUpperCase()}</span>}
        </span>
        {ligne.assignee ? (
          <span className="flex items-center gap-2 text-xs">
            <span className="text-ok">assignée{ligne.dateDebut ? ` · début ${fmtDate(ligne.dateDebut)}` : ''}</span>
            <button onClick={retirer} disabled={busy} className="text-muet hover:text-retard disabled:opacity-50">Détacher</button>
          </span>
        ) : ligne.bloquee ? (
          <span className="text-xs text-muet">{ligne.bloquee}</span>
        ) : (
          <form onSubmit={onSubmitDate} className="flex items-end gap-2">
            <div className="w-44">
              <ChampDate name="dateDebut" defaultValue={defautDate} ariaLabel={`Date de début pour ${ligne.nom}`} />
            </div>
            <button type="submit" disabled={busy} className="text-xs bg-bouton text-surface px-3 py-2 rounded disabled:opacity-50">
              {busy ? '…' : 'Assigner'}
            </button>
          </form>
        )}
      </div>
      {err && <p className="text-retard text-xs mt-2">{err}</p>}
      {info && <p className="text-attention text-xs mt-2">{info}</p>}
    </div>
  )
}

export default function AssignationModeleClasses({
  modeleId, defautDate, lignes,
}: { modeleId: string; defautDate: string; lignes: LigneAssignationModele[] }) {
  return (
    <div className="space-y-3 border-t border-bordure pt-4">
      <h3 className="text-sm font-medium text-encre">Assigner ce modèle à des classes</h3>
      <p className="text-xs text-muet">
        Chaque assignation matérialise un plan INDÉPENDANT (copie du modèle) que la classe ajuste ensuite librement.
        « Détacher » retire le lien mais conserve le plan déjà créé.
      </p>
      {lignes.length === 0 ? (
        <p className="text-sm text-muet">Aucune classe active.</p>
      ) : (
        <div className="space-y-2">
          {lignes.map(l => <LigneRow key={l.classeId} modeleId={modeleId} defautDate={defautDate} ligne={l} />)}
        </div>
      )}
    </div>
  )
}
