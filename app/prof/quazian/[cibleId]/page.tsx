import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ajouterCarteManuellement, togglePublication, validerToutesLesSuggerees } from '../actions'
import { CarteFlashcard } from './CarteFlashcard'
import BoutonGenererCartes from '../BoutonGenererCartes'
import { colonneCible, resoudreCible } from '@/utils/quazian-cibles'

async function actionAjouter(formData: FormData): Promise<void> {
  'use server'
  await ajouterCarteManuellement(formData)
}
async function actionToggle(formData: FormData): Promise<void> {
  'use server'
  await togglePublication(formData)
}
async function actionValiderToutes(formData: FormData): Promise<void> {
  'use server'
  await validerToutesLesSuggerees(formData)
}

export default async function CibleCartesPage({
  params,
}: {
  params: Promise<{ cibleId: string }>
}) {
  const { cibleId } = await params
  const supabase = await createClient()

  // Bi-source : un contenu de bibliothèque OU une unité héritée. `resoudreCible`
  // écarte les livres et les contenus en corbeille (accès direct par URL compris).
  const cible = await resoudreCible(supabase, cibleId)
  if (!cible) notFound()

  const colonne = colonneCible(cible.bras)

  const [{ data: toutes }, { data: pub }] = await Promise.all([
    supabase
      .from('quazian_flashcards')
      .select('id, type, format, recto, verso, concept_tag, statut, source')
      .eq(colonne, cibleId)
      .is('eleve_id', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('quazian_publications')
      .select('flashcards_visibles')
      .eq(colonne, cibleId)
      .maybeSingle(),
  ])

  const suggerees = (toutes ?? []).filter((c) => c.statut === 'suggere')
  const validees = (toutes ?? []).filter((c) => c.statut === 'valide')
  const archivees = (toutes ?? []).filter((c) => c.statut === 'archive')
  const aVerifier = (toutes ?? []).filter((c) => c.statut === 'a_verifier')

  const visible = pub?.flashcards_visibles ?? false
  const genre = cible.genre === 'cours' ? 'Cours' : cible.genre === 'texte' ? 'Texte' : 'Unité (héritée)'

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/prof/quazian" className="text-sm text-muet hover:text-encre-douce">
            ← Tous les contenus
          </Link>
          <h3 className="text-lg font-serif text-encre mt-2">{cible.label}</h3>
          <p className="text-sm text-muet">{genre}</p>
          <p className="text-sm text-muet mt-1">
            {validees.length} validée{validees.length > 1 ? 's' : ''}
            {suggerees.length > 0 && ` · ${suggerees.length} à valider`}
            {archivees.length > 0 && ` · ${archivees.length} archivée${archivees.length > 1 ? 's' : ''}`}
          </p>
        </div>

        <form action={actionToggle}>
          <input type="hidden" name="cibleId" value={cibleId} />
          <input type="hidden" name="actuel" value={String(visible)} />
          <button
            type="submit"
            disabled={validees.length === 0 && !visible}
            className={`px-4 py-2 text-sm rounded-lg transition-colors ${
              visible
                ? 'bg-ok-teinte text-ok hover:opacity-90'
                : 'bg-parchemin-fonce text-muet hover:opacity-90'
            } disabled:opacity-40`}
          >
            {visible ? '● Visible aux élèves — Masquer' : '○ Masqué — Publier aux élèves'}
          </button>
        </form>
      </div>

      {/* Génération IA depuis le contenu lui-même */}
      <div className="bg-surface border border-bordure rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muet">
          {cible.bras === 'contenu' && cible.longueurTexte === 0
            ? 'Ce contenu n’a pas de texte extrait dans le Scriptorium — rien à décortiquer.'
            : cible.genre === 'texte'
              ? 'Un texte source ne donne qu’1 à 2 cartes — l’essentiel du passage.'
              : 'Un cours se décortique en cartes atomiques.'}
        </p>
        <BoutonGenererCartes cibleId={cibleId} dejaDesCartes={(toutes ?? []).length > 0} />
      </div>

      {/* Cartes à valider */}
      {suggerees.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-attention">
              À valider ({suggerees.length})
            </h4>
            <form action={actionValiderToutes}>
              <input type="hidden" name="cibleId" value={cibleId} />
              <button
                type="submit"
                className="px-3 py-1 text-xs bg-ok text-surface rounded-lg hover:opacity-90"
              >
                ✓ Tout valider
              </button>
            </form>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggerees.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, cible_id: cibleId }} cibleId={cibleId} />
            ))}
          </div>
        </section>
      )}

      {/* Cartes à vérifier */}
      {aVerifier.length > 0 && (
        <section className="mb-8">
          <h4 className="text-sm font-medium text-retard mb-3">À vérifier ({aVerifier.length})</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {aVerifier.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, cible_id: cibleId }} cibleId={cibleId} />
            ))}
          </div>
        </section>
      )}

      {/* Cartes validées — repliées par défaut */}
      {validees.length > 0 && (
        <details className="mb-6 group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-encre-douce hover:text-encre select-none mb-1">
            <span className="text-muet group-open:rotate-90 transition-transform inline-block">▶</span>
            Validées ({validees.length})
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {validees.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, cible_id: cibleId }} cibleId={cibleId} />
            ))}
          </div>
        </details>
      )}

      {/* Cartes archivées — repliées par défaut */}
      {archivees.length > 0 && (
        <details className="mb-6 group">
          <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-medium text-muet hover:text-encre-douce select-none mb-1">
            <span className="text-bordure group-open:rotate-90 transition-transform inline-block">▶</span>
            Archivées ({archivees.length})
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {archivees.map((c) => (
              <CarteFlashcard key={c.id} carte={{ ...c, cible_id: cibleId }} cibleId={cibleId} />
            ))}
          </div>
        </details>
      )}

      {(toutes ?? []).length === 0 && (
        <p className="text-muet text-sm text-center py-8">
          Aucune carte pour l&apos;instant. Génère-les avec l&apos;IA ci-dessus, ou ajoute une carte à la main.
        </p>
      )}

      {/* Ajout manuel */}
      <section className="mt-8 bg-surface border border-bordure rounded-xl p-5">
        <h4 className="text-sm font-medium text-encre-douce mb-4">Ajouter une carte manuellement</h4>
        <form action={actionAjouter} className="space-y-3">
          <input type="hidden" name="cibleId" value={cibleId} />

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
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg"
          />
          <textarea
            name="recto"
            placeholder="Recto — question ou texte à trous avec {{…}}"
            rows={2}
            required
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg resize-none"
          />
          <textarea
            name="verso"
            placeholder="Verso — réponse"
            rows={2}
            required
            className="w-full px-3 py-2 text-sm border border-bordure rounded-lg resize-none"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-bouton text-surface text-sm rounded-lg hover:opacity-90 transition-colors"
          >
            Ajouter
          </button>
        </form>
      </section>
    </div>
  )
}
