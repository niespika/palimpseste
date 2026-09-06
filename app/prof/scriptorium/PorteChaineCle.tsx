'use client'
// ============================================================================
// C7 · L8 — L'INTERRUPTEUR « LA CHAÎNE À L'HEURE DE LA CLÉ » — il se bascule
// DEPUIS ICI (Paramètres de Scriptorium), comme le juge du cran. Il vit sur
// `scriptorium_params`. Patron : `PorteJugeDocuments.tsx`.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerChaineCle, type RetourPorteCle } from './actions-chaine-cle'

export default function PorteChaineCle({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorteCle | null, FormData>(
    actionBasculerChaineCle, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">La chaîne à l’heure de la clé</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'La chaîne lit la clé.' : 'La chaîne mesure et commente comme avant.'}
            </strong>{' '}
            {actif
              ? 'Sur un exercice du gabarit qui isole, la chaîne ne mesure que l’observable de la clé et le retour ne parle que de lui ; le « se juger » l’interroge en premier ; une citation que l’élève a recopiée du devoir n’est plus servie sous « tu écris », sauf sur le passage à corriger ; une copie qui reproduit le devoir se signale au professeur.'
              : 'Toutes les compétences que l’exercice déclare sont mesurées, le retour reçoit leurs squelettes, le « se juger » élit ses questions par fragilité, et une citation recopiée du devoir passe le contrôle. Rien de ce lot ne s’applique.'}
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
