'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import FormulaireContenuBiblio from './FormulaireContenuBiblio'
import LigneContenuBiblio, { type ContenuBiblio } from './LigneContenuBiblio'
import { restaurerContenuBiblio, purgerContenuBiblio } from './actions'

// Onglet bibliothèque (Textes OU Cours). Liste + recherche client + création +
// corbeille (contenus soft-deletés restaurables — schema-S7).
export default function BibliothequeContenus({
  type,
  contenus,
  corbeille,
  notionsConnues,
}: {
  type: 'texte' | 'cours'
  contenus: ContenuBiblio[]
  corbeille: { id: string; titre: string }[]
  /** ⭐ C4-L16 — les notions que la BANQUE déclare, pour que l'écran du cours
   *  les propose : « on ne rattache pas en tapant, on rattache en choisissant ».
   *  Vide sur l'onglet Textes. */
  notionsConnues: string[]
}) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [voirCorbeille, setVoirCorbeille] = useState(false)
  const [chargement, setChargement] = useState<string | null>(null)

  const estTexte = type === 'texte'

  const filtres = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return contenus
    return contenus.filter(
      c => c.titre.toLowerCase().includes(s) || (c.auteur ?? '').toLowerCase().includes(s),
    )
  }, [q, contenus])

  async function handleRestaurer(id: string) {
    setChargement(id)
    const res = await restaurerContenuBiblio(id)
    setChargement(null)
    if (res.error) { alert(res.error); return }
    router.refresh()
  }

  async function handlePurger(id: string) {
    if (!confirm('Supprimer DÉFINITIVEMENT ce contenu ? Il sera retiré des parcours où il apparaît comme « contenu retiré ». Irréversible.')) return
    setChargement(id)
    const res = await purgerContenuBiblio(id)
    setChargement(null)
    if (res.error) { alert(res.error); return }
    router.refresh()
  }

  async function handleViderCorbeille() {
    if (!confirm(`Vider la corbeille : supprimer DÉFINITIVEMENT ${corbeille.length} contenu(s) ? Ils seront retirés des parcours où ils apparaissent comme « contenu retiré ». Irréversible.`)) return
    setChargement('__all__')
    for (const c of corbeille) await purgerContenuBiblio(c.id)
    setChargement(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <FormulaireContenuBiblio type={type} notionsConnues={notionsConnues} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={`Rechercher un ${estTexte ? 'texte' : 'cours'} (titre, auteur)…`}
          className="flex-1 min-w-48 px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre"
        />
        <span className="text-xs text-muet">
          {filtres.length} {estTexte ? 'texte' : 'cours'}{filtres.length > 1 ? (estTexte ? 's' : '') : ''}
        </span>
      </div>

      {filtres.length === 0 ? (
        <p className="text-sm text-muet">
          {q.trim()
            ? 'Aucun résultat.'
            : `Aucun ${estTexte ? 'texte' : 'cours'} pour l’instant. Ajoute-en un ci-dessus — il sera réutilisable dans tes parcours.`}
        </p>
      ) : (
        <div className="space-y-2">
          {filtres.map(c => <LigneContenuBiblio key={c.id} item={c} notionsConnues={notionsConnues} />)}
        </div>
      )}

      {corbeille.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setVoirCorbeille(v => !v)}
              className="text-xs text-muet hover:text-encre"
            >
              {voirCorbeille ? '▾' : '▸'} Corbeille ({corbeille.length})
            </button>
            {voirCorbeille && (
              <button
                onClick={handleViderCorbeille}
                disabled={chargement === '__all__'}
                className="text-xs text-retard hover:underline disabled:opacity-50"
              >
                {chargement === '__all__' ? '…' : 'Vider la corbeille'}
              </button>
            )}
          </div>
          {voirCorbeille && (
            <div className="mt-2 space-y-1.5">
              {corbeille.map(c => (
                <div key={c.id} className="flex items-center justify-between gap-3 border border-bordure rounded-lg px-3 py-2">
                  <span className="text-sm text-muet line-through truncate">{c.titre}</span>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      onClick={() => handleRestaurer(c.id)}
                      disabled={chargement === c.id}
                      className="text-xs text-encre-douce hover:text-encre disabled:opacity-50"
                    >
                      {chargement === c.id ? '…' : 'Restaurer'}
                    </button>
                    <button
                      onClick={() => handlePurger(c.id)}
                      disabled={chargement === c.id}
                      className="text-xs text-muet hover:text-retard disabled:opacity-50"
                    >
                      Supprimer déf.
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
