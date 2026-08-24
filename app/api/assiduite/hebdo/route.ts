// ============================================================================
// C4 · L13 — LE DÉCLENCHEUR HEBDOMADAIRE DES COMPTEURS D'ASSIDUITÉ.
// ----------------------------------------------------------------------------
// ⛔ C'EST LE SEUL DÉCLENCHEUR HEBDOMADAIRE SUR LA CLÉ (élève × cycle), et
//    `07-` §2 le dit des deux côtés : « `C4-L12` écrit dans la ligne qu'il
//    trouve, il n'en ouvre pas » — « il n'ouvre PAS son propre déclencheur
//    hebdomadaire : `C4-L13` en pose déjà un sur la même clé, et deux crons sur
//    une même clé fabriquent DEUX LIGNES. Ce lot se greffe sur celui de
//    `C4-L13`. » D'où la forme : **la route est mince, tout le travail vit à
//    `utils/assiduite/collecte-serveur.ts`**, et le point de greffe s'appelle
//    `poserLaSemaineDAssiduite()`.
//
// ⛔ AUCUN INTERRUPTEUR. « La collecte ne les attend pas : les compteurs
//    d'assiduité démarrent à la rentrée même si les écrans suivent » (`07-` §5),
//    et « les deux agrégats ne dépendent d'AUCUN routeur » (`07-` §2). Un
//    septième interrupteur serait le geste exactement contraire à l'échéance du
//    lot : une porte fermée à la rentrée, c'est un semestre perdu.
//
// ⭐ LA GARDE EST UN EN-TÊTE, PAS UN PARAMÈTRE. `Authorization: Bearer
//    ${CRON_SECRET}`, sinon 401 — et **secret absent de l'environnement → 401
//    aussi** : un déploiement sans la variable est FERMÉ, pas ouvert.
//    `CRON_SECRET` n'est pas dans `.env.example` : elle ne vit que dans Vercel,
//    et le cron l'envoie de lui-même quand elle existe.
//
// ⭐ CADENCE — `30 9 * * 1` (`vercel.json`), et le choix se dit.
//    Le lundi 09:30 UTC, soit 05:30 à Toronto en heure d'été et 04:30 en heure
//    normale. La borne à ne pas franchir est la fin de la semaine comptée : le
//    dimanche 23:59:59 à Toronto vaut lundi 04:59:59 UTC (EDT) ou 05:59:59 UTC
//    (EST) — 09:30 UTC est donc APRÈS la clôture dans les deux régimes, et la
//    semaine écoulée est pleinement close quand on la compte. ⚠️ Le cron voisin
//    tourne à `0 9 * * 1` ; on décale de trente minutes pour ne pas mettre deux
//    déclencheurs hebdomadaires dans la même minute.
//
// ⭐ `maxDuration` — la collecte n'appelle AUCUN modèle : elle lit des dépôts et
//    pose une ligne par élève. 60 s est large pour l'effectif d'un professeur, et
//    l'offre en donne 300 par défaut — le chiffre dégrade proprement.
//    ⛔ Le commentaire « 60 s est le plafond du plan Hobby », que porte le cron
//    voisin, EST FAUX et C4-L4 l'a déjà chassé : il n'est pas réintroduit ici.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { poserLaSemaineDAssiduite } from '@/utils/assiduite/collecte-serveur'

export const maxDuration = 60

export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }
  const admin = createAdminClient()
  const fuseau = await lireFuseau()
  const aujourdHui = jourDansFuseau(new Date().toISOString(), fuseau)
  const bilan = await poserLaSemaineDAssiduite(admin, fuseau, aujourdHui)
  return Response.json(bilan)
}
