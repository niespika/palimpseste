import 'server-only'
// ============================================================================
// C4 · L3 — LA CONTESTATION, POINT PAR POINT.
// ----------------------------------------------------------------------------
// « **Sur chaque point ancré, un bouton "je ne suis pas d'accord" et un champ
//   court** (`06-` §2) : la contestation est **JOURNALISÉE**, **n'altère RIEN
//   automatiquement**, et remonte au professeur en drapeau **si elle se
//   répète** — *le compte et l'écran de ce drapeau sont ailleurs* (C6-L1) ;
//   ici, une journalisation qui rend le compte possible, par des `points[]` à
//   IDENTIFIANTS STABLES plus le texte de l'élève » (`07-` §1.2).
//
// ⭐ CE QUI REND TOUT CECI POSSIBLE : **le retour arrive SEGMENTÉ**, et c'est un
//    contrat sur celui qui l'engendre, pas sur l'écran (`07-` §1.2 ; C4-L5).
//    `exercices_retours.texte` est une **liste de points**, chacun avec son
//    **identifiant stable**, son **ancrage** et son **texte** — jamais un bloc
//    que l'écran devrait découper. **NE LE DÉCOUPE PAS, AFFICHE-LE.** *Sans
//    cette forme, la contestation redevient un commentaire libre, et le drapeau
//    des contestations répétées n'a plus rien à compter* (`07-` §3).
//
// ⚠️⚠️ « **TOUTE CONTESTATION PORTANT SUR UNE CITATION ABSENTE PART DIRECTEMENT
//    EN FILE PROFESSEUR** — c'est l'exigence d'EXAMEN HUMAIN DE LA LOI »
//    (`06-` §2 et §7). L'écran du professeur qui la reçoit est à **C6-L1** ; ce
//    module la MARQUE sans ambiguïté et laisse une trace serveur, pour qu'elle
//    soit trouvable le jour où l'écran existe. **Il n'invente aucune file** :
//    une seconde file serait un second domicile, et deux domiciles divergent.
//
// ⚠️ **N'ALTÈRE RIEN AUTOMATIQUEMENT** : ce module n'écrit que dans
//    `exercices_metacognition`. Il ne touche ni au retour, ni à la mesure, ni au
//    statut du dépôt — contester n'est pas corriger.
// ============================================================================

import { createAdminClient } from '@/utils/supabase/admin'
import { citationsIntrouvables } from '../chaine/anti-injection'
import { refus, ok, type Issue, type DepotMaison } from './depot'
import type { ActeContestation, RegimeV1vf } from './types'

type Admin = ReturnType<typeof createAdminClient>

/** Le champ est COURT — « un champ court » (`06-` §2). */
export const CONTESTATION_MAX = 600

/** Un point du retour, tel que la chaîne l'a écrit (`utils/chaine/types.ts`). */
export interface PointDuRetour {
  id: string
  ancrage: { source: 'copie' | 'texte_support'; citation: string }
  texte: string
  competence: string
  nature: 'reussite' | 'point_de_travail'
}

/**
 * ⚠️ LA CITATION EST-ELLE ABSENTE DE LA COPIE ?
 *
 * On réutilise `citationsIntrouvables` (`utils/chaine/anti-injection.ts`) —
 * elle ALERTE, elle ne répare pas, et c'est exactement l'esprit qu'il faut ici.
 *
 * ⚠️ La question ne se pose que pour les points ancrés sur **la copie** : un
 *    point ancré sur le **texte support** cite l'auteur, pas l'élève, et le
 *    chercher dans la copie le déclarerait absent à tort. C'est la règle RR3 —
 *    « les citations portent leur SOURCE : la copie de l'élève d'un côté, le
 *    texte support de l'autre » (`01-` §12).
 */
export function citationAbsente(point: PointDuRetour, production: string | null): boolean {
  if (point.ancrage.source !== 'copie') return false
  const { introuvables } = citationsIntrouvables(production, [point.ancrage.citation])
  return introuvables.length > 0
}

/**
 * ⭐ CONTESTER UN POINT. Un acte par clic, chacun avec SON texte court — le
 * bouton est « sur chaque point ancré ».
 *
 * Le journal vit dans `exercices_metacognition.contestation_points`, sous la
 * forme d'une **liste d'actes**. ⚠️ **`contestation_texte` reste NULL, et c'est
 * délibéré** : le schéma modelait UNE contestation (« des `points[]` … plus le
 * texte de l'élève »), mais le `06-` §2 met un champ court **par point** — deux
 * textes ne tiennent pas dans une colonne scalaire, et recopier le dernier y
 * ferait une copie qui diverge. La liste porte les deux choses que le §1.2
 * demande — les identifiants stables ET le texte —, et **c'est elle qui rend le
 * compte possible**. *Porté à l'amendement du §1.2, ouvert à l'implémentation.*
 */
export async function contester(
  admin: Admin, depot: DepotMaison,
  a: { point: PointDuRetour; texte: string; production: string | null },
  maintenant: string,
): Promise<Issue<{ citationAbsente: boolean }>> {
  const propre = a.texte.trim()
  if (propre === '') return refus('Dis en une phrase ce avec quoi tu n’es pas d’accord.')
  if (propre.length > CONTESTATION_MAX) {
    return refus(`Un champ court — ${CONTESTATION_MAX} caractères au plus.`)
  }
  if (!a.point.id) {
    // Sans identifiant stable, la contestation « redevient un commentaire
    // libre » : on refuse plutôt que de fabriquer une clé.
    return refus('Ce point n’a pas d’identifiant : il ne peut pas être contesté.')
  }

  const absente = citationAbsente(a.point, a.production)
  const acte: ActeContestation = {
    point_id: a.point.id, texte: propre, at: maintenant, citation_absente: absente,
  }

  const { data } = await admin.from('exercices_metacognition')
    .select('contestation_points').eq('depot_id', depot.id).maybeSingle()
  const courant = Array.isArray(data?.contestation_points)
    ? (data.contestation_points as unknown[]) : []

  // Un même point recontesté REMPLACE son acte : c'est une correction de saisie,
  // pas une seconde contestation. Le drapeau compte des POINTS contestés, et
  // compter deux fois le même gonflerait le signal sans qu'il se soit passé
  // quoi que ce soit de neuf.
  const autres = courant.filter(
    (c) => !(c && typeof c === 'object'
      && (c as Record<string, unknown>).point_id === a.point.id))

  const { error } = await admin.from('exercices_metacognition').upsert({
    depot_id: depot.id,
    contestation_points: [...autres, acte],
    updated_at: maintenant,
  }, { onConflict: 'depot_id' })
  if (error) return refus(`La contestation n’a pas été enregistrée : ${error.message}`)

  if (absente) {
    // ⚠️ L'EXIGENCE D'EXAMEN HUMAIN. L'écran qui la reçoit est à C6-L1 ; en
    //    attendant, la marque est en base et la trace est au serveur.
    console.warn(`[deroule] CONTESTATION SUR CITATION ABSENTE — dépôt ${depot.id}, `
      + `point ${a.point.id}. Elle part DIRECTEMENT en file professeur (exigence d'examen `
      + 'humain, `06-` §2 et §7). L\'écran du professeur est à C6-L1 ; la marque '
      + '`citation_absente` la rend trouvable.')
  }
  return ok({ citationAbsente: absente })
}

/** Les points déjà contestés — pour que l'écran n'offre pas deux fois le geste. */
export function pointsContestes(brut: unknown): ActeContestation[] {
  if (!Array.isArray(brut)) return []
  const out: ActeContestation[] = []
  for (const x of brut) {
    if (!x || typeof x !== 'object') continue
    const o = x as Record<string, unknown>
    if (typeof o.point_id !== 'string' || typeof o.texte !== 'string') continue
    out.push({
      point_id: o.point_id, texte: o.texte,
      at: typeof o.at === 'string' ? o.at : '',
      citation_absente: o.citation_absente === true,
    })
  }
  return out
}

/**
 * LA VALIDATION « LU » — ⚠️ elle vit sur le RETOUR, `lu_at`, **et nulle part
 * ailleurs** (`07-` §1.2 ; piège 32). Un seul domicile pour un seul geste.
 *
 * Le retour final « SE CLÔT PAR LA VALIDATION "lu" » (`06-` §2). Idempotente :
 * relire n'écrase pas la première lecture.
 */
export async function validerLaLecture(
  admin: Admin, depot: DepotMaison, moment: 'chaud' | 'final',
  regime: RegimeV1vf, maintenant: string,
): Promise<Issue<null>> {
  const { data } = await admin.from('exercices_retours')
    .select('id, lu_at, published_at').eq('depot_id', depot.id).eq('moment', moment).maybeSingle()
  if (!data) return refus('Il n’y a pas encore de retour à lire.')
  if (data.lu_at) return ok(null)

  const { error } = await admin.from('exercices_retours')
    .update({ lu_at: maintenant, updated_at: maintenant })
    .eq('id', data.id).is('lu_at', null)
  if (error) return refus(`La validation n’a pas été enregistrée : ${error.message}`)

  // ⭐ QUI CLÔT LE DÉROULÉ, ET QUAND — **c'est le RÉGIME qui le dit, jamais
  //    l'état du dépôt**. Au régime PLEIN, le déroulé va jusqu'au temps 6 et
  //    « se clôt par la validation "lu" » du retour FINAL (`06-` §2) ; aux deux
  //    autres régimes, « l'exercice SE CLÔT AU RETOUR » (`02-` §2.3.1 a et b),
  //    donc au retour chaud.
  //
  // ⚠️ Déduire le régime de `vf_remis_at === null` serait un DÉFAUT : au régime
  //    plein, la vf n'est pas encore remise quand l'élève lit son retour chaud —
  //    on clôturerait l'exercice avant le temps 5, et l'élève perdrait sa
  //    révision. Le régime se DÉRIVE (cran + escalade), il se passe en argument.
  const clotUnDeroule = regime === 'plein' ? moment === 'final' : moment === 'chaud'
  if (clotUnDeroule) {
    const { error: e2 } = await admin.from('exercices_depots')
      .update({ statut: 'clos', updated_at: maintenant })
      .eq('id', depot.id).neq('statut', 'clos')
    // ⚠️ On ne force JAMAIS `vf_remis` au passage : « aux crans sans version
    //    finale, ne force pas un `vf_remis` qui n'existe pas » (piège 44).
    if (e2) console.error(`[deroule] clôture NON posée — dépôt ${depot.id} — ${e2.message}`)
  }
  return ok(null)
}
