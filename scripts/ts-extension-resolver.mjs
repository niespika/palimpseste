// Hook de résolution ESM : autorise les imports relatifs SANS extension (`./x`)
// à résoudre vers `./x.ts` / `./x.tsx` / `./x/index.ts`. Node 24 strippe déjà
// les types TS nativement, mais son résolveur ESM n'ajoute pas l'extension .ts.
// Ce hook comble uniquement ce manque, pour exécuter les tests unitaires (fichiers
// *.test.ts) sans dépendance (pas de vitest/tsx/jest). Aucun effet sur le build
// Next (qui a son propre résolveur) : ce hook n'est chargé que par `npm test`.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const EXTS = ['.ts', '.tsx', '/index.ts', '/index.tsx']

export async function resolve(specifier, context, nextResolve) {
  const estRelatif = specifier.startsWith('./') || specifier.startsWith('../')
  const aDejaExtension = /\.[cm]?[jt]sx?$/.test(specifier)
  if (estRelatif && !aDejaExtension && context.parentURL) {
    for (const ext of EXTS) {
      const url = new URL(specifier + ext, context.parentURL)
      if (existsSync(fileURLToPath(url))) {
        return nextResolve(specifier + ext, context)
      }
    }
  }
  return nextResolve(specifier, context)
}
