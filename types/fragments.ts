export type StatutDepot = 'depose' | 'en_retard'
export type StatutAnalyse = 'en_cours' | 'generee' | 'erreur' | 'publiee'
export type StatutPiste = 'proposee' | 'suivie' | 'partiellement_suivie' | 'abandonnee'

export interface FragmentTheme {
  id: string
  eleve_id: string
  inscription_id: string | null
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
  inscription_id: string | null
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

export type StatutPresentation = 'tire' | 'presente' | 'reporte'
export type StatutOral = 'enregistre' | 'transcrit' | 'analyse' | 'erreur' | 'publie'

export interface FragmentOral {
  id: string
  presentation_id: string
  eleve_id: string
  inscription_id: string | null
  storage_path: string | null
  transcription: string | null
  duree_secondes: number | null
  nb_mots: number | null
  debit_mots_minute: number | null
  statut: StatutOral
  audio_supprime: boolean
  created_at: string
  updated_at: string
}

export interface FragmentAnalyseOrale {
  id: string
  oral_id: string
  retour_integration: string | null
  retour_pistes: string | null
  retour_completude: string | null
  retour_oral: string | null
  commentaire_general: string | null
  note_contenu: number | null
  note_structure: number | null
  note_expression: number | null
  notes_prof: string | null
  modifie_par_prof: boolean
  created_at: string
  updated_at: string
  publiee_at: string | null
}

export interface FragmentPresentation {
  id: string
  eleve_id: string
  inscription_id: string | null
  semaine_id: string
  statut: StatutPresentation
  created_at: string
}

// ── Étape 6 : Essai final ──────────────────────────────────────────────────

export type StatutEssaiAnalyse = 'en_cours' | 'generee' | 'erreur' | 'publiee'
export type StatutSynthese = 'en_cours' | 'generee' | 'erreur' | 'publiee'
export type LettreLettres = 'A' | 'B' | 'C' | 'D' | 'E'

export interface EssaiEpreuve {
  id: string
  titre: string
  date_epreuve: string
  duree_minutes: number
  consignes: string | null
  depots_ouverts: boolean
  created_at: string
}

export interface Essai {
  id: string
  epreuve_id: string
  eleve_id: string
  inscription_id: string | null
  depose_par: 'eleve' | 'prof'
  created_at: string
  updated_at: string
}

export interface EssaiPhoto {
  id: string
  essai_id: string
  storage_path: string
  ordre: number
  created_at: string
}

export interface EssaiAnalyse {
  id: string
  essai_id: string
  eleve_id: string
  statut: StatutEssaiAnalyse
  transcription: string | null
  lettre_structure: LettreLettres | null
  lettre_expression: LettreLettres | null
  lettre_argumentation: LettreLettres | null
  lettre_connaissances: LettreLettres | null
  retour_structure: string | null
  retour_expression: string | null
  retour_argumentation: string | null
  retour_connaissances: string | null
  retour_parcours: string | null
  synthese: string | null
  notes_prof: string | null
  modifie_par_prof: boolean
  cout_api: number | null
  note20_suggeree: number | null
  note20_min: number | null
  note20_max: number | null
  note20_justification: string | null
  note20_validee: number | null
  note_visible_eleve: boolean
  created_at: string
  updated_at: string
  publiee_at: string | null
}

export interface FragmentSemestre {
  id: string
  label: string
  date_debut: string
  date_fin: string
  created_at: string
}

export interface FragmentSynthese {
  id: string
  eleve_id: string
  inscription_id: string | null
  semestre_id: string
  statut: StatutSynthese
  synthese: string | null
  points_forts: string | null
  axes_progres: string | null
  note20_suggeree: number | null
  note20_min: number | null
  note20_max: number | null
  note20_justification: string | null
  note20_validee: number | null
  notes_prof: string | null
  note_visible_eleve: boolean
  perimetre: unknown | null
  cout_api: number | null
  created_at: string
  updated_at: string
  publiee_at: string | null
}

export interface EleveAvecDepot {
  id: string
  display_name: string
  classe: string | null
  depot: DepotAvecPhotos | null
  analyse: AnalyseResumee | null
}

/** Item du sélecteur de contexte classe côté élève (une inscription active). */
export interface InscriptionContexte {
  id: string
  classe_id: string
  classe_nom: string
}
