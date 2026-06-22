import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import Tuile from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'
import { livresDeClasse, progression, STATUT_LABEL, type LivreProf } from './donnees'
import type { TravailAletheia } from '@/app/eleve/modules/aletheia/types'

function Barre({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="w-28 h-1.5 bg-stone-100 rounded-full overflow-hidden" title={`${done}/${total} semaines`}>
      <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatutEleve({ livres, travaux }: { livres: LivreProf[]; travaux: Map<string, Map<number, TravailAletheia>> }) {
  return (
    <div className="space-y-1.5">
      {livres.map(livre => {
        const p = progression(livre.semaines, travaux.get(livre.id) ?? new Map())
        return (
          <div key={livre.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-stone-600 truncate max-w-[12rem]">{livre.titre}</span>
            <Barre done={p.done} total={p.total} />
            <span className="text-stone-400">
              {p.done}/{p.total}
              {p.semaineCourante != null && p.statutCourant != null && (
                <> · sem. {p.semaineCourante} — {STATUT_LABEL[p.statutCourant]}</>
              )}
              {p.semaineCourante == null && p.total > 0 && <> · livre terminé</>}
            </span>
          </div>
        )
      })}
      {livres.length === 0 && <span className="text-xs text-stone-400">Aucun livre assigné à cette classe.</span>}
    </div>
  )
}

export default async function ClasseAletheiaPage({ searchParams }: { searchParams: Promise<{ classe?: string }> }) {
  const { classe: classeSel } = await searchParams
  const admin = createAdminClient()

  const [{ data: classes }, { data: livreUnites }, { data: liens }] = await Promise.all([
    admin.from('classes').select('id, nom').order('nom'),
    admin.from('scriptorium_unites').select('id').eq('type', 'livre'),
    admin.from('scriptorium_unite_classes').select('unite_id, classe_id'),
  ])
  const classesList = (classes ?? []) as { id: string; nom: string }[]
  const livreIds = new Set((livreUnites ?? []).map(u => u.id as string))

  const nbLivresParClasse = new Map<string, number>()
  for (const l of liens ?? []) {
    if (!livreIds.has(l.unite_id as string)) continue
    const k = l.classe_id as string
    nbLivresParClasse.set(k, (nbLivresParClasse.get(k) ?? 0) + 1)
  }

  // Détail de la classe sélectionnée : élèves + avancée par livre.
  let nomClasse: string | undefined
  let eleves: LigneEleve[] = []
  if (classeSel) {
    nomClasse = classesList.find(c => c.id === classeSel)?.nom
    const livres = await livresDeClasse(admin, classeSel)
    const inscrits = await inscriptionsClasse(admin, classeSel)
    const eleveIds = inscrits.map(i => i.eleve_id)

    const [{ data: profils }, { data: travauxAll }] = await Promise.all([
      eleveIds.length > 0 ? admin.from('profiles').select('id, display_name').in('id', eleveIds).order('display_name') : Promise.resolve({ data: [] }),
      eleveIds.length > 0 && livres.length > 0
        ? admin.from('aletheia_travaux').select('*').in('eleve_id', eleveIds).in('scriptorium_livre_id', livres.map(l => l.id))
        : Promise.resolve({ data: [] }),
    ])

    // index : eleveId → livreId → (semaine → travail)
    const parEleve = new Map<string, Map<string, Map<number, TravailAletheia>>>()
    for (const t of (travauxAll ?? []) as TravailAletheia[]) {
      const parLivre = parEleve.get(t.eleve_id) ?? new Map<string, Map<number, TravailAletheia>>()
      const parSem = parLivre.get(t.scriptorium_livre_id) ?? new Map<number, TravailAletheia>()
      parSem.set(t.semaine_index, t)
      parLivre.set(t.scriptorium_livre_id, parSem)
      parEleve.set(t.eleve_id, parLivre)
    }

    eleves = (profils ?? []).map((p): LigneEleve => ({
      id: p.id as string,
      display_name: p.display_name as string,
      statut: <StatutEleve livres={livres} travaux={parEleve.get(p.id as string) ?? new Map()} />,
      actions: (
        <Link href={`/prof/aletheia/eleve/${p.id}`} className="text-xs text-stone-500 hover:text-stone-800 underline whitespace-nowrap">
          Voir le détail →
        </Link>
      ),
    }))
  }

  return (
    <div className="space-y-6">
      {classesList.length === 0 ? (
        <p className="text-center text-stone-400 text-sm py-8">Aucune classe pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {classesList.map(c => {
            const n = nbLivresParClasse.get(c.id) ?? 0
            return (
              <Tuile
                key={c.id}
                nom={c.nom}
                sousTitre={`${n} livre${n > 1 ? 's' : ''} assigné${n > 1 ? 's' : ''}`}
                href={`/prof/aletheia?classe=${c.id}`}
                selectionnee={classeSel === c.id}
                couleur={n > 0 ? 'vert' : 'neutre'}
              />
            )
          })}
        </div>
      )}

      {classeSel && (
        <DetailClasse
          nom={nomClasse ?? 'Classe'}
          sousTitre="Avancée dans les livres assignés (semaine en cours · statut · progression)"
          eleves={eleves}
          vide="Aucun élève inscrit dans cette classe."
        />
      )}
    </div>
  )
}
