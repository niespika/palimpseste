import type { ModuleIntegrite } from '@/utils/integrite'
import type { ModuleSceau } from '@/components/Pastille'
import type { Jeton } from '@/utils/deroule/balisage'

// Types de vue partagés par la page Intégrité, le volet (fiche élève) et la modale
// (dashboard). Module neutre (sans 'server-only') : importable depuis un composant
// client. `Preuve` est produite côté serveur par utils/integrite-preuve.ts.

export type { ModuleIntegrite }

/**
 * ⭐ C6-L1 — LE SCEAU D'UN MODULE DE SIGNALEMENT, ET `exercices` N'EN A PAS.
 *
 * `Pastille` porte les SIX sceaux de la plateforme, et « les cinq modules » du
 * `01-` §2 n'incluent pas les exercices : un exercice fait à la maison
 * n'appartient à aucun atelier — « l'atelier est un attribut visuel, jamais un
 * interlocuteur différent » (`07-` §4). Il prend donc le sceau de la plateforme
 * elle-même. ⛔ Aucun septième PNG n'est créé pour ça.
 */
export const SCEAU_DU_MODULE: Record<ModuleIntegrite, ModuleSceau> = {
  aletheia: 'aletheia',
  codex: 'codex',
  fragments: 'fragments',
  exercices: 'palimpseste',
}

export interface Preuve {
  photos: string[]            // URLs signées (storage) ; [] si pas de photo
  texte: string | null        // retranscription / texte saisi par l'élève
  surligner: string[]         // sous-chaînes à surligner dans `texte`
  lienAnalyse: string | null  // deep-link vers la page d'analyse du module
  saisieClavier: boolean      // true = module sans photo (Aletheia)
  contexte: string | null     // ex. « dépôt · semaine 24 », « version finale »
  meta: { priseAt: string | null; nbCaracteres: number }
  /**
   * ⭐ 01/09/2026 — L'EXERCICE TEL QUE L'ÉLÈVE L'A VU, pour le seul module
   * `exercices`. Absent (ou `null`) partout ailleurs. Produit par
   * `utils/integrite-preuve.ts`, rendu par `PanneauPreuve`.
   */
  exercice?: PreuveExercice | null
}

/** Une pose de zone, telle que le journal de l'entrée de crédence la garde. */
export interface PoseVue { zone: [number, number] | null; at: string; confirmee: boolean }

/** Un instant daté du dépôt — ouverture, poses, conditions, remises. */
export interface ChronoVue { quoi: string; at: string }

/**
 * Ce que le panneau montre d'un exercice signalé : la consigne et le matériau
 * tels que servis, la zone posée, le passage visé et sa marge, le geste en
 * chiffres, et la chronologie. ⚠️ Tout vient de la base ; rien n'est jugé ici.
 */
export interface PreuveExercice {
  cran: number | null
  lieu: 'classe' | 'maison' | null
  /** La consigne DU CAS concerné, balisée comme sur l'écran élève. */
  consigne: Jeton[]
  /** La phrase que l'élève lisait sous le matériau. */
  avertissement: string
  materiau: string | null
  zone: [number, number] | null
  zoneConfirmee: boolean
  /** L'élève a répondu à la désignation — zone OU « rien à surligner ». */
  designationDonnee: boolean
  poses: PoseVue[]
  /** Le passage visé, dérivé du diff avec la `version_corrigee`. `null` : le défaut est une absence. */
  cible: [number, number] | null
  toleree: [number, number] | null
  /** La part du matériau que la zone prend, en pourcent entier. */
  partMateriau: number | null
  /** Combien de fois la cible, arrondi au dixième. */
  foisLaCible: number | null
  motsCible: number | null
  /** La barre du ratissage, telle que `designation.ts` la fixe : part (0-1) et multiple. */
  barre: { part: number; fois: number }
  credence: number | null
  chrono: ChronoVue[]
  restitution: string | null
  /** « structure élevée · expression moyenne … », déjà composé. */
  confiance: string | null
  conditions: string | null
  collagesBloques: number
  dureeTaguee: string | null
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
