// ============================================================================
// ALETHEIA · E2 — LA FORME DE L'ÉTAYAGE, DÉCIDÉE PAR LE CODE (jamais par un prompt).
// Module PUR. Aucune base, aucune I/O.
// ----------------------------------------------------------------------------
// « Le niveau sur l'axe ARGUMENTS décide si le passage est montré, à surligner,
//   ou à chercher dans une demi-section, et deux séances consécutives sont
//   requises pour changer de forme. » — SPEC_Aletheia_Etayage_par_niveau.md § 7.1
//
// ⭐ L'AXE ARGUMENTS SEUL. C'est l'axe le plus robuste du diagnostic, et son biais
//    mesuré (−1, sévère) pousse vers PLUS d'aide, jamais moins (D10).
// ⭐ ASYMÉTRIE, MAIS SUR UN E SEULEMENT (D17, Louis, 03/09 : « un D peut être un D
//    mal lu »). Retirer de l'aide exige deux séances d'accord ; en donner davantage
//    n'en exige qu'une, mais seulement sur un E — un échec réel. Un D isolé, que le
//    biais sévère du diagnostic peut avoir lu à la place d'un C, attend la séance
//    suivante comme tout le monde. Mesuré au rejeu des 38 travaux de prod (§ 13.4).
// ⭐ SÉANCE 1 : « montre » pour tout le monde — aucun diagnostic encore (D13).
// ============================================================================

/** Les trois formes, de la plus étayée à la moins étayée. */
export type Forme = 'montre' | 'fenetre' | 'demi_section'

const RANG: Record<Forme, number> = { montre: 0, fenetre: 1, demi_section: 2 }
const FORMES: readonly Forme[] = ['montre', 'fenetre', 'demi_section']

/** Un diagnostic d'une séance ANTÉRIEURE, tel que lu dans `aletheia_diagnostic`. Niveaux 0 (E) → 4 (A). */
export interface NiveauSeance {
  semaine: number
  niveau_arguments_vf: number | null
  niveau_arguments_v1: number | null
}

export interface DecisionForme {
  forme: Forme
  /** Pourquoi — journalisé sur le travail et lisible du prof. */
  motif: string
  /** Le niveau retenu par séance, du plus ancien au plus récent (pour l'audit). */
  niveaux: { semaine: number; niveau: number }[]
}

/** La forme visée par un niveau, sans hystérésis. E, D → montre ; C, B → fenêtre ; A → demi-section. */
export function cibleDuNiveau(niveau: number): Forme {
  if (niveau <= 1) return 'montre'
  if (niveau <= 3) return 'fenetre'
  return 'demi_section'
}

/** Le niveau retenu pour une séance : la VF (après aide) d'abord, la V1 à défaut, sinon rien. */
export function niveauRetenu(d: NiveauSeance): number | null {
  const n = d.niveau_arguments_vf ?? d.niveau_arguments_v1
  if (n == null || Number.isNaN(n)) return null
  return Math.max(0, Math.min(4, Math.round(n)))
}

export interface OptionsForme {
  /**
   * `'sur_E'` (D17, défaut) : plus d'aide en UNE séance seulement sur un E ; tout le
   * reste en DEUX. `'toujours'` (l'ancien D10) : plus d'aide en une séance dès que la
   * cible baisse. `'jamais'` : deux séances dans les deux sens. Les trois variantes
   * sont mesurées au rejeu E2 (§ 13.4 du spec).
   */
  asymetrie: 'sur_E' | 'toujours' | 'jamais'
}

/**
 * Décide la forme de la séance N.
 * @param anterieurs   diagnostics des séances < N (ordre quelconque, doublons tolérés : le dernier gagne)
 * @param formeCourante forme servie à la séance précédente (`aletheia_travaux.forme`), ou null
 */
export function decider(
  anterieurs: readonly NiveauSeance[], formeCourante: Forme | null, options: OptionsForme = { asymetrie: 'sur_E' },
): DecisionForme {
  const parSemaine = new Map<number, number>()
  for (const d of [...anterieurs].sort((a, b) => a.semaine - b.semaine)) {
    const n = niveauRetenu(d)
    if (n != null) parSemaine.set(d.semaine, n)
  }
  const niveaux = [...parSemaine.entries()].map(([semaine, niveau]) => ({ semaine, niveau }))
  const courante: Forme = formeCourante ?? 'montre'

  if (niveaux.length === 0) {
    return { forme: 'montre', motif: 'aucun diagnostic antérieur : montre (séance 1, ou diagnostic indisponible)', niveaux }
  }
  const dernier = niveaux[niveaux.length - 1]
  const cible = cibleDuNiveau(dernier.niveau)

  if (cible === courante) {
    return { forme: courante, motif: `séance ${dernier.semaine} à ${lettre(dernier.niveau)} : ${courante} confirmée`, niveaux }
  }
  const baisse = RANG[cible] < RANG[courante]
  const toutDeSuite = options.asymetrie === 'toujours' || (options.asymetrie === 'sur_E' && dernier.niveau === 0)
  if (baisse && toutDeSuite) {
    return { forme: cible, motif: `séance ${dernier.semaine} à ${lettre(dernier.niveau)} : plus d'aide tout de suite, ${courante} → ${cible}`, niveaux }
  }
  // Changer de forme (moins d'aide ; ou plus d'aide sans E) : il faut deux séances
  // consécutives d'accord sur la même cible.
  const avant = niveaux[niveaux.length - 2]
  if (avant && cibleDuNiveau(avant.niveau) === cible) {
    return { forme: cible, motif: `séances ${avant.semaine} et ${dernier.semaine} à ${lettre(avant.niveau)}/${lettre(dernier.niveau)} : ${courante} → ${cible}`, niveaux }
  }
  return { forme: courante, motif: `séance ${dernier.semaine} à ${lettre(dernier.niveau)} viserait ${cible}, mais une seule séance : ${courante} maintenue`, niveaux }
}

/** Ordre des formes, utile aux écrans et aux tests. */
export function rang(f: Forme): number { return RANG[f] }
export function toutesLesFormes(): readonly Forme[] { return FORMES }

const lettre = (n: number) => ['E', 'D', 'C', 'B', 'A'][n] ?? '?'
