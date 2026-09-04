'use client'

import { phraseDuLienCarte } from '@/utils/aletheia/liens'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { regenererCarteLivre, enregistrerCarteLivre } from '../actions'
import type { Capstone, CapstoneProf } from '@/app/eleve/modules/aletheia/types'
import type { LienResolu } from './utils'
import { useArtefactsLivre } from './ArtefactsLivreProvider'
import EditeurCarte from './EditeurCarte'
import { BADGE, BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE_SM, INTITULE_SM } from './ui'

const videCarte: Capstone = { fil_conducteur: '', noeuds: [], liens: [] }

// Colonne droite (sticky) : la carte d'architecture du livre. Trois états —
// prête (fil conducteur + liens cliquables), en cours (squelette + auto-refresh du
// provider), non générée / échec (bouton primaire). Flux régénération/needsConfirm
// et amendement repris tels quels de l'ex-CarteArchitectureLivre.
export default function ColonneCarte({ livreId, capstone, liens, semaineSel, hrefBase }: {
  livreId: string
  capstone: CapstoneProf | null
  liens: LienResolu[]
  semaineSel: number
  hrefBase: string
}) {
  const router = useRouter()
  const { carteEnCours, carteBloquee } = useArtefactsLivre()
  const [edition, setEdition] = useState(false)
  const [draft, setDraft] = useState<Capstone>(capstone?.contenu ?? videCarte)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const statut = capstone?.statut
  const contenu = capstone?.contenu ?? null

  async function regenerer(force = false): Promise<void> {
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

  // Clic sur un lien : ouvre l'autre extrémité (règle du handoff — `vers` si la
  // sélection est `de`, `de` si elle est `vers`, sinon `de`).
  function allerVersLien(l: LienResolu) {
    if (l.de == null || l.vers == null) return
    const cible = l.de === semaineSel ? l.vers : l.vers === semaineSel ? l.de : l.de
    router.push(`${hrefBase}&semaine=${cible}`, { scroll: false })
  }

  const chip = carteBloquee ? { texte: 'bloquée', cls: 'bg-retard-teinte text-retard' }
    : carteEnCours ? { texte: 'en cours…', cls: 'bg-attention-teinte text-attention' }
    : statut === 'ERROR' ? { texte: 'échec', cls: 'bg-retard-teinte text-retard' }
    : statut === 'READY' && capstone?.amende_par_prof ? { texte: 'amendée', cls: 'bg-info-teinte text-info' }
    : statut === 'READY' ? { texte: 'prête', cls: 'bg-ok-teinte text-ok' }
    : { texte: 'non générée', cls: 'bg-parchemin-fonce text-muet' }

  const prete = statut === 'READY' && contenu != null && !carteEnCours

  return (
    <div className="sticky top-24">
      <div className="bg-surface border border-bordure rounded-[10px] px-[17px] pt-[15px] pb-4">
        <div className="flex items-center gap-2">
          <span className="font-ui font-semibold text-sm text-encre">✦ Carte d’architecture</span>
          <span className={`${BADGE} ml-auto ${chip.cls}`}>{chip.texte}</span>
        </div>
        <p className="font-corps italic text-[13px] text-muet mt-[3px] mb-3">partagée aux élèves en fin de lecture</p>
        {msg && <p className="font-ui text-xs text-retard mb-2">{msg}</p>}

        {edition ? (
          <div className="space-y-3">
            <EditeurCarte draft={draft} setDraft={setDraft} />
            <div className="flex gap-2">
              <button type="button" onClick={enregistrer} disabled={busy} className={BTN_PRIMAIRE}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
              <button type="button" onClick={() => setEdition(false)} disabled={busy} className={BTN_DISCRET}>Annuler</button>
            </div>
          </div>
        ) : carteEnCours && !carteBloquee ? (
          <div>
            <p className="font-corps italic text-[14.5px] leading-[1.5] text-attention">La carte se prépare — génération en cours…</p>
            <div className="flex flex-col gap-1.5 mt-3">
              <div className="h-2 rounded bg-parchemin-fonce w-[92%]" />
              <div className="h-2 rounded bg-parchemin-fonce w-[78%]" />
              <div className="h-2 rounded bg-parchemin-fonce w-[85%]" />
            </div>
            <p className="font-corps italic text-xs text-muet-clair mt-2.5">la page se mettra à jour automatiquement</p>
          </div>
        ) : prete ? (
          <div>
            {contenu.fil_conducteur && (
              <>
                <div className={`${INTITULE_SM} text-muet-clair mb-[5px]`}>Fil conducteur</div>
                <p className="font-corps text-[14.5px] leading-[1.5] text-encre-douce whitespace-pre-wrap">{contenu.fil_conducteur}</p>
              </>
            )}
            {liens.length > 0 && (
              <>
                <div className="flex items-baseline gap-2 mt-3.5 mb-1.5">
                  <span className={`${INTITULE_SM} text-muet-clair`}>Liens entre semaines</span>
                  <span className="font-corps italic text-xs text-muet-clair">S{semaineSel} en évidence</span>
                </div>
                <div className="flex flex-col gap-0.5 -mx-1.5">
                  {liens.map((l, i) => {
                    const resolu = l.de != null && l.vers != null
                    if (!resolu) {
                      return (
                        <p key={i} className="px-[9px] py-1 font-ui text-[12.5px] leading-[1.4] text-muet">
                          {phraseDuLienCarte(l.brutDe, l.brutVers, l.relation)}
                        </p>
                      )
                    }
                    const touche = l.de === semaineSel || l.vers === semaineSel
                    return (
                      <button key={i} type="button" onClick={() => allerVersLien(l)}
                        className={`text-left px-[9px] py-1 rounded-md font-ui text-[12.5px] leading-[1.4] transition-colors ${
                          touche ? 'bg-pigment-teinte text-pigment' : 'text-encre-douce hover:bg-parchemin'
                        }`}>
                        {phraseDuLienCarte(l.de, l.vers, l.relation)}
                      </button>
                    )
                  })}
                </div>
                <p className="font-corps italic text-xs text-muet-clair mt-2">cliquer un lien ouvre la séance visée</p>
              </>
            )}
            <div className="flex gap-[7px] mt-3 flex-wrap">
              <button type="button" onClick={() => regenerer(false)} disabled={busy} className={BTN_SECONDAIRE_SM}>↻ Régénérer (IA)</button>
              <button type="button" onClick={() => { setDraft(contenu ?? videCarte); setMsg(null); setEdition(true) }} disabled={busy} className={BTN_SECONDAIRE_SM}>✎ Amender</button>
            </div>
          </div>
        ) : (
          <div>
            <p className="font-corps italic text-[14.5px] leading-[1.5] text-muet">
              {carteBloquee ? 'La génération semble bloquée — relance-la.'
                : statut === 'ERROR' ? 'La génération a échoué — relance-la.'
                : 'Pas encore de carte pour ce livre — génère-la pour donner aux élèves la vue d’ensemble en fin de lecture.'}
            </p>
            <div className="mt-3">
              <button type="button" onClick={() => regenerer(false)} disabled={busy} className={BTN_PRIMAIRE}>
                {carteBloquee ? '↻ Relancer la génération' : '↻ Générer la carte (IA)'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
