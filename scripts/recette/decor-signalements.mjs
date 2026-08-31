// ============================================================================
// DÉCOR — DES EXERCICES SIGNALÉS PAR DES ÉLÈVES, EN BAC À SABLE.
// ----------------------------------------------------------------------------
// Il ne prouve rien : il SÈME de quoi regarder l'écran avec des données réelles,
// et il RETIRE. « Une fois implémenté, montrer le rendu avec ces données
// réelles, sur les trois tailles d'écran » (`AGENTS.md`).
//
// ⛔⛔ LA MARQUE VA EN BASE, PAS SUR LE DISQUE. Un registre de fichiers ne suffit
//    pas — une séance qui perd le fichier perd le décor. Chaque texte semé porte
//    `⟦décor⟧`, et `--retire` BALAIE PAR LA MARQUE, puis vérifie PAR REQUÊTE
//    qu'il ne reste rien.
//
// ⚠️ IL N'ÉCRIT AUCUN `profiles`, AUCUN `exercices_depots`, AUCUN `exercices` :
//    il pose des lignes dans `exercices_signalements_eleve`, et rien d'autre.
//    Les dépôts et les élèves sont ceux qui existent. ⭐ Sauf l'INTERRUPTEUR,
//    qu'il bascule avec `--ouvre` et remet avec `--retire`.
//
// ⛔ BAC À SABLE UNIQUEMENT. Il refuse de tourner si l'URL n'est pas celle du
//    projet `aoakpxxlyvthzueaywna` — les deux références ne diffèrent que par
//    quelques lettres au milieu d'une longue chaîne.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/decor-signalements.mjs --etat
//   …                                          --seme [--ouvre]
//   …                                          --liens
//   …                                          --retire
// ============================================================================

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))

const SABLE = 'aoakpxxlyvthzueaywna'
if (!env.NEXT_PUBLIC_SUPABASE_URL?.includes(SABLE)) {
  console.error(`✗ REFUS : l'URL n'est pas le bac à sable (${SABLE}).`)
  process.exit(1)
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MARQUE = '⟦décor⟧'
const a = (n) => process.argv.includes(`--${n}`)

/** ⚠️ supabase-js NE LÈVE PAS : toute lecture passe par ici, et celle-ci lève. */
function lu(nom, { data, error }) {
  if (error) throw new Error(`${nom} : ${error.message}`)
  return data
}

// ── Les textes semés — écrits comme un élève les écrirait ──────────────────
const MOTS = [
  'Je comprends pas ce qu\'il faut faire. La consigne dit de dire où la raison manque mais dans le texte y a pas de connecteur, ou alors je le vois pas.',
  'Le texte s\'arrête au milieu d\'une phrase, je pense qu\'il manque un bout.',
  'Il y a deux fois la même chose dans les propositions, du coup on peut pas choisir.',
  'La consigne demande un paragraphe mais après elle dit une phrase. Je sais pas lequel prendre.',
  'Franchement l\'exercice est pas clair du tout, on sait pas sur quel texte on travaille.',
  'Il manque le texte, y a juste la consigne.',
  'La question porte sur un mot qui n\'est pas dans l\'extrait.',
]

async function etat() {
  const params = lu('params', await admin.from('scriptorium_params')
    .select('signalement_exercice_actif').limit(1).maybeSingle())
  const sig = lu('signalements', await admin.from('exercices_signalements_eleve')
    .select('id, texte, arbitrage, exercice_id'))
  const decor = sig.filter((s) => s.texte.includes(MARQUE))
  console.log(`interrupteur signalement_exercice_actif : ${params?.signalement_exercice_actif}`)
  console.log(`signalements en base : ${sig.length} — dont décor : ${decor.length}`)
  const bloques = lu('bloqués', await admin.from('exercices')
    .select('id, bloque, blocages').eq('bloque', true))
  console.log(`instances bloquées : ${bloques.length}`)
  for (const b of bloques) console.log(`  ${b.id.slice(0, 8)} — ${JSON.stringify(b.blocages)}`)
  return { sig, decor }
}

async function seme() {
  // Les dépôts de MAISON, avec leur instance et leur élève. On sème sur les
  // instances les plus PARTAGÉES d'abord : c'est le cas normal en production.
  const depots = lu('dépôts', await admin.from('exercices_depots')
    .select('id, eleve_id, exercice_id, statut, exercices!inner(lieu)')
    .eq('exercices.lieu', 'maison'))
  const par = new Map()
  for (const d of depots) par.set(d.exercice_id, [...(par.get(d.exercice_id) ?? []), d])
  const groupes = [...par.entries()].sort((x, y) => y[1].length - x[1].length)

  // Cinq élèves sur la plus partagée, un sur deux autres — dont une instance à
  // la consigne LONGUE, pour éprouver la mise en page sur le cas mesuré (p90).
  const plan = []
  if (groupes[0]) plan.push(...groupes[0][1].slice(0, 5))
  const longues = lu('longues', await admin.from('exercices')
    .select('id, consigne_instanciee').eq('lieu', 'maison'))
  const longueIds = new Set(longues
    .filter((e) => premiereLigne(e.consigne_instanciee).length > 150).map((e) => e.id))
  for (const [eid, l] of groupes.slice(1)) {
    if (plan.length >= 8) break
    if (longueIds.has(eid) || plan.length < 7) plan.push(l[0])
  }

  const lignes = plan.map((d, i) => ({
    depot_id: d.id, exercice_id: d.exercice_id, eleve_id: d.eleve_id,
    texte: `${MOTS[i % MOTS.length]}\n${MARQUE}`,
  }))
  const { error } = await admin.from('exercices_signalements_eleve')
    .upsert(lignes, { onConflict: 'depot_id' })
  if (error) throw new Error(`semis : ${error.message}`)
  console.log(`✔ ${lignes.length} signalement(s) semé(s), sur ${new Set(lignes.map((l) => l.exercice_id)).size} instance(s).`)

  if (a('ouvre')) {
    const { error: e2 } = await admin.from('scriptorium_params')
      .update({ signalement_exercice_actif: true }).eq('id', 1)
    if (e2) throw new Error(`interrupteur : ${e2.message}`)
    console.log('✔ `signalement_exercice_actif` à ON (remis à OFF par --retire).')
  }
}

const premiereLigne = (c) => {
  const brut = typeof c === 'string' ? c : Array.isArray(c) && typeof c[0] === 'string' ? c[0] : ''
  return brut.split('\n').find((x) => x.trim() !== '') ?? ''
}

async function retire() {
  // ⭐ ON BALAIE PAR LA MARQUE, JAMAIS PAR UN REGISTRE DE DISQUE.
  const sig = lu('signalements', await admin.from('exercices_signalements_eleve')
    .select('id, texte'))
  const ids = sig.filter((s) => s.texte.includes(MARQUE)).map((s) => s.id)
  if (ids.length) {
    const { error } = await admin.from('exercices_signalements_eleve').delete().in('id', ids)
    if (error) throw new Error(`retrait : ${error.message}`)
  }
  console.log(`✔ ${ids.length} signalement(s) de décor retiré(s).`)

  // Les instances que la coche « dans le pool » aurait bloquées pendant l'essai.
  const bloques = lu('bloqués', await admin.from('exercices')
    .select('id, blocages').eq('bloque', true))
  for (const b of bloques) {
    const reste = (b.blocages ?? []).filter((x) => !String(x).startsWith('[signalement]'))
    if (reste.length === (b.blocages ?? []).length) continue
    const { error } = await admin.from('exercices')
      .update({ bloque: reste.length > 0, blocages: reste }).eq('id', b.id)
    if (error) throw new Error(`déblocage ${b.id} : ${error.message}`)
    console.log(`✔ instance ${b.id.slice(0, 8)} remise au pool.`)
  }

  const { error: e2 } = await admin.from('scriptorium_params')
    .update({ signalement_exercice_actif: false }).eq('id', 1)
  if (e2) throw new Error(`interrupteur : ${e2.message}`)
  console.log('✔ `signalement_exercice_actif` remis à OFF.')

  // ⭐ CONTRÔLE PAR REQUÊTE — « le retrait ne se croit pas, il se vérifie ».
  const apres = lu('contrôle', await admin.from('exercices_signalements_eleve').select('id, texte'))
  const restants = apres.filter((s) => s.texte.includes(MARQUE)).length
  console.log(restants === 0 ? '✔ contrôle : plus aucune marque en base.'
    : `✗ CONTRÔLE ROUGE : ${restants} marque(s) restante(s).`)
}

/** Des liens de session sans mot de passe — le repli qui ne dépend d'aucun secret. */
async function liens() {
  const profs = lu('profs', await admin.from('profiles')
    .select('id, display_name, role').eq('role', 'prof').limit(3))
  const sig = lu('signalements', await admin.from('exercices_signalements_eleve')
    .select('depot_id, eleve_id, texte'))
  const mien = sig.find((s) => s.texte.includes(MARQUE))
  for (const p of profs) {
    const u = lu('user', await admin.auth.admin.getUserById(p.id))
    if (!u?.user?.email) continue
    const d = lu('lien', await admin.auth.admin.generateLink(
      { type: 'magiclink', email: u.user.email }))
    console.log(`\nPROF ${p.display_name}`)
    console.log(`http://localhost:3000/auth/confirm?token_hash=${d.properties.hashed_token}&type=magiclink&next=/prof/signalements`)
  }
  if (mien) {
    const u = lu('user', await admin.auth.admin.getUserById(mien.eleve_id))
    if (u?.user?.email) {
      const d = lu('lien', await admin.auth.admin.generateLink(
        { type: 'magiclink', email: u.user.email }))
      console.log(`\nÉLÈVE (dépôt ${mien.depot_id.slice(0, 8)})`)
      console.log(`http://localhost:3000/auth/confirm?token_hash=${d.properties.hashed_token}&type=magiclink&next=/eleve/modules/codex/exercice/${mien.depot_id}`)
    }
  }
}

try {
  if (a('seme')) await seme()
  else if (a('retire')) await retire()
  else if (a('liens')) await liens()
  else await etat()
} catch (e) {
  console.error(`✗ ${e.message}`)
  process.exit(1)
}
