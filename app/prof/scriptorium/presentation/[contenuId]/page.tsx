import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Presentation from './Presentation'

// ============================================================================
// PROJETER LE DECK D'UN COURS (prof seul). 14/09/2026.
// Le fichier HTML vit dans le bucket privé `scriptorium` ; il est servi PAR
// L'APPLICATION (route `./fichier`, voir pourquoi là-bas) et affiché dans un
// cadre plein-page, avec le plein écran demandé par l'application.
// ⛔ Jamais lu par le RAG.
// ============================================================================

export default async function PagePresentation({ params }: { params: Promise<{ contenuId: string }> }) {
  const { contenuId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { data: contenu } = await admin.from('scriptorium_contenus')
    .select('id, titre, presentation_ref').eq('id', contenuId).maybeSingle()
  const ref = (contenu as { presentation_ref?: string | null } | null)?.presentation_ref
  if (!contenu || !ref) notFound()

  return <Presentation url={`/prof/scriptorium/presentation/${contenuId}/fichier`} titre={contenu.titre as string} />
}
