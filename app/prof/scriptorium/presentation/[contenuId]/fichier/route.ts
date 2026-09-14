import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

// ============================================================================
// SERVIR LE DECK D'UN COURS (prof seul). 14/09/2026.
// ⛔ Mesuré le 14/09 : le stockage Supabase sert un `.html` en `text/plain` avec
//    `Content-Security-Policy: default-src 'none'; sandbox`, URL signée comprise —
//    un navigateur y montre le code source, jamais la page. Le fichier passe donc
//    PAR L'APPLICATION : lu par le service-role, rendu en `text/html`, jamais mis
//    en cache. C'est cette route que l'iframe de projection et le lien « Onglet »
//    ouvrent. Le deck est un HTML autonome de Louis : il s'exécute tel quel.
// ============================================================================
export async function GET(_req: Request, { params }: { params: Promise<{ contenuId: string }> }) {
  const { contenuId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Non authentifié', { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') return new NextResponse('Accès refusé', { status: 403 })

  const admin = createAdminClient()
  const { data: contenu } = await admin.from('scriptorium_contenus')
    .select('presentation_ref').eq('id', contenuId).maybeSingle()
  const ref = (contenu as { presentation_ref?: string | null } | null)?.presentation_ref
  if (!ref) return new NextResponse('Aucune présentation', { status: 404 })
  const { data: blob, error } = await admin.storage.from('scriptorium').download(ref)
  if (error || !blob) return new NextResponse('Fichier indisponible', { status: 404 })
  return new NextResponse(await blob.arrayBuffer(), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Origine OPAQUE, même ouvert dans un onglet ou en fenêtre présentateur : le
      // deck ne lit ni les cookies de session ni l'application. Pas de restriction
      // réseau (polices Google du moteur maison). Voir `Presentation.tsx`.
      'Content-Security-Policy': 'sandbox allow-scripts allow-popups allow-modals allow-downloads',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
