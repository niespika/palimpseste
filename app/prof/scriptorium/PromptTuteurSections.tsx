'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IDENTITE, REGISTRE, injecter } from '@/utils/ia-commun'
import {
  SECTIONS_PROMPT_TUTEUR, CLES_EDITABLES, MAX_CARACTERES_SECTION,
  assemblerPromptTuteur, defautSection, normaliserSection,
  type CleSectionEditable,
} from '@/utils/scriptorium-prompt-tuteur'
import { sauvegarderSectionsPromptTuteur } from './actions'

// Tuile « Prompt du tuteur » (C2 · L9) — patron des tuiles de paramètres
// Fragments (spec Lot 5 §5.6) : une tuile, clic → détail.
// Le prof voit le prompt COMPLET dans son ordre d'assemblage ; il édite trois
// sections (ton, relances, longueur) et rétablit leur défaut une par une. Les
// autres sont montrées en lecture seule, marquées « verrouillée » avec le motif :
// ce sont elles que le banc de calibration L8 valide, elles ne quittent jamais le
// code (utils/scriptorium-prompt-tuteur.ts porte le contrat de sécurité).

const TEXTAREA = 'w-full px-3 py-2 border border-bordure rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pigment resize-y text-encre'
const PRE = 'whitespace-pre-wrap font-mono text-xs text-encre-douce bg-parchemin-fonce border border-bordure rounded-xl px-3 py-2'

/** Date lisible (fuseau du navigateur — c'est un repère prof, pas une échéance). */
function dateLisible(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function PromptTuteurSections({ initial, modifieLeInitial, ancienPromptIntegral }: {
  initial: Record<CleSectionEditable, string | null>
  modifieLeInitial: string | null
  ancienPromptIntegral: boolean   // scriptorium_params.rag_prompt non vide (colonne dormante)
}) {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [apercu, setApercu] = useState(false)
  const [textes, setTextes] = useState<Record<CleSectionEditable, string>>({
    ton: initial.ton ?? defautSection('ton'),
    relances: initial.relances ?? defautSection('relances'),
    longueur: initial.longueur ?? defautSection('longueur'),
  })
  const [modifieLe, setModifieLe] = useState(modifieLeInitial)
  const [enregistrement, setEnregistrement] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; texte: string } | null>(null)

  const estModifiee = (cle: CleSectionEditable) => normaliserSection(cle, textes[cle]) !== null
  const nbModifiees = CLES_EDITABLES.filter(estModifiee).length
  const tropLongue = CLES_EDITABLES.find(c => textes[c].length > MAX_CARACTERES_SECTION)

  async function handleSauvegarder() {
    setEnregistrement(true)
    setMessage(null)
    const res = await sauvegarderSectionsPromptTuteur(textes)
    setEnregistrement(false)
    if (res.error) { setMessage({ type: 'err', texte: res.error }); return }
    setModifieLe(res.modifieLe ?? null)
    setMessage({
      type: 'ok',
      texte: res.modifieLe ? 'Sections enregistrées.' : 'Sections enregistrées — toutes revenues au défaut du code.',
    })
    setTimeout(() => setMessage(null), 4000)
    router.refresh()
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h3 className="font-titre text-lg text-encre">Prompt du tuteur (onglet Discussion)</h3>

      {/* Bandeau persistant : le prompt effectif diverge de celui calibré au banc L8. */}
      {modifieLe && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3 text-sm text-attention">
          <b>Sections modifiées le {dateLisible(modifieLe)}</b> — recommandé : rejouer le banc de
          calibration L8 (<code className="font-mono">npm run calibration:rag</code>) avant d’activer
          ou de laisser tourner l’espace élève. Les rapports existants décrivent le prompt d’avant.
        </div>
      )}

      {/* Tuile (patron Fragments §5.6) : clic → détail. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setOuvert(!ouvert)}
          className={`text-left rounded-xl px-4 py-3 transition-colors ${
            ouvert
              ? 'bg-pigment border border-pigment'
              : 'bg-surface border border-bordure border-l-4 border-l-liseret hover:border-pigment hover:shadow-sm'
          }`}
        >
          <p className={`font-medium ${ouvert ? 'text-surface' : 'text-encre'}`}>Prompt du tuteur</p>
          <p className={`text-xs mt-0.5 ${ouvert ? 'text-surface/75' : 'text-muet'}`}>
            {nbModifiees === 0
              ? 'Ton · relances · longueur — au défaut'
              : `${nbModifiees} section${nbModifiees > 1 ? 's' : ''} modifiée${nbModifiees > 1 ? 's' : ''} sur 3`}
          </p>
        </button>
      </div>

      {ouvert && (
        <div className="bg-surface border border-bordure rounded-xl p-5 space-y-5">
          <p className="text-sm text-encre-douce">
            Le prompt envoyé au tuteur est assemblé dans l’ordre ci-dessous : les sections{' '}
            <b>verrouillées</b> viennent du code (anti-spoiler, périmètre de la matière, citation des
            sources, refus — c’est ce que le banc L8 valide) et ne sont modifiables que par une
            évolution du code ; les sections <b>éditables</b> viennent d’ici, et retombent sur le
            défaut du code dès qu’on les vide. Le corpus de la classe (plan, matière, livres) est
            ajouté automatiquement <i>après</i> ces instructions.
          </p>

          {ancienPromptIntegral && (
            <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3 text-sm text-attention">
              Un ancien <b>prompt intégral</b> est encore stocké en base
              (<code className="font-mono">rag_prompt</code>, saisi avant cette refonte) : il n’est
              <b> plus utilisé</b> — le laisser actif permettrait d’écraser les sections verrouillées.
              La colonne est conservée telle quelle, à effacer à la main si son contenu ne sert plus.
            </div>
          )}

          <button type="button" onClick={() => setApercu(!apercu)}
            className="text-xs text-muet hover:text-encre-douce underline">
            {apercu ? 'Masquer l’aperçu du prompt complet' : 'Voir le prompt complet assemblé (avec le registre injecté)'}
          </button>
          {apercu && (
            <pre className={`${PRE} max-h-96 overflow-auto`}>
              {injecter(assemblerPromptTuteur(textes), { identite: IDENTITE, registre: REGISTRE })}
            </pre>
          )}

          {SECTIONS_PROMPT_TUTEUR.map(s => s.editable ? (
            <div key={s.cle}>
              <div className="flex items-center justify-between mb-1 gap-3">
                <label className="text-sm font-medium text-encre-douce">
                  {s.titre}
                  {estModifiee(s.cle) && (
                    <span className="ml-2 text-[11px] font-normal uppercase tracking-wide text-attention">modifiée</span>
                  )}
                </label>
                <button type="button" onClick={() => setTextes({ ...textes, [s.cle]: defautSection(s.cle) })}
                  className="text-xs text-muet hover:text-encre-douce underline shrink-0">
                  Rétablir le défaut
                </button>
              </div>
              <p className="text-xs text-muet mb-2">{s.resume} — {s.aide}</p>
              <textarea
                value={textes[s.cle]}
                onChange={e => setTextes({ ...textes, [s.cle]: e.target.value })}
                rows={s.cle === 'relances' ? 3 : 6}
                className={TEXTAREA}
              />
              {textes[s.cle].length > MAX_CARACTERES_SECTION && (
                <p className="text-xs text-retard mt-1">
                  {textes[s.cle].length.toLocaleString('fr-FR')} caractères — maximum{' '}
                  {MAX_CARACTERES_SECTION.toLocaleString('fr-FR')}.
                </p>
              )}
            </div>
          ) : (
            <div key={s.cle}>
              <div className="flex items-center justify-between mb-1 gap-3">
                <span className="text-sm font-medium text-muet">{s.titre}</span>
                <span className="text-[11px] uppercase tracking-wide text-muet shrink-0">🔒 verrouillée</span>
              </div>
              <p className="text-xs text-muet mb-2">{s.motif}</p>
              <pre className={PRE}>{s.defaut}</pre>
            </div>
          ))}

          <div>
            <p className="text-xs text-muet mb-2">
              Contenu de <code className="font-mono">{'{registre}'}</code> (défini dans le code, partagé
              avec les prompts Aletheia — le modifier ici est impossible, il vaut pour tous les modules) :
            </p>
            <pre className={PRE}>{REGISTRE}</pre>
          </div>

          {message && (
            <div className={`rounded-xl px-4 py-3 text-sm ${message.type === 'ok' ? 'bg-ok-teinte border border-ok text-ok' : 'bg-retard-teinte border border-retard text-retard'}`}>
              {message.texte}
            </div>
          )}

          <button onClick={handleSauvegarder} disabled={enregistrement || !!tropLongue}
            className="bg-bouton text-surface px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-colors">
            {enregistrement ? 'Enregistrement…' : 'Enregistrer les sections'}
          </button>
        </div>
      )}
    </div>
  )
}
