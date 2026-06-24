import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

interface SuggestionsV1 {
  oublis?: { titre: string; detail: string }[]
  erreurs?: { type: string; titre: string; detail: string }[]
  ortho?: string | null
}

export default async function RetoursV1Page({ params }: { params: Promise<{ travailId: string }> }) {
  const { travailId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') redirect('/eleve')

  const admin = createAdminClient()
  const { data: travail } = await admin
    .from('codex_travaux')
    .select('id, eleve_id, session_id, suggestions_v1, texte_v1_ocr, analyse_v1_statut')
    .eq('id', travailId)
    .single()
  if (!travail) notFound()

  const [{ data: eleve }, { data: session }] = await Promise.all([
    admin.from('profiles').select('display_name').eq('id', travail.eleve_id).single(),
    admin.from('codex_sessions').select('id, scriptorium_unites(label), classes(nom)').eq('id', travail.session_id).single(),
  ])

  const u = session?.scriptorium_unites as { label: string } | { label: string }[] | null
  const uniteLabel = Array.isArray(u) ? u[0]?.label ?? '' : u?.label ?? ''
  const c = session?.classes as { nom: string } | { nom: string }[] | null
  const classeNom = Array.isArray(c) ? c[0]?.nom ?? null : c?.nom ?? null

  const s = (travail.suggestions_v1 as SuggestionsV1 | null) ?? {}

  return (
    <div>
      <div className="mb-6">
        <Link href={`/prof/codex/synthese/${travail.session_id}`} className="text-sm text-muet hover:text-encre-douce">
          ← Synthèse
        </Link>
        <h3 className="text-lg font-serif text-encre mt-2">{eleve?.display_name ?? '—'} · retours V1</h3>
        <p className="text-sm text-muet">{uniteLabel}{classeNom ? ` · ${classeNom}` : ''}</p>
      </div>

      {travail.analyse_v1_statut !== 'prete' ? (
        <div className="bg-surface border border-bordure rounded-xl p-6 text-center text-encre-douce text-sm">
          Les suggestions V1 ne sont pas encore prêtes (statut : {travail.analyse_v1_statut}).
        </div>
      ) : (
        <div className="space-y-4">
          {/* Oublis */}
          <section className="bg-surface border border-bordure rounded-xl p-5">
            <h4 className="text-sm font-medium text-encre-douce mb-3">Oublis signalés</h4>
            {s.oublis?.length ? (
              <ul className="space-y-2">
                {s.oublis.map((o, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium text-encre">{o.titre}</span>
                    <span className="text-muet"> — {o.detail}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muet">Aucun oubli signalé.</p>}
          </section>

          {/* Erreurs / ambiguïtés */}
          <section className="bg-surface border border-bordure rounded-xl p-5">
            <h4 className="text-sm font-medium text-encre-douce mb-3">Erreurs / ambiguïtés</h4>
            {s.erreurs?.length ? (
              <ul className="space-y-2">
                {s.erreurs.map((e, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-attention-teinte text-attention mr-1">{e.type}</span>
                    <span className="font-medium text-encre">{e.titre}</span>
                    <span className="text-muet"> — {e.detail}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muet">Aucune erreur signalée.</p>}
          </section>

          {/* Langue */}
          {s.ortho && (
            <section className="bg-surface border border-bordure rounded-xl p-5">
              <h4 className="text-sm font-medium text-encre-douce mb-2">Langue</h4>
              <p className="text-sm text-encre-douce">{s.ortho}</p>
            </section>
          )}

          {/* Transcription V1 */}
          {travail.texte_v1_ocr && (
            <details className="bg-surface border border-bordure rounded-xl p-5">
              <summary className="text-sm font-medium text-encre-douce cursor-pointer">Transcription de la V1</summary>
              <pre className="mt-3 text-sm text-encre-douce whitespace-pre-wrap font-sans">{travail.texte_v1_ocr}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
