import 'server-only'
// Loader de la VUE PANOPTIQUE (§7) : pour UNE classe, semaine par semaine, tout ce qui
// pèse sur l'élève — enseignements (parcours), exercices du plan + synthèses, lectures de
// livre (mode b), reflets essais/fragments, budget temps. « Le détail du plan EST la
// panoptique » : ce loader ENRICHIT la grille du plan des bandes en lecture seule, et
// s'affiche même SANS plan (bandes + invite « Créer le plan annuel »).
//
// Client `admin` : les tables parcours/plan sont en RLS prof-only (surface prof-only,
// gatée). Gate OFF → null (aucune panoptique, byte-identique). Coût borné même à ~40
// semaines : les synthèses sont résolues EN LOT (resoudreDatesSyntheses, 6a) et la couche
// enseignements mémoïse son aperçu par parcours (socle de frise par AY). Réserve perf
// connue, sans effet sur l'exactitude : la couche lectures (resoudreDatesLivre par livre)
// et la couche synthèses n'ont pas de socle PARTAGÉ — chacune recharge semesters/holidays
// (tables minuscules). Optimisation différée : threader un unique memoSocleFrise partout.

import { createAdminClient } from '@/utils/supabase/admin'
import { lundiOnOrBefore, toISODate, addDaysUTC } from '@/utils/calendrier-grille'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { lireGatePlanActif } from '@/utils/plan-exercices'
import {
  budgetSemaine, dateEffectiveSemaine, asPlanConfig,
  type Budget, type Gabarit, type TypeExercice, type PlanConfig,
} from '@/utils/plan-cadence'
import { semainesCouvertes, defautDateDebut } from './plan-serveur'
import {
  construireApercuAssign, memoSocleFrise,
  type AssignParcours, type ApercuSemaine,
} from '@/utils/parcours-apercu'
import { resoudreDatesSyntheses, type DemandeSynthese } from '@/utils/plan-synthese'
import { pairesLivresGouvernes, resoudreDatesLivre, seancesDocs } from '@/utils/aletheia-dates'

// ── Types exposés (consommés par l'UI 6d) ─────────────────────────────────────

export interface EnseignementLigne {
  parcoursTitre: string
  ref: 'cours' | 'texte' | 'livre'
  titre: string
  tranche: { debut: number | null; fin: number | null } | null // livre uniquement
}
export interface ExercicePanoptique {
  id: string
  type: string
  diagnostique: boolean
  nature: 'formatif' | 'evaluatif'
  lieu: 'classe' | 'maison'
  dateEffective: string
  source: 'plan' | 'synthese_parcours'
  // en_retard / a_recaler DÉRIVÉS ici ; 'realise' (objet lancé) différé (le calendrier
  // l'expose déjà en rétrospectif) → l'UI 6d le traitera comme 'concu' d'ici là.
  etat: 'a_concevoir' | 'en_retard' | 'concu' | 'realise' | 'a_recaler'
}
export interface LecturePanoptique {
  livreTitre: string
  seances: number[]
  echeance: string
  ambigu: boolean
}
export interface EssaiPanoptique { titre: string; date: string }
export interface SemainePanoptique {
  lundi: string
  dimanche: string
  semestreNom: string | null
  pedaDansSemestre: number | null
  enseignements: EnseignementLigne[]
  exercices: ExercicePanoptique[]
  lectures: LecturePanoptique[]
  essais: EssaiPanoptique[]
  fragmentAttendu: boolean
  budget: Budget
  estVacances: boolean // ligne HORS frise (vacances / au-delà des semestres) portant du travail
}
export interface Panoptique {
  classeId: string
  classeNom: string
  plan: { id: string; gabarit: Gabarit; statut: 'brouillon' | 'valide'; anneeScolaire: number } | null
  compterFragments: 'hebdo' | 'quinzaine' | 'non' // réglage budget (§7.3), défaut 'hebdo'
  semaines: SemainePanoptique[]
  horsFrise: SemainePanoptique[]
  aRecaler: ExercicePanoptique[] // exercices dont la semaine_lundi ne matche plus la frise (J2)
  avis?: string
  avisBloquant: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function aujourdhui(): Promise<string> {
  return jourDansFuseau(new Date().toISOString(), await lireFuseau())
}

// Assignations ACTIVES d'une classe (parcours vivant) + snapshot horaire, tolérant si la
// colonne snapshot n'existe pas (migration non jouée). Renvoie de quoi construire l'aperçu.
async function chargerParcoursActifsDeClasse(
  admin: ReturnType<typeof createAdminClient>, classeId: string,
): Promise<Array<{ parcoursId: string; titre: string; assign: AssignParcours }>> {
  let liens: Record<string, unknown>[] = []
  const withSnap = await admin.from('scriptorium_parcours_classes')
    .select('parcours_id, date_debut, horaire_snapshot').eq('classe_id', classeId).eq('statut', 'active')
  if (withSnap.error) {
    const noSnap = await admin.from('scriptorium_parcours_classes')
      .select('parcours_id, date_debut').eq('classe_id', classeId).eq('statut', 'active')
    liens = (noSnap.data as Record<string, unknown>[] | null) ?? []
  } else {
    liens = (withSnap.data as Record<string, unknown>[] | null) ?? []
  }
  if (liens.length === 0) return []
  const parcoursIds = [...new Set(liens.map((l) => l.parcours_id as string))]
  const { data: parcs } = await admin.from('scriptorium_parcours')
    .select('id, titre, nb_semaines, supprime_at').in('id', parcoursIds)
  const meta = new Map((parcs ?? [])
    .filter((p) => (p.supprime_at as string | null) == null)
    .map((p) => [p.id as string, { titre: p.titre as string, nbSemaines: (p.nb_semaines as number) ?? 0 }]))
  const out: Array<{ parcoursId: string; titre: string; assign: AssignParcours }> = []
  for (const l of liens) {
    const pid = l.parcours_id as string
    const m = meta.get(pid)
    if (!m) continue // parcours soft-deleté
    const snap = l.horaire_snapshot as ApercuSemaine[] | null | undefined
    out.push({
      parcoursId: pid, titre: m.titre,
      assign: {
        parcoursId: pid, nbSemaines: m.nbSemaines,
        dateDebut: (l.date_debut as string | null) ?? null,
        snapshot: snap && Array.isArray(snap) && snap.length ? snap : null,
      },
    })
  }
  return out
}

// ── Loader principal ──────────────────────────────────────────────────────────

/**
 * Panoptique d'une classe. `null` si gate OFF (aucune panoptique — byte-identique) ou
 * classe introuvable. Le plan est FACULTATIF : sans plan, on affiche quand même les
 * bandes enseignements/lectures/reflets (l'UI propose « Créer le plan annuel »).
 */
export async function chargerPanoptiqueDeClasse(classeId: string): Promise<Panoptique | null> {
  const admin = createAdminClient()
  if (!(await lireGatePlanActif(admin))) return null

  const { data: cls } = await admin.from('classes').select('nom').eq('id', classeId).maybeSingle()
  if (!cls) return null
  const classeNom = (cls.nom as string) ?? 'Classe'

  // Plan le plus récent vivant (brouillon inclus — la panoptique montre aussi les
  // brouillons, contrairement aux dérivations qui exigent 'valide').
  const { data: plan } = await admin.from('scriptorium_plans_evaluation')
    .select('id, gabarit, statut, date_debut, annee_scolaire, config')
    .eq('classe_id', classeId).is('supprime_at', null)
    .order('annee_scolaire', { ascending: false }).limit(1).maybeSingle()

  const parcoursActifs = await chargerParcoursActifsDeClasse(admin, classeId)

  // Ancre de la frise : date du plan ; sinon 1re date de parcours de la classe ; sinon
  // défaut (prochain semestre). Sans ancre → aucune semaine (juste l'invite plan).
  const datesParcours = parcoursActifs.map((p) => p.assign.dateDebut).filter((d): d is string => !!d).sort()
  const ancre = (plan?.date_debut as string | null) ?? datesParcours[0] ?? (await defautDateDebut())
  const today = await aujourdhui()
  const gabarit: Gabarit = (plan?.gabarit as Gabarit | undefined) ?? 'vierge'
  const config: PlanConfig = asPlanConfig(plan?.config)

  const couverture = ancre
    ? await semainesCouvertes(ancre)
    : { couvertes: [], frise: [], ay: 0, ancreLundi: null, avisBloquant: false, avis: undefined as string | undefined }

  // Grille de semaines (indexée par lundi) + bornes.
  const semaines = new Map<string, SemainePanoptique>()
  const ordreLundis: string[] = []
  for (const w of couverture.couvertes) {
    ordreLundis.push(w.dateDebutLundi)
    semaines.set(w.dateDebutLundi, {
      lundi: w.dateDebutLundi, dimanche: w.dateFinDimanche,
      semestreNom: w.semestreNom, pedaDansSemestre: w.pedagogicalNumber,
      enseignements: [], exercices: [], lectures: [], essais: [],
      fragmentAttendu: false, budget: budgetSemaine([], 0, false, gabarit), estVacances: false,
    })
  }
  const bornes = couverture.couvertes.map((w) => ({ lundi: w.dateDebutLundi, dimanche: w.dateFinDimanche }))
  // Semaine de frise contenant une date (par ses bornes lundi→dimanche), ou null.
  const lundiDeFrise = (d: string): string | null => {
    for (const b of bornes) if (b.lundi <= d && d <= b.dimanche) return b.lundi
    return null
  }
  // Lignes HORS frise (vacances / au-delà des semestres), créées à la demande, clé = lundi
  // calendaire de la date.
  const horsFrise = new Map<string, SemainePanoptique>()
  const ligneHorsFrise = (d: string): SemainePanoptique => {
    const lundi = toISODate(lundiOnOrBefore(d))
    let s = horsFrise.get(lundi)
    if (!s) {
      s = {
        lundi, dimanche: toISODate(addDaysUTC(lundiOnOrBefore(d), 6)),
        semestreNom: null, pedaDansSemestre: null,
        enseignements: [], exercices: [], lectures: [], essais: [],
        fragmentAttendu: false, budget: budgetSemaine([], 0, false, gabarit), estVacances: true,
      }
      horsFrise.set(lundi, s)
    }
    return s
  }
  // Range une entité datée dans sa semaine (frise sinon hors-frise).
  const semainePour = (d: string): SemainePanoptique => {
    const l = lundiDeFrise(d)
    return l ? semaines.get(l)! : ligneHorsFrise(d)
  }

  const aRecaler: ExercicePanoptique[] = []

  // (1) ENSEIGNEMENTS — créneaux des parcours actifs, résolus sur leur lundi.
  await ajouterEnseignements(admin, parcoursActifs, semainePour)

  // (2) EXERCICES du plan (ancrage 'semaine') + (2bis) SYNTHÈSES (ancrage 'parcours').
  if (plan) {
    await ajouterExercicesPlan(admin, plan.id as string, classeId, today, lundiDeFrise, semaines, semainePour, aRecaler)
  }

  // (3) LECTURES de livre — mode b (échéances des séances gouvernées).
  await ajouterLectures(admin, classeId, semainePour)

  // (4) REFLETS — essais + fragments (échéances hebdomadaires du semestre).
  const fragmentsParLundi = await ajouterReflets(admin, classeId, couverture.ay, config, semaines, semainePour)

  // (5) BUDGET par semaine (frise + hors-frise), à partir de ce qui a été bucketé.
  for (const s of [...semaines.values(), ...horsFrise.values()]) {
    calculerBudget(s, gabarit, fragmentsParLundi.has(s.lundi))
  }

  return {
    classeId, classeNom,
    plan: plan
      ? { id: plan.id as string, gabarit: plan.gabarit as Gabarit, statut: plan.statut as 'brouillon' | 'valide', anneeScolaire: plan.annee_scolaire as number }
      : null,
    compterFragments: config.compterFragments ?? 'hebdo',
    semaines: ordreLundis.map((l) => semaines.get(l)!),
    horsFrise: [...horsFrise.values()].sort((a, b) => a.lundi.localeCompare(b.lundi)),
    aRecaler,
    avis: couverture.avis,
    avisBloquant: couverture.avisBloquant,
  }
}

// ── Couches ───────────────────────────────────────────────────────────────────

// (1) Enseignements : chaque créneau (cours/texte/livre) d'un parcours actif est résolu à
// son lundi via l'aperçu (snapshot prioritaire, repli frise mémoïsée) et bucketé.
async function ajouterEnseignements(
  admin: ReturnType<typeof createAdminClient>,
  parcoursActifs: Array<{ parcoursId: string; titre: string; assign: AssignParcours }>,
  semainePour: (d: string) => SemainePanoptique,
): Promise<void> {
  if (parcoursActifs.length === 0) return
  const parcoursIds = parcoursActifs.map((p) => p.parcoursId)
  const { data: crens } = await admin.from('scriptorium_parcours_creneaux')
    .select('parcours_id, semaine, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin, titre_affiche')
    .in('parcours_id', parcoursIds).order('semaine', { ascending: true }).order('ordre', { ascending: true })
  const creneaux = crens ?? []
  if (creneaux.length === 0) return

  // Titres : contenus (type + titre) et livres (label).
  const contenuIds = [...new Set(creneaux.filter((c) => c.contenu_id).map((c) => c.contenu_id as string))]
  const livreIds = [...new Set(creneaux.filter((c) => c.livre_id).map((c) => c.livre_id as string))]
  const [{ data: conts }, { data: livres }] = await Promise.all([
    contenuIds.length ? admin.from('scriptorium_contenus').select('id, titre, type').in('id', contenuIds) : Promise.resolve({ data: [] }),
    livreIds.length ? admin.from('scriptorium_unites').select('id, label').in('id', livreIds) : Promise.resolve({ data: [] }),
  ])
  const contenu = new Map((conts ?? []).map((c) => [c.id as string, { titre: c.titre as string, type: c.type as 'texte' | 'cours' }]))
  const livre = new Map((livres ?? []).map((l) => [l.id as string, l.label as string]))

  // Aperçu par parcours (mémoïsé : socle de frise partagé, cache par parcours).
  const socleDe = memoSocleFrise(admin)
  const apercuCache = new Map<string, ApercuSemaine[] | null>()
  const apercuDe = async (a: AssignParcours): Promise<ApercuSemaine[] | null> => {
    if (apercuCache.has(a.parcoursId)) return apercuCache.get(a.parcoursId) ?? null
    const res = await construireApercuAssign(admin, a, socleDe)
    const ap = res?.apercu ?? null
    apercuCache.set(a.parcoursId, ap)
    return ap
  }
  const parcoursParId = new Map(parcoursActifs.map((p) => [p.parcoursId, p]))

  for (const c of creneaux) {
    const p = parcoursParId.get(c.parcours_id as string)
    if (!p) continue
    const ap = await apercuDe(p.assign)
    if (!ap) continue // parcours assigné sans date/snapshot → non résoluble
    const e = ap.find((x) => x.semaine === (c.semaine as number))
    if (!e || e.statut !== 'definie' || !e.dateReelle) continue
    const refType = c.ref_type as 'contenu' | 'livre'
    if (refType === 'contenu') {
      const info = c.contenu_id ? contenu.get(c.contenu_id as string) : undefined
      semainePour(e.dateReelle).enseignements.push({
        parcoursTitre: p.titre,
        ref: info?.type === 'texte' ? 'texte' : 'cours',
        titre: info?.titre ?? (c.titre_affiche as string | null) ?? 'contenu retiré',
        tranche: null,
      })
    } else {
      const label = c.livre_id ? livre.get(c.livre_id as string) : undefined
      semainePour(e.dateReelle).enseignements.push({
        parcoursTitre: p.titre, ref: 'livre',
        titre: label ?? (c.titre_affiche as string | null) ?? 'livre retiré',
        tranche: { debut: (c.livre_semaine_debut as number | null) ?? null, fin: (c.livre_semaine_fin as number | null) ?? null },
      })
    }
  }
}

// (2) Exercices du plan (ancrage 'semaine') + synthèses (ancrage 'parcours' → dates
// résolues EN LOT, 6a). Bucketés par lundi ; un exercice hors frise → aRecaler.
async function ajouterExercicesPlan(
  admin: ReturnType<typeof createAdminClient>,
  planId: string, classeId: string, today: string,
  lundiDeFrise: (d: string) => string | null,
  semaines: Map<string, SemainePanoptique>,
  semainePour: (d: string) => SemainePanoptique,
  aRecaler: ExercicePanoptique[],
): Promise<void> {
  const { data: exos } = await admin.from('scriptorium_exercices_planifies')
    .select('id, type_exercice, diagnostique, nature, lieu, statut, ancrage, semaine_lundi, jour_prevu, parcours_id, contenu_id')
    .eq('plan_id', planId).is('supprime_at', null).neq('statut', 'annule')
  const rows = exos ?? []

  // Bras 'parcours' (synthèses) → dates résolues en lot.
  const synthRows = rows.filter((e) => (e.ancrage as string) === 'parcours')
  const datesSynth = synthRows.length
    ? await resoudreDatesSyntheses(admin, synthRows.map((e): DemandeSynthese => ({
        cle: e.id as string, parcoursId: e.parcours_id as string, contenuId: e.contenu_id as string, classeId,
      })))
    : new Map<string, string | null>()

  for (const e of rows) {
    const statut = e.statut as 'a_concevoir' | 'concu'
    let dateEffective: string | null
    let source: 'plan' | 'synthese_parcours'
    if ((e.ancrage as string) === 'parcours') {
      dateEffective = datesSynth.get(e.id as string) ?? null
      source = 'synthese_parcours'
    } else {
      dateEffective = dateEffectiveSemaine(e.semaine_lundi as string, (e.jour_prevu as string | null) ?? null, e.lieu as 'classe' | 'maison')
      source = 'plan'
    }
    if (dateEffective == null) continue // synthèse non datable → ni ligne (S6)

    const enRetard = statut === 'a_concevoir' && dateEffective < today
    const ligne: ExercicePanoptique = {
      id: e.id as string, type: e.type_exercice as string, diagnostique: e.diagnostique as boolean,
      nature: e.nature as 'formatif' | 'evaluatif', lieu: e.lieu as 'classe' | 'maison',
      dateEffective, source,
      etat: enRetard ? 'en_retard' : (statut === 'concu' ? 'concu' : 'a_concevoir'),
    }
    // Le bras 'semaine' est FIGÉ (semaine_lundi) : hors frise → à recaler (J2, bandeau).
    // Le bras 'parcours' (synthèse) se recalcule à chaque lecture → jamais « à recaler » ;
    // il suit la frise et, s'il tombe en vacances/hors semestre, se range en hors-frise.
    if (source === 'synthese_parcours') {
      semainePour(dateEffective).exercices.push(ligne)
      continue
    }
    const l = lundiDeFrise(dateEffective)
    if (l == null) { aRecaler.push({ ...ligne, etat: 'a_recaler' }); continue }
    semaines.get(l)!.exercices.push(ligne)
  }
}

// (3) Lectures mode b : pour chaque livre gouverné de la classe, échéances des séances,
// regroupées par échéance (dimanche) — une tranche large groupe ses séances (LD4).
async function ajouterLectures(
  admin: ReturnType<typeof createAdminClient>, classeId: string,
  semainePour: (d: string) => SemainePanoptique,
): Promise<void> {
  const paires = await pairesLivresGouvernes(admin, [classeId])
  if (paires.length === 0) return
  const livreIds = [...new Set(paires.map((p) => p.livreId))]
  const { data: livres } = await admin.from('scriptorium_unites')
    .select('id, label').eq('type', 'livre').is('supprime_at', null).in('id', livreIds)
  const label = new Map((livres ?? []).map((l) => [l.id as string, l.label as string]))

  for (const { livreId } of paires) {
    const titre = label.get(livreId)
    if (!titre) continue // livre soft-deleté / sans label → skip (patron calendrier)
    const seances = [...await seancesDocs(admin, livreId)].sort((a, b) => a - b)
    if (seances.length === 0) continue
    const { dates } = await resoudreDatesLivre(admin, livreId, classeId, seances)
    // Regroupe les séances qui partagent la même échéance (une tranche groupe ses séances).
    const parEcheance = new Map<string, { seances: number[]; ambigu: boolean }>()
    for (const s of seances) {
      const r = dates.get(s)
      if (!r || !r.valeur) continue
      const g = parEcheance.get(r.valeur) ?? { seances: [], ambigu: false }
      g.seances.push(s)
      g.ambigu = g.ambigu || r.ambigu
      parEcheance.set(r.valeur, g)
    }
    for (const [echeance, g] of parEcheance) {
      semainePour(echeance).lectures.push({ livreTitre: titre, seances: g.seances, echeance, ambigu: g.ambigu })
    }
  }
}

// (4) Reflets : essais (fragments_essais_classes, datés librement par classe) + fragments
// (fragments_semaines, échéancier GLOBAL au semestre, hebdomadaire). Renvoie l'ensemble des
// lundis (calendaires) portant une échéance de fragment ÉCRIT attendue (pour le budget),
// selon config.compterFragments (hebdo/quinzaine/non) et l'accès Fragments de la classe.
async function ajouterReflets(
  admin: ReturnType<typeof createAdminClient>, classeId: string, ay: number, config: PlanConfig,
  semaines: Map<string, SemainePanoptique>,
  semainePour: (d: string) => SemainePanoptique,
): Promise<Set<string>> {
  // Essais de la classe (titre via l'épreuve). date_essai est LIBRE → peut tomber en
  // vacances/hors frise (dispositif estVacances).
  const { data: essais } = await admin.from('fragments_essais_classes')
    .select('date_essai, fragments_essais_epreuves(titre)').eq('classe_id', classeId)
  for (const e of essais ?? []) {
    const date = e.date_essai as string | null
    if (!date) continue
    const emb = e.fragments_essais_epreuves as { titre?: string } | { titre?: string }[] | null
    const titre = (Array.isArray(emb) ? emb[0]?.titre : emb?.titre) ?? 'Essai'
    semainePour(date).essais.push({ titre, date })
  }

  const lundisFragment = new Set<string>()
  const compter = config.compterFragments ?? 'hebdo'
  if (compter === 'non') return lundisFragment

  // La classe a-t-elle le module Fragments ? (échéancier global, mais budgété par classe.)
  const { data: mod } = await admin.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle()
  const moduleId = mod?.id as string | undefined
  if (!moduleId) return lundisFragment
  const { data: acces } = await admin.from('classe_modules')
    .select('module_id').eq('classe_id', classeId).eq('module_id', moduleId).limit(1).maybeSingle()
  if (!acces) return lundisFragment

  // Échéances hebdomadaires des semestres de l'AY (l'échéancier couvre les 2 semestres —
  // le patron élève ne lit QUE l'actif, ce qui perdrait la moitié de l'année ici).
  const { data: sems } = await admin.from('semesters')
    .select('id').is('archived_at', null)
    .gte('start_date', `${ay}-08-01`).lte('start_date', `${ay + 1}-07-31`)
  const semIds = (sems ?? []).map((s) => s.id as string)
  if (semIds.length === 0) return lundisFragment
  const { data: fs } = await admin.from('fragments_semaines')
    .select('numero, date_limite').in('semestre_id', semIds).eq('is_vacation', false).not('date_limite', 'is', null)
  for (const f of fs ?? []) {
    const numero = f.numero as number
    // 'quinzaine' : une échéance sur deux comptée (parité du numéro) — la part Fragments
    // ne sature plus la chip pour le prof qui alterne réellement (§7.3).
    if (compter === 'quinzaine' && numero % 2 === 0) continue
    const date = (f.date_limite as string).slice(0, 10)
    lundisFragment.add(semainePour(date).lundi)
  }
  return lundisFragment
}

// (5) Budget d'une semaine : exercices MAISON du plan + lecture de livre (par échéance
// résolue dans la semaine) + fragment écrit attendu. Pur — juste l'assiette.
function calculerBudget(s: SemainePanoptique, gabarit: Gabarit, fragmentAttendu: boolean): void {
  const exercicesMaison = s.exercices
    .filter((e) => e.lieu === 'maison' && e.etat !== 'a_recaler')
    .map((e) => e.type as TypeExercice)
  s.fragmentAttendu = fragmentAttendu
  s.budget = budgetSemaine(exercicesMaison, s.lectures.length, fragmentAttendu, gabarit)
}
