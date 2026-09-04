'use client'

import type { Capstone } from '@/app/eleve/modules/aletheia/types'
import { CHAMP, INTITULE } from './ui'

// Éditeur structuré de la carte (fil conducteur + nœuds + liens) — logique reprise
// telle quelle de l'ex-CarteArchitectureLivre, réhabillée aux gabarits de la vue livre.
// Les nœuds ne sont pas affichés en lecture (l'idée par chapitre vit dans la fiche) :
// c'est ICI qu'ils restent visibles et éditables — rien n'est perdu.
export default function EditeurCarte({ draft, setDraft }: { draft: Capstone; setDraft: (c: Capstone) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className={`${INTITULE} block mb-1`}>Fil conducteur</label>
        <textarea value={draft.fil_conducteur} onChange={e => setDraft({ ...draft, fil_conducteur: e.target.value })} rows={3} className={`${CHAMP} resize-y font-corps text-sm`} />
      </div>
      <div>
        <label className={`${INTITULE} block mb-1`}>Chapitres (nœuds)</label>
        <div className="space-y-1.5">
          {draft.noeuds.map((n, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={n.chapitre} placeholder="Chapitre" onChange={e => setDraft({ ...draft, noeuds: draft.noeuds.map((x, j) => j === i ? { ...x, chapitre: e.target.value } : x) })} className={`${CHAMP} w-1/3`} />
              <input value={n.idee} placeholder="Idée maîtresse" onChange={e => setDraft({ ...draft, noeuds: draft.noeuds.map((x, j) => j === i ? { ...x, idee: e.target.value } : x) })} className={CHAMP} />
              <button type="button" onClick={() => setDraft({ ...draft, noeuds: draft.noeuds.filter((_, j) => j !== i) })} className="text-muet hover:text-retard px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setDraft({ ...draft, noeuds: [...draft.noeuds, { chapitre: '', idee: '' }] })} className="font-ui text-xs text-muet hover:text-encre underline">+ Ajouter un chapitre</button>
        </div>
      </div>
      <div>
        <label className={`${INTITULE} block mb-1`}>Liens entre chapitres</label>
        <div className="space-y-1.5">
          {draft.liens.map((l, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={l.de} placeholder="De" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, de: e.target.value } : x) })} className={`${CHAMP} w-1/4`} />
              <input value={l.vers} placeholder="Vers" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, vers: e.target.value } : x) })} className={`${CHAMP} w-1/4`} />
              <input value={l.relation} placeholder="Une phrase : « La séance 1 prépare la séance 2 : … »" onChange={e => setDraft({ ...draft, liens: draft.liens.map((x, j) => j === i ? { ...x, relation: e.target.value } : x) })} className={CHAMP} />
              <button type="button" onClick={() => setDraft({ ...draft, liens: draft.liens.filter((_, j) => j !== i) })} className="text-muet hover:text-retard px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setDraft({ ...draft, liens: [...draft.liens, { de: '', vers: '', relation: '' }] })} className="font-ui text-xs text-muet hover:text-encre underline">+ Ajouter un lien</button>
        </div>
      </div>
    </div>
  )
}
