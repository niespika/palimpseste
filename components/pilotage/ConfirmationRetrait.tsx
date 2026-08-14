'use client'

import { useEffect, useState } from 'react'
import { apercuRetraitEleve, retirerEleve, type ApercuRetrait } from '@/app/prof/classes/actions'

// ----------------------------------------------------------------------------
// Retrait d'un élève d'une classe — confirmation EN PAGE, jamais `confirm()`.
//
// Accès & classes · L1 (diagnostic du 14/08) : la croix des jetons de classe du
// Pilotage « ne retirait rien ». Le handler s'arrêtait sur sa première ligne,
// `if (!confirm(…)) return` — le dialogue natif est muet dans un aperçu embarqué
// ou un onglet ayant bloqué les dialogues : il rend `false`, aucune requête ne
// part, et le bouton paraît mort. Cinquième morsure du même piège (24/07, C8·L2,
// C8·L3, C7·L1) ; le remède est celui du commit 89625fc (`TableauLive`).
//
// Le panneau dit aussi ce que le dialogue taisait : ce qui va PARTIR, ligne par
// ligne, et ce qui reste. Et l'erreur s'affiche ici, pas dans le vide — c'était
// l'autre moitié du bug côté `GestionEleves`, qui jetait le résultat de l'action.
//
// Deux surfaces partagent ce composant (jeton × du Pilotage, bouton « Retirer »
// du panneau d'une classe) : la garde ne peut plus diverger de l'une à l'autre.
// ----------------------------------------------------------------------------
export default function ConfirmationRetrait({
  classeId,
  eleveId,
  eleveNom,
  classeNom,
  onFerme,
  onRetire,
}: {
  classeId: string
  eleveId: string
  /** Noms connus de l'appelant : affichés tout de suite, avant l'aperçu. */
  eleveNom: string
  classeNom: string
  onFerme: () => void
  /** Appelé après un retrait réussi (rafraîchissement à la charge de l'appelant). */
  onRetire: () => void
}) {
  const [apercu, setApercu] = useState<ApercuRetrait | null>(null)
  const [pending, setPending] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // L'aperçu se charge à l'ouverture : le prof lit ce qui va partir AVANT de
  // décider. Un échec de lecture n'empêche pas le geste — il le prive de son
  // détail, ce qu'on dit plutôt que de le taire.
  useEffect(() => {
    let vivant = true
    const fd = new FormData()
    fd.append('classeId', classeId)
    fd.append('eleveId', eleveId)
    apercuRetraitEleve(fd)
      .then((r) => {
        if (!vivant) return
        if ('error' in r) setErreur(r.error)
        else setApercu(r)
      })
      .catch(() => { if (vivant) setErreur('L’aperçu du travail à supprimer n’a pas pu être chargé.') })
    return () => { vivant = false }
  }, [classeId, eleveId])

  async function confirmer() {
    setPending(true)
    setErreur(null)
    try {
      const fd = new FormData()
      fd.append('classeId', classeId)
      fd.append('eleveId', eleveId)
      const r = await retirerEleve(fd)
      if (r?.error) { setErreur(r.error); return }
      onRetire()
    } catch {
      setErreur('Le retrait n’a pas abouti (erreur serveur). Réessaie — rien n’a été supprimé.')
    } finally {
      setPending(false)
    }
  }

  const lignes = apercu?.lignes ?? []
  const autres = apercu?.autresClasses ?? []

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => !pending && onFerme()}
    >
      <div className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-serif text-encre">
          Retirer {eleveNom} de {classeNom} ?
        </h3>

        <div className="space-y-2 text-sm text-encre-douce">
          {apercu === null && !erreur && <p className="text-muet">Lecture de son travail dans cette classe…</p>}
          {apercu !== null && (lignes.length > 0 ? (
            <>
              <p className="text-attention">Son travail dans cette classe sera supprimé :</p>
              <ul className="list-disc pl-5 space-y-0.5 text-attention">
                {lignes.map((l) => <li key={l}>{l}</li>)}
              </ul>
            </>
          ) : (
            <p className="text-muet">Il n’a encore aucun travail dans cette classe.</p>
          ))}
          {apercu !== null && (
            <p className="text-muet">
              Son compte n’est pas touché.{' '}
              {autres.length > 0
                ? `Il reste inscrit en ${autres.join(', ')}, où son travail est intact.`
                : 'C’est sa dernière classe.'}
            </p>
          )}
        </div>

        {erreur && <p className="text-sm text-retard">{erreur}</p>}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onFerme}
            disabled={pending}
            className="px-4 py-2 text-sm bg-parchemin-fonce text-encre-douce rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={confirmer}
            disabled={pending}
            className="px-4 py-2 text-sm bg-retard text-surface rounded-lg hover:opacity-90 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
          >
            {pending ? 'Retrait…' : 'Retirer de la classe'}
          </button>
        </div>
      </div>
    </div>
  )
}
