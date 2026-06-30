'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { regenererCarteLivre, enregistrerCarteLivre, regenererReferenceLivre, enregistrerReferenceLivre } from './actions'
import type { Capstone, CapstoneProf, ReferenceChapitre, LivreReferenceProf } from '@/app/eleve/modules/aletheia/types'

// Au-delà de ce délai, un PENDING est considéré « bloqué » (job after() mort) :
// on rouvre la régénération au lieu de laisser l'artefact figé.
const DELAI_BLOCAGE_MS = 2 * 60 * 1000

const videCarte: Capstone = { fil_conducteur: '', noeuds: [], liens: [] }

// Carte d'architecture + référence par chapitre côté prof (SPEC §1) : vérification,
// régénération IA et amendement manuel — chacune indépendamment. Sous les semaines.
export default function CarteArchitectureLivre({ livreId, capstone, reference, semaines }: {
  livreId: string; capstone: CapstoneProf | null; reference: LivreReferenceProf | null
  semaines: { semaine: number; titre: string }[]
}) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [draft, setDraft] = useState<Capstone>(capstone?.contenu ?? videCarte)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const statut = capstone?.statut
  const contenu = capstone?.contenu ?? null
  const tsCarte = capstone?.updated_at ? new Date(capstone.updated_at).getTime() : 0
  const tsRef = reference?.updated_at ? new Date(reference.updated_at).getTime() : 0
  const carteEnCours = statut === 'PENDING'
  const refEnCours = reference?.statut === 'PENDING'
  const enCours = carteEnCours || refEnCours

  // Blocage par artefact (PENDING trop ancien = job mort) + auto-refresh tant qu'un
  // job tourne (bascule PENDING → READY sans rechargement manuel).
  const [carteBloquee, setCarteBloquee] = useState(false)
  const [refBloquee, setRefBloquee] = useState(false)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!enCours) { setCarteBloquee(false); setRefBloquee(false); return }
    const tick = () => {
      const cMort = carteEnCours && tsCarte > 0 && Date.now() - tsCarte > DELAI_BLOCAGE_MS
      const rMort = refEnCours && tsRef > 0 && Date.now() - tsRef > DELAI_BLOCAGE_MS
      setCarteBloquee(cMort)
      setRefBloquee(rMort)
      if ((carteEnCours && !cMort) || (refEnCours && !rMort)) router.refresh()
    }
    tick()
    const id = setInterval(tick, 4000)
    return () => clearInterval(id)
  }, [enCours, carteEnCours, refEnCours, tsCarte, tsRef, router])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function regenerer(force = false) {
    setBusy(true); setMsg(null)
    try {
      const res = await regenererCarteLivre(livreId, force)
      if (res.needsConfirm) {
        if (confirm('Cette carte a été amendée à la main. La régénérer par l’IA écrasera tes modifications. Continuer ?')) return regenerer(true)
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
    <details className="border border-bordure rounded-lg bg-parchemin-fonce/40" open>
      <summary className="px-3 py-2 text-sm font-medium text-encre-douce cursor-pointer flex items-center justify-between gap-2">
        <span>✦ Carte d&apos;architecture du livre <span className="font-normal text-muet">(partagée aux élèves en fin de lecture)</span></span>
        <span className="text-xs font-normal">
          {carteBloquee ? <span className="text-retard">génération bloquée — relancer</span>
            : carteEnCours ? <span className="text-attention">génération en cours…</span>
            : statut === 'ERROR' ? <span className="text-retard">échec de génération</span>
            : statut === 'READY' && capstone?.amende_par_prof ? <span className="text-info">amendée à la main</span>
            : statut === 'READY' ? <span className="text-ok">prête</span>
            : <span className="text-muet">non générée</span>}
        </span>
      </summary>

      <div className="px-3 pb-3 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => regenerer(false)} disabled={busy || (carteEnCours && !carteBloquee)}
            className="text-xs px-3 py-1.5 rounded-lg border border-bordure text-encre-douce hover:bg-surface disabled:opacity-50">
            {carteEnCours && !carteBloquee ? '…' : carteBloquee ? '↻ Relancer la génération' : '↻ Régénérer (IA)'}
          </button>
          {!edition ? (
            <button onClick={() => { setDraft(contenu ?? videCarte); setEdition(true) }} disabled={busy || (carteEnCours && !carteBloquee)}
              className="text-xs px-3 py-1.5 rounded-lg border border-bordure text-encre-douce hover:bg-surface disabled:opacity-50">
              ✎ Amender à la main
            </button>
          ) : (
            <>
              <button onClick={enregistrer} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg bg-bouton text-surface hover:opacity-90 disabled:opacity-50">
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button onClick={() => setEdition(false)} disabled={busy} className="text-xs px-3 py-1.5 rounded-lg text-encre-douce hover:bg-parchemin-fonce">Annuler</button>
            </>
          )}
        </div>
        {msg && <p className="text-xs text-retard">{msg}</p>}

        {edition ? (
          <EditeurCarte draft={draft} setDraft={setDraft} />
        ) : contenu ? (
          <div className="space-y-2 text-sm">
            {contenu.fil_conducteur && <p className="text-encre-douce whitespace-pre-wrap">{contenu.fil_conducteur}</p>}
            {contenu.noeuds.length > 0 && (
              <ul className="space-y-1">
                {contenu.noeuds.map((n, i) => (
                  <li key={i}><span className="font-medium text-encre">{n.chapitre}</span><span className="text-encre-douce"> — {n.idee}</span></li>
                ))}
              </ul>
            )}
            {contenu.liens.length > 0 && (
              <ul className="space-y-0.5 pt-2 border-t border-bordure text-encre-douce">
                {contenu.liens.map((l, i) => (
                  <li key={i}><span className="font-medium">{l.de}</span> → <span className="font-medium">{l.vers}</span> : {l.relation}</li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-muet">
            {carteEnCours ? 'La carte se prépare…' : statut === 'ERROR' ? 'La génération a échoué — régénère.' : 'Pas encore de carte — régénère pour la créer.'}
          </p>
        )}

        <SectionReference livreId={livreId} reference={reference} enCours={!!refEnCours} bloque={refBloquee} semaines={semaines} />
      </div>
    </details>
  )
}

// ── Référence par chapitre (socle du diagnostic) — éditable par le prof ───────
function SectionReference({ livreId, reference, enCours, bloque, semaines }: {
  livreId: string; reference: LivreReferenceProf | null; enCours: boolean; bloque: boolean
  semaines: { semaine: number; titre: string }[]
}) {
  const router = useRouter()
  const [edition, setEdition] = useState(false)
  const [draft, setDraft] = useState<ReferenceChapitre[]>(reference?.contenu ?? [])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const contenu = reference?.contenu ?? null
  const statut = reference?.statut
  // Édition possible même si la génération a échoué : on sème depuis les semaines du livre.
  const seed: ReferenceChapitre[] = contenu && contenu.length > 0
    ? contenu
    : semaines.map(s => ({ semaine: s.semaine, titre: s.titre, these_canonique: '', arguments_cles: [], concepts_cles: [], synthese_modele: '' }))
  const peutEditer = seed.length > 0

  async function regenerer(force = false) {
    setBusy(true); setMsg(null)
    try {
      const res = await regenererReferenceLivre(livreId, force)
      if (res.needsConfirm) {
        if (confirm('Cette référence a été amendée à la main. La régénérer par l’IA écrasera tes modifications. Continuer ?')) return regenerer(true)
        return
      }
      if (res.error) { setMsg(res.error); return }
      router.refresh()
    } finally { setBusy(false) }
  }

  async function enregistrer() {
    setBusy(true); setMsg(null)
    try {
      const res = await enregistrerReferenceLivre(livreId, draft)
      if (res.error) { setMsg(res.error); return }
      setEdition(false)
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <details className="border-t border-bordure pt-2">
      <summary className="text-xs font-medium text-muet cursor-pointer flex items-center justify-between gap-2">
        <span>Fiche de lecture par chapitre <span className="font-normal text-muet">(socle du diagnostic ; la synthèse modèle est destinée à l&apos;élève)</span></span>
        <span>
          {bloque ? <span className="text-retard">bloquée — relancer</span>
            : enCours ? <span className="text-attention">en cours…</span>
            : statut === 'ERROR' ? <span className="text-retard">échec</span>
            : statut === 'READY' && reference?.amende_par_prof ? <span className="text-info">amendée</span>
            : statut === 'READY' ? <span className="text-ok">prête</span>
            : <span className="text-muet">—</span>}
        </span>
      </summary>

      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => regenerer(false)} disabled={busy || (enCours && !bloque)}
            className="text-[11px] px-2.5 py-1 rounded-lg border border-bordure text-encre-douce hover:bg-surface disabled:opacity-50">
            {enCours && !bloque ? '…' : bloque ? '↻ Relancer' : '↻ Régénérer (IA)'}
          </button>
          {!edition ? (
            <button onClick={() => { setDraft(seed); setEdition(true) }} disabled={busy || (enCours && !bloque) || !peutEditer}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-bordure text-encre-douce hover:bg-surface disabled:opacity-50">
              ✎ Amender à la main
            </button>
          ) : (
            <>
              <button onClick={enregistrer} disabled={busy} className="text-[11px] px-2.5 py-1 rounded-lg bg-bouton text-surface hover:opacity-90 disabled:opacity-50">
                {busy ? 'Enregistrement…' : 'Enregistrer'}
              </button>
              <button onClick={() => setEdition(false)} disabled={busy} className="text-[11px] px-2.5 py-1 rounded-lg text-encre-douce hover:bg-parchemin-fonce">Annuler</button>
            </>
          )}
        </div>
        {msg && <p className="text-[11px] text-retard">{msg}</p>}

        {edition ? (
          <EditeurReference draft={draft} setDraft={setDraft} />
        ) : contenu && contenu.length > 0 ? (
          <ul className="space-y-2">
            {contenu.map((c, i) => (
              <li key={i} className="text-xs">
                <p className="font-medium text-encre-douce">Semaine {c.semaine} — {c.titre}</p>
                <p className="text-encre-douce">Thèse : {c.these_canonique}</p>
                {c.arguments_cles.length > 0 && (
                  <ul className="list-disc list-inside text-muet">
                    {c.arguments_cles.map((a, j) => <li key={j}>{a}</li>)}
                  </ul>
                )}
                {c.concepts_cles.length > 0 && (
                  <p className="text-muet">Concepts : {c.concepts_cles.join(' · ')}</p>
                )}
                {c.synthese_modele && (
                  <p className="text-encre-douce mt-0.5"><span className="text-info">Synthèse (élève) :</span> {c.synthese_modele}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muet">{enCours ? 'La référence se prépare…' : 'Référence non disponible — régénère pour la créer.'}</p>
        )}
      </div>
    </details>
  )
}

// Éditeur structuré de la carte (fil conducteur + nœuds + liens).
function EditeurCarte({ draft, setDraft }: { draft: Capstone; setDraft: (c: Capstone) => void }) {
  const champ = 'w-full px-2 py-1 border border-bordure rounded text-sm text-encre focus:outline-none focus:ring-2 focus:ring-pigment'
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Fil conducteur</label>
        <textarea value={draft.fil_conducteur} onChange={e => setDraft({ ...draft, fil_conducteur: e.target.value })} rows={3} className={`${champ} resize-y`} />
      </div>
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Chapitres (nœuds)</label>
        <div className="space-y-1.5">
          {draft.noeuds.map((n, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={n.chapitre} placeholder="Chapitre" onChange={e => setDraft({ ...draft, noeuds: draft.noeuds.map((x, j) => j === i ? { ...x, chapitre: e.target.value } : x) })} className={`${champ} w-1/3`} />
              <input value={n.idee} placeholder="Idée maîtresse" onChange={e => setDraft({ ...draft, noeuds: draft.noeuds.map((x, j) => j === i ? { ...x, idee: e.target.value } : x) })} className={champ} />
              <button type="button" onClick={() => setDraft({ ...draft, noeuds: draft.noeuds.filter((_, j) => j !== i) })} className="text-muet hover:text-retard px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setDraft({ ...draft, noeuds: [...draft.noeuds, { chapitre: '', idee: '' }] })} className="text-xs text-muet hover:text-encre underline">+ Ajouter un chapitre</button>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-muet mb-1">Liens entre chapitres</label>
        <div className="space-y-1.5">
          {draft.liens.map((l, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={l.de} placeholder="De" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, de: e.target.value } : x) })} className={`${champ} w-1/4`} />
              <input value={l.vers} placeholder="Vers" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, vers: e.target.value } : x) })} className={`${champ} w-1/4`} />
              <input value={l.relation} placeholder="Relation (prépare, renverse…)" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, relation: e.target.value } : x) })} className={champ} />
              <button type="button" onClick={() => setDraft({ ...draft, liens: draft.liens.filter((_, j) => j !== i) })} className="text-muet hover:text-retard px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setDraft({ ...draft, liens: [...draft.liens, { de: '', vers: '', relation: '' }] })} className="text-xs text-muet hover:text-encre underline">+ Ajouter un lien</button>
        </div>
      </div>
    </div>
  )
}

// Éditeur de la référence : par chapitre (semaine/titre figés), thèse + arguments clés.
function EditeurReference({ draft, setDraft }: { draft: ReferenceChapitre[]; setDraft: (c: ReferenceChapitre[]) => void }) {
  const champ = 'w-full px-2 py-1 border border-bordure rounded text-xs text-encre focus:outline-none focus:ring-2 focus:ring-pigment'
  const maj = (i: number, patch: Partial<ReferenceChapitre>) => setDraft(draft.map((c, j) => j === i ? { ...c, ...patch } : c))
  return (
    <div className="space-y-3">
      {draft.map((c, i) => (
        <div key={i} className="border border-bordure rounded-lg p-2 space-y-1.5">
          <p className="text-[11px] font-medium text-encre-douce">Semaine {c.semaine} — {c.titre}</p>
          <div>
            <label className="block text-[10px] text-muet mb-0.5">Thèse canonique</label>
            <textarea value={c.these_canonique} onChange={e => maj(i, { these_canonique: e.target.value })} rows={2} className={`${champ} resize-y`} />
          </div>
          <div>
            <label className="block text-[10px] text-muet mb-0.5">Arguments clés</label>
            <div className="space-y-1">
              {c.arguments_cles.map((a, k) => (
                <div key={k} className="flex gap-1.5">
                  <input value={a} onChange={e => maj(i, { arguments_cles: c.arguments_cles.map((x, m) => m === k ? e.target.value : x) })} className={champ} />
                  <button type="button" onClick={() => maj(i, { arguments_cles: c.arguments_cles.filter((_, m) => m !== k) })} className="text-muet hover:text-retard px-1">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => maj(i, { arguments_cles: [...c.arguments_cles, ''] })} className="text-[11px] text-muet hover:text-encre underline">+ Ajouter un argument</button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-muet mb-0.5">Concepts clés</label>
            <div className="space-y-1">
              {c.concepts_cles.map((a, k) => (
                <div key={k} className="flex gap-1.5">
                  <input value={a} onChange={e => maj(i, { concepts_cles: c.concepts_cles.map((x, m) => m === k ? e.target.value : x) })} className={champ} />
                  <button type="button" onClick={() => maj(i, { concepts_cles: c.concepts_cles.filter((_, m) => m !== k) })} className="text-muet hover:text-retard px-1">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => maj(i, { concepts_cles: [...c.concepts_cles, ''] })} className="text-[11px] text-muet hover:text-encre underline">+ Ajouter un concept</button>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-muet mb-0.5">👁 Synthèse modèle <span className="text-info">— vue par l&apos;élève (registre élève, tutoiement)</span></label>
            <textarea value={c.synthese_modele} onChange={e => maj(i, { synthese_modele: e.target.value })} rows={4} className={`${champ} resize-y`} />
          </div>
        </div>
      ))}
    </div>
  )
}
