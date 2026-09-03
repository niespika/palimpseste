import 'server-only'
import { PREFIXE_ETAT_PERDU, motifDesEtatsPerdus } from './bilan-motifs'
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
import { controlerFideliteP1, motifDeFidelite } from './fidelite-p1'
import { formeMinimale, releveVide } from './formes-minimales'
import { alerteTranscriptionIncertaine, motifDeTranscription } from './transcription-incertaine'
import { appelsDeLErreur, depotAAtteintSonPlafond } from './couts'
import {
  competencesOuvertes, etatCompetence, modeNonCouvert, refusFormeCode2, valeursDesParametres,
  CALAME, FOURNISSEURS_NATIFS,
  type BranchementCompetence, type ContexteBranchement, type InstrumentCompetence,
  type SpecExtraction,
} from './instruments'
import {
  messageDuGabarit, refusSlotsExtraction, refusSlotsJugement, separerTete, slotsDu,
} from './slots'
import { modeleDeLaChaine } from './modele'
import { messageAvecMateriau, tentativeDeSortieDeBloc } from './anti-injection'
import { appliquerObservablesMesure } from './observables'
import {
  attacherDelta, ecrireMesure, entreesDesRegles, fenetreDEvidence,
  type LigneMesure,
} from './mesures'
import { traiterLeMonitoring } from './monitoring'
import { trancheDeReference } from './tranche'
import {
  assemblerGabarit, assemblerRetour, controlerRetour, segmenter,
  type CoucheCompetence,
} from './retour'
// Le FICHIER DE PERSONNALITÉ PARTAGÉ — l'identité et le `ton`, reçus, jamais
// recopiés (`07-` §4). ⚠️ `REGISTRE` est ici le registre de LANGUE : il ne
// touche jamais `{{REGISTRE}}`, qui est le registre de RETOUR du `01-` §8.7.
import { IDENTITE, REGISTRE as TON_PARTAGE } from '@/utils/ia-commun'
import { mettreEnFile, remettreEnFile, reposerJob, terminerJob, type Job } from './file'
import type { Lieu,Competence, Registre, RetourSegmente, Version } from './types'

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
  /** ⭐ Renseigné en RÉPÉTITION À BLANC : le retour qui aurait été écrit. */
  retourEngendre?: RetourSegmente | null
  monitoring: { mesures: number; motifs: string[] }
  appels: number
  /**
   * ⭐ L'INSTRUMENTATION DE `C4L7-7`, posée le 24/08 — la première fois que ce
   *    fichier était touché depuis le constat.
   *
   * Le défaut : `bilan.appels` a annoncé **7** quand la base en portait **8**,
   * une fois, sans se reproduire. Il est INTERMITTENT, et son origine n'a
   * jamais été établie : `expression` ne déclare qu'UNE extraction, et les
   * seuls émetteurs de `phase: 'p1'` sont attribués. Un chiffre de diagnostic
   * qui ment une fois sur deux ne se débusque pas en le relisant : il faut
   * qu'il se DÉNONCE lui-même, à chaque tour.
   *
   * · `passages` — combien de fois une chaîne de compétence a été ENTRÉE ;
   * · `appelsEnBase` — ce que `api_couts` porte RÉELLEMENT pour ce tour,
   *   c'est-à-dire après moins avant.
   *
   * ⚠️ `appels` NE CHANGE PAS DE SENS : il reste la somme que les étages
   *    remontent, et il reste un chiffre de DIAGNOSTIC. Les deux gardes —
   *    `controlerLaFacture` et `appelsDuDepot` — lisent la base et ne passent
   *    pas par ce bilan (piège 72). On n'a rien déplacé : on a ajouté un témoin.
   */
  passages: number
  /** `null` quand la base est illisible — on ne fabrique pas un zéro. */
  appelsEnBase: number | null
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
  // ⭐ 02/09 — la copie est-elle une reconstruction, et à quel point ? Alerte seule.
  const ocr = alerteTranscriptionIncertaine({
    version, origine: version === 'v1' ? ctx.origineV1 : ctx.origineVf, seuil: config.seuilConfianceOcr,
  })
  if (ocr) alertes.push(ocr)
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
      'cible du retour INDÉTERMINÉE : ni décision de routeur ni `cible_primaire`, et '
      + `${mesurees.length} compétences mesurées — « ${cible} » sert par convention `
      + '(ordre alphabétique), pas par intention. '
      + 'Le partage primaire / secondaire / sonde appartient à C4-L2 (01- §1).')
  }
  const coexistence = alerteDeCoexistence(ctx)
  if (coexistence) alertes.push(coexistence)
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
  // ⭐ `C4L7-7` — on compte les ENTRÉES, pas les retours : une chaîne qui lève
  //    est quand même passée, et ses appels sont quand même payés.
  let passages = 0
  const regles = await Promise.allSettled(competencesFroides.map(async (c) => {
    const etat = etatCompetence(c)
    if (!etat.ouverte || !etat.instrument || !etat.branchement) {
      return { competence: c, ecartee: etat.motif ?? 'compétence fermée', appels: 0 }
    }
    passages += 1
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
    // ⭐ C4-L11 — LE COMPTE D'APPELS NE SE PERD PLUS ICI. `SortieNonConforme` et
    //    `AppelInterrompu` portent tous deux un `appels` en lecture seule,
    //    « les appels RÉELLEMENT dépensés avant l'abandon — L'APPELANT LES
    //    COMPTE » (`appel.ts`). L'appelant ne les comptait pas : sur un
    //    `rejected`, le motif partait en alerte et le compte tombait, alors que
    //    les lignes étaient déjà écrites au journal (`bilan.appels = 0` avec
    //    trois lignes en base, constaté en vrai).
    //    ⚠️ C'est un CHIFFRE DE DIAGNOSTIC, pas une garde : « aucune décision
    //    n'en dépend — le plafond par dépôt se lit au nombre de lignes en
    //    base ». Les deux gardes — `controlerLaFacture` et `appelsDuDepot` —
    //    ne passent pas par ce bilan et ne changent pas.
    appels += appelsDeLErreur(r.reason)
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

  // ⭐⭐ `C4L7-7` — LA CONFRONTATION, À CHAQUE TOUR. `dejaFaits` a été lu AVANT
  //    que la chaîne parte ; on relit maintenant, et la différence est ce que ce
  //    tour a RÉELLEMENT écrit au journal. Si le bilan et la base divergent,
  //    l'écart part en alerte AVEC SES DEUX CHIFFRES — c'est ce qui manquait le
  //    jour où « 7 annoncés, 8 en base » n'a laissé aucune trace exploitable.
  // ⚠️ `appelsDuDepot` rend `+Infinity` quand la lecture échoue : une base
  //    illisible ne doit pas fabriquer un faux écart. On le dit, et on n'accuse
  //    personne.
  const apresLeTour = await appelsDuDepot(admin, depotId)
  const appelsEnBase = Number.isFinite(apresLeTour) && Number.isFinite(dejaFaits)
    ? apresLeTour - dejaFaits
    : null
  if (appelsEnBase === null) {
    alertes.push('témoin d’appels indisponible : `api_couts` illisible sur ce tour — '
      + 'le bilan n’a pas pu être confronté à la base.')
  } else if (appelsEnBase !== appels) {
    alertes.push(`⚠️ ÉCART DE COMPTE D'APPELS — le bilan annonce ${appels}, la base en porte `
      + `${appelsEnBase} sur ce tour (${passages} chaîne(s) de compétence entrée(s), `
      + `version ${version}). C'est le défaut C4L7-7, et il vient de se reproduire : `
      + `le chiffre de diagnostic ment, les gardes lisent la base et tiennent.`)
  }

  // ⭐⭐ C4-L12 — LE MOTEUR PREND LA SUITE. « Tu écris des MESURES ; LE MOTEUR EN
  //    FERA DES LETTRES » (`utils/chaine/mesures.ts`) : la chaîne ne touche
  //    toujours ni `competences_niveaux`, ni `competences_escalade`, ni
  //    `competences_montee` — elle DÉLÈGUE, ici, une fois les mesures écrites.
  //    ⚠️ On appelle aussi en `vf` : elle n'écrit aucune mesure, mais elle
  //    ATTACHE LE DELTA, qui est le signal de réceptivité de N2 (§8.4).
  //    ⚠️ Un incident du moteur ne casse jamais le retour : il part en alerte.
  const touchees = competencesFroides.filter((c) => ouvertes.has(c))
  if (touchees.length) {
    try {
      const [{ ecrireLEtatApresMesure }, { lireFuseau }] = await Promise.all([
        import('@/utils/moteur/etat-serveur'), import('@/utils/fuseau-serveur'),
      ])
      const bilanEtat = await ecrireLEtatApresMesure(
        admin, ctx.eleveId, touchees, await lireFuseau())
      alertes.push(...bilanEtat.erreurs.map((e) => `${PREFIXE_ETAT_PERDU}${e}`))
      for (const x of bilanEtat.ecartees) {
        alertes.push(`état de ${x.competence} non réécrit — ${x.motif}`)
      }
    } catch (e) {
      alertes.push(`${PREFIXE_ETAT_PERDU}${(e as Error).message} — la lettre n'a pas bougé.`)
    }
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
    appels, passages, appelsEnBase, dureeMs, alertes,
  }
}

// ── Qui l'exercice mesure, et qui la chaîne écarte ──────────────────────────

/**
 * « La mesure tourne ? `evaluee` : oui · `mesuree_silencieusement` : OUI, on
 * mesure et on stocke · `differee` : NON, on ne mesure pas » (`07-` §5).
 * Plus la clause granulaire, qui écarte toute compétence dont la fiche n'est pas
 * DÉRIVÉE ET BRANCHÉE — la dérivation lit toute fiche *relue et validée*
 * (C4-L10), et le branchement s'écrit une compétence à la fois.
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
      // ⭐ Ce motif-là est SERVI : il part dans `exercices_jobs.dernier_message`
      //    par `motifDesEcartees()`, et l'écran prof de la passation le lit
      //    (`etatDesJobs` → `utils/passation/depots.ts`). Un motif faux ne se lit
      //    pas comme un commentaire faux — il se croit.
      // ⚠️ C5-L3, 27/08 — CETTE PHRASE ÉTAIT FAUSSE JUSQU'À CE JOUR, et c'est le
      //    smoke prof qui l'a trouvée : `competencesEcartees` ne vivait que dans
      //    la valeur de retour EN MÉMOIRE de `traiterDepot`, et **aucun des deux
      //    résumés persistés ne la mentionnait**. Le refus était juste, et muet.
      ecartees.push({ competence: nom, motif: etat.motif ?? 'compétence non branchée à la chaîne' })
      continue
    }
    // ⭐⭐⭐ C5-L3 — LA PORTE DE MODE. C'est ici, et nulle part ailleurs, que
    //    « des compétences dont la grille réceptive existe » cesse d'être une
    //    phrase de mission pour devenir une garde.
    const refus = modeNonCouvert(c, ctx.modesParCompetence[nom] ?? [], etat.branchement)
    if (refus) {
      ecartees.push({ competence: nom, motif: refus })
      continue
    }
    mesurees.push(c)
  }
  return { mesurees, ecartees }
}

/**
 * La compétence que le retour commande — « L'EXERCICE PORTE LA CIBLE. Un exercice
 * a UNE cible primaire : c'est elle qui commande le retour » (`01-` §1, point 1).
 *
 * ⭐ C4-L11 — L'ORDRE DE LECTURE EST CELUI DU `07-` §1.1, ET IL A TROIS CRANS :
 *      1. la DÉCISION du routeur (`routeur_decisions.cible_retenue`) — « la
 *         cible est la sortie de la couche 2 et vit à la décision » ;
 *      2. `exercices.cible_primaire` — la voie du PROFESSEUR : « l'écran de
 *         conception la lui demande, parmi les compétences que son exercice
 *         mesure, et UNE SEULE » ;
 *      3. le repli ALPHABÉTIQUE, assumé comme convention.
 *
 * ⚠️ LES DEUX PREMIERS NE COEXISTENT JAMAIS PAR CONSTRUCTION : « sur la voie du
 *    routeur elle reste NULL », « sur la voie du professeur, l'écran de
 *    conception la lui demande ». S'ils coexistent, ce n'est pas un cas à
 *    trancher en silence — `alerteDeCoexistence()` le DIT.
 *
 * ⚠️⚠️ ET LA PREMIÈRE BRANCHE EST DORMANTE AUJOURD'HUI — constaté sur pièces par
 *    C4-L11 (23/08), et ce n'est PAS un défaut de ce lot. Le moteur du routeur
 *    est écrit et éprouvé (`utils/routeur/`, fonctions PURES), mais **RIEN NE
 *    PERSISTE SA DÉCISION** : aucun code n'écrit `routeur_decisions.cible_retenue`
 *    — le seul `insert` du dépôt est le journal d'override, qui pose
 *    `regle_declenchee: 'override_prof'` sans cible, et sur la branche même où le
 *    dépôt n'a PAS de décision —, et rien n'écrit
 *    `exercices_depots.routeur_decision_id`. En base : 0 ligne de
 *    `routeur_decisions`, 0 dépôt sur 25 qui en porte une.
 *    ⭐ CE QUE ÇA CHANGE, ET C'EST DANS L'AUTRE SENS : avant C4-L11, **cent pour
 *    cent des dépôts tombaient sur le repli alphabétique**, la voie du professeur
 *    comprise. La `cible_primaire` est donc aujourd'hui **le seul domicile qui
 *    puisse empêcher le repli** — ce qui rendait ce chantier plus nécessaire, pas
 *    moins. L'écrivain de la décision n'est à l'inventaire d'aucun lot que ce
 *    lot-ci ait le droit de lire ; la question est posée au relevé de C4-L11.
 *
 * ⚠️ Sans aucun des deux, RIEN NE HIÉRARCHISE les compétences que l'instance
 *    déclare : elles vivent dans un `jsonb`, dont Postgres n'ordonne les clés ni
 *    par saisie ni par intention — il les range par longueur puis par octets.
 *    « La première compétence mesurée » serait, en pratique, celle dont le nom
 *    est le plus court. D'où le repli alphabétique, déterministe et sans
 *    prétention, que `cibleIndeterminee()` dénonce dès qu'il sert.
 *
 * ⭐ Ce que la cible engage, et pourquoi l'échéance était ferme : « en version
 *    finale, les appels froids ne se rejouent que pour la SEULE compétence visée
 *    par le retour (`01-` §11) — une cible tirée de l'ordre d'un tableau ferait
 *    porter le `delta_v1_vf`, donc le signal de réceptivité de N2, sur une
 *    compétence que personne n'a choisie. »
 */
export function cibleDuRetour(ctx: ContexteDepot, mesurees: readonly Competence[]): Competence | null {
  const declaree = ctx.decision?.cibleRetenue as Competence | undefined
  if (declaree && mesurees.includes(declaree)) return declaree
  if (ctx.ciblePrimaire && mesurees.includes(ctx.ciblePrimaire)) return ctx.ciblePrimaire
  return [...mesurees].sort()[0] ?? null
}

/**
 * Vrai quand la cible relève du REPLI — donc quand NI la décision NI la
 * `cible_primaire` ne portent une compétence mesurée — et que plus d'une
 * compétence est en jeu. L'alerte ne se supprime pas : elle se resserre.
 */
export function cibleIndeterminee(ctx: ContexteDepot, mesurees: readonly Competence[]): boolean {
  const declaree = ctx.decision?.cibleRetenue as Competence | undefined
  if (declaree && mesurees.includes(declaree)) return false
  if (ctx.ciblePrimaire && mesurees.includes(ctx.ciblePrimaire)) return false
  return mesurees.length > 1
}

/**
 * La COEXISTENCE que la source dit impossible — décision du routeur ET
 * `cible_primaire` sur la même instance.
 *
 * « Les deux premiers ne coexistent jamais par construction (`07-` §1.1 : NULL
 *   sur la voie du routeur, posée sur la voie du professeur) — si tu constates
 *   qu'ils coexistent, NE CHOISIS PAS EN SILENCE. » La décision l'emporte, parce
 *   qu'elle est la sortie de la couche 2 ; mais le fait se dit, à chaque dépôt
 *   concerné, plutôt que d'attendre qu'on le remarque.
 *
 * ⚠️ Elle NE PEUT PAS SE LEVER AUJOURD'HUI, et c'est cohérent : rien ne persiste
 *    de décision de routeur (voir `cibleDuRetour`). C'est une garde POSÉE
 *    D'AVANCE, pour le jour où l'écrivain de la décision existera — pas une
 *    alerte qu'on a vue tomber.
 */
export function alerteDeCoexistence(ctx: ContexteDepot): string | null {
  const declaree = ctx.decision?.cibleRetenue as Competence | undefined
  if (!declaree || !ctx.ciblePrimaire) return null
  return 'COEXISTENCE que le `07-` §1.1 dit impossible : cette instance porte À LA FOIS une '
    + `décision de routeur (« ${declaree} ») et une \`cible_primaire\` (« ${ctx.ciblePrimaire} ») — `
    + 'or la colonne « reste NULL sur la voie du routeur ». La décision l\'emporte (elle est la '
    + 'sortie de la couche 2), et le fait est signalé, pas tranché en silence.'
}

/**
 * Les compétences SONDÉES sur cet exercice. « Une sonde est SILENCIEUSE : elle
 * ne produit AUCUN RETOUR » (`01-` §1, principe 4 ; §8.9) — elle se mesure, elle
 * ne se dit pas. Elles sortent donc du retour, et de son plafond.
 */
export function sondesDeLExercice(ctx: ContexteDepot): Set<string> {
  return new Set(ctx.decision?.sondes ?? [])
}

/**
 * Les valeurs des slots d'UNE phase d'extraction — et le refus, s'il y a lieu.
 *
 * Le contrôle est celui du banc (`verifie_slots_p1`), joué ici sur les VALEURS.
 * Sa version au CHARGEMENT, sur les seules déclarations, vit à
 * `verifierCoherence()` : c'est là que le refus doit tomber d'abord, avant qu'un
 * appel ait été dépensé. Ici, c'est le filet — et il attrape ce qu'une
 * déclaration ne peut pas voir : un crochet qui ne rend pas ce qu'il annonce, et
 * un contexte qui ne porte pas ce que le crochet lui demandait.
 *
 * ⚠️ « Une clé préfixée d'un tiret bas rendue par un crochet pré-phase N'EST PAS
 *    UN SLOT : c'est un calcul que le banc range DANS LE CONTEXTE, sous le même
 *    nom, à disposition des crochets suivants et de `code1` » (`CONTRAT` §2).
 */
function slotsDeLaPhase(
  gabarit: string,
  spec: SpecExtraction,
  ctxPhase: ContexteBranchement,
  prives: Record<string, unknown>,
): { slots: Record<string, string>; refus: string | null } {
  const rendu = spec.pre ? spec.pre(ctxPhase) : {}
  const fournis: Record<string, string | null> = {}
  for (const [cle, valeur] of Object.entries(rendu)) {
    if (cle.startsWith('_')) { prives[cle] = valeur; continue }
    fournis[cle] = valeur == null ? null : String(valeur)
  }

  const vides = Object.keys(fournis).filter((k) => fournis[k] === null).sort()
  if (vides.length) {
    return { slots: {}, refus: `REFUS : le contexte de l'exercice ne porte pas de quoi servir `
      + `${vides.join(', ')} à ${spec.tetePrompt}.` }
  }
  // La déclaration et le rendu doivent coïncider : la première est ce que le
  // chargement contrôle, le second ce qui part au modèle. Les laisser diverger,
  // c'est contrôler autre chose que ce qui s'exécute.
  const declares = [...spec.slotsFournis].sort()
  const rendus = Object.keys(fournis).sort()
  if (declares.join(' ') !== rendus.join(' ')) {
    return { slots: {}, refus: `REFUS : ${spec.tetePrompt} DÉCLARE fournir `
      + `[${declares.join(', ')}] et rend [${rendus.join(', ')}] — la déclaration est ce que le `
      + 'chargement contrôle, le rendu est ce qui part au modèle.' }
  }
  const refus = refusSlotsExtraction(gabarit, rendus, FOURNISSEURS_NATIFS, spec.tetePrompt)
  if (refus.length) return { slots: {}, refus: refus.join(' | ') }

  const slots: Record<string, string> = {}
  for (const nom of slotsDu(gabarit)) {
    slots[nom] = fournis[nom] ?? ctxPhase.contexteExercice[nom] ?? ''
  }
  return { slots, refus: null }
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

/**
 * ⭐⭐ LA CHAÎNE D'UNE COMPÉTENCE — et, depuis le 31/08, en LECTURE SEULE au
 *    besoin. C'est le point d'entrée du banc de comparaison de modèles.
 *
 * ⛔⛔ POURQUOI LE BANC PASSE ICI, ET NE SE RÉÉCRIT PAS À CÔTÉ. Le `07-` §6
 *    exige, avant d'allumer le partage de modèles, « une contre-épreuve sur
 *    squelettes gelés, compétence par compétence : même lettre, ou tout passe au
 *    modèle fort ». Un banc qui refait l'orchestration à côté ne compare pas les
 *    modèles : il compare DEUX CHAÎNES. *Le dépôt a déjà payé cette leçon —
 *    « un miroir du code doit copier LE tokeniseur », neuf réparations justes
 *    refusées sur dix-huit parce que le miroir divergeait de l'original.*
 *    D'où un drapeau, et non un second chemin.
 *
 * @param a.sansEcriture — n'écrit NI squelette, NI delta, NI mesure. Le reste
 *   est identique à l'octet : mêmes prompts, mêmes crochets, même agrégation,
 *   même lettre. ⚠️ Les appels de modèle, eux, sont bien passés et **journalisés
 *   dans `api_couts`** : un banc coûte, et un coût qu'on ne journalise pas est un
 *   coût qu'on ne verra jamais.
 *   ⭐ `ecrite` et `dejaLa` rendent alors `false` — rien n'a été écrit, et le
 *   banc ne doit pas croire le contraire.
 */
/**
 * Ce que l'étage de jugement exigera — son gabarit, son slot de document, et
 * les slots que `preP2` sert depuis le contexte de l'exercice. ⭐ PUR, et appelé
 * DEUX FOIS : avant P1, pour refuser à zéro appel ce que le contexte ne porte
 * pas ; après Code1, pour servir les valeurs. « Un slot que `pre_p2` sert à
 * `None` l'arrête aussi : c'est ainsi qu'un module dit "le contexte ne porte pas
 * ce qu'il me faut" sans jamais lever d'exception ni inventer une valeur. »
 */
function preparerLeJugement(
  branchement: BranchementCompetence, instrument: InstrumentCompetence, ctx: ContexteBranchement,
): { refus: string; gabaritP2?: undefined; slotDocument?: undefined; slotsPreP2?: undefined }
  | { refus: null; gabaritP2: string; tetePrompt: string; slotDocument: string; slotsPreP2: Record<string, string> } {
  const specP2 = branchement.jugement(ctx)
  const gabaritP2 = instrument.prompts[specP2.tetePrompt]
  if (!gabaritP2) {
    return { refus: `prompt de jugement « ${specP2.tetePrompt} » absent de l'instrument dérivé` }
  }
  // Le slot du DOCUMENT, plus ce que `preP2` sert — « ce que le CONTEXTE de
  // l'exercice donne » (`CONTRAT` §2). Le contrôle est le même qu'au chargement ;
  // ici il porte les VALEURS, et un `null` servi arrête la mesure en le nommant.
  const { slotDocument, refus } = refusSlotsJugement(
    gabaritP2, specP2.slotDocument ?? null, specP2.slotsFournis ?? [], [])
  if (refus.length || !slotDocument) {
    return { refus: refus.join(' | ') || 'REFUS : le prompt de jugement n\'a pas de slot de document' }
  }
  const slotsPreP2: Record<string, string> = {}
  for (const [nom, valeur] of Object.entries(specP2.preP2 ? specP2.preP2(ctx) : {})) {
    if (valeur == null) {
      return { refus: `REFUS : \`preP2\` ne peut pas servir « ${nom} » — le contexte de l'exercice ne `
        + 'le porte pas (refusé avant tout appel)' }
    }
    slotsPreP2[nom] = valeur
  }
  return { refus: null, gabaritP2, tetePrompt: specP2.tetePrompt, slotDocument, slotsPreP2 }
}

async function chaineDUneCompetence(
  admin: Admin,
  a: {
    ctx: ContexteDepot; competence: Competence; version: Version; production: string
    modele: string; instrument: InstrumentCompetence; branchement: BranchementCompetence
    aideConsommee: number | null
    sansEcriture?: boolean
  },
): Promise<ResultatCompetence> {
  const sansEcriture = a.sansEcriture === true
  const { ctx, competence, version, production, modele, instrument, branchement } = a
  const modes = ctx.modesParCompetence[competence] ?? []
  let appels = 0
  const alertes: string[] = []

  // ── Temps 0 — `prepare_copie`. « Le texte donné à P1 » (`CONTRAT` §2). ─────
  // Structure le définit, et le contrat dit pourquoi : « les lignes vides sont
  // des frontières de blocs ». Absent, la production part telle quelle.
  const ctxAvantPreparation: ContexteBranchement = {
    modes,
    cran: ctx.cranCode,
    // « UN SEUL appel d'extraction quand le référent est LE COURS — l'aligneur ne
    //   tourne pas » (piège 6 ; `07-` §1.2). La synthèse en classe a le cours pour
    //   référent (`01-` §10) ; ailleurs, c'est la référence décomposée du texte.
    referent: ctx.referent,
    exceptionOrthographe: ctx.exceptionOrthographe,
    contexteExercice: {}, prives: {}, sorties: {},
    parametres: valeursDesParametres(instrument),
  }
  const copie = branchement.prepareCopie
    ? branchement.prepareCopie(production, ctxAvantPreparation)
    : production

  // ⭐⭐ C5-L3 — LA TRANCHE DE RÉFÉRENCE, calculée une fois par compétence.
  //    ⚠️ Ses alertes sont celles de l'ASYMÉTRIE : une valeur que le `02-` §6 A
  //       ne déclare pas atteint quand même le consommateur, et « c'est un vrai
  //       défaut, et il doit se voir ». Elles remontent au bilan du dépôt.
  //    ⭐ Ce qu'elle ÉCARTE, en revanche, ne part pas en alerte : une exclusion
  //       par règle est le fonctionnement normal. Elle se journalise en trace, où
  //       la recette la lit.
  const tranche = trancheDeReference(ctx.reference, competence, instrument)
  alertes.push(...tranche.alertes)
  if (tranche.ecarte.length) {
    console.info(`[chaine] tranche de référence — ${competence} : `
      + `${tranche.ecarte.length} unité(s) restreinte(s) par sa règle de lecture — `
      + tranche.ecarte.map((e) => `${e.ou} (${e.valeurs.join(', ')})`).join(' · '))
  }

  // LES FOURNISSEURS NATIFS DES SLOTS. `sujet` EST la consigne instanciée : la
  // table `exercices` porte la consigne et la PROVENANCE de ses matériaux, jamais
  // le texte d'un sujet distinct (`07-` §1.1) — c'est tout ce que la chaîne a, et
  // la consigne dit précisément « ce sur quoi on travaille ».
  const ctxBranchement: ContexteBranchement = {
    ...ctxAvantPreparation,
    contexteExercice: {
      sujet: ctx.consigne,
      consigne: ctx.consigne,
      copie,
      mode: modes.join(', '),
      // ⭐⭐ LA RÉFÉRENCE DÉCOMPOSÉE ET SON MATÉRIAU — descendus depuis
      //    `exercices_references` par `lireContexte`, et servis SÉRIALISÉS :
      //    `contexteExercice` ne porte que des textes, parce qu'un slot de
      //    prompt est un texte. Les crochets qui en ont besoin le reparsent
      //    (`armatureDe` au Questionnement, `referenceDuContexte` à la Synthèse).
      // ⛔ ABSENTS quand la référence n'est pas VALIDÉE, ou quand l'exercice n'en
      //    porte pas : le crochet sert alors son slot à `null`, et la mesure
      //    s'arrête EN LE NOMMANT. *Une clé absente et une clé vide ne disent pas
      //    la même chose — on n'écrit donc pas `''`.*
      // ⭐⭐⭐ C5-L3 — LA TRANCHE. « On ne passe à un consommateur que ce que sa
      //    règle lit » (`05-` §1) : la référence ne part pas entière, elle part
      //    RESTREINTE à ce que la règle de CETTE compétence déclare lire, et
      //    c'est ici — avant la sérialisation, donc avant tout prompt — que la
      //    restriction s'applique. *`valeursServies()` avait la règle et aucun
      //    consommateur ; le voici.*
      ...(ctx.reference != null ? { reference: JSON.stringify(tranche.reference) } : {}),
      ...(ctx.materiau ? { source: ctx.materiau } : {}),
    },
    prives: {},
    sorties: {},
  }

  // ── AVANT TOUT APPEL — ce que le juge exigera, vérifié à ZÉRO appel. ──────
  // ⭐⭐ 02/09/2026 — « `pre_p2` tourne AVANT P1 » (`CONTRAT` §2, `instruments.ts`),
  //    et la chaîne le faisait tourner APRÈS. Un slot de jugement que le contexte
  //    ne porte pas — le `corpus_cours` de la Connaissance, qu'aucune source ne
  //    déclare — refusait donc la mesure EN LA NOMMANT, mais après avoir PAYÉ P1 :
  //    cinq appels d'extraction en production pour cinq refus certains, avant que
  //    le statut `differee` ne la sorte de la chaîne. Le refus est le même ; il
  //    tombe maintenant avant le premier appel, quel que soit le statut de recette.
  //    ⚠️ Aucun crochet `jugement()` ni `preP2` ne lit `prives` ou `sorties`
  //    (vérifié sur les six branchements) : le contexte d'avant P1 suffit.
  {
    const avant = preparerLeJugement(branchement, instrument, ctxBranchement)
    if (avant.refus !== null) {
      return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
        alerte: avant.refus }
    }
  }

  // ── Temps 1 — P1. Un appel pour cinq compétences, DEUX pour la Synthèse. ──
  const artefactsP1: Record<string, unknown> = {}
  // Le contexte s'ENRICHIT à mesure : les calculs privés des crochets pré-phase,
  // et les sorties des phases déjà jouées (`CONTRAT` §2).
  const prives: Record<string, unknown> = {}
  const sorties: Record<string, unknown> = {}
  const specs = branchement.extractions(ctxBranchement)
  for (const spec of specs) {
    const gabarit = instrument.prompts[spec.tetePrompt]
    if (!gabarit) {
      return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
        alerte: `prompt d'extraction « ${spec.tetePrompt} » absent de l'instrument dérivé` }
    }
    const ctxPhase: ContexteBranchement = { ...ctxBranchement, prives: { ...prives }, sorties: { ...sorties } }
    const { slots, refus } = slotsDeLaPhase(gabarit, spec, ctxPhase, prives)
    if (refus) {
      return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
        alerte: refus }
    }
    // ⭐ LA SUBSTITUTION DES SLOTS. La tête du gabarit ne porte AUCUN slot : elle
    //    est identique d'une copie à l'autre, donc elle se cache. La queue porte
    //    les slots, chacun substitué SOUS BALISE — et le gabarit brut ne part
    //    jamais à côté du substitué.
    const { tete, queue } = separerTete(gabarit)
    const r = await appeler<Record<string, unknown>>({
      phase: 'p1', modele,
      systeme: 'Tu es un extracteur. Tu relèves, tu ne juges pas.',
      prefixeCacheable: tete,
      message: messageDuGabarit(queue, slots, 'Rends le relevé au format déclaré ci-dessus.'),
      // Le relevé d'une fiche a une forme qui FAIT FOI À LA FICHE (`03-` §1) :
      // on n'en connaît pas toutes les clés. ⭐ 02/09 — mais on en EXIGE celles
      // sans lesquelles rien ne se lit (`formes-minimales.ts`, `objet_ouvert`) :
      // `{}` n'est plus une sortie valide qui finit en lettre E.
      forme: formeMinimale(competence, spec.tetePrompt),
      attribution: { module: MODULE_COUT, eleveId: ctx.eleveId, classeId: ctx.classeId,
        depotId: ctx.depotId, competence, version },
    })
    appels += r.appels
    artefactsP1[spec.cle] = r.valeur
    sorties[spec.tetePrompt.toLowerCase()] = r.valeur
    // ⚠️ Alerte, pas refus : « aucune unité → Absent » écrit E, et le professeur
    //    doit savoir si c'est l'élève ou le modèle qui n'a rien fait.
    const vide = releveVide(competence, spec.tetePrompt, r.valeur, production)
    if (vide) alertes.push(vide)
  }
  const ctxEnrichi: ContexteBranchement = { ...ctxBranchement, prives, sorties }

  // ── LA FIDÉLITÉ DE P1, contrôlée AVANT que le juge ne lise le relevé ───────
  // ⭐⭐ 02/09/2026 — « toute citation verbatim rendue par P1 se contrôle contre
  //    la production » (`CONTRAT` §3) : quatre branchements sur six n'en avaient
  //    aucun, et P2 ne voit jamais la copie. Alerte seule, sur la PRODUCTION
  //    BRUTE (la copie préparée porte des repères qui ne sont pas de l'élève).
  const fidelite = controlerFideliteP1(competence, artefactsP1, production)
  if (fidelite.alerte) alertes.push(fidelite.alerte)

  // ── Temps 2 — CODE1. Il ne journalise rien : ce n'est pas un appel. ────────
  const prepare = branchement.code1(artefactsP1, ctxEnrichi)
  // « `document_p2` est OBLIGATOIRE dès que `code1` existe. Un module qui l'omet
  //   fait servir `null` à son juge, qui juge alors à vide — et c'est le SEUL
  //   défaut de ce contrat dont RIEN NE TÉMOIGNE » (`CONTRAT` §2). La chaîne en
  //   témoigne. ⚠️ La VALEUR peut être nulle ; c'est l'absence de la CLÉ qui est
  //   l'erreur.
  if (!('document_p2' in prepare)) {
    return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
      alerte: 'REFUS : `code1` ne rend pas la clé `document_p2` — le juge recevrait « null » à la '
        + 'place du relevé et jugerait à vide (`CONTRAT-MODULES.md` §2)' }
  }
  alertes.push(...prepare.alertes)

  // ⛔ PAS DE `prompt_version` : « RIEN N'EST VERSIONNÉ PAR PHASE » (`01-` §11).
  //    Elle portait EXACTEMENT `instrument.version`, ici comme au jugement — et
  //    « deux copies du même chiffre finissent par diverger » (`07-` §1.2).
  //    ⭐ `instrument_version` RESTE, et c'est l'erreur symétrique à ne pas
  //    faire : c'est LE versionnage, « sur la mesure ET sur le squelette ».
  const echecP1 = sansEcriture ? null : await upsertSquelette(
    admin, ctx.depotId, competence, version, {
      artefact_extraction: artefactsP1, modele,
      instrument_version: instrument.version,
    })
  if (echecP1) alertes.push(echecP1)

  // ── Temps 3 — P2, observable par observable ───────────────────────────────
  // ⭐ Le même contrôle qu'AVANT P1 (`preparerLeJugement`), rejoué sur le contexte
  //    enrichi : il ne peut plus refuser — ce qu'il refuse a déjà été refusé
  //    avant le premier appel —, il ne fait que servir les VALEURS.
  const p2 = preparerLeJugement(branchement, instrument, ctxEnrichi)
  if (p2.refus !== null) {
    return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
      alerte: p2.refus }
  }
  const { gabaritP2 } = p2
  const specP2 = { tetePrompt: p2.tetePrompt }
  const slotsP2: Record<string, string> = {
    [p2.slotDocument]: JSON.stringify(prepare.document_p2, null, 2),
    ...p2.slotsPreP2,
  }
  const { tete: teteP2, queue: queueP2 } = separerTete(gabaritP2)
  const jugement = await appeler<Record<string, unknown>>({
    phase: 'p2', modele,
    systeme: 'Tu es un juge. Tu ne rends ni niveau, ni dimension, ni décompte.',
    prefixeCacheable: teteP2,
    message: messageDuGabarit(queueP2, slotsP2, 'Rends le jugement au format déclaré ci-dessus.'),
    // ⚠️ C4-L10, TROUVÉ PAR LE PREMIER DÉPÔT RÉEL. Cette ligne disait
    //    `{ type: 'objet', champs: {}, optionnels: [] }` — c'est-à-dire
    //    « L'OBJET VIDE, ET RIEN D'AUTRE » : la garde des clés inconnues
    //    REFUSAIT TOUTE SORTIE DE P2, relance comprise. Le verdict de la fiche
    //    revenait complet et juste, et il était rejeté clé par clé — `niveau`,
    //    `grades`, `profil`, `levier`… — puis la chaîne levait, sans mesure.
    //
    //    `schema.ts` porte l'avertissement mot pour mot, et P1 avait déjà été
    //    corrigé : « C'est la distinction qui manquait, et elle bloquait la
    //    chaîne entière LE JOUR OÙ UNE COMPÉTENCE S'OUVRE. » Ce jour est arrivé.
    //
    //    Le jugement d'une fiche a une forme QUI FAIT FOI À LA FICHE (`03-` §1),
    //    exactement comme son relevé : on ne prétend pas en connaître toutes les
    //    clés. ⭐ 02/09 — on EXIGE celles que `code2` lit en premier (`crible`,
    //    `niveau`…), le reste passe (`objet_ouvert`). Un juge muet — « P2 sans
    //    crible = acquiescement » en Argumentation — est rejeté et relancé.
    forme: formeMinimale(competence, specP2.tetePrompt),
    attribution: { module: MODULE_COUT, eleveId: ctx.eleveId, classeId: ctx.classeId,
      depotId: ctx.depotId, competence, version },
  })
  appels += jugement.appels

  // ⛔ La SECONDE écriture de `prompt_version` — retirée avec la première : une
  //    colonne, DEUX écritures (C4-L11 ; `01-` §11, « rien n'est versionné par
  //    phase »).
  const echecP2 = sansEcriture ? null : await upsertSquelette(
    admin, ctx.depotId, competence, version, {
      artefact_jugement: jugement.valeur, modele,
      instrument_version: instrument.version,
    })
  if (echecP2) alertes.push(echecP2)

  // ── Temps 4 — CODE2. « Du code agrège » : le palier DE LA MESURE. ─────────
  // ⭐ IL REÇOIT LA SORTIE DE CODE1, et c'est ce que le contrat écrit deux fois :
  //    « le JSON de P2 déjà parsé + la sortie du crochet 3 ». Sans ce canal, une
  //    agrégation qui croise les mesures comptées par Code1 avec les verdicts de
  //    P2 n'a rien à croiser.
  const agrege = branchement.code2(jugement.valeur, prepare, ctxEnrichi)
  const refusForme = refusFormeCode2(agrege)
  if (refusForme) {
    return { competence, appels, ecrite: false, dejaLa: false, lettre_equivalente: null, squelette: null,
      alerte: refusForme }
  }
  alertes.push(...agrege.alertes)

  // `conformite` TOURNE À CHAQUE PASSAGE, d'office — « le contrôle passe de
  // script à lancer à propriété du banc ». Il rend une liste d'alertes, jamais un
  // verdict : elles rejoignent celles de Code2. *Un contrôle qu'on n'appelle pas
  // est un contrôle qui n'existe pas.*
  if (branchement.conformite) {
    alertes.push(...branchement.conformite(artefactsP1, jugement.valeur, prepare, agrege, ctxEnrichi))
  }

  const { releve, alertes: alertesReleve } = branchement.releve(agrege, ctxEnrichi)
  alertes.push(...alertesReleve)
  const { observables, alertes: alertesObs } =
    appliquerObservablesMesure(instrument.observables_mesure, releve)
  alertes.push(...alertesObs.map((x) => `${x.observable} : ${x.motif}`))
  const lettreEquivalente = branchement.lettre(agrege, ctxEnrichi)

  const squelette: SqueletteServi = { competence, extraction: artefactsP1, jugement: jugement.valeur }

  // ── LA VF N'ÉCRIT JAMAIS DANS LES MESURES (piège 16). ─────────────────────
  // Elle attache SON DELTA à la mesure de la v1 — « le delta s'attache à la
  // sienne » (`07-` §1.2) —, et rien d'autre.
  if (version === 'vf') {
    const squeletteV1 = await lireSquelette(admin, ctx.depotId, competence, 'v1')
    const delta = branchement.delta && squeletteV1 != null
      ? branchement.delta(squeletteV1, artefactsP1, ctxEnrichi)
      : null
    if (delta === null && !branchement.delta) {
      alertes.push('`delta_v1_vf` reste NULL : le branchement de la compétence n\'en déclare '
        + 'pas le calcul — et NULL n\'est pas 0 (01- §11)')
    }
    if (!sansEcriture) await attacherDelta(admin, ctx.depotId, competence, delta)
    return { competence, appels, ecrite: false, dejaLa: false,
      lettre_equivalente: lettreEquivalente, squelette,
      alerte: alertes.length ? alertes.join(' · ') : null }
  }

  const regles = await entreesDesRegles(
    admin, ctx.eleveId, competence, { modes, objet: ctx.objet }, new Date())

  const ligne: LigneMesure = {
    eleve_id: ctx.eleveId,
    competence,
    modes,
    lettre_equivalente: lettreEquivalente,
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
  const ecriture = sansEcriture
    ? { ecrite: false, dejaLa: false, erreur: null as string | null }
    : await ecrireMesure(admin, ligne)
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
    lettre_equivalente: lettreEquivalente,
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
): Promise<string | null> {
  const { error } = await admin.from('exercices_squelettes')
    .upsert({ depot_id: depotId, competence, version, ...champs, updated_at: new Date().toISOString() },
      { onConflict: 'depot_id,competence,version' })
  if (!error) return null
  console.error(`[chaine] squelette non écrit — ${error.code} ${error.message}`)
  // ⭐⭐ C5-L2 — ET LE MOTIF REMONTE, au lieu de finir dans une trace serveur.
  //
  // ⚠️ **UNE GARDE QUI N'AVAIT JAMAIS TIRÉ PEUT DÉSORMAIS TIRER ICI.**
  //    `garde_reference_validee` (en base) LÈVE dès qu'un `artefact_jugement`
  //    s'écrit sur un dépôt dont l'exercice porte une référence NON VALIDÉE —
  //    et elle sortait toujours en silence, parce que `exercices.reference_id`
  //    n'avait aucun écrivain de production. Depuis que la conception la pose,
  //    la garde contrôle vraiment. **Le cas où elle mord est étroit et il est
  //    assumé par les sources** : une référence DÉVALIDÉE APRÈS la conception,
  //    « qui ne défait pas les instances déjà assignées ».
  //
  // ⛔ **CE QU'IL NE FAUT SURTOUT PAS LAISSER SILENCIEUX** : supabase-js ne lève
  //    pas, la chaîne CONTINUE, et la mesure s'écrit quand même — un état où
  //    « la mesure existe, le squelette non » ne se voit alors nulle part.
  //    L'appelant en fait une alerte du bilan.
  return `squelette « ${competence} / ${version} » NON écrit — ${error.code} ${error.message}`
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

/**
 * ⭐ EXPORTÉ pour la RÉPÉTITION À BLANC (`scripts/recette/retour-a-blanc.mjs`) —
 *    le pendant exact de `rejouerUneCompetence` pour la chaîne froide. C'est
 *    la seule façon d'éprouver un changement de GABARIT sur des copies réelles
 *    sans écrire dans le retour d'un élève. ⛔ Ne pas l'appeler depuis l'app :
 *    le chemin de production passe par `traiterDepot` ou `rejouerLeRetour`.
 */
export async function engendrerLeRetour(
  admin: Admin,
  a: {
    ctx: ContexteDepot; version: Version; modele: string
    squelettes: SqueletteServi[]
    squelettesVf?: SqueletteServi[]
    registre: Registre | null; cible: Competence | null
    /**
     * ⭐⭐ LE GARDE-FOU DU REJEU — décision de Louis, 27/08.
     *
     * Vrai à la DERNIÈRE tentative seulement. Il ne tolère QUE les refus de
     * FORME (`ControleRetour.formeSeulement`) : *« au bout de trois tentatives,
     * on sert le retour et le professeur relit »*. ⛔ **Un refus de
     * FALSIFICATION n'est jamais toléré, à aucune tentative** — RR3, RR4, la
     * règle 6 et les compétences hors périmètre font lire à l'élève quelque
     * chose de faux, ou lui montrent la grille.
     *
     * ⚠️ Sans lui, le rejeu automatique tournerait EN BOUCLE sur les trois
     *    copies de prod que la règle 2 refuse — un appel brûlé à chaque tour,
     *    pour un retour qui ne viendrait jamais.
     */
    tolererLaForme?: boolean
    /**
     * ⭐ LA RÉPÉTITION À BLANC — même patron que `chaineDUneCompetence`, et pour
     *    la même raison : **éprouver un changement de gabarit sur des copies
     *    RÉELLES sans toucher au retour d'un élève**. Rien n'est écrit ; le
     *    retour engendré est rendu à l'appelant, qui en fait ce qu'il veut.
     * ⛔ Les appels au modèle, eux, sont bien faits et bien facturés.
     */
    sansEcriture?: boolean
  },
): Promise<{
  ecrit: boolean; appels: number; alertes: string[]
  /** Ce qui aurait été écrit — renseigné en répétition à blanc. */
  retour?: RetourSegmente | null
}> {
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

  // `07-` §4 — « la `longueur` […] son domicile est un PARAMÈTRE DE PLATEFORME,
  // au même endroit que les interrupteurs (§5), NULL VALANT LA RÈGLE 7 ». La
  // section nommée `regle_7` est la seule ouverte ; les autres ne se remplacent
  // pas, et `assemblerGabarit` tient cette garde.
  const longueur = await lireLongueurDuRetour(admin)
  if (longueur) alertes.push('longueur du retour : paramètre de plateforme servi à la place de la règle 7')
  const gabarit = assemblerGabarit(CALAME.sections, { longueur })

  const { systeme, message } = assemblerRetour(gabarit, {
    moment: version,
    registre: registreServi,
    // Le fichier partagé, REÇU — « elle n'en porte pas de copie » (`07-` §4).
    personnalite: { identite: IDENTITE, ton: TON_PARTAGE },
    palierAttribue: evaluee,
    competencePrimaire: cible,
    couchesCompetence: couches,
    coucheType: {
      consigne: ctx.consigne, grain: ctx.grain, servable: ctx.servable,
      patronProduction: ctx.patronProduction,
      etalonProduction: ctx.etalonProduction,
      // ⭐⭐ 31/08 — LE MATÉRIAU ET L'ATTENDU, ICI ET NULLE PART AILLEURS.
      //    « La seule IA qui devrait avoir le matériau et l'attendu de réponse,
      //    c'est Calame lors du retour chaud » (Louis). Les deux appels froids
      //    ci-dessus n'en reçoivent rien, et c'est le point : ils mesurent des
      //    OBSERVABLES, le retour PARLE de l'exercice.
      casServis: ctx.casPourLeRetour,
    },
    squelettes,
    squelettesVf: a.squelettesVf,
    retourV1: version === 'vf' ? await lireRetourV1(admin, ctx.depotId) : null,
    etatAnterieur,
    // ⭐⭐ C5-L2 — LE TEXTE D'AUTEUR ARRIVE ENFIN AU MODÈLE. Il est lu par
    //    `lireContexte` (une jointure, sur le chemin chaud), borné à
    //    L'ENGLOBANT — « l'étendue réellement lue » — et il part BALISÉ.
    //    ⛔ Sans lui, RR3 est intenable : on demandait de citer l'auteur sans
    //    donner l'auteur, et le seul texte sous la main était LA COPIE.
    texteSupport: ctx.texteSupport?.texte ?? null,
    // ⭐⭐ 31/08 — LA MATIÈRE DES CRANS DE PRODUCTION. L'écran la montre à l'élève
    //    (`EcranDeroule.tsx`) ; sans cette ligne, Calame jugeait « as-tu bien
    //    illustré cet argument ? » sans jamais avoir lu l'argument.
    coTexte: ctx.coTexte,
  })

  try {
    const r = await appeler<unknown>({
      phase: 'retour', modele,
      // Le rôle en système, LE GABARIT SUBSTITUÉ en préfixe cacheable — et une
      // seule fois. Empiler le gabarit brut à côté du substitué donnait au modèle
      // DEUX exemplaires contradictoires du même contrat, dont un où la règle 8
      // se lit littéralement « REGISTRE : {{REGISTRE}} ». Le préfixe reste
      // cachable : il est stable pour un même (compétence, moment, registre).
      // ⚠️ L'IDENTITÉ NE SE RECOPIE PLUS ICI (C4-L11) : elle vient du fichier
      // partagé et voyage dans le préfixe cacheable, avec le `ton` et le
      // contrat. Une seconde copie en système était un second Calame en germe.
      systeme: 'Tu suis le contrat qui suit.',
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
      // ⭐ RR3 se contrôle contre LES DEUX CÔTÉS. En version finale le retour
      //    cite la v1 ET la version finale (« la comparaison des deux ») : ne
      //    passer que la vf ferait déclarer introuvable une citation légitime
      //    de la v1, et le contrôle crierait faux.
      production: version === 'v1'
        ? ctx.productionV1
        : [ctx.productionV1, ctx.productionVf].filter(Boolean).join('\n\n') || null,
      texteSupport: ctx.texteSupport?.texte ?? null,
      coTexte: ctx.coTexte,
    })
    // ⚠️ LES ALERTES SE JOURNALISENT SANS ARRÊTER — c'est ce que leur nom dit,
    //    et elles ne remontaient nulle part avant C5-L2 : le champ existait,
    //    personne ne le remplissait, et personne ne le lisait.
    alertes.push(...controle.controle.alertes)

    // ⛔⛔ PREMIER PARTAGE — LE SCHÉMA. Une sortie non conforme ne se tolère
    //    JAMAIS : c'est la défense 2 du `01-` §12, `appeler()` a déjà relancé,
    //    et le champ `points` pourrait ne même pas exister. Rien à servir.
    const verdict = controle.verdict
    if (!verdict.ok) {
      alertes.push(`retour refusé : ${verdict.refus.map((x) => `${x.chemin} ${x.motif}`).join(' | ')}`)
      return { ecrit: false, appels: r.appels, alertes }
    }

    // ⭐⭐ SECOND PARTAGE — LE CONTENU, et il a DEUX familles (voir
    //    `ControleRetour.formeSeulement`). La FALSIFICATION ne se tolère à
    //    aucune tentative ; la FORME se tolère à la dernière, plutôt que de
    //    laisser l'élève sans retour.
    if (controle.controle.refus.length) {
      const motifs = controle.controle.refus
      if (!(a.tolererLaForme === true && controle.controle.formeSeulement)) {
        alertes.push(`retour refusé : ${motifs.join(' | ')}`)
        return { ecrit: false, appels: r.appels, alertes }
      }
      // ⚠️ LE MOTIF SURVIT, ET C'EST TOUT CE QUI RESTE AU PROFESSEUR AUJOURD'HUI.
      //    Il part au message du job (`motifDuRetourNonEcrit` le retient), seul
      //    domicile de ce genre de trace tant que la page du professeur n'existe
      //    pas — **elle est à C6-L1**. C'est le patron de `C4L3-19` : « le lot
      //    détecte, marque, et laisse une trace ; il n'invente aucune file ».
      alertes.push(
        `⚠️ RETOUR SERVI SANS QUE LE CONTRAT DE FORME SOIT TENU — À RELIRE : ${motifs.join(' | ')}`)
    }

    const segmente = segmenter(verdict.valeur, ctx.depotId, version)
    if (a.sansEcriture === true) {
      alertes.push('répétition à blanc : le retour n’a PAS été écrit')
      return { ecrit: false, appels: r.appels, alertes, retour: segmente }
    }
    const ecriture = await ecrireRetour(
      admin, ctx.depotId, version, registreServi, segmente, ctx.lieu)
    if (!ecriture.ecrit) alertes.push(`retour NON écrit en base : ${ecriture.erreur}`)
    return { ecrit: ecriture.ecrit, appels: r.appels, alertes, retour: segmente }
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
 *
 * ⭐⭐ ET LA PUBLICATION, POUR LA MAISON SEULEMENT — décision de Louis, 24/08.
 *
 * Jusqu'ici la chaîne n'écrivait JAMAIS `published_at`, et rien d'autre ne le
 * posait côté maison : `publier()` n'a que deux appelants, tous deux dans le
 * flux de classe, et la pile de correction exclut la maison par construction
 * (`utils/passation/vues.ts:49`). Un retour de maison était donc engendré puis
 * **structurellement invisible** — `utils/deroule/vue.ts` saute tout retour sans
 * `published_at`, et `lu_at` devenait inatteignable (défaut central de C4-L7).
 *
 * ⚠️ LES DEUX MOMENTS, et c'est le chaud qui compte le plus : il est le TEMPS 4,
 *    celui sur lequel l'élève RÉVISE au temps 5. Sans lui la révision se ferait
 *    à l'aveugle, et le `delta_v1_vf` mesurerait l'écart entre deux versions
 *    dont la seconde n'a rien lu.
 *
 * ⛔ ET SEULEMENT LA MAISON. En classe, `published_at` EST la case que coche le
 *    professeur (`app/passation/actions.ts`) : il corrige, il valide, puis il
 *    publie — pour toute la classe, quand il le décide. Publier automatiquement
 *    là court-circuiterait son geste et lui retirerait le contrôle de ce que ses
 *    élèves lisent. Le `lieu` commande, jamais le module (piège 24).
 */
async function ecrireRetour(
  admin: Admin, depotId: string, version: Version, registre: Registre, r: RetourSegmente,
  lieu: Lieu,
): Promise<{ ecrit: boolean; erreur: string | null }> {
  const moment = version === 'v1' ? 'chaud' : 'final'
  const maintenant = new Date().toISOString()
  const { error } = await admin.from('exercices_retours').upsert({
    depot_id: depotId,
    moment,
    texte: r.points,
    action_revision: r.action_revision ? { texte: r.action_revision } : null,
    feed_forward: r.feed_forward,
    registre_servi: registre,
    points_ids: r.points.map((p) => p.id),
    // ⚠️ On ne REPUBLIE pas ce qui l'était : `upsert` réécrit la ligne entière,
    //    et un retour republié perdrait sa date de première publication. La
    //    maison la pose ; la classe la laisse à `null`, au professeur.
    ...(lieu === 'maison' ? { published_at: maintenant } : {}),
    updated_at: maintenant,
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
/**
 * La `longueur` du retour — LE PARAMÈTRE DE PLATEFORME du `07-` §4.
 *
 * « Son domicile est un paramètre de plateforme, au même endroit que les
 *   interrupteurs (§5), NULL VALANT LA RÈGLE 7 DU GABARIT. »
 *
 * ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une lecture dont on ignore
 *    le retour échoue en silence — ici, silencieusement au défaut, ce qui est le
 *    comportement voulu (NULL = la règle 7) mais mérite d'être écrit.
 * ⛔ Ce n'est PAS `rag_prompt_longueur` : celle-là est la section éditable DU
 *    TUTEUR (`utils/scriptorium-rag.ts`). Deux ateliers, deux réglages.
 */
async function lireLongueurDuRetour(admin: Admin): Promise<string | null> {
  const { data } = await admin.from('scriptorium_params')
    .select('exercices_retour_longueur').eq('id', 1).maybeSingle()
  const v = (data as { exercices_retour_longueur?: string | null } | null)?.exercices_retour_longueur
  return v && v.trim() !== '' ? v.trim() : null
}

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
/**
 * Le squelette COMPLET d'une compétence — les deux artefacts ET la version de
 * l'instrument qui les a produits. `lireSquelette` ne rend qu'une colonne ;
 * ici on a besoin des trois d'un seul tenant, et de la version SURTOUT.
 */
async function lireLeSqueletteComplet(
  admin: Admin, depotId: string, competence: Competence, version: Version,
): Promise<{ extraction: unknown; jugement: unknown; instrumentVersion: string | null } | null> {
  const { data, error } = await admin.from('exercices_squelettes')
    .select('artefact_extraction, artefact_jugement, instrument_version')
    .eq('depot_id', depotId).eq('competence', competence).eq('version', version)
    .maybeSingle()
  if (error) {
    console.error(`[chaine] squelette illisible (${competence} ${version}) — ${error.code} ${error.message}`)
    return null
  }
  if (!data) return null
  const d = data as unknown as {
    artefact_extraction: unknown; artefact_jugement: unknown; instrument_version: string | null
  }
  return { extraction: d.artefact_extraction, jugement: d.artefact_jugement, instrumentVersion: d.instrument_version }
}

/**
 * REJOUER LE SEUL RETOUR — sans refaire P1 ni P2.
 *
 * ⭐⭐ POURQUOI CETTE ÉTAPE EXISTE. Un retour refusé par `controlerRetour` ne
 *    faisait pas échouer le job : les mesures étaient écrites, le job aboutissait,
 *    et rien ne retentait. Le seul rattrapage était de rejouer TOUTE l'étape —
 *    7 appels pour en réparer 1. Le 26/08, une copie a coûté 16 appels au total,
 *    dont 12 pour deux jugements dont un seul a servi.
 *
 * ⛔⛔ ET LE GASPILLAGE N'ÉTAIT PAS LE PIRE. Rejouer l'étape entière RÉÉCRIT les
 *    squelettes (`upsertSquelette`) mais PAS les mesures (« déjà là »). Après un
 *    tour complet, `exercices_squelettes` porte donc le jugement du SECOND
 *    tirage pendant que `competences_mesures` garde la lettre du PREMIER — et le
 *    modèle n'est pas déterministe, les deux ont bel et bien divergé. La lettre
 *    servie à l'élève et le retour qu'il lit cessaient de parler du même
 *    jugement. **Rejouer le seul retour ne touche à aucun squelette : c'est une
 *    correction de justesse autant qu'une économie.**
 *
 * ⚠️⚠️ LA GARDE DE VERSION EST LA CONDITION DE VALIDITÉ. Servir un squelette
 *    jugé par un instrument PÉRIMÉ ferait commenter la copie selon une fiche que
 *    plus personne n'applique — en silence, et de façon indétectable à l'écran.
 *    Les trois versions doivent coïncider : celle de l'instrument COURANT, celle
 *    qui a produit le squelette, celle que porte la mesure. Sinon on refuse, et
 *    on renvoie vers l'étape complète, qui rejugera.
 *
 * ⚠️ Aucun Monitoring ici : il se mesure avec la copie, pas avec son commentaire.
 */
export async function rejouerLeRetour(
  admin: Admin, depotId: string,
  options: { config?: ConfigChaine; registre?: Registre; tolererLaForme?: boolean;
    /** Répétition à blanc : les appels ont lieu, rien n'est écrit. */
    sansEcriture?: boolean } = {},
): Promise<BilanDepot> {
  const debut = Date.now()
  const config = options.config ?? lireConfig()
  const alertes: string[] = []

  // ── Les mêmes gardes que l'étape complète, et pour les mêmes raisons ──────
  if (!(await chaineActive(admin))) {
    throw new ChaineSuspendue('`chaine_actif` est à OFF — les dépôts restent en file.')
  }
  const facture = await controlerLaFacture(admin, config.plafondMensuelUsd)
  if (facture.etat === 'coupure') {
    throw new ChaineSuspendue(
      `plafond mensuel atteint (${facture.depense.toFixed(4)} $ / ${facture.plafond} $) — `
      + 'la chaîne est coupée, les dépôts restent en file.')
  }
  const avant = await appelsDuDepot(admin, depotId)
  if (depotAAtteintSonPlafond(avant, config.plafondAppelsParDepot)) {
    throw new DepotInexploitable(
      `plafond d'appels par dépôt atteint (${avant} / ${config.plafondAppelsParDepot}).`)
  }

  const ctx = await lireContexte(admin, depotId)
  const modele = modeleDeLaChaine(
    { lieu: ctx.lieu, forme: ctx.forme, diagnostic: ctx.paireDiagnostic }, config)

  // ── Ce dont le retour parle : LES MESURES DÉJÀ ÉCRITES ────────────────────
  // Pas « les compétences de l'exercice » : une compétence écartée à la mesure
  // n'a ni squelette ni lettre, et le retour n'aurait rien à en dire.
  const { data, error } = await admin.from('competences_mesures')
    .select('competence, instrument_version').eq('depot_id', depotId)
  if (error) {
    throw new DepotInexploitable(`les mesures du dépôt sont illisibles : ${error.message}`)
  }
  const mesures = (data ?? []) as unknown as Array<{
    competence: Competence; instrument_version: string | null
  }>
  if (!mesures.length) {
    throw new DepotInexploitable(
      'aucune mesure écrite pour ce dépôt : il n’y a rien à commenter. '
      + 'C’est l’étape de mesure qu’il faut rejouer, pas le retour.')
  }

  // ── Les squelettes, et LA GARDE DE VERSION ────────────────────────────────
  const squelettes: SqueletteServi[] = []
  for (const m of mesures) {
    const sq = await lireLeSqueletteComplet(admin, depotId, m.competence, 'v1')
    if (!sq || sq.extraction == null || sq.jugement == null) {
      throw new DepotInexploitable(
        `le squelette de « ${m.competence} » manque ou est incomplet : le retour ne peut pas `
        + 'se rejouer seul. Rejouez l’étape de mesure, qui le reconstruira.')
    }
    const courante = etatCompetence(m.competence).instrument?.version ?? null
    const versions = [courante, sq.instrumentVersion, m.instrument_version].filter((v): v is string => !!v)
    if (new Set(versions).size > 1) {
      throw new DepotInexploitable(
        `« ${m.competence} » a changé d’instrument depuis la mesure (courant ${courante ?? '?'}, `
        + `squelette ${sq.instrumentVersion ?? '?'}, mesure ${m.instrument_version ?? '?'}) : `
        + 'rejouer le seul retour servirait un jugement périmé. Rejouez l’étape de mesure.')
    }
    squelettes.push({ competence: m.competence, extraction: sq.extraction, jugement: sq.jugement })
  }

  const mesurees = squelettes.map((s) => s.competence)
  const cible = cibleDuRetour(ctx, mesurees)
  if (cibleIndeterminee(ctx, mesurees)) {
    alertes.push('cible du retour INDÉTERMINÉE : ni décision de routeur ni `cible_primaire` — '
      + `« ${cible} » sert par convention (ordre alphabétique), pas par intention.`)
  }
  const coexistence = alerteDeCoexistence(ctx)
  if (coexistence) alertes.push(coexistence)

  const r = await engendrerLeRetour(admin, {
    ctx, version: 'v1', modele, squelettes, registre: options.registre ?? null, cible,
    tolererLaForme: options.tolererLaForme === true,
    sansEcriture: options.sansEcriture === true,
  })
  alertes.push(...r.alertes)

  const apres = await appelsDuDepot(admin, depotId)
  const dureeMs = Date.now() - debut
  return {
    depotId,
    version: 'v1',
    competencesMesurees: mesurees,
    competencesEcartees: [],
    // Rien n'est mesuré ici : les mesures étaient déjà là, et le restent.
    mesuresEcrites: 0,
    mesuresDejaLa: mesures.length,
    retourEcrit: r.ecrit,
    retourEngendre: r.retour ?? null,
    monitoring: { mesures: 0, motifs: ['étape de retour seul : le Monitoring ne se rejoue pas'] },
    appels: r.appels,
    passages: 0,
    appelsEnBase: apres - avant,
    dureeMs,
    alertes,
  }
}

/**
 * ⭐⭐ COMBIEN DE FOIS ON REJOUE UN RETOUR REFUSÉ, ET CE QUI SE PASSE APRÈS.
 *
 * *« Après 3 retours refusés, on arrête et on accepte le retour tel quel, mais
 *   le prof doit relire »* — décision de Louis, 27/08.
 *
 * ⚠️ **Le chiffre est le même que `tentatives_max` de la file**, et ce n'est pas
 *    une coïncidence : au-delà, `reclamerJobs` ne réclamerait plus le job.
 */
export const TENTATIVES_AVANT_TOLERANCE = 3

/**
 * ⭐⭐ LE REJEU AUTOMATIQUE D'UN RETOUR REFUSÉ.
 *
 * **Ce qui l'a rendu nécessaire.** Un retour refusé au contrôle laissait un
 * dépôt mesuré SANS COMMENTAIRE, et le seul rattrapage était un geste HUMAIN —
 * `relancerUnJob`, qu'il fallait penser à faire. ⛔ **Personne ne le pensait** :
 * constaté en prod le 27/08, **trois copies mesurées sans retour depuis la
 * veille**, chacune refusée sur le même motif, et rien nulle part qui le disait
 * à qui que ce soit.
 *
 * ⚠️ **CE N'EST PAS « LE REJET ET LA RELANCE » DE LA DÉFENSE 2** (`01-` §12),
 *    qui vit dans `appeler()` et relance l'APPEL sur une sortie non conforme au
 *    schéma. Ici c'est **la FILE qui refait un tour** — le même geste que la
 *    reprise après bail expiré, avec le même compteur et le même plafond.
 *
 * ⛔ **ET IL S'ARRÊTE.** `mettreEnFile` est idempotent et `relancerUnJob` refuse
 *    un job qui tourne ; le plafond de tentatives de la file fait le reste. Sans
 *    ces deux gardes, un refus déterministe — et celui de la règle 2 EST
 *    déterministe sur une copie sans réussite — brûlerait un appel par tour, à
 *    la minute, indéfiniment.
 */
async function programmerLeRejeuDuRetour(
  admin: Admin, job: Job, bilan: BilanDepot,
): Promise<void> {
  if (bilan.retourEcrit) return
  const refus = (bilan.alertes ?? []).find((x) => x.startsWith('retour refusé'))
  if (!refus) return   // pas de retour à écrire (sonde, aucune compétence) : rien à rejouer

  const { deja, erreur } = await mettreEnFile(admin, job.depot_id, 'retour_v1')
  if (erreur) { console.error(`[chaine] rejeu du retour NON programmé — ${erreur}`); return }
  if (!deja) return    // le job vient d'être créé : il partira au prochain tour

  // ⛔ `remettreEnFile`, JAMAIS `relancerUnJob` : celui-ci rend ses tentatives au
  //    job — c'est le geste de l'HUMAIN —, et le compteur ne monterait jamais.
  const { remis, raison } = await remettreEnFile(
    admin, job.depot_id, 'retour_v1', `rejeu automatique — ${refus}`)
  if (!remis) {
    console.warn(`[chaine] retour NON écrit et rejeu arrêté — dépôt ${job.depot_id} : ${raison}. `
      + `Motif du refus : ${refus}. ⚠️ Il reste au message du job ; l'écran du professeur qui le `
      + 'servira est à C6-L1.')
  }
}

export async function tourDeFile(
  admin: Admin, jobs: Job[], config: ConfigChaine,
): Promise<Array<{ job: Job; bilan?: BilanDepot; erreur?: string }>> {
  const sorties: Array<{ job: Job; bilan?: BilanDepot; erreur?: string }> = []
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]
    try {
      // ⭐ `retour_v1` NE MESURE PAS : elle relit les squelettes et n'engendre
      //    que le commentaire. La distinguer ici est tout ce qu'il faut — la
      //    file, le bail, l'idempotence et la reprise ne changent pas.
      // ⚠️ `reclamerJobs` INCRÉMENTE `tentatives` à la prise : à la troisième
      //    prise, `job.tentatives` vaut 3, et c'est la dernière — on tolère
      //    alors les refus de FORME plutôt que de laisser l'élève sans retour.
      const bilan = job.etape === 'retour_v1'
        ? await rejouerLeRetour(admin, job.depot_id,
          { config, tolererLaForme: job.tentatives >= TENTATIVES_AVANT_TOLERANCE })
        : await traiterDepot(admin, job.depot_id, job.etape === 'mesure_vf' ? 'vf' : 'v1', { config })
      const resume = job.etape === 'retour_v1'
        ? `retour seul — ${resumeBilan(bilan)}`
        : resumeBilan(bilan)
      await terminerJob(admin, job, { statut: 'abouti', message: resume })
      // ⭐⭐ LE REJEU DU RETOUR REFUSÉ, AUTOMATIQUE — décision de Louis, 27/08.
      //    Il devait se demander à la main ; trois copies de prod l'attendaient
      //    depuis le 26/08 sans que personne le sache.
      await programmerLeRejeuDuRetour(admin, job, bilan)
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

/**
 * LE MOTIF D'UN RETOUR NON ÉCRIT, RETENU DANS LE MESSAGE DU JOB.
 *
 * ⭐⭐ SANS CECI, LA RAISON N'EXISTE NULLE PART. Les `alertes` d'un bilan ne
 *    voyagent que dans la réponse HTTP de `/api/chaine` — et le cron, qui appelle
 *    cette route à la minute, jette cette réponse. Le 26/08, une copie sur onze
 *    est sortie « retour non écrit » : le fait était là, le POURQUOI était perdu,
 *    et il n'y avait aucun moyen de le retrouver après coup.
 *
 * ⚠️ Le job ABOUTIT quand même quand le retour est refusé — les mesures, elles,
 *    sont écrites et payées. Le message est donc le SEUL témoin durable.
 *
 * On ne retient que les alertes qui parlent du retour : le reste (latence,
 * cible indéterminée) a sa place ailleurs et noierait le motif.
 */
function motifDuRetourManquant(alertes: readonly string[]): string {
  const siennes = alertes.filter((a) => a.toLowerCase().includes('retour'))
  if (!siennes.length) return ''
  const texte = siennes.join(' | ')
  // Borné : `dernier_message` est lu à l'écran, pas archivé. Un refus qui cite
  // vingt observables tiendrait sur trois écrans et cacherait le reste du bilan.
  return ` — ${texte.length > 400 ? `${texte.slice(0, 400)}…` : texte}`
}

/**
 * ⭐⭐⭐ C5-L3 — LES COMPÉTENCES ÉCARTÉES, DANS LE MESSAGE PERSISTÉ.
 *
 * ⛔⛔ CE COMMENTAIRE DISAIT LE CONTRAIRE, ET IL ÉTAIT FAUX. `competencesDeLExercice`
 *    porte depuis toujours la note *« ce motif-là est SERVI : le bilan d'un dépôt
 *    l'affiche »* — **il ne l'affichait nulle part.** `competencesEcartees` ne
 *    vivait que dans la valeur de retour EN MÉMOIRE de `traiterDepot` ; les deux
 *    seuls résumés qui atteignent une durée — celui-ci et `resume()` de
 *    `utils/deroule/mesure.ts` — ne le mentionnaient pas, et
 *    `exercices_jobs.dernier_message` est **le seul canal que l'écran prof lise**
 *    (`etatDesJobs` → `utils/passation/depots.ts`).
 *
 * ⚠️ **Trouvé par le smoke prof de C5-L3**, en cherchant à quel écran regarder :
 *    la porte de mode refusait **juste, et en silence**. *Un motif que personne
 *    ne peut lire n'est pas un motif — c'est la même leçon que « une trace n'est
 *    pas un état », prise par l'autre bout.*
 *
 * ⚠️ Borné comme le motif du retour, et pour la même raison : `dernier_message`
 *    est **lu à l'écran, pas archivé**. Quatre compétences écartées avec leur
 *    motif entier tiendraient sur trois écrans et cacheraient le reste du bilan.
 *    ⭐ La compétence et le début du motif suffisent à savoir **où regarder** ;
 *    le motif entier reste dans le bilan, pour qui l'appelle.
 */
export function motifDesEcartees(b: BilanDepot): string {
  if (!b.competencesEcartees.length) return ''
  // ⭐⭐ LES NOMS D'ABORD, ET TOUJOURS EN ENTIER ; LE DÉTAIL ENSUITE, BORNÉ.
  //    L'ordre compte, et il a été trouvé par l'épreuve : en bornant la liste
  //    « nom — motif | nom — motif », **la troncature mangeait le SECOND NOM** —
  //    le professeur lisait « 2 écartée(s) » et n'en voyait qu'une. *Savoir
  //    LESQUELLES coûte trois mots ; savoir POURQUOI peut coûter trois écrans.*
  const noms = b.competencesEcartees.map((e) => e.competence).join(', ')
  const motifs = b.competencesEcartees.map((e) => e.motif).join(' | ')
  return `, ${b.competencesEcartees.length} écartée(s) — ${noms} : `
    + (motifs.length > 400 ? `${motifs.slice(0, 400)}…` : motifs)
}

function resumeBilan(b: BilanDepot): string {
  const motif = b.retourEcrit ? '' : motifDuRetourManquant(b.alertes)
  return `${b.competencesMesurees.length} mesurée(s), ${b.mesuresEcrites} écrite(s), `
    + `${b.mesuresDejaLa} déjà là, retour ${b.retourEcrit ? 'écrit' : 'non écrit'}${motif}, `
    + `${b.appels} appel(s), ${Math.round(b.dureeMs / 1000)} s${motifDesEcartees(b)}`
    // ⛔ SANS CONDITION, et c'est tout le correctif : une perte d'écriture ne
    //   dépend pas de ce qu'un retour a fait ou non.
    + motifDesEtatsPerdus(b.alertes)
    // ⭐ 02/09 — l'abrégé de la fidélité de P1, seul domicile persisté de cette
    //    trace : le professeur lit « fidélité P1 — argumentation 3/12 ».
    + motifDeFidelite(b.alertes)
    + motifDeTranscription(b.alertes)
}

// ════════════════════════════════════════════════════════════════════════════
// ⭐⭐ LE BANC DE COMPARAISON DES MODÈLES — `07-` §6, la contre-épreuve.
// ════════════════════════════════════════════════════════════════════════════

/**
 * ⛔⛔ CE QUE CETTE FONCTION EXISTE POUR RENDRE POSSIBLE, ET POURQUOI ELLE VIT ICI.
 *
 * Le `07-` §6 pose que le partage de modèles — Haiku pour la trajectoire, Sonnet
 * pour les ancres — reste ÉTEINT (`partageActif: false`) « tant que la
 * contre-épreuve n'a pas tranché », et il en donne le protocole : **une
 * contre-épreuve sur squelettes gelés, compétence par compétence — même lettre,
 * ou tout passe au modèle fort.** Cette contre-épreuve n'avait jamais été
 * construite, et c'est la seule raison pour laquelle TOUT tourne aujourd'hui sur
 * le modèle fort, exercices de maison compris.
 *
 * ⭐ ELLE REJOUE LA VRAIE CHAÎNE, et c'est tout son intérêt. Mêmes prompts,
 *    mêmes crochets `preP1`/`code1`/`preP2`/`code2`, même agrégation, même
 *    lettre. Le SEUL paramètre qui change est le modèle. *Un banc qui refait
 *    l'orchestration à côté comparerait deux chaînes, pas deux modèles.*
 *
 * ⛔ ELLE N'ÉCRIT RIEN — ni squelette, ni delta, ni mesure. On peut donc la
 *    lancer sur la PRODUCTION sans rien y toucher : les copies réelles sont le
 *    seul corpus qui vaille, et les dupliquer en bac à sable aurait comparé les
 *    modèles sur des textes que personne n'a écrits.
 * ⚠️ Les appels, eux, sont RÉELS et journalisés dans `api_couts` — un banc
 *    coûte, et ce coût doit se voir comme les autres.
 *
 * ⚠️ CE QU'ELLE NE FAIT PAS : le Monitoring et le retour chaud. Le comparand du
 *    §6 est LA LETTRE, que `code2` rend ; y ajouter Calame comparerait des proses
 *    qu'aucune mesure ne départage.
 *
 * @returns `null` quand la compétence est fermée ou le dépôt inexploitable — le
 *   banc saute, il n'invente pas de lettre.
 */
export async function rejouerUneCompetence(
  admin: Admin,
  a: {
    depotId: string; competence: Competence; version: Version; modele: string
    /** Le contexte, quand l'appelant l'a déjà lu — une lecture par dépôt suffit. */
    ctx?: ContexteDepot
  },
): Promise<{
  competence: Competence; modele: string; appels: number
  lettre: string | null; squelette: SqueletteServi | null; alerte: string | null
} | null> {
  const ctx = a.ctx ?? await lireContexte(admin, a.depotId)
  const production = a.version === 'v1' ? ctx.productionV1 : ctx.productionVf
  if (!production) return null

  const etat = etatCompetence(a.competence)
  if (!etat.ouverte || !etat.instrument || !etat.branchement) return null

  const r = await chaineDUneCompetence(admin, {
    ctx, competence: a.competence, version: a.version, production, modele: a.modele,
    instrument: etat.instrument, branchement: etat.branchement,
    aideConsommee: null,
    sansEcriture: true,
  })
  return {
    competence: r.competence, modele: a.modele, appels: r.appels,
    lettre: r.lettre_equivalente, squelette: r.squelette, alerte: r.alerte,
  }
}

/** Le contexte d'un dépôt, pour que le banc ne le relise pas par compétence. */
export { lireContexte as lireContexteDuDepot }
