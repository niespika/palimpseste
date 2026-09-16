// Recette locale (bac à sable) : un lien magique vers un exercice OUVERT (assigné ou ouvert, v1
// non rendue) de l'élève de test, pour éprouver le brouillon local du champ de rédaction (15/09).
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i), l.slice(i+1).replace(/^['"]|['"]$/g,'')]}))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const email = env.TEST_ELEVE_EMAIL
const { data: comptes } = await admin.auth.admin.listUsers({ perPage: 1000 })
const u = comptes.users.find(x => x.email?.toLowerCase() === email.toLowerCase())
if (!u) throw new Error('élève de test introuvable : ' + email)
const { data: depots } = await admin.from('exercices_depots').select('id, statut, assigne_at, texte_v1').eq('eleve_id', u.id).order('assigne_at', { ascending: false }).limit(40)
console.log('élève', u.id, '·', depots?.length, 'dépôts ;', (depots ?? []).map(d => `${d.id.slice(0,8)}:${d.statut}`).join(' '))
const ouvert = (depots ?? []).find(d => d.statut === 'assigne' || d.statut === 'ouvert')
const cible = ouvert ? `/eleve/modules/codex/exercice/${ouvert.id}` : '/eleve/modules/codex'
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
if (error) throw error
console.log('cible', cible, ouvert?.statut ?? '(aucun ouvert)', 'v1 en base :', (ouvert?.texte_v1 ?? '').length, 'car.')
console.log(`http://localhost:3000/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${cible}`)
