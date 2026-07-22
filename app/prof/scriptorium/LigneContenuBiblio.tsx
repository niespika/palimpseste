'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  modifierContenuBiblio,
  supprimerContenuBiblio,
  ajouterImageContenu,
  supprimerImageContenu,
} from './actions'
import type { ImageItem } from './LigneContenu'

// Item de bibliothèque (texte ou cours réutilisable). AUCUN lien classe/unité/semaine.
export interface ContenuBiblio {
  id: string
  type: 'texte' | 'cours'
  titre: string
  auteur: string | null
  texte: string | null
  chapitres: string | null
  images: ImageItem[]
  /** Nombre de créneaux de parcours qui référencent ce contenu (compteur d'usages). */
  nbParcours: number
  /** Nombre de sections de la découpe (RAG L2) — toujours 0 pour un texte. */
  nbSections: number
}

export default function LigneContenuBiblio({ item }: { item: ContenuBiblio }) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [ajoutImage, setAjoutImage] = useState(false)
  const [legendeImg, setLegendeImg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErreur(null)
    setChargement(true)
    const fd = new FormData(e.currentTarget)
    fd.append('id', item.id)
    let res = await modifierContenuBiblio(fd)
    // Garde L2 : changer le texte d'un cours découpé efface sa découpe (les sections
    // stockent leur part du texte) et re-matérialise les instances en « cours entier ».
    if (res.needsConfirm) {
      const ok = confirm(
        `Le texte de ce cours change : sa découpe en ${res.nbSections} section${(res.nbSections ?? 0) > 1 ? 's' : ''} sera effacée ` +
        `et il redeviendra un élément entier dans les parcours de classe (« vu » conservé seulement si tout était vu). Continuer ?`,
      )
      if (!ok) { setChargement(false); return }
      fd.append('force', '1')
      res = await modifierContenuBiblio(fd)
    }
    setChargement(false)
    if (res.error) { setErreur(res.error); return }
    setEdition(false)
    router.refresh()
  }

  async function handleSupprimer() {
    const msg = item.nbParcours > 0
      ? `« ${item.titre} » est utilisé dans ${item.nbParcours} parcours ; il y apparaîtra comme « contenu retiré » (restaurable). Le retirer de la bibliothèque ?`
      : `Supprimer « ${item.titre} » ?`
    if (!confirm(msg)) return
    setChargement(true)
    const res = await supprimerContenuBiblio(item.id)
    setChargement(false)
    if (res.error) { alert(res.error); return }
    router.refresh()
  }

  async function handleAjouterImage() {
    const f = fileRef.current?.files?.[0]
    if (!f) return
    setChargement(true)
    const fd = new FormData()
    fd.append('contenuId', item.id)
    fd.append('fichier', f)
    fd.append('legende', legendeImg)
    const res = await ajouterImageContenu(fd)
    setChargement(false)
    if (res.error) { alert(res.error); return }
    setAjoutImage(false); setLegendeImg('')
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  async function handleSupprimerImage(imageId: string) {
    setChargement(true)
    const res = await supprimerImageContenu(imageId)
    setChargement(false)
    if (res.error) { alert(res.error); return }
    router.refresh()
  }

  if (edition) {
    return (
      <form onSubmit={handleSave} className="bg-parchemin-fonce border border-bordure rounded-lg p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input name="titre" defaultValue={item.titre} required placeholder="Titre"
            className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
          <input name="auteur" defaultValue={item.auteur ?? ''} placeholder="Auteur (optionnel)"
            className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
        </div>
        <input name="chapitres" defaultValue={item.chapitres ?? ''} placeholder="Chapitres / références (ex. : Chap. 1-4) — optionnel"
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
        <textarea name="texte" defaultValue={item.texte ?? ''} rows={5} placeholder="Corps du contenu (texte étudié, leçon…)"
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment resize-y" />

        {item.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {item.images.map(img => (
              <div key={img.id} className="relative">
                {img.url && <img src={img.url} alt={img.legende ?? ''} className="w-20 h-20 object-cover rounded border border-bordure" />}
                <button type="button" onClick={() => handleSupprimerImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 bg-surface border border-bordure rounded-full w-5 h-5 text-xs text-retard hover:bg-retard-teinte">✕</button>
              </div>
            ))}
          </div>
        )}

        {ajoutImage ? (
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.gif"
              className="text-xs text-encre-douce file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-parchemin-fonce" />
            <input value={legendeImg} onChange={e => setLegendeImg(e.target.value)} placeholder="Légende (optionnel)"
              className="px-2 py-1 border border-bordure rounded text-xs text-encre" />
            <button type="button" onClick={handleAjouterImage} disabled={chargement} className="bg-bouton text-surface px-2 py-1 rounded text-xs disabled:opacity-50">Ajouter l&apos;image</button>
            <button type="button" onClick={() => setAjoutImage(false)} className="text-xs text-muet">Annuler</button>
          </div>
        ) : (
          <button type="button" onClick={() => setAjoutImage(true)} className="text-xs text-muet hover:text-encre">+ Ajouter une image</button>
        )}

        {erreur && <p className="text-retard text-sm">{erreur}</p>}

        <div className="flex gap-2">
          <button type="submit" disabled={chargement} className="bg-bouton text-surface px-3 py-1.5 rounded text-sm hover:opacity-90 disabled:opacity-50">
            {chargement ? '…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => { setEdition(false); setErreur(null) }} className="px-3 py-1.5 text-sm text-encre-douce hover:bg-parchemin-fonce rounded">Annuler</button>
        </div>
      </form>
    )
  }

  return (
    <div className="border border-bordure rounded-lg px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-encre">{item.titre}</span>
            {item.type === 'texte'
              ? <span className="text-xs bg-ok-teinte text-ok px-1.5 py-0.5 rounded">Texte</span>
              : <span className="text-xs bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded">Cours</span>}
            {item.auteur && <span className="text-xs text-muet">· {item.auteur}</span>}
            {item.chapitres && <span className="text-xs bg-info-teinte text-info px-1.5 py-0.5 rounded">{item.chapitres}</span>}
            {item.nbParcours > 0 && (
              <span className="text-xs bg-info-teinte text-info px-1.5 py-0.5 rounded">
                utilisé dans {item.nbParcours} parcours
              </span>
            )}
            {item.type === 'cours' && item.nbSections > 0 && (
              <span className="text-xs bg-parchemin-fonce text-encre-douce px-1.5 py-0.5 rounded">
                § {item.nbSections} section{item.nbSections > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {item.texte && <p className="text-xs text-muet mt-1 line-clamp-2 whitespace-pre-wrap">{item.texte}</p>}
          {item.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {item.images.map(img => img.url && (
                <figure key={img.id} className="w-24">
                  <img src={img.url} alt={img.legende ?? ''} className="w-24 h-24 object-cover rounded border border-bordure" />
                  {img.legende && <figcaption className="text-[10px] text-muet mt-0.5 truncate">{img.legende}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {item.type === 'cours' && (
            <Link
              href={`/prof/scriptorium?vue=cours&decouper=${item.id}`}
              className="text-xs text-muet hover:text-encre"
              title="Découper le cours en sections (chapitres / sous-chapitres)"
            >
              {item.nbSections > 0 ? 'Sections' : 'Découper'}
            </Link>
          )}
          <button onClick={() => setEdition(true)} className="text-xs text-muet hover:text-encre">Modifier</button>
          <button onClick={handleSupprimer} disabled={chargement} className="text-xs text-muet hover:text-retard disabled:opacity-50">Supprimer</button>
        </div>
      </div>
    </div>
  )
}
