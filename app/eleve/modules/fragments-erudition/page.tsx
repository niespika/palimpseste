import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsModuleEleve } from '@/utils/acces'
import SelecteurContexteClasse from './SelecteurContexteClasse'
import FormulaireDepot from './FormulaireDepot'
import AnalysePubliee from './AnalysePubliee'
import GraphiqueProgression from '@/components/fragments/GraphiqueProgression'
import AnalyseOralePubliee from './AnalyseOralePubliee'
import EssaiDepot from './EssaiDepot'
import EssaiPublie from './EssaiPublie'
import BilanSemestre from './BilanSemestre'
import type { FragmentAnalyse, FragmentPiste, FragmentOral, FragmentAnalyseOrale, EssaiAnalyse, FragmentSynthese } from '@/types/fragments'
import type { PointSemaine } from '@/components/fragments/GraphiqueProgression'

function formatDateLimite(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PageFragments({ searchParams }: { searchParams: Promise<{ ctx?: string }> }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Module + inscriptions de l'élève sur les classes ayant ce module.
  // Un élève bi-classe a plusieurs inscriptions → un flux de fragments par classe.
  const { data: moduleData } = await supabase
    .from('modules')
    .select('id')
    .eq('slug', 'fragments-erudition')
    .maybeSingle()
  const inscriptions = moduleData
    ? await inscriptionsModuleEleve(supabase, user.id, moduleData.id)
    : []

  if (inscriptions.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-2">
          <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700">← Retour</Link>
        </div>
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-stone-500 text-sm">
          Ce module n'est pas disponible pour ton compte.
        </div>
      </div>
    )
  }

  // Contexte de classe actif (sélecteur affiché si plusieurs inscriptions)
  const { ctx } = await searchParams
  const inscriptionActive = inscriptions.find(i => i.id === ctx) ?? inscriptions[0]
  const inscriptionId = inscriptionActive.id

  // Thème du semestre courant (un thème par inscription × semestre). L'élève
  // n'a pas de sélecteur : il voit toujours le semestre marqué « courant ».
  const { data: semCourant } = await admin
    .from('fragments_semestres')
    .select('id')
    .eq('courant', true)
    .maybeSingle()
  let themeQuery = supabase
    .from('fragments_themes')
    .select('theme, description, essai_actif')
    .eq('inscription_id', inscriptionId)
  if (semCourant?.id) themeQuery = themeQuery.eq('semestre_id', semCourant.id)
  const { data: theme } = await themeQuery.maybeSingle()

  // Semaine ouverte
  const { data: semaine } = await supabase
    .from('fragments_semaines')
    .select('*')
    .eq('ouverte', true)
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Dépôt de la semaine en cours
  const { data: depotActuel } = semaine
    ? await supabase
        .from('fragments_depots')
        .select('id, statut, commentaire_eleve, created_at, fragments_photos(id, storage_path, ordre)')
        .eq('inscription_id', inscriptionId)
        .eq('semaine_id', semaine.id)
        .maybeSingle()
    : { data: null }

  // Analyse de la semaine en cours (publiée uniquement)
  const { data: analyseActuelle } = depotActuel
    ? await admin
        .from('fragments_analyses')
        .select('*')
        .eq('depot_id', depotActuel.id)
        .eq('statut', 'publiee')
        .maybeSingle()
    : { data: null }

  // Pistes de l'analyse actuelle
  const { data: pistesActuelles } = analyseActuelle
    ? await admin
        .from('fragments_pistes')
        .select('*')
        .eq('analyse_id', analyseActuelle.id)
        .order('created_at')
    : { data: [] }

  // Historique des dépôts passés
  const { data: historique } = await supabase
    .from('fragments_depots')
    .select(`
      id, statut, commentaire_eleve, created_at, updated_at, eleve_id, semaine_id,
      semaine:fragments_semaines(id, numero, titre, date_debut, date_limite, ouverte, created_at),
      photos:fragments_photos(id, depot_id, storage_path, ordre, created_at)
    `)
    .eq('inscription_id', inscriptionId)
    .order('created_at', { ascending: false })

  const depotsPasses = (historique ?? []).filter(d =>
    semaine ? d.semaine_id !== semaine.id : true
  )

  // Analyses publiées pour les dépôts passés
  const depotIdsHistorique = depotsPasses.map(d => d.id)
  const { data: analysesPassees } = depotIdsHistorique.length > 0
    ? await admin
        .from('fragments_analyses')
        .select('*')
        .eq('statut', 'publiee')
        .in('depot_id', depotIdsHistorique)
    : { data: [] }

  const analyseParDepot: Record<string, FragmentAnalyse> = Object.fromEntries(
    (analysesPassees ?? []).map(a => [a.depot_id, a])
  )

  // Pistes pour les analyses passées
  const analyseIdsPassees = (analysesPassees ?? []).map(a => a.id)
  const { data: pistesPassees } = analyseIdsPassees.length > 0
    ? await admin
        .from('fragments_pistes')
        .select('*')
        .in('analyse_id', analyseIdsPassees)
        .order('created_at')
    : { data: [] }

  const pistesParAnalyse: Record<string, FragmentPiste[]> = {}
  for (const piste of pistesPassees ?? []) {
    if (!pistesParAnalyse[piste.analyse_id]) pistesParAnalyse[piste.analyse_id] = []
    pistesParAnalyse[piste.analyse_id].push(piste)
  }

  const depotEnRetard = semaine && depotActuel?.statut === 'en_retard'

  // Présentations de cet élève avec oral publié
  const { data: presentationsAvecOral } = await admin
    .from('fragments_presentations')
    .select('id, semaine_id, statut')
    .eq('inscription_id', inscriptionId)

  const presentationIds = (presentationsAvecOral ?? []).map(p => p.id)
  const { data: oraux } = presentationIds.length > 0
    ? await admin
        .from('fragments_oraux')
        .select('*')
        .in('presentation_id', presentationIds)
    : { data: [] }

  const oralParPresentation = Object.fromEntries(
    (oraux ?? []).map(o => [o.presentation_id, o])
  )

  const oralIds = (oraux ?? []).map(o => o.id)
  const { data: analysesOrales } = oralIds.length > 0
    ? await admin
        .from('fragments_analyses_orales')
        .select('*')
        .not('publiee_at', 'is', null)
        .in('oral_id', oralIds)
    : { data: [] }

  const analyseOraleParOral = Object.fromEntries(
    (analysesOrales ?? []).map(a => [a.oral_id, a])
  )

  // Indexer par semaine_id pour afficher dans l'historique
  const oralParSemaine: Record<string, { oral: FragmentOral; analyseOrale: FragmentAnalyseOrale }> = {}
  for (const pres of presentationsAvecOral ?? []) {
    const oral = oralParPresentation[pres.id]
    if (!oral) continue
    const analyseOrale = analyseOraleParOral[oral.id]
    if (!analyseOrale) continue
    oralParSemaine[pres.semaine_id] = {
      oral: oral as FragmentOral,
      analyseOrale: analyseOrale as FragmentAnalyseOrale,
    }
  }

  // ── Essai final ──────────────────────────────────────────────────────────
  const essaiActif = !!(theme as unknown as { essai_actif?: boolean })?.essai_actif

  // Épreuve ouverte aux dépôts (la plus récente avec depots_ouverts=true)
  const { data: epreuveOuverte } = essaiActif
    ? await admin
        .from('fragments_essais_epreuves')
        .select('id, titre, date_epreuve, duree_minutes, consignes')
        .eq('depots_ouverts', true)
        .order('date_epreuve', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  // Essai de l'élève pour cette épreuve
  const { data: essaiEleve } = epreuveOuverte
    ? await admin
        .from('fragments_essais')
        .select('id')
        .eq('epreuve_id', epreuveOuverte.id)
        .eq('inscription_id', inscriptionId)
        .maybeSingle()
    : { data: null }

  // Essais de cette inscription (pour scoper les analyses d'essai par parent)
  const { data: essaisInscription } = essaiActif
    ? await admin.from('fragments_essais').select('id').eq('inscription_id', inscriptionId)
    : { data: [] }
  const essaiIdsInscription = (essaisInscription ?? []).map(e => e.id)

  // Analyse publiée de l'essai (la plus récente publiée de cette inscription)
  const { data: analyseEssaiPubliee } = essaiActif && essaiIdsInscription.length > 0
    ? await admin
        .from('essais_analyses')
        .select('*')
        .in('essai_id', essaiIdsInscription)
        .eq('statut', 'publiee')
        .order('publiee_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  // Analyse en cours pour l'essai actuel
  const { data: analyseEssaiEnCours } = essaiEleve
    ? await admin
        .from('essais_analyses')
        .select('statut')
        .eq('essai_id', essaiEleve.id)
        .in('statut', ['en_cours'])
        .maybeSingle()
    : { data: null }

  // ── Synthèse de semestre ─────────────────────────────────────────────────
  // La plus récente synthèse publiée pour cet élève
  const { data: synthesePubliee } = await admin
    .from('fragments_syntheses')
    .select('*')
    .eq('inscription_id', inscriptionId)
    .eq('statut', 'publiee')
    .order('publiee_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // ---- Données pour "Ton parcours" ----
  // Toutes les semaines
  const { data: toutesLessemaines } = await admin
    .from('fragments_semaines')
    .select('id, numero')
    .order('numero')

  // Tous les dépôts de cet élève
  const { data: tousDepots } = await admin
    .from('fragments_depots')
    .select('id, semaine_id, statut')
    .eq('inscription_id', inscriptionId)

  const tousDepotParSemaine = Object.fromEntries(
    (tousDepots ?? []).map(d => [d.semaine_id, d])
  )

  // Analyses publiées pour tous les dépôts
  const tousDepotIds = (tousDepots ?? []).map(d => d.id)
  const { data: toutesAnalyses } = tousDepotIds.length > 0
    ? await admin
        .from('fragments_analyses')
        .select('id, depot_id, note_decouvertes, note_sources, note_reflexions')
        .eq('statut', 'publiee')
        .in('depot_id', tousDepotIds)
    : { data: [] }

  const toutesAnalyseParDepot = Object.fromEntries(
    (toutesAnalyses ?? []).map(a => [a.depot_id, a])
  )

  // Pistes en attente (toutes analyses)
  const toutesAnalyseIds = (toutesAnalyses ?? []).map(a => a.id)
  const { data: pistesEnAttente } = toutesAnalyseIds.length > 0
    ? await admin
        .from('fragments_pistes')
        .select('id, contenu, statut')
        .in('analyse_id', toutesAnalyseIds)
        .in('statut', ['proposee', 'partiellement_suivie'])
        .order('created_at', { ascending: false })
    : { data: [] }

  // Construire les points du graphique élève
  const pointsParcours: PointSemaine[] = (toutesLessemaines ?? []).map(s => {
    const depot = tousDepotParSemaine[s.id]
    const analyse = depot ? toutesAnalyseParDepot[depot.id] : null
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
      oral_contenu: oralData?.analyseOrale.note_contenu ?? null,
      oral_structure: oralData?.analyseOrale.note_structure ?? null,
      oral_expression: oralData?.analyseOrale.note_expression ?? null,
    }
  })

  // Stats parcours
  const nbSemainesTotal = (toutesLessemaines ?? []).length
  const nbDeposesTotal = (tousDepots ?? []).length
  const analysesAvecNotes = (toutesAnalyses ?? []).filter(a =>
    a.note_decouvertes !== null && a.note_sources !== null && a.note_reflexions !== null
  )

  const meilleurSection = analysesAvecNotes.length > 0 ? (() => {
    const moyD = analysesAvecNotes.reduce((s, a) => s + (a.note_decouvertes ?? 0), 0) / analysesAvecNotes.length
    const moyS = analysesAvecNotes.reduce((s, a) => s + (a.note_sources ?? 0), 0) / analysesAvecNotes.length
    const moyR = analysesAvecNotes.reduce((s, a) => s + (a.note_reflexions ?? 0), 0) / analysesAvecNotes.length
    const max = Math.max(moyD, moyS, moyR)
    if (max === moyD) return 'Découvertes'
    if (max === moyS) return 'Sources'
    return 'Réflexions'
  })() : null

  const sectionATravaillerKey = analysesAvecNotes.length > 0 ? (() => {
    const moyD = analysesAvecNotes.reduce((s, a) => s + (a.note_decouvertes ?? 0), 0) / analysesAvecNotes.length
    const moyS = analysesAvecNotes.reduce((s, a) => s + (a.note_sources ?? 0), 0) / analysesAvecNotes.length
    const moyR = analysesAvecNotes.reduce((s, a) => s + (a.note_reflexions ?? 0), 0) / analysesAvecNotes.length
    const min = Math.min(moyD, moyS, moyR)
    if (min === moyD) return 'Découvertes'
    if (min === moyS) return 'Sources'
    return 'Réflexions'
  })() : null

  // Présentations de cet élève
  const { data: mesPresen } = await admin
    .from('fragments_presentations')
    .select('id, semaine_id, statut')
    .eq('inscription_id', inscriptionId)
    .eq('statut', 'presente')

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700">← Retour</Link>
      </div>

      <SelecteurContexteClasse inscriptions={inscriptions} inscriptionActiveId={inscriptionId} />

      <div>
        <h2 className="text-xl font-serif text-stone-900 mb-1">Fragments d'érudition</h2>
        {theme ? (
          <div className="bg-stone-100 rounded-xl px-4 py-3">
            <p className="text-xs text-stone-500 mb-0.5">Ton thème</p>
            <p className="font-medium text-stone-800">{theme.theme}</p>
            {theme.description && (
              <p className="text-sm text-stone-500 mt-1">{theme.description}</p>
            )}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
            <p className="text-sm text-stone-500 italic">
              Ton thème sera défini avec ton professeur.
            </p>
          </div>
        )}
      </div>

      {/* Semaine en cours */}
      {semaine ? (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-4 py-4 border-b border-stone-100">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-stone-500 mb-0.5">Semaine en cours</p>
                <p className="font-medium text-stone-900">
                  Semaine {semaine.numero}
                  {semaine.titre ? ` — ${semaine.titre}` : ''}
                </p>
                <p className="text-xs text-stone-500 mt-0.5">
                  À rendre avant le {formatDateLimite(semaine.date_limite)}
                </p>
              </div>

              {depotActuel ? (
                <div className="flex-shrink-0">
                  {depotEnRetard ? (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      ⚠ En retard
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✓ Déposé
                    </span>
                  )}
                </div>
              ) : (
                <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                  À déposer
                </span>
              )}
            </div>
          </div>

          <div className="px-4 py-4 space-y-4">
            <FormulaireDepot
              semaineId={semaine.id}
              eleveId={user.id}
              inscriptionId={inscriptionId}
              depotExistant={!!depotActuel}
            />

            {/* Statut retour */}
            {depotActuel && !analyseActuelle && (
              <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                <p className="text-sm text-stone-500">
                  Retour en préparation — ton professeur l'examinera bientôt.
                </p>
              </div>
            )}

            {/* Analyse publiée de la semaine en cours */}
            {analyseActuelle && (
              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                  Retour de ton professeur
                </p>
                <AnalysePubliee
                  analyse={analyseActuelle as FragmentAnalyse}
                  pistes={(pistesActuelles ?? []) as FragmentPiste[]}
                />
              </div>
            )}

            {/* Retour oral de la semaine en cours */}
            {semaine && oralParSemaine[semaine.id] && (
              <div className="border-t border-stone-100 pt-4">
                <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                  Ta présentation orale
                </p>
                <AnalyseOralePubliee
                  oral={oralParSemaine[semaine.id].oral}
                  analyseOrale={oralParSemaine[semaine.id].analyseOrale}
                />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
          <p className="text-stone-500 text-sm">
            Aucune semaine n'est ouverte pour l'instant.<br />
            Ton professeur en créera une bientôt.
          </p>
        </div>
      )}

      {/* Ton parcours */}
      {pointsParcours.some(p => p.decouvertes !== null) && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Ton parcours</h3>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <GraphiqueProgression data={pointsParcours} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-lg font-serif text-stone-800">
                {nbSemainesTotal > 0 ? Math.round((nbDeposesTotal / nbSemainesTotal) * 100) : 0}%
              </p>
              <p className="text-xs text-stone-500 mt-0.5">Taux de dépôt</p>
            </div>
            {meilleurSection && (
              <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                <p className="text-lg font-serif text-green-700">{meilleurSection}</p>
                <p className="text-xs text-stone-500 mt-0.5">Meilleure section</p>
              </div>
            )}
            {sectionATravaillerKey && meilleurSection !== sectionATravaillerKey && (
              <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
                <p className="text-lg font-serif text-amber-700">{sectionATravaillerKey}</p>
                <p className="text-xs text-stone-500 mt-0.5">À travailler</p>
              </div>
            )}
          </div>
          {(mesPresen ?? []).length > 0 && (
            <p className="text-sm text-stone-500 text-center">
              Tu as présenté {(mesPresen ?? []).length} fois cette année.
            </p>
          )}
          {/* Pistes en attente */}
          {(pistesEnAttente ?? []).length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                Tes pistes en attente
              </p>
              <ul className="space-y-2">
                {(pistesEnAttente ?? []).map(piste => (
                  <li key={piste.id} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-stone-400 mt-0.5 flex-shrink-0">💡</span>
                    {piste.contenu}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Essai final */}
      {essaiActif && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Essai final</h3>
          {/* Le sujet de l'essai = le thème de l'élève (champ unifié), déjà affiché ci-dessus. */}

          {/* Résultat publié */}
          {analyseEssaiPubliee && (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">Retour de ton professeur</p>
              <EssaiPublie analyse={analyseEssaiPubliee as EssaiAnalyse} />
            </div>
          )}

          {/* Dépôt ouvert */}
          {epreuveOuverte && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-4 py-4 border-b border-stone-100">
                <p className="font-medium text-stone-900">{epreuveOuverte.titre}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {new Date(epreuveOuverte.date_epreuve).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{epreuveOuverte.duree_minutes} min
                </p>
                {epreuveOuverte.consignes && (
                  <p className="text-sm text-stone-600 mt-2">{epreuveOuverte.consignes}</p>
                )}
              </div>
              <div className="px-4 py-4">
                {essaiEleve && !analyseEssaiEnCours ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Photos déposées</span>
                      <span className="text-xs text-stone-500">Ton professeur analysera ton essai bientôt.</span>
                    </div>
                    <EssaiDepot epreuveId={epreuveOuverte.id} inscriptionId={inscriptionId} essaiExistantId={essaiEleve.id} analyseEnCours={false} />
                  </div>
                ) : (
                  <EssaiDepot
                    epreuveId={epreuveOuverte.id}
                    inscriptionId={inscriptionId}
                    essaiExistantId={essaiEleve?.id ?? null}
                    analyseEnCours={!!analyseEssaiEnCours}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bilan de semestre */}
      {synthesePubliee && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Bilan du semestre</h3>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <BilanSemestre synthese={synthesePubliee as FragmentSynthese} />
          </div>
        </div>
      )}

      {/* Historique des semaines passées */}
      {depotsPasses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Semaines précédentes</h3>
          {depotsPasses.map(depot => {
            const analyse = analyseParDepot[depot.id]
            const pistes = analyse ? (pistesParAnalyse[analyse.id] ?? []) : []
            const semaineTitre = (depot.semaine as unknown as { numero: number; titre: string | null } | null)
            return (
              <div key={depot.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <p className="font-medium text-stone-800 text-sm">
                    Semaine {semaineTitre?.numero ?? '?'}
                    {semaineTitre?.titre ? ` — ${semaineTitre.titre}` : ''}
                  </p>
                  {analyse ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Retour disponible
                    </span>
                  ) : (
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                      Déposé ✓
                    </span>
                  )}
                </div>
                {analyse && (
                  <div className="px-4 py-4">
                    <AnalysePubliee
                      analyse={analyse}
                      pistes={pistes as FragmentPiste[]}
                    />
                  </div>
                )}
                {(() => {
                  const semaineTitreObj = (depot.semaine as unknown as { id: string } | null)
                  const oralData = semaineTitreObj ? oralParSemaine[semaineTitreObj.id] : null
                  if (!oralData) return null
                  return (
                    <div className="px-4 py-4 border-t border-stone-100">
                      <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                        Ta présentation orale
                      </p>
                      <AnalyseOralePubliee
                        oral={oralData.oral}
                        analyseOrale={oralData.analyseOrale}
                      />
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
