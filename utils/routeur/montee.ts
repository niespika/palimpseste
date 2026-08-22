// ============================================================================
// C4 · L2 — LA RÈGLE DE MONTÉE (§8.8) : le sens ASCENDANT.
// ----------------------------------------------------------------------------
// « Le système ne traitait que le sens DESCENDANT — que faire quand un élève
//   bloque. Le sens MONTANT était posé sans être exécutable, et la seule chose
//   qui ouvrait un cran à un élève était LA LETTRE QUI MONTE — alors que la
//   lettre est trop grossière pour voir le progrès. »
//
//   M-a  L'unité d'assignation est LE COUPLE (`grain`, `cran`), pas le grain seul.
//   M-b  AUCUNE CASE N'EST FERMÉE : une part MINORITAIRE de cases au-dessus de la
//        bande — les SONDES DE MONTÉE. Chiffrée à la table de la couche 3 (§4) ;
//        RIEN CHEZ A, dont la montée passe au grain.
//   M-c  LE PRÉREQUIS VA DU GRAIN, PAS DU CRAN : on monte en cran AU GRAIN
//        COURANT, puis on REPORTE le cran acquis au grain supérieur. État à tenir :
//        le cran atteint PAR GRAIN. « NE PAS STOCKER LA DISTRIBUTION ELLE-MÊME,
//        ELLE DIVERGERAIT. »
//   M-d  DEUX sondes réussies à la MÊME CASE déplacent la masse. PAS DE TAUX,
//        PAS DE FENÊTRE GLISSANTE.
//   M-e  Une mesure de sonde de montée est MARQUÉE et NEUTRE pour tout le reste.
//
// ⚠️ DEUX SONDES À NE JAMAIS CONFONDRE : la sonde de MONTÉE vérifie l'aisance
//    au-dessus du palier courant, n'entraîne pas, et NE COMPTE PAS dans le
//    déclenchement de N1 (M-e) · la sonde SECONDAIRE mesure en silence une
//    compétence non ciblée, et elle COMPTE (§8.6).
//
// Ce fichier est PUR.
// ============================================================================

import { BANDES_CRANS, SONDES_MONTEE_POUR_DEPLACER } from './config'
import type { CodeCran, Grain, Palier } from './types'

/** `01-` §8.8, M-a — « la couche 3 choisit une CASE DE LA MATRICE ». */
export interface Case { grain: Grain; cran: CodeCran }

/** `07-` §1.3 — `competences_montee`, clé (élève × compétence × GRAIN). */
export interface EtatMontee {
  grain: Grain
  /** Le cran atteint pour ce grain — « deux ou trois petits entiers ». */
  cranAtteint: number | null
}

/** `02-` §1.1 — l'ordre des grains ; M-c reporte du courant au SUPÉRIEUR. */
export const GRAINS: Grain[] = ['micro', 'meso', 'macro']

export function grainSuperieur(g: Grain): Grain | null {
  const i = GRAINS.indexOf(g)
  return i < 0 || i + 1 >= GRAINS.length ? null : GRAINS[i + 1]
}

/**
 * `01-` §8.8, M-b — la part des sondes de montée, LUE À LA TABLE DE LA COUCHE 3,
 * « rien chez A ». Elle ne se recode pas : `BANDES_CRANS` la porte déjà.
 */
export function partDesSondesDeMontee(palier: Palier): number {
  return BANDES_CRANS[palier].au_dessus.part
}

/** `01-` §8.8, M-b — les cases au-dessus de la bande : celles qu'une sonde vise. */
export function cransDeSonde(palier: Palier): CodeCran[] {
  return BANDES_CRANS[palier].au_dessus.crans
}

/**
 * `01-` §8.8, M-b — « AUCUNE CASE N'EST FERMÉE ». Une case est SERVABLE quand le
 * grain la porte ; ce qui varie est la MASSE, jamais l'ouverture.
 *
 * ⚠️ « La distribution NE SE STOCKE JAMAIS : elle divergerait du jour où on
 *    l'écrirait » (M-c). Elle se DÉRIVE, à chaque construction de cycle.
 */
export function distribution(
  palier: Palier, etats: readonly EtatMontee[], grain: Grain,
): Array<{ cran: CodeCran; part: number; zone: 'sous_la_bande' | 'centre' | 'au_dessus' }> {
  const bande = BANDES_CRANS[palier]
  const atteint = etats.find((e) => e.grain === grain)?.cranAtteint ?? null
  const out: Array<{ cran: CodeCran; part: number; zone: 'sous_la_bande' | 'centre' | 'au_dessus' }> = []
  for (const zone of ['sous_la_bande', 'centre', 'au_dessus'] as const) {
    const z = bande[zone]
    if (z.crans.length === 0 || z.part === 0) continue
    // « La part se donne par ZONE, pas par cran » : on la répartit dans la zone.
    for (const cran of z.crans) out.push({ cran, part: z.part / z.crans.length, zone })
  }
  // M-c — le cran atteint à ce grain ne ferme rien ; il dit seulement d'où l'on part.
  void atteint
  return out
}

/**
 * `01-` §8.8, M-d — « DEUX sondes de montée réussies À LA MÊME CASE déplacent la
 * masse : retirée aux crans bas du grain MAÎTRISÉ, ajoutée aux crans bas du grain
 * SUPÉRIEUR. PAS DE TAUX, PAS DE FENÊTRE GLISSANTE. »
 *
 * *« Pourquoi M-d n'utilise pas le critère d'acquisition ordinaire : le critère
 *   ordinaire — ~2/3 sur la fenêtre d'évidence — NE PEUT PAS S'APPLIQUER PAR
 *   CASE. »* D'où un simple décompte cumulé, sans oubli.
 */
export interface SondeDeMontee { grain: Grain; cran: CodeCran; reussie: boolean }

export interface DeplacementDeMasse {
  /** La case qui a déclenché le report. */
  case_: Case
  /** Le grain dont les crans bas perdent de la masse. */
  grainMaitrise: Grain
  /** Le grain dont les crans bas en gagnent — `null` au macro, qui n'a pas de supérieur. */
  grainSuperieur: Grain | null
  motif: string
}

export function deplacementsDeMasse(
  sondes: readonly SondeDeMontee[],
): DeplacementDeMasse[] {
  const compte = new Map<string, number>()
  const out: DeplacementDeMasse[] = []
  for (const s of sondes) {
    if (!s.reussie) continue // « une sonde est ratée souvent » — seules les réussies comptent
    const cle = `${s.grain}|${s.cran}`
    const n = (compte.get(cle) ?? 0) + 1
    compte.set(cle, n)
    if (n === SONDES_MONTEE_POUR_DEPLACER) {
      out.push({
        case_: { grain: s.grain, cran: s.cran },
        grainMaitrise: s.grain,
        grainSuperieur: grainSuperieur(s.grain),
        motif: `${SONDES_MONTEE_POUR_DEPLACER} sondes de montée réussies à la case `
          + `(${s.grain}, ${s.cran}) : la masse se déplace vers le grain supérieur.`,
      })
    }
  }
  return out
}

/**
 * `01-` §8.8, M-c — le report du cran acquis au grain supérieur.
 * « On monte en cran AU GRAIN COURANT, puis on REPORTE le cran acquis au grain
 *   supérieur. » L'état à tenir est le cran atteint PAR GRAIN — et rien d'autre.
 */
export function reporterAuGrainSuperieur(
  etats: readonly EtatMontee[], deplacement: DeplacementDeMasse, rangDuCran: (c: CodeCran) => number,
): EtatMontee[] {
  const suivant = deplacement.grainSuperieur
  if (!suivant) return [...etats] // « rien au-dessus du macro »
  const rang = rangDuCran(deplacement.case_.cran)
  const copie = etats.map((e) => ({ ...e }))
  const cible = copie.find((e) => e.grain === suivant)
  if (cible) {
    // Jamais de retour en arrière : le cran atteint ne redescend pas.
    cible.cranAtteint = Math.max(cible.cranAtteint ?? 0, rang)
  } else {
    copie.push({ grain: suivant, cranAtteint: rang })
  }
  return copie
}

/**
 * `01-` §9 — l'ASYMÉTRIE : « une sonde réussie ne compte pour la montée QUE SI LA
 * COMPÉTENCE SONDÉE EST `evaluee` » (§8.9, borne (a)).
 *
 * ⚠️ À ne pas confondre avec M-e, qui rend la mesure de sonde de MONTÉE neutre
 *    partout ailleurs — acquisition et stagnation comprises.
 */
export function sondeCompte(statutRecette: string): boolean {
  return statutRecette === 'evaluee'
}
