'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import FeuillePanneau from '@/components/pilotage/FeuillePanneau'
import PanneauPreuve from '@/components/integrite/PanneauPreuve'
import type { DossierVue, SelectionVue, SignalementVue, EvenementVue } from '@/components/integrite/types'
import { actionDebloquerEleve, chargerPreuveAvisAction } from '@/app/prof/integrite/actions'

// ════════════════════════════════════════════════════════════════════════════
// Dossier intégrité d'un élève (PARTAGÉ) : compteurs (avis retenus / écartés /
// déblocages), chronologie des événements (strike / blocage / déblocage), et la
// liste de TOUS ses avis — chacun ouvrant la PREUVE existante (PanneauPreuve en
// volet). Utilisé inline dans la fiche élève (/prof/eleves/[id]) ET dans le détail
// du tableau « Historique » (/prof/integrite?vue=historique&eleve=…).
// ════════════════════════════════════════════════════════════════════════════

// Badge de statut d'un avis.
function badgeStatut(statut?: string): { label: string; cls: string } {
  if (statut === 'en_attente') return { label: 'en attente', cls: 'bg-attention-teinte text-attention' }
  if (statut === 'rejete') return { label: 'écarté', cls: 'bg-parchemin-fonce text-muet' }
  return { label: 'retenu', cls: 'bg-retard-teinte text-retard' }
}

// Phrase lisible d'un événement de la chronologie (vue prof).
function phraseEvenement(e: EvenementVue): string {
  const mod = e.moduleLabel ? ` · ${e.moduleLabel}` : ''
  if (e.type === 'blocage') {
    return e.source === 'manuel' ? 'Bloqué·e manuellement par le prof' : 'Mise en pause automatique (seuil atteint)'
  }
  if (e.type === 'deblocage') return 'Débloqué·e par le prof (−1 strike)'
  const via = e.source === 'ia' ? 'IA confirmée' : 'détecté au rendu'
  return `Strike retenu (${via})${mod}`
}

function pastilleEvenement(type: EvenementVue['type']): string {
  if (type === 'blocage') return 'bg-retard'
  if (type === 'deblocage') return 'bg-ok'
  return 'bg-attention'
}

export default function DossierIntegriteEleve({ dossier, avecTitre = false }: { dossier: DossierVue; avecTitre?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [ouvert, setOuvert] = useState<SelectionVue | null>(null)
  const [chargementId, setChargementId] = useState<string | null>(null)
  const fermer = () => { setOuvert(null); router.refresh() }

  const { eleveId, nom, strikes, seuil, bloque, confirmes, ecartes, deblocages, avis, evenements } = dossier

  // Preuve chargée à la demande au clic (évite un N+1 au rendu du dossier).
  async function ouvrir(s: SignalementVue) {
    setChargementId(s.id)
    try {
      const sel = await chargerPreuveAvisAction(s.id)
      if (sel) setOuvert(sel)
    } finally {
      setChargementId(null)
    }
  }

  return (
    <div className="bg-surface border border-bordure border-l-4 border-l-retard rounded-xl px-4 py-3.5">
      {/* En-tête : libellé/nom + statut */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-ui text-[11px] font-medium uppercase tracking-[0.12em] text-retard">
          {avecTitre ? nom : 'Intégrité — petits malins'}
        </span>
        <span className="font-ui text-xs text-muet">
          {strikes} / {seuil} strike{seuil > 1 ? 's' : ''}{bloque && <span className="text-retard"> · bloqué·e</span>}
        </span>
      </div>

      {/* Compteurs (3 colonnes bien identifiées) */}
      <div className="flex mt-3">
        <div className="flex-1 text-center">
          <div className="font-titre text-xl leading-none text-retard">{confirmes}</div>
          <div className="font-ui text-[10px] text-muet mt-1">avis retenus</div>
        </div>
        <div className="w-px bg-bordure" />
        <div className="flex-1 text-center">
          <div className="font-titre text-xl leading-none text-encre-douce">{ecartes}</div>
          <div className="font-ui text-[10px] text-muet mt-1">écartés</div>
        </div>
        <div className="w-px bg-bordure" />
        <div className="flex-1 text-center">
          <div className="font-titre text-xl leading-none text-encre-douce">{deblocages}</div>
          <div className="font-ui text-[10px] text-muet mt-1">déblocages</div>
        </div>
      </div>

      {/* Chronologie */}
      {evenements.length > 0 && (
        <div className="mt-3.5 pt-3 border-t border-dashed border-bordure">
          <p className="font-ui text-[11px] uppercase tracking-[0.08em] text-muet mb-2">Chronologie</p>
          <ul className="space-y-1.5">
            {evenements.map((e) => (
              <li key={e.id} className="flex items-center gap-2 font-ui text-[12px] text-encre-douce">
                <span className={`w-2 h-2 rounded-full shrink-0 ${pastilleEvenement(e.type)}`} aria-hidden />
                <span className="min-w-0 truncate">{phraseEvenement(e)}</span>
                <span className="text-muet ml-auto shrink-0">{e.dateCourt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste des avis (consultables) */}
      <div className="mt-3.5 pt-3 border-t border-dashed border-bordure">
        <p className="font-ui text-[11px] uppercase tracking-[0.08em] text-muet mb-2">
          Avis ({avis.length})
        </p>
        {avis.length > 0 ? (
          <ul className="space-y-1.5">
            {avis.map((s) => {
              const b = badgeStatut(s.statut)
              const enChargement = chargementId === s.id
              return (
                <li key={s.id} data-module={s.moduleSlug}>
                  <button
                    type="button"
                    onClick={() => ouvrir(s)}
                    disabled={chargementId !== null}
                    className="w-full flex items-center gap-2 text-left rounded-lg border border-bordure bg-surface px-3 py-2 hover:bg-parchemin-fonce transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment disabled:opacity-60"
                  >
                    <span className="inline-flex items-center gap-1.5 font-marque text-[10px] font-semibold tracking-[0.06em] text-pigment shrink-0">
                      <span className="w-2 h-2 rounded-full bg-pigment" aria-hidden />
                      {s.moduleLabel.toUpperCase()}
                    </span>
                    <span className="font-ui text-[11px] text-encre-douce truncate">{s.typeLabel}</span>
                    <span className={`font-ui text-[11px] px-2 py-0.5 rounded-full shrink-0 ${b.cls}`}>{b.label}</span>
                    <span className="font-ui text-[11px] text-muet ml-auto shrink-0">{s.dateCourt}</span>
                    <span className="font-ui text-muet shrink-0" aria-hidden>{enChargement ? '…' : '›'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="font-ui text-sm text-muet">Aucun avis.</p>
        )}
      </div>

      {bloque && (
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await actionDebloquerEleve(eleveId); router.refresh() })}
          className="mt-3 font-ui text-sm font-medium px-3 py-1.5 rounded-lg bg-ok-teinte text-ok hover:opacity-85 disabled:opacity-50"
        >
          Débloquer (−1 strike)
        </button>
      )}

      {ouvert && (
        <FeuillePanneau titre="Preuve" sousTitre={ouvert.signalement.moduleLabel} onFermer={() => setOuvert(null)}>
          <PanneauPreuve key={ouvert.signalement.id} selection={ouvert} variante="volet" onApresAction={fermer} />
        </FeuillePanneau>
      )}
    </div>
  )
}
