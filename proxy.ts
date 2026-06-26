import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

// Proxy Next 16 (ex-« middleware ») — rafraîchit la session Supabase avant le rendu.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // Toutes les routes sauf API (auth propre, pas de Server Component à pré-rafraîchir)
  // et assets statiques / images.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
