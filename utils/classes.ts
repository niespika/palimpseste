// ----------------------------------------------------------------------------
// Présentation des classes — libellés partagés (dashboard, index classes,
// page Pilotage). Source unique pour éviter de redéfinir NIVEAU_LABEL / le
// sous-titre à plusieurs endroits.
// ----------------------------------------------------------------------------

export const NIVEAU_LABEL: Record<string, string> = { '1ere': 'Première', terminale: 'Terminale' }

export interface ClasseMeta {
  niveau: string | null
  filiere: string | null
  annee_scolaire: string
}

/** « Terminale · HLP · 2025-26 » (segments vides ignorés). */
export function sousTitreClasse(c: ClasseMeta): string {
  return [c.niveau ? NIVEAU_LABEL[c.niveau] ?? c.niveau : null, c.filiere, c.annee_scolaire]
    .filter(Boolean)
    .join(' · ')
}
