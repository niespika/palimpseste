// ============================================================================
// MESURES — Aletheia, étayage par niveau (spec § 0 et § 13). LECTURE SEULE.
// ----------------------------------------------------------------------------
//   node scripts/recette/aletheia-mesures.mjs --base prod|sandbox [--depuis 2026-09-07] [--json fichier]
// Les CINQ mesures du § 0, rejouables avant et après l'allumage (E9), plus les compteurs
// propres à l'étayage (rappel, réponses aux relances, surlignages, comparaison de la
// synthèse, « je ne sais pas », formes servies) quand les colonnes existent.
//   · prod    : PostgREST avec PROD_SUPABASE_URL / PROD_SUPABASE_SECRET_KEY (jamais psql) ;
//   · sandbox : PostgREST avec NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.
// Tolérant : une colonne absente (migration non jouée) ⇒ le compteur est « n/a ».
// ============================================================================
import fs from 'node:fs'

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d }
const BASE = arg('--base', 'sandbox'), DEPUIS = arg('--depuis', null), JSON_OUT = arg('--json', null)
const env = Object.fromEntries(fs.readFileSync('/Users/louissagnieres/Documents/GitHub/palimpseste/.env.local', 'utf8').split('\n')
  .filter(l => l.includes('=') && !l.startsWith('#'))
  .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')] }))
const [U, K] = BASE === 'prod' ? [env.PROD_SUPABASE_URL, env.PROD_SUPABASE_SECRET_KEY] : [env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY]
if (!U || !K) { console.error('variables manquantes pour', BASE); process.exit(2) }
console.log(`base : ${BASE} (${U.replace(/^https?:\/\//, '').split('.')[0]})${DEPUIS ? ` · travaux créés depuis ${DEPUIS}` : ''}`)

async function get(path) {
  const r = await fetch(`${U}/rest/v1/${path}`, { headers: { apikey: K, Authorization: `Bearer ${K}` } })
  if (!r.ok) throw new Error(`${r.status} ${path} : ${(await r.text()).slice(0, 200)}`)
  return r.json()
}
/** Sélection tolérante : si une colonne manque, on la retire et on réessaie (la clé vaut alors undefined). */
async function getTolerant(table, colonnes, filtre = '') {
  const cols = [...colonnes]
  for (;;) {
    try { return { rows: await get(`${table}?select=${cols.join(',')}${filtre}`), absentes: colonnes.filter(c => !cols.includes(c)) } }
    catch (e) {
      const m = /column (?:\w+\.)?(\w+) does not exist/.exec(String(e.message))
      const col = m?.[1] ?? cols.find(c => String(e.message).includes(c))
      if (!col || !cols.includes(col)) throw e
      cols.splice(cols.indexOf(col), 1)
    }
  }
}
const L = s => ((s ?? '').trim() ? String(s).trim().split(/\s+/).length : 0)
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2 }
const norm = s => (s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/’/g, "'").replace(/œ/g, 'oe').replace(/[^a-z0-9]+/g, ' ').trim()
const iso = s => new Date(s)

const { rows: travaux, absentes } = await getTolerant('aletheia_travaux',
  ['id', 'eleve_id', 'scriptorium_livre_id', 'semaine_index', 'statut', 'these', 'arguments', 'accord', 'questions', 'these_vf', 'arguments_vf', 'accord_vf',
    'retour_v1', 'retour_vf', 'created_at', 'updated_at', 'retour_vf_lu_at',
    'forme', 'rappel', 'reponses_relances', 'retour_vf_agi', 'comparaison_synthese'],
  DEPUIS ? `&created_at=gte.${DEPUIS}` : '')
const rows = travaux.filter(r => r.statut !== 'DRAFT')
const M = {}
M.travaux = rows.length
M.eleves = new Set(rows.map(r => r.eleve_id)).size
M.livres = new Set(rows.map(r => r.scriptorium_livre_id)).size
if (absentes.length) console.log('colonnes absentes (migrations non jouées) :', absentes.join(', '))

// ── 1. Thèse laissée identique V1 → VF ──
const avecVf = rows.filter(r => r.these_vf != null)
M.these_identique = { n: avecVf.filter(r => (r.these ?? '').trim() === (r.these_vf ?? '').trim()).length, sur: avecVf.length }

// ── 2. Ajouts de la VF non ancrés ──
const rf = rows.map(r => r.retour_vf).filter(Boolean)
M.ajouts_non_ancres = { n: rf.reduce((n, x) => n + (x.ajouts_verifies ?? []).filter(a => a.ancre === false).length, 0), sur: rf.reduce((n, x) => n + (x.ajouts_verifies ?? []).length, 0) }

// ── 3. Durée V1 → clôture ──
const durees = rows.filter(r => r.retour_vf_lu_at).map(r => (iso(r.retour_vf_lu_at) - iso(r.created_at)) / 60000)
M.duree_minutes = { mediane: med(durees) == null ? null : Math.round(med(durees)), min: durees.length ? Math.round(Math.min(...durees)) : null, sur: durees.length }

// ── 4. Longueur du retour final (et du retour V1) ──
const motsVf = x => L(x.synthese_modele) + L((x.nuances_et_erreurs ?? []).join(' ')) + L((x.architecture_amont ?? []).join(' ')) + L((x.architecture_aval_jalons ?? []).join(' ')) + L((x.ajouts_verifies ?? []).map(a => a.note ?? '').join(' '))
M.retour_vf_mots = { mediane: med(rf.map(motsVf)), max: rf.length ? Math.max(...rf.map(motsVf)) : null, synthese_mediane: med(rf.map(x => L(x.synthese_modele))) }
const r1 = rows.map(r => r.retour_v1).filter(Boolean)
const motsV1 = x => L((x.relances ?? []).join(' ')) + L(x.accord) + L((x.reponses_questions ?? []).join(' ')) + L((x.vocabulaire ?? []).map(v => v.definition ?? '').join(' ')) + L(x.rappel?.phrase)
M.retour_v1_mots = { mediane: med(r1.map(motsV1)), max: r1.length ? Math.max(...r1.map(motsV1)) : null, relances_mediane: med(r1.map(x => (x.relances ?? []).length)) }

// ── 5. Citations du livre par l'IA, retrouvées verbatim ──
const livres = [...new Set(rows.map(r => r.scriptorium_livre_id))]
const docs = livres.length ? await get(`scriptorium_documents?select=unite_id,semaine,texte_extrait&unite_id=in.(${livres.join(',')})&texte_extrait=not.is.null`) : []
const texteDe = new Map()
for (const d of docs) texteDe.set(`${d.unite_id}:${d.semaine}`, (texteDe.get(`${d.unite_id}:${d.semaine}`) ?? '') + ' ' + norm(d.texte_extrait))
let cites = 0, verbatim = 0
for (const r of rows) {
  const eleve = norm([r.these, r.arguments, r.accord, r.these_vf, r.arguments_vf, r.accord_vf, ...(r.questions ?? [])].join(' '))
  const blobs = [...((r.retour_v1 ?? {}).relances ?? []), ...((r.retour_v1 ?? {}).reponses_questions ?? []), (r.retour_v1 ?? {}).accord ?? '', ...((r.retour_vf ?? {}).nuances_et_erreurs ?? []), (r.retour_vf ?? {}).synthese_modele ?? '']
  const t = texteDe.get(`${r.scriptorium_livre_id}:${r.semaine_index}`) ?? ''
  for (const b of blobs) for (const re of [/«\s*([^»]{12,160})\s*»/g, /"([^"]{12,160})"/g]) {
    for (const m of String(b).matchAll(re)) { const c = norm(m[1]); if (!c || eleve.includes(c)) continue; cites++; if (t.includes(c)) verbatim++ }
  }
}
M.citations_verbatim = { n: verbatim, sur: cites }

// ── Compteurs de l'étayage (colonnes E2 → E8, quand elles existent) ──
const ok = c => !absentes.includes(c)
M.etayage = {
  formes: ok('forme') ? Object.fromEntries(['montre', 'fenetre', 'demi_section'].map(f => [f, rows.filter(r => r.forme === f).length])) : 'n/a',
  rappels: ok('rappel') ? { donnes: rows.filter(r => (r.rappel ?? '').trim()).length, juges: Object.fromEntries(['juste', 'partiel', 'a_cote'].map(v => [v, r1.filter(x => x.rappel?.verdict === v).length])) } : 'n/a',
  relances_avec_passage: { n: r1.reduce((n, x) => n + (x.relances_detail ?? []).filter(d => d.passage).length, 0), sur: r1.reduce((n, x) => n + (x.relances ?? []).length, 0) },
  reponses_relances: ok('reponses_relances') ? rows.reduce((n, r) => n + (r.reponses_relances ?? []).filter(e => (e.texte ?? '').trim()).length, 0) : 'n/a',
  surlignages: ok('reponses_relances') ? Object.fromEntries(['juste', 'presque', 'trop_large', 'bon_endroit', 'ailleurs'].map(v => [v, rows.reduce((n, r) => n + (r.reponses_relances ?? []).filter(e => e.verdict_code === v).length, 0)])) : 'n/a',
  nuance_surlignee: ok('retour_vf_agi') ? { juste: rows.filter(r => r.retour_vf_agi?.nuance?.verdict_code === 'juste').length, essais_2: rows.filter(r => (r.retour_vf_agi?.nuance?.essais ?? 0) >= 2).length } : 'n/a',
  choix_amont: ok('retour_vf_agi') ? { justes: rows.reduce((n, r) => n + (r.retour_vf_agi?.amont ?? []).filter(g => g.juste).length, 0), sur: rows.reduce((n, r) => n + (r.retour_vf_agi?.amont ?? []).length, 0) } : 'n/a',
  synthese_comparee: ok('comparaison_synthese') ? { n: rows.filter(r => r.comparaison_synthese).length, manques_reperes: rows.reduce((n, r) => n + (r.comparaison_synthese?.reperes ?? []).length, 0), manques_echappes: rows.reduce((n, r) => n + (r.comparaison_synthese?.manques ?? []).length, 0) } : 'n/a',
  je_ne_sais_pas: rows.filter(r => /^Je ne sais pas\.\n/.test(r.these ?? '') || /^Je ne sais pas\.\n/.test(r.arguments ?? '')).length,
  nuances_detail: rf.filter(x => (x.nuances_detail ?? []).length).length,
}

// ── Diagnostic (trajectoire) ──
const diag = await get('aletheia_diagnostic?select=eleve_id,semaine_index,niveau_these_v1,niveau_arguments_v1,niveau_these_vf,niveau_arguments_vf,erreur_at')
const okA = diag.filter(x => x.niveau_arguments_v1 != null && x.niveau_arguments_vf != null)
M.diagnostic = { n: diag.length, erreurs: diag.filter(x => x.erreur_at).length,
  args_progres: okA.filter(x => x.niveau_arguments_vf > x.niveau_arguments_v1).length, args_stable: okA.filter(x => x.niveau_arguments_vf === x.niveau_arguments_v1).length, args_recul: okA.filter(x => x.niveau_arguments_vf < x.niveau_arguments_v1).length,
  args_v1: Object.fromEntries([0, 1, 2, 3, 4].map(n => [['E', 'D', 'C', 'B', 'A'][n], diag.filter(x => x.niveau_arguments_v1 === n).length])) }

// ── Sortie ──
const f = (o) => o == null ? '—' : typeof o === 'object' && 'sur' in o ? `${o.n} / ${o.sur}` : JSON.stringify(o)
console.log(`\ntravaux ${M.travaux} · élèves ${M.eleves} · livres ${M.livres}`)
console.log('| Mesure (§ 0) | Valeur |\n|---|---|')
console.log(`| Thèse identique V1 → VF | ${f(M.these_identique)} |`)
console.log(`| Ajouts VF non ancrés | ${f(M.ajouts_non_ancres)} |`)
console.log(`| Durée V1 → clôture (médiane, min) | ${M.duree_minutes.mediane ?? '—'} min, ${M.duree_minutes.min ?? '—'} min (sur ${M.duree_minutes.sur}) |`)
console.log(`| Retour final (médiane, max) | ${M.retour_vf_mots.mediane ?? '—'} mots, ${M.retour_vf_mots.max ?? '—'} (synthèse ${M.retour_vf_mots.synthese_mediane ?? '—'}) |`)
console.log(`| Retour V1 (médiane, max) | ${M.retour_v1_mots.mediane ?? '—'} mots, ${M.retour_v1_mots.max ?? '—'} (relances ${M.retour_v1_mots.relances_mediane ?? '—'}) |`)
console.log(`| Citations IA retrouvées verbatim | ${f(M.citations_verbatim)} |`)
console.log('\nétayage :', JSON.stringify(M.etayage, null, 1).replace(/\n\s*/g, ' '))
console.log('diagnostic :', JSON.stringify(M.diagnostic))
if (JSON_OUT) { fs.writeFileSync(JSON_OUT, JSON.stringify({ base: BASE, depuis: DEPUIS, date: new Date().toISOString(), mesures: M }, null, 1)); console.log('→', JSON_OUT) }
