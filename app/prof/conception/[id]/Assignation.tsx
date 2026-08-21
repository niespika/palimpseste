'use client'

// LES EXERCICES COMMUNS À TOUTE UNE CLASSE — la CONTRAINTE DURE du lot.
// « Une instance `exercices` avec sa classe, sa fenêtre, son statut ; ET UNE
//   LIGNE D'`exercices_depots` PAR ÉLÈVE, créée DÈS L'ASSIGNATION — pas au
//   dépôt —, `origine` `prof`, avec sa date d'assignation et son échéance.
//   C'est ce qui fait qu'un exercice ENTRE AU CALENDRIER DE L'ÉLÈVE » (07- §1.1
//   et §5 ; piège 36).

import { useActionState } from 'react'
import { assignerALaClasse, type RetourConception } from '../actions'

const CHAMP = 'rounded-md border border-bordure-bouton bg-parchemin px-2 py-1 font-ui text-sm text-encre'

export default function Assignation({ id, statut, bloque, classeId, classes }: {
  id: string; statut: string; bloque: boolean; classeId: string | null
  classes: Array<{ id: string; nom: string }>
}) {
  const [retour, action, enCours] = useActionState<RetourConception | null, FormData>(
    assignerALaClasse, null)
  return (
    <form action={action} className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
      <input type="hidden" name="id" value={id} />
      <h2 className="font-titre text-lg text-encre">
        En faire un exercice commun à toute une classe
      </h2>
      <p className="font-ui text-xs text-encre-douce max-w-3xl">
        La classe et la fenêtre se posent <strong>ici</strong>, jamais dans le fichier d&apos;import :
        {' '}<em>un exercice importé n&apos;est assigné à personne</em>. L&apos;assignation crée
        {' '}<strong>une ligne d&apos;<code>exercices_depots</code> par élève</strong>,
        {' '}<code>origine</code> <code>prof</code> — <strong>dans les tables du routeur, pas dans
        une table à lui</strong>. C&apos;est ce qui fait qu&apos;il entre au calendrier de
        l&apos;élève, et que la voie mixte le trouve.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-0.5">
          <span className="block font-ui text-xs text-muet">la classe</span>
          <select name="classe_id" defaultValue={classeId ?? ''} className={CHAMP} required>
            <option value="">— choisir —</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
        </label>
        <label className="space-y-0.5">
          <span className="block font-ui text-xs text-muet">fenêtre — début</span>
          <input type="date" name="fenetre_debut" className={CHAMP} />
        </label>
        <label className="space-y-0.5">
          <span className="block font-ui text-xs text-muet">fin — c&apos;est l&apos;échéance</span>
          <input type="date" name="fenetre_fin" className={CHAMP} />
        </label>
        <button type="submit" disabled={enCours || bloque || statut === 'a_concevoir'}
          className="rounded-md bg-bouton px-3.5 py-1.5 font-ui text-sm text-surface disabled:opacity-50">
          {enCours ? 'Écriture…' : 'Assigner à la classe'}
        </button>
      </div>
      {(bloque || statut === 'a_concevoir') && (
        <p className="font-ui text-xs text-attention">
          {bloque ? 'Cette instance est bloquée : elle ne s’assigne pas tant qu’elle l’est.'
            : 'Cette instance n’est pas encore conçue : validez-la en file d’abord.'}
        </p>
      )}
      {retour && (
        <p className={`font-ui text-sm ${retour.ok ? 'text-ok' : 'text-retard'}`} role="status">
          {retour.message}
        </p>
      )}
    </form>
  )
}
