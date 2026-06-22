import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { inscriptionsClasse } from '@/utils/acces'
import Tuile from '@/components/Tuile'
import DetailClasse, { type LigneEleve } from '@/components/classes/DetailClasse'
import { TrajectoireDiag } from '@/components/aletheia/Diagnostic'
import BoutonLancerDiagnostic from './BoutonLancerDiagnostic'
import {
  livresDeClasse, progression, chargerDiagnostics, etatDiagnosticLivre,
  STATUT_LABEL, type LivreProf,
} from './donnees'
import type { TravailAletheia, DiagnosticTravail } from '@/app/eleve/modules/aletheia/types'

function Barre({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div className="w-28 h-1.5 bg-stone-100 rounded-full overflow-hidden" title={`${done}/${total} semaines`}>
      <div className="h-full bg-green-400 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  )
}

function StatutEleve({
  livres, travaux, diag,
}: {
  livres: LivreProf[]
  travaux: Map<string, Map<number, TravailAletheia>>
  diag: Map<string, Map<number, DiagnosticTravail>>
}) {
  if (livres.length === 0) return <span className="text-xs text-stone-400">Aucun livre assigné à cette classe.</span>
  return (
    <div className="space-y-2">
      {livres.map(livre => {
        const p = progression(livre.semaines, travaux.get(livre.id) ?? new Map())
        return (
          <div key={livre.id} className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
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
            <TrajectoireDiag semaines={livre.semaines.map(s => s.semaine)} diag={diag.get(livre.id) ?? new Map()} />
          </div>
        )
      })}
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

  // Détail de la classe sélectionnée : élèves + avancée + diagnostic.
  let nomClasse: string | undefined
  let eleves: LigneEleve[] = []
  let totalEnAttente = 0
  let aFaireGlobal = false
  if (classeSel) {
    nomClasse = classesList.find(c => c.id === classeSel)?.nom
    const livres = await livresDeClasse(admin, classeSel)
    const inscrits = await inscriptionsClasse(admin, classeSel)
    const eleveIds = [...new Set(inscrits.map(i => i.eleve_id))]
    const classeSize = eleveIds.length

    const [{ data: profils }, { data: travauxAll }] = await Promise.all([
      eleveIds.length > 0 ? admin.from('profiles').select('id, display_name').in('id', eleveIds).order('display_name') : Promise.resolve({ data: [] }),
      eleveIds.length > 0 && livres.length > 0
        ? admin.from('aletheia_travaux').select('id, eleve_id, scriptorium_livre_id, semaine_index, statut, these, these_vf').in('eleve_id', eleveIds).in('scriptorium_livre_id', livres.map(l => l.id))
        : Promise.resolve({ data: [] }),
    ])

    // index travaux : eleveId → livreId → (semaine → travail)
    const parEleve = new Map<string, Map<string, Map<number, TravailAletheia>>>()
    for (const t of (travauxAll ?? []) as TravailAletheia[]) {
      const parLivre = parEleve.get(t.eleve_id) ?? new Map<string, Map<number, TravailAletheia>>()
      const parSem = parLivre.get(t.scriptorium_livre_id) ?? new Map<number, TravailAletheia>()
      parSem.set(t.semaine_index, t)
      parLivre.set(t.scriptorium_livre_id, parSem)
      parEleve.set(t.eleve_id, parLivre)
    }

    // diagnostics : livreId → (eleveId → (semaine → diag))
    const diagParLivre = new Map(
      await Promise.all(livres.map(async l => [l.id, await chargerDiagnostics(admin, eleveIds, l.id)] as const)),
    )

    // Signal « à faire » (≥60 % rendu) + total en attente, agrégés sur les livres.
    for (const l of livres) {
      const travauxLivre = new Map<string, Map<number, TravailAletheia>>()
      for (const eid of eleveIds) travauxLivre.set(eid, parEleve.get(eid)?.get(l.id) ?? new Map())
      const etat = etatDiagnosticLivre(l.semaines.map(s => s.semaine), classeSize, travauxLivre, diagParLivre.get(l.id) ?? new Map())
      totalEnAttente += etat.totalEnAttente
      if (etat.aFaire) aFaireGlobal = true
    }

    eleves = (profils ?? []).map((p): LigneEleve => {
      const id = p.id as string
      const diagEleve = new Map(livres.map(l => [l.id, diagParLivre.get(l.id)?.get(id) ?? new Map<number, DiagnosticTravail>()] as const))
      return {
        id,
        display_name: p.display_name as string,
        statut: <StatutEleve livres={livres} travaux={parEleve.get(id) ?? new Map()} diag={diagEleve} />,
        actions: (
          <Link href={`/prof/aletheia/eleve/${id}`} className="text-xs text-stone-500 hover:text-stone-800 underline whitespace-nowrap">
            Voir le détail →
          </Link>
        ),
      }
    })
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
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-stone-400 max-w-xl">
              Diagnostic de compréhension (E→A, thèse / arguments) — usage prof, jamais montré à l&apos;élève. La <strong>tendance</strong> prime sur le point isolé.
            </p>
            <BoutonLancerDiagnostic classeId={classeSel} enAttente={totalEnAttente} aFaire={aFaireGlobal} />
          </div>
          <DetailClasse
            nom={nomClasse ?? 'Classe'}
            sousTitre="Avancée + trajectoire diagnostique (survole une semaine pour le détail)"
            eleves={eleves}
            vide="Aucun élève inscrit dans cette classe."
          />
        </>
      )}
    </div>
  )
}
