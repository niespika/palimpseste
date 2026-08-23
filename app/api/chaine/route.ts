// ============================================================================
// C4 · L5 — LE DÉCLENCHEUR DE LA CHAÎNE. Ce n'est PAS un écran.
// ----------------------------------------------------------------------------
// « Ce lot est un SERVICE SERVEUR : la chaîne de mesure et son infrastructure.
//   Il n'a AUCUN ÉCRAN — le déroulé de l'élève est C4-L3, qui DÉCLENCHE PAR UNE
//   ÉCRITURE EN FILE, et affiche ce que tu as produit. »       — la mission L5
//
// Cette route ne fait qu'une chose : réclamer des jobs et les traiter. Elle est
// protégée par `CRON_SECRET`, patron du dépôt (`app/api/scriptorium/synthese-hebdo`).
//
// ⭐ C4-L4 — ELLE DRAINE DEUX ÉTAPES, ET LEURS PORTES NE SONT PAS LES MÊMES.
//    · les MESURES (`mesure_v1`, `mesure_vf`) obéissent à `chaine_actif` ;
//    · la TRANSCRIPTION (`transcription_v1`) obéit à `passation_classe_actif`
//      ET à `exercices_actif` (`utils/passation/acces.ts`).
//    Les lier aurait un mode de panne précis : la coupure automatique de facture
//    bascule `chaine_actif` (C4-L5), et une classe entière se retrouverait sans
//    transcription, pendant l'heure de cours, parce que la facture du mois a
//    coupé. Les deux gestes n'ont pas non plus le même contrat de temps — le
//    traitement en lot est « explicitement différé » (§1.1), la transcription
//    revient « en quelques secondes » (`02-` §6.D).
//
// ⚠️ ON NE RÉCLAME QUE CE QU'ON PEUT SERVIR. `reclamerJobs` pose un bail ET
//    INCRÉMENTE `tentatives` à la prise : réclamer un job qu'on va reposer lui
//    brûle un essai. C'est pourquoi les étapes servables sont calculées AVANT la
//    boucle et passées en filtre SQL.
//
// ⚠️ CETTE ROUTE N'EST PAS LE CHEMIN NORMAL DE LA TRANSCRIPTION — c'est le
//    FILET. Le chemin normal est « le dépôt appelle lui-même le déclencheur »
//    (§1.1) : `utils/passation/ouvrier.ts`, `transcrireMaintenant()`.
//
// ⭐⭐ C4-L11 — CE QUI L'APPELLE, ET À QUELLE CADENCE.
//    `vercel.json` déclare désormais `{ "path": "/api/chaine", "schedule":
//    "* * * * *" }`. ⚠️ CE CRON EST LE **FILET**, PAS LE CHEMIN NORMAL : « le
//    contrat exige que la file se réclame dans la minute qui suit le dépôt, par
//    l'une des deux voies : LE DÉPÔT APPELLE LUI-MÊME LE DÉCLENCHEUR, ou une
//    tâche planifiée à la minute » (`07-` §1.1). Le premier chemin existe
//    (`utils/passation/ouvrier.ts`, `transcrireMaintenant()` ; C4-L3 met en
//    file) ; ce cron « reprend les jobs dont le bail a expiré et que plus aucun
//    dépôt ne rappelle ».
//    ⭐ LA CADENCE EST CELLE QUE L'OFFRE AUTORISE, constatée le 22/08 (C4L4-C) :
//    plan Pro — intervalle minimal UNE FOIS PAR MINUTE, précision à la minute
//    (Hobby : une fois par jour, ±59 min, ce qui ne tiendrait pas le filet d'un
//    contrat de trois minutes). ⛔ Aucun chiffre d'hébergeur ne vit dans les
//    sources, et c'est délibéré : il vit ici et dans `vercel.json`.
//
// ⭐ `maxDuration` — À LA MESURE DU CONTRAT DE LATENCE, plus la marge.
//    « Le retour arrive en moins de trois minutes » (`01-` §12) : une invocation
//    doit pouvoir mener UN job de mesure jusqu'au bout sans être tuée en vol.
//    180 s de contrat, et l'offre donne 300 s par défaut (Pro : 300 s défaut,
//    800 s maximum ; Hobby : 300 s défaut ET maximum — le chiffre dégrade donc
//    proprement). ⛔ Le commentaire « 60 s est le plafond du plan Hobby » ÉTAIT
//    FAUX, C4-L4 l'a corrigé : ne le réintroduis sous aucune forme.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { chaineActive } from '@/utils/chaine/acces'
import { lireConfig } from '@/utils/chaine/config'
import { reclamerJobs, estUneMesure, type EtapeChaine } from '@/utils/chaine/file'
import { tourDeFile } from '@/utils/chaine/chaine'
import { verifierCoherence } from '@/utils/chaine/instruments'
import { passationOuverteAEleve } from '@/utils/passation/acces'
import { traiterUnJobDeTranscription } from '@/utils/passation/ouvrier'

export const maxDuration = 300

// ⚠️ UN job réclamé à la fois. `reclamerJobs` pose le bail sur tous les jobs
//    qu'il rend, mais `tourDeFile` les traite EN SÉRIE : réclamer quatre jobs
//    sous un plafond de 60 s leur brûlait une tentative sans qu'ils soient
//    jamais exécutés — et au troisième tour ils étaient épuisés, en tête de file.
const LOT_PAR_TOUR = 1
/** Ce qu'on garde pour clore proprement avant que la fonction soit tuée. */
const MARGE_MS = 8_000

/**
 * ⭐⭐ LA RÉSERVATION — LA MOITIÉ QUI MANQUAIT À LA GARDE DE BUDGET (C4-L11).
 *
 * La boucle bornée existait déjà : `while (Date.now() - debut < budgetMs)`. Ce
 * qui manquait n'était pas la borne, c'était la RÉSERVATION. La condition disait
 * « il reste du budget », pas « il reste DE QUOI TRAITER le job que je vais
 * réclamer » — et comme `reclamerJobs` pose le bail ET INCRÉMENTE `tentatives`
 * À LA PRISE (`utils/chaine/file.ts`, compare-and-swap), **le dernier job de
 * chaque invocation était réclamé puis tué en vol, sans clôture, en brûlant une
 * tentative**. `tentatives_max` vaut 3 : trois tours, et c'est `echec_definitif`
 * sur une copie jamais traitée. Ce n'était pas un cas limite — c'était le
 * dernier job de CHAQUE tour.
 *
 * Le correctif est une ESTIMATION DE DURÉE PAR ÉTAPE, comparée au reste, AVANT
 * `reclamerJobs` — pas une seconde boucle. Et il ne se contente pas d'arrêter :
 * il RESSERRE LE FILTRE `etapes`, de sorte qu'un tour à quarante secondes de la
 * fin puisse encore prendre une transcription sans jamais prendre une mesure.
 *
 * ⚠️ CES CHIFFRES SONT DES MESURES, PAS DES SOURCES, et aucun ne vit dans le
 *    corpus. La transcription : test de charge du 22/08, 140 copies, deux passes
 *    — médiane 22,4 s, p95 24,3 s, max 25,2 s ; on réserve 30 s. La mesure : le
 *    CONTRAT DE LATENCE lui-même (`config.latenceCibleMs`, 3 min par défaut,
 *    `01-` §12) — réserver moins serait promettre un contrat qu'on n'honore pas.
 *
 * ⚠️ La réserve doit rester ≤ `config.bailMs` (5 min par défaut) : un job dont
 *    le bail expire pendant qu'on le traite serait repris par un autre tour.
 */
const RESERVE_TRANSCRIPTION_MS = 30_000

function reserveDeLEtape(etape: EtapeChaine, latenceCibleMs: number): number {
  return estUneMesure(etape) ? latenceCibleMs : RESERVE_TRANSCRIPTION_MS
}

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const ecarts = verifierCoherence()
  if (ecarts.length) {
    // Un instrument branché sans dérivé (ou l'inverse) servirait une grille
    // fantôme : on ne part pas.
    // ⚠️ À LA CADENCE DE LA MINUTE, CE 409 SE RÉPÉTERAIT 1440 FOIS PAR JOUR — et
    //    un 409 dans le journal d'un cron ne réveille personne. La garde RESTE
    //    (elle rend 409 AVANT tout appel payé) ; ce qu'on ajoute, c'est de quoi
    //    savoir qu'elle s'est allumée : une ligne d'erreur serveur, qui remonte
    //    aux journaux de l'hébergeur là où le corps de la réponse ne remonte pas.
    console.error('[chaine] ARRÊT — instruments incohérents, aucun job réclamé :',
      ecarts.join(' | '))
    return Response.json({ arret: 'instruments incohérents', ecarts }, { status: 409 })
  }

  const admin = createAdminClient()

  // Les deux portes, lues UNE fois, avant la boucle.
  const mesureOuverte = await chaineActive(admin)
  const transcriptionOuverte = await passationOuverteAEleve(admin)
  const etapes: EtapeChaine[] = [
    ...(mesureOuverte ? (['mesure_v1', 'mesure_vf'] as const) : []),
    ...(transcriptionOuverte ? (['transcription_v1'] as const) : []),
  ]
  if (etapes.length === 0) {
    return Response.json({
      gate: '`chaine_actif` et `passation_classe_actif` sont à OFF',
      traites: 0, enFile: true,
    })
  }

  const config = lireConfig()
  const debut = Date.now()
  const budgetMs = maxDuration * 1000 - MARGE_MS
  const bilans: Array<Record<string, unknown>> = []
  let reclames = 0
  let traites = 0

  // On réclame UN job, on le traite, et on ne réclame le suivant que s'il reste
  // DE QUOI LE TRAITER : aucun job ne porte un bail qu'on n'a pas l'intention
  // d'honorer. C4-L11 : le code tient enfin cette phrase (voir `reserveDeLEtape`).
  let arret: string | null = null
  for (;;) {
    const reste = budgetMs - (Date.now() - debut)
    // Les étapes qu'il reste ASSEZ DE TEMPS pour servir — le filtre se resserre
    // à mesure que le budget fond, il ne s'éteint pas d'un coup.
    const servables = etapes.filter((e) => reserveDeLEtape(e, config.latenceCibleMs) <= reste)
    if (!servables.length) {
      arret = reste <= 0
        ? 'budget épuisé'
        : `budget insuffisant pour réserver une étape (${Math.max(0, Math.round(reste / 1000))} s restantes)`
      break
    }
    const jobs = await reclamerJobs(admin, {
      limite: LOT_PAR_TOUR, bailMs: config.bailMs, etapes: servables,
    })
    if (!jobs.length) { arret = 'file vide'; break }
    reclames += jobs.length

    // Le DISPATCH par étape. Une transcription passée à `traiterDepot` serait
    // traitée comme une mesure de v1 : c'est le seul endroit où les deux
    // étapes se croisent, et c'est ici qu'elles se séparent.
    const mesures = jobs.filter((j) => estUneMesure(j.etape))
    const transcriptions = jobs.filter((j) => !estUneMesure(j.etape))

    let suspendu = false
    if (mesures.length) {
      const tour = await tourDeFile(admin, mesures, config)
      for (const s of tour) {
        if (s.bilan) traites++
        bilans.push({
          depot: s.job.depot_id, etape: s.job.etape, erreur: s.erreur ?? null,
          mesures: s.bilan?.mesuresEcrites ?? 0, dejaLa: s.bilan?.mesuresDejaLa ?? 0,
          retour: s.bilan?.retourEcrit ?? false, appels: s.bilan?.appels ?? 0,
          dureeMs: s.bilan?.dureeMs ?? 0, alertes: s.bilan?.alertes ?? [],
        })
      }
      // Chaîne suspendue (gate, facture) : `tourDeFile` a reposé les jobs.
      if (tour.length && tour.every((s) => !s.bilan) && tour.some((s) => s.erreur)) suspendu = true
    }
    for (const j of transcriptions) {
      const s = await traiterUnJobDeTranscription(admin, j)
      if (s.bilan) traites++
      bilans.push({
        depot: s.job.depot_id, etape: s.job.etape, erreur: s.erreur ?? null,
        blocs: s.bilan?.nbBlocs ?? 0, confiance: s.bilan?.confiance ?? null,
        doutes: s.bilan?.doutes ?? 0, appels: s.bilan?.appels ?? 0,
        dureeMs: s.bilan?.dureeMs ?? 0, alertes: s.bilan?.alertes ?? [],
      })
    }
    if (suspendu) { arret = 'chaîne suspendue (gate ou facture)'; break }
  }

  // ⭐ `reclames` et `traites` SE COMPARENT, et c'est la preuve que la garde
  //    tient : « une invocation qui traite n jobs doit avoir réclamé n jobs ».
  //    Un écart dit qu'un job a été pris sans être mené au bout — donc qu'une
  //    tentative a brûlé pour rien.
  return Response.json({
    reclames, traites, arret,
    tuesEnVol: reclames - traites,
    dureeMs: Date.now() - debut,
    bilans,
  })
}
