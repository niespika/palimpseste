import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { togglePublicationUnite } from './actions'

async function actionToggle(formData: FormData): Promise<void> {
  'use server'
  await togglePublicationUnite(formData)
}

export default async function QuazianPage() {
  const supabase = await createClient()

  const { data: unites } = await supabase
    .from('scriptorium_unites')
    .select('id, label, classe, ordre')
    .order('ordre', { ascending: true })

  // Publications existantes
  const { data: publications } = await supabase
    .from('quazian_publications')
    .select('scriptorium_unite_id, flashcards_visibles, published_at')

  const pubMap: Record<string, { visible: boolean; date: string | null }> = {}
  for (const p of publications ?? []) {
    pubMap[p.scriptorium_unite_id] = {
      visible: p.flashcards_visibles,
      date: p.published_at,
    }
  }

  // Compter les cartes par unité et statut
  const { data: cartes } = await supabase
    .from('quazian_flashcards')
    .select('scriptorium_unite_id, statut')

  const cartesMap: Record<string, { valide: number; suggere: number; total: number }> = {}
  for (const c of cartes ?? []) {
    if (!cartesMap[c.scriptorium_unite_id]) {
      cartesMap[c.scriptorium_unite_id] = { valide: 0, suggere: 0, total: 0 }
    }
    cartesMap[c.scriptorium_unite_id].total++
    if (c.statut === 'valide') cartesMap[c.scriptorium_unite_id].valide++
    if (c.statut === 'suggere') cartesMap[c.scriptorium_unite_id].suggere++
  }

  if (!unites || unites.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400">
        <p className="text-sm">Aucune unité dans le Scriptorium.</p>
        <p className="text-sm mt-1">
          <Link href="/prof/scriptorium" className="underline hover:text-stone-600">
            Crée d'abord des unités dans le Scriptorium.
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {unites.map((unite) => {
        const pub = pubMap[unite.id]
        const stats = cartesMap[unite.id] ?? { valide: 0, suggere: 0, total: 0 }
        const visible = pub?.visible ?? false

        return (
          <div
            key={unite.id}
            className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-4"
          >
            {/* Indicateur de publication */}
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${visible ? 'bg-green-400' : 'bg-stone-300'}`}
              title={visible ? 'Visible aux élèves' : 'Masqué aux élèves'}
            />

            {/* Infos */}
            <Link href={`/prof/quazian/${unite.id}`} className="flex-1 min-w-0">
              <div className="font-medium text-stone-900 hover:text-stone-600 transition-colors">
                {unite.label}
              </div>
              <div className="text-xs text-stone-400 mt-0.5 flex gap-3 flex-wrap">
                {unite.classe && <span>{unite.classe}</span>}
                <span className="text-green-700">{stats.valide} validée{stats.valide > 1 ? 's' : ''}</span>
                {stats.suggere > 0 && (
                  <span className="text-amber-600">{stats.suggere} à valider</span>
                )}
                {stats.total === 0 && <span className="text-stone-300">aucune carte</span>}
              </div>
            </Link>

            {/* Toggle publication */}
            <form action={actionToggle}>
              <input type="hidden" name="uniteId" value={unite.id} />
              <input type="hidden" name="actuel" value={String(visible)} />
              <button
                type="submit"
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  visible
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
                disabled={stats.valide === 0 && !visible}
                title={stats.valide === 0 && !visible ? 'Valide d\'abord des cartes' : ''}
              >
                {visible ? 'Masquer aux élèves' : 'Publier aux élèves'}
              </button>
            </form>

            {/* Lien vers les cartes */}
            <Link
              href={`/prof/quazian/${unite.id}`}
              className="px-3 py-1 text-xs bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors shrink-0"
            >
              Gérer les cartes →
            </Link>
          </div>
        )
      })}
    </div>
  )
}
