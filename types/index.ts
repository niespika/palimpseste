export type Role = 'prof' | 'eleve'

export interface Profile {
  id: string
  role: Role
  display_name: string
  classe: string | null
  created_at: string
}

export interface Module {
  id: string
  slug: string
  nom: string
  description: string | null
  actif: boolean
  created_at: string
}

export interface Classe {
  id: string
  nom: string
  niveau: string | null
  filiere: string | null
  annee_scolaire: string
  statut: 'active' | 'fermee'
  couleur: string | null
  created_at: string
}

export interface Inscription {
  id: string
  eleve_id: string
  classe_id: string
  statut: 'active' | 'retiree'
  created_at: string
}

export interface EleveAvecEmail extends Profile {
  email: string
  // Classes (via inscriptions actives) auxquelles l'élève appartient.
  classes: { id: string; nom: string }[]
  // Vrai si le compte ne s'est jamais connecté (dérivé de auth.last_sign_in_at).
  jamaisConnecte?: boolean
}
