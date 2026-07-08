// Enregistre le hook de résolution TS (voir ts-extension-resolver.mjs) pour les
// tests unitaires. Chargé via `node --import ./scripts/register-ts-resolver.mjs`.
import { register } from 'node:module'

register('./ts-extension-resolver.mjs', import.meta.url)
