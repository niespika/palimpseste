'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import FeuillePanneau from './FeuillePanneau'
import ConfirmationEffacement from '@/app/prof/classes/ConfirmationEffacement'
import { inscrireEleve, retirerEleve } from '@/app/prof/classes/actions'

interface Eleve { id: string; display_name: string }

interface Props {
  classeId: string
  classeNom: string
  inscrits: Eleve[]
  tousEleves: Eleve[]
}

// Gestion des élèves de la classe (rapatriée de l'ancien GestionClasse) : ajouter
// un élève existant, retirer un inscrit, effacer la classe. Même feuille/dialog
// que le panneau d'accès. Réutilise les actions serveur existantes.
export default function GestionEleves({ classeId, classeNom, inscrits, tousEleves }: Props) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [pending, setPending] = useState(false)
  const [selEleve, setSelEleve] = useState('')

  const inscritsIds = new Set(inscrits.map((e) => e.id))
  const disponibles = tousEleves.filter((e) => !inscritsIds.has(e.id))

  async function ajouter() {
    if (!selEleve) return
    setPending(true)
    const fd = new FormData()
    fd.append('classeId', classeId)
    fd.append('eleveId', selEleve)
    await inscrireEleve(fd)
    setSelEleve('')
    setPending(false)
    router.refresh()
  }

  async function retirer(eleveId: string, nom: string) {
    if (!confirm(`Retirer ${nom} de cette classe ? Son travail dans CETTE classe sera supprimé (compte et autres classes intacts).`)) return
    setPending(true)
    const fd = new FormData()
    fd.append('classeId', classeId)
    fd.append('eleveId', eleveId)
    await retirerEleve(fd)
    setPending(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="font-ui text-xs text-encre bg-surface border border-bordure rounded-lg px-3 py-1.5 hover:bg-parchemin-fonce transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
      >
        ＋ Ajouter un élève
      </button>

      {ouvert && (
        <FeuillePanneau
          titre="Gérer les élèves"
          sousTitre={classeNom}
          onFermer={() => setOuvert(false)}
        >
          {/* Ajouter */}
          <div className="flex items-center gap-2">
            <select
              value={selEleve}
              onChange={(e) => setSelEleve(e.target.value)}
              disabled={disponibles.length === 0}
              className="flex-1 font-ui text-sm border border-bordure rounded-lg px-2 py-2 bg-surface disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
            >
              <option value="">
                {disponibles.length === 0 ? 'Tous les élèves sont inscrits' : 'Ajouter un élève…'}
              </option>
              {disponibles.map((e) => (
                <option key={e.id} value={e.id}>{e.display_name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={ajouter}
              disabled={pending || !selEleve}
              className="font-ui text-sm bg-bouton text-surface px-3 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
            >
              Inscrire
            </button>
          </div>

          {/* Liste */}
          <div className="mt-4">
            <p className="font-ui text-[11px] uppercase tracking-wide text-muet mb-2">
              Inscrits ({inscrits.length})
            </p>
            {inscrits.length > 0 ? (
              <ul className="divide-y divide-bordure border border-bordure rounded-lg">
                {inscrits.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="font-corps text-sm text-encre truncate">{e.display_name}</span>
                    <button
                      type="button"
                      onClick={() => retirer(e.id, e.display_name)}
                      disabled={pending}
                      className="font-ui text-xs text-muet hover:text-retard hover:bg-retard-teinte px-2 py-1 rounded transition-colors disabled:opacity-50 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-corps text-sm text-muet">Aucun élève inscrit.</p>
            )}
          </div>

          {/* Zone danger */}
          <div className="mt-5 pt-4 border-t border-dashed border-bordure flex items-center justify-between gap-2">
            <span className="font-ui text-xs text-muet">Effacer définitivement cette classe.</span>
            <ConfirmationEffacement classeId={classeId} classeNom={classeNom} nbEleves={inscrits.length} variante="bouton" onSuccessHref="/prof/classes" />
          </div>
        </FeuillePanneau>
      )}
    </>
  )
}
