import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { inscriptionEleveClasse, classesAvecModule } from '@/utils/acces'
import { semestreFragmentsActif } from '../../contexte-semestre'
import { noteVersLettre } from '@/utils/notation'
import GraphiqueProgression from '@/components/fragments/GraphiqueProgression'
import type { PointSemaine } from '@/components/fragments/GraphiqueProgression'

export default async function PageEleveDetail({
  params,
  searchParams,
}: {
  params: Promise<{ eleveId: string }>
  searchParams: Promise<{ classe?: string }>
}) {
  const { eleveId } = await params
  const { classe: classeParam } = await searchParams

  // Vérifier que l'utilisateur est prof
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  // Profil de l'élève
  const { data: eleve } = await admin
    .from('profiles')
    .select('id, display_name, classe')
    .eq('id', eleveId)
    .single()

  if (!eleve) notFound()

  // Classe portée par l'URL (?classe=) ; à défaut, 1ʳᵉ inscription de l'élève
  // dans une classe du module (cas mono-classe, le plus courant).
  let classeId: string | null = classeParam ?? null
  if (!classeId) {
    const { data: mod } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
    const classesMod = mod ? await classesAvecModule(admin, mod.id) : []
    const classeIds = new Set(classesMod.map(c => c.id))
    const { data: inscs } = await admin.from('inscriptions').select('classe_id').eq('eleve_id', eleveId).eq('statut', 'active')
    classeId = (inscs ?? []).map(i => i.classe_id as string).find(cid => classeIds.has(cid)) ?? null
  }
  const inscriptionId = classeId ? await inscriptionEleveClasse(admin, eleveId, classeId) : null
  if (!inscriptionId) {
    return (
      <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
        Cet élève n&apos;est inscrit dans aucune classe du module.
      </div>
    )
  }

  // Thème de l'inscription pour le semestre consulté
  const { semestre } = await semestreFragmentsActif(supabase)
  let themeQuery = admin
    .from('fragments_themes')
    .select('theme, description')
    .eq('inscription_id', inscriptionId)
  if (semestre) themeQuery = themeQuery.eq('semestre_id', semestre.id)
  const { data: theme } = await themeQuery.maybeSingle()

  // Semaines du semestre consulté (sinon le détail mélange tous les semestres, en désaccord
  // avec la vue d'ensemble qui est, elle, scopée au semestre).
  let semainesQuery = admin
    .from('fragments_semaines')
    .select('id, numero, titre, date_debut, date_limite')
    .order('numero')
  if (semestre) semainesQuery = semainesQuery.eq('semestre_id', semestre.id)
  const { data: semaines } = await semainesQuery
  const semaineIdsSemestre = new Set((semaines ?? []).map(s => s.id as string))

  // Dépôts de cette inscription, restreints aux semaines du semestre consulté.
  const { data: depotsTous } = await admin
    .from('fragments_depots')
    .select('id, semaine_id, statut, created_at')
    .eq('inscription_id', inscriptionId)
    .order('created_at')
  const depots = (depotsTous ?? []).filter(d => semaineIdsSemestre.has(d.semaine_id as string))

  const depotParSemaine = Object.fromEntries(
    (depots ?? []).map(d => [d.semaine_id, d])
  )

  // Analyses publiées pour ces dépôts
  const depotIds = (depots ?? []).map(d => d.id)
  const { data: analyses } = depotIds.length > 0
    ? await admin
        .from('fragments_analyses')
        .select('id, depot_id, statut, note_decouvertes, note_sources, note_reflexions, publiee_at')
        .eq('statut', 'publiee')
        .in('depot_id', depotIds)
    : { data: [] }

  const analyseParDepot = Object.fromEntries(
    (analyses ?? []).map(a => [a.depot_id, a])
  )

  // Présentations orales publiées
  const { data: presentationsEleve2 } = await admin
    .from('fragments_presentations')
    .select('id, semaine_id, statut')
    .eq('inscription_id', inscriptionId)

  const presIds = (presentationsEleve2 ?? []).map(p => p.id)
  const { data: oraux } = presIds.length > 0
    ? await admin.from('fragments_oraux').select('id, presentation_id').in('presentation_id', presIds)
    : { data: [] }

  const oralParPresId = Object.fromEntries((oraux ?? []).map(o => [o.presentation_id, o]))

  // Pour les points du graphique avec données orales
  const oralIds2 = (oraux ?? []).map(o => o.id)
  const { data: analysesOrales2 } = oralIds2.length > 0
    ? await admin
        .from('fragments_analyses_orales')
        .select('oral_id, note_contenu, note_structure, note_expression')
        .not('publiee_at', 'is', null)
        .in('oral_id', oralIds2)
    : { data: [] }

  const analyseOraleParOralId = Object.fromEntries((analysesOrales2 ?? []).map(a => [a.oral_id, a]))

  const oralParSemaine: Record<string, { note_contenu: number | null; note_structure: number | null; note_expression: number | null }> = {}
  for (const pres of presentationsEleve2 ?? []) {
    const oral = oralParPresId[pres.id]
    if (!oral) continue
    const analyseOrale = analyseOraleParOralId[oral.id]
    if (!analyseOrale) continue
    oralParSemaine[pres.semaine_id] = analyseOrale
  }

  // Pistes en attente (proposee ou partiellement_suivie)
  const analyseIds = (analyses ?? []).map(a => a.id)
  const { data: pistesEnAttente } = analyseIds.length > 0
    ? await admin
        .from('fragments_pistes')
        .select('id, contenu, statut, created_at')
        .in('analyse_id', analyseIds)
        .in('statut', ['proposee', 'partiellement_suivie'])
        .order('created_at', { ascending: false })
    : { data: [] }

  // Historique des présentations
  const { data: presentationsEleve } = await admin
    .from('fragments_presentations')
    .select('id, semaine_id, statut, created_at')
    .eq('inscription_id', inscriptionId)
    .order('created_at')

  const nbPresentations = (presentationsEleve ?? []).filter(p => p.statut === 'presente').length

  // Construire les points du graphique
  const points: PointSemaine[] = (semaines ?? []).map(s => {
    const depot = depotParSemaine[s.id]
    const analyse = depot ? analyseParDepot[depot.id] : null
    const oralData = oralParSemaine[s.id]

    const d = analyse?.note_decouvertes ?? null
    const so = analyse?.note_sources ?? null
    const r = analyse?.note_reflexions ?? null
    const moy = d !== null && so !== null && r !== null
      ? Math.round(((d + so + r) / 3) * 100) / 100
      : null
    return {
      semaine: s.numero,
      decouvertes: d,
      sources: so,
      reflexions: r,
      moyenne: moy,
      depotId: depot?.id ?? null,
      oral_contenu: oralData?.note_contenu ?? null,
      oral_structure: oralData?.note_structure ?? null,
      oral_expression: oralData?.note_expression ?? null,
    }
  })

  // Statistiques
  const analysesPubliees = (analyses ?? [])
  const nbSemaines = (semaines ?? []).length
  const nbDeposes = (depots ?? []).length
  const tauxDepot = nbSemaines > 0 ? Math.round((nbDeposes / nbSemaines) * 100) : 0
  const nbEnRetard = (depots ?? []).filter(d => d.statut === 'en_retard').length

  const moyD = analysesPubliees.length > 0
    ? analysesPubliees.reduce((s, a) => s + (a.note_decouvertes ?? 0), 0) / analysesPubliees.length
    : null
  const moyS = analysesPubliees.length > 0
    ? analysesPubliees.reduce((s, a) => s + (a.note_sources ?? 0), 0) / analysesPubliees.length
    : null

  const semainePourDepot = Object.fromEntries(
    (semaines ?? []).map(s => [s.id, s.numero])
  )

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Link
          href="/prof/fragments-erudition"
          className="text-sm text-muet hover:text-encre-douce"
        >
          ← Vue par semaine
        </Link>
      </div>

      {/* En-tête élève */}
      <div className="bg-surface border border-bordure rounded-xl px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-serif text-encre">{eleve.display_name}</h2>
            {eleve.classe && <p className="text-sm text-muet mt-0.5">{eleve.classe}</p>}
            {theme && (
              <p className="text-sm text-encre-douce mt-2 italic">{theme.theme}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-muet">Présentations</p>
            <p className="text-2xl font-serif text-encre">{nbPresentations}</p>
          </div>
        </div>
      </div>

      {/* Graphique de progression */}
      {points.length > 0 ? (
        <div className="bg-surface border border-bordure rounded-xl p-5">
          <h3 className="text-sm font-medium text-encre-douce mb-4">Progression</h3>
          <GraphiqueProgression
            data={points}
            lienBase="/prof/fragments-erudition/analyse/"
          />
        </div>
      ) : (
        <div className="bg-surface border border-bordure rounded-xl p-8 text-center text-muet text-sm">
          Aucune semaine créée.
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
          <p className="text-xl font-serif text-encre">{tauxDepot}%</p>
          <p className="text-xs text-muet mt-0.5">Taux de dépôt</p>
          <p className="text-xs text-muet">{nbDeposes}/{nbSemaines} semaines</p>
        </div>
        <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
          <p className="text-xl font-serif text-attention">{nbEnRetard}</p>
          <p className="text-xs text-muet mt-0.5">En retard</p>
        </div>
        <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
          <p className="text-xl font-serif text-info">
            {moyD !== null ? moyD.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-muet mt-0.5">Moy. Découvertes</p>
        </div>
        <div className="bg-surface border border-bordure rounded-xl p-4 text-center">
          <p className="text-xl font-serif text-ok">
            {moyS !== null ? moyS.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-muet mt-0.5">Moy. Sources</p>
        </div>
      </div>

      {/* Pistes en attente */}
      {(pistesEnAttente ?? []).length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-5">
          <h3 className="text-sm font-medium text-encre-douce mb-3">
            Pistes en attente ({pistesEnAttente!.length})
          </h3>
          <ul className="space-y-2">
            {pistesEnAttente!.map(piste => (
              <li key={piste.id} className="flex items-start gap-2 text-sm">
                <span className={`mt-0.5 text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                  piste.statut === 'partiellement_suivie'
                    ? 'bg-attention-teinte text-attention'
                    : 'bg-parchemin-fonce text-muet'
                }`}>
                  {piste.statut === 'partiellement_suivie' ? 'partielle' : 'proposée'}
                </span>
                <span className="text-encre-douce">{piste.contenu}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Historique des présentations */}
      {(presentationsEleve ?? []).length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-5">
          <h3 className="text-sm font-medium text-encre-douce mb-3">Historique des présentations</h3>
          <div className="space-y-1.5">
            {(presentationsEleve ?? []).map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-encre-douce">
                  Semaine {semainePourDepot[p.semaine_id] ?? '?'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.statut === 'presente' ? 'bg-ok-teinte text-ok' :
                  p.statut === 'reporte' ? 'bg-attention-teinte text-attention' :
                  'bg-info-teinte text-info'
                }`}>
                  {p.statut === 'presente' ? 'Présenté ✓' :
                   p.statut === 'reporte' ? 'Reporté' : 'Tiré'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liens vers les analyses */}
      {analysesPubliees.length > 0 && (
        <div className="bg-surface border border-bordure rounded-xl p-5">
          <h3 className="text-sm font-medium text-encre-douce mb-3">Analyses publiées</h3>
          <div className="space-y-1.5">
            {analysesPubliees.map(a => {
              const depot = (depots ?? []).find(d => d.id === a.depot_id)
              const numSemaine = depot ? semainePourDepot[depot.semaine_id] : null
              return (
                <Link
                  key={a.id}
                  href={`/prof/fragments-erudition/analyse/${a.depot_id}`}
                  className="flex items-center justify-between text-sm hover:bg-parchemin-fonce rounded-lg px-2 py-1.5 -mx-2 transition-colors"
                >
                  <span className="text-encre-douce">Semaine {numSemaine ?? '?'}</span>
                  <span className="text-muet text-xs">
                    {noteVersLettre(a.note_decouvertes) ?? '?'} / {noteVersLettre(a.note_sources) ?? '?'} / {noteVersLettre(a.note_reflexions) ?? '?'} →
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
