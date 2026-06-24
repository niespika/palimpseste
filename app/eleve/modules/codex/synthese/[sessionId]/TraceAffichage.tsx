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
    return <p className="text-center text-muet text-sm py-8">Retour validé, sans correction à signaler.</p>
  }

  return (
    <div className="space-y-4">
      {/* Tuile — ce que l'élève n'a pas su dire */}
      {nbErreurs > 0 && (
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-bordure bg-parchemin-fonce flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium text-encre-douce">Ce que tu n&apos;as pas su dire</h3>
            <span className="text-xs px-2 py-0.5 bg-parchemin-fonce text-encre-douce rounded-full shrink-0">
              {nbErreurs} point{nbErreurs > 1 ? 's' : ''}
            </span>
          </div>
          <div className="p-4 space-y-2">
            {trace.erreurs_corrections.map((e, i) => (
              <div key={i} className="bg-parchemin-fonce border border-bordure rounded-lg p-4">
                {e.concept_tag && (
                  <span className="text-xs px-1.5 py-0.5 bg-parchemin-fonce text-muet rounded">{e.concept_tag}</span>
                )}
                <p className="text-sm text-encre-douce mt-2">{e.description}</p>
                <div className="mt-2 pl-3 border-l-2 border-ok">
                  <p className="text-sm text-encre">{e.correction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tuile — synthèse complétée */}
      {trace.synthese_completee && (
        <div className="bg-surface border border-bordure rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-bordure bg-parchemin-fonce">
            <h3 className="text-sm font-medium text-encre-douce">Ta synthèse, complétée</h3>
          </div>
          <div className="p-5">
            <p className="whitespace-pre-wrap text-sm text-encre-douce leading-relaxed">
              {segments.map((s, i) =>
                s.ajout ? (
                  <mark key={i} className="bg-attention-teinte text-attention rounded px-0.5">{s.texte}</mark>
                ) : (
                  <span key={i}>{s.texte}</span>
                )
              )}
            </p>
            <p className="text-xs text-muet mt-3 pt-3 border-t border-bordure">
              <span className="bg-attention-teinte px-1 rounded">surligné</span> = complété par l&apos;IA, d&apos;après ton cours.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
