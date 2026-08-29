// ============================================================================
// RECETTE — LE CRLF DES `<textarea>`. Deux modes, et le second est l'épreuve.
// ----------------------------------------------------------------------------
// ⚠️⚠️ CE DÉFAUT EST STRUCTURELLEMENT INVISIBLE À L'OUTILLAGE. La soumission
//    d'un formulaire HTML normalise la valeur d'un `<textarea>` en CRLF ; ce qui
//    est STOCKÉ porte des LF. Or `tsc`, `eslint`, `npm test` et les scripts de
//    recette **passent tous** : aucun n'envoie un vrai formulaire, et
//    `new FormData(formulaire)` en JS ne montre RIEN — seule la soumission le
//    fait. Ce script ne prétend donc pas produire un CRLF : **il le SIMULE
//    exactement** (LF → CRLF) sur la donnée RÉELLE de la base, et fait tourner
//    l'expression du code AVANT et APRÈS.
//
// ⭐ `--epreuve` fait l'ÉPREUVE PAR L'ÉCHEC AVANT CELLE PAR LE SUCCÈS : sur
//    chaque corps réel, il montre la garde de découpe se déclencher À TORT avec
//    l'ancienne expression, et se taire avec la neuve.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/crlf-textarea.mjs
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/recette/crlf-textarea.mjs --epreuve
//
// ⛔ LECTURE SEULE, sur les DEUX bases. Aucune écriture, jamais.
// ============================================================================

// CONSTAT — combien de corps stockés portent déjà un \r ?
// ⚠️ supabase-js ne lève pas ({error}) et plafonne à 1000 lignes sans le dire :
//    on pagine, on ordonne sur une clé unique, et on confronte au count exact.
import fs from 'fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter(l => l.includes('=') && !l.trimStart().startsWith('#'))
  .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))

const BASES = [
  ['SANDBOX', env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY],
  ['PROD   ', env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY],
]

const CIBLES = [
  ['scriptorium_contenus', 'texte_extrait', '⭐ le corps que sert le RAG'],
  ['scriptorium_documents', 'texte_extrait', 'documents de biblio'],
  ['exercices', 'consigne_instanciee', 'le texte que l’élève LIT'],
  ['exercices', 'appui', 'l’appui de la consigne'],
  ['exercices_depots', 'transcription_v1', '✅ témoin : normalisé à l’écriture'],
  ['quazian_flashcards', 'recto', 'flashcard'],
  ['quazian_flashcards', 'verso', 'flashcard'],
  ['scriptorium_contenu_sections', 'texte', 'la découpe'],
]

const PAGE = 1000
function lu(quoi, { data, error }) { if (error) throw new Error(`${quoi} : ${error.message}`); return data }

for (const [nom, url, cle] of BASES) {
  if (!url || !cle) { console.log(`\n### ${nom} — identifiants absents, sautée`); continue }
  const db = createClient(url, cle, { auth: { persistSession: false } })
  console.log(`\n### ${nom}`)
  for (const [table, col, quoi] of CIBLES) {
    let total = 0, avecCR = 0, multi = 0, exemplesCR = 0, page = 0, dernier = null
    try {
      const { count, error: eC } = await db.from(table).select('id', { count: 'exact', head: true })
      if (eC) { console.log(`  ${table}.${col.padEnd(20)} — absente ou illisible (${eC.message.slice(0, 50)})`); continue }
      for (;;) {
        let q = db.from(table).select(`id, ${col}`).order('id', { ascending: true }).limit(PAGE)
        if (dernier) q = q.gt('id', dernier)
        const lignes = lu(`${table}.${col} p${page}`, await q)
        if (!lignes.length) break
        for (const l of lignes) {
          total++
          const v = l[col]
          if (typeof v !== 'string') continue
          if (v.includes('\n')) multi++
          if (v.includes('\r')) { avecCR++; if (exemplesCR < 1) { exemplesCR++; console.log(`      ↳ ex. id=${l.id} — ${(v.match(/\r/g) || []).length} CR`) } }
        }
        dernier = lignes[lignes.length - 1].id
        page++
        if (lignes.length < PAGE) break
      }
      const alerte = avecCR > 0 ? '⛔' : '  '
      const coherent = count === total ? '' : `  ⚠️ count exact=${count} ≠ parcouru=${total}`
      const risque = multi > 0 ? `${String(multi).padStart(4)} multi-lignes (donc EXPOSÉES)` : '   0 multi-ligne — rien à exposer'
      console.log(`  ${alerte} ${(table + '.' + col).padEnd(42)} \\r : ${String(avecCR).padStart(4)}/${String(total).padStart(4)}  ·  ${risque}   — ${quoi}${coherent}`)
    } catch (e) {
      console.log(`  ${table}.${col.padEnd(20)} — ${String(e.message).slice(0, 70)}`)
    }
  }
}


// ═════════════════════════════════════════════════════════════════════════════
// L'ÉPREUVE — sur la donnée RÉELLE, l'ancienne expression contre la neuve.
// ═════════════════════════════════════════════════════════════════════════════
if (process.argv.includes('--epreuve')) {
  // Ce que le navigateur fait à la soumission, et que rien en Node ne fait.
  const commeLeNavigateurSoumet = (t) => t.replace(/\r\n?|\n/g, '\r\n')
  // `utils/passation/transcription-calcul.ts` — la garde, recopiée à l'identique.
  const normaliserRetours = (t) => t.replace(/\r\n?/g, '\n')

  for (const [nom, url, cle] of BASES) {
    if (!url || !cle) continue
    const db = createClient(url, cle, { auth: { persistSession: false } })
    console.log(`\n═══ ÉPREUVE — ${nom.trim()}`)
    const { data, error } = await db.from('scriptorium_contenus')
      .select('id, titre, type, texte_extrait').order('id').limit(1000)
    if (error) { console.log(`  illisible : ${error.message}`); continue }
    const multi = (data ?? []).filter(r => typeof r.texte_extrait === 'string' && r.texte_extrait.includes('\n'))
    if (!multi.length) { console.log('  aucun corps multi-ligne — rien à éprouver ici'); continue }

    let tortAvant = 0, tortApres = 0
    for (const r of multi) {
      const stocke = r.texte_extrait
      const soumis = commeLeNavigateurSoumet(stocke)          // ce que l'action reçoit VRAIMENT

      // La garde de découpe, `app/prof/scriptorium/actions.ts:805` :
      //   (actuel.texte_extrait ?? '').trim() !== (texte ?? '')
      const avant = stocke.trim() !== soumis.trim()                        // AVANT : brut
      const apres = stocke.trim() !== normaliserRetours(soumis).trim()     // APRÈS : normalisé
      if (avant) tortAvant++
      if (apres) tortApres++
      const nl = (stocke.match(/\n/g) || []).length
      console.log(`  ${(r.titre ?? r.id).slice(0, 44).padEnd(46)} ${String(nl).padStart(4)} lignes` +
        `   AVANT ${avant ? '⛔ la garde se déclenche À TORT' : '   silencieuse'}` +
        `   ·   APRÈS ${apres ? '⛔ ENCORE À TORT' : '✅ silencieuse'}`)
    }
    console.log(`  ── ${multi.length} corps multi-lignes · gardes déclenchées à tort : ` +
      `AVANT ${tortAvant}/${multi.length}   →   APRÈS ${tortApres}/${multi.length}`)

    // ⛔⛔ LA MOITIÉ QU'ON OUBLIE : une garde qui ne se déclenche PLUS JAMAIS
    //    n'est pas corrigée, elle est morte. La condition de reprise du
    //    `SUIVI_tests_manuels.md` demande LES DEUX — « un enregistrement SANS
    //    changement ne demande plus rien, ET un changement RÉEL demande toujours
    //    confirmation ». On éprouve donc aussi le cas où elle DOIT parler.
    let muette = 0
    for (const r of multi) {
      const stocke = r.texte_extrait
      const vraiChangement = commeLeNavigateurSoumet(stocke + '\nUn paragraphe ajouté par le professeur.')
      if (stocke.trim() === normaliserRetours(vraiChangement).trim()) muette++
    }
    console.log(`  ── contre-épreuve : sur un VRAI changement de texte, la garde reste muette ` +
      `${muette}/${multi.length} fois   ${muette === 0 ? '✅ elle parle toujours quand il faut' : '⛔ ELLE EST MORTE'}`)
    if (tortAvant === 0) console.log('  ⚠️ L\'épreuve NE MORD PAS ici : sans faux déclenchement avant, elle ne prouve rien.')
    else if (tortApres === 0) console.log('  ⭐ Épreuve concluante : l\'échec d\'abord, le succès ensuite.')
  }

  // Le second coût — ce qui est ÉCRIT. Le corps stocké doit cesser de dériver.
  console.log('\n═══ ÉPREUVE — L\'ÉCRITURE (ce qui part en base)')
  const corps = 'Premier paragraphe.\n\nDeuxième paragraphe.\nSa suite.'
  const soumis = corps.replace(/\n/g, '\r\n')
  const ecritAvant = soumis.trim()
  const ecritApres = soumis.replace(/\r\n?/g, '\n').trim()
  console.log(`  ce que le prof a tapé     : ${JSON.stringify(corps)}`)
  console.log(`  ce que l'action REÇOIT    : ${JSON.stringify(soumis)}`)
  console.log(`  AVANT — écrit en base     : ${JSON.stringify(ecritAvant)}  ${ecritAvant === corps ? '✅' : '⛔ DÉRIVE'}`)
  console.log(`  APRÈS — écrit en base     : ${JSON.stringify(ecritApres)}  ${ecritApres === corps ? '✅ identique à la frappe' : '⛔ DÉRIVE'}`)

  // Et le troisième — le découpage en sections, `actions.ts:1061` : texte.split('\n')
  console.log('\n═══ ÉPREUVE — LE DÉCOUPAGE EN SECTIONS (split sur le saut de ligne)')
  const avantD = soumis.split('\n')
  const apresD = soumis.replace(/\r\n?/g, '\n').split('\n')
  console.log(`  AVANT : ${JSON.stringify(avantD)}`)
  console.log(`  APRÈS : ${JSON.stringify(apresD)}`)
  console.log(`  ${avantD.some(l => l.includes('\r')) ? '⛔ un \\r en queue de chaque ligne stockée' : '✅ aucune queue'}` +
    `   →   ${apresD.some(l => l.includes('\r')) ? '⛔ encore' : '✅ propre'}`)
}
