// Génération de mot de passe aléatoire — isomorphe (Web Crypto, dispo côté Node
// 18+ et navigateur). Sert à amorcer les comptes importés en masse et à alimenter
// le bouton « Générer » du formulaire d'ajout manuel.

const MINUSCULES = 'abcdefghijkmnpqrstuvwxyz' // sans l/o (lisibilité)
const MAJUSCULES = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // sans I/O
const CHIFFRES = '23456789' // sans 0/1

// Indice aléatoire non biaisé dans [0, max) via rejection sampling.
function indexAleatoire(max: number): number {
  const limite = Math.floor(0xffffffff / max) * max
  const buf = new Uint32Array(1)
  let x = 0
  do {
    globalThis.crypto.getRandomValues(buf)
    x = buf[0]
  } while (x >= limite)
  return x % max
}

function piocher(jeu: string): string {
  return jeu[indexAleatoire(jeu.length)]
}

/**
 * Mot de passe d'au moins `longueur` caractères, garantissant ≥1 minuscule,
 * ≥1 majuscule et ≥1 chiffre. Par défaut 15 caractères.
 */
export function genererMotDePasse(longueur = 15): string {
  const taille = Math.max(longueur, 3)
  const tous = MINUSCULES + MAJUSCULES + CHIFFRES

  // Garantir au moins un de chaque catégorie.
  const chars: string[] = [piocher(MINUSCULES), piocher(MAJUSCULES), piocher(CHIFFRES)]
  while (chars.length < taille) {
    chars.push(piocher(tous))
  }

  // Mélange de Fisher–Yates pour ne pas figer la position des 3 garantis.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = indexAleatoire(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  return chars.join('')
}
