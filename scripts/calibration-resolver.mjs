// Hook de résolution ESM COMPLÉMENTAIRE, réservé aux scripts hors-app (banc de
// calibration RAG — scriptorium_calibration/scripts/calibration-rag.ts). Le hook
// des tests (ts-extension-resolver.mjs) ne couvre que les imports RELATIFS sans
// extension ; le code applicatif importé par le banc a deux besoins de plus :
//   • l'alias `@/…` du tsconfig (paths { "@/*": ["./*"] }) — résolu ici vers la
//     racine du dépôt, avec la même liste d'extensions ;
//   • le marqueur `server-only` (importé par utils/ia-fournisseur, cout-api,
//     scriptorium-rag) : le paquet n'est pas au premier niveau de node_modules
//     (Next l'aliase depuis next/dist/compiled) et son entrée `default` LÈVE une
//     erreur. On le résout donc vers son propre `empty.js` — exactement ce que
//     fait la condition `react-server` côté Next. Aucun effet sur l'app ni sur
//     `npm test` : ce hook n'est chargé que par register-calibration-resolver.mjs.
import { existsSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve as resolvePath } from 'node:path'

const RACINE = resolvePath(dirname(fileURLToPath(import.meta.url)), '..')
const EXTS = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx']
const SERVER_ONLY_VIDE = join(RACINE, 'node_modules/next/dist/compiled/server-only/empty.js')

const estFichier = (p) => existsSync(p) && statSync(p).isFile()

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only' && estFichier(SERVER_ONLY_VIDE)) {
    return nextResolve(pathToFileURL(SERVER_ONLY_VIDE).href, context)
  }
  if (specifier.startsWith('@/')) {
    const base = join(RACINE, specifier.slice(2))
    for (const ext of EXTS) {
      if (estFichier(base + ext)) return nextResolve(pathToFileURL(base + ext).href, context)
    }
  }
  return nextResolve(specifier, context)
}
