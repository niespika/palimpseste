import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { creerUnite, renommerUnite, supprimerUnite, monterUnite, descendreUnite } from './actions'

async function actionCreerUnite(formData: FormData): Promise<void> {
  'use server'
  await creerUnite(formData)
}
async function actionRenommerUnite(formData: FormData): Promise<void> {
  'use server'
  await renommerUnite(formData)
}
async function actionSupprimerUnite(formData: FormData): Promise<void> {
  'use server'
  await supprimerUnite(formData)
}
async function actionMonterUnite(formData: FormData): Promise<void> {
  'use server'
  await monterUnite(formData)
}
async function actionDescendreUnite(formData: FormData): Promise<void> {
  'use server'
  await descendreUnite(formData)
}

export default async function ScriptoriumPage() {
  const supabase = await createClient()

  const { data: unites } = await supabase
    .from('scriptorium_unites')
    .select('id, label, classe, ordre, created_at')
    .order('ordre', { ascending: true })

  // Compter les documents par unité
  const { data: comptes } = await supabase
    .from('scriptorium_documents')
    .select('unite_id')

  const comptesMap: Record<string, number> = {}
  for (const doc of comptes ?? []) {
    comptesMap[doc.unite_id] = (comptesMap[doc.unite_id] ?? 0) + 1
  }

  return (
    <div>
      {/* Formulaire de création */}
      <form action={actionCreerUnite} className="mb-8 bg-white border border-stone-200 rounded-xl p-5">
        <h3 className="text-sm font-medium text-stone-700 mb-4">Nouvelle unité</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            name="label"
            placeholder="Semaine 1 (laisse vide pour auto)"
            className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <input
            type="text"
            name="classe"
            placeholder="Classe (ex. Terminale HLP)"
            className="flex-1 px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900 transition-colors"
          >
            Créer
          </button>
        </div>
      </form>

      {/* Liste des unités */}
      {!unites || unites.length === 0 ? (
        <p className="text-stone-500 text-sm text-center py-12">
          Aucune unité pour l'instant. Crée une première unité ci-dessus.
        </p>
      ) : (
        <div className="space-y-2">
          {unites.map((unite, idx) => (
            <div
              key={unite.id}
              className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-3"
            >
              {/* Boutons de réordonnancement */}
              <div className="flex flex-col gap-0.5">
                <form action={actionMonterUnite}>
                  <input type="hidden" name="id" value={unite.id} />
                  <input type="hidden" name="ordre" value={unite.ordre} />
                  <button
                    type="submit"
                    disabled={idx === 0}
                    className="px-2 py-0.5 text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20"
                    title="Monter"
                  >
                    ▲
                  </button>
                </form>
                <form action={actionDescendreUnite}>
                  <input type="hidden" name="id" value={unite.id} />
                  <input type="hidden" name="ordre" value={unite.ordre} />
                  <button
                    type="submit"
                    disabled={idx === unites.length - 1}
                    className="px-2 py-0.5 text-xs text-stone-400 hover:text-stone-700 disabled:opacity-20"
                    title="Descendre"
                  >
                    ▼
                  </button>
                </form>
              </div>

              {/* Infos + lien */}
              <Link href={`/prof/scriptorium/${unite.id}`} className="flex-1 min-w-0">
                <div className="font-medium text-stone-900 hover:text-stone-600 transition-colors">
                  {unite.label}
                </div>
                <div className="text-xs text-stone-400 mt-0.5 flex gap-3">
                  {unite.classe && <span>{unite.classe}</span>}
                  <span>{comptesMap[unite.id] ?? 0} document{(comptesMap[unite.id] ?? 0) > 1 ? 's' : ''}</span>
                </div>
              </Link>

              {/* Renommer */}
              <form action={actionRenommerUnite} className="flex gap-2 items-center">
                <input type="hidden" name="id" value={unite.id} />
                <input
                  type="text"
                  name="label"
                  defaultValue={unite.label}
                  className="w-40 px-2 py-1 text-xs border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition-colors"
                >
                  Renommer
                </button>
              </form>

              {/* Supprimer */}
              <form action={actionSupprimerUnite}>
                <input type="hidden" name="id" value={unite.id} />
                <button
                  type="submit"
                  className="px-3 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={(e) => {
                    if (!confirm('Supprimer cette unité et tous ses documents ?')) e.preventDefault()
                  }}
                >
                  Supprimer
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
