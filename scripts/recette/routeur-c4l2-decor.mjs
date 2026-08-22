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
  const lignes = []
  profils.forEach((f, s) => eleves.forEach((id, i) => {
    const { assignes, termines } = f(i)
    lignes.push({
      eleve_id: id, cycle_lundi: lundi(s),
      exercices_assignes: assignes, exercices_termines: termines,
      semaine_faite: termines / assignes >= 0.75,
      minutes_assignees: 50, minutes_budget_plancher: 45, minutes_budget_plafond: 60,
    })
  }))
  const { error: eA } = await admin.from('assiduite_hebdo').upsert(lignes,
    { onConflict: 'eleve_id,cycle_lundi' })
  if (eA) { console.error(`assiduité : ${eA.message}`); process.exit(1) }
  dit(`✓ ${lignes.length} comptes d'assiduité semés sur ${classe.nom}, 3 semaines`)

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

  // L'assiduité semée : celle dont les minutes portent exactement notre signature.
  const { data: avant } = await admin.from('assiduite_hebdo')
    .select('eleve_id', { count: 'exact', head: false })
    .eq('minutes_assignees', 50).eq('minutes_budget_plancher', 45)
  const { error: eA } = await admin.from('assiduite_hebdo').delete()
    .eq('minutes_assignees', 50).eq('minutes_budget_plancher', 45)
  dit(eA ? `✗ assiduité : ${eA.message}` : `✓ ${(avant ?? []).length} comptes d'assiduité retirés`)

  // La preuve du retour à l'état d'avant, PAR REQUÊTE.
  const { count: restants } = await admin.from('assiduite_hebdo')
    .select('*', { count: 'exact', head: true })
  const { data: modelesApres } = await admin.from('scriptorium_modeles_plan')
    .select('id').like('titre', `${MARQUE}%`)
  console.log(`\n  Vérification : ${restants} ligne(s) d'assiduité en base, `
    + `${(modelesApres ?? []).length} modèle(s) de recette restant(s).`)
}

console.log(`\n${geste === 'seme' ? '▶ Semis' : '◀ Retrait'} du décor de recette C4-L2\n`)
await (geste === 'seme' ? semer() : retirer())
console.log('')
