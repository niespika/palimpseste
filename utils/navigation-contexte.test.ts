import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('navigation : cache et gardes éprouvés dans de vrais rendus React serveur', () => {
  // La condition est limitée au sous-processus pour ne pas modifier React pour
  // les tests de composants client du reste de la suite.
  execFileSync(process.execPath, ['--conditions=react-server', '--test',
    fileURLToPath(new URL('../scripts/recette/fixtures/contexte-navigation.mjs', import.meta.url))],
  { timeout: 30_000, stdio: 'pipe' })
})
