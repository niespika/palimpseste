// ============================================================================
// C4 · L9 — « LE PROFESSEUR VOIT CE QU'IL A À CONCEVOIR, DANS SON MODULE. »
// ----------------------------------------------------------------------------
// « Les lignes de plan *à concevoir* s'affichent dans CODEX pour l'écriture,
//   dans ALETHEIA pour la lecture, avec leur DATE et leur RETARD — c'est le
//   régime DÉJÀ EN PLACE pour la synthèse et pour le quiz. » — `07-` §2, C4-L9
//
// Un seul encart, deux modules : le même vocabulaire que les deux existants —
// la date effective, le drapeau de retard, et un deep-link vers la conception.
//
// ⚠️ GATE OFF → LISTE VIDE → RIEN NE S'AFFICHE, et la page du module est
//    INCHANGÉE. C'est ce que fait `examensAConcevoir` à sa première ligne.
// ============================================================================

import Link from 'next/link'
import { formatJour } from '@/utils/fuseau'
import type { ExamenAConcevoir } from '@/utils/examens/plan'
import type { ModuleExamen } from '@/utils/examens/types'

export default function EncartAConcevoir({
  module, examens,
}: { module: ModuleExamen; examens: ExamenAConcevoir[] }) {
  if (examens.length === 0) return null
  return (
    <div className="bg-surface border border-bordure rounded-xl p-4">
      <h3 className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-muet mb-2">
        Examens diagnostiques à concevoir · {examens.length}
      </h3>
      <div className="space-y-2">
        {examens.map((e) => (
          <div key={e.planifieId}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-bordure px-3 py-2">
            <span className="font-corps text-sm text-encre flex-1 min-w-0 truncate">
              {module === 'codex' ? 'Écriture' : 'Lecture'} — examen diagnostique
              {e.fenetre && <span className="text-muet"> · {e.fenetre}</span>}
              {e.classeNom && <span className="text-muet"> — {e.classeNom}</span>}
            </span>
            <span className={`font-ui text-xs shrink-0 ${e.enRetard ? 'text-retard' : 'text-muet'}`}>
              {formatJour(e.echeance, { day: 'numeric', month: 'short' })}
              {e.enRetard && ' · en retard'}
            </span>
            <Link href={`/prof/${module}/examen-diagnostique/${e.planifieId}`}
              className="font-ui text-xs text-pigment hover:underline shrink-0">
              Concevoir →
            </Link>
          </div>
        ))}
      </div>
      <p className="font-ui text-[11px] text-muet mt-2">
        La date vient du plan d’évaluation ; l’écran de conception ne la demande jamais.
      </p>
    </div>
  )
}
