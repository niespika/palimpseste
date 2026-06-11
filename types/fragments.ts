export type StatutDepot = 'depose' | 'en_retard'

export interface FragmentTheme {
  id: string
  eleve_id: string
  theme: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface FragmentSemaine {
  id: string
  numero: number
  titre: string | null
  date_debut: string
  date_limite: string
  ouverte: boolean
  created_at: string
}

export interface FragmentDepot {
  id: string
  eleve_id: string
  semaine_id: string
  statut: StatutDepot
  commentaire_eleve: string | null
  created_at: string
  updated_at: string
}

export interface FragmentPhoto {
  id: string
  depot_id: string
  storage_path: string
  ordre: number
  created_at: string
}

export interface DepotAvecPhotos extends FragmentDepot {
  photos: FragmentPhoto[]
}

export interface EleveAvecDepot {
  id: string
  display_name: string
  classe: string | null
  depot: DepotAvecPhotos | null
}
