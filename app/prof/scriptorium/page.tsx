import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { classesConflitWholeBook } from '@/utils/aletheia-dates'
import { getUrlSignee } from './actions'
import Tuile from '@/components/Tuile'
import FormulaireLivre from './FormulaireLivre'
import { type ImageItem } from './LigneContenu'
import BibliothequeContenus from './BibliothequeContenus'
import type { ContenuBiblio } from './LigneContenuBiblio'
import EditeurSections from './EditeurSections'
import { reconstruirePlages, type PlageSection } from '@/utils/scriptorium-sections'
import GrilleInstance from './GrilleInstance'
import { chargerInstanceDeClasse, type InstanceDeClasse } from './instance-serveur'
import BoutonRegenererSynthese from './BoutonRegenererSynthese'
import { createAdminClient } from '@/utils/supabase/admin'
import { lireReglagesRag } from '@/utils/scriptorium-rag'
import { cleDAppariement } from '@/utils/fabrique/notions'
import type { ContenuSynthese } from '@/utils/scriptorium-synthese-rag'
import AccueilParcoursPlans from './parcours/AccueilParcoursPlans'
import GrilleParcours from './parcours/GrilleParcours'
import {
  chargerListeParcours, chargerParcoursDetail, chargerCiblesPicker, chargerParcoursDeClasse,
  type ParcoursListItem, type ParcoursDetail, type CiblesPicker, type ParcoursDeClasse,
} from './parcours/donnees'
import { chargerAssignationsAvecApercu, type LigneAssignation } from './parcours/frise-serveur'
import VueLivre from './vue-livre/VueLivre'
import type { Signet } from './decoupe-utils'
import SectionParametresScriptorium from './SectionParametresScriptorium'
import { parseReference } from '@/utils/aletheia-retours'
import type { CapstoneProf, LivreReferenceProf } from '@/app/eleve/modules/aletheia/types'
import { lireGatePlanActif, lireQuizAnnonceDefaut } from '@/utils/plan-exercices'
import {
  chargerClassesAvecPlan, chargerPlanDeClasse, defautDateDebut,
  type ClasseAvecPlan, type PlanDetail,
} from './evaluations/plan-serveur'
import { chargerPanoptiqueDeClasse, type Panoptique } from './evaluations/panoptique-serveur'
import GrillePlan from './evaluations/GrillePlan'
import { SemainesReadonly } from './evaluations/panoptique-bandes'
import { chargerListeModeles, chargerModeleDetail, chargerAssignationsModele, type ModeleListItem, type ModeleDetail, type LigneAssignationModele } from './evaluations/modele-serveur'
import FormulaireCreerModele from './evaluations/FormulaireCreerModele'
import GrilleModele from './evaluations/GrilleModele'

// Les Server Actions de cette page (analyse/extraction d'un PDF déposé) héritent du
// timeout de la page. Plafond du plan Vercel Hobby = 60 s ; large pour extraire le
// texte d'un PDF ≤ ~600 p. (aucun rendu d'image).
export const maxDuration = 60

interface DocRow {
  id: string
  unite_id: string
  titre: string
  type: string | null
  semaine: number | null
  chapitres: string | null
  texte_extrait: string | null
  fichier_ref: string | null
}

interface UniteRow {
  id: string
  label: string
  type: string | null
  date_debut: string | null
  nb_semaines: number | null
  auteur: string | null
  signets: Signet[] | null
}

export default async function ScriptoriumPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; classe?: string; unite?: string; semaine?: string; edition?: string; parcours?: string; modele?: string; decouper?: string; instance?: string; synthese?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const { vue = 'classes', classe: classeSel, unite: uniteSel, semaine, edition, parcours: parcoursSel, modele: modeleSel, decouper: decouperSel, instance: instanceSel, synthese: syntheseSel } = await searchParams

  const [{ data: classes }, { data: unites }, { data: docsBruts }, { data: liensUnite }, planEvalActif] = await Promise.all([
    supabase.from('classes').select('id, nom').order('nom'),
    supabase.from('scriptorium_unites').select('id, label, ordre, type, date_debut, nb_semaines, auteur, signets').is('supprime_at', null).order('ordre'),
    supabase.from('scriptorium_documents').select('id, unite_id, titre, type, semaine, chapitres, texte_extrait, fichier_ref'),
    supabase.from('scriptorium_unite_classes').select('unite_id, classe_id'),
    lireGatePlanActif(supabase), // gate du plan d'évaluation, lu en parallèle (pas de round-trip sériel)
  ])

  const classesList = (classes ?? []) as { id: string; nom: string }[]
  const unitesList = (unites ?? []) as UniteRow[]
  const docs = (docsBruts ?? []) as DocRow[]
  const classeNom = new Map(classesList.map(c => [c.id, c.nom]))

  // unité (livre) → classeIds (assignation au niveau du livre, Lot 2)
  const classesParUnite = new Map<string, string[]>()
  for (const l of liensUnite ?? []) {
    const arr = classesParUnite.get(l.unite_id as string) ?? []
    if (!arr.includes(l.classe_id as string)) arr.push(l.classe_id as string)  // dédup défensif
    classesParUnite.set(l.unite_id as string, arr)
  }

  // Livres (Aletheia) exposés PAR classe (via scriptorium_unite_classes) — vue « Par classe ».
  const livresParClasse = new Map<string, UniteRow[]>()
  for (const u of unitesList) {
    if (u.type !== 'livre') continue
    for (const cid of classesParUnite.get(u.id) ?? []) {
      const arr = livresParClasse.get(cid) ?? []
      arr.push(u)
      livresParClasse.set(cid, arr)
    }
  }

  // ── Bibliothèque (onglets Textes / Cours) — Parcours L2 ──────────────────────
  // Items réutilisables (scriptorium_contenus), sans classe/unité/semaine. On ne
  // charge/signe que pour l'onglet actif. Si les tables n'existent pas encore
  // (migration parcours_phase_a.sql non jouée), les requêtes renvoient une erreur
  // silencieuse (data null) → listes vides, pas de crash de la page.
  const biblioType: 'texte' | 'cours' | null = vue === 'textes' ? 'texte' : vue === 'cours' ? 'cours' : null
  let biblioContenus: ContenuBiblio[] = []
  let biblioCorbeille: { id: string; titre: string }[] = []
  // Le vocabulaire que la BANQUE connaît — ce que l'écran du cours propose.
  const notionsConnues: string[] = []
  if (biblioType) {
    const [{ data: rowsC }, { data: imgsC }, { data: creneauxC }, { data: parcVivantsC }, { data: secsC }] = await Promise.all([
      supabase.from('scriptorium_contenus')
        .select('id, type, titre, auteur, texte_extrait, chapitres, notions, supprime_at')
        .eq('type', biblioType).order('titre'),
      supabase.from('scriptorium_contenu_images')
        .select('id, contenu_id, fichier_ref, legende, ordre').not('contenu_id', 'is', null).order('ordre'),
      supabase.from('scriptorium_parcours_creneaux').select('parcours_id, contenu_id').not('contenu_id', 'is', null),
      supabase.from('scriptorium_parcours').select('id').is('supprime_at', null),
      // Compteur « N sections » des cours (RAG L2) — seuls les cours se découpent.
      biblioType === 'cours'
        ? supabase.from('scriptorium_contenu_sections').select('contenu_id')
        : Promise.resolve({ data: [] as { contenu_id: string }[] }),
    ])
    const rows = (rowsC ?? []) as {
      id: string; type: string; titre: string; auteur: string | null
      texte_extrait: string | null; chapitres: string | null
      notions: string[] | null; supprime_at: string | null
    }[]
    const vivants = rows.filter(r => r.supprime_at == null)
    const idsVivants = new Set(vivants.map(r => r.id))

    // Compteur « utilisé dans N parcours » = nombre de PARCOURS DISTINCTS (un contenu
    // peut occuper plusieurs semaines/positions d'un même parcours → 1 seul compté).
    const parcoursVivants = new Set((parcVivantsC ?? []).map(p => p.id as string))
    const parcoursParContenu = new Map<string, Set<string>>()
    for (const c of creneauxC ?? []) {
      const cid = c.contenu_id as string
      if (!idsVivants.has(cid)) continue
      const pid = c.parcours_id as string
      if (!parcoursVivants.has(pid)) continue // ignore les créneaux de parcours supprimés
      const s = parcoursParContenu.get(cid) ?? new Set<string>()
      s.add(pid)
      parcoursParContenu.set(cid, s)
    }

    // Images des contenus VIVANTS de cet onglet, signées (URL éphémère). On ne signe
    // pas celles des contenus en corbeille (jamais rendues).
    const imgsVivants = (imgsC ?? []).filter(i => idsVivants.has(i.contenu_id as string))
    const imgsSignees = await Promise.all(imgsVivants.map(async i => ({
      contenu_id: i.contenu_id as string,
      item: { id: i.id as string, url: await getUrlSignee(i.fichier_ref as string), legende: i.legende as string | null } as ImageItem,
    })))
    const imagesParContenu = new Map<string, ImageItem[]>()
    for (const { contenu_id, item } of imgsSignees) {
      const arr = imagesParContenu.get(contenu_id) ?? []
      arr.push(item)
      imagesParContenu.set(contenu_id, arr)
    }

    const sectionsParContenu = new Map<string, number>()
    for (const s of secsC ?? []) {
      const cid = s.contenu_id as string
      sectionsParContenu.set(cid, (sectionsParContenu.get(cid) ?? 0) + 1)
    }

    biblioContenus = vivants.map(r => ({
      id: r.id, type: r.type as 'texte' | 'cours', titre: r.titre, auteur: r.auteur,
      texte: r.texte_extrait, chapitres: r.chapitres, notions: r.notions ?? [],
      images: imagesParContenu.get(r.id) ?? [], nbParcours: parcoursParContenu.get(r.id)?.size ?? 0,
      nbSections: sectionsParContenu.get(r.id) ?? 0,
    }))
    biblioCorbeille = rows.filter(r => r.supprime_at != null).map(r => ({ id: r.id, titre: r.titre }))

    // ⭐⭐ C4-L16 — LA SECONDE GARDE, ET C'EST ELLE QUI COMPTE : « l'écran du
    //   cours propose les notions DÉJÀ CONNUES — celles que les sujets en banque
    //   déclarent. On ne rattache pas en tapant, on rattache en choisissant »
    //   (`08-` §3 ; `01-` §4 couche 4). Sans elle, deux chaînes libres de part et
    //   d'autre — « la vérité », « Vérité » — ne se rencontrent jamais, le sujet
    //   reste muet, et RIEN À L'ÉCRAN NE DIT POURQUOI.
    // ⛔ CE N'EST PAS UNE LISTE FERMÉE : le champ reste libre, et le formulaire
    //   accepte une notion que la banque ne connaît pas encore. « C'est l'écran
    //   qui guide, pas une contrainte » (`07-` §2, qui retire explicitement à ce
    //   lot « la liste fermée des notions du programme »).
    // ⚠️ On ne propose que pour un COURS : un texte de la bibliothèque ne
    //   déclare rien — son rattachement passe par le `plan_de_lecture`.
    if (biblioType === 'cours') {
      // ⚠️ Les deux banques, pas une : le format 1.3 pose `notions` sur
      //   `textes[]` autant que sur `sujets[]` (`08-` §2).
      const [{ data: nS }, { data: nT }] = await Promise.all([
        supabase.from('exercices_sujets').select('notions').neq('statut', 'retire'),
        supabase.from('exercices_textes').select('notions').neq('statut', 'retire'),
      ])
      // Dédoublonnage sur la CLÉ D'APPARIEMENT, jamais sur la chaîne : « la
      // vérité » et « La Vérité » sont UNE notion, et l'écran ne doit en
      // proposer qu'une — celle qui a été écrite en premier.
      const vues = new Set<string>()
      for (const r of [...(nS ?? []), ...(nT ?? [])]) {
        for (const n of ((r.notions as string[] | null) ?? [])) {
          const cle = cleDAppariement(n)
          if (cle === '' || vues.has(cle)) continue
          vues.add(cle)
          notionsConnues.push(String(n))
        }
      }
      notionsConnues.sort((a, b) => a.localeCompare(b, 'fr'))
    }
  }

  // ── Éditeur de sections d'un cours (?vue=cours&decouper=…) — RAG L2 ──────────
  // Reconstruit les plages depuis les sections stockées (null si le texte a changé
  // → l'éditeur repart d'une feuille vierge avec un avis) ; compte les parcours de
  // classe référents pour la confirmation de re-découpe consciente.
  let editeurSections: {
    contenu: ContenuBiblio
    plagesInitiales: PlageSection[] | null
    texteChange: boolean
    nbSections: number
    nbInstances: number
  } | null = null
  if (vue === 'cours' && decouperSel) {
    const contenu = biblioContenus.find(c => c.id === decouperSel) ?? null
    if (contenu) {
      const [{ data: secs }, { data: refs }] = await Promise.all([
        supabase.from('scriptorium_contenu_sections')
          .select('titre, niveau, texte, ordre').eq('contenu_id', contenu.id)
          .order('ordre', { ascending: true }),
        supabase.from('scriptorium_parcours_classe_creneaux')
          .select('parcours_classe_id').eq('ref_type', 'contenu').eq('contenu_id', contenu.id),
      ])
      const sections = (secs ?? []).map(s => ({ titre: s.titre as string, niveau: s.niveau as number, texte: s.texte as string }))
      const plagesInitiales = reconstruirePlages(contenu.texte ?? '', sections)
      editeurSections = {
        contenu,
        plagesInitiales,
        texteChange: sections.length > 0 && plagesInitiales === null,
        nbSections: sections.length,
        nbInstances: new Set((refs ?? []).map(r => r.parcours_classe_id as string)).size,
      }
    }
  }

  // ── Parcours (onglet builder) — L4 ───────────────────────────────────────────
  const estParcours = vue === 'parcours'
  let listeParcours: ParcoursListItem[] = []
  let parcoursDetail: ParcoursDetail | null = null
  let ciblesPicker: CiblesPicker = { textes: [], cours: [], livres: [] }
  let assignations: LigneAssignation[] = []
  // Accueil « deux mondes » (option 1f) : la colonne Plans lit les classes/modèles
  // via les loaders existants, gatés par planEvalActif (gate OFF → colonnes vides,
  // l'accueil n'affiche que Parcours).
  let accueilClassesPlan: ClasseAvecPlan[] = []
  let accueilModeles: ModeleListItem[] = []
  let accueilQuizAnnonce = false
  if (estParcours) {
    if (parcoursSel) {
      ;[parcoursDetail, ciblesPicker] = await Promise.all([
        chargerParcoursDetail(parcoursSel),
        chargerCiblesPicker(),
      ])
      if (parcoursDetail) {
        assignations = await chargerAssignationsAvecApercu(parcoursDetail.id, parcoursDetail.nbSemaines, classesList)
      }
    } else if (planEvalActif) {
      ;[listeParcours, accueilClassesPlan, accueilModeles, accueilQuizAnnonce] = await Promise.all([
        chargerListeParcours(),
        chargerClassesAvecPlan(),
        chargerListeModeles(),
        lireQuizAnnonceDefaut(supabase),
      ])
    } else {
      listeParcours = await chargerListeParcours()
    }
  }

  // ── Plan d'une classe (onglet Évaluations, GATÉ) — L2 ─────────────────────────
  // La LISTE « Par classe » vit dans l'accueil (?vue=parcours) → ?vue=evaluations
  // sans classe est un reliquat, on redirige. Seul le détail (?classe=…) survit ici.
  const estEvaluations = vue === 'evaluations'
  // ?vue=evaluations SANS classe = reliquat (la liste vit dans l'accueil) → toujours rediriger.
  if (estEvaluations && !classeSel) redirect('/prof/scriptorium?vue=parcours')
  // Gate OFF : les vues plan-éval (evaluations/modeles) n'ont aucun écran → accueil,
  // plutôt qu'une coquille vide sur une URL tapée à la main / un marque-page.
  if (!planEvalActif && (estEvaluations || vue === 'modeles')) redirect('/prof/scriptorium?vue=parcours')
  let planDetail: PlanDetail | null = null
  let panoptique: Panoptique | null = null
  if (planEvalActif && estEvaluations && classeSel) {
    // Détail interactif du plan (contrôles) + panoptique (bandes en lecture seule).
    ;[planDetail, panoptique] = await Promise.all([
      chargerPlanDeClasse(classeSel),
      chargerPanoptiqueDeClasse(classeSel),
    ])
  }

  // ── Modèles de plan (class-agnostiques, GATÉ) — Lot C ─────────────────────────
  // Vue « création » (?vue=modeles) = écran 3d (formulaire + aperçu cadence). La
  // LISTE des modèles vit dans l'accueil (segment Modèles) → pas de grille ici.
  const estModeles = vue === 'modeles'
  let modeleDetail: ModeleDetail | null = null
  let defautDateModele: string | null = null
  let assignModele: { defautDate: string; lignes: LigneAssignationModele[] } | null = null
  if (planEvalActif && estModeles) {
    if (modeleSel) {
      modeleDetail = await chargerModeleDetail(modeleSel)
      if (modeleDetail) assignModele = await chargerAssignationsModele(modeleSel)
    } else {
      defautDateModele = await defautDateDebut()
    }
  }

  // ── Grille d'instance (?vue=classes&classe=…&instance=…) — RAG L3 ────────────
  // Le pilotage « vu » d'un parcours pour UNE classe (créneaux/éléments d'instance).
  let grilleInstance: { instance: InstanceDeClasse; cibles: CiblesPicker } | null = null
  if (vue === 'classes' && classeSel && instanceSel) {
    const [inst, ciblesInst] = await Promise.all([
      chargerInstanceDeClasse(instanceSel),
      chargerCiblesPicker(),
    ])
    if (inst && inst.classeId === classeSel) grilleInstance = { instance: inst, cibles: ciblesInst }
  }

  // ── Synthèses du Scriptorium élève (RAG L7) — liste + détail + vue_at ────────
  interface SyntheseResume { id: string; semaineLundi: string; statut: string; vueAt: string | null }
  let ragActif = false
  let synthesesRag: SyntheseResume[] = []
  let syntheseDetail: { id: string; semaineLundi: string; statut: string; contenu: ContenuSynthese | null; cout: number | null } | null = null
  if (vue === 'classes' && classeSel && !instanceSel) {
    ragActif = (await lireReglagesRag(createAdminClient())).actif
    const { data: synths } = await supabase
      .from('scriptorium_rag_syntheses')
      .select('id, semaine_lundi, statut, vue_at')
      .eq('classe_id', classeSel)
      .order('semaine_lundi', { ascending: false })
    synthesesRag = (synths ?? []).map(r => ({
      id: r.id as string,
      semaineLundi: r.semaine_lundi as string,
      statut: r.statut as string,
      vueAt: (r.vue_at as string | null) ?? null,
    }))
    if (syntheseSel && synthesesRag.some(r => r.id === syntheseSel)) {
      const { data: sd } = await supabase
        .from('scriptorium_rag_syntheses')
        .select('id, semaine_lundi, statut, contenu, cout, vue_at')
        .eq('id', syntheseSel).maybeSingle()
      if (sd) {
        syntheseDetail = {
          id: sd.id as string,
          semaineLundi: sd.semaine_lundi as string,
          statut: sd.statut as string,
          contenu: (sd.contenu as ContenuSynthese | null) ?? null,
          cout: (sd.cout as number | null) ?? null,
        }
        // Ouvrir la synthèse pose vue_at (§10.3) → éteint le « à faire » du lundi.
        if (!sd.vue_at) {
          await createAdminClient().from('scriptorium_rag_syntheses')
            .update({ vue_at: new Date().toISOString() }).eq('id', sd.id as string)
        }
      }
    }
  }

  // Parcours (vivants) assignés à la classe sélectionnée + nb de parcours par classe
  // (compteur des tuiles) — vue « Par classe ».
  let parcoursDeClasse: ParcoursDeClasse[] = []
  const parcoursParClasse = new Map<string, number>()
  if (vue === 'classes') {
    if (classeSel) parcoursDeClasse = await chargerParcoursDeClasse(classeSel)
    const [{ data: pcC }, { data: pvC }] = await Promise.all([
      supabase.from('scriptorium_parcours_classes').select('parcours_id, classe_id'),
      supabase.from('scriptorium_parcours').select('id').is('supprime_at', null),
    ])
    const vivants = new Set((pvC ?? []).map(p => p.id as string))
    const parClasse = new Map<string, Set<string>>()
    for (const r of pcC ?? []) {
      const pid = r.parcours_id as string
      if (!vivants.has(pid)) continue
      const cid = r.classe_id as string
      const s = parClasse.get(cid) ?? new Set<string>()
      s.add(pid)
      parClasse.set(cid, s)
    }
    for (const [cid, s] of parClasse) parcoursParClasse.set(cid, s.size)
  }

  // Compteur « utilisé dans N parcours » par livre (créneaux ref_type='livre' de
  // parcours vivants) — affiché sur les tuiles de livres (onglet Livres).
  const usageLivres = new Map<string, number>()
  if (vue === 'livres') {
    const [{ data: crLivres }, { data: parcVivantsL }] = await Promise.all([
      supabase.from('scriptorium_parcours_creneaux').select('parcours_id, livre_id').not('livre_id', 'is', null),
      supabase.from('scriptorium_parcours').select('id').is('supprime_at', null),
    ])
    const vivants = new Set((parcVivantsL ?? []).map(p => p.id as string))
    const parLivre = new Map<string, Set<string>>()
    for (const c of crLivres ?? []) {
      const lid = c.livre_id as string
      const pid = c.parcours_id as string
      if (!vivants.has(pid)) continue
      const s = parLivre.get(lid) ?? new Set<string>()
      s.add(pid)
      parLivre.set(lid, s)
    }
    for (const [lid, s] of parLivre) usageLivres.set(lid, s.size)
  }

  // Docs du livre ouvert (?vue=livres&unite=…) — mappés plus bas pour VueLivre uniquement.
  const docsAffiches = vue === 'livres' && uniteSel ? docs.filter(d => d.unite_id === uniteSel) : []

  // Carte d'architecture + référence du livre sélectionné (onglet Livres, détail).
  const uniteSelLivre = vue === 'livres' && uniteSel ? unitesList.find(u => u.id === uniteSel && u.type === 'livre') : undefined
  // (L5) Garde-fou whole-book : classes ayant ce livre à la fois en direct ET en entier via un parcours.
  const conflitClasses = uniteSelLivre
    ? (await classesConflitWholeBook(supabase, uniteSelLivre.id)).map(cid => classeNom.get(cid)).filter((n): n is string => !!n)
    : []
  let capstoneLivre: CapstoneProf | null = null
  let referenceLivre: LivreReferenceProf | null = null
  // (E3) Gabarit de lecture du livre — porte `aletheia_etayage_actif` ouverte seulement ;
  // requêtes séparées et tolérantes (colonnes absentes ⇒ porte fermée ⇒ null).
  let gabaritLivre: 'argumentatif' | 'dialogue' | 'aphoristique' | 'analytique' | null = null
  if (uniteSelLivre) {
    const { lireLaPorteEtayage } = await import('@/utils/aletheia/decoupage-serveur')
    if (await lireLaPorteEtayage(supabase)) {
      const { gabaritDuLivre } = await import('@/utils/aletheia/gabarit-serveur')
      gabaritLivre = (await gabaritDuLivre(supabase, uniteSelLivre.id)).gabarit
    }
  }
  if (uniteSelLivre) {
    const [{ data: cap }, { data: ref }] = await Promise.all([
      supabase.from('aletheia_capstone').select('statut, contenu, amende_par_prof, updated_at').eq('scriptorium_livre_id', uniteSelLivre.id).maybeSingle(),
      supabase.from('aletheia_livre_reference').select('statut, contenu, amende_par_prof, updated_at').eq('scriptorium_livre_id', uniteSelLivre.id).maybeSingle(),
    ])
    capstoneLivre = (cap as CapstoneProf | null) ?? null
    // Normalise le jsonb brut : une référence générée AVANT l'ajout de
    // concepts_cles/synthese_modele n'a pas ces clés → parseReference garantit la forme
    // (champs additifs → [] / '') et évite un crash de l'UI sur les livres existants.
    referenceLivre = ref
      ? { ...(ref as LivreReferenceProf), contenu: ref.contenu == null ? null : parseReference(ref.contenu) }
      : null
  }

  // Les onglets (Classes / Parcours / Ressources / Paramètres) sont portés par la
  // Barre 2 de l'en-tête (pilotés par `?vue=`). Ressources regroupe textes/cours/livres ;
  // Parcours regroupe parcours/evaluations/modeles (cf. configModules.ts).
  return (
    <div className="space-y-6 pb-8">
      {/* La navigation entre les 5 portes (parcours / plans par classe / modèles)
          vit désormais dans l'accueil « deux mondes » (?vue=parcours) ; chaque écran
          de détail porte son propre retour en tête de contenu (plus de barre gatée). */}

      {/* ── Hub Ressources : Textes / Cours / Livres → vues existantes ───────── */}
      {vue === 'ressources' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Tuile nom="Textes" sousTitre="Extraits réutilisables"   href="/prof/scriptorium?vue=textes" />
          <Tuile nom="Cours"  sousTitre="Supports de cours"         href="/prof/scriptorium?vue=cours" />
          <Tuile nom="Livres" sousTitre="Œuvres (lecture Aletheia)" href="/prof/scriptorium?vue=livres" />
        </div>
      )}

      {/* ── Bibliothèque : Textes / Cours (Parcours L2) ─────────────────────── */}
      {biblioType && (
        <div className="space-y-3">
          {vue === 'cours' && decouperSel ? (
            editeurSections ? (
              <EditeurSections
                key={editeurSections.contenu.id}
                contenuId={editeurSections.contenu.id}
                titre={editeurSections.contenu.titre}
                auteur={editeurSections.contenu.auteur}
                texte={editeurSections.contenu.texte ?? ''}
                plagesInitiales={editeurSections.plagesInitiales}
                texteChange={editeurSections.texteChange}
                nbSectionsExistantes={editeurSections.nbSections}
                nbInstances={editeurSections.nbInstances}
              />
            ) : (
              <p className="text-sm text-muet">
                Cours introuvable. <Link href="/prof/scriptorium?vue=cours" className="underline">Retour aux cours</Link>.
              </p>
            )
          ) : (
            <>
              <Link href="/prof/scriptorium?vue=ressources" className="inline-block text-sm text-muet hover:text-encre">← Ressources</Link>
              <BibliothequeContenus type={biblioType} contenus={biblioContenus} corbeille={biblioCorbeille} notionsConnues={notionsConnues} />
            </>
          )}
        </div>
      )}

      {/* ── Parcours : builder + assignation, 2 colonnes (option 2d) ─────────── */}
      {estParcours && (
        parcoursDetail ? (
          <GrilleParcours parcours={parcoursDetail} cibles={ciblesPicker} assignations={assignations} />
        ) : parcoursSel ? (
          <p className="text-sm text-muet">Parcours introuvable. <Link href="/prof/scriptorium?vue=parcours" className="underline">Retour à la liste</Link>.</p>
        ) : (
          <AccueilParcoursPlans
            parcours={listeParcours}
            classesPlan={accueilClassesPlan}
            modeles={accueilModeles}
            planEvalActif={planEvalActif}
            quizAnnonce={accueilQuizAnnonce}
          />
        )
      )}

      {/* ── Perspective « classes » : vue d'ensemble (parcours + livres) d'une classe ─ */}
      {vue === 'classes' && grilleInstance && (
        <GrilleInstance instance={grilleInstance.instance} cibles={grilleInstance.cibles} />
      )}
      {vue === 'classes' && instanceSel && !grilleInstance && (
        <p className="text-sm text-muet">
          Instance introuvable. <Link href={`/prof/scriptorium?vue=classes${classeSel ? `&classe=${classeSel}` : ''}`} className="underline">Retour à la classe</Link>.
        </p>
      )}
      {vue === 'classes' && !instanceSel && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classesList.map(c => {
              const np = parcoursParClasse.get(c.id) ?? 0
              const nl = (livresParClasse.get(c.id) ?? []).length
              const parts: string[] = []
              if (np > 0) parts.push(`${np} parcours`)
              if (nl > 0) parts.push(`${nl} livre${nl > 1 ? 's' : ''}`)
              return (
                <Tuile
                  key={c.id}
                  nom={c.nom}
                  sousTitre={parts.length ? parts.join(' · ') : 'Rien d’assigné'}
                  href={`/prof/scriptorium?vue=classes&classe=${c.id}`}
                  selectionnee={classeSel === c.id}
                  couleur={np + nl > 0 ? 'vert' : 'neutre'}
                />
              )
            })}
          </div>

          {classeSel && (
            <div className="bg-surface border border-bordure rounded-xl p-4 space-y-4">
              <h3 className="font-medium text-encre">{classeNom.get(classeSel) ?? 'Classe'}</h3>

              {parcoursDeClasse.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muet uppercase tracking-wide">Parcours assignés</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* RAG L3 : la tuile ouvre le PARCOURS DE LA CLASSE (grille d'instance,
                        pilotage « vu ») — le modèle partagé reste accessible dessous. */}
                    {parcoursDeClasse.map(p => (
                      <div key={p.id} className="space-y-1">
                        <Tuile
                          nom={p.titre}
                          sousTitre={`${p.nbSemaines} sem.${p.dateDebut ? ` · début ${p.dateDebut.split('-').reverse().join('/')}` : ' · sans date'} · pilotage « vu »`}
                          href={`/prof/scriptorium?vue=classes&classe=${classeSel}&instance=${p.pcId}`}
                          couleur="vert"
                        />
                        <Link
                          href={`/prof/scriptorium?vue=parcours&parcours=${p.id}`}
                          className="block px-1 text-xs text-muet hover:text-encre"
                        >
                          Modèle (tous groupes) →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(livresParClasse.get(classeSel) ?? []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muet uppercase tracking-wide">Livres (lecture Aletheia)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(livresParClasse.get(classeSel) ?? []).map(u => {
                      const nb = u.nb_semaines ?? docs.filter(d => d.unite_id === u.id).length
                      return (
                        <Tuile
                          key={u.id}
                          nom={u.label}
                          sousTitre={`📖 ${nb} séance${nb > 1 ? 's' : ''}${u.auteur ? ` · ${u.auteur}` : ''}`}
                          href={`/prof/scriptorium?vue=livres&unite=${u.id}`}
                          couleur="vert"
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {planEvalActif && (
                <div className="space-y-2">
                  <p className="text-xs text-muet uppercase tracking-wide">Plan d’évaluation</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Tuile
                      nom="Plan d’évaluation de la classe"
                      sousTitre="Voir et ajuster"
                      href={`/prof/scriptorium?vue=evaluations&classe=${classeSel}`}
                    />
                  </div>
                </div>
              )}

              {/* ── Synthèses du Scriptorium élève (RAG L7, §10.3) ─────────── */}
              {(ragActif || synthesesRag.length > 0) && (
                <div className="space-y-2">
                  <p className="text-xs text-muet uppercase tracking-wide">Synthèses du Scriptorium élève</p>
                  {synthesesRag.length === 0 ? (
                    <p className="text-sm text-muet">Aucune synthèse encore — le cron du lundi les génère (ou lance la semaine écoulée ci-dessous).</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-wrap">
                      {synthesesRag.map(sy => (
                        <Link
                          key={sy.id}
                          href={`/prof/scriptorium?vue=classes&classe=${classeSel}&synthese=${sy.id}`}
                          className={`text-xs px-2 py-1 rounded border ${syntheseDetail?.id === sy.id ? 'border-pigment/60 bg-pigment-teinte/40 text-encre' : 'border-bordure text-encre-douce hover:bg-parchemin-fonce'}`}
                        >
                          Semaine du {sy.semaineLundi.split('-').reverse().join('/')}
                          {' · '}
                          {sy.statut === 'READY' ? (sy.vueAt ? 'lue' : 'prête') : sy.statut === 'VIDE' ? 'vide' : sy.statut === 'ERROR' ? 'échec' : 'en cours'}
                        </Link>
                      ))}
                    </div>
                  )}
                  {syntheseDetail && (
                    <div className="border border-bordure rounded-lg p-3 space-y-3 bg-parchemin-fonce/40">
                      <p className="text-sm font-medium text-encre">
                        Semaine du {syntheseDetail.semaineLundi.split('-').reverse().join('/')}
                        {syntheseDetail.contenu && (
                          <span className="font-normal text-muet">
                            {' — '}{syntheseDetail.contenu.stats.nbUtilisateurs}/{syntheseDetail.contenu.stats.effectif} élèves ·{' '}
                            {syntheseDetail.contenu.stats.nbMessages} messages · {syntheseDetail.contenu.stats.nbConversations} conversations
                          </span>
                        )}
                      </p>
                      {syntheseDetail.statut === 'VIDE' && (
                        <p className="text-sm text-muet">Aucune activité cette semaine-là.</p>
                      )}
                      {syntheseDetail.statut === 'ERROR' && (
                        <p className="text-sm text-retard">La génération a échoué — relance-la ci-dessous.</p>
                      )}
                      {syntheseDetail.statut === 'READY' && syntheseDetail.contenu && (
                        <>
                          {syntheseDetail.contenu.themes.length > 0 && (
                            <div className="space-y-1.5">
                              {syntheseDetail.contenu.themes.map((t, i) => (
                                <div key={i} className="text-sm">
                                  <p className="text-encre">
                                    <b>{t.theme}</b>{' '}
                                    <span className="text-muet">· {t.nb_eleves} élève{t.nb_eleves > 1 ? 's' : ''}</span>
                                  </p>
                                  {t.exemples.length > 0 && (
                                    <p className="text-xs text-encre-douce italic">« {t.exemples.join(' » · « ')} »</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {syntheseDetail.contenu.petits_malins.length > 0 && (
                            <div className="rounded-lg bg-attention-teinte border border-attention/30 px-3 py-2 space-y-1">
                              <p className="text-xs font-medium text-attention uppercase tracking-wide">Petits malins</p>
                              {syntheseDetail.contenu.petits_malins.map((pm, i) => (
                                <p key={i} className="text-sm text-encre">
                                  <b>{pm.eleve}</b> <span className="text-muet">({pm.type})</span>
                                  {pm.exemple && <span className="text-encre-douce"> — « {pm.exemple} »</span>}
                                </p>
                              ))}
                            </div>
                          )}
                          {syntheseDetail.contenu.observation && (
                            <p className="text-sm text-encre-douce italic">{syntheseDetail.contenu.observation}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {ragActif && <BoutonRegenererSynthese classeId={classeSel} />}
                </div>
              )}

              {parcoursDeClasse.length === 0 && (livresParClasse.get(classeSel) ?? []).length === 0 && (
                <p className="text-sm text-muet">Cette classe n’a ni parcours ni livre assigné. Assigne un parcours depuis l’onglet « Parcours », ou un livre depuis « Ressources ».</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Perspective « Livres » (Aletheia) — liste + détail (vue-livre 3 colonnes) ──
          Un livre ouvert (?vue=livres&unite=…) devient une page à part entière ;
          « ← Tous les livres » y ramène. VueLivre inchangée (ancrage IA, hors-élève). */}
      {vue === 'livres' && (
        uniteSelLivre ? (
          <VueLivre
            livre={uniteSelLivre}
            classes={classesList}
            classeIds={classesParUnite.get(uniteSelLivre.id) ?? []}
            docs={docsAffiches
              .filter(d => d.semaine != null)
              .sort((a, b) => ((a.semaine as number) - (b.semaine as number)) || a.id.localeCompare(b.id))
              .map(d => ({ id: d.id, semaine: d.semaine as number, titre: d.titre, chapitres: d.chapitres, texte: d.texte_extrait }))}
            nbDocsSansSemaine={docsAffiches.filter(d => d.semaine == null).length}
            capstone={capstoneLivre}
            reference={referenceLivre}
            gabarit={gabaritLivre}
            semaineParam={semaine}
            modeDecoupe={edition === 'decoupe'}
            conflitClasses={conflitClasses}
          />
        ) : (
          <div className="space-y-4">
            <Link href="/prof/scriptorium?vue=ressources" className="inline-block text-sm text-muet hover:text-encre">← Ressources</Link>
            <FormulaireLivre classes={classesList} />
            {unitesList.filter(u => u.type === 'livre').length === 0 ? (
              <p className="text-sm text-muet">Aucun livre. Crée-en un ci-dessus (+ Ajouter un livre).</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {unitesList.filter(u => u.type === 'livre').map(u => {
                  const usage = usageLivres.get(u.id) ?? 0
                  const nb = u.nb_semaines ?? docs.filter(d => d.unite_id === u.id).length
                  return (
                    <Tuile
                      key={u.id}
                      nom={u.label}
                      sousTitre={`📖 ${nb} séance${nb > 1 ? 's' : ''}${u.auteur ? ` · ${u.auteur}` : ''}${usage > 0 ? ` · utilisé dans ${usage} parcours` : ''}`}
                      href={`/prof/scriptorium?vue=livres&unite=${u.id}`}
                      couleur={usage > 0 ? 'vert' : 'neutre'}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* ── Perspective « paramètres » (prompts carte d'architecture + référence) ── */}
      {vue === 'parametres' && <SectionParametresScriptorium />}

      {/* ── Plan d'une classe (option 4e, GATÉ). ?vue=evaluations SANS classe est
             redirigé vers l'accueil → ici classeSel est toujours présent. ─────── */}
      {planEvalActif && estEvaluations && classeSel && (
        planDetail ? (
          /* GrillePlan (option 4e) porte son propre retour « ← Toutes les classes » en tête du contenu. */
          <GrillePlan plan={planDetail} panoptique={panoptique} />
        ) : (
          <div className="space-y-3">
            <Link href="/prof/scriptorium?vue=parcours" className="inline-block text-sm text-muet hover:text-encre">← Parcours &amp; plans</Link>
            {/* Sans plan : la panoptique s'affiche en lecture seule (§7). Un plan naît
                UNIQUEMENT par assignation d'un modèle (§4.5 « coupe propre »). */}
            {panoptique && (panoptique.semaines.length > 0 || panoptique.horsFrise.length > 0) && (
              <div className="space-y-2">
                <SemainesReadonly semaines={[...panoptique.semaines, ...panoptique.horsFrise]} />
              </div>
            )}
            <div className="bg-surface border border-bordure rounded-xl p-4 text-sm text-muet">
              {classeNom.get(classeSel) ?? 'Cette classe'} n’a pas encore de plan d’évaluation.{' '}
              Crée un <Link href="/prof/scriptorium?vue=modeles" className="text-pigment hover:underline">modèle de plan</Link>{' '}
              puis assigne-le à cette classe.
            </div>
          </div>
        )
      )}

      {/* ── Modèles de plan — création & authoring 3d (class-agnostiques, GATÉ) ── */}
      {planEvalActif && estModeles && (
        modeleSel ? (
          modeleDetail ? (
            <div className="space-y-3">
              <Link href="/prof/scriptorium?vue=parcours" className="inline-block text-sm text-muet hover:text-encre">← Parcours &amp; plans</Link>
              <GrilleModele modele={modeleDetail} assignation={assignModele} />
            </div>
          ) : (
            <p className="text-sm text-muet">Modèle introuvable. <Link href="/prof/scriptorium?vue=modeles" className="underline">Créer un modèle</Link>.</p>
          )
        ) : (
          <div className="space-y-3">
            <Link href="/prof/scriptorium?vue=parcours" className="inline-block text-sm text-muet hover:text-encre">← Parcours &amp; plans</Link>
            <FormulaireCreerModele defautDate={defautDateModele} />
          </div>
        )
      )}
    </div>
  )
}
