// ----------------------------------------------------------------------------
// Composant réutilisable (Lot 3) — détail d'une classe : liste des élèves avec
// un `statut` injecté par l'appelant (au dashboard : où en est l'élève ;
// ailleurs : la donnée du module) et des `actions` optionnelles attachables.
// Le shell est constant ; les Lots 4-8 fournissent leur payload.
// ----------------------------------------------------------------------------

export interface LigneEleve {
  id: string
  display_name: string
  /** Statut injecté (badges, chiffres…). */
  statut?: React.ReactNode
  /** Actions injectées sur la ligne (ex. retirer l'élève). */
  actions?: React.ReactNode
}

interface Props {
  nom: string
  sousTitre?: string
  eleves: LigneEleve[]
  /** Action au niveau de la classe (ex. effacer). */
  action?: React.ReactNode
  vide?: React.ReactNode
}

export default function DetailClasse({ nom, sousTitre, eleves, action, vide }: Props) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-stone-900">{nom}</h3>
          {sousTitre && <p className="text-xs text-stone-400 mt-0.5">{sousTitre}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {eleves.length === 0 ? (
        <div className="px-5 py-6 text-sm text-stone-400">{vide ?? 'Aucun élève inscrit.'}</div>
      ) : (
        <ul className="divide-y divide-stone-100">
          {eleves.map((e) => (
            <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800">{e.display_name}</p>
                {e.statut && <div className="mt-1">{e.statut}</div>}
              </div>
              {e.actions && <div className="flex-shrink-0">{e.actions}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
