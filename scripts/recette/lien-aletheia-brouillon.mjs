// Recette locale (bac à sable) : un lien magique vers une séance Aletheia OUVERTE (DRAFT ou
// sans travail) de l'élève de test, pour éprouver le brouillon local des formulaires.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>/^[A-Z_]+=/.test(l)).map(l=>{const i=l.indexOf('=');return [l.slice(0,i), l.slice(i+1).replace(/^['"]|['"]$/g,'')]}))
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const email = env.TEST_ELEVE_EMAIL
const { data: comptes } = await admin.auth.admin.listUsers({ perPage: 1000 })
const u = comptes.users.find(x => x.email?.toLowerCase() === email.toLowerCase())
if (!u) throw new Error('élève de test introuvable : ' + email)
const { data: travaux } = await admin.from('aletheia_travaux').select('scriptorium_livre_id, semaine_index, statut, updated_at').eq('eleve_id', u.id).order('updated_at', { ascending: false })
console.log('élève', u.id, '·', travaux?.length, 'travaux ;', (travaux ?? []).map(t => `${t.scriptorium_livre_id.slice(0,8)}/${t.semaine_index}:${t.statut}`).join(' '))
const ouvert = (travaux ?? []).find(t => t.statut === 'DRAFT' || t.statut === 'FEEDBACK1_READY')
const cible = ouvert ? `/eleve/modules/aletheia/${ouvert.scriptorium_livre_id}/${ouvert.semaine_index}` : '/eleve/modules/aletheia'
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email })
if (error) throw error
console.log('cible', cible, ouvert?.statut ?? '(aucune ouverte)')
console.log(`http://localhost:3000/auth/confirm?token_hash=${data.properties.hashed_token}&type=magiclink&next=${cible}`)
