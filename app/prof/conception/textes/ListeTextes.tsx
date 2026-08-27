'use client'

// ============================================================================
// C5 · L1 — LA LISTE DES TEXTES, et le geste qui les décompose.
// ----------------------------------------------------------------------------
// ⚠️ LES DEUX MOTIFS DE REFUS NE SE FONDENT PAS EN UN SEUL. « Aucune référence
//    déposée » et « une référence déposée mais NON VALIDÉE » n'appellent pas le
//    même geste du professeur : L'UNE SE DÉCOMPOSE, L'AUTRE SE RELIT (`02-` §6 A ;
//    `utils/reference-validee.ts`). La liste les distingue donc à l'œil, et le
//    bouton n'est pas le même.
//
// ⚠️ « UNE SEULE DÉCOMPOSITION PAR TEXTE, SANS VERSIONS » (`05-` §4.5) : le
//    bouton « Décomposer » disparaît dès qu'une référence existe. Recommencer
//    passe par une dévalidation explicite, à l'écran de la référence.
// ============================================================================

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { decomposerTexte } from './actions'
import type { LigneTexte, RetourTexte } from './types'

const ETAT: Record<LigneTexte['etatReference'], { mot: string; ton: string; suite: string }> = {
  aucune: { mot: 'aucune référence', ton: 'text-attention',
    suite: 'elle se décompose — trois appels de modèle, puis le contrôle machine' },
  deposee: { mot: 'référence déposée, NON VALIDÉE', ton: 'text-attention',
    suite: 'elle se relit et se valide — une référence non validée n’entre jamais en Phase 2' },
  validee: { mot: 'référence validée', ton: 'text-ok',
    suite: 'les exercices bâtis sur ce texte s’en servent' },
}

export default function ListeTextes({ textes }: { textes: LigneTexte[] }) {
  const [retour, action, enCours] = useActionState<RetourTexte | null, FormData>(
    decomposerTexte, null)
  const [enChantier, setEnChantier] = useState<string | null>(null)

  return (
    <section className="rounded-xl border border-bordure bg-surface p-4 space-y-3">
      <h2 className="font-titre text-lg text-encre">Les textes de la fabrique ({textes.length})</h2>

      {textes.length === 0 ? (
        <p className="font-ui text-sm text-muet">
          Aucun texte n&apos;a encore d&apos;identité de fabrique. Déposez-en un ci-dessous, ou
          adoptez-en un du Scriptorium.
        </p>
      ) : (
        <ul className="divide-y divide-bordure font-ui text-sm">
          {textes.map((t) => {
            const e = ETAT[t.etatReference]
            return (
              <li key={t.id} className="space-y-1 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-encre">
                    <strong>{t.libelle}</strong>
                    {t.reference && <span className="text-muet"> · {t.reference}</span>}
                  </span>
                  <span className={e.ton}>{e.mot}</span>
                </div>
                <p className="text-xs text-muet">
                  {t.phrasesDuTexte} phrase(s) · {t.motsDuTexte} mot(s) ·{' '}
                  <code>{t.idImport}</code> · {t.statut}
                  {t.bloque && <span className="text-attention"> · bloqué en file</span>}
                </p>
                <p className="text-xs text-encre-douce">{t.borne}</p>
                <p className="text-xs text-muet">{e.suite}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {t.etatReference === 'aucune' ? (
                    <form action={action} onSubmit={() => setEnChantier(t.id)}>
                      <input type="hidden" name="texte_id" value={t.id} />
                      <button type="submit" disabled={enCours}
                        className="rounded-md bg-bouton px-3 py-1 text-surface disabled:opacity-50">
                        {enCours && enChantier === t.id
                          ? 'G1, puis G2, puis G3…' : 'Décomposer ce texte'}
                      </button>
                    </form>
                  ) : (
                    <Link href={`/prof/conception/reference/${t.referenceId}`}
                      className="rounded-md bg-bouton px-3 py-1 text-surface">
                      {t.etatReference === 'deposee' ? 'lire et valider' : 'relire la référence'}
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {retour && (
        <div role="status" className={`rounded-lg border px-3 py-2 space-y-1 ${
          retour.ok ? 'border-ok bg-ok-teinte' : 'border-retard bg-retard-teinte'}`}>
          <p className="font-ui text-sm text-encre">{retour.message}</p>
          {(retour.empechements ?? []).map((x, i) => (
            <p key={i} className="font-ui text-xs text-encre">⊘ {x}</p>
          ))}
          {(retour.notes ?? []).map((x, i) => (
            <p key={i} className="font-ui text-xs text-encre-douce">· {x}</p>
          ))}
          {retour.referenceId && (
            <Link href={`/prof/conception/reference/${retour.referenceId}`}
              className="font-ui text-sm text-encre underline">
              lire la référence et la valider →
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
