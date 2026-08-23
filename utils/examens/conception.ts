import 'server-only'
// ============================================================================
// C4 · L9 — L'ÉCRAN DE CONCEPTION : UN SEUL CHARGEUR, UN SEUL GESTE, DEUX
//            ENTRÉES.
// ----------------------------------------------------------------------------
// « Dans CODEX le professeur choisit un ÉNONCÉ DE SUJET, dans ALETHEIA un
//   TEXTE ; il valide, l'instance naît avec `lieu = classe`, et la ligne de plan
//   passe *conçue*. »                                         — `07-` §2, C4-L9
//
// ⭐ C'EST LE SEUL ÉCART ENTRE LES DEUX ÉCRANS — le reste est commun, et il doit
//    l'être : un seul chargeur, un seul composant, deux entrées. (La leçon de
//    C4-L4, qui a construit les deux passations d'un coup.)
//
// ⚠️ LA DOCTRINE N'EST D'AUCUN SECOURS ICI, ET C'EST LA MISSION. Un examen
//    diagnostique n'est pas un objet à un cran, c'est une COPIE ENTIÈRE : « macro
//    par construction », « imposé en classe, HORS ROUTAGE », et « la table des
//    proportions ne le gouverne pas » (`01-` §10). Rien ici ne dérive de
//    `exercices_routes`, ni de la banque de consignes objet × mode × cran, ni
//    des `crans[]`. `app/prof/conception/nouvelle/Pipeline.tsx` est le patron du
//    FORMATIF — ce n'est pas le nôtre, et on ne l'étend pas pour y faire entrer
//    une nature qu'il ne connaît pas.
//
// ⚠️ L'ÉCRAN NE DEMANDE JAMAIS DE DATE, ni ne la propose, ni ne la corrige. La
//    ligne de plan la porte déjà, et « la cadence d'ancre est un objectif du
//    plan d'évaluation, QUI APPARTIENT AU PROFESSEUR » (`01-` §9). Si une date
//    manque, c'est au plan qu'on la pose — pas ici.
//
// ⚠️ AUCUN APPEL DE MODÈLE : « aucun appel de modèle à la conception » (`07-`
//    §2, C4-L8). Aucune clé d'API, aucune ligne à `api_couts` ne sort d'ici.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { dateEffectiveSemaine } from '@/utils/plan-cadence'
import {
  CODE_TYPE, INTITULE, MATIERE, MODES_MESURES, moduleDuType, type ModuleExamen,
} from './types'
import { consigneANoter, consigneDepuisLeSujet, consigneDepuisLeTexte, enTete } from './consigne'
import {
  SELECT_REFERENCE_VALIDEE, motifDeRefusDeLaReference,
} from '@/utils/reference-validee'

type Admin = SupabaseClient
type Ligne = Record<string, unknown>

const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}

export interface Refus { ok: false; message: string; empechements?: string[] }
export interface Succes<T> { ok: true; data: T }
export type Issue<T> = Succes<T> | Refus
const refus = (message: string, empechements?: string[]): Refus =>
  ({ ok: false, message, ...(empechements ? { empechements } : {}) })
const ok = <T>(data: T): Succes<T> => ({ ok: true, data })

/** Un matériau offert au choix — avec, s'il y en a un, LE MOTIF de son refus. */
export interface ChoixMatiere {
  id: string
  libelle: string
  detail: string | null
  /** null = servable. Sinon le motif, et **il nomme la référence** (piège 21). */
  refus: string | null
  /** La consigne de DÉPART pour ce matériau — le professeur l'arrête à l'écran. */
  consigne: string
}

export interface EcranConception {
  planifieId: string
  module: ModuleExamen
  intitule: string
  classeId: string
  classeNom: string
  /** Le parcours de la classe. NULL = non déclaré → on AVERTIT, on ne bloque pas. */
  parcoursClasse: string | null
  fenetre: string | null
  /** La date, LUE à la ligne de plan. Jamais demandée, jamais corrigée ici. */
  echeance: string
  enRetard: boolean
  /** Ce qui empêche de concevoir, quand quelque chose empêche. */
  empechement: string | null
  /** L'instance déjà conçue sur cette ligne, s'il y en a une (lecture inverse). */
  exerciceId: string | null
  matiere: 'sujet' | 'texte'
  choix: ChoixMatiere[]
  /** Une lecture ratée n'est pas une liste vide : l'écran montre l'incident. */
  incidents: string[]
}

/**
 * Ce que l'écran de conception lit — pour les DEUX modules.
 *
 * ⚠️ Il ne garde rien : la garde d'accès est `garderProf` (`utils/fabrique/`),
 *    et l'interrupteur `fabrique_actif` se MONTRE, il ne ferme pas — « la
 *    fabrique doit marcher pendant que les interrupteurs sont à OFF ».
 */
export async function chargerConception(
  admin: Admin, planifieId: string,
): Promise<EcranConception | null> {
  const { data: ligneBrute, error: eLigne } = await admin
    .from('scriptorium_exercices_planifies')
    .select('id, plan_id, type_exercice, diagnostique, statut, lieu, semaine_lundi, '
      + 'jour_prevu, fenetre_diagnostique, supprime_at')
    .eq('id', planifieId).maybeSingle()
  if (eLigne || !ligneBrute) return null
  const l = ligneBrute as unknown as Ligne

  // `mod` et non `module` : Next.js interdit d'assigner cet identifiant.
  const mod = moduleDuType(txt(l.type_exercice))
  if (!mod || l.diagnostique !== true) return null

  const { data: plan } = await admin
    .from('scriptorium_plans_evaluation').select('classe_id').eq('id', txt(l.plan_id)).maybeSingle()
  const classeId = txt(lig(plan).classe_id)
  const { data: classe } = await admin
    .from('classes').select('nom, type_pedagogique').eq('id', classeId).maybeSingle()

  const echeance = dateEffectiveSemaine(
    txt(l.semaine_lundi), (l.jour_prevu as string | null) ?? null, l.lieu as 'classe' | 'maison')

  // La lecture INVERSE — de la ligne de plan vers son instance (piège 9).
  const { data: dejaLa } = await admin
    .from('exercices').select('id').eq('exercice_planifie_id', planifieId).maybeSingle()

  const empechement = motifDEmpechement(l, txt(lig(dejaLa).id) || null)
  const { choix, incidents } = await lireLaMatiere(admin, mod)

  return {
    planifieId,
    module: mod,
    intitule: INTITULE[mod],
    classeId,
    classeNom: txt(lig(classe).nom),
    parcoursClasse: txt(lig(classe).type_pedagogique) || null,
    fenetre: (l.fenetre_diagnostique as string | null) ?? null,
    echeance,
    enRetard: echeance < new Date().toISOString().slice(0, 10),
    empechement,
    exerciceId: txt(lig(dejaLa).id) || null,
    matiere: MATIERE[mod],
    choix,
    incidents,
  }
}

/** Ce qui empêche de concevoir cette ligne — dit une fois, au même endroit. */
function motifDEmpechement(l: Ligne, exerciceId: string | null): string | null {
  if (l.supprime_at != null) {
    return 'Cette ligne de plan a été retirée : elle ne se conçoit plus.'
  }
  // « Ne ressuscite JAMAIS un exercice `annule` » (`utils/plan-exercices.ts`).
  if (txt(l.statut) === 'annule') {
    return 'Cette ligne de plan est annulée : elle ne se conçoit plus, et elle ne se ressuscite pas.'
  }
  if (exerciceId) {
    return 'Cette ligne de plan porte déjà son instance : une ligne de plan ⇔ au plus une instance.'
  }
  if (txt(l.statut) !== 'a_concevoir') {
    return `Cette ligne de plan est au statut « ${txt(l.statut)} » : seule une ligne `
      + '« à concevoir » appelle une conception.'
  }
  return null
}

/**
 * Le matériau offert — et **les refusables y sont aussi, avec leur motif**.
 *
 * ⚠️ ON NE LES CACHE PAS, et c'est une décision. « Un texte dont la
 *    `reference_decomposee` n'est pas validée est REFUSÉ, ET LE MOTIF NOMME LA
 *    RÉFÉRENCE » (`07-` §2 ; `02-` §6 A) : un texte simplement absent de la
 *    liste laisserait le professeur chercher pourquoi. Il le voit, il lit le
 *    motif, et il va valider sa référence (`/prof/conception/reference/{id}`).
 */
async function lireLaMatiere(
  admin: Admin, module: ModuleExamen,
): Promise<{ choix: ChoixMatiere[]; incidents: string[] }> {
  const incidents: string[] = []
  const intitule = INTITULE[module]

  if (MATIERE[module] === 'sujet') {
    // ⚠️ La PLAGE ADMISE du type borne les sujets offerts — `genres_admis`
    //    (`02-` §1.3). Elle ne descend PAS sur l'instance : `exercices.genre`
    //    est l'ÉLECTION, et elle ne vaut que pour les trois objets terminaux.
    const { data: type } = await admin
      .from('exercices_types').select('genres_admis').eq('code', CODE_TYPE[module]).maybeSingle()
    const plage = (lig(type).genres_admis as string[] | null) ?? []
    if (plage.length === 0) {
      incidents.push('Le type `' + CODE_TYPE[module] + '` ne déclare aucun `genres_admis` : '
        + 'la migration `c4_l9_examens_diagnostiques.sql` n’est pas jouée sur cette base.')
      return { choix: [], incidents }
    }
    const { data, error } = await admin
      .from('exercices_sujets').select('id, enonce, forme, statut, bloque')
      .in('forme', plage).neq('statut', 'retire').order('enonce')
    if (error) {
      incidents.push(`Les sujets n’ont pas pu être lus : ${error.message}`)
      return { choix: [], incidents }
    }
    const choix = ((data ?? []) as unknown as Ligne[]).map((s): ChoixMatiere => ({
      id: txt(s.id),
      libelle: txt(s.enonce),
      detail: txt(s.forme),
      refus: s.bloque === true
        ? 'Ce sujet est bloqué en file de validation : il ne sert aucune instance.'
        : null,
      consigne: consigneDepuisLeSujet(intitule, txt(s.enonce)),
    }))
    return { choix, incidents }
  }

  // ── Aletheia : un TEXTE, et sa référence décomposée doit être VALIDÉE ──────
  const { data, error } = await admin
    .from('exercices_textes')
    .select('id, auteur, titre, reference, statut, bloque, '
      + `${SELECT_REFERENCE_VALIDEE}, scriptorium_contenus(texte_extrait)`)
    .neq('statut', 'retire').order('auteur')
  if (error) {
    incidents.push(`Les textes n’ont pas pu être lus : ${error.message}`)
    return { choix: [], incidents }
  }
  const choix = ((data ?? []) as unknown as Ligne[]).map((t): ChoixMatiere => {
    const entete = enTete(txt(t.auteur), txt(t.titre), txt(t.reference))
    const contenu = txt(jointure(t, 'scriptorium_contenus').texte_extrait)
    return {
      id: txt(t.id),
      libelle: entete,
      detail: contenu ? `${contenu.trim().slice(0, 90)}…` : null,
      refus: motifDeRefusDuTexte(t),
      consigne: consigneDepuisLeTexte(intitule, entete, contenu),
    }
  })
  return { choix, incidents }
}

/**
 * ⭐ LA GARDE ABSOLUE — « UNE RÉFÉRENCE NON VALIDÉE N'ENTRE JAMAIS EN PHASE 2 »
 *    (`02-` §6 A). Le `07-` §1.1 en fait l'une des DEUX gardes qui portent la
 *    validité de TOUTE LA RÉCEPTION.
 *
 * ⭐ C4-L11 — ELLE N'EST PLUS ÉCRITE ICI. Le prédicat vivait mot pour mot à deux
 *    endroits — ici et `app/prof/conception/actions.ts` (C4-L8) — sur la MÊME
 *    colonne de la MÊME table. Il vit désormais à `utils/reference-validee.ts`,
 *    seul. Ce site garde ce qui lui est propre : il charge une LISTE de textes,
 *    donc il appelle le PRÉDICAT sur des lignes déjà jointes, jamais une requête
 *    par ligne — « la fonction partagée […] ne recopie pas une jointure ».
 */
function motifDeRefusDuTexte(t: Ligne): string | null {
  return motifDeRefusDeLaReference(
    t, enTete(txt(t.auteur), txt(t.titre), txt(t.reference)) || 'ce texte')
}

// ═════════════════════════════════════════════════════════════════════════════
// LE GESTE — l'instance naît, et la ligne de plan passe *conçue*
// ═════════════════════════════════════════════════════════════════════════════

export interface Conçu { exerciceId: string; classeId: string }

/**
 * Concevoir l'examen diagnostique d'une ligne de plan.
 *
 * ⭐ L'ORDRE DES DEUX ÉCRITURES N'EST PAS INDIFFÉRENT, ET IL EST CELUI-CI.
 *    **L'INSERTION DE L'INSTANCE EST LE CLAIM** : `uk_exercices_planifie`
 *    (unique, partiel) fait perdre le SECOND de deux onglets qui conçoivent la
 *    même ligne — sur l'index, **avant** qu'il ait écrit quoi que ce soit. (Le
 *    patron `quiz_id` avait besoin d'un claim-`UPDATE` parce que son lien vivait
 *    du mauvais côté ; celui-ci n'en a pas besoin.)
 *
 * ⭐ PUIS LES DEUX CYCLES SE REJOIGNENT, dans la même transaction logique.
 *    Celui de l'INSTANCE (`exercices.statut` : `a_concevoir → concu → assigne →
 *    clos`) et celui de la LIGNE DE PLAN (`a_concevoir → concu → annule`, avec
 *    `concu_at`) s'ignoraient : `app/prof/conception/` posait `concu` sur
 *    l'instance et s'arrêtait là. Ici les deux se posent ensemble, avec les
 *    DEUX GARDES qu'on oublie séparément :
 *      · `.eq('statut', 'a_concevoir')` — la garde de transition ;
 *      · `.is('supprime_at', null)` — sans elle, le claim RESSUSCITERAIT un
 *        tombstone en `concu`.
 *    Et jamais un `annule` : « ne ressuscite jamais un exercice `annule` ».
 *    Le claim manqué ⇒ **l'instance est retirée** : rien d'incomplet ne reste.
 */
export async function concevoirExamenDiagnostique(
  admin: Admin, planifieId: string, matiereId: string, consigneSaisie: string,
  drapeaux: { seJuger: boolean; confianceRemise: boolean },
): Promise<Issue<Conçu>> {
  const ecran = await chargerConception(admin, planifieId)
  if (!ecran) return refus('Cette ligne de plan n’est pas un examen diagnostique.')
  if (ecran.empechement) return refus(ecran.empechement)

  const choisi = ecran.choix.find((c) => c.id === matiereId)
  if (!choisi) {
    return refus(ecran.matiere === 'sujet'
      ? 'Aucun sujet choisi : dans Codex, l’examen diagnostique se conçoit sur un énoncé de sujet.'
      : 'Aucun texte choisi : dans Aletheia, l’examen diagnostique se conçoit sur un texte.')
  }
  // ⭐ LE REFUS, ET SON MOTIF NOMME LA RÉFÉRENCE.
  if (choisi.refus) {
    return refus(choisi.refus, ['valider la référence avant de concevoir (`02-` §6 A ; `05-` §4)'])
  }

  const consigne = consigneANoter(consigneSaisie || choisi.consigne)
  if (consigne.trim() === '') {
    return refus('La consigne est vide : c’est le texte que l’élève lit, il ne part pas vide.')
  }

  const { data: type } = await admin
    .from('exercices_types').select('id').eq('code', CODE_TYPE[ecran.module]).maybeSingle()
  const typeId = txt(lig(type).id)
  if (!typeId) {
    return refus(`Le type « ${CODE_TYPE[ecran.module]} » est introuvable : la migration `
      + '`c4_l9_examens_diagnostiques.sql` n’est pas jouée sur cette base.')
  }

  // Ce que l'instance porte, et RIEN DE PLUS (piège 23).
  const commun = {
    type_id: typeId,
    exercice_planifie_id: planifieId,
    classe_id: ecran.classeId || null,
    // ⭐ « C'est le `lieu` qui commande, JAMAIS le module » : `ouvrirLesDepots`
    //    refuse une instance dont le `lieu` n'est pas `classe`, et
    //    `chargerVueEleve` refuse un dépôt de maison.
    lieu: 'classe',
    consigne_instanciee: consigne,
    // ⭐ L'ARRÊTÉ DU `01-` §10, recopié — jamais dérivé (`utils/examens/types.ts`).
    modes_par_competence: MODES_MESURES[ecran.module],
    // ⭐ LES DEUX DRAPEAUX D'OPT-IN DE CLASSE, portés par l'INSTANCE, faux par
    //    défaut : sans eux « une passation en classe ne produit AUCUN signal de
    //    Monitoring », et « une année de collecte manquée ne se rattrape pas ».
    optin_se_juger: drapeaux.seJuger,
    optin_confiance_remise: drapeaux.confianceRemise,
    statut: 'concu',
    // ⚠️ CE QUI RESTE VOLONTAIREMENT ABSENT :
    //  · `cran` — le type est `complet`, et un cran faux ferait dériver
    //    `regime_v1vf`, `couverture_observables` et la durée (piège 19) ;
    //  · `genre` — l'élection ne vaut que pour les trois objets terminaux ;
    //  · `paire_diagnostic` — c'est le geste `diagnostiquer` d'un formatif, PAS
    //    l'examen diagnostique. Les deux vocabulaires ne se rencontrent pas ;
    //  · `bonus` — sans objet ;
    //  · `cible_primaire` — ⭐ RELU ET MAINTENU PAR C4-L11. La colonne existe
    //    désormais ; le SECOND motif, lui, tient toujours et il suffit : « un
    //    examen en mesure trois ou quatre ». Le `07-` §1.1 fait poser la cible
    //    « parmi les compétences que son exercice mesure, ET UNE SEULE ; quand
    //    il n'y en a QU'UNE POSSIBLE […] l'écran la pose sans la demander » —
    //    or il y en a trois ou quatre ici, et CET ÉCRAN NE LA DEMANDE PAS. Le
    //    champ va à l'écran de conception de C4-L8, et à lui seul.
    //    ⚠️ CONSÉQUENCE, DITE ET NON MASQUÉE : le retour d'un examen retombe
    //    donc sur le repli alphabétique, et la chaîne le SIGNALE en alerte
    //    (`cibleIndeterminee`). C'est l'état que la source décrit — « imposé en
    //    classe, HORS ROUTAGE » (`01-` §10) —, pas un oubli ;
    //  · `fenetre_debut` / `fenetre_fin` — L'ÉCRAN NE DEMANDE AUCUNE DATE ;
    //  · `borne_amont` — le non-spoiler borne le ROUTEUR (`01-` §4), et un
    //    examen diagnostique est « imposé en classe, HORS ROUTAGE » (`01-` §10).
  }
  const materiau = ecran.matiere === 'sujet'
    ? { materiau_source_provenance: 'sujet', materiau_source_sujet_id: matiereId }
    : {
        materiau_source_provenance: 'texte_auteur',
        // La plus large étendue admise par le type (`supports_source` = `texte`) :
        // il n'y a pas d'explication de texte sans le texte entier.
        materiau_source_support: 'texte',
        materiau_source_texte_id: matiereId,
        reference_id: await referenceDuTexte(admin, matiereId),
      }

  const { data: instance, error: eIns } = await admin
    .from('exercices').insert({ ...commun, ...materiau }).select('id').single()
  if (eIns) {
    // 23505 = violation d'unicité : `uk_exercices_planifie` a fait son office.
    if (eIns.code === '23505') {
      return refus('Une instance vient d’être conçue sur cette ligne de plan : '
        + 'une ligne de plan ⇔ au plus une instance. Rechargez l’écran.')
    }
    return refus(`L’instance n’a pas été écrite : ${eIns.message}`)
  }
  const exerciceId = txt(lig(instance).id)

  // ── Les deux cycles se rejoignent ──────────────────────────────────────────
  const { data: claim, error: eClaim } = await admin
    .from('scriptorium_exercices_planifies')
    .update({ statut: 'concu', concu_at: new Date().toISOString(),
              updated_at: new Date().toISOString() })
    .eq('id', planifieId)
    .eq('statut', 'a_concevoir')   // garde de transition
    .is('supprime_at', null)       // ⚠️ sans elle, un tombstone ressusciterait
    .select('id')
  if (eClaim || (claim ?? []).length === 0) {
    // Rien d'incomplet ne reste : l'instance repart avec le claim manqué.
    await admin.from('exercices').delete().eq('id', exerciceId)
    return refus(eClaim
      ? `La ligne de plan n’a pas pu passer « conçue » : ${eClaim.message}. `
        + 'L’instance a été retirée — rien d’incomplet ne reste.'
      : 'La ligne de plan a changé d’état pendant la conception (annulée, retirée, ou déjà '
        + 'conçue ailleurs). L’instance a été retirée — rien d’incomplet ne reste.')
  }

  return ok({ exerciceId, classeId: ecran.classeId })
}

/** La référence décomposée du texte — déjà vérifiée VALIDÉE par le refus. */
async function referenceDuTexte(admin: Admin, texteId: string): Promise<string | null> {
  const { data } = await admin
    .from('exercices_textes').select('reference_id').eq('id', texteId).maybeSingle()
  return txt(lig(data).reference_id) || null
}

/**
 * LE CHEMIN INVERSE — si l'instance disparaît, la ligne de plan REVIENT.
 *
 * ⚠️ Il est dû, et pour une raison précise : le lien vit SUR L'INSTANCE
 *    (`exercices.exercice_planifie_id`). Une instance supprimée emporte donc le
 *    lien avec elle, et laisserait la ligne de plan `concu` SANS INSTANCE — un
 *    statut obsolète que plus rien ne dément. C'est exactement ce que le patron
 *    de `app/prof/quazian/quizz/actions.ts:376` a été écrit pour éviter.
 *
 * ⚠️ `.neq('statut', 'annule')` : on ne ressuscite JAMAIS un tombstone.
 *
 * ⚠️ ELLE N'EST EXPOSÉE À AUCUN BOUTON. Ce lot ne pose pas de geste
 *    « retirer » — sa mission en compte quatre, et celui-là n'en est pas.
 *    Elle sert le retour arrière du geste ci-dessus et la recette, qui retire ce
 *    qu'elle a semé. Le jour où un écran de retrait naîtra, il l'appellera.
 */
export async function retirerExamenDiagnostique(
  admin: Admin, exerciceId: string,
): Promise<Issue<{ planifieId: string | null }>> {
  const { data: ex, error: eLecture } = await admin
    .from('exercices').select('id, statut, exercice_planifie_id').eq('id', exerciceId).maybeSingle()
  if (eLecture) return refus(`Lecture de l’instance impossible : ${eLecture.message}`)
  if (!ex) return refus('Instance inconnue.')
  if (txt(lig(ex).statut) !== 'concu') {
    return refus(`Cette instance est au statut « ${txt(lig(ex).statut)} » : seule une instance `
      + 'conçue et non encore assignée se retire ici — retirer une instance assignée '
      + 'laisserait les dépôts de ses élèves orphelins.')
  }
  const planifieId = txt(lig(ex).exercice_planifie_id) || null

  // ⚠️ LA LIGNE DE PLAN D'ABORD, tant que le lien pointe encore. Après le
  //    `delete`, plus rien ne dit de quelle ligne cette instance venait.
  if (planifieId) {
    const { error: eRetour } = await admin
      .from('scriptorium_exercices_planifies')
      .update({ statut: 'a_concevoir', concu_at: null, updated_at: new Date().toISOString() })
      .eq('id', planifieId).is('supprime_at', null).neq('statut', 'annule')
    if (eRetour) {
      return refus(`La ligne de plan n’a pas pu revenir « à concevoir » : ${eRetour.message}. `
        + 'L’instance n’a PAS été retirée — les deux restent d’accord.')
    }
  }
  const { error: eDel } = await admin.from('exercices').delete().eq('id', exerciceId)
  if (eDel) return refus(`L’instance n’a pas été retirée : ${eDel.message}`)
  return ok({ planifieId })
}
