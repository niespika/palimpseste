import 'server-only'
// ============================================================================
// C6 · L2 — LE LECTEUR DU PROFIL DE L'ÉLÈVE.
// ----------------------------------------------------------------------------
// Les RÈGLES vivent à `profil.ts`, pures et éprouvées. Ici, on LIT — et on
// n'invente rien.
//
// ⛔⛔ LECTURE PAR LE CLIENT ADMIN, FILTRÉE SUR `eleve_id` DANS LE CODE. « Lecture
//    élève : ses propres lignes, strictement ; toutes les écritures passent par
//    le serveur » (`07-` §1) — et le moteur va plus loin : ZÉRO policy élève sur
//    ses 39 tables. **On n'en ouvre aucune** ; le serveur lit pour l'élève. Le
//    patron est `utils/examens/signal.ts`.
//
// ⛔⛔ DEUX TABLES NE SE JOIGNENT JAMAIS ICI — les SQUELETTES et la MÉTACOGNITION
//    (`07-` §1) : « c'est la garde la plus facile à casser et la plus coûteuse :
//    elle donne la grille et les réponses. » Et une TROISIÈME s'y ajoute de fait
//    pour cet écran : `competences_mesures.observables`, le JSONB des valeurs.
//    **On en DÉRIVE `acquis` ; on ne le SERT jamais.**
//
// ⛔ LE PROFIL EST UNIFIÉ PAR ÉLÈVE ET N'A AUCUN `classe_id` (`07-` §1.3 : « le
//    profil est unifié par élève, les deux parcours portant les six compétences
//    sur une échelle commune »). ⚠️ **On ne filtre JAMAIS le profil par classe** :
//    `competences_mesures.classe_id` est NULL la plupart du temps, et filtrer
//    dessus compterait une partie des mesures.
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une lecture ratée n'est pas
//    « rien à montrer » — **on le dit au serveur, et l'écran le dit à l'élève**
//    plutôt que d'affirmer un profil vide (leçon C11a). Il PLAFONNE aussi à 1000
//    lignes sans rien dire : `competences_mesures` grandit, d'où la pagination.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { COMPETENCES, type Competence } from '@/utils/chaine/types'
import { NOM_COMPETENCE } from '@/utils/competences-classe'
import { instrumentDuRouteur } from '@/utils/moteur/etat-serveur'
import { mesuresQuiComptent } from '@/utils/routeur/mesure'
import { fenetreDEvidence } from '@/utils/routeur/profil'
import { etatDesObservables, type EtatObservable } from '@/utils/routeur/observables'
import { lireLesStatutsAvecDate } from '@/utils/statut-recette'
import { hrefDuDeroule, atelierDUnFormatif } from '@/utils/codex-onglets/regles'
import {
  forcesDeLaCompetence, lettreVisible, progressionALaLecture,
  type DimensionDite, type GesteConcret, type MesurePourLEleve, type Progression,
  type VerdictDeLettre,
} from './profil'

type Admin = SupabaseClient
const PAGE = 1000

/** Ce qu'une compétence rend à l'écran de l'élève — ET RIEN DE PLUS. */
export interface CompetenceDeLEleve {
  competence: Competence
  /** Le nom en français, pour le titre. */
  nom: string
  /** « travaillé N fois » — un décompte RÉEL (`06-` §5). */
  n: number
  progression: Progression
  /** ⛔ `null` tant que les TROIS conditions ne sont pas réunies (`profil.ts`). */
  lettre: string | null
  /** Ce que l'écran DIT quand la lettre se tait — jamais le nom d'un interrupteur. */
  motDeLaLettre: string | null
  /** Les dimensions ACQUISES, nommées. ⛔ Des noms, jamais un taux. */
  forces: string[]
  /** Trace serveur : les codes élus sans `dimension_eleve`. Jamais l'écran. */
  formulationsManquantes: string[]
}

export interface ProfilDeLEleve {
  competences: CompetenceDeLEleve[]
  /** ⭐ « Prochaine étape » — le dernier retour PUBLIÉ. `null` s'il n'y en a pas. */
  geste: GesteConcret | null
  /** L'état de la garde des lettres, pour l'écran (la bascule, son motif). */
  lettres: VerdictDeLettre
  /** `true` dès qu'UNE compétence est encore `profil_provisoire` — pour la trace. */
  profilProvisoire: boolean
  /** ⚠️ Une lecture ratée SE DIT. Vide = tout s'est lu. */
  incidents: string[]
}

/**
 * ⭐ LE PROFIL, ASSEMBLÉ POUR UN ÉLÈVE.
 *
 * @param choixDeLEleve la troisième condition d'une lettre — « c'est l'élève qui
 *                      choisit d'en voir plus ; le système ne le décide pas pour
 *                      lui » (`06-` §5). ⛔ Un défaut à « affiché » n'est pas un
 *                      choix : l'appelant passe ce que l'élève a demandé.
 */
export async function chargerLeProfilDeLEleve(
  admin: Admin, eleveId: string, choixDeLEleve: boolean,
): Promise<ProfilDeLEleve> {
  const incidents: string[] = []

  const [niveaux, mesures, dimensions, affichageActif, statuts, geste] = await Promise.all([
    lireLesNiveaux(admin, eleveId, incidents),
    lireLesMesuresDeLEleve(admin, eleveId, incidents),
    lireLaCorrespondance(admin, incidents),
    lireLaPorteDesLettres(admin, incidents),
    lireLesStatutsAvecDate(admin as never),
    lireLeDernierGeste(admin, eleveId, incidents),
  ])

  if (statuts.length === 0) {
    incidents.push('les statuts de recette : aucune ligne lue — les bornes de recette sont '
      + 'inconnues, et le décompte peut inclure des mesures d’avant la recette.')
  }
  const borneDe = new Map(statuts.map((s) => [s.competence as string, s.poseLe]))

  // ⚠️⚠️ `profil_provisoire` EST PAR (ÉLÈVE × COMPÉTENCE), ET LA GARDE SE POSE
  //    LIGNE PAR LIGNE. Le `01-` §9 parle d'une compétence : « tant qu'il est
  //    vrai, aucune lettre ne s'affiche ». Fermer TOUTES les lettres dès qu'UNE
  //    ligne est provisoire serait plus strict que la source — et cacherait une
  //    lettre que la règle autorise.
  //    ⭐ Aujourd'hui les six basculent ensemble (à la clôture du segment 2), et
  //       la différence ne se voit pas ; elle se verra le jour où une compétence
  //       entrera plus tard que les autres.
  const toutesProvisoires = niveaux.length > 0 && niveaux.every((n) => n.profilProvisoire)
  const auMoinsUneProvisoire = niveaux.some((n) => n.profilProvisoire)
  // Le verdict D'ENSEMBLE — il commande la phrase générale et l'offre de bascule.
  const lettres = lettreVisible(affichageActif, toutesProvisoires, choixDeLEleve)

  const parCompetence = new Map<string, MesurePourLEleve[]>()
  for (const m of mesures) {
    const l = parCompetence.get(m.competence) ?? []
    l.push(m)
    parCompetence.set(m.competence, l)
  }
  const dimsPar = new Map<string, DimensionDite[]>()
  for (const d of dimensions) {
    const l = dimsPar.get(d.competence) ?? []
    l.push({ observableCode: d.observableCode, dimensionEleve: d.dimensionEleve, ordre: d.ordre })
    dimsPar.set(d.competence, l)
  }

  const competences: CompetenceDeLEleve[] = COMPETENCES.map((c) => {
    const desMesures = parCompetence.get(c) ?? []
    const borne = borneDe.get(c) ?? null
    const instrument = instrumentDuRouteur(c)
    const requis = AUCUN_REQUIS
    // ⚠️ La seconde condition de la stagnation est la VALEUR DE CIBLAGE NON
    //    PLAFONNÉE, qui « ne se stocke jamais » (`07-` §1.3) et se recalcule au
    //    cycle. Cet écran ne la recalcule pas — il ne routera rien. On passe
    //    donc `false`, ce qui rend `ilYAStagnation` toujours faux : l'écran ne
    //    dira jamais « stagnation » à tort. Il dira « en cours de travail ».
    const progression = progressionALaLecture(desMesures, borne, instrument, requis, false)

    const dims = dimsPar.get(c) ?? []
    const comptent = mesuresQuiComptent(desMesures, borne)
    const etats: EtatObservable[] = instrument
      ? etatDesObservables(fenetreDEvidence(comptent) as never, instrument, requis)
      : []
    const { forces, formulationsManquantes } = forcesDeLaCompetence(etats, dims)

    const niveau = niveaux.find((n) => n.competence === c) ?? null
    // ⛔⛔ LA GARDE SE POSE ICI, PAR COMPÉTENCE, avec SON PROPRE
    //    `profil_provisoire`. Elle est lue DANS CE MODULE PARTAGÉ, jamais au
    //    site d'appel : « une garde qu'on peut oublier en écrivant un second
    //    écran n'est pas une garde. »
    // ⚠️ Une compétence SANS LIGNE de niveau est tenue pour PROVISOIRE : à
    //    défaut de savoir, on se tait — l'erreur inverse afficherait une lettre
    //    que rien n'autorise.
    const gardeDeCetteLettre = lettreVisible(
      affichageActif, niveau?.profilProvisoire ?? true, choixDeLEleve)
    return {
      competence: c,
      nom: NOM_COMPETENCE[c],
      n: progression.n,
      progression,
      lettre: gardeDeCetteLettre.visible ? (niveau?.lettre ?? null) : null,
      motDeLaLettre: gardeDeCetteLettre.phrase,
      forces,
      formulationsManquantes,
    }
  })

  return { competences, geste, lettres, profilProvisoire: auMoinsUneProvisoire, incidents }
}

/**
 * ⚠️ AUCUN OBSERVABLE « REQUIS » N'EST LU ICI, ET C'EST DÉLIBÉRÉ.
 *
 * `etatDesObservables(fenetre, instrument, requis)` ne se sert de `requis` que
 * pour renseigner `EtatObservable.requis` — le drapeau que la PRÉCONDITION HAUTE
 * de l'escalade lit (`01-` §8.3). **Cet écran n'escalade rien** : il n'en lit
 * jamais la valeur, et la passer vide ne change aucun `taux` ni aucun `acquis`.
 *
 * ⛔ Aller la chercher coûterait une lecture de `competences_fiches` par
 *    compétence pour un champ que personne ne regarde — et `observablesRequis`
 *    LÈVE sur une fiche illisible, ce qui casserait un écran pour rien.
 */
const AUCUN_REQUIS: readonly string[] = []

// ════════════════════════════════════════════════════════════════════════════
// LES LECTURES
// ════════════════════════════════════════════════════════════════════════════

interface NiveauLu { competence: string; lettre: string | null; profilProvisoire: boolean }

async function lireLesNiveaux(
  admin: Admin, eleveId: string, incidents: string[],
): Promise<NiveauLu[]> {
  const { data, error } = await admin
    .from('competences_niveaux')
    .select('competence, lettre, profil_provisoire')
    .eq('eleve_id', eleveId)
  if (error) {
    incidents.push(`tes niveaux : ${error.code} ${error.message}`)
    // ⚠️ On rend « provisoire » plutôt que « rien » : à défaut de savoir, on se
    //    tait sur les lettres. L'erreur inverse afficherait une lettre interdite.
    return COMPETENCES.map((c) => ({ competence: c, lettre: null, profilProvisoire: true }))
  }
  return (data ?? []).map((n) => ({
    competence: n.competence as string,
    lettre: (n.lettre ?? null) as string | null,
    profilProvisoire: n.profil_provisoire === true,
  }))
}

/**
 * ⚠️ PAGINÉE, et le motif est mesuré : supabase-js plafonne à 1000 lignes SANS
 *    RIEN DIRE. Le patron est celui de `lireLesMesures`
 *    (`utils/competences-classe.ts`), avec sa clé de tri UNIQUE — `mesure_at`
 *    seul ne départage pas deux mesures simultanées, et la chaîne en écrit six
 *    d'affilée pour un même dépôt.
 */
async function lireLesMesuresDeLEleve(
  admin: Admin, eleveId: string, incidents: string[],
): Promise<MesurePourLEleve[]> {
  const out: MesurePourLEleve[] = []
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await admin
      .from('competences_mesures')
      .select('id, competence, observables, mesure_at, sonde_montee')
      .eq('eleve_id', eleveId)
      .order('mesure_at', { ascending: true })
      .order('id', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) {
      incidents.push(`tes mesures : ${error.code} ${error.message}`)
      return []
    }
    const page = data ?? []
    out.push(...page.map((m) => ({
      competence: m.competence as string,
      observables: (m.observables ?? null) as Record<string, unknown> | null,
      mesureAt: m.mesure_at as string,
      sondeMontee: m.sonde_montee === true,
    })))
    if (page.length < PAGE) break
  }
  return out
}

interface CorrespondanceLue extends DimensionDite { competence: string }

async function lireLaCorrespondance(
  admin: Admin, incidents: string[],
): Promise<CorrespondanceLue[]> {
  const { data, error } = await admin
    .from('competences_correspondance')
    .select('competence, observable_code, dimension_eleve, ordre')
  if (error) {
    incidents.push(`les noms des dimensions : ${error.code} ${error.message}`)
    return []
  }
  return (data ?? []).map((d) => ({
    competence: d.competence as string,
    observableCode: d.observable_code as string,
    dimensionEleve: (d.dimension_eleve ?? '') as string,
    ordre: (d.ordre ?? 0) as number,
  }))
}

/**
 * ⛔ `competences_affichage_actif`, ET LUI SEUL. Il répond à « les lettres
 *    sont-elles visibles ? » (`07-` §5). ⚠️ Pas `chaine_actif`, que la coupure
 *    automatique de coût éteint : « une facture qui coupe le 12 du mois fermerait
 *    un écran que personne n'a décidé de fermer ». **Un lot lit LE SIEN.**
 *
 * ⚠️ Une lecture ratée tient la porte pour FERMÉE — comme `lireLaPorte`. Une
 *    porte qu'on affirme ouverte parce qu'on n'a pas su lire n'est pas une porte.
 */
async function lireLaPorteDesLettres(admin: Admin, incidents: string[]): Promise<boolean> {
  const { data, error } = await admin
    .from('scriptorium_params').select('competences_affichage_actif').limit(1).maybeSingle()
  if (error) {
    incidents.push(`l’affichage des lettres : ${error.code} ${error.message} — tenu pour fermé.`)
    return false
  }
  return data?.competences_affichage_actif === true
}

/**
 * ⭐⭐ « PROCHAINE ÉTAPE » — LE CANAL QUE CE LOT OUVRE.
 *
 * `exercices_retours.action_revision` est écrite par la chaîne
 * (`utils/chaine/retour.ts`) et CONTRÔLÉE — un retour v1 sans elle est refusé.
 * ⛔ Et seuls le PROFESSEUR (`utils/passation/vues.ts`) et le TEMPS 5 DU DÉROULÉ
 *    (`components/deroule/EcranDeroule.tsx`, le dépôt en cours seulement) la
 *    lisent. **Aucun écran de profil ne la lit : c'est le canal coupé ③.**
 *
 * ⛔⛔ `published_at` EST LA PORTE. « Ne montre JAMAIS un retour non publié à
 *    l'élève. » Mesuré le 28/08 : production, 64 retours, 14 publiés seulement.
 *
 * ⚠️⚠️ LE RATTACHEMENT À UNE COMPÉTENCE EST UN GESTE, PAS UNE LECTURE. Le seul
 *    rattachement ÉCRIT est la cible primaire — `routeur_decisions.cible_retenue`,
 *    à défaut `exercices.cible_primaire` (l'ordre du `07-` §1.1). **Les deux sont
 *    vides** : `routeur_decisions` = 0 ligne des deux côtés, `cible_primaire`
 *    NULL sur 251/251 en production. Alors on N'EN NOMME AUCUNE — et
 *    `phraseDuGeste` dit « le dernier conseil que Calame t'a donné », qui est vrai.
 */
async function lireLeDernierGeste(
  admin: Admin, eleveId: string, incidents: string[],
): Promise<GesteConcret | null> {
  const { data: depots, error: eDepots } = await admin
    .from('exercices_depots')
    .select('id, routeur_decision_id, exercices!inner(id, lieu, cible_primaire, modes_par_competence)')
    .eq('eleve_id', eleveId)
    .neq('statut', 'retire')
  if (eDepots) {
    incidents.push(`tes retours : ${eDepots.code} ${eDepots.message}`)
    return null
  }
  const ids = (depots ?? []).map((d) => d.id as string)
  if (ids.length === 0) return null

  const { data: retours, error } = await admin
    .from('exercices_retours')
    .select('depot_id, action_revision, published_at')
    .in('depot_id', ids)
    .not('published_at', 'is', null)
    .not('action_revision', 'is', null)
    .order('published_at', { ascending: false })
    .limit(1)
  if (error) {
    incidents.push(`tes retours : ${error.code} ${error.message}`)
    return null
  }
  const r = (retours ?? [])[0]
  if (!r) return null

  // `action_revision` est un jsonb `{ texte }` (`07-` §4, règle 5).
  const brut = r.action_revision as { texte?: unknown } | null
  const texte = typeof brut?.texte === 'string' ? brut.texte.trim() : ''
  if (!texte) return null

  const depot = (depots ?? []).find((d) => d.id === r.depot_id)
  const ex = premier(depot?.exercices) as Record<string, unknown> | null
  const cible = await cibleEcrite(admin, depot?.routeur_decision_id as string | null,
    (ex?.cible_primaire ?? null) as string | null)
  const atelier = atelierDUnFormatif(ex?.modes_par_competence)

  return {
    texte,
    competence: cible,
    publieLe: r.published_at as string,
    href: hrefDuDeroule(atelier, r.depot_id as string),
  }
}

/** L'ordre du `07-` §1.1 — la décision d'abord, l'instance ensuite. */
async function cibleEcrite(
  admin: Admin, decisionId: string | null, ciblePrimaire: string | null,
): Promise<Competence | null> {
  if (decisionId) {
    const { data } = await admin.from('routeur_decisions')
      .select('cible_retenue').eq('id', decisionId).maybeSingle()
    const c = (data?.cible_retenue ?? null) as string | null
    if (c && (COMPETENCES as readonly string[]).includes(c)) return c as Competence
  }
  return ciblePrimaire && (COMPETENCES as readonly string[]).includes(ciblePrimaire)
    ? ciblePrimaire as Competence
    : null
}

const premier = (v: unknown): unknown => (Array.isArray(v) ? v[0] ?? null : v ?? null)
