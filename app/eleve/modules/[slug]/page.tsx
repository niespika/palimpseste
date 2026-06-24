import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { aAccesModule } from '@/utils/acces'

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

  // Vérifier que l'élève a accès à ce module (dérivé de ses classes)
  if (!(await aAccesModule(supabase, user!.id, module.id))) notFound()

  return (
    <div>
      <Link
        href="/eleve"
        className="text-sm text-muet hover:text-encre-douce mb-6 inline-flex items-center gap-1"
      >
        ← Retour
      </Link>

      <div className="bg-surface border border-bordure rounded-xl p-8 text-center mt-4">
        <h2 className="text-xl font-serif text-encre mb-3">{module.nom}</h2>
        <p className="text-muet text-sm leading-relaxed">
          Ce module arrive bientôt.<br />
          Ton professeur est en train de préparer le contenu.
        </p>
      </div>
    </div>
  )
}
