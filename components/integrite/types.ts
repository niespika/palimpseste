import type { ModuleIntegrite } from '@/utils/integrite'

// Types de vue partagés par la page Intégrité, le volet (fiche élève) et la modale
// (dashboard). Module neutre (sans 'server-only') : importable depuis un composant
// client. `Preuve` est produite côté serveur par utils/integrite-preuve.ts.

export type { ModuleIntegrite }

export interface Preuve {
  photos: string[]            // URLs signées (storage) ; [] si pas de photo
  texte: string | null        // retranscription / texte saisi par l'élève
  surligner: string[]         // sous-chaînes à surligner dans `texte`
  lienAnalyse: string | null  // deep-link vers la page d'analyse du module
  saisieClavier: boolean      // true = module sans photo (Aletheia)
  contexte: string | null     // ex. « dépôt · semaine 24 », « version finale »
  meta: { priseAt: string | null; nbCaracteres: number }
}

export interface SignalementVue {
  id: string
  eleveId: string
  eleveNom: string
  moduleSlug: ModuleIntegrite
  moduleLabel: string
  typeSlug: string            // 'vide' | 'aveu_non_travail' | … (logique de surlignage)
  typeLabel: string
  motif: string | null
  source: 'algo' | 'ia'
  enAttente: boolean
  date: string                // « 24 juin 14:02 »
  dateCourt: string           // « 24 juin »
}

export interface BloqueVue { eleveId: string; nom: string; strikes: number }

export interface ParamsVue { actif: boolean; seuil: number; messageStrike: string; messageBloque: string }

// Le signalement sélectionné, enrichi de sa preuve et de l'état d'intégrité de l'élève.
export interface SelectionVue {
  signalement: SignalementVue
  preuve: Preuve
  strikesEleve: number
  seuil: number
  eleveBloque: boolean
}
