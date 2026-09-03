import 'server-only'
// ============================================================================
// C6 · L1 — LES TROIS ÉCRITURES DE LA PAGE D'ATTENTION, SANS LEUR GARDE.
// ----------------------------------------------------------------------------
// ⭐⭐ POURQUOI ELLES VIVENT ICI PLUTÔT QUE DANS L'ACTION.
//
// La convention de couture demande d'éprouver le canal **PAR EXÉCUTION, jamais
// par lecture** — « faire passer une donnée d'un bout à l'autre et CONSTATER EN
// BASE » (`PLAN_DE_CHANTIER.md` §5). Or une server action React lit les cookies
// de la requête (`verifierProf` → `createClient()`) : **elle n'est pas
// appelable depuis un script de recette**. Un script qui recopierait ses trois
// `update` n'éprouverait plus le code de production, il éprouverait sa copie —
// et « une copie privée de la règle a déjà coûté un écran entier ».
//
// D'où le partage : **l'écriture ici, la GARDE DE RÔLE à l'action**
// (`app/prof/classes/actions.ts`). Rien de ce fichier n'est atteignable sans
// passer par elle depuis le web ; le script de recette, lui, l'appelle
// directement — c'est la même ligne de code qui s'exécute dans les deux cas.
//
// ⛔ AUCUNE DE CES TROIS ÉCRITURES NE CORRIGE UNE MESURE. Elles marquent QU'UN
//    HUMAIN A REGARDÉ, et rien d'autre.
// ⚠️ AUCUN TEXTE LIBRE : que des horodatages et des identifiants. Le piège du
//    CRLF des `<textarea>` — qui vaut aussi pour les server actions React — n'a
//    donc rien à mordre ici.
// ============================================================================

import type { createAdminClient } from '@/utils/supabase/admin'
import { confirmerSignalement } from '@/utils/integrite'

type Admin = ReturnType<typeof createAdminClient>

export interface Issue { ok: boolean; message: string }

/**
 * ⭐⭐ « J'AI PRIS LE DOSSIER » — L'ÉCRIVAIN QUI MANQUAIT À `dossier_n3_traite_at`.
 *
 * Vérifié le 28/08 : la colonne est LUE par `utils/routeur/donnees.ts:208` et par
 * `escalade.ts:370`, et **rien ne l'écrivait**. C'est le mot « se traite » du
 * « fait quand » de ce lot, et c'est le seul geste d'écriture du lot sur cette
 * table.
 *
 * ⛔⛔ IL NE DÉSESCALADE PAS, ET LE MOT COMPTE. `dossier_n3_traite_at` dit
 *    « LE PROFESSEUR A PRIS LE DOSSIER », jamais « l'observable est acquis ». Le
 *    `degre` ne bouge pas d'un cran : la désescalade a sa règle, et elle est
 *    ailleurs — « dès que l'observable ciblé change de statut » (`01-` §8.6),
 *    et c'est le moteur qui l'applique, jamais un bouton.
 *
 * ⚠️ CE QUE LE GESTE CHANGE POUR LE ROUTEUR, ET IL FAUT LE SAVOIR :
 *    `enRegimeDEntretien` (`escalade.ts:477`) lit `!dossierN3TraiteAt`. Marquer
 *    le dossier traité fait donc SORTIR la compétence du régime d'entretien —
 *    elle redevient candidate aux cibles primaires. **C'est exactement ce que la
 *    source demande** : le régime d'entretien vaut « EN ATTENDANT » que le
 *    professeur prenne la main (`01-` §8.4), et l'attente s'arrête ici.
 *    ⛔ Ce n'est pas une désescalade : l'escalade reste en N3.
 *
 * ⭐ IDEMPOTENT PAR COMPARE-AND-SET : `.is('dossier_n3_traite_at', null)`. Un
 *    double-clic, deux onglets, un rejeu — une seule écriture passe, et la date
 *    reste celle du premier geste.
 */
export async function prendreLeDossierN3(
  admin: Admin, eleveId: string, competence: string, observable: string,
  maintenant = new Date().toISOString(),
): Promise<Issue> {
  // ⚠️ `supabase-js` NE LÈVE PAS : il rend `{ error }`. On le lit.
  const { data, error } = await admin
    .from('competences_escalade')
    .update({ dossier_n3_traite_at: maintenant, updated_at: maintenant })
    .eq('eleve_id', eleveId)
    .eq('competence', competence)
    .eq('observable', observable)
    .is('dossier_n3_traite_at', null)
    .select('eleve_id')
  if (error) return { ok: false, message: `Le dossier n’a pas été marqué : ${error.message}` }
  return (data && data.length > 0)
    ? { ok: true, message: 'Dossier pris. Il quitte la file ; l’escalade, elle, reste en N3.' }
    : { ok: true, message: 'Ce dossier était déjà pris — rien n’a été réécrit.' }
}

/**
 * ⭐ « J'AI EXAMINÉ » — LA MARQUE QUI MANQUAIT À UNE CONTESTATION.
 *
 * `ActeContestation` porte `point_id`, `texte`, `at`, `citation_absente` — et
 * aucun `traite_at`. Or la file d'examen humain « se traite », comme celle des
 * N3, et c'est **l'exigence de la loi 25** (`06-` §2 et §7), pas un confort.
 *
 * ⛔ L'ÉCRITURE PASSE PAR UNE FONCTION SQL, ET C'EST LE POINT.
 *    `contestation_points` est écrit par l'élève en LIS-MODIFIE-ÉCRIS (`upsert`
 *    sur `depot_id`), et l'élève peut contester pendant que le professeur
 *    examine. `marquer_contestation_traitee()` fait tout EN UNE INSTRUCTION, la
 *    ligne verrouillée — patron de `journaliser_collage()` (C4-L4).
 *
 * ⭐ ELLE N'ALTÈRE RIEN D'AUTRE. « La contestation est journalisée, N'ALTÈRE
 *    RIEN AUTOMATIQUEMENT » : ni le retour, ni la mesure, ni le statut du dépôt.
 */
export async function examinerLaContestation(
  admin: Admin, depotId: string, pointId: string,
): Promise<Issue> {
  const { data, error } = await admin.rpc('marquer_contestation_traitee', {
    p_depot_id: depotId, p_point_id: pointId,
  })
  if (error) return { ok: false, message: `La marque n’a pas été posée : ${error.message}` }
  return data === true
    ? { ok: true, message: 'Contestation examinée. Elle quitte la file d’examen humain.' }
    : { ok: true, message: 'Cet acte était déjà examiné, ou il a été remplacé entre-temps.' }
}

/**
 * ⭐⭐ « JE CONFIRME » — ET RIEN NE SE BLOQUE.
 *
 * Le faisceau « exige une confirmation humaine » (`06-` §6), et l'arbitrage ③ de
 * Louis du 27/08 en tire la conséquence : **son type ne compte AUCUN STRIKE**.
 * « Le faisceau dit "quelqu'un d'autre a fait le travail" ; le strike parle
 * d'EFFORT et bloque les dépôts au seuil. »
 *
 * ⭐ On appelle `confirmerSignalement` — LA MÊME fonction que `/prof/integrite`,
 *    jamais une seconde. Elle branche sur le type et ferme l'idempotence sur
 *    `acquitte_at` pour les types sans strike.
 *
 * ⛔ ET CONFIRMER NE REND AUCUN VERDICT : la confirmation dit que le professeur
 *    a regardé.
 */
export async function confirmerLeFaisceau(
  admin: Admin, signalementId: string, acteurId?: string | null,
): Promise<Issue> {
  await confirmerSignalement(admin, signalementId, acteurId)
  return { ok: true, message: 'Faisceau confirmé. Aucun strike n’a été compté, rien n’est bloqué.' }
}

/** Ce qu'un drapeau « citation composée » désigne : un retour, par dépôt × moment. */
export interface RefRetour { depotId: string; moment: string }

/**
 * ⭐ « J'AI VU, J'EFFACE » — LE QUATRIÈME GESTE, demandé par Louis le 02/09.
 *
 * Le drapeau « citation composée » se DÉRIVE à la lecture (`attention-serveur.ts`)
 * et n'avait aucun geste : « le geste vit à l'écran du retour : corriger, ou
 * retirer ». Mais quand l'OCR a mal lu la copie, les citations « introuvables »
 * y sont bel et bien, et il n'y a rien à corriger — seulement un signal à faire
 * partir. C'est ce que cette écriture marque : `citation_composee_ecartee_at`
 * sur le retour. ⛔ Elle ne touche ni le texte du retour, ni sa publication,
 *    ni la mesure : le retour reste ce qu'il est, il ne remonte plus.
 *
 * ⭐ UNE LISTE, PAS UN SEUL : le bouton « Tout effacer » de la page passe les
 *    19 drapeaux d'un coup, et une écriture par moment suffit (`.in()` sur les
 *    dépôts). Idempotent par compare-and-set (`.is(…, null)`) : le premier
 *    geste date, les suivants ne réécrivent rien.
 * ⚠️ La colonne peut manquer (migration pas encore jouée) : `supabase-js` ne
 *    lève pas, on lit `error` et on le dit.
 */
export async function ecarterLesCitationsComposees(
  admin: Admin, refs: readonly RefRetour[], maintenant = new Date().toISOString(),
): Promise<Issue & { effaces: number }> {
  if (refs.length === 0) return { ok: true, effaces: 0, message: 'Rien à effacer.' }
  const parMoment = new Map<string, string[]>()
  for (const r of refs) parMoment.set(r.moment, [...(parMoment.get(r.moment) ?? []), r.depotId])
  let effaces = 0
  for (const [moment, depotIds] of parMoment) {
    const { data, error } = await admin
      .from('exercices_retours')
      .update({ citation_composee_ecartee_at: maintenant, updated_at: maintenant })
      .eq('moment', moment)
      .in('depot_id', depotIds)
      .is('citation_composee_ecartee_at', null)
      .select('id')
    if (error) {
      return { ok: false, effaces, message: `Le signal n’a pas été effacé : ${error.message}` }
    }
    effaces += data?.length ?? 0
  }
  if (effaces === 0) {
    return { ok: true, effaces, message: 'Ce signal était déjà effacé — rien n’a été réécrit.' }
  }
  return {
    ok: true, effaces,
    message: effaces === 1
      ? 'Signal effacé. Le retour, lui, n’a pas bougé.'
      : `${effaces} signaux effacés. Les retours, eux, n’ont pas bougé.`,
  }
}
