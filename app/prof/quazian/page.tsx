import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { togglePublicationUnite } from './actions'
import Tuile from '@/components/Tuile'
import BoutonGenererSemaine from './BoutonGenererSemaine'

async function actionToggle(formData: FormData): Promise<void> {
  'use server'
  await togglePublicationUnite(formData)
}

export default async function QuazianPage({ searchParams }: { searchParams: Promise<{ unite?: string }> }) {
  const supabase = await createClient()
  const { unite: uniteSel } = await searchParams

  const [{ data: unites }, { data: docs }, { data: cartes }, { data: publications }] = await Promise.all([
    supabase.from('scriptorium_unites').select('id, label, ordre').eq('type', 'unite').order('ordre', { ascending: true }),
    supabase.from('scriptorium_documents').select('unite_id, semaine').not('semaine', 'is', null),
    supabase.from('quazian_flashcards').select('scriptorium_unite_id, semaine, statut').is('eleve_id', null),
    supabase.from('quazian_publications').select('scriptorium_unite_id, flashcards_visibles'),
  ])

  const unitesList = (unites ?? []) as { id: string; label: string }[]

  // Semaines (avec contenu) par unité
  const semainesParUnite = new Map<string, Set<number>>()
  for (const d of docs ?? []) {
    const s = semainesParUnite.get(d.unite_id as string) ?? new Set<number>()
    s.add(d.semaine as number)
    semainesParUnite.set(d.unite_id as string, s)
  }

  // Cartes par (unité, semaine)
  type Stat = { total: number; valide: number; suggere: number }
  const cartesParCle = new Map<string, Stat>()
  const cartesParUnite = new Map<string, Stat>()
  for (const c of cartes ?? []) {
    const u = c.scriptorium_unite_id as string
    const cle = `${u}:${c.semaine ?? 'na'}`
    const st = cartesParCle.get(cle) ?? { total: 0, valide: 0, suggere: 0 }
    const stU = cartesParUnite.get(u) ?? { total: 0, valide: 0, suggere: 0 }
    st.total++; stU.total++
    if (c.statut === 'valide') { st.valide++; stU.valide++ }
    if (c.statut === 'suggere') { st.suggere++; stU.suggere++ }
    cartesParCle.set(cle, st); cartesParUnite.set(u, stU)
  }

  const pubVisible = new Map<string, boolean>()
  for (const p of publications ?? []) pubVisible.set(p.scriptorium_unite_id as string, !!p.flashcards_visibles)

  if (unitesList.length === 0) {
    return (
      <div className="text-center py-16 text-stone-400">
        <p className="text-sm">Aucune unité dans le Scriptorium.</p>
        <p className="text-sm mt-1">
          <Link href="/prof/scriptorium" className="underline hover:text-stone-600">Crée d&apos;abord du contenu dans le Scriptorium.</Link>
        </p>
      </div>
    )
  }

  const uniteChoisie = unitesList.find(u => u.id === uniteSel)
  const semaines = uniteChoisie ? [...(semainesParUnite.get(uniteChoisie.id) ?? new Set<number>())].sort((a, b) => a - b) : []

  return (
    <div className="space-y-6 pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {unitesList.map(u => {
          const nbSem = semainesParUnite.get(u.id)?.size ?? 0
          const st = cartesParUnite.get(u.id) ?? { total: 0, valide: 0, suggere: 0 }
          return (
            <Tuile
              key={u.id}
              nom={u.label}
              sousTitre={`${nbSem} semaine${nbSem > 1 ? 's' : ''} · ${st.valide} carte${st.valide > 1 ? 's' : ''} validée${st.valide > 1 ? 's' : ''}`}
              href={`/prof/quazian?unite=${u.id}`}
              selectionnee={uniteSel === u.id}
              couleur={pubVisible.get(u.id) ? 'vert' : 'neutre'}
              resume={st.suggere > 0 ? <span className="text-xs text-amber-600">{st.suggere} à valider</span> : undefined}
            />
          )
        })}
      </div>

      {uniteChoisie && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-medium text-stone-900">{uniteChoisie.label}</h3>
              <p className="text-xs text-stone-400 mt-0.5">Génère les cartes semaine par semaine, depuis le contenu Scriptorium.</p>
            </div>
            <div className="flex items-center gap-2">
              <form action={actionToggle}>
                <input type="hidden" name="uniteId" value={uniteChoisie.id} />
                <input type="hidden" name="actuel" value={String(pubVisible.get(uniteChoisie.id) ?? false)} />
                <button
                  type="submit"
                  disabled={(cartesParUnite.get(uniteChoisie.id)?.valide ?? 0) === 0 && !pubVisible.get(uniteChoisie.id)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                    pubVisible.get(uniteChoisie.id) ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {pubVisible.get(uniteChoisie.id) ? 'Masquer aux élèves' : 'Publier aux élèves'}
                </button>
              </form>
              <Link href={`/prof/quazian/${uniteChoisie.id}`} className="px-3 py-1.5 text-xs bg-stone-800 text-white rounded-lg hover:bg-stone-900 transition-colors">
                Revoir / éditer →
              </Link>
            </div>
          </div>

          {semaines.length === 0 ? (
            <div className="px-5 py-6 text-sm text-stone-400">
              Aucune semaine renseignée pour cette unité. Indique une <strong>semaine</strong> sur les contenus du <Link href="/prof/scriptorium" className="underline">Scriptorium</Link>.
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {semaines.map(sem => {
                const st = cartesParCle.get(`${uniteChoisie.id}:${sem}`) ?? { total: 0, valide: 0, suggere: 0 }
                return (
                  <li key={sem} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-800">Semaine {sem}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {st.total === 0 ? 'À générer' : (
                          <>
                            <span className="text-green-700">{st.valide} validée{st.valide > 1 ? 's' : ''}</span>
                            {st.suggere > 0 && <span className="text-amber-600"> · {st.suggere} à valider</span>}
                          </>
                        )}
                      </p>
                    </div>
                    <BoutonGenererSemaine uniteId={uniteChoisie.id} semaine={sem} dejaDesCartes={st.total > 0} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
