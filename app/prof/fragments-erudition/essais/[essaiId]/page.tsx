import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import TableauEssai from './TableauEssai'

export default async function PageEssai({
  params,
  searchParams,
}: {
  params: Promise<{ essaiId: string }>
  searchParams: Promise<{ classe?: string }>
}) {
  const { essaiId } = await params
  const { classe: classeId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const { data: epreuve } = await admin
    .from('fragments_essais_epreuves')
    .select('id, titre, duree_minutes, consignes, semestre_id')
    .eq('id', essaiId)
    .single()
  if (!epreuve) notFound()

  // La classe est portée par l'URL (?classe=) — plus de sélecteur global.
  const { data: classe } = classeId
    ? await admin.from('classes').select('id, nom').eq('id', classeId).maybeSingle()
    : { data: null }

  // Liaison (essai × classe) : date + état propres à cette classe.
  const { data: lien } = classeId
    ? await admin
        .from('fragments_essais_classes')
        .select('date_essai, depots_ouverts')
        .eq('essai_id', essaiId)
        .eq('classe_id', classeId)
        .maybeSingle()
    : { data: null }

  if (!classe || !lien) {
    return (
      <div className="space-y-4">
        <Link href="/prof/fragments-erudition/essais" className="text-sm text-muet hover:text-encre-douce">← Essais</Link>
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
          Cet essai n&apos;est pas assigné à cette classe (ou la classe est introuvable).<br />
          Reviens à <Link href="/prof/fragments-erudition/essais" className="underline">Essais</Link> et choisis une classe.
        </div>
      </div>
    )
  }

  // Inscriptions de la classe (1 inscription par élève)
  const inscrits = await inscriptionsClasse(admin, classe.id)
  const inscriptionIds = inscrits.map(i => i.id)
  const inscriptionParEleve = Object.fromEntries(inscrits.map(i => [i.eleve_id, i.id]))

  // Inscriptions avec essai_actif=true sur le semestre de l'essai
  const { data: themes } = inscriptionIds.length > 0
    ? await admin
        .from('fragments_themes')
        .select('eleve_id, essai_actif')
        .eq('essai_actif', true)
        .eq('semestre_id', epreuve.semestre_id)
        .in('inscription_id', inscriptionIds)
    : { data: [] }

  const eleveIds = (themes ?? []).map(t => t.eleve_id)

  const { data: elevesBruts } = eleveIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, display_name, classe')
        .in('id', eleveIds)
        .eq('role', 'eleve')
        .order('display_name')
    : { data: [] }

  const eleves = (elevesBruts ?? []).map(e => ({ ...e, inscription_id: inscriptionParEleve[e.id] }))

  // Dépôts pour cet essai (de cette classe)
  const { data: essais } = inscriptionIds.length > 0
    ? await admin
        .from('fragments_essai_depots')
        .select('id, eleve_id, depose_par, created_at')
        .eq('essai_id', essaiId)
        .in('inscription_id', inscriptionIds)
    : { data: [] }

  type EssaiRow = { id: string; eleve_id: string; depose_par: string; created_at: string }
  const essaiParEleve: Record<string, EssaiRow> = {}
  for (const e of (essais ?? []) as EssaiRow[]) {
    essaiParEleve[e.eleve_id] = e
  }

  // Analyses
  const essaiIds = (essais ?? []).map(e => e.id)
  const { data: analyses } = essaiIds.length > 0
    ? await admin
        .from('fragments_essai_depot_analyses')
        .select('id, depot_id, statut, lettre_structure, lettre_expression, lettre_argumentation, lettre_connaissances, note20_validee, publiee_at')
        .in('depot_id', essaiIds)
    : { data: [] }

  type AnalyseRow = { id: string; depot_id: string; statut: string; lettre_structure: string | null; lettre_expression: string | null; lettre_argumentation: string | null; lettre_connaissances: string | null; note20_validee: number | null; publiee_at: string | null }
  const analyseParEssai: Record<string, AnalyseRow> = {}
  for (const a of (analyses ?? []) as AnalyseRow[]) {
    analyseParEssai[a.depot_id] = a
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

  // Distribution des notes /20 (validées) — uniquement pour l'essai (porte un /20).
  const notes20 = analysesPubliees
    .map(a => a.note20_validee)
    .filter((n): n is number => n !== null && n !== undefined)

  const epreuveDetail = {
    id: epreuve.id,
    titre: epreuve.titre,
    duree_minutes: epreuve.duree_minutes,
    depots_ouverts: lien.depots_ouverts,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href={`/prof/fragments-erudition/essais?classe=${classe.id}`} className="text-sm text-muet hover:text-encre-douce">
          ← Essais
        </Link>
      </div>

      <div className="bg-surface border border-bordure rounded-xl px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-serif text-encre">{epreuve.titre} <span className="text-muet font-sans text-sm">· {classe.nom}</span></h3>
            <p className="text-sm text-muet mt-0.5">
              {new Date(lien.date_essai).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}{epreuve.duree_minutes} min
            </p>
            {epreuve.consignes && (
              <p className="text-sm text-encre-douce mt-2 italic">{epreuve.consignes}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
            lien.depots_ouverts ? 'bg-ok-teinte text-ok' : 'bg-parchemin-fonce text-muet'
          }`}>
            {lien.depots_ouverts ? 'Dépôts ouverts' : 'Dépôts fermés'}
          </span>
        </div>
      </div>

      <TableauEssai
        epreuve={epreuveDetail}
        classeId={classe.id}
        eleves={eleves as { id: string; display_name: string; classe: string | null; inscription_id: string }[]}
        essaiParEleve={essaiParEleve as Record<string, { id: string; eleve_id: string; depose_par: string; created_at: string } | undefined>}
        analyseParEssai={analyseParEssai as Record<string, { id: string; depot_id: string; statut: string; lettre_structure: string | null; lettre_expression: string | null; lettre_argumentation: string | null; lettre_connaissances: string | null; note20_validee: number | null; publiee_at: string | null } | undefined>}
        distribution={distribution}
        notes20={notes20}
      />
    </div>
  )
}
