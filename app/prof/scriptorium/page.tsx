import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { getUrlSignee } from './actions'
import Tuile from '@/components/Tuile'
import FormulaireContenu from './FormulaireContenu'
import FormulaireLivre from './FormulaireLivre'
import LigneContenu, { type ContenuItem, type ImageItem } from './LigneContenu'
import BibliothequeContenus from './BibliothequeContenus'
import type { ContenuBiblio } from './LigneContenuBiblio'
import FormulaireParcours from './parcours/FormulaireParcours'
import GrilleParcours from './parcours/GrilleParcours'
import {
  chargerListeParcours, chargerParcoursDetail, chargerCiblesPicker, chargerParcoursDeClasse,
  type ParcoursListItem, type ParcoursDetail, type CiblesPicker, type ParcoursDeClasse,
} from './parcours/donnees'
import AssignationClasses from './parcours/AssignationClasses'
import { chargerAssignationsAvecApercu, type LigneAssignation } from './parcours/frise-serveur'
import BoutonSupprimerUnite from './BoutonSupprimerUnite'
import VueLivre from './vue-livre/VueLivre'
import type { Signet } from './decoupe-utils'
import SectionParametresScriptorium from './SectionParametresScriptorium'
import { parseReference } from '@/utils/aletheia-retours'
import type { CapstoneProf, LivreReferenceProf } from '@/app/eleve/modules/aletheia/types'

// Les Server Actions de cette page (analyse/extraction d'un PDF déposé) héritent du
// timeout de la page. Plafond du plan Vercel Hobby = 60 s ; large pour extraire le
// texte d'un PDF ≤ ~600 p. (aucun rendu d'image).
export const maxDuration = 60

interface DocRow {
  id: string
  unite_id: string
  titre: string
  type: string | null
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
  auteur: string | null
  signets: Signet[] | null
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
  searchParams: Promise<{ vue?: string; classe?: string; unite?: string; semaine?: string; edition?: string; parcours?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'prof') notFound()

  const { vue = 'classes', classe: classeSel, unite: uniteSel, semaine, edition, parcours: parcoursSel } = await searchParams

  const [{ data: classes }, { data: unites }, { data: docsBruts }, { data: liens }, { data: imagesBrutes }, { data: liensUnite }] = await Promise.all([
    supabase.from('classes').select('id, nom').order('nom'),
    supabase.from('scriptorium_unites').select('id, label, ordre, type, date_debut, nb_semaines, auteur, signets').is('supprime_at', null).order('ordre'),
    supabase.from('scriptorium_documents').select('id, unite_id, titre, type, semaine, chapitres, texte_extrait, fichier_ref'),
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

  // ── Bibliothèque (onglets Textes / Cours) — Parcours L2 ──────────────────────
  // Items réutilisables (scriptorium_contenus), sans classe/unité/semaine. On ne
  // charge/signe que pour l'onglet actif. Si les tables n'existent pas encore
  // (migration parcours_phase_a.sql non jouée), les requêtes renvoient une erreur
  // silencieuse (data null) → listes vides, pas de crash de la page.
  const biblioType: 'texte' | 'cours' | null = vue === 'textes' ? 'texte' : vue === 'cours' ? 'cours' : null
  let biblioContenus: ContenuBiblio[] = []
  let biblioCorbeille: { id: string; titre: string }[] = []
  if (biblioType) {
    const [{ data: rowsC }, { data: imgsC }, { data: creneauxC }, { data: parcVivantsC }] = await Promise.all([
      supabase.from('scriptorium_contenus')
        .select('id, type, titre, auteur, texte_extrait, chapitres, supprime_at')
        .eq('type', biblioType).order('titre'),
      supabase.from('scriptorium_contenu_images')
        .select('id, contenu_id, fichier_ref, legende, ordre').not('contenu_id', 'is', null).order('ordre'),
      supabase.from('scriptorium_parcours_creneaux').select('parcours_id, contenu_id').not('contenu_id', 'is', null),
      supabase.from('scriptorium_parcours').select('id').is('supprime_at', null),
    ])
    const rows = (rowsC ?? []) as {
      id: string; type: string; titre: string; auteur: string | null
      texte_extrait: string | null; chapitres: string | null; supprime_at: string | null
    }[]
    const vivants = rows.filter(r => r.supprime_at == null)
    const idsVivants = new Set(vivants.map(r => r.id))

    // Compteur « utilisé dans N parcours » = nombre de PARCOURS DISTINCTS (un contenu
    // peut occuper plusieurs semaines/positions d'un même parcours → 1 seul compté).
    const parcoursVivants = new Set((parcVivantsC ?? []).map(p => p.id as string))
    const parcoursParContenu = new Map<string, Set<string>>()
    for (const c of creneauxC ?? []) {
      const cid = c.contenu_id as string
      if (!idsVivants.has(cid)) continue
      const pid = c.parcours_id as string
      if (!parcoursVivants.has(pid)) continue // ignore les créneaux de parcours supprimés
      const s = parcoursParContenu.get(cid) ?? new Set<string>()
      s.add(pid)
      parcoursParContenu.set(cid, s)
    }

    // Images des contenus VIVANTS de cet onglet, signées (URL éphémère). On ne signe
    // pas celles des contenus en corbeille (jamais rendues).
    const imgsVivants = (imgsC ?? []).filter(i => idsVivants.has(i.contenu_id as string))
    const imgsSignees = await Promise.all(imgsVivants.map(async i => ({
      contenu_id: i.contenu_id as string,
      item: { id: i.id as string, url: await getUrlSignee(i.fichier_ref as string), legende: i.legende as string | null } as ImageItem,
    })))
    const imagesParContenu = new Map<string, ImageItem[]>()
    for (const { contenu_id, item } of imgsSignees) {
      const arr = imagesParContenu.get(contenu_id) ?? []
      arr.push(item)
      imagesParContenu.set(contenu_id, arr)
    }

    biblioContenus = vivants.map(r => ({
      id: r.id, type: r.type as 'texte' | 'cours', titre: r.titre, auteur: r.auteur,
      texte: r.texte_extrait, chapitres: r.chapitres,
      images: imagesParContenu.get(r.id) ?? [], nbParcours: parcoursParContenu.get(r.id)?.size ?? 0,
    }))
    biblioCorbeille = rows.filter(r => r.supprime_at != null).map(r => ({ id: r.id, titre: r.titre }))
  }

  // ── Parcours (onglet builder) — L4 ───────────────────────────────────────────
  const estParcours = vue === 'parcours'
  let listeParcours: ParcoursListItem[] = []
  let parcoursDetail: ParcoursDetail | null = null
  let ciblesPicker: CiblesPicker = { textes: [], cours: [], livres: [] }
  let assignations: LigneAssignation[] = []
  if (estParcours) {
    if (parcoursSel) {
      ;[parcoursDetail, ciblesPicker] = await Promise.all([
        chargerParcoursDetail(parcoursSel),
        chargerCiblesPicker(),
      ])
      if (parcoursDetail) {
        assignations = await chargerAssignationsAvecApercu(parcoursDetail.id, parcoursDetail.nbSemaines, classesList)
      }
    } else {
      listeParcours = await chargerListeParcours()
    }
  }

  // Parcours (vivants) assignés à la classe sélectionnée — vue « Par classe ».
  let parcoursDeClasse: ParcoursDeClasse[] = []
  if (vue === 'classes' && classeSel) {
    parcoursDeClasse = await chargerParcoursDeClasse(classeSel)
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
  let referenceLivre: LivreReferenceProf | null = null
  if (uniteSelLivre) {
    const [{ data: cap }, { data: ref }] = await Promise.all([
      supabase.from('aletheia_capstone').select('statut, contenu, amende_par_prof, updated_at').eq('scriptorium_livre_id', uniteSelLivre.id).maybeSingle(),
      supabase.from('aletheia_livre_reference').select('statut, contenu, amende_par_prof, updated_at').eq('scriptorium_livre_id', uniteSelLivre.id).maybeSingle(),
    ])
    capstoneLivre = (cap as CapstoneProf | null) ?? null
    // Normalise le jsonb brut : une référence générée AVANT l'ajout de
    // concepts_cles/synthese_modele n'a pas ces clés → parseReference garantit la forme
    // (champs additifs → [] / '') et évite un crash de l'UI sur les livres existants.
    referenceLivre = ref
      ? { ...(ref as LivreReferenceProf), contenu: ref.contenu == null ? null : parseReference(ref.contenu) }
      : null
  }

  function toItem(d: DocRow): ContenuItem {
    return { id: d.id, nom: d.titre, semaine: d.semaine, chapitres: d.chapitres, texte: d.texte_extrait, uniteId: d.unite_id, type: d.type ?? 'cours', fichierLegacyUrl: legacyParDoc.get(d.id) ?? null }
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
      masquerEdition={estLivre.get(d.unite_id) ?? false}
    />
  )

  const ongletClasse = (v: string) =>
    `font-ui px-4 py-2 text-sm rounded-t-lg border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${
      vue === v
        ? 'bg-pigment-teinte text-encre border-liseret font-medium'
        : 'text-encre-douce hover:text-encre hover:bg-pigment-teinte border-transparent'
    }`

  return (
    <div className="space-y-6 pb-8">
      {vue === 'unites' && (
        <div className="space-y-2">
          <FormulaireContenu unites={unitesList} classes={classesList} />
          <FormulaireLivre classes={classesList} />
        </div>
      )}

      <nav className="flex flex-wrap gap-1 border-b border-bordure">
        <Link href="/prof/scriptorium?vue=classes" className={ongletClasse('classes')}>Par classe</Link>
        <Link href="/prof/scriptorium?vue=unites" className={ongletClasse('unites')}>Par unité</Link>
        <Link href="/prof/scriptorium?vue=textes" className={ongletClasse('textes')}>Textes</Link>
        <Link href="/prof/scriptorium?vue=cours" className={ongletClasse('cours')}>Cours</Link>
        <Link href="/prof/scriptorium?vue=parcours" className={ongletClasse('parcours')}>Parcours</Link>
        <Link href="/prof/scriptorium?vue=parametres" className={ongletClasse('parametres')}>Paramètres</Link>
      </nav>

      {/* ── Bibliothèque : Textes / Cours (Parcours L2) ─────────────────────── */}
      {biblioType && (
        <BibliothequeContenus type={biblioType} contenus={biblioContenus} corbeille={biblioCorbeille} />
      )}

      {/* ── Parcours : builder (Parcours L4) ─────────────────────────────────── */}
      {estParcours && (
        parcoursDetail ? (
          <div className="space-y-6">
            <GrilleParcours parcours={parcoursDetail} cibles={ciblesPicker} />
            <AssignationClasses parcoursId={parcoursDetail.id} lignes={assignations} />
          </div>
        ) : parcoursSel ? (
          <p className="text-sm text-muet">Parcours introuvable. <Link href="/prof/scriptorium?vue=parcours" className="underline">Retour à la liste</Link>.</p>
        ) : (
          <div className="space-y-3">
            <FormulaireParcours />
            {listeParcours.length === 0 ? (
              <p className="text-sm text-muet">Aucun parcours pour l’instant. Crée-en un ci-dessus, puis pose des Textes/Cours/Livres semaine par semaine.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {listeParcours.map(p => (
                  <Tuile
                    key={p.id}
                    nom={p.titre}
                    sousTitre={`${p.nbSemaines} semaine${p.nbSemaines > 1 ? 's' : ''} · ${p.nbClasses} classe${p.nbClasses > 1 ? 's' : ''}`}
                    href={`/prof/scriptorium?vue=parcours&parcours=${p.id}`}
                    couleur={p.nbClasses > 0 ? 'vert' : 'neutre'}
                  />
                ))}
              </div>
            )}
          </div>
        )
      )}

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
            <div className="bg-surface border border-bordure rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-encre">{classeNom.get(classeSel) ?? 'Classe'}</h3>
              {parcoursDeClasse.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muet uppercase tracking-wide">Parcours assignés</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {parcoursDeClasse.map(p => (
                      <Tuile
                        key={p.id}
                        nom={p.titre}
                        sousTitre={`${p.nbSemaines} sem.${p.dateDebut ? ` · début ${p.dateDebut.split('-').reverse().join('/')}` : ' · sans date'}`}
                        href={`/prof/scriptorium?vue=parcours&parcours=${p.id}`}
                        couleur="vert"
                      />
                    ))}
                  </div>
                </div>
              )}
              {docsAffiches.length === 0 ? (
                <p className="text-sm text-muet">Aucune unité (ancien format) assignée à cette classe.</p>
              ) : (
                unitesList
                  .filter(u => docsAffiches.some(d => d.unite_id === u.id))
                  .map(u => (
                    <details key={u.id} open className="border border-bordure rounded-lg">
                      <summary className="px-3 py-2 text-sm font-medium text-encre-douce cursor-pointer">{u.label}</summary>
                      <div className="px-3 pb-3 space-y-3">
                        {parSemaine(docsAffiches.filter(d => d.unite_id === u.id)).map(([sem, ds]) => (
                          <div key={sem ?? 'na'} className="space-y-1.5">
                            <p className="text-xs text-muet uppercase tracking-wide">{sem != null ? `Semaine ${sem}` : 'Semaine non précisée'}</p>
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

      {/* ── Perspective « unités » ──────────────────────────────────────────
          Un LIVRE ouvert devient une page à part entière (vue-livre, 3 colonnes) :
          la grille de tuiles ne se rend plus, « ← Toutes les unités » y ramène. */}
      {vue === 'unites' && uniteSelLivre && (
        <VueLivre
          livre={uniteSelLivre}
          classes={classesList}
          classeIds={classesParUnite.get(uniteSelLivre.id) ?? []}
          docs={docsAffiches
            .filter(d => d.semaine != null)
            .sort((a, b) => ((a.semaine as number) - (b.semaine as number)) || a.id.localeCompare(b.id))
            .map(d => ({ id: d.id, semaine: d.semaine as number, titre: d.titre, chapitres: d.chapitres, texte: d.texte_extrait }))}
          nbDocsSansSemaine={docsAffiches.filter(d => d.semaine == null).length}
          capstone={capstoneLivre}
          reference={referenceLivre}
          semaineParam={semaine}
          modeDecoupe={edition === 'decoupe'}
        />
      )}
      {vue === 'unites' && !uniteSelLivre && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {unitesList.map(u => {
              const n = docs.filter(d => d.unite_id === u.id).length
              const estLivre = u.type === 'livre'
              const sousTitre = estLivre
                ? `📖 Livre · ${u.nb_semaines ?? n} semaine${(u.nb_semaines ?? n) > 1 ? 's' : ''}${u.auteur ? ` · ${u.auteur}` : ''}`
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
            <div className="bg-surface border border-bordure rounded-xl p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-medium text-encre">{uniteCourante?.label ?? 'Unité'}</h3>
                  {uniteCourante && (
                    <BoutonSupprimerUnite uniteId={uniteCourante.id} label={uniteCourante.label} estLivre={false} />
                  )}
                </div>
              </div>
              {docsAffiches.length === 0 ? (
                <p className="text-sm text-muet">Aucun contenu dans cette unité.</p>
              ) : (
                <>
                  {classesList
                    .filter(c => docsAffiches.some(d => (classesParDoc.get(d.id) ?? []).includes(c.id)))
                    .map(c => (
                      <details key={c.id} open className="border border-bordure rounded-lg">
                        <summary className="px-3 py-2 text-sm font-medium text-encre-douce cursor-pointer">{c.nom}</summary>
                        <div className="px-3 pb-3 space-y-3">
                          {parSemaine(docsAffiches.filter(d => (classesParDoc.get(d.id) ?? []).includes(c.id))).map(([sem, ds]) => (
                            <div key={sem ?? 'na'} className="space-y-1.5">
                              <p className="text-xs text-muet uppercase tracking-wide">{sem != null ? `Semaine ${sem}` : 'Semaine non précisée'}</p>
                              {ds.map(ligne)}
                            </div>
                          ))}
                        </div>
                      </details>
                    ))}
                  {/* Contenu sans classe assignée (legacy non résolu) → à réassigner */}
                  {docsAffiches.some(d => (classesParDoc.get(d.id) ?? []).length === 0) && (
                    <details open className="border border-attention bg-attention-teinte/40 rounded-lg">
                      <summary className="px-3 py-2 text-sm font-medium text-attention cursor-pointer">Sans classe — à réassigner</summary>
                      <div className="px-3 pb-3 space-y-3">
                        {parSemaine(docsAffiches.filter(d => (classesParDoc.get(d.id) ?? []).length === 0)).map(([sem, ds]) => (
                          <div key={sem ?? 'na'} className="space-y-1.5">
                            <p className="text-xs text-muet uppercase tracking-wide">{sem != null ? `Semaine ${sem}` : 'Semaine non précisée'}</p>
                            {ds.map(ligne)}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
            </div>
            )
          })()}
        </>
      )}

      {/* ── Perspective « paramètres » (prompts carte d'architecture + référence) ── */}
      {vue === 'parametres' && <SectionParametresScriptorium />}
    </div>
  )
}
