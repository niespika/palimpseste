'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Pastille from '@/components/Pastille'
import {
  actionConfirmerSignalement, actionEcarterSignalement, actionAcquitterSignalement,
  actionBloquerEleve, actionDebloquerEleve,
} from '@/app/prof/integrite/actions'
import type { SelectionVue } from './types'

// ════════════════════════════════════════════════════════════════════════════
// Panneau de PREUVE réutilisable : photo déposée + retranscription (passage
// problématique surligné) + motif + actions adaptées à la source. Rendu dans la
// page Intégrité (colonne droite), dans un volet (fiche élève) et une modale
// (dashboard) — d'où `onApresAction` (fermer le conteneur après une action).
// La logique métier vit dans app/prof/integrite/actions.ts (inchangée).
// ════════════════════════════════════════════════════════════════════════════

const HACHURE = {
  backgroundImage:
    'repeating-linear-gradient(45deg, var(--parchemin), var(--parchemin) 7px, var(--parchemin-fonce) 7px, var(--parchemin-fonce) 14px)',
}

// Construit une regex TOLÉRANTE aux accents et aux apostrophes : les motifs des
// strikes algo (aveu / section) citent la phrase NORMALISÉE (sans accents,
// apostrophes → espaces), alors que le texte affiché est brut. Chaque lettre
// devient une classe de ses variantes accentuées ; espace/apostrophe ↦ [\s'’]+.
// On surligne ainsi la sous-chaîne RÉELLE du texte (cf. detecteur-integrite.ts).
const VARIANTES: Record<string, string> = {
  a: 'aàâäáã', c: 'cç', e: 'eéèêë', i: 'iïîí', o: 'oôöó', u: 'uùûü', y: 'yÿ', n: 'nñ',
}
function patternTolerant(citation: string): string {
  let out = ''
  for (const ch of citation) {
    if (/[\s'’]/.test(ch)) { out += "[\\s'’]+"; continue }
    const base = ch.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    out += VARIANTES[base]
      ? `[${VARIANTES[base]}${VARIANTES[base].toUpperCase()}]`
      : ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  return out
}

// Découpe le texte et entoure d'un <mark> chaque sous-chaîne à surligner.
function TexteSurligne({ texte, surligner, source }: { texte: string; surligner: string[]; source: 'algo' | 'ia' }) {
  const patterns = surligner.map((s) => s.trim()).filter(Boolean).map(patternTolerant)
  if (patterns.length === 0) return <>{texte}</>
  const cls = source === 'ia' ? 'bg-attention-teinte text-attention' : 'bg-retard-teinte text-retard'
  let re: RegExp
  try { re = new RegExp(`(${patterns.join('|')})`, 'gi') } catch { return <>{texte}</> }
  // split avec un SEUL groupe capturant : les indices impairs sont les correspondances.
  const parts = texte.split(re)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <mark key={i} className={`${cls} rounded px-1`}>{p}</mark>
          : <span key={i}>{p}</span>,
      )}
    </>
  )
}

export default function PanneauPreuve({
  selection, onApresAction, variante = 'panneau',
}: {
  selection: SelectionVue
  onApresAction?: () => void
  variante?: 'panneau' | 'volet'
}) {
  const { signalement: s, preuve, strikesEleve, seuil, eleveBloque } = selection
  const [pending, startTransition] = useTransition()
  const [agrandie, setAgrandie] = useState<string | null>(null)
  const [idxPhoto, setIdxPhoto] = useState(0)

  // Lightbox : fermeture au clavier (Échap), aligné sur FeuillePanneau.
  useEffect(() => {
    if (!agrandie) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAgrandie(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [agrandie])

  const exec = (fn: () => Promise<unknown>) =>
    startTransition(async () => { await fn(); onApresAction?.() })

  const teinteSource = s.source === 'ia' ? 'bg-attention-teinte text-attention' : 'bg-retard-teinte text-retard'
  const bordMotif = s.source === 'ia' ? 'border-l-attention' : 'border-l-retard'
  const texteMotifLabel = s.source === 'ia' ? 'text-attention' : 'text-retard'
  const photoPrincipale = preuve.photos[idxPhoto] ?? preuve.photos[0] ?? null
  const compact = variante === 'volet'

  return (
    <div data-module={s.moduleSlug} className={`bg-surface ${compact ? '' : 'border border-bordure rounded-xl'} overflow-hidden flex flex-col`}>
      {/* 1 — têtière au pigment du module */}
      <div className="h-1.5 bg-pigment shrink-0" />

      {/* 2 — en-tête : pastille + nom + module·contexte / type + source·date */}
      <div className="bg-parchemin border-b border-bordure px-4 sm:px-5 py-3.5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Pastille module={s.moduleSlug} size={40} className="shrink-0" />
          <div className="min-w-0">
            <p className="font-titre text-xl text-encre leading-none truncate">{s.eleveNom}</p>
            <p className="font-ui text-xs text-muet mt-1 truncate">
              <span className="font-marque font-semibold tracking-wide text-pigment">{s.moduleLabel.toUpperCase()}</span>
              {preuve.contexte && <> · {preuve.contexte}</>}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className={`font-ui text-xs px-2.5 py-0.5 rounded-full ${teinteSource}`}>{s.typeLabel}</span>
          <p className="font-ui text-[11px] text-muet mt-1.5">
            {s.source === 'ia' ? 'détecté par l’IA' : 'détecté au rendu'} · {s.date}
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-4">
        {/* 3 — LA PREUVE */}
        <div>
          <p className="font-ui text-[11px] uppercase tracking-[0.08em] text-muet mb-2.5">La preuve</p>
          {!preuve.texte && preuve.photos.length === 0 && !preuve.saisieClavier ? (
            <p className="font-corps text-sm text-encre-douce bg-parchemin border border-bordure rounded-lg px-4 py-3">
              Rendu indisponible (supprimé ou re-déposé) — voir le motif ci-dessous.
            </p>
          ) : (
            <div className={`grid gap-3.5 ${preuve.saisieClavier || compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {/* Photo déposée — absente pour Aletheia (saisie clavier) */}
              {!preuve.saisieClavier && (
                <div>
                  <p className="font-ui text-[11px] text-encre-douce mb-1.5">Photo déposée</p>
                  {photoPrincipale ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setAgrandie(photoPrincipale)}
                        className="relative block w-full h-44 rounded-lg border border-bordure overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment"
                      >
                        <Image src={photoPrincipale} alt="Rendu déposé" fill className="object-cover" sizes="(max-width: 640px) 100vw, 300px" unoptimized />
                      </button>
                      <p className="font-ui text-[11px] text-muet mt-1.5">
                        {preuve.photos.length} photo{preuve.photos.length > 1 ? 's' : ''}
                        {preuve.meta.priseAt && <> · prise {new Date(preuve.meta.priseAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>}
                        {' · '}
                        <button type="button" onClick={() => setAgrandie(photoPrincipale)} className="underline text-encre hover:text-pigment">agrandir</button>
                      </p>
                      {preuve.photos.length > 1 && (
                        <div className="flex gap-1.5 mt-1.5">
                          {preuve.photos.map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setIdxPhoto(i)}
                              aria-label={`Photo ${i + 1}`}
                              className={`w-2 h-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pigment ${i === idxPhoto ? 'bg-pigment' : 'bg-bordure'}`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="relative h-44 rounded-lg border border-bordure overflow-hidden flex items-center justify-center" style={HACHURE}>
                      <span className="font-mono text-xs text-muet bg-surface border border-bordure rounded-md px-2.5 py-1">
                        {s.typeSlug === 'vide' ? 'page quasi blanche' : 'aucune photo déposée'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Retranscription */}
              <div>
                <p className="font-ui text-[11px] text-encre-douce mb-1.5">
                  {preuve.saisieClavier ? 'Texte saisi' : 'Retranscription'}
                </p>
                <div className={`rounded-lg border border-bordure bg-parchemin px-3.5 py-3 ${preuve.saisieClavier ? 'min-h-44' : 'h-44 overflow-y-auto'}`}>
                  {preuve.texte ? (
                    <>
                      <p className="font-corps text-[15px] text-encre-douce leading-relaxed whitespace-pre-line">
                        <TexteSurligne texte={preuve.texte} surligner={preuve.surligner} source={s.source} />
                      </p>
                      <p className="font-mono text-[11px] text-muet mt-3">— {preuve.meta.nbCaracteres} caractères utiles —</p>
                    </>
                  ) : (
                    <p className="font-ui text-xs text-muet italic">Aucun texte saisi.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4 — motif détecté */}
        {s.motif && (
          <div className={`bg-parchemin border border-bordure border-l-[3px] ${bordMotif} rounded-lg px-3.5 py-3`}>
            <p className={`font-ui text-[11px] tracking-[0.08em] ${texteMotifLabel}`}>
              <span aria-hidden>⚑</span> MOTIF DÉTECTÉ{s.source === 'ia' ? ' · IA' : ''}
            </p>
            <p className="font-corps text-[15px] text-encre-douce mt-1">
              {s.motif} <span className="text-muet">Type : <b className="text-encre-douce">{s.typeLabel}</b>.</span>
            </p>
          </div>
        )}

        {/* 5 — secondaire : historique strikes + lien analyse (discret) */}
        <div className="flex items-center justify-between gap-3 flex-wrap font-ui text-xs text-muet">
          <span className="inline-flex items-center gap-2">
            Historique
            <span className="inline-flex gap-1" aria-hidden>
              {Array.from({ length: seuil }).map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i < strikesEleve ? 'bg-retard' : 'border border-bordure'}`} />
              ))}
            </span>
            {strikesEleve} strike{strikesEleve > 1 ? 's' : ''} / seuil {seuil}
            {eleveBloque && <span className="text-retard"> · bloqué·e</span>}
          </span>
          {preuve.lienAnalyse && (
            <Link href={preuve.lienAnalyse} className="text-encre hover:text-pigment">Ouvrir l’analyse complète ↗</Link>
          )}
        </div>

        {/* 6 — barre d'actions adaptée à la source */}
        <div className="border-t border-dashed border-bordure pt-3.5 flex items-center gap-2.5 flex-wrap">
          {s.source === 'ia' && s.enAttente ? (
            <>
              <button
                type="button" disabled={pending}
                onClick={() => exec(() => actionConfirmerSignalement(s.id))}
                className="font-ui text-sm font-medium px-4 py-2 rounded-lg bg-attention-teinte text-attention hover:opacity-85 disabled:opacity-50"
              >
                Confirmer (+1 strike)
              </button>
              <button
                type="button" disabled={pending}
                onClick={() => exec(() => actionEcarterSignalement(s.id))}
                className="font-ui text-sm px-4 py-2 rounded-lg text-muet hover:text-encre disabled:opacity-50"
              >
                Écarter
              </button>
            </>
          ) : (
            <button
              type="button" disabled={pending}
              onClick={() => exec(() => actionAcquitterSignalement(s.id))}
              className="font-ui text-sm font-medium px-4 py-2 rounded-lg bg-bouton text-surface hover:opacity-90 disabled:opacity-50"
            >
              Vu
            </button>
          )}

          {eleveBloque ? (
            <button
              type="button" disabled={pending}
              onClick={() => exec(() => actionDebloquerEleve(s.eleveId))}
              className="font-ui text-sm font-medium ml-auto px-4 py-2 rounded-lg bg-ok-teinte text-ok hover:opacity-85 disabled:opacity-50"
            >
              Débloquer (−1 strike)
            </button>
          ) : (
            <button
              type="button" disabled={pending}
              onClick={() => exec(() => actionBloquerEleve(s.eleveId))}
              className="font-ui text-sm ml-auto px-4 py-2 rounded-lg border border-retard text-retard bg-surface hover:bg-retard-teinte disabled:opacity-50"
            >
              Bloquer l’élève
            </button>
          )}
        </div>
      </div>

      {/* Agrandissement photo (lightbox léger) */}
      {agrandie && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-encre/70 p-4"
          role="dialog" aria-modal="true" aria-label="Photo agrandie"
          onClick={() => setAgrandie(null)}
        >
          <button
            type="button" autoFocus aria-label="Fermer"
            onClick={() => setAgrandie(null)}
            className="absolute top-4 right-4 text-surface text-2xl leading-none p-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface"
          >
            ✕
          </button>
          <Image
            src={agrandie} alt="Rendu déposé" width={1200} height={1600}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-auto h-auto object-contain rounded-lg" unoptimized
          />
        </div>
      )}
    </div>
  )
}
