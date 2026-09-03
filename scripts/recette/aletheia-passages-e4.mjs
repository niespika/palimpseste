// ============================================================================
// RECETTE — Aletheia E4 : passages clés d'un livre du BAC À SABLE, par la vraie
// fonction serveur ; puis ré-alignement à blanc.
//   node --import ./scripts/register-calibration-resolver.mjs scripts/recette/aletheia-passages-e4.mjs --livre <id> --genere 2,18,23
//   … --livre <id> --etat            # liste les passages de la fiche
//   … --livre <id> --realigne        # ré-aligne sur le texte courant
// Écrit UNIQUEMENT aletheia_livre_reference.contenu[].passages_cles (jsonb additif).
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
if (!(env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes('aoakpxxlyvthzueaywna')) { console.error('⛔ pas le bac à sable — arrêt'); process.exit(2) }
for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'ANTHROPIC_API_KEY']) if (env[k] && !process.env[k]) process.env[k] = env[k]
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : undefined }
const livreId = arg('--livre'); if (!livreId) { console.error('--livre <id> requis'); process.exit(1) }

const { genererPassagesLivre, realignerPassagesLivre } = await import('@/utils/aletheia/passages-serveur')
const { parsePassages } = await import('@/utils/aletheia/passages')

async function etat() {
  const { data } = await admin.from('aletheia_livre_reference').select('contenu').eq('scriptorium_livre_id', livreId).maybeSingle()
  for (const f of data?.contenu ?? []) {
    const ps = parsePassages(f.passages_cles)
    if (!ps.length) continue
    console.log(`\nsemaine ${f.semaine} — ${ps.length} passage(s)`)
    for (const p of ps) console.log(`  [${p.role}] « ${p.libelle} » ${p.phrase_debut}→${p.phrase_fin}${p.revoir ? ' ⚠ À REVOIR' : ''}\n     pivot : ${p.pivots_texte.map(t => t.slice(0, 110)).join(' ‖ ')}`)
  }
}
if (process.argv.includes('--genere')) {
  const semaines = (arg('--genere') ?? '').split(',').map(Number).filter(Number.isInteger)
  const t0 = Date.now()
  const r = await genererPassagesLivre(admin, livreId, semaines.length ? semaines : undefined)
  if (!r.ok) { console.error('✖', r.message); process.exit(1) }
  for (const x of r.resultats) console.log(`S${x.semaine} : ${x.erreur ? '✖ ' + x.erreur : `${x.passages} passage(s), ${x.rejets.length} rejet(s) ${x.rejets.map(j => j.motifs.join('+')).join(' ')}`} — ${(x.ms / 1000).toFixed(1)} s`)
  console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)} s`)
  await etat()
} else if (process.argv.includes('--realigne')) {
  const r = await realignerPassagesLivre(admin, livreId)
  console.log(r.ok ? `✔ ${r.realignes} ré-aligné(s), ${r.aRevoir} à revoir` : '✖ ' + r.message)
  await etat()
} else if (process.argv.includes('--epreuve')) {
  // Épreuve de version : on ajoute une phrase EN TÊTE du texte d'une semaine (bac à sable),
  // on ré-aligne, on constate, puis on REMET le texte tel quel et on ré-aligne encore.
  const semaine = Number(arg('--epreuve'))
  const { data: doc } = await admin.from('scriptorium_documents').select('id, texte_extrait').eq('unite_id', livreId).eq('semaine', semaine).order('created_at').limit(1).maybeSingle()
  if (!doc) { console.error('semaine introuvable'); process.exit(1) }
  const original = doc.texte_extrait
  const avant = (await admin.from('aletheia_livre_reference').select('contenu').eq('scriptorium_livre_id', livreId).maybeSingle()).data?.contenu?.find(f => Number(f.semaine) === semaine)
  console.log('avant :', parsePassages(avant?.passages_cles).map(p => `${p.phrase_debut}→${p.phrase_fin} ${JSON.stringify(p.pivots)}`).join(' | '))
  try {
    await admin.from('scriptorium_documents').update({ texte_extrait: 'Une phrase ajoutée en tête pour l\'épreuve. Et une seconde phrase encore. ' + original }).eq('id', doc.id)
    const r = await realignerPassagesLivre(admin, livreId)
    console.log('texte modifié →', r.ok ? `${r.realignes} ré-aligné(s), ${r.aRevoir} à revoir` : r.message)
    const pendant = (await admin.from('aletheia_livre_reference').select('contenu').eq('scriptorium_livre_id', livreId).maybeSingle()).data?.contenu?.find(f => Number(f.semaine) === semaine)
    console.log('pendant :', parsePassages(pendant?.passages_cles).map(p => `${p.phrase_debut}→${p.phrase_fin} ${JSON.stringify(p.pivots)}${p.revoir ? ' À REVOIR' : ''}`).join(' | '))
  } finally {
    await admin.from('scriptorium_documents').update({ texte_extrait: original }).eq('id', doc.id)
    const r2 = await realignerPassagesLivre(admin, livreId)
    console.log('texte remis  →', r2.ok ? `${r2.realignes} ré-aligné(s), ${r2.aRevoir} à revoir` : r2.message)
    const apres = (await admin.from('aletheia_livre_reference').select('contenu').eq('scriptorium_livre_id', livreId).maybeSingle()).data?.contenu?.find(f => Number(f.semaine) === semaine)
    console.log('après :', parsePassages(apres?.passages_cles).map(p => `${p.phrase_debut}→${p.phrase_fin} ${JSON.stringify(p.pivots)}${p.revoir ? ' À REVOIR' : ''}`).join(' | '))
  }
} else await etat()
