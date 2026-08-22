import 'server-only'
// ============================================================================
// C4 · L5 — LA CHAÎNE FROIDE, ET LES DEUX TEMPS DE CODE QUI LUI APPARTIENNENT.
// ----------------------------------------------------------------------------
// « QUATRE TEMPS, et deux seulement sont des appels : P1 extrait, DU CODE prépare
//   ce que P2 doit voir, P2 juge observable par observable, DU CODE agrège — pour
//   cinq compétences, DEUX appels ; pour la Synthèse, TROIS. […] Les deux temps
//   de code NE JOURNALISENT RIEN dans `api_couts` : ce ne sont pas des appels. »
//                                            — piège 6 ; `01-` §11 ; `07-` §1.2
//
// « Les extractions se lancent EN PARALLÈLE — le contrat de latence est intenable
//   dès deux compétences mesurées — ET LE MONITORING TOURNE EN DERNIER, jamais en
//   parallèle. »                                            — piège 10
//
// « En production, la chaîne passe UNE fois — un appel P1 et un appel P2 par
//   compétence. Les cinq tirages et le mode statistique sont LE BANC. » (piège 9)
//
// ⚠️ AUCUN ÉCRAN ici. « Il ne route rien, ne cible rien, n'escalade rien — il
//    MESURE CE QU'ON LUI DÉPOSE ET ÉCRIT CE QUE LES AUTRES LIRONT. »
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { appeler, AppelInterrompu, SortieNonConforme } from './appel'
import { chaineActive } from './acces'
import { lireConfig, type ConfigChaine } from './config'
import { lireContexte, type ContexteDepot } from './contexte'
import { appelsDuDepot, controlerLaFacture } from './couts-serveur'
import { depotAAtteintSonPlafond } from './couts'
import {
  competencesOuvertes, etatCompetence, CALAME,
  type BranchementCompetence, type ContexteBranchement, type InstrumentCompetence,
} from './instruments'
import { modeleDeLaChaine } from './modele'
import { messageAvecMateriau, tentativeDeSortieDeBloc } from './anti-injection'
import { appliquerObservablesMesure } from './observables'
import {
  attacherDelta, ecrireMesure, entreesDesRegles, fenetreDEvidence,
  type LigneMesure,
} from './mesures'
import { traiterLeMonitoring } from './monitoring'
import { assemblerRetour, controlerRetour, segmenter, type CoucheCompetence } from './retour'
import { reposerJob, terminerJob, type Job } from './file'
import type { Competence, Registre, RetourSegmente, Version } from './types'

type Admin = ReturnType<typeof createAdminClient>

const MODULE_COUT = 'exercices-chaine'

/** Ce que le retour reçoit d'une compétence : les DEUX artefacts (`07-` §4). */
export interface SqueletteServi {
  competence: Competence
  extraction: unknown
  jugement: unknown
}

export interface BilanDepot {
  depotId: string
  version: Version
  competencesMesurees: Competence[]
  competencesEcartees: Array<{ competence: string; motif: string }>
  mesuresEcrites: number
  mesuresDejaLa: number
  retourEcrit: boolean
  monitoring: { mesures: number; motifs: string[] }
  appels: number
  dureeMs: number
  alertes: string[]
}

/**
 * La chaîne est suspendue POUR TOUT LE MONDE — l'interrupteur est à OFF, ou la
 * facture a coupé. « En laissant LES DÉPÔTS EN FILE : rien ne se perd […] le
 * traitement reprend à la réouverture » (piège 49). C'est une suspension
 * TEMPORAIRE et GLOBALE : le tour s'arrête, les jobs sont reposés.
 */
export class ChaineSuspendue extends Error {}

/**
 * CE dépôt-ci ne peut pas être traité — et aucun tour de file n'y changera rien :
 * il n'a pas de production, ou il a consommé son plafond d'appels.
 *
 * ⚠️ À NE PAS confondre avec `ChaineSuspendue`. Traiter une panne PERMANENTE et
 *    LOCALE comme une suspension globale gèle la file entière : le job est
 *    reposé (donc jamais épuisé, jamais `echec_definitif`), il reste en tête du
 *    tri `created_at ASC`, et le `break` abandonne tous les autres jobs — à
 *    chaque tour, pour toujours. Un seul dépôt sans version finale suffisait.
 */
export class DepotInexploitable extends Error {}

/**
 * Le traitement d'un dépôt, de bout en bout. C'est le seul point d'entrée.
 *
 * `version` vaut `v1` — la chaîne complète, qui écrit les mesures — ou `vf` —
 * « la vf ne rejoue les appels froids que pour LA SEULE COMPÉTENCE VISÉE PAR LE
 * RETOUR », et « le jugement porté sur la vf n'écrit JAMAIS dans les mesures »
 * (piège 16 ; `01-` §11).
 */
export async function traiterDepot(
  admin: Admin, depotId: string, version: Version,
  options: { config?: ConfigChaine; registre?: Registre; aideConsommee?: number | null } = {},
): Promise<BilanDepot> {
  const debut = Date.now()
  const config = options.config ?? lireConfig()
  const alertes: string[] = []

  // ── Les gardes, avant tout appel ──────────────────────────────────────────
  if (!(await chaineActive(admin))) {
    throw new ChaineSuspendue('`chaine_actif` est à OFF — les dépôts restent en file.')
  }
  const facture = await controlerLaFacture(admin, config.plafondMensuelUsd)
  if (facture.etat === 'coupure') {
    throw new ChaineSuspendue(
      `plafond mensuel atteint (${facture.depense.toFixed(4)} $ / ${facture.plafond} $) — `
      + 'la chaîne est coupée, les dépôts restent en file.')
  }
  const dejaFaits = await appelsDuDepot(admin, depotId)
  if (depotAAtteintSonPlafond(dejaFaits, config.plafondAppelsParDepot)) {
    // Propre à CE dépôt, et définitif : un tour de plus n'y changerait rien.
    throw new DepotInexploitable(
      `plafond d'appels par dépôt atteint (${dejaFaits} / ${config.plafondAppelsParDepot}).`)
  }

  const ctx = await lireContexte(admin, depotId)
  const modele = modeleDeLaChaine(
    { lieu: ctx.lieu, forme: ctx.forme, diagnostic: ctx.paireDiagnostic }, config)

  // ── Qui entre dans la chaîne ──────────────────────────────────────────────
  const { mesurees, ecartees } = competencesDeLExercice(ctx)
  const ouvertes = new Set(competencesOuvertes())

  const production = version === 'v1' ? ctx.productionV1 : ctx.productionVf
  if (!production || production.trim() === '') {
    throw new DepotInexploitable(`le dépôt ${depotId} n'a pas de production en ${version}.`)
  }
  // La copie est neutralisée à l'assemblage ; ici, on rend le fait VISIBLE.
  if (tentativeDeSortieDeBloc(production)) {
    const trace = `[chaine] tentative de sortie de bloc dans la copie — dépôt ${depotId}, `
      + `élève ${ctx.eleveId}, version ${version}. La copie est neutralisée avant tout appel `
      + '(01- §12, défense 1) ; aucun drapeau d\'intégrité n\'est levé, le canal existant ne '
      + 'nomme ni ce module ni ce type (piège 51 — question au relevé).'
    console.error(trace)
    alertes.push('tentative de sortie de bloc dans la copie — neutralisée avant appel')
  }

  // « La vf ne rejoue les appels froids que pour LA SEULE COMPÉTENCE VISÉE PAR
  //   LE RETOUR » (piège 16 ; `01-` §11).
  const cible = cibleDuRetour(ctx, mesurees)
  if (cibleIndeterminee(ctx, mesurees)) {
    alertes.push(
      `cible du retour INDÉTERMINÉE : aucune décision de routeur, et ${mesurees.length} compétences `
      + `mesurées — « ${cible} » sert par convention (ordre alphabétique), pas par intention. `
      + 'Le partage primaire / secondaire / sonde appartient à C4-L2 (01- §1).')
  }
  const competencesFroides = version === 'v1' ? mesurees : (cible ? [cible] : [])

  let appels = 0
  let mesuresEcrites = 0
  let mesuresDejaLa = 0
  // Le retour reçoit l'extraction ET LE JUGEMENT : « Tu reçois : le squelette
  // extrait de sa copie […] ; LE VERDICT PAR OBSERVABLE » (`07-` §4), et la
  // règle 4 lui fait puiser « le champ `levier` DU VERDICT ». Ne transmettre que
  // l'extraction obligeait le modèle à rejuger — ce que l'architecture à deux
  // étages interdit (`01-` §11 et §12).
  const squelettes: SqueletteServi[] = []

  // ── Temps 1 à 4, par compétence, LES CHAÎNES EN PARALLÈLE ─────────────────
  // ⚠️ `allSettled`, jamais `all` : avec `all`, une compétence qui lève emporte
  //    le RÉSULTAT des autres — dont les mesures sont pourtant déjà écrites et
  //    les appels déjà payés —, et le dépôt reste sans retour.
  const regles = await Promise.allSettled(competencesFroides.map(async (c) => {
    const etat = etatCompetence(c)
    if (!etat.ouverte || !etat.instrument || !etat.branchement) {
      return { competence: c, ecartee: etat.motif ?? 'compétence fermée', appels: 0 }
    }
    return chaineDUneCompetence(admin, {
      ctx, competence: c, version, production, modele,
      instrument: etat.instrument, branchement: etat.branchement,
      aideConsommee: options.aideConsommee ?? null,
    })
  }))
  const resultats: Array<ResultatCompetence | { competence: Competence; ecartee: string; appels: number }> = []
  regles.forEach((r, i) => {
    if (r.status === 'fulfilled') { resultats.push(r.value); return }
    const motif = r.reason instanceof Error ? r.reason.message : String(r.reason)
    ecartees.push({ competence: competencesFroides[i], motif: `la chaîne a levé — ${motif}` })
    alertes.push(`${competencesFroides[i]} : chaîne interrompue — ${motif}`)
  })

  for (const r of resultats) {
    appels += r.appels
    if ('ecartee' in r && r.ecartee) {
      ecartees.push({ competence: r.competence, motif: r.ecartee })
      continue
    }
    const rr = r as ResultatCompetence
    if (rr.alerte) alertes.push(`${rr.competence} : ${rr.alerte}`)
    if (rr.ecrite) mesuresEcrites += 1
    if (rr.dejaLa) mesuresDejaLa += 1
    if (rr.squelette) squelettes.push(rr.squelette)
  }

  // ── LE MONITORING, EN DERNIER — jamais en parallèle (§1.4, contrainte 1) ───
  const monitoring = await traiterLeMonitoring(admin, {
    ctx, version, modele, production,
    niveauxObtenus: Object.fromEntries(
      resultats.filter((r): r is ResultatCompetence => !('ecartee' in r))
        .map((r) => [r.competence, r.lettre_equivalente ?? null])),
  })
  appels += monitoring.appels

  // ── Le retour — chaud en v1, final en vf ──────────────────────────────────
  let retourEcrit = false
  if (squelettes.length) {
    // « Le retour final s'engendre depuis LA COMPARAISON DES DEUX SQUELETTES »
    // (la mission) : en vf, on relit ceux de la v1 pour les lui donner.
    const squelettesV1 = version === 'vf'
      ? (await Promise.all(squelettes.map(async (s) => ({
        competence: s.competence,
        extraction: await lireSquelette(admin, depotId, s.competence, 'v1', 'artefact_extraction'),
        jugement: await lireSquelette(admin, depotId, s.competence, 'v1', 'artefact_jugement'),
      })))).filter((s) => s.extraction != null)
      : null
    if (version === 'vf' && (squelettesV1?.length ?? 0) < squelettes.length) {
      alertes.push('le squelette de la v1 manque pour au moins une compétence : le retour final '
        + 'ne peut pas comparer les deux versions (01- §11)')
    }
    const r = await engendrerLeRetour(admin, {
      ctx, version, modele,
      squelettes: version === 'vf' ? (squelettesV1 ?? []) : squelettes,
      squelettesVf: version === 'vf' ? squelettes : undefined,
      registre: options.registre ?? null, cible,
    })
    appels += r.appels
    retourEcrit = r.ecrit
    alertes.push(...r.alertes)
  } else {
    alertes.push('aucun squelette : aucune compétence n\'est entrée dans la chaîne — '
      + 'pas de retour engendré (clause granulaire).')
  }

  const dureeMs = Date.now() - debut
  if (dureeMs > config.latenceCibleMs) {
    alertes.push(`contrat de latence dépassé : ${Math.round(dureeMs / 1000)} s pour une cible de `
      + `${Math.round(config.latenceCibleMs / 1000)} s (01- §12).`)
  }

  return {
    depotId, version,
    competencesMesurees: competencesFroides.filter((c) => ouvertes.has(c)),
    competencesEcartees: ecartees,
    mesuresEcrites, mesuresDejaLa, retourEcrit,
    monitoring: { mesures: monitoring.mesures, motifs: monitoring.motifs },
    appels, dureeMs, alertes,
  }
}

// ── Qui l'exercice mesure, et qui la chaîne écarte ──────────────────────────

/**
 * « La mesure tourne ? `evaluee` : oui · `mesuree_silencieusement` : OUI, on
 * mesure et on stocke · `differee` : NON, on ne mesure pas » (`07-` §5).
 * Plus la clause granulaire, qui écarte toute compétence dont la fiche n'est pas
 * versée et bancée — et c'est le cas des six aujourd'hui.
 */
export function competencesDeLExercice(ctx: ContexteDepot): {
  mesurees: Competence[]
  ecartees: Array<{ competence: string; motif: string }>
} {
  const mesurees: Competence[] = []
  const ecartees: Array<{ competence: string; motif: string }> = []
  for (const nom of Object.keys(ctx.modesParCompetence)) {
    const c = nom as Competence
    const statut = ctx.statutsRecette[c]
    if (statut === 'differee') {
      ecartees.push({ competence: nom, motif: 'statut de recette `differee` — on ne mesure pas (07- §5)' })
      continue
    }
    const etat = etatCompetence(c)
    if (!etat.ouverte) {
      ecartees.push({ competence: nom, motif: etat.motif ?? 'fiche non versée et bancée' })
      continue
    }
    mesurees.push(c)
  }
  return { mesurees, ecartees }
}

/**
 * La compétence que le retour commande — « un exercice a UNE cible primaire :
 * c'est elle qui commande le retour » (`01-` §1).
 *
 * ⚠️ Le partage primaire / secondaire / sonde vit dans la DÉCISION du routeur
 *    (`routeur_decisions.cible_retenue`), qui appartient à C4-L2. Sans décision,
 *    RIEN NE HIÉRARCHISE les compétences que l'instance déclare : elles vivent
 *    dans un `jsonb`, dont Postgres n'ordonne les clés ni par saisie ni par
 *    intention — il les range par longueur puis par octets. « La première
 *    compétence mesurée » n'est donc pas celle que le professeur a nommée en
 *    premier : ce serait, en pratique, celle dont le nom est le plus court.
 *
 *    D'où un repli qui s'assume comme tel : l'ORDRE ALPHABÉTIQUE, déterministe
 *    et sans prétention. `cibleIndeterminee()` dit quand il a servi, pour que
 *    l'appelant le porte en alerte plutôt que de le taire.
 */
export function cibleDuRetour(ctx: ContexteDepot, mesurees: readonly Competence[]): Competence | null {
  const declaree = ctx.decision?.cibleRetenue as Competence | undefined
  if (declaree && mesurees.includes(declaree)) return declaree
  return [...mesurees].sort()[0] ?? null
}

/** Vrai quand la cible relève du repli, et que plus d'une compétence est en jeu. */
export function cibleIndeterminee(ctx: ContexteDepot, mesurees: readonly Competence[]): boolean {
  const declaree = ctx.decision?.cibleRetenue as Competence | undefined
  return !(declaree && mesurees.includes(declaree)) && mesurees.length > 1
}

/**
 * Les compétences SONDÉES sur cet exercice. « Une sonde est SILENCIEUSE : elle
 * ne produit AUCUN RETOUR » (`01-` §1, principe 4 ; §8.9) — elle se mesure, elle
 * ne se dit pas. Elles sortent donc du retour, et de son plafond.
 */
export function sondesDeLExercice(ctx: ContexteDepot): Set<string> {
  return new Set(ctx.decision?.sondes ?? [])
}

// ── La chaîne d'UNE compétence : P1 → Code1 → P2 → Code2 ────────────────────

interface ResultatCompetence {
  competence: Competence
  appels: number
  ecrite: boolean
  dejaLa: boolean
  lettre_equivalente: string | null
  squelette: SqueletteServi | null
  alerte: string | null
}

async function chaineDUneCompetence(
  admin: Admin,
  a: {
    ctx: ContexteDepot; competence: Competence; version: Version; production: string
    modele: string; instrument: InstrumentCompetence; branchement: BranchementCompetence
    aideConsommee: number | null
  },
): Promise<ResultatCompetence> {
  const { ctx, competence, version, production, modele, instrument, branchement } = a
  const modes = ctx.modesParCompetence[competence] ?? []
  const ctxBranchement: ContexteBranchement = {
    modes,
    cran: ctx.cranCode,
    // « UN SEUL appel d'extraction quand le référent est LE COURS — l'aligneur ne
    //   tourne pas » (piège 6 ; `07-` §1.2). La synthèse en classe a le cours pour
    //   référent (`01-` §10) ; ailleurs, c'est la référence décomposée du texte.
    referent: ctx.referent,
    exceptionOrthographe: ctx.exceptionOrthographe,
  }
  let appels = 0
  const alertes: string[] = []

  // ── Temps 1 — P1. Un appel pour cinq compétences, DEUX pour la Synthèse. ──
  const artefactsP1: Record<string, unknown> = {}
  const specs = branchement.extractions(ctxBranchement)
  for (const spec of specs) {
    const prompt = instrument.prompts[spec.tetePrompt]
    if (!prompt) {
      return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
        alerte: `prompt d'extraction « ${spec.tetePrompt} » absent de l'instrument dérivé` }
    }
    const r = await appeler<Record<string, unknown>>({
      phase: 'p1', modele,
      systeme: 'Tu es un extracteur. Tu relèves, tu ne juges pas.',
      prefixeCacheable: prompt,
      message: messageAvecMateriau(
        [{ nom: `la copie de l'élève (${version})`, contenu: production }],
        `Consigne servie à l'élève : ${ctx.consigne}\n\nRends le relevé au format déclaré ci-dessus.`),
      // Le relevé d'une fiche a une forme qui FAIT FOI À LA FICHE (`03-` §1) :
      // on exige un objet, on ne prétend pas en connaître les clés. `champs: {}`
      // aurait voulu dire « l'objet VIDE, et rien d'autre » — et refusé tout.
      forme: { type: 'objet_libre' },
      attribution: { module: MODULE_COUT, eleveId: ctx.eleveId, classeId: ctx.classeId,
        depotId: ctx.depotId, competence, version },
    })
    appels += r.appels
    artefactsP1[spec.cle] = r.valeur
  }

  // ── Temps 2 — CODE1. Il ne journalise rien : ce n'est pas un appel. ────────
  const prepare = branchement.code1(artefactsP1, ctxBranchement)
  alertes.push(...prepare.alertes)

  await upsertSquelette(admin, ctx.depotId, competence, version, {
    artefact_extraction: artefactsP1, modele,
    prompt_version: instrument.version, instrument_version: instrument.version,
  })

  // ── Temps 3 — P2, observable par observable ───────────────────────────────
  const specP2 = branchement.jugement(ctxBranchement)
  const promptP2 = instrument.prompts[specP2.tetePrompt]
  if (!promptP2) {
    return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
      alerte: `prompt de jugement « ${specP2.tetePrompt} » absent de l'instrument dérivé` }
  }
  const jugement = await appeler<Record<string, unknown>>({
    phase: 'p2', modele,
    systeme: 'Tu es un juge. Tu ne rends ni niveau, ni dimension, ni décompte.',
    prefixeCacheable: promptP2,
    message: messageAvecMateriau(
      [{ nom: 'le relevé préparé pour le jugement', contenu: JSON.stringify(prepare.document_p2) }],
      'Rends le jugement au format déclaré ci-dessus.'),
    forme: { type: 'objet', champs: {}, optionnels: [] },
    attribution: { module: MODULE_COUT, eleveId: ctx.eleveId, classeId: ctx.classeId,
      depotId: ctx.depotId, competence, version },
  })
  appels += jugement.appels

  await upsertSquelette(admin, ctx.depotId, competence, version, {
    artefact_jugement: jugement.valeur, modele,
    prompt_version: instrument.version, instrument_version: instrument.version,
  })

  // ── Temps 4 — CODE2. « Du code agrège » : le palier DE LA MESURE. ─────────
  const agrege = branchement.code2(jugement.valeur, ctxBranchement)
  alertes.push(...agrege.alertes)
  const { observables, alertes: alertesObs } =
    appliquerObservablesMesure(instrument.observables_mesure, agrege.releve)
  alertes.push(...alertesObs.map((x) => `${x.observable} : ${x.motif}`))

  const squelette: SqueletteServi = { competence, extraction: artefactsP1, jugement: jugement.valeur }

  // ── LA VF N'ÉCRIT JAMAIS DANS LES MESURES (piège 16). ─────────────────────
  // Elle attache SON DELTA à la mesure de la v1 — « le delta s'attache à la
  // sienne » (`07-` §1.2) —, et rien d'autre.
  if (version === 'vf') {
    const squeletteV1 = await lireSquelette(admin, ctx.depotId, competence, 'v1')
    const delta = branchement.delta && squeletteV1 != null
      ? branchement.delta(squeletteV1, artefactsP1, ctxBranchement)
      : null
    if (delta === null && !branchement.delta) {
      alertes.push('`delta_v1_vf` reste NULL : le branchement de la compétence n\'en déclare '
        + 'pas le calcul — et NULL n\'est pas 0 (01- §11)')
    }
    await attacherDelta(admin, ctx.depotId, competence, delta)
    return { competence, appels, ecrite: false, dejaLa: false,
      lettre_equivalente: agrege.lettre_equivalente, squelette,
      alerte: alertes.length ? alertes.join(' · ') : null }
  }

  const regles = await entreesDesRegles(
    admin, ctx.eleveId, competence, { modes, objet: ctx.objet }, new Date())

  const ligne: LigneMesure = {
    eleve_id: ctx.eleveId,
    competence,
    modes,
    lettre_equivalente: agrege.lettre_equivalente,
    observables,
    lieu: ctx.lieu,
    forme: ctx.forme,
    genre: ctx.genre,
    classe_id: ctx.classeId,
    // « Le drapeau vient de la décision d'assignation ; la chaîne LE RECOPIE sur
    //   la mesure » (piège 20) — par compétence. Le propager à toutes les mesures
    //   du dépôt sortait la CIBLE de la fenêtre d'acquisition et de la stagnation,
    //   et éteignait N1 sur elle : l'exact inverse du motif de M-e (`01-` §8.8).
    sonde_montee: ctx.decision?.sondesMontee?.includes(competence) ?? false,
    distance_contexte: regles.distance_contexte,
    delai_jours: regles.delai_jours,
    delai_mesures: regles.delai_mesures,
    aide_consommee: a.aideConsommee,
    depot_id: ctx.depotId,
    bonus: ctx.bonus,
    instrument_version: instrument.version,
  }
  const ecriture = await ecrireMesure(admin, ligne)
  if (ecriture.erreur) alertes.push(`écriture de la mesure : ${ecriture.erreur}`)
  if (ecriture.dejaLa) {
    // Le squelette, lui, vient d'être ÉCRASÉ par l'upsert. Si l'instrument a
    // changé entre les deux passes, les deux tables se contredisent — et `01-`
    // §11 fait lire la dispersion par l'`instrument_version` DE LA MESURE.
    const ancienne = await instrumentDeLaMesure(admin, ctx.depotId, competence)
    if (ancienne && ancienne !== instrument.version) {
      alertes.push(
        `REJEU SOUS UN AUTRE INSTRUMENT : la mesure porte \`${ancienne}\`, le squelette vient d'être `
        + `réécrit en \`${instrument.version}\`. La mesure n'est PAS réécrite (un état ne se refait `
        + "pas) ; les deux tables divergent jusqu'à ce que le professeur tranche.")
    }
  }

  return {
    competence, appels,
    ecrite: ecriture.ecrite, dejaLa: ecriture.dejaLa,
    lettre_equivalente: agrege.lettre_equivalente,
    squelette,
    alerte: alertes.length ? alertes.join(' · ') : null,
  }
}

/**
 * L'écriture du squelette. L'index unique `(dépôt, compétence, version)` de
 * C4-L1 est le garde : une reprise met à jour la ligne existante, elle n'en crée
 * jamais une seconde (`07-` §1.2 ; piège 8).
 */
async function upsertSquelette(
  admin: Admin, depotId: string, competence: Competence, version: Version,
  champs: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from('exercices_squelettes')
    .upsert({ depot_id: depotId, competence, version, ...champs, updated_at: new Date().toISOString() },
      { onConflict: 'depot_id,competence,version' })
  if (error) console.error(`[chaine] squelette non écrit — ${error.code} ${error.message}`)
}

/** Le squelette d'une version — ce que la version finale compare à la sienne. */
async function lireSquelette(
  admin: Admin, depotId: string, competence: Competence, version: Version,
  colonne: 'artefact_extraction' | 'artefact_jugement' = 'artefact_extraction',
): Promise<unknown | null> {
  const { data, error } = await admin.from('exercices_squelettes')
    .select(colonne)
    .eq('depot_id', depotId).eq('competence', competence).eq('version', version)
    .maybeSingle()
  if (error) {
    console.error(`[chaine] squelette illisible (${competence} ${version}) — ${error.code} ${error.message}`)
    return null
  }
  return (data as unknown as Record<string, unknown> | null)?.[colonne] ?? null
}

// ── Le retour ───────────────────────────────────────────────────────────────

async function engendrerLeRetour(
  admin: Admin,
  a: {
    ctx: ContexteDepot; version: Version; modele: string
    squelettes: SqueletteServi[]
    squelettesVf?: SqueletteServi[]
    registre: Registre | null; cible: Competence | null
  },
): Promise<{ ecrit: boolean; appels: number; alertes: string[] }> {
  const { ctx, version, modele, squelettes, cible } = a
  const alertes: string[] = []
  if (!cible) return { ecrit: false, appels: 0, alertes: ['aucune cible : pas de retour'] }

  // « Le REGISTRE t'est donné, tu ne l'élis pas — l'élection est une sortie de
  //   couche 3, à C4-L2. Son PREMIER SIGNAL te concerne dès maintenant : hors
  //   `evaluee`, […] retour DESCRIPTIF, SANS AUCUN PALIER ATTRIBUÉ » (piège 34).
  const evaluee = ctx.statutsRecette[cible] === 'evaluee'
  const registre: Registre = evaluee ? (a.registre ?? 'descriptif') : 'descriptif'
  if (!evaluee && a.registre && a.registre !== 'descriptif') {
    alertes.push(`registre « ${a.registre} » ignoré : ${cible} n'est pas \`evaluee\` (01- §8.7, signal 1)`)
  }
  // « `interrogatif` ne vaut qu'en v1 » (piège 35 ; §4, règle 8).
  const registreServi: Registre =
    version === 'vf' && registre === 'interrogatif' ? 'descriptif' : registre
  if (registreServi !== registre) {
    alertes.push('`interrogatif` ne vaut qu\'en v1 : le retour final DIT ce qui est réussi et raté')
  }

  // Les compétences ADMISES au retour sont celles de la version COURANTE, jamais
  // celles de la v1 relue : en vf, un squelette v1 manquant vidait la liste et
  // faisait refuser chaque point du retour, en accusant le modèle.
  const servies = a.squelettesVf ?? squelettes
  // « Une SONDE est silencieuse : elle ne produit AUCUN RETOUR » (`01-` §1, principe 4).
  const sondes = sondesDeLExercice(ctx)
  const competencesAdmises = servies.map((s) => s.competence).filter((c) => !sondes.has(c))
  const codesObservables = servies.flatMap((s) => {
    const e = etatCompetence(s.competence)
    return e.instrument ? Object.keys(e.instrument.observables_mesure) : []
  })
  if (sondes.size) {
    alertes.push(`${sondes.size} compétence(s) sondée(s) écartée(s) du retour — une sonde est silencieuse`)
  }
  if (!competencesAdmises.length) {
    return { ecrit: false, appels: 0, alertes: [...alertes, 'toutes les compétences mesurées sont des sondes : aucun retour'] }
  }

  const couches: CoucheCompetence[] = servies
    .filter((s) => !sondes.has(s.competence))
    .map((s) => ({
      competence: s.competence,
      // ⚠️ « le vocabulaire de la grille » (§4) vit DANS LA FICHE et n'est pas
      //    dérivable d'ailleurs : il s'ajoutera au branchement le jour où un slot
      //    s'ouvre. Vide ici, et dit au relevé — jamais inventé.
      vocabulaire: [],
      correspondance: ctx.correspondance[s.competence] ?? [],
    }))

  // L'état antérieur vient de la FENÊTRE D'ÉVIDENCE, et n'existe pas à la semaine 1.
  const fenetre = await fenetreDEvidence(admin, ctx.eleveId, cible)
  const etatAnterieur = fenetre.length
    ? (ctx.correspondance[cible] ?? []).map((c) => ({
      observable_nom: c.dimension_eleve,
      tendance: resumerTendance(fenetre, c.observable_code),
    })).filter((x) => x.tendance !== '')
    : null

  const { systeme, message } = assemblerRetour(CALAME.gabarit, {
    moment: version,
    registre: registreServi,
    palierAttribue: evaluee,
    competencePrimaire: cible,
    couchesCompetence: couches,
    coucheType: {
      consigne: ctx.consigne, grain: ctx.grain, servable: ctx.servable,
      patronProduction: ctx.patronProduction,
    },
    squelettes,
    squelettesVf: a.squelettesVf,
    retourV1: version === 'vf' ? await lireRetourV1(admin, ctx.depotId) : null,
    etatAnterieur,
  })

  try {
    const r = await appeler<unknown>({
      phase: 'retour', modele,
      // Le rôle en système, LE GABARIT SUBSTITUÉ en préfixe cacheable — et une
      // seule fois. Empiler le gabarit brut à côté du substitué donnait au modèle
      // DEUX exemplaires contradictoires du même contrat, dont un où la règle 8
      // se lit littéralement « REGISTRE : {{REGISTRE}} ». Le préfixe reste
      // cachable : il est stable pour un même (compétence, moment, registre).
      systeme: 'Tu es Calame. Tu écris à un élève, et tu suis le contrat qui suit.',
      prefixeCacheable: systeme,
      message,
      // La validation fine est faite par `controlerRetour` juste après.
      forme: { type: 'objet_libre' },
      attribution: { module: MODULE_COUT, eleveId: ctx.eleveId, classeId: ctx.classeId,
        depotId: ctx.depotId, competence: cible, version },
      relancesMax: 1,
    })

    const controle = controlerRetour(r.valeur, {
      moment: version, grain: ctx.grain, codesObservables, competencesAdmises,
    })
    if (!controle.verdict.ok || controle.controle.refus.length) {
      const motifs = controle.verdict.ok
        ? controle.controle.refus
        : controle.verdict.refus.map((x) => `${x.chemin} ${x.motif}`)
      alertes.push(`retour refusé : ${motifs.join(' | ')}`)
      return { ecrit: false, appels: r.appels, alertes }
    }

    const segmente = segmenter(controle.verdict.valeur, ctx.depotId, version)
    const ecriture = await ecrireRetour(admin, ctx.depotId, version, registreServi, segmente)
    if (!ecriture.ecrit) alertes.push(`retour NON écrit en base : ${ecriture.erreur}`)
    return { ecrit: ecriture.ecrit, appels: r.appels, alertes }
  } catch (e) {
    if (e instanceof SortieNonConforme) {
      alertes.push(`retour non conforme après relance : ${e.motifs.join(' | ')}`)
      return { ecrit: false, appels: e.appels, alertes }
    }
    if (e instanceof AppelInterrompu) {
      alertes.push(`retour interrompu au transport : ${e.message}`)
      return { ecrit: false, appels: e.appels, alertes }
    }
    throw e
  }
}

/**
 * `exercices_retours` — le texte SEGMENTÉ, le registre SERVI (la trace, jamais
 * l'état), et l'action de révision / le pont, que LE CODE journalise (piège 32).
 */
async function ecrireRetour(
  admin: Admin, depotId: string, version: Version, registre: Registre, r: RetourSegmente,
): Promise<{ ecrit: boolean; erreur: string | null }> {
  const moment = version === 'v1' ? 'chaud' : 'final'
  const { error } = await admin.from('exercices_retours').upsert({
    depot_id: depotId,
    moment,
    texte: r.points,
    action_revision: r.action_revision ? { texte: r.action_revision } : null,
    feed_forward: r.feed_forward,
    registre_servi: registre,
    points_ids: r.points.map((p) => p.id),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'depot_id,moment' })
  if (error) {
    console.error(`[chaine] retour non écrit — ${error.code} ${error.message}`)
    return { ecrit: false, erreur: `${error.code} ${error.message}` }
  }
  return { ecrit: true, erreur: null }
}

/**
 * Le retour de la v1 — « et, en version finale, LE RETOUR QUI LUI AVAIT ÉTÉ
 * DONNÉ SUR SA v1 » (`07-` §4, ce que le modèle reçoit). Il se lit dans sa forme
 * SEGMENTÉE, celle-là même que la chaîne a écrite.
 */
async function lireRetourV1(admin: Admin, depotId: string): Promise<RetourSegmente | null> {
  const { data } = await admin.from('exercices_retours')
    .select('texte, action_revision, feed_forward')
    .eq('depot_id', depotId).eq('moment', 'chaud').maybeSingle()
  const l = data as unknown as { texte: unknown; feed_forward: string | null } | null
  if (!l || !Array.isArray(l.texte)) return null
  return { points: l.texte as RetourSegmente['points'], action_revision: null, feed_forward: l.feed_forward }
}

/** Une phrase de tendance, en langue de la DIMENSION — jamais le code (RR4). */
function resumerTendance(
  fenetre: ReadonlyArray<{ observables: Record<string, unknown> }>, code: string,
): string {
  const valeurs = fenetre.map((m) => m.observables?.[code]).filter((v) => v !== undefined && v !== 'n/a')
  if (!valeurs.length) return ''
  return `${valeurs.length} mesure(s) antérieure(s) : ${valeurs.map((v) => String(v)).join(', ')}`
}

// ── Le tour de file ─────────────────────────────────────────────────────────

/**
 * Traite les jobs réclamables. C'est ce que le déclencheur appelle ; il ne
 * connaît ni les compétences, ni les modèles, ni la facture.
 */
export async function tourDeFile(
  admin: Admin, jobs: Job[], config: ConfigChaine,
): Promise<Array<{ job: Job; bilan?: BilanDepot; erreur?: string }>> {
  const sorties: Array<{ job: Job; bilan?: BilanDepot; erreur?: string }> = []
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    try {
      const bilan = await traiterDepot(admin, job.depot_id, job.etape === 'mesure_vf' ? 'vf' : 'v1', { config })
      await terminerJob(admin, job, { statut: 'abouti', message: resumeBilan(bilan) })
      sorties.push({ job, bilan })
    } catch (e) {
      if (e instanceof ChaineSuspendue) {
        // Suspension GLOBALE : le tour s'arrête, et TOUS les jobs réclamés sont
        // reposés — pas seulement celui-ci. « En laissant les dépôts en file :
        // rien ne se perd […] le traitement reprend à la réouverture » (piège 49).
        // Les laisser sous bail leur brûlait une tentative pour rien.
        for (const restant of jobs.slice(i)) await reposerJob(admin, restant, e.message)
        sorties.push({ job, erreur: e.message })
        break
      }
      if (e instanceof DepotInexploitable) {
        // Panne LOCALE et PERMANENTE : le job se clôt DÉFINITIVEMENT, et la file
        // continue. Le reposer gelait le tour entier, à chaque tour ; le laisser
        // réessayer trois fois n'aurait fait que retarder le même constat.
        await terminerJob(admin, job, { statut: 'echoue', message: e.message, definitif: true })
        sorties.push({ job, erreur: e.message })
        continue
      }
      const message = e instanceof Error ? e.message : String(e)
      await terminerJob(admin, job, { statut: 'echoue', message })
      sorties.push({ job, erreur: message })
    }
  }
  return sorties
}

/** L'`instrument_version` que porte la mesure déjà écrite pour ce couple. */
async function instrumentDeLaMesure(
  admin: Admin, depotId: string, competence: Competence,
): Promise<string | null> {
  const { data } = await admin.from('competences_mesures')
    .select('instrument_version').eq('depot_id', depotId).eq('competence', competence).maybeSingle()
  return (data as unknown as { instrument_version: string | null } | null)?.instrument_version ?? null
}

function resumeBilan(b: BilanDepot): string {
  return `${b.competencesMesurees.length} mesurée(s), ${b.mesuresEcrites} écrite(s), `
    + `${b.mesuresDejaLa} déjà là, retour ${b.retourEcrit ? 'écrit' : 'non écrit'}, `
    + `${b.appels} appel(s), ${Math.round(b.dureeMs / 1000)} s`
}
