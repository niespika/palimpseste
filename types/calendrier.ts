// Types du module Calendrier.
//
// Le SEMESTRE est global au prof (table `semesters`), partagé par toutes les
// classes et tous les modules. Il remplace l'ancien fragments_semestres
// (bascule au lot C1b) et ancre Quazian (lot C1c).

export interface Semestre {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
}

export interface Holiday {
  id: string
  semester_id: string
  label: string
  start_date: string
  end_date: string
  created_at: string
}

// Semaine unifiée (évolution de fragments_semaines, ancrage calendaire au lot C2).
// `numero` = ordinal calendaire ; `pedagogical_number` = numéro pédagogique
// (saute les semaines de vacances, null si vacances). Les champs ajoutés au lot
// C2 (end_date, pedagogical_number, is_vacation) sont optionnels tant que la
// migration C2 n'est pas appliquée.
export interface Semaine {
  id: string
  semestre_id: string | null
  numero: number
  pedagogical_number?: number | null
  titre: string | null
  date_debut: string
  end_date?: string | null
  date_limite: string | null
  is_vacation?: boolean
  ouverte: boolean
  created_at: string
}
