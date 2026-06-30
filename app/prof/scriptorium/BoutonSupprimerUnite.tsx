'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supprimerUnite } from './actions'

interface Props {
  uniteId: string
  label: string
  estLivre: boolean
}

// « Supprimer » une unité / un livre — flux à 3 étapes (friction délibérée), avec
// re-saisie du nom exact. NE supprime PAS la ligne (cf. supprimerUnite : cascades) :
// purge le contenu prof + les artefacts IA Scriptorium, conserve le travail élève /
// Codex / Quazian, et masque la carte. La carte disparaît de Scriptorium.
export default function BoutonSupprimerUnite({ uniteId, label, estLivre }: Props) {
  const router = useRouter()
  const [etape, setEtape] = useState(0) // 0 = fermé, 1, 2, 3
  const [saisie, setSaisie] = useState('')
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  function fermer() {
    setEtape(0); setSaisie(''); setErreur(null)
  }

  async function confirmer() {
    if (saisie.trim() !== label) return
    setPending(true); setErreur(null)
    const res = await supprimerUnite(uniteId)
    setPending(false)
    if (res?.error) { setErreur(res.error); return }
    fermer()
    // La carte est masquée → on quitte le panneau de détail (sinon il pointe une unité absente).
    router.push('/prof/scriptorium?vue=unites')
    router.refresh()
  }

  const motObjet = estLivre ? 'le livre' : "l'unité"

  return (
    <>
      <button
        onClick={() => setEtape(1)}
        className="flex-shrink-0 text-xs text-retard hover:opacity-80 hover:bg-retard-teinte px-2 py-1 rounded-lg transition-colors"
      >
        Supprimer
      </button>

      {etape > 0 && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={fermer}>
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-serif text-encre">Supprimer « {label} »</h3>

            {etape === 1 && (
              <>
                <div className="space-y-3 text-sm text-encre-douce">
                  <p className="text-retard font-medium">Action définitive et irréversible.</p>
                  <p>
                    Le contenu que tu as déposé dans {motObjet} (textes, images) sera <strong>effacé</strong>,
                    ainsi que ce que l&apos;IA a généré dans Scriptorium :
                    {estLivre ? <> la <strong>carte d&apos;architecture</strong> et la <strong>fiche de lecture</strong></> : <> le contenu généré</>}.
                  </p>
                  <p className="text-muet">
                    Le <strong>travail déjà rendu par les élèves</strong> et les <strong>retours d&apos;Aletheia</strong>,
                    les <strong>cartes Quazian</strong> et la <strong>synthèse de Codex</strong> ne sont <strong>pas</strong> touchés.
                    Plus aucun nouveau dépôt ne sera possible.
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
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Effacé</strong> : contenu déposé (textes, images){estLivre ? ', carte d’architecture, fiche de lecture' : ', contenu IA Scriptorium'}</li>
                    <li><strong>Conservé</strong> : travail des élèves + retours Aletheia, cartes Quazian, synthèse Codex</li>
                    <li><strong>Effet</strong> : la carte disparaît de Scriptorium et plus aucun dépôt n&apos;est possible</li>
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
                  <p>Pour confirmer, retape le nom exact :</p>
                  <p className="font-mono text-encre bg-parchemin-fonce rounded px-2 py-1 inline-block">{label}</p>
                  <input
                    autoFocus
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                    placeholder="Nom de l'unité"
                    className="w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-retard"
                  />
                  {erreur && <p className="text-retard text-sm">{erreur}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={fermer} className="px-3 py-1.5 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Annuler</button>
                  <button
                    onClick={confirmer}
                    disabled={pending || saisie.trim() !== label}
                    className="px-3 py-1.5 text-sm bg-retard text-surface rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {pending ? 'Suppression…' : 'Supprimer définitivement'}
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
