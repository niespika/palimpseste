'use client'

// ============================================================================
// LE RAPPORT DE FRAGILITÉS D'UNE CLASSE, CONSERVÉ ET DATÉ (Louis, 23/09 : « par
// classe et daté »). Le dernier en entier ; les précédents repliés, à la date.
// Porte `quazian_rapport_actif` — fermée, la page garde `RapportIA` (d'hier).
// ============================================================================

import { useState } from 'react'
import { formatInstant } from '@/utils/fuseau'
import { genererRapportClasse } from './actions'
import { texteSansMarkdown } from '@/utils/quazian-rapports'

interface Rapport { id: string; contenu: string; created_at: string }

export function RapportsFragilites({ classeId, classeNom, fuseau, rapportsInit }: {
  classeId: string; classeNom: string; fuseau: string; rapportsInit: Rapport[]
}) {
  const [rapports, setRapports] = useState<Rapport[]>(rapportsInit)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [rien, setRien] = useState<string | null>(null)
  const date = (iso: string) => formatInstant(iso, fuseau, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })

  async function generer() {
    setEnCours(true)
    setErreur(null)
    setRien(null)
    try {
      const res = await genererRapportClasse(classeId)
      if ('error' in res) setErreur(res.error)
      else if ('rien' in res) setRien(res.rien)
      else setRapports((prev) => [res.rapport, ...prev])
    } catch {
      setErreur('La génération n’a pas abouti (erreur serveur). Réessaie.')
    } finally {
      setEnCours(false)
    }
  }

  const [dernier, ...precedents] = rapports
  return (
    <div className="bg-surface border border-bordure rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h4 className="text-sm font-medium text-encre-douce">Rapport de fragilités — {classeNom}</h4>
          {dernier && <p className="text-xs text-muet mt-0.5">Le dernier : {date(dernier.created_at)}</p>}
        </div>
        <button
          onClick={generer}
          disabled={enCours}
          className="min-h-11 px-3 py-1.5 text-xs bg-bouton text-surface rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors"
        >
          {enCours ? 'Analyse en cours…' : dernier ? '✦ Nouveau rapport avec l’IA' : '✦ Générer avec l’IA'}
        </button>
      </div>
      {erreur && <p role="alert" className="text-xs text-retard mb-2 whitespace-pre-wrap">{erreur}</p>}
      {rien && <p role="status" className="text-xs text-muet mb-2">{rien}</p>}
      {dernier ? (
        <p className="text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{texteSansMarkdown(dernier.contenu)}</p>
      ) : (
        <p className="text-xs text-muet">
          Analyse les idées fausses et lacunes de cette classe pour proposer des priorités pédagogiques.
          Le rapport est conservé, daté.
        </p>
      )}
      {precedents.length > 0 && (
        <div className="mt-4 border-t border-bordure pt-3">
          <p className="text-xs text-muet mb-1">Rapports précédents</p>
          <ul className="space-y-1">
            {precedents.map((r) => (
              <li key={r.id}>
                <details>
                  <summary className="cursor-pointer text-sm text-encre-douce min-h-11 flex items-center">{date(r.created_at)}</summary>
                  <p className="mt-1 mb-2 text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{texteSansMarkdown(r.contenu)}</p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
