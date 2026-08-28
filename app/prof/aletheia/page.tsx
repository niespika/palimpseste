// ============================================================================
// C5 · L4 — L'ONGLET LIVRES DU PROFESSEUR : les classes et leur lecture.
// ----------------------------------------------------------------------------
// « Côté professeur : LIVRES — ce que l'onglet « Classe » portait : les
//   classes, l'avancée par livre, la trajectoire diagnostique, le détail d'un
//   élève. »                                                 — `07-` §2, C5-L4
//
// ⭐ CETTE PAGE NE BOUGE PAS, ET C'EST LE POINT. L'onglet qui GARDE LA RACINE
//    vient en tête (décision de Louis, 27/08) : `/prof/aletheia` reste la cible
//    de « Modules → Aletheia » (`configNavigation.ts`), de ses propres tuiles
//    `?classe=<id>`, et de six des dix `revalidatePath` du dépôt. Ce qui en SORT
//    est UNE SEULE chose : l'encart des examens diagnostiques à concevoir, qui
//    va sous l'onglet Exercices avec le reste de ce qui touche un exercice.
//
// ⚠️ LE MOT « CLASSE » A CESSÉ D'ÊTRE LE NOM DE CET ÉCRAN : l'onglet dit
//    « Livres », et les libellés de la page nomment donc ce qu'ils montrent
//    (une classe sélectionnée, ses livres), jamais « la classe » comme titre.
//
// ⛔ LE DIAGNOSTIC DE COMPRÉHENSION EST PROF-ONLY et il reste ici, avec ce qu'il
//    décrit. Il ne traverse JAMAIS vers un onglet élève, sous aucun prétexte de
//    symétrie — la page le dit à l'écran : « usage prof, jamais montré à l'élève ».
//
// ⚠️ LE SÉLECTEUR NE PROPOSE QUE LES CLASSES AYANT ALETHEIA
//    (`classesAvecModule`) : un livre peut être assigné à une classe sans le
//    module, et la tuile promettait alors un parcours que l'élève ne verrait
//    jamais. La réorganisation ne le remplace pas par une lecture de toutes
//    les classes.
// ============================================================================

import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/admin'
import { classesAvecModule, inscriptionsClasse } from '@/utils/acces'
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
    <div className="w-28 h-1.5 bg-parchemin-fonce rounded-full overflow-hidden" title={`${done}/${total} séances`}>
      <div className="h-full bg-pigment rounded-full" style={{ width: `${pct}%` }} />
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
  if (livres.length === 0) return <span className="text-xs text-muet">Aucun livre assigné à cette classe.</span>
  return (
    <div className="space-y-2">
      {livres.map(livre => {
        const p = progression(livre.semaines, travaux.get(livre.id) ?? new Map())
        return (
          <div key={livre.id} className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className="text-encre-douce truncate max-w-[12rem]">{livre.titre}</span>
              <Barre done={p.done} total={p.total} />
              <span className="text-muet">
                {p.done}/{p.total}
                {p.semaineCourante != null && p.statutCourant != null && (
                  <> · séance {p.semaineCourante} — {STATUT_LABEL[p.statutCourant]}</>
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

  // Accès & classes · L1 — le sélecteur de classe ne propose que les classes
  // AYANT Aletheia. Un livre peut être assigné à une classe sans le module (le
  // Scriptorium assigne les livres, `classe_modules` donne les modules) : la
  // tuile promettait alors un parcours de lecture que l'élève ne verrait jamais.
  const { data: moduleData } = await admin.from('modules').select('id').eq('slug', 'aletheia').maybeSingle()
  const [classesList, { data: livreUnites }, { data: liens }] = await Promise.all([
    moduleData ? classesAvecModule(admin, moduleData.id as string) : Promise.resolve([]),
    admin.from('scriptorium_unites').select('id').eq('type', 'livre'),
    admin.from('scriptorium_unite_classes').select('unite_id, classe_id'),
  ])
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
          <Link href={`/prof/aletheia/eleve/${id}`} className="text-xs text-muet hover:text-encre underline whitespace-nowrap">
            Voir le détail →
          </Link>
        ),
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* ⭐ C5-L4 — L'ENCART DES EXAMENS DIAGNOSTIQUES A DÉMÉNAGÉ SOUS L'ONGLET
          EXERCICES (`app/prof/aletheia/exercices/page.tsx`). Il était en tête de
          cette page, et c'était sa SEULE porte vers
          `app/prof/aletheia/examen-diagnostique/[planifieId]` — il n'y en a
          toujours qu'une, elle a simplement changé d'onglet. */}
      {/* ⭐ L'onglet dit « Livres » : l'écran nomme donc ce qu'il montre. Sans
          cette ligne, un onglet nommé Livres s'ouvrait sur une grille de
          classes sans un mot — et « Classe », le nom qu'il portait, avait
          disparu de la barre (piège 52). */}
      <div>
        <h2 className="font-titre text-xl text-encre">Les livres, classe par classe</h2>
        <p className="font-corps text-sm text-muet mt-1">
          Choisis une classe pour voir l&apos;avancée de chaque élève dans ses livres et sa
          trajectoire diagnostique.
        </p>
      </div>

      {classesList.length === 0 ? (
        <p className="text-center text-muet text-sm py-8">Aucune classe pour le moment.</p>
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
            <p className="text-xs text-muet max-w-xl">
              Diagnostic de compréhension (E→A, thèse / arguments) — usage prof, jamais montré à l&apos;élève. La <strong>tendance</strong> prime sur le point isolé.
            </p>
            <BoutonLancerDiagnostic classeId={classeSel} enAttente={totalEnAttente} aFaire={aFaireGlobal} />
          </div>
          <DetailClasse
            nom={nomClasse ?? 'Classe'}
            sousTitre="Avancée + trajectoire diagnostique (survole une séance pour le détail)"
            eleves={eleves}
            vide="Aucun élève inscrit dans cette classe."
          />
        </>
      )}
    </div>
  )
}
