'use client'
// ============================================================================
// C7 · L9 — L'INTERRUPTEUR « SUR UN CRAN QUI ISOLE, LE JUGE EST LA MESURE » — il
// se bascule DEPUIS ICI (Paramètres de Scriptorium), à côté de la porte de la
// clé (C7-L8). Il vit sur `scriptorium_params`. Patron : `PorteChaineCle.tsx`.
// ⚠️ « N'a d'effet que si le juge est ouvert » (piège 5) : l'écran le dit, et
//    dit quand le juge est fermé — le professeur n'a pas à deviner.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerJugeMesure, type RetourPorteMesure } from './actions-juge-mesure'

export default function PorteJugeMesure({ actif, jugeOuvert }: { actif: boolean; jugeOuvert: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorteMesure | null, FormData>(
    actionBasculerJugeMesure, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Sur un cran qui isole, le juge est la mesure</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'Le juge est la mesure.' : 'La chaîne mesure comme avant.'}
            </strong>{' '}
            {actif
              ? 'Aux crans 1, 2, 3, 4, 5, 7 et 9 servis par le routeur, P1 et P2 ne tournent plus : le verdict du juge du cran (ou de l’algorithme aux crans 1 et 3) devient la mesure, sans lettre ; en version finale le juge rejuge à l’aveugle ; Calame reçoit le verdict et les documents, jamais un squelette ; le taux de réussite pèse les mesures par cran, et une trajectoire nette déclenche une sonde de montée au cran 6 ou 8.'
              : 'Sur les crans qui isolent, P1 et P2 tournent, la lettre-équivalente s’écrit, Calame reçoit le squelette, le taux de réussite compte chaque mesure pour une. Rien de ce lot ne s’applique.'}
            {' '}
            <span className="text-muet-clair">
              Cette porte n’a d’effet que si le juge est ouvert (« Le juge reçoit les documents »).
              {jugeOuvert ? '' : ' Le juge est FERMÉ : ouverte, cette porte ne change rien tant qu’il le reste.'}
            </span>
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
