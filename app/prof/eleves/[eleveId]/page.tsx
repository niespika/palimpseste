import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { moduleIdsAccessibles } from '@/utils/acces'
import Tuile from '@/components/Tuile'

// Hub transverse d'un élève (Pilotage › Élèves › nom). Point d'entrée vers les
// vues détaillées de chaque module (diagnostics, rendus, évaluations).
export default async function PageEleveHub({
  params,
}: {
  params: Promise<{ eleveId: string }>
}) {
  const { eleveId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: moi } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (moi?.role !== 'prof') notFound()

  const admin = createAdminClient()

  const { data: profil } = await admin
    .from('profiles')
    .select('display_name, role')
    .eq('id', eleveId)
    .maybeSingle()
  if (!profil || profil.role !== 'eleve') notFound()

  const [{ data: authUser }, { data: inscrits }, { data: modules }, modulesAcces] = await Promise.all([
    admin.auth.admin.getUserById(eleveId),
    admin
      .from('inscriptions')
      .select('classe_id, statut, classes(id, nom)')
      .eq('eleve_id', eleveId)
      .eq('statut', 'active'),
    admin.from('modules').select('id, slug').eq('actif', true),
    moduleIdsAccessibles(admin, eleveId),
  ])

  const email = authUser?.user?.email ?? '—'
  const classes = (inscrits ?? [])
    .map(i => {
      const c = i.classes as { id: string; nom: string } | { id: string; nom: string }[] | null
      return Array.isArray(c) ? c[0] : c
    })
    .filter((c): c is { id: string; nom: string } => !!c)
  const premiereClasse = classes[0]?.id ?? null
  const qsClasse = premiereClasse ? `?classe=${premiereClasse}` : ''

  const idParSlug = new Map((modules ?? []).map(m => [m.slug as string, m.id as string]))
  const aAcces = (slug: string) => {
    const id = idParSlug.get(slug)
    return id ? modulesAcces.has(id) : false
  }

  // Vues détaillées par module. Codex n'a pas de vue par élève → on pointe vers
  // le module (navigation par synthèse).
  const cartes: { slug: string; nom: string; href: string; note: string }[] = [
    { slug: 'fragments-erudition', nom: 'Fragments', href: `/prof/fragments-erudition/eleve/${eleveId}${qsClasse}`, note: 'Parcours, dépôts, analyses' },
    { slug: 'quazian', nom: 'Quazian', href: `/prof/quazian/diagnostic/${eleveId}`, note: 'Diagnostic FSRS + quizz' },
    { slug: 'codex', nom: 'Codex', href: `/prof/codex`, note: 'Synthèses (vue par synthèse)' },
    { slug: 'aletheia', nom: 'Aletheia', href: `/prof/aletheia/eleve/${eleveId}`, note: 'Lectures, retours, diagnostic' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/prof/eleves" className="text-sm text-muet hover:text-encre-douce">← Élèves</Link>
        <h2 className="text-xl font-serif text-encre mt-2">{profil.display_name}</h2>
        <p className="text-sm text-muet">{email}</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {classes.length > 0 ? classes.map(c => (
            <span key={c.id} className="text-xs bg-info-teinte text-info px-2 py-0.5 rounded-full">{c.nom}</span>
          )) : (
            <span className="text-xs bg-parchemin-fonce text-muet px-2 py-0.5 rounded-full">Aucune classe active</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-muet uppercase tracking-wide mb-3">Par module</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cartes.map(c => (
            <Tuile
              key={c.slug}
              nom={c.nom}
              sousTitre={c.note}
              href={c.href}
              couleur={aAcces(c.slug) ? 'vert' : 'neutre'}
              resume={!aAcces(c.slug) ? <span className="text-xs text-muet">Module non assigné à sa classe</span> : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
