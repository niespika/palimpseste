'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { regenererCarteLivre, enregistrerCarteLivre } from './actions'
import type { Capstone, CapstoneProf, LivreReference } from '@/app/eleve/modules/aletheia/types'

// Au-delà de ce délai, un PENDING est considéré « bloqué » (job after() mort) :
// on rouvre la régénération au lieu de laisser la carte figée.
const DELAI_BLOCAGE_MS = 2 * 60 * 1000

interface Props {
  livreId: string
  capstone: CapstoneProf | null
  reference: LivreReference | null
}

const vide: Capstone = { fil_conducteur: '', noeuds: [], liens: [] }

// Carte d'architecture du livre côté prof : vérification, régénération IA et
// amendement manuel (SPEC §1). Affichée sous les semaines dans le menu du livre.
export default function CarteArchitectureLivre({ livreId, capstone, reference }: Props) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [draft, setDraft] = useState<Capstone>(capstone?.contenu ?? vide)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const statut = capstone?.statut
  const contenu = capstone?.contenu ?? null
  const refStatut = reference?.statut
  const tsCarte = capstone?.updated_at ? new Date(capstone.updated_at).getTime() : 0
  const enCours = statut === 'PENDING' || refStatut === 'PENDING'
  // PENDING (carte OU référence) trop ancien = job after() probablement mort.
  const [bloque, setBloque] = useState(false)

  // Tant que la génération tourne, on rafraîchit pour basculer en READY ; au-delà
  // du délai de blocage on considère le job mort et on rouvre la régénération.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!enCours) { setBloque(false); return }
    const tick = () => {
      const mort = tsCarte > 0 && Date.now() - tsCarte > DELAI_BLOCAGE_MS
      setBloque(mort)
      if (!mort) router.refresh()
    }
    tick()
    const id = setInterval(tick, 4000)
    return () => clearInterval(id)
  }, [enCours, tsCarte, router])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function regenerer(force = false) {
    setBusy(true); setMsg(null)
    try {
      const res = await regenererCarteLivre(livreId, force)
      if (res.needsConfirm) {
        if (confirm('Cette carte a été amendée à la main. La régénérer par l’IA écrasera tes modifications. Continuer ?')) {
          return regenerer(true)
        }
        return
      }
      if (res.error) { setMsg(res.error); return }
      router.refresh()
    } finally { setBusy(false) }
  }

  async function enregistrer() {
    setBusy(true); setMsg(null)
    try {
      const res = await enregistrerCarteLivre(livreId, draft)
      if (res.error) { setMsg(res.error); return }
      setEdition(false)
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <details className="border border-stone-200 rounded-lg bg-stone-50/40" open>
      <summary className="px-3 py-2 text-sm font-medium text-stone-700 cursor-pointer flex items-center justify-between gap-2">
        <span>✦ Carte d&apos;architecture du livre <span className="font-normal text-stone-400">(partagée aux élèves en fin de lecture)</span></span>
        <span className="text-xs font-normal">
          {bloque ? <span className="text-red-600">génération bloquée — relancer</span>
            : enCours ? <span className="text-amber-600">génération en cours…</span>
            : statut === 'ERROR' ? <span className="text-red-600">échec de génération</span>
            : statut === 'READY' && capstone?.amende_par_prof ? <span className="text-blue-600">amendée à la main</span>
            : statut === 'READY' ? <span className="text-green-600">prête</span>
            : <span className="text-stone-400">non générée</span>}
        </span>
      </summary>

      <div className="px-3 pb-3 space-y-3">
        {/* Barre d'actions */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => regenerer(false)} disabled={busy || (enCours && !bloque)}
            className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-white disabled:opacity-50">
            {enCours && !bloque ? '…' : bloque ? '↻ Relancer la génération' : '↻ Régénérer (IA)'}
          </button>
          {!edition ? (
            <button onClick={() => { setDraft(contenu ?? vide); setEdition(true) }} disabled={busy}
              className="text-xs px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-white disabled:opacity-50">
              ✎ Amender à la main
            </button>
          ) : (
            <>
              <button onClick={enregistrer} disabled={busy}
                className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50">
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button onClick={() => setEdition(false)} disabled={busy}
                className="text-xs px-3 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100">Annuler</button>
            </>
          )}
        </div>
        {msg && <p className="text-xs text-red-600">{msg}</p>}

        {/* Contenu */}
        {edition ? (
          <EditeurCarte draft={draft} setDraft={setDraft} />
        ) : contenu ? (
          <div className="space-y-2 text-sm">
            {contenu.fil_conducteur && <p className="text-stone-700 whitespace-pre-wrap">{contenu.fil_conducteur}</p>}
            {contenu.noeuds.length > 0 && (
              <ul className="space-y-1">
                {contenu.noeuds.map((n, i) => (
                  <li key={i}><span className="font-medium text-stone-800">{n.chapitre}</span><span className="text-stone-600"> — {n.idee}</span></li>
                ))}
              </ul>
            )}
            {contenu.liens.length > 0 && (
              <ul className="space-y-0.5 pt-2 border-t border-stone-100 text-stone-700">
                {contenu.liens.map((l, i) => (
                  <li key={i}><span className="font-medium">{l.de}</span> → <span className="font-medium">{l.vers}</span> : {l.relation}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-stone-400">
            {statut === 'PENDING' ? 'La carte se prépare…' : statut === 'ERROR' ? 'La génération a échoué — régénère.' : 'Pas encore de carte — régénère pour la créer.'}
          </p>
        )}

        {/* Référence par chapitre (socle du diagnostic, lecture seule) */}
        <details className="border-t border-stone-100 pt-2">
          <summary className="text-xs font-medium text-stone-500 cursor-pointer">
            Référence par chapitre (socle du diagnostic){reference?.statut === 'PENDING' ? ' — en cours…' : reference?.statut === 'ERROR' ? ' — échec' : ''}
          </summary>
          {reference?.statut === 'READY' && reference.contenu && reference.contenu.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {reference.contenu.map((c, i) => (
                <li key={i} className="text-xs">
                  <p className="font-medium text-stone-700">Semaine {c.semaine} — {c.titre}</p>
                  <p className="text-stone-600">Thèse : {c.these_canonique}</p>
                  {c.arguments_cles.length > 0 && (
                    <ul className="list-disc list-inside text-stone-500">
                      {c.arguments_cles.map((a, j) => <li key={j}>{a}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-stone-400">Référence non disponible.</p>
          )}
        </details>
      </div>
    </details>
  )
}

// Éditeur structuré (fil conducteur + nœuds + liens), édition manuelle simple.
function EditeurCarte({ draft, setDraft }: { draft: Capstone; setDraft: (c: Capstone) => void }) {
  const champ = 'w-full px-2 py-1 border border-stone-300 rounded text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400'
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Fil conducteur</label>
        <textarea value={draft.fil_conducteur} onChange={e => setDraft({ ...draft, fil_conducteur: e.target.value })} rows={3} className={`${champ} resize-y`} />
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Chapitres (nœuds)</label>
        <div className="space-y-1.5">
          {draft.noeuds.map((n, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={n.chapitre} placeholder="Chapitre" onChange={e => setDraft({ ...draft, noeuds: draft.noeuds.map((x, j) => j === i ? { ...x, chapitre: e.target.value } : x) })} className={`${champ} w-1/3`} />
              <input value={n.idee} placeholder="Idée maîtresse" onChange={e => setDraft({ ...draft, noeuds: draft.noeuds.map((x, j) => j === i ? { ...x, idee: e.target.value } : x) })} className={champ} />
              <button type="button" onClick={() => setDraft({ ...draft, noeuds: draft.noeuds.filter((_, j) => j !== i) })} className="text-stone-400 hover:text-red-600 px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setDraft({ ...draft, noeuds: [...draft.noeuds, { chapitre: '', idee: '' }] })} className="text-xs text-stone-500 hover:text-stone-800 underline">+ Ajouter un chapitre</button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Liens entre chapitres</label>
        <div className="space-y-1.5">
          {draft.liens.map((l, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={l.de} placeholder="De" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, de: e.target.value } : x) })} className={`${champ} w-1/4`} />
              <input value={l.vers} placeholder="Vers" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, vers: e.target.value } : x) })} className={`${champ} w-1/4`} />
              <input value={l.relation} placeholder="Relation (prépare, renverse…)" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, relation: e.target.value } : x) })} className={champ} />
              <button type="button" onClick={() => setDraft({ ...draft, liens: draft.liens.filter((_, j) => j !== i) })} className="text-stone-400 hover:text-red-600 px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setDraft({ ...draft, liens: [...draft.liens, { de: '', vers: '', relation: '' }] })} className="text-xs text-stone-500 hover:text-stone-800 underline">+ Ajouter un lien</button>
        </div>
      </div>
    </div>
  )
}
