// ============================================================================
// LE NOM AFFICHÉ D'UN MODULE — quand l'écran ne doit pas dire ce que la base dit.
// ----------------------------------------------------------------------------
// Décision de Louis (03/09/2026) : le module « Fragments d'Érudition » s'appelle
// VESTIGIA à l'écran — « ça colle avec la logique des autres noms de module ».
// Ce que les élèves rendent reste un « fragment d'érudition » ; c'est le MONDE
// qui change de nom. La base (`modules.nom`, le slug `fragments-erudition`, les
// tables `fragments_*`) ne bouge pas : « pas la peine de le faire en base ».
// Toute lecture de `modules.nom` destinée à l'écran passe donc par ici.
// ============================================================================

const NOM_AFFICHE: Record<string, string> = {
  'fragments-erudition': 'Vestigia',
}

/** Le nom à afficher pour un module, à partir de son slug ; `repli` = `modules.nom`. */
export function nomDuModule(slug: string, repli: string): string {
  return NOM_AFFICHE[slug] ?? repli
}
