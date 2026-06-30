// Types partagés du module Aletheia (côté élève).

export type StatutAletheia =
  | 'DRAFT'
  | 'V1_SUBMITTED'
  | 'FEEDBACK1_READY'
  | 'VF_SUBMITTED'
  | 'FEEDBACK2_READY'
  | 'DONE'

// Une définition de vocabulaire produite par le retour V1 (affichée + routée vers
// Quazian comme carte personnelle).
export interface DefinitionVocabulaire {
  terme: string
  definition: string
}

// Sortie du retour V1 — socratique, par section (SPEC §2.1). Un seul appel IA,
// traitement spécifique par champ.
export interface RetourV1 {
  // Thèse + Arguments : relances socratiques (questions renvoyant à un passage),
  // priorisées et plafonnées (ergonomie ado). On ne corrige pas, on questionne.
  relances: string[]
  // Accord : révélateur de compréhension — vérifie la lecture puis pousse à
  // nuancer/justifier. Pas de recherche d'objection. Court.
  accord: string | null
  // Questions de l'élève : réponses claires, ancrées dans le texte.
  reponses_questions: string[]
  // Vocabulaire : définitions ancrées et accessibles (affichées + cartes Quazian).
  vocabulaire: DefinitionVocabulaire[]
  // Remarque optionnelle sur la qualité des questions (masquée sauf toggle Lot 6 B).
  remarque_questions: string | null
}

// Un ajout repéré dans la VF (au-delà de corriger) vérifié contre le livre.
// `ancre` = l'ajout est étayé par le texte ; sinon affirmation non ancrée/fausse.
export interface AjoutVerifie {
  extrait: string
  ancre: boolean
  note: string
}

// Sortie du retour VF — reconstruction + architecture (SPEC §2.2).
export interface RetourVF {
  synthese_modele: string          // ≤ ~200 mots, lisible d'un trait
  ajouts_verifies: AjoutVerifie[]  // ajouts de la VF surlignés (façon Codex)
  nuances_et_erreurs: string[]
  architecture_amont: string[]
  architecture_aval_jalons: string[]
}

// Extrait persisté du retour VF (mémoire + continuité des retours suivants).
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
  // Saisie V1 — 5 champs.
  these: string | null
  arguments: string | null
  accord: string | null
  questions: string[]
  vocabulaire: string[]
  // Saisie VF — 3 champs retravaillés.
  these_vf: string | null
  arguments_vf: string | null
  accord_vf: string | null
  // Retours IA.
  retour_v1: RetourV1 | null
  retour_vf: RetourVF | null
  retour_v1_erreur_at: string | null
  retour_vf_erreur_at: string | null
  retour_vf_lu_at: string | null
  devoilement: Devoilement | null
  created_at: string
  updated_at: string
}

// Capstone : carte d'architecture finale du LIVRE (partagée, canonique).
export type CapstoneStatut = 'PENDING' | 'READY' | 'ERROR'

export interface CapstoneNoeud { chapitre: string; idee: string }
export interface CapstoneLien { de: string; vers: string; relation: string }
export interface Capstone {
  fil_conducteur: string
  noeuds: CapstoneNoeud[]
  liens: CapstoneLien[]
}

export interface CapstoneRow {
  statut: CapstoneStatut
  contenu: Capstone | null
}

// Vue prof de la carte : éditable + marquée si amendée à la main (anti-écrasement).
export interface CapstoneProf extends CapstoneRow {
  amende_par_prof: boolean
  updated_at: string | null
}

// ── Référence par chapitre (socle du diagnostic, généré au niveau livre) ──────
export interface ReferenceChapitre {
  semaine: number
  titre: string
  these_canonique: string
  arguments_cles: string[]
}
export type ReferenceStatut = 'PENDING' | 'READY' | 'ERROR'
export interface LivreReference {
  statut: ReferenceStatut
  contenu: ReferenceChapitre[] | null
}
// Vue prof de la référence : éditable + marquée si amendée à la main.
export interface LivreReferenceProf extends LivreReference {
  amende_par_prof: boolean
  updated_at: string | null
}

// ── Diagnostic de compréhension (PROF-ONLY, jamais montré à l'élève) ──────────
// Phase 1 (anti-halo) : inventaire ancré au texte, sans juger.
export interface InventaireDiagnostic {
  these_eleve: string
  arguments_captes: string[]
  arguments_rates: string[]
  arguments_deformes: string[]
  these_mal_definie: boolean
  note: string
}
// Phase 2 : niveaux E→A (0-4, cf. utils/notation.ts) depuis l'inventaire seul.
export interface NiveauxDiagnostic {
  niveau_these: number | null
  niveau_arguments: number | null
  these_mal_definie: boolean
}
// Une ligne de diagnostic (V1 + VF → delta), telle que stockée/lue côté prof.
export interface DiagnosticTravail {
  travail_id: string
  eleve_id: string
  semaine_index: number
  inventaire_v1: InventaireDiagnostic | null
  niveau_these_v1: number | null
  niveau_arguments_v1: number | null
  these_mal_definie_v1: boolean | null
  inventaire_vf: InventaireDiagnostic | null
  niveau_these_vf: number | null
  niveau_arguments_vf: number | null
  these_mal_definie_vf: boolean | null
  erreur_at: string | null
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
  auteur: string | null
  date_debut: string | null
  nb_semaines: number | null
  semaines: SemaineLivre[]
}
