import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import TableauEpreuve from './TableauEpreuve'

export default async function PageEpreuve({ params }: { params: Promise<{ epreuveId: string }> }) {
  const { epreuveId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const { data: epreuve } = await admin
    .from('fragments_essais_epreuves')
    .select('*')
    .eq('id', epreuveId)
    .single()

  if (!epreuve) notFound()

  // Élèves avec essai_actif=true
  const { data: themes } = await admin
    .from('fragments_themes')
    .select('eleve_id, essai_actif, question')
    .eq('essai_actif', true)

  const eleveIds = (themes ?? []).map(t => t.eleve_id)

  const { data: eleves } = eleveIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, display_name, classe')
        .in('id', eleveIds)
        .eq('role', 'eleve')
        .order('display_name')
    : { data: [] }

  // Essais pour cette épreuve
  const { data: essais } = await admin
    .from('fragments_essais')
    .select('id, eleve_id, depose_par, created_at')
    .eq('epreuve_id', epreuveId)

  type EssaiRow = { id: string; eleve_id: string; depose_par: string; created_at: string }
  const essaiParEleve: Record<string, EssaiRow> = {}
  for (const e of (essais ?? []) as EssaiRow[]) {
    essaiParEleve[e.eleve_id] = e
  }

  // Analyses
  const essaiIds = (essais ?? []).map(e => e.id)
  const { data: analyses } = essaiIds.length > 0
    ? await admin
        .from('essais_analyses')
        .select('id, essai_id, statut, lettre_structure, lettre_expression, lettre_argumentation, lettre_connaissances, note20_validee, publiee_at')
        .in('essai_id', essaiIds)
    : { data: [] }

  type AnalyseRow = { id: string; essai_id: string; statut: string; lettre_structure: string | null; lettre_expression: string | null; lettre_argumentation: string | null; lettre_connaissances: string | null; note20_validee: number | null; publiee_at: string | null }
  const analyseParEssai: Record<string, AnalyseRow> = {}
  for (const a of (analyses ?? []) as AnalyseRow[]) {
    analyseParEssai[a.essai_id] = a
  }

  // Distribution des lettres par dimension
  const analysesPubliees = (analyses ?? []).filter(a => a.statut === 'publiee' || a.lettre_structure)
  const dimensions = ['structure', 'expression', 'argumentation', 'connaissances'] as const
  const distribution: Record<string, Record<string, number>> = {}
  for (const dim of dimensions) {
    distribution[dim] = { A: 0, B: 0, C: 0, D: 0, E: 0 }
    for (const a of analysesPubliees) {
      const lettre = a[`lettre_${dim}` as keyof typeof a] as string | null
      if (lettre && lettre in distribution[dim]) {
        distribution[dim][lettre]++
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/prof/fragments-erudition/epreuves" className="text-sm text-stone-500 hover:text-stone-700">
          ← Épreuves
        </Link>
      </div>

      <div className="bg-white border border-stone-200 rounded-xl px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-serif text-stone-900">{epreuve.titre}</h3>
            <p className="text-sm text-stone-500 mt-0.5">
              {new Date(epreuve.date_epreuve).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{epreuve.duree_minutes} min
            </p>
            {epreuve.consignes && (
              <p className="text-sm text-stone-600 mt-2 italic">{epreuve.consignes}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
            epreuve.depots_ouverts ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'
          }`}>
            {epreuve.depots_ouverts ? 'Dépôts ouverts' : 'Dépôts fermés'}
          </span>
        </div>
      </div>

      <TableauEpreuve
        epreuve={epreuve}
        eleves={(eleves ?? []) as { id: string; display_name: string; classe: string | null }[]}
        essaiParEleve={essaiParEleve as Record<string, { id: string; eleve_id: string; depose_par: string; created_at: string } | undefined>}
        analyseParEssai={analyseParEssai as Record<string, { id: string; essai_id: string; statut: string; lettre_structure: string | null; lettre_expression: string | null; lettre_argumentation: string | null; lettre_connaissances: string | null; note20_validee: number | null; publiee_at: string | null } | undefined>}
        distribution={distribution}
      />
    </div>
  )
}
