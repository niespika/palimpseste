'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { modifierLivreComplet } from './actions'
import NavigateurDecoupe, { type Semaine } from './NavigateurDecoupe'
import { reassemblerLivre } from './decoupe-utils'

export interface SemaineEdit { id: string; semaine: number | null; titre: string; chapitres: string; texte: string }

// Mode MODIFICATION : même éditeur que la création. On réassemble le texte des
// semaines en un bloc, on pré-place les marqueurs aux bornes existantes et on
// pré-remplit titres/chapitres, puis on laisse re-découper. Pas d'édition du texte
// lui-même ; avertissement (dans le navigateur) si des lignes sortent des semaines.
export default function EditeurLivre({ livreId, auteur, semaines }: { livreId: string; auteur: string | null; semaines: SemaineEdit[] }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [auteurVal, setAuteurVal] = useState(auteur ?? '')
  const [etat, setEtat] = useState<{ sem: Semaine[]; valide: boolean }>({ sem: [], valide: false })
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // Réassemblage (mémoïsé) : texte continu + bornes de ligne de chaque semaine.
  const { pages, bornesInitiales } = useMemo(() => {
    const { texte, bornes } = reassemblerLivre(semaines.map(s => s.texte))
    return {
      pages: [texte],
      bornesInitiales: semaines.map((s, i) => ({
        titre: s.titre, chapitres: s.chapitres,
        debut: { p: 1, l: bornes[i].debutLigne }, fin: { p: 1, l: bornes[i].finLigne },
      })) as Semaine[],
    }
  }, [semaines])

  const onEtat = useCallback((sem: Semaine[], valide: boolean) => setEtat({ sem, valide }), [])

  function ouvrir() { setAuteurVal(auteur ?? ''); setErreur(null); setOuvert(true) }

  async function enregistrer() {
    setChargement(true); setErreur(null)
    const payload = etat.sem.map((s, i) => ({
      id: semaines[i].id,
      titre: s.titre,
      chapitres: s.chapitres,
      debutLigne: s.debut?.l ?? 0,
      finLigne: s.fin?.l ?? 0,
    }))
    const nbLignesAttendu = (pages[0] ?? '').split('\n').length
    const res = await modifierLivreComplet(livreId, auteurVal, payload, nbLignesAttendu)
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setOuvert(false)
    router.refresh()
  }

  const inputCls = 'w-full px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment'

  if (!ouvert) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-encre-douce">Auteur : <span className="font-medium text-encre">{auteur || '—'}</span></p>
          <button type="button" onClick={ouvrir} className="text-xs bg-bouton text-surface px-3 py-1.5 rounded hover:opacity-90">Modifier le livre</button>
        </div>
        {semaines.length === 0 ? (
          <p className="text-sm text-muet">Aucune semaine pour ce livre.</p>
        ) : (
          <div className="space-y-1.5">
            {semaines.map(s => (
              <button type="button" key={s.id} onClick={ouvrir}
                className="w-full text-left border border-bordure rounded-lg px-3 py-2 hover:bg-parchemin-fonce/40">
                <div className="flex items-center gap-2 flex-wrap">
                  {s.semaine != null && <span className="text-xs bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded">S{s.semaine}</span>}
                  <span className="text-sm font-medium text-encre">{s.titre}</span>
                  {s.chapitres && <span className="text-xs bg-info-teinte text-info px-1.5 py-0.5 rounded">{s.chapitres}</span>}
                  <span className="ml-auto text-xs text-muet">Modifier</span>
                </div>
                {s.texte && <p className="text-xs text-muet mt-1 line-clamp-2 whitespace-pre-wrap">{s.texte}</p>}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-muet">Après une re-découpe, pense à régénérer la carte et la référence ci-dessous si besoin.</p>
      </div>
    )
  }

  return (
    <div className="border border-bordure rounded-lg p-3 space-y-3 bg-parchemin-fonce/30">
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Auteur</label>
        <input value={auteurVal} onChange={e => setAuteurVal(e.target.value)} placeholder="Ex. : Nietzsche" className={`${inputCls} sm:max-w-xs`} />
      </div>
      <p className="text-xs text-muet">
        Re-découpe : déplace les marqueurs de début/fin. Le texte lui-même n&apos;est pas modifiable ici, et la carte/référence ne sont pas régénérées
        automatiquement (utilise « Régénérer » plus bas si besoin).
      </p>
      {semaines.length === 0 ? (
        <p className="text-sm text-muet">Aucune semaine à modifier.</p>
      ) : (
        <NavigateurDecoupe pages={pages} nb={semaines.length} bornesInitiales={bornesInitiales} modeModification onEtat={onEtat} />
      )}
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={enregistrer} disabled={chargement || !etat.valide}
          className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {chargement ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Annuler</button>
      </div>
    </div>
  )
}
