// ----------------------------------------------------------------------------
// Valeurs du contexte de classe élève partagées par les DEUX bords : le
// résolveur serveur (`contexte-classe.ts`, marqué `server-only`) et le
// commutateur, qui est un composant client. Ce fichier n'a donc volontairement
// aucun import serveur — y ajouter `cookies()` ou un client Supabase ferait
// repasser tout le module dans le bundle client (C7·L2).
// ----------------------------------------------------------------------------

export const COOKIE_CLASSE_ELEVE = 'eleve_classe'

/** Valeur de cookie du troisième état du commutateur. Jamais un id d'inscription (uuid). */
export const VALEUR_TOUTES = 'toutes'

export interface InscriptionEleve {
  id: string
  classe_id: string
  classe_nom: string
}
