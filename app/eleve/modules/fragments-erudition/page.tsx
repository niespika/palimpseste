import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsModuleEleve } from '@/utils/acces'
import { semainesComptees, estSemaineComptee } from '@/utils/fragments-semaines'
import { contexteClasseEleve } from '../../contexte-classe'
import ChoixClasseModule from '../../ChoixClasseModule'
import ModuleHorsClasse from '../../ModuleHorsClasse'
import FormulaireDepot from './FormulaireDepot'
import AnalysePubliee, { tuilesAnalyseEcrite, SECTIONS_ECRIT } from './AnalysePubliee'
import GraphiqueProgression from '@/components/fragments/GraphiqueProgression'
import AnalyseOralePubliee from './AnalyseOralePubliee'
import EssaiDepot from './EssaiDepot'
import ThemeEleve from './ThemeEleve'
import { statutDuTheme } from '@/utils/fragments-theme'
import EssaiPublie, { tuilesAnalyseEssai } from './EssaiPublie'
import Pli from './Pli'
import { carteAFaire, type CarteAFaire } from '@/utils/fragments-a-faire'
import { noteVersLettre } from '@/utils/notation'
import { signauxDeLancement } from '@/utils/examens/signal'
import { examensEnClasseDeLEleve } from '@/utils/codex-onglets/liste'
import BilanSemestre from './BilanSemestre'
import ValidationLecture from '@/components/retours/ValidationLecture'
import { validerLectureRetour, validerLectureRetourEssai } from './actions'
import { retoursNonLus } from '@/utils/retours-lus'
import { formatJour, formatInstant } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import type { FragmentAnalyse, FragmentPiste, FragmentOral, FragmentAnalyseOrale, EssaiDepotAnalyse, FragmentSynthese } from '@/types/fragments'
import type { PointSemaine } from '@/components/fragments/GraphiqueProgression'

// `date_limite` est un INSTANT (fin de journée dans le fuseau de l'école) : on le
// nomme dans CE fuseau. Le lire en UTC ferait tomber l'échéance du dimanche un lundi.
const formatDateLimite = (dateStr: string, tz: string) =>
  formatInstant(dateStr, tz, { weekday: 'long', day: 'numeric', month: 'long' })

export default async function PageFragments({ searchParams }: { searchParams: Promise<{ vue?: string; inscription?: string }> }) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const tz = await lireFuseau()
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

  // Seuil anti-triche photo (heures), éditable par le prof.
  const { data: cfg } = await supabase.from('fragments_config').select('seuil_photo_heures').eq('id', 1).maybeSingle()
  const seuilPhotoHeures = cfg?.seuil_photo_heures ?? 48

  if (inscriptions.length === 0) {
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center gap-2">
          <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>
        </div>
        <div className="bg-surface border border-bordure rounded-xl p-6 text-center text-muet text-sm">
          Ce module n'est pas disponible pour ton compte.
        </div>
      </div>
    )
  }

  const { vue: vueParam, inscription: inscriptionParam } = await searchParams
  const vue = vueParam === 'oral' || vueParam === 'essai' || vueParam === 'synthese' ? vueParam : 'ecrit'

  // Contexte de classe courant (commutateur global du Lot 9, cookie partagé).
  // Un lien de la bannière transversale peut cibler une autre classe via ?inscription=
  // (cas du retour non lu dans une classe non affichée) : on l'honore s'il correspond
  // à une inscription valide de l'élève (sinon cookie, sinon 1ʳᵉ). Aucun risque de fuite :
  // inscriptions ne contient que les inscriptions actives de l'élève pour ce module.
  // C7·L2 — en état « Toutes », le repli `?? inscriptions[0]` ci-dessous ferait
  // lire à un bi-classe le flux d'une classe en croyant les voir toutes : on
  // demande laquelle (item 3).
  // Accès & classes · L1 — le repli `?? inscriptions[0]` faisait lire à un
  // bi-classe le flux d'une classe SOUS LE NOM d'une autre dès que celle au
  // commutateur n'a pas Fragments. Le lien ciblé (`?inscription=`) reste honoré :
  // il désigne explicitement une inscription qui, elle, a bien le module.
  const { active, toutes } = await contexteClasseEleve(supabase, user.id)
  const cible = inscriptionParam ? inscriptions.find(i => i.id === inscriptionParam) : undefined
  if (toutes && !cible) {
    return <ChoixClasseModule inscriptions={inscriptions} nomModule="Vestigia" />
  }
  const ici = inscriptions.find(i => i.id === active?.id)
  if (!cible && !toutes && !ici) {
    return (
      <ModuleHorsClasse
        nomModule="Vestigia"
        classeContexte={active?.classe_nom ?? ''}
        ailleurs={inscriptions.map(i => i.classe_nom)}
      />
    )
  }
  const inscriptionActive = cible ?? ici ?? inscriptions[0]
  const inscriptionId = inscriptionActive.id

  // Thème du semestre courant (un thème par inscription × semestre). L'élève
  // n'a pas de sélecteur : il voit toujours le semestre marqué « courant ».
  const { data: semCourant } = await admin
    .from('semesters')
    .select('id, fragments_premiere_semaine')
    .eq('is_active', true)
    .maybeSingle()
  let themeQuery = supabase
    .from('fragments_themes')
    .select('theme, description, essai_actif, propose_at, valide_at, commentaire_prof, commente_at')
    .eq('inscription_id', inscriptionId)
  if (semCourant?.id) themeQuery = themeQuery.eq('semestre_id', semCourant.id)
  const { data: theme } = await themeQuery.maybeSingle()

  // Semaine ouverte (scopée au semestre actif : sinon une semaine restée ouverte
  // d'un semestre précédent pourrait s'afficher / être déposable).
  // C8-L4 — `is_vacation = false` explicitement : cf. `app/eleve/page.tsx`, une
  // semaine ouverte puis passée en vacances gagnerait le tri (`NULL` d'abord).
  let reqSemaine = supabase
    .from('fragments_semaines')
    .select('*')
    .eq('ouverte', true)
    .eq('is_vacation', false)
  if (semCourant?.id) reqSemaine = reqSemaine.eq('semestre_id', semCourant.id)
  const { data: semaine } = await reqSemaine
    .order('numero', { ascending: false })
    .limit(1)
    .maybeSingle()

  // C8-L4 — le professeur peut ouvrir une semaine que Fragments ne réclame pas
  // (présentation, choix des sujets). L'élève ne doit alors pas lire « à rendre » :
  // le dépôt reste possible, il n'est simplement pas dû.
  const semaineReclamee = semaine
    ? estSemaineComptee(semaine, semCourant?.fragments_premiere_semaine ?? 1)
    : true

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

  // C6-L4 — la chaîne de mesure, PAR SON MODULE : le signal du lancement
  // (`ouvert_par_prof_at`, C4-L9) et l'inventaire des copies passées avec leur
  // retour (C5-L4). Les deux naissent derrière leurs portes, lues dans ces
  // fonctions, jamais ici.
  const [signauxChaine, retoursChaine] = vue === 'essai'
    ? await Promise.all([
        signauxDeLancement(admin, user.id, 'fragments'),
        examensEnClasseDeLEleve(admin, user.id, inscriptionActive.classe_id, 'fragments'),
      ])
    : [[], []]

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
  // C8-L4 — les semaines DU SEMESTRE ACTIF, pas toutes celles de la base.
  // Avant ce lot, cette lecture n'était scopée ni au semestre ni aux vacances :
  // le parcours de l'élève et son pourcentage de dépôt se calculaient sur les
  // semaines de TOUS les semestres jamais créés (71 lignes / 4 semestres au
  // 25/08), semestres de test compris. Le pourcentage affiché était donc faux
  // pour tout le monde, et d'autant plus faux que l'année avançait.
  let reqToutes = admin
    .from('fragments_semaines')
    .select('id, numero, is_vacation')
    .order('numero')
  if (semCourant?.id) reqToutes = reqToutes.eq('semestre_id', semCourant.id)
  const { data: toutesLessemaines } = await reqToutes

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

  // Construire les points du graphique élève
  // C8-L4 — idem fiche prof : pas de point pour une semaine de vacances.
  const pointsParcours: PointSemaine[] = (toutesLessemaines ?? []).filter(s => !s.is_vacation).map(s => {
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
  // Numérateur et dénominateur sur le MÊME ensemble — les semaines réclamées.
  // Un fragment déposé avant qu'on en demande garde son retour et sa place sur la
  // courbe ci-dessus ; il ne compte pas dans le pourcentage.
  const idsComptees = new Set(
    semainesComptees(toutesLessemaines ?? [], semCourant?.fragments_premiere_semaine ?? 1)
      .map(s => s.id as string),
  )
  const nbSemainesTotal = idsComptees.size
  const nbDeposesTotal = (tousDepots ?? []).filter(d => idsComptees.has(d.semaine_id as string)).length
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

  // ── Lot 10 : dernier retour écrit, gate de lecture, couleurs des tuiles ────
  const derniereAnalyseEcrite = (analyseActuelle as FragmentAnalyse | null)
    ?? ((depotsPasses.map(d => analyseParDepot[d.id]).find(Boolean) as FragmentAnalyse | undefined) ?? null)
  const pistesDerniere = (analyseActuelle
    ? (pistesActuelles ?? [])
    : (derniereAnalyseEcrite ? (pistesParAnalyse[derniereAnalyseEcrite.id] ?? []) : [])) as FragmentPiste[]
  const gateActif = !!derniereAnalyseEcrite && !(derniereAnalyseEcrite as unknown as { retour_lu_at?: string | null }).retour_lu_at

  // Gate de lecture TRANSVERSAL : tout retour non lu (n'importe quel module) bloque
  // le dépôt écrit. Le dépôt d'ESSAI, lui, reste ouvert (travail noté) → non gaté ici.
  // Calculé uniquement sur la vue écrite (seule consommatrice ; ~10 requêtes évitées ailleurs).
  const retoursALire = vue === 'ecrit' ? await retoursNonLus(admin, user.id) : []

  const aOral = Object.keys(oralParSemaine).length > 0


  // ── Handoff « Fragments élève » (03/09) — ce que l'accueil met en avant ─────
  // Le thème, puis UNE carte « à faire maintenant » (règle pure, testée), le
  // parcours sur une ligne, le dernier retour replié s'il est lu, le dépôt,
  // l'archive en lignes. Les onglets de la Barre 2 portent les quatre brins.
  const etatTheme = theme ? {
    theme: theme.theme,
    propose_at: (theme as { propose_at?: string | null }).propose_at ?? null,
    valide_at: (theme as { valide_at?: string | null }).valide_at ?? null,
    commentaire_prof: (theme as { commentaire_prof?: string | null }).commentaire_prof ?? null,
    commente_at: (theme as { commente_at?: string | null }).commente_at ?? null,
  } : null
  const statutTheme = statutDuTheme(etatTheme)

  const carte = vue === 'ecrit' ? carteAFaire({
    themeStatut: statutTheme,
    semaine: semaine ? {
      numero: semaine.numero,
      reclamee: semaineReclamee,
      limite: formatDateLimite(semaine.date_limite, tz),
      echue: new Date(semaine.date_limite) < new Date(),
    } : null,
    depose: !!depotActuel,
    depotEnRetard: !!depotEnRetard,
    retourDeLaSemaine: !!analyseActuelle,
    gateActif,
    // Quand le gate est actif, la carte est déjà « lis ton retour » : les autres
    // sources sont listées dans le bloc du dépôt, pas ici.
    retoursAilleurs: gateActif ? [] : retoursALire.map(r => ({ label: r.label, href: r.href })),
  }) : null

  // Les lettres du parcours : la moyenne de chaque section sur les retours notés.
  const moyenneSection = (cle: (typeof SECTIONS_ECRIT)[number]['cle']) => analysesAvecNotes.length > 0
    ? analysesAvecNotes.reduce((s, a) => s + (a[cle] ?? 0), 0) / analysesAvecNotes.length
    : null
  const lettresParcours = SECTIONS_ECRIT.map(s => ({ label: s.label, lettre: noteVersLettre(moyenneSection(s.cle)) }))

  // La semaine du dernier retour (celle en cours, ou celle de son dépôt passé).
  const semaineDuDernierRetour: number | null = analyseActuelle
    ? semaine?.numero ?? null
    : ((depotsPasses.find(d => analyseParDepot[d.id]?.id === derniereAnalyseEcrite?.id)?.semaine as unknown as { numero: number | null } | null)?.numero ?? null)
  const premierePiste = pistesDerniere[0]?.contenu ?? null

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/eleve" className="text-sm text-muet hover:text-encre-douce">← Retour</Link>
      </div>

      {/* Le thème est le TITRE de la page (l'identité du module est portée par la
          Barre 2). Il est à l'élève : il l'écrit, le professeur le relit et le
          valide — ou le commente, et le commentaire ne se montre que tant qu'il
          attend une réponse (C8, Louis 02/09). */}
      <ThemeEleve
        inscriptionId={inscriptionId}
        semestreId={semCourant?.id ?? null}
        theme={theme?.theme ?? null}
        description={theme?.description ?? null}
        statut={statutTheme}
        commentaire={statutTheme === 'commente' ? etatTheme?.commentaire_prof ?? null : null}
      />

      {/* ── À faire maintenant — une seule chose, en tête ── */}
      {carte && (
        <section className={`rounded-xl border-[1.5px] bg-surface px-5 py-4 ${BORD_CARTE[carte.ton]}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className={`font-ui text-[11px] font-bold uppercase tracking-[0.11em] ${TEXTE_CARTE[carte.ton]}`}>▸ À faire maintenant</p>
              <h3 className="font-titre text-xl sm:text-[22px] font-semibold text-encre leading-snug mt-0.5">{carte.titre}</h3>
              <p className="font-corps text-sm text-encre-douce mt-1">{carte.texte}</p>
            </div>
            {carte.action && (
              <Link
                href={carte.action.href}
                className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-bouton px-4 py-2.5 font-ui text-sm font-semibold text-surface hover:opacity-90 sm:w-auto"
              >
                {carte.action.libelle} →
              </Link>
            )}
          </div>
        </section>
      )}

      {/* ── Ton parcours — une ligne ; le graphe et les trois chiffres derrière « Voir le détail » ── */}
      {vue === 'ecrit' && pointsParcours.some(p => p.decouvertes !== null) && (
        <details className="group overflow-hidden rounded-xl border border-bordure bg-surface">
          <summary className="flex min-h-[48px] cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5
                              group-open:border-b group-open:border-bordure">
            <span className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet">Ton parcours</span>
            {/* ⚠️ `min-w-[14rem]` : c'est le min-width qui replie la ligne sur téléphone,
                pas `flex-wrap` (cf. reference_ligne_synthese_min_width). */}
            <span className="flex min-w-[14rem] flex-1 flex-wrap items-baseline gap-x-3">
              {lettresParcours.map(l => (
                <span key={l.label} className="font-corps text-sm text-encre-douce">
                  {l.label} <span className="font-titre text-lg font-semibold text-encre">{l.lettre ?? '—'}</span>
                </span>
              ))}
            </span>
            <span className="font-ui text-xs text-encre-douce group-open:hidden">Voir le détail →</span>
            <span className="hidden font-ui text-xs text-encre-douce group-open:inline">Replier</span>
          </summary>
          <div className="space-y-4 p-4">
            <GraphiqueProgression data={pointsParcours} />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-parchemin-fonce rounded-xl p-2 sm:p-3 text-center">
                <p className="font-titre text-base sm:text-lg text-encre">{nbSemainesTotal > 0 ? Math.round((nbDeposesTotal / nbSemainesTotal) * 100) : 0}%</p>
                <p className="font-ui text-xs text-muet mt-0.5">Taux de dépôt</p>
              </div>
              {meilleurSection && (
                <div className="bg-parchemin-fonce rounded-xl p-2 sm:p-3 text-center">
                  <p className="font-titre text-base sm:text-lg text-ok">{meilleurSection}</p>
                  <p className="font-ui text-xs text-muet mt-0.5">Meilleure section</p>
                </div>
              )}
              {sectionATravaillerKey && meilleurSection !== sectionATravaillerKey && (
                <div className="bg-parchemin-fonce rounded-xl p-2 sm:p-3 text-center">
                  <p className="font-titre text-base sm:text-lg text-attention">{sectionATravaillerKey}</p>
                  <p className="font-ui text-xs text-muet mt-0.5">À travailler</p>
                </div>
              )}
            </div>
          </div>
        </details>
      )}

      {/* ── Le dernier retour : à lire (gate, tout ouvert) ou déjà lu (replié) ── */}
      {vue === 'ecrit' && derniereAnalyseEcrite && (
        gateActif ? (
          <section id="retour" className="scroll-mt-24 space-y-4 rounded-xl border border-attention bg-surface p-4">
            <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-attention">
              Ton dernier retour{semaineDuDernierRetour != null && ` · Semaine ${semaineDuDernierRetour}`}
            </p>
            <p className="font-corps text-sm text-attention">Lis ton retour, coche chaque partie, puis valide pour pouvoir déposer ton prochain fragment.</p>
            <ValidationLecture
              tuiles={tuilesAnalyseEcrite(derniereAnalyseEcrite, pistesDerniere)}
              dejaLu={false}
              marquerAction={validerLectureRetour.bind(null, derniereAnalyseEcrite.id)}
            />
          </section>
        ) : (
          <details id="retour" className="group scroll-mt-24 overflow-hidden rounded-xl border border-bordure bg-surface">
            <summary className="flex min-h-[48px] cursor-pointer list-none flex-col gap-1.5 px-4 py-3 group-open:border-b group-open:border-bordure">
              <span className="flex items-center gap-3">
                <span aria-hidden>💡</span>
                <span className="min-w-0 flex-1 font-ui text-sm font-medium text-encre-douce">
                  Ton dernier retour{semaineDuDernierRetour != null && ` · Semaine ${semaineDuDernierRetour}`}
                </span>
                <LettresEcrit analyse={derniereAnalyseEcrite} />
                <span className="shrink-0 font-ui text-xs text-muet group-open:hidden">déplier</span>
                <span className="hidden shrink-0 font-ui text-xs text-muet group-open:inline">replier</span>
              </span>
              {premierePiste && (
                <span className="line-clamp-2 font-corps text-sm italic text-encre-douce group-open:hidden sm:pl-8">
                  Piste : « {premierePiste} »
                </span>
              )}
            </summary>
            <div className="p-4">
              <AnalysePubliee analyse={derniereAnalyseEcrite} pistes={pistesDerniere} />
            </div>
          </details>
        )
      )}

      {/* ── Le dépôt de la semaine (B) ── */}
      {vue === 'ecrit' && (
        semaine ? (
          <section id="depot" className="scroll-mt-24 overflow-hidden rounded-xl border border-bordure bg-surface">
            <div className="flex items-start justify-between gap-3 border-b border-bordure px-4 py-4">
              <div className="min-w-0">
                <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet">Semaine en cours</p>
                <p className="font-titre text-xl font-semibold leading-tight text-encre">Semaine {semaine.numero}{semaine.titre ? ` — ${semaine.titre}` : ''}</p>
                {semaineReclamee ? (
                  <p className="font-corps text-sm text-muet mt-0.5">À rendre avant la fin du {formatDateLimite(semaine.date_limite, tz)}</p>
                ) : (
                  <p className="font-corps text-sm italic text-muet-clair mt-0.5">
                    Pas de fragment réclamé cette semaine — tu peux déposer si tu veux.
                  </p>
                )}
              </div>
              {depotActuel ? (
                <span className={`flex-shrink-0 rounded-full px-2 py-1 font-ui text-xs ${depotEnRetard ? 'bg-retard-teinte text-retard' : 'bg-ok-teinte text-ok'}`}>
                  {depotEnRetard ? '⚠ En retard' : '✓ Déposé'}
                </span>
              ) : (
                <span className={`flex-shrink-0 rounded-full px-2 py-1 font-ui text-xs ${
                  semaineReclamee ? 'bg-attention-teinte text-attention' : 'bg-parchemin-fonce text-muet'
                }`}>{semaineReclamee ? 'À déposer' : 'Facultatif'}</span>
              )}
            </div>
            <div className="space-y-4 px-4 py-4">
              {retoursALire.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-attention bg-attention-teinte px-4 py-3">
                  <p className="font-ui text-sm font-medium text-attention">Dépôt bloqué</p>
                  <p className="font-corps text-sm text-attention">Lis et valide {retoursALire.length > 1 ? 'tes retours en attente' : 'ton retour en attente'} pour pouvoir déposer :</p>
                  <ul className="space-y-1">
                    {retoursALire.map((r) => (
                      <li key={r.module}>
                        <Link href={r.href} className="font-corps text-sm text-attention underline underline-offset-2 hover:opacity-80">{r.label} →</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : depotActuel ? (
                <>
                  {!analyseActuelle && (
                    <div className="rounded-xl border border-bordure bg-parchemin-fonce px-4 py-3">
                      <p className="font-corps text-sm text-muet">Retour en préparation — ton professeur l&apos;examinera bientôt. Ta fiche reste visible en attendant.</p>
                    </div>
                  )}
                  {/* Déposé : le formulaire de remplacement ne s'impose plus, il se déplie. */}
                  <Pli titre="Remplacer mon dépôt" aspect="ligne">
                    <FormulaireDepot semaineId={semaine.id} eleveId={user.id} inscriptionId={inscriptionId} depotExistant seuilHeures={seuilPhotoHeures} />
                  </Pli>
                </>
              ) : (
                <FormulaireDepot semaineId={semaine.id} eleveId={user.id} inscriptionId={inscriptionId} depotExistant={false} seuilHeures={seuilPhotoHeures} />
              )}
            </div>
          </section>
        ) : (
          <div className="rounded-xl border border-bordure bg-surface p-6 text-center">
            <p className="font-corps text-sm text-muet">Aucune semaine n&apos;est ouverte pour l&apos;instant.<br />Ton professeur en créera une bientôt.</p>
          </div>
        )
      )}

      {/* ── Semaines précédentes (D) — une ligne par dépôt, un seul pli ouvert à la fois ── */}
      {vue === 'ecrit' && depotsPasses.length > 0 && (
        <section className="space-y-2">
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet px-0.5">Semaines précédentes</p>
          {depotsPasses.map(depot => {
            const analyse = analyseParDepot[depot.id]
            const pistes = analyse ? (pistesParAnalyse[analyse.id] ?? []) : []
            const sem = depot.semaine as unknown as { numero: number | null; titre: string | null } | null
            const titre = `Semaine ${sem?.numero ?? '?'}${sem?.titre ? ` — ${sem.titre}` : ''}`
            return analyse ? (
              <Pli key={depot.id} nom="semaines-precedentes" titre={titre} apercu={<LettresEcrit analyse={analyse} />}>
                <AnalysePubliee analyse={analyse} pistes={pistes as FragmentPiste[]} />
              </Pli>
            ) : (
              <div key={depot.id} className="flex min-h-[44px] items-center gap-3 rounded-xl border border-bordure bg-surface px-4 py-2.5">
                <span className="min-w-0 flex-1 font-ui text-sm font-medium text-encre-douce">{titre}</span>
                <span className="rounded-full bg-parchemin-fonce px-2 py-0.5 font-ui text-xs text-muet">Déposé ✓</span>
              </div>
            )
          })}
        </section>
      )}

      {/* ── Fragment oral (E) — lecture ; l'oral se fait en classe ── */}
      {vue === 'oral' && (
        aOral ? (
          <div className="space-y-4">
            {Object.entries(oralParSemaine).map(([semId, data]) => {
              const num = (toutesLessemaines ?? []).find(s => s.id === semId)?.numero
              return (
                <div key={semId} className="rounded-xl border border-bordure bg-surface p-4">
                  <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet mb-3">{num ? `Semaine ${num} — ` : ''}ta présentation orale</p>
                  <AnalyseOralePubliee oral={data.oral} analyseOrale={data.analyseOrale} />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-bordure bg-surface p-6 text-center font-corps text-sm text-muet">
            Aucun retour d&apos;oral pour l&apos;instant. L&apos;oral se fait en classe.
          </div>
        )
      )}

      {/* ── Essai (F) — dépôt si pas encore soumis + retour ; un seul essai ── */}
      {/* L'onglet Essai existe toujours (C8·L3) : sans essai activé pour l'élève,
          il dit ce qu'il en est au lieu de rester vide. */}
      {vue === 'essai' && !essaiActif && (
        <div className="rounded-xl border border-bordure bg-surface p-6 text-center font-corps text-sm text-muet">
          Aucun essai n&apos;est prévu pour toi pour l&apos;instant.
        </div>
      )}

      {vue === 'essai' && (signauxChaine.length > 0 || retoursChaine.length > 0) && (
        <div className="mb-4 space-y-2">
          {signauxChaine.map(s => (
            <div key={s.depotId} className="rounded-xl border border-ok bg-ok-teinte p-4">
              <p className="font-ui text-sm font-medium text-ok">
                Essai ouvert par ton professeur — {s.titre}
              </p>
              <p className="font-corps text-xs text-ok mt-0.5">
                Ouvert le {formatInstant(s.ouvertLe, tz, { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}.
                Dépose tes photos ci-dessous : ta copie entre d’elle-même dans la chaîne de mesure.
              </p>
            </div>
          ))}
          {retoursChaine.map(r => (
            <Link key={r.depotId} href={r.href}
              className={`block rounded-xl border p-4 transition-colors hover:opacity-90 ${
                r.etat.ton === 'a_lire' ? 'bg-attention-teinte border-attention' : 'bg-surface border-bordure'
              }`}>
              <p className={`font-ui text-sm font-medium ${r.etat.ton === 'a_lire' ? 'text-attention' : 'text-encre'}`}>
                Chaîne de mesure — {r.titre}
              </p>
              <p className="font-corps text-xs text-muet mt-0.5">
                {r.etat.libelle} · ton essai a deux retours : celui de Fragments ci-dessous, et celui-ci (trois compétences).
              </p>
            </Link>
          ))}
        </div>
      )}

      {vue === 'essai' && essaiActif && (
        <div className="space-y-4">
          {analyseEssaiPubliee && (
            (analyseEssaiPubliee as EssaiDepotAnalyse).retour_lu_at ? (
              <div className="space-y-4 rounded-xl border border-bordure bg-surface p-5">
                <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet">Retour de ton professeur <span className="text-ok">· lu ✓</span></p>
                <EssaiPublie analyse={analyseEssaiPubliee as EssaiDepotAnalyse} />
              </div>
            ) : (
              <div className="space-y-4 rounded-xl border border-attention bg-surface p-5">
                <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-attention">Retour de ton professeur — à lire</p>
                <ValidationLecture
                  tuiles={tuilesAnalyseEssai(analyseEssaiPubliee as EssaiDepotAnalyse)}
                  dejaLu={false}
                  marquerAction={validerLectureRetourEssai.bind(null, (analyseEssaiPubliee as EssaiDepotAnalyse).id)}
                />
              </div>
            )
          )}
          {epreuveOuverte && (
            <div className="overflow-hidden rounded-xl border border-bordure bg-surface">
              <div className="border-b border-bordure px-4 py-4">
                <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet">Essai</p>
                <p className="font-titre text-xl font-semibold leading-tight text-encre">{epreuveOuverte.titre}</p>
                <p className="font-corps text-sm text-muet mt-0.5">
                  {formatJour(epreuveOuverte.date_essai as string, { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{epreuveOuverte.duree_minutes} min
                </p>
                {epreuveOuverte.consignes && <p className="font-corps text-sm text-encre-douce mt-2 whitespace-pre-wrap">{epreuveOuverte.consignes}</p>}
              </div>
              <div className="px-4 py-4">
                {essaiEleve && !analyseEssaiEnCours ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-ok-teinte px-2 py-0.5 font-ui text-xs text-ok">Photos déposées</span>
                      <span className="font-corps text-xs text-muet">Ton professeur analysera ton essai bientôt.</span>
                    </div>
                    <Pli titre="Remplacer mon dépôt" aspect="ligne">
                      <EssaiDepot epreuveId={epreuveOuverte.id} inscriptionId={inscriptionId} essaiExistantId={essaiEleve.id} analyseEnCours={false} />
                    </Pli>
                  </div>
                ) : (
                  <EssaiDepot epreuveId={epreuveOuverte.id} inscriptionId={inscriptionId} essaiExistantId={essaiEleve?.id ?? null} analyseEnCours={!!analyseEssaiEnCours} />
                )}
              </div>
            </div>
          )}
          {!epreuveOuverte && !analyseEssaiPubliee && (
            <div className="rounded-xl border border-bordure bg-surface p-6 text-center font-corps text-sm text-muet">Aucun essai ouvert pour l&apos;instant.</div>
          )}
        </div>
      )}

      {/* ── Bilan de semestre (G) — le sceau s'y déploie en grand ── */}
      {vue === 'synthese' && synthesePubliee && (
        <div className="rounded-xl border border-bordure bg-surface p-5">
          <BilanSemestre synthese={synthesePubliee as FragmentSynthese} theme={theme?.theme ?? null} />
        </div>
      )}
    </div>
  )
}

// Ton de la carte « à faire maintenant » → liseré et sur-label (jetons de la charte).
const BORD_CARTE: Record<CarteAFaire['ton'], string> = {
  pigment: 'border-pigment', attention: 'border-attention', retard: 'border-retard', ok: 'border-ok', neutre: 'border-bordure',
}
const TEXTE_CARTE: Record<CarteAFaire['ton'], string> = {
  pigment: 'text-pigment', attention: 'text-attention', retard: 'text-retard', ok: 'text-ok', neutre: 'text-muet',
}

/** Les trois lettres d'un retour écrit, sur une ligne (résumé d'un pli fermé). */
function LettresEcrit({ analyse }: { analyse: FragmentAnalyse }) {
  return (
    <span className="flex shrink-0 items-center gap-2 font-titre text-base font-semibold text-encre-douce">
      {SECTIONS_ECRIT.map(s => (
        <span key={s.cle}>
          <span className="sr-only">{s.label} </span>
          {noteVersLettre(analyse[s.cle]) ?? '—'}
        </span>
      ))}
    </span>
  )
}
