// ============================================================================
// ÉPREUVE du script de réparation `C4L12-25` — LE CHEMIN D'ÉCRITURE.
// ----------------------------------------------------------------------------
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/epreuve-reparation-c4l12-25.mjs --seme | --retire
//
// ⛔ BAC À SABLE UNIQUEMENT — la base est lue à `NEXT_PUBLIC_SUPABASE_URL`, et
//    ce script n'a AUCUN chemin vers la production.
//
// POURQUOI IL EXISTE. `reparation-etats-c4l12-24.mjs` sélectionne, journalise et
// contrôle — tout cela tourne au bac à sable. Mais sa BOUCLE D'APPEL n'y a rien
// à faire : aucun élève du bac à sable ne porte la signature du défaut. Le
// chemin d'écriture n'était donc pas exercé, et un correctif dont le chemin
// d'écriture n'a jamais tourné n'est pas un correctif éprouvé.
//
// CE QU'IL SÈME — la signature EXACTE du défaut `C4L12-24`, sur un élève réel du
// bac à sable choisi pour être le plus inerte possible (0 mesure, 0 escalade,
// 0 montée avant le semis) :
//   · sa ligne de niveau `synthese` est RETIRÉE       → la compétence NEUVE ;
//   · sa ligne `expression` est laissée telle quelle  → la compétence DÉJÀ
//     LETTRÉE, dont l'`updated_at` est plus vieux que la mesure qu'on sème ;
//   · deux mesures sont posées, une par compétence, horodatées MAINTENANT.
// C'est exactement la charge hétérogène qui échouait en entier.
//
// ⭐ LE RETRAIT PASSE PAR UN REGISTRE SUR LE DISQUE, jamais par une coïncidence
//    de valeurs : l'état AVANT y est écrit intégralement avant le premier geste,
//    et `--retire` le rend ligne par ligne. Le registre survit au processus —
//    c'est la leçon de `C6-L3`, où un registre en mémoire aurait tout perdu.
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } })

// ⭐ L'élève du décor. Choisi le 29/08 pour être inerte : 0 mesure, 0 escalade,
//    0 montée. ⛔ Ce n'est PAS l'élève `89662514`, qui porte le décor d'une autre
//    séance — « on ne sème pas sur le décor d'un autre lot ».
const ELEVE = '7f09fddf-9752-4847-8210-c4d9098c398a'
const NEUVE = 'synthese'      // sa ligne est retirée → la compétence NEUVE
const LETTREE = 'expression'  // sa ligne reste → la compétence DÉJÀ LETTRÉE
const REGISTRE = path.join(path.dirname(fileURLToPath(import.meta.url)),
  '.epreuve-reparation-c4l12-25.json')

const SEME = process.argv.includes('--seme')
const RETIRE = process.argv.includes('--retire')
if (SEME === RETIRE) {
  console.error('⛔ `--seme` OU `--retire`, exactement un des deux.')
  process.exit(2)
}

const lu = (nom, { data, error }) => {
  if (error) throw new Error(`${nom} : ${error.message}`)
  return data
}
const note = (t) => console.log(`   ${t}`)
const titre = (t) => console.log(`\n${'─'.repeat(78)}\n${t}\n${'─'.repeat(78)}`)

async function semer() {
  titre(`SEMIS — la signature de C4L12-24, sur ${ELEVE.slice(0, 8)} (bac à sable)`)
  if (fs.existsSync(REGISTRE)) {
    throw new Error('un registre existe déjà — le décor précédent n\'a pas été retiré. '
      + 'Jouer `--retire` d\'abord.')
  }

  // ── L'ÉTAT AVANT, RELEVÉ INTÉGRALEMENT ────────────────────────────────────
  const niveauxAvant = lu('niveaux avant', await admin.from('competences_niveaux')
    .select('*').eq('eleve_id', ELEVE))
  const mesuresAvant = lu('mesures avant', await admin.from('competences_mesures')
    .select('id').eq('eleve_id', ELEVE))
  // ⚠️ Ni `competences_escalade` ni `competences_montee` n'ont de colonne `id` :
  //    leurs clés sont (élève × compétence × observable) et (élève × compétence ×
  //    grain). ⭐ C'est `lu()` qui l'a dit — sans lui, `data: null` se serait lu
  //    « aucune escalade », et le semis aurait cru l'élève inerte à tort.
  const escAvant = lu('escalades avant', await admin.from('competences_escalade')
    .select('competence').eq('eleve_id', ELEVE))
  const monAvant = lu('montées avant', await admin.from('competences_montee')
    .select('competence').eq('eleve_id', ELEVE))
  note(`avant : ${niveauxAvant.length} niveau(x) · ${mesuresAvant.length} mesure(s) · `
    + `${escAvant.length} escalade(s) · ${monAvant.length} montée(s)`)
  if (mesuresAvant.length || escAvant.length || monAvant.length) {
    throw new Error('cet élève n\'est plus inerte — un autre décor est passé. On s\'arrête.')
  }
  const ligneNeuve = niveauxAvant.find((n) => n.competence === NEUVE)
  const ligneLettree = niveauxAvant.find((n) => n.competence === LETTREE)
  if (!ligneNeuve || !ligneLettree) throw new Error(`ligne ${NEUVE} ou ${LETTREE} introuvable.`)

  // ⭐ LE REGISTRE PART SUR LE DISQUE AVANT LE PREMIER GESTE.
  fs.writeFileSync(REGISTRE, JSON.stringify({
    quand: new Date().toISOString(), eleve: ELEVE, neuve: NEUVE, lettree: LETTREE,
    niveauxAvant, mesuresSemees: [],
  }, null, 2))
  note(`registre écrit : ${path.basename(REGISTRE)}`)

  // ── LE GESTE 0 — la compétence DÉJÀ LETTRÉE, FABRIQUÉE ────────────────────
  // ⚠️ IL FAUT LE DIRE : le bac à sable ne porte AUCUNE ligne déjà lettrée hors
  //    du décor d'une autre séance, et « on ne sème pas sur le décor d'un autre
  //    lot ». Le décor la fabrique donc, et le registre la rend.
  // ⭐ `lettre_initiale` EST LE DISCRIMINANT : `ligneDeNiveau` n'ajoute la clé
  //    que si l'état n'en a pas. Une compétence qui en porte une n'envoie PAS la
  //    clé, une compétence neuve l'envoie — et c'est là, exactement, que naissent
  //    les deux formes d'objet qui faisaient échouer la charge entière.
  // ⛔ `updated_at` est RENDU À SA VALEUR D'ORIGINE : la ligne doit rester PLUS
  //    VIEILLE que la mesure qu'on va semer, sinon la signature ne se forme pas.
  const { error: eMaj } = await admin.from('competences_niveaux')
    .update({ lettre: 'D', lettre_initiale: 'D', updated_at: ligneLettree.updated_at })
    .eq('eleve_id', ELEVE).eq('competence', LETTREE)
  if (eMaj) throw new Error(`pose de la lettre sur ${LETTREE} : ${eMaj.message}`)
  note(`✓ \`${LETTREE}\` rendue DÉJÀ LETTRÉE (lettre=D, initiale=D), `
    + `maj laissée au ${ligneLettree.updated_at.slice(0, 19)}`)

  // ── LE GESTE 1 — la ligne de la compétence NEUVE est retirée ───────────────
  const { error: eDel } = await admin.from('competences_niveaux').delete()
    .eq('eleve_id', ELEVE).eq('competence', NEUVE)
  if (eDel) throw new Error(`retrait de la ligne ${NEUVE} : ${eDel.message}`)
  note(`✓ ligne \`${NEUVE}\` retirée — la compétence est NEUVE, et son état n'a pas de lettre`)

  // ── LE GESTE 2 — deux mesures, horodatées MAINTENANT ──────────────────────
  const maintenant = new Date().toISOString()
  // ⛔ `classe` + `sommatif` — donc des ANCRES, et ce n'est pas un détail : une
  //    compétence sans lettre n'en reçoit une QUE d'une ancre (« sa première
  //    lettre vient de sa première ancre »). ⭐ C'est aussi ce que portent les
  //    treize mesures de `synthese` de la production, vérifié le 29/08 : sans
  //    cela, le décor n'éprouverait pas le cas réel.
  const commun = { eleve_id: ELEVE, modes: ['composer'], observables: {}, lieu: 'classe',
    forme: 'sommatif', sonde_montee: false, depot_id: null, bonus: false, mesure_at: maintenant }
  const semees = lu('mesures semées', await admin.from('competences_mesures').insert([
    { ...commun, competence: LETTREE, lettre_equivalente: 'C' },
    { ...commun, competence: NEUVE, lettre_equivalente: 'B' },
  ]).select('id, competence'))
  const reg = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))
  reg.mesuresSemees = semees
  fs.writeFileSync(REGISTRE, JSON.stringify(reg, null, 2))
  note(`✓ ${semees.length} mesure(s) semée(s), horodatées ${maintenant.slice(0, 19)}`)

  titre('LA SIGNATURE EST EN PLACE')
  note(`${ELEVE.slice(0, 8)} porte désormais : \`${NEUVE}\` MESURÉE SANS LIGNE, et \`${LETTREE}\` `
    + 'MESURÉE AVEC UNE LIGNE PLUS VIEILLE.')
  note('C\'est la charge hétérogène. Jouer maintenant :')
  console.log('\n     node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \\'
    + '\n          --import ./scripts/register-calibration-resolver.mjs \\'
    + '\n          scripts/recette/reparation-etats-c4l12-24.mjs --base=sandbox --repare\n')
  note('puis `--retire` ici pour rendre la base à son état.')
}

async function retirer() {
  titre('RETRAIT — par le REGISTRE, jamais par coïncidence de valeurs')
  if (!fs.existsSync(REGISTRE)) throw new Error('aucun registre : rien à retirer.')
  const reg = JSON.parse(fs.readFileSync(REGISTRE, 'utf-8'))

  // ① les mesures semées, par leur IDENTIFIANT
  if (reg.mesuresSemees.length) {
    const { error } = await admin.from('competences_mesures').delete()
      .in('id', reg.mesuresSemees.map((m) => m.id))
    if (error) throw new Error(`retrait des mesures : ${error.message}`)
    note(`✓ ${reg.mesuresSemees.length} mesure(s) semée(s) retirée(s)`)
  }
  // ② ce que la réparation a écrit — escalades et montées de cet élève, qui
  //    n'en avait AUCUNE avant (relevé et vérifié au semis).
  for (const t of ['competences_escalade', 'competences_montee']) {
    const { error, count } = await admin.from(t).delete({ count: 'exact' }).eq('eleve_id', reg.eleve)
    if (error) throw new Error(`retrait ${t} : ${error.message}`)
    if (count) note(`✓ ${count} ligne(s) de ${t} retirée(s) — il n'en avait aucune avant`)
  }
  // ③ les niveaux, RENDUS LIGNE PAR LIGNE À LEUR ÉTAT D'AVANT
  const { error: eDel } = await admin.from('competences_niveaux').delete().eq('eleve_id', reg.eleve)
  if (eDel) throw new Error(`nettoyage des niveaux : ${eDel.message}`)
  const { error: eIns } = await admin.from('competences_niveaux').insert(reg.niveauxAvant)
  if (eIns) throw new Error(`⛔⛔ RESTITUTION DES NIVEAUX ÉCHOUÉE : ${eIns.message} — LE REGISTRE `
    + `EST À ${REGISTRE}, NE L'EFFACEZ PAS.`)
  note(`✓ ${reg.niveauxAvant.length} ligne(s) de niveau rendues à l'identique`)

  // ── LE CONTRÔLE — par REQUÊTE, jamais sur la foi du retrait ────────────────
  const apres = lu('niveaux après', await admin.from('competences_niveaux')
    .select('*').eq('eleve_id', reg.eleve))
  const cle = (l) => `${l.competence}|${l.lettre}|${l.lettre_initiale}|${l.profil_provisoire}|${l.updated_at}`
  const memes = apres.length === reg.niveauxAvant.length
    && apres.map(cle).sort().join() === reg.niveauxAvant.map(cle).sort().join()
  const mesApres = lu('mesures après', await admin.from('competences_mesures')
    .select('id').eq('eleve_id', reg.eleve))
  console.log(memes && mesApres.length === 0
    ? '\n✓ La base est rendue à son état d\'avant, VÉRIFIÉ PAR REQUÊTE — '
      + `${apres.length} niveaux identiques, 0 mesure.\n`
    : `\n✗ ÉTAT NON RENDU — ${apres.length} niveaux, ${mesApres.length} mesures. `
      + `Le registre reste à ${path.basename(REGISTRE)}.\n`)
  if (memes && mesApres.length === 0) fs.unlinkSync(REGISTRE)
  else process.exitCode = 1
}

;(SEME ? semer() : retirer()).catch((e) => {
  console.error(`\n⛔ ${e.message}\n`); process.exitCode = 1
})
