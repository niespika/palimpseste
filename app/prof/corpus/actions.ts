'use server'

// ============================================================================
// C4 · L8 — LE DÉPÔT DU CORPUS : déposer, valider en file, rattacher.
// ----------------------------------------------------------------------------
// « Le fichier d'import et sa FILE DE VALIDATION. Le professeur fabrique son
//   corpus HORS DE LA PLATEFORME ; ce lot ne lui fournit qu'un endroit où le
//   déposer et de quoi le valider. C'est ici aussi que LE RATTACHEMENT AU COURS
//   SE DÉCLARE — un sujet et un texte y prennent leur état, et un texte tiré du
//   livre de la classe y prend sa semaine de plan de lecture. »
//                                                — `07-Implementation.md` §2
//
// « Une entrée BLOQUÉE ne se valide pas tant qu'elle l'est », et « la validation
//   en masse NE PASSE JAMAIS une entrée bloquée » (`08-` §7 ; le « fait quand »).
// ============================================================================

import { revalidatePath } from 'next/cache'
import { garderProf } from '@/utils/fabrique/acces'
import { deposerFichierImport } from '@/utils/fabrique/import-ecriture'

/** Une ligne rendue par Supabase — lue par accesseurs, jamais à l'aveugle. */
type Ligne = Record<string, unknown>

export interface RetourCorpus {
  ok: boolean
  message: string
  refus?: string[]
  blocages?: string[]
  signalements?: string[]
  comptes?: string[]
}

const TABLE: Record<string, string> = {
  textes: 'exercices_textes', sujets: 'exercices_sujets',
  materiaux: 'exercices_materiaux', demonstrations: 'exercices_demonstrations',
  exercices: 'exercices',
}

/** Le dépôt d'un fichier. « Un seul fichier, un seul objet JSON, UTF-8. » */
export async function importerCorpus(
  _prec: RetourCorpus | null, form: FormData,
): Promise<RetourCorpus> {
  const { admin, userId } = await garderProf(false)
  const fichier = form.get('fichier')
  if (!(fichier instanceof File) || fichier.size === 0) {
    return { ok: false, message: 'Aucun fichier déposé.' }
  }
  let brut: unknown
  try {
    brut = JSON.parse(await fichier.text())
  } catch (e) {
    return { ok: false, message: `Le fichier n'est pas du JSON lisible : ${(e as Error).message}` }
  }

  const r = await deposerFichierImport(admin, brut, fichier.name, userId)
  revalidatePath('/prof/corpus')

  const comptes = Object.keys(r.entres).map((b) => {
    const ign = (r.verdict.ignores[b] ?? []).length
    return `${b} : ${r.entres[b]} entrée(s)`
      + (r.refuses[b] ? `, ${r.refuses[b]} refusée(s)` : '')
      + (r.bloques[b] ? `, ${r.bloques[b]} bloquée(s)` : '')
      // « L'import rend LE COMPTE DE CE QU'IL A IGNORÉ, banque par banque »
      // (`08-` §1) : sans lui, une correction qui n'arrive pas passe pour un
      // dépôt réussi.
      + (ign ? `, ${ign} ignorée(s) — déjà en base` : '')
  })

  if (r.verdict.fichierRefuse) {
    return {
      ok: false,
      message: 'Le fichier entier est refusé, avant toute lecture de son contenu.',
      refus: r.verdict.refus, comptes,
    }
  }
  return {
    ok: r.verdict.code === 0,
    message: r.verdict.code === 0
      ? 'Fichier importé. Toutes les entrées attendent inactives, en file de validation.'
      : 'Fichier importé — certaines entrées ont été refusées et ne sont PAS entrées. '
        + 'Le refus est le verdict réparable : corrigez, et redéposez sous les mêmes `id`.',
    refus: r.verdict.refus,
    blocages: r.verdict.blocages,
    signalements: [...r.verdict.signalements, ...r.incidents],
    comptes,
  }
}

/**
 * La validation en file — « en masse OU UNE À UNE », et jamais une entrée
 * bloquée. Pour un exercice, « la validation EST le geste de conception » :
 * `a_concevoir` → `concu` (`07-` §5 ; piège 24).
 */
export async function validerEnFile(
  _prec: RetourCorpus | null, form: FormData,
): Promise<RetourCorpus> {
  const { admin } = await garderProf(false)
  const banque = String(form.get('banque') ?? '')
  const ids = form.getAll('id').map(String).filter(Boolean)
  const table = TABLE[banque]
  if (!table || ids.length === 0) return { ok: false, message: 'Rien à valider.' }

  const versExercice = banque === 'exercices'
  const depart = versExercice ? 'a_concevoir' : 'a_valider'
  const arrivee = versExercice ? 'concu' : 'valide'

  // « La validation en masse ne passe JAMAIS une entrée bloquée » : on les met
  // dehors AVANT d'écrire. Les matériaux et les démonstrations ne portent aucun
  // blocage — le `08-` §7.2 n'en déclare pas pour eux.
  const porteBloque = versExercice || banque === 'textes' || banque === 'sujets'
  let passables = ids
  let nBloques = 0
  if (porteBloque) {
    const { data: bloques } = await admin.from(table)
      .select('id').in('id', ids).eq('bloque', true)
    const s = new Set(((bloques ?? []) as unknown as Ligne[]).map((x) => String(x.id)))
    nBloques = s.size
    passables = ids.filter((i) => !s.has(i))
  }

  // ⚠️ On écrit ENTRÉE PAR ENTRÉE, et on lit ce que l'écriture rend. Une garde
  // de base peut refuser une entrée que le blocage d'import laissait passer —
  // c'est le cas d'un texte dont le LIVRE du plan de lecture n'est pas encore
  // apparié : « tant qu'il n'est pas fait, le texte se tient pour NON SERVABLE »
  // (`08-` §2 ; piège 16). Un compte annoncé sans lire le retour mentirait.
  let validees = 0
  const refusees: string[] = []
  for (const id of passables) {
    const { data, error } = await admin.from(table)
      .update({ statut: arrivee, updated_at: new Date().toISOString() })
      .eq('id', id).eq('statut', depart).select('id')
    if (error) {
      refusees.push(error.message.includes('textes_valide_apparie_chk')
        ? 'un texte déclare un plan de lecture dont le livre n’est pas encore apparié — '
          + 'il se tient pour non servable, et ne se valide pas tant que l’appariement '
          + 'n’est pas fait (onglet « Le rattachement au cours »)'
        : error.message)
    } else {
      validees += (data ?? []).length
    }
  }

  revalidatePath('/prof/corpus')
  return {
    ok: validees > 0,
    message: `${validees} entrée(s) ${versExercice ? 'passée(s) à `concu`' : 'validée(s)'}`
      + (nBloques ? ` — ${nBloques} bloquée(s) NON validée(s) : une entrée bloquée `
        + 'ne se valide pas tant qu’elle l’est.' : '.')
      + (refusees.length ? ` ${refusees.length} refusée(s) par une garde de base.` : ''),
    blocages: refusees.length ? [...new Set(refusees)] : undefined,
  }
}

/** Le RETRAIT d'une entrée. « Corriger se fait dans Palimpseste, sur l'entrée —
 *  ou EN LA RETIRANT puis en la redéposant sous un `id` neuf : il te faut donc
 *  un retrait d'entrée » (`08-` §1 ; piège 11). */
export async function retirerEntree(
  _prec: RetourCorpus | null, form: FormData,
): Promise<RetourCorpus> {
  const { admin } = await garderProf(false)
  const banque = String(form.get('banque') ?? '')
  const id = String(form.get('id') ?? '')
  const table = TABLE[banque]
  if (!table || !id) return { ok: false, message: 'Rien à retirer.' }
  if (banque === 'exercices') {
    return { ok: false, message: 'Le retrait d’un exercice passe par son écran d’édition.' }
  }
  const { error } = await admin.from(table).update({ statut: 'retire' }).eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/prof/corpus')
  return { ok: true, message: 'Entrée retirée — elle peut être redéposée sous un `id` neuf.' }
}

/**
 * LE RATTACHEMENT AU COURS — trois états, et l'absence a un sens fort.
 *
 * « L'import ne vérifie que la FORME : il ne PEUT PAS savoir qu'un cours
 * existe — L'APPARIEMENT SE FAIT À L'ÉCRAN DU DÉPÔT » (`08-` §2 ; piège 15).
 */
export async function rattacherAuCours(
  _prec: RetourCorpus | null, form: FormData,
): Promise<RetourCorpus> {
  const { admin } = await garderProf(false)
  const banque = String(form.get('banque') ?? '')
  const id = String(form.get('id') ?? '')
  const etat = String(form.get('cours_etat') ?? '')
  const coursIds = form.getAll('cours_id').map(String).filter(Boolean)
  if (!['generique', 'liste', 'aucun'].includes(etat)) {
    return { ok: false, message: 'État de rattachement inconnu.' }
  }
  const table = banque === 'textes' ? 'exercices_textes' : 'exercices_sujets'
  const enfant = banque === 'textes' ? 'exercices_textes_cours' : 'exercices_sujets_cours'
  const cle = banque === 'textes' ? 'texte_id' : 'sujet_id'

  const { error } = await admin.from(table)
    .update({ cours_etat: etat, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { ok: false, message: error.message }

  if (etat === 'liste') {
    // On apparie ce que le fichier a DÉCLARÉ à ce que la plateforme porte.
    const { data: declares } = await admin.from(enfant).select('cours_declare').eq(cle, id)
    const noms = ((declares ?? []) as unknown as Ligne[]).map((d) => String(d.cours_declare))
    if (noms.length === 0 && coursIds.length > 0) {
      await admin.from(enfant).insert(coursIds.map((c) => ({
        [cle]: id, cours_declare: c, cours_id: c,
      })))
    } else {
      for (let i = 0; i < noms.length; i++) {
        await admin.from(enfant).update({ cours_id: coursIds[i] ?? null })
          .eq(cle, id).eq('cours_declare', noms[i])
      }
    }
  } else {
    await admin.from(enfant).update({ cours_id: null }).eq(cle, id)
  }
  revalidatePath('/prof/corpus')
  return {
    ok: true,
    message: etat === 'generique' ? 'Servable en tout temps.'
      : etat === 'liste' ? 'Servable dès qu’au moins un de ces cours a été en partie vu.'
        : 'Jamais servable — l’absence de rattachement ne dit pas « pas encore rempli », '
          + 'elle dit « jamais servi ».',
  }
}

/** L'appariement du LIVRE du plan de lecture — même régime que le cours :
 *  « le fichier le nomme, la plateforme le reconnaît », et tant qu'il n'est pas
 *  fait, le texte se tient pour NON SERVABLE (`08-` §2 ; piège 16). */
export async function apparierLivre(
  _prec: RetourCorpus | null, form: FormData,
): Promise<RetourCorpus> {
  const { admin } = await garderProf(false)
  const id = String(form.get('id') ?? '')
  const livreId = String(form.get('livre_id') ?? '')
  const { error } = await admin.from('exercices_textes')
    .update({ plan_livre_id: livreId || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { ok: false, message: error.message }
  revalidatePath('/prof/corpus')
  return {
    ok: true,
    message: livreId
      ? 'Livre apparié — la semaine se compare désormais par égalité sur son ordinal.'
      : 'Appariement retiré : le texte se tient pour non servable.',
  }
}
