// ============================================================================
// RECETTE — Aletheia E1 : la découpe d'un livre, par la VRAIE fonction serveur.
// ----------------------------------------------------------------------------
// Exécution, depuis la racine du dépôt (bac à sable SEULEMENT — la référence du
// projet est lue et vérifiée avant tout geste) :
//   node --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/aletheia-decoupage-e1.mjs --genere   # découpe tous les livres à texte
//   … --etat                                                   # lit les découpes (version, périmée ?)
//   … --retire                                                 # efface les lignes de aletheia_livre_decoupage
// Ce que le script garantit : il n'écrit QUE dans `aletheia_livre_decoupage` (jamais
// dans `scriptorium_*`), et `--retire` ramène la table à vide — vérifié par requête.
// Il passe par `genererDecoupeLivre` / `chargerDecoupeLivre` (utils/aletheia/
// decoupage-serveur.ts) : c'est le code de l'app qui tourne, pas une copie.
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { genererDecoupeLivre, chargerDecoupeLivre, lireLaPorteEtayage } from '@/utils/aletheia/decoupage-serveur'
import { rendreTranche } from '@/utils/aletheia/decoupage'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))

const SANDBOX = 'aoakpxxlyvthzueaywna'
if (!(env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes(SANDBOX)) {
  console.error(`⛔ NEXT_PUBLIC_SUPABASE_URL ne pointe pas le bac à sable (${SANDBOX}) — arrêt.`)
  process.exit(2)
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const geste = process.argv.find(a => ['--genere', '--etat', '--retire'].includes(a))
if (!geste) { console.error('usage : --genere | --etat | --retire'); process.exit(1) }

console.log('porte aletheia_etayage_actif :', await lireLaPorteEtayage(admin) ? 'OUVERTE' : 'fermée')

const { data: livres } = await admin.from('scriptorium_unites').select('id, label, nb_semaines').eq('type', 'livre').order('label')
const { data: docs } = await admin.from('scriptorium_documents').select('unite_id').not('texte_extrait', 'is', null).not('semaine', 'is', null)
const avecTexte = new Set((docs ?? []).map(d => d.unite_id))
const cibles = (livres ?? []).filter(l => avecTexte.has(l.id))
console.log(`livres à texte : ${cibles.length} / ${(livres ?? []).length}`)

if (geste === '--retire') {
  const { error } = await admin.from('aletheia_livre_decoupage').delete().not('scriptorium_livre_id', 'is', null)
  if (error) { console.error('retrait :', error.message); process.exit(1) }
  const { count } = await admin.from('aletheia_livre_decoupage').select('*', { count: 'exact', head: true })
  console.log(`aletheia_livre_decoupage : ${count} ligne(s) restante(s) (attendu 0)`)
  process.exit(count === 0 ? 0 : 1)
}

for (const l of cibles) {
  const t0 = Date.now()
  if (geste === '--genere') {
    const r = await genererDecoupeLivre(admin, l.id)
    if (!r.ok) { console.log(`✖ ${l.label} (${l.id.slice(0, 8)}) : ${r.message}`); continue }
    console.log(`✔ ${l.label} (${l.id.slice(0, 8)}) : ${r.nbSemaines} semaines, ${r.nbPhrases} phrases, ${r.nbMasques} masques, version ${r.version.slice(0, 12)}…, ${Date.now() - t0} ms`)
  }
  const d = await chargerDecoupeLivre(admin, l.id)
  if (!d) { console.log(`  · ${l.label} : aucune découpe en base`); continue }
  console.log(`  · ${l.label} : ${d.semaines.length} semaines, version ${d.version.slice(0, 12)}…, ${d.perimee ? 'PÉRIMÉE' : 'à jour'}, mise à jour ${d.updated_at}`)
  // Preuve de rendu depuis la BASE : la première phrase d'une semaine, masques omis.
  const s = d.semaines[0]
  if (s?.phrases.length) {
    const { data: doc } = await admin.from('scriptorium_documents').select('texte_extrait').eq('unite_id', l.id).eq('semaine', s.semaine).order('created_at').limit(1).maybeSingle()
    const texte = doc?.texte_extrait ?? ''
    if (s.longueur !== texte.length) console.log(`  ⚠ longueur stockée ${s.longueur} ≠ texte courant ${texte.length}`)
    console.log(`  · semaine ${s.semaine}, phrase ${s.phrases[0].id} rendue : « ${rendreTranche(texte, s.phrases[0].bornes, s.masques).slice(0, 100)}… »`)
  }
}
