import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import { chargerDiagnosticClasse } from './actions'
import { PROFIL_LABELS, type ProfilConcept } from '@/utils/diagnostic'
import { RapportIA } from './RapportIA'
import Tuile from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'

function Entrees({ vue }: { vue: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      <Tuile nom="Quizz" sousTitre="Fragilités par concept (QCM)" href="/prof/quazian/diagnostic?vue=quizz" selectionnee={vue === 'quizz'} />
      <Tuile nom="Flashcards" sousTitre="Révision & activité par élève" href="/prof/quazian/diagnostic?vue=flashcards" selectionnee={vue === 'flashcards'} />
    </div>
  )
}

export default async function DiagnosticPage({ searchParams }: { searchParams: Promise<{ vue?: string; classe?: string }> }) {
  const { vue = 'quizz', classe: classeSel } = await searchParams

  // ── Diagnostic flashcards (révision par élève, par classe) ────────────────
  if (vue === 'flashcards') {
    const supabase = await createClient()
    const admin = createAdminClient()
    const { data: classes } = await supabase.from('classes').select('id, nom').order('nom')
    const classesList = (classes ?? []) as { id: string; nom: string }[]

    let eleves: LigneEleve[] = []
    const classeChoisie = classesList.find(c => c.id === classeSel)
    if (classeChoisie) {
      const inscrits = await inscriptionsClasse(admin, classeChoisie.id)
      const eleveIds = inscrits.map(i => i.eleve_id)
      const [{ data: profils }, { data: etats }] = await Promise.all([
        eleveIds.length > 0 ? admin.from('profiles').select('id, display_name').in('id', eleveIds).order('display_name') : Promise.resolve({ data: [] }),
        eleveIds.length > 0 ? admin.from('quazian_card_states').select('eleve_id, reps, last_review, due').in('eleve_id', eleveIds) : Promise.resolve({ data: [] }),
      ])
      // eslint-disable-next-line react-hooks/purity -- Server Component : rendu une fois par requête, Date.now() est sûr ici
      const maintenant = Date.now()
      const parEleve = new Map<string, { revisees: number; backlog: number; derniere: number | null }>()
      for (const e of etats ?? []) {
        const id = e.eleve_id as string
        const agg = parEleve.get(id) ?? { revisees: 0, backlog: 0, derniere: null }
        if ((e.reps ?? 0) > 0) agg.revisees++
        if (e.due && new Date(e.due as string).getTime() <= maintenant) agg.backlog++
        if (e.last_review) {
          const t = new Date(e.last_review as string).getTime()
          agg.derniere = agg.derniere ? Math.max(agg.derniere, t) : t
        }
        parEleve.set(id, agg)
      }
      eleves = (profils ?? []).map((p): LigneEleve => {
        const a = parEleve.get(p.id as string) ?? { revisees: 0, backlog: 0, derniere: null }
        return {
          id: p.id as string,
          display_name: p.display_name as string,
          statut: (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className={a.revisees > 0 ? 'text-green-700' : 'text-stone-400'}>{a.revisees} carte{a.revisees > 1 ? 's' : ''} révisée{a.revisees > 1 ? 's' : ''}</span>
              <span className={a.backlog > 0 ? 'text-amber-600' : 'text-stone-400'}>backlog {a.backlog}</span>
              <span className="text-stone-400">{a.derniere ? `vu le ${new Date(a.derniere).toLocaleDateString('fr-FR')}` : 'jamais révisé'}</span>
            </div>
          ),
        }
      })
    }

    return (
      <div>
        <Entrees vue={vue} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {classesList.map(c => (
            <Tuile key={c.id} nom={c.nom} href={`/prof/quazian/diagnostic?vue=flashcards&classe=${c.id}`} selectionnee={classeSel === c.id} />
          ))}
        </div>
        {classeChoisie && (
          <DetailClasse nom={classeChoisie.nom} sousTitre="Révision des flashcards · backlog dû · dernière activité" eleves={eleves} />
        )}
      </div>
    )
  }

  // ── Diagnostic quizz (existant) ───────────────────────────────────────────
  const { diagnostics, profilesMap, conceptsClasse } = await chargerDiagnosticClasse()
  const eleveIds = Object.keys(diagnostics)
  const conceptsTries = Object.entries(conceptsClasse)
    .sort(([, a], [, b]) => (b.idee_fausse * 2 + b.lacune) - (a.idee_fausse * 2 + a.lacune))

  return (
    <div>
      <Entrees vue={vue} />

      {eleveIds.length === 0 ? (
        <div className="text-center py-12 text-stone-400 text-sm">
          Aucune donnée de quizz disponible. Lance et ferme au moins un quizz pour voir le diagnostic.
        </div>
      ) : (
        <>
          <RapportIA />

          <div className="mb-8">
            <h3 className="text-sm font-medium text-stone-600 mb-3">
              Fragilités par concept — {eleveIds.length} élève{eleveIds.length > 1 ? 's' : ''}
            </h3>

            <div className="flex gap-3 mb-4 flex-wrap">
              {(['idee_fausse', 'lacune', 'maitrise', 'insuffisant'] as ProfilConcept[]).map((p) => {
                const { label, couleur, bg } = PROFIL_LABELS[p]
                return (
                  <span key={p} className={`text-xs px-2 py-0.5 rounded-full border ${bg} ${couleur}`}>{label}</span>
                )
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="text-left pr-4 py-1 text-stone-400 font-normal min-w-32">Concept</th>
                    {eleveIds.map((id) => (
                      <th key={id} className="px-1 py-1 text-stone-400 font-normal">
                        <Link href={`/prof/quazian/diagnostic/${id}`} className="hover:text-stone-700">
                          {profilesMap[id]?.display_name?.split(' ')[0] ?? '?'}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {conceptsTries.slice(0, 20).map(([concept]) => (
                    <tr key={concept} className="border-t border-stone-50">
                      <td className="pr-4 py-1 text-stone-700 font-medium truncate max-w-40">{concept}</td>
                      {eleveIds.map((eleveId) => {
                        const diag = diagnostics[eleveId]?.find((d) => d.concept_tag === concept)
                        const profil = diag?.profil ?? null
                        const { bg } = profil ? PROFIL_LABELS[profil] : { bg: 'bg-stone-50' }
                        return (
                          <td key={eleveId} className="px-1 py-1 text-center">
                            <div className={`w-6 h-6 rounded ${bg} border mx-auto`} title={profil ? `${PROFIL_LABELS[profil].label} (${diag?.scoreMoyen.toFixed(1)})` : 'Pas de données'} />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-stone-600 mb-3">Vue par élève</h3>
            <div className="space-y-2">
              {eleveIds.map((id) => {
                const diag = diagnostics[id] ?? []
                const nIdeesFausses = diag.filter((d) => d.profil === 'idee_fausse').length
                const nLacunes = diag.filter((d) => d.profil === 'lacune').length
                const nMaitrise = diag.filter((d) => d.profil === 'maitrise').length
                return (
                  <Link key={id} href={`/prof/quazian/diagnostic/${id}`} className="flex items-center gap-4 bg-white border border-stone-200 rounded-xl px-4 py-3 hover:bg-stone-50 transition-colors">
                    <span className="font-medium text-stone-900 flex-1">{profilesMap[id]?.display_name ?? id}</span>
                    <div className="flex gap-2 text-xs">
                      {nIdeesFausses > 0 && <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-full">{nIdeesFausses} idée{nIdeesFausses > 1 ? 's' : ''} fausse{nIdeesFausses > 1 ? 's' : ''}</span>}
                      {nLacunes > 0 && <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full">{nLacunes} lacune{nLacunes > 1 ? 's' : ''}</span>}
                      {nMaitrise > 0 && <span className="px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 rounded-full">{nMaitrise} maîtrisé{nMaitrise > 1 ? 's' : ''}</span>}
                    </div>
                    <span className="text-stone-400 text-xs">→</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
