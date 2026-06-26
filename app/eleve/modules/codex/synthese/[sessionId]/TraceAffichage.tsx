import type { TraceCodex } from '../../actions'
import type { TuileRetour } from '@/components/retours/ValidationLecture'

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

// Contenu (sans en-tête) — l'en-tête + case à cocher sont fournis par ValidationLecture.
function ListeErreurs({ trace }: { trace: TraceCodex }) {
  return (
    <div className="space-y-2">
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
  )
}

function SyntheseCompletee({ texte }: { texte: string }) {
  const segments = segmenterSynthese(texte)
  return (
    <div>
      <p className="whitespace-pre-wrap text-sm text-encre-douce leading-relaxed">
        {segments.map((s, i) =>
          s.ajout ? (
            <mark key={i} className="bg-attention-teinte text-attention rounded px-0.5">{s.texte}</mark>
          ) : (
            <span key={i}>{s.texte}</span>
          ),
        )}
      </p>
      <p className="text-xs text-muet mt-3 pt-3 border-t border-bordure">
        <span className="bg-attention-teinte px-1 rounded">surligné</span> = complété par l&apos;IA, d&apos;après ton cours.
      </p>
    </div>
  )
}

// Tuiles du retour Codex (validation de lecture transversale).
export function tuilesTrace(trace: TraceCodex): TuileRetour[] {
  const tuiles: TuileRetour[] = []
  const nbErreurs = trace.erreurs_corrections.length
  if (nbErreurs > 0) {
    tuiles.push({
      id: 'erreurs',
      titre: `Ce que tu n’as pas su dire (${nbErreurs} point${nbErreurs > 1 ? 's' : ''})`,
      node: <ListeErreurs trace={trace} />,
    })
  }
  if (trace.synthese_completee) {
    tuiles.push({
      id: 'synthese',
      titre: 'Ta synthèse, complétée',
      node: <SyntheseCompletee texte={trace.synthese_completee} />,
    })
  }
  if (tuiles.length === 0) {
    tuiles.push({
      id: 'vide',
      titre: 'Retour',
      node: <p className="text-center text-muet text-sm py-4">Retour validé, sans correction à signaler.</p>,
    })
  }
  return tuiles
}
