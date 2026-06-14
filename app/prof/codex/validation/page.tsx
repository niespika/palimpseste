import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { FileValidation, type LigneValidation } from './FileValidation'
import type { RetourCritique } from './actions'

export default async function ValidationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()

  const { data: travaux } = await admin
    .from('codex_travaux')
    .select('id, eleve_id, session_id, statut_validation, retour_critique, ocr_confiance_vf')
    .eq('analyse_vf_statut', 'prete')

  const lignes: LigneValidation[] = []

  if (travaux && travaux.length > 0) {
    const eleveIds = [...new Set(travaux.map((t) => t.eleve_id))]
    const sessionIds = [...new Set(travaux.map((t) => t.session_id))]

    const [{ data: profils }, { data: sessions }] = await Promise.all([
      admin.from('profiles').select('id, display_name').in('id', eleveIds),
      admin.from('codex_sessions').select('id, classe_id, scriptorium_unites(label)').in('id', sessionIds),
    ])

    const nomMap: Record<string, string> = {}
    for (const p of profils ?? []) nomMap[p.id] = p.display_name

    const seanceMap: Record<string, { label: string; classe: string | null }> = {}
    for (const s of sessions ?? []) {
      const u = s.scriptorium_unites as { label: string } | { label: string }[] | null
      seanceMap[s.id] = {
        label: Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? '',
        classe: s.classe_id,
      }
    }

    for (const t of travaux) {
      const retour = (t.retour_critique as RetourCritique | null) ?? null
      const nbErreurs = retour?.erreurs_corrections?.length ?? 0
      const nbAjouts = retour?.ajouts?.length ?? 0
      const confiance = t.ocr_confiance_vf
      // priorité = volume + incertitude IA (faible confiance OCR)
      const priorite = nbErreurs + (confiance != null ? (1 - confiance) * 3 : 0)

      lignes.push({
        id: t.id,
        eleve: nomMap[t.eleve_id] ?? '—',
        unite: seanceMap[t.session_id]?.label ?? '',
        classe: seanceMap[t.session_id]?.classe ?? null,
        nbErreurs,
        nbAjouts,
        confiance,
        priorite,
        valide: t.statut_validation === 'valide',
      })
    }
  }

  return (
    <div>
      <p className="text-sm text-stone-500 mb-5">
        Tu valides <strong>uniquement le retour critique de la V-finale</strong>. Les passages incertains
        (faible confiance OCR, gros volume) sont remontés en haut ; le reste est validable en lot.
      </p>
      <FileValidation lignes={lignes} />
    </div>
  )
}
