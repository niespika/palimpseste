import 'server-only'
// ============================================================================
// C4 · L5 — CE QUE LA CHAÎNE LIT AVANT DE PARTIR.
// ----------------------------------------------------------------------------
// Un seul endroit où l'on va chercher en base, pour qu'aucun module de calcul
// n'ait à le faire. Trois disciplines s'y tiennent :
//
//  · « LA COUCHE TYPE LIT CE QUI EST DÉRIVÉ — `exercices_routes`,
//    `exercices_types_crans`, `exercices_crans` —, et NE LIS PAS la doctrine
//    dans le `04-` à l'exécution » (piège 4) ;
//  · « la correspondance observable → formulation, LUE EN BASE, déposée par la
//    fabrique ; JAMAIS lue des fiches en session » (piège 30) ;
//  · « le régime v1→vf SE DÉRIVE DU CRAN ÉLU » (piège 18 ; `02-` §2.2) — et non
//    d'une colonne qu'on aurait ajoutée.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { CRANS_A_ETALON, cranEstUnCode, cranNumero } from '@/utils/cran'
import { lireLesStatutsDeRecette } from '@/utils/statut-recette'
import { formeDepuisLePlan } from './modele'
import { bornesLues, servirLeTexteSupport } from '@/utils/lecture/texte-support'
import type { SegmentMateriau } from '@/utils/deroule/marquage'
import { enTexte } from './consigne'
import type { Competence, Forme, Grain, Lieu, StatutRecette } from './types'
import { COMPETENCES } from './types'

type Admin = ReturnType<typeof createAdminClient>

/**
 * ⭐ C5-L2 — LE TEXTE D'AUTEUR TEL QU'IL EST SERVI : une tranche, et ce qu'on y
 * marque. La découpe et les bornes viennent de `utils/lecture/texte-support.ts`,
 * qui est PUR ; ici on ne fait que joindre l'identité du texte.
 */
export interface TexteSupportServi {
  /** La tranche servie — l'englobant, ou le texte entier quand il n'y en a pas. */
  texte: string
  /** Ses bornes dans le texte entier — caractères, base 0, fin exclue. */
  bornes: readonly [number, number]
  /**
   * La tranche découpée en segments marqués et non marqués (C4-L15). ⛔ **La
   * concaténation des `texte`, dans l'ordre, REND LA TRANCHE À L'OCTET PRÈS.**
   */
  segments: SegmentMateriau[]
  /** Faux quand la localisation tombe hors de l'englobant : on ne marque pas au hasard. */
  selectionMarquee: boolean
  /** L'identité du texte, telle qu'elle se dit à l'élève. */
  auteur: string | null
  titre: string | null
  reference: string | null
}

/**
 * Ce qu'un CAS porte pour le retour chaud — et rien de plus.
 * ⚠️ Les deux champs sont indépendamment nullables : un cran de production n'a
 *    pas de matériau, un cas de la 1.3 peut n'avoir pas de réponse déclarée.
 */
export interface CasServiAuRetour {
  ordre: number
  /** `exercices_materiaux.contenu` — ce que l'élève avait SOUS LES YEUX. */
  materiau: string | null
  /** `exercices_cas.reponse_attendue` — la réponse, telle que la banque la porte. */
  reponseAttendue: string | null
}

export interface ContexteDepot {
  depotId: string
  eleveId: string
  exerciceId: string
  classeId: string | null
  lieu: Lieu
  forme: Forme
  /** Le code de l'objet — l'opérande « objet » de `distance_contexte` (`01-` §11). */
  objet: string
  grain: Grain
  cran: number | null
  cranCode: string | null
  /**
   * `exercices.cible_primaire` — « la compétence qui commande le retour »
   * (`07-` §1.1 ; `01-` §1, point 1 : « l'exercice porte la cible »).
   *
   * ⚠️ NULLABLE, et elle le reste : « sur la voie du routeur elle reste NULL —
   *    la cible est la sortie de la couche 2 et vit à la décision ». Un
   *    `NOT NULL` casserait toute la voie du routeur.
   */
  ciblePrimaire: Competence | null
  /** `02-` §2.2 — `par paires` · `pas de vf, sauf escalade` · `plein`. */
  regimeV1vf: string | null
  genre: string | null
  bonus: boolean
  paireDiagnostic: boolean
  /** `exercices.modes_par_competence` — les modes ÉLUS, par compétence mesurée. */
  modesParCompetence: Record<string, string[]>
  consigne: string
  /** La production mesurée : le texte saisi, ou la transcription CORRIGÉE (`02-` §6.D). */
  productionV1: string | null
  productionVf: string | null
  /** `07-` §1.3 — le seul endroit où la mécanique touche la lettre (piège 53). */
  exceptionOrthographe: boolean
  statutsRecette: Record<Competence, StatutRecette>
  /** La couche compétence, lue en base (`competences_correspondance`). */
  correspondance: Record<string, Array<{ observable_code: string; dimension_eleve: string }>>
  /** La couche type — « Ce qui est servable ici », lue de la doctrine dérivée. */
  servable: Array<{ competence: string; observable_nom: string }>
  /**
   * Aux TROIS CRANS DE PRODUCTION (2, 6, 8), `exercices_routes` ne porte rien —
   * « les trois crans de production, QUE LES TABLES NE PEUVENT PAS PORTER »
   * (`04-` §0 et §14), et une contrainte de C4-L8 le tient. Ce n'est donc pas un
   * trou de données : c'est la doctrine. Ce que le `04-` §14 porte pour eux, ce
   * sont les QUINZE PATRONS de consigne — l'autre moitié de la couche type,
   * « ce que l'exercice servi demandait » (`01-` §12).
   */
  patronProduction: string | null
  /**
   * ⭐⭐ C6 · ITEM 86 — L'ÉTALON DES CRANS DE PRODUCTION, ET IL EST LÀ POUR
   * CONTRAINDRE CE MODÈLE. Le `02-` 6.0 §2.3.4 : « une production modèle : à
   * quoi peut ressembler une bonne réponse. […] Sans étalon, le modèle fabrique
   * son propre barème à chaque copie, et deux élèves qui écrivent la même chose
   * ne sont pas jugés pareil. Elle guide son retour autant qu'elle le borne. »
   *
   * ⛔ **CE N'EST PAS UNE RÉPONSE À COMPARER.** « Rien ne se compare mot à mot.
   *    Une production a plusieurs bonnes formes, et l'étalon en donne UNE,
   *    jamais la seule. » Le jugement reste celui du modèle ; l'étalon lui donne
   *    son repère, il ne le remplace pas. Le prompt le dit en ces termes.
   *
   * ⚠️ **AUX TROIS CRANS DE PRODUCTION, PLUS LE CRAN 7**, et `null` partout
   *    ailleurs. Aux quatre crans qui isolent — 1, 3, 4, 5 —, la
   *    `reponse_attendue` est LA réponse, servie à l'écran comme candidat ou
   *    comme corrigé : la servir ici la ferait lire comme un modèle, et le
   *    jugement s'y appuierait à faux. C'est le cran qui décide, jamais la
   *    présence du champ.
   * ⭐⭐ **LE CRAN 7 EST ENTRÉ LE 31/08**, avec l'amendement du `02-` §2.2 qui
   *    l'a fait passer de `null` à `présent`. Il n'isole pas : son appui est
   *    ABSENT, l'élève ne voit rien, et `etalonServi` ne le déplie jamais. Sa
   *    réponse attendue n'existe donc QUE pour ce chemin-ci — « borner le
   *    retour de l'IA, qui sans elle refait son barème à chaque copie ».
   *    ⛔ Sans cette ligne, les 88 réponses écrites au cran 7 ne parviennent à
   *    personne : ni à l'élève, ni au modèle. *Mesuré avant de l'écrire.*
   * ⛔ Le cran 9 reste DEHORS : sa réponse est la correction de la paire,
   *    servie à l'élève entre les deux cas (`composerLaCorrection`). La donner
   *    aussi au correcteur la ferait lire comme un modèle de production.
   */
  etalonProduction: string | null
  /**
   * ⭐⭐ 31/08/2026 — LE MATÉRIAU ET L'ATTENDU, POUR LE SEUL RETOUR CHAUD.
   *    Décision de Louis : *« la seule IA qui devrait avoir le matériau et
   *    l'attendu de réponse, c'est Calame lors du retour chaud. »*
   *
   * ⛔⛔ LE TROU QUE CECI FERME, ET IL A ÉTÉ MESURÉ. `exercices_materiaux`
   *    n'était lu par AUCUN prompt : ni P1, ni P2, ni le retour. Or les
   *    consignes de la banque sont DÉICTIQUES — « Réécris **ce passage** sans le
   *    défaut » (cran 5), « **Ce passage** peut être meilleur » (cran 7),
   *    « Chaque mot de **ce texte** dit-il ce qu'il doit dire ? » (cran 9). Le
   *    modèle recevait la consigne et la copie, et « ce passage » ne désignait
   *    rien. *Mesuré sur `banque.json` : aucun des 576 exercices ne porte de
   *    référence, donc `reference` et `source` sont absents pour tous — il ne
   *    restait littéralement que la consigne et la copie.*
   *
   * ⛔ ET IL NE VA PAS AU JUGE, C'EST LE POINT. P1 et P2 mesurent des
   *    OBSERVABLES DE COMPÉTENCE sur la production ; leur donner la réponse les
   *    ferait juger la justesse de l'exercice, ce qui n'est pas leur objet. Le
   *    retour, lui, PARLE à l'élève de son texte : c'est là que le matériau
   *    manque, et nulle part ailleurs.
   *
   * ⚠️ ON NE SERT JAMAIS `version_corrigee`. Le matériau servi est le `contenu`
   *    — ce que l'élève avait sous les yeux. La version corrigée est un autre
   *    objet, et aux crans 3 et 5 elle EST la réponse.
   */
  casPourLeRetour: CasServiAuRetour[]
  /**
   * Ce que la DÉCISION D'ASSIGNATION porte. « Le drapeau [de sonde de montée]
   * vient de la décision d'assignation ; la chaîne LE RECOPIE sur la mesure,
   * ELLE NE LE DEVINE PAS » (piège 20).
   */
  decision: {
    cibleRetenue: string | null
    /**
     * ⭐⭐ C6 · L3 — LA MARQUE `bonus`, ET ELLE VIENT D'ICI, PAS DE L'INSTANCE.
     * « Un exercice servi sur ce quota porte la marque `bonus` AU JOURNAL
     * (§11) » (`01-` §5). C'est le même canal que `sonde_montee` juste
     * au-dessous, et pour le même motif : le drapeau vient de la DÉCISION
     * D'ASSIGNATION, la chaîne LE RECOPIE, elle ne le devine pas.
     */
    bonus: boolean
    /** Les compétences SONDÉES — silencieuses : elles ne produisent aucun retour. */
    sondes: string[]
    /**
     * Les compétences sondées EN MONTÉE, nommément. Le drapeau se recopie sur
     * LEUR mesure, jamais sur celle de la cible : « une mesure de sonde de montée
     * est marquée et NEUTRE POUR TOUT LE RESTE » (`01-` §8.8, M-e).
     */
    sondesMontee: string[]
  } | null
  /** `confiance_declaree`, par compétence — une valeur par `evaluee` mesurée (§1.1). */
  confianceDeclaree: Record<string, string>
  /**
   * Le référent de la production. « UN SEUL appel d'extraction quand le référent
   * est LE COURS — l'aligneur ne tourne pas » (`07-` §1.2 ; piège 6) ; la
   * synthèse en classe a le cours pour référent (`01-` §10).
   */
  referent: 'texte' | 'cours' | null
  /**
   * ⭐⭐ LA RÉFÉRENCE DÉCOMPOSÉE DU TEXTE, telle que `exercices_references.contenu`
   * la porte — le format qui fait foi au `02-exercices.md` §6, et que
   * `copies-tests/_commun/verifie-reference.py` déclare CLOS : `phrases`,
   * `moments`, `concepts`, `lectures`, `armature`, `hesitation`, et rien d'autre.
   *
   * ⛔ ELLE N'EST SERVIE QUE VALIDÉE, et ce n'est pas une prudence : une garde
   *    EN BASE (`garde_reference_validee`, `c4_l1_schema.sql`) **lève une
   *    exception** dès qu'un `artefact_jugement` s'écrit sur un dépôt dont
   *    l'exercice porte une référence non validée. Tant que la chaîne s'arrêtait
   *    avant P2, la garde ne tirait jamais ; en servant la référence, elle
   *    tirerait — et une exception de base emporte la trace avec elle, au lieu
   *    d'une mesure qui s'arrête proprement en NOMMANT ce qui manque.
   *    *Une référence non validée laisse donc ce champ à `null`, le slot du
   *    branchement est servi à `null`, et la mesure s'arrête en le nommant.*
   *
   * ⚠️ `null` NE VEUT PAS DIRE « pas de référent » : `referent` reste `'texte'`
   *    dès que l'exercice porte une `reference_id`. Les deux disent deux choses
   *    différentes — ce que l'exercice DÉCLARE, et ce que la chaîne PEUT SERVIR.
   */
  reference: unknown | null
  /**
   * LE MATÉRIAU — le texte source de la référence, `scriptorium_contenus.texte_extrait`.
   *
   * ⭐ Il vient de la MÊME jointure : `exercices_references.source_contenu_id`.
   * Le pré-relevé mécanique de la Synthèse en a besoin — « le nombre de mots de
   * la production ET DU MATÉRIAU, le taux de compression, et les recouvrements
   * verbatim » (`competences/synthese.md` §3) —, et sans lui son aligneur
   * s'entendrait dire « aucune reprise littérale » alors que rien n'a été
   * cherché. *Servir la référence sans le matériau activerait un chemin sur un
   * énoncé faux : les deux descendent ensemble, ou aucun.*
   *
   * ⚠️ L'arc de source est EXCLUSIF : une référence bâtie sur un livre
   *    (`source_livre_id`) n'a pas de `texte_extrait`, et ce champ reste `null`.
   */
  materiau: string | null
  /**
   * ⭐⭐ C5-L2 — LE TEXTE SUPPORT : ce que l'élève A SOUS LES YEUX, et rien de plus.
   *
   * ⚠️ **IL NE SE CONFOND PAS AVEC `materiau` CI-DESSUS**, et les deux ne
   *    viennent pas du même endroit :
   *      · `materiau` est le texte source de la RÉFÉRENCE
   *        (`exercices_references.source_contenu_id`), **entier**, et il sert le
   *        pré-relevé mécanique de la Synthèse ;
   *      · `texteSupport` est le texte que l'INSTANCE désigne
   *        (`materiau_source_texte_id`), **borné par l'englobant** — « la portion
   *        du texte AFFICHÉE AUTOUR de la sélection […] l'étendue réellement
   *        lue » (`02-` §6 B.1).
   *    ⭐ **C'est le second qui ferme RR3** : « les citations portent leur source
   *    — la copie de l'élève d'un côté, LE TEXTE SUPPORT de l'autre » (`01-` §12).
   *    Contrôler l'étiquette contre le texte ENTIER déclarerait « du texte » une
   *    phrase que l'élève n'a jamais vue.
   *
   * ⛔ `null` sur tout exercice d'écriture — il n'y a pas de texte d'auteur, et
   *    le contrôle RR3 ne peut alors rien affirmer : il le DIT, il ne se tait pas.
   *
   * ⭐ **UN SEUL DOMICILE POUR DEUX LECTEURS.** La chaîne n'en lit que `texte`
   *    (ce qu'elle balise et ce contre quoi elle contrôle) ; l'écran n'en lit
   *    que `segments` (la tranche, la sélection marquée dedans). Deux lectures
   *    séparées auraient fait deux requêtes et, un jour, deux tranches.
   */
  texteSupport: TexteSupportServi | null
  /**
   * ⭐⭐ LE CO-TEXTE — la matière des trois crans de PRODUCTION (2, 6, 8).
   *
   * L'argument à illustrer, les deux paragraphes à coudre, la thèse à
   * contredire : ce sur quoi l'élève s'appuie pour écrire du NEUF. Servi entier,
   * tel qu'il est stocké.
   *
   * ⛔ **DISTINCT DU `texteSupport`**, et il faut que les deux le restent : le
   *    texte d'auteur a une identité, des bornes et une sélection marquée ; le
   *    co-texte est fabriqué, n'a ni auteur ni localisation, et se sert d'un
   *    bloc. Les confondre ferait afficher « Le texte · null · null ».
   *
   * ⛔ **DISTINCT AUSSI DU MATÉRIAU DES CAS.** Celui-là est la CIBLE — « il le
   *    modifie, ou il le juge sans rien rédiger de neuf » (`02-` §2.3.3) — et
   *    aux crans de production la doctrine n'en déclare aucune.
   */
  coTexte: string | null
  /**
   * LE SITE UNIQUE des deux observables de lucidité — « la synthèse en classe »,
   * et pas un autre (`01-` §10 ; `competences/monitoring.md` §4 et §6).
   * Elle se reconnaît à sa ligne de plan : `type_exercice = 'synthese'`, que la
   * garde du plan tient déjà en `formatif` × `classe` × `codex`.
   */
  estSyntheseEnClasse: boolean
}

const NUL = 'introuvable'

// Le dépôt n'a pas de types générés : les `select` concaténés ne s'infèrent pas,
// et le patron du dépôt est le transtypage explicite (`utils/acces.ts`,
// `utils/plan-exercices.ts`). Les formes ci-dessous disent CE QU'ON LIT, colonne
// par colonne — elles ne déclarent rien de plus que la requête au-dessus d'elles.
interface LigneDepot {
  id: string; eleve_id: string; exercice_id: string; statut: string
  texte_v1: string | null; transcription_v1: string | null
  texte_vf: string | null; transcription_vf: string | null
  confiance_declaree: Record<string, string> | null
  routeur_decision_id: string | null
}
interface LigneExercice {
  id: string; type_id: string; classe_id: string | null; lieu: string
  consigne_instanciee: unknown; paire_diagnostic: boolean; cran: string | number | null
  cible_primaire: string | null
  genre: string | null; modes_par_competence: Record<string, string[]> | null
  // ⛔ `exercices.bonus` N'EST PLUS SÉLECTIONNÉ — C6-L3. La colonne existe
  //    toujours (`07-` §1.1) et l'import la signale (`08-` §7.3), mais elle ne
  //    peut pas porter un fait par (élève × exercice) : la marque vit désormais
  //    sur `routeur_decisions`. La sélectionner ici ferait croire qu'elle sert.
  exercice_planifie_id: string | null; reference_id: string | null
  /** ⭐ C5-L2 — le texte d'auteur DÉSIGNÉ PAR L'INSTANCE, et ses deux bornes. */
  materiau_source_texte_id: string | null
  materiau_source_englobant: unknown
  materiau_source_localisation: unknown
  /** ⭐⭐ Le CO-TEXTE des crans de production, désigné par l'instance. */
  cotexte_materiau_id: string | null
}

export class DepotIllisible extends Error {}

export async function lireContexte(admin: Admin, depotId: string): Promise<ContexteDepot> {
  const { data: depotBrut, error: eDepot } = await admin
    .from('exercices_depots')
    .select('id, eleve_id, exercice_id, statut, texte_v1, transcription_v1, texte_vf, '
      + 'transcription_vf, confiance_declaree, routeur_decision_id')
    .eq('id', depotId).maybeSingle()
  if (eDepot) throw new DepotIllisible(`dépôt ${depotId} : ${eDepot.code} ${eDepot.message}`)
  if (!depotBrut) throw new DepotIllisible(`dépôt ${depotId} : ${NUL}`)
  const depot = depotBrut as unknown as LigneDepot

  const { data: exerciceBrut, error: eEx } = await admin
    .from('exercices')
    // ⭐ C4-L11 — `cible_primaire` DESCEND JUSQU'ICI. Sans elle dans ce select,
    //    la colonne existerait et ne commanderait rien.
    // ⭐ C5-L2 — les trois colonnes du TEXTE SUPPORT descendent ici aussi. Sans
    //    elles dans ce `select`, la lecture ne servirait rien au retour ancré au
    //    texte. ⚠️ Elles existent en bac à sable ET en prod — vérifié avant
    //    d'écrire : sélectionner une colonne absente fait échouer la requête
    //    ENTIÈRE (`42703`), donc « exercice introuvable » pour tout le monde.
    // ⚠️⚠️ `cotexte_materiau_id` NAÎT DE `c4_l8_cotexte_materiau.sql`. La
    //    migration est ADDITIVE, donc elle passe AVANT ce code, jamais après :
    //    déployer cette ligne sur une base qui n'a pas la colonne ferait échouer
    //    la requête ENTIÈRE (`42703`) — « exercice introuvable » POUR TOUT LE
    //    MONDE, sur tous les exercices, y compris ceux qui n'ont pas de
    //    co-texte. C'est l'avertissement de C5-L2 juste au-dessus, et il vaut
    //    exactement de la même façon ici.
    .select('id, type_id, classe_id, lieu, consigne_instanciee, paire_diagnostic, cran, genre, '
      + 'cible_primaire, modes_par_competence, exercice_planifie_id, reference_id, '
      + 'materiau_source_texte_id, materiau_source_englobant, materiau_source_localisation, '
      + 'cotexte_materiau_id')
    .eq('id', depot.exercice_id).maybeSingle()
  if (eEx || !exerciceBrut) throw new DepotIllisible(`exercice de ${depotId} : ${eEx?.message ?? NUL}`)
  const exercice = exerciceBrut as unknown as LigneExercice

  const { data: typeBrut } = await admin
    .from('exercices_types').select('code, grain').eq('id', exercice.type_id).maybeSingle()
  if (!typeBrut) throw new DepotIllisible(`type de l'exercice ${exercice.id} : ${NUL}`)
  const type = typeBrut as unknown as { code: string; grain: Grain | null }

  // ── La `forme` de la mesure, dérivée de la ligne de plan (voir `modele.ts`) ──
  let nature: string | null = null
  let typeExercice: string | null = null
  if (exercice.exercice_planifie_id) {
    const { data: planBrut } = await admin
      .from('scriptorium_exercices_planifies').select('nature, type_exercice')
      .eq('id', exercice.exercice_planifie_id).maybeSingle()
    const plan = planBrut as unknown as { nature: string | null; type_exercice: string | null } | null
    nature = plan?.nature ?? null
    typeExercice = plan?.type_exercice ?? null
  }

  // ── LE CRAN — une seule forme, et une lecture qui ne rend jamais NaN ───────
  // ⚠️⚠️ `Number(exercice.cran)` rendait **NaN** sur une instance dont le cran
  //    est écrit AU CODE — et `NaN != null` est vrai. La requête partait alors
  //    en `cran=eq.NaN`, PostgREST rendait un 400 que supabase-js avale, et
  //    `cran`, `cranCode`, `regimeV1vf`, `servable` ET `patronProduction`
  //    ressortaient tous les cinq VIDES sur une instance parfaitement valide.
  //    Trois gardes `Number.isFinite` existaient déjà — la ligne du `servable`
  //    n'en avait pas. `cranNumero()` ferme la porte à la source (C4-L11).
  // ⭐ Et la lecture RÉSOUT un cran écrit au code, une fois, par sa table : la
  //    forme unique est le NUMÉRO (`utils/cran.ts`), mais une instance d'avant
  //    la conversion doit continuer de traverser la chaîne, pas rendre du vide.
  let cran = cranNumero(exercice.cran)
  let cranCode: string | null = null
  let regimeV1vf: string | null = null
  if (cran != null || cranEstUnCode(exercice.cran)) {
    const q = admin.from('exercices_crans').select('cran, code, regime_v1vf')
    const { data: cBrut } = await (cran != null
      ? q.eq('cran', cran)
      : q.eq('code', String(exercice.cran).trim())).maybeSingle()
    const c = cBrut as unknown as
      { cran: number | null; code: string | null; regime_v1vf: string | null } | null
    cran = cranNumero(c?.cran) ?? cran
    cranCode = c?.code ?? null
    regimeV1vf = c?.regime_v1vf ?? null
  }

  // ── LA RÉFÉRENCE DÉCOMPOSÉE, ET SON MATÉRIAU ──────────────────────────────
  //
  // ⭐ UNE SEULE JOINTURE FERME DEUX MANQUES : `exercices_references` porte le
  //    `contenu` — la référence au format du `02-` §6 — ET le lien vers son
  //    texte source. Le Questionnement en lit `armature.question_directrice`
  //    dans les quatre modes réceptifs ; la Synthèse en a besoin pour son
  //    aligneur, pour le document de son juge, et — par le matériau — pour son
  //    pré-relevé mécanique.
  //
  // ⛔ VALIDÉE SEULEMENT. `garde_reference_validee` (en base) LÈVE dès qu'un
  //    `artefact_jugement` s'écrit sur une référence non validée. Servir une
  //    référence non validée échangerait un arrêt propre, qui NOMME le slot qui
  //    manque, contre une exception de base qui emporte la trace.
  let reference: unknown | null = null
  let materiau: string | null = null
  if (exercice.reference_id) {
    const { data: refBrut } = await admin
      .from('exercices_references')
      .select('contenu, validee_at, source_contenu_id')
      .eq('id', exercice.reference_id).maybeSingle()
    const ref = refBrut as unknown as
      { contenu: unknown; validee_at: string | null; source_contenu_id: string | null } | null
    if (ref?.validee_at) {
      reference = ref.contenu ?? null
      if (ref.source_contenu_id) {
        const { data: srcBrut } = await admin
          .from('scriptorium_contenus').select('texte_extrait')
          .eq('id', ref.source_contenu_id).maybeSingle()
        const src = srcBrut as unknown as { texte_extrait: string | null } | null
        materiau = src?.texte_extrait ?? null
      }
    }
  }

  // ── ⭐⭐ C5-L2 — LE TEXTE SUPPORT : LA TRANCHE QUE L'ÉLÈVE LIT ─────────────
  //
  // UNE SEULE LECTURE, et c'est une JOINTURE : `exercices_textes.contenu_id` →
  // `scriptorium_contenus.texte_extrait`. Deux requêtes en série auraient doublé
  // le coût d'un chemin qui est CHAUD — le contrat de latence est de moins de
  // trois minutes (`01-` §12), et cette lecture est sur le trajet du retour.
  // ⚠️ Elle n'est PAS sur le trajet de l'attente : `attenteDuDepot`
  //    (`utils/deroule/mesure.ts`) ne lit que la file, et n'a pas été touchée.
  //
  // ⛔ ON NE RECOPIE PAS LE TEXTE SUR L'INSTANCE. `scriptorium_contenus` en est
  //    le domicile ; l'instance ne porte que des BORNES.
  //
  // ⚠️ L'ENGLOBANT, PAS LE TEXTE ENTIER — « c'est l'étendue réellement lue »
  //    (`02-` §6 B.1). Absent, le texte entier : c'est ce que déclarent les
  //    instances qui n'en posent pas (« il n'y a pas d'explication de texte sans
  //    le texte entier », C4-L9).
  let texteSupport: TexteSupportServi | null = null
  if (exercice.materiau_source_texte_id) {
    const { data: txBrut, error: eTx } = await admin
      .from('exercices_textes')
      .select('id, auteur, titre, reference, scriptorium_contenus(texte_extrait)')
      .eq('id', exercice.materiau_source_texte_id).maybeSingle()
    if (eTx) {
      // supabase-js NE LÈVE PAS : sans ce test, un texte illisible passerait pour
      // un exercice sans texte — et le contrôle RR3 se croirait sans objet.
      console.error(`[chaine] texte support illisible (${exercice.materiau_source_texte_id}) — `
        + `${eTx.code} ${eTx.message}`)
    } else {
      const tx = (txBrut ?? {}) as unknown as Record<string, unknown>
      const jointe = tx.scriptorium_contenus
      const contenu = (Array.isArray(jointe) ? jointe[0] : jointe) as
        { texte_extrait?: string | null } | null | undefined
      const servi = servirLeTexteSupport(
        contenu?.texte_extrait ?? null,
        bornesLues(exercice.materiau_source_englobant),
        bornesLues(exercice.materiau_source_localisation),
      )
      if (servi) {
        texteSupport = {
          ...servi,
          auteur: typeof tx.auteur === 'string' ? tx.auteur : null,
          titre: typeof tx.titre === 'string' ? tx.titre : null,
          reference: typeof tx.reference === 'string' ? tx.reference : null,
        }
      }
    }
  }

  // ── ⭐⭐ LE CO-TEXTE — LA MATIÈRE DES CRANS DE PRODUCTION ──────────────────
  //
  // Aux crans 2, 6 et 8, l'élève écrit du NEUF en s'appuyant sur quelque chose :
  // l'argument à illustrer, les deux paragraphes à coudre, la thèse à
  // contredire. Sans lui, la consigne désigne un texte que personne ne montre —
  // « Voici l'argument à illustrer. Sa dernière phrase dit qu'il y a là quelque
  // chose "qu'il faut voir" », et rien à l'écran n'est cet argument.
  //
  // ⛔ CE N'EST NI UN TEXTE D'AUTEUR NI UN MATÉRIAU DE CAS. Pas d'auteur, pas de
  //    bornes dans un texte plus grand, pas de défaut calibré : c'est un texte
  //    fabriqué, servi entier. Il ne passe donc pas par `TexteSupportServi`, qui
  //    porte une identité et des segments dont il n'a que faire.
  //
  // ⚠️ supabase-js NE LÈVE PAS : sans ce test, un co-texte illisible passerait
  //    pour un exercice qui n'en a pas — et on servirait de nouveau la consigne
  //    toute seule, ce que ce lot répare.
  let coTexte: string | null = null
  if (exercice.cotexte_materiau_id) {
    const { data: ct, error: eCt } = await admin
      .from('exercices_materiaux').select('contenu')
      .eq('id', exercice.cotexte_materiau_id).maybeSingle()
    if (eCt) {
      console.error(`[chaine] co-texte illisible (${exercice.cotexte_materiau_id}) — `
        + `${eCt.code} ${eCt.message}`)
    } else {
      const texte = typeof ct?.contenu === 'string' ? ct.contenu : ''
      coTexte = texte.trim() === '' ? null : texte
    }
  }

  const modesParCompetence = (exercice.modes_par_competence ?? {}) as Record<string, string[]>
  const tousLesModes = [...new Set(Object.values(modesParCompetence).flat())]

  // ── La couche type : « Ce qui est servable ici », DÉRIVÉ en base (piège 4) ──
  //
  // ⚠️ `exercices_routes` NE PORTE QUE LES SIX CRANS QUI ISOLENT (1·3·4·5·7·9) —
  //    une contrainte de C4-L8 le tient, parce que « les trois crans de
  //    production, les tables ne peuvent pas les porter » (`04-` §0 et §14). Aux
  //    crans 2, 6 et 8 — le geste PRODUIRE, donc l'essai, la dissertation, le
  //    diagnostic de la semaine 1 —, filtrer sur les routes rendait une liste
  //    vide, et le prompt affirmait au modèle que « rien n'est déclaré ». La
  //    couche type y lit donc `exercices_types_crans.couverture_observables`, que
  //    le piège 4 nomme AUSSI, et qui dit ce que le cran couvre.
  let servable: ContexteDepot['servable'] = []
  if (cran != null && tousLesModes.length) {
    const { data: routes } = await admin
      .from('exercices_routes').select('competence, observable_nom')
      .eq('objet_code', type.code).eq('cran', cran).in('mode', tousLesModes)
    const vus = new Set<string>()
    servable = ((routes ?? []) as unknown as Array<{ competence: string; observable_nom: string }>)
      .filter((r) => {
        const c = `${r.competence}|${r.observable_nom}`
        if (vus.has(c)) return false
        vus.add(c)
        return true
      })
    // Aux crans de PRODUCTION, `exercices_routes` est vide par contrainte : on
    // demande alors sa couverture au cran lui-même, avant de retomber sur le
    // patron de consigne.
    if (servable.length === 0) {
      servable = await couvertureDuCran(
        admin, exercice.type_id, cran, tousLesModes, Object.keys(modesParCompetence))
    }
  }

  // ── La couche compétence : la correspondance, lue EN BASE (piège 30) ────────
  const competencesEnJeu = Object.keys(modesParCompetence)
  const { data: corr } = await admin
    .from('competences_correspondance')
    .select('competence, observable_code, dimension_eleve, ordre')
    .in('competence', competencesEnJeu.length ? competencesEnJeu : ['__aucune__'])
    .order('ordre', { ascending: true })
  const correspondance: ContexteDepot['correspondance'] = {}
  for (const l of (corr ?? []) as unknown as Array<{ competence: string; observable_code: string; dimension_eleve: string }>) {
    ;(correspondance[l.competence] ??= []).push({
      observable_code: l.observable_code, dimension_eleve: l.dimension_eleve,
    })
  }

  const statutsRecette = await lireStatutsRecette(admin)

  const { data: profilBrut } = await admin
    .from('profiles').select('exception_orthographe').eq('id', depot.eleve_id).maybeSingle()
  const profil = profilBrut as unknown as { exception_orthographe: boolean | null } | null

  let decision: ContexteDepot['decision'] = null
  if (depot.routeur_decision_id) {
    const { data: dBrut } = await admin
      .from('routeur_decisions').select('cible_retenue, sondes_retenues, bonus')
      .eq('id', depot.routeur_decision_id).maybeSingle()
    const d = dBrut as unknown as {
      cible_retenue: string | null; sondes_retenues: unknown; bonus: boolean | null
    } | null
    if (d) {
      const sondes = Array.isArray(d.sondes_retenues)
        ? (d.sondes_retenues as Array<{ competence?: string; sonde_montee?: boolean }>)
        : []
      // ⛔⛔ LES DEUX SONDES NE SE CONFONDENT JAMAIS (`01-` §8.8), et elles
      //    vivent dans le MÊME tableau, distinguées par `sonde_montee` :
      //    · la sonde SECONDAIRE mesure une compétence NON CIBLÉE, en silence —
      //      « elle ne produit AUCUN RETOUR » (§1, principe 4) ; c'est celle-là,
      //      et elle seule, que `sondesDeLExercice()` écarte du retour ;
      //    · la sonde de MONTÉE est LA CASE CHOISIE EN PHASE A pour la
      //      compétence CIBLE, au-dessus de sa bande (M-b). Elle REÇOIT un
      //      retour — démonstratif chez E-D et C, interrogatif à B (§8.7) —, et
      //      la mettre dans `sondes` SILENCERAIT LE RETOUR DE LA CIBLE MÊME.
      //    *Narrowing posé par C4-L12, le lot qui remplit ces deux canaux.*
      const deMontee = sondes.filter((s) => s.sonde_montee === true)
        .map((s) => s.competence ?? '').filter(Boolean)
      decision = {
        cibleRetenue: d.cible_retenue ?? null,
        bonus: d.bonus === true,
        sondes: sondes.filter((s) => s.sonde_montee !== true)
          .map((s) => s.competence ?? '').filter(Boolean),
        sondesMontee: deMontee,
      }
    }
  }

  return {
    depotId,
    eleveId: depot.eleve_id,
    exerciceId: exercice.id,
    classeId: exercice.classe_id ?? null,
    lieu: exercice.lieu as Lieu,
    forme: formeDepuisLePlan(nature, typeExercice === 'synthese' && exercice.lieu === 'classe'),
    objet: type.code,
    grain: type.grain ?? 'meso',
    cran,
    cranCode,
    ciblePrimaire: (COMPETENCES as readonly string[]).includes(String(exercice.cible_primaire ?? ''))
      ? exercice.cible_primaire as Competence : null,
    regimeV1vf,
    genre: exercice.genre ?? null,
    // ⛔⛔ LA MARQUE NE VIENT PLUS DE L'INSTANCE — C6-L3, et c'est le cœur du
    //    lot. `exercices` est LA BANQUE : « entre élèves, une instance se
    //    ressert — une instance, plusieurs dépôts » (`utils/moteur/vivier.ts`),
    //    quand le fait, lui, est par (ÉLÈVE × EXERCICE). Un `true` sur
    //    l'instance que Léa a DEMANDÉE marquerait aussi la mesure de Tom, à qui
    //    la même instance aura été IMPOSÉE — et le journal de fin d'année dirait
    //    l'inverse de ce que le `01-` §5 lui demande de dire.
    // ⛔ ET PAS DE `||` AVEC `exercice.bonus` : un repli ressusciterait
    //    exactement ce défaut. Sans décision — la voie du professeur —, il n'y a
    //    pas de bonus, et c'est vrai par construction : le professeur n'en sert
    //    aucun. *Constaté avant la bascule : 0 instance marquée dans les deux
    //    bases, donc le changement est un no-op sur les données existantes.*
    bonus: decision?.bonus === true,
    paireDiagnostic: !!exercice.paire_diagnostic,
    modesParCompetence,
    consigne: enTexte(exercice.consigne_instanciee),
    productionV1: production(depot.texte_v1, depot.transcription_v1),
    productionVf: production(depot.texte_vf, depot.transcription_vf),
    exceptionOrthographe: !!profil?.exception_orthographe,
    statutsRecette,
    correspondance,
    servable,
    patronProduction: cran != null && Number.isFinite(cran)
      ? await patronDeProduction(admin, tousLesModes, cran)
      : null,
    etalonProduction: await etalonDeProduction(admin, exercice.id, cran),
    casPourLeRetour: await casPourLeRetour(admin, exercice.id),
    decision,
    confianceDeclaree: (depot.confiance_declaree ?? {}) as Record<string, string>,
    estSyntheseEnClasse: typeExercice === 'synthese' && exercice.lieu === 'classe',
    referent: typeExercice === 'synthese' && exercice.lieu === 'classe'
      ? 'cours'
      : (exercice.reference_id ? 'texte' : null),
    reference,
    materiau,
    texteSupport,
    coTexte,
  }
}

/**
 * Le statut de recette, par compétence, pour cet élève.
 *
 * Ligne absente : `01-` §3, principe 5 — « une compétence dont la fiche n'est
 * pas déposée est `differee` ET NE PEUT PAS ÊTRE AUTRE CHOSE » ; sinon « une
 * compétence NAÎT `mesuree_silencieusement` » (`07-` §5). On ne devine rien
 * au-delà de ces deux phrases.
 */
export async function lireStatutsRecette(
  admin: Admin,
): Promise<Record<Competence, StatutRecette>> {
  const { data: fiches } = await admin.from('competences_fiches').select('competence')
  const deposees = new Set(((fiches ?? []) as unknown as Array<{ competence: string }>).map((f) => f.competence))
  // ⛔ LE STATUT SE LIT À SA SOURCE UNIQUE, jamais par élève : il est global
  //    (`07-` §1.3), et le ranger par élève laissait les inscrits d'après la
  //    pose sans aucune ligne. `utils/statut-recette.ts`.
  const globaux = await lireLesStatutsDeRecette(admin as never)
  const poses = new Map(Object.entries(globaux) as Array<[string, StatutRecette]>)
  const out = {} as Record<Competence, StatutRecette>
  for (const c of COMPETENCES) {
    out[c] = poses.get(c) ?? (deposees.has(c) ? 'mesuree_silencieusement' : 'differee')
  }
  return out
}

/**
 * « Ce que ce type mesure », aux crans que `exercices_routes` ne porte pas.
 * `exercices_types_crans.couverture_observables` déclare, par cran, ce que le
 * cran couvre — `isole` / `exerce` (`02-` §2.3.2) — pour chaque observable de
 * chaque compétence que l'objet mesure.
 */
/**
 * « Ce que ce type mesure » au grain de l'observable, quand la doctrine le porte.
 *
 * La forme est celle que la dérivation verse — relue EN BASE, pas devinée :
 * `{ source, valeur: 'isole' | 'exerce', observables: [{ nom, code, mode, competence }] }`.
 *
 * ⚠️ Au 21/08, cette colonne est VIDE aux trois crans de production : « les trois
 *    crans de production, QUE LES TABLES NE PEUVENT PAS PORTER » (`04-` §0 et
 *    §14). Le professeur est en train d'y remédier — les six fiches portent
 *    depuis ce matin une ligne `<!-- PRODUCTION exerce=… -->` à leur §6, et
 *    `scripts/derive-doctrine.py` 1.1 la lit. Ce lot lit donc LES DEUX ÉTATS :
 *    la couverture si elle est là, le patron de consigne sinon.
 */
async function couvertureDuCran(
  admin: Admin, typeId: string, cran: number, modes: readonly string[],
  competences: readonly string[],
): Promise<Array<{ competence: string; observable_nom: string }>> {
  const { data, error } = await admin
    .from('exercices_types_crans').select('couverture_observables')
    // ⚠️ Le numéro, jamais `String(cran)` : `exercices_types_crans.cran` était
    //    la SEULE table de doctrine à le porter en texte, et l'aller-retour de
    //    type disparaît avec la forme unique (C4-L11).
    .eq('type_id', typeId).eq('cran', cran).maybeSingle()
  if (error) {
    console.error(`[chaine] couverture du cran illisible — ${error.code} ${error.message}`)
    return []
  }
  const brut = (data as unknown as { couverture_observables: unknown } | null)?.couverture_observables as
    { observables?: Array<{ nom?: string; mode?: string; competence?: string }> } | null
  const liste = Array.isArray(brut?.observables) ? brut!.observables! : []
  const vus = new Set<string>()
  const out: Array<{ competence: string; observable_nom: string }> = []
  for (const o of liste) {
    if (!o?.competence || !o?.nom) continue
    if (competences.length && !competences.includes(o.competence)) continue
    if (modes.length && o.mode && !modes.includes(o.mode)) continue
    const cle = `${o.competence}|${o.nom}`
    if (vus.has(cle)) continue
    vus.add(cle)
    out.push({ competence: o.competence, observable_nom: o.nom })
  }
  return out
}

async function patronDeProduction(
  admin: Admin, modes: readonly string[], cran: number,
): Promise<string | null> {
  if (!modes.length) return null
  const { data, error } = await admin
    .from('exercices_consignes_production').select('mode, patron')
    .eq('cran', cran).in('mode', modes)
  if (error) {
    console.error(`[chaine] patron de production illisible — ${error.code} ${error.message}`)
    return null
  }
  const lignes = (data ?? []) as unknown as Array<{ mode: string; patron: string }>
  if (!lignes.length) return null
  return lignes.map((l) => `${l.mode} : ${l.patron}`).join(' · ')
}

/**
 * ⭐ L'ÉTALON DU CAS, aux TROIS CRANS DE PRODUCTION et nulle part ailleurs.
 *
 * ⛔ **C'est le CRAN qui décide, pas la présence du champ.** La table des crans
 *    déclare `reponse_attendue` présente à SEPT crans sur neuf (`02-` 6.0
 *    §2.2) — mais aux quatre qui isolent, elle est LA réponse, servie comme
 *    candidat à l'écran. La servir au correcteur comme un « modèle » l'y ferait
 *    lire de travers. D'où le filtre en dur sur 2, 6 et 8.
 *
 * ⚠️ Un cran de production ne porte qu'UN cas (`ordre = 1`) : le régime `plein`
 *    n'a pas de paire. Le cran 7 non plus — son geste est `transformer`, et la
 *    paire n'existe qu'au diagnostic. On prend le premier et on ne suppose
 *    rien de plus.
 */
async function etalonDeProduction(
  admin: Admin, exerciceId: string, cran: number | null,
): Promise<string | null> {
  if (cran === null || !CRANS_A_ETALON.has(cran)) return null
  const { data, error } = await admin
    .from('exercices_cas').select('reponse_attendue')
    .eq('exercice_id', exerciceId).order('ordre').limit(1)
  if (error) {
    // ⚠️ supabase-js NE LÈVE PAS : sans cette branche, l'erreur passerait pour
    //    une absence d'étalon, et le modèle jugerait sans repère en silence.
    console.error(`[chaine] étalon illisible — ${error.code} ${error.message}`)
    return null
  }
  const r = (data ?? [])[0]?.reponse_attendue
  return typeof r === 'string' && r.trim() !== '' ? r.trim() : null
}


/** Le texte saisi d'abord, la transcription CORRIGÉE ensuite — jamais les deux. */
function production(texte: unknown, transcription: unknown): string | null {
  const t = typeof texte === 'string' && texte.trim() !== '' ? texte : null
  if (t) return t
  const tr = typeof transcription === 'string' && transcription.trim() !== '' ? transcription : null
  return tr
}

/**
 * ⭐ LE MATÉRIAU ET L'ATTENDU DE CHAQUE CAS — pour le retour chaud, et lui seul.
 *
 * ⚠️ AUCUN FILTRE PAR CRAN, et c'est délibéré. On sert CE QUE LE CAS PORTE : un
 *    cran de production n'a pas de matériau et rend `null`, un cas sans réponse
 *    déclarée rend `null`. *Un filtre en dur aurait fabriqué un troisième
 *    domicile de la table des crans, qui divergerait au premier amendement — et
 *    le `02-` §2.2 en a reçu un le 31/08 même.*
 *
 * ⛔ `version_corrigee` N'EST PAS SÉLECTIONNÉE. Elle est la réponse aux crans 3
 *    et 5 (`02-` §2.3.4), et ce qu'on sert ici est ce que l'élève AVAIT SOUS LES
 *    YEUX. Ne pas la lire est plus sûr que la lire et l'écarter.
 *
 * ⚠️ Erreur de lecture → tableau VIDE, jamais une exception : le retour se sert
 *    sans matériau comme il le faisait hier, et la trace le dit. *supabase-js ne
 *    lève pas ; sans cette branche, une lecture ratée passerait pour un exercice
 *    sans matériau.*
 */
async function casPourLeRetour(
  admin: Admin, exerciceId: string,
): Promise<CasServiAuRetour[]> {
  const { data, error } = await admin
    .from('exercices_cas')
    .select('ordre, reponse_attendue, exercices_materiaux(contenu)')
    .eq('exercice_id', exerciceId).order('ordre')
  if (error) {
    console.error(`[chaine] cas du retour illisibles — exercice ${exerciceId} : `
      + `${error.code} ${error.message}. Le retour se sert sans matériau.`)
    return []
  }
  const texte = (v: unknown): string | null =>
    (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
  return ((data ?? []) as unknown as Array<{
    ordre: number; reponse_attendue: unknown; exercices_materiaux: unknown
  }>).map((c) => {
    // La jointure rend un objet ou un tableau d'un élément selon la forme de la
    // clé — le patron du dépôt (`vue.ts`, `ratissage-serveur.ts`) lit les deux.
    const m = Array.isArray(c.exercices_materiaux)
      ? c.exercices_materiaux[0] : c.exercices_materiaux
    return {
      ordre: c.ordre,
      materiau: texte((m as { contenu?: unknown } | null)?.contenu),
      reponseAttendue: texte(c.reponse_attendue),
    }
  })
}
