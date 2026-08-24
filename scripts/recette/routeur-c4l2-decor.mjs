// ============================================================================
// RECETTE C4 · L2 — LE DÉCOR DES ÉCRANS. Il se sème, il se retire.
// ----------------------------------------------------------------------------
//   node … scripts/recette/routeur-c4l2-decor.mjs --seme
//   node … scripts/recette/routeur-c4l2-decor.mjs --retire
//
// « Vérifié veut dire PAR REQUÊTE **ET À L'ÉCRAN**, pas supposé » — et trois des
// quatre écrans ne montrent rien tant que la base est vide : la collecte
// d'assiduité démarre à la rentrée, le routeur est éteint, et le seul modèle de
// plan pointe vers une année scolaire sans semestre.
//
// Ce script sème le strict nécessaire pour REGARDER, puis le retire. Tout ce
// qu'il crée porte la marque `[RECETTE C4-L2]`, et `--retire` ne supprime QUE ce
// qui la porte.
//
// ⚠️ IL N'ÉCRIT QUE DES LIGNES NEUVES : aucune ligne existante n'est modifiée.
//
// ════════════════════════════════════════════════════════════════════════════
// ⭐ CORRIGÉ PAR C4-L13, 24/08 — LE DÉCOR EST SORTI DU CHEMIN DU VRAI ÉCRIVAIN.
// ----------------------------------------------------------------------------
// `assiduite_hebdo` a désormais son écrivain de production — le déclencheur
// hebdomadaire `/api/assiduite/hebdo`, et `poserLaSemaineDAssiduite()`. Sans
// correction, « la recette relirait ses propres semis et les prendrait pour une
// mesure ». Deux défauts fermés, et ils étaient tous deux silencieux :
//
//   ⛔ DENT 1 — `--retire` supprimait PAR SIGNATURE DE MINUTES
//      (`.eq('minutes_assignees', 50).eq('minutes_budget_plancher', 45)`). Or
//      45–60 min est LE BUDGET RÉEL d'un élève de tronc commun — asséré par la
//      recette de C4-L2 elle-même —, et 50 minutes assignées est parfaitement
//      plausible : le jour où `C4-L12` pose de vraies minutes, ce filtre EFFACE
//      DES LIGNES RÉELLES. Il ne reste RIEN de cette signature : le retrait
//      consomme désormais un REGISTRE des couples (élève × semaine) réellement
//      semés, écrit par `--seme` — le patron de `traversee-c4l7.mjs`.
//
//   ⛔ DENT 2 — l'en-tête ci-dessus MENTAIT : l'écriture était un `upsert`, qui
//      sur une base collectée ÉCRASE les compteurs réels de ces élèves × ces
//      trois semaines. C'est un `insert` des seuls couples ABSENTS : le semis ne
//      peut plus, par construction, toucher une ligne qui existe.
//
//   ⚠️ Et le seuil de `semaine_faite` était un `0.75` EN DUR — le seul défaut du
//      chantier assiduité sur ce point. Il se lit en configuration, comme partout.
//
// ⚠️ IL N'EXISTE AUCUN DRAPEAU DE PROVENANCE : `assiduite_hebdo` n'a aucune
//    colonne texte, et aucun garde côté lecture ne distingue un semis d'une
//    mesure. C'est pourquoi la garde est ici, à l'écriture, et pas à la lecture.
//
// ⭐ POUR REGARDER DE VRAIS CHIFFRES, le décor n'est plus le chemin :
//      node … scripts/recette/assiduite-c4l13.mjs
//    fait tourner le vrai déclencheur sur de vrais dépôts.
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

const MARQUE = '[RECETTE C4-L2]'
const geste = process.argv.includes('--retire') ? 'retire'
  : process.argv.includes('--seme') ? 'seme' : null
if (!geste) { console.error('Passe --seme ou --retire.'); process.exit(2) }

const dit = (s) => console.log(`  ${s}`)

// ── LE REGISTRE — la seule chose qui sache ce que CE script a semé ──────────
// `assiduite_hebdo` n'a aucune colonne de provenance : une valeur ne peut pas
// servir de marque (c'était la dent 1). Le registre survit au processus, comme
// celui de `traversee-c4l7.mjs`.
const REGISTRE = new URL('.routeur-c4l2-decor-registre.json', import.meta.url).pathname
const lireRegistre = () => {
  try { return JSON.parse(fs.readFileSync(REGISTRE, 'utf-8')) } catch { return { assiduite: [] } }
}
const ecrireRegistre = (r) => fs.writeFileSync(REGISTRE, JSON.stringify(r, null, 2))

// ── Ce qu'on sème ──────────────────────────────────────────────────────────
// Un modèle de plan calé sur le PREMIER SEMESTRE NON ARCHIVÉ : c'est lui qui
// donne au panneau des cinq segments de vraies semaines à découper.
async function semer() {
  const { data: sem } = await admin.from('semesters')
    .select('start_date').is('archived_at', null).order('start_date').limit(1).maybeSingle()
  if (!sem) { console.error('Aucun semestre non archivé : rien à caler.'); process.exit(1) }

  const ay = Number(sem.start_date.slice(0, 4))
  const { data: prof } = await admin.from('profiles')
    .select('id').eq('role', 'prof').limit(1).maybeSingle()

  const { data: modele, error: eM } = await admin.from('scriptorium_modeles_plan').insert({
    titre: `${MARQUE} panneau des cinq segments`,
    gabarit: 'tc', annee_scolaire: ay, date_debut: sem.start_date,
    statut: 'brouillon', created_by: prof?.id ?? null,
  }).select('id').single()
  if (eM) { console.error(`modèle : ${eM.message}`); process.exit(1) }
  dit(`✓ modèle semé — ${modele.id}, calé au ${sem.start_date}`)

  // Des comptes d'assiduité, pour que la frise ait trois couleurs à montrer.
  const { data: classe } = await admin.from('classes')
    .select('id, nom').eq('statut', 'active').order('nom').limit(1).maybeSingle()
  const { data: inscr } = await admin.from('inscriptions')
    .select('eleve_id').eq('classe_id', classe.id).eq('statut', 'active')
  const eleves = (inscr ?? []).map((i) => i.eleve_id)

  const lundi = (n) => {
    const d = new Date(`${sem.start_date}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + n * 7)
    return d.toISOString().slice(0, 10)
  }
  // Trois semaines, trois distributions : pleine, mêlée, effondrée.
  const profils = [
    (i) => ({ assignes: 4, termines: 4 }),
    (i) => ({ assignes: 4, termines: i % 3 === 0 ? 4 : i % 3 === 1 ? 2 : 1 }),
    (i) => ({ assignes: 4, termines: i === 0 ? 4 : 0 }),
  ]
  // ⛔ LE SEUIL SE LIT EN CONFIGURATION — « jamais une constante en dur » (`06-` §5).
  const { data: params } = await admin.from('scriptorium_params')
    .select('assiduite_seuil_semaine_faite').eq('id', 1).maybeSingle()
  const seuil = Number(params?.assiduite_seuil_semaine_faite ?? 0.75)

  const semaines = profils.map((_, s) => lundi(s))

  // ⛔ ON NE TOUCHE JAMAIS UNE LIGNE QUI EXISTE. Sur une base collectée, un
  //    `upsert` écraserait les compteurs réels de ces élèves × ces semaines,
  //    sans un mot. On lit d'abord, on n'insère que les couples ABSENTS.
  const { data: deja, error: eD } = await admin.from('assiduite_hebdo')
    .select('eleve_id, cycle_lundi').in('cycle_lundi', semaines).in('eleve_id', eleves)
  if (eD) { console.error(`assiduité (lecture) : ${eD.message}`); process.exit(1) }
  const occupes = new Set((deja ?? []).map((l) => `${l.eleve_id}|${l.cycle_lundi}`))

  const lignes = []
  profils.forEach((f, s) => eleves.forEach((id, i) => {
    if (occupes.has(`${id}|${lundi(s)}`)) return
    const { assignes, termines } = f(i)
    lignes.push({
      eleve_id: id, cycle_lundi: lundi(s),
      exercices_assignes: assignes, exercices_termines: termines,
      semaine_faite: termines / assignes >= seuil,
      minutes_assignees: 50, minutes_budget_plancher: 45, minutes_budget_plafond: 60,
    })
  }))

  if (occupes.size > 0) {
    dit(`⚠️ ${occupes.size} ligne(s) d'assiduité EXISTENT DÉJÀ sur ces semaines : elles sont `
      + `des MESURES, pas du décor. Elles ne sont pas touchées.`)
  }
  if (lignes.length === 0) {
    dit('⊘ aucun compte d\'assiduité à semer — tout est déjà collecté.')
  } else {
    const { error: eA } = await admin.from('assiduite_hebdo').insert(lignes)
    if (eA) { console.error(`assiduité : ${eA.message}`); process.exit(1) }
    const registre = lireRegistre()
    registre.assiduite = [
      ...registre.assiduite,
      ...lignes.map((l) => ({ eleve_id: l.eleve_id, cycle_lundi: l.cycle_lundi })),
    ]
    ecrireRegistre(registre)
    dit(`✓ ${lignes.length} comptes d'assiduité semés sur ${classe.nom}, 3 semaines `
      + `(seuil lu : ${seuil}) — inscrits au registre ${REGISTRE}`)
  }

  console.log(`\n  Les écrans à regarder :`)
  console.log(`    /prof/scriptorium?vue=modeles&modele=${modele.id}`)
  console.log('    /prof/routeur?vue=assiduite')
  console.log(`\n  Puis : node … scripts/recette/routeur-c4l2-decor.mjs --retire`)
}

// ── Ce qu'on retire — et RIEN d'autre ──────────────────────────────────────
async function retirer() {
  const { data: modeles } = await admin.from('scriptorium_modeles_plan')
    .select('id, titre').like('titre', `${MARQUE}%`)
  for (const m of modeles ?? []) {
    await admin.from('scriptorium_modeles_plan_exercices').delete().eq('modele_id', m.id)
    const { error } = await admin.from('scriptorium_modeles_plan').delete().eq('id', m.id)
    dit(error ? `✗ modèle ${m.id} : ${error.message}` : `✓ modèle retiré — ${m.titre}`)
  }

  // ⛔ L'ASSIDUITÉ SEMÉE — CELLE QUE LE REGISTRE NOMME, ET RIEN D'AUTRE.
  //    L'ancien filtre par signature de minutes (50 / 45) effacerait des lignes
  //    RÉELLES dès que `C4-L12` posera de vraies minutes : 45–60 est le budget
  //    réel d'un élève de tronc commun.
  const registre = lireRegistre()
  const couples = registre.assiduite ?? []
  let retires = 0
  const echecs = []
  for (const c of couples) {
    const { error } = await admin.from('assiduite_hebdo').delete()
      .eq('eleve_id', c.eleve_id).eq('cycle_lundi', c.cycle_lundi)
    if (error) echecs.push(`${c.eleve_id.slice(0, 8)}×${c.cycle_lundi} : ${error.message}`)
    else retires++
  }
  if (couples.length === 0) {
    dit(`⊘ registre vide (${REGISTRE}) : aucun compte d'assiduité à retirer. `
      + `⚠️ Si le décor a été semé par une AUTRE machine, son registre est là-bas — `
      + `ne supprime rien à la main : sur une base collectée, tu effacerais une mesure.`)
  } else {
    dit(echecs.length
      ? `✗ assiduité : ${echecs.length} échec(s) — ${echecs.join(' · ')}`
      : `✓ ${retires} compte(s) d'assiduité retiré(s), NOMMÉMENT (registre)`)
  }

  // ── La preuve du retour à l'état d'avant, PAR REQUÊTE ────────────────────
  // ⚠️ ELLE NE COMPTE PLUS TOUTE LA TABLE. « Zéro ligne d'assiduité en base »
  //    était un présupposé qui cesse d'être vrai LE JOUR DE LA RENTRÉE : à
  //    partir de là, la table porte des mesures, et un total non nul serait le
  //    fonctionnement normal. La preuve porte donc sur les couples SEMÉS.
  let restants = 0
  for (const c of couples) {
    const { count } = await admin.from('assiduite_hebdo').select('*', { count: 'exact', head: true })
      .eq('eleve_id', c.eleve_id).eq('cycle_lundi', c.cycle_lundi)
    restants += count ?? 0
  }
  if (!echecs.length) {
    registre.assiduite = []
    ecrireRegistre(registre)
  }
  const { count: total } = await admin.from('assiduite_hebdo')
    .select('*', { count: 'exact', head: true })
  const { data: modelesApres } = await admin.from('scriptorium_modeles_plan')
    .select('id').like('titre', `${MARQUE}%`)
  console.log(`\n  Vérification : ${restants} couple(s) semé(s) restant(s) sur ${couples.length}, `
    + `${(modelesApres ?? []).length} modèle(s) de recette restant(s).`)
  console.log(`  (La table porte ${total} ligne(s) au total — mesures comprises. `
    + `Ce total n'est PAS une preuve de nettoyage.)`)
}

console.log(`\n${geste === 'seme' ? '▶ Semis' : '◀ Retrait'} du décor de recette C4-L2\n`)
await (geste === 'seme' ? semer() : retirer())
console.log('')
