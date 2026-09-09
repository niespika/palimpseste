import 'server-only'
import { cache } from 'react'
import { createClient } from './server'

// Déduplique uniquement pendant le rendu React courant. Aucun cache persistant :
// la prochaine navigation/action revérifie la session et le rôle dans la base.
// Le lecteur ne redirige pas : chaque garde conserve sa réponse habituelle.
export const lireIdentite = cache(async function lireIdentite() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, profile: null }
  const { data: profile } = await supabase.from('profiles')
    .select('role, display_name').eq('id', user.id).single()
  return { supabase, user, profile }
})
