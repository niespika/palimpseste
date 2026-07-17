// Libellé d'affichage d'une session Codex — BI-SOURCE (§6.2). La session est ancrée
// SOIT à une unité (bras historique, `scriptorium_unites.label`) SOIT à un cours de
// bibliothèque (bras parcours, `scriptorium_contenus.titre`). Chaque relation arrive
// en objet OU en tableau selon la jointure Supabase. Vide si aucune (ne devrait pas
// arriver — l'arc est exclusif mais toujours non-vide). `scriptorium_contenus` étant
// en RLS prof-only, un site sur client ÉLÈVE doit résoudre le titre du cours via le
// client admin côté serveur (page synthèse élève) — ce helper reste agnostique.

// Accepte les relations Supabase brutes (objet | tableau | null) sans cast à l'appel.
export function libelleSession(unite: unknown, contenu: unknown): string {
  const u = (Array.isArray(unite) ? unite[0] : unite) as { label?: string } | null | undefined
  const c = (Array.isArray(contenu) ? contenu[0] : contenu) as { titre?: string } | null | undefined
  return u?.label ?? c?.titre ?? ''
}
