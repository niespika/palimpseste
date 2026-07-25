// Enregistre les DEUX hooks de résolution nécessaires aux scripts hors-app :
// celui des tests (imports relatifs sans extension) + celui de la calibration
// (alias `@/…` et marqueur `server-only`). Chargé via
// `node --import ./scripts/register-calibration-resolver.mjs <script.ts>`.
import { register } from 'node:module'

register('./ts-extension-resolver.mjs', import.meta.url)
register('./calibration-resolver.mjs', import.meta.url)
