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
  /** Où aller après effacement. Par défaut on rafraîchit la page courante ; depuis
   *  une page propre à la classe (Pilotage), on redirige (sinon 404 au refresh). */
  onSuccessHref?: string
}

// Flux de confirmation d'effacement (Lot 2) — 3 étapes à friction délibérée,
// irréversible. Réutilisable (gestion de classe, rappels du dashboard).
export default function ConfirmationEffacement({ classeId, classeNom, nbEleves, variante = 'lien', onSuccessHref }: Props) {
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
    if (onSuccessHref) router.push(onSuccessHref)
    else router.refresh()
  }

  const declencheur = variante === 'bouton'
    ? 'text-xs px-3 py-1.5 rounded-lg bg-retard text-surface hover:opacity-90'
    : 'text-xs text-retard hover:opacity-80 hover:bg-retard-teinte px-2 py-1 rounded-lg transition-colors'

  return (
    <>
      <button onClick={() => setEtape(1)} className={declencheur}>Effacer</button>

      {etape > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={fermer}
        >
          <div
            className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-serif text-encre">
              Effacer « {classeNom} »
            </h3>

            {etape === 1 && (
              <>
                <div className="space-y-3 text-sm text-encre-douce">
                  <p className="text-retard font-medium">
                    Action définitive et irréversible.
                  </p>
                  <p>
                    Tout le travail
                    {typeof nbEleves === 'number' ? ` des ${nbEleves} élève${nbEleves > 1 ? 's' : ''}` : ' des élèves'}
                    {' '}de cette classe sera <strong>supprimé</strong> : fragments, essais, résultats
                    de quizz, révisions de flashcards, synthèses Codex.
                  </p>
                  <p className="text-muet">
                    Les <strong>comptes élèves</strong> et leur travail dans <strong>d'autres classes</strong> ne
                    sont pas touchés. Le <strong>contenu Scriptorium</strong> est conservé (détaché).
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={fermer} className="px-3 py-1.5 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Annuler</button>
                  <button onClick={() => setEtape(2)} className="px-3 py-1.5 text-sm bg-bouton text-surface rounded-lg hover:opacity-90">Continuer</button>
                </div>
              </>
            )}

            {etape === 2 && (
              <>
                <div className="text-sm text-encre-douce space-y-2">
                  <p>Récapitulatif :</p>
                  <ul className="list-disc pl-5 space-y-1 text-encre-douce">
                    <li><strong>Supprimé</strong> : inscriptions + tout le travail élève scopé sur cette classe</li>
                    <li><strong>Détaché (conservé)</strong> : ressources Scriptorium, définitions de quizz</li>
                    <li><strong>Intact</strong> : comptes élèves, travail dans les autres classes</li>
                  </ul>
                  <p className="text-muet">Aucune annulation possible après confirmation.</p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEtape(1)} className="px-3 py-1.5 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Retour</button>
                  <button onClick={() => setEtape(3)} className="px-3 py-1.5 text-sm bg-bouton text-surface rounded-lg hover:opacity-90">Continuer</button>
                </div>
              </>
            )}

            {etape === 3 && (
              <>
                <div className="text-sm text-encre-douce space-y-2">
                  <p>Pour confirmer, retape le nom exact de la classe :</p>
                  <p className="font-mono text-encre bg-parchemin-fonce rounded px-2 py-1 inline-block">{classeNom}</p>
                  <input
                    autoFocus
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    placeholder="Nom de la classe"
                    className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-retard"
                  />
                  {erreur && <p className="text-retard text-sm">{erreur}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={fermer} className="px-3 py-1.5 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Annuler</button>
                  <button
                    onClick={confirmer}
                    disabled={pending || saisie.trim() !== classeNom}
                    className="px-3 py-1.5 text-sm bg-retard text-surface rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
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
