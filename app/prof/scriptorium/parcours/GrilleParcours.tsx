'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  modifierParcours,
  supprimerParcours,
  ajouterCreneau,
  retirerCreneau,
  reordonnerCreneaux,
  deplacerCreneau,
  type RefCreneau,
} from '../actions'
import PickerContenu from './PickerContenu'
import AssignationClasses from './AssignationClasses'
import type { ParcoursDetail, CreneauResolu, CiblesPicker } from './donnees'
import type { LigneAssignation } from './frise-serveur'

// Badge de type de créneau (aligné sur la charte — jetons uniquement) :
// Texte → ok · Livre → info/bleu Aletheia · Cours/retiré → neutre.
function badgeClasse(c: CreneauResolu): string {
  if (c.etat === 'contenu_retire' || c.etat === 'livre_retire') return 'bg-parchemin-fonce text-muet'
  if (c.etat === 'tranche_a_revoir') return 'bg-attention-teinte text-attention'
  if (c.badge === 'Texte') return 'bg-ok-teinte text-ok'
  if (c.badge === 'Livre') return 'bg-info-teinte text-info'
  return 'bg-parchemin-fonce text-muet'
}

function LigneCreneau({
  c, premier, dernier, nbSemaines, chargement, onMonter, onDescendre, onDeplacer, onRetirer,
}: {
  c: CreneauResolu
  premier: boolean
  dernier: boolean
  nbSemaines: number
  chargement: boolean
  onMonter: () => void
  onDescendre: () => void
  onDeplacer: (ns: number) => void
  onRetirer: () => void
}) {
  const retire = c.etat === 'contenu_retire' || c.etat === 'livre_retire'
  return (
    <div className="flex items-center gap-2.5 border border-bordure rounded-lg bg-white px-3.5 py-2.5">
      <span className="text-puce select-none" title="Réordonner">⠿</span>
      <span className={`font-ui text-[10px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded flex-none ${badgeClasse(c)}`}>{c.badge}</span>
      <span className={`font-corps text-[15px] min-w-0 truncate ${retire ? 'text-muet line-through' : 'text-encre-douce'}`}>
        {c.titre}
        {c.trancheLabel && <span className="text-muet-clair text-[13px]"> · {c.trancheLabel}</span>}
        {c.etat === 'tranche_a_revoir' && <span className="text-attention text-[13px]"> · à revoir</span>}
      </span>
      <div className="ml-auto flex items-center gap-2 flex-none">
        <div className="flex flex-col leading-none">
          <button onClick={onMonter} disabled={premier || chargement} className="text-[10px] text-muet-clair hover:text-encre disabled:opacity-30" title="Monter">▲</button>
          <button onClick={onDescendre} disabled={dernier || chargement} className="text-[10px] text-muet-clair hover:text-encre disabled:opacity-30" title="Descendre">▼</button>
        </div>
        {nbSemaines > 1 && (
          <select
            value={c.semaine}
            onChange={e => onDeplacer(Number(e.target.value))}
            disabled={chargement}
            title="Déplacer vers la semaine"
            className="font-ui text-[12px] border border-bordure-bouton rounded px-1 py-0.5 text-encre-douce disabled:opacity-50"
          >
            {Array.from({ length: nbSemaines }, (_, i) => i + 1).map(n => <option key={n} value={n}>S{n}</option>)}
          </select>
        )}
        <button onClick={onRetirer} disabled={chargement} className="font-ui text-[12px] text-muet hover:text-retard disabled:opacity-50">Retirer</button>
      </div>
    </div>
  )
}

export default function GrilleParcours({
  parcours, cibles, assignations,
}: {
  parcours: ParcoursDetail
  cibles: CiblesPicker
  assignations: LigneAssignation[]
}) {
  const router = useRouter()
  const semaines = Array.from({ length: parcours.nbSemaines }, (_, i) => i + 1)
  const parSemaine = (s: number) => parcours.creneaux.filter(c => c.semaine === s).sort((a, b) => a.ordre - b.ordre)

  // Une seule semaine dépliée à la fois (survol de tout le parcours d'un coup d'œil).
  const premiereNonVide = semaines.find(s => parSemaine(s).length > 0) ?? 1
  const [semaineOuverte, setSemaineOuverte] = useState<number | null>(premiereNonVide)
  const [pickerSemaine, setPickerSemaine] = useState<number | null>(null)
  const [editionEntete, setEditionEntete] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Ce que le geste a fait DANS LES CLASSES (02/09) : le modèle suit ses classes, et
  // l'écran le dit à chaque ajout, retrait ou déplacement — sinon le prof ne saurait
  // pas qu'un retrait ici a aussi retiré le cours de deux classes.
  const [avis, setAvis] = useState<string | null>(null)
  const nbClasses = assignations.filter(a => a.assigned).length
  const classes = (n: number) => `${n} classe${n > 1 ? 's' : ''}`

  function ouvrirSemaine(s: number) {
    setSemaineOuverte(prev => (prev === s ? null : s))
    setPickerSemaine(null)
  }

  async function agir(fn: () => Promise<{ error?: string }>) {
    setErreur(null)
    setChargement(true)
    const res = await fn()
    setChargement(false)
    if (res?.error) { setErreur(res.error); return false }
    router.refresh()
    return true
  }

  async function ajouter(semaine: number, ref: RefCreneau): Promise<{ error?: string }> {
    setAvis(null)
    const res = await ajouterCreneau(parcours.id, semaine, ref)
    if (res.error) return { error: res.error }
    if (res.avis) setAvis(res.avis)
    else if (res.nbClasses) setAvis(`Ajouté au modèle et au parcours de ${classes(res.nbClasses)}.`)
    return {}
  }

  async function retirer(c: CreneauResolu) {
    if (nbClasses > 0 && !confirm(
      `Retirer « ${c.titre} » du modèle ?\n\n` +
      `Il sera aussi retiré des classes qui ne l'ont pas encore vu ; une classe qui l'a déjà vu ` +
      `(au moins un élément coché) le garde.`,
    )) return
    setAvis(null)
    setErreur(null)
    setChargement(true)
    const res = await retirerCreneau(c.id)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    if (nbClasses > 0) {
      setAvis(`Retiré du modèle${res.retireDe ? ` et de ${classes(res.retireDe)}` : ''}` +
        `${res.conserveDans ? ` ; conservé dans ${classes(res.conserveDans)} qui l'${res.conserveDans > 1 ? 'ont' : 'a'} déjà vu` : ''}.`)
    }
    router.refresh()
  }

  async function deplacer(c: CreneauResolu, ns: number) {
    setAvis(null)
    setErreur(null)
    setChargement(true)
    const res = await deplacerCreneau(c.id, ns)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    if (nbClasses > 0) {
      setAvis(`Déplacé en S${ns}${res.suivi ? ` ; ${classes(res.suivi)} ${res.suivi > 1 ? 'ont' : 'a'} suivi` : ''}` +
        `${res.conserve ? ` ; ${classes(res.conserve)} le garde${res.conserve > 1 ? 'nt' : ''} en S${c.semaine} (déjà vu)` : ''}.` +
        `${res.avis ? ` ${res.avis}` : ''}`)
    }
    router.refresh()
  }

  async function monter(semaine: number, id: string) {
    const ids = parSemaine(semaine).map(c => c.id)
    const i = ids.indexOf(id)
    if (i <= 0) return
    ;[ids[i - 1], ids[i]] = [ids[i], ids[i - 1]]
    await agir(() => reordonnerCreneaux(parcours.id, semaine, ids))
  }
  async function descendre(semaine: number, id: string) {
    const ids = parSemaine(semaine).map(c => c.id)
    const i = ids.indexOf(id)
    if (i < 0 || i >= ids.length - 1) return
    ;[ids[i + 1], ids[i]] = [ids[i], ids[i + 1]]
    await agir(() => reordonnerCreneaux(parcours.id, semaine, ids))
  }

  async function handleSupprimerParcours() {
    if (!confirm(`Supprimer le parcours « ${parcours.titre} » ? (son ordonnancement et ses assignations de classe sont perdus)`)) return
    const ok = await agir(() => supprimerParcours(parcours.id))
    if (ok) router.push('/prof/scriptorium?vue=parcours')
  }

  async function handleEnregistrerEntete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const titre = (fd.get('titre') as string) ?? ''
    const nbSemaines = Number(fd.get('nbSemaines'))
    const description = (fd.get('description') as string) ?? ''
    setErreur(null)
    setChargement(true)
    let res = await modifierParcours(parcours.id, { titre, nbSemaines, description })
    if (res.needsConfirm) {
      const ok = confirm(`${res.nbCreneauxAuDela} créneau(x) au-delà de la semaine ${nbSemaines} seront supprimés. Continuer ?`)
      if (!ok) { setChargement(false); return }
      res = await modifierParcours(parcours.id, { titre, nbSemaines, description }, true)
    }
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setEditionEntete(false)
    router.refresh()
  }

  return (
    <div>
      {/* Barre de contenu : retour (les retours vivent dans le contenu, pas l'en-tête). */}
      <Link href="/prof/scriptorium?vue=parcours" className="inline-block font-ui text-[13px] text-muet hover:text-encre mb-3">
        ← Tous les parcours
      </Link>

      {/* Desktop (≥ ~1024px) : sous cette largeur, défilement horizontal (filet mobile). */}
      <div className="overflow-x-auto">
      <div className="flex border border-bordure rounded-xl overflow-hidden min-w-[860px]">
        {/* ── Gauche : builder (parchemin chaud) ─────────────────────────────── */}
        <div className="flex-1 min-w-0 bg-parchemin p-5">
          {editionEntete ? (
            <form onSubmit={handleEnregistrerEntete} className="bg-surface border border-bordure rounded-xl p-4 space-y-3 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input name="titre" defaultValue={parcours.titre} required placeholder="Titre"
                  className="sm:col-span-2 px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
                <input name="nbSemaines" type="number" min={1} max={52} defaultValue={parcours.nbSemaines} required placeholder="Semaines"
                  className="px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
              </div>
              <textarea name="description" defaultValue={parcours.description ?? ''} rows={2} placeholder="Description (optionnel)"
                className="w-full px-3 py-2 border border-bordure rounded-lg text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment resize-y" />
              {erreur && <p className="text-retard text-sm">{erreur}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={chargement} className="bg-bouton-parcours text-bouton-parcours-texte px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">{chargement ? '…' : 'Enregistrer'}</button>
                <button type="button" onClick={() => setEditionEntete(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Annuler</button>
              </div>
            </form>
          ) : (
            <div className="flex items-baseline gap-3 mb-4">
              <h1 className="font-titre text-[27px] font-semibold text-encre">{parcours.titre}</h1>
              <span className="font-corps italic text-[15px] text-muet min-w-0 truncate">
                {parcours.nbSemaines} semaine{parcours.nbSemaines > 1 ? 's' : ''}
                {parcours.description ? ` · ${parcours.description}` : ''}
              </span>
              <span className="ml-auto flex items-center gap-3.5 font-ui text-[13px] flex-none">
                <button onClick={() => setEditionEntete(true)} className="text-muet hover:text-encre">Modifier</button>
                <button onClick={handleSupprimerParcours} disabled={chargement} className="text-muet hover:text-retard disabled:opacity-50">Supprimer</button>
                <button onClick={() => { setSemaineOuverte(null); setPickerSemaine(null) }} className="text-pigment hover:opacity-80">⊟ Tout replier</button>
              </span>
            </div>
          )}

          {!editionEntete && nbClasses > 0 && (
            <p className="font-ui text-[12px] text-muet mb-3">
              Ce modèle sert {classes(nbClasses)} : ce que tu ajoutes, retires ou déplaces ici
              {nbClasses > 1 ? ' les suit' : ' la suit'}, sauf ce qu’{nbClasses > 1 ? 'une classe' : 'elle'} a déjà vu.
            </p>
          )}
          {erreur && !editionEntete && <p className="text-retard text-sm mb-3">{erreur}</p>}
          {avis && !editionEntete && <p className="text-ok text-sm mb-3">✓ {avis}</p>}

          <div className="flex flex-col gap-2.5">
            {semaines.map(s => {
              const cs = parSemaine(s)
              const resume = cs.map(c => c.titre).join(' · ')
              const ouverte = semaineOuverte === s

              if (!ouverte) {
                return (
                  <button
                    key={s}
                    onClick={() => ouvrirSemaine(s)}
                    aria-expanded={false}
                    className="flex items-center gap-3 border border-bordure rounded-xl bg-surface px-4 py-3 text-left hover:border-pigment transition-colors"
                  >
                    <span className="text-muet-clair" aria-hidden>▸</span>
                    <span className="font-ui text-[12px] font-semibold text-muet-clair w-6 flex-none">S{s}</span>
                    {cs.length > 0 ? (
                      <span className="font-corps text-[15px] text-encre-douce flex-1 min-w-0 truncate">{resume}</span>
                    ) : (
                      <span className="font-corps italic text-[15px] text-muet-clair flex-1">vide — glisser un texte, un cours ou un livre</span>
                    )}
                    <span className="font-ui text-[12px] text-muet flex-none">{cs.length} contenu{cs.length > 1 ? 's' : ''}</span>
                  </button>
                )
              }

              return (
                <div key={s} className="border-[1.5px] border-pigment rounded-xl bg-surface overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-bordure">
                    <button onClick={() => setSemaineOuverte(null)} aria-expanded={true} aria-label={`Replier la semaine ${s}`} className="text-pigment">▾</button>
                    <span className="font-ui text-[12px] font-semibold text-muet w-6 flex-none">S{s}</span>
                    <span className="font-corps text-[15px] font-semibold text-encre flex-1 min-w-0 truncate">
                      {cs.length > 0 ? resume : `Semaine ${s}`}
                    </span>
                    <button
                      onClick={() => setPickerSemaine(pickerSemaine === s ? null : s)}
                      className="font-ui text-[13px] font-semibold text-pigment hover:opacity-80 flex-none"
                    >
                      {pickerSemaine === s ? 'Fermer' : '＋ Ajouter un contenu'}
                    </button>
                  </div>
                  <div className="px-4 py-3 flex flex-col gap-2.5">
                    {cs.length === 0 && pickerSemaine !== s && (
                      <p className="font-corps italic text-[14px] text-muet-clair px-1">Aucun contenu — ＋ Ajouter un contenu.</p>
                    )}
                    {cs.map((c, i) => (
                      <LigneCreneau
                        key={c.id}
                        c={c}
                        premier={i === 0}
                        dernier={i === cs.length - 1}
                        nbSemaines={parcours.nbSemaines}
                        chargement={chargement}
                        onMonter={() => monter(s, c.id)}
                        onDescendre={() => descendre(s, c.id)}
                        onDeplacer={(ns) => { void deplacer(c, ns) }}
                        onRetirer={() => { void retirer(c) }}
                      />
                    ))}
                    {pickerSemaine === s && (
                      <PickerContenu
                        parcoursId={parcours.id}
                        semaine={s}
                        cibles={cibles}
                        onClose={() => setPickerSemaine(null)}
                        onAjouter={ref => ajouter(s, ref)}
                      />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Droite : assignation par classe (surface claire) ────────────────── */}
        <div className="w-[330px] flex-none bg-surface border-l border-bordure p-5">
          <AssignationClasses parcoursId={parcours.id} lignes={assignations} />
        </div>
      </div>
      </div>
    </div>
  )
}
