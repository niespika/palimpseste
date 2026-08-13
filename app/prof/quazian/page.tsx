import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { togglePublication } from './actions'
import Tuile from '@/components/Tuile'
import BoutonGenererCartes from './BoutonGenererCartes'
import { chargerCiblesQuazian, classesParContenu } from '@/utils/quazian-cibles'

async function actionToggle(formData: FormData): Promise<void> {
  'use server'
  await togglePublication(formData)
}

export default async function QuazianPage({ searchParams }: { searchParams: Promise<{ cible?: string }> }) {
  const supabase = await createClient()
  const { cible: cibleSel } = await searchParams

  // C7·L1 — les cartes s'ancrent sur les CONTENUS du Scriptorium (Textes, Cours).
  // Avant ce lot, cet écran demandait `scriptorium_unites` où `type='unite'` : zéro
  // ligne depuis la réorganisation, donc « Aucune unité dans le Scriptorium » et
  // aucun bouton à presser (§4.1 du RAPPORT_Diagnostic_C7_quazian.md).
  const [cibles, { data: cartes }, { data: publications }] = await Promise.all([
    chargerCiblesQuazian(supabase),
    supabase.from('quazian_flashcards')
      .select('contenu_id, scriptorium_unite_id, statut').is('eleve_id', null),
    supabase.from('quazian_publications')
      .select('contenu_id, scriptorium_unite_id, flashcards_visibles'),
  ])

  type Stat = { total: number; valide: number; suggere: number }
  const cartesParCible = new Map<string, Stat>()
  for (const c of cartes ?? []) {
    const cle = (c.contenu_id as string | null) ?? (c.scriptorium_unite_id as string | null)
    if (!cle) continue
    const st = cartesParCible.get(cle) ?? { total: 0, valide: 0, suggere: 0 }
    st.total++
    if (c.statut === 'valide') st.valide++
    if (c.statut === 'suggere') st.suggere++
    cartesParCible.set(cle, st)
  }

  const pubVisible = new Map<string, boolean>()
  for (const p of publications ?? []) {
    const cle = (p.contenu_id as string | null) ?? (p.scriptorium_unite_id as string | null)
    if (cle) pubVisible.set(cle, !!p.flashcards_visibles)
  }

  // À qui la publication parlera-t-elle ? Un contenu n'atteint un élève que s'il est
  // au parcours de sa classe (§4.4) — le dire ici évite le « j'ai publié et l'élève
  // ne voit rien ». Lecture admin : les tables de parcours sont en RLS prof-only.
  const admin = createAdminClient()
  const contenuIds = cibles.filter(c => c.bras === 'contenu').map(c => c.id)
  const [classesDuContenu, { data: classesNoms }] = await Promise.all([
    classesParContenu(admin, contenuIds),
    supabase.from('classes').select('id, nom'),
  ])
  const nomClasse = new Map((classesNoms ?? []).map(c => [c.id as string, c.nom as string]))
  const libelleClasses = (cibleId: string) =>
    [...(classesDuContenu.get(cibleId) ?? [])].map(id => nomClasse.get(id) ?? '—').sort()

  if (cibles.length === 0) {
    return (
      <div className="text-center py-16 text-muet">
        <p className="text-sm">Aucun texte ni cours dans le Scriptorium.</p>
        <p className="text-sm mt-1">
          <Link href="/prof/scriptorium?vue=ressources" className="underline hover:text-encre-douce">
            Crée d&apos;abord du contenu dans le Scriptorium.
          </Link>
        </p>
        <p className="text-xs mt-3">Les livres (lecture Aletheia) ne donnent pas de cartes.</p>
      </div>
    )
  }

  const cibleChoisie = cibles.find(c => c.id === cibleSel)
  const classesCible = cibleChoisie ? libelleClasses(cibleChoisie.id) : []
  const stChoisie = cibleChoisie
    ? cartesParCible.get(cibleChoisie.id) ?? { total: 0, valide: 0, suggere: 0 }
    : null

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cibles.map(c => {
          const st = cartesParCible.get(c.id) ?? { total: 0, valide: 0, suggere: 0 }
          const genre = c.genre === 'cours' ? 'Cours' : c.genre === 'texte' ? 'Texte' : 'Unité'
          return (
            <Tuile
              key={c.id}
              nom={c.label}
              sousTitre={`${genre} · ${st.valide} carte${st.valide > 1 ? 's' : ''} validée${st.valide > 1 ? 's' : ''}`}
              href={`/prof/quazian?cible=${c.id}`}
              selectionnee={cibleSel === c.id}
              couleur={pubVisible.get(c.id) ? 'vert' : 'neutre'}
              resume={st.suggere > 0 ? <span className="text-xs text-attention">{st.suggere} à valider</span> : undefined}
            />
          )
        })}
      </div>

      {cibleChoisie && stChoisie && (
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-bordure flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-medium text-encre">{cibleChoisie.label}</h3>
              <p className="text-xs text-muet mt-0.5">
                {cibleChoisie.genre === 'texte'
                  ? 'Un texte source ne donne qu’1 à 2 cartes — l’essentiel du passage.'
                  : 'Un cours se décortique en cartes atomiques.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <form action={actionToggle}>
                <input type="hidden" name="cibleId" value={cibleChoisie.id} />
                <input type="hidden" name="actuel" value={String(pubVisible.get(cibleChoisie.id) ?? false)} />
                <button
                  type="submit"
                  disabled={stChoisie.valide === 0 && !pubVisible.get(cibleChoisie.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                    pubVisible.get(cibleChoisie.id) ? 'bg-ok-teinte text-ok hover:opacity-90' : 'bg-parchemin-fonce text-muet hover:opacity-90'
                  }`}
                >
                  {pubVisible.get(cibleChoisie.id) ? 'Masquer aux élèves' : 'Publier aux élèves'}
                </button>
              </form>
              <Link href={`/prof/quazian/${cibleChoisie.id}`} className="px-3 py-1.5 text-xs bg-bouton text-surface rounded-lg hover:opacity-90 transition-colors">
                Revoir / éditer →
              </Link>
            </div>
          </div>

          <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm text-encre">
                {stChoisie.total === 0 ? 'Aucune carte — à générer' : (
                  <>
                    <span className="text-ok">{stChoisie.valide} validée{stChoisie.valide > 1 ? 's' : ''}</span>
                    {stChoisie.suggere > 0 && <span className="text-attention"> · {stChoisie.suggere} à valider</span>}
                  </>
                )}
              </p>
              <p className="text-xs text-muet mt-0.5">
                {cibleChoisie.bras !== 'contenu'
                  ? 'Unité héritée — visibilité élève par les contenus assignés de sa semaine.'
                  : classesCible.length > 0
                    ? `Au parcours de ${classesCible.join(', ')} — ces élèves verront les cartes une fois publiées.`
                    : 'Ce contenu n’est au parcours d’aucune classe : même publiées, ces cartes n’atteindront personne.'}
              </p>
            </div>
            <BoutonGenererCartes cibleId={cibleChoisie.id} dejaDesCartes={stChoisie.total > 0} />
          </div>
        </div>
      )}
    </div>
  )
}
