import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

test('audit Aletheia : générations, diagnostics, exposition, restauration et synthèse', () => {
  // Le harnais exécute les fonctions du dépôt ; seuls les I/O et les hooks sont
  // simulés. La recette PostgreSQL distincte éprouve les verrous de la migration.
  execFileSync(process.execPath, ['scripts/recette/audit-aletheia-2026-09-08.cjs'], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), stdio: 'pipe', timeout: 30000,
  })
})

test('prompts Aletheia : formats, tournantes, fragment choisi, référence et exposition', () => {
  execFileSync(process.execPath, ['scripts/recette/audit-prompts-aletheia-2026-09-08.cjs'], {
    cwd: fileURLToPath(new URL('../../', import.meta.url)), stdio: 'pipe', timeout: 30000,
  })
})
