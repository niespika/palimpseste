// ============================================================================
// C7 · L3 — LES CONSIGNES DU GABARIT, DÉRIVÉES. « La consigne ne se déclare
// plus au cas dès le format 1.5 : elle se dérive du cran, de la variante et de
// la clé du problème » (`08-` §5 amendé ; `10-Gabarit.md` §3 — les onze
// consignes, réécrites par Louis le 03/09). PUR, éprouvé mot pour mot.
// ----------------------------------------------------------------------------
// ⭐ Trois cases, jamais plus : « Les documents » (le cadre de l'écran, dont la
//    consigne nomme la section : le devoir d'élève), `<le problème>` (l'énoncé
//    du `09-`, tel quel), et — aux crans de production — le geste et le
//    matériel, que ce lot ne sert pas encore.
// ⭐ LE POINT D'INSERTION (`10-` §5) : là où la version corrigée AJOUTE au lieu
//    de remplacer, la consigne le dit — « à l'endroit en gras, il manque quelque
//    chose » se substitue à « le passage en gras a un problème » — aux crans
//    qui marquent : 1(a), 3, 4(a), 5.
// ⛔ Aux crans 4(b), 7 et 9 : « surligne », jamais « recopie » ; au 9 la
//    consigne DEMANDE s'il y a un problème, elle n'ordonne pas de surligner.
// ⛔ Au cran 7 on corrige, on ne réécrit pas en entier.
// ============================================================================

export type Variante = 'a' | 'b' | null

export interface EntreeConsigne {
  cran: number
  variante: Variante
  /** L'énoncé du problème (`exercices_problemes.enonce`) — tel quel. */
  enonce: string | null
  /** Le diff du cas est-il une INSERTION (la version corrigée ajoute) ? */
  insertion: boolean
}

const LIS = 'Lis les documents ci-joints.'

/** L'énoncé, cité tel quel entre guillemets français — jamais reformulé. */
function probleme(enonce: string | null): string {
  const e = (enonce ?? '').trim()
  return e ? `« ${e} »` : '« … »'
}

/**
 * La consigne d'un cas du gabarit, ou `null` quand ce lot ne la sert pas
 * (crans 2, 6, 8 : le geste sur la pièce et le matériel, C7 à venir).
 */
export function consigneDuGabarit(e: EntreeConsigne): string | null {
  const { cran, variante, insertion } = e
  const p = probleme(e.enonce)
  switch (cran) {
    case 1:
      if (variante === 'b') {
        return `Voici une erreur courante : ${p} Lequel de ces quatre devoirs d'élève la commet ?`
      }
      return insertion
        ? `${LIS} Dans le devoir d'élève, à l'endroit en gras, il manque quelque chose. Quel est le problème ?`
        : `${LIS} Dans le devoir d'élève, le passage en gras a un problème. Lequel ?`
    case 3:
      return insertion
        ? `${LIS} À l'endroit en gras du devoir d'élève, il manque quelque chose : ${p} Laquelle de ces quatre versions n'a plus ce problème ?`
        : `${LIS} Le passage en gras du devoir d'élève a ce problème : ${p} Laquelle de ces quatre versions n'a plus ce problème ?`
    case 4:
      if (variante === 'b') {
        return `${LIS} Le devoir d'élève a ce problème : ${p} Surligne le passage qui le porte.`
      }
      return insertion
        ? `${LIS} Dans le devoir d'élève, à l'endroit en gras, il manque quelque chose. Dis quoi.`
        : `${LIS} Le passage en gras du devoir d'élève a un problème. Dis lequel.`
    case 5:
      return insertion
        ? `${LIS} À l'endroit en gras du devoir d'élève, il manque quelque chose : ${p} Écris ce qui manque.`
        : `${LIS} Le passage en gras du devoir d'élève a ce problème : ${p} Réécris ce passage pour qu'il n'ait plus ce problème.`
    case 7:
      return `${LIS} Le devoir d'élève a un problème. Surligne le passage qui le porte, et corrige-le.`
    case 9:
      return `${LIS} Le devoir d'élève a-t-il un problème ? Si oui, surligne le passage qui le porte et dis lequel. S'il n'en a pas, dis-le.`
    default:
      return null
  }
}

/** Les crans où le gabarit met en gras le passage — `10-` §5, table du marquage. */
/**
 * ⭐ 04/09 (`10-` §4 v0.8, Louis) — LE SECOND CAS D'UNE PAIRE EST TOUJOURS (b) :
 *    un 1(a) est suivi d'un 1(b), un 4(a) d'un 4(b). La variante de l'exercice est
 *    celle de son premier cas ; celle du second se DÉRIVE, et ne s'écrit pas.
 *    « Sinon l'élève comprend au bout de trois exercices qu'il doit répondre la
 *    même chose au second cas qu'au premier. »
 */
export function varianteDuCas(cran: number | null, variante: Variante, ordre: number): Variante {
  if ((cran === 1 || cran === 4) && ordre === 2 && variante !== null) return 'b'
  return variante
}

export function marqueLePassage(cran: number, variante: Variante): boolean {
  return (cran === 1 && variante !== 'b') || cran === 3 || (cran === 4 && variante !== 'b') || cran === 5
}

/** Les crans où l'élève DÉSIGNE dans le devoir — 4(b), 7 et 9 (`10-` §2). */
export function demandeUneDesignationAuGabarit(cran: number, variante: Variante): boolean {
  return (cran === 4 && variante === 'b') || cran === 7 || cran === 9
}

/** Le 1(b) ne sert AUCUN document : les quatre devoirs sont l'exercice (`10-` §3). */
export function sansDocuments(cran: number, variante: Variante): boolean {
  return cran === 1 && variante === 'b'
}
