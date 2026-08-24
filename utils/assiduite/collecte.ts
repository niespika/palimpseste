// ============================================================================
// C4 · L13 — LA COLLECTE D'ASSIDUITÉ : la JONCTION, et rien d'autre.
// ----------------------------------------------------------------------------
// `07-` §1.5 — « `assiduite_hebdo`, par élève et par semaine, la semaine étant
// le CYCLE. Le nombre d'exercices ASSIGNÉS et TERMINÉS, et le booléen "semaine
// faite" AU SEUIL CONFIGURÉ. » — « **Elle est collectée dès la rentrée**, même
// si les écrans attendent : un semestre ne se recompte pas après coup. »
//
// ⭐ CE FICHIER NE CALCULE AUCUNE RÈGLE NEUVE. Les règles existent, pures et
//    éprouvées, à `utils/routeur/assiduite.ts` — `estRendu`,
//    `entreAuDenominateur`, `semaineFaite`, `retraitCompteDansLaSemaine`. Ce qui
//    manquait est la SOUDURE : passer d'une liste de dépôts à un couple
//    (assignés, terminés) pour un (élève × cycle_lundi). C'est tout ce qui est ici.
//
// ⛔ IL NE POSE JAMAIS LES MINUTES. Les trois colonnes de minutes vivent sur LA
//    MÊME LIGNE (clé primaire partagée `eleve_id, cycle_lundi`) et appartiennent
//    à `C4-L12` : elles sont une SORTIE DU ROUTEUR, pas de la collecte. Une clé
//    qu'on n'envoie pas garde sa valeur ; une clé envoyée à `null` efface un
//    budget réel sans un mot. D'où `CLES_INTERDITES` et `memeJeuDeCles`,
//    ci-dessous — et l'épreuve en base qui les a fondées (relevé C4-L13, §1).
//
// ⚠️ CE FICHIER EST PUR — aucun `server-only`, aucun accès base. Le glob de
//    `npm test` est `utils/**/*.test.ts` : une règle posée sous `app/` ne serait
//    JAMAIS éprouvée, sans qu'aucun message ne le dise. L'écrivain, lui, vit à
//    `collecte-serveur.ts`, à côté.
// ============================================================================

import { calculerGrilleSemaines, toISODate } from '../calendrier-grille'
import { lundiDuCycle } from '../deroule/echeance'
import {
  entreAuDenominateur, estRendu, semaineFaite,
  type SeuilsAssiduite,
} from '../routeur/assiduite'

// ════════════════════════════════════════════════════════════════════════════
// LA JONCTION — d'une liste de dépôts à (assignés, terminés)
// ════════════════════════════════════════════════════════════════════════════

/**
 * Un dépôt, réduit à ce que l'assiduité en lit. **Trois champs, pas un de plus** :
 * `exercices_depots` ne porte AUCUNE colonne de cycle ni de semaine, et le
 * rattachement se dérive donc d'`assigne_at` (`07-` §1.1 ; relevé C4-L13 §1).
 */
export interface DepotACompter {
  eleveId: string
  statut: string
  /** Un INSTANT (`timestamptz`) — `assigne_at`, `not null default now()`. */
  assigneAt: string
}

/** Ce que l'écrivain pose sur la ligne, et ce que l'écran relit. */
export interface CompteDeSemaine {
  assignes: number
  termines: number
}

export interface TriDesDepots {
  /** Par élève, le couple (assignés, terminés) de la semaine visée. */
  parEleve: Map<string, CompteDeSemaine>
  /** Les dépôts de la semaine visée entrés au dénominateur. */
  retenus: number
  /** Les dépôts de la semaine visée SORTIS du dénominateur — `statut = 'retire'`. */
  retires: number
  /** Les dépôts passés qui ne tombent pas dans la semaine visée. */
  horsSemaine: number
}

/**
 * ⭐ LA JONCTION. Une liste de dépôts → `(assignes, termines)` par élève, pour
 * UNE semaine.
 *
 * **Le rattachement passe par `assigne_at`, et c'est le seul chemin TOTAL.**
 * Les deux autres sont morts sur la voie du professeur — celle-là même qu'on
 * compte : `routeur_decisions.cycle_lundi` est NULL (`assignerALaClasse()`
 * n'écrit jamais cette clé) et `exercices_planifies.semaine_lundi` demande deux
 * sauts et deux NULL possibles. `assigne_at` est `not null`, il n'est JAMAIS
 * réécrit à la ré-assignation (`app/prof/conception/actions.ts`), et c'est déjà
 * l'usage du dépôt : la semaine d'un dépôt est figée à sa première assignation.
 *
 * ⚠️ **Le fuseau décide, et ce n'est pas un détail.** `lundiDuCycle` lit
 * l'INSTANT dans le fuseau de l'école : « un dépôt du dimanche 20 h 30 à Toronto
 * est le lundi 00 h 30 UTC — lu en UTC il ouvrirait la semaine SUIVANTE », à
 * l'heure exacte à laquelle les élèves déposent.
 *
 * ⚠️ **`retire` sort du dénominateur, `abandonne` y reste** : « l'un est une
 * décision du professeur, l'autre un non-geste de l'élève, ET L'ASSIDUITÉ MESURE
 * L'ÉLÈVE » (`07-` §1.1). La règle est `entreAuDenominateur`, on ne la recopie pas.
 */
export function comptesDeLaSemaine(
  depots: readonly DepotACompter[], cycleLundi: string, fuseau: string,
): TriDesDepots {
  const parEleve = new Map<string, CompteDeSemaine>()
  let retenus = 0
  let retires = 0
  let horsSemaine = 0

  for (const d of depots) {
    if (toISODate(lundiDuCycle(new Date(d.assigneAt), fuseau)) !== cycleLundi) {
      horsSemaine++
      continue
    }
    if (!entreAuDenominateur(d.statut)) {
      retires++
      continue
    }
    retenus++
    const c = parEleve.get(d.eleveId) ?? { assignes: 0, termines: 0 }
    c.assignes++
    if (estRendu(d.statut)) c.termines++
    parEleve.set(d.eleveId, c)
  }

  return { parEleve, retenus, retires, horsSemaine }
}

// ════════════════════════════════════════════════════════════════════════════
// LA POPULATION DE SEMAINES — « le dénominateur vient du Calendrier »
// ════════════════════════════════════════════════════════════════════════════

/** Une semaine de travail : son lundi, son dimanche, son numéro pédagogique. */
export interface SemaineDeTravail {
  lundi: string
  dimanche: string
  numero: number | null
}

/**
 * ⭐ LES SEMAINES DE TRAVAIL des semestres — vacances SAUTÉES. Patron de
 * `chargerLesSegments()` (`app/prof/routeur/serveur.ts`), copié parce qu'il fait
 * exactement ce qu'il faut : semestres non archivés + vacances, puis
 * `calculerGrilleSemaines`, puis `if (w.isVacation) continue`.
 *
 * ⚠️ **Le semestre est GLOBAL au professeur** — aucun lien élève↔semestre,
 * aucun lien classe↔semestre : le rattachement se fait PAR LES DATES, jamais par
 * `is_active`.
 *
 * ⚠️ **« Les semaines de vacances sortent du dénominateur »** (`06-` §5). Elles
 * en sortent ICI, par omission — c'est ce qui rend le dénominateur juste sans
 * qu'une colonne `en_vacances` existe. Voir `enVacances` au relevé C4-L13 §2.
 */
export function semainesDeTravail(
  semestres: readonly { id: string; start_date: string; end_date: string }[],
  vacances: readonly { semester_id: string; label: string; start_date: string; end_date: string }[],
): SemaineDeTravail[] {
  const out: SemaineDeTravail[] = []
  for (const s of semestres) {
    const h = vacances
      .filter((v) => v.semester_id === s.id)
      .map((v) => ({ label: v.label, start_date: v.start_date, end_date: v.end_date }))
    for (const w of calculerGrilleSemaines(s, h)) {
      if (w.isVacation) continue
      out.push({ lundi: w.start, dimanche: w.end, numero: w.pedagogicalNumber })
    }
  }
  return out.sort((a, b) => (a.lundi < b.lundi ? -1 : a.lundi > b.lundi ? 1 : 0))
}

/** La semaine visée est-elle une semaine de TRAVAIL ? Hors calendrier → aucune ligne. */
export function trouverLaSemaine(
  lundi: string, semaines: readonly SemaineDeTravail[],
): SemaineDeTravail | null {
  return semaines.find((s) => s.lundi === lundi) ?? null
}

// ════════════════════════════════════════════════════════════════════════════
// LA LIGNE À POSER — et les trois clés qu'elle ne porte JAMAIS
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔ LES TROIS COLONNES QUI NE SONT PAS À CE LOT. Elles vivent sur la même ligne
 * que la nôtre et appartiennent à `C4-L12` : « ce lot pose la LIGNE et ses deux
 * agrégats ; `C4-L12` remplit les minutes de cette même ligne. »
 */
export const CLES_INTERDITES = [
  'minutes_assignees', 'minutes_budget_plancher', 'minutes_budget_plafond',
] as const

/** La charge utile d'une ligne — exactement six clés, toujours les mêmes. */
export interface LigneAPoser {
  eleve_id: string
  cycle_lundi: string
  exercices_assignes: number
  exercices_termines: number
  semaine_faite: boolean
  updated_at: string
}

/**
 * ⚠️ **`semaine_faite` SE CALCULE, il ne se laisse JAMAIS au défaut de la base.**
 * La colonne est `not null default false`, quand la règle dit qu'une semaine
 * SANS exercice assigné est faite PAR CONSTRUCTION — `completion()` rend `null`,
 * « et ce n'est pas 0 », et `semaineFaite()` rend `true`. Le défaut de la base
 * est donc le CONTRAIRE de la règle.
 *
 * ⚠️ **Le seuil est celui de `lireLesSeuils`, et pas un autre.** « Semaine
 * faite » a deux vérités — la colonne stockée, que seule la vue SQL
 * `assiduite_hebdo_classe` lit, et le recalcul TS des écrans : deux seuils
 * différents donneraient deux chiffres sans qu'aucun signal ne le dise.
 *
 * ⚠️ **`updated_at` n'a AUCUN trigger** et son `default` ne joue qu'à l'INSERT :
 * un `upsert` qui ne le pose pas laisse l'horodatage de la première pose, et on
 * perd la seule trace qui dise que le cron est passé cette semaine.
 */
export function ligneDAssiduite(
  eleveId: string, cycleLundi: string, compte: CompteDeSemaine,
  seuils: SeuilsAssiduite, maintenant: string,
): LigneAPoser {
  return {
    eleve_id: eleveId,
    cycle_lundi: cycleLundi,
    exercices_assignes: compte.assignes,
    exercices_termines: compte.termines,
    semaine_faite: semaineFaite({
      cycleLundi,
      exercicesAssignes: compte.assignes,
      exercicesTermines: compte.termines,
      // `enVacances` est câblé à `false` aux trois sites du dépôt, et la table
      // n'a aucune colonne pour le porter. Ici il est SANS OBJET par
      // construction : on ne pose que des semaines DE TRAVAIL (relevé §2).
      enVacances: false,
    }, seuils),
    updated_at: maintenant,
  }
}

/**
 * ⭐ LA GARDE DU LOT — éprouvée en base avant d'être écrite (relevé §1).
 *
 * Deux faits d'API, pas de source :
 *  · une clé ABSENTE de la charge garde sa valeur en base — c'est ce qui permet
 *    de ne jamais toucher les minutes de `C4-L12` ;
 *  · mais **un `upsert` EN LOT unifie les colonnes de son tableau** : une clé
 *    présente sur UNE SEULE ligne devient une colonne de TOUTES, et celles qui
 *    ne la portaient pas partent à `NULL`. Vérifié : une ligne portant
 *    `minutes_assignees` dans le même envoi qu'une ligne sans a mis la seconde
 *    à `NULL`.
 *
 * D'où deux vérifications, et elles LÈVENT : aucune clé interdite, et toutes les
 * lignes d'un même envoi portent EXACTEMENT le même jeu de clés.
 */
export class ChargeUtileInvalide extends Error {}

export function verifierLaCharge(lignes: readonly LigneAPoser[]): void {
  if (lignes.length === 0) return
  const reference = Object.keys(lignes[0]).sort()
  for (const cle of CLES_INTERDITES) {
    if (reference.includes(cle)) {
      throw new ChargeUtileInvalide(
        `\`${cle}\` est une colonne de C4-L12 : la collecte ne l'écrit jamais.`)
    }
  }
  for (const l of lignes) {
    const cles = Object.keys(l).sort()
    if (cles.length !== reference.length || cles.some((c, i) => c !== reference[i])) {
      throw new ChargeUtileInvalide(
        'jeux de clés HÉTÉROGÈNES dans un même envoi — un upsert en lot les unifie, '
        + `et les manquantes partiraient à NULL. Attendu [${reference.join(', ')}], `
        + `reçu [${cles.join(', ')}].`)
    }
  }
}

/**
 * ⛔ **Deux lignes de MÊME CLÉ dans un seul `upsert` sont REFUSÉES par Postgres**
 * — `21000 : ON CONFLICT DO UPDATE command cannot affect row a second time`.
 * Vérifié en base. Le cas n'est pas théorique : **un élève peut être inscrit
 * dans DEUX classes** (constaté en sandbox), et une population construite classe
 * par classe le compterait deux fois.
 */
export function dedoublonner(eleveIds: readonly string[]): string[] {
  return [...new Set(eleveIds)]
}

// ════════════════════════════════════════════════════════════════════════════
// LE LOTISSEMENT — « aucun helper de découpage d'ÉCRITURE n'existe »
// ════════════════════════════════════════════════════════════════════════════

/**
 * Le plafond d'un envoi. On écrit une ligne par élève × semaine, sur TOUTES les
 * classes ; le plafond de 1000 lignes de supabase-js ne signale rien, ni en
 * lecture ni en écriture. On lotit donc, et on le dit au bilan.
 */
export const LIGNES_PAR_ENVOI = 500

export function lotir<T>(lignes: readonly T[], taille = LIGNES_PAR_ENVOI): T[][] {
  if (taille <= 0) throw new ChargeUtileInvalide('taille de lot invalide.')
  const lots: T[][] = []
  for (let i = 0; i < lignes.length; i += taille) lots.push(lignes.slice(i, i + taille))
  return lots
}
