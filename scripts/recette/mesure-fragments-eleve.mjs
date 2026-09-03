// ============================================================================
// MESURE — ÉPREUVE DU HANDOFF `design_handoff_fragments_eleve` CONTRE LA BASE.
// ----------------------------------------------------------------------------
// ⛔ LECTURE SEULE. Aucune écriture, aucun interrupteur touché, aucun décor semé.
//
// ⭐⭐ « Un handoff de design s'ÉPROUVE avant de se suivre » (`AGENTS.md`) :
//    avant d'écrire une ligne, MESURER dans la base la longueur et le nombre
//    RÉELS de chaque champ que la maquette affiche. Ici, tout ce que l'écran
//    élève de Fragments montre : thème, titres de semaines, retours écrits
//    (les cinq sections, les pistes, le mot du prof), retours d'oral, d'essai,
//    synthèses — et le NOMBRE de dépôts passés par inscription (l'archive).
//
// Usage : node scripts/recette/mesure-fragments-eleve.mjs [sandbox|prod|deux]
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^['"]|['"]$/g, '')]))

const clients = {
  sandbox: () => createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }),
  prod: () => createClient(env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }),
}

const cible = process.argv[2] ?? 'deux'
const bases = cible === 'deux' ? ['sandbox', 'prod'] : [cible]

const titre = (t) => console.log(`\n${'═'.repeat(78)}\n${t}\n${'═'.repeat(78)}`)
const sous = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 70 - t.length))}`)

function stats(valeurs) {
  if (valeurs.length === 0) return 'aucune valeur'
  const t = [...valeurs].sort((a, b) => a - b)
  const q = (p) => t[Math.min(t.length - 1, Math.floor(p * (t.length - 1)))]
  return `n=${t.length} · min ${t[0]} · médiane ${q(0.5)} · p90 ${q(0.9)} · max ${t[t.length - 1]}`
}
const longueurs = (lignes, champ) => lignes.filter((l) => l[champ] != null && l[champ] !== '').map((l) => String(l[champ]).length)
const nuls = (lignes, champ) => lignes.filter((l) => l[champ] == null || l[champ] === '').length

function verifie(ou, { data, error }) {
  if (error) throw new Error(`${ou} — ${error.code ?? ''} ${error.message}`)
  return data
}

async function tout(client, table, select, filtre) {
  const lignes = []
  for (let de = 0; ; de += 1000) {
    let q = client.from(table).select(select).range(de, de + 999)
    if (filtre) q = filtre(q)
    const page = verifie(table, await q)
    lignes.push(...page)
    if (page.length < 1000) break
  }
  return lignes
}

function champTexte(lignes, champ, etiquette = champ) {
  console.log(`  ${etiquette.padEnd(22)} ${stats(longueurs(lignes, champ))}  · vides ${nuls(lignes, champ)}/${lignes.length}`)
}

for (const base of bases) {
  const c = clients[base]()
  titre(`${base.toUpperCase()} — ce que l'écran élève de Fragments affiche`)

  // ── Semestre actif ────────────────────────────────────────────────────────
  const sem = verifie('semesters', await c.from('semesters').select('id, name, fragments_premiere_semaine').eq('is_active', true).maybeSingle())
  console.log(`semestre actif : ${sem ? `${sem.name} (${sem.id}) · première semaine réclamée ${sem.fragments_premiere_semaine}` : 'AUCUN'}`)

  // ── Thèmes ────────────────────────────────────────────────────────────────
  sous('fragments_themes — le TITRE de l\'en-tête proposé')
  const themes = await tout(c, 'fragments_themes', 'theme, description, propose_at, valide_at, commentaire_prof, essai_actif, semestre_id')
  const themesActifs = sem ? themes.filter((t) => t.semestre_id === sem.id) : themes
  console.log(`  thèmes : ${themes.length} en tout, ${themesActifs.length} sur le semestre actif · essai_actif=true : ${themes.filter((t) => t.essai_actif).length}`)
  champTexte(themes, 'theme')
  champTexte(themes, 'description')
  champTexte(themes, 'commentaire_prof')
  for (const t of themes.slice(0, 12)) console.log(`    · (${(t.theme ?? '').length}) ${t.theme}`)

  // ── Semaines ──────────────────────────────────────────────────────────────
  sous('fragments_semaines — « Semaine N — Titre »')
  const semaines = await tout(c, 'fragments_semaines', 'id, numero, titre, ouverte, is_vacation, semestre_id')
  const semActives = sem ? semaines.filter((s) => s.semestre_id === sem.id) : semaines
  console.log(`  semaines : ${semaines.length} en tout, ${semActives.length} sur le semestre actif (${semActives.filter((s) => s.is_vacation).length} vacances, ${semActives.filter((s) => s.ouverte).length} ouvertes)`)
  champTexte(semaines, 'titre')
  const titresLongs = semaines.filter((s) => s.titre && s.titre.length > 40).slice(0, 5)
  for (const s of titresLongs) console.log(`    · S${s.numero} (${s.titre.length}) ${s.titre}`)

  // ── Dépôts : l'archive « semaines précédentes » ───────────────────────────
  sous('fragments_depots — taille de l\'archive par inscription')
  const depots = await tout(c, 'fragments_depots', 'id, inscription_id, semaine_id, statut, photos_suspectes')
  const parInscription = {}
  for (const d of depots) parInscription[d.inscription_id] = (parInscription[d.inscription_id] ?? 0) + 1
  console.log(`  dépôts : ${depots.length} · inscriptions avec dépôt : ${Object.keys(parInscription).length}`)
  console.log(`  dépôts par inscription : ${stats(Object.values(parInscription))}`)
  console.log(`  en retard : ${depots.filter((d) => d.statut === 'en_retard').length}`)

  // ── Analyses écrites publiées ─────────────────────────────────────────────
  sous('fragments_analyses (publiées) — le retour socratique')
  const analyses = await tout(c, 'fragments_analyses',
    'id, depot_id, note_decouvertes, note_sources, note_reflexions, commentaire_general, retour_progres, retour_langue, retour_style, retour_contenu, notes_prof, transcription, retour_lu_at, publiee_at',
    (q) => q.in('statut', ['publiee', 'generee']))
  console.log(`  analyses publiées ou générées : ${analyses.length} · retour non lu (retour_lu_at nul) : ${analyses.filter((a) => !a.retour_lu_at).length}`)
  console.log(`  notes nulles : découvertes ${nuls(analyses, 'note_decouvertes')} · sources ${nuls(analyses, 'note_sources')} · réflexions ${nuls(analyses, 'note_reflexions')}`)
  champTexte(analyses, 'commentaire_general', 'commentaire_general (« en un mot »)')
  champTexte(analyses, 'retour_progres')
  champTexte(analyses, 'retour_langue')
  champTexte(analyses, 'retour_style')
  champTexte(analyses, 'retour_contenu')
  champTexte(analyses, 'notes_prof')
  champTexte(analyses, 'transcription')
  const cg = analyses.filter((a) => a.commentaire_general).sort((a, b) => a.commentaire_general.length - b.commentaire_general.length)
  if (cg.length) {
    const m = cg[Math.floor(cg.length / 2)]
    console.log(`  commentaire_general MÉDIAN (${m.commentaire_general.length}) :\n    « ${m.commentaire_general.replace(/\n/g, ' ⏎ ')} »`)
    const phrases = cg.map((a) => a.commentaire_general.split(/(?<=[.!?])\s+/).length)
    console.log(`  phrases par commentaire_general : ${stats(phrases)}`)
    const premiere = cg.map((a) => a.commentaire_general.split(/(?<=[.!?])\s+/)[0].length)
    console.log(`  longueur de la PREMIÈRE phrase : ${stats(premiere)}`)
  }

  // ── Pistes ────────────────────────────────────────────────────────────────
  sous('fragments_pistes — la piste du « dernier retour replié »')
  const pistes = await tout(c, 'fragments_pistes', 'id, analyse_id, contenu, statut, est_rappel')
  const pistesParAnalyse = {}
  for (const p of pistes) pistesParAnalyse[p.analyse_id] = (pistesParAnalyse[p.analyse_id] ?? 0) + 1
  console.log(`  pistes : ${pistes.length} · rappels : ${pistes.filter((p) => p.est_rappel).length}`)
  console.log(`  pistes par analyse : ${stats(Object.values(pistesParAnalyse))}`)
  champTexte(pistes, 'contenu')
  const pm = [...pistes].filter((p) => p.contenu).sort((a, b) => a.contenu.length - b.contenu.length)
  if (pm.length) console.log(`  piste MÉDIANE (${pm[Math.floor(pm.length / 2)].contenu.length}) : « ${pm[Math.floor(pm.length / 2)].contenu} »`)

  // ── Oral ──────────────────────────────────────────────────────────────────
  sous('fragments_analyses_orales (publiées) — le retour d\'oral')
  const orales = await tout(c, 'fragments_analyses_orales',
    'id, commentaire_general, retour_integration, retour_pistes, retour_completude, retour_oral, note_contenu, note_structure, note_expression, notes_prof',
    (q) => q.not('publiee_at', 'is', null))
  console.log(`  analyses orales publiées : ${orales.length}`)
  for (const ch of ['commentaire_general', 'retour_integration', 'retour_pistes', 'retour_completude', 'retour_oral', 'notes_prof']) champTexte(orales, ch)
  const oraux = await tout(c, 'fragments_oraux', 'id, duree_secondes, nb_mots, audio_supprime, transcription')
  console.log(`  oraux : ${oraux.length} · audio supprimé : ${oraux.filter((o) => o.audio_supprime).length}`)
  champTexte(oraux, 'transcription')

  // ── Essai ─────────────────────────────────────────────────────────────────
  sous('fragments_essai_depot_analyses (publiées) — le retour d\'essai')
  const essais = await tout(c, 'fragments_essai_depot_analyses',
    'id, lettre_structure, lettre_expression, lettre_argumentation, lettre_connaissances, retour_structure, retour_expression, retour_argumentation, retour_connaissances, retour_parcours, synthese, note20_validee, note_visible_eleve, retour_lu_at',
    (q) => q.eq('statut', 'publiee'))
  console.log(`  analyses d'essai publiées : ${essais.length} · note visible : ${essais.filter((e) => e.note_visible_eleve).length} · non lues : ${essais.filter((e) => !e.retour_lu_at).length}`)
  for (const ch of ['retour_structure', 'retour_expression', 'retour_argumentation', 'retour_connaissances', 'retour_parcours', 'synthese']) champTexte(essais, ch)
  const epreuves = await tout(c, 'fragments_essais_epreuves', 'id, titre, consignes, depots_ouverts')
  console.log(`  épreuves : ${epreuves.length}`)
  champTexte(epreuves, 'titre')
  champTexte(epreuves, 'consignes')

  // ── Synthèse ──────────────────────────────────────────────────────────────
  sous('fragments_syntheses (publiées) — le bilan de semestre')
  const syntheses = await tout(c, 'fragments_syntheses', 'id, synthese, points_forts, axes_progres, note20_validee, note_visible_eleve', (q) => q.eq('statut', 'publiee'))
  console.log(`  synthèses publiées : ${syntheses.length} · note visible : ${syntheses.filter((s) => s.note_visible_eleve).length}`)
  for (const ch of ['synthese', 'points_forts', 'axes_progres']) champTexte(syntheses, ch)

  // ── Inscriptions avec le module ───────────────────────────────────────────
  sous('qui voit cet écran')
  const mod = verifie('modules', await c.from('modules').select('id').eq('slug', 'fragments-erudition').maybeSingle())
  const cm = mod ? await tout(c, 'classe_modules', 'classe_id', (q) => q.eq('module_id', mod.id)) : []
  const classes = cm.map((x) => x.classe_id)
  const insc = classes.length ? await tout(c, 'inscriptions', 'id, classe_id', (q) => q.in('classe_id', classes)) : []
  console.log(`  classes avec Fragments : ${classes.length} · inscriptions actives : ${insc.length}`)
}
