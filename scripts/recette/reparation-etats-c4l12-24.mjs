// ============================================================================
// RÉPARATION — `C4L12-25` : les états perdus par la charge hétérogène de
// `ecrireLEtatApresMesure` (défaut `C4L12-24`, corrigé le 29/08/2026).
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/reparation-etats-c4l12-24.mjs --base=sandbox
//        [--repare] [--oui-la-prod]
//
// ⛔ CE N'EST PAS UNE RECETTE : elle ne sème rien, ne monte aucun décor, et n'a
//    rien à retirer. Elle REJOUE LA FONCTION DE PRODUCTION sur des mesures qui
//    sont déjà en base — « rien ne s'invente, l'état se recalcule ».
//
// ⭐ LE CONSTAT EST LE DÉFAUT. Sans `--repare`, elle LIT et n'écrit rien : elle
//    dit quelles paires (élève × compétence) sont fausses et pourquoi. C'est la
//    règle du dépôt — « devant une anomalie de données, lire la donnée d'abord ».
//
// ⛔ SANDBOX D'ABORD, PROD ENSUITE (`SUIVI_SQL.md`, règle R6). `--base=prod`
//    combiné à `--repare` exige EN PLUS `--oui-la-prod` : une écriture sur des
//    élèves réels ne se déclenche pas par une faute de frappe.
//
// ⭐ LA CIBLE SE DÉRIVE, ELLE NE SE RECOPIE PAS — et elle est RESSERRÉE, parce
//    que le premier prédicat était trop large et que le bac à sable l'a montré.
//
//    Une paire (élève × compétence) est SUSPECTE si elle porte au moins une
//    mesure ET que sa ligne de niveau MANQUE, ou qu'elle est plus VIEILLE que la
//    dernière mesure. ⛔ Mais « plus vieille » ne prouve rien à soi seul : une
//    mesure SEMÉE PAR UN DÉCOR, insérée directement en base, ne déclenche jamais
//    l'écrivain — sa ligne de niveau est donc légitimement en retard, et la
//    « réparer » fabriquerait une lettre à partir d'un décor. *Constaté au bac à
//    sable le 29/08 : six paires périmées chez un seul élève, toutes horodatées
//    à la pose des statuts du 23/08, pour des mesures de décor des 26-28/08.*
//
//    ⭐ LE DISCRIMINANT EST LA SIGNATURE DU DÉFAUT, ET IL EST EXACT : une charge
//    perdue emporte, POUR UN MÊME ÉLÈVE, une compétence NEUVE (ligne absente) ET
//    une compétence DÉJÀ LETTRÉE (ligne périmée). On ne répare donc que les
//    élèves qui portent AU MOINS UNE LIGNE ABSENTE — et chez eux, toutes leurs
//    paires suspectes, qui sont du même lot. ⛔ Un élève qui n'a que des lignes
//    périmées est ÉCARTÉ, nommément, et le constat le dit : son cas est ambigu,
//    et l'ambigu ne s'écrit pas.
//
//    Le prédicat rend ZÉRO une fois réparé : la réparation est IDEMPOTENTE.
//
// ⚠️ CE QU'ELLE ÉCRIT, ET IL FAUT LE SAVOIR : elle appelle
//    `ecrireLEtatApresMesure`, qui est LE chemin de production. Celui-ci écrit
//    `competences_niveaux`, et il peut aussi poser des lignes d'escalade et de
//    montée — c'est exactement ce qui aurait eu lieu si la charge n'avait pas été
//    perdue. Le constat annonce les trois comptes avant, le bilan les redonne
//    après. ⛔ Aucun `upsert` écrit à la main : on ne réécrit pas la règle.
// ============================================================================

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = Object.fromEntries(fs.readFileSync(path.join(RACINE, '.env.local'), 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trimStart().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(),
    l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const arg = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.split('=')[1] ?? null
const BASE = arg('base')
const REPARE = process.argv.includes('--repare')
const OUI_PROD = process.argv.includes('--oui-la-prod')

if (BASE !== 'sandbox' && BASE !== 'prod') {
  console.error('⛔ `--base=sandbox` ou `--base=prod` est OBLIGATOIRE. Aucun défaut : écrire dans '
    + 'la mauvaise base est le genre d\'erreur qu\'un défaut de paramètre fabrique.')
  process.exit(2)
}
if (BASE === 'prod' && REPARE && !OUI_PROD) {
  console.error('⛔ Écrire en PRODUCTION exige `--oui-la-prod` en plus de `--repare`. '
    + 'Sandbox d\'abord, prod ensuite (`SUIVI_SQL.md`, règle R6).')
  process.exit(2)
}

const URL = BASE === 'prod' ? env.PROD_SUPABASE_URL : env.NEXT_PUBLIC_SUPABASE_URL
const CLE = BASE === 'prod' ? env.PROD_SUPABASE_SECRET_KEY : env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !CLE) {
  console.error(`⛔ L'URL ou la clé de « ${BASE} » manque à \`.env.local\`. Rien n'est tenté.`)
  process.exit(2)
}
const admin = createClient(URL, CLE, { auth: { persistSession: false } })

// ⚠️ supabase-js NE LÈVE PAS : il rend `{ error }`, et une lecture mal posée se
//    lit alors comme une réponse NÉGATIVE — c'est le piège qui a fait rougir deux
//    recettes pour rien. Toute lecture passe par ici.
const lu = (nom, { data, error }) => {
  if (error) throw new Error(`${nom} : ${error.message}`)
  return data
}
const titre = (t) => console.log(`\n${'─'.repeat(78)}\n${t}\n${'─'.repeat(78)}`)
const note = (t) => console.log(`   ${t}`)

// ⛔ Pagination : supabase-js plafonne toute réponse à 1000 lignes SANS RIEN
//    SIGNALER. On ordonne sur une clé unique et on confronte au compte exact.
async function tout(table, colonnes, cleTri) {
  const lignes = []
  for (let page = 0; ; page++) {
    const d = lu(table, await admin.from(table).select(colonnes)
      .order(cleTri, { ascending: true }).range(page * 1000, page * 1000 + 999))
    lignes.push(...d)
    if (d.length < 1000) break
  }
  const { count, error } = await admin.from(table).select('*', { count: 'exact', head: true })
  if (error) throw new Error(`${table} (compte) : ${error.message}`)
  if (count !== lignes.length) {
    throw new Error(`${table} : ${lignes.length} lignes lues pour ${count} en base — on s'arrête.`)
  }
  return lignes
}

async function main() {
  const { ecrireLEtatApresMesure } = await import(`${RACINE}/utils/moteur/etat-serveur.ts`)

  titre(`RÉPARATION C4L12-25 — base « ${BASE} » · ${REPARE ? '⚠️ MODE ÉCRITURE' : 'CONSTAT SEUL'}`)
  note(`projet : ${URL.replace(/^https:\/\//, '').split('.')[0]}`)

  // ── LE FUSEAU — lu, jamais supposé ────────────────────────────────────────
  const params = lu('calendrier_params', await admin.from('calendrier_params')
    .select('fuseau').eq('id', 1).maybeSingle())
  const fuseau = params?.fuseau ?? 'America/Toronto'
  note(`fuseau : ${fuseau}${params?.fuseau ? '' : '  ⚠️ (défaut — `calendrier_params` muet)'}`)

  // ── L'ÉTAT, RELEVÉ AVANT TOUTE ÉCRITURE ───────────────────────────────────
  const mesures = await tout('competences_mesures', 'id, eleve_id, competence, mesure_at', 'id')
  const niveaux = await tout('competences_niveaux',
    'eleve_id, competence, lettre, lettre_initiale, profil_provisoire, updated_at', 'eleve_id')
  const { count: escAvant } = await admin.from('competences_escalade')
    .select('*', { count: 'exact', head: true })
  const { count: monAvant } = await admin.from('competences_montee')
    .select('*', { count: 'exact', head: true })

  const niveauDe = new Map(niveaux.map((n) => [`${n.eleve_id}|${n.competence}`, n]))
  const derniere = new Map()
  for (const m of mesures) {
    const c = `${m.eleve_id}|${m.competence}`
    if (!derniere.has(c) || m.mesure_at > derniere.get(c)) derniere.set(c, m.mesure_at)
  }

  // ⭐ LE PRÉDICAT — dérivé, jamais recopié. Il rend ZÉRO sur une base saine.
  const fausses = []
  for (const [cle, quand] of derniere) {
    const [eleveId, competence] = cle.split('|')
    const n = niveauDe.get(cle)
    if (!n) { fausses.push({ eleveId, competence, motif: 'ligne ABSENTE', quand, avant: null }) }
    else if (n.updated_at < quand) {
      fausses.push({ eleveId, competence, motif: 'ligne PLUS VIEILLE que la dernière mesure',
        quand, avant: { lettre: n.lettre, updated_at: n.updated_at } })
    }
  }

  titre('① LE CONSTAT — ce que la base dit, avant tout geste')
  note(`${mesures.length} mesures · ${niveaux.length} lignes de niveau · `
    + `${escAvant} escalade(s) · ${monAvant} montée(s)`)
  if (fausses.length === 0) {
    note('✓ AUCUNE paire fausse — rien à réparer. (C\'est aussi ce que rend un second passage.)')
    console.log('\n✓ Terminé : rien à faire.\n')
    return
  }
  const suspects = new Map()
  for (const f of fausses) suspects.set(f.eleveId, [...(suspects.get(f.eleveId) ?? []), f])
  note(`${fausses.length} paire(s) suspecte(s), sur ${suspects.size} élève(s) :`)
  for (const [eleveId, liste] of suspects) {
    for (const f of liste) {
      const d = f.avant ? `lettre=${f.avant.lettre} maj=${f.avant.updated_at.slice(0, 19)}` : '—'
      console.log(`     ${eleveId.slice(0, 8)}  ${f.competence.padEnd(14)} ${f.motif.padEnd(38)}`
        + ` ${d}  dernière mesure ${f.quand.slice(0, 19)}`)
    }
  }

  // ⭐ LE TRI — la signature du défaut, et elle seule. Voir l'en-tête.
  const parEleve = new Map()
  const ecartes = new Map()
  for (const [eleveId, liste] of suspects) {
    if (liste.some((f) => f.avant === null)) parEleve.set(eleveId, liste)
    else ecartes.set(eleveId, liste)
  }
  console.log()
  note(`⛔ À RÉPARER : ${[...parEleve.values()].flat().length} paire(s) sur ${parEleve.size} `
    + 'élève(s) — ceux qui portent AU MOINS UNE LIGNE ABSENTE, la signature d\'une charge perdue.')
  if (ecartes.size) {
    note(`⚠️ ÉCARTÉS, ET NOMMÉS : ${[...ecartes.values()].flat().length} paire(s) sur `
      + `${ecartes.size} élève(s) — QUE des lignes périmées, aucune absente. Une mesure semée par `
      + 'un décor n\'appelle jamais l\'écrivain : son retard est légitime, et le réparer '
      + 'fabriquerait une lettre depuis un décor. **Non touchés.**')
    for (const [eleveId, liste] of ecartes) {
      console.log(`     ${eleveId.slice(0, 8)}  ${liste.map((f) => f.competence).join(', ')}`)
    }
  }
  if (parEleve.size === 0) {
    console.log('\n✓ Rien ne porte la signature du défaut : aucune réparation à faire.\n')
    return
  }

  // ── LE REGISTRE — écrit AVANT d'écrire quoi que ce soit ────────────────────
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const registre = path.join(path.dirname(fileURLToPath(import.meta.url)),
    `.reparation-c4l12-25-${BASE}-${stamp}.json`)
  fs.writeFileSync(registre, JSON.stringify({
    base: BASE, projet: URL, fuseau, quand: new Date().toISOString(), mode: REPARE ? 'repare' : 'constat',
    comptesAvant: { mesures: mesures.length, niveaux: niveaux.length,
      escalades: escAvant, montees: monAvant },
    suspectes: fausses,
    aReparer: [...parEleve.values()].flat(),
    ecartees: [...ecartes.values()].flat(),
  }, null, 2))
  note(`registre écrit : ${path.basename(registre)}  ⭐ l'état AVANT est sur le disque, quoi qu'il arrive`)

  if (!REPARE) {
    console.log('\n⚠️  CONSTAT SEUL — rien n\'a été écrit. Relancer avec `--repare`'
      + `${BASE === 'prod' ? ' --oui-la-prod' : ''} pour réparer.\n`)
    return
  }

  // ── LA RÉPARATION — par la FONCTION DE PRODUCTION, une fois par élève ──────
  titre('② LA RÉPARATION — `ecrireLEtatApresMesure`, le chemin de production')
  note('⛔ Toutes les compétences fausses d\'un élève partent dans LE MÊME appel : c\'est '
    + 'exactement la charge hétérogène qui échouait, et sa réussite est la preuve du correctif.')
  let lettres = 0
  const bilans = []
  for (const [eleveId, liste] of parEleve) {
    const competences = [...new Set(liste.map((f) => f.competence))]
    const b = await ecrireLEtatApresMesure(admin, eleveId, competences, fuseau)
    bilans.push(b)
    lettres += b.lettresEcrites
    const souci = b.erreurs.length ? `  ⛔ ${b.erreurs.join(' | ')}` : ''
    console.log(`     ${eleveId.slice(0, 8)}  [${competences.join(', ')}]  `
      + `traitées=${b.traitees.length} lettres=${b.lettresEcrites} `
      + `escalades=${b.escaladesPosees} montées=${b.monteesPosees}${souci}`)
  }
  const enErreur = bilans.filter((b) => b.erreurs.length).length
  note(`${lettres} lettre(s) écrite(s) · ${enErreur} élève(s) avec au moins une erreur`)

  // ── LE CONTRÔLE — par REQUÊTE, jamais sur la foi d'un bilan ────────────────
  titre('③ LE CONTRÔLE — relu en base, pas dans le bilan')
  const niveaux2 = await tout('competences_niveaux',
    'eleve_id, competence, lettre, updated_at', 'eleve_id')
  const niveauDe2 = new Map(niveaux2.map((n) => [`${n.eleve_id}|${n.competence}`, n]))
  // ⛔ On ne contrôle QUE ce qu'on a réparé : les écartées sont toujours là, et
  //    c'est voulu — les compter en échec ferait rougir le script pour une
  //    décision qu'il a prise exprès.
  const restantes = []
  for (const f of [...parEleve.values()].flat()) {
    const cle = `${f.eleveId}|${f.competence}`
    const n = niveauDe2.get(cle)
    if (!n || n.updated_at < derniere.get(cle)) restantes.push(cle)
  }
  const { count: escApres } = await admin.from('competences_escalade')
    .select('*', { count: 'exact', head: true })
  const { count: monApres } = await admin.from('competences_montee')
    .select('*', { count: 'exact', head: true })
  note(`lignes de niveau : ${niveaux.length} → ${niveaux2.length}`)
  note(`escalades : ${escAvant} → ${escApres} · montées : ${monAvant} → ${monApres}`)
  console.log(restantes.length === 0
    ? `\n✓ ${[...parEleve.values()].flat().length} paire(s) réparée(s), ZÉRO restante. Rejouer ce script rendra « rien à faire ».\n`
    : `\n✗ ${restantes.length} paire(s) TOUJOURS fausse(s) : ${restantes.join(' · ')}\n`)
  process.exitCode = restantes.length === 0 ? 0 : 1
}

main().catch((e) => { console.error(`\n⛔ ${e.message}\n`); process.exitCode = 1 })
