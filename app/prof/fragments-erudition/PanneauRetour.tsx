'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VisionneusModal from './VisionneusModal'
import {
  chargerRetourDepot,
  sauvegarderAnalyse,
  publierAnalyse,
  depublierAnalyse,
  relancerAnalyse,
} from './actions'
import { LETTRES_SECTIONS } from '@/utils/notation'
import { LABEL_SIGNAL } from '@/utils/detecteur-integrite'
import { formatInstant } from '@/utils/fuseau'
import type { EleveAvecDepot, RetourDepotComplet } from '@/types/fragments'

// ----------------------------------------------------------------------------
// Vestigia · onglet Semaine — LE RETOUR, LU ET VALIDÉ SUR PLACE.
// Le panneau charge le retour complet à l'ouverture (une action serveur), montre
// les photos, les trois notes, les textes du retour en volets, et publie d'ici.
// L'écran `analyse/[depotId]` reste l'atelier « en grand » (zoom sur la copie,
// pistes) ; ce panneau est le geste courant : lire, retoucher, publier, suivant.
// Sur téléphone il monte en feuille depuis le bas ; sur grand écran il tient la
// colonne de droite, collé au haut de la fenêtre.
// ----------------------------------------------------------------------------

interface Props {
  eleve: EleveAvecDepot
  classeNom: string
  semaineId: string
  tz: string
  position: { index: number; total: number }
  onFermer: () => void
  onPrecedent: (() => void) | null
  onSuivant: (() => void) | null
  /** Le parent est prévenu d'une saisie non enregistrée : il ne ferme pas sans demander. */
  onModifie: (modifie: boolean) => void
}

type Volet = 'commentaire_general' | 'retour_langue' | 'retour_style' | 'retour_contenu' | 'retour_progres' | 'notes_prof' | 'transcription'

const VOLETS: { cle: Volet; label: string; optionnel?: boolean }[] = [
  { cle: 'commentaire_general', label: 'Commentaire' },
  { cle: 'retour_langue', label: 'Langue' },
  { cle: 'retour_style', label: 'Style' },
  { cle: 'retour_contenu', label: 'Contenu' },
  { cle: 'retour_progres', label: 'Progrès', optionnel: true },
  { cle: 'notes_prof', label: 'Note perso', optionnel: true },
  { cle: 'transcription', label: 'Transcription' },
]

const STATUT: Record<string, { label: string; classes: string }> = {
  en_cours: { label: 'analyse en cours…', classes: 'bg-info-teinte text-info' },
  generee: { label: 'à valider', classes: 'bg-attention-teinte text-attention' },
  erreur: { label: 'erreur', classes: 'bg-retard-teinte text-retard' },
  publiee: { label: 'publiée ✓', classes: 'bg-ok-teinte text-ok' },
}

type Champs = Record<Volet, string> & { note_decouvertes: number; note_sources: number; note_reflexions: number }

function champsDepuis(a: RetourDepotComplet['analyse']): Champs {
  return {
    note_decouvertes: a?.note_decouvertes ?? 0,
    note_sources: a?.note_sources ?? 0,
    note_reflexions: a?.note_reflexions ?? 0,
    commentaire_general: a?.commentaire_general ?? '',
    retour_langue: a?.retour_langue ?? '',
    retour_style: a?.retour_style ?? '',
    retour_contenu: a?.retour_contenu ?? '',
    retour_progres: a?.retour_progres ?? '',
    notes_prof: a?.notes_prof ?? '',
    transcription: a?.transcription ?? '',
  }
}

export default function PanneauRetour({ eleve, classeNom, semaineId, tz, position, onFermer, onPrecedent, onSuivant, onModifie }: Props) {
  const router = useRouter()
  const depotId = eleve.depot?.id ?? null
  const [retour, setRetour] = useState<RetourDepotComplet | null>(null)
  const [erreurChargement, setErreurChargement] = useState<string | null>(null)
  const [champs, setChamps] = useState<Champs | null>(null)
  const [modifie, setModifie] = useState(false)
  const [volet, setVolet] = useState<Volet>('commentaire_general')
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)
  const [visionneuse, setVisionneuse] = useState(false)
  const panneau = useRef<HTMLDivElement>(null)

  // `modifie` vit aussi dans une ref : un rechargement (après publication, ou
  // pendant l'analyse) ne doit pas écraser ce que le professeur est en train de
  // taper — et ne doit pas non plus se redéclencher à chaque frappe.
  const modifieRef = useRef(false)
  useEffect(() => { modifieRef.current = modifie; onModifie(modifie) }, [modifie, onModifie])
  // Un dépôt sans analyse dont on vient de LANCER l'analyse : la ligne n'existe
  // pas encore, donc pas de statut `en_cours` à guetter — on guette quand même.
  const [attenteAnalyse, setAttenteAnalyse] = useState(false)

  // Une action serveur peut RENDRE une erreur ou LEVER (session expirée, réseau) :
  // les deux finissent dans `erreurChargement`, jamais dans un squelette éternel.
  const charger = useCallback(async (initial: boolean) => {
    if (!depotId) return
    try {
      const { data, error } = await chargerRetourDepot(depotId)
      if (error || !data) { setErreurChargement(error ?? 'Chargement impossible.'); return }
      setErreurChargement(null)
      setRetour(data)
      if (data.analyse && data.analyse.statut !== 'en_cours') setAttenteAnalyse(false)
      if (initial || !modifieRef.current) setChamps(champsDepuis(data.analyse))
    } catch (e) {
      setErreurChargement(e instanceof Error ? e.message : 'Chargement impossible.')
    }
  }, [depotId])

  useEffect(() => {
    let vivant = true
    if (!depotId) return
    chargerRetourDepot(depotId).then(({ data, error }) => {
      if (!vivant) return
      if (error || !data) { setErreurChargement(error ?? 'Chargement impossible.'); return }
      setRetour(data)
      setChamps(champsDepuis(data.analyse))
    }).catch((e: unknown) => {
      if (vivant) setErreurChargement(e instanceof Error ? e.message : 'Chargement impossible.')
    })
    return () => { vivant = false }
  }, [depotId])

  // L'analyse se refait en arrière-plan : on la guette sans recharger l'écran.
  useEffect(() => {
    if (retour?.analyse?.statut !== 'en_cours' && !attenteAnalyse) return
    const t = setInterval(() => { charger(false) }, 5000)
    return () => clearInterval(t)
  }, [retour?.analyse?.statut, attenteAnalyse, charger])

  // La liste a bougé sans nous (publication par lot, autre onglet) : on se réaligne,
  // sans écraser une saisie en cours.
  const statutListe = eleve.analyse?.statut ?? null
  const statutListeVu = useRef(statutListe)
  useEffect(() => {
    if (statutListeVu.current === statutListe) return
    statutListeVu.current = statutListe
    if (retour) queueMicrotask(() => { charger(false) })
  }, [statutListe, retour, charger])

  // Le panneau prend le focus à l'ouverture (feuille sur téléphone, colonne sur
  // grand écran) : Échap et ‹ › répondent tout de suite au clavier.
  useEffect(() => { panneau.current?.focus({ preventScroll: true }) }, [eleve.id])

  // À l'ouverture d'un autre élève, le panneau remonte en haut.
  useEffect(() => { panneau.current?.scrollTo({ top: 0 }) }, [eleve.id])

  // Sur grand écran, le panneau tient DANS la fenêtre sans faire défiler la
  // page : sa hauteur maximale se mesure depuis sa position (sous la frise et
  // le titre de la semaine), et son pied — Publier — reste visible d'emblée.
  const [hauteurMax, setHauteurMax] = useState<string | undefined>(undefined)
  useLayoutEffect(() => {
    function mesurer() {
      const el = panneau.current
      if (!el || window.innerWidth < 1024) { setHauteurMax(undefined); return }
      const haut = el.getBoundingClientRect().top + window.scrollY
      setHauteurMax(`calc(100vh - ${Math.max(16, Math.min(haut, 480))}px - 16px)`)
    }
    mesurer()
    window.addEventListener('resize', mesurer)
    return () => window.removeEventListener('resize', mesurer)
  }, [])

  function poser<K extends keyof Champs>(cle: K, valeur: Champs[K]) {
    setChamps(c => (c ? { ...c, [cle]: valeur } : c))
    setModifie(true)
    setMessage(null)
  }

  async function sauvegarder(): Promise<boolean> {
    if (!retour?.analyse || !champs) return false
    const res = await sauvegarderAnalyse(retour.analyse.id, champs)
    if (res.error) { setMessage({ type: 'err', texte: res.error }); return false }
    setModifie(false)
    return true
  }

  // Enveloppe commune des gestes : rien ne reste grisé sur « … » si l'action lève.
  async function geste(action: () => Promise<void>) {
    setEnregistrement(true)
    try {
      await action()
    } catch (e) {
      setMessage({ type: 'err', texte: e instanceof Error ? e.message : "L'action a échoué." })
    } finally {
      setEnregistrement(false)
    }
  }

  const handleEnregistrer = () => geste(async () => {
    if (await sauvegarder()) {
      setMessage({ type: 'ok', texte: 'Modifications enregistrées.' })
      await charger(false)
      router.refresh()
    }
  })

  const handlePublier = () => geste(async () => {
    if (!retour?.analyse) return
    if (modifie && !(await sauvegarder())) return
    const res = await publierAnalyse(retour.analyse.id)
    if (res.error) { setMessage({ type: 'err', texte: res.error }); return }
    setMessage({ type: 'ok', texte: 'Retour publié — l’élève y a accès.' })
    await charger(false)
    router.refresh()
  })

  const handleDepublier = () => geste(async () => {
    if (!retour?.analyse) return
    const res = await depublierAnalyse(retour.analyse.id)
    if (res.error) { setMessage({ type: 'err', texte: res.error }); return }
    setMessage({ type: 'ok', texte: 'Retour dépublié — repassé « à valider ».' })
    await charger(false)
    router.refresh()
  })

  const handleRelancer = () => geste(async () => {
    if (!depotId) return
    setMessage(null)
    const res = await relancerAnalyse(depotId, eleve.id)
    if (res.error) { setMessage({ type: 'err', texte: res.error }); return }
    setMessage({ type: 'ok', texte: 'Analyse relancée — le panneau se mettra à jour tout seul.' })
    setModifie(false)
    setAttenteAnalyse(true)
    await charger(true)
    router.refresh()
  })

  const analyse = retour?.analyse ?? null
  const statut = analyse ? STATUT[analyse.statut] : null
  const editable = !!analyse && (analyse.statut === 'generee' || analyse.statut === 'publiee') && !!champs
  const photos = retour?.depot.photos ?? eleve.depot?.photos ?? []

  return (
    <>
      {/* Voile — téléphone seulement : le panneau y est une feuille. */}
      <div className="fixed inset-0 z-30 bg-encre/30 lg:hidden" onClick={onFermer} aria-hidden />
      <aside
        ref={panneau}
        role="dialog"
        aria-label={`Retour de ${eleve.display_name}`}
        tabIndex={-1}
        style={hauteurMax ? { maxHeight: hauteurMax } : undefined}
        className="fixed inset-x-0 bottom-0 top-[10vh] z-40 rounded-t-2xl shadow-2xl overflow-y-auto overscroll-contain
                   lg:static lg:inset-auto lg:z-auto lg:rounded-xl lg:shadow-none lg:sticky lg:top-4
                   bg-surface border border-bordure border-l-4 border-l-liseret flex flex-col focus:outline-none"
      >
        <div className="px-4 pt-3 pb-2 sm:px-5 flex items-start gap-3 sticky top-0 bg-surface/95 backdrop-blur-sm z-10 border-b border-bordure">
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 top-1.5 w-9 h-1 rounded-full bg-puce" aria-hidden />
          <div className="flex-1 min-w-0 pt-1 lg:pt-0">
            <h3 className="font-titre text-[22px] font-semibold text-encre leading-tight truncate">
              {eleve.display_name}
            </h3>
            <p className="text-xs text-muet font-ui mt-0.5">
              {classeNom}
              {eleve.depot && <> · déposé le {formatInstant(eleve.depot.created_at, tz, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</>}
              {eleve.depot?.statut === 'en_retard' && <span className="text-attention"> · en retard</span>}
              {position.total > 1 && <span className="text-muet-clair"> · {position.index + 1}/{position.total}</span>}
            </p>
          </div>
          {statut && <span className={`font-ui text-[11px] px-2 py-0.5 rounded-full mt-1 whitespace-nowrap ${statut.classes}`}>{statut.label}</span>}
          <div className="flex gap-1 font-ui text-sm">
            <button onClick={onPrecedent ?? undefined} disabled={!onPrecedent} title="Élève précédent (←)" className="w-7 h-7 rounded-lg border border-bordure-bouton text-encre-douce hover:bg-parchemin-fonce disabled:opacity-30">‹</button>
            <button onClick={onSuivant ?? undefined} disabled={!onSuivant} title="Élève suivant (→)" className="w-7 h-7 rounded-lg border border-bordure-bouton text-encre-douce hover:bg-parchemin-fonce disabled:opacity-30">›</button>
            <button onClick={onFermer} title="Fermer (Échap)" className="w-7 h-7 rounded-lg border border-bordure-bouton text-muet hover:text-encre hover:bg-parchemin-fonce">✕</button>
          </div>
        </div>

        <div className="px-4 py-3 sm:px-5 flex-1 flex flex-col gap-3">
          {!eleve.depot ? (
            <div className="rounded-xl bg-parchemin-fonce/60 border border-dashed border-puce p-6 text-center text-sm text-muet">
              Pas de dépôt cette semaine.
              <div className="mt-2"><Link href={`/prof/fragments-erudition/eleve/${eleve.id}`} className="font-ui text-xs underline hover:text-encre-douce">Voir la fiche de l’élève →</Link></div>
            </div>
          ) : erreurChargement ? (
            <div className="rounded-xl bg-retard-teinte border border-retard p-4 text-sm text-retard">{erreurChargement}</div>
          ) : !retour ? (
            <div className="space-y-3 animate-pulse" role="status" aria-live="polite" aria-label="Chargement du retour">
              <div className="h-24 rounded-xl bg-parchemin-fonce" />
              <div className="h-8 w-2/3 rounded bg-parchemin-fonce" />
              <div className="h-40 rounded-xl bg-parchemin-fonce" />
            </div>
          ) : (
            <>
              {(retour.signaux.length > 0 || retour.depot.photos_suspectes) && (
                <div className="rounded-lg bg-attention-teinte border border-attention text-attention px-3 py-2 text-xs font-ui space-y-0.5">
                  <p className="font-medium">⚑ À vérifier avant de publier (indicatif, non probant)</p>
                  {retour.signaux.map((s, i) => <p key={i}>{LABEL_SIGNAL[s.type]}{s.motif ? ` — ${s.motif}` : ''}</p>)}
                  {retour.depot.photos_suspectes && <p>Au moins une photo semble venir de la galerie (EXIF ancien).</p>}
                </div>
              )}

              {/* Photos + notes + fil du semestre, sur une même bande */}
              <div className="flex gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex gap-1.5 flex-shrink-0">
                  {photos.map((p, i) => (
                    <button key={p.id} onClick={() => setVisionneuse(true)} className="w-[68px] h-[90px] rounded-md overflow-hidden border border-bordure-bouton bg-parchemin-fonce hover:border-pigment transition-colors" title="Voir en grand">
                      {retour.urls[p.storage_path]
                        ? <img src={retour.urls[p.storage_path]} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        : <span className="text-[10px] text-muet">…</span>}
                    </button>
                  ))}
                </div>
                <div className="flex-1 min-w-[200px] grid grid-rows-3 gap-1 content-center">
                  {([['note_decouvertes', 'Découvertes'], ['note_sources', 'Sources'], ['note_reflexions', 'Réflexions']] as const).map(([cle, label]) => (
                    <div key={cle} className="flex items-center gap-2">
                      <span className="w-[84px] text-[13px] text-encre-douce">{label}</span>
                      <div className="flex gap-1 font-ui text-xs">
                        {[0, 1, 2, 3, 4].map(n => (
                          <button
                            key={n}
                            type="button"
                            disabled={!editable}
                            onClick={() => poser(cle, n)}
                            className={`w-7 h-6 rounded-md transition-colors disabled:opacity-40 ${
                              champs?.[cle] === n ? 'bg-bouton text-bouton-texte' : 'bg-parchemin-fonce text-muet hover:bg-bordure'
                            }`}
                          >
                            {LETTRES_SECTIONS[n]}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {retour.fil.length > 0 && (
                  <div className="hidden sm:flex flex-col gap-1 w-[150px] flex-shrink-0">
                    <span className="font-ui text-[10px] uppercase tracking-wider text-muet-clair">Semestre</span>
                    <div className="flex-1 min-h-[52px] flex items-end gap-[3px] border-b border-bordure-bouton">
                      {retour.fil.map(f => (
                        <span
                          key={f.numero}
                          title={`Semaine ${f.numero}${f.moyenne !== null ? ` · ${LETTRES_SECTIONS[Math.round(f.moyenne)]}` : ''}`}
                          className={`flex-1 rounded-t-sm ${f.courante ? 'bg-pigment' : f.moyenne !== null ? 'bg-pigment/45' : 'border-t border-dashed border-puce'}`}
                          style={{ height: f.moyenne !== null ? `${18 + (f.moyenne / 4) * 82}%` : 0 }}
                        />
                      ))}
                    </div>
                    <span className="font-ui text-[10px] text-muet-clair">une barre par retour publié</span>
                  </div>
                )}
              </div>

              {retour.depot.commentaire_eleve && (
                <p className="text-sm text-encre-douce italic border-l-2 border-puce pl-3">« {retour.depot.commentaire_eleve} »</p>
              )}

              {!analyse && (
                <div className="rounded-xl bg-parchemin-fonce/60 border border-dashed border-puce p-5 text-center text-sm text-muet">
                  Aucune analyse pour ce dépôt.
                  <div className="mt-2"><button onClick={handleRelancer} disabled={enregistrement} className="font-ui text-xs bg-bouton text-bouton-texte px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">Lancer l’analyse</button></div>
                </div>
              )}
              {analyse?.statut === 'en_cours' && (
                <div className="rounded-xl bg-info-teinte border border-info p-4 text-center text-sm text-info">L’analyse est en cours… le panneau se met à jour tout seul.</div>
              )}
              {analyse?.statut === 'erreur' && (
                <div className="rounded-xl bg-retard-teinte border border-retard p-4 text-sm text-retard flex items-center justify-between gap-3">
                  <span>L’analyse a échoué.</span>
                  <button onClick={handleRelancer} disabled={enregistrement} className="font-ui text-xs bg-retard text-surface px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50">Relancer</button>
                </div>
              )}

              {editable && champs && (
                <>
                  <div className="flex gap-0.5 font-ui text-[13px] border-b border-bordure overflow-x-auto">
                    {VOLETS.map(v => {
                      const vide = !champs[v.cle].trim()
                      return (
                        <button
                          key={v.cle}
                          onClick={() => setVolet(v.cle)}
                          className={`px-2.5 py-1.5 whitespace-nowrap border-b-2 -mb-px transition-colors ${
                            volet === v.cle ? 'border-pigment text-encre font-medium' : 'border-transparent text-encre-douce hover:text-encre'
                          } ${vide && volet !== v.cle ? 'text-muet-clair' : ''}`}
                        >
                          {v.label}
                        </button>
                      )
                    })}
                  </div>
                  <textarea
                    key={volet}
                    value={champs[volet]}
                    onChange={e => poser(volet, e.target.value)}
                    rows={volet === 'transcription' ? 14 : 8}
                    placeholder={VOLETS.find(v => v.cle === volet)?.optionnel ? 'Optionnel' : ''}
                    className={`w-full px-3 py-2.5 border border-bordure-bouton rounded-xl text-[14px] leading-relaxed text-encre bg-white focus:outline-none focus:ring-2 focus:ring-pigment resize-y ${volet === 'transcription' ? 'font-mono text-xs' : ''}`}
                  />
                  {retour.pistes.length > 0 && (
                    <div className="text-[13px] text-encre-douce">
                      <span className="font-ui text-[10px] uppercase tracking-wider text-muet-clair">Pistes · {retour.pistes.length}</span>
                      <ul className="mt-0.5 space-y-0.5">
                        {retour.pistes.map(p => (
                          <li key={p.id} className="flex gap-2">
                            <span className="text-puce">◆</span>
                            <span className={p.statut === 'suivie' ? 'line-through text-muet' : ''}>{p.contenu}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

            </>
          )}
        </div>

        {/* Le bilan d'un geste se lit À CÔTÉ du bouton qui l'a produit, pas au fond
            du panneau derrière la liste des pistes. */}
        {message && (
          <div className={`mx-4 sm:mx-5 mb-2 rounded-lg px-3 py-2 text-sm ${message.type === 'ok' ? 'bg-ok-teinte border border-ok text-ok' : 'bg-retard-teinte border border-retard text-retard'}`} role="status">
            {message.texte}
          </div>
        )}

        {eleve.depot && retour && (
          <div className="px-4 py-3 sm:px-5 border-t border-bordure bg-surface sticky bottom-0 flex items-center gap-2 flex-wrap font-ui text-[13px]">
            {editable && (analyse!.statut === 'publiee'
              ? <button onClick={handleDepublier} disabled={enregistrement} className="border border-attention text-attention px-3.5 py-1.5 rounded-lg hover:bg-attention-teinte disabled:opacity-50 transition-colors">Dépublier</button>
              : <button onClick={handlePublier} disabled={enregistrement} className="bg-bouton text-bouton-texte px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors">{enregistrement ? '…' : modifie ? 'Enregistrer et publier ✓' : 'Publier ✓'}</button>
            )}
            {editable && (
              <button onClick={handleEnregistrer} disabled={enregistrement || !modifie} className="border border-bordure-bouton text-encre-douce px-3.5 py-1.5 rounded-lg hover:bg-parchemin-fonce disabled:opacity-40 transition-colors">Enregistrer</button>
            )}
            {analyse && analyse.statut !== 'en_cours' && (
              <button onClick={handleRelancer} disabled={enregistrement} className="text-muet hover:text-encre-douce px-2 py-1.5 disabled:opacity-50">Relancer l’analyse</button>
            )}
            <span className="flex-1" />
            <Link href={`/prof/fragments-erudition/analyse/${eleve.depot.id}?semaine=${semaineId}`} onClick={e => { if (modifie && !window.confirm('Des modifications ne sont pas enregistrées. Quitter quand même ?')) e.preventDefault() }} className="text-xs text-muet hover:text-encre-douce underline underline-offset-2">Ouvrir en grand →</Link>
          </div>
        )}
      </aside>

      {visionneuse && <VisionneusModal nomEleve={eleve.display_name} photos={photos} onFermer={() => setVisionneuse(false)} />}
    </>
  )
}
