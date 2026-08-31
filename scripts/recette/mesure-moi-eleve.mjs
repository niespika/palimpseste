// ============================================================================
// MESURE — ÉPREUVE DU HANDOFF `design_handoff_moi_eleve` CONTRE LA BASE.
// ----------------------------------------------------------------------------
// ⛔ LECTURE SEULE. Aucune écriture, aucun interrupteur touché, aucun décor semé.
//
// ⭐⭐ « Un handoff de design s'ÉPROUVE avant de se suivre » (`AGENTS.md`) :
//    avant d'écrire une ligne, MESURER dans la base la longueur et le nombre
//    RÉELS de chaque champ que la maquette affiche.
//
// ⭐ ON APPELLE LE VRAI CHARGEUR — `chargerLeProfilDeLEleve` — jamais un miroir :
//    « un miroir du code doit copier LE tokeniseur ». Ce que l'écran rendra est
//    exactement ce que ce script mesure.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/mesure-moi-eleve.mjs [sandbox|prod|deux]
// ============================================================================

import { register } from 'node:module'

register('data:text/javascript,' + encodeURIComponent(`
const CARTE = {
  'next/navigation': 'next/navigation.js',
  'next/headers': 'next/headers.js',
  'next/cache': 'next/cache.js',
}
export async function resolve(specifier, contexte, suivant) {
  if (CARTE[specifier]) return suivant(CARTE[specifier], contexte)
  return suivant(specifier, contexte)
}
`))

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.cwd()

const { chargerLeProfilDeLEleve } = await import(`${RACINE}/utils/eleve/profil-serveur.ts`)
const { chargerLesFichesDeCompetence, lireLeChoixDesLettres } =
  await import(`${RACINE}/utils/eleve/fiche-serveur.ts`)
const { listeDesForces, motDeLaProgression, motDuDecompte, phraseDuGeste, dimensionsRegardees } =
  await import(`${RACINE}/utils/eleve/profil.ts`)
const { titreDeLaConsigne } = await import(`${RACINE}/utils/codex-onglets/regles.ts`)
const { FENETRE_EVIDENCE } = await import(`${RACINE}/utils/routeur/config.ts`)
const { NOM_COMPETENCE } = await import(`${RACINE}/utils/competences-classe.ts`)
const { COMPETENCES } = await import(`${RACINE}/utils/chaine/types.ts`)

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

/** min · médiane · max · n — sur des longueurs de chaîne. */
function stats(valeurs) {
  if (valeurs.length === 0) return 'aucune valeur'
  const t = [...valeurs].sort((a, b) => a - b)
  const med = t.length % 2 ? t[(t.length - 1) / 2] : Math.round((t[t.length / 2 - 1] + t[t.length / 2]) / 2)
  return `n=${t.length} · min ${t[0]} · médiane ${med} · max ${t[t.length - 1]}`
}

function verifie(ou, { data, error }) {
  if (error) throw new Error(`${ou} — ${error.code ?? ''} ${error.message}`)
  return data
}

// ── Pagination : supabase-js PLAFONNE À 1000 LIGNES SANS RIEN DIRE ──────────
async function toutes(construireRequete, ou) {
  const out = []
  for (let debut = 0; ; debut += 1000) {
    const { data, error } = await construireRequete().range(debut, debut + 999)
    if (error) throw new Error(`${ou} — ${error.code ?? ''} ${error.message}`)
    out.push(...(data ?? []))
    if ((data ?? []).length < 1000) break
  }
  return out
}

for (const base of bases) {
  const admin = clients[base]()
  titre(`BASE : ${base.toUpperCase()}  (${base === 'prod' ? env.PROD_SUPABASE_URL : env.NEXT_PUBLIC_SUPABASE_URL})`)

  // ══════════════════════════════════════════════════════════════════════════
  // 0. LES INTERRUPTEURS — l'allumage SE MESURE, base par base
  // ══════════════════════════════════════════════════════════════════════════
  sous('0. Les interrupteurs (mesurés, pas lus dans un document)')
  const params = verifie('scriptorium_params', await admin.from('scriptorium_params')
    .select('competences_affichage_actif, chaine_actif, exercices_actif, routeur_actif').limit(1).maybeSingle())
  console.log(`competences_affichage_actif = ${params?.competences_affichage_actif}`)
  console.log(`chaine_actif = ${params?.chaine_actif} · exercices_actif = ${params?.exercices_actif} · routeur_actif = ${params?.routeur_actif}`)

  // ══════════════════════════════════════════════════════════════════════════
  // 1. LES DIMENSIONS — la colonne droite « Les points regardés · tes marques »
  // ══════════════════════════════════════════════════════════════════════════
  sous('1. `competences_correspondance.dimension_eleve` — la liste de la colonne droite')
  const corresp = await toutes(() => admin.from('competences_correspondance')
    .select('competence, observable_code, dimension_eleve, ordre').order('competence').order('ordre'),
  'correspondance')
  const parComp = new Map()
  for (const d of corresp) {
    const l = parComp.get(d.competence) ?? []
    l.push(d)
    parComp.set(d.competence, l)
  }
  console.log(`total lignes : ${corresp.length}`)
  for (const c of COMPETENCES) {
    const l = parComp.get(c) ?? []
    const dims = dimensionsRegardees(l.map((d) => ({
      observableCode: d.observable_code, dimensionEleve: d.dimension_eleve ?? '', ordre: d.ordre ?? 0,
    })))
    const longueurs = dims.map((d) => d.length)
    console.log(`  ${c.padEnd(15)} lignes ${String(l.length).padStart(3)} · dimensions DISTINCTES ${String(dims.length).padStart(3)} · longueurs ${stats(longueurs)}`)
    if (dims.length) {
      const plusLongue = dims.reduce((a, b) => (b.length > a.length ? b : a))
      console.log(`     + la plus longue (${plusLongue.length}) : « ${plusLongue} »`)
      console.log(`     + la 1re                (${dims[0].length}) : « ${dims[0]} »`)
    }
  }
  const toutesDims = COMPETENCES.flatMap((c) => dimensionsRegardees((parComp.get(c) ?? []).map((d) => ({
    observableCode: d.observable_code, dimensionEleve: d.dimension_eleve ?? '', ordre: d.ordre ?? 0,
  }))))
  console.log(`  TOUTES compétences : ${toutesDims.length} dimensions · longueurs ${stats(toutesDims.map((d) => d.length))}`)
  console.log(`  dimensions > 40 car. : ${toutesDims.filter((d) => d.length > 40).length} · > 60 car. : ${toutesDims.filter((d) => d.length > 60).length}`)

  // ══════════════════════════════════════════════════════════════════════════
  // 2. LE PARAGRAPHE « CE QU'ON REGARDE DANS <la compétence> »
  // ══════════════════════════════════════════════════════════════════════════
  sous('2. `competences_fiches` §1.1 — le paragraphe de la colonne droite')
  const { fiches, ecartees, incidents: incFiches } = await chargerLesFichesDeCompetence(admin)
  console.log(`fiches rendues : ${fiches.length} · écartées : ${ecartees.map((e) => e.competence).join(', ') || 'aucune'}`)
  if (incFiches.length) console.log(`  incidents : ${incFiches.join(' · ')}`)
  for (const f of fiches) {
    const lignes = f.texte.split('\n').filter((l) => l.trim())
    console.log(`  ${f.competence.padEnd(15)} v${String(f.version).padEnd(5)} texte ${String(f.texte.length).padStart(4)} car. · ${lignes.length} paragraphe(s) · ${f.texte.split(/\s+/).length} mots · dimensions ${f.dimensions.length}`)
  }
  console.log(`  longueurs du §1.1 : ${stats(fiches.map((f) => f.texte.length))}`)
  if (fiches[0]) {
    console.log(`\n  ÉCHANTILLON — ${fiches[0].competence} (${fiches[0].texte.length} car.) :`)
    console.log('  ' + fiches[0].texte.replace(/\n/g, '\n  '))
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. LES ÉLÈVES — et le profil RÉEL de chacun
  // ══════════════════════════════════════════════════════════════════════════
  sous('3. Les élèves, leur nom, leur classe')
  const eleves = await toutes(() => admin.from('profiles')
    .select('id, display_name, competences_lettres_affichees').eq('role', 'eleve').order('id'), 'profiles')
  console.log(`élèves : ${eleves.length}`)
  const noms = eleves.map((e) => (e.display_name ?? '').trim()).filter(Boolean)
  console.log(`  display_name renseigné : ${noms.length}/${eleves.length} · longueurs ${stats(noms.map((n) => n.length))}`)
  if (noms.length) console.log(`  le plus long : « ${noms.reduce((a, b) => (b.length > a.length ? b : a))} »`)
  console.log(`  competences_lettres_affichees = true : ${eleves.filter((e) => e.competences_lettres_affichees === true).length} · false : ${eleves.filter((e) => e.competences_lettres_affichees === false).length} · NULL : ${eleves.filter((e) => e.competences_lettres_affichees == null).length}`)

  const classes = await toutes(() => admin.from('classes').select('id, nom').order('id'), 'classes')
  const nomsClasse = classes.map((c) => (c.nom ?? '').trim()).filter(Boolean)
  console.log(`  classes : ${classes.length} · noms ${stats(nomsClasse.map((n) => n.length))} · ex. ${nomsClasse.slice(0, 4).map((n) => `« ${n} »`).join(' ')}`)

  // ══════════════════════════════════════════════════════════════════════════
  // 4. LES NIVEAUX — la lettre, et `profil_provisoire`
  // ══════════════════════════════════════════════════════════════════════════
  sous('4. `competences_niveaux` — la lettre et la garde')
  const niveaux = await toutes(() => admin.from('competences_niveaux')
    .select('eleve_id, competence, lettre, profil_provisoire').order('eleve_id'), 'niveaux')
  console.log(`lignes : ${niveaux.length} · élèves distincts : ${new Set(niveaux.map((n) => n.eleve_id)).size}`)
  console.log(`  profil_provisoire = true : ${niveaux.filter((n) => n.profil_provisoire === true).length} · false : ${niveaux.filter((n) => n.profil_provisoire === false).length}`)
  const lettres = {}
  for (const n of niveaux) lettres[n.lettre ?? 'NULL'] = (lettres[n.lettre ?? 'NULL'] ?? 0) + 1
  console.log(`  lettres : ${Object.entries(lettres).map(([k, v]) => `${k}=${v}`).join(' · ')}`)

  // ══════════════════════════════════════════════════════════════════════════
  // 5. LES MESURES — le `n` de la jauge de quatre crans
  // ══════════════════════════════════════════════════════════════════════════
  sous(`5. \`competences_mesures\` — le \`n\` de la jauge (fenêtre = ${FENETRE_EVIDENCE})`)
  const mesures = await toutes(() => admin.from('competences_mesures')
    .select('id, eleve_id, competence, mesure_at, depot_id').order('id'), 'mesures')
  console.log(`mesures : ${mesures.length}`)
  const paires = new Map()
  for (const m of mesures) {
    const k = `${m.eleve_id}|${m.competence}`
    paires.set(k, (paires.get(k) ?? 0) + 1)
  }
  const distN = {}
  for (const v of paires.values()) distN[v] = (distN[v] ?? 0) + 1
  console.log(`  paires (élève × compétence) avec ≥1 mesure BRUTE : ${paires.size}`)
  console.log(`  distribution du nombre BRUT : ${Object.entries(distN).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k} mesure(s)→${v} paires`).join(' · ')}`)

  // ══════════════════════════════════════════════════════════════════════════
  // 6. « LES QUATRE EXERCICES COMPTÉS » — titre + date ?
  // ══════════════════════════════════════════════════════════════════════════
  sous('6. « Les quatre exercices comptés » — le TITRE existe-t-il ?')
  const avecDepot = mesures.filter((m) => m.depot_id)
  console.log(`mesures avec un \`depot_id\` : ${avecDepot.length}/${mesures.length}`)
  if (avecDepot.length) {
    const depotIds = [...new Set(avecDepot.map((m) => m.depot_id))]
    const depots = []
    for (let i = 0; i < depotIds.length; i += 200) {
      depots.push(...verifie('depots', await admin.from('exercices_depots')
        .select('id, exercice_id').in('id', depotIds.slice(i, i + 200))))
    }
    const exIds = [...new Set(depots.map((d) => d.exercice_id).filter(Boolean))]
    const exos = []
    for (let i = 0; i < exIds.length; i += 200) {
      exos.push(...verifie('exercices', await admin.from('exercices')
        .select('id, consigne_instanciee, lieu').in('id', exIds.slice(i, i + 200))))
    }
    console.log(`  dépôts joints : ${depots.length} · exercices joints : ${exos.length}`)
    const titres = exos.map((e) => titreDeLaConsigne(e.consigne_instanciee))
    console.log(`  ⛔ « titre » = titreDeLaConsigne(consigne_instanciee) — longueurs ${stats(titres.map((t) => t.length))}`)
    console.log(`  titres > 60 car. : ${titres.filter((t) => t.length > 60).length}/${titres.length} · > 100 : ${titres.filter((t) => t.length > 100).length}/${titres.length}`)
    console.log(`  repli « Exercice » (aucune consigne) : ${titres.filter((t) => t === 'Exercice').length}`)
    for (const t of titres.slice(0, 3)) console.log(`     · (${t.length}) « ${t.slice(0, 160)}${t.length > 160 ? '…' : ''} »`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 7. LE GESTE — « ta prochaine étape »
  // ══════════════════════════════════════════════════════════════════════════
  sous('7. `exercices_retours.action_revision` — « ta prochaine étape »')
  const retours = await toutes(() => admin.from('exercices_retours')
    .select('id, depot_id, action_revision, published_at').order('id'), 'retours')
  const publies = retours.filter((r) => r.published_at)
  const avecAction = publies.filter((r) => typeof r.action_revision?.texte === 'string' && r.action_revision.texte.trim())
  console.log(`retours : ${retours.length} · publiés : ${publies.length} · publiés AVEC action_revision.texte : ${avecAction.length}`)
  const textesGeste = avecAction.map((r) => r.action_revision.texte.trim())
  console.log(`  longueurs du geste : ${stats(textesGeste.map((t) => t.length))}`)
  if (textesGeste.length) {
    const plusLong = textesGeste.reduce((a, b) => (b.length > a.length ? b : a))
    console.log(`  le plus long (${plusLong.length}) : « ${plusLong.slice(0, 400)}${plusLong.length > 400 ? '…' : ''} »`)
    console.log(`  le plus court (${textesGeste.reduce((a, b) => (b.length < a.length ? b : a)).length}) : « ${textesGeste.reduce((a, b) => (b.length < a.length ? b : a))} »`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 8. LE PROFIL RÉEL, ÉLÈVE PAR ÉLÈVE — par le VRAI chargeur
  // ══════════════════════════════════════════════════════════════════════════
  sous('8. `chargerLeProfilDeLEleve` — ce que l’écran rendra VRAIMENT')
  const echantillon = eleves
  let avecUneMesure = 0
  const totForces = []
  const totMotifs = []
  const totIncidents = []
  const nParCompetence = {}
  let lettresAffichees = 0
  const lignesDetail = []
  for (const e of echantillon) {
    const choix = await lireLeChoixDesLettres(admin, e.id)
    const p = await chargerLeProfilDeLEleve(admin, e.id, choix)
    const nTotal = p.competences.reduce((s, c) => s + c.n, 0)
    if (nTotal > 0) avecUneMesure++
    for (const c of p.competences) {
      nParCompetence[c.n] = (nParCompetence[c.n] ?? 0) + 1
      if (c.lettre) lettresAffichees++
      const f = listeDesForces(c.forces)
      if (f) totForces.push(f.noms.length)
    }
    const motifs = [...new Set(p.competences.filter((c) => !c.lettre && c.motDeLaLettre).map((c) => c.motDeLaLettre))]
    totMotifs.push(motifs.length)
    totIncidents.push(p.incidents.length)
    if (nTotal > 0 || p.geste) {
      lignesDetail.push({ e, p, nTotal, choix })
    }
  }
  console.log(`élèves passés au chargeur : ${echantillon.length}`)
  console.log(`  élèves avec AU MOINS UNE mesure qui compte : ${avecUneMesure}`)
  console.log(`  distribution de \`n\` sur les ${echantillon.length * 6} cellules (élève × compétence) : `
    + Object.entries(nParCompetence).sort((a, b) => a[0] - b[0]).map(([k, v]) => `n=${k}→${v}`).join(' · '))
  console.log(`  cellules à n ≥ ${FENETRE_EVIDENCE} (fenêtre pleine) : ${Object.entries(nParCompetence).filter(([k]) => Number(k) >= FENETRE_EVIDENCE).reduce((s, [, v]) => s + v, 0)}`)
  console.log(`  LETTRES effectivement affichées (les 3 conditions) : ${lettresAffichees} sur ${echantillon.length * 6}`)
  console.log(`  listes de forces non vides : ${totForces.length} · nombre de puces ${stats(totForces)}`)
  console.log(`  motifs du silence DISTINCTS par élève : ${stats(totMotifs)}`)
  console.log(`  incidents par élève : ${stats(totIncidents)}`)

  sous('8b. Le détail des élèves qui ont de la matière')
  for (const { e, p, nTotal, choix } of lignesDetail.slice(0, 12)) {
    console.log(`\n  ── ${(e.display_name ?? '(sans nom)')} · n total ${nTotal} · choix des lettres ${choix}`)
    for (const c of p.competences) {
      const mot = c.n === 0 ? motDuDecompte(c.n) : `${motDuDecompte(c.n)} · ${motDeLaProgression(c.progression)}`
      const f = listeDesForces(c.forces)
      console.log(`     ${NOM_COMPETENCE[c.competence].padEnd(16)} n=${c.n} lettre=${c.lettre ?? '—'} · « ${mot} » (${mot.length} car.)`)
      if (f) console.log(`        forces (${f.noms.length}) : ${f.noms.map((n) => `« ${n} » (${n.length})`).join(' · ')}`)
    }
    const ph = phraseDuGeste(p.geste)
    console.log(`     geste : « ${ph} » (${ph.length} car.)`)
    if (p.geste) console.log(`        texte (${p.geste.texte.length} car.) : « ${p.geste.texte.slice(0, 300)}${p.geste.texte.length > 300 ? '…' : ''} » · compétence ${p.geste.competence ?? '—'} · href ${p.geste.href}`)
    if (p.incidents.length) console.log(`     incidents : ${p.incidents.join(' | ')}`)
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 9. LES MOTS DE `profil.ts` — leur longueur MAXIMALE possible
  // ══════════════════════════════════════════════════════════════════════════
  sous('9. Les mots verbatim de `profil.ts` — longueurs')
  for (const n of [0, 1, 2, 3, 4, 5, 12]) {
    const d = motDuDecompte(n)
    console.log(`  motDuDecompte(${String(n).padStart(2)}) = « ${d} » (${d.length})`)
  }
  for (const etat of ['progres', 'stagnation', 'ni_progres_ni_stagnation', 'pas_assez_de_mesures']) {
    for (const n of etat === 'pas_assez_de_mesures' ? [0, 1, 3] : [4]) {
      const m = motDeLaProgression({ etat, n, manquePourLeDire: 0, motif: null })
      console.log(`  motDeLaProgression(${etat}, n=${n}) = « ${m} » (${m.length})`)
    }
  }
  const ph0 = phraseDuGeste(null)
  console.log(`  phraseDuGeste(null) = « ${ph0} » (${ph0.length})`)
  const ph1 = phraseDuGeste({ texte: 'x', competence: null, publieLe: '', href: '' })
  console.log(`  phraseDuGeste(sans compétence) = « ${ph1} » (${ph1.length})`)
  const ph2 = phraseDuGeste({ texte: 'x', competence: 'argumentation', publieLe: '', href: '' })
  console.log(`  phraseDuGeste(avec compétence) = « ${ph2} » (${ph2.length})`)
  console.log(`  NOM_COMPETENCE : ${COMPETENCES.map((c) => `« ${NOM_COMPETENCE[c]} » (${NOM_COMPETENCE[c].length})`).join(' · ')}`)
}

console.log('\n✔ mesure terminée — aucune écriture.')
