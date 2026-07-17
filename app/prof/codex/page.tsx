import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { lireUnitesScriptorium } from './actions'
import { preparerSynthese } from '../scriptorium/evaluations/actions'
import { chargerSynthesesAPreparer } from './synthese-a-preparer'
import { FormulaireSynthese } from './FormulaireSynthese'
import { libelleSession } from '@/utils/codex-libelle'
import { formatJour } from '@/utils/fuseau'
import Tuile from '@/components/Tuile'

async function actionPreparer(formData: FormData): Promise<void> {
  'use server'
  const res = await preparerSynthese(formData.get('exercice_id') as string)
  if (res.sessionId) redirect(`/prof/codex/synthese/${res.sessionId}`)
}

const STATUT_BADGE: Record<string, { label: string; classe: string }> = {
  brouillon: { label: 'Brouillon', classe: 'bg-parchemin-fonce text-muet' },
  phase_1: { label: 'Phase 1 — V1', classe: 'bg-info-teinte text-info' },
  phase_2: { label: 'Phase 2 — V-finale', classe: 'bg-info-teinte text-info' },
  fermee: { label: 'Fermée', classe: 'bg-parchemin-fonce text-muet' },
}

const SANS_CLASSE = 'aucune'

export default async function CodexProfPage({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const supabase = await createClient()
  const { classe: classeSel } = await searchParams

  const [unites, { data: syntheses }, { data: classes }] = await Promise.all([
    lireUnitesScriptorium(),
    supabase
      .from('codex_sessions')
      .select('id, statut, classe_id, scriptorium_unite_id, created_at, scriptorium_unites(label), scriptorium_contenus(titre), classes(nom)')
      .order('created_at', { ascending: false }),
    supabase.from('classes').select('id, nom').order('nom'),
  ])

  const labelUnite = (s: { scriptorium_unites: unknown; scriptorium_contenus: unknown }) =>
    libelleSession(s.scriptorium_unites, s.scriptorium_contenus)

  const classesList = (classes ?? []) as { id: string; nom: string }[]
  const toutes = syntheses ?? []
  // Synthèses de fin de cours planifiées (plan d'évaluation, gate). Vide gate OFF.
  const aPreparer = await chargerSynthesesAPreparer()

  // Nombre de synthèses par classe (clé SANS_CLASSE pour les synthèses non rattachées)
  const nbParClasse = new Map<string, number>()
  for (const s of toutes) {
    const k = (s.classe_id as string | null) ?? SANS_CLASSE
    nbParClasse.set(k, (nbParClasse.get(k) ?? 0) + 1)
  }
  const aSansClasse = (nbParClasse.get(SANS_CLASSE) ?? 0) > 0

  function ligneSynthese(s: (typeof toutes)[number]) {
    const badge = STATUT_BADGE[s.statut] ?? STATUT_BADGE.brouillon
    return (
      <Link
        key={s.id}
        href={`/prof/codex/synthese/${s.id}`}
        className="flex items-center justify-between gap-3 bg-surface border border-bordure rounded-xl px-4 py-3 hover:border-pigment transition-colors"
      >
        <p className="text-sm font-medium text-encre truncate min-w-0">{labelUnite(s)}</p>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${badge.classe}`}>{badge.label}</span>
      </Link>
    )
  }

  // Synthèses de la classe sélectionnée
  const synthesesClasse = classeSel
    ? toutes.filter(s => ((s.classe_id as string | null) ?? SANS_CLASSE) === classeSel)
    : []
  const enCours = synthesesClasse.filter(s => s.statut === 'phase_1' || s.statut === 'phase_2')
  const brouillons = synthesesClasse.filter(s => s.statut === 'brouillon')
  const fermees = synthesesClasse.filter(s => s.statut === 'fermee')
  const nomClasseSel = classeSel === SANS_CLASSE ? 'Sans classe' : classesList.find(c => c.id === classeSel)?.nom

  return (
    <div className="space-y-8">
      <FormulaireSynthese unites={unites} classes={classesList} />

      {/* Synthèses de fin de cours planifiées (plan d'évaluation). Gate OFF → aPreparer
          vide → rien ne s'affiche (page Codex inchangée). */}
      {aPreparer.length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-4">
          <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">
            Synthèses à préparer · {aPreparer.length}
          </h3>
          <div className="space-y-2">
            {aPreparer.map((s) => (
              <form key={s.exerciceId} action={actionPreparer} className="flex items-center gap-3 rounded-lg border border-bordure px-3 py-2">
                <input type="hidden" name="exercice_id" value={s.exerciceId} />
                <span className="font-corps text-sm text-encre flex-1 min-w-0 truncate">
                  {s.contenuTitre}
                  {s.classeNom && <span className="text-muet"> — {s.classeNom}</span>}
                </span>
                <span className="font-ui text-xs text-muet shrink-0">
                  {s.echeance ? formatJour(s.echeance, { day: 'numeric', month: 'short' }) : 'date à définir'}
                </span>
                <button type="submit" className="font-ui text-xs text-pigment hover:underline shrink-0">Préparer →</button>
              </form>
            ))}
          </div>
        </div>
      )}

      {toutes.length === 0 ? (
        <p className="text-center text-muet text-sm py-8">
          Aucune synthèse pour le moment. Crée-en une à partir d&apos;une unité du Scriptorium.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classesList.map(c => {
            const n = nbParClasse.get(c.id) ?? 0
            return (
              <Tuile
                key={c.id}
                nom={c.nom}
                sousTitre={`${n} synthèse${n > 1 ? 's' : ''}`}
                href={`/prof/codex?classe=${c.id}`}
                selectionnee={classeSel === c.id}
                couleur={n > 0 ? 'vert' : 'neutre'}
              />
            )
          })}
          {aSansClasse && (
            <Tuile
              nom="Sans classe"
              sousTitre={`${nbParClasse.get(SANS_CLASSE)} synthèse${(nbParClasse.get(SANS_CLASSE) ?? 0) > 1 ? 's' : ''}`}
              href={`/prof/codex?classe=${SANS_CLASSE}`}
              selectionnee={classeSel === SANS_CLASSE}
            />
          )}
        </div>
      )}

      {classeSel && (
        <div className="space-y-6">
          <h3 className="text-base font-medium text-encre">{nomClasseSel ?? 'Classe'} — synthèses</h3>
          {synthesesClasse.length === 0 && <p className="text-sm text-muet">Aucune synthèse pour cette classe.</p>}
          {enCours.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-muet mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-ok animate-pulse" /> En cours
              </h4>
              <div className="space-y-2">{enCours.map(ligneSynthese)}</div>
            </section>
          )}
          {brouillons.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-muet mb-2">Brouillons</h4>
              <div className="space-y-2">{brouillons.map(ligneSynthese)}</div>
            </section>
          )}
          {fermees.length > 0 && (
            <section>
              <h4 className="text-sm font-medium text-muet mb-2">Synthèses passées</h4>
              <div className="space-y-2">{fermees.map(ligneSynthese)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
