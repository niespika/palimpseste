'use client'

import { Fragment, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VisionneusModal from './VisionneusModal'
import { noteVersLettre } from '@/utils/notation'
import { formatInstant } from '@/utils/fuseau'
import { publierAnalysesLot, depublierAnalysesLot, relancerAnalysesLot } from '../../actions'
import { repartirSelection, elevesAValider, toutAValiderEstChoisi, basculerPile } from '@/utils/validation-lot'
import type { EleveAvecDepot, AnalyseResumee } from '@/types/fragments'

interface Props {
  eleves: EleveAvecDepot[]
  semaineId: string
  tz: string
}

function badgeStatutDepot(depot: EleveAvecDepot['depot']) {
  if (!depot) return (
    <span className="text-xs bg-retard-teinte text-retard px-2 py-0.5 rounded-full font-medium">Manquant</span>
  )
  if (depot.statut === 'en_retard') return (
    <span className="text-xs bg-attention-teinte text-attention px-2 py-0.5 rounded-full">En retard</span>
  )
  return (
    <span className="text-xs bg-ok-teinte text-ok px-2 py-0.5 rounded-full">Déposé ✓</span>
  )
}

function badgeAnalyse(analyse: AnalyseResumee | null, depotId: string, semaineId: string) {
  if (!analyse) return <span className="text-xs text-bordure">—</span>

  const classes: Record<string, string> = {
    en_cours: 'bg-info-teinte text-info',
    generee:  'bg-attention-teinte text-attention',
    erreur:   'bg-retard-teinte text-retard',
    publiee:  'bg-ok-teinte text-ok',
  }
  const labels: Record<string, string> = {
    en_cours: 'En cours…',
    generee:  'À valider',
    erreur:   'Erreur',
    publiee:  'Publiée ✓',
  }

  const badge = (
    <span className={`text-xs px-2 py-0.5 rounded-full ${classes[analyse.statut] ?? ''}`}>
      {labels[analyse.statut] ?? analyse.statut}
    </span>
  )

  if (analyse.statut === 'generee' || analyse.statut === 'publiee' || analyse.statut === 'erreur') {
    return (
      <Link
        href={`/prof/fragments-erudition/analyse/${depotId}?semaine=${semaineId}`}
        className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
      >
        {badge}
        {(analyse.statut === 'generee' || analyse.statut === 'publiee') && (
          <span className="text-xs text-muet">
            {noteVersLettre(analyse.note_decouvertes) ?? '?'} / {noteVersLettre(analyse.note_sources) ?? '?'} / {noteVersLettre(analyse.note_reflexions) ?? '?'}
          </span>
        )}
      </Link>
    )
  }

  return badge
}

export default function VueSemaine({ eleves, semaineId, tz }: Props) {
  const router = useRouter()
  const [eleveVisu, setEleveVisu] = useState<EleveAvecDepot | null>(null)

  // ── Validation par lot (C8·L2) ────────────────────────────────────────────
  // La sélection est indexée par dépôt : une ligne, une clé, quel que soit
  // l'état de son analyse. Les trois actions dérivent ensuite d'elle ce qui les
  // concerne — publier ne vise que les « à valider », dépublier que les
  // publiées, relancer n'importe quel dépôt.
  const [selection, setSelection] = useState<Set<string>>(new Set())
  const [enCours, setEnCours] = useState(false)
  const [apercuOuvert, setApercuOuvert] = useState<string | null>(null)
  const [bilan, setBilan] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  // « Déposés » est cumulatif (les retards sont aussi des dépôts) — cohérent avec la tuile
  // de classe et la spec (en retard ⊆ déposés). « En retard » reste un sous-compteur.
  const nbDeposes = eleves.filter(e => e.depot).length
  const nbRetard = eleves.filter(e => e.depot && e.depot.statut === 'en_retard').length
  const nbManquants = eleves.filter(e => !e.depot).length
  const nbAValider = eleves.filter(e => e.analyse?.statut === 'generee').length
  const nbPublies = eleves.filter(e => e.analyse?.statut === 'publiee').length

  // La répartition vit dans un module pur, testé (utils/validation-lot.test.ts) :
  // c'est elle qui décide ce que chaque bouton touchera vraiment.
  const aValider = useMemo(() => elevesAValider(eleves), [eleves])
  const { choisis, aPublier, aDepublier, cibles } = useMemo(
    () => repartirSelection(eleves, selection),
    [eleves, selection]
  )
  const toutAValiderChoisi = toutAValiderEstChoisi(eleves, selection)

  function basculer(depotId: string) {
    setBilan(null)
    setSelection(prev => {
      const suivant = new Set(prev)
      if (suivant.has(depotId)) suivant.delete(depotId)
      else suivant.add(depotId)
      return suivant
    })
  }

  function basculerTout() {
    setBilan(null)
    setSelection(prev => basculerPile(eleves, prev))
  }

  // Enveloppe commune : rien ne reste figé sur « … », et un échec se dit.
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
    const ids = aPublier.map(e => e.analyse!.id)
    const r = await publierAnalysesLot(ids)
    if (r.error) return { type: 'err' as const, texte: r.error }
    return {
      type: 'ok' as const,
      texte: `${r.publiees} retour${r.publiees > 1 ? 's' : ''} publié${r.publiees > 1 ? 's' : ''} — les élèves y ont accès.`
        + (r.ignorees > 0 ? ` ${r.ignorees} ignoré${r.ignorees > 1 ? 's' : ''} (déjà publié ou plus « à valider »).` : ''),
    }
  })

  const handleDepublier = () => agir(async () => {
    const ids = aDepublier.map(e => e.analyse!.id)
    const r = await depublierAnalysesLot(ids)
    if (r.error) return { type: 'err' as const, texte: r.error }
    return { type: 'ok' as const, texte: `${r.depubliees} retour${r.depubliees > 1 ? 's' : ''} dépublié${r.depubliees > 1 ? 's' : ''} — repassé${r.depubliees > 1 ? 's' : ''} « à valider ».` }
  })

  const handleRelancer = () => agir(async () => {
    const r = await relancerAnalysesLot(cibles)
    if (r.error) return { type: 'err' as const, texte: r.error }
    return { type: 'ok' as const, texte: `${r.relancees} analyse${r.relancees > 1 ? 's' : ''} relancée${r.relancees > 1 ? 's' : ''} — elles se refont en arrière-plan, une par une.` }
  })

  return (
    <div>
      {/* Stats rapides */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-ok-teinte border border-ok rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-ok">{nbDeposes}</p>
          <p className="text-xs text-ok mt-0.5">Déposé</p>
        </div>
        <div className="bg-attention-teinte border border-attention rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-attention">{nbRetard}</p>
          <p className="text-xs text-attention mt-0.5">En retard</p>
        </div>
        <div className="bg-retard-teinte border border-retard rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-retard">{nbManquants}</p>
          <p className="text-xs text-retard mt-0.5">Manquant</p>
        </div>
        <div className="bg-attention-teinte border border-attention rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-attention">{nbAValider}</p>
          <p className="text-xs text-attention mt-0.5">À valider</p>
        </div>
        <div className="bg-parchemin-fonce border border-bordure rounded-xl p-3 text-center">
          <p className="text-xl font-serif text-encre">{nbPublies}</p>
          <p className="text-xs text-muet mt-0.5">Publié</p>
        </div>
      </div>

      {/* Bilan de la dernière action de lot */}
      {bilan && (
        <div className={`mb-3 rounded-xl px-4 py-3 text-sm ${
          bilan.type === 'ok'
            ? 'bg-ok-teinte border border-ok text-ok'
            : 'bg-retard-teinte border border-retard text-retard'
        }`}>
          {bilan.texte}
        </div>
      )}

      {/* Tableau */}
      <div className="bg-surface border border-bordure rounded-xl overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-parchemin-fonce border-b border-bordure">
            <tr>
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={toutAValiderChoisi}
                  disabled={aValider.length === 0 || enCours}
                  onChange={basculerTout}
                  className="rounded accent-[color:var(--bouton)] disabled:opacity-30"
                  title={aValider.length > 0 ? `Sélectionner les ${aValider.length} analyses à valider` : 'Aucune analyse à valider'}
                  aria-label="Sélectionner toutes les analyses à valider"
                />
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Élève</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Dépôt</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide hidden sm:table-cell">Le</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Analyse</th>
              <th className="px-4 py-3 text-xs font-medium text-muet uppercase tracking-wide">Photos</th>
            </tr>
          </thead>
          <tbody>
            {eleves.map(eleve => {
              const choisi = !!eleve.depot && selection.has(eleve.depot.id)
              const signal = eleve.analyse?.signal_integrite ?? null
              const apercu = apercuOuvert === eleve.id
              return (
                <Fragment key={eleve.id}>
                  <tr
                    className={`border-t border-bordure ${
                      choisi ? 'bg-pigment-teinte' : !eleve.depot ? 'bg-retard-teinte/30' : 'hover:bg-parchemin-fonce'
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={choisi}
                        disabled={!eleve.depot || enCours}
                        onChange={() => eleve.depot && basculer(eleve.depot.id)}
                        className="rounded accent-[color:var(--bouton)] disabled:opacity-30"
                        aria-label={`Sélectionner le dépôt de ${eleve.display_name}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-encre">
                      <Link
                        href={`/prof/fragments-erudition/eleve/${eleve.id}`}
                        className="hover:text-info hover:underline"
                      >
                        {eleve.display_name}
                      </Link>
                      {eleve.classe && <span className="text-xs text-muet ml-1">{eleve.classe}</span>}
                      {signal && (
                        <span
                          className="ml-2 text-xs bg-retard-teinte text-retard px-1.5 py-0.5 rounded-full"
                          title={signal.motif ?? undefined}
                        >
                          ⚠ intégrité
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{badgeStatutDepot(eleve.depot)}</td>
                    <td className="px-4 py-3 text-sm text-muet hidden sm:table-cell">
                      {eleve.depot ? formatInstant(eleve.depot.created_at, tz, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {eleve.depot
                          ? badgeAnalyse(eleve.analyse, eleve.depot.id, semaineId)
                          : <span className="text-xs text-bordure">—</span>
                        }
                        {eleve.analyse?.commentaire_general && (
                          <button
                            onClick={() => setApercuOuvert(apercu ? null : eleve.id)}
                            className="text-xs text-muet hover:text-encre-douce underline"
                            aria-expanded={apercu}
                          >
                            {apercu ? 'Replier' : 'Aperçu'}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {eleve.depot && eleve.depot.photos.length > 0 ? (
                        <button
                          onClick={() => setEleveVisu(eleve)}
                          className="text-xs bg-bouton text-surface px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors"
                        >
                          Voir ({eleve.depot.photos.length})
                        </button>
                      ) : (
                        <span className="text-xs text-muet">—</span>
                      )}
                    </td>
                  </tr>
                  {/* Aperçu : juger sans ouvrir l'écran d'analyse — c'est ce qui
                      rend la validation par lot défendable plutôt qu'aveugle. */}
                  {apercu && eleve.analyse?.commentaire_general && (
                    <tr className="border-t border-bordure bg-parchemin-fonce">
                      <td />
                      <td colSpan={5} className="px-4 py-3">
                        {signal?.motif && (
                          <p className="text-xs text-retard mb-1">⚠ {signal.motif}</p>
                        )}
                        <p className="text-sm text-encre-douce whitespace-pre-wrap">{eleve.analyse.commentaire_general}</p>
                        <Link
                          href={`/prof/fragments-erudition/analyse/${eleve.depot!.id}?semaine=${semaineId}`}
                          className="text-xs text-muet hover:text-encre-douce underline mt-2 inline-block"
                        >
                          Ouvrir le retour complet →
                        </Link>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Barre d'action de lot — n'apparaît qu'une fois quelque chose de choisi.
          Chaque bouton annonce le nombre qu'il touchera VRAIMENT : rien n'est
          traité en silence, rien n'est ignoré sans le dire. */}
      {selection.size > 0 && (
        <div className="sticky bottom-4 mt-4 z-10">
          <div className="bg-surface border border-pigment shadow-sm rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-encre-douce">
              <span className="font-medium">{selection.size}</span> dépôt{selection.size > 1 ? 's' : ''} sélectionné{selection.size > 1 ? 's' : ''}
            </span>

            <button
              onClick={handlePublier}
              disabled={enCours || aPublier.length === 0}
              className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-40 transition-colors"
            >
              {enCours ? '…' : `Publier ${aPublier.length > 0 ? `(${aPublier.length})` : ''}`}
            </button>

            <button
              onClick={handleRelancer}
              disabled={enCours || choisis.length === 0}
              className="border border-bordure-bouton text-encre-douce px-4 py-2 rounded-lg text-sm hover:bg-parchemin-fonce disabled:opacity-40 transition-colors"
            >
              Relancer l&apos;analyse ({choisis.length})
            </button>

            {aDepublier.length > 0 && (
              <button
                onClick={handleDepublier}
                disabled={enCours}
                className="border border-attention text-attention px-4 py-2 rounded-lg text-sm hover:bg-attention-teinte disabled:opacity-40 transition-colors"
              >
                Dépublier ({aDepublier.length})
              </button>
            )}

            <button
              onClick={() => { setSelection(new Set()); setBilan(null) }}
              disabled={enCours}
              className="text-xs text-muet hover:text-encre-douce underline ml-auto"
            >
              Tout désélectionner
            </button>
          </div>
        </div>
      )}

      {/* Modal visionneuse */}
      {eleveVisu && eleveVisu.depot && (
        <VisionneusModal
          nomEleve={eleveVisu.display_name}
          photos={eleveVisu.depot.photos}
          onFermer={() => setEleveVisu(null)}
        />
      )}
    </div>
  )
}
