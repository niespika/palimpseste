'use client'
// ============================================================================
// C4 · L2 — L'ÉCRAN DES BUDGETS (§4, couche 0).
// ----------------------------------------------------------------------------
// « Le budget est une propriété de l'ÉLÈVE, PAS DE LA CLASSE : un bi-classe a UN
//   SEUL budget. » Les chiffres du §4 sont des VALEURS PAR DÉFAUT « réglables par
//   élève et par lot — PROPOSÉES, JAMAIS IMPOSÉES » : vider un champ rend le
//   défaut de la situation.
//
// ⚠️ LE PIÈGE DE LA VACUITÉ, condition de recette du `07-` §1.3 : un élève dont
//    aucune inscription active ne porte de parcours NE REÇOIT AUCUN EXERCICE
//    ROUTÉ, ET LE PROFESSEUR EN EST AVERTI. Il est en tête de cet écran, nommé.
//
// ⚠️ La PRÉFÉRENCE se recueille ici, et rien de plus : « sa place dans le ciblage
//    n'est pas tranchée », et NI SA QUESTION NI SES VALEURS ne sont écrites dans
//    les sources — l'écran le DIT au professeur, il n'invente aucune question.
// ============================================================================

import { useActionState, useState } from 'react'
import type { ChargeBudgets, EleveDuPilotage } from './serveur'
import { reglerLeBudget, noterLeRecueil, type Retour } from './actions'
import { BUDGET_PAR_DEFAUT } from '@/utils/routeur/config'

const LIBELLE_SITUATION: Record<string, string> = {
  tc_seul: 'Tronc commun', hlp_seul: 'HLP', bi_classe: 'Bi-classe (TC + HLP)',
}

export default function VueBudgets({ charge }: { charge: ChargeBudgets }) {
  const servis = charge.eleves.filter((e) => e.budget.budget !== null)
  const nonServis = charge.eleves.filter((e) => e.budget.budget === null)

  return (
    <div className="space-y-6">
      {charge.incidents.length > 0 && (
        <ul className="rounded border border-retard/40 bg-retard-teinte/40 px-4 py-3 font-ui text-sm
                       text-encre-douce space-y-1">
          {charge.incidents.map((i) => <li key={i}>⚠ {i}</li>)}
        </ul>
      )}

      {/* LE PIÈGE DE LA VACUITÉ — nommé, jamais silencieux. */}
      {nonServis.length > 0 && (
        <section className="rounded border border-attention/50 bg-attention-teinte/50 px-4 py-4">
          <h2 className="font-ui text-sm font-semibold text-attention">
            {nonServis.length} élève{nonServis.length > 1 ? 's ne reçoivent' : ' ne reçoit'} aucun
            exercice routé
          </h2>
          <p className="font-corps text-sm text-encre-douce mt-1 max-w-3xl">
            Leur classe ne porte pas de parcours. Ce n’est pas un service réduit : c’est un refus
            explicite, parce qu’un ensemble de parcours vide exclurait l’élève de{' '}
            <em>tout</em> en silence. Renseignez le parcours de la classe — tronc commun ou HLP —
            pour qu’ils entrent dans le ciblage.
          </p>
          <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2 font-ui text-sm text-encre-douce">
            {nonServis.map((e) => (
              <li key={e.id} className="flex justify-between gap-3 border-b border-bordure/60 py-1">
                <span>{e.nom}</span>
                <span className="text-muet text-xs">
                  {e.classes.length ? e.classes.join(' · ') : 'aucune classe'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-titre text-xl text-encre">Les budgets</h2>
          <p className="font-ui text-xs text-muet">
            {servis.length} élève{servis.length > 1 ? 's servis' : ' servi'} · en minutes par semaine
          </p>
        </div>
        <p className="font-corps text-sm text-encre-douce max-w-3xl">
          Un champ vide vaut <strong>le défaut de la situation</strong> — TC{' '}
          {BUDGET_PAR_DEFAUT.tc_seul.plancher}–{BUDGET_PAR_DEFAUT.tc_seul.plafond} ·{' '}
          HLP {BUDGET_PAR_DEFAUT.hlp_seul.plancher}–{BUDGET_PAR_DEFAUT.hlp_seul.plafond} ·{' '}
          bi-classe {BUDGET_PAR_DEFAUT.bi_classe.plancher}–{BUDGET_PAR_DEFAUT.bi_classe.plafond},
          plus {BUDGET_PAR_DEFAUT.tc_seul.optionnel} min de quota « en faire plus ».{' '}
          <strong>Le plafond est une borne dure</strong> ; le plancher, lui, se signale : sous lui,
          l’écart se journalise et le solde revient à vos exercices communs.
        </p>

        <div className="space-y-2">
          {servis.map((e) => <LigneBudget key={e.id} eleve={e} />)}
        </div>
      </section>

      <PanneauPreference eleves={charge.eleves} />
    </div>
  )
}

function LigneBudget({ eleve }: { eleve: EleveDuPilotage }) {
  const [etat, action, enCours] = useActionState<Retour | null, FormData>(reglerLeBudget, null)
  const b = eleve.budget
  const defaut = b.situation ? BUDGET_PAR_DEFAUT[b.situation] : null

  return (
    <form action={action}
      className="rounded border border-bordure bg-surface px-4 py-3 grid gap-3
                 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
      <input type="hidden" name="eleve_id" value={eleve.id} />
      <div className="min-w-0">
        <p className="font-ui text-sm text-encre truncate">{eleve.nom}</p>
        <p className="font-ui text-xs text-muet">
          {b.situation ? LIBELLE_SITUATION[b.situation] : '—'}
          {eleve.classes.length ? ` · ${eleve.classes.join(' · ')}` : ''}
          {b.regle ? ' · réglé' : ' · au défaut'}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Champ nom="plancher" label="Plancher" defaut={defaut?.plancher} />
        <Champ nom="plafond" label="Plafond" defaut={defaut?.plafond} />
        <Champ nom="optionnel" label="+ Optionnel" defaut={defaut?.optionnel} />
        <button type="submit" disabled={enCours}
          className="h-[38px] rounded border border-bordure-bouton bg-parchemin px-3 font-ui text-xs
                     text-encre hover:bg-parchemin-fonce disabled:opacity-50">
          {enCours ? '…' : 'Enregistrer'}
        </button>
      </div>

      {etat && (
        <p className={`sm:col-span-2 font-ui text-xs ${etat.ok ? 'text-ok' : 'text-retard'}`}>
          {etat.message}
          {etat.details?.map((d) => (
            <span key={d} className="block text-attention mt-1">⚠ {d}</span>
          ))}
        </p>
      )}
      {b.avertissements.map((a) => (
        <p key={a} className="sm:col-span-2 font-ui text-xs text-attention">⚠ {a}</p>
      ))}
    </form>
  )
}

function Champ({ nom, label, defaut }: { nom: string; label: string; defaut?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-ui text-[10px] uppercase tracking-wide text-muet">{label}</span>
      <input type="number" name={nom} min={0} step={5}
        placeholder={defaut != null ? String(defaut) : '—'}
        className="w-[92px] rounded border border-bordure-bouton bg-parchemin px-2 py-2 font-ui
                   text-sm text-encre placeholder:text-puce" />
    </label>
  )
}

/**
 * `01-` §5 — LE RECUEIL, et rien de plus.
 * ⚠️ « Ni sa question ni ses valeurs ne sont écrites dans les sources : POSE LE
 *    RECUEIL, SIGNALE LE CONTENU MANQUANT AU PROFESSEUR — il ne s'invente pas, et
 *    il ne se repêche pas dans l'archive. »
 */
function PanneauPreference({ eleves }: { eleves: EleveDuPilotage[] }) {
  const [ouvert, setOuvert] = useState(false)
  const [etat, action, enCours] = useActionState<Retour | null, FormData>(noterLeRecueil, null)
  const servis = eleves.filter((e) => e.budget.budget !== null)

  return (
    <section className="rounded border border-bordure bg-parchemin px-4 py-4 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-titre text-lg text-encre">La préférence de l’élève</h2>
        <button type="button" onClick={() => setOuvert((v) => !v)}
          className="font-ui text-xs text-muet hover:text-encre underline underline-offset-2">
          {ouvert ? 'replier' : 'déplier'}
        </button>
      </div>

      <p className="font-corps text-sm text-encre-douce max-w-3xl">
        <strong className="text-attention">Le contenu manque, et il ne s’invente pas.</strong>{' '}
        Les sources demandent que la préférence de l’élève soit recueillie{' '}
        <em>à intervalle régulier</em> — mais <strong>ni la question ni ses valeurs n’y sont
        écrites</strong>, et <strong>sa place dans le ciblage n’est pas tranchée</strong> : aucune
        règle du routeur ne la lit aujourd’hui. Le recueil est posé et il enregistre ce que vous
        saisissez ; la question, elle, reste à écrire.
      </p>

      {ouvert && (
        <form action={action} className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)_auto]
                                         items-end pt-2 border-t border-bordure">
          <label className="flex flex-col gap-1">
            <span className="font-ui text-[10px] uppercase tracking-wide text-muet">Élève</span>
            <select name="eleve_id" required
              className="rounded border border-bordure-bouton bg-surface px-2 py-2 font-ui text-sm">
              {servis.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nom}{e.preferenceRecueillieAt
                    ? ` · dernier recueil ${e.preferenceRecueillieAt.slice(0, 10)}` : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-ui text-[10px] uppercase tracking-wide text-muet">
              Ce que l’élève a dit
            </span>
            <input type="text" name="reponse"
              placeholder="texte libre — aucune liste fermée n’est posée ici"
              className="rounded border border-bordure-bouton bg-surface px-2 py-2 font-ui text-sm
                         placeholder:text-puce" />
          </label>
          <button type="submit" disabled={enCours}
            className="h-[38px] rounded border border-bordure-bouton bg-parchemin-fonce px-3
                       font-ui text-xs text-encre hover:bg-bordure disabled:opacity-50">
            {enCours ? '…' : 'Noter le recueil'}
          </button>
          {etat && (
            <p className={`sm:col-span-3 font-ui text-xs ${etat.ok ? 'text-ok' : 'text-retard'}`}>
              {etat.message}
              {etat.details?.map((d) => <span key={d} className="block text-muet mt-1">{d}</span>)}
            </p>
          )}
        </form>
      )}
    </section>
  )
}
