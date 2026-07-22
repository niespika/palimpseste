// CRON de la synthèse hebdomadaire du Scriptorium élève (RAG L7, SPEC §10.2).
// Planifié par vercel.json : « 0 9 * * 1 » — 09:00 UTC le lundi = nuit de
// dimanche à lundi côté prof (05:00 à Toronto). Première utilisation d'un cron
// Vercel dans le repo : la route est protégée par l'en-tête
// `Authorization: Bearer ${CRON_SECRET}` (variable à poser dans Vercel — le
// cron l'envoie automatiquement quand elle existe). Gate OFF → no-op strict.
// Idempotent (unique classe_id×semaine_lundi) : un re-run écrase proprement ;
// le bouton prof « (Re)générer » couvre les ratés (§15.8).

import { createAdminClient } from '@/utils/supabase/admin'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { genererSynthesesHebdo } from '@/utils/scriptorium-synthese-rag'

// Plafond du plan Vercel Hobby (patron maison) ; 3-4 classes = large.
export const maxDuration = 60

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }
  const admin = createAdminClient()
  const fuseau = await lireFuseau()
  const aujourdHui = jourDansFuseau(new Date().toISOString(), fuseau)
  const bilan = await genererSynthesesHebdo(admin, fuseau, aujourdHui)
  return Response.json(bilan)
}
