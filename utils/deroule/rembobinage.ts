// ============================================================================
// LE REMBOBINAGE — le déroulé de l'élève, écran par écran, en lecture seule.
// ----------------------------------------------------------------------------
// ⭐ Louis, 14/09 : « je veux voir l'interface que voit l'élève, avec ce qui
//    lui a été servi, la crédence, et les réponses qu'il a données — sous la
//    forme d'un suivi d'écran avec frise ». `vueAvantReponse` rend la PREMIÈRE
//    page ; ce module rend la k-ième : la même vue, avec ce que l'élève avait
//    déjà produit EN ARRIVANT SUR CET ÉCRAN — et sa réponse à cet écran-là.
//
// ⚠️ MODULE PUR : il ne relit rien, il ne change que l'ÉTAT. La suite des
//    écrans est celle que le compteur « 3 / 7 » de l'élève lit, par la même
//    fonction (`suiteDeLaVue`), pour que la frise du professeur et la page de
//    l'élève ne divergent jamais.
//
// ⚠️ Un écran de la suite peut ne pas avoir été ATTEINT (l'élève s'est arrêté
//    avant) : la vue rembobinée montre alors l'écran vide, et la frise le dit.
// ============================================================================

import type { VueDuDeroule } from './vue'
import { etapesServies, gestesServis, type EtapeServie, type GesteDeLaRemise } from './etapes'
import { credenceDonneeDe } from './credence'

/**
 * ⭐ LES ÉCRANS D'APRÈS LA REMISE — le retour de v1, la version finale (écrire,
 *    rendre) et le retour final. `etapesServies` s'arrête à « rendre » ; l'élève,
 *    lui, continue (Louis, 14/09 : « la version finale devrait être dans la frise »).
 *    Ces écrans ne sont pas des `EtapeDuTravail` : `EcranDeroule` les dérive de
 *    `tempsCourant` (`ecranDuDeroule`), la vue rembobinée le pose.
 */
export type EcranDApres = 'retour' | 'vf_ecrire' | 'vf_rendre' | 'retour_final'
export type EcranRejoue = EtapeServie | { etape: EcranDApres; cas: null }
const ECRANS_D_APRES: readonly string[] = ['retour', 'vf_ecrire', 'vf_rendre', 'retour_final']
export const estUnEcranDApres = (e: string): e is EcranDApres => ECRANS_D_APRES.includes(e)

/** La suite ENTIÈRE des écrans rejoués : le travail, puis l'après-remise. */
export function ecransRejoues(vue: VueDuDeroule): EcranRejoue[] {
  const suite: EcranRejoue[] = [...suiteDeLaVue(vue)]
  // Aux crans guidés la crédence est la réponse : pas de retour de chaîne.
  if (vue.credenceEstLaReponse || vue.aucuneRemise) return suite
  suite.push({ etape: 'retour', cas: null })
  // La version finale n'existe qu'au régime plein, et jamais sur une paire
  // (`texteVf` y est la réponse au second cas).
  if (vue.regime === 'plein' && !vue.estUnePaire) {
    suite.push({ etape: 'vf_ecrire', cas: null }, { etape: 'vf_rendre', cas: null }, { etape: 'retour_final', cas: null })
  }
  return suite
}

export function titreDeLEcranDApres(e: EcranDApres): string {
  switch (e) {
    case 'retour': return 'Ton retour'
    case 'vf_ecrire': return 'Ta version finale'
    case 'vf_rendre': return 'Rendre la version finale'
    case 'retour_final': return 'Ton retour final'
  }
}

/** La vue sur le k-ième écran REJOUÉ — travail ou après-remise. */
export function vueALEcran(vue: VueDuDeroule, ecrans: readonly EcranRejoue[], k: number): VueDuDeroule {
  const ici = ecrans[k]
  if (!ici) return vue
  if (!estUnEcranDApres(ici.etape)) {
    const travail = ecrans.filter((e): e is EtapeServie => !estUnEcranDApres(e.etape))
    return vueALEtape(vue, travail, k)
  }
  const sansFin = { etalon: null, fin: null, contestations: [] as VueDuDeroule['contestations'] }
  switch (ici.etape) {
    case 'retour':
      // Le retour de v1 : la vf n'est pas encore écrite, le retour final n'existe pas.
      return { ...vue, ...sansFin, tempsCourant: 'retour', texteVf: null, vfRemiseLe: null, retourFinal: null,
        seJuger: { servie: false, motif: null, offre: null } }
    case 'vf_ecrire':
      return { ...vue, ...sansFin, tempsCourant: 'reviser', vfRemiseLe: null, retourFinal: null }
    case 'vf_rendre':
      return { ...vue, ...sansFin, tempsCourant: 'reviser', vfRemiseLe: null, retourFinal: null }
    case 'retour_final':
      return { ...vue, tempsCourant: vue.retourFinal ? 'retour_final' : 'reviser' }
  }
}

/** ⭐ LA SUITE DES ÉCRANS d'une vue — la même lecture que `EcranDeroule`. */
export function suiteDeLaVue(vue: VueDuDeroule): EtapeServie[] {
  return etapesServies({
    estUnePaire: vue.estUnePaire,
    credenceEstLaReponse: vue.credenceEstLaReponse,
    credenceDemandee: vue.cas.some((c) => c.credence !== null && !c.credence.empechement),
    gestes: gestesServis({
      confianceDemandee: vue.competencesDeLaConfiance.length > 0,
      // ⚠️ Ce que la vue sert, ou a déjà reçu : la restitution n'est due qu'au produire.
      restitutionDemandee: vue.gestesRestants.includes('restitution') || vue.restitutionAChaud !== null,
    }),
    versionFinale: false,
    sansEcriture: vue.cas.map((c) => c.sansEcriture),
    aucuneRemise: vue.aucuneRemise,
  })
}

const GESTES: readonly GesteDeLaRemise[] = ['confiance', 'conditions', 'restitution']

/**
 * La vue telle qu'elle était sur le k-ième écran de `suite`, réponse de cet
 * écran comprise. Tout ce qui vient APRÈS est remis à zéro.
 */
export function vueALEtape(vue: VueDuDeroule, suite: readonly EtapeServie[], k: number): VueDuDeroule {
  const ici = suite[k]
  if (!ici || ici.etape === 'apres') return vue

  // Ce que chaque cas garde : sa réponse si l'écran de ce cas est atteint, sa
  // crédence si l'écran « crédence » de ce cas est atteint ou dépassé.
  const atteint = (etape: EtapeServie['etape'], cas: 1 | 2 | null) =>
    suite.findIndex((s) => s.etape === etape && s.cas === cas) <= k
      && suite.some((s) => s.etape === etape && s.cas === cas)
  const casDe = (ordre: number): 1 | 2 | null => (vue.estUnePaire ? (ordre === 2 ? 2 : 1) : null)
  const reponseGardee = (ordre: number) => {
    const cas = casDe(ordre)
    return atteint('ecrire', cas) || atteint('designer', cas) || atteint('repondre', cas)
  }
  const credenceGardee = (ordre: number) => {
    const cas = casDe(ordre)
    // Aux crans guidés, la crédence EST la réponse : elle se garde avec l'écran « répondre ».
    return atteint('credence', cas) || atteint('repondre', cas)
  }
  // ⚠️ La suite porte la correction avec `cas: 1` (`etapes.ts`) — pas `null`.
  //    Audit du 14/09 : lue avec `null`, elle n'était JAMAIS gardée.
  const correctionGardee = (ordre: number) => ordre === 1 && atteint('correction', 1)

  const gestesFaits = GESTES.filter((g) => suite.findIndex((s) => s.etape === g) < k
    && suite.some((s) => s.etape === g))
  const gesteIci = GESTES.includes(ici.etape as GesteDeLaRemise) ? (ici.etape as GesteDeLaRemise) : null
  const gestesRestants = suite
    .map((s) => s.etape)
    .filter((e): e is GesteDeLaRemise => GESTES.includes(e as GesteDeLaRemise))
    .filter((g) => !gestesFaits.includes(g))
  const garde = (g: GesteDeLaRemise) => gestesFaits.includes(g) || gesteIci === g

  const etapePaire: VueDuDeroule['etapePaire'] = !vue.estUnePaire ? null
    : ici.etape === 'correction' ? 'correction'
    : ici.cas === 1 ? (ici.etape === 'credence' ? 'credence_1' : 'cas_1')
    : ici.cas === 2 ? (ici.etape === 'credence' ? 'credence_2' : 'cas_2')
    : 'correction_2'

  return {
    ...vue,
    // L'élève, une fois l'exercice ouvert, était au temps « écrire » — pas à « préparer ».
    tempsCourant: vue.temps.includes('ecrire') ? 'ecrire' : (vue.temps[0] ?? 'ecrire'),
    etapePaire,
    v1RemiseLe: null,
    texteV1: reponseGardee(1) ? vue.texteV1 : null,
    texteVf: vue.estUnePaire ? (reponseGardee(2) ? vue.texteVf : null) : null,
    microQuestionDue: false,
    motifDepassement: null,
    cas: vue.cas.map((c) => reponseGardee(c.ordre)
      ? { ...c, credenceDonnee: credenceGardee(c.ordre) ? c.credenceDonnee : null }
      : { ...c, credenceDonnee: null, zoneDonnee: null, designationDonnee: false }),
    corrections: vue.cas.map((c, i) => (correctionGardee(c.ordre) ? vue.corrections[i] ?? null : null)),
    verdictParCas: vue.cas.map((c, i) => (correctionGardee(c.ordre) ? vue.verdictParCas[i] ?? null : null)),
    precisionParCas: vue.cas.map((c, i) => (correctionGardee(c.ordre) ? vue.precisionParCas[i] ?? null : null)),
    passageParCas: vue.cas.map((c, i) => (correctionGardee(c.ordre) ? vue.passageParCas[i] ?? null : null)),
    etalon: null,
    gestesRestants: ici.etape === 'rendre' ? [] : gestesRestants,
    confianceDeclaree: garde('confiance') ? vue.confianceDeclaree : null,
    conditionsDeclarees: garde('conditions') ? vue.conditionsDeclarees : null,
    restitutionAChaud: garde('restitution') ? vue.restitutionAChaud : null,
    seJuger: { servie: false, motif: null, offre: null },
    attente: { jobs: [], enCours: false, echecDefinitif: false, message: null },
    retourChaud: null,
    retourFinal: null,
    contestations: [],
    langue: { phrase: null, n: null, ancrages: [] },
    verdictCalibration: { lignes: [], phrase: null },
    fin: null,
    // Cran 6 : la relecture de la remise porte les réponses de l'élève — on les garde sur « rendre ».
    piloteArgument: vue.piloteArgument
      ? { ...vue.piloteArgument, trace: ici.etape === 'rendre' ? vue.piloteArgument.trace : [], vfRemise: false }
      : vue.piloteArgument,
  }
}

/** Les libellés LIBRES des déclarations (`GestesDeLaRemise` porte les mêmes). */
export const LIBELLE_CONFIANCE: Record<string, string> = { elevee: 'sûr', moyenne: 'moyennement sûr', faible: 'pas sûr' }
export const LIBELLE_CONDITION: Record<string, string> = {
  temps_mis: 'le temps qu’il fallait', au_plus_vite: 'au plus vite', pas_pu: 'n’a pas pu',
}

/** Ce que l'élève a fait sur cet écran — une ligne pour la tuile de la frise. */
export function traceDeLEtape(vue: VueDuDeroule, s: EcranRejoue): { faite: boolean; resume: string } {
  if (estUnEcranDApres(s.etape)) {
    switch (s.etape) {
      case 'retour': {
        const n = vue.retourChaud?.points.length ?? 0
        return vue.retourChaud ? { faite: true, resume: `${n} point${n > 1 ? 's' : ''}${vue.retourChaud.luLe ? ' · lu' : ' · non lu'}` }
          : { faite: false, resume: 'pas encore de retour' }
      }
      case 'vf_ecrire': {
        const t = (vue.texteVf ?? '').trim()
        return t ? { faite: true, resume: `${t.length} caractères` } : { faite: false, resume: 'pas de version finale' }
      }
      case 'vf_rendre':
        return vue.vfRemiseLe ? { faite: true, resume: 'vf remise' } : { faite: false, resume: 'pas remise' }
      case 'retour_final': {
        const n = vue.retourFinal?.points.length ?? 0
        return vue.retourFinal ? { faite: true, resume: `${n} point${n > 1 ? 's' : ''}` } : { faite: false, resume: 'pas encore de retour final' }
      }
    }
  }
  const cas = vue.cas.find((c) => (s.cas === null ? c.ordre === 1 : c.ordre === s.cas)) ?? null
  const texte = s.cas === 2 ? vue.texteVf : vue.texteV1
  switch (s.etape as EtapeServie['etape']) {
    case 'ecrire': {
      const t = (texte ?? '').trim()
      return t ? { faite: true, resume: `${t.length} caractères` } : { faite: false, resume: 'rien d’écrit' }
    }
    case 'designer':
      if (!cas?.designationDonnee) return { faite: false, resume: 'pas de zone posée' }
      return { faite: true, resume: cas.zoneDonnee ? 'une zone surlignée' : '« rien à signaler »' }
    case 'repondre':
    case 'credence': {
      const c = credenceDonneeDe(cas?.credenceDonnee)
      if (!c) return { faite: false, resume: 'pas de crédence' }
      const e = cas?.credenceDonnee as { jetons?: unknown; index_correct?: unknown; pourcentage?: unknown } | null
      if (Array.isArray(e?.jetons)) {
        const jetons = e!.jetons.map((x) => Number(x))
        const max = Math.max(...jetons)
        const uniques = jetons.filter((x) => x === max).length === 1
        const juste = uniques && typeof e!.index_correct === 'number' && jetons[e!.index_correct] === max
        return { faite: true, resume: `${jetons.join(' · ')}${uniques ? (juste ? ' — juste' : ' — faux') : ' — partagée'}` }
      }
      if (typeof e?.pourcentage === 'number') return { faite: true, resume: `${e.pourcentage} %` }
      return { faite: true, resume: 'donnée' }
    }
    case 'correction':
      return { faite: (vue.corrections[0] ?? null) !== null, resume: (vue.corrections[0] ?? null) !== null ? 'servie' : 'non servie' }
    case 'confiance': {
      const v = vue.confianceDeclaree
      return v && Object.keys(v).length
        ? { faite: true, resume: Object.values(v).map((x) => LIBELLE_CONFIANCE[x] ?? x).join(' · ') }
        : { faite: false, resume: 'non déclarée' }
    }
    case 'conditions': {
      const v = vue.conditionsDeclarees as { valeur?: unknown } | null
      return typeof v?.valeur === 'string'
        ? { faite: true, resume: LIBELLE_CONDITION[v.valeur] ?? v.valeur } : { faite: false, resume: 'non déclarées' }
    }
    case 'restitution':
      return vue.restitutionAChaud
        ? { faite: true, resume: vue.restitutionAChaud.slice(0, 60) + (vue.restitutionAChaud.length > 60 ? '…' : '') }
        : { faite: false, resume: 'vide' }
    case 'rendre':
      return vue.v1RemiseLe ? { faite: true, resume: 'v1 remise' } : { faite: false, resume: 'pas rendu' }
    case 'apres':
      return { faite: !!vue.v1RemiseLe, resume: vue.fin ? vue.fin.replace(/_/g, ' ') : 'où il en est' }
  }
}
