'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import FeuillePanneau from '@/components/pilotage/FeuillePanneau'
import PanneauPreuve from '@/components/integrite/PanneauPreuve'
import type { SignalementVue, BloqueVue, ParamsVue, SelectionVue } from '@/components/integrite/types'
import { actionDebloquerEleve, sauvegarderParamsIntegrite } from './actions'

const champ = 'w-full px-3 py-2 border border-bordure rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pigment text-encre'

export default function GestionIntegrite({
  bloques, signalements, selection, selExplicit, params,
}: {
  bloques: BloqueVue[]
  signalements: SignalementVue[]
  selection: SelectionVue | null
  selExplicit: boolean
  params: ParamsVue
}) {
  const [pending, startTransition] = useTransition()
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const exec = (fn: () => Promise<unknown>) => startTransition(() => { void fn() })
  const selId = selection?.signalement.id ?? null

  return (
    <div className="space-y-4 pb-10">
      {/* En-tête */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-titre text-2xl text-encre leading-tight">Intégrité — petits malins</h2>
          <p className="font-ui text-xs text-muet mt-1 max-w-2xl">
            Rendus vides, aveux &amp; hors-sujet repérés dans Aletheia · Codex · Fragments.
            À <span className="text-encre">{params.seuil} strikes</span>, rendus &amp; révision gelés (le quizz reste ouvert).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReglagesOuverts(true)}
          className="font-ui text-sm text-encre border border-bordure rounded-lg px-3 py-1.5 bg-surface hover:bg-parchemin-fonce transition-colors shrink-0"
        >
          ⚙ Paramètres
        </button>
      </div>

      {params.actif === false && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-5 py-3 font-ui text-sm text-attention">
          Détection désactivée : aucun élève n’est bloqué pour l’instant, même ceux listés ci-dessous.
          Réactive-la dans les paramètres pour que les blocages reprennent effet.
        </div>
      )}

      {/* Atelier file + preuve */}
      <div className="lg:grid lg:grid-cols-[340px_1fr] lg:gap-4 lg:items-start">
        {/* ── Colonne gauche : la file ─────────────────────────────────────── */}
        <div className={`${selExplicit ? 'hidden lg:flex' : 'flex'} flex-col bg-surface border border-bordure rounded-xl overflow-hidden lg:max-h-[calc(100vh-12rem)]`}>
          <div className="overflow-y-auto">
            {/* À TRAITER */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
              <span className="font-ui text-[11px] uppercase tracking-[0.07em] text-muet">À traiter</span>
              <span className="font-ui text-[11px] text-retard">{signalements.length}</span>
            </div>
            {signalements.length === 0 ? (
              <p className="px-4 pb-3 font-ui text-sm text-muet">Rien à traiter. 🎉</p>
            ) : (
              <ul className="px-2.5 pb-1 space-y-2">
                {signalements.map((s) => (
                  <LigneSignalement key={s.id} s={s} actif={s.id === selId} />
                ))}
              </ul>
            )}

            {/* BLOQUÉS */}
            {bloques.length > 0 && (
              <>
                <div className="flex items-center justify-between px-4 pt-3 pb-2 border-t border-bordure mt-1">
                  <span className="font-ui text-[11px] uppercase tracking-[0.07em] text-muet">Bloqués</span>
                  <span className="font-ui text-[11px] text-retard">{bloques.length}</span>
                </div>
                <ul className="px-2.5 pb-3 space-y-2">
                  {bloques.map((b) => (
                    <li key={b.eleveId} className="bg-surface border border-bordure rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-corps text-[15px] text-encre truncate">{b.nom}</p>
                        <p className="font-ui text-[11px] text-retard">{b.strikes} strike{b.strikes > 1 ? 's' : ''} · bloqué·e</p>
                      </div>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => exec(() => actionDebloquerEleve(b.eleveId))}
                        className="font-ui text-xs text-ok bg-ok-teinte border border-ok/30 rounded-lg px-2.5 py-1.5 hover:opacity-85 disabled:opacity-50 whitespace-nowrap shrink-0"
                      >
                        Débloquer
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* ── Colonne droite : la preuve ───────────────────────────────────── */}
        <div className={`${selExplicit ? 'block' : 'hidden lg:block'} mt-4 lg:mt-0`}>
          {/* Retour mobile vers la file */}
          {selection && (
            <Link href="/prof/integrite" scroll={false} className="lg:hidden inline-flex items-center font-ui text-sm text-muet hover:text-encre-douce mb-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment">
              ← Intégrité
            </Link>
          )}
          {selection ? (
            <PanneauPreuve key={selection.signalement.id} selection={selection} />
          ) : (
            <div className="bg-surface border border-bordure rounded-xl px-6 py-12 text-center">
              <p className="font-titre text-xl text-encre">Aucun signalement à traiter</p>
              <p className="font-ui text-sm text-muet mt-1.5">
                {bloques.length > 0
                  ? 'Des élèves restent bloqués (colonne de gauche) — débloque-les quand c’est réglé.'
                  : 'Tout est en ordre. Les nouveaux rendus vides, aveux ou hors-sujet apparaîtront ici.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="font-ui text-xs text-muet max-w-2xl">
        Un strike « détecté au rendu » (rendu vide / aveu) est déjà comptabilisé : « Vu » retire simplement l’alerte.
        Un signal « détecté par l’IA » (hors-sujet / bâclé) ne compte que si tu le confirmes.
      </p>

      {reglagesOuverts && (
        <FeuillePanneau titre="Paramètres" sousTitre="Détection « petits malins »" onFermer={() => setReglagesOuverts(false)}>
          <Parametres params={params} onFini={() => setReglagesOuverts(false)} />
        </FeuillePanneau>
      )}
    </div>
  )
}

// ── Ligne-carte d'un signalement (sélection via ?sel=, transition client) ──────
function LigneSignalement({ s, actif }: { s: SignalementVue; actif: boolean }) {
  const teinte = s.source === 'ia' ? 'bg-attention-teinte text-attention' : 'bg-retard-teinte text-retard'
  return (
    <li data-module={s.moduleSlug}>
      <Link
        href={`/prof/integrite?sel=${s.id}`}
        scroll={false}
        aria-current={actif ? 'true' : undefined}
        className={`block rounded-lg px-3 py-2.5 border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${
          actif ? 'bg-surface border-bordure border-l-4 border-l-pigment shadow-sm' : 'bg-surface border-bordure hover:bg-parchemin-fonce'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-corps text-[15px] text-encre truncate">{s.eleveNom}</span>
          <span className="font-ui text-[11px] text-muet shrink-0">{s.dateCourt}</span>
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-marque text-[10px] font-semibold tracking-[0.06em] text-pigment">
            <span className="w-2 h-2 rounded-full bg-pigment" aria-hidden />
            {s.moduleLabel.toUpperCase()}
          </span>
          <span className={`font-ui text-[11px] px-2 py-0.5 rounded-full ${teinte}`}>{s.typeLabel}</span>
        </div>
        <p className={`font-ui text-[11px] mt-1.5 ${s.source === 'ia' ? 'text-attention' : 'text-muet'}`}>
          {s.source === 'ia' ? 'détecté par l’IA · à confirmer' : 'détecté au rendu · strike déjà compté'}
        </p>
      </Link>
    </li>
  )
}

// ── Formulaire de paramètres (inchangé sur le fond ; rendu dans le volet) ──────
function Parametres({ params, onFini }: { params: ParamsVue; onFini: () => void }) {
  const [pending, startTransition] = useTransition()
  const [actif, setActif] = useState(params.actif)
  const [seuil, setSeuil] = useState(params.seuil)
  const [messageStrike, setMessageStrike] = useState(params.messageStrike)
  const [messageBloque, setMessageBloque] = useState(params.messageBloque)
  const [sauve, setSauve] = useState(false)

  function enregistrer() {
    setSauve(false)
    startTransition(async () => {
      await sauvegarderParamsIntegrite({ actif, seuil, messageStrike, messageBloque })
      setSauve(true)
    })
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 font-ui text-sm text-encre">
        <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
        Détection « petits malins » active
      </label>

      <div>
        <label className="block font-ui text-sm font-medium text-encre-douce mb-1">Seuil de blocage (nombre de strikes)</label>
        <input
          type="number" min={1} max={20} value={seuil}
          onChange={(e) => setSeuil(Number(e.target.value))}
          className={`${champ} w-24`}
        />
        <p className="font-ui text-xs text-muet mt-1">L’élève est bloqué à ce nombre de strikes. Le débloquer en retire 1.</p>
      </div>

      <div>
        <label className="block font-ui text-sm font-medium text-encre-douce mb-1">Message à l’élève (à chaque strike)</label>
        <textarea value={messageStrike} onChange={(e) => setMessageStrike(e.target.value)} rows={3} className={`${champ} resize-y`} />
      </div>

      <div>
        <label className="block font-ui text-sm font-medium text-encre-douce mb-1">Message à l’élève (une fois bloqué)</label>
        <textarea value={messageBloque} onChange={(e) => setMessageBloque(e.target.value)} rows={3} className={`${champ} resize-y`} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={enregistrer}
          className="font-ui text-sm font-medium px-4 py-2 rounded-lg bg-bouton text-surface hover:opacity-90 disabled:opacity-50"
        >
          Enregistrer
        </button>
        {sauve && <button type="button" onClick={onFini} className="font-ui text-sm text-ok">Enregistré ✓ — fermer</button>}
      </div>
    </div>
  )
}
