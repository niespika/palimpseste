'use client'
// ============================================================================
// C4 · L2 — L'ÉCRAN D'ASSIGNATION. IL EST EN LECTURE SEULE.
// ----------------------------------------------------------------------------
// « L'écran d'assignation est EN LECTURE SEULE — AUCUN GESTE DE VALIDATION, le
//   professeur ne valide rien au fil de l'eau » (`07-` §1.2). Le seul geste est
//   l'OVERRIDE, et « TOUT OVERRIDE SE JOURNALISE dans `routeur_decisions` ».
//
// ⭐ « LE RETRAIT ÉCRIT LE STATUT `retire`, QUI NE SE CONFOND JAMAIS AVEC
//    `abandonne` : l'un est une décision du professeur, l'autre un non-geste de
//    l'élève, ET L'ASSIDUITÉ MESURE L'ÉLÈVE. » L'écran le dit là où le geste se
//    fait, pas dans une note de bas de page.
// ============================================================================

import { useActionState, useState } from 'react'
import type { ChargeAssignation, DepotAssigne } from './serveur'
import { retirerLExercice, type Retour } from './actions'

const LIBELLE_STATUT: Record<string, string> = {
  assigne: 'assigné', ouvert: 'ouvert', v1_remis: 'v1 remise',
  retour_publie: 'retour publié', vf_remis: 'vf remise', clos: 'clos',
  abandonne: 'abandonné par l’élève', retire: 'retiré par vous',
}

export default function VueAssignation({ charge }: { charge: ChargeAssignation }) {
  const parEleve = new Map<string, DepotAssigne[]>()
  for (const d of charge.depots) {
    parEleve.set(d.eleveNom, [...(parEleve.get(d.eleveNom) ?? []), d])
  }

  return (
    <div className="space-y-5">
      {charge.incidents.length > 0 && (
        <ul className="rounded border border-retard/40 bg-retard-teinte/40 px-4 py-3 font-ui text-sm
                       text-encre-douce space-y-1">
          {charge.incidents.map((i) => <li key={i}>⚠ {i}</li>)}
        </ul>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-titre text-xl text-encre">
          Semaine du {charge.cycleLundi}
        </h2>
        <SemaineVoisine lundi={charge.cycleLundi} />
      </div>

      <p className="font-corps text-sm text-encre-douce max-w-3xl">
        Ce que le routeur a posé. <strong className="text-encre">Vous ne validez rien</strong> —
        cet écran montre, il ne demande pas. Le seul geste possible est de{' '}
        <strong>retirer</strong> un exercice, tant qu’il n’est pas clos ; le retrait se journalise,
        et il sort du dénominateur d’assiduité <em>pour l’avenir seulement</em>.
      </p>

      {charge.depots.length === 0 ? (
        <p className="rounded border border-bordure bg-parchemin px-4 py-6 text-center font-corps
                      text-encre-douce">
          Aucun exercice assigné cette semaine.
          {!charge.routeurActif && (
            <span className="block mt-1 font-ui text-xs text-muet">
              Le routeur est éteint : c’est attendu.
            </span>
          )}
        </p>
      ) : (
        <div className="space-y-4">
          {[...parEleve.entries()].map(([nom, depots]) => (
            <section key={nom} className="rounded border border-bordure bg-surface">
              <h3 className="border-b border-bordure px-4 py-2 font-ui text-sm text-encre">
                {nom}
                <span className="ml-2 text-xs text-muet">
                  {depots.length} exercice{depots.length > 1 ? 's' : ''}
                </span>
              </h3>
              <ul className="divide-y divide-bordure/60">
                {depots.map((d) => <LigneDepot key={d.id} depot={d} />)}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function LigneDepot({ depot }: { depot: DepotAssigne }) {
  const [etat, action, enCours] = useActionState<Retour | null, FormData>(retirerLExercice, null)
  const [confirme, setConfirme] = useState(false)

  return (
    <li className="px-4 py-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0 space-y-1">
        <p className="font-ui text-sm text-encre">
          {depot.cibleRetenue
            ? <>Cible : <strong>{depot.cibleRetenue}</strong></>
            : <span className="text-muet">Sans cible de routeur</span>}
          {depot.regleDeclenchee && (
            <span className="ml-2 rounded bg-parchemin-fonce px-1.5 py-0.5 font-ui text-[10px]
                             uppercase tracking-wide text-encre-douce">
              {depot.regleDeclenchee}
            </span>
          )}
          {depot.degrade && (
            <span className="ml-2 rounded bg-attention-teinte px-1.5 py-0.5 font-ui text-[10px]
                             uppercase tracking-wide text-attention"
              title="Aucun cran ne portait l’observable visé : l’exercice a été servi quand même,
                     en retour mono-focal.">
              dégradé
            </span>
          )}
        </p>
        {/* ⛔ LES DEUX SONDES NE SE CONFONDENT JAMAIS (`01-` §8.8), et elles vivent
            dans le MÊME tableau — `sondes_retenues` —, distinguées par le seul
            `sonde_montee`. Les mêler ici affichait « Cible : expression · Sondes :
            expression », que personne ne peut lire. *Constaté au smoke de C4-L12,
            le jour où la colonne s'est remplie.* */}
        {depot.sondes.some((s) => s.sonde_montee !== true) && (
          <p className="font-ui text-xs text-muet">
            Sondes : {depot.sondes.filter((s) => s.sonde_montee !== true).map((s) =>
              `${s.competence ?? '?'}${s.motif ? ` (${s.motif})` : ''}`).join(' · ')}
            <span className="ml-1 text-[10px] text-encre-douce">
              — mesurées en silence, sans retour
            </span>
          </p>
        )}
        {depot.sondes.some((s) => s.sonde_montee === true) && (
          <p className="font-ui text-xs text-muet"
            title="Une sonde de montée sert la CIBLE au-dessus de sa bande de crans : elle
                   vérifie l’aisance, elle n’entraîne pas, et elle ne compte ni dans la fenêtre
                   d’acquisition ni dans la stagnation (M-e). Elle reçoit un retour.">
            Sonde de montée : {depot.sondes.filter((s) => s.sonde_montee === true)
              .map((s) => s.competence ?? '?').join(' · ')}
            <span className="ml-1 text-[10px] text-encre-douce">
              — la cible servie au-dessus de sa bande
            </span>
          </p>
        )}
        <p className="font-ui text-xs text-muet">
          {LIBELLE_STATUT[depot.statut] ?? depot.statut}
          {' · '}origine {depot.origine}
          {depot.echeance ? ` · échéance ${depot.echeance.slice(0, 10)}` : ''}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {depot.retirable ? (
          confirme ? (
            <form action={action} className="flex items-center gap-2">
              <input type="hidden" name="depot_id" value={depot.id} />
              <input type="text" name="motif" placeholder="motif (facultatif)"
                className="w-[180px] rounded border border-bordure-bouton bg-parchemin px-2 py-1.5
                           font-ui text-xs placeholder:text-puce" />
              <button type="submit" disabled={enCours}
                className="rounded border border-retard/50 bg-retard-teinte px-3 py-1.5 font-ui
                           text-xs text-retard hover:bg-retard/20 disabled:opacity-50">
                {enCours ? '…' : 'Retirer'}
              </button>
              <button type="button" onClick={() => setConfirme(false)}
                className="font-ui text-xs text-muet hover:text-encre">annuler</button>
            </form>
          ) : (
            <button type="button" onClick={() => setConfirme(true)}
              className="rounded border border-bordure-bouton bg-parchemin px-3 py-1.5 font-ui
                         text-xs text-encre-douce hover:bg-parchemin-fonce">
              Retirer
            </button>
          )
        ) : (
          <span className="font-ui text-xs text-muet">
            {depot.statut === 'clos' ? 'clos — le retrait n’est plus permis' : 'déjà retiré'}
          </span>
        )}
      </div>

      {etat && (
        <p className={`sm:col-span-2 font-ui text-xs ${etat.ok ? 'text-ok' : 'text-retard'}`}>
          {etat.message}
          {etat.details?.map((d) => <span key={d} className="block text-muet mt-1">{d}</span>)}
        </p>
      )}
    </li>
  )
}

function SemaineVoisine({ lundi }: { lundi: string }) {
  const decale = (n: number) => {
    const d = new Date(`${lundi}T00:00:00Z`)
    d.setUTCDate(d.getUTCDate() + n * 7)
    return d.toISOString().slice(0, 10)
  }
  return (
    <span className="flex items-center gap-2 font-ui text-xs">
      <a href={`/prof/routeur?vue=assignation&semaine=${decale(-1)}`}
        className="rounded border border-bordure-bouton bg-parchemin px-2 py-1 text-encre-douce
                   hover:bg-parchemin-fonce">← semaine précédente</a>
      <a href={`/prof/routeur?vue=assignation&semaine=${decale(1)}`}
        className="rounded border border-bordure-bouton bg-parchemin px-2 py-1 text-encre-douce
                   hover:bg-parchemin-fonce">semaine suivante →</a>
    </span>
  )
}
