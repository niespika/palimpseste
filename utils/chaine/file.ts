import 'server-only'
// ============================================================================
// C4 · L5 — LA FILE, ET SES GARDES D'IDEMPOTENCE.
// ----------------------------------------------------------------------------
// « LE MODE DE PANNE VISÉ EST PRÉCIS : une REPRISE APRÈS EXPIRATION écrit une
//   SECONDE MESURE pour la même copie, et la règle de montée fait bouger une
//   lettre SANS QUE L'ÉLÈVE AIT RIEN FAIT. »        — `07-` §1.1 ; piège 46
//
// Trois verrous, et ils ne font pas le même travail :
//   1. la CLÉ D'IDEMPOTENCE de `exercices_jobs` — un dépôt × une étape = un job,
//      quel que soit le nombre de fois qu'on le met en file ;
//   2. le BAIL — un job pris est réservé pour un temps ; expiré, il se reprend,
//      et c'est exactement le scénario que le « fait quand » demande de PROVOQUER ;
//   3. les index uniques — `(dépôt, compétence, version)` sur les squelettes
//      (C4-L1), `(dépôt, compétence)` sur les mesures (ce lot) : ils font que
//      la reprise ne PEUT PAS écrire une seconde fois, même si le code se trompe.
//
// « Le traitement en lot d'une passation de classe passe par LA MÊME FILE »
// (`07-` §1.1 ; `02-` §6.D) — c'est pourquoi rien ici ne connaît le canal.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

type Admin = SupabaseClient

/**
 * Les étapes que la file porte. C4-L5 a posé les deux mesures ; C4-L4 a ajouté
 * la sienne « ici même », comme ce commentaire l'annonçait.
 *
 * ⚠️ LA TRANSCRIPTION N'EST PAS UN ÉTAGE DE LA CHAÎNE, et elle n'a pas le même
 *    contrat de temps : le traitement en lot d'une passation est « explicitement
 *    différé » (§1.1), la transcription doit revenir « en quelques secondes,
 *    pendant l'heure de cours » (`02-` §6.D). Elle partage la FILE — l'idempotence,
 *    le bail, `echec_definitif`, la reprise — sans partager l'interrupteur
 *    `chaine_actif` ni le régime de modèle. Voir `utils/passation/`.
 */
/**
 * ⭐ `retour_v1` — LE RETOUR SEUL, sans refaire P1 ni P2.
 *
 * Un retour refusé au contrôle laissait un dépôt mesuré sans commentaire, et le
 * seul rattrapage était de rejouer toute l'étape : 7 appels pour en réparer 1,
 * ET la réécriture des squelettes sous des mesures qui, elles, ne bougeaient pas
 * (voir `rejouerLeRetour`). Cette étape relit les squelettes déjà écrits.
 *
 * ⚠️ ELLE EST UNE ÉTAPE DE MESURE au sens de la file : elle appelle le modèle,
 *    donc `chaine_actif` la gouverne, le plafond de facture la coupe, et elle
 *    prend le budget de latence de la chaîne — pas celui de la transcription.
 */
export type EtapeChaine = 'mesure_v1' | 'mesure_vf' | 'transcription_v1' | 'retour_v1'

/** Les étapes qui relèvent de la chaîne de mesure — celles que `chaine_actif` gouverne. */
export const ETAPES_DE_MESURE = ['mesure_v1', 'mesure_vf', 'retour_v1'] as const

export function estUneMesure(etape: EtapeChaine): boolean {
  return (ETAPES_DE_MESURE as readonly string[]).includes(etape)
}

export type StatutJob = 'en_attente' | 'en_cours' | 'abouti' | 'echoue'

export interface Job {
  id: string
  depot_id: string
  etape: EtapeChaine
  statut: StatutJob
  tentatives: number
  tentatives_max: number
  cle_idempotence: string
  echec_definitif: boolean
  dernier_message: string | null
  bail_expire_at: string | null
}

const CHAMPS = 'id, depot_id, etape, statut, tentatives, tentatives_max, cle_idempotence, '
  + 'echec_definitif, dernier_message, bail_expire_at'

/**
 * La clé d'idempotence. Un dépôt et une étape ne font qu'un job — mettre en file
 * deux fois ne fabrique pas deux traitements.
 */
export function cleIdempotence(depotId: string, etape: EtapeChaine): string {
  return `${depotId}:${etape}`
}

/**
 * Met un dépôt en file. C'est par ici que C4-L3 déclenche (« il déclenche par
 * une écriture en file ») et que C4-L4 déclenchera son traitement en lot.
 *
 * Idempotent : le conflit sur la clé n'est pas une erreur, c'est le contrat.
 */
export async function mettreEnFile(
  admin: Admin, depotId: string, etape: EtapeChaine,
): Promise<{ job: Job | null; deja: boolean; erreur: string | null }> {
  const cle = cleIdempotence(depotId, etape)
  const { data, error } = await admin
    .from('exercices_jobs')
    .insert({ depot_id: depotId, etape, cle_idempotence: cle, statut: 'en_attente' })
    .select(CHAMPS)
    .maybeSingle()

  if (!error) return { job: (data as unknown as Job | null) ?? null, deja: false, erreur: null }
  // 23505 = violation d'unicité : le job existe déjà, et c'est ce qu'on voulait.
  if (error.code === '23505') {
    const { data: existant } = await admin
      .from('exercices_jobs').select(CHAMPS).eq('cle_idempotence', cle).maybeSingle()
    return { job: (existant as unknown as Job | null) ?? null, deja: true, erreur: null }
  }
  return { job: null, deja: false, erreur: `${error.code} ${error.message}` }
}

/**
 * Réclame des jobs à traiter, en posant un BAIL sur chacun.
 *
 * Sont réclamables : ceux qui attendent, et ceux qu'un traitement a pris puis
 * abandonnés — bail expiré. La prise est un COMPARE-AND-SWAP : deux processus
 * qui visent le même job, un seul l'obtient, et la reprise ne double jamais.
 */
export async function reclamerJobs(
  admin: Admin,
  options: {
    limite: number; bailMs: number; maintenant?: Date
    /**
     * C4-L4 — les étapes qu'on accepte de servir CE TOUR-CI. Omis, on réclame
     * tout, exactement comme avant.
     *
     * ⚠️ Le drainage n'est pas gouverné par le même interrupteur pour tout le
     *    monde : `chaine_actif` gouverne la MESURE, et la transcription d'une
     *    classe ne doit pas s'éteindre parce que la facture du mois a coupé
     *    (`utils/passation/acces.ts`). Un tour qui ne peut pas servir une étape
     *    ne doit pas la RÉCLAMER : la réclamation pose un bail et **brûle une
     *    tentative** (`reclamerJobs` incrémente à la prise) — trois tours, et
     *    c'est `echec_definitif` sur une copie jamais traitée.
     */
    etapes?: readonly EtapeChaine[]
    /**
     * C4-L4 — réclamer LE job D'UN DÉPÔT, et non le plus ancien de la file.
     *
     * ⚠️ TROUVÉ PAR LE TEST DE CHARGE À CENT QUARANTE (22/08). Sans ce filtre,
     *    « le dépôt appelle lui-même le déclencheur » (§1.1) ne marche qu'à un
     *    dépôt à la fois : le tri est `created_at ASC`, donc à trente-cinq
     *    dépôts simultanés, l'élève qui vient de photographier réclame la copie
     *    DU PREMIER, la repose, et n'a jamais déclenché la sienne. Il attendrait
     *    alors la tâche planifiée — celle qui « ne tient pas la seconde », et qui
     *    n'est même pas encore posée (piège 46). Trente-cinq élèves dans une
     *    salle, et un seul écran qui répond.
     */
    depotId?: string
  },
): Promise<Job[]> {
  const maintenant = options.maintenant ?? new Date()
  const nowIso = maintenant.toISOString()
  const finBail = new Date(maintenant.getTime() + options.bailMs).toISOString()

  // ⚠️ LE BAIL SE FILTRE EN SQL, JAMAIS EN JAVASCRIPT. Comparer deux
  //    horodatages sous forme de CHAÎNES est faux par construction : PostgREST
  //    rend `…+00:00`, `toISOString()` rend `….000Z`, et `'+' < '.'` — un bail
  //    encore vivant se lisait alors comme expiré. C'est aussi ce qui fait
  //    servir l'index `idx_jobs_reclamables (statut, bail_expire_at)`.
  let requete = admin
    .from('exercices_jobs')
    .select(CHAMPS)
    .eq('echec_definitif', false)
    .or(`statut.eq.en_attente,and(statut.eq.en_cours,or(bail_expire_at.is.null,bail_expire_at.lt."${nowIso}"))`)
  // ⚠️ LE FILTRE EST EN SQL, jamais après coup : filtrer en JavaScript ferait
  //    remonter les jobs qu'on ne sait pas servir, les compterait dans la
  //    limite, et laisserait la file paraître vide alors qu'elle ne l'est pas.
  if (options.etapes) {
    if (options.etapes.length === 0) return []
    requete = requete.in('etape', options.etapes as readonly string[])
  }
  if (options.depotId) requete = requete.eq('depot_id', options.depotId)
  const { data: candidats, error } = await requete
    .order('created_at', { ascending: true })
    .limit(options.limite * 4)
  if (error) {
    // Une file qui a l'air vide alors qu'elle est cassée est le pire des états :
    // supabase-js ne lève pas, il faut donc le dire soi-même.
    console.error(`[chaine] file ILLISIBLE — ${error.code} ${error.message}`)
    return []
  }

  const pris: Job[] = []
  for (const brut of (candidats ?? []) as unknown as Job[]) {
    if (pris.length >= options.limite) break
    if (brut.tentatives >= brut.tentatives_max) {
      // Un job épuisé qui reste réclamable occupe la TÊTE DE FILE pour toujours
      // (le tri est `created_at ASC`) et fait rendre zéro job à chaque tour.
      // On le clôt ici, ce qui le sort du `select` ET rend son échec VISIBLE —
      // c'est l'état que l'écran de C4-L3 interroge (`07-` §1.1).
      await marquerEpuise(admin, brut)
      continue
    }

    const { data } = await admin
      .from('exercices_jobs')
      .update({
        statut: 'en_cours',
        tentatives: brut.tentatives + 1,
        bail_expire_at: finBail,
        updated_at: nowIso,
      })
      .eq('id', brut.id)
      .eq('tentatives', brut.tentatives)      // ── le compare-and-swap
      .eq('statut', brut.statut)
      .select(CHAMPS)
      .maybeSingle()
    if (data) pris.push(data as unknown as Job)
  }
  return pris
}

/** Un job dont les tentatives sont épuisées : `echoue`, et VISIBLEMENT définitif. */
async function marquerEpuise(admin: Admin, job: Job): Promise<void> {
  const { error } = await admin.from('exercices_jobs').update({
    statut: 'echoue',
    echec_definitif: true,
    dernier_message: job.dernier_message
      ?? `plafond de tentatives atteint (${job.tentatives}/${job.tentatives_max}) sans clôture — `
      + 'le traitement a été interrompu en vol à chaque essai',
    bail_expire_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', job.id).eq('tentatives', job.tentatives)
  if (error) console.error(`[chaine] job épuisé non marqué — ${error.code} ${error.message}`)
}

/**
 * Clôt un job.
 *
 * ⚠️ UN ÉCHEC N'EST PAS TERMINAL TANT QUE LE PLAFOND N'EST PAS ATTEINT. Le job
 *    retourne EN FILE, et c'est tout l'objet de `tentatives_max` (posé à 3 par
 *    C4-L1 : « plafond de tentatives de l'IA avant forfait »). Marquer `echoue`
 *    dès le premier essai le sortait du filtre de réclamation pour toujours,
 *    avec `echec_definitif` à `false` — et l'écran de C4-L3 aurait affiché
 *    « en cours » indéfiniment.
 *
 * Le numéro de tentative sert de JETON DE BAIL : un ouvrier zombie, dont le bail
 * a expiré et dont le job a été repris par un autre, ne clôt pas le job d'autrui.
 */
export async function terminerJob(
  admin: Admin, job: Job,
  issue: { statut: 'abouti' | 'echoue'; message?: string | null; definitif?: boolean },
): Promise<{ clos: boolean; erreur: string | null }> {
  // `definitif` : la panne est PERMANENTE (un dépôt sans production, un plafond
  // d'appels atteint) — réessayer trois fois n'y changerait rien, et l'écran de
  // C4-L3 doit pouvoir dire tout de suite que le retour ne viendra pas.
  const epuise = issue.definitif === true || job.tentatives >= job.tentatives_max
  const statut = issue.statut === 'echoue' && !epuise ? 'en_attente' : issue.statut
  const { data, error } = await admin.from('exercices_jobs').update({
    statut,
    echec_definitif: issue.statut === 'echoue' && epuise,
    dernier_message: issue.message ?? null,
    bail_expire_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', job.id).eq('tentatives', job.tentatives).select('id')
  if (error) {
    console.error(`[chaine] job non clos — ${error.code} ${error.message}`)
    return { clos: false, erreur: `${error.code} ${error.message}` }
  }
  if (!data || data.length === 0) {
    // Le bail avait expiré et un autre a repris : on ne touche pas à son travail.
    console.error(`[chaine] clôture ignorée — le job ${job.id} a été repris par un autre `
      + `(tentative ${job.tentatives} périmée)`)
    return { clos: false, erreur: 'bail périmé' }
  }
  return { clos: true, erreur: null }
}

/**
 * Repose un job sans le clore — la coupure automatique de facture le fait :
 * « en laissant LES DÉPÔTS EN FILE : rien ne se perd, rien ne s'écrit à moitié,
 * le traitement reprend à la réouverture » (piège 49).
 *
 * La tentative consommée est RENDUE : la chaîne n'a pas échoué, elle n'a pas eu
 * le droit de tourner.
 */
export async function reposerJob(admin: Admin, job: Job, motif: string): Promise<void> {
  const { error } = await admin.from('exercices_jobs').update({
    statut: 'en_attente',
    tentatives: Math.max(0, job.tentatives - 1),
    dernier_message: motif,
    bail_expire_at: null,
    updated_at: new Date().toISOString(),
    // Le jeton de bail, ici aussi : un ouvrier zombie ne repose pas le job d'un autre.
  }).eq('id', job.id).eq('tentatives', job.tentatives)
  if (error) console.error(`[chaine] job non reposé — ${error.code} ${error.message}`)
}

/**
 * REMETTRE UN JOB EN FILE, À LA MAIN — le geste du professeur, pas celui de la
 * chaîne.
 *
 * ⭐ POURQUOI IL FALLAIT L'ÉCRIRE. Un job `abouti` n'est plus réclamable, et
 *    `mettreEnFile` est idempotent : sa clé refuse un second job pour le même
 *    couple (dépôt, étape). Un dépôt dont la mesure a abouti SANS ÉCRIRE DE
 *    RETOUR était donc **définitivement sans retour** — relancer le lot le
 *    signalait « déjà en file » et ne le retouchait pas. C'est arrivé en prod le
 *    26/08 : une copie sur onze, mesurée, sans retour, et l'écran du professeur
 *    affichait « En file. » indéfiniment.
 *
 * ⚠️ LA TENTATIVE REPART À ZÉRO, et c'est voulu : ce n'est pas une reprise
 *    automatique après panne, c'est une DEMANDE HUMAINE. `reposerJob` rend une
 *    tentative parce que la chaîne n'a pas eu le droit de tourner ; ici elle a
 *    tourné, et le professeur en redemande un tour en connaissance de cause.
 *
 * ⚠️ ON NE RELANCE PAS CE QUI TOURNE. Un job `en_attente` ou `en_cours` est déjà
 *    pris en charge — le relancer lui volerait son bail et ferait travailler
 *    deux ouvriers sur le même dépôt.
 *
 * ⭐ La sûreté ne tient pas à cette fonction mais à l'IDEMPOTENCE DE L'ÉTAPE :
 *    une reprise n'écrit jamais une seconde mesure (elle les compte « déjà là »).
 *    C'est ce qui rend le geste rejouable sans dégât.
 */
export async function relancerUnJob(
  admin: Admin, depotId: string, etape: EtapeChaine, motif: string,
): Promise<{ relance: boolean; raison: string }> {
  const { data, error } = await admin
    .from('exercices_jobs').select(CHAMPS)
    .eq('cle_idempotence', cleIdempotence(depotId, etape)).maybeSingle()
  if (error) return { relance: false, raison: `file illisible — ${error.code} ${error.message}` }
  const job = (data as unknown as Job | null) ?? null
  if (!job) return { relance: false, raison: "aucun travail de ce type n'est en file pour cette copie" }
  if (job.statut === 'en_attente' || job.statut === 'en_cours') {
    return { relance: false, raison: 'ce travail est déjà en file — il tourne au prochain passage' }
  }

  const { data: maj, error: eMaj } = await admin.from('exercices_jobs').update({
    statut: 'en_attente',
    tentatives: 0,
    echec_definitif: false,
    bail_expire_at: null,
    dernier_message: motif,
    updated_at: new Date().toISOString(),
    // Le jeton de bail : si un autre a repris le job entre la lecture et
    // l'écriture, on ne lui vole pas son travail.
  }).eq('id', job.id).eq('tentatives', job.tentatives).select('id')
  if (eMaj) return { relance: false, raison: `remise en file refusée — ${eMaj.code} ${eMaj.message}` }
  if (!maj || maj.length === 0) {
    return { relance: false, raison: 'le travail a été repris entre-temps — rien n\'a été touché' }
  }
  return { relance: true, raison: 'remis en file' }
}

/** L'état de job LISIBLE — la part de ce lot dans l'état d'attente de C4-L3. */
export interface EtatLisible {
  etape: EtapeChaine
  statut: StatutJob
  echec_definitif: boolean
  tentatives: number
  tentatives_max: number
  message: string | null
}

export async function etatDesJobs(admin: Admin, depotId: string): Promise<EtatLisible[]> {
  const { data, error } = await admin
    .from('exercices_jobs').select(CHAMPS).eq('depot_id', depotId)
    .order('created_at', { ascending: true })
  if (error) console.error(`[chaine] état des jobs illisible — ${error.code} ${error.message}`)
  return ((data ?? []) as unknown as Job[]).map((j) => ({
    etape: j.etape,
    statut: j.statut,
    echec_definitif: j.echec_definitif,
    tentatives: j.tentatives,
    tentatives_max: j.tentatives_max,
    message: j.dernier_message,
  }))
}
