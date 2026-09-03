'use client'
// ============================================================================
// L'INTERRUPTEUR DE LA COPIE ANNOTÉE — il se bascule DEPUIS ICI (Paramètres de
// Scriptorium, demande de Louis du 03/09). Il n'est pas à `/prof/allumage` : la
// liste des six est CLOSE (`utils/allumage.ts`). Il vit sur `scriptorium_params`
// comme `rag_actif`. Patron : `app/prof/signalements/PorteDuSignalement.tsx`.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerCopieAnnotee, type RetourPorte } from './actions-copie-annotee'

export default function PorteCopieAnnotee({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorte | null, FormData>(
    actionBasculerCopieAnnotee, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">La copie annotée</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'La copie annotée est ouverte.' : 'La copie annotée est fermée.'}
            </strong>{' '}
            {actif
              ? 'Sur les pages de passation (Codex, Aletheia, Fragments), la liste devient une liste de noms ; chaque nom ouvre la copie surlignée avec les observables et les verdicts de la chaîne. Les élèves ne la voient pas.'
              : 'Les pages de passation gardent leur liste d’avant, et les pages de copie disent « à OFF ». Rien ne change pour les élèves.'}
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
