'use client'
// ============================================================================
// C7 · L1 — L'INTERRUPTEUR « LE JUGE REÇOIT LES DOCUMENTS » — il se bascule
// DEPUIS ICI (Paramètres de Scriptorium), comme la copie annotée. Il vit sur
// `scriptorium_params`. Patron : `PorteCopieAnnotee.tsx`.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerJugeDocuments, type RetourPorte } from './actions-juge-documents'

export default function PorteJugeDocuments({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorte | null, FormData>(
    actionBasculerJugeDocuments, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Le juge reçoit les documents</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'Le juge reçoit les documents.' : 'Le juge ne reçoit que la consigne et la copie.'}
            </strong>{' '}
            {actif
              ? 'Aux crans 4, 5, 7 et 9, un appel de plus tranche l’exercice avec le devoir d’élève, la version corrigée, la zone désignée et la réponse qu’on tient pour vraie ; Calame reçoit ce verdict et cite le passage. Le verdict s’écrit sur le dépôt.'
              : 'La chaîne tourne comme avant : aucun verdict de cran n’est demandé ni écrit, et le retour de Calame ne change pas.'}
          </p>
          <button type="submit" disabled={enCours}
            className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2
                       font-ui text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50">
            {enCours ? '…' : actif ? 'Fermer' : 'Ouvrir'}
          </button>
        </form>
        {retour && (
          <p className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>
        )}
      </div>
    </section>
  )
}
