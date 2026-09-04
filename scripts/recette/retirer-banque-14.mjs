// ============================================================================
// L'ANCIENNE BANQUE (format 1.4) SORT DU ROUTAGE — réversible. Louis, 04/09/2026 :
// « les éliminer : on garde ceux que les élèves ont fait cette semaine, mais il ne
//   faut plus vraiment les resservir ; en juin on pourra même les effacer ».
// ----------------------------------------------------------------------------
//   node scripts/recette/retirer-banque-14.mjs [--prod] [--applique | --retablis]
// Sans drapeau d'action : un RELEVÉ, rien n'est écrit.
// Le mécanisme est celui du signalement : `exercices.bloque = true` fait sortir
// l'instance du vivier (`constituerLeVivier`), et `blocages` porte le motif, avec
// la marque [banque 1.4]. `--retablis` retire CE motif-là et ne débloque que si
// aucun autre motif ne reste. Les dépôts existants ne sont pas touchés : les
// élèves gardent ce qu'ils ont ouvert.
// Une instance est « 1.4 » si AUCUN de ses cas ne porte de `probleme` (format 1.5).
// ============================================================================
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))
const PROD = process.argv.includes('--prod')
const admin = PROD
  ? createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const MARQUE = '[banque 1.4]'
const MOTIF = `${MARQUE} retirée du routage le ${new Date().toISOString().slice(0, 10)} — remplacée par les exercices du gabarit (10-)`
const applique = process.argv.includes('--applique'); const retablis = process.argv.includes('--retablis')

const { data: ex, error } = await admin.from('exercices')
  .select('id, id_import, statut, bloque, blocages, classe_id, lieu, exercices_cas(probleme)').limit(5000)
if (error) throw new Error(error.message)
const est14 = (e) => !(e.exercices_cas ?? []).some((c) => typeof c.probleme === 'string' && c.probleme)
const anciennes = ex.filter((e) => est14(e) && e.lieu !== 'classe')
const dejaRetirees = anciennes.filter((e) => (e.blocages ?? []).some((b) => String(b).startsWith(MARQUE)))
console.log(`${PROD ? 'PRODUCTION' : 'bac à sable'} — ${ex.length} instances, ${anciennes.length} au format 1.4 hors classe, ${ex.length - anciennes.length - ex.filter((e) => e.lieu === 'classe').length} au format 1.5, ${dejaRetirees.length} déjà retirées`)
if (!applique && !retablis) { console.log('relevé seulement — ajoute --applique ou --retablis'); process.exit(0) }

let n = 0
for (const e of anciennes) {
  const blocages = (e.blocages ?? []).map(String)
  if (applique) {
    if (blocages.some((b) => b.startsWith(MARQUE))) continue
    const { error: eU } = await admin.from('exercices').update({ bloque: true, blocages: [...blocages, MOTIF] }).eq('id', e.id)
    if (eU) { console.error('  ✗', e.id_import, eU.message); continue }
    n += 1
  } else {
    if (!blocages.some((b) => b.startsWith(MARQUE))) continue
    const restants = blocages.filter((b) => !b.startsWith(MARQUE))
    const { error: eU } = await admin.from('exercices').update({ bloque: restants.length > 0, blocages: restants }).eq('id', e.id)
    if (eU) { console.error('  ✗', e.id_import, eU.message); continue }
    n += 1
  }
}
console.log(applique ? `${n} instance(s) retirée(s) du routage` : `${n} instance(s) rétablie(s)`)
