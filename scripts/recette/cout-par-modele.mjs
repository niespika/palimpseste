// ============================================================================
// CE QU'UN MODÈLE COÛTERAIT — sur NOTRE profil de jetons, pas sur un devis.
// ----------------------------------------------------------------------------
// ⛔⛔ POURQUOI UNE GRILLE TARIFAIRE NE SE COMPARE PAS TELLE QUELLE.
//
//    Mesuré en production le 31/08/2026, sur 418 appels réels `p1`+`p2` :
//
//      poste                par appel     part
//      entrée pleine            1 206     24,7 %
//      LECTURE DE CACHE         2 515     51,4 %   ⭐ le poste dominant
//      écriture de cache          407      8,3 %
//      sortie                     762     15,6 %
//
//    **La moitié de nos jetons sont des RELECTURES d'un préfixe invariant** — le
//    rôle, le catalogue d'observables, le schéma de sortie, identiques d'une
//    copie à l'autre. Chez Anthropic ils coûtent 0,30 $/M au lieu de 3 : un
//    rabais de 10×. ⛔ **Un fournisseur SANS mise en cache facture ces
//    2 515 jetons par appel au tarif d'entrée plein**, et son prix affiché ment
//    alors sur son rang. C'est exactement ce que ce script empêche.
//
// ⚠️ CE QU'IL NE DIT PAS, et qui décide autant : la tenue en français, le
//    respect d'un schéma de sortie strict (une sortie refusée est PAYÉE PUIS
//    RELANCÉE, donc comptée deux fois), et la résidence des données — des
//    copies d'élèves mineurs, au Québec, sous la Loi 25. Un modèle deux fois
//    moins cher qui rate un schéma sur cinq coûte plus cher.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        scripts/recette/cout-par-modele.mjs [--profil]
//
//   --profil   remesure le profil sur `api_couts` au lieu du profil figé.
// ============================================================================

import fs from 'node:fs'

// ── Le profil, mesuré le 31/08/2026 — jetons PAR APPEL (`p1` ou `p2`) ───────
const PROFIL = { entree: 1206, cacheLecture: 2515, cacheEcriture: 407, sortie: 762 }

// ⭐ 6,2 appels froids par dépôt en médiane (418 appels / 67 dépôts). On arrondit
//    à 6 : deux appels par compétence, trois compétences ciblées.
const APPELS_PAR_DEPOT = 6

// ── La flotte : 62 élèves × 6 exercices par semaine ─────────────────────────
const ELEVES = 62
const EXERCICES_PAR_SEMAINE = 6

/**
 * Les tarifs, en $ par million. `cacheLecture: null` = **le fournisseur n'a PAS
 * de mise en cache** : les relectures sont alors facturées au tarif d'entrée.
 * ⚠️ `cacheEcriture: null` avec un `cacheLecture` non nul = cache IMPLICITE,
 *    dont l'écriture n'est pas facturée (patron Gemini).
 */
const TARIFS = {
  // ── Les trois ÉPROUVÉS sur une copie réelle par `banc-modeles.mjs` le 31/08 ──
  // ⭐ Les trois tarifs ont été RELUS aux pages officielles le 31/08/2026 : ils
  //    sont encore justes au chiffre près.
  'claude-sonnet-4-6':      { entree: 3,     sortie: 15,   cacheLecture: 0.30,  cacheEcriture: 6,    seuil: 1024, note: 'éprouvé · pas de résidence CA' },
  'claude-haiku-4-5':       { entree: 1,     sortie: 5,    cacheLecture: 0.10,  cacheEcriture: 2,    seuil: 4096, note: 'éprouvé · ⛔ seuil 4096' },
  'gemini-3.5-flash-lite':  { entree: 0.30,  sortie: 2.50, cacheLecture: 0.03,  cacheEcriture: null, seuil: 4096, note: 'éprouvé · ⚠️ schéma raté' },

  // ── OpenAI — résidence de données CANADIENNE disponible ─────────────────────
  'gpt-5.6-luna':           { entree: 0.20,  sortie: 1.20, cacheLecture: 0.02,  cacheEcriture: 0.25, seuil: 1024, note: '⭐ Canada · schéma strict' },
  'gpt-5-mini':             { entree: 0.25,  sortie: 2.00, cacheLecture: 0.025, cacheEcriture: null, seuil: 2048, note: 'Canada · schéma strict' },
  'gpt-5-nano':             { entree: 0.05,  sortie: 0.40, cacheLecture: 0.005, cacheEcriture: null, seuil: 2048, note: 'Canada · schéma NON ÉTABLI' },
  'gpt-5.6-terra':          { entree: 2,     sortie: 12,   cacheLecture: 0.20,  cacheEcriture: 2.50, seuil: 1024, note: 'Canada · schéma strict' },
  'claude-sonnet-5':        { entree: 2,     sortie: 10,   cacheLecture: 0.20,  cacheEcriture: 4,    seuil: 1024, note: 'pas de résidence CA' },

  // ── Mistral — éditeur français, hébergement UE par défaut ───────────────────
  'mistral-small-4':        { entree: 0.15,  sortie: 0.60, cacheLecture: 0.015, cacheEcriture: null, seuil: 0,    note: 'UE · cache EXPLICITE, non garanti' },
  'mistral-large-3':        { entree: 0.50,  sortie: 1.50, cacheLecture: 0.05,  cacheEcriture: null, seuil: 0,    note: 'UE · cache explicite' },

  // ── Poids ouverts, hébergés en Amérique du Nord ────────────────────────────
  // ⭐ C'est la voie qui répond à la Loi 25 pour un modèle chinois : les poids
  //    sont chinois, l'inférence ne l'est pas.
  'fireworks/deepseek-v4-flash': { entree: 0.22, sortie: 0.66, cacheLecture: 0.007, cacheEcriture: null, seuil: 0, note: 'US · lecture la moins chère relevée' },
  'fireworks/gpt-oss-120b':      { entree: 0.15, sortie: 0.60, cacheLecture: 0.015, cacheEcriture: null, seuil: 0, note: 'US · schéma strict + grammaire' },
  'groq/gpt-oss-20b':            { entree: 0.075, sortie: 0.30, cacheLecture: 0.0375, cacheEcriture: null, seuil: 0, note: 'US · schéma strict · remise 50 % seulement' },
  'together/deepseek-v4-flash':  { entree: 0.14, sortie: 0.28, cacheLecture: 0.03, cacheEcriture: null, seuil: 0, note: 'US · ZDR · schéma PARTIEL' },
  'deepinfra/qwen3.5-9b':        { entree: 0.10, sortie: 0.15, cacheLecture: null, cacheEcriture: null, seuil: 0, note: '⛔ AUCUN cache facturé' },
  'together/gpt-oss-120b':       { entree: 0.15, sortie: 0.60, cacheLecture: null, cacheEcriture: null, seuil: 0, note: '⛔ AUCUN cache sur CE modèle' },
  'cerebras/gpt-oss-120b':       { entree: 0.35, sortie: 0.75, cacheLecture: null, cacheEcriture: null, seuil: 0, note: '⛔⛔ cache SANS remise — facturé plein' },
  'bedrock/llama-3.3-70b':       { entree: 0.72, sortie: 0.72, cacheLecture: null, cacheEcriture: null, seuil: 0, note: '⛔ aucun cache · région CA possible' },
}

/**
 * ⭐⭐ LE SEUIL D'AMORÇAGE — le piège que le prix ne dit pas.
 *
 * Chaque fournisseur impose un nombre MINIMAL de jetons sous lequel le préfixe
 * n'est pas mis en cache DU TOUT — sans erreur, en silence. Nos treize préfixes,
 * en jetons (le rapport 2,82 caractères/jeton est MESURÉ : 13 774 caractères
 * ont rendu 4 879 jetons d'écriture de cache sur `expression/P2`) :
 */
const PREFIXES = [
  ['expression P1', 3194], ['expression P2', 4884],
  ['argumentation P1', 1438], ['argumentation P2', 2797],
  ['structure P1', 3986], ['structure P2', 2080],
  ['synthese P1A', 1678], ['synthese P1B', 866], ['synthese P2', 2039],
  ['questionnement P1', 1570], ['questionnement P2', 123],
  ['connaissance P1', 1587], ['connaissance P2', 2167],
]

/** La part de nos prompts qui franchit le seuil — donc qui se met vraiment en cache. */
function partCachee(seuil) {
  if (!seuil) return 1
  return PREFIXES.filter(([, t]) => t >= seuil).length / PREFIXES.length
}

function cout(t) {
  const M = 1e6
  // ⛔ SANS CACHE, LES RELECTURES SONT DE L'ENTRÉE PLEINE. C'est toute la
  //    différence entre un prix affiché et un prix payé.
  // ⭐ ET LE SEUIL D'AMORÇAGE COMPTE AUTANT : la part de nos prompts qui ne le
  //    franchit pas paie l'entrée pleine, même chez un fournisseur qui a un
  //    cache et l'affiche. *Mesuré sur Haiku 4.5 : un préfixe caché sur six.*
  const part = t.cacheLecture == null ? 0 : partCachee(t.seuil)
  const lecture = part * (t.cacheLecture ?? t.entree) + (1 - part) * t.entree
  const ecriture = t.cacheEcriture == null ? 0 : t.cacheEcriture * part
  const parAppel = (PROFIL.entree * t.entree
    + PROFIL.cacheLecture * lecture
    + PROFIL.cacheEcriture * ecriture
    + PROFIL.sortie * t.sortie) / M
  return { parAppel, parDepot: parAppel * APPELS_PAR_DEPOT, part }
}

const nb = (x, n = 4) => x.toFixed(n)
console.log(`\nPROFIL PAR APPEL — entrée ${PROFIL.entree} · cache-lecture ${PROFIL.cacheLecture} `
  + `· cache-écriture ${PROFIL.cacheEcriture} · sortie ${PROFIL.sortie}`)
console.log(`FLOTTE — ${ELEVES} élèves × ${EXERCICES_PAR_SEMAINE} exercices `
  + `× ${APPELS_PAR_DEPOT} appels\n`)

const ref = cout(TARIFS['claude-sonnet-4-6']).parDepot
const lignes = Object.entries(TARIFS)
  .map(([nom, t]) => ({ nom, t, ...cout(t) }))
  .sort((a, b) => a.parDepot - b.parDepot)

console.log(`${'modèle'.padEnd(30)} ${'$/dépôt'.padStart(8)} ${'$/sem.'.padStart(9)} `
  + `${'rapp.'.padStart(6)}  ${'cache'.padEnd(32)} remarque`)
console.log('─'.repeat(132))
for (const l of lignes) {
  const semaine = l.parDepot * ELEVES * EXERCICES_PAR_SEMAINE
  const cacheDit = l.t.cacheLecture == null
    ? '⛔ aucun'
    : `${l.t.cacheLecture} $/M · ${Math.round(l.part * 100)} % de nos prompts`
  console.log(`${l.nom.padEnd(30)} ${nb(l.parDepot).padStart(8)} `
    + `${nb(semaine, 2).padStart(9)} ${(ref / l.parDepot).toFixed(1).padStart(6)}×  `
    + `${cacheDit.padEnd(32)} ${l.t.note}`)
}

console.log(
  '\n⚠️  LE PRIX N\'EST PAS LE CLASSEMENT. Une sortie refusée par le schéma est'
  + '\n    PAYÉE PUIS RELANCÉE : un modèle 3× moins cher qui rate un schéma sur'
  + '\n    trois ne fait économiser rien. Et la résidence des données décide'
  + '\n    indépendamment du prix — ce sont des copies d\'élèves mineurs, au'
  + '\n    Québec, sous la Loi 25.'
  + '\n⭐  L\'accord des LETTRES se mesure avec `banc-modeles.mjs`, sur les mêmes'
  + '\n    copies. Le prix seul n\'a jamais tranché un partage de modèles.')

if (process.argv.includes('--profil')) {
  const E = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
    .map((l) => { const [k, ...r] = l.split('='); return [k.trim(), r.join('=').trim().replace(/^["']|["']$/g, '')] }))
  const url = `${E.PROD_SUPABASE_URL}/rest/v1/api_couts`
    + '?select=tokens_entree,tokens_sortie,tokens_cache_lecture,tokens_cache_ecriture'
    + '&module=eq.exercices-chaine&modele=eq.claude-sonnet-4-6&limit=1000'
  const r = await fetch(url, {
    headers: { apikey: E.PROD_SUPABASE_SECRET_KEY, Authorization: `Bearer ${E.PROD_SUPABASE_SECRET_KEY}` },
  })
  const d = await r.json()
  const s = d.reduce((a, x) => ({
    entree: a.entree + (x.tokens_entree ?? 0), sortie: a.sortie + (x.tokens_sortie ?? 0),
    cacheLecture: a.cacheLecture + (x.tokens_cache_lecture ?? 0),
    cacheEcriture: a.cacheEcriture + (x.tokens_cache_ecriture ?? 0),
  }), { entree: 0, sortie: 0, cacheLecture: 0, cacheEcriture: 0 })
  console.log(`\nPROFIL REMESURÉ sur ${d.length} appels Sonnet :`)
  for (const [k, v] of Object.entries(s)) console.log(`  ${k.padEnd(14)} ${Math.round(v / d.length)}`)
}
