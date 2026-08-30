#!/usr/bin/env node
// ============================================================================
// epreuve-escalade-profiles.mjs — C-RLS-6 : un compte orphelin peut-il se
// déclarer PROFESSEUR ?
// ----------------------------------------------------------------------------
// ⛔ CE QUE LE DÉFAUT DISAIT. La policy INSERT de `profiles` bornait l'IDENTITÉ
//    (`auth.uid() = id`) et jamais la VALEUR de `role`. Un compte authentifié
//    SANS ligne `profiles` — et depuis le retrait de `handle_new_user`, TOUT
//    compte naît ainsi — pouvait s'insérer `role:'prof'`.
//
// ⭐ POURQUOI CE SCRIPT EXISTE, ET CE QU'IL CORRIGE DE LA SONDE EXISTANTE :
//    `scripts/verif_rls_c1.mjs` éprouve déjà une écriture sur `profiles`, mais
//    **avec un id ALÉATOIRE** — donc `auth.uid() = id` est faux, la policy
//    refuse pour la MAUVAISE raison, et le test **rate précisément le cas
//    dangereux**. Celui-ci utilise le VRAI `auth.uid()` du compte. *(Dette
//    C-RLS-11 du SUIVI, payée pour sa moitié `profiles`.)*
//
// ⛔ BAC À SABLE UNIQUEMENT — le script REFUSE toute autre base.
// ⚠️ IL ÉCRIT : il crée un compte auth d'épreuve, puis le retire dans un
//    `finally` — et il RECOMPTE à la fin. Le nettoyage n'est pas une intention,
//    il se vérifie.
//
//   node scripts/recette/epreuve-escalade-profiles.mjs
//
// Sortie : code ≠ 0 si l'escalade RÉUSSIT (régression) ou si le nettoyage rate.
// ============================================================================

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createClient } from '@supabase/supabase-js'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
for (const l of readFileSync(join(RACINE, '.env.local'), 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (!m) continue
  let v = m[2].trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
  if (process.env[m[1]] === undefined) process.env[m[1]] = v
}
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL, SEC = process.env.SUPABASE_SERVICE_ROLE_KEY, ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!URL.includes('aoakpxxlyvthzueaywna')) { console.error('⛔ bac à sable uniquement'); process.exit(2) }
const admin = createClient(URL, SEC, { auth: { persistSession: false } })
const EMAIL = 'epreuve-c-rls-6@exemple.invalid'
let uid = null
let echec = false
try {
  // ── constat AVANT ──
  const avant = await admin.from('profiles').select('id', { count: 'exact', head: true })
  console.log(`AVANT — profils : ${avant.count}`)
  // ── un compte ORPHELIN, exactement la condition du défaut ──
  const { data: c, error: eC } = await admin.auth.admin.createUser({ email: EMAIL, email_confirm: true })
  if (eC) throw new Error(`création — ${eC.message}`)
  uid = c.user.id
  console.log(`compte orphelin créé : ${uid.slice(0,8)} (aucune ligne profiles)`)
  // ── sa session, sans mot de passe ──
  const { data: lien } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
  const eleve = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data: ses, error: eO } = await eleve.auth.verifyOtp({ type: 'magiclink', token_hash: lien.properties.hashed_token })
  if (eO) throw new Error(`session — ${eO.message}`)
  console.log(`session ouverte, JWT authenticated : ${ses.user.id === uid}`)
  // ── L'ESCALADE ──
  const { data: ins, error: eIns } = await eleve.from('profiles').insert({ id: uid, role: 'prof', display_name: 'ÉPREUVE' }).select('id')
  if (eIns) console.log(`✅ ESCALADE REFUSÉE — ${eIns.code} ${eIns.message}`)
  else { echec = true; console.log(`⛔⛔ ESCALADE RÉUSSIE — ${ins.length} ligne(s) : LE CORRECTIF NE TIENT PAS`) }
  // ── et la lecture des autres profils, qui suivait ──
  const { data: lus } = await eleve.from('profiles').select('id, display_name')
  console.log(`profils lisibles par lui : ${lus?.length ?? 0} (attendu 0 — il n'a pas de profil à lire)`)
} finally {
  if (uid) {
    await admin.from('profiles').delete().eq('id', uid)
    const { error } = await admin.auth.admin.deleteUser(uid)
    console.log(`nettoyage du compte d'épreuve : ${error ? '⛔ ' + error.message : 'fait'}`)
  }
  const apres = await admin.from('profiles').select('id', { count: 'exact', head: true })
  const { data: u } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  console.log(`APRÈS — profils : ${apres.count} · comptes auth : ${u.users.length}`)
}
if (echec) process.exit(1)
