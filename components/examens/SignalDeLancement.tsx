// ============================================================================
// C4 · L9 — CE QUE L'ÉLÈVE VOIT QUAND LE PROFESSEUR OUVRE LE DÉPÔT.
// ----------------------------------------------------------------------------
// « Quand le professeur ouvre le dépôt, l'élève LE VOIT et entre PAR SON
//   MODULE. »                                                 — `07-` §2, C4-L9
//
// ⚠️ CE N'EST PAS LE « À FAIRE » DU TABLEAU DE BORD (C6-L2) : celui-là naît de
//    l'ASSIGNATION, celui-ci du LANCEMENT. Deux événements, deux signaux — et on
//    n'en fabrique pas un seul pour les deux.
//
// ⚠️ AUCUNE CONSIGNE N'EST RENDUE ICI, seulement sa première ligne : la copie et
//    la consigne entière vivent à l'écran de passation, derrière l'ouverture.
// ============================================================================

import Link from 'next/link'
import type { SignalDeLancement as Signal } from '@/utils/examens/signal'

export default function SignalDeLancement({ signaux }: { signaux: Signal[] }) {
  if (signaux.length === 0) return null
  return (
    <div className="space-y-2 mb-6">
      {signaux.map((s) => (
        <Link key={s.depotId} href={s.href}
          className="block bg-ok-teinte border border-ok rounded-xl p-5 hover:opacity-90 transition-colors">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-ok animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="font-medium text-ok text-sm truncate">
                Passation en classe ouverte — {s.titre}
              </p>
              <p className="text-xs text-ok">
                Ton professeur a ouvert le dépôt → appuie pour déposer ta copie
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
