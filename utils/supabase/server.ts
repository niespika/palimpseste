import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Une instance par rendu serveur, jamais partagée entre deux requêtes/utilisateurs.
// Les lecteurs mémoïsés qui la reçoivent retrouvent ainsi la même clé de cache.
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Les Server Components ne peuvent pas définir de cookies — ignoré
          }
        },
      },
    }
  )
})
