'use client'
// ============================================================================
// FRAGMENTS (élève) — LE RETOUR D'ORAL.
// ----------------------------------------------------------------------------
// Handoff `design_handoff_fragments_eleve` (E) : la même grammaire que le
// retour écrit — notes en grille, « en un mot » en encart, les sections, le
// lecteur audio, la transcription repliée. Client : l'URL signée de l'audio se
// demande au montage.
// ============================================================================

import { useState, useEffect } from 'react'
import { getSignedUrlAudioEleve } from '@/app/prof/fragments-erudition/actions'
import { noteVersLettre } from '@/utils/notation'
import type { FragmentOral, FragmentAnalyseOrale } from '@/types/fragments'

interface Props {
  oral: FragmentOral
  analyseOrale: FragmentAnalyseOrale
}

export default function AnalyseOralePubliee({ oral, analyseOrale }: Props) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!oral.storage_path || oral.audio_supprime) return
    getSignedUrlAudioEleve(oral.storage_path, oral.eleve_id).then(url => setAudioUrl(url))
  }, [oral.storage_path, oral.audio_supprime, oral.eleve_id])

  const sections = [
    { label: 'Prise en compte de tes retours écrits', contenu: analyseOrale.retour_integration },
    { label: 'Pistes mobilisées', contenu: analyseOrale.retour_pistes },
    { label: 'Complétude', contenu: analyseOrale.retour_completude },
    { label: 'Qualités orales', contenu: analyseOrale.retour_oral },
  ]

  return (
    <div className="space-y-4">
      {/* Notes — trois colonnes à toutes les tailles */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Contenu', note: analyseOrale.note_contenu },
          { label: 'Structure', note: analyseOrale.note_structure },
          { label: 'Expression', note: analyseOrale.note_expression },
        ].map(({ label, note }) => (
          <div key={label} className="bg-parchemin-fonce rounded-xl px-3 py-2.5 text-center">
            <p className="font-titre text-2xl font-semibold text-encre leading-none">{noteVersLettre(note) ?? '—'}</p>
            <p className="font-ui text-[11px] text-muet mt-1">{label}</p>
          </div>
        ))}
      </div>

      {oral.nb_mots && (
        <p className="font-ui text-xs text-muet">
          {oral.duree_secondes ? `${Math.floor(oral.duree_secondes / 60)} min ${oral.duree_secondes % 60} s` : ''}{' '}
          · {oral.nb_mots} mots · {oral.debit_mots_minute} mots/min
        </p>
      )}

      {analyseOrale.commentaire_general && (
        <div className="rounded-r-xl border-l-4 border-liseret bg-surface px-4 py-3">
          <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-pigment mb-1.5">★ En un mot</p>
          <p className="font-corps text-[15px] text-encre leading-relaxed whitespace-pre-wrap">{analyseOrale.commentaire_general}</p>
        </div>
      )}

      {analyseOrale.notes_prof && (
        <div className="bg-attention-teinte border border-attention rounded-xl px-4 py-3">
          <p className="font-ui text-xs text-attention font-medium mb-1">Ton professeur ajoute :</p>
          <p className="font-corps text-sm text-attention italic whitespace-pre-wrap">&laquo;&nbsp;{analyseOrale.notes_prof}&nbsp;&raquo;</p>
        </div>
      )}

      {sections.map(({ label, contenu }) =>
        contenu ? (
          <div key={label}>
            <p className="font-ui text-[11px] font-bold uppercase tracking-[0.11em] text-muet mb-1">{label}</p>
            <p className="font-corps text-sm text-encre-douce leading-relaxed whitespace-pre-wrap">{contenu}</p>
          </div>
        ) : null
      )}

      {!oral.audio_supprime && audioUrl && (
        <div>
          <p className="font-ui text-xs text-muet mb-1">Réécouter ta présentation</p>
          <audio controls src={audioUrl} className="w-full" />
        </div>
      )}

      {oral.transcription && (
        <details className="group rounded-xl border border-bordure bg-surface overflow-hidden">
          <summary className="flex min-h-[44px] cursor-pointer list-none items-center gap-3 px-4 py-2.5 group-open:border-b group-open:border-bordure">
            <span aria-hidden className="text-xs text-muet group-open:hidden">▸</span>
            <span aria-hidden className="hidden text-xs text-muet group-open:inline">▾</span>
            <span className="flex-1 font-ui text-sm font-medium text-encre-douce">Transcription</span>
            <span className="font-ui text-xs text-muet group-open:hidden">déplier</span>
            <span className="hidden font-ui text-xs text-muet group-open:inline">replier</span>
          </summary>
          <p className="px-4 py-3 text-xs text-muet leading-relaxed whitespace-pre-wrap">{oral.transcription}</p>
        </details>
      )}
    </div>
  )
}
