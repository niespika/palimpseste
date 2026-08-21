'use client'

// Le dépôt d'une fiche : un fichier, et ce que la lecture en rend.
// « Il y lit ce qu'elles portent : sa version, son statut, sa correspondance —
//   et RIEN QUI NE SOIT DANS LE FICHIER » (piège 8).

import { useActionState } from 'react'
import { deposerFiche, type Retour } from './actions'

export default function DepotFiche() {
  const [etat, action, enCours] = useActionState<Retour | null, FormData>(deposerFiche, null)
  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file" name="fiche" accept=".md,text/markdown,text/plain" required
          className="font-ui text-sm text-encre-douce file:mr-3 file:rounded-md file:border
                     file:border-bordure-bouton file:bg-parchemin-fonce file:px-3 file:py-1.5
                     file:font-ui file:text-sm file:text-encre"
        />
        <button
          type="submit" disabled={enCours}
          className="rounded-md bg-bouton px-3.5 py-1.5 font-ui text-sm text-surface
                     disabled:opacity-60"
        >
          {enCours ? 'Lecture…' : 'Déposer'}
        </button>
      </div>
      {etat && (
        <div
          role="status"
          className={`rounded-lg border px-3 py-2 font-ui text-sm ${
            etat.ok ? 'border-ok bg-ok-teinte text-encre' : 'border-retard bg-retard-teinte text-encre'
          }`}
        >
          <p>{etat.message}</p>
          {etat.details && etat.details.length > 0 && (
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-encre-douce">
              {etat.details.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
        </div>
      )}
    </form>
  )
}
