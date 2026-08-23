import 'server-only'
// ============================================================================
// C4 · L3 — LA MISE EN FILE, ET LE DÉCLENCHEUR.
// ----------------------------------------------------------------------------
// ⭐ « TU DÉCLENCHES PAR UNE ÉCRITURE EN FILE, ET TU APPELLES LE DÉCLENCHEUR »
//    (piège 34). `mettreEnFile(admin, depotId, 'mesure_v1' | 'mesure_vf')` est
//    **idempotent** (clé d'idempotence par dépôt × étape) ; l'attente se lit par
//    `etatDesJobs(admin, depotId)`.
//
// ⚠️⚠️ **LE CONTRAT DE TROIS MINUTES EXIGE QUE LA FILE SE RÉCLAME DANS LA MINUTE
//    QUI SUIT LE DÉPÔT** (`07-` §1.1) : **le dépôt appelle LUI-MÊME le
//    déclencheur**. La tâche planifiée est le FILET qui reprend les jobs
//    expirés — *elle ne tient pas le contrat à elle seule*. **Et un déclencheur
//    qui manque NE SE VOIT NULLE PART : la file se remplit normalement, elle ne
//    se vide jamais.**
//    ⚠️ Constaté en séance : il n'existait **aucun** réveil pour `mesure_v1` /
//       `mesure_vf` — `transcrireMaintenant` (C4-L4) n'a pas d'équivalent, et
//       **aucun cron ne vise `/api/chaine`**. Une mesure mise en file y restait
//       indéfiniment. C'est ce module qui referme le trou, côté maison.
//
// ⭐ DEUX VALEURS QUE LE CHEMIN DE LA FILE PERD, ET QU'IL FAUT DONC PASSER ICI.
//    `tourDeFile` n'appelle `traiterDepot` qu'avec `{ config }` : **`registre`
//    et `aideConsommee` ne voyagent PAS par la file**. Le déclencheur en ligne
//    est le seul endroit d'où ils peuvent partir :
//      · **`aide_consommee`** — « c'est TOI qui la portes : passe-la à
//        `traiterDepot` » (piège 35). La chaîne la RECOPIE telle quelle et ne
//        la calcule jamais ;
//      · **le REGISTRE** — il « s'élit » par la règle du `01-` §8.7, dont
//        C4-L2 porte l'unique implémentation (`elireLeRegistre`). ⚠️ Ce module
//        **n'élit rien** : il assemble les signaux que C4-L2 demande et lui
//        pose la question. Non fourni, la chaîne retomberait sur `descriptif`
//        pour tout le monde, ce qui éteindrait en silence les registres
//        démonstratif et interrogatif.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import {
  mettreEnFile, reclamerJobs, terminerJob, reposerJob, etatDesJobs,
  type EtapeChaine, type EtatLisible,
} from '../chaine/file'
import {
  traiterDepot, ChaineSuspendue, DepotInexploitable, type BilanDepot,
} from '../chaine/chaine'
import { lireConfig } from '../chaine/config'
import { elireLeRegistre, receptiviteRetrouvee, type SignauxRegistre } from '../routeur/escalade'
import type { Registre } from '../chaine/types'
import type { DepotMaison } from './depot'
import type { Version } from './types'

type Admin = ReturnType<typeof createAdminClient>

export const etapeDe = (version: Version): EtapeChaine =>
  version === 'v1' ? 'mesure_v1' : 'mesure_vf'

/**
 * L'ÉTAT D'ATTENTE — « un état EXPLICITE, JAMAIS UN ÉCRAN MUET » (`07-` §3 ;
 * `01-` §12). *Un écran muet fait recharger, et une reprise mal gardée écrit une
 * seconde mesure.*
 *
 * ⚠️ La reprise, elle, ne peut plus écrire deux fois : la chaîne tient
 *    l'idempotence de bout en bout (index uniques sur les mesures, les
 *    squelettes, le Monitoring et les retours). Ce que l'état protège, c'est
 *    l'élève — pas la base.
 */
export interface AttenteLisible {
  /** Les jobs du dépôt, tels que la file les rend. */
  jobs: EtatLisible[]
  /** Un traitement court en ce moment. */
  enCours: boolean
  /** ⚠️ `echec_definitif` : **le retour ne viendra pas**, et il faut le DIRE. */
  echecDefinitif: boolean
  /** Le message déjà rédigé par la file, quand il y en a un. */
  message: string | null
}

export async function attenteDuDepot(admin: Admin, depotId: string): Promise<AttenteLisible> {
  const jobs = await etatDesJobs(admin, depotId)
  const mesures = jobs.filter((j) => j.etape === 'mesure_v1' || j.etape === 'mesure_vf')
  const echec = mesures.find((j) => j.echec_definitif)
  return {
    jobs: mesures,
    enCours: mesures.some((j) => j.statut === 'en_attente' || j.statut === 'en_cours'),
    echecDefinitif: !!echec,
    message: echec?.message ?? mesures.find((j) => j.message)?.message ?? null,
  }
}

// ── Le registre : on ASSEMBLE les signaux, C4-L2 ÉLIT ────────────────────────

/**
 * La cible du retour, DANS L'ORDRE DU `07-` §1.1 (C4-L11) :
 *   1. la DÉCISION du routeur — son domicile de sortie, « sur la voie du
 *      routeur elle reste NULL : la cible est la sortie de la couche 2 et vit
 *      à la décision » ;
 *   2. `exercices.cible_primaire` — la voie du PROFESSEUR, où l'écran de
 *      conception la lui demande.
 *
 * ⚠️ Les deux ne coexistent jamais par construction ; la chaîne DIT le cas où
 *    elle les trouve ensemble (`alerteDeCoexistence`, `utils/chaine/chaine.ts`)
 *    plutôt que de le trancher en silence.
 */
async function cibleDeLaDecision(admin: Admin, depot: DepotMaison): Promise<string | null> {
  if (depot.routeur_decision_id) {
    const { data } = await admin.from('routeur_decisions')
      .select('cible_retenue').eq('id', depot.routeur_decision_id).maybeSingle()
    const c = (data?.cible_retenue as string | null) ?? null
    if (c) return c
  }
  return depot.exercice.cible_primaire ?? null
}

/**
 * ⚠️ « Le registre s'élit par la règle du `01-` §8.7, et **il n'y a pas de main
 *    du professeur dessus** » (`07-` §4). Ce module ne décide de rien : il lit
 *    l'état, il appelle `elireLeRegistre`, il passe le résultat. Si un signal
 *    manque, **la règle a déjà son défaut** — `descriptif` — et c'est elle qui
 *    le pose, pas nous.
 *
 * ⚠️ Le mot « registre » nomme DEUX choses (`07-` §4) : le registre de LANGUE,
 *    partagé et transversal, et le registre de RETOUR — descriptif /
 *    démonstratif / interrogatif —, qui est celui-ci. « Substituer l'un dans
 *    l'autre est un MODE DE PANNE, pas une hypothèse. »
 */
export async function registreDuRetour(
  admin: Admin, depot: DepotMaison,
): Promise<{ registre: Registre; motif: string }> {
  const cible = await cibleDeLaDecision(admin, depot)
  // Sans cible primaire connue, le §8.7 n'a pas de palier à lire : sa propre
  // règle rend `descriptif`, et c'est le bon défaut — pas un repli inventé.
  if (!cible) {
    return elireLeRegistre({
      statutRecette: 'mesuree_silencieusement',
      brancheN2: null, receptiviteRetrouvee: false,
      palierCible: null, cranServi: null, n1CranInjecte: false,
    } as SignauxRegistre)
  }

  const [{ data: niveau }, { data: escalades }] = await Promise.all([
    admin.from('competences_niveaux')
      .select('lettre, statut_recette')
      .eq('eleve_id', depot.eleve_id).eq('competence', cible).maybeSingle(),
    admin.from('competences_escalade')
      .select('observable, degre')
      .eq('eleve_id', depot.eleve_id).eq('competence', cible),
  ])

  const surLObservable = (escalades ?? []).find(
    (e) => e.observable === depot.exercice.observable_isole_code)
  const enN2 = surLObservable?.degre === 'N2'

  // La réceptivité retrouvée se lit sur les deux dernières mesures de la
  // compétence — « delta v1→vf restreint fort, ou correction de paire juste ».
  const { data: deux } = await admin.from('competences_mesures')
    .select('delta_v1_vf, paire_correction_juste')
    .eq('eleve_id', depot.eleve_id).eq('competence', cible)
    .order('mesure_at', { ascending: false }).limit(2)
  const retrouvee = receptiviteRetrouvee(
    (deux ?? []).reverse().map((m) => ({
      // ⚠️ « NULL n'est pas 0 » : un delta absent n'est pas un delta faible.
      deltaFort: m.delta_v1_vf === null ? null : (m.delta_v1_vf as number) > 0,
      correctionJuste: m.paire_correction_juste as boolean | null,
    })),
  )

  return elireLeRegistre({
    statutRecette: (niveau?.statut_recette ?? 'mesuree_silencieusement') as never,
    brancheN2: enN2 ? 'reception' : null,
    receptiviteRetrouvee: retrouvee,
    palierCible: (niveau?.lettre ?? null) as never,
    cranServi: (depot.exercice.cran ?? null) as never,
    // N1 injecte un cran isolant : la case est « sous la bande » (`01-` §8.4).
    n1CranInjecte: surLObservable?.degre === 'N1',
  } as SignauxRegistre)
}

// ── Le déclencheur ───────────────────────────────────────────────────────────

export interface BilanDeclenchement {
  /** Le job a-t-il été créé, ou existait-il déjà ? */
  dejaEnFile: boolean
  bilan: BilanDepot | null
  /** Ce qu'il y a à dire — jamais un écran muet. */
  motif: string | null
  registre: Registre | null
}

/**
 * ⭐ METTRE EN FILE **PUIS** DÉCLENCHER — les deux, dans cet ordre, et jamais
 * l'un sans l'autre. La mise en file est le CONTRAT (idempotent, reprenable par
 * le filet) ; le déclenchement est le CONTRAT DE LATENCE.
 *
 * ⚠️ IL RÉCLAME **SON PROPRE** JOB, et pas le premier de la file. Sans le filtre
 *    `depotId`, `reclamerJobs` trie par `created_at ASC` : l'élève qui vient de
 *    remettre réclamerait la copie d'un autre, la reposerait, et **n'aurait
 *    jamais déclenché la sienne**. C'est la panne que le test de charge à cent
 *    quarante a trouvée sur la transcription (C4-L4) ; on ne la refait pas.
 *
 * ⚠️ Le compare-and-swap de `reclamerJobs` rend le **double-clic gratuit** : un
 *    seul des deux appels obtient le job, l'autre rend `null` et n'a rien à
 *    faire — ce n'est pas une erreur, et l'écran ne doit pas le dire comme telle.
 */
export async function mesurerMaintenant(
  admin: Admin, depot: DepotMaison, version: Version,
): Promise<BilanDeclenchement> {
  const etape = etapeDe(version)

  const { job: cree, deja, erreur } = await mettreEnFile(admin, depot.id, etape)
  if (erreur || !cree) {
    return { dejaEnFile: false, bilan: null, registre: null,
      motif: `La mesure n’a pas pu être mise en file : ${erreur ?? 'aucun job'}.` }
  }

  const config = lireConfig()
  const jobs = await reclamerJobs(admin, {
    limite: 1, bailMs: config.bailMs, etapes: [etape], depotId: depot.id,
  })
  const job = jobs[0]
  if (!job) {
    return { dejaEnFile: deja, bilan: null, registre: null,
      motif: 'la mesure est déjà en cours ou déjà faite' }
  }

  const { registre } = await registreDuRetour(admin, depot)

  try {
    const bilan = await traiterDepot(admin, depot.id, version, {
      config,
      registre,
      // ⭐ Piège 35 — la seule entrée des règles que la chaîne attend de l'écran.
      aideConsommee: depot.aide_consommee ?? null,
    })
    await terminerJob(admin, job, { statut: 'abouti', message: resume(bilan) })
    return { dejaEnFile: deja, bilan, registre, motif: null }
  } catch (e) {
    if (e instanceof ChaineSuspendue) {
      // Suspension GLOBALE et TEMPORAIRE — gate OFF, ou facture coupée. Le job
      // est REPOSÉ (sa tentative lui est rendue) : rien ne se perd, le
      // traitement reprend à la réouverture, et l'écran affiche l'attente.
      await reposerJob(admin, job, e.message)
      return { dejaEnFile: deja, bilan: null, registre,
        motif: 'le traitement est suspendu pour le moment — ton travail est enregistré, '
          + 'et le retour arrivera dès la réouverture' }
    }
    if (e instanceof DepotInexploitable) {
      // Panne LOCALE et PERMANENTE : le job se clôt DÉFINITIVEMENT. L'écran doit
      // le dire — c'est exactement l'`echec_definitif` que l'attente lit.
      await terminerJob(admin, job, { statut: 'echoue', message: e.message, definitif: true })
      return { dejaEnFile: deja, bilan: null, registre, motif: e.message }
    }
    const message = e instanceof Error ? e.message : String(e)
    await terminerJob(admin, job, { statut: 'echoue', message })
    return { dejaEnFile: deja, bilan: null, registre, motif: message }
  }
}

function resume(b: BilanDepot): string {
  return `${b.competencesMesurees.length} mesurée(s), ${b.mesuresEcrites} écrite(s), `
    + `retour ${b.retourEcrit ? 'écrit' : 'non écrit'}, ${b.appels} appel(s), `
    + `${Math.round(b.dureeMs / 1000)} s`
}
