'use server'

// ============================================================================
// C5 · L1 — LES ACTIONS DE L'ÉCRAN DES TEXTES : l'accès, le formulaire, et rien
// de plus.
// ----------------------------------------------------------------------------
// ⭐ TOUT CE QUI ÉCRIT VIT À `utils/generateur/depot-serveur.ts`, et c'est
//    délibéré : « les outils de recette appellent LE MÊME CODE QUE LES ÉCRANS »
//    (`scripts/recette/LISEZ-MOI.md`). Une recette qui recopierait les `insert`
//    de ce fichier ne prouverait que sa propre copie.
//
// ⛔ AUCUN TYPE N'EST EXPORTÉ D'ICI. Un module `'use server'` ne peut exporter
//    que des fonctions async ; un type ré-exporté tue TOUT le module à
//    l'exécution, et ni `tsc`, ni `npm test`, ni les recettes ne le voient
//    (C4-L7, 24/08). Les types vivent à `./types`.
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/fabrique/acces'
import { controleReference, phrasesDuTexte } from '@/utils/fabrique/verifie-reference'
import {
  deposerUnTexteNeuf, poserLIdentiteDuTexte, decomposerUnTexte,
} from '@/utils/generateur/depot-serveur'
import type { RetourTexte } from './types'

type Ligne = Record<string, unknown>
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')

/** Le formulaire, lu — et rien d'autre : les règles vivent au module de dépôt. */
function saisie(form: FormData, defauts: { auteur?: string; titre?: string } = {}) {
  const brut = String(form.get('plan_seance') ?? '').trim()
  return {
    auteur: String(form.get('auteur') ?? '').trim() || (defauts.auteur ?? ''),
    titre: String(form.get('titre') ?? '').trim() || (defauts.titre ?? ''),
    reference: String(form.get('reference') ?? '').trim(),
    coursEtat: String(form.get('cours_etat') ?? 'aucun'),
    planLivreId: String(form.get('plan_livre_id') ?? '').trim() || null,
    planSeance: brut === '' ? null : Number(brut),
  }
}

/** LA VOIE 1 — un texte saisi ici. Il entre au corpus du Scriptorium.
 *
 *  ⚠️ LE CONTENU S'ÉCRIT MOINS LES CRLF. Un `<textarea>` soumet en CRLF quand le
 *     stocké est en LF — ça a mordu deux fois (C4-L4, puis la garde de découpe de
 *     C4-L16), et `new FormData()` ne le montre pas. Ici la conséquence serait
 *     pire qu'ailleurs : l'empreinte est celle du contenu EXACT, octet pour
 *     octet, et la segmentation compte les phrases — un `\r` par ligne
 *     décalerait toutes les bornes de la décomposition. */
export async function deposerTexte(
  _prec: RetourTexte | null, form: FormData,
): Promise<RetourTexte> {
  const { admin, userId } = await garderProf(false)
  const contenu = String(form.get('contenu') ?? '').replace(/\r\n/g, '\n')
  const r = await deposerUnTexteNeuf(admin, userId, contenu, saisie(form))
  if (r.ok) {
    revalidatePath('/prof/conception/textes')
    revalidatePath('/prof/corpus')
  }
  return r
}

/** LA VOIE 2 — LE PONT. Un texte déjà à la bibliothèque du Scriptorium reçoit
 *  son identité de fabrique, sans repasser par un fichier et sans qu'une seconde
 *  copie du texte soit écrite nulle part. */
export async function adopterContenu(
  _prec: RetourTexte | null, form: FormData,
): Promise<RetourTexte> {
  const { admin } = await garderProf(false)
  const contenuId = String(form.get('contenu_id') ?? '').trim()
  if (!contenuId) return { ok: false, message: 'Aucun contenu choisi.' }

  const { data: c, error } = await admin.from('scriptorium_contenus')
    .select('id, type, titre, auteur, texte_extrait, supprime_at')
    .eq('id', contenuId).maybeSingle()
  if (error) return { ok: false, message: `Le contenu n’a pas pu être lu : ${error.message}` }
  if (!c) return { ok: false, message: 'Contenu introuvable.' }
  if (txt(c.type) !== 'texte') {
    return { ok: false, message: `Ce contenu est de type « ${txt(c.type)} » : `
      + 'seul un texte d’auteur se décompose.' }
  }
  if (c.supprime_at) return { ok: false, message: 'Ce contenu est en corbeille.' }
  const contenu = txt(c.texte_extrait)
  if (!contenu.trim()) {
    return { ok: false, message: 'Ce contenu n’a pas de texte : il n’y a rien à décomposer.' }
  }

  // L'auteur et le titre viennent du Scriptorium quand le formulaire les tait :
  // deux domiciles pour le même nom finiraient par diverger.
  const r = await poserLIdentiteDuTexte(admin, contenuId, contenu,
    saisie(form, { auteur: txt(c.auteur), titre: txt(c.titre) }))
  if (r.ok) {
    revalidatePath('/prof/conception/textes')
    revalidatePath('/prof/corpus')
  }
  return r
}

/** LA DÉCOMPOSITION — trois appels de modèle, puis le contrôle qui fait foi. */
export async function decomposerTexte(
  _prec: RetourTexte | null, form: FormData,
): Promise<RetourTexte> {
  const { admin } = await garderProf(false)
  const r = await decomposerUnTexte(admin, String(form.get('texte_id') ?? '').trim())
  if (r.ok) {
    revalidatePath('/prof/conception/textes')
    revalidatePath('/prof/conception')
  }
  return r
}

/**
 * Un contrôle à blanc — le verdict d'une référence, SANS RIEN ÉCRIRE. Il dit où
 * en est une référence déposée sans qu'on ait à rouvrir sa page.
 */
export async function controlerReference(
  _prec: RetourTexte | null, form: FormData,
): Promise<RetourTexte> {
  const { admin } = await garderProf(false)
  const id = String(form.get('reference_id') ?? '').trim()
  const { data: ref, error } = await admin.from('exercices_references')
    .select('id, contenu, validee_at, scriptorium_contenus(texte_extrait)')
    .eq('id', id).maybeSingle()
  if (error) return { ok: false, message: `Lecture impossible : ${error.message}` }
  if (!ref) return { ok: false, message: 'Référence introuvable.' }
  const texte = txt(jointure(ref, 'scriptorium_contenus').texte_extrait)
  const v = controleReference(ref.contenu, texte)
  return {
    ok: v.verdict !== 'refus',
    message: `Contrôle machine : ${v.verdict.toUpperCase()} — ${v.refus.length} refus · `
      + `${v.blocages.length} blocage(s) · ${v.signalements.length} signalement(s) · `
      + `${phrasesDuTexte(texte).length} phrase(s).`,
    empechements: [...v.refus, ...v.blocages],
    notes: [...v.annonces, ...v.signalements],
    referenceId: id,
  }
}
