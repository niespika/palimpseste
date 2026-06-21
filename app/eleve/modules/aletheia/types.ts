// Types partagés du module Aletheia (côté élève).

export type StatutAletheia =
  | 'DRAFT'
  | 'V1_SUBMITTED'
  | 'FEEDBACK1_READY'
  | 'VF_SUBMITTED'
  | 'FEEDBACK2_READY'
  | 'DONE'

// Sortie du retour 1 (socratique) — cf. aletheia-spec §5.1.
export interface Retour1 {
  questions_pour_avancer: string[]
  reponses_a_tes_questions: string[]
  remarque_questions?: string | null
}

// Sortie du retour 2 (reconstruction + architecture) — cf. aletheia-spec §5.2.
export interface Retour2 {
  synthese_modele: string
  nuances_et_erreurs: string[]
  ajouts_a_verifier: string[]
  architecture_amont: string[]
  architecture_aval_jalons: string[]
}

// Extrait persisté du retour 2 (mémoire + matière du capstone).
export interface Devoilement {
  architecture_amont: string[]
  architecture_aval_jalons: string[]
}

export interface TravailAletheia {
  id: string
  scriptorium_livre_id: string
  semaine_index: number
  eleve_id: string
  statut: StatutAletheia
  resume_initial: string | null
  questions: string[]
  retour_1: Retour1 | null
  resume_vf: string | null
  retour_1_erreur_at: string | null
  retour_2: Retour2 | null
  retour_2_erreur_at: string | null
  retour_2_lu_at: string | null
  devoilement: Devoilement | null
  created_at: string
  updated_at: string
}

// Une semaine de planning (lecture seule, SANS PDF).
export interface SemaineLivre {
  semaine: number
  titre: string
  chapitres: string | null
  dateIndicative: string // « JJ/MM/AAAA »
}

export interface LivreAletheia {
  id: string
  titre: string
  date_debut: string | null
  nb_semaines: number | null
  semaines: SemaineLivre[]
}
