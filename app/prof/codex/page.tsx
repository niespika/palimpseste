import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { lireUnitesScriptorium } from './actions'
import { FormulaireSeance } from './FormulaireSeance'

const STATUT_BADGE: Record<string, { label: string; classe: string }> = {
  brouillon: { label: 'Brouillon', classe: 'bg-stone-100 text-stone-500' },
  phase_1: { label: 'Phase 1 — V1', classe: 'bg-green-100 text-green-700' },
  phase_2: { label: 'Phase 2 — V-finale', classe: 'bg-blue-100 text-blue-700' },
  fermee: { label: 'Fermée', classe: 'bg-stone-100 text-stone-500' },
}

export default async function CodexProfPage() {
  const supabase = await createClient()

  const [unites, { data: seances }] = await Promise.all([
    lireUnitesScriptorium(),
    supabase
      .from('codex_sessions')
      .select('id, statut, classe_id, scriptorium_unite_id, created_at, scriptorium_unites(label)')
      .order('created_at', { ascending: false }),
  ])

  const labelUnite = (s: { scriptorium_unites: unknown }) => {
    const u = s.scriptorium_unites as { label: string } | { label: string }[] | null
    return Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? ''
  }

  const enCours = (seances ?? []).filter((s) => s.statut === 'phase_1' || s.statut === 'phase_2')
  const brouillons = (seances ?? []).filter((s) => s.statut === 'brouillon')
  const fermees = (seances ?? []).filter((s) => s.statut === 'fermee')

  function ligneSeance(s: NonNullable<typeof seances>[number]) {
    const badge = STATUT_BADGE[s.statut] ?? STATUT_BADGE.brouillon
    return (
      <Link
        key={s.id}
        href={`/prof/codex/seance/${s.id}`}
        className="flex items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-stone-300 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">{labelUnite(s)}</p>
          {s.classe_id && <p className="text-xs text-stone-400">{s.classe_id}</p>}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.classe}`}>
          {badge.label}
        </span>
      </Link>
    )
  }

  return (
    <div className="space-y-8">
      <FormulaireSeance unites={unites} />

      {enCours.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            En cours
          </h3>
          <div className="space-y-2">{enCours.map(ligneSeance)}</div>
        </section>
      )}

      {brouillons.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 mb-3">Brouillons</h3>
          <div className="space-y-2">{brouillons.map(ligneSeance)}</div>
        </section>
      )}

      {fermees.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-stone-500 mb-3">Séances passées</h3>
          <div className="space-y-2">{fermees.map(ligneSeance)}</div>
        </section>
      )}

      {(seances ?? []).length === 0 && (
        <p className="text-center text-stone-400 text-sm py-8">
          Aucune séance pour le moment. Crée-en une à partir d&apos;une unité du Scriptorium.
        </p>
      )}
    </div>
  )
}
