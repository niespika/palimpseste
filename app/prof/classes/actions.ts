'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { collecterCheminsInscriptions, retirerFichiers } from '@/utils/effacement'

async function verifierProf() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'prof') throw new Error('Accès refusé')
  return supabase
}

export async function creerClasse(formData: FormData) {
  const supabase = await verifierProf()
  const nom = (formData.get('nom') as string)?.trim()
  const niveau = (formData.get('niveau') as string) || null
  const filiere = (formData.get('filiere') as string) || null
  const annee = (formData.get('annee_scolaire') as string)?.trim()
  const typePedagogique = (formData.get('type_pedagogique') as string) || null

  if (!nom || !annee) return { error: 'Nom et année scolaire sont requis.' }
  if (typePedagogique && !['tc', 'hlp', 'autre'].includes(typePedagogique))
    return { error: 'Type pédagogique invalide.' }

  // On n'ajoute type_pedagogique au payload QUE s'il est choisi : le chemin sans
  // type reste byte-identique et n'exige pas la migration plan_evaluation_phase_a.sql
  // (la colonne peut ne pas encore exister). D1a : jamais dérivé de `filiere`.
  const payload: Record<string, unknown> = { nom, niveau, filiere, annee_scolaire: annee }
  if (typePedagogique) payload.type_pedagogique = typePedagogique

  const { error } = await supabase
    .from('classes')
    .insert(payload)

  if (error) {
    // Fenêtre pré-migration : plan_evaluation_phase_a.sql pas encore joué → la colonne
    // type_pedagogique n'existe pas. On dégrade en créant la classe SANS le type (il ne
    // sert qu'à la propagation, gatée) plutôt que de bloquer la création.
    const colonneAbsente = typePedagogique
      && (error.code === 'PGRST204' || error.code === '42703' || error.message.includes('type_pedagogique'))
    if (colonneAbsente) {
      const { error: e2 } = await supabase.from('classes').insert({ nom, niveau, filiere, annee_scolaire: annee })
      if (e2) return { error: e2.message }
    } else {
      return { error: error.message }
    }
  }
  revalidatePath('/prof/classes')
  return { success: true }
}

// Effacement DÉFINITIF d'une classe (Lot 2). Friction côté UI (3 étapes) + ici
// défense en profondeur : le nom retapé doit correspondre. Purge complète :
// travail élève scopé SUPPRIMÉ, contenu prof DÉTACHÉ, comptes intacts.
export async function effacerClasse(formData: FormData) {
  await verifierProf()
  const admin = createAdminClient()
  const id = formData.get('id') as string
  const confirmation = ((formData.get('confirmation') as string) ?? '').trim()

  const { data: classe } = await admin.from('classes').select('id, nom').eq('id', id).single()
  if (!classe) return { error: 'Classe introuvable.' }
  if (confirmation !== classe.nom) return { error: 'Le nom saisi ne correspond pas à la classe.' }

  // Inscriptions de la classe (tous statuts)
  const { data: inscriptions } = await admin
    .from('inscriptions').select('id').eq('classe_id', id)
  const inscriptionIds = (inscriptions ?? []).map((i) => i.id as string)

  // 1. Collecter les chemins de stockage AVANT la suppression des lignes
  const chemins = await collecterCheminsInscriptions(admin, inscriptionIds)

  // 2. Effacement DB atomique (transaction Postgres)
  const { error } = await admin.rpc('effacer_classe', { p_classe_id: id })
  if (error) return { error: error.message }

  // 3. Purge du stockage (après succès DB)
  await retirerFichiers(admin, chemins)

  revalidatePath('/prof/classes')
  revalidatePath('/prof')
  return { success: true }
}

// Écartement persistant d'un rappel de fin d'année (« cette classe continue »).
export async function ecarterRappelClasse(formData: FormData) {
  const supabase = await verifierProf()
  const id = formData.get('id') as string
  const { error } = await supabase.from('classes').update({ rappel_ecarte: true }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/prof')
  return { success: true }
}

export async function inscrireEleve(formData: FormData) {
  const supabase = await verifierProf()
  const classeId = formData.get('classeId') as string
  const eleveId = formData.get('eleveId') as string
  if (!eleveId) return { error: 'Sélectionne un élève.' }

  // La cible doit être un élève : empêche une inscription parasite d'un profil
  // prof via un eleveId forgé (la FK seule n'exclut pas les profils prof).
  const { data: cible } = await supabase
    .from('profiles').select('role').eq('id', eleveId).maybeSingle()
  if (cible?.role !== 'eleve') return { error: 'Élève introuvable.' }

  const { error } = await supabase
    .from('inscriptions')
    .upsert(
      { eleve_id: eleveId, classe_id: classeId, statut: 'active' },
      { onConflict: 'eleve_id,classe_id' }
    )

  if (error) return { error: error.message }
  revalidatePath('/prof/classes')
  revalidatePath('/prof/classes/[classeId]', 'page')
  revalidatePath('/prof/eleves')
  return { success: true }
}

/** Ce qu'un retrait va emporter — pour que la confirmation le DISE. */
export interface ApercuRetrait {
  eleveNom: string
  classeNom: string
  /** Lignes prêtes à afficher (« 3 dépôts Fragments »). Vide = rien à perdre. */
  lignes: string[]
  /** Classes où l'élève reste inscrit après le retrait. */
  autresClasses: string[]
}

const pluriel = (n: number, un: string, plusieurs = `${un}s`) => `${n} ${n > 1 ? plusieurs : un}`

/**
 * Aperçu du retrait, lu AVANT le geste. Le `confirm()` natif ne disait qu'une
 * phrase générique (« son travail dans CETTE classe sera supprimé ») — et, dans
 * un aperçu embarqué, il ne disait rien du tout : il rendait `false` et le
 * bouton paraissait mort (règle d'or de `SUIVI_tests_manuels.md`, cinquième
 * morsure). Le panneau en page dit ce qui part, ligne par ligne.
 * Les comptes suivent EXACTEMENT ce que `retirer_inscription` efface.
 */
export async function apercuRetraitEleve(formData: FormData): Promise<ApercuRetrait | { error: string }> {
  await verifierProf()
  const admin = createAdminClient()
  const classeId = formData.get('classeId') as string
  const eleveId = formData.get('eleveId') as string

  const [{ data: insc }, { data: profil }, { data: classe }] = await Promise.all([
    admin.from('inscriptions').select('id').eq('classe_id', classeId).eq('eleve_id', eleveId).maybeSingle(),
    admin.from('profiles').select('display_name').eq('id', eleveId).maybeSingle(),
    admin.from('classes').select('nom').eq('id', classeId).maybeSingle(),
  ])
  const eleveNom = (profil?.display_name as string) ?? 'Cet élève'
  const classeNom = (classe?.nom as string) ?? 'cette classe'
  if (!insc) return { error: 'Cet élève n’est plus inscrit dans cette classe.' }
  const inscriptionId = insc.id as string

  const parInscription = async (table: string): Promise<number> => {
    const { count } = await admin.from(table)
      .select('id', { count: 'exact', head: true })
      .eq('inscription_id', inscriptionId)
    return count ?? 0
  }

  // Codex / Quazian : le travail est scopé par inscription depuis le Lot 1 ; les
  // livres Aletheia sont assignés à la CLASSE, d'où le passage par les liens.
  const { data: livresClasse } = await admin
    .from('scriptorium_unite_classes').select('unite_id').eq('classe_id', classeId)
  const livreIds = (livresClasse ?? []).map((l) => l.unite_id as string)

  const [depots, essais, oraux, codex, quizz, aletheia, conversations, autres] = await Promise.all([
    parInscription('fragments_depots'),
    parInscription('fragments_essai_depots'),
    parInscription('fragments_oraux'),
    parInscription('codex_travaux'),
    parInscription('quazian_sessions'),
    livreIds.length > 0
      ? admin.from('aletheia_travaux').select('id', { count: 'exact', head: true })
          .eq('eleve_id', eleveId).in('scriptorium_livre_id', livreIds).then((r) => r.count ?? 0)
      : Promise.resolve(0),
    admin.from('scriptorium_conversations').select('id', { count: 'exact', head: true })
      .eq('eleve_id', eleveId).eq('classe_id', classeId).is('supprime_at', null).then((r) => r.count ?? 0),
    admin.from('inscriptions').select('classe_id, classes(nom)')
      .eq('eleve_id', eleveId).neq('id', inscriptionId).eq('statut', 'active'),
  ])

  const lignes: string[] = []
  if (depots > 0) lignes.push(`${pluriel(depots, 'dépôt')} Fragments`)
  if (essais > 0) lignes.push(`${pluriel(essais, 'essai')} Fragments`)
  if (oraux > 0) lignes.push(`${pluriel(oraux, 'oral', 'oraux')} Fragments`)
  if (codex > 0) lignes.push(`${pluriel(codex, 'synthèse')} Codex`)
  if (quizz > 0) lignes.push(`${pluriel(quizz, 'quizz')} Quazian passé${quizz > 1 ? 's' : ''}`)
  if (aletheia > 0) lignes.push(`${pluriel(aletheia, 'séance')} de lecture Aletheia`)
  if (conversations > 0) lignes.push(`${pluriel(conversations, 'conversation')} du Scriptorium`)

  const autresClasses = (autres.data ?? [])
    .map((r) => (r as unknown as { classes: { nom: string } | null }).classes?.nom)
    .filter((n): n is string => !!n)
    .sort((a, b) => a.localeCompare(b))

  // Dernière inscription : les états de révision FSRS, partagés entre classes,
  // partent avec elle (c'est la règle de la RPC — ils n'ont plus de porteur).
  if (autresClasses.length === 0) {
    const { count } = await admin.from('quazian_card_states')
      .select('id', { count: 'exact', head: true }).eq('eleve_id', eleveId)
    if ((count ?? 0) > 0) lignes.push(`sa révision Quazian (${pluriel(count ?? 0, 'carte')} en mémoire)`)
  }

  return { eleveNom, classeNom, lignes, autresClasses }
}

// Retrait DUR d'un élève (décision Lot 2) : supprime son inscription + tout son
// travail scopé sur CETTE classe (+ notes de semestre, journal, fichiers), sans
// toucher au compte ni à ses autres classes.
export async function retirerEleve(formData: FormData) {
  await verifierProf()
  const admin = createAdminClient()
  const classeId = formData.get('classeId') as string
  const eleveId = formData.get('eleveId') as string

  const { data: insc } = await admin
    .from('inscriptions')
    .select('id')
    .eq('classe_id', classeId)
    .eq('eleve_id', eleveId)
    .maybeSingle()
  if (!insc) {
    revalidatePath('/prof/classes')
    return { success: true }
  }

  // 1. Collecter les chemins de stockage avant la suppression
  const chemins = await collecterCheminsInscriptions(admin, [insc.id as string])

  // 2. Retrait DB atomique (cascade le travail scopé sur cette inscription)
  const { error } = await admin.rpc('retirer_inscription', { p_inscription_id: insc.id })
  if (error) return { error: error.message }

  // 3. Purge du stockage
  await retirerFichiers(admin, chemins)

  revalidatePath('/prof/classes')
  revalidatePath('/prof/classes/[classeId]', 'page')
  revalidatePath('/prof/eleves')
  return { success: true }
}

export async function definirModulesClasse(formData: FormData) {
  const supabase = await verifierProf()
  const classeId = formData.get('classeId') as string
  const moduleIds = formData.getAll('moduleIds') as string[]

  const { data: existants } = await supabase
    .from('classe_modules')
    .select('module_id')
    .eq('classe_id', classeId)

  const existantsIds = (existants ?? []).map((r) => r.module_id as string)
  const aAjouter = moduleIds.filter((id) => !existantsIds.includes(id))
  const aSupprimer = existantsIds.filter((id) => !moduleIds.includes(id))

  if (aAjouter.length > 0) {
    await supabase
      .from('classe_modules')
      .insert(aAjouter.map((module_id) => ({ classe_id: classeId, module_id })))
  }
  if (aSupprimer.length > 0) {
    await supabase
      .from('classe_modules')
      .delete()
      .eq('classe_id', classeId)
      .in('module_id', aSupprimer)
  }

  revalidatePath('/prof/classes')
  revalidatePath('/prof/classes/[classeId]', 'page')
  revalidatePath('/prof/modules')
  return { success: true }
}
