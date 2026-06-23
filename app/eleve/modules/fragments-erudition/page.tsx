import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsModuleEleve } from '@/utils/acces'
import { contexteClasseEleve } from '../../contexte-classe'
import SelecteurClasseEleve from '../../SelecteurClasseEleve'
import Tuile from '@/components/Tuile'
import FormulaireDepot from './FormulaireDepot'
import BoutonLectureRetour from './BoutonLectureRetour'
import AnalysePubliee from './AnalysePubliee'
import GraphiqueProgression from '@/components/fragments/GraphiqueProgression'
import AnalyseOralePubliee from './AnalyseOralePubliee'
import EssaiDepot from './EssaiDepot'
import EssaiPublie from './EssaiPublie'
import BilanSemestre from './BilanSemestre'
import type { FragmentAnalyse, FragmentPiste, FragmentOral, FragmentAnalyseOrale, EssaiDepotAnalyse, FragmentSynthese } from '@/types/fragments'
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

export default async function PageFragments({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
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

  // Contexte de classe courant (commutateur global du Lot 9, cookie partagé).
  // On retient l'inscription du cookie si elle a le module, sinon la 1ʳᵉ.
  const { active } = await contexteClasseEleve(supabase, user.id)
  const inscriptionActive = inscriptions.find(i => i.id === active?.id) ?? inscriptions[0]
  const inscriptionId = inscriptionActive.id

  const { vue: vueParam } = await searchParams
  const vue = vueParam === 'oral' || vueParam === 'essai' ? vueParam : 'ecrit'

  // Thème du semestre courant (un thème par inscription × semestre). L'élève
  // n'a pas de sélecteur : il voit toujours le semestre marqué « courant ».
  const { data: semCourant } = await admin
    .from('semesters')
    .select('id')
    .eq('is_active', true)
    .maybeSingle()
  let themeQuery = supabase
    .from('fragments_themes')
    .select('theme, description, essai_actif')
    .eq('inscription_id', inscriptionId)
  if (semCourant?.id) themeQuery = themeQuery.eq('semestre_id', semCourant.id)
  const { data: theme } = await themeQuery.maybeSingle()

  // Semaine ouverte (scopée au semestre actif : sinon une semaine restée ouverte
  // d'un semestre précédent pourrait s'afficher / être déposable).
  let reqSemaine = supabase
    .from('fragments_semaines')
    .select('*')
    .eq('ouverte', true)
  if (semCourant?.id) reqSemaine = reqSemaine.eq('semestre_id', semCourant.id)
  const { data: semaine } = await reqSemaine
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

  // Essai ouvert aux dépôts pour LA CLASSE de l'élève (date + état propres à
  // la classe, portés par la liaison essai × classe). Le plus récent ouvert.
  const { data: lienOuvert } = essaiActif
    ? await admin
        .from('fragments_essais_classes')
        .select('date_essai, fragments_essais_epreuves(id, titre, duree_minutes, consignes)')
        .eq('classe_id', inscriptionActive.classe_id)
        .eq('depots_ouverts', true)
        .order('date_essai', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }
  const epreuveLiee = lienOuvert?.fragments_essais_epreuves as unknown as
    { id: string; titre: string; duree_minutes: number; consignes: string | null } | null
  const epreuveOuverte = epreuveLiee
    ? { ...epreuveLiee, date_essai: lienOuvert!.date_essai as string }
    : null

  // Dépôt de l'élève pour cet essai
  const { data: essaiEleve } = epreuveOuverte
    ? await admin
        .from('fragments_essai_depots')
        .select('id')
        .eq('essai_id', epreuveOuverte.id)
        .eq('inscription_id', inscriptionId)
        .maybeSingle()
    : { data: null }

  // Dépôts de cette inscription (pour scoper les analyses par parent)
  const { data: essaisInscription } = essaiActif
    ? await admin.from('fragments_essai_depots').select('id').eq('inscription_id', inscriptionId)
    : { data: [] }
  const essaiIdsInscription = (essaisInscription ?? []).map(e => e.id)

  // Analyse publiée de l'essai (la plus récente publiée de cette inscription)
  const { data: analyseEssaiPubliee } = essaiActif && essaiIdsInscription.length > 0
    ? await admin
        .from('fragments_essai_depot_analyses')
        .select('*')
        .in('depot_id', essaiIdsInscription)
        .eq('statut', 'publiee')
        .order('publiee_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  // Analyse en cours pour le dépôt actuel
  const { data: analyseEssaiEnCours } = essaiEleve
    ? await admin
        .from('fragments_essai_depot_analyses')
        .select('statut')
        .eq('depot_id', essaiEleve.id)
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

  // ── Lot 10 : dernier retour écrit, gate de lecture, couleurs des tuiles ────
  const derniereAnalyseEcrite = (analyseActuelle as FragmentAnalyse | null)
    ?? ((depotsPasses.map(d => analyseParDepot[d.id]).find(Boolean) as FragmentAnalyse | undefined) ?? null)
  const pistesDerniere = (analyseActuelle
    ? (pistesActuelles ?? [])
    : (derniereAnalyseEcrite ? (pistesParAnalyse[derniereAnalyseEcrite.id] ?? []) : [])) as FragmentPiste[]
  const gateActif = !!derniereAnalyseEcrite && !(derniereAnalyseEcrite as unknown as { retour_lu_at?: string | null }).retour_lu_at
  const rappelPistes = pistesDerniere.slice(0, 3)

  const aOral = Object.keys(oralParSemaine).length > 0
  const couleurEcrit: 'vert' | 'rouge' | 'neutre' = !semaine ? 'neutre' : (!depotActuel || gateActif) ? 'rouge' : 'vert'
  const couleurOral: 'vert' | 'neutre' = aOral ? 'vert' : 'neutre'
  // Un essai déposé reste signalé même après la fermeture des dépôts et avant la publication
  // du retour : essaiEleve n'est chargé que si l'essai est ouvert, alors que
  // essaiIdsInscription suit les dépôts quel que soit l'état d'ouverture.
  const aDeposeEssai = essaiIdsInscription.length > 0
  const couleurEssai: 'vert' | 'rouge' | 'neutre' =
    !epreuveOuverte && !essaiEleve && !analyseEssaiPubliee && !aDeposeEssai ? 'neutre' : (epreuveOuverte && !essaiEleve) ? 'rouge' : 'vert'
  const lien = (v: string) => `/eleve/modules/fragments-erudition?vue=${v}`

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/eleve" className="text-sm text-stone-500 hover:text-stone-700">← Retour</Link>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-serif text-stone-900 mb-1">Fragments d&apos;érudition</h2>
          {theme ? (
            <div className="bg-stone-100 rounded-xl px-4 py-3">
              <p className="text-xs text-stone-500 mb-0.5">Ton thème</p>
              <p className="font-medium text-stone-800">{theme.theme}</p>
              {theme.description && <p className="text-sm text-stone-500 mt-1">{theme.description}</p>}
            </div>
          ) : (
            <div className="bg-stone-50 rounded-xl px-4 py-3 border border-stone-200">
              <p className="text-sm text-stone-500 italic">Ton thème sera défini avec ton professeur.</p>
            </div>
          )}
        </div>
        <SelecteurClasseEleve inscriptions={inscriptions} activeId={inscriptionId} />
      </div>

      {/* Ton parcours (sections en lettres) + stats + rappel des pistes */}
      {pointsParcours.some(p => p.decouvertes !== null) && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Ton parcours</h3>
          <div className="bg-white border border-stone-200 rounded-xl p-5">
            <GraphiqueProgression data={pointsParcours} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-stone-200 rounded-xl p-3 text-center">
              <p className="text-lg font-serif text-stone-800">{nbSemainesTotal > 0 ? Math.round((nbDeposesTotal / nbSemainesTotal) * 100) : 0}%</p>
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
          {rappelPistes.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">Pistes à suivre (dernier retour)</p>
              <ul className="space-y-2">
                {rappelPistes.map(piste => (
                  <li key={piste.id} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-stone-400 mt-0.5 flex-shrink-0">💡</span>{piste.contenu}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 3 tuiles d'état cliquables (vert / rouge / neutre) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Tuile
          nom="Fragments écrits"
          sousTitre={!semaine ? 'Rien de neuf' : !depotActuel ? 'À déposer' : gateActif ? 'Retour à lire' : 'À jour'}
          couleur={couleurEcrit}
          href={lien('ecrit')}
          selectionnee={vue === 'ecrit'}
        />
        <Tuile
          nom="Fragment oral"
          sousTitre={aOral ? 'Retour disponible' : 'Rien de neuf'}
          couleur={couleurOral}
          href={lien('oral')}
          selectionnee={vue === 'oral'}
        />
        {essaiActif && (
          <Tuile
            nom="Essai"
            sousTitre={analyseEssaiPubliee ? 'Retour disponible' : (essaiEleve || (!epreuveOuverte && aDeposeEssai)) ? 'Déposé' : epreuveOuverte ? 'À déposer' : 'Rien de neuf'}
            couleur={couleurEssai}
            href={lien('essai')}
            selectionnee={vue === 'essai'}
          />
        )}
      </div>

      {/* Retour du dernier fragment + gate de lecture (vue écrite uniquement) */}
      {vue === 'ecrit' && derniereAnalyseEcrite && (
        <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
          <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">Ton dernier retour</p>
          <AnalysePubliee analyse={derniereAnalyseEcrite} pistes={pistesDerniere} />
          {gateActif && (
            <div className="border-t border-amber-100 pt-4 space-y-2">
              <p className="text-sm text-amber-700">Valide que tu as lu ce retour pour pouvoir déposer ton prochain fragment.</p>
              <BoutonLectureRetour analyseId={derniereAnalyseEcrite.id} />
            </div>
          )}
        </div>
      )}

      {/* ── Détail : Fragments écrits ── */}
      {vue === 'ecrit' && (
        semaine ? (
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-4 py-4 border-b border-stone-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-stone-500 mb-0.5">Semaine en cours</p>
                  <p className="font-medium text-stone-900">Semaine {semaine.numero}{semaine.titre ? ` — ${semaine.titre}` : ''}</p>
                  <p className="text-xs text-stone-500 mt-0.5">À rendre avant le {formatDateLimite(semaine.date_limite)}</p>
                </div>
                {depotActuel ? (
                  <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full ${depotEnRetard ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                    {depotEnRetard ? '⚠ En retard' : '✓ Déposé'}
                  </span>
                ) : (
                  <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">À déposer</span>
                )}
              </div>
            </div>
            <div className="px-4 py-4 space-y-4">
              {gateActif ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                  Lis et valide ton dernier retour (ci-dessus) pour débloquer le dépôt.
                </div>
              ) : (
                <FormulaireDepot semaineId={semaine.id} eleveId={user.id} inscriptionId={inscriptionId} depotExistant={!!depotActuel} />
              )}
              {depotActuel && !analyseActuelle && (
                <div className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-stone-500">Retour en préparation — ton professeur l&apos;examinera bientôt.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-center">
            <p className="text-stone-500 text-sm">Aucune semaine n&apos;est ouverte pour l&apos;instant.<br />Ton professeur en créera une bientôt.</p>
          </div>
        )
      )}

      {/* Historique écrit */}
      {vue === 'ecrit' && depotsPasses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wide">Semaines précédentes</h3>
          {depotsPasses.map(depot => {
            const analyse = analyseParDepot[depot.id]
            const pistes = analyse ? (pistesParAnalyse[analyse.id] ?? []) : []
            const semaineTitre = (depot.semaine as unknown as { numero: number; titre: string | null } | null)
            return (
              <div key={depot.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                  <p className="font-medium text-stone-800 text-sm">Semaine {semaineTitre?.numero ?? '?'}{semaineTitre?.titre ? ` — ${semaineTitre.titre}` : ''}</p>
                  {analyse ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Retour disponible</span>
                  ) : (
                    <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">Déposé ✓</span>
                  )}
                </div>
                {analyse && (
                  <div className="px-4 py-4">
                    <AnalysePubliee analyse={analyse} pistes={pistes as FragmentPiste[]} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Détail : Fragment oral (lecture ; l'oral se fait en classe) ── */}
      {vue === 'oral' && (
        aOral ? (
          <div className="space-y-4">
            {Object.entries(oralParSemaine).map(([semId, data]) => {
              const num = (toutesLessemaines ?? []).find(s => s.id === semId)?.numero
              return (
                <div key={semId} className="bg-white border border-stone-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">{num ? `Semaine ${num} — ` : ''}ta présentation orale</p>
                  <AnalyseOralePubliee oral={data.oral} analyseOrale={data.analyseOrale} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-sm text-stone-500">
            Aucun retour d&apos;oral pour l&apos;instant. L&apos;oral se fait en classe.
          </div>
        )
      )}

      {/* ── Détail : Essai (dépôt si pas encore soumis + retour ; un seul essai) ── */}
      {vue === 'essai' && essaiActif && (
        <div className="space-y-4">
          {analyseEssaiPubliee && (
            <div className="bg-white border border-stone-200 rounded-xl p-5">
              <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-4">Retour de ton professeur</p>
              <EssaiPublie analyse={analyseEssaiPubliee as EssaiDepotAnalyse} />
            </div>
          )}
          {epreuveOuverte && (
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              <div className="px-4 py-4 border-b border-stone-100">
                <p className="font-medium text-stone-900">{epreuveOuverte.titre}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {new Date(epreuveOuverte.date_essai).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{epreuveOuverte.duree_minutes} min
                </p>
                {epreuveOuverte.consignes && <p className="text-sm text-stone-600 mt-2">{epreuveOuverte.consignes}</p>}
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
                  <EssaiDepot epreuveId={epreuveOuverte.id} inscriptionId={inscriptionId} essaiExistantId={essaiEleve?.id ?? null} analyseEnCours={!!analyseEssaiEnCours} />
                )}
              </div>
            </div>
          )}
          {!epreuveOuverte && !analyseEssaiPubliee && (
            <div className="bg-white border border-stone-200 rounded-xl p-6 text-center text-sm text-stone-500">Aucun essai ouvert pour l&apos;instant.</div>
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
    </div>
  )
}
