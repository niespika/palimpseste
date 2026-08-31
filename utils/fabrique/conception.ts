// ============================================================================
// C4 · L8 — LA CONCEPTION EN LIGNE : ce que la doctrine borne, et ce que
// l'écran en tire.
// ----------------------------------------------------------------------------
// « Deux portes de conception, un import » (`02-` §6 B ; `01-` §2 ; piège 26) :
//   · les formatifs en `composer` se conçoivent dans CODEX ;
//   · les autres — `restituer`, `expliquer`, `évaluer`, `interroger` — dans
//     ALETHEIA ;
//   · les textes d'auteur, les références décomposées et le corpus vivent au
//     SCRIPTORIUM — le professeur y dépose, il ne conçoit pas là.
//   *L'atelier est un attribut visuel, jamais un interlocuteur différent.*
//
// ⚠️ AUCUN APPEL DE MODÈLE ICI. « Ce qui s'engendre — matériaux, appuis,
//    références — s'engendre AU GÉNÉRATEUR, HORS PLATEFORME, et arrive par
//    l'import » (`07-` §2). Ce module ne fait que BORNER une saisie.
// ============================================================================

import { marquerLeMateriau, type SegmentMateriau } from '../deroule/marquage'
import type { Doctrine, RouteDoctrine } from './doctrine'
import { banqueDeConsignes, competencesMesurables, dureeExercice, observablesIsoles } from './doctrine'

export type Porte = 'aletheia' | 'codex'

/** `02-` §6 B ; `01-` §2. L'atelier se lit du MODE, jamais de l'objet. */
export function porteDuMode(mode: string): Porte {
  return mode === 'composer' ? 'codex' : 'aletheia'
}

/**
 * Les OBJETS déclarables pour un englobant donné.
 *
 * « L'objet, choisi parmi les treize, FILTRÉS PAR LA PLAGE ADMISE DE
 * `support_source`, QUI BORNE L'ENGLOBANT et non la sélection. L'objet n'est pas
 * le support : sur "quel est le plan de ce texte", l'objet est `plan` et
 * l'englobant un `extrait` » (`02-` §6 B.1 ; §1.2 ; piège 27).
 */
export function objetsPourEnglobant(d: Doctrine, supportEnglobant: string): string[] {
  return Object.values(d.objets)
    .filter((o) => o.supportSource.includes(supportEnglobant))
    .map((o) => o.code).sort()
}

/**
 * Les MODES déclarables pour un objet, à une porte donnée.
 *
 * « Le mode NE SE DÉRIVE DE RIEN — ni du cran, ni de l'objet » (`02-` §3) ; ce
 * qui le borne est le `modes[]` de l'objet et la table des modes admis. Et
 * « le couple (objet, mode) n'est pas déclarable si AUCUNE compétence de l'objet
 * n'admet le mode » (`02-` §6 B ; piège 30).
 */
export function modesDeclarables(d: Doctrine, objet: string, porte: Porte): string[] {
  const o = d.objets[objet]
  if (!o) return []
  return o.modes
    .filter((m) => (porte === 'codex' ? m === 'composer' : m !== 'composer'))
    .filter((m) => competencesMesurables(d, objet, m).length > 0)
}

/** Les crans admis par l'objet — « les neuf » partout aujourd'hui (`04-` §0). */
export function cransDeclarables(d: Doctrine, objet: string): number[] {
  return [...(d.objets[objet]?.crans ?? [])].sort((a, b) => a - b)
}

/**
 * LES QUATRE RÈGLES DE CONCEPTION qui lient le mode au matériau
 * (`02-` §2.3.3 ; refus n° 10 de l'import ; piège 30).
 *
 * Elles disent CE QU'UNE CONSIGNE A LE DROIT DE DÉCLARER — elles n'élisent
 * rien : « le matériau BORNE ce qui est déclarable ; il n'élit pas. C'est le
 * professeur qui choisit le mode à la conception. »
 */
export function competencesDeclarables(
  d: Doctrine, objet: string, mode: string,
  auteurEnSource: boolean, auteurEnCible: boolean,
): Array<{ competence: string; mode: string; ouverte: boolean; motif?: string }> {
  const o = d.objets[objet]
  if (!o) return []
  const modeEx = mode
  return o.competences.map((comp) => {
    const admis = d.modesAdmis[comp] ?? []
    if (!admis.includes(mode)) {
      return { competence: comp, mode, ouverte: false,
        motif: `la table des modes admis ne donne pas \`${mode}\` à cette compétence (02- §3)` }
    }
    const mono = admis.length === 1
    // Règle 3 — sans texte d'auteur nulle part, seul `composer` est déclarable,
    // « SAUF POUR UNE COMPÉTENCE MONO-MODE, dont le mode n'est pas élu mais
    // DÉCLARÉ par la table du §3 ». La Synthèse est le seul cas où la clause mord.
    if (mode !== 'composer' && !auteurEnSource && !auteurEnCible && !mono) {
      return { competence: comp, mode, ouverte: false,
        motif: 'règle 3 : aucun texte d’auteur servi — le seul mode déclarable est `composer`' }
    }
    // Règle 4 — un `texte_auteur` en SOURCE ferme `composer` à l'Argumentation
    // et au Questionnement ; il le laisse à la Structure sur un exercice en
    // `restituer`, `évaluer` ou `interroger` ; il le garde à l'Expression et à
    // la Connaissance, « qui seraient sinon IMMESURABLES ».
    if (auteurEnSource && mode === 'composer') {
      if (comp === 'argumentation' || comp === 'questionnement') {
        return { competence: comp, mode, ouverte: false,
          motif: 'règle 4 : un `texte_auteur` en source ferme `composer` pour cette compétence' }
      }
      if (comp === 'structure' && !['restituer', 'évaluer', 'interroger'].includes(modeEx)) {
        return { competence: comp, mode, ouverte: false,
          motif: 'règle 4 : `composer` n’est ouvert à la Structure sur un texte d’auteur '
            + 'qu’en `restituer`, `évaluer` ou `interroger`' }
      }
    }
    return { competence: comp, mode, ouverte: true }
  })
}

/** Ce que le CRAN commande, et que le professeur ne choisit pas. */
export interface CeQueLeCranCommande {
  cran: number
  code: string
  geste: string
  appui: string
  /** `présent` · `null` · `présent ou null` — « c'est LE CRAN qui décide si la
   *  sélection est `materiau_cible` ou `materiau_source` » (`02-` §6 B.1). */
  materiauCible: string
  /** Les quatre champs d'appui, présents ou nuls (`02-` §2.2 et §2.3.4). */
  defaut: boolean
  distracteurs: boolean
  reponseAttendue: boolean
  guide: 'null' | 'complet' | 'léger'
  jugement: string
  /** « Aux trois crans de diagnostic, l'écran EXIGE LA PAIRE » (`02-` §6 B). */
  nombreDeCas: 1 | 2
  regimeV1vf: string
  couverture: string
  /** La durée, DÉRIVÉE du geste et du grain — jamais saisie (`02-` §2.4). */
  dureeMin: number | null
}

export function ceQueLeCranCommande(
  d: Doctrine, objet: string, cran: number,
): CeQueLeCranCommande | null {
  const c = d.crans[cran]
  if (!c) return null
  return {
    cran, code: c.code, geste: c.geste, appui: c.appui,
    materiauCible: c.materiauCible,
    defaut: c.defaut === 'présent',
    distracteurs: c.distracteurs === 'présent',
    reponseAttendue: c.reponseAttendue === 'présent',
    guide: c.guide,
    jugement: c.jugement,
    nombreDeCas: c.geste === 'diagnostiquer' ? 2 : 1,
    regimeV1vf: c.regimeV1vf,
    couverture: c.couverture,
    dureeMin: dureeExercice(d, objet, cran),
  }
}

/** La BANQUE DE CONSIGNES du couple objet × mode × cran (`02-` §6 B). */
export function consignesDuCouple(
  d: Doctrine, objet: string, mode: string, cran: number, genre?: string | null,
) {
  return banqueDeConsignes(d, objet, mode, cran, genre)
}

/** Les observables ROUTÉS ici — « l'observable vient DE LA ROUTE, pas de la
 *  saisie » (`04-` §0 ; `02-` §6 B.1). C'est lui qui remplit la couverture
 *  « sans une saisie de plus ». */
export function observablesDuCouple(
  d: Doctrine, objet: string, mode: string, cran: number,
): RouteDoctrine[] {
  return observablesIsoles(d, objet, mode, cran)
}

/** Les provenances admises du `materiau_source` pour ce couple (`04-` §0). */
export function provenancesSource(d: Doctrine, objet: string, mode: string): string[] {
  return d.objets[objet]?.sourceParMode[mode]?.provenances ?? []
}

/** Les supports admis du `materiau_source` — la PLAGE de l'objet (`02-` §1.2). */
export function supportsSource(d: Doctrine, objet: string, mode: string): string[] {
  return d.objets[objet]?.sourceParMode[mode]?.supports ?? []
}

/** Les GENRES admis de l'objet — non nuls sur les trois objets terminaux, `null`
 *  partout ailleurs, « et il n'y est jamais `null` » (`02-` §1.3). */
export function genresDeclarables(d: Doctrine, objet: string): string[] {
  return d.objets[objet]?.genres ?? []
}

/**
 * Ce que la conception a le droit d'écrire, vérifié AVANT l'écriture.
 * Rend la liste des empêchements, vide quand tout passe.
 *
 * Le contrôle d'import fait foi sur le fond ; celui-ci ne fait que refuser une
 * SAISIE incomplète, avec le motif de la source.
 */
// ── LA `cible_primaire` — `07-` §1.1, et le cas où elle NE SE DEMANDE PAS ────

/**
 * Ce que l'écran de conception doit faire de la `cible_primaire`.
 *
 * « Sur la voie du professeur, l'écran de conception la lui demande — parmi les
 *   compétences que son exercice mesure, ET UNE SEULE ; quand il n'y en a QU'UNE
 *   POSSIBLE — l'exercice n'en mesure qu'une, ou le cran est de `transformer` ou
 *   de `diagnostiquer`, où l'instance n'a qu'une cible (`01-` §5) —, L'ÉCRAN LA
 *   POSE SANS LA DEMANDER. »                                    — `07-` §1.1
 *
 * ⭐ Un champ TOUJOURS AFFICHÉ est un écart à la source, pas un confort : c'est
 *    pourquoi cette fonction rend `demande: false` avec la valeur, plutôt que de
 *    laisser l'écran décider.
 *
 * Aux crans qui isolent, la cible est celle de l'OBSERVABLE ISOLÉ : « `transformer`
 * et `diagnostiquer` déclarent `isole`, et l'instance choisit UN SEUL DÉFAUT
 * INJECTÉ — donc UNE SEULE CIBLE » (`01-` §5). Elle ne se choisit donc pas : elle
 * se lit sur la route élue.
 */
export interface CiblePrimaireDeLInstance {
  /** L'écran doit-il POSER LA QUESTION ? Faux quand une seule cible est possible. */
  demande: boolean
  /** Les compétences entre lesquelles choisir — vide quand `demande` est faux. */
  candidates: string[]
  /** La cible, quand elle se déduit sans demander. */
  imposee: string | null
  /** Pourquoi elle ne se demande pas — pour que l'écran le DISE. */
  motif: string | null
}

export function ciblePrimaireDeLInstance(saisie: {
  geste: string | null
  /** La compétence de l'observable isolé, quand le cran isole. */
  observableCompetence: string | null
  /** Les compétences que l'instance déclare mesurer. */
  competences: readonly string[]
}): CiblePrimaireDeLInstance {
  const mesurees = [...new Set(saisie.competences.filter(Boolean))]
  if (saisie.geste === 'transformer' || saisie.geste === 'diagnostiquer') {
    return {
      demande: false,
      candidates: [],
      imposee: saisie.observableCompetence || (mesurees.length === 1 ? mesurees[0] : null),
      motif: 'ce cran ISOLE : l’instance n’a qu’une cible, celle de l’observable isolé (01- §5)',
    }
  }
  if (mesurees.length === 1) {
    return {
      demande: false,
      candidates: [],
      imposee: mesurees[0],
      motif: 'l’instance ne mesure qu’une compétence : il n’y a rien à choisir',
    }
  }
  return { demande: mesurees.length > 1, candidates: mesurees, imposee: null, motif: null }
}

/**
 * La cible RETENUE, re-dérivée côté serveur — « un écran n'est pas une garde ».
 * Rend `null` quand rien ne la fixe et que le professeur n'a rien choisi, ou
 * quand son choix est hors des compétences mesurées.
 */
export function ciblePrimaireRetenue(
  regle: CiblePrimaireDeLInstance, choisie: string | null,
): string | null {
  if (!regle.demande) return regle.imposee
  return choisie && regle.candidates.includes(choisie) ? choisie : null
}

export function empechementsDeConception(d: Doctrine, saisie: {
  objet: string; mode: string; cran: number; genre: string | null
  competences: Record<string, string>
  provenanceSource: string | null; supportSource: string | null
  provenanceCible: string | null; supportCible: string | null
  englobant: [number, number] | null
  observableCode: string | null; observableCompetence: string | null
  guide: string | null
  cas: Array<{ consigne: string; defaut: string | null; distracteurs: string[] | null
    reponseAttendue: string | null; pourquoiJuste?: string | null; materiauId: string | null }>
}): string[] {
  const out: string[] = []
  const o = d.objets[saisie.objet]
  const c = d.crans[saisie.cran]
  if (!o) return ['objet inconnu']
  if (!c) return ['cran inconnu']
  if (!o.crans.has(saisie.cran)) out.push(`le cran ${saisie.cran} est hors des \`crans[]\` de \`${saisie.objet}\``)

  // Le genre — non nul sur les trois objets terminaux, `null` ailleurs.
  if (o.genres.length > 0) {
    if (!saisie.genre) out.push(`\`${saisie.objet}\` est terminal : une instance sans genre est refusée (02- §1.3)`)
    else if (!o.genres.includes(saisie.genre)) out.push(`genre \`${saisie.genre}\` inadmis pour \`${saisie.objet}\``)
  } else if (saisie.genre) {
    out.push(`\`genre\` non nul sur \`${saisie.objet}\`, qui n'en porte pas`)
  }
  // `explication_texte_tc` exige un texte d'auteur en source (`02-` §1.3).
  if (saisie.genre === 'explication_texte_tc' && saisie.provenanceSource !== 'texte_auteur') {
    out.push('`explication_texte_tc` exige un `texte_auteur` en matériau source (02- §1.3)')
  }
  // L'englobant, obligatoire et non vide sur l'objet `phrase` (`04-` §11).
  if (saisie.objet === 'phrase' && saisie.provenanceSource === 'texte_auteur'
      && (!saisie.englobant || saisie.englobant[1] <= saisie.englobant[0])) {
    out.push("l'objet `phrase` exige un `englobant` non vide — sa règle d'instance exige le co-texte (04- §11)")
  }
  // Le support de la source, dans la plage admise de l'objet (`02-` §1.2).
  if (saisie.provenanceSource === 'texte_auteur' && saisie.supportSource
      && !o.supportSource.includes(saisie.supportSource)) {
    out.push(`\`support\` \`${saisie.supportSource}\` hors de la plage admise de \`${saisie.objet}\``)
  }
  // La présence de la cible suit LE CRAN (`02-` §2.2).
  if (c.materiauCible === 'présent' && !saisie.provenanceCible) {
    out.push(`le cran ${saisie.cran} exige un \`materiau_cible\``)
  }
  if (c.materiauCible === 'null' && saisie.provenanceCible) {
    out.push(`le cran ${saisie.cran} veut \`materiau_cible\` nul`)
  }
  // Les modes par compétence.
  const entrees = Object.entries(saisie.competences)
  if (entrees.length === 0) out.push('aucune compétence mesurée déclarée')
  const auteurSource = saisie.provenanceSource === 'texte_auteur'
  const auteurCible = saisie.provenanceCible === 'texte_auteur'
  for (const { competence, ouverte, motif } of
    competencesDeclarables(d, saisie.objet, saisie.mode, auteurSource, auteurCible)) {
    if (competence in saisie.competences && !ouverte) out.push(`\`${competence}\` : ${motif}`)
  }
  // L'observable isolé — il vient de la ROUTE (refus n° 15, blocage n° 3).
  if (c.isole) {
    if (!saisie.observableCode) out.push(`le cran ${saisie.cran} isole : un observable est exigé`)
    else {
      const routes = observablesIsoles(d, saisie.objet, saisie.mode, saisie.cran)
        .filter((r) => r.code === saisie.observableCode
          && r.competence === saisie.observableCompetence)
      if (routes.length === 0) {
        out.push(`l'observable \`${saisie.observableCode}\` n'est pas routé pour `
          + `\`${saisie.objet}\` × \`${saisie.mode}\` au cran ${saisie.cran}`)
      } else if (!d.consignesIsolees[`${routes[0].competence}|${routes[0].section}`]?.[saisie.cran]) {
        out.push(`l'observable \`${saisie.observableCode}\` n'a pas de consigne écrite pour `
          + `le cran ${saisie.cran} — la route existe, la consigne manque (blocage n° 3)`)
      }
    }
  } else if (saisie.observableCode) {
    out.push(`le cran ${saisie.cran} n'isole rien : aucun observable ne s'y déclare (04- §14)`)
  }
  // Le guide suit le cran.
  if (c.guide === 'null' && saisie.guide) out.push(`le cran ${saisie.cran} ne sert aucun guide`)
  if (c.guide !== 'null' && !saisie.guide?.trim()) {
    out.push(`le cran ${saisie.cran} exige un guide ${c.guide}`)
  }
  // LA PAIRE — « aux trois crans de diagnostic, l'écran EXIGE la paire :
  // un seul exercice, DEUX CAS de la même famille, DEUX MATÉRIAUX DISTINCTS ».
  const attendus = c.geste === 'diagnostiquer' ? 2 : 1
  if (saisie.cas.length !== attendus) {
    out.push(`${saisie.cas.length} cas au cran ${saisie.cran}, ${attendus} attendu(s) — `
      + (attendus === 2 ? 'la paire est UN SEUL exercice, en deux temps'
        : 'seul le diagnostic va par paires'))
  }
  if (attendus === 2 && saisie.cas.length === 2
      && saisie.cas[0].materiauId && saisie.cas[0].materiauId === saisie.cas[1].materiauId) {
    out.push('les deux cas de la paire visent le même matériau — un cas servi deux fois '
      + 'ne mesure aucun transfert')
  }
  saisie.cas.forEach((cs, i) => {
    const ou = `cas ${i + 1}`
    if (!cs.consigne?.trim()) out.push(`${ou} : la consigne est vide`)
    if (c.defaut === 'présent' && !cs.defaut?.trim()) {
      out.push(`${ou} : le cran ${saisie.cran} exige un \`defaut\` — c'est lui qui décide `
        + "quel observable est isolé")
    }
    if (c.defaut === 'null' && cs.defaut) out.push(`${ou} : le cran ${saisie.cran} n'injecte rien`)
    if (c.reponseAttendue === 'présent' && !cs.reponseAttendue?.trim()) {
      out.push(`${ou} : le cran ${saisie.cran} exige une \`reponse_attendue\``)
    }
    if (c.reponseAttendue === 'null' && cs.reponseAttendue) {
      out.push(`${ou} : le cran ${saisie.cran} ne déclare aucune \`reponse_attendue\``)
    }
    const dis = cs.distracteurs ?? []
    if (c.distracteurs === 'présent') {
      // LE PLANCHER : « l'instance en tire TROIS » (`02-` §5).
      if (dis.length < 3) {
        out.push(`${ou} : ${dis.length} distracteur(s) en banque — l'instance en tire TROIS, `
          + "l'écran ne peut pas se composer")
      }
    } else if (dis.length > 0) {
      out.push(`${ou} : le cran ${saisie.cran} ne sert aucun distracteur`)
    }
    // ⭐ C4-L14 — LE JUMEAU DU REFUS N° 12 POUR LA VOIE EN LIGNE. **Deux voies,
    //    une seule règle : si l'import refuse, l'écran doit refuser aussi.**
    //    Le discriminant est la présence des DISTRACTEURS — les crans 1 et 3 —,
    //    jamais celle de la réponse attendue : « là où la réponse attendue est
    //    un CANDIDAT, elle a besoin d'un pourquoi ; ailleurs, elle EST le
    //    pourquoi » (`08-` §5.2).
    // ⚠️ SON ABSENCE NE S'EMPÊCHE PAS. À l'import elle SIGNALE, et un empêchement
    //    ici la ferait refuser : l'écran serait alors PLUS STRICT que le format,
    //    et une instance importable deviendrait inconcevable en ligne.
    if (c.distracteurs !== 'présent' && cs.pourquoiJuste?.trim()) {
      out.push(`${ou} : le cran ${saisie.cran} ne déclare aucun \`pourquoi_juste\` : sa `
        + '`reponse_attendue` EST déjà le pourquoi')
    }
  })
  return out
}

/**
 * L'APERÇU — l'instance telle que LES RÈGLES LA PLACENT.
 *
 * « Une consigne juste au mauvais endroit de l'écran est une consigne fausse, et
 * c'est le seul moment où cela se voit » (`07-` §2 ; piège 33).
 *   · le `materiau_source` s'affiche DANS LES TEXTES DE SUPPORT, « pas dans la
 *     consigne » ;
 *   · le `materiau_cible` est CE SUR QUOI L'ÉLÈVE TRAVAILLE — le texte à
 *     corriger, la copie à juger ;
 *   · le `guide` se sert AVANT la v1 ;
 *   · aux crans 1 et 3, QUATRE candidats — trois distracteurs TIRÉS de la
 *     banque, plus la `reponse_attendue` — et JAMAIS QUINZE ;
 *   · aux crans 4, 5, 7 et 9, AUCUN candidat ;
 *   · aux crans de diagnostic, LE CAS 1 PUIS LE CAS 2, la correction du premier
 *     servie AVANT le second ;
 *   · la durée indicative, un entier.
 *
 * ⚠️ RIEN DE CE QUE LE ROUTEUR OU LE DÉROULÉ ÉLISENT : ni rappel des observables
 *    faibles, ni démonstration du temps 1, ni registre. « L'aperçu est
 *    l'INSTANCE, pas la semaine de l'élève. »
 */
export interface ApercuCas {
  ordre: number
  consigne: string
  /** Les textes de support — c'est là, et pas dans la consigne, que la source
   *  s'affiche. */
  materiauSource: string | null
  /** Ce sur quoi l'élève travaille. */
  materiauCible: string | null
  /**
   * ⭐ C4-L15 — CE QUE L'ÉCRAN Y METTRA EN ÉVIDENCE, découpé en segments
   * (`02-` §5) — **le professeur doit voir ce que l'élève verra**. `null` là où
   * il n'y a pas de cible.
   *
   * ⚠️ **LE TIRAGE N'A PAS BOUGÉ D'UN CARACTÈRE** : `tirerTrois` reste
   * délibérément déterministe, « pour qu'un rechargement ne change pas ce que le
   * professeur relit ». Le marquage se POSE sur les candidats que l'aperçu tire
   * déjà — il ne les retire pas.
   *
   * ⚠️ Le texte reste octet pour octet celui de `materiauCible` : la
   * concaténation des segments le rend à l'identique.
   */
  materiauCibleMarque: SegmentMateriau[] | null
  /** QUATRE candidats, mêlés — jamais quinze. Vide hors des crans 1 et 3. */
  candidats: string[]
  /** Servie AVANT le cas 2, aux crans de diagnostic. */
  correctionServieAvantLeSuivant: string | null
  /**
   * ⭐ C4-L14 — « pourquoi ce candidat-là est le bon », tel que l'élève le lira
   * à la correction. `null` hors des crans 1 et 3, où la `reponse_attendue` EST
   * le pourquoi. ⚠️ **Le TIRAGE n'a pas bougé** : `tirerTrois` reste
   * délibérément déterministe, « pour qu'un rechargement ne change pas ce que le
   * professeur relit » — on MONTRE le pourquoi, on ne retouche pas l'aperçu.
   */
  pourquoiJuste: string | null
}

export interface Apercu {
  /** Servi AVANT la v1 — « le guide n'est pas le retour ». */
  guide: string | null
  /**
   * ⭐⭐ LE CO-TEXTE des crans de production — la MATIÈRE, servie aux trois.
   * ⚠️ Ne pas le confondre avec le `guide`, que l'échelle DÉGRADE (complet au
   *    cran 2, léger au 6, absent au 8) : la matière, elle, ne bouge pas.
   */
  coTexte: string | null
  dureeMin: number | null
  regimeV1vf: string
  cas: ApercuCas[]
  /** Ce que l'aperçu NE MONTRE PAS, dit à l'écran pour qu'on ne le cherche pas. */
  horsChamp: string[]
}

/** Un tirage DÉTERMINISTE — l'aperçu doit être stable d'un affichage à l'autre.
 *  Le tirage réel de la passation est algorithmique et vit au déroulé. */
function tirerTrois(banque: string[], graine: string): string[] {
  if (banque.length <= 3) return [...banque]
  // ⛔⛔ `Math.imul`, ET les bits HAUTS — voir `credence.ts:melerAvecGraine`.
  //    L'aperçu reste DÉTERMINISTE, c'est sa raison d'être ; il cesse seulement
  //    de tirer toujours les mêmes rangs. *Un aperçu biaisé montrait au
  //    professeur un tirage que la passation ne produirait jamais.*
  let h = 0
  for (let i = 0; i < graine.length; i++) h = (Math.imul(h, 31) + graine.charCodeAt(i)) >>> 0
  const restants = [...banque]
  const out: string[] = []
  for (let k = 0; k < 3; k++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0
    out.push(...restants.splice(Math.floor((h / 4294967296) * restants.length), 1))
  }
  return out
}

export function composerApercu(d: Doctrine, instance: {
  objet: string; cran: number
  materiauSourceTexte: string | null
  materiauCibleTexte: string | null
  coTexte: string | null
  guide: string | null
  cas: Array<{ consigne: string; distracteurs: string[] | null
    reponseAttendue: string | null; pourquoiJuste?: string | null
    materiauContenu: string | null
    /**
     * ⭐ C4-L15 — « le même matériau SANS le défaut » (`08-` §4). Elle sert
     * UNIQUEMENT à calculer le passage fautif aux crans 3 et 5, et **elle ne
     * ressort pas** : `marquerLeMateriau` ne rend que des tranches de
     * `materiauContenu`. ⚠️ Côté élève c'est LA RÉPONSE ; côté professeur elle
     * n'est pas secrète, mais on ne la fait pas voyager pour autant.
     */
    materiauVersionCorrigee?: string | null }>
}): Apercu | null {
  const c = d.crans[instance.cran]
  if (!c) return null
  const cible = c.materiauCible !== 'null'
  const cas: ApercuCas[] = instance.cas.map((cs, i) => {
    const banque = cs.distracteurs ?? []
    // « L'écran sert QUATRE candidats : trois distracteurs tirés de la banque,
    // plus la `reponse_attendue` » (`02-` §5). Aux quatre autres crans qui
    // isolent, AUCUN candidat.
    const candidats = c.distracteurs === 'présent'
      ? [...tirerTrois(banque, `${instance.objet}|${instance.cran}|${i}`),
        ...(cs.reponseAttendue ? [cs.reponseAttendue] : [])]
      : []
    const materiauCible = cible ? (cs.materiauContenu ?? instance.materiauCibleTexte) : null
    return {
      ordre: i + 1,
      consigne: cs.consigne,
      materiauSource: instance.materiauSourceTexte,
      materiauCible,
      // ⭐⭐ C4-L15 — LE PROFESSEUR VOIT CE QUE L'ÉLÈVE VERRA. « Une consigne
      //    juste au mauvais endroit de l'écran est une consigne fausse, et
      //    c'est le seul moment où cela se voit » — cela vaut aussi pour ce que
      //    l'écran met en évidence dans le matériau.
      // ⚠️ On passe LES CANDIDATS QUE CET APERÇU SERT, pas la banque : les
      //    mêmes quatre que la ligne du dessus vient de tirer, pour que le
      //    marquage colle à ce qui est affiché juste à côté.
      // ⭐ Le tirage lui-même n'est pas touché : il reste déterministe.
      materiauCibleMarque: marquerLeMateriau(
        materiauCible, d.crans[instance.cran]?.marquage ?? null,
        { candidats, versionCorrigee: cs.materiauVersionCorrigee ?? null }),
      candidats,
      // « La correction du premier cas est SERVIE AVANT LE SECOND — c'est elle
      // qui rend l'écart des deux crédences interprétable » (`02-` §2.3.1 a).
      correctionServieAvantLeSuivant:
        c.geste === 'diagnostiquer' && i === 0 ? (cs.reponseAttendue ?? null) : null,
      // Il ne se montre QUE là où il a un sens — les deux crans à candidats.
      pourquoiJuste: c.distracteurs === 'présent' ? (cs.pourquoiJuste ?? null) : null,
    }
  })
  // ── ⭐⭐ C4-L15 — LE GUIDE NE S'AFFICHE PLUS AU CRAN 6 ──────────────────────
  // `04-` §14.1 : « AU CRAN 6, LE GUIDE EST DANS LA CONSIGNE — ET NE S'AFFICHE
  // DONC PAS DEUX FOIS. » L'aperçu doit montrer CE QUE L'ÉLÈVE VERRA : s'il
  // continuait d'afficher le bloc, il mentirait sur l'écran qu'il annonce.
  // ⭐ La condition est DÉRIVÉE : la doctrine met `léger` au cran 6, et à lui
  //    seul (`02-` §2.2) — pas de numéro de cran écrit ici.
  // ⛔ Le CHAMP reste obligatoire au cran 6, et le contrôle de saisie qui
  //    l'exige n'est pas touché : c'est lui qui remplit la case du patron.
  // ⚠️ LA MÊME GARDE QU'AU DÉROULÉ (`utils/deroule/vue.ts`) : on ne replie que
  //    là où la consigne porte EFFECTIVEMENT le guide. Par la voie de
  //    conception en ligne, `banqueDeConsignes` l'y met — c'est prouvable ; par
  //    la voie d'import, rien ne le garantit, et replier un guide que la
  //    consigne ne porte pas ferait d'un cran 6 un cran 8 en silence.
  const memeSouffle = (x: string) => x.replace(/\s+/g, ' ').trim()
  const guideDansLaConsigne = instance.guide !== null
    && memeSouffle(instance.guide) !== ''
    && instance.cas.some((cs) => memeSouffle(cs.consigne).includes(memeSouffle(instance.guide!)))
  return {
    guide: c.guide === 'null' || (c.guide === 'léger' && guideDansLaConsigne)
      ? null : instance.guide,
    // ⛔ AUCUNE CONDITION DE CRAN ICI, et c'est le fond de l'affaire : le guide
    //    se retire à mesure que l'échelle monte, LA MATIÈRE NON. Au cran 8 il
    //    ne reste que le co-texte — l'en priver viderait l'exercice.
    coTexte: instance.coTexte,
    dureeMin: dureeExercice(d, instance.objet, instance.cran),
    regimeV1vf: c.regimeV1vf,
    cas,
    horsChamp: [
      'le rappel des deux ou trois observables les plus faibles — le routeur l’élit',
      'la démonstration du temps 1 — le déroulé l’élit',
      'le registre du retour — il se recalcule à chaque exercice',
    ],
  }
}
