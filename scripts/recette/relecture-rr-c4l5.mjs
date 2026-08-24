// ============================================================================
// LA RELECTURE RR1-RR4 DES RETOURS ENGENDRÉS (`C4L5-1bis`, `01-` §12).
// ----------------------------------------------------------------------------
// « Ce qui reste est la relecture RR1-RR4 par le professeur ; automatiquement,
//   seule RR4 est contrôlée. »                                   — `C4L5-1bis`
//
// Ce script ne remplace pas la lecture : il la SERT. Il tranche mécaniquement ce
// qui se tranche mécaniquement — RR3 et RR4 —, et il POSE SOUS LES YEUX ce qui
// demande un jugement — RR1 et RR2 —, en signalant les tournures suspectes.
//
//   RR1 — la tentative est un fait observable DANS LE TEXTE ; le modèle
//         n'infère JAMAIS une cause dans la tête de l'élève.
//   RR2 — en version finale, le « pourquoi » causal devient un CONSTAT.
//   RR3 — les citations PORTENT LEUR SOURCE (la copie / le texte support).
//   RR4 — jamais le nom d'un observable, ni un seuil, ni COMBIEN IL EN FAUDRAIT.
//         ⭐ Nommer les DIMENSIONS en langue élève est permis, et souhaité.
//
// ⚠️ LES SIGNAUX RR1/RR2 SONT DES INDICES, PAS DES VERDICTS. Une tournure
//    causale peut porter sur LE TEXTE (« ce “donc” saute une étape » : licite)
//    ou sur L'ÉLÈVE (« tu n'as pas compris que » : interdit). Seule la lecture
//    tranche — le script montre, il ne condamne pas.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/relecture-rr-c4l5.mjs
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.env.PALIMPSESTE_RACINE_DEPOT
  || '/Users/louissagnieres/Documents/GitHub/palimpseste'
const { MANIFESTE_INSTRUMENTS } = await import(`${RACINE}/utils/chaine/derive/MANIFESTE.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

let ok = 0
let ko = 0
let aLire = 0
const dire = (vrai, quoi, detail = '') => {
  console.log(`    ${vrai ? '✓' : '✗'} ${quoi}${detail ? ` — ${detail}` : ''}`)
  if (vrai) ok += 1; else ko += 1
}
const aVoir = (quoi) => { console.log(`    ⚠ ${quoi}`); aLire += 1 }

// ── Les codes d'observables, tirés du manifeste dérivé ──────────────────────
// ⚠️ `observables_mesure` est un TABLEAU DE CODES, pas un objet. Un
//    `Object.keys()` dessus rend des INDICES — « 0 », « 1 »… — et le contrôle
//    RR4 devenait alors VIDE : il ne cherchait aucun vrai code, et son vert ne
//    valait rien. Vu au premier tour, corrigé. On compte, et on le dit.
const codes = new Set()
for (const [, c] of Object.entries(MANIFESTE_INSTRUMENTS.competences ?? {})) {
  for (const o of (c.observables_mesure ?? [])) {
    if (typeof o === 'string') codes.add(o)
    else if (o && typeof o.code === 'string') codes.add(o.code)
  }
}
if (codes.size < 40) {
  throw new Error(`RELECTURE INUTILISABLE : ${codes.size} code(s) d'observable seulement — les six `
    + 'fiches en portent 56. Un contrôle RR4 qui ne cherche rien passe au vert pour rien.')
}
console.log(`\n${codes.size} code(s) d'observable au manifeste — la matière de RR4.\n`)

// ⚠️ « RR4 refuse un retour qui dit "recadrage" ou "enjeu" » — ces deux codes
//    SONT des mots français ordinaires, et ce sont le vocabulaire même du
//    levier (registre des ouverts, item 58). On les sort de la recherche en
//    sous-chaîne et on les SIGNALE À LA LECTURE plutôt que de crier au loup.
const MOTS_ORDINAIRES = new Set(['recadrage', 'enjeu'])

// « JAMAIS DE NOTE, de lettre ou de moyenne » (`07-` §4, règle 6), et jamais
// COMBIEN IL EN FAUDRAIT — c'est le cœur de RR4.
const MOTIFS_INTERDITS = [
  [/\b\d{1,2}([.,]\d+)?\s*\/\s*(10|20|100)\b/, 'une note chiffrée'],
  [/\bmoyenne\s+(de|:)\s*\d/i, 'une moyenne chiffrée'],
  [/\b(palier|niveau|note|lettre)\s*:?\s*[«"']?\s*[EDCBA]\b/, 'un palier ou une lettre'],
  [/\btu es (?:à|au niveau) [EDCBA]\b/i, 'une lettre attribuée'],
  [/\bil (?:t'en )?(?:faut|faudrait)\s+(?:au moins\s+)?(?:\d+|deux|trois|quatre|cinq|six)\b/i,
    'COMBIEN IL EN FAUDRAIT — le barème, précisément ce que RR4 cache'],
  [/\b(?:au moins|minimum de)\s+(?:\d+|deux|trois|quatre|cinq|six)\s+\w+/i,
    'un plancher chiffré — à lire de près : barème, ou fait de la copie ?'],
  [/\bseuil\b/i, 'le mot « seuil »'],
]

// RR1/RR2 — les tournures qui PEUVENT inférer une cause dans la tête de l'élève.
// ⚠️⚠️ PAS DE `\b` APRÈS UNE LETTRE ACCENTUÉE. Le `\b` de JavaScript est ASCII :
//    après « à », il n'y a AUCUNE frontière de mot, et `/tu avais tendance à\b/`
//    ne trouve rien — pas même « Tu avais tendance à enchaîner ». Le détecteur
//    se taisait donc sur l'une des deux formes du passé invoqué. C'est le même
//    écart que celui déjà relevé sur la Structure (le `\w` unicode), et il se
//    reproduit ici : on l'écrit pour qu'il ne se reproduise pas une troisième.
const TOURNURES_CAUSALES = [
  [/\btu n'as pas (?:compris|vu|su|voulu|cherché)\b/i, 'une cause prêtée à l’élève'],
  [/\btu (?:as )?(?:cru|pensé|imaginé|voulu dire)\b/i, 'une intention prêtée à l’élève'],
  [/\bparce que tu\b/i, '« parce que tu… » — cause dans la tête de l’élève ?'],
  [/\btu as sans doute\b/i, 'une supposition sur l’élève'],
  [/\bla fois (?:précédente|d'avant)\b/i, '⛔ UN PASSÉ INVOQUÉ — registre des ouverts, item 49'],
  [/\b(?:précédemment|auparavant|jusqu'ici), tu\b/i, '⛔ un passé invoqué'],
  [/\btu avais tendance à/i, '⛔ un passé invoqué (règle 2 du gabarit)'],
]

const { data: retours, error } = await admin.from('exercices_retours')
  .select('id, depot_id, moment, texte, feed_forward, registre_servi, created_at')
  .order('created_at')
if (error) throw new Error(`retours : ${error.message}`)

console.log(`${retours.length} retour(s) en base.\n`)

for (const r of retours) {
  const points = Array.isArray(r.texte) ? r.texte : [r.texte]
  console.log('═'.repeat(76))
  console.log(`RETOUR « ${r.moment.toUpperCase()} » · dépôt ${r.depot_id.slice(0, 8)} · registre `
    + `${r.registre_servi} · ${String(r.created_at).slice(0, 16)}`)
  console.log('═'.repeat(76))

  const toutLeTexte = [...points.map((p) => p?.texte ?? ''), r.feed_forward ?? ''].join('\n')

  for (const [i, p] of points.entries()) {
    console.log(`\n[${i + 1}] ${p?.nature ?? '?'} · ${p?.competence ?? '?'}`)
    console.log(`    ${String(p?.texte ?? '').replace(/\n/g, '\n    ')}`)
    console.log(`    ↳ ${p?.ancrage?.source ?? 'SANS SOURCE'} : « ${p?.ancrage?.citation ?? '—'} »`)
  }
  if (r.feed_forward) console.log(`\n→ feed-forward : ${r.feed_forward}`)

  console.log('\n  ── RR3 — les citations portent leur source ──')
  dire(points.every((p) => !!p?.ancrage?.citation && String(p.ancrage.citation).trim() !== ''),
    'chaque point porte une CITATION non vide')
  dire(points.every((p) => ['copie', 'texte_support'].includes(p?.ancrage?.source)),
    'et chacune NOMME sa source',
    [...new Set(points.map((p) => p?.ancrage?.source))].join(', '))

  console.log('\n  ── RR4 — ni observable, ni seuil, ni « combien il en faudrait » ──')
  const fuites = [...codes].filter((c) => c && c.length >= 4 && !MOTS_ORDINAIRES.has(c)
    && toutLeTexte.toLowerCase().includes(c.toLowerCase()))
  dire(fuites.length === 0, 'aucun NOM D\'OBSERVABLE dans le texte',
    fuites.join(', ') || 'aucun')
  const interdits = MOTIFS_INTERDITS.filter(([re]) => re.test(toutLeTexte)).map(([, q]) => q)
  dire(interdits.length === 0, 'aucun barème, seuil, note ni palier',
    interdits.join(' · ') || 'aucun')
  for (const m of MOTS_ORDINAIRES) {
    if (toutLeTexte.toLowerCase().includes(m)) {
      aVoir(`le mot « ${m} » est présent — c'est AUSSI un code d'observable, mais c'est un mot `
        + 'français ordinaire (item 58) : à lire, pas à condamner')
    }
  }

  console.log('\n  ── RR1 / RR2 — ce qui demande une lecture ──')
  const suspects = TOURNURES_CAUSALES.filter(([re]) => re.test(toutLeTexte)).map(([, q]) => q)
  if (suspects.length === 0) {
    dire(true, 'aucune tournure qui prête une cause ou invoque un passé')
  } else {
    for (const s of suspects) aVoir(s)
  }
  if (r.moment === 'final') {
    console.log('    · RR2 : en version finale, le « pourquoi » doit être un CONSTAT '
      + '(« ce qui manque encore, d\'après les deux versions »). À LIRE ci-dessus.')
  }
  console.log('')
}

console.log('═'.repeat(76))
console.log(`RELECTURE — ${ok} contrôle(s) mécanique(s) passé(s), ${ko} en échec, `
  + `${aLire} point(s) à lire.`)
console.log('⚠️ RR1 et RR2 ne se tranchent pas mécaniquement : le vert ci-dessus dit seulement '
  + 'qu\'aucune tournure suspecte n\'a été trouvée.')
console.log('═'.repeat(76) + '\n')
