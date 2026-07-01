import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { inscriptionsModuleEleve } from '@/utils/acces'
import { contexteClasseEleve } from '../../contexte-classe'
import type { CapstoneRow, LivreAletheia, SemaineLivre, TravailAletheia } from './types'
import { AIDES_V1_DEFAUT, type AidesV1 } from './aides-v1'

export interface InscriptionAletheia { id: string; classe_id: string; classe_nom: string }

// Contexte Aletheia de l'élève : module actif ? inscriptions sur des classes AYANT
// le module (gate de visibilité), et inscription active (commutateur Lot 9). Source
// unique pour le planning, la page semaine ET les actions → scoping cohérent.
export async function contexteAletheia(
  supabase: SupabaseClient, userId: string,
): Promise<{ moduleActif: boolean; inscriptions: InscriptionAletheia[]; active: InscriptionAletheia | null }> {
  const { data: moduleData } = await supabase.from('modules').select('id, actif').eq('slug', 'aletheia').maybeSingle()
  if (!moduleData?.actif) return { moduleActif: false, inscriptions: [], active: null }
  const inscriptions = await inscriptionsModuleEleve(supabase, userId, moduleData.id as string)
  if (inscriptions.length === 0) return { moduleActif: true, inscriptions: [], active: null }
  const { active } = await contexteClasseEleve(supabase, userId)
  const inscriptionActive = inscriptions.find(i => i.id === active?.id) ?? inscriptions[0]
  return { moduleActif: true, inscriptions, active: inscriptionActive }
}

// Date indicative d'une semaine = date_debut + (semaine-1)×7 jours, formatée
// « JJ/MM/AAAA ». On passe par Date.UTC (arguments explicites, déterministe) et
// les getters UTC pour éviter la dérive de fuseau (cf. formatDateFr Scriptorium).
export function dateIndicative(dateDebut: string | null, semaine: number): string {
  if (!dateDebut) return ''
  const [y, m, d] = dateDebut.split('-').map(Number)
  if (!y || !m || !d) return ''
  const dt = new Date(Date.UTC(y, m - 1, d + (semaine - 1) * 7))
  const jj = String(dt.getUTCDate()).padStart(2, '0')
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  return `${jj}/${mm}/${dt.getUTCFullYear()}`
}

// Les livres assignés à une classe + leurs semaines (titre, chapitres, date).
// IMPORTANT : on n'expose JAMAIS fichier_ref / texte_extrait (ancrage IA, réservé
// serveur). Le Scriptorium est en RLS prof-only → lecture via le client admin.
export async function livresPourClasse(admin: SupabaseClient, classeId: string): Promise<LivreAletheia[]> {
  const { data: liens } = await admin
    .from('scriptorium_unite_classes')
    .select('unite_id')
    .eq('classe_id', classeId)
  const bookIds = [...new Set((liens ?? []).map(l => l.unite_id as string))]
  if (bookIds.length === 0) return []

  const [{ data: unites }, { data: docs }] = await Promise.all([
    admin.from('scriptorium_unites')
      .select('id, label, date_debut, nb_semaines, auteur')
      .eq('type', 'livre')
      .is('supprime_at', null)   // un livre supprimé ne s'affiche plus (defense-in-depth : classes déjà détachées)
      .in('id', bookIds)
      .order('ordre', { ascending: true }),
    admin.from('scriptorium_documents')
      .select('unite_id, semaine, titre, chapitres')
      .in('unite_id', bookIds)
      .not('semaine', 'is', null)
      .order('semaine', { ascending: true }),
  ])

  const semainesParLivre = new Map<string, SemaineLivre[]>()
  for (const d of docs ?? []) {
    const uid = d.unite_id as string
    const arr = semainesParLivre.get(uid) ?? []
    arr.push({
      semaine: d.semaine as number,
      titre: (d.titre as string) ?? `Semaine ${d.semaine}`,
      chapitres: (d.chapitres as string | null) ?? null,
      dateIndicative: dateIndicative((unites ?? []).find(u => u.id === uid)?.date_debut as string | null ?? null, d.semaine as number),
    })
    semainesParLivre.set(uid, arr)
  }

  return (unites ?? []).map(u => ({
    id: u.id as string,
    titre: u.label as string,
    auteur: (u.auteur as string | null) ?? null,
    date_debut: (u.date_debut as string | null) ?? null,
    nb_semaines: (u.nb_semaines as number | null) ?? null,
    semaines: semainesParLivre.get(u.id as string) ?? [],
  }))
}

// Un livre est accessible à l'élève s'il est assigné à l'une des classes fournies
// ET qu'il s'agit bien d'un livre (defense-in-depth : la table de liaison ne
// devrait contenir que des livres, mais on ne s'appuie pas dessus pour la garde).
export async function livreAccessible(admin: SupabaseClient, classeIds: string[], livreId: string): Promise<boolean> {
  if (classeIds.length === 0) return false
  const { data: lien } = await admin
    .from('scriptorium_unite_classes')
    .select('unite_id')
    .eq('unite_id', livreId)
    .in('classe_id', classeIds)
    .limit(1)
  if ((lien ?? []).length === 0) return false
  const { data: u } = await admin.from('scriptorium_unites').select('type').eq('id', livreId).maybeSingle()
  return u?.type === 'livre'
}

// Une semaine précise d'un livre (titre / chapitres / date), ou null si absente.
export async function semaineLivre(admin: SupabaseClient, livreId: string, semaine: number): Promise<SemaineLivre | null> {
  const [{ data: unite }, { data: doc }] = await Promise.all([
    admin.from('scriptorium_unites').select('date_debut').eq('id', livreId).maybeSingle(),
    admin.from('scriptorium_documents')
      .select('titre, chapitres')
      .eq('unite_id', livreId)
      .eq('semaine', semaine)
      .maybeSingle(),
  ])
  if (!doc) return null
  return {
    semaine,
    titre: (doc.titre as string) ?? `Semaine ${semaine}`,
    chapitres: (doc.chapitres as string | null) ?? null,
    dateIndicative: dateIndicative((unite?.date_debut as string | null) ?? null, semaine),
  }
}

// Réglages globaux Aletheia (Lot 6). aletheia_params est en RLS prof → lecture
// côté élève via le client admin (comme les lectures Scriptorium).
export async function lireReglages(admin: SupabaseClient): Promise<{ evalQuestions: boolean; deblocageSequentiel: boolean; aides: AidesV1 }> {
  const { data } = await admin.from('aletheia_params')
    .select('eval_questions_actif, deblocage_sequentiel, aide_these, aide_arguments, aide_accord, aide_questions, aide_vocabulaire')
    .eq('id', 1).maybeSingle()
  return {
    evalQuestions: !!data?.eval_questions_actif,
    deblocageSequentiel: !!data?.deblocage_sequentiel,
    aides: {
      these: data?.aide_these || AIDES_V1_DEFAUT.these,
      arguments: data?.aide_arguments || AIDES_V1_DEFAUT.arguments,
      accord: data?.aide_accord || AIDES_V1_DEFAUT.accord,
      questions: data?.aide_questions || AIDES_V1_DEFAUT.questions,
      vocabulaire: data?.aide_vocabulaire || AIDES_V1_DEFAUT.vocabulaire,
    },
  }
}

// Déblocage séquentiel (Lot 6 D) : une semaine est ouverte si le déblocage est
// off, OU si c'est la 1re semaine, OU si la semaine précédente (dans l'ordre) est DONE.
export function estSemaineDebloquee(semaines: number[], doneSet: Set<number>, semaine: number, sequentiel: boolean): boolean {
  if (!sequentiel) return true
  const ordre = [...semaines].sort((a, b) => a - b)
  const idx = ordre.indexOf(semaine)
  if (idx <= 0) return true
  return doneSet.has(ordre[idx - 1])
}

// Accès serveur à une semaine (page semaine + actions) : applique le déblocage séquentiel.
export async function peutAccederSemaine(admin: SupabaseClient, eleveId: string, livreId: string, semaine: number): Promise<boolean> {
  const { deblocageSequentiel } = await lireReglages(admin)
  if (!deblocageSequentiel) return true
  const [{ data: docs }, { data: faits }] = await Promise.all([
    admin.from('scriptorium_documents').select('semaine').eq('unite_id', livreId).not('semaine', 'is', null),
    admin.from('aletheia_travaux').select('semaine_index').eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId).eq('statut', 'DONE'),
  ])
  const semaines = [...new Set((docs ?? []).map(d => d.semaine as number))]
  const doneSet = new Set((faits ?? []).map(t => t.semaine_index as number))
  return estSemaineDebloquee(semaines, doneSet, semaine, true)
}

// L'état du capstone du LIVRE (carte partagée, canonique), ou null si jamais lancé.
// La table est en RLS prof-only → lecture côté élève via le client admin, la garde
// d'accès (livre assigné + toutes semaines DONE) étant appliquée par l'appelant.
export async function chargerCapstoneLivre(admin: SupabaseClient, livreId: string): Promise<CapstoneRow | null> {
  const { data } = await admin
    .from('aletheia_capstone')
    .select('statut, contenu')
    .eq('scriptorium_livre_id', livreId)
    .maybeSingle()
  return (data as CapstoneRow | null) ?? null
}

// Toutes les semaines du livre sont-elles DONE pour cet élève ? (gate du capstone :
// l'élève ne voit la carte partagée qu'après avoir lui-même tout terminé — anti-spoiler.)
export async function toutesSemainesDone(admin: SupabaseClient, eleveId: string, livreId: string): Promise<boolean> {
  const [{ data: docs }, { data: faits }] = await Promise.all([
    admin.from('scriptorium_documents').select('semaine').eq('unite_id', livreId).not('semaine', 'is', null),
    admin.from('aletheia_travaux').select('semaine_index').eq('eleve_id', eleveId).eq('scriptorium_livre_id', livreId).eq('statut', 'DONE'),
  ])
  const semaines = [...new Set((docs ?? []).map(d => d.semaine as number))]
  if (semaines.length === 0) return false
  const doneSet = new Set((faits ?? []).map(t => t.semaine_index as number))
  return semaines.every(s => doneSet.has(s))
}

// Les travaux de l'élève pour un livre, indexés par numéro de semaine (RLS eleve_own).
export async function travauxParSemaine(
  supabase: SupabaseClient, eleveId: string, livreId: string,
): Promise<Map<number, TravailAletheia>> {
  const { data } = await supabase
    .from('aletheia_travaux')
    .select('*')
    .eq('eleve_id', eleveId)
    .eq('scriptorium_livre_id', livreId)
  const m = new Map<number, TravailAletheia>()
  for (const t of (data ?? []) as TravailAletheia[]) m.set(t.semaine_index, t)
  return m
}
