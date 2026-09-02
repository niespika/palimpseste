// Hook de résolution ESM, réservé aux scripts de recette qui importent du code
// applicatif lisant `next/navigation`, `next/cache`… : Next n'expose pas de champ
// `exports`, et le résolveur ESM de Node n'ajoute pas `.js` à un sous-chemin de
// paquet. On complète l'extension quand le fichier existe — rien d'autre.
import { existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve as resolvePath } from 'node:path'

const RACINE = resolvePath(dirname(fileURLToPath(import.meta.url)), '..', '..')
const estFichier = (p) => existsSync(p) && statSync(p).isFile()

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('next/') && !/\.[cm]?js$/.test(specifier)) {
    const p = join(RACINE, 'node_modules', specifier + '.js')
    if (estFichier(p)) return nextResolve(pathToFileURL(p).href, context)
  }
  return nextResolve(specifier, context)
}
