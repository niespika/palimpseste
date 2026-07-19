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
    <div className="border border-bordure rounded-xl bg-white p-3">
      <div className="flex items-center justify-between gap-2.5 flex-wrap">
        <span className="font-corps text-[16px] font-semibold text-encre">
          {ligne.nom}
          {ligne.typePedagogique && <span className="font-ui text-[12px] text-muet-clair"> · {ligne.typePedagogique.toUpperCase()}</span>}
        </span>
        {ligne.assignee ? (
          <span className="flex items-center gap-2.5 font-ui text-[12px]">
            <span className="text-ok">assignée{ligne.dateDebut ? ` · début ${fmtDate(ligne.dateDebut)}` : ''}</span>
            <button onClick={retirer} disabled={busy} className="text-muet hover:text-retard disabled:opacity-50">Détacher</button>
          </span>
        ) : ligne.bloquee ? (
          <span className="font-ui text-[12px] text-muet">{ligne.bloquee}</span>
        ) : (
          <form onSubmit={onSubmitDate} className="flex items-end gap-2">
            <div className="w-40"><ChampDate name="dateDebut" defaultValue={defautDate} ariaLabel={`Date de début pour ${ligne.nom}`} /></div>
            <button type="submit" disabled={busy} className="font-ui text-[12px] font-semibold bg-bouton-plan text-bouton-plan-texte px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
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
    <div className="flex flex-col gap-3">
      <span className="font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-encre-douce">Assigner à des classes</span>
      {lignes.length === 0 ? (
        <p className="text-sm text-muet">Aucune classe active.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {lignes.map(l => <LigneRow key={l.classeId} modeleId={modeleId} defautDate={defautDate} ligne={l} />)}
        </div>
      )}
      <p className="font-corps text-[13px] leading-relaxed text-attention bg-attention-teinte border border-attention/30 rounded-lg px-3 py-2.5">
        Chaque assignation crée un plan <strong>indépendant</strong> (copie du modèle) que la classe ajuste ensuite. « Détacher » retire le lien mais conserve le plan déjà créé.
      </p>
    </div>
  )
}
