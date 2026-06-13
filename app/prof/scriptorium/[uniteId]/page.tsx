import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ajouterDocument, supprimerDocument, getUrlSignee } from '../actions'

async function actionAjouterDocument(formData: FormData): Promise<void> {
  'use server'
  await ajouterDocument(formData)
}

async function actionSupprimerDocument(formData: FormData): Promise<void> {
  'use server'
  await supprimerDocument(formData)
}

const TYPES_DOC = [
  { value: 'cours', label: 'Cours' },
  { value: 'texte_source', label: 'Texte source' },
  { value: 'image', label: 'Image' },
  { value: 'autre', label: 'Autre' },
]

const TYPE_BADGES: Record<string, string> = {
  cours: 'bg-blue-50 text-blue-700',
  texte_source: 'bg-amber-50 text-amber-700',
  image: 'bg-purple-50 text-purple-700',
  autre: 'bg-stone-100 text-stone-600',
}

export default async function UniteDocumentsPage({
  params,
}: {
  params: Promise<{ uniteId: string }>
}) {
  const { uniteId } = await params
  const supabase = await createClient()

  const { data: unite } = await supabase
    .from('scriptorium_unites')
    .select('id, label, classe')
    .eq('id', uniteId)
    .single()

  if (!unite) notFound()

  const { data: documents } = await supabase
    .from('scriptorium_documents')
    .select('id, type, titre, auteur, fichier_ref, texte_extrait, created_at')
    .eq('unite_id', uniteId)
    .order('created_at', { ascending: true })

  // Générer les URLs signées
  const docsAvecUrl = await Promise.all(
    (documents ?? []).map(async (doc) => ({
      ...doc,
      url: await getUrlSignee(doc.fichier_ref),
    }))
  )

  return (
    <div>
      <div className="mb-6">
        <Link href="/prof/scriptorium" className="text-sm text-stone-500 hover:text-stone-700">
          ← Toutes les unités
        </Link>
        <h3 className="text-lg font-serif text-stone-900 mt-2">{unite.label}</h3>
        {unite.classe && <p className="text-sm text-stone-400">{unite.classe}</p>}
      </div>

      {/* Formulaire d'ajout de document */}
      <form
        action={actionAjouterDocument}
        encType="multipart/form-data"
        className="mb-8 bg-white border border-stone-200 rounded-xl p-5"
      >
        <h3 className="text-sm font-medium text-stone-700 mb-4">Ajouter un document</h3>
        <input type="hidden" name="uniteId" value={uniteId} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Titre</label>
            <input
              type="text"
              name="titre"
              placeholder="Titre du document (optionnel)"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Auteur</label>
            <input
              type="text"
              name="auteur"
              placeholder="Auteur (optionnel)"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Type</label>
            <select
              name="type"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {TYPES_DOC.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 mb-1 block">Fichier (PDF, DOCX, image…)</label>
            <input
              type="file"
              name="fichier"
              accept=".pdf,.docx,.odt,.txt,.jpg,.jpeg,.png,.webp"
              required
              className="w-full text-sm text-stone-700 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900 transition-colors"
        >
          Déposer le document
        </button>
      </form>

      {/* Liste des documents */}
      {docsAvecUrl.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-10">
          Aucun document dans cette unité.
        </p>
      ) : (
        <div className="space-y-3">
          {docsAvecUrl.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-stone-200 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_BADGES[doc.type] ?? TYPE_BADGES.autre}`}
                    >
                      {TYPES_DOC.find((t) => t.value === doc.type)?.label ?? doc.type}
                    </span>
                    <span className="font-medium text-stone-900 truncate">{doc.titre}</span>
                    {doc.auteur && (
                      <span className="text-xs text-stone-400">— {doc.auteur}</span>
                    )}
                  </div>

                  {doc.texte_extrait ? (
                    <details className="mt-2">
                      <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600">
                        Voir le texte extrait ({doc.texte_extrait.length} car.)
                      </summary>
                      <pre className="mt-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-lg whitespace-pre-wrap overflow-auto max-h-96 font-sans">
                        {doc.texte_extrait}
                      </pre>
                    </details>
                  ) : (
                    <p className="text-xs text-stone-300 mt-1">Pas de texte extrait</p>
                  )}
                </div>

                <div className="flex gap-2 items-start shrink-0">
                  {doc.url && (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-700 transition-colors"
                    >
                      Ouvrir
                    </a>
                  )}
                  <form action={actionSupprimerDocument}>
                    <input type="hidden" name="id" value={doc.id} />
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
