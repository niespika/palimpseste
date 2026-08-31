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
  // Les trois que le dépôt connaît déjà (`utils/cout-usage.ts`), et qui ont été
  // ÉPROUVÉS sur une copie réelle par `banc-modeles.mjs` le 31/08.
  'claude-sonnet-4-6':     { entree: 3,    sortie: 15,   cacheLecture: 0.30, cacheEcriture: 6 },
  'claude-haiku-4-5':      { entree: 1,    sortie: 5,    cacheLecture: 0.10, cacheEcriture: 2 },
  'gemini-3.5-flash-lite': { entree: 0.30, sortie: 2.50, cacheLecture: 0.03, cacheEcriture: null },
}

function cout(t) {
  const M = 1e6
  // ⛔ SANS CACHE, LES RELECTURES SONT DE L'ENTRÉE PLEINE. C'est toute la
  //    différence entre un prix affiché et un prix payé.
  const lecture = t.cacheLecture == null ? t.entree : t.cacheLecture
  const ecriture = t.cacheEcriture == null ? 0 : t.cacheEcriture
  const parAppel = (PROFIL.entree * t.entree
    + PROFIL.cacheLecture * lecture
    + PROFIL.cacheEcriture * ecriture
    + PROFIL.sortie * t.sortie) / M
  return { parAppel, parDepot: parAppel * APPELS_PAR_DEPOT }
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

console.log(`${'modèle'.padEnd(24)} ${'$/appel'.padStart(9)} ${'$/dépôt'.padStart(9)} `
  + `${'$/semaine'.padStart(10)} ${'rapport'.padStart(8)}  cache`)
console.log('─'.repeat(88))
for (const l of lignes) {
  const semaine = l.parDepot * ELEVES * EXERCICES_PAR_SEMAINE
  const cacheDit = l.t.cacheLecture == null
    ? '⛔ AUCUNE — relectures au tarif plein'
    : `${l.t.cacheLecture} $/M`
  console.log(`${l.nom.padEnd(24)} ${nb(l.parAppel).padStart(9)} ${nb(l.parDepot).padStart(9)} `
    + `${nb(semaine, 2).padStart(10)} ${(ref / l.parDepot).toFixed(1).padStart(7)}×  ${cacheDit}`)
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
