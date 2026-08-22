import 'server-only'
// ============================================================================
// C4 · L4 — LES DEUX DRAPEAUX, ET CE QU'ILS OUVRENT.
// ----------------------------------------------------------------------------
// « Une passation en classe NE PRODUIT AUCUN SIGNAL DE MONITORING PAR DÉFAUT.
//   Deux drapeaux INDÉPENDANTS, portés par L'INSTANCE et jamais par le type,
//   ouvrent "se juger" et la confiance de remise ; ils se lèvent à la conception,
//   OU JUSQU'À L'OUVERTURE DU DÉPÔT, et se lisent sur le `lieu` SEUL — un
//   formatif passé en classe relève du même défaut. »   — `02-` §5 ; pièges 20-21
//
// « Sans quoi une passation en classe ne produit aucun signal de Monitoring, et
//   UNE ANNÉE DE COLLECTE MANQUÉE NE SE RATTRAPE PAS. »     — `07-` §2, C4-L4
//
// ⚠️ CE MODULE NE CALCULE RIEN. « Ta part de `exercices_metacognition` est LA
//    MATIÈRE BRUTE, pas le calcul » (piège 24) : `questions_servies`,
//    `questions_version` — la ligne VERSION de la fiche au moment du dépôt —, et
//    `reponses`. La `comparaison_squelette` est faite PAR LE CODE, jamais par le
//    modèle (§1.2), et elle SUPPOSE le squelette : elle vient donc APRÈS le
//    traitement en lot. ⚠️ Pour une passation en classe, elle n'a pas de
//    destinataire écrit — le déroulé de la maison est C4-L3. ELLE N'EST DONC PAS
//    FAITE ICI, et c'est au relevé : « un calcul dupliqué diverge, un calcul
//    absent se voit ».
//
// ⚠️ NE JAMAIS DEMANDER À L'ÉLÈVE DE SIGNALER CE QU'IL N'A PAS COMPRIS (piège 26 ;
//    `02-` §5). Les deux observables de lucidité sont de la métacognition
//    SPONTANÉE ; « solliciter le geste le rendrait vrai pour tout le monde, et
//    une série qui mélange le spontané et le sollicité cesse de discriminer ».
//    Aucune consigne, aucun encart, aucune invitation — et rien dans ce module
//    ne construit une question de ce genre.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'
import { INSTRUMENT_MONITORING } from '@/utils/chaine/derive/monitoring'
import { COMPETENCES, type Competence } from '@/utils/chaine/types'

type Admin = SupabaseClient

export interface Refus { ok: false; message: string }
export interface Succes<T = undefined> { ok: true; data: T }
export type Issue<T = undefined> = Succes<T> | Refus
const refus = (message: string): Refus => ({ ok: false, message })
const ok = <T>(data: T): Succes<T> => ({ ok: true, data })

// ─────────────────────────────────────────────────────────────────────────────
// LES DEUX DRAPEAUX — ils se lèvent JUSQU'À L'OUVERTURE DU DÉPÔT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « Ils se lèvent à la conception, OU JUSQU'À L'OUVERTURE DU DÉPÔT » (`02-` §5).
 * La conception est C4-L8 ; le « jusqu'à l'ouverture du dépôt » est à ce lot.
 *
 * ⚠️ C'EST LA RAISON D'ÊTRE DE LA PHRASE DE LA MISSION (piège 21) : « le geste
 *    doit donc être VISIBLE AU MOMENT OÙ LE PROFESSEUR OUVRE LE DÉPÔT — pas
 *    seulement dans un écran de conception qu'il aura quitté trois jours plus
 *    tôt ». L'écran d'ouverture les montre et les bascule ; passé l'ouverture,
 *    cette fonction refuse.
 *
 * ⚠️ INDÉPENDANTS : chacun sert son étape, aucune ne dépend de l'autre
 *    (`02-` §6.D, étape 10). D'où deux champs, jamais un.
 */
export async function leverLesDrapeaux(
  admin: Admin, exerciceId: string,
  drapeaux: { seJuger?: boolean; confianceRemise?: boolean },
): Promise<Issue<{ seJuger: boolean; confianceRemise: boolean }>> {
  const { data: ex, error: eLecture } = await admin
    .from('exercices').select('id, lieu, optin_se_juger, optin_confiance_remise')
    .eq('id', exerciceId).maybeSingle()
  if (eLecture) return refus(`Lecture de l'instance impossible : ${eLecture.message}`)
  if (!ex) return refus('Instance inconnue.')
  if (ex.lieu !== 'classe') {
    // « Sans effet quand `lieu` vaut `maison`, où les deux gestes sont de
    //   droit » (§1.1). Les basculer là serait sans objet, et trompeur.
    return refus('Ces deux drapeaux ne servent qu’en passation de classe : à la maison, '
      + 'les deux gestes sont de droit.')
  }

  // Après l'ouverture, c'est trop tard : l'élève est peut-être déjà à l'étape.
  const { count: ouverts } = await admin.from('exercices_depots')
    .select('id', { count: 'exact', head: true })
    .eq('exercice_id', exerciceId).not('ouvert_par_prof_at', 'is', null)
  if ((ouverts ?? 0) > 0) {
    return refus('Le dépôt est déjà ouvert : les deux drapeaux se lèvent à la conception, '
      + 'ou jusqu’à l’ouverture du dépôt (`02-exercices.md` §5) — pas après.')
  }

  const maj: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (drapeaux.seJuger !== undefined) maj.optin_se_juger = drapeaux.seJuger
  if (drapeaux.confianceRemise !== undefined) maj.optin_confiance_remise = drapeaux.confianceRemise
  const { data, error } = await admin.from('exercices')
    .update(maj).eq('id', exerciceId)
    .select('optin_se_juger, optin_confiance_remise').maybeSingle()
  if (error) return refus(`Les drapeaux n’ont pas été enregistrés : ${error.message}`)
  return ok({
    seJuger: !!data?.optin_se_juger,
    confianceRemise: !!data?.optin_confiance_remise,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// QUELLES COMPÉTENCES SONT `evaluee` — la borne des deux gestes
// ─────────────────────────────────────────────────────────────────────────────

export interface PerimetreDuDepot {
  /** Les compétences que l'instance déclare mesurer (`exercices.modes_par_competence`). */
  declarees: Competence[]
  /** Celles dont le statut de recette vaut `evaluee` — la seule liste qui ouvre. */
  evaluees: Competence[]
  /** La cible du retour, par la convention en vigueur. */
  cible: Competence | null
  /**
   * ⚠️ L'alerte de repli alphabétique (piège 51). `cible_primaire` est décidée et
   *    écrite en source, mais « la colonne, le champ à l'écran et sa lecture par
   *    la chaîne sont REPORTÉS AU LOT DE CORRECTIFS » — vérifié le 22/08 :
   *    aucune colonne `cible_primaire` sur `exercices`. En attendant, l'ordre
   *    alphabétique sert de convention, et elle se DIT dès qu'elle sert sur plus
   *    d'une compétence. On la compte, on ne la fait pas taire.
   */
  replisAlphabetiques: string | null
  /** Le geste du cran servi — `produire`, `diagnostiquer` ou `transformer`. */
  geste: string | null
  /** Le grain de l'objet — `micro`, `meso`, `macro`. */
  grain: string | null
  /** Le code du cran, quand l'instance en porte un. */
  cranCode: string | null
}

export async function lirePerimetre(admin: Admin, depotId: string): Promise<PerimetreDuDepot | null> {
  const { data, error } = await admin.from('exercices_depots')
    .select('id, eleve_id, exercices!inner(id, cran, modes_par_competence, '
      + 'exercices_types!inner(grain))')
    .eq('id', depotId).maybeSingle()
  if (error || !data) {
    if (error) console.error(`[passation] périmètre illisible (${depotId}) — ${error.code} ${error.message}`)
    return null
  }
  const d = data as unknown as Record<string, unknown>
  const ex = un(d.exercices) as Record<string, unknown> | null
  const type = ex ? un(ex.exercices_types) as Record<string, unknown> | null : null

  const modes = (ex?.modes_par_competence ?? {}) as Record<string, unknown>
  const declarees = Object.keys(modes).filter(estUneCompetence)

  const statuts = await lireStatutsRecette(admin, String(d.eleve_id))
  const evaluees = declarees.filter((c) => statuts[c] === 'evaluee')

  // La MÊME convention que la chaîne (`utils/chaine/chaine.ts`, `cibleDuRetour`) :
  // la décision du routeur si elle existe, l'ordre alphabétique sinon. Une
  // seconde convention ferait servir « se juger » sur une compétence et le
  // retour sur une autre.
  const cible = [...evaluees].sort()[0] ?? null
  const replis = evaluees.length > 1
    ? `cible du retour INDÉTERMINÉE : aucune décision de routeur, et ${evaluees.length} `
      + `compétences évaluées — « ${cible} » sert par convention (ordre alphabétique), `
      + 'pas par intention.'
    : null

  const cranCode = ex?.cran != null ? String(ex.cran) : null
  const geste = cranCode ? await gesteDuCran(admin, cranCode) : null

  return {
    declarees,
    evaluees,
    cible,
    replisAlphabetiques: replis,
    geste,
    grain: type?.grain != null ? String(type.grain) : null,
    cranCode,
  }
}

function un(v: unknown): unknown {
  return Array.isArray(v) ? v[0] ?? null : v ?? null
}

function estUneCompetence(nom: string): nom is Competence {
  return (COMPETENCES as readonly string[]).includes(nom)
}

async function lireStatutsRecette(
  admin: Admin, eleveId: string,
): Promise<Record<string, string>> {
  const { data, error } = await admin
    .from('competences_niveaux').select('competence, statut_recette').eq('eleve_id', eleveId)
  if (error) {
    console.error(`[passation] statuts de recette illisibles (${eleveId}) — `
      + `${error.code} ${error.message}. Aucune compétence n'est tenue pour évaluée.`)
    return {}
  }
  const out: Record<string, string> = {}
  for (const n of (data ?? []) as Array<{ competence: string; statut_recette: string }>) {
    out[n.competence] = n.statut_recette
  }
  return out
}

/** Le geste que le cran commande — la table des neuf crans le porte (`02-` §2.2). */
async function gesteDuCran(admin: Admin, code: string): Promise<string | null> {
  const { data } = await admin.from('exercices_crans')
    .select('geste').eq('code', code).maybeSingle()
  return data?.geste != null ? String(data.geste) : null
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 9 — « SE JUGER », DEUX QUESTIONS, JAMAIS TROIS
// ─────────────────────────────────────────────────────────────────────────────

/** « Sert DEUX questions au lieu de trois » en passation de classe (`02-` §5). */
export const QUESTIONS_EN_CLASSE = 2

export interface QuestionServie {
  observable_code: string
  dimension_eleve: string
  question: string
  /** La liste FERMÉE des réponses — « une réponse libre ne se compare à rien » (§1.1). */
  reponses: string[]
}

export interface OffreSeJuger {
  /** Vrai quand l'étape se sert. Faux avec un motif : le professeur doit le savoir. */
  servie: boolean
  motif: string | null
  competence: Competence | null
  questions: QuestionServie[]
  /** La ligne VERSION de la fiche au moment du dépôt (§1.1, `questions_version`). */
  version: string | null
}

/**
 * Ce que « se juger » sert, ou pourquoi il ne sert rien.
 *
 * ⚠️ LE DRAPEAU EST NÉCESSAIRE, PAS SUFFISANT (piège 22). « "Se juger" n'est
 *    servi qu'en geste `produire`, au grain `meso` ou `macro`, et seulement si
 *    la compétence cible est `evaluee` » (`02-` §5).
 *
 * ⚠️ LES QUESTIONS NE S'INVENTENT PAS. Elles viennent de la correspondance
 *    observable → formulation, DÉPOSÉE EN BASE PAR C4-L8 — « rien ici ne
 *    s'écrit à la main, et aucun lot n'invente une question » (§1.1).
 *    Correspondance absente → compétence non déclarable `evaluee` → rien à servir.
 */
export async function offreSeJuger(admin: Admin, depotId: string): Promise<OffreSeJuger> {
  const vide = (motif: string): OffreSeJuger =>
    ({ servie: false, motif, competence: null, questions: [], version: null })

  const { data, error } = await admin.from('exercices_depots')
    .select('id, exercices!inner(lieu, optin_se_juger)').eq('id', depotId).maybeSingle()
  if (error || !data) return vide('dépôt introuvable')
  const ex = un((data as Record<string, unknown>).exercices) as Record<string, unknown> | null
  if (ex?.lieu !== 'classe') return vide('ce dépôt n’est pas une passation en classe')
  if (!ex?.optin_se_juger) {
    return vide('le professeur n’a pas levé le drapeau « se juger » sur cette instance')
  }

  const p = await lirePerimetre(admin, depotId)
  if (!p) return vide('périmètre illisible')
  if (p.geste !== 'produire') {
    return vide(`« se juger » n’est servi qu’en geste \`produire\` ; le cran servi est `
      + `${p.cranCode ? `\`${p.cranCode}\` (geste \`${p.geste ?? 'inconnu'}\`)` : 'sans cran'}`)
  }
  if (p.grain !== 'meso' && p.grain !== 'macro') {
    return vide(`« se juger » n’est servi qu’aux grains \`meso\` et \`macro\` ; `
      + `celui-ci est \`${p.grain ?? 'inconnu'}\``)
  }
  if (!p.cible) {
    return vide('aucune compétence de cet exercice n’est au statut `evaluee` : il n’y a rien à '
      + 'servir. La correspondance observable → formulation se dépose à la fabrique (C4-L8), '
      + 'et une compétence sans correspondance n’est pas déclarable `evaluee`.')
  }

  const { data: corr, error: eCorr } = await admin
    .from('competences_correspondance')
    .select('observable_code, dimension_eleve, question, reponses, fiche_version, ordre')
    .eq('competence', p.cible)
    .order('ordre', { ascending: true })
  if (eCorr) return vide(`correspondance illisible : ${eCorr.message}`)
  const lignes = (corr ?? []) as Array<{
    observable_code: string; dimension_eleve: string; question: string
    reponses: unknown; fiche_version: string
  }>
  if (lignes.length === 0) {
    return vide(`aucune correspondance déposée pour « ${p.cible} » — aucun lot n’invente une question`)
  }

  // DEUX questions, jamais trois. Les premières dans l'ordre déclaré à la fiche :
  // « l'ordre » est une donnée de la correspondance, pas un tirage.
  const questions = lignes.slice(0, QUESTIONS_EN_CLASSE).map((l) => ({
    observable_code: l.observable_code,
    dimension_eleve: l.dimension_eleve,
    question: l.question,
    reponses: Array.isArray(l.reponses) ? l.reponses.map(String) : [],
  }))
  return {
    servie: true,
    motif: null,
    competence: p.cible,
    questions,
    // « La ligne VERSION de la fiche AU MOMENT DU DÉPÔT » (§1.1).
    version: lignes[0].fiche_version ?? null,
  }
}

/**
 * Enregistre ce que l'élève a répondu — la matière brute, et rien d'autre.
 *
 * ⚠️ AUCUNE `comparaison_squelette` ICI (piège 24) : elle suppose le squelette,
 *    donc elle vient après le traitement en lot, et pour une passation en classe
 *    elle N'A PAS DE DESTINATAIRE ÉCRIT — le déroulé de la maison est C4-L3. On
 *    ne la fait donc pas, et on le dit au relevé plutôt que de la dupliquer.
 */
export async function enregistrerSeJuger(
  admin: Admin, depotId: string, eleveId: string,
  offre: OffreSeJuger, reponses: Record<string, string>,
): Promise<Issue> {
  const { data: d, error: eD } = await admin.from('exercices_depots')
    .select('id, eleve_id, v1_remis_at, juger_debut_at').eq('id', depotId).maybeSingle()
  if (eD) return refus(`Lecture impossible : ${eD.message}`)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')
  if (!offre.servie) return refus(`« Se juger » n’est pas servi ici : ${offre.motif}`)

  const attendues = new Set(offre.questions.map((q) => q.observable_code))
  for (const code of Object.keys(reponses)) {
    if (!attendues.has(code)) return refus(`Question inconnue : « ${code} ».`)
  }
  // Une liste FERMÉE : « une réponse libre ne se compare à rien » (§1.1).
  for (const q of offre.questions) {
    const r = reponses[q.observable_code]
    if (r === undefined) continue
    if (q.reponses.length && !q.reponses.includes(r)) {
      return refus(`Réponse hors liste pour « ${q.observable_code} ».`)
    }
  }

  const maintenant = new Date().toISOString()
  const { error } = await admin.from('exercices_metacognition').upsert({
    depot_id: depotId,
    questions_servies: offre.questions,
    questions_version: offre.version,
    reponses,
    updated_at: maintenant,
  }, { onConflict: 'depot_id' })
  if (error) return refus(`Les réponses n’ont pas été enregistrées : ${error.message}`)

  await admin.from('exercices_depots').update({
    juger_debut_at: d.juger_debut_at ?? maintenant,
    juger_fin_at: maintenant,
    updated_at: maintenant,
  }).eq('id', depotId)
  return ok(undefined)
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉTAPE 10 — LA CONFIANCE DE REMISE : UNE VALEUR PAR COMPÉTENCE, JAMAIS UN SCALAIRE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * L'enum stocké. « Les libellés à l'écran sont LIBRES — "sûr", "moyennement
 * sûr", "pas sûr" — et LA VALEUR STOCKÉE EST CELLE DE L'ENUM, quels que soient
 * les mots affichés » (`06-` §3 ; piège 23).
 *
 * ⚠️ La liste vient du CATALOGUE DÉRIVÉ du Monitoring, pas d'une recopie :
 *    `INSTRUMENT_MONITORING.bloc_machine.squelette.catalogue.confiances`. La
 *    fiche du Monitoring n'est pas au manifeste de ce lot ; son DÉRIVÉ est déjà
 *    dans le dépôt, écrit par le seul dériveur, et c'est lui qu'on lit.
 */
export const CONFIANCES =
  INSTRUMENT_MONITORING.bloc_machine.squelette.catalogue.confiances as readonly string[]

/** Les libellés proposés à l'écran — libres, et ils ne sont PAS la valeur stockée. */
export const LIBELLES_CONFIANCE: Record<string, string> = {
  elevee: 'Sûr de moi',
  moyenne: 'Moyennement sûr',
  faible: 'Pas sûr',
  non_exprimee: 'Je préfère ne pas dire',
}

export interface OffreConfiance {
  servie: boolean
  motif: string | null
  /** UNE VALEUR PAR COMPÉTENCE `evaluee` MESURÉE — « parce qu'une passation en classe en mesure trois ou quatre ». */
  competences: Competence[]
}

/**
 * ⚠️ MÊME BORNE DU MOMENT QUE « SE JUGER » (piège 23) : sans compétence
 *    `evaluee`, il n'y a RIEN À COLLECTER — l'étape existe et sert un objet
 *    vide. On la construit quand même ; c'est la collecte qu'une année manquée
 *    ne rattrape pas.
 */
export async function offreConfianceRemise(
  admin: Admin, depotId: string,
): Promise<OffreConfiance> {
  const { data, error } = await admin.from('exercices_depots')
    .select('id, exercices!inner(lieu, optin_confiance_remise)').eq('id', depotId).maybeSingle()
  if (error || !data) return { servie: false, motif: 'dépôt introuvable', competences: [] }
  const ex = un((data as Record<string, unknown>).exercices) as Record<string, unknown> | null
  if (ex?.lieu !== 'classe') {
    return { servie: false, motif: 'ce dépôt n’est pas une passation en classe', competences: [] }
  }
  if (!ex?.optin_confiance_remise) {
    return {
      servie: false,
      motif: 'le professeur n’a pas levé le drapeau « confiance de remise » sur cette instance',
      competences: [],
    }
  }
  const p = await lirePerimetre(admin, depotId)
  const competences = p?.evaluees ?? []
  return {
    servie: true,
    // L'étape est servie et ne collecte rien : ce n'est pas une panne, c'est
    // l'état du moment, et il se dit.
    motif: competences.length === 0
      ? 'aucune compétence de cet exercice n’est au statut `evaluee` : l’étape est servie, et '
        + 'elle ne collecte rien.'
      : null,
    competences,
  }
}

/**
 * Enregistre la confiance déclarée.
 *
 * ⚠️ UN OBJET, JAMAIS UN SCALAIRE (piège 23 ; §1.1). La garde en base
 *    (`depots_confiance_chk`, C4-L1) exige `jsonb_typeof = 'object'` : un
 *    nombre ou une chaîne serait refusé par une `23514`.
 */
export async function enregistrerConfianceRemise(
  admin: Admin, depotId: string, eleveId: string,
  parCompetence: Record<string, string>,
): Promise<Issue> {
  const { data: d, error: eD } = await admin.from('exercices_depots')
    .select('id, eleve_id').eq('id', depotId).maybeSingle()
  if (eD) return refus(`Lecture impossible : ${eD.message}`)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')

  const offre = await offreConfianceRemise(admin, depotId)
  if (!offre.servie) return refus(`La confiance de remise n’est pas servie ici : ${offre.motif}`)

  const admises = new Set<string>(offre.competences)
  for (const [c, v] of Object.entries(parCompetence)) {
    if (!admises.has(c)) {
      return refus(`« ${c} » n’est pas une compétence évaluée de cet exercice.`)
    }
    if (!CONFIANCES.includes(v)) {
      // « Une valeur hors d'une liste fermée du catalogue → alerte déclarée,
      //   jamais de valeur par défaut » (bloc machine du Monitoring).
      return refus(`Valeur de confiance inconnue : « ${v} ».`)
    }
  }

  const { error } = await admin.from('exercices_depots')
    .update({ confiance_declaree: parCompetence, updated_at: new Date().toISOString() })
    .eq('id', depotId)
  if (error) return refus(`La confiance n’a pas été enregistrée : ${error.message}`)
  return ok(undefined)
}

// ─────────────────────────────────────────────────────────────────────────────
// LA CRÉDENCE — commandée par le GESTE, pas par le lieu
// ─────────────────────────────────────────────────────────────────────────────

/**
 * « La crédence se collecte AUX SIX CRANS de `diagnostiquer` et de
 * `transformer`, et SA FORME SUIT LE CRAN » (`02-` §5 ; piège 25) : jetons sur
 * 100 entre QUATRE candidats aux deux crans GUIDÉS — trois distracteurs plus la
 * `reponse_attendue` (`02-` §5) —, pourcentage unique aux quatre autres.
 *
 * ⚠️ ELLE N'EST PAS COMMANDÉE PAR LE LIEU MAIS PAR LE GESTE : on lit le cran de
 *    l'instance servie, on ne suppose rien.
 *
 * ⭐ CONSTAT DU 22/08, PAR REQUÊTE : les deux types diagnostiques seedés par
 *    C4-L1 — `diagnostic_essai` et `diagnostic_explication_texte` — sont SANS
 *    CRAN (`crans_admis` vaut `{}`, et `exercices_types_crans` ne porte AUCUNE
 *    ligne pour eux). Il n'y a donc, au 22/08, AUCUN écran de crédence à servir
 *    pour eux ; une instance de classe qui porterait un cran de diagnostic ou de
 *    transformation en aurait besoin, et cette fonction le dit.
 */
export const CRANS_A_CREDENCE = [
  'diagnostic_guide', 'diagnostic_nomme', 'diagnostic_fin',
  'transformation_guidee', 'transformation_nommee', 'transformation_aveugle',
] as const

export const CRANS_GUIDES = ['diagnostic_guide', 'transformation_guidee'] as const

export type FormeCredence = 'jetons_sur_100' | 'pourcentage_unique'

export interface OffreCredence {
  servie: boolean
  motif: string | null
  forme: FormeCredence | null
  /** Aux crans guidés : les QUATRE candidats — trois distracteurs, plus la réponse attendue. */
  candidats: string[]
}

export async function offreCredence(admin: Admin, depotId: string): Promise<OffreCredence> {
  const vide = (motif: string): OffreCredence =>
    ({ servie: false, motif, forme: null, candidats: [] })

  const p = await lirePerimetre(admin, depotId)
  if (!p) return vide('périmètre illisible')
  if (!p.cranCode) {
    return vide('cette instance ne porte aucun cran : la crédence se collecte aux six crans de '
      + '`diagnostiquer` et de `transformer` (`02-exercices.md` §5), et il n’y a donc rien à servir.')
  }
  if (!(CRANS_A_CREDENCE as readonly string[]).includes(p.cranCode)) {
    return vide(`le cran servi est \`${p.cranCode}\` (geste \`${p.geste ?? 'inconnu'}\`) : `
      + 'la crédence ne se collecte qu’aux gestes `diagnostiquer` et `transformer`.')
  }

  const guide = (CRANS_GUIDES as readonly string[]).includes(p.cranCode)
  if (!guide) {
    return { servie: true, motif: null, forme: 'pourcentage_unique', candidats: [] }
  }

  // « L'écran sert QUATRE candidats : trois distracteurs tirés de la banque,
  //   plus la `reponse_attendue` » (`02-` §5).
  const { data, error } = await admin.from('exercices_depots')
    .select('exercices!inner(id, exercices_cas(ordre, distracteurs, reponse_attendue))')
    .eq('id', depotId).maybeSingle()
  if (error) return vide(`banque de distracteurs illisible : ${error.message}`)
  const ex = un((data as Record<string, unknown>)?.exercices) as Record<string, unknown> | null
  const cas = (ex?.exercices_cas ?? []) as Array<{
    ordre: number; distracteurs: unknown; reponse_attendue: unknown
  }>
  const premier = [...cas].sort((a, b) => a.ordre - b.ordre)[0]
  const banque = Array.isArray(premier?.distracteurs) ? premier.distracteurs.map(String) : []
  const attendue = premier?.reponse_attendue != null ? String(premier.reponse_attendue) : null

  // « Trois distracteurs en banque sont le PLANCHER : en dessous, l'instance ne
  //   peut pas composer son écran » (`02-` §5).
  if (banque.length < 3 || !attendue) {
    return vide(`cran guidé sans banque suffisante : ${banque.length} distracteur(s) et `
      + `${attendue ? 'une' : 'aucune'} réponse attendue. Le plancher est de trois distracteurs `
      + 'plus la réponse attendue (`02-exercices.md` §5) — l’écran ne se compose pas.')
  }
  return {
    servie: true,
    motif: null,
    forme: 'jetons_sur_100',
    // L'instance TIRE dans la banque — « elle n'en affiche jamais quinze ».
    candidats: [...banque.slice(0, 3), attendue],
  }
}

/**
 * Enregistre la crédence — la SAISIE, jamais l'accord.
 *
 * « La saisie de crédence n'est pas [dans `monitoring_mesures`] : elle vit avec
 * les autres gestes du dépôt. Cette table ne reçoit que L'ACCORD entre la
 * crédence et la réussite — le signal, jamais la saisie » (§1.4). L'accord est
 * calculé par C4-L5 ; ce lot n'écrit que la saisie.
 *
 * ⚠️ PLUSIEURS VALEURS PAR DÉPÔT : « il y en a une par diagnostic, donc DEUX sur
 *    une paire » (§1.2). D'où une liste, jamais une valeur.
 */
export async function enregistrerCredence(
  admin: Admin, depotId: string, eleveId: string,
  saisies: Array<{ cas: number; valeurs: Record<string, number> | { pourcentage: number } }>,
): Promise<Issue> {
  const { data: d, error: eD } = await admin.from('exercices_depots')
    .select('id, eleve_id').eq('id', depotId).maybeSingle()
  if (eD) return refus(`Lecture impossible : ${eD.message}`)
  if (!d) return refus('Dépôt introuvable.')
  if (d.eleve_id !== eleveId) return refus('Ce dépôt n’est pas le vôtre.')

  const offre = await offreCredence(admin, depotId)
  if (!offre.servie) return refus(`La crédence n’est pas servie ici : ${offre.motif}`)

  for (const s of saisies) {
    if (offre.forme === 'jetons_sur_100') {
      const v = s.valeurs as Record<string, number>
      const total = Object.values(v).reduce((a, b) => a + (Number(b) || 0), 0)
      if (Math.round(total) !== 100) {
        return refus(`Cas ${s.cas} : les jetons doivent totaliser 100 (ils font ${total}).`)
      }
      for (const cle of Object.keys(v)) {
        if (!offre.candidats.includes(cle)) return refus(`Cas ${s.cas} : candidat inconnu « ${cle} ».`)
      }
    } else {
      const p = (s.valeurs as { pourcentage: number }).pourcentage
      if (!Number.isFinite(p) || p < 0 || p > 100) {
        return refus(`Cas ${s.cas} : le pourcentage doit être compris entre 0 et 100.`)
      }
    }
  }

  const { error } = await admin.from('exercices_metacognition').upsert({
    depot_id: depotId,
    credence: { forme: offre.forme, saisies },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'depot_id' })
  if (error) return refus(`La crédence n’a pas été enregistrée : ${error.message}`)
  return ok(undefined)
}
