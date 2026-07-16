'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { validerPlan, marquerConcu, retirerExercice } from './actions'
import type { PlanDetail, ExerciceLigne } from './plan-serveur'

function fmtJour(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}` // 2026-09-21 → 21/09
}

const LABELS: Record<string, string> = {
  ecriture: 'Écriture',
  lecture: 'Lecture',
  synthese: 'Synthèse',
  quiz: 'Quiz',
  examen_livre: 'Examen sur le livre',
  fragment: 'Fragment',
  essai: 'Essai',
}
function libelleType(e: ExerciceLigne): string {
  const base = LABELS[e.typeExercice] ?? e.typeExercice
  return e.diagnostique ? `${base} diagnostique` : base
}

function LigneExercice({ e }: { e: ExerciceLigne }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function act(fn: (fd: FormData) => Promise<{ error?: string; success?: boolean }>) {
    setErr(null)
    setBusy(true)
    const fd = new FormData()
    fd.set('exercice_id', e.id)
    const res = await fn(fd)
    setBusy(false)
    if (res.error) {
      setErr(res.error)
      return
    }
    router.refresh()
  }

  const badge =
    e.statut === 'concu' ? (
      <span className="bg-ok-teinte text-ok px-1.5 py-0.5 rounded">conçu</span>
    ) : e.enRetard ? (
      <span className="bg-retard-teinte text-retard px-1.5 py-0.5 rounded">en retard</span>
    ) : (
      <span className="bg-attention-teinte text-attention px-1.5 py-0.5 rounded">à concevoir</span>
    )

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs border-t border-bordure first:border-t-0">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        <span className="text-encre">{libelleType(e)}</span>
        <span className="text-muet">· {e.lieu === 'maison' ? 'maison' : 'classe'}</span>
        <span className="text-muet">
          · à rendre {fmtJour(e.echeance)}
          {e.lieu === 'classe' && !e.jourPrevu ? ' (jour à caler)' : ''}
        </span>
        {badge}
      </div>
      {e.statut === 'a_concevoir' && (
        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={() => act(marquerConcu)} disabled={busy} className="text-encre-douce hover:text-encre disabled:opacity-50">
            Marquer conçu
          </button>
          <button onClick={() => act(retirerExercice)} disabled={busy} className="text-muet hover:text-retard disabled:opacity-50">
            Retirer
          </button>
        </div>
      )}
      {err && <span className="text-retard flex-shrink-0">{err}</span>}
    </div>
  )
}

export default function GrillePlan({ plan }: { plan: PlanDetail }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function valider() {
    setErr(null)
    setBusy(true)
    const fd = new FormData()
    fd.set('plan_id', plan.id)
    const res = await validerPlan(fd)
    setBusy(false)
    if (res.error) {
      setErr(res.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h3 className="text-sm font-medium text-encre">
            {plan.classeNom} — Plan {plan.anneeScolaire}–{plan.anneeScolaire + 1}
          </h3>
          <p className="text-xs text-muet">
            Gabarit {plan.gabarit.toUpperCase()} · début {fmtJour(plan.dateDebut)} ·{' '}
            {plan.statut === 'valide' ? <span className="text-ok">validé</span> : <span className="text-attention">brouillon</span>}
          </p>
        </div>
        {plan.statut === 'brouillon' && (
          <button
            onClick={valider}
            disabled={busy}
            className="px-3 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {busy ? '…' : 'Valider le plan'}
          </button>
        )}
      </div>
      {err && <p className="text-xs text-retard">{err}</p>}

      {plan.avisBloquant && (
        <p className="text-xs bg-retard-teinte text-retard px-2 py-1 rounded">
          ⚠ Configuration des semestres incohérente (chevauchement) — corrige-la dans le Calendrier.
        </p>
      )}
      {plan.avis && !plan.avisBloquant && <p className="text-xs text-muet">{plan.avis}</p>}
      {plan.aRecaler.length > 0 && (
        <p className="text-xs bg-attention-teinte text-attention px-2 py-1 rounded">
          {plan.aRecaler.length} exercice(s) à recaler : leur semaine ne tombe plus dans un semestre (le calendrier a changé depuis la
          génération). Le recalage explicite arrive avec la suite du lot.
        </p>
      )}

      <div className="border border-bordure rounded-lg divide-y divide-bordure">
        {plan.semaines.length === 0 ? (
          <p className="text-sm text-muet p-3">Aucune semaine d’enseignement couverte — définis les semestres dans le Calendrier.</p>
        ) : (
          plan.semaines.map((s) => (
            <div key={s.lundi} className="p-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-encre-douce">Lundi {fmtJour(s.lundi)}</span>
                <span className="text-muet">{s.semestreNom ? `${s.semestreNom} · sem. ${s.pedaNum}` : ''}</span>
              </div>
              {s.exercices.length === 0 ? (
                <p className="text-xs text-muet pl-2">—</p>
              ) : (
                <div className="border border-bordure rounded">
                  {s.exercices.map((e) => (
                    <LigneExercice key={e.id} e={e} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
