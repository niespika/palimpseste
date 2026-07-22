'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  marquerVu, marquerVuJusquA, deplacerElement, reordonnerElements,
  ajouterCreneauInstance, retirerCreneauInstance, reinitialiserInstance,
  type RefCreneau,
} from './actions'
import PickerContenu from './parcours/PickerContenu'
import type { CiblesPicker } from './parcours/donnees'
import type { InstanceDeClasse, ElementInstance } from './instance-serveur'

// GRILLE D'INSTANCE (RAG L3, SPEC §5.3) — le pilotage « vu » d'une classe : une
// ligne par semaine (datée via l'aperçu, badge courante), les éléments à grain
// fin avec leur case « vu », les gestes d'ajustement PAR CLASSE (déplacer,
// réordonner, retirer, ajouter un créneau) et le marquage groupé. Rien ici ne
// touche le modèle ni les autres classes. Esthétique provisoire (refonte Design).

export default function GrilleInstance({ instance, cibles }: {
  instance: InstanceDeClasse
  cibles: CiblesPicker
}) {
  const router = useRouter()
  const [chargement, setChargement] = useState<string | null>(null) // id du geste en cours
  const [erreur, setErreur] = useState<string | null>(null)
  const [pickerSemaine, setPickerSemaine] = useState<number | null>(null)

  const retourClasse = `/prof/scriptorium?vue=classes&classe=${instance.classeId}`

  async function lancer(cle: string, fn: () => Promise<{ error?: string }>) {
    setErreur(null)
    setChargement(cle)
    const res = await fn()
    setChargement(null)
    if (res.error) { setErreur(res.error); return }
    router.refresh()
  }

  function basculerVu(el: ElementInstance) {
    void lancer(`vu-${el.id}`, () => marquerVu(el.id, el.vuAt == null))
  }

  function vuJusquA(semaine: number) {
    if (!confirm(`Marquer « vus » tous les éléments non vus jusqu'à la semaine ${semaine} incluse ?`)) return
    void lancer(`jusqua-${semaine}`, async () => {
      const res = await marquerVuJusquA(instance.pcId, semaine)
      return { error: res.error }
    })
  }

  function deplacer(el: ElementInstance, nouvelleSemaine: number) {
    void lancer(`depl-${el.id}`, () => deplacerElement(el.id, nouvelleSemaine))
  }

  // Réordonne au sein de la FRATRIE (même créneau, même semaine réelle) — l'ordre
  // est unique par (créneau, semaine), on ne permute donc qu'entre frères.
  function monterDescendre(el: ElementInstance, freres: ElementInstance[], dir: -1 | 1) {
    const idx = freres.findIndex(f => f.id === el.id)
    const cible = idx + dir
    if (idx < 0 || cible < 0 || cible >= freres.length) return
    const ids = freres.map(f => f.id)
    ;[ids[idx], ids[cible]] = [ids[cible], ids[idx]]
    void lancer(`ord-${el.id}`, () => reordonnerElements(el.creneauId, el.semaineReelle, ids))
  }

  function retirerCreneau(el: ElementInstance) {
    const ok = confirm(
      `Retirer « ${el.creneauTitre} » de l'instance de ${instance.classeNom} ? ` +
      `Tous ses éléments (et leurs « vus ») disparaissent pour cette classe — le modèle et les autres classes ne changent pas.`,
    )
    if (!ok) return
    void lancer(`ret-${el.creneauId}`, () => retirerCreneauInstance(el.creneauId))
  }

  function reinitialiser() {
    if (!confirm(
      `Ré-initialiser l'instance depuis le modèle ? Les ajustements de cette classe ` +
      `(créneaux ajoutés ou retirés, éléments déplacés) ET tous les « vus » seront PERDUS.`,
    )) return
    if (!confirm(
      `Dernière confirmation — re-matérialiser « ${instance.parcoursTitre} » pour ${instance.classeNom} depuis le modèle. Irréversible.`,
    )) return
    void lancer('reinit', async () => {
      const res = await reinitialiserInstance(instance.pcId)
      return { error: res.error }
    })
  }

  const ajouterRef = (semaine: number) => async (ref: RefCreneau): Promise<{ error?: string }> => {
    const res = await ajouterCreneauInstance(instance.pcId, semaine, ref)
    return { error: res.error }
  }

  const badgeClasse = (b: ElementInstance['badge']) =>
    b === 'Texte' ? 'bg-ok-teinte text-ok'
      : b === 'Livre' ? 'bg-info-teinte text-info'
        : 'bg-parchemin-fonce text-encre-douce'
  const badgeLabel = (b: ElementInstance['badge']) =>
    b === 'Section' ? '§' : b === 'Livre' ? '📖' : b

  return (
    <div className="space-y-4" data-module="scriptorium">
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <Link href={retourClasse} className="text-sm text-muet hover:text-encre">← {instance.classeNom}</Link>
          <h2 className="font-titre text-lg text-encre leading-tight">
            Parcours de la classe — {instance.parcoursTitre}
          </h2>
          <p className="font-ui text-xs text-muet">
            Le « vu » pilote ce que l’espace élève pourra approfondir. Ces réglages ne valent que pour {instance.classeNom}.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 font-ui text-xs">
          {instance.semaineCourante != null && instance.semaineCourante > 0 && (
            <span className="text-muet">semaine courante : <b className="text-encre-douce">{instance.semaineCourante}</b>/{instance.nbSemaines}</span>
          )}
          {instance.nonVusPasses > 0 && (
            <span className="bg-attention-teinte text-attention px-2 py-0.5 rounded">
              {instance.nonVusPasses} élément{instance.nonVusPasses > 1 ? 's' : ''} passé{instance.nonVusPasses > 1 ? 's' : ''} non vu{instance.nonVusPasses > 1 ? 's' : ''}
            </span>
          )}
          <Link href={`/prof/scriptorium?vue=parcours&parcours=${instance.parcoursId}`} className="text-muet hover:text-encre">
            Modèle (tous groupes) →
          </Link>
          <button
            onClick={reinitialiser}
            disabled={chargement != null}
            className="text-muet hover:text-retard disabled:opacity-50"
            title="Re-matérialiser l'instance depuis le modèle (destructif, double confirmation)"
          >
            Réinitialiser depuis le modèle
          </button>
        </div>
      </div>

      {!instance.datee && (
        <div className="flex items-center gap-2 rounded-lg bg-attention-teinte border border-attention/30 px-3 py-2">
          <span className="text-attention">⚠</span>
          <span className="font-corps text-sm text-attention">
            Instance non datée (ni date de début ni horaire publié) : impossible de résoudre la semaine courante — elle sera <b>exclue du RAG</b>. Pose une date dans l’onglet Parcours.
          </span>
        </div>
      )}

      {erreur && <p className="text-retard text-sm">⚠ {erreur}</p>}

      {/* ── Semaines ────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        {instance.semaines.map(sem => {
          const enCoursSem = instance.semaineCourante != null && sem.semaine <= instance.semaineCourante
          return (
            <div
              key={sem.semaine}
              className={`rounded-lg border ${sem.courante ? 'border-pigment/60 bg-pigment-teinte/20' : 'border-bordure bg-surface'}`}
            >
              <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
                <span className="font-ui text-sm font-medium text-encre">Semaine {sem.semaine}</span>
                {sem.libelle && <span className="font-ui text-xs text-muet">— {sem.libelle}</span>}
                {sem.courante && (
                  <span className="font-ui text-[10px] uppercase tracking-wide bg-pigment text-surface px-1.5 py-0.5 rounded">courante</span>
                )}
                <span className="flex-1" />
                {sem.elements.some(e => e.vuAt == null) && enCoursSem && (
                  <button
                    onClick={() => vuJusquA(sem.semaine)}
                    disabled={chargement != null}
                    className="font-ui text-xs text-encre-douce hover:text-encre disabled:opacity-50"
                    title={`Marquer vus tous les éléments jusqu'à la semaine ${sem.semaine} incluse`}
                  >
                    ✓ vu jusqu’ici
                  </button>
                )}
                <button
                  onClick={() => setPickerSemaine(pickerSemaine === sem.semaine ? null : sem.semaine)}
                  className="font-ui text-xs text-encre-douce hover:text-encre"
                >
                  {pickerSemaine === sem.semaine ? 'Fermer' : '+ Ajouter'}
                </button>
              </div>

              {pickerSemaine === sem.semaine && (
                <div className="px-3 pb-3">
                  <PickerContenu
                    parcoursId={instance.parcoursId}
                    semaine={sem.semaine}
                    cibles={cibles}
                    onClose={() => setPickerSemaine(null)}
                    onAjouter={ajouterRef(sem.semaine)}
                  />
                </div>
              )}

              {sem.elements.length > 0 && (
                <ul className="px-3 pb-2 space-y-1">
                  {sem.elements.map(el => {
                    const freres = sem.elements.filter(f => f.creneauId === el.creneauId && f.semaineReelle === el.semaineReelle)
                    const idxFrere = freres.findIndex(f => f.id === el.id)
                    const enCours = enCoursSem && el.vuAt == null
                    const occupe = chargement != null
                    return (
                      <li key={el.id} className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-parchemin-fonce/60">
                        <input
                          type="checkbox"
                          checked={el.vuAt != null}
                          onChange={() => basculerVu(el)}
                          disabled={occupe}
                          aria-label={`Marquer « ${el.titre} » comme vu`}
                          className="w-4 h-4 accent-pigment flex-shrink-0 cursor-pointer disabled:opacity-50"
                        />
                        <span className={`font-ui text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${badgeClasse(el.badge)}`}>
                          {badgeLabel(el.badge)}
                        </span>
                        <span className={`font-corps text-sm min-w-0 truncate ${el.vuAt != null ? 'text-encre' : 'text-encre-douce'}`}>
                          {el.titre}
                        </span>
                        {enCours && (
                          <span className="font-ui text-[10px] bg-attention-teinte text-attention px-1.5 py-0.5 rounded flex-shrink-0">en cours</span>
                        )}
                        {el.aRevoir && (
                          <span className="font-ui text-[10px] bg-retard-teinte text-retard px-1.5 py-0.5 rounded flex-shrink-0">à revoir</span>
                        )}
                        <span className="flex-1" />
                        {freres.length > 1 && (
                          <span className="flex gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => monterDescendre(el, freres, -1)}
                              disabled={occupe || idxFrere <= 0}
                              className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-0.5"
                              aria-label="Monter"
                            >↑</button>
                            <button
                              onClick={() => monterDescendre(el, freres, 1)}
                              disabled={occupe || idxFrere >= freres.length - 1}
                              className="font-ui text-xs text-muet hover:text-encre disabled:opacity-30 px-0.5"
                              aria-label="Descendre"
                            >↓</button>
                          </span>
                        )}
                        <select
                          value={el.semaineReelle}
                          onChange={e => deplacer(el, Number(e.target.value))}
                          disabled={occupe}
                          aria-label="Déplacer vers la semaine"
                          className="font-ui text-xs border border-bordure rounded px-1 py-0.5 bg-surface text-encre-douce flex-shrink-0 disabled:opacity-50"
                        >
                          {Array.from({ length: instance.nbSemaines }, (_, i) => i + 1).map(k => (
                            <option key={k} value={k}>sem. {k}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => retirerCreneau(el)}
                          disabled={occupe}
                          className="font-ui text-xs text-muet hover:text-retard disabled:opacity-50 flex-shrink-0"
                          title={`Retirer « ${el.creneauTitre} » (le créneau entier) de l'instance`}
                        >
                          ✕
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
