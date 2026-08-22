// ============================================================================
// C4 · L2 — L'ESCALADE : N1, N2, N3, leurs compteurs, la désescalade (§8.4-§8.7).
// ----------------------------------------------------------------------------
// LE CADRE (§8.1) — l'escalade NE RÉDUIT JAMAIS LE VOLUME ; elle a PRIORITÉ SUR
// LES TABLES DE PROPORTION (« une injection à la demande, indexée sur les
// observables ») ; et « elle n'existe QUE LÀ OÙ ELLE PEUT EXISTER » : compétence
// `evaluee`, JAMAIS en `profil_provisoire`. Les compteurs ne démarrent donc qu'au
// SEGMENT 3.
//
// « LES SEUILS SE COMPTENT EN MESURES » (§1, principe 8), une mesure étant une
// TENTATIVE — et au régime PAR PAIRES des crans de diagnostic, LA PAIRE ENTIÈRE
// VAUT UNE MESURE (§8.4).
//
// LES COMPTEURS NE SE COMPTENT PAS PAREIL (§8.6) :
//   · N1 et N2 ACCEPTENT LES SONDES SECONDAIRES — « ce sont des adaptations
//     automatiques et réversibles » ;
//   · N3 N'ACCEPTE QUE LES MESURES OÙ LA COMPÉTENCE ÉTAIT CIBLE — « N3 n'est pas
//     une adaptation mais un transfert de charge vers le professeur, et
//     l'attention d'un professeur ne se multiplie pas comme le nombre d'exercices ».
//   · Et « LE PROGRÈS SOUS LE SEUIL NE RETIENT PAS N1 — IL RETIENT N3 » : une
//     mesure sur laquelle le taux de l'observable ciblé A MONTÉ ne compte pas au
//     compteur de N3.
//
// ⚠️ §8.5 — pendant une escalade active, le régime « pas de version finale » des
//    crans de transformation passe PLEIN sur les exercices portant l'observable
//    ciblé. « Le `regime_v1vf` NE SE DÉRIVE DONC JAMAIS DU CRAN SEUL » : sans
//    version finale le delta vaut NULL, ET NULL N'EST PAS 0 — N2 serait aveugle.
//
// Ce fichier est PUR.
// ============================================================================

import {
  MESURES_N1, MESURES_N2, MESURES_N3, MESURES_RECEPTIVITE_RETROUVEE,
  REGISTRE_PAR_DEFAUT, SEMAINES_N3, SEMAINES_RESIGNALEMENT_N3, zoneDuCran,
} from './config'
import { estAcquis, etatDesObservables, type EtatObservable, type InstrumentLu }
  from './observables'
import type { Mesure } from './mesure'
import type { BrancheN2, CodeCran, Degre, Palier, Registre, StatutRecette } from './types'

/** `07-` §1.3 — `competences_escalade`, clé (élève × compétence × OBSERVABLE). */
export interface EtatEscalade {
  observable: string
  degre: Degre
  /** `01-` §8.4 — « la date d'entrée en N1 est stockée pour ça » : la double condition de N3. */
  entreN1At: string | null
  dossierN3OuvertAt: string | null
  dossierN3TraiteAt: string | null
}

// ════════════════════════════════════════════════════════════════════════════
// LES COMPTEURS — « les mesures s'accumulent en continu »
// ════════════════════════════════════════════════════════════════════════════

/** Ce qu'une mesure vaut aux compteurs, une fois qu'on sait ce qu'elle était. */
export interface MesurePourCompteur {
  mesure: Mesure
  /** `01-` §8.6 — N3 n'accepte que les mesures où la compétence était CIBLE. */
  etaitCible: boolean
}

/**
 * Le statut d'un observable à chaque pas de l'historique — c'est lui qui dit ce
 * qu'est « une mesure plate » : une mesure après laquelle le statut n'a pas changé.
 *
 * On rejoue la fenêtre d'évidence à chaque pas : « chaque mesure neuve REFERME
 * une fenêtre d'évidence et en ouvre une autre » (§8.6).
 */
export function suiviDeLObservable(
  historique: readonly Mesure[], code: string, instrument: InstrumentLu, tailleFenetre: number,
): Array<{ mesure: Mesure; taux: number | null; acquis: boolean }> {
  const out: Array<{ mesure: Mesure; taux: number | null; acquis: boolean }> = []
  for (let i = 0; i < historique.length; i++) {
    const fenetre = historique.slice(Math.max(0, i + 1 - tailleFenetre), i + 1)
    const etat = etatDesObservables(fenetre, instrument, [code]).find((e) => e.code === code)
    out.push({ mesure: historique[i], taux: etat?.taux ?? null, acquis: estAcquis(etat?.taux ?? null) })
  }
  return out
}

/**
 * `01-` §8.4 et §8.6 — le compteur de N1 et de N2 : les mesures PLATES accumulées
 * depuis le dernier changement de statut de l'observable. « Le compteur NE SE
 * RÉINITIALISE PAS » — sauf par la désescalade, qui EST le changement de statut.
 *
 * « Les compteurs de N1 et N2 ACCEPTENT LES SONDES SECONDAIRES » : rien ne filtre.
 */
export function compteurN1N2(
  historique: readonly Mesure[], code: string, instrument: InstrumentLu, tailleFenetre: number,
): number {
  const suivi = suiviDeLObservable(historique, code, instrument, tailleFenetre)
  let compte = 0
  let precedent: boolean | null = null
  for (const pas of suivi) {
    if (precedent !== null && pas.acquis !== precedent) compte = 0 // changement de statut
    else if (!pas.acquis) compte += 1 // une mesure plate de plus
    precedent = pas.acquis
  }
  return compte
}

/**
 * `01-` §8.6 — le compteur de N3, et il compte AUTREMENT :
 *   · il n'accepte QUE les mesures où la compétence était CIBLE ;
 *   · et « une mesure sur laquelle LE TAUX DE L'OBSERVABLE CIBLÉ A MONTÉ NE
 *     COMPTE PAS » — « un élève dont le taux monte n'est pas un dossier à
 *     transférer ». *« Monter » se lit d'une mesure à la suivante.*
 */
export function compteurN3(
  historique: readonly MesurePourCompteur[], code: string, instrument: InstrumentLu,
  tailleFenetre: number,
): number {
  const suivi = suiviDeLObservable(historique.map((h) => h.mesure), code, instrument, tailleFenetre)
  let compte = 0
  let precedent: { taux: number | null; acquis: boolean } | null = null
  for (let i = 0; i < suivi.length; i++) {
    const pas = suivi[i]
    if (precedent !== null && pas.acquis !== precedent.acquis) { compte = 0; precedent = pas; continue }
    const monte = precedent !== null && precedent.taux !== null && pas.taux !== null
      && pas.taux > precedent.taux
    if (!pas.acquis && historique[i].etaitCible && !monte) compte += 1
    precedent = pas
  }
  return compte
}

// ════════════════════════════════════════════════════════════════════════════
// LE DEGRÉ — ce que les compteurs déclenchent
// ════════════════════════════════════════════════════════════════════════════

export interface ConditionsEscalade {
  /** `01-` §8.1 — l'escalade n'existe QUE là. */
  statutRecette: StatutRecette
  profilProvisoire: boolean
  /** `01-` §8.1 — « les compteurs ne démarrent qu'au segment 3 ». */
  segment: number
  /** `01-` §8.3 — les deux préconditions, déjà évaluées. */
  preconditionBasse: boolean
  preconditionHaute: boolean
  /** `01-` §8.4 — la double condition de N3 : les semaines depuis l'entrée en N1. */
  semainesDepuisN1: number | null
}



/**
 * `01-` §8.4 — le degré qu'appellent les compteurs, sous les conditions du §8.1.
 * Rend `null` quand rien n'escalade — et dit toujours pourquoi.
 */
export function degreAppele(
  compteurPlat: number, compteurCible: number, c: ConditionsEscalade,
): { degre: Degre | null; motif: string } {
  if (c.statutRecette !== 'evaluee') {
    return { degre: null, motif: 'la compétence n\'est pas `evaluee` : ni escalade ni palier à lire.' }
  }
  if (c.profilProvisoire) {
    return { degre: null, motif: '`profil_provisoire` : aucune escalade ne se déclenche.' }
  }
  if (c.segment < 3) {
    return { degre: null, motif: 'avant le segment 3, aucun compteur ne court.' }
  }
  if (!c.preconditionBasse) {
    return { degre: null,
      motif: 'précondition basse non satisfaite : l\'élève découvre, il a besoin d\'être enseigné.' }
  }
  if (!c.preconditionHaute) {
    return { degre: null,
      motif: 'aucun observable REQUIS non acquis : la stabilité acquise produit entretien ou rien, '
        + 'jamais N1.' }
  }

  // N3 — DOUBLE condition, et les deux, jamais l'une des deux.
  if (compteurCible >= MESURES_N3) {
    if ((c.semainesDepuisN1 ?? 0) >= SEMAINES_N3) {
      return { degre: 'N3',
        motif: `${compteurCible} mesures plates en cible ET ${c.semainesDepuisN1} semaines depuis `
          + 'l\'entrée en N1 : le routeur rend la main.' }
    }
    // Le compteur est atteint, le temps ne l'est pas : on reste au degré précédent.
  }
  if (compteurPlat >= MESURES_N2) {
    return { degre: 'N2', motif: `${compteurPlat} mesures plates malgré N1.` }
  }
  if (compteurPlat >= MESURES_N1) {
    return { degre: 'N1', motif: `${compteurPlat} mesures plates.` }
  }
  return { degre: null, motif: `${compteurPlat} mesure(s) plate(s) : sous le seuil de N1.` }
}

/**
 * `01-` §8.6 — « DÉSESCALADE DÈS QUE L'OBSERVABLE CIBLÉ CHANGE DE STATUT ».
 * Et « le progrès SOUS le seuil ne retient pas N1 » : un taux qui monte sans
 * franchir le seuil ne désescalade rien.
 */
export function desescalade(
  etatPrecedent: EtatEscalade | null, statutCourant: boolean, statutPrecedent: boolean,
): boolean {
  if (!etatPrecedent) return false
  return statutCourant !== statutPrecedent
}

// ════════════════════════════════════════════════════════════════════════════
// N1 — isoler le sous-défaut dominant
// ════════════════════════════════════════════════════════════════════════════

export interface InterventionN1 {
  /** L'observable que N1 vise. */
  observable: string
  /** Le cran qui l'isole, ou `null` quand aucun ne le porte. */
  cranIsolant: CodeCran | null
  /** `01-` §6, branche d'échec — servi quand même, en `exerce`, retour mono-focal. */
  degrade: boolean
  /** `01-` §8.4 — « retour MONO-FOCAL sur lui seul ». Toujours vrai sous N1. */
  monoFocal: true
  motif: string
}

/**
 * `01-` §8.4, N1 — « GARDER L'OBJET et passer à un cran qui ISOLE cet observable ».
 *
 * « Ce que N1 consomme : `couverture_observables` » (`02-` §2.3.2). Quand aucun
 * cran ne porte l'observable visé, le §6 a sa BRANCHE D'ÉCHEC : on sert quand
 * même, l'exercice vaut `exerce`, N1 RESTE SUR LE CRAN COURANT, dégrade en retour
 * mono-focal, et JOURNALISE `degrade` — « sans la colonne, le compteur n'existe
 * pas » (`07-` §1.5).
 */
export function interventionN1(
  observable: string, cransQuiIsolent: readonly CodeCran[],
): InterventionN1 {
  if (cransQuiIsolent.length === 0) {
    return { observable, cranIsolant: null, degrade: true, monoFocal: true,
      motif: `aucun cran ne porte « ${observable} » : servi en \`exerce\`, retour mono-focal, `
        + 'cran courant conservé — branche d\'échec.' }
  }
  return { observable, cranIsolant: cransQuiIsolent[0], degrade: false, monoFocal: true,
    motif: `cran isolant retenu pour « ${observable} ».` }
}

// ════════════════════════════════════════════════════════════════════════════
// N2 — brancher sur la réceptivité
// ════════════════════════════════════════════════════════════════════════════

/** Ce que N2 lit — et il NE LIT QUE LES MESURES `formatif` (§8.4). */
export interface SignauxN2 {
  /** Le delta v1→vf RESTREINT À L'OBSERVABLE CIBLÉ. `null` n'est pas 0 (§8.5). */
  deltaRestreint: number | null
  /** Vrai quand le delta compte comme fort. Le seuil est un réglage d'instrument. */
  deltaFort: boolean
  /** Vrai quand les v1 restent plates. */
  v1Plates: boolean
  /** `01-` §8.4 — la distance a-t-elle été éprouvée dans la fenêtre ? */
  distanceEprouvee: boolean
  /** Vrai quand TOUTES les mesures récentes portent `meme_type`. */
  toutesMemeType: boolean
  /** `01-` §8.4 — au régime PAR PAIRES, les deux résultats. `null` = paire non terminée. */
  paireCorrectionJuste: boolean | null
  paireNouveauCasDetecte: boolean | null
  /** Vrai quand le cran servi est un cran de DIAGNOSTIC — le régime par paires. */
  regimeParPaires: boolean
}

export interface InterventionN2 {
  branche: BrancheN2
  registre: Registre | null
  descendreLeGrain: boolean
  /** `01-` §8.4 — la deuxième branche bascule sur un cran de diagnostic. */
  cranDeDiagnostic: boolean
  /** `01-` §8.4 — la troisième branche : « N2 ne conclut pas, IL CRÉE LE TEST ». */
  creerLeTest: boolean
  motif: string
}

/**
 * `01-` §8.4 — les branches de N2.
 *
 * AU RÉGIME PAR PAIRES, « la correspondance est TERME À TERME » : *la correction
 * est-elle juste ?* joue le rôle du delta ; *le nouveau cas est-il détecté ?*
 * celui des v1 ; « et la distance n'a rien à éprouver — CHAQUE PAIRE MET LE
 * TRANSFERT À L'ÉPREUVE PAR CONSTRUCTION, LA TROISIÈME BRANCHE EST DONC SANS
 * OBJET sur un cran de diagnostic ».
 */
export function brancherN2(s: SignauxN2): InterventionN2 {
  if (s.regimeParPaires) {
    const { paireCorrectionJuste: juste, paireNouveauCasDetecte: detecte } = s
    if (juste === null || detecte === null) {
      return { branche: 'sans_objet', registre: null, descendreLeGrain: false,
        cranDeDiagnostic: false, creerLeTest: false,
        motif: 'paire non terminée : NULL n\'est pas un échec, rien ne se branche.' }
    }
    if (juste && detecte) {
      return { branche: 'sans_objet', registre: null, descendreLeGrain: false,
        cranDeDiagnostic: false, creerLeTest: false,
        motif: 'correction juste et nouveau cas détecté : aucune branche, on poursuit — '
          + 'la désescalade joue dès que l\'observable change de statut.' }
    }
    if (juste && !detecte) {
      return { branche: 'transfert', registre: null, descendreLeGrain: false,
        cranDeDiagnostic: false, creerLeTest: false,
        motif: 'transfert confirmé : corrige sur indication, ne détecte pas seul. Le remède est le '
          + 'cran courant — PERSISTER, aucune intervention neuve ; le compteur court vers N3.' }
    }
    // Correction fausse — détecté ou non : « le delta prime, comme aux crans de transformation ».
    return { branche: 'reception', registre: 'demonstratif', descendreLeGrain: true,
      cranDeDiagnostic: false, creerLeTest: false,
      motif: `correction fausse (nouveau cas ${detecte ? 'détecté' : 'non détecté'}) : le delta `
        + 'prime — branche réception.' }
  }

  // Aux crans de TRANSFORMATION : le delta v1→vf restreint et `distance_contexte`.
  if (s.deltaRestreint === null) {
    return { branche: 'sans_objet', registre: null, descendreLeGrain: false,
      cranDeDiagnostic: false, creerLeTest: false,
      motif: 'delta NULL — et NULL n\'est pas 0 : N2 serait aveugle. La version finale est requise '
        + 'pendant l\'escalade (§8.5) ; rien ne se branche tant qu\'elle manque.' }
  }
  if (!s.deltaFort) {
    return { branche: 'reception', registre: 'demonstratif', descendreLeGrain: true,
      cranDeDiagnostic: false, creerLeTest: false,
      motif: 'delta faible : la version finale ne répare pas ce que le retour signale — '
        + 'problème de RÉCEPTION.' }
  }
  if (!s.v1Plates) {
    return { branche: 'sans_objet', registre: null, descendreLeGrain: false,
      cranDeDiagnostic: false, creerLeTest: false,
      motif: 'delta fort et v1 qui bougent : rien à brancher.' }
  }
  if (s.distanceEprouvee) {
    return { branche: 'transfert', registre: null, descendreLeGrain: false,
      cranDeDiagnostic: true, creerLeTest: false,
      motif: 'delta fort, v1 plates, et la distance a été éprouvée : TRANSFERT CONFIRMÉ — '
        + 'basculer sur un cran de diagnostic, entraîner la détection.' }
  }
  if (s.toutesMemeType) {
    return { branche: 'creer_le_test', registre: null, descendreLeGrain: false,
      cranDeDiagnostic: false, creerLeTest: true,
      motif: 'toutes les mesures récentes portent `meme_type` : le transfert n\'a jamais été mis à '
        + 'l\'épreuve. N2 NE CONCLUT PAS, IL CRÉE LE TEST — un type différent portant le même '
        + 'observable, rejugé au tour suivant.' }
  }
  return { branche: 'sans_objet', registre: null, descendreLeGrain: false,
    cranDeDiagnostic: false, creerLeTest: false,
    motif: 'aucune branche : la distance n\'est ni éprouvée ni uniformément `meme_type`.' }
}

// ════════════════════════════════════════════════════════════════════════════
// N3 — le dossier, et son re-signalement
// ════════════════════════════════════════════════════════════════════════════

export interface DossierN3 {
  ouvrir: boolean
  reSignaler: boolean
  semainesDepuisOuverture: number | null
}

/**
 * `01-` §8.4 — « un dossier N3 non traité SE RE-SIGNALE : chaque dossier porte sa
 * DATE D'OUVERTURE ; passé 3 SEMAINES sans traitement, il REMONTE EN TÊTE de
 * l'écran professeur. NI PLAFOND NI FILE D'ATTENTE. »
 *
 * « Le moteur d'ouverture et de re-signalement est de ce lot ; l'ÉCRAN de la file
 *   est C6-L1 » (`07-` §2).
 */
export function dossierN3(etat: EtatEscalade | null, semainesDepuisOuverture: number | null): DossierN3 {
  if (!etat || etat.degre !== 'N3') {
    return { ouvrir: false, reSignaler: false, semainesDepuisOuverture: null }
  }
  if (!etat.dossierN3OuvertAt) {
    return { ouvrir: true, reSignaler: false, semainesDepuisOuverture: null }
  }
  if (etat.dossierN3TraiteAt) {
    return { ouvrir: false, reSignaler: false, semainesDepuisOuverture }
  }
  return {
    ouvrir: false,
    reSignaler: (semainesDepuisOuverture ?? 0) >= SEMAINES_RESIGNALEMENT_N3,
    semainesDepuisOuverture,
  }
}

// ════════════════════════════════════════════════════════════════════════════
// §8.5 — LA VERSION FINALE PENDANT L'ESCALADE
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §8.5 — « le régime "pas de version finale" des crans de transformation
 * passe PLEIN sur les exercices portant l'observable ciblé ».
 *
 * ⚠️ D'où la règle qui gouverne tout appel : « LE `regime_v1vf` NE SE DÉRIVE
 *    DONC JAMAIS DU CRAN SEUL : l'état d'escalade entre dans la dérivation ».
 */
export function regimeV1Vf(
  regimeDuCran: string, escaladeActive: boolean, porteLObservableCible: boolean,
): string {
  if (escaladeActive && porteLObservableCible) return 'plein'
  return regimeDuCran
}

// ════════════════════════════════════════════════════════════════════════════
// §8.7 — L'ÉLECTION DU REGISTRE. « Une LECTURE, pas un état. »
// ════════════════════════════════════════════════════════════════════════════

export interface SignauxRegistre {
  statutRecette: StatutRecette
  /** La branche de N2 en cours, si une escalade court. */
  brancheN2: BrancheN2 | null
  /** `01-` §8.7 — la réceptivité retrouvée : les 2 dernières mesures portent-elles un signal bon ? */
  receptiviteRetrouvee: boolean
  /** Le palier de la compétence CIBLE, jamais celui de l'élève. */
  palierCible: Palier | null
  /** Le cran servi — sa position dans la bande donne la colonne de la table. */
  cranServi: CodeCran | null
  /** `01-` §8.4 — N1 dégrade en retour mono-focal : la case est « sous la bande ». */
  n1CranInjecte: boolean
}

export interface RegistreElu { registre: Registre; motif: string }

/**
 * `01-` §8.7 — « trois signaux EN PRÉSÉANCE DÉCROISSANTE ; rien ne se stocke ».
 *
 * 1. LE STATUT DE RECETTE — l'exercice commun sur une `mesuree_silencieusement`
 *    est DESCRIPTIF et n'attribue aucun palier. « Ce signal ne rencontre jamais
 *    les deux autres : hors `evaluee`, ni escalade ni palier à lire. »
 * 2. L'ESCALADE — N2 branche réception → DÉMONSTRATIF. Retour au défaut par la
 *    RÉCEPTIVITÉ RETROUVÉE (2 dernières mesures au signal bon).
 * 3. LA TABLE — palier de la cible × position de la case.
 */
export function elireLeRegistre(s: SignauxRegistre): RegistreElu {
  // 1 — le statut de recette.
  if (s.statutRecette !== 'evaluee') {
    return { registre: 'descriptif',
      motif: 'hors `evaluee` : registre descriptif, aucun palier attribué — il montre ce que le '
        + 'squelette contient.' }
  }

  // 2 — l'escalade.
  if (s.brancheN2 === 'reception' && !s.receptiviteRetrouvee) {
    return { registre: 'demonstratif',
      motif: 'N2, branche réception : la phrase de l\'élève réparée, contraste avant/après.' }
  }

  // 3 — la table. « La colonne "sous la bande" vaut pour TOUTE case sous la bande
  //     du palier — Y COMPRIS celles que N1 crée en injectant un cran isolant. »
  if (s.n1CranInjecte) {
    return { registre: 'descriptif', motif: 'cran injecté par N1, sous la bande : descriptif, mono-focal.' }
  }
  if (!s.palierCible || !s.cranServi) {
    return { registre: 'descriptif', motif: 'palier ou cran inconnu : le défaut de la table.' }
  }
  const zone = zoneDuCran(s.palierCible, s.cranServi)
  if (!zone) {
    return { registre: 'descriptif',
      motif: `le cran « ${s.cranServi} » n'est pas dans la bande de ${s.palierCible} : descriptif.` }
  }
  const registre = REGISTRE_PAR_DEFAUT[s.palierCible][zone]
  if (!registre) {
    return { registre: 'descriptif',
      motif: `aucune case au-dessus de la bande de ${s.palierCible} : la montée d'A passe au grain.` }
  }
  return { registre, motif: `table : palier ${s.palierCible}, case ${zone}.` }
}

/**
 * `01-` §8.7 — la RÉCEPTIVITÉ RETROUVÉE : « dès que les 2 DERNIÈRES MESURES de
 * l'observable ciblé portent un signal REDEVENU BON — delta v1→vf restreint fort,
 * ou correction de paire juste ».
 */
export function receptiviteRetrouvee(
  deuxDernieres: ReadonlyArray<{ deltaFort: boolean | null; correctionJuste: boolean | null }>,
): boolean {
  const lot = deuxDernieres.slice(-MESURES_RECEPTIVITE_RETROUVEE)
  if (lot.length < MESURES_RECEPTIVITE_RETROUVEE) return false
  return lot.every((x) => x.deltaFort === true || x.correctionJuste === true)
}

/** `01-` §8.4 — « le régime d'entretien : la compétence QUITTE LES CIBLES PRIMAIRES ». */
export function enRegimeDEntretien(etats: readonly EtatEscalade[]): boolean {
  return etats.some((e) => e.degre === 'N3' && !e.dossierN3TraiteAt)
}

/** Les observables sur lesquels une escalade court aujourd'hui. */
export function observablesEscalades(etats: readonly EtatEscalade[]): EtatObservable['code'][] {
  return etats.filter((e) => e.degre === 'N1' || e.degre === 'N2').map((e) => e.observable)
}
