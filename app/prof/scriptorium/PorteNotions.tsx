'use client'
// ============================================================================
// LA TROISIÈME VOIE DU RATTACHEMENT — L'INTERRUPTEUR `notions_actif`, basculé
// DEPUIS ICI (Paramètres de Scriptorium), comme les autres portes. Il vit sur
// `scriptorium_params`. Patron : `PorteChaineCle.tsx`.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerNotions, type RetourPorteNotions } from './actions-notions'

export default function PorteNotions({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorteNotions | null, FormData>(
    actionBasculerNotions, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Les sujets rattachés par notions</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'Le routeur lit les notions.' : 'Le routeur ne lit pas les notions.'}
            </strong>{' '}
            {actif
              ? 'Un sujet ou un texte rattaché par notions se sert à un élève dès qu’un cours vu par l’une de ses classes déclare l’une de ces notions. Un cours qui ne déclare rien n’ouvre rien ; un sujet générique se sert comme avant.'
              : 'Un sujet ou un texte rattaché par notions reste écarté du routeur, quel que soit le cours vu. Seuls les sujets génériques et ceux rattachés à un cours apparié se servent.'}
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
