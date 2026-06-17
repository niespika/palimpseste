import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { lireUnitesScriptorium } from './actions'
import { FormulaireSeance } from './FormulaireSeance'
import Tuile from '@/components/Tuile'

const STATUT_BADGE: Record<string, { label: string; classe: string }> = {
  brouillon: { label: 'Brouillon', classe: 'bg-stone-100 text-stone-500' },
  phase_1: { label: 'Phase 1 — V1', classe: 'bg-green-100 text-green-700' },
  phase_2: { label: 'Phase 2 — V-finale', classe: 'bg-blue-100 text-blue-700' },
  fermee: { label: 'Fermée', classe: 'bg-stone-100 text-stone-500' },
}

const SANS_CLASSE = 'aucune'

export default async function CodexProfPage({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const { classe: classeSel } = await searchParams

  const [unites, { data: seances }, { data: classes }] = await Promise.all([
    lireUnitesScriptorium(),
    supabase
      .from('codex_sessions')
      .select('id, statut, classe_id, scriptorium_unite_id, created_at, scriptorium_unites(label), classes(nom)')
      .order('created_at', { ascending: false }),
    supabase.from('classes').select('id, nom').order('nom'),
  ])

  const labelUnite = (s: { scriptorium_unites: unknown }) => {
    const u = s.scriptorium_unites as { label: string } | { label: string }[] | null
    return Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? ''
  }

  const classesList = (classes ?? []) as { id: string; nom: string }[]
  const toutes = seances ?? []

  // Nombre de séances par classe (clé SANS_CLASSE pour les séances non rattachées)
  const nbParClasse = new Map<string, number>()
  for (const s of toutes) {
    const k = (s.classe_id as string | null) ?? SANS_CLASSE
    nbParClasse.set(k, (nbParClasse.get(k) ?? 0) + 1)
  }
  const aSansClasse = (nbParClasse.get(SANS_CLASSE) ?? 0) > 0

  function ligneSeance(s: (typeof toutes)[number]) {
    const badge = STATUT_BADGE[s.statut] ?? STATUT_BADGE.brouillon
    return (
      <Link
        key={s.id}
        href={`/prof/codex/seance/${s.id}`}
        className="flex items-center justify-between gap-3 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:border-stone-300 transition-colors"
      >
        <p className="text-sm font-medium text-stone-800 truncate min-w-0">{labelUnite(s)}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.classe}`}>{badge.label}</span>
      </Link>
    )
  }

  // Séances de la classe sélectionnée
  const seancesClasse = classeSel
    ? toutes.filter(s => ((s.classe_id as string | null) ?? SANS_CLASSE) === classeSel)
    : []
  const enCours = seancesClasse.filter(s => s.statut === 'phase_1' || s.statut === 'phase_2')
  const brouillons = seancesClasse.filter(s => s.statut === 'brouillon')
  const fermees = seancesClasse.filter(s => s.statut === 'fermee')
  const nomClasseSel = classeSel === SANS_CLASSE ? 'Sans classe' : classesList.find(c => c.id === classeSel)?.nom

  return (
    <div className="space-y-8">
      <FormulaireSeance unites={unites} classes={classesList} />

      {toutes.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-8">
          Aucune séance pour le moment. Crée-en une à partir d&apos;une unité du Scriptorium.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classesList.map(c => {
            const n = nbParClasse.get(c.id) ?? 0
            return (
              <Tuile
                key={c.id}
                nom={c.nom}
                sousTitre={`${n} séance${n > 1 ? 's' : ''} de synthèse`}
                href={`/prof/codex?classe=${c.id}`}
                selectionnee={classeSel === c.id}
                couleur={n > 0 ? 'vert' : 'neutre'}
              />
            )
          })}
          {aSansClasse && (
            <Tuile
              nom="Sans classe"
              sousTitre={`${nbParClasse.get(SANS_CLASSE)} séance${(nbParClasse.get(SANS_CLASSE) ?? 0) > 1 ? 's' : ''}`}
              href={`/prof/codex?classe=${SANS_CLASSE}`}
              selectionnee={classeSel === SANS_CLASSE}
            />
          )}
        </div>
      )}

      {classeSel && (
        <div className="space-y-6">
          <h3 className="text-base font-medium text-stone-900">{nomClasseSel ?? 'Classe'} — séances de synthèse</h3>
          {seancesClasse.length === 0 && <p className="text-sm text-stone-400">Aucune séance pour cette classe.</p>}
          {enCours.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-stone-500 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> En cours
              </h4>
              <div className="space-y-2">{enCours.map(ligneSeance)}</div>
            </section>
          )}
          {brouillons.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-stone-500 mb-2">Brouillons</h4>
              <div className="space-y-2">{brouillons.map(ligneSeance)}</div>
            </section>
          )}
          {fermees.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-stone-500 mb-2">Séances passées</h4>
              <div className="space-y-2">{fermees.map(ligneSeance)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
