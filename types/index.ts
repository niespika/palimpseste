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

export interface ModuleAssignment {
  id: string
  eleve_id: string
  module_id: string
  created_at: string
}

export interface EleveAvecEmail extends Profile {
  email: string
  modules_assignes: { module_id: string; modules: { nom: string } }[]
}
