// ============================================================================
// RECETTE — Aletheia E3 : un livre par gabarit, semé en BAC À SABLE, puis retiré.
// ----------------------------------------------------------------------------
//   node --import ./scripts/register-calibration-resolver.mjs scripts/recette/aletheia-livres-gabarits.mjs --seme <manifeste.json>
//   … --fiches      # génère découpe + fiche de lecture (IA) pour les livres semés
//   … --etat        # liste les livres semés
//   … --retire      # efface les livres semés (et, en cascade, documents, fiches, découpes, travaux)
// Le manifeste : [{ label, auteur, gabarit, semaines: [{ titre, chapitres?, texte }] }].
// Les livres semés portent le préfixe de label « [recette E3] » : c'est LUI que
// `--retire` cherche — jamais un autre livre. Classe cible : celle du compte élève de
// test (TEST_ELEVE_EMAIL), résolue au démarrage. Bac à sable seulement (garde sur la
// référence du projet).
// ============================================================================
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const SANDBOX = 'aoakpxxlyvthzueaywna'
if (!(env.NEXT_PUBLIC_SUPABASE_URL ?? '').includes(SANDBOX)) { console.error(`⛔ pas le bac à sable (${SANDBOX}) — arrêt`); process.exit(2) }
// Les modules de l'app (createAdminClient, Anthropic) lisent process.env : on y recopie
// le .env.local — SANS passer par le shell (zsh tronque une valeur contenant `$^#`).
for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'ANTHROPIC_API_KEY']) {
  if (env[k] && !process.env[k]) process.env[k] = env[k]
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const PREFIXE = '[recette E3] '
const geste = process.argv.find(a => ['--seme', '--fiches', '--etat', '--retire'].includes(a))
if (!geste) { console.error('usage : --seme <manifeste.json> | --fiches | --etat | --retire'); process.exit(1) }

async function classeDeLEleveTest() {
  const email = env.TEST_ELEVE_EMAIL
  const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const u = users?.users.find(x => x.email === email)
  if (!u) throw new Error(`compte élève de test introuvable (${email})`)
  const { data: insc } = await admin.from('inscriptions').select('classe_id, classes(nom)').eq('eleve_id', u.id).eq('statut', 'active')
  // La classe « Test » si elle existe, sinon la première.
  const pick = (insc ?? []).find(i => i.classes?.nom === 'Test') ?? (insc ?? [])[0]
  if (!pick) throw new Error('l’élève de test n’a aucune inscription active')
  return { eleveId: u.id, classeId: pick.classe_id, classeNom: pick.classes?.nom }
}

async function semes() {
  const { data } = await admin.from('scriptorium_unites').select('id, label, gabarit_lecture, nb_semaines').eq('type', 'livre').like('label', `${PREFIXE}%`).order('label')
  return data ?? []
}

if (geste === '--etat') {
  for (const l of await semes()) {
    const { count } = await admin.from('scriptorium_documents').select('*', { count: 'exact', head: true }).eq('unite_id', l.id)
    const { data: ref } = await admin.from('aletheia_livre_reference').select('statut').eq('scriptorium_livre_id', l.id).maybeSingle()
    const { data: dec } = await admin.from('aletheia_livre_decoupage').select('version').eq('scriptorium_livre_id', l.id).maybeSingle()
    console.log(`· ${l.label} (${l.id.slice(0, 8)}) — ${l.gabarit_lecture}, ${count} documents, fiche ${ref?.statut ?? 'absente'}, découpe ${dec ? 'présente' : 'absente'}`)
  }
  process.exit(0)
}

if (geste === '--retire') {
  const livres = await semes()
  for (const l of livres) {
    // Cascade en base (documents, fiches, découpes, travaux → on delete cascade) ; on efface
    // d'abord les liens de classe puis l'unité.
    await admin.from('scriptorium_unite_classes').delete().eq('unite_id', l.id)
    const { error } = await admin.from('scriptorium_unites').delete().eq('id', l.id)
    console.log(`${error ? '✖' : '✔'} retiré : ${l.label}${error ? ' — ' + error.message : ''}`)
  }
  const reste = await semes()
  console.log(`livres « ${PREFIXE}… » restants : ${reste.length} (attendu 0)`)
  process.exit(reste.length === 0 ? 0 : 1)
}

if (geste === '--seme') {
  const fichier = process.argv[process.argv.indexOf('--seme') + 1]
  const manifeste = JSON.parse(fs.readFileSync(fichier, 'utf8'))
  const { classeId, classeNom } = await classeDeLEleveTest()
  console.log(`classe cible : ${classeNom} (${classeId.slice(0, 8)})`)
  for (const livre of manifeste) {
    const label = PREFIXE + livre.label
    const { data: u, error: eU } = await admin.from('scriptorium_unites')
      .insert({ label, type: 'livre', auteur: livre.auteur ?? null, nb_semaines: livre.semaines.length, gabarit_lecture: livre.gabarit, ordre: 99 })
      .select('id').single()
    if (eU) { console.log(`✖ ${label} : ${eU.message}`); continue }
    const docs = livre.semaines.map((s, i) => ({
      unite_id: u.id, type: 'texte_source', titre: s.titre, chapitres: s.chapitres ?? null, semaine: i + 1, texte_extrait: s.texte, auteur: livre.auteur ?? null,
    }))
    const { error: eD } = await admin.from('scriptorium_documents').insert(docs)
    if (eD) { console.log(`✖ documents de ${label} : ${eD.message}`); continue }
    const { error: eC } = await admin.from('scriptorium_unite_classes').insert({ unite_id: u.id, classe_id: classeId })
    if (eC) { console.log(`✖ lien classe de ${label} : ${eC.message}`); continue }
    console.log(`✔ ${label} (${u.id.slice(0, 8)}) — ${livre.gabarit}, ${docs.length} séances, ${docs.reduce((n, d) => n + d.texte_extrait.length, 0)} car`)
  }
  process.exit(0)
}

if (geste === '--fiches') {
  const { genererDecoupeLivre } = await import('@/utils/aletheia/decoupage-serveur')
  const { genererReferenceLivre } = await import('@/utils/aletheia-retours')
  for (const l of await semes()) {
    const d = await genererDecoupeLivre(admin, l.id)
    console.log(`${d.ok ? '✔' : '✖'} découpe ${l.label} : ${d.ok ? `${d.nbPhrases} phrases, ${d.nbMasques} masques` : d.message}`)
    await admin.from('aletheia_livre_reference').upsert(
      { scriptorium_livre_id: l.id, statut: 'PENDING', contenu: null, erreur_at: null, amende_par_prof: false, updated_at: new Date().toISOString() },
      { onConflict: 'scriptorium_livre_id' })
    const t0 = Date.now()
    await genererReferenceLivre(l.id)
    const { data: ref } = await admin.from('aletheia_livre_reference').select('statut, contenu').eq('scriptorium_livre_id', l.id).maybeSingle()
    const fiches = Array.isArray(ref?.contenu) ? ref.contenu : []
    console.log(`  fiche ${l.label} : ${ref?.statut} — ${fiches.length} semaine(s), ${((Date.now() - t0) / 1000).toFixed(1)} s`)
    for (const f of fiches) console.log(`    sem ${f.semaine} — thèse : ${String(f.these_canonique).slice(0, 110)}… | args : ${(f.arguments_cles ?? []).length}`)
  }
  process.exit(0)
}
