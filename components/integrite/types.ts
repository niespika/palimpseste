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
  statut?: 'en_attente' | 'confirme' | 'rejete'  // pour les badges de l'historique
  date: string                // « 24 juin 14:02 »
  dateCourt: string           // « 24 juin »
}

export interface BloqueVue { eleveId: string; nom: string; strikes: number }

export interface ParamsVue { actif: boolean; seuil: number; messageStrike: string; messageBloque: string }

// ── Historique (onglet « Historique » prof + page élève /eleve/integrite) ──────

// Un événement daté du journal d'intégrité (strike / blocage / déblocage). La
// phrase lisible est composée côté composant (le prof et l'élève la formulent
// différemment). Source du journal : integrite_evenements (cf. SQL).
export interface EvenementVue {
  id: string
  type: 'strike' | 'blocage' | 'deblocage'
  source: string | null            // 'algo' | 'ia' | 'manuel' | 'auto'
  moduleSlug: ModuleIntegrite | null
  moduleLabel: string | null
  motif: string | null
  strikesApres: number | null
  date: string                     // « 24 juin 14:02 »
  dateCourt: string                // « 24 juin »
}

// Une ligne du tableau récapitulatif prof (un élève ayant un historique).
export interface HistoriqueLigne {
  eleveId: string
  nom: string
  classes: string                  // libellé court des classes (« 1reB » ou « — »)
  confirmes: number                // avis retenus (strikes réels)
  ecartes: number                  // signaux IA écartés (faux positifs)
  enAttente: number                // signaux IA en attente de décision
  deblocages: number               // nb de fois débloqué (événements 'deblocage')
  strikes: number                  // strikes courants
  seuil: number
  bloque: boolean
  dernier: string | null           // date ISO du dernier avis (tri)
  dernierCourt: string | null      // date du dernier avis (affichage)
}

// Le dossier complet d'un élève (détail du tableau prof, master-detail via ?eleve=).
// La liste d'avis est LÉGÈRE (sans preuve) ; la preuve est chargée à la demande au
// clic (server action chargerPreuveAvisAction) pour éviter un N+1 au rendu.
export interface DossierVue {
  eleveId: string
  nom: string
  strikes: number
  seuil: number
  bloque: boolean
  confirmes: number
  ecartes: number
  deblocages: number
  avis: SignalementVue[]           // tous les avis (tous statuts), métadonnées seules
  evenements: EvenementVue[]       // chronologie (récent → ancien)
}

// Un avis côté élève : métadonnées + contexte (« semaine 24 · version finale »),
// SANS preuve (ni photos signées, ni deep-link prof) — l'élève n'en a pas besoin.
export interface AvisEleve {
  signalement: SignalementVue
  contexte: string | null
}

// Le signalement sélectionné, enrichi de sa preuve et de l'état d'intégrité de l'élève.
export interface SelectionVue {
  signalement: SignalementVue
  preuve: Preuve
  strikesEleve: number
  seuil: number
  eleveBloque: boolean
  tz: string                  // fuseau d'affichage (horodatages de la preuve, ex. photo)
}
