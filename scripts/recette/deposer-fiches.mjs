// Preuve du premier écran : le dépôt des sept fiches et la pose d'un statut,
// par le MÊME parseur et les MÊMES fonctions serveur que l'écran.
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })
const { lireFiche } = await import('/Users/louissagnieres/Documents/GitHub/palimpseste/utils/fabrique/fiche-competence.ts')

const R = '/Users/louissagnieres/Documents/GitTest/palimpseste-conception/competences'
for (const f of fs.readdirSync(R).filter((x) => x.endsWith('.md') && !x.startsWith('Annexe'))) {
  const contenu = fs.readFileSync(R + '/' + f, 'utf-8')
  const fiche = lireFiche(contenu, f)
  const { error: e1 } = await admin.from('competences_fiches').upsert({
    competence: fiche.competence, version: fiche.version, statut: fiche.statut,
    nom_fichier: f, contenu, deposee_at: new Date().toISOString(),
  })
  if (e1) { console.log('✗ fiche', f, e1.message); continue }
  if (fiche.competence !== 'monitoring') {
    await admin.from('competences_correspondance').delete().eq('competence', fiche.competence)
    if (fiche.correspondance.length) {
      const { error: e2 } = await admin.from('competences_correspondance').insert(
        fiche.correspondance.map((b) => ({
          competence: fiche.competence, observable_code: b.observable_code,
          dimension_eleve: b.dimension_eleve, question: b.question,
          reponses: b.reponses, fiche_version: fiche.version, ordre: b.ordre })))
      if (e2) { console.log('✗ correspondance', f, e2.message); continue }
    }
  }
  console.log(`✓ ${fiche.competence.padEnd(15)} v${fiche.version} · ${String(fiche.correspondance.length).padStart(2)} blocs`)
}
