// ============================================================================
// CE QUE L'ÉLÈVE VA DEVOIR FAIRE — lu dans l'antichambre, et par l'élève qui
// arrive après le lancement (retours de classe du 22/09/2026, point 5 : « plusieurs
// élèves n'avaient pas compris qu'ils pouvaient mettre des crédences différentes »).
// ⭐ Décision de Louis (22/09) : le tableau « Pourquoi partager tes points »
//    REMPLACE les trois phrases d'abord prévues — il est plus clair.
// ============================================================================
import { BaremePartage } from './BaremePartage'

export function Consignes() {
  return (
    <div className="space-y-3">
      <p className="text-base text-encre leading-relaxed">
        Pour chaque question, répartis <strong>100 points</strong> entre les réponses.
      </p>
      <BaremePartage />
    </div>
  )
}
