import type { TraceCodex } from '../../actions'

// Découpe le texte en segments en mettant en évidence [AJOUT] … [/AJOUT]
function segmenterSynthese(texte: string): { ajout: boolean; texte: string }[] {
  const segments: { ajout: boolean; texte: string }[] = []
  const regex = /\[AJOUT\]([\s\S]*?)\[\/AJOUT\]/g
  let dernier = 0
  let m: RegExpExecArray | null
  while ((m = regex.exec(texte)) !== null) {
    if (m.index > dernier) segments.push({ ajout: false, texte: texte.slice(dernier, m.index) })
    segments.push({ ajout: true, texte: m[1] })
    dernier = regex.lastIndex
  }
  if (dernier < texte.length) segments.push({ ajout: false, texte: texte.slice(dernier) })
  return segments
}

export function TraceAffichage({ trace }: { trace: TraceCodex }) {
  const segments = trace.synthese_completee ? segmenterSynthese(trace.synthese_completee) : []
  const nbErreurs = trace.erreurs_corrections.length

  if (nbErreurs === 0 && !trace.synthese_completee) {
    return <p className="text-center text-stone-400 text-sm py-8">Retour validé, sans correction à signaler.</p>
  }

  return (
    <div className="space-y-4">
      {/* Tuile — ce que l'élève n'a pas su dire */}
      {nbErreurs > 0 && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 bg-stone-50 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-stone-700">Ce que tu n&apos;as pas su dire</h3>
            <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-600 rounded-full shrink-0">
              {nbErreurs} point{nbErreurs > 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4 space-y-2">
            {trace.erreurs_corrections.map((e, i) => (
              <div key={i} className="bg-stone-50 border border-stone-100 rounded-lg p-4">
                {e.concept_tag && (
                  <span className="text-xs px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">{e.concept_tag}</span>
                )}
                <p className="text-sm text-stone-600 mt-2">{e.description}</p>
                <div className="mt-2 pl-3 border-l-2 border-green-300">
                  <p className="text-sm text-stone-800">{e.correction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tuile — synthèse complétée */}
      {trace.synthese_completee && (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
            <h3 className="text-sm font-medium text-stone-700">Ta synthèse, complétée</h3>
          </div>
          <div className="p-5">
            <p className="whitespace-pre-wrap text-sm text-stone-700 leading-relaxed">
              {segments.map((s, i) =>
                s.ajout ? (
                  <mark key={i} className="bg-amber-100 text-amber-900 rounded px-0.5">{s.texte}</mark>
                ) : (
                  <span key={i}>{s.texte}</span>
                )
              )}
            </p>
            <p className="text-xs text-stone-400 mt-3 pt-3 border-t border-stone-100">
              <span className="bg-amber-100 px-1 rounded">surligné</span> = complété par l&apos;IA, d&apos;après ton cours.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
