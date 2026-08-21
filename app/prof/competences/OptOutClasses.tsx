'use client'

// L'opt-out, au profil de la classe. « Aucune liste d'activation à cocher classe
// par classe, aucune ligne à la main » : le DÉFAUT EST ACTIF, et ce qui se pose
// ici est le retrait — la compétence que ce cours ne travaille pas (07- §1.3).

import { useActionState } from 'react'
import { poserOptOut, type Retour } from './actions'

export default function OptOutClasses({
  classes, competences, etat,
}: {
  classes: Array<{ id: string; nom: string }>
  competences: Array<{ code: string; nom: string }>
  etat: Record<string, boolean>
}) {
  const [retour, action, enCours] = useActionState<Retour | null, FormData>(poserOptOut, null)
  if (classes.length === 0) {
    return <p className="font-ui text-sm text-muet">Aucune classe.</p>
  }
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="min-w-full font-ui text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muet-clair">
              <th className="py-1.5 pr-4">Classe</th>
              {competences.map((c) => <th key={c.code} className="px-2 py-1.5">{c.nom}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-bordure">
            {classes.map((cl) => (
              <tr key={cl.id}>
                <th scope="row" className="py-2 pr-4 text-left font-normal text-encre">{cl.nom}</th>
                {competences.map((c) => {
                  const cle = `${cl.id}|${c.code}`
                  // Le DÉFAUT est actif : une ligne absente vaut « active ».
                  const active = etat[cle] ?? true
                  return (
                    <td key={c.code} className="px-2 py-2">
                      <form action={action}>
                        <input type="hidden" name="classe_id" value={cl.id} />
                        <input type="hidden" name="competence" value={c.code} />
                        <input type="hidden" name="active" value={active ? 'non' : 'oui'} />
                        <button
                          type="submit" disabled={enCours}
                          aria-label={`${active ? 'Retirer' : 'Remettre'} ${c.nom} dans ${cl.nom}`}
                          className={`rounded-md border px-2 py-0.5 text-xs disabled:opacity-50 ${
                            active
                              ? 'border-ok bg-ok-teinte text-encre'
                              : 'border-bordure-bouton bg-parchemin-fonce text-muet line-through'
                          }`}
                        >
                          {active ? 'active' : 'opt-out'}
                        </button>
                      </form>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {retour && (
        <p className={`font-ui text-sm ${retour.ok ? 'text-ok' : 'text-retard'}`} role="status">
          {retour.message}
        </p>
      )}
    </div>
  )
}
