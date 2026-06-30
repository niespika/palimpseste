'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { modifierLivreComplet } from './actions'

export interface SemaineEdit { id: string; semaine: number | null; titre: string; chapitres: string; texte: string }

// Éditeur du livre COMPLET (option 1) : auteur (niveau livre) + titre/chapitres/texte
// de chaque semaine, sur un seul écran. Pas de re-découpe du PDF (texte seul). Toute
// entrée d'édition (le bouton du haut OU une semaine) ouvre le même éditeur.
export default function EditeurLivre({ livreId, auteur, semaines }: { livreId: string; auteur: string | null; semaines: SemaineEdit[] }) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [auteurVal, setAuteurVal] = useState(auteur ?? '')
  const [rows, setRows] = useState<SemaineEdit[]>(semaines)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  function ouvrir() {
    setAuteurVal(auteur ?? '')
    setRows(semaines.map(s => ({ ...s })))
    setErreur(null)
    setOuvert(true)
  }
  function maj(i: number, champ: 'titre' | 'chapitres' | 'texte', val: string) {
    setRows(prev => prev.map((r, j) => (j === i ? { ...r, [champ]: val } : r)))
  }
  async function enregistrer() {
    setChargement(true); setErreur(null)
    const res = await modifierLivreComplet(livreId, auteurVal, rows.map(r => ({ id: r.id, titre: r.titre, chapitres: r.chapitres, texte: r.texte })))
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
        <p className="text-xs text-muet">Après avoir modifié un texte, pense à régénérer la carte et la référence ci-dessous si besoin.</p>
      </div>
    )
  }

  return (
    <div className="border border-bordure rounded-lg p-3 space-y-3 bg-parchemin-fonce/30">
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Auteur</label>
        <input value={auteurVal} onChange={e => setAuteurVal(e.target.value)} placeholder="Ex. : Nietzsche" className={`${inputCls} sm:max-w-xs`} />
      </div>
      <p className="text-xs text-muet">Modifier le texte ne régénère pas automatiquement la carte ni la référence — utilise « Régénérer » plus bas si besoin.</p>
      <div className="space-y-3">
        {rows.map((r, i) => (
          <div key={r.id} className="border border-bordure rounded-lg p-3 space-y-2 bg-surface">
            <div className="flex items-center gap-2">
              {r.semaine != null && <span className="text-xs font-medium text-muet bg-parchemin-fonce rounded px-1.5 py-0.5">S{r.semaine}</span>}
              <input value={r.titre} onChange={e => maj(i, 'titre', e.target.value)} placeholder="Titre" className={`${inputCls} flex-1`} />
            </div>
            <input value={r.chapitres} onChange={e => maj(i, 'chapitres', e.target.value)} placeholder="Chapitres (ex. : Chap. 1-4)" className={inputCls} />
            <textarea value={r.texte} onChange={e => maj(i, 'texte', e.target.value)} rows={5} placeholder="Texte de la semaine (ancrage IA)" className={`${inputCls} resize-y`} />
          </div>
        ))}
      </div>
      {erreur && <p className="text-retard text-sm">{erreur}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={enregistrer} disabled={chargement} className="bg-bouton text-surface px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50">
          {chargement ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="px-4 py-2 text-sm text-encre-douce hover:bg-parchemin-fonce rounded-lg">Annuler</button>
      </div>
    </div>
  )
}
