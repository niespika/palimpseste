import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { EditeurRetour } from './EditeurRetour'
import type { RetourCritique } from '../actions'

export default async function ValidationDetailPage({
  params,
}: {
  params: Promise<{ travailId: string }>
}) {
  const { travailId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()

  const { data: travail } = await admin
    .from('codex_travaux')
    .select('id, eleve_id, session_id, retour_critique, synthese_completee, texte_vf_ocr, statut_validation')
    .eq('id', travailId)
    .single()

  if (!travail) notFound()

  const [{ data: eleve }, { data: session }] = await Promise.all([
    admin.from('profiles').select('display_name').eq('id', travail.eleve_id).single(),
    admin.from('codex_sessions').select('classe_id, scriptorium_unites(label), classes(nom)').eq('id', travail.session_id).single(),
  ])

  const u = session?.scriptorium_unites as { label: string } | { label: string }[] | null
  const uniteLabel = Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? ''
  const c = session?.classes as { nom: string } | { nom: string }[] | null
  const classeNom = Array.isArray(c) ? c[0]?.nom ?? null : c?.nom ?? null

  const retour = (travail.retour_critique as RetourCritique | null) ?? {
    erreurs_corrections: [],
    suivi_suggestions: [],
    pouvait_aller_plus_loin: [],
    non_ameliore: [],
    ajouts: [],
  }

  return (
    <div>
      <div className="mb-6">
        <Link href={`/prof/codex/synthese/${travail.session_id}`} className="text-sm text-stone-500 hover:text-stone-700">
          ← Synthèse
        </Link>
        <h3 className="text-lg font-serif text-stone-900 mt-2">{eleve?.display_name ?? '—'}</h3>
        <p className="text-sm text-stone-400">
          {uniteLabel}{classeNom ? ` · ${classeNom}` : ''}
          {travail.statut_validation === 'valide' && <span className="ml-2 text-green-600">· validé</span>}
        </p>
      </div>

      <EditeurRetour
        travailId={travailId}
        retourInitial={retour}
        syntheseInitiale={travail.synthese_completee ?? ''}
        transcriptionVf={travail.texte_vf_ocr ?? ''}
        dejaValide={travail.statut_validation === 'valide'}
      />
    </div>
  )
}
