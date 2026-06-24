import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import { chargerDiagnosticClasse, chargerDiagnosticParUnite } from './actions'
import { PROFIL_LABELS, type ProfilConcept, type DiagnosticConcept } from '@/utils/diagnostic'
import { RapportIA } from './RapportIA'
import Tuile from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'

function Entrees({ vue }: { vue: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <Tuile nom="Par classe" sousTitre="Fragilités par concept (quizz) → élève" href="/prof/quazian/diagnostic?vue=classe" selectionnee={vue === 'classe'} />
      <Tuile nom="Par unité" sousTitre="Fragilités par unité (cours + texte)" href="/prof/quazian/diagnostic?vue=unite" selectionnee={vue === 'unite'} />
      <Tuile nom="Flashcards" sousTitre="Révision & activité par élève" href="/prof/quazian/diagnostic?vue=flashcards" selectionnee={vue === 'flashcards'} />
    </div>
  )
}

// Matrice concept × élève + liste par élève, pour une classe donnée (ou toutes).
function MatriceClasse({
  diagnostics, profilesMap, conceptsClasse,
}: {
  diagnostics: Record<string, DiagnosticConcept[]>
  profilesMap: Record<string, { display_name: string; classe: string | null }>
  conceptsClasse: Record<string, { idee_fausse: number; lacune: number; maitrise: number }>
}) {
  const eleveIds = Object.keys(diagnostics)
  const conceptsTries = Object.entries(conceptsClasse)
    .sort(([, a], [, b]) => (b.idee_fausse * 2 + b.lacune) - (a.idee_fausse * 2 + a.lacune))

  if (eleveIds.length === 0) {
    return (
      <div className="text-center py-12 text-muet text-sm">
        Aucune donnée de quizz pour cette sélection. Lance et ferme au moins un quizz.
      </div>
    )
  }

  return (
    <>
      <div className="mb-8">
        <h3 className="text-sm font-medium text-encre-douce mb-3">
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
                <th className="text-left pr-4 py-1 text-muet font-normal min-w-32">Concept</th>
                {eleveIds.map((id) => (
                  <th key={id} className="px-1 py-1 text-muet font-normal">
                    <Link href={`/prof/quazian/diagnostic/${id}`} className="hover:text-encre-douce">
                      {profilesMap[id]?.display_name?.split(' ')[0] ?? '?'}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conceptsTries.slice(0, 20).map(([concept]) => (
                <tr key={concept} className="border-t border-bordure">
                  <td className="pr-4 py-1 text-encre-douce font-medium truncate max-w-40">{concept}</td>
                  {eleveIds.map((eleveId) => {
                    const diag = diagnostics[eleveId]?.find((d) => d.concept_tag === concept)
                    const profil = diag?.profil ?? null
                    const { bg } = profil ? PROFIL_LABELS[profil] : { bg: 'bg-parchemin-fonce' }
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
        <h3 className="text-sm font-medium text-encre-douce mb-3">Vue par élève</h3>
        <div className="space-y-2">
          {eleveIds.map((id) => {
            const diag = diagnostics[id] ?? []
            const nIdeesFausses = diag.filter((d) => d.profil === 'idee_fausse').length
            const nLacunes = diag.filter((d) => d.profil === 'lacune').length
            const nMaitrise = diag.filter((d) => d.profil === 'maitrise').length
            return (
              <Link key={id} href={`/prof/quazian/diagnostic/${id}`} className="flex items-center gap-4 bg-surface border border-bordure rounded-xl px-4 py-3 hover:bg-parchemin-fonce transition-colors">
                <span className="font-medium text-encre flex-1">{profilesMap[id]?.display_name ?? id}</span>
                <div className="flex gap-2 text-xs">
                  {nIdeesFausses > 0 && <span className="px-2 py-0.5 bg-retard-teinte border border-retard text-retard rounded-full">{nIdeesFausses} idée{nIdeesFausses > 1 ? 's' : ''} fausse{nIdeesFausses > 1 ? 's' : ''}</span>}
                  {nLacunes > 0 && <span className="px-2 py-0.5 bg-attention-teinte border border-attention text-attention rounded-full">{nLacunes} lacune{nLacunes > 1 ? 's' : ''}</span>}
                  {nMaitrise > 0 && <span className="px-2 py-0.5 bg-ok-teinte border border-ok text-ok rounded-full">{nMaitrise} maîtrisé{nMaitrise > 1 ? 's' : ''}</span>}
                </div>
                <span className="text-muet text-xs">→</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default async function DiagnosticPage({ searchParams }: { searchParams: Promise<{ vue?: string; classe?: string; unite?: string }> }) {
  const { vue = 'classe', classe: classeSel, unite: uniteSel } = await searchParams

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
              <span className={a.revisees > 0 ? 'text-ok' : 'text-muet'}>{a.revisees} carte{a.revisees > 1 ? 's' : ''} révisée{a.revisees > 1 ? 's' : ''}</span>
              <span className={a.backlog > 0 ? 'text-attention' : 'text-muet'}>backlog {a.backlog}</span>
              <span className="text-muet">{a.derniere ? `vu le ${new Date(a.derniere).toLocaleDateString('fr-FR')}` : 'jamais révisé'}</span>
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

  // ── Diagnostic par unité (cours + texte) ──────────────────────────────────
  if (vue === 'unite') {
    const { unites, parUnite } = await chargerDiagnosticParUnite()
    const uniteChoisie = unites.find(u => u.id === uniteSel)
    const aggChoisie = uniteChoisie ? parUnite[uniteChoisie.id] : undefined

    // Concepts triés par fragilité (idées fausses pèsent double)
    const conceptsTries = aggChoisie
      ? Object.entries(aggChoisie.concepts).sort(([, a], [, b]) => (b.idee_fausse * 2 + b.lacune) - (a.idee_fausse * 2 + a.lacune))
      : []

    return (
      <div>
        <Entrees vue={vue} />
        {unites.length === 0 ? (
          <div className="text-center py-12 text-muet text-sm">Aucune unité de cours dans le Scriptorium.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
            {unites.map(u => {
              const agg = parUnite[u.id]
              const nIdees = agg ? Object.values(agg.concepts).reduce((s, c) => s + c.idee_fausse, 0) : 0
              const nLac = agg ? Object.values(agg.concepts).reduce((s, c) => s + c.lacune, 0) : 0
              return (
                <Tuile
                  key={u.id}
                  nom={u.label}
                  sousTitre={agg ? `${agg.nbEleves} élève${agg.nbEleves > 1 ? 's' : ''} évalué${agg.nbEleves > 1 ? 's' : ''}` : 'Pas encore de quizz'}
                  href={`/prof/quazian/diagnostic?vue=unite&unite=${u.id}`}
                  selectionnee={uniteSel === u.id}
                  couleur={nIdees > 0 ? 'rouge' : nLac > 0 ? 'neutre' : 'vert'}
                  resume={(nIdees > 0 || nLac > 0)
                    ? <span className="text-xs">{nIdees > 0 && <span className="text-retard">{nIdees} idée{nIdees > 1 ? 's' : ''} fausse{nIdees > 1 ? 's' : ''}</span>}{nIdees > 0 && nLac > 0 && ' · '}{nLac > 0 && <span className="text-attention">{nLac} lacune{nLac > 1 ? 's' : ''}</span>}</span>
                    : undefined}
                />
              )
            })}
          </div>
        )}

        {uniteChoisie && (
          <div className="bg-surface border border-bordure rounded-xl p-5">
            <h3 className="text-sm font-medium text-encre-douce mb-1">{uniteChoisie.label}</h3>
            <p className="text-xs text-muet mb-4">Concepts les plus fragiles sur cette unité (cours + texte), tous quizz confondus.</p>
            {conceptsTries.length === 0 ? (
              <p className="text-sm text-muet">Aucun quizz n&apos;a encore couvert cette unité.</p>
            ) : (
              <ul className="space-y-1.5">
                {conceptsTries.slice(0, 20).map(([concept, c]) => (
                  <li key={concept} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-parchemin-fonce">
                    <span className="text-sm text-encre font-medium flex-1 truncate">{concept}</span>
                    {c.idee_fausse > 0 && <span className="text-xs px-2 py-0.5 bg-retard-teinte border border-retard text-retard rounded-full">{c.idee_fausse} idée{c.idee_fausse > 1 ? 's' : ''} fausse{c.idee_fausse > 1 ? 's' : ''}</span>}
                    {c.lacune > 0 && <span className="text-xs px-2 py-0.5 bg-attention-teinte border border-attention text-attention rounded-full">{c.lacune} lacune{c.lacune > 1 ? 's' : ''}</span>}
                    {c.maitrise > 0 && <span className="text-xs px-2 py-0.5 bg-ok-teinte border border-ok text-ok rounded-full">{c.maitrise} maîtrisé{c.maitrise > 1 ? 's' : ''}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── Diagnostic par classe (quizz) → élève ─────────────────────────────────
  const supabase = await createClient()
  const { data: classes } = await supabase.from('classes').select('id, nom').order('nom')
  const classesList = (classes ?? []) as { id: string; nom: string }[]
  const classeChoisie = classesList.find(c => c.id === classeSel)

  const { diagnostics, profilesMap, conceptsClasse } = classeChoisie
    ? await chargerDiagnosticClasse(classeChoisie.id)
    : { diagnostics: {} as Record<string, DiagnosticConcept[]>, profilesMap: {}, conceptsClasse: {} }

  return (
    <div>
      <Entrees vue={vue} />

      {/* Synthèse IA — vue d'ensemble toutes classes */}
      <RapportIA />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {classesList.map(c => (
          <Tuile key={c.id} nom={c.nom} href={`/prof/quazian/diagnostic?vue=classe&classe=${c.id}`} selectionnee={classeSel === c.id} />
        ))}
      </div>

      {classeChoisie ? (
        <MatriceClasse diagnostics={diagnostics} profilesMap={profilesMap} conceptsClasse={conceptsClasse} />
      ) : (
        <p className="text-center py-8 text-muet text-sm">Choisis une classe pour voir le détail des fragilités par concept et par élève.</p>
      )}
    </div>
  )
}
