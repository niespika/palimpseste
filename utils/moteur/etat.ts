// ============================================================================
// C4 · L12 — L'ÉTAT APRÈS MESURE : la lettre, l'escalade, la montée.
// ----------------------------------------------------------------------------
// « TU ÉCRIS DES MESURES ; LE MOTEUR EN FERA DES LETTRES » (`utils/chaine/
// mesures.ts`). Voici le moteur. `competences_niveaux.lettre` n'avait AUCUN
// écrivain dans tout le dépôt, et c'est le SECOND VERROU de `filtreR0` :
// `statutRecette === 'evaluee'` **ET** `lettre !== null`.
//
// ⛔⛔ N'ÉCRIS JAMAIS `verdict.lettre` TEL QUEL DANS LA COLONNE — tu refermerais
//    le verrou que tu viens d'ouvrir. `Verdict.lettre` est CE QUI S'AFFICHE, et
//    il vaut `null` sous `profil_provisoire` : pendant tout le segment 2 — celui
//    de l'échéance de ce lot — une colonne mise à `null` VIDERAIT R0 exactement
//    quand la calibration a besoin de lui (le §6 est formel : « la règle de
//    calibration — R0 s'applique »).
//
// ⭐ LE PARTAGE, ET IL EST NET. « Sous `profil_provisoire`, AUCUNE LETTRE NE
//    S'AFFICHE » est une RÈGLE DE LECTURE, jamais d'écriture ; et le `07-` §1
//    range « la valeur de ciblage NON PLAFONNÉE » parmi les six valeurs QUI NE
//    SONT PAS DES COLONNES. D'où :
//      · la colonne porte LA VALEUR PLAFONNÉE — l'état, celui que R0 lit ;
//      · la suppression d'affichage se fait À LA LECTURE, et elle a déjà son
//        interrupteur, `competences_affichage_actif` ;
//      · `valeurNonPlafonnee` se recalcule à chaque cycle et NE SE STOCKE JAMAIS.
//    *Amendé au `07-` §1.3 par ce lot, depuis son relevé.*
//
// ⛔ ET LA COLONNE DE STATUT N'EXISTE PLUS SUR CETTE TABLE. `statut_recette` et
//    `statut_recette_pose_le` ont été RETIRÉES de `competences_niveaux` le 23/08
//    (`c4_statut_recette_retrait.sql`) ; le statut est GLOBAL
//    (`competences_statut_recette`), et sa garde « poser un statut en écrit la
//    date » a DÉMÉNAGÉ avec lui. On ne les écrit donc jamais — et la garde
//    ci-dessous le tient, pour que la règle survive à une régression.
//
// Ce fichier est PUR.
// ============================================================================

import { medianeBasse, rangDeLaMesure, type Mesure } from '../routeur/mesure'
import { medianeDeClasse, plafondApplicable, type EtatNiveau, type Verdict }
  from '../routeur/lettres'
import { palierDeRang, rangPalier, type Competence, type Grain, type Lettre, type Palier }
  from '../routeur/types'
import type { EtatEscalade } from '../routeur/escalade'
import type { Degre } from '../routeur/types'

// ════════════════════════════════════════════════════════════════════════════
// CE QUE LA COLONNE PORTE
// ════════════════════════════════════════════════════════════════════════════

/**
 * `01-` §9 — la valeur PLAFONNÉE : « le plafond borne l'AFFICHAGE, pas le
 * ciblage » — et c'est justement pour cela qu'il entre dans la colonne, qui EST
 * l'état affiché du `07-` §1.3. La valeur non plafonnée, elle, ne se stocke pas.
 */
export function plafonner(valeur: Lettre, plafond: Palier | null): Lettre {
  if (valeur === null) return null
  if (plafond === null) return valeur
  return rangPalier(valeur) > rangPalier(plafond) ? plafond : valeur
}

export interface LettreAEcrire {
  lettre: Lettre
  motif: string
}

/**
 * ⛔⛔ LA FONCTION QUI TIENT LE SECOND VERROU. Elle prend le verdict du §9 et
 * rend CE QUI VA EN COLONNE — la valeur plafonnée, jamais `verdict.lettre`.
 */
export function lettreAEcrire(verdict: Verdict): LettreAEcrire {
  const lettre = plafonner(verdict.valeurNonPlafonnee, verdict.plafond)
  return {
    lettre,
    motif: lettre === null
      ? 'aucune lettre : « sans lettre, rien ne se juge » — sa première vient de sa première ancre.'
      : `valeur ${verdict.valeurNonPlafonnee}${verdict.plafond ? `, plafond ${verdict.plafond}` : ''}`
        + ` → colonne ${lettre} (mouvement : ${verdict.mouvement}). L'affichage, lui, se supprime `
        + 'À LA LECTURE sous `profil_provisoire`.',
  }
}

// ════════════════════════════════════════════════════════════════════════════
// LE COLD START — « sa PREMIÈRE lettre vient de sa première ancre » (`01-` §9)
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔⛔ `jugerLaLettre` NE FABRIQUE JAMAIS UNE PREMIÈRE LETTRE : elle rend
 * `{ lettre: null, mouvement: 'aucun' }` dès que `etat.lettre` est nul, et le
 * `01-` §9 le confirme — « une compétence SANS LETTRE n'en reçoit pas ici ».
 * La première vient donc du COLD START (`01-` §4) : les DEUX EXAMENS
 * DIAGNOSTIQUES de la semaine 1, avec `profil_provisoire`.
 *
 * « LE COLD START S'APPLIQUE PASSATION PAR PASSATION, NON ÉLÈVE PAR ÉLÈVE » : un
 * élève présent à l'essai et absent à l'explication garde ses paliers réels sur
 * ce que l'essai mesure, et ne reçoit un profil par défaut que sur les
 * compétences que SEULE L'AUTRE passation mesure.
 *
 * ⚠️ CE QUE LE §10 ARRÊTE, et qu'on n'élargit pas : l'ESSAI mesure Expression,
 *    Argumentation et Structure ; l'EXPLICATION mesure Expression, Argumentation,
 *    Structure et Synthèse. **Ni la Connaissance ni le Questionnement n'y sont
 *    mesurés** : ils sortent de la semaine 1 SANS LETTRE, donc ni ciblables ni
 *    sondables, et n'entrent dans le ciblage qu'une fois qu'une ancre leur en a
 *    donné une. On ne leur en invente pas.
 */
export type SourceDeLaPremiereLettre = 'mesures_du_diagnostic' | 'mediane_de_classe' | 'aucune'

export interface PremiereLettre {
  competence: Competence
  lettre: Lettre
  source: SourceDeLaPremiereLettre
  /** ⛔ La médiane d'un absent NE S'ÉCRIT JAMAIS dans `derniere_ancre`. */
  ancre: { date: string; valeur: Palier } | null
  motif: string
}

/**
 * ⚠️ LECTURE DE CE LOT, ET ELLE SE DIT : la source ne dit pas comment RÉDUIRE
 * plusieurs lettres-équivalentes d'un même diagnostic en une lettre — or les
 * deux passations mesurent l'Expression, l'Argumentation et la Structure toutes
 * les deux. On applique la SEULE règle de réduction que le corpus écrive, celle
 * du signal de ciblage (`01-` §3) : « à 2 mesures : LA PLUS BASSE ; à 1 :
 * elle-même ; sinon LA MÉDIANE (basse) ». *Fixée par un test, dite au relevé,
 * et portée au registre des ouverts.*
 */
export function reduireLesLettresEquivalentes(mesures: readonly Mesure[]): Lettre {
  const rangs = mesures.map(rangDeLaMesure).filter((r): r is number => r !== null)
  if (rangs.length === 0) return null
  if (rangs.length === 1) return palierDeRang(rangs[0])
  if (rangs.length === 2) return palierDeRang(Math.min(...rangs))
  return palierDeRang(medianeBasse(rangs) as number)
}

/**
 * La première lettre d'UNE compétence, au cold start.
 *
 * @param mesuresDuDiagnostic les mesures de CET élève sur les passations
 *        diagnostiques, pour cette compétence. Vide = absent, ou compétence non
 *        mesurée par la passation.
 * @param mesureeParLaPassation vrai quand AU MOINS UNE passation diagnostique
 *        mesure cette compétence — sans quoi il n'y a pas d'absence à combler.
 * @param medianeDeSaClasse la médiane des lettres de sa classe sur cette
 *        compétence, pour la MÊME passation (« une passation a lieu dans une
 *        classe identifiée, ce qui lève l'ambiguïté pour un bi-classe »).
 */
export function premiereLettre(
  competence: Competence,
  mesuresDuDiagnostic: readonly Mesure[],
  mesureeParLaPassation: boolean,
  medianeDeSaClasse: Lettre,
): PremiereLettre {
  const propre = reduireLesLettresEquivalentes(mesuresDuDiagnostic)
  if (propre !== null) {
    // « L'ancre fait foi » : si la passation est une ancre (`lieu = classe` ET
    // `forme = sommatif`), sa valeur et sa date entrent dans `derniere_ancre`.
    const ancres = mesuresDuDiagnostic
      .filter((m) => m.lieu === 'classe' && m.forme === 'sommatif' && m.lettreEquivalente)
      .sort((a, b) => (a.mesureAt < b.mesureAt ? -1 : 1))
    const derniere = ancres[ancres.length - 1]
    return {
      competence, lettre: propre, source: 'mesures_du_diagnostic',
      ancre: derniere
        ? { date: derniere.mesureAt, valeur: derniere.lettreEquivalente as Palier }
        : null,
      motif: `${mesuresDuDiagnostic.length} mesure(s) de diagnostic → ${propre}`
        + `${derniere ? ' ; ancre réelle enregistrée' : ' ; AUCUNE ancre (formatif) — régime '
          + '« sans ancre réelle » : plafond valeur initiale + 1, descente impossible'}.`,
    }
  }
  if (mesureeParLaPassation && medianeDeSaClasse !== null) {
    return {
      competence, lettre: medianeDeSaClasse, source: 'mediane_de_classe',
      // ⛔ « CETTE MÉDIANE N'EST JAMAIS ÉCRITE DANS `derniere_ancre` : ce n'est
      //    pas une mesure de cet élève. »
      ancre: null,
      motif: `absent à la passation qui mesure ${competence} : médiane de sa classe `
        + `(${medianeDeSaClasse}), en \`profil_provisoire\`, avec une fenêtre de rattrapage. `
        + 'Elle n\'entre PAS dans `derniere_ancre`.',
    }
  }
  return {
    competence, lettre: null, source: 'aucune', ancre: null,
    motif: mesureeParLaPassation
      ? 'absent, et aucune médiane de classe disponible : la compétence reste SANS LETTRE.'
      : 'aucune passation diagnostique ne mesure cette compétence : elle sort de la semaine 1 '
        + 'sans lettre — ni ciblable, ni sondable (§10).',
  }
}

/** `01-` §10 — la médiane d'une classe sur une compétence. Les nuls sortent. */
export function medianeDeLaClasse(lettres: readonly Lettre[]): Lettre {
  const connues = lettres.filter((l): l is Palier => l !== null)
  return connues.length === 0 ? null : medianeDeClasse(connues)
}

// ════════════════════════════════════════════════════════════════════════════
// LA LIGNE DE `competences_niveaux`
// ════════════════════════════════════════════════════════════════════════════

/** ⛔ Les colonnes RETIRÉES le 23/08 — jamais réécrites, même par accident. */
export const CLES_RETIREES_DU_NIVEAU = ['statut_recette', 'statut_recette_pose_le'] as const

/** Les colonnes que ce lot écrit sur `competences_niveaux`, et rien d'autre. */
export interface LigneDeNiveau {
  eleve_id: string
  competence: string
  lettre: string | null
  ancre_derniere_date?: string
  ancre_derniere_valeur?: string
  lettre_initiale?: string
  lettre_initiale_at?: string
  profil_provisoire: boolean
  updated_at: string
}

export class LigneDeNiveauInvalide extends Error {}

/**
 * ⚠️ LES DEUX FAITS D'API DU PIÈGE 19 VALENT ICI AUSSI (`07-` §1.3) :
 *  · « beaucoup d'élèves n'ont AUCUNE ligne, et c'est normal » — `lireLesNiveaux`
 *    ÉNUMÈRE LES COMPÉTENCES, pas les lignes trouvées : notre écriture CRÉE donc
 *    des lignes autant qu'elle en met à jour, et c'est un `upsert` ;
 *  · un `upsert` EN LOT unifie les colonnes de son tableau → jeux de clés
 *    HOMOGÈNES, sans quoi les manquantes partent à `NULL`. `lettre_initiale` est
 *    exactement le genre de colonne qu'on n'efface pas deux fois.
 */
export function verifierLesLignesDeNiveau(lignes: readonly LigneDeNiveau[]): void {
  if (lignes.length === 0) return
  const reference = Object.keys(lignes[0]).sort()
  for (const cle of CLES_RETIREES_DU_NIVEAU) {
    if (reference.includes(cle)) {
      throw new LigneDeNiveauInvalide(
        `\`${cle}\` a été RETIRÉE de \`competences_niveaux\` le 23/08 : le statut est GLOBAL `
        + '(`competences_statut_recette`), et sa garde a déménagé avec lui.')
    }
  }
  const vues = new Set<string>()
  for (const l of lignes) {
    const cle = `${l.eleve_id}|${l.competence}`
    if (vues.has(cle)) {
      throw new LigneDeNiveauInvalide(
        `deux lignes de même clé (${cle}) dans un même envoi : Postgres refuse TOUT le lot `
        + '(`21000 : ON CONFLICT DO UPDATE command cannot affect row a second time`).')
    }
    vues.add(cle)
    const cles = Object.keys(l).sort()
    if (cles.length !== reference.length || cles.some((c, i) => c !== reference[i])) {
      throw new LigneDeNiveauInvalide(
        'jeux de clés HÉTÉROGÈNES dans un même envoi — un `upsert` en lot les unifie, et les '
        + `manquantes partiraient à NULL. Attendu [${reference.join(', ')}], reçu [${cles.join(', ')}].`)
    }
  }
}

/**
 * La ligne d'état d'une compétence, après une mesure.
 *
 * ⚠️ `profil_provisoire` NE SE TOUCHE PAS ICI : « il bascule À LA FIN DU
 *    SEGMENT 2 » (`01-` §9), et c'est un événement de BORNE DE SEGMENT, pas une
 *    conséquence de mesure. On recopie l'état lu.
 */
export function ligneDeNiveau(
  eleveId: string, competence: Competence, lettre: Lettre, etat: EtatNiveau,
  ancreNouvelle: { date: string; valeur: Palier } | null, maintenant: string,
): LigneDeNiveau {
  return {
    eleve_id: eleveId,
    competence,
    lettre,
    // Une ancre neuve réinitialise les deux ; sinon on ne renvoie rien — « une
    // clé qu'on n'envoie pas garde sa valeur ».
    ...(ancreNouvelle
      ? { ancre_derniere_date: ancreNouvelle.date, ancre_derniere_valeur: ancreNouvelle.valeur }
      : {}),
    // ⚠️ `lettre_initiale` NE SE DÉRIVE DE RIEN et ne se réécrit jamais : « la
    //    première valeur est perdue dès la deuxième », et son unique lecteur est
    //    `plafondApplicable()`, sans qui « une compétence sans ancre monterait
    //    sans borne ».
    ...(etat.lettreInitiale === null && lettre !== null
      ? { lettre_initiale: lettre, lettre_initiale_at: maintenant }
      : {}),
    profil_provisoire: etat.profilProvisoire,
    updated_at: maintenant,
  }
}

/** Le plafond effectif d'une compétence — pour le journal et pour les écrans. */
export function plafondDe(etat: EtatNiveau): { plafond: Palier | null; sansAncre: boolean } {
  return plafondApplicable(etat)
}

// ════════════════════════════════════════════════════════════════════════════
// L'ESCALADE ET LA MONTÉE — deux clés que personne n'avait encore écrites
// ════════════════════════════════════════════════════════════════════════════

/** `07-` §1.3 — `competences_escalade`, clé (élève × compétence × OBSERVABLE). */
export interface LigneDEscalade {
  eleve_id: string
  competence: string
  observable: string
  degre: Degre
  entre_n1_at: string | null
  dossier_n3_ouvert_at: string | null
  updated_at: string
}

/**
 * `01-` §8.4 — « la DATE D'ENTRÉE EN N1 » est lue par la double condition de N3 :
 * elle se pose au PREMIER passage en N1 et ne se réécrit jamais tant que
 * l'escalade court. Et « la date d'ouverture du dossier N3 » naît avec N3.
 */
export function ligneDEscalade(
  eleveId: string, competence: Competence, observable: string, degre: Degre,
  precedent: EtatEscalade | null, maintenant: string,
): LigneDEscalade {
  return {
    eleve_id: eleveId,
    competence,
    observable,
    degre,
    entre_n1_at: precedent?.entreN1At ?? maintenant,
    dossier_n3_ouvert_at: degre === 'N3'
      ? (precedent?.dossierN3OuvertAt ?? maintenant)
      : (precedent?.dossierN3OuvertAt ?? null),
    updated_at: maintenant,
  }
}

/** `07-` §1.3 — `competences_montee`, clé (élève × compétence × GRAIN). */
export interface LigneDeMontee {
  eleve_id: string
  competence: string
  grain: Grain
  /** ⛔ « `cran_atteint` ET RIEN DE PLUS » : la distribution NE SE STOCKE JAMAIS. */
  cran_atteint: number
  updated_at: string
}

export function ligneDeMontee(
  eleveId: string, competence: Competence, grain: Grain, cranAtteint: number, maintenant: string,
): LigneDeMontee {
  return { eleve_id: eleveId, competence, grain, cran_atteint: cranAtteint,
    updated_at: maintenant }
}
