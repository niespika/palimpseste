// ============================================================================
// C4 · L11 — LA GARDE « RÉFÉRENCE VALIDÉE », À UN SEUL ENDROIT.
// ----------------------------------------------------------------------------
// ⭐ LA GARDE ABSOLUE — « UNE RÉFÉRENCE NON VALIDÉE N'ENTRE JAMAIS EN PHASE 2 »
//    (`02-` §6 A). Le `07-` §1.1 en fait l'une des DEUX gardes qui portent la
//    validité de TOUTE LA RÉCEPTION.
//
// Elle vivait à DEUX endroits — `app/prof/conception/actions.ts` (C4-L8, en
// boucle sur la source et la cible) et `utils/examens/conception.ts` (C4-L9, sur
// la liste des textes) —, qui lisaient la MÊME colonne de la MÊME table avec le
// MÊME prédicat. Deux copies d'une garde finissent par diverger ; celle-ci porte
// la validité de toute la réception, et c'est la pire à laisser en double.
//
// ⚠️ LA VALIDATION EST UN ÉTAT, JAMAIS UNE TRACE (`05-` §4.5) : on lit
//    `validee_at`, on ne cherche pas un journal, et il n'y a ni date ni version.
//
// ⚠️ LES DEUX MOTIFS DE REFUS NE SE FONDENT PAS EN UN SEUL, et le motif NOMME LA
//    RÉFÉRENCE — le `02-` §6 A le veut. « Aucune référence déposée » et « une
//    référence déposée mais non validée » n'appellent pas le même geste du
//    professeur : l'une se décompose, l'autre se relit.
//
// ⚠️ Et « une référence DÉVALIDÉE en cours de route ne défait pas les instances
//    déjà assignées » : c'est tranché et assumé (`PLAN_DE_CHANTIER.md` §6) —
//    « le message honnête suffit ». Rien ici ne le change.
//
// Ce module porte DEUX choses, et le partage est délibéré :
//   · le PRÉDICAT, pur, sur une ligne déjà jointe — pour l'appelant qui charge
//     une LISTE de textes et ne peut pas se payer une requête par ligne ;
//   · le VERDICT PAR IDENTIFIANT, qui fait sa propre lecture — pour l'appelant
//     qui en vise un ou deux, nommément.
// Les deux passent par le même prédicat : il n'y a qu'un endroit où la règle
// s'écrit, et l'autre bout ne recopie jamais la jointure.
// ============================================================================

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Le `select` de la jointure — écrit ICI, et pas deux fois. Un appelant qui
 * charge une liste l'ajoute à ses propres colonnes ; il ne le retape pas.
 */
export const SELECT_REFERENCE_VALIDEE = 'reference_id, exercices_references(id, validee_at)'

type Ligne = Record<string, unknown>

const txt = (x: unknown): string => (typeof x === 'string' ? x : '')
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
/** Une jointure Supabase rend tantôt un objet, tantôt un tableau d'un élément. */
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}

/**
 * Le nom d'un texte, tel qu'un motif de refus doit le porter. Vide → un libellé
 * neutre : un motif qui ne nomme rien renvoie le professeur à sa liste entière.
 */
export function nomDuTexte(auteur: string, titre: string, reference: string): string {
  const n = [auteur, titre, reference].map((x) => x.trim()).filter(Boolean).join(' · ')
  return n || 'ce texte'
}

/**
 * LE PRÉDICAT — sur une ligne d'`exercices_textes` déjà jointe à sa référence.
 * Rend le motif de refus, ou `null` quand la référence est validée.
 *
 * `bloque` entre ici parce qu'il dit la même chose au même moment : le texte ne
 * sert aucune instance. Un appelant qui ne charge pas la colonne ne voit
 * simplement pas ce motif — la garde de référence, elle, tient dans les deux cas.
 */
export function motifDeRefusDeLaReference(ligne: unknown, nom: string): string | null {
  const t = lig(ligne)
  const ref = jointure(t, 'exercices_references')
  if (!t.reference_id || !ref.id) {
    return `Aucune référence décomposée n’est déposée pour « ${nom} » : `
      + 'une référence non validée n’entre jamais en Phase 2 (`02-` §6 A).'
  }
  if (!ref.validee_at) {
    return `La référence décomposée de « ${nom} » n’est pas validée : `
      + 'une référence non validée n’entre jamais en Phase 2 (`02-` §6 A). '
      + 'Elle se lit et se valide à l’écran de la référence.'
  }
  if (t.bloque === true) {
    return `« ${nom} » est bloqué en file de validation : il ne sert aucune instance.`
  }
  return null
}

/**
 * LE VERDICT PAR IDENTIFIANT — la lecture et le prédicat, en un geste.
 *
 * ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Une erreur de lecture ne
 *    doit surtout pas passer pour un texte valide — on refuse, en le disant.
 *
 * ⭐⭐ C5-L2 — LE VERDICT REND AUSSI **L'IDENTIFIANT DE LA RÉFÉRENCE**, et c'est
 *    ce qui ferme un manque transverse. `exercices.reference_id` — que le `07-`
 *    §1.1 déclare, « la référence quand il y en a une » — **n'avait aucun
 *    écrivain de production** : l'import y écrit littéralement `null`, l'écran
 *    de conception ne l'écrivait pas du tout, et seuls l'examen diagnostique de
 *    C4-L9 et les décors de recette la posaient. Or c'est cette colonne-là, et
 *    elle seule, que lisent **la chaîne** (pour descendre la référence ET le
 *    texte source jusqu'au retour) et **le trigger en base**
 *    `garde_reference_validee`.
 *
 * ⚠️ **LA RÉFÉRENCE APPARTIENT AU TEXTE** — `exercices_textes.reference_id` —,
 *    et `exercices.reference_id` en est **la copie que la garde en base exige** :
 *    le trigger fait `select e.reference_id …` sur l'INSTANCE, et sort sans rien
 *    contrôler quand elle est NULL. La dériver à la lecture laisserait le
 *    trigger aveugle ; la poser à la conception ferme les deux. ⛔ Ce n'est donc
 *    **pas un second domicile** : c'est la même valeur, recopiée au moment où
 *    elle est vérifiée, par la fonction qui la vérifie — **il n'y a pas deux
 *    endroits où la règle s'écrit**.
 *
 * ⚠️ `referenceId` n'est rendu **que sur un verdict `ok`** : une référence
 *    absente ou non validée ne se recopie jamais sur une instance.
 */
export async function referenceValidee(
  admin: SupabaseClient, texteId: string,
): Promise<{ ok: boolean; motif: string | null; referenceId: string | null }> {
  const { data, error } = await admin.from('exercices_textes')
    .select(`auteur, titre, reference, bloque, ${SELECT_REFERENCE_VALIDEE}`)
    .eq('id', texteId).maybeSingle()
  if (error) {
    return { ok: false, motif: `Le texte visé n’a pas pu être lu : ${error.message}`,
      referenceId: null }
  }
  if (!data) {
    return { ok: false, referenceId: null,
      motif: 'Le texte visé est introuvable : aucune instance ne tourne dessus.' }
  }
  const l = data as unknown as Ligne
  const nom = nomDuTexte(txt(l.auteur), txt(l.titre), txt(l.reference))
  const motif = motifDeRefusDeLaReference(l, nom)
  return {
    ok: motif === null,
    motif,
    referenceId: motif === null ? (txt(l.reference_id) || null) : null,
  }
}
