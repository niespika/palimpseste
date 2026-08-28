import 'server-only'
// ============================================================================
// C4 · L3 — LES TROIS GESTES DE LA REMISE, ET LE QUATRIÈME.
// ----------------------------------------------------------------------------
// « À la remise de la v1, l'élève fait TROIS GESTES COURTS, DANS CET ORDRE :
//   la confiance, les conditions, la restitution » (`06-` §3). Ils coûtent DES
//   SECONDES. **Aucun des trois n'est noté, et aucun ne lui revient comme un
//   jugement.**
//
// ⭐ L'ORDRE ABSOLU DE LA FIN DE V1 (`02-` §2.3.1 c ; `06-` §3) : les deux
//    saisies du Monitoring — « se juger » et la confiance de remise — se font
//    **AU DÉPÔT DE LA V1 ET AVANT QUE L'ÉLÈVE LISE LE RETOUR** : *un jugement
//    porté après le retour ne mesure plus l'élève, il mesure le retour.* Et la
//    **restitution à chaud** se place **AVANT TOUT ENVOI À L'IA**.
//    → Toutes les écritures de ce module REFUSENT après la publication du
//      retour. La règle n'est pas un rappel d'écran : elle est mécanique.
//
// ⭐ À LA MAISON, LES DEUX GESTES SONT **DE DROIT** : « les deux drapeaux
//    d'opt-in de classe sont SANS EFFET quand `lieu` vaut `maison` »
//    (`07-` §1.1 ; `02-` §5) — **l'écran maison ne les lit pas**. Ce module ne
//    lit jamais `optin_se_juger` ni `optin_confiance_remise`, et c'est
//    volontaire : on ne peut pas se tromper sur une colonne qu'on ne lit pas.
//
// ⚠️ LA LUCIDITÉ N'A AUCUN ÉCRAN. **Ne jamais demander à l'élève de signaler ce
//    qu'il n'a pas compris** — aucune consigne, aucun champ, aucun bouton
//    (`02-` §5). `aveu_incomprehension` et `marquage_supposition` sont de la
//    métacognition **spontanée**, relevée par un appel d'extraction propre au
//    Monitoring, **sur la synthèse en classe** (la fiche §4). Rien ici ne les
//    approche, et rien ne doit jamais s'y ajouter.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { CONFIANCES, CONDITIONS, type Competence, type Condition, type Confiance }
  from './types'
import type { ComparaisonObservable, QuestionServie } from './types'
import { refus, ok, type Issue, type DepotMaison } from './depot'

type Admin = ReturnType<typeof createAdminClient>

/** La longueur maximale de la restitution — « TRENTE SECONDES au clavier ». */
export const RESTITUTION_MAX = 400

// ── Geste 1 — LA CONFIANCE DÉCLARÉE ─────────────────────────────────────────

/**
 * « TROIS BOUTONS, OBLIGATOIRES, à la remise de la V1 SEULE — jamais à la vf »
 * (`06-` §3). **Les libellés à l'écran sont LIBRES ; la valeur stockée est
 * celle de l'enum.**
 *
 * ⚠️ **UNE VALEUR PAR COMPÉTENCE `evaluee` MESURÉE, JAMAIS UN SCALAIRE**
 *    (`07-` §1.1) — « une passation en classe en mesure trois ou quatre ».
 * ⚠️ **AUCUNE compétence `evaluee` → LE GESTE NE SE PRÉSENTE PAS**, et le
 *    travail ne produit rien de ce flux (la fiche §6, flux 2).
 * ⚠️ **`non_exprimee` est une valeur d'EXTRACTION, jamais un bouton** — on ne
 *    demande rien à l'élève pour l'obtenir. Elle n'est pas dans `CONFIANCES`.
 */
export function competencesQuiDemandentLaConfiance(
  mesurees: readonly Competence[],
  statutsRecette: Readonly<Record<string, string>>,
): Competence[] {
  return mesurees.filter((c) => statutsRecette[c] === 'evaluee')
}

export async function enregistrerLaConfiance(
  admin: Admin, depot: DepotMaison,
  valeurs: Readonly<Record<string, string>>,
  attendues: readonly Competence[],
  maintenant: string,
): Promise<Issue<null>> {
  if (depot.v1_remis_at) return refus('La confiance se déclare à la remise de la v1.')
  if (attendues.length === 0) {
    return refus('Aucune compétence évaluée n’est mesurée : ce geste ne se présente pas.')
  }
  const propre: Record<string, Confiance> = {}
  for (const c of attendues) {
    const v = valeurs[c]
    if (!CONFIANCES.includes(v as Confiance)) {
      // OBLIGATOIRES : on ne complète pas un manque par un défaut — une valeur
      // par défaut serait une confiance que l'élève n'a pas déclarée, et la
      // garde `indetermine` du Monitoring perdrait son objet.
      return refus(`La confiance manque sur « ${c} », ou n’est pas l’une des trois valeurs.`)
    }
    propre[c] = v as Confiance
  }
  const { error } = await admin.from('exercices_depots')
    .update({ confiance_declaree: propre, updated_at: maintenant }).eq('id', depot.id)
  if (error) return refus(`La confiance n’a pas été enregistrée : ${error.message}`)
  return ok(null)
}

// ── Geste 2 — LES CONDITIONS DE TRAVAIL ─────────────────────────────────────

/**
 * « UN GESTE UNIQUE, TROIS VALEURS » — `temps_mis`, `au_plus_vite`, `pas_pu`
 * (`06-` §3). Il commande **deux choses, et deux seulement** : une mesure
 * déclarée bâclée ne fait jamais monter une lettre ; trois `pas_pu` d'affilée
 * lèvent un drapeau professeur — **jamais un allègement**.
 *
 * ⚠️ **Les deux règles jouent EN AVAL** (`01-` §9 ; C6-L1) : ici, la saisie, et
 *    un stockage qui les rend possibles. Ce module n'en applique aucune.
 * ⚠️ **Il ne se confond pas avec la micro-question de dépassement** : celle-là
 *    porte sur LE TEMPS, celui-ci sur L'EFFORT (`06-` §3).
 */
export async function enregistrerLesConditions(
  admin: Admin, depot: DepotMaison, valeur: string, maintenant: string,
): Promise<Issue<null>> {
  if (depot.v1_remis_at) return refus('Les conditions se déclarent à la remise de la v1.')
  if (!CONDITIONS.includes(valeur as Condition)) {
    return refus('Les conditions de travail ont trois valeurs, et trois seulement.')
  }
  const { error } = await admin.from('exercices_depots').update({
    // Un objet, pour que la date de la déclaration reste lisible : la règle des
    // « trois `pas_pu` D'AFFILÉE » se compte dans l'ordre, et l'ordre se lit.
    conditions_declarees: { valeur, at: maintenant },
    updated_at: maintenant,
  }).eq('id', depot.id)
  if (error) return refus(`Les conditions n’ont pas été enregistrées : ${error.message}`)
  return ok(null)
}

// ── Geste 3 — LA RESTITUTION À CHAUD ────────────────────────────────────────

/**
 * « TRENTE SECONDES AU CLAVIER : *ta thèse en une phrase ?* Elle se place
 * **AVANT TOUT ENVOI À L'IA** » (`06-` §3).
 *
 * Elle sert deux fois : une **valeur pédagogique propre** — dire son propos en
 * une phrase est un exercice à soi seul — et une **incohérence forte avec le
 * squelette est un signal du faisceau** ; **répétée, elle bloque la montée
 * d'une lettre et lève un drapeau** (`01-` §9).
 *
 * ⚠️ **La règle joue EN AVAL** : ici, la saisie et sa place dans l'ordre. Rien
 *    ne se compare ici, et rien ne bloque.
 */
export async function enregistrerLaRestitution(
  admin: Admin, depot: DepotMaison, texte: string, maintenant: string,
): Promise<Issue<null>> {
  if (depot.v1_remis_at) return refus('La restitution se fait avant la remise de la v1.')
  const propre = texte.trim()
  if (propre === '') return refus('Une phrase, même courte : c’est ce qui rend le geste utile.')
  if (propre.length > RESTITUTION_MAX) {
    return refus(`Une phrase — ${RESTITUTION_MAX} caractères au plus.`)
  }
  const { error } = await admin.from('exercices_depots')
    .update({ restitution_a_chaud: propre, updated_at: maintenant }).eq('id', depot.id)
  if (error) return refus(`La restitution n’a pas été enregistrée : ${error.message}`)
  return ok(null)
}

/** L'ordre des trois gestes, et ce qui reste à faire (`06-` §3). */
export function gestesRestants(
  depot: DepotMaison, confianceDemandee: boolean,
): Array<'confiance' | 'conditions' | 'restitution'> {
  const restants: Array<'confiance' | 'conditions' | 'restitution'> = []
  if (confianceDemandee && !depot.confiance_declaree) restants.push('confiance')
  if (!depot.conditions_declarees) restants.push('conditions')
  if (!depot.restitution_a_chaud) restants.push('restitution')
  return restants
}

// ── Le quatrième geste — LA CRÉDENCE ────────────────────────────────────────

/**
 * La crédence se déclare **PENDANT l'exercice, avant que l'élève sache s'il a
 * raison** (`06-` §3). Elle vit sur `exercices_metacognition.credence`, qui est
 * un TABLEAU : « plusieurs valeurs par dépôt — il y en a une par diagnostic,
 * donc DEUX sur une paire » (`07-` §1.2).
 *
 * ⚠️ L'écrasement se fait PAR CAS, jamais en bloc : redéposer la crédence du
 *    cas 2 ne doit pas effacer celle du cas 1, qui a été donnée avant la
 *    correction — c'est **l'écart entre les deux** que le Monitoring lit.
 */
export async function enregistrerLaCredence(
  admin: Admin, depot: DepotMaison, cas: number, valeur: Record<string, unknown>,
  maintenant: string,
): Promise<Issue<null>> {
  if (depot.v1_remis_at) {
    return refus('La crédence se déclare pendant l’exercice, avant de savoir si tu as raison.')
  }
  return fusionnerDansLaCredence(admin, depot, cas, valeur, maintenant,
    (m) => `La crédence n’a pas été enregistrée : ${m}`)
}

/**
 * ⭐⭐ LA FUSION PAR CAS — et c'est une FUSION, plus un remplacement.
 *
 * ⛔⛔ **CE N'EST PAS UNE GÉNÉRALISATION GRATUITE : SANS ELLE, L'ORDRE DES DEUX
 * SAISIES DÉCIDE DE CE QUI SURVIT.** Depuis la désignation (`02-` §5), l'entrée
 * d'un cas se remplit en **deux gestes séparés** — la ZONE que l'élève
 * sélectionne dans le matériau, puis la CRÉDENCE qu'il déclare —, et ils
 * n'arrivent pas dans un ordre garanti : *l'élève peut resserrer sa sélection
 * après avoir donné son pourcentage.* Une écriture qui remplaçait l'entrée
 * faisait alors disparaître l'autre moitié **en silence**, et le Monitoring
 * lisait un `index_correct` sans zone, ou une zone sans crédence.
 *
 * ⚠️ **L'ÉCRASEMENT RESTE PAR CAS, JAMAIS EN BLOC** : redéposer le cas 2
 * n'efface pas le cas 1, qui a été donné AVANT la correction — « c'est l'écart
 * entre les deux que le Monitoring lit ».
 */
async function fusionnerDansLaCredence(
  admin: Admin, depot: DepotMaison, cas: number, apport: Record<string, unknown>,
  maintenant: string, message: (m: string) => string,
): Promise<Issue<null>> {
  const { data } = await admin.from('exercices_metacognition')
    .select('credence').eq('depot_id', depot.id).maybeSingle()
  const courant = Array.isArray(data?.credence) ? (data.credence as unknown[]) : []
  const estCeCas = (c: unknown) =>
    !!c && typeof c === 'object' && (c as Record<string, unknown>).cas === cas
  const ancien = (courant.find(estCeCas) ?? {}) as Record<string, unknown>
  const autres = courant.filter((c) => !estCeCas(c))
  const suite = [...autres, { ...ancien, ...apport, cas }].sort(
    (a, b) => Number((a as Record<string, unknown>).cas ?? 0)
            - Number((b as Record<string, unknown>).cas ?? 0))

  const { error } = await admin.from('exercices_metacognition')
    .upsert({ depot_id: depot.id, credence: suite, updated_at: maintenant },
      { onConflict: 'depot_id' })
  if (error) return refus(message(error.message))
  return ok(null)
}

/**
 * ⭐ LA DÉSIGNATION DANS LE MATÉRIAU (`02-` §5) — la zone que l'élève a
 * sélectionnée, ou **`null` pour « rien à signaler »**.
 *
 * ⛔⛔ **« RIEN À SIGNALER » EST UNE RÉPONSE, PAS UNE ABSENCE DE RÉPONSE**, et
 * c'est pourquoi elle s'écrit : *« les élèves peuvent se sentir obligés de
 * surligner »* — un élève qui ne trouve rien doit pouvoir le DIRE aussi
 * facilement qu'il sélectionne, et le dispositif doit savoir qu'il l'a dit.
 * `zone: null` avec un `zone_at` est donc une saisie ; **pas de `zone_at` du
 * tout** est l'élève qui n'a pas encore répondu. *Les deux se distinguent, et
 * il le faut : sans quoi on ne pourrait pas dire si l'écran a été rempli.*
 *
 * ⚠️ **AUCUNE MIGRATION** : `exercices_metacognition.credence` est un tableau
 * jsonb dont le seul CHECK porte sur le type, et les trois crans qui désignent
 * y écrivent déjà une entrée par cas.
 *
 * ⚠️ **ON N'ÉCRIT QUE DES BORNES.** La cible, elle, ne descend jamais à
 * l'écran : elle se dérive au serveur de la `version_corrigee`, qui EST la
 * réponse aux crans 7 et 9 (`02-` §2.3.4).
 */
export async function enregistrerLaDesignation(
  admin: Admin, depot: DepotMaison, cas: number, zone: readonly [number, number] | null,
  maintenant: string,
): Promise<Issue<null>> {
  if (depot.v1_remis_at) {
    return refus('La désignation se fait pendant l’exercice, avant de remettre.')
  }
  if (zone && (!Number.isInteger(zone[0]) || !Number.isInteger(zone[1]) || zone[1] <= zone[0])) {
    return refus('La sélection n’est pas lisible. Recommence, ou dis qu’il n’y a rien à signaler.')
  }
  return fusionnerDansLaCredence(admin, depot, cas,
    { zone: zone ? [zone[0], zone[1]] : null, zone_at: maintenant }, maintenant,
    (m) => `La désignation n’a pas été enregistrée : ${m}`)
}

// ── Le temps 3 — « SE JUGER » ───────────────────────────────────────────────

/**
 * L'ouverture de la phase : elle est **HORODATÉE** — `juger_debut_at` (§1.1).
 *
 * ⚠️ C4-L4 pose les deux horodatages AU MÊME INSTANT, et la durée mesurée y
 *    vaut donc zéro. À la maison on ouvre à l'affichage et on ferme au dépôt :
 *    la phase « tient en deux ou trois gestes » (`07-` §3), et c'est justement
 *    ce qu'on veut pouvoir constater.
 */
export async function ouvrirSeJuger(
  admin: Admin, depot: DepotMaison, maintenant: string,
): Promise<Issue<null>> {
  if (depot.juger_debut_at) return ok(null)
  const { error } = await admin.from('exercices_depots')
    .update({ juger_debut_at: maintenant, updated_at: maintenant })
    .eq('id', depot.id).is('juger_debut_at', null)
  if (error) return refus(`L’ouverture de la phase a échoué : ${error.message}`)
  return ok(null)
}

/**
 * ⭐ CE QUI S'ÉCRIT DANS `exercices_metacognition` (`07-` §1.2) : les
 * **questions servies et leur version** — `questions_version` **cite la ligne
 * VERSION DE LA FICHE au moment du dépôt** de la correspondance, jamais un
 * numéro inventé —, les **réponses**, la **comparaison au squelette observable
 * par observable**, et la **`calibration`**.
 *
 * ⚠️ **La comparaison est du CODE, jamais le modèle** ; **jamais notée** ; et
 *    **le Monitoring tourne EN DERNIER** (la fiche §2) — ce qui s'écrit ici est
 *    une SAISIE et sa comparaison, pas un verdict de calibration composé.
 */
export async function enregistrerSeJuger(
  admin: Admin, depot: DepotMaison,
  a: {
    questions: readonly QuestionServie[]
    version: string | null
    reponses: Readonly<Record<string, string>>
    comparaison: readonly ComparaisonObservable[]
    /** `indetermine`, ou `null` quand aucune garde ne se déclenche. */
    calibration: string | null
    tirage: unknown
  },
  maintenant: string,
): Promise<Issue<null>> {
  if (depot.v1_remis_at && depot.statut === 'retour_publie') {
    return refus('« Se juger » se fait avant de lire le retour — un jugement porté après le '
      + 'retour ne te mesure plus, il mesure le retour.')
  }
  const { error } = await admin.from('exercices_metacognition').upsert({
    depot_id: depot.id,
    questions_servies: { questions: a.questions, tirage: a.tirage },
    questions_version: a.version,
    reponses: a.reponses,
    comparaison_squelette: a.comparaison,
    calibration: a.calibration,
    updated_at: maintenant,
  }, { onConflict: 'depot_id' })
  if (error) return refus(`« Se juger » n’a pas été enregistré : ${error.message}`)

  const { error: e2 } = await admin.from('exercices_depots')
    .update({ juger_fin_at: maintenant, updated_at: maintenant }).eq('id', depot.id)
  if (e2) {
    console.error(`[deroule] juger_fin_at NON posé — dépôt ${depot.id} — ${e2.code} ${e2.message}`)
  }
  return ok(null)
}
