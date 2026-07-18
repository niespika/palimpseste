import 'server-only'
// Loaders SERVEUR du MODÈLE de plan (class-agnostique, Lot C — client prof, RLS prof-only).
// Un modèle = un gabarit d'année SANS classe : mêmes semaines de la frise globale de l'AY,
// mais des créneaux typés (ni conçus, ni datés au jour). Voir SPEC §4.1/§4.2/§5.1.
import { createClient } from '@/utils/supabase/server'
import { type Gabarit } from '@/utils/plan-cadence'
import { semainesCouvertes } from './plan-serveur'

export interface ModeleListItem {
  id: string
  titre: string
  anneeScolaire: number
  gabarit: Gabarit
  statut: 'brouillon' | 'pret'
  nbExercices: number
}
export interface ModeleExerciceLigne {
  id: string
  typeExercice: string
  diagnostique: boolean
  nature: 'formatif' | 'evaluatif'
  lieu: 'classe' | 'maison'
  module: string
  origine: string
  semaineLundi: string
}
export interface SemaineModele {
  lundi: string
  semestreNom: string | null
  pedaNum: number | null
  exercices: ModeleExerciceLigne[]
}
export interface ModeleDetail {
  id: string
  titre: string
  gabarit: Gabarit
  statut: 'brouillon' | 'pret'
  dateDebut: string
  anneeScolaire: number
  avis?: string
  avisBloquant: boolean
  semaines: SemaineModele[]
  aRecaler: ModeleExerciceLigne[] // exercices dont la semaine n'est plus couverte (date/frise changée)
}

/** Liste des modèles vivants (récent d'abord) + nombre d'exercices de chacun. */
export async function chargerListeModeles(): Promise<ModeleListItem[]> {
  const supabase = await createClient()
  const { data: modeles } = await supabase
    .from('scriptorium_modeles_plan')
    .select('id, titre, annee_scolaire, gabarit, statut')
    .is('supprime_at', null)
    .order('annee_scolaire', { ascending: false })
    .order('titre')
  const liste = (modeles ?? []) as { id: string; titre: string; annee_scolaire: number; gabarit: Gabarit; statut: 'brouillon' | 'pret' }[]
  if (liste.length === 0) return []
  const { data: exos } = await supabase
    .from('scriptorium_modeles_plan_exercices')
    .select('modele_id')
    .in('modele_id', liste.map((m) => m.id))
  const parModele = new Map<string, number>()
  for (const e of exos ?? []) {
    const mid = e.modele_id as string
    parModele.set(mid, (parModele.get(mid) ?? 0) + 1)
  }
  return liste.map((m) => ({
    id: m.id, titre: m.titre, anneeScolaire: m.annee_scolaire, gabarit: m.gabarit,
    statut: m.statut, nbExercices: parModele.get(m.id) ?? 0,
  }))
}

/**
 * Détail d'un modèle : semaines couvertes (frise résolue depuis date_debut) + exercices
 * groupés par semaine + « à recaler » (semaine hors frise). Pas de jour ni d'échéance :
 * un exercice de modèle n'est qu'un créneau typé. null si le modèle n'existe pas / supprimé.
 */
export async function chargerModeleDetail(modeleId: string): Promise<ModeleDetail | null> {
  const supabase = await createClient()
  const { data: modele } = await supabase
    .from('scriptorium_modeles_plan')
    .select('id, titre, gabarit, statut, date_debut, annee_scolaire')
    .eq('id', modeleId)
    .is('supprime_at', null)
    .maybeSingle()
  if (!modele) return null

  const dateDebut = modele.date_debut as string
  const [couverture, { data: exos }] = await Promise.all([
    semainesCouvertes(dateDebut),
    supabase
      .from('scriptorium_modeles_plan_exercices')
      .select('id, type_exercice, diagnostique, nature, lieu, module, origine, semaine_lundi')
      .eq('modele_id', modeleId),
  ])

  const toLigne = (e: Record<string, unknown>): ModeleExerciceLigne => ({
    id: e.id as string,
    typeExercice: e.type_exercice as string,
    diagnostique: e.diagnostique as boolean,
    nature: e.nature as 'formatif' | 'evaluatif',
    lieu: e.lieu as 'classe' | 'maison',
    module: e.module as string,
    origine: e.origine as string,
    semaineLundi: e.semaine_lundi as string,
  })

  const lignes = (exos ?? []).map(toLigne)
  const lundisCouverts = new Set(couverture.couvertes.map((w) => w.dateDebutLundi))
  const parLundi = new Map<string, ModeleExerciceLigne[]>()
  const aRecaler: ModeleExerciceLigne[] = []
  for (const l of lignes) {
    // Défensif : le schéma autorise semaine_lundi NULL pour un diagnostic
    // (modele_exos_semaine_chk l'exempte), mais AUCUN chemin d'authoring n'en produit
    // (placerDiagnostics pose toujours un lundi concret). On saute une éventuelle ligne
    // sans semaine pour ne jamais casser le rendu (fmtJour(null)).
    if (!l.semaineLundi) continue
    if (!lundisCouverts.has(l.semaineLundi)) { aRecaler.push(l); continue }
    const arr = parLundi.get(l.semaineLundi) ?? []
    arr.push(l)
    parLundi.set(l.semaineLundi, arr)
  }

  const semaines: SemaineModele[] = couverture.couvertes.map((w) => ({
    lundi: w.dateDebutLundi,
    semestreNom: w.semestreNom,
    pedaNum: w.pedagogicalNumber,
    exercices: (parLundi.get(w.dateDebutLundi) ?? []).sort((a, b) => a.typeExercice.localeCompare(b.typeExercice)),
  }))

  return {
    id: modele.id as string,
    titre: modele.titre as string,
    gabarit: modele.gabarit as Gabarit,
    statut: modele.statut as 'brouillon' | 'pret',
    dateDebut,
    anneeScolaire: modele.annee_scolaire as number,
    avis: couverture.avis,
    avisBloquant: couverture.avisBloquant,
    semaines,
    aRecaler,
  }
}

export interface LigneAssignationModele {
  classeId: string
  nom: string
  typePedagogique: 'tc' | 'hlp' | 'autre' | null
  assignee: boolean          // a une instance issue de CE modèle pour l'AY (modele_id === modeleId)
  dateDebut: string | null   // date_debut de l'instance si assignée
  bloquee: string | null     // raison si non-assignable (déjà un AUTRE plan vivant pour l'AY)
}

/**
 * Assignations d'un modèle : une entrée par classe active + son état vis-à-vis de ce
 * modèle pour l'AY du modèle. Décision ② : PAS de filtre type_pedagogique. `defautDate`
 * = date_debut du modèle (défaut pré-rempli du ChampDate par classe).
 */
export async function chargerAssignationsModele(
  modeleId: string,
): Promise<{ defautDate: string; lignes: LigneAssignationModele[] } | null> {
  const supabase = await createClient()
  const { data: modele } = await supabase
    .from('scriptorium_modeles_plan')
    .select('annee_scolaire, date_debut')
    .eq('id', modeleId).is('supprime_at', null).maybeSingle()
  if (!modele) return null
  const ay = modele.annee_scolaire as number

  const [{ data: classes }, { data: plans }] = await Promise.all([
    supabase.from('classes').select('id, nom, type_pedagogique').eq('statut', 'active').order('nom'),
    supabase.from('scriptorium_plans_evaluation')
      .select('classe_id, modele_id, date_debut').eq('annee_scolaire', ay).is('supprime_at', null),
  ])
  const planParClasse = new Map<string, { modeleId: string | null; dateDebut: string }>()
  for (const p of plans ?? []) {
    planParClasse.set(p.classe_id as string, { modeleId: (p.modele_id as string | null) ?? null, dateDebut: p.date_debut as string })
  }

  const lignes: LigneAssignationModele[] = (classes ?? []).map((c) => {
    const p = planParClasse.get(c.id as string)
    const assignee = !!p && p.modeleId === modeleId
    return {
      classeId: c.id as string,
      nom: c.nom as string,
      typePedagogique: (c.type_pedagogique as LigneAssignationModele['typePedagogique']) ?? null,
      assignee,
      dateDebut: assignee ? p!.dateDebut : null,
      // Non-assignable si un AUTRE plan vivant occupe l'AY (uk_plans_evaluation_classe_ay) :
      // soit issu d'un autre modèle, soit sans lien (class-first, ou détaché de CE modèle).
      bloquee: p && p.modeleId !== modeleId
        ? (p.modeleId ? 'Déjà un autre plan pour cette année scolaire.' : 'Un plan existe déjà pour cette année (non lié à ce modèle).')
        : null,
    }
  })
  return { defautDate: modele.date_debut as string, lignes }
}
