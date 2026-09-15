// ============================================================================
// LE SUIVI DES EXERCICES — le chargeur de l'onglet « Assignation » du routeur (refait le 14/09).
// ----------------------------------------------------------------------------
// ⭐ Louis, 14/09 : « voir les exercices que mes élèves font, ainsi que leur
//    taux de succès, au fur et à mesure » — des tuiles par classe, la liste des
//    élèves, les exercices d'un élève, et l'exercice tel qu'il l'a vu.
//
// ⚠️ UNE SEMAINE, TOUTES LES CLASSES, EN SIX LECTURES : classes, inscriptions,
//    profils, dépôts (joints à leur instance), décisions, durées de cran. Puis
//    le registre des réussites, lu par LOTS (`lireLesDepotsPourLeRegistreDesDepots`)
//    pour que l'issue soit celle du routeur, jamais un second calcul.
//
// ⛔ PostgREST rend 1000 lignes MAX par requête, sans erreur : la semaine du
//    14/09 en compte 382 en prod, une classe entière 150. `toutes()` pagine
//    quand même, pour le jour où ça déborde.
//
// ⚠️ LE TEMPS PASSÉ est `v1_remis_at − ouvert_at`. Mesuré en prod le 14/09 :
//    médiane 10 min, mais 15 dépôts sur 140 laissés ouverts plus d'un jour. Au
//    delà de `PLAFOND_MIN`, la case dit « laissé ouvert » plutôt qu'un chiffre.
//
// ⚠️ LE TEMPS PRÉVU vient de `exercices_types_crans.duree_exercice_min` (présent
//    pour toute instance), comme l'écran de l'élève (`dureeDeLInstance`) — la
//    décision du routeur ne porte `propositions_iso_duree` que 31 fois sur 300.
// ============================================================================
import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import { finDeJourDansFuseau } from '@/utils/fuseau'
import { cranNumero } from '@/utils/cran'
import { titreDeLaConsigne } from '@/utils/codex-onglets/regles'
import { issueDuDepot, type Issue } from '@/utils/registre/reussites'
import { lireLesDepotsPourLeRegistreDesDepots } from '@/utils/registre/reussites-serveur'

type Admin = ReturnType<typeof createAdminClient>

/** Au-delà, le dépôt a été laissé ouvert : le temps ne mesure plus le travail. */
export const PLAFOND_MIN = 180
const STATUTS_RENDUS = ['v1_remis', 'retour_publie', 'vf_remis', 'clos'] as const

export interface ExerciceSuivi {
  depotId: string
  exerciceId: string
  statut: string
  /** La compétence visée : `cible_retenue` → `cible_primaire` → observable. */
  competence: string | null
  /** L'objet (`exercices_types.code`) — la clé courte que la banque porte. */
  objet: string | null
  /** Le code de l'observable isolé — la mesure. */
  observable: string | null
  idImport: string | null
  /** `maison` ou `classe` — un dépôt de classe n'a pas d'écrans de maison à rejouer. */
  lieu: string | null
  cran: number | null
  titre: string
  rendu: boolean
  issue: Issue | null
  prevuMin: number | null
  /** Minutes entre l'ouverture et la remise de v1 ; `null` si l'un manque. */
  passeMin: number | null
  laisseOuvert: boolean
  ouvertAt: string | null
  v1RemisAt: string | null
  retirable: boolean
  /** Ce que l'ancien écran montrait : la décision du routeur, l'origine, l'échéance. */
  origine: string
  echeance: string | null
  regle: string | null
  degrade: boolean
  sondes: Array<{ competence?: string; motif?: string; sonde_montee?: boolean }>
}

export interface EleveSuivi {
  id: string
  nom: string
  exercices: ExerciceSuivi[]
  assignes: number
  rendus: number
  reussis: number
  /** Rendus dont l'issue n'est pas dérivable (crans 6·8, juge absent, examens) : ni réussis ni ratés. */
  sansVerdict: number
  prevuMin: number
  passeMin: number
  laisseOuvert: boolean
  competences: string[]
}

export interface ClasseSuivi {
  id: string
  nom: string
  eleves: number
  assignes: number
  rendus: number
  reussis: number
  sansVerdict: number
  sansExercice: number
}

export interface ChargeSuivi {
  cycleLundi: string
  classes: ClasseSuivi[]
  /** La classe ouverte, avec ses élèves ; `null` tant qu'aucune tuile n'est choisie. */
  classe: { id: string; nom: string; eleves: EleveSuivi[] } | null
  incidents: string[]
}

async function toutes<T>(fabrique: (de: number, a: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<{ lignes: T[]; erreur: string | null }> {
  const lignes: T[] = []
  for (let de = 0; ; de += 1000) {
    const { data, error } = await fabrique(de, de + 999)
    if (error) return { lignes, erreur: error.message }
    const page = (data ?? []) as T[]
    lignes.push(...page)
    if (page.length < 1000) return { lignes, erreur: null }
  }
}

const un = <T,>(x: unknown): T | null => (Array.isArray(x) ? (x[0] ?? null) : (x as T | null))

/** L'instant du DÉBUT d'un jour (00:00 locales) dans le fuseau — la veille à 23:59:59.999, plus une ms. */
function debutDuJourDansFuseau(jour: string, tz: string): string {
  const veille = new Date(`${jour}T00:00:00Z`)
  veille.setUTCDate(veille.getUTCDate() - 1)
  return new Date(Date.parse(finDeJourDansFuseau(veille.toISOString().slice(0, 10), tz)) + 1).toISOString()
}

const tranches = <T,>(xs: T[], n: number): T[][] => {
  const out: T[][] = []
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n))
  return out
}

export async function chargerSuivi(
  admin: Admin, a: { cycleLundi: string; classeId: string | null; fuseau: string },
): Promise<ChargeSuivi> {
  const incidents: string[] = []
  const lundi = a.cycleLundi
  const suivant = lundiSuivant(lundi)
  // ⚠️ LA SEMAINE SE BORNE DANS LE FUSEAU DE L'ÉCOLE, par des instants — comme
  //    l'assiduité, « Ma semaine » de l'élève et le journal du retrait
  //    (`lundiDuCycle`). Bornée en UTC, un exercice imposé dimanche 21 h à
  //    Montréal changeait de semaine (audit du 14/09 : 7 dépôts sur 25 en bac à sable).
  const debut = debutDuJourDansFuseau(lundi, a.fuseau)
  const fin = debutDuJourDansFuseau(suivant, a.fuseau)

  const [classesLues, inscr, depotsLus] = await Promise.all([
    admin.from('classes').select('id, nom').eq('statut', 'active').order('nom'),
    toutes<{ eleve_id: string; classe_id: string }>((de, jusqua) =>
      admin.from('inscriptions').select('eleve_id, classe_id').eq('statut', 'active').order('id').range(de, jusqua)),
    toutes<LigneDepot>((de, jusqua) => admin.from('exercices_depots')
      .select('id, eleve_id, exercice_id, statut, origine, echeance, ouvert_at, v1_remis_at, routeur_decision_id, '
        + 'exercices(id, cran, type_id, lieu, id_import, consigne_instanciee, observable_isole_code, '
        + 'observable_isole_competence, cible_primaire, exercices_types(code))')
      .gte('assigne_at', debut).lt('assigne_at', fin)
      // ⚠️ Le routeur pose le MÊME `assigne_at` à tout un cycle : `id` en second
      //    critère, sinon la pagination lit deux fois ou saute une ligne.
      .order('assigne_at', { ascending: true }).order('id').range(de, jusqua)),
  ])
  if (classesLues.error) incidents.push(`classes : ${classesLues.error.message}`)
  if (inscr.erreur) incidents.push(`inscriptions : ${inscr.erreur}`)
  if (depotsLus.erreur) incidents.push(`dépôts : ${depotsLus.erreur}`)
  const classes = (classesLues.data ?? []) as Array<{ id: string; nom: string }>
  const depots = depotsLus.lignes

  // ⚠️ Un élève inscrit dans DEUX classes actives compte dans les deux tuiles
  //    (11 en bac à sable) — même lecture que l'assiduité.
  const elevesParClasse = new Map<string, string[]>()
  for (const i of inscr.lignes) {
    elevesParClasse.set(i.classe_id, [...(elevesParClasse.get(i.classe_id) ?? []), i.eleve_id])
  }

  // Les compléments, en parallèle : décisions (la cible), durées de cran, registre.
  const decisionIds = [...new Set(depots.map((d) => d.routeur_decision_id).filter((x): x is string => !!x))]
  const typeCrans = [...new Set(depots.map((d) => un<LigneExercice>(d.exercices)?.type_id).filter((x): x is string => !!x))]
  const [decisions, durees, registre] = await Promise.all([
    // ⛔ Un `.in()` part dans l'URL ; ~700 uuid font un 400 muet. Par tranches.
    Promise.all(tranches(decisionIds, 200).map((ids) =>
      admin.from('routeur_decisions').select('id, cible_retenue, regle_declenchee, sondes_retenues, degrade').in('id', ids)))
      .then((rs) => ({
        lignes: rs.flatMap((r) => (r.data ?? []) as LigneDecision[]),
        erreur: rs.find((r) => r.error)?.error?.message ?? null,
      })),
    typeCrans.length
      ? admin.from('exercices_types_crans').select('type_id, cran, duree_exercice_min').in('type_id', typeCrans)
      : Promise.resolve({ data: [], error: null }),
    lireLesDepotsPourLeRegistreDesDepots(admin,
      depots.filter((d) => (STATUTS_RENDUS as readonly string[]).includes(d.statut)).map((d) => d.id)),
  ])
  if (decisions.erreur) incidents.push(`décisions : ${decisions.erreur}`)
  if (durees.error) incidents.push(`durées : ${durees.error.message}`)
  incidents.push(...registre.incidents)
  const parDecision = new Map(decisions.lignes.map((d) => [d.id, d]))
  const dureeParTypeCran = new Map<string, number>()
  for (const t of (durees.data ?? []) as Array<{ type_id: string; cran: number; duree_exercice_min: number | null }>) {
    if (typeof t.duree_exercice_min === 'number') dureeParTypeCran.set(`${t.type_id}:${t.cran}`, t.duree_exercice_min)
  }
  const issueParDepot = new Map<string, Issue | null>()
  for (const d of registre.depots) issueParDepot.set(d.depotId, issueDuDepot(d))

  const lignes: Array<ExerciceSuivi & { eleveId: string }> = depots.map((d) => {
    const ex = un<LigneExercice>(d.exercices)
    const cran = cranNumero(ex?.cran)
    const dec = d.routeur_decision_id ? parDecision.get(d.routeur_decision_id) : undefined
    const rendu = (STATUTS_RENDUS as readonly string[]).includes(d.statut)
    const passe = d.ouvert_at && d.v1_remis_at
      ? Math.max(0, Math.round((new Date(d.v1_remis_at).getTime() - new Date(d.ouvert_at).getTime()) / 60000))
      : null
    return {
      depotId: d.id, eleveId: d.eleve_id, exerciceId: d.exercice_id, statut: d.statut,
      competence: (d.routeur_decision_id ? parDecision.get(d.routeur_decision_id)?.cible_retenue : null)
        ?? ex?.cible_primaire ?? ex?.observable_isole_competence ?? null,
      objet: un<{ code: string }>(ex?.exercices_types)?.code ?? null,
      observable: ex?.observable_isole_code ?? null,
      idImport: ex?.id_import ?? null,
      lieu: ex?.lieu ?? null,
      cran,
      titre: titreDeLaConsigne(ex?.consigne_instanciee),
      rendu,
      issue: rendu ? (issueParDepot.get(d.id) ?? null) : null,
      prevuMin: ex?.type_id && cran != null ? (dureeParTypeCran.get(`${ex.type_id}:${cran}`) ?? null) : null,
      passeMin: passe != null && passe <= PLAFOND_MIN ? passe : null,
      laisseOuvert: passe != null && passe > PLAFOND_MIN,
      ouvertAt: d.ouvert_at, v1RemisAt: d.v1_remis_at,
      // « Le retrait reste permis TANT QUE LE DÉPÔT N'EST PAS `clos` » (07- §1.1).
      retirable: d.statut !== 'clos' && d.statut !== 'retire',
      origine: d.origine, echeance: d.echeance,
      regle: dec?.regle_declenchee ?? null,
      degrade: !!dec?.degrade,
      sondes: Array.isArray(dec?.sondes_retenues) ? (dec!.sondes_retenues as ExerciceSuivi['sondes']) : [],
    }
  })
  // ⭐ Les dépôts RETIRÉS restent dans la liste (« retiré par vous », comme
  //    l'ancien écran) ; ils sortent seulement des comptes (audit du 14/09).
  const parEleve = new Map<string, Array<ExerciceSuivi & { eleveId: string }>>()
  for (const l of lignes) parEleve.set(l.eleveId, [...(parEleve.get(l.eleveId) ?? []), l])
  const comptes = (xs: ExerciceSuivi[]) => {
    const vifs = xs.filter((x) => x.statut !== 'retire')
    return {
      assignes: vifs.length,
      rendus: vifs.filter((x) => x.rendu).length,
      reussis: vifs.filter((x) => x.issue === 'reussi').length,
      // ⚠️ « rendu, sans verdict » n'est PAS un échec : crans 6·8, juge absent, examens.
      sansVerdict: vifs.filter((x) => x.rendu && x.issue === null).length,
    }
  }

  const tuiles: ClasseSuivi[] = classes.map((c) => {
    const ids = elevesParClasse.get(c.id) ?? []
    const siens = ids.flatMap((id) => parEleve.get(id) ?? [])
    return {
      id: c.id, nom: c.nom, eleves: ids.length,
      ...comptes(siens),
      sansExercice: ids.filter((id) => !(parEleve.get(id) ?? []).some((x) => x.statut !== 'retire')).length,
    }
  })

  let classe: ChargeSuivi['classe'] = null
  const choisie = classes.find((c) => c.id === a.classeId)
  if (choisie) {
    const ids = elevesParClasse.get(choisie.id) ?? []
    const { data: p, error: eP } = await admin.from('profiles').select('id, display_name').in('id', ids)
    if (eP) incidents.push(`profils : ${eP.message}`)
    const noms = new Map((p ?? []).map((x: { id: string; display_name: string | null }) => [x.id, x.display_name || '(élève sans nom)']))
    const eleves: EleveSuivi[] = ids.map((id) => {
      const ex: ExerciceSuivi[] = (parEleve.get(id) ?? []).map((l) => { const { eleveId, ...reste } = l; void eleveId; return reste })
      const vifs = ex.filter((x) => x.statut !== 'retire')
      return {
        id, nom: noms.get(id) ?? '(élève inconnu)', exercices: ex,
        ...comptes(ex),
        prevuMin: vifs.reduce((s, x) => s + (x.prevuMin ?? 0), 0),
        passeMin: vifs.reduce((s, x) => s + (x.passeMin ?? 0), 0),
        laisseOuvert: vifs.some((x) => x.laisseOuvert),
        competences: [...new Set(vifs.map((x) => x.competence).filter((x): x is string => !!x))],
      }
    }).sort((x, y) => x.nom.localeCompare(y.nom, 'fr'))
    classe = { id: choisie.id, nom: choisie.nom, eleves }
  }

  return { cycleLundi: lundi, classes: tuiles, classe, incidents }
}

interface LigneExercice {
  id: string; cran: unknown; type_id: string | null; lieu: string | null; id_import: string | null
  consigne_instanciee: unknown; observable_isole_code: string | null
  observable_isole_competence: string | null; cible_primaire: string | null; exercices_types: unknown
}
interface LigneDecision {
  id: string; cible_retenue: string | null; regle_declenchee: string | null; sondes_retenues: unknown; degrade: boolean
}
interface LigneDepot {
  id: string; eleve_id: string; exercice_id: string; statut: string; origine: string; echeance: string | null
  ouvert_at: string | null; v1_remis_at: string | null; routeur_decision_id: string | null
  exercices: unknown
}

function lundiSuivant(lundi: string): string {
  const d = new Date(`${lundi}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 7)
  return d.toISOString().slice(0, 10)
}
