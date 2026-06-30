import { type NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'

// Cible du lien d'invitation : vérifie le token (pose les cookies de session via
// le client serveur @supabase/ssr) puis redirige vers la finalisation. Placé hors
// des layouts prof/élève (racine), donc atteignable par un élève en cours d'accès.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/finaliser-inscription'
  // Évite une redirection ouverte : on n'accepte qu'un chemin interne.
  const cible = next.startsWith('/') ? next : '/finaliser-inscription'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      return NextResponse.redirect(new URL(cible, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?erreur=lien', origin))
}
