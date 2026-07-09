// Résolution SERVEUR de la frise pour une date de début : charge les semestres
// (de l'année scolaire de la date) + leurs vacances depuis les tables calendrier
// (semesters / holidays), applique la frise pure `utils/frise-enseignement.ts`,
// et renvoie l'aperçu semaine→date réelle du parcours. Voir SPEC §5 / §7.4.
import { createClient } from '@/utils/supabase/server'
import {
  anneeScolaireDe,
  friseEnseignementContinue,
  resoudreAncre,
  mapperParcours,
  type SemestreFrise,
} from '@/utils/frise-enseignement'
import type { Holiday } from '@/types/calendrier'

export interface ApercuSemaine {
  semaine: number // numéro de semaine DU PARCOURS (1..nb)
  dateReelle: string | null // lundi YYYY-MM-DD, null si non résolue
  statut: 'definie' | 'a_definir' | 'non_planifiable'
  semestreNom: string | null
  pedaDansSemestre: number | null // n° d'affichage « S1 · sem. 3 »
}

export interface ApercuFrise {
  semaines: ApercuSemaine[]
  snap: { dateSaisie: string; dateRamenee: string; enVacances: boolean } | null
  avis?: string
  avisBloquant?: boolean
  nbNonPlanifiable: number
  nbADefinir: number
}

// Charge les semestres de l'AY de `dateDebut` + leurs vacances, construit la frise.
async function construireFrise(dateDebut: string) {
  const supabase = await createClient()
  const y = anneeScolaireDe(dateDebut)
  const debutAY = `${y}-08-01`
  const finAY = `${y + 1}-07-31`

  const { data: sems } = await supabase
    .from('semesters')
    .select('id, name, start_date, end_date, archived_at')
    .is('archived_at', null)
    .gte('start_date', debutAY)
    .lte('start_date', finAY)
    .order('start_date', { ascending: true })
  const semestres = (sems ?? []) as SemestreFrise[]

  const holidaysParSemestre = new Map<string, Holiday[]>()
  if (semestres.length) {
    const { data: hols } = await supabase
      .from('holidays')
      .select('id, semester_id, label, start_date, end_date, created_at')
      .in('semester_id', semestres.map(s => s.id))
    for (const h of (hols ?? []) as Holiday[]) {
      const arr = holidaysParSemestre.get(h.semester_id) ?? []
      arr.push(h)
      holidaysParSemestre.set(h.semester_id, arr)
    }
  }
  return friseEnseignementContinue(semestres, holidaysParSemestre)
}

// Aperçu complet : semaine du parcours → date réelle + statut, snap, avis/blocage.
export async function resoudreFrisePourDate(dateDebut: string, nbSemaines: number): Promise<ApercuFrise> {
  const friseResult = await construireFrise(dateDebut)
  const { ancreIdx, avis: avisAncre } = resoudreAncre(friseResult, dateDebut)
  const map = mapperParcours(friseResult, ancreIdx, nbSemaines)

  const semaines: ApercuSemaine[] = map.map(c =>
    c.statut === 'resolue'
      ? { semaine: c.k, dateReelle: c.dateDebutLundi, statut: 'definie', semestreNom: c.semestreNom, pedaDansSemestre: c.pedagogicalNumber }
      : { semaine: c.k, dateReelle: null, statut: c.statut, semestreNom: null, pedaDansSemestre: null },
  )

  // Snap : la date a-t-elle été ramenée EN AVANT à sa semaine d'enseignement
  // (elle tombait en vacances / dans un gap / avant la 1re semaine) ?
  let snap: ApercuFrise['snap'] = null
  if (ancreIdx != null) {
    const ancre = friseResult.frise.find(w => w.indexContinu === ancreIdx)
    if (ancre && dateDebut < ancre.dateDebutLundi) {
      snap = { dateSaisie: dateDebut, dateRamenee: ancre.dateDebutLundi, enVacances: true }
    }
  }

  return {
    semaines,
    snap,
    // Motif d'ancre (date hors frise) prioritaire sur un avis non bloquant de
    // frise (troncature/gap) — c'est lui qui explique un éventuel blocage.
    avis: avisAncre ?? friseResult.avis,
    avisBloquant: friseResult.avisBloquant,
    nbNonPlanifiable: semaines.filter(s => s.statut === 'non_planifiable').length,
    nbADefinir: semaines.filter(s => s.statut === 'a_definir').length,
  }
}

export interface LigneAssignation {
  classeId: string
  nom: string
  assigned: boolean
  dateDebut: string | null
  apercu: ApercuFrise | null // null si assigné sans date
}

// Pour chaque classe active : est-elle assignée à ce parcours, à quelle date, et
// l'aperçu résolu de cette date. (Une lecture frise par classe datée — quelques
// classes → coût négligeable ; à mutualiser par AY si le besoin d'échelle apparaît.)
export async function chargerAssignationsAvecApercu(
  parcoursId: string,
  nbSemaines: number,
  classes: { id: string; nom: string }[],
): Promise<LigneAssignation[]> {
  const supabase = await createClient()
  const { data: liens } = await supabase
    .from('scriptorium_parcours_classes')
    .select('classe_id, date_debut')
    .eq('parcours_id', parcoursId)
  const parClasse = new Map<string, string | null>()
  for (const l of liens ?? []) parClasse.set(l.classe_id as string, (l.date_debut as string | null) ?? null)

  return Promise.all(classes.map(async c => {
    const assigned = parClasse.has(c.id)
    const dateDebut = assigned ? (parClasse.get(c.id) ?? null) : null
    const apercu = dateDebut ? await resoudreFrisePourDate(dateDebut, nbSemaines) : null
    return { classeId: c.id, nom: c.nom, assigned, dateDebut, apercu }
  }))
}
