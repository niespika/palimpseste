import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import { classeFragmentsActive } from '../contexte-classe'
import { semestreFragmentsActif } from '../contexte-semestre'
import TableauClasse from './TableauClasse'

export default async function PageVueEnsemble() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()

  // Semaines du semestre consulté
  const { semestre } = await semestreFragmentsActif(supabase)
  const { data: semaines } = semestre
    ? await admin
        .from('fragments_semaines')
        .select('id, numero, titre')
        .eq('semestre_id', semestre.id)
        .order('numero')
    : { data: [] }

  // Classe active → inscriptions (1 inscription par élève dans la classe)
  const { classe } = await classeFragmentsActive(supabase)
  const inscrits = classe ? await inscriptionsClasse(admin, classe.id) : []
  const eleveIds = inscrits.map(i => i.eleve_id)
  const inscriptionIds = inscrits.map(i => i.id)
  const { data: eleves } = eleveIds.length > 0
    ? await admin
        .from('profiles')
        .select('id, display_name, classe')
        .in('id', eleveIds)
        .eq('role', 'eleve')
        .order('display_name')
    : { data: [] }

  if (!semaines?.length || !eleves?.length) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-500 text-sm">
        Aucune donnée disponible.
      </div>
    )
  }

  // Tous les dépôts de cette classe
  const { data: tousDepots } = inscriptionIds.length > 0
    ? await admin
        .from('fragments_depots')
        .select('id, eleve_id, semaine_id, statut')
        .in('inscription_id', inscriptionIds)
    : { data: [] }

  const depotIds = (tousDepots ?? []).map(d => d.id)

  // Toutes les analyses publiées
  const { data: toutesAnalyses } = depotIds.length > 0
    ? await admin
        .from('fragments_analyses')
        .select('id, depot_id, note_decouvertes, note_sources, note_reflexions')
        .eq('statut', 'publiee')
        .in('depot_id', depotIds)
    : { data: [] }

  const analyseParDepot = Object.fromEntries(
    (toutesAnalyses ?? []).map(a => [a.depot_id, a])
  )

  // Indexer les dépôts par élève et semaine
  type DepotInfo = { id: string; statut: string }
  const depotParEleveSemaine: Record<string, Record<string, DepotInfo>> = {}
  for (const d of tousDepots ?? []) {
    if (!depotParEleveSemaine[d.eleve_id]) depotParEleveSemaine[d.eleve_id] = {}
    depotParEleveSemaine[d.eleve_id][d.semaine_id] = { id: d.id, statut: d.statut }
  }

  // Construire les lignes
  const lignes = eleves.map(eleve => {
    const depotsEleve = depotParEleveSemaine[eleve.id] ?? {}
    let totalNote = 0
    let nbNotes = 0
    let nbDeposes = 0

    const cellules = semaines.map(s => {
      const depot = depotsEleve[s.id]
      if (!depot) return { semaineId: s.id, note: null, enRetard: false, depotId: null }

      nbDeposes++
      const analyse = analyseParDepot[depot.id]
      const enRetard = depot.statut === 'en_retard'

      if (!analyse) return { semaineId: s.id, note: null, enRetard, depotId: depot.id }

      const d = analyse.note_decouvertes
      const so = analyse.note_sources
      const r = analyse.note_reflexions
      if (d !== null && so !== null && r !== null) {
        const moy = (d + so + r) / 3
        totalNote += moy
        nbNotes++
        return { semaineId: s.id, note: Math.round(moy * 100) / 100, enRetard, depotId: depot.id }
      }
      return { semaineId: s.id, note: null, enRetard, depotId: depot.id }
    })

    const moyenne = nbNotes > 0 ? Math.round((totalNote / nbNotes) * 100) / 100 : null
    const tauxDepot = Math.round((nbDeposes / semaines.length) * 100)

    // Tendance : différence entre moy des 2 dernières semaines et moy des 2 précédentes
    const notesChronologiques = cellules.map(c => c.note).filter(n => n !== null) as number[]
    let tendance: number | null = null
    if (notesChronologiques.length >= 3) {
      const recent = notesChronologiques.slice(-2)
      const avant = notesChronologiques.slice(-4, -2)
      if (avant.length > 0) {
        const moyRecent = recent.reduce((a, b) => a + b, 0) / recent.length
        const moyAvant = avant.reduce((a, b) => a + b, 0) / avant.length
        tendance = Math.round((moyRecent - moyAvant) * 100) / 100
      }
    }

    return { ...eleve, cellules, moyenne, tauxDepot, tendance }
  })

  // Alertes
  const alertes: Array<{ eleveId: string; display_name: string; raison: string }> = []

  for (const l of lignes) {
    // 2 dépôts manquants consécutifs (parmi les dernières semaines)
    const derniersCellules = l.cellules.slice(-3)
    let consecutifs = 0
    for (const c of derniersCellules) {
      if (c.note === null && !c.depotId) consecutifs++
      else consecutifs = 0
    }
    if (consecutifs >= 2) {
      alertes.push({ eleveId: l.id, display_name: l.display_name, raison: '2 dépôts manquants consécutifs' })
    }

    // Moyenne en baisse depuis 3 semaines
    const notes = l.cellules.map(c => c.note).filter(n => n !== null) as number[]
    if (notes.length >= 3) {
      const [a, b, c] = notes.slice(-3)
      if (b < a && c < b) {
        alertes.push({ eleveId: l.id, display_name: l.display_name, raison: 'moyenne en baisse depuis 3 semaines' })
      }
    }
  }

  // Moyennes de classe par section par semaine
  const moyennesClasse = semaines.map(s => {
    let sumD = 0, sumS = 0, sumR = 0, count = 0
    for (const eleve of eleves) {
      const depot = (depotParEleveSemaine[eleve.id] ?? {})[s.id]
      if (!depot) continue
      const analyse = analyseParDepot[depot.id]
      if (!analyse || analyse.note_decouvertes === null) continue
      sumD += analyse.note_decouvertes
      sumS += analyse.note_sources ?? 0
      sumR += analyse.note_reflexions ?? 0
      count++
    }
    return {
      semaine: s.numero,
      decouvertes: count > 0 ? Math.round((sumD / count) * 10) / 10 : null,
      sources: count > 0 ? Math.round((sumS / count) * 10) / 10 : null,
      reflexions: count > 0 ? Math.round((sumR / count) * 10) / 10 : null,
    }
  })

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h2 className="text-base font-medium text-stone-900">
          Vue d'ensemble — {eleves.length} élèves · {semaines.length} semaines
        </h2>
      </div>
      <TableauClasse
        semaines={semaines}
        lignes={lignes}
        alertes={alertes}
        moyennesClasse={moyennesClasse}
      />
    </div>
  )
}
