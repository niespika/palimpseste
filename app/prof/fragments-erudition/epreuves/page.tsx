import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import FormulaireNouvelleEpreuve from './FormulaireNouvelleEpreuve'

export default async function PageEpreuves() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const admin = createAdminClient()
  const { data: epreuves } = await admin
    .from('fragments_essais_epreuves')
    .select('id, titre, date_epreuve, duree_minutes, depots_ouverts, created_at')
    .order('date_epreuve', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-stone-900">Épreuves d'essai final</h3>
          <p className="text-sm text-stone-500 mt-0.5">Chaque épreuve correspond à une session d'écriture en classe.</p>
        </div>
      </div>

      <FormulaireNouvelleEpreuve />

      {(epreuves ?? []).length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-8 text-center text-stone-400 text-sm">
          Aucune épreuve créée.
        </div>
      ) : (
        <div className="space-y-2">
          {(epreuves ?? []).map(e => (
            <Link
              key={e.id}
              href={`/prof/fragments-erudition/epreuves/${e.id}`}
              className="block bg-white border border-stone-200 rounded-xl px-5 py-4 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">{e.titre}</p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {new Date(e.date_epreuve).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' · '}{e.duree_minutes} min
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                  e.depots_ouverts
                    ? 'bg-green-100 text-green-700'
                    : 'bg-stone-100 text-stone-500'
                }`}>
                  {e.depots_ouverts ? 'Dépôts ouverts' : 'Dépôts fermés'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
