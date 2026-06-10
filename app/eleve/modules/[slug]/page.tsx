import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'

export default async function PageModule({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Vérifier que ce module existe et est actif
  const { data: module } = await supabase
    .from('modules')
    .select('id, nom, slug, actif')
    .eq('slug', slug)
    .eq('actif', true)
    .single()

  if (!module) notFound()

  // Vérifier que l'élève a accès à ce module
  const { data: assignment } = await supabase
    .from('module_assignments')
    .select('id')
    .eq('eleve_id', user!.id)
    .eq('module_id', module.id)
    .single()

  if (!assignment) notFound()

  return (
    <div>
      <Link
        href="/eleve"
        className="text-sm text-stone-500 hover:text-stone-700 mb-6 inline-flex items-center gap-1"
      >
        ← Retour
      </Link>

      <div className="bg-white border border-stone-200 rounded-xl p-8 text-center mt-4">
        <h2 className="text-xl font-serif text-stone-900 mb-3">{module.nom}</h2>
        <p className="text-stone-500 text-sm leading-relaxed">
          Ce module arrive bientôt.<br />
          Ton professeur est en train de préparer le contenu.
        </p>
      </div>
    </div>
  )
}
