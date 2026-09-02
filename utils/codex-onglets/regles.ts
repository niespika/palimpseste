// ============================================================================
// C4 · L6 — CE QUE LES DEUX ONGLETS RANGENT, ET SELON QUELLE RÈGLE.
// ----------------------------------------------------------------------------
// Ce module est PUR : aucune base, aucun réseau, aucun `server-only`. Il porte
// les trois règles que les écrans appliquent, et rien d'autre — c'est ce qui
// les rend testables (`import 'server-only'` rend un module intestable sous
// `npm test` ; la lecture vit à côté, dans `liste.ts`).
//
// ⚠️ CE LOT NE CHANGE AUCUNE RÈGLE MÉTIER. Ce fichier ne fait qu'appliquer
//    celles qui existent : le partage maison / classe du `06-` §1, l'atelier de
//    l'exercice du `01-` §2, et l'obligation de lecture du `02-` §6.D (étape 17).
// ============================================================================

/** Le lieu de la passation, et rien d'autre (`07-` §1.1). */
export type Lieu = 'maison' | 'classe'

/**
 * Les deux ateliers d'écriture / lecture (`01-` §2) — et, depuis C6-L4,
 * FRAGMENTS pour la seule passation en classe qu'il porte : l'essai. Un
 * formatif ne tombe jamais dans Fragments (`atelierDUnFormatif` ne rend que
 * les deux premiers) ; seule une instance DE CLASSE dont la ligne de plan est
 * `essai` y mène (`atelierDUneInstanceDeClasse`).
 */
export type Atelier = 'codex' | 'aletheia' | 'fragments'

/**
 * ⚠️ LE SEGMENT D'URL N'EST PAS LE NOM DU MODULE : Fragments vit sous
 *    `fragments-erudition`. Une seule table, lue par les trois `href`.
 */
export const ROUTE_DE_L_ATELIER: Record<Atelier, string> = {
  codex: 'codex',
  aletheia: 'aletheia',
  fragments: 'fragments-erudition',
}

/**
 * ⭐ L'ATELIER D'UN EXERCICE FORMATIF SE LIT SUR SON MODE.
 *
 * *« Tout exercice qui a demandé une production se consulte dans son atelier —
 *   CODEX s'il porte `composer`, ALETHEIA sinon. »*            — `01-` §2
 *
 * ⚠️ CETTE RÈGLE EST CELLE DES FORMATIFS, c'est-à-dire de la MAISON, et c'est
 *    exactement le périmètre où on l'emploie ici. « Les sommatifs se conçoivent
 *    CHACUN DANS SON MODULE » (`02-` §6 B, citant le `01-` §2) : leur module se
 *    lit à la ligne de plan, et `utils/examens/signal.ts` s'en charge déjà pour
 *    la face Examens. On ne réécrit pas sa résolution ; on n'en a pas besoin
 *    ici, parce qu'un examen diagnostique a `lieu = 'classe'`.
 *
 * ⚠️ INVERSER L'ORDRE CASSERAIT L'EXPLICATION DE TEXTE — elle mesure
 *    l'Expression EN `composer` (`01-` §10) et cette règle-ci l'enverrait dans
 *    Codex, quand le `06-` §1 la range en LECTURE diagnostique. D'où le garde
 *    d'emploi ci-dessous : elle ne se pose que sur la maison.
 */
export function atelierDUnFormatif(modesParCompetence: unknown): Atelier {
  const modes = Object.values(estObjet(modesParCompetence) ? modesParCompetence as Record<string, unknown> : {})
    .flatMap((v) => (Array.isArray(v) ? v.map(texte) : []))
  return modes.includes('composer') ? 'codex' : 'aletheia'
}

/**
 * ⭐⭐ C5-L2 — OÙ L'ÉLÈVE ENTRE, SELON L'ATELIER. Une fonction, deux routes.
 *
 * Le déroulé à six temps est GÉNÉRIQUE — sept composants, dix-neuf modules, un
 * jeu d'actions partagé, et **rien de tout cela ne nomme Codex**. Ce qui le
 * rangeait sous Codex était **la seule route**, et son en-tête le disait :
 * *« la lecture — même déroulé, retour ancré au texte — est C5-L2 […] le lot
 * qui en aura besoin le fera sien. »*
 *
 * ⚠️ **L'ATELIER N'EST PAS UN ATTRIBUT D'URL.** Les deux routes servent le même
 *    écran, mais chacune ne sert QUE les dépôts de son atelier
 *    (`lireDepotMaison`, option `atelier`) : sans cette borne, le module
 *    deviendrait un paramètre d'adresse, quand le `01-` §2 en fait « une couleur
 *    et une voix ». *Avant ce lot, `/eleve/modules/codex/exercice/<id>` servait
 *    déjà un dépôt de LECTURE à qui connaissait son identifiant.*
 *
 * ⭐ **C5-L4 A POSÉ LES ONGLETS DE LA LECTURE, ET CETTE FONCTION N'EN EST PAS
 *    UN.** Ce qu'elle rend est ce que la liste de l'onglet EXERCICES affiche,
 *    de chaque côté ; c'est `components/nav/configModules.ts` qui déclare, par
 *    `prefixes[]`, que ces deux routes allument bien cet onglet-là.
 */
export function hrefDuDeroule(atelier: Atelier, depotId: string): string {
  return `/eleve/modules/${ROUTE_DE_L_ATELIER[atelier]}/exercice/${depotId}`
}

/**
 * ⭐ C5-L4 — OÙ LE PROFESSEUR ENTRE DANS UNE PASSATION EN CLASSE, selon l'atelier.
 *
 * Le même geste que `hrefDuDeroule`, de l'autre côté : `app/prof/codex/passation/[exerciceId]`
 * et `app/prof/aletheia/passation/[exerciceId]` servent LE MÊME écran (`EcranProf`,
 * `chargerVueProf`), et chacun ne s'atteint que depuis son module — « c'est le
 * MÊME FLUX dans deux modules » (C4-L4).
 *
 * ⚠️ CE N'EST PAS UNE ROUTE NEUVE : les deux existent depuis C4-L4. Ce qui
 *    manquait, c'est la LISTE qui les nomme — et côté lecture, elle n'existait
 *    nulle part : `app/prof/aletheia/passation/[exerciceId]` n'avait qu'UN SEUL
 *    lien dans tout le dépôt, depuis `app/prof/conception/[id]`.
 */
export function hrefDeLaPassationProf(atelier: Atelier, exerciceId: string): string {
  return `/prof/${ROUTE_DE_L_ATELIER[atelier]}/passation/${exerciceId}`
}

/**
 * ⭐ OÙ L'ÉLÈVE ENTRE DANS SA PROPRE PASSATION EN CLASSE, selon l'atelier.
 *
 * Le pendant élève de `hrefDeLaPassationProf`, et la SEULE adresse où vit son
 * retour d'examen : `app/eleve/modules/{codex,aletheia}/passation/[depotId]`
 * sert `EcranEleve`, qui rend le bloc « Ton retour » et le bouton « J'ai lu mon
 * retour » (`02-` §6.D, étape 17).
 *
 * ⚠️ CE N'EST PAS `hrefDuDeroule`. Le déroulé à six temps est celui de la
 *    MAISON ; la passation en classe a son propre écran, sa propre garde
 *    (`garderEleve`) et son propre flux (photos → transcription → retour).
 *    Les confondre enverrait l'élève sur un `notFound()` : `lireDepotMaison`
 *    refuse un dépôt dont l'instance a `lieu = 'classe'`.
 *
 * ⚠️ L'ONGLET QUI S'ALLUME EST *EXAMENS*, et il l'était déjà : c'est
 *    `components/nav/configModules.ts` qui le déclare par `prefixes[]`
 *    (`/eleve/modules/{codex,aletheia}/passation`). Rien à y ajouter.
 */
export function hrefDeLaPassationEleve(atelier: Atelier, depotId: string): string {
  // ⭐ C6-L4 — la face élève de Fragments pilote ses onglets par `?vue=` : sans
  //    lui, l'écran de passation allumerait « Écrit » (la vue par défaut).
  const vue = atelier === 'fragments' ? '?vue=essai' : ''
  return `/eleve/modules/${ROUTE_DE_L_ATELIER[atelier]}/passation/${depotId}${vue}`
}

/**
 * ⭐ L'ATELIER D'UNE INSTANCE **DE CLASSE** — la ligne de plan D'ABORD, le mode
 *    ENSUITE et seulement à défaut.
 *
 * ⚠️ CETTE RÈGLE N'EST PAS `atelierDUnFormatif`, ET L'ORDRE NE S'INVERSE PAS.
 *    L'explication de texte mesure l'Expression EN `composer` (`01-` §10) : la
 *    règle des modes l'enverrait dans CODEX, quand le `06-` §1 la range en
 *    LECTURE diagnostique, dans ALETHEIA. « Les sommatifs se conçoivent CHACUN
 *    DANS SON MODULE » (`02-` §6 B, citant le `01-` §2), et leur module est au
 *    plan. La règle des modes est le REPLI d'une passation de classe hors plan.
 *
 * ⚠️ `typeExerciceDeLaLigne` est le `type_exercice` de
 *    `scriptorium_exercices_planifies` — une LISTE FERMÉE DE COUPLES
 *    (`exercices_typologie_chk`) : `ecriture` ⇒ Codex, `lecture` ⇒ Aletheia.
 *    Toute autre valeur, `null` compris, tombe sur le repli.
 *
 * ⚠️ DEUX AUTRES EXEMPLAIRES DE CETTE RÈGLE VIVENT ENCORE AILLEURS —
 *    `moduleDeLInstance` (`utils/examens/signal.ts`) et le filtre en ligne de
 *    `passationsDeClasse` (`liste.ts`). Ils ne sont pas repris ici : le premier
 *    est le cœur testé de C4-L9, le second sert un autre côté. **La fusion est
 *    portée à `IDEES_post_rentree.md`** — ce fichier est la version PURE, et
 *    c'est elle que tout nouveau lecteur doit appeler.
 */
export function atelierDUneInstanceDeClasse(
  typeExerciceDeLaLigne: string | null, modesParCompetence: unknown,
): Atelier {
  if (typeExerciceDeLaLigne === 'ecriture') return 'codex'
  if (typeExerciceDeLaLigne === 'lecture') return 'aletheia'
  // ⭐ C6-L4 — l'essai de Fragments : sans cette ligne, la règle du mode
  //    (`composer`) l'enverrait dans CODEX, à tort.
  if (typeExerciceDeLaLigne === 'essai') return 'fragments'
  return atelierDUnFormatif(modesParCompetence)
}

/**
 * ⭐ LA CLASSE EN CONTEXTE BORNE CE QUI S'AFFICHE.
 *
 * *« Dans les modules on reste PAR CLASSE »* — un élève bi-classe ne doit jamais
 * voir sous ses onglets Codex le travail de l'autre classe.
 *
 * ⚠️ UNE INSTANCE SANS CLASSE N'EST PAS « L'AUTRE CLASSE ». `exercices.classe_id`
 *    est NULLABLE en base (`c4_l1_schema.sql` : `on delete set null`, et le
 *    routeur assigne aussi hors créneau planifié) : l'écarter ferait DISPARAÎTRE
 *    un exercice que l'élève doit faire, ce qui est le contraire du but du lot.
 *    Elle est donc servie sous la classe en contexte, quelle qu'elle soit.
 */
export function visibleDansLaClasse(classeDeLInstance: string | null, classeEnContexte: string): boolean {
  return classeDeLInstance == null || classeDeLInstance === classeEnContexte
}

/**
 * Ce que l'élève lit sur la ligne — dérivé du seul statut du dépôt, plus la
 * lecture du retour quand il y en a un.
 *
 * ⛔ AUCUNE LETTRE, AUCUNE NOTE, AUCUN POURCENTAGE (`06-` §5 ; `01-` §9) : « un
 *    onglet qui range des exercices n'est pas un endroit où l'on découvre son
 *    niveau », et les agrégats de complétion sont ceux du professeur (C4-L2).
 *    Ce qui suit ne dit que l'ÉTAT DU GESTE — où en est l'élève, jamais ce qu'il
 *    vaut.
 */
export type TonEtat = 'a_faire' | 'en_cours' | 'a_lire' | 'attente' | 'clos'

export interface EtatDeLigne { ton: TonEtat; libelle: string }

export function etatDeLExercice(
  statutDepot: string,
  retour: { publie: boolean; lu: boolean } | null,
): EtatDeLigne {
  // ⭐ L'OBLIGATION DE LECTURE EST UNE RÈGLE, PAS UNE DÉCORATION (`02-` §6.D,
  //    étape 17) : « le retour devient visible quand il coche la case de
  //    publication, AVEC OBLIGATION POUR L'ÉLÈVE DE VALIDER SA LECTURE ». Elle
  //    passe donc devant l'état du dépôt — un retour publié non lu se dit, même
  //    si la version finale est déjà partie.
  if (retour?.publie && !retour.lu) return { ton: 'a_lire', libelle: 'retour à lire' }
  switch (statutDepot) {
    case 'assigne':       return { ton: 'a_faire', libelle: 'à faire' }
    case 'ouvert':        return { ton: 'en_cours', libelle: 'commencé' }
    case 'v1_remis':      return { ton: 'attente', libelle: 'rendu — retour en préparation' }
    case 'retour_publie': return { ton: 'a_lire', libelle: 'retour à lire' }
    case 'vf_remis':      return { ton: 'attente', libelle: 'version finale rendue' }
    case 'clos':          return { ton: 'clos', libelle: 'terminé' }
    case 'abandonne':     return { ton: 'clos', libelle: 'abandonné' }
    // ⛔ `non_fait` SANS CE CAS TOMBERAIT AU `default`, qui rend `ton:
    //    'attente'` et affiche la CHAÎNE BRUTE. Deux mensonges d'un coup : rien
    //    n'est en attente — aucun retour ne viendra —, et « non_fait » n'est pas
    //    une phrase qu'on montre à quelqu'un.
    case 'non_fait':      return { ton: 'clos', libelle: 'non fait' }
    default:              return { ton: 'attente', libelle: statutDepot }
  }
}

/**
 * ⭐⭐ L'ÉTAT D'UN EXAMEN **DE CLASSE** — et pourquoi ce n'est PAS
 *     `etatDeLExercice`.
 *
 * ⛔ LE DÉFAUT QUE CETTE FONCTION ÉVITE, TROUVÉ AU SMOKE DU 27/08.
 *    `etatDeLExercice` retombe sur le statut du dépôt quand la première clause
 *    ne mord pas, et `case 'retour_publie'` rend `a_lire` **SANS REGARDER
 *    `lu`**. Un retour publié PUIS LU s'affichait donc encore « retour à
 *    lire » — mesuré en bac à sable sur un retour lu le 22/08. La tuile
 *    « à faire » du tableau de bord, qui filtre sur cet état, **ne se serait
 *    jamais éteinte** : l'élève valide sa lecture et le rappel reste.
 *
 * ⭐ LA SÉQUENCE DE CLASSE S'ARRÊTE À `retour_publie` (`SEQUENCE_CLASSE`,
 *    `utils/passation/depots.ts` ; piège 4) : **il n'y a PAS de version
 *    finale**. Lire son retour est donc le DERNIER geste — d'où `clos` une fois
 *    `lu_at` posé. À la maison la suite existe (`vf_remis`), et c'est
 *    exactement pourquoi les deux règles ne se confondent pas : rendre `clos`
 *    sur un formatif dirait « terminé » à un élève qui doit encore écrire sa
 *    version finale.
 *
 * ⚠️ LE RETOUR PASSE DEVANT LE STATUT, et il le tranche seul quand il existe :
 *    c'est le FAIT (`published_at`, `lu_at`), quand le statut n'en est que la
 *    trace. « Une trace n'est pas la chose. »
 *
 * ⚠️ `retour_publie` SANS RETOUR PUBLIÉ NE PROMET PAS UN RETOUR. L'écran
 *    (`retourPublie`, `utils/passation/vues.ts`) ne rend rien sans
 *    `published_at` : annoncer « retour à lire » sur la foi du seul statut
 *    enverrait l'élève sur une page qui se tait. On dit ce qu'il va voir.
 */
export function etatDExamenDeClasse(
  statutDepot: string,
  retour: { publie: boolean; lu: boolean } | null,
): EtatDeLigne {
  if (retour?.publie) {
    return retour.lu
      ? { ton: 'clos', libelle: 'retour lu' }
      : { ton: 'a_lire', libelle: 'retour à lire' }
  }
  switch (statutDepot) {
    case 'v1_remis':
    case 'retour_publie': return { ton: 'attente', libelle: 'rendu — retour en préparation' }
    case 'vf_remis':      return { ton: 'attente', libelle: 'version finale rendue' }
    case 'clos':          return { ton: 'clos', libelle: 'terminé' }
    case 'abandonne':     return { ton: 'clos', libelle: 'abandonné' }
    // ⛔ `non_fait` SANS CE CAS TOMBERAIT AU `default`, qui rend `ton:
    //    'attente'` et affiche la CHAÎNE BRUTE. Deux mensonges d'un coup : rien
    //    n'est en attente — aucun retour ne viendra —, et « non_fait » n'est pas
    //    une phrase qu'on montre à quelqu'un.
    case 'non_fait':      return { ton: 'clos', libelle: 'non fait' }
    default:              return { ton: 'attente', libelle: statutDepot }
  }
}

/**
 * L'ordre de la liste : ce qui appelle un geste d'abord, le reste ensuite, et à
 * ton égal la plus proche échéance en tête. Une échéance absente passe en fin —
 * elle n'invente pas une urgence qu'elle ne porte pas.
 *
 * ⛔ CE N'EST PAS « L'ÉCRAN DE LA SEMAINE » (C6-L2) : aucune frise, aucune barre
 *    de progrès, aucun héros « à faire maintenant » — le point d'entrée du cycle
 *    reste le tableau de bord (`01-` §2). Ceci est un TRI DE LISTE.
 */
const RANG: Record<TonEtat, number> = { a_lire: 0, a_faire: 1, en_cours: 2, attente: 3, clos: 4 }

export function comparerLignes(
  a: { ton: TonEtat; echeance: string | null },
  b: { ton: TonEtat; echeance: string | null },
): number {
  const r = RANG[a.ton] - RANG[b.ton]
  if (r !== 0) return r
  if (a.echeance === b.echeance) return 0
  if (a.echeance == null) return 1
  if (b.echeance == null) return -1
  return a.echeance.localeCompare(b.echeance)
}

/**
 * La première ligne non vide de la consigne — le titre d'une ligne de liste.
 * La consigne ENTIÈRE reste dans l'écran qui la sert (le déroulé, la passation).
 *
 * ⚠️ UNE PAIRE DE DIAGNOSTIC PORTE DEUX CAS DANS UN TABLEAU (`07-` §1.1 ;
 *    `exercices_paire_chk`) : on prend le premier, jamais une concaténation.
 */
export function titreDeLaConsigne(v: unknown, repli = 'Exercice'): string {
  const brut = typeof v === 'string' ? v
    : Array.isArray(v) ? titreDeLaConsigne(v[0], '')
    : estObjet(v) ? texte((v as Record<string, unknown>).texte)
    : ''
  const ligne = brut.split('\n').map((x) => x.trim()).find((x) => x !== '')
  return ligne ?? repli
}

const texte = (x: unknown): string => (typeof x === 'string' ? x : '')
const estObjet = (x: unknown): boolean => typeof x === 'object' && x !== null && !Array.isArray(x)
