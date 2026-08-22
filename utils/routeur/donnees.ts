// ============================================================================
// C4 · L2 — LES LECTURES. Ce fichier est le SEUL du dossier à parler à la base.
// ----------------------------------------------------------------------------
// ⚠️ CE FICHIER N'EST PAS PUR. Aucune règle n'y vit : il LIT, il TRADUIT, il rend
//    des objets que les modules purs savent manipuler. Les règles sont ailleurs,
//    et `npm test` les éprouve.
//
// ⚠️⚠️ LE PLAFOND DE 1000 LIGNES. « PostgREST plafonne toute réponse à 1000
//    lignes SANS RIEN SIGNALER — `error` reste nul. » C'est le défaut qui a coûté
//    un lot entier (C4-L8-bis : sept objets sur treize devenus inconcevables).
//    Une classe entière × ses semaines dépasse vite ce seuil sur
//    `competences_mesures` comme sur `exercices_depots`. D'où `lirePagine` :
//    PAGINER · ORDONNER SUR UNE CLÉ UNIQUE · CONFRONTER AU `count: 'exact'`.
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une lecture dont on ignore le
//    retour échoue INVISIBLEMENT, même sous `try/catch`. D'où `lire()` de
//    `utils/fabrique/lecture.ts`, réutilisé ici : « une lecture ratée n'est pas
//    une base vide ».
// ============================================================================

import 'server-only'
import type { Admin } from './acces'
import type { Mesure } from './mesure'
import type { EtatNiveau } from './lettres'
import type { EtatEscalade } from './escalade'
import type { EtatMontee } from './montee'
import type { InscriptionActive, ReglageBudget } from './budget'
import type { DecisionLue } from './profil'
import type { Competence, Mode, Palier, Parcours } from './types'
import { SEUILS_DE_DEMARRAGE, type SeuilsAssiduite } from './assiduite'

/** Le plafond que PostgREST applique sans le dire. */
const PAGE = 1000

export class LectureTronquee extends Error {}

/**
 * Une lecture PAGINÉE et CONFRONTÉE AU DÉCOMPTE. Même patron que `lireTable` de
 * `utils/fabrique/doctrine.ts` (C4-L8-bis) — « n'en contourne rien » (piège 45).
 *
 * ⚠️ Le `Promise.resolve` N'EST PAS DÉCORATIF : un constructeur de requête
 *    supabase-js est PARESSEUX, il ne part qu'au premier `then`. Sans lui, le
 *    décompte et la première page seraient séquentiels.
 */
export async function lirePagine<T>(
  admin: Admin, table: string, colonnes: string, cle: string[],
  affiner: (q: ReturnType<ReturnType<Admin['from']>['select']>) => unknown,
): Promise<T[]> {
  type Q = { order: (c: string, o: { ascending: boolean }) => Q
    range: (a: number, b: number) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }> }

  const compte = Promise.resolve(
    affiner((admin.from(table) as never as { select: (c: string, o: unknown) => unknown })
      .select(colonnes, { count: 'exact', head: true }) as never),
  ) as unknown as Promise<{ count: number | null; error: { message: string } | null }>

  const lignes: T[] = []
  for (let debut = 0; ; debut += PAGE) {
    let q = affiner((admin.from(table) as never as { select: (c: string) => unknown })
      .select(colonnes) as never) as unknown as Q
    for (const c of cle) q = q.order(c, { ascending: true })
    const { data, error } = await q.range(debut, debut + PAGE - 1)
    if (error) throw new LectureTronquee(`lecture de ${table} : ${error.message}`)
    const page = (data ?? []) as T[]
    lignes.push(...page)
    if (page.length < PAGE) break
  }

  const { count, error: eCompte } = await compte
  if (eCompte) throw new LectureTronquee(`décompte de ${table} : ${eCompte.message}`)
  if (count === null || count !== lignes.length) {
    throw new LectureTronquee(
      `lecture TRONQUÉE — ${table} : ${lignes.length} ligne(s) lue(s), `
      + `${count === null ? 'décompte indisponible' : `${count} en base`}.`)
  }
  return lignes
}

// ════════════════════════════════════════════════════════════════════════════
// LES MESURES
// ════════════════════════════════════════════════════════════════════════════

const COLONNES_MESURE =
  'id, competence, modes, lettre_equivalente, observables, lieu, forme, genre, classe_id, '
  + 'sonde_montee, distance_contexte, delai_jours, delai_mesures, delta_v1_vf, '
  + 'paire_correction_juste, paire_nouveau_cas_detecte, depot_id, bonus, instrument_version, mesure_at'

interface LigneMesure {
  id: string; competence: string; modes: string[] | null; lettre_equivalente: string | null
  observables: Record<string, unknown> | null; lieu: string; forme: string; genre: string | null
  classe_id: string | null; sonde_montee: boolean; distance_contexte: string | null
  delai_jours: number | null; delai_mesures: number | null; delta_v1_vf: number | null
  paire_correction_juste: boolean | null; paire_nouveau_cas_detecte: boolean | null
  depot_id: string | null; bonus: boolean; instrument_version: string | null; mesure_at: string
}

const PALIERS_VALIDES = new Set(['E', 'D', 'C', 'B', 'A'])

function versMesure(l: LigneMesure): Mesure {
  return {
    id: l.id,
    competence: l.competence as Competence,
    modes: (l.modes ?? []) as Mode[],
    lettreEquivalente: l.lettre_equivalente && PALIERS_VALIDES.has(l.lettre_equivalente)
      ? (l.lettre_equivalente as Palier) : null,
    observables: l.observables,
    lieu: l.lieu === 'classe' ? 'classe' : 'maison',
    forme: l.forme === 'sommatif' ? 'sommatif' : 'formatif',
    classeId: l.classe_id,
    genre: l.genre,
    sondeMontee: !!l.sonde_montee,
    distanceContexte: l.distance_contexte as Mesure['distanceContexte'],
    delaiJours: l.delai_jours,
    delaiMesures: l.delai_mesures,
    deltaV1Vf: l.delta_v1_vf,
    paireCorrectionJuste: l.paire_correction_juste,
    paireNouveauCasDetecte: l.paire_nouveau_cas_detecte,
    depotId: l.depot_id,
    bonus: !!l.bonus,
    instrumentVersion: l.instrument_version,
    mesureAt: l.mesure_at,
  }
}

/** Toutes les mesures d'un élève, paginées et confrontées au décompte. */
export async function lireLesMesures(admin: Admin, eleveId: string): Promise<Mesure[]> {
  const lignes = await lirePagine<LigneMesure>(admin, 'competences_mesures', COLONNES_MESURE,
    ['mesure_at', 'id'], (q) => (q as never as { eq: (a: string, b: string) => unknown })
      .eq('eleve_id', eleveId))
  return lignes.map(versMesure)
}

// ════════════════════════════════════════════════════════════════════════════
// L'ÉTAT
// ════════════════════════════════════════════════════════════════════════════

interface LigneNiveau {
  competence: string; lettre: string | null; ancre_derniere_date: string | null
  ancre_derniere_valeur: string | null; lettre_initiale: string | null
  statut_recette: string; statut_recette_pose_le: string | null; profil_provisoire: boolean
}

export interface NiveauLu extends EtatNiveau { competence: Competence; statutRecette: string }

/** `07-` §1.3 — l'état affiché, plus `lettre_initiale`, ajoutée par ce lot. */
export async function lireLesNiveaux(admin: Admin, eleveId: string): Promise<NiveauLu[]> {
  const lignes = await lirePagine<LigneNiveau>(admin, 'competences_niveaux',
    'competence, lettre, ancre_derniere_date, ancre_derniere_valeur, lettre_initiale, '
    + 'statut_recette, statut_recette_pose_le, profil_provisoire',
    ['competence'], (q) => (q as never as { eq: (a: string, b: string) => unknown })
      .eq('eleve_id', eleveId))
  const palier = (v: string | null) => (v && PALIERS_VALIDES.has(v) ? (v as Palier) : null)
  return lignes.map((l) => ({
    competence: l.competence as Competence,
    lettre: palier(l.lettre),
    ancreDerniereDate: l.ancre_derniere_date,
    ancreDerniereValeur: palier(l.ancre_derniere_valeur),
    lettreInitiale: palier(l.lettre_initiale),
    profilProvisoire: !!l.profil_provisoire,
    statutRecettePoseLe: l.statut_recette_pose_le,
    statutRecette: l.statut_recette,
  }))
}

interface LigneEscalade {
  competence: string; observable: string; degre: string; entre_n1_at: string | null
  dossier_n3_ouvert_at: string | null; dossier_n3_traite_at: string | null
}

export async function lireLesEscalades(
  admin: Admin, eleveId: string,
): Promise<Map<Competence, EtatEscalade[]>> {
  const lignes = await lirePagine<LigneEscalade>(admin, 'competences_escalade',
    'competence, observable, degre, entre_n1_at, dossier_n3_ouvert_at, dossier_n3_traite_at',
    ['competence', 'observable'], (q) => (q as never as { eq: (a: string, b: string) => unknown })
      .eq('eleve_id', eleveId))
  const parCompetence = new Map<Competence, EtatEscalade[]>()
  for (const l of lignes) {
    const c = l.competence as Competence
    const lot = parCompetence.get(c) ?? []
    lot.push({ observable: l.observable, degre: l.degre as EtatEscalade['degre'],
      entreN1At: l.entre_n1_at, dossierN3OuvertAt: l.dossier_n3_ouvert_at,
      dossierN3TraiteAt: l.dossier_n3_traite_at })
    parCompetence.set(c, lot)
  }
  return parCompetence
}

interface LigneMontee { competence: string; grain: string; cran_atteint: number | null }

export async function lireLaMontee(
  admin: Admin, eleveId: string,
): Promise<Map<Competence, EtatMontee[]>> {
  const lignes = await lirePagine<LigneMontee>(admin, 'competences_montee',
    'competence, grain, cran_atteint', ['competence', 'grain'],
    (q) => (q as never as { eq: (a: string, b: string) => unknown }).eq('eleve_id', eleveId))
  const parCompetence = new Map<Competence, EtatMontee[]>()
  for (const l of lignes) {
    const c = l.competence as Competence
    const lot = parCompetence.get(c) ?? []
    lot.push({ grain: l.grain as EtatMontee['grain'], cranAtteint: l.cran_atteint })
    parCompetence.set(c, lot)
  }
  return parCompetence
}

// ════════════════════════════════════════════════════════════════════════════
// L'ÉLÈVE — inscriptions, parcours, budget
// ════════════════════════════════════════════════════════════════════════════

/**
 * `07-` §1.3 — « le parcours d'un élève NE SE STOCKE PAS : il se dérive de
 * l'UNION de ses inscriptions ACTIVES ». Et il se lit sur
 * `classes.type_pedagogique`, à valeurs fermées — JAMAIS sur `classes.filiere`,
 * « deux orthographes d'un même libellé, et l'éligibilité devient un jeu de saisie ».
 *
 * ⚠️ On filtre AUSSI sur `classes.statut = 'active'` : une inscription active dans
 *    une classe FERMÉE ne doit pas donner un parcours. `utils/acces.ts` ne le fait
 *    pas pour les modules ; ici c'est l'éligibilité aux exercices qui est en jeu,
 *    et le `07-` §1.3 veut « ses classes » au présent. *Signalé au relevé.*
 */
export async function lireLesInscriptions(
  admin: Admin, eleveId: string,
): Promise<InscriptionActive[]> {
  const { data, error } = await admin
    .from('inscriptions')
    .select('classe_id, classes!inner(nom, type_pedagogique, statut)')
    .eq('eleve_id', eleveId).eq('statut', 'active')
  if (error) throw new LectureTronquee(`lecture des inscriptions : ${error.message}`)
  type L = { classe_id: string; classes: { nom: string; type_pedagogique: string | null; statut: string } | null }
  return ((data ?? []) as unknown as L[])
    .filter((l) => l.classes?.statut === 'active')
    .map((l) => ({
      classeId: l.classe_id,
      classeNom: l.classes?.nom ?? '(classe sans nom)',
      typePedagogique: (l.classes?.type_pedagogique as Parcours | null) ?? null,
    }))
}

/** `07-` §1.3 — `competences_actives_par_classe` : le routeur la LIT, IL NE L'ÉCRIT PAS. */
export async function lireLOptOut(
  admin: Admin, classeIds: readonly string[],
): Promise<Set<Competence>> {
  if (classeIds.length === 0) return new Set()
  const { data, error } = await admin
    .from('competences_actives_par_classe')
    .select('competence, active').in('classe_id', classeIds as string[])
  if (error) throw new LectureTronquee(`lecture de l'opt-out : ${error.message}`)
  // « Le DÉFAUT est actif : une ligne absente vaut active. » Une compétence n'est
  // écartée que si TOUTES les classes de l'élève l'ont désactivée.
  const parCompetence = new Map<string, boolean[]>()
  for (const l of (data ?? []) as Array<{ competence: string; active: boolean }>) {
    parCompetence.set(l.competence, [...(parCompetence.get(l.competence) ?? []), !!l.active])
  }
  const ecartees = new Set<Competence>()
  for (const [c, etats] of parCompetence) {
    if (etats.length === classeIds.length && etats.every((a) => !a)) ecartees.add(c as Competence)
  }
  return ecartees
}

interface LigneProfil {
  budget_plancher_min: number | null; budget_plafond_min: number | null
  budget_optionnel_min: number | null; exception_expression: boolean
  preference_recueillie_at: string | null
}

export interface ProfilEleve {
  reglage: ReglageBudget
  exceptionExpression: boolean
  preferenceRecueillieAt: string | null
}

export async function lireLeProfil(admin: Admin, eleveId: string): Promise<ProfilEleve> {
  const { data, error } = await admin
    .from('profiles')
    .select('budget_plancher_min, budget_plafond_min, budget_optionnel_min, exception_expression, preference_recueillie_at')
    .eq('id', eleveId).maybeSingle()
  if (error) throw new LectureTronquee(`lecture du profil : ${error.message}`)
  const l = (data ?? {}) as Partial<LigneProfil>
  return {
    reglage: {
      plancher: l.budget_plancher_min ?? null,
      plafond: l.budget_plafond_min ?? null,
      optionnel: l.budget_optionnel_min ?? null,
    },
    exceptionExpression: !!l.exception_expression,
    preferenceRecueillieAt: l.preference_recueillie_at ?? null,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LES FICHES — d'où les OBSERVABLES REQUIS se lisent (§8.3)
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §8.3 — « quels observables sont REQUIS, C'EST LA FICHE DE LA COMPÉTENCE
 * QUI LE DÉCLARE : le routeur lit, il ne décide pas ». La fiche déposée par la
 * fabrique vit dans `competences_fiches.contenu` (`07-` §1.1).
 */
export async function lireLesFiches(admin: Admin): Promise<Map<Competence, string>> {
  const { data, error } = await admin
    .from('competences_fiches').select('competence, contenu, version')
  if (error) throw new LectureTronquee(`lecture des fiches : ${error.message}`)
  const m = new Map<Competence, string>()
  for (const l of (data ?? []) as Array<{ competence: string; contenu: string }>) {
    m.set(l.competence as Competence, l.contenu)
  }
  return m
}

// ════════════════════════════════════════════════════════════════════════════
// LE JOURNAL DES DÉCISIONS — « il ne redouble aucune liste »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §3 — l'HISTORIQUE DES CIBLES « se lit sur `routeur_decisions`, QUI PORTE
 * DÉJÀ LA CIBLE — jamais une seconde liste ».
 */
export async function lireLesDecisions(
  admin: Admin, eleveId: string, depuisLundi?: string,
): Promise<DecisionLue[]> {
  const lignes = await lirePagine<{ cible_retenue: string | null; cycle_lundi: string; created_at: string }>(
    admin, 'routeur_decisions', 'cible_retenue, cycle_lundi, created_at, id',
    ['created_at', 'id'],
    (q) => {
      let r = (q as never as { eq: (a: string, b: string) => unknown }).eq('eleve_id', eleveId)
      if (depuisLundi) {
        r = (r as never as { gte: (a: string, b: string) => unknown }).gte('cycle_lundi', depuisLundi)
      }
      return r
    })
  return lignes.map((l) => ({
    cibleRetenue: (l.cible_retenue as Competence | null) ?? null,
    cycleLundi: l.cycle_lundi,
    createdAt: l.created_at,
  }))
}

// ════════════════════════════════════════════════════════════════════════════
// L'ASSIDUITÉ — les comptes que la plateforme tient déjà
// ════════════════════════════════════════════════════════════════════════════

export interface LigneAssiduite {
  eleveId: string
  cycleLundi: string
  exercicesAssignes: number
  exercicesTermines: number
  semaineFaite: boolean
  minutesAssignees: number | null
  minutesBudgetPlancher: number | null
  minutesBudgetPlafond: number | null
}

export async function lireLAssiduite(
  admin: Admin, eleveIds: readonly string[],
): Promise<LigneAssiduite[]> {
  if (eleveIds.length === 0) return []
  const lignes = await lirePagine<{
    eleve_id: string; cycle_lundi: string; exercices_assignes: number
    exercices_termines: number; semaine_faite: boolean; minutes_assignees: number | null
    minutes_budget_plancher: number | null; minutes_budget_plafond: number | null
  }>(admin, 'assiduite_hebdo',
    'eleve_id, cycle_lundi, exercices_assignes, exercices_termines, semaine_faite, '
    + 'minutes_assignees, minutes_budget_plancher, minutes_budget_plafond',
    ['cycle_lundi', 'eleve_id'],
    (q) => (q as never as { in: (a: string, b: string[]) => unknown })
      .in('eleve_id', eleveIds as string[]))
  return lignes.map((l) => ({
    eleveId: l.eleve_id,
    cycleLundi: l.cycle_lundi,
    exercicesAssignes: l.exercices_assignes,
    exercicesTermines: l.exercices_termines,
    semaineFaite: !!l.semaine_faite,
    minutesAssignees: l.minutes_assignees,
    minutesBudgetPlancher: l.minutes_budget_plancher,
    minutesBudgetPlafond: l.minutes_budget_plafond,
  }))
}

// ══════════════════════════════════════════════════════════════════════════
// LA CONFIGURATION — les deux réglages, et les six interrupteurs
// ══════════════════════════════════════════════════════════════════════════

/**
 * `06-` §5 — les deux réglages, LUS EN CONFIGURATION. « Jamais une constante en
 * dur » : le code ne les connaît que par ici.
 *
 * Le repli sur les défauts de DÉMARRAGE n'est pas une décision : c'est ce qui
 * arrive quand la migration n'est pas encore jouée. Il se dit, il ne se cache pas.
 */
export async function lireLesSeuils(
  admin: Admin,
): Promise<{ seuils: SeuilsAssiduite; parDefaut: boolean }> {
  const { data, error } = await admin
    .from('scriptorium_params')
    .select('assiduite_seuil_semaine_faite, assiduite_borne_basse_frise, assiduite_contrat_classe')
    .limit(1).maybeSingle()
  if (error || !data || data.assiduite_seuil_semaine_faite == null) {
    return { seuils: { ...SEUILS_DE_DEMARRAGE }, parDefaut: true }
  }
  return {
    seuils: {
      semaineFaite: Number(data.assiduite_seuil_semaine_faite),
      borneBasseFrise: Number(data.assiduite_borne_basse_frise),
      contratDeClasse: Number(data.assiduite_contrat_classe),
    },
    parDefaut: false,
  }
}

/**
 * `07-` §1.5 — les SIX interrupteurs, LUS POUR ÊTRE MONTRÉS. Le pilotage dit au
 * professeur où en est l'allumage ; il ne s'y soumet pas.
 */
export async function lireLesInterrupteurs(admin: Admin): Promise<Record<string, boolean>> {
  // ⚠️ La liste des colonnes reste sur UNE SEULE LIGNE : concaténée, supabase-js
  //    ne sait plus la typer et rend `GenericStringError`.
  const { data } = await admin
    .from('scriptorium_params')
    .select('exercices_actif, routeur_actif, competences_affichage_actif, chaine_actif, fabrique_actif, passation_classe_actif')
    .limit(1).maybeSingle()
  return {
    exercices_actif: !!data?.exercices_actif,
    routeur_actif: !!data?.routeur_actif,
    competences_affichage_actif: !!data?.competences_affichage_actif,
    chaine_actif: !!data?.chaine_actif,
    fabrique_actif: !!data?.fabrique_actif,
    passation_classe_actif: !!data?.passation_classe_actif,
  }
}
