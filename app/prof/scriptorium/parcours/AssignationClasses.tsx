'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ChampDate from '@/app/prof/calendrier/config/ChampDate'
import { assignerParcoursClasse, retirerParcoursClasse } from '../actions'
import type { LigneAssignation, ApercuFrise } from './frise-serveur'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}

function ApercuBloc({ apercu }: { apercu: ApercuFrise }) {
  return (
    <div className="mt-2 space-y-1.5">
      {apercu.avisBloquant && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">
          ⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.
        </p>
      )}
      {apercu.snap && (
        <p className="text-xs text-muet">
          Date ramenée à la semaine d’enseignement du {fmtJour(apercu.snap.dateRamenee)} (la date saisie tombait en vacances / hors semestre).
        </p>
      )}
      {apercu.avis && !apercu.avisBloquant && (
        <p className="text-xs text-muet">{apercu.avis}</p>
      )}
      {apercu.nbNonPlanifiable > 0 && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">
          {apercu.nbNonPlanifiable} semaine(s) non planifiable(s) — au-delà de l’année scolaire. Raccourcis le parcours ou définis le semestre suivant.
        </p>
      )}
      {apercu.nbADefinir > 0 && (
        <p className="text-xs bg-attention-teinte text-attention px-2 py-1 rounded">
          {apercu.nbADefinir} semaine(s) « à définir » — semestre de l’année scolaire pas encore créé.
        </p>
      )}
      <div className="max-h-40 overflow-y-auto border border-bordure rounded divide-y divide-bordure">
        {apercu.semaines.map(s => (
          <div key={s.semaine} className="flex items-center justify-between px-2 py-1 text-xs">
            <span className="text-encre-douce">Sem. {s.semaine}</span>
            {s.statut === 'definie' && s.dateReelle ? (
              <span className="text-encre">
                {fmtJour(s.dateReelle)} <span className="text-muet">· {s.semestreNom} · sem. {s.pedaDansSemestre}</span>
              </span>
            ) : s.statut === 'a_definir' ? (
              <span className="text-attention">à définir</span>
            ) : (
              <span className="text-retard">non planifiable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function LigneRow({ parcoursId, ligne }: { parcoursId: string; ligne: LigneAssignation }) {
  const router = useRouter()
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [avis, setAvis] = useState<string | null>(null)

  async function assigner(date: string | null) {
    setErreur(null); setAvis(null); setChargement(true)
    const res = await assignerParcoursClasse(parcoursId, ligne.classeId, date)
    setChargement(false)
    if (res.bloque || res.error) { setErreur(res.error ?? 'Enregistrement refusé.'); return }
    if (res.avis) setAvis(res.avis)
    router.refresh()
  }

  async function retirer() {
    setErreur(null); setChargement(true)
    const res = await retirerParcoursClasse(parcoursId, ligne.classeId)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-encre">{ligne.nom}</span>
        {ligne.assigned ? (
          <button onClick={retirer} disabled={chargement} className="text-xs text-muet hover:text-retard disabled:opacity-50">Retirer</button>
        ) : (
          <button onClick={() => assigner(null)} disabled={chargement} className="text-xs bg-bouton text-surface px-2 py-1 rounded disabled:opacity-50">Assigner</button>
        )}
      </div>

      {ligne.assigned && (
        <form onSubmit={onSubmitDate} className="mt-2 flex items-end gap-2 flex-wrap">
          <div className="w-56">
            <label className="block text-xs text-muet mb-1">Date de début (propre à cette classe)</label>
            <ChampDate name="dateDebut" defaultValue={ligne.dateDebut ?? ''} ariaLabel="Date de début du parcours pour cette classe" />
          </div>
          <button type="submit" disabled={chargement} className="text-xs bg-bouton text-surface px-3 py-2 rounded disabled:opacity-50">
            {chargement ? '…' : 'Planifier'}
          </button>
        </form>
      )}

      {erreur && <p className="text-retard text-xs mt-2">{erreur}</p>}
      {avis && <p className="text-attention text-xs mt-2">{avis}</p>}

      {ligne.assigned && ligne.apercu && <ApercuBloc apercu={ligne.apercu} />}
      {ligne.assigned && !ligne.apercu && (
        <p className="text-xs text-muet mt-2">Aucune date — pose une date de début pour voir les échéances réelles.</p>
      )}
    </div>
  )
}

export default function AssignationClasses({ parcoursId, lignes }: { parcoursId: string; lignes: LigneAssignation[] }) {
  return (
    <div className="space-y-3 border-t border-bordure pt-4">
      <h3 className="text-sm font-medium text-encre">Assignation par classe</h3>
      {lignes.length === 0 ? (
        <p className="text-sm text-muet">Aucune classe pour l’instant.</p>
      ) : (
        <div className="space-y-2">
          {lignes.map(l => <LigneRow key={l.classeId} parcoursId={parcoursId} ligne={l} />)}
        </div>
      )}
    </div>
  )
}
