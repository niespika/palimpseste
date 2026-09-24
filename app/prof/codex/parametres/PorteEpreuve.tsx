'use client'
// ============================================================================
// CODEX — L'INTERRUPTEUR `epreuve_minutee_actif`, basculé DEPUIS ICI (Codex →
// Paramètres), comme les autres portes. Patron : `app/prof/scriptorium/PorteAgenda.tsx`.
// « Toute fonctionnalité nouvelle naît derrière un flag OFF » (`AGENTS.md`).
// ============================================================================
import { useActionState } from 'react'
import { actionBasculerLEpreuve, type ReponseEpreuve } from '@/app/passation/actions-epreuve'

export default function PorteEpreuve({ actif }: { actif: boolean }) {
  const [retour, action, enCours] = useActionState<ReponseEpreuve | null, FormData>(
    actionBasculerLEpreuve, null)
  return (
    <section className="mb-8 space-y-2">
      <h2 className="font-marque text-sm uppercase tracking-wide text-muet-clair">
        L’épreuve minutée — sujet libre, page projetée, dépôt automatique
      </h2>
      <div className="space-y-2 rounded-xl border border-bordure bg-surface p-4">
        <form action={action} className="flex flex-wrap items-baseline gap-3">
          <input type="hidden" name="actif" value={actif ? 'non' : 'oui'} />
          <p className="min-w-0 flex-1 font-corps text-sm text-encre-douce">
            <strong className="font-ui text-encre">
              {actif ? 'L’épreuve minutée est ouverte.' : 'L’épreuve minutée est fermée.'}
            </strong>{' '}
            {actif
              ? 'À la conception d’un examen écrit, vous pouvez écrire votre sujet, ajouter des consignes pratiques (projetées, jamais envoyées à la correction) et fixer la durée de rédaction et celle de relecture. Le jour de l’épreuve, vous la lancez depuis la page projetée : le sujet s’affiche sur les tablettes, et le dépôt des photos s’ouvre tout seul à la moitié de la rédaction.'
              : 'L’examen se conçoit sur un sujet du corpus, et c’est vous qui ouvrez le dépôt depuis l’écran de passation. Rien n’est effacé : ce qui a été réglé réapparaît à l’ouverture.'}
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
