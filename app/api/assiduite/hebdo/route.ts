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
// ⭐ `maxDuration` — 300, et le 60 d'origine était trop court. Le raisonnement
//    d'alors ne tenait que pour LA COLLECTE : « elle n'appelle aucun modèle, elle
//    lit des dépôts et pose une ligne par élève ». ⛔⛔ Mais depuis C4-L12, cette
//    route porte AUSSI le greffon du routeur, et lui est SÉQUENTIEL : une lecture
//    d'inscriptions par élève, puis une pose par élève, et DANS celle-ci un
//    `insert` par décision.
//    ⛔ Mesuré le 30/08 sur la production, dans les journaux Vercel : un
//    aller-retour Supabase depuis la fonction (`iad1`) coûte **160 à 332 ms**
//    (`/api/chaine` : 696 ms d'exécution pour trois appels à 332/192/160).
//    Pour 62 élèves et seulement 4 exercices chacun, on compte ~630 allers-retours
//    séquentiels, soit **~100 à 126 s** — au-delà des 60 s, donc coupé EN VOL,
//    et chaque `insert` étant sa propre transaction, **les décisions déjà écrites
//    restent** : une assignation partielle, sans trace de l'arrêt.
//    ⭐ 300 est honoré sur cette offre, et ce n'est pas une hypothèse :
//    `/api/chaine` le déclare et Vercel affiche « / 5m » pour elle.
//    ⚠️ **CE CHIFFRE ACHÈTE DE LA MARGE, IL NE RÈGLE PAS LE FOND** : à 6-12
//    exercices par élève, on atteint ~1 600 allers-retours, soit plus de 300 s.
//    Le vrai correctif est de GROUPER les écritures — ce que `collecte-serveur`
//    fait déjà deux fichiers plus loin (`upsert(lot)`) — et de borner la boucle
//    sur une horloge, comme `/api/chaine` (`budgetMs = maxDuration * 1000 - MARGE`).
//    ⛔ Le commentaire « 60 s est le plafond du plan Hobby », que portait le cron
//    voisin, EST FAUX et C4-L4 l'a déjà chassé : il n'est pas réintroduit ici.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { jourDansFuseau } from '@/utils/fuseau'
import { lireFuseau } from '@/utils/fuseau-serveur'
import { poserLaSemaineDAssiduite } from '@/utils/assiduite/collecte-serveur'
import { poserLesSemainesDuRouteur } from '@/utils/moteur/cycle-serveur'

export const maxDuration = 300

// ⭐⭐ LE GREFFON DE `C4-L12`, ET L'ORDRE COMPTE — 24/08.
// `C4-L12` « se greffe sur ce déclencheur » plutôt que d'en ouvrir un second
// sur la même clé (élève × cycle). L'ordre des deux appels EST la règle :
//   1. LA COLLECTE pose la ligne de la semaine ÉCOULÉE et ses deux agrégats ;
//   2. LE ROUTEUR remplit les MINUTES de cette même ligne — celle qui vient
//      d'être posée, jamais celle de la semaine qu'il pose —, puis il pose la
//      semaine qui COMMENCE.
// ⛔ Inverser les deux perdrait les minutes en silence : l'`update` du routeur
//    ne trouverait aucune ligne. ⛔ Et le routeur n'en POSE jamais aucune :
//    « il remplit la ligne qu'il trouve, il n'en ouvre pas » (`07-` §1.5).
export async function GET(req: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'Non autorisé.' }, { status: 401 })
  }
  const admin = createAdminClient()
  const fuseau = await lireFuseau()
  const aujourdHui = jourDansFuseau(new Date().toISOString(), fuseau)
  const assiduite = await poserLaSemaineDAssiduite(admin, fuseau, aujourdHui)
  // ⚠️ Un incident du routeur ne doit jamais faire échouer la collecte, dont le
  //    coût est IRRÉVERSIBLE — « une semaine non comptée ne se rattrape pas ».
  let routeur: unknown
  try {
    routeur = await poserLesSemainesDuRouteur(admin, fuseau, aujourdHui)
  } catch (e) {
    routeur = { erreur: (e as Error).message,
      note: 'le routeur a échoué ; la collecte d\'assiduité, elle, est passée.' }
  }
  return Response.json({ assiduite, routeur })
}
