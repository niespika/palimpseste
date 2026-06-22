import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getUrlSignee } from './actions'
import Tuile from '@/components/Tuile'
import FormulaireContenu from './FormulaireContenu'
import FormulaireLivre from './FormulaireLivre'
import EditeurClassesLivre from './EditeurClassesLivre'
import LigneContenu, { type ContenuItem, type ImageItem } from './LigneContenu'
import CarteArchitectureLivre from './CarteArchitectureLivre'
import type { CapstoneProf, LivreReference } from '@/app/eleve/modules/aletheia/types'

interface DocRow {
  id: string
  unite_id: string
  titre: string
  semaine: number | null
  chapitres: string | null
  texte_extrait: string | null
  fichier_ref: string | null
}

interface UniteRow {
  id: string
  label: string
  type: string | null
  date_debut: string | null
  nb_semaines: number | null
}

// Formate une date Postgres (« YYYY-MM-DD ») sans passer par `new Date`, qui
// la parse en UTC puis la reformate dans le fuseau du serveur (dérive d'un jour).
function formatDateFr(d: string): string {
  const [a, m, j] = d.split('-')
  return a && m && j ? `${j}/${m}/${a}` : d
}

// Regroupe des contenus par semaine (clé null = « non précisée »), trié.
function parSemaine(docs: DocRow[]): [number | null, DocRow[]][] {
  const m = new Map<number | null, DocRow[]>()
  for (const d of docs) {
    const arr = m.get(d.semaine) ?? []
    arr.push(d)
    m.set(d.semaine, arr)
  }
  return [...m.entries()].sort((a, b) => {
    if (a[0] == null) return 1
    if (b[0] == null) return -1
    return a[0] - b[0]
  })
}

export default async function ScriptoriumPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string; classe?: string; unite?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const { vue = 'classes', classe: classeSel, unite: uniteSel } = await searchParams

  const [{ data: classes }, { data: unites }, { data: docsBruts }, { data: liens }, { data: imagesBrutes }, { data: liensUnite }] = await Promise.all([
    supabase.from('classes').select('id, nom').order('nom'),
    supabase.from('scriptorium_unites').select('id, label, ordre, type, date_debut, nb_semaines').order('ordre'),
    supabase.from('scriptorium_documents').select('id, unite_id, titre, semaine, chapitres, texte_extrait, fichier_ref'),
    supabase.from('scriptorium_document_classes').select('document_id, classe_id'),
    supabase.from('scriptorium_contenu_images').select('id, document_id, fichier_ref, legende, ordre').order('ordre'),
    supabase.from('scriptorium_unite_classes').select('unite_id, classe_id'),
  ])

  const classesList = (classes ?? []) as { id: string; nom: string }[]
  const unitesList = (unites ?? []) as UniteRow[]
  const docs = (docsBruts ?? []) as DocRow[]
  const classeNom = new Map(classesList.map(c => [c.id, c.nom]))
  const estLivre = new Map(unitesList.map(u => [u.id, u.type === 'livre']))

  // unité (livre) → classeIds (assignation au niveau du livre, Lot 2)
  const classesParUnite = new Map<string, string[]>()
  for (const l of liensUnite ?? []) {
    const arr = classesParUnite.get(l.unite_id as string) ?? []
    arr.push(l.classe_id as string)
    classesParUnite.set(l.unite_id as string, arr)
  }

  // doc → classeIds. Pour un livre, les classes viennent du NIVEAU LIVRE ; pour
  // le reste (contenu de cours), elles restent par document (liaison Lot 6).
  const classesParDoc = new Map<string, string[]>()
  for (const l of liens ?? []) {
    const arr = classesParDoc.get(l.document_id as string) ?? []
    arr.push(l.classe_id as string)
    classesParDoc.set(l.document_id as string, arr)
  }
  for (const d of docs) {
    if (estLivre.get(d.unite_id)) classesParDoc.set(d.id, classesParUnite.get(d.unite_id) ?? [])
  }

  // Quels contenus seront rendus (drill) → on ne signe les fichiers que pour ceux-là.
  const docsAffiches = vue === 'unites'
    ? (uniteSel ? docs.filter(d => d.unite_id === uniteSel) : [])
    : (classeSel ? docs.filter(d => (classesParDoc.get(d.id) ?? []).includes(classeSel)) : [])
  const idsAffiches = new Set(docsAffiches.map(d => d.id))

  // Images (signées) par doc affiché
  const imagesAffichees = (imagesBrutes ?? []).filter(i => idsAffiches.has(i.document_id as string))
  const imagesSignees = await Promise.all(imagesAffichees.map(async i => ({
    document_id: i.document_id as string,
    item: { id: i.id as string, url: await getUrlSignee(i.fichier_ref as string), legende: i.legende as string | null } as ImageItem,
  })))
  const imagesParDoc = new Map<string, ImageItem[]>()
  for (const { document_id, item } of imagesSignees) {
    const arr = imagesParDoc.get(document_id) ?? []
    arr.push(item)
    imagesParDoc.set(document_id, arr)
  }

  // Fichier legacy (signé) par doc affiché
  const legacyParDoc = new Map<string, string | null>()
  await Promise.all(docsAffiches.filter(d => d.fichier_ref).map(async d => {
    legacyParDoc.set(d.id, await getUrlSignee(d.fichier_ref as string))
  }))

  // Carte d'architecture + référence du livre sélectionné (perspective « unités »).
  const uniteSelLivre = vue === 'unites' && uniteSel ? unitesList.find(u => u.id === uniteSel && u.type === 'livre') : undefined
  let capstoneLivre: CapstoneProf | null = null
  let referenceLivre: LivreReference | null = null
  if (uniteSelLivre) {
    const [{ data: cap }, { data: ref }] = await Promise.all([
      supabase.from('aletheia_capstone').select('statut, contenu, amende_par_prof, updated_at').eq('scriptorium_livre_id', uniteSelLivre.id).maybeSingle(),
      supabase.from('aletheia_livre_reference').select('statut, contenu').eq('scriptorium_livre_id', uniteSelLivre.id).maybeSingle(),
    ])
    capstoneLivre = (cap as CapstoneProf | null) ?? null
    referenceLivre = (ref as LivreReference | null) ?? null
  }

  function toItem(d: DocRow): ContenuItem {
    return { id: d.id, nom: d.titre, semaine: d.semaine, chapitres: d.chapitres, texte: d.texte_extrait, uniteId: d.unite_id, fichierLegacyUrl: legacyParDoc.get(d.id) ?? null }
  }

  const ligne = (d: DocRow) => (
    <LigneContenu
      key={d.id}
      item={toItem(d)}
      unites={unitesList}
      classes={classesList}
      assignedClasseIds={classesParDoc.get(d.id) ?? []}
      images={imagesParDoc.get(d.id) ?? []}
      masquerClasses={estLivre.get(d.unite_id) ?? false}
    />
  )

  const ongletClasse = (v: string) =>
    `px-4 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
      vue === v ? 'border-stone-700 text-stone-900 font-medium' : 'border-transparent text-stone-500 hover:text-stone-800'
    }`

  return (
    <div className="space-y-6 pb-8">
      <div className="space-y-2">
        <FormulaireContenu unites={unitesList} classes={classesList} />
        <FormulaireLivre classes={classesList} />
      </div>

      <nav className="flex gap-1 border-b border-stone-200">
        <Link href="/prof/scriptorium?vue=classes" className={ongletClasse('classes')}>Par classe</Link>
        <Link href="/prof/scriptorium?vue=unites" className={ongletClasse('unites')}>Par unité</Link>
      </nav>

      {/* ── Perspective « classes » ─────────────────────────────────────── */}
      {vue === 'classes' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {classesList.map(c => {
              const n = docs.filter(d => (classesParDoc.get(d.id) ?? []).includes(c.id)).length
              return (
                <Tuile
                  key={c.id}
                  nom={c.nom}
                  sousTitre={`${n} contenu${n > 1 ? 's' : ''}`}
                  href={`/prof/scriptorium?vue=classes&classe=${c.id}`}
                  selectionnee={classeSel === c.id}
                  couleur={n > 0 ? 'vert' : 'neutre'}
                />
              )
            })}
          </div>

          {classeSel && (
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-stone-900">{classeNom.get(classeSel) ?? 'Classe'}</h3>
              {docsAffiches.length === 0 ? (
                <p className="text-sm text-stone-400">Aucun contenu assigné à cette classe.</p>
              ) : (
                unitesList
                  .filter(u => docsAffiches.some(d => d.unite_id === u.id))
                  .map(u => (
                    <details key={u.id} open className="border border-stone-100 rounded-lg">
                      <summary className="px-3 py-2 text-sm font-medium text-stone-700 cursor-pointer">{u.label}</summary>
                      <div className="px-3 pb-3 space-y-3">
                        {parSemaine(docsAffiches.filter(d => d.unite_id === u.id)).map(([sem, ds]) => (
                          <div key={sem ?? 'na'} className="space-y-1.5">
                            <p className="text-xs text-stone-400 uppercase tracking-wide">{sem != null ? `Semaine ${sem}` : 'Semaine non précisée'}</p>
                            {ds.map(ligne)}
                          </div>
                        ))}
                      </div>
                    </details>
                  ))
              )}
            </div>
          )}
        </>
      )}

      {/* ── Perspective « unités » ──────────────────────────────────────── */}
      {vue === 'unites' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unitesList.map(u => {
              const n = docs.filter(d => d.unite_id === u.id).length
              const estLivre = u.type === 'livre'
              const sousTitre = estLivre
                ? `📖 Livre · ${u.nb_semaines ?? n} semaine${(u.nb_semaines ?? n) > 1 ? 's' : ''}`
                : `${n} contenu${n > 1 ? 's' : ''}`
              return (
                <Tuile
                  key={u.id}
                  nom={u.label}
                  sousTitre={sousTitre}
                  href={`/prof/scriptorium?vue=unites&unite=${u.id}`}
                  selectionnee={uniteSel === u.id}
                  couleur={n > 0 ? 'vert' : 'neutre'}
                />
              )
            })}
          </div>

          {uniteSel && (() => {
            const uniteCourante = unitesList.find(u => u.id === uniteSel)
            return (
            <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-3">
              <div>
                <h3 className="font-medium text-stone-900">{uniteCourante?.label ?? 'Unité'}</h3>
                {uniteCourante?.type === 'livre' && (
                  <>
                    <p className="text-xs text-stone-400 mt-0.5">
                      📖 Livre · {uniteCourante.nb_semaines ?? '?'} semaines
                      {uniteCourante.date_debut && ` · début le ${formatDateFr(uniteCourante.date_debut)}`}
                      <span className="ml-1">— PDF = ancrage IA, non visibles par l&apos;élève</span>
                    </p>
                    <div className="mt-2">
                      <EditeurClassesLivre uniteId={uniteCourante.id} classes={classesList} assignedClasseIds={classesParUnite.get(uniteCourante.id) ?? []} />
                    </div>
                  </>
                )}
              </div>
              {docsAffiches.length === 0 ? (
                <p className="text-sm text-stone-400">Aucun contenu dans cette unité.</p>
              ) : (
                <>
                  {classesList
                    .filter(c => docsAffiches.some(d => (classesParDoc.get(d.id) ?? []).includes(c.id)))
                    .map(c => (
                      <details key={c.id} open className="border border-stone-100 rounded-lg">
                        <summary className="px-3 py-2 text-sm font-medium text-stone-700 cursor-pointer">{c.nom}</summary>
                        <div className="px-3 pb-3 space-y-3">
                          {parSemaine(docsAffiches.filter(d => (classesParDoc.get(d.id) ?? []).includes(c.id))).map(([sem, ds]) => (
                            <div key={sem ?? 'na'} className="space-y-1.5">
                              <p className="text-xs text-stone-400 uppercase tracking-wide">{sem != null ? `Semaine ${sem}` : 'Semaine non précisée'}</p>
                              {ds.map(ligne)}
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  {/* Contenu sans classe assignée (legacy non résolu) → à réassigner */}
                  {docsAffiches.some(d => (classesParDoc.get(d.id) ?? []).length === 0) && (
                    <details open className="border border-amber-200 bg-amber-50/40 rounded-lg">
                      <summary className="px-3 py-2 text-sm font-medium text-amber-700 cursor-pointer">Sans classe — à réassigner</summary>
                      <div className="px-3 pb-3 space-y-3">
                        {parSemaine(docsAffiches.filter(d => (classesParDoc.get(d.id) ?? []).length === 0)).map(([sem, ds]) => (
                          <div key={sem ?? 'na'} className="space-y-1.5">
                            <p className="text-xs text-stone-400 uppercase tracking-wide">{sem != null ? `Semaine ${sem}` : 'Semaine non précisée'}</p>
                            {ds.map(ligne)}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}

              {/* Carte d'architecture (générée à la prép) — sous les semaines, pour un livre */}
              {uniteCourante?.type === 'livre' && (
                <CarteArchitectureLivre livreId={uniteCourante.id} capstone={capstoneLivre} reference={referenceLivre} />
              )}
            </div>
            )
          })()}
        </>
      )}
    </div>
  )
}
