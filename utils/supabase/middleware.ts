import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rafraîchissement de la session Supabase (pattern officiel @supabase/ssr), appelé
// depuis le proxy Next 16 (proxy.ts). À chaque navigation, le token est rafraîchi
// AVANT le rendu de la page → évite que des Server Components reçoivent un token
// expiré (eux ne peuvent pas réécrire les cookies). COMPLÉMENT des checks getUser()
// des layouts/actions, pas un remplacement (cf. doc Next 16 : le proxy n'est pas une
// solution d'autorisation à lui seul).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // NE RIEN exécuter entre createServerClient et getClaims() (cf. @supabase/ssr) :
  // getClaims() lit la session, donc la RAFRAÎCHIT si le token a expiré — c'est
  // tout ce que ce proxy a à faire. Best-effort : si le serveur Auth est
  // injoignable, on ne bloque pas le proxy (un throw 500-erait toutes les routes,
  // y compris /login) ; les getUser() des layouts/actions restent l'autorité.
  //
  // ⭐ 17/09 — `getClaims`, plus `getUser`. Les jetons des deux bases sont signés
  //    en ES256 (mesuré) : la signature se vérifie ICI, avec la clé publique
  //    gardée en mémoire, sans aller-retour. `getUser` en coûtait un sur CHAQUE
  //    requête — navigation, Server Action, et chacun des 6 à 12 préchargements
  //    de liens d'un écran : 69 000 appels en 7 jours, avant tout rendu.
  //    Rien ne se relâche : ce proxy n'a jamais autorisé personne, et le rendu
  //    fait toujours son `getUser`, vérifié par le serveur.
  // ⛔ Si un projet repassait à une clé symétrique (HS256), `getClaims` retombe
  //    de lui-même sur `getUser` : plus lent, jamais moins sûr.
  try {
    await supabase.auth.getClaims()
  } catch {
    // Auth temporairement indisponible : le refresh de session est ignoré.
  }

  return supabaseResponse
}
