import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Une instance par rendu serveur, jamais partagée entre deux requêtes/utilisateurs.
// Les lecteurs mémoïsés qui la reçoivent retrouvent ainsi la même clé de cache.
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies()

  const client = createServerClient(
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

  // ⭐ 17/09 — UN `getUser()` PAR RENDU. Le layout, la page et chaque chargeur
  //    appelaient chacun `auth.getUser()` : 3 à 5 allers-retours vers le serveur
  //    d'authentification pour la même réponse, tous sur le chemin critique. Ce
  //    client étant le même pour tout le rendu (`cache`), la première réponse est
  //    gardée. C'est toujours un VRAI `getUser` — vérifié par le serveur, pas un
  //    jeton cru sur parole. Hors rendu (Server Action, route), `cache` ne
  //    mémoïse pas : chaque `createClient()` rend un client neuf, avec sa propre
  //    vérification. ⚠️ La mémoire tient au CLIENT : une action qui garde le
  //    même `supabase` pour deux `getUser()` n'en paie qu'un, elle aussi.
  // ⛔ Un changement de session (connexion, déconnexion, jeton rafraîchi) vide
  //    la mémoire : ce qu'on savait ne vaut plus.
  const lire = client.auth.getUser.bind(client.auth)
  let connu: ReturnType<typeof lire> | null = null
  // `INITIAL_SESSION` n'est pas un changement : c'est l'écho de l'abonnement, et
  // il arrive APRÈS le premier `getUser` — l'écouter viderait la mémoire à peine
  // remplie.
  client.auth.onAuthStateChange((evenement) => {
    if (evenement !== 'INITIAL_SESSION') connu = null
  })
  client.auth.getUser = ((jwt?: string) =>
    jwt ? lire(jwt) : (connu ??= lire())) as typeof client.auth.getUser

  return client
})
