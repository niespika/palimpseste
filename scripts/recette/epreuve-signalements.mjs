// ============================================================================
// ÉPREUVE — LES REFUS DU SIGNALEMENT, EN BASE ET PAR L'ÉCHEC.
// ----------------------------------------------------------------------------
// ⭐ « L'épreuve par l'ÉCHEC avant l'épreuve par le succès. » L'écran a montré
//    que les chemins nominaux marchent ; ce script éprouve ce qu'on ne peut pas
//    provoquer à la main : un dépôt `clos`, un dépôt qui porte du travail rendu,
//    une instance bloquée par la fabrique.
//
// ⛔ IL REMET TOUT COMME IL L'A TROUVÉ — chaque cas relève l'état AVANT, écrit,
//    constate, puis restaure et LE VÉRIFIE PAR REQUÊTE.
//
// ⛔ BAC À SABLE UNIQUEMENT.
//
// Usage :
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON \
//        --import ./scripts/register-calibration-resolver.mjs \
//        scripts/recette/epreuve-signalements.mjs
// ============================================================================

import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
if (!env.NEXT_PUBLIC_SUPABASE_URL?.includes('aoakpxxlyvthzueaywna')) {
  console.error('✗ REFUS : ce n\'est pas le bac à sable.'); process.exit(1)
}
process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

const {
  poserLeSignalement, retirerLeSignalement, arbitrerUnSignalement, basculerLePool,
  lireLeSignalementDuDepot,
} = await import('../../utils/signalements/serveur.ts')

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } })

const MAINTENANT = '2026-08-31T20:00:00.000Z'
let vert = 0; let rouge = 0
const dit = (ok, quoi, detail = '') => {
  if (ok) { vert++; console.log(`  ✔ ${quoi}${detail ? ` — ${detail}` : ''}`) }
  else { rouge++; console.log(`  ✗ ${quoi}${detail ? ` — ${detail}` : ''}`) }
}
const lu = (nom, { data, error }) => { if (error) throw new Error(`${nom} : ${error.message}`); return data }

// ── Le cobaye : un dépôt qui porte déjà un signalement de décor ────────────
const sigs = lu('signalements', await admin.from('exercices_signalements_eleve')
  .select('id, depot_id, exercice_id, eleve_id, texte, arbitrage'))
const cobaye = sigs.find((s) => s.arbitrage === null)
if (!cobaye) { console.error('✗ aucun signalement en attente : jouer --seme d\'abord.'); process.exit(1) }
const depot = { id: cobaye.depot_id, exerciceId: cobaye.exercice_id, eleveId: cobaye.eleve_id }

console.log('\n① Le texte vide et le texte trop long sont REFUSÉS')
{
  const a = await poserLeSignalement(admin, depot, '   ', MAINTENANT)
  dit(!a.ok, 'texte vide refusé', a.message)
  const b = await poserLeSignalement(admin, depot, 'x'.repeat(1501), MAINTENANT)
  dit(!b.ok, 'texte de 1501 caractères refusé', b.message)
  const apres = await lireLeSignalementDuDepot(admin, depot.id)
  dit(apres?.texte === cobaye.texte, 'le texte en base n\'a pas bougé')
}

console.log('\n② Amender ne remet PAS un signalement tranché en attente')
{
  await admin.from('exercices_signalements_eleve')
    .update({ arbitrage: 'ecarte', arbitre_at: MAINTENANT }).eq('id', cobaye.id)
  const r = await poserLeSignalement(admin, depot, 'Je reformule mon problème. ⟦décor⟧', MAINTENANT)
  const apres = await lireLeSignalementDuDepot(admin, depot.id)
  dit(r.ok && apres?.arbitrage === 'ecarte',
    'le texte change, l\'arbitrage reste', `arbitrage = ${apres?.arbitrage}`)

  const d = await retirerLeSignalement(admin, depot.id)
  dit(!d.ok, 'l\'élève ne peut plus se rétracter après l\'arbitrage', d.message)

  await admin.from('exercices_signalements_eleve')
    .update({ arbitrage: null, arbitre_at: null, texte: cobaye.texte }).eq('id', cobaye.id)
  const remis = await lireLeSignalementDuDepot(admin, depot.id)
  dit(remis?.arbitrage === null && remis?.texte === cobaye.texte, 'état d\'avant restauré')
}

console.log('\n③ Un dépôt CLOS ne sort plus du comptage')
{
  const avant = lu('dépôt', await admin.from('exercices_depots')
    .select('statut').eq('id', depot.id).maybeSingle())
  await admin.from('exercices_depots').update({ statut: 'clos' }).eq('id', depot.id)
  const r = await arbitrerUnSignalement(admin, cobaye.id, 'confirme', cobaye.eleve_id, MAINTENANT)
  dit(!r.ok && r.message.includes('clos'), 'refus explicite sur un dépôt clos', r.message)
  const sig = lu('sig', await admin.from('exercices_signalements_eleve')
    .select('arbitrage').eq('id', cobaye.id).maybeSingle())
  dit(sig.arbitrage === null, '⭐ et RIEN n\'a été écrit : un refus n\'enregistre pas un arbitrage')
  await admin.from('exercices_depots').update({ statut: avant.statut }).eq('id', depot.id)
  const apres = lu('dépôt', await admin.from('exercices_depots')
    .select('statut').eq('id', depot.id).maybeSingle())
  dit(apres.statut === avant.statut, `statut restauré (${avant.statut})`)
}

console.log('\n④ Remettre au comptage un dépôt qui porte du travail rendu est REFUSÉ')
{
  const avant = lu('dépôt', await admin.from('exercices_depots')
    .select('statut, v1_remis_at').eq('id', depot.id).maybeSingle())
  await admin.from('exercices_depots')
    .update({ statut: 'retire', v1_remis_at: MAINTENANT }).eq('id', depot.id)
  await admin.from('exercices_signalements_eleve')
    .update({ arbitrage: 'confirme', arbitre_at: MAINTENANT }).eq('id', cobaye.id)
  const r = await arbitrerUnSignalement(admin, cobaye.id, 'ecarte', cobaye.eleve_id, MAINTENANT)
  dit(!r.ok && r.message.includes('travail rendu'), 'refus explicite', r.message)
  await admin.from('exercices_depots')
    .update({ statut: avant.statut, v1_remis_at: avant.v1_remis_at }).eq('id', depot.id)
  await admin.from('exercices_signalements_eleve')
    .update({ arbitrage: null, arbitre_at: null }).eq('id', cobaye.id)
  const apres = lu('dépôt', await admin.from('exercices_depots')
    .select('statut, v1_remis_at').eq('id', depot.id).maybeSingle())
  dit(apres.statut === avant.statut && apres.v1_remis_at === avant.v1_remis_at, 'état restauré')
}

console.log('\n⑤ Une instance bloquée PAR LA FABRIQUE ne revient pas au pool par notre coche')
{
  const dejaBloquees = lu('bloquées', await admin.from('exercices')
    .select('id, blocages').eq('bloque', true))
  const fabrique = dejaBloquees.find((e) => (e.blocages ?? [])
    .some((b) => !String(b).startsWith('[signalement]')))
  if (!fabrique) { dit(false, 'aucune instance bloquée par la fabrique dans cette base'); }
  else {
    const r = await basculerLePool(admin, fabrique.id, true, MAINTENANT)
    dit(!r.ok, 'refus', r.message)
    dit(r.details.length > 0, 'et le motif d\'origine est NOMMÉ', r.details[0]?.slice(0, 70))
    const apres = lu('après', await admin.from('exercices')
      .select('bloque').eq('id', fabrique.id).maybeSingle())
    dit(apres.bloque === true, 'l\'instance est restée bloquée')
  }
}

console.log(`\n${rouge === 0 ? '✔' : '✗'} ${vert} vert(s), ${rouge} rouge(s).`)
process.exit(rouge === 0 ? 0 : 1)
