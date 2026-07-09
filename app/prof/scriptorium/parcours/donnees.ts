// Chargement des données du builder Parcours (côté serveur, lecture seule).
// Résout chaque créneau vers un affichage (titre, badge, tranche, état dégradé)
// en croisant scriptorium_contenus / scriptorium_unites (livres) / scriptorium_documents.
import { createClient } from '@/utils/supabase/server'

export interface ParcoursListItem {
  id: string
  titre: string
  nbSemaines: number
  nbClasses: number
}

export type EtatCreneau = 'ok' | 'contenu_retire' | 'livre_retire' | 'tranche_a_revoir'

export interface CreneauResolu {
  id: string
  semaine: number
  ordre: number
  refType: 'contenu' | 'livre'
  badge: 'Texte' | 'Cours' | 'Livre'
  titre: string
  trancheLabel: string | null // 'entier' | 'tranche S3→S5' (livre uniquement)
  etat: EtatCreneau
}

export interface ParcoursDetail {
  id: string
  titre: string
  description: string | null
  nbSemaines: number
  creneaux: CreneauResolu[]
}

export interface CibleContenu { id: string; type: 'texte' | 'cours'; titre: string; auteur: string | null }
export interface CibleLivre { id: string; label: string; maxSemaine: number }
export interface CiblesPicker { textes: CibleContenu[]; cours: CibleContenu[]; livres: CibleLivre[] }

// Liste des parcours vivants (+ nombre de classes assignées, pour le sous-titre).
export async function chargerListeParcours(): Promise<ParcoursListItem[]> {
  const supabase = await createClient()
  const [{ data: parcs }, { data: liens }] = await Promise.all([
    supabase.from('scriptorium_parcours').select('id, titre, nb_semaines').is('supprime_at', null).order('titre'),
    supabase.from('scriptorium_parcours_classes').select('parcours_id'),
  ])
  const nbClasses = new Map<string, number>()
  for (const l of liens ?? []) {
    const pid = l.parcours_id as string
    nbClasses.set(pid, (nbClasses.get(pid) ?? 0) + 1)
  }
  return (parcs ?? []).map(p => ({
    id: p.id as string,
    titre: p.titre as string,
    nbSemaines: p.nb_semaines as number,
    nbClasses: nbClasses.get(p.id as string) ?? 0,
  }))
}

// Détail d'un parcours + créneaux résolus. null si introuvable / soft-deleté.
export async function chargerParcoursDetail(parcoursId: string): Promise<ParcoursDetail | null> {
  const supabase = await createClient()
  const { data: parc } = await supabase
    .from('scriptorium_parcours')
    .select('id, titre, description, nb_semaines, supprime_at')
    .eq('id', parcoursId)
    .maybeSingle()
  if (!parc || parc.supprime_at) return null

  const { data: crBruts } = await supabase
    .from('scriptorium_parcours_creneaux')
    .select('id, semaine, ordre, ref_type, contenu_id, livre_id, livre_semaine_debut, livre_semaine_fin, titre_affiche')
    .eq('parcours_id', parcoursId)
    .order('semaine', { ascending: true })
    .order('ordre', { ascending: true })
  const creneauxBruts = (crBruts ?? []) as {
    id: string; semaine: number; ordre: number; ref_type: 'contenu' | 'livre'
    contenu_id: string | null; livre_id: string | null
    livre_semaine_debut: number | null; livre_semaine_fin: number | null; titre_affiche: string | null
  }[]

  const contenuIds = [...new Set(creneauxBruts.filter(c => c.contenu_id).map(c => c.contenu_id as string))]
  const livreIds = [...new Set(creneauxBruts.filter(c => c.livre_id).map(c => c.livre_id as string))]

  // Contenus référencés (supprime_at → état « contenu retiré »).
  const contenuMap = new Map<string, { titre: string; type: 'texte' | 'cours'; supprime: boolean }>()
  if (contenuIds.length) {
    const { data } = await supabase.from('scriptorium_contenus').select('id, titre, type, supprime_at').in('id', contenuIds)
    for (const c of data ?? []) {
      contenuMap.set(c.id as string, { titre: c.titre as string, type: c.type as 'texte' | 'cours', supprime: c.supprime_at != null })
    }
  }

  // Livres référencés (label + supprime_at) et leur étendue réelle (max semaine).
  const livreMap = new Map<string, { label: string; supprime: boolean }>()
  const livreMax = new Map<string, number>()
  if (livreIds.length) {
    const [{ data: livres }, { data: docs }] = await Promise.all([
      supabase.from('scriptorium_unites').select('id, label, supprime_at').in('id', livreIds),
      supabase.from('scriptorium_documents').select('unite_id, semaine').in('unite_id', livreIds).not('semaine', 'is', null),
    ])
    for (const l of livres ?? []) livreMap.set(l.id as string, { label: l.label as string, supprime: l.supprime_at != null })
    for (const d of docs ?? []) {
      const id = d.unite_id as string
      livreMax.set(id, Math.max(livreMax.get(id) ?? 0, d.semaine as number))
    }
  }

  const creneaux: CreneauResolu[] = creneauxBruts.map(c => {
    if (c.ref_type === 'contenu') {
      const info = c.contenu_id ? contenuMap.get(c.contenu_id) : undefined
      const retire = !info || info.supprime
      return {
        id: c.id, semaine: c.semaine, ordre: c.ordre, refType: 'contenu',
        badge: info?.type === 'texte' ? 'Texte' : 'Cours',
        titre: retire ? (c.titre_affiche || 'contenu retiré') : info!.titre,
        trancheLabel: null,
        etat: retire ? 'contenu_retire' : 'ok',
      }
    }
    const info = c.livre_id ? livreMap.get(c.livre_id) : undefined
    const retire = !info || info.supprime
    const entier = c.livre_semaine_debut == null || c.livre_semaine_fin == null
    const maxSem = c.livre_id ? (livreMax.get(c.livre_id) ?? 0) : 0
    const trancheHorsEtendue = !entier && ((c.livre_semaine_fin as number) > maxSem || (c.livre_semaine_debut as number) < 1)
    const etat: EtatCreneau = retire ? 'livre_retire' : trancheHorsEtendue ? 'tranche_a_revoir' : 'ok'
    return {
      id: c.id, semaine: c.semaine, ordre: c.ordre, refType: 'livre',
      badge: 'Livre',
      titre: retire ? (c.titre_affiche || 'livre retiré') : info!.label,
      trancheLabel: entier ? 'entier' : `tranche S${c.livre_semaine_debut}→S${c.livre_semaine_fin}`,
      etat,
    }
  })

  return {
    id: parc.id as string,
    titre: parc.titre as string,
    description: (parc.description as string | null) ?? null,
    nbSemaines: parc.nb_semaines as number,
    creneaux,
  }
}

// Cibles du picker « + Ajouter » : textes, cours, livres (avec leur nb de semaines).
export async function chargerCiblesPicker(): Promise<CiblesPicker> {
  const supabase = await createClient()
  const [{ data: contenus }, { data: livres }, { data: docs }] = await Promise.all([
    supabase.from('scriptorium_contenus').select('id, type, titre, auteur').is('supprime_at', null).order('titre'),
    supabase.from('scriptorium_unites').select('id, label').eq('type', 'livre').is('supprime_at', null).order('label'),
    supabase.from('scriptorium_documents').select('unite_id, semaine').not('semaine', 'is', null),
  ])
  const maxParLivre = new Map<string, number>()
  for (const d of docs ?? []) {
    const id = d.unite_id as string
    maxParLivre.set(id, Math.max(maxParLivre.get(id) ?? 0, d.semaine as number))
  }
  const cont = (contenus ?? []) as { id: string; type: 'texte' | 'cours'; titre: string; auteur: string | null }[]
  return {
    textes: cont.filter(c => c.type === 'texte').map(c => ({ id: c.id, type: 'texte' as const, titre: c.titre, auteur: c.auteur })),
    cours: cont.filter(c => c.type === 'cours').map(c => ({ id: c.id, type: 'cours' as const, titre: c.titre, auteur: c.auteur })),
    livres: (livres ?? []).map(l => ({ id: l.id as string, label: l.label as string, maxSemaine: maxParLivre.get(l.id as string) ?? 0 })),
  }
}

export interface ParcoursDeClasse { id: string; titre: string; nbSemaines: number; dateDebut: string | null }

// Parcours (vivants) assignés à une classe donnée, avec leur date de début pour cette
// classe. Sert à afficher les parcours dans la vue « Par classe » du Scriptorium.
export async function chargerParcoursDeClasse(classeId: string): Promise<ParcoursDeClasse[]> {
  const supabase = await createClient()
  const { data: liens } = await supabase
    .from('scriptorium_parcours_classes')
    .select('parcours_id, date_debut')
    .eq('classe_id', classeId)
  const ids = [...new Set((liens ?? []).map(l => l.parcours_id as string))]
  if (!ids.length) return []
  const dateParParcours = new Map<string, string | null>()
  for (const l of liens ?? []) dateParParcours.set(l.parcours_id as string, (l.date_debut as string | null) ?? null)

  const { data: parcs } = await supabase
    .from('scriptorium_parcours')
    .select('id, titre, nb_semaines')
    .in('id', ids)
    .is('supprime_at', null)
    .order('titre')
  return (parcs ?? []).map(p => ({
    id: p.id as string,
    titre: p.titre as string,
    nbSemaines: p.nb_semaines as number,
    dateDebut: dateParParcours.get(p.id as string) ?? null,
  }))
}
