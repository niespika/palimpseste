// ============================================================================
// C4 · L2 — CE QUE LES TROIS ÉCRANS DU PILOTAGE CHARGENT.
// ----------------------------------------------------------------------------
// Aucune règle ici : tout se calcule dans `utils/routeur/`, que `npm test`
// éprouve. Ce fichier ASSEMBLE — il lit, il appelle, il rend de quoi afficher.
//
// « Une lecture ratée n'est pas une base vide » : les incidents remontent, ils
// ne se taisent pas (patron de `utils/fabrique/lecture.ts`).
// ============================================================================

import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import { calculerGrilleSemaines } from '@/utils/calendrier-grille'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { jourDansFuseau } from '@/utils/fuseau'
import {
  lireLesInscriptions, lireLeProfil, lireLAssiduite, lireLesSeuils, lireLesInterrupteurs,
  type LigneAssiduite,
} from '@/utils/routeur/donnees'
import { budgetDeLEleve, type BudgetDeLEleve } from '@/utils/routeur/budget'
import { decouperEnSegments, type DecoupeEnSegments } from '@/utils/routeur/segments'
import {
  assiduiteDeLEleve, inactiviteDeLaClasse, vueFine, type SeuilsAssiduite,
  type AssiduiteEleve, type SemaineEleve,
} from '@/utils/routeur/assiduite'

type Admin = ReturnType<typeof createAdminClient>

export interface EleveDuPilotage {
  id: string
  nom: string
  classes: string[]
  budget: BudgetDeLEleve
  preferenceRecueillieAt: string | null
  assiduite: AssiduiteEleve | null
}

export interface ChargeBudgets {
  eleves: EleveDuPilotage[]
  /** `07-` §1.3 — « et le professeur en est averti ». */
  nonServis: number
  incidents: string[]
  routeurActif: boolean
  interrupteurs: Record<string, boolean>
  /** `01-` §5 — le contenu de la préférence n'est écrit NULLE PART. */
  preferenceSansContenu: true
}

/** Le lundi du cycle qui contient un jour donné. Les dates pures se comparent lexicalement. */
export function lundiDe(jour: string): string {
  const d = new Date(`${jour}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}

async function elevesEtClasses(admin: Admin) {
  const { data, error } = await admin
    .from('profiles').select('id, display_name').eq('role', 'eleve').order('display_name')
  return { eleves: (data ?? []) as Array<{ id: string; display_name: string }>,
    incident: error ? `élèves : ${error.message}` : null }
}

/** L'écran 1 — LES BUDGETS PAR ÉLÈVE (§4, couche 0). */
export async function chargerBudgets(admin: Admin): Promise<ChargeBudgets> {
  const incidents: string[] = []
  const { eleves, incident } = await elevesEtClasses(admin)
  if (incident) incidents.push(incident)
  const [{ routeur_actif: routeurActif, ...reste }, seuils] = await Promise.all([
    lireLesInterrupteurs(admin).then((i) => ({ ...i })),
    lireLesSeuils(admin),
  ])

  const lignes = await lireLAssiduite(admin, eleves.map((e) => e.id)).catch((e) => {
    incidents.push(`assiduité : ${(e as Error).message}`); return [] as LigneAssiduite[]
  })
  const parEleve = new Map<string, LigneAssiduite[]>()
  for (const l of lignes) parEleve.set(l.eleveId, [...(parEleve.get(l.eleveId) ?? []), l])

  const out: EleveDuPilotage[] = []
  for (const e of eleves) {
    try {
      const inscriptions = await lireLesInscriptions(admin, e.id)
      const profil = await lireLeProfil(admin, e.id)
      const budget = budgetDeLEleve(inscriptions, profil.reglage)
      const semaines: SemaineEleve[] = (parEleve.get(e.id) ?? []).map((l) => ({
        cycleLundi: l.cycleLundi, exercicesAssignes: l.exercicesAssignes,
        exercicesTermines: l.exercicesTermines, enVacances: false }))
      out.push({
        id: e.id, nom: e.display_name,
        classes: inscriptions.map((i) => i.classeNom),
        budget,
        preferenceRecueillieAt: profil.preferenceRecueillieAt,
        assiduite: semaines.length ? assiduiteDeLEleve(semaines, seuils.seuils) : null,
      })
    } catch (err) {
      incidents.push(`${e.display_name} : ${(err as Error).message}`)
    }
  }

  return {
    eleves: out,
    nonServis: out.filter((e) => e.budget.budget === null).length,
    incidents,
    routeurActif: !!routeurActif,
    interrupteurs: { routeur_actif: !!routeurActif, ...reste },
    preferenceSansContenu: true,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// L'écran 2 — L'ASSIGNATION, EN LECTURE SEULE
// ════════════════════════════════════════════════════════════════════════════

export interface DepotAssigne {
  id: string
  eleveId: string
  eleveNom: string
  exerciceId: string
  origine: string
  statut: string
  assigneAt: string
  echeance: string | null
  cibleRetenue: string | null
  regleDeclenchee: string | null
  sondes: Array<{ competence?: string; motif?: string; sonde_montee?: boolean }>
  degrade: boolean
  /** Le retrait reste permis TANT QUE le dépôt n'est pas `clos` (`07-` §1.1). */
  retirable: boolean
}

export interface ChargeAssignation {
  cycleLundi: string
  depots: DepotAssigne[]
  incidents: string[]
  routeurActif: boolean
}

/**
 * `07-` §1.2 — « le professeur NE VALIDE RIEN AU FIL DE L'EAU : il VOIT ce que le
 * routeur a assigné, EN LECTURE SEULE ». Le seul geste est l'OVERRIDE — retirer
 * ou imposer —, et « TOUT OVERRIDE SE JOURNALISE dans `routeur_decisions` ».
 */
export async function chargerAssignation(
  admin: Admin, cycleLundi?: string,
): Promise<ChargeAssignation> {
  const incidents: string[] = []
  const tz = await lireFuseau()
  const lundi = cycleLundi ?? lundiDe(jourDansFuseau(new Date(), tz))
  const { routeur_actif: routeurActif } = await lireLesInterrupteurs(admin)

  const { data, error } = await admin
    .from('exercices_depots')
    .select('id, eleve_id, exercice_id, origine, statut, assigne_at, echeance, routeur_decision_id')
    .gte('assigne_at', `${lundi}T00:00:00Z`)
    .lt('assigne_at', `${lundiSuivant(lundi)}T00:00:00Z`)
    .order('assigne_at', { ascending: true })
  if (error) incidents.push(`dépôts : ${error.message}`)
  const lignes = (data ?? []) as Array<{
    id: string; eleve_id: string; exercice_id: string; origine: string; statut: string
    assigne_at: string; echeance: string | null; routeur_decision_id: string | null }>

  const eleveIds = [...new Set(lignes.map((l) => l.eleve_id))]
  const noms = new Map<string, string>()
  if (eleveIds.length) {
    const { data: p } = await admin.from('profiles').select('id, display_name').in('id', eleveIds)
    for (const x of (p ?? []) as Array<{ id: string; display_name: string }>) {
      noms.set(x.id, x.display_name)
    }
  }

  const decisionIds = lignes.map((l) => l.routeur_decision_id).filter((x): x is string => !!x)
  const decisions = new Map<string, { cible_retenue: string | null; regle_declenchee: string | null
    sondes_retenues: unknown; degrade: boolean }>()
  if (decisionIds.length) {
    const { data: d, error: eD } = await admin
      .from('routeur_decisions')
      .select('id, cible_retenue, regle_declenchee, sondes_retenues, degrade')
      .in('id', decisionIds)
    if (eD) incidents.push(`décisions : ${eD.message}`)
    type LigneDecision = { id: string; cible_retenue: string | null
      regle_declenchee: string | null; sondes_retenues: unknown; degrade: boolean }
    for (const x of (d ?? []) as unknown as LigneDecision[]) {
      decisions.set(x.id, x)
    }
  }

  return {
    cycleLundi: lundi,
    routeurActif: !!routeurActif,
    incidents,
    depots: lignes.map((l) => {
      const dec = l.routeur_decision_id ? decisions.get(l.routeur_decision_id) : undefined
      const brutes = dec?.sondes_retenues
      return {
        id: l.id, eleveId: l.eleve_id, eleveNom: noms.get(l.eleve_id) ?? '(élève inconnu)',
        exerciceId: l.exercice_id, origine: l.origine, statut: l.statut,
        assigneAt: l.assigne_at, echeance: l.echeance,
        cibleRetenue: dec?.cible_retenue ?? null,
        regleDeclenchee: dec?.regle_declenchee ?? null,
        sondes: Array.isArray(brutes) ? brutes as DepotAssigne['sondes'] : [],
        degrade: !!dec?.degrade,
        // « Le retrait reste permis TANT QUE LE DÉPÔT N'EST PAS `clos` » (07- §1.1).
        retirable: l.statut !== 'clos' && l.statut !== 'retire',
      }
    }),
  }
}

function lundiSuivant(lundi: string): string {
  const d = new Date(`${lundi}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString().slice(0, 10)
}

// ════════════════════════════════════════════════════════════════════════════
// L'écran 3 — L'ASSIDUITÉ
// ════════════════════════════════════════════════════════════════════════════

export interface ChargeAssiduite {
  seuils: SeuilsAssiduite
  seuilsParDefaut: boolean
  classes: Array<{
    id: string; nom: string
    semaines: Array<{ cycleLundi: string; vert: number; orange: number; rouge: number
      eleves: number; tauxInactivite: number | null; contratRempli: boolean
      avertissement: string | null }>
    tableau: Array<{ eleveId: string; nom: string; completion: number | null
      assignes: number; termines: number; bande: 'vert' | 'orange' | 'rouge' }>
    /** La semaine que le tableau détaille. */
    semaineAffichee: string | null
  }>
  /** `06-` §5 — « les compteurs démarrent à la rentrée ; LES ÉCRANS PEUVENT ATTENDRE ». */
  collecteVide: boolean
  incidents: string[]
}

export async function chargerAssiduite(
  admin: Admin, semaineDemandee?: string,
): Promise<ChargeAssiduite> {
  const incidents: string[] = []
  const { seuils, parDefaut } = await lireLesSeuils(admin)

  const { data: classesBrutes, error: eC } = await admin
    .from('classes').select('id, nom').eq('statut', 'active').order('nom')
  if (eC) incidents.push(`classes : ${eC.message}`)
  const classes = (classesBrutes ?? []) as Array<{ id: string; nom: string }>

  const { data: inscr } = await admin
    .from('inscriptions').select('eleve_id, classe_id').eq('statut', 'active')
  const parClasse = new Map<string, string[]>()
  for (const i of (inscr ?? []) as Array<{ eleve_id: string; classe_id: string }>) {
    parClasse.set(i.classe_id, [...(parClasse.get(i.classe_id) ?? []), i.eleve_id])
  }

  const tousIds = [...new Set([...parClasse.values()].flat())]
  const noms = new Map<string, string>()
  if (tousIds.length) {
    const { data: p } = await admin.from('profiles').select('id, display_name').in('id', tousIds)
    for (const x of (p ?? []) as Array<{ id: string; display_name: string }>) {
      noms.set(x.id, x.display_name)
    }
  }

  let lignes: LigneAssiduite[] = []
  try { lignes = await lireLAssiduite(admin, tousIds) } catch (e) {
    incidents.push(`assiduité : ${(e as Error).message}`)
  }

  const out: ChargeAssiduite['classes'] = []
  for (const c of classes) {
    const ids = parClasse.get(c.id) ?? []
    const siennes = lignes.filter((l) => ids.includes(l.eleveId))
    const lundis = [...new Set(siennes.map((l) => l.cycleLundi))].sort()
    const parSemaine = lundis.map((cycleLundi) => ({
      cycleLundi,
      eleves: ids.map((id) => {
        const l = siennes.find((x) => x.eleveId === id && x.cycleLundi === cycleLundi)
        return { eleveId: id, nom: noms.get(id) ?? '—',
          assignes: l?.exercicesAssignes ?? 0, termines: l?.exercicesTermines ?? 0 }
      }),
    }))
    const { frise, tableau } = vueFine(parSemaine, seuils)
    const semaineAffichee = semaineDemandee && lundis.includes(semaineDemandee)
      ? semaineDemandee : (lundis[lundis.length - 1] ?? null)

    out.push({
      id: c.id, nom: c.nom, semaineAffichee,
      semaines: frise.map((f) => {
        const etats: SemaineEleve[] = (parSemaine.find((s) => s.cycleLundi === f.cycleLundi)?.eleves
          ?? []).map((e) => ({ cycleLundi: f.cycleLundi, exercicesAssignes: e.assignes,
          exercicesTermines: e.termines, enVacances: false }))
        const i = inactiviteDeLaClasse(etats, seuils, c.nom)
        return { ...f, tauxInactivite: i.tauxInactivite, contratRempli: i.contratRempli,
          avertissement: i.avertissement }
      }),
      tableau: semaineAffichee ? (tableau.get(semaineAffichee) ?? []) : [],
    })
  }

  return { seuils, seuilsParDefaut: parDefaut, classes: out,
    collecteVide: lignes.length === 0, incidents }
}

// ════════════════════════════════════════════════════════════════════════════
// L'écran 4 — LES CINQ SEGMENTS, au plan d'évaluation
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §4, couche 1 — « les cinq segments SE CALCULENT À LA CONCEPTION D'UN PLAN
 * D'ÉVALUATION, ET ILS S'Y AFFICHENT : c'est là que le professeur voit ce que son
 * calendrier produit ».
 *
 * On lit les semaines D'ENSEIGNEMENT du Calendrier — vacances déjà sautées — et
 * on ne calcule rien d'autre : `decouperEnSegments` fait le reste, et signale
 * seul un calendrier trop court.
 */
export async function chargerLesSegments(
  admin: Admin, dateDebut?: string,
): Promise<DecoupeEnSegments & { incidents: string[] }> {
  const incidents: string[] = []
  const { data: semestres, error } = await admin
    .from('semesters').select('id, name, start_date, end_date')
    .is('archived_at', null).order('start_date')
  if (error) incidents.push(`semestres : ${error.message}`)

  const { data: vacances } = await admin
    .from('holidays').select('semester_id, label, start_date, end_date')

  const semaines: Array<{ dateDebutLundi: string; dateFinDimanche: string }> = []
  for (const s of (semestres ?? []) as Array<{ id: string; start_date: string; end_date: string }>) {
    const h = ((vacances ?? []) as Array<{ semester_id: string; label: string
      start_date: string; end_date: string }>)
      .filter((v) => v.semester_id === s.id)
      .map((v) => ({ label: v.label, start_date: v.start_date, end_date: v.end_date }))
    for (const w of calculerGrilleSemaines(s, h)) {
      if (w.isVacation) continue
      if (dateDebut && w.start < dateDebut) continue
      semaines.push({ dateDebutLundi: w.start, dateFinDimanche: w.end })
    }
  }

  return { ...decouperEnSegments(semaines), incidents }
}
