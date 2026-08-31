'use client'
// ============================================================================
// L'INTERRUPTEUR DU SIGNALEMENT — et il se bascule DEPUIS ICI.
// ----------------------------------------------------------------------------
// ⛔ IL N'EST PAS À `/prof/allumage`, ET C'EST DÉLIBÉRÉ. Le `07-` §5 déclare
//    CLOSE la liste des six interrupteurs (`utils/allumage.ts` : « aucun lot n'en
//    crée un septième »). `signalement_exercice_actif` vit sur
//    `scriptorium_params` comme `rag_actif` et `plan_evaluation_actif`, qui n'en
//    sont pas non plus — et il se règle sur la page qui le consomme.
// ============================================================================

import { useActionState } from 'react'
import { actionBasculerLaPorte, type RetourSignalement } from './actions'

export default function PorteDuSignalement({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourSignalement | null, FormData>(
    actionBasculerLaPorte, null)

  return (
    <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
      <form action={action} className="flex flex-wrap items-baseline gap-3">
        <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
        <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
          <strong className="font-ui text-encre">
            {actif ? 'Les élèves peuvent signaler.' : 'Les élèves ne peuvent pas signaler.'}
          </strong>{' '}
          {actif
            ? 'La case « Signaler que l’exercice a un problème » s’affiche en pied de chaque exercice.'
            : 'Aucune case ne s’affiche chez eux. Les signalements déjà reçus restent lisibles ici.'}
        </p>
        <button
          type="submit" disabled={enCours}
          className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2
                     font-ui text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50"
        >
          {enCours ? '…' : actif ? 'Fermer' : 'Ouvrir'}
        </button>
      </form>
      {retour && (
        <p className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>
          {retour.message}
        </p>
      )}
    </div>
  )
}
