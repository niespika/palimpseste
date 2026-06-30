'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { modifierContenu, reassignerClasses, supprimerContenu, ajouterImage, supprimerImage } from './actions'

export interface ContenuItem {
  id: string
  nom: string
  semaine: number | null
  chapitres: string | null
  texte: string | null
  uniteId: string
  /** Discriminant du document : 'cours' | 'texte' (| 'texte_source' pour un livre). */
  type: string
  fichierLegacyUrl: string | null
}
export interface ImageItem { id: string; url: string | null; legende: string | null }

interface Props {
  item: ContenuItem
  unites: { id: string; label: string }[]
  classes: { id: string; nom: string }[]
  assignedClasseIds: string[]
  images: ImageItem[]
  /** Semaine de livre : classes gérées au niveau du livre → on masque l'édition par-doc. */
  masquerClasses?: boolean
  /** Semaine de livre : l'édition passe par l'éditeur complet → on masque Modifier/Supprimer par-doc. */
  masquerEdition?: boolean
}

export default function LigneContenu({ item, unites, classes, assignedClasseIds, images, masquerClasses = false, masquerEdition = false }: Props) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [chargement, setChargement] = useState(false)
  const [classeSet, setClasseSet] = useState<Set<string>>(new Set(assignedClasseIds))
  const [ajoutImage, setAjoutImage] = useState(false)
  const [legendeImg, setLegendeImg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const nomsClasses = classes.filter(c => assignedClasseIds.includes(c.id)).map(c => c.nom)

  function toggleClasse(id: string) {
    setClasseSet(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setChargement(true)
    const fd = new FormData(e.currentTarget)
    fd.append('id', item.id)
    const [r1] = await Promise.all([
      modifierContenu(fd),
      ...(masquerClasses ? [] : [reassignerClasses(item.id, [...classeSet])]),
    ])
    setChargement(false)
    if (r1.error) return
    setEdition(false)
    router.refresh()
  }

  async function handleSupprimer() {
    if (!confirm(`Supprimer « ${item.nom} » ?`)) return
    setChargement(true)
    await supprimerContenu(item.id)
    setChargement(false)
    router.refresh()
  }

  async function handleAjouterImage() {
    const f = fileRef.current?.files?.[0]
    if (!f) return
    setChargement(true)
    const fd = new FormData()
    fd.append('documentId', item.id)
    fd.append('fichier', f)
    fd.append('legende', legendeImg)
    const res = await ajouterImage(fd)
    setChargement(false)
    if (res.error) { alert(res.error); return }
    setAjoutImage(false); setLegendeImg('')
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  async function handleSupprimerImage(imageId: string) {
    setChargement(true)
    await supprimerImage(imageId)
    setChargement(false)
    router.refresh()
  }

  if (edition && !masquerEdition) {
    return (
      <form onSubmit={handleSave} className="bg-parchemin-fonce border border-bordure rounded-lg p-3 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input name="nom" defaultValue={item.nom} required placeholder="Nom"
            className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
          <input name="semaine" type="number" min={1} max={52} defaultValue={item.semaine ?? ''} placeholder="Semaine"
            className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
          <select name="uniteId" defaultValue={item.uniteId}
            className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment">
            {unites.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
          </select>
        </div>
        {!masquerClasses && (
          <select name="objetType" defaultValue={item.type === 'texte' ? 'texte' : 'cours'}
            className="px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment">
            <option value="cours">Cours (leçon)</option>
            <option value="texte">Texte d&apos;étude (source Quazian)</option>
          </select>
        )}
        <input name="chapitres" defaultValue={item.chapitres ?? ''} placeholder="Chapitres (ex. : Chap. 1-4) — optionnel"
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment" />
        <textarea name="texte" defaultValue={item.texte ?? ''} rows={4} placeholder="Texte du contenu"
          className="w-full px-2 py-1.5 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment resize-y" />
        {!masquerClasses && (
          <div className="flex flex-wrap gap-1.5">
            {classes.map(c => {
              const on = classeSet.has(c.id)
              return (
                <button key={c.id} type="button" onClick={() => toggleClasse(c.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${on ? 'bg-bouton text-surface border-bouton' : 'bg-surface text-encre-douce border-bordure hover:border-pigment'}`}>
                  {c.nom}
                </button>
              )
            })}
          </div>
        )}

        {/* Images existantes */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map(img => (
              <div key={img.id} className="relative">
                {img.url && <img src={img.url} alt={img.legende ?? ''} className="w-20 h-20 object-cover rounded border border-bordure" />}
                <button type="button" onClick={() => handleSupprimerImage(img.id)}
                  className="absolute -top-1.5 -right-1.5 bg-surface border border-bordure rounded-full w-5 h-5 text-xs text-retard hover:bg-retard-teinte">✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Ajout d'image (hors form : champs contrôlés + bouton) */}
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

        <div className="flex gap-2">
          <button type="submit" disabled={chargement} className="bg-bouton text-surface px-3 py-1.5 rounded text-sm hover:opacity-90 disabled:opacity-50">
            {chargement ? '…' : 'Enregistrer'}
          </button>
          <button type="button" onClick={() => { setEdition(false); setClasseSet(new Set(assignedClasseIds)) }} className="px-3 py-1.5 text-sm text-encre-douce hover:bg-parchemin-fonce rounded">Annuler</button>
        </div>
      </form>
    )
  }

  return (
    <div className="border border-bordure rounded-lg px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-encre">{item.nom}</span>
            {item.type === 'texte' && <span className="text-xs bg-ok-teinte text-ok px-1.5 py-0.5 rounded">Texte</span>}
            {item.type === 'cours' && <span className="text-xs bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded">Cours</span>}
            {item.semaine != null && <span className="text-xs bg-parchemin-fonce text-muet px-1.5 py-0.5 rounded">S{item.semaine}</span>}
            {item.chapitres && <span className="text-xs bg-info-teinte text-info px-1.5 py-0.5 rounded">{item.chapitres}</span>}
            {!masquerClasses && nomsClasses.map(n => <span key={n} className="text-xs bg-info-teinte text-info px-1.5 py-0.5 rounded">{n}</span>)}
          </div>
          {item.texte && <p className="text-xs text-muet mt-1 line-clamp-2 whitespace-pre-wrap">{item.texte}</p>}
          {(images.length > 0 || item.fichierLegacyUrl) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {images.map(img => img.url && (
                <figure key={img.id} className="w-24">
                  <img src={img.url} alt={img.legende ?? ''} className="w-24 h-24 object-cover rounded border border-bordure" />
                  {img.legende && <figcaption className="text-[10px] text-muet mt-0.5 truncate">{img.legende}</figcaption>}
                </figure>
              ))}
              {item.fichierLegacyUrl && (
                <a href={item.fichierLegacyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muet underline self-center">Fichier d&apos;origine</a>
              )}
            </div>
          )}
        </div>
        {!masquerEdition && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEdition(true)} className="text-xs text-muet hover:text-encre">Modifier</button>
            <button onClick={handleSupprimer} disabled={chargement} className="text-xs text-muet hover:text-retard disabled:opacity-50">Supprimer</button>
          </div>
        )}
      </div>
    </div>
  )
}
