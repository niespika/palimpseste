'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { enregistrerFicheSemaine } from '../actions'
import type { ReferenceChapitre } from '@/app/eleve/modules/aletheia/types'
import type { EtatFiche } from './utils'
import { useArtefactsLivre } from './ArtefactsLivreProvider'
import BoutonRegenererFiches from './BoutonRegenererFiches'
import EditeurFicheSemaine from './EditeurFicheSemaine'
import PassagesCles from './PassagesCles'
import { BADGE, BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, BTN_SECONDAIRE_SM, INTITULE, INTITULE_SM } from './ui'

const BADGE_ETAT: Record<EtatFiche, { texte: string; cls: string }> = {
  prete: { texte: 'fiche prête', cls: 'bg-ok-teinte text-ok' },
  amendee: { texte: 'amendée à la main', cls: 'bg-info-teinte text-info' },
  a_generer: { texte: 'à générer', cls: 'bg-attention-teinte text-attention' },
}

// Panneau central : la fiche de la semaine sélectionnée. Remonté à chaque changement
// de semaine (key={semaineSel} côté parent) → le texte se replie et le brouillon
// d'édition est jeté, comme demandé par le handoff.
export default function PanneauFiche({ livreId, semaine, titreDoc, chapitresDoc, texteDoc, chapitre, etat, sousStatut, statutRef, updatedAtRef, nbFiches, contenuVide, gabaritLivre, versionDecoupe }: {
  livreId: string
  semaine: number
  /** (E3) Gabarit du livre, porte de l'étayage ouverte ; absent ⇒ pas de sélecteur de surcharge ni de passages clés. */
  gabaritLivre?: string | null
  /** (E4) Empreinte de la découpe à jour en base ; null ⇒ passages périmés. */
  versionDecoupe?: string | null
  titreDoc: string
  chapitresDoc: string | null
  texteDoc: string | null
  chapitre: ReferenceChapitre | null
  etat: EtatFiche
  sousStatut: string
  statutRef: 'PENDING' | 'READY' | 'ERROR' | null
  updatedAtRef: string | null // verrou optimiste : updated_at de la référence au rendu
  nbFiches: number
  contenuVide: boolean
}) {
  const router = useRouter()
  const { refEnCours, refBloquee } = useArtefactsLivre()
  const [edition, setEdition] = useState(false)
  const [draft, setDraft] = useState<ReferenceChapitre | null>(null)
  const [texteOuvert, setTexteOuvert] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  // Titre = celui de la semaine (document), source unique — jamais le champ stocké
  // dans la fiche, qui peut être vide (legacy) ou décalé après une re-découpe.
  const titre = titreDoc
  const badge = BADGE_ETAT[etat]

  // Une génération qui démarre invalide tout brouillon en cours : sinon il
  // ressusciterait après le squelette et écraserait la fiche fraîchement générée.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (refEnCours) { setEdition(false); setDraft(null) }
  }, [refEnCours])
  /* eslint-enable react-hooks/set-state-in-effect */

  function ouvrirEdition() {
    setDraft(chapitre
      ? { ...chapitre, arguments_cles: [...chapitre.arguments_cles], concepts_cles: [...chapitre.concepts_cles] }
      : { semaine, titre: titreDoc, these_canonique: '', arguments_cles: [], concepts_cles: [], synthese_modele: '' })
    setMsg(null)
    setEdition(true)
  }

  // La fusion se fait CÔTÉ SERVEUR (contenu en base + verrou optimiste) : on
  // n'envoie que le brouillon de CETTE semaine et l'updated_at vu au rendu.
  async function enregistrer() {
    if (!draft) return
    setBusy(true); setMsg(null)
    try {
      const res = await enregistrerFicheSemaine(livreId, draft, updatedAtRef)
      if (res.error) { setMsg(res.error); return }
      setEdition(false)
      router.refresh()
    } finally { setBusy(false) }
  }

  return (
    <div className="bg-surface border border-bordure rounded-[10px] overflow-hidden">
      <div className="h-1.5 bg-pigment" />
      <div className="pt-5 px-[26px] pb-6 flex flex-col gap-[18px]">
        {/* En-tête de la fiche */}
        <div>
          <div className={`${INTITULE} tracking-[.1em] mb-[3px]`}>Séance {semaine}{chapitresDoc ? ` · ${chapitresDoc}` : ''}</div>
          <div className="flex items-start gap-3 flex-wrap">
            <h4 className="font-titre font-semibold text-[27px] leading-[1.1] text-encre">{titre}</h4>
            {!edition && etat !== 'a_generer' && !refEnCours && (
              <span className="ml-auto flex gap-[7px]">
                <button type="button" onClick={ouvrirEdition} disabled={busy} className={BTN_SECONDAIRE_SM}>✎ Amender</button>
              </span>
            )}
          </div>
          <div className="flex items-center gap-[9px] mt-[7px] flex-wrap">
            <span className={`${BADGE} ${badge.cls}`}>{badge.texte}</span>
            <span className="font-corps italic text-[13.5px] text-muet">{sousStatut}</span>
          </div>
        </div>

        {msg && <p className="font-ui text-xs text-retard">{msg}</p>}

        {refEnCours ? (
          /* Génération en cours (ou bloquée) : squelette, la page se rafraîchit seule. */
          <div>
            <p className={`font-corps italic text-[14.5px] leading-[1.5] ${refBloquee ? 'text-retard' : 'text-attention'}`}>
              {refBloquee
                ? 'La génération semble bloquée — relance-la avec « ↻ Relancer la génération » en tête de page.'
                : 'Les fiches se préparent — génération en cours…'}
            </p>
            {!refBloquee && (
              <>
                <div className="flex flex-col gap-1.5 mt-3">
                  <div className="h-2 rounded bg-parchemin-fonce w-[92%]" />
                  <div className="h-2 rounded bg-parchemin-fonce w-[78%]" />
                  <div className="h-2 rounded bg-parchemin-fonce w-[85%]" />
                </div>
                <p className="font-corps italic text-xs text-muet-clair mt-2.5">la page se mettra à jour automatiquement</p>
              </>
            )}
          </div>
        ) : edition && draft ? (
          <>
            <EditeurFicheSemaine draft={draft} setDraft={setDraft} gabaritLivre={gabaritLivre ?? undefined} livreId={livreId} texteDoc={texteDoc} versionDecoupe={versionDecoupe ?? null} />
            <div className="flex gap-2">
              <button type="button" onClick={enregistrer} disabled={busy} className={BTN_PRIMAIRE}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button type="button" onClick={() => setEdition(false)} disabled={busy} className={BTN_DISCRET}>Annuler</button>
            </div>
          </>
        ) : etat === 'a_generer' ? (
          <>
            {statutRef === 'ERROR' && (
              <p className="font-ui text-xs text-retard">La dernière génération a échoué — relance-la avec « ↻ Générer les fiches (IA) ».</p>
            )}
            <div className="border-[1.5px] border-dashed border-bordure-bouton rounded-[10px] bg-parchemin px-[26px] py-[30px] flex flex-col items-center gap-3.5 text-center">
              <p className="font-corps italic text-[16.5px] leading-[1.5] text-muet max-w-[44ch]">
                Cette fiche n’a pas encore été rédigée. Le diagnostic Aletheia et la synthèse montrée à l’élève s’appuieront dessus.
              </p>
              <div className="flex gap-[9px] flex-wrap justify-center">
                <BoutonRegenererFiches livreId={livreId} nbFiches={nbFiches} contenuVide={contenuVide} variante="primaire" />
                <button type="button" onClick={ouvrirEdition} className={BTN_SECONDAIRE}>✎ Rédiger à la main</button>
              </div>
            </div>
          </>
        ) : chapitre && (
          <>
            {chapitre.these_canonique && (
              <div>
                <div className={`${INTITULE} mb-1.5`}>Thèse canonique</div>
                <p className="font-corps text-[17px] leading-[1.55] text-encre">{chapitre.these_canonique}</p>
              </div>
            )}
            {chapitre.arguments_cles.length > 0 && (
              <div>
                <div className={`${INTITULE} mb-[7px]`}>Arguments clés</div>
                <div className="flex flex-col gap-[7px]">
                  {chapitre.arguments_cles.map((a, i) => (
                    <div key={i} className="flex gap-2.5 items-start">
                      <span className="w-1.5 h-1.5 bg-puce rotate-45 flex-none mt-[7px]" />
                      <span className="font-corps text-base leading-[1.5] text-encre-douce">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {chapitre.concepts_cles.length > 0 && (
              <div>
                <div className={`${INTITULE} mb-[7px]`}>Concepts clés</div>
                <div className="flex gap-1.5 flex-wrap">
                  {chapitre.concepts_cles.map((c, i) => (
                    <span key={i} className="font-ui font-medium text-[12.5px] bg-pigment-teinte text-pigment px-[11px] py-[3px] rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}
            {chapitre.synthese_modele && (
              <div className="bg-parchemin border border-bordure rounded-[9px] px-[17px] py-3.5">
                <div className={`${INTITULE_SM} text-info mb-1.5`}>👁 Synthèse modèle — vue par l’élève</div>
                <p className="font-corps text-base leading-[1.6] text-encre">{chapitre.synthese_modele}</p>
              </div>
            )}
            {/* (E8) Les trois propositions du « je ne sais pas » de la première question — lecture. */}
            {gabaritLivre && (chapitre.these_eleve || (chapitre.distracteurs ?? []).length > 0) && (
              <div className="bg-parchemin border border-bordure rounded-[9px] px-[17px] py-3.5">
                <div className={`${INTITULE_SM} mb-1.5`}>« Je ne sais pas » — les trois propositions de la première question</div>
                <ul className="space-y-1 text-sm text-encre">
                  {chapitre.these_eleve && <li><span className="text-ok mr-1.5" aria-hidden>✓</span>{chapitre.these_eleve} <span className="text-xs text-muet">— la thèse, en registre élève</span></li>}
                  {(chapitre.distracteurs ?? []).map((d, i) => <li key={i}><span className="text-muet mr-1.5" aria-hidden>✕</span>{d} <span className="text-xs text-muet">— distracteur</span></li>)}
                </ul>
              </div>
            )}
            {/* (E4) Passages clés — porte de l'étayage ouverte seulement (gabaritLivre présent). */}
            {gabaritLivre && (
              <PassagesCles
                livreId={livreId} semaine={semaine} texte={texteDoc}
                passages={chapitre.passages_cles ?? []} versionDecoupe={versionDecoupe ?? null}
                mode="lecture" peutGenerer
              />
            )}
          </>
        )}

        {/* Texte de la semaine — repliable, lecture seule (masqué pendant génération/édition) */}
        {!refEnCours && !edition && texteDoc && (
          <div>
            <button type="button" onClick={() => setTexteOuvert(o => !o)} aria-expanded={texteOuvert}
              className={`w-full flex items-center gap-[9px] px-[13px] py-[9px] border border-bordure ${texteOuvert ? 'rounded-t-lg' : 'rounded-lg'} hover:bg-parchemin transition-colors text-left`}>
              <span className="font-ui text-[13px] text-muet w-2.5 flex-none">{texteOuvert ? '▾' : '▸'}</span>
              <span className="font-ui font-semibold text-[13px] text-encre-douce flex-none">Texte de la séance</span>
              <span className="font-corps italic text-[13px] text-muet-clair truncate">lecture seule — la découpe se modifie en tête de page</span>
            </button>
            {texteOuvert && (
              <div className="border border-t-0 border-bordure rounded-b-lg px-5 py-4 bg-surface font-corps text-[16.5px] leading-[1.65] text-encre-douce whitespace-pre-wrap">
                {texteDoc}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
