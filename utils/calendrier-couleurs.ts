// Couleur d'affichage d'une classe sur le calendrier. Si la classe n'a pas de
// couleur définie (classes.couleur null), on assigne une couleur de palette par
// position (ordre stable = par nom) pour que chaque classe ait une teinte.

// Palette « 12 teintes accordées » (parchemin). Étend l'ancienne palette de 7 :
// les 7 premières teintes sont inchangées (les classes sans couleur enregistrée
// gardent leur teinte), les 5 dernières évitent le re-bouclage au-delà de 7 classes.
export const PALETTE_CLASSES = [
  '#7C9CBF', '#C08552', '#7FA67F', '#B07FA6', '#C0A35E', '#6FA8A8',
  '#B5736B', '#5C8A9E', '#8B9556', '#9C7BB5', '#C77E9E', '#7E7EB8',
]

export function couleursParClasse(
  classes: { id: string; couleur: string | null }[]
): Map<string, string> {
  const m = new Map<string, string>()
  classes.forEach((c, i) => m.set(c.id, c.couleur ?? PALETTE_CLASSES[i % PALETTE_CLASSES.length]))
  return m
}
