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
// ⚠️ `maxDuration = 60` est un plafond posé pour une offre d'hébergement qui n'en
//    était pas une. Le geste — poser la cadence et monter `maxDuration` —
//    appartient AU LOT DE CORRECTIFS, pas à C4-L4 (piège 46). Ce que C4-L4 a
//    fait, c'est le VÉRIFIER et l'écrire au relevé.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { chaineActive } from '@/utils/chaine/acces'
import { lireConfig } from '@/utils/chaine/config'
import { reclamerJobs, estUneMesure, type EtapeChaine } from '@/utils/chaine/file'
import { tourDeFile } from '@/utils/chaine/chaine'
import { verifierCoherence } from '@/utils/chaine/instruments'
import { passationOuverteAEleve } from '@/utils/passation/acces'
import { traiterUnJobDeTranscription } from '@/utils/passation/ouvrier'

export const maxDuration = 60

// ⚠️ UN job réclamé à la fois. `reclamerJobs` pose le bail sur tous les jobs
//    qu'il rend, mais `tourDeFile` les traite EN SÉRIE : réclamer quatre jobs
//    sous un plafond de 60 s leur brûlait une tentative sans qu'ils soient
//    jamais exécutés — et au troisième tour ils étaient épuisés, en tête de file.
const LOT_PAR_TOUR = 1
/** Ce qu'on garde pour clore proprement avant que la fonction soit tuée. */
const MARGE_MS = 8_000

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }

  const ecarts = verifierCoherence()
  if (ecarts.length) {
    // Un instrument branché sans dérivé (ou l'inverse) servirait une grille
    // fantôme : on ne part pas.
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
  // du budget : aucun job ne porte un bail qu'on n'a pas l'intention d'honorer.
  while (Date.now() - debut < budgetMs) {
    const jobs = await reclamerJobs(admin, { limite: LOT_PAR_TOUR, bailMs: config.bailMs, etapes })
    if (!jobs.length) break
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
    if (suspendu) break
  }

  return Response.json({ reclames, traites, bilans })
}
