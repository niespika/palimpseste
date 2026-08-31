import 'server-only'
// ============================================================================
// C4 · L3 — LE DÉPÔT DE LA MAISON : ce qu'on en lit, et ce qu'on y écrit.
// ----------------------------------------------------------------------------
// « LA LIGNE D'`exercices_depots` EXISTE DÈS L'ASSIGNATION — le déroulé la fait
//   AVANCER, il ne la crée pas » (`07-` §1.1). Ce module n'insère jamais un
//   dépôt : il lit, il horodate, il fait passer le statut.
//
// LE FIL DU STATUT : `assigne` → `ouvert` → `v1_remis` → `retour_publie` →
// `vf_remis` → `clos`, plus **`abandonne`** *(exclu des règles de stagnation)*
// et **`retire`**. ⚠️ « Aux crans SANS version finale, le déroulé SE CLÔT AU
// RETOUR — **ne force pas un `vf_remis` qui n'existe pas** » (piège 44).
//
// ⭐ LE FILTRE `statut != 'retire'` N'EXISTE NULLE PART — ON LE POSE ICI
//    (piège 41). « `retire` est une décision du PROFESSEUR, `abandonne` un
//    NON-GESTE de l'élève » (`07-` §1.1) : un dépôt retiré **ne se présente
//    plus à l'élève**, et l'assiduité les traite différemment.
//
// ⚠️⚠️ LE PIÈGE QUI A DÉJÀ COÛTÉ UNE DÉFAILLANCE FORTE — LES RETOURS À LA LIGNE.
//    « La soumission d'un formulaire HTML NORMALISE la valeur d'un `<textarea>`
//    en CRLF » : `blocs()` cherche `\n[ \t]*\n`, et `\r\n\r\n` ne matche pas —
//    une copie de quatre paragraphes se lit alors comme **UN SEUL BLOC**, donc
//    « dépourvue d'architecture », **défaillance forte** (`07-` §3 ;
//    `competences/structure.md` §8). *Ni la recette ni les tests Node, qui
//    envoient des `\n`, ne le voient.* Le correctif est celui de C4-L4 et on le
//    RÉUTILISE : `normaliserRetours` avant toute écriture, et **JAMAIS de
//    `trim()` sur le texte stocké** — le `trim()` ne sert qu'à tester le vide.
//    Les trois tueurs silencieux sont nommés au piège 24 : un `trim`, une
//    normalisation d'espaces, une sérialisation qui écrase les `\n`.
//
// ⚠️ À LA MAISON, **le texte saisi, jamais les photos** (piège 45) : `photos[]`,
//    la transcription et les doutes servent le canal classe.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { atelierDUnFormatif, type Atelier } from '../codex-onglets/regles'
import { normaliserRetours, blocs } from '../passation/transcription-calcul'
import { lireLesCollages, type CollageBloque } from '../passation/collage'
import { lireTelemetrie, aVerser } from './telemetrie'
import type { TelemetrieSaisie, Version } from './types'

type Admin = ReturnType<typeof createAdminClient>

export interface Issue<T> { ok: boolean; message: string; valeur?: T }
export const ok = <T>(valeur: T, message = ''): Issue<T> => ({ ok: true, message, valeur })
export const refus = (message: string): Issue<never> => ({ ok: false, message })

/** Le dépôt tel que le déroulé maison le lit. */
export interface DepotMaison {
  id: string
  eleve_id: string
  exercice_id: string
  statut: string
  echeance: string | null
  texte_v1: string | null
  texte_vf: string | null
  confiance_declaree: Record<string, string> | null
  conditions_declarees: unknown
  restitution_a_chaud: string | null
  motif_depassement: string | null
  ouvert_at: string | null
  v1_remis_at: string | null
  vf_remis_at: string | null
  juger_debut_at: string | null
  juger_fin_at: string | null
  duree_taguee: string | null
  collages_bloques: CollageBloque[] | null
  saisie_telemetrie: unknown
  aide_consommee: number
  routeur_decision_id: string | null
  exercice: {
    id: string
    lieu: string
    classe_id: string | null
    type_id: string
    consigne_instanciee: unknown
    /** Le NUMÉRO du cran, en base depuis C4-L11 (`utils/cran.ts`) — NULL sur un
     *  examen diagnostique, qui n'en porte aucun. Le type reste large : une
     *  instance d'avant la conversion doit continuer de traverser l'écran. */
    cran: string | number | null
    /** `07-` §1.1 — « la compétence qui commande le retour ». NULLABLE. */
    cible_primaire: string | null
    genre: string | null
    paire_diagnostic: boolean
    guide: string | null
    statut: string
    observable_isole_code: string | null
    observable_isole_competence: string | null
    materiau_source_sujet_id: string | null
    materiau_source_texte_id: string | null
    materiau_cible_sujet_id: string | null
    materiau_cible_texte_id: string | null
    /**
     * ⭐ C5-L2 — LES MODES ÉLUS, PAR COMPÉTENCE. C'est le seul opérande de
     * `atelierDUnFormatif`, et donc de la borne d'atelier ci-dessous.
     */
    modes_par_competence: Record<string, string[]> | null
  }
}

const CHAMPS =
  'id, eleve_id, exercice_id, statut, echeance, texte_v1, texte_vf, '
  + 'confiance_declaree, conditions_declarees, restitution_a_chaud, motif_depassement, '
  + 'ouvert_at, v1_remis_at, vf_remis_at, juger_debut_at, juger_fin_at, duree_taguee, '
  + 'collages_bloques, saisie_telemetrie, aide_consommee, routeur_decision_id, '
  + 'exercice:exercices!inner(id, lieu, classe_id, type_id, consigne_instanciee, cran, genre, '
  // ⭐⭐ **`cible_primaire` EST DANS CE SELECT DEPUIS C4-L11, ET C'EST LE POINT.**
  //    Le `07-` §1.1 la nomme sur l'instance — « la compétence qui commande le
  //    retour » —, et elle existe désormais en base (nullable : « sur la voie du
  //    routeur elle reste NULL »). ⚠️ L'OUBLIER ICI ÉTAIT LE PIÈGE : c'est un
  //    `select` EXPLICITE, et la colonne aurait existé **sans jamais descendre
  //    jusqu'à la chaîne** — un correctif qui n'aurait rien corrigé, en silence.
  //    ⚠️ Et la garde d'avant vaut toujours dans l'autre sens : sélectionner une
  //    colonne absente fait échouer la requête ENTIÈRE (`42703`), donc rendre
  //    `null` — l'écran du déroulé serait mort pour tous les élèves, sans autre
  //    symptôme qu'un « exercice introuvable ». Le code est donc passé APRÈS le
  //    SQL sur ce point précis, et le protocole du `SUIVI_SQL.md` le dit.
  + 'cible_primaire, paire_diagnostic, guide, statut, observable_isole_code, '
  + 'observable_isole_competence, materiau_source_sujet_id, materiau_source_texte_id, '
  // ⭐ C5-L2 — `modes_par_competence` entre ici, et pour une seule raison :
  //    BORNER LES DEUX PORTES L'UNE PAR L'AUTRE. Sans elle, l'atelier serait un
  //    attribut d'URL. ⚠️ La garde de C4-L11 vaut toujours dans l'autre sens :
  //    une colonne absente ferait échouer la requête ENTIÈRE (`42703`), donc
  //    « exercice introuvable » pour tous les élèves — la colonne a été
  //    constatée en bac à sable ET en prod avant d'entrer dans ce `select`.
  + 'modes_par_competence, materiau_cible_sujet_id, materiau_cible_texte_id)'

function normaliser(brut: unknown): DepotMaison | null {
  if (!brut || typeof brut !== 'object') return null
  const d = brut as Record<string, unknown>
  const ex = Array.isArray(d.exercice) ? d.exercice[0] : d.exercice
  if (!ex || typeof ex !== 'object') return null
  return { ...(d as unknown as DepotMaison), exercice: ex as DepotMaison['exercice'] }
}

/**
 * ⭐ LE DÉPÔT, ET LES TROIS GARDES QUI LE BORNENT.
 *   1. il est À CET ÉLÈVE — le client admin contourne la RLS, et il n'y a
 *      AUCUNE policy élève sur ces tables : sans ce filtre, connaître un
 *      identifiant suffirait à lire la copie d'un autre ;
 *   2. son exercice est à la MAISON — le déroulé en six temps n'est pas celui
 *      d'une passation en classe (`06-` §2) ;
 *   3. il n'est pas `retire` (piège 41).
 *
 * ⭐⭐ C5-L2 — ET UNE QUATRIÈME, FACULTATIVE : L'ATELIER.
 *
 *   4. quand l'appelant en nomme un, l'instance en relève — *« tout exercice qui
 *      a demandé une production se consulte dans son atelier : **Codex s'il
 *      porte `composer`, Aletheia sinon** »* (`01-` §2), c'est-à-dire
 *      `atelierDUnFormatif`, la fonction que C4-L6 a écrite et testée.
 *
 * ⚠️⚠️ **AVANT CE LOT, ELLE NE REGARDAIT JAMAIS L'ATELIER**, et la conséquence
 *    était vérifiable : `/eleve/modules/codex/exercice/<id>` **servait un dépôt
 *    de LECTURE** à qui connaissait son identifiant. Deux ateliers, deux portes,
 *    **un seul prédicat, appliqué des deux côtés** — sans quoi le module devient
 *    un attribut d'URL, quand le `01-` §2 en fait « une couleur et une voix ».
 *
 * ⚠️ **ELLE EST FACULTATIVE, ET CE N'EST PAS UN RELÂCHEMENT.** `app/deroule/actions.ts`
 *    porte « le jeu d'actions **PARTAGÉ par les écrans du déroulé, où qu'ils
 *    vivent** » : une action ne sait pas — et n'a pas à savoir — depuis quel
 *    atelier elle est appelée. Ce qui la garde est la propriété du dépôt, qui
 *    est la garde 1. **La borne d'atelier est une règle de RANGEMENT, pas
 *    d'accès** : elle appartient aux deux ROUTES, et à elles seules.
 *
 * ⚠️ Le refus reste indistinct à l'écran — « introuvable » ne dit pas lequel des
 *    quatre —, mais il se DIT au serveur : un dépôt qui n'apparaît nulle part
 *    n'a pas à être un mystère pour le professeur.
 */
export async function lireDepotMaison(
  admin: Admin, depotId: string, eleveId: string,
  options: { atelier?: Atelier } = {},
): Promise<DepotMaison | null> {
  const { data, error } = await admin
    .from('exercices_depots').select(CHAMPS)
    .eq('id', depotId)
    .eq('eleve_id', eleveId)
    // ⭐ Le filtre que personne ne posait. Un dépôt RETIRÉ ne se présente plus.
    .neq('statut', 'retire')
    .maybeSingle()
  if (error) {
    console.error(`[deroule] dépôt illisible ${depotId} — ${error.code} ${error.message}`)
    return null
  }
  const d = normaliser(data)
  if (!d) return null
  if (d.exercice.lieu !== 'maison') {
    console.warn(`[deroule] dépôt ${depotId} refusé : lieu « ${d.exercice.lieu} ». `
      + 'Le déroulé en six temps est celui de la MAISON ; une passation en classe a son '
      + 'flux propre (C4-L4).')
    return null
  }
  if (options.atelier) {
    const atelier = atelierDUnFormatif(d.exercice.modes_par_competence)
    if (atelier !== options.atelier) {
      console.warn(`[deroule] dépôt ${depotId} refusé à la porte « ${options.atelier} » : `
        + `son instance relève de « ${atelier} » (\`01-\` §2 — Codex s'il porte \`composer\`, `
        + 'Aletheia sinon). L’élève le trouve sous l’autre atelier.')
      return null
    }
  }
  return d
}

/**
 * L'OUVERTURE. À la maison, **c'est l'élève qui ouvre** — il n'y a pas
 * d'ouverture manuelle par le professeur (celle-là, `ouvert_par_prof_at`, est
 * du canal classe). Idempotente : `ouvert_at` ne se réécrit jamais, sans quoi
 * le chronomètre ouverture → dépôt repartirait à chaque visite et la durée
 * mesurée ne vaudrait plus rien (`01-` §11, point 7).
 */
export async function ouvrirLeDepot(
  admin: Admin, depot: DepotMaison, maintenant: string,
): Promise<Issue<{ deja: boolean }>> {
  if (depot.ouvert_at) return ok({ deja: true })
  if (depot.statut !== 'assigne') return ok({ deja: true })
  const { error } = await admin.from('exercices_depots')
    .update({ statut: 'ouvert', ouvert_at: maintenant, updated_at: maintenant })
    .eq('id', depot.id)
    // Compare-and-set : deux onglets ouverts en même temps n'écrivent qu'une fois.
    .eq('statut', 'assigne')
  if (error) return refus(`L'ouverture a échoué : ${error.message}`)
  return ok({ deja: false })
}

/**
 * L'ENREGISTREMENT DU BROUILLON — sans valider, sans horodater la remise.
 *
 * ⚠️ `normaliserRetours` D'ABORD, et **aucun `trim()`** : voir l'en-tête. Le
 *    seul nettoyage permis est le retrait des retours à la ligne DE FIN, qui
 *    n'enlève aucun bloc (patron de `utils/passation/depots.ts`).
 */
export async function enregistrerLeTexte(
  admin: Admin, depot: DepotMaison, version: Version, texte: string,
  telemetrie: TelemetrieSaisie | null, maintenant: string,
): Promise<Issue<{ blocs: number }>> {
  if (version === 'v1' && depot.v1_remis_at) return refus('Ta v1 est déjà remise.')
  if (version === 'vf' && depot.vf_remis_at) return refus('Ta version finale est déjà remise.')

  const propre = normaliserRetours(texte).replace(/\n+$/, '')
  const champ = version === 'v1' ? 'texte_v1' : 'texte_vf'

  const maj: Record<string, unknown> = { [champ]: propre, updated_at: maintenant }
  if (telemetrie) maj.saisie_telemetrie = fusionnerEnBase(depot, version, telemetrie)

  const { error } = await admin.from('exercices_depots').update(maj).eq('id', depot.id)
  if (error) return refus(`L'enregistrement a échoué : ${error.message}`)
  return ok({ blocs: blocs(propre).length })
}

/**
 * La télémétrie du faisceau se FUSIONNE, elle ne s'écrase pas : une reprise
 * après rechargement ne doit pas repartir de zéro, sinon le nombre de sessions
 * — qui EST l'un des signaux — vaudrait toujours 1.
 */
function fusionnerEnBase(
  depot: DepotMaison, version: Version, neuf: TelemetrieSaisie,
): Record<string, unknown> {
  const courant = lireTelemetrie(depot.saisie_telemetrie)
  return { ...courant, [version]: aVerser(neuf) }
}

/**
 * ⭐ LA REMISE. Elle horodate, elle fait passer le statut, elle pose le tag de
 * durée. ⚠️ Elle n'appelle RIEN : la mise en file et le déclencheur sont dans
 * `mesure.ts`, et **la restitution à chaud se place AVANT tout envoi à l'IA**
 * (`06-` §3) — c'est l'appelant qui tient cet ordre, et le refus ci-dessous le
 * rend mécanique.
 */
export async function remettre(
  admin: Admin, depot: DepotMaison, version: Version,
  a: {
    texte: string; tagDuree: string | null; telemetrie: TelemetrieSaisie | null
    /**
     * ⭐ La désignation couvrait le matériau (`02-` §5) — l'exercice est NON
     * FAIT. ⚠️ **Le statut porte l'ÉTAT, jamais la CAUSE** : le ratissage vit
     * au signalement d'intégrité, que l'appelant pose.
     */
    ratissage?: boolean
  },
  maintenant: string,
): Promise<Issue<{ statut: string; blocs: number }>> {
  const propre = normaliserRetours(a.texte).replace(/\n+$/, '')
  if (propre.trim() === '') return refus('Ta copie est vide.')

  if (version === 'v1') {
    if (depot.v1_remis_at) return refus('Tu as déjà remis ta v1.')
    // ⚠️ L'ORDRE ABSOLU DE LA FIN DE V1 (`02-` §2.3.1 c ; `06-` §3) : les trois
    //    gestes de la remise se font AU DÉPÔT et AVANT le retour. La
    //    restitution à chaud, en particulier, se place « AVANT TOUT ENVOI À
    //    L'IA » — un jugement porté après le retour ne mesure plus l'élève, il
    //    mesure le retour.
    if (!depot.restitution_a_chaud) {
      return refus('La restitution à chaud se fait avant la remise — c’est elle qui doit '
        + 'partir avant tout envoi à l’IA.')
    }
    if (!depot.conditions_declarees) {
      return refus('Les conditions de travail se déclarent à la remise.')
    }
  } else if (depot.vf_remis_at) {
    return refus('Tu as déjà remis ta version finale.')
  }

  const champ = version === 'v1' ? 'texte_v1' : 'texte_vf'
  const horodatage = version === 'v1' ? 'v1_remis_at' : 'vf_remis_at'
  // ⭐⭐ LE RATISSAGE ÉCRIT SON STATUT ICI, EN UNE SEULE ÉCRITURE (`02-` §5).
  //    « Surligner tout n'est pas une mauvaise réponse : c'est une absence de
  //    réponse » — l'exercice est NON FAIT, et rien ne part au modèle.
  // ⚠️ **Une seule écriture, et c'est la raison de ce paramètre** : passer par
  //    `v1_remis` puis corriger laisserait une fenêtre où le déclencheur de la
  //    chaîne verrait un dépôt à mesurer. *La chaîne est déclenchée juste après
  //    la remise, et elle relit le dépôt : la fenêtre est réelle.*
  // ⛔ Le `v1_remis_at` est POSÉ QUAND MÊME : l'élève a déposé, et l'assiduité
  //    doit distinguer « rendu qui ne compte pas » de « jamais rendu ».
  const statut = version === 'v1'
    ? (a.ratissage ? 'non_fait' : 'v1_remis')
    : 'vf_remis'

  const maj: Record<string, unknown> = {
    [champ]: propre,
    [horodatage]: maintenant,
    statut,
    updated_at: maintenant,
  }
  if (a.tagDuree) maj.duree_taguee = a.tagDuree
  if (a.telemetrie) maj.saisie_telemetrie = fusionnerEnBase(depot, version, a.telemetrie)

  const { error } = await admin.from('exercices_depots')
    .update(maj).eq('id', depot.id).is(horodatage, null)
  if (error) return refus(`La remise a échoué : ${error.message}`)
  return ok({ statut, blocs: blocs(propre).length })
}

/**
 * La MICRO-QUESTION de dépassement (`02-` §2.4). ⚠️ « Jamais notée, jamais
 * renvoyée comme jugement », et `motif_depassement` **reste NULL quand elle n'a
 * pas été déclenchée OU pas répondue** — cette fonction n'est donc appelée que
 * sur une RÉPONSE, et elle n'écrit jamais de valeur par défaut.
 */
export async function repondreALaMicroQuestion(
  admin: Admin, depotId: string, motif: 'pause' | 'difficulte', maintenant: string,
): Promise<Issue<null>> {
  const { error } = await admin.from('exercices_depots')
    .update({ motif_depassement: motif, updated_at: maintenant }).eq('id', depotId)
  if (error) return refus(`La réponse n’a pas été enregistrée : ${error.message}`)
  return ok(null)
}

/**
 * ⭐ LE COMPTEUR D'AIDE. `01-` §11 : « `aide_consommee` : dépliages de la fiche
 * et relectures *(définition provisoire, révisable selon les types)* ».
 * **Décision du PO, 22/08** : ce que compte le déroulé maison, ce sont les
 * dépliages des aides que CET écran sert — la **démonstration** du temps 1 et
 * le **guide** de l'appui — plus les **relectures** du retour. « La fiche » du
 * `01-` §11 est la fiche de compétence dite à l'élève (`06-` §5), qui n'a pas
 * d'écran avant C6-L2.
 *
 * ⚠️ L'incrément est ATOMIQUE côté base ? **Non — et c'est assumé.** Un
 *    lire-modifier-écrire peut perdre un dépliage sur deux clics simultanés.
 *    C'est une TÉLÉMÉTRIE de conception, « définition provisoire », pas un
 *    compteur d'intégrité : perdre une unité ne fausse aucune règle. *Le
 *    journal des collages, lui, est atomique — parce que là on compte des
 *    tentatives, et qu'en perdre une est exactement ce qu'on cherchait à voir.*
 */
// ⭐⭐ `etalon` — item 86, 29/08. Le `02-` 6.0 §2.3.4 : l'étalon des crans de
//    production « se montre à l'élève APRÈS SA VERSION FINALE » — toujours au
//    cran 2, **au cran 6 s'il le déroule, et ce déroulé COMPTE comme une aide**,
//    jamais au cran 8. C'est ce dernier point qui l'inscrit ici : sans entrée
//    dans cette liste, `compterUneAide` refuse, et le déroulé ne se mesurerait
//    pas. ⚠️ Au cran 2 il est servi DÉPLIÉ : rien n'est à compter, l'élève ne l'a
//    pas demandé.
export const AIDES_COMPTEES = ['demonstration', 'guide', 'relecture_retour', 'etalon'] as const
export type AideDepliee = (typeof AIDES_COMPTEES)[number]

export async function compterUneAide(
  admin: Admin, depot: DepotMaison, aide: AideDepliee, maintenant: string,
): Promise<Issue<{ total: number }>> {
  if (!AIDES_COMPTEES.includes(aide)) return refus(`Aide inconnue : ${aide}.`)
  const total = (depot.aide_consommee ?? 0) + 1
  const { error } = await admin.from('exercices_depots')
    .update({ aide_consommee: total, updated_at: maintenant }).eq('id', depot.id)
  if (error) {
    // Best-effort : une télémétrie qui échoue n'interrompt pas l'élève. Mais on
    // la DIT — supabase-js ne lève pas, et un `await` nu l'aurait avalée.
    console.error(`[deroule] aide « ${aide} » NON comptée — dépôt ${depot.id} — `
      + `${error.code} ${error.message}`)
    return refus('Le compteur d’aide n’a pas été mis à jour.')
  }
  return ok({ total })
}

/** Les collages, tels que l'écran du professeur les lira. Lecture seule. */
export function collagesDuDepot(depot: DepotMaison): CollageBloque[] {
  return lireLesCollages(depot.collages_bloques)
}

/**
 * ⭐⭐ LA CLÔTURE D'UN CRAN GUIDÉ — le geste qui manquait, et il ne remet rien.
 *
 * Aux crans 1 et 3, **l'élève ne remet rien** : sa crédence EST sa réponse,
 * l'écran ne sert aucun champ de rédaction, et `remettre()` n'est jamais appelé.
 * Le dépôt restait donc `ouvert` **à jamais** — il entrait au dénominateur de
 * l'assiduité et jamais au numérateur (`utils/deroule/cloture-guidee.ts` porte
 * la mesure et le motif complet).
 *
 * ⭐ LE STATUT EST `clos`, ET PAS `v1_remis`. Rien ne vient derrière : aucun
 *    appel de modèle, aucun retour attendu — « le jugement algorithmique […]
 *    rien ne vient derrière » (`correction.ts`). `clos` compte comme rendu
 *    (`STATUTS_RENDUS`), dit « terminé » à l'élève, et
 *    `utils/passation/depots.ts` l'exclut de tout re-traitement. *Poser
 *    `v1_remis` promettrait un retour qui ne viendra pas, et ferait entrer le
 *    dépôt dans les files qui cherchent des mesures à faire.*
 *
 * ⛔ `v1_remis_at` EST POSÉ QUAND MÊME, et c'est délibéré : c'est l'horodatage
 *    du travail fait, celui que l'assiduité et les écrans lisent. Le même
 *    raisonnement qu'au ratissage, deux fonctions plus haut — « l'assiduité doit
 *    distinguer un rendu qui ne compte pas d'un jamais rendu ».
 *
 * ⚠️ IDEMPOTENTE PAR LA BASE, comme `remettre` : le `.is('v1_remis_at', null)`
 *    est un compare-and-swap. Un double clic sur la dernière crédence n'écrit
 *    qu'une fois, et le second appel rend `dejaClos`.
 */
export async function cloturerLeCranGuide(
  admin: Admin, depotId: string, maintenant: string,
): Promise<Issue<{ dejaClos: boolean }>> {
  const { data, error } = await admin.from('exercices_depots')
    .update({ statut: 'clos', v1_remis_at: maintenant, updated_at: maintenant })
    .eq('id', depotId).is('v1_remis_at', null)
    .select('id')
  if (error) return refus(`La clôture a échoué : ${error.message}`)
  return ok({ dejaClos: (data ?? []).length === 0 })
}
