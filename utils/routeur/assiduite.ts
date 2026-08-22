// ============================================================================
// C4 · L2 — L'ASSIDUITÉ (`06-` §5 ; `07-` §1.5).
// ----------------------------------------------------------------------------
// « La plateforme produit DEUX MESURES D'ASSIDUITÉ, ET RIEN DE PLUS : le TAUX
//   D'INACTIVITÉ HEBDOMADAIRE PAR CLASSE, et le POURCENTAGE D'ASSIDUITÉ PAR ÉLÈVE. »
//
//     % d'assiduité = semaines faites ÷ (semaines du semestre − semaines de vacances)
//
// ⚠️ DEUX VALEURS SONT DÉCLARÉES RÉGLAGES, « JAMAIS UNE CONSTANTE EN DUR » : le
//    SEUIL DE « SEMAINE FAITE » (trois quarts) et LA MOITIÉ qui sépare l'orange du
//    rouge à la frise. Elles arrivent donc EN PARAMÈTRE, depuis la configuration ;
//    les valeurs ci-dessous sont des DÉFAUTS DE DÉMARRAGE, pas des décisions.
//
// ⚠️ « UN EXERCICE RETIRÉ PAR LE PROFESSEUR SORT DU DÉNOMINATEUR, MAIS POUR
//    L'AVENIR SEULEMENT : une semaine dont le compte est déjà arrêté NE SE
//    RECALCULE PAS. Un chiffre déjà montré au professeur ne bouge plus. »
//    Et `retire` NE SE CONFOND JAMAIS avec `abandonne` : « l'un est une décision
//    du professeur, l'autre un non-geste de l'élève, ET L'ASSIDUITÉ MESURE L'ÉLÈVE ».
//
// ⚠️ « Une semaine SANS EXERCICE ASSIGNÉ est "faite" PAR CONSTRUCTION — JAMAIS UNE
//    DIVISION PAR ZÉRO. »
//
// ⚠️ « AUCUNE NOTE, NULLE PART, SOUS AUCUNE FORME. » Et pas de fausse précision :
//    `n` est un DÉCOMPTE RÉEL — « aucune "confiance" agrégée ne s'affiche ».
//
// Ce fichier est PUR.
// ============================================================================

/**
 * `06-` §5 — les deux réglages, et leurs valeurs de DÉMARRAGE.
 * « La valeur est arrêtée ; elle reste UN PARAMÈTRE DE CONFIGURATION. »
 */
export const SEUILS_DE_DEMARRAGE = {
  /** « Une semaine est "faite" quand l'élève a rendu au moins TROIS QUARTS de ses assignés. » */
  semaineFaite: 0.75,
  /** « ORANGE : au moins LA MOITIÉ sans atteindre le seuil ; ROUGE : sous la moitié. » */
  borneBasseFrise: 0.5,
  /** « La classe a fait sa semaine quand LES TROIS QUARTS de ses élèves ont fait la leur. » */
  contratDeClasse: 0.75,
} as const

export interface SeuilsAssiduite {
  semaineFaite: number
  borneBasseFrise: number
  contratDeClasse: number
}

// ════════════════════════════════════════════════════════════════════════════
// LA SEMAINE D'UN ÉLÈVE
// ════════════════════════════════════════════════════════════════════════════

/** `07-` §1.5 — une ligne d'`assiduite_hebdo`, par élève et par semaine. */
export interface SemaineEleve {
  cycleLundi: string
  exercicesAssignes: number
  exercicesTermines: number
  /** Vrai quand la semaine tombe en vacances — elle sort du dénominateur. */
  enVacances: boolean
}

/**
 * `06-` §5 — la COMPLÉTION d'une semaine : « ses exercices RENDUS sur ses
 * exercices ASSIGNÉS ». `null` quand rien n'était assigné — et ce n'est pas 0.
 */
export function completion(s: Pick<SemaineEleve, 'exercicesAssignes' | 'exercicesTermines'>): number | null {
  if (s.exercicesAssignes === 0) return null
  return s.exercicesTermines / s.exercicesAssignes
}

/**
 * `06-` §5 — « une semaine est FAITE quand l'élève a rendu au moins trois quarts
 * de ses exercices assignés ».
 *
 * « Une semaine SANS EXERCICE ASSIGNÉ est faite PAR CONSTRUCTION. »
 */
export function semaineFaite(s: SemaineEleve, seuils: SeuilsAssiduite): boolean {
  const c = completion(s)
  if (c === null) return true
  return c >= seuils.semaineFaite
}

export interface AssiduiteEleve {
  /** Le numérateur : les semaines faites, hors vacances, plus au plus une de vacances. */
  semainesFaites: number
  /** Le dénominateur : semaines du semestre − semaines de vacances. */
  denominateur: number
  /** `null` quand le dénominateur est nul — jamais une division par zéro. */
  pourcentage: number | null
  /** `06-` §5 — « le travail de vacances ajoute AU PLUS UNE SEMAINE au numérateur ». */
  bonusVacances: 0 | 1
}

/**
 * `06-` §5 — le pourcentage d'assiduité d'un élève sur un semestre.
 *
 * « LES SEMAINES DE VACANCES SORTENT DU DÉNOMINATEUR — sans jamais empêcher qui
 *   veut de travailler ; le travail fait pendant les vacances peut ajouter AU PLUS
 *   UNE SEMAINE au numérateur, SUR TOUT LE SEMESTRE. »
 *
 * « Le dénominateur vient du module Calendrier » : `semainesDuSemestre` est ce
 * qu'il rend, ce module ne le recompte pas.
 */
export function assiduiteDeLEleve(
  semaines: readonly SemaineEleve[], seuils: SeuilsAssiduite,
): AssiduiteEleve {
  const horsVacances = semaines.filter((s) => !s.enVacances)
  const vacances = semaines.filter((s) => s.enVacances)

  const faites = horsVacances.filter((s) => semaineFaite(s, seuils)).length
  // « AU PLUS UNE semaine, sur tout le semestre » — et seulement si du travail a eu lieu.
  const aTravailleEnVacances = vacances.some((s) => s.exercicesTermines > 0)
  const bonusVacances: 0 | 1 = aTravailleEnVacances ? 1 : 0

  const denominateur = horsVacances.length
  if (denominateur === 0) {
    return { semainesFaites: faites + bonusVacances, denominateur: 0, pourcentage: null, bonusVacances }
  }
  const numerateur = faites + bonusVacances
  return {
    semainesFaites: numerateur,
    denominateur,
    // Le bonus peut pousser au-delà de 100 % : on borne l'affichage, pas le compte.
    pourcentage: Math.min(1, numerateur / denominateur),
    bonusVacances,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LA CLASSE — le taux d'inactivité, et le contrat
// ════════════════════════════════════════════════════════════════════════════

export interface InactiviteClasse {
  eleves: number
  elevesInactifs: number
  /** `06-` §5 — « la PART de ses élèves dont la semaine n'est pas faite ». */
  tauxInactivite: number | null
  /** « La classe a fait sa semaine quand LES TROIS QUARTS de ses élèves ont fait la leur. » */
  contratRempli: boolean
  /** « Le professeur EST AVERTI quand le contrat n'est pas rempli » — un avertissement, jamais une action. */
  avertissement: string | null
}

/**
 * `06-` §5 — le taux d'inactivité hebdomadaire d'une classe : « LE MÊME BOOLÉEN,
 * AU MÊME SEUIL ».
 *
 * ⚠️ « UN SEUL SIGNAL : IL NE DISTINGUE PAS "rien rendu" DE "pas assez rendu". »
 * ⚠️ Il NE SE STOCKE PAS : la vue `assiduite_hebdo_classe` le calcule déjà en base.
 *    Cette fonction sert la vue fine et les tests, jamais une seconde écriture.
 */
export function inactiviteDeLaClasse(
  semaines: readonly SemaineEleve[], seuils: SeuilsAssiduite, nomClasse = 'la classe',
): InactiviteClasse {
  const eleves = semaines.length
  if (eleves === 0) {
    return { eleves: 0, elevesInactifs: 0, tauxInactivite: null, contratRempli: true,
      avertissement: null }
  }
  const inactifs = semaines.filter((s) => !semaineFaite(s, seuils)).length
  const taux = inactifs / eleves
  const partFaite = 1 - taux
  const contratRempli = partFaite >= seuils.contratDeClasse
  return {
    eleves, elevesInactifs: inactifs, tauxInactivite: taux, contratRempli,
    avertissement: contratRempli ? null
      : `${nomClasse} n'a pas fait sa semaine : ${inactifs} élève(s) sur ${eleves} n'ont pas rendu `
        + `les ${Math.round(seuils.semaineFaite * 100)} % attendus, quand le contrat en demande `
        + `${Math.round(seuils.contratDeClasse * 100)} % de faites.`,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LA VUE FINE — « une VUE, pas une troisième mesure »
// ════════════════════════════════════════════════════════════════════════════

export type BandeFrise = 'vert' | 'orange' | 'rouge'

/**
 * `06-` §5 — les trois couleurs.
 *   VERT   — la semaine « faite », DU SEUIL À 100 % ;
 *   ORANGE — AU MOINS LA MOITIÉ sans atteindre le seuil ;
 *   ROUGE  — SOUS LA MOITIÉ.
 *
 * « LA BORNE HAUTE DE LA FRISE EST LE SEUIL MÊME DE LA SEMAINE FAITE, et la
 *   moitié, comme lui, est un réglage. »
 */
export function bandeDeLaFrise(
  s: SemaineEleve, seuils: SeuilsAssiduite,
): BandeFrise {
  const c = completion(s)
  if (c === null) return 'vert' // faite par construction
  if (c >= seuils.semaineFaite) return 'vert'
  if (c >= seuils.borneBasseFrise) return 'orange'
  return 'rouge'
}

export interface FriseSemaine {
  cycleLundi: string
  vert: number
  orange: number
  rouge: number
  eleves: number
}

/** Une ligne d'élève dans le tableau de la vue fine. */
export interface LigneEleve {
  eleveId: string
  nom: string
  /** « Ses exercices RENDUS sur ses exercices ASSIGNÉS. » `null` = rien d'assigné. */
  completion: number | null
  assignes: number
  termines: number
  bande: BandeFrise
}

/**
 * `06-` §5 — « une FRISE à trois couleurs : LA PART DES ÉLÈVES DE LA CLASSE DANS
 * CHAQUE BANDE DE COMPLÉTION » — et un TABLEAU, la liste des élèves avec leur
 * pourcentage.
 *
 * « RIEN DE NEUF NE SE CALCULE NI NE SE STOCKE : tout se lit des comptes que la
 *   plateforme tient déjà par élève et par semaine. AUCUNE TABLE NEUVE, AUCUN
 *   AGRÉGAT STOCKÉ. »
 *
 * *« Les agrégats disent la tendance ; la frise dit la distribution ; le tableau
 *   dit qui. »*
 */
export function vueFine(
  parSemaine: ReadonlyArray<{ cycleLundi: string; eleves: ReadonlyArray<LigneEleveBrute> }>,
  seuils: SeuilsAssiduite,
): { frise: FriseSemaine[]; tableau: Map<string, LigneEleve[]> } {
  const frise: FriseSemaine[] = []
  const tableau = new Map<string, LigneEleve[]>()

  for (const s of parSemaine) {
    let vert = 0; let orange = 0; let rouge = 0
    const lignes: LigneEleve[] = []
    for (const e of s.eleves) {
      const bande = bandeDeLaFrise(
        { cycleLundi: s.cycleLundi, exercicesAssignes: e.assignes,
          exercicesTermines: e.termines, enVacances: false }, seuils)
      if (bande === 'vert') vert++
      else if (bande === 'orange') orange++
      else rouge++
      lignes.push({ eleveId: e.eleveId, nom: e.nom, assignes: e.assignes, termines: e.termines,
        completion: completion({ exercicesAssignes: e.assignes, exercicesTermines: e.termines }),
        bande })
    }
    frise.push({ cycleLundi: s.cycleLundi, vert, orange, rouge, eleves: s.eleves.length })
    tableau.set(s.cycleLundi, lignes)
  }

  return { frise, tableau }
}

export interface LigneEleveBrute {
  eleveId: string
  nom: string
  assignes: number
  termines: number
}

// ════════════════════════════════════════════════════════════════════════════
// LE RETRAIT — « pour l'avenir SEULEMENT »
// ════════════════════════════════════════════════════════════════════════════

/**
 * `06-` §5 et `07-` §1.1 — « un exercice RETIRÉ par le professeur sort du
 * dénominateur, MAIS POUR L'AVENIR SEULEMENT : une semaine dont le compte est
 * DÉJÀ ARRÊTÉ ne se recalcule pas. UN CHIFFRE DÉJÀ MONTRÉ AU PROFESSEUR NE BOUGE
 * PLUS. »
 *
 * Une semaine est « déjà arrêtée » dès qu'elle est passée — son lundi est
 * antérieur au cycle courant.
 */
export function retraitCompteDansLaSemaine(
  cycleDuDepot: string, cycleCourant: string,
): { recalculer: boolean; motif: string } {
  if (cycleDuDepot < cycleCourant) {
    return { recalculer: false,
      motif: 'semaine déjà arrêtée : son compte ne se recalcule pas — un chiffre déjà montré au '
        + 'professeur ne bouge plus.' }
  }
  return { recalculer: true, motif: 'semaine en cours : le retrait sort du dénominateur.' }
}

/**
 * `07-` §1.1 — les statuts qui comptent comme RENDUS, et ceux qui n'y comptent pas.
 *
 * ⚠️ `abandonne` et `retire` NE SE CONFONDENT JAMAIS : « l'un est un NON-GESTE DE
 *    L'ÉLÈVE, l'autre une DÉCISION DU PROFESSEUR, ET L'ASSIDUITÉ MESURE L'ÉLÈVE ».
 *    Un abandon reste donc au dénominateur ; un retrait en sort (pour l'avenir).
 */
export const STATUTS_RENDUS = ['v1_remis', 'retour_publie', 'vf_remis', 'clos'] as const

export function estRendu(statut: string): boolean {
  return (STATUTS_RENDUS as readonly string[]).includes(statut)
}

export function entreAuDenominateur(statut: string): boolean {
  return statut !== 'retire'
}
