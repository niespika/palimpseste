'use client'

import type { ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'
import { CHAMP, INTITULE, INTITULE_SM } from './ui'

// Édition d'UNE fiche de semaine (ex-EditeurReference réduit à un chapitre) : le
// panneau parent fusionne le brouillon dans le tableau complet à l'enregistrement.
export default function EditeurFicheSemaine({ draft, setDraft }: {
  draft: ReferenceChapitre
  setDraft: (c: ReferenceChapitre) => void
}) {
  const maj = (patch: Partial<ReferenceChapitre>) => setDraft({ ...draft, ...patch })
  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <label className={`${INTITULE} block mb-1.5`}>Titre de la fiche</label>
        <input value={draft.titre} onChange={e => maj({ titre: e.target.value })} className={CHAMP} />
      </div>
      <div>
        <label className={`${INTITULE} block mb-1.5`}>Thèse canonique</label>
        <textarea value={draft.these_canonique} onChange={e => maj({ these_canonique: e.target.value })} rows={3} className={`${CHAMP} resize-y font-corps text-[15px]`} />
      </div>
      <div>
        <label className={`${INTITULE} block mb-1.5`}>Arguments clés</label>
        <div className="space-y-1.5">
          {draft.arguments_cles.map((a, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={a} onChange={e => maj({ arguments_cles: draft.arguments_cles.map((x, j) => j === i ? e.target.value : x) })} className={CHAMP} />
              <button type="button" onClick={() => maj({ arguments_cles: draft.arguments_cles.filter((_, j) => j !== i) })} className="text-muet hover:text-retard px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => maj({ arguments_cles: [...draft.arguments_cles, ''] })} className="font-ui text-xs text-muet hover:text-encre underline">+ Ajouter un argument</button>
        </div>
      </div>
      <div>
        <label className={`${INTITULE} block mb-1.5`}>Concepts clés</label>
        <div className="space-y-1.5">
          {draft.concepts_cles.map((c, i) => (
            <div key={i} className="flex gap-1.5">
              <input value={c} onChange={e => maj({ concepts_cles: draft.concepts_cles.map((x, j) => j === i ? e.target.value : x) })} className={CHAMP} />
              <button type="button" onClick={() => maj({ concepts_cles: draft.concepts_cles.filter((_, j) => j !== i) })} className="text-muet hover:text-retard px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={() => maj({ concepts_cles: [...draft.concepts_cles, ''] })} className="font-ui text-xs text-muet hover:text-encre underline">+ Ajouter un concept</button>
        </div>
      </div>
      <div className="bg-parchemin border border-bordure rounded-[9px] px-[17px] py-3.5">
        <label className={`${INTITULE_SM} text-info block mb-1.5`}>👁 Synthèse modèle — vue par l’élève (registre élève, tutoiement)</label>
        <textarea value={draft.synthese_modele} onChange={e => maj({ synthese_modele: e.target.value })} rows={4} className={`${CHAMP} resize-y font-corps text-[15px]`} />
      </div>
    </div>
  )
}
