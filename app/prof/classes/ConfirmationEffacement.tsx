'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { effacerClasse } from './actions'

interface Props {
  classeId: string
  classeNom: string
  nbEleves?: number
  /** Variante d'affichage du bouton déclencheur. */
  variante?: 'lien' | 'bouton'
}

// Flux de confirmation d'effacement (Lot 2) — 3 étapes à friction délibérée,
// irréversible. Réutilisable (gestion de classe, rappels du dashboard).
export default function ConfirmationEffacement({ classeId, classeNom, nbEleves, variante = 'lien' }: Props) {
  const router = useRouter()
  const [etape, setEtape] = useState(0) // 0 = fermé, 1, 2, 3
  const [saisie, setSaisie] = useState('')
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  function fermer() {
    setEtape(0); setSaisie(''); setErreur(null)
  }

  async function confirmer() {
    if (saisie.trim() !== classeNom) return
    setPending(true); setErreur(null)
    const fd = new FormData()
    fd.append('id', classeId)
    fd.append('confirmation', saisie.trim())
    const res = await effacerClasse(fd)
    setPending(false)
    if (res?.error) { setErreur(res.error); return }
    fermer()
    router.refresh()
  }

  const declencheur = variante === 'bouton'
    ? 'text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700'
    : 'text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors'

  return (
    <>
      <button onClick={() => setEtape(1)} className={declencheur}>Effacer</button>

      {etape > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={fermer}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif text-stone-900">
              Effacer « {classeNom} »
            </h3>

            {etape === 1 && (
              <>
                <div className="space-y-3 text-sm text-stone-600">
                  <p className="text-red-700 font-medium">
                    Action définitive et irréversible.
                  </p>
                  <p>
                    Tout le travail
                    {typeof nbEleves === 'number' ? ` des ${nbEleves} élève${nbEleves > 1 ? 's' : ''}` : ' des élèves'}
                    {' '}de cette classe sera <strong>supprimé</strong> : fragments, essais, résultats
                    de quizz, révisions de flashcards, synthèses Codex.
                  </p>
                  <p className="text-stone-500">
                    Les <strong>comptes élèves</strong> et leur travail dans <strong>d'autres classes</strong> ne
                    sont pas touchés. Le <strong>contenu Scriptorium</strong> est conservé (détaché).
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={fermer} className="px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
                  <button onClick={() => setEtape(2)} className="px-3 py-1.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-900">Continuer</button>
                </div>
              </>
            )}

            {etape === 2 && (
              <>
                <div className="text-sm text-stone-600 space-y-2">
                  <p>Récapitulatif :</p>
                  <ul className="list-disc pl-5 space-y-1 text-stone-700">
                    <li><strong>Supprimé</strong> : inscriptions + tout le travail élève scopé sur cette classe</li>
                    <li><strong>Détaché (conservé)</strong> : ressources Scriptorium, définitions de quizz</li>
                    <li><strong>Intact</strong> : comptes élèves, travail dans les autres classes</li>
                  </ul>
                  <p className="text-stone-500">Aucune annulation possible après confirmation.</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEtape(1)} className="px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Retour</button>
                  <button onClick={() => setEtape(3)} className="px-3 py-1.5 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-900">Continuer</button>
                </div>
              </>
            )}

            {etape === 3 && (
              <>
                <div className="text-sm text-stone-600 space-y-2">
                  <p>Pour confirmer, retape le nom exact de la classe :</p>
                  <p className="font-mono text-stone-900 bg-stone-100 rounded px-2 py-1 inline-block">{classeNom}</p>
                  <input
                    autoFocus
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    placeholder="Nom de la classe"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  {erreur && <p className="text-red-600 text-sm">{erreur}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={fermer} className="px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100 rounded-lg">Annuler</button>
                  <button
                    onClick={confirmer}
                    disabled={pending || saisie.trim() !== classeNom}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pending ? 'Effacement…' : 'Effacer définitivement'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
