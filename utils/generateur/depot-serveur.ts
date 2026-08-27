import 'server-only'
// ============================================================================
// C5 · L1 — LE DÉPÔT D'UN TEXTE ET SA DÉCOMPOSITION, hors formulaire.
// ----------------------------------------------------------------------------
// ⭐ POURQUOI CE MODULE EXISTE, ET PAS SEULEMENT L'ACTION : « les deux outils de
//    recette appellent LE MÊME CODE QUE LES ÉCRANS — le parseur de fiche et
//    l'écrivain d'import — avec le client admin, pour prouver en base ce que
//    l'écran fait à la main » (`scripts/recette/LISEZ-MOI.md`). Une recette qui
//    recopierait les `insert` de l'action ne prouverait que sa propre copie.
//    L'action lit le formulaire et garde l'accès ; TOUT LE RESTE EST ICI.
//
// ⚠️⚠️ AVANT CE LOT, UN `exercices_textes` NE NAISSAIT QUE DE L'IMPORT. La table
//    porte `id_import text not null unique`, et son seul écrivain était
//    `utils/fabrique/import-ecriture.ts`. Le « fait quand » commence pourtant par
//    « un texte se dépose ». CE QUI MANQUAIT ÉTAIT LE PONT.
//
// ⭐ ET LE TEXTE, LUI, A DÉJÀ UN DOMICILE : `scriptorium_contenus`, de `type`
//    `'texte'` — « les textes d'auteur vivent dans Scriptorium » (`02-` §6 B) —,
//    et `exercices_textes.contenu_id` y pointe déjà, `not null`. ⛔ JAMAIS UNE
//    SECONDE TABLE DE TEXTES : les deux voies écrivent là où l'import écrit.
//
// ⭐⭐ L'`id_import` D'UN DÉPÔT EN LIGNE DIT D'OÙ IL VIENT, et c'est ce qui évite
//    la migration. « Jamais un `id_import` inventé qui ressemblerait à un
//    identifiant de fichier — si tu dois en fabriquer un, QU'IL DISE D'OÙ IL
//    VIENT, ou rends la colonne nullable par migration additive et dis-le. »
//    Il vaut `depot-en-ligne:<uuid>` : le préfixe se lit à l'œil, aucun fichier
//    d'import ne peut le produire, et `import_id` reste NULL — la file de
//    validation affiche « — » à la colonne du fichier, ce qui est exactement
//    vrai. AUCUNE MIGRATION : la colonne existante suffit.
//
// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`. Toute écriture dont on
//    ignorerait le retour échouerait INVISIBLEMENT, même sous `try/catch`.
// ============================================================================

import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { empreinteContenu } from '@/utils/fabrique/import-ecriture'
import { engendrerLaReference, GenerationInterrompue, MODULE_COUT }
  from './generateur-serveur'

type Ligne = Record<string, unknown>
const lig = (x: unknown): Ligne => (typeof x === 'object' && x !== null ? x as Ligne : {})
const jointure = (x: unknown, k: string): Ligne => {
  const v = lig(x)[k]
  return lig(Array.isArray(v) ? v[0] : v)
}
const txt = (x: unknown): string => (typeof x === 'string' ? x : '')

/** Le préfixe qui dit d'où vient l'identité — lisible à l'œil, dans la file. */
export const PREFIXE_EN_LIGNE = 'depot-en-ligne:'

export interface Verdict {
  ok: boolean
  message: string
  empechements?: string[]
  notes?: string[]
  texteId?: string
  referenceId?: string
}

export interface SaisieDuTexte {
  auteur: string
  titre: string
  /** La localisation DANS L'ŒUVRE — texte libre, aucune structure imposée. */
  reference: string
  /** `generique` ou `aucun` — les deux états qui se décident sans rien apparier. */
  coursEtat: string
  /** Le COUPLE { livre, séance }, jamais l'un sans l'autre. */
  planLivreId: string | null
  planSeance: number | null
}

/**
 * Le couple { livre, séance } — JAMAIS l'un sans l'autre. Le `CHECK`
 * `textes_plan_couple_chk` le tient en base ; on ne le lui laisse pas
 * découvrir, on refuse d'abord et on le dit.
 */
function motifDuPlan(s: SaisieDuTexte): string | null {
  if (s.planLivreId === null && s.planSeance === null) return null
  if (s.planLivreId === null || s.planSeance === null) {
    return 'Le plan de lecture est un COUPLE : le livre ET la séance, jamais l’un sans '
      + 'l’autre. Donnez les deux, ou aucun des deux.'
  }
  if (!Number.isInteger(s.planSeance) || s.planSeance < 0) {
    return 'La séance du plan est un ORDINAL de découpage du livre — un entier positif, '
      + 'jamais une date ni une semaine de calendrier.'
  }
  return null
}

/**
 * L'identité de fabrique, posée sur un `scriptorium_contenus` QUI EXISTE DÉJÀ.
 * C'est LE PONT : il ne fait aucune copie du texte.
 */
export async function poserLIdentiteDuTexte(
  admin: SupabaseClient, contenuId: string, contenu: string, s: SaisieDuTexte,
): Promise<Verdict> {
  const motif = motifDuPlan(s)
  if (motif) return { ok: false, message: motif }

  // Le domaine de `cours_etat` en compte QUATRE depuis C4-L16. Cette voie n'en
  // sert que deux — ceux qui se décident sans rien apparier ; les deux autres se
  // posent à l'onglet du rattachement, qui existe et fait foi.
  if (s.coursEtat !== 'generique' && s.coursEtat !== 'aucun') {
    return { ok: false, message: 'Le rattachement au cours ne se déclare ici qu’en '
      + '`generique` ou `aucun` : la liste de cours et les notions se posent à l’onglet '
      + 'du rattachement, qui apparie ce que le fichier déclare.' }
  }
  if (!s.auteur.trim() || !s.titre.trim()) {
    return { ok: false, message: 'L’auteur et le titre sont requis : ce sont eux qui nomment '
      + 'le texte partout où il apparaît.' }
  }

  const empreinte = empreinteContenu(contenu)
  // « Un texte ne se décompose jamais deux fois » (§1.1) : une collision
  // d'empreinte dit que le texte est déjà là, sous une autre identité.
  const { data: deja, error: eDeja } = await admin.from('exercices_textes')
    .select('id, id_import').eq('empreinte', empreinte).maybeSingle()
  if (eDeja) return { ok: false, message: `Les textes n’ont pas pu être lus : ${eDeja.message}` }
  if (deja) {
    return { ok: false,
      message: `Ce contenu porte déjà une identité de fabrique — « ${txt(deja.id_import)} ». `
        + 'Un texte ne se décompose jamais deux fois.' }
  }

  // Le livre déclaré : on écrit LE COUPLE, et le libellé qui va avec.
  let livreLibelle: string | null = null
  if (s.planLivreId) {
    const { data: l, error: eL } = await admin.from('aletheia_livre_reference')
      .select('id, scriptorium_unites:scriptorium_livre_id(label)')
      .eq('id', s.planLivreId).maybeSingle()
    if (eL) return { ok: false, message: `Le livre n’a pas pu être lu : ${eL.message}` }
    if (!l) {
      return { ok: false, message: 'Le livre du plan de lecture est introuvable : '
        + 'le couple ne s’écrit pas à moitié.' }
    }
    livreLibelle = txt(jointure(l, 'scriptorium_unites').label) || s.planLivreId
  }

  const { data, error } = await admin.from('exercices_textes').insert({
    id_import: `${PREFIXE_EN_LIGNE}${randomUUID()}`,
    // ⚠️ NULL, et c'est exact : ce texte ne vient d'aucun fichier.
    import_id: null,
    contenu_id: contenuId,
    // La référence décomposée n'existe pas encore : elle naît au geste suivant.
    reference_id: null,
    auteur: s.auteur.trim(),
    titre: s.titre.trim(),
    reference: s.reference.trim(),
    empreinte,
    // « L'absence a un sens fort : elle ne dit pas "pas encore rempli", elle dit
    // JAMAIS SERVABLE » (`08-` §2). L'état se demande, il ne se devine pas.
    cours_etat: s.coursEtat,
    plan_livre_declare: livreLibelle,
    plan_livre_id: s.planLivreId,
    plan_semaine: s.planSeance,
    // ⭐ `valide`, ET C'EST UNE DÉCISION DE FORME QUI SE DIT. La file de
    //    validation garde ce qui vient DU DEHORS — un fichier fabriqué hors
    //    plateforme. Un texte déposé ici l'est par le professeur lui-même :
    //    il n'y a pas de tiers à valider. ⛔ ET LA GARDE QUI COMPTE N'EST PAS
    //    TOUCHÉE : « une référence non validée n'entre jamais en Phase 2 » —
    //    la référence naît NON VALIDÉE, et elle se lit.
    statut: 'valide',
    bloque: false, blocages: [],
  }).select('id').single()
  if (error) return { ok: false, message: `Le texte n’a pas été déposé : ${error.message}` }

  return {
    ok: true, texteId: txt(data.id),
    message: 'Texte déposé. Il n’a pas encore de référence décomposée : '
      + 'décomposez-le, puis lisez-la et validez-la.',
  }
}

/**
 * LA VOIE DE LA SAISIE — un texte neuf entre au corpus du Scriptorium, comme un
 * texte importé, et reçoit la même identité.
 *
 * ⚠️ `scriptorium_contenus` EST UNE TABLE VIVANTE : des textes et des cours réels
 *    y vivent. On y INSÈRE, on n'y touche à rien d'autre.
 */
export async function deposerUnTexteNeuf(
  admin: SupabaseClient, deposePar: string | null, contenu: string, s: SaisieDuTexte,
): Promise<Verdict> {
  if (!contenu.trim()) return { ok: false, message: 'Le texte est vide.' }

  const { data: contenuRow, error: eC } = await admin.from('scriptorium_contenus').insert({
    type: 'texte', titre: s.titre.trim(), auteur: s.auteur.trim(),
    texte_extrait: contenu, tags: [], created_by: deposePar,
  }).select('id').single()
  if (eC) return { ok: false, message: `Le corpus n’a pas accepté le texte : ${eC.message}` }

  const r = await poserLIdentiteDuTexte(admin, txt(contenuRow.id), contenu, s)
  if (!r.ok) {
    // ⚠️ CE QUI PRÉCÈDE A RÉUSSI, et le texte est DÉJÀ au corpus du Scriptorium —
    //    la table que le RAG et les écrans du Scriptorium lisent. On défait ce
    //    qu'on a créé : il ne doit rester AUCUNE trace d'un texte qui n'est pas entré.
    await admin.from('scriptorium_contenus').delete().eq('id', contenuRow.id)
    return { ...r, notes: [...(r.notes ?? []), 'rien n’est resté au corpus du Scriptorium'] }
  }
  return r
}

/**
 * LA DÉCOMPOSITION — G1, G2, G3, dans l'ordre, puis le contrôle qui fait foi.
 *
 * ⛔ « LA CHAÎNE A ÉCHOUÉ : ON RÉGÉNÈRE, ON NE DÉRANGE PAS LE PROFESSEUR »
 *    (`05-` §4.1). Un REFUS n'écrit RIEN : la référence n'est pas soumise, le
 *    texte reste sans référence, et le geste se rejoue. Un BLOCAGE, lui, écrit :
 *    « elle lui EST soumise, mais il doit trancher avant de valider ».
 *
 * ⚠️ « UNE SEULE DÉCOMPOSITION PAR TEXTE, SANS VERSIONS » (`05-` §4.5).
 */
export async function decomposerUnTexte(
  admin: SupabaseClient, texteId: string,
): Promise<Verdict> {
  const { data: t, error: eT } = await admin.from('exercices_textes')
    // ⚠️ D'UN SEUL TENANT : coupé avec un `+`, le `select` cesse d'être une
    //    constante de type et supabase-js rend `GenericStringError[]`.
    .select('id, reference_id, auteur, titre, reference, contenu_id, empreinte, scriptorium_contenus(texte_extrait)')
    .eq('id', texteId).maybeSingle()
  if (eT) return { ok: false, message: `Le texte n’a pas pu être lu : ${eT.message}` }
  if (!t) return { ok: false, message: 'Texte introuvable.' }
  const ligne = t as unknown as Ligne
  if (ligne.reference_id) {
    return { ok: false,
      message: 'Ce texte porte déjà une référence décomposée — « une seule décomposition par '
        + 'texte, sans versions ». Lisez-la, corrigez-la, validez-la.',
      referenceId: txt(ligne.reference_id) }
  }
  const texte = txt(jointure(ligne, 'scriptorium_contenus').texte_extrait)
  if (!texte.trim()) {
    return { ok: false, message: 'Le contenu de ce texte est vide au Scriptorium : '
      + 'il n’y a rien à décomposer.' }
  }

  let d
  try {
    d = await engendrerLaReference(texte)
  } catch (e) {
    if (e instanceof GenerationInterrompue) {
      return { ok: false,
        message: `La décomposition s’est arrêtée à ${e.passage} : rien n’a été écrit. ${e.message}`,
        empechements: e.motifs,
        notes: [`${e.appels} appel(s) déjà payé(s), journalisé(s) à \`api_couts\` `
          + `(module \`${MODULE_COUT}\`, \`phase\` NULL)`] }
    }
    return { ok: false,
      message: `La décomposition a échoué : ${e instanceof Error ? e.message : String(e)}` }
  }

  const journal = d.passages.map((p) => (p.saute
    ? `${p.passage} : ${p.saute}${p.appels ? ` (${p.appels} appel)` : ' — aucun appel'}`
    : `${p.passage} : ${p.appels} appel(s)`))
  journal.push(`${d.appels} ligne(s) attendue(s) à \`api_couts\` — module \`${MODULE_COUT}\`, `
    + `modèle \`${d.modele}\`, \`phase\` NULL (le générateur n’est pas un étage de la chaîne)`)
  journal.push(...d.verdict.annonces)

  // ── LE REFUS N'ÉCRIT RIEN ─────────────────────────────────────────────────
  if (d.verdict.refus.length > 0) {
    return { ok: false,
      message: 'Le contrôle REFUSE cette décomposition : elle ne vous est pas soumise. '
        + 'La chaîne a échoué — relancez la décomposition.',
      empechements: d.verdict.refus, notes: journal }
  }

  // ── Elle est soumise au professeur : NON VALIDÉE, et elle se lit ───────────
  const { data: ref, error: eR } = await admin.from('exercices_references').insert({
    // « Sa SOURCE : le contenu ou le livre, plus la localisation. »
    source_contenu_id: ligne.contenu_id,
    localisation: txt(ligne.reference),
    contenu: d.reference,
    // L'empreinte est celle du texte, et elle est UNIQUE : « un texte ne se
    // décompose jamais deux fois ». C'est la même que porte `exercices_textes`.
    empreinte: txt(ligne.empreinte),
    // ⛔ NI `validee_par` NI `validee_at` : « une référence non validée n'entre
    //    jamais en Phase 2 », et la validation est UN GESTE DU PROFESSEUR.
    validee_par: null, validee_at: null,
  }).select('id').single()
  if (eR) {
    return { ok: false,
      message: `La décomposition a réussi, mais la référence n’a pas pu être écrite : ${eR.message}`,
      notes: journal }
  }

  const { data: maj, error: eMaj } = await admin.from('exercices_textes')
    .update({ reference_id: ref.id, updated_at: new Date().toISOString() })
    .eq('id', texteId).select('id')
  if (eMaj || (maj ?? []).length === 0) {
    // ⚠️ UNE RÉFÉRENCE ORPHELINE NE SE VOIT NULLE PART : la file de l'écran de
    //    conception la lit par sa jointure au texte. On la retire.
    await admin.from('exercices_references').delete().eq('id', ref.id)
    return { ok: false,
      message: `La référence n’a pas pu être rattachée au texte (${eMaj?.message ?? 'aucune ligne'}) `
        + '— elle a été retirée, rien d’incomplet ne reste.',
      notes: journal }
  }

  return {
    ok: true, texteId, referenceId: txt(ref.id),
    message: d.verdict.blocages.length > 0
      ? `Référence engendrée, avec ${d.verdict.blocages.length} blocage(s) : elle vous est `
        + 'soumise, et vous tranchez avant de valider.'
      : 'Référence engendrée et CONFORME : elle vous est soumise. Lisez-la, puis validez-la '
        + 'd’un seul geste.',
    empechements: d.verdict.blocages,
    notes: [...journal, ...d.verdict.signalements.map((s) => `signalement — ${s}`)],
  }
}
