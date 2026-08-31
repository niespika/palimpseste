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

import { messageAvecMateriau } from './anti-injection'
import { citationTient, jugerLAncrage, type AncrageBrut } from './citation-verifiee'
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
  /**
   * ⭐⭐ L'ÉTALON — item 86. `02-` 6.0 §2.3.4 : « une production modèle : à quoi
   * peut ressembler une bonne réponse ». Il est là pour BORNER ce retour, pas
   * pour être comparé : « rien ne se compare mot à mot », et « une production a
   * plusieurs bonnes formes ». Aux trois crans de production seulement.
   */
  etalonProduction?: string | null
  /**
   * ⭐⭐ 31/08/2026 — LE MATÉRIAU TRAVAILLÉ ET L'ATTENDU, par cas.
   *
   * ⛔ IL NE SE CONFOND PAS AVEC `etalonProduction`, et les deux peuvent
   *    coexister sur un même dépôt. L'étalon est **une production MODÈLE** — un
   *    repère de niveau, aux crans où l'élève PRODUIT (2, 6, 7, 8). Ceci est
   *    **ce que l'exercice portait** : le texte sur lequel l'élève a travaillé,
   *    et la réponse que la banque déclare. Deux objets, deux cadrages, deux
   *    blocs dans le message.
   *
   * ⚠️ `null` sur les deux champs d'un cas est NORMAL : un cran de production
   *    n'a pas de matériau. Les cas entièrement vides ne partent pas.
   */
  casServis?: ReadonlyArray<{
    ordre: number
    materiau: string | null
    reponseAttendue: string | null
  }>
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
  /**
   * ⭐⭐ C5-L2 — LE TEXTE SUPPORT : **ce que l'élève a lu**, et rien de plus.
   *
   * ⚠️⚠️ **SANS LUI, RR3 EST STRUCTURELLEMENT INTENABLE.** Le §4 énumère ce que
   *    le modèle reçoit — le squelette, le verdict, l'état antérieur, le retour
   *    de la v1 — et **aucun texte d'auteur** ; `assemblerRetour` ne lui en
   *    donnait aucun. Or on lui demande de citer l'auteur : *« un modèle à qui
   *    l'on demande de citer l'auteur sans lui donner l'auteur ne peut recopier
   *    que ce qu'il trouve dans le squelette — et le squelette est fait de LA
   *    COPIE »*. **C'est le mécanisme exact de la faute que RR3 décrit** : « le
   *    retour finit par attribuer à l'élève une phrase de l'auteur qu'il
   *    citait » (`01-` §12).
   *
   * ⭐ *L'incident de RR2 est l'argument* : la règle y était, elle manquait à
   *    l'assemblage, et elle n'arrivait donc pas au modèle. **Ce qui n'est pas
   *    écrit dans le message n'arrive pas au modèle.**
   *
   * ⛔ `null` sur tout exercice d'écriture : il n'y a pas de texte d'auteur, et
   *    le bloc ne s'écrit alors pas du tout — on n'annonce pas un matériau vide.
   *
   * ⛔ **CE N'EST PAS LA RÉFÉRENCE DÉCOMPOSÉE.** Ses moments, ses lectures
   *    défendables et son armature sont la grille de la réception **et la
   *    réponse** — RR4 les tient hors du retour. *Le texte source, lui, est
   *    exactement ce que l'élève doit lire.*
   */
  texteSupport?: string | null
  /**
   * ⭐⭐ 31/08 — LE CO-TEXTE, la matière des crans de PRODUCTION (2·6·8).
   *
   * L'argument à illustrer, les deux paragraphes à coudre, la thèse à
   * contredire. **L'élève l'a sous les yeux** (`EcranDeroule.tsx`) ; Calame ne
   * l'avait pas, et jugeait donc « as-tu bien illustré ? » sans savoir QUOI.
   * ⛔ **Ce n'est PAS un texte d'auteur** : il est fabriqué, sans auteur ni
   *    bornes, et il ne fait de l'exercice ni une lecture ni une explication.
   */
  coTexte?: string | null
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
    // ⭐⭐ L'ÉTALON — item 86. Il vient APRÈS le patron, et il est nommé pour ce
    //    qu'il est : un repère, jamais une réponse. Le `02-` 6.0 §2.3.4 fixe les
    //    deux moitiés de sa raison d'être — « elle guide son retour autant
    //    qu'elle le borne » —, et sa limite : « une production a plusieurs
    //    bonnes formes, et l'étalon en donne UNE, jamais la seule ».
    // ⛔ La phrase qui suit est écrite POUR ÊTRE LUE PAR LE MODÈLE : sans elle,
    //    un étalon posé nu se lit comme le corrigé, et l'écart à sa lettre
    //    deviendrait la note. C'est exactement ce qu'on veut empêcher.
    ...(e.coucheType.etalonProduction ? [
      'ÉTALON — une production que le professeur tient pour bonne à ce cran :',
      e.coucheType.etalonProduction,
      "⚠️ Ce n'est PAS la réponse attendue, et l'élève n'avait pas à l'écrire. "
      + "Une production a plusieurs bonnes formes ; celle-ci en est une. "
      + "Sers-t'en pour situer le NIVEAU exigé — l'ampleur, la précision, ce qui "
      + "doit y figurer — jamais pour comparer mot à mot, ni pour reprocher un "
      + "écart de contenu, de plan ou d'exemple. Une copie qui atteint le même "
      + "niveau par un autre chemin vaut celle-ci.",
    ] : []),
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

  // ⭐⭐ C5-L2 — LE TEXTE SUPPORT, ET IL PASSE PAR LE BALISAGE.
  //
  // `01-` §12, défense 1 : « entrées DÉLIMITÉES — la copie arrive dans un bloc
  // balisé, jamais concaténée aux consignes, et la consigne déclare que ce bloc
  // est DU MATÉRIAU, JAMAIS UNE INSTRUCTION ». La chaîne emploie déjà
  // `messageAvecMateriau` pour P1 et pour le Monitoring, `slots.ts` par slot, et
  // le générateur de C5-L1 pour ses trois passages ; **l'appel du retour était le
  // seul à concaténer ses morceaux à la main**. Le texte qu'on y ajoute est un
  // texte d'AUTEUR importé d'un fichier : il ne se colle pas nu.
  //
  // ⚠️ Aucun outil n'est attaché à cet appel, et il ne faut pas en ajouter
  //    (défense 3 : `AppelIA` n'a pas de champ `tools`).
  if (e.texteSupport && e.texteSupport.trim() !== '') {
    morceaux.push(messageAvecMateriau(
      [{ nom: "le texte support — le texte d'auteur que l'élève a lu", contenu: e.texteSupport }],
      'RR3 — CE BLOC EST « LE TEXTE SUPPORT ». Toute citation que tu en tires porte\n'
      + '`ancrage.source = "texte_support"`. Une citation des mots de l\'élève porte\n'
      + '`"copie"`, et elle se trouve dans le squelette ci-dessous. ⛔ Ne jamais\n'
      + 'attribuer à l\'élève une phrase de l\'auteur.\n'
      + '\n'
      + "CET EXERCICE EST UN EXERCICE DE LECTURE : l'élève travaille SUR CE TEXTE.\n"
      + 'Un point peut donc porter sur ce que LE TEXTE dit — un mot de l\'auteur\n'
      + "qu'il a manqué, déplacé ou mal rendu. Un tel point s'ancre sur\n"
      + '`"texte_support"` et cite LE TEXTE ; un point qui porte sur ce que\n'
      + "l'élève a écrit s'ancre sur `\"copie\"` et cite ses mots.",
    ))
  }

  // ⭐⭐ 31/08/2026 — LE CO-TEXTE, ET IL PASSE PAR LE BALISAGE LUI AUSSI.
  //
  // ⛔ **CE QUE CE BLOC RÉPARE.** Aux crans 2·6·8 la consigne DÉSIGNE un texte —
  //    « voici l'argument à illustrer », « écris la transition entre ces deux
  //    paragraphes ». L'écran le montre à l'élève depuis le 31/08 ; Calame, elle,
  //    ne l'a jamais reçu. Elle jugeait donc l'exécution d'une tâche dont elle
  //    ignorait l'énoncé. Mesuré : **21 exercices de la banque en dépendent**,
  //    sept à chacun des trois crans de production.
  //
  // ⚠️⚠️ **IL N'OUVRE AUCUNE TROISIÈME SOURCE DE CITATION.** `ancrage.source`
  //    reste `copie | texte_support` — le schéma le dit, la garde en base
  //    l'impose, et l'écran ne sait afficher que ces deux chapeaux. Le co-texte
  //    est là pour être COMPRIS, pas cité : le retour parle de ce que l'élève a
  //    écrit. Attribuer à l'élève une phrase du co-texte est exactement la faute
  //    que RR3 nomme, et `controlerRR3` la refuse comme celle du texte d'auteur.
  if (e.coTexte && e.coTexte.trim() !== '') {
    morceaux.push(messageAvecMateriau(
      [{ nom: "le texte de départ — la matière que l'exercice a donnée à l'élève",
         contenu: e.coTexte }],
      "CE BLOC EST LA MATIÈRE QUE L'EXERCICE A DONNÉE. La consigne la désigne :\n"
      + "c'est l'argument à illustrer, les paragraphes à coudre, la thèse à\n"
      + "contredire. L'élève l'avait sous les yeux ; tu l'as maintenant, pour\n"
      + "juger si ce qu'il a écrit répond bien À CELA.\n"
      + '\n'
      + "⛔ CE N'EST NI SA COPIE, NI UN TEXTE D'AUTEUR. N'en cite RIEN : aucune\n"
      + 'citation ne porte ce bloc pour source. Tu peux y renvoyer en le nommant\n'
      + "(« l'argument qu'on te donnait »), jamais en le recopiant entre\n"
      + "guillemets, et JAMAIS sous « tu écris » — ces mots ne sont pas de lui.",
    ))
  }

  // ⭐⭐ 31/08/2026 — LE MATÉRIAU TRAVAILLÉ ET L'ATTENDU. Décision de Louis :
  //    « la seule IA qui devrait avoir le matériau et l'attendu de réponse,
  //    c'est Calame lors du retour chaud. » Le juge P1/P2 n'en reçoit rien : il
  //    mesure des observables de compétence, pas la justesse de l'exercice.
  // ⛔ BALISÉ, comme le texte support et pour la même raison : le matériau vient
  //    d'un IMPORT DE FICHIER (`08-` §4), il ne se colle jamais nu.
  const casServis = (e.coucheType.casServis ?? [])
    .filter((c) => c.materiau || c.reponseAttendue)
  if (casServis.length) {
    const blocs = casServis.flatMap((c) => [
      ...(c.materiau
        ? [{ nom: `le matériau du cas ${c.ordre} — ce que l'élève avait sous les yeux`,
          contenu: c.materiau }]
        : []),
      ...(c.reponseAttendue
        ? [{ nom: `la réponse attendue du cas ${c.ordre}`, contenu: c.reponseAttendue }]
        : []),
    ])
    morceaux.push(messageAvecMateriau(blocs,
      "CE QUE L'EXERCICE PORTAIT. Le matériau est le texte SUR LEQUEL l'élève a\n"
      + "travaillé — ce n'est pas lui qui l'a écrit. La réponse attendue est celle\n"
      + 'que le professeur a déposée en banque.\n'
      + '\n'
      + '⛔ NE LES CITE JAMAIS COMME DES MOTS DE L\'ÉLÈVE : toute citation ancrée\n'
      + '`"copie"` doit se trouver dans SA production, dans le squelette ci-dessous.\n'
      + '⛔ NE RECOPIE PAS LA RÉPONSE ATTENDUE, ET NE LA PARAPHRASE PAS. Elle est\n'
      + "là pour que tu saches CE QUI ÉTAIT DEMANDÉ, donc pour que ton jugement\n"
      + "porte sur l'écart réel — pas pour être servie à l'élève. À plusieurs\n"
      + "crans il lui reste une version finale à écrire : lui donner la réponse\n"
      + 'maintenant lui retirerait son exercice.\n'
      + '\n'
      + "Sers-t'en pour ANCRER ce que tu dis dans ce qu'il avait à faire — « le\n"
      + "passage disait X, tu as écrit Y » — et pour ne plus parler dans le vide\n"
      + 'quand la consigne dit « ce passage » ou « ce texte ».'))
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
    // ⭐⭐ C5-L2-bis — CETTE LIGNE N'EXISTE QUE S'IL Y A UN TEXTE SUPPORT, ET
    //    C'EST TOUTE SA SÛRETÉ : le corpus calibré au banc est celui de
    //    l'ÉCRITURE, qui n'en a pas — il ne voit donc pas un octet de plus.
    //    ⛔ Elle ne commente ni ne réécrit la règle 1 du gabarit (§4, GELÉ) :
    //    elle dit ce que chaque étiquette DÉSIGNE, ce qui est le propre de
    //    l'assemblage — « ce qui t'appartient est l'ASSEMBLAGE, et c'est là que
    //    RR3 se renforce ».
    e.texteSupport && e.texteSupport.trim() !== ''
      ? 'UN POINT PEUT PORTER SUR LE TEXTE autant que sur la copie : ce que l\'auteur '
        + 'dit et que l\'élève a manqué s\'ancre sur "texte_support".'
      : '',
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
  /**
   * ⚠️ FACULTATIF — non pas parce que le modèle a le droit de l'omettre
   * (`FORME_RETOUR` l'EXIGE, et la validation passe avant), mais parce que
   * `controlerRetour` peut l'AVOIR RETIRÉ : une citation que le code ne
   * retrouve pas dans la copie est élaguée. Le type dit donc la vérité de ce
   * qui sort, pas de ce qui entre.
   */
  ancrage?: { source: 'copie' | 'texte_support'; citation: string }
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
  /**
   * ⭐⭐ VRAI quand il y a des refus ET QUE TOUS SONT DE FORME.
   *
   * **Les refus n'ont pas tous la même nature, et le confondre coûte cher dans
   * les deux sens.** Deux familles :
   *
   *  · **FALSIFICATION** — RR3 *(une phrase de l'auteur donnée pour celle de
   *    l'élève)*, RR4 *(le nom d'un observable : c'est la grille qui fuit)*, la
   *    règle 6 *(une note, une lettre)*, une compétence hors de ce que
   *    l'exercice mesure. **Publier ça, c'est faire lire à l'élève quelque chose
   *    de FAUX, ou lui montrer le barème.** ⛔ Jamais toléré, à aucune tentative.
   *
   *  · **FORME** — la règle 2 *(commencer par une réussite ; le plafond du
   *    grain)* et la règle 5 *(l'action de révision, le pont)*. Ce sont des
   *    contrats de RÉDACTION. Un retour qui ne commence pas par une réussite
   *    est maladroit ; il n'est pas mensonger.
   *
   * ⚠️⚠️ **ET LA RÈGLE 2 PEUT ÊTRE INSATISFAISABLE.** Le gabarit exige
   *    *« COMMENCE PAR UNE RÉUSSITE **réelle**, citée »* : sur une copie très
   *    faible, il se peut qu'il n'y en ait pas. **Constaté en PROD le 27/08 :
   *    TROIS copies refusées pour ce seul motif, dont une déjà rejouée en vain.**
   *    Sans ce partage, un rejeu automatique tournerait en boucle sur elles et
   *    brûlerait un appel à chaque tour — pour un retour qui ne viendrait jamais.
   *    *« Si ça se trouve, il n'y a pas de réussite »* — décision de Louis,
   *    27/08 : au bout de trois tentatives, **on sert le retour et le professeur
   *    relit**.
   */
  formeSeulement: boolean
}

/**
 * Les refus qui sont des contrats de RÉDACTION, et eux seuls. La liste est
 * fermée et se lit sur le PRÉFIXE du motif, que `controlerRetour` écrit.
 * ⛔ Tout ce qui n'y est pas est bloquant — le défaut est le refus.
 *
 * ⭐⭐ `RR3-citation` Y ENTRE LE 31/08/2026 — décision de Louis : *« on refuse,
 *    on rejoue ; au 3ᵉ essai on envoie un signal au prof, qui peut corriger et
 *    retirer si besoin. »* Une citation que le modèle a composée REFUSE donc le
 *    retour et déclenche le rejeu ; si trois tentatives n'en obtiennent pas un
 *    propre, **l'élève reçoit son retour plutôt que rien**, et le professeur le
 *    voit — `attention-serveur.ts` recalcule le contrôle sur les retours servis.
 *
 * ⛔ IL NE FAUT PAS CONFONDRE LES DEUX RR3. Celui-ci — la citation composée —
 *    est tolérable au dernier essai. L'autre — `RR3 : …` sans suffixe, une
 *    phrase DU TEXTE SUPPORT attribuée à l'élève — ne l'est **jamais** : c'est
 *    une attribution fautive, et le préfixe la tient hors de cette liste.
 */
const REFUS_DE_FORME = [/^règle 2 : /, /^règle 5 : /, /^RR3-citation : /]

export function refusDeFormeSeulement(refus: readonly string[]): boolean {
  return refus.length > 0 && refus.every((r) => REFUS_DE_FORME.some((m) => m.test(r)))
}

/**
 * ⭐⭐ LES CITATIONS QUI VIVENT DANS LA PROSE DU POINT — et pas dans son `ancrage`.
 *
 * **Le trou que ceci ferme.** `controlerRR3` ne regardait que le champ STRUCTURÉ
 * `ancrage.citation`. Or la **règle 1 du gabarit** fait écrire au modèle
 * *« tu écris : "…" »* **DANS LE TEXTE du point** : un point peut donc porter,
 * dans sa prose, une citation qui n'est pas son ancrage. **Mesuré sur un retour
 * réel** *(smoke du 27/08)* : la prose portait bien une citation de plus.
 * ⛔ Si l'ancrage pointait ailleurs, **une phrase de l'auteur pouvait passer dans
 * la prose sans être vue**.
 *
 * ⚠️⚠️ **ET « TOUT CE QUI EST ENTRE GUILLEMETS » NE MARCHE PAS — mesuré, sur le
 *    même retour.** Trois passages entre guillemets, trois natures différentes :
 *      · *« Ce que Kant ajoute déplace la faute… »* — une citation de la copie ;
 *      · *« ajoute »* — **la MENTION d'un mot**, pas une citation ;
 *      · *« Mais cette définition ne dit pas encore qui en est responsable. »* —
 *        **une phrase que le MODÈLE INVENTE**, la réparation que la règle 4 lui
 *        commande de proposer *(« voilà comment faire mieux »)*. Elle n'est ni
 *        dans la copie, ni dans le texte, et **c'est parfaitement correct**.
 *    ⛔ **Un contrôle naïf refuserait ce retour-là**, et l'élève perdrait son
 *    retour à cause d'une phrase juste. *Un contrôle qui crie faux entraîne à
 *    l'ignorer — et ici il coûterait un retour.*
 *
 * ⭐ **D'OÙ LA FORME ÉTROITE : on ne retient qu'un passage cité QUI EST ATTRIBUÉ
 *    À L'ÉLÈVE.** La formule d'attribution doit précéder immédiatement le
 *    guillemet ouvrant — *« tu écris »*, *« tu dis »*, *« ta phrase »*,
 *    *« tu affirmes »*, *« tu écrivais »*… — au plus quelques caractères avant.
 *    C'est exactement le patron que la règle 1 impose au modèle, et c'est le
 *    seul qui porte une AFFIRMATION sur l'auteur des mots.
 *    *« Essaie plutôt de nommer le manque : « … » » n'attribue rien : elle sort.*
 */
const ATTRIBUTIONS = [
  'tu écris', 'tu écrivais', 'tu dis', 'tu disais', 'tu affirmes', 'tu notes',
  'ta phrase', 'ta formule', 'tes mots', 'ton texte dit', 'tu poses',
]

/** Les guillemets ouvrants et fermants que le modèle emploie, français et droits. */
const CITE = /[«"“]\s*([^»"”]{4,400}?)\s*[»"”]/g

export function citationsAttribueesDansLaProse(prose: string): string[] {
  const t = prose ?? ''
  const out: string[] = []
  for (const m of t.matchAll(CITE)) {
    // Ce qui précède immédiatement le guillemet ouvrant — la fenêtre est courte
    // exprès : « tu écris : « … » » oui, un paragraphe plus haut non.
    const avant = t.slice(Math.max(0, m.index - 40), m.index).toLowerCase()
    if (ATTRIBUTIONS.some((f) => avant.includes(f))) out.push(m[1])
  }
  return out
}

/**
 * ⭐⭐⭐ RR3 — CE QUE LA PROSE DU POINT ATTRIBUE À L'ÉLÈVE.
 *
 * *« Les citations portent leur source : la copie de l'élève d'un côté, le texte
 *   support de l'autre. **Sans cela, le retour finit par attribuer à l'élève une
 *   phrase de l'auteur qu'il citait ; à l'échelle d'une année, l'erreur est
 *   certaine.** »*                                       — `01-` §12, RR3
 *
 * ⚠️⚠️ **CETTE FONCTION A PERDU LA MOITIÉ DE SON OBJET LE 31/08, ET C'EST VOULU.**
 * Elle contrôlait DEUX domiciles : le champ structuré `ancrage`, et la prose du
 * point. **L'ancrage ne se contrôle plus ici — il s'ÉLAGUE** (`elaguerLesAncrages`,
 * plus bas) : une citation qui ne tient pas est retirée, le point garde son
 * texte, et rien n'est refusé. Décision de Louis, 31/08 : *« le modèle ne doit
 * pas citer le texte de l'élève »* — donc le code décide de ce qui est citable.
 * Ne reste ici que ce qu'on ne peut PAS élaguer : **des mots enchâssés dans une
 * phrase**, qu'on ne retire pas sans mutiler la phrase.
 *
 * ⛔⛔ **LE TROU QUE CE BLOC FERME, MESURÉ LE 31/08 SUR LES 67 RETOURS SERVIS.**
 * Il vivait DANS un `if (a.texteSupport != null)` — il ne s'exécutait donc que
 * sur les exercices portant un texte d'auteur, **125 sur 559**. Sur les 434
 * autres, rien ne regardait la prose. Et il y avait de quoi regarder :
 *
 *   · **135 citations attribuées** dans la prose (« tu écris : "…" ») ;
 *   · **33 introuvables dans la copie — 24,4 %**, dont **25 sur un exercice sans
 *     texte d'auteur**, c'est-à-dire là où le contrôle était éteint ;
 *   · **7 retours sur 67** ne fautaient QUE par la prose : leur ancrage était
 *     conforme, donc **rien ne les attrapait**.
 *
 * ⭐ Le cas d'école, tel quel : *« Épicure exploite le concept de mort comme une
 * fausse sensation »* — **zéro pour cent** de cette phrase est dans la copie.
 * C'est le résumé que le modèle s'est fait à lui-même, servi sous « tu écris ».
 *
 * ⚠️ **LA FORME ÉTROITE EST UN ACQUIS, ON N'Y TOUCHE PAS.**
 * `citationsAttribueesDansLaProse` ne retient qu'un passage cité **précédé d'une
 * formule d'attribution** — « tu écris », « ta phrase »… Tout ce qui est entre
 * guillemets ne s'attribue pas : la MENTION d'un mot, et surtout **la réparation
 * que la règle 4 commande de proposer** (« voilà comment faire mieux »), sont
 * des phrases que le modèle invente à bon droit. *Un contrôle qui crie faux
 * entraîne à l'ignorer — et ici il coûterait un retour.*
 *
 * ⚠️ **LES DEUX EFFETS NE SE VALENT PAS.**
 *   · Une phrase **DU TEXTE SUPPORT** attribuée à l'élève : refus SEC. C'est la
 *     faute que RR3 nomme, elle est identifiée, elle n'est jamais tolérée.
 *   · Une phrase **que personne n'a écrite** : refus préfixé `RR3-citation : `,
 *     donc reconnu par `REFUS_DE_FORME` — le rejeu retente, et à la troisième
 *     prise le retour est servi quand même. *L'élève n'est pas puni d'un défaut
 *     du modèle* ; le professeur, lui, le voit (`attention-serveur.ts`).
 */
export function controlerRR3(
  points: ReadonlyArray<{
    ancrage?: { source: 'copie' | 'texte_support'; citation: string } | null
    /** ⭐ La prose du point : c'est là que « tu écris : "…" » atteint l'élève. */
    texte?: string
  }>,
  a: { production: string | null; texteSupport: string | null; coTexte?: string | null },
): ControleRetour {
  const out: ControleRetour = { refus: [], alertes: [], formeSeulement: false }
  const court = (c: string) => (c.length > 60 ? `${c.slice(0, 60)}…` : c)

  // ── ⭐⭐ LA PROSE, ET ELLE SEULE ────────────────────────────────────────────
  // ⛔ AUCUNE PORTE. Ce bloc a vécu un mois DANS un `if (a.texteSupport != null)`
  //    — il ne tournait donc pas sur les exercices bâtis sur un SUJET, qui sont
  //    **434 des 559 exercices servables, 77,6 %**. Sur les trois quarts de la
  //    banque, une phrase composée par le modèle passait sans être regardée.
  for (const p of points) {
    for (const c of citationsAttribueesDansLaProse(p.texte ?? '')) {
      if (citationTient(a.production, c)) continue
      if (citationTient(a.texteSupport, c)) {
        // La faute que RR3 nomme, mot pour mot : une phrase de l'auteur
        // attribuée à l'élève. Elle est IDENTIFIÉE — jamais tolérée.
        out.refus.push(
          `RR3 : la PROSE d'un point attribue à l'élève une phrase DU TEXTE SUPPORT — `
          + `« ${court(c)} ».`)
      } else if (citationTient(a.coTexte, c)) {
        // ⭐⭐ Même faute, autre provenance : rendre à l'élève, sous « tu écris »,
        //    l'énoncé même qu'on lui avait donné. Identifiée aussi, donc jamais
        //    tolérée — c'est le pire des cas, l'élève lirait sa consigne comme
        //    étant sa réponse.
        out.refus.push(
          `RR3 : la PROSE d'un point attribue à l'élève une phrase DU TEXTE DE DÉPART `
          + `que l'exercice lui avait donnée — « ${court(c)} ».`)
      } else {
        out.refus.push(
          `RR3-citation : la prose attribue à l'élève des mots qu'il n'a pas écrits — `
          + `« ${court(c)} ». Ni dans sa copie, ni dans le texte servi.`)
      }
    }
  }
  return out
}

/**
 * ⭐⭐⭐ 31/08/2026 — L'ÉLAGAGE : CE QUI N'EST PAS VÉRIFIÉ N'ATTEINT PAS L'ÉCRAN.
 *
 * *« Le modèle ne doit pas citer le texte de l'élève. »* — Louis, 31/08.
 * Il continue de l'écrire ; **c'est ici que ça s'arrête si ça ne tient pas**.
 * Chaque `ancrage` est confronté à la copie (ou au texte servi), et celui qui ne
 * s'y retrouve pas est **retiré** : le point garde son texte, il perd son bloc
 * de citation. `RetourSegmente.tsx` ne montre pas de citation vide — *« un
 * chapeau "tu écris" suivi de rien ferait porter à l'élève une phrase vide »*.
 *
 * ⚠️⚠️ **POURQUOI ÉCARTER, ET NON REFUSER — le refus a été essayé le matin même.**
 * Un refus rejoue le retour : un appel brûlé, un retour plus tardif. **Mesuré :
 * 40 retours sur 67 auraient été refusés au premier essai**, soit la phase à peu
 * près doublée. L'élagage donne la MÊME garantie pour **zéro appel**.
 *
 * ⛔ **ET IL FAUT L'ÉLAGAGE, PARCE QUE LA DÉRIVE N'EST PAS CELLE QU'ON CROYAIT.**
 * Mesuré le 31/08 sur 187 squelettes et 67 retours :
 *   · Calame **recopie fidèlement** — **94,6 %** de ses citations viennent du
 *     squelette de P1, 2,9 % seulement sont de son cru ;
 *   · ⛔ **c'est P1 qui dérive** — ses citations ne sont pas verbatim dans
 *     **5,0 %** des cas, **18,5 % en argumentation**, 8,2 % en synthèse.
 * *Faire citer le code depuis le squelette n'aurait donc rien réglé : il aurait
 * hérité de la dérive.* Le contrôle porte sur **la copie**, jamais sur le
 * squelette — c'est la seule source qui fasse foi sur « ce que l'élève a écrit ».
 *
 * ⭐ Les motifs partent au bilan du job, seul domicile de cette trace tant que la
 * page du professeur n'existe pas (C6-L1). Ils ne bloquent rien.
 */
export function elaguerLesAncrages<T extends { ancrage?: AncrageBrut | null }>(
  points: readonly T[],
  a: { production: string | null; texteSupport: string | null },
): { points: T[]; motifs: string[] } {
  const motifs: string[] = []
  const gardes = points.map((p) => {
    const juge = jugerLAncrage(p.ancrage, a)
    if (juge.motif) motifs.push(juge.motif)
    if (juge.ancrage === p.ancrage) return p
    return { ...p, ancrage: juge.ancrage ?? undefined }
  })
  return { points: gardes, motifs }
}

/**
 * ⭐⭐⭐ `01-` §12, RR4 — le nom d'un observable dans le texte est une fuite de grille.
 *
 * ⛔⛔ **CE CONTRÔLE DÉTRUISAIT DES RETOURS, ET LA MESURE L'A PRIS SUR LE FAIT.**
 * Il cherchait par SIMPLE SOUS-CHAÎNE, dès quatre caractères. Or **9 des 56
 * codes d'observables sont des mots français ordinaires** :
 *
 *   · `expression`     — `orthographe`, `reussites`
 *   · `structure`      — `derive`
 *   · `connaissance`   — `contresens`, `inverifiable`, `mobilisation`
 *   · `synthese`       — `elagage`
 *   · `questionnement` — `enjeu`, `recadrage`
 *
 * Écrire *« l'enjeu de ta phrase »* suffisait donc à faire refuser le retour —
 * et **RR4 n'est JAMAIS toléré** (`REFUS_DE_FORME` ne le contient pas), donc
 * trois tentatives malheureuses laissaient l'élève **sans aucun retour**.
 * ⭐ **Vu en répétition à blanc le 31/08** : un retour sur trois perdu sur le mot
 * « enjeu ». Et le piège s'aggravait de ce que le gabarit ENCOURAGE ces mots —
 * la règle 7 impose « le vocabulaire de la grille ».
 *
 * ⚠️⚠️ **POURQUOI LES LIMITES DE MOT NE SUFFISENT PAS.** Elles sauvent les formes
 *    fléchies — « enjeux », « orthographique », « recadrages » ne sont plus
 *    touchés — mais pas le mot nu : *« l'enjeu »* reste `enjeu`. **Un mot
 *    français ordinaire est INDÉCIDABLE dans de la prose française**, et tout
 *    contrôle qui prétend le trancher coûte des retours.
 *
 * ⭐ **D'OÙ LE PARTAGE : on ne REFUSE que ce qui a une FORME DE CODE.** Un code
 *    portant `_` ou un chiffre — `garant_cite`, `charniere_motivee`, les 47
 *    autres — ne peut pas sortir d'une plume : c'est une fuite, et elle refuse.
 *    Un code qui est un mot nu ne peut pas se prouver : il **ALERTE**, le
 *    professeur le voit, et rien n'est détruit.
 * ⛔ **La réparation durable n'est pas ici** : elle est de RENOMMER ces neuf
 *    observables dans les sources, pour qu'ils aient tous une forme de code.
 */
const FORME_DE_CODE = /[_0-9]/

function motif(code: string): RegExp {
  return new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
}

/** Ce qui REFUSE : un code non ambigu, nommé au mot près. */
function fuitesRR4(texte: string, codes: readonly string[]): string[] {
  return codes.filter((c) => c.length >= 4 && FORME_DE_CODE.test(c) && motif(c).test(texte))
}

/** Ce qui ALERTE : un code qui est un mot ordinaire — indécidable, jamais bloquant. */
function motsDeGrilleAmbigus(texte: string, codes: readonly string[]): string[] {
  return codes.filter((c) => c.length >= 4 && !FORME_DE_CODE.test(c) && motif(c).test(texte))
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
  attendu: {
    moment: Version; grain: Grain
    codesObservables: readonly string[]; competencesAdmises: readonly string[]
    /**
     * ⭐ C5-L2 — LES DEUX CÔTÉS DE RR3. `production` est la copie de l'élève
     * (les DEUX versions en version finale : le retour final cite l'une et
     * l'autre) ; `texteSupport` est la tranche de texte d'auteur RÉELLEMENT
     * SERVIE — jamais le texte entier, qui déclarerait « du texte » une phrase
     * que l'élève n'a pas eue sous les yeux.
     *
     * ⚠️ **Facultatifs, et leur absence se DIT.** Un appelant qui ne les passe
     *    pas obtient une alerte de contrôle NON EXÉCUTÉ, jamais un silence :
     *    c'est la règle du `CONTRAT-MODULES.md` §3, portée par
     *    `citationsIntrouvables` lui-même.
     */
    production?: string | null
    texteSupport?: string | null
    /** ⭐ La matière donnée aux crans de production — jamais une source d'ancrage. */
    coTexte?: string | null
  },
): { verdict: Verdict<RetourBrut>; controle: ControleRetour } {
  const verdict = valider<RetourBrut>(brut, FORME_RETOUR)
  const controle: ControleRetour = { refus: [], alertes: [], formeSeulement: false }
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
  // ⚠️ Les mots nus ne refusent pas — voir `motsDeGrilleAmbigus` pour le motif.
  const ambigus = motsDeGrilleAmbigus(texteEntier, attendu.codesObservables)
  if (ambigus.length) {
    controle.alertes.push(
      `RR4 : le texte emploie ${ambigus.map((a) => `« ${a} »`).join(', ')} — c'est aussi le nom `
      + "d'un observable, mais le mot est ordinaire : indécidable, donc non bloquant.")
  }
  for (const [motif, quoi] of MOTIFS_NOTE) {
    if (motif.test(texteEntier)) controle.refus.push(`règle 6 : le texte porte ${quoi}`)
  }

  const contre = {
    production: attendu.production ?? null,
    texteSupport: attendu.texteSupport ?? null,
    coTexte: attendu.coTexte ?? null,
  }

  // ⭐⭐⭐ RR3 — LA PROSE. Ce qui est enchâssé dans une phrase ne s'élague pas :
  //    il se refuse (voir `controlerRR3` pour le partage des deux effets).
  const rr3 = controlerRR3(r.points, contre)
  controle.refus.push(...rr3.refus)
  controle.alertes.push(...rr3.alertes)

  // ⭐⭐⭐ 31/08 — L'ÉLAGAGE DES ANCRAGES, ET IL VIT ICI PLUTÔT QU'AU LOIN.
  //    ⚠️ Placé dans l'appelant, il s'oublierait : `chaineDUneCompetence` n'est
  //    pas le seul chemin vers `segmenter()`, et un chemin qui l'oublie sert à
  //    l'élève une citation non vérifiée. Ici, AUCUN appelant ne peut le manquer
  //    — le retour qu'on lui rend est déjà élagué.
  // ⚠️⚠️ **ON NE MUTE PAS L'ENTRÉE.** `verdict.valeur` est L'OBJET DE L'APPELANT :
  //    écrire `r.points = …` élaguait la donnée sous ses pieds. Le défaut s'est
  //    dénoncé tout seul — la suite de tests partage un même retour d'exemple, le
  //    premier appel l'élaguait, et les treize suivants recevaient un retour que
  //    le SCHÉMA rejetait. *En production le même geste aurait élagué un objet
  //    encore utilisé par l'appelant.* On rend une valeur NEUVE.
  const elague = elaguerLesAncrages(r.points, contre)
  controle.alertes.push(...elague.motifs)

  controle.formeSeulement = refusDeFormeSeulement(controle.refus)
  return {
    verdict: { ...verdict, valeur: { ...r, points: elague.points } },
    controle,
  }
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
