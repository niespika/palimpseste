import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { seuilModule } from '@/app/eleve/seuil-module'

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

  // Accès & classes · L1 — l'accès se juge sur la classe EN CONTEXTE, pas sur
  // l'union des classes de l'élève. Le 404 sec devient un écran qui dit dans
  // quelle classe le module est ouvert (et reste un refus si aucune ne l'a).
  const seuil = await seuilModule(supabase, user!.id, module.id, module.nom)
  if (seuil.type === 'ecran') return seuil.noeud

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
