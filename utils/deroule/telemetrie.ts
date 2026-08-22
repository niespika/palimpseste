// ============================================================================
// C4 · L3 — L'INSTRUMENTATION DU FAISCEAU : ce que le clavier rend.
// Module PUR — aucun `server-only`, aucun accès base, aucune I/O, et AUCUNE
// horloge implicite : le temps se PASSE en argument, jamais `Date.now()`.
// ----------------------------------------------------------------------------
// « Le faisceau ne regarde que le formatif fait à la maison. Sept signaux,
//   TOUS TAGUÉS, AUCUN BLOQUANT » (`06-` §6). Trois d'entre eux ne viennent de
//   nulle part ailleurs que d'ici :
//     · la DURÉE — le temps réellement passé le champ actif ;
//     · le RYTHME DE FRAPPE ET L'APPARITION DU TEXTE PAR BLOCS — « un texte qui
//       apparaît à NEUF CENTS SIGNES PAR MINUTE n'est pas tapé par un élève » ;
//     · le NOMBRE DE SESSIONS d'écriture.
//   ⚠️ **SANS CETTE COLLECTE, CES SIGNAUX N'EXISTENT PAS.** Le manuscrit à la
//      maison avait tué la durée mesurée ; « le clavier la rend, et il ajoute le
//      rythme, les sessions et les collages » — mais seulement si quelqu'un les
//      compte, et ce quelqu'un est ce module.
//
// ⚠️ ⭐ ON N'ÉCRIT ICI **AUCUN SEUIL DE SUSPICION, AUCUN DRAPEAU, AUCUN
//    VERDICT.** « Tous tagués, aucun bloquant, jamais un verdict » ; « quand les
//    signaux convergent, un drapeau part au professeur PAR LE CANAL DE
//    SIGNALEMENT EXISTANT, qui exige une confirmation humaine » (`06-` §6) —
//    c'est-à-dire `signalerEnAttenteIA`, et nulle part ailleurs. Ce module
//    COMPTE ; il ne conclut rien. Un module qui saurait dire « 900, donc
//    triche » aurait rendu le verdict avant l'humain, et une bibliothèque
//    n'écrit pas dans le dossier d'un élève.
//
// ⚠️ LE QUATRIÈME SIGNAL DE LA MAISON — les COLLAGES BLOQUÉS — n'est pas ici :
//    il a déjà son domicile en `utils/passation/collage.ts` (C4-L4) et « un lot
//    le RÉUTILISE, il n'en crée pas un second » (`07-` §1.2).
//
// OÙ ÇA SE VERSE. `exercices_depots.saisie_telemetrie jsonb`, **PAR VERSION** —
// `{"v1": {…}, "vf": {…}}` : le delta v1→vf est lui-même un signal, et mêler
// les deux saisies le brouillerait. La garde en base (`depots_saisie_telemetrie_chk`)
// ferme le domaine : quatre clés connues, et des ENTIERS POSITIFS — rien d'autre.
// ============================================================================

import type { TelemetrieParVersion, TelemetrieSaisie, Version } from './types'

/** Les deux versions que la colonne admet — le domaine est FERMÉ (`07-` §1.1). */
export const VERSIONS_TELEMETREES: readonly Version[] = ['v1', 'vf']

/** Les quatre compteurs, dans l'ordre exact où la garde en base les nomme. */
const COMPTEURS = ['signes_saisis', 'ms_actifs', 'plus_grand_ajout', 'sessions'] as const

/**
 * ⭐ LE SEUIL DE PAUSE — **la source ne le fixe pas.**
 *
 * `06-` §6 nomme « le nombre de sessions d'écriture » sans dire ce qui sépare
 * deux sessions, et ne dit pas davantage à partir de quel silence le champ
 * cesse d'être « actif ». Ce nombre est donc une DÉCISION D'IMPLÉMENTATION, et
 * il se tient ici, en clair et nommé, pour être discutable — enfoui dans une
 * comparaison au milieu d'une boucle, il deviendrait une règle que personne
 * n'aurait prise.
 *
 * DEUX MINUTES. Ce que le réglage déplace, dans les deux sens :
 *   · **plus haut**, on compte comme du temps d'écriture des silences de
 *     réflexion — `ms_actifs` grossit, le rythme RALENTIT, et le signal se tait
 *     plus souvent (l'erreur va dans le sens de l'élève) ; les sessions
 *     fusionnent ;
 *   · **plus bas**, une pause de réflexion sort du dénominateur — le rythme
 *     ACCÉLÈRE et on fabrique des rythmes élevés qui ne disent rien.
 * On penche du côté qui se tait : un faux signal coûte plus cher qu'un signal
 * manqué, puisque le faisceau ne protège pas une note — il n'y en a pas — mais
 * le retour rendu à l'élève (`06-` §6, dernier alinéa).
 */
export const SEUIL_PAUSE_MS = 120_000

/**
 * Un relevé neuf : les quatre compteurs à zéro.
 *
 * ⚠️ Zéro n'est pas « pas de mesure » — c'est « rien de compté encore ». La
 *    distinction se joue à la LECTURE du rythme (`signesParMinute`), qui rend
 *    `null` et jamais 0 sur un dénominateur vide.
 */
export function nouvelleTelemetrie(): TelemetrieSaisie {
  return { signes_saisis: 0, ms_actifs: 0, plus_grand_ajout: 0, sessions: 0 }
}

/**
 * Un changement du champ de rédaction, tel que l'écran l'observe.
 *
 * ⚠️ Les instants sont ceux du NAVIGATEUR, et l'horloge du navigateur d'un élève
 *    n'est pas une source (même réserve qu'en `collage.ts`, où l'instant
 *    journalisé est celui du serveur). C'est pour cela qu'on n'en garde JAMAIS
 *    un horodatage : on n'en tire que des DURÉES ÉCOULÉES, qu'un décalage
 *    d'horloge ne fausse pas, et l'on écarte les intervalles négatifs.
 */
export interface EvenementDeSaisie {
  /** La longueur du texte AVANT ce changement, en signes. */
  longueurAvant: number
  /** La longueur du texte APRÈS ce changement, en signes. */
  longueurApres: number
  /** L'instant de ce changement, en millisecondes. */
  instant: number
  /** L'instant du changement PRÉCÉDENT — `null` à la toute première frappe. */
  dernierInstant: number | null
}

function nombreSur(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0
}

/**
 * ⭐ L'ACCUMULATION, frappe après frappe. Elle rend un relevé NEUF — le module
 * est pur, il ne mute rien.
 *
 * Les quatre règles, qui sont quatre décisions et non des évidences :
 *
 *   · **`signes_saisis` ne compte que les AJOUTS.** Une suppression n'enlève
 *     rien : on compte CE QUE L'ÉLÈVE A TAPÉ, pas ce qui reste. Un élève qui
 *     écrit mille signes et en efface huit cents a bien tapé mille signes, et
 *     son rythme doit se lire sur mille.
 *
 *   · **`plus_grand_ajout` retient le plus grand ajout D'UN SEUL TENANT** —
 *     c'est très exactement « l'apparition du texte par blocs » de `06-` §6.
 *     C'est le seul des quatre compteurs qui survit à un rythme illisible : un
 *     texte déposé en un geste ne laisse aucun intervalle, donc aucun
 *     `ms_actifs` et donc aucun rythme — mais il laisse un bloc.
 *
 *   · **`ms_actifs` n'accumule que les intervalles INFÉRIEURS au seuil** : le
 *     temps où le champ est ouvert mais inerte n'est pas du temps d'écriture.
 *     Un onglet laissé ouvert toute la nuit ne doit pas fabriquer huit heures
 *     de travail — ni, à l'inverse, un rythme de trois signes par minute.
 *
 *   · **`sessions` vaut 1 dès la première frappe**, puis s'incrémente à chaque
 *     reprise APRÈS une pause franche (intervalle ≥ seuil). Zéro session veut
 *     dire « rien n'a été tapé », et rien d'autre.
 *
 * ⚠️ CE COMPTEUR MESURE UNE LONGUEUR, PAS DES FRAPPES. Un remplacement de
 *    sélection ne compte que le SOLDE (900 signes collés sur 850 sélectionnés
 *    n'ajoutent que 50) — la limite est connue, elle est du même ordre que celle
 *    du blocage de collage, « côté navigateur seulement » (`06-` §1) : on
 *    instrumente le geste ordinaire, pas l'élève déterminé.
 */
export function accumuler(
  courant: TelemetrieSaisie,
  evenement: EvenementDeSaisie,
): TelemetrieSaisie {
  const ajout = Math.max(0, nombreSur(evenement.longueurApres) - nombreSur(evenement.longueurAvant))

  const dernier = evenement.dernierInstant
  const intervalle = typeof dernier === 'number' && Number.isFinite(dernier)
    ? nombreSur(evenement.instant) - dernier
    : null

  // Un intervalle négatif est une horloge qui a reculé : il n'est ni du temps
  // d'écriture, ni une reprise. On l'écarte, on ne le corrige pas.
  const actif = intervalle !== null && intervalle >= 0 && intervalle < SEUIL_PAUSE_MS
  const reprise = intervalle !== null && intervalle >= SEUIL_PAUSE_MS

  const premiereFrappe = courant.sessions <= 0

  return {
    signes_saisis: courant.signes_saisis + ajout,
    ms_actifs: courant.ms_actifs + (actif ? intervalle : 0),
    plus_grand_ajout: Math.max(courant.plus_grand_ajout, ajout),
    sessions: premiereFrappe ? 1 : courant.sessions + (reprise ? 1 : 0),
  }
}

/**
 * DEUX RELEVÉS DE LA MÊME VERSION, ADDITIONNÉS — pour qu'une reprise après
 * rechargement ne reparte pas de zéro : l'écran lit ce que la colonne porte
 * (`lireTelemetrie`), accumule à part sur la page fraîche, et verse la somme.
 *
 * ⚠️ `plus_grand_ajout` PREND LE MAX, JAMAIS LA SOMME. Deux blocs de cinq cents
 *    signes ne font pas un bloc de mille : ce compteur nomme le plus grand
 *    ajout D'UN SEUL TENANT, et l'additionner inventerait une apparition qui
 *    n'a jamais eu lieu — exactement le genre de chiffre faux qui attire une
 *    décision (`06-` §5, « pas de fausse précision »).
 *
 * ⚠️ `sessions` S'ADDITIONNE, et c'est voulu : un rechargement de page EST une
 *    reprise d'écriture, la page fraîche compte donc sa propre première frappe.
 */
export function fusionner(a: TelemetrieSaisie, b: TelemetrieSaisie): TelemetrieSaisie {
  return {
    signes_saisis: a.signes_saisis + b.signes_saisis,
    ms_actifs: a.ms_actifs + b.ms_actifs,
    plus_grand_ajout: Math.max(a.plus_grand_ajout, b.plus_grand_ajout),
    sessions: a.sessions + b.sessions,
  }
}

/**
 * ⭐ LE RYTHME — « neuf cents signes par minute n'est pas tapé par un élève »
 * (`06-` §6).
 *
 * ⚠️ **IL SE RECALCULE À LA LECTURE, IL NE SE STOCKE PAS.** Le stocker en ferait
 *    un SECOND DOMICILE, et deux copies d'un même chiffre finissent par diverger
 *    — c'est le partage que `07-` §1 tient sur ses six valeurs qui ne sont pas
 *    des colonnes : « un état se stocke, une lecture se recalcule ». La garde en
 *    base l'applique déjà : elle refuse toute cinquième clé, et un rythme versé
 *    ferait ÉCHOUER l'écriture.
 *
 * ⚠️ **`null` QUAND `ms_actifs` EST NUL — JAMAIS 0.** Un dénominateur vide n'est
 *    pas un rythme lent : c'est l'absence de rythme. Même doctrine que le taux
 *    de lucidité, dont « le dénominateur est vide et le taux vaut NULL, jamais
 *    0 » (`00-` §3), et que `delta_v1_vf` dont « NULL n'est pas zéro »
 *    (`01-` §11). Un 0 rendu ici ferait d'un texte collé d'un seul geste — pas
 *    un intervalle, donc pas de temps actif — l'élève le plus lent de la classe.
 *    Ce cas-là se lit sur `plus_grand_ajout`, pas sur le rythme.
 */
export function signesParMinute(t: TelemetrieSaisie): number | null {
  if (!Number.isFinite(t.ms_actifs) || t.ms_actifs <= 0) return null
  return t.signes_saisis / (t.ms_actifs / 60_000)
}

/**
 * Un relevé lu d'un `jsonb`, ou `null` s'il n'est pas lisible.
 *
 * ⚠️ UN COMPTEUR ABÎMÉ EMPORTE SA VERSION, PAS SES VOISINES. Un `ms_actifs`
 *    illisible mêlé à un `signes_saisis` valide donnerait un RYTHME FAUX, et un
 *    rythme faux est pire que pas de rythme. Une clé simplement ABSENTE, elle,
 *    vaut zéro : la garde en base admet un objet partiel, et « rien de compté »
 *    est un état légitime.
 */
function lireUnReleve(brut: unknown): TelemetrieSaisie | null {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return null
  const source = brut as Record<string, unknown>
  const out = nouvelleTelemetrie()
  for (const clef of COMPTEURS) {
    const v = source[clef]
    if (v === undefined || v === null) continue
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) return null
    out[clef] = v
  }
  return out
}

/**
 * CE QUE LA COLONNE REND, RENDU SÛR — sur le patron de
 * `utils/passation/collage.ts:lireLesCollages`.
 *
 * ⚠️ TOLÉRANT À LA LECTURE, STRICT À L'ÉCRITURE : la garde en base ferme le
 *    domaine, mais une colonne `jsonb` lue par du code qui suppose sa forme est
 *    exactement ce qui fait tomber un écran en pleine classe. **Une version
 *    illisible est écartée, elle n'emporte pas l'autre** — et un dépôt sans
 *    télémétrie rend `{}`, jamais une erreur : le faisceau est un faisceau, il
 *    survit à la perte d'un signal.
 *
 * ⚠️ Une clé ÉTRANGÈRE est ignorée sans façon : la garde en base la refuse à
 *    l'écriture, la lecture n'a donc rien à fermer de plus — et refuser tout un
 *    relevé pour une clé qu'on ne connaît pas perdrait des mesures vraies.
 */
export function lireTelemetrie(brut: unknown): TelemetrieParVersion {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return {}
  const source = brut as Record<string, unknown>
  const out: TelemetrieParVersion = {}
  for (const version of VERSIONS_TELEMETREES) {
    const releve = lireUnReleve(source[version])
    if (releve !== null) out[version] = releve
  }
  return out
}

/**
 * LA MISE À LA FORME QUE LA GARDE EN BASE ACCEPTE : quatre clés, et des ENTIERS
 * POSITIFS (`depots_saisie_telemetrie_chk`, `c4_l3_deroule.sql` §1).
 *
 * ⚠️ ON ARRONDIT ET ON PLANCHONNE ICI, EXPLICITEMENT. Un décimal — et
 *    `ms_actifs` en produit dès que l'écran mesure avec `performance.now()` —
 *    ou un négatif fait ÉCHOUER l'écriture ; **et supabase-js NE LÈVE PAS** : il
 *    retourne `{ error }`. Un appelant qui ignore ce retour verrait la
 *    télémétrie disparaître SANS UNE LIGNE DE JOURNAL, et les trois signaux
 *    qu'elle porte n'existeraient plus — silencieusement, pour tout le monde,
 *    jusqu'au jour où l'on se demanderait pourquoi le faisceau ne dit rien.
 *
 * ⚠️ AUCUNE CINQUIÈME CLÉ. Pas de rythme, pas de tag, pas de drapeau : le rythme
 *    se relit (`signesParMinute`), et le verdict n'appartient pas à ce module.
 */
export function aVerser(t: TelemetrieSaisie): Record<string, number> {
  const entier = (n: number): number =>
    Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0
  return {
    signes_saisis: entier(t.signes_saisis),
    ms_actifs: entier(t.ms_actifs),
    plus_grand_ajout: entier(t.plus_grand_ajout),
    sessions: entier(t.sessions),
  }
}
