export type StatutDepot = 'depose' | 'en_retard'
export type StatutAnalyse = 'en_cours' | 'generee' | 'erreur' | 'publiee'
export type StatutPiste = 'proposee' | 'suivie' | 'partiellement_suivie' | 'abandonnee'

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

export interface FragmentAnalyse {
  id: string
  depot_id: string
  statut: StatutAnalyse
  transcription: string | null
  note_decouvertes: number | null
  note_sources: number | null
  note_reflexions: number | null
  retour_progres: string | null
  retour_langue: string | null
  retour_style: string | null
  retour_contenu: string | null
  commentaire_general: string | null
  notes_prof: string | null
  modifie_par_prof: boolean
  cout_api: number | null
  created_at: string
  updated_at: string
  publiee_at: string | null
}

export interface FragmentPiste {
  id: string
  analyse_id: string
  eleve_id: string
  contenu: string
  statut: StatutPiste
  est_rappel: boolean
  created_at: string
  updated_at: string
}

export interface FragmentConfig {
  id: number
  prompt_evaluation: string
  bareme: string
  updated_at: string
}

export interface AnalyseResumee {
  id: string
  depot_id: string
  statut: StatutAnalyse
  note_decouvertes: number | null
  note_sources: number | null
  note_reflexions: number | null
}

export interface EleveAvecDepot {
  id: string
  display_name: string
  classe: string | null
  depot: DepotAvecPhotos | null
  analyse: AnalyseResumee | null
}
