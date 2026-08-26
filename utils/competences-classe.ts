// ============================================================================
// LA GRILLE DES LETTRES, ET CE QU'IL Y A DESSOUS.
// ----------------------------------------------------------------------------
// L'onglet Compétences du profil de classe affichait un VIDE EXPLIQUÉ depuis
// C4-L11 : « la grille des lettres reviendra quand elle aura de quoi se
// remplir — `competences_niveaux` (`07-` §1.3), derrière
// `competences_affichage_actif` ». Elle a de quoi. Ce module l'assemble.
//
// ⭐ CE MODULE NE CALCULE AUCUN VERDICT, ET N'ÉCRIT AUCUNE RÈGLE. Il n'en a pas
//    le droit, et deux règles au moins vivent ailleurs :
//
//   « LE VERDICT — réussie ou ratée — NE SE STOCKE PAS : il se lit en
//     confrontant cette valeur au SEUIL DE RÉUSSITE déclaré à la fiche. »
//                                                — `01-` §8.2
//
//   Le seul juge d'UNE mesure est `statutDeLaMesure` / `tauxDeReussite`
//   (`utils/chaine/observables.ts`). Le seuil vient de l'instrument DÉRIVÉ de la
//   fiche, jamais recopié ici. Régler un seuil encore provisoire recalcule donc
//   tout l'historique affiché, sans réécrire une ligne.
//
// ⚠️⚠️ LA POPULATION DES MESURES EST CELLE DU ROUTEUR, PAS « TOUTES LES LIGNES ».
//    *Défaut trouvé à la revue du 26/08 par QUATRE lentilles indépendantes.*
//    La lettre affichée dans une cellule est écrite par `utils/moteur/etat-serveur.ts`
//    sur `mesuresQuiComptent(siennes, statutRecettePoseLe)` — qui retire DEUX
//    populations : les SONDES DE MONTÉE (`01-` §8.8 M-e, « neutres pour tout le
//    reste ») et les mesures ANTÉRIEURES à la pose du statut de recette (`07-`
//    §1.3 : « le recalcul de la lettre, depuis les seules mesures postérieures à
//    la recette »). Lire toutes les lignes aurait mis, côte à côte dans la même
//    cellule, un taux et une lettre qui ne portent pas sur le même ensemble —
//    exactement le reproche que ce module fait plus bas au filtrage par classe.
//    ⛔ La règle N'EST PAS RECOPIÉE : on appelle `mesuresQuiComptent`. Une copie
//    privée écrite pour l'ancienne forme a déjà coûté un écran entier (`C4L11-F`).
//    ⭐ Ce qui est écarté est COMPTÉ (`nbEcartees`) et dit à l'écran : une mesure
//    qui disparaît sans un mot est un fait perdu.
//
// ⚠️ « ACQUIS » A UNE DÉFINITION, ET CE N'EST PAS « RÉUSSI ». Deux seuils que le
//    `utils/routeur/observables.ts` dit « ne jamais confondre » : la RÉUSSITE
//    porte sur UNE mesure ; l'ACQUISITION porte sur la FENÊTRE D'ÉVIDENCE — les
//    quatre dernières mesures qui comptent, taux strictement > 2/3 (`01-` §3 ;
//    `estAcquis` + `SEUIL_ACQUISITION`). C'est l'acquisition qui décide de
//    l'escalade : l'écran doit donc dire CELLE-LÀ, sans quoi le professeur lit
//    un nombre et le routeur en applique un autre.
//
// ⚠️ « Pas de ligne » n'est pas « pas d'objet » — la leçon de
//    `c4_statut_recette_global.sql`. Les SIX compétences sont toujours
//    énumérées, et un élève sans aucune mesure rend six cellules, jamais zéro.
//
// ⚠️⚠️ LES MESURES SE LISENT PAR ÉLÈVE, PAS PAR CLASSE. `competences_niveaux` NE
//    PORTE AUCUN `classe_id` : la lettre est une propriété de l'ÉLÈVE (`07-`
//    §1.3), pas de son cours. Et le cas n'est pas théorique — deux élèves sont
//    inscrits dans deux classes (éprouvé en base, C4-L13). Une mesure venue d'un
//    autre cours se signale, elle ne se cache pas.
//
// ⚠️ `competences_mesures` GRANDIT — une ligne par élève, par compétence et par
//    dépôt. supabase-js PLAFONNE toute réponse à 1000 lignes SANS RIEN DIRE : la
//    lecture se pagine et se confronte au décompte (patron de `lirePagine`,
//    `utils/routeur/donnees.ts`), et un décompte INDISPONIBLE est un incident,
//    pas un succès.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { COMPETENCES, type Competence, type StatutRecette } from '@/utils/chaine/types'
import {
  etatCompetence,
  valeursDesParametres,
  type EntreeObservableMesure,
} from '@/utils/chaine/instruments'
import {
  statutDeLaMesure,
  tauxDeReussite,
  type Statut,
  type ValeurObservable,
} from '@/utils/chaine/observables'
import { mesuresQuiComptent } from '@/utils/routeur/mesure'
import { fenetreDEvidence } from '@/utils/routeur/profil'
import { estAcquis } from '@/utils/routeur/observables'
import { lireLesStatutsAvecDate, STATUT_PAR_DEFAUT } from '@/utils/statut-recette'
import { LETTRES_SECTIONS, type LettreSection } from '@/utils/notation'

type Admin = ReturnType<typeof createAdminClient>

/** Le nom d'affichage des six — l'ordre du référentiel vit dans `COMPETENCES`. */
export const NOM_COMPETENCE: Record<Competence, string> = {
  expression: 'Expression',
  argumentation: 'Argumentation',
  structure: 'Structure',
  connaissance: 'Connaissance',
  synthese: 'Synthèse',
  questionnement: 'Questionnement',
}

/**
 * Combien de points de série traversent la frontière RSC, par observable.
 *
 * ⚠️ LA CHARGE UTILE EST RÉELLE : une classe de trente, six compétences, neuf
 *    observables et trente mesures ferait passer au client des dizaines de
 *    milliers de points pour UNE cellule affichée à la fois. On borne, et
 *    L'ÉCRAN LE DIT quand il a coupé — un plafond silencieux se lirait comme
 *    « voilà tout l'historique ».
 */
export const SERIE_MAX = 12

/** Un point de la série d'un observable — une mesure, à sa date. */
export interface PointObservable {
  /** `mesure_at`, en ISO — un INSTANT : il se formate dans le fuseau de l'école. */
  date: string
  valeur: ValeurObservable | null
  statut: Statut
  /** `true` quand la mesure vient d'un AUTRE cours que celui qu'on regarde. */
  ailleurs: boolean
}

export interface ObservableEleve {
  code: string
  /** `competences_correspondance.dimension_eleve` — le nom DIT À L'ÉLÈVE. */
  nom: string
  /** `false` quand la fiche ne pose aucune question à l'élève sur cet observable. */
  ditALEleve: boolean
  /**
   * ⚠️ LA TÉLÉMÉTRIE PURE SE DÉCLARE À LA FICHE (`reussie: 'sans_objet'`), elle
   *    NE SE DÉDUIT PAS de l'absence d'une ligne de correspondance. Les deux ne
   *    coïncident pas : `contresens_partiel` de la Synthèse est absent de la
   *    correspondance et pourtant `reussie: 'au_plus'` — il JUGE l'élève.
   *    L'étiqueter « télémétrie » aurait fait écarter un signal qui compte.
   *    *Trouvé à la revue du 26/08.*
   */
  telemetriePure: boolean
  /** Ce que la fiche appelle « réussi » — son `sens`, pour que le seuil se montre. */
  sens: string | null
  famille: string
  ordre: number
  derniere: ValeurObservable | null
  statutDernier: Statut
  /**
   * L'ACQUISITION AU SENS DU ROUTEUR : taux sur la fenêtre d'évidence > 2/3.
   * `null` quand la fenêtre ne porte aucune mesure ayant un objet — « un
   * observable sans taux ne se classe pas ».
   */
  acquis: boolean | null
  tauxFenetre: number | null
  reussiesFenetre: number
  denominateurFenetre: number
  /** L'historique complet des mesures qui comptent — pour l'évolution, pas pour le verdict. */
  reussies: number
  denominateur: number
  taux: number | null
  serie: PointObservable[]
  /** `true` quand la série affichée a été bornée à `SERIE_MAX`. */
  serieTronquee: boolean
}

export interface CelluleCompetence {
  /**
   * LA LETTRE POSÉE — `competences_niveaux.lettre` (`07-` §1.3). C'est elle que
   * le routeur lit et que l'élève voit.
   *
   * ⚠️ ELLE N'EST PAS `lettre_equivalente`, et les confondre serait inventer un
   *    fait. Une mesure porte ce qu'ELLE valait ; la lettre posée est ce que la
   *    compétence VAUT. Les deux se séparent réellement : au 26/08, le bac à
   *    sable porte 102 niveaux à `lettre` NULLE sous des mesures qui, elles,
   *    portent leur lettre-équivalente.
   */
  lettre: LettreSection | null
  /** La PREMIÈRE lettre posée (`lettre_initiale`) — l'évolution de la lettre elle-même. */
  lettreInitiale: LettreSection | null
  /** Ce que valait la DERNIÈRE mesure qui compte. Un contexte, jamais la lettre. */
  lettreEquivalenteDerniere: LettreSection | null
  provisoire: boolean
  /** Les mesures QUI COMPTENT — sondes de montée et pré-recette déjà retirées. */
  nbMesures: number
  /** Combien ont été écartées, et pourquoi il ne faut pas les chercher à l'écran. */
  nbEcartees: number
  /** Combien de ces mesures viennent d'un autre cours — 0 le plus souvent. */
  nbAilleurs: number
  derniereMesure: string | null
  observables: ObservableEleve[]
}

export interface ColonneCompetence {
  code: Competence
  nom: string
  /** Fiche dérivée ET chaîne branchée — sinon la colonne ne peut rien porter. */
  ouverte: boolean
  motif: string | null
  statutRecette: StatutRecette
  /** La borne basse des mesures qui comptent. `null` ⇒ aucune borne. */
  statutPoseLe: string | null
  /** L'opt-out de CETTE classe : `false` = ce cours ne travaille pas la compétence. */
  active: boolean
  /**
   * Les mesures QUI COMPTENT pour LES ÉLÈVES de cette classe, TOUS COURS
   * CONFONDUS — c'est ce qui est compté, et l'écran le dit ainsi. (Compter par
   * `classe_id` mentirait dans l'autre sens : `classe_id` est NULL sur les
   * mesures maison, qui sont la majorité.)
   */
  nbMesures: number
}

export interface GrilleCompetencesClasse {
  colonnes: ColonneCompetence[]
  /**
   * Indexé `[eleveId][competence]` — les six sont toujours présentes par élève.
   *
   * ⚠️ UNE STRUCTURE IMBRIQUÉE, PAS UNE CLÉ COMPOSÉE : une clé `${a}|${b}` doit
   *    être reformée à l'identique par le client, et deux endroits qui écrivent
   *    le même format finissent par diverger. Ici il n'y a pas de format.
   */
  cellules: Record<string, Record<string, CelluleCompetence>>
  nbMesures: number
  /** Combien de cellules portent une lettre. Une lettre sans mesure en est une. */
  nbLettres: number
  /** Ce qui a échoué à la lecture. Une lecture ratée n'est pas une base vide. */
  incidents: string[]
}

function enLettre(v: unknown): LettreSection | null {
  return typeof v === 'string' && (LETTRES_SECTIONS as readonly string[]).includes(v)
    ? (v as LettreSection)
    : null
}

const PAGE = 1000

/**
 * La forme minimale qu'une mesure doit avoir pour que les règles du routeur
 * s'y appliquent — `mesuresQuiComptent` et `fenetreDEvidence` ne lisent que
 * `sondeMontee` et `mesureAt`, et leurs signatures sont génériques pour ça.
 */
interface MesureLue {
  eleveId: string
  competence: string
  observables: Record<string, ValeurObservable> | null
  mesureAt: string
  classeId: string | null
  lettreEquivalente: string | null
  sondeMontee: boolean
}

/**
 * Les mesures des élèves, PAGINÉES et CONFRONTÉES AU DÉCOMPTE.
 *
 * ⚠️ Le décompte se demande avec le MÊME filtre que la lecture, sinon les deux
 *    nombres ne portent pas sur le même ensemble. Et il part AVEC la première
 *    page : un constructeur de requête supabase-js est PARESSEUX — sans le
 *    `Promise.resolve`, rien ne serait émis avant le `await` du bas.
 */
async function lireLesMesures(
  admin: Admin, eleveIds: string[],
): Promise<{ lignes: MesureLue[]; incident: string | null }> {
  if (eleveIds.length === 0) return { lignes: [], incident: null }
  const cols = 'id, eleve_id, competence, observables, mesure_at, classe_id, '
    + 'lettre_equivalente, sonde_montee'
  const decompte = Promise.resolve(
    admin.from('competences_mesures')
      .select(cols, { count: 'exact', head: true })
      .in('eleve_id', eleveIds))

  const brutes: Array<Record<string, unknown>> = []
  for (let debut = 0; ; debut += PAGE) {
    const { data, error } = await admin
      .from('competences_mesures')
      .select(cols)
      .in('eleve_id', eleveIds)
      // Une clé de tri UNIQUE, sinon deux pages peuvent se recouvrir ou se
      // manquer : `mesure_at` seul ne départage pas deux mesures simultanées,
      // et la chaîne en écrit six d'affilée pour un même dépôt.
      .order('mesure_at', { ascending: true })
      .order('id', { ascending: true })
      .range(debut, debut + PAGE - 1)
    if (error) return { lignes: [], incident: `les mesures des élèves : ${error.message}` }
    const page = (data ?? []) as unknown as Array<Record<string, unknown>>
    brutes.push(...page)
    if (page.length < PAGE) break
  }

  const lignes: MesureLue[] = brutes.map((m) => ({
    eleveId: m.eleve_id as string,
    competence: m.competence as string,
    observables: (m.observables ?? null) as Record<string, ValeurObservable> | null,
    mesureAt: m.mesure_at as string,
    classeId: (m.classe_id ?? null) as string | null,
    lettreEquivalente: (m.lettre_equivalente ?? null) as string | null,
    sondeMontee: m.sonde_montee === true,
  }))

  const { count, error } = await decompte
  if (error) return { lignes, incident: `le décompte des mesures : ${error.message}` }
  // ⚠️ UN DÉCOMPTE INDISPONIBLE N'EST PAS UNE CONFRONTATION RÉUSSIE : la lecture
  //    a pu s'arrêter tôt, et c'est précisément le symptôme que la pagination
  //    existe pour produire. `lirePagine` lève dans les deux cas ; on le dit.
  if (count === null) {
    return { lignes, incident: 'les mesures des élèves : décompte indisponible — rien ne '
      + 'garantit que la lecture a tout rendu, les taux peuvent être partiels.' }
  }
  if (count !== lignes.length) {
    return {
      lignes,
      incident: `les mesures des élèves : ${lignes.length} ligne(s) lue(s) pour ${count} `
        + 'en base — la lecture a été tronquée, les taux affichés porteraient sur '
        + 'une partie seulement des mesures.',
    }
  }
  return { lignes, incident: null }
}

/**
 * La grille d'une classe : les six colonnes, et une cellule par élève et par
 * compétence — toujours les six, même vides.
 *
 * `eleveIds` vient de la matrice de pilotage, déjà chargée par la page : la
 * liste des inscrits ne se relit pas une seconde fois.
 */
export async function chargerGrilleCompetences(
  admin: Admin,
  classeId: string,
  eleveIds: string[],
  optOut: Record<string, boolean>,
): Promise<GrilleCompetencesClasse> {
  const incidents: string[] = []

  const [rNiveaux, rMesures, rCorresp, statutsAvecDate] = await Promise.all([
    admin.from('competences_niveaux')
      .select('eleve_id, competence, lettre, lettre_initiale, profil_provisoire')
      .in('eleve_id', eleveIds.length ? eleveIds : ['00000000-0000-0000-0000-000000000000']),
    lireLesMesures(admin, eleveIds),
    admin.from('competences_correspondance')
      .select('competence, observable_code, dimension_eleve, ordre, deposee_at'),
    lireLesStatutsAvecDate(admin),
  ])

  if (rNiveaux.error) incidents.push(`les niveaux : ${rNiveaux.error.message}`)
  if (rMesures.incident) incidents.push(rMesures.incident)
  if (rCorresp.error) incidents.push(`la correspondance des observables : ${rCorresp.error.message}`)
  // `lireLesStatutsAvecDate` rend un tableau vide quand la lecture échoue ; sans
  // borne, on compterait des mesures d'avant la recette. Le dire, pas le deviner.
  if (statutsAvecDate.length === 0) {
    incidents.push('les statuts de recette : aucune ligne lue — les bornes de recette '
      + 'sont inconnues, et les taux peuvent inclure des mesures antérieures.')
  }

  const statutDe = new Map(statutsAvecDate.map((s) => [s.competence as string, s]))

  // ── Ce que la fiche DIT À L'ÉLÈVE, par observable ────────────────────────
  // Une fiche peut avoir été redéposée : on garde le dépôt le plus récent.
  const libelle = new Map<string, { nom: string; ordre: number; depuis: string }>()
  for (const l of (rCorresp.data ?? []) as unknown as Array<{
    competence: string; observable_code: string; dimension_eleve: string | null
    ordre: number | null; deposee_at: string | null
  }>) {
    const k = `${l.competence}|${l.observable_code}`
    const depuis = l.deposee_at ?? ''
    const dejaLa = libelle.get(k)
    if (dejaLa && dejaLa.depuis >= depuis) continue
    libelle.set(k, { nom: l.dimension_eleve ?? l.observable_code, ordre: l.ordre ?? 999, depuis })
  }

  // ── Les mesures, groupées par élève et par compétence (déjà triées) ──────
  const parCellule = new Map<string, MesureLue[]>()
  for (const m of rMesures.lignes) {
    const k = `${m.eleveId}|${m.competence}`
    const lot = parCellule.get(k)
    if (lot) lot.push(m)
    else parCellule.set(k, [m])
  }

  // ── Les niveaux, par élève et par compétence ─────────────────────────────
  const niveaux = new Map<string, {
    lettre: LettreSection | null; initiale: LettreSection | null; provisoire: boolean
  }>()
  for (const n of (rNiveaux.data ?? []) as unknown as Array<{
    eleve_id: string; competence: string; lettre: string | null
    lettre_initiale: string | null; profil_provisoire: boolean | null
  }>) {
    niveaux.set(`${n.eleve_id}|${n.competence}`, {
      lettre: enLettre(n.lettre),
      initiale: enLettre(n.lettre_initiale),
      provisoire: n.profil_provisoire ?? false,
    })
  }

  // ── Les cellules, et les comptes de colonne qu'elles alimentent ──────────
  const cellules: Record<string, Record<string, CelluleCompetence>> = {}
  for (const id of eleveIds) cellules[id] = {}
  const nbParCompetence = new Map<string, number>()
  let nbMesuresQuiComptent = 0
  let nbLettres = 0

  for (const code of COMPETENCES) {
    const etat = etatCompetence(code)
    const instrument = etat.instrument
    const declares: Array<[string, EntreeObservableMesure]> = instrument
      ? Object.entries(instrument.observables_mesure ?? {})
      : []
    const parametres = instrument ? valeursDesParametres(instrument) : {}
    const poseLe = statutDe.get(code)?.poseLe ?? null

    for (const eleveId of eleveIds) {
      const k = `${eleveId}|${code}`
      const toutes = parCellule.get(k) ?? []
      // ⭐ LA MÊME RÈGLE QUE CELLE QUI A ÉCRIT LA LETTRE — appelée, pas recopiée.
      const comptent = mesuresQuiComptent(toutes, poseLe)
      const fenetre = fenetreDEvidence(comptent)
      const niv = niveaux.get(k)

      const observables: ObservableEleve[] = declares.map(([obsCode, entree]) => {
        const valeurs = comptent.map((m) => m.observables?.[obsCode])
        const tout = tauxDeReussite(valeurs, entree, parametres)
        const surFenetre = tauxDeReussite(
          fenetre.map((m) => m.observables?.[obsCode]), entree, parametres)

        const serieComplete: PointObservable[] = comptent.map((m, i) => ({
          date: m.mesureAt,
          valeur: valeurs[i] ?? null,
          statut: statutDeLaMesure(valeurs[i], entree, parametres),
          ailleurs: m.classeId !== null && m.classeId !== classeId,
        }))
        const serie = serieComplete.slice(-SERIE_MAX)
        const dernier = serie.length ? serie[serie.length - 1] : null
        const dit = libelle.get(`${code}|${obsCode}`)
        return {
          code: obsCode,
          nom: dit?.nom ?? obsCode,
          ditALEleve: !!dit,
          telemetriePure: entree.reussie === 'sans_objet',
          sens: entree.sens ?? null,
          famille: entree.famille,
          ordre: dit?.ordre ?? 999,
          derniere: dernier?.valeur ?? null,
          statutDernier: dernier?.statut ?? 'sans_objet',
          acquis: surFenetre.taux === null ? null : estAcquis(surFenetre.taux),
          tauxFenetre: surFenetre.taux,
          reussiesFenetre: surFenetre.reussies,
          denominateurFenetre: surFenetre.denominateur,
          reussies: tout.reussies,
          denominateur: tout.denominateur,
          taux: tout.taux,
          serie,
          serieTronquee: serieComplete.length > serie.length,
        }
      })
      // L'ordre de la fiche telle qu'elle est dite à l'élève ; les observables
      // qu'aucune question ne porte ferment la marche.
      observables.sort((a, b) => (a.ordre - b.ordre) || a.nom.localeCompare(b.nom, 'fr'))

      const derniere = comptent.length ? comptent[comptent.length - 1] : null
      const lettre = niv?.lettre ?? null
      if (lettre) nbLettres += 1
      nbMesuresQuiComptent += comptent.length
      nbParCompetence.set(code, (nbParCompetence.get(code) ?? 0) + comptent.length)

      cellules[eleveId][code] = {
        lettre,
        lettreInitiale: niv?.initiale ?? null,
        lettreEquivalenteDerniere: enLettre(derniere?.lettreEquivalente),
        provisoire: niv?.provisoire ?? false,
        nbMesures: comptent.length,
        nbEcartees: toutes.length - comptent.length,
        nbAilleurs: comptent.filter((m) => m.classeId !== null && m.classeId !== classeId).length,
        derniereMesure: derniere?.mesureAt ?? null,
        observables,
      }
    }
  }

  const colonnes: ColonneCompetence[] = COMPETENCES.map((code) => {
    const etat = etatCompetence(code)
    const st = statutDe.get(code)
    return {
      code,
      nom: NOM_COMPETENCE[code],
      ouverte: etat.ouverte,
      motif: etat.motif,
      statutRecette: st?.statut ?? STATUT_PAR_DEFAUT,
      statutPoseLe: st?.poseLe ?? null,
      // Une ligne absente vaut « active » : « une compétence déclarée `evaluee`
      // l'est pour toutes les classes » (`07-` §1.3). Seules les `false` retirent.
      active: optOut[code] !== false,
      nbMesures: nbParCompetence.get(code) ?? 0,
    }
  })

  return { colonnes, cellules, nbMesures: nbMesuresQuiComptent, nbLettres, incidents }
}
