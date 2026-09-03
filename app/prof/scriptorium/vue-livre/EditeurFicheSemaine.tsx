'use client'

import type { ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'
import { CHAMP, INTITULE, INTITULE_SM } from './ui'
import { DEFINITIONS, GABARITS, estGabarit } from '@/utils/aletheia/gabarits'
import PassagesCles from './PassagesCles'

// Édition d'UNE fiche de semaine (ex-EditeurReference réduit à un chapitre) : le
// panneau parent fusionne le brouillon dans le tableau complet à l'enregistrement.
// `gabaritLivre` (E3) : le gabarit du livre, pour afficher la surcharge par séance.
export default function EditeurFicheSemaine({ draft, setDraft, gabaritLivre, livreId, texteDoc, versionDecoupe }: {
  draft: ReferenceChapitre
  setDraft: (c: ReferenceChapitre) => void
  gabaritLivre?: string
  /** (E4) Pour l'éditeur des passages clés (porte ouverte seulement). */
  livreId?: string
  texteDoc?: string | null
  versionDecoupe?: string | null
}) {
  const maj = (patch: Partial<ReferenceChapitre>) => setDraft({ ...draft, ...patch })
  return (
    <div className="flex flex-col gap-[18px]">
      <p className="font-corps italic text-[13px] text-muet-clair">Le titre de la séance se modifie via « Modifier la découpe » en tête de page.</p>
      {gabaritLivre && (
        <div>
          <label className={`${INTITULE} block mb-1.5`}>Gabarit de lecture de cette séance</label>
          <select value={draft.gabarit ?? ''} onChange={e => maj({ gabarit: estGabarit(e.target.value) ? e.target.value : undefined })} className={`${CHAMP} sm:max-w-xs`}>
            <option value="">Celui du livre ({DEFINITIONS[estGabarit(gabaritLivre) ? gabaritLivre : 'argumentatif'].nom})</option>
            {GABARITS.map(g => <option key={g} value={g}>{DEFINITIONS[g].nom}</option>)}
          </select>
          <p className="font-corps italic text-[13px] text-muet-clair mt-1">Change les questions posées à l’élève et le regard de l’IA pour cette séance seulement.</p>
        </div>
      )}
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
      {gabaritLivre && (
        <div className="bg-parchemin border border-bordure rounded-[9px] px-[17px] py-3.5 space-y-2">
          <label className={`${INTITULE_SM} block`}>« Je ne sais pas » — les trois propositions de la première question (E8)</label>
          <p className="text-xs text-muet">La thèse dite comme un élève, et deux affirmations plausibles mais fausses. L’élève qui ne sait pas choisit, puis dit pourquoi.</p>
          <input value={draft.these_eleve ?? ''} onChange={e => maj({ these_eleve: e.target.value })} placeholder="La thèse, en registre élève (≤ 25 mots)" className={CHAMP} />
          {[0, 1].map(i => (
            <input key={i} value={(draft.distracteurs ?? [])[i] ?? ''} onChange={e => { const d = [...(draft.distracteurs ?? ['', ''])]; while (d.length < 2) d.push(''); d[i] = e.target.value; maj({ distracteurs: d }) }}
              placeholder={`Distracteur ${i + 1} — plausible mais faux`} className={CHAMP} />
          ))}
        </div>
      )}
      {gabaritLivre && livreId && (
        <PassagesCles
          livreId={livreId} semaine={draft.semaine} texte={texteDoc ?? null}
          passages={draft.passages_cles ?? []} versionDecoupe={versionDecoupe ?? null}
          mode="edition" onChange={p => maj({ passages_cles: p })}
        />
      )}
    </div>
  )
}
