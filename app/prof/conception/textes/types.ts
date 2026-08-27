// ============================================================================
// C5 · L1 — Les types de l'écran des textes.
// ----------------------------------------------------------------------------
// ⛔⛔ POURQUOI CE FICHIER EXISTE, ET POURQUOI IL N'EST PAS DANS `actions.ts` :
//    un module `'use server'` NE PEUT EXPORTER QUE DES FONCTIONS ASYNC. Un type
//    ré-exporté depuis un tel fichier TUE TOUT LE MODULE à l'exécution —
//    `ReferenceError: … is not defined` —, et ni `tsc`, ni `npm test`, ni les
//    recettes ne le voient : seule une action déclenchée à l'écran échoue
//    (C4-L7, `app/deroule/actions.ts`, 24/08). Les types se lisent donc À LEUR
//    SOURCE, et leur source est ici.
// ============================================================================

/** Ce qu'une action de cet écran rend au formulaire qui l'a appelée. */
export interface RetourTexte {
  ok: boolean
  message: string
  /** Ce qui a empêché — motifs de refus du contrôle, erreurs SQL, blocages. */
  empechements?: string[]
  /** Ce qui s'est passé sans rien empêcher : signalements, appels, coût. */
  notes?: string[]
  /** La référence engendrée, quand il y en a une — pour aller la lire. */
  referenceId?: string
}

/** Une ligne de la liste des textes, telle que l'écran la lit. */
export interface LigneTexte {
  id: string
  idImport: string
  libelle: string
  reference: string
  /** `aucune` · `deposee` (engendrée, pas encore validée) · `validee`. */
  etatReference: 'aucune' | 'deposee' | 'validee'
  referenceId: string | null
  statut: string
  bloque: boolean
  /** La borne d'amont que toute instance bâtie dessus portera, en clair. */
  borne: string
  /** Le texte, pour la sélection et pour dire ce qu'il pèse. */
  motsDuTexte: number
  phrasesDuTexte: number
}

/** Un contenu du Scriptorium de type `texte` qui n'a pas encore d'identité de
 *  fabrique — LE PONT que le lot ouvre : « jamais une seconde table de textes ». */
export interface ContenuAAdopter {
  id: string
  titre: string
  auteur: string
  motsDuTexte: number
}
