// ============================================================================
// RECETTE — LE REJEU AUTOMATIQUE D'UN RETOUR REFUSÉ, ET SON GARDE-FOU.
// ----------------------------------------------------------------------------
// « Après 3 retours refusés, on arrête et on accepte le retour tel quel, mais le
//   prof doit relire. »                        — décision de Louis, 27/08
//
// ⚠️⚠️ CE QUE CETTE RECETTE EXISTE POUR ÉPROUVER, ET QU'AUCUN TEST NE PEUT DIRE.
//    `utils/chaine/file.ts` porte `import 'server-only'` : il est **intestable
//    sous `npm test`**. Or le garde-fou du rejeu tient à UN détail de cette
//    file — `relancerUnJob` rend ses tentatives au job (c'est le geste de
//    l'HUMAIN), `remettreEnFile` ne les rend pas (c'est celui de la MACHINE).
//    **Bâtir le rejeu sur le premier ferait une boucle infinie** : sur un refus
//    déterministe, un appel brûlé par tour, à la minute, indéfiniment.
//
// ⛔ AUCUN APPEL DE MODÈLE ICI, ET AUCUN COÛT : on éprouve la MÉCANIQUE de la
//    file, pas la chaîne. Le décor est un job semé à la main sur un dépôt réel,
//    et il est retiré.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/rejeu-retour.mjs
// ============================================================================

import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf-8').split('\n')
  .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
for (const [k, v] of Object.entries(env)) process.env[k] ??= v

const RACINE = process.cwd()
const { remettreEnFile, mettreEnFile, relancerUnJob, cleIdempotence, clorePourEpuisement } =
  await import(`${RACINE}/utils/chaine/file.ts`)
const { attenteDuDepot } = await import(`${RACINE}/utils/deroule/mesure.ts`)
const { refusDeFormeSeulement } = await import(`${RACINE}/utils/chaine/retour.ts`)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

let ok = 0, ko = 0
const dire = (bon, t) => { if (bon) ok++; else ko++; console.log(`${bon ? '✓' : '✗'} ${t}`) }
const note = (t) => console.log(`  · ${t}`)
const titre = (t) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 66 - t.length))}`)

// Un dépôt RÉEL, choisi au hasard, sur lequel on sème un job d'une étape qui n'y
// est pas — puis qu'on retire. ⛔ Rien du dépôt lui-même n'est touché.
const { data: depots } = await admin.from('exercices_depots').select('id').limit(1)
if (!depots?.length) { console.error('aucun dépôt en base'); process.exit(2) }
const DEPOT = depots[0].id
const ETAPE = 'retour_v1'

const lire = async () => {
  const { data } = await admin.from('exercices_jobs')
    .select('id, statut, tentatives, tentatives_max, dernier_message')
    .eq('cle_idempotence', cleIdempotence(DEPOT, ETAPE)).maybeSingle()
  return data
}
const aboutir = async (id) => {
  await admin.from('exercices_jobs').update({ statut: 'abouti' }).eq('id', id)
}
/** Ce que `reclamerJobs` fait à la prise : il INCRÉMENTE `tentatives`. */
const prendre = async (j) => {
  await admin.from('exercices_jobs')
    .update({ statut: 'en_cours', tentatives: j.tentatives + 1 }).eq('id', j.id)
  return lire()
}

let creeParNous = false
try {
  titre('A. Le partage des deux familles de refus — le cœur du garde-fou')
  dire(refusDeFormeSeulement(['règle 2 : le retour commence par une réussite réelle, citée']),
    'la règle 2 est de FORME — elle se tolère à la dernière tentative')
  dire(!refusDeFormeSeulement([
    'règle 2 : le retour commence par une réussite réelle, citée',
    'RR3 : une citation étiquetée « copie » est une phrase DU TEXTE SUPPORT — « … »']),
  '⛔ un seul refus de FALSIFICATION retient tout le retour')

  titre('B. Le décor — un job semé sur un dépôt réel')
  const avant = await lire()
  if (avant) { console.log(`⊘ un job ${ETAPE} existe déjà sur ${DEPOT} : on s'arrête.`); process.exit(0) }
  const { job, erreur } = await mettreEnFile(admin, DEPOT, ETAPE)
  if (erreur || !job) throw new Error(`mise en file : ${erreur}`)
  creeParNous = true
  dire(job.tentatives === 0 && job.tentatives_max === 3,
    `job créé : tentatives ${job.tentatives}/${job.tentatives_max}`)

  titre('C. ⭐⭐ LE COMPTEUR MONTE — c\'est ce qui distingue un rejeu d\'une boucle')
  let j = await lire()
  for (let tour = 1; tour <= 3; tour++) {
    j = await prendre(j)                     // la file réclame : tentatives +1
    dire(j.tentatives === tour, `tour ${tour} : la prise porte tentatives à ${j.tentatives}`)
    await aboutir(j.id)                      // le tour se termine sur un refus
    const { remis, raison } = await remettreEnFile(admin, DEPOT, ETAPE, `refus au tour ${tour}`)
    j = await lire()
    if (tour < 3) {
      dire(remis && j.tentatives === tour,
        `  → remis en file, et le compteur RESTE à ${j.tentatives} — ${raison}`)
    } else {
      dire(!remis && /plafond/.test(raison),
        `  → ⛔ LE REJEU S'ARRÊTE au plafond : ${raison}`)
    }
  }

  titre('D. ⛔ LE PIÈGE — `relancerUnJob` RENDRAIT ses tentatives au job')
  const avantRelance = (await lire()).tentatives
  await relancerUnJob(admin, DEPOT, ETAPE, 'geste humain')
  const apresRelance = (await lire()).tentatives
  dire(avantRelance === 3 && apresRelance === 0,
    `le geste HUMAIN remet le compteur à zéro (${avantRelance} → ${apresRelance}) — c'est voulu, `
    + 'et c\'est exactement pourquoi le rejeu automatique ne peut pas s\'en servir')
  note('Bâti sur `relancerUnJob`, le rejeu aurait tourné indéfiniment : un appel par minute.')

  titre('E. Et la remise ne vole jamais un job qui tourne')
  await admin.from('exercices_jobs').update({ statut: 'en_attente' }).eq('id', job.id)
  const { remis, raison } = await remettreEnFile(admin, DEPOT, ETAPE, 'tentative de vol')
  dire(!remis && /déjà en file/.test(raison), `refusé : ${raison}`)

  titre('F. ⭐⭐ LE CUL-DE-SAC MUET, ET SA SORTIE (08/09) — l\'épreuve par l\'ÉCHEC d\'abord')
  note('Le plafond arrêtait bien la boucle — mais il laissait le job `abouti`, sans retour,')
  note('et `echec_definitif` à FAUX. Personne ne voyait cet état : ni la file (qui ne reprend')
  note('pas un `abouti`), ni l\'élève (l\'écran ne rend rien), ni le professeur.')
  // On remet le job dans l'état EXACT du défaut : abouti, au plafond, sans retour.
  await admin.from('exercices_jobs')
    .update({ statut: 'abouti', tentatives: 3, echec_definitif: false }).eq('id', job.id)
  let att = await attenteDuDepot(admin, DEPOT)
  dire(att.enCours === false && att.echecDefinitif === false,
    '⛔ AVANT — abouti 3/3 sans retour : `enCours` FAUX et `echecDefinitif` FAUX, '
    + 'donc l\'écran d\'attente ne rend RIEN')
  const auPlafond = await remettreEnFile(admin, DEPOT, ETAPE, 'refus jamais tolérable')
  dire(!auPlafond.remis && auPlafond.motif === 'plafond',
    `la file refuse, et son motif est un DISCRIMINANT : « ${auPlafond.motif} » `
    + '— on ne relit plus une phrase française pour décider')
  const sortie = await clorePourEpuisement(admin, DEPOT, ETAPE,
    'retour NON écrit après 3 tentatives, et le refus n\'est pas tolérable — <motif du refus>')
  dire(sortie.close, `la sortie est posée : ${sortie.raison}`)
  att = await attenteDuDepot(admin, DEPOT)
  dire(att.echecDefinitif === true,
    '⭐ APRÈS — `echecDefinitif` est VRAI : l\'écran dit « ton retour n\'a pas pu être préparé, '
    + 'préviens ton professeur »')
  dire((att.message ?? '').includes('après 3 tentatives'),
    'et le motif est persisté pour le PROFESSEUR (l\'écran de l\'élève ne le montre pas — RR4)')
  // ⛔ La contre-épreuve : un job qui TOURNE n'est jamais déclaré perdu.
  await admin.from('exercices_jobs')
    .update({ statut: 'en_cours', echec_definitif: false }).eq('id', job.id)
  const refusee = await clorePourEpuisement(admin, DEPOT, ETAPE, 'ne doit pas passer')
  dire(!refusee.close && /tourne encore/.test(refusee.raison),
    `⛔ et elle REFUSE un job qui tourne encore : ${refusee.raison}`)
} catch (e) {
  ko++
  console.error(`\n✗ ARRÊT : ${e.message}`)
} finally {
  if (creeParNous) {
    await admin.from('exercices_jobs').delete().eq('cle_idempotence', cleIdempotence(DEPOT, ETAPE))
    const reste = await lire()
    dire(!reste, 'le décor est retiré : aucun job ne survit')
  }
}

console.log(`\n${'═'.repeat(70)}`)
console.log(`RECETTE — rejeu du retour : ${ok} vérification(s) OK, ${ko} échec(s).`)
console.log('═'.repeat(70))
process.exit(ko === 0 ? 0 : 1)
