import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ajouterCarteManuellement, togglePublicationUnite, validerToutesLesSuggerees } from '../actions'
import { CarteFlashcard } from './CarteFlashcard'
import { ExtractionIA } from './ExtractionIA'

async function actionAjouter(formData: FormData): Promise<void> {
  'use server'
  await ajouterCarteManuellement(formData)
}
async function actionToggle(formData: FormData): Promise<void> {
  'use server'
  await togglePublicationUnite(formData)
}
async function actionValiderToutes(formData: FormData): Promise<void> {
  'use server'
  await validerToutesLesSuggerees(formData)
}

export default async function UniteCartesPage({
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

  // Documents du Scriptorium avec texte extrait
  const { data: docsTexte } = await supabase
    .from('scriptorium_documents')
    .select('id, titre, auteur')
    .eq('unite_id', uniteId)
    .not('texte_extrait', 'is', null)
    .order('created_at', { ascending: true })

  // Cartes (hors archivées, sauf si on veut les voir)
  const { data: toutes } = await supabase
    .from('quazian_flashcards')
    .select('id, type, format, recto, verso, concept_tag, statut, source')
    .eq('scriptorium_unite_id', uniteId)
    .order('created_at', { ascending: true })

  const suggerees = (toutes ?? []).filter((c) => c.statut === 'suggere')
  const validees = (toutes ?? []).filter((c) => c.statut === 'valide')
  const archivees = (toutes ?? []).filter((c) => c.statut === 'archive')
  const aVerifier = (toutes ?? []).filter((c) => c.statut === 'a_verifier')

  // Publication
  const { data: pub } = await supabase
    .from('quazian_publications')
    .select('flashcards_visibles')
    .eq('scriptorium_unite_id', uniteId)
    .maybeSingle()

  const visible = pub?.flashcards_visibles ?? false

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/prof/quazian" className="text-sm text-stone-500 hover:text-stone-700">
            ← Toutes les unités
          </Link>
          <h3 className="text-lg font-serif text-stone-900 mt-2">{unite.label}</h3>
          {unite.classe && <p className="text-sm text-stone-400">{unite.classe}</p>}
          <p className="text-sm text-stone-400 mt-1">
            {validees.length} validée{validees.length > 1 ? 's' : ''}
            {suggerees.length > 0 && ` · ${suggerees.length} à valider`}
            {archivees.length > 0 && ` · ${archivees.length} archivée${archivees.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <form action={actionToggle}>
          <input type="hidden" name="uniteId" value={uniteId} />
          <input type="hidden" name="actuel" value={String(visible)} />
          <button
            type="submit"
            disabled={validees.length === 0 && !visible}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              visible
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            } disabled:opacity-40`}
          >
            {visible ? '● Visible aux élèves — Masquer' : '○ Masqué — Publier aux élèves'}
          </button>
        </form>
      </div>

      {/* Extraction IA */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6">
        <ExtractionIA uniteId={uniteId} docs={docsTexte ?? []} />
      </div>

      {/* Cartes à valider */}
      {suggerees.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-amber-700">
              À valider ({suggerees.length})
            </h4>
            <form action={actionValiderToutes}>
              <input type="hidden" name="uniteId" value={uniteId} />
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                ✓ Tout valider
              </button>
            </form>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggerees.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, unite_id: uniteId }} uniteId={uniteId} />
            ))}
          </div>
        </section>
      )}

      {/* Cartes à vérifier */}
      {aVerifier.length > 0 && (
        <section className="mb-8">
          <h4 className="text-sm font-medium text-red-700 mb-3">À vérifier ({aVerifier.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aVerifier.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, unite_id: uniteId }} uniteId={uniteId} />
            ))}
          </div>
        </section>
      )}

      {/* Cartes validées */}
      {validees.length > 0 && (
        <section className="mb-8">
          <h4 className="text-sm font-medium text-stone-600 mb-3">
            Validées ({validees.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {validees.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, unite_id: uniteId }} uniteId={uniteId} />
            ))}
          </div>
        </section>
      )}

      {/* Cartes archivées */}
      {archivees.length > 0 && (
        <section className="mb-8">
          <h4 className="text-sm font-medium text-stone-400 mb-3">
            Archivées ({archivees.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {archivees.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, unite_id: uniteId }} uniteId={uniteId} />
            ))}
          </div>
        </section>
      )}

      {(toutes ?? []).length === 0 && (
        <p className="text-stone-400 text-sm text-center py-8">
          Aucune carte pour l'instant. Lance l'extraction IA ou ajoute une carte manuellement.
        </p>
      )}

      {/* Ajout manuel */}
      <section className="mt-8 bg-white border border-stone-200 rounded-xl p-5">
        <h4 className="text-sm font-medium text-stone-700 mb-4">Ajouter une carte manuellement</h4>
        <form action={actionAjouter} className="space-y-3">
          <input type="hidden" name="uniteId" value={uniteId} />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['philosophe', 'concept', 'mouvement', 'these'] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" name="type" value={t} defaultChecked={t === 'concept'} />
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </label>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="format" value="recto_verso" defaultChecked />
              Question → Réponse
            </label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="format" value="cloze" />
              Texte à trous (cloze)
            </label>
          </div>

          <input
            type="text"
            name="concept_tag"
            placeholder="Concept-clé (ex. volonté de puissance)"
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg"
          />
          <textarea
            name="recto"
            placeholder="Recto — question ou texte à trous avec {{…}}"
            rows={2}
            required
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg resize-none"
          />
          <textarea
            name="verso"
            placeholder="Verso — réponse"
            rows={2}
            required
            className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg resize-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-stone-800 text-white text-sm rounded-lg hover:bg-stone-900 transition-colors"
          >
            Ajouter
          </button>
        </form>
      </section>
    </div>
  )
}
