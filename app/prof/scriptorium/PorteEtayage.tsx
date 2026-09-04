'use client'
// ============================================================================
// L'INTERRUPTEUR DE L'ÉTAYAGE PAR NIVEAU — Aletheia, spec `SPEC_Aletheia_Etayage_par_niveau.md`.
// Il vit sur `scriptorium_params.aletheia_etayage_actif`, comme `rag_actif` et la copie
// annotée. Porte fermée : Aletheia est celui d'avant, à l'octet près.
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerEtayage, type RetourPorte } from './actions-etayage'

export default function PorteEtayage({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<RetourPorte | null, FormData>(actionBasculerEtayage, null)
  return (
    <section className="space-y-2">
      <h2 className="font-cinzel text-sm uppercase tracking-wide text-muet-clair">Aletheia — l’étayage par niveau</h2>
      <div className="rounded-xl border border-bordure bg-surface p-4 space-y-2">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">{actif ? 'L’étayage par niveau est ouvert.' : 'L’étayage par niveau est fermé.'}</strong>{' '}
            {actif
              ? 'Gabarits de lecture, rappel d’ouverture, relances qui désignent un passage, réponses avant la réécriture, passage montré ou à surligner selon le niveau, retour final qui pointe le texte, « je ne sais pas » recevable. Pour chaque livre : régénérer la fiche (propositions), puis générer les passages clés.'
              : 'Aletheia reste celui d’avant, à l’octet près : cinq champs fixes, retour socratique, synthèse et architecture. Les découpes et les fiches enrichies restent en base.'}
          </p>
          <button type="submit" disabled={enCours}
            className="min-h-11 shrink-0 rounded-[10px] border border-bordure-bouton px-4 py-2 font-ui text-sm text-encre-douce hover:bg-parchemin-fonce disabled:opacity-50">
            {enCours ? '…' : actif ? 'Fermer' : 'Ouvrir'}
          </button>
        </form>
        {retour && <p className={`font-ui text-xs ${retour.ok ? 'text-ok' : 'text-retard'}`}>{retour.message}</p>}
      </div>
    </section>
  )
}
