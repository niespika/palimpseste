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

  // NE RIEN exécuter entre createServerClient et getUser() (cf. @supabase/ssr) :
  // getUser() rafraîchit la session si le token a expiré. Best-effort : si le serveur
  // Auth est injoignable, on ne bloque pas le proxy (un throw 500-erait toutes les
  // routes, y compris /login) ; les getUser() des layouts/actions restent l'autorité.
  try {
    await supabase.auth.getUser()
  } catch {
    // Auth temporairement indisponible : le refresh de session est ignoré.
  }

  return supabaseResponse
}
