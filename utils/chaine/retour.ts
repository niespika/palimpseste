// ============================================================================
// C4 · L5 — LE RETOUR : trois couches, trois variables, un texte SEGMENTÉ.
// ----------------------------------------------------------------------------
// « Il n'y a PAS DE PROMPT MAÎTRE : le retour s'assemble à l'exécution, en trois
//   couches — la couche CONTRAT (le gabarit du §4, et lui seul), la couche
//   COMPÉTENCE (le vocabulaire de la grille, le levier, la correspondance
//   observable → formulation, LUE EN BASE, déposée par la fabrique ; jamais lue
//   des fiches en session), la couche TYPE (la `consigne_instanciee` de
//   l'instance, et la table « Ce qui est servable ici », LUE DE LA DOCTRINE
//   DÉRIVÉE EN BASE). »                     — PROMPT, piège 30 ; `01-` §12
//
// « Trois variables, et pas d'autres : {{COMPETENCE}}, {{MOMENT}}, {{REGISTRE}}.
//   Ce que le modèle lit se nomme PAR SON CHAMP (le `levier` du verdict) ; ce
//   qu'il ÉCRIT lui-même — l'action de révision, le pont — ne porte aucune
//   variable : LE CODE le journalise ensuite. »   — piège 32 ; `07-` §4
//
// « Le texte se rend SEGMENTÉ, et c'est un contrat sur TOI : une liste de points,
//   chacun avec son identifiant stable, son ancrage et son texte — jamais un
//   bloc que l'écran devrait découper. »                — piège 33 ; §1.2
//
// Ce module est PUR : il assemble un prompt et contrôle une sortie. Ce qui vient
// de la base arrive ici en paramètre — un seul domicile pour chaque chose.
// ============================================================================

import { valider, type Forme, type Verdict } from './schema'
import {
  type Competence, type Grain, type Registre, type RetourSegmente, type Version,
} from './types'

// ── Les trois variables, et rien d'autre ────────────────────────────────────

/** `07-` §4 — « `{{...}}` ne désigne que ce que l'assembleur substitue. » */
export interface VariablesCalame {
  COMPETENCE: string
  MOMENT: Version
  REGISTRE: Registre
}

const TOKEN = /\{\{\s*(COMPETENCE|MOMENT|REGISTRE)\b[^}]*\}\}/g

/** Les trois valeurs que `{{REGISTRE}}` peut prendre — `01-` §8.7. */
const REGISTRES_DE_RETOUR = new Set(['descriptif', 'interrogatif', 'demonstratif'])

/**
 * Substitue les trois variables dans le gabarit dérivé. Un `{{X}}` inconnu
 * resterait tel quel — mais la dérivation refuse déjà une source qui en
 * porterait un quatrième, donc le cas ne se présente pas en production.
 *
 * ⚠️⚠️ LA COLLISION DE NOM EST UN MODE DE PANNE, PAS UNE HYPOTHÈSE (`07-` §4).
 * `{{REGISTRE}}` est le registre de RETOUR — descriptif / interrogatif /
 * démonstratif, élu par le `01-` §8.7. Le `REGISTRE` d'`utils/ia-commun.ts` est
 * le registre de LANGUE, le bloc de voix transversal : « substituer l'un dans
 * l'autre remplirait la règle 8 avec le bloc de langue ». La garde ci-dessous
 * ne coûte rien et rend le mode de panne impossible.
 */
export function coucheContrat(gabarit: string, v: VariablesCalame): string {
  if (!REGISTRES_DE_RETOUR.has(String(v.REGISTRE))) {
    throw new Error(
      '`{{REGISTRE}}` reçoit le registre de RETOUR (`01-` §8.7), jamais le '
      + 'registre de LANGUE d\'`ia-commun.ts` — `07-` §4, la collision de nom.')
  }
  return gabarit.replace(TOKEN, (_m, cle: keyof VariablesCalame) => String(v[cle]))
}

// ── Le gabarit DÉCOUPÉ EN SECTIONS NOMMÉES — `07-` §4 ───────────────────────

/**
 * Une section du gabarit, telle que la dérivation l'émet.
 * « Pour qu'un remplacement ait quelque chose d'identifié à remplacer, la
 *   dérivation émet le gabarit découpé en sections nommées. Le découpage est
 *   donné par ce document : les règles 1 à 6 et la règle 8 sont verrouillées,
 *   la règle 7 est la seule ouverte. »
 */
export interface SectionCalame {
  cle: string
  numero: number | null
  titre: string
  verrouillee: boolean
  corps: string
}

/** `07-` §4 — la seule section ouverte, et son nom dans la source. */
export const SECTION_LONGUEUR = 'regle_7'

/**
 * Le gabarit, assemblé DEPUIS SES SECTIONS — le seul chemin d'assemblage.
 *
 * `longueur` est le **paramètre de plateforme** du §4 : « son domicile est un
 * paramètre de plateforme, au même endroit que les interrupteurs (§5), **NULL
 * valant la règle 7 du gabarit** ». NULL ou vide → la règle 7 de la source
 * tient, mot pour mot.
 *
 * ⛔ Ce n'est PAS une variable : « `{{...}}` ne désigne que ce que l'assembleur
 *    substitue : `{{COMPETENCE}}`, `{{MOMENT}}` et `{{REGISTRE}}`. Il n'y en a
 *    pas d'autres. » Un remplacement de SECTION n'est pas une substitution.
 *
 * ⛔ Et une section VERROUILLÉE ne se remplace jamais : la garde est ici, pas
 *    dans l'appelant.
 */
export function assemblerGabarit(
  sections: readonly SectionCalame[],
  remplacements: { longueur?: string | null } = {},
): string {
  const longueur = remplacements.longueur?.trim()
  return sections.map((s) => {
    const corps = (longueur && s.cle === SECTION_LONGUEUR && !s.verrouillee)
      ? longueur
      : s.corps
    return s.numero == null ? corps : `${s.numero}. ${corps}`
  }).join('\n\n')
}

// ── La couche compétence — lue EN BASE, jamais des fiches en session ─────────

/** Une ligne de `competences_correspondance`, telle que la fabrique l'a déposée. */
export interface Correspondance {
  observable_code: string
  dimension_eleve: string
}

export interface CoucheCompetence {
  competence: Competence
  /** Le vocabulaire de la grille — « garant, articulation, attache… » (§4, règle 7). */
  vocabulaire: string[]
  /** La correspondance observable → formulation, lue en base (`07-` §1.1). */
  correspondance: Correspondance[]
}

// ── La couche type — lue de la DOCTRINE DÉRIVÉE en base ─────────────────────

export interface CoucheType {
  /** `exercices.consigne_instanciee` — ce que l'exercice servi demandait. */
  consigne: string
  /** Le grain de l'objet : il borne ce que le retour NOMME (§4, règle 2). */
  grain: Grain
  /**
   * « Ce qui est servable ici » — dérivé de `exercices_routes` × l'objet × le
   * mode × le cran (piège 4). Une ligne par observable servable, en langue de la
   * doctrine ; le retour n'en cite jamais le code (RR4).
   */
  servable: Array<{ competence: string; observable_nom: string }>
  /**
   * Aux trois crans de PRODUCTION, la table de routage ne porte rien — « les
   * tables ne peuvent pas les porter » (`04-` §0 et §14). Le patron de consigne
   * y tient l'autre moitié de la couche type. Dire « rien n'est déclaré » aurait
   * fait passer une règle de doctrine pour une donnée manquante.
   */
  patronProduction?: string | null
}

// ── Le plafond de la règle 2 ────────────────────────────────────────────────

/**
 * « En v1, réussites et points de travail confondus, le retour en nomme au plus
 * DEUX au grain micro, TROIS au méso, CINQ au macro — TOUTES COMPÉTENCES
 * COMPRISES. En version finale ce plafond ne borne QUE LES RÉUSSITES. »
 *
 * ⚠️ « Le plafond de la règle 2 n'est pas le plafond de cibles du routeur » :
 *    celui-ci borne ce qu'un exercice MESURE, celui-là ce que le retour NOMME
 *    (piège 37 ; `07-` §4).
 */
export const PLAFOND_NOMME: Record<Grain, number> = { micro: 2, meso: 3, macro: 5 }

export function plafondApplicable(grain: Grain, moment: Version): { plafond: number; porte: 'tout' | 'reussites' } {
  return { plafond: PLAFOND_NOMME[grain], porte: moment === 'v1' ? 'tout' : 'reussites' }
}

// ── L'assemblage ────────────────────────────────────────────────────────────

export interface EtatAnterieurObservable {
  observable_nom: string
  /** Ce que la fenêtre d'évidence porte — sans jamais nommer le code (RR4). */
  tendance: string
}

/**
 * Le fichier de personnalité PARTAGÉ, tel que la couche contrat le REÇOIT.
 *
 * « Le `ton` n'est pas propre au retour, et il n'a donc pas de domicile propre.
 *   C'est celui du fichier de personnalité partagé […], et la couche contrat le
 *   REÇOIT, ELLE N'EN PORTE PAS DE COPIE. » — `07-` §4
 *
 * ⚠️ `ton` est le registre de LANGUE (`REGISTRE` d'`utils/ia-commun.ts`), jamais
 *    le registre de retour de `{{REGISTRE}}` (`01-` §8.7).
 * ⛔ Et jamais `scriptorium_params.rag_prompt_ton` : c'est la section éditable
 *    DU TUTEUR — l'y accrocher ferait « le second fichier de personnalité que le
 *    §4 interdit ».
 */
export interface PersonnalitePartagee {
  /** Qui parle — l'identité, une pour toute la plateforme. */
  identite: string
  /** Le `ton` — le rappel de registre de langue que tous les prompts reçoivent. */
  ton: string
}

export interface EntreeRetour {
  moment: Version
  registre: Registre
  /**
   * Le fichier partagé, REÇU. Le gabarit, lui, ne porte que le RÔLE — « qui
   * parle, à qui, et sur quoi » —, et c'est ce qui « reste écrit au gabarit et
   * ne s'édite pas » (`07-` §4).
   */
  personnalite: PersonnalitePartagee
  /** `01-` §8.7, signal 1 : hors `evaluee`, aucun palier n'est attribué. */
  palierAttribue: boolean
  competencePrimaire: Competence
  couchesCompetence: CoucheCompetence[]
  coucheType: CoucheType
  /**
   * Par compétence : le squelette extrait, citations comprises, ET LE JUGEMENT —
   * « Tu reçois : le squelette extrait de sa copie […] ; LE VERDICT PAR
   * OBSERVABLE » (§4). La règle 4 fait puiser au modèle « le champ `levier` du
   * verdict » : sans le jugement, il devrait le réinventer, donc juger.
   */
  squelettes: Array<{ competence: Competence; extraction: unknown; jugement: unknown }>
  /**
   * « L'état antérieur de ces mêmes observables sur la fenêtre d'évidence, QUAND
   * IL EXISTE. Il n'existe pas à la semaine 1 : le retour s'en passe alors,
   * SANS LE SIGNALER À L'ÉLÈVE » (§4 ; `01-` §8.2 et §3).
   */
  etatAnterieur: EtatAnterieurObservable[] | null
  /** En version finale seulement : le squelette de la vf, et le retour de la v1. */
  squelettesVf?: Array<{ competence: Competence; extraction: unknown; jugement: unknown }>
  retourV1?: RetourSegmente | null
}

/** Le message de l'appel chaud. Le gabarit (couche contrat) part en SYSTÈME. */
export function assemblerRetour(gabarit: string, e: EntreeRetour): { systeme: string; message: string } {
  // L'identité et le `ton` viennent du fichier PARTAGÉ et précèdent le contrat :
  // le gabarit n'écrit que le rôle (« le guide d'exercices de Palimpseste »).
  const systeme = [
    e.personnalite.identite,
    e.personnalite.ton,
    coucheContrat(gabarit, {
      COMPETENCE: e.competencePrimaire,
      MOMENT: e.moment,
      REGISTRE: e.registre,
    }),
  ].map((x) => x.trim()).filter(Boolean).join('\n\n')

  const { plafond, porte } = plafondApplicable(e.coucheType.grain, e.moment)

  const morceaux: string[] = []

  morceaux.push([
    'COUCHE TYPE — ce que cet exercice demandait.',
    `Consigne servie : ${e.coucheType.consigne}`,
    `Grain : ${e.coucheType.grain}.`,
    e.coucheType.servable.length
      ? 'Ce qui est servable ici : '
        + e.coucheType.servable.map((s) => `${s.competence} — ${s.observable_nom}`).join(' ; ')
      : (e.coucheType.patronProduction
        ? `Ce cran est un cran de PRODUCTION : l'exercice ne cherche pas à isoler un observable, `
          + `il fait produire l'objet entier. Patron de la consigne : ${e.coucheType.patronProduction}`
        : "Ce qui est servable ici : la doctrine n'en déclare rien pour ce couple."),
  ].join('\n'))

  for (const c of e.couchesCompetence) {
    morceaux.push([
      `COUCHE COMPÉTENCE — ${c.competence}.`,
      c.vocabulaire.length ? `Vocabulaire de la grille : ${c.vocabulaire.join(', ')}.` : '',
      c.correspondance.length
        ? 'Les dimensions, dites à l\'élève : '
          + c.correspondance.map((x) => x.dimension_eleve).filter(Boolean).join(' ; ')
        : '',
    ].filter(Boolean).join('\n'))
  }

  morceaux.push('SQUELETTE ET VERDICTS — ' + (e.moment === 'v1' ? 'la v1.' : 'la v1, puis la version finale.'))
  morceaux.push(JSON.stringify(e.squelettes))
  if (e.moment === 'vf') {
    morceaux.push([
      "SQUELETTE DE LA VERSION FINALE — c'est la COMPARAISON DES DEUX qui engendre ce retour.",
      // RR2 (`01-` §12) — il manquait à l'assemblage, alors que RR1, RR3 et RR4
      // y sont : « en version finale, le "pourquoi" causal devient UN CONSTAT ».
      'RR2 : en version finale, le « pourquoi » causal devient UN CONSTAT — « ce qui manque',
      'encore, d\'après les deux versions », et JAMAIS « pourquoi ça n\'a pas marché ».',
    ].join('\n'))
    morceaux.push(JSON.stringify(e.squelettesVf ?? []))
    if (e.retourV1) {
      morceaux.push('LE RETOUR QUI LUI AVAIT ÉTÉ DONNÉ SUR SA v1 :')
      morceaux.push(JSON.stringify(e.retourV1.points.map((p) => p.texte)))
    }
  }

  // « Il n'existe pas à la semaine 1 : le retour s'en passe alors, sans le
  //   signaler à l'élève. » → on n'écrit RIEN, pas même « pas d'historique ».
  if (e.etatAnterieur && e.etatAnterieur.length) {
    morceaux.push('ÉTAT ANTÉRIEUR (fenêtre d\'évidence) — ce qui permet de dire le progrès :')
    morceaux.push(e.etatAnterieur.map((a) => `${a.observable_nom} : ${a.tendance}`).join('\n'))
  }

  morceaux.push([
    'CE QUE TU RENDS — un JSON, et rien d\'autre.',
    '{ "points": [ { "competence": "<l\'une des compétences ci-dessus>",',
    '                "nature": "reussite" | "point_de_travail",',
    '                "ancrage": { "source": "copie" | "texte_support", "citation": "<verbatim>" },',
    '                "texte": "<le point, adressé à l\'élève>" } ],',
    e.moment === 'v1'
      ? '  "action_revision": "<l\'action concrète, faisable en dix minutes>", "feed_forward": null }'
      : '  "action_revision": null, "feed_forward": "<le pont : la prochaine fois…>" }',
    '',
    porte === 'tout'
      ? `PLAFOND : au plus ${plafond} point(s) EN TOUT, réussites et points de travail confondus, toutes compétences comprises.`
      : `PLAFOND : au plus ${plafond} RÉUSSITE(S) ; ce qui n'a pas bougé se dit plus largement, jamais complètement.`,
    'ANCRAGE : chaque citation porte sa source — "copie" pour les mots de l\'élève,',
    '"texte_support" pour le texte d\'auteur. Ne jamais attribuer à l\'élève une phrase de l\'auteur.',
    'INTERDIT : le nom des observables, les seuils, ce qui fait basculer un palier,',
    'et toute note, lettre ou moyenne. Les DIMENSIONS se disent, en langue élève.',
    e.palierAttribue
      ? ''
      : 'CE RETOUR N\'ATTRIBUE AUCUN PALIER : il montre ce que le squelette contient.',
  ].filter(Boolean).join('\n'))

  return { systeme, message: morceaux.join('\n\n') }
}

// ── Le contrat de sortie ────────────────────────────────────────────────────

/** Le schéma STRICT de ce que le modèle rend. Le code y ajoutera les identifiants. */
export const FORME_RETOUR: Forme = {
  type: 'objet',
  champs: {
    points: {
      type: 'liste', min: 1, max: 12,
      de: {
        type: 'objet',
        champs: {
          competence: { type: 'texte', min: 1 },
          nature: { type: 'enum', valeurs: ['reussite', 'point_de_travail'] },
          ancrage: {
            type: 'objet',
            champs: {
              source: { type: 'enum', valeurs: ['copie', 'texte_support'] },
              citation: { type: 'texte', min: 1 },
            },
          },
          texte: { type: 'texte', min: 1 },
        },
      },
    },
    action_revision: { type: 'ou', formes: [{ type: 'texte', min: 1 }, { type: 'nul' }] },
    feed_forward: { type: 'ou', formes: [{ type: 'texte', min: 1 }, { type: 'nul' }] },
  },
  optionnels: ['action_revision', 'feed_forward'],
}

interface PointBrut {
  competence: string
  nature: 'reussite' | 'point_de_travail'
  ancrage: { source: 'copie' | 'texte_support'; citation: string }
  texte: string
}
interface RetourBrut { points: PointBrut[]; action_revision?: string | null; feed_forward?: string | null }

/**
 * L'identifiant stable d'un point. C'est LE CODE qui le pose, jamais le modèle :
 * il doit survivre à l'édition du professeur, et « le drapeau des contestations
 * répétées » compte dessus (§1.2).
 */
export function identifiantStable(depotId: string, moment: Version, index: number): string {
  return `${depotId}:${moment}:${String(index + 1).padStart(2, '0')}`
}

export interface ControleRetour {
  /** Ce qui fait REJETER la sortie et relancer l'appel (`01-` §12, défense 2). */
  refus: string[]
  /** Ce qui se journalise sans arrêter — le contrôle des citations, par exemple. */
  alertes: string[]
}

/** `01-` §12, RR4 — le nom d'un observable dans le texte est une fuite de grille. */
function fuitesRR4(texte: string, codes: readonly string[]): string[] {
  const bas = texte.toLowerCase()
  return codes.filter((c) => c.length >= 4 && bas.includes(c.toLowerCase()))
}

/**
 * `07-` §4, règle 6 — « JAMAIS DE NOTE, de lettre ou de moyenne dans le texte ».
 * Le détecteur est volontairement ÉTROIT : un contrôle qui crie faux entraîne à
 * l'ignorer. Il ne cherche que des formes qui n'ont pas d'autre sens.
 */
const MOTIFS_NOTE: Array<[RegExp, string]> = [
  [/\b\d{1,2}([.,]\d+)?\s*\/\s*(10|20|100)\b/, 'une note chiffrée'],
  [/\bmoyenne\s+(de|:)\s*\d/i, 'une moyenne chiffrée'],
  [/\b(palier|niveau|note|lettre)\s*:?\s*[«"']?\s*[EDCBA]\b/, 'un palier ou une lettre attribués'],
  [/\btu es (?:à|au niveau) [EDCBA]\b/i, 'une lettre attribuée'],
]

export function controlerRetour(
  brut: unknown,
  attendu: { moment: Version; grain: Grain; codesObservables: readonly string[]; competencesAdmises: readonly string[] },
): { verdict: Verdict<RetourBrut>; controle: ControleRetour } {
  const verdict = valider<RetourBrut>(brut, FORME_RETOUR)
  const controle: ControleRetour = { refus: [], alertes: [] }
  if (!verdict.ok) return { verdict, controle }

  const r = verdict.valeur

  // La règle 5 : en v1 une action de révision, en vf le pont. Toujours l'un des deux.
  if (attendu.moment === 'v1' && !r.action_revision) {
    controle.refus.push('règle 5 : la v1 se termine par une action de révision concrète — champ vide')
  }
  if (attendu.moment === 'vf' && !r.feed_forward) {
    controle.refus.push('règle 5 : la version finale se termine par le pont — champ vide')
  }

  // Le plafond de la règle 2.
  const { plafond, porte } = plafondApplicable(attendu.grain, attendu.moment)
  const compte = porte === 'tout' ? r.points.length : r.points.filter((p) => p.nature === 'reussite').length
  if (compte > plafond) {
    controle.refus.push(
      `règle 2 : au grain ${attendu.grain}, le retour nomme au plus ${plafond} `
      + `${porte === 'tout' ? 'point(s) en tout' : 'réussite(s)'} — reçu ${compte}`)
  }

  // La règle 2 encore : « COMMENCE PAR UNE RÉUSSITE réelle, citée. »
  if (r.points.length && r.points[0].nature !== 'reussite') {
    controle.refus.push('règle 2 : le retour commence par une réussite réelle, citée')
  }

  for (const p of r.points) {
    if (!attendu.competencesAdmises.includes(p.competence)) {
      controle.refus.push(`un point porte la compétence « ${p.competence} », hors de celles que l'exercice mesure`)
    }
  }

  const texteEntier = [...r.points.map((p) => p.texte), r.action_revision ?? '', r.feed_forward ?? ''].join('\n')
  const fuites = fuitesRR4(texteEntier, attendu.codesObservables)
  if (fuites.length) {
    controle.refus.push(`RR4 : le texte nomme des observables — ${fuites.join(', ')}`)
  }
  for (const [motif, quoi] of MOTIFS_NOTE) {
    if (motif.test(texteEntier)) controle.refus.push(`règle 6 : le texte porte ${quoi}`)
  }

  return { verdict, controle }
}

/** Pose les identifiants stables et rend la forme qui s'écrit en base. */
export function segmenter(brut: RetourBrut, depotId: string, moment: Version): RetourSegmente {
  return {
    points: brut.points.map((p, i) => ({
      id: identifiantStable(depotId, moment, i),
      ancrage: p.ancrage,
      texte: p.texte,
      competence: p.competence as RetourSegmente['points'][number]['competence'],
      nature: p.nature,
    })),
    action_revision: brut.action_revision ?? null,
    feed_forward: brut.feed_forward ?? null,
  }
}
