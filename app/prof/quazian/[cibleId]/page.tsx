import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { ajouterCarteManuellement, validerToutesLesSuggerees } from '../actions'
import { CarteFlashcard } from './CarteFlashcard'
import BoutonGenererCartes from '../BoutonGenererCartes'
import { avancementVuParContenu, colonneCible, resoudreCible } from '@/utils/quazian-cibles'
import { lignesEtatVu, type CarteAncree } from '@/utils/quazian-visibilite'

async function actionAjouter(formData: FormData): Promise<void> {
  'use server'
  await ajouterCarteManuellement(formData)
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

  // `section_id` en plus (C7·L3), avec repli : le code part avant le SQL
  // (protocole renforcé) — sans lui, cet écran serait vide dans l'intervalle.
  const requeteCartes = (select: string) =>
    supabase.from('quazian_flashcards').select(select)
      .eq(colonne, cibleId).is('eleve_id', null)
      .order('created_at', { ascending: true })
  const premiere = await requeteCartes('id, type, format, recto, verso, concept_tag, statut, source, section_id')
  const toutes = (premiere.error
    ? (await requeteCartes('id, type, format, recto, verso, concept_tag, statut, source')).data
    : premiere.data) as unknown as Record<string, unknown>[] | null

  // Sous-sections du cours (titre affiché sous chaque carte) + état du « vu ».
  const admin = createAdminClient()
  const [{ data: sections }, avancement, { data: classesNoms }] = await Promise.all([
    cible.bras === 'contenu'
      ? supabase.from('scriptorium_contenu_sections')
          .select('id, ordre, titre').eq('contenu_id', cibleId).order('ordre', { ascending: true })
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    cible.bras === 'contenu' ? avancementVuParContenu(admin, [cibleId]) : Promise.resolve(new Map()),
    supabase.from('classes').select('id, nom'),
  ])
  const titreSection = new Map((sections ?? []).map(s => [s.id as string, s.titre as string]))
  const nomClasse = new Map((classesNoms ?? []).map(c => [c.id as string, c.nom as string]))

  const carte = (c: Record<string, unknown>) => ({
    id: c.id as string,
    type: c.type as string,
    format: c.format as string,
    recto: c.recto as string,
    verso: c.verso as string,
    concept_tag: c.concept_tag as string,
    statut: c.statut as string,
    source: c.source as string,
    cible_id: cibleId,
    section: titreSection.get((c.section_id as string | null) ?? '') ?? null,
  })
  const parStatut = (statut: string) => (toutes ?? []).filter(c => c.statut === statut).map(carte)
  const suggerees = parStatut('suggere')
  const validees = parStatut('valide')
  const archivees = parStatut('archive')
  const aVerifier = parStatut('a_verifier')

  const etatVu = lignesEtatVu(
    cibleId,
    (toutes ?? []).filter(c => c.statut === 'valide') as CarteAncree[],
    avancement.get(cibleId) ?? [],
    nomClasse,
  )
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

        {/* C7·L3 — plus de bouton « Publier » : l'état RÉEL, celui que le « vu »
            du Scriptorium produit, classe par classe. */}
        <div className="text-xs max-w-xs">
          {cible.bras !== 'contenu' ? (
            <p className="text-muet">Unité héritée — visibilité par les contenus assignés de sa semaine.</p>
          ) : etatVu.length === 0 ? (
            <p className="text-muet">
              Au parcours d’aucune classe : ces cartes n’atteindront personne tant que ce contenu n’y figure pas.
            </p>
          ) : (
            <>
              <p className="text-muet">Visible au « vu » du Scriptorium — rien à publier :</p>
              <ul className="mt-1 space-y-0.5">
                {etatVu.map(l => (
                  <li key={l.classe}>
                    <span className="text-encre-douce font-medium">{l.classe}</span>
                    <span className={l.nbVisibles > 0 ? 'text-ok' : 'text-muet'}> — {l.texte}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Génération IA depuis le contenu lui-même */}
      <div className="bg-surface border border-bordure rounded-xl p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muet">
          {cible.bras === 'contenu' && cible.longueurTexte === 0
            ? 'Ce contenu n’a pas de texte extrait dans le Scriptorium — rien à décortiquer.'
            : cible.genre === 'texte'
              ? 'Un texte source ne donne qu’1 à 2 cartes — l’essentiel du passage.'
              : titreSection.size > 0
                ? `Cours découpé en ${titreSection.size} sous-sections : la génération les décortique une par une, et chaque carte apparaîtra au « vu » de SA sous-section.`
                : 'Un cours se décortique en cartes atomiques. Non découpé, ses cartes apparaissent dès que le cours est entamé.'}
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
              <CarteFlashcard key={c.id} carte={c} cibleId={cibleId} />
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
              <CarteFlashcard key={c.id} carte={c} cibleId={cibleId} />
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
              <CarteFlashcard key={c.id} carte={c} cibleId={cibleId} />
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
              <CarteFlashcard key={c.id} carte={c} cibleId={cibleId} />
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
