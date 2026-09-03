// ============================================================================
// ALETHEIA · E3 — LES GABARITS DE LECTURE. Module PUR (aucune base, aucune I/O).
// ----------------------------------------------------------------------------
// Un gabarit = cinq emplacements. Les deux premiers portent l'opération de lecture
// propre au genre ; le troisième TOURNE d'une séance à l'autre ; « Tes questions »
// et « Vocabulaire » ne changent jamais. Le dialogué a en plus une question FIXE
// (« quelle thèse l'auteur préfère-t-il ? »), qui est l'axe 1 de son diagnostic.
// Décisions : D3, D11, D12, D16 (`SPEC_Aletheia_Etayage_par_niveau.md` § 5).
//
// ⭐ LES COLONNES NE CHANGENT PAS DE NOM. `these`, `arguments`, `accord` gardent leur
//    nom en base (contrat de la machine à états et du diagnostic) ; leur SENS dépend
//    du gabarit. Ce module est la seule table de correspondance.
// ⭐ L'ARGUMENTATIF EST LE GABARIT D'AVANT, À L'OCTET PRÈS. Ses libellés sont ceux
//    des formulaires actuels et son bloc de prompt est VIDE : porte fermée, ou livre
//    argumentatif, rien ne change (test `gabarits.test.ts`).
// ============================================================================

export type Gabarit = 'argumentatif' | 'dialogue' | 'aphoristique' | 'analytique'
export const GABARITS: readonly Gabarit[] = ['argumentatif', 'dialogue', 'aphoristique', 'analytique']
export const GABARIT_DEFAUT: Gabarit = 'argumentatif'

export function estGabarit(x: unknown): x is Gabarit {
  return typeof x === 'string' && (GABARITS as readonly string[]).includes(x)
}

/** Un libellé de champ : la QUESTION posée à l'élève, et son aide (placeholder). */
export interface Champ { question: string; aide: string }

/** Une question tournante : sa clé (stable, pour le cycle) et son texte. */
export interface Tournante { cle: string; question: string; aide: string; /** Titre de la bulle du retour pour cette question ; absent ⇒ celui du gabarit. */ bulle?: string }

export interface DefinitionGabarit {
  nom: string
  /** Pour le prof : quels livres, en une ligne. */
  pour: string
  champ1: Champ
  champ2: Champ
  /** Question FIXE (dialogué seulement) : stockée dans `aletheia_travaux.champ_fixe`. */
  champFixe: Champ | null
  /** Les questions tournantes, dans l'ordre du cycle par défaut (D12 : cycle fixe). */
  tournantes: readonly Tournante[]
  questions: Champ
  vocabulaire: Champ
  /** Titres des bulles du retour V1. */
  bulles: { relances: string; tournante: string }
  /** Noms des deux axes du diagnostic (vue prof). */
  axes: { axe1: string; axe2: string }
  /** Le champ 2 est-il « à part » (analytique : application, pas restitution) ? */
  champ2Independant: boolean
}

// Les libellés ACTUELS des formulaires (FormulaireV1 / FormulaireVf / aides-v1.ts),
// repris tels quels : c'est ce qui garantit l'identité porte fermée.
const ARGUMENTATIF: DefinitionGabarit = {
  nom: 'Argumentatif',
  pour: 'Race et Histoire, le Manifeste, l’Apologie, les Lettres, les Méditations',
  champ1: { question: 'Quelle est l’idée que l’auteur défend ?', aide: 'L’idée centrale des chapitres lus cette séance, avec tes mots.' },
  champ2: { question: 'Quelles sont les raisons qu’il avance pour défendre son idée ?', aide: 'Comment l’auteur défend cette idée : ses arguments, ses exemples.' },
  champFixe: null,
  tournantes: [
    { cle: 'accord', question: 'Es-tu d’accord avec ce que dit l’auteur ?', aide: 'Une fois l’idée comprise : qu’en penses-tu, et pour quelles raisons ?' },
    { cle: 'objection', question: 'Quelle objection lui adresserais-tu ?', aide: 'Un point où tu résisterais à l’auteur, et pourquoi.', bulle: 'Sur ton objection' },
    { cle: 'destinataire', question: 'À qui parle-t-il, et que veut-il qu’on fasse ?', aide: 'Le lecteur qu’il vise, et ce qu’il attend de lui.', bulle: 'Sur le destinataire' },
    { cle: 'exemple', question: 'Donne un exemple qui illustre ou contredit son idée.', aide: 'Un cas concret, tiré de ta vie ou de tes lectures.', bulle: 'Sur ton exemple' },
  ],
  questions: { question: 'As-tu des questions à lui poser ?', aide: 'Une question par ligne…\nEx. : Pourquoi Nietzsche oppose-t-il Apollon et Dionysos ?' },
  vocabulaire: { question: 'Quels mots n’as-tu pas compris ?', aide: 'Un mot par ligne…\nIls deviendront des cartes à réviser dans Quazian.' },
  bulles: { relances: 'Pour creuser ton idée et tes arguments', tournante: 'Sur ton accord' },
  axes: { axe1: 'Thèse', axe2: 'Arguments' },
  champ2Independant: false,
}

const DIALOGUE: DefinitionGabarit = {
  nom: 'Dialogué',
  pour: 'Le Banquet, l’Apologie, l’Utopie, l’Éloge de la folie, les mythes, le théâtre',
  champ1: { question: 'Dans ce passage, plusieurs personnes parlent. Quelles sont les idées que chacune d’elles soutient ? Une ligne par personnage et par idée.', aide: 'Phèdre : … / Pausanias : … — un personnage et une idée par ligne.' },
  champ2: { question: 'Qu’est-ce qui fait avancer l’échange ? Y a-t-il des objections, des réfutations, des retournements ?', aide: 'Les moments où une idée en bouscule une autre.' },
  champFixe: { question: 'Quelle est la thèse que l’auteur préfère, selon toi ? Qu’est-ce qui te le fait dire ?', aide: 'L’auteur n’est pas forcément celui qui parle le plus. Dis où tu l’entends, lui.' },
  tournantes: [
    { cle: 'convainc', question: 'Quelle idée du texte te convainc ?', aide: 'Celle que tu défendrais, et pourquoi.' },
    { cle: 'faible', question: 'Laquelle te paraît la plus faible ?', aide: 'Celle qui te résiste, et ce qui lui manque.', bulle: 'Sur l’idée la plus faible' },
    { cle: 'hesitation', question: 'Où hésites-tu sur ce que l’auteur pense vraiment ?', aide: 'Un passage où tu ne sais pas s’il parle sérieusement.', bulle: 'Sur ton hésitation' },
  ],
  questions: ARGUMENTATIF.questions,
  vocabulaire: ARGUMENTATIF.vocabulaire,
  bulles: { relances: 'Pour creuser les voix et l’échange', tournante: 'Sur ce qui te convainc' },
  axes: { axe1: 'Attribution des positions', axe2: 'Mouvements de l’échange' },
  champ2Independant: false,
}

const APHORISTIQUE: DefinitionGabarit = {
  nom: 'Aphoristique / digressif',
  pour: 'Par-delà bien et mal, Montaigne',
  champ1: { question: 'Quel passage as-tu choisi ? Recopie-le.', aide: 'Recopie l’aphorisme ou les lignes que tu retiens, avec son numéro si tu l’as.' },
  champ2: { question: 'Que veut-il dire, selon toi ?', aide: 'Ce qu’il affirme sans le dire tout à fait, avec tes mots.' },
  champFixe: null,
  tournantes: [
    { cle: 'obscur', question: 'Quel passage n’arrives-tu vraiment pas à comprendre, et d’après toi pourquoi t’échappe-t-il ?', aide: 'Recopie-le, et dis ce qui bloque : un mot, une image, le lien avec le reste.' },
    { cle: 'fil', question: 'Quel fil vois-tu entre ce passage et un autre de la séance ?', aide: 'Deux fragments qui se répondent, et ce qui les relie.', bulle: 'Sur le fil que tu vois' },
    { cle: 'accord', question: 'Es-tu d’accord avec lui ?', aide: 'Et pour quelles raisons.', bulle: 'Sur ton accord' },
  ],
  questions: ARGUMENTATIF.questions,
  vocabulaire: ARGUMENTATIF.vocabulaire,
  bulles: { relances: 'Pour creuser le passage que tu as choisi', tournante: 'Sur ce qui te résiste' },
  axes: { axe1: 'Thèse implicite du fragment', axe2: 'Fil entre les fragments' },
  champ2Independant: false,
}

const ANALYTIQUE: DefinitionGabarit = {
  nom: 'Analytique / boîte à outils',
  pour: 'La Poétique, L’Art d’avoir toujours raison',
  champ1: { question: 'Que dit l’auteur de la notion ou de l’outil que ce passage décrit ?', aide: 'Sa définition, ses critères, son mécanisme, avec tes mots.' },
  champ2: { question: 'Applique l’analyse de l’auteur à un cas de ton choix.', aide: 'Une œuvre, une situation, une dispute : montre que l’outil s’y applique, ou non.' },
  champFixe: null,
  tournantes: [
    { cle: 'interet', question: 'Penses-tu que les idées que développe l’auteur ont leur intérêt ?', aide: 'Lesquelles, et pourquoi elles valent la peine — ou non.' },
    { cle: 'contre_exemple', question: 'Connais-tu une œuvre ou un cas qui ne rentre pas dans les définitions ou les outils que propose l’auteur ?', aide: 'Et ce que ça dit de la définition ou de l’outil.', bulle: 'Sur ton contre-exemple' },
    { cle: 'distinction', question: 'Quelle distinction de l’auteur te semble la plus utile ?', aide: 'Et à quoi elle te servirait.', bulle: 'Sur la distinction que tu retiens' },
  ],
  questions: ARGUMENTATIF.questions,
  vocabulaire: ARGUMENTATIF.vocabulaire,
  bulles: { relances: 'Pour creuser la notion et ton application', tournante: 'Sur l’intérêt de ces idées' },
  axes: { axe1: 'Notion saisie', axe2: 'Application au cas choisi' },
  champ2Independant: true,
}

export const DEFINITIONS: Record<Gabarit, DefinitionGabarit> = {
  argumentatif: ARGUMENTATIF, dialogue: DIALOGUE, aphoristique: APHORISTIQUE, analytique: ANALYTIQUE,
}

// ── La question tournante d'une séance (D12 : cycle fixe) ────────────────────

/**
 * La tournante de la séance de rang `rang` (0 = première séance exposée) : le
 * cycle du livre s'il en a un (clés valides seulement), sinon l'ordre du gabarit.
 * Jamais la même deux séances de suite tant que le cycle a ≥ 2 entrées.
 */
export function questionTournante(gabarit: Gabarit, cycle: readonly string[] | null | undefined, rang: number): Tournante {
  const def = DEFINITIONS[gabarit]
  const valides = (cycle ?? []).filter(c => def.tournantes.some(t => t.cle === c))
  const ordre = valides.length > 0 ? valides : def.tournantes.map(t => t.cle)
  const cle = ordre[Math.max(0, rang) % ordre.length]
  return def.tournantes.find(t => t.cle === cle) ?? def.tournantes[0]
}

// ── Les libellés d'un formulaire ─────────────────────────────────────────────

export interface LibellesSeance {
  gabarit: Gabarit
  champ1: Champ
  champ2: Champ
  champFixe: Champ | null
  tournante: Tournante
  questions: Champ
  vocabulaire: Champ
  bulles: { relances: string; tournante: string }
}

export function libellesSeance(gabarit: Gabarit, cycle: readonly string[] | null | undefined, rang: number): LibellesSeance {
  const def = DEFINITIONS[gabarit]
  const tournante = questionTournante(gabarit, cycle, rang)
  return {
    gabarit, champ1: def.champ1, champ2: def.champ2, champFixe: def.champFixe,
    tournante,
    questions: def.questions, vocabulaire: def.vocabulaire,
    // La bulle du retour suit la question POSÉE (E5 : « Sur ce qui te convainc » coiffait une réponse sur l'idée la plus faible).
    bulles: { relances: def.bulles.relances, tournante: tournante.bulle ?? def.bulles.tournante },
  }
}

// ── Les blocs de prompt (D16 : tronc commun + un bloc par gabarit) ───────────
// Chaque prompt par défaut porte un placeholder `{bloc_gabarit}` ; l'argumentatif
// y met une chaîne VIDE (le tronc est le prompt d'avant, à l'octet près). Les autres
// gabarits y mettent un paragraphe qui REDÉFINIT ce que contiennent les champs
// IDEE_PRINCIPALE / ARGUMENTS / ACCORD et ce que le retour doit en faire.
// `{champ_fixe_eleve}` et `{question_tournante}` sont remplis par l'appelant.

export type PromptCle = 'v1' | 'vf' | 'diag_inventaire' | 'diag_niveau' | 'reference'
export type BlocsGabarit = Record<PromptCle, string>

const VIDE: BlocsGabarit = { v1: '', vf: '', diag_inventaire: '', diag_niveau: '', reference: '' }

const BLOCS_DIALOGUE: BlocsGabarit = {
  v1: `
## Gabarit DIALOGUÉ — ce que contiennent les champs (redéfinition, prime sur « Traitement, champ par champ »)
⛔ Dans ce que l'élève LIT, ne nomme JAMAIS les balises (IDEE, ARGUMENTS, ACCORD, THESE_AUTEUR, IDEE_VF…) : parle des QUESTIONS qu'on lui a posées (« ta réponse sur les voix », « ta réponse sur ce qui te convainc », « ta réponse sur la thèse de l'auteur »…).
Le texte de cette semaine fait parler PLUSIEURS voix (personnages, interlocuteurs, ou une voix empruntée par l'auteur). Les champs de l'élève signifient ici :
- IDEE_PRINCIPALE = « Dans ce passage, plusieurs personnes parlent. Quelles sont les idées que chacune d'elles soutient ? Une ligne par personnage et par idée. » → l'ATTRIBUTION des positions aux personnages. Erreur typique : attribuer à l'auteur ce que dit un personnage. Relance socratique : renvoie au passage où la voix parle, demande QUI dit cela.
- ARGUMENTS = « Qu'est-ce qui fait avancer l'échange ? » → les MOUVEMENTS : objection, réfutation, retournement, aveu. Relance : le moment précis où une idée en bouscule une autre.
- THESE_AUTEUR (ci-dessous) = « Quelle est la thèse que l'auteur préfère, et qu'est-ce qui te le fait dire ? » → question FIXE de compréhension, l'axe le plus important de ce gabarit. Traite-la comme l'idée principale d'un texte argumentatif : socratique, jamais la réponse ; renvoie aux indices (qui a le dernier mot, qui est réfuté, l'ironie éventuelle). ⛔ UNE des relances porte TOUJOURS sur THESE_AUTEUR, même si l'élève a l'air d'avoir raison (demande-lui alors sur quoi il s'appuie).
<<<THESE_AUTEUR
{champ_fixe_eleve}
THESE_AUTEUR>>>
- ACCORD = la question tournante de cette séance : « {question_tournante} » → révélateur de compréhension, comme l'accord.
`,
  vf: `
## Gabarit DIALOGUÉ — ce que contiennent les champs
⛔ Dans ce que l'élève LIT, ne nomme JAMAIS les balises (IDEE, ARGUMENTS, ACCORD, THESE_AUTEUR, IDEE_VF…) : parle des QUESTIONS qu'on lui a posées (« ta réponse sur les voix », « ta réponse sur ce qui te convainc », « ta réponse sur la thèse de l'auteur »…).
IDEE = attribution des positions aux voix ; ARGUMENTS = mouvements de l'échange ; ACCORD = « {question_tournante} ». La version finale de la question fixe « quelle thèse l'auteur préfère-t-il ? » est ici :
<<<THESE_AUTEUR_VF
{champ_fixe_eleve}
THESE_AUTEUR_VF>>>
Dans NUANCES ET ERREURS, vérifie d'abord l'ATTRIBUTION (qui dit quoi) et la position de l'AUTEUR : c'est là que se jouent les contresens d'un dialogue.
`,
  diag_inventaire: `
## Gabarit DIALOGUÉ — ce que tu inventories
Le texte fait parler plusieurs personnes. « Idée principale » de l'élève = son ATTRIBUTION des idées aux personnages (une ligne par personnage et par idée) ET sa réponse à « quelle thèse l'auteur préfère-t-il ? » (donnée ci-dessous) ; « Arguments » = les MOUVEMENTS de l'échange qu'il a captés (objections, réfutations, retournements).
<<<THESE_AUTEUR
{champ_fixe_eleve}
THESE_AUTEUR>>>
- these_eleve : la position que l'élève attribue à l'AUTEUR, en une phrase neutre.
- arguments_captes / rates / deformes : parmi les positions et mouvements RÉELS du texte, lesquels l'élève attribue juste / rate / attribue à la mauvaise voix (une position mise dans la mauvaise bouche = déformée).
`,
  diag_niveau: `
## Gabarit DIALOGUÉ — ce que mesurent les deux axes
- niveau_these = l'élève distingue-t-il la position de l'AUTEUR de celles des personnages (la référence dit la position de l'auteur) ?
- niveau_arguments = les positions et mouvements de l'échange sont-ils attribués aux bonnes voix ?
`,
  reference: `
## Gabarit DIALOGUÉ — ce que porte la fiche
Le texte fait parler plusieurs voix. these_canonique = la position de l'AUTEUR (celle que le texte fait triompher, ou vise par l'ironie), en une phrase. arguments_cles = les POSITIONS PAR VOIX, une entrée par voix sous la forme « Voix : position », puis les MOUVEMENTS décisifs (objection, réfutation, retournement).
`,
}

const BLOCS_APHORISTIQUE: BlocsGabarit = {
  v1: `
## Gabarit APHORISTIQUE — ce que contiennent les champs (redéfinition, prime sur « Traitement, champ par champ »)
⛔ Dans ce que l'élève LIT, ne nomme JAMAIS les balises (IDEE, ARGUMENTS, ACCORD, THESE_AUTEUR, IDEE_VF…) : parle des QUESTIONS qu'on lui a posées (« ta réponse sur les voix », « ta réponse sur ce qui te convainc », « ta réponse sur la thèse de l'auteur »…).
Le texte est fait de fragments (aphorismes, essais digressifs) : on ne demande PAS « l'idée du chapitre ». Les champs de l'élève signifient ici :
- IDEE_PRINCIPALE = « Quel passage as-tu choisi ? Recopie-le. » → le FRAGMENT retenu par l'élève. Tout ton retour travaille sur CE fragment (localise-le dans le texte de la semaine ; s'il n'y est pas mot pour mot — autre traduction — retrouve-le par le sens).
- ARGUMENTS = « Que veut-il dire, selon toi ? » → la THÈSE IMPLICITE que l'élève reconstruit. Relance socratique : renvoie à un mot, une image, une phrase du fragment qui contredit ou précise sa lecture ; jamais la thèse elle-même.
- ACCORD = la question tournante de cette séance : « {question_tournante} ». Si c'est le passage qui lui échappe : ne l'explique pas, donne UNE prise (un mot à regarder, un fragment voisin à relire) et pose une question.
`,
  vf: `
## Gabarit APHORISTIQUE — ce que contiennent les champs
⛔ Dans ce que l'élève LIT, ne nomme JAMAIS les balises (IDEE, ARGUMENTS, ACCORD, THESE_AUTEUR, IDEE_VF…) : parle des QUESTIONS qu'on lui a posées (« ta réponse sur les voix », « ta réponse sur ce qui te convainc », « ta réponse sur la thèse de l'auteur »…).
IDEE = le fragment choisi (recopié) ; ARGUMENTS = la thèse implicite reconstruite par l'élève ; ACCORD = « {question_tournante} ». La SYNTHÈSE MODÈLE porte sur les fragments de la semaine ; les NUANCES portent sur la lecture du fragment CHOISI d'abord.
`,
  diag_inventaire: `
## Gabarit APHORISTIQUE — ce que tu inventories
« Idée principale » de l'élève = le FRAGMENT qu'il a choisi (recopié) ; « Arguments » = la THÈSE IMPLICITE qu'il en reconstruit. Localise le fragment dans le texte, puis :
- these_eleve : la thèse implicite que l'élève attribue à CE fragment, en une phrase neutre.
- arguments_captes / rates / deformes : parmi les idées RÉELLEMENT portées par ce fragment (et ses liens aux fragments voisins de la semaine), lesquelles l'élève capte / rate / déforme.
`,
  diag_niveau: `
## Gabarit APHORISTIQUE — ce que mesurent les deux axes
- niveau_these = la thèse implicite du fragment CHOISI est-elle saisie ? (La référence donne les thèses implicites par fragment ; juge sur celui de l'élève, pas sur les autres.)
- niveau_arguments = le fil entre ce fragment et les autres de la semaine est-il vu ? Si l'inventaire ne dit rien d'un fil, ne pénalise pas : niveau_arguments = null.
`,
  reference: `
## Gabarit APHORISTIQUE — ce que porte la fiche
Le texte est fait de fragments numérotés ou d'essais digressifs. these_canonique = le FIL de la semaine (ce qui relie les fragments), en une phrase. arguments_cles = une entrée PAR FRAGMENT sous la forme « n° : thèse implicite », les plus importants d'abord (5 à 8 au plus).
`,
}

const BLOCS_ANALYTIQUE: BlocsGabarit = {
  v1: `
## Gabarit ANALYTIQUE — ce que contiennent les champs (redéfinition, prime sur « Traitement, champ par champ »)
⛔ Dans ce que l'élève LIT, ne nomme JAMAIS les balises (IDEE, ARGUMENTS, ACCORD, THESE_AUTEUR, IDEE_VF…) : parle des QUESTIONS qu'on lui a posées (« ta réponse sur les voix », « ta réponse sur ce qui te convainc », « ta réponse sur la thèse de l'auteur »…).
Le texte DÉFINIT une notion ou DÉCRIT un outil (une définition, des critères, un mécanisme, des espèces). Idée et argument ne sont PAS distingués ici. Les champs de l'élève signifient :
- IDEE_PRINCIPALE = « Que dit l'auteur de la notion ou de l'outil que ce passage décrit ? » → la NOTION saisie : définition, critères, mécanisme. Relance socratique : renvoie au passage où un critère manque ou est déformé.
- ARGUMENTS = « Applique l'analyse de l'auteur à un cas de ton choix. » → l'APPLICATION de l'élève. Ne juge pas le cas choisi : vérifie que l'outil y est appliqué comme l'auteur le définit. Relance : le critère que l'application oublie ou tord.
- ACCORD = la question tournante de cette séance : « {question_tournante} ».
`,
  vf: `
## Gabarit ANALYTIQUE — ce que contiennent les champs
⛔ Dans ce que l'élève LIT, ne nomme JAMAIS les balises (IDEE, ARGUMENTS, ACCORD, THESE_AUTEUR, IDEE_VF…) : parle des QUESTIONS qu'on lui a posées (« ta réponse sur les voix », « ta réponse sur ce qui te convainc », « ta réponse sur la thèse de l'auteur »…).
IDEE = la notion saisie (définition, critères, mécanisme) ; ARGUMENTS = l'application à un cas choisi par l'élève ; ACCORD = « {question_tournante} ». Dans NUANCES ET ERREURS : d'abord les critères de la notion manquants ou déformés, puis l'application (l'outil est-il appliqué comme l'auteur le définit ?).
`,
  diag_inventaire: `
## Gabarit ANALYTIQUE — ce que tu inventories
« Idée principale » de l'élève = la NOTION ou l'OUTIL tel qu'il l'a saisi (définition, critères, mécanisme) ; « Arguments » = son APPLICATION à un cas de son choix.
- these_eleve : la définition que l'élève donne, en une phrase neutre.
- arguments_captes = les critères de l'auteur que l'application respecte ; arguments_rates = ceux qu'elle oublie ; arguments_deformes = ceux qu'elle tord. Le cas choisi n'est pas jugé en lui-même.
`,
  diag_niveau: `
## Gabarit ANALYTIQUE — ce que mesurent les deux axes
- niveau_these = la notion est-elle saisie (définition, critères, mécanisme) ?
- niveau_arguments = l'APPLICATION respecte-t-elle les critères de l'auteur ? (C'est un axe d'application, pas de restitution.)
`,
  reference: `
## Gabarit ANALYTIQUE — ce que porte la fiche
Le texte définit une notion ou décrit un outil. these_canonique = la DÉFINITION que donne l'auteur, en une phrase. arguments_cles = les CRITÈRES, ESPÈCES ou étapes du MÉCANISME, un par entrée, dans l'ordre du texte.
`,
}

export const BLOCS_DEFAUT: Record<Gabarit, BlocsGabarit> = {
  argumentatif: VIDE, dialogue: BLOCS_DIALOGUE, aphoristique: BLOCS_APHORISTIQUE, analytique: BLOCS_ANALYTIQUE,
}

/**
 * Le bloc d'un prompt pour un gabarit : l'override prof (`aletheia_params.blocs_gabarits`,
 * forme `{ dialogue: { v1: '…' } }`) s'il existe et n'est pas vide, sinon le défaut.
 */
export function blocGabarit(gabarit: Gabarit, cle: PromptCle, overrides?: unknown): string {
  const o = overrides as Partial<Record<Gabarit, Partial<Record<PromptCle, unknown>>>> | null | undefined
  const v = o?.[gabarit]?.[cle]
  if (typeof v === 'string' && v.trim()) return v
  return BLOCS_DEFAUT[gabarit][cle]
}

/** Insère le bloc dans un tronc (placeholder `{bloc_gabarit}` ; absent ⇒ tronc inchangé). */
export function assemblerPrompt(tronc: string, bloc: string): string {
  return tronc.split('{bloc_gabarit}').join(bloc)
}
