'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PanneauRetour from './PanneauRetour'
import TirageAuSort from './TirageAuSort'
import { noteVersLettre } from '@/utils/notation'
import { publierAnalysesLot, depublierAnalysesLot, relancerAnalysesLot } from './actions'
import { repartirSelection, elevesAValider, toutAValiderEstChoisi, basculerPile } from '@/utils/validation-lot'
import type { EleveAvecDepot, FragmentPresentation, StatutPresentation } from '@/types/fragments'

// ----------------------------------------------------------------------------
// Vestigia · onglet Semaine — LA SEMAINE, SES CLASSES, SES ÉLÈVES, L'ÉLÈVE OUVERT.
// Tout ce qui se passe ici est local : changer de classe, filtrer, cocher, ouvrir
// un élève — aucune navigation. Les données des trois classes arrivent d'un coup
// du serveur (42 inscrits mesurés le 13/09) ; le retour complet d'un élève, lui,
// se charge à l'ouverture du panneau, par une action serveur.
// ----------------------------------------------------------------------------

export interface PresentationAvecEleve extends FragmentPresentation {
  statut: StatutPresentation
  eleve: { display_name: string; classe: string | null } | null
}

export interface ClasseSemaine {
  id: string
  nom: string
  /** Inscriptions actives — le même dénominateur que la frise. */
  inscrits: number
  eleves: EleveAvecDepot[]
  eligibles: { id: string; display_name: string; classe: string | null; nbPresentations: number }[]
  presentations: PresentationAvecEleve[]
}

interface Props {
  semaineId: string
  classes: ClasseSemaine[]
  classeInitiale: string | null
  tz: string
}

type Filtre = 'tous' | 'a_valider' | 'manquants' | 'publies'

function puceDepot(e: EleveAvecDepot) {
  if (!e.depot) return <span className="font-ui text-[11px] bg-retard-teinte text-retard px-2 py-0.5 rounded-full whitespace-nowrap">manquant</span>
  if (e.depot.statut === 'en_retard') return <span className="font-ui text-[11px] bg-attention-teinte text-attention px-2 py-0.5 rounded-full whitespace-nowrap">en retard</span>
  return <span className="font-ui text-[11px] bg-ok-teinte text-ok px-2 py-0.5 rounded-full whitespace-nowrap">déposé</span>
}

// La colonne de droite du rang : les trois lettres, ou l'état de l'analyse.
function etatAnalyse(e: EleveAvecDepot) {
  const a = e.analyse
  if (!e.depot) return <span className="text-bordure">—</span>
  if (!a) return <span className="text-muet-clair font-ui text-[11px]">sans analyse</span>
  if (a.statut === 'en_cours') return <span className="font-ui text-[11px] text-info">en cours…</span>
  if (a.statut === 'erreur') return <span className="font-ui text-[11px] text-retard">erreur</span>
  const lettres = `${noteVersLettre(a.note_decouvertes) ?? '?'} · ${noteVersLettre(a.note_sources) ?? '?'} · ${noteVersLettre(a.note_reflexions) ?? '?'}`
  if (a.statut === 'generee') return <span className="font-ui text-[11px] text-attention whitespace-nowrap" title={lettres}>à valider</span>
  return <span className="font-ui text-xs text-muet tabular-nums tracking-wide whitespace-nowrap">{lettres}</span>
}

export default function VueSemaine({ semaineId, classes, classeInitiale, tz }: Props) {
  const router = useRouter()
  const [classeId, setClasseId] = useState<string>(() =>
    classes.some(c => c.id === classeInitiale) ? (classeInitiale as string) : classes[0]?.id,
  )
  const [filtre, setFiltre] = useState<Filtre>('tous')
  const [ouvertId, setOuvertId] = useState<string | null>(null)
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [enCours, setEnCours] = useState(false)
  const [bilan, setBilan] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)
  // Une saisie non enregistrée dans le panneau : on ne le ferme pas sans demander.
  const modifieRef = useRef(false)
  const surModifie = useCallback((m: boolean) => { modifieRef.current = m }, [])
  const peutQuitter = useCallback(() =>
    !modifieRef.current || window.confirm('Des modifications ne sont pas enregistrées. Quitter ce retour quand même ?'), [])
  const ouvrir = useCallback((id: string | null) => {
    if (!peutQuitter()) return
    modifieRef.current = false
    setOuvertId(id)
  }, [peutQuitter])

  // La même garde sur TOUT ce qui quitte l'écran : une case de la frise, un onglet
  // du module, le lien « Ouvrir en grand », la fermeture ou le rechargement de
  // l'onglet. Un clic sur un lien est intercepté en phase de capture, avant Next.
  useEffect(() => {
    function surClic(e: MouseEvent) {
      if (!modifieRef.current) return
      const lien = (e.target as HTMLElement | null)?.closest?.('a[href]')
      if (!lien || e.defaultPrevented) return
      if (!window.confirm('Des modifications ne sont pas enregistrées. Quitter ce retour quand même ?')) {
        e.preventDefault()
        e.stopPropagation()
      } else {
        modifieRef.current = false
      }
    }
    function avantDecharge(e: BeforeUnloadEvent) {
      if (!modifieRef.current) return
      e.preventDefault()
    }
    document.addEventListener('click', surClic, true)
    window.addEventListener('beforeunload', avantDecharge)
    return () => {
      document.removeEventListener('click', surClic, true)
      window.removeEventListener('beforeunload', avantDecharge)
    }
  }, [])

  const classe = classes.find(c => c.id === classeId) ?? classes[0]
  const eleves = classe.eleves

  // La classe suit l'URL (`?classe=`) sans navigation : un rechargement, un lien
  // copié, un retour arrière retrouvent la même classe.
  function choisirClasse(id: string) {
    if (!peutQuitter()) return
    modifieRef.current = false
    setClasseId(id)
    setOuvertId(null)
    setSelection(new Set())
    setBilan(null)
    const url = new URL(window.location.href)
    url.searchParams.set('classe', id)
    window.history.replaceState(null, '', url.toString())
  }

  const nb = useMemo(() => ({
    deposes: eleves.filter(e => e.depot).length,
    retard: eleves.filter(e => e.depot?.statut === 'en_retard').length,
    manquants: eleves.filter(e => !e.depot).length,
    aValider: eleves.filter(e => e.analyse?.statut === 'generee').length,
    publies: eleves.filter(e => e.analyse?.statut === 'publiee').length,
  }), [eleves])

  const visibles = useMemo(() => {
    switch (filtre) {
      case 'a_valider': return eleves.filter(e => e.analyse?.statut === 'generee')
      case 'manquants': return eleves.filter(e => !e.depot)
      case 'publies': return eleves.filter(e => e.analyse?.statut === 'publiee')
      default: return eleves
    }
  }, [eleves, filtre])

  // Le panneau suit l'ordre AFFICHÉ : ‹ › parcourent la liste telle qu'elle est
  // filtrée. Si l'élève ouvert vient de sortir du filtre (son retour publié, puis
  // « À valider »), on parcourt la classe entière plutôt que de figer les flèches.
  const ouvert = ouvertId ? eleves.find(e => e.id === ouvertId) ?? null : null
  const dansVisibles = ouvert ? visibles.findIndex(e => e.id === ouvert.id) : -1
  const parcours = dansVisibles >= 0 ? visibles : eleves
  const indexOuvert = ouvert ? parcours.findIndex(e => e.id === ouvert.id) : -1
  const precedent = indexOuvert > 0 ? parcours[indexOuvert - 1] : null
  const suivant = indexOuvert >= 0 && indexOuvert < parcours.length - 1 ? parcours[indexOuvert + 1] : null

  const fermer = useCallback(() => ouvrir(null), [ouvrir])

  // Clavier : Échap ferme, ← → changent d'élève — jamais depuis un champ de saisie,
  // où ces touches ont déjà un sens (fermer un correcteur, déplacer le curseur).
  useEffect(() => {
    if (!ouvertId) return
    function surTouche(e: KeyboardEvent) {
      const cible = e.target as HTMLElement | null
      const saisie = cible && (cible.tagName === 'TEXTAREA' || cible.tagName === 'INPUT' || cible.tagName === 'SELECT' || cible.isContentEditable)
      if (saisie) return
      if (e.key === 'Escape') fermer()
      if (e.key === 'ArrowLeft' && precedent) ouvrir(precedent.id)
      if (e.key === 'ArrowRight' && suivant) ouvrir(suivant.id)
    }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [ouvertId, precedent, suivant, fermer, ouvrir])

  // ── Validation par lot (C8·L2) — inchangée : la répartition vit dans
  //    utils/validation-lot.ts, testée. ───────────────────────────────────────
  // ⚠️ La pile se coche et se publie sur ce qui est À L'ÉCRAN : changer de filtre
  //    vide la sélection, et la case d'en-tête ne coche que les lignes visibles.
  //    Sinon, sous « Manquants », on publierait douze retours que personne ne voit.
  const aValider = useMemo(() => elevesAValider(visibles), [visibles])
  const { choisis, aPublier, aDepublier, cibles } = useMemo(() => repartirSelection(visibles, selection), [visibles, selection])
  const toutAValiderChoisi = toutAValiderEstChoisi(visibles, selection)

  function choisirFiltre(f: Filtre) {
    setFiltre(f)
    setSelection(new Set())
    setBilan(null)
  }

  function basculer(depotId: string) {
    setBilan(null)
    setSelection(prev => {
      const suivant = new Set(prev)
      if (suivant.has(depotId)) suivant.delete(depotId)
      else suivant.add(depotId)
      return suivant
    })
  }

  async function agir(action: () => Promise<{ type: 'ok' | 'err'; texte: string }>) {
    setEnCours(true)
    setBilan(null)
    try {
      const res = await action()
      setBilan(res)
      if (res.type === 'ok') {
        setSelection(new Set())
        router.refresh()
      }
    } catch (e) {
      setBilan({ type: 'err', texte: e instanceof Error ? e.message : "L'action a échoué." })
    } finally {
      setEnCours(false)
    }
  }

  const handlePublier = () => agir(async () => {
    const r = await publierAnalysesLot(aPublier.map(e => e.analyse!.id))
    if (r.error) return { type: 'err' as const, texte: r.error }
    return {
      type: 'ok' as const,
      texte: `${r.publiees} retour${r.publiees > 1 ? 's' : ''} publié${r.publiees > 1 ? 's' : ''} — les élèves y ont accès.`
        + (r.ignorees > 0 ? ` ${r.ignorees} ignoré${r.ignorees > 1 ? 's' : ''} (déjà publié ou plus « à valider »).` : ''),
    }
  })
  const handleDepublier = () => agir(async () => {
    const r = await depublierAnalysesLot(aDepublier.map(e => e.analyse!.id))
    if (r.error) return { type: 'err' as const, texte: r.error }
    return { type: 'ok' as const, texte: `${r.depubliees} retour${r.depubliees > 1 ? 's' : ''} dépublié${r.depubliees > 1 ? 's' : ''} — repassé${r.depubliees > 1 ? 's' : ''} « à valider ».` }
  })
  const handleRelancer = () => agir(async () => {
    const r = await relancerAnalysesLot(cibles)
    if (r.error) return { type: 'err' as const, texte: r.error }
    return { type: 'ok' as const, texte: `${r.relancees} analyse${r.relancees > 1 ? 's' : ''} relancée${r.relancees > 1 ? 's' : ''} — elles se refont en arrière-plan, une par une.` }
  })

  const filtres: { cle: Filtre; label: string; n: number }[] = [
    { cle: 'tous', label: 'Tous', n: eleves.length },
    { cle: 'a_valider', label: 'À valider', n: nb.aValider },
    { cle: 'manquants', label: 'Manquants', n: nb.manquants },
    { cle: 'publies', label: 'Publiés', n: nb.publies },
  ]

  return (
    <div className={`grid gap-4 items-start ${ouvert ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)]' : ''}`}>
      {/* ── La classe et sa liste ─────────────────────────────────────────── */}
      <div className="min-w-0 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div role="tablist" aria-label="Classe" className="inline-flex border border-bordure-bouton rounded-lg overflow-hidden font-ui text-[13px]">
            {classes.map(c => {
              const actif = c.id === classe.id
              const deposes = c.eleves.filter(e => e.depot).length
              const aValiderC = c.eleves.filter(e => e.analyse?.statut === 'generee').length
              const manquantsC = c.inscrits - deposes
              return (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={actif}
                  onClick={() => choisirClasse(c.id)}
                  className={`px-3.5 py-1.5 border-l first:border-l-0 border-bordure-bouton transition-colors ${
                    actif ? 'bg-pigment text-surface' : 'text-encre-douce hover:bg-parchemin-fonce'
                  }`}
                >
                  {c.nom} <span className={`tabular-nums ${actif ? 'text-surface/75' : 'text-muet'}`}>· {deposes}/{c.inscrits}</span>
                  {/* Ce qui réclame l'attention se lit sur TOUTES les classes, pas
                      seulement l'active : un point ocre = des retours à valider,
                      un point rouge = des dépôts manquants. */}
                  {aValiderC > 0 && <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] tabular-nums ${actif ? 'bg-surface/20 text-surface' : 'bg-attention-teinte text-attention'}`} title={`${aValiderC} à valider`}>{aValiderC}</span>}
                  {manquantsC > 0 && <span aria-hidden className={`ml-1 inline-block w-1.5 h-1.5 rounded-full align-middle ${actif ? 'bg-surface/60' : 'bg-retard'}`} title={`${manquantsC} manquant${manquantsC > 1 ? 's' : ''}`} />}
                </button>
              )
            })}
          </div>
          <span className="flex-1" />
          <div className="flex gap-1.5 font-ui text-xs">
            {filtres.map(f => (
              <button
                key={f.cle}
                onClick={() => choisirFiltre(f.cle)}
                className={`px-2.5 py-1 rounded-full border transition-colors ${
                  filtre === f.cle ? 'bg-encre-douce border-encre-douce text-parchemin' : 'border-bordure-bouton text-encre-douce hover:bg-parchemin-fonce'
                }`}
              >
                {f.label} <span className={`tabular-nums ${filtre === f.cle ? 'text-parchemin/75' : 'text-muet'}`}>· {f.n}</span>
              </button>
            ))}
          </div>
        </div>

        {bilan && (
          <div className={`rounded-xl px-4 py-2.5 text-sm ${bilan.type === 'ok' ? 'bg-ok-teinte border border-ok text-ok' : 'bg-retard-teinte border border-retard text-retard'}`}>
            {bilan.texte}
          </div>
        )}

        {/* La liste : deux colonnes dès qu'il y a la place, pour que 25 élèves tiennent
            sans défiler (13 rangs de 34 px). Avec le panneau ouvert, il faut ≥ 1400 px. */}
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          {eleves.length === 0 ? (
            <p className="p-8 text-center text-muet text-sm">Aucun élève inscrit dans cette classe.</p>
          ) : visibles.length === 0 ? (
            <p className="p-8 text-center text-muet text-sm">Personne dans ce filtre.</p>
          ) : (
            <div className={`grid ${ouvert ? 'min-[1400px]:grid-cols-2' : 'md:grid-cols-2'}`}>
              <div className={`hidden md:flex items-center gap-2 px-3 h-8 bg-parchemin-fonce ${ouvert ? '' : 'md:col-span-2'}`}>
                <input
                  type="checkbox"
                  checked={toutAValiderChoisi}
                  disabled={aValider.length === 0 || enCours}
                  onChange={() => { setBilan(null); setSelection(prev => basculerPile(visibles, prev)) }}
                  className="rounded accent-[color:var(--bouton)] disabled:opacity-30"
                  title={aValider.length > 0 ? `Sélectionner les ${aValider.length} analyses à valider` : 'Aucune analyse à valider'}
                  aria-label="Sélectionner toutes les analyses à valider"
                />
                <span className="font-ui text-[11px] uppercase tracking-wider text-muet-clair">
                  {aValider.length > 0 ? `cocher les ${aValider.length} à valider` : 'élève · dépôt · notes'}
                </span>
              </div>
              {ouvert && <div className="hidden min-[1400px]:block h-8 bg-parchemin-fonce" />}
              {visibles.map((e, i) => {
                const choisi = !!e.depot && selection.has(e.depot.id)
                const estOuvert = ouvert?.id === e.id
                const signal = e.analyse?.signal_integrite ?? null
                return (
                  <div
                    key={e.id}
                    className={`group flex items-center gap-2 pl-3 pr-3 h-[38px] md:h-[34px] border-t border-bordure ${
                      estOuvert ? 'bg-pigment-teinte' : choisi ? 'bg-pigment-teinte/60' : !e.depot ? 'bg-retard-teinte/20' : 'hover:bg-parchemin-fonce'
                    } ${i === 0 ? 'max-md:border-t-0' : ''} transition-colors`}
                  >
                    <input
                      type="checkbox"
                      checked={choisi}
                      disabled={!e.depot || enCours}
                      onChange={() => e.depot && basculer(e.depot.id)}
                      className="rounded accent-[color:var(--bouton)] disabled:opacity-25 flex-shrink-0"
                      aria-label={`Sélectionner le dépôt de ${e.display_name}`}
                    />
                    <button
                      onClick={() => ouvrir(estOuvert ? null : e.id)}
                      className={`flex-1 min-w-0 text-left text-[15px] leading-none truncate ${
                        !e.depot ? 'text-muet' : 'text-encre'
                      } ${estOuvert ? 'font-medium' : ''} hover:text-pigment`}
                      title={e.display_name}
                      aria-pressed={estOuvert}
                    >
                      {e.display_name}
                      {signal && <span className="ml-1.5 text-retard" title={signal.motif ?? 'Signal d’intégrité'}>⚑</span>}
                    </button>
                    {puceDepot(e)}
                    <span className="w-[62px] text-right flex-shrink-0">{etatAnalyse(e)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* La barre de lot — n'apparaît qu'une fois quelque chose de coché. Chaque
            bouton annonce le nombre qu'il touchera VRAIMENT. */}
        {selection.size > 0 && (
          <div className="sticky bottom-4 z-10">
            <div className="bg-surface border border-pigment shadow-sm rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-3 font-ui text-sm">
              <span className="text-encre-douce"><span className="font-medium">{selection.size}</span> dépôt{selection.size > 1 ? 's' : ''} coché{selection.size > 1 ? 's' : ''}</span>
              <button onClick={handlePublier} disabled={enCours || aPublier.length === 0} className="bg-bouton text-bouton-texte px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 transition-colors">
                {enCours ? '…' : `Publier${aPublier.length > 0 ? ` (${aPublier.length})` : ''}`}
              </button>
              <button onClick={handleRelancer} disabled={enCours || choisis.length === 0} className="border border-bordure-bouton text-encre-douce px-4 py-1.5 rounded-lg hover:bg-parchemin-fonce disabled:opacity-40 transition-colors">
                Relancer l&apos;analyse ({choisis.length})
              </button>
              {aDepublier.length > 0 && (
                <button onClick={handleDepublier} disabled={enCours} className="border border-attention text-attention px-4 py-1.5 rounded-lg hover:bg-attention-teinte disabled:opacity-40 transition-colors">
                  Dépublier ({aDepublier.length})
                </button>
              )}
              <button onClick={() => { setSelection(new Set()); setBilan(null) }} disabled={enCours} className="text-xs text-muet hover:text-encre-douce underline ml-auto">
                Tout décocher
              </button>
            </div>
          </div>
        )}

        <details className="group bg-surface border border-bordure rounded-xl">
          <summary className="cursor-pointer select-none px-4 py-2.5 font-ui text-sm text-encre-douce hover:text-encre flex items-center gap-2">
            <span className="text-muet-clair transition-transform group-open:rotate-90">›</span>
            Présentation orale — tirage au sort
            {classe.presentations.some(p => p.statut === 'tire') && <span className="font-ui text-[11px] bg-info-teinte text-info px-2 py-0.5 rounded-full">un orateur tiré</span>}
          </summary>
          <div className="px-4 pb-4">
            <TirageAuSort semaineId={semaineId} classeId={classe.id} eligibles={classe.eligibles} presentations={classe.presentations} />
          </div>
        </details>

        <p className="text-xs text-muet-clair px-1">
          {nb.deposes} déposé{nb.deposes > 1 ? 's' : ''}{nb.retard > 0 ? ` dont ${nb.retard} en retard` : ''} · {nb.manquants} manquant{nb.manquants > 1 ? 's' : ''} · {nb.aValider} à valider · {nb.publies} publié{nb.publies > 1 ? 's' : ''}
          {' · '}<Link href={`/prof/fragments-erudition/suivi?classe=${classe.id}`} className="underline hover:text-encre-douce">suivi de la classe →</Link>
        </p>
      </div>

      {/* ── L'élève ouvert ─────────────────────────────────────────────────── */}
      {ouvert && (
        <PanneauRetour
          key={ouvert.id}
          eleve={ouvert}
          classeNom={classe.nom}
          semaineId={semaineId}
          tz={tz}
          position={{ index: indexOuvert, total: parcours.length }}
          onFermer={fermer}
          onPrecedent={precedent ? () => ouvrir(precedent.id) : null}
          onSuivant={suivant ? () => ouvrir(suivant.id) : null}
          onModifie={surModifie}
        />
      )}
    </div>
  )
}
